import React, { useState, useMemo, useRef, useEffect } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { api } from '../services/Api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Users, Bell, Clock, UserPlus, CalendarIcon, ChevronDown,
  X, Check, RefreshCw, Stethoscope, Hash, PlayCircle,
  CheckCircle2, UserX, PhoneCall,
  ChevronRight, Activity, Mic, LayoutGrid, List, Search,
  UserCheck, PlusCircle, Star,
} from 'lucide-react';

/* ═══════════════════════════════
   CONSTANTS
═══════════════════════════════ */
const getNow = () => new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
const getNowHHMM = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
const getTodayLocal = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const DR_COLORS = {
  blue:   { border: 'border-blue-200',   badge: 'bg-blue-600',   pill: 'bg-blue-100 text-blue-700'     },
  purple: { border: 'border-purple-200', badge: 'bg-purple-600', pill: 'bg-purple-100 text-purple-700' },
  teal:   { border: 'border-teal-200',   badge: 'bg-teal-600',   pill: 'bg-teal-100 text-teal-700'     },
  rose:   { border: 'border-rose-200',   badge: 'bg-rose-600',   pill: 'bg-rose-100 text-rose-700'     },
  amber:  { border: 'border-amber-200',  badge: 'bg-amber-500',  pill: 'bg-amber-100 text-amber-700'   },
};
const DR_COLOR_KEYS = Object.keys(DR_COLORS);

