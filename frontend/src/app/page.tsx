'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sarabun } from 'next/font/google';
import { FolderOpen, ShieldCheck, ChevronRight, BookOpen, Trophy } from 'lucide-react';
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
		border: 'border-emerald-200',
		bg: 'bg-emerald-50 hover:bg-emerald-100',
		title: 'คลังเอกสาร',
		titleEn: 'File Folders',
		description: 'เอกสาร โจทย์การบ้าน และแหล่งเรียนรู้ จัดเรียงตามวิชาและปีการศึกษา',
		permission: '',
	},
	{
		key: 'leaderboard',
		href: '/leaderboard',
		icon: Trophy,
		iconBg: 'bg-yellow-100',
		iconColor: 'text-yellow-600',
		border: 'border-yellow-200',
		bg: 'bg-yellow-50 hover:bg-yellow-100',
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
		border: 'border-blue-200',
		bg: 'bg-blue-50 hover:bg-blue-100',
		title: 'แผงควบคุมผู้ดูแล',
		titleEn: 'Admin Panel',
		description: 'จัดการโพสต์ รออนุมัติ และดูแลระบบโดยผู้ดูแล',
		permission: 'admin',
	},
	{
		key: 'folder',
		href: '/library/folders',
		icon: BookOpen,
		iconBg: 'bg-purple-100',
		iconColor: 'text-purple-700',
		border: 'border-purple-200',
		bg: 'bg-purple-50 hover:bg-purple-100',
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

	return (
		<main className={`${sarabun.variable} min-h-[calc(100vh-180px)]`}>
			<TermsDialog />
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
						แหล่งรวมเอกสาร โจทย์การบ้าน และแหล่งเรียนรู้<br>
						จัดเรียงตามวิชาและปีการศึกษา
					</p>
				</div>
			</div>

			{/* Hub Cards */}
			<div className="max-w-5xl mx-auto px-6 py-14">
				<h2 className="font-sarabun text-sm font-semibold text-gray-500 mb-6 text-center tracking-wide uppercase">
					เลือกส่วนที่ต้องการ
				</h2>
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-6xl mx-auto">
					{visibleCards.map((card) => {
						const Icon = card.icon;
						return (
							<div
								key={card.key}
								onClick={() => router.push(card.href)}
								className={`${card.bg} border ${card.border} rounded-2xl p-7 cursor-pointer group transition-all hover:shadow-lg`}
							>
								<div className="flex items-start justify-between mb-5">
									<div
										className={`w-12 h-12 ${card.iconBg} rounded-xl flex items-center justify-center shrink-0`}
									>
										<Icon className={`w-6 h-6 ${card.iconColor}`} />
									</div>
									<ChevronRight
										className={`w-5 h-5 ${card.iconColor} opacity-0 group-hover:opacity-100 transition-opacity mt-1`}
									/>
								</div>
								<h3 className="font-sarabun text-xl font-bold text-gray-800 group-hover:text-[#006837] transition-colors">
									{card.title}
								</h3>
								<p className="font-sarabun text-xs text-gray-400 font-medium mb-2">
									{card.titleEn}
								</p>
								<p className="font-sarabun text-sm text-gray-500 leading-relaxed">
									{card.description}
								</p>
							</div>
						);
					})}
				</div>
			</div>
		</main>
	);
}
