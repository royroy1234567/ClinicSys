import React, { useState, useMemo } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import {
  Calendar, Clock, User, Phone, Mail, FileText,
  ChevronLeft, ChevronRight, Check, X, Bell, Stethoscope,
  CheckCircle2, AlertCircle, XCircle, PlayCircle, Star,
  MapPin, Info, Eye, Trash2, Search, ChevronDown,
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

/* ═══════════════════════════════════════════════
   CURRENT PATIENT
═══════════════════════════════════════════════ */
const ME = {
  id:      'PT-00045',
  name:    'Juan dela Cruz',
  contact: '+63 917 555 1234',
  email:   'juan.delacruz@email.com',
};

/* ═══════════════════════════════════════════════
   DOCTORS
═══════════════════════════════════════════════ */
const DOCTORS = [
  {
    id: 'D1', name: 'Dr. Maria Santos', specialty: 'General Physician',
    rating: 4.9, patients: 1240, workDays: [1,2,3,4,5],
    slots:  ['08:00','08:30','09:00','09:30','10:00','10:30','13:00','13:30','14:00','14:30','15:00'],
    bio:    'Board-certified general physician with 14 years of clinical experience.',
    color:  'blue',
  },
  {
    id: 'D2', name: 'Dr. Jose Reyes', specialty: 'Internal Medicine',
    rating: 4.8, patients: 980, workDays: [1,3,5],
    slots:  ['09:00','09:30','10:00','11:00','14:00','14:30','15:00','15:30'],
    bio:    'Specialist in adult diseases, hypertension, and diabetes management.',
    color:  'teal',
  },
  {
    id: 'D3', name: 'Dr. Ana Cruz', specialty: 'Pediatrics',
    rating: 4.9, patients: 1580, workDays: [2,4,6],
    slots:  ['08:00','08:30','09:00','09:30','10:00','13:00','13:30','14:00'],
    bio:    'Dedicated to childrens health from newborns to adolescents.',
    color:  'rose',
  },
  {
    id: 'D4', name: 'Dr. Carlos Lim', specialty: 'Cardiology',
    rating: 4.7, patients: 760, workDays: [1,2,4,5],
    slots:  ['09:00','09:30','10:00','10:30','14:00','14:30'],
    bio:    'Expert in heart disease diagnosis, ECG interpretation, and cardiac care.',
    color:  'orange',
  },
  {
    id: 'D5', name: 'Dr. Elena Ramos', specialty: 'Dermatology',
    rating: 4.8, patients: 1100, workDays: [2,3,5,6],
    slots:  ['08:30','09:00','09:30','10:00','13:00','13:30','14:00','14:30','15:00'],
    bio:    'Specialist in skin, hair, and nail disorders. Cosmetic dermatology expert.',
    color:  'purple',
  },
  {
    id: 'D6', name: 'Dr. Ben Torres', specialty: 'Orthopedics',
    rating: 4.6, patients: 640, workDays: [1,3,4],
    slots:  ['08:00','08:30','09:00','09:30','10:00','10:30','14:00','14:30','15:00'],
    bio:    'Bone, joint, and muscle specialist. Sports injury and fracture care.',
    color:  'emerald',
  },
];

/* ═══════════════════════════════════════════════
   BOOKED SLOTS (simulate server state)
═══════════════════════════════════════════════ */
const BOOKED_SLOTS = {
  'D1_2026-03-06': ['08:00','09:00','10:00','13:00','14:30'],
  'D1_2026-03-09': ['09:00','09:30','10:00','10:30','13:00','13:30','14:00','14:30','15:00'],
  'D2_2026-03-09': ['09:00','09:30','10:00'],
  'D3_2026-03-10': ['08:00','08:30','09:00','09:30'],
  'D4_2026-03-09': ['09:00','09:30','10:00','10:30','14:00','14:30'],
};

/* ═══════════════════════════════════════════════
   EXISTING APPOINTMENTS
═══════════════════════════════════════════════ */
const INIT_APTS = [
  { id:'APT-101', doctorId:'D2', doctor:'Dr. Jose Reyes',  specialty:'Internal Medicine', date:'2026-03-09', time:'11:00', reason:'Blood pressure follow-up',  status:'scheduled' },
  { id:'APT-099', doctorId:'D1', doctor:'Dr. Maria Santos',specialty:'General Physician', date:'2026-02-20', time:'09:30', reason:'Annual physical exam',      status:'completed' },
  { id:'APT-088', doctorId:'D3', doctor:'Dr. Ana Cruz',    specialty:'Pediatrics',        date:'2026-01-15', time:'10:00', reason:'Flu symptoms',              status:'completed' },
  { id:'APT-076', doctorId:'D4', doctor:'Dr. Carlos Lim',  specialty:'Cardiology',        date:'2026-01-05', time:'09:00', reason:'Chest discomfort',          status:'cancelled' },
];

/* ═══════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════ */
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DAYS_FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

const padZ  = (n) => String(n).padStart(2,'0');
const fmtD  = (d) => `${d.getFullYear()}-${padZ(d.getMonth()+1)}-${padZ(d.getDate())}`;
const TODAY = fmtD(new Date());

const fmtTime = (t) => {
  const [h, m] = t.split(':');
  const hr = parseInt(h);
  return `${hr>12?hr-12:hr||12}:${m} ${hr>=12?'PM':'AM'}`;
};

const fmtDateLong = (ds) => {
  const d = new Date(ds+'T00:00:00');
  return `${DAYS_FULL[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

const STATUS_CFG = {
  scheduled: { label:'Scheduled', bg:'bg-blue-50',   text:'text-blue-700',   dot:'bg-blue-500',   border:'border-blue-200'  },
  confirmed: { label:'Confirmed', bg:'bg-teal-50',   text:'text-teal-700',   dot:'bg-teal-500',   border:'border-teal-200'  },
  ongoing:   { label:'Ongoing',   bg:'bg-yellow-50', text:'text-yellow-700', dot:'bg-yellow-500', border:'border-yellow-300'},
  completed: { label:'Completed', bg:'bg-green-50',  text:'text-green-700',  dot:'bg-green-500',  border:'border-green-200' },
  cancelled: { label:'Cancelled', bg:'bg-red-50',    text:'text-red-600',    dot:'bg-red-500',    border:'border-red-200'   },
};

const DOC_COLORS = {
  blue:    { ring:'ring-blue-200',    avatar:'bg-blue-100 text-blue-700',    tag:'bg-blue-50 text-blue-600 border-blue-200',    btn:'bg-blue-600 hover:bg-blue-700 shadow-blue-200'   },
  teal:    { ring:'ring-teal-200',    avatar:'bg-teal-100 text-teal-700',    tag:'bg-teal-50 text-teal-600 border-teal-200',    btn:'bg-teal-600 hover:bg-teal-700 shadow-teal-200'   },
  rose:    { ring:'ring-rose-200',    avatar:'bg-rose-100 text-rose-700',    tag:'bg-rose-50 text-rose-600 border-rose-200',    btn:'bg-rose-600 hover:bg-rose-700 shadow-rose-200'   },
  orange:  { ring:'ring-orange-200',  avatar:'bg-orange-100 text-orange-700',tag:'bg-orange-50 text-orange-600 border-orange-200',btn:'bg-orange-600 hover:bg-orange-700 shadow-orange-200'},
  purple:  { ring:'ring-purple-200',  avatar:'bg-purple-100 text-purple-700',tag:'bg-purple-50 text-purple-600 border-purple-200',btn:'bg-purple-600 hover:bg-purple-700 shadow-purple-200'},
  emerald: { ring:'ring-emerald-200', avatar:'bg-emerald-100 text-emerald-700',tag:'bg-emerald-50 text-emerald-600 border-emerald-200',btn:'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'},
};

const inputCls = "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 placeholder:text-gray-300 transition-all";
const labelCls = "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5";

/* ═══════════════════════════════════════════════
   NOTIFICATION BANNER
═══════════════════════════════════════════════ */
const Notif = ({ msg, type, onClose }) => {
  const cfg = {
    success: 'bg-green-50 border-green-200 text-green-800',
    info:    'bg-blue-50 border-blue-200 text-blue-800',
    warn:    'bg-yellow-50 border-yellow-200 text-yellow-800',
    error:   'bg-red-50 border-red-200 text-red-700',
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
   MINI CALENDAR
═══════════════════════════════════════════════ */
const MiniCalendar = ({ doctor, selectedDate, onSelect }) => {
  const [monthOffset, setMonthOffset] = useState(0);
  const base  = new Date();
  base.setDate(1);
  base.setMonth(base.getMonth() + monthOffset);
  const yr  = base.getFullYear();
  const mo  = base.getMonth();
  const first = new Date(yr, mo, 1);
  const last  = new Date(yr, mo+1, 0);
  const pad   = first.getDay(); // Sun = 0

  const cells = [];
  for (let i=0; i<pad; i++) cells.push(null);
  for (let d=1; d<=last.getDate(); d++) cells.push(new Date(yr, mo, d));

  const getDayStatus = (d) => {
    if (!d) return 'empty';
    const ds  = fmtD(d);
    const now = new Date(); now.setHours(0,0,0,0);
    if (d < now) return 'past';
    if (!doctor.workDays.includes(d.getDay())) return 'no-schedule';
    const booked = BOOKED_SLOTS[`${doctor.id}_${ds}`] || [];
    if (booked.length >= doctor.slots.length) return 'full';
    return 'available';
  };

  const STATUS_STYLE = {
    'past':        'text-gray-200 cursor-not-allowed',
    'empty':       '',
    'no-schedule': 'text-gray-200 cursor-not-allowed',
    'full':        'bg-red-50 text-red-300 cursor-not-allowed',
    'available':   'hover:bg-blue-600 hover:text-white cursor-pointer text-gray-700 font-semibold',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      {/* Month nav */}
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

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase">{d}</div>
        ))}
      </div>

      {/* Date grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={`p${i}`}/>;
          const ds     = fmtD(d);
          const status = getDayStatus(d);
          const isToday   = ds === TODAY;
          const isSelected= ds === selectedDate;
          return (
            <button
              key={ds}
              disabled={['past','no-schedule','full','empty'].includes(status)}
              onClick={() => status==='available' && onSelect(ds)}
              className={`
                aspect-square rounded-xl text-xs flex items-center justify-center transition-all
                ${isSelected ? 'bg-blue-600 text-white shadow-md shadow-blue-200 font-black' :
                  isToday    ? 'ring-2 ring-blue-400 ring-offset-1 font-bold' :
                               STATUS_STYLE[status]}
              `}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 flex-wrap">
        {[
          {color:'bg-blue-500',  label:'Available' },
          {color:'bg-red-300',   label:'Full'      },
          {color:'bg-gray-200',  label:'No schedule'},
        ].map(l => (
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
  /* ── flow state ── */
  const [step,       setStep]      = useState('doctors');   // doctors | calendar | form | summary | success
  const [selDoctor,  setSelDoctor] = useState(null);
  const [selDate,    setSelDate]   = useState('');
  const [selTime,    setSelTime]   = useState('');
  const [filterSpec, setFilterSpec]= useState('All');
  const [searchDoc,  setSearchDoc] = useState('');
  const [form,       setForm]      = useState({ name:ME.name, contact:ME.contact, email:ME.email, reason:'', notes:'' });
  const [appointments, setApts]    = useState(INIT_APTS);
  const [notifs,      setNotifs]   = useState([
    { id:1, msg:`Reminder: Your appointment with Dr. Jose Reyes is on March 9 at 11:00 AM.`, type:'info' },
  ]);
  const [detailApt,  setDetailApt] = useState(null);
  const [aptFilter,  setAptFilter] = useState('all');
  const [newAptId,   setNewAptId]  = useState(null);

  const setF = (k,v) => setForm(f=>({...f,[k]:v}));
  const dismissNotif = (id) => setNotifs(n=>n.filter(x=>x.id!==id));

  /* ── filtered doctors ── */
  const specialties = ['All', ...Array.from(new Set(DOCTORS.map(d=>d.specialty)))];
  const filteredDoctors = DOCTORS.filter(d => {
    const matchSpec = filterSpec==='All' || d.specialty===filterSpec;
    const matchSearch = d.name.toLowerCase().includes(searchDoc.toLowerCase()) || d.specialty.toLowerCase().includes(searchDoc.toLowerCase());
    return matchSpec && matchSearch;
  });

  /* ── available time slots for selected date/doctor ── */
  const availableSlots = useMemo(() => {
    if (!selDoctor || !selDate) return [];
    const booked = BOOKED_SLOTS[`${selDoctor.id}_${selDate}`] || [];
    return selDoctor.slots.filter(s => !booked.includes(s));
  }, [selDoctor, selDate]);

  /* ── handle doctor select ── */
  const pickDoctor = (doc) => {
    setSelDoctor(doc);
    setSelDate('');
    setSelTime('');
    setStep('calendar');
    window.scrollTo({top:0, behavior:'smooth'});
  };

  /* ── handle date select → auto scroll to slots ── */
  const pickDate = (ds) => {
    setSelDate(ds);
    setSelTime('');
  };

  /* ── handle confirm booking ── */
  const confirmBooking = () => {
    const id = `APT-${200 + appointments.length + 1}`;
    const newApt = {
      id,
      doctorId:  selDoctor.id,
      doctor:    selDoctor.name,
      specialty: selDoctor.specialty,
      date:      selDate,
      time:      selTime,
      reason:    form.reason,
      status:    'scheduled',
    };
    setApts(prev => [newApt, ...prev]);
    setNewAptId(id);
    setNotifs(prev => [{
      id: Date.now(),
      msg: `✅ Appointment confirmed! ${selDoctor.name} on ${fmtDateLong(selDate)} at ${fmtTime(selTime)}.`,
      type: 'success',
    }, ...prev]);
    setStep('success');
    window.scrollTo({top:0, behavior:'smooth'});
  };

  /* ── cancel appointment ── */
  const cancelApt = (id) => {
    setApts(prev => prev.map(a => a.id===id ? {...a,status:'cancelled'} : a));
    setNotifs(prev => [{
      id: Date.now(),
      msg: `Your appointment ${id} has been cancelled.`,
      type: 'warn',
    }, ...prev]);
    if (detailApt?.id === id) setDetailApt(null);
  };

  /* ── reset booking flow ── */
  const resetFlow = () => {
    setSelDoctor(null); setSelDate(''); setSelTime('');
    setForm({name:ME.name, contact:ME.contact, email:ME.email, reason:'', notes:''});
    setStep('doctors');
    window.scrollTo({top:0, behavior:'smooth'});
  };

  const filteredApts = aptFilter==='all' ? appointments : appointments.filter(a=>a.status===aptFilter);

  /* ════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════ */
  return (
    <MainLayout title="Book Appointment" subtitle="Schedule a visit with one of our doctors">
      <div className="space-y-6">

        {/* ══ §1 HEADER ══ */}
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
                <p className="text-blue-200 text-sm mt-2 max-w-lg">
                  Select a doctor, choose an available date and time, and confirm your appointment. We'll take care of the rest.
                </p>
              </div>
              <div className="text-right text-sm text-blue-200 space-y-1">
                <div className="flex items-center gap-2 justify-end"><MapPin className="w-3.5 h-3.5"/>{CLINIC.address}</div>
                <div className="flex items-center gap-2 justify-end"><Clock className="w-3.5 h-3.5"/>{CLINIC.hours}</div>
                <div className="flex items-center gap-2 justify-end"><Phone className="w-3.5 h-3.5"/>{CLINIC.phone}</div>
              </div>
            </div>

            {/* Step breadcrumb */}
            <div className="flex items-center gap-1.5 mt-6 flex-wrap">
              {[
                {key:'doctors', label:'1. Doctor'},
                {key:'calendar',label:'2. Schedule'},
                {key:'form',    label:'3. Details'},
                {key:'summary', label:'4. Confirm'},
              ].map((s, i) => {
                const steps = ['doctors','calendar','form','summary','success'];
                const curr = steps.indexOf(step);
                const idx  = steps.indexOf(s.key);
                const done = curr > idx;
                const active = curr === idx;
                return (
                  <React.Fragment key={s.key}>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full transition-all
                      ${done   ? 'bg-white/20 text-white'      :
                        active ? 'bg-white text-blue-700 shadow-sm' :
                                 'text-blue-300'}`}>
                      {done ? '✓ ' : ''}{s.label}
                    </span>
                    {i < 3 && <ChevronRight className="w-3.5 h-3.5 text-blue-400"/>}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        {/* ══ NOTIFICATIONS ══ */}
        {notifs.length > 0 && (
          <div className="space-y-2">
            {notifs.map(n => <Notif key={n.id} {...n} onClose={()=>dismissNotif(n.id)}/>)}
          </div>
        )}

        {/* ══════════════════════════════════════════════
            SUCCESS SCREEN
        ══════════════════════════════════════════════ */}
        {step === 'success' && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center max-w-lg mx-auto">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-green-100">
              <Check className="w-10 h-10 text-green-600" strokeWidth={2.5}/>
            </div>
            <h2 className="text-2xl font-black text-gray-900">Appointment Booked!</h2>
            <p className="text-gray-500 text-sm mt-2">Your appointment has been scheduled. Please arrive 15 minutes early.</p>
            <div className="bg-gray-50 rounded-2xl p-5 mt-6 text-left space-y-3 border border-gray-100">
              {[
                ['Appointment ID', newAptId],
                ['Doctor',         selDoctor?.name],
                ['Specialty',      selDoctor?.specialty],
                ['Date',           selDate ? fmtDateLong(selDate) : ''],
                ['Time',           selTime ? fmtTime(selTime) : ''],
                ['Reason',         form.reason],
              ].map(([l,v])=>(
                <div key={l} className="flex justify-between gap-4 text-sm">
                  <span className="text-gray-400 font-semibold">{l}</span>
                  <span className="text-gray-800 font-bold text-right">{v||'—'}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={resetFlow}
                className="flex-1 py-3 rounded-2xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-200">
                Book Another
              </button>
              <button onClick={()=>setStep('doctors')}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-all">
                View My Appointments
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            §2 DOCTOR SELECTION
        ══════════════════════════════════════════════ */}
        {step === 'doctors' && (
          <div className="space-y-5">
            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300"/>
                <input value={searchDoc} onChange={e=>setSearchDoc(e.target.value)}
                  placeholder="Search doctor or specialty..."
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-300"/>
              </div>
              <div className="flex gap-2 flex-wrap">
                {specialties.map(s => (
                  <button key={s} onClick={()=>setFilterSpec(s)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all
                      ${filterSpec===s ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Doctor cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDoctors.map(doc => {
                const c = DOC_COLORS[doc.color];
                return (
                  <div key={doc.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all p-5 flex flex-col gap-4">
                    {/* Avatar + info */}
                    <div className="flex items-center gap-3">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black flex-shrink-0 ${c.avatar}`}>
                        {doc.name.split(' ').map(n=>n[0]).join('').slice(1,3)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-gray-900 text-sm leading-tight">{doc.name}</p>
                        <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-lg border mt-1 ${c.tag}`}>
                          {doc.specialty}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 leading-relaxed">{doc.bio}</p>

                    {/* Stats */}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1 font-semibold">
                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400"/>{doc.rating}
                      </span>
                      <span className="text-gray-200">|</span>
                      <span>{doc.patients.toLocaleString()} patients</span>
                      <span className="text-gray-200">|</span>
                      <span>{doc.workDays.map(d=>DAYS[d]).join(', ')}</span>
                    </div>

                    <button onClick={()=>pickDoctor(doc)}
                      className={`w-full py-2.5 rounded-xl text-white text-sm font-bold transition-all shadow-sm ${c.btn}`}>
                      Select Doctor
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            §3 + §4 CALENDAR + TIME SLOTS
        ══════════════════════════════════════════════ */}
        {step === 'calendar' && selDoctor && (
          <div className="space-y-5">
            {/* Back */}
            <button onClick={()=>{setStep('doctors');setSelDate('');setSelTime('');}}
              className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors">
              <ChevronLeft className="w-4 h-4"/> Back to Doctors
            </button>

            {/* Selected doctor summary */}
            <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black flex-shrink-0 ${DOC_COLORS[selDoctor.color].avatar}`}>
                {selDoctor.name.split(' ').map(n=>n[0]).join('').slice(1,3)}
              </div>
              <div className="flex-1">
                <p className="font-black text-gray-900">{selDoctor.name}</p>
                <p className="text-sm text-gray-500">{selDoctor.specialty}</p>
                <p className="text-xs text-gray-400 mt-0.5">Available: {selDoctor.workDays.map(d=>DAYS[d]).join(', ')}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-full">
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400"/> {selDoctor.rating}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* §3 Calendar */}
              <div>
                <h3 className="text-sm font-black text-gray-800 mb-3">Select a Date</h3>
                <MiniCalendar doctor={selDoctor} selectedDate={selDate} onSelect={pickDate}/>
              </div>

              {/* §4 Time Slots */}
              <div>
                <h3 className="text-sm font-black text-gray-800 mb-3">
                  {selDate ? `Available Times — ${fmtDateLong(selDate)}` : 'Choose a date first'}
                </h3>

                {!selDate ? (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                    <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3"/>
                    <p className="text-sm text-gray-400 font-medium">Select a date on the calendar to see available time slots.</p>
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
                      {availableSlots.length} slot{availableSlots.length!==1?'s':''} available · 30 minutes each
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {selDoctor.slots.map(slot => {
                        const booked = (BOOKED_SLOTS[`${selDoctor.id}_${selDate}`]||[]).includes(slot);
                        const isSel  = selTime === slot;
                        return (
                          <button
                            key={slot}
                            disabled={booked}
                            onClick={()=>setSelTime(slot)}
                            className={`
                              py-2.5 rounded-xl text-sm font-bold border-2 transition-all
                              ${isSel   ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200' :
                                booked  ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed line-through' :
                                          'bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:text-blue-600'}
                            `}
                          >
                            {fmtTime(slot)}
                            {booked && <span className="block text-[9px] font-normal">Booked</span>}
                          </button>
                        );
                      })}
                    </div>
                    {selTime && (
                      <div className="mt-5">
                        <button
                          onClick={()=>setStep('form')}
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

        {/* ══════════════════════════════════════════════
            §5 APPOINTMENT DETAILS FORM
        ══════════════════════════════════════════════ */}
        {step === 'form' && (
          <div className="space-y-5 max-w-2xl mx-auto">
            <button onClick={()=>setStep('calendar')}
              className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors">
              <ChevronLeft className="w-4 h-4"/> Back to Schedule
            </button>

            {/* Booking summary strip */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-500"/><span className="font-bold text-blue-800">{selDoctor?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500"/><span className="font-bold text-blue-800">{selDate ? fmtDateLong(selDate) : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500"/><span className="font-bold text-blue-800">{selTime ? fmtTime(selTime) : ''}</span>
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

              <button
                disabled={!form.name || !form.contact || !form.reason}
                onClick={()=>setStep('summary')}
                className="w-full py-3.5 rounded-2xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-200 disabled:opacity-40 disabled:cursor-not-allowed">
                Review Appointment →
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            §6 APPOINTMENT SUMMARY
        ══════════════════════════════════════════════ */}
        {step === 'summary' && (
          <div className="max-w-xl mx-auto space-y-5">
            <button onClick={()=>setStep('form')}
              className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors">
              <ChevronLeft className="w-4 h-4"/> Back to Details
            </button>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
              <div className="text-center mb-7">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-7 h-7 text-blue-600"/>
                </div>
                <h2 className="text-xl font-black text-gray-900">Confirm Your Appointment</h2>
                <p className="text-sm text-gray-400 mt-1">Please review before confirming</p>
              </div>

              {/* Summary rows */}
              <div className="space-y-3 bg-gray-50 rounded-2xl p-5 border border-gray-100">
                {[
                  ['Doctor',   selDoctor?.name,             User    ],
                  ['Specialty',selDoctor?.specialty,        Stethoscope],
                  ['Date',     selDate?fmtDateLong(selDate):'', Calendar],
                  ['Time',     selTime?fmtTime(selTime):'', Clock   ],
                  ['Patient',  form.name,                   User    ],
                  ['Contact',  form.contact,                Phone   ],
                  ['Email',    form.email,                  Mail    ],
                  ['Reason',   form.reason,                 FileText],
                  ...(form.notes ? [['Notes', form.notes, FileText]] : []),
                ].map(([l,v,Icon])=>(
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
                <button onClick={confirmBooking}
                  className="flex-1 py-3 rounded-2xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition-all shadow-md shadow-green-200">
                  ✓ Confirm Appointment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            §7 + §8 MY APPOINTMENTS
        ══════════════════════════════════════════════ */}
        {(step === 'doctors' || step === 'success') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600"/> My Appointments
              </h2>
              {/* Filter tabs */}
              <div className="flex gap-1.5 flex-wrap">
                {['all','scheduled','completed','cancelled'].map(f=>(
                  <button key={f} onClick={()=>setAptFilter(f)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all capitalize
                      ${aptFilter===f ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                    {f==='all'?'All':f}
                  </button>
                ))}
              </div>
            </div>

            {filteredApts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3"/>
                <p className="text-sm text-gray-400 font-medium">No appointments found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredApts.map(apt => {
                  const s    = STATUS_CFG[apt.status] || STATUS_CFG.scheduled;
                  const d    = new Date(apt.date+'T00:00:00');
                  const past = apt.date < TODAY;
                  return (
                    <div key={apt.id}
                      className={`bg-white rounded-2xl border shadow-sm p-5 flex items-center gap-4 flex-wrap transition-all hover:shadow-md
                        ${apt.id===newAptId ? 'border-green-300 bg-green-50/30' : 'border-gray-100'}`}>
                      {/* Date block */}
                      <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex flex-col items-center justify-center">
                        <span className="text-xs font-bold text-blue-500 uppercase">{MONTHS[d.getMonth()].slice(0,3)}</span>
                        <span className="text-xl font-black text-blue-700 leading-none">{d.getDate()}</span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-black text-gray-900 text-sm">{apt.doctor}</p>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${s.bg} ${s.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}/>
                            {s.label}
                          </span>
                          {apt.id===newAptId && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">New</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{apt.specialty}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 flex-wrap">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/>{fmtDateLong(apt.date)}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3"/>{fmtTime(apt.time)}</span>
                        </div>
                        {apt.reason && <p className="text-xs text-gray-400 mt-1 italic">"{apt.reason}"</p>}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={()=>setDetailApt(apt===detailApt?null:apt)}
                          className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-300 transition-all"
                          title="View details">
                          <Eye className="w-4 h-4"/>
                        </button>
                        {apt.status==='scheduled' && (
                          <button onClick={()=>cancelApt(apt.id)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-red-500 text-xs font-bold hover:bg-red-50 transition-all"
                            title="Cancel appointment">
                            <X className="w-3.5 h-3.5"/> Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Detail panel */}
            {detailApt && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative">
                <button onClick={()=>setDetailApt(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-all">
                  <X className="w-4 h-4"/>
                </button>
                <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-500"/> Appointment Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {[
                    ['Appointment ID',detailApt.id],
                    ['Doctor',        detailApt.doctor],
                    ['Specialty',     detailApt.specialty],
                    ['Date',          fmtDateLong(detailApt.date)],
                    ['Time',          fmtTime(detailApt.time)],
                    ['Status',        STATUS_CFG[detailApt.status]?.label],
                    ['Reason',        detailApt.reason],
                  ].map(([l,v])=>(
                    <div key={l} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{l}</p>
                      <p className="font-semibold text-gray-800 mt-0.5">{v||'—'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </MainLayout>
  );
}