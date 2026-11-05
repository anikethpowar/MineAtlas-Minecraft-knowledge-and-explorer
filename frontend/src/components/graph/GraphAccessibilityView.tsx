import React from 'react';
import { Link } from 'react-router-dom';
import SourceBadge from '../common/SourceBadge';
import { CytoscapeEdgeData, formatRelationshipLabel } from './graphTransformers';

interface GraphAccessibilityViewProps {
  edges: CytoscapeEdgeData[];
  rootId: string;
  onSelectEdge: (edge: CytoscapeEdgeData) => void;
  onSetRoot: (entityType: string, entityId: string) => void;
  className?: string;
}

export const GraphAccessibilityView: React.FC<GraphAccessibilityViewProps> = ({
  edges,
  rootId,
  onSelectEdge,
  onSetRoot,
  className = '',
}) => {
  const getDetailRoute = (type: string, id: string): string | null => {
    const t = type.toLowerCase();
    if (t === 'mob') return `/mobs/${encodeURIComponent(id)}`;
    if (t === 'biome') return `/biomes/${encodeURIComponent(id)}`;
    if (t === 'item') return `/items/${encodeURIComponent(id)}`;
    if (t === 'structure') return `/structures/${encodeURIComponent(id)}`;
    return null;
  };

  if (edges.length === 0) {
    return (
      <div
        data-testid="accessibility-empty-state"
        className={`p-8 text-center rounded-xl bg-mc-card border border-mc-border text-mc-textMuted ${className}`}
      >
        <p className="text-sm font-medium text-slate-300 mb-1">
          No relationship rows match the current filters
        </p>
        <p className="text-xs">
          Enable more relationship types above to view connections in this accessible list.
        </p>
      </div>
    );
  }

  return (
    <div
      data-testid="graph-accessibility-view"
      className={`space-y-3 ${className}`}
      role="region"
      aria-label="Accessible Knowledge Graph Relationship List"
    >
      <div className="flex items-center justify-between text-xs text-mc-textMuted px-1">
        <span>
          Showing <strong className="text-emerald-400 font-mono">{edges.length}</strong> verified relationship connections:
        </span>
        <span className="text-[11px] font-mono text-slate-500">Keyboard Navigable (Tab &amp; Enter)</span>
      </div>

      <div className="space-y-2.5">
        {edges.map((edge, index) => {
          const isSourceRoot = edge.sourceEntityId.toLowerCase() === rootId.toLowerCase();
          const isTargetRoot = edge.targetEntityId.toLowerCase() === rootId.toLowerCase();

          return (
            <div
              key={edge.id || `rel-row-${index}`}
              tabIndex={0}
              role="article"
              aria-label={`${edge.sourceName} ${edge.label} ${edge.targetName}: ${edge.explanation}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectEdge(edge);
                }
              }}
              onClick={() => onSelectEdge(edge)}
              className="p-4 rounded-xl bg-mc-card border border-mc-border hover:border-mc-emerald hover:bg-mc-cardHover transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400 group shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                {/* Relationship Verb & Provenance */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/40">
                    {edge.relationshipType}
                  </span>
                  <SourceBadge sourceType={edge.sourceType} />
                </div>

                {/* Subject -> Predicate -> Object */}
                <div className="text-sm font-semibold text-slate-100 flex flex-wrap items-center gap-2">
                  <span className={isSourceRoot ? 'text-emerald-300 font-bold' : 'text-slate-200'}>
                    {edge.sourceName}
                    <span className="text-[10px] font-mono font-normal text-slate-500 ml-1">
                      ({edge.sourceEntityType})
                    </span>
                  </span>

                  <span className="text-emerald-400 font-mono font-normal text-xs">
                    &rarr; {formatRelationshipLabel(edge.relationshipType)} &rarr;
                  </span>

                  <span className={isTargetRoot ? 'text-emerald-300 font-bold' : 'text-slate-200'}>
                    {edge.targetName}
                    <span className="text-[10px] font-mono font-normal text-slate-500 ml-1">
                      ({edge.targetEntityType})
                    </span>
                  </span>
                </div>

                {/* Deterministic Explanation */}
                <p className="text-xs text-mc-textMuted italic">
                  &ldquo;{edge.explanation}&rdquo;
                </p>

                {/* Key metadata pills if available */}
                {edge.metadata && Object.keys(edge.metadata).length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-mono text-slate-400">
                    {Object.entries(edge.metadata).map(([k, v]) => (
                      <span key={k} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                        {k}: <strong className="text-slate-300">{String(v)}</strong>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons: Open details or Pivot Graph */}
              <div
                className="flex items-center gap-2 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                {getDetailRoute(edge.targetEntityType, edge.targetEntityId) && (
                  <Link
                    to={getDetailRoute(edge.targetEntityType, edge.targetEntityId)!}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-mc-border text-xs text-slate-300 hover:text-white transition-colors"
                  >
                    View {edge.targetName}
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => onSetRoot(edge.targetEntityType, edge.targetEntityId)}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-xs text-emerald-300 transition-colors"
                  title={`Pivot graph to center on ${edge.targetName}`}
                >
                  Explore &rarr;
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GraphAccessibilityView;

