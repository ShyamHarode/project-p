import User from '../models/User.js';
import { generateToken } from '../middleware/auth.js';
import { asyncHandler, ApiError, sendSuccessResponse } from '../middleware/errorHandler.js';
import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError('Validation failed', 400);
  }

  const { fullName, email, username, password, bio, profilePicture } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw new ApiError('Email already registered', 400);
    } else {
      throw new ApiError('Username already taken', 400);
    }
  }

  // Create new user
  const user = new User({
    fullName,
    email,
    username,
    password,
    bio: bio || '',
    profilePicture: profilePicture || ''
  });

  await user.save();

  // Generate JWT token
  const token = generateToken(user._id);
  const refreshToken = jwt.sign(
    { userId: user._id }, 
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, 
    { expiresIn: '30d' }
  );

  // Remove password from response
  const userResponse = user.toJSON();

  sendSuccessResponse(res, 201, 'User registered successfully', {
    user: userResponse,
    token,
    refreshToken
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError('Validation failed', 400);
  }

  const { emailOrUsername, password } = req.body;

  // Find user by email or username
  const user = await User.findOne({
    $or: [
      { email: emailOrUsername.toLowerCase() },
      { username: emailOrUsername.toLowerCase() }
    ]
  });

  if (!user) {
    throw new ApiError('Invalid credentials', 401);
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError('Invalid credentials', 401);
  }

  // Update last active
  user.lastActive = new Date();
  await user.save();

  // Generate JWT token
  const token = generateToken(user._id);
  const refreshToken = jwt.sign(
    { userId: user._id }, 
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, 
    { expiresIn: '30d' }
  );

  // Remove password from response
  const userResponse = user.toJSON();

  sendSuccessResponse(res, 200, 'Login successful', {
    user: userResponse,
    token,
    refreshToken
  });
});

// @desc    Admin login
// @route   POST /api/auth/admin/login
// @access  Public
export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find admin user
  const admin = await User.findOne({ 
    email: email.toLowerCase(),
    role: { $in: ['admin', 'manager'] }
  });

  if (!admin) {
    throw new ApiError('Invalid admin credentials', 401);
  }

  // Check password
  const isPasswordValid = await admin.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError('Invalid admin credentials', 401);
  }

  // Update last active
  admin.lastActive = new Date();
  await admin.save();

  // Generate JWT token
  const token = generateToken(admin._id);
  const refreshToken = jwt.sign(
    { userId: admin._id }, 
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, 
    { expiresIn: '30d' }
  );

  // Remove password from response
  const adminResponse = admin.toJSON();

  sendSuccessResponse(res, 200, 'Admin login successful', {
    user: adminResponse,
    token,
    refreshToken
  });
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('followers', 'username fullName profilePicture')
    .populate('following', 'username fullName profilePicture');

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  sendSuccessResponse(res, 200, 'User profile retrieved successfully', {
    user: user.toJSON()
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, bio, profilePicture } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError('User not found', 404);
  }

  // Update fields
  if (fullName !== undefined) user.fullName = fullName;
  if (bio !== undefined) user.bio = bio;
  if (profilePicture !== undefined) user.profilePicture = profilePicture;

  await user.save();

  sendSuccessResponse(res, 200, 'Profile updated successfully', {
    user: user.toJSON()
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError('User not found', 404);
  }

  // Check current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    throw new ApiError('Current password is incorrect', 400);
  }

  // Update password
  user.password = newPassword;
  await user.save();

  sendSuccessResponse(res, 200, 'Password changed successfully');
});

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshTokens = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ApiError('Refresh token is required', 401);
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      throw new ApiError('Invalid refresh token - user not found', 401);
    }

    const newToken = generateToken(user._id);
    const newRefreshToken = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, 
      { expiresIn: '30d' }
    );

    sendSuccessResponse(res, 200, 'Tokens refreshed successfully', {
      token: newToken,
      refreshToken: newRefreshToken,
      user: user.toJSON()
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw new ApiError('Invalid or expired refresh token', 401);
    }
    throw error;
  }
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req, res) => {
  // In a real application, you might want to blacklist the token
  // For now, we'll just send a success response
  sendSuccessResponse(res, 200, 'Logout successful');
});

// @desc    Get user statistics
// @route   GET /api/auth/stats
// @access  Private
export const getUserStats = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('posts')
    .populate('followers')
    .populate('following');

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  const stats = {
    postsCount: user.posts.length,
    followersCount: user.followers.length,
    followingCount: user.following.length,
    joinDate: user.joinDate,
    lastActive: user.lastActive
  };

  sendSuccessResponse(res, 200, 'User statistics retrieved successfully', { stats });
});
