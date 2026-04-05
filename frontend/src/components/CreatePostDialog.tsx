'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createPost, addFileToPost } from '@/services/post.service';
import { uploadFile } from '@/services/file.service';
import { Plus, X, FileIcon } from 'lucide-react';
import { toast } from 'sonner';
import { isAllowedFileType, ALLOWED_EXTENSIONS } from '@/lib/allowedFileTypes';

interface CreatePostDialogProps {
	onPostCreated?: () => void;
	folderId?: string;
}

export function CreatePostDialog({ onPostCreated, folderId }: CreatePostDialogProps) {
	const { data: session } = useSession();
	const userRole = session?.role as string | undefined;
	const isStandard = !userRole || userRole === 'STANDARD';

	const [open, setOpen] = useState(false);
	const [step, setStep] = useState<1 | 2>(1);
	const [showWarning, setShowWarning] = useState(false);
	const [loading, setLoading] = useState(false);
	const [title, setTitle] = useState('');
	const [titleError, setTitleError] = useState('');
	const [description, setDescription] = useState('');
	const [link, setLink] = useState('');
	const [content, setContent] = useState('');
	const [contentError, setContentError] = useState('');
	const [isAnonymous, setIsAnonymous] = useState(false);
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

	const resetForm = () => {
		setStep(1);
		setTitle('');
		setTitleError('');
		setDescription('');
		setLink('');
		setContent('');
		setContentError('');
		setIsAnonymous(false);
		setSelectedFiles([]);
	};

	const handleOpenChange = (value: boolean) => {
		setOpen(value);
		if (!value) resetForm();
	};

	const handleNextStep = () => {
		setTitleError('');
		setContentError('');
		if (!title.trim()) {
			setTitleError('กรุณากรอกชื่อโพสต์');
			return;
		}
		if (!content.trim()) {
			setContentError('กรุณากรอกเนื้อหา');
			return;
		}
		setStep(2);
	};

	const handleSubmit = (e: React.SyntheticEvent) => {
		e.preventDefault();
		setShowWarning(true);
	};

	const handleConfirmedSubmit = async () => {
		setShowWarning(false);
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

			resetForm();
			setOpen(false);

			if (post.status === 'PENDING') {
				toast.info('โพสต์ถูกส่งเพื่อรออนุมัติจากแอดมิน', {
					description: 'Your post is pending review.',
				});
			} else {
				toast.success('สร้างโพสต์สำเร็จ!', { description: 'Your post is now live.' });
			}
			onPostCreated?.();
		} catch (error) {
			console.error('Error creating post:', error);
			toast.error('ไม่สามารถสร้างโพสต์ได้ กรุณาลองใหม่');
		} finally {
			setLoading(false);
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			const incoming = Array.from(e.target.files);
			const invalid = incoming.filter((f) => !isAllowedFileType(f));
			if (invalid.length > 0) {
				toast.error(`ไฟล์ไม่รองรับ: ${invalid.map((f) => f.name).join(', ')}`);
				e.target.value = '';
				return;
			}
			setSelectedFiles((prev) => {
				const existingNames = new Set(prev.map((f) => f.name));
				const unique = incoming.filter((f) => !existingNames.has(f.name));
				return [...prev, ...unique];
			});
			e.target.value = '';
		}
	};

	const removeSelectedFile = (index: number) => {
		setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
	};

	return (
		<>
			<AlertDialog open={showWarning} onOpenChange={setShowWarning}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Before you post — please read</AlertDialogTitle>
						<AlertDialogDescription asChild>
							<div className="space-y-3 text-sm">
								<p>
									By submitting this post, your content will be{' '}
									<strong>visible to all members</strong> of this platform. Anyone can read,
									reference, or share it. Please make sure you are not sharing any personal,
									sensitive, or confidential information.
								</p>
								<p className="text-muted-foreground">
									การส่งโพสนี้หมายความว่าเนื้อหาของคุณจะ<strong>เปิดเผยต่อสมาชิกทุกคน</strong>
									บนแพลตฟอร์มนี้ ทุกคนสามารถอ่าน อ้างอิง หรือแชร์โพสนี้ได้
									กรุณาตรวจสอบให้แน่ใจว่าคุณไม่ได้เปิดเผยข้อมูลส่วนตัว ข้อมูลสำคัญ
									หรือข้อมูลที่เป็นความลับ
								</p>
								<p>
									Please do not upload files that do not belong to you unless you have explicit
									permission from the original owner. ห้ามอัปโหลดไฟล์ที่ท่านไม่ใช่เจ้าของ
									ยกเว้นในกรณีที่ได้รับอนุญาตอย่างเป็นทางการจากเจ้าของผลงานแล้วเท่านั้น
								</p>
							</div>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel / ยกเลิก</AlertDialogCancel>
						<AlertDialogAction
							className="bg-brand hover:bg-brand-dark"
							onClick={handleConfirmedSubmit}
						>
							Post / โพส
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<Dialog open={open} onOpenChange={handleOpenChange}>
				<DialogTrigger asChild>
					<Button className="bg-brand hover:bg-brand-dark gap-2">
						<Plus className="w-4 h-4" />
						Create Post
					</Button>
				</DialogTrigger>
				<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Create New Post</DialogTitle>
					</DialogHeader>

					{/* Step progress bar */}
					<div className="space-y-1.5 mb-2">
						<div className="flex gap-2">
							{([1, 2] as const).map((n) => (
								<div
									key={n}
									className={`h-1.5 flex-1 rounded-full transition-colors ${step >= n ? 'bg-brand' : 'bg-gray-200'}`}
								/>
							))}
						</div>
						<p className="text-xs text-muted-foreground text-center">
							ขั้นตอนที่ {step} จาก 2 — {step === 1 ? 'รายละเอียดโพสต์' : 'ไฟล์แนบและยืนยัน'}
						</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-4">
						{/* ── Step 1 ── */}
						{step === 1 && (
							<>
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
									/>
									{titleError && <p className="text-xs text-red-500 mt-1">{titleError}</p>}
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
										rows={8}
										className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
									/>
									{contentError && <p className="text-xs text-red-500 mt-1">{contentError}</p>}
								</div>

								<div className="flex items-center gap-2">
									<input
										type="checkbox"
										id="isAnonymous"
										checked={isAnonymous}
										onChange={(e) => setIsAnonymous(e.target.checked)}
										disabled={loading}
										className="w-4 h-4 accent-brand cursor-pointer"
									/>
									<label
										htmlFor="isAnonymous"
										className="text-sm font-medium cursor-pointer select-none"
									>
										Post anonymously{' '}
										<span className="text-muted-foreground font-normal">
											(your name will not be shown)
										</span>
									</label>
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
									<Button
										type="button"
										className="bg-brand hover:bg-brand-dark"
										onClick={handleNextStep}
									>
										ถัดไป →
									</Button>
								</DialogFooter>
							</>
						)}

						{/* ── Step 2 ── */}
						{step === 2 && (
							<>
								{/* Summary chip */}
								<div className="flex items-center gap-2 bg-brand/5 border border-brand/20 rounded-lg px-3 py-2">
									<span className="text-xs text-muted-foreground">โพสต์:</span>
									<span className="text-sm font-medium text-brand truncate">{title}</span>
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
											accept={ALLOWED_EXTENSIONS}
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
										onClick={() => setStep(1)}
										disabled={loading}
									>
										← ย้อนกลับ
									</Button>
									<Button type="submit" className="bg-brand hover:bg-brand-dark" disabled={loading}>
										{loading ? 'Submitting...' : isStandard ? 'Create Post' : 'Create Post'}
									</Button>
								</DialogFooter>
							</>
						)}
					</form>
				</DialogContent>
			</Dialog>
		</>
	);
}
