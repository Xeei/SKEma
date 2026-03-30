'use client';

import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
	icon: LucideIcon;
	title: string;
	description?: string;
	actionLabel?: string;
	onAction?: () => void;
	className?: string;
}

export function EmptyState({
	icon: Icon,
	title,
	description,
	actionLabel,
	onAction,
	className,
}: EmptyStateProps) {
	return (
		<div
			className={`flex flex-col items-center justify-center py-16 text-center gap-3 ${className ?? ''}`}
		>
			<div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
				<Icon className="w-8 h-8 text-gray-400" />
			</div>
			<div>
				<p className="font-sarabun font-semibold text-gray-600 text-base">{title}</p>
				{description && (
					<p className="font-sarabun text-sm text-gray-400 mt-1 max-w-xs mx-auto">{description}</p>
				)}
			</div>
			{actionLabel && onAction && (
				<Button size="sm" className="bg-brand hover:bg-brand-dark mt-2" onClick={onAction}>
					{actionLabel}
				</Button>
			)}
		</div>
	);
}
