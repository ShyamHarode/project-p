import Comment from '../models/Comment.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import { asyncHandler, ApiError, sendSuccessResponse } from '../middleware/errorHandler.js';
import { validationResult } from 'express-validator';

// @desc    Add comment to post
// @route   POST /api/posts/:postId/comments
// @access  Private
export const addComment = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError('Validation failed', 400);
  }

  const { content, parentComment } = req.body;
  const { postId } = req.params;

  // Check if post exists
  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError('Post not found', 404);
  }

  // Check if parent comment exists (for replies)
  if (parentComment) {
    const parent = await Comment.findById(parentComment);
    if (!parent || parent.post.toString() !== postId) {
      throw new ApiError('Parent comment not found or does not belong to this post', 400);
    }
  }

  // Create comment
  const comment = new Comment({
    author: req.user._id,
    post: postId,
    content,
    parentComment: parentComment || null
  });

  await comment.save();

  // Add comment to post
  await Post.findByIdAndUpdate(postId, {
    $push: { comments: comment._id }
  });

  // If this is a reply, add to parent comment's replies
  if (parentComment) {
    await Comment.findByIdAndUpdate(parentComment, {
      $push: { replies: comment._id }
    });
  }

  // Populate author information
  await comment.populate('author', 'username fullName profilePicture');

  // Emit real-time event
  const io = req.app.get('io');
  if (io) {
    io.emit('comment_added', {
      comment: comment.toJSON(),
      postId,
      parentComment
    });
  }

  sendSuccessResponse(res, 201, 'Comment added successfully', { comment });
});

// @desc    Get comments for a post
// @route   GET /api/posts/:postId/comments
// @access  Public
export const getPostComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  // Check if post exists
  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError('Post not found', 404);
  }

  // Get main comments (not replies)
  const comments = await Comment.find({ 
    post: postId, 
    parentComment: null 
  })
    .populate('author', 'username fullName profilePicture isVerified')
    .populate({
      path: 'replies',
      populate: {
        path: 'author',
        select: 'username fullName profilePicture isVerified'
      },
      options: { limit: 3, sort: { createdAt: 1 } }
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);

  const total = await Comment.countDocuments({ 
    post: postId, 
    parentComment: null 
  });

  // Add user interaction data if authenticated
  if (req.user) {
    for (let comment of comments) {
      comment.isLikedByUser = comment.likes.some(like => 
        like.user.toString() === req.user._id.toString()
      );
      
      // Check replies too
      for (let reply of comment.replies) {
        reply.isLikedByUser = reply.likes.some(like => 
          like.user.toString() === req.user._id.toString()
        );
      }
    }
  }

  const pagination = {
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalComments: total,
    hasNextPage: page < Math.ceil(total / limit),
    hasPrevPage: page > 1
  };

  sendSuccessResponse(res, 200, 'Comments retrieved successfully', {
    comments,
    pagination
  });
});

// @desc    Get replies for a comment
// @route   GET /api/comments/:commentId/replies
// @access  Public
export const getCommentReplies = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Check if parent comment exists
  const parentComment = await Comment.findById(commentId);
  if (!parentComment) {
    throw new ApiError('Comment not found', 404);
  }

  const replies = await Comment.find({ parentComment: commentId })
    .populate('author', 'username fullName profilePicture isVerified')
    .sort({ createdAt: 1 })
    .limit(limit)
    .skip(skip);

  const total = await Comment.countDocuments({ parentComment: commentId });

  // Add user interaction data if authenticated
  if (req.user) {
    for (let reply of replies) {
      reply.isLikedByUser = reply.likes.some(like => 
        like.user.toString() === req.user._id.toString()
      );
    }
  }

  const pagination = {
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalReplies: total,
    hasNextPage: page < Math.ceil(total / limit),
    hasPrevPage: page > 1
  };

  sendSuccessResponse(res, 200, 'Replies retrieved successfully', {
    replies,
    pagination
  });
});

// @desc    Update comment
// @route   PUT /api/comments/:id
// @access  Private
export const updateComment = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError('Validation failed', 400);
  }

  const { content } = req.body;
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    throw new ApiError('Comment not found', 404);
  }

  // Check if user owns the comment
  if (comment.author.toString() !== req.user._id.toString()) {
    throw new ApiError('Not authorized to update this comment', 403);
  }

  // Update comment using the method that handles edit history
  await comment.editComment(content);
  await comment.populate('author', 'username fullName profilePicture');

  sendSuccessResponse(res, 200, 'Comment updated successfully', { comment });
});

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
export const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    throw new ApiError('Comment not found', 404);
  }

  // Check if user owns the comment or is admin
  if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError('Not authorized to delete this comment', 403);
  }

  // If this is a parent comment, delete all replies
  if (!comment.parentComment) {
    await Comment.deleteMany({ parentComment: comment._id });
  } else {
    // If this is a reply, remove it from parent's replies array
    await Comment.findByIdAndUpdate(comment.parentComment, {
      $pull: { replies: comment._id }
    });
  }

  // Remove comment from post's comments array
  await Post.findByIdAndUpdate(comment.post, {
    $pull: { comments: comment._id }
  });

  // Delete the comment
  await Comment.findByIdAndDelete(req.params.id);

  sendSuccessResponse(res, 200, 'Comment deleted successfully');
});

// @desc    Like/Unlike comment
// @route   POST /api/comments/:id/like
// @access  Private
export const toggleCommentLike = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    throw new ApiError('Comment not found', 404);
  }

  const existingLike = comment.likes.find(like => 
    like.user.toString() === req.user._id.toString()
  );

  let action;
  if (existingLike) {
    // Unlike the comment
    await comment.removeLike(req.user._id);
    action = 'unliked';
  } else {
    // Like the comment
    await comment.addLike(req.user._id);
    action = 'liked';
  }

  sendSuccessResponse(res, 200, `Comment ${action} successfully`, {
    action,
    likesCount: comment.likes.length
  });
});

// @desc    Get single comment
// @route   GET /api/comments/:id
// @access  Public
export const getComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id)
    .populate('author', 'username fullName profilePicture isVerified')
    .populate('post', 'content author')
    .populate({
      path: 'replies',
      populate: {
        path: 'author',
        select: 'username fullName profilePicture isVerified'
      }
    });

  if (!comment) {
    throw new ApiError('Comment not found', 404);
  }

  // Add user interaction data if authenticated
  if (req.user) {
    comment.isLikedByUser = comment.likes.some(like => 
      like.user.toString() === req.user._id.toString()
    );
  }

  sendSuccessResponse(res, 200, 'Comment retrieved successfully', { comment });
});
