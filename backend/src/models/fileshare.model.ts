import { Pool } from 'pg';
import { getDbConnection } from '../database/pg.database';

export interface FileShareData {
	id: string;
	fileId: string;
	userId: string;
	sharedAt: Date;
}

// Create a file share
export const createFileShare = async (
	fileId: string,
	userId: string
): Promise<FileShareData> => {
	const pool: Pool = await getDbConnection();
	const query = `
    INSERT INTO file_shares (id, "fileId", "userId", "sharedAt")
    VALUES (gen_random_uuid(), $1, $2, NOW())
    RETURNING *;
  `;
	const values = [fileId, userId];
	const result = await pool.query(query, values);
	return result.rows[0];
};

// Get all shares for a file
export const getFileSharesByFile = async (
	fileId: string
): Promise<FileShareData[]> => {
	const pool: Pool = await getDbConnection();
	const query = `SELECT * FROM file_shares WHERE "fileId" = $1`;
	const result = await pool.query(query, [fileId]);
	return result.rows;
};

// Get all shares for a user
export const getFileSharesByUser = async (
	userId: string
): Promise<FileShareData[]> => {
	const pool: Pool = await getDbConnection();
	const query = `SELECT * FROM file_shares WHERE "userId" = $1`;
	const result = await pool.query(query, [userId]);
	return result.rows;
};

// Delete a file share
export const deleteFileShare = async (
	id: string
): Promise<FileShareData | null> => {
	const pool: Pool = await getDbConnection();
	const query = `DELETE FROM file_shares WHERE id = $1 RETURNING *;`;
	const result = await pool.query(query, [id]);
	return result.rows[0] || null;
};
