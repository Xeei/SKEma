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
import { Edit, Plus, X, FileIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { isAllowedFileType, ALLOWED_EXTENSIONS } from '@/lib/allowedFileTypes';
import {
	updatePost,
	PostData,
	getPostFiles,
	addFileToPost,
	removeFileFromPost,
	PostFileData,
} from '@/services/post.service';
import { uploadFile } from '@/services/file.service';

interface EditPostDialogProps {
	post: PostData;
	onPostUpdated?: () => void;
	asMenuItem?: boolean;
}

export function EditPostDialog({ post, onPostUpdated, asMenuItem = false }: EditPostDialogProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [title, setTitle] = useState(post.title);
	const [description, setDescription] = useState(post.description || '');
	const [link, setLink] = useState(post.link || '');
	const [content, setContent] = useState(post.content);
	const [category, setCategory] = useState(post.category || '');
	const [tags, setTags] = useState(post.tags?.join(', ') || '');
	const [privacy, setPrivacy] = useState<'PUBLIC' | 'PRIVATE' | 'SHARED'>(post.privacy);

	// File management state
	const [existingFiles, setExistingFiles] = useState<PostFileData[]>([]);
	const [filesToRemove, setFilesToRemove] = useState<Set<string>>(new Set());
	const [newFiles, setNewFiles] = useState<File[]>([]);
	const [filesLoading, setFilesLoading] = useState(false);

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

	// Load existing files when dialog opens
	useEffect(() => {
		if (open) {
			setFilesLoading(true);
			setFilesToRemove(new Set());
			setNewFiles([]);
			getPostFiles(post.id)
				.then(setExistingFiles)
				.catch(() => setExistingFiles([]))
				.finally(() => setFilesLoading(false));
		}
	}, [open, post.id]);

	const toggleRemoveFile = (postFileId: string) => {
		setFilesToRemove((prev) => {
			const next = new Set(prev);
			if (next.has(postFileId)) {
				next.delete(postFileId);
			} else {
				next.add(postFileId);
			}
			return next;
		});
	};

	const handleNewFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			const incoming = Array.from(e.target.files);
			const invalid = incoming.filter((f) => !isAllowedFileType(f));
			if (invalid.length > 0) {
				toast.error(`ไฟล์ไม่รองรับ: ${invalid.map((f) => f.name).join(', ')}`);
				e.target.value = '';
				return;
			}
			setNewFiles((prev) => {
				const existingNames = new Set(prev.map((f) => f.name));
				const unique = incoming.filter((f) => !existingNames.has(f.name));
				return [...prev, ...unique];
			});
			e.target.value = '';
		}
	};

	const removeNewFile = (index: number) => {
		setNewFiles((prev) => prev.filter((_, i) => i !== index));
	};

	const handleSubmit = async (e: React.SyntheticEvent) => {
		e.preventDefault();
		if (!title.trim() || !content.trim()) {
			toast.error('กรุณากรอกชื่อโพสต์และเนื้อหา');
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

			// Remove files marked for deletion
			for (const postFileId of filesToRemove) {
				const pf = existingFiles.find((f) => f.id === postFileId);
				if (pf) {
					await removeFileFromPost(post.id, pf.fileId);
				}
			}

			// Upload and attach new files
			const startOrder = existingFiles.filter((f) => !filesToRemove.has(f.id)).length;
			for (let i = 0; i < newFiles.length; i++) {
				const uploaded = await uploadFile(newFiles[i], undefined, undefined, 'PUBLIC');
				await addFileToPost(post.id, uploaded.id, startOrder + i);
			}

			setOpen(false);
			toast.success('แก้ไขโพสต์สำเร็จ!');
			onPostUpdated?.();
		} catch (error) {
			console.error('Error updating post:', error);
			toast.error('ไม่สามารถแก้ไขโพสต์ได้ กรุณาลองใหม่');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{asMenuItem ? (
					<span className="flex w-full cursor-pointer items-center gap-2">
						<Edit className="w-4 h-4" />
						Edit Post
					</span>
				) : (
					<Button variant="outline" size="sm" className="gap-2 py-4">
						<Edit className="w-4 h-4" />
						Edit Post
					</Button>
				)}
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
							onKeyDown={(e) => e.stopPropagation()}
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
							onKeyDown={(e) => e.stopPropagation()}
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
							onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => e.stopPropagation()}
							disabled={loading}
							rows={8}
							required
						/>
					</div>

					{/* <div>
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
					</div> */}

					{/* File Management */}
					<div>
						<label className="text-sm font-medium">Attached Files</label>

						{filesLoading ? (
							<div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
								<Loader2 className="w-4 h-4 animate-spin" />
								Loading files…
							</div>
						) : (
							<>
								{/* Existing files */}
								{existingFiles.length > 0 && (
									<ul className="mt-2 space-y-1">
										{existingFiles.map((pf) => {
											const markedForRemoval = filesToRemove.has(pf.id);
											return (
												<li
													key={pf.id}
													className={`flex items-center justify-between gap-2 border rounded px-3 py-1.5 text-sm transition-colors ${
														markedForRemoval
															? 'bg-red-50 border-red-200 line-through text-muted-foreground'
															: 'bg-muted/50'
													}`}
												>
													<div className="flex items-center gap-2 min-w-0">
														<FileIcon className="w-4 h-4 shrink-0 text-muted-foreground" />
														<span className="truncate">{pf.originalName || pf.filename}</span>
														{pf.size && (
															<span className="text-xs text-muted-foreground shrink-0">
																({(pf.size / 1024).toFixed(1)} KB)
															</span>
														)}
													</div>
													<button
														type="button"
														onClick={() => toggleRemoveFile(pf.id)}
														disabled={loading}
														className={`shrink-0 transition-colors ${
															markedForRemoval
																? 'text-blue-500 hover:text-blue-700 text-xs font-medium'
																: 'text-muted-foreground hover:text-destructive'
														}`}
													>
														{markedForRemoval ? 'Undo' : <X className="w-4 h-4" />}
													</button>
												</li>
											);
										})}
									</ul>
								)}

								{/* New files to add */}
								{newFiles.length > 0 && (
									<ul className="mt-2 space-y-1">
										{newFiles.map((file, i) => (
											<li
												key={i}
												className="flex items-center justify-between gap-2 border rounded px-3 py-1.5 text-sm bg-green-50 border-green-200"
											>
												<div className="flex items-center gap-2 min-w-0">
													<FileIcon className="w-4 h-4 shrink-0 text-green-600" />
													<span className="truncate">{file.name}</span>
													<span className="text-xs text-muted-foreground shrink-0">
														({(file.size / 1024).toFixed(1)} KB)
													</span>
												</div>
												<button
													type="button"
													onClick={() => removeNewFile(i)}
													disabled={loading}
													className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
												>
													<X className="w-4 h-4" />
												</button>
											</li>
										))}
									</ul>
								)}

								{/* Add files button */}
								<label className="mt-2 flex items-center gap-2 w-fit cursor-pointer">
									<span className="border rounded px-3 py-1.5 text-sm bg-muted hover:bg-accent transition-colors flex items-center gap-2">
										<Plus className="w-4 h-4" />
										Add Files
									</span>
									<input
										type="file"
										multiple
										accept={ALLOWED_EXTENSIONS}
										onChange={handleNewFileChange}
										disabled={loading}
										className="hidden"
									/>
								</label>
							</>
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
						<Button type="submit" className="bg-brand hover:bg-brand-dark" disabled={loading}>
							{loading ? 'Updating...' : 'Update Post'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
