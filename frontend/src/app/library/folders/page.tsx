'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sarabun } from 'next/font/google';
import { getFoldersByUser, FileFolderData } from '@/services/folder.service';

const sarabun = Sarabun({
	weight: ['400', '500', '600', '700'],
	subsets: ['latin', 'thai'],
	variable: '--font-sarabun',
	display: 'swap',
});

export default function PublicFoldersPage() {
	const router = useRouter();
	const [folders, setFolders] = useState<FileFolderData[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadFolders();
	}, []);

	const loadFolders = async () => {
		setLoading(true);
		try {
			// TODO: Replace with getPublicFolders when implemented
			const data = await getFoldersByUser();
			setFolders(data);
		} catch (error) {
			console.error('Error loading folders:', error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<main className="min-h-[calc(100vh-180px)] p-6 bg-gray-50">
			<div className="max-w-7xl mx-auto space-y-6">
				<h1 className={`${sarabun.className} text-3xl font-bold text-[#006837]`}>Public Folders</h1>
				{loading ? (
					<div className="flex items-center justify-center py-12">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006837]"></div>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						{folders.map((folder) => (
							<Card
								key={folder.id}
								className="cursor-pointer hover:shadow-lg transition-shadow"
								onClick={() => router.push(`/library/folders/${folder.id}`)}
							>
								<CardHeader>
									<CardTitle className="text-lg font-semibold text-[#006837] truncate">
										{folder.name}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-muted-foreground text-xs">
										Created: {new Date(folder.createdAt).toLocaleDateString()}
									</p>
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</div>
		</main>
	);
}
