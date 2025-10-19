'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface SidebarContextType {
  expandedSection: string | null;
  setExpandedSection: (section: string | null) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  expandedSection: null,
  setExpandedSection: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  return (
    <SidebarContext.Provider value={{ expandedSection, setExpandedSection }}>
      {children}
    </SidebarContext.Provider>
  );
}
