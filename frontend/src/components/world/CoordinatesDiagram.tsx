import React from 'react';

/**
 * Responsive SVG diagram illustrating the Minecraft Java Edition 3-axis coordinate system,
 * cardinal compass directions, altitude scale (-64 to 320), and world border limits.
 */
export const CoordinatesDiagram: React.FC = () => {
  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 mb-4 gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
            Minecraft Java Edition Coordinate Reference Diagram
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Cartesian 3-Axis Orientation, Compass Bearings &amp; Java 1.18+ Altitude Scale
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded">X: East/West</span>
          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">Y: Altitude</span>
          <span className="px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded">Z: South/North</span>
        </div>
      </div>

      <div className="w-full overflow-x-auto flex justify-center">
        <svg
          viewBox="0 0 640 340"
          className="w-full max-w-2xl h-auto select-none"
          role="img"
          aria-label="Minecraft Java Edition Coordinate System and Altitude Diagram"
        >
          <defs>
            {/* Grid pattern */}
            <pattern id="diag-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#334155" strokeWidth="0.5" strokeOpacity="0.4" />
            </pattern>
            {/* Gradients */}
            <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="deepGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.9" />
            </linearGradient>
            <marker id="arrow-rose" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e" />
            </marker>
            <marker id="arrow-emerald" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
            </marker>
            <marker id="arrow-sky" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#0ea5e9" />
            </marker>
          </defs>

          {/* Background grid */}
          <rect width="640" height="340" fill="url(#diag-grid)" rx="8" />

          {/* LEFT: Horizontal Axes Isometric Projection */}
          <g transform="translate(180, 170)">
            {/* Sub-grid ground plate */}
            <polygon
              points="-140,0 0,-70 140,0 0,70"
              fill="#1e293b"
              fillOpacity="0.3"
              stroke="#475569"
              strokeWidth="1"
              strokeDasharray="3 3"
            />

            {/* X-Axis: West (-) to East (+) */}
            <line
              x1="-130"
              y1="30"
              x2="130"
              y2="-30"
              stroke="#f43f5e"
              strokeWidth="2.5"
              markerEnd="url(#arrow-rose)"
            />
            {/* Z-Axis: North (-) to South (+) */}
            <line
              x1="-110"
              y1="-45"
              x2="110"
              y2="45"
              stroke="#0ea5e9"
              strokeWidth="2.5"
              markerEnd="url(#arrow-sky)"
            />
            {/* Y-Axis: Down (-) to Up (+) */}
            <line
              x1="0"
              y1="110"
              x2="0"
              y2="-120"
              stroke="#10b981"
              strokeWidth="3"
              markerEnd="url(#arrow-emerald)"
            />

            {/* Center Origin (0, 0, 0) */}
            <circle cx="0" cy="0" r="5" fill="#facc15" stroke="#713f12" strokeWidth="1.5" />
            <text x="8" y="16" fill="#facc15" fontSize="11" fontWeight="bold" fontFamily="monospace">
              Origin (0, 0, 0)
            </text>

            {/* Axis labels */}
            {/* +X East */}
            <g transform="translate(135, -34)">
              <rect x="-4" y="-12" width="60" height="18" rx="3" fill="#881337" fillOpacity="0.8" />
              <text x="26" y="0" fill="#fda4af" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                +X (East)
              </text>
            </g>
            {/* -X West */}
            <g transform="translate(-190, 36)">
              <rect x="-4" y="-12" width="60" height="18" rx="3" fill="#881337" fillOpacity="0.8" />
              <text x="26" y="0" fill="#fda4af" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                -X (West)
              </text>
            </g>

            {/* +Z South */}
            <g transform="translate(115, 48)">
              <rect x="-4" y="-12" width="66" height="18" rx="3" fill="#0369a1" fillOpacity="0.8" />
              <text x="29" y="0" fill="#bae6fd" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                +Z (South)
              </text>
            </g>
            {/* -Z North */}
            <g transform="translate(-175, -48)">
              <rect x="-4" y="-12" width="66" height="18" rx="3" fill="#0369a1" fillOpacity="0.8" />
              <text x="29" y="0" fill="#bae6fd" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                -Z (North)
              </text>
            </g>

            {/* +Y Up */}
            <g transform="translate(-30, -125)">
              <rect x="0" y="-12" width="60" height="18" rx="3" fill="#065f46" fillOpacity="0.8" />
              <text x="30" y="0" fill="#a7f3d0" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                +Y (Sky)
              </text>
            </g>
            {/* -Y Bedrock */}
            <g transform="translate(-30, 125)">
              <rect x="-8" y="-12" width="76" height="18" rx="3" fill="#065f46" fillOpacity="0.8" />
              <text x="30" y="0" fill="#a7f3d0" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                -Y (Depth)
              </text>
            </g>
          </g>

          {/* RIGHT: Java 1.18+ Altitude Layer Column */}
          <g transform="translate(420, 30)">
            <rect x="0" y="0" width="190" height="280" rx="8" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <text x="95" y="20" fill="#e2e8f0" fontSize="11" fontWeight="bold" textAnchor="middle">
              Java 1.18+ Altitude Slices
            </text>

            {/* Sky Level Y=320 */}
            <g transform="translate(12, 40)">
              <rect x="0" y="0" width="166" height="38" rx="4" fill="url(#skyGrad)" stroke="#38bdf8" strokeWidth="1" />
              <text x="8" y="16" fill="#38bdf8" fontSize="11" fontWeight="bold" fontFamily="monospace">Y = 320</text>
              <text x="64" y="16" fill="#bae6fd" fontSize="10">Build Limit (Sky)</text>
              <text x="8" y="30" fill="#7dd3fc" fontSize="9">Clouds at Y=192</text>
            </g>

            {/* Sea Level Y=63 */}
            <g transform="translate(12, 92)">
              <rect x="0" y="0" width="166" height="42" rx="4" fill="#0284c7" fillOpacity="0.15" stroke="#0ea5e9" strokeWidth="1" />
              <text x="8" y="18" fill="#38bdf8" fontSize="11" fontWeight="bold" fontFamily="monospace">Y = 63</text>
              <text x="56" y="18" fill="#e0f2fe" fontSize="10">Sea Level (Oceans)</text>
              <text x="8" y="32" fill="#94a3b8" fontSize="9">Surface terrain Y=60 to Y=120</text>
            </g>

            {/* Deepslate transition Y=0 */}
            <g transform="translate(12, 148)">
              <rect x="0" y="0" width="166" height="42" rx="4" fill="#334155" fillOpacity="0.3" stroke="#64748b" strokeWidth="1" />
              <text x="8" y="18" fill="#e2e8f0" fontSize="11" fontWeight="bold" fontFamily="monospace">Y = 0</text>
              <text x="48" y="18" fill="#cbd5e1" fontSize="10">Deepslate Transition</text>
              <text x="8" y="32" fill="#94a3b8" fontSize="9">Historic bedrock floor (pre-1.18)</text>
            </g>

            {/* Bedrock Floor Y=-64 */}
            <g transform="translate(12, 204)">
              <rect x="0" y="0" width="166" height="42" rx="4" fill="url(#deepGrad)" stroke="#ef4444" strokeWidth="1" />
              <text x="8" y="18" fill="#f87171" fontSize="11" fontWeight="bold" fontFamily="monospace">Y = -64</text>
              <text x="60" y="18" fill="#fca5a5" fontSize="10">World Bedrock Floor</text>
              <text x="8" y="32" fill="#ef4444" fontSize="9">The Void below Y &lt; -64</text>
            </g>

            {/* World Border Note */}
            <g transform="translate(12, 256)">
              <text x="83" y="14" fill="#f59e0b" fontSize="9" fontWeight="bold" textAnchor="middle">
                World Border: X/Z ±29,999,984
              </text>
            </g>
          </g>
        </svg>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800 text-xs text-slate-300">
        <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
          <span className="font-semibold text-rose-400 block mb-1">X-Axis (Horizontal)</span>
          Increasing values move <strong className="text-white">East</strong>. Decreasing values move <strong className="text-white">West</strong>.
        </div>
        <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
          <span className="font-semibold text-emerald-400 block mb-1">Y-Axis (Vertical Altitude)</span>
          Measures vertical height from bedrock floor (<strong className="text-white">Y=-64</strong>) to sky ceiling (<strong className="text-white">Y=320</strong>).
        </div>
        <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
          <span className="font-semibold text-sky-400 block mb-1">Z-Axis (Horizontal)</span>
          Increasing values move <strong className="text-white">South</strong>. Decreasing values move <strong className="text-white">North</strong>.
        </div>
      </div>
    </div>
  );
};

export default CoordinatesDiagram;

