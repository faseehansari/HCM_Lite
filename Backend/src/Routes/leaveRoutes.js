import express from 'express';
import { applyLeave, getLeaves, updateLeaveStatus } from '../Controllers/leaveController.js';
import { verifyToken, requireRole } from '../Middelwear/auth.js';

const router = express.Router();

router.post('/apply', verifyToken, requireRole(['employee', 'hr']), applyLeave);
router.get('/', verifyToken, getLeaves);
router.patch('/:leaveId/status', verifyToken, requireRole(['admin', 'hr']), updateLeaveStatus);

export default router;