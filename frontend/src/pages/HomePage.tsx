import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDataStatus } from '../api/mineatlasApi';
import { DataStatusResponse } from '../api/types';
import DataFreshnessIndicator from '../components/common/DataFreshnessIndicator';
import EditionBadge from '../components/common/EditionBadge';

export const HomePage: React.FC = () => {
  const [dataStatus, setDataStatus] = useState<DataStatusResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);
  const [quickSearch, setQuickSearch] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    getDataStatus()
      .then((status) => {
        if (isMounted) {
          setDataStatus(status);
          setLoadingStatus(false);
        }
      })
      .catch((err) => {
        console.warn('Could not load data status:', err);
        if (isMounted) {
          setLoadingStatus(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      navigate(`/search?q=${encodeURIComponent(quickSearch.trim())}`);
    }
  };

  const explorers = [
    {
      title: 'Mobs Explorer',
      description: 'Hostile, passive, neutral, and boss mobs with health, damage, breeding, and spawn data.',
      count: dataStatus?.cached_counts?.mob ?? 76,
      countLabel: 'mobs',
      path: '/mobs',
      accentColor: 'border-red-500/30 text-red-400 group-hover:border-red-500/60',
      badge: 'Combat & Traits',
    },
    {
      title: 'Biomes Explorer',
      description: 'Overworld, Nether, and The End biomes categorized with climate and temperature levels.',
      count: dataStatus?.cached_counts?.biome ?? 64,
      countLabel: 'biomes',
      path: '/biomes',
      accentColor: 'border-emerald-500/30 text-emerald-400 group-hover:border-emerald-500/60',
      badge: 'Dimensions & Climate',
    },
    {
      title: 'Items & Key Blocks',
      description: 'Representative selection of 100 key items and blocks with stack sizes and durabilities.',
      count: dataStatus?.cached_counts?.item ?? 100,
      countLabel: 'key items & blocks',
      path: '/items',
      accentColor: 'border-sky-500/30 text-sky-400 group-hover:border-sky-500/60',
      badge: 'Representative 100',
    },
    {
      title: 'Structures Explorer',
      description: 'World-generated settlements, temples, bastions, and ruins with Y-level generation ranges.',
      count: dataStatus?.cached_counts?.structure ?? 24,
      countLabel: 'structures',
      path: '/structures',
      accentColor: 'border-amber-500/30 text-amber-400 group-hover:border-amber-500/60',
      badge: 'World Generation',
    },
  ];

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="bg-mc-card border border-mc-border rounded-2xl p-6 sm:p-10 relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2.5 mb-4">
            <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Phase 6: Core Explorer
            </span>
            <EditionBadge edition="Java Edition" />
            <DataFreshnessIndicator status={dataStatus} loading={loadingStatus} />
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
            Explore Minecraft Java Edition
          </h1>
          <p className="text-mc-textMuted text-base sm:text-lg leading-relaxed mb-8">
            MineAtlas indexes entity specifications and deep graph relationships across Minecraft Java Edition.
            Browse mobs, biomes, representative key blocks, and world structures served directly from local SQLite cache.
          </p>

          {/* Quick Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2 max-w-xl">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <input
                type="text"
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                placeholder="Search mobs, biomes, items, structures... (e.g. creeper, plains, diamond)"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900 border border-mc-border text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors shadow-md shadow-emerald-950 flex items-center justify-center gap-2 shrink-0"
            >
              <span>Search Atlas</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </form>
        </div>
      </section>

      {/* Explorer Modules Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Core Explorers</h2>
            <p className="text-xs text-mc-textMuted">
              Filterable registries powered by local SQLite with instant response times
            </p>
          </div>
          <Link
            to="/about-data"
            className="text-xs font-mono text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
          >
            <span>Data Transparency</span>
            <span>&rarr;</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {explorers.map((exp) => (
            <Link
              key={exp.path}
              to={exp.path}
              className="group p-5 rounded-xl bg-mc-card border border-mc-border hover:border-mc-emerald hover:bg-mc-cardHover transition-all flex flex-col justify-between shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-mono border ${exp.accentColor}`}>
                    {exp.badge}
                  </span>
                  <span className="text-xs font-mono font-semibold text-slate-400">
                    {exp.count} {exp.countLabel}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-100 group-hover:text-emerald-300 transition-colors mb-2">
                  {exp.title}
                </h3>
                <p className="text-xs text-mc-textMuted leading-relaxed mb-4">
                  {exp.description}
                </p>
              </div>

              <div className="pt-3 border-t border-mc-border/60 flex items-center justify-between text-xs font-semibold text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                <span>Browse {exp.title}</span>
                <span>&rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Architecture & Ingestion Pipeline Banner */}
      <section className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-[#121619] border border-mc-border">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-semibold block mb-1">
              Architecture &amp; Rate-Limit Safety
            </span>
            <h3 className="text-lg font-bold text-slate-100 mb-2">
              Three-Tier Isolated Architecture
            </h3>
            <p className="text-xs text-mc-textMuted leading-relaxed">
              The React frontend only queries our local FastAPI backend. Upstream Astroworld API calls are handled strictly in the background with a 50 req/min token bucket limiter, caching all entities in SQLite. You enjoy instant zero-latency browsing without putting load on external servers.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-3 rounded-xl bg-mc-card border border-mc-border text-center">
              <span className="block text-xl font-bold font-mono text-emerald-400">
                {dataStatus?.total_entities ?? 688}
              </span>
              <span className="text-[10px] text-mc-textMuted uppercase font-mono">Entities</span>
            </div>
            <div className="p-3 rounded-xl bg-mc-card border border-mc-border text-center">
              <span className="block text-xl font-bold font-mono text-cyan-400">
                {dataStatus?.total_relationship_edges ?? 650}
              </span>
              <span className="text-[10px] text-mc-textMuted uppercase font-mono">Graph Edges</span>
            </div>
            <div className="p-3 rounded-xl bg-mc-card border border-mc-border text-center">
              <span className="block text-xl font-bold font-mono text-amber-400">
                &le; 50/m
              </span>
              <span className="text-[10px] text-mc-textMuted uppercase font-mono">Rate Limit</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
