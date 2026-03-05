'use client';

import React, { useEffect, useRef, useState } from 'react';
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
import {
	getFilesByFolder,
	FileData,
	downloadFile,
	formatFileSize,
	getFileIcon,
} from '@/services/file.service';
import {
	getPostsByFolder,
	PostData,
	PaginationMetadata as PostPaginationMetadata,
} from '@/services/post.service';
import {
	ChevronRight,
	Download,
	ExternalLink,
	FileText,
	Folder,
	FolderOpen,
	Home,
	Loader2,
	Search,
	ThumbsDown,
	ThumbsUp,
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
	const [searching, setSearching] = useState(false);
	const isFirstLoad = useRef(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');
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
		const timer = setTimeout(() => {
			setDebouncedSearch(searchQuery);
			setSubfoldersPage(1);
			setPostsPage(1);
		}, 400);
		return () => clearTimeout(timer);
	}, [searchQuery]);

	useEffect(() => {
		if (folderId) loadSubfolders(subfoldersPage);
		// eslint-disable-next-line
	}, [subfoldersPage, debouncedSearch]);

	useEffect(() => {
		if (folderId) loadPosts(postsPage);
		// eslint-disable-next-line
	}, [postsPage, debouncedSearch]);

	useEffect(() => {
		if (folderId) loadFiles();
		// eslint-disable-next-line
	}, [debouncedSearch]);

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
		setSearching(true);
		try {
			const response = await getFoldersByParent(folderId, page, 12, debouncedSearch);
			setSubfolders(response.data);
			setSubfoldersPagination(response.pagination);
		} catch {
			setSubfolders([]);
			setSubfoldersPagination(null);
		} finally {
			setSearching(false);
		}
	};

	const loadFiles = async () => {
		if (isFirstLoad.current) {
			setLoading(true);
		} else {
			setSearching(true);
		}
		try {
			const folderFiles = await getFilesByFolder(folderId, debouncedSearch);
			setFiles(folderFiles);
		} catch {
			setFiles([]);
		} finally {
			if (isFirstLoad.current) {
				setLoading(false);
				isFirstLoad.current = false;
			} else {
				setSearching(false);
			}
		}
	};

	const hasResults = subfolders.length + posts.length + files.length > 0;

	const loadPosts = async (page: number = 1) => {
		setSearching(true);
		try {
			const response = await getPostsByFolder(folderId, page, 8, debouncedSearch);
			setPosts(response.data);
			setPostsPagination(response.pagination);
		} catch {
			setPosts([]);
			setPostsPagination(null);
		} finally {
			setSearching(false);
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
							{(postsPagination?.total ?? 0) > 0 && (
								<div className="bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-sarabun text-white/80">
									{postsPagination!.total} โพสต์
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			{/* Content */}
			<div className="max-w-5xl mx-auto py-8">
				{loading ? (
					<div className="flex flex-col items-center justify-center py-24 gap-4">
						<div className="w-12 h-12 border-4 border-[#006837] border-t-transparent rounded-full animate-spin" />
						<p className="font-sarabun text-gray-500">กำลังโหลดข้อมูล...</p>
					</div>
				) : (
					<div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
						{/* Toolbar */}
						<div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/60">
							<div className="relative flex-1">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
								<input
									type="text"
									placeholder="ค้นหาในโฟลเดอร์นี้... / Search here..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="w-full pl-9 pr-3 py-1.5 text-sm font-sarabun border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#006837]/20 focus:border-[#006837]"
								/>
							</div>
							{searching ? (
								<Loader2 className="w-3.5 h-3.5 text-[#006837] animate-spin shrink-0" />
							) : (
								<span className="font-sarabun text-xs text-gray-400 shrink-0">
									{subfolders.length + posts.length + files.length} รายการ
								</span>
							)}
						</div>

						{/* Column headers */}
						<div className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center px-4 py-1.5 border-b border-gray-100 bg-gray-50 text-xs font-sarabun text-gray-400 font-medium gap-3 select-none">
							<span className="w-5" />
							<span>ชื่อ / Name</span>
							<span className="w-32 text-right hidden sm:block">วันที่แก้ไข</span>
							<span className="w-24 text-right hidden md:block">ประเภท / Type</span>
							<span className="w-20 text-right">ข้อมูล</span>
						</div>

						{!hasResults && (
							<div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
								<FolderOpen className="w-12 h-12 text-gray-200" />
								<p className="font-sarabun text-gray-400 text-sm">ไม่พบรายการที่ค้นหา</p>
							</div>
						)}

						{hasResults && (
							<div className={`divide-y divide-gray-50 transition-opacity duration-150 ${searching ? 'opacity-50' : 'opacity-100'}overflow-auto`}>
								{/* ── Subfolders (only on first posts page, or while searching) ── */}
								{(postsPage === 1 || !!debouncedSearch) &&
									subfolders.map((subfolder) => (
										<div
											key={subfolder.id}
											onClick={() => router.push(`/library/folders/${subfolder.id}`)}
											className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center px-4 py-2 hover:bg-[#006837]/5 cursor-pointer group gap-3 transition-colors"
										>
											{/* Icon */}
											<Folder className="w-5 h-5 text-amber-400 shrink-0 fill-amber-100" />
											{/* Name */}
											<div className="min-w-0 flex items-center gap-2">
												<span className="font-sarabun font-medium text-gray-800 truncate text-sm group-hover:text-[#006837]">
													{subfolder.name}
												</span>
												{subfolder.description && (
													<span className="font-sarabun text-xs text-gray-400 truncate hidden lg:block">
														— {subfolder.description}
													</span>
												)}
											</div>
											{/* Date */}
											<span className="font-sarabun text-xs text-gray-400 w-32 text-right hidden sm:block shrink-0">
												—
											</span>
											{/* Type */}
											<span className="font-sarabun text-xs text-gray-400 w-24 text-right hidden md:block shrink-0">
												File folder
											</span>
											{/* Meta + actions */}
											<div className="flex items-center justify-end gap-2 w-20 shrink-0">
												{session?.userId === subfolder.userId && (
													<button
														className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
														onClick={(e) => handleDeleteSubfolder(subfolder.id, e)}
													>
														<Trash2 className="w-3.5 h-3.5" />
													</button>
												)}
												<ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#006837]" />
											</div>
										</div>
									))}

								{/* ── Posts ── */}
								{posts.map((post) => (
									<div
										key={post.id}
										onClick={() => router.push(`/library/post/${post.id}`)}
										className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center px-4 py-2 hover:bg-[#006837]/5 cursor-pointer group gap-3 transition-colors"
									>
										{/* Icon */}
										<FileText className="w-5 h-5 text-[#006837] shrink-0" />
										{/* Name */}
										<div className="min-w-0 flex items-center gap-2">
											<span className="font-sarabun font-medium text-gray-800 truncate text-sm group-hover:text-[#006837]">
												{post.title}
											</span>
											{post.description && (
												<span className="font-sarabun text-xs text-gray-400 truncate hidden lg:block">
													— {post.description}
												</span>
											)}
											{post.link && (
												<a
													href={post.link}
													target="_blank"
													rel="noopener noreferrer"
													onClick={(e) => e.stopPropagation()}
													className="shrink-0 text-blue-400 hover:text-blue-600"
												>
													<ExternalLink className="w-3 h-3" />
												</a>
											)}
										</div>
										{/* Date */}
										<span className="font-sarabun text-xs text-gray-400 w-32 text-right hidden sm:block shrink-0">
											{new Date(post.createdAt).toLocaleDateString('th-TH', {
												year: 'numeric',
												month: 'short',
												day: 'numeric',
											})}
										</span>
										{/* Type */}
										<span className="font-sarabun text-xs text-gray-400 w-24 text-right hidden md:block shrink-0">
											{post.category ?? 'โพสต์'}
										</span>
										{/* Meta */}
										<div className="flex items-center justify-end gap-2 w-20 shrink-0">
											<span className="inline-flex items-center gap-0.5 text-xs text-emerald-600 font-medium">
												<ThumbsUp className="w-3 h-3" />
												{post.upvotes}
											</span>
											<span className="inline-flex items-center gap-0.5 text-xs text-red-400 font-medium">
												<ThumbsDown className="w-3 h-3" />
												{post.downvotes}
											</span>
										</div>
									</div>
								))}

								{/* ── Files (only on first posts page, or while searching) ── */}
								{(postsPage === 1 || !!debouncedSearch) &&
									files.map((file) => (
										<div
											key={file.id}
											className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center px-4 py-2 hover:bg-[#006837]/5 group gap-3 transition-colors"
										>
											{/* Icon */}
											<span className="w-5 h-5 text-center text-sm leading-none shrink-0 select-none">
												{getFileIcon(file.mimetype)}
											</span>
											{/* Name */}
											<span className="font-sarabun font-medium text-gray-800 truncate text-sm">
												{file.originalName}
											</span>
											{/* Date */}
											<span className="font-sarabun text-xs text-gray-400 w-32 text-right hidden sm:block shrink-0">
												{new Date(file.createdAt).toLocaleDateString('th-TH', {
													year: 'numeric',
													month: 'short',
													day: 'numeric',
												})}
											</span>
											{/* Type */}
											<span className="font-sarabun text-xs text-gray-400 w-24 text-right hidden md:block shrink-0 truncate">
												{formatFileSize(file.size)}
											</span>
											{/* Actions */}
											<div className="flex items-center justify-end gap-1.5 w-20 shrink-0">
												<span className="inline-flex items-center gap-0.5 text-xs text-gray-400 mr-1">
													<Download className="w-3 h-3" />
													{file.downloads}
												</span>
												<button
													className="inline-flex items-center gap-1 px-2 py-1 text-xs font-sarabun font-medium text-white bg-[#006837] hover:bg-[#005530] rounded transition-colors opacity-0 group-hover:opacity-100"
													onClick={() => handleDownload(file.id, file.originalName)}
												>
													<Download className="w-3 h-3" />
													ดาวน์โหลด
												</button>
											</div>
										</div>
									))}
							</div>
						)}

						{/* Posts pagination */}
						{postsPagination && postsPagination.totalPages > 1 && !debouncedSearch && (
							<div className="px-4 py-4 border-t border-gray-100">
								<Pagination
									currentPage={postsPagination.page}
									totalPages={postsPagination.totalPages}
									onPageChange={setPostsPage}
									hasNext={postsPagination.hasNext}
									hasPrev={postsPagination.hasPrev}
									total={postsPagination.total}
									limit={postsPagination.limit}
								/>
							</div>
						)}

						{/* Subfolders pagination */}
						{subfoldersPagination && subfoldersPagination.totalPages > 1 && !debouncedSearch && (
							<div className="px-4 pb-4">
								<Pagination
									currentPage={subfoldersPagination.page}
									totalPages={subfoldersPagination.totalPages}
									onPageChange={setSubfoldersPage}
									hasNext={subfoldersPagination.hasNext}
									hasPrev={subfoldersPagination.hasPrev}
								/>
							</div>
						)}
					</div>
				)}
			</div>
		</main>
	);
}
