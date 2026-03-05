'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sarabun } from 'next/font/google';
import { Trophy, ThumbsUp, Eye, FileText, Crown, Medal } from 'lucide-react';
import { getLeaderboard, LeaderboardEntry } from '@/services/leaderboard.service';

const sarabun = Sarabun({
	weight: ['400', '500', '600', '700'],
	subsets: ['latin', 'thai'],
	variable: '--font-sarabun',
	display: 'swap',
});

const PODIUM_COLORS = [
	{
		bg: 'bg-yellow-50',
		border: 'border-yellow-300',
		badge: 'bg-yellow-400 text-white',
		icon: Crown,
		iconColor: 'text-yellow-500',
		height: 'h-36',
		label: '1st',
	},
	{
		bg: 'bg-gray-50',
		border: 'border-gray-300',
		badge: 'bg-gray-400 text-white',
		icon: Medal,
		iconColor: 'text-gray-400',
		height: 'h-24',
		label: '2nd',
	},
	{
		bg: 'bg-orange-50',
		border: 'border-orange-300',
		badge: 'bg-orange-400 text-white',
		icon: Medal,
		iconColor: 'text-orange-400',
		height: 'h-20',
		label: '3rd',
	},
];

function getInitials(name: string | null, email: string) {
	if (name) {
		return name
			.split(' ')
			.map((w) => w[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}
	return email.slice(0, 2).toUpperCase();
}

function Avatar({
	name,
	email,
	size = 'md',
}: {
	name: string | null;
	email: string;
	size?: 'sm' | 'md' | 'lg';
}) {
	const sizeClass =
		size === 'lg' ? 'w-16 h-16 text-xl' : size === 'md' ? 'w-12 h-12 text-base' : 'w-9 h-9 text-sm';
	return (
		<div
			className={`${sizeClass} rounded-full bg-[#006837] text-white flex items-center justify-center font-bold shrink-0`}
		>
			{getInitials(name, email)}
		</div>
	);
}

export default function LeaderboardPage() {
	const { status } = useSession();
	const router = useRouter();
	const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (status === 'unauthenticated') {
			router.push('/auth/login');
		}
	}, [status, router]);

	useEffect(() => {
		if (status !== 'authenticated') return;
		getLeaderboard()
			.then(setEntries)
			.catch(() => setError('ไม่สามารถโหลดข้อมูลได้'))
			.finally(() => setLoading(false));
	}, [status]);

	const podium = entries.slice(0, 3);
	const rest = entries.slice(3);

	return (
		<main className={`${sarabun.variable} min-h-[calc(100vh-180px)] bg-gray-50`}>
			{/* Header */}
			<div className="bg-linear-to-br from-[#006837] via-[#005028] to-[#003d1f] text-white py-12 px-6">
				<div className="max-w-4xl mx-auto text-center">
					<div className="flex items-center justify-center gap-2 mb-3">
						<Trophy className="w-8 h-8 text-yellow-400" />
						<h1 className="font-sarabun text-4xl font-bold">Leaderboard</h1>
					</div>
					<p className="font-sarabun text-white/70 text-base">
						10 อันดับผู้ใช้ที่มีคะแนนโหวตสูงสุด จากโพสต์ที่ได้รับการอนุมัติ
					</p>
				</div>
			</div>

			<div className="max-w-4xl mx-auto px-6 py-12">
				{loading && (
					<div className="text-center text-gray-500 font-sarabun py-24 text-lg">กำลังโหลด...</div>
				)}

				{error && (
					<div className="text-center text-red-500 font-sarabun py-24 text-base">{error}</div>
				)}

				{!loading && !error && entries.length === 0 && (
					<div className="text-center text-gray-400 font-sarabun py-24 text-base">
						ยังไม่มีข้อมูล
					</div>
				)}

				{/* Podium — top 3 */}
				{!loading && !error && podium.length > 0 && (
					<div className="mb-12">
						<h2 className="font-sarabun text-sm font-semibold text-gray-400 uppercase tracking-widest text-center mb-8">
							อันดับสูงสุด
						</h2>
						{/* Reorder: 2nd, 1st, 3rd */}
						<div className="flex items-end justify-center gap-4">
							{[podium[1], podium[0], podium[2]].filter(Boolean).map((entry, idx) => {
								const realRank = entry.rank === 1 ? 0 : entry.rank === 2 ? 1 : 2;
								const config = PODIUM_COLORS[realRank];
								const Icon = config.icon;
								return (
									<div
										key={entry.userId}
										className={`flex flex-col items-center ${entry.rank === 1 ? 'order-2' : entry.rank === 2 ? 'order-1' : 'order-3'}`}
									>
										<Icon className={`w-7 h-7 mb-2 ${config.iconColor}`} />
										<Avatar
											name={entry.name}
											email={entry.email}
											size={entry.rank === 1 ? 'lg' : 'md'}
										/>
										<p
											className={`font-sarabun font-bold mt-2 text-gray-800 ${entry.rank === 1 ? 'text-base' : 'text-sm'} max-w-[110px] text-center truncate`}
										>
											{entry.name || entry.email.split('@')[0]}
										</p>
										<p className="font-sarabun text-xs text-gray-400 mb-3">
											{entry.totalUpvotes.toLocaleString()} upvote
											{entry.totalUpvotes !== 1 ? 's' : ''}
										</p>
										<div
											className={`w-28 ${config.height} ${config.bg} border-t-4 ${config.border} rounded-t-xl flex items-center justify-center`}
										>
											<span className={`font-sarabun text-2xl font-extrabold ${config.iconColor}`}>
												#{entry.rank}
											</span>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				)}

				{/* Ranks 4–10 */}
				{!loading && !error && rest.length > 0 && (
					<div>
						<h2 className="font-sarabun text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
							อันดับถัดไป
						</h2>
						<div className="flex flex-col gap-3">
							{rest.map((entry) => (
								<div
									key={entry.userId}
									className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-sm"
								>
									<span className="font-sarabun text-lg font-bold text-gray-400 w-8 text-center shrink-0">
										#{entry.rank}
									</span>
									<Avatar name={entry.name} email={entry.email} size="sm" />
									<div className="flex-1 min-w-0">
										<p className="font-sarabun font-semibold text-gray-800 truncate">
											{entry.name || entry.email.split('@')[0]}
										</p>
										<p className="font-sarabun text-xs text-gray-400 truncate">{entry.email}</p>
									</div>
									<div className="flex items-center gap-5 shrink-0">
										<div className="flex items-center gap-1 text-emerald-600" title="Upvotes">
											<ThumbsUp className="w-4 h-4" />
											<span className="font-sarabun text-sm font-semibold">
												{entry.totalUpvotes.toLocaleString()}
											</span>
										</div>
										<div className="flex items-center gap-1 text-blue-500" title="Views">
											<Eye className="w-4 h-4" />
											<span className="font-sarabun text-sm font-semibold">
												{entry.totalViews.toLocaleString()}
											</span>
										</div>
										<div className="flex items-center gap-1 text-gray-400" title="Approved posts">
											<FileText className="w-4 h-4" />
											<span className="font-sarabun text-sm font-semibold">
												{entry.approvedPosts}
											</span>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</main>
	);
}
