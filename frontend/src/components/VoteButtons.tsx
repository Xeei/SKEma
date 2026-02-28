'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { votePost, getMyVote, VoteType } from '@/services/post.service';
import { useEffect } from 'react';

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
		} catch (err) {
			console.error('Vote error:', err);
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
					myVote === 'UPVOTE'
						? 'text-[#006837]'
						: 'hover:text-[#006837]'
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
					myVote === 'DOWNVOTE'
						? 'text-red-500'
						: 'hover:text-red-500'
				}`}
				aria-label="Downvote"
				aria-pressed={myVote === 'DOWNVOTE'}
			>
				<ThumbsDown className="w-4 h-4" />
				<span className="font-semibold">{downvotes}</span>
			</Button>
		</div>
	);
}
