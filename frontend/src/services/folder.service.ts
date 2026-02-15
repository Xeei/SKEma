import axios from 'axios';

const instance = axios.create({
	baseURL: '/api/proxy/folders',
});

export interface FileFolderData {
	id: string;
	name: string;
	createdAt: string;
	updatedAt: string;
	userId: string;
	parentId: string | null;
}

export const createFolder = async (
	name: string,
	parentId?: string | null
): Promise<FileFolderData> => {
	const { data } = await instance.post('/', { name, parentId });
	return data;
};

export const getFolderById = async (id: string): Promise<FileFolderData> => {
	const { data } = await instance.get(`/${id}`);
	return data;
};

export const getFoldersByUser = async (): Promise<FileFolderData[]> => {
	const { data } = await instance.get('/');
	return data;
};

export const getFoldersByParent = async (parentId: string | null): Promise<FileFolderData[]> => {
	const { data } = await instance.get(`/parent/${parentId}`);
	return data;
};

export const updateFolder = async (id: string, name: string): Promise<FileFolderData> => {
	const { data } = await instance.patch(`/${id}`, { name });
	return data;
};

export const deleteFolder = async (id: string): Promise<FileFolderData> => {
	const { data } = await instance.delete(`/${id}`);
	return data;
};
