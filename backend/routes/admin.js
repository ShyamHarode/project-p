import express from 'express';
import { body } from 'express-validator';
import {
  createEmployee,
  getEmployees,
  updateEmployee,
  deleteEmployee,
  createRevenuePricing,
  getRevenuePricing,
  updateRevenuePricing,
  getPostsForApproval,
  approvePost,
  getAccountDashboard,
  payPostEarnings,
  getAdminStats
} from '../controllers/adminController.js';
import { authenticateToken, requireAdmin, requireAdminOrManager } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication
router.use(authenticateToken);

// Validation rules
const employeeValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('mobile')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid mobile number'),
  body('role')
    .isIn(['Manager', 'Accountant'])
    .withMessage('Role must be either Manager or Accountant'),
  body('salary')
    .optional()
    .isNumeric()
    .withMessage('Salary must be a number')
];

const revenuePricingValidation = [
  body('pricePerView')
    .isFloat({ min: 0 })
    .withMessage('Price per view must be a positive number'),
  body('pricePerLike')
    .isFloat({ min: 0 })
    .withMessage('Price per like must be a positive number'),
  body('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD'])
    .withMessage('Invalid currency'),
  body('minimumPayout')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum payout must be a positive number'),
  body('maxEarningsPerDay')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Max earnings per day must be a positive number')
];

// Employee Management (Admin only)
router.post('/employees', requireAdmin, employeeValidation, createEmployee);
router.get('/employees', requireAdminOrManager, getEmployees);
router.put('/employees/:id', requireAdmin, updateEmployee);
router.delete('/employees/:id', requireAdmin, deleteEmployee);

// Revenue Management (Admin and Manager)
router.post('/revenue', requireAdminOrManager, revenuePricingValidation, createRevenuePricing);
router.get('/revenue', requireAdminOrManager, getRevenuePricing);
router.put('/revenue/:id', requireAdminOrManager, updateRevenuePricing);

// Post Management (Admin and Manager)
router.get('/posts', requireAdminOrManager, getPostsForApproval);
router.post('/posts/:id/approve', requireAdminOrManager, approvePost);

// Account Dashboard (Admin and Manager)
router.get('/dashboard', requireAdminOrManager, getAccountDashboard);
router.post('/posts/:id/pay', requireAdminOrManager, payPostEarnings);

// Admin Statistics (Admin only)
router.get('/stats', requireAdmin, getAdminStats);

export default router;
