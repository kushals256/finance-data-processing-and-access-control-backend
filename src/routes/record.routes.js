const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const recordController = require('../controllers/record.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const validate = require('../middleware/validate');
const idempotency = require('../middleware/idempotency');
const recordValidation = require('../validations/record.validation');
const { PERMISSIONS } = require('../constants/roles');
const config = require('../config/env');

// Multer config for CSV uploads
const upload = multer({
  dest: path.join(__dirname, '../../uploads/'),
  limits: { fileSize: config.csv.maxFileSizeMB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
});

/**
 * @swagger
 * tags:
 *   name: Records
 *   description: Financial records management
 */

/**
 * @swagger
 * /records:
 *   post:
 *     summary: Create a financial record
 *     tags: [Records]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: header
 *         name: Idempotency-Key
 *         schema:
 *           type: string
 *         description: Optional idempotency key to prevent duplicate transactions
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, type, category, date]
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 1500.50
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *                 example: income
 *               category:
 *                 type: string
 *                 example: Salary
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2025-01-15"
 *               description:
 *                 type: string
 *                 example: Monthly salary
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Record created (may include anomaly flags)
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 */
router.post(
  '/',
  authenticate,
  authorize(PERMISSIONS.CREATE_RECORD),
  idempotency,
  validate(recordValidation.createRecord),
  recordController.createRecord
);

/**
 * @swagger
 * /records:
 *   get:
 *     summary: Get financial records (paginated, filterable)
 *     tags: [Records]
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
 *           default: 10
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Full-text search in description and notes
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [date, amount, category, createdAt]
 *           default: date
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *       - in: query
 *         name: flagged
 *         schema:
 *           type: boolean
 *         description: Filter records with anomaly flags
 *     responses:
 *       200:
 *         description: Paginated records list
 */
router.get(
  '/',
  authenticate,
  authorize(PERMISSIONS.VIEW_RECORDS),
  validate(recordValidation.getRecords),
  recordController.getRecords
);

/**
 * @swagger
 * /records/{id}:
 *   get:
 *     summary: Get a financial record by ID
 *     tags: [Records]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Record details
 *       404:
 *         description: Record not found
 */
router.get(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.VIEW_RECORDS),
  validate(recordValidation.getRecordById),
  recordController.getRecordById
);

/**
 * @swagger
 * /records/{id}:
 *   patch:
 *     summary: Update a financial record
 *     tags: [Records]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: header
 *         name: Idempotency-Key
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *               category:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Record updated
 *       404:
 *         description: Record not found
 */
router.patch(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.UPDATE_RECORD),
  idempotency,
  validate(recordValidation.updateRecord),
  recordController.updateRecord
);

/**
 * @swagger
 * /records/{id}:
 *   delete:
 *     summary: Soft-delete a financial record
 *     tags: [Records]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Record soft-deleted
 *       404:
 *         description: Record not found
 */
router.delete(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.DELETE_RECORD),
  validate(recordValidation.deleteRecord),
  recordController.deleteRecord
);

/**
 * @swagger
 * /records/import/validate:
 *   post:
 *     summary: Validate a CSV file for import (Step 1)
 *     tags: [Records]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Validation report
 */
router.post(
  '/import/validate',
  authenticate,
  authorize(PERMISSIONS.IMPORT_RECORDS),
  upload.single('file'),
  recordController.validateImport
);

/**
 * @swagger
 * /records/import/confirm:
 *   post:
 *     summary: Confirm CSV import — insert valid rows (Step 2)
 *     tags: [Records]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Import results
 */
router.post(
  '/import/confirm',
  authenticate,
  authorize(PERMISSIONS.IMPORT_RECORDS),
  upload.single('file'),
  recordController.confirmImport
);

module.exports = router;
