import {
	paginationSchema,
	createPostSchema,
	createFolderSchema,
} from '../../schemas/index';

// ── paginationSchema ──────────────────────────────────────────────────────────

describe('paginationSchema', () => {
	describe('valid inputs', () => {
		it('returns defaults when no values are provided', () => {
			const result = paginationSchema.safeParse({});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toEqual({ page: 1, limit: 10 });
			}
		});

		it('parses string numbers into integers', () => {
			const result = paginationSchema.safeParse({ page: '3', limit: '25' });
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toEqual({ page: 3, limit: 25 });
			}
		});

		it('accepts the minimum valid values (page=1, limit=1)', () => {
			const result = paginationSchema.safeParse({ page: '1', limit: '1' });
			expect(result.success).toBe(true);
		});

		it('accepts the maximum valid limit (100)', () => {
			const result = paginationSchema.safeParse({ limit: '100' });
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.limit).toBe(100);
			}
		});
	});

	describe('invalid inputs', () => {
		it('fails when page is 0', () => {
			const result = paginationSchema.safeParse({ page: '0' });
			expect(result.success).toBe(false);
		});

		it('fails when page is negative', () => {
			const result = paginationSchema.safeParse({ page: '-1' });
			expect(result.success).toBe(false);
		});

		it('fails when limit exceeds 100', () => {
			const result = paginationSchema.safeParse({ limit: '101' });
			expect(result.success).toBe(false);
		});

		it('fails when limit is 0', () => {
			const result = paginationSchema.safeParse({ limit: '0' });
			expect(result.success).toBe(false);
		});

		it('fails when page is a non-numeric string', () => {
			const result = paginationSchema.safeParse({ page: 'abc' });
			expect(result.success).toBe(false);
		});
	});
});

// ── createPostSchema ──────────────────────────────────────────────────────────

describe('createPostSchema', () => {
	const minimalValid = {
		title: 'My Post Title',
		content: 'Some content here',
	};

	describe('valid inputs', () => {
		it('accepts a minimal valid post (only required fields)', () => {
			const result = createPostSchema.safeParse(minimalValid);
			expect(result.success).toBe(true);
			if (result.success) {
				// defaults should be applied
				expect(result.data.privacy).toBe('PRIVATE');
				expect(result.data.isAnonymous).toBe(false);
			}
		});

		it('accepts a fully populated post', () => {
			const result = createPostSchema.safeParse({
				title: 'Full Post',
				content: 'Detailed content',
				description: 'A short description',
				link: 'https://example.com',
				privacy: 'PUBLIC',
				category: 'Technology',
				tags: ['typescript', 'jest'],
				folderId: 'folder-abc',
				isAnonymous: true,
			});
			expect(result.success).toBe(true);
		});

		it('accepts SHARED as a valid privacy value', () => {
			const result = createPostSchema.safeParse({ ...minimalValid, privacy: 'SHARED' });
			expect(result.success).toBe(true);
		});

		it('accepts null for optional nullable fields', () => {
			const result = createPostSchema.safeParse({
				...minimalValid,
				description: null,
				link: null,
				folderId: null,
				category: null,
			});
			expect(result.success).toBe(true);
		});

		it('accepts up to 20 tags', () => {
			const tags = Array.from({ length: 20 }, (_, i) => `tag${i}`);
			const result = createPostSchema.safeParse({ ...minimalValid, tags });
			expect(result.success).toBe(true);
		});
	});

	describe('invalid inputs', () => {
		it('fails when title is missing', () => {
			const result = createPostSchema.safeParse({ content: 'Some content' });
			expect(result.success).toBe(false);
		});

		it('fails when title is empty string', () => {
			const result = createPostSchema.safeParse({ ...minimalValid, title: '' });
			expect(result.success).toBe(false);
		});

		it('fails when title exceeds 300 characters', () => {
			const result = createPostSchema.safeParse({
				...minimalValid,
				title: 'a'.repeat(301),
			});
			expect(result.success).toBe(false);
		});

		it('fails when content is missing', () => {
			const result = createPostSchema.safeParse({ title: 'A title' });
			expect(result.success).toBe(false);
		});

		it('fails when content is empty string', () => {
			const result = createPostSchema.safeParse({ ...minimalValid, content: '' });
			expect(result.success).toBe(false);
		});

		it('fails when link is not a valid URL', () => {
			const result = createPostSchema.safeParse({
				...minimalValid,
				link: 'not-a-url',
			});
			expect(result.success).toBe(false);
		});

		it('fails when privacy is an invalid enum value', () => {
			const result = createPostSchema.safeParse({
				...minimalValid,
				privacy: 'FRIENDS_ONLY',
			});
			expect(result.success).toBe(false);
		});

		it('fails when description exceeds 2000 characters', () => {
			const result = createPostSchema.safeParse({
				...minimalValid,
				description: 'x'.repeat(2001),
			});
			expect(result.success).toBe(false);
		});

		it('fails when tags array exceeds 20 items', () => {
			const tags = Array.from({ length: 21 }, (_, i) => `tag${i}`);
			const result = createPostSchema.safeParse({ ...minimalValid, tags });
			expect(result.success).toBe(false);
		});

		it('fails when a tag exceeds 50 characters', () => {
			const result = createPostSchema.safeParse({
				...minimalValid,
				tags: ['a'.repeat(51)],
			});
			expect(result.success).toBe(false);
		});
	});
});

// ── createFolderSchema ────────────────────────────────────────────────────────

describe('createFolderSchema', () => {
	describe('valid inputs', () => {
		it('accepts a minimal folder with only a name', () => {
			const result = createFolderSchema.safeParse({ name: 'My Folder' });
			expect(result.success).toBe(true);
		});

		it('accepts a folder with all optional fields populated', () => {
			const result = createFolderSchema.safeParse({
				name: 'Subfolder',
				description: 'Holds project files',
				parentId: 'parent-folder-id',
			});
			expect(result.success).toBe(true);
		});

		it('accepts null for optional nullable fields', () => {
			const result = createFolderSchema.safeParse({
				name: 'Root',
				description: null,
				parentId: null,
			});
			expect(result.success).toBe(true);
		});

		it('accepts a name at the maximum length (200 chars)', () => {
			const result = createFolderSchema.safeParse({ name: 'a'.repeat(200) });
			expect(result.success).toBe(true);
		});
	});

	describe('invalid inputs', () => {
		it('fails when name is missing', () => {
			const result = createFolderSchema.safeParse({});
			expect(result.success).toBe(false);
		});

		it('fails when name is empty string', () => {
			const result = createFolderSchema.safeParse({ name: '' });
			expect(result.success).toBe(false);
		});

		it('fails when name exceeds 200 characters', () => {
			const result = createFolderSchema.safeParse({ name: 'a'.repeat(201) });
			expect(result.success).toBe(false);
		});

		it('fails when description exceeds 1000 characters', () => {
			const result = createFolderSchema.safeParse({
				name: 'Valid Name',
				description: 'd'.repeat(1001),
			});
			expect(result.success).toBe(false);
		});

		it('fails when parentId is an empty string', () => {
			// schema uses min(1) for parentId so empty string is invalid
			const result = createFolderSchema.safeParse({
				name: 'Valid Name',
				parentId: '',
			});
			expect(result.success).toBe(false);
		});
	});
});
