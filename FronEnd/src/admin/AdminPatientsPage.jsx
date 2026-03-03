import React, { useState, useMemo } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import {
  Search, Plus, Edit, Trash2, Eye, Phone, Mail, MapPin,
  ChevronDown, X, Check, RefreshCw, Users, UserCheck,
  AlertCircle, Calendar, Stethoscope, ClipboardList,
  Star, Activity, ArrowUpRight, ChevronLeft, ChevronRight,
  Heart, Shield,
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useNavigate } from 'react-router-dom';

/* ══════════════ DEMO DATA ══════════════ */
const DEMO_VISITS = {
  'PAT-001': [
    { date:'2026-03-01', doctor:'Dr. Sarah Smith',  diagnosis:'Hypertension Stage 1',   prescription:'Amlodipine 5mg',   status:'completed' },
    { date:'2026-02-10', doctor:'Dr. Sarah Smith',  diagnosis:'Routine Checkup',         prescription:'Vitamin D 1000IU', status:'completed' },
    { date:'2026-01-15', doctor:'Dr. James Lim',    diagnosis:'Fever (Viral)',            prescription:'Paracetamol 500mg',status:'completed' },
  ],
  'PAT-002': [
    { date:'2026-02-25', doctor:'Dr. Michael Chen', diagnosis:'Diabetes Type 2 Follow-up',prescription:'Metformin 500mg', status:'completed' },
    { date:'2026-01-28', doctor:'Dr. Michael Chen', diagnosis:'Blood sugar monitoring',   prescription:'Insulin (adjust)', status:'completed' },
  ],
  'PAT-003': [
    { date:'2026-03-01', doctor:'Dr. Michael Chen', diagnosis:'Blood Pressure Check',     prescription:'Losartan 50mg',   status:'completed' },
  ],
  'PAT-004': [
    { date:'2026-02-20', doctor:'Dr. Sarah Smith',  diagnosis:'VIP Annual Physical',      prescription:'Multivitamins',   status:'completed' },
    { date:'2025-12-05', doctor:'Dr. Sarah Smith',  diagnosis:'Flu',                      prescription:'Oseltamivir 75mg',status:'completed' },
    { date:'2025-11-10', doctor:'Dr. James Lim',    diagnosis:'Back Pain',                prescription:'Ibuprofen 400mg', status:'completed' },
  ],
};

