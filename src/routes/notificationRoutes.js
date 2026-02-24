import express from 'express';
import { getMyNotifications, markAllRead, clearAll } from '../controllers/notificationController.js';
import { protect, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, authorizeRoles('driver'), getMyNotifications);
router.put('/read-all', protect, authorizeRoles('driver'), markAllRead);
router.delete('/clear', protect, authorizeRoles('driver'), clearAll);

export default router;
