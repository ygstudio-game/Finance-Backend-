import { Router, Request, Response } from 'express';
import { AuthController } from './auth.controller.js';

const router: Router = Router();
const authController = new AuthController();

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login (Mock)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: 'boolean' }
 *                 token: { type: 'string' }
 *                 user: { $ref: '#/components/schemas/User' }
 */
// POST /api/auth/login — Mock login (generates JWT based on email)
router.post('/login', authController.login.bind(authController));

export default router;
