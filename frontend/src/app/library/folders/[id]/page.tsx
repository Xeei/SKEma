'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sarabun } from 'next/font/google';
import {
	getFolderById,
	FileFolderData,
	createFolder,
	getFoldersByParent,
	deleteFolder,
} from '@/services/folder.service';
import { getAllFiles, FileData, uploadFile, downloadFile } from '@/services/file.service';
import { Download, Trash2 } from 'lucide-react';

const sarabun = Sarabun({
	weight: ['400', '500', '600', '700'],
	subsets: ['latin', 'thai'],
	variable: '--font-sarabun',
	display: 'swap',
});

export default function FolderDetailPage() {
	const router = useRouter();
	const params = useParams();
	const { data: session } = useSession();
	const folderId = params?.id as string;
	const [folder, setFolder] = useState<FileFolderData | null>(null);
	const [subfolders, setSubfolders] = useState<FileFolderData[]>([]);
	const [files, setFiles] = useState<FileData[]>([]);
	const [loading, setLoading] = useState(true);
	const [creating, setCreating] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [newFolderName, setNewFolderName] = useState('');
	const [selectedFile, setSelectedFile] = useState<File | null>(null);

	useEffect(() => {
		if (folderId) {
			loadFolder();
			loadSubfolders();
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

	const loadSubfolders = async () => {
		try {
			const data = await getFoldersByParent(folderId);
			setSubfolders(data);
		} catch (error) {
			setSubfolders([]);
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

	const handleCreateSubfolder = async () => {
		if (!newFolderName.trim()) return;
		setCreating(true);
		try {
			await createFolder(newFolderName.trim(), folderId);
			setNewFolderName('');
			await loadSubfolders();
			alert('Subfolder created successfully!');
		} catch (error) {
			console.error('Error creating subfolder:', error);
			alert('Failed to create subfolder');
		} finally {
			setCreating(false);
		}
	};

	const handleFileUpload = async () => {
		if (!selectedFile) return;
		setUploading(true);
		try {
			await uploadFile(selectedFile, undefined, folderId, 'PUBLIC');
			setSelectedFile(null);
			await loadFiles();
			alert('File uploaded successfully!');
		} catch (error) {
			console.error('Error uploading file:', error);
			alert('Failed to upload file');
		} finally {
			setUploading(false);
		}
	};

	const handleDownload = async (id: string, filename: string) => {
		try {
			await downloadFile(id, filename);
		} catch (error) {
			console.error('Error downloading file:', error);
		}
	};

	const handleDeleteSubfolder = async (subfolderId: string, e: React.MouseEvent) => {
		e.stopPropagation(); // Prevent navigation when clicking delete
		if (!confirm('Are you sure you want to delete this subfolder?')) return;
		try {
			await deleteFolder(subfolderId);
			await loadSubfolders();
			alert('Subfolder deleted successfully!');
		} catch (error) {
			console.error('Error deleting subfolder:', error);
			alert('Failed to delete subfolder');
		}
	};

	if (!folder) {
		return (
			<main className="min-h-[calc(100vh-180px)] p-6 bg-linear-to-br from-emerald-50 to-amber-50">
				<div className="max-w-7xl mx-auto">
					<h1 className={`${sarabun.className} text-3xl font-bold text-[#006837]`}>
						Folder Not Found
					</h1>
				</div>
			</main>
		);
	}

	return (
		<main className="min-h-[calc(100vh-180px)] p-6 bg-linear-to-br from-emerald-50 to-amber-50">
			<div className="max-w-7xl mx-auto space-y-6">
				<h1 className={`${sarabun.className} text-3xl font-bold text-[#006837]`}>{folder.name}</h1>

				{session?.role === 'ADMIN' && (
					<div>
						{' '}
						{/* Create Subfolder Section */}
						<Card>
							<CardHeader>
								<CardTitle>Create Subfolder</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex items-center gap-2">
									<input
										type="text"
										placeholder="Subfolder name"
										className="border rounded px-3 py-2 flex-1"
										value={newFolderName}
										onChange={(e) => setNewFolderName(e.target.value)}
										disabled={creating}
									/>
									<Button
										className="bg-[#006837] hover:bg-[#005530]"
										onClick={handleCreateSubfolder}
										disabled={creating || !newFolderName.trim()}
									>
										{creating ? 'Creating...' : 'Create Subfolder'}
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				)}

				{/* Subfolders Section */}
				<Card>
					<CardHeader>
						<CardTitle>Subfolders</CardTitle>
						<CardDescription>Folders within this folder</CardDescription>
					</CardHeader>
					<CardContent>
						{loading ? (
							<div className="flex items-center justify-center py-12">
								<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006837]"></div>
							</div>
						) : subfolders.length === 0 ? (
							<div className="text-center py-12 text-muted-foreground">No subfolders yet.</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								{subfolders.map((subfolder) => (
									<Card
										key={subfolder.id}
										className="cursor-pointer hover:shadow-lg transition-shadow p-4 relative"
										onClick={() => router.push(`/library/folders/${subfolder.id}`)}
									>
										<div className="flex items-start justify-between">
											<CardTitle className="text-base font-semibold text-[#006837] truncate flex-1">
												📁 {subfolder.name}
											</CardTitle>
											{session?.userId === subfolder.userId && (
												<Button
													size="sm"
													variant="ghost"
													className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
													onClick={(e) => handleDeleteSubfolder(subfolder.id, e)}
												>
													<Trash2 className="w-4 h-4" />
												</Button>
											)}
										</div>
										<p className="text-xs text-muted-foreground mt-2">
											Created: {new Date(subfolder.createdAt).toLocaleDateString()}
										</p>
									</Card>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Upload File Section */}
				<Card>
					<CardHeader>
						<CardTitle>Upload File to this Folder</CardTitle>
						<CardDescription>Files will be set to PUBLIC by default</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-2">
							<input
								type="file"
								className="border rounded px-3 py-2 flex-1"
								onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
								disabled={uploading}
							/>
							<Button
								className="bg-[#006837] hover:bg-[#005530]"
								onClick={handleFileUpload}
								disabled={uploading || !selectedFile}
							>
								{uploading ? 'Uploading...' : 'Upload File'}
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* Public Files Section */}
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
									<div
										key={file.id}
										className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
									>
										<div className="flex-1">
											<p className="font-medium text-base">{file.originalName}</p>
											<p className="text-xs text-muted-foreground mt-1">
												Uploaded: {new Date(file.createdAt).toLocaleDateString()} • Size:{' '}
												{file.size} bytes
												{file.downloads > 0 && ` • ${file.downloads} downloads`}
											</p>
										</div>
										<Button
											size="sm"
											variant="outline"
											className="gap-2 bg-[#006837] text-white hover:bg-[#005530] hover:text-white"
											onClick={() => handleDownload(file.id, file.originalName)}
										>
											<Download className="w-4 h-4" />
											Download
										</Button>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</main>
	);
}
