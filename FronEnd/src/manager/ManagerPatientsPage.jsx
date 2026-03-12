import React, { useState, useMemo, useEffect } from 'react';
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

/* ══════════════ API CONFIG ══════════════ */
const API = 'http://backend1.test/api';

/* Map Laravel patient fields → internal shape used by this page */
const mapPatient = (p) => ({
  id:               p.id,
  name:             `${p.first_name}${p.middle_name ? ' ' + p.middle_name : ''} ${p.last_name}`.trim(),
  dob:              p.dob,
  gender:           p.gender,
  address:          [p.street, p.city, p.province].filter(Boolean).join(', '),
  contact:          p.mobile,
  email:            p.email,
  emergencyName:    p.emergency_name,
  emergencyContact: p.emergency_contact,
  allergies:        p.allergies,
  conditions:       p.conditions,
  notes:            p.medications ?? '',
  followup:         p.followup ?? 'No',
  status:           p.status ?? 'active',
  dateRegistered:   p.created_at?.split('T')[0] ?? '',
  lastVisit:        p.last_visit ?? '',
  // keep raw fields for ViewField display
  civil_status:     p.civil_status,
  nationality:      p.nationality,
  blood_type:       p.blood_type,
  emergency_relationship: p.emergency_relationship,
});

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
  notes:'', followup:'No', status:'active',
};

/* Read-only field display */
const ViewField = ({ label, value, full }) => (
  <div className={`space-y-1 ${full ? 'col-span-2' : ''}`}>
    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{label}</p>
    <p className="text-sm text-gray-800 font-medium">{value || <span className="text-gray-300 italic">—</span>}</p>
  </div>
);

