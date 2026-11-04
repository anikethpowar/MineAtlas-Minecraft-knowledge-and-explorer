import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { searchEntities } from '../api/mineatlasApi';
import { SearchResponse, SearchResultItem } from '../api/types';
import EditionBadge from '../components/common/EditionBadge';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import SourceBadge from '../components/common/SourceBadge';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialType = searchParams.get('type') || '';

  const [query, setQuery] = useState<string>(initialQuery);
  const [selectedType, setSelectedType] = useState<string>(initialType);
  const [searchData, setSearchData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state if URL changes externally
  useEffect(() => {
    const q = searchParams.get('q') || '';
    const t = searchParams.get('type') || '';
    setQuery(q);
    setSelectedType(t);
  }, [searchParams]);

  // Execute search when query or type changes
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchData(null);
      setLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      searchEntities(trimmed, selectedType || undefined, 40)
        .then((res) => {
          if (isMounted) {
            setSearchData(res);
            setLoading(false);
          }
        })
        .catch((err) => {
          if (isMounted) {
            setError(err instanceof Error ? err.message : 'Search failed');
            setLoading(false);
          }
        });
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [query, selectedType]);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    const newParams = new URLSearchParams(searchParams);
    if (val.trim()) {
      newParams.set('q', val.trim());
    } else {
      newParams.delete('q');
    }
    setSearchParams(newParams);
  };

  const handleTypeSelect = (typeFilter: string) => {
    setSelectedType(typeFilter);
    const newParams = new URLSearchParams(searchParams);
    if (typeFilter) {
      newParams.set('type', typeFilter);
    } else {
      newParams.delete('type');
    }
    setSearchParams(newParams);
  };

  const entityTypeRoutes: Record<string, string> = {
    mob: '/mobs',
    biome: '/biomes',
    item: '/items',
    structure: '/structures',
  };

  const getItemRoute = (item: SearchResultItem): string | null => {
    const base = entityTypeRoutes[item.entity_type.toLowerCase()];
    return base ? `${base}/${encodeURIComponent(item.id)}` : null;
  };

  const getTypeColor = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'mob':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'biome':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'item':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'structure':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'enchantment':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'achievement':
        return 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Global Knowledge Search
        </h1>
        <p className="text-xs sm:text-sm text-mc-textMuted mt-1">
          Instant multi-entity search across mobs, biomes, representative items, structures, and enchantments in local SQLite.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Search by name, ID, or description (e.g. zombie, plains, diamond, bastion)..."
          className="w-full pl-12 pr-10 py-3.5 rounded-xl bg-mc-card border border-mc-border text-slate-100 placeholder-slate-500 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all shadow-inner"
          autoFocus
        />
        {query && (
          <button
            type="button"
            onClick={() => handleQueryChange('')}
            aria-label="Clear search query"
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-200"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Filter Tabs by Entity Type */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-mc-border/60">
        <button
          type="button"
          onClick={() => handleTypeSelect('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium font-mono transition-colors ${
            !selectedType
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          All Types {searchData && `(${searchData.total_results})`}
        </button>

        {['mob', 'biome', 'item', 'structure', 'enchantment', 'achievement'].map((typeKey) => {
          const count = searchData?.by_type?.[typeKey] ?? 0;
          const isSelected = selectedType === typeKey;

          return (
            <button
              key={typeKey}
              type="button"
              onClick={() => handleTypeSelect(typeKey)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium font-mono capitalize transition-colors ${
                isSelected
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {typeKey}s {searchData && count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {/* Search Content */}
      {loading && <LoadingState message="Searching local SQLite cache..." />}

      {error && (
        <ErrorState
          error={error}
          onRetry={() => {
            const currentQ = query;
            setQuery('');
            setTimeout(() => setQuery(currentQ), 10);
          }}
        />
      )}

      {!loading && !error && !query && (
        <div className="py-16 text-center rounded-xl bg-mc-card/40 border border-mc-border/60 p-6">
          <div className="w-12 h-12 mx-auto mb-3 text-slate-500">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-slate-300 mb-1">
            Search Minecraft Knowledge Graph
          </h3>
          <p className="text-xs text-mc-textMuted max-w-md mx-auto">
            Type anything to instantly query all cached mobs, biomes, representative items, and structures.
          </p>
        </div>
      )}

      {!loading && !error && query && searchData && searchData.results.length === 0 && (
        <EmptyState
          title={`No results found for "${query}"`}
          message="No cached Minecraft Java Edition entities matched your query. Try searching for a different keyword or checking your spelling."
          onReset={() => handleQueryChange('')}
          resetLabel="Clear Search"
        />
      )}

      {!loading && !error && searchData && searchData.results.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs text-mc-textMuted font-mono">
            Found <span className="text-emerald-400 font-bold">{searchData.total_results}</span> matching entities in SQLite cache:
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {searchData.results.map((result) => {
              const route = getItemRoute(result);
              const cardBody = (
                <div
                  data-testid={`search-result-${result.id}`}
                  className="p-4 rounded-xl bg-mc-card border border-mc-border hover:border-mc-emerald hover:bg-mc-cardHover transition-all flex flex-col justify-between h-full"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border ${getTypeColor(result.entity_type)}`}>
                          {result.entity_type}
                        </span>
                        <EditionBadge edition={result.edition} />
                      </div>
                      <SourceBadge sourceType={result.source_type} />
                    </div>

                    <h3 className="text-base font-semibold text-slate-100 group-hover:text-emerald-300 transition-colors">
                      {result.name}
                    </h3>
                    <span className="text-xs font-mono text-mc-textMuted block mb-2">
                      {result.id}
                    </span>

                    {result.subtitle && (
                      <p className="text-xs text-slate-300 mb-1 font-medium">
                        {result.subtitle}
                      </p>
                    )}

                    {result.description && (
                      <p className="text-xs text-mc-textMuted line-clamp-2">
                        {result.description}
                      </p>
                    )}
                  </div>

                  {route && (
                    <div className="pt-3 mt-3 border-t border-mc-border/60 flex items-center justify-between text-xs font-semibold text-emerald-400">
                      <span>View Entity Details</span>
                      <span>&rarr;</span>
                    </div>
                  )}
                </div>
              );

              if (route) {
                return (
                  <Link key={`${result.entity_type}-${result.id}`} to={route} className="group block">
                    {cardBody}
                  </Link>
                );
              }

              return (
                <div key={`${result.entity_type}-${result.id}`}>
                  {cardBody}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;

