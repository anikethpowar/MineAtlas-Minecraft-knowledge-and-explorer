import React from 'react';

interface SourceBadgeProps {
  sourceType: string;
  sourceUrl?: string | null;
  className?: string;
}

/**
 * SourceBadge Component
 *
 * Visually distinguishes data provenance:
 * - astroworld_api: Blue/cyan badge representing cached upstream data
 * - curated: Violet/purple badge representing human-verified guides or mappings
 * - calculated: Emerald/green badge representing derived graph relationships
 * - local_cache / other: Slate badge
 */
export const SourceBadge: React.FC<SourceBadgeProps> = ({
  sourceType,
  sourceUrl,
  className = '',
}) => {
  const normalized = sourceType.toLowerCase();

  let label = 'API Cached';
  let badgeClasses =
    'bg-sky-500/10 text-sky-400 border-sky-500/30 hover:border-sky-500/50';

  if (normalized.includes('curated') || normalized.includes('manual')) {
    label = 'Curated';
    badgeClasses =
      'bg-purple-500/10 text-purple-300 border-purple-500/30 hover:border-purple-500/50';
  } else if (normalized === 'calculated' || normalized.includes('calc')) {
    label = 'Calculated Result';
    badgeClasses =
      'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:border-emerald-500/50';
  } else if (normalized.includes('derived') || normalized.includes('graph')) {
    label = 'Derived Relation';
    badgeClasses =
      'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:border-emerald-500/50';
  } else if (normalized.includes('astroworld')) {
    label = 'Astroworld API';
    badgeClasses =
      'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:border-cyan-500/50';
  }

  const badgeContent = (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium border ${badgeClasses} ${className}`}
      title={`Provenance: ${sourceType}${sourceUrl ? ` (${sourceUrl})` : ''}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
      {label}
    </span>
  );

  return badgeContent;
};

export default SourceBadge;

