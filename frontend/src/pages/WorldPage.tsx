import React, { useEffect, useState } from 'react';
import { getWorldReference } from '../api/mineatlasApi';
import { WorldReferenceResponse } from '../api/types';
import CoordinatesDiagram from '../components/world/CoordinatesDiagram';
import PortalConverter from '../components/world/PortalConverter';
import BiomeCriteriaExplorer from '../components/world/BiomeCriteriaExplorer';
import SpawnSphereVisualizer from '../components/world/SpawnSphereVisualizer';
import SourceBadge from '../components/common/SourceBadge';
import EditionBadge from '../components/common/EditionBadge';

export const WorldPage: React.FC = () => {
  const [reference, setReference] = useState<WorldReferenceResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'portal' | 'biomes' | 'sphere'>('overview');

  useEffect(() => {
    const fetchRef = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getWorldReference();
        setReference(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load curated world atlas reference.');
      } finally {
        setLoading(false);
      }
    };
    fetchRef();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            Atlas &amp; Calculators
          </span>
          <EditionBadge edition="java" />
          <SourceBadge sourceType="curated" />
          <SourceBadge sourceType="calculated" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Calculated World Atlas &amp; Coordinate Tools
        </h1>
        <p className="mt-1 text-sm text-slate-400 max-w-3xl leading-relaxed">
          Comprehensive Minecraft Java Edition spatial reference, deterministic 8:1 Nether portal coordinate converter,
          explainable biome criteria matcher, and geometric mob spawn sphere visualizer.
        </p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-800 pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition ${
            activeTab === 'overview'
              ? 'bg-emerald-600 text-white font-semibold'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          World Atlas &amp; Coordinates
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('portal')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition ${
            activeTab === 'portal'
              ? 'bg-emerald-600 text-white font-semibold'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Nether Portal Converter
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('biomes')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition ${
            activeTab === 'biomes'
              ? 'bg-emerald-600 text-white font-semibold'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Biome Criteria Explorer
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('sphere')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition ${
            activeTab === 'sphere'
              ? 'bg-emerald-600 text-white font-semibold'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Spawn Sphere Visualizer
        </button>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* TAB 1: WORLD ATLAS & COORDINATES OVERVIEW */}
      {(activeTab === 'overview' || activeTab === 'portal' || activeTab === 'biomes' || activeTab === 'sphere') && (
        <section id="overview" className={`space-y-6 ${activeTab !== 'overview' ? 'hidden' : ''}`}>
          {/* Dimension Reference Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Curated Java Edition Dimensions
              </h2>
              <SourceBadge sourceType="curated" />
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-44 bg-slate-900 rounded-xl border border-slate-800"></div>
                ))}
              </div>
            ) : reference ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {reference.dimensions.map((dim) => (
                  <div
                    key={dim.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-base font-bold text-white">{dim.name}</h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                          {dim.coordinate_scale}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mb-2 leading-relaxed font-medium">
                        {dim.role}
                      </p>
                      <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                        {dim.description}
                      </p>
                    </div>

                    <div className="border-t border-slate-800 pt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                      <div>
                        <span className="text-slate-500 block">Altitude Span:</span>
                        <span className="font-mono text-slate-200">
                          Y={dim.min_y} to Y={dim.max_y}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Bed Usability:</span>
                        <span className={dim.bed_safe ? 'text-emerald-400' : 'text-rose-400 font-semibold'}>
                          {dim.bed_safe ? 'Safe to Sleep' : 'Explodes!'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Coordinate Reference Diagram & Rules */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Coordinate System Architecture
            </h2>
            <CoordinatesDiagram />

            {reference && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-semibold text-slate-200">
                  Java Edition Realm Travel Guidelines:
                </h3>
                <ul className="space-y-2 text-xs text-slate-300">
                  {reference.dimension_travel_rules.map((rule, idx) => (
                    <li key={idx} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-emerald-400 font-bold mt-0.5">&bull;</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* TAB 2: NETHER PORTAL CONVERTER */}
      {(activeTab === 'portal' || activeTab === 'overview') && (
        <section id="portal" className={`space-y-4 ${activeTab !== 'portal' && activeTab !== 'overview' ? 'hidden' : ''}`}>
          {activeTab === 'overview' && (
            <div className="pt-4 border-t border-slate-800">
              <h2 className="text-lg font-bold text-slate-100 mb-2">
                Nether Portal Coordinate Calculator
              </h2>
            </div>
          )}
          <PortalConverter />
        </section>
      )}

      {/* TAB 3: BIOME CRITERIA EXPLORER */}
      {(activeTab === 'biomes' || activeTab === 'overview') && (
        <section id="biomes" className={`space-y-4 ${activeTab !== 'biomes' && activeTab !== 'overview' ? 'hidden' : ''}`}>
          {activeTab === 'overview' && (
            <div className="pt-4 border-t border-slate-800">
              <h2 className="text-lg font-bold text-slate-100 mb-2">
                Biome Criteria Explorer
              </h2>
            </div>
          )}
          <BiomeCriteriaExplorer />
        </section>
      )}

      {/* TAB 4: SPAWN SPHERE VISUALIZER */}
      {(activeTab === 'sphere' || activeTab === 'overview') && (
        <section id="sphere" className={`space-y-4 ${activeTab !== 'sphere' && activeTab !== 'overview' ? 'hidden' : ''}`}>
          {activeTab === 'overview' && (
            <div className="pt-4 border-t border-slate-800">
              <h2 className="text-lg font-bold text-slate-100 mb-2">
                Spawn Sphere &amp; Despawn Radius Visualizer
              </h2>
            </div>
          )}
          <SpawnSphereVisualizer />
        </section>
      )}
    </div>
  );
};

export default WorldPage;

