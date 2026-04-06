import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('CRITICAL: JWT_SECRET must be defined in production environment!');
}

const SECRET = JWT_SECRET || 'fallback-secret-key-for-dev';

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const legacyUserId = req.headers['x-user-id'] as string; // Keep for backward compatibility with initial tests

    let decodedUserId: string | null = null;
    let decodedRole: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (!token) {
        throw new ApiError(401, 'Malformed Authorization header');
      }
      const decoded = jwt.verify(token, SECRET) as any;
      decodedUserId = decoded.id;
      decodedRole = decoded.role;
    } else if (legacyUserId) {
      decodedUserId = legacyUserId;
    } else {
      throw new ApiError(401, 'Authentication required');
    }

    if (!decodedUserId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    // Verify user in db (optional but good practice to ensure they are still active, even if JWT is valid)
    const user = await prisma.user.findUnique({
      where: { id: decodedUserId, isActive: true },
    });

    if (!user) {
      throw new ApiError(401, 'Invalid or inactive user');
    }

    req.user = { id: user.id, role: user.role };
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      throw new ApiError(401, 'Invalid or expired token');
    }
    next(error);
  }
};

export const requireRole = (roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || !roles.includes(req.user.role)) {
    throw new ApiError(403, 'Access denied: insufficient permissions');
  }
  next();
};
