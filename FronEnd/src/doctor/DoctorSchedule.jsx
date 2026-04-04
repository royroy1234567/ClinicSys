import React, { useState, useMemo, useEffect, useCallback } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  ChevronLeft, ChevronRight, Calendar, Clock, Phone,
  CheckCircle2, XCircle, Plus, Edit, X, Check,
  CalendarDays, LayoutGrid, CalendarRange, Stethoscope,
  RefreshCw, ChevronDown, Coffee, PlayCircle, CheckSquare,
  ClipboardList, Search, FileText, Loader2, AlertCircle,
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

/* ═══════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════ */
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DAYS_FULL  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS     = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700', 'bg-teal-100 text-teal-700',
  'bg-violet-100 text-violet-700', 'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700', 'bg-emerald-100 text-emerald-700',
];

/* ═══════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════ */
const padZ         = (n) => String(n).padStart(2,'0');
const fmtD         = (d) => `${d.getFullYear()}-${padZ(d.getMonth()+1)}-${padZ(d.getDate())}`;
const TODAY        = fmtD(new Date());
const fmtTime      = (t) => { if (!t) return ''; const [h,m]=t.split(':'); const hr=parseInt(h); return `${hr>12?hr-12:hr||12}:${m} ${hr>=12?'PM':'AM'}`; };
const fmtDateShort = (d) => `${MONTHS[d.getMonth()].slice(0,3)} ${d.getDate()}`;
const fmtDateFull  = (d) => `${DAYS_FULL[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
const isToday      = (d) => fmtD(d) === TODAY;
const initials     = (name) => name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || '?';
const avatarCls    = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const getWeekDates = (offset=0) => {
  const base = new Date();
  base.setDate(base.getDate() - base.getDay() + 1 + offset*7); // Monday-start
  return Array.from({length:7},(_,i)=>{ const d=new Date(base); d.setDate(base.getDate()+i); return d; });
};

// Build time slots from schedule slots data
const buildTimeSlotsFromSchedule = (slots) => {
  if (!slots || !slots.length) return [];
  const times = [];
  slots.forEach(slot => {
    const [sh, sm] = slot.start.split(':').map(Number);
    const [eh, em] = slot.end.split(':').map(Number);
    let cur = sh * 60 + sm;
    const end = eh * 60 + em;
    while (cur < end) {
      times.push(`${padZ(Math.floor(cur/60))}:${padZ(cur%60)}`);
      cur += slot.duration;
    }
  });
  return [...new Set(times)].sort();
};

const isBreakTime = (time, slots) => {
  if (!slots || !slots.length) return false;
  const [h, m] = time.split(':').map(Number);
  const mins = h * 60 + m;
  // Check if this time falls outside all slots (gap between slots = break)
  return !slots.some(slot => {
    const [sh, sm] = slot.start.split(':').map(Number);
    const [eh, em] = slot.end.split(':').map(Number);
    return mins >= sh*60+sm && mins < eh*60+em;
  });
};

/* ═══════════════════════════════════════════════════
   API LAYER
═══════════════════════════════════════════════════ */
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://backend1.test/api';

const apiFetch = async (url, options = {}) => {
  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
};

// Fetch today's queue entries (acts as today's schedule)
const fetchTodayQueue = (date) => apiFetch(`/queue-entries?date=${date}`);

// Fetch doctor schedule (calendar view) for a doctor
const fetchDoctorSchedules = (doctorId) => apiFetch(`/doctor-schedules?user_id=${doctorId}`);

// Fetch all appointments (for calendar overlay and recent consults)
const fetchAppointments = () => apiFetch('/appointments');

// Fetch consultation by queue entry id
const fetchConsultation = (queueEntryId) => apiFetch(`/consultations/queue/${queueEntryId}`);

// Update queue status (start/complete)
const updateQueueStatus = (id, status) =>
  apiFetch(`/queue-entries/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

// Fetch doctor availability status
const fetchDoctorAvailability = (doctorId) =>
  apiFetch(`/users/${doctorId}/availability`);

// Update doctor availability — API only accepts 'available' | 'unavailable'
const updateDoctorAvailability = (doctorId, availability_status) =>
  apiFetch(`/users/${doctorId}/availability`, {
    method: 'PATCH',
    body: JSON.stringify({ availability_status }),
  });

