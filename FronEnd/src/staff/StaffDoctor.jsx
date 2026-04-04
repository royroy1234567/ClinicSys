import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { Card, CardContent } from '../components/ui/card';
import {
  Stethoscope, Search, Eye, User,
  Phone, X, Check, Shield,
  Hash, RefreshCw, Mail,
  Calendar, Clock, Building2,
  MapPin, ChevronDown, Loader2,
  AlertCircle, CalendarCheck, UserX, BookOpen,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://backend1.test/api';
const TOKEN_KEY = 'auth_token';

/* ═══════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════ */
const AVATAR_POOL = [
  'bg-blue-100 text-blue-700',    'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700','bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700',  'bg-teal-100 text-teal-700',
  'bg-cyan-100 text-cyan-700',    'bg-indigo-100 text-indigo-700',
];
const avatarCls = n => AVATAR_POOL[n.charCodeAt(0) % AVATAR_POOL.length];
const initials  = n => n.replace('Dr. ', '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

const STATUS_META = {
  'available':     { label: 'Available',     dot: 'bg-green-500', pill: 'bg-green-50 text-green-700'  },
  'fully-booked':  { label: 'Fully Booked',  dot: 'bg-amber-500', pill: 'bg-amber-50 text-amber-700'  },
  'not-available': { label: 'Not Available', dot: 'bg-gray-400',  pill: 'bg-gray-100 text-gray-500'   },
};

function deriveStatus(scheduleMap) {
  const allSlots = Object.values(scheduleMap).flatMap(s => s.slots ?? []);
  if (allSlots.length === 0) return 'not-available';
  const hasAvailable = allSlots.some(slot => {
    const capacity = slot.maxPts > 0 ? slot.maxPts : Infinity;
    return slot.booked < capacity;
  });
  return hasAvailable ? 'available' : 'fully-booked';
}

function buildScheduleRows(scheduleMap) {
  const rows = [];
  Object.entries(scheduleMap).forEach(([date, day]) => {
    (day.slots ?? []).forEach(slot => {
      const capacity = slot.maxPts > 0 ? slot.maxPts : null;
      let status;
      if (capacity === null) {
        status = 'available';
      } else if (slot.booked >= capacity) {
        status = 'fully-booked';
      } else {
        status = 'available';
      }
      const label = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      rows.push({ date: label, slot: `${slot.start} – ${slot.end}`, status, booked: slot.booked, maxPts: capacity });
    });
  });
  rows.sort((a, b) => a.date.localeCompare(b.date));
  return rows;
}

function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return {
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

/* ── KPI Card (matches StaffAppointments style) ── */
const KPICard = ({ label, value, sub, icon: Icon, iconBg, iconColor }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{value}</h3>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

/* ── Slot Badge ── */
function SlotBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META['not-available'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${m.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

/* ── Toast ── */
function Toast({ message, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-gray-900 text-white text-sm font-semibold rounded-2xl shadow-2xl">
      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
      {message}
    </div>
  );
}

/* ── Error Banner ── */
const ErrorBanner = ({ message, onRetry }) => (
  <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
    <AlertCircle className="w-4 h-4 flex-shrink-0" />
    <span className="flex-1">{message}</span>
    {onRetry && (
      <button onClick={onRetry} className="text-xs font-semibold underline underline-offset-2 hover:text-red-900">
        Retry
      </button>
    )}
  </div>
);

/* ═══════════════════════════════════════════════════
   PROFILE MODAL  (with tabs: Profile | Schedule)
═══════════════════════════════════════════════════ */
function ProfileModal({ doctor, onClose, onBook, onViewAvail }) {
  const meta = STATUS_META[doctor.status];
  const [tab, setTab] = useState('profile'); // 'profile' | 'schedule'

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute bottom-0 right-32 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black border-2 border-white/30 ${avatarCls(doctor.name)}`}>
                {initials(doctor.name)}
              </div>
              <div>
                <h3 className="text-lg font-black">{doctor.name}</h3>
                <p className="text-blue-200 text-sm">{doctor.specialization}</p>
                <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full mt-1
                  ${doctor.status === 'available'
                    ? 'bg-green-400/20 text-green-200 border border-green-300/30'
                    : doctor.status === 'fully-booked'
                    ? 'bg-amber-400/20 text-amber-200 border border-amber-300/30'
                    : 'bg-gray-400/20 text-gray-300 border border-gray-400/30'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                  {meta.label}
                </span>
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all flex-shrink-0">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* ── Tabs ── */}
          <div className="relative flex gap-1 mt-5 bg-white/10 rounded-xl p-1">
            {[
              { key: 'profile',  label: 'Profile',  Icon: User     },
              { key: 'schedule', label: 'Schedule', Icon: Calendar },
            ].map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all
                  ${tab === key
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-blue-200 hover:text-white'}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Modal Body ── */}
        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">

          {/* ══ PROFILE TAB ══ */}
          {tab === 'profile' && (
            <>
              {/* Basic Information */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <User className="w-3 h-3" /> Basic Information
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    [Hash,        'Doctor ID',      doctor.id            ],
                    [Stethoscope, 'Specialization', doctor.specialization],
                    [Mail,        'Contact Email',  doctor.email         ],
                    [Phone,       'Contact No.',    doctor.contact       ],
                  ].map(([Icon, label, value]) => (
                    <div key={label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className="w-3 h-3 text-gray-400" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
                      </div>
                      <p className="text-sm font-bold text-gray-800 break-all">{value ?? '—'}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Professional Information */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Building2 className="w-3 h-3" /> Professional Information
                </p>
                <div className="space-y-2">
                  {[
                    [Building2, 'Department / Specialty', doctor.department],
                    [MapPin,    'Consultation Room',       doctor.room      ],
                  ].map(([Icon, label, value]) => (
                    <div key={label} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
                        <p className="text-sm font-semibold text-gray-800">{value ?? '—'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Read-only notice */}
              <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                <Shield className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p><strong>Read-only access.</strong> Doctor profiles and schedules can only be modified by administrators.</p>
              </div>

              {/* Quick Actions */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Hash className="w-3 h-3" /> Quick Actions
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { onBook(doctor); onClose(); }}
                    className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm"
                  >
                    <Calendar className="w-4 h-4" />
                    Book Appointment
                  </button>
                  <button
                    onClick={() => setTab('schedule')}
                    className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl border-2 border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-bold transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    View Schedule
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ══ SCHEDULE TAB ══ */}
          {tab === 'schedule' && (
            <>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> Availability / Schedule
                </p>
                {doctor.schedule.length === 0 ? (
                  <div className="text-center py-10">
                    <CalendarCheck className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400 font-medium">No schedule set for this doctor.</p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          {['Date', 'Time Slot', 'Booked', 'Status'].map(h => (
                            <th key={h} className="text-left py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {doctor.schedule.map((s, i) => (
                          <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                            <td className="py-2.5 px-3 text-xs font-semibold text-gray-700 whitespace-nowrap">{s.date}</td>
                            <td className="py-2.5 px-3">
                              <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 whitespace-nowrap">
                                <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />{s.slot}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-xs font-semibold text-gray-600">
                              {s.booked}{s.maxPts ? `/${s.maxPts}` : ''}
                            </td>
                            <td className="py-2.5 px-3"><SlotBadge status={s.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Back to profile shortcut */}
              <button
                onClick={() => setTab('profile')}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border-2 border-gray-200 text-gray-500 text-xs font-bold hover:bg-gray-50 transition-all"
              >
                <User className="w-3.5 h-3.5" /> Back to Profile
              </button>
            </>
          )}

          {/* Close button (always visible) */}
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-gray-200 text-gray-500 text-sm font-bold hover:bg-gray-50 transition-all"
          >
            <X className="w-4 h-4" /> Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */
export default function StaffDoctorsPage() {
  const [doctors,    setDoctors]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [search,     setSearch]     = useState('');
  const [specFilter, setSpecFilter] = useState('All');
  const [statFilter, setStatFilter] = useState('All');
  const [viewDoctor, setViewDoctor] = useState(null);
  const [toast,      setToast]      = useState(null);
  const [page,       setPage]       = useState(1);
  const PER_PAGE = 8;

  /* ── Fetch doctors + their schedules ── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const usersRes = await fetch(`${API_BASE}/users?role=Doctor`, { headers: authHeaders() });
      if (!usersRes.ok) throw new Error(`Failed to fetch doctors (${usersRes.status})`);
      const json = await usersRes.json();
      const users = Array.isArray(json) ? json : (json.data ?? Object.values(json));
      const doctorUsers = users.filter(u => u.role === 'Doctor' && u.status === 'Active');

      const scheduleResults = await Promise.allSettled(
        doctorUsers.map(u =>
          fetch(`${API_BASE}/doctor-schedules?user_id=${u.user_id}`, { headers: authHeaders() })
            .then(r => r.ok ? r.json() : {})
        )
      );

      const enriched = doctorUsers.map((u, i) => {
        const scheduleMap = scheduleResults[i].status === 'fulfilled'
          ? (scheduleResults[i].value ?? {})
          : {};
        const schedule = buildScheduleRows(scheduleMap);
        const status   = deriveStatus(scheduleMap);
        const fullName = `Dr. ${u.first_name} ${u.last_name}`;
        return {
          id:             `DR-${String(u.user_id).padStart(5, '0')}`,
          userId:         u.user_id,
          name:           fullName,
          specialization: u.specialization ?? u.license_number ?? 'General Physician',
          department:     u.department ?? u.role,
          room:           u.room ?? '—',
          email:          u.email,
          contact:        u.contact_number ?? '—',
          status,
          schedule,
        };
      });

      setDoctors(enriched);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Derived state ── */
  const specializations = ['All', ...Array.from(new Set(doctors.map(d => d.specialization))).sort()];

  const filtered = doctors.filter(d => {
    const q = search.toLowerCase();
    const matchSearch =
      d.name.toLowerCase().includes(q) ||
      d.specialization.toLowerCase().includes(q) ||
      d.id.toLowerCase().includes(q);
    const matchSpec = specFilter === 'All' || d.specialization === specFilter;
    const matchStat = statFilter === 'All' || d.status === statFilter;
    return matchSearch && matchSpec && matchStat;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const dirty      = search || specFilter !== 'All' || statFilter !== 'All';
  const reset      = () => { setSearch(''); setSpecFilter('All'); setStatFilter('All'); setPage(1); };

  const availableCount   = doctors.filter(d => d.status === 'available').length;
  const fullyBookedCount = doctors.filter(d => d.status === 'fully-booked').length;
  const notAvailCount    = doctors.filter(d => d.status === 'not-available').length;

  /* ── Render ── */
  return (
    <MainLayout title="Doctors" subtitle="View doctor information and availability for scheduling appointments.">
      <div className="space-y-5">

        {/* ══ §1 DATE + REFRESH ROW (matches StaffAppointments) ══ */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            <span className="font-semibold text-gray-600">
              {new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* ══ Error Banner ══ */}
        {error && <ErrorBanner message={`Failed to load doctors: ${error}`} onRetry={fetchData} />}

        {/* ══ §2 KPI CARDS (matches StaffAppointments) ══ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Total Doctors"
            value={loading ? '…' : doctors.length}
            icon={Stethoscope}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <KPICard
            label="Available"
            value={loading ? '…' : availableCount}
            sub="with open slots"
            icon={CalendarCheck}
            iconBg="bg-green-50"
            iconColor="text-green-600"
          />
          <KPICard
            label="Fully Booked"
            value={loading ? '…' : fullyBookedCount}
            sub="no open slots"
            icon={BookOpen}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
          />
          <KPICard
            label="Unavailable"
            value={loading ? '…' : notAvailCount}
            sub="no schedule set"
            icon={UserX}
            iconBg="bg-gray-50"
            iconColor="text-gray-500"
          />
        </div>

        {/* ══ §3 SEARCH & FILTERS ══ */}
        <Card className="border border-gray-100 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 flex-wrap">

              {/* Search */}
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search by doctor name or specialization..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 placeholder:text-gray-300 transition-all"
                />
                {search && (
                  <button onClick={() => { setSearch(''); setPage(1); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-all">
                    <X className="w-3 h-3 text-gray-500" />
                  </button>
                )}
              </div>

              {/* Specialization dropdown */}
              <div className="relative">
                <select
                  value={specFilter}
                  onChange={e => { setSpecFilter(e.target.value); setPage(1); }}
                  className="appearance-none pl-3.5 pr-8 py-2.5 text-xs font-bold border border-gray-200 rounded-xl bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {specializations.map(s => (
                    <option key={s} value={s}>{s === 'All' ? 'All Specializations' : s}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>

              {/* Status filter pills */}
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { value: 'All',           label: 'All Status'    },
                  { value: 'available',     label: 'Available'     },
                  { value: 'fully-booked',  label: 'Fully Booked'  },
                  { value: 'not-available', label: 'Not Available' },
                ].map(opt => (
                  <button key={opt.value}
                    onClick={() => { setStatFilter(opt.value); setPage(1); }}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap
                      ${statFilter === opt.value
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>

              {dirty && (
                <button onClick={reset}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-gray-500 border border-gray-200 hover:bg-gray-50 transition-all">
                  <RefreshCw className="w-3.5 h-3.5" /> Reset
                </button>
              )}

              <div className="ml-auto text-xs text-gray-400 font-semibold whitespace-nowrap">
                {loading ? 'Loading…' : `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ══ §4 DOCTORS LIST TABLE ══ */}
        <Card className="border border-gray-100 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {[ 'Doctor Name', 'Specialization', 'Availability Status', 'Actions'].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap first:pl-5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={5} className="py-16 text-center">
                        <Loader2 className="w-8 h-8 text-blue-400 mx-auto mb-3 animate-spin" />
                        <p className="text-sm text-gray-400 font-medium">Loading doctors and schedules…</p>
                      </td>
                    </tr>
                  )}
                  {!loading && paginated.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-16 text-center">
                        <Stethoscope className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                        <p className="text-sm text-gray-400 font-medium">No doctors found</p>
                        <p className="text-xs text-gray-300 mt-1">Try adjusting your search or filters</p>
                      </td>
                    </tr>
                  )}
                  {!loading && paginated.map(d => {
                    const meta = STATUS_META[d.status];
                    return (
                      <tr key={d.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">

                  

                        {/* Name + avatar */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${avatarCls(d.name)}`}>
                              {initials(d.name)}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{d.name}</p>
                              <p className="text-xs text-gray-400">{d.room}</p>
                            </div>
                          </div>
                        </td>

                        {/* Specialization */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                            <Stethoscope className="w-3 h-3" />{d.specialization}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${meta.pill}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                            {meta.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => setViewDoctor(d)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                <p className="text-xs text-gray-400 font-semibold">
                  Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} doctors
                </p>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-200 disabled:opacity-30 transition-all text-xs font-bold">‹</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                    <button key={n} onClick={() => setPage(n)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all
                        ${page === n ? 'bg-blue-600 text-white shadow-sm' : 'border border-gray-200 text-gray-500 hover:bg-gray-200'}`}>
                      {n}
                    </button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-200 disabled:opacity-30 transition-all text-xs font-bold">›</button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Profile Modal */}
      {viewDoctor && (
        <ProfileModal
          doctor={viewDoctor}
          onClose={() => setViewDoctor(null)}
          onBook={d => setToast(`Booking appointment with ${d.name}…`)}
          onViewAvail={d => setToast(`Viewing full schedule for ${d.name}…`)}
        />
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </MainLayout>
  );
}