import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../../middleware/auth.middleware';

// Mock jsonwebtoken so we never touch crypto in unit tests
jest.mock('jsonwebtoken');

const mockedJwt = jest.mocked(jwt);

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildReq(authHeader?: string): Partial<Request> {
	return {
		headers: authHeader ? { authorization: authHeader } : {},
	};
}

function buildRes(): { res: Partial<Response>; json: jest.Mock; status: jest.Mock } {
	const json = jest.fn().mockReturnThis();
	const status = jest.fn().mockReturnValue({ json });
	const res = { status } as unknown as Partial<Response>;
	return { res, json, status };
}

function buildNext(): NextFunction {
	return jest.fn();
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('authMiddleware', () => {
	const VALID_SECRET = 'test-secret';
	const VALID_PAYLOAD = {
		sub: 'user-123',
		email: 'user@example.com',
		name: 'Test User',
		role: 'USER',
	};

	beforeEach(() => {
		// Provide a secret by default; individual tests may delete it
		process.env.NEXTAUTH_SECRET = VALID_SECRET;
	});

	afterEach(() => {
		delete process.env.NEXTAUTH_SECRET;
	});

	// ── 1. No Authorization header ─────────────────────────────────────────────

	it('returns 401 when Authorization header is absent', async () => {
		const req = buildReq() as Request;
		const { res, status, json } = buildRes();
		const next = buildNext();

		await authMiddleware(req, res as Response, next);

		expect(status).toHaveBeenCalledWith(401);
		expect(json).toHaveBeenCalledWith({ error: 'Unauthorized - No token provided' });
		expect(next).not.toHaveBeenCalled();
	});

	it('returns 401 when Authorization header does not start with "Bearer "', async () => {
		const req = buildReq('Basic some-credentials') as Request;
		const { res, status, json } = buildRes();
		const next = buildNext();

		await authMiddleware(req, res as Response, next);

		expect(status).toHaveBeenCalledWith(401);
		expect(json).toHaveBeenCalledWith({ error: 'Unauthorized - No token provided' });
		expect(next).not.toHaveBeenCalled();
	});

	// ── 2. Missing NEXTAUTH_SECRET ─────────────────────────────────────────────

	it('returns 500 when NEXTAUTH_SECRET is not set', async () => {
		delete process.env.NEXTAUTH_SECRET;

		const req = buildReq('Bearer some.jwt.token') as Request;
		const { res, status, json } = buildRes();
		const next = buildNext();

		await authMiddleware(req, res as Response, next);

		expect(status).toHaveBeenCalledWith(500);
		expect(json).toHaveBeenCalledWith({ error: 'Server configuration error' });
		expect(next).not.toHaveBeenCalled();
	});

	// ── 3. Invalid token ───────────────────────────────────────────────────────

	it('returns 401 when jwt.verify throws JsonWebTokenError', async () => {
		mockedJwt.verify.mockImplementation(() => {
			throw new jwt.JsonWebTokenError('invalid signature');
		});

		const req = buildReq('Bearer bad.token.here') as Request;
		const { res, status, json } = buildRes();
		const next = buildNext();

		await authMiddleware(req, res as Response, next);

		expect(status).toHaveBeenCalledWith(401);
		expect(json).toHaveBeenCalledWith({ error: 'Unauthorized - Invalid token' });
		expect(next).not.toHaveBeenCalled();
	});

	it('returns 401 when decoded token is missing sub or email', async () => {
		// jwt.verify succeeds but returns an incomplete payload
		(mockedJwt.verify as jest.Mock).mockReturnValue({ name: 'Ghost' }); // no sub/email

		const req = buildReq('Bearer incomplete.token') as Request;
		const { res, status, json } = buildRes();
		const next = buildNext();

		await authMiddleware(req, res as Response, next);

		expect(status).toHaveBeenCalledWith(401);
		expect(json).toHaveBeenCalledWith({ error: 'Unauthorized - Invalid token' });
		expect(next).not.toHaveBeenCalled();
	});

	// ── 4. Expired token ───────────────────────────────────────────────────────

	it('returns 401 when jwt.verify throws TokenExpiredError', async () => {
		mockedJwt.verify.mockImplementation(() => {
			throw new jwt.TokenExpiredError('jwt expired', new Date());
		});

		const req = buildReq('Bearer expired.token.here') as Request;
		const { res, status, json } = buildRes();
		const next = buildNext();

		await authMiddleware(req, res as Response, next);

		expect(status).toHaveBeenCalledWith(401);
		expect(json).toHaveBeenCalledWith({ error: 'Unauthorized - Token expired' });
		expect(next).not.toHaveBeenCalled();
	});

	// ── 5. Valid token ─────────────────────────────────────────────────────────

	it('calls next() and attaches req.user when token is valid', async () => {
		(mockedJwt.verify as jest.Mock).mockReturnValue(VALID_PAYLOAD);

		const req = buildReq('Bearer valid.jwt.token') as Request;
		const { res } = buildRes();
		const next = buildNext();

		await authMiddleware(req, res as Response, next);

		expect(next).toHaveBeenCalledTimes(1);
		expect(req.user).toEqual({
			id: VALID_PAYLOAD.sub,
			email: VALID_PAYLOAD.email,
			name: VALID_PAYLOAD.name,
			role: VALID_PAYLOAD.role,
		});
	});

	it('attaches req.user with optional fields undefined when not in token', async () => {
		const minimalPayload = { sub: 'user-456', email: 'minimal@example.com' };
		(mockedJwt.verify as jest.Mock).mockReturnValue(minimalPayload);

		const req = buildReq('Bearer minimal.jwt.token') as Request;
		const { res } = buildRes();
		const next = buildNext();

		await authMiddleware(req, res as Response, next);

		expect(next).toHaveBeenCalledTimes(1);
		expect(req.user).toEqual({
			id: 'user-456',
			email: 'minimal@example.com',
			name: undefined,
			role: undefined,
		});
	});

	it('passes the correct secret and token to jwt.verify', async () => {
		(mockedJwt.verify as jest.Mock).mockReturnValue(VALID_PAYLOAD);

		const req = buildReq('Bearer my.exact.token') as Request;
		const { res } = buildRes();
		const next = buildNext();

		await authMiddleware(req, res as Response, next);

		expect(mockedJwt.verify).toHaveBeenCalledWith('my.exact.token', VALID_SECRET);
	});
});
