const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');
const { getCorrelationId } = require('../config/logger');

/**
 * Global Error Handler
 *
 * Catches all errors and returns a standardized response.
 * Handles:
 * - ApiError (operational errors)
 * - Mongoose ValidationError
 * - Mongoose CastError (invalid ObjectId)
 * - MongoDB duplicate key error (11000)
 * - JWT errors
 * - Unknown/programming errors
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  // Log the error
  logger.error(`${error.message}`, {
    statusCode: error.statusCode,
    path: req.originalUrl,
    method: req.method,
    ...(err.isOperational ? {} : { stack: err.stack }),
  });

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    error = ApiError.badRequest('Validation failed', errors);
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    error = ApiError.badRequest(`Invalid ${err.path}: ${err.value}`);
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = ApiError.conflict(`Duplicate value for '${field}'. This ${field} already exists.`);
  }

  // JWT errors (fallback — normally caught in auth middleware)
  if (err.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('Invalid token');
  }
  if (err.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('Token has expired');
  }

  const statusCode = error.statusCode || 500;
  const message = error.statusCode ? error.message : 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(error.errors && error.errors.length > 0 && { errors: error.errors }),
    correlationId: getCorrelationId(),
  });
};

module.exports = errorHandler;
