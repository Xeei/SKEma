import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
	createPostController,
	getAllPostsController,
	getPublicPostsController,
	getPostByIdController,
	getPostsByAuthorController,
	getMyPostsController,
	updatePostController,
	deletePostController,
	addFileToPostController,
	removeFileFromPostController,
	getPostFilesController,
	updateFileOrderController,
	getPostsByFolderController,
} from '../controllers/post.controller';

const router = express.Router();

// Public routes (no auth required)
router.get('/public', getPublicPostsController);

// Get all posts (requires auth)
router.get('/all', authMiddleware, getAllPostsController);

// Get posts by specific author
router.get('/author/:authorId', authMiddleware, getPostsByAuthorController);

// Get posts by folder
router.get('/folder/:folderId', authMiddleware, getPostsByFolderController);

// Get current user's posts
router.get('/my-posts', authMiddleware, getMyPostsController);

// Get specific post by ID
router.get('/:id', authMiddleware, getPostByIdController);

// Get files for a specific post
router.get('/:id/files', authMiddleware, getPostFilesController);

// Create new post
router.post('/', authMiddleware, createPostController);

// Update post
router.patch('/:id', authMiddleware, updatePostController);

// Delete post
router.delete('/:id', authMiddleware, deletePostController);

// Add file to post
router.post('/:id/files', authMiddleware, addFileToPostController);

// Remove file from post
router.delete(
	'/:id/files/:fileId',
	authMiddleware,
	removeFileFromPostController
);

// Update file order in post
router.patch(
	'/:id/files/:fileId/order',
	authMiddleware,
	updateFileOrderController
);

export default router;
