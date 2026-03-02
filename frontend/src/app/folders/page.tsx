'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sarabun } from 'next/font/google';
import { getAllFolders, getFoldersByParent, FileFolderData } from '@/services/folder.service';
import { BookOpen, FolderOpen, ChevronRight } from 'lucide-react';

const sarabun = Sarabun({
	weight: ['400', '500', '600', '700'],
	subsets: ['latin', 'thai'],
	variable: '--font-sarabun',
	display: 'swap',
});

interface YearGroup {
	yearFolder: FileFolderData;
	subjects: FileFolderData[];
}

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

export default function FoldersPage() {
	const router = useRouter();
	const [yearGroups, setYearGroups] = useState<YearGroup[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const totalSubjects = yearGroups.reduce((sum, g) => sum + g.subjects.length, 0);

	useEffect(() => {
		loadFolders();
	}, []);

	const loadFolders = async () => {
		setLoading(true);
		setError(null);
		try {
			const yearFoldersResponse = await getAllFolders(1, 50);
			const yearFolders = yearFoldersResponse.data;

			const groups: YearGroup[] = await Promise.all(
				yearFolders.map(async (yearFolder) => {
					try {
						const subjectsResponse = await getFoldersByParent(yearFolder.id, 1, 50);
						return { yearFolder, subjects: subjectsResponse.data };
					} catch {
						return { yearFolder, subjects: [] };
					}
				})
			);

			groups.sort((a, b) => a.yearFolder.name.localeCompare(b.yearFolder.name, 'th'));
			setYearGroups(groups);
		} catch (err) {
			setError('ไม่สามารถโหลดข้อมูลได้ กรุณาเข้าสู่ระบบก่อน');
		} finally {
			setLoading(false);
		}
	};

	return (
		<main className={`${sarabun.variable} min-h-[calc(100vh-180px)]`}>
			{/* Hero Section */}
			<div className="bg-linear-to-br from-[#006837] via-[#005028] to-[#003d1f] text-white py-14 px-6">
				<div className="max-w-5xl mx-auto text-center">
					<span className="inline-block bg-white/10 border border-white/20 text-white text-sm font-medium px-4 py-1.5 rounded-full mb-5 font-sarabun">
						คณะวิชาวิศวกรรมซอฟต์แวร์และความรู้
					</span>
					<h1 className="font-sarabun text-5xl font-bold mb-3 tracking-tight">
						SKE <span className="text-[#FDB913]">Schema</span>
					</h1>
					<p className="font-sarabun text-white/80 text-lg mb-8 max-w-xl mx-auto">
						แหล่งรวมเอกสาร โจทย์การบ้าน และแหล่งเรียนรู้ — จัดเรียงตามวิชาและปีการศึกษา
					</p>
				</div>
			</div>

			{/* Content */}
			<div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
				{loading ? (
					<div className="flex flex-col items-center justify-center py-24 gap-4">
						<div className="w-12 h-12 border-4 border-[#006837] border-t-transparent rounded-full animate-spin" />
						<p className="font-sarabun text-gray-500">กำลังโหลดข้อมูล...</p>
					</div>
				) : error ? (
					<div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
						<div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
							<FolderOpen className="w-8 h-8 text-amber-600" />
						</div>
						<p className="font-sarabun text-gray-600 text-lg">{error}</p>
						<button
							onClick={() => router.push('/auth/login')}
							className="bg-[#006837] hover:bg-[#005028] text-white font-sarabun font-semibold px-6 py-2.5 rounded-lg transition-colors"
						>
							เข้าสู่ระบบ
						</button>
					</div>
				) : yearGroups.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
						<FolderOpen className="w-12 h-12 text-gray-300" />
						<p className="font-sarabun text-gray-500">ยังไม่มีโฟลเดอร์ในระบบ</p>
					</div>
				) : (
					yearGroups.map((group, groupIndex) => {
						const color = FOLDER_COLORS[groupIndex % FOLDER_COLORS.length];
						return (
							<section key={group.yearFolder.id}>
								{/* Year Header */}
								<div className="flex items-center justify-between mb-4">
									<div className="flex items-center gap-3">
										<div className="w-1.5 h-7 bg-[#006837] rounded-full" />
										<div>
											<h2 className="font-sarabun text-xl font-bold text-gray-800">
												{group.yearFolder.name}
											</h2>
											{group.yearFolder.description && (
												<p className="font-sarabun text-sm text-gray-500 mt-0.5">
													{group.yearFolder.description}
												</p>
											)}
										</div>
									</div>
									<span className="font-sarabun text-sm text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
										{group.subjects.length} วิชา
									</span>
								</div>

								{/* Subject Cards */}
								{group.subjects.length === 0 ? (
									<div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
										<p className="font-sarabun text-gray-400 text-sm">ยังไม่มีวิชาในปีนี้</p>
									</div>
								) : (
									<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
										{group.subjects.map((subject) => (
											<div
												key={subject.id}
												onClick={() => router.push(`/library/folders/${subject.id}`)}
												className={`${color.bg} border ${color.border} rounded-xl p-5 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden`}
											>
												<div className="flex items-start justify-between mb-3">
													<div
														className={`w-10 h-10 ${color.icon} rounded-lg flex items-center justify-center shrink-0`}
													>
														<BookOpen className={`w-5 h-5 ${color.text}`} />
													</div>
													<ChevronRight
														className={`w-4 h-4 ${color.text} opacity-0 group-hover:opacity-100 transition-opacity mt-1`}
													/>
												</div>
												<h3 className="font-sarabun font-semibold text-gray-800 group-hover:text-[#006837] transition-colors leading-snug">
													{subject.name}
												</h3>
												{subject.description && (
													<p className="font-sarabun text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
														{subject.description}
													</p>
												)}
												<div className="mt-4">
													{((subject.subfolderCount ?? 0) > 0 ||
														(subject.postCount ?? 0) > 0 ||
														(subject.fileCount ?? 0) > 0) && (
														<div className="flex items-center gap-2 mb-2 flex-wrap">
															{(subject.subfolderCount ?? 0) > 0 && (
																<span className={`font-sarabun text-xs ${color.text} opacity-70`}>
																	{subject.subfolderCount} โฟลเดอร์
																</span>
															)}
															{(subject.postCount ?? 0) > 0 && (
																<span className={`font-sarabun text-xs ${color.text} opacity-70`}>
																	{subject.postCount} โพสต์
																</span>
															)}
															{(subject.fileCount ?? 0) > 0 && (
																<span className={`font-sarabun text-xs ${color.text} opacity-70`}>
																	{subject.fileCount} ไฟล์
																</span>
															)}
														</div>
													)}
													<div className="flex items-center gap-1.5 text-gray-400">
														<FolderOpen className="w-3.5 h-3.5" />
														<span className="font-sarabun text-xs">เปิดโฟลเดอร์</span>
													</div>
												</div>
											</div>
										))}
									</div>
								)}
							</section>
						);
					})
				)}
			</div>
		</main>
	);
}
