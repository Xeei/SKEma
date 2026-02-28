import { Pool } from 'pg';
import { getDbConnection } from '../database/pg.database';

export interface PostMetadata {
	id: string;
	title: string;
	content: string;
	description?: string | null;
	link?: string | null;
	authorId: string;
	privacy: string;
	status: 'PENDING' | 'APPROVED' | 'REJECTED';
	views: number;
	upvotes: number;
	downvotes: number;
	category?: string | null;
	tags: string[];
	folderId?: string | null;
	isAnonymous: boolean;
	createdAt: Date;
	updatedAt: Date;
	authorName?: string;
	authorEmail?: string;
	fileCount?: number;
}

export type VoteType = 'UPVOTE' | 'DOWNVOTE';

export interface PostVoteResult {
	voteType: VoteType | null; // null means the vote was removed
	upvotes: number;
	downvotes: number;
}

export interface PostFileMetadata {
	id: string;
	postId: string;
	fileId: string;
	order: number;
	createdAt: Date;
	filename?: string;
	originalName?: string;
	mimetype?: string;
	size?: number;
}

export interface PaginationMetadata {
	total: number;
	page: number;
	limit: number;
	totalPages: number;
	hasNext: boolean;
	hasPrev: boolean;
}

export interface PaginatedResponse<T> {
	data: T[];
	pagination: PaginationMetadata;
}

export const createPost = async (
	title: string,
	content: string,
	authorId: string,
	description?: string | null,
	link?: string | null,
	privacy?: string,
	category?: string | null,
	tags?: string[],
	folderId?: string | null,
	isAnonymous?: boolean,
	status?: string
): Promise<PostMetadata> => {
	const pool: Pool = await getDbConnection();
	const queryText = `
        INSERT INTO posts (id, title, content, description, link, "authorId", privacy, category, tags, "folderId", "isAnonymous", status, "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        RETURNING *;
    `;

	const values = [
		title,
		content,
		description || null,
		link || null,
		authorId,
		privacy || 'PUBLIC',
		category || null,
		tags || [],
		folderId || null,
		isAnonymous ?? false,
		status || 'APPROVED',
	];
	const result = await pool.query(queryText, values);
	return result.rows[0];
};

export const getAllPosts = async (
	page: number = 1,
	limit: number = 10
): Promise<PaginatedResponse<PostMetadata>> => {
	const pool: Pool = await getDbConnection();
	const offset = (page - 1) * limit;

	// Get total count
	const countQuery = `SELECT COUNT(DISTINCT p.id)::int as count FROM posts p WHERE p.status = 'APPROVED'`;
	const countResult = await pool.query(countQuery);
	const total = countResult.rows[0].count;

	// Get paginated data
	const queryText = `
        SELECT 
            p.*,
            CASE WHEN p."isAnonymous" THEN NULL ELSE u.name END as "authorName",
            CASE WHEN p."isAnonymous" THEN NULL ELSE u.email END as "authorEmail",
            COUNT(pf.id)::int as "fileCount"
        FROM posts p
        LEFT JOIN users u ON p."authorId" = u.id
        LEFT JOIN post_files pf ON p.id = pf."postId"
        WHERE p.status = 'APPROVED'
        GROUP BY p.id, u.name, u.email
        ORDER BY p."createdAt" DESC
        LIMIT $1 OFFSET $2;
    `;
	const result = await pool.query(queryText, [limit, offset]);

	const totalPages = Math.ceil(total / limit);

	return {
		data: result.rows,
		pagination: {
			total,
			page,
			limit,
			totalPages,
			hasNext: page < totalPages,
			hasPrev: page > 1,
		},
	};
};

export const getPostById = async (id: string): Promise<PostMetadata | null> => {
	const pool: Pool = await getDbConnection();
	const queryText = `
        SELECT 
            p.*,
            CASE WHEN p."isAnonymous" THEN NULL ELSE u.name END as "authorName",
            CASE WHEN p."isAnonymous" THEN NULL ELSE u.email END as "authorEmail",
            COUNT(pf.id)::int as "fileCount"
        FROM posts p
        LEFT JOIN users u ON p."authorId" = u.id
        LEFT JOIN post_files pf ON p.id = pf."postId"
        WHERE p.id = $1
        GROUP BY p.id, u.name, u.email;
    `;

	const values = [id];
	const result = await pool.query(queryText, values);
	return result.rows[0] || null;
};

