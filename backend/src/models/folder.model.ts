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
	const countQuery = `SELECT COUNT(*)::int as count FROM file_folders`;
	const countResult = await pool.query(countQuery);
	const total = countResult.rows[0].count;

	// Get paginated data
	const query = `SELECT * FROM file_folders WHERE "parentId" is null ORDER BY "createdAt" DESC LIMIT $1 OFFSET $2`;
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
	limit: number = 10
): Promise<PaginatedResponse<FileFolderData>> => {
	const pool: Pool = await getDbConnection();
	const offset = (page - 1) * limit;

	// Get total count
	const countQuery = `SELECT COUNT(*)::int as count FROM file_folders WHERE "parentId" = $1`;
	const countResult = await pool.query(countQuery, [parentId]);
	const total = countResult.rows[0].count;

	// Get paginated data
	const query = `SELECT * FROM file_folders WHERE "parentId" = $1 ORDER BY "createdAt" DESC LIMIT $2 OFFSET $3`;
	const result = await pool.query(query, [parentId, limit, offset]);

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
	const values: any[] = [];
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
