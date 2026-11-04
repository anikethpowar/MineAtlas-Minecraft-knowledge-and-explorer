import React from 'react';
import { Link } from 'react-router-dom';
import { ItemListItem } from '../../api/types';
import VersionBadge from '../common/VersionBadge';

interface ItemCardProps {
  item: ItemListItem;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item }) => {
  return (
    <Link
      to={`/items/${item.id}`}
      data-testid={`item-card-${item.id}`}
      className="group block p-4 rounded-xl bg-mc-card border border-mc-border hover:border-mc-emerald hover:bg-mc-cardHover transition-all shadow-sm"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h3 className="text-base font-semibold text-slate-100 group-hover:text-emerald-300 transition-colors">
            {item.name}
          </h3>
          <span className="text-xs font-mono text-mc-textMuted">{item.id}</span>
        </div>
        <VersionBadge version={item.version_added} />
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        {item.category && (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-sky-500/10 text-sky-300 border border-sky-500/30">
            {item.category}
          </span>
        )}
        {item.enchantable && (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/30">
            Enchantable
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-mc-border/60">
        <div>
          <span className="text-mc-textMuted block text-[10px] uppercase tracking-wider font-mono">
            Stack Size
          </span>
          <span className="text-slate-200 font-mono font-medium">
            {item.stack_size || 64}
          </span>
        </div>
        <div>
          <span className="text-mc-textMuted block text-[10px] uppercase tracking-wider font-mono">
            Durability
          </span>
          <span className="text-slate-300 font-mono">
            {item.durability ? `${item.durability} uses` : 'None'}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ItemCard;

