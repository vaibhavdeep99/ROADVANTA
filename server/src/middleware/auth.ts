import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { demoUsers } from '../data/store';
import { User } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // If not authenticated, proceed without user
    next();
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as { id: string; role: string; email: string };
    const foundUser = demoUsers.find((u) => u.id === decoded.id) || {
      id: decoded.id,
      name: decoded.email.split('@')[0],
      email: decoded.email,
      role: decoded.role as any,
      createdAt: new Date().toISOString(),
    };
    req.user = foundUser;
    next();
  } catch (err) {
    // Expired or invalid token
    res.status(401).json({ success: false, error: { message: 'Invalid or expired session token' } });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: { message: 'Authentication required' } });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: { message: 'Unauthorized role for this action' } });
      return;
    }
    next();
  };
};
