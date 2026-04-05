const fs = require('fs');
const csv = require('csv-parser');
const Joi = require('joi');
const FinancialRecord = require('../models/FinancialRecord');
const auditService = require('./audit.service');
const anomalyService = require('./anomaly.service');
const logger = require('../config/logger');

/**
 * CSV Import Service
 *
 * Two-step import flow:
 * 1. Validate: Upload CSV → parse → validate each row → return validation report
 * 2. Confirm: Upload CSV → parse → insert valid rows → return import summary
 */

// Row validation schema
const rowSchema = Joi.object({
  amount: Joi.number().positive().required(),
  type: Joi.string().valid('income', 'expense').required(),
  category: Joi.string().trim().min(2).max(50).required(),
  date: Joi.date().iso().required(),
  description: Joi.string().trim().max(500).allow('').optional(),
  notes: Joi.string().trim().max(1000).allow('').optional(),
});

/**
 * Parse CSV file into rows
 */
const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', (err) => reject(err));
  });
};

/**
 * Validate CSV rows - returns validation report
 */
const validateImport = async (filePath) => {
  const rows = await parseCSV(filePath);

  const validRows = [];
  const errors = [];

  rows.forEach((row, index) => {
    // Convert amount to number
    if (row.amount) row.amount = parseFloat(row.amount);

    const { error, value } = rowSchema.validate(row, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      errors.push({
        row: index + 1,
        data: row,
        errors: error.details.map((d) => ({
          field: d.path.join('.'),
          message: d.message.replace(/"/g, ''),
        })),
      });
    } else {
      validRows.push(value);
    }
  });

  // Cleanup uploaded file
  fs.unlinkSync(filePath);

  return {
    totalRows: rows.length,
    validRows: validRows.length,
    invalidRows: errors.length,
    errors,
    preview: validRows.slice(0, 5), // Show first 5 valid rows
  };
};

/**
 * Confirm CSV import - insert valid rows
 */
const confirmImport = async (filePath, userId, req) => {
  const rows = await parseCSV(filePath);

  let inserted = 0;
  let skipped = 0;
  const insertedIds = [];

  for (const row of rows) {
    if (row.amount) row.amount = parseFloat(row.amount);

    const { error, value } = rowSchema.validate(row, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      skipped++;
      continue;
    }

    try {
      // Run anomaly detection
      const flags = await anomalyService.detectAnomalies({
        ...value,
        createdBy: userId,
      });

      const record = await FinancialRecord.create({
        ...value,
        createdBy: userId,
        flags,
      });

      insertedIds.push(record._id);
      inserted++;
    } catch (err) {
      logger.warn(`Import row failed: ${err.message}`);
      skipped++;
    }
  }

  // Cleanup uploaded file
  fs.unlinkSync(filePath);

  // Audit log the import
  await auditService.log({
    action: 'IMPORT',
    entity: 'FinancialRecord',
    performedBy: userId,
    metadata: {
      totalRows: rows.length,
      inserted,
      skipped,
      recordIds: insertedIds,
    },
    req,
  });

  return { totalRows: rows.length, inserted, skipped };
};

module.exports = { validateImport, confirmImport };
