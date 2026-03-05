import { z } from 'zod';

// ── Shared ────────────────────────────────────────────────────────────────────

export const paginationSchema = z.object({
	page: z
		.string()
		.optional()
		.transform((v) => (v ? parseInt(v, 10) : 1))
		.pipe(z.number().int().min(1)),
	limit: z
		.string()
		.optional()
		.transform((v) => (v ? parseInt(v, 10) : 10))
		.pipe(z.number().int().min(1).max(100)),
});

const privacyEnum = z.enum(['PUBLIC', 'PRIVATE', 'SHARED']);

// ── Post ──────────────────────────────────────────────────────────────────────

export const createPostSchema = z.object({
	title: z.string().min(1, 'Title is required').max(300, 'Title too long'),
	content: z.string().min(1, 'Content is required'),
	description: z
		.string()
		.max(2000, 'Description too long')
		.optional()
		.nullable(),
	link: z.string().url('Link must be a valid URL').optional().nullable(),
	privacy: privacyEnum.default('PRIVATE'),
	category: z.string().max(100, 'Category too long').optional().nullable(),
	tags: z.array(z.string().max(50)).max(20, 'Max 20 tags').optional(),
	folderId: z.string().uuid('Invalid folder ID').optional().nullable(),
	isAnonymous: z.boolean().default(false),
});

export const updatePostSchema = z.object({
	title: z.string().min(1).max(300).optional(),
	content: z.string().min(1).optional(),
	description: z.string().max(2000).optional().nullable(),
	link: z.string().url('Link must be a valid URL').optional().nullable(),
	privacy: privacyEnum.optional(),
	category: z.string().max(100).optional().nullable(),
	tags: z.array(z.string().max(50)).max(20).optional(),
	folderId: z.string().uuid('Invalid folder ID').optional().nullable(),
});

// ── Folder ────────────────────────────────────────────────────────────────────

export const createFolderSchema = z.object({
	name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
	description: z
		.string()
		.max(1000, 'Description too long')
		.optional()
		.nullable(),
	parentId: z.string().uuid('Invalid parent folder ID').optional().nullable(),
});

export const updateFolderSchema = z.object({
	name: z.string().min(1).max(200).optional(),
	description: z.string().max(1000).optional().nullable(),
});

// ── File upload ───────────────────────────────────────────────────────────────

export const uploadFileBodySchema = z.object({
	folderId: z.string().uuid('Invalid folder ID').optional().nullable(),
	privacy: privacyEnum.default('PRIVATE'),
});
