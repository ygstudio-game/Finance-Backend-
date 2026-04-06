import { pino } from 'pino';

/**
 * Enterprise structured logger instance.
 * Uses pino-pretty during development for readability,
 * and outputs raw JSON in production schemas.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            ignore: 'pid,hostname,req,res,reqId',
            messageFormat: '{msg}',
          },
        }
      : undefined,
});
