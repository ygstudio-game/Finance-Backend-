import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from './analytics.service.js';
import redis from '../../config/redis.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

const analyticsService = new AnalyticsService();

/**
 * AnalyticsController handles HTTP requests for dashboard analytics.
 * All endpoints return pre-aggregated data suitable for frontend charts.
 */
export class AnalyticsController {
  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      let cached: string | null = null;
      try {
        cached = await redis.get('analytics:summary');
      } catch (err) { /* ignore redis error */ }
      
      if (cached) return res.status(200).json(new ApiResponse(200, JSON.parse(cached), "Summary retrieved from cache"));

      const summary = await analyticsService.getDashboardSummary();
      try {
        await redis.set('analytics:summary', JSON.stringify(summary), 'EX', 300); // 5 minutes
      } catch (err) { /* ignore redis error */ }
      return res.status(200).json(new ApiResponse(200, summary, "Summary retrieved successfully"));
    } catch (error) {
      next(error);
    }
  }

  async getBreakdown(req: Request, res: Response, next: NextFunction) {
    try {
      let cached: string | null = null;
      try {
        cached = await redis.get('analytics:breakdown');
      } catch (err) { /* ignore redis error */ }

      if (cached) return res.status(200).json(new ApiResponse(200, JSON.parse(cached), "Breakdown retrieved from cache"));

      const breakdown = await analyticsService.getCategoryBreakdown();
      try {
        await redis.set('analytics:breakdown', JSON.stringify(breakdown), 'EX', 300);
      } catch (err) { /* ignore redis error */ }
      return res.status(200).json(new ApiResponse(200, breakdown, "Breakdown retrieved successfully"));
    } catch (error) {
      next(error);
    }
  }

  async getTrends(req: Request, res: Response, next: NextFunction) {
    try {
      let cached: string | null = null;
      try {
        cached = await redis.get('analytics:trends');
      } catch (err) { /* ignore redis error */ }

      if (cached) return res.status(200).json(new ApiResponse(200, JSON.parse(cached), "Trends retrieved from cache"));

      const trends = await analyticsService.getMonthlyTrends();
      try {
        await redis.set('analytics:trends', JSON.stringify(trends), 'EX', 300);
      } catch (err) { /* ignore redis error */ }
      return res.status(200).json(new ApiResponse(200, trends, "Trends retrieved successfully"));
    } catch (error) {
      next(error);
    }
  }
}
