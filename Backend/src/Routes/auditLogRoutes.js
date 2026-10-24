import express from 'express';
import { getAuditLogs } from '../Controllers/auditLogController.js';
import { verifyToken, requireRole } from '../Middelwear/auth.js';

const router = express.Router();

// Only Admin can view system audit logs
router.get('/', verifyToken, requireRole(['admin']), getAuditLogs);

export default router;