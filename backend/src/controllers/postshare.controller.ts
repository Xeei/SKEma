import { Request, Response } from 'express';
import {
	createPostShare,
	getPostSharesByPost,
	getPostSharesByUser,
	isPostSharedWithUser,
	deletePostShare,
	revokePostShare,
} from '../models/postshare.model';

// POST /postshares  – share a post
export const createPostShareController = async (
	req: Request,
	res: Response
) => {
	try {
		const { postId, authorId, sharedUserId } = req.body;
		if (!postId || !authorId || !sharedUserId) {
			return res
				.status(400)
				.json({
					error: 'Missing required fields: postId, authorId, sharedUserId',
				});
		}
		const share = await createPostShare(postId, authorId, sharedUserId);
		res.status(201).json(share);
	} catch (err: any) {
		// Unique constraint violation – already shared
		if (err?.code === '23505') {
			return res
				.status(409)
				.json({ error: 'Post already shared with this user' });
		}
		res.status(500).json({ error: 'Failed to share post' });
	}
};

// GET /postshares/post/:postId  – all users this post is shared with
export const getPostSharesByPostController = async (
	req: Request,
	res: Response
) => {
	try {
		const postId = req.params.postId as string;
		const shares = await getPostSharesByPost(postId);
		res.json(shares);
	} catch {
		res.status(500).json({ error: 'Failed to get post shares' });
	}
};

// GET /postshares/user/:sharedUserId  – all posts shared with a user
export const getPostSharesByUserController = async (
	req: Request,
	res: Response
) => {
	try {
		const sharedUserId = req.params.sharedUserId as string;
		const shares = await getPostSharesByUser(sharedUserId);
		res.json(shares);
	} catch {
		res.status(500).json({ error: 'Failed to get post shares' });
	}
};

// GET /postshares/check/:postId/:sharedUserId  – check if a post is shared with a user
export const checkPostShareController = async (req: Request, res: Response) => {
	try {
        const postId = req.params.postId as string
        const sharedUserId = req.params.sharedUserId as string
		const shared = await isPostSharedWithUser(postId, sharedUserId);
		res.json({ shared });
	} catch {
		res.status(500).json({ error: 'Failed to check post share' });
	}
};

// DELETE /postshares/:id  – remove by share id
export const deletePostShareController = async (
	req: Request,
	res: Response
) => {
	try {
		const id = req.params.id as string;
		const share = await deletePostShare(id);
		if (!share) {
			return res.status(404).json({ error: 'Post share not found' });
		}
		res.json(share);
	} catch {
		res.status(500).json({ error: 'Failed to delete post share' });
	}
};

// DELETE /postshares/revoke  – revoke by postId + sharedUserId
export const revokePostShareController = async (
	req: Request,
	res: Response
) => {
	try {
		const { postId, sharedUserId } = req.body;
		if (!postId || !sharedUserId) {
			return res
				.status(400)
				.json({
					error: 'Missing required fields: postId, sharedUserId',
				});
		}
		const share = await revokePostShare(postId, sharedUserId);
		if (!share) {
			return res.status(404).json({ error: 'Post share not found' });
		}
		res.json(share);
	} catch {
		res.status(500).json({ error: 'Failed to revoke post share' });
	}
};
