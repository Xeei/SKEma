'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sarabun } from 'next/font/google';
import {
	getFolderById,
	FileFolderData,
	getFoldersByParent,
	deleteFolder,
	PaginationMetadata,
} from '@/services/folder.service';
import { getAllFiles, FileData, uploadFile, downloadFile } from '@/services/file.service';
import {
	getPostsByFolder,
	PostData,
	PaginationMetadata as PostPaginationMetadata,
} from '@/services/post.service';
import {
	BookOpen,
	ChevronRight,
	Download,
	ExternalLink,
	FileText,
	FolderOpen,
	Home,
	Trash2,
} from 'lucide-react';
import { CreatePostDialog } from '@/components/CreatePostDialog';
import { CreateSubFolderDialog } from '@/components/CreateSubFolderDialog';
import { EditFolderDialog } from '@/components/EditFolderDialog';
import { Pagination } from '@/components/Pagination';

const sarabun = Sarabun({
	weight: ['400', '500', '600', '700'],
	subsets: ['latin', 'thai'],
	variable: '--font-sarabun',
	display: 'swap',
});

const FOLDER_COLORS = [
	{
		bg: 'bg-emerald-50',
		border: 'border-emerald-200',
		icon: 'bg-emerald-100',
		text: 'text-emerald-700',
	},
	{ bg: 'bg-blue-50', border: 'border-blue-200', icon: 'bg-blue-100', text: 'text-blue-700' },
	{
		bg: 'bg-purple-50',
		border: 'border-purple-200',
		icon: 'bg-purple-100',
		text: 'text-purple-700',
	},
	{ bg: 'bg-amber-50', border: 'border-amber-200', icon: 'bg-amber-100', text: 'text-amber-700' },
	{ bg: 'bg-rose-50', border: 'border-rose-200', icon: 'bg-rose-100', text: 'text-rose-700' },
];

