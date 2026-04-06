import { z } from 'zod';

/**
 * Zod schema for creating a new financial record.
 * Enforces positive amounts, valid INCOME/EXPENSE type,
 * non-empty category, and ISO 8601 date format.
 */
export const createRecordSchema = z.object({
  body: z.object({
    amount: z.number({ message: 'Amount is required' }).positive('Amount must be positive'),
    type: z.enum(['INCOME', 'EXPENSE'], {
      message: 'Type must be INCOME or EXPENSE',
    }),
    category: z.string().min(1, 'Category is required'),
    date: z.string().datetime('Date must be a valid ISO 8601 string'),
    notes: z.string().optional(),
  }),
});

/**
 * Zod schema for updating a financial record (all fields optional).
 */
export const updateRecordSchema = z.object({
  body: z.object({
    amount: z.number().positive('Amount must be positive').optional(),
    type: z.enum(['INCOME', 'EXPENSE']).optional(),
    category: z.string().min(1).optional(),
    date: z.string().datetime().optional(),
    notes: z.string().optional(),
  }),
});

/**
 * Zod schema for record query filters.
 * Supports filtering by type, category, date range, and pagination.
 */
export const recordQuerySchema = z.object({
    query: z.object({
    type: z.enum(['INCOME', 'EXPENSE']).optional(),
    search: z.string().optional(),
    category: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    cursor: z.string().optional(),
    limit: z.string().optional(),
  }),
});
