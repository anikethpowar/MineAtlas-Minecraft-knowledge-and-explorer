import React from 'react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  onReset?: () => void;
  resetLabel?: string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No results found',
  message = 'Try adjusting your search query or removing active filters to see cached entities.',
  onReset,
  resetLabel = 'Clear all filters',
  className = '',
}) => {
  return (
    <div
      data-testid="empty-state"
      className={`flex flex-col items-center justify-center py-16 px-6 text-center rounded-xl bg-mc-card/50 border border-mc-border/60 ${className}`}
    >
      <div className="w-14 h-14 mb-4 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400">
        <svg
          className="w-7 h-7"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
      </div>

      <h3 className="text-base font-semibold text-slate-200 mb-1">{title}</h3>
      <p className="text-sm text-mc-textMuted max-w-md mb-6">{message}</p>

      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="px-4 py-2 text-xs font-medium text-emerald-400 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 hover:border-emerald-500/50 rounded-lg transition-colors"
        >
          {resetLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;

