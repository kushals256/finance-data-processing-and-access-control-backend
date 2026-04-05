const IdempotencyKey = require('../models/IdempotencyKey');
const logger = require('../config/logger');

/**
 * Idempotency Middleware
 *
 * Prevents duplicate financial transactions on network retries.
 *
 * Flow:
 * 1. Client sends request with `Idempotency-Key` header
 * 2. If key exists → return cached response (no re-processing)
 * 3. If key is new → process request, intercept response, cache it
 * 4. If no key provided → skip idempotency (proceed normally)
 *
 * Keys auto-expire after 24 hours via MongoDB TTL index.
 */
const idempotency = async (req, res, next) => {
  const idempotencyKey = req.headers['idempotency-key'];

  // If no key provided, skip idempotency check
  if (!idempotencyKey) {
    return next();
  }

  try {
    // Check for existing key
    const existing = await IdempotencyKey.findOne({
      key: idempotencyKey,
      userId: req.user._id,
    });

    if (existing) {
      // Return cached response
      logger.info(`Idempotency key hit: ${idempotencyKey} — returning cached response`);
      return res.status(existing.statusCode).json(existing.responseBody);
    }

    // Intercept the response to cache it
    const originalJson = res.json.bind(res);
    res.json = async (body) => {
      try {
        await IdempotencyKey.create({
          key: idempotencyKey,
          userId: req.user._id,
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
          responseBody: body,
        });
      } catch (cacheError) {
        // Don't fail the request if caching fails (e.g., race condition)
        logger.warn(`Failed to cache idempotency key: ${cacheError.message}`);
      }

      return originalJson(body);
    };

    next();
  } catch (error) {
    // Don't fail requests due to idempotency issues
    logger.error(`Idempotency middleware error: ${error.message}`);
    next();
  }
};

module.exports = idempotency;
