import prisma from '../../config/db.js';

/**
 * RecordService encapsulates all business logic for financial record management.
 * Supports CRUD with soft-deletes, filtering, and paginated retrieval.
 */
export class RecordService {
  /**
   * Creates a new financial record linked to a user.
   */
  async createRecord(userId: string, data: { amount: number; type: string; category: string; date: string; notes?: string }) {
    return prisma.record.create({
      data: {
        amount: data.amount,
        type: data.type as any,
        category: data.category,
        date: new Date(data.date),
        notes: data.notes,
        userId,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  /**
   * Retrieves records with filtering and pagination.
   * Excludes soft-deleted records automatically.
   * Returns both the records and the total count for pagination metadata.
   */
  async getRecords(filters: {
    type?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    cursor?: string;
    limit?: number;
  }) {
    const { type, category, search, startDate, endDate, cursor, limit = 20 } = filters;

    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { category: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } }
      ];
    } else if (category) {
      where.category = { contains: category, mode: 'insensitive' };
    }
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const queryArgs: any = {
      where,
      orderBy: { id: 'asc' }, // Cursor relies on a unique sorted field
      take: limit + 1, // Take one extra to determine if there's a next page
      include: { user: { select: { id: true, name: true } } },
    };

    if (cursor) {
      queryArgs.cursor = { id: cursor };
      // Often, you skip the cursor itself so it isn't repeated:
      // queryArgs.skip = 1;
    }

    const recordsRaw = await prisma.record.findMany(queryArgs);
    
    let nextCursor: string | undefined = undefined;
    if (recordsRaw.length > limit) {
      const nextItem = recordsRaw.pop();
      nextCursor = nextItem!.id;
    }

    const total = await prisma.record.count({ where });

    return {
      records: recordsRaw,
      pagination: {
        cursor,
        nextCursor,
        limit,
        total,
      },
    };
  }

  /**
   * Updates a record by ID, ensuring the authenticated user owns it.
   */
  async updateRecord(id: string, userId: string, data: { amount?: number; category?: string; notes?: string; date?: string; type?: string }) {
    const updateData: any = {};
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.type !== undefined) updateData.type = data.type as any;
    if (data.date) updateData.date = new Date(data.date);

    return prisma.record.update({
      where: { id, userId }, // Enforcement: must match both ID and Owner
      data: updateData,
    });
  }

  /**
   * Performs a soft delete by setting the deletedAt timestamp.
   * Ensures the authenticated user owns the record.
   */
  async softDelete(id: string, userId: string) {
    return prisma.record.update({
      where: { id, userId }, // Enforcement: must match both ID and Owner
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Fetches a single record by ID (respecting soft-deletes).
   */
  async getRecordById(id: string) {
    return prisma.record.findFirst({
      where: { id, deletedAt: null },
      include: { user: { select: { id: true, name: true } } },
    });
  }
}
