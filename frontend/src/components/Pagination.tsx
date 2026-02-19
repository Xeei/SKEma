'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	hasNext: boolean;
	hasPrev: boolean;
	total?: number;
	limit?: number;
}

export function Pagination({
	currentPage,
	totalPages,
	onPageChange,
	hasNext,
	hasPrev,
	total,
	limit,
}: PaginationProps) {
	const renderPageNumbers = () => {
		const pages = [];
		const maxVisiblePages = 5;

		let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
		let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

		if (endPage - startPage < maxVisiblePages - 1) {
			startPage = Math.max(1, endPage - maxVisiblePages + 1);
		}

		for (let i = startPage; i <= endPage; i++) {
			pages.push(
				<Button
					key={i}
					variant={i === currentPage ? 'default' : 'outline'}
					size="sm"
					onClick={() => onPageChange(i)}
					className={i === currentPage ? 'bg-[#006837] hover:bg-[#005530]' : ''}
				>
					{i}
				</Button>
			);
		}

		return pages;
	};

	const getItemRange = () => {
		if (!total || !limit) return null;
		const startItem = (currentPage - 1) * limit + 1;
		const endItem = Math.min(currentPage * limit, total);
		return { startItem, endItem };
	};

	const itemRange = getItemRange();

	if (totalPages <= 1) return null;

	return (
		<div className="flex flex-col items-center gap-3 mt-6">
			{itemRange && (
				<div className="text-sm text-muted-foreground">
					Showing {itemRange.startItem}-{itemRange.endItem} of {total} items
				</div>
			)}
			<div className="flex items-center gap-2">
				<Button
					variant="outline"
					size="sm"
					onClick={() => onPageChange(currentPage - 1)}
					disabled={!hasPrev}
					className="flex items-center gap-1"
				>
					<ChevronLeft className="w-4 h-4" />
					Previous
				</Button>

				<div className="flex gap-1">{renderPageNumbers()}</div>

				<Button
					variant="outline"
					size="sm"
					onClick={() => onPageChange(currentPage + 1)}
					disabled={!hasNext}
					className="flex items-center gap-1"
				>
					Next
					<ChevronRight className="w-4 h-4" />
				</Button>
			</div>
		</div>
	);
}
