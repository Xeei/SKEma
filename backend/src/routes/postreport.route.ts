import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { reportPostSchema } from '../schemas';
import {
	reportPostController,
	getPostReportsController,
	dismissPostReportsController,
} from '../controllers/postreport.controller';

const router = express.Router({ mergeParams: true });

// Report a post (any authenticated user)
router.post(
	'/:postId/report',
	authMiddleware,
	validateBody(reportPostSchema),
	reportPostController
);

// Admin: view all reports for a post
router.get('/:postId/reports', authMiddleware, getPostReportsController);

// Admin: dismiss reports and restore post
router.delete('/:postId/reports', authMiddleware, dismissPostReportsController);

export default router;
