import React, { useEffect, useState, useCallback } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Shield, Users, UserCheck, UserX, Briefcase, Stethoscope,
  TrendingUp, TrendingDown, Activity, Clock, AlertTriangle,
  RefreshCw, ChevronRight, BarChart2, Eye, Lock, ArchiveX,
  UserPlus, Settings, Bell, Calendar, Loader2, CheckCircle2,
  XCircle, MinusCircle, ArrowUpRight, ArrowDownRight, Zap,
  PieChart, Database, Server, ShieldCheck,
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

/* ══════════════ CONFIG ══════════════ */
const API = 'http://backend1.test/api';

const ROLE_CONFIG = {
  manager: { label: 'Manager', icon: Briefcase,   bg: 'bg-orange-100', color: 'text-orange-700', border: 'border-orange-200', accent: '#f97316' },
  admin:   { label: 'Admin',   icon: Shield,       bg: 'bg-purple-100', color: 'text-purple-700', border: 'border-purple-200', accent: '#9333ea' },
  doctor:  { label: 'Doctor',  icon: Stethoscope,  bg: 'bg-blue-100',   color: 'text-blue-700',   border: 'border-blue-200',   accent: '#2563eb' },
  staff:   { label: 'Staff',   icon: Users,        bg: 'bg-teal-100',   color: 'text-teal-700',   border: 'border-teal-200',   accent: '#0d9488' },
};

/* ══════════════ HELPERS ══════════════ */
const apiFetch = async (path, options = {}) => {
  const token = localStorage.getItem('auth_token');
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
};

const getRawId  = (user) => user?.user_id ?? user?.raw_id ?? user?.id;
const fullName  = (u)    => `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim();
const initials  = (u)    => `${u.first_name?.[0] ?? ''}${u.last_name?.[0] ?? ''}`.toUpperCase();
const timeAgo   = (dateStr) => {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return 'Just now';
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

/* ══════════════ STAT CARD ══════════════ */
const StatCard = ({ label, value, sub, icon: Icon, iconBg, iconColor, trend, trendValue, loading, accent }) => (
  <Card className="relative overflow-hidden group hover:shadow-md transition-shadow duration-200 py-0 gap-0 rounded-2xl border-gray-200 bg-white shadow-sm">
    <div
      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
      style={{ background: `radial-gradient(circle at top right, ${accent}0a 0%, transparent 65%)` }}
    />
    <CardContent className="p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        {trend && !loading && (
          <div className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full
            ${trend === 'up' ? 'bg-green-50 text-green-600' : trend === 'down' ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-400'}`}>
            {trend === 'up'   ? <ArrowUpRight   className="w-3 h-3" /> : null}
            {trend === 'down' ? <ArrowDownRight className="w-3 h-3" /> : null}
            {trendValue}
          </div>
        )}
      </div>
      {loading
        ? <div className="space-y-2"><div className="h-8 w-14 bg-gray-100 rounded animate-pulse" /><div className="h-4 w-28 bg-gray-100 rounded animate-pulse" /></div>
        : <>
            <p className="text-4xl font-extrabold text-gray-900 tracking-tight leading-none">{value}</p>
            <p className="text-sm font-semibold text-gray-500 mt-2">{label}</p>
            {sub && <p className="text-sm text-gray-400 mt-1">{sub}</p>}
          </>
      }
    </CardContent>
  </Card>
);

/* ══════════════ ROLE DISTRIBUTION BAR ══════════════ */
const RoleDistributionBar = ({ users, loading }) => {
  const counts = { manager: 0, admin: 0, doctor: 0, staff: 0 };
  users.forEach(u => {
    const r = u.role?.toLowerCase();
    if (counts[r] !== undefined) counts[r]++;
  });
  const total = users.length || 1;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <PieChart className="w-4 h-4 text-blue-500" /> Role Distribution
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                <div className="h-2.5 w-full bg-gray-100 rounded-full animate-pulse" />
              </div>
            ))
          : Object.entries(counts).map(([role, count]) => {
              const cfg = ROLE_CONFIG[role];
              const Icon = cfg.icon;
              const pct  = Math.round((count / total) * 100);
              return (
                <div key={role}>
                  <div className="flex items-center justify-between mb-1">
                    <div className={`flex items-center gap-1.5 text-xs font-semibold ${cfg.color}`}>
                      <Icon className="w-3 h-3" /> {cfg.label}
                    </div>
                    <span className="text-xs text-gray-400 font-semibold">{count} <span className="text-gray-300">({pct}%)</span></span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: cfg.accent }}
                    />
                  </div>
                </div>
              );
            })
        }
      </CardContent>
    </Card>
  );
};

