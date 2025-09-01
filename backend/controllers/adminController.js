import Employee from '../models/Employee.js';
import RevenueMaster from '../models/RevenueMaster.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import { asyncHandler, ApiError, sendSuccessResponse } from '../middleware/errorHandler.js';
import { validationResult } from 'express-validator';

// Employee Management

// @desc    Create employee
// @route   POST /api/admin/employees
// @access  Private (Admin)
export const createEmployee = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError('Validation failed', 400);
  }

  const { name, email, mobile, role, salary, department } = req.body;

  // Check if employee already exists
  const existingEmployee = await Employee.findOne({ email });
  if (existingEmployee) {
    throw new ApiError('Employee with this email already exists', 400);
  }

  const employee = new Employee({
    name,
    email,
    mobile,
    role,
    salary,
    department,
    createdBy: req.user._id
  });

  await employee.save();

  sendSuccessResponse(res, 201, 'Employee created successfully', { employee });
});

// @desc    Get all employees
// @route   GET /api/admin/employees
// @access  Private (Admin/Manager)
export const getEmployees = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const employees = await Employee.find({ isActive: true })
    .populate('createdBy', 'username fullName')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);

  const total = await Employee.countDocuments({ isActive: true });

  const pagination = {
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalEmployees: total,
    hasNextPage: page < Math.ceil(total / limit),
    hasPrevPage: page > 1
  };

  sendSuccessResponse(res, 200, 'Employees retrieved successfully', {
    employees,
    pagination
  });
});

// @desc    Update employee
// @route   PUT /api/admin/employees/:id
// @access  Private (Admin)
export const updateEmployee = asyncHandler(async (req, res) => {
  const { name, mobile, role, salary, department, isActive } = req.body;

  const employee = await Employee.findById(req.params.id);
  if (!employee) {
    throw new ApiError('Employee not found', 404);
  }

  // Update fields
  if (name !== undefined) employee.name = name;
  if (mobile !== undefined) employee.mobile = mobile;
  if (role !== undefined) employee.role = role;
  if (salary !== undefined) employee.salary = salary;
  if (department !== undefined) employee.department = department;
  if (isActive !== undefined) employee.isActive = isActive;

  await employee.save();

  sendSuccessResponse(res, 200, 'Employee updated successfully', { employee });
});

// @desc    Delete employee
// @route   DELETE /api/admin/employees/:id
// @access  Private (Admin)
export const deleteEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) {
    throw new ApiError('Employee not found', 404);
  }

  // Soft delete
  employee.isActive = false;
  await employee.save();

  sendSuccessResponse(res, 200, 'Employee deleted successfully');
});

// Revenue Management

// @desc    Create revenue pricing
// @route   POST /api/admin/revenue
// @access  Private (Admin/Manager)
export const createRevenuePricing = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError('Validation failed', 400);
  }

  const { 
    pricePerView, 
    pricePerLike, 
    currency, 
    description, 
    category,
    minimumPayout,
    maxEarningsPerDay
  } = req.body;

  // Deactivate current active pricing
  await RevenueMaster.updateMany(
    { isActive: true },
    { isActive: false, effectiveTo: new Date() }
  );

  const revenuePricing = new RevenueMaster({
    pricePerView,
    pricePerLike,
    currency,
    description,
    category,
    minimumPayout,
    maxEarningsPerDay,
    createdBy: req.user._id
  });

  await revenuePricing.save();

  sendSuccessResponse(res, 201, 'Revenue pricing created successfully', { 
    revenuePricing 
  });
});

// @desc    Get revenue pricing list
// @route   GET /api/admin/revenue
// @access  Private (Admin/Manager)
export const getRevenuePricing = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const pricingList = await RevenueMaster.find()
    .populate('createdBy', 'username fullName')
    .populate('lastModifiedBy', 'username fullName')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);

  const total = await RevenueMaster.countDocuments();

  const pagination = {
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalPricing: total,
    hasNextPage: page < Math.ceil(total / limit),
    hasPrevPage: page > 1
  };

  sendSuccessResponse(res, 200, 'Revenue pricing retrieved successfully', {
    pricingList,
    pagination
  });
});

// @desc    Update revenue pricing
// @route   PUT /api/admin/revenue/:id
// @access  Private (Admin/Manager)
export const updateRevenuePricing = asyncHandler(async (req, res) => {
  const { 
    pricePerView, 
    pricePerLike, 
    currency, 
    description, 
    isActive,
    minimumPayout,
    maxEarningsPerDay
  } = req.body;

  const revenuePricing = await RevenueMaster.findById(req.params.id);
  if (!revenuePricing) {
    throw new ApiError('Revenue pricing not found', 404);
  }

  // If setting as active, deactivate others
  if (isActive && !revenuePricing.isActive) {
    await RevenueMaster.updateMany(
      { isActive: true },
      { isActive: false, effectiveTo: new Date() }
    );
  }

  // Update fields
  if (pricePerView !== undefined) revenuePricing.pricePerView = pricePerView;
  if (pricePerLike !== undefined) revenuePricing.pricePerLike = pricePerLike;
  if (currency !== undefined) revenuePricing.currency = currency;
  if (description !== undefined) revenuePricing.description = description;
  if (isActive !== undefined) revenuePricing.isActive = isActive;
  if (minimumPayout !== undefined) revenuePricing.minimumPayout = minimumPayout;
  if (maxEarningsPerDay !== undefined) revenuePricing.maxEarningsPerDay = maxEarningsPerDay;

  revenuePricing.lastModifiedBy = req.user._id;
  await revenuePricing.save();

  sendSuccessResponse(res, 200, 'Revenue pricing updated successfully', { 
    revenuePricing 
  });
});