export const getPostsByAuthor = async (
	authorId: string
): Promise<PostMetadata[]> => {
	const pool: Pool = await getDbConnection();
	const queryText = `
        SELECT 
            p.*,
            CASE WHEN p."isAnonymous" THEN NULL ELSE u.name END as "authorName",
            CASE WHEN p."isAnonymous" THEN NULL ELSE u.email END as "authorEmail",
            COUNT(pf.id)::int as "fileCount"
        FROM posts p
        LEFT JOIN users u ON p."authorId" = u.id
        LEFT JOIN post_files pf ON p.id = pf."postId"
        WHERE p."authorId" = $1
        GROUP BY p.id, u.name, u.email
        ORDER BY p."createdAt" DESC;
    `;

	const values = [authorId];
	const result = await pool.query(queryText, values);
	return result.rows;
};

export const getPublicPosts = async (
	page: number = 1,
	limit: number = 10
): Promise<PaginatedResponse<PostMetadata>> => {
	const pool: Pool = await getDbConnection();
	const offset = (page - 1) * limit;

	// Get total count
	const countQuery = `SELECT COUNT(DISTINCT p.id)::int as count FROM posts p WHERE p.privacy = 'PUBLIC' AND p.status = 'APPROVED'`;
	const countResult = await pool.query(countQuery);
	const total = countResult.rows[0].count;

	// Get paginated data
	const queryText = `
        SELECT 
            p.*,
            CASE WHEN p."isAnonymous" THEN NULL ELSE u.name END as "authorName",
            CASE WHEN p."isAnonymous" THEN NULL ELSE u.email END as "authorEmail",
            COUNT(pf.id)::int as "fileCount"
        FROM posts p
        LEFT JOIN users u ON p."authorId" = u.id
        LEFT JOIN post_files pf ON p.id = pf."postId"
        WHERE p.privacy = 'PUBLIC' AND p.status = 'APPROVED'
        GROUP BY p.id, u.name, u.email
        ORDER BY p."createdAt" DESC
        LIMIT $1 OFFSET $2;
    `;
	const result = await pool.query(queryText, [limit, offset]);

	const totalPages = Math.ceil(total / limit);

	return {
		data: result.rows,
		pagination: {
			total,
			page,
			limit,
			totalPages,
			hasNext: page < totalPages,
			hasPrev: page > 1,
		},
	};
};

export const updatePost = async (
	id: string,
	title?: string,
	content?: string,
	description?: string | null,
	link?: string | null,
	privacy?: string,
	category?: string | null,
	tags?: string[],
	folderId?: string | null
): Promise<PostMetadata | null> => {
	const pool: Pool = await getDbConnection();

	// Build dynamic update query
	const updates: string[] = [];
	const values: any[] = [];
	let paramCount = 1;

	if (title !== undefined) {
		updates.push(`title = $${paramCount++}`);
		values.push(title);
	}
	if (content !== undefined) {
		updates.push(`content = $${paramCount++}`);
		values.push(content);
	}
	if (description !== undefined) {
		updates.push(`description = $${paramCount++}`);
		values.push(description);
	}
	if (link !== undefined) {
		updates.push(`link = $${paramCount++}`);
		values.push(link);
	}
	if (privacy !== undefined) {
		updates.push(`privacy = $${paramCount++}`);
		values.push(privacy);
	}
	if (category !== undefined) {
		updates.push(`category = $${paramCount++}`);
		values.push(category);
	}
	if (tags !== undefined) {
		updates.push(`tags = $${paramCount++}`);
		values.push(tags);
	}
	if (folderId !== undefined) {
		updates.push(`"folderId" = $${paramCount++}`);
		values.push(folderId);
	}

	if (updates.length === 0) {
		return getPostById(id);
	}

	updates.push(`"updatedAt" = NOW()`);
	values.push(id);

	const queryText = `
        UPDATE posts
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *;
    `;

	const result = await pool.query(queryText, values);
	return result.rows[0] || null;
};

export const deletePost = async (id: string): Promise<PostMetadata | null> => {
	const pool: Pool = await getDbConnection();
	const queryText = `
        DELETE FROM posts
        WHERE id = $1
        RETURNING *;
    `;

	const values = [id];
	const result = await pool.query(queryText, values);
	return result.rows[0] || null;
};

export const incrementPostViews = async (id: string): Promise<void> => {
	const pool: Pool = await getDbConnection();
	const queryText = `
        UPDATE posts
        SET views = views + 1,
            "updatedAt" = NOW()
        WHERE id = $1;
    `;

	const values = [id];
	await pool.query(queryText, values);
};

