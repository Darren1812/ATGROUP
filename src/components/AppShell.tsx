'use client';

import { ReactNode, useState } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hasSidebar = pathname !== '/' && pathname !== '/login';
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <>
      <Navbar
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed((collapsed) => !collapsed)}
      />
      <main className={`min-h-screen transition-[margin] duration-200 ${hasSidebar ? (sidebarCollapsed ? 'md:ml-20' : 'md:ml-64') : ''}`}>
        {children}
      </main>
    </>
  );
}
