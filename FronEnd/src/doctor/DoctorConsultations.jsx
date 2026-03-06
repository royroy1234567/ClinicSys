import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  User, Calendar, Clock, Stethoscope, CheckCircle2, PlayCircle,
  XCircle, ChevronRight, Phone, AlertCircle, Heart, Pill,
  FileText, Bell, Activity, Thermometer, Weight, Droplets,
  Plus, Trash2, Save, Edit, Printer, Check, X, ChevronDown,
  ClipboardList, NotepadText, FlaskConical, CalendarClock,
  ArrowLeft, Badge, RefreshCw, Zap, ChevronLeft, History,
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

/* ═══════════════════════════════════════════════════
   DEMO DATA
═══════════════════════════════════════════════════ */
const APPOINTMENT = {
  id:          'APT-003',
  queueNum:    3,
  date:        'March 4, 2026',
  time:        '09:00 AM',
  endTime:     '09:45 AM',
  status:      'ongoing',
  doctor:      'Dr. Sarah Smith',
  specialty:   'General Medicine',
};

const PATIENT = {
  id:           'PT-0003',
  name:         'Robert Johnson',
  age:          58,
  gender:       'Male',
  contact:      '+63 912 111 0003',
  email:        'r.johnson@email.com',
  address:      '78 Luna Rd., Pasig City',
  totalVisits:  5,
  lastVisit:    'Mar 3, 2026',
  followUp:     false,
  allergies:    ['NSAIDs'],
  conditions:   ['Chest pain (under evaluation)'],
};

const PAST_CONSULTS = [
  { date:'Mar 3, 2026',  diagnosis:'Chest pain evaluation',       prescription:'Nitroglycerin PRN',           followUp:'Pending', status:'completed' },
  { date:'Nov 20, 2025', diagnosis:'Upper respiratory infection',  prescription:'Amoxicillin 500mg x 7 days', followUp:'Done',    status:'completed' },
  { date:'Aug 5, 2025',  diagnosis:'General check-up',             prescription:'Vitamin D3 supplement',       followUp:'None',    status:'completed' },
];

const LAB_OPTIONS = [
  'Complete Blood Count (CBC)',
  'Blood Chemistry (Glucose, Creatinine, Uric Acid)',
  'Lipid Profile',
  'Urinalysis',
  'ECG / 12-lead',
  'Chest X-ray',
  'Echocardiogram',
  'Thyroid Function Test (TSH, FT4)',
  'HbA1c',
  'COVID-19 Antigen',
];

/* ═══════════════════════════════════════════════════
   FORM STEPS
═══════════════════════════════════════════════════ */
const FORM_STEPS = [
  { id: 1, label: 'Chief Complaint', icon: NotepadText,  accent: 'text-rose-500',   color: '#f43f5e' },
  { id: 2, label: 'Vital Signs',     icon: Activity,     accent: 'text-emerald-600', color: '#10b981' },
  { id: 3, label: 'Diagnosis',       icon: Stethoscope,  accent: 'text-blue-600',   color: '#3b82f6' },
  { id: 4, label: 'Prescription',    icon: Pill,         accent: 'text-violet-600', color: '#8b5cf6' },
  { id: 5, label: 'Lab Requests',    icon: FlaskConical, accent: 'text-amber-600',  color: '#f59e0b' },
  { id: 6, label: 'Follow-up & CRM', icon: Bell,         accent: 'text-orange-500', color: '#f97316' },
];

/* ═══════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════ */
const AVATAR_POOL = [
  'bg-blue-100 text-blue-700','bg-teal-100 text-teal-700',
  'bg-violet-100 text-violet-700','bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700','bg-emerald-100 text-emerald-700',
];
const avatarCls = (name) => AVATAR_POOL[name.charCodeAt(0) % AVATAR_POOL.length];
const initials  = (name) => name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();

