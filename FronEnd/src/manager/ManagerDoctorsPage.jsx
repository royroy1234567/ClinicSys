import React, { useEffect, useState, useCallback } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Search, Stethoscope, Users, UserCheck, Clock,
  Eye, X, RefreshCw, Loader2, Phone, Mail, Hash, CalendarDays,
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { api } from '../services/Api';

/* ══════════════ MOCK SCHEDULE ══════════════ */
const DEFAULT_SCHEDULE = [
  { day: 'Monday',    is_off: false, start: '09:00 AM', end: '05:00 PM' },
  { day: 'Tuesday',   is_off: false, start: '09:00 AM', end: '05:00 PM' },
  { day: 'Wednesday', is_off: false, start: '09:00 AM', end: '05:00 PM' },
  { day: 'Thursday',  is_off: true  },
  { day: 'Friday',    is_off: false, start: '10:00 AM', end: '04:00 PM' },
  { day: 'Saturday',  is_off: false, start: '08:00 AM', end: '12:00 PM' },
  { day: 'Sunday',    is_off: true  },
];

/* ══════════════ CONSTANTS ══════════════ */
const STATUS_CONFIG = {
  active:   { label: 'Active',   bg: 'bg-green-100',  color: 'text-green-700',  border: 'border-green-200'  },
  inactive: { label: 'Inactive', bg: 'bg-gray-100',   color: 'text-gray-500',   border: 'border-gray-200'   },
  on_leave: { label: 'On Leave', bg: 'bg-yellow-100', color: 'text-yellow-700', border: 'border-yellow-200' },
};

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

/* ══════════════ HELPERS ══════════════ */
const initials = (name) =>
  name?.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

/* ══════════════ SMALL COMPONENTS ══════════════ */
const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.inactive;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
};

const AvatarCircle = ({ name, size = 'md', status }) => {
  const sizes     = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base' };
  const dotColors = { active: 'bg-green-400', inactive: 'bg-gray-400', on_leave: 'bg-yellow-400' };
  return (
    <div className="relative inline-flex flex-shrink-0">
      <div className={`${sizes[size]} rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700`}>
        {initials(name)}
      </div>
      {status && (
        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${dotColors[status] ?? 'bg-gray-400'}`} />
      )}
    </div>
  );
};

/* ══════════════ KPI CARD ══════════════ */
const KPICard = ({ label, value, icon: Icon, iconBg, iconColor, loading }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{label}</p>
          {loading
            ? <div className="w-8 h-7 bg-gray-100 rounded animate-pulse mt-0.5" />
            : <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

/* ══════════════ VIEW PROFILE MODAL ══════════════ */
function ViewProfileModal({ doctor, onClose }) {
  const [activeTab, setActiveTab] = useState('info');

  const details = [
    { icon: Mail,  label: 'Email',          value: doctor.email          },
    { icon: Phone, label: 'Contact Number',  value: doctor.phone          },
    { icon: Hash,  label: 'License Number',  value: doctor.license_number },
  ].filter(row => row.value);

  const schedule = doctor.schedule?.length ? doctor.schedule : DEFAULT_SCHEDULE;

  const tabs = [
    { key: 'info',     label: 'Information', icon: Hash         },
    { key: 'schedule', label: 'Schedule',    icon: CalendarDays },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Doctor Profile</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Avatar + name */}
        <div className="flex items-center gap-4 px-6 pt-5 pb-4">
          <AvatarCircle name={doctor.name} size="lg" status={doctor.status} />
          <div>
            <p className="text-lg font-bold text-gray-900">{doctor.name}</p>
            <div className="mt-1.5"><StatusBadge status={doctor.status} /></div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6">
          {tabs.map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.key;
            return (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap
                  ${isActive ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                <Icon className="w-3.5 h-3.5" />{t.label}
              </button>
            );
          })}
        </div>

        {/* ── TAB: Information ── */}
        {activeTab === 'info' && (
          <div className="p-6 space-y-2.5">
            {details.length > 0 ? details.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="p-2 bg-white border border-gray-200 rounded-lg flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">{label}</p>
                  <p className="text-sm font-semibold text-gray-800">{value}</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-gray-400 text-center py-4">No additional information available.</p>
            )}
          </div>
        )}

        {/* ── TAB: Schedule ── */}
        {activeTab === 'schedule' && (
          <div className="p-6 space-y-2">
            <p className="text-xs text-gray-400 font-medium mb-3">
              Weekly availability set by the doctor.
            </p>
            {schedule.map((s, i) => (
              <div key={i}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all
                  ${s.is_off
                    ? 'bg-gray-50 border-gray-200 opacity-60'
                    : 'bg-blue-50 border-blue-200'}`}>
                <span className={`text-xs font-bold w-24 ${s.is_off ? 'text-gray-400' : 'text-blue-700'}`}>
                  {s.day}
                </span>
                {s.is_off
                  ? <span className="text-xs text-gray-400 font-medium">Day Off</span>
                  : (
                    <span className="text-xs font-semibold text-blue-600">
                      {s.start} – {s.end}
                    </span>
                  )}
              </div>
            ))}
          </div>
        )}

        <div className="px-6 pb-6 pt-2">
          <Button variant="outline" className="w-full" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════ MAIN PAGE ══════════════ */
