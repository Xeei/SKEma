import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateBody, validateQuery } from '../middleware/validate.middleware';
import {
	createFolderSchema,
	updateFolderSchema,
	paginationSchema,
} from '../schemas';
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
router.post(
	'/',
	authMiddleware,
	validateBody(createFolderSchema),
	createFolderController
);
// Get all folders (must come before /:id)
router.get(
	'/all',
	authMiddleware,
	validateQuery(paginationSchema),
	getAllFoldersController
);
// Get folders by parent (must come before /:id)
router.get(
	'/parent/:parentId',
	authMiddleware,
	validateQuery(paginationSchema),
	getFoldersByParentController
);
// Get all folders for user
router.get('/', authMiddleware, getFoldersByUserController);
// Get folder by ID (parameterized routes come last)
router.get('/:id', authMiddleware, getFolderByIdController);
// Update folder
router.patch(
	'/:id',
	authMiddleware,
	validateBody(updateFolderSchema),
	updateFolderController
);
// Delete folder
router.delete('/:id', authMiddleware, deleteFolderController);

export default router;
