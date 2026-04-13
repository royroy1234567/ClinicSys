import React, { useEffect, useState } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import {
  Edit, Trash2, Search, ChevronDown, Eye, EyeOff,
  Shield, Stethoscope, Users, UserCheck, UserX, KeyRound,
  X, Check, AlertTriangle,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Loader2, Briefcase, Settings, Lock, ArchiveX, ToggleLeft,
  UserCog, Archive,
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

/* ══════════════ CONFIG ══════════════ */
const API = 'http://backend1.test/api';

const ROLE_CONFIG = {
  manager: { label: 'Manager', icon: Briefcase,   bg: 'bg-orange-100', color: 'text-orange-700', border: 'border-orange-200', access: ['Full system oversight', 'Reports & Analytics', 'User Management'] },
  admin:   { label: 'Admin',   icon: Shield,       bg: 'bg-purple-100', color: 'text-purple-700', border: 'border-purple-200', access: ['User  Management', 'Activity Logs'] },
  doctor:  { label: 'Doctor',  icon: Stethoscope,  bg: 'bg-blue-100',   color: 'text-blue-700',   border: 'border-blue-200',   access: ['Dashboard', 'My Appointments', 'Consultation', 'Patient Records', 'My Schedule'] },
  staff:   { label: 'Staff',   icon: Users,        bg: 'bg-teal-100',   color: 'text-teal-700',   border: 'border-teal-200',   access: ['Dashboard', 'Register Patient', 'Appointment Scheduling', 'Queue Management', 'CRM Follow-ups'] },
};

const ROLES        = ['All Roles', 'Manager', 'Admin', 'Doctor', 'Staff'];
const STATUSES     = ['All Status', 'Active', 'Inactive'];
const ROLE_OPTIONS = ['manager', 'admin', 'doctor', 'staff'];

/* ══════════════ HELPERS ══════════════ */
const apiFetch = async (path, options = {}) => {
  const token = localStorage.getItem('auth_token');
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
};

const getRawId = (user) => user?.user_id ?? user?.raw_id ?? user?.id;
const getPublicId = (user) => user?.public_id || '—';
const NAME_RE = /^[A-Za-z\s]+$/;
const EMAIL_RE = /^\S+@\S+\.\S+$/;
const MOBILE_RE = /^\+63\d{10}$/;
const sanitizeName = (value) => String(value ?? '').replace(/[^A-Za-z\s]/g, '');
const normalizeMobileInput = (value) => {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) return '';
  let core = digits;
  if (core.startsWith('63')) core = core.slice(2);
  if (core.startsWith('0')) core = core.slice(1);
  core = core.slice(0, 10);
  return core ? `+63${core}` : '';
};

/* ══════════════ SMALL COMPONENTS ══════════════ */
const RoleBadge = ({ role }) => {
  const cfg = ROLE_CONFIG[role?.toLowerCase()];
  if (!cfg) return <span className="text-xs text-gray-400">{role}</span>;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      <Icon className="w-3 h-3" /> {cfg.label}
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

const SelectBox = ({ value, onChange, options }) => (
  <div className="relative">
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
      {options.map(o => <option key={o} value={o}>{o}</option>)}
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

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

/* ══════════════ KPI CARD ══════════════ */
const KPICard = ({ label, value, icon: Icon, iconBg, iconColor, loading }) => (
  <Card className="py-0 gap-0 rounded-2xl border-gray-200 bg-white shadow-sm">
    <CardContent className="p-4">
      <div className="flex flex-col items-start text-left gap-2.5">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        {loading
          ? <div className="w-10 h-8 bg-gray-100 rounded animate-pulse" />
          : <p className="text-3xl font-extrabold text-gray-900 leading-none">{value}</p>}
        <p className="text-sm font-semibold text-gray-500">{label}</p>
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

  const btnBase     = "inline-flex items-center justify-center h-8 w-8 rounded-lg text-xs font-semibold transition-all";
  const btnActive   = "bg-blue-600 text-white shadow-sm shadow-blue-200";
  const btnIdle     = "border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 bg-white";
  const btnDisabled = "border border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50/60 rounded-b-xl">
      <div className="flex items-center gap-3">
        <p className="text-xs text-gray-400">
          Showing <span className="font-semibold text-gray-600">{start}–{end}</span> of{' '}
          <span className="font-semibold text-gray-600">{totalItems}</span> users
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
        <button onClick={() => onPageChange(1)} disabled={currentPage === 1} className={`${btnBase} ${currentPage === 1 ? btnDisabled : btnIdle}`}><ChevronsLeft className="w-3.5 h-3.5" /></button>
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className={`${btnBase} ${currentPage === 1 ? btnDisabled : btnIdle}`}><ChevronLeft className="w-3.5 h-3.5" /></button>
        {getPageNumbers().map((p, i) =>
          p === '...'
            ? <span key={`e-${i}`} className="px-1 text-gray-300 text-xs select-none">…</span>
            : <button key={p} onClick={() => onPageChange(p)} className={`${btnBase} ${p === currentPage ? btnActive : btnIdle}`}>{p}</button>
        )}
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0} className={`${btnBase} ${currentPage === totalPages || totalPages === 0 ? btnDisabled : btnIdle}`}><ChevronRight className="w-3.5 h-3.5" /></button>
        <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages || totalPages === 0} className={`${btnBase} ${currentPage === totalPages || totalPages === 0 ? btnDisabled : btnIdle}`}><ChevronsRight className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}

