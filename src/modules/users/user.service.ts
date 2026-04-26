import prisma from '../../config/db.js';

/**
 * UserService encapsulates all business logic for user management.
 * Responsible for CRUD operations, role assignment, and status toggling.
 * All data access uses raw PostgreSQL queries via prisma.$queryRaw.
 */
export class UserService {
  /**
   * Creates a new user. If no role is provided, defaults to VIEWER.
   */
  async createUser(data: { email: string; name: string; role?: string }) {
    try {
      const role = data.role || 'VIEWER';
      const rows = await prisma.$queryRaw<any[]>`
        INSERT INTO "User" ("id", "email", "name", "role", "isActive", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), ${data.email}, ${data.name}, ${role}::"Role", true, NOW(), NOW())
        RETURNING *
      `;
      return rows[0];
    } catch (error: any) {
      // PostgreSQL unique violation code = 23505 → re-throw as P2002 for controller compatibility
      if (error?.code === '23505') {
        const wrapped: any = new Error('Unique constraint failed');
        wrapped.code = 'P2002';
        throw wrapped;
      }
      throw error;
    }
  }

  /**
   * Returns all users in the system, ordered by creation date descending.
   */
  async getAllUsers() {
    return prisma.$queryRaw<any[]>`
      SELECT * FROM "User"
      ORDER BY "createdAt" DESC
    `;
  }

  /**
   * Finds a single user by their UUID.
   */
  async getUserById(id: string) {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT * FROM "User"
      WHERE "id" = ${id}
      LIMIT 1
    `;
    return rows[0] || null;
  }

  /**
   * Toggles a user's active/inactive status.
   * Inactive users will fail auth middleware checks.
   */
  async updateStatus(id: string, isActive: boolean) {
    const rows = await prisma.$queryRaw<any[]>`
      UPDATE "User"
      SET "isActive" = ${isActive}, "updatedAt" = NOW()
      WHERE "id" = ${id}
      RETURNING *
    `;

    if (rows.length === 0) {
      const error: any = new Error('User not found.');
      error.code = 'P2025';
      throw error;
    }

    return rows[0];
  }

  /**
   * Updates a user's role (VIEWER, ANALYST, or ADMIN).
   * Only callable by ADMIN users (enforced at the route layer).
   */
  async updateRole(id: string, role: string) {
    const rows = await prisma.$queryRaw<any[]>`
      UPDATE "User"
      SET "role" = ${role}::"Role", "updatedAt" = NOW()
      WHERE "id" = ${id}
      RETURNING *
    `;

    if (rows.length === 0) {
      const error: any = new Error('User not found.');
      error.code = 'P2025';
      throw error;
    }

    return rows[0];
  }
}
