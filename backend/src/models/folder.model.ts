import { Pool } from 'pg';
import { getDbConnection } from '../database/pg.database';

export interface FileFolderData {
	id: string;
	name: string;
	createdAt: Date;
	updatedAt: Date;
	userId: string;
	parentId: string;
}

// Create a folder
export const createFolder = async (
	name: string,
	userId: string,
	parentId?: string | null
): Promise<FileFolderData> => {
	const pool: Pool = await getDbConnection();
	const query = `
		INSERT INTO file_folders (id, name, "userId", "parentId", "createdAt", "updatedAt")
		VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
		RETURNING *;
	`;
	const values = [name, userId, parentId || null];
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
export const getAllFolders = async (): Promise<FileFolderData[]> => {
	const pool: Pool = await getDbConnection();
	const query = `SELECT * FROM file_folders ORDER BY "createdAt" DESC`;
	const result = await pool.query(query);
	return result.rows;
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
	userId: string
): Promise<FileFolderData[]> => {
	const pool: Pool = await getDbConnection();
	const query = `SELECT * FROM file_folders WHERE "parentId" = $1 AND "userId" = $2 ORDER BY "createdAt" DESC`;
	const result = await pool.query(query, [parentId, userId]);
	return result.rows;
};

// Update a folder
export const updateFolder = async (
	id: string,
	name: string
): Promise<FileFolderData | null> => {
	const pool: Pool = await getDbConnection();
	const query = `
		UPDATE file_folders SET name = $1, "updatedAt" = NOW()
		WHERE id = $2 RETURNING *;
	`;
	const result = await pool.query(query, [name, id]);
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