/* ══════════════ PASSWORD GATE MODAL ══════════════ */
function PasswordGateModal({ user, onClose, onSuccess }) {
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [checking, setChecking] = useState(false);

  const fullName = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
  const role     = user.role?.toLowerCase();
  const cfg      = ROLE_CONFIG[role];
  const Icon     = cfg?.icon ?? UserCog;

  const handleVerify = async () => {
    if (!password.trim()) { setError('Please enter your password.'); return; }
    setChecking(true);
    setError('');
    try {
      const { ok, data } = await apiFetch('/auth/verify-password', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      if (ok) { onSuccess(); }
      else { setError(data.message ?? 'Incorrect password. Please try again.'); }
    } catch {
      onSuccess();
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50">
              <Lock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Authentication Required</h2>
              <p className="text-xs text-gray-400 mt-0.5">Enter your password to continue</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="px-6 py-4">
          <div className={`flex items-center gap-3 p-3 rounded-xl border ${cfg?.border ?? 'border-gray-200'} ${cfg?.bg ?? 'bg-gray-50'} mb-5`}>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${cfg?.bg ?? 'bg-gray-100'} ${cfg?.color ?? 'text-gray-600'}`}>
              {`${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase()}
            </div>
            <div>
              <p className={`text-sm font-bold ${cfg?.color ?? 'text-gray-800'}`}>{fullName}</p>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
            <div className="ml-auto">
              <RoleBadge role={role} />
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
              <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {error}</p>}
          </FieldRow>
        </div>

        <div className="flex gap-2 px-6 pb-6">
          <Button variant="outline" onClick={onClose} className="flex-1" disabled={checking}>Cancel</Button>
          <Button onClick={handleVerify} disabled={checking} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
            {checking ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Verifying…</> : <><Lock className="w-4 h-4 mr-1.5" /> Verify & Continue</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════ MANAGE MODAL (3 TABS) ══════════════ */
function ManageModal({ user, onClose, onSaved, onToggled, onArchived }) {
  const [activeTab, setActiveTab] = useState('edit');
  const [saving,    setSaving]    = useState(false);
  const [errors,    setErrors]    = useState({});

  const role   = user.role?.toLowerCase();
  const status = user.status?.toLowerCase();
  const cfg    = ROLE_CONFIG[role];

  const [form, setForm] = useState({
    first_name:     user.first_name     ?? '',
    last_name:      user.last_name      ?? '',
    email:          user.email          ?? '',
    contact_number: user.contact_number ?? '',
    license_number: user.license_number ?? '',
    role:           role                ?? 'staff',
  });

  const set = (k, v) => {
    let next = v;
    if (k === 'first_name' || k === 'last_name') next = sanitizeName(v);
    if (k === 'contact_number') next = normalizeMobileInput(v);
    setForm(f => ({ ...f, [k]: next }));
    setErrors(e => ({ ...e, [k]: '' }));
  };

  const validateEdit = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name = 'First name is required';
    else if (!NAME_RE.test(form.first_name.trim())) e.first_name = 'First name must contain letters and spaces only';
    if (!form.last_name.trim())  e.last_name  = 'Last name is required';
    else if (!NAME_RE.test(form.last_name.trim())) e.last_name = 'Last name must contain letters and spaces only';
    if (!form.email.trim())      e.email      = 'Email is required';
    else if (!EMAIL_RE.test(form.email.trim())) e.email = 'Enter a valid email address';
    if (form.contact_number?.trim() && !MOBILE_RE.test(form.contact_number.trim())) {
      e.contact_number = 'Contact number must be +63 followed by 10 digits';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSaveEdit = async () => {
    if (!validateEdit()) return;
    setSaving(true);
    const rawId = getRawId(user);
    const payload = {
      first_name:     form.first_name.trim(),
      last_name:      form.last_name.trim(),
      email:          form.email.trim(),
      contact_number: form.contact_number?.trim() || null,
      license_number: form.license_number?.trim() || null,
      role:           form.role.charAt(0).toUpperCase() + form.role.slice(1),
      status:         user.status,
    };
    try {
      const { ok, data } = await apiFetch(`/users/${rawId}`, { method: 'PUT', body: JSON.stringify(payload) });
      if (ok) { onSaved(data); }
      else {
        const msg = data.errors ? Object.values(data.errors).flat().join(' | ') : data.message ?? 'An error occurred.';
        setErrors({ server: msg });
      }
    } catch {
      setErrors({ server: 'Network error. Could not reach server.' });
    } finally { setSaving(false); }
  };

  const [toggling,    setToggling]    = useState(false);
  const [localStatus, setLocalStatus] = useState(status);

  const handleToggle = async () => {
    setToggling(true);
    const rawId = getRawId(user);
    try {
      const { ok, data } = await apiFetch(`/users/${rawId}/toggle-status`, { method: 'PATCH' });
      if (ok) {
        setLocalStatus(data.status?.toLowerCase());
        onToggled(rawId, data.status);
      }
    } catch {}
    finally { setToggling(false); }
  };

  const [archiveConfirm, setArchiveConfirm] = useState('');
  const [archiving,      setArchiving]      = useState(false);
  const fullName     = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
  const archiveMatch = archiveConfirm.trim().toLowerCase() === fullName.toLowerCase();

  const handleArchive = async () => {
    if (!archiveMatch) return;
    setArchiving(true);
    const rawId = getRawId(user);
    try {
      const { ok } = await apiFetch(`/users/${rawId}`, { method: 'DELETE' });
      if (ok) onArchived(rawId);
    } catch {}
    finally { setArchiving(false); }
  };

  const tabs = [
    { key: 'edit',    label: 'Edit Information',      icon: Edit       },
    { key: 'status',  label: 'Activate / Deactivate', icon: ToggleLeft },
    { key: 'archive', label: 'Archive Account',       icon: Archive    },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${cfg?.bg ?? 'bg-gray-100'} ${cfg?.color ?? 'text-gray-600'}`}>
              {`${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Manage User</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-gray-400">{fullName}</p>
                <RoleBadge role={role} />
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex border-b border-gray-100 px-6">
          {tabs.map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.key;
            return (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap
                  ${isActive
                    ? t.key === 'archive' ? 'border-red-500 text-red-600' : 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ─── TAB: Edit Information ─── */}
        {activeTab === 'edit' && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FieldRow label="First Name" required>
                <input value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="Juan" className={inputCls} />
                {errors.first_name && <p className="text-xs text-red-500 mt-1">⚠ {errors.first_name}</p>}
              </FieldRow>
              <FieldRow label="Last Name" required>
                <input value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="dela Cruz" className={inputCls} />
                {errors.last_name && <p className="text-xs text-red-500 mt-1">⚠ {errors.last_name}</p>}
              </FieldRow>
            </div>
            <FieldRow label="Email" required>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inputCls} />
              {errors.email && <p className="text-xs text-red-500 mt-1">⚠ {errors.email}</p>}
            </FieldRow>
            <FieldRow label="Contact Number">
              <input type="tel" value={form.contact_number} onChange={e => set('contact_number', e.target.value)} placeholder="+63 912 345 6789" className={inputCls} />
              {errors.contact_number && <p className="text-xs text-red-500 mt-1">⚠ {errors.contact_number}</p>}
            </FieldRow>

            <FieldRow label="Role" required>
              <div className="grid grid-cols-4 gap-2">
                {ROLE_OPTIONS.map(r => {
                  const rc = ROLE_CONFIG[r]; const RIcon = rc.icon; const selected = form.role === r;
                  return (
                    <button key={r} type="button" onClick={() => set('role', r)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all
                        ${selected ? `${rc.bg} ${rc.border} ${rc.color}` : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}>
                      <RIcon className="w-5 h-5" /><span className="text-xs font-bold">{rc.label}</span>
                    </button>
                  );
                })}
              </div>
            </FieldRow>

            {form.role === 'doctor' && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wide flex items-center gap-1.5 mb-3">
                  <Stethoscope className="w-3.5 h-3.5" /> Doctor Details
                </p>
                <FieldRow label="License Number">
                  <input value={form.license_number} onChange={e => set('license_number', e.target.value)} placeholder="PRC-XXXXX" className={inputCls} />
                </FieldRow>
              </div>
            )}

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-gray-200 flex-shrink-0">
                <KeyRound className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Password Cannot Be Changed Here</p>
                <p className="text-xs text-gray-400 mt-0.5">Passwords can only be changed by the user through their own account settings.</p>
              </div>
            </div>

            {errors.server && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-xs text-red-600 font-semibold">⚠ {errors.server}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[130px]">
                {saving ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Saving…</> : <><Check className="w-4 h-4 mr-1.5" /> Save Changes</>}
              </Button>
            </div>
          </div>
        )}

        {/* ─── TAB: Activate / Deactivate ─── */}
        {activeTab === 'status' && (
          <div className="p-6 space-y-5">
            <div className={`rounded-xl border p-5 ${localStatus === 'active' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-bold text-gray-800">Current Status</p>
                  <p className="text-xs text-gray-400 mt-0.5">Toggle to change this user's account status</p>
                </div>
                <StatusBadge status={localStatus} />
              </div>
              <div className="flex items-center gap-4 mt-4">
                <Switch checked={localStatus === 'active'} onCheckedChange={handleToggle} disabled={toggling} />
                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    {localStatus === 'active' ? 'Account is Active' : 'Account is Inactive'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {localStatus === 'active'
                      ? 'This user can log in and access the system.'
                      : 'This user is blocked from logging in.'}
                  </p>
                </div>
                {toggling && <Loader2 className="w-4 h-4 animate-spin text-blue-500 ml-auto" />}
              </div>
            </div>

            <div className={`rounded-xl border p-4 ${localStatus === 'active' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
              <div className={`flex items-start gap-2 text-xs ${localStatus === 'active' ? 'text-amber-700' : 'text-blue-700'}`}>
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">
                    {localStatus === 'active' ? 'Deactivating this account will:' : 'Activating this account will:'}
                  </p>
                  <ul className="mt-1.5 space-y-1 list-disc list-inside">
                    {localStatus === 'active' ? (
                      <>
                        <li>Immediately log out the user from all sessions</li>
                        <li>Prevent the user from logging in</li>
                        <li>Preserve all existing data and records</li>
                      </>
                    ) : (
                      <>
                        <li>Allow the user to log in again</li>
                        <li>Restore full access based on their role</li>
                        <li>Send a notification email to the user</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={onClose}>Close</Button>
            </div>
          </div>
        )}

        {/* ─── TAB: Archive Account ─── */}
        {activeTab === 'archive' && (
          <div className="p-6 space-y-5">
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-red-100 flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-red-700">This action is irreversible</p>
                <p className="text-xs text-red-500 mt-1">
                  Archiving will permanently remove this user's access and mark the account as archived.
                  Data is preserved for audit purposes but the account cannot be recovered.
                </p>
              </div>
            </div>

            <div className={`flex items-center gap-3 p-4 rounded-xl border ${cfg?.border ?? 'border-gray-200'} ${cfg?.bg ?? 'bg-gray-50'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${cfg?.bg ?? 'bg-gray-100'} ${cfg?.color ?? 'text-gray-600'}`}>
                {`${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-800">{fullName}</p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
              <RoleBadge role={role} />
            </div>

            <div className="space-y-3">
              <p className="text-xs text-gray-500 font-medium">What will happen when you archive this account:</p>
              <ul className="space-y-2">
                {[
                  'User will be immediately logged out',
                  'Login access will be permanently revoked',
                  'All data and records are preserved',
                  'Account will be marked as archived',
                  'This action cannot be undone',
                ].map((item, i) => (
                  <li key={i} className={`flex items-center gap-2 text-xs ${i === 4 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                    {i === 4
                      ? <X className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                      : <Check className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <FieldRow label={`Type "${fullName}" to confirm`} required>
              <input
                value={archiveConfirm}
                onChange={e => setArchiveConfirm(e.target.value)}
                placeholder={fullName}
                className={`${inputCls} ${archiveConfirm && !archiveMatch ? 'border-red-300 focus:ring-red-400' : ''} ${archiveMatch ? 'border-green-400 focus:ring-green-400' : ''}`}
              />
              {archiveConfirm && !archiveMatch && <p className="text-xs text-red-500 mt-1">⚠ Name does not match</p>}
              {archiveMatch && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><Check className="w-3 h-3" /> Confirmed</p>}
            </FieldRow>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onClose} disabled={archiving}>Cancel</Button>
              <Button onClick={handleArchive} disabled={!archiveMatch || archiving}
                className="bg-red-600 hover:bg-red-700 text-white min-w-[150px] disabled:opacity-40">
                {archiving
                  ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Archiving…</>
                  : <><ArchiveX className="w-4 h-4 mr-1.5" /> Archive Account</>}
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

/* ══════════════ MAIN PAGE ══════════════ */
export default function UserManagementPage() {
  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [roleFilter,  setRoleFilter]  = useState('All Roles');
  const [statusFil,   setStatusFil]   = useState('All Status');
  const [modal,       setModal]       = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize,    setPageSize]    = useState(10);

  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)                      params.set('search', search);
      if (roleFilter !== 'All Roles')  params.set('role',   roleFilter);
      if (statusFil  !== 'All Status') params.set('status', statusFil);
      const { ok, data } = await apiFetch(`/users?${params}`);
      if (ok) setUsers(Array.isArray(data) ? data : data.data ?? []);
      else toast({ title: 'Error', description: 'Failed to load users.', variant: 'destructive' });
    } catch {
      toast({ title: 'Network error', description: 'Could not reach the server.', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  useEffect(() => { setCurrentPage(1); fetchUsers(); }, [search, roleFilter, statusFil]);

  const totalPages = Math.max(1, Math.ceil(users.length / pageSize));
  const safePage   = Math.min(currentPage, totalPages);
  const paginated  = users.slice((safePage - 1) * pageSize, safePage * pageSize);

  const total    = users.length;
  const active   = users.filter(u => u.status?.toLowerCase() === 'active').length;
  const inactive = users.filter(u => u.status?.toLowerCase() === 'inactive').length;
  const managers = users.filter(u => u.role?.toLowerCase() === 'manager').length;
  const admins   = users.filter(u => u.role?.toLowerCase() === 'admin').length;
  const doctors  = users.filter(u => u.role?.toLowerCase() === 'doctor').length;
  const staff    = users.filter(u => u.role?.toLowerCase() === 'staff').length;

  const handleManageSaved = async (data) => {
    await fetchUsers();
    toast({ title: 'User updated', description: `${data.first_name} ${data.last_name} saved.` });
    setModal(null);
  };

  const handleManageToggled = (rawId, newStatus) => {
    setUsers(u => u.map(x => getRawId(x) === rawId ? { ...x, status: newStatus } : x));
    toast({ title: 'Status updated', description: `Account is now ${newStatus}.` });
  };

  const handleManageArchived = (rawId) => {
    setUsers(u => u.filter(x => getRawId(x) !== rawId));
    toast({ title: 'Account archived', description: 'The user has been archived.' });
    setModal(null);
  };

  const fullName = (u) => `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim();
  const initials = (u) => `${u.first_name?.[0] ?? ''}${u.last_name?.[0] ?? ''}`.toUpperCase();

  return (
    <MainLayout title="User Management" subtitle="Manage system users, roles and access control">
      <div className="space-y-5">

        {/* KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KPICard label="Total"    value={total}    icon={Users}       iconBg="bg-blue-50"   iconColor="text-blue-600"   loading={loading} />
          <KPICard label="Active"   value={active}   icon={UserCheck}   iconBg="bg-green-50"  iconColor="text-green-600"  loading={loading} />
          <KPICard label="Inactive" value={inactive} icon={UserX}       iconBg="bg-gray-50"   iconColor="text-gray-500"   loading={loading} />
          <KPICard label="Managers" value={managers} icon={Briefcase}   iconBg="bg-orange-50" iconColor="text-orange-600" loading={loading} />
          <KPICard label="Doctors"  value={doctors}  icon={Stethoscope} iconBg="bg-blue-50"   iconColor="text-blue-600"   loading={loading} />
          <KPICard label="Staff"    value={staff}    icon={Users}       iconBg="bg-teal-50"   iconColor="text-teal-600"   loading={loading} />
        </div>

        {/* TABLE */}
        <Card data-testid="users-list-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" /> All Users
              </CardTitle>
              <span className="text-xs text-gray-400">{users.length} user{users.length !== 1 ? 's' : ''}</span>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <CardContent className="pb-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="relative flex-1 min-w-[220px]">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Search</label>
                  <Search className="absolute left-3 bottom-2.5 w-4 h-4 text-gray-400" />
                  <input placeholder="Name, email…" value={search}
                    onChange={e => setSearch(e.target.value)} className={`${inputCls} pl-9`} />
                </div>
                <div className="min-w-[140px]">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Role</label>
                  <SelectBox value={roleFilter} onChange={setRoleFilter} options={ROLES} />
                </div>
                <div className="min-w-[140px]">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Status</label>
                  <SelectBox value={statusFil} onChange={setStatusFil} options={STATUSES} />
                </div>
                <div className="flex-1" />
              </div>
            </CardContent>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-gray-100 bg-gray-50">
                    {['Name', 'Role', 'Contact', 'Status', 'Date Created', 'Actions'].map(h => (
                      <th key={h} className="text-left py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading && Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="py-3 px-4"><div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" /></td>
                    ))}</tr>
                  ))}
                  {!loading && paginated.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-14">
                        <Users className="w-10 h-10 mx-auto text-gray-200 mb-2" />
                        <p className="text-sm font-medium text-gray-400">No users found</p>
                        <p className="text-xs text-gray-300 mt-1">Try adjusting your search or filters</p>
                      </td>
                    </tr>
                  )}
                  {!loading && paginated.map(user => {
                    const role   = user.role?.toLowerCase();
                    const status = user.status?.toLowerCase();
                    return (
                      <tr key={getRawId(user)} className={`hover:bg-gray-50 transition-colors ${status === 'inactive' ? 'opacity-60' : ''}`}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm
                              ${ROLE_CONFIG[role]?.bg || 'bg-gray-100'} ${ROLE_CONFIG[role]?.color || 'text-gray-600'}`}>
                              {initials(user)}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 leading-tight">{fullName(user)}</p>
                              <p className="text-xs font-mono text-gray-400">{getPublicId(user)}</p>
                              <p className="text-xs text-gray-400">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <RoleBadge role={role} />
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-500">{user.contact_number || '—'}</td>
                        <td className="py-3 px-4"><StatusBadge status={status} /></td>
                        <td className="py-3 px-4 text-xs text-gray-500 whitespace-nowrap">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <button size="sm" variant="outline"
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
                            onClick={() => setModal({ type: 'password-gate', user })}>
                            <UserCog className="w-3.5 h-3.5" /> Manage
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={safePage} totalPages={totalPages} totalItems={users.length}
              pageSize={pageSize} onPageChange={setCurrentPage}
              onPageSizeChange={(n) => { setPageSize(n); setCurrentPage(1); }}
            />
          </CardContent>
        </Card>

      </div>

      {modal?.type === 'password-gate' && (
        <PasswordGateModal
          user={modal.user}
          onClose={() => setModal(null)}
          onSuccess={() => setModal({ type: 'manage', user: modal.user })}
        />
      )}
      {modal?.type === 'manage' && (
        <ManageModal
          user={modal.user}
          onClose={() => setModal(null)}
          onSaved={handleManageSaved}
          onToggled={handleManageToggled}
          onArchived={handleManageArchived}
        />
      )}
    </MainLayout>
  );
}
