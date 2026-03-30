'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfileRedirect() {
	const { data: session, status } = useSession();
	const router = useRouter();

	useEffect(() => {
		if (status === 'unauthenticated') {
			router.push('/auth/login');
		} else if (status === 'authenticated' && session?.userId) {
			router.replace(`/profile/${session.userId}`);
		}
	}, [status, session, router]);

	return (
		<main className="min-h-[calc(100vh-180px)]">
			<div className="bg-linear-to-br from-brand via-brand-dark to-brand-darker py-14 px-6">
				<div className="max-w-5xl mx-auto space-y-5">
					<Skeleton className="h-4 w-40 bg-white/20" />
					<div className="flex items-center gap-6">
						<Skeleton className="w-20 h-20 rounded-full bg-white/20 shrink-0" />
						<Skeleton className="h-8 w-48 bg-white/20" />
					</div>
				</div>
			</div>
		</main>
	);
}
