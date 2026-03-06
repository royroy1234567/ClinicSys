import React, { useState } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  User, Calendar, Clock, Stethoscope, FileText, Pill,
  AlertCircle, Heart, Phone, MapPin, Droplets, Search,
  Eye, Printer, Download, X, CheckCircle2, Bell,
  Paperclip, Image, Shield, Activity, ClipboardList,
  NotepadText, ChevronRight, Hash, RefreshCw, Star,
  Filter, ChevronDown,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════
   LOGGED-IN PATIENT
═══════════════════════════════════════════════════ */
const ME = {
  id:         'PT-00045',
  name:       'Juan dela Cruz',
  age:        32,
  gender:     'Male',
  dob:        'March 15, 1994',
  contact:    '+63 917 555 1234',
  email:      'juan.delacruz@email.com',
  address:    '22 Mabini St., San Juan City, Metro Manila',
  bloodType:  'O+',
  type:       'Regular',
  allergies:  ['Penicillin'],
  conditions: ['Hypertension (Stage 1)'],
};

/* ═══════════════════════════════════════════════════
   MY RECORDS
═══════════════════════════════════════════════════ */
const MY_RECORDS = [
  {
    id: 'MR-0042', aptId: 'APT-209',
    date: 'March 4, 2026',
    doctor: 'Dr. Sarah Smith', specialty: 'General Medicine',
    chiefComplaint: 'Persistent headache and high blood pressure reading at home.',
    symptoms: ['Headache', 'Dizziness', 'Blurred vision', 'Neck stiffness'],
    diagnosis: 'Hypertensive Urgency',
    icdCode: 'I10',
    treatment: 'Amlodipine 5mg once daily. Strict salt restriction. Increase hydration.',
    prescription: [
      { drug:'Amlodipine',    dose:'5mg',  freq:'Once daily (OD)', duration:'Indefinite' },
      { drug:'Losartan',      dose:'50mg', freq:'Once daily (OD)', duration:'Indefinite' },
    ],
    notes: 'Blood pressure 162/98. Advised strict sodium restriction (<2g/day). Avoid coffee and stress. Return for BP recheck.',
    followUpDate: 'March 18, 2026',
    followUpNotes: 'BP recheck and medication review.',
    status: 'follow-up',
    attachments: [
      { name:'BP_Reading_Mar4.pdf', type:'pdf',   size:'340 KB' },
      { name:'ECG_Result.jpg',      type:'image', size:'1.2 MB' },
    ],
  },
  {
    id: 'MR-0038', aptId: 'APT-188',
    date: 'January 20, 2026',
    doctor: 'Dr. Sarah Smith', specialty: 'General Medicine',
    chiefComplaint: 'Annual physical examination. No acute complaints.',
    symptoms: ['None reported'],
    diagnosis: 'Hypertension – Controlled. Annual Physical Exam.',
    icdCode: 'I10',
    treatment: 'Continue Amlodipine. Low-fat diet, 30 mins exercise daily.',
    prescription: [],
    notes: 'Overall health stable. BP 128/84. Cholesterol slightly elevated. Flu vaccine administered. Recommended routine blood work annually.',
    followUpDate: 'January 2027',
    followUpNotes: 'Annual physical examination next year.',
    status: 'completed',
    attachments: [
      { name:'Annual_Physical_Jan2026.pdf', type:'pdf',   size:'2.1 MB' },
      { name:'Blood_Chemistry.pdf',         type:'pdf',   size:'980 KB' },
      { name:'Chest_Xray_Jan2026.jpg',      type:'image', size:'3.4 MB' },
    ],
  },
  {
    id: 'MR-0031', aptId: 'APT-155',
    date: 'October 10, 2025',
    doctor: 'Dr. Sarah Smith', specialty: 'General Medicine',
    chiefComplaint: 'Fever, cough, and sore throat for 3 days.',
    symptoms: ['Fever (38.5°C)', 'Productive cough', 'Sore throat', 'Runny nose', 'Body aches'],
    diagnosis: 'Acute Upper Respiratory Tract Infection (URTI)',
    icdCode: 'J06.9',
    treatment: 'Amoxicillin 500mg TID × 7 days. Paracetamol 500mg Q4H for fever.',
    prescription: [
      { drug:'Amoxicillin',  dose:'500mg', freq:'Three times daily (TID)', duration:'7 days' },
      { drug:'Paracetamol',  dose:'500mg', freq:'Every 4 hours (PRN)',     duration:'5 days' },
      { drug:'Cetirizine',   dose:'10mg',  freq:'Once at bedtime (HS)',    duration:'3 days' },
    ],
    notes: 'Throat culture done. Advised warm fluids, complete rest. No school/work for 2 days. Return if fever persists beyond 3 days.',
    followUpDate: 'October 17, 2025',
    followUpNotes: 'Follow up if symptoms persist.',
    status: 'completed',
    attachments: [],
  },
  {
    id: 'MR-0022', aptId: 'APT-098',
    date: 'May 5, 2025',
    doctor: 'Dr. Jose Reyes', specialty: 'Internal Medicine',
    chiefComplaint: 'Referred for blood pressure management and lifestyle counseling.',
    symptoms: ['Elevated BP readings', 'Occasional headaches', 'Fatigue'],
    diagnosis: 'Hypertension Stage 1 – New Diagnosis',
    icdCode: 'I10',
    treatment: 'Started Amlodipine 2.5mg OD. DASH diet counseling. Monthly BP monitoring.',
    prescription: [
      { drug:'Amlodipine', dose:'2.5mg', freq:'Once daily (OD)', duration:'1 month trial' },
    ],
    notes: 'First diagnosis of hypertension. BP 145/92 on two separate readings. Comprehensive metabolic panel ordered. Patient counseled on DASH diet and smoking cessation.',
    followUpDate: 'June 5, 2025',
    followUpNotes: 'BP recheck and lab results review.',
    status: 'completed',
    attachments: [
      { name:'Lab_Results_May2025.pdf', type:'pdf', size:'1.5 MB' },
    ],
  },
];

