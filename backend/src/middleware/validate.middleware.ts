import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError, ZodIssue } from 'zod';

/**
 * Validates req.body against the given Zod schema.
 * Replaces req.body with the parsed (coerced + defaulted) output.
 */
export const validateBody =
	(schema: ZodSchema) =>
	(req: Request, res: Response, next: NextFunction) => {
		const result = schema.safeParse(req.body);
		if (!result.success) {
			return res.status(400).json({
				error: 'Validation failed',
				details: formatZodError(result.error),
			});
		}
		req.body = result.data;
		next();
	};

/**
 * Validates req.query against the given Zod schema.
 * Replaces req.query with the parsed output.
 */
export const validateQuery =
	(schema: ZodSchema) =>
	(req: Request, res: Response, next: NextFunction) => {
		const result = schema.safeParse(req.query);
		if (!result.success) {
			return res.status(400).json({
				error: 'Validation failed',
				details: formatZodError(result.error),
			});
		}
		// @ts-expect-error – replace parsed query
		req.query = result.data;
		next();
	};

function formatZodError(error: ZodError) {
	return error.issues.map((e: ZodIssue) => ({
		field: e.path.join('.'),
		message: e.message,
	}));
}
