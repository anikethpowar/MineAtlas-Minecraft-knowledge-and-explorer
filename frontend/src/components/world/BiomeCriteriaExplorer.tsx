import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBiomeMatches } from '../../api/mineatlasApi';
import { BiomeMatchItem } from '../../api/types';
import SourceBadge from '../common/SourceBadge';
import EditionBadge from '../common/EditionBadge';

export const BiomeCriteriaExplorer: React.FC = () => {
  const [dimension, setDimension] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [rarity, setRarity] = useState<string>('');
  const [precipitation, setPrecipitation] = useState<string>('');
  const [beginnerFriendly, setBeginnerFriendly] = useState<boolean>(false);
  const [hasVillage, setHasVillage] = useState<boolean>(false);
  const [hasTameable, setHasTameable] = useState<boolean>(false);

  const [matches, setMatches] = useState<BiomeMatchItem[]>([]);
  const [totalMatches, setTotalMatches] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState<boolean>(false);

  const executeSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getBiomeMatches({
        dimension: dimension || undefined,
        category: category || undefined,
        rarity: rarity || undefined,
        precipitation: precipitation || undefined,
        beginner_friendly: beginnerFriendly || undefined,
        has_village_opportunity: hasVillage || undefined,
        has_tameable_mob_opportunity: hasTameable || undefined,
        limit: 50,
      });
      setMatches(res.data);
      setTotalMatches(res.total_matches);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to query matching biomes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch with default beginner-friendly criteria
    executeSearch();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch();
  };

  const handleReset = () => {
    setDimension('');
    setCategory('');
    setRarity('');
    setPrecipitation('');
    setBeginnerFriendly(false);
    setHasVillage(false);
    setHasTameable(false);
    setError(null);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-slate-100">
              Biome Criteria Explorer
            </h3>
            <SourceBadge sourceType="calculated" />
            <EditionBadge edition="java" />
          </div>
          <p className="text-xs text-slate-400">
            Rule-based climate and environmental filter identifying matching Java biomes with deterministic reasons.
          </p>
        </div>
      </div>

      {/* Mandatory Seed Limitation Notice */}
      <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300 flex items-start gap-2">
        <svg className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="leading-relaxed">
          <strong>Seed Disclaimer:</strong> These results identify matching biome types from the MineAtlas verified cache. MineAtlas does not analyse arbitrary seeds or locate structures for a specific player seed.
        </span>
      </div>

      {/* Filter Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Dimension */}
          <div>
            <label htmlFor="dim-select" className="block text-xs font-semibold text-slate-300 mb-1">
              Dimension
            </label>
            <select
              id="dim-select"
              value={dimension}
              onChange={(e) => setDimension(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Dimensions</option>
              <option value="overworld">The Overworld</option>
              <option value="nether">The Nether</option>
              <option value="end">The End</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="cat-select" className="block text-xs font-semibold text-slate-300 mb-1">
              Climate Category
            </label>
            <select
              id="cat-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Categories</option>
              <option value="plains">Plains</option>
              <option value="forest">Forest</option>
              <option value="taiga">Taiga</option>
              <option value="desert">Desert</option>
              <option value="jungle">Jungle</option>
              <option value="savanna">Savanna</option>
              <option value="swamp">Swamp</option>
              <option value="ocean">Ocean</option>
              <option value="nether">Nether</option>
              <option value="the_end">The End</option>
            </select>
          </div>

          {/* Rarity */}
          <div>
            <label htmlFor="rarity-select" className="block text-xs font-semibold text-slate-300 mb-1">
              Rarity
            </label>
            <select
              id="rarity-select"
              value={rarity}
              onChange={(e) => setRarity(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Rarities</option>
              <option value="common">Common</option>
              <option value="uncommon">Uncommon</option>
              <option value="rare">Rare</option>
            </select>
          </div>

          {/* Precipitation */}
          <div>
            <label htmlFor="precip-select" className="block text-xs font-semibold text-slate-300 mb-1">
              Precipitation
            </label>
            <select
              id="precip-select"
              value={precipitation}
              onChange={(e) => setPrecipitation(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Any Precipitation</option>
              <option value="rain">Rain</option>
              <option value="snow">Snow</option>
              <option value="none">None (Dry)</option>
            </select>
          </div>
        </div>

        {/* Player Intent Checkbox Presets */}
        <div className="flex flex-wrap items-center gap-4 pt-1">
          <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={beginnerFriendly}
              onChange={(e) => setBeginnerFriendly(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500"
            />
            <span>Beginner-Friendly Preset (Temperate, Common Overworld)</span>
          </label>

          <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={hasVillage}
              onChange={(e) => setHasVillage(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500"
            />
            <span>Village Settlements Opportunity</span>
          </label>

          <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={hasTameable}
              onChange={(e) => setHasTameable(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500"
            />
            <span>Tameable Animal Spawns (Horses, Wolves, Cats)</span>
          </label>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Find Matching Biomes'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition"
          >
            Reset Criteria
          </button>
        </div>
      </form>

      {/* Results Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
          <span>
            Found <strong className="text-white">{totalMatches}</strong> matching biome{totalMatches === 1 ? '' : 's'}
          </span>
          <span className="font-mono text-[11px] text-emerald-400">
            Source: Cached SQLite Biomes
          </span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
            Evaluating biome environmental criteria...
          </div>
        ) : matches.length === 0 && searched ? (
          <div className="py-8 text-center bg-slate-950/40 rounded-xl border border-slate-800 p-6">
            <p className="text-sm font-semibold text-slate-300 mb-1">No Matching Biomes Found</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No biomes in the MineAtlas cache matched the exact combination of filters. Try broadening your criteria or deselecting specific options.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.map((item) => (
              <div
                key={item.biome.id}
                className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-4 hover:border-slate-700 transition flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h4 className="text-sm font-bold text-slate-100">
                      {item.biome.name}
                    </h4>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <SourceBadge sourceType="calculated" />
                      {item.biome.dimension && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono capitalize bg-slate-800 text-slate-300 border border-slate-700">
                          {item.biome.dimension}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-[11px] text-slate-400 mb-3">
                    {item.biome.category && (
                      <span>Category: <strong className="text-slate-300 capitalize">{item.biome.category}</strong></span>
                    )}
                    {item.biome.rarity && (
                      <span>Rarity: <strong className="text-slate-300 capitalize">{item.biome.rarity}</strong></span>
                    )}
                    {item.biome.precipitation && (
                      <span>Precipitation: <strong className="text-slate-300 capitalize">{item.biome.precipitation}</strong></span>
                    )}
                  </div>

                  {/* Explainable Match Reasons */}
                  <div className="bg-slate-900/80 rounded-lg p-2.5 border border-slate-800 text-xs space-y-1">
                    <span className="font-semibold text-emerald-400 block text-[11px]">
                      Deterministic Match Reasons:
                    </span>
                    <ul className="space-y-1 text-slate-300">
                      {item.match_reasons.map((reason, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-[11px] leading-relaxed">
                          <span className="text-emerald-400 mt-0.5">✓</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-900 flex justify-end">
                  <Link
                    to={`/biomes/${item.biome.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
                  >
                    <span>Explore Biome</span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BiomeCriteriaExplorer;

