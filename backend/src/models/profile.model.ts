import { Pool } from 'pg';
import { getDbConnection } from '../database/pg.database';

export interface PublicProfile {
	user: {
		id: string;
		name: string | null;
	};
	stats: {
		totalPosts: number;
		approvedPosts: number;
		totalUpvotes: number;
		totalDownvotes: number;
		totalViews: number;
	};
	heatmap: Array<{ date: string; count: number }>;
	mostUpvotedPost: { id: string; title: string; upvotes: number } | null;
}

export const getPublicProfile = async (
	userId: string
): Promise<PublicProfile | null> => {
	const pool: Pool = await getDbConnection();

	// Check user exists
	const userResult = await pool.query(
		`SELECT id, name FROM users WHERE id = $1`,
		[userId]
	);
	if (userResult.rows.length === 0) return null;

	const user = userResult.rows[0];

	// Stats: all approved posts (including anonymous)
	const statsResult = await pool.query(
		`SELECT
			COUNT(*)::int                                              AS "totalPosts",
			COUNT(*) FILTER (WHERE status = 'APPROVED')::int          AS "approvedPosts",
			COALESCE(SUM(upvotes) FILTER (WHERE status = 'APPROVED'), 0)::int    AS "totalUpvotes",
			COALESCE(SUM(downvotes) FILTER (WHERE status = 'APPROVED'), 0)::int  AS "totalDownvotes",
			COALESCE(SUM(views) FILTER (WHERE status = 'APPROVED'), 0)::int      AS "totalViews"
		FROM posts
		WHERE "authorId" = $1`,
		[userId]
	);
	const stats = statsResult.rows[0];

	// Heatmap: approved posts grouped by day for last 365 days (includes anonymous)
	const heatmapResult = await pool.query(
		`SELECT
			TO_CHAR(DATE("createdAt"), 'YYYY-MM-DD') AS date,
			COUNT(*)::int                             AS count
		FROM posts
		WHERE "authorId" = $1
		  AND status = 'APPROVED'
		  AND "createdAt" >= NOW() - INTERVAL '365 days'
		GROUP BY DATE("createdAt")
		ORDER BY date ASC`,
		[userId]
	);

	// Most upvoted non-anonymous approved post
	const topPostResult = await pool.query(
		`SELECT id, title, upvotes
		FROM posts
		WHERE "authorId" = $1
		  AND status = 'APPROVED'
		  AND "isAnonymous" = false
		ORDER BY upvotes DESC
		LIMIT 1`,
		[userId]
	);

	return {
		user: { id: user.id, name: user.name },
		stats: {
			totalPosts: stats.totalPosts,
			approvedPosts: stats.approvedPosts,
			totalUpvotes: stats.totalUpvotes,
			totalDownvotes: stats.totalDownvotes,
			totalViews: stats.totalViews,
		},
		heatmap: heatmapResult.rows,
		mostUpvotedPost: topPostResult.rows[0] ?? null,
	};
};
