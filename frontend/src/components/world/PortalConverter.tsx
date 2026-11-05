import React, { useState } from 'react';
import { convertPortalCoordinates } from '../../api/mineatlasApi';
import { PortalConvertResponse } from '../../api/types';
import SourceBadge from '../common/SourceBadge';
import EditionBadge from '../common/EditionBadge';

export const PortalConverter: React.FC = () => {
  const [sourceDim, setSourceDim] = useState<'overworld' | 'nether'>('overworld');
  const [coordX, setCoordX] = useState<string>('800');
  const [coordY, setCoordY] = useState<string>('64');
  const [coordZ, setCoordZ] = useState<string>('-1600');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PortalConvertResponse | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleToggleDimension = () => {
    setSourceDim((prev) => (prev === 'overworld' ? 'nether' : 'overworld'));
    setResult(null);
  };

  const handleCalculate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const x = parseFloat(coordX);
    const y = parseFloat(coordY);
    const z = parseFloat(coordZ);

    if (isNaN(x) || isNaN(y) || isNaN(z)) {
      setError('Please enter valid numeric values for X, Y, and Z coordinates.');
      return;
    }

    if (x < -30000000 || x > 30000000 || z < -30000000 || z > 30000000) {
      setError('Horizontal coordinates must fall within the Minecraft Java world border (±30,000,000).');
      return;
    }

    if (y < -64 || y > 320) {
      setError('Y altitude must be between -64 and 320 for Minecraft Java Edition.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await convertPortalCoordinates({
        source_dimension: sourceDim,
        x,
        y,
        z,
      });
      setResult(res);
      setCopied(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Portal conversion calculation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSourceDim('overworld');
    setCoordX('800');
    setCoordY('64');
    setCoordZ('-1600');
    setError(null);
    setResult(null);
    setCopied(false);
  };

  const handleCopyTarget = () => {
    if (!result) return;
    const tgt = result.target_coordinates;
    const formatted = `X: ${tgt.x}, Y: ${tgt.y}, Z: ${tgt.z}`;
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-slate-100">
              Nether Portal Coordinate Converter
            </h3>
            <SourceBadge sourceType="calculated" />
            <EditionBadge edition="java" />
          </div>
          <p className="text-xs text-slate-400">
            Calculates exact 8:1 horizontal coordinate scale targets between The Overworld and The Nether.
          </p>
        </div>

        {/* Direction Switcher Toggle */}
        <button
          type="button"
          onClick={handleToggleDimension}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
        >
          <span>Direction:</span>
          <span className="font-bold text-amber-400 capitalize">
            {sourceDim === 'overworld' ? 'Overworld → Nether (÷ 8)' : 'Nether → Overworld (× 8)'}
          </span>
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </button>
      </div>

      {/* Calculator Form */}
      <form onSubmit={handleCalculate} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="portal-x" className="block text-xs font-semibold text-rose-400 mb-1">
              Source X (East / West)
            </label>
            <input
              id="portal-x"
              type="number"
              step="any"
              value={coordX}
              onChange={(e) => setCoordX(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. 800"
              required
            />
          </div>
          <div>
            <label htmlFor="portal-y" className="block text-xs font-semibold text-emerald-400 mb-1">
              Altitude Y (-64 to 320)
            </label>
            <input
              id="portal-y"
              type="number"
              step="any"
              value={coordY}
              onChange={(e) => setCoordY(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. 64"
              required
            />
          </div>
          <div>
            <label htmlFor="portal-z" className="block text-xs font-semibold text-sky-400 mb-1">
              Source Z (South / North)
            </label>
            <input
              id="portal-z"
              type="number"
              step="any"
              value={coordZ}
              onChange={(e) => setCoordZ(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. -1600"
              required
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs">
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50"
          >
            {loading ? 'Calculating...' : 'Calculate Coordinates'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition"
          >
            Reset
          </button>
        </div>
      </form>

      {/* Calculated Results Panel */}
      {result && (
        <div className="bg-slate-950/70 border border-emerald-500/30 rounded-xl p-5 space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                Calculated Target Coordinates
              </span>
              <span className="text-sm font-medium text-slate-300">
                Target Realm: <strong className="text-white capitalize">{result.target_dimension}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyTarget}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-semibold transition"
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Copied Coordinates!</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Copy Target Coordinates</span>
                </>
              )}
            </button>
          </div>

          {/* Coordinate Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1 capitalize">
                Source ({result.source_dimension})
              </span>
              <div className="font-mono text-base text-slate-200">
                X: <span className="text-rose-400 font-bold">{result.source_coordinates.x}</span>,{' '}
                Y: <span className="text-emerald-400 font-bold">{result.source_coordinates.y}</span>,{' '}
                Z: <span className="text-sky-400 font-bold">{result.source_coordinates.z}</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-950/20 rounded-lg border border-emerald-500/40">
              <span className="text-xs text-emerald-400 block mb-1 capitalize">
                Target ({result.target_dimension})
              </span>
              <div className="font-mono text-lg text-emerald-300">
                X: <span className="text-rose-300 font-bold">{result.target_coordinates.x}</span>,{' '}
                Y: <span className="text-emerald-300 font-bold">{result.target_coordinates.y}</span>,{' '}
                Z: <span className="text-sky-300 font-bold">{result.target_coordinates.z}</span>
              </div>
            </div>
          </div>

          {/* Mathematical Formula & Altitude Explanation */}
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 text-xs space-y-2">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="font-semibold text-slate-200">Applied Formula:</span>
              <code className="px-1.5 py-0.5 bg-slate-800 text-amber-300 rounded font-mono">
                {result.formula_expression}
              </code>
            </div>
            <p className="text-slate-400 leading-relaxed">
              {result.formula_explanation}
            </p>
            <p className="text-slate-400 text-[11px] italic">
              Vertical Y coordinate ({result.target_coordinates.y}) is preserved unchanged as an altitude reference. In Minecraft Java Edition, vertical dimensions do not scale between realms.
            </p>
          </div>

          {/* Limitations Banner */}
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300 space-y-1">
            <span className="font-semibold block flex items-center gap-1.5 text-amber-200">
              <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Calculated Target Limitation Notice
            </span>
            <p className="text-amber-300/90 leading-relaxed">
              {result.limitations[0]}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortalConverter;