const STATUS_CFG = {
  scheduled: { label:'Scheduled', dot:'bg-blue-500',   text:'text-blue-700',   bg:'bg-blue-50',   border:'border-blue-200'   },
  ongoing:   { label:'Ongoing',   dot:'bg-yellow-500', text:'text-yellow-700', bg:'bg-yellow-50', border:'border-yellow-300' },
  completed: { label:'Completed', dot:'bg-green-500',  text:'text-green-700',  bg:'bg-green-50',  border:'border-green-200'  },
  cancelled: { label:'Cancelled', dot:'bg-red-400',    text:'text-red-600',    bg:'bg-red-50',    border:'border-red-200'    },
};

const TYPE_CFG = {
  Regular: { bg:'bg-slate-100',  text:'text-slate-600'  },
  Chronic: { bg:'bg-amber-100',  text:'text-amber-700'  },
  VIP:     { bg:'bg-violet-100', text:'text-violet-700' },
};

const inputCls = `w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
  bg-white text-gray-800 placeholder:text-gray-400 transition-all resize-none`;

const labelCls = 'block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5';

const InfoRow = ({ icon: Icon, label, value, accent }) => (
  <div className="flex items-start gap-3">
    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${accent||'bg-gray-100'}`}>
      <Icon className="w-3.5 h-3.5 text-gray-500"/>
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-gray-800 leading-snug">{value || '—'}</p>
    </div>
  </div>
);

const Section = ({ icon: Icon, title, accent='text-blue-600', children, action }) => (
  <Card className="border border-gray-100 shadow-sm">
    <CardHeader className="pb-0 px-5 pt-5">
      <div className="flex items-center justify-between">
        <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Icon className={`w-4 h-4 ${accent}`}/>
          {title}
        </CardTitle>
        {action}
      </div>
    </CardHeader>
    <CardContent className="px-5 pb-5 pt-4">{children}</CardContent>
  </Card>
);

/* ═══════════════════════════════════════════════════
   CONSULTATION HISTORY MODAL
═══════════════════════════════════════════════════ */
function ConsultationHistoryModal({ onClose }) {
  /* Escape key closes */
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  /* Lock body scroll */
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(3px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">

        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <History className="w-5 h-5 text-indigo-600"/>
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900">Consultation History</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {PATIENT.name} · {PATIENT.id} · {PAST_CONSULTS.length} records
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4"/>
          </button>
        </div>

        {/* ── Patient mini-banner ── */}
        <div className="px-6 py-3 bg-gray-50/80 border-b border-gray-100 flex items-center gap-3 flex-wrap flex-shrink-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${avatarCls(PATIENT.name)}`}>
            {initials(PATIENT.name)}
          </div>
          <span className="text-xs font-bold text-gray-700">{PATIENT.age} y/o · {PATIENT.gender}</span>
          <span className="text-xs text-gray-400">
            Total visits: <strong className="text-gray-700">{PATIENT.totalVisits}</strong>
          </span>
          <span className="text-xs text-gray-400">
            Last visit: <strong className="text-gray-700">{PATIENT.lastVisit}</strong>
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_CFG[PATIENT.type]?.bg} ${TYPE_CFG[PATIENT.type]?.text}`}>
            {PATIENT.type}
          </span>
        </div>

        {/* ── Scrollable table ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {PAST_CONSULTS.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="w-10 h-10 text-gray-200 mx-auto mb-3"/>
              <p className="text-sm font-bold text-gray-400">No consultation history found.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  {['Date','Diagnosis','Prescription','Follow-up','Status'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap first:pl-2">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PAST_CONSULTS.map((c, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4 pl-2 whitespace-nowrap">
                      <p className="text-xs font-bold text-gray-700">{c.date}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-xs font-semibold text-gray-800">{c.diagnosis}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-xs text-violet-700 bg-violet-50 px-2 py-0.5 rounded-lg font-medium">
                        <Pill className="w-3 h-3"/>{c.prescription}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full
                        ${c.followUp==='Done'    ? 'bg-green-100 text-green-700'
                        : c.followUp==='Pending' ? 'bg-orange-100 text-orange-700'
                        :                          'bg-gray-100 text-gray-500'}`}>
                        {c.followUp==='Done'    && <CheckCircle2 className="w-3 h-3"/>}
                        {c.followUp==='Pending' && <Bell className="w-3 h-3"/>}
                        {c.followUp}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3"/> Completed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Modal Footer ── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5"/>
            Showing all {PAST_CONSULTS.length} past consultations for this patient.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */
