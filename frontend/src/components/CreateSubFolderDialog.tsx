'use client';

import { useState } from 'react';
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
import { Plus } from 'lucide-react';
import { createFolder } from '@/services/folder.service';

interface CreateSubFolderDialogProps {
	parentFolderId: string;
	onFolderCreated?: () => void;
}

export function CreateSubFolderDialog({
	parentFolderId,
	onFolderCreated,
}: CreateSubFolderDialogProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [folderName, setFolderName] = useState('');

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!folderName.trim()) {
			alert('Folder name is required');
			return;
		}

		setLoading(true);
		try {
			await createFolder(folderName.trim(), parentFolderId);

			// Reset form
			setFolderName('');
			setOpen(false);

			alert('Subfolder created successfully!');
			onFolderCreated?.();
		} catch (error) {
			console.error('Error creating subfolder:', error);
			alert('Failed to create subfolder');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button className="bg-[#006837] hover:bg-[#005530] gap-2">
					<Plus className="w-4 h-4" />
					Create Subfolder
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Create New Subfolder</DialogTitle>
					<DialogDescription>Create a subfolder within the current folder</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label className="text-sm font-medium">
							Folder Name <span className="text-red-500">*</span>
						</label>
						<Input
							type="text"
							placeholder="Enter subfolder name"
							value={folderName}
							onChange={(e) => setFolderName(e.target.value)}
							disabled={loading}
							required
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
							{loading ? 'Creating...' : 'Create Subfolder'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
