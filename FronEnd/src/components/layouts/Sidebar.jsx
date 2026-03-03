import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Calendar,
  Stethoscope,
  ClipboardList,
  BarChart3,
  Activity,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getMenuItems = () => {
    const baseItems = [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    ];

    if (user?.role === 'admin') {
      return [
        ...baseItems,
        { icon: Users, label: 'User Management', path: '/user-management' },
        { icon: UserPlus, label: 'Patients', path: '/patients' },
        { icon: Stethoscope, label: 'Doctors', path: '/doctors' },
        { icon: ClipboardList, label: 'Services', path: '/services' },
        { icon: Calendar, label: 'Appointments', path: '/appointments' },
        { icon: BarChart3, label: 'Reports', path: '/reports' },
        { icon: Activity, label: 'Activity Logs', path: '/activity' },
        { icon: Settings, label: 'Settings', path: '/settings' },
      ];
    }

    if (user?.role === 'staff') {
      return [
        ...baseItems,
        { icon: UserPlus, label: 'Patients', path: '/patients' },
        { icon: Calendar, label: 'Appointments', path: '/appointments' },
        { icon: Stethoscope, label: 'Doctors', path: '/doctors' },
        { icon: ClipboardList, label: 'Queue', path: '/queue' },
      ];
    }

    if (user?.role === 'doctor') {
      return [
        ...baseItems,
        { icon: Calendar, label: 'My Schedule', path: '/schedule' },
        { icon: UserPlus, label: 'Patients', path: '/patients' },
        { icon: ClipboardList, label: 'Consultations', path: '/consultations' },
        { icon: Settings, label: 'Availability', path: '/availability' },
      ];
    }

    if (user?.role === 'patient') {
      return [
        ...baseItems,
        { icon: Calendar, label: 'My Appointments', path: '/my-appointments' },
        { icon: ClipboardList, label: 'Medical Records', path: '/records' },
      ];
    }

    return baseItems;
  };

  const menuItems = getMenuItems();

  const roleColors = {
    admin: 'from-violet-500 to-blue-600',
    staff: 'from-teal-500 to-blue-500',
    doctor: 'from-blue-500 to-indigo-600',
    patient: 'from-sky-400 to-blue-500',
  };

  const roleGradient =
    roleColors[user?.role] || 'from-blue-500 to-blue-700';

  return (
    <div className="flex flex-col h-screen w-64 flex-shrink-0 sticky top-0 bg-white border-r border-gray-200">

      {/* Logo */}
      <div className="px-6 pt-7 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 leading-none">
              ClinicSys
            </h1>
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mt-0.5">
              Management System
            </p>
          </div>
        </div>
      </div>

      <div className="mx-4 h-px bg-gray-100 mb-3" />

      {/* User Card */}
      <div className="mx-3 mb-4">
        <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${roleGradient} shadow-lg flex items-center justify-center font-black text-white text-sm`}
          >
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-gray-800 truncate">
              {user?.name}
            </p>
            <p className="text-xs text-gray-400 capitalize">
              {user?.role}
            </p>
          </div>
        </div>
      </div>

      <p className="px-5 mb-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
        Navigation
      </p>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group
                ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-[18px] h-[18px] ${
                      isActive ? 'text-white' : 'text-gray-400'
                    }`}
                  />
                  <span className="text-sm font-semibold flex-1">
                    {item.label}
                  </span>
                  {isActive && (
                    <ChevronRight className="w-3.5 h-3.5 text-blue-200" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="mx-3 mb-5 mt-3">
        <div className="h-px bg-gray-100 mb-3" />
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-semibold">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;