import express from 'express';
import { body } from 'express-validator';
import {
  getComment,
  updateComment,
  deleteComment,
  toggleCommentLike,
  getCommentReplies
} from '../controllers/commentController.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Validation rules
const updateCommentValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment must be between 1 and 500 characters')
];

// Public routes
router.get('/:id', optionalAuth, getComment);
router.get('/:commentId/replies', optionalAuth, getCommentReplies);

// Protected routes
router.use(authenticateToken); // All routes below require authentication

router.put('/:id', updateCommentValidation, updateComment);
router.delete('/:id', deleteComment);
router.post('/:id/like', toggleCommentLike);

export default router;
