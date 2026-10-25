import express from 'express';
import { getMyNotifications, markAsRead, markAllAsRead } from '../Controllers/notificationController.js';
import { verifyToken } from '../Middelwear/auth.js';

const router = express.Router();

router.get('/', verifyToken, getMyNotifications);
router.patch('/read-all', verifyToken, markAllAsRead);
router.patch('/:id/read', verifyToken, markAsRead);

export default router;
