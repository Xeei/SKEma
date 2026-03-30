'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sarabun } from 'next/font/google';
import {
	FileFolderData,
	createFolder,
	getAllFolders,
	deleteFolder,
	PaginationMetadata,
} from '@/services/folder.service';
import { Input } from '@/components/ui/input';
import { BookOpen, ChevronRight, FolderOpen, Plus, Trash2 } from 'lucide-react';
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

export default function PublicFoldersPage() {
	const router = useRouter();
	const { data: session } = useSession();
	const [folders, setFolders] = useState<FileFolderData[]>([]);
	const [loading, setLoading] = useState(true);
	const [creating, setCreating] = useState(false);
	const [newFolderName, setNewFolderName] = useState('');
	const [newFolderDesc, setNewFolderDesc] = useState('');
	const [showCreate, setShowCreate] = useState(false);
	const [page, setPage] = useState(1);
	const [pagination, setPagination] = useState<PaginationMetadata | null>(null);

	useEffect(() => {
		loadFolders();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [page]);

	const loadFolders = async () => {
		setLoading(true);
		try {
			const response = await getAllFolders(page, 12);
			setFolders(response.data);
			setPagination(response.pagination);
		} catch (error) {
			console.error('Error loading folders:', error);
		} finally {
			setLoading(false);
		}
	};

	const createFolders = async () => {
		if (!newFolderName.trim()) return;
		setCreating(true);
		try {
			await createFolder(newFolderName.trim(), null, newFolderDesc.trim() || undefined);
			setPage(1);
			await loadFolders();
			setNewFolderName('');
			setNewFolderDesc('');
			setShowCreate(false);
		} catch (error) {
			console.error('Error creating folder:', error);
		} finally {
			setCreating(false);
		}
	};

	const handleDeleteFolder = async (folderId: string, e: React.MouseEvent) => {
		e.stopPropagation();
		if (!confirm('ยืนยันการลบโฟลเดอร์นี้?')) return;
		try {
			await deleteFolder(folderId);
			await loadFolders();
		} catch (error) {
			console.error('Error deleting folder:', error);
		}
	};

	return (
		<main className={`${sarabun.variable} min-h-[calc(100vh-180px)]`}>
			{/* Hero */}
			<div className="bg-linear-to-br from-[#006837] via-[#005028] to-[#003d1f] text-white py-12 px-6">
				<div className="max-w-5xl mx-auto">
					<div className="flex items-end justify-between gap-4 flex-wrap">
						<div>
							<p className="font-sarabun text-white/60 text-sm mb-1">SKE Schema / คลังความรู้</p>
							<h1 className="font-sarabun text-4xl font-bold tracking-tight">โฟลเดอร์ทั้งหมด</h1>
							<p className="font-sarabun text-white/70 text-base mt-2">
								เลือกโฟลเดอร์เพื่อดูเนื้อหาภายใน
							</p>
						</div>
						{session?.role === 'ADMIN' && (
							<button
								onClick={() => setShowCreate(!showCreate)}
								className="flex items-center bg-white hover:bg-gray-300 gap-2 text-[#003d1f] font-sarabun font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors shrink-0"
							>
								<Plus className="w-4 h-4" />
								สร้างโฟลเดอร์ใหม่
							</button>
						)}
					</div>

					{/* Admin create form */}
					{session?.role === 'ADMIN' && showCreate && (
						<div className="mt-6 bg-white/10 border border-white/20 rounded-xl p-5 flex flex-col sm:flex-row gap-3">
							<Input
								placeholder="ชื่อโฟลเดอร์"
								value={newFolderName}
								onChange={(e) => setNewFolderName(e.target.value)}
								disabled={creating}
								className="bg-white/10 border-white/30 text-white placeholder:text-white/50 font-sarabun"
							/>
							<Input
								placeholder="คำอธิบาย (ไม่บังคับ)"
								value={newFolderDesc}
								onChange={(e) => setNewFolderDesc(e.target.value)}
								disabled={creating}
								className="bg-white/10 border-white/30 text-white placeholder:text-white/50 font-sarabun"
							/>
							<button
								onClick={createFolders}
								disabled={creating || !newFolderName.trim()}
								className="bg-[#FDB913] hover:bg-[#e5a610] disabled:opacity-50 text-[#003d1f] font-sarabun font-semibold px-5 py-2 rounded-lg transition-colors shrink-0"
							>
								{creating ? 'กำลังสร้าง...' : 'สร้าง'}
							</button>
						</div>
					)}
				</div>
			</div>

			{/* Content */}
			<div className="max-w-5xl mx-auto px-6 py-10">
				{loading ? (
					<div className="flex flex-col items-center justify-center py-24 gap-4">
						<div className="w-12 h-12 border-4 border-[#006837] border-t-transparent rounded-full animate-spin" />
						<p className="font-sarabun text-gray-500">กำลังโหลดข้อมูล...</p>
					</div>
				) : folders.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
						<FolderOpen className="w-12 h-12 text-gray-300" />
						<p className="font-sarabun text-gray-500">ยังไม่มีโฟลเดอร์ในระบบ</p>
					</div>
				) : (
					<>
						<div className="flex items-center justify-between mb-6">
							<div className="flex items-center gap-3">
								<div className="w-1.5 h-7 bg-[#006837] rounded-full" />
								<h2 className="font-sarabun text-xl font-bold text-gray-800">โฟลเดอร์ทั้งหมด</h2>
							</div>
							<span className="font-sarabun text-sm text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
								{pagination?.total ?? folders.length} โฟลเดอร์
							</span>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
							{folders.map((folder, index) => {
								const color = FOLDER_COLORS[index % FOLDER_COLORS.length];
								return (
									<div
										key={folder.id}
										onClick={() => router.push(`/library/folders/${folder.id}`)}
										className={`${color.bg} border ${color.border} rounded-xl p-5 hover:shadow-md transition-all cursor-pointer group relative`}
									>
										<div className="flex items-start justify-between mb-3">
											<div
												className={`w-10 h-10 ${color.icon} rounded-lg flex items-center justify-center shrink-0`}
											>
												<BookOpen className={`w-5 h-5 ${color.text}`} />
											</div>
											<div className="flex items-center gap-1">
												{session?.userId === folder.userId && (
													<button
														className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
														onClick={(e) => handleDeleteFolder(folder.id, e)}
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
											{folder.name}
										</h3>
										{folder.description && (
											<p className="font-sarabun text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
												{folder.description}
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

						{pagination && pagination.totalPages > 1 && (
							<div className="mt-8">
								<Pagination
									currentPage={pagination.page}
									totalPages={pagination.totalPages}
									onPageChange={setPage}
									hasNext={pagination.hasNext}
									hasPrev={pagination.hasPrev}
								/>
							</div>
						)}
					</>
				)}
			</div>
		</main>
	);
}
