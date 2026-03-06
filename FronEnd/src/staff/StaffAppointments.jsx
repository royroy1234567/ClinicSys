import React, { useState, useMemo } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  CalendarIcon, Plus, Clock, User, Stethoscope, Search, RefreshCw,
  Eye, X, Check, ChevronDown, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, UserX, Printer, Download,
  PlayCircle, LogIn, Hash, Bell, ClipboardList,
} from 'lucide-react';

/* ═══════════════════════════════════════
   CONSTANTS & HELPERS
═══════════════════════════════════════ */
const TODAY     = new Date().toISOString().split('T')[0];
const PAGE_SIZE = 8;

const STATUS_CFG = {
  scheduled:  { label:'Scheduled',  bg:'bg-blue-100',   text:'text-blue-700',   icon:CalendarIcon },
  checked_in: { label:'Checked-in', bg:'bg-indigo-100', text:'text-indigo-700', icon:LogIn        },
  ongoing:    { label:'Ongoing',    bg:'bg-yellow-100', text:'text-yellow-700', icon:PlayCircle   },
  completed:  { label:'Completed',  bg:'bg-green-100',  text:'text-green-700',  icon:CheckCircle2 },
  cancelled:  { label:'Cancelled',  bg:'bg-red-100',    text:'text-red-600',    icon:XCircle      },
  no_show:    { label:'No-show',    bg:'bg-gray-100',   text:'text-gray-500',   icon:UserX        },
};

const DOCTORS   = ['Dr. Sarah Smith','Dr. Michael Chen','Dr. James Lim','Dr. Reyna Torres','Dr. Ana Reyes'];
const PATIENTS  = ['John Doe','Jane Smith','Robert Johnson','Maria Santos','Carlos Reyes','Ana Cruz','Ben Torres','Carla Mendoza','David Lim','Elena Ramos'];
const APT_TYPES = ['General Consultation','Follow-up','Specialist Consultation','Pediatric Consult','Executive Check-up'];
const STATUSES  = Object.entries(STATUS_CFG).map(([k,v]) => ({ value:k, label:v.label }));

const fmtTime = t => {
  if (!t) return '—';
  const [h,m] = t.split(':');
  const hr = parseInt(h);
  return `${hr>12?hr-12:hr||12}:${m} ${hr>=12?'PM':'AM'}`;
};
const fmtDate = d =>
  d ? new Date(d+'T00:00:00').toLocaleDateString('en-PH',{year:'numeric',month:'short',day:'numeric'}) : '—';

const calcEnd = (start, dur) => {
  if (!start||!dur) return '';
  const [h,m] = start.split(':').map(Number);
  const total = h*60+m+parseInt(dur);
  return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;
};

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

/* ── Demo data ── */
const INIT_APTS = [
  { id:'APT-001', patient:'John Doe',       doctor:'Dr. Sarah Smith',  date:TODAY, start_time:'08:00', end_time:'08:30', type:'General Consultation',    status:'completed',  queue:1,    reason:'Regular checkup',     notes:'' },
  { id:'APT-002', patient:'Jane Smith',     doctor:'Dr. Michael Chen', date:TODAY, start_time:'08:30', end_time:'09:00', type:'Follow-up',               status:'completed',  queue:2,    reason:'Follow-up visit',     notes:'' },
  { id:'APT-003', patient:'Robert Johnson', doctor:'Dr. James Lim',    date:TODAY, start_time:'09:00', end_time:'09:30', type:'General Consultation',    status:'ongoing',    queue:3,    reason:'Blood pressure',      notes:'Bring records' },
  { id:'APT-004', patient:'Maria Santos',   doctor:'Dr. Sarah Smith',  date:TODAY, start_time:'09:30', end_time:'10:00', type:'Follow-up',               status:'checked_in', queue:4,    reason:'Fever & cough',       notes:'' },
  { id:'APT-005', patient:'Carlos Reyes',   doctor:'Dr. Reyna Torres', date:TODAY, start_time:'10:00', end_time:'10:30', type:'Executive Check-up',      status:'scheduled',  queue:null, reason:'Annual physical',     notes:'' },
  { id:'APT-006', patient:'Ana Cruz',       doctor:'Dr. Ana Reyes',    date:TODAY, start_time:'10:30', end_time:'11:00', type:'Specialist Consultation', status:'cancelled',  queue:null, reason:'Skin consult',        notes:'' },
  { id:'APT-007', patient:'Ben Torres',     doctor:'Dr. Michael Chen', date:TODAY, start_time:'11:00', end_time:'11:30', type:'General Consultation',    status:'scheduled',  queue:null, reason:'Diabetes follow-up',  notes:'' },
  { id:'APT-008', patient:'Carla Mendoza',  doctor:'Dr. James Lim',    date:TODAY, start_time:'13:00', end_time:'13:30', type:'General Consultation',    status:'no_show',    queue:null, reason:'Asthma checkup',      notes:'' },
  { id:'APT-009', patient:'David Lim',      doctor:'Dr. Sarah Smith',  date:TODAY, start_time:'13:30', end_time:'14:00', type:'Follow-up',               status:'scheduled',  queue:null, reason:'Post-op visit',       notes:'' },
  { id:'APT-010', patient:'Elena Ramos',    doctor:'Dr. Reyna Torres', date:TODAY, start_time:'14:00', end_time:'14:30', type:'Specialist Consultation', status:'scheduled',  queue:null, reason:'Hypertension',        notes:'' },
];

