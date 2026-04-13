import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import MainLayout from '../components/layouts/MainLayout';
import {
  Calendar, Clock, User, Phone, Mail, FileText,
  ChevronLeft, ChevronRight, Check, X, Bell, Stethoscope,
  XCircle, Star, MapPin, Info, Search, Loader2, Users, UserCheck,
  Shuffle, ArrowRight,
} from 'lucide-react';

/* ═══════════════════════════════════════════════
   CLINIC CONFIG
═══════════════════════════════════════════════ */
const CLINIC = {
  name:    'ClinicSys Medical Center',
  address: 'Ground Floor, MedTower Bldg., Quezon City',
  hours:   'Mon–Sat: 8:00 AM – 5:00 PM',
  phone:   '+63 2 8888 0000',
};

const API_BASE = 'http://backend1.test/api';

/* ═══════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════ */
const MONTHS    = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS      = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DAYS_FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

const padZ        = (n) => String(n).padStart(2,'0');
const fmtD        = (d) => `${d.getFullYear()}-${padZ(d.getMonth()+1)}-${padZ(d.getDate())}`;
const TODAY       = fmtD(new Date());
const toMins      = (t) => { if(!t) return 0; const[h,m]=t.split(':').map(Number); return h*60+m; };
const fmtTime     = (t) => { if(!t) return '—'; const[h,m]=t.split(':'); const hr=parseInt(h); return `${hr>12?hr-12:hr||12}:${m} ${hr>=12?'PM':'AM'}`; };
const fmtDateLong = (ds) => { const d=new Date(ds+'T00:00:00'); return `${DAYS_FULL[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`; };

const generateSlotTimes = (start, end, duration) => {
  if (!duration) return [];
  const times = [];
  let cur = toMins(start);
  const endM = toMins(end);
  while (cur + duration <= endM) {
    const slotEnd = cur + duration;
    const overlapsLunch = cur < 780 && slotEnd > 720;
    if (!overlapsLunch) {
      times.push(`${padZ(Math.floor(cur/60))}:${padZ(cur%60)}`);
      cur += duration;
    } else if (cur < 720) {
      cur = 780;
    } else {
      cur += duration;
    }
  }
  return times;
};

const DOC_COLORS = ['blue','teal','rose','orange','purple','emerald'];
const DOC_COLOR_CFG = {
  blue:    { avatar:'bg-blue-100 text-blue-700',      btn:'bg-blue-600 hover:bg-blue-700 shadow-blue-200'       },
  teal:    { avatar:'bg-teal-100 text-teal-700',      btn:'bg-teal-600 hover:bg-teal-700 shadow-teal-200'       },
  rose:    { avatar:'bg-rose-100 text-rose-700',      btn:'bg-rose-600 hover:bg-rose-700 shadow-rose-200'       },
  orange:  { avatar:'bg-orange-100 text-orange-700',  btn:'bg-orange-600 hover:bg-orange-700 shadow-orange-200' },
  purple:  { avatar:'bg-purple-100 text-purple-700',  btn:'bg-purple-600 hover:bg-purple-700 shadow-purple-200' },
  emerald: { avatar:'bg-emerald-100 text-emerald-700',btn:'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'},
};

const inputCls = "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 placeholder:text-gray-300 transition-all";
const labelCls = "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5";
const BOOKING_DRAFT_KEY = 'patient_appointment_draft_v1';

const authHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return { 'Content-Type':'application/json', Accept:'application/json', ...(token && { Authorization:`Bearer ${token}` }) };
};

