import React, { useState } from 'react';

interface GraphLegendProps {
  className?: string;
}

export const GraphLegend: React.FC<GraphLegendProps> = ({ className = '' }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const legendItems = [
    { type: 'Mob', shape: 'Rounded Rect', color: 'border-red-500 bg-red-950/40 text-red-300' },
    { type: 'Biome', shape: 'Hexagon', color: 'border-emerald-500 bg-emerald-950/40 text-emerald-300' },
    { type: 'Item / Key Block', shape: 'Diamond', color: 'border-sky-400 bg-sky-950/40 text-sky-300' },
    { type: 'Structure', shape: 'Rectangle', color: 'border-amber-500 bg-amber-950/40 text-amber-300' },
    { type: 'Enchantment', shape: 'Ellipse', color: 'border-purple-400 bg-purple-950/40 text-purple-300' },
    { type: 'Version', shape: 'Tag', color: 'border-slate-500 bg-slate-900 text-slate-300' },
    { type: 'Achievement', shape: 'Star', color: 'border-yellow-400 bg-yellow-950/40 text-yellow-300' },
    { type: 'Trade', shape: 'Parallelogram', color: 'border-teal-400 bg-teal-950/40 text-teal-300' },
    { type: 'Profession', shape: 'Rounded Square', color: 'border-indigo-400 bg-indigo-950/40 text-indigo-300' },
    { type: 'Dimension', shape: 'Container', color: 'border-purple-500 bg-purple-950/40 text-purple-300' },
  ];

  return (
    <div
      className={`rounded-xl bg-mc-card/90 backdrop-blur border border-mc-border text-xs text-mc-textMuted shadow-lg ${className}`}
    >
      <div className="p-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 font-semibold text-slate-200 hover:text-emerald-400 transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90 text-emerald-400' : 'text-slate-400'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span>Visual Legend &amp; Entity Shapes</span>
        </button>

        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
            Root Center
          </span>
          <span className="hidden sm:inline text-slate-500">|</span>
          <span className="hidden sm:inline text-slate-400">Arrow = Source &rarr; Target</span>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 pt-1 border-t border-mc-border/60 space-y-3">
          {/* Shapes Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-2">
            {legendItems.map((item) => (
              <div
                key={item.type}
                className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-2"
              >
                <span className={`w-3 h-3 rounded-sm border shrink-0 ${item.color}`} />
                <div className="min-w-0">
                  <span className="block font-medium text-slate-200 truncate">{item.type}</span>
                  <span className="block text-[10px] text-slate-500 font-mono">{item.shape}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Relationship Direction and Bounds */}
          <div className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/80 text-[11px] leading-relaxed flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <span className="font-semibold text-slate-300">Relationship Direction: </span>
              <span>Arrows point from subject to object (e.g. <code className="text-slate-200">Zombie &rarr; DROPS &rarr; Rotten Flesh</code>).</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400/90 shrink-0">
              Max 2-hop radius for safety &amp; clarity
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GraphLegend;

