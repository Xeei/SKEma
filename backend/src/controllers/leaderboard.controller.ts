import { Request, Response } from 'express';
import { getTopUsers } from '../models/leaderboard.model';

export const getLeaderboardController = async (req: Request, res: Response) => {
	try {
		const entries = await getTopUsers(10);
		return res.status(200).json(entries);
	} catch (err) {
		console.error('Leaderboard error:', err);
		return res.status(500).json({ error: 'Internal Server Error' });
	}
};
