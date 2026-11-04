import React, { useEffect, useState } from 'react';
import { getHealthStatus, HealthResponse } from '../api/mineatlasApi';

/**
 * HomePage Component
 *
 * This is the primary landing view for Phase 1: Project Foundation.
 * It demonstrates:
 * 1. Project identity and relationship-exploration purpose.
 * 2. Active backend health check (GET /api/health) with Loading, Success, and Error states.
 * 3. Scope notes regarding future Java Edition data ingestion and knowledge graph features.
 */
export const HomePage: React.FC = () => {
  // React State Hooks:
  // - health: Holds the parsed API response once fetched successfully.
  // - isLoading: True while the network request is in flight.
  // - error: Holds any error message if the fetch fails.
  // - lastChecked: Records the local time when the last check completed.
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  /**
   * fetchHealth calls our FastAPI backend through the api module.
   * Defined with async/await for clarity and readability.
   */
  const fetchHealth = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getHealthStatus();
      setHealth(data);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unknown network error occurred';
      setError(message);
      setHealth(null);
      setLastChecked(new Date().toLocaleTimeString());
    } finally {
      setIsLoading(false);
    }
  };

  // useEffect runs once when the component mounts on page load.
  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="bg-mc-card border border-mc-border rounded-xl p-6 sm:p-8 relative overflow-hidden">
        {/* Subtle accent glow in background */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Phase 1: Foundation
            </span>
            <span className="text-xs text-mc-textMuted font-mono">
              Minecraft Java Edition
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            MineAtlas
          </h2>
          <p className="text-lg text-emerald-300 font-medium mb-4">
            Minecraft Java Edition Atlas &amp; Knowledge Graph Explorer
          </p>
          <p className="text-mc-textMuted text-sm sm:text-base leading-relaxed mb-6">
            MineAtlas is designed to explore and visualize deep relationships
            across the Minecraft Java Edition world — connecting biomes, mobs,
            items, key blocks, structures, enchantments, trades, and curated farm guides
            into an interactive, graph-driven knowledge base.
          </p>

          {/* Relationship examples preview */}
          <div className="bg-[#111618] border border-mc-border rounded-lg p-4">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-3">
              Planned Knowledge Graph Relationships:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 text-xs font-mono bg-mc-card px-3 py-2 rounded border border-mc-border/60">
                <span className="text-emerald-400 font-semibold">Zombie</span>
                <span className="text-slate-500">→ DROPS →</span>
                <span className="text-amber-300">Rotten Flesh</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono bg-mc-card px-3 py-2 rounded border border-mc-border/60">
                <span className="text-emerald-400 font-semibold">Plains</span>
                <span className="text-slate-500">→ CONTAINS →</span>
                <span className="text-amber-300">Village</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono bg-mc-card px-3 py-2 rounded border border-mc-border/60">
                <span className="text-emerald-400 font-semibold">Iron Farm</span>
                <span className="text-slate-500">→ PRODUCES →</span>
                <span className="text-amber-300">Iron Ingot</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Backend Health Status Section */}
      <section className="bg-mc-card border border-mc-border rounded-xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg font-bold text-white">
                Backend System Health
              </h3>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                GET /api/health
              </span>
            </div>
            <p className="text-xs text-mc-textMuted mt-1">
              Verifies the communication bridge between this React frontend and the FastAPI backend.
            </p>
          </div>

          <button
            onClick={fetchHealth}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white transition-colors flex items-center gap-2 border border-emerald-500/30"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-3.5 w-3.5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Checking...
              </>
            ) : (
              <>
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Re-check Health
              </>
            )}
          </button>
        </div>

        {/* State Display 1: LOADING */}
        {isLoading && (
          <div className="p-6 rounded-lg bg-[#111618] border border-mc-border flex items-center justify-center space-x-3 text-slate-300">
            <div className="w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
            <span className="text-sm">Connecting to FastAPI backend (/api/health)...</span>
          </div>
        )}

        {/* State Display 2: ERROR */}
        {!isLoading && error && (
          <div className="p-5 rounded-lg bg-red-950/30 border border-red-500/40 text-red-200">
            <div className="flex items-start gap-3">
              <div className="p-1 rounded bg-red-500/20 text-red-400 mt-0.5">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-red-300">
                  Backend Connection Failed
                </h4>
                <p className="text-xs text-red-300/80 mt-1 font-mono break-all">
                  {error}
                </p>
                <div className="mt-3 text-xs text-slate-400 bg-black/40 p-3 rounded border border-red-500/20">
                  <p className="font-semibold text-slate-300 mb-1">How to fix:</p>
                  <p>Start the FastAPI backend with:</p>
                  <code className="text-emerald-400 block mt-1 font-mono">
                    ./venv/bin/uvicorn app.main:app --app-dir backend --reload --port 8000
                  </code>
                </div>
              </div>
            </div>
            {lastChecked && (
              <div className="mt-3 text-right text-[11px] text-red-300/60 font-mono">
                Last attempted: {lastChecked}
              </div>
            )}
          </div>
        )}

        {/* State Display 3: SUCCESS */}
        {!isLoading && !error && health && (
          <div className="rounded-lg bg-[#111618] border border-emerald-500/30 p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
              <span className="text-sm font-semibold text-emerald-400">
                Backend Online &amp; Responding
              </span>
              {lastChecked && (
                <span className="text-xs text-slate-500 font-mono ml-auto">
                  Checked at: {lastChecked}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded bg-mc-card border border-mc-border">
                <div className="text-[11px] uppercase tracking-wider text-mc-textMuted font-medium">
                  Status
                </div>
                <div className="text-sm font-mono font-bold text-emerald-400 mt-0.5">
                  {health.status}
                </div>
              </div>

              <div className="p-3 rounded bg-mc-card border border-mc-border">
                <div className="text-[11px] uppercase tracking-wider text-mc-textMuted font-medium">
                  Service
                </div>
                <div className="text-sm font-mono font-semibold text-white mt-0.5">
                  {health.service}
                </div>
              </div>

              <div className="p-3 rounded bg-mc-card border border-mc-border">
                <div className="text-[11px] uppercase tracking-wider text-mc-textMuted font-medium">
                  Target Edition
                </div>
                <div className="text-sm font-mono font-semibold text-amber-300 mt-0.5">
                  {health.edition}
                </div>
              </div>

              <div className="p-3 rounded bg-mc-card border border-mc-border">
                <div className="text-[11px] uppercase tracking-wider text-mc-textMuted font-medium">
                  Phase
                </div>
                <div className="text-sm font-mono font-semibold text-emerald-300 mt-0.5">
                  {health.phase}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Architecture & Scope Foundation Notes */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl bg-mc-card border border-mc-border">
          <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Architectural Guardrails
          </h4>
          <ul className="text-xs text-mc-textMuted space-y-2 list-disc list-inside leading-relaxed">
            <li>
              <strong className="text-slate-300">Java Edition Only:</strong> No bedrock parity conflicts or edition confusion.
            </li>
            <li>
              <strong className="text-slate-300">Zero Direct Browser Calls:</strong> Frontend only queries the FastAPI backend.
            </li>
            <li>
              <strong className="text-slate-300">Minimal Footprint:</strong> Designed to run locally on Linux Mint using SQLite in future phases without Docker or heavy databases.
            </li>
          </ul>
        </div>

        <div className="p-5 rounded-xl bg-mc-card border border-mc-border">
          <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            What is Not Built Yet (By Design)
          </h4>
          <ul className="text-xs text-mc-textMuted space-y-2 list-disc list-inside leading-relaxed">
            <li>Astroworld upstream data ingestion (planned for Phase 2).</li>
            <li>SQLite tables and database persistence models.</li>
            <li>Interactive graph visualization and search filters.</li>
            <li>Curated farm guides and calculated difficulty metrics.</li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

