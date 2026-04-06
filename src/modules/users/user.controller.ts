import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service.js';
import { AuditService } from '../audit/audit.service.js';
import { AuthRequest } from '../../middlewares/auth.middleware.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';

const userService = new UserService();

/**
 * UserController handles HTTP layer concerns for user management.
 * It delegates business logic to UserService and formats HTTP responses.
 */
export class UserController {
  async createUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await userService.createUser(req.body);
      AuditService.log(req.user!.id, 'CREATE_USER', 'User', user.id, req.body);
      return res.status(201).json(new ApiResponse(201, user, "User created successfully"));
    } catch (error: any) {
      // Handle unique email constraint violation
      if (error?.code === 'P2002') {
        throw new ApiError(409, 'A user with this email already exists');
      }
      next(error);
    }
  }

  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await userService.getAllUsers();
      return res.status(200).json(new ApiResponse(200, users, "Users retrieved successfully"));
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.getUserById(req.params.id as string);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }
      return res.status(200).json(new ApiResponse(200, user, "User retrieved successfully"));
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await userService.updateStatus(req.params.id as string, req.body.isActive);
      AuditService.log(req.user!.id, 'UPDATE_USER_STATUS', 'User', user.id, { isActive: req.body.isActive });
      return res.status(200).json(new ApiResponse(200, user, "User status updated successfully"));
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new ApiError(404, 'User not found');
      }
      next(error);
    }
  }

  async updateRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await userService.updateRole(req.params.id as string, req.body.role);
      AuditService.log(req.user!.id, 'UPDATE_USER_ROLE', 'User', user.id, { role: req.body.role });
      return res.status(200).json(new ApiResponse(200, user, "User role updated successfully"));
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new ApiError(404, 'User not found');
      }
      next(error);
    }
  }
}
