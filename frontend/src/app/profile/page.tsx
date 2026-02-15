'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sarabun } from 'next/font/google';
import { User, Mail, Upload, Download, FileText, Calendar, Trash2, HardDrive } from 'lucide-react';
import { FileUpload } from '@/components/FileUpload';
import {
	getUserFiles,
	downloadFile,
	deleteFile as deleteFileService,
	formatFileSize,
	getFileIcon,
	FileData,
} from '@/services/file.service';

const sarabun = Sarabun({
	weight: ['400', '500', '600', '700'],
	subsets: ['latin', 'thai'],
	variable: '--font-sarabun',
	display: 'swap',
});

export default function ProfilePage() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const [files, setFiles] = useState<FileData[]>([]);
	const [loading, setLoading] = useState(true);
	const [showUpload, setShowUpload] = useState(false);

	// Debug logging
	// useEffect(() => {
	// 	console.log('ProfilePage - status:', status);
	// 	console.log('ProfilePage - session:', session);
	// 	console.log('ProfilePage - session?.user:', session?.user);
	// 	console.log('ProfilePage - session?.user?.id:', session?.user?.id);
	// }, [status, session]);

	useEffect(() => {
		if (status === 'unauthenticated') {
			router.push('/auth/login');
		}
	}, [status, router]);

	const loadUserFiles = useCallback(async () => {
		console.log('loadUserFiles called, session?.user?.id:', session?.user?.id);
		if (!session?.user?.id) {
			console.log('No user ID, returning');
			return;
		}

		try {
			console.log('Fetching files for user:', session.user.id);
			setLoading(true);
			const userFiles = await getUserFiles(session.user.id);
			console.log('Files fetched:', userFiles);
			setFiles(userFiles);
		} catch (error) {
			console.error('Error loading user files:', error);
		} finally {
			setLoading(false);
		}
	}, [session?.user?.id]);

	useEffect(() => {
		console.log('Second useEffect - session?.user?.id:', session?.user?.id);
		if (session?.user?.id) {
			console.log('About to load files');
			loadUserFiles();
		} else {
			console.log('No user ID, NOT loading files');
		}
	}, [session?.user?.id, loadUserFiles]);

	const handleDownload = async (fileId: string, filename: string) => {
		try {
			await downloadFile(fileId, filename);
		} catch (error) {
			console.error('Error downloading file:', error);
			alert('Failed to download file');
		}
	};

	const handleDelete = async (fileId: string) => {
		if (!confirm('Are you sure you want to delete this file?')) {
			return;
		}

		try {
			await deleteFileService(fileId);
			await loadUserFiles();
		} catch (error) {
			console.error('Error deleting file:', error);
			alert('Failed to delete file');
		}
	};

	if (status === 'loading') {
		return (
			<div className="min-h-[calc(100vh-180px)] flex items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006837]"></div>
			</div>
		);
	}

	if (status === 'unauthenticated') {
		return null;
	}

	const totalSize = files.reduce((sum, file) => sum + file.size, 0);
	const totalDownloads = files.reduce((sum, file) => sum + file.downloads, 0);

	return (
		<main className="min-h-[calc(100vh-180px)] p-6 bg-gray-50">
			<div className="max-w-7xl mx-auto space-y-6">
				{/* Header */}
				<div>
					<h1 className={`${sarabun.className} text-3xl font-bold text-[#006837]`}>
						โปรไฟล์ของฉัน
					</h1>
					<p className="text-muted-foreground mt-1">Manage your profile and uploaded files</p>
				</div>

				{/* User Profile Card */}
				<Card className="border-t-4 border-t-[#006837]">
					<CardHeader>
						<CardTitle className="text-xl">User Information</CardTitle>
						<CardDescription>Your account details</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-6">
							<Avatar size="lg" className="w-24 h-24">
								<AvatarImage src={session?.user?.image || undefined} />
								<AvatarFallback className="text-2xl bg-[#006837] text-white">
									{session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || 'U'}
								</AvatarFallback>
							</Avatar>
							<div className="flex-1 space-y-3">
								<div className="flex items-center gap-3">
									<User className="w-5 h-5 text-[#006837]" />
									<div>
										<p className="text-sm text-muted-foreground">Name</p>
										<p className="text-lg font-semibold">{session?.user?.name || 'Not set'}</p>
									</div>
								</div>
								<div className="flex items-center gap-3">
									<Mail className="w-5 h-5 text-[#006837]" />
									<div>
										<p className="text-sm text-muted-foreground">Email</p>
										<p className="text-lg font-semibold">{session?.user?.email}</p>
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Statistics Cards */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<Card className="border-l-4 border-l-blue-500">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
								<FileText className="w-4 h-4" />
								Total Files
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-3xl font-bold text-blue-600">{files.length}</p>
						</CardContent>
					</Card>

					<Card className="border-l-4 border-l-green-500">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
								<Download className="w-4 h-4" />
								Total Downloads
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-3xl font-bold text-green-600">{totalDownloads}</p>
						</CardContent>
					</Card>

					<Card className="border-l-4 border-l-purple-500">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
								<HardDrive className="w-4 h-4" />
								Storage Used
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-3xl font-bold text-purple-600">{formatFileSize(totalSize)}</p>
						</CardContent>
					</Card>

					<Card className="border-l-4 border-l-amber-500">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
								<Calendar className="w-4 h-4" />
								Member Since
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-lg font-bold text-amber-600">
								{session?.user?.email
									? new Date().toLocaleDateString('en-US', {
											month: 'short',
											year: 'numeric',
										})
									: 'N/A'}
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Upload Section */}
				<div className="flex items-center justify-between">
					<h2 className={`${sarabun.className} text-2xl font-bold text-[#006837]`}>ไฟล์ของฉัน</h2>
					<Button
						onClick={() => setShowUpload(!showUpload)}
						className="bg-[#006837] hover:bg-[#005530] gap-2"
					>
						<Upload className="w-4 h-4" />
						{showUpload ? 'Hide Upload' : 'Upload File'}
					</Button>
				</div>

				{showUpload && (
					<FileUpload
						onUploadComplete={() => {
							loadUserFiles();
							setShowUpload(false);
						}}
					/>
				)}

				{/* Files List */}
				<Card>
					<CardHeader>
						<CardTitle>My Uploaded Files</CardTitle>
						<CardDescription>All files you have uploaded to the library</CardDescription>
					</CardHeader>
					<CardContent>
						{loading ? (
							<div className="flex items-center justify-center py-12">
								<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006837]"></div>
							</div>
						) : files.length === 0 ? (
							<div className="text-center py-12">
								<FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
								<p className="text-lg font-semibold text-gray-600">No files uploaded yet</p>
								<p className="text-muted-foreground mt-2">
									Upload your first file to share with the community
								</p>
								<Button
									onClick={() => setShowUpload(true)}
									className="mt-4 bg-[#006837] hover:bg-[#005530] gap-2"
								>
									<Upload className="w-4 h-4" />
									Upload File
								</Button>
							</div>
						) : (
							<div className="space-y-3">
								{files.map((file) => (
									<div
										key={file.id}
										className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
									>
										<div className="flex items-center gap-4 flex-1 min-w-0">
											<div className="text-3xl shrink-0">{getFileIcon(file.mimetype)}</div>
											<div className="flex-1 min-w-0">
												<p className="font-medium text-sm truncate">{file.originalName}</p>
												<div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
													<span>{formatFileSize(file.size)}</span>
													<span>•</span>
													<span>{file.downloads} downloads</span>
													<span>•</span>
													<span>{new Date(file.createdAt).toLocaleDateString()}</span>
												</div>
											</div>
										</div>
										<div className="flex items-center gap-2 shrink-0 ml-4">
											<Button
												onClick={() => handleDownload(file.id, file.originalName)}
												variant="outline"
												size="sm"
												className="gap-2"
											>
												<Download className="w-4 h-4" />
												Download
											</Button>
											<Button
												onClick={() => handleDelete(file.id)}
												variant="outline"
												size="sm"
												className="text-red-600 hover:text-red-700 hover:bg-red-50"
											>
												<Trash2 className="w-4 h-4" />
											</Button>
										</div>
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
