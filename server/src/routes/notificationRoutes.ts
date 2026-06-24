import { Router } from 'express';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notificationController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);

export default router;
