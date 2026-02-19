'use client';

import { useState, useEffect } from 'react';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Edit } from 'lucide-react';
import { updateFolder, FileFolderData } from '@/services/folder.service';

interface EditFolderDialogProps {
	folder: FileFolderData;
	onFolderUpdated?: () => void;
}

export function EditFolderDialog({ folder, onFolderUpdated }: EditFolderDialogProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [folderName, setFolderName] = useState(folder.name);
	const [folderDescription, setFolderDescription] = useState(folder.description || '');

	// Update form when folder prop changes
	useEffect(() => {
		setFolderName(folder.name);
		setFolderDescription(folder.description || '');
	}, [folder]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!folderName.trim()) {
			alert('Folder name is required');
			return;
		}

		setLoading(true);
		try {
			await updateFolder(folder.id, folderName.trim(), folderDescription.trim() || undefined);

			setOpen(false);
			alert('Folder updated successfully!');
			onFolderUpdated?.();
		} catch (error) {
			console.error('Error updating folder:', error);
			alert('Failed to update folder');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm" className="gap-2">
					<Edit className="w-4 h-4" />
					Edit Folder
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Edit Folder</DialogTitle>
					<DialogDescription>Update folder name and description</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label className="text-sm font-medium">
							Folder Name <span className="text-red-500">*</span>
						</label>
						<Input
							type="text"
							placeholder="Enter folder name"
							value={folderName}
							onChange={(e) => setFolderName(e.target.value)}
							disabled={loading}
							required
						/>
					</div>

					<div>
						<label className="text-sm font-medium">Description</label>
						<Textarea
							placeholder="Enter folder description (optional)"
							value={folderDescription}
							onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
								setFolderDescription(e.target.value)
							}
							disabled={loading}
							rows={4}
						/>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
							disabled={loading}
						>
							Cancel
						</Button>
						<Button type="submit" className="bg-[#006837] hover:bg-[#005530]" disabled={loading}>
							{loading ? 'Updating...' : 'Update Folder'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
