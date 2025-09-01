import User from '../models/User.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import { asyncHandler, ApiError, sendSuccessResponse } from '../middleware/errorHandler.js';
import { validationResult } from 'express-validator';

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Public
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate('followers', 'username fullName profilePicture')
    .populate('following', 'username fullName profilePicture')
    .select('-password');

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  // Get user's posts
  const posts = await Post.find({ author: user._id })
    .populate('author', 'username fullName profilePicture')
    .sort({ createdAt: -1 })
    .limit(12);

  // Check if current user follows this user
  let isFollowing = false;
  if (req.user && req.user._id.toString() !== user._id.toString()) {
    isFollowing = user.followers.some(follower => 
      follower._id.toString() === req.user._id.toString()
    );
  }

  const userProfile = {
    ...user.toJSON(),
    isFollowing,
    recentPosts: posts
  };

  sendSuccessResponse(res, 200, 'User profile retrieved successfully', {
    user: userProfile
  });
});

// @desc    Get all users (with search and pagination)
// @route   GET /api/users
// @access  Public
export const getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const search = req.query.search || '';

  // Build search query
  let query = {};
  if (search) {
    query = {
      $or: [
        { username: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } }
      ]
    };
  }

  // Get users with pagination
  const users = await User.find(query)
    .select('username fullName profilePicture bio isVerified followersCount followingCount postsCount')
    .sort({ followersCount: -1, createdAt: -1 })
    .limit(limit)
    .skip(skip);

  // Get total count for pagination
  const total = await User.countDocuments(query);

  // Add follow status for authenticated users
  if (req.user) {
    for (let user of users) {
      const userObj = user.toObject();
      userObj.isFollowing = req.user.following.includes(user._id);
      Object.assign(user, userObj);
    }
  }

  const pagination = {
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalUsers: total,
    hasNextPage: page < Math.ceil(total / limit),
    hasPrevPage: page > 1
  };

  sendSuccessResponse(res, 200, 'Users retrieved successfully', {
    users,
    pagination
  });
});

// @desc    Follow/Unfollow user
// @route   POST /api/users/:id/follow
// @access  Private
export const toggleFollow = asyncHandler(async (req, res) => {
  const userToFollow = await User.findById(req.params.id);
  const currentUser = await User.findById(req.user._id);

  if (!userToFollow) {
    throw new ApiError('User not found', 404);
  }

  if (userToFollow._id.toString() === currentUser._id.toString()) {
    throw new ApiError('You cannot follow yourself', 400);
  }

  const isFollowing = currentUser.following.includes(userToFollow._id);

  let action;
  if (isFollowing) {
    // Unfollow
    currentUser.following.pull(userToFollow._id);
    userToFollow.followers.pull(currentUser._id);
    action = 'unfollowed';
  } else {
    // Follow
    currentUser.following.push(userToFollow._id);
    userToFollow.followers.push(currentUser._id);
    action = 'followed';
  }

  await Promise.all([currentUser.save(), userToFollow.save()]);

  // Emit real-time event for new follower
  if (action === 'followed') {
    const io = req.app.get('io');
    if (io) {
      io.to(userToFollow._id.toString()).emit('new_follower', {
        follower: {
          _id: currentUser._id,
          username: currentUser.username,
          fullName: currentUser.fullName,
          profilePicture: currentUser.profilePicture
        }
      });
    }
  }

  sendSuccessResponse(res, 200, `User ${action} successfully`, {
    action,
    followersCount: userToFollow.followers.length,
    followingCount: currentUser.following.length
  });
});

// @desc    Get user's followers
// @route   GET /api/users/:id/followers
// @access  Public
export const getUserFollowers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError('User not found', 404);
  }

  const followers = await User.find({ _id: { $in: user.followers } })
    .select('username fullName profilePicture bio isVerified')
    .limit(limit)
    .skip(skip);

  const total = user.followers.length;

  // Add follow status for authenticated users
  if (req.user) {
    for (let follower of followers) {
      const followerObj = follower.toObject();
      followerObj.isFollowing = req.user.following.includes(follower._id);
      Object.assign(follower, followerObj);
    }
  }

  const pagination = {
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalFollowers: total,
    hasNextPage: page < Math.ceil(total / limit),
    hasPrevPage: page > 1
  };

  sendSuccessResponse(res, 200, 'Followers retrieved successfully', {
    followers,
    pagination
  });
});

