'use client';

import {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
	useRef,
	ReactNode,
} from 'react';
import { useSession } from 'next-auth/react';
import { io, Socket } from 'socket.io-client';
import {
	NotificationData,
	fetchNotifications,
	markNotificationRead,
	markAllNotificationsRead,
} from '@/services/notification.service';

interface NotificationContextValue {
	notifications: NotificationData[];
	unreadCount: number;
	loading: boolean;
	markRead: (id: string) => Promise<void>;
	markAllRead: () => Promise<void>;
	refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotifications(): NotificationContextValue {
	const ctx = useContext(NotificationContext);
	if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
	return ctx;
}

interface Props {
	children: ReactNode;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_HOST || 'http://localhost:3001';

export function NotificationProvider({ children }: Props) {
	const { data: session, status } = useSession();
	const [notifications, setNotifications] = useState<NotificationData[]>([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [loading, setLoading] = useState(false);
	const socketRef = useRef<Socket | null>(null);

	const refresh = useCallback(async () => {
		if (status !== 'authenticated') return;
		setLoading(true);
		try {
			const result = await fetchNotifications(20, 0);
			setNotifications(result.data);
			setUnreadCount(result.unread);
		} catch (err) {
			console.error('Failed to fetch notifications:', err);
		} finally {
			setLoading(false);
		}
	}, [status]);

	// Initial load
	useEffect(() => {
		if (status === 'authenticated') {
			refresh();
		}
	}, [status, refresh]);

	// Socket connection
	useEffect(() => {
		if (status !== 'authenticated' || !session?.backendToken) return;

		const socket = io(BACKEND_URL, {
			auth: { token: session.backendToken },
		});

		socketRef.current = socket;

		socket.on('notification', (incoming: Omit<NotificationData, 'id' | 'userId' | 'isRead'>) => {
			// Optimistically prepend to list; full fetch not needed
			const newNotif: NotificationData = {
				id: `temp-${Date.now()}`,
				userId: session.userId ?? '',
				isRead: false,
				...incoming,
			};
			setNotifications((prev) => [newNotif, ...prev]);
			setUnreadCount((c) => c + 1);
		});

		socket.on('connect_error', (err) => {
			console.warn('Socket connect error:', err.message);
		});

		return () => {
			socket.disconnect();
			socketRef.current = null;
		};
	}, [status, session?.backendToken, session?.userId]);

	const markRead = useCallback(async (id: string) => {
		// Optimistic update
		setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
		setUnreadCount((c) => Math.max(0, c - 1));
		try {
			await markNotificationRead(id);
		} catch {
			// revert on error
			setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)));
			setUnreadCount((c) => c + 1);
		}
	}, []);

	const markAllRead = useCallback(async () => {
		setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
		setUnreadCount(0);
		try {
			await markAllNotificationsRead();
		} catch (err) {
			console.error('Failed to mark all read:', err);
			refresh();
		}
	}, [refresh]);

	return (
		<NotificationContext.Provider
			value={{ notifications, unreadCount, loading, markRead, markAllRead, refresh }}
		>
			{children}
		</NotificationContext.Provider>
	);
}
