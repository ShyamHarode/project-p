import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Post content is required'],
    maxlength: [280, 'Post content cannot exceed 280 characters'],
    trim: true
  },
  media: [{
    type: {
      type: String,
      enum: ['image', 'video'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    thumbnail: {
      type: String // For video thumbnails
    },
    duration: {
      type: Number // For videos in seconds
    },
    size: {
      type: Number // File size in bytes
    }
  }],
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  views: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    viewedAt: {
      type: Date,
      default: Date.now
    },
    viewDuration: {
      type: Number, // In seconds
      default: 0
    }
  }],
  hashtags: [{
    type: String,
    lowercase: true
  }],
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isApproved: {
    type: Boolean,
    default: false
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  earnings: {
    viewPrice: {
      type: Number,
      default: 0
    },
    likePrice: {
      type: Number,
      default: 0
    },
    totalEarnings: {
      type: Number,
      default: 0
    }
  },
  analytics: {
    totalViews: {
      type: Number,
      default: 0
    },
    uniqueViews: {
      type: Number,
      default: 0
    },
    totalLikes: {
      type: Number,
      default: 0
    },
    totalComments: {
      type: Number,
      default: 0
    },
    engagementRate: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual fields
postSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

postSchema.virtual('commentsCount').get(function() {
  return this.comments.length;
});

postSchema.virtual('viewsCount').get(function() {
  return this.views.length;
});

postSchema.virtual('uniqueViewsCount').get(function() {
  const uniqueUsers = new Set(this.views.map(view => view.user.toString()));
  return uniqueUsers.size;
});

// Indexes for better performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ 'likes.user': 1 });
postSchema.index({ isApproved: 1 });
postSchema.index({ isPaid: 1 });

// Pre-save middleware to extract hashtags and mentions
postSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    // Extract hashtags
    const hashtagRegex = /#(\w+)/g;
    const hashtags = [];
    let match;
    while ((match = hashtagRegex.exec(this.content)) !== null) {
      hashtags.push(match[1].toLowerCase());
    }
    this.hashtags = [...new Set(hashtags)]; // Remove duplicates
    
    // Update analytics
    this.analytics.totalLikes = this.likes.length;
    this.analytics.totalComments = this.comments.length;
    this.analytics.totalViews = this.views.length;
    this.analytics.uniqueViews = this.uniqueViewsCount;
    
    // Calculate engagement rate
    if (this.analytics.totalViews > 0) {
      this.analytics.engagementRate = 
        ((this.analytics.totalLikes + this.analytics.totalComments) / this.analytics.totalViews) * 100;
    }
  }
  next();
});

// Method to add a like
postSchema.methods.addLike = function(userId) {
  const existingLike = this.likes.find(like => like.user.toString() === userId.toString());
  if (!existingLike) {
    this.likes.push({ user: userId });
    this.analytics.totalLikes = this.likes.length;
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove a like
postSchema.methods.removeLike = function(userId) {
  this.likes = this.likes.filter(like => like.user.toString() !== userId.toString());
  this.analytics.totalLikes = this.likes.length;
  return this.save();
};

// Method to add a view
postSchema.methods.addView = function(userId, viewDuration = 0) {
  const existingView = this.views.find(view => view.user.toString() === userId.toString());
  if (!existingView) {
    this.views.push({ user: userId, viewDuration });
    this.analytics.totalViews = this.views.length;
    this.analytics.uniqueViews = this.uniqueViewsCount;
    return this.save();
  } else {
    // Update view duration if user views again
    existingView.viewDuration += viewDuration;
    existingView.viewedAt = new Date();
    return this.save();
  }
};

// Method to calculate earnings
postSchema.methods.calculateEarnings = function(pricePerView, pricePerLike) {
  this.earnings.viewPrice = pricePerView || 0;
  this.earnings.likePrice = pricePerLike || 0;
  this.earnings.totalEarnings = 
    (this.analytics.totalViews * this.earnings.viewPrice) + 
    (this.analytics.totalLikes * this.earnings.likePrice);
  return this.earnings.totalEarnings;
};

const Post = mongoose.model('Post', postSchema);

export default Post;
