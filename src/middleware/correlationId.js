const { v4: uuidv4 } = require('uuid');
const { asyncLocalStorage } = require('../config/logger');

/**
 * Correlation ID Middleware
 *
 * Attaches a unique correlation ID to every request for end-to-end tracing.
 * - Reads from X-Correlation-ID header if provided (e.g., from upstream services)
 * - Generates a new UUID v4 if not present
 * - Stores in AsyncLocalStorage for automatic propagation to logs
 * - Sets X-Correlation-ID in response headers
 */
const correlationId = (req, res, next) => {
  const id = req.headers['x-correlation-id'] || uuidv4();
  req.correlationId = id;
  res.setHeader('X-Correlation-ID', id);

  // Run the rest of the request within the async local storage context
  asyncLocalStorage.run({ correlationId: id }, () => {
    next();
  });
};

module.exports = correlationId;
