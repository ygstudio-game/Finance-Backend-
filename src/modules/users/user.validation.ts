import { z } from 'zod';

/**
 * Zod schema for creating a new user.
 * Enforces valid email format, minimum name length, and restricts
 * the role field to one of our three defined roles.
 */
export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    role: z.enum(['VIEWER', 'ANALYST', 'ADMIN']).optional(),
  }),
});

/**
 * Zod schema for toggling user active status.
 */
export const updateUserStatusSchema = z.object({
  body: z.object({
    isActive: z.boolean({ message: 'isActive is required' }),
  }),
});

/**
 * Zod schema for updating a user's role.
 * Only ADMIN users should be able to call this endpoint (enforced by RBAC middleware).
 */
export const updateUserRoleSchema = z.object({
  body: z.object({
    role: z.enum(['VIEWER', 'ANALYST', 'ADMIN'], {
      message: 'Role must be VIEWER, ANALYST, or ADMIN',
    }),
  }),
});
