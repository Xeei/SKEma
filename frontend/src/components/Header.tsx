'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/context/NotificationContext';
import { NotificationPanel } from '@/components/NotificationPanel';

export function Header() {
	const { data: session, status } = useSession();
	const { unreadCount, notifications } = useNotifications();
	const [panelOpen, setPanelOpen] = useState(false);

	const isPrivileged = session?.role === 'ADMIN' || session?.role === 'TRUSTED';

	// Count of unread "new pending post" notifications — used on the admin quick-link bell
	const pendingUnread = useMemo(
		() => notifications.filter((n) => n.type === 'NEW_POST_PENDING' && !n.isRead).length,
		[notifications]
	);

	return (
		<header className="bg-[#006837] text-white py-4 px-6 shadow-lg">
			<div className="max-w-7xl mx-auto flex items-center justify-between">
				<Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
					<div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
						<span className="text-[#006837] font-bold text-xl">SKE</span>
					</div>
					<div>
						<h1 className="font-semibold text-lg">SKE Schema</h1>
						<p className="text-sm text-emerald-100">Software and Knowledge Engineering</p>
					</div>
				</Link>

				{status === 'loading' ? (
					<div className="w-10 h-10 rounded-full bg-white/20 animate-pulse" />
				) : status === 'authenticated' && session?.user ? (
					<div className="flex items-center gap-3">
						{/* Admin quick-link bell — shows pending count badge
						{isPrivileged && (
							<Link
								href="/admin/pending"
								className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors"
								title="Pending Approvals"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-5 w-5 text-white"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
									<path d="M13.73 21a2 2 0 0 1-3.46 0" />
								</svg>
								{pendingUnread > 0 && (
									<span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-[#006837]">
										{pendingUnread > 99 ? '99+' : pendingUnread}
									</span>
								)}
							</Link>
						)} */}

						{/* General notification bell — opens slide-in panel */}
						<div className="relative">
							<button
								onClick={() => setPanelOpen((o) => !o)}
								className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors"
								title="การแจ้งเตือน"
							>
								<Bell className="h-5 w-5 text-white" />
								{unreadCount > 0 && (
									<span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-[#006837]">
										{unreadCount > 99 ? '99+' : unreadCount}
									</span>
								)}
							</button>
							<NotificationPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
						</div>

						{/* Avatar dropdown */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="secondary" className="relative h-10 w-10 rounded-full">
									<Avatar>
										<AvatarImage src={session.user.image || undefined} />
										<AvatarFallback>
											{session.user.name?.charAt(0) || session.user.email?.charAt(0) || 'U'}
										</AvatarFallback>
									</Avatar>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-56 mt-8">
								<DropdownMenuLabel>
									<div className="flex flex-col space-y-1">
										<p className="text-sm font-medium leading-none">{session.user.name}</p>
										<p className="text-xs leading-none text-muted-foreground">
											{session.user.email}
										</p>
									</div>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem asChild>
									<Link href="/profile">Profile</Link>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })}>
									Sign out
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				) : (
					<Link href="/auth/login">
						<Button variant="secondary" size="sm" className="gap-2">
							<svg className="w-4 h-4" viewBox="0 0 24 24">
								<path
									fill="#4285F4"
									d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
								/>
								<path
									fill="#34A853"
									d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								/>
								<path
									fill="#FBBC05"
									d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
								/>
								<path
									fill="#EA4335"
									d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
								/>
							</svg>
							Sign In
						</Button>
					</Link>
				)}
			</div>
		</header>
	);
}
