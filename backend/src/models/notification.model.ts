import { Pool } from 'pg';
import { getDbConnection } from '../database/pg.database';

export type NotificationType =
	| 'POST_APPROVED'
	| 'POST_REJECTED'
	| 'NEW_POST_PENDING';

export interface NotificationRecord {
	id: string;
	userId: string;
	type: NotificationType;
	message: string;
	postId: string | null;
	isRead: boolean;
	createdAt: Date;
}

// Create a single notification for one user
export const createNotification = async (
	userId: string,
	type: NotificationType,
	message: string,
	postId?: string | null
): Promise<NotificationRecord> => {
	const pool: Pool = await getDbConnection();
	const result = await pool.query(
		`INSERT INTO notifications ("userId", type, message, "postId")
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
		[userId, type, message, postId ?? null]
	);
	return result.rows[0];
};

// Create the same notification for multiple users (bulk for privileged broadcast)
export const createNotificationsForMany = async (
	userIds: string[],
	type: NotificationType,
	message: string,
	postId?: string | null
): Promise<void> => {
	if (userIds.length === 0) return;
	const pool: Pool = await getDbConnection();
	const values = userIds
		.map(
			(_, i) =>
				`($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`
		)
		.join(', ');
	const params: unknown[] = userIds.flatMap((id) => [
		id,
		type,
		message,
		postId ?? null,
	]);
	await pool.query(
		`INSERT INTO notifications ("userId", type, message, "postId") VALUES ${values}`,
		params
	);
};

// Get notifications for a user (most recent first, paginated)
export const getNotificationsForUser = async (
	userId: string,
	limit: number = 20,
	offset: number = 0
): Promise<{ data: NotificationRecord[]; total: number; unread: number }> => {
	const pool: Pool = await getDbConnection();

	const [rowsResult, countResult] = await Promise.all([
		pool.query(
			`SELECT * FROM notifications WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT $2 OFFSET $3`,
			[userId, limit, offset]
		),
		pool.query(
			`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE "isRead" = false)::int AS unread
             FROM notifications WHERE "userId" = $1`,
			[userId]
		),
	]);

	return {
		data: rowsResult.rows,
		total: countResult.rows[0].total,
		unread: countResult.rows[0].unread,
	};
};

// Mark a single notification read (only if it belongs to userId)
export const markNotificationRead = async (
	id: string,
	userId: string
): Promise<NotificationRecord | null> => {
	const pool: Pool = await getDbConnection();
	const result = await pool.query(
		`UPDATE notifications SET "isRead" = true WHERE id = $1 AND "userId" = $2 RETURNING *`,
		[id, userId]
	);
	return result.rows[0] ?? null;
};

// Mark all notifications read for a user
export const markAllNotificationsRead = async (
	userId: string
): Promise<void> => {
	const pool: Pool = await getDbConnection();
	await pool.query(
		`UPDATE notifications SET "isRead" = true WHERE "userId" = $1`,
		[userId]
	);
};

// Get all privileged (ADMIN/TRUSTED) user IDs
export const getPrivilegedUserIds = async (): Promise<string[]> => {
	const pool: Pool = await getDbConnection();
	const result = await pool.query(
		`SELECT id FROM users WHERE role IN ('ADMIN', 'TRUSTED')`
	);
	return result.rows.map((r: { id: string }) => r.id);
};
