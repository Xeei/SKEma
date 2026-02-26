'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Sarabun } from 'next/font/google';
import {
	BookOpen,
	ChevronRight,
	ChevronLeft,
	Eye,
	Trash2,
	Calendar,
	FileText,
	Tag,
} from 'lucide-react';
import {
	getMyApprovedPostsPaginated,
	deletePost,
	PostData,
	PaginationMeta,
} from '@/services/post.service';
import { CreatePostDialog } from '@/components/CreatePostDialog';
import Link from 'next/link';

const sarabun = Sarabun({
	weight: ['400', '500', '600', '700'],
	subsets: ['latin', 'thai'],
	variable: '--font-sarabun',
	display: 'swap',
});

const POSTS_PER_PAGE = 4;

export default function ProfilePage() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const [posts, setPosts] = useState<PostData[]>([]);
	const [loading, setLoading] = useState(true);
	const [currentPage, setCurrentPage] = useState(1);
	const [pagination, setPagination] = useState<PaginationMeta | null>(null);

	useEffect(() => {
		if (status === 'unauthenticated') {
			router.push('/auth/login');
		}
	}, [status, router]);

	const loadPosts = useCallback(async (page: number = 1) => {
		setLoading(true);
		try {
			const result = await getMyApprovedPostsPaginated(page, POSTS_PER_PAGE);
			setPosts(result.data);
			setPagination(result.pagination);
			setCurrentPage(page);
		} catch (error) {
			console.error('Error loading posts:', error);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		if (status === 'authenticated') {
			loadPosts(1);
		}
	}, [status, loadPosts]);

	const handleDelete = async (id: string) => {
		if (!confirm('ยืนยันการลบโพสต์นี้?')) return;
		try {
			await deletePost(id);
			await loadPosts(currentPage);
		} catch (error) {
			console.error('Error deleting post:', error);
		}
	};

	if (status === 'loading') {
		return (
			<div className="min-h-[calc(100vh-180px)] flex items-center justify-center">
				<div className="w-12 h-12 border-4 border-[#006837] border-t-transparent rounded-full animate-spin" />
			</div>
		);
	}

	if (status === 'unauthenticated') {
		return null;
	}

	const approvedCount = pagination?.total ?? 0;
	const totalPages = pagination?.totalPages ?? 0;

	const initials =
		session?.user?.name
			?.split(' ')
			.map((n) => n[0])
			.join('')
			.slice(0, 2)
			.toUpperCase() ||
		session?.user?.email?.charAt(0).toUpperCase() ||
		'U';

	return (
		<main className={`${sarabun.variable} min-h-[calc(100vh-180px)]`}>
			{/* Hero */}
			<div className="bg-linear-to-br from-[#006837] via-[#005028] to-[#003d1f] text-white py-14 px-6">
				<div className="max-w-5xl mx-auto">
					<p className="font-sarabun text-white/50 text-sm mb-6 tracking-wide uppercase">
						SKE Schema / โปรไฟล์
					</p>
					<div className="flex items-center gap-6 flex-wrap">
						{/* Avatar */}
						<div className="relative shrink-0">
							{session?.user?.image ? (
								<img
									src={session.user.image}
									alt={session.user.name || 'User'}
									className="w-20 h-20 rounded-full object-cover ring-4 ring-white/20"
								/>
							) : (
								<div className="w-20 h-20 rounded-full bg-white/20 ring-4 ring-white/20 flex items-center justify-center text-3xl font-bold font-sarabun">
									{initials}
								</div>
							)}
							<div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-[#006837]" />
						</div>
						<div>
							<h1 className="font-sarabun text-3xl font-bold tracking-tight">
								{session?.user?.name || 'ผู้ใช้งาน'}
							</h1>
							<p className="font-sarabun text-white/70 mt-1 text-sm">{session?.user?.email}</p>
						</div>
					</div>

					{/* Quick stats */}
					<div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
						<div className="bg-white/10 backdrop-blur-xs rounded-xl px-4 py-3 border border-white/10">
							<p className="font-sarabun text-white/60 text-xs uppercase tracking-wide mb-1">
								โพสต์ทั้งหมด
							</p>
							<p className="font-sarabun text-2xl font-bold">{approvedCount}</p>
						</div>
					</div>
				</div>
			</div>

			{/* Body */}
			<div className="bg-gray-50 min-h-[calc(100vh-420px)] px-6 py-10">
				<div className="max-w-5xl mx-auto space-y-6">
					{/* Quick link */}
					{/* <Link
						href="/profile/my-posts"
						className="group flex items-center gap-4 bg-white rounded-xl border border-gray-200 px-5 py-4 hover:border-[#006837] hover:shadow-sm transition-all"
					>
						<div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
							<BookOpen className="w-5 h-5 text-[#006837]" />
						</div>
						<div className="flex-1">
							<p className="font-sarabun font-semibold text-gray-800">จัดการโพสต์ทั้งหมด</p>
							<p className="font-sarabun text-gray-500 text-sm">
								กรองสถานะ แก้ไข และดูโพสต์ที่รอการอนุมัติ
							</p>
						</div>
						<ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#006837] transition-colors" />
					</Link> */}

					{/* Approved posts */}
					<div>
						<div className="flex items-center justify-between mb-4">
							<h2 className="font-sarabun text-lg font-semibold text-gray-800">โพสต์ทั้งหมด</h2>
							<CreatePostDialog onPostCreated={() => loadPosts(1)} />
						</div>

						{loading ? (
							<div className="space-y-3">
								{[...Array(3)].map((_, i) => (
									<div key={i} className="h-24 rounded-xl bg-gray-200 animate-pulse" />
								))}
							</div>
						) : approvedCount === 0 ? (
							<div className="bg-white rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center py-14 text-center">
								<FileText className="w-10 h-10 text-gray-300 mb-3" />
								<p className="font-sarabun font-medium text-gray-500">
									ยังไม่มีโพสต์ที่อนุมัติแล้ว
								</p>
							</div>
						) : (
							<>
								<div className="space-y-3 mb-6">
									{posts.map((post) => (
										<div
											key={post.id}
											className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-sm transition-all"
										>
											<div className="h-0.5 w-full bg-emerald-500" />
											<div className="px-5 py-4">
												<div className="flex items-start gap-4">
													<div className="flex-1 min-w-0">
														<h3 className="font-sarabun font-semibold text-gray-800 text-sm leading-snug truncate mb-1">
															{post.title}
														</h3>
														<div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
															<span className="flex items-center gap-1">
																<Calendar className="h-3 w-3" />
																{new Date(post.createdAt).toLocaleDateString('th-TH', {
																	day: 'numeric',
																	month: 'short',
																	year: 'numeric',
																})}
															</span>
															{post.category && (
																<span className="flex items-center gap-1">
																	<Tag className="h-3 w-3" />
																	{post.category}
																</span>
															)}
															{post.fileCount != null && post.fileCount > 0 && (
																<span className="flex items-center gap-1">
																	<FileText className="h-3 w-3" />
																	{post.fileCount} ไฟล์
																</span>
															)}
														</div>
														{post.description && (
															<p className="font-sarabun text-xs text-gray-500 mt-1.5 line-clamp-1">
																{post.description}
															</p>
														)}
													</div>
													<div className="flex items-center gap-1 shrink-0">
														<Link href={`/library/post/${post.id}`}>
															<button
																className="p-2 rounded-lg text-gray-400 hover:text-[#006837] hover:bg-emerald-50 transition-colors"
																title="ดูโพสต์"
															>
																<Eye className="h-4 w-4" />
															</button>
														</Link>
														<button
															className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
															title="ลบโพสต์"
															onClick={() => handleDelete(post.id)}
														>
															<Trash2 className="h-4 w-4" />
														</button>
													</div>
												</div>
											</div>
										</div>
									))}
								</div>

								{/* Pagination */}
								{totalPages > 1 && (
									<div className="flex flex-col items-center gap-3">
										<p className="font-sarabun text-sm text-gray-400">
											แสดง {(currentPage - 1) * POSTS_PER_PAGE + 1}–
											{Math.min(currentPage * POSTS_PER_PAGE, approvedCount)} จาก {approvedCount}{' '}
											โพสต์
										</p>
										<div className="flex items-center gap-2">
											<button
												onClick={() => loadPosts(Math.max(1, currentPage - 1))}
												disabled={!pagination?.hasPrev}
												className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium font-sarabun text-gray-600 hover:border-[#006837] hover:text-[#006837] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
											>
												<ChevronLeft className="w-4 h-4" />
												ก่อนหน้า
											</button>
											<div className="flex items-center gap-1">
												{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
													<button
														key={page}
														onClick={() => loadPosts(page)}
														className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
															page === currentPage
																? 'bg-[#006837] text-white'
																: 'border border-gray-200 text-gray-600 hover:border-[#006837] hover:text-[#006837]'
														}`}
													>
														{page}
													</button>
												))}
											</div>
											<button
												onClick={() => loadPosts(Math.min(totalPages, currentPage + 1))}
												disabled={!pagination?.hasNext}
												className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium font-sarabun text-gray-600 hover:border-[#006837] hover:text-[#006837] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
											>
												ถัดไป
												<ChevronRight className="w-4 h-4" />
											</button>
										</div>
									</div>
								)}
							</>
						)}
					</div>
				</div>
			</div>
		</main>
	);
}
