import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage configuration for images
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'socialmedia/posts/images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { quality: 'auto', fetch_format: 'auto' },
      { width: 1080, height: 1080, crop: 'limit' }
    ]
  }
});

// Storage configuration for videos
const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'socialmedia/posts/videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
    transformation: [
      { quality: 'auto', fetch_format: 'auto' },
      { duration: '60', flags: 'truncate_ts' }, // Limit to 1 minute
      { width: 1080, height: 1920, crop: 'limit' }
    ]
  }
});

// Storage configuration for profile pictures
const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'socialmedia/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { quality: 'auto', fetch_format: 'auto' },
      { width: 400, height: 400, crop: 'fill', gravity: 'face' }
    ]
  }
});

// File filter for images
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// File filter for videos
const videoFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed'), false);
  }
};

// File filter for both images and videos
const mediaFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed'), false);
  }
};

// Multer configurations
export const uploadPostImages = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // Maximum 5 images per post
  }
});

export const uploadPostVideos = multer({
  storage: videoStorage,
  fileFilter: videoFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 1 // Only 1 video per post
  }
});

export const uploadPostMedia = multer({
  storage: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, imageStorage);
    } else if (file.mimetype.startsWith('video/')) {
      cb(null, videoStorage);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  },
  fileFilter: mediaFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 5 // Maximum 5 files per post
  }
});

export const uploadProfilePicture = multer({
  storage: profileStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  }
});

// Helper functions
export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

export const generateVideoThumbnail = async (videoPublicId) => {
  try {
    const thumbnailUrl = cloudinary.url(videoPublicId, {
      resource_type: 'video',
      format: 'jpg',
      transformation: [
        { width: 640, height: 360, crop: 'fill' },
        { start_offset: '2' } // Get thumbnail from 2 seconds into video
      ]
    });
    return thumbnailUrl;
  } catch (error) {
    console.error('Error generating video thumbnail:', error);
    throw error;
  }
};

export const getOptimizedImageUrl = (publicId, width = 1080, height = 1080) => {
  return cloudinary.url(publicId, {
    width,
    height,
    crop: 'limit',
    quality: 'auto',
    fetch_format: 'auto'
  });
};

export const getOptimizedVideoUrl = (publicId) => {
  return cloudinary.url(publicId, {
    resource_type: 'video',
    quality: 'auto',
    fetch_format: 'auto'
  });
};

export default cloudinary;