export default function FolderDetailPage() {
	const router = useRouter();
	const params = useParams();
	const { data: session } = useSession();
	const folderId = params?.id as string;

	const [folder, setFolder] = useState<FileFolderData | null>(null);
	const [breadcrumbPath, setBreadcrumbPath] = useState<FileFolderData[]>([]);
	const [subfolders, setSubfolders] = useState<FileFolderData[]>([]);
	const [files, setFiles] = useState<FileData[]>([]);
	const [posts, setPosts] = useState<PostData[]>([]);
	const [loading, setLoading] = useState(true);
	const [uploading, setUploading] = useState(false);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [subfoldersPage, setSubfoldersPage] = useState(1);
	const [subfoldersPagination, setSubfoldersPagination] = useState<PaginationMetadata | null>(null);
	const [postsPage, setPostsPage] = useState(1);
	const [postsPagination, setPostsPagination] = useState<PostPaginationMetadata | null>(null);

	useEffect(() => {
		if (folderId) {
			loadFolder();
			loadSubfolders(subfoldersPage);
			loadFiles();
			loadPosts(postsPage);
		}
		// eslint-disable-next-line
	}, [folderId]);

	useEffect(() => {
		if (folderId) loadSubfolders(subfoldersPage);
		// eslint-disable-next-line
	}, [subfoldersPage]);

	useEffect(() => {
		if (folderId) loadPosts(postsPage);
		// eslint-disable-next-line
	}, [postsPage]);

	const loadFolder = async () => {
		try {
			const data = await getFolderById(folderId);
			setFolder(data);
			await buildBreadcrumbPath(data);
		} catch {
			setFolder(null);
			setBreadcrumbPath([]);
		}
	};

	const buildBreadcrumbPath = async (currentFolder: FileFolderData) => {
		const path: FileFolderData[] = [currentFolder];
		let parent = currentFolder.parentId;
		while (parent) {
			try {
				const parentFolder = await getFolderById(parent);
				path.unshift(parentFolder);
				parent = parentFolder.parentId;
			} catch {
				break;
			}
		}
		setBreadcrumbPath(path);
	};

	const loadSubfolders = async (page: number = 1) => {
		try {
			const response = await getFoldersByParent(folderId, page, 12);
			setSubfolders(response.data);
			setSubfoldersPagination(response.pagination);
		} catch {
			setSubfolders([]);
			setSubfoldersPagination(null);
		}
	};

	const loadFiles = async () => {
		setLoading(true);
		try {
			const allFiles = await getAllFiles();
			const publicFiles = allFiles.filter(
				(file) => file.folderId === folderId && file.privacy === 'PUBLIC'
			);
			setFiles(publicFiles);
		} catch {
			setFiles([]);
		} finally {
			setLoading(false);
		}
	};

	const loadPosts = async (page: number = 1) => {
		try {
			const response = await getPostsByFolder(folderId, page, 10);
			setPosts(response.data);
			setPostsPagination(response.pagination);
		} catch {
			setPosts([]);
			setPostsPagination(null);
		}
	};

	const handleFileUpload = async () => {
		if (!selectedFile) return;
		setUploading(true);
		try {
			await uploadFile(selectedFile, undefined, folderId, 'PUBLIC');
			setSelectedFile(null);
			await loadFiles();
		} catch (error) {
			console.error('Error uploading file:', error);
		} finally {
			setUploading(false);
		}
	};

	const handleDownload = async (id: string, filename: string) => {
		try {
			await downloadFile(id, filename);
		} catch (error) {
			console.error('Error downloading file:', error);
		}
	};

	const handleDeleteSubfolder = async (subfolderId: string, e: React.MouseEvent) => {
		e.stopPropagation();
		if (!confirm('ยืนยันการลบโฟลเดอร์นี้?')) return;
		try {
			await deleteFolder(subfolderId);
			await loadSubfolders();
		} catch (error) {
			console.error('Error deleting subfolder:', error);
		}
	};

	if (!folder && !loading) {
		return (
			<main className={`${sarabun.variable} min-h-[calc(100vh-180px)]`}>
				<div className="bg-linear-to-br from-[#006837] via-[#005028] to-[#003d1f] text-white py-12 px-6">
					<div className="max-w-5xl mx-auto">
						<p className="font-sarabun text-white/60 text-sm mb-2">SKE Schema / คลังความรู้</p>
						<h1 className="font-sarabun text-4xl font-bold">ไม่พบโฟลเดอร์</h1>
					</div>
				</div>
			</main>
		);
	}

	return (
		<main className={`${sarabun.variable} min-h-[calc(100vh-180px)]`}>
			{/* Hero */}
			<div className="bg-linear-to-br from-[#006837] via-[#005028] to-[#003d1f] text-white py-12 px-6">
				<div className="max-w-5xl mx-auto">
					{/* Breadcrumb */}
					<nav className="flex items-center gap-1.5 flex-wrap mb-5 text-sm">
						<button
							onClick={() => router.push('/')}
							className="text-white/50 hover:text-white transition-colors flex items-center gap-1"
						>
							<Home className="w-3.5 h-3.5" />
							<span className="font-sarabun">หน้าหลัก</span>
						</button>
						{breadcrumbPath.map((pathFolder, index) => (
							<React.Fragment key={pathFolder.id}>
								<ChevronRight className="w-3.5 h-3.5 text-white/30 shrink-0" />
								{index === breadcrumbPath.length - 1 ? (
									<span className="font-sarabun text-white font-semibold truncate max-w-50">
										{pathFolder.name}
									</span>
								) : (
									<button
										onClick={() => router.push(`/library/folders/${pathFolder.id}`)}
										className="font-sarabun text-white/60 hover:text-white transition-colors truncate max-w-37.5"
									>
										{pathFolder.name}
									</button>
								)}
							</React.Fragment>
						))}
					</nav>

					{/* Folder name & actions */}
					<div className="flex items-start justify-between gap-4 flex-wrap">
						<div>
							<h1 className="font-sarabun text-4xl font-bold tracking-tight">
								{folder?.name ?? '...'}
							</h1>
							{folder?.description && (
								<p className="font-sarabun text-white/70 text-base mt-2 max-w-2xl">
									{folder.description}
								</p>
							)}
						</div>
						{/* Admin / owner controls */}
						<div className="flex items-center gap-2 shrink-0 flex-wrap">
							{folder && session?.userId === folder.userId && (
								<EditFolderDialog folder={folder} onFolderUpdated={loadFolder} />
							)}
							{session?.role === 'ADMIN' && (
								<CreateSubFolderDialog
									parentFolderId={folderId}
									onFolderCreated={() => loadSubfolders(subfoldersPage)}
								/>
							)}
							<CreatePostDialog
								folderId={folderId}
								onPostCreated={() => {
									loadFiles();
									loadPosts();
								}}
							/>
						</div>
					</div>

					{/* Quick stats */}
					{!loading && (
						<div className="flex items-center gap-3 mt-6 flex-wrap">
							{subfolders.length > 0 && (
								<div className="bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-sarabun text-white/80">
									{subfolders.length} โฟลเดอร์ย่อย
								</div>
							)}
							{posts.length > 0 && (
								<div className="bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-sarabun text-white/80">
									{posts.length} โพสต์
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			{/* Content */}
			<div className="max-w-5xl mx-auto px-6 py-10 space-y-12">
				{loading ? (
					<div className="flex flex-col items-center justify-center py-24 gap-4">
						<div className="w-12 h-12 border-4 border-[#006837] border-t-transparent rounded-full animate-spin" />
						<p className="font-sarabun text-gray-500">กำลังโหลดข้อมูล...</p>
					</div>
				) : (
					<>
						{/* Subfolders */}
						{(subfolders.length > 0 || session?.role === 'ADMIN') && (
							<section>
								<div className="flex items-center justify-between mb-5">
									<div className="flex items-center gap-3">
										<div className="w-1.5 h-7 bg-[#006837] rounded-full" />
										<h2 className="font-sarabun text-xl font-bold text-gray-800">โฟลเดอร์ย่อย</h2>
									</div>
									{subfoldersPagination && (
										<span className="font-sarabun text-sm text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
											{subfoldersPagination.total} โฟลเดอร์
										</span>
									)}
								</div>

								{subfolders.length === 0 ? (
									<div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
										<p className="font-sarabun text-gray-400 text-sm">ยังไม่มีโฟลเดอร์ย่อย</p>
									</div>
								) : (
									<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
										{subfolders.map((subfolder, index) => {
											const color = FOLDER_COLORS[index % FOLDER_COLORS.length];
											return (
												<div
													key={subfolder.id}
													onClick={() => router.push(`/library/folders/${subfolder.id}`)}
													className={`${color.bg} border ${color.border} rounded-xl p-5 hover:shadow-md transition-all cursor-pointer group`}
												>
													<div className="flex items-start justify-between mb-3">
														<div
															className={`w-10 h-10 ${color.icon} rounded-lg flex items-center justify-center shrink-0`}
														>
															<BookOpen className={`w-5 h-5 ${color.text}`} />
														</div>
														<div className="flex items-center gap-1">
															{session?.userId === subfolder.userId && (
																<button
																	className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
																	onClick={(e) => handleDeleteSubfolder(subfolder.id, e)}
																>
																	<Trash2 className="w-3.5 h-3.5" />
																</button>
															)}
															<ChevronRight
																className={`w-4 h-4 ${color.text} opacity-0 group-hover:opacity-100 transition-opacity`}
															/>
														</div>
													</div>
													<h3 className="font-sarabun font-semibold text-gray-800 group-hover:text-[#006837] transition-colors leading-snug">
														{subfolder.name}
													</h3>
													{subfolder.description && (
														<p className="font-sarabun text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
															{subfolder.description}
														</p>
													)}
													<div className="mt-4 flex items-center gap-1.5 text-gray-400">
														<FolderOpen className="w-3.5 h-3.5" />
														<span className="font-sarabun text-xs">เปิดโฟลเดอร์</span>
													</div>
												</div>
											);
										})}
									</div>
								)}

								{subfoldersPagination && subfoldersPagination.totalPages > 1 && (
									<div className="mt-6">
										<Pagination
											currentPage={subfoldersPagination.page}
											totalPages={subfoldersPagination.totalPages}
											onPageChange={setSubfoldersPage}
											hasNext={subfoldersPagination.hasNext}
											hasPrev={subfoldersPagination.hasPrev}
										/>
									</div>
								)}
							</section>
						)}

						{/* Posts */}
						<section>
							<div className="flex items-center justify-between mb-5">
								<div className="flex items-center gap-3">
									<div className="w-1.5 h-7 bg-[#FDB913] rounded-full" />
									<h2 className="font-sarabun text-xl font-bold text-gray-800">โพสต์และเอกสาร</h2>
								</div>
								{postsPagination && (
									<span className="font-sarabun text-sm text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
										{postsPagination.total} โพสต์
									</span>
								)}
							</div>

							{posts.length === 0 ? (
								<div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center">
									<FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
									<p className="font-sarabun text-gray-400 text-sm">ยังไม่มีโพสต์ในโฟลเดอร์นี้</p>
								</div>
							) : (
								<div className="space-y-3">
									{posts.map((post) => (
										<div
											key={post.id}
											onClick={() => router.push(`/library/post/${post.id}`)}
											className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-[#006837]/30 transition-all cursor-pointer group"
										>
											<div className="flex items-start gap-4">
												<div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
													<FileText className="w-5 h-5 text-[#006837]" />
												</div>
												<div className="flex-1 min-w-0">
													<h3 className="font-sarabun font-semibold text-gray-800 group-hover:text-[#006837] transition-colors leading-snug">
														{post.title}
													</h3>
													{post.description && (
														<p className="font-sarabun text-sm text-gray-500 mt-1 line-clamp-2 leading-relaxed">
															{post.description}
														</p>
													)}
													{post.link && (
														<a
															href={post.link}
															target="_blank"
															rel="noopener noreferrer"
															onClick={(e) => e.stopPropagation()}
															className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-700 text-xs mt-2 transition-colors"
														>
															<ExternalLink className="w-3 h-3" />
															<span className="font-sarabun truncate max-w-xs">{post.link}</span>
														</a>
													)}
													<div className="flex items-center gap-3 mt-3 flex-wrap">
														<span className="font-sarabun text-xs text-gray-400">
															{post.authorName || post.authorEmail}
														</span>
														<span className="text-gray-200">•</span>
														<span className="font-sarabun text-xs text-gray-400">
															{new Date(post.createdAt).toLocaleDateString('th-TH', {
																year: 'numeric',
																month: 'short',
																day: 'numeric',
															})}
														</span>
														{post.category && (
															<>
																<span className="text-gray-200">•</span>
																<span className="bg-[#006837]/10 text-[#006837] font-sarabun text-xs px-2.5 py-0.5 rounded-full font-medium">
																	{post.category}
																</span>
															</>
														)}
														{post.fileCount && post.fileCount > 0 && (
															<>
																<span className="text-gray-200">•</span>
																<span className="font-sarabun text-xs text-gray-400">
																	{post.fileCount} ไฟล์
																</span>
															</>
														)}
													</div>
												</div>
												<ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#006837] transition-colors shrink-0 mt-1" />
											</div>
										</div>
									))}
								</div>
							)}

							{postsPagination && postsPagination.totalPages > 1 && (
								<div className="mt-6">
									<Pagination
										currentPage={postsPagination.page}
										totalPages={postsPagination.totalPages}
										onPageChange={setPostsPage}
										hasNext={postsPagination.hasNext}
										hasPrev={postsPagination.hasPrev}
									/>
								</div>
							)}
						</section>
					</>
				)}
			</div>
		</main>
	);
}
