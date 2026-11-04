import React, { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
}

/**
 * PageContainer Component
 *
 * Provides a responsive, centered layout wrapper with standard padding
 * for page views across MineAtlas.
 */
export const PageContainer: React.FC<PageContainerProps> = ({ children }) => {
  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
      {children}
    </main>
  );
};

export default PageContainer;

