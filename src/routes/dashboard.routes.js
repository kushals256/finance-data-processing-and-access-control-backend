const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const validate = require('../middleware/validate');
const dashboardValidation = require('../validations/dashboard.validation');
const { PERMISSIONS } = require('../constants/roles');

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard analytics and summary endpoints
 */

/**
 * @swagger
 * /dashboard/summary:
 *   get:
 *     summary: Get financial summary (income, expense, net balance)
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Financial summary with totals, counts, and averages
 */
router.get(
  '/summary',
  authenticate,
  authorize(PERMISSIONS.VIEW_DASHBOARD_SUMMARY),
  validate(dashboardValidation.getSummary),
  dashboardController.getSummary
);

/**
 * @swagger
 * /dashboard/category-breakdown:
 *   get:
 *     summary: Get category-wise totals with percentages
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Category breakdown with percentages
 */
router.get(
  '/category-breakdown',
  authenticate,
  authorize(PERMISSIONS.VIEW_CATEGORY_BREAKDOWN),
  validate(dashboardValidation.getCategoryBreakdown),
  dashboardController.getCategoryBreakdown
);

/**
 * @swagger
 * /dashboard/monthly-trends:
 *   get:
 *     summary: Get monthly income/expense trends
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *           example: 2025
 *     responses:
 *       200:
 *         description: Monthly trend data with income, expense, and net for each month
 */
router.get(
  '/monthly-trends',
  authenticate,
  authorize(PERMISSIONS.VIEW_TRENDS),
  validate(dashboardValidation.getMonthlyTrends),
  dashboardController.getMonthlyTrends
);

/**
 * @swagger
 * /dashboard/weekly-trends:
 *   get:
 *     summary: Get last 7 days income/expense trends
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Daily breakdown for the last 7 days
 */
router.get(
  '/weekly-trends',
  authenticate,
  authorize(PERMISSIONS.VIEW_TRENDS),
  dashboardController.getWeeklyTrends
);

/**
 * @swagger
 * /dashboard/recent-activity:
 *   get:
 *     summary: Get recent financial transactions
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *     responses:
 *       200:
 *         description: Recent transactions
 */
router.get(
  '/recent-activity',
  authenticate,
  authorize(PERMISSIONS.VIEW_RECENT_ACTIVITY),
  validate(dashboardValidation.getRecentActivity),
  dashboardController.getRecentActivity
);

/**
 * @swagger
 * /dashboard/anomaly-stats:
 *   get:
 *     summary: Get anomaly detection statistics
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Count of flagged records by flag type
 */
router.get(
  '/anomaly-stats',
  authenticate,
  authorize(PERMISSIONS.VIEW_ANALYTICS),
  dashboardController.getAnomalyStats
);

/**
 * @swagger
 * tags:
 *   name: Audit Logs
 *   description: Immutable audit trail (Admin only)
 */

/**
 * @swagger
 * /audit-logs:
 *   get:
 *     summary: Get all audit logs (paginated, filterable)
 *     tags: [Audit Logs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [CREATE, UPDATE, DELETE, SOFT_DELETE, LOGIN, EXPORT, IMPORT]
 *       - in: query
 *         name: entity
 *         schema:
 *           type: string
 *           enum: [FinancialRecord, User]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Paginated audit logs
 */
router.get(
  '/audit-logs',
  authenticate,
  authorize(PERMISSIONS.VIEW_AUDIT_LOGS),
  validate(dashboardValidation.getAuditLogs),
  dashboardController.getAuditLogs
);

/**
 * @swagger
 * /audit-logs/{entity}/{entityId}:
 *   get:
 *     summary: Get audit trail for a specific entity
 *     tags: [Audit Logs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entity
 *         required: true
 *         schema:
 *           type: string
 *           enum: [FinancialRecord, User]
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Entity audit trail
 */
router.get(
  '/audit-logs/:entity/:entityId',
  authenticate,
  authorize(PERMISSIONS.VIEW_AUDIT_LOGS),
  validate(dashboardValidation.getEntityAuditTrail),
  dashboardController.getEntityAuditTrail
);

module.exports = router;