function PatientModal({ mode, patient, onClose, onSave }) {
  const isAdd = mode === 'add';
  const [isEditing, setIsEditing] = useState(isAdd);
  const [form, setForm] = useState(patient ? { ...patient } : { ...EMPTY_FORM });
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

  const handleCancelEdit = () => {
    setForm({ ...patient });
    setErrors({});
    setIsEditing(false);
  };

  const tabs = [
    { key:'personal', label:'Personal Info', icon: Users },
    { key:'medical',  label:'Medical Info',  icon: Heart },
    { key:'crm',      label:'CRM Info',      icon: Activity },
  ];

  const readonlyCls = `${inputCls} bg-gray-50 text-gray-500 cursor-default pointer-events-none`;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{patient.name}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Patient ID: {patient.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
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
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <ViewField label="Full Name"               value={form.name} />
              <ViewField label="Date of Birth"           value={`${fmtDate(form.dob)} (${calcAge(form.dob)} yrs)`} />
              <ViewField label="Gender"                  value={form.gender} />
              <ViewField label="Contact Number"          value={form.contact} />
              <ViewField label="Email"                   value={form.email} />
              <ViewField label="Address"                 value={form.address} full />
              <ViewField label="Emergency Contact Name"  value={form.emergencyName} />
              <ViewField label="Emergency Contact No."   value={form.emergencyContact} />
            </div>
          )}

          {/* ── Medical ── */}
          {tab === 'medical' && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <ViewField label="Known Allergies"     value={form.allergies} />
              <ViewField label="Existing Conditions" value={form.conditions} />
              <ViewField label="Status"              value={form.status === 'active' ? 'Active' : 'Inactive'} />
              <div className="col-span-2 space-y-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Medical Notes</p>
                <p className="text-sm text-gray-800 font-medium whitespace-pre-wrap">
                  {form.notes || <span className="text-gray-300 italic">—</span>}
                </p>
              </div>
            </div>
          )}

          {/* ── CRM ── */}
          {tab === 'crm' && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <ViewField label="Follow-up Required" value={form.followup} />
              <ViewField label="Date Registered"    value={fmtDate(patient?.dateRegistered)} />
              <ViewField label="Last Visit"         value={fmtDate(patient?.lastVisit)} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex-shrink-0">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════ MAIN PAGE ══════════════ */
export default function PatientsPage() {
  const [patients, setPatients]   = useState([]);
  const [loading,  setLoading]    = useState(true);
  const [error,    setError]      = useState(null);
  const [search,   setSearch]     = useState('');
  const [statusFil,setStatusFil]  = useState('active');
  const [modal,    setModal]      = useState(null);
  const [page,     setPage]       = useState(1);
  const { toast } = useToast();

  /* ── fetch patients ── */
  const fetchPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const res = await fetch(`${API}/patients`, {
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      // support both paginated { data: [...] } and plain array
      const list = Array.isArray(data) ? data : (data.data ?? []);
      setPatients(list.map(mapPatient));
    } catch (err) {
      setError(err.message);
      toast({ title: 'Failed to load patients', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPatients(); }, []);

  /* ── analytics ── */
  const total        = patients.length;
  const activeCount  = patients.filter(p => p.status === 'active').length;
  const needFollowup = patients.filter(p => p.followup === 'Yes' && p.status === 'active').length;
  const thisMonth    = patients.filter(p => {
    if (!p.dateRegistered) return false;
    const d = new Date(p.dateRegistered);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  /* ── filters ── */
  const filtered = useMemo(() => {
    return patients.filter(p => {
      if (statusFil !== 'all' && p.status !== statusFil) return false;
      if (search) {
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.contact.includes(q) || p.id.toLowerCase().includes(q);
      }
      return true;
    });
  }, [patients, statusFil, search]);

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

  const openEdit = (patient) => {
    setModal({ mode: 'edit', patient });
  };

  return (
    <MainLayout title="Patient Records" subtitle="Register, manage and track patient information">
      <div className="space-y-5">

        {/* ══ ANALYTICS CARDS ══ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label:'Total Patients',   value:total,        icon:Users,       bg:'bg-blue-50',   color:'text-blue-600'   },
            { label:'Active',           value:activeCount,  icon:UserCheck,   bg:'bg-green-50',  color:'text-green-600'  },
            { label:'New This Month',   value:thisMonth,    icon:ArrowUpRight,bg:'bg-teal-50',   color:'text-teal-600'   },
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

              {/* Status filter */}
              <div className="min-w-[140px]">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Status</label>
                <SelectBox value={statusFil} onChange={v => { setStatusFil(v); setPage(1); }}
                  options={[{value:'all',label:'All Status'},{value:'active',label:'Active'},{value:'inactive',label:'Inactive'}]} />
              </div>

              {/* Reset */}
              <Button variant="outline" size="sm" onClick={() => { setSearch(''); setStatusFil('active'); setPage(1); }}>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Reset
              </Button>

              <div className="flex-1" />

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
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">{filtered.length} record{filtered.length !== 1?'s':''}</span>
                <Button size="sm" variant="ghost" onClick={fetchPatients} disabled={loading} className="h-7 px-2">
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-gray-100 bg-gray-50">
                    {['Full Name','Age/Gender','Last Visit','Status','Actions'].map(h => (
                      <th key={h} className="text-left py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading && (
                    <tr><td colSpan={5} className="text-center py-14">
                      <RefreshCw className="w-8 h-8 mx-auto text-blue-300 animate-spin mb-2" />
                      <p className="text-sm text-gray-400">Loading patients…</p>
                    </td></tr>
                  )}
                  {error && !loading && (
                    <tr><td colSpan={5} className="text-center py-14">
                      <AlertCircle className="w-8 h-8 mx-auto text-red-300 mb-2" />
                      <p className="text-sm text-red-400 font-medium">{error}</p>
                      <button onClick={fetchPatients} className="mt-2 text-xs text-blue-500 underline">Retry</button>
                    </td></tr>
                  )}
                  {paginated.length === 0 && !loading && (
                    <tr><td colSpan={5} className="text-center py-14">
                      <Users className="w-10 h-10 mx-auto text-gray-200 mb-2" />
                      <p className="text-sm text-gray-400 font-medium">No patients found</p>
                      <p className="text-xs text-gray-300 mt-1">Try adjusting search or filters</p>
                    </td></tr>
                  )}
                  {paginated.map(p => {
                    return (
                      <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${p.status==='inactive'?'opacity-60':''}`}
                        data-testid={`patient-item-${p.id}`}>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-blue-100 text-blue-600">
                              {p.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                            </div>
                            <p className="font-semibold text-gray-900 whitespace-nowrap">{p.name}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <p className="text-gray-800 font-medium">{calcAge(p.dob)} yrs</p>
                          <p className="text-xs text-gray-400">{p.gender}</p>
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-500 whitespace-nowrap">{fmtDate(p.lastVisit)}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Switch checked={p.status==='active'} onCheckedChange={() => handleToggleStatus(p.id)} />
                            <StatusBadge status={p.status} />
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs gap-1.5"
                              onClick={() => setModal({ mode:'view', patient: p })}>
                              <Eye className="w-3 h-3" /> View
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
      {(modal?.mode === 'add' || modal?.mode === 'view') && (
        <PatientModal mode={modal.mode} patient={modal.patient} onClose={() => setModal(null)} onSave={handleSave} />
      )}
    </MainLayout>
  );
}