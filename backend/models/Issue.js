const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
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
    ]
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Submitted', 'Under Review', 'In Progress', 'Resolved', 'Closed', 'Rejected'],
    default: 'Submitted'
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    department: {
      type: String,
      enum: [
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
      ]
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedAt: {
      type: Date,
      default: null
    }
  },
  location: {
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        validate: {
          validator: function(coords) {
            return coords.length === 2 && 
                   coords[0] >= -180 && coords[0] <= 180 && 
                   coords[1] >= -90 && coords[1] <= 90;
          },
          message: 'Invalid coordinates'
        }
      }
    },
    city: String,
    state: String,
    zipCode: String
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  upvotes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    votedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: {
      type: Date,
      default: null
    }
  }],
  estimatedResolution: {
    type: Date,
    default: null
  },
  actualResolution: {
    type: Date,
    default: null
  },
  resolutionNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Resolution notes cannot exceed 500 characters']
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  reportedAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create geospatial index for location queries
issueSchema.index({ 'location.coordinates': '2dsphere' });

// Create text index for search functionality
issueSchema.index({ 
  title: 'text', 
  description: 'text', 
  category: 'text',
  tags: 'text'
});

// Index for better query performance
issueSchema.index({ status: 1 });
issueSchema.index({ category: 1 });
issueSchema.index({ priority: 1 });
issueSchema.index({ reporter: 1 });
issueSchema.index({ createdAt: -1 });
issueSchema.index({ 'assignedTo.department': 1 });

// Virtual for upvote count
issueSchema.virtual('upvoteCount').get(function() {
  return this.upvotes.length;
});

// Virtual for comment count
issueSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Method to add upvote
issueSchema.methods.addUpvote = function(userId) {
  const existingUpvote = this.upvotes.find(upvote => 
    upvote.user.toString() === userId.toString()
  );
  
  if (existingUpvote) {
    throw new Error('User has already upvoted this issue');
  }
  
  this.upvotes.push({ user: userId });
  return this.save();
};

// Method to remove upvote
issueSchema.methods.removeUpvote = function(userId) {
  this.upvotes = this.upvotes.filter(upvote => 
    upvote.user.toString() !== userId.toString()
  );
  return this.save();
};

// Method to add comment
issueSchema.methods.addComment = function(userId, content) {
  this.comments.push({
    user: userId,
    content: content
  });
  this.lastUpdated = new Date();
  return this.save();
};

// Method to update status
issueSchema.methods.updateStatus = function(newStatus, updatedBy) {
  this.status = newStatus;
  this.lastUpdated = new Date();
  
  if (newStatus === 'Resolved') {
    this.actualResolution = new Date();
  }
  
  return this.save();
};

// Pre-save middleware to update lastUpdated
issueSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('Issue', issueSchema);
