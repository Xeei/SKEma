'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sarabun } from 'next/font/google';
import { FolderOpen, ShieldCheck, ChevronRight, BookOpen, Trophy, ArrowRight } from 'lucide-react';
import { TermsDialog } from '@/components/TermsDialog';

const sarabun = Sarabun({
	weight: ['400', '500', '600', '700'],
	subsets: ['latin', 'thai'],
	variable: '--font-sarabun',
	display: 'swap',
});

const HUB_CARDS = [
	{
		key: 'folders',
		href: '/folders',
		icon: FolderOpen,
		iconBg: 'bg-emerald-100',
		iconColor: 'text-emerald-700',
		title: 'คลังเอกสาร',
		titleEn: 'File Folders',
		description: 'เอกสาร โจทย์การบ้าน และแหล่งเรียนรู้ จัดเรียงตามวิชาและปีการศึกษา',
		permission: '',
	},
	{
		key: 'leaderboard',
		href: '/leaderboard',
		icon: Trophy,
		iconBg: 'bg-amber-100',
		iconColor: 'text-amber-600',
		title: 'ลีดเดอร์บอร์ด',
		titleEn: 'Leaderboard',
		description: '10 อันดับผู้ใช้ที่มีคะแนนโหวตสูงสุดจากโพสต์ที่ได้รับการอนุมัติ',
		permission: '',
	},
	{
		key: 'admin',
		href: '/admin',
		icon: ShieldCheck,
		iconBg: 'bg-blue-100',
		iconColor: 'text-blue-700',
		title: 'แผงควบคุมผู้ดูแล',
		titleEn: 'Admin Panel',
		description: 'จัดการโพสต์ รออนุมัติ และดูแลระบบโดยผู้ดูแล',
		permission: 'admin',
	},
	{
		key: 'folder-panel',
		href: '/library/folders',
		icon: BookOpen,
		iconBg: 'bg-purple-100',
		iconColor: 'text-purple-700',
		title: 'โฟล์เดอร์ชั้นนอก',
		titleEn: 'Main Folder Panel',
		description: 'จัดการโฟลเดอร์หลัก',
		permission: 'admin',
	},
];

export default function Home() {
	const router = useRouter();
	const { data: session } = useSession();
	const isAdmin = session?.role === 'ADMIN';

	const visibleCards = HUB_CARDS.filter((c) => c.permission !== 'admin' || isAdmin);
	const publicCards = visibleCards.filter((c) => c.permission !== 'admin');
	const adminCards = visibleCards.filter((c) => c.permission === 'admin');

	return (
		<main className={`${sarabun.variable} min-h-[calc(100vh-180px)] bg-gray-100`}>
			<TermsDialog />

			{/* Hero */}
			{/* Fix 1: bg-linear-to-br → bg-gradient-to-br (valid Tailwind v3 utility) */}
			<div className="bg-gradient-to-br from-brand via-brand-dark to-brand-darker text-white px-6 pt-16 pb-28">
				<div className="max-w-2xl mx-auto text-center">
					<span className="inline-flex items-center bg-white/10 border border-white/20 text-white/80 text-xs font-medium px-4 py-1.5 rounded-full mb-6 font-sarabun tracking-wide">
						คณะวิชาวิศวกรรมซอฟต์แวร์และความรู้ · Kasetsart University
					</span>
					<h1 className="font-sarabun text-6xl font-bold mb-4 tracking-tight">
						SKE <span className="text-brand-accent">Schema</span>
					</h1>
					<p className="font-sarabun text-white/70 text-lg mb-10 leading-relaxed">
						แหล่งรวมเอกสาร โจทย์การบ้าน และแหล่งเรียนรู้
						<br />
						จัดเรียงตามวิชาและปีการศึกษา สำหรับนักศึกษา SKE
					</p>
					<div className="flex items-center justify-center gap-3 flex-wrap">
						{/* Fix 2: Primary CTA is now visually distinct (solid white bg, brand-colored text) */}
						<button
							onClick={() => router.push('/folders')}
							className="inline-flex items-center gap-2 bg-white text-brand font-sarabun font-semibold px-6 py-3 rounded-xl hover:bg-white/90 transition-colors shadow-md"
						>
							เริ่มต้นใช้งาน
							<ArrowRight className="w-4 h-4" />
						</button>
						{/* Secondary CTA keeps the ghost/outline style */}
						<button
							onClick={() => router.push('/leaderboard')}
							className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white font-sarabun font-medium px-6 py-3 rounded-xl hover:bg-white/20 transition-colors"
						>
							<Trophy className="w-4 h-4" />
							ดูอันดับ
						</button>
					</div>
				</div>
			</div>

			{/* White sheet overlapping hero */}
			<div className="bg-white rounded-t-3xl -mt-10 relative z-10 shadow-[0_-8px_40px_rgba(0,0,0,0.10)]">
				<div className="max-w-4xl mx-auto px-6 pt-10 pb-16">
					<p className="text-center font-sarabun text-xs font-semibold text-gray-400 uppercase tracking-widest mb-8">
						เมนูหลัก
					</p>

					{/* Public cards */}
					{/* Fix 3: Cards now have equal visual weight — neither is "primary" green.
					    Both use the same neutral card style so the layout feels balanced. */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
						{publicCards.map((card) => {
							const Icon = card.icon;
							return (
								<div
									key={card.key}
									onClick={() => router.push(card.href)}
									className="group cursor-pointer bg-gray-50 border border-gray-200 rounded-2xl p-7 flex flex-col gap-5 transition-all duration-200 hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5"
								>
									<div
										className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}
									>
										<Icon className={`w-6 h-6 ${card.iconColor}`} />
									</div>
									<div className="flex-1">
										<h3 className="font-sarabun text-xl font-bold text-gray-900">{card.title}</h3>
										<p className="font-sarabun text-xs font-medium mt-0.5 mb-3 text-gray-400">
											{card.titleEn}
										</p>
										<p className="font-sarabun text-sm leading-relaxed text-gray-500">
											{card.description}
										</p>
									</div>
									<div className="flex items-center gap-1 text-sm font-semibold font-sarabun text-brand transition-all group-hover:gap-2">
										เปิด <ChevronRight className="w-4 h-4" />
									</div>
								</div>
							);
						})}
					</div>

					{/* Admin tools */}
					{adminCards.length > 0 && (
						<div>
							<p className="font-sarabun text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
								เครื่องมือแอดมิน
							</p>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								{adminCards.map((card) => {
									const Icon = card.icon;
									return (
										<div
											key={card.key}
											onClick={() => router.push(card.href)}
											className="group cursor-pointer bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 flex items-center gap-4 hover:border-gray-300 hover:bg-white hover:shadow-sm transition-all duration-150"
										>
											<div
												className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${card.iconBg}`}
											>
												<Icon className={`w-4 h-4 ${card.iconColor}`} />
											</div>
											<div className="flex-1 min-w-0">
												<p className="font-sarabun font-bold text-gray-800 text-sm">{card.title}</p>
												<p className="font-sarabun text-xs text-gray-400 mt-0.5 truncate">
													{card.description}
												</p>
											</div>
											<ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand transition-colors shrink-0" />
										</div>
									);
								})}
							</div>
						</div>
					)}
				</div>
			</div>
		</main>
	);
}
