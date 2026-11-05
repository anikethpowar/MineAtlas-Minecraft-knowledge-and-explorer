import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getFarms } from '../api/mineatlasApi';
import { FarmListItem } from '../api/types';
import EditionBadge from '../components/common/EditionBadge';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import SourceBadge from '../components/common/SourceBadge';

export const FarmsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [farms, setFarms] = useState<FarmListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const search = searchParams.get('search') || '';
  const difficulty = searchParams.get('difficulty') || '';
  const dimension = searchParams.get('dimension') || '';

  const [searchInput, setSearchInput] = useState<string>(search);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const fetchFarms = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getFarms({
        search: search || undefined,
        difficulty: difficulty || undefined,
        dimension: dimension || undefined,
      });
      setFarms(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load curated farm guides.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarms();
  }, [search, difficulty, dimension]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      next.set('search', searchInput.trim());
    } else {
      next.delete('search');
    }
    setSearchParams(next);
  };

  const handleDifficultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = new URLSearchParams(searchParams);
    if (e.target.value) {
      next.set('difficulty', e.target.value);
    } else {
      next.delete('difficulty');
    }
    setSearchParams(next);
  };

  const handleDimensionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = new URLSearchParams(searchParams);
    if (e.target.value) {
      next.set('dimension', e.target.value);
    } else {
      next.delete('dimension');
    }
    setSearchParams(next);
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  const getDifficultyBadgeColor = (diff: string | null): string => {
    switch (diff?.toLowerCase()) {
      case 'beginner':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'intermediate':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'advanced':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6" data-testid="farms-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Farm Blueprint Hub
            </h1>
            <span className="px-2.5 py-0.5 rounded text-xs font-mono font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/30">
              Curated Guides
            </span>
            <EditionBadge edition="java" />
          </div>
          <p className="text-xs sm:text-sm text-mc-textMuted max-w-2xl leading-relaxed">
            Original curated Minecraft Java Edition farm guides with visible compatibility notes and verified game mechanics.
          </p>
        </div>

        <Link
          to="/graph?type=farm&id=iron-farm&depth=1"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 border border-mc-border hover:border-orange-500/40 text-xs text-orange-400 hover:text-orange-300 font-semibold transition-colors self-start md:self-auto shadow-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="6" cy="6" r="3" />
            <circle cx="18" cy="18" r="3" />
            <circle cx="18" cy="6" r="3" />
            <path d="M8.5 7.5l7 3M8.5 6h7M18 8.5v7" />
          </svg>
          <span>Explore Farm Graph</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-mc-card border border-mc-border shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search farm guides (e.g. Iron, Raid, Villager)..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-mc-border text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-400"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs transition-colors shrink-0"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2">
          <select
            value={difficulty}
            onChange={handleDifficultyChange}
            aria-label="Filter by difficulty"
            className="px-3 py-2 rounded-lg bg-slate-900 border border-mc-border text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-400"
          >
            <option value="">All Difficulties</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>

          <select
            value={dimension}
            onChange={handleDimensionChange}
            aria-label="Filter by dimension"
            className="px-3 py-2 rounded-lg bg-slate-900 border border-mc-border text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-400"
          >
            <option value="">All Dimensions</option>
            <option value="Overworld">Overworld</option>
            <option value="The Nether">The Nether</option>
            <option value="The End">The End</option>
          </select>

          {(search || difficulty || dimension) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading && <LoadingState message="Loading curated Minecraft Java farm guides..." />}

      {error && <ErrorState error={error} onRetry={fetchFarms} />}

      {!loading && !error && farms.length === 0 && (
        <EmptyState
          title="No farm guides found"
          message="No curated farm guides match your active search or difficulty filters."
          onReset={handleResetFilters}
          resetLabel="Clear Filters"
        />
      )}

      {!loading && !error && farms.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {farms.map((farm) => (
            <Link
              key={farm.id}
              to={`/farms/${farm.id}`}
              className="group rounded-xl bg-mc-card border border-mc-border hover:border-orange-500/50 p-5 flex flex-col justify-between transition-all duration-200 shadow-sm hover:shadow-md hover:bg-mc-card/90"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <SourceBadge sourceType={farm.source_type} />
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase border ${getDifficultyBadgeColor(
                      farm.difficulty
                    )}`}
                  >
                    {farm.difficulty || 'Unrated'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                    {farm.dimension}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-100 group-hover:text-orange-400 transition-colors">
                    {farm.name}
                  </h3>
                  <span className="text-[11px] font-mono text-mc-textMuted block mt-0.5">
                    Category: {farm.category}
                  </span>
                </div>

                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                  {farm.summary}
                </p>

                {farm.estimated_output_per_hour && (
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs">
                    <span className="text-[10px] font-mono uppercase text-slate-500 block">
                      Main Output Yield
                    </span>
                    <span className="text-slate-200 font-medium">
                      {farm.estimated_output_per_hour}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-mc-border/60 flex items-center justify-between text-xs">
                <span className="text-[11px] font-mono text-orange-400/90 truncate max-w-[200px]">
                  {farm.compatibility_label}
                </span>
                <span className="font-semibold text-orange-400 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                  Read Guide &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

