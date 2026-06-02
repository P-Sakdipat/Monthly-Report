import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/user.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';

const router = Router();

// Apply auth + admin guards to all CRUD routes
router.use(authenticateToken as any);
router.use(requireAdmin as any);

/**
 * @route   GET /api/users
 * @desc    Get all users list
 * @access  Private (Admin Only)
 */
router.get('/', getUsers);

/**
 * @route   POST /api/users
 * @desc    Create a new user
 * @access  Private (Admin Only)
 */
router.post('/', createUser);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user details
 * @access  Private (Admin Only)
 */
router.put('/:id', updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a user
 * @access  Private (Admin Only)
 */
router.delete('/:id', deleteUser as any);

export default router;
