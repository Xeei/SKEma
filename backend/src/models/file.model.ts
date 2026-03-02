import { Pool } from 'pg';
import { getDbConnection } from '../database/pg.database';

export interface FileMetadata {
	id: string;
	filename: string;
	originalName: string;
	mimetype: string;
	size: number;
	path: string;
	uploadedBy: string;
	downloads: number;
	createdAt: Date;
	updatedAt: Date;
	folderId?: string | null;
	privacy?: string;
}

export const createFile = async (
	filename: string,
	originalName: string,
	mimetype: string,
	size: number,
	path: string,
	uploadedBy: string,
	folderId?: string | null,
	privacy?: string
): Promise<FileMetadata> => {
	const pool: Pool = await getDbConnection();
	const queryText = `
        INSERT INTO files (id, filename, "originalName", mimetype, size, path, "uploadedBy", "folderId", privacy, "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *;
    `;

	const values = [
		filename,
		originalName,
		mimetype,
		size,
		path,
		uploadedBy,
		folderId || null,
		privacy || 'PRIVATE',
	];
	const result = await pool.query(queryText, values);
	return result.rows[0];
};

export interface PaginatedFiles {
	data: FileMetadata[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
	hasNext: boolean;
	hasPrev: boolean;
}

export const getAllFiles = async (
	page: number = 1,
	limit: number = 20,
	search: string = ''
): Promise<PaginatedFiles> => {
	const pool: Pool = await getDbConnection();
	const offset = (page - 1) * limit;
	const searchParam = search ? `%${search}%` : null;

	const countResult = searchParam
		? await pool.query(
				'SELECT COUNT(*) FROM files WHERE "originalName" ILIKE $1',
				[searchParam]
			)
		: await pool.query('SELECT COUNT(*) FROM files');
	const total = parseInt(countResult.rows[0].count, 10);
	const totalPages = Math.ceil(total / limit) || 1;

	const queryText = searchParam
		? `
        SELECT f.*, u.name as "uploaderName", u.email as "uploaderEmail"
        FROM files f
        LEFT JOIN users u ON f."uploadedBy" = u.id
        WHERE f."originalName" ILIKE $3
        ORDER BY f."createdAt" DESC
        LIMIT $1 OFFSET $2;
    `
		: `
        SELECT f.*, u.name as "uploaderName", u.email as "uploaderEmail"
        FROM files f
        LEFT JOIN users u ON f."uploadedBy" = u.id
        ORDER BY f."createdAt" DESC
        LIMIT $1 OFFSET $2;
    `;
	const values = searchParam ? [limit, offset, searchParam] : [limit, offset];
	const result = await pool.query(queryText, values);

	return {
		data: result.rows,
		total,
		page,
		limit,
		totalPages,
		hasNext: page < totalPages,
		hasPrev: page > 1,
	};
};

export const getFileById = async (id: string): Promise<FileMetadata | null> => {
	const pool: Pool = await getDbConnection();
	const queryText = `
        SELECT f.*, u.name as "uploaderName", u.email as "uploaderEmail"
        FROM files f
        LEFT JOIN users u ON f."uploadedBy" = u.id
        WHERE f.id = $1;
    `;

	const values = [id];
	const result = await pool.query(queryText, values);
	return result.rows[0] || null;
};

export const incrementDownloadCount = async (id: string): Promise<void> => {
	const pool: Pool = await getDbConnection();
	const queryText = `
        UPDATE files
        SET downloads = downloads + 1,
            "updatedAt" = NOW()
        WHERE id = $1;
    `;

	const values = [id];
	await pool.query(queryText, values);
};

export const deleteFile = async (id: string): Promise<FileMetadata | null> => {
	const pool: Pool = await getDbConnection();
	const queryText = `
        DELETE FROM files
        WHERE id = $1
        RETURNING *;
    `;

	const values = [id];
	const result = await pool.query(queryText, values);
	return result.rows[0] || null;
};

export const getFilesByUser = async (
	userId: string
): Promise<FileMetadata[]> => {
	const pool: Pool = await getDbConnection();
	const queryText = `
        SELECT *
        FROM files
        WHERE "uploadedBy" = $1
        ORDER BY "createdAt" DESC;
    `;

	const values = [userId];
	const result = await pool.query(queryText, values);
	return result.rows;
};

export const getPublicFilesByFolder = async (
	userId: string,
	folderId: string
): Promise<FileMetadata[]> => {
	const pool: Pool = await getDbConnection();
	const queryText = `
		SELECT
		f.*,
		u.name AS uploader_name,
		u.email AS uploader_email,
		'PUBLIC' AS access_type
		FROM files f
		JOIN users u ON f."uploadedBy" = u.id
		WHERE f.privacy = 'PUBLIC'

		UNION

		SELECT
		f.*,
		u.name AS uploader_name,
		u.email AS uploader_email,
		'SHARED' AS access_type
		FROM files f
		JOIN file_shares fs ON fs."fileId" = f.id
		JOIN users u ON f."uploadedBy" = u.id
		WHERE fs."userId" = $1
		AND fs.id = $2;
    `;
	const values = [userId, folderId];
	const result = await pool.query(queryText, values);
	return result.rows;
};
