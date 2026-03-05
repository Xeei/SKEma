import { Pool } from 'pg';
import { getDbConnection } from '../database/pg.database';

export interface PostReportRecord {
	id: string;
	postId: string;
	userId: string;
	reason: string | null;
	createdAt: Date;
}

const REPORT_THRESHOLD = 5;

export const createReport = async (
	postId: string,
	userId: string,
	reason?: string | null
): Promise<PostReportRecord> => {
	const pool: Pool = await getDbConnection();

	const result = await pool.query<PostReportRecord>(
		`INSERT INTO post_reports (id, "postId", "userId", reason, "createdAt")
     VALUES (gen_random_uuid(), $1, $2, $3, NOW())
     RETURNING *`,
		[postId, userId, reason ?? null]
	);

	// Count total reports for this post
	const countResult = await pool.query<{ count: string }>(
		`SELECT COUNT(*) FROM post_reports WHERE "postId" = $1`,
		[postId]
	);

	const reportCount = parseInt(countResult.rows[0].count, 10);

	// Auto-hide post when threshold is reached
	if (reportCount >= REPORT_THRESHOLD) {
		await pool.query(
			`UPDATE posts SET status = 'UNDER_REVIEW', "updatedAt" = NOW() WHERE id = $1 AND status = 'APPROVED'`,
			[postId]
		);
	}

	return result.rows[0];
};

export const getReportByUserAndPost = async (
	userId: string,
	postId: string
): Promise<PostReportRecord | null> => {
	const pool: Pool = await getDbConnection();
	const result = await pool.query<PostReportRecord>(
		`SELECT * FROM post_reports WHERE "userId" = $1 AND "postId" = $2 LIMIT 1`,
		[userId, postId]
	);
	return result.rows[0] ?? null;
};

export const getReportsByPost = async (
	postId: string
): Promise<PostReportRecord[]> => {
	const pool: Pool = await getDbConnection();
	const result = await pool.query<PostReportRecord>(
		`SELECT * FROM post_reports WHERE "postId" = $1 ORDER BY "createdAt" DESC`,
		[postId]
	);
	return result.rows;
};

export const getReportCount = async (postId: string): Promise<number> => {
	const pool: Pool = await getDbConnection();
	const result = await pool.query<{ count: string }>(
		`SELECT COUNT(*) FROM post_reports WHERE "postId" = $1`,
		[postId]
	);
	return parseInt(result.rows[0].count, 10);
};

export const dismissReports = async (postId: string): Promise<void> => {
	const pool: Pool = await getDbConnection();
	await pool.query(`DELETE FROM post_reports WHERE "postId" = $1`, [postId]);
};
