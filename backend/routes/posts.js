import express from 'express';
import { body } from 'express-validator';
import {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost,
  toggleLike,
  addView,
  getPostsByHashtag,
  getTrendingHashtags,
  getUserLikedPosts
} from '../controllers/postController.js';
import {
  addComment,
  getPostComments,
  getCommentReplies,
  updateComment,
  deleteComment,
  toggleCommentLike,
  getComment
} from '../controllers/commentController.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { uploadPostMedia } from '../config/cloudinary.js';

const router = express.Router();

// Validation rules
const createPostValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 280 })
    .withMessage('Post content must be between 1 and 280 characters')
];

const updatePostValidation = [
  body('content')
    .optional()
    .trim()
    .isLength({ min: 1, max: 280 })
    .withMessage('Post content must be between 1 and 280 characters')
];

const viewValidation = [
  body('viewDuration')
    .optional()
    .isNumeric()
    .withMessage('View duration must be a number')
];

const commentValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment must be between 1 and 500 characters'),
  body('parentComment')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent comment ID')
];

// Public routes
router.get('/', optionalAuth, getPosts);
router.get('/trending/hashtags', getTrendingHashtags);
router.get('/hashtag/:hashtag', optionalAuth, getPostsByHashtag);
router.get('/:id', optionalAuth, getPost);

// Comment routes (public)
router.get('/:postId/comments', optionalAuth, getPostComments);

// Protected routes
router.use(authenticateToken); // All routes below require authentication

// User's liked posts
router.get('/user/liked', getUserLikedPosts);

// Post CRUD operations
router.post('/', uploadPostMedia.array('media', 5), createPostValidation, createPost);
router.put('/:id', updatePostValidation, updatePost);
router.delete('/:id', deletePost);

// Post interactions
router.post('/:id/like', toggleLike);
router.post('/:id/view', viewValidation, addView);

// Comment operations
router.post('/:postId/comments', commentValidation, addComment);

export default router;
