const AuditLog = require('../models/AuditLog');
const { getCorrelationId } = require('../config/logger');
const logger = require('../config/logger');

/**
 * Audit Service
 *
 * Provides immutable audit logging for all mutations in the system.
 * Every create, update, delete, login, export, and import is logged
 * with before/after snapshots and request metadata.
 */

/**
 * Log an auditable action
 *
 * @param {Object} params
 * @param {string} params.action - Action type (CREATE, UPDATE, DELETE, etc.)
 * @param {string} params.entity - Entity name (FinancialRecord, User)
 * @param {ObjectId} params.entityId - ID of the affected entity
 * @param {ObjectId} params.performedBy - ID of the user performing the action
 * @param {Object} params.before - State before the change (null for CREATE)
 * @param {Object} params.after - State after the change (null for DELETE)
 * @param {Object} params.metadata - Additional context
 * @param {Object} params.req - Express request object (for IP/User-Agent)
 */
const log = async ({ action, entity, entityId, performedBy, before = null, after = null, metadata = null, req = null }) => {
  try {
    await AuditLog.create({
      action,
      entity,
      entityId,
      performedBy,
      correlationId: getCorrelationId(),
      before,
      after,
      metadata,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.get?.('user-agent'),
    });
  } catch (error) {
    // Audit logging should never break the main operation
    logger.error(`Audit log failed: ${error.message}`, { action, entity, entityId });
  }
};

/**
 * Get audit trail for a specific entity
 */
const getEntityTrail = async (entity, entityId, { skip, limit }) => {
  const [logs, total] = await Promise.all([
    AuditLog.find({ entity, entityId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('performedBy', 'name email role'),
    AuditLog.countDocuments({ entity, entityId }),
  ]);

  return { logs, total };
};

/**
 * Get all audit logs with filters (admin)
 */
const getAuditLogs = async (filters, { skip, limit }) => {
  const query = {};

  if (filters.action) query.action = filters.action;
  if (filters.entity) query.entity = filters.entity;
  if (filters.startDate || filters.endDate) {
    query.timestamp = {};
    if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
    if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('performedBy', 'name email role'),
    AuditLog.countDocuments(query),
  ]);

  return { logs, total };
};

module.exports = { log, getEntityTrail, getAuditLogs };
