import { Pool } from 'pg';
import { getDbConnection } from '../database/pg.database';

export interface LeaderboardEntry {
	rank: number;
	userId: string;
	name: string | null;
	email: string;
	totalPosts: number;
	approvedPosts: number;
	totalUpvotes: number;
	totalDownvotes: number;
	totalViews: number;
}

export const getTopUsers = async (limit = 10): Promise<LeaderboardEntry[]> => {
	const pool: Pool = await getDbConnection();

	const result = await pool.query(
		`SELECT
			ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(p.upvotes), 0) DESC, COALESCE(SUM(p.views), 0) DESC) AS rank,
			u.id                                                                       AS "userId",
			u.name,
			u.email,
			COUNT(p.id)::int                                                           AS "totalPosts",
			COUNT(p.id) FILTER (WHERE p.status = 'APPROVED')::int                     AS "approvedPosts",
			COALESCE(SUM(p.upvotes)::int, 0)                                          AS "totalUpvotes",
			COALESCE(SUM(p.downvotes)::int, 0)                                        AS "totalDownvotes",
			COALESCE(SUM(p.views)::int, 0)                                            AS "totalViews"
		FROM users u
		LEFT JOIN posts p ON p."authorId" = u.id AND p.status = 'APPROVED' AND p."isAnonymous" = false
		GROUP BY u.id, u.name, u.email
		ORDER BY "totalUpvotes" DESC, "totalViews" DESC
		LIMIT $1`,
		[limit]
	);

	return result.rows;
};
