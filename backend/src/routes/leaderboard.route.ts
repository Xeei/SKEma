import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { getLeaderboardController } from '../controllers/leaderboard.controller';

const router = express.Router();

// Get top 10 users leaderboard (requires auth)
router.get('/', authMiddleware, getLeaderboardController);

export default router;
