import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../../config/db.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-dev';

export class AuthController {
  /**
   * Mock login to generate a JWT for an existing user based on email.
   * Without passwords in the DB, this is a demonstration of JWT issuance.
   */
  async login(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        throw new ApiError(400, 'Email is required');
      }

      const user = await prisma.user.findUnique({
        where: { email, isActive: true },
      });

      if (!user) {
        throw new ApiError(401, 'User not found or inactive');
      }

      // Generate a JWT
      const token = jwt.sign(
        { id: user.id, role: user.role, email: user.email },
        JWT_SECRET,
        { expiresIn: '1d' } // Token expires in 1 day
      );

      return res.status(200).json(new ApiResponse(200, { token, user }, "Login successful"));
    } catch (error) {
      console.error('Error in login:', error);
      res.status(500).json({ success: false, error: 'Internal server error during login' });
    }
  }
}