// @desc    Get user's following
// @route   GET /api/users/:id/following
// @access  Public
export const getUserFollowing = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError('User not found', 404);
  }

  const following = await User.find({ _id: { $in: user.following } })
    .select('username fullName profilePicture bio isVerified')
    .limit(limit)
    .skip(skip);

  const total = user.following.length;

  // Add follow status for authenticated users
  if (req.user) {
    for (let followedUser of following) {
      const followedUserObj = followedUser.toObject();
      followedUserObj.isFollowing = req.user.following.includes(followedUser._id);
      Object.assign(followedUser, followedUserObj);
    }
  }

  const pagination = {
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalFollowing: total,
    hasNextPage: page < Math.ceil(total / limit),
    hasPrevPage: page > 1
  };

  sendSuccessResponse(res, 200, 'Following retrieved successfully', {
    following,
    pagination
  });
});

// @desc    Get follow suggestions
// @route   GET /api/users/suggestions
// @access  Private
export const getFollowSuggestions = asyncHandler(async (req, res) => {
  const currentUser = await User.findById(req.user._id).populate('following');
  
  // Get users followed by people you follow (mutual connections)
  const mutualConnections = await User.aggregate([
    { $match: { _id: { $in: currentUser.following } } },
    { $unwind: '$following' },
    { $match: { 
      following: { 
        $nin: [...currentUser.following, currentUser._id] 
      } 
    }},
    { $group: { 
      _id: '$following', 
      mutualCount: { $sum: 1 } 
    }},
    { $sort: { mutualCount: -1 } },
    { $limit: 10 }
  ]);

  const suggestedUserIds = mutualConnections.map(mc => mc._id);

  // If not enough mutual connections, add popular users
  if (suggestedUserIds.length < 10) {
    const popularUsers = await User.find({
      _id: { 
        $nin: [...currentUser.following, currentUser._id, ...suggestedUserIds] 
      }
    })
      .sort({ followersCount: -1 })
      .limit(10 - suggestedUserIds.length)
      .select('_id');

    suggestedUserIds.push(...popularUsers.map(u => u._id));
  }

  // Get user details for suggestions
  const suggestions = await User.find({ _id: { $in: suggestedUserIds } })
    .select('username fullName profilePicture bio isVerified followersCount')
    .limit(10);

  sendSuccessResponse(res, 200, 'Follow suggestions retrieved successfully', {
    suggestions
  });
});

// @desc    Get user posts
// @route   GET /api/users/:id/posts
// @access  Public
export const getUserPosts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError('User not found', 404);
  }

  const posts = await Post.find({ author: user._id })
    .populate('author', 'username fullName profilePicture')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);

  const total = await Post.countDocuments({ author: user._id });

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

  sendSuccessResponse(res, 200, 'User posts retrieved successfully', {
    posts,
    pagination
  });
});

// @desc    Search users
// @route   GET /api/users/search
// @access  Public
export const searchUsers = asyncHandler(async (req, res) => {
  const { q: searchQuery } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  if (!searchQuery || searchQuery.trim().length < 2) {
    throw new ApiError('Search query must be at least 2 characters long', 400);
  }

  const query = {
    $or: [
      { username: { $regex: searchQuery, $options: 'i' } },
      { fullName: { $regex: searchQuery, $options: 'i' } }
    ]
  };

  const users = await User.find(query)
    .select('username fullName profilePicture bio isVerified followersCount')
    .sort({ followersCount: -1 })
    .limit(limit)
    .skip(skip);

  const total = await User.countDocuments(query);

  // Add follow status for authenticated users
  if (req.user) {
    for (let user of users) {
      const userObj = user.toObject();
      userObj.isFollowing = req.user.following.includes(user._id);
      Object.assign(user, userObj);
    }
  }

  const pagination = {
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalResults: total,
    hasNextPage: page < Math.ceil(total / limit),
    hasPrevPage: page > 1
  };

  sendSuccessResponse(res, 200, 'Search results retrieved successfully', {
    users,
    pagination,
    searchQuery
  });
});
