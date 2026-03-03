import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'sonner';

import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import ClinicSysLanding from './Landing';

import AdminDashboard from './admin/AdminDashboard';
import AdminAccManagament from './admin/AdminUserManagement';
import DoctorsPage from './admin/AdminDoctorsPage';
import PatientsPage from './admin/AdminPatientsPage';
import AppointmentsPage from './admin/AdminAppointmentsPage';
import AdminReports from './admin/AdminReports';
import ActivityLogs from './admin/AdminActivityLogs';
import AdminSettings from './admin/AdminSettings';
import ServiceManagement from './admin/AdminServiceManagement';


import StaffDashboard from './staff/StaffDashboard';
import DoctorDashboard from './doctor/DoctorDashboard';
import PatientDashboard from './patient/PatientDashboard';

import './App.css';
import './index.css';


/* ===========================
   PROTECTED ROUTE WRAPPER
=========================== */
const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};


/* ===========================
   DASHBOARD ROUTER
=========================== */
const DashboardRouter = () => {
  const { user } = useAuth();

  switch (user?.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'staff':
      return <StaffDashboard />;
    case 'doctor':
      return <DoctorDashboard />;
    case 'patient':
      return <PatientDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
};


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
<Routes>

  {/* PUBLIC ROUTES */}
  <Route path="/" element={<ClinicSysLanding />} />
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />

  {/* PROTECTED ROUTES (ALL LOGGED-IN USERS) */}
  <Route element={<ProtectedRoute />}>
    <Route path="/dashboard" element={<DashboardRouter />} />
  </Route>

  {/* ADMIN ROUTES ONLY */}
  <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
    <Route path="/doctors" element={<DoctorsPage />} />
    <Route path="/patients" element={<PatientsPage />} />
    <Route path="/appointments" element={<AppointmentsPage />} />
    <Route path="/services" element={<ServiceManagement />} />
    <Route path="/reports" element={<AdminReports />} />
    <Route path="/activity" element={<ActivityLogs />} />
    <Route path="/settings" element={<AdminSettings />} />
    <Route path="/user-management" element={<AdminAccManagament />} />
  </Route>

  {/* 404 */}
  <Route path="*" element={<Navigate to="/" replace />} />

</Routes>

        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;