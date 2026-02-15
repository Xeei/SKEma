import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
	createFolderController,
	getFolderByIdController,
	getFoldersByUserController,
	getFoldersByParentController,
	updateFolderController,
	deleteFolderController,
} from '../controllers/folder.controller';

const router = express.Router();

// Create folder
router.post('/', authMiddleware, createFolderController);
// Get folder by ID
router.get('/:id', authMiddleware, getFolderByIdController);
// Get all folders for user
router.get('/', authMiddleware, getFoldersByUserController);
// Get folders by parent
router.get('/parent/:parentId', authMiddleware, getFoldersByParentController);
// Update folder
router.patch('/:id', authMiddleware, updateFolderController);
// Delete folder
router.delete('/:id', authMiddleware, deleteFolderController);

export default router;
