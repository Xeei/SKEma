'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sarabun } from 'next/font/google';
import {
	getFoldersByUser,
	FileFolderData,
	createFolder,
	getAllFolders,
	deleteFolder,
} from '@/services/folder.service';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';
import { CreatePostDialog } from '@/components/CreatePostDialog';

const sarabun = Sarabun({
	weight: ['400', '500', '600', '700'],
	subsets: ['latin', 'thai'],
	variable: '--font-sarabun',
	display: 'swap',
});

export default function PublicFoldersPage() {
	const router = useRouter();
	const { data: session } = useSession();
	const [folders, setFolders] = useState<FileFolderData[]>([]);
	const [loading, setLoading] = useState(true);
	const [creating, setCreating] = useState(false);
	const [newFolderName, setNewFolderName] = useState('');

	useEffect(() => {
		loadFolders();
	}, []);

	const loadFolders = async () => {
		setLoading(true);
		try {
			const data = await getAllFolders();
			setFolders(data);
		} catch (error) {
			console.error('Error loading folders:', error);
		} finally {
			setLoading(false);
		}
	};

	const createFolders = async (name: string, parentId: string) => {
		setCreating(true);
		try {
			await createFolder(name, parentId);
			await loadFolders();
			setNewFolderName('');
		} catch (error) {
			console.error('Error creating folders:', error);
		} finally {
			setCreating(false);
		}
	};

	const handleDeleteFolder = async (folderId: string, e: React.MouseEvent) => {
		e.stopPropagation(); // Prevent navigation when clicking delete
		if (!confirm('Are you sure you want to delete this folder?')) return;
		try {
			await deleteFolder(folderId);
			await loadFolders();
			alert('Folder deleted successfully!');
		} catch (error) {
			console.error('Error deleting folder:', error);
			alert('Failed to delete folder');
		}
	};

	return (
		<main className="min-h-[calc(100vh-180px)] p-6 bg-linear-to-br from-emerald-50 to-amber-50">
			<div className="max-w-7xl mx-auto space-y-6">
				<div className="flex items-center justify-between">
					<h1 className={`${sarabun.className} text-3xl font-bold text-[#006837]`}>
						Public Folders
					</h1>
					<CreatePostDialog onPostCreated={loadFolders} />
				</div>
				{loading ? (
					<div className="flex items-center justify-center py-12">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006837]" />
					</div>
				) : (
					<div>
						{session?.role === 'ADMIN' && (
							<div className="flex items-center gap-2 mb-4 w-[50%]">
								<Input
									type="text"
									placeholder="New folder name"
									className="border rounded px-2 py-1"
									value={newFolderName}
									onChange={(e) => setNewFolderName(e.target.value)}
									disabled={creating}
								/>
								<Button
									className="bg-[#006837] hover:bg-[#005530] gap-2"
									onClick={() => {
										if (newFolderName.trim()) {
											createFolders(newFolderName.trim(), '');
										}
									}}
									disabled={creating || !newFolderName.trim()}
								>
									{creating ? 'Creating...' : 'Create New Folder'}
								</Button>
							</div>
						)}

						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							{folders.map((folder) => (
								<Card
									key={folder.id}
									className="cursor-pointer hover:shadow-lg transition-shadow"
									onClick={() => router.push(`/library/folders/${folder.id}`)}
								>
									<CardHeader>
										<div className="flex items-start justify-between">
											<CardTitle className="text-lg font-semibold text-[#006837] truncate flex-1">
												{folder.name}
											</CardTitle>
											{session?.userId === folder.userId && (
												<Button
													size="sm"
													variant="ghost"
													className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
													onClick={(e) => handleDeleteFolder(folder.id, e)}
												>
													<Trash2 className="w-4 h-4" />
												</Button>
											)}
										</div>
									</CardHeader>
									<CardContent>
										<p className="text-muted-foreground text-xs">
											Created: {new Date(folder.createdAt).toLocaleDateString()}
										</p>
									</CardContent>
								</Card>
							))}
						</div>
					</div>
				)}
			</div>
		</main>
	);
}
