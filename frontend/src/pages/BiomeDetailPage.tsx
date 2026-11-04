import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getBiomeById } from '../api/mineatlasApi';
import { BiomeDetail } from '../api/types';
import CoverageNote from '../components/common/CoverageNote';
import EditionBadge from '../components/common/EditionBadge';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import SourceBadge from '../components/common/SourceBadge';
import VersionBadge from '../components/common/VersionBadge';
import RelatedConnections from '../components/explorers/RelatedConnections';

export const BiomeDetailPage: React.FC = () => {
  const { biomeId } = useParams<{ biomeId: string }>();
  const [biome, setBiome] = useState<BiomeDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = () => {
    if (!biomeId) return;
    setLoading(true);
    setError(null);

    getBiomeById(biomeId)
      .then((res) => {
        setBiome(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to fetch biome details');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDetail();
  }, [biomeId]);

  if (loading) {
    return <LoadingState message={`Loading details for biome "${biomeId}"...`} />;
  }

  if (error || !biome) {
    return (
      <div className="space-y-4">
        <Link to="/biomes" className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
          <span>&larr;</span> Back to Biomes Explorer
        </Link>
        <ErrorState error={error || 'Biome not found'} onRetry={fetchDetail} />
      </div>
    );
  }

  const dimLower = (biome.dimension || '').toLowerCase();
  let dimBadge = 'Overworld';
  let dimClass = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
  if (dimLower.includes('nether')) {
    dimBadge = 'Nether';
    dimClass = 'bg-red-500/10 text-red-300 border-red-500/30';
  } else if (dimLower.includes('end')) {
    dimBadge = 'The End';
    dimClass = 'bg-purple-500/10 text-purple-300 border-purple-500/30';
  }

  return (
    <div className="space-y-8" data-testid="biome-detail-view">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between text-xs text-mc-textMuted">
        <div className="flex items-center gap-2">
          <Link to="/biomes" className="text-emerald-400 hover:text-emerald-300 transition-colors">
            Biomes Explorer
          </Link>
          <span>/</span>
          <span className="text-slate-300 font-medium">{biome.name}</span>
        </div>
        <Link
          to="/biomes"
          className="px-3 py-1 rounded bg-slate-900 border border-mc-border text-slate-300 hover:text-white transition-colors"
        >
          &larr; All Biomes
        </Link>
      </div>

      {/* Entity Title Header */}
      <div className="p-6 rounded-2xl bg-mc-card border border-mc-border shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-semibold border ${dimClass}`}>
                {dimBadge}
              </span>
              <EditionBadge edition={biome.source.edition} />
              <VersionBadge version={biome.version_added} />
              <SourceBadge sourceType={biome.source.source_type} sourceUrl={biome.source.source_url} />
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {biome.name}
            </h1>
            <p className="text-sm font-mono text-mc-textMuted mt-1">ID: {biome.id}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {biome.category && (
              <div className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
                Category: <strong className="text-emerald-400">{biome.category}</strong>
              </div>
            )}
            {biome.rarity && (
              <div className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
                Rarity: <strong className="text-amber-300">{biome.rarity}</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Climate & Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl bg-mc-card border border-mc-border flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 border-b border-mc-border/60 pb-2">
            Climate &amp; Environmental Factors
          </h2>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-mc-textMuted block text-[10px] uppercase font-mono mb-1">
                Base Temperature
              </span>
              <span className="text-lg font-bold font-mono text-emerald-400">
                {biome.temperature !== null ? `${biome.temperature}°C` : 'N/A'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-mc-textMuted block text-[10px] uppercase font-mono mb-1">
                Precipitation Type
              </span>
              <span className="text-lg font-bold font-mono text-sky-400 capitalize">
                {biome.precipitation || 'None'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-mc-textMuted block text-[10px] uppercase font-mono mb-1">
                Dimension
              </span>
              <span className="text-sm font-semibold text-slate-200">
                {dimBadge}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-mc-textMuted block text-[10px] uppercase font-mono mb-1">
                Generation Rarity
              </span>
              <span className="text-sm font-semibold text-slate-200 capitalize">
                {biome.rarity || 'Common'}
              </span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-mc-card border border-mc-border flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 border-b border-mc-border/60 pb-2">
            Curated Notes &amp; Features
          </h2>

          <div className="flex-1">
            <span className="text-xs font-semibold text-slate-300 block mb-1">
              Description &amp; Flora
            </span>
            <p className="text-xs text-slate-200 bg-slate-900/60 p-3 rounded-lg border border-slate-800 leading-relaxed">
              {biome.notes || 'No extended notes provided for this biome in the current upstream dataset.'}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 text-[11px] text-mc-textMuted">
            <span className="font-semibold text-slate-300">Java Edition Consistency: </span>
            Biomes correspond strictly to Minecraft Java Edition terrain generation.
          </div>
        </div>
      </div>

      {/* Scope and Provenance Card */}
      <CoverageNote
        entityType="biome"
        customNote={biome.coverage_note || undefined}
      />

      {/* Local Knowledge Graph Related Connections */}
      <RelatedConnections entityType="biome" entityId={biome.id} />
    </div>
  );
};

export default BiomeDetailPage;

