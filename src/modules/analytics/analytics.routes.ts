import { Router } from 'express';
import { AnalyticsController } from './analytics.controller.js';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware.js';

const router: Router = Router();
const analyticsController = new AnalyticsController();

/**
 * @openapi
 * /api/analytics/summary:
 *   get:
 *     tags: [Analytics]
 *     summary: Get dashboard summary
 *     security:
 *       - xUserIdHeader: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
// GET /api/analytics/summary — Dashboard overview (ADMIN, ANALYST)
router.get(
  '/summary',
  requireAuth,
  requireRole(['ADMIN', 'ANALYST']),
  analyticsController.getSummary
);

/**
 * @openapi
 * /api/analytics/breakdown:
 *   get:
 *     tags: [Analytics]
 *     summary: Get category-wise breakdown
 *     security:
 *       - xUserIdHeader: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
// GET /api/analytics/breakdown — Category-wise breakdown (ADMIN, ANALYST)
router.get(
  '/breakdown',
  requireAuth,
  requireRole(['ADMIN', 'ANALYST']),
  analyticsController.getBreakdown
);

/**
 * @openapi
 * /api/analytics/trends:
 *   get:
 *     tags: [Analytics]
 *     summary: Get monthly trends
 *     security:
 *       - xUserIdHeader: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
// GET /api/analytics/trends — Monthly income/expense trends (ADMIN, ANALYST)
router.get(
  '/trends',
  requireAuth,
  requireRole(['ADMIN', 'ANALYST']),
  analyticsController.getTrends
);

export default router;
