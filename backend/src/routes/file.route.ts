import express from 'express';
import { upload } from '../config/upload';
import { authMiddleware } from '../middleware/auth.middleware';
import {
	uploadFileController,
	getAllFilesController,
	getFileByIdController,
	downloadFileController,
	deleteFileController,
	getFilesByUserController,
	getFilesByFolder,
} from '../controllers/file.controller';

const router = express.Router();

// Upload file (requires authentication)
router.post('/', authMiddleware, upload.single('file'), uploadFileController);

// Get all files
router.get('/', getAllFilesController);

// Get files by user ID
router.get('/user/:userId', getFilesByUserController);

// Get file by ID
router.get('/:id', getFileByIdController);

// Download file
router.get('/:id/download', downloadFileController);

// Delete file (requires authentication and ownership)
router.delete('/:id', authMiddleware, deleteFileController);

router.get('/folders/:id', authMiddleware, getFilesByFolder)

export default router;
