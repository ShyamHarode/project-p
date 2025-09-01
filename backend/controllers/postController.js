import Post from '../models/Post.js';
import User from '../models/User.js';
import Comment from '../models/Comment.js';
import RevenueMaster from '../models/RevenueMaster.js';
import { asyncHandler, ApiError, sendSuccessResponse } from '../middleware/errorHandler.js';
import { validationResult } from 'express-validator';
import { deleteFromCloudinary, generateVideoThumbnail } from '../config/cloudinary.js';

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
export const createPost = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError('Validation failed', 400);
  }

  const { content } = req.body;
  const media = [];

  // Process uploaded files
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const mediaItem = {
        type: file.mimetype.startsWith('image/') ? 'image' : 'video',
        url: file.path,
        publicId: file.filename,
        size: file.size
      };

      // Generate thumbnail for videos
      if (mediaItem.type === 'video') {
        try {
          mediaItem.thumbnail = await generateVideoThumbnail(file.filename);
          // Get video duration from Cloudinary response if available
          if (file.duration) {
            mediaItem.duration = file.duration;
          }
        } catch (error) {
          console.error('Error generating video thumbnail:', error);
        }
      }

      media.push(mediaItem);
    }
  }

  // Create post
  const post = new Post({
    author: req.user._id,
    content,
    media
  });

  await post.save();

  // Add post to user's posts array
  await User.findByIdAndUpdate(req.user._id, {
    $push: { posts: post._id }
  });

  // Populate author information
  await post.populate('author', 'username fullName profilePicture');

  // Emit real-time event
  const io = req.app.get('io');
  if (io) {
    io.emit('new_post', {
      post: post.toJSON(),
      author: req.user
    });
  }

  sendSuccessResponse(res, 201, 'Post created successfully', { post });
});

// @desc    Get all posts (Feed)
// @route   GET /api/posts
// @access  Public
export const getPosts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build query
  let query = {};
  
  // Filter by user if specified
  if (req.query.userId) {
    query.author = req.query.userId;
  }

  // Filter by hashtag if specified
  if (req.query.hashtag) {
    query.hashtags = { $in: [req.query.hashtag.toLowerCase()] };
  }

  // Get posts with pagination
  const posts = await Post.find(query)
    .populate('author', 'username fullName profilePicture isVerified')
    .populate({
      path: 'comments',
      populate: {
        path: 'author',
        select: 'username fullName profilePicture'
      },
      options: { limit: 3, sort: { createdAt: -1 } }
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();

  // Get total count for pagination
  const total = await Post.countDocuments(query);

  // Add user interaction data if authenticated
  if (req.user) {
    for (let post of posts) {
      post.isLikedByUser = post.likes.some(like => 
        like.user.toString() === req.user._id.toString()
      );
      post.isViewedByUser = post.views.some(view => 
        view.user.toString() === req.user._id.toString()
      );
    }
  }

  const pagination = {
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalPosts: total,
    hasNextPage: page < Math.ceil(total / limit),
    hasPrevPage: page > 1
  };

  sendSuccessResponse(res, 200, 'Posts retrieved successfully', {
    posts,
    pagination
  });
});

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Public
export const getPost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id)
    .populate('author', 'username fullName profilePicture isVerified')
    .populate({
      path: 'comments',
      populate: {
        path: 'author',
        select: 'username fullName profilePicture'
      },
      options: { sort: { createdAt: -1 } }
    });

  if (!post) {
    throw new ApiError('Post not found', 404);
  }

  // Add user interaction data if authenticated
  if (req.user) {
    post.isLikedByUser = post.likes.some(like => 
      like.user.toString() === req.user._id.toString()
    );
    post.isViewedByUser = post.views.some(view => 
      view.user.toString() === req.user._id.toString()
    );
  }

  sendSuccessResponse(res, 200, 'Post retrieved successfully', { post });
});

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
export const updatePost = asyncHandler(async (req, res) => {
  const { content } = req.body;

  const post = await Post.findById(req.params.id);

  if (!post) {
    throw new ApiError('Post not found', 404);
  }

  // Check if user owns the post or is admin
  if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError('Not authorized to update this post', 403);
  }

  // Update content
  if (content !== undefined) {
    post.content = content;
  }

  await post.save();
  await post.populate('author', 'username fullName profilePicture');

  sendSuccessResponse(res, 200, 'Post updated successfully', { post });
});

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
export const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    throw new ApiError('Post not found', 404);
  }

  // Check if user owns the post or is admin
  if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError('Not authorized to delete this post', 403);
  }

  // Delete media files from Cloudinary
  for (const mediaItem of post.media) {
    try {
      await deleteFromCloudinary(mediaItem.publicId, mediaItem.type);
    } catch (error) {
      console.error('Error deleting media from Cloudinary:', error);
    }
  }

  // Delete all comments associated with the post
  await Comment.deleteMany({ post: post._id });

  // Remove post from user's posts array
  await User.findByIdAndUpdate(post.author, {
    $pull: { posts: post._id }
  });

  // Delete the post
  await Post.findByIdAndDelete(req.params.id);

  sendSuccessResponse(res, 200, 'Post deleted successfully');
});

