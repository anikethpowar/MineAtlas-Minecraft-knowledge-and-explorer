import React from 'react';
import { DataStatusResponse } from '../../api/types';

interface DataFreshnessIndicatorProps {
  status: DataStatusResponse | null;
  loading?: boolean;
  className?: string;
}

/**
 * DataFreshnessIndicator Component
 *
 * Visual indicator showing that the app serves fast, safe cached responses
 * from local SQLite without hitting external APIs on page views.
 */
export const DataFreshnessIndicator: React.FC<DataFreshnessIndicatorProps> = ({
  status,
  loading = false,
  className = '',
}) => {
  if (loading) {
    return (
      <div className={`animate-pulse flex items-center gap-2 text-xs text-slate-400 ${className}`}>
        <div className="w-2 h-2 rounded-full bg-slate-600" />
        <span>Checking SQLite cache status...</span>
      </div>
    );
  }

  if (!status) {
    return (
      <div className={`flex items-center gap-2 text-xs text-amber-400/80 ${className}`}>
        <span className="w-2 h-2 rounded-full bg-amber-400" />
        <span>Cache status unavailable</span>
      </div>
    );
  }

  const isHealthy = status.status === 'healthy';
  const dotColor = isHealthy ? 'bg-emerald-400' : 'bg-amber-400';
  const textColor = isHealthy ? 'text-emerald-400' : 'text-amber-300';

  return (
    <div
      className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-md bg-mc-card/80 border border-mc-border text-xs ${className}`}
      title={`SQLite cache: ${status.total_entities} entities, ${status.total_relationship_edges} edges`}
    >
      <span className={`w-2 h-2 rounded-full ${dotColor} shadow-sm shadow-${isHealthy ? 'emerald-500/50' : 'amber-500/50'}`} />
      <span className={`font-mono font-medium ${textColor}`}>
        {isHealthy ? 'SQLite Cache Active' : `Cache ${status.status}`}
      </span>
      <span className="text-slate-600">|</span>
      <span className="text-mc-textMuted font-mono">
        {status.cache_freshness_human || 'Cached'}
      </span>
      <span className="text-slate-600">|</span>
      <span className="text-mc-textMuted">
        <strong className="text-slate-300 font-mono">{status.total_entities}</strong> entities
      </span>
    </div>
  );
};

export default DataFreshnessIndicator;

