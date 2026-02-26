import { Request, Response } from 'express';
import {
	getNotificationsForUser,
	markNotificationRead,
	markAllNotificationsRead,
} from '../models/notification.model';

// GET /notifications?limit=20&offset=0
export const getNotificationsController = async (
	req: Request,
	res: Response
) => {
	try {
		const userId = req.user?.id;
		if (!userId) return res.status(401).json({ error: 'Unauthorized' });

		const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
		const offset = parseInt(req.query.offset as string) || 0;

		const result = await getNotificationsForUser(userId, limit, offset);
		res.json(result);
	} catch (err) {
		console.error('Error fetching notifications:', err);
		res.status(500).json({ error: 'Failed to fetch notifications' });
	}
};

// PATCH /notifications/:id/read
export const markReadController = async (req: Request, res: Response) => {
	try {
		const userId = req.user?.id;
		if (!userId) return res.status(401).json({ error: 'Unauthorized' });

		const notif = await markNotificationRead(
			req.params.id as string,
			userId
		);
		if (!notif)
			return res.status(404).json({ error: 'Notification not found' });
		res.json(notif);
	} catch (err) {
		console.error('Error marking notification read:', err);
		res.status(500).json({ error: 'Failed to update notification' });
	}
};

// PATCH /notifications/read-all
export const markAllReadController = async (req: Request, res: Response) => {
	try {
		const userId = req.user?.id;
		if (!userId) return res.status(401).json({ error: 'Unauthorized' });

		await markAllNotificationsRead(userId);
		res.json({ success: true });
	} catch (err) {
		console.error('Error marking all notifications read:', err);
		res.status(500).json({ error: 'Failed to update notifications' });
	}
};
