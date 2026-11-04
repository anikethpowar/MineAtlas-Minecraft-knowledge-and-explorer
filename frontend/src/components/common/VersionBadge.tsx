import React from 'react';

interface VersionBadgeProps {
  version?: string | null;
  className?: string;
}

/**
 * VersionBadge Component
 *
 * Displays the Minecraft Java Edition version when known (e.g. "1.15", "1.14").
 */
export const VersionBadge: React.FC<VersionBadgeProps> = ({
  version,
  className = '',
}) => {
  if (!version) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700 ${className}`}
      title={`Added in Java Edition ${version}`}
    >
      <span className="text-slate-500 text-[10px]">v</span>
      {version}
    </span>
  );
};

export default VersionBadge;

