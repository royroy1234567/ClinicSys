import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/context/AuthContext';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
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
  CalendarCheck,
  ShoppingCart,
  X,
} from 'lucide-react';

/* ══════════════════════════════════════════════════
   MENU CONFIG — per role, with dividers + children
══════════════════════════════════════════════════ */
const MENU_ITEMS = {
  manager: [
    { type: 'divider', label: 'Overview' },
    {
      icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard',
      children: [
        { key: 'overview',   label: 'Overview' },
         { key: 'sales',      label: 'Sales & Revenue' },
        { key: 'daily',      label: 'Daily Appointments' },
        { key: 'status',     label: 'Appointment Status' },
        { key: 'doctor',     label: 'Doctor Performance' },
        { key: 'patient',    label: 'Patient Visits' },
        { key: 'followup',   label: 'Follow-Up (CRM)' },
        { key: 'engagement', label: 'Patient Engagement' },
        { key: 'queue',      label: 'Queue Management' },
       
      ],
    },
    { type: 'divider', label: 'People' },
    { icon: Users,         label: 'Clinic Accounts', path: '/user-management' },
    { icon: UserPlus,      label: 'Patients',         path: '/patients'        },
    { icon: Stethoscope,   label: 'Doctors',          path: '/doctors'         },
    { type: 'divider', label: 'Operations' },
    { icon: ClipboardList, label: 'Services',         path: '/services'        },
    { icon: Calendar,      label: 'Appointments',     path: '/appointments'    },
  ],

  admin: [
    { type: 'divider', label: 'Overview' },
    { icon: LayoutDashboard, label: 'Dashboard',      path: '/dashboard'      },
    { type: 'divider', label: 'Management' },
    { icon: Users,         label: 'User Management',  path: '/acc-management' },
    { type: 'divider', label: 'System' },
    { icon: Activity,      label: 'Activity Logs',    path: '/admin-activity' },
    { icon: Settings,      label: 'Settings',          path: '/settings'       },
  ],

  staff: [
    { type: 'divider', label: 'Overview' },
    { icon: LayoutDashboard, label: 'Dashboard',      path: '/dashboard'          },
    { type: 'divider', label: 'Work' },
    { icon: ShoppingCart,  label: 'POS',              path: '/pos'                },
    { icon: Calendar,      label: 'Appointments',     path: '/staff-appointments' },
    { icon: ClipboardList, label: 'Queue',            path: '/queue'              },
    { type: 'divider', label: 'Reference' },
    { icon: Stethoscope,   label: 'Doctors',          path: '/staff-doctors'      },
    { icon: Settings,      label: 'Settings',          path: '/staff-settings'     },
  ],

  doctor: [
    { type: 'divider', label: 'Overview' },
    { icon: LayoutDashboard, label: 'Dashboard',      path: '/dashboard'       },
    { type: 'divider', label: 'My Work' },
    { icon: ClipboardList, label: 'Consultations',    path: '/consultations'   },
    { icon: Calendar,      label: 'My Schedule',      path: '/schedule'        },
    { icon: CalendarCheck, label: 'Availability',     path: '/availability'    },
    { type: 'divider', label: 'Patients' },
    { icon: UserPlus,      label: 'Patients',          path: '/Doctorpatients'  },
    { type: 'divider', label: 'Configuration' },
    { icon: Settings,      label: 'Settings',          path: '/doctor-settings' },
  ],

  patient: [
    { type: 'divider', label: 'Overview' },
    { icon: LayoutDashboard, label: 'Dashboard',      path: '/dashboard'        },
    { type: 'divider', label: 'My Health' },
    { icon: Calendar,      label: 'Book Appointments', path: '/my-appointments' },
    { icon: ClipboardList, label: 'Medical Records',  path: '/records'          },
    { type: 'divider', label: 'Account' },
    { icon: Settings,      label: 'Settings',          path: '/patient-settings' },
  ],
};

