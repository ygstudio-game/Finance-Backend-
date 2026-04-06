import { Response, NextFunction } from 'express';
import { RecordService } from './record.service.js';
import { AuthRequest } from '../../middlewares/auth.middleware.js';
import { AuditService } from '../audit/audit.service.js';
import redis from '../../config/redis.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';

const invalidateCache = async () => {
  try {
    await redis.del('analytics:summary', 'analytics:breakdown', 'analytics:trends');
  } catch (err) {
    // Ignore invalidation failure gracefully
  }
};

const recordService = new RecordService();

/**
 * RecordController handles HTTP layer concerns for financial records.
 * Extracts data from the request, delegates to RecordService, and formats responses.
 */
export class RecordController {
  async createRecord(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const record = await recordService.createRecord(req.user!.id, req.body);
      AuditService.log(req.user!.id, 'CREATE_RECORD', 'Record', record.id, req.body);
      await invalidateCache();
      return res.status(201).json(new ApiResponse(201, record, "Record created successfully"));
    } catch (error) {
      next(error);
    }
  }

  async getRecords(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { type, category, search, startDate, endDate, cursor, limit } = req.query as any;
      const result = await recordService.getRecords({
        type,
        category,
        search,
        startDate,
        endDate,
        cursor,
        limit: limit ? parseInt(limit, 10) : undefined,
      });
      return res.status(200).json(new ApiResponse(200, result, "Records retrieved successfully"));
    } catch (error) {
      next(error);
    }
  }

  async getRecordById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const record = await recordService.getRecordById(req.params.id as string);
      if (!record) {
        throw new ApiError(404, 'Record not found');
      }
      return res.status(200).json(new ApiResponse(200, record, "Record retrieved successfully"));
    } catch (error) {
      next(error);
    }
  }

  async updateRecord(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const record = await recordService.updateRecord(req.params.id as string, req.user!.id, req.body);
      AuditService.log(req.user!.id, 'UPDATE_RECORD', 'Record', record.id, req.body);
      await invalidateCache();
      return res.status(200).json(new ApiResponse(200, record, "Record updated successfully"));
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new ApiError(404, 'Record not found');
      }
      next(error);
    }
  }

  async deleteRecord(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await recordService.softDelete(req.params.id as string, req.user!.id);
      AuditService.log(req.user!.id, 'SOFT_DELETE_RECORD', 'Record', req.params.id as string, {});
      await invalidateCache();
      return res.status(200).json(new ApiResponse(200, null, "Record soft-deleted successfully"));
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new ApiError(404, 'Record not found');
      }
      next(error);
    }
  }
}
