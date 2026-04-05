'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<main className="flex min-h-[calc(100vh-180px)] items-center justify-center px-6 py-12">
			<div className="w-full max-w-md">
				<Card className="border-t-4 border-t-red-500">
					<CardHeader className="space-y-4 text-center">
						<div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto">
							<svg
								className="w-10 h-10 text-white"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						</div>
						<CardTitle className="text-2xl text-red-600">Something went wrong</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="p-4 bg-red-50 border border-red-200 rounded-lg">
							<p className="text-sm text-red-800 text-center">
								{error.message || 'An unexpected error occurred. Please try again.'}
							</p>
						</div>
						<Button
							onClick={reset}
							size="lg"
							className="w-full bg-[#006837] hover:bg-[#005530]"
						>
							Try Again
						</Button>
						<Button
							variant="outline"
							size="lg"
							className="w-full"
							onClick={() => (window.location.href = '/')}
						>
							Go Home
						</Button>
					</CardContent>
				</Card>
			</div>
		</main>
	);
}
