const mongoose = require('mongoose');

/**
 * Idempotency Key Store
 *
 * Prevents duplicate financial transactions caused by network retries.
 * When a client sends a POST/PATCH with an Idempotency-Key header:
 * - If the key exists → return the cached response
 * - If the key is new → process the request and cache the response
 * - Keys auto-expire after 24 hours via MongoDB TTL index
 */
const idempotencyKeySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    method: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    statusCode: {
      type: Number,
    },
    responseBody: {
      type: mongoose.Schema.Types.Mixed,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 86400, // TTL: 24 hours (in seconds)
    },
  },
  {
    versionKey: false,
  }
);

// Compound index: key is unique per user
idempotencyKeySchema.index({ key: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('IdempotencyKey', idempotencyKeySchema);
