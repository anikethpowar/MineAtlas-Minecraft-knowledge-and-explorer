import React from 'react';
import { PaginationMeta } from '../../api/types';

interface PaginationControlsProps {
  pagination: PaginationMeta;
  onPageChange: (newPage: number) => void;
  className?: string;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  pagination,
  onPageChange,
  className = '',
}) => {
  const { page, total_pages, total_items, page_size } = pagination;

  if (total_pages <= 1 && total_items <= page_size) {
    return (
      <div className={`flex items-center justify-between text-xs text-mc-textMuted py-4 px-2 ${className}`}>
        <span>Showing all {total_items} items</span>
      </div>
    );
  }

  const startItem = total_items === 0 ? 0 : (page - 1) * page_size + 1;
  const endItem = Math.min(page * page_size, total_items);

  return (
    <div
      data-testid="pagination-controls"
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 border-t border-mc-border ${className}`}
    >
      <div className="text-xs text-mc-textMuted font-mono">
        Showing <span className="text-slate-300 font-semibold">{startItem}</span> -{' '}
        <span className="text-slate-300 font-semibold">{endItem}</span> of{' '}
        <span className="text-slate-300 font-semibold">{total_items}</span> items
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous Page"
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-mc-border bg-mc-card text-slate-300 hover:bg-mc-cardHover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>

        <span className="text-xs text-slate-400 font-mono px-2">
          Page <strong className="text-emerald-400">{page}</strong> of{' '}
          <strong className="text-slate-300">{Math.max(1, total_pages)}</strong>
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= total_pages}
          aria-label="Next Page"
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-mc-border bg-mc-card text-slate-300 hover:bg-mc-cardHover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default PaginationControls;

