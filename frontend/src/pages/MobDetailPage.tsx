import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getMobById } from '../api/mineatlasApi';
import { MobDetail } from '../api/types';
import CoverageNote from '../components/common/CoverageNote';
import EditionBadge from '../components/common/EditionBadge';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import SourceBadge from '../components/common/SourceBadge';
import VersionBadge from '../components/common/VersionBadge';
import RelatedConnections from '../components/explorers/RelatedConnections';

export const MobDetailPage: React.FC = () => {
  const { mobId } = useParams<{ mobId: string }>();
  const [mob, setMob] = useState<MobDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = () => {
    if (!mobId) return;
    setLoading(true);
    setError(null);

    getMobById(mobId)
      .then((res) => {
        setMob(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to fetch mob details');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDetail();
  }, [mobId]);

  if (loading) {
    return <LoadingState message={`Loading details for mob "${mobId}"...`} />;
  }

  if (error || !mob) {
    return (
      <div className="space-y-4">
        <Link to="/mobs" className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
          <span>&larr;</span> Back to Mobs Explorer
        </Link>
        <ErrorState error={error || 'Mob not found'} onRetry={fetchDetail} />
      </div>
    );
  }

  const hearts = mob.hp !== null ? (mob.hp / 2).toFixed(mob.hp % 2 === 0 ? 0 : 1) : null;

  return (
    <div className="space-y-8" data-testid="mob-detail-view">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between text-xs text-mc-textMuted">
        <div className="flex items-center gap-2">
          <Link to="/mobs" className="text-emerald-400 hover:text-emerald-300 transition-colors">
            Mobs Explorer
          </Link>
          <span>/</span>
          <span className="text-slate-300 font-medium">{mob.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/graph?type=mob&id=${encodeURIComponent(mob.id)}&depth=1`}
            className="px-3 py-1 rounded bg-emerald-600/90 hover:bg-emerald-500 border border-emerald-500/50 text-white font-medium transition-colors flex items-center gap-1.5"
            title="Explore connections in interactive knowledge graph"
          >
            <span>Explore connections</span>
            <span>&rarr;</span>
          </Link>
          <Link
            to="/mobs"
            className="px-3 py-1 rounded bg-slate-900 border border-mc-border text-slate-300 hover:text-white transition-colors"
          >
            &larr; All Mobs
          </Link>
        </div>
      </div>

      {/* Entity Title Header */}
      <div className="p-6 rounded-2xl bg-mc-card border border-mc-border shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-semibold uppercase bg-red-500/10 text-red-400 border border-red-500/30">
                Mob
              </span>
              <EditionBadge edition={mob.source.edition} />
              <VersionBadge version={mob.version_added} />
              <SourceBadge sourceType={mob.source.source_type} sourceUrl={mob.source.source_url} />
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {mob.name}
            </h1>
            <p className="text-sm font-mono text-mc-textMuted mt-1">ID: {mob.id}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {mob.mob_type && (
              <div className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
                Type: <strong className="text-emerald-400">{mob.mob_type}</strong>
              </div>
            )}
            {mob.category && (
              <div className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
                Category: <strong className="text-slate-200">{mob.category}</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Combat & Vitals */}
        <div className="p-5 rounded-xl bg-mc-card border border-mc-border flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 border-b border-mc-border/60 pb-2">
            Combat &amp; Vitals
          </h2>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-mc-textMuted block text-[10px] uppercase font-mono mb-1">
                Max Health
              </span>
              <span className="text-lg font-bold font-mono text-red-400">
                {mob.hp !== null ? `${mob.hp} HP (${hearts} ♥)` : 'N/A'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-mc-textMuted block text-[10px] uppercase font-mono mb-1">
                Experience Drops
              </span>
              <span className="text-lg font-bold font-mono text-emerald-400">
                {mob.xp_min !== null && mob.xp_max !== null
                  ? `${mob.xp_min} - ${mob.xp_max} XP`
                  : 'None'}
              </span>
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-300 block mb-2">
              Damage by Difficulty
            </span>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] font-mono text-mc-textMuted block">Easy</span>
                <span className="font-mono font-bold text-slate-200">
                  {mob.damage_easy !== null ? `${mob.damage_easy} HP` : '0'}
                </span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] font-mono text-mc-textMuted block">Normal</span>
                <span className="font-mono font-bold text-slate-200">
                  {mob.damage_normal !== null ? `${mob.damage_normal} HP` : '0'}
                </span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] font-mono text-mc-textMuted block">Hard</span>
                <span className="font-mono font-bold text-red-300">
                  {mob.damage_hard !== null ? `${mob.damage_hard} HP` : '0'}
                </span>
              </div>
            </div>
          </div>

          {mob.behavior && (
            <div className="pt-2 text-xs">
              <span className="text-mc-textMuted block font-mono text-[10px] uppercase mb-1">
                Behavior
              </span>
              <p className="text-slate-200 bg-slate-900/60 p-2.5 rounded border border-slate-800">
                {mob.behavior}
              </p>
            </div>
          )}
        </div>

        {/* Breeding, Taming & Spawning */}
        <div className="p-5 rounded-xl bg-mc-card border border-mc-border flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 border-b border-mc-border/60 pb-2">
            Breeding, Taming &amp; Spawning
          </h2>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-mc-textMuted block text-[10px] uppercase font-mono mb-1">
                Tameable
              </span>
              <span className={`text-base font-bold font-mono ${mob.tameable ? 'text-emerald-400' : 'text-slate-500'}`}>
                {mob.tameable ? 'Yes' : 'No'}
              </span>
              {mob.taming_method && (
                <p className="text-[11px] text-slate-300 mt-1 italic">{mob.taming_method}</p>
              )}
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-mc-textMuted block text-[10px] uppercase font-mono mb-1">
                Breedable
              </span>
              <span className={`text-base font-bold font-mono ${mob.breedable ? 'text-pink-400' : 'text-slate-500'}`}>
                {mob.breedable ? 'Yes' : 'No'}
              </span>
              {mob.breeding_item && (
                <p className="text-[11px] text-slate-300 mt-1 italic">Item: {mob.breeding_item}</p>
              )}
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-300 block mb-1">
              Natural Spawn Conditions
            </span>
            <p className="text-xs text-slate-200 bg-slate-900/60 p-3 rounded-lg border border-slate-800 leading-relaxed">
              {mob.spawn_conditions || 'Specific spawn conditions not specified in Astroworld API response.'}
            </p>
          </div>

          {mob.notes && (
            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-1">
                Curated Notes
              </span>
              <p className="text-xs text-mc-textMuted bg-slate-900/40 p-2.5 rounded border border-slate-800">
                {mob.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Scope and Provenance Card */}
      <CoverageNote
        entityType="mob"
        customNote={mob.coverage_note || undefined}
      />

      {/* Local Knowledge Graph Related Connections */}
      <RelatedConnections entityType="mob" entityId={mob.id} />
    </div>
  );
};

export default MobDetailPage;

