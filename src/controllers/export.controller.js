const exportService = require('../services/export.service');
const ApiResponse = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');

/**
 * @desc Export financial records as CSV or JSON
 */
const exportRecords = catchAsync(async (req, res) => {
  const format = req.query.format || 'csv';
  const result = await exportService.exportRecords(req.query, format, req.user._id, req);

  res.setHeader('Content-Type', result.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
  res.send(result.data);
});

module.exports = { exportRecords };
