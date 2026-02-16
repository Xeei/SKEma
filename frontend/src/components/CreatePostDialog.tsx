'use client';

import { useState } from 'react';
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
import { createPost, addFileToPost } from '@/services/post.service';
import { uploadFile } from '@/services/file.service';
import { Plus } from 'lucide-react';

interface CreatePostDialogProps {
	onPostCreated?: () => void;
	folderId?: string;
}

export function CreatePostDialog({ onPostCreated, folderId }: CreatePostDialogProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [content, setContent] = useState('');
	const [category, setCategory] = useState('');
	const [tags, setTags] = useState('');
	const [privacy, setPrivacy] = useState<'PUBLIC' | 'PRIVATE' | 'SHARED'>('PUBLIC');
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!title.trim() || !content.trim()) {
			alert('Title and content are required');
			return;
		}

		setLoading(true);
		try {
			// Create the post
			const post = await createPost({
				title: title.trim(),
				content: content.trim(),
				description: description.trim() || undefined,
				category: category.trim() || undefined,
				tags: tags
					.split(',')
					.map((t) => t.trim())
					.filter((t) => t.length > 0),
				privacy,
				folderId,
			});

			// Upload and attach files
			if (selectedFiles.length > 0) {
				for (let i = 0; i < selectedFiles.length; i++) {
					const file = selectedFiles[i];
					const uploadedFile = await uploadFile(file, undefined, undefined, privacy);
					await addFileToPost(post.id, uploadedFile.id, i);
				}
			}

			// Reset form
			setTitle('');
			setDescription('');
			setContent('');
			setCategory('');
			setTags('');
			setPrivacy('PUBLIC');
			setSelectedFiles([]);
			setOpen(false);

			alert('Post created successfully!');
			onPostCreated?.();
		} catch (error) {
			console.error('Error creating post:', error);
			alert('Failed to create post');
		} finally {
			setLoading(false);
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			setSelectedFiles(Array.from(e.target.files));
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button className="bg-[#006837] hover:bg-[#005530] gap-2">
					<Plus className="w-4 h-4" />
					Create Post
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Create New Post</DialogTitle>
					<DialogDescription>
						Create a guide or tutorial post with optional file attachments
					</DialogDescription>
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
						<label className="text-sm font-medium">
							Content <span className="text-red-500">*</span>
						</label>
						<textarea
							placeholder="Write your post content here..."
							value={content}
							onChange={(e) => setContent(e.target.value)}
							disabled={loading}
							required
							rows={8}
							className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006837]"
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="text-sm font-medium">Category</label>
							<Input
								type="text"
								placeholder="e.g., Tutorial, Guide"
								value={category}
								onChange={(e) => setCategory(e.target.value)}
								disabled={loading}
							/>
						</div>

						<div>
							<label className="text-sm font-medium">Privacy</label>
							<select
								value={privacy}
								onChange={(e) => setPrivacy(e.target.value as 'PUBLIC' | 'PRIVATE' | 'SHARED')}
								disabled={loading}
								className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006837]"
							>
								<option value="PUBLIC">Public</option>
								<option value="PRIVATE">Private</option>
								<option value="SHARED">Shared</option>
							</select>
						</div>
					</div>

					<div>
						<label className="text-sm font-medium">Tags</label>
						<Input
							type="text"
							placeholder="Comma separated tags (e.g., programming, tutorial)"
							value={tags}
							onChange={(e) => setTags(e.target.value)}
							disabled={loading}
						/>
					</div>

					<div>
						<label className="text-sm font-medium">Attach Files</label>
						<input
							type="file"
							multiple
							onChange={handleFileChange}
							disabled={loading}
							className="w-full border rounded px-3 py-2 text-sm"
						/>
						{selectedFiles.length > 0 && (
							<p className="text-xs text-muted-foreground mt-1">
								{selectedFiles.length} file(s) selected
							</p>
						)}
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
							{loading ? 'Creating...' : 'Create Post'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
