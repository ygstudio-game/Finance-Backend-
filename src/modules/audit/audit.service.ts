import prisma from '../../config/db.js';
import { logger } from '../../utils/logger.js';

export class AuditService {
  /**
   * Logs a critical action to the immutable AuditLog database.
   * Emits a warning log if it fails, but does not crash the main thread.
   */
  static async log(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    payload: any
  ) {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          entityType,
          entityId,
          payload,
        },
      });
      logger.info({ audit: true, action, userId, entityId }, 'Audit log created');
    } catch (error) {
      // We don't necessarily want to fail the parent request if auditing fails occasionally,
      // but we must log it critically.
      logger.error({ err: error, action, payload }, 'FAILED TO WRITE AUDIT LOG');
    }
  }
}
