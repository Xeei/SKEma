import { getDbConnection } from '../database/pg.database';
import { Pool } from 'pg';

export const createUser = async (
	id: string,
	email: string,
	name: string | null
) => {
	const pool: Pool = await getDbConnection();
	const queryText = `
        INSERT INTO users (id, email, name, "updatedAt")
        VALUES ($1, $2, $3, NOW())
        RETURNING *;
    `;

	const values = [id, email, name];
	const result = await pool.query(queryText, values);
	return result.rows[0];
};

export const updateUser = async (
	id: string,
	email: string,
	name: string | null
) => {
	const pool: Pool = await getDbConnection();
	const queryText = `
        UPDATE users
        SET 
            email = $2, 
            name = $3,
            "updatedAt" = NOW()
        WHERE id = $1
        RETURNING *;
    `;

	const values = [id, email, name];
	const result = await pool.query(queryText, values);
	return result.rows[0];
};

export const deleteUser = async (id: string) => {
	const pool: Pool = await getDbConnection();
	const queryText = `
        DELETE FROM users
        WHERE id = $1
        RETURNING *;
    `;

	const values = [id];
	const result = await pool.query(queryText, values);
	return result.rows[0];
};

export const getUserById = async (id: string) => {
	const pool: Pool = await getDbConnection();
	const queryText = `
        SELECT * FROM users
        WHERE id = $1;
    `;

	const values = [id];
	const result = await pool.query(queryText, values);
	return result.rows[0];
};

export const getUserByEmail = async (email: string) => {
	const pool: Pool = await getDbConnection();
	const queryText = `
        SELECT * FROM users
        WHERE email = $1;
    `;

	const values = [email];
	const result = await pool.query(queryText, values);
	return result.rows[0];
};

export const getAllUsers = async () => {
	const pool: Pool = await getDbConnection();
	const queryText = `
        SELECT * FROM users
        ORDER BY email ASC;
    `;
	const result = await pool.query(queryText);
	return result.rows;
};

export const searchUsers = async (
	query: string,
	excludeId?: string,
	limit: number = 10
) => {
	const pool: Pool = await getDbConnection();
	const searchParam = `%${query}%`;
	const queryText = excludeId
		? `
			SELECT id, email, name
			FROM users
			WHERE (email ILIKE $1 OR name ILIKE $1)
			  AND id != $2
			ORDER BY name ASC, email ASC
			LIMIT $3;
		`
		: `
			SELECT id, email, name
			FROM users
			WHERE (email ILIKE $1 OR name ILIKE $1)
			ORDER BY name ASC, email ASC
			LIMIT $2;
		`;
	const values = excludeId
		? [searchParam, excludeId, limit]
		: [searchParam, limit];
	const result = await pool.query(queryText, values);
	return result.rows;
};
