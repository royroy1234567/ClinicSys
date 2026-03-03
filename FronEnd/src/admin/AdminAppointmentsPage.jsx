import React, { useEffect, useState, useMemo } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  CalendarIcon, Plus, Clock, User, Stethoscope, Search, RefreshCw,
  Eye, Edit, Trash2, X, Check, ChevronDown, ChevronLeft, ChevronRight,
  AlertTriangle, CheckCircle2, XCircle, UserX, TrendingUp, Printer,
  Download, LayoutList, PlayCircle, CheckSquare,
  Users, FileText,
} from 'lucide-react';
import { api } from '../services/Api';
import { useToast } from '../hooks/use-toast';

/* ═══════════════════════════════════════
   CONSTANTS & HELPERS
═══════════════════════════════════════ */
const TODAY = new Date().toISOString().split('T')[0];
const PAGE_SIZE = 8;

const STATUS_CFG = {
  scheduled: { label:'Scheduled', bg:'bg-blue-100',   text:'text-blue-700',   icon:CalendarIcon  },
  ongoing:   { label:'Ongoing',   bg:'bg-yellow-100', text:'text-yellow-700', icon:PlayCircle    },
  completed: { label:'Completed', bg:'bg-green-100',  text:'text-green-700',  icon:CheckCircle2  },
  cancelled: { label:'Cancelled', bg:'bg-red-100',    text:'text-red-600',    icon:XCircle       },
  no_show:   { label:'No-show',   bg:'bg-gray-100',   text:'text-gray-500',   icon:UserX         },
};

const fmtTime = (t) => {
  if (!t) return '—';
  const [h, m] = t.split(':');
  const hr = parseInt(h);
  return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
};

const fmtDate = (d) =>
  d ? new Date(d + 'T00:00:00').toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric' }) : '—';

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

/* ─── Shared components ─── */
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
    <select value={value} onChange={e => onChange(e.target.value)} className={`${inputCls} appearance-none pr-8`}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
  </div>
);

const FieldRow = ({ label, required, children, hint }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-gray-400">{hint}</p>}
  </div>
);

