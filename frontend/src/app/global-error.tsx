'use client';

import { useEffect } from 'react';

export default function GlobalError({
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
		<html>
			<body>
				<main
					style={{
						display: 'flex',
						minHeight: '100vh',
						alignItems: 'center',
						justifyContent: 'center',
						fontFamily: 'sans-serif',
						backgroundColor: '#f3f4f6',
					}}
				>
					<div style={{ textAlign: 'center', maxWidth: 400 }}>
						<h1 style={{ color: '#dc2626', fontSize: 24, marginBottom: 16 }}>
							Something went wrong
						</h1>
						<p style={{ color: '#6b7280', marginBottom: 24 }}>
							{error.message || 'An unexpected error occurred.'}
						</p>
						<button
							onClick={reset}
							style={{
								backgroundColor: '#006837',
								color: 'white',
								border: 'none',
								padding: '12px 24px',
								borderRadius: 8,
								cursor: 'pointer',
								fontSize: 16,
							}}
						>
							Try Again
						</button>
					</div>
				</main>
			</body>
		</html>
	);
}
