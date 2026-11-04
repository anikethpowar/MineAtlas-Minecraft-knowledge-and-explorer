import React from 'react';

interface EditionBadgeProps {
  edition?: string;
  className?: string;
}

/**
 * EditionBadge Component
 *
 * Reinforces the MineAtlas rule: Minecraft Java Edition only.
 */
export const EditionBadge: React.FC<EditionBadgeProps> = ({
  edition = 'java',
  className = '',
}) => {
  const isJava = edition.toLowerCase().includes('java');

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium ${
        isJava
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
          : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
      } ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {isJava ? 'Java Edition' : edition}
    </span>
  );
};

export default EditionBadge;

