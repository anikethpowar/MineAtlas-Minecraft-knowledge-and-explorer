import React from 'react';

interface ErrorStateProps {
  title?: string;
  error: Error | string | null;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to load data',
  error,
  onRetry,
  className = '',
}) => {
  const errorMessage =
    error instanceof Error ? error.message : error || 'An unexpected error occurred.';

  return (
    <div
      data-testid="error-state"
      className={`flex flex-col items-center justify-center py-12 px-6 text-center rounded-xl bg-red-950/20 border border-red-500/30 ${className}`}
    >
      <div className="w-12 h-12 mb-3 rounded-full bg-red-900/40 border border-red-500/40 flex items-center justify-center text-red-400">
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <h3 className="text-base font-semibold text-red-200 mb-1">{title}</h3>
      <p className="text-xs font-mono text-red-300/80 max-w-lg mb-5 bg-red-950/40 p-2.5 rounded border border-red-900/50 break-words">
        {errorMessage}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 text-xs font-semibold text-slate-100 bg-red-900/60 hover:bg-red-800/80 border border-red-500/40 rounded-lg transition-colors"
        >
          Retry Request
        </button>
      )}
    </div>
  );
};

export default ErrorState;

