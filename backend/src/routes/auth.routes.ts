import { Router } from 'express';
import { login, getMe } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   POST /api/auth/login
 * @desc    Log in user, get JWT token
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   GET /api/auth/me
 * @desc    Retrieve logged-in user profile
 * @access  Private (Requires JWT token)
 */
router.get('/me', authenticateToken as any, getMe);

export default router;
