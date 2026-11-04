import React from 'react';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading data from local SQLite cache...',
  className = '',
}) => {
  return (
    <div
      data-testid="loading-state"
      className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}
    >
      <div className="relative w-12 h-12 mb-4">
        {/* Animated outer ring */}
        <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
        {/* Center Minecraft-themed geometric block */}
        <div className="absolute inset-2.5 rounded bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center">
          <div className="w-2 h-2 bg-emerald-400 rounded-sm animate-pulse" />
        </div>
      </div>
      <p className="text-sm font-medium text-slate-300">{message}</p>
      <p className="text-xs text-mc-textMuted mt-1">Served safely without external API requests</p>
    </div>
  );
};

export default LoadingState;

