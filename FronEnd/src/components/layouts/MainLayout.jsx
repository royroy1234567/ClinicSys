import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Sidebar from './Sidebar';
import DashboardHeader from './DashboardHeader';

const MainLayout = ({ children, title, subtitle, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-sm text-blue-500 font-semibold animate-pulse">Loading ClinicSys…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-blue-50" data-testid="main-layout">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader title={title} subtitle={subtitle} />
        <main
          className="flex-1 overflow-y-auto p-6"
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