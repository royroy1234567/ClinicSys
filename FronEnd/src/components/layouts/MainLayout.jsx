import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Sidebar from './Sidebar';
import DashboardHeader from './DashboardHeader';

const SIDEBAR_KEY = 'clinicsys_sidebar_collapsed';
const EXPANDED_W  = 256;
const COLLAPSED_W = 72;
const TRANSITION  = 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)';

const MainLayout = ({ children, title, subtitle, requiredRole }) => {
  const { user, loading } = useAuth();

  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_KEY) === 'true'
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, String(collapsed));
  }, [collapsed]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          <p className="text-sm text-blue-500 font-semibold animate-pulse">Loading ClinicSys…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/dashboard" replace />;

  const sidebarW = collapsed ? COLLAPSED_W : EXPANDED_W;

  return (
    <div className="flex h-screen overflow-hidden bg-blue-50" data-testid="main-layout">

      {/*
        ┌─────────────────────────────────────────────────────────┐
        │  THE ONE place that controls sidebar width + transition  │
        │  Sidebar fills 100% of this — no width transition inside │
        └─────────────────────────────────────────────────────────┘
      */}
      {/* Desktop sidebar wrapper — owns the width transition */}
      <div
        className="hidden md:block h-screen flex-shrink-0 sticky top-0"
        style={{ width: sidebarW, transition: TRANSITION }}
      >
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
      </div>

      {/* Mobile sidebar — zero-width in flow, drawer is position:fixed inside */}
      <div className="md:hidden w-0 flex-shrink-0">
        <Sidebar
          collapsed={false}
          isMobileInstance
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
      </div>

      {/*
        Right column: header + main.
        It uses flex-1 so it naturally fills the remaining space as the
        sidebar wrapper animates — no explicit margin/width needed.
      */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <DashboardHeader
          title={title}
          subtitle={subtitle}
          collapsed={collapsed}
          onToggle={() => setCollapsed(p => !p)}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main
          className="flex-1 overflow-y-auto p-4 md:p-6"
          style={{ background: 'linear-gradient(135deg, #f8faff 0%, #eff6ff 50%, #dbeafe 100%)' }}
          data-testid="main-content"
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;