import axios from 'axios';

const instance = axios.create({
	baseURL: '/api/proxy/profile',
});

export interface PublicProfile {
	user: {
		id: string;
		name: string | null;
	};
	stats: {
		totalPosts: number;
		approvedPosts: number;
		totalUpvotes: number;
		totalDownvotes: number;
		totalViews: number;
	};
	heatmap: Array<{ date: string; count: number }>;
	mostUpvotedPost: { id: string; title: string; upvotes: number } | null;
}

export const getPublicProfile = async (userId: string): Promise<PublicProfile> => {
	const { data } = await instance.get(`/${userId}`);
	return data;
};