// Post Management

// @desc    Get posts for approval
// @route   GET /api/admin/posts
// @access  Private (Admin/Manager)
export const getPostsForApproval = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const status = req.query.status || 'pending'; // pending, approved, all

  let query = {};
  if (status === 'pending') {
    query.isApproved = false;
  } else if (status === 'approved') {
    query.isApproved = true;
  }

  const posts = await Post.find(query)
    .populate('author', 'username fullName profilePicture')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);

  const total = await Post.countDocuments(query);

  // Get current pricing for calculations
  const currentPricing = await RevenueMaster.getCurrentPricing();

  // Add earnings calculations
  const postsWithEarnings = posts.map(post => {
    const postObj = post.toObject();
    if (currentPricing) {
      const earnings = currentPricing.calculateEarnings(
        post.analytics.totalViews,
        post.analytics.totalLikes
      );
      postObj.calculatedEarnings = earnings;
    }
    return postObj;
  });

  const pagination = {
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalPosts: total,
    hasNextPage: page < Math.ceil(total / limit),
    hasPrevPage: page > 1
  };

  sendSuccessResponse(res, 200, 'Posts retrieved successfully', {
    posts: postsWithEarnings,
    pagination,
    currentPricing
  });
});

// @desc    Approve post
// @route   POST /api/admin/posts/:id/approve
// @access  Private (Admin/Manager)
export const approvePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    throw new ApiError('Post not found', 404);
  }

  if (post.isApproved) {
    throw new ApiError('Post is already approved', 400);
  }

  // Get current pricing
  const currentPricing = await RevenueMaster.getCurrentPricing();
  if (currentPricing) {
    const totalEarnings = post.calculateEarnings(
      currentPricing.pricePerView,
      currentPricing.pricePerLike
    );
    post.earnings.totalEarnings = totalEarnings;
    post.earnings.viewPrice = currentPricing.pricePerView;
    post.earnings.likePrice = currentPricing.pricePerLike;
  }

  post.isApproved = true;
  await post.save();

  sendSuccessResponse(res, 200, 'Post approved successfully', { post });
});

// Account Dashboard

// @desc    Get account dashboard
// @route   GET /api/admin/dashboard
// @access  Private (Admin/Manager)
export const getAccountDashboard = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Get approved posts
  const approvedPosts = await Post.find({ isApproved: true })
    .populate('author', 'username fullName profilePicture')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);

  const total = await Post.countDocuments({ isApproved: true });

  // Calculate total earnings
  const totalEarnings = await Post.aggregate([
    { $match: { isApproved: true } },
    { $group: { _id: null, total: { $sum: '$earnings.totalEarnings' } } }
  ]);

  const pagination = {
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalPosts: total,
    hasNextPage: page < Math.ceil(total / limit),
    hasPrevPage: page > 1
  };

  sendSuccessResponse(res, 200, 'Dashboard data retrieved successfully', {
    posts: approvedPosts,
    pagination,
    totalEarnings: totalEarnings[0]?.total || 0
  });
});

// @desc    Pay post earnings
// @route   POST /api/admin/posts/:id/pay
// @access  Private (Admin/Manager)
export const payPostEarnings = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    throw new ApiError('Post not found', 404);
  }

  if (!post.isApproved) {
    throw new ApiError('Post must be approved before payment', 400);
  }

  if (post.isPaid) {
    throw new ApiError('Post earnings have already been paid', 400);
  }

  post.isPaid = true;
  await post.save();

  sendSuccessResponse(res, 200, 'Post earnings paid successfully', { post });
});

// @desc    Get admin statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
export const getAdminStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalPosts,
    totalEmployees,
    pendingApprovals,
    totalEarnings,
    unpaidEarnings
  ] = await Promise.all([
    User.countDocuments(),
    Post.countDocuments(),
    Employee.countDocuments({ isActive: true }),
    Post.countDocuments({ isApproved: false }),
    Post.aggregate([
      { $match: { isApproved: true } },
      { $group: { _id: null, total: { $sum: '$earnings.totalEarnings' } } }
    ]),
    Post.aggregate([
      { $match: { isApproved: true, isPaid: false } },
      { $group: { _id: null, total: { $sum: '$earnings.totalEarnings' } } }
    ])
  ]);

  const stats = {
    totalUsers,
    totalPosts,
    totalEmployees,
    pendingApprovals,
    totalEarnings: totalEarnings[0]?.total || 0,
    unpaidEarnings: unpaidEarnings[0]?.total || 0
  };

  sendSuccessResponse(res, 200, 'Admin statistics retrieved successfully', { stats });
});
