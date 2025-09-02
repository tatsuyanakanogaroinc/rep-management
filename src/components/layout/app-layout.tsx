'use client';

import { ReactNode } from 'react';
import { Sidebar } from './sidebar';

interface AppLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export default function AppLayout({ children, showSidebar = true }: AppLayoutProps) {
  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      {/* メインコンテンツエリア */}
      <div className="lg:pl-64">
        {/* モバイル用のトップマージン */}
        <div className="lg:hidden h-16" />
        
        {/* コンテンツ */}
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}

export { AppLayout };