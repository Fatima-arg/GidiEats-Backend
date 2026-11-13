import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { User } from '../models';

export interface AuthUser {
  id: number;
  email: string;
  role: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No access token provided');
    }

    const token = header.slice(7);
    let payload: AuthUser;
    try {
      payload = jwt.verify(token, env.jwtSecret) as AuthUser;
    } catch {
      throw ApiError.unauthorized('Invalid or expired token');
    }

    const user = await User.findByPk(payload.id);
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('Account not found or deactivated');
    }

    req.user = user;
    next();
  } catch (e) {
    next(e);
  }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return next();
    }
    const token = header.slice(7);
    let payload: AuthUser;
    try {
      payload = jwt.verify(token, env.jwtSecret) as AuthUser;
    } catch {
      return next();
    }
    const user = await User.findByPk(payload.id);
    if (user && user.isActive) {
      req.user = user;
    }
    return next();
  } catch {
    return next();
  }
};

export const requireRoles =
  (...roles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) throw ApiError.unauthorized();
    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden('You do not have permission to perform this action');
    }
    next();
  };