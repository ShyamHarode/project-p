import express from 'express';
import { uploadProfilePicture, uploadPostMedia } from '../config/cloudinary.js';
import { authenticateToken } from '../middleware/auth.js';
import { asyncHandler, sendSuccessResponse, ApiError } from '../middleware/errorHandler.js';

const router = express.Router();

// All upload routes require authentication
router.use(authenticateToken);

// @desc    Upload profile picture
// @route   POST /api/upload/profile
// @access  Private
const uploadProfile = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError('Please upload a file', 400);
  }

  sendSuccessResponse(res, 200, 'Profile picture uploaded successfully', {
    url: req.file.path,
    publicId: req.file.filename
  });
});

// @desc    Upload post media
// @route   POST /api/upload/post-media
// @access  Private
const uploadMedia = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new ApiError('Please upload at least one file', 400);
  }

  const uploadedFiles = req.files.map(file => ({
    type: file.mimetype.startsWith('image/') ? 'image' : 'video',
    url: file.path,
    publicId: file.filename,
    size: file.size,
    originalName: file.originalname
  }));

  sendSuccessResponse(res, 200, 'Media uploaded successfully', {
    files: uploadedFiles
  });
});

// Routes
router.post('/profile', uploadProfilePicture.single('profile'), uploadProfile);
router.post('/post-media', uploadPostMedia.array('media', 5), uploadMedia);

export default router;
