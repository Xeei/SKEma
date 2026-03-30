import { Router } from 'express';
import {
	createUserController,
	getUserByIdController,
	getUserByEmailController,
	getAllUsersController,
	searchUsersController,
} from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// POST /api/v1/users - Create a new user (called server-side by NextAuth on sign-in)
router.post('/', createUserController);

// GET /api/v1/users - Get all users
router.get('/', authMiddleware, getAllUsersController);

// GET /api/v1/users/search?q=xxx - Search users by name or email
router.get('/search', authMiddleware, searchUsersController);

// GET /api/v1/users/email?email=xxx - Get user by email
router.get('/email', getUserByEmailController);

// GET /api/v1/users/:id - Get user by ID
router.get('/:id', authMiddleware, getUserByIdController);

// PATCH /api/v1/users/:id - Update user
// router.patch('/:id', updateUserController);

// DELETE /api/v1/users/:id - Delete user
// router.delete('/:id', deleteUserController);

export default router;