/* ═══════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════ */
const STATUS_CFG = {
  completed:   { label:'Completed',         bg:'bg-green-50',  text:'text-green-700',  dot:'bg-green-500',  bar:'bg-green-500'  },
  ongoing:     { label:'Ongoing',           bg:'bg-yellow-50', text:'text-yellow-700', dot:'bg-yellow-500', bar:'bg-yellow-500' },
  'follow-up': { label:'Follow-up Required',bg:'bg-orange-50', text:'text-orange-700', dot:'bg-orange-500', bar:'bg-orange-500' },
};

const StatusPill = ({ status }) => {
  const s = STATUS_CFG[status] || STATUS_CFG.completed;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`}/>
      {s.label}
    </span>
  );
};

/* ═══════════════════════════════════════════════════
   RECORD DETAIL MODAL
═══════════════════════════════════════════════════ */
function RecordModal({ record, onClose }) {
  const [printMode, setPrintMode] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-6 overflow-hidden">

        {/* Modal header */}
        <div className={`p-6 text-white relative overflow-hidden
          ${record.status==='follow-up' ? 'bg-gradient-to-r from-orange-500 to-amber-600'
          : record.status==='ongoing'   ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
          : 'bg-gradient-to-r from-blue-600 to-indigo-700'}`}>
          <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10 pointer-events-none"/>
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">{record.id} · {record.aptId}</p>
              <h2 className="text-xl font-black mt-0.5">{record.date}</h2>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="flex items-center gap-1.5 text-white/80 text-xs font-semibold">
                  <Stethoscope className="w-3.5 h-3.5"/>{record.doctor}
                </span>
                <span className="text-white/50">·</span>
                <span className="text-white/70 text-xs">{record.specialty}</span>
              </div>
            </div>
            <button onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all flex-shrink-0">
              <X className="w-4 h-4 text-white"/>
            </button>
          </div>
          <div className="mt-3">
            <StatusPill status={record.status}/>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">

          {/* Chief complaint */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <NotepadText className="w-3 h-3"/> Chief Complaint
            </p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-4 border border-gray-100 leading-relaxed">
              {record.chiefComplaint}
            </p>
          </div>

          {/* Symptoms */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Activity className="w-3 h-3"/> Symptoms
            </p>
            <div className="flex flex-wrap gap-2">
              {record.symptoms.map(s => (
                <span key={s} className="px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-100 text-xs font-semibold">{s}</span>
              ))}
            </div>
          </div>

          {/* Diagnosis */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wide mb-1 flex items-center gap-1.5">
              <Stethoscope className="w-3 h-3"/> Diagnosis
            </p>
            <p className="text-sm font-bold text-blue-900">{record.diagnosis}</p>
            {record.icdCode && (
              <span className="inline-flex items-center text-xs font-bold text-blue-600 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-lg mt-2">
                ICD-10: {record.icdCode}
              </span>
            )}
          </div>

          {/* Treatment */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <ClipboardList className="w-3 h-3"/> Treatment Plan
            </p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-4 border border-gray-100 leading-relaxed">
              {record.treatment}
            </p>
          </div>

          {/* Prescription */}
          {record.prescription.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Pill className="w-3 h-3"/> Prescription
              </p>
              <div className="space-y-2">
                {record.prescription.map((p, i) => (
                  <div key={i} className="flex items-start gap-3 p-3.5 bg-violet-50 border border-violet-100 rounded-xl">
                    <div className="w-7 h-7 rounded-lg bg-violet-200 flex items-center justify-center text-xs font-black text-violet-700 flex-shrink-0">{i+1}</div>
                    <div>
                      <p className="font-bold text-violet-900 text-sm">{p.drug} <span className="font-normal text-violet-600">{p.dose}</span></p>
                      <p className="text-xs text-violet-600 mt-0.5">{p.freq} · {p.duration}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Doctor notes */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <FileText className="w-3 h-3"/> Doctor's Notes
            </p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-4 border border-gray-100 leading-relaxed">
              {record.notes}
            </p>
          </div>

          {/* Follow-up */}
          {record.followUpDate && (
            <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-100 rounded-2xl">
              <Bell className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5"/>
              <div>
                <p className="text-xs font-bold text-orange-600 uppercase tracking-wide">Return Visit</p>
                <p className="font-black text-orange-900 mt-0.5">{record.followUpDate}</p>
                {record.followUpNotes && <p className="text-xs text-orange-700 mt-0.5">{record.followUpNotes}</p>}
              </div>
            </div>
          )}

          {/* Attachments §6 */}
          {record.attachments.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Paperclip className="w-3 h-3"/> Attached Documents ({record.attachments.length})
              </p>
              <div className="space-y-2">
                {record.attachments.map((att, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/20 transition-all group">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${att.type==='pdf'?'bg-red-100':'bg-blue-100'}`}>
                      {att.type==='pdf'
                        ? <FileText className="w-4 h-4 text-red-600"/>
                        : <Image className="w-4 h-4 text-blue-600"/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{att.name}</p>
                      <p className="text-xs text-gray-400">{att.size}</p>
                    </div>
                    <button className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-all opacity-0 group-hover:opacity-100">
                      <Download className="w-3.5 h-3.5"/> Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* §8 Actions footer — patient: print + download only */}
        <div className="border-t border-gray-100 px-6 py-4 flex items-center gap-2 flex-wrap bg-gray-50/50">
          <button onClick={()=>window.print()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
            <Printer className="w-4 h-4 text-gray-500"/> Print Record
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
            <Download className="w-4 h-4 text-gray-500"/> Download PDF
          </button>
          <div className="flex-1"/>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-semibold">
            <Shield className="w-3.5 h-3.5"/> Your personal health record
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */
export default function PatientMedicalRecordsPage() {
  const [openRecord,   setOpenRecord]   = useState(null);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = MY_RECORDS.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.diagnosis.toLowerCase().includes(q) ||
             r.doctor.toLowerCase().includes(q) ||
             r.chiefComplaint.toLowerCase().includes(q) ||
             r.date.toLowerCase().includes(q);
    }
    return true;
  });

  const completedCount  = MY_RECORDS.filter(r=>r.status==='completed').length;
  const followUpCount   = MY_RECORDS.filter(r=>r.status==='follow-up').length;
  const ongoingCount    = MY_RECORDS.filter(r=>r.status==='ongoing').length;
  const nextFollowUp    = MY_RECORDS.find(r=>r.status==='follow-up');

  return (
    <MainLayout title="My Medical Records" subtitle="View your personal consultation history and health records">
      <div className="space-y-6">

        {/* ══ §1 HEADER ══ */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-44 h-44 rounded-full bg-white/5 pointer-events-none"/>
          <div className="absolute bottom-0 left-32 w-32 h-32 rounded-full bg-white/5 pointer-events-none"/>
          <div className="relative flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-blue-300 text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5 mb-1">
                <Shield className="w-3.5 h-3.5"/> Personal Health Records
              </p>
              <h2 className="text-2xl font-black">My Medical Records</h2>
              <p className="text-blue-200 text-sm mt-1.5 max-w-md">
                View your consultation history, diagnosis, prescriptions, and lab results. Your records are private and secure.
              </p>
            </div>
            <div className="text-right">
              <p className="text-blue-300 text-xs font-semibold">Total Visits</p>
              <p className="text-4xl font-black">{MY_RECORDS.length}</p>
              <p className="text-blue-300 text-xs mt-0.5">consultations on file</p>
            </div>
          </div>

          {/* Quick stats strip */}
          <div className="relative flex items-center gap-4 mt-5 pt-5 border-t border-white/10 flex-wrap">
            {[
              { label:'Completed',    value:completedCount,  color:'text-green-300'  },
              { label:'Follow-up Due',value:followUpCount,   color:'text-orange-300' },
              { label:'Ongoing',      value:ongoingCount,    color:'text-yellow-300' },
              ...(nextFollowUp ? [{ label:'Next Follow-up', value:nextFollowUp.followUpDate, color:'text-blue-200', text:true }] : []),
            ].map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <div className="hidden sm:block w-px h-8 bg-white/10"/>}
                <div>
                  <p className="text-blue-400 text-[10px] font-bold uppercase tracking-wide">{s.label}</p>
                  <p className={`font-black ${s.text ? 'text-sm' : 'text-xl'} ${s.color}`}>{s.value}</p>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ══ §2 PATIENT INFORMATION CARD ══ */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-0 px-5 pt-5">
            <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600"/> My Information
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-4">
            <div className="flex items-start gap-5 flex-wrap">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-2xl font-black text-blue-700 flex-shrink-0 border-2 border-blue-200">
                {ME.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
              </div>

              {/* Details grid */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <h3 className="text-lg font-black text-gray-900">{ME.name}</h3>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">{ME.type}</span>
                  <span className="text-xs text-gray-400 font-semibold">{ME.id}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    [User,     'Age / Gender',  `${ME.age} y/o · ${ME.gender}`],
                    [Calendar, 'Date of Birth', ME.dob                        ],
                    [Phone,    'Contact',        ME.contact                    ],
                    [Droplets, 'Blood Type',     ME.bloodType                  ],
                  ].map(([Icon, label, value]) => (
                    <div key={label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className="w-3 h-3 text-gray-400"/>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
                      </div>
                      <p className="text-sm font-bold text-gray-800">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Allergies + Conditions */}
                <div className="flex gap-4 mt-3 flex-wrap">
                  <div>
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3"/> Allergies
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {ME.allergies.map(a=>(
                        <span key={a} className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold border border-red-200">{a}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                      <Heart className="w-3 h-3"/> Conditions
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {ME.conditions.map(c=>(
                        <span key={c} className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200">{c}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ══ §3 VISIT HISTORY ══ */}
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-600"/> Visit History
            </h2>
            <div className="flex-1"/>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none"/>
              <input
                value={search}
                onChange={e=>setSearch(e.target.value)}
                placeholder="Search records..."
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 placeholder:text-gray-300"
              />
            </div>
            {/* Status filter */}
            <div className="flex gap-1.5">
              {['all','completed','follow-up','ongoing'].map(f=>(
                <button key={f} onClick={()=>setStatusFilter(f)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all capitalize
                    ${statusFilter===f ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                  {f==='follow-up'?'Follow-up':f==='all'?'All':f.charAt(0).toUpperCase()+f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Record cards */}
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-14 text-center">
              <ClipboardList className="w-10 h-10 text-gray-200 mx-auto mb-3"/>
              <p className="text-sm text-gray-400 font-medium">No records found</p>
              <p className="text-xs text-gray-300 mt-1">Try changing your filter or search term</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(rec => {
                const s = STATUS_CFG[rec.status] || STATUS_CFG.completed;
                return (
                  <div key={rec.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all overflow-hidden group cursor-pointer"
                    onClick={()=>setOpenRecord(rec)}>

                    {/* Left accent bar */}
                    <div className="flex items-stretch">
                      <div className={`w-1 flex-shrink-0 ${s.bar}`}/>

                      <div className="flex-1 p-5">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          {/* Left info */}
                          <div className="flex items-start gap-4">
                            {/* Date block */}
                            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex flex-col items-center justify-center flex-shrink-0">
                              <span className="text-[9px] font-bold text-blue-500 uppercase">
                                {rec.date.split(' ')[0]}
                              </span>
                              <span className="text-xl font-black text-blue-700 leading-none">
                                {rec.date.match(/\d+/)?.[0]}
                              </span>
                              <span className="text-[9px] font-bold text-blue-400">
                                {rec.date.split(',')[1]?.trim().split(' ')[0] || ''}
                              </span>
                            </div>

                            <div className="min-w-0">
                              {/* Diagnosis */}
                              <p className="font-black text-gray-900 text-sm leading-snug">{rec.diagnosis}</p>
                              {rec.icdCode && (
                                <span className="inline-flex text-[9px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 mt-0.5">
                                  ICD-10: {rec.icdCode}
                                </span>
                              )}
                              {/* Doctor */}
                              <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1.5">
                                <Stethoscope className="w-3 h-3"/>{rec.doctor} · {rec.specialty}
                              </p>
                              {/* Complaint preview */}
                              <p className="text-xs text-gray-400 mt-0.5 line-clamp-1 italic">
                                "{rec.chiefComplaint}"
                              </p>
                            </div>
                          </div>

                          {/* Right side */}
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <StatusPill status={rec.status}/>

                            {/* Prescription count */}
                            {rec.prescription.length > 0 && (
                              <span className="flex items-center gap-1 text-xs text-violet-600 font-semibold bg-violet-50 px-2.5 py-1 rounded-full border border-violet-100">
                                <Pill className="w-3 h-3"/>{rec.prescription.length} medication{rec.prescription.length>1?'s':''}
                              </span>
                            )}

                            {/* Attachments count */}
                            {rec.attachments.length > 0 && (
                              <span className="flex items-center gap-1 text-xs text-gray-500 font-semibold bg-gray-100 px-2.5 py-1 rounded-full">
                                <Paperclip className="w-3 h-3"/>{rec.attachments.length} file{rec.attachments.length>1?'s':''}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Follow-up banner inside card */}
                        {rec.status === 'follow-up' && rec.followUpDate && (
                          <div className="mt-3 flex items-center gap-2 text-xs text-orange-700 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2">
                            <Bell className="w-3.5 h-3.5 flex-shrink-0"/>
                            <span className="font-semibold">Follow-up: {rec.followUpDate}</span>
                            {rec.followUpNotes && <span className="text-orange-500">— {rec.followUpNotes}</span>}
                          </div>
                        )}

                        {/* View hint */}
                        <div className="mt-3 flex items-center gap-1 text-xs text-blue-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="w-3.5 h-3.5"/> View full record
                          <ChevronRight className="w-3 h-3"/>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ══ §7 STATUS SUMMARY ══ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label:'Completed Visits',    value:completedCount,  icon:CheckCircle2, bg:'bg-green-50',  text:'text-green-700',  iconColor:'text-green-500',  sub:'All consultations done'        },
            { label:'Follow-up Required',  value:followUpCount,   icon:Bell,         bg:'bg-orange-50', text:'text-orange-700', iconColor:'text-orange-500', sub:nextFollowUp?.followUpDate||''  },
            { label:'Ongoing Cases',       value:ongoingCount,    icon:RefreshCw,    bg:'bg-yellow-50', text:'text-yellow-700', iconColor:'text-yellow-500', sub:'Currently being treated'       },
          ].map(c => {
            const Icon = c.icon;
            return (
              <Card key={c.label} className={`border-0 shadow-sm ${c.bg}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{c.label}</p>
                      <p className="text-3xl font-black text-gray-900 mt-1">{c.value}</p>
                      <p className={`text-xs font-semibold mt-1 ${c.text}`}>{c.sub}</p>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-white/60">
                      <Icon className={`w-5 h-5 ${c.iconColor}`}/>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Privacy notice */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100 text-xs text-blue-700">
          <Shield className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5"/>
          <p>
            <strong>Your records are private.</strong> Only your attending doctors and authorized clinic staff can access your medical information. Records are kept permanently for your safety and cannot be deleted.
          </p>
        </div>

      </div>

      {/* §4 Record Detail Modal */}
      {openRecord && (
        <RecordModal record={openRecord} onClose={()=>setOpenRecord(null)}/>
      )}
    </MainLayout>
  );
}