export default function DoctorsPage() {
  const [doctors,      setDoctors]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewDoctor,   setViewDoctor]   = useState(null);

  const { toast } = useToast();

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.doctors.getAll();
      setDoctors(data);
    } catch (err) {
      toast({ title: 'Failed to load doctors', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

  /* ── Filtered ── */
  const filtered = doctors.filter(d => {
    const q = search.toLowerCase();
    const matchSearch = !search
      || d.name?.toLowerCase().includes(q)
      || d.email?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  /* ── KPIs ── */
  const total    = doctors.length;
  const active   = doctors.filter(d => d.status === 'active').length;
  const onLeave  = doctors.filter(d => d.status === 'on_leave').length;
  const inactive = doctors.filter(d => d.status === 'inactive').length;

  return (
    <MainLayout title="Doctors" subtitle="View clinic doctors and their information">
      <div className="space-y-5">

        {/* ── KPI CARDS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard label="Total Doctors" value={total}    icon={Stethoscope} iconBg="bg-blue-50"   iconColor="text-blue-600"   loading={loading} />
          <KPICard label="Active"        value={active}   icon={UserCheck}   iconBg="bg-green-50"  iconColor="text-green-600"  loading={loading} />
          <KPICard label="On Leave"      value={onLeave}  icon={Clock}       iconBg="bg-yellow-50" iconColor="text-yellow-600" loading={loading} />
          <KPICard label="Inactive"      value={inactive} icon={Users}       iconBg="bg-gray-50"   iconColor="text-gray-500"   loading={loading} />
        </div>

        {/* ── TABLE CARD ── */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-blue-600" /> Doctor Roster
              </CardTitle>
              <span className="text-xs text-gray-400">{doctors.length} doctor{doctors.length !== 1 ? 's' : ''}</span>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Filters */}
            <div className="px-6 pb-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="relative flex-1 min-w-[220px]">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Search</label>
                  <Search className="absolute left-3 bottom-2.5 w-4 h-4 text-gray-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Name or email…"
                    className={`${inputCls} pl-9`} />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Status</label>
                  <div className="flex items-center gap-1.5">
                    {[
                      { key: 'all',      label: 'All'      },
                      { key: 'active',   label: 'Active'   },
                      { key: 'on_leave', label: 'On Leave' },
                      { key: 'inactive', label: 'Inactive' },
                    ].map(s => (
                      <button key={s.key} onClick={() => setStatusFilter(s.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border
                          ${statusFilter === s.key
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1" />
                <Button variant="outline" size="sm" onClick={fetchDoctors} disabled={loading}>
                  {loading
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <RefreshCw className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-gray-100 bg-gray-50">
                    {['Name', 'License No.', 'Contact', 'Status', 'Action'].map(h => (
                      <th key={h} className="text-left py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">

                  {loading && Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="py-3 px-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                      </td>
                    ))}</tr>
                  ))}

                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-14">
                        <Stethoscope className="w-10 h-10 mx-auto text-gray-200 mb-2" />
                        <p className="text-sm font-medium text-gray-400">No doctors found</p>
                        <p className="text-xs text-gray-300 mt-1">Try adjusting your search or filter</p>
                      </td>
                    </tr>
                  )}

                  {!loading && filtered.map(doctor => (
                    <tr key={doctor.id}
                      className={`hover:bg-gray-50 transition-colors ${doctor.status === 'inactive' ? 'opacity-60' : ''}`}>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <AvatarCircle name={doctor.name} status={doctor.status} />
                          <div>
                            <p className="font-semibold text-gray-900 leading-tight">{doctor.name}</p>
                            <p className="text-xs text-gray-400">{doctor.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-xs text-gray-500">{doctor.license_number || '—'}</td>
                      <td className="py-3 px-4 text-xs text-gray-500">{doctor.phone || '—'}</td>
                      <td className="py-3 px-4"><StatusBadge status={doctor.status} /></td>

                      <td className="py-3 px-4">
                        <Button size="sm" variant="outline"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
                          onClick={() => setViewDoctor(doctor)}>
                          <Eye className="w-3 h-3" /> View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!loading && filtered.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/60 rounded-b-xl">
                <p className="text-xs text-gray-400">
                  Showing <span className="font-semibold text-gray-600">{filtered.length}</span> of{' '}
                  <span className="font-semibold text-gray-600">{total}</span> doctors
                </p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {viewDoctor && (
        <ViewProfileModal
          doctor={viewDoctor}
          onClose={() => setViewDoctor(null)}
        />
      )}
    </MainLayout>
  );
}