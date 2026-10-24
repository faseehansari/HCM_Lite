import express from 'express';
import { checkIn, checkOut, getAttendance } from '../Controllers/attendanceController.js';
import { verifyToken, requireRole } from '../Middelwear/auth.js';

const router = express.Router();

// Both Employee and HR can check-in and check-out
router.post('/check-in', verifyToken, requireRole(['employee', 'hr']), checkIn);
router.post('/check-out', verifyToken, requireRole(['employee', 'hr']), checkOut);

// Get attendance records (Employee gets own, HR/Admin gets all)
router.get('/', verifyToken, requireRole(['employee', 'hr', 'admin']), getAttendance);

export default router;