'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sarabun } from 'next/font/google';
import { getFolderById, FileFolderData } from '@/services/folder.service';
import { getAllFiles, FileData } from '@/services/file.service';

const sarabun = Sarabun({
	weight: ['400', '500', '600', '700'],
	subsets: ['latin', 'thai'],
	variable: '--font-sarabun',
	display: 'swap',
});

export default function FolderDetailPage() {
	const router = useRouter();
	const params = useParams();
	const folderId = params?.id as string;
	const [folder, setFolder] = useState<FileFolderData | null>(null);
	const [files, setFiles] = useState<FileData[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (folderId) {
			loadFolder();
			loadFiles();
		}
		// eslint-disable-next-line
	}, [folderId]);

	const loadFolder = async () => {
		try {
			const data = await getFolderById(folderId);
			setFolder(data);
		} catch (error) {
			setFolder(null);
		}
	};

	const loadFiles = async () => {
		setLoading(true);
		try {
			// TODO: Replace with getPublicFilesInFolder(folderId) when implemented
			const allFiles = await getAllFiles();
			const publicFiles = allFiles.filter(
				(file) => file.folderId === folderId && file.privacy === 'PUBLIC'
			);
			setFiles(publicFiles);
		} catch (error) {
			setFiles([]);
		} finally {
			setLoading(false);
		}
	};

	if (!folder) {
		return (
			<main className="min-h-[calc(100vh-180px)] p-6 bg-gray-50">
				<div className="max-w-7xl mx-auto">
					<h1 className={`${sarabun.className} text-3xl font-bold text-[#006837]`}>
						Folder Not Found
					</h1>
				</div>
			</main>
		);
	}

	return (
		<main className="min-h-[calc(100vh-180px)] p-6 bg-gray-50">
			<div className="max-w-7xl mx-auto space-y-6">
				<h1 className={`${sarabun.className} text-3xl font-bold text-[#006837]`}>{folder.name}</h1>
				<Card>
					<CardHeader>
						<CardTitle>Public Files in this Folder</CardTitle>
						<CardDescription>Only files with privacy set to PUBLIC are shown.</CardDescription>
					</CardHeader>
					<CardContent>
						{loading ? (
							<div className="flex items-center justify-center py-12">
								<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006837]"></div>
							</div>
						) : files.length === 0 ? (
							<div className="text-center py-12 text-muted-foreground">
								No public files in this folder.
							</div>
						) : (
							<div className="space-y-3">
								{files.map((file) => (
									<Card key={file.id} className="border p-4">
										<CardTitle className="text-base font-semibold truncate">
											{file.originalName}
										</CardTitle>
										<CardContent className="text-xs text-muted-foreground">
											Uploaded: {new Date(file.createdAt).toLocaleDateString()}
											<br />
											Size: {file.size} bytes
										</CardContent>
									</Card>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</main>
	);
}
