import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    maxlength: [500, 'Comment cannot exceed 500 characters'],
    trim: true
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
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
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editHistory: [{
    content: String,
    editedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual fields
commentSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

commentSchema.virtual('repliesCount').get(function() {
  return this.replies.length;
});

// Indexes for better performance
commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ author: 1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ 'likes.user': 1 });

// Pre-save middleware to extract mentions
commentSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    // Extract mentions (@username)
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(this.content)) !== null) {
      mentions.push(match[1].toLowerCase());
    }
    // Note: We'll need to resolve usernames to user IDs in the controller
  }
  next();
});

// Method to add a like
commentSchema.methods.addLike = function(userId) {
  const existingLike = this.likes.find(like => like.user.toString() === userId.toString());
  if (!existingLike) {
    this.likes.push({ user: userId });
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove a like
commentSchema.methods.removeLike = function(userId) {
  this.likes = this.likes.filter(like => like.user.toString() !== userId.toString());
  return this.save();
};

// Method to edit comment
commentSchema.methods.editComment = function(newContent) {
  if (this.content !== newContent) {
    // Add to edit history
    this.editHistory.push({
      content: this.content,
      editedAt: new Date()
    });
    
    this.content = newContent;
    this.isEdited = true;
    return this.save();
  }
  return Promise.resolve(this);
};

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