const DEMO_PATIENTS = [
  { id:'PAT-001', name:'John Doe',       dob:'1980-05-15', gender:'Male',   address:'123 Rizal St., Brgy. Santo Niño, Quezon City', contact:'+63 912 001 0001', email:'john@example.com', emergencyContact:'+63 912 001 9001', emergencyName:'Jane Doe', allergies:'Penicillin', conditions:'Hypertension', notes:'Monitor BP weekly. Low sodium diet advised.', type:'chronic', followup:'Yes', status:'active',   dateRegistered:'2025-01-10', lastVisit:'2026-03-01' },
  { id:'PAT-002', name:'Jane Smith',     dob:'1975-08-22', gender:'Female', address:'456 Mabini Ave., Mandaluyong City',             contact:'+63 912 001 0002', email:'jane@example.com', emergencyContact:'+63 912 001 9002', emergencyName:'Bob Smith', allergies:'Sulfa drugs', conditions:'Diabetes Type 2', notes:'HbA1c monitoring every 3 months.', type:'chronic', followup:'Yes', status:'active',   dateRegistered:'2025-01-15', lastVisit:'2026-02-25' },
  { id:'PAT-003', name:'Robert Johnson', dob:'1990-03-10', gender:'Male',   address:'789 Luna Rd., Makati City',                    contact:'+63 912 001 0003', email:'robert@example.com', emergencyContact:'+63 912 001 9003', emergencyName:'Mary Johnson', allergies:'None known', conditions:'None', notes:'', type:'regular', followup:'No',  status:'active',   dateRegistered:'2025-02-01', lastVisit:'2026-03-01' },
  { id:'PAT-004', name:'Maria Santos',   dob:'1965-12-01', gender:'Female', address:'12 Bonifacio Blvd., Pasig City',                contact:'+63 912 001 0004', email:'maria@example.com', emergencyContact:'+63 912 001 9004', emergencyName:'Jose Santos', allergies:'Aspirin, Shellfish', conditions:'Hypertension, Arthritis', notes:'Quarterly executive check-up. Priority scheduling.', type:'vip', followup:'Yes', status:'active', dateRegistered:'2025-02-10', lastVisit:'2026-02-20' },
  { id:'PAT-005', name:'Carlos Reyes',   dob:'1995-07-30', gender:'Male',   address:'33 Katipunan Ave., Quezon City',                contact:'+63 912 001 0005', email:'carlos@example.com', emergencyContact:'+63 912 001 9005', emergencyName:'Luisa Reyes', allergies:'None', conditions:'Asthma (Mild)', notes:'Has inhaler. Avoid cold environments.', type:'regular', followup:'No', status:'active',   dateRegistered:'2025-03-01', lastVisit:'2026-01-15' },
  { id:'PAT-006', name:'Ana Cruz',       dob:'1988-11-14', gender:'Female', address:'7 Del Pilar St., Caloocan City',                contact:'+63 912 001 0006', email:'ana@example.com', emergencyContact:'+63 912 001 9006', emergencyName:'Pedro Cruz', allergies:'Penicillin', conditions:'Hypertension', notes:'Follow-up overdue.', type:'chronic', followup:'Yes', status:'active',   dateRegistered:'2025-03-15', lastVisit:'2026-02-10' },
  { id:'PAT-007', name:'Ben Torres',     dob:'1978-04-05', gender:'Male',   address:'22 Quezon Blvd., Manila',                      contact:'+63 912 001 0007', email:'ben@example.com', emergencyContact:'+63 912 001 9007', emergencyName:'Rosa Torres', allergies:'None', conditions:'Diabetes Type 2', notes:'Diet strictly monitored.', type:'chronic', followup:'Yes', status:'active',   dateRegistered:'2025-04-01', lastVisit:'2026-01-28' },
  { id:'PAT-008', name:'Carla Mendoza',  dob:'1992-09-20', gender:'Female', address:'55 Aurora Blvd., Cubao, QC',                   contact:'+63 912 001 0008', email:'carla@example.com', emergencyContact:'+63 912 001 9008', emergencyName:'Dante Mendoza', allergies:'None', conditions:'Asthma', notes:'', type:'regular', followup:'No', status:'active',   dateRegistered:'2025-05-01', lastVisit:'2026-02-18' },
  { id:'PAT-009', name:'David Lim',      dob:'1960-02-28', gender:'Male',   address:'88 Taft Ave., Pasay City',                     contact:'+63 912 001 0009', email:'david@example.com', emergencyContact:'+63 912 001 9009', emergencyName:'Susan Lim', allergies:'Ibuprofen', conditions:'Post-op (Hip Replacement)', notes:'Monthly post-op monitoring.', type:'vip', followup:'Yes', status:'active',   dateRegistered:'2025-05-15', lastVisit:'2026-01-15' },
  { id:'PAT-010', name:'Elena Ramos',    dob:'2000-06-18', gender:'Female', address:'14 Roxas Blvd., Manila',                       contact:'+63 912 001 0010', email:'elena@example.com', emergencyContact:'+63 912 001 9010', emergencyName:'Jose Ramos', allergies:'None', conditions:'None', notes:'', type:'regular', followup:'No', status:'inactive', dateRegistered:'2025-06-01', lastVisit:'2025-12-01' },
];

const PAGE_SIZE = 8;

/* ══════════════ HELPERS ══════════════ */
const calcAge = (dob) => {
  if (!dob) return '—';
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
};

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric' });
};

/* ══════════════ SMALL COMPONENTS ══════════════ */
const TYPE_CFG = {
  regular: { label:'Regular', bg:'bg-gray-100',   color:'text-gray-600'   },
  chronic: { label:'Chronic', bg:'bg-orange-100', color:'text-orange-700' },
  vip:     { label:'VIP',     bg:'bg-purple-100', color:'text-purple-700', icon: Star },
};

const TypeBadge = ({ type }) => {
  const cfg = TYPE_CFG[type] || TYPE_CFG.regular;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${cfg.bg} ${cfg.color}`}>
      {cfg.icon && <cfg.icon className="w-3 h-3 fill-current" />}
      {cfg.label}
    </span>
  );
};

const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold
    ${status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
    {status === 'active' ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
    {status === 'active' ? 'Active' : 'Inactive'}
  </span>
);

const ApptStatusBadge = ({ status }) => (
  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize
    ${status === 'completed' ? 'bg-green-100 text-green-700' : status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-700'}`}>
    {status}
  </span>
);

