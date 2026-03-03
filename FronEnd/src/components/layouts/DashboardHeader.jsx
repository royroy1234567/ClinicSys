import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Bell, Search, ChevronDown, X } from 'lucide-react';

const DEMO_NOTIFICATIONS = [
  { id:1, type:'appt',   title:'New appointment booked',         time:'2 min ago',  read:false },
  { id:2, type:'followup',title:'Follow-up overdue: Maria Santos', time:'15 min ago', read:false },
  { id:3, type:'patient', title:'New patient registered',         time:'1 hr ago',   read:false },
  { id:4, type:'system',  title:'System backup completed',        time:'3 hrs ago',  read:true  },
];

const DashboardHeader = ({ title, subtitle }) => {
  const { user } = useAuth();
  const [showNotif, setShowNotif] = useState(false);
  const [notifs, setNotifs] = useState(DEMO_NOTIFICATIONS);
  const unread = notifs.filter(n => !n.read).length;

  const markAllRead = () => setNotifs(n => n.map(x => ({ ...x, read: true })));

  const roleColors = {
    admin:   'from-violet-500 to-blue-600',
    staff:   'from-teal-500 to-blue-500',
    doctor:  'from-blue-500 to-indigo-600',
    patient: 'from-sky-400 to-blue-500',
  };
  const roleGradient = roleColors[user?.role] || 'from-blue-500 to-blue-700';

  const roleLabels = {
    admin: '👑 Administrator',
    staff: '👩‍💻 Staff',
    doctor: '👨‍⚕️ Doctor',
    patient: '🧑 Patient',
  };

  return (
    <header
      className="relative flex-shrink-0 border-b border-blue-100/60"
      style={{ background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 60%, #dbeafe 100%)' }}
      data-testid="dashboard-header"
    >
      {/* Subtle top accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 opacity-60" />

      <div className="flex items-center justify-between px-6 py-4">

        {/* Left — Title */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-gray-900 tracking-tight" data-testid="header-title">
              {title}
            </h1>
          </div>
          {subtitle && (
            <p className="text-xs text-blue-500 font-semibold mt-0.5 tracking-wide" data-testid="header-subtitle">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right — Actions */}
        <div className="flex items-center gap-3">

          {/* Search */}
          <div className="hidden md:flex items-center relative">
            <Search className="absolute left-3 w-3.5 h-3.5 text-blue-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Quick search…"
              data-testid="header-search"
              className="pl-9 pr-4 py-2 w-52 text-sm rounded-xl border border-blue-100 bg-white/80 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-sm transition-all focus:w-64"
            />
          </div>

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

            {/* Dropdown */}
            {showNotif && (
              <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
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
                    <div key={n.id}
                      className={`px-4 py-3 flex items-start gap-3 hover:bg-blue-50/50 transition-colors cursor-pointer
                        ${!n.read ? 'bg-blue-50/30' : ''}`}
                      onClick={() => setNotifs(ns => ns.map(x => x.id===n.id ? {...x,read:true} : x))}>
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

          {/* User pill */}
          <div className="flex items-center gap-2.5 bg-white border border-blue-100 rounded-xl px-3 py-1.5 shadow-sm cursor-default">
            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${roleGradient} shadow flex items-center justify-center text-white text-xs font-black flex-shrink-0`}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="hidden md:block">
              <p className="text-xs font-bold text-gray-800 leading-tight">{user?.name}</p>
              <p className="text-[10px] text-blue-500 font-semibold leading-tight">{roleLabels[user?.role] || user?.role}</p>
            </div>
            <ChevronDown className="w-3 h-3 text-gray-400 hidden md:block" />
          </div>

        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;