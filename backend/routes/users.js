const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const Issue = require('../models/Issue');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        address: user.address,
        preferences: user.preferences,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      message: 'Failed to fetch profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update current user profile
// @access  Private
router.put('/profile', [
  authenticateToken,
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('address.street')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Street address must be less than 200 characters'),
  body('address.city')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('City must be less than 50 characters'),
  body('address.state')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('State must be less than 50 characters'),
  body('address.zipCode')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('ZIP code must be less than 20 characters'),
  body('address.country')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Country must be less than 50 characters')
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

    const { name, phone, address, preferences } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (preferences) updateData.preferences = preferences;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        address: user.address,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      message: 'Profile update failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/users/my-issues
// @desc    Get current user's issues
// @access  Private
router.get('/my-issues', [
  authenticateToken,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('status').optional().isIn(['Submitted', 'Under Review', 'In Progress', 'Resolved', 'Closed', 'Rejected']),
  query('category').optional().isString(),
  query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'upvoteCount', 'priority', 'status']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
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
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { reporter: req.user._id };

    if (status) filter.status = status;
    if (category) filter.category = category;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const issues = await Issue.find(filter)
      .populate('reporter', 'name email avatar')
      .populate('assignedTo.assignedBy', 'name email')
      .populate('comments.user', 'name avatar')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await Issue.countDocuments(filter);

    // Add user-specific data
    for (let issue of issues) {
      issue.hasUpvoted = issue.upvotes.some(upvote => 
        upvote.user.toString() === req.user._id.toString()
      );
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
    console.error('Get user issues error:', error);
    res.status(500).json({
      message: 'Failed to fetch your issues',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/users/stats
// @desc    Get current user's statistics
// @access  Private
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's issue statistics
    const [
      totalIssues,
      resolvedIssues,
      inProgressIssues,
      pendingIssues,
      totalUpvotes,
      totalComments
    ] = await Promise.all([
      Issue.countDocuments({ reporter: userId }),
      Issue.countDocuments({ reporter: userId, status: 'Resolved' }),
      Issue.countDocuments({ reporter: userId, status: 'In Progress' }),
      Issue.countDocuments({ 
        reporter: userId, 
        status: { $in: ['Submitted', 'Under Review'] } 
      }),
      Issue.aggregate([
        { $match: { reporter: userId } },
        { $group: { _id: null, total: { $sum: { $size: '$upvotes' } } } }
      ]),
      Issue.aggregate([
        { $match: { reporter: userId } },
        { $group: { _id: null, total: { $sum: { $size: '$comments' } } } }
      ])
    ]);

    // Get issues by category
    const issuesByCategory = await Issue.aggregate([
      { $match: { reporter: userId } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get recent activity
    const recentIssues = await Issue.find({ reporter: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title status createdAt category')
      .lean();

    // Get monthly issue trends
    const monthlyTrends = await Issue.aggregate([
      { $match: { reporter: userId } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const totalUpvotesReceived = totalUpvotes.length > 0 ? totalUpvotes[0].total : 0;
    const totalCommentsReceived = totalComments.length > 0 ? totalComments[0].total : 0;

    res.json({
      overview: {
        totalIssues,
        resolvedIssues,
        inProgressIssues,
        pendingIssues,
        totalUpvotes: totalUpvotesReceived,
        totalComments: totalCommentsReceived
      },
      analytics: {
        issuesByCategory,
        monthlyTrends,
        recentIssues
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      message: 'Failed to fetch user statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/users/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', [
  authenticateToken,
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
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

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id);
    
    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      message: 'Password change failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/users/upload-avatar
// @desc    Upload user avatar
// @access  Private
router.post('/upload-avatar', [
  authenticateToken,
  require('multer')({ 
    storage: require('multer').memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'), false);
      }
    }
  }).single('avatar')
], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'No image file provided'
      });
    }

    const { cloudinary } = require('../middleware/upload');
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: 'user-avatars',
        transformation: [
          { width: 200, height: 200, crop: 'fill', gravity: 'face' },
          { format: 'auto', quality: 'auto' }
        ]
      },
      async (error, result) => {
        if (error) {
          return res.status(500).json({
            message: 'Failed to upload avatar',
            error: error.message
          });
        }

        // Update user avatar
        const user = await User.findByIdAndUpdate(
          req.user._id,
          { avatar: result.secure_url },
          { new: true }
        ).select('-password');

        res.json({
          message: 'Avatar uploaded successfully',
          avatar: user.avatar
        });
      }
    );

    result.end(req.file.buffer);
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      message: 'Failed to upload avatar',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   DELETE /api/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', [
  authenticateToken,
  body('password')
    .notEmpty()
    .withMessage('Password is required to delete account')
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

    const { password } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id);
    
    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        message: 'Incorrect password'
      });
    }

    // Delete user's issues and related data
    await Issue.deleteMany({ reporter: req.user._id });

    // Delete user account
    await User.findByIdAndDelete(req.user._id);

    res.json({
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      message: 'Failed to delete account',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
