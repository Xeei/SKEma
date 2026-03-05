import axios from 'axios';

const instance = axios.create({
	baseURL: '/api/proxy/leaderboard',
});

export interface LeaderboardEntry {
	rank: number;
	userId: string;
	name: string | null;
	email: string;
	totalPosts: number;
	approvedPosts: number;
	totalUpvotes: number;
	totalDownvotes: number;
	totalViews: number;
}

export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
	const res = await instance.get<LeaderboardEntry[]>('/');
	return res.data;
};
