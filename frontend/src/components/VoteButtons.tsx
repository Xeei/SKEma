'use client';

import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { votePost, getMyVote, VoteType } from '@/services/post.service';
import { toast } from 'sonner';

interface VoteButtonsProps {
	postId: string;
	initialUpvotes: number;
	initialDownvotes: number;
	/** Pass false to disable buttons (e.g. while session is loading) */
	enabled?: boolean;
}

export function VoteButtons({
	postId,
	initialUpvotes,
	initialDownvotes,
	enabled = true,
}: VoteButtonsProps) {
	const [upvotes, setUpvotes] = useState(initialUpvotes);
	const [downvotes, setDownvotes] = useState(initialDownvotes);
	const [myVote, setMyVote] = useState<VoteType | null>(null);
	const [loading, setLoading] = useState(false);

	// Load the user's existing vote once
	useEffect(() => {
		if (!enabled) return;
		getMyVote(postId)
			.then(setMyVote)
			.catch(() => {
				/* not signed-in or error – silently ignore */
			});
	}, [postId, enabled]);

	const handleVote = async (type: VoteType) => {
		if (!enabled || loading) return;
		setLoading(true);
		try {
			const result = await votePost(postId, type);
			setUpvotes(result.upvotes);
			setDownvotes(result.downvotes);
			setMyVote(result.voteType);
			if (type === 'UPVOTE') {
				toast.success(result.voteType === 'UPVOTE' ? 'อัปโหวตแล้ว!' : 'ยกเลิกอัปโหวต');
			} else {
				toast.success(result.voteType === 'DOWNVOTE' ? 'ดาวน์โหวตแล้ว!' : 'ยกเลิกดาวน์โหวต');
			}
		} catch (err) {
			console.error('Vote error:', err);
			toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex items-center gap-3">
			{/* Upvote */}
			<Button
				variant="outline"
				size="sm"
				onClick={() => handleVote('UPVOTE')}
				disabled={!enabled || loading}
				className={`flex items-center gap-1.5 transition-colors ${
					myVote === 'UPVOTE' ? 'text-brand' : 'hover:text-brand'
				}`}
				aria-label="Upvote"
				aria-pressed={myVote === 'UPVOTE'}
			>
				<ThumbsUp className="w-4 h-4" />
				<span className="font-semibold">{upvotes}</span>
			</Button>

			{/* Downvote */}
			<Button
				variant="outline"
				size="sm"
				onClick={() => handleVote('DOWNVOTE')}
				disabled={!enabled || loading}
				className={`flex items-center gap-1.5 transition-colors ${
					myVote === 'DOWNVOTE' ? 'text-red-500' : 'hover:text-red-500'
				}`}
				aria-label="Downvote"
				aria-pressed={myVote === 'DOWNVOTE'}
			>
				<ThumbsDown className="w-4 h-4" />
				<span className="font-semibold">{downvotes}</span>
			</Button>

			<span className="text-xs text-muted-foreground/60 italic">
				ถ้าโพสนี้มีประโยชน์ฝากกดไลค์สนับสนุนเจ้าของโพสด้วยครับ
			</span>
		</div>
	);
}
