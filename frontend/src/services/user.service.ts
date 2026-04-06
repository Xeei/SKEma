import axios from 'axios';
import * as t from '@/types/index';

// Client-side instance (uses proxy middleware)
const instance = axios.create({
	baseURL: '/api/proxy/user',
});

// Server-side instance (uses direct backend URL)
const getServerInstance = () => {
	const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
	return axios.create({
		baseURL: `${backendUrl}/api/v1/user`,
	});
};

export interface CreateUserBody {
	id: string;
	email: string;
	name?: string | null;
}

export interface UpdateUserBody {
	email?: string;
	name?: string | null;
}

export const createUser = async (body: CreateUserBody): Promise<t.User> => {
	const serverInstance = getServerInstance();
	const { data } = await serverInstance.post('/', body);
	return data;
};

export const getUserByEmail = async (email: string): Promise<t.User | null> => {
	try {
		const serverInstance = getServerInstance();
		const { data } = await serverInstance.get('/email', { params: { email } });
		return data;
	} catch (error) {
		if (axios.isAxiosError(error) && error.response?.status === 404) {
			return null;
		}
		throw error;
	}
};

export interface UserSearchResult {
	id: string;
	email: string;
	name: string | null;
}

export const searchUsers = async (
	query: string,
	limit: number = 10
): Promise<UserSearchResult[]> => {
	if (!query.trim()) return [];
	const { data } = await instance.get('/search', { params: { q: query.trim(), limit } });
	return data;
};
