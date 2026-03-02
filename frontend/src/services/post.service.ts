import axios from 'axios';

const instance = axios.create({
	baseURL: '/api/proxy/posts',
});

export interface PostData {
	id: string;
	title: string;
	content: string;
	description?: string | null;
	link?: string | null;
	authorId: string;
	privacy: 'PUBLIC' | 'PRIVATE' | 'SHARED';
	status: 'PENDING' | 'APPROVED' | 'REJECTED';
	views: number;
	upvotes: number;
	downvotes: number;
	category?: string | null;
	tags: string[];
	createdAt: string;
	updatedAt: string;
	authorName?: string;
	authorEmail?: string;
	fileCount?: number;
	folderId?: string | null;
	isAnonymous: boolean;
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
	link?: string;
	privacy?: 'PUBLIC' | 'PRIVATE' | 'SHARED';
	category?: string;
	tags?: string[];
	folderId?: string;
	isAnonymous?: boolean;
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

// Create a new post
export const createPost = async (payload: CreatePostPayload): Promise<PostData> => {
	const { data } = await instance.post('/', payload);
	return data;
};

// Get all posts
export const getAllPosts = async (
	page: number = 1,
	limit: number = 10
): Promise<PaginatedResponse<PostData>> => {
	const { data } = await instance.get('/all', { params: { page, limit } });
	return data;
};

// Get public posts
export const getPublicPosts = async (
	page: number = 1,
	limit: number = 10
): Promise<PaginatedResponse<PostData>> => {
	const { data } = await instance.get('/public', { params: { page, limit } });
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
export const getPostsByFolder = async (
	folderId: string,
	page: number = 1,
	limit: number = 10,
	search: string = ''
): Promise<PaginatedResponse<PostData>> => {
	const { data } = await instance.get(`/folder/${folderId}`, {
		params: { page, limit, ...(search ? { search } : {}) },
	});
	return data;
};

// Get current user's posts
export const getMyPosts = async (): Promise<PostData[]> => {
	const { data } = await instance.get('/my-posts');
	return data;
};

export interface PaginationMeta {
	total: number;
	page: number;
	limit: number;
	totalPages: number;
	hasNext: boolean;
	hasPrev: boolean;
}

export interface PaginatedPostsResponse {
	data: PostData[];
	pagination: PaginationMeta;
}

// Get current user's approved posts with server-side pagination
export const getMyApprovedPostsPaginated = async (
	page: number = 1,
	limit: number = 5
): Promise<PaginatedPostsResponse> => {
	const { data } = await instance.get('/my-posts', {
		params: { status: 'APPROVED', page, limit },
	});
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

// Get pending posts (admin only)
export const getPendingPosts = async (
	page: number = 1,
	limit: number = 10
): Promise<PaginatedResponse<PostData>> => {
	const { data } = await instance.get('/admin/pending', { params: { page, limit } });
	return data;
};

// Approve a post (admin only)
export const approvePost = async (id: string): Promise<PostData> => {
	const { data } = await instance.patch(`/${id}/approve`);
	return data;
};

// Reject a post (admin only)
export const rejectPost = async (id: string): Promise<PostData> => {
	const { data } = await instance.patch(`/${id}/reject`);
	return data;
};

// ── Vote ──────────────────────────────────────────────────────────────────────

export type VoteType = 'UPVOTE' | 'DOWNVOTE';

export interface VoteResult {
	voteType: VoteType | null;
	upvotes: number;
	downvotes: number;
}

/**
 * Toggle an upvote or downvote on a post.
 * Sending the same voteType again removes the vote.
 */
export const votePost = async (id: string, voteType: VoteType): Promise<VoteResult> => {
	const { data } = await instance.post(`/${id}/vote`, { voteType });
	return data;
};

/** Get the current user's existing vote on a post. */
export const getMyVote = async (id: string): Promise<VoteType | null> => {
	const { data } = await instance.get(`/${id}/vote/me`);
	return data.voteType;
};

// ── Author stats ──────────────────────────────────────────────────────────────

export interface AuthorStats {
	totalPosts: number;
	approvedPosts: number;
	pendingPosts: number;
	rejectedPosts: number;
	totalUpvotes: number;
	totalDownvotes: number;
	totalViews: number;
	totalFiles: number;
	mostUpvotedPost: { id: string; title: string; upvotes: number } | null;
}

/** Fetch aggregated activity stats for the currently authenticated user. */
export const getMyStats = async (): Promise<AuthorStats> => {
	const { data } = await instance.get('/stats/me');
	return data;
};
