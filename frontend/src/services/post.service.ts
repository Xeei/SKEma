import axios from 'axios';

const instance = axios.create({
	baseURL: '/api/proxy/posts',
});

export interface PostData {
	id: string;
	title: string;
	content: string;
	description?: string | null;
	authorId: string;
	privacy: 'PUBLIC' | 'PRIVATE' | 'SHARED';
	views: number;
	category?: string | null;
	tags: string[];
	createdAt: string;
	updatedAt: string;
	authorName?: string;
	authorEmail?: string;
	fileCount?: number;
	folderId?: string | null;
}

export interface PostFileData {
	id: string;
	postId: string;
	fileId: string;
	order: number;
	createdAt: string;
	filename?: string;
	originalName?: string;
	mimetype?: string;
	size?: number;
}

export interface CreatePostPayload {
	title: string;
	content: string;
	description?: string;
	privacy?: 'PUBLIC' | 'PRIVATE' | 'SHARED';
	category?: string;
	tags?: string[];
	folderId?: string;
}

// Create a new post
export const createPost = async (payload: CreatePostPayload): Promise<PostData> => {
	const { data } = await instance.post('/', payload);
	return data;
};

// Get all posts
export const getAllPosts = async (): Promise<PostData[]> => {
	const { data } = await instance.get('/all');
	return data;
};

// Get public posts
export const getPublicPosts = async (): Promise<PostData[]> => {
	const { data } = await instance.get('/public');
	return data;
};

// Get post by ID
export const getPostById = async (id: string): Promise<PostData> => {
	const { data } = await instance.get(`/${id}`);
	return data;
};

// Get posts by author
export const getPostsByAuthor = async (authorId: string): Promise<PostData[]> => {
	const { data } = await instance.get(`/author/${authorId}`);
	return data;
};

// Get posts by folder
export const getPostsByFolder = async (folderId: string): Promise<PostData[]> => {
	const { data } = await instance.get(`/folder/${folderId}`);
	return data;
};

// Get current user's posts
export const getMyPosts = async (): Promise<PostData[]> => {
	const { data } = await instance.get('/my-posts');
	return data;
};

// Update post
export const updatePost = async (
	id: string,
	payload: Partial<CreatePostPayload>
): Promise<PostData> => {
	const { data } = await instance.patch(`/${id}`, payload);
	return data;
};

// Delete post
export const deletePost = async (id: string): Promise<PostData> => {
	const { data } = await instance.delete(`/${id}`);
	return data;
};

// Get files in a post
export const getPostFiles = async (postId: string): Promise<PostFileData[]> => {
	const { data } = await instance.get(`/${postId}/files`);
	return data;
};

// Add file to post
export const addFileToPost = async (
	postId: string,
	fileId: string,
	order?: number
): Promise<PostFileData> => {
	const { data } = await instance.post(`/${postId}/files`, { fileId, order: order || 0 });
	return data;
};

// Remove file from post
export const removeFileFromPost = async (postId: string, fileId: string): Promise<void> => {
	await instance.delete(`/${postId}/files/${fileId}`);
};

// Update file order in post
export const updateFileOrder = async (
	postId: string,
	fileId: string,
	order: number
): Promise<void> => {
	await instance.patch(`/${postId}/files/${fileId}/order`, { order });
};