const SelectBox = ({ value, onChange, options }) => (
  <div className="relative">
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
  </div>
);

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
const FieldRow = ({ label, required, children, half }) => (
  <div className={`space-y-1.5 ${half ? '' : ''}`}>
    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

/* ══════════════ ADD / EDIT MODAL ══════════════ */
const EMPTY_FORM = {
  name:'', dob:'', gender:'', address:'', contact:'', email:'',
  emergencyContact:'', emergencyName:'', allergies:'', conditions:'',
  notes:'', type:'regular', followup:'No', status:'active',
};

function PatientModal({ mode, patient, onClose, onSave }) {
  const isEdit = mode === 'edit';
  const [form, setForm] = useState(isEdit ? { ...patient } : { ...EMPTY_FORM });
  const [errors, setErrors] = useState({});
  const [tab, setTab] = useState('personal');

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = 'Required';
    if (!form.dob)            e.dob     = 'Required';
    if (!form.gender)         e.gender  = 'Required';
    if (!form.contact.trim()) e.contact = 'Required';
    if (!form.address.trim()) e.address = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) { setTab('personal'); return; }
    onSave(form);
  };

  const tabs = [
    { key:'personal', label:'Personal Info',    icon: Users },
    { key:'medical',  label:'Medical Info',     icon: Heart },
    { key:'crm',      label:'CRM Info',         icon: Activity },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Patient' : 'Register New Patient'}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{isEdit ? `Editing: ${patient.name}` : 'Fill in the patient details'}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 flex-shrink-0 px-6">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px
                  ${tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">

          {/* ── Personal ── */}
          {tab === 'personal' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <FieldRow label="Full Name" required>
                  <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Juan dela Cruz" className={inputCls} />
                  {errors.name && <p className="text-xs text-red-500">⚠ {errors.name}</p>}
                </FieldRow>
                <FieldRow label="Date of Birth" required>
                  <input type="date" value={form.dob} onChange={e => set('dob', e.target.value)} className={inputCls} />
                  {errors.dob && <p className="text-xs text-red-500">⚠ {errors.dob}</p>}
                </FieldRow>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FieldRow label="Gender" required>
                  <SelectBox value={form.gender} onChange={v => set('gender', v)}
                    options={[{value:'',label:'Select…'},{value:'Male',label:'Male'},{value:'Female',label:'Female'},{value:'Other',label:'Other'}]} />
                  {errors.gender && <p className="text-xs text-red-500">⚠ {errors.gender}</p>}
                </FieldRow>
                <FieldRow label="Age">
                  <input value={form.dob ? calcAge(form.dob) : ''} readOnly placeholder="Auto-computed"
                    className={`${inputCls} bg-gray-50 text-gray-400`} />
                </FieldRow>
              </div>
              <FieldRow label="Address" required>
                <textarea value={form.address} onChange={e => set('address', e.target.value)}
                  placeholder="Street, Barangay, City" rows={2} className={`${inputCls} resize-none`} />
                {errors.address && <p className="text-xs text-red-500">⚠ {errors.address}</p>}
              </FieldRow>
              <div className="grid grid-cols-2 gap-4">
                <FieldRow label="Contact Number" required>
                  <input type="tel" value={form.contact} onChange={e => set('contact', e.target.value)} placeholder="+63 912 345 6789" className={inputCls} />
                  {errors.contact && <p className="text-xs text-red-500">⚠ {errors.contact}</p>}
                </FieldRow>
                <FieldRow label="Email">
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="juan@email.com" className={inputCls} />
                </FieldRow>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FieldRow label="Emergency Contact Name">
                  <input value={form.emergencyName} onChange={e => set('emergencyName', e.target.value)} placeholder="Full name" className={inputCls} />
                </FieldRow>
                <FieldRow label="Emergency Contact Number">
                  <input type="tel" value={form.emergencyContact} onChange={e => set('emergencyContact', e.target.value)} placeholder="+63 912 345 6789" className={inputCls} />
                </FieldRow>
              </div>
            </>
          )}

          {/* ── Medical ── */}
          {tab === 'medical' && (
            <>
              <FieldRow label="Known Allergies">
                <input value={form.allergies} onChange={e => set('allergies', e.target.value)} placeholder="e.g. Penicillin, Shellfish, None" className={inputCls} />
              </FieldRow>
              <FieldRow label="Existing Conditions">
                <input value={form.conditions} onChange={e => set('conditions', e.target.value)} placeholder="e.g. Hypertension, Diabetes" className={inputCls} />
              </FieldRow>
              <FieldRow label="Medical History Notes">
                <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                  placeholder="Past surgeries, chronic medications, important notes…" rows={4} className={`${inputCls} resize-none`} />
              </FieldRow>
              {isEdit && (
                <FieldRow label="Status">
                  <div className="flex items-center gap-3">
                    <Switch checked={form.status === 'active'} onCheckedChange={v => set('status', v ? 'active' : 'inactive')} />
                    <StatusBadge status={form.status} />
                  </div>
                </FieldRow>
              )}
            </>
          )}

          {/* ── CRM ── */}
          {tab === 'crm' && (
            <>
              <FieldRow label="Patient Type">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key:'regular', label:'Regular', icon: Users,   bg:'bg-gray-50',   border:'border-gray-300',   active:'bg-gray-100 border-gray-500 text-gray-700'   },
                    { key:'chronic', label:'Chronic', icon: Heart,   bg:'bg-orange-50', border:'border-orange-200',  active:'bg-orange-100 border-orange-500 text-orange-700' },
                    { key:'vip',     label:'VIP',     icon: Star,    bg:'bg-purple-50', border:'border-purple-200',  active:'bg-purple-100 border-purple-500 text-purple-700' },
                  ].map(t => {
                    const Icon = t.icon;
                    const sel = form.type === t.key;
                    return (
                      <button key={t.key} type="button" onClick={() => set('type', t.key)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                          ${sel ? t.active : `${t.bg} ${t.border} text-gray-400 hover:border-gray-400`}`}>
                        <Icon className="w-5 h-5" />
                        <span className="text-xs font-bold">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </FieldRow>

              <FieldRow label="Follow-up Required">
                <div className="flex items-center gap-4">
                  {['Yes','No'].map(v => (
                    <label key={v} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="followup" value={v} checked={form.followup === v}
                        onChange={() => set('followup', v)} className="w-4 h-4 text-blue-600" />
                      <span className={`text-sm font-semibold ${v==='Yes'?'text-red-600':'text-gray-600'}`}>{v}</span>
                    </label>
                  ))}
                </div>
              </FieldRow>

              {/* CRM summary box */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" /> CRM Preview
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <TypeBadge type={form.type} />
                  <span className={`text-xs font-semibold ${form.followup==='Yes'?'text-red-600':'text-green-600'}`}>
                    Follow-up: {form.followup}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex-shrink-0">
          <button onClick={() => setForm(isEdit ? { ...patient } : { ...EMPTY_FORM })}
            className="text-sm text-gray-400 hover:text-gray-600 font-medium flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Reset
          </button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Check className="w-4 h-4 mr-1.5" /> {isEdit ? 'Save Changes' : 'Register Patient'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════ VIEW MODAL ══════════════ */
function ViewModal({ patient, onClose, onEdit }) {
  const [tab, setTab] = useState('info');
  const visits = DEMO_VISITS[patient.id] || [];

  const tabs = [
    { key:'info',    label:'Basic Info',    icon: Users         },
    { key:'history', label:'Visit History', icon: Calendar      },
    { key:'crm',     label:'CRM Summary',   icon: Activity      },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0
              ${TYPE_CFG[patient.type]?.bg} ${TYPE_CFG[patient.type]?.color}`}>
              {patient.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">{patient.name}</h2>
                <TypeBadge type={patient.type} />
                <StatusBadge status={patient.status} />
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{patient.id} · {patient.gender} · {calcAge(patient.dob)} yrs</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => onEdit(patient)}>
              <Edit className="w-3.5 h-3.5 mr-1" /> Edit
            </Button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 flex-shrink-0 px-6">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors
                  ${tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>

        <div className="p-6 overflow-y-auto flex-1">

          {/* ── Basic Info ── */}
          {tab === 'info' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['Patient ID',      patient.id],
                  ['Date of Birth',   fmtDate(patient.dob)],
                  ['Age',             `${calcAge(patient.dob)} years old`],
                  ['Gender',          patient.gender],
                  ['Registered',      fmtDate(patient.dateRegistered)],
                  ['Last Visit',      fmtDate(patient.lastVisit)],
                ].map(([k,v]) => (
                  <div key={k} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{k}</p>
                    <p className="text-sm font-bold text-gray-800 mt-0.5">{v}</p>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Contact Information</p>
                <div className="flex items-center gap-2 text-sm text-gray-700"><Phone className="w-4 h-4 text-gray-400" /> {patient.contact}</div>
                {patient.email && <div className="flex items-center gap-2 text-sm text-gray-700"><Mail className="w-4 h-4 text-gray-400" /> {patient.email}</div>}
                <div className="flex items-start gap-2 text-sm text-gray-700"><MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" /> {patient.address}</div>
              </div>

              {(patient.emergencyName || patient.emergencyContact) && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <p className="text-xs text-red-500 font-bold uppercase tracking-wide mb-2">🚨 Emergency Contact</p>
                  <p className="text-sm font-semibold text-gray-800">{patient.emergencyName}</p>
                  <p className="text-sm text-gray-600">{patient.emergencyContact}</p>
                </div>
              )}

              {(patient.allergies || patient.conditions || patient.notes) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-2">
                  <p className="text-xs text-yellow-700 font-bold uppercase tracking-wide">⚕ Medical Notes</p>
                  {patient.allergies && <p className="text-xs text-gray-700"><span className="font-bold">Allergies:</span> {patient.allergies}</p>}
                  {patient.conditions && <p className="text-xs text-gray-700"><span className="font-bold">Conditions:</span> {patient.conditions}</p>}
                  {patient.notes && <p className="text-xs text-gray-700">{patient.notes}</p>}
                </div>
              )}
            </div>
          )}

          {/* ── Visit History ── */}
          {tab === 'history' && (
            <div>
              {visits.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-10 h-10 mx-auto text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400">No visit history recorded</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {visits.map((v, i) => (
                    <div key={i} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-bold text-gray-900">{fmtDate(v.date)}</p>
                          <p className="text-xs text-blue-600 font-semibold mt-0.5">{v.doctor}</p>
                        </div>
                        <ApptStatusBadge status={v.status} />
                      </div>
                      <p className="text-xs text-gray-700"><span className="font-semibold">Diagnosis:</span> {v.diagnosis}</p>
                      <p className="text-xs text-gray-600 mt-1"><span className="font-semibold">Prescription:</span> {v.prescription}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── CRM Summary ── */}
          {tab === 'crm' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label:'Total Visits',      value: visits.length || '—', icon: Calendar,   bg:'bg-blue-50',   color:'text-blue-600'   },
                  { label:'Last Visit',        value: fmtDate(patient.lastVisit),   icon: ClipboardList, bg:'bg-teal-50',   color:'text-teal-600'   },
                  { label:'Patient Type',      value: TYPE_CFG[patient.type]?.label,icon: Activity,     bg:'bg-purple-50', color:'text-purple-600' },
                  { label:'Follow-up Required',value: patient.followup,             icon: AlertCircle,  bg: patient.followup==='Yes'?'bg-red-50':'bg-green-50', color: patient.followup==='Yes'?'text-red-500':'text-green-600' },
                ].map(c => {
                  const Icon = c.icon;
                  return (
                    <div key={c.label} className={`${c.bg} rounded-xl p-4`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{c.label}</p>
                          <p className={`text-xl font-bold mt-1 ${c.color}`}>{c.value}</p>
                        </div>
                        <Icon className={`w-5 h-5 ${c.color}`} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {patient.followup === 'Yes' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-700">Follow-up Required</p>
                    <p className="text-xs text-red-500 mt-0.5">This patient needs a follow-up appointment. Please schedule at the earliest.</p>
                  </div>
                </div>
              )}

              {patient.type === 'chronic' && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
                  <Heart className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-orange-700">Chronic Patient</p>
                    <p className="text-xs text-orange-500 mt-0.5">Requires regular monitoring and scheduled follow-ups.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════ DELETE MODAL ══════════════ */
function DeleteModal({ patient, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6 text-orange-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 text-center mb-1">Deactivate Patient?</h3>
        <p className="text-sm font-bold text-gray-800 text-center mb-3">{patient.name}</p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-5">
          <p className="text-xs text-yellow-700">This patient will be marked as <strong>Inactive</strong>. Their records will be preserved but they won't appear in active searches. You can reactivate them anytime.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 bg-orange-600 hover:bg-orange-700 text-white border-0" onClick={onConfirm}>
            Deactivate
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════ MAIN PAGE ══════════════ */
export default function PatientsPage() {
  const [patients, setPatients]   = useState(DEMO_PATIENTS);
  const [search,   setSearch]     = useState('');
  const [typeFil,  setTypeFil]    = useState('all');
  const [statusFil,setStatusFil]  = useState('active');
  const [modal,    setModal]      = useState(null);
  const [page,     setPage]       = useState(1);
  const { toast } = useToast();

  /* ── analytics ── */
  const total      = patients.length;
  const activeCount= patients.filter(p => p.status === 'active').length;
  const chronic    = patients.filter(p => p.type === 'chronic').length;
  const needFollowup = patients.filter(p => p.followup === 'Yes' && p.status === 'active').length;
  const thisMonth  = patients.filter(p => {
    if (!p.dateRegistered) return false;
    const d = new Date(p.dateRegistered);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  /* ── filters ── */
  const filtered = useMemo(() => {
    return patients.filter(p => {
      if (typeFil   !== 'all'    && p.type   !== typeFil)   return false;
      if (statusFil !== 'all'    && p.status !== statusFil) return false;
      if (search) {
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.contact.includes(q) || p.id.toLowerCase().includes(q);
      }
      return true;
    });
  }, [patients, typeFil, statusFil, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  /* ── handlers ── */
  const handleSave = (form) => {
    if (modal.mode === 'add') {
      const newP = {
        ...form,
        id: `PAT-${String(patients.length+1).padStart(3,'0')}`,
        dateRegistered: new Date().toISOString().split('T')[0],
        lastVisit: '—',
      };
      setPatients(p => [...p, newP]);
      toast({ title: 'Patient registered', description: `${form.name} added successfully.` });
    } else {
      setPatients(p => p.map(x => x.id === modal.patient.id ? { ...x, ...form } : x));
      toast({ title: 'Patient updated', description: `${form.name}'s record saved.` });
    }
    setModal(null);
  };

  const handleDeactivate = () => {
    setPatients(p => p.map(x => x.id === modal.patient.id ? { ...x, status: 'inactive' } : x));
    toast({ title: 'Patient deactivated', description: `${modal.patient.name} marked as inactive.` });
    setModal(null);
  };

  const handleToggleStatus = (id) => {
    setPatients(p => p.map(x => x.id === id ? { ...x, status: x.status==='active'?'inactive':'active' } : x));
  };

  const openView = (patient) => {
    // close any other modal first then open view
    setModal({ mode: 'view', patient });
  };

  const openEdit = (patient) => {
    setModal({ mode: 'edit', patient });
  };

  return (
    <MainLayout title="Patient Records" subtitle="Register, manage and track patient information">
      <div className="space-y-5">

        {/* ══ ANALYTICS CARDS ══ */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label:'Total Patients',   value:total,        icon:Users,       bg:'bg-blue-50',   color:'text-blue-600'   },
            { label:'Active',           value:activeCount,  icon:UserCheck,   bg:'bg-green-50',  color:'text-green-600'  },
            { label:'New This Month',   value:thisMonth,    icon:ArrowUpRight,bg:'bg-teal-50',   color:'text-teal-600'   },
            { label:'Chronic',          value:chronic,      icon:Heart,       bg:'bg-orange-50', color:'text-orange-600' },
            { label:'Need Follow-up',   value:needFollowup, icon:AlertCircle, bg:'bg-red-50',    color:'text-red-500'    },
          ].map(c => {
            const Icon = c.icon;
            return (
              <Card key={c.label}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{c.label}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-0.5">{c.value}</p>
                    </div>
                    <div className={`p-2.5 rounded-xl ${c.bg}`}><Icon className={`w-5 h-5 ${c.color}`} /></div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ══ FILTER BAR ══ */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[220px]">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Search</label>
                <Search className="absolute left-3 bottom-2.5 w-4 h-4 text-gray-400" />
                <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Name, contact, patient ID…" className={`${inputCls} pl-9`} />
              </div>

              {/* Type filter */}
              <div className="min-w-[150px]">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Patient Type</label>
                <SelectBox value={typeFil} onChange={v => { setTypeFil(v); setPage(1); }}
                  options={[{value:'all',label:'All Types'},{value:'regular',label:'Regular'},{value:'chronic',label:'Chronic'},{value:'vip',label:'VIP'}]} />
              </div>

              {/* Status filter */}
              <div className="min-w-[140px]">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Status</label>
                <SelectBox value={statusFil} onChange={v => { setStatusFil(v); setPage(1); }}
                  options={[{value:'all',label:'All Status'},{value:'active',label:'Active'},{value:'inactive',label:'Inactive'}]} />
              </div>

              {/* Reset */}
              <Button variant="outline" size="sm" onClick={() => { setSearch(''); setTypeFil('all'); setStatusFil('active'); setPage(1); }}>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Reset
              </Button>

              <div className="flex-1" />

              {/* Add patient */}
              <Button onClick={() => setModal({ mode:'add' })} className="bg-blue-600 hover:bg-blue-700 text-white" data-testid="add-patient-button">
                <Plus className="w-4 h-4 mr-2" /> Register Patient
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ══ TABLE ══ */}
        <Card data-testid="patients-list-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" /> All Patients
              </CardTitle>
              <span className="text-xs text-gray-400">{filtered.length} record{filtered.length !== 1?'s':''}</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-gray-100 bg-gray-50">
                    {['Full Name','Age/Gender','Type','Last Visit','Visits','Status','Actions'].map(h => (
                      <th key={h} className="text-left py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.length === 0 && (
                    <tr><td colSpan={9} className="text-center py-14">
                      <Users className="w-10 h-10 mx-auto text-gray-200 mb-2" />
                      <p className="text-sm text-gray-400 font-medium">No patients found</p>
                      <p className="text-xs text-gray-300 mt-1">Try adjusting search or filters</p>
                    </td></tr>
                  )}
                  {paginated.map(p => {
                    const visits = DEMO_VISITS[p.id]?.length || 0;
                    return (
                      <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${p.status==='inactive'?'opacity-60':''}`}
                        data-testid={`patient-item-${p.id}`}>
                        
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                              ${TYPE_CFG[p.type]?.bg} ${TYPE_CFG[p.type]?.color}`}>
                              {p.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                            </div>
                            <p className="font-semibold text-gray-900 whitespace-nowrap">{p.name}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <p className="text-gray-800 font-medium">{calcAge(p.dob)} yrs</p>
                          <p className="text-xs text-gray-400">{p.gender}</p>
                        </td> 
                        <td className="py-3 px-4"><TypeBadge type={p.type} /></td>
                        <td className="py-3 px-4 text-xs text-gray-500 whitespace-nowrap">{fmtDate(p.lastVisit)}</td>
                        <td className="py-3 px-4 text-center font-bold text-gray-700">{visits || '—'}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Switch checked={p.status==='active'} onCheckedChange={() => handleToggleStatus(p.id)} />
                            <StatusBadge status={p.status} />
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs gap-1"
                              onClick={() => openView(p)} data-testid={`view-patient-${p.id}`}>
                              <Eye className="w-3 h-3" /> View
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs gap-1"
                              onClick={() => openEdit(p)}>
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs text-orange-500 border-orange-200 hover:bg-orange-50"
                              onClick={() => setModal({ mode:'delete', patient:p })}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_,i) => i+1).map(p => (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-7 h-7 rounded text-xs font-semibold transition-colors
                        ${page===p ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                      {p}
                    </button>
                  ))}
                  <Button size="sm" variant="ghost" onClick={() => setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* ══ MODALS ══ */}
      {(modal?.mode === 'add' || modal?.mode === 'edit') && (
        <PatientModal mode={modal.mode} patient={modal.patient} onClose={() => setModal(null)} onSave={handleSave} />
      )}
      {modal?.mode === 'view' && (
        <ViewModal patient={modal.patient} onClose={() => setModal(null)}
          onEdit={p => setModal({ mode:'edit', patient:p })} />
      )}
      {modal?.mode === 'delete' && (
        <DeleteModal patient={modal.patient} onClose={() => setModal(null)} onConfirm={handleDeactivate} />
      )}
    </MainLayout>
  );
}