// PostFile operations
export const addFileToPost = async (
	postId: string,
	fileId: string,
	order: number = 0
): Promise<PostFileMetadata> => {
	const pool: Pool = await getDbConnection();
	const queryText = `
        INSERT INTO post_files (id, "postId", "fileId", "order", "createdAt")
        VALUES (gen_random_uuid(), $1, $2, $3, NOW())
        RETURNING *;
    `;

	const values = [postId, fileId, order];
	const result = await pool.query(queryText, values);
	return result.rows[0];
};

export const removeFileFromPost = async (
	postId: string,
	fileId: string
): Promise<void> => {
	const pool: Pool = await getDbConnection();
	const queryText = `
        DELETE FROM post_files
        WHERE "postId" = $1 AND "fileId" = $2;
    `;

	const values = [postId, fileId];
	await pool.query(queryText, values);
};

export const getPostFiles = async (
	postId: string
): Promise<PostFileMetadata[]> => {
	const pool: Pool = await getDbConnection();
	const queryText = `
        SELECT 
            pf.*,
            f.filename,
            f."originalName",
            f.mimetype,
            f.size
        FROM post_files pf
        LEFT JOIN files f ON pf."fileId" = f.id
        WHERE pf."postId" = $1
        ORDER BY pf."order" ASC, pf."createdAt" ASC;
    `;

	const values = [postId];
	const result = await pool.query(queryText, values);
	return result.rows;
};

export const updateFileOrder = async (
	postId: string,
	fileId: string,
	order: number
): Promise<void> => {
	const pool: Pool = await getDbConnection();
	const queryText = `
        UPDATE post_files
        SET "order" = $3
        WHERE "postId" = $1 AND "fileId" = $2;
    `;

	const values = [postId, fileId, order];
	await pool.query(queryText, values);
};

export const getPostsByFolder = async (
	folderId: string,
	page: number = 1,
	limit: number = 10
): Promise<PaginatedResponse<PostMetadata>> => {
	const pool: Pool = await getDbConnection();
	const offset = (page - 1) * limit;

	// Get total count
	const countQuery = `SELECT COUNT(DISTINCT p.id)::int as count FROM posts p WHERE p."folderId" = $1 AND p.status = 'APPROVED'`;
	const countResult = await pool.query(countQuery, [folderId]);
	const total = countResult.rows[0].count;

	// Get paginated data
	const queryText = `
        SELECT 
            p.*,
            CASE WHEN p."isAnonymous" THEN NULL ELSE u.name END as "authorName",
            CASE WHEN p."isAnonymous" THEN NULL ELSE u.email END as "authorEmail",
            COUNT(pf.id)::int as "fileCount"
        FROM posts p
        LEFT JOIN users u ON p."authorId" = u.id
        LEFT JOIN post_files pf ON p.id = pf."postId"
        WHERE p."folderId" = $1 AND p.status = 'APPROVED'
        GROUP BY p.id, u.name, u.email
        ORDER BY p."createdAt" DESC
        LIMIT $2 OFFSET $3;
    `;
	const values = [folderId, limit, offset];
	const result = await pool.query(queryText, values);

	const totalPages = Math.ceil(total / limit);

	return {
		data: result.rows,
		pagination: {
			total,
			page,
			limit,
			totalPages,
			hasNext: page < totalPages,
			hasPrev: page > 1,
		},
	};
};

// Get pending posts awaiting approval (admin use)
export const getPendingPosts = async (
	page: number = 1,
	limit: number = 10
): Promise<PaginatedResponse<PostMetadata>> => {
	const pool: Pool = await getDbConnection();
	const offset = (page - 1) * limit;

	const countQuery = `SELECT COUNT(DISTINCT p.id)::int as count FROM posts p WHERE p.status = 'PENDING'`;
	const countResult = await pool.query(countQuery);
	const total = countResult.rows[0].count;

	const queryText = `
        SELECT 
            p.*,
            CASE WHEN p."isAnonymous" THEN NULL ELSE u.name END as "authorName",
            CASE WHEN p."isAnonymous" THEN NULL ELSE u.email END as "authorEmail",
            COUNT(pf.id)::int as "fileCount"
        FROM posts p
        LEFT JOIN users u ON p."authorId" = u.id
        LEFT JOIN post_files pf ON p.id = pf."postId"
        WHERE p.status = 'PENDING'
        GROUP BY p.id, u.name, u.email
        ORDER BY p."createdAt" ASC
        LIMIT $1 OFFSET $2;
    `;
	const result2 = await pool.query(queryText, [limit, offset]);

	const totalPages = Math.ceil(total / limit);

	return {
		data: result2.rows,
		pagination: {
			total,
			page,
			limit,
			totalPages,
			hasNext: page < totalPages,
			hasPrev: page > 1,
		},
	};
};

