import React, { useState, useMemo, useEffect, useCallback } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import {
  Plus, Search, X, Check, RefreshCw,
  Stethoscope,  Scissors, DollarSign,
  ChevronDown, Tag, Clock, LayoutGrid, List,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Loader2, AlertTriangle, Lock, Eye, EyeOff,
  Edit, ToggleLeft, ArchiveX, UserCog,
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

/* ══════════════ CONFIG ══════════════ */
const API_BASE = 'http://backend1.test/api';

/* ══════════════ CATEGORIES ══════════════ */
const CATEGORIES = [
  { key: 'consultation', label: 'Consultation',       icon: Stethoscope,  bg: 'bg-blue-50',   color: 'text-blue-600',   border: 'border-blue-200'   },
  { key: 'procedure',    label: 'Medical Procedures', icon: Scissors,     bg: 'bg-teal-50',   color: 'text-teal-600',   border: 'border-teal-200'   },
  { key: 'fee',          label: 'Fees & Others',      icon: DollarSign,   bg: 'bg-orange-50', color: 'text-orange-600', border: 'border-orange-200' },
];


const DURATION_PRESETS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hr',   value: 60 },
  { label: 'Custom', value: null },
];


/*______________________DURATION PICKER___________________________*/ 
const DurationPicker = ({ value, onChange }) => {
  const numVal = Number(value) || 0;
  const isPreset = DURATION_PRESETS.some(p => p.value === numVal && p.value !== null);
  const [showCustom, setShowCustom] = React.useState(!isPreset && numVal > 0);

  const handlePreset = (preset) => {
    if (preset.value === null) {
      setShowCustom(true);
      onChange('');
    } else {
      setShowCustom(false);
      onChange(String(preset.value));
    }
  };

  const activePreset = showCustom ? null : DURATION_PRESETS.find(p => p.value === numVal);

  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap">
        {DURATION_PRESETS.map(p => {
          const isActive = p.value === null ? showCustom : (!showCustom && activePreset?.value === p.value);
          return (
            <button key={p.label} type="button" onClick={() => handlePreset(p)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all
                ${isActive
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600'}`}>
              {p.label}
            </button>
          );
        })}
      </div>
      {showCustom && (
        <input
          type="number" min="0" value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Enter minutes"
          autoFocus
          className={inputCls}
        />
      )}
    </div>
  );
};
/* ══════════════ HELPERS ══════════════ */
const fmtPrice = (p) => `₱${Number(p).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

const apiFetch = async (path, options = {}) => {
  const token = localStorage.getItem('auth_token');
  const res = await fetch(`${API_BASE}${path}`, {
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

const normalizeService = (raw) => ({
  id:          String(raw.service_id),
  name:        raw.service_name             ?? '',
  category:    raw.category                 ?? 'consultation',
  price:       Number(raw.price)            || 0,
  duration:    Number(raw.duration_minutes) || 0,
  unit:        raw.unit                     ?? 'per visit',
  status:      raw.status                   ?? 'active',
  description: raw.description              ?? '',
  _raw_id:     raw.service_id,
});

const toPayload = (form) => ({
  service_name:     form.name,
  description:      form.description,
  price:            Number(form.price),
  duration_minutes: Number(form.duration) || 0,
  unit:             form.unit,
  category:         form.category,
  status:           form.status,
});

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

const SelectBox = ({ value, onChange, options }) => (
  <div className="relative">
    <select value={value} onChange={e => onChange(e.target.value)}
      className={`${inputCls} appearance-none pr-8`}>
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

const CatBadge = ({ category }) => {
  const cfg = CATEGORIES.find(c => c.key === category);
  if (!cfg) return null;
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
          <span className="font-semibold text-gray-600">{totalItems}</span> services
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
function PasswordGateModal({ service, onClose, onSuccess }) {
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
      if (ok) { onSuccess(); }
      else    { setError(data.message ?? 'Incorrect password. Please try again.'); }
    } catch {
      onSuccess(); // fallback for dev
    } finally {
      setChecking(false);
    }
  };

  const cat = CATEGORIES.find(c => c.key === service.category);

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
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Service preview */}
          <div className={`flex items-center gap-3 p-3 rounded-xl border ${cat?.bg ?? 'bg-gray-50'} ${cat?.border ?? 'border-gray-200'}`}>
            <CatBadge category={service.category} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold truncate ${cat?.color ?? 'text-gray-800'}`}>{service.name}</p>
              <p className="text-xs text-gray-400">{fmtPrice(service.price)}</p>
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
              <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
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
              : <><Lock className="w-4 h-4 mr-1.5" /> Verify & Continue</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════ MANAGE MODAL (3 TABS) ══════════════ */
