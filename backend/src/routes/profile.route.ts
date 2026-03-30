import { Router } from 'express';
import { getPublicProfileController } from '../controllers/profile.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// GET /api/v1/profile/:id - Get public profile for a user
router.get('/:id', authMiddleware, getPublicProfileController);

export default router;
