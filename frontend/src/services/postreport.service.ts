import axios from 'axios';

const instance = axios.create({
	baseURL: '/api/proxy/posts',
});

export interface PostReportData {
	id: string;
	postId: string;
	userId: string;
	reason: string | null;
	createdAt: string;
}

export const reportPost = async (
	postId: string,
	reason?: string | null
): Promise<{ report: PostReportData; reportCount: number }> => {
	const { data } = await instance.post(`/${postId}/report`, { reason: reason ?? null });
	return data;
};

export const getPostReports = async (postId: string): Promise<PostReportData[]> => {
	const { data } = await instance.get(`/${postId}/reports`);
	return data.reports;
};

export const dismissPostReports = async (postId: string): Promise<void> => {
	await instance.delete(`/${postId}/reports`);
};
