import express, { type Express } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import logger, { morganStream } from './config/logger';
import { initSocket } from './socket';

import userRouter from './routes/user.route';
import fileRouter from './routes/file.route';
import folderRoute from './routes/folder.route';
import fileshareRouter from './routes/fileshare.route';
import postRouter from './routes/post.route';
import notificationRouter from './routes/notification.route';
import postshareRouter from './routes/postshare.route';
import leaderboardRouter from './routes/leaderboard.route';
import postreportRouter from './routes/postreport.route';
import profileRouter from './routes/profile.route';

// Initialize Express app
const app: Express = express();
const httpServer = http.createServer(app);
const PORT = env.port;

/**
 * Configure middleware
 */
function configureMiddleware(app: Express): void {
	// Trust proxy for rate limiting and security
	app.set('trust proxy', 1);

	// Security headers
	app.use(
		helmet({
			crossOriginResourcePolicy: { policy: 'cross-origin' },
		})
	);

	// CORS configuration
	app.use(
		cors({
			origin: env.corsOrigin || 'http://localhost:3000',
			credentials: true,
		})
	);

	// Body parsing
	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));

	// Cookie parser
	app.use(cookieParser());

	// HTTP request logging via winston
	app.use(
		morgan(env.nodeEnv === 'production' ? 'combined' : 'dev', {
			stream: morganStream,
		})
	);
}

/**
 * Configure rate limiting
 */
function configureRateLimit(): express.RequestHandler {
	return rateLimit({
		windowMs: 15 * 60 * 1000, // 15 minutes
		max: 100, // 100 requests per IP per 15 minutes
		standardHeaders: 'draft-7',
		legacyHeaders: false,
		message:
			'Too many requests from this IP, please try again after 15 minutes',
	});
}

/**
 * Configure API routes
 */
function configureRoutes(app: Express): void {
	const apiV1Router = express.Router();
	const limiter = configureRateLimit();

	// Apply rate limiting to API routes
	apiV1Router.use(limiter);

	// routes
	apiV1Router.use('/user', userRouter);
	apiV1Router.use('/files', fileRouter);
	apiV1Router.use('/folders', folderRoute);
	apiV1Router.use('/fileshare', fileshareRouter);
	apiV1Router.use('/posts', postRouter);
	apiV1Router.use('/notifications', notificationRouter);
	apiV1Router.use('/postshares', postshareRouter);
	apiV1Router.use('/leaderboard', leaderboardRouter);
	apiV1Router.use('/reports', postreportRouter);
	apiV1Router.use('/profile', profileRouter);

	// Mount v1 API router
	app.use('/api/v1', apiV1Router);

	// Health check endpoint
	app.get('/health', (_req, res) => {
		res.status(200).json({
			status: 'ok',
			timestamp: new Date().toISOString(),
		});
	});

	// 404 handler
	app.use((_req, res) => {
		res.status(404).json({ error: 'Not Found' });
	});

	// Error handler
	app.use(
		(
			err: Error,
			_req: express.Request,
			res: express.Response,
			_next: express.NextFunction
		) => {
			logger.error(err.message, { stack: err.stack });
			res.status(500).json({
				error:
					env.nodeEnv === 'production'
						? 'Internal Server Error'
						: err.message,
			});
		}
	);
}

/**
 * Start the server
 */
function startServer(): void {
	httpServer.listen(PORT, () => {
		logger.info(`Server running on http://localhost:${PORT}`);
		logger.info(`Environment: ${env.nodeEnv}`);
	});
}

// Initialize application
configureMiddleware(app);
configureRoutes(app);
initSocket(httpServer);
startServer();
