const dashboardService = require('../services/dashboard.service');
const auditService = require('../services/audit.service');
const ApiResponse = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');
const { parsePagination, getPaginationMeta } = require('../utils/pagination');

/**
 * @desc Get financial summary (income, expense, net balance)
 */
const getSummary = catchAsync(async (req, res) => {
  const summary = await dashboardService.getSummary(req.query);

  ApiResponse.success(res, {
    message: 'Dashboard summary retrieved successfully',
    data: summary,
  });
});

/**
 * @desc Get category breakdown with percentages
 */
const getCategoryBreakdown = catchAsync(async (req, res) => {
  const breakdown = await dashboardService.getCategoryBreakdown(req.query);

  ApiResponse.success(res, {
    message: 'Category breakdown retrieved successfully',
    data: breakdown,
  });
});

/**
 * @desc Get monthly trends
 */
const getMonthlyTrends = catchAsync(async (req, res) => {
  const trends = await dashboardService.getMonthlyTrends(req.query.year);

  ApiResponse.success(res, {
    message: 'Monthly trends retrieved successfully',
    data: trends,
  });
});

/**
 * @desc Get weekly trends (last 7 days)
 */
const getWeeklyTrends = catchAsync(async (req, res) => {
  const trends = await dashboardService.getWeeklyTrends();

  ApiResponse.success(res, {
    message: 'Weekly trends retrieved successfully',
    data: trends,
  });
});

/**
 * @desc Get recent activity
 */
const getRecentActivity = catchAsync(async (req, res) => {
  const limit = req.query.limit || 10;
  const records = await dashboardService.getRecentActivity(limit);

  ApiResponse.success(res, {
    message: 'Recent activity retrieved successfully',
    data: records,
  });
});

/**
 * @desc Get anomaly statistics
 */
const getAnomalyStats = catchAsync(async (req, res) => {
  const stats = await dashboardService.getAnomalyStats();

  ApiResponse.success(res, {
    message: 'Anomaly statistics retrieved successfully',
    data: stats,
  });
});

/**
 * @desc Get audit logs (admin only)
 */
const getAuditLogs = catchAsync(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { logs, total } = await auditService.getAuditLogs(req.query, { skip, limit });

  ApiResponse.paginated(res, {
    message: 'Audit logs retrieved successfully',
    data: logs,
    pagination: getPaginationMeta(page, limit, total),
  });
});

/**
 * @desc Get audit trail for a specific entity
 */
const getEntityAuditTrail = catchAsync(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { entity, entityId } = req.params;
  const { logs, total } = await auditService.getEntityTrail(entity, entityId, { skip, limit });

  ApiResponse.paginated(res, {
    message: 'Entity audit trail retrieved successfully',
    data: logs,
    pagination: getPaginationMeta(page, limit, total),
  });
});

module.exports = {
  getSummary,
  getCategoryBreakdown,
  getMonthlyTrends,
  getWeeklyTrends,
  getRecentActivity,
  getAnomalyStats,
  getAuditLogs,
  getEntityAuditTrail,
};
