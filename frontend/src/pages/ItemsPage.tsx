import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getItems } from '../api/mineatlasApi';
import { ItemListItem, PaginatedResponse } from '../api/types';
import CoverageNote from '../components/common/CoverageNote';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import ExplorerToolbar from '../components/common/ExplorerToolbar';
import LoadingState from '../components/common/LoadingState';
import PaginationControls from '../components/common/PaginationControls';
import ItemCard from '../components/explorers/ItemCard';

export const ItemsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('search') || '';
  const categoryFilter = searchParams.get('category') || '';
  const enchantableFilter = searchParams.get('enchantable');

  const [data, setData] = useState<PaginatedResponse<ItemListItem> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = () => {
    setLoading(true);
    setError(null);

    getItems({
      page,
      page_size: 20,
      search: search || undefined,
      category: categoryFilter || undefined,
      enchantable: enchantableFilter !== null ? enchantableFilter === 'true' : undefined,
    })
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to fetch items');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchItems();
  }, [page, search, categoryFilter, enchantableFilter]);

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
    search || categoryFilter || enchantableFilter !== null
  );

  return (
    <div className="space-y-6">
      {/* Header and Scope */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Items &amp; Key Blocks Explorer
        </h1>
        <p className="text-xs sm:text-sm text-mc-textMuted mt-1">
          Explore representative Minecraft Java Edition items and key blocks with stack sizes, durabilities, and enchantability.
        </p>
      </div>

      <CoverageNote entityType="item" />

      {/* Toolbar & Filters */}
      <ExplorerToolbar
        searchQuery={search}
        onSearchChange={(val) => updateParam('search', val)}
        searchPlaceholder="Filter items & blocks by name, ID, or description..."
        hasActiveFilters={hasActiveFilters}
        onResetFilters={handleReset}
      >
        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => updateParam('category', e.target.value)}
          aria-label="Item Category"
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-mc-border text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-400"
        >
          <option value="">All Categories</option>
          <option value="tool">Tools</option>
          <option value="combat">Combat</option>
          <option value="resource">Resources</option>
          <option value="food">Food</option>
          <option value="block">Key Blocks</option>
          <option value="misc">Miscellaneous</option>
        </select>

        {/* Enchantable Toggle */}
        <button
          type="button"
          onClick={() => updateParam('enchantable', enchantableFilter === 'true' ? null : 'true')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
            enchantableFilter === 'true'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          Enchantable Only
        </button>
      </ExplorerToolbar>

      {/* Content Rendering */}
      {loading && <LoadingState message="Loading items and key blocks from local SQLite cache..." />}

      {error && <ErrorState error={error} onRetry={fetchItems} />}

      {!loading && !error && data && data.data.length === 0 && (
        <EmptyState
          title="No items or blocks match your filters"
          message="Try loosening your search term or category filter. Note that MineAtlas currently indexes 100 representative key items and blocks."
          onReset={handleReset}
        />
      )}

      {!loading && !error && data && data.data.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.data.map((item) => (
              <ItemCard key={item.id} item={item} />
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

export default ItemsPage;

