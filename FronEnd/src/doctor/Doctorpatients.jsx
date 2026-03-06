import React, { useState, useMemo } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Search, Users, Filter, X, ChevronRight, ChevronLeft, Eye, Phone, Mail,
  MapPin, AlertCircle, Clock, Calendar, FileText, Activity,
  CheckCircle2, Plus, Bell, Stethoscope, ClipboardList,
  ChevronDown, RotateCcw, User, Heart, Pill, NotepadText,
  ArrowUpRight, Check, CalendarClock, ChevronsLeft, ChevronsRight,
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

/* ═══════════════════════════════════════════════════
   DEMO DATA
═══════════════════════════════════════════════════ */
const PATIENTS = [
  {
    id: 'PT-0001', name: 'John Doe',        age: 45, gender: 'Male',   contact: '+63 912 111 0001',
    email: 'john.doe@email.com',             address: '123 Rizal St., Quezon City',
    type: 'Chronic',  totalVisits: 18, lastVisit: '2026-03-04', followUp: true,  nextFollowUp: '2026-03-18',
    allergies: ['Penicillin', 'Aspirin'],
    conditions: ['Hypertension Stage 2', 'Type 2 Diabetes'],
    medicalNotes: 'Patient has been compliant with medication. BP fluctuates during stress periods. Advised to continue low-sodium diet and regular aerobic exercise.',
    visits: [
      { date: '2026-03-04', diagnosis: 'Hypertension monitoring',   prescription: 'Amlodipine 5mg OD',        notes: 'BP 140/90. Adjusted dosage.',              doctor: 'Dr. Sarah Smith' },
      { date: '2026-02-05', diagnosis: 'Diabetes follow-up',         prescription: 'Metformin 500mg BID',       notes: 'HbA1c 7.2%. Stable.',                     doctor: 'Dr. Sarah Smith' },
      { date: '2026-01-08', diagnosis: 'Hypertension + DM check',    prescription: 'Amlodipine 5mg + Metformin',notes: 'Both conditions stable.',                  doctor: 'Dr. Sarah Smith' },
      { date: '2025-12-10', diagnosis: 'Annual physical exam',        prescription: 'Continue current meds',     notes: 'ECG normal. Labs within acceptable range.', doctor: 'Dr. Sarah Smith' },
      { date: '2025-11-03', diagnosis: 'BP spike',                   prescription: 'Amlodipine 10mg OD',        notes: 'Emergency consult. Stress-related.',        doctor: 'Dr. Sarah Smith' },
    ],
  },
  {
    id: 'PT-0002', name: 'Jane Smith',       age: 32, gender: 'Female', contact: '+63 912 111 0002',
    email: 'jane.smith@email.com',           address: '45 Mabini Ave., Makati City',
    type: 'Chronic',  totalVisits: 12, lastVisit: '2026-03-04', followUp: true,  nextFollowUp: '2026-06-04',
    allergies: ['Sulfa drugs'],
    conditions: ['Type 2 Diabetes'],
    medicalNotes: 'Well-controlled T2DM. Patient is very adherent. Encourage continued lifestyle modifications.',
    visits: [
      { date: '2026-03-04', diagnosis: 'Diabetes follow-up',   prescription: 'Metformin 500mg BID', notes: 'HbA1c 6.8%. Excellent control.', doctor: 'Dr. Sarah Smith' },
      { date: '2025-12-03', diagnosis: 'Diabetes check',       prescription: 'Metformin 500mg BID', notes: 'HbA1c 7.0%. Continue current.',  doctor: 'Dr. Sarah Smith' },
      { date: '2025-09-10', diagnosis: 'Diabetes management',  prescription: 'Metformin 500mg BID', notes: 'Diet counseling given.',          doctor: 'Dr. Sarah Smith' },
    ],
  },
  {
    id: 'PT-0003', name: 'Robert Johnson',   age: 58, gender: 'Male',   contact: '+63 912 111 0003',
    email: 'r.johnson@email.com',            address: '78 Luna Rd., Pasig City',
    type: 'Regular',  totalVisits: 5,  lastVisit: '2026-03-03', followUp: false, nextFollowUp: null,
    allergies: [],
    conditions: ['Chest pain (under evaluation)'],
    medicalNotes: 'Presenting with intermittent chest pain. Ruled out ACS. Further cardiac workup pending.',
    visits: [
      { date: '2026-03-03', diagnosis: 'Chest pain evaluation', prescription: 'Nitroglycerin PRN', notes: 'ECG done. Referred to cardiology.', doctor: 'Dr. Sarah Smith' },
      { date: '2025-11-20', diagnosis: 'Upper respiratory infection', prescription: 'Amoxicillin 500mg', notes: 'Resolved in 7 days.', doctor: 'Dr. Sarah Smith' },
    ],
  },
  {
    id: 'PT-0004', name: 'Maria Santos',     age: 27, gender: 'Female', contact: '+63 912 111 0004',
    email: 'maria.santos@email.com',         address: '9 Bonifacio St., Taguig',
    type: 'VIP',      totalVisits: 8,  lastVisit: '2026-02-20', followUp: true,  nextFollowUp: '2026-03-06',
    allergies: ['Latex'],
    conditions: ['Asthma (mild persistent)'],
    medicalNotes: 'Asthma well-controlled with current inhaler regimen. Avoid known triggers: cold air, dust.',
    visits: [
      { date: '2026-02-20', diagnosis: 'Asthma follow-up',     prescription: 'Salbutamol MDI PRN + Fluticasone', notes: 'Peak flow 85% predicted.', doctor: 'Dr. Sarah Smith' },
      { date: '2025-12-15', diagnosis: 'Asthma exacerbation',  prescription: 'Salbutamol nebulization',           notes: 'Triggered by dust exposure.', doctor: 'Dr. Sarah Smith' },
      { date: '2025-10-02', diagnosis: 'Routine check',        prescription: 'Continue inhalers',                 notes: 'Stable. No exacerbations.',   doctor: 'Dr. Sarah Smith' },
    ],
  },
  {
    id: 'PT-0005', name: 'Carlos Reyes',     age: 61, gender: 'Male',   contact: '+63 912 111 0005',
    email: 'carlos.reyes@email.com',         address: '22 Aguinaldo Blvd., Cavite',
    type: 'Regular',  totalVisits: 3,  lastVisit: '2026-03-03', followUp: false, nextFollowUp: null,
    allergies: ['NSAIDs'],
    conditions: ['Recurrent upper respiratory infections'],
    medicalNotes: 'Frequent URIs, likely due to occupational exposure. Recommended to use N95 mask at work.',
    visits: [
      { date: '2026-03-03', diagnosis: 'Upper resp. infection', prescription: 'Amoxicillin 500mg TID x7d', notes: 'Rest and fluids advised.', doctor: 'Dr. Sarah Smith' },
      { date: '2025-10-14', diagnosis: 'URI',                   prescription: 'Cetirizine + Guaifenesin',  notes: 'Mild. OTC meds sufficient.', doctor: 'Dr. Sarah Smith' },
    ],
  },
  {
    id: 'PT-0006', name: 'Ana Cruz',         age: 39, gender: 'Female', contact: '+63 912 111 0006',
    email: 'ana.cruz@email.com',             address: '56 Del Pilar St., Manila',
    type: 'Chronic',  totalVisits: 22, lastVisit: '2026-02-10', followUp: true,  nextFollowUp: '2026-03-10',
    allergies: ['Codeine'],
    conditions: ['Type 2 Diabetes', 'Hypertension Stage 1'],
    medicalNotes: 'Dual diagnosis management. BP and blood sugar both trending towards target ranges.',
    visits: [
      { date: '2026-02-10', diagnosis: 'DM + HTN monitoring', prescription: 'Metformin + Losartan 50mg', notes: 'BP 130/85. Sugar 7.0 mmol/L.', doctor: 'Dr. Sarah Smith' },
      { date: '2025-11-08', diagnosis: 'Chronic disease check', prescription: 'Same regimen',            notes: 'Labs reviewed. Stable.',        doctor: 'Dr. Sarah Smith' },
    ],
  },
  {
    id: 'PT-0007', name: 'Ben Torres',       age: 52, gender: 'Male',   contact: '+63 912 111 0007',
    email: 'ben.torres@email.com',           address: '101 Katipunan Ave., QC',
    type: 'Chronic',  totalVisits: 15, lastVisit: '2026-01-28', followUp: true,  nextFollowUp: '2026-03-05',
    allergies: [],
    conditions: ['Hypertension Stage 1'],
    medicalNotes: 'BP remains moderately elevated. Sodium restriction and exercise counseling ongoing.',
    visits: [
      { date: '2026-01-28', diagnosis: 'HTN follow-up', prescription: 'Losartan 100mg OD', notes: 'BP 145/92. Increased dosage.', doctor: 'Dr. Sarah Smith' },
      { date: '2025-10-30', diagnosis: 'HTN check',     prescription: 'Losartan 50mg OD',  notes: 'BP 138/88. Continue.',         doctor: 'Dr. Sarah Smith' },
    ],
  },
  {
    id: 'PT-0008', name: 'Carla Mendoza',    age: 44, gender: 'Female', contact: '+63 912 111 0008',
    email: 'carla.mendoza@email.com',        address: '33 Maysilo Circle, Mandaluyong',
    type: 'Regular',  totalVisits: 6,  lastVisit: '2026-03-03', followUp: true,  nextFollowUp: '2026-03-10',
    allergies: ['Dust mites'],
    conditions: ['Asthma (moderate)'],
    medicalNotes: 'Had recent exacerbation. Compliance improved after counseling. Use spacer with MDI.',
    visits: [
      { date: '2026-03-03', diagnosis: 'Asthma exacerbation', prescription: 'Salbutamol MDI + Prednisone 5d', notes: 'Nebulization done.',     doctor: 'Dr. Sarah Smith' },
      { date: '2025-12-01', diagnosis: 'Asthma follow-up',    prescription: 'Fluticasone inhaler',            notes: 'Stable. No attacks.',    doctor: 'Dr. Sarah Smith' },
    ],
  },
  {
    id: 'PT-0009', name: 'David Lim',        age: 36, gender: 'Male',   contact: '+63 912 111 0009',
    email: 'david.lim@email.com',            address: '77 Ortigas Ave., Pasig',
    type: 'VIP',      totalVisits: 9,  lastVisit: '2026-03-02', followUp: true,  nextFollowUp: '2026-03-09',
    allergies: [],
    conditions: ['GERD'],
    medicalNotes: 'Dietary triggers identified: coffee, spicy food, late meals. Patient counseled.',
    visits: [
      { date: '2026-03-02', diagnosis: 'GERD',          prescription: 'Omeprazole 20mg OD',  notes: 'Dietary modification advised.', doctor: 'Dr. Sarah Smith' },
      { date: '2025-11-15', diagnosis: 'GERD follow-up', prescription: 'Omeprazole 20mg OD', notes: 'Symptoms reduced 60%.',         doctor: 'Dr. Sarah Smith' },
    ],
  },
  {
    id: 'PT-0010', name: 'Elena Ramos',      age: 29, gender: 'Female', contact: '+63 912 111 0010',
    email: 'elena.ramos@email.com',          address: '15 Marcos Highway, Antipolo',
    type: 'Regular',  totalVisits: 4,  lastVisit: '2026-02-25', followUp: false, nextFollowUp: null,
    allergies: ['Morphine'],
    conditions: ['Migraine with aura'],
    medicalNotes: 'Migraine triggers: stress, lack of sleep, bright lights. Prescribed abortive therapy.',
    visits: [
      { date: '2026-02-25', diagnosis: 'Migraine',         prescription: 'Sumatriptan 50mg PRN + Naproxen', notes: 'Aura noted. Counseled on triggers.', doctor: 'Dr. Sarah Smith' },
      { date: '2025-10-20', diagnosis: 'Migraine follow-up', prescription: 'Sumatriptan PRN',              notes: 'Frequency reduced.',                doctor: 'Dr. Sarah Smith' },
    ],
  },
];

