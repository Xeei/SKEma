'use client';

import { useState, useEffect } from 'react';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Edit } from 'lucide-react';
import { updatePost, PostData } from '@/services/post.service';

interface EditPostDialogProps {
	post: PostData;
	onPostUpdated?: () => void;
}

export function EditPostDialog({ post, onPostUpdated }: EditPostDialogProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [title, setTitle] = useState(post.title);
	const [description, setDescription] = useState(post.description || '');
	const [link, setLink] = useState(post.link || '');
	const [content, setContent] = useState(post.content);
	const [category, setCategory] = useState(post.category || '');
	const [tags, setTags] = useState(post.tags?.join(', ') || '');
	const [privacy, setPrivacy] = useState<'PUBLIC' | 'PRIVATE' | 'SHARED'>(post.privacy);

	// Update form when post prop changes
	useEffect(() => {
		setTitle(post.title);
		setDescription(post.description || '');
		setLink(post.link || '');
		setContent(post.content);
		setCategory(post.category || '');
		setTags(post.tags?.join(', ') || '');
		setPrivacy(post.privacy);
	}, [post]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!title.trim() || !content.trim()) {
			alert('Title and content are required');
			return;
		}

		setLoading(true);
		try {
			await updatePost(post.id, {
				title: title.trim(),
				content: content.trim(),
				description: description.trim() || undefined,
				link: link.trim() || undefined,
				category: category.trim() || undefined,
				tags: tags
					.split(',')
					.map((t) => t.trim())
					.filter((t) => t.length > 0),
				privacy,
			});

			setOpen(false);
			alert('Post updated successfully!');
			onPostUpdated?.();
		} catch (error) {
			console.error('Error updating post:', error);
			alert('Failed to update post');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm" className="gap-2">
					<Edit className="w-4 h-4" />
					Edit Post
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Edit Post</DialogTitle>
					<DialogDescription>Update your post details</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label className="text-sm font-medium">
							Title <span className="text-red-500">*</span>
						</label>
						<Input
							type="text"
							placeholder="Enter post title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							disabled={loading}
							required
						/>
					</div>

					<div>
						<label className="text-sm font-medium">Description</label>
						<Input
							type="text"
							placeholder="Short description (optional)"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							disabled={loading}
						/>
					</div>

					<div>
						<label className="text-sm font-medium">Link</label>
						<Input
							type="url"
							placeholder="https://example.com (optional)"
							value={link}
							onChange={(e) => setLink(e.target.value)}
							disabled={loading}
						/>
					</div>

					<div>
						<label className="text-sm font-medium">
							Content <span className="text-red-500">*</span>
						</label>
						<Textarea
							placeholder="Enter post content"
							value={content}
							onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
							disabled={loading}
							rows={8}
							required
						/>
					</div>

					<div>
						<label className="text-sm font-medium">Category</label>
						<Input
							type="text"
							placeholder="e.g., Tutorial, Guide (optional)"
							value={category}
							onChange={(e) => setCategory(e.target.value)}
							disabled={loading}
						/>
					</div>

					<div>
						<label className="text-sm font-medium">Tags</label>
						<Input
							type="text"
							placeholder="Comma-separated tags (optional)"
							value={tags}
							onChange={(e) => setTags(e.target.value)}
							disabled={loading}
						/>
					</div>

					<div>
						<label className="text-sm font-medium">Privacy</label>
						<select
							className="w-full border rounded px-3 py-2 bg-background"
							value={privacy}
							onChange={(e) => setPrivacy(e.target.value as 'PUBLIC' | 'PRIVATE' | 'SHARED')}
							disabled={loading}
						>
							<option value="PUBLIC">Public</option>
							<option value="PRIVATE">Private</option>
							<option value="SHARED">Shared</option>
						</select>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
							disabled={loading}
						>
							Cancel
						</Button>
						<Button type="submit" className="bg-[#006837] hover:bg-[#005530]" disabled={loading}>
							{loading ? 'Updating...' : 'Update Post'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
