import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getGraphNeighbors, searchEntities } from '../../api/mineatlasApi';
import { GraphNeighborsResponse, SearchResultItem } from '../../api/types';
import EmptyState from '../common/EmptyState';
import ErrorState from '../common/ErrorState';
import LoadingState from '../common/LoadingState';
import GraphAccessibilityView from './GraphAccessibilityView';
import GraphCanvas, { GraphCanvasHandles } from './GraphCanvas';
import GraphControls from './GraphControls';
import GraphDetailsPanel from './GraphDetailsPanel';
import GraphLegend from './GraphLegend';
import {
  CytoscapeEdgeData,
  CytoscapeNodeData,
  transformGraphResponse,
} from './graphTransformers';

export const GraphExplorer: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. Extract and sanitize URL query parameters
  const rawType = searchParams.get('type') || '';
  const rawId = searchParams.get('id') || '';
  const rawDepth = parseInt(searchParams.get('depth') || '1', 10);
  const depth = rawDepth === 2 ? 2 : 1; // Safely enforce depth: only 1 or 2, default 1

  // 2. Local State
  const [data, setData] = useState<GraphNeighborsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Search input state for selecting root entity
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [searching, setSearching] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  // Active filters and views
  const [activeRelTypes, setActiveRelTypes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<CytoscapeNodeData | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<CytoscapeEdgeData | null>(null);
  const [viewMode, setViewMode] = useState<'canvas' | 'list'>('canvas');

  const canvasRef = useRef<GraphCanvasHandles>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // 3. Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 4. Debounced entity search for root selection
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    let isMounted = true;
    setSearching(true);

    const timer = setTimeout(() => {
      searchEntities(trimmed, undefined, 8)
        .then((res) => {
          if (isMounted) {
            setSearchResults(res.results || []);
            setSearching(false);
            setShowDropdown(true);
          }
        })
        .catch(() => {
          if (isMounted) {
            setSearchResults([]);
            setSearching(false);
          }
        });
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // 5. Fetch graph data when root entity or depth changes
  const fetchGraphData = () => {
    if (!rawType || !rawId) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setSelectedNode(null);
    setSelectedEdge(null);

    getGraphNeighbors(rawType, rawId, depth)
      .then((res) => {
        setData(res);
        // Default: activate all available relationship types
        const types = new Set(res.metadata?.available_relationship_types || []);
        setActiveRelTypes(types);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load graph data');
        setData(null);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchGraphData();
  }, [rawType, rawId, depth]);

  // 6. URL Parameter synchronization helpers
  const updateUrlParams = (newType: string, newId: string, newDepth: number = depth) => {
    const params = new URLSearchParams();
    params.set('type', newType.toLowerCase());
    params.set('id', newId.toLowerCase());
    params.set('depth', String(newDepth === 2 ? 2 : 1));
    setSearchParams(params);
  };

  const handleSelectRoot = (entityType: string, entityId: string) => {
    setShowDropdown(false);
    setSearchQuery('');
    updateUrlParams(entityType, entityId, depth);
  };

  const handleDepthChange = (newDepth: number) => {
    if (rawType && rawId) {
      updateUrlParams(rawType, rawId, newDepth);
    }
  };

  // 7. Relationship filter handlers
  const handleToggleRelType = (rel: string) => {
    setActiveRelTypes((prev) => {
      const next = new Set(prev);
      if (next.has(rel)) {
        next.delete(rel);
      } else {
        next.add(rel);
      }
      return next;
    });
  };

  const handleSelectAllRelTypes = () => {
    if (data?.metadata?.available_relationship_types) {
      setActiveRelTypes(new Set(data.metadata.available_relationship_types));
    }
  };

  const handleClearAllRelTypes = () => {
    setActiveRelTypes(new Set());
  };

  // 8. Transform data for Cytoscape elements and Accessible view
  const cytoscapeElements = useMemo(() => {
    if (!data) return [];
    return transformGraphResponse(data, activeRelTypes);
  }, [data, activeRelTypes]);

  // Extract edges specifically for the accessible relationship list
  const filteredEdgeDataList: CytoscapeEdgeData[] = useMemo(() => {
    return cytoscapeElements
      .filter((el) => el.group === 'edges')
      .map((el) => el.data as unknown as CytoscapeEdgeData);
  }, [cytoscapeElements]);

  // Popular preset entities for rapid discovery
  const popularPresets = [
    { label: 'Bee (Mob)', type: 'mob', id: 'bee' },
    { label: 'Plains (Biome)', type: 'biome', id: 'plains' },
    { label: 'Village (Structure)', type: 'structure', id: 'village' },
    { label: 'Iron Ingot (Item)', type: 'item', id: 'iron_ingot' },
    { label: 'Zombie (Mob)', type: 'mob', id: 'zombie' },
    { label: 'Diamond (Item)', type: 'item', id: 'diamond' },
  ];

  return (
    <div className="space-y-6" data-testid="graph-explorer">
      {/* A. Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Knowledge Graph Explorer
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              Interactive Cytoscape.js
            </span>
          </div>
          <p className="text-xs sm:text-sm text-mc-textMuted">
            Explore one or two levels of verified Minecraft relationships at a time.
          </p>
          <p className="text-[11px] text-mc-textMuted/80 font-mono mt-0.5">
            Graph relationships are derived from cached MineAtlas data.
          </p>
        </div>
      </div>

      {/* B. Entity Selection Area (Root Chooser via Global Search) */}
      <div className="p-4 rounded-xl bg-mc-card border border-mc-border shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label htmlFor="root-search" className="text-xs font-semibold text-slate-200">
            Choose Root Entity to Explore:
          </label>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-mc-textMuted">
            <span className="text-[11px] font-mono">Popular presets:</span>
            {popularPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectRoot(preset.type, preset.id)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors ${
                  rawType === preset.type && rawId === preset.id
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border-slate-800'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Autocomplete Search Input */}
        <div ref={searchContainerRef} className="relative">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <input
              id="root-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setShowDropdown(true);
              }}
              placeholder={
                data?.root
                  ? `Currently centered on: ${data.root.name} (${data.root.entity_type}) — type to search other entities...`
                  : 'Search for a mob, biome, item, or structure to begin exploring...'
              }
              className="w-full pl-10 pr-9 py-2.5 rounded-lg bg-slate-900 border border-mc-border text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
            {searching && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <div className="w-4 h-4 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
              </div>
            )}
          </div>

          {/* Dropdown Suggestions */}
          {showDropdown && searchResults.length > 0 && (
            <div
              data-testid="search-suggestions-dropdown"
              className="absolute left-0 right-0 mt-1.5 z-50 rounded-xl bg-slate-900 border border-mc-border shadow-2xl max-h-72 overflow-y-auto divide-y divide-slate-800"
            >
              {searchResults.map((item) => (
                <button
                  key={`${item.entity_type}-${item.id}`}
                  type="button"
                  onClick={() => handleSelectRoot(item.entity_type, item.id)}
                  className="w-full p-2.5 text-left hover:bg-slate-800/80 transition-colors flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0">
                    <span className="block text-xs font-semibold text-slate-200 group-hover:text-emerald-300 truncate">
                      {item.name}
                    </span>
                    <span className="block text-[10px] font-mono text-slate-500 truncate">
                      {item.id} {item.subtitle ? `• ${item.subtitle}` : ''}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                    {item.entity_type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* C. Truncated Results Warning Banner if applicable */}
      {data?.metadata?.truncated && (
        <div
          data-testid="truncated-warning"
          className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>
            <strong>Results limited:</strong> Neighborhood exceeded 50 relationship edges. Showing the first 50 cached connections for optimal browser performance.
          </span>
        </div>
      )}

      {/* D. Graph Controls Bar (Always visible when root is selected) */}
      {data && (
        <GraphControls
          depth={depth}
          onDepthChange={handleDepthChange}
          availableRelTypes={data.metadata?.available_relationship_types || []}
          activeRelTypes={activeRelTypes}
          onToggleRelType={handleToggleRelType}
          onSelectAllRelTypes={handleSelectAllRelTypes}
          onClearAllRelTypes={handleClearAllRelTypes}
          onZoomIn={() => canvasRef.current?.zoomIn()}
          onZoomOut={() => canvasRef.current?.zoomOut()}
          onFit={() => canvasRef.current?.fit()}
          onResetView={() => canvasRef.current?.resetView()}
          onReRunLayout={() => canvasRef.current?.runLayout()}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      )}

      {/* E. Main Content Area */}
      {loading && <LoadingState message="Traversing local knowledge graph neighborhood in SQLite..." />}

      {error && <ErrorState error={error} onRetry={fetchGraphData} />}

      {/* Initial Empty State: When no root is chosen in URL */}
      {!loading && !error && !rawId && (
        <div
          data-testid="graph-initial-prompt"
          className="p-12 text-center rounded-2xl bg-mc-card/60 border border-mc-border space-y-4"
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="6" cy="6" r="3" />
              <circle cx="18" cy="18" r="3" />
              <circle cx="18" cy="6" r="3" />
              <path d="M8.5 7.5l7 3M8.5 6h7M18 8.5v7" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">
              Select an Entity to Explore Connections
            </h3>
            <p className="text-xs sm:text-sm text-mc-textMuted max-w-lg mx-auto mt-1 leading-relaxed">
              MineAtlas maps verified relationships between mobs, biomes, representative key blocks, and structures. Search for any entity above or click one of the popular presets to begin.
            </p>
          </div>
        </div>
      )}

      {/* No Relationships State: Entity exists but has 0 derived edges */}
      {!loading && !error && data && data.edges.length === 0 && (
        <EmptyState
          title={`No derived relationships recorded for "${data.root.name}"`}
          message="This entity does not currently link to any of the 100 key items or canonical biomes in the local SQLite graph. Try exploring other entities like Bee, Plains, or Village."
          onReset={() => handleSelectRoot('mob', 'bee')}
          resetLabel="Explore Bee Connections"
        />
      )}

      {/* All Edges Filtered Out State */}
      {!loading && !error && data && data.edges.length > 0 && cytoscapeElements.length <= 1 && (
        <div className="p-8 text-center rounded-xl bg-mc-card border border-mc-border space-y-3">
          <p className="text-sm font-semibold text-slate-200">
            All relationship edges hidden by active filters
          </p>
          <p className="text-xs text-mc-textMuted max-w-md mx-auto">
            You have deselected all relationship types in the filter bar above.
          </p>
          <button
            type="button"
            onClick={handleSelectAllRelTypes}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
          >
            Reset Relationship Filters
          </button>
        </div>
      )}

      {/* Active Graph Explorer Workspace: Canvas / Accessible List + Details Panel */}
      {!loading && !error && data && data.edges.length > 0 && cytoscapeElements.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Visual or Accessible Area (Takes 2 cols on desktop) */}
          <div className="lg:col-span-2 space-y-4">
            {viewMode === 'canvas' ? (
              <GraphCanvas
                ref={canvasRef}
                elements={cytoscapeElements}
                onSelectNode={(node) => {
                  setSelectedNode(node);
                  setSelectedEdge(null);
                }}
                onSelectEdge={(edge) => {
                  setSelectedEdge(edge);
                  setSelectedNode(null);
                }}
                onClearSelection={() => {
                  setSelectedNode(null);
                  setSelectedEdge(null);
                }}
              />
            ) : (
              <GraphAccessibilityView
                edges={filteredEdgeDataList}
                rootId={data.root.entity_id}
                onSelectEdge={(edge) => {
                  setSelectedEdge(edge);
                  setSelectedNode(null);
                }}
                onSetRoot={(type, id) => handleSelectRoot(type, id)}
              />
            )}

            {/* Visual Legend */}
            <GraphLegend />
          </div>

          {/* Side Details Panel (Takes 1 col on desktop) */}
          <div className="lg:col-span-1">
            <GraphDetailsPanel
              selectedNode={selectedNode}
              selectedEdge={selectedEdge}
              onSetRoot={(type, id) => handleSelectRoot(type, id)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GraphExplorer;

