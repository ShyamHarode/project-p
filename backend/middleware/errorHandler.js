import mongoose from 'mongoose';

// Global error handling middleware
export const errorHandler = (error, req, res, next) => {
  let err = { ...error };
  err.message = error.message;

  console.error('Error:', error);

  // Mongoose bad ObjectId
  if (error.name === 'CastError') {
    const message = 'Resource not found';
    err = {
      message,
      statusCode: 404,
      success: false
    };
  }

  // Mongoose duplicate key
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    const message = `${field} already exists`;
    err = {
      message,
      statusCode: 400,
      success: false
    };
  }

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const message = Object.values(error.errors).map(val => val.message).join(', ');
    err = {
      message,
      statusCode: 400,
      success: false
    };
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    err = {
      message,
      statusCode: 401,
      success: false
    };
  }

  if (error.name === 'TokenExpiredError') {
    const message = 'Token expired';
    err = {
      message,
      statusCode: 401,
      success: false
    };
  }

  // File upload errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    const message = 'File size too large';
    err = {
      message,
      statusCode: 400,
      success: false
    };
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Too many files uploaded';
    err = {
      message,
      statusCode: 400,
      success: false
    };
  }

  // Rate limiting errors
  if (error.status === 429) {
    const message = 'Too many requests, please try again later';
    err = {
      message,
      statusCode: 429,
      success: false
    };
  }

  // Default error
  const statusCode = err.statusCode || error.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

// Async error handler wrapper
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 404 handler
export const notFound = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Validation error helper
export const createValidationError = (message, field = null) => {
  const error = new Error(message);
  error.statusCode = 400;
  error.field = field;
  return error;
};

// Custom API Error class
export class ApiError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.success = false;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Success response helper
export const sendSuccessResponse = (res, statusCode = 200, message = 'Success', data = null) => {
  const response = {
    success: true,
    message
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

// Error response helper
export const sendErrorResponse = (res, statusCode = 500, message = 'Internal Server Error', errors = null) => {
  const response = {
    success: false,
    message
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};
