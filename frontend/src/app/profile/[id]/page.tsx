'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Sarabun } from 'next/font/google';
import {
	Eye,
	ExternalLink,
	Trash2,
	FileText,
	ThumbsUp,
	ThumbsDown,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
	getMyApprovedPostsPaginated,
	deletePost,
	PostData,
	PaginationMeta,
} from '@/services/post.service';
import { getPublicProfile, PublicProfile } from '@/services/profile.service';
import { EmptyState } from '@/components/EmptyState';
import { toast } from 'sonner';
import { Pagination } from '@/components/Pagination';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const sarabun = Sarabun({
	weight: ['400', '500', '600', '700'],
	subsets: ['latin', 'thai'],
	variable: '--font-sarabun',
	display: 'swap',
});

const POSTS_PER_PAGE = 8;

// ─── Heatmap ────────────────────────────────────────────────────────────────

function getHeatColor(count: number): string {
	if (count === 0) return 'bg-gray-100';
	if (count === 1) return 'bg-emerald-200';
	if (count <= 3) return 'bg-emerald-300';
	if (count <= 5) return 'bg-emerald-400';
	return 'bg-emerald-500';
}

interface HeatmapProps {
	data: Array<{ date: string; count: number }>;
}

function ActivityHeatmap({ data }: HeatmapProps) {
	const countByDate = new Map(data.map((d) => [d.date, d.count]));

	// Build 52 full weeks ending today (Sunday → Saturday)
	const today = new Date();
	const dayOfWeek = today.getDay(); // 0 = Sun
	// Start from the Sunday 51 full weeks + partial current week ago
	const start = new Date(today);
	start.setDate(today.getDate() - dayOfWeek - 51 * 7);

	// Build grid: weeks[col][row] = date string
	const weeks: string[][] = [];
	const cursor = new Date(start);
	for (let col = 0; col < 53; col++) {
		const week: string[] = [];
		for (let row = 0; row < 7; row++) {
			const iso = cursor.toISOString().slice(0, 10);
			week.push(iso);
			cursor.setDate(cursor.getDate() + 1);
		}
		weeks.push(week);
	}

	// Month labels: find first column where the month changes
	const monthLabels: { col: number; label: string }[] = [];
	let lastMonth = -1;
	weeks.forEach((week, col) => {
		const m = new Date(week[0]).getMonth();
		if (m !== lastMonth) {
			monthLabels.push({
				col,
				label: new Date(week[0]).toLocaleString('en', { month: 'short' }),
			});
			lastMonth = m;
		}
	});

	const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	return (
		<TooltipProvider delayDuration={100}>
			<div className="overflow-x-auto">
				<div className="inline-block min-w-max">
					{/* Month labels */}
					<div className="flex mb-1 ml-8">
						{weeks.map((_, col) => {
							const label = monthLabels.find((m) => m.col === col);
							return (
								<div key={col} className="w-[14px] mr-[2px] text-[10px] text-gray-400 font-sarabun">
									{label ? label.label : ''}
								</div>
							);
						})}
					</div>

					<div className="flex gap-0">
						{/* Day-of-week labels */}
						<div className="flex flex-col gap-[2px] mr-2">
							{DAY_LABELS.map((d, i) => (
								<div
									key={d}
									className="h-[12px] text-[9px] text-gray-400 font-sarabun leading-[12px]"
								>
									{i % 2 === 1 ? d.slice(0, 3) : ''}
								</div>
							))}
						</div>

						{/* Grid */}
						<div className="flex gap-[2px]">
							{weeks.map((week, col) => (
								<div key={col} className="flex flex-col gap-[2px]">
									{week.map((dateStr) => {
										const count = countByDate.get(dateStr) ?? 0;
										const isFuture = dateStr > today.toISOString().slice(0, 10);
										if (isFuture) {
											return <div key={dateStr} className="w-[12px] h-[12px]" />;
										}
										return (
											<Tooltip key={dateStr}>
												<TooltipTrigger asChild>
													<div
														className={`w-[12px] h-[12px] rounded-[2px] cursor-default ${getHeatColor(count)}`}
													/>
												</TooltipTrigger>
												<TooltipContent side="top" className="text-xs">
													<span className="font-semibold">{count} post{count !== 1 ? 's' : ''}</span>
													{' on '}
													{new Date(dateStr + 'T00:00:00').toLocaleDateString('en', {
														month: 'short',
														day: 'numeric',
														year: 'numeric',
													})}
												</TooltipContent>
											</Tooltip>
										);
									})}
								</div>
							))}
						</div>
					</div>

					{/* Legend */}
					<div className="flex items-center gap-1 mt-2 ml-8">
						<span className="text-[10px] text-gray-400 font-sarabun mr-1">Less</span>
						{['bg-gray-100', 'bg-emerald-200', 'bg-emerald-300', 'bg-emerald-400', 'bg-emerald-500'].map(
							(cls) => (
								<div key={cls} className={`w-[12px] h-[12px] rounded-[2px] ${cls}`} />
							)
						)}
						<span className="text-[10px] text-gray-400 font-sarabun ml-1">More</span>
					</div>
				</div>
			</div>
		</TooltipProvider>
	);
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const params = useParams<{ id: string }>();
	const userId = params.id;

	const isOwnProfile = session?.userId === userId;

	const [profile, setProfile] = useState<PublicProfile | null>(null);
	const [profileLoading, setProfileLoading] = useState(true);
	const [profileError, setProfileError] = useState(false);

	// Own-profile posts
	const [posts, setPosts] = useState<PostData[]>([]);
	const [postsLoading, setPostsLoading] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [pagination, setPagination] = useState<PaginationMeta | null>(null);

	useEffect(() => {
		if (status === 'unauthenticated') {
			router.push('/auth/login');
		}
	}, [status, router]);

	useEffect(() => {
		if (status !== 'authenticated' || !userId) return;
		setProfileLoading(true);
		setProfileError(false);
		getPublicProfile(userId)
			.then(setProfile)
			.catch(() => setProfileError(true))
			.finally(() => setProfileLoading(false));
	}, [status, userId]);

	const loadPosts = useCallback(async (page: number = 1) => {
		setPostsLoading(true);
		try {
			const result = await getMyApprovedPostsPaginated(page, POSTS_PER_PAGE);
			setPosts(result.data);
			setPagination(result.pagination);
			setCurrentPage(page);
		} catch (err) {
			console.error('Error loading posts:', err);
		} finally {
			setPostsLoading(false);
		}
	}, []);

	useEffect(() => {
		if (isOwnProfile && status === 'authenticated') {
			loadPosts(1);
		}
	}, [isOwnProfile, status, loadPosts]);

	const handleDelete = async (id: string) => {
		if (!confirm('ยืนยันการลบโพสต์นี้?')) return;
		try {
			await deletePost(id);
			await loadPosts(currentPage);
			toast.success('ลบโพสต์สำเร็จ');
		} catch {
			toast.error('ไม่สามารถลบโพสต์ได้');
		}
	};

	if (status === 'loading' || (profileLoading && !profileError)) {
		return (
			<main className="min-h-[calc(100vh-180px)]">
				<div className="bg-linear-to-br from-brand via-brand-dark to-brand-darker py-14 px-6">
					<div className="max-w-5xl mx-auto space-y-5">
						<Skeleton className="h-4 w-40 bg-white/20" />
						<div className="flex items-center gap-6">
							<Skeleton className="w-20 h-20 rounded-full bg-white/20 shrink-0" />
							<Skeleton className="h-8 w-48 bg-white/20" />
						</div>
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
							{[...Array(4)].map((_, i) => (
								<Skeleton key={i} className="h-16 rounded-xl bg-white/20" />
							))}
						</div>
					</div>
				</div>
			</main>
		);
	}

	if (status === 'unauthenticated') return null;

	if (profileError || !profile) {
		return (
			<main className={`${sarabun.variable} min-h-[calc(100vh-180px)] flex items-center justify-center`}>
				<p className="font-sarabun text-gray-500">ไม่พบผู้ใช้งานนี้</p>
			</main>
		);
	}

	const { user, stats, heatmap, mostUpvotedPost } = profile;

	const displayName = user.name || 'ผู้ใช้งาน';
	const initials =
		(user.name || 'U')
			.split(' ')
			.map((n) => n[0])
			.join('')
			.slice(0, 2)
			.toUpperCase();

	const approvedCount = pagination?.total ?? 0;
	const totalPages = pagination?.totalPages ?? 0;

	return (
		<main className={`${sarabun.variable} min-h-[calc(100vh-180px)]`}>
			{/* Hero */}
			<div className="bg-linear-to-br from-brand via-brand-dark to-brand-darker text-white py-14 px-6">
				<div className="max-w-5xl mx-auto">
					<p className="font-sarabun text-white/50 text-sm mb-6 tracking-wide uppercase">
						SKE Schema / {isOwnProfile ? 'โปรไฟล์' : 'โปรไฟล์ผู้ใช้'}
					</p>
					<div className="flex items-center gap-6 flex-wrap">
						{/* Avatar */}
						<div className="relative shrink-0">
							{isOwnProfile && session?.user?.image ? (
								// eslint-disable-next-line @next/next/no-img-element
								<img
									src={session.user.image}
									alt={displayName}
									className="w-20 h-20 rounded-full object-cover ring-4 ring-white/20"
								/>
							) : (
								<div className="w-20 h-20 rounded-full bg-white/20 ring-4 ring-white/20 flex items-center justify-center text-3xl font-bold font-sarabun">
									{initials}
								</div>
							)}
							{isOwnProfile && (
								<div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-brand" />
							)}
						</div>
						<div>
							<h1 className="font-sarabun text-3xl font-bold tracking-tight">{displayName}</h1>
							{isOwnProfile && (
								<p className="font-sarabun text-white/70 mt-1 text-sm">{session?.user?.email}</p>
							)}
						</div>
					</div>

					{/* Stats */}
					<div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
						<div className="bg-white/10 backdrop-blur-xs rounded-xl px-4 py-3 border border-white/10">
							<p className="font-sarabun text-white/60 text-xs uppercase tracking-wide mb-1">
								โพสต์ทั้งหมด
							</p>
							<p className="font-sarabun text-2xl font-bold">{stats.totalPosts}</p>
						</div>
						<div className="bg-white/10 backdrop-blur-xs rounded-xl px-4 py-3 border border-white/10">
							<div className="flex items-center gap-1 mb-1">
								<ThumbsUp className="w-3 h-3 text-white/60" />
								<p className="font-sarabun text-white/60 text-xs uppercase tracking-wide">อัปโหวต</p>
							</div>
							<p className="font-sarabun text-2xl font-bold">{stats.totalUpvotes}</p>
						</div>
						<div className="bg-white/10 backdrop-blur-xs rounded-xl px-4 py-3 border border-white/10">
							<div className="flex items-center gap-1 mb-1">
								<ThumbsDown className="w-3 h-3 text-white/60" />
								<p className="font-sarabun text-white/60 text-xs uppercase tracking-wide">ดาวน์โหวต</p>
							</div>
							<p className="font-sarabun text-2xl font-bold">{stats.totalDownvotes}</p>
						</div>
						<div className="bg-white/10 backdrop-blur-xs rounded-xl px-4 py-3 border border-white/10">
							<div className="flex items-center gap-1 mb-1">
								<Eye className="w-3 h-3 text-white/60" />
								<p className="font-sarabun text-white/60 text-xs uppercase tracking-wide">ยอดวิว</p>
							</div>
							<p className="font-sarabun text-2xl font-bold">{stats.totalViews}</p>
						</div>
					</div>

					{/* Most upvoted post */}
					{mostUpvotedPost && (
						<Link
							href={`/library/post/${mostUpvotedPost.id}`}
							className="mt-4 flex items-center gap-3 bg-white/10 border border-white/10 rounded-xl px-4 py-3 hover:bg-white/15 transition-colors"
						>
							<ThumbsUp className="w-4 h-4 text-emerald-300 shrink-0" />
							<div className="flex-1 min-w-0">
								<p className="font-sarabun text-white/60 text-xs mb-0.5">
									โพสต์ที่ได้รับอัปโหวตมากที่สุด
								</p>
								<p className="font-sarabun text-sm font-semibold truncate">{mostUpvotedPost.title}</p>
							</div>
							<span className="font-sarabun text-emerald-300 font-bold text-sm shrink-0">
								{mostUpvotedPost.upvotes} ▲
							</span>
						</Link>
					)}
				</div>
			</div>

			{/* Body */}
			<div className="bg-gray-50 min-h-[calc(100vh-420px)] px-6 py-10">
				<div className="max-w-5xl mx-auto space-y-8">
					{/* Activity heatmap */}
					<div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
						<h2 className="font-sarabun text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">
							กิจกรรม (365 วันที่ผ่านมา)
						</h2>
						<ActivityHeatmap data={heatmap} />
					</div>

					{/* Own profile: post list */}
					{isOwnProfile && (
						<div>
							<div className="flex items-center justify-between mb-4">
								<h2 className="font-sarabun text-lg font-semibold text-gray-800">โพสต์ทั้งหมด</h2>
							</div>

							{postsLoading ? (
								<div className="space-y-2">
									{[...Array(4)].map((_, i) => (
										<Skeleton key={i} className="h-12 rounded-xl" />
									))}
								</div>
							) : approvedCount === 0 ? (
								<EmptyState
									icon={FileText}
									title="ยังไม่มีโพสต์"
									description="โพสต์ที่ได้รับการอนุมัติของคุณจะแสดงที่นี่"
									actionLabel="เริ่มสร้างโพสต์"
									onAction={() => router.push('/folders')}
								/>
							) : (
								<div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
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
												className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center px-4 py-2 hover:bg-brand/5 cursor-pointer group gap-3 transition-colors"
											>
												<FileText className="w-5 h-5 text-brand shrink-0" />
												<div className="min-w-0 flex items-center gap-2">
													<span className="font-sarabun font-medium text-gray-800 truncate text-sm group-hover:text-brand">
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
												<span className="font-sarabun text-xs text-gray-400 w-32 text-right hidden sm:block shrink-0">
													{new Date(post.createdAt).toLocaleDateString('th-TH', {
														year: 'numeric',
														month: 'short',
														day: 'numeric',
													})}
												</span>
												<span className="font-sarabun text-xs text-gray-400 w-24 text-right hidden md:block shrink-0">
													{post.category ?? 'โพสต์'}
												</span>
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
					)}
				</div>
			</div>
		</main>
	);
}
