import { Router } from 'express';
import { UserController } from './user.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createUserSchema, updateUserStatusSchema, updateUserRoleSchema } from './user.validation.js';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware.js';

const router: Router = Router();
const userController = new UserController();

/**
 * @openapi
 * /api/users:
 *   post:
 *     tags: [Users]
 *     summary: Create a new user
 *     security:
 *       - xUserIdHeader: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, name, role]
 *             properties:
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, ANALYST, VIEWER]
 *     responses:
 *       201:
 *         description: User created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
// POST /api/users — Create a new user (ADMIN only)
router.post(
  '/',
  requireAuth,
  requireRole(['ADMIN']),
  validate(createUserSchema),
  userController.createUser
);

/**
 * @openapi
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: Get all users
 *     description: Retrieve a list of all users.
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
 *                 success: { type: 'boolean' }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/User' }
 */
// GET /api/users — List all users (any authenticated user)
router.get('/', requireAuth, userController.getAllUsers);

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
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
 *                 data: { $ref: '#/components/schemas/User' }
 */
// GET /api/users/:id — Get user by ID (any authenticated user)
router.get('/:id', requireAuth, userController.getUserById);

/**
 * @openapi
 * /api/users/{id}/status:
 *   patch:
 *     tags: [Users]
 *     summary: Toggle user active status
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
 *             required: [isActive]
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Status updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
// PATCH /api/users/:id/status — Toggle active/inactive (ADMIN only)
router.patch(
  '/:id/status',
  requireAuth,
  requireRole(['ADMIN']),
  validate(updateUserStatusSchema),
  userController.updateStatus
);

/**
 * @openapi
 * /api/users/{id}/role:
 *   patch:
 *     tags: [Users]
 *     summary: Update user role
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
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [ADMIN, ANALYST, VIEWER]
 *     responses:
 *       200:
 *         description: Role updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
// PATCH /api/users/:id/role — Assign a new role (ADMIN only)
router.patch(
  '/:id/role',
  requireAuth,
  requireRole(['ADMIN']),
  validate(updateUserRoleSchema),
  userController.updateRole
);

export default router;