/* ═══════════════════════════════════════════════
   NOTIFICATION BANNER
═══════════════════════════════════════════════ */
const Notif = ({ msg, type, onClose }) => {
  const cfg = {
    success:'bg-green-50 border-green-200 text-green-800',
    info:   'bg-blue-50 border-blue-200 text-blue-800',
    warn:   'bg-yellow-50 border-yellow-200 text-yellow-800',
    error:  'bg-red-50 border-red-200 text-red-700',
  };
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-2xl border text-sm font-semibold ${cfg[type]}`}>
      <Bell className="w-4 h-4 flex-shrink-0 mt-0.5"/>
      <span className="flex-1">{msg}</span>
      <button onClick={onClose}><X className="w-4 h-4 opacity-50 hover:opacity-100"/></button>
    </div>
  );
};

/* ═══════════════════════════════════════════════
   MINI CALENDAR — uses real doctor schedule
═══════════════════════════════════════════════ */
const MiniCalendar = ({ doctorSchedule, selectedDate, onSelect }) => {
  const [monthOffset, setMonthOffset] = useState(0);
  const base = new Date(); base.setDate(1); base.setMonth(base.getMonth()+monthOffset);
  const yr=base.getFullYear(), mo=base.getMonth();
  const first=new Date(yr,mo,1), last=new Date(yr,mo+1,0), pad=first.getDay();
  const cells=[];
  for(let i=0;i<pad;i++) cells.push(null);
  for(let d=1;d<=last.getDate();d++) cells.push(new Date(yr,mo,d));

  const getDayStatus = (d) => {
    if(!d) return 'empty';
    const ds = fmtD(d);
    const now = new Date(); now.setHours(0,0,0,0);
    if(d < now) return 'past';
    const sched = doctorSchedule[ds];
    if(!sched) return 'no-schedule';
    const allSlots = sched.slots.flatMap(s => generateSlotTimes(s.start, s.end, s.duration));
    const totalBooked = sched.slots.reduce((a,s) => a + (s.booked||0), 0);
    const available = allSlots.length - totalBooked;
    if(allSlots.length === 0) return 'no-schedule';
    if(available <= 0) return 'full';
    return 'available';
  };

  const STATUS_STYLE = {
    past:'text-gray-200 cursor-not-allowed', empty:'',
    'no-schedule':'text-gray-200 cursor-not-allowed',
    full:'bg-red-50 text-red-300 cursor-not-allowed',
    available:'hover:bg-blue-600 hover:text-white cursor-pointer text-gray-700 font-semibold',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-5">
        <button onClick={()=>setMonthOffset(m=>m-1)} disabled={monthOffset<=0}
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 transition-all">
          <ChevronLeft className="w-4 h-4 text-gray-500"/>
        </button>
        <h3 className="text-sm font-black text-gray-800">{MONTHS[mo]} {yr}</h3>
        <button onClick={()=>setMonthOffset(m=>m+1)}
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all">
          <ChevronRight className="w-4 h-4 text-gray-500"/>
        </button>
      </div>
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map(d=><div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d,i)=>{
          if(!d) return <div key={`p${i}`}/>;
          const ds=fmtD(d), status=getDayStatus(d);
          const isToday=ds===TODAY, isSelected=ds===selectedDate;
          return (
            <button key={ds} disabled={['past','no-schedule','full','empty'].includes(status)}
              onClick={()=>status==='available'&&onSelect(ds)}
              className={`aspect-square rounded-xl text-xs flex items-center justify-center transition-all
                ${isSelected?'bg-blue-600 text-white shadow-md shadow-blue-200 font-black':
                  isToday?'ring-2 ring-blue-400 ring-offset-1 font-bold':STATUS_STYLE[status]}`}>
              {d.getDate()}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 flex-wrap">
        {[{color:'bg-blue-500',label:'Available'},{color:'bg-red-300',label:'Full'},{color:'bg-gray-200',label:'No schedule'}].map(l=>(
          <span key={l.label} className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className={`w-2.5 h-2.5 rounded-full ${l.color}`}/>{l.label}
          </span>
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════
   GENERAL CALENDAR — merges all doctors' schedules
═══════════════════════════════════════════════ */
const GeneralCalendar = ({ allDoctorSchedules, selectedDate, onSelect }) => {
  const [monthOffset, setMonthOffset] = useState(0);
  const base = new Date(); base.setDate(1); base.setMonth(base.getMonth()+monthOffset);
  const yr=base.getFullYear(), mo=base.getMonth();
  const first=new Date(yr,mo,1), last=new Date(yr,mo+1,0), pad=first.getDay();
  const cells=[];
  for(let i=0;i<pad;i++) cells.push(null);
  for(let d=1;d<=last.getDate();d++) cells.push(new Date(yr,mo,d));

  // A date is "available" if at least one doctor has a free slot
  const getDayStatus = (d) => {
    if(!d) return 'empty';
    const ds = fmtD(d);
    const now = new Date(); now.setHours(0,0,0,0);
    if(d < now) return 'past';
    const timeAvailability = {};
    for (const sched of Object.values(allDoctorSchedules)) {
      const day = sched[ds];
      if(!day) continue;
      day.slots.forEach(slotRange => {
        const times = generateSlotTimes(slotRange.start, slotRange.end, slotRange.duration);
        const bookedCount = slotRange.booked || 0;
        times.forEach((time, idx) => {
          if (!timeAvailability[time]) timeAvailability[time] = false;
          if (idx >= bookedCount) timeAvailability[time] = true;
        });
      });
    }
    const hasAny = Object.values(timeAvailability).some(Boolean);
    return hasAny ? 'available' : 'no-schedule';
  };

  const STATUS_STYLE = {
    past:'text-gray-200 cursor-not-allowed', empty:'',
    'no-schedule':'text-gray-200 cursor-not-allowed',
    available:'hover:bg-indigo-600 hover:text-white cursor-pointer text-gray-700 font-semibold',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-5">
        <button onClick={()=>setMonthOffset(m=>m-1)} disabled={monthOffset<=0}
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 transition-all">
          <ChevronLeft className="w-4 h-4 text-gray-500"/>
        </button>
        <h3 className="text-sm font-black text-gray-800">{MONTHS[mo]} {yr}</h3>
        <button onClick={()=>setMonthOffset(m=>m+1)}
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all">
          <ChevronRight className="w-4 h-4 text-gray-500"/>
        </button>
      </div>
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map(d=><div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d,i)=>{
          if(!d) return <div key={`p${i}`}/>;
          const ds=fmtD(d), status=getDayStatus(d);
          const isToday=ds===TODAY, isSelected=ds===selectedDate;
          return (
            <button key={ds} disabled={['past','no-schedule','empty'].includes(status)}
              onClick={()=>status==='available'&&onSelect(ds)}
              className={`aspect-square rounded-xl text-xs flex items-center justify-center transition-all
                ${isSelected?'bg-indigo-600 text-white shadow-md shadow-indigo-200 font-black':
                  isToday?'ring-2 ring-indigo-400 ring-offset-1 font-bold':STATUS_STYLE[status]}`}>
              {d.getDate()}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 flex-wrap">
        {[{color:'bg-indigo-500',label:'Available'},{color:'bg-gray-200',label:'No availability'}].map(l=>(
          <span key={l.label} className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className={`w-2.5 h-2.5 rounded-full ${l.color}`}/>{l.label}
          </span>
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════ */
export default function PatientAppointmentPage() {
  const location = useLocation();
  const [doctors,         setDoctors]         = useState([]);
  const [docLoading,      setDocLoading]       = useState(true);
  const [docError,        setDocError]         = useState(null);
  const [doctorSchedules, setDoctorSchedules]  = useState({});
  const [schedLoading,    setSchedLoading]     = useState(false);
  const [allSchedsLoading,setAllSchedsLoading] = useState(false);
  const [services,        setServices]         = useState([]);
  const [booking,         setBooking]          = useState(false);

  const [patientInfo, setPatientInfo] = useState({ name:'', contact:'', email:'' });

  // bookingMode: 'general' | 'specific'
  const [bookingMode, setBookingMode] = useState(null);

  // step for SPECIFIC flow: 'type-select' | 'doctors' | 'calendar' | 'form' | 'summary' | 'success'
  // step for GENERAL flow:  'type-select' | 'general-calendar' | 'form' | 'summary' | 'success'
  const [step,      setStep]      = useState('type-select');
  const [selDoctor, setSelDoctor] = useState(null);
  const [selDate,   setSelDate]   = useState('');
  const [selTime,   setSelTime]   = useState('');
  const [searchDoc, setSearchDoc] = useState('');
  const [form,      setForm]      = useState({ name:'', contact:'', email:'', service_id:'', reason:'', notes:'' });
  const [notifs,    setNotifs]    = useState([]);
  const [newAptId,  setNewAptId]  = useState(null);
  const [followUpSource, setFollowUpSource] = useState(null);
  const [hasPendingAppointment, setHasPendingAppointment] = useState(false);

  // For general booking: available slots across all doctors for a selected date/time
  const [generalSlots, setGeneralSlots] = useState([]); // [{doctorId, doctorName, doctorColor, time}]

  useEffect(() => {
    try {
      const raw = localStorage.getItem(BOOKING_DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (!draft || typeof draft !== 'object') return;

      if (draft.bookingMode === 'general' || draft.bookingMode === 'specific') {
        setBookingMode(draft.bookingMode);
      }
      if (typeof draft.step === 'string') setStep(draft.step);
      if (typeof draft.selDate === 'string') setSelDate(draft.selDate);
      if (typeof draft.selTime === 'string') setSelTime(draft.selTime);
      if (draft.selDoctor && typeof draft.selDoctor === 'object') setSelDoctor(draft.selDoctor);
      if (draft.form && typeof draft.form === 'object') {
        setForm((prev) => ({ ...prev, ...draft.form }));
      }
    } catch {
      localStorage.removeItem(BOOKING_DRAFT_KEY);
    }
  }, []);

  const setF = (k,v) => setForm(f=>({...f,[k]:v}));
  const dismissNotif = (id) => setNotifs(n=>n.filter(x=>x.id!==id));

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fromFollowUp = params.get('followup') === '1';
    const date = params.get('date') || '';
    if (!fromFollowUp || !date) return;

    const today = new Date().toISOString().slice(0, 10);
    if (date < today) return;

    setFollowUpSource({
      consultationId: params.get('consultation_id') || null,
      date,
    });
    setBookingMode('general');
    setStep('general-calendar');
    setSelDate(date);
    setSelTime('');
  }, [location.search]);

  useEffect(() => {
    const loadMyAppointments = async () => {
      try {
        const res = await fetch(`${API_BASE}/appointments`, { headers: authHeaders() });
        if (!res.ok) return;
        const data = await res.json();
        const rows = Array.isArray(data) ? data : data.data ?? [];
        const today = new Date().toISOString().slice(0, 10);
        const hasPending = rows.some((a) => {
          const status = String(a.status ?? '').toLowerCase();
          const apptDate = String(a.appointment_date ?? a.date ?? '');
          return status === 'scheduled' && apptDate >= today;
        });
        setHasPendingAppointment(hasPending);
      } catch {}
    };
    loadMyAppointments();
  }, []);

  useEffect(() => {
    if (step === 'success') {
      localStorage.removeItem(BOOKING_DRAFT_KEY);
      return;
    }
    const draft = {
      bookingMode,
      step,
      selDoctor,
      selDate,
      selTime,
      form,
    };
    localStorage.setItem(BOOKING_DRAFT_KEY, JSON.stringify(draft));
  }, [bookingMode, step, selDoctor, selDate, selTime, form]);

  const handleBookingModeSelect = (mode) => {
    if (hasPendingAppointment) {
      toast.error('You already have a pending appointment. Complete/cancel it before booking again.');
      return;
    }
    if (mode === 'general') {
      setBookingMode('general');
      setStep('general-calendar');
    } else {
      setBookingMode('specific');
      setStep('doctors');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ── Fetch logged-in patient profile ── */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/patient/profile`, { headers: authHeaders() });
        if (!res.ok) return;
        const p = await res.json();
        const info = {
          name:    `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim(),
          contact: p.mobile ?? '',
          email:   p.email  ?? '',
        };
        setPatientInfo(info);
        setForm(f => ({ ...f, ...info }));
      } catch {}
    };
    load();
  }, []);

  /* ── Fetch doctors ── */
  const fetchDoctors = useCallback(async () => {
    setDocLoading(true); setDocError(null);
    try {
      const res = await fetch(`${API_BASE}/users?role=Doctor`, { headers: authHeaders() });
      if(!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data ?? [];
      const active = list
        .filter(u => u.status?.toLowerCase() === 'active')
        .map((raw, i) => ({
          id:       raw.user_id,
          name:     `${raw.first_name ?? ''} ${raw.last_name ?? ''}`.trim(),
          email:    raw.email          ?? '',
          phone:    raw.contact_number ?? '',
          license:  raw.license_number ?? '',
          color:    DOC_COLORS[i % DOC_COLORS.length],
        }));
      setDoctors(active);
    } catch(err) {
      setDocError(err.message);
    } finally {
      setDocLoading(false);
    }
  }, []);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

  /* ── Fetch active services ── */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/servics?status=active`, { headers: authHeaders() });
        if (!res.ok) return;
        const data = await res.json();
        setServices(Array.isArray(data) ? data : data.data ?? []);
      } catch {}
    };
    load();
  }, []);

  /* ── Fetch schedule for one doctor ── */
  const fetchDoctorSchedule = useCallback(async (userId) => {
    if(doctorSchedules[userId]) return doctorSchedules[userId];
    try {
      const res = await fetch(`${API_BASE}/doctor-schedules?user_id=${userId}`, { headers: authHeaders() });
      if(!res.ok) throw new Error();
      const data = await res.json();
      const normalized = {};
      for(const [date, d] of Object.entries(data ?? {})) {
        normalized[date] = { ...d, slots: Array.isArray(d.slots) ? d.slots : [] };
      }
      setDoctorSchedules(prev => ({ ...prev, [userId]: normalized }));
      return normalized;
    } catch {
      setDoctorSchedules(prev => ({ ...prev, [userId]: {} }));
      return {};
    }
  }, [doctorSchedules]);

  /* ── Fetch ALL doctor schedules (for general booking) ── */
  const fetchAllSchedules = useCallback(async (docList) => {
    setAllSchedsLoading(true);
    await Promise.all(docList.map(doc => fetchDoctorSchedule(doc.id)));
    setAllSchedsLoading(false);
  }, [fetchDoctorSchedule]);

  /* ── When general booking is selected and doctors are loaded, fetch all ── */
  useEffect(() => {
    if(bookingMode === 'general' && doctors.length > 0 && !allSchedsLoading) {
      fetchAllSchedules(doctors);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingMode, doctors]);

  /* ── Pick doctor → specific flow ── */
  const pickDoctor = (doc) => {
    setSelDoctor(doc);
    setSelDate(''); setSelTime('');
    setStep('calendar');
    setSchedLoading(true);
    fetchDoctorSchedule(doc.id).finally(() => setSchedLoading(false));
    window.scrollTo({ top:0, behavior:'smooth' });
  };

  /* ── When general date is picked: compute all available slots across doctors ── */
  const pickGeneralDate = (ds) => {
    setSelDate(ds);
    setSelTime('');
    setSelDoctor(null);

    const slots = [];
    for(const doc of doctors) {
      const sched = doctorSchedules[doc.id]?.[ds];
      if(!sched) continue;
      sched.slots.forEach(slotRange => {
        const times = generateSlotTimes(slotRange.start, slotRange.end, slotRange.duration);
        const bookedCount = slotRange.booked || 0;
        times.forEach((time, idx) => {
          if(idx >= bookedCount) {
            slots.push({ doctorId: doc.id, doctorName: doc.name, doctorColor: doc.color, time });
          }
        });
      });
    }
    // Sort by time, deduplicate times (one entry per time, pick first available doctor)
    const byTime = {};
    for(const s of slots) {
      if(!byTime[s.time]) byTime[s.time] = s;
    }
    const sorted = Object.values(byTime).sort((a,b)=>toMins(a.time)-toMins(b.time));
    setGeneralSlots(sorted);
  };

  useEffect(() => {
    if (bookingMode !== 'general' || !selDate) return;
    pickGeneralDate(selDate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingMode, selDate, doctorSchedules, doctors]);

  /* ── When a general time is selected, assign the doctor ── */
  const pickGeneralTime = (slot) => {
    setSelTime(slot.time);
    // Find the actual doctor object
    const doc = doctors.find(d => d.id === slot.doctorId);
    setSelDoctor(doc ?? null);
  };

  const pickDate = (ds) => { setSelDate(ds); setSelTime(''); };

  /* ── Available slots for specific doctor booking ── */
  const availableSlots = useMemo(() => {
    if(!selDoctor || !selDate || bookingMode !== 'specific') return [];
    const sched = doctorSchedules[selDoctor.id]?.[selDate];
    if(!sched) return [];
    const result = [];
    sched.slots.forEach(slotRange => {
      const times = generateSlotTimes(slotRange.start, slotRange.end, slotRange.duration);
      const bookedCount = slotRange.booked || 0;
      times.forEach((time, idx) => {
        result.push({ time, booked: idx < bookedCount });
      });
    });
    return result;
  }, [selDoctor, selDate, doctorSchedules, bookingMode]);

  const currentSchedule = selDoctor ? (doctorSchedules[selDoctor.id] ?? {}) : {};

  /* ── Confirm booking ── */
  const confirmBooking = async () => {
    setBooking(true);
    try {
      const res = await fetch(`${API_BASE}/appointments`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          doctor_id:        selDoctor?.id,
          service_id:       form.service_id || null,
          appointment_date: selDate,
          appointment_time: selTime,
          reason:           form.reason,
          notes:            form.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Booking failed.');
      setNewAptId(data.appointment_number || `APT-${String(data.appointment_id).padStart(5,'0')}`);
      setNotifs(prev=>[{
        id: Date.now(),
        msg: `✅ Appointment confirmed! ${selDoctor?.name} on ${fmtDateLong(selDate)} at ${fmtTime(selTime)}.`,
        type: 'success',
      }, ...prev]);
      setStep('success');
      localStorage.removeItem(BOOKING_DRAFT_KEY);
      window.scrollTo({ top:0, behavior:'smooth' });
    } catch (err) {
      setNotifs(prev=>[{ id:Date.now(), msg: err.message, type:'error' }, ...prev]);
    } finally {
      setBooking(false);
    }
  };

  /* ── Reset ── */
  const resetFlow = () => {
    setSelDoctor(null); setSelDate(''); setSelTime('');
    setBookingMode(null);
    setForm({ ...patientInfo, service_id:'', reason:'', notes:'' });
    setStep('type-select');
    setGeneralSlots([]);
    localStorage.removeItem(BOOKING_DRAFT_KEY);
    window.scrollTo({ top:0, behavior:'smooth' });
  };

  const filteredDoctors = doctors.filter(d => d.name.toLowerCase().includes(searchDoc.toLowerCase()));

  /* ── Step breadcrumb config per mode ── */
  const breadcrumbSteps = bookingMode === 'general'
    ? [
        {key:'type-select', label:'1. Type'},
        {key:'general-calendar', label:'2. Schedule'},
        {key:'form', label:'3. Details'},
        {key:'summary', label:'4. Confirm'},
      ]
    : [
        {key:'type-select', label:'1. Type'},
        {key:'doctors', label:'2. Doctor'},
        {key:'calendar', label:'3. Schedule'},
        {key:'form', label:'4. Details'},
        {key:'summary', label:'5. Confirm'},
      ];

  const stepOrder = bookingMode === 'general'
    ? ['type-select','general-calendar','form','summary','success']
    : ['type-select','doctors','calendar','form','summary','success'];

  /* ════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════ */
  return (
    <MainLayout title="Book Appointment" subtitle="Schedule a visit with one of our doctors">
      <div className="space-y-6">

        {/* ══ HEADER ══ */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-white/5"/>
          <div className="absolute bottom-0 left-1/2 w-72 h-72 rounded-full bg-white/5 -translate-x-1/2 translate-y-1/2"/>
          <div className="relative">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <Stethoscope className="w-4 h-4 text-white"/>
                  </div>
                  <span className="text-blue-200 text-sm font-semibold">{CLINIC.name}</span>
                </div>
                <h1 className="text-3xl font-black leading-tight">Book an Appointment</h1>
                <p className="text-blue-200 text-sm mt-2 max-w-lg">Select a doctor, choose an available date and time, and confirm your appointment.</p>
                {followUpSource && (
                  <p className="mt-3 inline-flex items-center gap-2 bg-white/15 border border-white/20 text-xs text-white px-3 py-1.5 rounded-full font-semibold">
                    Follow-up appointment from previous consultation
                  </p>
                )}
              </div>
              <div className="text-right text-sm text-blue-200 space-y-1">
                <div className="flex items-center gap-2 justify-end"><MapPin className="w-3.5 h-3.5"/>{CLINIC.address}</div>
                <div className="flex items-center gap-2 justify-end"><Clock className="w-3.5 h-3.5"/>{CLINIC.hours}</div>
              </div>
            </div>
            {/* Step breadcrumb */}
            {step !== 'type-select' && (
              <div className="flex items-center gap-1.5 mt-6 flex-wrap">
                {breadcrumbSteps.map((s,i) => {
                  const curr = stepOrder.indexOf(step);
                  const idx  = stepOrder.indexOf(s.key);
                  const done = curr > idx, active = curr === idx;
                  return (
                    <React.Fragment key={s.key}>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full transition-all
                        ${done?'bg-white/20 text-white':active?'bg-white text-blue-700 shadow-sm':'text-blue-300'}`}>
                        {done?'✓ ':''}{s.label}
                      </span>
                      {i < breadcrumbSteps.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-blue-400"/>}
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ══ NOTIFICATIONS ══ */}
        {notifs.length > 0 && (
          <div className="space-y-2">
            {notifs.map(n=><Notif key={n.id} {...n} onClose={()=>dismissNotif(n.id)}/>)}
          </div>
        )}

        {/* ══════════════════════════════════════════
            STEP: TYPE SELECT
        ══════════════════════════════════════════ */}
        {step === 'type-select' && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-xl font-black text-gray-900">How would you like to book?</h2>
              <p className="text-sm text-gray-400 mt-1">Choose between selecting a specific doctor or letting the system assign one for you.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* General Appointment */}
              <button
                onClick={() => handleBookingModeSelect('general')}
                className="group relative bg-white border-2 border-gray-100 rounded-3xl p-7 text-left hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-50 transition-all duration-200 flex flex-col gap-4"
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
                  <Shuffle className="w-7 h-7 text-indigo-600"/>
                </div>
                <div>
                  <p className="text-base font-black text-gray-900">General Appointment</p>
                  <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                    Don't have a preferred doctor? Pick a date and time — the system will automatically assign an available doctor for you.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-500 mt-auto">
                  Get started <ArrowRight className="w-3.5 h-3.5"/>
                </div>
                {/* Badge */}
                <span className="absolute top-4 right-4 text-[10px] font-bold bg-indigo-100 text-indigo-600 px-2.5 py-1 rounded-full">
                  Recommended
                </span>
              </button>

              {/* Specific Doctor */}
              <button
                onClick={() => handleBookingModeSelect('specific')}
                className="group bg-white border-2 border-gray-100 rounded-3xl p-7 text-left hover:border-blue-300 hover:shadow-xl hover:shadow-blue-50 transition-all duration-200 flex flex-col gap-4"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                  <UserCheck className="w-7 h-7 text-blue-600"/>
                </div>
                <div>
                  <p className="text-base font-black text-gray-900">Choose a Doctor</p>
                  <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                    Already have a preferred doctor? Browse our available doctors and book directly with the one you trust.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-500 mt-auto">
                  Browse doctors <ArrowRight className="w-3.5 h-3.5"/>
                </div>
              </button>
            </div>

            {/* Info tip */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl text-xs text-blue-700 mt-5">
              <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5"/>
              <p><strong>Track your appointments</strong> in your Medical Records page. You can view upcoming schedules, consultation history, and prescriptions there.</p>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            STEP: GENERAL CALENDAR + TIME PICKER
        ══════════════════════════════════════════ */}
        {step === 'general-calendar' && (
          <div className="space-y-5">
            <button onClick={() => { setStep('type-select'); setSelDate(''); setSelTime(''); setBookingMode(null); }}
              className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors">
              <ChevronLeft className="w-4 h-4"/> Back
            </button>

            {/* Info banner */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3 text-sm text-indigo-700">
              <Shuffle className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5"/>
              <div>
                <p className="font-bold">General Appointment</p>
                <p className="text-xs mt-0.5 text-indigo-500">Pick a date and time below. The system will automatically assign you the first available doctor for that slot.</p>
                {followUpSource && (
                  <p className="text-xs mt-1 font-semibold text-indigo-700">
                    Follow-up date preselected: {fmtDateLong(followUpSource.date)}
                  </p>
                )}
              </div>
            </div>

            {allSchedsLoading && (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 text-indigo-400 animate-spin"/>
                <span className="ml-3 text-sm text-gray-400 font-medium">Loading all schedules…</span>
              </div>
            )}

            {!allSchedsLoading && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* General Calendar */}
                <div>
                  <h3 className="text-sm font-black text-gray-800 mb-3">Select a Date</h3>
                  <GeneralCalendar
                    allDoctorSchedules={doctorSchedules}
                    selectedDate={selDate}
                    onSelect={pickGeneralDate}
                  />
                </div>

                {/* Time Slots */}
                <div>
                  <h3 className="text-sm font-black text-gray-800 mb-3">
                    {selDate ? `Available Times — ${fmtDateLong(selDate)}` : 'Choose a date first'}
                  </h3>

                  {!selDate ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                      <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3"/>
                      <p className="text-sm text-gray-400 font-medium">Select a date to see available slots.</p>
                    </div>
                  ) : generalSlots.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                      <XCircle className="w-10 h-10 text-red-200 mx-auto mb-3"/>
                      <p className="text-sm text-gray-500 font-bold">No available slots</p>
                      <p className="text-xs text-gray-400 mt-1">No doctors are available on this date. Please choose another date.</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <p className="text-xs text-gray-400 font-semibold mb-4">
                        {generalSlots.length} slot{generalSlots.length !== 1 ? 's' : ''} available across {new Set(generalSlots.map(s=>s.doctorId)).size} doctor{new Set(generalSlots.map(s=>s.doctorId)).size !== 1 ? 's' : ''}
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {generalSlots.map(slot => {
                          const isSel = selTime === slot.time && selDoctor?.id === slot.doctorId;
                          return (
                            <button key={`${slot.doctorId}-${slot.time}`}
                              onClick={() => pickGeneralTime(slot)}
                              className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all
                                ${isSel
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                                  : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-400 hover:text-indigo-600'}`}>
                              {fmtTime(slot.time)}
                            </button>
                          );
                        })}
                      </div>

                      {/* Show which doctor will be assigned */}
                      {selTime && selDoctor && (
                        <div className="mt-4 p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 ${DOC_COLOR_CFG[selDoctor.color].avatar}`}>
                            {selDoctor.name.split(' ').filter(Boolean).slice(-2).map(n=>n[0]).join('')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-indigo-500 font-semibold">Assigned Doctor</p>
                            <p className="text-sm font-black text-indigo-800">{selDoctor.name}</p>
                          </div>
                          <Check className="w-4 h-4 text-indigo-500 flex-shrink-0"/>
                        </div>
                      )}

                      {selTime && selDoctor && (
                        <div className="mt-4">
                          <button onClick={() => setStep('form')}
                            className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200">
                            Continue with {fmtTime(selTime)} →
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════
            STEP: DOCTOR SELECTION (specific)
        ══════════════════════════════════════════ */}
        {step === 'doctors' && (
          <div className="space-y-5">
            <button onClick={() => { setStep('type-select'); setBookingMode(null); }}
              className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors">
              <ChevronLeft className="w-4 h-4"/> Back
            </button>

            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300"/>
              <input value={searchDoc} onChange={e=>setSearchDoc(e.target.value)}
                placeholder="Search doctor..."
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-300"/>
            </div>

            {docLoading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin"/>
                <span className="ml-3 text-sm text-gray-400 font-medium">Loading doctors…</span>
              </div>
            )}
            {!docLoading && docError && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700">
                <XCircle className="w-5 h-5 flex-shrink-0"/>
                <span>Could not load doctors: <strong>{docError}</strong></span>
                <button onClick={fetchDoctors} className="ml-auto text-xs underline font-semibold">Retry</button>
              </div>
            )}
            {!docLoading && !docError && filteredDoctors.length === 0 && (
              <div className="text-center py-16">
                <Stethoscope className="w-10 h-10 mx-auto text-gray-200 mb-2"/>
                <p className="text-sm text-gray-400 font-medium">No doctors found</p>
              </div>
            )}
            {!docLoading && !docError && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDoctors.map(doc => {
                  const c = DOC_COLOR_CFG[doc.color];
                  const initials = doc.name.split(' ').filter(Boolean).slice(-2).map(n=>n[0]).join('');
                  return (
                    <div key={doc.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all p-5 flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black flex-shrink-0 ${c.avatar}`}>
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-gray-900 text-sm leading-tight">{doc.name}</p>
                          {doc.license && <p className="text-xs text-gray-400 mt-0.5">License: {doc.license}</p>}
                        </div>
                      </div>
                      <button onClick={()=>pickDoctor(doc)}
                        className={`w-full py-2.5 rounded-xl text-white text-sm font-bold transition-all shadow-sm ${c.btn}`}>
                        Select Doctor
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════
            STEP: CALENDAR + TIME (specific doctor)
        ══════════════════════════════════════════ */}
        {step === 'calendar' && selDoctor && (
          <div className="space-y-5">
            <button onClick={()=>{setStep('doctors');setSelDate('');setSelTime('');}}
              className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors">
              <ChevronLeft className="w-4 h-4"/> Back to Doctors
            </button>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black flex-shrink-0 ${DOC_COLOR_CFG[selDoctor.color].avatar}`}>
                {selDoctor.name.split(' ').filter(Boolean).slice(-2).map(n=>n[0]).join('')}
              </div>
              <div className="flex-1">
                <p className="font-black text-gray-900">{selDoctor.name}</p>
                {selDoctor.license && <p className="text-xs text-gray-400 mt-0.5">License: {selDoctor.license}</p>}
              </div>
              {schedLoading && <Loader2 className="w-4 h-4 text-blue-400 animate-spin"/>}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div>
                <h3 className="text-sm font-black text-gray-800 mb-3">Select a Date</h3>
                <MiniCalendar
                  doctorSchedule={currentSchedule}
                  selectedDate={selDate}
                  onSelect={pickDate}
                />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-800 mb-3">
                  {selDate ? `Available Times — ${fmtDateLong(selDate)}` : 'Choose a date first'}
                </h3>
                {!selDate ? (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                    <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3"/>
                    <p className="text-sm text-gray-400 font-medium">Select a date on the calendar to see available time slots.</p>
                  </div>
                ) : schedLoading ? (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-blue-400 animate-spin"/>
                    <span className="ml-2 text-sm text-gray-400">Loading slots…</span>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                    <XCircle className="w-10 h-10 text-red-200 mx-auto mb-3"/>
                    <p className="text-sm text-gray-500 font-bold">No available slots</p>
                    <p className="text-xs text-gray-400 mt-1">This date is fully booked. Please choose another date.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <p className="text-xs text-gray-400 font-semibold mb-4">
                      {availableSlots.filter(s=>!s.booked).length} slot{availableSlots.filter(s=>!s.booked).length!==1?'s':''} available
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots.map(({ time, booked }) => {
                        const isSel = selTime === time;
                        return (
                          <button key={time} disabled={booked} onClick={()=>setSelTime(time)}
                            className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all
                              ${isSel    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                              : booked   ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed line-through'
                                         : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:text-blue-600'}`}>
                            {fmtTime(time)}
                            {booked && <span className="block text-[9px] font-normal">Booked</span>}
                          </button>
                        );
                      })}
                    </div>
                    {selTime && (
                      <div className="mt-5">
                        <button onClick={()=>setStep('form')}
                          className="w-full py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-200">
                          Continue with {fmtTime(selTime)} →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            STEP: APPOINTMENT DETAILS FORM
        ══════════════════════════════════════════ */}
        {step === 'form' && (
          <div className="space-y-5 max-w-2xl mx-auto">
            <button onClick={() => setStep(bookingMode === 'general' ? 'general-calendar' : 'calendar')}
              className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors">
              <ChevronLeft className="w-4 h-4"/> Back to Schedule
            </button>

            <div className={`border rounded-2xl p-4 flex flex-wrap gap-4 text-sm ${bookingMode === 'general' ? 'bg-indigo-50 border-indigo-100' : 'bg-blue-50 border-blue-100'}`}>
              <div className="flex items-center gap-2">
                <User className={`w-4 h-4 ${bookingMode === 'general' ? 'text-indigo-500' : 'text-blue-500'}`}/>
                <span className={`font-bold ${bookingMode === 'general' ? 'text-indigo-800' : 'text-blue-800'}`}>{selDoctor?.name}</span>
                {bookingMode === 'general' && (
                  <span className="text-[10px] font-bold bg-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full">Auto-assigned</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className={`w-4 h-4 ${bookingMode === 'general' ? 'text-indigo-500' : 'text-blue-500'}`}/>
                <span className={`font-bold ${bookingMode === 'general' ? 'text-indigo-800' : 'text-blue-800'}`}>{selDate ? fmtDateLong(selDate) : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className={`w-4 h-4 ${bookingMode === 'general' ? 'text-indigo-500' : 'text-blue-500'}`}/>
                <span className={`font-bold ${bookingMode === 'general' ? 'text-indigo-800' : 'text-blue-800'}`}>{selTime ? fmtTime(selTime) : ''}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
              <h2 className="text-lg font-black text-gray-900">Your Appointment Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Full Name <span className="text-red-400">*</span></label>
                  <input value={form.name} onChange={e=>setF('name',e.target.value)} className={inputCls}/>
                </div>
                <div>
                  <label className={labelCls}>Contact Number <span className="text-red-400">*</span></label>
                  <input value={form.contact} onChange={e=>setF('contact',e.target.value)} className={inputCls}/>
                </div>
              </div>
              <div>
                <label className={labelCls}>Email Address</label>
                <input value={form.email} onChange={e=>setF('email',e.target.value)} type="email" className={inputCls}/>
              </div>
              <div>
                <label className={labelCls}>Service <span className="text-red-400">*</span></label>
                <select value={form.service_id} onChange={e=>setF('service_id', e.target.value)} className={inputCls}>
                  <option value="">— Select a service —</option>
                  {services.map(s => (
                    <option key={s.service_id} value={s.service_id}>
                      {s.service_name}{s.price ? ` — ₱${parseFloat(s.price).toLocaleString()}` : ''}
                      {s.duration_minutes ? ` (${s.duration_minutes} mins)` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Reason for Visit / Symptoms <span className="text-red-400">*</span></label>
                <textarea value={form.reason} onChange={e=>setF('reason',e.target.value)}
                  rows={3} placeholder="Briefly describe your symptoms or reason for visit..."
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-300 transition-all resize-none"/>
              </div>
              <div>
                <label className={labelCls}>Notes for Doctor <span className="text-gray-300 font-normal">(Optional)</span></label>
                <textarea value={form.notes} onChange={e=>setF('notes',e.target.value)}
                  rows={2} placeholder="Any additional information or special requests..."
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-300 transition-all resize-none"/>
              </div>
              <button disabled={!form.name||!form.contact||!form.reason||!form.service_id} onClick={()=>setStep('summary')}
                className={`w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed
                  ${bookingMode === 'general'
                    ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}>
                Review Appointment →
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            STEP: SUMMARY
        ══════════════════════════════════════════ */}
        {step === 'summary' && (
          <div className="max-w-xl mx-auto space-y-5">
            <button onClick={()=>setStep('form')}
              className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors">
              <ChevronLeft className="w-4 h-4"/> Back to Details
            </button>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
              <div className="text-center mb-7">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 ${bookingMode === 'general' ? 'bg-indigo-100' : 'bg-blue-100'}`}>
                  <FileText className={`w-7 h-7 ${bookingMode === 'general' ? 'text-indigo-600' : 'text-blue-600'}`}/>
                </div>
                <h2 className="text-xl font-black text-gray-900">Confirm Your Appointment</h2>
                <p className="text-sm text-gray-400 mt-1">Please review before confirming</p>
              </div>
              <div className="space-y-3 bg-gray-50 rounded-2xl p-5 border border-gray-100">
                {[
                  ['Doctor',  selDoctor?.name + (bookingMode === 'general' ? ' (Auto-assigned)' : ''), User    ],
                  ['Date',    selDate?fmtDateLong(selDate):'',                                          Calendar],
                  ['Time',    selTime?fmtTime(selTime):'',                                              Clock   ],
                  ['Service', services.find(s=>String(s.service_id)===String(form.service_id))?.service_name ?? '—', FileText],
                  ['Patient', form.name,                                                                User    ],
                  ['Contact', form.contact,                                                             Phone   ],
                  ['Email',   form.email,                                                               Mail    ],
                  ['Reason',  form.reason,                                                              FileText],
                  ...(form.notes?[['Notes',form.notes,FileText]]:[]),
                ].map(([l,v,Icon]) => (
                  <div key={l} className="flex items-start gap-3 text-sm">
                    <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-gray-400"/>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{l}</p>
                      <p className="font-semibold text-gray-800">{v||'—'}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2 mt-4 text-xs text-amber-700">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5"/>
                Please arrive 15 minutes before your scheduled time. Bring a valid ID and any previous medical records.
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={resetFlow}
                  className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all">
                  Cancel
                </button>
                <button onClick={confirmBooking} disabled={booking}
                  className="flex-1 py-3 rounded-2xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition-all shadow-md shadow-green-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {booking ? <><Loader2 className="w-4 h-4 animate-spin"/> Booking…</> : '✓ Confirm Appointment'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            STEP: SUCCESS
        ══════════════════════════════════════════ */}
        {step === 'success' && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center max-w-lg mx-auto">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-green-100">
              <Check className="w-10 h-10 text-green-600" strokeWidth={2.5}/>
            </div>
            <h2 className="text-2xl font-black text-gray-900">Appointment Booked!</h2>
            <p className="text-gray-500 text-sm mt-2">Your appointment has been scheduled. Please arrive 15 minutes early.</p>
            {bookingMode === 'general' && (
              <div className="mt-3 inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold px-3 py-1.5 rounded-full">
                <Shuffle className="w-3.5 h-3.5"/> Doctor was auto-assigned by the system
              </div>
            )}
            <div className="bg-gray-50 rounded-2xl p-5 mt-6 text-left space-y-3 border border-gray-100">
              {[
                ['Appointment ID', newAptId],
                ['Doctor',         selDoctor?.name],
                ['Date',           selDate ? fmtDateLong(selDate) : ''],
                ['Time',           selTime ? fmtTime(selTime) : ''],
                ['Service',        services.find(s=>String(s.service_id)===String(form.service_id))?.service_name ?? '—'],
                ['Reason',         form.reason],
              ].map(([l,v]) => (
                <div key={l} className="flex justify-between gap-4 text-sm">
                  <span className="text-gray-400 font-semibold">{l}</span>
                  <span className="text-gray-800 font-bold text-right">{v||'—'}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={resetFlow} className="flex-1 py-3 rounded-2xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-200">
                Book Another
              </button>
              <button onClick={()=>setStep('type-select')} className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-all">
                Done
              </button>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
}
