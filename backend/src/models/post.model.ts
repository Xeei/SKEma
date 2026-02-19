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
	views: number;
	category?: string | null;
	tags: string[];
	folderId?: string | null;
	createdAt: Date;
	updatedAt: Date;
	authorName?: string;
	authorEmail?: string;
	fileCount?: number;
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
	folderId?: string | null
): Promise<PostMetadata> => {
	const pool: Pool = await getDbConnection();
	const queryText = `
        INSERT INTO posts (id, title, content, description, link, "authorId", privacy, category, tags, "folderId", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
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
	const countQuery = `SELECT COUNT(DISTINCT p.id)::int as count FROM posts p`;
	const countResult = await pool.query(countQuery);
	const total = countResult.rows[0].count;

	// Get paginated data
	const queryText = `
        SELECT 
            p.*,
            u.name as "authorName",
            u.email as "authorEmail",
            COUNT(pf.id)::int as "fileCount"
        FROM posts p
        LEFT JOIN users u ON p."authorId" = u.id
        LEFT JOIN post_files pf ON p.id = pf."postId"
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
            u.name as "authorName",
            u.email as "authorEmail",
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
            u.name as "authorName",
            u.email as "authorEmail",
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
	const countQuery = `SELECT COUNT(DISTINCT p.id)::int as count FROM posts p WHERE p.privacy = 'PUBLIC'`;
	const countResult = await pool.query(countQuery);
	const total = countResult.rows[0].count;

	// Get paginated data
	const queryText = `
        SELECT 
            p.*,
            u.name as "authorName",
            u.email as "authorEmail",
            COUNT(pf.id)::int as "fileCount"
        FROM posts p
        LEFT JOIN users u ON p."authorId" = u.id
        LEFT JOIN post_files pf ON p.id = pf."postId"
        WHERE p.privacy = 'PUBLIC'
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
	const countQuery = `SELECT COUNT(DISTINCT p.id)::int as count FROM posts p WHERE p."folderId" = $1`;
	const countResult = await pool.query(countQuery, [folderId]);
	const total = countResult.rows[0].count;

	// Get paginated data
	const queryText = `
        SELECT 
            p.*,
            u.name as "authorName",
            u.email as "authorEmail",
            COUNT(pf.id)::int as "fileCount"
        FROM posts p
        LEFT JOIN users u ON p."authorId" = u.id
        LEFT JOIN post_files pf ON p.id = pf."postId"
        WHERE p."folderId" = $1
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
