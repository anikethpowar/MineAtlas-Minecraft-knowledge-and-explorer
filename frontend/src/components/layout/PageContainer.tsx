import React, { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * PageContainer Component
 *
 * Provides a responsive, centered layout wrapper with standard padding
 * for page views across MineAtlas. Includes bottom padding to accommodate
 * mobile navigation bar when rendered on small screens.
 */
export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className = '',
}) => {
  return (
    <main
      className={`flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8 pb-20 md:pb-8 ${className}`}
    >
      {children}
    </main>
  );
};

export default PageContainer;
