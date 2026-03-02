'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { Sarabun } from 'next/font/google';
import { Clock, ChevronRight, ShieldCheck, FolderOpen, LayoutDashboard } from 'lucide-react';

const sarabun = Sarabun({
	weight: ['400', '500', '600', '700'],
	subsets: ['latin', 'thai'],
	variable: '--font-sarabun',
	display: 'swap',
});

const ADMIN_CARDS = [
	{
		key: 'pending',
		href: '/admin/pending',
		icon: Clock,
		iconBg: 'bg-amber-100',
		iconColor: 'text-amber-700',
		border: 'border-amber-200',
		bg: 'bg-amber-50 hover:bg-amber-100',
		title: 'โพสต์รออนุมัติ',
		titleEn: 'Pending Posts',
		description: 'ตรวจสอบและอนุมัติโพสต์ที่ส่งมาจากผู้ใช้ทั่วไปก่อนเผยแพร่สู่สาธารณะ',
	},
	{
		key: 'main folders',
		href: '/library/folders',
		icon: FolderOpen,
		iconBg: 'bg-emerald-100',
		iconColor: 'text-emerald-700',
		border: 'border-emerald-200',
		bg: 'bg-emerald-50 hover:bg-emerald-100',
		title: 'จัดการโฟลเดอร์',
		titleEn: 'Manage Folders',
		description: 'ดูและจัดการโฟลเดอร์หลักทั้งหมดในระบบคลังเอกสาร',
	},
	{
		key: 'website summary',
		href: '/library',
		icon: LayoutDashboard,
		iconBg: 'bg-blue-100',
		iconColor: 'text-blue-700',
		border: 'border-blue-200',
		bg: 'bg-blue-50 hover:bg-blue-100',
		title: 'ภาพรวมเว็บไซต์',
		titleEn: 'Website Summary',
		description: 'ดูภาพรวมของคลังเอกสาร โพสต์ และไฟล์ทั้งหมดในระบบ',
	},
];

export default function AdminPage() {
	const router = useRouter();
	const { data: session, status } = useSession();

	useEffect(() => {
		if (status === 'loading') return;
		if (!session || session.role !== 'ADMIN') {
			router.replace('/');
		}
	}, [session, status, router]);

	if (status === 'loading' || !session || session.role !== 'ADMIN') {
		return null;
	}

	return (
		<main className={`${sarabun.variable} min-h-[calc(100vh-180px)]`}>
			{/* Hero Section */}
			<div className="bg-linear-to-br from-[#006837] via-[#005028] to-[#003d1f] text-white py-14 px-6">
				<div className="max-w-5xl mx-auto text-center">
					<span className="inline-block bg-white/10 border border-white/20 text-white text-sm font-medium px-4 py-1.5 rounded-full mb-5 font-sarabun">
						สำหรับผู้ดูแลระบบเท่านั้น
					</span>
					<div className="flex items-center justify-center gap-3 mb-3">
						<ShieldCheck className="w-10 h-10 text-[#FDB913]" />
						<h1 className="font-sarabun text-5xl font-bold tracking-tight">
							Admin <span className="text-[#FDB913]">Panel</span>
						</h1>
					</div>
					<p className="font-sarabun text-white/80 text-lg max-w-xl mx-auto">
						แผงควบคุมสำหรับผู้ดูแลระบบ — จัดการและตรวจสอบเนื้อหาบนแพลตฟอร์ม
					</p>
				</div>
			</div>

			{/* Admin Cards */}
			<div className="max-w-5xl mx-auto px-6 py-14">
				<h2 className="font-sarabun text-sm font-semibold text-gray-500 mb-6 text-center tracking-wide uppercase">
					เครื่องมือผู้ดูแล
				</h2>
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-6xl mx-auto">
					{ADMIN_CARDS.map((card) => {
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
