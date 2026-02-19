import { Request, Response } from 'express';
import {
	createPost,
	getAllPosts,
	getPostById,
	getPostsByAuthor,
	getPublicPosts,
	updatePost,
	deletePost,
	incrementPostViews,
	addFileToPost,
	removeFileFromPost,
	getPostFiles,
	updateFileOrder,
	getPostsByFolder,
} from '../models/post.model';

// Create a new post
export const createPostController = async (req: Request, res: Response) => {
	try {
		const {
			title,
			content,
			description,
			link,
			privacy,
			category,
			tags,
			folderId,
		} = req.body;
		const authorId = req.user?.id;

		if (!authorId || !title || !content) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		const post = await createPost(
			title,
			content,
			authorId,
			description,
			link,
			privacy,
			category,
			tags,
			folderId
		);

		res.status(201).json(post);
	} catch (err) {
		console.error('Error creating post:', err);
		res.status(500).json({ error: 'Failed to create post' });
	}
};

// Get all posts
export const getAllPostsController = async (req: Request, res: Response) => {
	try {
		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.limit as string) || 10;
		const posts = await getAllPosts(page, limit);
		res.json(posts);
	} catch (err) {
		console.error('Error fetching posts:', err);
		res.status(500).json({ error: 'Failed to fetch posts' });
	}
};

// Get public posts only
export const getPublicPostsController = async (req: Request, res: Response) => {
	try {
		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.limit as string) || 10;
		const posts = await getPublicPosts(page, limit);
		res.json(posts);
	} catch (err) {
		console.error('Error fetching public posts:', err);
		res.status(500).json({ error: 'Failed to fetch public posts' });
	}
};

// Get post by ID
export const getPostByIdController = async (req: Request, res: Response) => {
	try {
		const id = req.params.id as string;
		const post = await getPostById(id);

		if (!post) {
			return res.status(404).json({ error: 'Post not found' });
		}

		// Increment view count
		await incrementPostViews(id);

		res.json(post);
	} catch (err) {
		console.error('Error fetching post:', err);
		res.status(500).json({ error: 'Failed to fetch post' });
	}
};

// Get posts by author
export const getPostsByAuthorController = async (
	req: Request,
	res: Response
) => {
	try {
		const authorId = req.params.authorId as string;
		const posts = await getPostsByAuthor(authorId);
		res.json(posts);
	} catch (err) {
		console.error('Error fetching posts by author:', err);
		res.status(500).json({ error: 'Failed to fetch posts' });
	}
};

// Get posts by current user
export const getMyPostsController = async (req: Request, res: Response) => {
	try {
		const userId = req.user?.id;
		if (!userId) {
			return res.status(401).json({ error: 'Unauthorized' });
		}

		const posts = await getPostsByAuthor(userId);
		res.json(posts);
	} catch (err) {
		console.error('Error fetching my posts:', err);
		res.status(500).json({ error: 'Failed to fetch posts' });
	}
};

// Update post
export const updatePostController = async (req: Request, res: Response) => {
	try {
		const id = req.params.id as string;
		const userId = req.user?.id;
		const {
			title,
			content,
			description,
			link,
			privacy,
			category,
			tags,
			folderId,
		} = req.body;

		if (!userId) {
			return res.status(401).json({ error: 'Unauthorized' });
		}

		// Check if post exists and user is the author
		const existingPost = await getPostById(id);
		if (!existingPost) {
			return res.status(404).json({ error: 'Post not found' });
		}

		if (existingPost.authorId !== userId) {
			return res.status(403).json({
				error: 'Forbidden: You can only update your own posts',
			});
		}

		const updatedPost = await updatePost(
			id,
			title,
			content,
			description,
			link,
			privacy,
			category,
			tags,
			folderId
		);

		res.json(updatedPost);
	} catch (err) {
		console.error('Error updating post:', err);
		res.status(500).json({ error: 'Failed to update post' });
	}
};

