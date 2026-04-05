const { Parser } = require('json2csv');
const FinancialRecord = require('../models/FinancialRecord');
const { buildQuery } = require('./record.service');
const auditService = require('./audit.service');

/**
 * Export Service
 *
 * Exports filtered financial records as CSV or JSON.
 * Logs every export in the audit trail.
 */

/**
 * Export records in the specified format
 */
const exportRecords = async (filters, format, userId, req) => {
  const query = buildQuery(filters);

  const records = await FinancialRecord.find(query)
    .sort({ date: -1 })
    .populate('createdBy', 'name email')
    .lean();

  // Audit log the export
  await auditService.log({
    action: 'EXPORT',
    entity: 'FinancialRecord',
    performedBy: userId,
    metadata: {
      format,
      filters,
      recordCount: records.length,
    },
    req,
  });

  if (format === 'csv') {
    const csvFields = [
      { label: 'ID', value: '_id' },
      { label: 'Amount', value: 'amount' },
      { label: 'Type', value: 'type' },
      { label: 'Category', value: 'category' },
      { label: 'Date', value: (row) => new Date(row.date).toISOString().split('T')[0] },
      { label: 'Description', value: 'description' },
      { label: 'Notes', value: 'notes' },
      { label: 'Created By', value: (row) => row.createdBy?.name || 'N/A' },
      { label: 'Flags', value: (row) => (row.flags || []).join('; ') },
      { label: 'Created At', value: (row) => new Date(row.createdAt).toISOString() },
    ];

    const parser = new Parser({ fields: csvFields });
    const csvData = parser.parse(records);

    return {
      data: csvData,
      contentType: 'text/csv',
      filename: `financial_records_export_${Date.now()}.csv`,
    };
  }

  // JSON format
  return {
    data: JSON.stringify(records, null, 2),
    contentType: 'application/json',
    filename: `financial_records_export_${Date.now()}.json`,
  };
};

module.exports = { exportRecords };
