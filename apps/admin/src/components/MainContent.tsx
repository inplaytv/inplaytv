'use client';

import { useSidebar } from './SidebarContext';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

export default function MainContent({ children }: { children: ReactNode }) {
  const { expandedSection } = useSidebar();
  const pathname = usePathname();
  
  // No margin on login page
  if (pathname === '/login') {
    return <main style={{ flex: 1, minHeight: '100vh' }}>{children}</main>;
  }

  // Calculate margin based on sidebar state
  // Main sidebar is 60px, submenu is 240px at left:60px, so total is 300px when submenu open
  const marginLeft = expandedSection ? '300px' : '60px';

  return (
    <main style={{ 
      marginLeft,
      flex: 1,
      padding: '1.5rem',
      minHeight: '100vh',
      transition: 'margin-left 0.2s ease',
    }}>
      {children}
    </main>
  );
}
