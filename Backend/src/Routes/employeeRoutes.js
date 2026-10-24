import express from 'express';
import { getEmployeeDirectory, exportEmployeesCSV } from '../Controllers/employeeController.js';
import { verifyToken, requireRole } from '../Middelwear/auth.js';

const router = express.Router();

// Get Employee Directory with search and filters (Admin, HR, or Employee can view)
router.get('/directory', verifyToken, requireRole(['admin', 'hr', 'employee']), getEmployeeDirectory);

// Export Employees as CSV (Admin and HR only)
router.get('/export/csv', verifyToken, requireRole(['admin', 'hr']), exportEmployeesCSV);

export default router;