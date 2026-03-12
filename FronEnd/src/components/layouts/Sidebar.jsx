import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/context/AuthContext';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Calendar,
  Stethoscope,
  ClipboardList,
  Activity,
  Settings,
  LogOut,
  ChevronRight,
  AlertTriangle,
  X,
} from 'lucide-react';

/* ══════════════════════════════════════════════════
   LOGOUT CONFIRMATION MODAL
══════════════════════════════════════════════════ */
function LogoutModal({ onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-red-500 to-rose-600 p-6 relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center">
                <LogOut className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Sign Out</h3>
                <p className="text-xs text-red-100 mt-0.5">End your current session</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 font-semibold">
              Any unsaved changes will be lost. Make sure you've saved your work before signing out.
            </p>
          </div>
          <p className="text-sm text-gray-500 text-center">
            Are you sure you want to sign out of{' '}
            <span className="font-bold text-gray-800">ClinicSys</span>?
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={onCancel}
              className="flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-all"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-all shadow-sm shadow-red-200"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SIDEBAR
   Props:
     collapsed     — boolean  (desktop: controlled by MainLayout wrapper width)
     mobileOpen    — boolean
     onMobileClose — fn

   IMPORTANT: The sidebar inner div uses width:100% with NO width transition.
   Width animation is owned entirely by the wrapper in MainLayout so the
   sidebar and navbar always move in perfect sync.
══════════════════════════════════════════════════ */
const Sidebar = ({ collapsed = false, mobileOpen, onMobileClose, isMobileInstance = false }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/login');
  };

  const getMenuItems = () => {
    const base = [{ icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' }];
    if (user?.role === 'manager') return [...base,
      { icon: Users,         label: 'User Management', path: '/user-management' },
      { icon: UserPlus,      label: 'Patients',         path: '/patients'        },
      { icon: Stethoscope,   label: 'Doctors',          path: '/doctors'         },
      { icon: ClipboardList, label: 'Services',         path: '/services'        },
      { icon: Calendar,      label: 'Appointments',     path: '/appointments'    },
      { icon: Activity,      label: 'Activity Logs',    path: '/activity'        },
      { icon: Settings,      label: 'Settings',         path: '/settings'        },
    ];
    if (user?.role === 'staff') return [...base,
      { icon: Calendar,      label: 'Appointments', path: '/staff-appointments' },
      { icon: ClipboardList, label: 'Queue',        path: '/queue'              },
      { icon: UserPlus,      label: 'Patients',     path: '/staff-patients'     },
      { icon: Stethoscope,   label: 'Doctors',      path: '/staff-doctors'      },
      { icon: Settings,      label: 'Settings',     path: '/staff-settings'     },
    ];
    if (user?.role === 'doctor') return [...base,
      { icon: Calendar,      label: 'My Schedule',   path: '/schedule'        },
      { icon: UserPlus,      label: 'Patients',      path: '/Doctorpatients'  },
      { icon: ClipboardList, label: 'Consultations', path: '/consultations'   },
      { icon: Settings,      label: 'Availability',  path: '/availability'    },
      { icon: Settings,      label: 'Settings',      path: '/doctor-settings' },
    ];
    if (user?.role === 'patient') return [...base,
      { icon: Calendar,      label: 'My Appointments', path: '/my-appointments'  },
      { icon: ClipboardList, label: 'Medical Records', path: '/records'          },
      { icon: Settings,      label: 'Settings',        path: '/patient-settings' },
    ];
    return base;
  };

  const menuItems = getMenuItems();
  const roleColors = {
    admin:   'from-violet-500 to-blue-600',
    staff:   'from-teal-500 to-blue-500',
    doctor:  'from-blue-500 to-indigo-600',
    patient: 'from-sky-400 to-blue-500',
  };
  const roleGradient = roleColors[user?.role] || 'from-blue-500 to-blue-700';

  // Shared fade transition for text/labels
  const fadeStyle = (slim) => ({
    opacity:   slim ? 0 : 1,
    maxWidth:  slim ? 0 : 300,
    overflow:  'hidden',
    whiteSpace: 'nowrap',
    // Only opacity+maxWidth animate — NO width on the container
    transition: 'opacity 200ms ease, max-width 280ms cubic-bezier(0.4, 0, 0.2, 1)',
  });

  /* ── Desktop sidebar content ── */
  const DesktopContent = () => {
    const slim = collapsed;
    return (
      // width: 100% — fills the wrapper div in MainLayout exactly
      // overflow-hidden clips content during collapse
      <div className="flex flex-col h-full bg-white border-r border-gray-200 overflow-hidden w-full">

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 pt-7 pb-6">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md flex-shrink-0">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div style={fadeStyle(slim)}>
            <h1 className="text-xl font-black text-gray-900 leading-none">ClinicSys</h1>
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mt-0.5">
              Management System
            </p>
          </div>
        </div>

        <div className="mx-4 h-px bg-gray-100 mb-3 flex-shrink-0" />

        {/* User */}
        <div className="mx-3 mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${roleGradient} shadow-lg flex items-center justify-center font-black text-white text-sm flex-shrink-0`}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div style={fadeStyle(slim)}>
              <p className="text-sm font-bold text-gray-800">{user?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Nav label */}
        <div style={fadeStyle(slim)}>
          <p className="px-5 mb-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Navigation
          </p>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto overflow-x-hidden">
          {menuItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={slim ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-150
                  ${isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} style={{ width: 18, height: 18 }} />
                    <span style={fadeStyle(slim)} className="text-sm font-semibold">
                      {item.label}
                    </span>
                    {!slim && isActive && (
                      <ChevronRight className="w-3.5 h-3.5 text-blue-200 flex-shrink-0" />
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
            onClick={() => setShowLogoutModal(true)}
            title={slim ? 'Logout' : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors duration-150"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span style={fadeStyle(slim)} className="text-sm font-semibold">Logout</span>
          </button>
        </div>
      </div>
    );
  };

  /* ── Mobile drawer content (always expanded) ── */
  const MobileContent = () => (
    <div className="flex flex-col h-full w-64 bg-white border-r border-gray-200">
      {/* Logo + close */}
      <div className="flex items-center justify-between px-4 pt-7 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 leading-none">ClinicSys</h1>
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mt-0.5">
              Management System
            </p>
          </div>
        </div>
        <button
          onClick={onMobileClose}
          className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-red-100 hover:text-red-500 text-gray-400 flex items-center justify-center transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mx-4 h-px bg-gray-100 mb-3" />

      {/* User */}
      <div className="mx-3 mb-4">
        <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${roleGradient} shadow-lg flex items-center justify-center font-black text-white text-sm flex-shrink-0`}>
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-gray-800 truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      <p className="px-5 mb-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
        Navigation
      </p>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {menuItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onMobileClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-150
                ${isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} style={{ width: 18, height: 18 }} />
                  <span className="text-sm font-semibold flex-1">{item.label}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-200" />}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="mx-3 mb-5 mt-3">
        <div className="h-px bg-gray-100 mb-3" />
        <button
          onClick={() => setShowLogoutModal(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors duration-150"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-semibold">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop content — skip when this instance is mounted for mobile only */}
      {!isMobileInstance && <DesktopContent />}

      {/* Mobile drawer backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
        style={{
          opacity: mobileOpen ? 1 : 0,
          pointerEvents: mobileOpen ? 'auto' : 'none',
          transition: 'opacity 300ms ease',
        }}
        onClick={onMobileClose}
      />
      {/* Mobile drawer */}
      <div
        className="fixed top-0 left-0 z-50 h-full md:hidden"
        style={{
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <MobileContent />
      </div>

      {showLogoutModal && createPortal(
        <LogoutModal
          onConfirm={handleLogoutConfirm}
          onCancel={() => setShowLogoutModal(false)}
        />,
        document.body
      )}
    </>
  );
};

export default Sidebar;