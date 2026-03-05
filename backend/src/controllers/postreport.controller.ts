import { Request, Response } from 'express';
import {
	createReport,
	getReportByUserAndPost,
	getReportsByPost,
	getReportCount,
	dismissReports,
} from '../models/postreport.model';

// POST /posts/:postId/report — authenticated user reports a post
export const reportPostController = async (req: Request, res: Response) => {
	try {
		const postId = req.params.postId as string;
		const userId = req.user?.id;
		const { reason } = req.body;

		if (!userId) {
			return res.status(401).json({ error: 'Unauthorized' });
		}

		const existing = await getReportByUserAndPost(userId, postId);
		if (existing) {
			return res
				.status(409)
				.json({ error: 'You have already reported this post' });
		}

		const report = await createReport(postId, userId, reason);
		const count = await getReportCount(postId);

		return res.status(201).json({ report, reportCount: count });
	} catch (error) {
		console.error('reportPostController error:', error);
		return res.status(500).json({ error: 'Failed to submit report' });
	}
};

// GET /posts/:postId/reports — admin only
export const getPostReportsController = async (req: Request, res: Response) => {
	try {
		const postId = req.params.postId as string;
		const role = req.user?.role;

		if (role !== 'ADMIN') {
			return res.status(403).json({ error: 'Forbidden' });
		}

		const reports = await getReportsByPost(postId);
		return res.status(200).json({ reports });
	} catch (error) {
		console.error('getPostReportsController error:', error);
		return res.status(500).json({ error: 'Failed to fetch reports' });
	}
};

// DELETE /posts/:postId/reports — admin dismisses all reports (restores post)
export const dismissPostReportsController = async (
	req: Request,
	res: Response
) => {
	try {
		const postId = req.params.postId as string;
		const role = req.user?.role;

		if (role !== 'ADMIN') {
			return res.status(403).json({ error: 'Forbidden' });
		}

		await dismissReports(postId);

		// Restore post to APPROVED
		const { getDbConnection } = await import('../database/pg.database');
		const pool = await getDbConnection();
		await pool.query(
			`UPDATE posts SET status = 'APPROVED', "updatedAt" = NOW() WHERE id = $1 AND status = 'UNDER_REVIEW'`,
			[postId]
		);

		return res
			.status(200)
			.json({ message: 'Reports dismissed, post restored' });
	} catch (error) {
		console.error('dismissPostReportsController error:', error);
		return res.status(500).json({ error: 'Failed to dismiss reports' });
	}
};
