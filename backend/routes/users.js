import express from 'express';
import { query } from 'express-validator';
import {
  getUserProfile,
  getUsers,
  toggleFollow,
  getUserFollowers,
  getUserFollowing,
  getFollowSuggestions,
  getUserPosts,
  searchUsers
} from '../controllers/userController.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Validation rules
const searchValidation = [
  query('q')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters long')
];

// Public routes
router.get('/search', searchValidation, optionalAuth, searchUsers);
router.get('/', optionalAuth, getUsers);
router.get('/:id', optionalAuth, getUserProfile);
router.get('/:id/posts', optionalAuth, getUserPosts);
router.get('/:id/followers', optionalAuth, getUserFollowers);
router.get('/:id/following', optionalAuth, getUserFollowing);

// Protected routes
router.use(authenticateToken); // All routes below require authentication

router.get('/suggestions/follow', getFollowSuggestions);
router.post('/:id/follow', toggleFollow);

export default router;
