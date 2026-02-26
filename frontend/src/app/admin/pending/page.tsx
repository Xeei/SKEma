'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sarabun } from 'next/font/google';
import {
	CheckCircle,
	XCircle,
	Clock,
	FileText,
	User,
	Calendar,
	Download,
	ChevronDown,
	ChevronUp,
} from 'lucide-react';
import {
	getPendingPosts,
	approvePost,
	rejectPost,
	getPostFiles,
	PostData,
	PostFileData,
	PaginatedResponse,
} from '@/services/post.service';
import { downloadFile, formatFileSize, getFileIcon } from '@/services/file.service';
import { Pagination } from '@/components/Pagination';

const sarabun = Sarabun({
	weight: ['400', '500', '600', '700'],
	subsets: ['latin', 'thai'],
	variable: '--font-sarabun',
	display: 'swap',
});

export default function AdminPendingPostsPage() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const [data, setData] = useState<PaginatedResponse<PostData> | null>(null);
	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState<string | null>(null);
	const [page, setPage] = useState(1);
	const limit = 10;
	const [postFiles, setPostFiles] = useState<Record<string, PostFileData[]>>({});
	const [loadingFiles, setLoadingFiles] = useState<Record<string, boolean>>({});
	const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});
	const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

	useEffect(() => {
		if (status === 'unauthenticated') {
			router.push('/auth/login');
		} else if (status === 'authenticated' && session?.role !== 'ADMIN') {
			router.push('/');
		}
	}, [status, session, router]);

	const loadPendingPosts = useCallback(async () => {
		setLoading(true);
		try {
			const result = await getPendingPosts(page, limit);
			setData(result);
		} catch (error) {
			console.error('Error loading pending posts:', error);
		} finally {
			setLoading(false);
		}
	}, [page]);

	useEffect(() => {
		if (status === 'authenticated' && session?.role === 'ADMIN') {
			loadPendingPosts();
		}
	}, [status, session, loadPendingPosts]);

	const handleApprove = async (postId: string) => {
		setActionLoading(postId + '-approve');
		try {
			await approvePost(postId);
			await loadPendingPosts();
		} catch (error) {
			console.error('Error approving post:', error);
			alert('Failed to approve post');
		} finally {
			setActionLoading(null);
		}
	};

	const handleReject = async (postId: string) => {
		if (!confirm('Are you sure you want to reject this post?')) return;
		setActionLoading(postId + '-reject');
		try {
			await rejectPost(postId);
			await loadPendingPosts();
		} catch (error) {
			console.error('Error rejecting post:', error);
			alert('Failed to reject post');
		} finally {
			setActionLoading(null);
		}
	};

	const handleToggleFiles = async (postId: string) => {
		const nowExpanded = !expandedFiles[postId];
		setExpandedFiles((prev) => ({ ...prev, [postId]: nowExpanded }));
		if (nowExpanded && !postFiles[postId]) {
			setLoadingFiles((prev) => ({ ...prev, [postId]: true }));
			try {
				const files = await getPostFiles(postId);
				setPostFiles((prev) => ({ ...prev, [postId]: files }));
			} catch (error) {
				console.error('Error loading post files:', error);
			} finally {
				setLoadingFiles((prev) => ({ ...prev, [postId]: false }));
			}
		}
	};

	const handleDownload = async (fileId: string, filename: string) => {
		setDownloadingFile(fileId);
		try {
			await downloadFile(fileId, filename);
		} catch (error) {
			console.error('Error downloading file:', error);
			alert('Failed to download file');
		} finally {
			setDownloadingFile(null);
		}
	};

	if (status === 'loading' || (status === 'authenticated' && session?.role !== 'ADMIN')) {
		return (
			<div className="min-h-[calc(100vh-180px)] flex items-center justify-center">
				<div className="text-center">
					<div className="w-16 h-16 border-4 border-[#006837] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-muted-foreground">Loading...</p>
				</div>
			</div>
		);
	}

	if (status === 'unauthenticated') return null;

	return (
		<main className="min-h-[calc(100vh-180px)] p-6">
			<div className="max-w-5xl mx-auto space-y-6">
				{/* Header */}
				<div>
					<h1 className={`${sarabun.className} text-3xl font-bold text-[#006837]`}>
						Pending Post Approvals
					</h1>
					<p className="text-muted-foreground mt-1">
						Review and approve or reject posts submitted by standard users.
					</p>
				</div>

				{/* Stats bar */}
				<div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
					<Clock className="h-5 w-5 text-amber-600" />
					<span className="text-sm font-medium text-amber-800">
						{data?.pagination.total ?? 0} post{(data?.pagination.total ?? 0) !== 1 ? 's' : ''}{' '}
						awaiting review
					</span>
				</div>

				{/* Posts list */}
				{loading ? (
					<div className="space-y-4">
						{[...Array(3)].map((_, i) => (
							<div key={i} className="h-40 rounded-lg bg-muted animate-pulse" />
						))}
					</div>
				) : !data || data.data.length === 0 ? (
					<Card>
						<CardContent className="flex flex-col items-center justify-center py-16 text-center">
							<CheckCircle className="h-12 w-12 text-[#006837] mb-4" />
							<p className="text-lg font-medium">All caught up!</p>
							<p className="text-muted-foreground text-sm mt-1">
								There are no posts waiting for approval.
							</p>
						</CardContent>
					</Card>
				) : (
					<div className="space-y-4">
						{data.data.map((post) => (
							<Card key={post.id} className="border-l-4 border-l-amber-400">
								<CardHeader className="pb-2">
									<div className="flex items-start justify-between gap-4">
										<div className="flex-1 min-w-0">
											<CardTitle className="text-lg leading-snug truncate">{post.title}</CardTitle>
											<div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
												<span className="flex items-center gap-1">
													<User className="h-3.5 w-3.5" />
													{post.isAnonymous
														? 'Anonymous'
														: post.authorName || post.authorEmail || 'Unknown'}
												</span>
												<span className="flex items-center gap-1">
													<Calendar className="h-3.5 w-3.5" />
													{new Date(post.createdAt).toLocaleDateString('en-GB', {
														day: 'numeric',
														month: 'short',
														year: 'numeric',
														hour: '2-digit',
														minute: '2-digit',
													})}
												</span>
												{post.fileCount != null && post.fileCount > 0 && (
													<span className="flex items-center gap-1">
														<FileText className="h-3.5 w-3.5" />
														{post.fileCount} file{post.fileCount !== 1 ? 's' : ''}
													</span>
												)}
											</div>
										</div>
										<div className="flex gap-2 shrink-0">
											<Button
												size="sm"
												className="bg-[#006837] hover:bg-[#005530] gap-1.5"
												onClick={() => handleApprove(post.id)}
												disabled={actionLoading !== null}
											>
												{actionLoading === post.id + '-approve' ? (
													<span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
												) : (
													<CheckCircle className="h-4 w-4" />
												)}
												Approve
											</Button>
											<Button
												size="sm"
												variant="destructive"
												className="gap-1.5"
												onClick={() => handleReject(post.id)}
												disabled={actionLoading !== null}
											>
												{actionLoading === post.id + '-reject' ? (
													<span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
												) : (
													<XCircle className="h-4 w-4" />
												)}
												Reject
											</Button>
										</div>
									</div>
								</CardHeader>
								<CardContent>
									{post.description && (
										<p className="text-sm text-muted-foreground mb-2 italic">{post.description}</p>
									)}
									<p className="text-sm line-clamp-3 whitespace-pre-wrap text-foreground/80">
										{post.content}
									</p>
									{post.link && (
										<a
											href={post.link}
											target="_blank"
											rel="noopener noreferrer"
											className="mt-2 inline-block text-xs text-blue-600 underline truncate max-w-full"
										>
											{post.link}
										</a>
									)}
									{post.fileCount != null && post.fileCount > 0 && (
										<div className="mt-3 border-t pt-3">
											<button
												className="flex items-center gap-1.5 text-sm font-medium text-[#006837] hover:underline"
												onClick={() => handleToggleFiles(post.id)}
											>
												<FileText className="h-4 w-4" />
												{expandedFiles[post.id] ? 'Hide' : 'View'} attachments ({post.fileCount})
												{expandedFiles[post.id] ? (
													<ChevronUp className="h-3.5 w-3.5" />
												) : (
													<ChevronDown className="h-3.5 w-3.5" />
												)}
											</button>
											{expandedFiles[post.id] && (
												<div className="mt-2 space-y-1.5">
													{loadingFiles[post.id] ? (
														<p className="text-xs text-muted-foreground">Loading files…</p>
													) : (postFiles[post.id] ?? []).length === 0 ? (
														<p className="text-xs text-muted-foreground">No files found.</p>
													) : (
														(postFiles[post.id] ?? []).map((pf) => {
															const name = pf.originalName || pf.filename || 'file';
															const icon = pf.mimetype ? getFileIcon(pf.mimetype) : '📎';
															const size = pf.size ? formatFileSize(pf.size) : '';
															return (
																<div
																	key={pf.fileId}
																	className="flex items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm"
																>
																	<span className="flex items-center gap-2 truncate">
																		<span>{icon}</span>
																		<span className="truncate font-medium">{name}</span>
																		{size && (
																			<span className="shrink-0 text-xs text-muted-foreground">
																				{size}
																			</span>
																		)}
																	</span>
																	<Button
																		size="sm"
																		variant="outline"
																		className="shrink-0 gap-1 h-7 px-2 text-xs"
																		disabled={downloadingFile === pf.fileId}
																		onClick={() => handleDownload(pf.fileId, name)}
																	>
																		{downloadingFile === pf.fileId ? (
																			<span className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
																		) : (
																			<Download className="h-3 w-3" />
																		)}
																		Download
																	</Button>
																</div>
															);
														})
													)}
												</div>
											)}
										</div>
									)}
								</CardContent>
							</Card>
						))}
					</div>
				)}

				{/* Pagination */}
				{data && data.pagination.totalPages > 1 && (
					<Pagination
						currentPage={page}
						totalPages={data.pagination.totalPages}
						hasNext={data.pagination.hasNext}
						hasPrev={data.pagination.hasPrev}
						total={data.pagination.total}
						limit={limit}
						onPageChange={setPage}
					/>
				)}
			</div>
		</main>
	);
}
