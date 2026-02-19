'use client';

import type { Metadata } from 'next';
import { Inter, Sarabun } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { SessionProvider } from 'next-auth/react';
import { Header } from '@/components/Header';

const inter = Inter({
	variable: '--font-inter',
	subsets: ['latin'],
	display: 'swap',
});

const sarabun = Sarabun({
	weight: ['400', '500', '600', '700'],
	subsets: ['latin', 'thai'],
	variable: '--font-sarabun',
	display: 'swap',
});

// export const metadata: Metadata = {
// 	title: 'SKE Schema - แหล่งแบ่งปันความรู้และไฟล์เรียน',
// 	description: 'Knowledge Sharing Platform for SKE Students - Kasetsart University',
// };

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="th">
			<body
				className={`${inter.variable} ${sarabun.variable} antialiased min-h-screen flex flex-col`}
			>
				<SessionProvider>
					<Providers>
						<Header />

						<div className="flex-1 bg-linear-to-br from-emerald-50 to-amber-50">{children}</div>

						<footer className="bg-[#006837] text-white py-6">
							<div className={`max-w-6xl mx-auto px-6 text-center ${sarabun.variable}`}>
								{/* <p className="font-sarabun">คณะวิศวกรรมศาสตร์ มหาวิทยาลัยเกษตรศาสตร์</p>
								<p className="text-emerald-200 text-sm mt-1">
									Faculty of Engineering, Kasetsart University
								</p> */}
								<div className="mt-4 flex flex-col items-center gap-2">
									<a
										href="https://github.com/MunyinSam/SKE-Schema"
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-2 text-emerald-200 hover:text-white transition-colors text-sm"
									>
										<svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
											<path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.51 11.51 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .322.216.694.825.576C20.565 21.796 24 17.298 24 12c0-6.63-5.37-12-12-12z" />
										</svg>
										Open Source — รายงานปัญหาหรือข้อเสนอแนะได้ที่ GitHub
									</a>
									<p className="text-emerald-300 text-xs opacity-75">
										This project is open source. Feel free to report issues or contribute.
									</p>
								</div>
							</div>
						</footer>
					</Providers>
				</SessionProvider>
			</body>
		</html>
	);
}