/* ═══════════════════════════════════════════════════
   BADGE / STYLE CONFIGS
═══════════════════════════════════════════════════ */
// API accepts only 'available' | 'unavailable' — map UI labels accordingly
const DOC_STATUS = {
  available:  { label:'Available',   bg:'bg-emerald-100', text:'text-emerald-700', dot:'bg-emerald-500' },
  unavailable:{ label:'Unavailable', bg:'bg-gray-100',    text:'text-gray-500',    dot:'bg-gray-400'    },
};
const APT_STATUS = {
  scheduled:{ label:'Scheduled', bg:'bg-blue-50',   text:'text-blue-700',   border:'border-blue-200'   },
  ongoing:  { label:'Ongoing',   bg:'bg-yellow-50', text:'text-yellow-700', border:'border-yellow-300' },
  completed:{ label:'Done', bg:'bg-green-50',  text:'text-green-700',  border:'border-green-200'  },
  cancelled:{ label:'Cancelled', bg:'bg-red-50',    text:'text-red-600',    border:'border-red-200'    },
  waiting:  { label:'Waiting',   bg:'bg-blue-50',   text:'text-blue-700',   border:'border-blue-200'   },
  called:   { label:'Called',    bg:'bg-purple-50', text:'text-purple-700', border:'border-purple-200' },
  no_show:  { label:'No Show',   bg:'bg-gray-50',   text:'text-gray-500',   border:'border-gray-200'   },
};
const STATUS_MAP = {
  waiting:  { label:'Waiting',   dotColor:'bg-blue-400',   textColor:'text-blue-700',   bgColor:'bg-blue-50'   },
  called:   { label:'Called',    dotColor:'bg-purple-500', textColor:'text-purple-700', bgColor:'bg-purple-50' },
  ongoing:  { label:'Ongoing',   dotColor:'bg-yellow-500', textColor:'text-yellow-700', bgColor:'bg-yellow-50' },
  completed:{ label:'Completed', dotColor:'bg-green-500',  textColor:'text-green-700',  bgColor:'bg-green-50'  },
  no_show:  { label:'No Show',   dotColor:'bg-gray-400',   textColor:'text-gray-500',   bgColor:'bg-gray-50'   },
  scheduled:{ label:'Scheduled', dotColor:'bg-blue-400',   textColor:'text-blue-700',   bgColor:'bg-blue-50'   },
  cancelled:{ label:'Cancelled', dotColor:'bg-red-400',    textColor:'text-red-600',    bgColor:'bg-red-50'    },
};

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800";

