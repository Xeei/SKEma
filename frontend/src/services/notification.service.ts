import axios from 'axios';

const instance = axios.create({
	baseURL: '/api/proxy/notifications',
});

export type NotificationType = 'POST_APPROVED' | 'POST_REJECTED' | 'NEW_POST_PENDING';

export interface NotificationData {
	id: string;
	userId: string;
	type: NotificationType;
	message: string;
	postId: string | null;
	isRead: boolean;
	createdAt: string;
}

export interface NotificationsResponse {
	data: NotificationData[];
	total: number;
	unread: number;
}

export const fetchNotifications = async (
	limit = 20,
	offset = 0
): Promise<NotificationsResponse> => {
	const { data } = await instance.get('/', { params: { limit, offset } });
	return data;
};

export const markNotificationRead = async (id: string): Promise<NotificationData> => {
	const { data } = await instance.patch(`/${id}/read`);
	return data;
};

export const markAllNotificationsRead = async (): Promise<void> => {
	await instance.patch('/read-all');
};