const STATUS_CFG = {
  waiting:   { label: 'Waiting',   bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-400' },
  called:    { label: 'Called',    bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
  ongoing:   { label: 'Ongoing',   bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500'  },
  completed: { label: 'Completed', bg: 'bg-gray-100',   text: 'text-gray-500',   dot: 'bg-gray-400'   },
  no_show:   { label: 'No-show',   bg: 'bg-red-100',    text: 'text-red-600',    dot: 'bg-red-500'    },
};

/* ── Priority Config (auto-assigned based on age & type) ── */
const PRIORITY_CFG = {
  senior:      { label: 'Senior (60+)', short: 'S', order: 1, bg: 'bg-rose-100',  text: 'text-rose-700',  border: 'border-rose-300',  dot: 'bg-rose-500',  badge: 'bg-rose-500'  },
  appointment: { label: 'Appointment',  short: 'A', order: 2, bg: 'bg-blue-100',  text: 'text-blue-700',  border: 'border-blue-300',  dot: 'bg-blue-500',  badge: 'bg-blue-600'  },
  walkin:      { label: 'Walk-in',      short: 'W', order: 3, bg: 'bg-gray-100',  text: 'text-gray-600',  border: 'border-gray-300',  dot: 'bg-gray-400',  badge: 'bg-gray-500'  },
};

/* Auto-derive priority: age 60+ = senior regardless of type */
const derivePriority = (age, type = 'walkin') => {
  if (age && parseInt(age) >= 60) return 'senior';
  if (type === 'appointment') return 'appointment';
  return 'walkin';
};

/* Sort queue by priority then by queue number */
const sortByPriority = (list) =>
  [...list].sort((a, b) => {
    const pa = PRIORITY_CFG[a.priority]?.order ?? 99;
    const pb = PRIORITY_CFG[b.priority]?.order ?? 99;
    if (pa !== pb) return pa - pb;
    return a.num - b.num;
  });

const normalizeQueueRow = (row) => {
  const rawPriority = String(row?.priority ?? '').toLowerCase().replace('-', '');
  const rawStatus = String(row?.status ?? '').toLowerCase().replace('-', '_');
  const doctorName = row?.doctor_name || row?.doctor || 'TBD';
  const normalizedDoctor = doctorName === 'TBD' || doctorName.startsWith('Dr.') ? doctorName : `Dr. ${doctorName}`;
  return {
    ...row,
    id: row?.id ?? row?.queue_entry_id,
    num: Number(row?.num ?? row?.queue_number ?? 0),
    name: row?.name ?? row?.patient_name ?? 'Unknown',
    age: row?.age ?? row?.patient_age ?? null,
    contact: row?.contact ?? row?.patient_contact ?? '',
    doctor: normalizedDoctor,
    doctorId: row?.doctor_id ?? null,
    doctorAvailability: String(row?.doctor_availability ?? 'unavailable').toLowerCase(),
    priority: PRIORITY_CFG[rawPriority] ? rawPriority : 'walkin',
    status: STATUS_CFG[rawStatus] ? rawStatus : 'waiting',
    arrival: row?.arrival ?? (row?.arrival_time ? String(row.arrival_time).slice(0, 5) : getNowHHMM()),
  };
};

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';
const toMinutes = (time) => {
  if (!time || !String(time).includes(':')) return null;
  const [h, m] = String(time).split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return (h * 60) + m;
};
const isReadyToCall = (q) => {
  if (q.status !== 'waiting') return false;
  if (q.priority !== 'appointment') return true;
  const now = new Date();
  const nowMinutes = (now.getHours() * 60) + now.getMinutes();
  const arr = toMinutes(q.arrival);
  if (arr == null) return true;
  return nowMinutes >= arr;
};

let _counter = 9;

/* ═══════════════════════════════
   SMALL COMPONENTS
═══════════════════════════════ */
const StatusBadge = ({ status }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG.waiting;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const cfg = PRIORITY_CFG[priority] || PRIORITY_CFG.walkin;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {priority === 'senior'      && <Star className="w-3 h-3" />}
      {priority === 'appointment' && <CalendarIcon className="w-3 h-3" />}
      {priority === 'walkin'      && <UserPlus className="w-3 h-3" />}
      {cfg.label}
    </span>
  );
};

const QueueNumChip = ({ num, status, priority, size = 'md' }) => {
  const cfg        = PRIORITY_CFG[priority] || PRIORITY_CFG.walkin;
  const isOngoing  = status === 'ongoing';
  const isCalled   = status === 'called';
  const isDone     = ['completed', 'no_show'].includes(status);
  const sizeClass  = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
  let bgClass;
  if (isOngoing)     bgClass = 'bg-green-500 text-white';
  else if (isCalled) bgClass = 'bg-blue-600 text-white';
  else if (isDone)   bgClass = 'bg-gray-200 text-gray-400';
  else               bgClass = `${cfg.badge} text-white`;
  return (
    <span className={`inline-flex ${sizeClass} rounded-xl items-center justify-center font-black flex-shrink-0 ${bgClass}`}>
      {String(num).padStart(2, '0')}
    </span>
  );
};

const SelectBox = ({ value, onChange, options, placeholder, className = '' }) => (
  <div className={`relative ${className}`}>
    <select value={value} onChange={e => onChange(e.target.value)} className={`${inputCls} appearance-none pr-8`}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
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

const KPICard = ({ label, value, sub, icon: Icon, iconBg, iconColor, accent }) => (
  <Card className={accent ? 'ring-2 ring-green-300' : ''}>
    <CardContent className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
          <h3 className={`text-2xl font-black mt-0.5 ${accent ? 'text-green-600' : 'text-gray-900'}`}>{value}</h3>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

/* ═══════════════════════════════
   PATIENT SEARCH INPUT
═══════════════════════════════ */
function PatientSearchInput({ value, onSelect, onNewPatient, patients }) {
  const [query,       setQuery]       = useState(value || '');
  const [open,        setOpen]        = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [isNew,       setIsNew]       = useState(false);
  const wrapRef = useRef(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return patients.filter(p =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.contact.includes(query)
    ).slice(0, 6);
  }, [patients, query]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pickPatient = (p) => {
    setQuery(p.name);
    setIsNew(false);
    setOpen(false);
    onSelect({ patientId: p.id, name: p.name, age: p.age, contact: p.contact, suggestedDoctor: p.doctor });
  };

  const handleUseAsNew = () => {
    setIsNew(true);
    setOpen(false);
    onNewPatient(query.trim());
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setIsNew(false);
    setOpen(val.trim().length > 0);
    setHighlighted(-1);
    if (val.trim() === '') onSelect({ patientId: null, name: '', age: '', contact: '', suggestedDoctor: '' });
    else onNewPatient(val);
  };

  const handleKeyDown = (e) => {
    if (!open) return;
    const total = results.length + 1;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted(h => Math.min(h + 1, total - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setHighlighted(h => Math.max(h - 1, -1)); }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (highlighted >= 0 && highlighted < results.length) pickPatient(results[highlighted]);
      else if (highlighted === results.length) handleUseAsNew();
    }
    if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          value={query} onChange={handleChange}
          onFocus={() => { if (query.trim()) setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder="Search existing patient or type new name…"
          className={`${inputCls} pl-9 pr-9`} autoFocus autoComplete="off"
        />
        {query && (
          <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isNew ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
            {isNew ? 'NEW' : value ? '✓' : ''}
          </span>
        )}
      </div>
      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          {results.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 pt-2.5 pb-1">Existing Patients</p>
              {results.map((p, i) => (
                <button key={p.id} onMouseDown={() => pickPatient(p)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${highlighted === i ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400 truncate">Age {p.age} · {p.contact} · Last visit: {p.lastVisit}</p>
                  </div>
                  {p.age >= 60 && (
                    <span className="text-[10px] bg-rose-50 text-rose-600 font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5" /> Senior
                    </span>
                  )}
                </button>
              ))}
              <div className="border-t border-gray-100 mx-2" />
            </div>
          )}
          {results.length === 0 && query.trim() && (
            <p className="text-xs text-gray-400 px-3 pt-3 pb-1">No existing patient found for "<span className="font-semibold text-gray-600">{query}</span>"</p>
          )}
          <button onMouseDown={handleUseAsNew}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${highlighted === results.length ? 'bg-blue-50' : 'hover:bg-blue-50'}`}>
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <PlusCircle className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-blue-700">Add "<span>{query}</span>" as new patient</p>
              <p className="text-xs text-gray-400">Create a new patient record</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════
   WALK-IN MODAL
   Priority is auto-derived from age (60+ = senior)
═══════════════════════════════ */
const EMPTY_FORM = { patientId: null, name: '', age: '', contact: '', reason: '', serviceId: '', isExisting: false };

function WalkinModal({ nextNum, onClose, onSave, saving, patients, services }) {
  const [form,   setForm]   = useState({ ...EMPTY_FORM });
  const [errors, setErrors] = useState({});

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  /* Auto-derive priority for preview */
  const autoPriority = derivePriority(form.age, 'walkin');
  const priCfg       = PRIORITY_CFG[autoPriority];

  const handlePatientSelect = ({ patientId, name, age, contact }) => {
    setForm(f => ({
      ...f,
      patientId: patientId ?? null,
      name,
      age:    age ? String(age) : f.age,
      contact: contact || f.contact,
      isExisting: !!name,
    }));
    setErrors(e => ({ ...e, name: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())   e.name   = 'Patient name required';
    if (!form.reason.trim()) e.reason = 'Reason required';
    if (!form.serviceId)      e.serviceId = 'Please select a service';
    if (form.age && (isNaN(form.age) || parseInt(form.age) < 0 || parseInt(form.age) > 120))
      e.age = 'Enter a valid age (0–120)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const isSenior = form.age && parseInt(form.age) >= 60;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Add Walk-in Patient</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Queue <span className="font-bold text-blue-600">#{String(nextNum).padStart(2, '0')}</span>
                {isSenior && <span className="ml-2 inline-flex items-center gap-1 text-rose-600 font-bold"><Star className="w-3 h-3" /> Senior Priority</span>}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">

          <FieldRow label="Patient Name" required>
            <PatientSearchInput
              value={form.name}
              onSelect={handlePatientSelect}
              onNewPatient={(name) => setForm(f => ({ ...f, patientId: null, name, isExisting: false }))}
              patients={patients}
            />
            {form.isExisting && form.name && (
              <div className="flex items-center gap-1.5 mt-1.5 px-2 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                <UserCheck className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                <span className="text-xs font-semibold text-green-700">Existing patient — details pre-filled</span>
              </div>
            )}
            {!form.isExisting && form.name && (
              <div className="flex items-center gap-1.5 mt-1.5 px-2 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                <PlusCircle className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                <span className="text-xs font-semibold text-blue-700">New patient — will be added to records</span>
              </div>
            )}
            {errors.name && <p className="text-xs text-red-500">⚠ {errors.name}</p>}
          </FieldRow>

          {/* Age field — key for auto-priority */}
          <FieldRow label="Age">
            <div className="relative">
              <input
                type="number" min="0" max="120"
                value={form.age}
                onChange={e => set('age', e.target.value)}
                placeholder="e.g. 65"
                className={inputCls}
              />
              {isSenior && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full">
                  <Star className="w-2.5 h-2.5" /> Senior
                </span>
              )}
            </div>
            {isSenior && (
              <p className="text-xs text-rose-600 font-semibold flex items-center gap-1 mt-1">
                <Star className="w-3 h-3" /> Age 60+ — automatically assigned Senior priority (served first).
              </p>
            )}
            {errors.age && <p className="text-xs text-red-500">⚠ {errors.age}</p>}
          </FieldRow>

          <FieldRow label="Contact Number">
            <input value={form.contact} onChange={e => set('contact', e.target.value)}
              placeholder="+63 9XX XXX XXXX" className={inputCls} />
          </FieldRow>

          <FieldRow label="Reason for Visit" required>
            <input value={form.reason} onChange={e => set('reason', e.target.value)}
              placeholder="Chief complaint…" className={inputCls} />
            {errors.reason && <p className="text-xs text-red-500">⚠ {errors.reason}</p>}
          </FieldRow>

          <FieldRow label="Select Service" required>
            <select
              value={form.serviceId}
              onChange={(e) => set('serviceId', e.target.value)}
              className={inputCls}
            >
              <option value="">Choose a service…</option>
              {(services || []).map((s) => (
                <option key={s.service_id} value={s.service_id}>
                  {s.service_name} - ₱{Number(s.price ?? 0).toLocaleString('en-PH')}
                </option>
              ))}
            </select>
            {errors.serviceId && <p className="text-xs text-red-500">⚠ {errors.serviceId}</p>}
          </FieldRow>

          {/* Preview */}
          <div className={`border rounded-xl p-3 flex items-center justify-between ${priCfg.bg} ${priCfg.border}`}>
            <div className="flex items-center gap-2">
              <span className={`w-9 h-9 rounded-xl text-white font-black text-lg flex items-center justify-center ${priCfg.badge}`}>
                {String(nextNum).padStart(2, '0')}
              </span>
              <div>
                <p className="text-sm font-bold text-gray-800">{form.name || 'Patient Name'}</p>
                <p className="text-xs text-gray-500">Doctor TBD{form.age ? ` · Age ${form.age}` : ''}</p>
              </div>
            </div>
            <PriorityBadge priority={autoPriority} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => { if (validate()) onSave({ ...form, priority: autoPriority }); }}
            disabled={saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-0">
            {saving
              ? <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />Adding…</>
              : <><Check className="w-4 h-4 mr-1.5" />Add Walk-in</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════
   DOCTOR QUEUE CARD
═══════════════════════════════ */
function DoctorQueueCard({ doctor, queue, onUpdate, onAddWalkin, onAssignDoctor }) {
  const clr      = DR_COLORS[doctor.color] || DR_COLORS.blue;
  const docQueue = sortByPriority(queue.filter(q => q.doctor === doctor.name));
  const serving  = docQueue.find(q => ['ongoing', 'called'].includes(q.status));
  const waiting  = docQueue.filter(q => q.status === 'waiting');
  const readyWaiting = waiting.filter(isReadyToCall);
  const done     = docQueue.filter(q => ['completed', 'no_show'].includes(q.status)).length;

  return (
    <Card className={`border-2 ${clr.border} flex flex-col min-w-0`}>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-8 h-8 rounded-lg ${clr.badge} flex items-center justify-center flex-shrink-0`}>
            <Stethoscope className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-gray-900 truncate">{doctor.name}</p>
            <p className="text-xs text-gray-400 truncate">{doctor.specialty}</p>
          </div>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${waiting.length > 0 ? clr.pill : 'bg-gray-100 text-gray-400'}`}>
            {waiting.length} waiting
          </span>
        </div>
        <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
          <div className="text-center">
            <p className="text-xs text-gray-400">Total</p>
            <p className="text-sm font-black text-gray-800">{docQueue.length}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Done</p>
            <p className="text-sm font-black text-green-600">{done}</p>
          </div>
          <div className="flex-1" />
          <button onClick={() => onAddWalkin(doctor.name)}
            className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg border border-blue-200 transition-colors">
            <UserPlus className="w-3 h-3" /> Walk-in
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col">
        {serving ? (
          <div className={`mx-3 mb-2 rounded-xl p-3 ${serving.status === 'ongoing' ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
            <p className={`text-xs font-black uppercase tracking-wide mb-2 ${serving.status === 'ongoing' ? 'text-green-600' : 'text-blue-600'}`}>
              {serving.status === 'ongoing' ? '● Now Serving' : '◎ Called'}
            </p>
            <div className="flex items-center gap-2 mb-2">
              <QueueNumChip num={serving.num} status={serving.status} priority={serving.priority} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900 truncate">{serving.name}</p>
                <PriorityBadge priority={serving.priority} />
              </div>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => onUpdate(serving.id, 'no_show')}
                className="flex items-center justify-center gap-1 text-xs font-bold bg-white border border-gray-300 hover:bg-gray-50 text-gray-600 px-2 py-1.5 rounded-lg">
                <UserX className="w-3 h-3" /> No-show
              </button>
            </div>
          </div>
        ) : (
          <div className="mx-3 mb-2 rounded-xl border border-dashed border-gray-200 p-3 text-center">
            <p className="text-xs text-gray-400">No patient being served</p>
            {waiting.length > 0 && (
              <button onClick={() => readyWaiting[0] && onUpdate(readyWaiting[0].id, 'called')}
                disabled={doctor.availability_status !== 'available'}
                className="mt-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg inline-flex items-center gap-1">
                <PhoneCall className="w-3 h-3" /> Call Next
              </button>
            )}
          </div>
        )}

        <div className="px-3 pb-3 space-y-1.5 overflow-y-auto" style={{ maxHeight: '220px' }}>
          {waiting.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-3">No patients waiting</p>
          )}
          {waiting.map((q, idx) => {
            const pcfg = PRIORITY_CFG[q.priority] || PRIORITY_CFG.walkin;
            return (
              <div key={q.id} className={`flex items-center gap-2 p-2 rounded-xl border ${idx === 0 ? `${pcfg.bg} ${pcfg.border}` : 'bg-white border-gray-100 hover:bg-gray-50'}`}>
                <QueueNumChip num={q.num} status={q.status} priority={q.priority} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">{q.name}</p>
                  <div className="flex items-center gap-1 flex-wrap">
                    <PriorityBadge priority={q.priority} />
                    {q.age && <span className="text-[10px] text-gray-400 font-medium">Age {q.age}</span>}
                  </div>
                </div>
                <div className="flex gap-0.5 flex-shrink-0">
                  <button onClick={() => onUpdate(q.id, 'called')} title="Call"
                    disabled={doctor.availability_status !== 'available' || q.doctor === 'TBD' || !isReadyToCall(q)}
                    className="w-6 h-6 rounded-md border border-gray-200 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-300">
                    <Mic className="w-3 h-3" />
                  </button>
                  <button onClick={() => onUpdate(q.id, 'no_show')} title="No-show"
                    className="w-6 h-6 rounded-md border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600">
                    <UserX className="w-3 h-3" />
                  </button>
                  {q.doctor === 'TBD' && (
                    <button onClick={() => onAssignDoctor(q.id, doctor.id)} title="Assign this doctor"
                      className="px-1.5 h-6 rounded-md border border-blue-200 text-[10px] font-bold text-blue-600 hover:bg-blue-50">
                      Assign
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════
   MAIN PAGE
═══════════════════════════════ */
export default function QueuePanel() {
  const [queue,      setQueue]      = useState([]);
  const [patientsDb, setPatientsDb] = useState([]);
  const [doctorsDb,  setDoctorsDb]  = useState([]);
  const [servicesDb, setServicesDb] = useState([]);
  const [viewMode,   setViewMode]   = useState('list');
  const [filterDoc,  setFilterDoc]  = useState('');
  const [filterPri,  setFilterPri]  = useState('');
  const [filterPatient, setFilterPatient] = useState('');
  const [modal,      setModal]      = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [time,       setTime]       = useState(getNow());
  const [errorMsg,   setErrorMsg]   = useState('');

  useEffect(() => {
    const t = setInterval(() => setTime(getNow()), 60000);
    return () => clearInterval(t);
  }, []);

  const fetchQueueToday = async () => {
    try {
      const rows = await api.queue.getAll(getTodayLocal());
      if (!Array.isArray(rows)) return;
      setQueue(
        rows
          .map(normalizeQueueRow)
          .sort((a, b) => {
            const am = toMinutes(a.arrival) ?? 9999;
            const bm = toMinutes(b.arrival) ?? 9999;
            if (am !== bm) return am - bm;
            return (a.num ?? 0) - (b.num ?? 0);
          })
      );
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    api.patients.getAll('')
      .then((rows) => {
        if (!Array.isArray(rows)) return;
        setPatientsDb(rows.map((p) => ({
          id: p.id,
          name: p.name ?? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim(),
          age: p.age ?? '',
          contact: p.contact ?? p.mobile ?? '',
          lastVisit: p.last_visit ?? '',
          doctor: p.doctor ?? '',
        })));
      })
      .catch((err) => console.error(err));

    api.servics.getAll({ status: 'active' })
      .then((rows) => {
        if (!Array.isArray(rows)) return;
        setServicesDb(rows);
      })
      .catch((err) => console.error(err));
  }, []);

  const fetchDoctors = async () => {
    try {
      const rows = await api.doctors.getAll();
      if (!Array.isArray(rows)) return;
      setDoctorsDb(rows.map((d, i) => ({
        id: d.id ?? `d-${i + 1}`,
        name: d.name?.startsWith('Dr.') ? d.name : `Dr. ${d.name ?? ''}`.trim(),
        specialty: d.specialization || 'General Medicine',
        availability_status: (d.availability_status || 'unavailable').toLowerCase(),
        color: DR_COLOR_KEYS[i % DR_COLOR_KEYS.length],
      })));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchQueueToday();
    fetchDoctors();
    const poll = setInterval(() => {
      fetchQueueToday();
      fetchDoctors();
    }, 10000);
    return () => clearInterval(poll);
  }, []);

  const doctorsForView = useMemo(() => {
    if (doctorsDb.length > 0) return doctorsDb;
    const names = Array.from(new Set(queue.map(q => q.doctor).filter(Boolean)));
    return names.map((name, i) => ({
      id: `qdoc-${i + 1}`,
      name,
      specialty: 'General Medicine',
      color: DR_COLOR_KEYS[i % DR_COLOR_KEYS.length],
    }));
  }, [doctorsDb, queue]);

  const totalWaiting  = queue.filter(q => q.status === 'waiting').length;
  const seniorWaiting = queue.filter(q => q.status === 'waiting' && q.priority === 'senior').length;
  const availableDoctors = doctorsForView.filter(d => d.availability_status === 'available');
  const nextWaiting   = sortByPriority(queue.filter(q => q.status === 'waiting'))[0];
  const nowServing    = queue.find(q => q.status === 'ongoing') || queue.find(q => q.status === 'called');
  const nextNum       = Math.max(...queue.map(q => q.num), 0) + 1;

  const tableData = useMemo(() =>
    sortByPriority(queue.filter(q => {
      if (['completed', 'no_show'].includes(q.status)) return false;
      const patientNeedle = filterPatient.trim().toLowerCase();
      if (patientNeedle) {
        const searchable = `${q.name ?? ''} ${q.contact ?? ''}`.toLowerCase();
        if (!searchable.includes(patientNeedle)) return false;
      }
      if (filterDoc && q.doctor   !== filterDoc) return false;
      if (filterPri && q.priority !== filterPri) return false;
      return true;
    })),
    [queue, filterDoc, filterPri, filterPatient]
  );
  const historyData = useMemo(
    () =>
      [...queue]
        .filter(q => ['completed', 'no_show'].includes(q.status))
        .sort((a, b) => b.num - a.num),
    [queue]
  );

  const updateStatus = async (id, status) => {
    if (['ongoing', 'completed'].includes(status)) return;
    setErrorMsg('');
    setQueue(prev => prev.map(q => q.id === id ? { ...q, status } : q));
    if (!Number.isFinite(Number(id))) return;
    try {
      await api.queue.updateStatus(id, status);
      await fetchQueueToday();
    } catch (err) {
      console.error(err);
      setErrorMsg(err?.message || 'Unable to update queue status.');
      await fetchQueueToday();
    }
  };

  const assignDoctor = async (entryId, doctorId) => {
    if (!Number.isFinite(Number(entryId)) || !Number.isFinite(Number(doctorId))) return;
    setErrorMsg('');
    try {
      await api.queue.assignDoctor(entryId, Number(doctorId));
      await fetchQueueToday();
    } catch (err) {
      console.error(err);
      setErrorMsg(err?.message || 'Unable to assign doctor.');
    }
  };

  const addWalkin = async (form) => {
    setSaving(true);
    const addLocal = () => {
      const n = Math.max(...queue.map(q => q.num), 0) + 1;
      setQueue(prev => [...prev, {
        id:       `Q${String(_counter).padStart(3, '0')}`,
        num:      n,
        name:     form.name,
        age:      form.age || null,
        contact:  form.contact,
        doctor:   'TBD',
        priority: form.priority,   // already derived in modal
        reason:   form.reason,
        status:   'waiting',
        arrival:  getNow(),
      }]);
      _counter++;
    };

    try {
      const created = await api.queue.addWalkin({
        patient_id: form.patientId || null,
        name: form.name,
        age: form.age ? Number(form.age) : null,
        contact: form.contact || null,
        service_id: Number(form.serviceId),
        doctor_id: null,
        priority: form.priority,
      });
      setQueue(prev => [...prev, normalizeQueueRow(created)]);
    } catch (err) {
      console.error(err);
      addLocal();
    } finally {
      setSaving(false);
      setModal(null);
    }
  };

  return (
    <MainLayout title="Patient Queue Management" subtitle="Monitor and manage patient queue in real-time.">
      <div className="space-y-5">
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
            {errorMsg}
          </div>
        )}

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <CalendarIcon className="w-3.5 h-3.5 text-blue-500" />
            <span className="font-semibold text-gray-600">
              {new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <span className="text-gray-300">·</span>
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-semibold text-gray-600">{time}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-gray-100 p-1 rounded-xl gap-1">
              <button onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <List className="w-3.5 h-3.5" /> All Queue
              </button>
              <button onClick={() => setViewMode('doctor')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'doctor' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <LayoutGrid className="w-3.5 h-3.5" /> Per Doctor
              </button>
            </div>
            {/* ── Walk-in button (not "Add Queue") ── */}
            <Button onClick={() => setModal({ type: 'walkin' })}
              className="bg-blue-600 hover:bg-blue-700 text-white">
              <UserPlus className="w-4 h-4 mr-2" /> Add Walk-in
            </Button>
          </div>
        </div>

        {/* ── KPI CARDS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard label="Total Waiting"
            value={totalWaiting}
            sub={seniorWaiting > 0 ? `${seniorWaiting} senior${seniorWaiting > 1 ? 's' : ''}` : undefined}
            icon={Users} iconBg="bg-blue-50" iconColor="text-blue-600" />
          <KPICard
            label="Now Serving"
            value={nowServing ? `#${String(nowServing.num).padStart(2, '0')}` : '—'}
            sub={nowServing ? `${nowServing.name} · ${nowServing.doctor.replace('Dr. ', '')}` : 'No active patient'}
            icon={Activity} iconBg="bg-green-50" iconColor="text-green-600" accent={!!nowServing} />
          <KPICard
            label="Next in Queue"
            value={nextWaiting ? `#${String(nextWaiting.num).padStart(2, '0')}` : '—'}
            sub={nextWaiting ? `${nextWaiting.name} · ${PRIORITY_CFG[nextWaiting.priority]?.label}` : 'Queue is clear'}
            icon={Bell} iconBg="bg-yellow-50" iconColor="text-yellow-600" />
          <KPICard label="Senior Patients"
            value={queue.filter(q => q.priority === 'senior').length}
            sub="age 60+ · highest priority"
            icon={Star} iconBg="bg-rose-50" iconColor="text-rose-500" />
        </div>

        <Card>
          <CardContent className="p-3 flex items-center justify-between text-sm">
            <div>
              <span className="font-semibold text-gray-700">Available doctors right now: {availableDoctors.length}</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {availableDoctors.length > 0 ? availableDoctors.map((d) => (
                  <span key={d.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                    {d.name} · {d.availability_status}
                  </span>
                )) : (
                  <span className="text-xs text-gray-400">No doctor currently available</span>
                )}
              </div>
            </div>
            <span className="text-xs text-gray-500">Only available doctors can be called from queue.</span>
          </CardContent>
        </Card>

        {/* ── LEGEND CARD ── */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-6">

              {/* Status */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Status Legend</p>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(STATUS_CFG).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${v.dot}`} />
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${v.bg} ${v.text}`}>{v.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Queue Flow */}
              <div className="border-l border-gray-100 pl-6">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Queue Flow</p>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 flex-wrap">
                  {['Waiting', 'Called', 'Ongoing', 'Completed'].map((s, i, arr) => (
                    <React.Fragment key={s}>
                      <span className={`px-2 py-0.5 rounded font-bold ${STATUS_CFG[s.toLowerCase()]?.bg} ${STATUS_CFG[s.toLowerCase()]?.text}`}>{s}</span>
                      {i < arr.length - 1 && <ChevronRight className="w-3 h-3 text-gray-300" />}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div className="border-l border-gray-100 pl-6">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Priority Level</p>
                <div className="flex flex-wrap items-center gap-2">
                  {Object.entries(PRIORITY_CFG).map(([key, cfg]) => (
                    <span key={key} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.order}. {cfg.label}
                    </span>
                  ))}
                  <span className="text-xs text-gray-400 font-medium">— Age 60+ auto-assigned as Senior.</span>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* ── ALL QUEUE LIST ── */}
        {viewMode === 'list' && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Hash className="w-5 h-5 text-blue-600" /> Total Queue List
                    <span className="text-xs font-normal text-gray-400">{tableData.length} active patient{tableData.length !== 1 ? 's' : ''}</span>
                  </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative w-52">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    <input
                      value={filterPatient}
                      onChange={(e) => setFilterPatient(e.target.value)}
                      placeholder="Search patient..."
                      className={`${inputCls} pl-8 py-1.5`}
                    />
                  </div>
                  <SelectBox value={filterDoc} onChange={v => setFilterDoc(v)}
                    placeholder="All Doctors" className="w-44"
                    options={doctorsForView.map(d => ({ value: d.name, label: d.name }))} />
                  <SelectBox value={filterPri} onChange={v => setFilterPri(v)}
                    placeholder="All Priority" className="w-36"
                    options={Object.entries(PRIORITY_CFG).map(([k, v]) => ({ value: k, label: v.label }))} />
                  <Button variant="outline" size="sm" onClick={() => { setFilterPatient(''); setFilterDoc(''); setFilterPri(''); }}>
                    <RefreshCw className="w-3.5 h-3.5 mr-1" /> Reset
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-y border-gray-100 bg-gray-50">
                      {['Queue #', 'Patient', 'Age', 'Priority', 'Doctor', 'Reason', 'Arrival', 'Status', 'Actions'].map(h => (
                        <th key={h} className="text-left py-2.5 px-3 text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {tableData.length === 0 && (
                      <tr>
                        <td colSpan={9} className="text-center py-14">
                          <Users className="w-10 h-10 mx-auto text-gray-200 mb-2" />
                          <p className="text-sm text-gray-400">No active patients in queue</p>
                        </td>
                      </tr>
                    )}
                    {tableData.map(q => {
                      const isOngoing = q.status === 'ongoing';
                      const isCalled  = q.status === 'called';
                      const isDone    = ['completed', 'no_show'].includes(q.status);
                      const isSenior  = q.priority === 'senior';
                      const readyToCall = isReadyToCall(q);
                      const drColor   = doctorsForView.find(d => d.name === q.doctor)?.color || 'blue';
                      const clr       = DR_COLORS[drColor];
                      return (
                        <tr key={q.id} className={`transition-colors
                          ${isOngoing ? 'bg-green-50/40' : isCalled ? 'bg-blue-50/40' : isDone ? 'opacity-50' : (readyToCall && q.priority === 'appointment') ? 'bg-emerald-50/50 ring-1 ring-emerald-200' : isSenior ? 'bg-rose-50/30' : 'hover:bg-gray-50'}
                          ${isSenior && !isDone ? 'border-l-2 border-l-rose-400' : ''}`}>
                          <td className="py-3 px-3">
                            <QueueNumChip num={q.num} status={q.status} priority={q.priority} />
                          </td>
                          <td className="py-3 px-3">
                            <p className="font-semibold text-gray-900 whitespace-nowrap">{q.name}</p>
                            {q.contact && <p className="text-xs text-gray-400">{q.contact}</p>}
                          </td>
                          <td className="py-3 px-3 text-xs font-semibold text-gray-600 whitespace-nowrap">
                            {q.age ? (
                              <span className={q.age >= 60 ? 'text-rose-600 font-bold' : ''}>{q.age}</span>
                            ) : '—'}
                          </td>
                          <td className="py-3 px-3">
                            <PriorityBadge priority={q.priority} />
                          </td>
                          <td className="py-3 px-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${clr.pill}`}>
                              <Stethoscope className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate max-w-[100px]">{q.doctor.replace('Dr. ', '')}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3 text-xs text-gray-500 max-w-[130px]">
                            <span className="block truncate">{q.reason}</span>
                          </td>
                          <td className="py-3 px-3 text-xs text-gray-500 whitespace-nowrap">
                            <span>{q.arrival}</span>
                            {q.priority === 'appointment' && (
                              <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${readyToCall ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {readyToCall ? 'Ready' : 'Not yet'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3"><StatusBadge status={q.status} /></td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1">
                              {q.status === 'waiting' && (
                                <button onClick={() => updateStatus(q.id, 'called')} title="Call Patient"
                                  disabled={q.doctor === 'TBD' || q.doctorAvailability !== 'available' || !readyToCall}
                                  className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:border-blue-300 transition-colors">
                                  <Mic className="w-4.5 h-4.5" />
                                </button>
                              )}
                              {q.status === 'waiting' && q.doctor === 'TBD' && (
                                <SelectBox
                                  value=""
                                  onChange={(v) => assignDoctor(q.id, v)}
                                  className="w-40"
                                  placeholder="Assign doctor"
                                  options={doctorsForView
                                    .filter(d => Number.isFinite(Number(d.id)))
                                    .map((d) => ({ value: d.id, label: `${d.name} (${d.availability_status || 'unavailable'})` }))}
                                />
                              )}
                              {['waiting', 'called'].includes(q.status) && (
                                <button onClick={() => updateStatus(q.id, 'no_show')} title="Mark No-show"
                                  className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-600 transition-colors">
                                  <UserX className="w-4.5 h-4.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {viewMode === 'list' && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-gray-500" /> Queue History
                <span className="text-xs font-normal text-gray-400">{historyData.length} patient{historyData.length !== 1 ? 's' : ''}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-y border-gray-100 bg-gray-50">
                      {['Queue #', 'Patient', 'Doctor', 'Status', 'Arrival'].map(h => (
                        <th key={h} className="text-left py-2.5 px-3 text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {historyData.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-sm text-gray-400">No completed history yet</td>
                      </tr>
                    )}
                    {historyData.map(q => (
                      <tr key={`h-${q.id}`} className="bg-gray-50/50">
                        <td className="py-3 px-3"><QueueNumChip num={q.num} status={q.status} priority={q.priority} /></td>
                        <td className="py-3 px-3 font-semibold text-gray-700">{q.name}</td>
                        <td className="py-3 px-3 text-xs text-gray-600">{q.doctor}</td>
                        <td className="py-3 px-3"><StatusBadge status={q.status} /></td>
                        <td className="py-3 px-3 text-xs text-gray-500 whitespace-nowrap">{q.arrival}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── PER DOCTOR VIEW ── */}
        {viewMode === 'doctor' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {doctorsForView.map(doctor => (
              <DoctorQueueCard
                key={doctor.id}
                doctor={doctor}
                queue={queue}
                onUpdate={updateStatus}
                onAssignDoctor={assignDoctor}
                onAddWalkin={() => setModal({ type: 'walkin' })}
              />
            ))}
          </div>
        )}

      </div>

      {/* ── MODALS ── */}
      {modal?.type === 'walkin' && (
        <WalkinModal
          nextNum={nextNum}
          onClose={() => setModal(null)}
          onSave={addWalkin}
          saving={saving}
          patients={patientsDb}
          services={servicesDb}
        />
      )}
    </MainLayout>
  );
}