// Delete post
export const deletePostController = async (req: Request, res: Response) => {
	try {
		const id = req.params.id as string;
		const userId = req.user?.id;

		if (!userId) {
			return res.status(401).json({ error: 'Unauthorized' });
		}

		// Check if post exists and user is the author
		const existingPost = await getPostById(id);
		if (!existingPost) {
			return res.status(404).json({ error: 'Post not found' });
		}

		if (existingPost.authorId !== userId) {
			return res.status(403).json({
				error: 'Forbidden: You can only delete your own posts',
			});
		}

		const deletedPost = await deletePost(id);
		res.json(deletedPost);
	} catch (err) {
		console.error('Error deleting post:', err);
		res.status(500).json({ error: 'Failed to delete post' });
	}
};

// Add file to post
export const addFileToPostController = async (req: Request, res: Response) => {
	try {
		const postId = req.params.id as string;
		const { fileId, order } = req.body;
		const userId = req.user?.id;

		if (!userId || !fileId) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		// Check if post exists and user is the author
		const existingPost = await getPostById(postId);
		if (!existingPost) {
			return res.status(404).json({ error: 'Post not found' });
		}

		if (existingPost.authorId !== userId) {
			return res.status(403).json({
				error: 'Forbidden: You can only modify your own posts',
			});
		}

		const postFile = await addFileToPost(postId, fileId, order || 0);
		res.status(201).json(postFile);
	} catch (err) {
		console.error('Error adding file to post:', err);
		res.status(500).json({ error: 'Failed to add file to post' });
	}
};

// Remove file from post
export const removeFileFromPostController = async (
	req: Request,
	res: Response
) => {
	try {
		const postId = req.params.id as string;
		const fileId = req.params.fileId as string;
		const userId = req.user?.id;

		if (!userId) {
			return res.status(401).json({ error: 'Unauthorized' });
		}

		// Check if post exists and user is the author
		const existingPost = await getPostById(postId);
		if (!existingPost) {
			return res.status(404).json({ error: 'Post not found' });
		}

		if (existingPost.authorId !== userId) {
			return res.status(403).json({
				error: 'Forbidden: You can only modify your own posts',
			});
		}

		await removeFileFromPost(postId, fileId);
		res.json({ message: 'File removed from post successfully' });
	} catch (err) {
		console.error('Error removing file from post:', err);
		res.status(500).json({ error: 'Failed to remove file from post' });
	}
};

// Get files for a post
export const getPostFilesController = async (req: Request, res: Response) => {
	try {
		const postId = req.params.id as string;
		const files = await getPostFiles(postId);
		res.json(files);
	} catch (err) {
		console.error('Error fetching post files:', err);
		res.status(500).json({ error: 'Failed to fetch post files' });
	}
};

// Update file order in post
export const updateFileOrderController = async (
	req: Request,
	res: Response
) => {
	try {
		const postId = req.params.id as string;
		const fileId = req.params.fileId as string;
		const { order } = req.body;
		const userId = req.user?.id;

		if (!userId || order === undefined) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		// Check if post exists and user is the author
		const existingPost = await getPostById(postId);
		if (!existingPost) {
			return res.status(404).json({ error: 'Post not found' });
		}

		if (existingPost.authorId !== userId) {
			return res.status(403).json({
				error: 'Forbidden: You can only modify your own posts',
			});
		}

		await updateFileOrder(postId, fileId, order);
		res.json({ message: 'File order updated successfully' });
	} catch (err) {
		console.error('Error updating file order:', err);
		res.status(500).json({ error: 'Failed to update file order' });
	}
};

// Get posts by folder
export const getPostsByFolderController = async (
	req: Request,
	res: Response
) => {
	try {
		const folderId = req.params.folderId as string;
		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.limit as string) || 10;
		const posts = await getPostsByFolder(folderId, page, limit);
		res.json(posts);
	} catch (err) {
		console.error('Error fetching posts by folder:', err);
		res.status(500).json({ error: 'Failed to fetch posts by folder' });
	}
};
