const recordService = require('../services/record.service');
const importService = require('../services/import.service');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { parsePagination, getPaginationMeta } = require('../utils/pagination');

/**
 * @desc Create a financial record
 */
const createRecord = catchAsync(async (req, res) => {
  const record = await recordService.createRecord(req.body, req.user._id, req);

  ApiResponse.created(res, {
    message: record.flags.length > 0
      ? `Record created successfully. ⚠️ ${record.flags.length} anomaly flag(s) detected.`
      : 'Record created successfully',
    data: { record },
  });
});

/**
 * @desc Get all records (paginated, filterable, sortable)
 */
const getRecords = catchAsync(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { records, total } = await recordService.getRecords(req.query, { skip, limit });

  ApiResponse.paginated(res, {
    message: 'Records retrieved successfully',
    data: records,
    pagination: getPaginationMeta(page, limit, total),
  });
});

/**
 * @desc Get a single record by ID
 */
const getRecordById = catchAsync(async (req, res) => {
  const record = await recordService.getRecordById(req.params.id);

  ApiResponse.success(res, {
    message: 'Record retrieved successfully',
    data: { record },
  });
});

/**
 * @desc Update a financial record
 */
const updateRecord = catchAsync(async (req, res) => {
  const record = await recordService.updateRecord(
    req.params.id,
    req.body,
    req.user._id,
    req
  );

  ApiResponse.success(res, {
    message: 'Record updated successfully',
    data: { record },
  });
});

/**
 * @desc Soft-delete a financial record
 */
const deleteRecord = catchAsync(async (req, res) => {
  await recordService.deleteRecord(req.params.id, req.user._id, req);

  ApiResponse.success(res, {
    message: 'Record deleted successfully (soft delete)',
  });
});

/**
 * @desc Validate CSV for import (step 1)
 */
const validateImport = catchAsync(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('Please upload a CSV file.');
  }

  const report = await importService.validateImport(req.file.path);

  ApiResponse.success(res, {
    message: `Validation complete: ${report.validRows} valid, ${report.invalidRows} invalid out of ${report.totalRows} rows`,
    data: report,
  });
});

/**
 * @desc Confirm CSV import (step 2)
 */
const confirmImport = catchAsync(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('Please upload a CSV file.');
  }

  const result = await importService.confirmImport(req.file.path, req.user._id, req);

  ApiResponse.created(res, {
    message: `Import complete: ${result.inserted} records inserted, ${result.skipped} skipped`,
    data: result,
  });
});

module.exports = {
  createRecord,
  getRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
  validateImport,
  confirmImport,
};