const StatusPill = ({ status }) => {
  const s = STATUS_MAP[status] || STATUS_MAP.waiting;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${s.bgColor} ${s.textColor}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dotColor} ${status==='ongoing'?'animate-pulse':''}`}/>
      {s.label}
    </span>
  );
};

/* ═══════════════════════════════════════════════════
   MODALS
═══════════════════════════════════════════════════ */
function AptModal({ apt, onClose }) {
  if (!apt) return null;
  const status = apt.status || 'waiting';
  const s = APT_STATUS[status] || APT_STATUS.waiting;
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${s.bg} ${s.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status==='ongoing'?'bg-yellow-500 animate-pulse':'bg-current opacity-60'}`}/>
            {s.label}
          </span>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4 text-gray-400"/></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black flex-shrink-0 ${avatarCls(apt.patient_name || apt.patient)}`}>
              {initials(apt.patient_name || apt.patient)}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-base">{apt.patient_name || apt.patient}</p>
              <p className="text-xs text-gray-400">{apt.patient_age || apt.age} y/o · {apt.priority || apt.type}</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
            {[
              [Clock,  'Time',    fmtTime(apt.arrival_time || apt.slotTime)],
              [Calendar,'Date',   apt.queue_date || apt.slotDate],
              [Phone,  'Contact', apt.patient_contact || apt.contact],
              ['#',   'Queue',   `Queue #${apt.queue_number || apt.queue}`],
            ].map(([Icon,label,val])=>(
              <div key={label} className="flex items-center gap-2.5 text-sm">
                <div className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                  {typeof Icon==='string'
                    ?<span className="text-[10px] font-black text-gray-400">{Icon}</span>
                    :<Icon className="w-3.5 h-3.5 text-gray-400"/>}
                </div>
                <span className="text-gray-400 text-xs font-semibold w-14">{label}</span>
                {label==='Contact'
                  ?<a href={`tel:${val}`} className="text-blue-500 hover:text-blue-700 font-semibold text-xs">{val}</a>
                  :<span className="font-semibold text-gray-800 text-xs">{val}</span>}
              </div>
            ))}
          </div>
          {apt.reason && (
            <div className="bg-blue-50 rounded-xl p-3">
              <p className="text-xs font-bold text-blue-600 mb-1">Reason for Visit</p>
              <p className="text-xs text-gray-600">{apt.reason}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   LOADING / ERROR STATES
═══════════════════════════════════════════════════ */
const LoadingSpinner = ({ message = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3">
    <Loader2 className="w-8 h-8 text-blue-500 animate-spin"/>
    <p className="text-sm text-gray-400 font-medium">{message}</p>
  </div>
);

const ErrorState = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3">
    <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
      <AlertCircle className="w-6 h-6 text-red-400"/>
    </div>
    <p className="text-sm text-gray-500 font-medium">{message}</p>
    {onRetry && (
      <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5 text-xs">
        <RefreshCw className="w-3.5 h-3.5"/> Retry
      </Button>
    )}
  </div>
);

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */
export default function DoctorSchedulePage() {
  // ── Auth / doctor context ──────────────────────────
  // Fetched from GET /api/user using the stored auth_token
  const [authUser, setAuthUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    fetch(`${API_BASE}/auth/me`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.user) setAuthUser(data.user); })
      .catch(() => {});
  }, []);

  const DOCTOR = useMemo(() => ({
    id:        authUser?.user_id || null,
    name:      authUser ? `Dr. ${authUser.first_name} ${authUser.last_name}` : 'Dr. —',
    specialty: authUser?.specialization || authUser?.role || 'General Medicine',
    license:   authUser?.license_number || '—',
    initials:  authUser
      ? `${(authUser.first_name||'')[0]||''}${(authUser.last_name||'')[0]||''}`.toUpperCase()
      : '??',
  }), [authUser]);

  // ── UI state ──────────────────────────────────────
  const [weekOffset,  setWeekOffset]  = useState(0);
  const [viewMode,    setViewMode]    = useState('weekly');
  const [selDay,      setSelDay]      = useState(new Date());
  const [docStatus,      setDocStatus]      = useState('available');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [popup,       setPopup]       = useState(null);
  const [statusOpen,  setStatusOpen]  = useState(false);
  const [scheduleTab, setScheduleTab] = useState('today');
  const [search,      setSearch]      = useState('');

  // ── Data state ────────────────────────────────────
  const [queueEntries,     setQueueEntries]     = useState([]);
  const [queueLoading,     setQueueLoading]     = useState(true);
  const [queueError,       setQueueError]       = useState(null);

  const [doctorSchedules,  setDoctorSchedules]  = useState({}); // { 'YYYY-MM-DD': { slots: [...] } }
  const [schedLoading,     setSchedLoading]     = useState(true);
  const [schedError,       setSchedError]       = useState(null);

  const [appointments,     setAppointments]     = useState([]);
  const [aptsLoading,      setAptsLoading]      = useState(true);

  const [actionLoading,    setActionLoading]    = useState({}); // { [queueEntryId]: true }

  const { toast } = useToast();

  const weekDates = getWeekDates(weekOffset);
  const weekLabel = `${fmtDateShort(weekDates[0])} - ${fmtDateShort(weekDates[6])}, ${weekDates[6].getFullYear()}`;
  const statusCfg = DOC_STATUS[docStatus] || DOC_STATUS.unavailable;

  // ── Fetch today's queue ───────────────────────────
  const loadTodayQueue = useCallback(async () => {
    setQueueLoading(true);
    setQueueError(null);
    try {
      const data = await fetchTodayQueue(TODAY);
      setQueueEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      setQueueError(err.message);
    } finally {
      setQueueLoading(false);
    }
  }, []);

  // ── Fetch doctor schedules (calendar) ────────────
  const loadDoctorSchedules = useCallback(async () => {
    if (!DOCTOR.id) { setSchedLoading(false); return; }
    setSchedLoading(true);
    setSchedError(null);
    try {
      const data = await fetchDoctorSchedules(DOCTOR.id);
      // data is { 'YYYY-MM-DD': { repeat, repeatWeeks, slots: [...] } }
      setDoctorSchedules(data || {});
    } catch (err) {
      setSchedError(err.message);
    } finally {
      setSchedLoading(false);
    }
  }, [DOCTOR.id]);

  // ── Fetch appointments (for calendar overlays + recent) ──
  const loadAppointments = useCallback(async () => {
    setAptsLoading(true);
    try {
      const data = await fetchAppointments();
      setAppointments(Array.isArray(data) ? data : []);
    } catch {
      // non-critical — swallow error
    } finally {
      setAptsLoading(false);
    }
  }, []);

  useEffect(() => { loadTodayQueue(); }, [loadTodayQueue]);
  useEffect(() => { loadDoctorSchedules(); }, [loadDoctorSchedules]);
  useEffect(() => { loadAppointments(); }, [loadAppointments]);

  // Sync availability from API on mount
  useEffect(() => {
    if (!DOCTOR.id) return;
    fetchDoctorAvailability(DOCTOR.id)
      .then(data => setDocStatus(data.availability_status || 'unavailable'))
      .catch(() => {}); // non-critical
  }, [DOCTOR.id]);

  // ── Derived data ──────────────────────────────────
  const todayTotal   = queueEntries.length;
  const completedN   = queueEntries.filter(q => q.status === 'completed').length;
  const ongoingEntry = queueEntries.find(q => q.status === 'ongoing');

  const visibleToday = useMemo(() =>
    search
      ? queueEntries.filter(q => (q.patient_name || '').toLowerCase().includes(search.toLowerCase()))
      : queueEntries,
  [queueEntries, search]);

  // Build appointment map for calendar: { 'YYYY-MM-DD_HH:MM': appointment }
  const aptCalMap = useMemo(() => {
    const map = {};
    appointments.forEach(apt => {
      if (!apt.appointment_date || !apt.appointment_time) return;
      const key = `${apt.appointment_date}_${apt.appointment_time.slice(0,5)}`;
      map[key] = apt;
    });
    return map;
  }, [appointments]);

  // Recent consultations = last 5 completed appointments
  const recentConsults = useMemo(() =>
    appointments
      .filter(a => a.status === 'completed')
      .slice(0, 5),
  [appointments]);

  // ── Actions ───────────────────────────────────────
  const setEntryLoading = (id, val) =>
    setActionLoading(prev => ({ ...prev, [id]: val }));

  const startConsult = async (entry) => {
    setEntryLoading(entry.queue_entry_id, true);
    try {
      await updateQueueStatus(entry.queue_entry_id, 'ongoing');
      // Mark any previous ongoing as completed
      setQueueEntries(prev => prev.map(q => {
        if (q.queue_entry_id === entry.queue_entry_id) return { ...q, status: 'ongoing' };
        if (q.status === 'ongoing') return { ...q, status: 'completed' };
        return q;
      }));
      if (entry.appointment_id) {
        setAppointments((prev) => prev.map((apt) => (
          apt.appointment_id === entry.appointment_id
            ? { ...apt, status: 'ongoing' }
            : apt
        )));
      }
      toast({ title: 'Consultation started', description: `Now seeing ${entry.patient_name}` });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setEntryLoading(entry.queue_entry_id, false);
    }
  };

  const completeConsult = async (entry) => {
    setEntryLoading(entry.queue_entry_id, true);
    try {
      await updateQueueStatus(entry.queue_entry_id, 'completed');
      setQueueEntries(prev => prev.map(q =>
        q.queue_entry_id === entry.queue_entry_id ? { ...q, status: 'completed' } : q
      ));
      if (entry.appointment_id) {
        setAppointments((prev) => prev.map((apt) => (
          apt.appointment_id === entry.appointment_id
            ? { ...apt, status: 'completed' }
            : apt
        )));
      }
      toast({ title: 'Consultation complete', description: `${entry.patient_name} marked as done` });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setEntryLoading(entry.queue_entry_id, false);
    }
  };

  // ── Calendar helpers ──────────────────────────────
  const getScheduleForDate = (date) => {
    const ds = fmtD(date);
    return doctorSchedules[ds] || null;
  };

  const isWorkDay = (date) => {
    const sched = getScheduleForDate(date);
    return !!sched && sched.slots && sched.slots.length > 0;
  };

  const getTimeSlotsForDate = (date) => {
    const sched = getScheduleForDate(date);
    if (!sched) return [];
    return buildTimeSlotsFromSchedule(sched.slots);
  };

  const aptForDateTime = (date, time) => {
    const key = `${fmtD(date)}_${time}`;
    return aptCalMap[key] || null;
  };

  const slotStyle = (date, time) => {
    const sched = getScheduleForDate(date);
    if (!sched) return 'off';
    if (isBreakTime(time, sched.slots)) return 'break';
    const apt = aptForDateTime(date, time);
    if (!apt) return 'free';
    if (apt.status === 'completed') return 'completed';
    if (apt.status === 'ongoing')   return 'ongoing';
    return 'booked';
  };

  const SLOT_STYLE = {
    off:      'bg-gray-100 border-gray-100',
    break:    'bg-slate-100 border-slate-100',
    free:     'bg-emerald-50 border-emerald-100 hover:bg-emerald-100 cursor-pointer group',
    booked:   'bg-blue-100 border-blue-200 cursor-pointer hover:bg-blue-200',
    ongoing:  'bg-yellow-100 border-yellow-300 cursor-pointer',
    completed:'bg-green-100 border-green-200 cursor-pointer',
  };

  // All unique time slots across the week for the grid
  const weekTimeSlots = useMemo(() => {
    const all = new Set();
    weekDates.forEach(d => getTimeSlotsForDate(d).forEach(t => all.add(t)));
    return [...all].sort();
  }, [weekDates, doctorSchedules]);

  // ── Weekly Grid ───────────────────────────────────
  const WeeklyGrid = () => {
    if (schedLoading) return <LoadingSpinner message="Loading calendar..."/>;
    if (schedError)   return <ErrorState message={schedError} onRetry={loadDoctorSchedules}/>;
    if (!weekTimeSlots.length) return (
      <div className="text-center py-14">
        <CalendarRange className="w-10 h-10 mx-auto text-gray-200 mb-3"/>
        <p className="font-bold text-gray-400">No schedule set for this week</p>
        <p className="text-xs text-gray-300 mt-1">Configure your schedule in the schedule settings</p>
      </div>
    );
    return (
      <div>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <div>
            <p className="text-sm font-bold text-gray-900">Weekly Calendar</p>
            <p className="text-xs text-gray-400 mt-0.5">{weekLabel}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="hidden lg:flex items-center gap-3 mr-2">
              {[{c:'bg-emerald-200',l:'Free'},{c:'bg-blue-300',l:'Booked'},{c:'bg-yellow-300',l:'Ongoing'},{c:'bg-green-300',l:'Done'},{c:'bg-gray-200',l:'Off'}].map(x=>(
                <span key={x.l} className="flex items-center gap-1 text-xs text-gray-400">
                  <span className={`w-2.5 h-2.5 rounded ${x.c}`}/>{x.l}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={()=>setWeekOffset(w=>w-1)} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                <ChevronLeft className="w-4 h-4 text-gray-500"/>
              </button>
              <button onClick={()=>setWeekOffset(0)} className="px-3 h-8 text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">Today</button>
              <button onClick={()=>setWeekOffset(w=>w+1)} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                <ChevronRight className="w-4 h-4 text-gray-500"/>
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{minWidth:680}}>
            <thead>
              <tr>
                <th className="w-14 bg-gray-50 border-b border-gray-100"/>
                {weekDates.map((d,i)=>{
                  const today=isToday(d); const work=isWorkDay(d);
                  return (
                    <th key={i} className={`border-b border-gray-100 py-3 px-1 text-center min-w-[88px] ${today?'bg-blue-50':'bg-gray-50'}`}>
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${today?'text-blue-500':work?'text-gray-400':'text-gray-300'}`}>{DAYS_SHORT[d.getDay()]}</p>
                      <p className={`text-lg font-black mt-0.5 leading-none ${today?'text-blue-600':work?'text-gray-800':'text-gray-300'}`}>{d.getDate()}</p>
                      {today&&<div className="w-1.5 h-1.5 bg-blue-500 rounded-full mx-auto mt-1"/>}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {weekTimeSlots.map((time,ti)=>(
                <tr key={time} className={ti%2===0?'':'bg-gray-50/20'}>
                  <td className="py-0.5 pr-2 text-right align-middle">
                    {time.endsWith(':00')&&<span className="text-[10px] font-bold text-gray-300 whitespace-nowrap pl-2">{fmtTime(time)}</span>}
                  </td>
                  {weekDates.map((date,di)=>{
                    const type = slotStyle(date, time);
                    const apt  = aptForDateTime(date, time);
                    const today = isToday(date);
                    return (
                      <td key={di}
                        className={`py-0.5 px-0.5 border-l border-gray-100/80 ${today?'bg-blue-50/20':''}`}
                        onClick={()=>{ if (apt) setPopup({...apt, slotTime: time, slotDate: fmtD(date)}); }}>
                        <div className={`h-6 rounded border text-[10px] font-bold flex items-center px-1.5 transition-all select-none ${SLOT_STYLE[type]}`}>
                          {apt   && <span className="truncate leading-none">{(apt.patient_name||apt.doctor_name||'').split(' ')[0]}</span>}
                          {type==='break'   && <span className="text-slate-400 font-semibold truncate">Break</span>}
                          {type==='free'    && <span className="text-emerald-300 opacity-0 group-hover:opacity-100">+</span>}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ── Daily View ────────────────────────────────────
  const DailyView = () => {
    const daySlots   = getTimeSlotsForDate(selDay);
    const schedForDay = getScheduleForDate(selDay);

    if (schedLoading) return <LoadingSpinner message="Loading schedule..."/>;

    return (
      <div>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <div>
            <p className="text-sm font-bold text-gray-900">Daily View</p>
            <p className="text-xs text-gray-400 mt-0.5">{fmtDateFull(selDay)}</p>
          </div>
          <div className="flex gap-1 flex-wrap">
            {weekDates.map((d,i)=>{
              const today=isToday(d); const work=isWorkDay(d); const sel=fmtD(d)===fmtD(selDay);
              return (
                <button key={i} onClick={()=>setSelDay(d)}
                  className={`flex flex-col items-center px-3 py-2 rounded-xl text-xs transition-all
                    ${sel?'bg-blue-600 text-white shadow-sm shadow-blue-200':today?'bg-blue-50 text-blue-600 border border-blue-200':work?'text-gray-600 hover:bg-gray-100 border border-transparent':'text-gray-300 cursor-default'}`}>
                  <span className="font-bold">{DAYS_SHORT[d.getDay()]}</span>
                  <span className={`font-black text-sm leading-none mt-0.5 ${sel?'text-white':''}`}>{d.getDate()}</span>
                </button>
              );
            })}
          </div>
        </div>

        {!schedForDay || !daySlots.length ? (
          <div className="text-center py-14">
            <XCircle className="w-10 h-10 mx-auto text-gray-200 mb-3"/>
            <p className="font-bold text-gray-400">No Schedule</p>
            <p className="text-xs text-gray-300 mt-1">{DAYS_FULL[selDay.getDay()]} has no configured schedule</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {daySlots.map(time => {
              const apt = aptForDateTime(selDay, time);
              const brk = isBreakTime(time, schedForDay.slots);
              const showLabel = time.endsWith(':00');
              return (
                <div key={time} className="flex items-stretch gap-3 min-h-[40px]">
                  <div className="w-16 flex-shrink-0 flex items-center justify-end">
                    {showLabel && <span className="text-xs font-bold text-gray-300">{fmtTime(time)}</span>}
                  </div>
                  {brk ? (
                    <div className="flex-1 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center px-4 gap-2">
                      <Coffee className="w-3.5 h-3.5 text-slate-400"/>
                      <span className="text-xs text-slate-400 font-semibold">Break</span>
                    </div>
                  ) : apt ? (
                    <div onClick={()=>setPopup({...apt, slotTime: time, slotDate: fmtD(selDay)})}
                      className={`flex-1 h-14 rounded-xl border flex items-center px-4 gap-3 cursor-pointer hover:shadow-sm transition-all ${APT_STATUS[apt.status]?.bg || 'bg-blue-50'} ${APT_STATUS[apt.status]?.border || 'border-blue-200'}`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${avatarCls(apt.patient_name)}`}>
                        {initials(apt.patient_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold truncate ${APT_STATUS[apt.status]?.text || 'text-blue-700'}`}>{apt.patient_name}</p>
                        <p className="text-xs text-gray-400 truncate">{apt.service_name} · {apt.reason}</p>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full bg-white/70 ${APT_STATUS[apt.status]?.text || 'text-blue-700'}`}>
                        {APT_STATUS[apt.status]?.label || apt.status}
                      </span>
                    </div>
                  ) : (
                    <div className="flex-1 h-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center px-4 hover:bg-emerald-100 transition-colors cursor-pointer group">
                      <span className="text-xs text-emerald-400 font-semibold group-hover:text-emerald-600">Free slot</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ── Monthly View ──────────────────────────────────
  const MonthlyView = () => {
    const now=new Date(); const yr=now.getFullYear(); const mo=now.getMonth();
    const first=new Date(yr,mo,1); const last=new Date(yr,mo+1,0);
    // Monday-start
    const pad = (first.getDay()+6)%7;
    const cells = [];
    for(let i=0;i<pad;i++) cells.push(null);
    for(let d=1;d<=last.getDate();d++) cells.push(new Date(yr,mo,d));

    // Count appointments per date
    const countByDate = {};
    appointments.forEach(a => {
      const ds = a.appointment_date;
      if (ds) countByDate[ds] = (countByDate[ds] || 0) + 1;
    });

    return (
      <div>
        <p className="text-sm font-bold text-gray-900 mb-3">{MONTHS[mo]} {yr}</p>
        <div className="grid grid-cols-7 mb-2">
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>(
            <div key={d} className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider py-2">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((d,i)=>{
            if(!d) return <div key={`p${i}`}/>;
            const ds=fmtD(d); const cnt=countByDate[ds]||0; const today=isToday(d); const work=isWorkDay(d);
            return (
              <button key={ds} onClick={()=>{setSelDay(d);setViewMode('daily');}}
                className={`rounded-xl p-2 min-h-[58px] border flex flex-col items-start transition-all
                  ${today?'bg-blue-600 border-blue-600 shadow-md shadow-blue-200 text-white':!work?'bg-gray-50 border-gray-100':cnt>0?'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm':'bg-white border-gray-100 hover:bg-emerald-50 hover:border-emerald-200'}`}>
                <span className={`text-sm font-black ${today?'text-white':!work?'text-gray-300':'text-gray-800'}`}>{d.getDate()}</span>
                <div className="mt-auto">
                  {cnt>0 && <span className={`text-[9px] font-bold ${today?'text-blue-200':'text-blue-600'}`}>{cnt} apt{cnt>1?'s':''}</span>}
                  {!cnt && work && !today && <span className="text-[9px] text-emerald-400 font-semibold">Free</span>}
                  {!work && !today && <span className="text-[9px] text-gray-300 font-semibold">Off</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Today's Schedule Table ────────────────────────
  const TodayScheduleTable = () => {
    if (queueLoading) return <LoadingSpinner message="Loading today's queue..."/>;
    if (queueError)   return <ErrorState message={queueError} onRetry={loadTodayQueue}/>;

    return (
      <div>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="font-bold text-gray-800">{todayTotal}</span> total
            </div>
            <div className="flex items-center gap-1.5 text-xs text-green-600">
              <CheckCircle2 className="w-3.5 h-3.5"/>
              <span className="font-bold">{completedN}</span> done
            </div>
            {ongoingEntry && (
              <div className="flex items-center gap-1.5 text-xs text-yellow-600">
                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"/>
                <span className="font-semibold">{ongoingEntry.patient_name?.split(' ')[0]} (ongoing)</span>
              </div>
            )}
            <button onClick={loadTodayQueue} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors">
              <RefreshCw className="w-3.5 h-3.5"/>
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search patient..."
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-52 placeholder:text-gray-400"/>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-3 flex-wrap">
          {Object.entries(STATUS_MAP).map(([k,v])=>(
            <span key={k} className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className={`w-2 h-2 rounded-full ${v.dotColor}`}/>{v.label}
            </span>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-gray-100 bg-gray-50/80">
                {['#','Arrived','Patient','Age','Contact','Status','Action'].map(h=>(
                  <th key={h} className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap first:pl-2 last:pr-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleToday.length === 0 && (
                <tr><td colSpan={7} className="text-center py-14 text-sm text-gray-400">
                  <Search className="w-8 h-8 mx-auto text-gray-200 mb-2"/>
                  {search ? 'No patients match your search.' : 'No patients in queue today.'}
                </td></tr>
              )}
              {visibleToday.map(entry => {
                const isOngoing   = entry.status === 'ongoing';
                const isCompleted = entry.status === 'completed';
                const isWaiting   = entry.status === 'waiting' || entry.status === 'called';
                const isNoShow    = entry.status === 'no_show';
                const loading     = actionLoading[entry.queue_entry_id];
                return (
                  <tr key={entry.queue_entry_id}
                    className={`border-b border-gray-50 transition-colors last:border-0
                      ${isOngoing   ? 'bg-yellow-50/70 hover:bg-yellow-50' : ''}
                      ${isCompleted || isNoShow ? 'opacity-50 hover:opacity-70 hover:bg-gray-50' : ''}
                      ${isWaiting   ? 'hover:bg-blue-50/30' : ''}`}>
                    <td className="py-3.5 px-4 pl-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black
                        ${isOngoing   ? 'bg-yellow-500 text-white shadow-sm shadow-yellow-300' : ''}
                        ${isCompleted ? 'bg-gray-100 text-gray-400' : ''}
                        ${isWaiting   ? 'bg-blue-50 text-blue-600' : ''}
                        ${isNoShow    ? 'bg-gray-100 text-gray-400' : ''}`}>
                        {entry.queue_number}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="font-bold text-gray-800 text-xs">{entry.arrival_time ? fmtTime(entry.arrival_time) : '—'}</p>
                      <p className="text-gray-400 text-xs capitalize">{entry.source}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${avatarCls(entry.patient_name)}`}>
                          {initials(entry.patient_name)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{entry.patient_name}</p>
                          {entry.reason
                            ? <p className="text-xs text-gray-400 line-clamp-1">{entry.reason}</p>
                            : <p className="text-xs text-gray-300 italic capitalize">{entry.priority}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-sm text-gray-500 whitespace-nowrap">
                      {entry.patient_age ? `${entry.patient_age} y/o` : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      {entry.patient_contact
                        ? <a href={`tel:${entry.patient_contact}`} className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-700 whitespace-nowrap">
                            <Phone className="w-3.5 h-3.5"/>{entry.patient_contact}
                          </a>
                        : <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className="py-3.5 px-4"><StatusPill status={entry.status}/></td>
                    <td className="py-3.5 px-4 pr-2">
                      {isWaiting && (
                        <Button size="sm" onClick={()=>startConsult(entry)} disabled={loading}
                          className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-sm">
                          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <PlayCircle className="w-3.5 h-3.5"/>}
                          Start
                        </Button>
                      )}
                      {isOngoing && (
                        <Button size="sm" onClick={()=>completeConsult(entry)} disabled={loading}
                          className="h-8 px-3 text-xs bg-green-600 hover:bg-green-700 text-white gap-1.5 shadow-sm animate-pulse">
                          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <CheckSquare className="w-3.5 h-3.5"/>}
                          Done
                        </Button>
                      )}
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-green-500 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5"/> Seen
                        </span>
                      )}
                      {isNoShow && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 font-semibold">
                          <XCircle className="w-3.5 h-3.5"/> No Show
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════
     RENDER
  ═══════════════════════════════ */
  return (
    <MainLayout title="My Schedule" subtitle="View your weekly schedule, appointments and leave requests">
      <div className="space-y-5">

        {/* ── SCHEDULE HEADER ── */}
        <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 text-white overflow-visible z-20">
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none"/>
          <div className="absolute bottom-0 right-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none"/>
          <div className="relative flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/20 flex items-center justify-center text-xl font-black backdrop-blur-sm">
                {DOCTOR.initials}
              </div>
              <div>
                <h2 className="text-xl font-black">{DOCTOR.name}</h2>
                <p className="text-blue-200 text-sm flex items-center gap-1.5 mt-0.5">
                  <Stethoscope className="w-3.5 h-3.5"/>{DOCTOR.specialty}
                  <span className="text-blue-300">·</span>
                  <span className="text-blue-300 text-xs">{DOCTOR.license}</span>
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <CalendarRange className="w-3.5 h-3.5 text-blue-300"/>
                  <span className="text-blue-100 text-sm font-semibold">{weekLabel}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {/* Stats */}
              <div className="flex gap-3">
                <div className="text-center bg-white/10 rounded-xl px-4 py-2">
                  <p className="text-2xl font-black">{todayTotal}</p>
                  <p className="text-blue-200 text-xs font-semibold">Today</p>
                </div>
                <div className="text-center bg-white/10 rounded-xl px-4 py-2">
                  <p className="text-2xl font-black">{completedN}</p>
                  <p className="text-blue-200 text-xs font-semibold">Done</p>
                </div>
                <div className="text-center bg-white/10 rounded-xl px-4 py-2">
                  <p className="text-2xl font-black">{todayTotal - completedN}</p>
                  <p className="text-blue-200 text-xs font-semibold">Remaining</p>
                </div>
              </div>
              {/* Status dropdown */}
              <div className="relative z-40">
                <button onClick={()=>setStatusOpen(s=>!s)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 border border-white/20 hover:bg-white/25 transition-all text-sm font-bold backdrop-blur-sm">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${docStatus==='available'?'bg-emerald-400 animate-pulse':'bg-gray-400'}`}/>
                  {statusCfg.label}
                  <ChevronDown className={`w-3.5 h-3.5 opacity-70 transition-transform ${statusOpen?'rotate-180':''}`}/>
                </button>
                {statusOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-2xl border border-gray-100 py-1 w-44 z-50">
                    {Object.entries(DOC_STATUS).map(([k,v])=>(
                      <button key={k} disabled={statusUpdating} onClick={async()=>{
                          if (!DOCTOR.id || k === docStatus) { setStatusOpen(false); return; }
                          setStatusUpdating(true);
                          try {
                            await updateDoctorAvailability(DOCTOR.id, k);
                            setDocStatus(k);
                            toast({ title: 'Status updated', description: `You are now ${v.label}` });
                          } catch (err) {
                            toast({ title: 'Failed to update status', description: err.message, variant: 'destructive' });
                          } finally {
                            setStatusUpdating(false);
                            setStatusOpen(false);
                          }
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-bold flex items-center gap-2.5 hover:bg-gray-50 transition-colors disabled:opacity-50 ${docStatus===k?v.text:'text-gray-600'}`}>
                        <span className={`w-2 h-2 rounded-full ${v.dot}`}/>{v.label}
                        {docStatus===k && (statusUpdating ? <Loader2 className="w-3 h-3 ml-auto animate-spin"/> : <Check className="w-3 h-3 ml-auto"/>)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── TABBED SCHEDULE PANEL ── */}
        <Card className="border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 pt-5 pb-0 border-b border-gray-100">
            <div className="flex gap-0">
              <button onClick={()=>setScheduleTab('today')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all -mb-px
                  ${scheduleTab==='today'?'border-blue-600 text-blue-600':'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'}`}>
                <ClipboardList className="w-4 h-4"/>
                Today's Queue
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${scheduleTab==='today'?'bg-blue-100 text-blue-700':'bg-gray-100 text-gray-500'}`}>{todayTotal}</span>
              </button>
              <button onClick={()=>setScheduleTab('calendar')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all -mb-px
                  ${scheduleTab==='calendar'?'border-blue-600 text-blue-600':'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'}`}>
                <CalendarRange className="w-4 h-4"/>
                Appointment Calendar
              </button>
            </div>
            {scheduleTab==='calendar' && (
              <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-1">
                {[{key:'weekly',label:'Week',Icon:CalendarRange},{key:'daily',label:'Day',Icon:CalendarDays},{key:'monthly',label:'Month',Icon:LayoutGrid}].map(v=>{
                  const Icon = v.Icon;
                  return (
                    <button key={v.key} onClick={()=>setViewMode(v.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                        ${viewMode===v.key?'bg-white text-blue-700 shadow-sm':'text-gray-500 hover:text-gray-700'}`}>
                      <Icon className="w-3.5 h-3.5"/>{v.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <CardContent className="p-5">
            {scheduleTab==='today' && <TodayScheduleTable/>}
            {scheduleTab==='calendar' && (
              <>
                {viewMode==='weekly'  && <WeeklyGrid/>}
                {viewMode==='daily'   && <DailyView/>}
                {viewMode==='monthly' && <MonthlyView/>}
              </>
            )}
          </CardContent>
        </Card>

        {/* ── RECENT CONSULTATIONS ── */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3 pt-5 px-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600"/>
                  Recent Appointments
                </CardTitle>
                <p className="text-xs text-gray-400 mt-0.5">Last completed appointments</p>
              </div>
              <button className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5">
                View all <ChevronRight className="w-3.5 h-3.5"/>
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {aptsLoading ? (
              <LoadingSpinner message="Loading appointments..."/>
            ) : recentConsults.length === 0 ? (
              <div className="text-center py-10 text-sm text-gray-400">No completed appointments yet.</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentConsults.map(a => (
                  <div key={a.appointment_id} className="px-5 py-3.5 hover:bg-gray-50/70 transition-colors cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${avatarCls(a.patient_name)}`}>
                        {initials(a.patient_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-gray-900 text-sm truncate">{a.patient_name}</p>
                          <span className="text-xs text-gray-400 flex-shrink-0">{a.appointment_date}</span>
                        </div>
                        <p className="text-xs font-semibold text-blue-600 mt-0.5">{a.service_name}</p>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-1">{a.reason}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* ═══ MODALS ═══ */}
      {popup      && <AptModal apt={popup} onClose={()=>setPopup(null)}/>}
      {statusOpen && <div className="fixed inset-0 z-10" onClick={()=>setStatusOpen(false)}/>}
    </MainLayout>
  );
}