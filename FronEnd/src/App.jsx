import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'sonner';

import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import ClinicSysLanding from './Landing';
import GoogleCallback from './components/layouts/Googlecallback';

import AdminDashboard from './manager/ManagerDashboard';
import AdminAccManagament from './manager/ManagerUserManagement';
import DoctorsPage from './manager/ManagerDoctorsPage';
import PatientsPage from './manager/ManagerPatientsPage';
import AppointmentsPage from './manager/ManagerAppointmentsPage';
import ActivityLogs from './manager/ManagerActivityLogs';
import AdminSettings from './manager/ManagerSettings';
import ServiceManagement from './manager/ManagerServiceManagement';

import StaffDashboard from './staff/StaffDashboard';
import StaffAppointments from './staff/StaffAppointments';
import QueuePage from './staff/StaffQueue';
import StaffPatient from './staff/StaffPatient';
import StaffDoctor from './staff/StaffDoctor';
import StaffSettings from './staff/StaffSettings';

import DoctorDashboard from './doctor/DoctorDashboard';
import SchedulePage from './doctor/DoctorSchedule';
import DoctorPatientsPage from './doctor/Doctorpatients';
import ConsultationsPage from './doctor/DoctorConsultations';
import AvailabilityPage from './doctor/DoctorAvailability';
import DoctorSettings from './doctor/DoctorsSettings';

import PatientDashboard from './patient/PatientDashboard';
import PatientAppointments from './patient/PatientAppointment';
import MedicalRecordsPage from './patient/PatientsMedicalRecord';

import PatientSettings from './patient/PatientSettings';

import './App.css';
import './index.css';


/* ═══════════════════════════════════════════════════
   GUEST ROUTE — redirects logged-in users to /dashboard
   Used for: /login, /register
═══════════════════════════════════════════════════ */
const GuestRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // Already logged in → kick to dashboard
  if (user) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
};


/* ═══════════════════════════════════════════════════
   PROTECTED ROUTE — redirects guests to /login
═══════════════════════════════════════════════════ */
const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};


/* ═══════════════════════════════════════════════════
   DASHBOARD ROUTER — picks the right dashboard by role
═══════════════════════════════════════════════════ */
const DashboardRouter = () => {
  const { user } = useAuth();

  switch (user?.role) {
    case 'manager': return <AdminDashboard />;
    case 'staff':   return <StaffDashboard />;
    case 'doctor':  return <DoctorDashboard />;
    case 'patient': return <PatientDashboard />;
    default:        return <Navigate to="/login" replace />;
  }
};


/* ═══════════════════════════════════════════════════
   APP
═══════════════════════════════════════════════════ */
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* ── FULLY PUBLIC ── */}
          <Route path="/" element={<ClinicSysLanding />} />
          <Route path="/auth/google/callback" element={<GoogleCallback />} />

          {/* ── GUEST-ONLY (redirect to /dashboard if already logged in) ── */}
          <Route element={<GuestRoute />}>
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* ── PROTECTED — all logged-in users ── */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardRouter />} />
          </Route>

          {/* ── MANAGER ONLY ── */}
          <Route element={<ProtectedRoute allowedRoles={['manager']} />}>
            <Route path="/doctors"         element={<DoctorsPage />} />
            <Route path="/patients"        element={<PatientsPage />} />
            <Route path="/appointments"    element={<AppointmentsPage />} />
            <Route path="/services"        element={<ServiceManagement />} />
            <Route path="/activity"        element={<ActivityLogs />} />
            <Route path="/settings"        element={<AdminSettings />} />
            <Route path="/user-management" element={<AdminAccManagament />} />
          </Route>

          {/* ── DOCTOR ONLY ── */}
          <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
            <Route path="/schedule"       element={<SchedulePage />} />
            <Route path="/Doctorpatients" element={<DoctorPatientsPage />} />
            <Route path="/consultations"  element={<ConsultationsPage />} />
            <Route path="/availability"   element={<AvailabilityPage />} />
            <Route path="/doctor-settings" element={<DoctorSettings />} />
          </Route>

          {/* ── PATIENT ONLY ── */}
          <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
            <Route path="/my-appointments" element={<PatientAppointments />} />
            <Route path="/records"         element={<MedicalRecordsPage />} />
            <Route path="/patient-settings"        element={<PatientSettings />} />
          </Route>

          {/* ── STAFF ONLY ── */}
          <Route element={<ProtectedRoute allowedRoles={['staff']} />}>
            <Route path="/staff-appointments" element={<StaffAppointments />} />
            <Route path="/queue"              element={<QueuePage />} />
            <Route path="/staff-patients"     element={<StaffPatient />} />
            <Route path="/staff-doctors"      element={<StaffDoctor />} />
            <Route path="/staff-settings"     element={<StaffSettings />} />
          </Route>

          {/* ── 404 ── */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>

        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;