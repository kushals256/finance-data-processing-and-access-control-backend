const rateLimit = require('express-rate-limit');
const config = require('../config/env');

/**
 * Rate Limiter Middleware
 *
 * Limits repeated requests to public and API endpoints.
 * Default: 100 requests per 15 minutes per IP.
 */
// Skip rate limiting in test environment
const skip = () => config.nodeEnv === 'test';

const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  skip,
  message: {
    success: false,
    statusCode: 429,
    message:
      'Too many requests from this IP address. Please try again later.',
  },
  standardHeaders: true,   // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,    // Disable X-RateLimit-* headers
});

/**
 * Stricter rate limiter for auth endpoints (login/register)
 * 20 requests per 15 minutes per IP.
 */
const authRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: 20,
  skip,
  message: {
    success: false,
    statusCode: 429,
    message:
      'Too many authentication attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { rateLimiter, authRateLimiter };
