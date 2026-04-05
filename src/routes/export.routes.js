const express = require('express');
const router = express.Router();
const exportController = require('../controllers/export.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const validate = require('../middleware/validate');
const dashboardValidation = require('../validations/dashboard.validation');
const { PERMISSIONS } = require('../constants/roles');

/**
 * @swagger
 * tags:
 *   name: Export
 *   description: Data export endpoints
 */

/**
 * @swagger
 * /export/records:
 *   get:
 *     summary: Export financial records as CSV or JSON
 *     tags: [Export]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, json]
 *           default: csv
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
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
 *         description: File download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *           application/json:
 *             schema:
 *               type: array
 */
router.get(
  '/records',
  authenticate,
  authorize(PERMISSIONS.EXPORT_DATA),
  validate(dashboardValidation.exportRecords),
  exportController.exportRecords
);

module.exports = router;
