import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getFarmBySlug } from '../api/mineatlasApi';
import { FarmDetail } from '../api/types';
import EditionBadge from '../components/common/EditionBadge';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import SourceBadge from '../components/common/SourceBadge';
import { FarmSchematicDiagram } from '../components/farms/FarmSchematicDiagram';

export const FarmDetailPage: React.FC = () => {
  const { farmSlug } = useParams<{ farmSlug: string }>();
  const [farm, setFarm] = useState<FarmDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Local interactive checklist state (material item name -> checked boolean)
  const [checkedMaterials, setCheckedMaterials] = useState<Record<string, boolean>>({});

  const fetchFarm = async () => {
    if (!farmSlug) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getFarmBySlug(farmSlug);
      setFarm(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load farm blueprint guide.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarm();
    setCheckedMaterials({});
  }, [farmSlug]);

  const toggleMaterial = (itemKey: string) => {
    setCheckedMaterials((prev) => ({
      ...prev,
      [itemKey]: !prev[itemKey],
    }));
  };

  const handleResetChecklist = () => {
    setCheckedMaterials({});
  };

  if (loading) {
    return <LoadingState message="Loading curated Minecraft Java farm guide..." />;
  }

  if (error || !farm) {
    return (
      <div className="space-y-4">
        <Link to="/farms" className="text-xs font-semibold text-orange-400 hover:text-orange-300">
          &larr; Back to Farm Blueprint Hub
        </Link>
        <ErrorState error={error || 'Farm not found.'} onRetry={fetchFarm} />
      </div>
    );
  }

  const completedCount = Object.values(checkedMaterials).filter(Boolean).length;
  const totalMaterials = farm.materials?.length || 0;

  return (
    <div className="space-y-8" data-testid="farm-detail-page">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-mc-textMuted">
        <Link to="/farms" className="hover:text-orange-400 transition-colors">
          Farm Blueprint Hub
        </Link>
        <span>/</span>
        <span className="text-slate-200 font-semibold">{farm.name}</span>
      </div>

      {/* 1. Hero / Header */}
      <div className="rounded-2xl bg-mc-card border border-mc-border p-6 sm:p-8 space-y-4 shadow-md">
        <div className="flex flex-wrap items-center gap-2">
          <SourceBadge sourceType={farm.source_type} />
          <EditionBadge edition={farm.edition} />
          <span className="px-2.5 py-0.5 rounded text-xs font-mono font-semibold bg-orange-500/10 text-orange-300 border border-orange-500/30">
            {farm.difficulty || 'Unrated Difficulty'}
          </span>
          <span className="px-2.5 py-0.5 rounded text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
            Dimension: {farm.dimension}
          </span>
          {farm.last_verified_at && (
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono text-mc-textMuted bg-slate-900 border border-slate-800">
              Verified: {new Date(farm.last_verified_at).toLocaleDateString()}
            </span>
          )}
        </div>

        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            {farm.name}
          </h1>
          <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-3xl leading-relaxed">
            {farm.summary}
          </p>
        </div>

        {/* Prominent Compatibility Warning Banner */}
        <div
          data-testid="compatibility-warning"
          className="p-4 rounded-xl bg-orange-950/30 border border-orange-500/30 space-y-1"
        >
          <div className="flex items-center gap-2 text-orange-400 font-semibold text-xs sm:text-sm">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Compatibility Notice: {farm.compatibility_label}</span>
          </div>
          <p className="text-xs text-orange-200/80 leading-relaxed pl-6">
            {farm.coverage_note}
          </p>
        </div>
      </div>

      {/* 2. Purpose & Expected Outputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl bg-mc-card border border-mc-border p-5 space-y-3">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Purpose &amp; Expected Yield</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {farm.estimated_output_per_hour}
          </p>

          {farm.outputs && farm.outputs.length > 0 && (
            <div className="space-y-2 pt-2">
              {farm.outputs.map((out) => (
                <div
                  key={out.item}
                  className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-100">{out.label}</span>
                    {out.note && <span className="block text-[11px] text-mc-textMuted">{out.note}</span>}
                  </div>
                  <span className="px-2 py-0.5 rounded font-mono font-bold bg-orange-500/10 text-orange-300 border border-orange-500/30">
                    {out.rate}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. Prerequisites */}
        <div className="rounded-xl bg-mc-card border border-mc-border p-5 space-y-3">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Prerequisites</span>
          </h2>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
            {farm.prerequisites?.map((prereq, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                <span className="leading-relaxed">{prereq}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 3. How It Works */}
      <div className="rounded-xl bg-mc-card border border-mc-border p-6 space-y-3">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <svg className="w-5 h-5 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span>How It Works (Core Mechanics)</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
          {farm.description}
        </p>
      </div>

      {/* 7. Original Simplified Diagram */}
      <FarmSchematicDiagram
        farmId={farm.id}
        farmName={farm.name}
        diagramData={farm.diagram_data}
      />

      {/* 5. Materials Checklist (Interactive) */}
      <div className="rounded-xl bg-mc-card border border-mc-border p-6 space-y-4" data-testid="materials-checklist">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-mc-border/80 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span>Materials Checklist</span>
            </h2>
            <p className="text-xs text-mc-textMuted mt-0.5">
              Check off materials as you gather them. Stored locally in your session.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-mc-textMuted">
              {completedCount} of {totalMaterials} gathered
            </span>
            {completedCount > 0 && (
              <button
                type="button"
                onClick={handleResetChecklist}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Reset Checklist
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {farm.materials?.map((mat, idx) => {
            const isChecked = !!checkedMaterials[mat.item];
            return (
              <label
                key={idx}
                className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-3 select-none ${
                  isChecked
                    ? 'bg-emerald-950/20 border-emerald-500/40 opacity-75'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleMaterial(mat.item)}
                  className="mt-0.5 w-4 h-4 rounded text-orange-500 focus:ring-orange-400 bg-slate-800 border-slate-700 cursor-pointer"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-xs font-semibold truncate ${
                        isChecked ? 'line-through text-slate-400' : 'text-slate-200'
                      }`}
                    >
                      {mat.item}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                      &times;{mat.amount}
                    </span>
                  </div>
                  {mat.note && (
                    <span className="block text-[11px] text-mc-textMuted mt-0.5">
                      {mat.note}
                    </span>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* 6. Build Process */}
      <div className="rounded-xl bg-mc-card border border-mc-border p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>Construction Process</span>
          </h2>
          <p className="text-xs text-mc-textMuted mt-0.5">
            Follow each phase in sequential order. Original instructions detailing architectural reasoning.
          </p>
        </div>

        <div className="space-y-4">
          {farm.build_steps?.map((step) => (
            <div
              key={step.step_number}
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/40 flex items-center justify-center text-xs font-bold font-mono">
                  {step.step_number}
                </span>
                <h3 className="text-sm font-bold text-slate-100">{step.title}</h3>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-8">
                {step.description}
              </p>

              {step.why_it_matters && (
                <div className="ml-8 p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs text-slate-400">
                  <span className="text-[10px] font-mono uppercase text-orange-400 font-bold block mb-0.5">
                    Why this step matters
                  </span>
                  <span>{step.why_it_matters}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 8. Maintenance & Safety Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {farm.safety_note && (
          <div className="rounded-xl bg-mc-card border border-mc-border p-5 space-y-2">
            <h3 className="text-sm font-bold text-red-400 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Player Safety &amp; Lightning Protection</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {farm.safety_note}
            </p>
          </div>
        )}

        {farm.maintenance_summary && (
          <div className="rounded-xl bg-mc-card border border-mc-border p-5 space-y-2">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Ongoing Maintenance</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {farm.maintenance_summary}
            </p>
          </div>
        )}
      </div>

      {/* 9. Troubleshooting */}
      <div className="rounded-xl bg-mc-card border border-mc-border p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Troubleshooting &amp; Failure Modes</span>
          </h2>
          <p className="text-xs text-mc-textMuted mt-0.5">
            Common symptoms, root causes, and verification checklists.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {farm.troubleshooting?.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs"
            >
              <div className="flex items-start gap-2 text-amber-300 font-bold">
                <span className="shrink-0">&bull;</span>
                <span>Issue: {item.issue}</span>
              </div>
              <p className="text-slate-400 pl-3">
                <strong className="text-slate-300">Likely cause:</strong> {item.likely_cause}
              </p>
              <div className="pl-3 pt-1 text-emerald-300">
                <strong>Suggested check:</strong> {item.suggested_check}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 11. Related Connections - Graph Explorer Entry Point */}
      <div className="rounded-xl bg-gradient-to-r from-orange-950/40 via-mc-card to-mc-card border border-orange-500/30 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="6" cy="6" r="3" />
              <circle cx="18" cy="18" r="3" />
              <circle cx="18" cy="6" r="3" />
              <path d="M8.5 7.5l7 3M8.5 6h7M18 8.5v7" />
            </svg>
            <span>Interactive Knowledge Graph</span>
          </h3>
          <p className="text-xs text-mc-textMuted mt-1">
            Explore this farm&apos;s verified relationships, mob requirements, and mechanics in our interactive Cytoscape graph.
          </p>
        </div>

        <Link
          to={`/graph?type=farm&id=${encodeURIComponent(farm.id)}&depth=1`}
          className="px-4 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs transition-colors shrink-0 inline-flex items-center gap-2 shadow-sm"
        >
          <span>Explore this farm&apos;s connections</span>
          <span>&rarr;</span>
        </Link>
      </div>

      {/* 12. Source and Coverage Information */}
      <div className="p-5 rounded-xl bg-slate-900/60 border border-mc-border text-xs text-mc-textMuted space-y-2">
        <span className="text-[11px] font-mono uppercase text-slate-400 block font-semibold">
          Curated Guide Provenance &amp; Verification
        </span>
        <p className="leading-relaxed">
          This is an original curated guide compiled for Minecraft Java Edition. Mechanics can vary across server software, simulation distances, or game versions. Confirm version compatibility before building in your world.
        </p>
        {farm.source_references && farm.source_references.length > 0 && (
          <div className="pt-2">
            <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">
              Authoritative Primary References:
            </span>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              {farm.source_references.map((ref, idx) => (
                <li key={idx}>
                  {ref.url ? (
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-400 hover:underline"
                    >
                      {ref.title}
                    </a>
                  ) : (
                    <span>{ref.title}</span>
                  )}
                  {ref.note && <span className="text-slate-500"> — {ref.note}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

