'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sarabun } from 'next/font/google';
import { Download, Search, FileText, Trash2, Library } from 'lucide-react';
import {
	getAllFiles,
	downloadFile,
	deleteFile as deleteFileService,
	formatFileSize,
	getFileIcon,
	FileData,
	PaginatedFileResponse,
} from '@/services/file.service';
import { Pagination } from '@/components/Pagination';

const sarabun = Sarabun({
	weight: ['400', '500', '600', '700'],
	subsets: ['latin', 'thai'],
	variable: '--font-sarabun',
	display: 'swap',
});

const PAGE_LIMIT = 5;

export default function LibraryPage() {
	const { data: session, status } = useSession();
	const router = useRouter();

	const [result, setResult] = useState<PaginatedFileResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');
	const [currentPage, setCurrentPage] = useState(1);

	useEffect(() => {
		if (status === 'unauthenticated') {
			router.push('/auth/login');
		}
	}, [status, router]);

	const loadFiles = useCallback(async (page: number, search: string) => {
		setLoading(true);
		try {
			const data = await getAllFiles(page, PAGE_LIMIT, search);
			setResult(data);
		} catch (error) {
			console.error('Error loading files:', error);
		} finally {
			setLoading(false);
		}
	}, []);

	// Debounce: update debouncedSearch 400ms after user stops typing
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(searchQuery);
			setCurrentPage(1); // reset to page 1 on new search
		}, 400);
		return () => clearTimeout(timer);
	}, [searchQuery]);

	useEffect(() => {
		if (status === 'authenticated') {
			loadFiles(currentPage, debouncedSearch);
		}
	}, [status, currentPage, debouncedSearch, loadFiles]);

	const handleDownload = async (id: string, filename: string) => {
		try {
			await downloadFile(id, filename);
		} catch (error) {
			console.error('Error downloading file:', error);
		}
	};

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	const handleDelete = async (id: string) => {
		if (!confirm('Are you sure you want to delete this file?')) return;
		try {
			await deleteFileService(id);
			await loadFiles(currentPage, debouncedSearch);
		} catch (error) {
			console.error('Error deleting file:', error);
			alert('Failed to delete file');
		}
	};

	const files: FileData[] = result?.data ?? [];

	if (status === 'loading') {
		return (
			<div
				className={`${sarabun.variable} min-h-[calc(100vh-180px)] flex items-center justify-center`}
			>
				<div className="flex flex-col items-center gap-4">
					<div className="w-12 h-12 border-4 border-[#006837] border-t-transparent rounded-full animate-spin" />
					<p className="font-sarabun text-gray-500">กำลังโหลด...</p>
				</div>
			</div>
		);
	}

	if (status === 'unauthenticated') return null;

	return (
		<main className={`${sarabun.variable} min-h-[calc(100vh-180px)]`}>
			{/* Hero Section */}
			<div className="bg-linear-to-br from-[#006837] via-[#005028] to-[#003d1f] text-white py-14 px-6">
				<div className="max-w-5xl mx-auto text-center">
					<span className="inline-block bg-white/10 border border-white/20 text-white text-sm font-medium px-4 py-1.5 rounded-full mb-5 font-sarabun">
						คณะวิชาวิศวกรรมซอฟต์แวร์และความรู้
					</span>
					<div className="flex items-center justify-center gap-3 mb-3">
						<Library className="w-10 h-10 text-[#FDB913]" />
						<h1 className="font-sarabun text-5xl font-bold tracking-tight">
							คลัง<span className="text-[#FDB913]">ไฟล์</span>
						</h1>
					</div>
					<p className="font-sarabun text-white/80 text-lg max-w-xl mx-auto">
						รวมไฟล์เรียน เอกสาร และสื่อการสอนทั้งหมดในระบบ
					</p>
				</div>
			</div>

			{/* Content */}
			<div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
				{/* Stats */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					{[
						{ label: 'ไฟล์ทั้งหมด', labelEn: 'Total Files', value: result?.total ?? '—' },
						{
							label: 'ดาวน์โหลดรวม',
							labelEn: 'Total Downloads',
							value: files.reduce((s, f) => s + f.downloads, 0),
						},
						{
							label: 'ไฟล์ของฉัน',
							labelEn: 'Your Uploads',
							value: files.filter((f) => f.uploadedBy === session?.userId).length,
						},
						{
							label: 'พื้นที่ใช้งาน',
							labelEn: 'Storage (page)',
							value: formatFileSize(files.reduce((s, f) => s + f.size, 0)),
						},
					].map((stat) => (
						<div
							key={stat.labelEn}
							className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"
						>
							<p className="font-sarabun text-xs text-gray-400 font-medium">{stat.labelEn}</p>
							<p className="font-sarabun text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
							<p className="font-sarabun text-sm text-gray-500">{stat.label}</p>
						</div>
					))}
				</div>

				{/* Search */}
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
					<Input
						placeholder="ค้นหาไฟล์... / Search files..."
						className="pl-10"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>

				{/* Files List */}
				<div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
					<div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
						<div>
							<h2 className="font-sarabun font-bold text-gray-800 text-lg">ไฟล์ทั้งหมด</h2>
							<p className="font-sarabun text-sm text-gray-400">
								{`หน้า ${currentPage} จาก ${result?.totalPages ?? 1} — ทั้งหมด ${result?.total ?? 0} ไฟล์`}
							</p>
						</div>
					</div>

					{loading ? (
						<div className="flex flex-col items-center justify-center py-24 gap-4">
							<div className="w-12 h-12 border-4 border-[#006837] border-t-transparent rounded-full animate-spin" />
							<p className="font-sarabun text-gray-500">กำลังโหลดไฟล์...</p>
						</div>
					) : files.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
							<FileText className="w-12 h-12 text-gray-300" />
							<p className="font-sarabun text-gray-500">
								{searchQuery ? 'ไม่พบไฟล์ที่ค้นหา' : 'ยังไม่มีไฟล์ในระบบ'}
							</p>
						</div>
					) : (
						<div className="divide-y divide-gray-100">
							{files.map((file) => (
								<div
									key={file.id}
									className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
								>
									<span className="text-3xl shrink-0">{getFileIcon(file.mimetype)}</span>
									<div className="flex-1 min-w-0">
										<p className="font-sarabun font-medium text-gray-800 truncate">
											{file.originalName}
										</p>
										<p className="font-sarabun text-xs text-gray-400 mt-0.5">
											{formatFileSize(file.size)} · {file.uploaderName ?? 'Unknown'} ·{' '}
											{new Date(file.createdAt).toLocaleDateString('th-TH')}
										</p>
									</div>
									<div className="flex items-center gap-1 text-xs text-gray-400 shrink-0 mr-2">
										<Download className="w-3.5 h-3.5" />
										<span>{file.downloads}</span>
									</div>
									<div className="flex items-center gap-2 shrink-0">
										<Button
											size="sm"
											className="bg-[#006837] hover:bg-[#005530] text-white gap-1.5"
											onClick={() => handleDownload(file.id, file.originalName)}
										>
											<Download className="w-3.5 h-3.5" />
											ดาวน์โหลด
										</Button>
										{file.uploadedBy === session?.userId && (
											<Button
												size="sm"
												variant="ghost"
												onClick={() => handleDelete(file.id)}
												className="text-red-500 hover:text-red-600 hover:bg-red-50"
											>
												<Trash2 className="w-4 h-4" />
											</Button>
										)}
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Pagination */}
				{result && result.totalPages > 1 && (
					<div className="flex justify-center pt-2">
						<Pagination
							currentPage={currentPage}
							totalPages={result.totalPages}
							onPageChange={handlePageChange}
							hasNext={result.hasNext}
							hasPrev={result.hasPrev}
							total={result.total}
							limit={PAGE_LIMIT}
						/>
					</div>
				)}
			</div>
		</main>
	);
}
