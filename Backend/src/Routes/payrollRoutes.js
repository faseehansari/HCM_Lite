import express from 'express';
import { generatePayroll, getPayrolls, markAsPaid, finalizePayroll, downloadPayslipPDF } from '../Controllers/payrollController.js';
import { verifyToken, requireRole } from '../Middelwear/auth.js';

const router = express.Router();

router.post('/generate', verifyToken, requireRole(['admin', 'hr']), generatePayroll);
router.post('/finalize', verifyToken, requireRole(['admin']), finalizePayroll); // Admin only
router.get('/', verifyToken, getPayrolls);
router.patch('/:payrollId/pay', verifyToken, requireRole(['admin', 'hr']), markAsPaid);
router.get('/:payrollId/payslip', verifyToken, downloadPayslipPDF); // Employee (own) & HR/Admin

export default router;