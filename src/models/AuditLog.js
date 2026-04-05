const mongoose = require('mongoose');

/**
 * Immutable Audit Log
 *
 * Captures every mutation in the system with before/after snapshots.
 * No update or delete operations should ever be performed on this collection.
 * Critical for compliance and debugging in financial systems.
 */
const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: ['CREATE', 'UPDATE', 'DELETE', 'SOFT_DELETE', 'LOGIN', 'EXPORT', 'IMPORT'],
    },
    entity: {
      type: String,
      required: true, // e.g., 'FinancialRecord', 'User'
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    correlationId: {
      type: String, // Links to the request correlation ID
    },
    before: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    after: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      immutable: true, // Cannot be changed after creation
    },
  },
  {
    // No timestamps option — we use our own immutable timestamp
    versionKey: false,
  }
);

// Indexes for efficient queries
auditLogSchema.index({ entity: 1, entityId: 1, timestamp: -1 });
auditLogSchema.index({ performedBy: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ correlationId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
