import { Pool } from 'pg';
import { getDbConnection } from '../database/pg.database';

export interface PostShareData {
	id: string;
	postId: string;
	authorId: string;
	sharedUserId: string;
	sharedAt: Date;
	sharedUserName?: string | null;
	sharedUserEmail?: string;
}

// Share a post with a user
export const createPostShare = async (
	postId: string,
	authorId: string,
	sharedUserId: string
): Promise<PostShareData> => {
	const pool: Pool = await getDbConnection();
	const query = `
    INSERT INTO post_shares (id, "postId", "authorId", "sharedUserId", "sharedAt")
    VALUES (gen_random_uuid()::text, $1, $2, $3, NOW())
    RETURNING *;
  `;
	const result = await pool.query(query, [postId, authorId, sharedUserId]);
	return result.rows[0];
};

// Get all shares for a specific post (with shared user info)
export const getPostSharesByPost = async (
	postId: string
): Promise<PostShareData[]> => {
	const pool: Pool = await getDbConnection();
	const query = `
		SELECT ps.*, u.name AS "sharedUserName", u.email AS "sharedUserEmail"
		FROM post_shares ps
		JOIN users u ON u.id = ps."sharedUserId"
		WHERE ps."postId" = $1
		ORDER BY ps."sharedAt" DESC
	`;
	const result = await pool.query(query, [postId]);
	return result.rows;
};

// Get all posts shared with a specific user
export const getPostSharesByUser = async (
	sharedUserId: string
): Promise<PostShareData[]> => {
	const pool: Pool = await getDbConnection();
	const query = `SELECT * FROM post_shares WHERE "sharedUserId" = $1 ORDER BY "sharedAt" DESC`;
	const result = await pool.query(query, [sharedUserId]);
	return result.rows;
};

// Check if a post is shared with a user
export const isPostSharedWithUser = async (
	postId: string,
	sharedUserId: string
): Promise<boolean> => {
	const pool: Pool = await getDbConnection();
	const query = `SELECT 1 FROM post_shares WHERE "postId" = $1 AND "sharedUserId" = $2 LIMIT 1`;
	const result = await pool.query(query, [postId, sharedUserId]);
	return result.rowCount !== null && result.rowCount > 0;
};

// Remove a post share by id
export const deletePostShare = async (
	id: string
): Promise<PostShareData | null> => {
	const pool: Pool = await getDbConnection();
	const query = `DELETE FROM post_shares WHERE id = $1 RETURNING *;`;
	const result = await pool.query(query, [id]);
	return result.rows[0] || null;
};

// Remove a post share by postId + sharedUserId (revoke access)
export const revokePostShare = async (
	postId: string,
	sharedUserId: string
): Promise<PostShareData | null> => {
	const pool: Pool = await getDbConnection();
	const query = `DELETE FROM post_shares WHERE "postId" = $1 AND "sharedUserId" = $2 RETURNING *;`;
	const result = await pool.query(query, [postId, sharedUserId]);
	return result.rows[0] || null;
};
