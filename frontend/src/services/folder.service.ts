import axios from 'axios';

const instance = axios.create({
	baseURL: '/api/proxy/folders',
});

export interface FileFolderData {
	id: string;
	name: string;
	description?: string;
	createdAt: string;
	updatedAt: string;
	userId: string;
	parentId: string | null;
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

export const createFolder = async (
	name: string,
	parentId?: string | null,
	description?: string
): Promise<FileFolderData> => {
	const { data } = await instance.post('/', { name, parentId, description });
	return data;
};

export const getFolderById = async (id: string): Promise<FileFolderData> => {
	const { data } = await instance.get(`/${id}`);
	return data;
};

export const getAllFolders = async (
	page: number = 1,
	limit: number = 10
): Promise<PaginatedResponse<FileFolderData>> => {
	const { data } = await instance.get('/all', { params: { page, limit } });
	return data;
};

export const getFoldersByUser = async (): Promise<FileFolderData[]> => {
	const { data } = await instance.get('/');
	return data;
};

export const getFoldersByParent = async (
	parentId: string | null,
	page: number = 1,
	limit: number = 10
): Promise<PaginatedResponse<FileFolderData>> => {
	const { data } = await instance.get(`/parent/${parentId}`, { params: { page, limit } });
	return data;
};

export const updateFolder = async (
	id: string,
	name?: string,
	description?: string
): Promise<FileFolderData> => {
	const { data } = await instance.patch(`/${id}`, { name, description });
	return data;
};

export const deleteFolder = async (id: string): Promise<FileFolderData> => {
	const { data } = await instance.delete(`/${id}`);
	return data;
};
