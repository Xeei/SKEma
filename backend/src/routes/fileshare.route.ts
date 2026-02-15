import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
	createFileShareController,
	getFileSharesByFileController,
	getFileSharesByUserController,
	deleteFileShareController,
} from '../controllers/fileshare.controller';

const router = express.Router();

// Create file share
router.post('/', authMiddleware, createFileShareController);
// Get all shares for a file
router.get('/file/:fileId', authMiddleware, getFileSharesByFileController);
// Get all shares for a user
router.get('/user/:userId', authMiddleware, getFileSharesByUserController);
// Delete file share
router.delete('/:id', authMiddleware, deleteFileShareController);

export default router;
