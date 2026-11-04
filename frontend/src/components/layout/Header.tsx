import React from 'react';

/**
 * Header Component
 *
 * Provides a persistent top navigation bar for MineAtlas.
 * Displays the project name, edition subtitle, and current phase indicator badge.
 */
export const Header: React.FC = () => {
  return (
    <header className="border-b border-mc-border bg-[#14191c]/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Brand section */}
        <div className="flex items-center space-x-3">
          {/* Stylized geometric cube icon representing an Atlas block */}
          <div className="w-10 h-10 rounded-md bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center shadow-inner">
            <svg
              className="w-5 h-5 text-emerald-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                MineAtlas
              </h1>
              <span className="text-xs px-2 py-0.5 rounded font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Java Edition
              </span>
            </div>
            <p className="text-xs text-mc-textMuted">
              Minecraft Java Edition Atlas &amp; Knowledge Graph Explorer
            </p>
          </div>
        </div>

        {/* Phase Badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Phase 1: Foundation
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;

