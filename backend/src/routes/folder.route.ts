import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
	createFolderController,
	getFolderByIdController,
	getFoldersByUserController,
	getFoldersByParentController,
	updateFolderController,
	deleteFolderController,
	getAllFoldersController,
} from '../controllers/folder.controller';

const router = express.Router();

// Create folder
router.post('/', authMiddleware, createFolderController);
// Get all folders (must come before /:id)
router.get('/all', authMiddleware, getAllFoldersController);
// Get folders by parent (must come before /:id)
router.get('/parent/:parentId', authMiddleware, getFoldersByParentController);
// Get all folders for user
router.get('/', authMiddleware, getFoldersByUserController);
// Get folder by ID (parameterized routes come last)
router.get('/:id', authMiddleware, getFolderByIdController);
// Update folder
router.patch('/:id', authMiddleware, updateFolderController);
// Delete folder
router.delete('/:id', authMiddleware, deleteFolderController);

export default router;