/* ══════════════ STATUS OVERVIEW RING ══════════════ */
const StatusOverviewCard = ({ users, loading }) => {
  const active   = users.filter(u => u.status?.toLowerCase() === 'active').length;
  const inactive = users.filter(u => u.status?.toLowerCase() === 'inactive').length;
  const total    = users.length;
  const activePct = total ? Math.round((active / total) * 100) : 0;

  const radius = 44;
  const circ   = 2 * Math.PI * radius;
  const dash   = (activePct / 100) * circ;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <Activity className="w-4 h-4 text-green-500" /> Account Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading
          ? <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
          : (
            <div className="flex items-center gap-6">
              <div className="relative flex-shrink-0">
                <svg width="110" height="110" className="-rotate-90">
                  <circle cx="55" cy="55" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="10" />
                  <circle
                    cx="55" cy="55" r={radius} fill="none"
                    stroke="#22c55e" strokeWidth="10"
                    strokeDasharray={`${dash} ${circ}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.7s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black text-gray-900">{activePct}%</span>
                  <span className="text-[10px] text-gray-400 font-semibold">Active</span>
                </div>
              </div>
              <div className="space-y-3 flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Active
                  </div>
                  <span className="text-sm font-black text-gray-900">{active}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <XCircle className="w-3.5 h-3.5 text-gray-400" /> Inactive
                  </div>
                  <span className="text-sm font-black text-gray-900">{inactive}</span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold">
                    <MinusCircle className="w-3.5 h-3.5 text-gray-300" /> Total
                  </div>
                  <span className="text-sm font-black text-gray-900">{total}</span>
                </div>
              </div>
            </div>
          )
        }
      </CardContent>
    </Card>
  );
};

/* ══════════════ RECENT USERS TABLE ══════════════ */
const RecentUsersCard = ({ users, loading, onManage }) => {
  const recent = [...users]
    .sort((a, b) => new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0))
    .slice(0, 8);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-blue-500" /> Recently Added
          </CardTitle>
          <span className="text-xs text-gray-300">{users.length} total</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-50">
          {loading && Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-28 bg-gray-100 rounded animate-pulse" />
                <div className="h-2.5 w-16 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
          {!loading && recent.length === 0 && (
            <div className="text-center py-10 text-xs text-gray-300">No users found</div>
          )}
          {!loading && recent.map(user => {
            const role = user.role?.toLowerCase();
            const cfg  = ROLE_CONFIG[role];
            const Icon = cfg?.icon ?? Users;
            return (
              <div key={getRawId(user)} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors group">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs ${cfg?.bg ?? 'bg-gray-100'} ${cfg?.color ?? 'text-gray-600'}`}>
                  {initials(user)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{fullName(user)}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${cfg?.color ?? 'text-gray-400'}`}>
                      <Icon className="w-2.5 h-2.5" /> {cfg?.label ?? role}
                    </span>
                    <span className="text-gray-200">·</span>
                    <span className="text-[10px] text-gray-400">{timeAgo(user.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${user.status?.toLowerCase() === 'active' ? 'bg-green-400' : 'bg-gray-300'}`} />
                  <button
                    onClick={() => onManage(user)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-semibold text-blue-500 hover:text-blue-700 flex items-center gap-0.5"
                  >
                    Manage <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};



/* ══════════════ SYSTEM HEALTH ══════════════ */
const SystemHealthCard = ({ users, loading }) => {
  const active   = users.filter(u => u.status?.toLowerCase() === 'active').length;
  const inactive = users.filter(u => u.status?.toLowerCase() === 'inactive').length;
  const total    = users.length;

  const metrics = [
    {
      label: 'Active Rate',
      value: total ? `${Math.round((active / total) * 100)}%` : '—',
      status: total && active / total >= 0.7 ? 'good' : 'warn',
      icon: Activity,
    },
    {
      label: 'Inactive Accounts',
      value: inactive,
      status: inactive === 0 ? 'good' : inactive > 5 ? 'warn' : 'ok',
      icon: UserX,
    },
    {
      label: 'Total Users',
      value: total,
      status: 'good',
      icon: Users,
    },
    {
      label: 'Admins & Managers',
      value: users.filter(u => ['admin','manager'].includes(u.role?.toLowerCase())).length,
      status: 'ok',
      icon: Shield,
    },
  ];

  const statusStyles = {
    good: { dot: 'bg-green-400', bg: 'bg-green-50', text: 'text-green-700', label: 'Healthy' },
    ok:   { dot: 'bg-blue-400',  bg: 'bg-blue-50',  text: 'text-blue-700',  label: 'Normal'  },
    warn: { dot: 'bg-amber-400', bg: 'bg-amber-50', text: 'text-amber-700', label: 'Needs attention' },
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-500" /> System Health
          </CardTitle>
          <span className="text-[10px] font-semibold text-green-500 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" /> Live
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)
          : metrics.map(({ label, value, status, icon: Icon }) => {
              const s = statusStyles[status];
              return (
                <div key={label} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${s.bg}`}>
                  <Icon className={`w-3.5 h-3.5 ${s.text} flex-shrink-0`} />
                  <span className={`text-xs font-semibold ${s.text} flex-1`}>{label}</span>
                  <span className={`text-xs font-black ${s.text}`}>{value}</span>
                  <span className={`h-2 w-2 rounded-full flex-shrink-0 ${s.dot}`} />
                </div>
              );
            })
        }
      </CardContent>
    </Card>
  );
};

/* ══════════════ ALERTS CARD ══════════════ */
const AlertsCard = ({ users, loading }) => {
  const inactive = users.filter(u => u.status?.toLowerCase() === 'inactive');
  const noContact = users.filter(u => !u.contact_number);
  const recentDocs = users.filter(u => u.role?.toLowerCase() === 'doctor' && !u.license_number);

  const alerts = [
    ...(inactive.length > 0 ? [{
      type: 'warn',
      icon: UserX,
      message: `${inactive.length} inactive account${inactive.length > 1 ? 's' : ''} detected`,
      sub: 'Review and reactivate or archive',
    }] : []),
    ...(noContact.length > 0 ? [{
      type: 'info',
      icon: Bell,
      message: `${noContact.length} user${noContact.length > 1 ? 's' : ''} missing contact info`,
      sub: 'Update records for better reach',
    }] : []),
    ...(recentDocs.length > 0 ? [{
      type: 'warn',
      icon: Stethoscope,
      message: `${recentDocs.length} doctor${recentDocs.length > 1 ? 's' : ''} without license number`,
      sub: 'License numbers are required',
    }] : []),
    ...(!inactive.length && !noContact.length && !recentDocs.length ? [{
      type: 'good',
      icon: CheckCircle2,
      message: 'All systems look great!',
      sub: 'No issues detected at this time',
    }] : []),
  ];

  const styles = {
    warn: { bg: 'bg-amber-50', border: 'border-amber-100', icon: 'text-amber-500', text: 'text-amber-700', sub: 'text-amber-500' },
    info: { bg: 'bg-blue-50',  border: 'border-blue-100',  icon: 'text-blue-500',  text: 'text-blue-700',  sub: 'text-blue-400'  },
    good: { bg: 'bg-green-50', border: 'border-green-100', icon: 'text-green-500', text: 'text-green-700', sub: 'text-green-500' },
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" /> Alerts & Notices
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading
          ? Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)
          : alerts.map(({ type, icon: Icon, message, sub }, i) => {
              const s = styles[type];
              return (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${s.bg} ${s.border}`}>
                  <Icon className={`w-4 h-4 ${s.icon} flex-shrink-0 mt-0.5`} />
                  <div>
                    <p className={`text-xs font-bold ${s.text}`}>{message}</p>
                    <p className={`text-[10px] ${s.sub} mt-0.5`}>{sub}</p>
                  </div>
                </div>
              );
            })
        }
      </CardContent>
    </Card>
  );
};