// Approve a pending post
export const approvePost = async (id: string): Promise<PostMetadata | null> => {
	const pool: Pool = await getDbConnection();
	const queryText = `
        UPDATE posts
        SET status = 'APPROVED', "updatedAt" = NOW()
        WHERE id = $1
        RETURNING *;
    `;
	const result = await pool.query(queryText, [id]);
	return result.rows[0] || null;
};

// Reject a pending post
export const rejectPost = async (id: string): Promise<PostMetadata | null> => {
	const pool: Pool = await getDbConnection();
	const queryText = `
        UPDATE posts
        SET status = 'REJECTED', "updatedAt" = NOW()
        WHERE id = $1
        RETURNING *;
    `;
	const result = await pool.query(queryText, [id]);
	return result.rows[0] || null;
};

// Get all posts by author including all statuses (for the author to see their own)
export const getPostsByAuthorAllStatuses = async (
	authorId: string
): Promise<PostMetadata[]> => {
	const pool: Pool = await getDbConnection();
	const queryText = `
        SELECT 
            p.*,
            CASE WHEN p."isAnonymous" THEN NULL ELSE u.name END as "authorName",
            CASE WHEN p."isAnonymous" THEN NULL ELSE u.email END as "authorEmail",
            COUNT(pf.id)::int as "fileCount"
        FROM posts p
        LEFT JOIN users u ON p."authorId" = u.id
        LEFT JOIN post_files pf ON p.id = pf."postId"
        WHERE p."authorId" = $1
        GROUP BY p.id, u.name, u.email
        ORDER BY p."createdAt" DESC;
    `;
	const result = await pool.query(queryText, [authorId]);
	return result.rows;
};

// Get approved posts by author with pagination (for public profile view)
export const getApprovedPostsByAuthorPaginated = async (
	authorId: string,
	page: number = 1,
	limit: number = 5
): Promise<PaginatedResponse<PostMetadata>> => {
	const pool: Pool = await getDbConnection();
	const offset = (page - 1) * limit;

	const countQuery = `
        SELECT COUNT(DISTINCT p.id)::int as count
        FROM posts p
        WHERE p."authorId" = $1 AND p.status = 'APPROVED' AND p."isAnonymous" = false
    `;
	const countResult = await pool.query(countQuery, [authorId]);
	const total = countResult.rows[0].count;

	const queryText = `
        SELECT 
            p.*,
            u.name as "authorName",
            u.email as "authorEmail",
            COUNT(pf.id)::int as "fileCount"
        FROM posts p
        LEFT JOIN users u ON p."authorId" = u.id
        LEFT JOIN post_files pf ON p.id = pf."postId"
        WHERE p."authorId" = $1 AND p.status = 'APPROVED' AND p."isAnonymous" = false
        GROUP BY p.id, u.name, u.email
        ORDER BY p."createdAt" DESC
        LIMIT $2 OFFSET $3;
    `;
	const result = await pool.query(queryText, [authorId, limit, offset]);
	const totalPages = Math.ceil(total / limit);

	return {
		data: result.rows,
		pagination: {
			total,
			page,
			limit,
			totalPages,
			hasNext: page < totalPages,
			hasPrev: page > 1,
		},
	};
};

// ── Vote functions ────────────────────────────────────────────────────────────

/**
 * Toggle an upvote or downvote on a post.
 * - Same vote type clicked again → vote is removed
 * - Different vote type → old vote removed, new vote added
 * Returns the refreshed upvotes/downvotes counts and the user's resulting voteType (null = removed).
 */
