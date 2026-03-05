'use client';

import { useState } from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Flag } from 'lucide-react';
import { reportPost } from '@/services/postreport.service';

interface ReportPostDialogProps {
	postId: string;
	asMenuItem?: boolean;
}

export function ReportPostDialog({ postId, asMenuItem }: ReportPostDialogProps) {
	const [open, setOpen] = useState(false);
	const [reason, setReason] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [done, setDone] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async () => {
		setSubmitting(true);
		setError(null);
		try {
			await reportPost(postId, reason.trim() || null);
			setDone(true);
		} catch (err: unknown) {
			if (
				err &&
				typeof err === 'object' &&
				'response' in err &&
				err.response &&
				typeof err.response === 'object' &&
				'data' in err.response &&
				err.response.data &&
				typeof err.response.data === 'object' &&
				'error' in err.response.data
			) {
				setError((err.response.data as { error: string }).error);
			} else {
				setError('Failed to submit report. Please try again.');
			}
		} finally {
			setSubmitting(false);
		}
	};

	const handleOpenChange = (next: boolean) => {
		setOpen(next);
		if (!next) {
			// Reset state when closing
			setTimeout(() => {
				setReason('');
				setDone(false);
				setError(null);
			}, 200);
		}
	};

	const trigger = asMenuItem ? (
		<span className="flex items-center gap-2 w-full text-red-600">
			<Flag className="w-4 h-4" />
			Report Post
		</span>
	) : (
		<Button variant="outline" size="sm" className="flex items-center gap-2 text-red-600">
			<Flag className="w-4 h-4" />
			Report
		</Button>
	);

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<span
					className="flex items-center gap-2 w-full cursor-pointer"
					onClick={() => setOpen(true)}
				>
					{trigger}
				</span>
			</DialogTrigger>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-red-600">
						<Flag className="w-5 h-5" />
						Report Post
					</DialogTitle>
				</DialogHeader>

				{done ? (
					<div className="py-6 text-center space-y-2">
						<p className="text-lg font-semibold text-green-700">Report submitted</p>
						<p className="text-sm text-muted-foreground">
							Thank you. This post will be reviewed by our admins.
						</p>
						<Button className="mt-4" onClick={() => handleOpenChange(false)}>
							Close
						</Button>
					</div>
				) : (
					<>
						<p className="text-sm text-muted-foreground">
							If this post violates community guidelines, let us know. Once it receives enough
							reports it will be temporarily hidden pending admin review.
						</p>
						<Textarea
							placeholder="Reason (optional) — e.g. spam, misinformation, inappropriate content"
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							maxLength={500}
							rows={4}
						/>
						<p className="text-xs text-muted-foreground text-right">{reason.length}/500</p>
						{error && <p className="text-sm text-red-600">{error}</p>}
						<DialogFooter>
							<Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={submitting}>
								Cancel
							</Button>
							<Button variant="destructive" onClick={handleSubmit} disabled={submitting}>
								{submitting ? 'Submitting...' : 'Submit Report'}
							</Button>
						</DialogFooter>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
