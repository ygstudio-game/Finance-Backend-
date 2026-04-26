import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttpPkg from 'pino-http';
const pinoHttp = (pinoHttpPkg as any).default || pinoHttpPkg;
import { randomUUID } from 'crypto';
import { logger } from './utils/logger.js';
import { errorHandler } from './utils/errorHandler.js';
import userRoutes from './modules/users/user.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';
import recordRoutes from './modules/records/record.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerDocs } from './config/swagger.js';
import { globalRateLimiter } from './middlewares/rateLimiter.middleware.js';

const app: Application = express();
app.set('trust proxy', 1);

// ─── Global Middlewares ───────────────────────────────────────────────
app.use(cors());
app.use(helmet());
app.use(
  pinoHttp({
    logger,
    genReqId: (req: any, res: any) => {
      const id = req.headers['x-request-id'] || randomUUID();
      res.setHeader('x-request-id', id);
      return id;
    },
    // Short status messages
    customSuccessMessage: (req: any, res: any) => `${req.method} ${req.url} -> ${res.statusCode}`,
    customErrorMessage: (req: any, res: any, err: Error) => `${req.method} ${req.url} -> ${res.statusCode} (${err.message})`,
    // Omit heavy req/res objects
    serializers: {
      req: () => undefined,
      res: () => undefined,
    },
  })
);
app.use(express.json());
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: `go to ${req.protocol}://${req.get('host')}/api-docs/ for api Documentation`,
    timestamp: new Date().toISOString(),
  });
});
// ─── Health Check ─────────────────────────────────────────────────────
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Zorvyn Finance API is running',
    timestamp: new Date().toISOString(),
  });
});

// ─── API Documentation ────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// ─── Domain Routes ────────────────────────────────────────────────────
app.use(globalRateLimiter); // Apply rate limiter to all domain routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/analytics', analyticsRoutes);

// ─── Global Error Handler (must be last) ──────────────────────────────
app.use(errorHandler);

export default app;
