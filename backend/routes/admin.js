const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Issue = require('../models/Issue');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply admin authentication to all routes
router.use(authenticateToken, requireAdmin);

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Admin only)
router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get basic counts
    const [
      totalIssues,
      resolvedIssues,
      inProgressIssues,
      pendingIssues,
      recentIssues,
      urgentIssues,
      totalUsers,
      recentUsers
    ] = await Promise.all([
      Issue.countDocuments(),
      Issue.countDocuments({ status: 'Resolved' }),
      Issue.countDocuments({ status: 'In Progress' }),
      Issue.countDocuments({ status: { $in: ['Submitted', 'Under Review'] } }),
      Issue.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Issue.countDocuments({ isUrgent: true, status: { $ne: 'Resolved' } }),
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } })
    ]);

    // Get issues by category
    const issuesByCategory = await Issue.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get issues by status
    const issuesByStatus = await Issue.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get issues by priority
    const issuesByPriority = await Issue.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get monthly issue trends
    const monthlyTrends = await Issue.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) }
        }
      },
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

    // Get top reporters
    const topReporters = await Issue.aggregate([
      {
        $group: {
          _id: '$reporter',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          name: '$user.name',
          email: '$user.email',
          count: 1
        }
      }
    ]);

    // Calculate resolution rate
    const resolutionRate = totalIssues > 0 ? (resolvedIssues / totalIssues * 100).toFixed(1) : 0;

    res.json({
      overview: {
        totalIssues,
        resolvedIssues,
        inProgressIssues,
        pendingIssues,
        recentIssues,
        urgentIssues,
        totalUsers,
        recentUsers,
        resolutionRate: parseFloat(resolutionRate)
      },
      analytics: {
        issuesByCategory,
        issuesByStatus,
        issuesByPriority,
        monthlyTrends,
        topReporters
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      message: 'Failed to fetch dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/admin/issues
// @desc    Get all issues for admin with advanced filtering
// @access  Private (Admin only)
router.get('/issues', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['Submitted', 'Under Review', 'In Progress', 'Resolved', 'Closed', 'Rejected']),
  query('category').optional().isString(),
  query('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
  query('department').optional().isString(),
  query('isUrgent').optional().isBoolean(),
  query('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
  query('dateTo').optional().isISO8601().withMessage('Invalid date format'),
  query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'upvoteCount', 'priority', 'status']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('search').optional().isString()
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
      limit = 20,
      status,
      category,
      priority,
      department,
      isUrgent,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = req.query;

    // Build filter object
    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (department) filter['assignedTo.department'] = department;
    if (isUrgent !== undefined) filter.isUrgent = isUrgent === 'true';

    // Date range filter
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const issues = await Issue.find(filter)
      .populate('reporter', 'name email avatar phone')
      .populate('assignedTo.assignedBy', 'name email')
      .populate('comments.user', 'name avatar')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
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
    console.error('Get admin issues error:', error);
    res.status(500).json({
      message: 'Failed to fetch issues',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/admin/issues/:id/status
// @desc    Update issue status
// @access  Private (Admin only)
router.put('/issues/:id/status', [
  body('status')
    .isIn(['Submitted', 'Under Review', 'In Progress', 'Resolved', 'Closed', 'Rejected'])
    .withMessage('Invalid status'),
  body('resolutionNotes')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Resolution notes must be less than 500 characters')
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

    const { status, resolutionNotes } = req.body;

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({
        message: 'Issue not found'
      });
    }

    // Update issue status
    issue.status = status;
    issue.lastUpdated = new Date();

    if (status === 'Resolved') {
      issue.actualResolution = new Date();
      if (resolutionNotes) {
        issue.resolutionNotes = resolutionNotes;
      }
    }

    await issue.save();

    // Populate the updated issue
    await issue.populate('reporter', 'name email avatar');
    await issue.populate('assignedTo.assignedBy', 'name email');

    res.json({
      message: 'Issue status updated successfully',
      issue
    });
  } catch (error) {
    console.error('Update issue status error:', error);
    res.status(500).json({
      message: 'Failed to update issue status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/admin/issues/:id/assign
// @desc    Assign issue to department
// @access  Private (Admin only)
router.put('/issues/:id/assign', [
  body('department')
    .isIn([
      'Public Works',
      'Water Department',
      'Electricity Board',
      'Waste Management',
      'Police Department',
      'Environmental Agency',
      'Health Department',
      'Education Board',
      'Transport Department',
      'General Administration'
    ])
    .withMessage('Invalid department'),
  body('estimatedResolution')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
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

    const { department, estimatedResolution } = req.body;

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({
        message: 'Issue not found'
      });
    }

    // Update assignment
    issue.assignedTo = {
      department,
      assignedBy: req.user._id,
      assignedAt: new Date()
    };

    if (estimatedResolution) {
      issue.estimatedResolution = new Date(estimatedResolution);
    }

    // Update status to "In Progress" if not already assigned
    if (issue.status === 'Submitted' || issue.status === 'Under Review') {
      issue.status = 'In Progress';
    }

    issue.lastUpdated = new Date();

    await issue.save();

    // Populate the updated issue
    await issue.populate('reporter', 'name email avatar');
    await issue.populate('assignedTo.assignedBy', 'name email');

    res.json({
      message: 'Issue assigned successfully',
      issue
    });
  } catch (error) {
    console.error('Assign issue error:', error);
    res.status(500).json({
      message: 'Failed to assign issue',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/admin/issues/:id/priority
// @desc    Update issue priority
// @access  Private (Admin only)
router.put('/issues/:id/priority', [
  body('priority')
    .isIn(['Low', 'Medium', 'High', 'Critical'])
    .withMessage('Invalid priority')
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

    const { priority } = req.body;

    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      { 
        priority,
        lastUpdated: new Date()
      },
      { new: true, runValidators: true }
    ).populate('reporter', 'name email avatar');

    if (!issue) {
      return res.status(404).json({
        message: 'Issue not found'
      });
    }

    res.json({
      message: 'Issue priority updated successfully',
      issue
    });
  } catch (error) {
    console.error('Update issue priority error:', error);
    res.status(500).json({
      message: 'Failed to update issue priority',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users for admin
// @access  Private (Admin only)
router.get('/users', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('role').optional().isIn(['user', 'admin']),
  query('isActive').optional().isBoolean(),
  query('search').optional().isString()
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
      limit = 20,
      role,
      isActive,
      search
    } = req.query;

    // Build filter object
    const filter = {};

    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    // Text search
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await User.countDocuments(filter);

    // Get issue counts for each user
    const usersWithIssueCounts = await Promise.all(
      users.map(async (user) => {
        const issueCount = await Issue.countDocuments({ reporter: user._id });
        return { ...user, issueCount };
      })
    );

    res.json({
      users: usersWithIssueCounts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/admin/users/:id/status
// @desc    Update user status (activate/deactivate)
// @access  Private (Admin only)
router.put('/users/:id/status', [
  body('isActive')
    .isBoolean()
    .withMessage('isActive must be a boolean')
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

    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      message: 'Failed to update user status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get detailed analytics for admin
// @access  Private (Admin only)
router.get('/analytics', [
  query('period')
    .optional()
    .isIn(['7d', '30d', '90d', '1y'])
    .withMessage('Invalid period')
], async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let startDate;
    const now = new Date();
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    // Get various analytics
    const [
      issueTrends,
      resolutionTrends,
      categoryDistribution,
      departmentPerformance,
      userActivity
    ] = await Promise.all([
      // Issue trends over time
      Issue.aggregate([
        {
          $match: { createdAt: { $gte: startDate } }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]),
      
      // Resolution trends
      Issue.aggregate([
        {
          $match: { 
            actualResolution: { $gte: startDate },
            status: 'Resolved'
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$actualResolution' },
              month: { $month: '$actualResolution' },
              day: { $dayOfMonth: '$actualResolution' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]),
      
      // Category distribution
      Issue.aggregate([
        {
          $match: { createdAt: { $gte: startDate } }
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),
      
      // Department performance
      Issue.aggregate([
        {
          $match: { 
            'assignedTo.department': { $exists: true },
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$assignedTo.department',
            total: { $sum: 1 },
            resolved: {
              $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] }
            },
            avgResolutionTime: {
              $avg: {
                $cond: [
                  { $eq: ['$status', 'Resolved'] },
                  {
                    $divide: [
                      { $subtract: ['$actualResolution', '$createdAt'] },
                      1000 * 60 * 60 * 24 // Convert to days
                    ]
                  },
                  null
                ]
              }
            }
          }
        },
        {
          $addFields: {
            resolutionRate: {
              $multiply: [
                { $divide: ['$resolved', '$total'] },
                100
              ]
            }
          }
        },
        { $sort: { resolutionRate: -1 } }
      ]),
      
      // User activity
      Issue.aggregate([
        {
          $match: { createdAt: { $gte: startDate } }
        },
        {
          $group: {
            _id: '$reporter',
            issueCount: { $sum: 1 }
          }
        },
        { $sort: { issueCount: -1 } },
        { $limit: 20 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $project: {
            name: '$user.name',
            email: '$user.email',
            issueCount: 1
          }
        }
      ])
    ]);

    res.json({
      period,
      analytics: {
        issueTrends,
        resolutionTrends,
        categoryDistribution,
        departmentPerformance,
        userActivity
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      message: 'Failed to fetch analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