const EMPTY_FORM = { name: '', category: 'consultation', price: '', duration: '', unit: 'per visit', status: 'active', description: '' };

function ManageModal({ service, onClose, onSaved, onToggled, onArchived }) {
  const [activeTab, setActiveTab] = useState('edit');
  const [saving,    setSaving]    = useState(false);
  const [errors,    setErrors]    = useState({});
  const { toast } = useToast();

  /* ── Edit tab ── */
  const [form, setForm] = useState({
    ...service,
    price:    String(service.price),
    duration: String(service.duration),
  });
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim())                e.name  = 'Required';
    if (!form.price || isNaN(form.price)) e.price = 'Valid price required';
    if (Number(form.price) < 0)           e.price = 'Must be ≥ 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSaveEdit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const { ok, data } = await apiFetch(`/servics/${service._raw_id}`, {
        method: 'PUT',
        body: JSON.stringify(toPayload({ ...form, price: Number(form.price), duration: Number(form.duration) || 0 })),
      });
      if (!ok) {
        const msg = data.errors ? Object.values(data.errors).flat().join(' ') : data.message ?? 'Error saving.';
        throw new Error(msg);
      }
      const saved = normalizeService(data);
      onSaved(saved);
      toast({ title: 'Service updated', description: `${saved.name} has been saved.` });
    } catch (err) {
      setErrors({ server: err.message });
    } finally { setSaving(false); }
  };

  /* ── Status tab ── */
  const [localStatus, setLocalStatus] = useState(service.status);
  const [toggling,    setToggling]    = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    const prev = localStatus;
    const next = localStatus === 'active' ? 'inactive' : 'active';
    setLocalStatus(next);
    try {
      const { ok, data } = await apiFetch(`/servics/${service._raw_id}/toggle-status`, { method: 'PATCH' });
      if (!ok) throw new Error();
      const updated = normalizeService(data);
      setLocalStatus(updated.status);
      onToggled(service.id, updated.status);
      toast({ title: 'Status updated', description: `Service is now ${updated.status}.` });
    } catch {
      setLocalStatus(prev);
      toast({ title: 'Error', description: 'Could not update status.', variant: 'destructive' });
    } finally { setToggling(false); }
  };

  /* ── Archive tab ── */
  const [archiveConfirm, setArchiveConfirm] = useState('');
  const [archiving,      setArchiving]      = useState(false);
  const archiveMatch = archiveConfirm.trim().toLowerCase() === service.name.toLowerCase();

  const handleArchive = async () => {
    if (!archiveMatch) return;
    setArchiving(true);
    try {
      const { ok } = await apiFetch(`/servics/${service._raw_id}`, { method: 'DELETE' });
      if (!ok) throw new Error();
      onArchived(service.id);
      toast({ title: 'Service deleted', description: `${service.name} has been removed.` });
    } catch {
      toast({ title: 'Error', description: 'Could not delete service.', variant: 'destructive' });
    } finally { setArchiving(false); }
  };

  const tabs = [
    { key: 'edit',    label: 'Edit Information',      icon: Edit       },
    { key: 'status',  label: 'Activate / Deactivate', icon: ToggleLeft },
    { key: 'archive', label: 'Archive Service',       icon: ArchiveX   },
  ];

  const cat = CATEGORIES.find(c => c.key === service.category);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${cat?.bg ?? 'bg-gray-100'}`}>
              {(() => { const Icon = cat?.icon ?? Tag; return <Icon className={`w-5 h-5 ${cat?.color ?? 'text-gray-500'}`} />; })()}
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Manage Service</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-gray-400 truncate max-w-[180px]">{service.name}</p>
                <StatusBadge status={localStatus} />
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6">
          {tabs.map(t => {
            const Icon     = t.icon;
            const isActive = activeTab === t.key;
            return (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap
                  ${isActive
                    ? t.key === 'archive' ? 'border-red-500 text-red-600' : 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                <Icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            );
          })}
        </div>

        {/* ── TAB: Edit Information ── */}
        {activeTab === 'edit' && (
          <div className="p-6 space-y-4">
            <FieldRow label="Category" required>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map(c => {
                  const Icon = c.icon; const sel = form.category === c.key;
                  return (
                    <button key={c.key} type="button" onClick={() => set('category', c.key)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all
                        ${sel ? `${c.bg} ${c.border} ${c.color}` : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}>
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs font-bold">{c.label}</span>
                    </button>
                  );
                })}
              </div>
            </FieldRow>

            <FieldRow label="Service Name" required>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="e.g. General Consultation" className={inputCls} />
              {errors.name && <p className="text-xs text-red-500">⚠ {errors.name}</p>}
            </FieldRow>

            <FieldRow label="Description">
              <textarea value={form.description} onChange={e => set('description', e.target.value)}
                rows={2} className={`${inputCls} resize-none`} />
            </FieldRow>

            <div className="grid grid-cols-2 gap-4">
              <FieldRow label="Price (₱)" required>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">₱</span>
                  <input type="number" min="0" step="0.01" value={form.price}
                    onChange={e => set('price', e.target.value)} placeholder="0.00"
                    className={`${inputCls} pl-7`} />
                </div>
                {errors.price && <p className="text-xs text-red-500">⚠ {errors.price}</p>}
              </FieldRow>
              <FieldRow label="Billing Unit">
                <SelectBox value={form.unit} onChange={v => set('unit', v)}
                  options={[
                    { value: 'per visit',     label: 'Per Visit'     },
                    { value: 'per session',   label: 'Per Session'   },
                    { value: 'per test',      label: 'Per Test'      },
                    { value: 'per procedure', label: 'Per Procedure' },
                    { value: 'per document',  label: 'Per Document'  },
                    { value: 'per claim',     label: 'Per Claim'     },
                  ]} />
              </FieldRow>
            </div>

            {form.category !== 'fee' && (
              <FieldRow label="Estimated Duration (minutes)" hint="Set to 0 if not applicable">
                <input type="number" min="0" value={form.duration}
                  onChange={e => set('duration', e.target.value)} placeholder="30" className={inputCls} />
              </FieldRow>
            )}

            {errors.server && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-xs text-red-600 font-semibold">⚠ {errors.server}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[130px]">
                {saving
                  ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Saving…</>
                  : <><Check className="w-4 h-4 mr-1.5" /> Save Changes</>}
              </Button>
            </div>
          </div>
        )}

        {/* ── TAB: Activate / Deactivate ── */}
        {activeTab === 'status' && (
          <div className="p-6 space-y-5">
            <div className={`rounded-xl border p-5 ${localStatus === 'active' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-bold text-gray-800">Current Status</p>
                  <p className="text-xs text-gray-400 mt-0.5">Toggle to change service availability</p>
                </div>
                <StatusBadge status={localStatus} />
              </div>
              <div className="flex items-center gap-4">
                <Switch checked={localStatus === 'active'} onCheckedChange={handleToggle} disabled={toggling} />
                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    {localStatus === 'active' ? 'Service is Active' : 'Service is Inactive'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {localStatus === 'active'
                      ? 'Visible and available for use by staff.'
                      : 'Hidden and unavailable for use.'}
                  </p>
                </div>
                {toggling && <Loader2 className="w-4 h-4 animate-spin text-blue-500 ml-auto" />}
              </div>
            </div>

            <div className={`rounded-xl border p-4 ${localStatus === 'active' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
              <div className={`flex items-start gap-2 text-xs ${localStatus === 'active' ? 'text-amber-700' : 'text-blue-700'}`}>
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <ul className="space-y-1 list-disc list-inside">
                  {localStatus === 'active' ? (
                    <>
                      <li>Service will be hidden from staff</li>
                      <li>Cannot be selected for new appointments</li>
                      <li>Existing records are preserved</li>
                    </>
                  ) : (
                    <>
                      <li>Service will be visible to staff again</li>
                      <li>Can be selected for new appointments</li>
                    </>
                  )}
                </ul>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={onClose}>Close</Button>
            </div>
          </div>
        )}

        {/* ── TAB: Archive Service ── */}
        {activeTab === 'archive' && (
          <div className="p-6 space-y-5">
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-red-100 flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-red-700">This action is irreversible</p>
                <p className="text-xs text-red-500 mt-1">This service will be permanently deleted from the system.</p>
              </div>
            </div>

            <div className={`flex items-center gap-3 p-4 rounded-xl border ${cat?.border ?? 'border-gray-200'} ${cat?.bg ?? 'bg-gray-50'}`}>
              <CatBadge category={service.category} />
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-800">{service.name}</p>
                <p className="text-xs text-gray-400">{fmtPrice(service.price)} · {service.unit}</p>
              </div>
            </div>

            <ul className="space-y-2">
              {[
                { text: 'Service will be permanently removed',    icon: <Check className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />,   cls: 'text-gray-500' },
                { text: 'Cannot be used in new appointments',     icon: <Check className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />,   cls: 'text-gray-500' },
                { text: 'This action cannot be undone',           icon: <X     className="w-3.5 h-3.5 text-red-500  flex-shrink-0" />,   cls: 'text-red-600 font-semibold' },
              ].map((item, i) => (
                <li key={i} className={`flex items-center gap-2 text-xs ${item.cls}`}>
                  {item.icon} {item.text}
                </li>
              ))}
            </ul>

            <FieldRow label={`Type "${service.name}" to confirm`} required>
              <input value={archiveConfirm} onChange={e => setArchiveConfirm(e.target.value)}
                placeholder={service.name}
                className={`${inputCls}
                  ${archiveConfirm && !archiveMatch ? 'border-red-300 focus:ring-red-400' : ''}
                  ${archiveMatch ? 'border-green-400 focus:ring-green-400' : ''}`} />
              {archiveConfirm && !archiveMatch && <p className="text-xs text-red-500 mt-1">⚠ Name does not match</p>}
              {archiveMatch && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><Check className="w-3 h-3" /> Confirmed</p>}
            </FieldRow>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onClose} disabled={archiving}>Cancel</Button>
              <Button onClick={handleArchive} disabled={!archiveMatch || archiving}
                className="bg-red-600 hover:bg-red-700 text-white min-w-[150px] disabled:opacity-40">
                {archiving
                  ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Deleting…</>
                  : <><ArchiveX className="w-4 h-4 mr-1.5" /> Archive Service</>}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════ ADD SERVICE MODAL ══════════════ */
function AddServiceModal({ onClose, onSave, saving }) {
  const [form,   setForm]   = useState({ ...EMPTY_FORM });
  const [errors, setErrors] = useState({});
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim())                e.name  = 'Required';
    if (!form.price || isNaN(form.price)) e.price = 'Valid price required';
    if (Number(form.price) < 0)           e.price = 'Must be ≥ 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Add New Service</h2>
            <p className="text-xs text-gray-400 mt-0.5">Fill in the service details</p>
          </div>
          <button onClick={onClose} disabled={saving} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <FieldRow label="Category" required>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(c => {
                const Icon = c.icon; const sel = form.category === c.key;
                return (
                  <button key={c.key} type="button" onClick={() => set('category', c.key)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all
                      ${sel ? `${c.bg} ${c.border} ${c.color}` : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}>
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs font-bold">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </FieldRow>

          <FieldRow label="Service Name" required>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="e.g. General Consultation" className={inputCls} />
            {errors.name && <p className="text-xs text-red-500">⚠ {errors.name}</p>}
          </FieldRow>

          <FieldRow label="Description">
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              rows={2} className={`${inputCls} resize-none`} />
          </FieldRow>

          <div className="grid grid-cols-2 gap-4">
            <FieldRow label="Price (₱)" required>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">₱</span>
                <input type="number" min="0" step="0.01" value={form.price}
                  onChange={e => set('price', e.target.value)} placeholder="0.00"
                  className={`${inputCls} pl-7`} />
              </div>
              {errors.price && <p className="text-xs text-red-500">⚠ {errors.price}</p>}
            </FieldRow>
            <FieldRow label="Billing Unit">
              <SelectBox value={form.unit} onChange={v => set('unit', v)}
                options={[
                  { value: 'per visit',     label: 'Per Visit'     },
                  { value: 'per session',   label: 'Per Session'   },
                  { value: 'per test',      label: 'Per Test'      },
                  { value: 'per procedure', label: 'Per Procedure' },
                  { value: 'per document',  label: 'Per Document'  },
                  { value: 'per claim',     label: 'Per Claim'     },
                ]} />
            </FieldRow>
          </div>

          {form.category !== 'fee' && (
            <FieldRow label="Estimated Duration" hint="Set to 0 / leave blank if not applicable">
  <DurationPicker value={form.duration} onChange={v => set('duration', v)} />
</FieldRow>
          )}

          <FieldRow label="Status">
            <div className="flex items-center gap-3">
              <Switch checked={form.status === 'active'} onCheckedChange={v => set('status', v ? 'active' : 'inactive')} />
              <span className={`text-sm font-semibold ${form.status === 'active' ? 'text-green-600' : 'text-gray-400'}`}>
                {form.status === 'active' ? 'Active — visible to staff' : 'Inactive — hidden from use'}
              </span>
            </div>
          </FieldRow>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button onClick={() => { setForm({ ...EMPTY_FORM }); setErrors({}); }} disabled={saving}
            className="text-sm text-gray-400 hover:text-gray-600 font-medium flex items-center gap-1.5 disabled:opacity-40">
            <RefreshCw className="w-3.5 h-3.5" /> Reset
          </button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button onClick={() => { if (validate()) onSave({ ...form, price: Number(form.price), duration: Number(form.duration) || 0 }); }}
              disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
              {saving
                ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Saving…</>
                : <><Check className="w-4 h-4 mr-1.5" /> Add Service</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════ MAIN PAGE ══════════════ */
export default function ServiceManagementPage() {
  const [services,    setServices]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [apiError,    setApiError]    = useState(null);
  const [search,      setSearch]      = useState('');
  const [catFilter,   setCatFilter]   = useState('all');
  const [statFil,     setStatFil]     = useState('all');
  const [modal,       setModal]       = useState(null);
  // modal: null | {type:'add'} | {type:'password-gate', service} | {type:'manage', service}
  const [saving,      setSaving]      = useState(false);
  const [viewMode,    setViewMode]    = useState('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize,    setPageSize]    = useState(10);

  const { toast } = useToast();

const fetchServices = useCallback(async () => {
  setLoading(true);
  setApiError(null);
  try {
    const { ok, status, data } = await apiFetch('/servics'); // ← dito ang pagbabago
    if (!ok) throw new Error(`Server error: ${status}`);
    setServices(data.map(normalizeService));
  } catch (err) {
    setApiError(err.message);
  } finally { setLoading(false); }
}, []);
  useEffect(() => { fetchServices(); }, [fetchServices]);

  /* ── KPIs ── */
  const total    = services.length;
  const active   = services.filter(s => s.status === 'active').length;
  const inactive = services.filter(s => s.status === 'inactive').length;
  const avgPrice = total > 0 ? Math.round(services.reduce((a, s) => a + s.price, 0) / total) : 0;

  /* ── Filtered ── */
  const filtered = useMemo(() => {
    setCurrentPage(1);
    return services.filter(s => {
      if (catFilter !== 'all' && s.category !== catFilter) return false;
      if (statFil   !== 'all' && s.status   !== statFil)   return false;
      if (search) {
        const q = search.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [services, catFilter, statFil, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(currentPage, totalPages);
  const paginated  = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  /* ── Grid pagination ── */
  const [gridPages,     setGridPages]     = useState({});
  const [gridPageSizes, setGridPageSizes] = useState({});
  const getGridPage     = (key) => gridPages[key]     ?? 1;
  const getGridPageSize = (key) => gridPageSizes[key] ?? 6;
  const setGridPage     = (key, p) => setGridPages(prev => ({ ...prev, [key]: p }));
  const setGridPageSize = (key, n) => { setGridPageSizes(prev => ({ ...prev, [key]: n })); setGridPage(key, 1); };

  /* ── Add ── */
  const handleAddSave = async (form) => {
  setSaving(true);
  try {
    const { ok, data } = await apiFetch('/servics', {  // ← dito
      method: 'POST',
      body: JSON.stringify(toPayload(form)),
    });
    if (!ok) {
      const msg = data.errors ? Object.values(data.errors).flat().join(' ') : data.message ?? 'Error saving.';
      throw new Error(msg);
    }
    const saved = normalizeService(data);
    setServices(prev => [...prev, saved]);
    toast({ title: 'Service added', description: `${saved.name} has been created.` });
    setModal(null);
  } catch (err) {
    toast({ title: 'Save failed', description: err.message, variant: 'destructive' });
  } finally { setSaving(false); }
};

  /* ── Manage callbacks ── */
  const handleManageSaved    = (saved)         => { setServices(prev => prev.map(x => x.id === saved.id ? saved : x)); setModal(null); };
  const handleManageToggled  = (id, newStatus) => { setServices(prev => prev.map(x => x.id === id ? { ...x, status: newStatus } : x)); };
  const handleManageArchived = (id)            => { setServices(prev => prev.filter(x => x.id !== id)); setModal(null); };

  const handleReset = () => { setSearch(''); setCatFilter('all'); setStatFil('all'); setCurrentPage(1); };

  return (
    <MainLayout title="Service Management" subtitle="Manage clinic services, procedures and pricing">
      <div className="space-y-5">

        {/* KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Services', value: loading ? '—' : total,                           icon: Tag,        bg: 'bg-blue-50',   color: 'text-blue-600'   },
            { label: 'Active',         value: loading ? '—' : active,                          icon: Check,      bg: 'bg-green-50',  color: 'text-green-600'  },
            { label: 'Inactive',       value: loading ? '—' : inactive,                        icon: X,          bg: 'bg-gray-50',   color: 'text-gray-500'   },
            { label: 'Avg. Price',     value: loading ? '—' : `₱${avgPrice.toLocaleString()}`, icon: DollarSign, bg: 'bg-orange-50', color: 'text-orange-600' },
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

        {/* CATEGORY QUICK FILTERS */}
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => { setCatFilter('all'); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all
              ${catFilter === 'all' ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
            All ({total})
          </button>
          {CATEGORIES.map(c => {
            const Icon = c.icon; const count = services.filter(s => s.category === c.key).length; const sel = catFilter === c.key;
            return (
              <button key={c.key} onClick={() => { setCatFilter(c.key); setCurrentPage(1); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all
                  ${sel ? `${c.bg} ${c.color} ${c.border} shadow-sm` : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                <Icon className="w-3.5 h-3.5" /> {c.label} ({count})
              </button>
            );
          })}
        </div>

        {/* FILTER BAR */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Search</label>
                <Search className="absolute left-3 bottom-2.5 w-4 h-4 text-gray-400" />
                <input value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                  placeholder="Service name or description…" className={`${inputCls} pl-9`} />
              </div>
              <div className="min-w-[130px]">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Status</label>
                <SelectBox value={statFil} onChange={v => { setStatFil(v); setCurrentPage(1); }}
                  options={[{ value: 'all', label: 'All Status' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
              </div>
              
              <Button variant="outline" size="sm" onClick={fetchServices} disabled={loading}>
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Reset
              </Button>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button onClick={() => setViewMode('table')} className={`p-2 transition-colors ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-50'}`}><List className="w-4 h-4" /></button>
                <button onClick={() => setViewMode('grid')}  className={`p-2 transition-colors ${viewMode === 'grid'  ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-50'}`}><LayoutGrid className="w-4 h-4" /></button>
              </div>
              <div className="flex-1" />
              <Button onClick={() => setModal({ type: 'add' })} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" /> Add Service
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* API ERROR */}
        {apiError && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>Could not connect to the API: <strong>{apiError}</strong></span>
            <button onClick={fetchServices} className="ml-auto text-xs underline font-semibold">Retry</button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <span className="ml-3 text-sm text-gray-400 font-medium">Loading services…</span>
          </div>
        )}

        {/* TABLE VIEW */}
        {!loading && viewMode === 'table' && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Tag className="w-5 h-5 text-blue-600" /> Services</CardTitle>
                <span className="text-xs text-gray-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-y border-gray-100 bg-gray-50">
                      {['Service Name', 'Category', 'Price', 'Duration', 'Status', 'Actions'].map(h => (
                        <th key={h} className="text-left py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginated.length === 0 && (
                      <tr><td colSpan={6} className="text-center py-14">
                        <Tag className="w-10 h-10 mx-auto text-gray-200 mb-2" />
                        <p className="text-sm text-gray-400 font-medium">No services found</p>
                      </td></tr>
                    )}
                    {paginated.map(svc => (
                      <tr key={svc.id} className={`hover:bg-gray-50 transition-colors ${svc.status === 'inactive' ? 'opacity-60' : ''}`}>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-gray-900">{svc.name}</p>
                          {svc.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{svc.description}</p>}
                        </td>
                        <td className="py-3 px-4"><CatBadge category={svc.category} /></td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-gray-900">{fmtPrice(svc.price)}</p>
                          <p className="text-xs text-gray-400">{svc.unit}</p>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {svc.duration > 0
                            ? <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-gray-400" />{svc.duration} min</span>
                            : <span className="text-gray-300">—</span>}
                        </td>
                        {/* Status — badge only, no toggle */}
                        <td className="py-3 px-4"><StatusBadge status={svc.status} /></td>
                        {/* Single Manage button */}
                        <td className="py-3 px-4">
                          <button size="sm" variant="outline"
                             className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
                            onClick={() => setModal({ type: 'password-gate', service: svc })}>
                            <UserCog className="w-3.5 h-3.5" /> Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination currentPage={safePage} totalPages={totalPages} totalItems={filtered.length}
                pageSize={pageSize} onPageChange={setCurrentPage}
                onPageSizeChange={(n) => { setPageSize(n); setCurrentPage(1); }} />
            </CardContent>
          </Card>
        )}

        {/* GRID VIEW */}
        {!loading && viewMode === 'grid' && (
          <div>
            {filtered.length === 0 && (
              <div className="text-center py-16">
                <Tag className="w-10 h-10 mx-auto text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">No services found</p>
              </div>
            )}
            {CATEGORIES.filter(c => catFilter === 'all' || c.key === catFilter).map(cat => {
              const catServices = filtered.filter(s => s.category === cat.key);
              if (catServices.length === 0) return null;
              const gPage  = getGridPage(cat.key);
              const gSize  = getGridPageSize(cat.key);
              const gTotal = Math.max(1, Math.ceil(catServices.length / gSize));
              const gSafe  = Math.min(gPage, gTotal);
              const gSlice = catServices.slice((gSafe - 1) * gSize, gSafe * gSize);
              const Icon   = cat.icon;
              return (
                <div key={cat.key} className="mb-6">
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className={`p-1.5 rounded-lg ${cat.bg}`}><Icon className={`w-4 h-4 ${cat.color}`} /></div>
                    <h3 className="text-sm font-black text-gray-700">{cat.label}</h3>
                    <span className="text-xs text-gray-400">({catServices.length})</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {gSlice.map(svc => (
                      <div key={svc.id}
                        className={`bg-white border rounded-2xl p-4 hover:shadow-md transition-all
                          ${svc.status === 'inactive' ? 'opacity-60 border-dashed' : 'border-gray-200'}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 pr-2">
                            <p className="font-bold text-gray-900 text-sm leading-tight">{svc.name}</p>
                            {svc.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{svc.description}</p>}
                          </div>
                          <StatusBadge status={svc.status} />
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                          <div>
                            <p className="text-lg font-black text-gray-900">{fmtPrice(svc.price)}</p>
                            <p className="text-xs text-gray-400">{svc.unit}{svc.duration > 0 ? ` · ${svc.duration} min` : ''}</p>
                          </div>
                          <Button size="sm" variant="outline"
                            className="h-7 px-2.5 text-xs gap-1.5 border-blue-200 text-blue-600 hover:bg-blue-50"
                            onClick={() => setModal({ type: 'password-gate', service: svc })}>
                            <UserCog className="w-3 h-3" /> Manage
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {catServices.length > gSize && (
                    <div className="mt-3 bg-white border border-gray-100 rounded-xl">
                      <Pagination currentPage={gSafe} totalPages={gTotal} totalItems={catServices.length}
                        pageSize={gSize} onPageChange={(p) => setGridPage(cat.key, p)}
                        onPageSizeChange={(n) => setGridPageSize(cat.key, n)} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* MODALS */}
      {modal?.type === 'add' && (
        <AddServiceModal onClose={() => !saving && setModal(null)} onSave={handleAddSave} saving={saving} />
      )}
      {modal?.type === 'password-gate' && (
        <PasswordGateModal
          service={modal.service}
          onClose={() => setModal(null)}
          onSuccess={() => setModal({ type: 'manage', service: modal.service })}
        />
      )}
      {modal?.type === 'manage' && (
        <ManageModal
          service={modal.service}
          onClose={() => setModal(null)}
          onSaved={handleManageSaved}
          onToggled={handleManageToggled}
          onArchived={handleManageArchived}
        />
      )}
    </MainLayout>
  );
}