/* ══════════════════════════════════════
   SHARED COMPONENTS
══════════════════════════════════════ */
const StatusBadge = ({ status }) => {
  const cfg  = STATUS_CFG[status] || STATUS_CFG.scheduled;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${cfg.bg} ${cfg.text}`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
};

const SelectBox = ({ value, onChange, options, placeholder }) => (
  <div className="relative">
    <select value={value} onChange={e=>onChange(e.target.value)} className={`${inputCls} appearance-none pr-8`}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o=><option key={o.value??o} value={o.value??o}>{o.label??o}</option>)}
    </select>
    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
  </div>
);

const FieldRow = ({ label, required, children }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

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

const Pagination = ({ page, totalPages, total, onPage }) => {
  if (totalPages <= 1) return null;
  const start = (page-1)*PAGE_SIZE+1;
  const end   = Math.min(page*PAGE_SIZE, total);
  const pages = [];
  if (totalPages<=7) { for(let i=1;i<=totalPages;i++) pages.push(i); }
  else {
    pages.push(1);
    if (page>3) pages.push('...');
    for(let i=Math.max(2,page-1);i<=Math.min(totalPages-1,page+1);i++) pages.push(i);
    if (page<totalPages-2) pages.push('...');
    pages.push(totalPages);
  }
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
      <p className="text-xs text-gray-400">
        Showing <span className="font-semibold text-gray-600">{start}–{end}</span> of <span className="font-semibold text-gray-600">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button onClick={()=>onPage(page-1)} disabled={page===1}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((p,i)=>p==='...'
          ? <span key={`e${i}`} className="w-7 h-7 flex items-center justify-center text-xs text-gray-400">…</span>
          : <button key={p} onClick={()=>onPage(p)}
              className={`w-7 h-7 rounded-lg text-xs font-semibold ${page===p?'bg-blue-600 text-white shadow-sm':'text-gray-500 hover:bg-gray-200'}`}>{p}</button>
        )}
        <button onClick={()=>onPage(page+1)} disabled={page===totalPages}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════
   BOOK APPOINTMENT MODAL
══════════════════════════════════════ */
const EMPTY_FORM = { patient:'', doctor:'', date:TODAY, start_time:'', duration:'30', type:'General Consultation', reason:'', notes:'' };

function BookModal({ allApts, onClose, onSave, saving }) {
  const [form,   setForm]   = useState({ ...EMPTY_FORM });
  const [errors, setErrors] = useState({});

  const set = (k,v) => { setForm(f=>({...f,[k]:v})); setErrors(e=>({...e,[k]:''})); };

  const handleTimeChange = v => {
    setForm(f=>({...f, start_time:v, end_time:calcEnd(v,f.duration)}));
    setErrors(e=>({...e, start_time:''}));
  };
  const handleDurChange = v =>
    setForm(f=>({...f, duration:v, end_time:calcEnd(f.start_time,v)}));

  const validate = () => {
    const e = {};
    if (!form.patient)    e.patient    = 'Select a patient';
    if (!form.doctor)     e.doctor     = 'Select a doctor';
    if (!form.date)       e.date       = 'Date required';
    if (!form.start_time) e.start_time = 'Start time required';
    if (!form.reason)     e.reason     = 'Reason required';
    const end = calcEnd(form.start_time, form.duration);
    const conflict = allApts.find(a => {
      if (a.date!==form.date || a.doctor!==form.doctor) return false;
      if (['cancelled','no_show'].includes(a.status)) return false;
      return a.start_time<end && a.end_time>form.start_time;
    });
    if (conflict) e.start_time = `Conflict with appt at ${fmtTime(conflict.start_time)}`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ ...form, end_time: calcEnd(form.start_time, form.duration) });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Book New Appointment</h2>
            <p className="text-xs text-gray-400 mt-0.5">Fill in the appointment details below</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <FieldRow label="Patient" required>
            <SelectBox value={form.patient} onChange={v=>set('patient',v)} placeholder="Select patient…" options={PATIENTS.map(p=>({value:p,label:p}))} />
            {errors.patient && <p className="text-xs text-red-500">⚠ {errors.patient}</p>}
          </FieldRow>

          <FieldRow label="Doctor" required>
            <SelectBox value={form.doctor} onChange={v=>set('doctor',v)} placeholder="Select doctor…" options={DOCTORS.map(d=>({value:d,label:d}))} />
            {errors.doctor && <p className="text-xs text-red-500">⚠ {errors.doctor}</p>}
          </FieldRow>

          <div className="grid grid-cols-2 gap-4">
            <FieldRow label="Date" required>
              <input type="date" value={form.date} onChange={e=>set('date',e.target.value)} className={inputCls} />
              {errors.date && <p className="text-xs text-red-500">⚠ {errors.date}</p>}
            </FieldRow>
            <FieldRow label="Start Time" required>
              <input type="time" value={form.start_time} onChange={e=>handleTimeChange(e.target.value)} className={inputCls} />
              {errors.start_time && <p className="text-xs text-red-500">⚠ {errors.start_time}</p>}
            </FieldRow>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FieldRow label="Duration">
              <SelectBox value={form.duration} onChange={handleDurChange}
                options={[{value:'15',label:'15 min'},{value:'30',label:'30 min'},{value:'45',label:'45 min'},{value:'60',label:'1 hour'},{value:'90',label:'1.5 hrs'},{value:'120',label:'2 hours'}]} />
            </FieldRow>
            <FieldRow label="Type">
              <SelectBox value={form.type} onChange={v=>set('type',v)} options={APT_TYPES.map(t=>({value:t,label:t}))} />
            </FieldRow>
          </div>

          {form.start_time && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <p className="text-xs text-blue-700 font-medium">
                {fmtTime(form.start_time)} → {fmtTime(calcEnd(form.start_time, form.duration))} &nbsp;({form.duration} min)
              </p>
            </div>
          )}

          <FieldRow label="Reason for Visit" required>
            <input value={form.reason} onChange={e=>set('reason',e.target.value)}
              placeholder="Chief complaint / purpose of visit…" className={inputCls} />
            {errors.reason && <p className="text-xs text-red-500">⚠ {errors.reason}</p>}
          </FieldRow>

          <FieldRow label="Notes (optional)">
            <textarea value={form.notes} onChange={e=>set('notes',e.target.value)}
              placeholder="Additional notes or instructions…" rows={2}
              className={`${inputCls} resize-none`} />
          </FieldRow>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button onClick={()=>{setForm({...EMPTY_FORM});setErrors({});}}
            className="text-sm text-gray-400 hover:text-gray-600 font-medium flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Reset
          </button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
              {saving
                ? <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />Saving…</>
                : <><Check className="w-4 h-4 mr-1.5" />Save Appointment</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   VIEW MODAL  (read-only)
══════════════════════════════════════ */
function ViewModal({ apt, onClose, onCheckin }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e=>e.stopPropagation()}>

        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Appointment Details</h2>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">{apt.id}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <StatusBadge status={apt.status} />
            {apt.queue && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                <Hash className="w-3 h-3" />Queue {apt.queue}
              </span>
            )}
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            {[
              { Icon:User,         label:'Patient', value:apt.patient },
              { Icon:Stethoscope,                    label:'Doctor',  value:apt.doctor  },
              { Icon:CalendarIcon,                   label:'Date',    value:fmtDate(apt.date) },
              { Icon:Clock,                          label:'Time',    value:`${fmtTime(apt.start_time)} – ${fmtTime(apt.end_time)}` },
              { Icon:ClipboardList,                  label:'Type',    value:apt.type    },
              { Icon:Bell,                           label:'Reason',  value:apt.reason  },
            ].map(r=>(
              <div key={r.label} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <r.Icon className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold">{r.label}</p>
                  <p className="text-sm font-semibold text-gray-800">{r.value||'—'}</p>
                </div>
              </div>
            ))}
          </div>

          {apt.notes && (
            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3">
              <p className="text-xs font-bold text-yellow-700 mb-1">NOTES</p>
              <p className="text-sm text-gray-700">{apt.notes}</p>
            </div>
          )}

          {apt.status==='scheduled' && (
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={()=>{ onCheckin(apt.id); onClose(); }}>
              <LogIn className="w-4 h-4 mr-2" /> Check-in Patient
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   CHECK-IN MODAL
══════════════════════════════════════ */
function CheckinModal({ apt, nextQueue, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
          <LogIn className="w-6 h-6 text-indigo-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 text-center">Check-in Patient</h3>
        <p className="text-sm text-gray-500 text-center mt-1 mb-4">{apt?.patient}</p>

        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-5 text-center">
          <p className="text-xs text-indigo-600 font-bold uppercase tracking-wide mb-1">Assigned Queue Number</p>
          <p className="text-4xl font-black text-indigo-700">{nextQueue}</p>
          <p className="text-xs text-indigo-500 mt-1">{apt?.doctor} · {fmtTime(apt?.start_time)}</p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white border-0" onClick={onConfirm}>
            <Check className="w-4 h-4 mr-1.5" /> Confirm Check-in
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════ */
const StaffAppointments = () => {
  const [apts,       setApts]       = useState(INIT_APTS);
  const [filterDate, setFilterDate] = useState(TODAY);
  const [filterDoc,  setFilterDoc]  = useState('');
  const [filterStat, setFilterStat] = useState('');
  const [filterQ,    setFilterQ]    = useState('');
  const [page,       setPage]       = useState(1);
  const [modal,      setModal]      = useState(null);
  const [saving,     setSaving]     = useState(false);

  const todayApts = apts.filter(a=>a.date===TODAY);
  const kpis = {
    total:     todayApts.length,
    pending:   todayApts.filter(a=>['scheduled','checked_in'].includes(a.status)).length,
    perDoctor: Math.max(...DOCTORS.map(d=>todayApts.filter(a=>a.doctor===d).length)),
    cancelled: todayApts.filter(a=>['cancelled','no_show'].includes(a.status)).length,
  };

  const nextQueue = Math.max(0, ...apts.filter(a=>a.queue).map(a=>a.queue)) + 1;

  const filtered = useMemo(()=>apts.filter(a=>{
    if (filterDate && a.date!==filterDate) return false;
    if (filterDoc  && a.doctor!==filterDoc) return false;
    if (filterStat && a.status!==filterStat) return false;
    if (filterQ) {
      const q = filterQ.toLowerCase();
      return a.patient.toLowerCase().includes(q) || a.doctor.toLowerCase().includes(q) || a.id.toLowerCase().includes(q);
    }
    return true;
  }),[apts,filterDate,filterDoc,filterStat,filterQ]);

  const totalPages = Math.ceil(filtered.length/PAGE_SIZE);
  const paginated  = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  const handleCheckin = (id) => {
    setApts(prev=>prev.map(a=>a.id===id ? {...a, status:'checked_in', queue:nextQueue} : a));
  };

  const handleSave = (form) => {
    setSaving(true);
    setTimeout(()=>{
      const newId = `APT-${String(apts.length+1).padStart(3,'0')}`;
      setApts(prev=>[...prev, { id:newId, ...form, status:'scheduled', queue:null }]);
      setSaving(false);
      setModal(null);
    }, 600);
  };

  const resetFilters = () => { setFilterDate(TODAY); setFilterDoc(''); setFilterStat(''); setFilterQ(''); setPage(1); };

  return (
    <MainLayout title="Appointment Management" subtitle="Manage and schedule patient appointments.">
      <div className="space-y-5">

        {/* ══ DATE + BOOK BUTTON ══ */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <CalendarIcon className="w-3.5 h-3.5 text-blue-500" />
            <span className="font-semibold text-gray-600">
              {new Date().toLocaleDateString('en-PH',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
            </span>
          </div>
          <Button onClick={()=>setModal({type:'add'})} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> Book Appointment
          </Button>
        </div>

        {/* ══ KPI CARDS ══ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard label="Total Today"         value={kpis.total}     icon={CalendarIcon} iconBg="bg-blue-50"   iconColor="text-blue-600" />
          <KPICard label="Pending / Waiting"   value={kpis.pending}   sub="scheduled + checked-in" icon={Clock} iconBg="bg-yellow-50" iconColor="text-yellow-600" />
          <KPICard label="Max Appts / Doctor"  value={kpis.perDoctor} sub={`across ${DOCTORS.length} doctors`} icon={Stethoscope} iconBg="bg-purple-50" iconColor="text-purple-600" />
          <KPICard label="Cancelled / No-show" value={kpis.cancelled} icon={XCircle}      iconBg="bg-red-50"    iconColor="text-red-500" />
        </div>

        {/* ══ SEARCH & FILTERS ══ */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[140px]">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Date</label>
                <input type="date" value={filterDate} onChange={e=>{setFilterDate(e.target.value);setPage(1);}} className={inputCls} />
              </div>
              <div className="relative flex-1 min-w-[180px]">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Search</label>
                <Search className="absolute left-3 bottom-2.5 w-4 h-4 text-gray-400" />
                <input value={filterQ} onChange={e=>{setFilterQ(e.target.value);setPage(1);}}
                  placeholder="Patient name, doctor, or ID…" className={`${inputCls} pl-9`} />
              </div>
              <div className="min-w-[160px]">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Doctor</label>
                <SelectBox value={filterDoc} onChange={v=>{setFilterDoc(v);setPage(1);}}
                  placeholder="All Doctors" options={DOCTORS.map(d=>({value:d,label:d}))} />
              </div>
              <div className="min-w-[140px]">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Status</label>
                <SelectBox value={filterStat} onChange={v=>{setFilterStat(v);setPage(1);}}
                  placeholder="All Status" options={STATUSES} />
              </div>
              <Button variant="outline" size="sm" onClick={resetFilters}>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ══ APPOINTMENT TABLE ══ */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-blue-600" /> Appointments
                <span className="text-xs font-normal text-gray-400 ml-1">
                  {filtered.length} record{filtered.length!==1?'s':''}
                </span>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={()=>window.print()}>
                  <Printer className="w-3 h-3" /> Print
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                  <Download className="w-3 h-3" /> Export
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-gray-100 bg-gray-50">
                    {['Appt ID','Date','Time','Patient','Doctor','Type','Status','Queue No.','Actions'].map(h=>(
                      <th key={h} className="text-left py-2.5 px-3 text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.length===0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-14">
                        <CalendarIcon className="w-10 h-10 mx-auto text-gray-200 mb-2" />
                        <p className="text-sm text-gray-400">No appointments found</p>
                        <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
                          onClick={()=>setModal({type:'add'})}>
                          <Plus className="w-3.5 h-3.5 mr-1.5" /> Book Appointment
                        </Button>
                      </td>
                    </tr>
                  )}
                  {paginated.map(apt=>(
                    <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-xs font-bold text-gray-400 whitespace-nowrap">{apt.id}</td>
                      <td className="py-2.5 px-3 text-xs text-gray-600 whitespace-nowrap">{fmtDate(apt.date)}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <p className="text-xs font-semibold text-gray-800">{fmtTime(apt.start_time)}</p>
                        <p className="text-xs text-gray-400">{fmtTime(apt.end_time)}</p>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-gray-900 whitespace-nowrap">{apt.patient}</td>
                      <td className="py-2.5 px-3 text-xs text-gray-600 whitespace-nowrap">{apt.doctor}</td>
                      <td className="py-2.5 px-3 text-xs text-gray-500 whitespace-nowrap">{apt.type}</td>
                      <td className="py-2.5 px-3"><StatusBadge status={apt.status} /></td>
                      <td className="py-2.5 px-3 text-center">
                        {apt.queue
                          ? <span className="inline-flex w-7 h-7 rounded-full bg-indigo-50 text-indigo-700 text-xs font-black items-center justify-center">{apt.queue}</span>
                          : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1">
                          {/* View — always available */}
                          <button onClick={()=>setModal({type:'view', apt})} title="View Details"
                            className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-300 transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {/* Check-in — scheduled only */}
                          {apt.status==='scheduled' && (
                            <button onClick={()=>setModal({type:'checkin', apt})} title="Check-in Patient"
                              className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-300 transition-colors">
                              <LogIn className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} total={filtered.length} onPage={setPage} />
          </CardContent>
        </Card>

      </div>

      {/* ══ MODALS ══ */}
      {modal?.type==='add' && (
        <BookModal
          allApts={apts}
          onClose={()=>setModal(null)}
          onSave={handleSave}
          saving={saving}
        />
      )}
      {modal?.type==='view' && (
        <ViewModal
          apt={modal.apt}
          onClose={()=>setModal(null)}
          onCheckin={id=>{ handleCheckin(id); }}
        />
      )}
      {modal?.type==='checkin' && (
        <CheckinModal
          apt={modal.apt}
          nextQueue={nextQueue}
          onClose={()=>setModal(null)}
          onConfirm={()=>{ handleCheckin(modal.apt.id); setModal(null); }}
        />
      )}
    </MainLayout>
  );
};

export default StaffAppointments;