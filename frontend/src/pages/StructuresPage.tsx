import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getStructures } from '../api/mineatlasApi';
import { PaginatedResponse, StructureListItem } from '../api/types';
import CoverageNote from '../components/common/CoverageNote';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import ExplorerToolbar from '../components/common/ExplorerToolbar';
import LoadingState from '../components/common/LoadingState';
import PaginationControls from '../components/common/PaginationControls';
import StructureCard from '../components/explorers/StructureCard';

export const StructuresPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('search') || '';
  const dimensionFilter = searchParams.get('dimension') || '';
  const categoryFilter = searchParams.get('category') || '';
  const rarityFilter = searchParams.get('rarity') || '';

  const [data, setData] = useState<PaginatedResponse<StructureListItem> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStructures = () => {
    setLoading(true);
    setError(null);

    getStructures({
      page,
      page_size: 20,
      search: search || undefined,
      dimension: dimensionFilter || undefined,
      category: categoryFilter || undefined,
      rarity: rarityFilter || undefined,
    })
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to fetch structures');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStructures();
  }, [page, search, dimensionFilter, categoryFilter, rarityFilter]);

  const updateParam = (key: string, val: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (val !== null && val !== '') {
      newParams.set(key, val);
    } else {
      newParams.delete(key);
    }
    if (key !== 'page') {
      newParams.set('page', '1');
    }
    setSearchParams(newParams);
  };

  const handleReset = () => {
    setSearchParams({});
  };

  const hasActiveFilters = Boolean(
    search || dimensionFilter || categoryFilter || rarityFilter
  );

  return (
    <div className="space-y-6">
      {/* Header and Scope */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Structures Explorer
        </h1>
        <p className="text-xs sm:text-sm text-mc-textMuted mt-1">
          Explore Minecraft Java Edition world structures across dimensions, with generation Y-levels and finding guides.
        </p>
      </div>

      <CoverageNote entityType="structure" />

      {/* Toolbar & Filters */}
      <ExplorerToolbar
        searchQuery={search}
        onSearchChange={(val) => updateParam('search', val)}
        searchPlaceholder="Filter structures by name, ID, or guidance..."
        hasActiveFilters={hasActiveFilters}
        onResetFilters={handleReset}
      >
        {/* Dimension Filter */}
        <select
          value={dimensionFilter}
          onChange={(e) => updateParam('dimension', e.target.value)}
          aria-label="Dimension"
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-mc-border text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-400"
        >
          <option value="">All Dimensions</option>
          <option value="overworld">Overworld</option>
          <option value="nether">Nether</option>
          <option value="the_end">The End</option>
        </select>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => updateParam('category', e.target.value)}
          aria-label="Structure Category"
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-mc-border text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-400"
        >
          <option value="">All Categories</option>
          <option value="settlement">Settlement</option>
          <option value="dungeon">Dungeon</option>
          <option value="ruin">Ruin</option>
          <option value="temple">Temple</option>
          <option value="monument">Monument</option>
          <option value="fortress">Fortress</option>
          <option value="outpost">Outpost</option>
        </select>

        {/* Rarity Filter */}
        <select
          value={rarityFilter}
          onChange={(e) => updateParam('rarity', e.target.value)}
          aria-label="Rarity"
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-mc-border text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-400"
        >
          <option value="">All Rarities</option>
          <option value="common">Common</option>
          <option value="uncommon">Uncommon</option>
          <option value="rare">Rare</option>
        </select>
      </ExplorerToolbar>

      {/* Content Rendering */}
      {loading && <LoadingState message="Loading structures from local SQLite cache..." />}

      {error && <ErrorState error={error} onRetry={fetchStructures} />}

      {!loading && !error && data && data.data.length === 0 && (
        <EmptyState
          title="No structures match your filters"
          message="Try loosening your search term or clearing dimension filters to view available structures."
          onReset={handleReset}
        />
      )}

      {!loading && !error && data && data.data.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.data.map((structure) => (
              <StructureCard key={structure.id} structure={structure} />
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

export default StructuresPage;