export default function ConsultationPage() {
  const { toast } = useToast();

  const [status,      setStatus]      = useState(APPOINTMENT.status);
  const [formStep,    setFormStep]    = useState(1);
  const [showHistory, setShowHistory] = useState(false);

  const [form, setForm] = useState({
    chiefComplaint: '',
    bp:             '',
    temp:           '',
    hr:             '',
    weight:         '',
    diagnosis:      '',
    notes:          '',
    followUp:       false,
    followUpDate:   '',
    followUpNotes:  '',
    patientType:    PATIENT.type,
  });

  const [meds,       setMeds]       = useState([{ id:1, drug:'', dose:'', freq:'', duration:'' }]);
  const [labText,    setLabText]    = useState('');
  const [labChecked, setLabChecked] = useState([]);
  const [saved,      setSaved]      = useState(false);
  const [completed,  setCompleted]  = useState(false);
  const [cancelled,  setCancelled]  = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addMed    = () => setMeds(m => [...m, { id: Date.now(), drug:'', dose:'', freq:'', duration:'' }]);
  const removeMed = (id) => setMeds(m => m.filter(r => r.id !== id));
  const updateMed = (id, k, v) => setMeds(m => m.map(r => r.id===id ? {...r,[k]:v} : r));
  const toggleLab = (lab) => setLabChecked(prev => prev.includes(lab) ? prev.filter(l=>l!==lab) : [...prev, lab]);

  const goNext = () => {
    if (formStep === 1 && !form.chiefComplaint.trim()) {
      toast({ title:'⚠️ Chief Complaint required', description:'Please enter the reason for visit.', variant:'destructive' });
      return;
    }
    if (formStep === 3 && !form.diagnosis.trim()) {
      toast({ title:'⚠️ Diagnosis required', description:'Please enter a diagnosis before proceeding.', variant:'destructive' });
      return;
    }
    if (formStep < FORM_STEPS.length) setFormStep(s => s + 1);
  };

  const goPrev = () => { if (formStep > 1) setFormStep(s => s - 1); };

  const startConsult = () => {
    setStatus('ongoing');
    toast({ title:'🩺 Consultation started', description:`Now seeing ${PATIENT.name}` });
  };

  const handleSave = () => {
    if (!form.chiefComplaint && !form.diagnosis) {
      toast({ title:'⚠️ Missing fields', description:'Please fill in at least Chief Complaint or Diagnosis.', variant:'destructive' });
      return;
    }
    setSaved(true);
    toast({ title:'💾 Consultation saved', description:'Draft saved successfully.' });
  };

  const handleComplete = () => {
    if (!form.diagnosis) {
      toast({ title:'⚠️ Diagnosis required', description:'Please enter a diagnosis before completing.', variant:'destructive' });
      return;
    }
    setStatus('completed');
    setCompleted(true);
    toast({ title:'✅ Consultation completed', description:`${PATIENT.name}'s visit has been recorded.` });
  };

  const handleCancel = () => {
    setStatus('cancelled');
    setCancelled(true);
    toast({ title:'❌ Consultation cancelled', description:'This appointment has been cancelled.' });
  };

  const handlePrint = () => {
    toast({ title:'🖨 Preparing prescription', description:'Opening print dialog...' });
  };

  const statusCfg   = STATUS_CFG[status] || STATUS_CFG.scheduled;
  const isReadOnly  = completed || cancelled;
  const currentStep = FORM_STEPS[formStep - 1];
  const StepIcon    = currentStep.icon;

  return (
    <MainLayout title="Consultation" subtitle="Record and manage patient consultation details">
      <div className="space-y-5">

        {/* ── Consultation History Modal ── */}
        {showHistory && <ConsultationHistoryModal onClose={() => setShowHistory(false)} />}

        {/* ══════════════════════════════════════════════
            §1  CONSULTATION HEADER
        ══════════════════════════════════════════════ */}
        <div className={`relative rounded-2xl p-6 text-white overflow-hidden
          ${status==='completed' ? 'bg-gradient-to-r from-green-600 to-emerald-700'
          : status==='cancelled' ? 'bg-gradient-to-r from-red-500 to-rose-700'
          : status==='ongoing'   ? 'bg-gradient-to-r from-yellow-500 to-amber-600'
          : 'bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700'}`}>
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none"/>
          <div className="absolute bottom-0 right-10 w-36 h-36 rounded-full bg-white/5 pointer-events-none"/>

          <div className="relative flex items-start justify-between flex-wrap gap-5">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black flex-shrink-0 border-2 border-white/30 ${avatarCls(PATIENT.name)}`}>
                {initials(PATIENT.name)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-black">{PATIENT.name}</h2>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 border border-white/25">
                    {PATIENT.type}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${statusCfg.bg} ${statusCfg.text} border ${statusCfg.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} ${status==='ongoing'?'animate-pulse':''}`}/>
                    {statusCfg.label}
                  </span>
                </div>
                <p className="text-white/80 text-sm mt-0.5">{PATIENT.id} · {PATIENT.age} y/o {PATIENT.gender}</p>
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  <span className="flex items-center gap-1.5 text-white/70 text-xs font-semibold">
                    <Calendar className="w-3.5 h-3.5"/>{APPOINTMENT.date}
                  </span>
                  <span className="flex items-center gap-1.5 text-white/70 text-xs font-semibold">
                    <Clock className="w-3.5 h-3.5"/>{APPOINTMENT.time} – {APPOINTMENT.endTime}
                  </span>
                  <span className="flex items-center gap-1.5 text-white/70 text-xs font-semibold">
                    <Stethoscope className="w-3.5 h-3.5"/>{APPOINTMENT.doctor}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              <div className="flex items-center gap-2 bg-white/15 border border-white/20 rounded-2xl px-4 py-2 backdrop-blur-sm">
                <span className="text-white/60 text-xs font-bold uppercase tracking-wide">Queue</span>
                <span className="text-3xl font-black leading-none">#{APPOINTMENT.queueNum}</span>
              </div>
              {status === 'scheduled' && (
                <Button onClick={startConsult} className="bg-white text-blue-700 hover:bg-blue-50 font-bold gap-2 shadow-sm">
                  <PlayCircle className="w-4 h-4"/> Start Consultation
                </Button>
              )}
              {status === 'ongoing' && (
                <div className="flex items-center gap-1.5 bg-yellow-400/20 border border-yellow-300/30 rounded-xl px-3 py-1.5">
                  <span className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse"/>
                  <span className="text-white text-xs font-bold">In Progress</span>
                </div>
              )}
              {status === 'completed' && (
                <div className="flex items-center gap-1.5 bg-green-400/20 border border-green-300/30 rounded-xl px-3 py-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-200"/>
                  <span className="text-white text-xs font-bold">Visit Completed</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            MAIN 2-COLUMN LAYOUT
        ══════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ─────────────────────────────────
              LEFT COLUMN (1/3) — Patient Info
          ───────────────────────────────── */}
          <div className="space-y-5">
            <Section icon={User} title="Patient Information" accent="text-blue-600">
              <div className="space-y-4">

                {/* Avatar */}
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 ${avatarCls(PATIENT.name)}`}>
                    {initials(PATIENT.name)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{PATIENT.name}</p>
                    <p className="text-xs text-gray-400">{PATIENT.id}</p>
                  </div>
                </div>

                {/* Info rows */}
                <div className="space-y-3.5">
                  <InfoRow icon={User}     label="Age / Gender"  value={`${PATIENT.age} y/o · ${PATIENT.gender}`} />
                  <InfoRow icon={Phone}    label="Contact"       value={PATIENT.contact} />
                  <InfoRow icon={Activity} label="Total Visits"  value={`${PATIENT.totalVisits} visits`} />
                  <InfoRow icon={Calendar} label="Last Visit"    value={PATIENT.lastVisit} />
                </div>

                {/* Allergies */}
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3"/> Allergies
                  </p>
                  {PATIENT.allergies.length === 0
                    ? <p className="text-xs text-gray-400 italic">No known allergies</p>
                    : <div className="flex flex-wrap gap-1.5">
                        {PATIENT.allergies.map(a => (
                          <span key={a} className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
                            <AlertCircle className="w-2.5 h-2.5"/>{a}
                          </span>
                        ))}
                      </div>
                  }
                </div>

                {/* Conditions */}
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <Heart className="w-3 h-3"/> Existing Conditions
                  </p>
                  {PATIENT.conditions.length === 0
                    ? <p className="text-xs text-gray-400 italic">None on record</p>
                    : <div className="flex flex-wrap gap-1.5">
                        {PATIENT.conditions.map(c => (
                          <span key={c} className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">{c}</span>
                        ))}
                      </div>
                  }
                </div>

      

                {/* ── View Consultation History button ── */}
                <div className="pt-3 border-t border-gray-100">
                  <button
                    onClick={() => setShowHistory(true)}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-indigo-100 bg-indigo-50 hover:bg-indigo-100 active:scale-[0.98] transition-all group"
                  >
                    <span className="flex items-center gap-2 text-xs font-bold text-indigo-700">
                      <History className="w-3.5 h-3.5"/>
                      View Consultation History
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 group-hover:bg-indigo-200 text-indigo-500 transition-colors">
                        {PAST_CONSULTS.length} records
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-indigo-400"/>
                    </span>
                  </button>
                </div>

              </div>
            </Section>
          </div>

          {/* ─────────────────────────────────
              RIGHT COLUMN (2/3) — Step-by-step Form
          ───────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* ── Step Progress Indicator ── */}
            <Card className="border border-gray-100 shadow-sm">
              <CardContent className="px-5 py-4">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {FORM_STEPS.map((s, i) => {
                    const done   = formStep > s.id;
                    const active = formStep === s.id;
                    return (
                      <div key={s.id} className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => done && !isReadOnly && setFormStep(s.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all whitespace-nowrap
                            ${active  ? 'text-white border-transparent shadow-sm'
                            : done   ? 'bg-white cursor-pointer hover:opacity-80'
                            :          'bg-gray-50 border-gray-200 text-gray-400 cursor-default'}`}
                          style={
                            active ? { background: s.color, borderColor: s.color }
                            : done ? { color: s.color, borderColor: s.color + '60', background: s.color + '12' }
                            : {}
                          }
                        >
                          <span
                            className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0"
                            style={
                              active ? { background: 'rgba(255,255,255,0.25)', color: '#fff' }
                              : done ? { background: s.color, color: '#fff' }
                              : { background: '#e5e7eb', color: '#9ca3af' }
                            }
                          >
                            {done ? <Check className="w-2.5 h-2.5"/> : s.id}
                          </span>
                          {s.label}
                        </button>
                        {i < FORM_STEPS.length - 1 && (
                          <div className={`w-4 h-0.5 flex-shrink-0 rounded-full ${done ? 'bg-gray-300' : 'bg-gray-100'}`}/>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${((formStep - 1) / (FORM_STEPS.length - 1)) * 100}%`,
                      background: `linear-gradient(90deg, #6366f1, ${currentStep.color})`,
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <p className="text-[10px] font-bold text-gray-400">Step {formStep} of {FORM_STEPS.length}</p>
                  <p className="text-[10px] font-bold text-gray-400">{Math.round(((formStep - 1) / (FORM_STEPS.length - 1)) * 100)}% complete</p>
                </div>
              </CardContent>
            </Card>

            {/* ── Active Step Card ── */}
            <Card className="border border-gray-100 shadow-sm">
              <CardHeader className="pb-0 px-5 pt-5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <StepIcon className="w-4 h-4" style={{ color: currentStep.color }}/>
                    {currentStep.label}
                  </CardTitle>
                  <span className="text-xs text-gray-400 font-medium italic">
                    Step {formStep} of {FORM_STEPS.length}
                    {formStep === 2 && ' · Optional'}
                    {formStep === 5 && ' · Optional'}
                  </span>
                </div>
                <div className="mt-3 h-0.5 rounded-full" style={{ background: currentStep.color + '25' }}/>
              </CardHeader>

              <CardContent className="px-5 pb-5 pt-4">

                {/* STEP 1 — Chief Complaint */}
                {formStep === 1 && (
                  <div>
                    <label className={labelCls}>Reason for Visit <span className="text-red-500">*</span></label>
                    <textarea
                      rows={4}
                      disabled={isReadOnly}
                      value={form.chiefComplaint}
                      onChange={e => set('chiefComplaint', e.target.value)}
                      placeholder='"Fever and sore throat for 3 days, difficulty swallowing"'
                      className={`${inputCls} ${isReadOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                    />
                  </div>
                )}

                {/* STEP 2 — Vital Signs */}
                {formStep === 2 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { key:'bp',     label:'Blood Pressure', placeholder:'120/80', unit:'mmHg', icon:Droplets    },
                      { key:'temp',   label:'Temperature',    placeholder:'36.5',   unit:'°C',   icon:Thermometer },
                      { key:'hr',     label:'Heart Rate',     placeholder:'72',     unit:'bpm',  icon:Activity    },
                      { key:'weight', label:'Weight',         placeholder:'70',     unit:'kg',   icon:Activity    },
                    ].map(v => {
                      const Icon = v.icon;
                      return (
                        <div key={v.key} className="space-y-1.5">
                          <label className={labelCls}>{v.label}</label>
                          <div className="relative">
                            <input
                              type="text"
                              disabled={isReadOnly}
                              value={form[v.key]}
                              onChange={e => set(v.key, e.target.value)}
                              placeholder={v.placeholder}
                              className={`${inputCls} pr-12 ${isReadOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">{v.unit}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* STEP 3 — Diagnosis */}
                {formStep === 3 && (
                  <div className="space-y-4">
                    <div>
                      <label className={labelCls}>Clinical Diagnosis <span className="text-red-500">*</span></label>
                      <textarea
                        rows={3}
                        disabled={isReadOnly}
                        value={form.diagnosis}
                        onChange={e => set('diagnosis', e.target.value)}
                        placeholder='"Acute Pharyngitis, Rule out GERD"'
                        className={`${inputCls} ${isReadOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Doctor's Notes</label>
                      <textarea
                        rows={4}
                        disabled={isReadOnly}
                        value={form.notes}
                        onChange={e => set('notes', e.target.value)}
                        placeholder="Clinical observations, patient instructions, referrals, special notes..."
                        className={`${inputCls} ${isReadOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                      />
                    </div>
                  </div>
                )}

                {/* STEP 4 — Prescription */}
                {formStep === 4 && (
                  <div className="space-y-3">
                    <div className="hidden sm:grid grid-cols-12 gap-2 px-1">
                      {['Drug / Medicine','Dose','Frequency','Duration',''].map((h,i) => (
                        <div key={i} className={`text-[10px] font-bold text-gray-400 uppercase tracking-wide ${i===0?'col-span-4':i===4?'col-span-1':'col-span-2'}`}>
                          {h}
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      {meds.map((med, idx) => (
                        <div key={med.id} className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-12 sm:col-span-4">
                            <input disabled={isReadOnly} value={med.drug}
                              onChange={e => updateMed(med.id,'drug',e.target.value)}
                              placeholder={`Medication ${idx+1}`}
                              className={`${inputCls} ${isReadOnly?'bg-gray-50 text-gray-500 cursor-not-allowed':''}`}/>
                          </div>
                          <div className="col-span-4 sm:col-span-2">
                            <input disabled={isReadOnly} value={med.dose}
                              onChange={e => updateMed(med.id,'dose',e.target.value)}
                              placeholder="500mg"
                              className={`${inputCls} ${isReadOnly?'bg-gray-50 text-gray-500 cursor-not-allowed':''}`}/>
                          </div>
                          <div className="col-span-4 sm:col-span-2">
                            <input disabled={isReadOnly} value={med.freq}
                              onChange={e => updateMed(med.id,'freq',e.target.value)}
                              placeholder="TID"
                              className={`${inputCls} ${isReadOnly?'bg-gray-50 text-gray-500 cursor-not-allowed':''}`}/>
                          </div>
                          <div className="col-span-3 sm:col-span-2">
                            <input disabled={isReadOnly} value={med.duration}
                              onChange={e => updateMed(med.id,'duration',e.target.value)}
                              placeholder="7 days"
                              className={`${inputCls} ${isReadOnly?'bg-gray-50 text-gray-500 cursor-not-allowed':''}`}/>
                          </div>
                          <div className="col-span-1 flex justify-end">
                            {!isReadOnly && meds.length > 1 && (
                              <button onClick={() => removeMed(med.id)}
                                className="w-8 h-8 rounded-lg border border-red-200 flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                                <Trash2 className="w-3.5 h-3.5"/>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {!isReadOnly && (
                      <button onClick={addMed}
                        className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors mt-1 py-1">
                        <Plus className="w-3.5 h-3.5"/> Add Medication
                      </button>
                    )}
                  </div>
                )}

                {/* STEP 5 — Lab Requests */}
                {formStep === 5 && (
                  <div className="space-y-3">
                    <div>
                      <label className={labelCls}>Select Tests</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {LAB_OPTIONS.map(lab => (
                          <label key={lab}
                            className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all text-xs font-semibold
                              ${labChecked.includes(lab)
                                ? 'bg-amber-50 border-amber-300 text-amber-800'
                                : 'bg-gray-50 border-gray-100 text-gray-600 hover:border-gray-300'}`}>
                            <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-all
                              ${labChecked.includes(lab) ? 'bg-amber-500 border-amber-500' : 'border-gray-300 bg-white'}`}>
                              {labChecked.includes(lab) && <Check className="w-2.5 h-2.5 text-white"/>}
                            </div>
                            <input type="checkbox" className="hidden" disabled={isReadOnly}
                              checked={labChecked.includes(lab)} onChange={() => !isReadOnly && toggleLab(lab)}/>
                            {lab}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Additional Lab Notes</label>
                      <textarea
                        rows={2}
                        disabled={isReadOnly}
                        value={labText}
                        onChange={e => setLabText(e.target.value)}
                        placeholder="Other lab requests or special instructions..."
                        className={`${inputCls} ${isReadOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                      />
                    </div>
                  </div>
                )}

                {/* STEP 6 — Follow-up & CRM */}
                {formStep === 6 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div>
                        <p className="text-sm font-bold text-gray-800">Follow-up Required</p>
                        <p className="text-xs text-gray-400 mt-0.5">Schedule a return visit for this patient</p>
                      </div>
                      <button
                        disabled={isReadOnly}
                        onClick={() => set('followUp', !form.followUp)}
                        className={`relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0
                          ${form.followUp ? 'bg-orange-500' : 'bg-gray-300'}
                          ${isReadOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300
                          ${form.followUp ? 'left-6.5 translate-x-1' : 'left-0.5'}`}/>
                      </button>
                    </div>
                    {form.followUp && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className={labelCls}>Follow-up Date <span className="text-red-500">*</span></label>
                          <input type="date" disabled={isReadOnly} value={form.followUpDate}
                            onChange={e => set('followUpDate', e.target.value)}
                            className={`${inputCls} ${isReadOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}/>
                        </div>
                        <div>
                          <label className={labelCls}>Follow-up Notes</label>
                          <input type="text" disabled={isReadOnly} value={form.followUpNotes}
                            onChange={e => set('followUpNotes', e.target.value)}
                            placeholder="Reason for follow-up..."
                            className={`${inputCls} ${isReadOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}/>
                        </div>
                      </div>
                    )}
                    <div>
                      <label className={labelCls}>Suggest Patient Type</label>
                      <p className="text-xs text-gray-400 mb-2">Doctor may suggest. Final tag is confirmed by Admin.</p>
                      <div className="flex gap-2 flex-wrap">
                        {['Regular','Chronic','VIP'].map(t => (
                          <button key={t} disabled={isReadOnly} onClick={() => set('patientType', t)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all
                              ${form.patientType === t
                                ? t==='Regular' ? 'bg-slate-600 text-white border-slate-600'
                                  : t==='Chronic' ? 'bg-amber-500 text-white border-amber-500'
                                  : 'bg-violet-600 text-white border-violet-600'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}
                              ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step nav buttons */}
                {!isReadOnly && (
                  <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-100">
                    <Button
                      variant="outline"
                      onClick={goPrev}
                      disabled={formStep === 1}
                      className="gap-2 border-gray-200 font-bold text-gray-600 disabled:opacity-40">
                      <ChevronLeft className="w-4 h-4"/> Back
                    </Button>
                    {formStep < FORM_STEPS.length ? (
                      <Button
                        onClick={goNext}
                        className="gap-2 font-bold text-white shadow-sm"
                        style={{ background: currentStep.color }}>
                        Continue <ChevronRight className="w-4 h-4"/>
                      </Button>
                    ) : (
                      <span className="text-xs text-gray-400 italic">All steps done — save or complete below ↓</span>
                    )}
                  </div>
                )}

              </CardContent>
            </Card>

          </div>
        </div>

        {/* ══════════════════════════════════════════════
            §6  ACTION BUTTONS
        ══════════════════════════════════════════════ */}
        <Card className="border border-gray-100 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {!isReadOnly && (
                  <Button onClick={handleSave}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-bold shadow-sm shadow-blue-200">
                    <Save className="w-4 h-4"/>
                    {saved ? 'Update Consultation' : 'Save Consultation'}
                  </Button>
                )}
                {!isReadOnly && (
                  <Button onClick={handleComplete}
                    className="bg-green-600 hover:bg-green-700 text-white gap-2 font-bold shadow-sm shadow-green-200">
                    <CheckCircle2 className="w-4 h-4"/> Mark as Completed
                  </Button>
                )}
                <Button variant="outline" onClick={handlePrint} className="gap-2 border-gray-200 font-bold">
                  <Printer className="w-4 h-4 text-gray-500"/> Print Prescription
                </Button>
              </div>
              <div className="flex items-center gap-2">
                {!isReadOnly && (
                  <Button variant="outline" onClick={handleCancel}
                    className="gap-2 border-red-200 text-red-600 hover:bg-red-50 font-bold">
                    <XCircle className="w-4 h-4"/> Cancel Consultation
                  </Button>
                )}
                {completed && (
                  <div className="flex items-center gap-2 text-sm font-bold text-green-600 bg-green-50 px-4 py-2 rounded-xl border border-green-200">
                    <CheckCircle2 className="w-4 h-4"/> Consultation completed & recorded
                  </div>
                )}
                {cancelled && (
                  <div className="flex items-center gap-2 text-sm font-bold text-red-500 bg-red-50 px-4 py-2 rounded-xl border border-red-200">
                    <XCircle className="w-4 h-4"/> This consultation was cancelled
                  </div>
                )}
              </div>
            </div>
            {!isReadOnly && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-start gap-2 text-xs text-gray-400">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"/>
                <p>
                  Saving will create a draft record. <strong>Mark as Completed</strong> to finalize — this updates the patient's CRM visit count, last visit date, and follow-up status.
                  Consultations can only be cancelled or deleted by an administrator.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </MainLayout>
  );
}