// @desc    Like/Unlike post
// @route   POST /api/posts/:id/like
// @access  Private
export const toggleLike = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    throw new ApiError('Post not found', 404);
  }

  const existingLike = post.likes.find(like => 
    like.user.toString() === req.user._id.toString()
  );

  let action;
  if (existingLike) {
    // Unlike the post
    await post.removeLike(req.user._id);
    action = 'unliked';
  } else {
    // Like the post
    await post.addLike(req.user._id);
    action = 'liked';
  }

  // Emit real-time event
  const io = req.app.get('io');
  if (io) {
    io.emit('post_liked', {
      postId: post._id,
      userId: req.user._id,
      action,
      likesCount: post.likes.length
    });
  }

  sendSuccessResponse(res, 200, `Post ${action} successfully`, {
    action,
    likesCount: post.likes.length
  });
});

// @desc    Add view to post
// @route   POST /api/posts/:id/view
// @access  Private
export const addView = asyncHandler(async (req, res) => {
  const { viewDuration = 0 } = req.body;
  const post = await Post.findById(req.params.id);

  if (!post) {
    throw new ApiError('Post not found', 404);
  }

  // Add view (the method handles duplicate views)
  await post.addView(req.user._id, viewDuration);

  sendSuccessResponse(res, 200, 'View recorded successfully', {
    viewsCount: post.views.length
  });
});

// @desc    Get posts by hashtag
// @route   GET /api/posts/hashtag/:hashtag
// @access  Public
export const getPostsByHashtag = asyncHandler(async (req, res) => {
  const { hashtag } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const posts = await Post.find({ 
    hashtags: { $in: [hashtag.toLowerCase()] } 
  })
    .populate('author', 'username fullName profilePicture isVerified')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);

  const total = await Post.countDocuments({ 
    hashtags: { $in: [hashtag.toLowerCase()] } 
  });

  const pagination = {
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalPosts: total,
    hasNextPage: page < Math.ceil(total / limit),
    hasPrevPage: page > 1
  };

  sendSuccessResponse(res, 200, 'Posts retrieved successfully', {
    posts,
    pagination,
    hashtag
  });
});

// @desc    Get trending hashtags
// @route   GET /api/posts/trending/hashtags
// @access  Public
export const getTrendingHashtags = asyncHandler(async (req, res) => {
  const trending = await Post.aggregate([
    { $unwind: '$hashtags' },
    { $group: { _id: '$hashtags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
    { $project: { hashtag: '$_id', count: 1, _id: 0 } }
  ]);

  sendSuccessResponse(res, 200, 'Trending hashtags retrieved successfully', {
    hashtags: trending
  });
});

// @desc    Get user's liked posts
// @route   GET /api/posts/user/liked
// @access  Private
export const getUserLikedPosts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const posts = await Post.find({ 
    'likes.user': req.user._id 
  })
    .populate('author', 'username fullName profilePicture isVerified')
    .sort({ 'likes.createdAt': -1 })
    .limit(limit)
    .skip(skip);

  const total = await Post.countDocuments({ 
    'likes.user': req.user._id 
  });

  const pagination = {
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalPosts: total,
    hasNextPage: page < Math.ceil(total / limit),
    hasPrevPage: page > 1
  };

  sendSuccessResponse(res, 200, 'Liked posts retrieved successfully', {
    posts,
    pagination
  });
});
