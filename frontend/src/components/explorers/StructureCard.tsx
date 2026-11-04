import React from 'react';
import { Link } from 'react-router-dom';
import { StructureListItem } from '../../api/types';
import VersionBadge from '../common/VersionBadge';

interface StructureCardProps {
  structure: StructureListItem;
}

export const StructureCard: React.FC<StructureCardProps> = ({ structure }) => {
  const dimLower = (structure.dimension || '').toLowerCase();
  let dimBadge = 'Overworld';
  let dimClass = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
  if (dimLower.includes('nether')) {
    dimBadge = 'Nether';
    dimClass = 'bg-red-500/10 text-red-300 border-red-500/30';
  } else if (dimLower.includes('end')) {
    dimBadge = 'The End';
    dimClass = 'bg-purple-500/10 text-purple-300 border-purple-500/30';
  }

  const yRange =
    structure.y_min !== null && structure.y_max !== null
      ? `Y: ${structure.y_min} to ${structure.y_max}`
      : structure.y_min !== null
      ? `Y: ≥ ${structure.y_min}`
      : 'Surface / Varied';

  return (
    <Link
      to={`/structures/${structure.id}`}
      data-testid={`structure-card-${structure.id}`}
      className="group block p-4 rounded-xl bg-mc-card border border-mc-border hover:border-mc-emerald hover:bg-mc-cardHover transition-all shadow-sm"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h3 className="text-base font-semibold text-slate-100 group-hover:text-emerald-300 transition-colors">
            {structure.name}
          </h3>
          <span className="text-xs font-mono text-mc-textMuted">{structure.id}</span>
        </div>
        <VersionBadge version={structure.version_added} />
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <span className={`px-2 py-0.5 rounded text-[11px] font-mono border ${dimClass}`}>
          {dimBadge}
        </span>
        {structure.category && (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700/60">
            {structure.category}
          </span>
        )}
        {structure.rarity && (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30">
            {structure.rarity}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-mc-border/60">
        <div>
          <span className="text-mc-textMuted block text-[10px] uppercase tracking-wider font-mono">
            Altitude Range
          </span>
          <span className="text-slate-200 font-mono font-medium">{yRange}</span>
        </div>
        <div>
          <span className="text-mc-textMuted block text-[10px] uppercase tracking-wider font-mono">
            Dimension
          </span>
          <span className="text-slate-300">{dimBadge}</span>
        </div>
      </div>
    </Link>
  );
};

export default StructureCard;

