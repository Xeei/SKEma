import { Request, Response } from 'express';
import {
	createFolder,
	getFolderById,
	getFoldersByUser,
	getFoldersByParent,
	updateFolder,
	deleteFolder,
	getAllFolders,
} from '../models/folder.model';

export const createFolderController = async (req: Request, res: Response) => {
	try {
		const { name, parentId } = req.body;
		const userId = req.user?.id;
		if (!userId || !name)
			return res.status(400).json({ error: 'Missing required fields' });
		const folder = await createFolder(name, userId, parentId);
		res.status(201).json(folder);
	} catch (err) {
		res.status(500).json({ error: 'Failed to create folder' });
	}
};

export const getFolderByIdController = async (req: Request, res: Response) => {
	try {
		const id = req.params.id as string;
		const folder = await getFolderById(id);
		if (!folder) return res.status(404).json({ error: 'Folder not found' });
		res.json(folder);
	} catch (err) {
		res.status(500).json({ error: 'Failed to get folder' });
	}
};

export const getAllFoldersController = async (
	req: Request,
	res: Response
) => {
	try {
		const userId = req.user?.id;
		if (!userId) return res.status(401).json({ error: 'Unauthorized' });
		const folders = await getAllFolders();
		res.json(folders);
	} catch (err) {
		res.status(500).json({ error: 'Failed to get folders' });
	}
};


export const getFoldersByUserController = async (
	req: Request,
	res: Response
) => {
	try {
		const userId = req.user?.id;
		if (!userId) return res.status(401).json({ error: 'Unauthorized' });
		const folders = await getFoldersByUser(userId);
		res.json(folders);
	} catch (err) {
		res.status(500).json({ error: 'Failed to get folders' });
	}
};

export const getFoldersByParentController = async (
	req: Request,
	res: Response
) => {
	try {
		const userId = req.user?.id;
		const parentId = req.params.parentId as string;
		if (!userId) return res.status(401).json({ error: 'Unauthorized' });
		const folders = await getFoldersByParent(parentId || null, userId);
		res.json(folders);
	} catch (err) {
		res.status(500).json({ error: 'Failed to get folders' });
	}
};

export const updateFolderController = async (req: Request, res: Response) => {
	try {
		const id = req.params.id as string;
		const { name } = req.body;
		if (!name) return res.status(400).json({ error: 'Missing name' });
		const folder = await updateFolder(id, name);
		if (!folder) return res.status(404).json({ error: 'Folder not found' });
		res.json(folder);
	} catch (err) {
		res.status(500).json({ error: 'Failed to update folder' });
	}
};

export const deleteFolderController = async (req: Request, res: Response) => {
	try {
		const id = req.params.id as string;
		const folder = await deleteFolder(id);
		if (!folder) return res.status(404).json({ error: 'Folder not found' });
		res.json(folder);
	} catch (err) {
		res.status(500).json({ error: 'Failed to delete folder' });
	}
};

