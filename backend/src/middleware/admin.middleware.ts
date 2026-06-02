import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';

/**
 * Middleware to restrict endpoint access exclusively to Administrator accounts.
 */
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Unauthorized: Session required.' 
    });
  }

  const role = String(req.user.role_level).toLowerCase().trim();

  // Allow admin and superadmin roles
  if (role === 'admin' || role === 'superadmin') {
    return next();
  }

  return res.status(403).json({ 
    success: false, 
    message: 'Forbidden: Admin privileges required.' 
  });
};
