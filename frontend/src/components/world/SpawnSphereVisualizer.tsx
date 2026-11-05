import React, { useEffect, useState } from 'react';
import { calculateSpawnSphere } from '../../api/mineatlasApi';
import { SpawnSphereResponse } from '../../api/types';
import SourceBadge from '../common/SourceBadge';
import EditionBadge from '../common/EditionBadge';

export const SpawnSphereVisualizer: React.FC = () => {
  const [radiusInput, setRadiusInput] = useState<string>('128');
  const [playerYInput, setPlayerYInput] = useState<string>('64');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SpawnSphereResponse | null>(null);

  const fetchCalculation = async (rVal: string, yVal: string) => {
    const r = parseFloat(rVal);
    const y = yVal.trim() !== '' ? parseFloat(yVal) : undefined;

    if (isNaN(r) || r <= 0 || r > 512) {
      setError('Please provide a valid radius between 1 and 512 blocks.');
      return;
    }

    if (y !== undefined && (isNaN(y) || y < -64 || y > 320)) {
      setError('Player Y altitude must be between -64 and 320 blocks.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await calculateSpawnSphere({
        radius: r,
        player_y: y,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Spawn sphere calculation failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalculation('128', '64');
  }, []);

  const handlePreset = (presetRadius: number) => {
    const rStr = String(presetRadius);
    setRadiusInput(rStr);
    fetchCalculation(rStr, playerYInput);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCalculation(radiusInput, playerYInput);
  };

  const radius = parseFloat(radiusInput) || 128;

  // SVG diagram scaling: 128 blocks maps to radius 120px in SVG (viewBox 360x360, center 180, 180)
  // Scale factor: 120 / 128 = 0.9375
  const svgCenter = 180;
  const svgScale = 120 / 128;
  const clampedRadius = Math.min(Math.max(radius, 4), 160);
  const targetSvgR = clampedRadius * svgScale;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-slate-100">
              Spawn Sphere &amp; Despawn Radius Visualizer
            </h3>
            <SourceBadge sourceType="calculated" />
            <EditionBadge edition="java" />
          </div>
          <p className="text-xs text-slate-400">
            Geometric planning calculator and responsive circular diagram for Minecraft Java Edition mob spawning mechanics.
          </p>
        </div>
      </div>

      {/* Limitation Notice */}
      <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300 flex items-start gap-2">
        <svg className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span className="leading-relaxed">
          <strong>Geometric Planning Model:</strong> This tool provides exact mathematical geometry (area, volume, circumference, and height range) for planning farm perimeters. It is not a mob-cap simulation engine and does not guarantee in-game spawn rates.
        </span>
      </div>

      {/* Presets and Form */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-semibold">Standard Minecraft Presets:</span>
          <button
            type="button"
            onClick={() => handlePreset(24)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-mono transition ${
              radius === 24
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            24 Blocks (Exclusion Zone)
          </button>
          <button
            type="button"
            onClick={() => handlePreset(32)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-mono transition ${
              radius === 32
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            32 Blocks (Pathfinding Limit)
          </button>
          <button
            type="button"
            onClick={() => handlePreset(128)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-mono transition ${
              radius === 128
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            128 Blocks (Instant Despawn)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label htmlFor="radius-input" className="block text-xs font-semibold text-slate-300 mb-1">
              Custom Radius (Blocks)
            </label>
            <input
              id="radius-input"
              type="number"
              step="any"
              min="1"
              max="512"
              value={radiusInput}
              onChange={(e) => setRadiusInput(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. 128"
              required
            />
          </div>

          <div>
            <label htmlFor="player-y-input" className="block text-xs font-semibold text-slate-300 mb-1">
              Player Y Altitude (Optional)
            </label>
            <input
              id="player-y-input"
              type="number"
              step="any"
              min="-64"
              max="320"
              value={playerYInput}
              onChange={(e) => setPlayerYInput(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. 64"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50"
            >
              {loading ? 'Calculating...' : 'Calculate Sphere'}
            </button>
          </div>
        </form>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs">
            {error}
          </div>
        )}
      </div>

      {/* Visual Diagram and Measurements Side-by-Side */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 items-center">
          {/* LEFT: Responsive SVG Top-Down Diagram */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="w-full max-w-[340px] aspect-square bg-slate-950/80 rounded-2xl border border-slate-800 p-2 shadow-inner relative flex items-center justify-center">
              <svg
                viewBox="0 0 360 360"
                className="w-full h-full select-none"
                role="img"
                aria-label="Minecraft Mob Spawn and Despawn Radius Diagram"
              >
                <defs>
                  <radialGradient id="exclusionGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0.1" />
                  </radialGradient>
                  <radialGradient id="activeGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.05" />
                  </radialGradient>
                  <radialGradient id="despawnGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.02" />
                  </radialGradient>
                </defs>

                {/* Outer instant despawn sphere (128 blocks = 120px) */}
                <circle
                  cx={svgCenter}
                  cy={svgCenter}
                  r={120}
                  fill="url(#despawnGrad)"
                  stroke="#0284c7"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />

                {/* Active pathfinding sphere (32 blocks = 30px) */}
                <circle
                  cx={svgCenter}
                  cy={svgCenter}
                  r={30}
                  fill="url(#activeGrad)"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                />

                {/* Inner exclusion sphere (24 blocks = 22.5px) */}
                <circle
                  cx={svgCenter}
                  cy={svgCenter}
                  r={22.5}
                  fill="url(#exclusionGrad)"
                  stroke="#ef4444"
                  strokeWidth="1.5"
                />

                {/* User Target Radius (Dynamic circle) */}
                {targetSvgR > 0 && targetSvgR !== 120 && targetSvgR !== 30 && targetSvgR !== 22.5 && (
                  <circle
                    cx={svgCenter}
                    cy={svgCenter}
                    r={targetSvgR}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeDasharray="3 3"
                  />
                )}

                {/* Crosshairs */}
                <line x1={svgCenter - 130} y1={svgCenter} x2={svgCenter + 130} y2={svgCenter} stroke="#334155" strokeWidth="0.8" />
                <line x1={svgCenter} y1={svgCenter - 130} x2={svgCenter} y2={svgCenter + 130} stroke="#334155" strokeWidth="0.8" />

                {/* Player Marker at Center */}
                <circle cx={svgCenter} cy={svgCenter} r="4" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                <text x={svgCenter} y={svgCenter - 8} fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                  Player (0, 0)
                </text>

                {/* Zone Labels */}
                <text x={svgCenter} y={svgCenter + 18} fill="#fca5a5" fontSize="8" fontWeight="bold" textAnchor="middle">
                  0-24b (Exclusion)
                </text>
                <text x={svgCenter + 34} y={svgCenter - 6} fill="#fcd34d" fontSize="8" fontWeight="bold">
                  32b (Active)
                </text>
                <text x={svgCenter + 70} y={svgCenter - 6} fill="#7dd3fc" fontSize="8" fontWeight="bold">
                  128b (Despawn)
                </text>
              </svg>
            </div>
            <span className="text-[11px] text-slate-400 mt-2 text-center">
              Top-Down Plan: Red (Exclusion) &bull; Gold (Active) &bull; Blue (Despawn)
            </span>
          </div>

          {/* RIGHT: Calculated Metrics and Explanation */}
          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Radius</span>
                <span className="text-base font-bold font-mono text-emerald-400">
                  {result.measurements.radius} <span className="text-xs text-slate-400">blocks</span>
                </span>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Diameter</span>
                <span className="text-base font-bold font-mono text-slate-200">
                  {result.measurements.diameter} <span className="text-xs text-slate-400">blocks</span>
                </span>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 block">2D Area</span>
                <span className="text-base font-bold font-mono text-sky-400">
                  {result.measurements.circular_area_blocks.toLocaleString()} <span className="text-[10px] text-slate-400">blks²</span>
                </span>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 block">3D Volume</span>
                <span className="text-base font-bold font-mono text-purple-400">
                  {result.measurements.sphere_volume_blocks.toLocaleString()} <span className="text-[10px] text-slate-400">blks³</span>
                </span>
              </div>
            </div>

            {/* Vertical Range Altitude */}
            {result.measurements.vertical_range && (
              <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-lg flex items-center justify-between text-xs">
                <span className="text-emerald-300 font-semibold">
                  Vertical Altitude Span at Player Y = {playerYInput}:
                </span>
                <span className="font-mono text-white font-bold">
                  Y = {result.measurements.vertical_range.min_y} &rarr; Y = {result.measurements.vertical_range.max_y}
                </span>
              </div>
            )}

            {/* Geometric Explanation */}
            <div className="bg-slate-950/40 p-3.5 rounded-lg border border-slate-800 text-xs text-slate-300 leading-relaxed">
              {result.geometric_explanation}
            </div>

            {/* Applied Formulas List */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono">
              <span>Formulas:</span>
              <code className="bg-slate-800/80 px-2 py-0.5 rounded text-slate-300">D = 2r</code>
              <code className="bg-slate-800/80 px-2 py-0.5 rounded text-slate-300">Area = πr²</code>
              <code className="bg-slate-800/80 px-2 py-0.5 rounded text-slate-300">Vol = (4/3)πr³</code>
              <code className="bg-slate-800/80 px-2 py-0.5 rounded text-slate-300">Circ = 2πr</code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpawnSphereVisualizer;

