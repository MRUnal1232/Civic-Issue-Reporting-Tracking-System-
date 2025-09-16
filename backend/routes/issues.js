const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Issue = require('../models/Issue');
const User = require('../models/User');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const issueClassifier = require('../utils/mlClassifier');

const router = express.Router();

// @route   GET /api/issues
// @desc    Get all issues with filtering and pagination
// @access  Public (with optional auth for user-specific data)
router.get('/', [
  optionalAuth,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('status').optional().isIn(['Submitted', 'Under Review', 'In Progress', 'Resolved', 'Closed', 'Rejected']),
  query('category').optional().isString(),
  query('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
  query('sortBy').optional().isIn(['createdAt', 'upvoteCount', 'priority', 'status']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('search').optional().isString(),
  query('nearby').optional().isString().withMessage('Nearby must be in format "lat,lng,radius"')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 10,
      status,
      category,
      priority,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      nearby
    } = req.query;

    // Build filter object
    const filter = { isPublic: true };

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    // Nearby search
    if (nearby) {
      const [lat, lng, radius] = nearby.split(',').map(Number);
      if (lat && lng && radius) {
        filter['location.coordinates'] = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            $maxDistance: radius * 1000 // Convert km to meters
          }
        };
      }
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const issues = await Issue.find(filter)
      .populate('reporter', 'name email avatar')
      .populate('comments.user', 'name avatar')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await Issue.countDocuments(filter);

    // Add user-specific data if authenticated
    if (req.user) {
      for (let issue of issues) {
        issue.hasUpvoted = issue.upvotes.some(upvote => 
          upvote.user.toString() === req.user._id.toString()
        );
      }
    }

    res.json({
      issues,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get issues error:', error);
    res.status(500).json({
      message: 'Failed to fetch issues',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/issues/:id
// @desc    Get specific issue by ID
// @access  Public (with optional auth for user-specific data)
router.get('/:id', [optionalAuth], async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('reporter', 'name email avatar')
      .populate('comments.user', 'name avatar')
      .populate('assignedTo.assignedBy', 'name email')
      .lean();

    if (!issue) {
      return res.status(404).json({
        message: 'Issue not found'
      });
    }

    // Add user-specific data if authenticated
    if (req.user) {
      issue.hasUpvoted = issue.upvotes.some(upvote => 
        upvote.user.toString() === req.user._id.toString()
      );
    }

    res.json({ issue });
  } catch (error) {
    console.error('Get issue error:', error);
    res.status(500).json({
      message: 'Failed to fetch issue',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/issues
// @desc    Create a new issue
// @access  Private
router.post('/', [
  authenticateToken,
  upload.array('images', 5),
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('category')
    .isIn([
      'Roads & Infrastructure',
      'Water & Sanitation',
      'Electricity',
      'Waste Management',
      'Public Safety',
      'Environment',
      'Healthcare',
      'Education',
      'Transportation',
      'Other'
    ])
    .withMessage('Invalid category'),
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Critical'])
    .withMessage('Invalid priority'),
  body('location.address')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters'),
  body('location.coordinates')
    .isArray({ min: 2, max: 2 })
    .withMessage('Coordinates must be an array of [longitude, latitude]'),
  body('location.coordinates.*')
    .isNumeric()
    .withMessage('Coordinates must be numbers'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('isUrgent')
    .optional()
    .isBoolean()
    .withMessage('isUrgent must be a boolean')
], handleUploadError, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      title,
      description,
      category,
      priority = 'Medium',
      location,
      tags = [],
      isUrgent = false
    } = req.body;

    // Process uploaded images
    const images = [];
    if (req.files && req.files.length > 0) {
      for (let file of req.files) {
        images.push({
          url: file.path,
          publicId: file.filename
        });
      }
    }

    // Create new issue
    const issue = new Issue({
      title,
      description,
      category,
      priority,
      reporter: req.user._id,
      location: {
        address: location.address,
        coordinates: {
          type: 'Point',
          coordinates: location.coordinates
        },
        city: location.city,
        state: location.state,
        zipCode: location.zipCode
      },
      images,
      tags,
      isUrgent
    });

    await issue.save();

    // Populate reporter information
    await issue.populate('reporter', 'name email avatar');

    res.status(201).json({
      message: 'Issue created successfully',
      issue
    });
  } catch (error) {
    console.error('Create issue error:', error);
    
    // Clean up uploaded images if issue creation fails
    if (req.files && req.files.length > 0) {
      const { deleteImages } = require('../middleware/upload');
      const images = req.files.map(file => ({
        publicId: file.filename
      }));
      await deleteImages(images);
    }

    res.status(500).json({
      message: 'Failed to create issue',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/issues/:id
// @desc    Update an issue
// @access  Private (only reporter or admin)
router.put('/:id', [
  authenticateToken,
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('category')
    .optional()
    .isIn([
      'Roads & Infrastructure',
      'Water & Sanitation',
      'Electricity',
      'Waste Management',
      'Public Safety',
      'Environment',
      'Healthcare',
      'Education',
      'Transportation',
      'Other'
    ])
    .withMessage('Invalid category'),
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Critical'])
    .withMessage('Invalid priority'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({
        message: 'Issue not found'
      });
    }

    // Check if user can update this issue
    if (req.user.role !== 'admin' && 
        issue.reporter.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Not authorized to update this issue'
      });
    }

    // Check if issue can be updated (not resolved or closed)
    if (['Resolved', 'Closed'].includes(issue.status)) {
      return res.status(400).json({
        message: 'Cannot update resolved or closed issues'
      });
    }

    const updateData = {};
    const { title, description, category, priority, tags } = req.body;

    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (category) updateData.category = category;
    if (priority) updateData.priority = priority;
    if (tags) updateData.tags = tags;

    const updatedIssue = await Issue.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('reporter', 'name email avatar');

    res.json({
      message: 'Issue updated successfully',
      issue: updatedIssue
    });
  } catch (error) {
    console.error('Update issue error:', error);
    res.status(500).json({
      message: 'Failed to update issue',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   DELETE /api/issues/:id
// @desc    Delete an issue
// @access  Private (only reporter or admin)
router.delete('/:id', [authenticateToken], async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({
        message: 'Issue not found'
      });
    }

    // Check if user can delete this issue
    if (req.user.role !== 'admin' && 
        issue.reporter.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Not authorized to delete this issue'
      });
    }

    // Delete images from Cloudinary
    if (issue.images && issue.images.length > 0) {
      const { deleteImages } = require('../middleware/upload');
      await deleteImages(issue.images);
    }

    await Issue.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Issue deleted successfully'
    });
  } catch (error) {
    console.error('Delete issue error:', error);
    res.status(500).json({
      message: 'Failed to delete issue',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/issues/:id/upvote
// @desc    Upvote an issue
// @access  Private
router.post('/:id/upvote', [authenticateToken], async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({
        message: 'Issue not found'
      });
    }

    // Check if user already upvoted
    const hasUpvoted = issue.upvotes.some(upvote => 
      upvote.user.toString() === req.user._id.toString()
    );

    if (hasUpvoted) {
      return res.status(400).json({
        message: 'You have already upvoted this issue'
      });
    }

    await issue.addUpvote(req.user._id);

    res.json({
      message: 'Issue upvoted successfully',
      upvoteCount: issue.upvotes.length
    });
  } catch (error) {
    console.error('Upvote issue error:', error);
    res.status(500).json({
      message: 'Failed to upvote issue',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   DELETE /api/issues/:id/upvote
// @desc    Remove upvote from an issue
// @access  Private
router.delete('/:id/upvote', [authenticateToken], async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({
        message: 'Issue not found'
      });
    }

    await issue.removeUpvote(req.user._id);

    res.json({
      message: 'Upvote removed successfully',
      upvoteCount: issue.upvotes.length
    });
  } catch (error) {
    console.error('Remove upvote error:', error);
    res.status(500).json({
      message: 'Failed to remove upvote',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/issues/:id/comments
// @desc    Add comment to an issue
// @access  Private
router.post('/:id/comments', [
  authenticateToken,
  body('content')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment must be between 1 and 500 characters')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({
        message: 'Issue not found'
      });
    }

    const { content } = req.body;

    await issue.addComment(req.user._id, content);

    // Populate the new comment
    await issue.populate('comments.user', 'name avatar');

    const newComment = issue.comments[issue.comments.length - 1];

    res.status(201).json({
      message: 'Comment added successfully',
      comment: newComment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      message: 'Failed to add comment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/issues/user/:userId
// @desc    Get issues reported by a specific user
// @access  Public
router.get('/user/:userId', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { page = 1, limit = 10 } = req.query;

    const filter = { 
      reporter: req.params.userId,
      isPublic: true 
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const issues = await Issue.find(filter)
      .populate('reporter', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Issue.countDocuments(filter);

    res.json({
      issues,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get user issues error:', error);
    res.status(500).json({
      message: 'Failed to fetch user issues',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/issues/classify
// @desc    Classify issue category using ML
// @access  Private
router.post('/classify', [
  authenticateToken,
  upload.single('image'),
  body('description')
    .optional()
    .isString()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters')
], handleUploadError, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { description = '' } = req.body;
    const imageBuffer = req.file ? req.file.buffer : null;

    if (!imageBuffer && !description) {
      return res.status(400).json({
        message: 'Either image or description is required for classification'
      });
    }

    // Classify the issue
    const classification = await issueClassifier.classifyIssue(imageBuffer, description);

    res.json({
      message: 'Issue classified successfully',
      classification
    });
  } catch (error) {
    console.error('Classify issue error:', error);
    res.status(500).json({
      message: 'Failed to classify issue',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/issues/suggest-category
// @desc    Get category suggestions based on description
// @access  Public
router.post('/suggest-category', [
  body('description')
    .isString()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { description } = req.body;

    // Get category suggestions
    const suggestions = await issueClassifier.getCategorySuggestions(description);

    res.json({
      message: 'Category suggestions generated successfully',
      suggestions
    });
  } catch (error) {
    console.error('Suggest category error:', error);
    res.status(500).json({
      message: 'Failed to generate category suggestions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
