import axios from 'axios';

const instance = axios.create({
	baseURL: '/api/proxy/postshares',
});

export interface PostShareData {
	id: string;
	postId: string;
	authorId: string;
	sharedUserId: string;
	sharedAt: string;
	sharedUserName?: string | null;
	sharedUserEmail?: string;
}

// Share a post with a user
export const createPostShare = async (
	postId: string,
	authorId: string,
	sharedUserId: string
): Promise<PostShareData> => {
	const { data } = await instance.post('/', { postId, authorId, sharedUserId });
	return data;
};

// Get all shares for a specific post
export const getPostSharesByPost = async (postId: string): Promise<PostShareData[]> => {
	const { data } = await instance.get(`/post/${postId}`);
	return data;
};

// Get all posts shared with a specific user
export const getPostSharesByUser = async (sharedUserId: string): Promise<PostShareData[]> => {
	const { data } = await instance.get(`/user/${sharedUserId}`);
	return data;
};

// Check if a post is shared with a user
export const checkPostShare = async (postId: string, sharedUserId: string): Promise<boolean> => {
	const { data } = await instance.get(`/check/${postId}/${sharedUserId}`);
	return data.shared as boolean;
};

// Remove a share by its id
export const deletePostShare = async (id: string): Promise<PostShareData> => {
	const { data } = await instance.delete(`/${id}`);
	return data;
};

// Revoke access by postId + sharedUserId
export const revokePostShare = async (
	postId: string,
	sharedUserId: string
): Promise<PostShareData> => {
	const { data } = await instance.delete('/revoke', {
		data: { postId, sharedUserId },
	});
	return data;
};
