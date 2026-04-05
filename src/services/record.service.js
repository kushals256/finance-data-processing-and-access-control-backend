const FinancialRecord = require('../models/FinancialRecord');
const ApiError = require('../utils/ApiError');
const auditService = require('./audit.service');
const anomalyService = require('./anomaly.service');

/**
 * Financial Records Service
 *
 * Handles CRUD operations with audit logging, anomaly detection,
 * soft delete, and advanced filtering.
 */

/**
 * Build MongoDB query from filter params
 */
const buildQuery = (filters) => {
  const query = { isDeleted: false };

  if (filters.type) query.type = filters.type;
  if (filters.category) query.category = { $regex: filters.category, $options: 'i' };

  if (filters.startDate || filters.endDate) {
    query.date = {};
    if (filters.startDate) query.date.$gte = new Date(filters.startDate);
    if (filters.endDate) query.date.$lte = new Date(filters.endDate);
  }

  if (filters.search) {
    query.$text = { $search: filters.search };
  }

  if (filters.flagged === true) {
    query['flags.0'] = { $exists: true };
  } else if (filters.flagged === false) {
    query['flags.0'] = { $exists: false };
  }

  return query;
};

/**
 * Create a new financial record
 */
const createRecord = async (data, userId, req) => {
  // Run anomaly detection before creation
  const flags = await anomalyService.detectAnomalies({
    ...data,
    createdBy: userId,
  });

  const record = await FinancialRecord.create({
    ...data,
    createdBy: userId,
    flags,
  });

  // Audit log
  await auditService.log({
    action: 'CREATE',
    entity: 'FinancialRecord',
    entityId: record._id,
    performedBy: userId,
    after: record.toJSON(),
    metadata: flags.length > 0 ? { anomalyFlags: flags } : null,
    req,
  });

  return record;
};

/**
 * Get records with pagination, filtering, sorting
 */
const getRecords = async (filters, { skip, limit }) => {
  const query = buildQuery(filters);

  const sortBy = filters.sortBy || 'date';
  const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;

  const [records, total] = await Promise.all([
    FinancialRecord.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email'),
    FinancialRecord.countDocuments(query),
  ]);

  return { records, total };
};

/**
 * Get a single record by ID
 */
const getRecordById = async (id) => {
  const record = await FinancialRecord.findOne({
    _id: id,
    isDeleted: false,
  }).populate('createdBy', 'name email');

  if (!record) {
    throw ApiError.notFound('Financial record not found.');
  }

  return record;
};

/**
 * Update a financial record
 */
const updateRecord = async (id, data, userId, req) => {
  const record = await FinancialRecord.findOne({ _id: id, isDeleted: false });
  if (!record) {
    throw ApiError.notFound('Financial record not found.');
  }

  const before = record.toJSON();

  // Re-run anomaly detection if amount or category changed
  if (data.amount !== undefined || data.category !== undefined) {
    const checkData = {
      amount: data.amount || record.amount,
      category: data.category || record.category,
      createdBy: record.createdBy,
    };
    const flags = await anomalyService.detectAnomalies(checkData);
    data.flags = flags;
  }

  Object.assign(record, data);
  await record.save();

  // Audit log
  await auditService.log({
    action: 'UPDATE',
    entity: 'FinancialRecord',
    entityId: record._id,
    performedBy: userId,
    before,
    after: record.toJSON(),
    req,
  });

  return record;
};

/**
 * Soft delete a financial record
 */
const deleteRecord = async (id, userId, req) => {
  const record = await FinancialRecord.findOne({ _id: id, isDeleted: false });
  if (!record) {
    throw ApiError.notFound('Financial record not found.');
  }

  const before = record.toJSON();

  record.isDeleted = true;
  record.deletedAt = new Date();
  await record.save();

  // Audit log
  await auditService.log({
    action: 'SOFT_DELETE',
    entity: 'FinancialRecord',
    entityId: record._id,
    performedBy: userId,
    before,
    after: record.toJSON(),
    req,
  });

  return record;
};

module.exports = { createRecord, getRecords, getRecordById, updateRecord, deleteRecord, buildQuery };
