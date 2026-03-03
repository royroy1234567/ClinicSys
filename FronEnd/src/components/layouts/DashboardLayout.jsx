import React from "react";
import { Outlet } from "react-router-dom";

const DashboardLayout = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg">
        <div className="p-6 font-bold text-xl border-b">
          ClinicSys
        </div>

        <nav className="p-4 space-y-3">
          <a href="/dashboard" className="block hover:text-primary">
            Dashboard
          </a>
          <a href="/patients" className="block hover:text-primary">
            Patients
          </a>
          <a href="/appointments" className="block hover:text-primary">
            Appointments
          </a>
          <a href="/doctors" className="block hover:text-primary">
            Doctors
          </a>
          <a href="/reports" className="block hover:text-primary">
            Reports
          </a>
          <a href="/settings" className="block hover:text-primary">
            Settings
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;