import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
	getNotificationsController,
	markReadController,
	markAllReadController,
} from '../controllers/notification.controller';

const router = Router();

router.get('/', authMiddleware, getNotificationsController);
router.patch('/read-all', authMiddleware, markAllReadController);
router.patch('/:id/read', authMiddleware, markReadController);

export default router;
