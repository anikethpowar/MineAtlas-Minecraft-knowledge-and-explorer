import React from 'react';
import { FarmDiagramData } from '../../api/types';

interface FarmSchematicDiagramProps {
  farmId: string;
  farmName: string;
  diagramData: FarmDiagramData | null;
  className?: string;
}

export const FarmSchematicDiagram: React.FC<FarmSchematicDiagramProps> = ({
  farmId,
  farmName,
  diagramData,
  className = '',
}) => {
  // Render distinct, original vector schematics for each farm
  const renderSvgSchematic = () => {
    switch (farmId) {
      case 'iron-farm':
        return (
          <svg
            viewBox="0 0 600 360"
            className="w-full h-auto max-h-80 select-none"
            role="img"
            aria-labelledby="iron-farm-diagram-title iron-farm-diagram-desc"
          >
            <title id="iron-farm-diagram-title">Iron Golem Farm Elevation Schematic</title>
            <desc id="iron-farm-diagram-desc">
              Cross-section schematic showing the elevated golem spawning platform on top, the villager pod and zombie sight-break chamber in the middle, and the suspended lava blade over hoppers at the collection base.
            </desc>

            {/* Background grid */}
            <defs>
              <pattern id="iron-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.75" />
              </pattern>
            </defs>
            <rect width="600" height="360" fill="#0b0f12" />
            <rect width="600" height="360" fill="url(#iron-grid)" opacity="0.6" />

            {/* Ground Level Reference */}
            <line x1="40" y1="330" x2="560" y2="330" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
            <text x="50" y="345" fill="#64748b" fontSize="11" fontFamily="monospace">
              Natural Ground (Elevated 10-12 blocks above terrain to prevent surface spawns)
            </text>

            {/* Support Pillars */}
            <rect x="220" y="240" width="16" height="90" fill="#1e293b" stroke="#334155" />
            <rect x="364" y="240" width="16" height="90" fill="#1e293b" stroke="#334155" />

            {/* Zone 1: Golem Spawning Platform & Water Funnel */}
            <g>
              <rect x="140" y="40" width="320" height="48" rx="6" fill="#0e2a47" stroke="#38bdf8" strokeWidth="2" />
              <text x="300" y="66" textAnchor="middle" fill="#7dd3fc" fontSize="13" fontWeight="bold">
                Golem Spawning Platform (8x8 Solid Blocks)
              </text>
              <text x="300" y="80" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">
                Water Streams Push Golems Toward Central Drop
              </text>

              {/* Water flow arrows */}
              <path d="M 170 56 L 240 56 M 235 52 L 243 56 L 235 60" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
              <path d="M 430 56 L 360 56 M 365 52 L 357 56 L 365 60" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* Central Drop Chute */}
            <rect x="260" y="88" width="80" height="70" fill="#131c26" stroke="#475569" strokeDasharray="3 3" />
            <text x="300" y="125" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">
              Drop Hole &darr;
            </text>

            {/* Zone 2: Villager Pod (Left) */}
            <g>
              <rect x="130" y="130" width="115" height="70" rx="6" fill="#062e1f" stroke="#10b981" strokeWidth="2" />
              <text x="187" y="156" textAnchor="middle" fill="#6ee7b7" fontSize="12" fontWeight="bold">
                Villager Pod
              </text>
              <text x="187" y="172" textAnchor="middle" fill="#a7f3d0" fontSize="10">
                3 Beds &amp; Villagers
              </text>
              <text x="187" y="186" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="monospace">
                Glass Wall Enclosure
              </text>
            </g>

            {/* Zone 3: Sight Break Gap */}
            <g>
              <line x1="245" y1="165" x2="265" y2="165" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" />
              <text x="255" y="155" textAnchor="middle" fill="#fbbf24" fontSize="9" fontFamily="monospace">
                Gap
              </text>
            </g>

            {/* Zone 4: Zombie Bobbing Tube (Right of Villager Pod) */}
            <g>
              <rect x="270" y="130" width="60" height="70" rx="6" fill="#3a1318" stroke="#ef4444" strokeWidth="2" />
              <text x="300" y="156" textAnchor="middle" fill="#fca5a5" fontSize="11" fontWeight="bold">
                Zombie
              </text>
              <text x="300" y="172" textAnchor="middle" fill="#fecaca" fontSize="9">
                Name Tagged
              </text>
              <text x="300" y="186" textAnchor="middle" fill="#ef4444" fontSize="8" fontFamily="monospace">
                Bobbing Water
              </text>
            </g>

            {/* Zone 5: Suspended Lava Blade Kill Chamber */}
            <g>
              <rect x="355" y="130" width="115" height="70" rx="6" fill="#381d09" stroke="#f97316" strokeWidth="2" />
              <text x="412" y="156" textAnchor="middle" fill="#fdba74" fontSize="12" fontWeight="bold">
                Lava Blade
              </text>
              <text x="412" y="172" textAnchor="middle" fill="#fed7aa" fontSize="10">
                Suspended on Signs
              </text>
              <text x="412" y="186" textAnchor="middle" fill="#fb923c" fontSize="9" fontFamily="monospace">
                Burns Golem Hitbox
              </text>
            </g>

            {/* Zone 6: Hopper Floor & Collection Chest */}
            <g>
              <rect x="355" y="210" width="115" height="40" rx="4" fill="#1e1b4b" stroke="#818cf8" strokeWidth="2" />
              <text x="412" y="228" textAnchor="middle" fill="#c7d2fe" fontSize="11" fontWeight="bold">
                Hopper Floor
              </text>
              <text x="412" y="242" textAnchor="middle" fill="#a5b4fc" fontSize="9" fontFamily="monospace">
                &rarr; Storage Chests
              </text>
            </g>
          </svg>
        );

      case 'raid-farm':
        return (
          <svg
            viewBox="0 0 600 360"
            className="w-full h-auto max-h-80 select-none"
            role="img"
            aria-labelledby="raid-farm-diagram-title raid-farm-diagram-desc"
          >
            <title id="raid-farm-diagram-title">Bad Omen Raid Farm Ocean Altitude Schematic</title>
            <desc id="raid-farm-diagram-desc">
              Elevation schematic illustrating high-altitude ocean isolation, artificial village center anchor, isolated raid spawn platform, 28-block fall chute, and safe player AFK collection chamber.
            </desc>

            <defs>
              <pattern id="raid-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.75" />
              </pattern>
            </defs>
            <rect width="600" height="360" fill="#0b0f12" />
            <rect width="600" height="360" fill="url(#raid-grid)" opacity="0.6" />

            {/* Ocean Surface Line */}
            <rect x="40" y="325" width="520" height="20" fill="#082f49" />
            <line x1="40" y1="325" x2="560" y2="325" stroke="#0284c7" strokeWidth="2" />
            <text x="50" y="340" fill="#38bdf8" fontSize="11" fontFamily="monospace">
              Deep Ocean Surface (Y=63) — Zero Subterranean Caves in 128-block Sphere
            </text>

            {/* High Altitude Anchor Pod (Top Right) */}
            <g>
              <rect x="360" y="30" width="180" height="52" rx="6" fill="#062e1f" stroke="#10b981" strokeWidth="2" />
              <text x="450" y="52" textAnchor="middle" fill="#6ee7b7" fontSize="12" fontWeight="bold">
                Village Center Anchor (Y &gt; 180)
              </text>
              <text x="450" y="68" textAnchor="middle" fill="#a7f3d0" fontSize="10" fontFamily="monospace">
                1 Villager + Bed + Workstation
              </text>
            </g>

            {/* Spawn Platform (Top Left, ~30 blocks away) */}
            <g>
              <rect x="80" y="70" width="190" height="46" rx="6" fill="#3a1318" stroke="#ef4444" strokeWidth="2" />
              <text x="175" y="92" textAnchor="middle" fill="#fca5a5" fontSize="12" fontWeight="bold">
                Raid Spawning Platform
              </text>
              <text x="175" y="106" textAnchor="middle" fill="#fecaca" fontSize="9" fontFamily="monospace">
                Compact Solid Surface + Trapdoor Edge
              </text>
            </g>

            {/* Fall Chute */}
            <g>
              <rect x="125" y="116" width="100" height="120" fill="#131c26" stroke="#64748b" strokeDasharray="3 3" />
              <path d="M 175 125 L 175 225 M 168 215 L 175 225 L 182 215" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
              <text x="175" y="175" textAnchor="middle" fill="#f87171" fontSize="10" fontWeight="bold" fontFamily="monospace">
                28-30 Block Fall
              </text>
              <text x="175" y="190" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">
                Lethal Fall Damage
              </text>
            </g>

            {/* Safe Player AFK & Hopper Collection Chamber */}
            <g>
              <rect x="90" y="245" width="170" height="60" rx="6" fill="#1e1b4b" stroke="#818cf8" strokeWidth="2" />
              <text x="175" y="268" textAnchor="middle" fill="#c7d2fe" fontSize="12" fontWeight="bold">
                Safe AFK &amp; Loot Chute
              </text>
              <text x="175" y="284" textAnchor="middle" fill="#a5b4fc" fontSize="10">
                Hoppers &amp; Chest Array
              </text>
              <text x="175" y="296" textAnchor="middle" fill="#818cf8" fontSize="8" fontFamily="monospace">
                Shielded from Vexes &amp; Witches
              </text>
            </g>

            {/* Java 1.21 Note Marker */}
            <rect x="290" y="160" width="250" height="70" rx="6" fill="#171b26" stroke="#f59e0b" strokeWidth="1" />
            <text x="305" y="180" fill="#fbbf24" fontSize="11" fontWeight="bold">
              Java 1.21+ Trigger Requirement:
            </text>
            <text x="305" y="198" fill="#cbd5e1" fontSize="9">
              Drink Ominous Bottle near village anchor.
            </text>
            <text x="305" y="212" fill="#cbd5e1" fontSize="9">
              Wait 30s for &quot;Raid Omen&quot; countdown to expire.
            </text>
          </svg>
        );

      case 'villager-breeder':
        return (
          <svg
            viewBox="0 0 600 360"
            className="w-full h-auto max-h-80 select-none"
            role="img"
            aria-labelledby="breeder-diagram-title breeder-diagram-desc"
          >
            <title id="breeder-diagram-title">Automatic Villager Breeder Chute Schematic</title>
            <desc id="breeder-diagram-desc">
              Side-by-side plan schematic showing parent villager chamber on the left, open trapdoor drop trench in the middle, valid bed chamber with 2-block headroom on the right, and water flume underneath moving babies away.
            </desc>

            <defs>
              <pattern id="breeder-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.75" />
              </pattern>
            </defs>
            <rect width="600" height="360" fill="#0b0f12" />
            <rect width="600" height="360" fill="url(#breeder-grid)" opacity="0.6" />

            {/* Zone 1: Parent Breeder Pod (Left) */}
            <g>
              <rect x="50" y="60" width="150" height="150" rx="8" fill="#062e1f" stroke="#10b981" strokeWidth="2" />
              <text x="125" y="95" textAnchor="middle" fill="#6ee7b7" fontSize="13" fontWeight="bold">
                Parent Villager Pod
              </text>
              <text x="125" y="115" textAnchor="middle" fill="#a7f3d0" fontSize="11">
                2 Adult Villagers
              </text>
              <text x="125" y="135" textAnchor="middle" fill="#cbd5e1" fontSize="10">
                Fed Carrots / Bread
              </text>
              <text x="125" y="165" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="monospace">
                Adults CANNOT fit
              </text>
              <text x="125" y="180" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="monospace">
                through 1-block gap
              </text>
            </g>

            {/* Zone 2: Trapdoor Separation Trench (Center) */}
            <g>
              <rect x="210" y="60" width="80" height="150" rx="6" fill="#2d1b09" stroke="#f59e0b" strokeWidth="2" />
              <text x="250" y="95" textAnchor="middle" fill="#fde68a" fontSize="11" fontWeight="bold">
                Open
              </text>
              <text x="250" y="110" textAnchor="middle" fill="#fde68a" fontSize="11" fontWeight="bold">
                Trapdoors
              </text>
              <text x="250" y="135" textAnchor="middle" fill="#fef3c7" fontSize="9">
                Babies walk
              </text>
              <text x="250" y="148" textAnchor="middle" fill="#fef3c7" fontSize="9">
                over gap &amp; fall
              </text>
              <path d="M 250 160 L 250 195 M 244 185 L 250 195 L 256 185" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* Zone 3: Unclaimed Bed Room (Right) */}
            <g>
              <rect x="300" y="60" width="240" height="150" rx="8" fill="#0e2a47" stroke="#38bdf8" strokeWidth="2" />
              <text x="420" y="95" textAnchor="middle" fill="#7dd3fc" fontSize="13" fontWeight="bold">
                Unclaimed Bed Chamber
              </text>
              <text x="420" y="115" textAnchor="middle" fill="#bae6fd" fontSize="11">
                3+ Accessible Beds
              </text>
              <rect x="320" y="130" width="200" height="60" rx="4" fill="#091c2e" stroke="#0284c7" strokeDasharray="3 3" />
              <text x="420" y="155" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold">
                CRITICAL: 2 Full Air Blocks
              </text>
              <text x="420" y="172" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                Clearance Above Mattresses
              </text>
            </g>

            {/* Zone 4: Water Canal Transport Flume (Bottom) */}
            <g>
              <rect x="210" y="240" width="330" height="55" rx="6" fill="#072b38" stroke="#14b8a6" strokeWidth="2" />
              <text x="375" y="265" textAnchor="middle" fill="#5eead4" fontSize="12" fontWeight="bold">
                Water Transport Chute (Flume)
              </text>
              <text x="375" y="282" textAnchor="middle" fill="#99f6e4" fontSize="10" fontFamily="monospace">
                Transports baby villagers 16+ blocks away to unlink beds &rarr;
              </text>
              <path d="M 230 268 L 300 268 M 292 263 L 300 268 L 292 273" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" />
            </g>
          </svg>
        );

      default:
        return (
          <div className="p-8 text-center text-slate-400 font-mono text-xs">
            Visual schematic diagram available for this curated farm.
          </div>
        );
    }
  };

  return (
    <div
      data-testid="farm-schematic-diagram"
      className={`rounded-xl bg-mc-card border border-mc-border overflow-hidden shadow-md ${className}`}
    >
      <div className="p-4 border-b border-mc-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            <span>{farmName} &mdash; Architectural Schematic</span>
          </h3>
          <p className="text-xs text-mc-textMuted mt-0.5">
            Explanatory spatial layout showing functional zones (not a copied block-by-block construction blueprint).
          </p>
        </div>
        <span className="px-2.5 py-1 rounded text-[11px] font-mono uppercase bg-orange-500/10 text-orange-300 border border-orange-500/30 self-start sm:self-auto">
          Explanatory Diagram
        </span>
      </div>

      {/* SVG Canvas */}
      <div className="p-3 bg-slate-950 flex justify-center items-center">
        {renderSvgSchematic()}
      </div>

      {/* Accessible Textual Breakdown of Functional Zones */}
      {diagramData && diagramData.zones && diagramData.zones.length > 0 && (
        <div className="p-4 bg-slate-900/60 border-t border-mc-border/80 text-xs space-y-2">
          <span className="text-[11px] font-mono uppercase text-mc-textMuted block font-semibold">
            Functional Zone Breakdown
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {diagramData.zones.map((zone) => (
              <div
                key={zone.id}
                className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-orange-400 shrink-0" />
                <span className="text-slate-200 font-medium">{zone.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
