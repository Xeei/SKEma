'use client';

import { useRef, useEffect } from 'react';
import { BellRing, CheckCheck, Loader2, ExternalLink } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { NotificationType } from '@/services/notification.service';
import Link from 'next/link';

const TYPE_CONFIG: Record<NotificationType, { label: string; color: string; dot: string }> = {
	POST_APPROVED: {
		label: 'โพสต์ได้รับการอนุมัติ',
		color: 'text-emerald-700 bg-emerald-50',
		dot: 'bg-emerald-500',
	},
	POST_REJECTED: {
		label: 'โพสต์ถูกปฏิเสธ',
		color: 'text-red-700 bg-red-50',
		dot: 'bg-red-500',
	},
	NEW_POST_PENDING: {
		label: 'โพสต์ใหม่รอการอนุมัติ',
		color: 'text-amber-700 bg-amber-50',
		dot: 'bg-amber-500',
	},
};

function formatRelative(dateStr: string): string {
	const diff = Date.now() - new Date(dateStr).getTime();
	const m = Math.floor(diff / 60_000);
	if (m < 1) return 'เมื่อกี้';
	if (m < 60) return `${m} นาทีที่แล้ว`;
	const h = Math.floor(m / 60);
	if (h < 24) return `${h} ชั่วโมงที่แล้ว`;
	const d = Math.floor(h / 24);
	return `${d} วันที่แล้ว`;
}

interface Props {
	open: boolean;
	onClose: () => void;
}

export function NotificationPanel({ open, onClose }: Props) {
	const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications();
	const panelRef = useRef<HTMLDivElement>(null);

	// Close on outside click
	useEffect(() => {
		if (!open) return;
		const handler = (e: MouseEvent) => {
			if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
				onClose();
			}
		};
		document.addEventListener('mousedown', handler);
		return () => document.removeEventListener('mousedown', handler);
	}, [open, onClose]);

	if (!open) return null;

	return (
		<div
			ref={panelRef}
			className="absolute right-0 top-full mt-10 w-80 sm:w-96 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
		>
			{/* Panel header */}
			<div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
				<div className="flex items-center gap-2">
					<BellRing className="w-4 h-4 text-[#006837]" />
					<span className="text-sm font-semibold text-gray-800">การแจ้งเตือน</span>
					{unreadCount > 0 && (
						<span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
							{unreadCount > 99 ? '99+' : unreadCount}
						</span>
					)}
				</div>
				{unreadCount > 0 && (
					<button
						onClick={markAllRead}
						className="flex items-center gap-1 text-xs text-[#006837] hover:underline font-medium"
					>
						<CheckCheck className="w-3.5 h-3.5" />
						อ่านทั้งหมด
					</button>
				)}
			</div>

			{/* List */}
			<div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
				{loading ? (
					<div className="flex justify-center py-8">
						<Loader2 className="w-5 h-5 animate-spin text-gray-400" />
					</div>
				) : notifications.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-10 text-center">
						<BellRing className="w-8 h-8 text-gray-200 mb-2" />
						<p className="text-sm text-gray-400">ยังไม่มีการแจ้งเตือน</p>
					</div>
				) : (
					notifications.map((n) => {
						const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.NEW_POST_PENDING;
						return (
							<div
								key={n.id}
								className={`px-4 py-3 flex gap-3 items-start cursor-pointer transition-colors ${
									n.isRead ? 'bg-white' : 'bg-emerald-50/40'
								} hover:bg-gray-50`}
								onClick={() => {
									if (!n.isRead) markRead(n.id);
								}}
							>
								<span
									className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
										n.isRead ? 'bg-gray-200' : cfg.dot
									}`}
								/>
								<div className="flex-1 min-w-0">
									<span
										className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full mb-1 ${cfg.color}`}
									>
										{cfg.label}
									</span>
									<p className="text-sm text-gray-700 leading-snug">{n.message}</p>
									<p className="text-xs text-gray-400 mt-1">{formatRelative(n.createdAt)}</p>
								</div>
								{n.postId && (
									<Link
										href={
											n.type === 'NEW_POST_PENDING' ? '/admin/pending' : `/library/post/${n.postId}`
										}
										onClick={(e) => {
											e.stopPropagation();
											if (!n.isRead) markRead(n.id);
											onClose();
										}}
										className="text-gray-400 hover:text-[#006837] transition-colors shrink-0"
										title="ไปที่โพสต์"
									>
										<ExternalLink className="w-3.5 h-3.5" />
									</Link>
								)}
							</div>
						);
					})
				)}
			</div>
		</div>
	);
}
