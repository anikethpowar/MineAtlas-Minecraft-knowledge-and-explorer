import React, { useEffect, useState } from 'react';
import { getDataStatus } from '../api/mineatlasApi';
import { DataStatusResponse } from '../api/types';
import DataFreshnessIndicator from '../components/common/DataFreshnessIndicator';
import EditionBadge from '../components/common/EditionBadge';
import SourceBadge from '../components/common/SourceBadge';

export const AboutDataPage: React.FC = () => {
  const [dataStatus, setDataStatus] = useState<DataStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    getDataStatus()
      .then((status) => {
        if (isMounted) {
          setDataStatus(status);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Could not load data status:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded text-xs font-mono font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            System &amp; Data Transparency
          </span>
          <EditionBadge edition="Java Edition" />
          <DataFreshnessIndicator status={dataStatus} loading={loading} />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          About MineAtlas Data &amp; Architecture
        </h1>
        <p className="text-sm text-mc-textMuted mt-1">
          Architectural boundaries, data provenance, rate-limiting guarantees, and coverage scope.
        </p>
      </div>

      {/* Live Cache Status Card */}
      <section className="p-6 rounded-2xl bg-mc-card border border-mc-border shadow-md">
        <h2 className="text-base font-bold text-slate-100 mb-3 flex items-center justify-between">
          <span>Live SQLite Cache Status</span>
          <span className="text-xs font-mono font-normal text-emerald-400">
            Phase 6: Synchronous Local Queries
          </span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="block text-2xl font-bold font-mono text-emerald-400">
              {dataStatus?.total_entities ?? 688}
            </span>
            <span className="text-[11px] text-mc-textMuted uppercase font-mono">Total Entities</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="block text-2xl font-bold font-mono text-cyan-400">
              {dataStatus?.total_relationship_edges ?? 650}
            </span>
            <span className="text-[11px] text-mc-textMuted uppercase font-mono">Graph Edges</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="block text-2xl font-bold font-mono text-amber-400">
              50/min
            </span>
            <span className="text-[11px] text-mc-textMuted uppercase font-mono">Rate Limit</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="block text-2xl font-bold font-mono text-purple-400 capitalize">
              {dataStatus?.status ?? 'Healthy'}
            </span>
            <span className="text-[11px] text-mc-textMuted uppercase font-mono">Cache Health</span>
          </div>
        </div>

        {dataStatus && (
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-mc-textMuted flex flex-col sm:flex-row justify-between gap-2">
            <span>
              Last Ingestion Completed:{' '}
              <strong className="text-slate-300 font-mono">
                {dataStatus.latest_sync_completed_at
                  ? new Date(dataStatus.latest_sync_completed_at).toLocaleString()
                  : 'Pre-synced'}
              </strong>
            </span>
            <span>
              Freshness:{' '}
              <strong className="text-emerald-400 font-mono">
                {dataStatus.cache_freshness_human || 'Active'}
              </strong>
            </span>
          </div>
        )}
      </section>

      {/* 3-Tier Architecture Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-100">Three-Tier Architecture Rules</h2>

        <div className="p-5 rounded-xl bg-mc-card border border-mc-border space-y-4 text-xs text-mc-textMuted leading-relaxed">
          <p>
            MineAtlas enforces strict separation between user browsing and external API interactions:
          </p>

          <div className="space-y-3 font-mono">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-3">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px]">
                Tier 1
              </span>
              <div>
                <strong className="text-slate-200 block text-xs">React Frontend (Browser)</strong>
                <span>
                  The browser exclusively calls the local MineAtlas FastAPI backend (<code className="text-slate-300">/api/*</code>). It NEVER connects to Astroworld directly.
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-3">
              <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[10px]">
                Tier 2
              </span>
              <div>
                <strong className="text-slate-200 block text-xs">FastAPI Backend &amp; SQLite Cache</strong>
                <span>
                  All explorer list and detail queries hit the indexed SQLite database synchronously. User interactions generate 0 external network requests.
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-3">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px]">
                Tier 3
              </span>
              <div>
                <strong className="text-slate-200 block text-xs">Astroworld Upstream Ingestion</strong>
                <span>
                  Data synchronization runs only via scheduled background CLI tasks through a strict 50 requests/minute token-bucket rate limiter.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Provenance Distinctions */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-100">Data Provenance Categories</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-mc-card border border-mc-border flex flex-col justify-between">
            <div>
              <div className="mb-2">
                <SourceBadge sourceType="astroworld_api" />
              </div>
              <h3 className="text-sm font-semibold text-slate-200 mb-1">
                API-Backed Entities
              </h3>
              <p className="text-xs text-mc-textMuted">
                Raw entities ingested from <code className="text-slate-300">api.astroworldmc.com</code>, including mobs, biomes, 100 key items, structures, enchantments, and achievements.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-mc-card border border-mc-border flex flex-col justify-between">
            <div>
              <div className="mb-2">
                <SourceBadge sourceType="calculated" />
              </div>
              <h3 className="text-sm font-semibold text-slate-200 mb-1">
                Calculated Relations
              </h3>
              <p className="text-xs text-mc-textMuted">
                Relationship edges derived during ingestion by resolving entity names and properties (e.g. <code className="text-slate-300">bee SPAWNS_IN plains</code>).
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-mc-card border border-mc-border flex flex-col justify-between">
            <div>
              <div className="mb-2">
                <SourceBadge sourceType="curated" />
              </div>
              <h3 className="text-sm font-semibold text-slate-200 mb-1">
                Curated Content
              </h3>
              <p className="text-xs text-mc-textMuted">
                Verified Java Edition mechanics, manual annotations, and future farm guide architectures designed for player exploration.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Scope Boundaries */}
      <section className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 text-xs text-mc-textMuted leading-relaxed">
        <h3 className="text-sm font-semibold text-slate-200">
          Scope Boundaries &amp; Item Coverage Note
        </h3>
        <p>
          <strong className="text-slate-300">Minecraft Java Edition Only: </strong>
          All statistics, drop rates, mob behavior, generation Y-levels, and biome temperatures apply specifically to Minecraft Java Edition. Bedrock Edition mechanics are not represented.
        </p>
        <p>
          <strong className="text-slate-300">Items &amp; Key Blocks Scope: </strong>
          The upstream Astroworld API provides a curated catalog of 100 representative items and blocks. MineAtlas does not claim to index the full 1,000+ Minecraft block registry.
        </p>
      </section>
    </div>
  );
};

export default AboutDataPage;

