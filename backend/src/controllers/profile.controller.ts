import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { getPublicProfile } from '../models/profile.model';

const userIdSchema = z.object({ id: z.string() });

export const getPublicProfileController = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const { id } = userIdSchema.parse(req.params);
		const profile = await getPublicProfile(id);
		if (!profile) {
			return res.status(404).json({ message: 'User not found' });
		}
		return res.status(200).json(profile);
	} catch (err) {
		if (err instanceof z.ZodError) {
			return res.status(400).json({ message: 'Invalid user id' });
		}
		next(err);
	}
};
