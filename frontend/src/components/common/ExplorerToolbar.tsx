import React from 'react';

interface ExplorerToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  hasActiveFilters?: boolean;
  onResetFilters?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export const ExplorerToolbar: React.FC<ExplorerToolbarProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search entities...',
  hasActiveFilters = false,
  onResetFilters,
  children,
  className = '',
}) => {
  return (
    <div
      className={`p-4 rounded-xl bg-mc-card border border-mc-border shadow-sm flex flex-col gap-4 ${className}`}
    >
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search input with search icon and clear button */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-9 py-2 rounded-lg bg-slate-900/90 border border-mc-border text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400 transition-colors"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {hasActiveFilters && onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-red-400 bg-slate-900/60 hover:bg-red-950/30 border border-slate-800 hover:border-red-500/30 rounded-lg transition-colors shrink-0 flex items-center justify-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset Filters
          </button>
        )}
      </div>

      {children && (
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-mc-border/60">
          {children}
        </div>
      )}
    </div>
  );
};

export default ExplorerToolbar;

