import { Router } from 'express';
import { RecordController } from './record.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createRecordSchema, updateRecordSchema, recordQuerySchema } from './record.validation.js';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware.js';

const router: Router = Router();
const recordController = new RecordController();

/**
 * @openapi
 * /api/records:
 *   get:
 *     tags: [Records]
 *     summary: Get all records
 *     description: Retrieve a list of records with formatting, filtering, and pagination.
 *     security:
 *       - xUserIdHeader: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Record'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total: { type: 'integer' }
 *                     page: { type: 'integer' }
 *                     limit: { type: 'integer' }
 *                     pages: { type: 'integer' }
 */
// GET /api/records — List records with filters and pagination (ADMIN, ANALYST)
router.get(
  '/',
  requireAuth,
  requireRole(['ADMIN', 'ANALYST']),
  validate(recordQuerySchema),
  recordController.getRecords
);

/**
 * @openapi
 * /api/records/{id}:
 *   get:
 *     tags: [Records]
 *     summary: Get record by ID
 *     security:
 *       - xUserIdHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: 'boolean' }
 *                 data: { $ref: '#/components/schemas/Record' }
 */
// GET /api/records/:id — Get a single record by ID (ADMIN, ANALYST)
router.get(
  '/:id',
  requireAuth,
  requireRole(['ADMIN', 'ANALYST']),
  recordController.getRecordById
);

/**
 * @openapi
 * /api/records:
 *   post:
 *     tags: [Records]
 *     summary: Create a new record
 *     security:
 *       - xUserIdHeader: []
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
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE]
 *               category:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Record created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
// POST /api/records — Create a new record (ADMIN only)
router.post(
  '/',
  requireAuth,
  requireRole(['ADMIN']),
  validate(createRecordSchema),
  recordController.createRecord
);

/**
 * @openapi
 * /api/records/{id}:
 *   put:
 *     tags: [Records]
 *     summary: Update an existing record
 *     security:
 *       - xUserIdHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
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
 *                 enum: [INCOME, EXPENSE]
 *               category:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Record updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
// PUT /api/records/:id — Update a record (ADMIN only)
router.put(
  '/:id',
  requireAuth,
  requireRole(['ADMIN']),
  validate(updateRecordSchema),
  recordController.updateRecord
);

/**
 * @openapi
 * /api/records/{id}:
 *   delete:
 *     tags: [Records]
 *     summary: Soft-delete a record
 *     security:
 *       - xUserIdHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Record deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
// DELETE /api/records/:id — Soft-delete a record (ADMIN only)
router.delete(
  '/:id',
  requireAuth,
  requireRole(['ADMIN']),
  recordController.deleteRecord
);

export default router;