/* ══════════════ DOCTORS SPOTLIGHT ══════════════ */
const DoctorsSpotlightCard = ({ users, loading }) => {
  const doctors = users.filter(u => u.role?.toLowerCase() === 'doctor').slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-blue-500" /> Doctors on File
          </CardTitle>
          <span className="text-xs text-gray-300">{users.filter(u => u.role?.toLowerCase() === 'doctor').length} total</span>
        </div>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-100 rounded-full animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-28 bg-gray-100 rounded animate-pulse" />
                  <div className="h-2.5 w-20 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && doctors.length === 0 && (
          <p className="text-xs text-gray-300 text-center py-6">No doctors registered</p>
        )}
        {!loading && doctors.length > 0 && (
          <div className="space-y-3">
            {doctors.map(user => (
              <div key={getRawId(user)} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs bg-blue-100 text-blue-700">
                  {initials(user)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">Dr. {fullName(user)}</p>
                  <p className="text-[10px] text-gray-400">
                    {user.license_number
                      ? <span className="text-blue-400 font-medium">{user.license_number}</span>
                      : <span className="text-amber-400">No license on file</span>
                    }
                  </p>
                </div>
                <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${user.status?.toLowerCase() === 'active' ? 'bg-green-400' : 'bg-gray-300'}`} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/* ══════════════ MAIN DASHBOARD ══════════════ */
export default function AccountAdminDashboard({ onNavigateToUsers, onAddUser }) {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { ok, data } = await apiFetch('/users');
      if (ok) {
        setUsers(Array.isArray(data) ? data : data.data ?? []);
        setLastRefresh(new Date());
      } else {
        toast({ title: 'Error', description: 'Failed to load user data.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Network error', description: 'Could not reach the server.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  /* Derived stats */
  const total    = users.length;
  const active   = users.filter(u => u.status?.toLowerCase() === 'active').length;
  const inactive = users.filter(u => u.status?.toLowerCase() === 'inactive').length;
  const managers = users.filter(u => u.role?.toLowerCase() === 'manager').length;
  const doctors  = users.filter(u => u.role?.toLowerCase() === 'doctor').length;
  const staff    = users.filter(u => u.role?.toLowerCase() === 'staff').length;

  const handleManage = (user) => {
    // Navigate or open manage flow — hook into parent if provided
    if (onNavigateToUsers) onNavigateToUsers(user);
  };

  return (
    <MainLayout
      title="Admin Dashboard"
      subtitle="Account overview, system health, and user analytics"
    >
      <div className="space-y-5">

        {/* ── Page Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 mt-0.5">
              {lastRefresh ? `Last updated ${timeAgo(lastRefresh)}` : 'Loading data…'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}
              className="h-8 px-3 text-xs gap-1.5 text-gray-500">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        </div>

        {/* ── KPI Row ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Total Users" value={total}    icon={Users}       iconBg="bg-blue-50"   iconColor="text-blue-600"   accent="#2563eb" loading={loading} />
          <StatCard label="Active"      value={active}   icon={UserCheck}   iconBg="bg-green-50"  iconColor="text-green-600"  accent="#16a34a" loading={loading}
            trend={active > 0 ? 'up' : null} trendValue={`${total ? Math.round((active / total) * 100) : 0}%`} />
          <StatCard label="Inactive"    value={inactive} icon={UserX}       iconBg="bg-gray-50"   iconColor="text-gray-500"   accent="#6b7280" loading={loading}
            trend={inactive > 0 ? 'down' : null} trendValue={`${total ? Math.round((inactive / total) * 100) : 0}%`} />
          <StatCard label="Managers"   value={managers} icon={Briefcase}   iconBg="bg-orange-50" iconColor="text-orange-600" accent="#f97316" loading={loading} />
          <StatCard label="Doctors"    value={doctors}  icon={Stethoscope} iconBg="bg-blue-50"   iconColor="text-blue-600"   accent="#2563eb" loading={loading} />
          <StatCard label="Staff"      value={staff}    icon={Users}       iconBg="bg-teal-50"   iconColor="text-teal-600"   accent="#0d9488" loading={loading} />
        </div>

        {/* ── Row 2: Status ring + Role bars + System Health (3 equal cols) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatusOverviewCard  users={users} loading={loading} />
          <RoleDistributionBar users={users} loading={loading} />
          <SystemHealthCard    users={users} loading={loading} />
        </div>

        {/* ── Row 3: Recent Users (wide) + Alerts + Doctors (narrow stack) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Recent Users — takes 3 of 5 cols */}
          <div className="lg:col-span-3">
            <RecentUsersCard users={users} loading={loading} onManage={handleManage} />
          </div>

          {/* Right sidebar — 2 of 5 cols */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <AlertsCard           users={users} loading={loading} />
            <DoctorsSpotlightCard users={users} loading={loading} />
          </div>
        </div>




      </div>
    </MainLayout>
  );
}
