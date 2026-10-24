import express from 'express';
import { getMyNotifications, markAsRead } from '../Controllers/notificationController.js';
import { verifyToken } from '../Middelwear/auth.js';

const router = express.Router();

router.get('/', verifyToken, getMyNotifications);
router.patch('/:id/read', verifyToken, markAsRead);

export default router;