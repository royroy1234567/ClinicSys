import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Search, ChevronDown, X, Menu,
  PanelLeftClose, PanelLeftOpen,
  UserCircle, Settings, LogOut, AlertTriangle,
} from 'lucide-react';

const DEMO_NOTIFICATIONS = [
  { id: 1, type: 'appt',     title: 'New appointment booked',          time: '2 min ago',  read: false },
  { id: 2, type: 'followup', title: 'Follow-up overdue: Maria Santos', time: '15 min ago', read: false },
  { id: 3, type: 'patient',  title: 'New patient registered',          time: '1 hr ago',   read: false },
  { id: 4, type: 'system',   title: 'System backup completed',         time: '3 hrs ago',  read: true  },
];

/* ══════════════════════════════════════════════════
   LOGOUT CONFIRMATION MODAL
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
   USER PILL DROPDOWN
══════════════════════════════════════════════════ */
function UserDropdown({ user, roleGradient, roleLabels, onLogoutClick }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const settingsPath = {
    manager: '/settings',
    staff:   '/staff-settings',
    doctor:  '/doctor-settings',
    patient: '/patient-settings',
  }[user?.role] || '/settings';

  const profilePath = {
    manager: '/profile',
    staff:   '/profile',
    doctor:  '/profile',
    patient: '/profile',
  }[user?.role] || '/profile';

  const menuItems = [
    {
      icon: UserCircle,
      label: 'Profile',
      sub: 'View & edit your profile',
      onClick: () => { navigate(profilePath); setOpen(false); },
    },
    {
      icon: Settings,
      label: 'Settings',
      sub: 'Preferences & account',
      onClick: () => { navigate(settingsPath); setOpen(false); },
    },
  ];

  return (
    <div className="relative" ref={ref}>
      {/* Pill trigger */}
      <button
        onClick={() => setOpen(p => !p)}
        className={`flex items-center gap-2 md:gap-2.5 bg-white border rounded-xl px-2.5 md:px-3 py-1.5 shadow-sm transition-all duration-150
          ${open ? 'border-blue-400 ring-2 ring-blue-100' : 'border-blue-100 hover:border-blue-300'}`}
      >
        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${roleGradient} shadow flex items-center justify-center text-white text-xs font-black flex-shrink-0`}>
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div className="hidden md:block text-left">
          <p className="text-xs font-bold text-gray-800 leading-tight">{user?.name}</p>
          <p className="text-[10px] text-blue-500 font-semibold leading-tight">{roleLabels[user?.role] || user?.role}</p>
        </div>
        <ChevronDown
          className="w-3 h-3 text-gray-400 hidden md:block transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {/* Dropdown panel */}
      <div
        className="absolute right-0 top-[calc(100%+8px)] w-64 z-50"
        style={{
          opacity: open ? 1 : 0,
          transform: open ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.97)',
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 180ms ease, transform 180ms cubic-bezier(0.4,0,0.2,1)',
          transformOrigin: 'top right',
        }}
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">

          {/* Header — user info */}
          <div className="px-4 py-4 flex items-center gap-3 border-b border-gray-100"
            style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' }}
          >
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${roleGradient} shadow-lg flex items-center justify-center text-white text-base font-black flex-shrink-0`}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-black text-gray-900 truncate">{user?.name}</p>
              <p className="text-[11px] text-blue-500 font-semibold capitalize">{roleLabels[user?.role] || user?.role}</p>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1.5">
            {menuItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors duration-100 group"
                >
                  <div className="w-8 h-8 rounded-xl bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center flex-shrink-0 transition-colors duration-100">
                    <Icon className="w-4 h-4 text-gray-500 group-hover:text-blue-600 transition-colors duration-100" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-gray-800">{item.label}</p>
                    <p className="text-[11px] text-gray-400">{item.sub}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Divider + Logout */}
          <div className="px-3 py-2 border-t border-gray-100">
            <button
              onClick={() => { setOpen(false); onLogoutClick(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-colors duration-100 group"
            >
              <div className="w-8 h-8 rounded-xl bg-gray-100 group-hover:bg-red-100 flex items-center justify-center flex-shrink-0 transition-colors duration-100">
                <LogOut className="w-4 h-4 text-gray-500 group-hover:text-red-500 transition-colors duration-100" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-gray-700 group-hover:text-red-600 transition-colors duration-100">Log out</p>
                <p className="text-[11px] text-gray-400">End your session</p>
              </div>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   DASHBOARD HEADER
══════════════════════════════════════════════════ */
const DashboardHeader = ({ title, subtitle, collapsed, onToggle, onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotif, setShowNotif]         = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [notifs, setNotifs]               = useState(DEMO_NOTIFICATIONS);
  const unread = notifs.filter(n => !n.read).length;

  const markAllRead = () => setNotifs(n => n.map(x => ({ ...x, read: true })));

  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/login');
  };

  const roleColors = {
    admin:   'from-violet-500 to-blue-600',
    staff:   'from-teal-500 to-blue-500',
    doctor:  'from-blue-500 to-indigo-600',
    patient: 'from-sky-400 to-blue-500',
  };
  const roleGradient = roleColors[user?.role] || 'from-blue-500 to-blue-700';
  const roleLabels = {
    admin: '👑 Administrator', staff: '👩‍💻 Staff',
    doctor: '👨‍⚕️ Doctor', patient: '🧑 Patient',
  };

  return (
    <>
      <header
        className="relative flex-shrink-0 border-b border-blue-100/60"
        style={{ background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 60%, #dbeafe 100%)' }}
        data-testid="dashboard-header"
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 opacity-60" />

        <div className="flex items-center justify-between px-4 md:px-6 py-4 gap-3">

          {/* Left */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Burger — mobile */}
            <button
              onClick={onMenuClick}
              className="md:hidden flex-shrink-0 w-9 h-9 rounded-xl bg-white border border-blue-100 shadow-sm flex items-center justify-center text-gray-500 hover:text-blue-600 hover:border-blue-300 transition-all"
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Collapse toggle — desktop */}
            <button
              onClick={onToggle}
              className="hidden md:flex flex-shrink-0 w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-md shadow-blue-200 items-center justify-center text-white transition-all duration-150"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed
                ? <PanelLeftOpen  className="w-[18px] h-[18px]" />
                : <PanelLeftClose className="w-[18px] h-[18px]" />}
            </button>

            {/* Title */}
            <div className="min-w-0">
              <h1 className="text-base md:text-xl font-black text-gray-900 tracking-tight truncate" data-testid="header-title">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-blue-500 font-semibold mt-0.5 tracking-wide truncate" data-testid="header-subtitle">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">

              

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotif(p => !p)}
                data-testid="notifications-button"
                className="relative w-9 h-9 rounded-xl bg-white border border-blue-100 shadow-sm flex items-center justify-center text-gray-500 hover:text-blue-600 hover:border-blue-300 transition-all"
              >
                <Bell className="w-4 h-4" />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center shadow">
                    {unread}
                  </span>
                )}
              </button>

              {showNotif && (
                <div className="absolute right-0 top-11 w-72 md:w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
                    <p className="text-sm font-black text-gray-800">Notifications</p>
                    <div className="flex items-center gap-2">
                      {unread > 0 && (
                        <button onClick={markAllRead} className="text-xs text-blue-500 font-semibold hover:text-blue-700">
                          Mark all read
                        </button>
                      )}
                      <button onClick={() => setShowNotif(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                    {notifs.map(n => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 flex items-start gap-3 hover:bg-blue-50/50 transition-colors cursor-pointer ${!n.read ? 'bg-blue-50/30' : ''}`}
                        onClick={() => setNotifs(ns => ns.map(x => x.id === n.id ? { ...x, read: true } : x))}
                      >
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.read ? 'bg-blue-500' : 'bg-gray-200'}`} />
                        <div>
                          <p className={`text-xs font-semibold leading-snug ${!n.read ? 'text-gray-800' : 'text-gray-500'}`}>{n.title}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User pill with dropdown */}
            <UserDropdown
              user={user}
              roleGradient={roleGradient}
              roleLabels={roleLabels}
              onLogoutClick={() => setShowLogoutModal(true)}
            />

          </div>
        </div>
      </header>

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

export default DashboardHeader;