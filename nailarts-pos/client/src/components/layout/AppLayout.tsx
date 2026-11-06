import React from 'react';
import { Sidebar, NavTab } from './Sidebar';
import { Header } from './Header';

interface AppLayoutProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentTab,
  onSelectTab,
  title,
  subtitle,
  actions,
  children,
}) => {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar currentTab={currentTab} onSelectTab={onSelectTab} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={title} subtitle={subtitle} actions={actions} />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};
