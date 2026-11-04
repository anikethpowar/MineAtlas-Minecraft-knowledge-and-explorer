import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getGraphNeighbors } from '../../api/mineatlasApi';
import { GraphNeighborsResponse } from '../../api/types';
import SourceBadge from '../common/SourceBadge';

interface RelatedConnectionsProps {
  entityType: string;
  entityId: string;
  className?: string;
}

export const RelatedConnections: React.FC<RelatedConnectionsProps> = ({
  entityType,
  entityId,
  className = '',
}) => {
  const [data, setData] = useState<GraphNeighborsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    getGraphNeighbors(entityType, entityId, 1)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load graph neighbors');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [entityType, entityId]);

  // Helper to map entity_type to explorer route
  const getEntityRoute = (type: string, id: string): string | null => {
    const t = type.toLowerCase();
    if (t === 'mob') return `/mobs/${id}`;
    if (t === 'biome') return `/biomes/${id}`;
    if (t === 'item') return `/items/${id}`;
    if (t === 'structure') return `/structures/${id}`;
    return null;
  };

  // Helper to format relationship pill styling
  const getRelColor = (rel: string): string => {
    const r = rel.toUpperCase();
    if (r.includes('SPAWN')) return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
    if (r.includes('DROP')) return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
    if (r.includes('FOUND')) return 'bg-sky-500/10 text-sky-300 border-sky-500/30';
    if (r.includes('BREED')) return 'bg-pink-500/10 text-pink-300 border-pink-500/30';
    if (r.includes('VERSION') || r.includes('ADDED')) return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  return (
    <div
      data-testid="related-connections-panel"
      className={`rounded-xl bg-mc-card border border-mc-border p-5 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-mc-border/60">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <span>Knowledge Graph Connections</span>
            {data && (
              <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                {data.edges.length} {data.edges.length === 1 ? 'edge' : 'edges'}
              </span>
            )}
          </h3>
          <p className="text-xs text-mc-textMuted mt-0.5">
            Derived relationships cached in local SQLite (Phase 7 will introduce an interactive visual graph canvas)
          </p>
        </div>
        <SourceBadge sourceType="calculated" />
      </div>

      {loading && (
        <div className="py-8 text-center text-xs text-slate-400 animate-pulse flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Traversing local graph edges...</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/30 text-xs text-red-300">
          Could not load graph connections: {error}
        </div>
      )}

      {!loading && !error && data && data.edges.length === 0 && (
        <div
          data-testid="no-connections-message"
          className="p-5 rounded-lg bg-slate-900/50 border border-slate-800 text-center"
        >
          <div className="w-8 h-8 mx-auto mb-2 text-slate-500">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <p className="text-xs font-medium text-slate-300 mb-1">
            No derived graph connections indexed for this entity yet
          </p>
          <p className="text-[11px] text-mc-textMuted max-w-md mx-auto">
            This entity does not currently link to any of the 100 key items or canonical biomes in the local SQLite graph. Coverage will expand in future curated updates.
          </p>
        </div>
      )}

      {!loading && !error && data && data.edges.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.edges.map((edge, index) => {
            // Determine if the current entity is source or target
            const isSource =
              edge.source_entity_id.toLowerCase() === entityId.toLowerCase();
            const targetType = isSource ? edge.target_entity_type : edge.source_entity_type;
            const targetId = isSource ? edge.target_entity_id : edge.source_entity_id;

            // Find node details if present
            const node = data.nodes.find(
              (n) => n.id.toLowerCase() === targetId.toLowerCase()
            );
            const targetName = node?.name || targetId;
            const route = getEntityRoute(targetType, targetId);

            const cardContent = (
              <div
                key={`edge-${index}`}
                className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${getRelColor(
                      edge.relationship_type
                    )}`}
                  >
                    {edge.relationship_type}
                  </span>
                  <span className="text-[10px] uppercase font-mono text-slate-500">
                    {targetType}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors">
                    {targetName}
                  </span>
                  <span className="text-[11px] font-mono text-mc-textMuted">
                    {targetId}
                  </span>
                </div>

                {edge.explanation && (
                  <p className="text-[11px] text-slate-400 italic">
                    {edge.explanation}
                  </p>
                )}
              </div>
            );

            if (route) {
              return (
                <Link key={`edge-link-${index}`} to={route} className="group block">
                  {cardContent}
                </Link>
              );
            }

            return cardContent;
          })}
        </div>
      )}
    </div>
  );
};

export default RelatedConnections;

