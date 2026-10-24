import express from 'express';
import { updateCompanySettings, registerEmployee } from '../Controllers/orgController.js';
import { verifyToken, requireRole } from '../Middelwear/auth.js';
import { registerHR } from '../Controllers/orgController.js';

const router = express.Router();

router.post('/settings', verifyToken, requireRole(['admin']), updateCompanySettings);
router.post('/hr', verifyToken, requireRole(['admin']), registerHR);
router.post('/employees', verifyToken, requireRole(['admin', 'hr']), registerEmployee);

export default router;