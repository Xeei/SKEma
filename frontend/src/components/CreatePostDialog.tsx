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
import { Plus, X, FileIcon } from 'lucide-react';

interface CreatePostDialogProps {
	onPostCreated?: () => void;
	folderId?: string;
}

export function CreatePostDialog({ onPostCreated, folderId }: CreatePostDialogProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [link, setLink] = useState('');
	const [content, setContent] = useState('');
	const [isAnonymous, setIsAnonymous] = useState(false);
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!title.trim() || !content.trim()) {
			alert('Title and content are required');
			return;
		}

		setLoading(true);
		try {
			const post = await createPost({
				title: title.trim(),
				content: content.trim(),
				description: description.trim() || undefined,
				link: link.trim() || undefined,
				privacy: 'PUBLIC',
				folderId,
				isAnonymous,
			});

			if (selectedFiles.length > 0) {
				for (let i = 0; i < selectedFiles.length; i++) {
					const uploadedFile = await uploadFile(selectedFiles[i], undefined, undefined, 'PUBLIC');
					await addFileToPost(post.id, uploadedFile.id, i);
				}
			}

			setTitle('');
			setDescription('');
			setLink('');
			setContent('');
			setIsAnonymous(false);
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
			const incoming = Array.from(e.target.files);
			setSelectedFiles((prev) => {
				const existingNames = new Set(prev.map((f) => f.name));
				const unique = incoming.filter((f) => !existingNames.has(f.name));
				return [...prev, ...unique];
			});
			// Reset input so the same file can be re-added after removal
			e.target.value = '';
		}
	};

	const removeSelectedFile = (index: number) => {
		setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button className="bg-[#006837] hover:bg-[#005530] gap-2">
					<Plus className="w-4 h-4" />
					Create Post
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Create New Post</DialogTitle>
					<DialogDescription>
						Write your post using Markdown — supports headings, code blocks, lists, and more.
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

					<div className="flex items-center gap-2">
						<input
							type="checkbox"
							id="isAnonymous"
							checked={isAnonymous}
							onChange={(e) => setIsAnonymous(e.target.checked)}
							disabled={loading}
							className="w-4 h-4 accent-[#006837] cursor-pointer"
						/>
						<label htmlFor="isAnonymous" className="text-sm font-medium cursor-pointer select-none">
							Post anonymously{' '}
							<span className="text-muted-foreground font-normal">
								(your name will not be shown)
							</span>
						</label>
					</div>

					<div>
						<label className="text-sm font-medium">Attach Files</label>
						<label className="mt-1 flex items-center gap-2 w-fit cursor-pointer">
							<span className="border rounded px-3 py-1.5 text-sm bg-muted hover:bg-accent transition-colors flex items-center gap-2">
								<Plus className="w-4 h-4" />
								Add Files
							</span>
							<input
								type="file"
								multiple
								onChange={handleFileChange}
								disabled={loading}
								className="hidden"
							/>
						</label>
						{selectedFiles.length > 0 && (
							<ul className="mt-2 space-y-1">
								{selectedFiles.map((file, i) => (
									<li
										key={i}
										className="flex items-center justify-between gap-2 border rounded px-3 py-1.5 text-sm bg-muted/50"
									>
										<div className="flex items-center gap-2 min-w-0">
											<FileIcon className="w-4 h-4 shrink-0 text-muted-foreground" />
											<span className="truncate">{file.name}</span>
											<span className="text-xs text-muted-foreground shrink-0">
												({(file.size / 1024).toFixed(1)} KB)
											</span>
										</div>
										<button
											type="button"
											onClick={() => removeSelectedFile(i)}
											disabled={loading}
											className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
										>
											<X className="w-4 h-4" />
										</button>
									</li>
								))}
							</ul>
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
