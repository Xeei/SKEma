'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sarabun } from 'next/font/google';
import {
	getPostById,
	PostData,
	getPostFiles,
	PostFileData,
	deletePost,
} from '@/services/post.service';
import { downloadFile } from '@/services/file.service';
import { Download, ArrowLeft, Calendar, User, Eye, Lock, Globe, Users, Trash2 } from 'lucide-react';
import { EditPostDialog } from '@/components/EditPostDialog';

const sarabun = Sarabun({
	weight: ['400', '500', '600', '700'],
	subsets: ['latin', 'thai'],
	variable: '--font-sarabun',
	display: 'swap',
});

export default function PostDetailPage() {
	const router = useRouter();
	const params = useParams();
	const { data: session } = useSession();
	const postId = params?.id as string;
	const [post, setPost] = useState<PostData | null>(null);
	const [files, setFiles] = useState<PostFileData[]>([]);
	const [loading, setLoading] = useState(true);
	const [deleting, setDeleting] = useState(false);
	const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
	const [previewLoading, setPreviewLoading] = useState<Record<string, boolean>>({});

	useEffect(() => {
		if (postId) {
			loadPost();
			loadFiles();
		}
		// eslint-disable-next-line
	}, [postId]);

	const loadPost = async () => {
		setLoading(true);
		try {
			const data = await getPostById(postId);
			setPost(data);
		} catch (error) {
			console.error('Error loading post:', error);
			setPost(null);
		} finally {
			setLoading(false);
		}
	};

	const loadFiles = async () => {
		try {
			const data = await getPostFiles(postId);
			setFiles(data);
		} catch (error) {
			console.error('Error loading files:', error);
			setFiles([]);
		}
	};

	const isPreviewable = (mimetype?: string) =>
		!!mimetype && (mimetype.startsWith('image/') || mimetype === 'application/pdf');

	const togglePreview = async (fileId: string, mimetype?: string) => {
		if (previewUrls[fileId]) {
			URL.revokeObjectURL(previewUrls[fileId]);
			setPreviewUrls((prev) => {
				const next = { ...prev };
				delete next[fileId];
				return next;
			});
			return;
		}
		setPreviewLoading((prev) => ({ ...prev, [fileId]: true }));
		try {
			const response = await fetch(`/api/proxy/files/${fileId}/download`);
			const blob = await response.blob();
			const url = URL.createObjectURL(blob);
			setPreviewUrls((prev) => ({ ...prev, [fileId]: url }));
		} catch (e) {
			console.error('Preview failed', e);
		} finally {
			setPreviewLoading((prev) => ({ ...prev, [fileId]: false }));
		}
	};

	const handleDownload = async (fileId: string, filename: string) => {
		try {
			await downloadFile(fileId, filename);
		} catch (error) {
			console.error('Error downloading file:', error);
			alert('Failed to download file');
		}
	};

	const handleDelete = async () => {
		if (!confirm('Are you sure you want to delete this post?')) return;
		setDeleting(true);
		try {
			await deletePost(postId);
			alert('Post deleted successfully!');
			router.push('/library/folders');
		} catch (error) {
			console.error('Error deleting post:', error);
			alert('Failed to delete post');
		} finally {
			setDeleting(false);
		}
	};

	const getPrivacyIcon = (privacy: string) => {
		switch (privacy) {
			case 'PUBLIC':
				return <Globe className="w-4 h-4" />;
			case 'PRIVATE':
				return <Lock className="w-4 h-4" />;
			case 'SHARED':
				return <Users className="w-4 h-4" />;
			default:
				return null;
		}
	};

	if (loading) {
		return (
			<main className="min-h-[calc(100vh-180px)] p-6 bg-linear-to-br from-emerald-50 to-amber-50">
				<div className="max-w-4xl mx-auto">
					<div className="flex items-center justify-center py-12">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006837]"></div>
					</div>
				</div>
			</main>
		);
	}

	if (!post) {
		return (
			<main className="min-h-[calc(100vh-180px)] p-6 bg-linear-to-br from-emerald-50 to-amber-50">
				<div className="max-w-4xl mx-auto">
					<div className="flex items-center gap-4 mb-6">
						<Button
							variant="ghost"
							onClick={() => router.back()}
							className="flex items-center gap-2"
						>
							<ArrowLeft className="w-4 h-4" />
							Back
						</Button>
					</div>
					<h1 className={`${sarabun.className} text-3xl font-bold text-[#006837]`}>
						Post Not Found
					</h1>
					<p className="text-muted-foreground mt-2">
						The post you're looking for doesn't exist or you don't have permission to view it.
					</p>
				</div>
			</main>
		);
	}

	return (
		<main className="min-h-[calc(100vh-180px)] p-6 bg-linear-to-br from-emerald-50 to-amber-50">
			<div className="max-w-4xl mx-auto space-y-6">
				{/* Header with Back Button */}
				<div className="flex items-center justify-between">
					<Button
						variant="ghost"
						onClick={() => router.back()}
						className="flex items-center gap-2 text-[#006837] hover:text-[#005530]"
					>
						<ArrowLeft className="w-4 h-4" />
						Back
					</Button>
					{(session?.userId === post.authorId || session?.role === 'ADMIN') && (
						<div className="flex gap-2">
							{session?.userId === post.authorId && (
								<EditPostDialog post={post} onPostUpdated={loadPost} />
							)}
							<Button
								variant="destructive"
								onClick={handleDelete}
								disabled={deleting}
								className="flex items-center gap-2"
							>
								<Trash2 className="w-4 h-4" />
								{deleting ? 'Deleting...' : 'Delete Post'}
							</Button>
						</div>
					)}
				</div>

				{/* Main Post Card */}
				<Card>
					<CardHeader>
						<div className="flex items-start justify-between">
							<div className="flex-1">
								<CardTitle className={`${sarabun.className} text-3xl text-[#006837]`}>
									{post.title}
								</CardTitle>
								{post.description && (
									<CardDescription className="text-base mt-2">{post.description}</CardDescription>
								)}
								{post.link && (
									<div className="mt-3">
										<a
											href={post.link}
											target="_blank"
											rel="noopener noreferrer"
											className="text-blue-600 hover:text-blue-800 underline text-sm flex items-center gap-1"
										>
											🔗 {post.link}
										</a>
									</div>
								)}
							</div>
						</div>

						{/* Metadata */}
						<div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
							<div className="flex items-center gap-2">
								<User className="w-4 h-4" />
								<span>
									{post.isAnonymous
										? 'Anonymous'
										: post.authorName || post.authorEmail || 'Anonymous'}
								</span>
							</div>
							<div className="flex items-center gap-2">
								<Calendar className="w-4 h-4" />
								<span>{new Date(post.createdAt).toLocaleDateString()}</span>
							</div>
							<div className="flex items-center gap-2">
								<Eye className="w-4 h-4" />
								<span>{post.views} views</span>
							</div>
							<div className="flex items-center gap-2">
								{getPrivacyIcon(post.privacy)}
								<span className="capitalize">{post.privacy.toLowerCase()}</span>
							</div>
							{post.category && (
								<span className="bg-[#006837] text-white px-3 py-1 rounded-full text-xs">
									{post.category}
								</span>
							)}
						</div>

						{/* Tags */}
						{post.tags && post.tags.length > 0 && (
							<div className="flex flex-wrap gap-2 mt-3">
								{post.tags.map((tag, index) => (
									<span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
										#{tag}
									</span>
								))}
							</div>
						)}
					</CardHeader>

					<CardContent>
						{/* Post Content */}
						<div className="prose max-w-none">
							<div className="whitespace-pre-wrap text-base leading-relaxed">{post.content}</div>
						</div>
					</CardContent>
				</Card>

				{/* Attached Files */}
				{files.length > 0 && (
					<Card>
						<CardHeader>
							<CardTitle>Attached Files</CardTitle>
							<CardDescription>
								{files.length} file{files.length > 1 ? 's' : ''} attached to this post
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{files.map((file) => (
									<div key={file.id} className="border rounded-lg overflow-hidden">
										<div className="flex items-center justify-between p-4 hover:bg-accent transition-colors">
											<div className="flex-1">
												<p className="font-medium text-base">
													{file.originalName || file.filename}
												</p>
												{file.size && (
													<p className="text-xs text-muted-foreground mt-1">
														Size: {(file.size / 1024).toFixed(2)} KB
													</p>
												)}
											</div>
											<div className="flex gap-2">
												{isPreviewable(file.mimetype) && (
													<Button
														size="sm"
														variant="outline"
														className="gap-2"
														onClick={() => togglePreview(file.fileId, file.mimetype)}
														disabled={previewLoading[file.fileId]}
													>
														{previewLoading[file.fileId]
															? 'Loading…'
															: previewUrls[file.fileId]
																? 'Hide'
																: 'Preview'}
													</Button>
												)}
												<Button
													size="sm"
													variant="outline"
													className="gap-2 bg-[#006837] text-white hover:bg-[#005530] hover:text-white"
													onClick={() =>
														handleDownload(
															file.fileId,
															file.originalName || file.filename || 'download'
														)
													}
												>
													<Download className="w-4 h-4" />
													Download
												</Button>
											</div>
										</div>
										{previewUrls[file.fileId] && (
											<div className="border-t bg-gray-50 p-4">
												{file.mimetype?.startsWith('image/') ? (
													<img
														src={previewUrls[file.fileId]}
														alt={file.originalName || file.filename}
														className="max-h-125 max-w-full mx-auto rounded object-contain"
													/>
												) : (
													<iframe
														src={previewUrls[file.fileId]}
														className="w-full h-150 rounded border"
														title={file.originalName || file.filename}
													/>
												)}
											</div>
										)}
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				)}

				{/* Additional Info */}
				<Card>
					<CardContent className="pt-6">
						<p className="text-xs text-muted-foreground">
							Last updated: {new Date(post.updatedAt).toLocaleString()}
						</p>
					</CardContent>
				</Card>
			</div>
		</main>
	);
}
