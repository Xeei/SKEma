import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { env } from './config/env';

declare module 'socket.io' {
	interface Socket {
		userId?: string;
		userRole?: string;
	}
}

let io: Server | null = null;

export function initSocket(httpServer: HttpServer): Server {
	io = new Server(httpServer, {
		cors: {
			origin: env.corsOrigin || 'http://localhost:3000',
			credentials: true,
		},
	});

	// Auth middleware – verify backend JWT from handshake
	io.use((socket: Socket, next) => {
		const token = socket.handshake.auth?.token as string | undefined;
		if (!token) {
			return next(new Error('Authentication error: no token'));
		}

		const secret = process.env.NEXTAUTH_SECRET;
		if (!secret) {
			return next(new Error('Server configuration error'));
		}

		try {
			const decoded = jwt.verify(token, secret) as {
				sub?: string;
				role?: string;
			};
			if (!decoded.sub) {
				return next(new Error('Authentication error: invalid token'));
			}
			socket.userId = decoded.sub;
			socket.userRole = decoded.role;
			next();
		} catch {
			next(new Error('Authentication error: token verification failed'));
		}
	});

	io.on('connection', (socket: Socket) => {
		const userId = socket.userId!;
		const role = socket.userRole;

		// Every user joins their personal room
		socket.join(`user:${userId}`);
		console.log(`[Socket] Connected: userId=${userId} role=${role}`);

		// Privileged users also join the shared room for new-post notifications
		if (role === 'ADMIN' || role === 'TRUSTED') {
			socket.join('privileged');
			console.log(`[Socket] ${userId} joined privileged room`);
		}

		socket.on('disconnect', () => {
			console.log(`[Socket] Disconnected: userId=${userId}`);
		});
	});

	return io;
}

export function getIO(): Server | null {
	return io;
}
