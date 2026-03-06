import React, { useState } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { Card, CardContent } from '../components/ui/card';
import {
  Stethoscope, Search, Eye, User,
  Phone, X, Check, Shield,
  Hash, RefreshCw, Mail,
  Calendar, Clock, Building2,
  UserCheck, MapPin, ChevronDown,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════
   DEMO DOCTORS
═══════════════════════════════════════════════════ */
const DOCTORS = [
  {
    id: 'DR-00001', name: 'Dr. Maria Santos',
    specialization: 'General Physician',
    department: 'General Medicine', room: 'Room 101',
    email: 'm.santos@clinic.com', contact: '+63 917 100 0001',
    status: 'available',
    schedule: [
      { date: 'May 12', slot: '9:00 AM – 12:00 PM', status: 'available'    },
      { date: 'May 12', slot: '1:00 PM – 4:00 PM',  status: 'available'    },
      { date: 'May 13', slot: '9:00 AM – 12:00 PM', status: 'fully-booked' },
      { date: 'May 13', slot: '1:00 PM – 4:00 PM',  status: 'available'    },
    ],
  },
  {
    id: 'DR-00002', name: 'Dr. Jose Reyes',
    specialization: 'Cardiologist',
    department: 'Cardiology', room: 'Room 205',
    email: 'j.reyes@clinic.com', contact: '+63 918 200 0002',
    status: 'available',
    schedule: [
      { date: 'May 12', slot: '8:00 AM – 11:00 AM', status: 'available'     },
      { date: 'May 12', slot: '2:00 PM – 5:00 PM',  status: 'not-available' },
      { date: 'May 14', slot: '9:00 AM – 12:00 PM', status: 'available'     },
    ],
  },
  {
    id: 'DR-00003', name: 'Dr. Ana Dela Cruz',
    specialization: 'Pediatrician',
    department: 'Pediatrics', room: 'Room 103',
    email: 'a.delacruz@clinic.com', contact: '+63 919 300 0003',
    status: 'fully-booked',
    schedule: [
      { date: 'May 12', slot: '9:00 AM – 12:00 PM', status: 'fully-booked' },
      { date: 'May 12', slot: '1:00 PM – 4:00 PM',  status: 'fully-booked' },
      { date: 'May 13', slot: '9:00 AM – 12:00 PM', status: 'available'    },
    ],
  },
  {
    id: 'DR-00004', name: 'Dr. Ramon Lim',
    specialization: 'Dermatologist',
    department: 'Dermatology', room: 'Room 302',
    email: 'r.lim@clinic.com', contact: '+63 920 400 0004',
    status: 'available',
    schedule: [
      { date: 'May 13', slot: '10:00 AM – 1:00 PM', status: 'available' },
      { date: 'May 15', slot: '9:00 AM – 12:00 PM', status: 'available' },
      { date: 'May 15', slot: '2:00 PM – 5:00 PM',  status: 'available' },
    ],
  },
  {
    id: 'DR-00005', name: 'Dr. Sofia Tan',
    specialization: 'Neurologist',
    department: 'Neurology', room: 'Room 410',
    email: 's.tan@clinic.com', contact: '+63 921 500 0005',
    status: 'not-available',
    schedule: [
      { date: 'May 12', slot: '9:00 AM – 12:00 PM', status: 'not-available' },
      { date: 'May 15', slot: '9:00 AM – 12:00 PM', status: 'available'     },
    ],
  },
  {
    id: 'DR-00006', name: 'Dr. Carlo Mendoza',
    specialization: 'Orthopedic Surgeon',
    department: 'Orthopedics', room: 'Room 501',
    email: 'c.mendoza@clinic.com', contact: '+63 922 600 0006',
    status: 'available',
    schedule: [
      { date: 'May 12', slot: '8:00 AM – 12:00 PM', status: 'available'    },
      { date: 'May 14', slot: '1:00 PM – 5:00 PM',  status: 'available'    },
      { date: 'May 15', slot: '8:00 AM – 12:00 PM', status: 'fully-booked' },
    ],
  },
  {
    id: 'DR-00007', name: 'Dr. Liza Flores',
    specialization: 'OB-GYN',
    department: 'Obstetrics & Gynecology', room: 'Room 208',
    email: 'l.flores@clinic.com', contact: '+63 923 700 0007',
    status: 'available',
    schedule: [
      { date: 'May 13', slot: '9:00 AM – 12:00 PM', status: 'available'    },
      { date: 'May 13', slot: '2:00 PM – 5:00 PM',  status: 'fully-booked' },
      { date: 'May 15', slot: '9:00 AM – 12:00 PM', status: 'available'    },
    ],
  },
  {
    id: 'DR-00008', name: 'Dr. Mark Aquino',
    specialization: 'Ophthalmologist',
    department: 'Ophthalmology', room: 'Room 115',
    email: 'm.aquino@clinic.com', contact: '+63 924 800 0008',
    status: 'fully-booked',
    schedule: [
      { date: 'May 12', slot: '9:00 AM – 12:00 PM', status: 'fully-booked' },
      { date: 'May 14', slot: '9:00 AM – 12:00 PM', status: 'available'    },
    ],
  },
];

const SPECIALIZATIONS = ['All', ...Array.from(new Set(DOCTORS.map(d => d.specialization))).sort()];

/* ═══════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════ */
const AVATAR_POOL = [
  'bg-blue-100 text-blue-700',    'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700','bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700',  'bg-teal-100 text-teal-700',
  'bg-cyan-100 text-cyan-700',    'bg-indigo-100 text-indigo-700',
];
const avatarCls = n => AVATAR_POOL[n.charCodeAt(4) % AVATAR_POOL.length];
const initials  = n => n.replace('Dr. ', '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

const STATUS_META = {
  'available':     { label: 'Available',     dot: 'bg-green-500', pill: 'bg-green-50 text-green-700'  },
  'fully-booked':  { label: 'Fully Booked',  dot: 'bg-amber-500', pill: 'bg-amber-50 text-amber-700'  },
  'not-available': { label: 'Not Available', dot: 'bg-gray-400',  pill: 'bg-gray-100 text-gray-500'   },
};

/* ── Schedule Badge ── */
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
  React.useEffect(() => {
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

/* ═══════════════════════════════════════════════════
   PROFILE MODAL  — §4 Profile + §5 Schedule + §6 Quick Actions
═══════════════════════════════════════════════════ */
function ProfileModal({ doctor, onClose, onBook, onViewAvail, onWalkin }) {
  const meta = STATUS_META[doctor.status];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
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
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">

          {/* §4 Basic Information */}
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
                  <p className="text-sm font-bold text-gray-800 break-all">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* §4 Professional Information */}
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
                    <p className="text-sm font-semibold text-gray-800">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* §5 Availability / Schedule */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Calendar className="w-3 h-3" /> Availability / Schedule
            </p>
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Date', 'Time Slot', 'Status'].map(h => (
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
                      <td className="py-2.5 px-3"><SlotBadge status={s.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Read-only notice */}
          <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
            <Shield className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p><strong>Read-only access.</strong> Doctor profiles and schedules can only be modified by administrators.</p>
          </div>

          {/* §6 Quick Actions */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Hash className="w-3 h-3" /> Quick Actions
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => { onBook(doctor); onClose(); }}
                className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm"
              >
                <Calendar className="w-4 h-4" />
                Book Appointment
              </button>
              <button
                onClick={() => { onViewAvail(doctor); }}
                className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl border-2 border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-bold transition-all"
              >
                <Eye className="w-4 h-4" />
                View Schedule
              </button>
              <button
                onClick={() => { onWalkin(doctor); onClose(); }}
                className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold transition-all"
              >
                <UserCheck className="w-4 h-4" />
                Assign Walk-in
              </button>
            </div>
          </div>

          {/* Close */}
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
  const [search,     setSearch]     = useState('');
  const [specFilter, setSpecFilter] = useState('All');
  const [statFilter, setStatFilter] = useState('All');
  const [viewDoctor, setViewDoctor] = useState(null);
  const [toast,      setToast]      = useState(null);
  const [page,       setPage]       = useState(1);
  const PER_PAGE = 8;

  const filtered = DOCTORS.filter(d => {
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

  const availableCount   = DOCTORS.filter(d => d.status === 'available').length;
  const fullyBookedCount = DOCTORS.filter(d => d.status === 'fully-booked').length;
  const notAvailCount    = DOCTORS.filter(d => d.status === 'not-available').length;

  return (
    <MainLayout title="Doctors" subtitle="View doctor information and availability for scheduling appointments.">
      <div className="space-y-5">

        {/* ══ §1 HEADER ══ */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-44 h-44 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute bottom-0 right-32 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />
          <div className="relative flex items-start justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-black">Doctors</h2>
              <p className="text-blue-200 text-sm mt-1 max-w-md">
                View doctor information and availability for scheduling appointments.
              </p>
            </div>
            <div className="flex items-center gap-5">
              {[
                { label: 'Total Doctors', value: DOCTORS.length    },
                { label: 'Available',     value: availableCount    },
                { label: 'Fully Booked',  value: fullyBookedCount  },
                { label: 'Unavailable',   value: notAvailCount     },
              ].map((s, i) => (
                <React.Fragment key={s.label}>
                  {i > 0 && <div className="w-px h-8 bg-white/20" />}
                  <div className="text-right">
                    <p className="text-blue-300 text-[10px] font-bold uppercase tracking-wide">{s.label}</p>
                    <p className="text-2xl font-black">{s.value}</p>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
          <div className="relative flex items-center gap-2 mt-4 pt-4 border-t border-white/10 text-xs text-blue-200 font-semibold">
            <Shield className="w-3.5 h-3.5 text-blue-300 flex-shrink-0" />
            Staff access: View doctor profiles and schedules only. Editing is restricted to administrators.
          </div>
        </div>

        {/* ══ §2 SEARCH & FILTERS ══ */}
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
                  {SPECIALIZATIONS.map(s => (
                    <option key={s} value={s}>{s === 'All' ? 'All Specializations' : s}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>

              {/* Availability status pills */}
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
                {filtered.length} result{filtered.length !== 1 ? 's' : ''}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ══ §3 DOCTORS LIST TABLE ══ */}
        <Card className="border border-gray-100 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Doctor ID', 'Doctor Name', 'Specialization', 'Availability Status', 'Actions'].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap first:pl-5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-16 text-center">
                        <Stethoscope className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                        <p className="text-sm text-gray-400 font-medium">No doctors found</p>
                        <p className="text-xs text-gray-300 mt-1">Try adjusting your search or filters</p>
                      </td>
                    </tr>
                  )}
                  {paginated.map(d => {
                    const meta = STATUS_META[d.status];
                    return (
                      <tr key={d.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">

                        {/* Doctor ID */}
                        <td className="py-3.5 px-4 pl-5">
                          <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{d.id}</span>
                        </td>

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

                        {/* Availability Status */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${meta.pill}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                            {meta.label}
                          </span>
                        </td>

                        {/* Actions — single View button per spec */}
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
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 font-semibold">
                  Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} doctors
                </p>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-all text-xs font-bold">‹</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                    <button key={n} onClick={() => setPage(n)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all
                        ${page === n ? 'bg-blue-600 text-white shadow-sm' : 'border border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                      {n}
                    </button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-all text-xs font-bold">›</button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Staff permissions reminder */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-100 rounded-2xl text-xs text-green-700">
            <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-green-800 mb-1">Staff Can</p>
              <p>View doctor profiles · View doctor availability · Use schedule for booking appointments</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-xs text-red-700">
            <Shield className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-800 mb-1">Restricted Access</p>
              <p>Add doctors · Edit doctor profiles · Change doctor schedules · Delete doctors</p>
            </div>
          </div>
        </div>

      </div>

      {/* Profile Modal — §4 + §5 + §6 */}
      {viewDoctor && (
        <ProfileModal
          doctor={viewDoctor}
          onClose={() => setViewDoctor(null)}
          onBook={d => setToast(`Booking appointment with ${d.name}…`)}
          onViewAvail={d => setToast(`Viewing full schedule for ${d.name}…`)}
          onWalkin={d => setToast(`Assigning walk-in patient to ${d.name}…`)}
        />
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </MainLayout>
  );
}