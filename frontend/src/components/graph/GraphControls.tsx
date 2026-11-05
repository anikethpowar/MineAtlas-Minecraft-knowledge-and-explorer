import React from 'react';
import { formatRelationshipLabel } from './graphTransformers';

interface GraphControlsProps {
  depth: number;
  onDepthChange: (newDepth: number) => void;
  availableRelTypes: string[];
  activeRelTypes: Set<string>;
  onToggleRelType: (relType: string) => void;
  onSelectAllRelTypes: () => void;
  onClearAllRelTypes: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onResetView: () => void;
  onReRunLayout: () => void;
  viewMode: 'canvas' | 'list';
  onViewModeChange: (mode: 'canvas' | 'list') => void;
  className?: string;
}

export const GraphControls: React.FC<GraphControlsProps> = ({
  depth,
  onDepthChange,
  availableRelTypes,
  activeRelTypes,
  onToggleRelType,
  onSelectAllRelTypes,
  onClearAllRelTypes,
  onZoomIn,
  onZoomOut,
  onFit,
  onResetView,
  onReRunLayout,
  viewMode,
  onViewModeChange,
  className = '',
}) => {
  return (
    <div
      className={`p-4 rounded-xl bg-mc-card border border-mc-border shadow-sm flex flex-col gap-3.5 ${className}`}
    >
      {/* Top Bar: Depth Selector + View Mode Switcher + Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Depth Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-300">Radius:</span>
          <div className="inline-flex rounded-lg bg-slate-900 border border-mc-border p-0.5">
            <button
              type="button"
              onClick={() => onDepthChange(1)}
              className={`px-3 py-1 rounded-md text-xs font-mono font-medium transition-all ${
                depth === 1
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Explore direct neighbors (1 level)"
            >
              1 Level
            </button>
            <button
              type="button"
              onClick={() => onDepthChange(2)}
              className={`px-3 py-1 rounded-md text-xs font-mono font-medium transition-all ${
                depth === 2
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Explore extended neighbors (2 levels)"
            >
              2 Levels
            </button>
          </div>
        </div>

        {/* View Mode Toggle: Visual Graph vs Accessible List */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg bg-slate-900 border border-mc-border p-0.5">
            <button
              type="button"
              onClick={() => onViewModeChange('canvas')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === 'canvas'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="6" cy="6" r="3" strokeWidth="2" />
                <circle cx="18" cy="18" r="3" strokeWidth="2" />
                <circle cx="18" cy="6" r="3" strokeWidth="2" />
                <path strokeWidth="2" d="M8.5 7.5l7 3M8.5 6h7M18 8.5v7" />
              </svg>
              <span>Visual Graph</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span>Relationship List</span>
            </button>
          </div>
        </div>

        {/* Canvas Navigation Action Buttons */}
        {viewMode === 'canvas' && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onZoomIn}
              aria-label="Zoom In"
              title="Zoom In"
              className="p-1.5 rounded-lg bg-slate-900 border border-mc-border text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>

            <button
              type="button"
              onClick={onZoomOut}
              aria-label="Zoom Out"
              title="Zoom Out"
              className="p-1.5 rounded-lg bg-slate-900 border border-mc-border text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
              </svg>
            </button>

            <button
              type="button"
              onClick={onFit}
              aria-label="Fit Graph to View"
              title="Fit to view"
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-mc-border text-xs font-mono text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
            >
              Fit
            </button>

            <button
              type="button"
              onClick={onResetView}
              aria-label="Reset View and Center"
              title="Reset Zoom & Center"
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-mc-border text-xs font-mono text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
            >
              Reset
            </button>

            <button
              type="button"
              onClick={onReRunLayout}
              aria-label="Re-run Layout"
              title="Re-run Layout"
              className="p-1.5 rounded-lg bg-slate-900 border border-mc-border text-slate-300 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Relationship Predicate Filter Bar */}
      {availableRelTypes.length > 0 && (
        <div className="pt-2 border-t border-mc-border/60 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 mr-1">Filter Types:</span>

          {availableRelTypes.map((rel) => {
            const isSelected = activeRelTypes.has(rel);
            return (
              <button
                key={rel}
                type="button"
                onClick={() => onToggleRelType(rel)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-900/60 text-slate-500 border border-slate-800 line-through opacity-75 hover:opacity-100 hover:text-slate-300'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-400' : 'bg-slate-600'}`}
                />
                <span>{formatRelationshipLabel(rel)}</span>
              </button>
            );
          })}

          <div className="ml-auto flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={onSelectAllRelTypes}
              className="text-slate-400 hover:text-emerald-400 underline decoration-slate-600"
            >
              All
            </button>
            <span className="text-slate-600">|</span>
            <button
              type="button"
              onClick={onClearAllRelTypes}
              className="text-slate-400 hover:text-amber-400 underline decoration-slate-600"
            >
              None
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GraphControls;

