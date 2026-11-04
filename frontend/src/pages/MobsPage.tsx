import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getMobs } from '../api/mineatlasApi';
import { MobListItem, PaginatedResponse } from '../api/types';
import CoverageNote from '../components/common/CoverageNote';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import ExplorerToolbar from '../components/common/ExplorerToolbar';
import LoadingState from '../components/common/LoadingState';
import PaginationControls from '../components/common/PaginationControls';
import MobCard from '../components/explorers/MobCard';

export const MobsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('search') || '';
  const typeFilter = searchParams.get('type') || '';
  const categoryFilter = searchParams.get('category') || '';
  const tameableFilter = searchParams.get('tameable');
  const breedableFilter = searchParams.get('breedable');

  const [data, setData] = useState<PaginatedResponse<MobListItem> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMobs = () => {
    setLoading(true);
    setError(null);

    getMobs({
      page,
      page_size: 20,
      search: search || undefined,
      type: typeFilter || undefined,
      category: categoryFilter || undefined,
      tameable: tameableFilter !== null ? tameableFilter === 'true' : undefined,
      breedable: breedableFilter !== null ? breedableFilter === 'true' : undefined,
    })
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to fetch mobs');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMobs();
  }, [page, search, typeFilter, categoryFilter, tameableFilter, breedableFilter]);

  const updateParam = (key: string, val: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (val !== null && val !== '') {
      newParams.set(key, val);
    } else {
      newParams.delete(key);
    }
    // Reset to page 1 on filter changes unless changing page itself
    if (key !== 'page') {
      newParams.set('page', '1');
    }
    setSearchParams(newParams);
  };

  const handleReset = () => {
    setSearchParams({});
  };

  const hasActiveFilters = Boolean(
    search || typeFilter || categoryFilter || tameableFilter !== null || breedableFilter !== null
  );

  return (
    <div className="space-y-6">
      {/* Header and Scope */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Mobs Explorer
          </h1>
          <p className="text-xs sm:text-sm text-mc-textMuted mt-1">
            Browse and filter Minecraft Java Edition mobs with combat stats, breeding, and behavioral types.
          </p>
        </div>
      </div>

      <CoverageNote entityType="mob" />

      {/* Toolbar & Filters */}
      <ExplorerToolbar
        searchQuery={search}
        onSearchChange={(val) => updateParam('search', val)}
        searchPlaceholder="Filter mobs by name, ID, or behavior..."
        hasActiveFilters={hasActiveFilters}
        onResetFilters={handleReset}
      >
        {/* Behavior Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => updateParam('type', e.target.value)}
          aria-label="Behavior Type"
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-mc-border text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-400"
        >
          <option value="">All Behavior Types</option>
          <option value="hostile">Hostile</option>
          <option value="passive">Passive</option>
          <option value="neutral">Neutral</option>
          <option value="boss">Boss</option>
        </select>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => updateParam('category', e.target.value)}
          aria-label="Category"
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-mc-border text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-400"
        >
          <option value="">All Categories</option>
          <option value="animal">Animal</option>
          <option value="undead">Undead</option>
          <option value="arthropod">Arthropod</option>
          <option value="illager">Illager</option>
          <option value="humanoid">Humanoid</option>
        </select>

        {/* Tameable Toggle Pill */}
        <button
          type="button"
          onClick={() => updateParam('tameable', tameableFilter === 'true' ? null : 'true')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
            tameableFilter === 'true'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          Tameable Only
        </button>

        {/* Breedable Toggle Pill */}
        <button
          type="button"
          onClick={() => updateParam('breedable', breedableFilter === 'true' ? null : 'true')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
            breedableFilter === 'true'
              ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          Breedable Only
        </button>
      </ExplorerToolbar>

      {/* Content Rendering */}
      {loading && <LoadingState message="Loading mobs from local SQLite cache..." />}

      {error && <ErrorState error={error} onRetry={fetchMobs} />}

      {!loading && !error && data && data.data.length === 0 && (
        <EmptyState
          title="No mobs match your filters"
          message="Try loosening your search term or clearing behavioral filters to view available Minecraft mobs."
          onReset={handleReset}
        />
      )}

      {!loading && !error && data && data.data.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.data.map((mob) => (
              <MobCard key={mob.id} mob={mob} />
            ))}
          </div>

          <PaginationControls
            pagination={data.pagination}
            onPageChange={(newPage) => updateParam('page', String(newPage))}
          />
        </>
      )}
    </div>
  );
};

export default MobsPage;

