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
	ExternalLink,
	Trash2,
	Calendar,
	FileText,
	Tag,
	ThumbsUp,
	ThumbsDown,
	Clock,
	XCircle,
} from 'lucide-react';
import {
	getMyApprovedPostsPaginated,
	deletePost,
	PostData,
	PaginationMeta,
	getMyStats,
	AuthorStats,
} from '@/services/post.service';
import { CreatePostDialog } from '@/components/CreatePostDialog';
import { Pagination } from '@/components/Pagination';
import Link from 'next/link';

const sarabun = Sarabun({
	weight: ['400', '500', '600', '700'],
	subsets: ['latin', 'thai'],
	variable: '--font-sarabun',
	display: 'swap',
});

const POSTS_PER_PAGE = 8;

export default function ProfilePage() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const [posts, setPosts] = useState<PostData[]>([]);
	const [loading, setLoading] = useState(true);
	const [currentPage, setCurrentPage] = useState(1);
	const [pagination, setPagination] = useState<PaginationMeta | null>(null);
	const [stats, setStats] = useState<AuthorStats | null>(null);

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
			getMyStats().then(setStats).catch(console.error);
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
					<div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
						{/* Total posts */}
						<div className="bg-white/10 backdrop-blur-xs rounded-xl px-4 py-3 border border-white/10">
							<p className="font-sarabun text-white/60 text-xs uppercase tracking-wide mb-1">
								โพสต์ทั้งหมด
							</p>
							<p className="font-sarabun text-2xl font-bold">
								{stats?.totalPosts ?? approvedCount}
							</p>
						</div>
						{/* Approved */}
						{/* <div className="bg-white/10 backdrop-blur-xs rounded-xl px-4 py-3 border border-white/10">
							<p className="font-sarabun text-white/60 text-xs uppercase tracking-wide mb-1">
								อนุมัติแล้ว
							</p>
							<p className="font-sarabun text-2xl font-bold">{stats?.approvedPosts ?? '—'}</p>
						</div> */}
						{/* Pending */}
						{/* <div className="bg-white/10 backdrop-blur-xs rounded-xl px-4 py-3 border border-white/10">
							<div className="flex items-center gap-1 mb-1">
								<Clock className="w-3 h-3 text-white/60" />
								<p className="font-sarabun text-white/60 text-xs uppercase tracking-wide">
									รอตรวจสอบ
								</p>
							</div>
							<p className="font-sarabun text-2xl font-bold">{stats?.pendingPosts ?? '—'}</p>
						</div> */}
						{/* Upvotes */}
						<div className="bg-white/10 backdrop-blur-xs rounded-xl px-4 py-3 border border-white/10">
							<div className="flex items-center gap-1 mb-1">
								<ThumbsUp className="w-3 h-3 text-white/60" />
								<p className="font-sarabun text-white/60 text-xs uppercase tracking-wide">
									อัปโหวต
								</p>
							</div>
							<p className="font-sarabun text-2xl font-bold">{stats?.totalUpvotes ?? '—'}</p>
						</div>
						{/* Downvotes */}
						<div className="bg-white/10 backdrop-blur-xs rounded-xl px-4 py-3 border border-white/10">
							<div className="flex items-center gap-1 mb-1">
								<ThumbsDown className="w-3 h-3 text-white/60" />
								<p className="font-sarabun text-white/60 text-xs uppercase tracking-wide">
									ดาวน์โหวต
								</p>
							</div>
							<p className="font-sarabun text-2xl font-bold">{stats?.totalDownvotes ?? '—'}</p>
						</div>
						{/* Total views */}
						<div className="bg-white/10 backdrop-blur-xs rounded-xl px-4 py-3 border border-white/10">
							<div className="flex items-center gap-1 mb-1">
								<Eye className="w-3 h-3 text-white/60" />
								<p className="font-sarabun text-white/60 text-xs uppercase tracking-wide">ยอดวิว</p>
							</div>
							<p className="font-sarabun text-2xl font-bold">{stats?.totalViews ?? '—'}</p>
						</div>
					</div>

					{/* Most upvoted post callout */}
					{stats?.mostUpvotedPost && (
						<Link
							href={`/library/post/${stats.mostUpvotedPost.id}`}
							className="mt-4 flex items-center gap-3 bg-white/10 border border-white/10 rounded-xl px-4 py-3 hover:bg-white/15 transition-colors"
						>
							<ThumbsUp className="w-4 h-4 text-emerald-300 shrink-0" />
							<div className="flex-1 min-w-0">
								<p className="font-sarabun text-white/60 text-xs mb-0.5">
									โพสต์ที่ได้รับอัปโหวตมากที่สุด
								</p>
								<p className="font-sarabun text-sm font-semibold truncate">
									{stats.mostUpvotedPost.title}
								</p>
							</div>
							<span className="font-sarabun text-emerald-300 font-bold text-sm shrink-0">
								{stats.mostUpvotedPost.upvotes} ▲
							</span>
						</Link>
					)}
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
							{/* <CreatePostDialog onPostCreated={() => loadPosts(1)} /> */}
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
							<div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
								{/* Column headers */}
								<div className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center px-4 py-1.5 border-b border-gray-100 bg-gray-50 text-xs font-sarabun text-gray-400 font-medium gap-3 select-none">
									<span className="w-5" />
									<span>ชื่อ / Name</span>
									<span className="w-32 text-right hidden sm:block">วันที่สร้าง</span>
									<span className="w-24 text-right hidden md:block">ประเภท / Type</span>
									<span className="w-20 text-right">โหวต</span>
								</div>

								<div className="divide-y divide-gray-50 h-70">
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
											{/* Votes + delete */}
											<div className="flex items-center justify-end gap-2 w-20 shrink-0">
												<span className="inline-flex items-center gap-0.5 text-xs text-emerald-600 font-medium">
													<ThumbsUp className="w-3 h-3" />
													{post.upvotes}
												</span>
												<button
													className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
													title="ลบโพสต์"
													onClick={(e) => {
														e.stopPropagation();
														handleDelete(post.id);
													}}
												>
													<Trash2 className="w-3.5 h-3.5" />
												</button>
											</div>
										</div>
									))}
								</div>

								{totalPages > 1 && (
									<div className="px-4 py-4 border-t border-gray-100">
										<Pagination
											currentPage={currentPage}
											totalPages={totalPages}
											onPageChange={loadPosts}
											hasNext={pagination?.hasNext ?? false}
											hasPrev={pagination?.hasPrev ?? false}
											total={approvedCount}
											limit={POSTS_PER_PAGE}
										/>
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			</div>
		</main>
	);
}
