'use client';

import { Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sarabun } from 'next/font/google';

const sarabun = Sarabun({
	weight: ['400', '500', '600', '700'],
	subsets: ['latin', 'thai'],
	variable: '--font-sarabun',
	display: 'swap',
});

function SignInContent() {
	const searchParams = useSearchParams();
	const callbackUrl = searchParams.get('callbackUrl') ?? '/';

	const handleGoogleSignIn = async () => {
		await signIn('google', { callbackUrl });
	};

	return (
		<main className="flex min-h-[calc(100vh-180px)] items-center justify-center px-6 py-12 bg-gray-50">
			<div className="w-full max-w-sm space-y-6">
				{/* Brand header */}
				<div className="text-center space-y-3">
					<div className="w-20 h-20 bg-brand rounded-2xl flex items-center justify-center mx-auto shadow-lg">
						<span className="text-white font-bold text-3xl font-sarabun">SKE</span>
					</div>
					<h1 className={`${sarabun.className} text-4xl font-bold text-gray-900`}>
						SKE <span className="text-brand">Schema</span>
					</h1>
					<p className={`${sarabun.className} text-gray-500 text-sm leading-relaxed`}>
						แหล่งรวมเอกสาร โจทย์การบ้าน และแหล่งเรียนรู้
						<br />
						สำหรับนักศึกษาวิศวกรรมซอฟต์แวร์และความรู้
					</p>
				</div>

				{/* Auth card */}
				<Card className="shadow-lg border-0">
					<CardContent className="pt-6 pb-6 space-y-4">
						<Button
							onClick={handleGoogleSignIn}
							variant="outline"
							size="lg"
							className="w-full text-base font-semibold shadow-sm hover:shadow-md transition-shadow h-12"
						>
							<svg className="w-5 h-5" viewBox="0 0 24 24">
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
							Sign in with Google
						</Button>
						<p className={`${sarabun.className} text-center text-xs text-muted-foreground`}>
							เฉพาะอีเมล{' '}
							<span className="font-semibold text-brand">@ku.th</span>{' '}
							เท่านั้น
						</p>
					</CardContent>
				</Card>
			</div>
		</main>
	);
}

export default function SignInPage() {
	return (
		<Suspense>
			<SignInContent />
		</Suspense>
	);
}