/* ═══════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════ */
const AVATAR_POOL = [
  'bg-blue-100 text-blue-700', 'bg-teal-100 text-teal-700',
  'bg-violet-100 text-violet-700', 'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700', 'bg-emerald-100 text-emerald-700',
];
const avatarCls  = (name) => AVATAR_POOL[name.charCodeAt(0) % AVATAR_POOL.length];
const initials   = (name) => name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
const fmtDate    = (d) => { if (!d) return '—'; const dt=new Date(d+'T00:00:00'); return dt.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); };
const daysBetween= (a,b) => Math.round((new Date(b)-new Date(a))/(1000*60*60*24));

const TYPE_CFG = {
  Regular:{ bg:'bg-slate-100',  text:'text-slate-600',  border:'border-slate-200'  },
  Chronic:{ bg:'bg-amber-100',  text:'text-amber-700',  border:'border-amber-200'  },
  VIP:    { bg:'bg-violet-100', text:'text-violet-700', border:'border-violet-200' },
};

const TypeBadge = ({ type }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${TYPE_CFG[type]?.bg} ${TYPE_CFG[type]?.text}`}>{type}</span>
);

/* ═══════════════════════════════════════════════════
   ADD CONSULTATION MODAL
═══════════════════════════════════════════════════ */
function AddConsultationModal({ patient, onClose, onSave }) {
  const [form, setForm] = useState({ diagnosis:'', prescription:'', notes:'' });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900">Add Consultation</h3>
            <p className="text-xs text-gray-400 mt-0.5">{patient.name} · {fmtDate(new Date().toISOString().slice(0,10))}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4 text-gray-400"/></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block">Diagnosis <span className="text-red-500">*</span></label>
            <input value={form.diagnosis} onChange={e=>set('diagnosis',e.target.value)} placeholder="e.g. Hypertension monitoring"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block">Prescription</label>
            <input value={form.prescription} onChange={e=>set('prescription',e.target.value)} placeholder="e.g. Amlodipine 5mg OD"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block">Notes</label>
            <textarea value={form.notes} onChange={e=>set('notes',e.target.value)} rows={3} placeholder="Clinical notes..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"/>
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" disabled={!form.diagnosis}
            onClick={()=>{onSave(form);onClose();}}>
            <Check className="w-4 h-4 mr-1.5"/> Save Consultation
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ADD FOLLOW-UP MODAL
═══════════════════════════════════════════════════ */
function AddFollowUpModal({ patient, onClose, onSave }) {
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Schedule Follow-up</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4 text-gray-400"/></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block">Follow-up Date <span className="text-red-500">*</span></label>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block">Note</label>
            <textarea value={note} onChange={e=>setNote(e.target.value)} rows={2} placeholder="Reason for follow-up..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"/>
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" disabled={!date}
            onClick={()=>{onSave(date,note);onClose();}}>
            <Check className="w-4 h-4 mr-1.5"/> Schedule
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PATIENT DETAIL MODAL
═══════════════════════════════════════════════════ */
function PatientDetailModal({ patient: initPatient, onClose, toast }) {
  const [patient, setPatient]     = useState(initPatient);
  const [activeTab, setActiveTab] = useState('personal');
  const [showConsult, setShowConsult] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [noteDraft, setNoteDraft]  = useState(patient.medicalNotes);

  const tabs = [
    { key:'personal', label:'Personal',     icon:User         },
    { key:'medical',  label:'Medical',      icon:Heart        },
    { key:'visits',   label:'Visit History', icon:ClipboardList },
    { key:'crm',      label:'CRM',          icon:Activity     },
    { key:'timeline', label:'Timeline',     icon:CalendarClock },
  ];

  const saveNotes = () => {
    setPatient(p=>({...p,medicalNotes:noteDraft}));
    setEditingNotes(false);
    toast({title:'Notes updated',description:'Medical notes saved successfully.'});
  };

  const saveConsult = (form) => {
    const today = new Date().toISOString().slice(0,10);
    const newVisit = { date:today, diagnosis:form.diagnosis, prescription:form.prescription, notes:form.notes, doctor:'Dr. Sarah Smith' };
    setPatient(p=>({...p, visits:[newVisit,...p.visits], totalVisits:p.totalVisits+1, lastVisit:today }));
    toast({title:'Consultation added',description:`${form.diagnosis} recorded for ${patient.name}.`});
  };

  const saveFollowUp = (date,note) => {
    setPatient(p=>({...p, followUp:true, nextFollowUp:date}));
    toast({title:'Follow-up scheduled',description:`Next visit set for ${fmtDate(date)}.`});
  };

  const markFollowUpDone = () => {
    setPatient(p=>({...p,followUp:false,nextFollowUp:null}));
    toast({title:'Follow-up completed',description:`${patient.name}'s follow-up marked as done.`});
  };

  const typeColor = TYPE_CFG[patient.type];

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e=>e.stopPropagation()}>

          {/* ── MODAL HEADER ── */}
          <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 text-white flex-shrink-0">
            <div className="absolute inset-0 opacity-10" style={{backgroundImage:'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)'}}/>
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black flex-shrink-0 ${avatarCls(patient.name)} border-2 border-white/30`}>
                  {initials(patient.name)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-black">{patient.name}</h2>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/30`}>{patient.type}</span>
                    {patient.followUp && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-400/80 text-white flex items-center gap-1">
                        <Bell className="w-2.5 h-2.5"/> Follow-up
                      </span>
                    )}
                  </div>
                  <p className="text-blue-200 text-sm mt-0.5">{patient.id} · {patient.age} y/o {patient.gender}</p>
                  <p className="text-blue-100 text-xs mt-0.5">{patient.totalVisits} total visits · Last: {fmtDate(patient.lastVisit)}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors flex-shrink-0">
                <X className="w-4 h-4 text-white"/>
              </button>
            </div>

            {/* Action buttons */}
            <div className="relative flex items-center gap-2 mt-4 flex-wrap">
              <Button size="sm" onClick={()=>setShowConsult(true)}
                className="h-8 px-3 text-xs bg-white text-blue-700 hover:bg-blue-50 font-bold gap-1.5 shadow-sm">
                <Plus className="w-3.5 h-3.5"/> Add Consultation
              </Button>
              <Button size="sm" onClick={()=>setShowFollowUp(true)}
                className="h-8 px-3 text-xs bg-white/15 hover:bg-white/25 text-white border border-white/20 font-bold gap-1.5">
                <CalendarClock className="w-3.5 h-3.5"/> Schedule Follow-up
              </Button>
              {patient.followUp && (
                <Button size="sm" onClick={markFollowUpDone}
                  className="h-8 px-3 text-xs bg-green-500/80 hover:bg-green-500 text-white font-bold gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5"/> Mark Follow-up Done
                </Button>
              )}
            </div>
          </div>

          {/* ── TABS ── */}
          <div className="flex border-b border-gray-100 bg-white flex-shrink-0 overflow-x-auto">
            {tabs.map(t=>{
              const Icon=t.icon;
              return (
                <button key={t.key} onClick={()=>setActiveTab(t.key)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all
                    ${activeTab===t.key?'border-blue-600 text-blue-600':'border-transparent text-gray-400 hover:text-gray-600'}`}>
                  <Icon className="w-3.5 h-3.5"/>{t.label}
                </button>
              );
            })}
          </div>

          {/* ── TAB CONTENT ── */}
          <div className="flex-1 overflow-y-auto">

            {/* PERSONAL INFO */}
            {activeTab==='personal' && (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    {icon:User,    label:'Full Name',      val:patient.name},
                    {icon:User,    label:'Age / Gender',   val:`${patient.age} years old · ${patient.gender}`},
                    {icon:Phone,   label:'Contact',        val:patient.contact, href:`tel:${patient.contact}`},
                    {icon:Mail,    label:'Email',          val:patient.email,   href:`mailto:${patient.email}`},
                    {icon:MapPin,  label:'Address',        val:patient.address},
                  ].map((item,i)=>{
                    const Icon=item.icon;
                    return (
                      <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Icon className="w-3.5 h-3.5 text-gray-400"/>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{item.label}</p>
                          {item.href
                            ? <a href={item.href} className="text-sm font-semibold text-blue-600 hover:text-blue-800 break-all">{item.val}</a>
                            : <p className="text-sm font-semibold text-gray-800">{item.val}</p>
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-1">Read-only Notice</p>
                  <p className="text-xs text-amber-700">Personal information can only be modified by administrative staff. Contact admin to update patient records.</p>
                </div>
              </div>
            )}

            {/* MEDICAL INFO */}
            {activeTab==='medical' && (
              <div className="p-6 space-y-5">
                {/* Allergies */}
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-red-500"/> Allergies
                  </p>
                  {patient.allergies.length===0
                    ? <p className="text-sm text-gray-400 italic bg-gray-50 rounded-xl p-3">No known allergies</p>
                    : <div className="flex flex-wrap gap-2">
                        {patient.allergies.map(a=>(
                          <span key={a} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                            <AlertCircle className="w-3 h-3"/> {a}
                          </span>
                        ))}
                      </div>
                  }
                </div>

                {/* Existing Conditions */}
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-blue-500"/> Existing Conditions
                  </p>
                  {patient.conditions.length===0
                    ? <p className="text-sm text-gray-400 italic bg-gray-50 rounded-xl p-3">No existing conditions on record</p>
                    : <div className="flex flex-wrap gap-2">
                        {patient.conditions.map(c=>(
                          <span key={c} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">{c}</span>
                        ))}
                      </div>
                  }
                </div>

                {/* Medical Notes */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                      <NotepadText className="w-3.5 h-3.5 text-green-500"/> Medical Notes
                    </p>
                    {!editingNotes
                      ? <button onClick={()=>setEditingNotes(true)} className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 transition-colors">
                          <FileText className="w-3 h-3"/> Edit Notes
                        </button>
                      : <div className="flex gap-2">
                          <button onClick={()=>{setEditingNotes(false);setNoteDraft(patient.medicalNotes);}} className="text-xs text-gray-500 hover:text-gray-700 font-bold">Cancel</button>
                          <button onClick={saveNotes} className="text-xs text-green-600 hover:text-green-800 font-bold flex items-center gap-1">
                            <Check className="w-3 h-3"/> Save
                          </button>
                        </div>
                    }
                  </div>
                  {editingNotes
                    ? <textarea value={noteDraft} onChange={e=>setNoteDraft(e.target.value)} rows={5}
                        className="w-full border border-blue-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-blue-50/30"/>
                    : <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <p className="text-sm text-gray-700 leading-relaxed">{patient.medicalNotes || 'No medical notes.'}</p>
                      </div>
                  }
                </div>
              </div>
            )}

            {/* VISIT HISTORY */}
            {activeTab==='visits' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-bold text-gray-900">{patient.visits.length} recorded visits</p>
                  <Button size="sm" onClick={()=>setShowConsult(true)} className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
                    <Plus className="w-3.5 h-3.5"/> Add Visit
                  </Button>
                </div>
                {patient.visits.length===0
                  ? <div className="text-center py-12 text-gray-400 text-sm">No visit records yet.</div>
                  : <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50">
                            {['Date','Diagnosis','Prescription','Notes','Doctor'].map(h=>(
                              <th key={h} className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap first:pl-2">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {patient.visits.map((v,i)=>(
                            <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                              <td className="py-3 px-4 pl-2 whitespace-nowrap">
                                <p className="text-xs font-bold text-gray-800">{fmtDate(v.date)}</p>
                              </td>
                              <td className="py-3 px-4">
                                <p className="text-xs font-semibold text-gray-800">{v.diagnosis}</p>
                              </td>
                              <td className="py-3 px-4">
                                <span className="inline-flex items-center gap-1 text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg font-medium">
                                  <Pill className="w-3 h-3"/> {v.prescription}
                                </span>
                              </td>
                              <td className="py-3 px-4 max-w-[200px]">
                                <p className="text-xs text-gray-500 line-clamp-2">{v.notes}</p>
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <p className="text-xs font-medium text-blue-600">{v.doctor}</p>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                }
              </div>
            )}

            {/* CRM */}
            {activeTab==='crm' && (
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    {label:'Total Visits',    val:patient.totalVisits, color:'text-blue-600',   bg:'bg-blue-50'  },
                    {label:'Last Visit',      val:fmtDate(patient.lastVisit), color:'text-gray-700', bg:'bg-gray-50'},
                    {label:'Patient Type',    val:patient.type,         color:TYPE_CFG[patient.type]?.text, bg:TYPE_CFG[patient.type]?.bg},
                    {label:'Follow-up',       val:patient.followUp?'Required':'None', color:patient.followUp?'text-orange-600':'text-green-600', bg:patient.followUp?'bg-orange-50':'bg-green-50'},
                  ].map((item,i)=>(
                    <div key={i} className={`${item.bg} rounded-xl p-4 border border-gray-100`}>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{item.label}</p>
                      <p className={`text-sm font-black ${item.color}`}>{item.val}</p>
                    </div>
                  ))}
                </div>

                {/* Follow-up management */}
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Bell className="w-4 h-4 text-orange-500"/> Follow-up Management
                    </p>
                    <Button size="sm" onClick={()=>setShowFollowUp(true)} className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1">
                      <Plus className="w-3.5 h-3.5"/> Schedule
                    </Button>
                  </div>

                  {patient.followUp ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-xl">
                        <CalendarClock className="w-4 h-4 text-orange-500 flex-shrink-0"/>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-orange-700">Next Follow-up Date</p>
                          <p className="text-sm font-black text-orange-800">{fmtDate(patient.nextFollowUp)}</p>
                          {patient.nextFollowUp && (
                            <p className="text-[10px] text-orange-500 mt-0.5">
                              {daysBetween(new Date().toISOString().slice(0,10), patient.nextFollowUp) < 0
                                ? `${Math.abs(daysBetween(new Date().toISOString().slice(0,10), patient.nextFollowUp))} days overdue`
                                : `in ${daysBetween(new Date().toISOString().slice(0,10), patient.nextFollowUp)} days`}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button onClick={markFollowUpDone}
                        className="w-full h-9 text-xs bg-green-600 hover:bg-green-700 text-white gap-1.5 font-bold">
                        <CheckCircle2 className="w-4 h-4"/> Mark Follow-up as Completed
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <CheckCircle2 className="w-8 h-8 text-green-300 mx-auto mb-2"/>
                      <p className="text-sm font-semibold text-gray-400">No pending follow-up</p>
                      <p className="text-xs text-gray-300 mt-1">Schedule one if needed</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TIMELINE */}
            {activeTab==='timeline' && (
              <div className="p-6">
                <p className="text-sm font-bold text-gray-900 mb-5">Patient History Timeline</p>
                <div className="relative">
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-gray-200 to-transparent"/>
                  <div className="space-y-0">
                    {patient.visits.map((v,i)=>(
                      <div key={i} className="relative flex gap-4 pb-6 last:pb-0">
                        <div className="relative z-10 flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${i===0?'bg-blue-600':'bg-white border-gray-200'}`}>
                            <Stethoscope className={`w-4 h-4 ${i===0?'text-white':'text-gray-400'}`}/>
                          </div>
                        </div>
                        <div className={`flex-1 rounded-xl border p-4 ${i===0?'bg-blue-50 border-blue-200':'bg-gray-50 border-gray-100'}`}>
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <p className={`text-xs font-bold uppercase tracking-wide mb-1 ${i===0?'text-blue-500':'text-gray-400'}`}>{fmtDate(v.date)}</p>
                              <p className={`font-bold text-sm ${i===0?'text-blue-800':'text-gray-800'}`}>{v.diagnosis}</p>
                            </div>
                            {i===0&&<span className="text-[10px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-full">Latest</span>}
                          </div>
                          <div className="mt-2 flex items-center gap-1.5">
                            <Pill className="w-3 h-3 text-purple-500 flex-shrink-0"/>
                            <p className="text-xs text-purple-700 font-medium">{v.prescription}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{v.notes}</p>
                          <p className="text-[10px] text-blue-500 font-semibold mt-2">{v.doctor}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {showConsult  && <AddConsultationModal patient={patient} onClose={()=>setShowConsult(false)}  onSave={saveConsult}/>}
      {showFollowUp && <AddFollowUpModal     patient={patient} onClose={()=>setShowFollowUp(false)} onSave={saveFollowUp}/>}
    </>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */
export default function DoctorPatientsPage() {
  const [patients,     setPatients]     = useState(PATIENTS);
  const [search,       setSearch]       = useState('');
  const [filterType,   setFilterType]   = useState('');
  const [filterFU,     setFilterFU]     = useState('');
  const [filterDate,   setFilterDate]   = useState('');
  const [selected,     setSelected]     = useState(null);
  const [filtersOpen,  setFiltersOpen]  = useState(false);
  const [page,         setPage]         = useState(1);
  const [pageSize,     setPageSize]     = useState(5);
  const { toast } = useToast();

  /* draft filters (applied on button click) */
  const [draftType,  setDraftType]  = useState('');
  const [draftFU,    setDraftFU]    = useState('');
  const [draftDate,  setDraftDate]  = useState('');

  const applyFilters = () => {
    setFilterType(draftType);
    setFilterFU(draftFU);
    setFilterDate(draftDate);
    setFiltersOpen(false);
    setPage(1);
  };

  const resetFilters = () => {
    setDraftType(''); setDraftFU(''); setDraftDate('');
    setFilterType(''); setFilterFU(''); setFilterDate('');
    setSearch('');
    setFiltersOpen(false);
    setPage(1);
  };

  const activeFilterCount = [filterType, filterFU, filterDate].filter(Boolean).length;

  const filtered = useMemo(()=>
    patients.filter(p=>{
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.id.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterType && p.type !== filterType) return false;
      if (filterFU === 'yes' && !p.followUp) return false;
      if (filterFU === 'no'  &&  p.followUp) return false;
      if (filterDate && p.lastVisit < filterDate) return false;
      return true;
    }),
  [patients, search, filterType, filterFU, filterDate]);

  /* Pagination derived values */
  const totalPages  = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage    = Math.min(page, totalPages);
  const startIdx    = (safePage - 1) * pageSize;
  const paginated   = filtered.slice(startIdx, startIdx + pageSize);

  /* Reset to page 1 when search changes */
  const handleSearch = (val) => { setSearch(val); setPage(1); };

  /* Page range for number buttons (show up to 5 around current) */
  const pageNumbers = useMemo(() => {
    const delta = 2;
    const range = [];
    for (let i = Math.max(1, safePage - delta); i <= Math.min(totalPages, safePage + delta); i++) range.push(i);
    return range;
  }, [safePage, totalPages]);

  return (
    <MainLayout title="My Patients" subtitle="Manage and review your patient list">
      <div className="space-y-5">

        {/* ── PAGE HEADER ── */}
        <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 text-white overflow-hidden">
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5 pointer-events-none"/>
          <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-white/5 pointer-events-none"/>
          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/20 flex items-center justify-center backdrop-blur-sm">
                <Users className="w-7 h-7 text-white"/>
              </div>
              <div>
                <h1 className="text-2xl font-black">My Patients</h1>
                <p className="text-blue-200 text-sm mt-0.5">
                  <span className="text-white font-black text-lg">{patients.length}</span> total patients registered
                </p>
              </div>
            </div>
            {/* Quick summary pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {[
                {label:'Chronic',  count:patients.filter(p=>p.type==='Chronic').length,  color:'bg-amber-400/30 text-amber-100 border-amber-300/30'},
                {label:'VIP',      count:patients.filter(p=>p.type==='VIP').length,      color:'bg-violet-400/30 text-violet-100 border-violet-300/30'},
                {label:'Follow-up',count:patients.filter(p=>p.followUp).length,          color:'bg-orange-400/30 text-orange-100 border-orange-300/30'},
              ].map(x=>(
                <div key={x.label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${x.color}`}>
                  {x.label} <span className="font-black">{x.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── SEARCH + FILTER BAR ── */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"/>
            <input value={search} onChange={e=>handleSearch(e.target.value)} placeholder="Search by name or patient ID..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"/>
          </div>

          {/* Filter toggle */}
          <button onClick={()=>setFiltersOpen(f=>!f)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all
              ${filtersOpen||activeFilterCount>0?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'}`}>
            <Filter className="w-4 h-4"/>
            Filters
            {activeFilterCount>0&&<span className="w-5 h-5 rounded-full bg-white text-blue-600 text-[10px] font-black flex items-center justify-center">{activeFilterCount}</span>}
          </button>

          {/* Reset */}
          {(search||activeFilterCount>0)&&(
            <button onClick={resetFilters} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:text-red-500 hover:border-red-200 font-medium transition-colors">
              <RotateCcw className="w-3.5 h-3.5"/> Reset
            </button>
          )}

          <div className="ml-auto text-xs text-gray-400 font-medium">
            Showing <span className="font-black text-gray-700">{filtered.length}</span> of {patients.length} patients
          </div>
        </div>

        {/* ── FILTER PANEL ── */}
        {filtersOpen && (
          <Card className="border border-blue-100 shadow-sm bg-blue-50/40">
            <CardContent className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Patient Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block">Patient Type</label>
                  <div className="relative">
                    <select value={draftType} onChange={e=>setDraftType(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none pr-8">
                      <option value="">All Types</option>
                      <option value="Regular">Regular</option>
                      <option value="Chronic">Chronic</option>
                      <option value="VIP">VIP</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none"/>
                  </div>
                </div>

                {/* Follow-up */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block">Follow-up Required</label>
                  <div className="relative">
                    <select value={draftFU} onChange={e=>setDraftFU(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none pr-8">
                      <option value="">Any</option>
                      <option value="yes">Yes — Follow-up Required</option>
                      <option value="no">No — Up to Date</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none"/>
                  </div>
                </div>

                {/* Last Visit Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block">Last Visit After</label>
                  <input type="date" value={draftDate} onChange={e=>setDraftDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"/>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <Button onClick={applyFilters} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-sm">
                  <Filter className="w-4 h-4"/> Apply Filters
                </Button>
                <Button variant="outline" onClick={resetFilters} className="gap-1.5 text-sm">
                  <RotateCcw className="w-4 h-4"/> Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── PATIENT TABLE ── */}
        <Card className="border border-gray-100 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80">
                    {['Patient ID','Full Name','Age','Gender','Contact','Visits','Last Visit','Follow-up','Actions'].map(h=>(
                      <th key={h} className="text-left py-3.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap first:pl-5 last:pr-5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length===0 && (
                    <tr>
                      <td colSpan={10} className="text-center py-16">
                        <Search className="w-10 h-10 mx-auto text-gray-200 mb-3"/>
                        <p className="text-sm font-semibold text-gray-400">No patients found</p>
                        <p className="text-xs text-gray-300 mt-1">Try adjusting your search or filters</p>
                      </td>
                    </tr>
                  )}
                  {paginated.map(p=>(
                    <tr key={p.id}
                      className="border-b border-gray-50 last:border-0 hover:bg-blue-50/30 transition-colors cursor-pointer group"
                      onClick={()=>setSelected(p)}>

                      {/* Patient ID */}
                      <td className="py-3.5 px-4 pl-5">
                        <span className="text-xs font-black text-gray-400 font-mono">{p.id}</span>
                      </td>

                      {/* Full Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${avatarCls(p.name)}`}>
                            {initials(p.name)}
                          </div>
                          <p className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{p.name}</p>
                        </div>
                      </td>

                      {/* Age */}
                      <td className="py-3.5 px-4 text-sm text-gray-600 whitespace-nowrap">{p.age} y/o</td>

                      {/* Gender */}
                      <td className="py-3.5 px-4 text-sm text-gray-600 whitespace-nowrap">{p.gender}</td>

                      {/* Contact */}
                      <td className="py-3.5 px-4">
                        <a href={`tel:${p.contact}`} onClick={e=>e.stopPropagation()}
                          className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 transition-colors whitespace-nowrap">
                          <Phone className="w-3 h-3"/>{p.contact}
                        </a>
                      </td>


                      {/* Total Visits */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 text-xs font-black flex items-center justify-center">{p.totalVisits}</span>
                        </div>
                      </td>

                      {/* Last Visit */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="text-xs font-semibold text-gray-700">{fmtDate(p.lastVisit)}</p>
                        <p className="text-[10px] text-gray-400">
                          {daysBetween(p.lastVisit, new Date().toISOString().slice(0,10))}d ago
                        </p>
                      </td>

                      {/* Follow-up */}
                      <td className="py-3.5 px-4">
                        {p.followUp
                          ? <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
                              <Bell className="w-3 h-3"/> Required
                            </span>
                          : <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                              <CheckCircle2 className="w-3 h-3"/> None
                            </span>
                        }
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 pr-5">
                        <Button size="sm" onClick={e=>{e.stopPropagation();setSelected(p);}}
                          className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-sm">
                          <Eye className="w-3.5 h-3.5"/> View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── PAGINATION FOOTER ── */}
            {filtered.length > 0 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 flex-wrap gap-3">

                {/* Left: showing info + rows-per-page */}
                <div className="flex items-center gap-3">
                  <p className="text-xs text-gray-400 font-medium">
                    Showing <span className="font-bold text-gray-700">{startIdx + 1}</span>–<span className="font-bold text-gray-700">{Math.min(startIdx + pageSize, filtered.length)}</span> of <span className="font-bold text-gray-700">{filtered.length}</span> patients
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-400">Rows:</span>
                    <div className="relative">
                      <select
                        value={pageSize}
                        onChange={e=>{ setPageSize(Number(e.target.value)); setPage(1); }}
                        className="text-xs font-bold text-gray-700 border border-gray-200 rounded-lg pl-2 pr-6 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                      >
                        {[5,10,20,50].map(n=><option key={n} value={n}>{n}</option>)}
                      </select>
                      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none"/>
                    </div>
                  </div>
                </div>

                {/* Right: page buttons */}
                <div className="flex items-center gap-1">
                  {/* First */}
                  <button
                    onClick={()=>setPage(1)} disabled={safePage===1}
                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <ChevronsLeft className="w-3.5 h-3.5"/>
                  </button>
                  {/* Prev */}
                  <button
                    onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={safePage===1}
                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft className="w-3.5 h-3.5"/>
                  </button>

                  {/* Leading ellipsis */}
                  {pageNumbers[0] > 1 && (
                    <>
                      <button onClick={()=>setPage(1)} className="w-8 h-8 rounded-lg border border-gray-200 text-xs font-bold text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors">1</button>
                      {pageNumbers[0] > 2 && <span className="w-8 h-8 flex items-center justify-center text-xs text-gray-300">…</span>}
                    </>
                  )}

                  {/* Page number buttons */}
                  {pageNumbers.map(n=>(
                    <button key={n} onClick={()=>setPage(n)}
                      className={`w-8 h-8 rounded-lg border text-xs font-bold transition-all
                        ${n===safePage
                          ?'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-200'
                          :'border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'}`}>
                      {n}
                    </button>
                  ))}

                  {/* Trailing ellipsis */}
                  {pageNumbers[pageNumbers.length-1] < totalPages && (
                    <>
                      {pageNumbers[pageNumbers.length-1] < totalPages - 1 && <span className="w-8 h-8 flex items-center justify-center text-xs text-gray-300">…</span>}
                      <button onClick={()=>setPage(totalPages)} className="w-8 h-8 rounded-lg border border-gray-200 text-xs font-bold text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors">{totalPages}</button>
                    </>
                  )}

                  {/* Next */}
                  <button
                    onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={safePage===totalPages}
                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <ChevronRight className="w-3.5 h-3.5"/>
                  </button>
                  {/* Last */}
                  <button
                    onClick={()=>setPage(totalPages)} disabled={safePage===totalPages}
                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <ChevronsRight className="w-3.5 h-3.5"/>
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* ── PATIENT DETAIL MODAL ── */}
      {selected && (
        <PatientDetailModal
          patient={selected}
          onClose={()=>setSelected(null)}
          toast={toast}
        />
      )}
    </MainLayout>
  );
}