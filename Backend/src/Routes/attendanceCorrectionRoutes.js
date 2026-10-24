import express from 'express';
import { requestCorrection, getCorrectionRequests, reviewCorrectionRequest } from '../Controllers/attendanceCorrectionController.js';
import { verifyToken, requireRole } from '../Middelwear/auth.js';

const router = express.Router();

router.post('/request', verifyToken, requireRole(['employee', 'hr']), requestCorrection);
router.get('/', verifyToken, getCorrectionRequests);
router.patch('/:requestId/review', verifyToken, requireRole(['admin', 'hr']), reviewCorrectionRequest);

export default router;