export const votePost = async (
	postId: string,
	userId: string,
	voteType: VoteType
): Promise<PostVoteResult> => {
	const pool: Pool = await getDbConnection();

	// Check current vote by this user on this post
	const existingVoteResult = await pool.query(
		`SELECT "voteType" FROM post_votes WHERE "postId" = $1 AND "userId" = $2`,
		[postId, userId]
	);
	const existingVote: VoteType | undefined =
		existingVoteResult.rows[0]?.voteType;

	let resultingVoteType: VoteType | null = null;

	if (existingVote === voteType) {
		// Same vote → remove it
		await pool.query(
			`DELETE FROM post_votes WHERE "postId" = $1 AND "userId" = $2`,
			[postId, userId]
		);
		resultingVoteType = null;
	} else if (existingVote) {
		// Different vote → update it
		await pool.query(
			`UPDATE post_votes SET "voteType" = $3, "updatedAt" = NOW()
			 WHERE "postId" = $1 AND "userId" = $2`,
			[postId, userId, voteType]
		);
		resultingVoteType = voteType;
	} else {
		// No existing vote → insert
		await pool.query(
			`INSERT INTO post_votes (id, "postId", "userId", "voteType", "createdAt", "updatedAt")
			 VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())`,
			[postId, userId, voteType]
		);
		resultingVoteType = voteType;
	}

	// Recalculate and cache counts on the post row
	const countsResult = await pool.query(
		`SELECT
			COUNT(*) FILTER (WHERE "voteType" = 'UPVOTE')::int   AS upvotes,
			COUNT(*) FILTER (WHERE "voteType" = 'DOWNVOTE')::int AS downvotes
		 FROM post_votes WHERE "postId" = $1`,
		[postId]
	);
	const { upvotes, downvotes } = countsResult.rows[0];

	await pool.query(
		`UPDATE posts SET upvotes = $2, downvotes = $3, "updatedAt" = NOW() WHERE id = $1`,
		[postId, upvotes, downvotes]
	);

	return { voteType: resultingVoteType, upvotes, downvotes };
};

/** Return the requesting user's current vote on a post, or null if none. */
export const getUserVoteOnPost = async (
	postId: string,
	userId: string
): Promise<VoteType | null> => {
	const pool: Pool = await getDbConnection();
	const result = await pool.query(
		`SELECT "voteType" FROM post_votes WHERE "postId" = $1 AND "userId" = $2`,
		[postId, userId]
	);
	return result.rows[0]?.voteType ?? null;
};

export interface AuthorStats {
	totalPosts: number;
	approvedPosts: number;
	pendingPosts: number;
	rejectedPosts: number;
	totalUpvotes: number;
	totalDownvotes: number;
	totalViews: number;
	totalFiles: number;
	mostUpvotedPost: { id: string; title: string; upvotes: number } | null;
}

/** Aggregate activity statistics for a given author. */
export const getAuthorStats = async (userId: string): Promise<AuthorStats> => {
	const pool: Pool = await getDbConnection();

	const statsResult = await pool.query(
		`SELECT
			COUNT(*)::int                                                         AS "totalPosts",
			COUNT(*) FILTER (WHERE status = 'APPROVED')::int                     AS "approvedPosts",
			COUNT(*) FILTER (WHERE status = 'PENDING')::int                      AS "pendingPosts",
			COUNT(*) FILTER (WHERE status = 'REJECTED')::int                     AS "rejectedPosts",
			COALESCE(SUM(upvotes)::int, 0)                                       AS "totalUpvotes",
			COALESCE(SUM(downvotes)::int, 0)                                     AS "totalDownvotes",
			COALESCE(SUM(views)::int, 0)                                         AS "totalViews"
		 FROM posts
		 WHERE "authorId" = $1`,
		[userId]
	);

	const fileResult = await pool.query(
		`SELECT COUNT(pf.id)::int AS "totalFiles"
		 FROM post_files pf
		 INNER JOIN posts p ON pf."postId" = p.id
		 WHERE p."authorId" = $1`,
		[userId]
	);

	const topPostResult = await pool.query(
		`SELECT id, title, upvotes
		 FROM posts
		 WHERE "authorId" = $1 AND upvotes > 0
		 ORDER BY upvotes DESC
		 LIMIT 1`,
		[userId]
	);

	const s = statsResult.rows[0];
	return {
		totalPosts: s.totalPosts,
		approvedPosts: s.approvedPosts,
		pendingPosts: s.pendingPosts,
		rejectedPosts: s.rejectedPosts,
		totalUpvotes: s.totalUpvotes,
		totalDownvotes: s.totalDownvotes,
		totalViews: s.totalViews,
		totalFiles: fileResult.rows[0]?.totalFiles ?? 0,
		mostUpvotedPost: topPostResult.rows[0] ?? null,
	};
};
