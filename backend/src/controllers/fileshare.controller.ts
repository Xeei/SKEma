import { Request, Response } from 'express';
import {
	createFileShare,
	getFileSharesByFile,
	getFileSharesByUser,
	deleteFileShare,
} from '../models/fileshare.model';

export const createFileShareController = async (
	req: Request,
	res: Response
) => {
	try {
		const { fileId, userId } = req.body;
		if (!fileId || !userId)
			return res.status(400).json({ error: 'Missing required fields' });
		const share = await createFileShare(fileId, userId);
		res.status(201).json(share);
	} catch (_err) {
		res.status(500).json({ error: 'Failed to create file share' });
	}
};

export const getFileSharesByFileController = async (
	req: Request,
	res: Response
) => {
	try {
		const fileId = req.params.fileId as string;
		const shares = await getFileSharesByFile(fileId);
		res.json(shares);
	} catch (_err) {
		res.status(500).json({ error: 'Failed to get file shares' });
	}
};

export const getFileSharesByUserController = async (
	req: Request,
	res: Response
) => {
	try {
		const userId = req.params.userId as string;
		const shares = await getFileSharesByUser(userId);
		res.json(shares);
	} catch (_err) {
		res.status(500).json({ error: 'Failed to get file shares' });
	}
};

export const deleteFileShareController = async (
	req: Request,
	res: Response
) => {
	try {
		const id = req.params.id as string;
		const share = await deleteFileShare(id);
		if (!share)
			return res.status(404).json({ error: 'File share not found' });
		res.json(share);
	} catch (_err) {
		res.status(500).json({ error: 'Failed to delete file share' });
	}
};
