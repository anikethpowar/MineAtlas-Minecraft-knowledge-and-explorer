import React from 'react';
import { Link } from 'react-router-dom';
import { MobListItem } from '../../api/types';
import VersionBadge from '../common/VersionBadge';

interface MobCardProps {
  mob: MobListItem;
}

export const MobCard: React.FC<MobCardProps> = ({ mob }) => {
  // Format behavioral badge color
  const typeLower = (mob.mob_type || '').toLowerCase();
  let typeBadgeClass = 'bg-slate-800 text-slate-300 border-slate-700';
  if (typeLower === 'hostile') {
    typeBadgeClass = 'bg-red-500/10 text-red-400 border-red-500/30';
  } else if (typeLower === 'passive') {
    typeBadgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  } else if (typeLower === 'neutral') {
    typeBadgeClass = 'bg-amber-500/10 text-amber-300 border-amber-500/30';
  } else if (typeLower === 'boss') {
    typeBadgeClass = 'bg-purple-500/10 text-purple-300 border-purple-500/30';
  }

  // Hearts calculation: 2 HP = 1 heart
  const hearts = mob.hp !== null ? (mob.hp / 2).toFixed(mob.hp % 2 === 0 ? 0 : 1) : null;

  return (
    <Link
      to={`/mobs/${mob.id}`}
      data-testid={`mob-card-${mob.id}`}
      className="group block p-4 rounded-xl bg-mc-card border border-mc-border hover:border-mc-emerald hover:bg-mc-cardHover transition-all shadow-sm"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h3 className="text-base font-semibold text-slate-100 group-hover:text-emerald-300 transition-colors">
            {mob.name}
          </h3>
          <span className="text-xs font-mono text-mc-textMuted">{mob.id}</span>
        </div>
        <VersionBadge version={mob.version_added} />
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        {mob.mob_type && (
          <span className={`px-2 py-0.5 rounded text-[11px] font-mono border ${typeBadgeClass}`}>
            {mob.mob_type}
          </span>
        )}
        {mob.category && (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800/80 text-slate-300 border border-slate-700/60">
            {mob.category}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-mc-border/60">
        <div>
          <span className="text-mc-textMuted block text-[10px] uppercase tracking-wider font-mono">
            Health
          </span>
          <span className="text-slate-200 font-medium">
            {mob.hp !== null ? `${mob.hp} HP (${hearts} ♥)` : 'Variable'}
          </span>
        </div>
        <div>
          <span className="text-mc-textMuted block text-[10px] uppercase tracking-wider font-mono">
            Traits
          </span>
          <span className="text-slate-300">
            {mob.tameable && mob.breedable
              ? 'Tameable & Breedable'
              : mob.tameable
              ? 'Tameable'
              : mob.breedable
              ? 'Breedable'
              : 'Wild'}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default MobCard;

