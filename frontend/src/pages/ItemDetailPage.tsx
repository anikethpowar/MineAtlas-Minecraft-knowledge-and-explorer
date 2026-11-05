import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getItemById } from '../api/mineatlasApi';
import { ItemDetail } from '../api/types';
import CoverageNote from '../components/common/CoverageNote';
import EditionBadge from '../components/common/EditionBadge';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import SourceBadge from '../components/common/SourceBadge';
import VersionBadge from '../components/common/VersionBadge';
import RelatedConnections from '../components/explorers/RelatedConnections';

export const ItemDetailPage: React.FC = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = () => {
    if (!itemId) return;
    setLoading(true);
    setError(null);

    getItemById(itemId)
      .then((res) => {
        setItem(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to fetch item details');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDetail();
  }, [itemId]);

  if (loading) {
    return <LoadingState message={`Loading details for item "${itemId}"...`} />;
  }

  if (error || !item) {
    return (
      <div className="space-y-4">
        <Link to="/items" className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
          <span>&larr;</span> Back to Items &amp; Key Blocks Explorer
        </Link>
        <ErrorState error={error || 'Item not found'} onRetry={fetchDetail} />
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="item-detail-view">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between text-xs text-mc-textMuted">
        <div className="flex items-center gap-2">
          <Link to="/items" className="text-emerald-400 hover:text-emerald-300 transition-colors">
            Items &amp; Key Blocks Explorer
          </Link>
          <span>/</span>
          <span className="text-slate-300 font-medium">{item.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/graph?type=item&id=${encodeURIComponent(item.id)}&depth=1`}
            className="px-3 py-1 rounded bg-emerald-600/90 hover:bg-emerald-500 border border-emerald-500/50 text-white font-medium transition-colors flex items-center gap-1.5"
            title="Explore connections in interactive knowledge graph"
          >
            <span>Explore connections</span>
            <span>&rarr;</span>
          </Link>
          <Link
            to="/items"
            className="px-3 py-1 rounded bg-slate-900 border border-mc-border text-slate-300 hover:text-white transition-colors"
          >
            &larr; All Items &amp; Blocks
          </Link>
        </div>
      </div>

      {/* Entity Title Header */}
      <div className="p-6 rounded-2xl bg-mc-card border border-mc-border shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-semibold uppercase bg-sky-500/10 text-sky-400 border border-sky-500/30">
                Item / Block
              </span>
              <EditionBadge edition={item.source.edition} />
              <VersionBadge version={item.version_added} />
              <SourceBadge sourceType={item.source.source_type} sourceUrl={item.source.source_url} />
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {item.name}
            </h1>
            <p className="text-sm font-mono text-mc-textMuted mt-1">ID: {item.id}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {item.category && (
              <div className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
                Category: <strong className="text-sky-300">{item.category}</strong>
              </div>
            )}
            {item.enchantable && (
              <div className="px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-xs text-purple-300 font-mono">
                Enchantable
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl bg-mc-card border border-mc-border flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 border-b border-mc-border/60 pb-2">
            Technical Specifications
          </h2>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-mc-textMuted block text-[10px] uppercase font-mono mb-1">
                Max Stack Size
              </span>
              <span className="text-lg font-bold font-mono text-slate-100">
                {item.stack_size || 64}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-mc-textMuted block text-[10px] uppercase font-mono mb-1">
                Durability
              </span>
              <span className="text-lg font-bold font-mono text-emerald-400">
                {item.durability ? `${item.durability} uses` : 'None (Infinite)'}
              </span>
            </div>
          </div>

          {(item.food_hunger !== null || item.food_saturation !== null || item.fuel_value !== null) && (
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] font-mono text-mc-textMuted block">Hunger</span>
                <span className="font-mono font-bold text-amber-300">
                  {item.food_hunger !== null ? `+${item.food_hunger}` : 'N/A'}
                </span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] font-mono text-mc-textMuted block">Saturation</span>
                <span className="font-mono font-bold text-amber-400">
                  {item.food_saturation !== null ? `+${item.food_saturation}` : 'N/A'}
                </span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] font-mono text-mc-textMuted block">Fuel</span>
                <span className="font-mono font-bold text-red-400">
                  {item.fuel_value !== null ? `${item.fuel_value}s` : 'N/A'}
                </span>
              </div>
            </div>
          )}

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
            <span className="text-mc-textMuted block text-[10px] uppercase font-mono mb-1">
              Enchantability
            </span>
            <span className="text-slate-200">
              {item.enchantable
                ? 'Can receive applicable enchantments via Anvil or Enchanting Table.'
                : 'Not directly enchantable.'}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-mc-card border border-mc-border flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 border-b border-mc-border/60 pb-2">
            Description &amp; Notes
          </h2>

          <div className="flex-1">
            <span className="text-xs font-semibold text-slate-300 block mb-1">
              Behavior &amp; Purpose
            </span>
            <p className="text-xs text-slate-200 bg-slate-900/60 p-3 rounded-lg border border-slate-800 leading-relaxed">
              {item.description || 'Standard Minecraft Java Edition item/block entry.'}
            </p>
          </div>

          {item.notes && (
            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-1">
                Curated Notes
              </span>
              <p className="text-xs text-mc-textMuted bg-slate-900/40 p-2.5 rounded border border-slate-800">
                {item.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Scope and Provenance Card */}
      <CoverageNote
        entityType="item"
        customNote={item.coverage_note || undefined}
      />

      {/* Local Knowledge Graph Related Connections */}
      <RelatedConnections entityType="item" entityId={item.id} />
    </div>
  );
};

export default ItemDetailPage;

