import React from 'react';
import { Link } from 'react-router-dom';
import EditionBadge from '../common/EditionBadge';
import SourceBadge from '../common/SourceBadge';
import VersionBadge from '../common/VersionBadge';
import { CytoscapeEdgeData, CytoscapeNodeData } from './graphTransformers';

interface GraphDetailsPanelProps {
  selectedNode: CytoscapeNodeData | null;
  selectedEdge: CytoscapeEdgeData | null;
  onSetRoot?: (entityType: string, entityId: string) => void;
  className?: string;
}

export const GraphDetailsPanel: React.FC<GraphDetailsPanelProps> = ({
  selectedNode,
  selectedEdge,
  onSetRoot,
  className = '',
}) => {
  // Helper to map entity type to detail route
  const getDetailRoute = (type: string, id: string): string | null => {
    const t = type.toLowerCase();
    if (t === 'mob') return `/mobs/${encodeURIComponent(id)}`;
    if (t === 'biome') return `/biomes/${encodeURIComponent(id)}`;
    if (t === 'item') return `/items/${encodeURIComponent(id)}`;
    if (t === 'structure') return `/structures/${encodeURIComponent(id)}`;
    return null;
  };

  const getEntityTypeBadgeColor = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'mob':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'biome':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'item':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'structure':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'enchantment':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'version':
        return 'bg-slate-800 text-slate-300 border-slate-700';
      case 'achievement':
        return 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30';
      case 'trade':
        return 'bg-teal-500/10 text-teal-300 border-teal-500/30';
      case 'villager_profession':
        return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div
      data-testid="graph-details-panel"
      className={`rounded-xl bg-mc-card border border-mc-border p-5 flex flex-col justify-between shadow-md ${className}`}
    >
      {/* CASE 1: NODE SELECTED */}
      {selectedNode && (
        <div className="space-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase border ${getEntityTypeBadgeColor(
                  selectedNode.entityType
                )}`}
              >
                {selectedNode.entityType}
              </span>
              {selectedNode.isRoot && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Root Entity
                </span>
              )}
              <EditionBadge edition={selectedNode.edition} />
              <VersionBadge version={selectedNode.gameVersion} />
              <SourceBadge sourceType={selectedNode.sourceType} />
            </div>

            <h3 className="text-xl font-bold text-slate-100">{selectedNode.name}</h3>
            <span className="text-xs font-mono text-mc-textMuted block">
              ID: {selectedNode.entityId}
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs space-y-2">
            <span className="text-[10px] font-mono uppercase text-mc-textMuted block">
              Canonical Details
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">Type</span>
                <span className="text-slate-300 capitalize">{selectedNode.entityType}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Edition</span>
                <span className="text-slate-300 font-mono">Java Edition</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Provenance</span>
                <span className="text-slate-300 font-mono">{selectedNode.sourceType}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Game Version</span>
                <span className="text-slate-300 font-mono">{selectedNode.gameVersion || 'Base Game'}</span>
              </div>
            </div>
          </div>

          {/* Action Links: Open full detail page or Pivot graph */}
          <div className="pt-2 flex flex-col gap-2">
            {getDetailRoute(selectedNode.entityType, selectedNode.entityId) && (
              <Link
                to={getDetailRoute(selectedNode.entityType, selectedNode.entityId)!}
                className="w-full px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors text-center shadow flex items-center justify-center gap-1.5"
              >
                <span>Open full details</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            )}

            {!selectedNode.isRoot && onSetRoot && (
              <button
                type="button"
                onClick={() => onSetRoot(selectedNode.entityType, selectedNode.entityId)}
                className="w-full px-3 py-2 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 border border-mc-border text-slate-300 hover:text-emerald-300 transition-colors text-center"
              >
                Center Graph on this Entity &rarr;
              </button>
            )}
          </div>
        </div>
      )}

      {/* CASE 2: EDGE SELECTED */}
      {selectedEdge && (
        <div className="space-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/40">
                {selectedEdge.relationshipType}
              </span>
              <SourceBadge sourceType={selectedEdge.sourceType} />
            </div>

            <div className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>{selectedEdge.sourceName}</span>
              <span className="text-emerald-400 font-mono">&rarr;</span>
              <span>{selectedEdge.targetName}</span>
            </div>
            <div className="text-xs font-mono text-mc-textMuted mt-0.5">
              {selectedEdge.sourceEntityType}:{selectedEdge.sourceEntityId} &rarr; {selectedEdge.targetEntityType}:{selectedEdge.targetEntityId}
            </div>
          </div>

          {/* Deterministic Explanation Box */}
          <div className="p-3.5 rounded-lg bg-slate-900/80 border border-emerald-500/20 text-xs space-y-1">
            <span className="text-[10px] font-mono uppercase text-emerald-400 font-semibold block">
              Why Connected?
            </span>
            <p className="text-slate-200 leading-relaxed italic">
              &ldquo;{selectedEdge.explanation}&rdquo;
            </p>
          </div>

          {/* Edge Metadata Inspector if available */}
          {selectedEdge.metadata && Object.keys(selectedEdge.metadata).length > 0 && (
            <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs space-y-2">
              <span className="text-[10px] font-mono uppercase text-mc-textMuted block">
                Relationship Metadata
              </span>
              <div className="space-y-1.5 font-mono text-[11px]">
                {Object.entries(selectedEdge.metadata).map(([key, val]) => {
                  let formattedVal = String(val);
                  if (typeof val === 'number') {
                    if (key.includes('chance') || key.includes('probability')) {
                      formattedVal = `${(val * 100).toFixed(1)}% (${val})`;
                    }
                  } else if (typeof val === 'object' && val !== null) {
                    formattedVal = JSON.stringify(val);
                  }
                  return (
                    <div key={key} className="flex items-start justify-between gap-2 border-b border-slate-800/60 pb-1">
                      <span className="text-slate-400 capitalize">{key.replace(/_/g, ' ')}:</span>
                      <span className="text-slate-200 font-medium text-right">{formattedVal}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick links to source and target detail pages */}
          <div className="pt-2 grid grid-cols-2 gap-2 text-xs">
            {getDetailRoute(selectedEdge.sourceEntityType, selectedEdge.sourceEntityId) && (
              <Link
                to={getDetailRoute(selectedEdge.sourceEntityType, selectedEdge.sourceEntityId)!}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-mc-border text-slate-300 text-center truncate"
                title={`Open details for ${selectedEdge.sourceName}`}
              >
                View {selectedEdge.sourceName}
              </Link>
            )}
            {getDetailRoute(selectedEdge.targetEntityType, selectedEdge.targetEntityId) && (
              <Link
                to={getDetailRoute(selectedEdge.targetEntityType, selectedEdge.targetEntityId)!}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-mc-border text-slate-300 text-center truncate"
                title={`Open details for ${selectedEdge.targetName}`}
              >
                View {selectedEdge.targetName}
              </Link>
            )}
          </div>
        </div>
      )}

      {/* CASE 3: NOTHING SELECTED */}
      {!selectedNode && !selectedEdge && (
        <div className="py-8 text-center space-y-3">
          <div className="w-10 h-10 mx-auto rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-200">Inspect Connections</h4>
            <p className="text-xs text-mc-textMuted mt-1 leading-relaxed">
              Click on any entity node or connection arrow in the graph to view deterministic explanations, drop rates, and attributes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GraphDetailsPanel;

