import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { api } from '../services/Api';
import { useAuth } from '../context/AuthContext';
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
   HELPERS
═══════════════════════════════════════════════════ */
const AVATAR_POOL = [
  'bg-blue-100 text-blue-700','bg-teal-100 text-teal-700',
  'bg-violet-100 text-violet-700','bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700','bg-emerald-100 text-emerald-700',
];
const avatarCls = (name) => AVATAR_POOL[(name?.charCodeAt(0) ?? 0) % AVATAR_POOL.length];
const initials  = (name) => (name ?? '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

const STATUS_CFG = {
  scheduled: { label:'Scheduled', dot:'bg-blue-500',   text:'text-blue-700',   bg:'bg-blue-50',   border:'border-blue-200'   },
  ongoing:   { label:'Ongoing',   dot:'bg-yellow-500', text:'text-yellow-700', bg:'bg-yellow-50', border:'border-yellow-300' },
  pending_payment: { label:'Pending Payment', dot:'bg-amber-500', text:'text-amber-700', bg:'bg-amber-50', border:'border-amber-200' },
  completed: { label:'Completed', dot:'bg-green-500',  text:'text-green-700',  bg:'bg-green-50',  border:'border-green-200'  },
  cancelled: { label:'Cancelled', dot:'bg-red-400',    text:'text-red-600',    bg:'bg-red-50',    border:'border-red-200'    },
   called:    { label:'Called', dot:'bg-indigo-500', text:'text-indigo-700', bg:'bg-indigo-50', border:'border-indigo-200' },
};

const TYPE_CFG = {
  New:     { bg:'bg-sky-100',   text:'text-sky-700'    },
  Regular: { bg:'bg-slate-100', text:'text-slate-600'  },
};

const inputCls = `w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
  bg-white text-gray-800 placeholder:text-gray-400 transition-all resize-none`;

const labelCls = 'block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5';

const getTodayLocal = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const InfoRow = ({ icon: Icon, label, value, accent }) => (
  <div className="flex items-start gap-3">
    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${accent || 'bg-gray-100'}`}>
      <Icon className="w-3.5 h-3.5 text-gray-500"/>
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-gray-800 leading-snug">{value || '—'}</p>
    </div>
  </div>
);

const Section = ({ icon: Icon, title, accent = 'text-blue-600', children, action }) => (
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
function ConsultationHistoryModal({ onClose, patient, history }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

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

        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <History className="w-5 h-5 text-indigo-600"/>
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900">Consultation History</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {patient.name} · {patient.id} · {history.length} records
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

        <div className="px-6 py-3 bg-gray-50/80 border-b border-gray-100 flex items-center gap-3 flex-wrap flex-shrink-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${avatarCls(patient.name)}`}>
            {initials(patient.name)}
          </div>
          <span className="text-xs font-bold text-gray-700">{patient.age} y/o · {patient.gender}</span>
          <span className="text-xs text-gray-400">
            Total visits: <strong className="text-gray-700">{patient.totalVisits}</strong>
          </span>
          <span className="text-xs text-gray-400">
            Last visit: <strong className="text-gray-700">{patient.lastVisit}</strong>
          </span>
          {patient.type && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_CFG[patient.type]?.bg ?? 'bg-gray-100'} ${TYPE_CFG[patient.type]?.text ?? 'text-gray-600'}`}>
              {patient.type}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {history.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="w-10 h-10 text-gray-200 mx-auto mb-3"/>
              <p className="text-sm font-bold text-gray-400">No consultation history found.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  {['Date', 'Diagnosis', 'Prescription', 'Follow-up', 'Status'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap first:pl-2">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((c, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4 pl-2 whitespace-nowrap">
                      <p className="text-xs font-bold text-gray-700">
                        {new Date(c.created_at || c.updated_at || Date.now()).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-xs font-semibold text-gray-800">{c.diagnosis || '—'}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-xs text-violet-700 bg-violet-50 px-2 py-0.5 rounded-lg font-medium">
                        <Pill className="w-3 h-3"/>
                        {(c.treatment_items || []).map(t => t?.drug).filter(Boolean).join(', ') || '—'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full
                        ${c.follow_up_required && c.follow_up_date ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                        {c.follow_up_required && c.follow_up_date && <Bell className="w-3 h-3"/>}
                        {c.follow_up_required ? (c.follow_up_date ? `Pending (${c.follow_up_date})` : 'Required') : 'None'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full
                        ${c.status === 'completed' ? 'text-green-700 bg-green-50' : 'text-yellow-700 bg-yellow-50'}`}>
                        <CheckCircle2 className="w-3 h-3"/> {c.status || 'draft'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5"/>
            Showing all {history.length} past consultations for this patient.
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
  const { user } = useAuth();

  const [activeEntry,        setActiveEntry]        = useState(null);
  const [doctorAvailability, setDoctorAvailability] = useState('unavailable');
  const [loading,            setLoading]            = useState(true);
  const [busy,               setBusy]               = useState(false);
  const [consultationHistory,setConsultationHistory] = useState([]);
  const [consultationRecord, setConsultationRecord] = useState(null);

  // ── Derived appointment & patient objects from live queue data ──
  const APPOINTMENT = activeEntry ? {
    id:       activeEntry.id,
    queueNum: activeEntry.num,
    date:     new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }),
    time:     activeEntry.arrival || '—',
    endTime:  '—',
    status:   activeEntry.status === 'called' ? 'called' : activeEntry.status,
    doctor:   user?.name ? `Dr. ${user.name.replace(/^Dr\.\s*/, '')}` : 'Assigned Doctor',
    specialty: user?.specialization || 'General Medicine',
  } : null;

  const patientTypeFromEntry = String(activeEntry?.patient_type || '').toLowerCase();
  const normalizedPatientType = patientTypeFromEntry === 'new' ? 'New' : 'Regular';

  const PATIENT = activeEntry ? {
    id:         `PT-${activeEntry.patient_id || '—'}`,
    name:       activeEntry.name || 'Unknown',
    age:        Number(activeEntry.age || 0),
    gender:     activeEntry.gender || 'Unspecified',
    contact:    activeEntry.contact || '—',
    email:      activeEntry.email || '',
    address:    activeEntry.address || '',
    totalVisits: Number(activeEntry.total_visits || 0),
    lastVisit:  activeEntry.last_visit || '—',
    followUp:   !!activeEntry.follow_up,
    allergies:  Array.isArray(activeEntry.allergies) ? activeEntry.allergies : [],
    conditions: Array.isArray(activeEntry.conditions) ? activeEntry.conditions : [],
    type:       normalizedPatientType,
  } : null;

  const [status,      setStatus]      = useState('scheduled');
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
    patientType:    'New',
  });

  // Sync status when active entry changes
  useEffect(() => {
    if (APPOINTMENT) setStatus(APPOINTMENT.status);
  }, [APPOINTMENT?.status, activeEntry?.id]);

  // Sync patient type when patient changes
  useEffect(() => {
    if (PATIENT) setForm(f => ({ ...f, patientType: PATIENT.type }));
  }, [PATIENT?.type]);

  // Load existing consultation draft when entry changes
  useEffect(() => {
    if (!activeEntry?.id) return;
    api.consultations.getByQueueEntry(activeEntry.id)
      .then((c) => {
        setConsultationRecord(c || null);
        setForm((f) => ({
          ...f,
          chiefComplaint: c.chief_complaint  || '',
          bp:             c.blood_pressure   || '',
          temp:           c.temperature      || '',
          hr:             c.heart_rate       || '',
          weight:         c.weight           || '',
          diagnosis:      c.diagnosis        || '',
          notes:          c.notes            || '',
          followUp:       !!c.follow_up_required,
          followUpDate:   c.follow_up_date   || '',
          followUpNotes:  c.follow_up_notes  || '',
        }));
        setMeds(
          Array.isArray(c.treatment_items) && c.treatment_items.length
            ? c.treatment_items.map((m, i) => ({
                id:       Date.now() + i,
                drug:     m.drug     || '',
                dose:     m.dose     || '',
                freq:     m.freq     || '',
                duration: m.duration || '',
              }))
            : [{ id: 1, drug: '', dose: '', freq: '', duration: '' }]
        );
        setLabChecked(Array.isArray(c.lab_requests)
          ? c.lab_requests.filter(r => typeof r === 'string')
          : []);
        setLabText(Array.isArray(c.lab_requests)
          ? c.lab_requests.filter(r => typeof r === 'object').map(r => r.notes).filter(Boolean).join('\n')
          : '');
      })
      .catch((e) => console.error(e));
  }, [activeEntry?.id]);

  // Poll queue + availability every 8 s
  useEffect(() => {
    if (!user?.user_id) return;
    let mounted = true;

    const fetchLive = async () => {
      try {
        const [queueRows, availability] = await Promise.all([
          api.queue.getAll(getTodayLocal()),
          api.doctors.getAvailability(user.user_id),
        ]);
        if (!mounted) return;

        const forDoctor = (Array.isArray(queueRows) ? queueRows : [])
          .filter(q => Number(q.doctor_id) === Number(user.user_id))
          .sort((a, b) => Number(a.queue_number || 0) - Number(b.queue_number || 0));

        const current =
          forDoctor.find(q => ['ongoing', 'called'].includes(String(q.status || '').toLowerCase())) ||
          forDoctor.find(q => String(q.status || '').toLowerCase() === 'waiting') ||
          null;

        setActiveEntry(current ? {
          ...current,
          id:         current.queue_entry_id ?? current.id,
          patient_id: current.patient_id,
          num:        Number(current.queue_number ?? current.num ?? 0),
          name:       current.patient_name    ?? current.name,
          age:        current.patient_age     ?? current.age,
          gender:     current.patient_gender  ?? current.gender,
          contact:    current.patient_contact ?? current.contact,
          email:      current.patient_email   ?? current.email,
          address:    current.patient_address ?? current.address,
          total_visits: current.total_visits  ?? 0,
          last_visit:   current.last_visit    ?? '—',
          allergies:    current.allergies     ?? [],
          conditions:   current.conditions    ?? [],
          patient_type: current.patient_type  ?? 'Regular',
          status:       String(current.status || '').toLowerCase().replace('-', '_'),
          arrival:      current.arrival_time,
        } : null);

        setDoctorAvailability(String(availability?.availability_status || 'unavailable').toLowerCase());

        if (current?.patient_id) {
          const history = await api.consultations.getAll({ patient_id: current.patient_id });
          if (mounted) setConsultationHistory(Array.isArray(history) ? history.filter((c) => c.finalized_at) : []);
        } else {
          if (mounted) setConsultationHistory([]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchLive();
    const t = setInterval(fetchLive, 8000);
    return () => { mounted = false; clearInterval(t); };
  }, [user?.user_id]);

  const [meds,       setMeds]       = useState([{ id: 1, drug: '', dose: '', freq: '', duration: '' }]);
  const [labText,    setLabText]    = useState('');
  const [labChecked, setLabChecked] = useState([]);
  const [saved,      setSaved]      = useState(false);
  const [completed,  setCompleted]  = useState(false);
  const [cancelled,  setCancelled]  = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addMed    = () => setMeds(m => [...m, { id: Date.now(), drug: '', dose: '', freq: '', duration: '' }]);
  const removeMed = (id) => setMeds(m => m.filter(r => r.id !== id));
  const updateMed = (id, k, v) => setMeds(m => m.map(r => r.id === id ? { ...r, [k]: v } : r));
  const toggleLab = (lab) => setLabChecked(prev => prev.includes(lab) ? prev.filter(l => l !== lab) : [...prev, lab]);

  const goNext = () => {
    if (formStep === 1 && !form.chiefComplaint.trim()) {
      toast({ title: '⚠️ Chief Complaint required', description: 'Please enter the reason for visit.', variant: 'destructive' });
      return;
    }
    if (formStep === 3 && !form.diagnosis.trim()) {
      toast({ title: '⚠️ Diagnosis required', description: 'Please enter a diagnosis before proceeding.', variant: 'destructive' });
      return;
    }
    if (formStep < FORM_STEPS.length) setFormStep(s => s + 1);
  };

  const goPrev = () => { if (formStep > 1) setFormStep(s => s - 1); };

  // ── Build consultation payload ──
  const buildPayload = (overrideStatus) => ({
    status:            overrideStatus,
    chief_complaint:   form.chiefComplaint,
    blood_pressure:    form.bp,
    temperature:       form.temp,
    heart_rate:        form.hr,
    weight:            form.weight,
    diagnosis:         form.diagnosis,
    notes:             form.notes,
    treatment_items:   meds
      .map(({ drug, dose, freq, duration }) => ({ drug, dose, freq, duration }))
      .filter(m => m.drug || m.dose || m.freq || m.duration),
    lab_requests:      [...labChecked, ...(labText.trim() ? [{ notes: labText.trim() }] : [])],
    follow_up_required: !!form.followUp,
    follow_up_date:    form.followUp ? (form.followUpDate || null) : null,
    follow_up_notes:   form.followUp ? (form.followUpNotes || null) : null,
  });

  const startConsult = () => {
    if (!activeEntry?.id) return;
    setBusy(true);
    api.consultations.saveByQueueEntry(activeEntry.id, buildPayload('ongoing'))
      .then(() => api.queue.updateStatus(activeEntry.id, 'ongoing'))
      .then(() => {
        setStatus('ongoing');
        toast({ title: '🩺 Consultation started', description: `Now seeing ${PATIENT?.name}` });
      })
      .catch((e) => {
        console.error(e);
        toast({ title: 'Unable to start consultation', description: 'Please retry.', variant: 'destructive' });
      })
      .finally(() => setBusy(false));
  };

  const handleSave = () => {
    if (!form.chiefComplaint && !form.diagnosis) {
      toast({ title: '⚠️ Missing fields', description: 'Please fill in at least Chief Complaint or Diagnosis.', variant: 'destructive' });
      return;
    }
    if (!activeEntry?.id) return;
    if (status !== 'ongoing') {
      toast({ title: 'Start session first', description: 'Start the consultation session before saving details.', variant: 'destructive' });
      return;
    }
    setBusy(true);
    api.consultations.saveByQueueEntry(activeEntry.id, buildPayload('ongoing'))
      .then(() => {
        setSaved(true);
        toast({ title: '💾 Consultation saved', description: 'Draft saved successfully.' });
      })
      .catch((e) => {
        console.error(e);
        toast({ title: 'Unable to save consultation', variant: 'destructive' });
      })
      .finally(() => setBusy(false));
  };

  const handleComplete = () => {
    if (!form.diagnosis) {
      toast({ title: '⚠️ Diagnosis required', description: 'Please enter a diagnosis before completing.', variant: 'destructive' });
      return;
    }
    if (!activeEntry?.id) return;
    if (status !== 'ongoing') {
      toast({ title: 'Start session first', description: 'Start the consultation session before completing.', variant: 'destructive' });
      return;
    }
    setBusy(true);
    api.consultations.saveByQueueEntry(activeEntry.id, buildPayload('completed'))
      .then(() => api.queue.updateStatus(activeEntry.id, 'completed'))
      .then(() => {
        setStatus('completed');
        setCompleted(true);
        toast({ title: '✅ Done Consultation', description: `${PATIENT?.name}'s consultation was sent to POS and will appear in medical history after payment.` });
      })
      .catch((e) => {
        console.error(e);
        toast({ title: 'Unable to complete consultation', description: 'Please retry.', variant: 'destructive' });
      })
      .finally(() => setBusy(false));
  };

  const handleCancel = () => {
    if (!activeEntry?.id) return;
    setBusy(true);
    api.queue.updateStatus(activeEntry.id, 'no_show')
      .then(() => {
        setStatus('cancelled');
        setCancelled(true);
        toast({ title: '❌ Consultation cancelled', description: 'This appointment has been cancelled.' });
      })
      .catch((e) => {
        console.error(e);
        toast({ title: 'Unable to cancel consultation', description: 'Please retry.', variant: 'destructive' });
      })
      .finally(() => setBusy(false));
  };

  const setAvailability = async (next) => {
    if (!user?.user_id) return;
    setBusy(true);
    try {
      await api.doctors.updateAvailability(user.user_id, next);
      setDoctorAvailability(next);
      toast({ title: `Doctor marked as ${next}` });
    } catch (e) {
      console.error(e);
      toast({ title: 'Unable to update availability', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const handlePrint = () => {
    toast({ title: '🖨 Preparing prescription', description: 'Opening print dialog...' });
  };

  const displayStatus = status === 'completed' && !consultationRecord?.finalized_at ? 'pending_payment' : status;
  const statusCfg   = STATUS_CFG[displayStatus] || STATUS_CFG.called;
  const isReadOnly  = completed || cancelled || status !== 'ongoing';
  const currentStep = FORM_STEPS[formStep - 1];
  const StepIcon    = currentStep.icon;

  // ── Empty / loading states ──────────────────────────
  if (loading) {
    return (
      <MainLayout title="Consultation" subtitle="Record and manage patient consultation details">
        <Card><CardContent className="p-4 text-sm text-gray-500">Loading today's queue…</CardContent></Card>
      </MainLayout>
    );
  }

  if (!activeEntry || !APPOINTMENT || !PATIENT) {
    return (
      <MainLayout title="Consultation" subtitle="Record and manage patient consultation details">
        <Card className="border border-gray-100 shadow-sm">
          <CardContent className="p-3 flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-700">
              Doctor availability:{' '}
              <span className={doctorAvailability === 'available' ? 'text-green-600' : 'text-gray-500'}>
                {doctorAvailability}
              </span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant={doctorAvailability === 'available' ? 'default' : 'outline'} disabled={busy} onClick={() => setAvailability('available')}>Available</Button>
              <Button size="sm" variant={doctorAvailability === 'unavailable' ? 'default' : 'outline'} disabled={busy} onClick={() => setAvailability('unavailable')}>Unavailable</Button>
            </div>
          </CardContent>
        </Card>
        <Card className="mt-4">
          <CardContent className="p-6 text-center">
            <ClipboardList className="w-10 h-10 text-gray-200 mx-auto mb-3"/>
            <p className="text-sm font-bold text-gray-400">No assigned patient in your queue yet.</p>
            <p className="text-xs text-gray-300 mt-1">The page refreshes automatically every 8 seconds.</p>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  // ── Main render ─────────────────────────────────────
  return (
    <MainLayout title="Consultation" subtitle="Record and manage patient consultation details">
      <div className="space-y-5">

        {/* Availability bar */}
        <Card>
          <CardContent className="p-3 flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-700">
              Doctor availability:{' '}
              <span className={doctorAvailability === 'available' ? 'text-green-600' : 'text-gray-500'}>
                {doctorAvailability}
              </span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant={doctorAvailability === 'available' ? 'default' : 'outline'} disabled={busy} onClick={() => setAvailability('available')}>Available</Button>
              <Button size="sm" variant={doctorAvailability === 'unavailable' ? 'default' : 'outline'} disabled={busy} onClick={() => setAvailability('unavailable')}>Unavailable</Button>
            </div>
          </CardContent>
        </Card>

        {/* History modal */}
        {showHistory && (
          <ConsultationHistoryModal
            onClose={() => setShowHistory(false)}
            patient={PATIENT}
            history={consultationHistory}
          />
        )}

        {/* ══ §1 HEADER ══ */}
        <div className={`relative rounded-2xl p-6 text-white overflow-hidden
          ${displayStatus === 'completed' ? 'bg-gradient-to-r from-green-600 to-emerald-700'
          : displayStatus === 'pending_payment' ? 'bg-gradient-to-r from-amber-500 to-orange-600'
          : status === 'cancelled' ? 'bg-gradient-to-r from-red-500 to-rose-700'
          : status === 'ongoing'   ? 'bg-gradient-to-r from-yellow-500 to-amber-600'
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
                    <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} ${displayStatus === 'ongoing' ? 'animate-pulse' : ''}`}/>
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
              {status === 'called' && (
                <Button onClick={startConsult} disabled={busy || doctorAvailability !== 'available'}
                  className="bg-white text-blue-700 hover:bg-blue-50 font-bold gap-2 shadow-sm">
                  <PlayCircle className="w-4 h-4"/> Start Consultation
                </Button>
              )}
              {status === 'called' && (
                <Button variant="outline" onClick={handleCancel} disabled={busy}
                  className="bg-white text-red-600 border-red-200 hover:bg-red-50 font-bold gap-2">
                  <XCircle className="w-4 h-4"/> Mark No Show
                </Button>
              )}
              {status === 'ongoing' && (
                <div className="flex items-center gap-1.5 bg-yellow-400/20 border border-yellow-300/30 rounded-xl px-3 py-1.5">
                  <span className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse"/>
                  <span className="text-white text-xs font-bold">In Progress</span>
                </div>
              )}
              {displayStatus === 'pending_payment' && (
                <div className="flex items-center gap-1.5 bg-amber-400/20 border border-amber-300/30 rounded-xl px-3 py-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-100"/>
                  <span className="text-white text-xs font-bold">Waiting for Payment</span>
                </div>
              )}
              {displayStatus === 'completed' && consultationRecord?.finalized_at && (
                <div className="flex items-center gap-1.5 bg-green-400/20 border border-green-300/30 rounded-xl px-3 py-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-200"/>
                  <span className="text-white text-xs font-bold">Visit Completed</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══ MAIN 2-COLUMN LAYOUT ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* LEFT — Patient Info */}
          <div className="space-y-5">
            <Section icon={User} title="Patient Information" accent="text-blue-600">
              <div className="space-y-4">

                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 ${avatarCls(PATIENT.name)}`}>
                    {initials(PATIENT.name)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{PATIENT.name}</p>
                    <p className="text-xs text-gray-400">{PATIENT.id}</p>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <InfoRow icon={User}     label="Age / Gender"  value={`${PATIENT.age} y/o · ${PATIENT.gender}`}/>
                  <InfoRow icon={Phone}    label="Contact"       value={PATIENT.contact}/>
                  <InfoRow icon={Activity} label="Total Visits"  value={`${PATIENT.totalVisits} visits`}/>
                  <InfoRow icon={Calendar} label="Last Visit"    value={PATIENT.lastVisit}/>
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3"/> Allergies
                  </p>
                  {PATIENT.allergies.length === 0
                    ? <p className="text-xs text-gray-400 italic">No known allergies</p>
                    : (
                      <div className="flex flex-wrap gap-1.5">
                        {PATIENT.allergies.map(a => (
                          <span key={a} className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
                            <AlertCircle className="w-2.5 h-2.5"/>{a}
                          </span>
                        ))}
                      </div>
                    )
                  }
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <Heart className="w-3 h-3"/> Existing Conditions
                  </p>
                  {PATIENT.conditions.length === 0
                    ? <p className="text-xs text-gray-400 italic">None on record</p>
                    : (
                      <div className="flex flex-wrap gap-1.5">
                        {PATIENT.conditions.map(c => (
                          <span key={c} className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">{c}</span>
                        ))}
                      </div>
                    )
                  }
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <button
                    onClick={() => setShowHistory(true)}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-indigo-100 bg-indigo-50 hover:bg-indigo-100 active:scale-[0.98] transition-all group"
                  >
                    <span className="flex items-center gap-2 text-xs font-bold text-indigo-700">
                      <History className="w-3.5 h-3.5"/> View Consultation History
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 group-hover:bg-indigo-200 text-indigo-500 transition-colors">
                        {consultationHistory.length} records
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-indigo-400"/>
                    </span>
                  </button>
                </div>

              </div>
            </Section>
          </div>

          {/* RIGHT — Step-by-step Form */}
          <div className="lg:col-span-2 space-y-5">

            {/* Step progress */}
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
                            ${active ? 'text-white border-transparent shadow-sm'
                            : done  ? 'bg-white cursor-pointer hover:opacity-80'
                            :         'bg-gray-50 border-gray-200 text-gray-400 cursor-default'}`}
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

            {/* Active step card */}
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
                    <textarea rows={4} disabled={isReadOnly} value={form.chiefComplaint}
                      onChange={e => set('chiefComplaint', e.target.value)}
                      placeholder='"Fever and sore throat for 3 days, difficulty swallowing"'
                      className={`${inputCls} ${isReadOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}/>
                  </div>
                )}

                {/* STEP 2 — Vital Signs */}
                {formStep === 2 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { key:'bp',     label:'Blood Pressure', placeholder:'120/80', unit:'mmHg', icon: Droplets    },
                      { key:'temp',   label:'Temperature',    placeholder:'36.5',   unit:'°C',   icon: Thermometer },
                      { key:'hr',     label:'Heart Rate',     placeholder:'72',     unit:'bpm',  icon: Activity    },
                      { key:'weight', label:'Weight',         placeholder:'70',     unit:'kg',   icon: Activity    },
                    ].map(v => {
                      const Icon = v.icon;
                      return (
                        <div key={v.key} className="space-y-1.5">
                          <label className={labelCls}>{v.label}</label>
                          <div className="relative">
                            <input type="text" disabled={isReadOnly} value={form[v.key]}
                              onChange={e => set(v.key, e.target.value)}
                              placeholder={v.placeholder}
                              className={`${inputCls} pr-12 ${isReadOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}/>
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
                      <textarea rows={3} disabled={isReadOnly} value={form.diagnosis}
                        onChange={e => set('diagnosis', e.target.value)}
                        placeholder='"Acute Pharyngitis, Rule out GERD"'
                        className={`${inputCls} ${isReadOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}/>
                    </div>
                    <div>
                      <label className={labelCls}>Doctor's Notes</label>
                      <textarea rows={4} disabled={isReadOnly} value={form.notes}
                        onChange={e => set('notes', e.target.value)}
                        placeholder="Clinical observations, patient instructions, referrals, special notes..."
                        className={`${inputCls} ${isReadOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}/>
                    </div>
                  </div>
                )}

                {/* STEP 4 — Prescription */}
                {formStep === 4 && (
                  <div className="space-y-3">
                    <div className="hidden sm:grid grid-cols-12 gap-2 px-1">
                      {['Drug / Medicine', 'Dose', 'Frequency', 'Duration', ''].map((h, i) => (
                        <div key={i} className={`text-[10px] font-bold text-gray-400 uppercase tracking-wide ${i === 0 ? 'col-span-4' : i === 4 ? 'col-span-1' : 'col-span-2'}`}>
                          {h}
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      {meds.map((med, idx) => (
                        <div key={med.id} className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-12 sm:col-span-4">
                            <input disabled={isReadOnly} value={med.drug}
                              onChange={e => updateMed(med.id, 'drug', e.target.value)}
                              placeholder={`Medication ${idx + 1}`}
                              className={`${inputCls} ${isReadOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}/>
                          </div>
                          <div className="col-span-4 sm:col-span-2">
                            <input disabled={isReadOnly} value={med.dose}
                              onChange={e => updateMed(med.id, 'dose', e.target.value)}
                              placeholder="500mg"
                              className={`${inputCls} ${isReadOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}/>
                          </div>
                          <div className="col-span-4 sm:col-span-2">
                            <input disabled={isReadOnly} value={med.freq}
                              onChange={e => updateMed(med.id, 'freq', e.target.value)}
                              placeholder="TID"
                              className={`${inputCls} ${isReadOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}/>
                          </div>
                          <div className="col-span-3 sm:col-span-2">
                            <input disabled={isReadOnly} value={med.duration}
                              onChange={e => updateMed(med.id, 'duration', e.target.value)}
                              placeholder="7 days"
                              className={`${inputCls} ${isReadOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}/>
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
                              checked={labChecked.includes(lab)}
                              onChange={() => !isReadOnly && toggleLab(lab)}/>
                            {lab}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Additional Lab Notes</label>
                      <textarea rows={2} disabled={isReadOnly} value={labText}
                        onChange={e => setLabText(e.target.value)}
                        placeholder="Other lab requests or special instructions..."
                        className={`${inputCls} ${isReadOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}/>
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
                        {['New', 'Regular'].map(t => (
                          <button key={t} disabled={isReadOnly} onClick={() => set('patientType', t)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all
                              ${form.patientType === t
                                ? t === 'New' ? 'bg-sky-600 text-white border-sky-600'
                                  : 'bg-slate-600 text-white border-slate-600'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}
                              ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {!isReadOnly && (
                  <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-100">
                    <Button variant="outline" onClick={goPrev} disabled={formStep === 1}
                      className="gap-2 border-gray-200 font-bold text-gray-600 disabled:opacity-40">
                      <ChevronLeft className="w-4 h-4"/> Back
                    </Button>
                    {formStep < FORM_STEPS.length ? (
                      <Button onClick={goNext} className="gap-2 font-bold text-white shadow-sm" style={{ background: currentStep.color }}>
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

        {/* ══ §6 ACTION BUTTONS ══ */}
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
                  <Button onClick={handleComplete} disabled={busy}
                    className="bg-green-600 hover:bg-green-700 text-white gap-2 font-bold shadow-sm shadow-green-200">
                    <CheckCircle2 className="w-4 h-4"/> Done Consultation
                  </Button>
                )}
                <Button variant="outline" onClick={handlePrint} className="gap-2 border-gray-200 font-bold">
                  <Printer className="w-4 h-4 text-gray-500"/> Print Prescription
                </Button>
              </div>
              <div className="flex items-center gap-2">
                {!isReadOnly && (
                  <Button variant="outline" onClick={handleCancel} disabled={busy}
                    className="gap-2 border-red-200 text-red-600 hover:bg-red-50 font-bold">
                    <XCircle className="w-4 h-4"/> Cancel Consultation
                  </Button>
                )}
                {displayStatus === 'pending_payment' && (
                  <div className="flex items-center gap-2 text-sm font-bold text-amber-600 bg-amber-50 px-4 py-2 rounded-xl border border-amber-200">
                    <Clock className="w-4 h-4"/> Session finished, awaiting payment
                  </div>
                )}
                {displayStatus === 'completed' && consultationRecord?.finalized_at && (
                  <div className="flex items-center gap-2 text-sm font-bold text-green-600 bg-green-50 px-4 py-2 rounded-xl border border-green-200">
                    <CheckCircle2 className="w-4 h-4"/> Consultation finalized and recorded
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
                  Saving will create a draft record. <strong>Done Consultation</strong> sends the record to POS. The consultation will only appear in medical history after payment is completed.
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
