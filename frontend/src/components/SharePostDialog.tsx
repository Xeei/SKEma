'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Globe, Lock, Users, Share2, X, Loader2, Check, Link } from 'lucide-react';
import { PostData, updatePost } from '@/services/post.service';
import {
	createPostShare,
	getPostSharesByPost,
	revokePostShare,
	PostShareData,
} from '@/services/postshare.service';
import { searchUsers, UserSearchResult } from '@/services/user.service';
import { cn } from '@/lib/utils';

type Privacy = 'PUBLIC' | 'PRIVATE' | 'SHARED';

const PRIVACY_OPTIONS: {
	value: Privacy;
	label: string;
	description: string;
	icon: React.FC<{ className?: string }>;
}[] = [
	{ value: 'PUBLIC', label: 'Public', description: 'Anyone can see this post', icon: Globe },
	{ value: 'PRIVATE', label: 'Private', description: 'Only you can see this post', icon: Lock },
	{ value: 'SHARED', label: 'Shared', description: 'Only people you add below', icon: Users },
];

interface SharePostDialogProps {
	post: PostData;
	onUpdated?: () => void;
	asMenuItem?: boolean;
	isAuthor: boolean;
}

export function SharePostDialog({ post, onUpdated, asMenuItem, isAuthor }: SharePostDialogProps) {
	const { data: session } = useSession();
	const [open, setOpen] = useState(false);
	const [copied, setCopied] = useState(false);
	const [privacy, setPrivacy] = useState<Privacy>(post.privacy as Privacy);
	const [search, setSearch] = useState('');
	const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
	const [searching, setSearching] = useState(false);
	const [shares, setShares] = useState<PostShareData[]>([]);
	const [loadingShares, setLoadingShares] = useState(false);
	const [saving, setSaving] = useState(false);
	const [sharingUserId, setSharingUserId] = useState<string | null>(null);
	const [revokingUserId, setRevokingUserId] = useState<string | null>(null);
	const [showResults, setShowResults] = useState(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const searchRef = useRef<HTMLDivElement>(null);

	const handleCopyLink = () => {
		const url = `${window.location.origin}/library/post/${post.id}`;
		navigator.clipboard.writeText(url).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		});
	};

	const loadShares = useCallback(async () => {
		setLoadingShares(true);
		try {
			const data = await getPostSharesByPost(post.id);
			setShares(data);
		} catch {
			// silently fail
		} finally {
			setLoadingShares(false);
		}
	}, [post.id]);

	// Load existing shares when dialog opens
	useEffect(() => {
		if (!open) return;
		setPrivacy(post.privacy as Privacy);
		setSearch('');
		setSearchResults([]);
		setShowResults(false);
		loadShares();
	}, [open, post.privacy, post.id, loadShares]);

	// Debounced search
	useEffect(() => {
		if (debounceRef.current) clearTimeout(debounceRef.current);
		if (!search.trim() || privacy !== 'SHARED') {
			setSearchResults([]);
			setShowResults(false);
			return;
		}
		debounceRef.current = setTimeout(async () => {
			setSearching(true);
			try {
				const results = await searchUsers(search);
				// Filter out already-shared users
				const sharedIds = new Set(shares.map((s) => s.sharedUserId));
				setSearchResults(results.filter((u) => !sharedIds.has(u.id)));
				setShowResults(true);
			} catch {
				setSearchResults([]);
			} finally {
				setSearching(false);
			}
		}, 400);
	}, [search, privacy, shares]);

	// Close dropdown on outside click
	useEffect(() => {
		const handleClick = (e: MouseEvent) => {
			if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
				setShowResults(false);
			}
		};
		document.addEventListener('mousedown', handleClick);
		return () => document.removeEventListener('mousedown', handleClick);
	}, []);

	const handleShareUser = useCallback(
		async (user: UserSearchResult) => {
			if (!session?.userId) return;
			setSharingUserId(user.id);
			setShowResults(false);
			setSearch('');
			try {
				await createPostShare(post.id, session.userId, user.id);
				await loadShares();
			} catch {
				// silently fail (e.g. duplicate)
			} finally {
				setSharingUserId(null);
			}
		},
		[post.id, session?.userId, loadShares]
	);

	const handleRevoke = useCallback(
		async (sharedUserId: string) => {
			setRevokingUserId(sharedUserId);
			try {
				await revokePostShare(post.id, sharedUserId);
				setShares((prev) => prev.filter((s) => s.sharedUserId !== sharedUserId));
			} catch {
				// silently fail
			} finally {
				setRevokingUserId(null);
			}
		},
		[post.id]
	);

	if (!isAuthor) {
		return asMenuItem ? (
			<span className="flex items-center gap-2 w-full" onClick={handleCopyLink}>
				{copied ? <Check className="w-4 h-4 text-green-600" /> : <Link className="w-4 h-4" />}
				{copied ? 'Copied!' : 'Share Link'}
			</span>
		) : (
			<Button
				variant="outline"
				size="sm"
				className="flex items-center gap-2"
				onClick={handleCopyLink}
			>
				{copied ? <Check className="w-4 h-4 text-green-600" /> : <Link className="w-4 h-4" />}
				{copied ? 'Copied!' : 'Share Link'}
			</Button>
		);
	}

	const handleSave = async () => {
		setSaving(true);
		try {
			await updatePost(post.id, { privacy });
			onUpdated?.();
			setOpen(false);
		} catch {
			// silently fail
		} finally {
			setSaving(false);
		}
	};

	const trigger = asMenuItem ? (
		<span className="flex items-center gap-2 w-full">
			<Share2 className="w-4 h-4" />
			Share
		</span>
	) : (
		<Button variant="outline" size="sm" className="flex items-center gap-2">
			<Share2 className="w-4 h-4" />
			Share
		</Button>
	);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<span onClick={() => setOpen(true)} className="contents">
					{trigger}
				</span>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
				<DialogHeader className="px-6 pt-6 pb-4 border-b">
					<DialogTitle className="text-base font-semibold truncate">
						Share &ldquo;{post.title}&rdquo;
					</DialogTitle>
				</DialogHeader>

				<div className="px-6 py-5 space-y-5">
					{/* Privacy selector */}
					<div className="space-y-2">
						<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
							Visibility
						</p>
						<div className="grid grid-cols-3 gap-2">
							{PRIVACY_OPTIONS.map(({ value, label, description, icon: Icon }) => (
								<button
									key={value}
									onClick={() => setPrivacy(value)}
									className={cn(
										'flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-all hover:bg-accent',
										privacy === value
											? 'border-[#006837] bg-[#006837]/5 text-[#006837]'
											: 'border-border text-muted-foreground'
									)}
								>
									<Icon
										className={cn(
											'w-5 h-5',
											privacy === value ? 'text-[#006837]' : 'text-muted-foreground'
										)}
									/>
									<span
										className={cn(
											'text-xs font-semibold',
											privacy === value ? 'text-[#006837]' : 'text-foreground'
										)}
									>
										{label}
									</span>
									<span className="text-[10px] leading-tight text-muted-foreground hidden sm:block">
										{description}
									</span>
								</button>
							))}
						</div>
					</div>

					{/* People section — only when SHARED */}
					{privacy === 'SHARED' && (
						<div className="space-y-2">
							<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
								People with access
							</p>

							{/* Search input */}
							<div className="relative" ref={searchRef}>
								<Input
									placeholder="Search by name or email…"
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									onFocus={() => search.trim() && setShowResults(true)}
									className="pr-8"
								/>
								{searching && (
									<Loader2 className="absolute right-2.5 top-2.5 w-4 h-4 animate-spin text-muted-foreground" />
								)}

								{/* Dropdown results */}
								{showResults && searchResults.length > 0 && (
									<div className="absolute z-50 top-full mt-1 left-0 right-0 rounded-md border bg-popover shadow-md overflow-hidden">
										{searchResults.map((user) => (
											<button
												key={user.id}
												onMouseDown={(e) => {
													e.preventDefault();
													handleShareUser(user);
												}}
												disabled={sharingUserId === user.id}
												className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-accent transition-colors disabled:opacity-50"
											>
												<div className="shrink-0 w-8 h-8 rounded-full bg-[#006837]/10 flex items-center justify-center text-[#006837] text-xs font-bold uppercase">
													{(user.name ?? user.email).charAt(0)}
												</div>
												<div className="min-w-0">
													<p className="text-sm font-medium truncate">
														{user.name ?? (
															<span className="italic text-muted-foreground">No name</span>
														)}
													</p>
													<p className="text-xs text-muted-foreground truncate">{user.email}</p>
												</div>
												{sharingUserId === user.id && (
													<Loader2 className="ml-auto w-3.5 h-3.5 animate-spin" />
												)}
											</button>
										))}
									</div>
								)}

								{showResults && !searching && searchResults.length === 0 && search.trim() && (
									<div className="absolute z-50 top-full mt-1 left-0 right-0 rounded-md border bg-popover shadow-md">
										<p className="text-sm text-muted-foreground px-3 py-3 text-center">
											No users found
										</p>
									</div>
								)}
							</div>

							{/* Existing shares list */}
							<div className="space-y-1 max-h-48 overflow-y-auto">
								{loadingShares ? (
									<div className="flex items-center gap-2 py-2 text-muted-foreground text-sm">
										<Loader2 className="w-4 h-4 animate-spin" />
										Loading…
									</div>
								) : shares.length === 0 ? (
									<p className="text-sm text-muted-foreground py-2 text-center">
										No one has access yet. Search above to add people.
									</p>
								) : (
									shares.map((share) => (
										<div
											key={share.id}
											className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent/50 group"
										>
											<div className="shrink-0 w-8 h-8 rounded-full bg-[#006837]/10 flex items-center justify-center text-[#006837] text-xs font-bold uppercase">
												{(share.sharedUserName ?? share.sharedUserEmail ?? '?').charAt(0)}
											</div>
											<div className="min-w-0 flex-1">
												<p className="text-sm font-medium truncate">
													{share.sharedUserName ?? (
														<span className="italic text-muted-foreground">No name</span>
													)}
												</p>
												<p className="text-xs text-muted-foreground truncate">
													{share.sharedUserEmail}
												</p>
											</div>
											<button
												onClick={() => handleRevoke(share.sharedUserId)}
												disabled={revokingUserId === share.sharedUserId}
												className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive disabled:opacity-50"
												aria-label="Remove access"
											>
												{revokingUserId === share.sharedUserId ? (
													<Loader2 className="w-4 h-4 animate-spin" />
												) : (
													<X className="w-4 h-4" />
												)}
											</button>
										</div>
									))
								)}
							</div>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="px-6 py-4 border-t flex items-center justify-between bg-muted/30">
					<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
						{privacy === 'PUBLIC' && <Globe className="w-3.5 h-3.5" />}
						{privacy === 'PRIVATE' && <Lock className="w-3.5 h-3.5" />}
						{privacy === 'SHARED' && <Users className="w-3.5 h-3.5" />}
						<span>
							{privacy === 'PUBLIC' && 'Visible to everyone'}
							{privacy === 'PRIVATE' && 'Only visible to you'}
							{privacy === 'SHARED' &&
								`Shared with ${shares.length} ${shares.length === 1 ? 'person' : 'people'}`}
						</span>
					</div>
					<div className="flex gap-2">
						<Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleSave}
							disabled={saving || privacy === post.privacy}
							className="bg-[#006837] hover:bg-[#005530] text-white"
						>
							{saving ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : (
								<Check className="w-4 h-4" />
							)}
							{saving ? 'Saving…' : 'Save'}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
