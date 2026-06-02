import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface UserPayload {
  user_id: number;
  username: string;
  role_level: number | string;
  department: string;
}

/**
 * Custom request interface to append authenticated user details
 */
export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

/**
 * Middleware to protect API routes. Verifies the JWT bearer token.
 */
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access Denied: No token provided.' 
    });
  }

  const jwtSecret = process.env.JWT_SECRET || 'dashboard_super_secret_key_2026_change_me';

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Forbidden: Invalid or expired token.' 
      });
    }

    req.user = decoded as UserPayload;
    next();
  });
};