const Pagination = ({ page, totalPages, total, onPage }) => {
  if (totalPages <= 1) return null;
  const start = (page - 1) * PAGE_SIZE + 1;
  const end   = Math.min(page * PAGE_SIZE, total);
  const pages = [];
  if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
  else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page-1); i <= Math.min(totalPages-1, page+1); i++) pages.push(i);
    if (page < totalPages-2) pages.push('...');
    pages.push(totalPages);
  }
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
      <p className="text-xs text-gray-400">
        Showing <span className="font-semibold text-gray-600">{start}&#8211;{end}</span> of <span className="font-semibold text-gray-600">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(page-1)} disabled={page===1} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronLeft className="w-4 h-4" /></button>
        {pages.map((p, i) => p === '...'
          ? <span key={`e${i}`} className="w-7 h-7 flex items-center justify-center text-xs text-gray-400">&#8230;</span>
          : <button key={p} onClick={() => onPage(p)} className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${page===p?'bg-blue-600 text-white shadow-sm':'text-gray-500 hover:bg-gray-200'}`}>{p}</button>
        )}
        <button onClick={() => onPage(page+1)} disabled={page===totalPages} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronRight className="w-4 h-4" /></button>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════
   ADD / EDIT MODAL
═══════════════════════════════════════ */
const EMPTY_FORM = { patient_id:'', doctor_id:'', date:TODAY, start_time:'', end_time:'', duration:'30', appointment_type:'General Consultation', status:'scheduled', reason:'' };

function AppointmentModal({ mode, appointment, appointments, patients, doctors, onClose, onSave, saving }) {
  const isEdit = mode === 'edit';
  const [form, setForm]     = useState(() => {
    if (!isEdit) return { ...EMPTY_FORM };
    let dur = '30';
    if (appointment?.start_time && appointment?.end_time) {
      const [sh,sm] = appointment.start_time.split(':').map(Number);
      const [eh,em] = appointment.end_time.split(':').map(Number);
      dur = String(eh*60+em - sh*60-sm);
    }
    return { patient_id:String(appointment?.patient_id||''), doctor_id:String(appointment?.doctor_id||''), date:appointment?.date||TODAY, start_time:appointment?.start_time||'', end_time:appointment?.end_time||'', duration:dur, appointment_type:appointment?.appointment_type||'General Consultation', status:appointment?.status||'scheduled', reason:appointment?.reason||'' };
  });
  const [errors, setErrors] = useState({});
  const set = (k,v) => { setForm(f=>({...f,[k]:v})); setErrors(e=>({...e,[k]:''})); };

  const calcEnd = (start, dur) => {
    if (!start||!dur) return '';
    const [h,m] = start.split(':').map(Number);
    const total = h*60 + m + parseInt(dur);
    return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;
  };

  const handleStartChange = v => { const end=calcEnd(v,form.duration); setForm(f=>({...f,start_time:v,end_time:end})); setErrors(e=>({...e,start_time:''})); };
  const handleDurChange   = v => { const end=calcEnd(form.start_time,v); setForm(f=>({...f,duration:v,end_time:end})); };

  const validate = () => {
    const e = {};
    if (!form.patient_id) e.patient_id = 'Select a patient';
    if (!form.doctor_id)  e.doctor_id  = 'Select a doctor';
    if (!form.date)       e.date       = 'Date required';
    if (!form.start_time) e.start_time = 'Start time required';
    const end = calcEnd(form.start_time, form.duration);
    const conflict = appointments.find(a => {
      if (isEdit && String(a.id) === String(appointment?.id)) return false;
      if (a.date !== form.date || String(a.doctor_id) !== form.doctor_id) return false;
      if (['cancelled','no_show'].includes(a.status)) return false;
      return a.start_time < end && a.end_time > form.start_time;
    });
    if (conflict) e.start_time = `Conflict with appt at ${fmtTime(conflict.start_time)}`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => { if (!validate()) return; onSave({ ...form, end_time: calcEnd(form.start_time, form.duration) }); };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Appointment' : 'Book New Appointment'}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{isEdit ? `Editing: ${appointment?.id}` : 'Fill in appointment details'}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <FieldRow label="Patient" required>
            <SelectBox value={form.patient_id} onChange={v=>set('patient_id',v)} placeholder="Select patient..." options={patients.map(p=>({value:String(p.id),label:p.name}))} />
            {errors.patient_id && <p className="text-xs text-red-500">&#9888; {errors.patient_id}</p>}
          </FieldRow>
          <FieldRow label="Doctor" required>
            <SelectBox value={form.doctor_id} onChange={v=>set('doctor_id',v)} placeholder="Select doctor..." options={doctors.map(d=>({value:String(d.id),label:`${d.name}${d.specialization?' — '+d.specialization:''}`}))} />
            {errors.doctor_id && <p className="text-xs text-red-500">&#9888; {errors.doctor_id}</p>}
          </FieldRow>
          <div className="grid grid-cols-2 gap-4">
            <FieldRow label="Date" required>
              <input type="date" value={form.date} onChange={e=>set('date',e.target.value)} className={inputCls} />
              {errors.date && <p className="text-xs text-red-500">&#9888; {errors.date}</p>}
            </FieldRow>
            <FieldRow label="Start Time" required>
              <input type="time" value={form.start_time} onChange={e=>handleStartChange(e.target.value)} className={inputCls} />
              {errors.start_time && <p className="text-xs text-red-500">&#9888; {errors.start_time}</p>}
            </FieldRow>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FieldRow label="Duration">
              <SelectBox value={form.duration} onChange={handleDurChange}
                options={[{value:'15',label:'15 min'},{value:'30',label:'30 min'},{value:'45',label:'45 min'},{value:'60',label:'1 hour'},{value:'90',label:'1.5 hrs'},{value:'120',label:'2 hours'}]} />
            </FieldRow>
            <FieldRow label="Appointment Type">
              <SelectBox value={form.appointment_type} onChange={v=>set('appointment_type',v)}
                options={[{value:'General Consultation',label:'General Consultation'},{value:'Follow-up',label:'Follow-up'},{value:'Specialist Consultation',label:'Specialist Consultation'},{value:'Pediatric Consult',label:'Pediatric Consult'},{value:'Executive Check-up',label:'Executive Check-up'}]} />
            </FieldRow>
          </div>
          {form.start_time && form.duration && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <p className="text-xs text-blue-700 font-medium">
                {fmtTime(form.start_time)} &rarr; {fmtTime(calcEnd(form.start_time,form.duration))} ({form.duration} min)
              </p>
            </div>
          )}
          {isEdit && (
            <FieldRow label="Status">
              <SelectBox value={form.status} onChange={v=>set('status',v)} options={Object.entries(STATUS_CFG).map(([k,v])=>({value:k,label:v.label}))} />
            </FieldRow>
          )}
          <FieldRow label="Reason / Remarks">
            <textarea value={form.reason} onChange={e=>set('reason',e.target.value)} placeholder="Reason for visit or additional notes..." rows={3} className={`${inputCls} resize-none`} />
          </FieldRow>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button onClick={()=>{setForm({...EMPTY_FORM});setErrors({});}} className="text-sm text-gray-400 hover:text-gray-600 font-medium flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Reset
          </button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
              {saving ? <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving...</> : <><Check className="w-4 h-4 mr-1.5" /> {isEdit?'Save Changes':'Book Appointment'}</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   VIEW MODAL
═══════════════════════════════════════ */
function ViewModal({ appointment, patients, doctors, onClose, onEdit }) {
  const patient = patients.find(p=>String(p.id)===String(appointment.patient_id));
  const doctor  = doctors.find(d=>String(d.id)===String(appointment.doctor_id));
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Appointment Details</h2>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">{appointment.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={()=>{onClose();onEdit(appointment);}}><Edit className="w-3.5 h-3.5 mr-1" /> Edit</Button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <StatusBadge status={appointment.status} />
            {appointment.queue_number && <span className="text-xs font-bold text-gray-500">Queue #{appointment.queue_number}</span>}
          </div>
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            {[
              { Icon:User,        label:'Patient', value:patient?.name||`Patient #${appointment.patient_id}` },
              { Icon:Stethoscope, label:'Doctor',  value:`${doctor?.name||`Doctor #${appointment.doctor_id}`}${doctor?.specialization?' — '+doctor.specialization:''}` },
              { Icon:CalendarIcon,label:'Date',    value:fmtDate(appointment.date) },
              { Icon:Clock,       label:'Time',    value:`${fmtTime(appointment.start_time)} – ${fmtTime(appointment.end_time)}` },
              { Icon:FileText,    label:'Type',    value:appointment.appointment_type||'General Consultation' },
            ].map(r=>(
              <div key={r.label} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5"><r.Icon className="w-3.5 h-3.5 text-gray-400" /></div>
                <div><p className="text-xs text-gray-400 font-semibold">{r.label}</p><p className="text-sm font-semibold text-gray-800">{r.value}</p></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[['Created By',appointment.created_by||'—'],['Date Created',appointment.created_at||'—'],['Last Modified',appointment.updated_at||'—'],['Consultation',appointment.consultation_id?`#${appointment.consultation_id}`:'Not linked']].map(([k,v])=>(
              <div key={k} className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-400 font-bold uppercase tracking-wide">{k}</p><p className="text-xs text-gray-700 font-semibold mt-0.5">{v}</p></div>
            ))}
          </div>
          {appointment.reason && (
            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
              <p className="text-xs font-bold text-yellow-700 mb-1">REMARKS</p>
              <p className="text-sm text-gray-700">{appointment.reason}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   DELETE MODAL
═══════════════════════════════════════ */
function DeleteModal({ appointment, onClose, onConfirm, saving }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><Trash2 className="w-6 h-6 text-red-500" /></div>
        <h3 className="text-lg font-bold text-gray-900 text-center">Delete Appointment?</h3>
        <p className="text-sm font-bold text-gray-700 text-center my-2">{appointment?.id}</p>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-5 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-600">This permanently deletes the appointment record and cannot be undone.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button disabled={saving} className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0" onClick={onConfirm}>
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════ */
const AppointmentsPage = () => {
  const [appointments,  setAppointments]  = useState([]);
  const [allApts,       setAllApts]       = useState([]);
  const [patients,      setPatients]      = useState([]);
  const [doctors,       setDoctors]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);

  const [filterDate,   setFilterDate]    = useState(TODAY);
  const [filterDoctor, setFilterDoctor]  = useState('');
  const [filterStatus, setFilterStatus]  = useState('');
  const [filterSearch, setFilterSearch]  = useState('');
  const [activeTab,    setActiveTab]     = useState('table');
  const [page,         setPage]          = useState(1);
  const [modal,        setModal]         = useState(null);
  const { toast } = useToast();

  /* ─── Load ─── */
  useEffect(() => { loadData(); }, [filterDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [apts, pts, drs] = await Promise.all([
        api.appointments.getAll({ date: filterDate }),
        api.patients.getAll(),
        api.doctors.getAll(),
      ]);
      setAppointments(apts || []);
      setAllApts(apts || []);
      setPatients(pts || []);
      setDoctors(drs || []);
    } catch {
      toast({ title:'Error', description:'Failed to load data.', variant:'destructive' });
    } finally {
      setLoading(false);
    }
  };

  /* ─── KPIs ─── */
  const todayApts = allApts.filter(a => a.date === TODAY);
  const kpis = {
    total:     todayApts.length,
    completed: todayApts.filter(a=>a.status==='completed').length,
    ongoing:   todayApts.filter(a=>a.status==='ongoing').length,
    cancelled: todayApts.filter(a=>a.status==='cancelled').length,
    noShow:    todayApts.filter(a=>a.status==='no_show').length,
    thisMonth: allApts.length,
  };

  /* ─── Filtered + paginated ─── */
  const filtered = useMemo(() => appointments.filter(a => {
    if (filterDoctor && String(a.doctor_id)!==filterDoctor) return false;
    if (filterStatus && a.status!==filterStatus)            return false;
    if (filterSearch) {
      const q  = filterSearch.toLowerCase();
      const pt = patients.find(p=>String(p.id)===String(a.patient_id))?.name?.toLowerCase()||'';
      const dr = doctors.find(d=>String(d.id)===String(a.doctor_id))?.name?.toLowerCase()||'';
      return pt.includes(q)||dr.includes(q)||String(a.id).toLowerCase().includes(q);
    }
    return true;
  }), [appointments, filterDoctor, filterStatus, filterSearch, patients, doctors]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
  const resetPage  = () => setPage(1);

  /* ─── Action handlers ─── */
  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (modal.mode === 'add') {
        await api.appointments.create(form);
        toast({ title:'Appointment booked', description:'Created successfully.' });
      } else {
        await api.appointments.update(modal.appointment.id, form);
        toast({ title:'Appointment updated', description:'Changes saved.' });
      }
      setModal(null);
      loadData();
    } catch {
      toast({ title:'Error', description:'Failed to save.', variant:'destructive' });
    } finally { setSaving(false); }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.appointments.update(id, { status });
      const upd = a => a.map(x => x.id===id ? {...x,status} : x);
      setAppointments(upd); setAllApts(upd);
      toast({ title:'Status updated', description:`Marked as ${STATUS_CFG[status]?.label}.` });
    } catch {
      toast({ title:'Error', description:'Failed to update status.', variant:'destructive' });
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await api.appointments.delete(modal.appointment.id);
      const rem = a => a.filter(x=>x.id!==modal.appointment.id);
      setAppointments(rem); setAllApts(rem);
      toast({ title:'Appointment deleted' });
      setModal(null);
    } catch {
      toast({ title:'Error', description:'Failed to delete.', variant:'destructive' });
    } finally { setSaving(false); }
  };

  /* ─── Queue ─── */
  const queue = appointments
    .filter(a=>a.date===TODAY&&['scheduled','ongoing'].includes(a.status))
    .sort((a,b)=>(a.queue_number||0)-(b.queue_number||0));

  return (
    <MainLayout title="Appointments" subtitle="Manage, monitor and track clinic appointments">
      <div className="space-y-5">

        {/* ══ KPI CARDS ══ */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[
            {label:'Total Today',  value:kpis.total,     Icon:CalendarIcon, bg:'bg-blue-50',   color:'text-blue-600'   },
            {label:'Completed',    value:kpis.completed, Icon:CheckCircle2, bg:'bg-green-50',  color:'text-green-600'  },
            {label:'Ongoing',      value:kpis.ongoing,   Icon:PlayCircle,   bg:'bg-yellow-50', color:'text-yellow-600' },
            {label:'Cancelled',    value:kpis.cancelled, Icon:XCircle,      bg:'bg-red-50',    color:'text-red-500'    },
            {label:'No-show',      value:kpis.noShow,    Icon:UserX,        bg:'bg-gray-50',   color:'text-gray-500'   },
            {label:'This Month',   value:kpis.thisMonth, Icon:TrendingUp,   bg:'bg-purple-50', color:'text-purple-600' },
          ].map(c=>(
            <Card key={c.label}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide leading-tight">{c.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-0.5">{c.value}</p>
                  </div>
                  <div className={`p-2 rounded-xl ${c.bg}`}><c.Icon className={`w-4 h-4 ${c.color}`} /></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ══ TAB BAR ══ */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            {key:'table', label:'Appointments', Icon:LayoutList },
            {key:'queue', label:'Queue',        Icon:Users      },
          ].map(t=>(
            <button key={t.key} onClick={()=>setActiveTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${activeTab===t.key?'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200':'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
              <t.Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
          <div className="flex-1" />
          <Button onClick={()=>setModal({mode:'add'})} className="bg-blue-600 hover:bg-blue-700 text-white" data-testid="book-appointment-button">
            <Plus className="w-4 h-4 mr-2" /> Book Appointment
          </Button>
        </div>

        {/* ══ TABLE TAB ══ */}
        {activeTab === 'table' && (<>

          {/* Filter bar */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[150px]">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Date</label>
                  <input type="date" value={filterDate} onChange={e=>{setFilterDate(e.target.value);resetPage();}} className={inputCls} data-testid="date-selector" />
                </div>
                <div className="relative flex-1 min-w-[180px]">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Search</label>
                  <Search className="absolute left-3 bottom-2.5 w-4 h-4 text-gray-400" />
                  <input value={filterSearch} onChange={e=>{setFilterSearch(e.target.value);resetPage();}} placeholder="Patient, doctor, or ID..." className={`${inputCls} pl-9`} />
                </div>
                <div className="min-w-[160px]">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Doctor</label>
                  <SelectBox value={filterDoctor} onChange={v=>{setFilterDoctor(v);resetPage();}} placeholder="All Doctors" options={doctors.map(d=>({value:String(d.id),label:d.name}))} />
                </div>
                <div className="min-w-[140px]">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Status</label>
                  <SelectBox value={filterStatus} onChange={v=>{setFilterStatus(v);resetPage();}} placeholder="All Status" options={Object.entries(STATUS_CFG).map(([k,v])=>({value:k,label:v.label}))} />
                </div>
                <Button variant="outline" size="sm" onClick={()=>{setFilterDate(TODAY);setFilterDoctor('');setFilterStatus('');setFilterSearch('');resetPage();}}>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-blue-600" /> Appointments
                  <span className="text-xs font-normal text-gray-400 ml-1">{filtered.length} record{filtered.length!==1?'s':''}</span>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={()=>window.print()}><Printer className="w-3 h-3" /> Print</Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={()=>toast({title:'Exporting PDF...'})}><Download className="w-3 h-3" /> PDF</Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={()=>toast({title:'Exporting Excel...'})}><Download className="w-3 h-3" /> Excel</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center py-14"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-y border-gray-100 bg-gray-50">
                        {['ID','Date','Time','Patient','Doctor','Type','Status','Queue','Created By','Actions'].map(h=>(
                          <th key={h} className="text-left py-2.5 px-3 text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {paginated.length===0 && (
                        <tr><td colSpan={10} className="text-center py-14">
                          <CalendarIcon className="w-10 h-10 mx-auto text-gray-200 mb-2" />
                          <p className="text-sm text-gray-400">No appointments found</p>
                          <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-xs h-8" onClick={()=>setModal({mode:'add'})}>
                            <Plus className="w-3.5 h-3.5 mr-1.5" /> Book First Appointment
                          </Button>
                        </td></tr>
                      )}
                      {paginated.map(apt=>{
                        const pt=patients.find(p=>String(p.id)===String(apt.patient_id));
                        const dr=doctors.find(d=>String(d.id)===String(apt.doctor_id));
                        return (
                          <tr key={apt.id} className="hover:bg-gray-50 transition-colors" data-testid={`appointment-item-${apt.id}`}>
                            <td className="py-2.5 px-3 font-mono text-xs font-bold text-gray-400 whitespace-nowrap">{apt.id}</td>
                            <td className="py-2.5 px-3 text-xs text-gray-600 whitespace-nowrap">{fmtDate(apt.date)}</td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <p className="text-xs font-semibold text-gray-800">{fmtTime(apt.start_time)}</p>
                              <p className="text-xs text-gray-400">{fmtTime(apt.end_time)}</p>
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <p className="text-sm font-semibold text-gray-900">{pt?.name||`Patient #${apt.patient_id}`}</p>
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <p className="text-xs font-semibold text-gray-800">{dr?.name||`Doctor #${apt.doctor_id}`}</p>
                              {dr?.specialization&&<p className="text-xs text-gray-400">{dr.specialization}</p>}
                            </td>
                            <td className="py-2.5 px-3 text-xs text-gray-600 whitespace-nowrap">{apt.appointment_type||'General'}</td>
                            <td className="py-2.5 px-3"><StatusBadge status={apt.status} /></td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="inline-flex w-7 h-7 rounded-full bg-blue-50 text-blue-700 text-xs font-black items-center justify-center">{apt.queue_number||'—'}</span>
                            </td>
                            <td className="py-2.5 px-3 text-xs text-gray-500 whitespace-nowrap">{apt.created_by||'—'}</td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1">
                                <button onClick={()=>setModal({mode:'view',appointment:apt})} title="View" className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-300 transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                                <button onClick={()=>setModal({mode:'edit',appointment:apt})} title="Edit" className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-300 transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                                {apt.status==='scheduled'&&<button onClick={()=>handleStatusUpdate(apt.id,'ongoing')} title="Start" className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-yellow-600 hover:border-yellow-300 transition-colors" data-testid={`start-appointment-${apt.id}`}><PlayCircle className="w-3.5 h-3.5" /></button>}
                                {apt.status==='ongoing'&&<button onClick={()=>handleStatusUpdate(apt.id,'completed')} title="Complete" className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-green-600 hover:border-green-300 transition-colors" data-testid={`complete-appointment-${apt.id}`}><CheckSquare className="w-3.5 h-3.5" /></button>}
                                {['scheduled','ongoing'].includes(apt.status)&&<button onClick={()=>handleStatusUpdate(apt.id,'cancelled')} title="Cancel" className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-300 transition-colors"><XCircle className="w-3.5 h-3.5" /></button>}
                                {apt.status==='scheduled'&&<button onClick={()=>handleStatusUpdate(apt.id,'no_show')} title="No-show" className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors"><UserX className="w-3.5 h-3.5" /></button>}
                                <button onClick={()=>setModal({mode:'delete',appointment:apt})} title="Delete" className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-300 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <Pagination page={page} totalPages={totalPages} total={filtered.length} onPage={setPage} />
            </CardContent>
          </Card>
        </>)}

        {/* ══ QUEUE TAB ══ */}
        {activeTab === 'queue' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-700">{queue.length} patient{queue.length!==1?'s':''} in queue today</p>
                <p className="text-xs text-gray-400 mt-0.5">Scheduled + Ongoing appointments</p>
              </div>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={()=>toast({title:'Queue reset',description:'Daily queue has been reset.'})}>
                <RefreshCw className="w-3.5 h-3.5" /> Reset Queue
              </Button>
            </div>
            {queue.length===0 ? (
              <Card><CardContent className="text-center py-14">
                <Users className="w-10 h-10 mx-auto text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">No active queue for today</p>
              </CardContent></Card>
            ) : (
              <div className="space-y-2">
                {queue.map((apt,idx)=>{
                  const pt=patients.find(p=>String(p.id)===String(apt.patient_id));
                  const dr=doctors.find(d=>String(d.id)===String(apt.doctor_id));
                  const isOngoing=apt.status==='ongoing';
                  const wait=idx*30;
                  return (
                    <Card key={apt.id} className={`border-l-4 ${isOngoing?'border-l-yellow-400':'border-l-blue-300'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl flex-shrink-0 ${isOngoing?'bg-yellow-100 text-yellow-700':'bg-blue-50 text-blue-600'}`}>
                            {apt.queue_number||idx+1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-gray-900">{pt?.name||`Patient #${apt.patient_id}`}</p>
                              <StatusBadge status={apt.status} />
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {fmtTime(apt.start_time)} &rarr; {fmtTime(apt.end_time)} &bull; {dr?.name||`Doctor #${apt.doctor_id}`} &bull; Wait: <span className="font-semibold">{wait===0?'Now':'~'+wait+' min'}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {apt.status==='scheduled'&&<Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-white h-8 text-xs" onClick={()=>handleStatusUpdate(apt.id,'ongoing')}><PlayCircle className="w-3.5 h-3.5 mr-1" /> Start</Button>}
                            {apt.status==='ongoing'&&<Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs" onClick={()=>handleStatusUpdate(apt.id,'completed')}><CheckSquare className="w-3.5 h-3.5 mr-1" /> Complete</Button>}
                            <button onClick={()=>handleStatusUpdate(apt.id,'no_show')} className="h-8 px-2.5 text-xs rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors font-semibold">No-show</button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ══ MODALS ══ */}
      {(modal?.mode==='add'||modal?.mode==='edit') && (
        <AppointmentModal mode={modal.mode} appointment={modal.appointment} appointments={appointments}
          patients={patients} doctors={doctors} onClose={()=>setModal(null)} onSave={handleSave} saving={saving} />
      )}
      {modal?.mode==='view' && (
        <ViewModal appointment={modal.appointment} patients={patients} doctors={doctors}
          onClose={()=>setModal(null)} onEdit={apt=>setModal({mode:'edit',appointment:apt})} />
      )}
      {modal?.mode==='delete' && (
        <DeleteModal appointment={modal.appointment} onClose={()=>setModal(null)} onConfirm={handleDelete} saving={saving} />
      )}
    </MainLayout>
  );
};

export default AppointmentsPage;