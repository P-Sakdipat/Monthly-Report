import { Router } from 'express';
import { submitReport, getKpisInit } from '../controllers/report.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Secure all report routes with JWT check
router.use(authenticateToken as any);

/**
 * @route   GET /api/reports/kpis/init
 * @desc    Initialize fixed KPIs and fetch previous month's statuses
 * @access  Private (Logged-in Users)
 */
router.get('/kpis/init', getKpisInit as any);

/**
 * @route   POST /api/reports
 * @desc    Submit a new transactional monthly report
 * @access  Private (Logged-in Users)
 */
router.post('/', submitReport);

export default router;
