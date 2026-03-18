import React, { useState, useMemo, useEffect } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import {
  Search, Eye, EyeOff, ChevronDown, X, Check, RefreshCw,
  Users, UserCheck, UserX, AlertCircle, AlertTriangle,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Heart, Activity, ArrowUpRight, Lock, Loader2,
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

/* ══════════════ API CONFIG ══════════════ */
const API = import.meta.env.VITE_API_URL ?? 'http://backend1.test/api';

const apiFetch = async (path, options = {}) => {
  const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept:         'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
};

/* ══════════════ MAPPER ══════════════ */
const mapPatient = (p) => ({
  id:               p.id,
  first_name:       p.first_name  ?? '',
  last_name:        p.last_name   ?? '',
  middle_name:      p.middle_name ?? '',
  name:             `${p.first_name}${p.middle_name ? ' ' + p.middle_name : ''} ${p.last_name}`.trim(),
  dob:              p.dob,
  gender:           p.gender,
  civil_status:     p.civil_status,
  nationality:      p.nationality,
  address:          [p.street, p.city, p.province].filter(Boolean).join(', '),
  contact:          p.mobile,
  email:            p.email,
  blood_type:       p.blood_type,
  allergies:        p.allergies,
  conditions:       p.conditions,
  notes:            p.medications ?? '',
  emergencyName:    p.emergency_name,
  emergencyContact: p.emergency_contact,
  emergency_relationship: p.emergency_relationship,
  followup:         p.followup   ?? 'No',
  status:           (p.status    ?? 'active').toLowerCase(),
  dateRegistered:   p.created_at?.split('T')[0] ?? '',
  lastVisit:        p.last_visit ?? '',
});

/* ══════════════ HELPERS ══════════════ */
const calcAge = (dob) => {
  if (!dob) return '—';
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
};

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
};

const initials = (p) =>
  `${p.first_name?.[0] ?? ''}${p.last_name?.[0] ?? ''}`.toUpperCase();

