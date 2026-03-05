import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
	createPostShareController,
	getPostSharesByPostController,
	getPostSharesByUserController,
	checkPostShareController,
	deletePostShareController,
	revokePostShareController,
} from '../controllers/postshare.controller';

const router = express.Router();

// Share a post with a user
router.post('/', authMiddleware, createPostShareController);

// Get all shares for a specific post
router.get('/post/:postId', authMiddleware, getPostSharesByPostController);

// Get all posts shared with a specific user
router.get(
	'/user/:sharedUserId',
	authMiddleware,
	getPostSharesByUserController
);

// Check whether a post is shared with a user
router.get(
	'/check/:postId/:sharedUserId',
	authMiddleware,
	checkPostShareController
);

// Revoke access by postId + sharedUserId (body)
router.delete('/revoke', authMiddleware, revokePostShareController);

// Remove a share by its id
router.delete('/:id', authMiddleware, deletePostShareController);

export default router;
