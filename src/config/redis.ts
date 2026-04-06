import { Redis } from 'ioredis';
import { logger } from '../utils/logger.js';

// Initializes Redis connection. Expects a local Redis instance on port 6379 by default.
const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => {
  logger.info({ redis: true }, 'Successfully connected to Redis Cache');
});

redis.on('error', (err: any) => {
  logger.error({ redis: true, err }, 'Redis connection error (Ensure Redis is running locally!)');
});

export default redis;