/* ══════════════ SMALL COMPONENTS ══════════════ */
const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold
    ${status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
    {status === 'active' ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
    {status === 'active' ? 'Active' : 'Inactive'}
  </span>
);

const SelectBox = ({ value, onChange, options }) => (
  <div className="relative">
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
  </div>
);

const FieldRow = ({ label, required, children }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

const ViewField = ({ label, value, full }) => (
  <div className={`space-y-1 ${full ? 'col-span-2' : ''}`}>
    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{label}</p>
    <p className="text-sm text-gray-800 font-medium">{value || <span className="text-gray-300 italic">—</span>}</p>
  </div>
);

/* ══════════════ KPI CARD ══════════════ */
const KPICard = ({ label, value, icon: Icon, iconBg, iconColor, loading }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{label}</p>
          {loading
            ? <div className="w-8 h-7 bg-gray-100 rounded animate-pulse mt-0.5" />
            : <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

/* ══════════════ PAGINATION ══════════════ */
function Pagination({ currentPage, totalPages, totalItems, pageSize, onPageChange, onPageSizeChange }) {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end   = Math.min(currentPage * pageSize, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
    return pages;
  };

  const btnBase     = 'inline-flex items-center justify-center h-8 w-8 rounded-lg text-xs font-semibold transition-all';
  const btnActive   = 'bg-blue-600 text-white shadow-sm shadow-blue-200';
  const btnIdle     = 'border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 bg-white';
  const btnDisabled = 'border border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50/60 rounded-b-xl">
      <div className="flex items-center gap-3">
        <p className="text-xs text-gray-400">
          Showing <span className="font-semibold text-gray-600">{start}–{end}</span> of{' '}
          <span className="font-semibold text-gray-600">{totalItems}</span> patients
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">Rows:</span>
          <div className="relative">
            <select value={pageSize} onChange={e => onPageSizeChange(Number(e.target.value))}
              className="text-xs border border-gray-200 rounded-lg pl-2 pr-6 py-1 text-gray-600 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
              {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(1)} disabled={currentPage === 1}
          className={`${btnBase} ${currentPage === 1 ? btnDisabled : btnIdle}`}><ChevronsLeft className="w-3.5 h-3.5" /></button>
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
          className={`${btnBase} ${currentPage === 1 ? btnDisabled : btnIdle}`}><ChevronLeft className="w-3.5 h-3.5" /></button>
        {getPageNumbers().map((p, i) =>
          p === '...'
            ? <span key={`e-${i}`} className="px-1 text-gray-300 text-xs select-none">…</span>
            : <button key={p} onClick={() => onPageChange(p)}
                className={`${btnBase} ${p === currentPage ? btnActive : btnIdle}`}>{p}</button>
        )}
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0}
          className={`${btnBase} ${currentPage === totalPages || totalPages === 0 ? btnDisabled : btnIdle}`}><ChevronRight className="w-3.5 h-3.5" /></button>
        <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages || totalPages === 0}
          className={`${btnBase} ${currentPage === totalPages || totalPages === 0 ? btnDisabled : btnIdle}`}><ChevronsRight className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}

/* ══════════════ PASSWORD GATE MODAL ══════════════ */
function PasswordGateModal({ patient, onClose, onSuccess }) {
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [checking, setChecking] = useState(false);

  const handleVerify = async () => {
    if (!password.trim()) { setError('Please enter your password.'); return; }
    setChecking(true);
    setError('');
    try {
      const { ok, data } = await apiFetch('/auth/verify-password', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      const isVerified =
        data.verified === true ||
        data.success  === true ||
        (ok && typeof data.message === 'string' && data.message.toLowerCase().includes('verified'));

      if (isVerified) { onSuccess(); }
      else { setError(data.message ?? 'Incorrect password. Please try again.'); }
    } catch {
      setError('Unable to reach server. Try again.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50">
              <Lock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Authentication Required</h2>
              <p className="text-xs text-gray-400 mt-0.5">Enter your password to view patient record</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="px-6 py-4">
          {/* Patient preview */}
          <div className="flex items-center gap-3 p-3 rounded-xl border border-blue-100 bg-blue-50 mb-5">
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 bg-blue-100 text-blue-700">
              {initials(patient)}
            </div>
            <div>
              <p className="text-sm font-bold text-blue-700">{patient.name}</p>
              <p className="text-xs text-blue-400">{patient.gender} · {calcAge(patient.dob)} yrs old</p>
            </div>
            <div className="ml-auto">
              <StatusBadge status={patient.status} />
            </div>
          </div>

          <FieldRow label="Your Password" required>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleVerify()}
                placeholder="Enter your password"
                autoFocus
                className={`${inputCls} pr-10 ${error ? 'border-red-300 focus:ring-red-400' : ''}`}
              />
              <button type="button" onClick={() => setShowPw(p => !p)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && (
              <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {error}
              </p>
            )}
          </FieldRow>
        </div>

        <div className="flex gap-2 px-6 pb-6">
          <Button variant="outline" onClick={onClose} className="flex-1" disabled={checking}>Cancel</Button>
          <Button onClick={handleVerify} disabled={checking} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
            {checking
              ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Verifying…</>
              : <><Lock className="w-4 h-4 mr-1.5" /> Verify & View</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════ PATIENT DETAIL MODAL ══════════════ */
function PatientModal({ patient, onClose, onToggleStatus }) {
  const [tab,           setTab]           = useState('personal');
  const [toggling,      setToggling]      = useState(false);
  const [confirmToggle, setConfirmToggle] = useState(false);

  const tabs = [
    { key: 'personal', label: 'Personal Info', icon: Users    },
    { key: 'medical',  label: 'Medical Info',  icon: Heart    },
    { key: 'crm',      label: 'CRM Info',      icon: Activity },
  ];

  const handleToggleConfirm = async () => {
    setConfirmToggle(false);
    setToggling(true);
    await onToggleStatus(patient.id);
    setToggling(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col"
          onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-blue-100 text-blue-600 flex-shrink-0">
                {initials(patient)}
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">{patient.name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-gray-400">Patient ID: {patient.id}</p>
                  <StatusBadge status={patient.status} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2">
                <Switch
                  checked={patient.status === 'active'}
                  onCheckedChange={() => setConfirmToggle(true)}
                  disabled={toggling}
                />
                <span className="text-xs text-gray-500 font-medium">
                  {toggling ? 'Updating…' : patient.status === 'active' ? 'Active' : 'Inactive'}
                </span>
                {toggling && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />}
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Inactive banner */}
          {patient.status === 'inactive' && (
            <div className="mx-6 mt-4 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <p className="text-xs text-amber-700 font-medium">
                This patient is currently <strong>inactive</strong>. Toggle the switch above to reactivate.
              </p>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-gray-100 flex-shrink-0 px-6 mt-2">
            {tabs.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-colors -mb-px whitespace-nowrap
                    ${tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                  <Icon className="w-4 h-4" /> {t.label}
                </button>
              );
            })}
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1">
            {tab === 'personal' && (
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <ViewField label="Full Name"              value={patient.name} />
                <ViewField label="Date of Birth"          value={`${fmtDate(patient.dob)} (${calcAge(patient.dob)} yrs)`} />
                <ViewField label="Gender"                 value={patient.gender} />
                <ViewField label="Civil Status"           value={patient.civil_status} />
                <ViewField label="Nationality"            value={patient.nationality} />
                <ViewField label="Contact Number"         value={patient.contact} />
                <ViewField label="Email"                  value={patient.email} />
                <ViewField label="Address"                value={patient.address} full />
                <ViewField label="Emergency Contact Name" value={patient.emergencyName} />
                <ViewField label="Relationship"           value={patient.emergency_relationship} />
                <ViewField label="Emergency Contact No."  value={patient.emergencyContact} />
              </div>
            )}
            {tab === 'medical' && (
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <ViewField label="Blood Type"          value={patient.blood_type} />
                <ViewField label="Known Allergies"     value={patient.allergies} />
                <ViewField label="Existing Conditions" value={patient.conditions} />
                <div className="col-span-2 space-y-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Current Medications / Notes</p>
                  <p className="text-sm text-gray-800 font-medium whitespace-pre-wrap">
                    {patient.notes || <span className="text-gray-300 italic">—</span>}
                  </p>
                </div>
              </div>
            )}
            {tab === 'crm' && (
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <ViewField label="Follow-up Required" value={patient.followup} />
                <ViewField label="Date Registered"    value={fmtDate(patient.dateRegistered)} />
                <ViewField label="Last Visit"         value={fmtDate(patient.lastVisit)} />
                <ViewField label="Account Status"     value={patient.status === 'active' ? 'Active' : 'Inactive'} />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex-shrink-0">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>

      {/* ── Confirm Toggle Dialog ── */}
      {confirmToggle && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4"
            onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center
                ${patient.status === 'active' ? 'bg-red-50' : 'bg-green-50'}`}>
                {patient.status === 'active'
                  ? <X className="w-6 h-6 text-red-500" />
                  : <Check className="w-6 h-6 text-green-600" />}
              </div>
              <h3 className="text-base font-bold text-gray-900">
                {patient.status === 'active' ? 'Deactivate Patient?' : 'Reactivate Patient?'}
              </h3>
            </div>

            {/* Warning info box */}
            <div className={`rounded-xl border p-4 ${patient.status === 'active' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
              <div className={`flex items-start gap-2 text-xs ${patient.status === 'active' ? 'text-red-700' : 'text-blue-700'}`}>
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">
                    {patient.status === 'active' ? 'Deactivating this patient will:' : 'Reactivating this patient will:'}
                  </p>
                  <ul className="mt-1.5 space-y-1 list-disc list-inside">
                    {patient.status === 'active' ? (
                      <>
                        <li>Mark the patient as inactive</li>
                        <li>Hide them from active patient lists</li>
                        <li>Preserve all existing records and history</li>
                      </>
                    ) : (
                      <>
                        <li>Mark the patient as active again</li>
                        <li>Restore visibility in patient lists</li>
                        <li>Re-enable scheduling and appointments</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmToggle(false)}>
                Cancel
              </Button>
              <Button
                className={`flex-1 text-white ${patient.status === 'active' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'}`}
                onClick={handleToggleConfirm}>
                {patient.status === 'active' ? 'Yes, Deactivate' : 'Yes, Reactivate'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ══════════════ MAIN PAGE ══════════════ */
export default function PatientsPage() {
  const [patients,    setPatients]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [search,      setSearch]      = useState('');
  const [statusFil,   setStatusFil]   = useState('All Status');
  const [genderFil,   setGenderFil]   = useState('All Gender');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize,    setPageSize]    = useState(10);

  const [pendingPatient, setPendingPatient] = useState(null);
  const [viewPatient,    setViewPatient]    = useState(null);
  const [showGate,       setShowGate]       = useState(false);

  const { toast } = useToast();

  /* ── fetch ── */
  const fetchPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      const { ok, data } = await apiFetch('/patients');
      if (!ok) throw new Error(data.message ?? 'Server error');
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
  const total       = patients.length;
  const activeCount = patients.filter(p => p.status === 'active').length;
  const inactiveCount = patients.filter(p => p.status === 'inactive').length;
  const thisMonth   = patients.filter(p => {
    if (!p.dateRegistered) return false;
    const d = new Date(p.dateRegistered), now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  /* ── filters ── */
  const filtered = useMemo(() => patients.filter(p => {
    if (statusFil !== 'All Status' && p.status !== statusFil.toLowerCase()) return false;
    if (genderFil !== 'All Gender' && p.gender?.toLowerCase() !== genderFil.toLowerCase()) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q)
        || p.contact?.includes(q)
        || String(p.id).toLowerCase().includes(q)
        || p.email?.toLowerCase().includes(q);
    }
    return true;
  }), [patients, statusFil, genderFil, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(currentPage, totalPages);
  const paginated  = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  /* ── toggle status ── */
  const handleToggleStatus = async (id) => {
    try {
      const { ok, data } = await apiFetch(`/patients/${id}/toggle-status`, { method: 'PATCH' });
      if (!ok) throw new Error(data.message ?? 'Failed to update status');
      setPatients(prev => prev.map(p => p.id === id ? { ...p, status: data.status.toLowerCase() } : p));
      if (viewPatient?.id === id) setViewPatient(v => ({ ...v, status: data.status.toLowerCase() }));
      toast({ title: `Patient ${data.status === 'active' ? 'activated' : 'deactivated'}` });
    } catch (err) {
      toast({ title: 'Failed to update status', description: err.message, variant: 'destructive' });
    }
  };

  /* ── view: password gate first ── */
  const handleViewClick = (patient) => {
    setPendingPatient(patient);
    setShowGate(true);
  };

  const handleGateSuccess = () => {
    setShowGate(false);
    setViewPatient(pendingPatient);
    setPendingPatient(null);
  };

  return (
    <MainLayout title="Patient Records" subtitle="Register, manage and track patient information">
      <div className="space-y-5">

        {/* ══ KPI CARDS ══ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard label="Total Patients" value={total}         icon={Users}        iconBg="bg-blue-50"  iconColor="text-blue-600"  loading={loading} />
          <KPICard label="Active"         value={activeCount}   icon={UserCheck}    iconBg="bg-green-50" iconColor="text-green-600" loading={loading} />
          <KPICard label="Inactive"       value={inactiveCount} icon={UserX}        iconBg="bg-gray-50"  iconColor="text-gray-500"  loading={loading} />
          <KPICard label="New This Month" value={thisMonth}     icon={ArrowUpRight} iconBg="bg-teal-50"  iconColor="text-teal-600"  loading={loading} />
        </div>

        {/* ══ TABLE ══ */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" /> All Patients
              </CardTitle>
              <span className="text-xs text-gray-400">{filtered.length} patient{filtered.length !== 1 ? 's' : ''}</span>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Filters */}
            <CardContent className="pb-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="relative flex-1 min-w-[220px]">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Search</label>
                  <Search className="absolute left-3 bottom-2.5 w-4 h-4 text-gray-400" />
                  <input value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                    placeholder="Name, contact, email, ID…" className={`${inputCls} pl-9`} />
                </div>
                <div className="min-w-[140px]">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Status</label>
                  <SelectBox value={statusFil} onChange={v => { setStatusFil(v); setCurrentPage(1); }}
                    options={[
                      { value: 'All Status', label: 'All Status' },
                      { value: 'active',     label: 'Active'     },
                      { value: 'inactive',   label: 'Inactive'   },
                    ]} />
                </div>
                <div className="min-w-[140px]">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Gender</label>
                  <SelectBox value={genderFil} onChange={v => { setGenderFil(v); setCurrentPage(1); }}
                    options={[
                      { value: 'All Gender', label: 'All Gender' },
                      { value: 'Male',       label: 'Male'       },
                      { value: 'Female',     label: 'Female'     },
                    ]} />
                </div>
                <Button variant="outline" size="sm"
                  onClick={() => { setSearch(''); setStatusFil('All Status'); setGenderFil('All Gender'); setCurrentPage(1); }}>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Reset
                </Button>
                <div className="flex-1" />
                <Button size="sm" variant="ghost" onClick={fetchPatients} disabled={loading} className="h-9 px-3">
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardContent>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-gray-100 bg-gray-50">
                    {['Patient', 'Age / Gender', 'Contact', 'Status', 'Registered', 'Actions'].map(h => (
                      <th key={h} className="text-left py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading && Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="py-3 px-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                      </td>
                    ))}</tr>
                  ))}
                  {error && !loading && (
                    <tr><td colSpan={6} className="text-center py-14">
                      <AlertCircle className="w-8 h-8 mx-auto text-red-300 mb-2" />
                      <p className="text-sm text-red-400 font-medium">{error}</p>
                      <button onClick={fetchPatients} className="mt-2 text-xs text-blue-500 underline">Retry</button>
                    </td></tr>
                  )}
                  {!loading && !error && paginated.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-14">
                      <Users className="w-10 h-10 mx-auto text-gray-200 mb-2" />
                      <p className="text-sm font-medium text-gray-400">No patients found</p>
                      <p className="text-xs text-gray-300 mt-1">Try adjusting your search or filters</p>
                    </td></tr>
                  )}
                  {!loading && !error && paginated.map(p => (
                    <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${p.status === 'inactive' ? 'opacity-60' : ''}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-blue-100 text-blue-600">
                            {initials(p)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 leading-tight">{p.name}</p>
                            <p className="text-xs text-gray-400">{p.email || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className="text-gray-800 font-medium">{calcAge(p.dob)} yrs</p>
                        <p className="text-xs text-gray-400">{p.gender || '—'}</p>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500">{p.contact || '—'}</td>
                      <td className="py-3 px-4"><StatusBadge status={p.status} /></td>
                      <td className="py-3 px-4 text-xs text-gray-500 whitespace-nowrap">{fmtDate(p.dateRegistered)}</td>
                      <td className="py-3 px-4">
                        <Button size="sm" variant="outline"
                          className="h-7 px-3 text-xs gap-1.5 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-400"
                          onClick={() => handleViewClick(p)}>
                          <Eye className="w-3.5 h-3.5" /> View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(n) => { setPageSize(n); setCurrentPage(1); }}
            />
          </CardContent>
        </Card>

      </div>

      {/* ══ PASSWORD GATE ══ */}
      {showGate && pendingPatient && (
        <PasswordGateModal
          patient={pendingPatient}
          onClose={() => { setShowGate(false); setPendingPatient(null); }}
          onSuccess={handleGateSuccess}
        />
      )}

      {/* ══ PATIENT DETAIL MODAL ══ */}
      {viewPatient && (
        <PatientModal
          patient={viewPatient}
          onClose={() => setViewPatient(null)}
          onToggleStatus={handleToggleStatus}
        />
      )}
    </MainLayout>
  );
}