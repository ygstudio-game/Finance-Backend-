import prisma from '../../config/db.js';

/**
 * UserService encapsulates all business logic for user management.
 * Responsible for CRUD operations, role assignment, and status toggling.
 */
export class UserService {
  /**
   * Creates a new user. If no role is provided, defaults to VIEWER (set by Prisma schema).
   */
  async createUser(data: { email: string; name: string; role?: string }) {
    return prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        ...(data.role && { role: data.role as any }),
      },
    });
  }

  /**
   * Returns all users in the system, ordered by creation date descending.
   */
  async getAllUsers() {
    return prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Finds a single user by their UUID.
   */
  async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Toggles a user's active/inactive status.
   * Inactive users will fail auth middleware checks.
   */
  async updateStatus(id: string, isActive: boolean) {
    return prisma.user.update({
      where: { id },
      data: { isActive },
    });
  }

  /**
   * Updates a user's role (VIEWER, ANALYST, or ADMIN).
   * Only callable by ADMIN users (enforced at the route layer).
   */
  async updateRole(id: string, role: string) {
    return prisma.user.update({
      where: { id },
      data: { role: role as any },
    });
  }
}
