import React, { useState, useMemo, useRef, useEffect } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Users, Bell, Clock, UserPlus, CalendarIcon, ChevronDown,
  X, Check, RefreshCw, Stethoscope, Hash, PlayCircle,
  CheckCircle2, UserX, AlertTriangle, Trash2, PhoneCall,
  ChevronRight, Activity, Mic, LayoutGrid, List, Search,
  UserCheck, PlusCircle,
} from 'lucide-react';

/* ═══════════════════════════════
   CONSTANTS
═══════════════════════════════ */
const getNow = () => new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });

const DOCTORS = [
  { id: 'd1', name: 'Dr. Sarah Smith',  specialty: 'General Medicine',  color: 'blue'   },
  { id: 'd2', name: 'Dr. Michael Chen', specialty: 'Pediatrics',        color: 'purple' },
  { id: 'd3', name: 'Dr. James Lim',    specialty: 'General Medicine',  color: 'teal'   },
  { id: 'd4', name: 'Dr. Reyna Torres', specialty: 'Internal Medicine', color: 'rose'   },
  { id: 'd5', name: 'Dr. Ana Reyes',    specialty: 'Dermatology',       color: 'amber'  },
];

const DR_COLORS = {
  blue:   { border: 'border-blue-200',   badge: 'bg-blue-600',   pill: 'bg-blue-100 text-blue-700'     },
  purple: { border: 'border-purple-200', badge: 'bg-purple-600', pill: 'bg-purple-100 text-purple-700' },
  teal:   { border: 'border-teal-200',   badge: 'bg-teal-600',   pill: 'bg-teal-100 text-teal-700'     },
  rose:   { border: 'border-rose-200',   badge: 'bg-rose-600',   pill: 'bg-rose-100 text-rose-700'     },
  amber:  { border: 'border-amber-200',  badge: 'bg-amber-500',  pill: 'bg-amber-100 text-amber-700'   },
};

