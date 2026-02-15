import axios from 'axios';

const instance = axios.create({
	baseURL: '/api/proxy/fileshares',
});

export interface FileShareData {
	id: string;
	fileId: string;
	userId: string;
	sharedAt: string;
}

export const createFileShare = async (fileId: string, userId: string): Promise<FileShareData> => {
	const { data } = await instance.post('/', { fileId, userId });
	return data;
};

export const getFileSharesByFile = async (fileId: string): Promise<FileShareData[]> => {
	const { data } = await instance.get(`/file/${fileId}`);
	return data;
};

export const getFileSharesByUser = async (userId: string): Promise<FileShareData[]> => {
	const { data } = await instance.get(`/user/${userId}`);
	return data;
};

export const deleteFileShare = async (id: string): Promise<FileShareData> => {
	const { data } = await instance.delete(`/${id}`);
	return data;
};
