import { Pool } from 'pg';
import { getDbConnection } from '../database/pg.database';

export interface FileFolderData {
	id: string;
	name: string;
	description?: string;
	createdAt: Date;
	updatedAt: Date;
	userId: string;
	parentId: string;
	fileCount?: number;
	postCount?: number;
	subfolderCount?: number;
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

// Create a folder
export const createFolder = async (
	name: string,
	userId: string,
	parentId?: string | null,
	description?: string
): Promise<FileFolderData> => {
	const pool: Pool = await getDbConnection();
	const query = `
		INSERT INTO file_folders (id, name, description, "userId", "parentId", "createdAt", "updatedAt")
		VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
		RETURNING *;
	`;
	const values = [name, description || null, userId, parentId || null];
	const result = await pool.query(query, values);
	return result.rows[0];
};

// Get a folder by ID
export const getFolderById = async (
	id: string
): Promise<FileFolderData | null> => {
	const pool: Pool = await getDbConnection();
	const query = `SELECT * FROM file_folders WHERE id = $1`;
	const result = await pool.query(query, [id]);
	return result.rows[0] || null;
};

// Get All Folders
export const getAllFolders = async (
	page: number = 1,
	limit: number = 10
): Promise<PaginatedResponse<FileFolderData>> => {
	const pool: Pool = await getDbConnection();
	const offset = (page - 1) * limit;

	// Get total count
	const countQuery = `SELECT COUNT(*)::int as count FROM file_folders WHERE "parentId" IS NULL`;
	const countResult = await pool.query(countQuery);
	const total = countResult.rows[0].count;

	// Get paginated data with recursive file/post/subfolder counts
	const query = `
		WITH RECURSIVE all_subfolders AS (
			SELECT id, id AS root_id FROM file_folders WHERE "parentId" IS NULL
			UNION ALL
			SELECT f.id, s.root_id FROM file_folders f
			INNER JOIN all_subfolders s ON f."parentId" = s.id
		)
		SELECT
			ff.*,
			COALESCE(fc.file_count, 0)::int AS "fileCount",
			COALESCE(pc.post_count, 0)::int AS "postCount",
			COALESCE(sc.subfolder_count, 0)::int AS "subfolderCount"
		FROM file_folders ff
		LEFT JOIN (
			SELECT a.root_id, COUNT(DISTINCT fi.id)::int AS file_count
			FROM all_subfolders a
			LEFT JOIN files fi ON fi."folderId" = a.id
			GROUP BY a.root_id
		) fc ON fc.root_id = ff.id
		LEFT JOIN (
			SELECT a.root_id, COUNT(DISTINCT p.id)::int AS post_count
			FROM all_subfolders a
			LEFT JOIN posts p ON p."folderId" = a.id
			GROUP BY a.root_id
		) pc ON pc.root_id = ff.id
		LEFT JOIN (
			SELECT "parentId", COUNT(*)::int AS subfolder_count
			FROM file_folders
			WHERE "parentId" IS NOT NULL
			GROUP BY "parentId"
		) sc ON sc."parentId" = ff.id
		WHERE ff."parentId" IS NULL
		ORDER BY ff."createdAt" DESC
		LIMIT $1 OFFSET $2
	`;
	const result = await pool.query(query, [limit, offset]);

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

// List all folders for a user
export const getFoldersByUser = async (
	userId: string
): Promise<FileFolderData[]> => {
	const pool: Pool = await getDbConnection();
	const query = `SELECT * FROM file_folders WHERE "userId" = $1 ORDER BY "createdAt" DESC`;
	const result = await pool.query(query, [userId]);
	return result.rows;
};

// List all child folders for a parent
export const getFoldersByParent = async (
	parentId: string | null,
	page: number = 1,
	limit: number = 10,
	search: string = ''
): Promise<PaginatedResponse<FileFolderData>> => {
	const pool: Pool = await getDbConnection();
	const offset = (page - 1) * limit;
	const searchParam = search ? `%${search}%` : null;

	// Get total count
	const countQuery = searchParam
		? `SELECT COUNT(*)::int as count FROM file_folders WHERE "parentId" = $1 AND name ILIKE $2`
		: `SELECT COUNT(*)::int as count FROM file_folders WHERE "parentId" = $1`;
	const countResult = await pool.query(
		countQuery,
		searchParam ? [parentId, searchParam] : [parentId]
	);
	const total = countResult.rows[0].count;

	// Get paginated data with recursive file/post/subfolder counts
	const query = `
		WITH RECURSIVE all_subfolders AS (
			SELECT id, id AS root_id FROM file_folders WHERE "parentId" = $1
			UNION ALL
			SELECT f.id, s.root_id FROM file_folders f
			INNER JOIN all_subfolders s ON f."parentId" = s.id
		)
		SELECT
			ff.*,
			COALESCE(fc.file_count, 0)::int AS "fileCount",
			COALESCE(pc.post_count, 0)::int AS "postCount",
			COALESCE(sc.subfolder_count, 0)::int AS "subfolderCount"
		FROM file_folders ff
		LEFT JOIN (
			SELECT a.root_id, COUNT(DISTINCT fi.id)::int AS file_count
			FROM all_subfolders a
			LEFT JOIN files fi ON fi."folderId" = a.id
			GROUP BY a.root_id
		) fc ON fc.root_id = ff.id
		LEFT JOIN (
			SELECT a.root_id, COUNT(DISTINCT p.id)::int AS post_count
			FROM all_subfolders a
			LEFT JOIN posts p ON p."folderId" = a.id
			GROUP BY a.root_id
		) pc ON pc.root_id = ff.id
		LEFT JOIN (
			SELECT "parentId", COUNT(*)::int AS subfolder_count
			FROM file_folders
			WHERE "parentId" IS NOT NULL
			GROUP BY "parentId"
		) sc ON sc."parentId" = ff.id
		WHERE ff."parentId" = $1
		${searchParam ? 'AND ff.name ILIKE $4' : ''}
		ORDER BY ff."createdAt" DESC
		LIMIT $2 OFFSET $3
	`;
	const result = await pool.query(
		query,
		searchParam
			? [parentId, limit, offset, searchParam]
			: [parentId, limit, offset]
	);

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

// Update a folder
export const updateFolder = async (
	id: string,
	name?: string,
	description?: string
): Promise<FileFolderData | null> => {
	const pool: Pool = await getDbConnection();
	const updates: string[] = [];
	const values: (string | number | boolean | null)[] = [];
	let paramCount = 1;

	if (name !== undefined) {
		updates.push(`name = $${paramCount}`);
		values.push(name);
		paramCount++;
	}

	if (description !== undefined) {
		updates.push(`description = $${paramCount}`);
		values.push(description);
		paramCount++;
	}

	if (updates.length === 0) {
		return null;
	}

	updates.push('"updatedAt" = NOW()');
	values.push(id);

	const query = `
		UPDATE file_folders SET ${updates.join(', ')}
		WHERE id = $${paramCount} RETURNING *;
	`;
	const result = await pool.query(query, values);
	return result.rows[0] || null;
};

// Delete a folder
export const deleteFolder = async (
	id: string
): Promise<FileFolderData | null> => {
	const pool: Pool = await getDbConnection();
	const query = `DELETE FROM file_folders WHERE id = $1 RETURNING *;`;
	const result = await pool.query(query, [id]);
	return result.rows[0] || null;
};
