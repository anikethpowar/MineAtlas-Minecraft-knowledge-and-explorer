import React from 'react';
import { Link } from 'react-router-dom';
import { BiomeListItem } from '../../api/types';
import VersionBadge from '../common/VersionBadge';

interface BiomeCardProps {
  biome: BiomeListItem;
}

export const BiomeCard: React.FC<BiomeCardProps> = ({ biome }) => {
  const dimLower = (biome.dimension || '').toLowerCase();
  let dimBadge = 'Overworld';
  let dimClass = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
  if (dimLower.includes('nether')) {
    dimBadge = 'Nether';
    dimClass = 'bg-red-500/10 text-red-300 border-red-500/30';
  } else if (dimLower.includes('end')) {
    dimBadge = 'The End';
    dimClass = 'bg-purple-500/10 text-purple-300 border-purple-500/30';
  }

  return (
    <Link
      to={`/biomes/${biome.id}`}
      data-testid={`biome-card-${biome.id}`}
      className="group block p-4 rounded-xl bg-mc-card border border-mc-border hover:border-mc-emerald hover:bg-mc-cardHover transition-all shadow-sm"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h3 className="text-base font-semibold text-slate-100 group-hover:text-emerald-300 transition-colors">
            {biome.name}
          </h3>
          <span className="text-xs font-mono text-mc-textMuted">{biome.id}</span>
        </div>
        <VersionBadge version={biome.version_added} />
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <span className={`px-2 py-0.5 rounded text-[11px] font-mono border ${dimClass}`}>
          {dimBadge}
        </span>
        {biome.category && (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700/60">
            {biome.category}
          </span>
        )}
        {biome.rarity && (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-900 text-slate-400 border border-slate-800">
            {biome.rarity}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-mc-border/60">
        <div>
          <span className="text-mc-textMuted block text-[10px] uppercase tracking-wider font-mono">
            Temperature
          </span>
          <span className="text-slate-200 font-medium">
            {biome.temperature !== null ? `${biome.temperature}°C` : 'N/A'}
          </span>
        </div>
        <div>
          <span className="text-mc-textMuted block text-[10px] uppercase tracking-wider font-mono">
            Precipitation
          </span>
          <span className="text-slate-300 capitalize">
            {biome.precipitation || 'None'}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default BiomeCard;