const STATUS_CFG = {
  waiting:   { label: 'Waiting',   bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-400' },
  called:    { label: 'Called',    bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
  ongoing:   { label: 'Ongoing',   bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500'  },
  completed: { label: 'Completed', bg: 'bg-gray-100',   text: 'text-gray-500',   dot: 'bg-gray-400'   },
  no_show:   { label: 'No-show',   bg: 'bg-red-100',    text: 'text-red-600',    dot: 'bg-red-500'    },
};

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

let _counter = 9;

/* ── Patient master list (simulating a DB of known patients) ── */
const PATIENT_DB = [
  { id: 'P001', name: 'John Doe',       contact: '+63 917 1001001', lastVisit: '2025-06-10', doctor: 'Dr. Sarah Smith'  },
  { id: 'P002', name: 'Jane Smith',     contact: '+63 918 2002002', lastVisit: '2025-06-15', doctor: 'Dr. Michael Chen' },
  { id: 'P003', name: 'Robert Johnson', contact: '+63 919 3003003', lastVisit: '2025-05-20', doctor: 'Dr. James Lim'    },
  { id: 'P004', name: 'Maria Santos',   contact: '+63 912 0001',    lastVisit: '2025-06-18', doctor: 'Dr. Sarah Smith'  },
  { id: 'P005', name: 'Carlos Reyes',   contact: '+63 915 5005005', lastVisit: '2025-04-30', doctor: 'Dr. Reyna Torres' },
  { id: 'P006', name: 'Ana Cruz',       contact: '+63 917 0002',    lastVisit: '2025-06-01', doctor: 'Dr. Ana Reyes'    },
  { id: 'P007', name: 'Ben Torres',     contact: '+63 920 7007007', lastVisit: '2025-03-12', doctor: 'Dr. Michael Chen' },
  { id: 'P008', name: 'Carla Mendoza',  contact: '+63 919 0003',    lastVisit: '2025-06-05', doctor: 'Dr. James Lim'    },
  { id: 'P009', name: 'Ramon Bautista', contact: '+63 916 9009009', lastVisit: '2025-05-08', doctor: 'Dr. Sarah Smith'  },
  { id: 'P010', name: 'Liza Navarro',   contact: '+63 917 1010010', lastVisit: '2025-02-22', doctor: 'Dr. Ana Reyes'    },
  { id: 'P011', name: 'Eduardo Flores', contact: '+63 918 1111011', lastVisit: '2025-06-12', doctor: 'Dr. Reyna Torres' },
  { id: 'P012', name: 'Grace Villanueva', contact: '+63 912 1212012', lastVisit: '2025-01-15', doctor: 'Dr. James Lim' },
];

const INIT_QUEUE = [
  { id: 'Q001', num: 1, name: 'John Doe',       contact: '',             doctor: 'Dr. Sarah Smith',  type: 'appointment', reason: 'Regular checkup',    status: 'completed', arrival: '08:00' },
  { id: 'Q002', num: 2, name: 'Jane Smith',      contact: '',             doctor: 'Dr. Michael Chen', type: 'appointment', reason: 'Follow-up visit',    status: 'completed', arrival: '08:15' },
  { id: 'Q003', num: 3, name: 'Robert Johnson',  contact: '',             doctor: 'Dr. James Lim',    type: 'appointment', reason: 'Blood pressure',     status: 'completed', arrival: '09:00' },
  { id: 'Q004', num: 4, name: 'Maria Santos',    contact: '+63 912 0001', doctor: 'Dr. Sarah Smith',  type: 'walkin',      reason: 'Fever & cough',      status: 'ongoing',   arrival: '09:20' },
  { id: 'Q005', num: 5, name: 'Carlos Reyes',    contact: '',             doctor: 'Dr. Reyna Torres', type: 'appointment', reason: 'Annual physical',    status: 'called',    arrival: '10:00' },
  { id: 'Q006', num: 6, name: 'Ana Cruz',        contact: '+63 917 0002', doctor: 'Dr. Ana Reyes',    type: 'walkin',      reason: 'Skin rash',          status: 'waiting',   arrival: '10:15' },
  { id: 'Q007', num: 7, name: 'Ben Torres',      contact: '',             doctor: 'Dr. Michael Chen', type: 'appointment', reason: 'Diabetes follow-up', status: 'waiting',   arrival: '11:00' },
  { id: 'Q008', num: 8, name: 'Carla Mendoza',   contact: '+63 919 0003', doctor: 'Dr. James Lim',    type: 'walkin',      reason: 'Asthma checkup',     status: 'waiting',   arrival: '11:15' },
];

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

const TypeBadge = ({ type }) =>
  type === 'walkin'
    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-orange-100 text-orange-700"><UserPlus className="w-3 h-3" />Walk-in</span>
    : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700"><CalendarIcon className="w-3 h-3" />Appt</span>;

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
   Searchable combobox that looks
   up PATIENT_DB, or lets you type
   a brand-new patient name.
═══════════════════════════════ */
function PatientSearchInput({ value, contact, onSelect, onNewPatient }) {
  const [query,       setQuery]       = useState(value || '');
  const [open,        setOpen]        = useState(false);
  const [isNew,       setIsNew]       = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const wrapRef = useRef(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return PATIENT_DB.filter(p =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.contact.includes(query)
    ).slice(0, 6);
  }, [query]);

  // Close dropdown on outside click
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
    onSelect({ name: p.name, contact: p.contact, suggestedDoctor: p.doctor });
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
    if (val.trim() === '') {
      onSelect({ name: '', contact: '', suggestedDoctor: '' });
    } else {
      onNewPatient(val); // keep name in sync even without selecting
    }
  };

  const handleKeyDown = (e) => {
    if (!open) return;
    const total = results.length + 1; // +1 for "Add new" option
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
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          value={query}
          onChange={handleChange}
          onFocus={() => { if (query.trim()) setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder="Search existing patient or type new name…"
          className={`${inputCls} pl-9 pr-9`}
          autoFocus
          autoComplete="off"
        />
        {/* Indicator badge */}
        {query && (
          <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            isNew ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
          }`}>
            {isNew ? 'NEW' : value ? '✓' : ''}
          </span>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          {/* Existing matches */}
          {results.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 pt-2.5 pb-1">Existing Patients</p>
              {results.map((p, i) => (
                <button
                  key={p.id}
                  onMouseDown={() => pickPatient(p)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${highlighted === i ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400 truncate">{p.contact} · Last visit: {p.lastVisit}</p>
                  </div>
                  <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                    {p.doctor.replace('Dr. ', '')}
                  </span>
                </button>
              ))}
              <div className="border-t border-gray-100 mx-2" />
            </div>
          )}

          {/* No match message */}
          {results.length === 0 && query.trim() && (
            <p className="text-xs text-gray-400 px-3 pt-3 pb-1">No existing patient found for "<span className="font-semibold text-gray-600">{query}</span>"</p>
          )}

          {/* Add as new patient option */}
          <button
            onMouseDown={handleUseAsNew}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${highlighted === results.length ? 'bg-orange-50' : 'hover:bg-orange-50'}`}
          >
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
              <PlusCircle className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-orange-700">Add "<span>{query}</span>" as new patient</p>
              <p className="text-xs text-gray-400">Create a new patient record</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════
   WALK-IN MODAL (updated)
═══════════════════════════════ */
const EMPTY_FORM = { name: '', contact: '', doctor: '', reason: '', isExisting: false };

function WalkinModal({ nextNum, preDoctor, onClose, onSave, saving }) {
  const [form,   setForm]   = useState({ ...EMPTY_FORM, doctor: preDoctor || '' });
  const [errors, setErrors] = useState({});

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: '' }));
  };

  // Called when an existing patient is selected from dropdown
  const handlePatientSelect = ({ name, contact, suggestedDoctor }) => {
    setForm(f => ({
      ...f,
      name,
      contact: contact || f.contact,
      doctor: preDoctor || suggestedDoctor || f.doctor,
      isExisting: !!name,
    }));
    setErrors(e => ({ ...e, name: '' }));
  };

  // Called when typing a new name
  const handleNewPatient = (name) => {
    setForm(f => ({ ...f, name, isExisting: false }));
    setErrors(e => ({ ...e, name: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())   e.name   = 'Patient name required';
    if (!form.reason.trim()) e.reason = 'Reason required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Add Walk-in Patient</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Will be assigned Queue <span className="font-bold text-orange-600">#{String(nextNum).padStart(2, '0')}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">

          {/* ── Patient Search ── */}
          <FieldRow label="Patient Name" required>
            <PatientSearchInput
              value={form.name}
              contact={form.contact}
              onSelect={handlePatientSelect}
              onNewPatient={handleNewPatient}
            />
            {/* Existing patient info pill */}
            {form.isExisting && form.name && (
              <div className="flex items-center gap-1.5 mt-1.5 px-2 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                <UserCheck className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                <span className="text-xs font-semibold text-green-700">Existing patient — details pre-filled</span>
              </div>
            )}
            {!form.isExisting && form.name && (
              <div className="flex items-center gap-1.5 mt-1.5 px-2 py-1.5 bg-orange-50 border border-orange-200 rounded-lg">
                <PlusCircle className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                <span className="text-xs font-semibold text-orange-700">New patient — will be added to records</span>
              </div>
            )}
            {errors.name && <p className="text-xs text-red-500">⚠ {errors.name}</p>}
          </FieldRow>

          {/* Contact */}
          <FieldRow label="Contact Number">
            <input
              value={form.contact}
              onChange={e => set('contact', e.target.value)}
              placeholder="+63 9XX XXX XXXX (optional)"
              className={inputCls}
            />
          </FieldRow>

          {/* Doctor */}
          <FieldRow label="Assign Doctor">
            <SelectBox
              value={form.doctor}
              onChange={v => set('doctor', v)}
              placeholder="Any available doctor"
              options={DOCTORS.map(d => ({ value: d.name, label: `${d.name} — ${d.specialty}` }))}
            />
          </FieldRow>

          {/* Reason */}
          <FieldRow label="Reason for Visit" required>
            <input
              value={form.reason}
              onChange={e => set('reason', e.target.value)}
              placeholder="Chief complaint…"
              className={inputCls}
            />
            {errors.reason && <p className="text-xs text-red-500">⚠ {errors.reason}</p>}
          </FieldRow>

          {/* Preview */}
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl bg-orange-500 text-white font-black text-lg flex items-center justify-center">
                {String(nextNum).padStart(2, '0')}
              </span>
              <div>
                <p className="text-sm font-bold text-gray-800">{form.name || 'Patient Name'}</p>
                <p className="text-xs text-gray-400">{form.doctor || 'Doctor TBD'}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <TypeBadge type="walkin" />
              {form.isExisting && (
                <span className="text-[10px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded-full">Existing</span>
              )}
              {!form.isExisting && form.name && (
                <span className="text-[10px] bg-orange-100 text-orange-700 font-bold px-1.5 py-0.5 rounded-full">New</span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => { if (validate()) onSave(form); }}
            disabled={saving}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white border-0"
          >
            {saving
              ? <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />Adding…</>
              : <><Check className="w-4 h-4 mr-1.5" />Add to Queue</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════
   REMOVE MODAL
═══════════════════════════════ */
function RemoveModal({ patient, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 text-center">Remove from Queue?</h3>
        <p className="text-sm text-gray-500 text-center mt-1 mb-4">{patient}</p>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-5 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-600">This will remove the patient from the active queue.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0" onClick={onConfirm}>Remove</Button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════
   DOCTOR QUEUE CARD
═══════════════════════════════ */
function DoctorQueueCard({ doctor, queue, onUpdate, onRemove, onAddWalkin }) {
  const clr      = DR_COLORS[doctor.color] || DR_COLORS.blue;
  const docQueue = queue.filter(q => q.doctor === doctor.name).sort((a, b) => a.num - b.num);
  const serving  = docQueue.find(q => ['ongoing', 'called'].includes(q.status));
  const waiting  = docQueue.filter(q => q.status === 'waiting');
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
            className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 px-2 py-1 rounded-lg border border-orange-200 transition-colors">
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
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm text-white flex-shrink-0 ${serving.status === 'ongoing' ? 'bg-green-500' : 'bg-blue-500'}`}>
                {String(serving.num).padStart(2, '0')}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{serving.name}</p>
                <TypeBadge type={serving.type} />
              </div>
            </div>
            <div className="flex gap-1.5">
              {serving.status === 'called' && (
                <button onClick={() => onUpdate(serving.id, 'ongoing')}
                  className="flex-1 flex items-center justify-center gap-1 text-xs font-bold bg-yellow-500 hover:bg-yellow-600 text-white py-1.5 rounded-lg">
                  <PlayCircle className="w-3 h-3" /> Start
                </button>
              )}
              {serving.status === 'ongoing' && (
                <button onClick={() => onUpdate(serving.id, 'completed')}
                  className="flex-1 flex items-center justify-center gap-1 text-xs font-bold bg-green-600 hover:bg-green-700 text-white py-1.5 rounded-lg">
                  <CheckCircle2 className="w-3 h-3" /> Complete
                </button>
              )}
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
              <button onClick={() => onUpdate(waiting[0].id, 'called')}
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
          {waiting.map((q, idx) => (
            <div key={q.id} className={`flex items-center gap-2 p-2 rounded-xl border ${idx === 0 ? `${clr.pill} border-current` : 'bg-white border-gray-100 hover:bg-gray-50'}`}>
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0 ${idx === 0 ? `${clr.badge} text-white` : 'bg-gray-100 text-gray-600'}`}>
                {String(q.num).padStart(2, '0')}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate">{q.name}</p>
                <TypeBadge type={q.type} />
              </div>
              <div className="flex gap-0.5 flex-shrink-0">
                <button onClick={() => onUpdate(q.id, 'called')} title="Call"
                  className="w-6 h-6 rounded-md border border-gray-200 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-300">
                  <Mic className="w-3 h-3" />
                </button>
                <button onClick={() => onUpdate(q.id, 'no_show')} title="No-show"
                  className="w-6 h-6 rounded-md border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600">
                  <UserX className="w-3 h-3" />
                </button>
                <button onClick={() => onRemove(q.id, q.name)} title="Remove"
                  className="w-6 h-6 rounded-md border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-300">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════
   MAIN PAGE
═══════════════════════════════ */
export default function QueuePanel() {
  const [queue,      setQueue]      = useState(INIT_QUEUE);
  const [viewMode,   setViewMode]   = useState('list');
  const [filterDoc,  setFilterDoc]  = useState('');
  const [filterType, setFilterType] = useState('');
  const [modal,      setModal]      = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [time,       setTime]       = useState(getNow());

  React.useEffect(() => {
    const t = setInterval(() => setTime(getNow()), 60000);
    return () => clearInterval(t);
  }, []);

  const totalWaiting = queue.filter(q => q.status === 'waiting').length;
  const nowServing   = queue.find(q => q.status === 'ongoing') || queue.find(q => q.status === 'called');
  const nextWaiting  = queue.filter(q => q.status === 'waiting').sort((a, b) => a.num - b.num)[0];
  const walkinToday  = queue.filter(q => q.type === 'walkin').length;
  const nextNum      = Math.max(...queue.map(q => q.num), 0) + 1;

  const tableData = useMemo(() => {
    return queue
      .filter(q => {
        if (filterDoc  && q.doctor !== filterDoc)  return false;
        if (filterType && q.type   !== filterType)  return false;
        return true;
      })
      .sort((a, b) => a.num - b.num);
  }, [queue, filterDoc, filterType]);

  const updateStatus = (id, status) =>
    setQueue(prev => prev.map(q => q.id === id ? { ...q, status } : q));

  const removeFromQueue = (id) => {
    setQueue(prev => prev.filter(q => q.id !== id));
    setModal(null);
  };

  const addWalkin = (form) => {
    setSaving(true);
    setTimeout(() => {
      const n = Math.max(...queue.map(q => q.num), 0) + 1;
      setQueue(prev => [...prev, {
        id: `Q${String(_counter).padStart(3, '0')}`,
        num: n,
        name: form.name,
        contact: form.contact,
        doctor: form.doctor || 'TBD',
        type: 'walkin',
        reason: form.reason,
        status: 'waiting',
        arrival: getNow(),
      }]);
      _counter++;
      setSaving(false);
      setModal(null);
    }, 500);
  };

  return (
    <MainLayout title="Patient Queue Management" subtitle="Monitor and manage patient queue in real-time.">
      <div className="space-y-5">

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
            <Button onClick={() => setModal({ type: 'walkin', preDoctor: '' })}
              className="bg-orange-500 hover:bg-orange-600 text-white">
              <UserPlus className="w-4 h-4 mr-2" /> Add Walk-in
            </Button>
          </div>
        </div>

        {/* ── KPI CARDS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard label="Total Waiting"  value={totalWaiting}
            icon={Users} iconBg="bg-blue-50" iconColor="text-blue-600" />
          <KPICard
            label="Now Serving"
            value={nowServing ? `#${String(nowServing.num).padStart(2, '0')}` : '—'}
            sub={nowServing ? `${nowServing.name} · ${nowServing.doctor.replace('Dr. ', '')}` : 'No active patient'}
            icon={Activity} iconBg="bg-green-50" iconColor="text-green-600" accent={!!nowServing} />
          <KPICard
            label="Next in Queue"
            value={nextWaiting ? `#${String(nextWaiting.num).padStart(2, '0')}` : '—'}
            sub={nextWaiting ? nextWaiting.name : 'Queue is clear'}
            icon={Bell} iconBg="bg-yellow-50" iconColor="text-yellow-600" />
          <KPICard label="Walk-ins Today" value={walkinToday}
            icon={UserPlus} iconBg="bg-orange-50" iconColor="text-orange-600" />
        </div>

        {/* ── LEGEND ── */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-6">
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
                  <span className="text-xs font-normal text-gray-400">{tableData.length} patient{tableData.length !== 1 ? 's' : ''}</span>
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <SelectBox value={filterDoc} onChange={v => setFilterDoc(v)}
                    placeholder="All Doctors" className="w-44"
                    options={DOCTORS.map(d => ({ value: d.name, label: d.name }))} />
                  <SelectBox value={filterType} onChange={v => setFilterType(v)}
                    placeholder="All Types" className="w-36"
                    options={[{ value: 'appointment', label: 'Appointment' }, { value: 'walkin', label: 'Walk-in' }]} />
                  <Button variant="outline" size="sm" onClick={() => { setFilterDoc(''); setFilterType(''); }}>
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
                      {['Queue #', 'Patient', 'Type', 'Doctor', 'Reason', 'Arrival', 'Status', 'Actions'].map(h => (
                        <th key={h} className="text-left py-2.5 px-3 text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {tableData.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center py-14">
                          <Users className="w-10 h-10 mx-auto text-gray-200 mb-2" />
                          <p className="text-sm text-gray-400">No patients in queue</p>
                        </td>
                      </tr>
                    )}
                    {tableData.map(q => {
                      const isOngoing = q.status === 'ongoing';
                      const isCalled  = q.status === 'called';
                      const isDone    = ['completed', 'no_show'].includes(q.status);
                      const drColor   = DOCTORS.find(d => d.name === q.doctor)?.color || 'blue';
                      const clr       = DR_COLORS[drColor];
                      return (
                        <tr key={q.id} className={`transition-colors ${isOngoing ? 'bg-green-50/40' : isCalled ? 'bg-blue-50/40' : isDone ? 'opacity-50' : 'hover:bg-gray-50'}`}>
                          <td className="py-3 px-3">
                            <span className={`inline-flex w-9 h-9 rounded-xl items-center justify-center font-black text-sm
                              ${isOngoing ? 'bg-green-500 text-white' : isCalled ? 'bg-blue-500 text-white' : isDone ? 'bg-gray-200 text-gray-400' : 'bg-gray-100 text-gray-700'}`}>
                              {String(q.num).padStart(2, '0')}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <p className="font-semibold text-gray-900 whitespace-nowrap">{q.name}</p>
                            {q.contact && <p className="text-xs text-gray-400">{q.contact}</p>}
                          </td>
                          <td className="py-3 px-3"><TypeBadge type={q.type} /></td>
                          <td className="py-3 px-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${clr.pill}`}>
                              <Stethoscope className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate max-w-[100px]">{q.doctor.replace('Dr. ', '')}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3 text-xs text-gray-500 max-w-[130px]">
                            <span className="block truncate">{q.reason}</span>
                          </td>
                          <td className="py-3 px-3 text-xs text-gray-500 whitespace-nowrap">{q.arrival}</td>
                          <td className="py-3 px-3"><StatusBadge status={q.status} /></td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1">
                              {q.status === 'waiting' && (
                                <button onClick={() => updateStatus(q.id, 'called')} title="Call Patient"
                                  className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-300 transition-colors">
                                  <Mic className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {q.status === 'called' && (
                                <button onClick={() => updateStatus(q.id, 'ongoing')} title="Start Consultation"
                                  className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-yellow-600 hover:border-yellow-300 transition-colors">
                                  <PlayCircle className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {q.status === 'ongoing' && (
                                <button onClick={() => updateStatus(q.id, 'completed')} title="Mark Completed"
                                  className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-green-600 hover:border-green-300 transition-colors">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {['waiting', 'called'].includes(q.status) && (
                                <button onClick={() => updateStatus(q.id, 'no_show')} title="Mark No-show"
                                  className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
                                  <UserX className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {!isDone && (
                                <button onClick={() => setModal({ type: 'remove', id: q.id, name: q.name })} title="Remove"
                                  className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-300 transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
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

        {/* ── PER DOCTOR VIEW ── */}
        {viewMode === 'doctor' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {DOCTORS.map(doctor => (
              <DoctorQueueCard
                key={doctor.id}
                doctor={doctor}
                queue={queue}
                onUpdate={updateStatus}
                onRemove={(id, name) => setModal({ type: 'remove', id, name })}
                onAddWalkin={(docName) => setModal({ type: 'walkin', preDoctor: docName })}
              />
            ))}
          </div>
        )}

      </div>

      {/* ── MODALS ── */}
      {modal?.type === 'walkin' && (
        <WalkinModal
          nextNum={nextNum}
          preDoctor={modal.preDoctor}
          onClose={() => setModal(null)}
          onSave={addWalkin}
          saving={saving}
        />
      )}
      {modal?.type === 'remove' && (
        <RemoveModal
          patient={modal.name}
          onClose={() => setModal(null)}
          onConfirm={() => removeFromQueue(modal.id)}
        />
      )}
    </MainLayout>
  );
}