/* ══════════════════════════════════════════════════
   SECTION DIVIDER
══════════════════════════════════════════════════ */
function SectionDivider({ label, slim }) {
  if (slim) return null;
  return (
    <div className="flex items-center gap-2 px-4 pt-4 pb-1">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

/* ══════════════════════════════════════════════════
   LOGOUT MODAL
══════════════════════════════════════════════════ */
function LogoutModal({ onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl border border-gray-200 w-full max-w-xs overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-900">Sign out?</p>
          <p className="text-xs text-gray-400 mt-0.5">You'll be returned to the login page.</p>
        </div>
        <div className="px-5 py-3 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SIDEBAR
══════════════════════════════════════════════════ */
const Sidebar = ({ collapsed = false, mobileOpen, onMobileClose, isMobileInstance = false }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Track which accordion items are expanded — keyed by path
  const [expandedItems, setExpandedItems] = useState(() => {
    // Auto-expand the item whose path matches current location on mount
    const initial = {};
    const allItems = Object.values(MENU_ITEMS).flat();
    allItems.forEach(item => {
      if (item.children && location.pathname === item.path) {
        initial[item.path] = true;
      }
    });
    return initial;
  });

  const toggleExpand = (path) =>
    setExpandedItems(prev => ({ ...prev, [path]: !prev[path] }));

  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/login');
  };

  const menuItems = MENU_ITEMS[user?.role] ?? [
    { type: 'divider', label: 'Overview' },
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  ];

  const roleColors = {
    admin:   'from-violet-500 to-blue-600',
    staff:   'from-teal-500 to-blue-500',
    doctor:  'from-blue-500 to-indigo-600',
    patient: 'from-sky-400 to-blue-500',
    manager: 'from-purple-500 to-indigo-600',
  };
  const roleGradient = roleColors[user?.role] || 'from-blue-500 to-blue-700';

  const fadeStyle = (slim) => ({
    opacity:    slim ? 0 : 1,
    maxWidth:   slim ? 0 : 300,
    overflow:   'hidden',
    whiteSpace: 'nowrap',
    transition: 'opacity 200ms ease, max-width 280ms cubic-bezier(0.4, 0, 0.2, 1)',
  });

  /* ── Shared nav list ── */
  const NavItems = ({ slim = false, onItemClick }) => (
    <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
      {menuItems.map((item, index) => {

        // ── Section divider ──────────────────────────────────────────────
        if (item.type === 'divider') {
          return <SectionDivider key={`divider-${index}`} label={item.label} slim={slim} />;
        }

        const Icon        = item.icon;
        const hasChildren = !!(item.children && item.children.length > 0);
        const isExpanded  = expandedItems[item.path] ?? false;
        const isActive    = location.pathname === item.path;

        // ── Item WITH children (accordion) ──────────────────────────────
        if (hasChildren) {
          return (
            <div key={item.path}>
              {/* Parent button */}
              <button
                type="button"
                onClick={() => {
                  if (!slim) toggleExpand(item.path);
                  // In slim/collapsed mode navigate directly (no room for sub-items)
                  else { navigate(item.path); onItemClick?.(); }
                }}
                title={slim ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-150
                  ${isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
              >
                <Icon
                  className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`}
                  style={{ width: 18, height: 18 }}
                />
                <span style={fadeStyle(slim)} className="text-sm font-semibold flex-1 text-left">
                  {item.label}
                </span>
                {/* Chevron — only when not slim */}
                {!slim && (
                  <ChevronRight
                    className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200
                      ${isActive ? 'text-blue-200' : 'text-gray-300'}
                      ${isExpanded ? 'rotate-90' : 'rotate-0'}`}
                  />
                )}
              </button>

              {/* Children — slide open when expanded & not slim */}
              {!slim && isExpanded && (
                <div className="ml-9 mt-1 space-y-0.5 border-l-2 border-gray-100 pl-3">
                  {item.children.map((child, idx) => {
                    const childHash   = `#${child.key}`;
                    const isChildActive =
                      location.pathname === item.path &&
                      (location.hash === childHash || (!location.hash && idx === 0));

                    return (
                      <NavLink
                        key={child.key}
                        to={`${item.path}${childHash}`}
                        onClick={onItemClick}
                        className={`block px-3 py-2 text-xs rounded-lg transition-colors
                          ${isChildActive
                            ? 'bg-blue-50 text-blue-600 font-bold border-l-2 border-blue-500 -ml-[2px] pl-[calc(0.75rem+2px)]'
                            : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50 font-semibold'}`}
                      >
                        {child.label}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        // ── Plain nav link (no children) ─────────────────────────────────
        return (
          <NavLink
            key={item.path}
            to={item.path}
            title={slim ? item.label : undefined}
            onClick={onItemClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-150
              ${isActive
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`}
                  style={{ width: 18, height: 18 }}
                />
                <span style={fadeStyle(slim)} className="text-sm font-semibold flex-1">
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
  );

  /* ── Desktop sidebar ── */
  const DesktopContent = () => {
    const slim = collapsed;
    return (
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

        <NavItems slim={slim} />

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

  /* ── Mobile drawer ── */
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

      <NavItems onItemClick={onMobileClose} />

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
      {!isMobileInstance && <DesktopContent />}

      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
        style={{
          opacity:       mobileOpen ? 1 : 0,
          pointerEvents: mobileOpen ? 'auto' : 'none',
          transition:    'opacity 300ms ease',
        }}
        onClick={onMobileClose}
      />
      {/* Mobile drawer */}
      <div
        className="fixed top-0 left-0 z-50 h-full md:hidden"
        style={{
          transform:  mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
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
