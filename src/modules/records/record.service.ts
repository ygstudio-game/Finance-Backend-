import prisma from '../../config/db.js';
import { Prisma } from '@prisma/client';

/**
 * RecordService encapsulates all business logic for financial record management.
 * Supports CRUD with soft-deletes, filtering, and paginated retrieval.
 * All data access uses raw PostgreSQL queries via prisma.$queryRaw.
 */
export class RecordService {
  /**
   * Creates a new financial record linked to a user.
   */
  async createRecord(userId: string, data: { amount: number; type: string; category: string; date: string; notes?: string }) {
    const dateVal = new Date(data.date);
    const notes = data.notes ?? null;

    const rows = await prisma.$queryRaw<any[]>`
      INSERT INTO "Record" ("id", "amount", "type", "category", "date", "notes", "userId", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${data.amount}::FLOAT, ${data.type}::"RecordType", ${data.category}, ${dateVal}, ${notes}, ${userId}, NOW(), NOW())
      RETURNING *
    `;

    const record = rows[0];

    // Fetch user info to match original Prisma include shape
    const users = await prisma.$queryRaw<any[]>`
      SELECT "id", "name", "email" FROM "User" WHERE "id" = ${userId}
    `;

    return { ...record, user: users[0] || null };
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
    const { type, category, search, startDate, endDate, limit = 20 } = filters;

    // Build dynamic WHERE clauses safely using Prisma.sql fragments
    const whereClauses: Prisma.Sql[] = [Prisma.sql`"deletedAt" IS NULL`];

    if (type) {
      whereClauses.push(Prisma.sql`"type" = ${type}::"RecordType"`);
    }

    if (search) {
      whereClauses.push(
        Prisma.sql`("category" ILIKE ${'%' + search + '%'} OR "notes" ILIKE ${'%' + search + '%'})`
      );
    } else if (category) {
      whereClauses.push(Prisma.sql`"category" ILIKE ${'%' + category + '%'}`);
    }

    if (startDate) {
      whereClauses.push(Prisma.sql`"date" >= ${new Date(startDate)}`);
    }
    if (endDate) {
      whereClauses.push(Prisma.sql`"date" <= ${new Date(endDate)}`);
    }

    const whereClause = Prisma.join(whereClauses, ' AND ');

    // Fetch one extra row to determine if there's a next page (cursor-style)
    const takeCount = limit + 1;

    const recordsRaw = await prisma.$queryRaw<any[]>`
      SELECT r.*, u."id" AS "userId_join", u."name" AS "userName"
      FROM "Record" r
      LEFT JOIN "User" u ON r."userId" = u."id"
      WHERE ${whereClause}
      ORDER BY r."id" ASC
      LIMIT ${takeCount}
    `;

    // Determine next cursor
    let nextCursor: string | undefined = undefined;
    if (recordsRaw.length > limit) {
      const nextItem = recordsRaw.pop();
      nextCursor = nextItem!.id;
    }

    // Map rows to include nested user object
    const records = recordsRaw.map((row: any) => {
      const { userId_join, userName, ...rest } = row;
      return { ...rest, user: { id: userId_join, name: userName } };
    });

    // Count total matching records
    const countResult = await prisma.$queryRaw<{ total: number }[]>`
      SELECT COUNT(*)::INT AS "total"
      FROM "Record"
      WHERE ${whereClause}
    `;

    return {
      records,
      pagination: {
        cursor: filters.cursor,
        nextCursor,
        limit,
        total: countResult[0]?.total ?? 0,
      },
    };
  }

  /**
   * Updates a record by ID, ensuring the authenticated user owns it.
   */
  async updateRecord(id: string, userId: string, data: { amount?: number; category?: string; notes?: string; date?: string; type?: string }) {
    const setClauses: Prisma.Sql[] = [Prisma.sql`"updatedAt" = NOW()`];

    if (data.amount !== undefined) setClauses.push(Prisma.sql`"amount" = ${data.amount}::FLOAT`);
    if (data.category !== undefined) setClauses.push(Prisma.sql`"category" = ${data.category}`);
    if (data.notes !== undefined) setClauses.push(Prisma.sql`"notes" = ${data.notes}`);
    if (data.type !== undefined) setClauses.push(Prisma.sql`"type" = ${data.type}::"RecordType"`);
    if (data.date) setClauses.push(Prisma.sql`"date" = ${new Date(data.date)}`);

    const setClause = Prisma.join(setClauses, ', ');

    const rows = await prisma.$queryRaw<any[]>`
      UPDATE "Record"
      SET ${setClause}
      WHERE "id" = ${id} AND "userId" = ${userId}
      RETURNING *
    `;

    if (rows.length === 0) {
      // Throw error with code matching Prisma's P2025 so controller error handler works
      const error: any = new Error('Record to update not found.');
      error.code = 'P2025';
      throw error;
    }

    return rows[0];
  }

  /**
   * Performs a soft delete by setting the deletedAt timestamp.
   * Ensures the authenticated user owns the record.
   */
  async softDelete(id: string, userId: string) {
    const rows = await prisma.$queryRaw<any[]>`
      UPDATE "Record"
      SET "deletedAt" = NOW(), "updatedAt" = NOW()
      WHERE "id" = ${id} AND "userId" = ${userId} AND "deletedAt" IS NULL
      RETURNING *
    `;

    if (rows.length === 0) {
      const error: any = new Error('Record to delete not found.');
      error.code = 'P2025';
      throw error;
    }

    return rows[0];
  }

  /**
   * Fetches a single record by ID (respecting soft-deletes).
   */
  async getRecordById(id: string) {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT r.*, u."id" AS "userId_join", u."name" AS "userName"
      FROM "Record" r
      LEFT JOIN "User" u ON r."userId" = u."id"
      WHERE r."id" = ${id} AND r."deletedAt" IS NULL
      LIMIT 1
    `;

    if (rows.length === 0) return null;

    const { userId_join, userName, ...rest } = rows[0];
    return { ...rest, user: { id: userId_join, name: userName } };
  }
}
