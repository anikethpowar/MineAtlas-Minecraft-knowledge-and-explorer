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
            Synchronous Local SQLite Queries
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
              <p className="text-xs text-mc-textMuted leading-relaxed mb-3">
                Raw entity registries ingested from <code className="text-slate-300">api.astroworldmc.com</code>, including mobs, biomes, 100 key items and blocks, structures, enchantments, and advancements.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800">
              <a
                href="https://api.astroworldmc.com"
                target="_blank"
                rel="noopener"
                className="text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors inline-flex items-center gap-1"
              >
                <span>Powered by Astroworld API</span>
                <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-mc-card border border-mc-border flex flex-col justify-between">
            <div>
              <div className="mb-2">
                <SourceBadge sourceType="calculated" />
              </div>
              <h3 className="text-sm font-semibold text-slate-200 mb-1">
                Calculated Relations &amp; Tools
              </h3>
              <p className="text-xs text-mc-textMuted leading-relaxed">
                Deterministic mathematical computations and graph relations, including 8:1 Nether portal scaling, spawn sphere Euclidean geometry, and semantic entity links (e.g. <code className="text-slate-300">zombie DROPS rotten_flesh</code>).
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-mc-card border border-mc-border flex flex-col justify-between">
            <div>
              <div className="mb-2">
                <SourceBadge sourceType="curated" />
              </div>
              <h3 className="text-sm font-semibold text-slate-200 mb-1">
                Curated Content &amp; Guides
              </h3>
              <p className="text-xs text-mc-textMuted leading-relaxed">
                Handcrafted, version-verified technical farm architectures (Iron Farm, Raid Farm, Villager Breeder) and canonical dimension specifications with version compatibility annotations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Upstream Attribution Banner */}
      <section className="p-4 sm:p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase text-sky-400 font-semibold block mb-0.5">
            Upstream Attribution
          </span>
          <p className="text-xs text-slate-300">
            MineAtlas entity data is cached and synchronized with the public Astroworld API under proper attribution.
          </p>
        </div>
        <a
          href="https://api.astroworldmc.com"
          target="_blank"
          rel="noopener"
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-semibold font-mono transition-colors shrink-0"
        >
          Powered by Astroworld API
        </a>
      </section>

      {/* Scope Boundaries & Disclaimers */}
      <section className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4 text-xs text-mc-textMuted leading-relaxed">
        <h3 className="text-sm font-semibold text-slate-200">
          Scope Boundaries, Limitations &amp; Disclaimers
        </h3>

        <div className="space-y-3">
          <p>
            <strong className="text-slate-300">Minecraft Java Edition Only: </strong>
            All statistics, drop tables, mob pathfinding, spawning distances, Y-generation levels, and farm mechanics apply strictly to Minecraft Java Edition. Bedrock Edition mechanics (such as iron golem spawning thresholds or raid mechanics) are fundamentally different and are not supported.
          </p>

          <p>
            <strong className="text-slate-300">Items &amp; Key Blocks Scope: </strong>
            The upstream Astroworld API provides a representative catalog of 100 key items and blocks. MineAtlas does not claim complete indexation of the full 1,000+ Minecraft block registry.
          </p>

          <p>
            <strong className="text-slate-300">Curated Farm Guides Disclaimer: </strong>
            Farm guides represent curated technical designs. Technical mechanics can shift across minor and major Java updates (e.g., Java 1.21 Ominous Bottle changes for raid triggers). Always review the guide&apos;s compatibility notice before survival construction.
          </p>

          <p>
            <strong className="text-slate-300">World Atlas &amp; Calculators Limitations: </strong>
            MineAtlas does not analyze arbitrary player seeds, compute climate noise maps, or locate structures for a seed. Nether portal conversions give the expected coordinate-scale target only, not guaranteed portal-linking predictions. Mob spawn spheres model geometric boundaries, not live mob-cap simulation engines.
          </p>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            <strong className="text-slate-300 block mb-0.5">Legal Disclaimer:</strong>
            Not an official Minecraft product. Not approved by or associated with Mojang or Microsoft.
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutDataPage;

