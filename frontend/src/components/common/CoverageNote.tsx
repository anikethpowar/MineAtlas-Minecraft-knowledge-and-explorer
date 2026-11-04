import React from 'react';

interface CoverageNoteProps {
  entityType: 'item' | 'mob' | 'biome' | 'structure' | 'general';
  customNote?: string | null;
  className?: string;
}

/**
 * CoverageNote Component
 *
 * Explicitly sets user expectations regarding coverage scope and source boundaries.
 * For example: Items explorer covers 100 curated representative items and key blocks
 * from the Astroworld API, not the full 1000+ Minecraft block registry.
 */
export const CoverageNote: React.FC<CoverageNoteProps> = ({
  entityType,
  customNote,
  className = '',
}) => {
  let defaultNote = '';

  switch (entityType) {
    case 'item':
      defaultNote =
        'Items & Key Blocks Explorer — currently indexing 100 key representative items and blocks cached from Astroworld API. MineAtlas does not claim full block registry coverage.';
      break;
    case 'mob':
      defaultNote =
        'Mobs Explorer — covering 76 Java Edition mobs with combat stats, behavioral classification, and breeding data cached from Astroworld API.';
      break;
    case 'biome':
      defaultNote =
        'Biomes Explorer — covering 64 Java Edition biomes across Overworld, Nether, and The End with temperature and precipitation data.';
      break;
    case 'structure':
      defaultNote =
        'Structures Explorer — covering 24 world structures across dimensions with altitude ranges and finding strategies.';
      break;
    case 'general':
    default:
      defaultNote =
        'Data cached locally in SQLite from Astroworld API for Minecraft Java Edition under strict rate-limit protection.';
      break;
  }

  const message = customNote || defaultNote;

  return (
    <div
      className={`flex items-start gap-2.5 p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-mc-textMuted ${className}`}
    >
      <svg
        className="w-4 h-4 text-sky-400 shrink-0 mt-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <div>
        <span className="font-semibold text-slate-300">Coverage Scope: </span>
        <span>{message}</span>
      </div>
    </div>
  );
};

export default CoverageNote;

