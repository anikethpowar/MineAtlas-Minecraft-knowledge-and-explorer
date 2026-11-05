import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getStructureById } from '../api/mineatlasApi';
import { StructureDetail } from '../api/types';
import CoverageNote from '../components/common/CoverageNote';
import EditionBadge from '../components/common/EditionBadge';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import SourceBadge from '../components/common/SourceBadge';
import VersionBadge from '../components/common/VersionBadge';
import RelatedConnections from '../components/explorers/RelatedConnections';

export const StructureDetailPage: React.FC = () => {
  const { structureId } = useParams<{ structureId: string }>();
  const [structure, setStructure] = useState<StructureDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = () => {
    if (!structureId) return;
    setLoading(true);
    setError(null);

    getStructureById(structureId)
      .then((res) => {
        setStructure(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to fetch structure details');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDetail();
  }, [structureId]);

  if (loading) {
    return <LoadingState message={`Loading details for structure "${structureId}"...`} />;
  }

  if (error || !structure) {
    return (
      <div className="space-y-4">
        <Link to="/structures" className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
          <span>&larr;</span> Back to Structures Explorer
        </Link>
        <ErrorState error={error || 'Structure not found'} onRetry={fetchDetail} />
      </div>
    );
  }

  const dimLower = (structure.dimension || '').toLowerCase();
  let dimBadge = 'Overworld';
  let dimClass = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
  if (dimLower.includes('nether')) {
    dimBadge = 'Nether';
    dimClass = 'bg-red-500/10 text-red-300 border-red-500/30';
  } else if (dimLower.includes('end')) {
    dimBadge = 'The End';
    dimClass = 'bg-purple-500/10 text-purple-300 border-purple-500/30';
  }

  const yRange =
    structure.y_min !== null && structure.y_max !== null
      ? `Y: ${structure.y_min} to ${structure.y_max}`
      : structure.y_min !== null
      ? `Y: ≥ ${structure.y_min}`
      : 'Surface / Varied Levels';

  return (
    <div className="space-y-8" data-testid="structure-detail-view">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between text-xs text-mc-textMuted">
        <div className="flex items-center gap-2">
          <Link to="/structures" className="text-emerald-400 hover:text-emerald-300 transition-colors">
            Structures Explorer
          </Link>
          <span>/</span>
          <span className="text-slate-300 font-medium">{structure.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/graph?type=structure&id=${encodeURIComponent(structure.id)}&depth=1`}
            className="px-3 py-1 rounded bg-emerald-600/90 hover:bg-emerald-500 border border-emerald-500/50 text-white font-medium transition-colors flex items-center gap-1.5"
            title="Explore connections in interactive knowledge graph"
          >
            <span>Explore connections</span>
            <span>&rarr;</span>
          </Link>
          <Link
            to="/structures"
            className="px-3 py-1 rounded bg-slate-900 border border-mc-border text-slate-300 hover:text-white transition-colors"
          >
            &larr; All Structures
          </Link>
        </div>
      </div>

      {/* Entity Title Header */}
      <div className="p-6 rounded-2xl bg-mc-card border border-mc-border shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-semibold border ${dimClass}`}>
                {dimBadge}
              </span>
              <EditionBadge edition={structure.source.edition} />
              <VersionBadge version={structure.version_added} />
              <SourceBadge sourceType={structure.source.source_type} sourceUrl={structure.source.source_url} />
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {structure.name}
            </h1>
            <p className="text-sm font-mono text-mc-textMuted mt-1">ID: {structure.id}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {structure.category && (
              <div className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
                Category: <strong className="text-amber-300">{structure.category}</strong>
              </div>
            )}
            {structure.rarity && (
              <div className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
                Rarity: <strong className="text-slate-200">{structure.rarity}</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Generation & Guidance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl bg-mc-card border border-mc-border flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 border-b border-mc-border/60 pb-2">
            World Generation &amp; Elevation
          </h2>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-mc-textMuted block text-[10px] uppercase font-mono mb-1">
                Altitude Bounds
              </span>
              <span className="text-base font-bold font-mono text-emerald-400">
                {yRange}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-mc-textMuted block text-[10px] uppercase font-mono mb-1">
                Dimension
              </span>
              <span className="text-base font-bold text-slate-200">
                {dimBadge}
              </span>
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-300 block mb-1">
              Exploration &amp; Finding Strategy
            </span>
            <p className="text-xs text-slate-200 bg-slate-900/60 p-3 rounded-lg border border-slate-800 leading-relaxed">
              {structure.how_to_find || 'Locate by exploring suitable biomes in the designated dimension.'}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-mc-card border border-mc-border flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 border-b border-mc-border/60 pb-2">
            Features &amp; Notes
          </h2>

          <div className="flex-1">
            <span className="text-xs font-semibold text-slate-300 block mb-1">
              Structure Details
            </span>
            <p className="text-xs text-slate-200 bg-slate-900/60 p-3 rounded-lg border border-slate-800 leading-relaxed">
              {structure.notes || 'World-generated structure in Minecraft Java Edition.'}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 text-[11px] text-mc-textMuted">
            <span className="font-semibold text-slate-300">Java Edition Consistency: </span>
            Structure generation bounding boxes and loot tables conform to Java Edition mechanics.
          </div>
        </div>
      </div>

      {/* Scope and Provenance Card */}
      <CoverageNote
        entityType="structure"
        customNote={structure.coverage_note || undefined}
      />

      {/* Local Knowledge Graph Related Connections */}
      <RelatedConnections entityType="structure" entityId={structure.id} />
    </div>
  );
};

export default StructureDetailPage;

