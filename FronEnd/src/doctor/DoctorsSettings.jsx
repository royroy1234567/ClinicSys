import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import LogoutConfirmModal from '../components/common/LogoutConfirmModal';
import { useNotifications } from '../context/NotificationContext';
import {
  User, Lock, Bell, Shield, LogOut, Info,
  Check, X, Eye, EyeOff, Phone, Mail,
  Hash, Pencil, Save, AlertCircle, CheckCircle2,
  ChevronRight, Heart, AlertTriangle, MapPin,
  Calendar, Clock, Stethoscope, Building2,
  FileText, Globe, Monitor, Sun, Moon, Loader2,
} from 'lucide-react';

/* ══════════════════════════════════════════════════
   API LAYER
══════════════════════════════════════════════════ */
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://backend1.test/api';

const apiFetch = async (url, options = {}) => {
  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
};

// GET /api/auth/me — returns { success, user: { user_id, first_name, last_name, ... } }
const fetchMe = () =>
  fetch(`${API_BASE}/auth/me`, {
    headers: {
      'Accept': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
    },
  }).then(r => r.json());

// PATCH /api/users/{id} — update profile fields
const updateProfile = (userId, data) =>
  apiFetch(`/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

// POST /api/auth/verify-password — verify current password before change
const verifyPassword = (password) =>
  apiFetch('/auth/verify-password', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });

// PATCH /api/users/{id} with new password
const updatePassword = (userId, data) =>
  apiFetch(`/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

// POST /api/auth/logout
const logoutApi = () =>
  apiFetch('/auth/logout', { method: 'POST' });

const normalizeMobileInput = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  let core = digits;
  if (core.startsWith('63')) core = core.slice(2);
  if (core.startsWith('0')) core = core.slice(1);
  core = core.slice(0, 10);
  return core ? `+63${core}` : '';
};

/* ══════════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════════ */
function Toast({ message, type = 'success', onDismiss }) {
  useEffect(() => { const t = setTimeout(onDismiss, 3200); return () => clearTimeout(t); }, []);
  return (
    <div className={`fixed bottom-6 right-6 z-[60] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold pointer-events-none
      ${type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-600 text-white'}`}>
      {type === 'success'
        ? <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
        : <AlertCircle  className="w-4 h-4 text-red-200  flex-shrink-0" />}
      {message}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MODAL SHELL
══════════════════════════════════════════════════ */
function Modal({ onClose, icon: Icon, iconBg, title, subtitle, children, width = 'max-w-md' }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}>
      <div className={`bg-white rounded-3xl shadow-2xl w-full ${width} overflow-hidden`}
        onClick={e => e.stopPropagation()}>
        <div className={`${iconBg} p-6 relative overflow-hidden`}>
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute bottom-0 right-20 w-16 h-16 rounded-full bg-white/5 pointer-events-none" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">{title}</h3>
                {subtitle && <p className="text-xs text-white/70 mt-0.5">{subtitle}</p>}
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
        <div className="p-6 max-h-[68vh] overflow-y-auto space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   TOGGLE
══════════════════════════════════════════════════ */
function Toggle({ checked, onChange }) {
  return (
    <button onClick={() => onChange(!checked)}
      className={`relative flex-shrink-0 rounded-full transition-colors duration-200 ${checked ? 'bg-blue-600' : 'bg-gray-200'}`}
      style={{ width: 40, height: 22 }}>
      <span className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${checked ? 'left-[20px]' : 'left-[3px]'}`} />
    </button>
  );
}

/* ══════════════════════════════════════════════════
   FIELD
══════════════════════════════════════════════════ */
function Field({ icon: Icon, label, value, editable, onChange, type = 'text', note, as, rows }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
        {Icon && <Icon className="w-3 h-3" />} {label}
        {note && <span className="ml-1 px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded-full text-[9px] font-bold normal-case tracking-normal">{note}</span>}
      </label>
      {editable ? (
        as === 'textarea' ? (
          <textarea value={value || ''} onChange={e => onChange(e.target.value)} rows={rows || 3}
            className="w-full px-3.5 py-2.5 text-sm border border-blue-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-800 transition-all resize-none" />
        ) : (
          <input type={type} value={value || ''} onChange={e => onChange(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm border border-blue-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-800 transition-all" />
        )
      ) : (
        <div className={`px-3.5 py-2.5 text-sm font-semibold text-gray-800 bg-gray-50 rounded-xl border border-gray-100 ${as === 'textarea' ? 'leading-relaxed' : ''}`}>
          {value || '—'}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MODALS
══════════════════════════════════════════════════ */

/* — Profile — */
function ProfileModal({ user, onSave, onClose }) {
  const [edit,    setEdit]    = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  // Draft maps from API field names
  const [draft, setDraft] = useState({
    first_name:      user?.first_name      || '',
    last_name:       user?.last_name       || '',
    specialization:  user?.specialization  || '',
    contact_number:  user?.contact_number  || '',
    email:           user?.email           || '',
    license_number:  user?.license_number  || '',
  });

  const f = k => v => setDraft((p) => {
    if (k === 'contact_number') return { ...p, [k]: normalizeMobileInput(v) };
    return { ...p, [k]: v };
  });

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      await onSave(draft);
      setEdit(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} icon={User} iconBg="bg-gradient-to-r from-blue-600 to-indigo-700"
      title="Profile Information" subtitle="View and update your professional details." width="max-w-lg">

      <div className="grid grid-cols-2 gap-3">
        <Field icon={User}      label="First Name"      value={draft.first_name}     editable={edit} onChange={f('first_name')} />
        <Field icon={User}      label="Last Name"       value={draft.last_name}      editable={edit} onChange={f('last_name')} />
        <div className="col-span-2">
          <Field icon={Stethoscope} label="Specialization" value={draft.specialization} editable={edit} onChange={f('specialization')} />
        </div>
        <Field icon={Hash}      label="License No."     value={draft.license_number} editable={false} note="view only" />
        <Field icon={Phone}     label="Contact Number"  value={draft.contact_number} editable={edit} onChange={f('contact_number')} />
        <div className="col-span-2">
          <Field icon={Mail}    label="Email Address"   value={draft.email}          editable={edit} onChange={f('email')} type="email" />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold">
          <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <p>License number and role can only be changed by an administrator.</p>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
        {edit ? (
          <>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-60">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Save className="w-3.5 h-3.5" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button onClick={() => { setDraft({ first_name: user?.first_name||'', last_name: user?.last_name||'', specialization: user?.specialization||'', contact_number: user?.contact_number||'', email: user?.email||'', license_number: user?.license_number||'' }); setEdit(false); setError(''); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-gray-200 text-gray-500 text-xs font-bold hover:bg-gray-50 transition-all">
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </>
        ) : (
          <button onClick={() => setEdit(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border-2 border-gray-200 text-gray-600 text-xs font-bold hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all">
            <Pencil className="w-3.5 h-3.5" /> Edit Profile
          </button>
        )}
      </div>
    </Modal>
  );
}

/* — Password — */
function PasswordModal({ userId, onClose, onSuccess }) {
  const [pwd,     setPwd]     = useState({ current: '', newPwd: '', confirm: '' });
  const [show,    setShow]    = useState({ current: false, newPwd: false, confirm: false });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const f = k => v => setPwd(p => ({ ...p, [k]: v }));

  const submit = async () => {
    setError('');
    if (!pwd.current)              return setError('Enter your current password.');
    if (pwd.newPwd.length < 8)     return setError('New password must be at least 8 characters.');
    if (pwd.newPwd !== pwd.confirm) return setError('Passwords do not match.');

    setLoading(true);
    try {
      // Step 1: verify current password
      await verifyPassword(pwd.current);
      // Step 2: update to new password
      await updatePassword(userId, { password: pwd.newPwd, password_confirmation: pwd.confirm });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose} icon={Lock} iconBg="bg-gradient-to-r from-slate-700 to-slate-900"
      title="Change Password" subtitle="Keep your account secure with a strong password.">
      {[
        { key: 'current', label: 'Current Password'     },
        { key: 'newPwd',  label: 'New Password'         },
        { key: 'confirm', label: 'Confirm New Password' },
      ].map(({ key, label }) => (
        <div key={key}>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
            <Lock className="w-3 h-3" /> {label}
          </label>
          <div className="relative">
            <input type={show[key] ? 'text' : 'password'} value={pwd[key]}
              onChange={e => f(key)(e.target.value)} placeholder="••••••••"
              className="w-full px-3.5 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 placeholder:text-gray-300 font-semibold text-gray-800 transition-all" />
            <button onClick={() => setShow(p => ({ ...p, [key]: !p[key] }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              {show[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      ))}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold">
          <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
        <Shield className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
        <p>Use at least 8 characters with a mix of letters, numbers, and symbols.</p>
      </div>

      <div className="pt-1 border-t border-gray-100">
        <button onClick={submit} disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-60">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Lock className="w-3.5 h-3.5" />}
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </div>
    </Modal>
  );
}

/* — Notifications (local state only — no backend endpoint) — */
function NotifModal({ notif, onChange, onClose }) {
  return (
    <Modal onClose={onClose} icon={Bell} iconBg="bg-gradient-to-r from-amber-500 to-orange-500"
      title="Notification Preferences" subtitle="Control appointment and schedule alerts.">
      {[
        { key: 'newAppointment', label: 'New Appointment Booked',   desc: 'Get notified when a patient books an appointment with you.'   },
        { key: 'cancellation',   label: 'Appointment Cancellation', desc: 'Alerts when a patient cancels their appointment.'             },
        { key: 'reminder',       label: 'Daily Schedule Reminder',  desc: 'Receive a daily summary of your upcoming consultations.'      },
        { key: 'patientArrival', label: 'Patient Arrival Alert',    desc: 'Notified when your next patient has checked in at the queue.' },
        { key: 'systemAnnounce', label: 'System Announcements',     desc: 'Clinic-wide announcements and system updates.'                },
      ].map(({ key, label, desc }) => (
        <div key={key}
          className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-white hover:border-gray-200 transition-all">
          <div className="flex items-start gap-3">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${notif[key] ? 'bg-amber-100' : 'bg-gray-200'}`}>
              <Bell className={`w-3.5 h-3.5 ${notif[key] ? 'text-amber-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </div>
          </div>
          <Toggle checked={notif[key]} onChange={v => onChange(key, v)} />
        </div>
      ))}
    </Modal>
  );
}




/* — Logout — */
function AccountActionsModal({ onClose, onLogout }) {
  return <LogoutConfirmModal open onConfirm={onLogout} onCancel={onClose} />;
}

/* ══════════════════════════════════════════════════
   SETTINGS MENU ITEM
══════════════════════════════════════════════════ */
function SettingItem({ icon: Icon, iconBg, label, desc, badge, onClick, danger }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all group text-left
        ${danger
          ? 'border-red-100 bg-red-50 hover:bg-red-100 hover:border-red-200'
          : 'border-gray-100 bg-white hover:bg-gray-50 hover:border-gray-200 hover:shadow-sm'}`}>
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon className={`w-5 h-5 ${danger ? 'text-red-500' : 'text-white'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm font-black ${danger ? 'text-red-700' : 'text-gray-900'}`}>{label}</p>
          {badge && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{badge}</span>}
        </div>
        <p className={`text-xs mt-0.5 truncate ${danger ? 'text-red-400' : 'text-gray-400'}`}>{desc}</p>
      </div>
      <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:translate-x-0.5 ${danger ? 'text-red-400' : 'text-gray-300'}`} />
    </button>
  );
}

/* ══════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════ */
export default function DoctorSettingsPage() {
  const {
    preferences,
    setNotificationPreference,
    validateNotificationPreference,
  } = useNotifications();
  const [user,     setUser]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [theme,    setTheme]    = useState('light');
  const [language, setLanguage] = useState('English');
  const [modal,    setModal]    = useState(null);
  const [toast,    setToast]    = useState(null);

  const notif = {
    newAppointment: true,
    cancellation: true,
    reminder: true,
    patientArrival: true,
    systemAnnounce: false,
    ...(preferences || {}),
  };

  const showToast = (msg, type = 'success') => setToast({ message: msg, type });
  const close     = () => setModal(null);

  // ── Fetch logged-in user on mount ─────────────────
  useEffect(() => {
    setLoading(true);
    fetchMe()
      .then(data => { if (data?.user) setUser(data.user); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Profile update ────────────────────────────────
  const handleProfileSave = async (draft) => {
    if (!user?.user_id) throw new Error('User not loaded.');
    if (draft.contact_number && !/^\+63\d{10}$/.test(draft.contact_number)) {
      throw new Error('Contact number must be +63 followed by 10 digits.');
    }
    const updated = await updateProfile(user.user_id, {
      first_name:     draft.first_name,
      last_name:      draft.last_name,
      specialization: draft.specialization,
      contact_number: draft.contact_number,
      email:          draft.email,
      // license_number and role are admin-only — not sent
    });
    // Merge updated fields back — API returns the updated user object
    setUser(prev => ({ ...prev, ...draft }));
    showToast('Profile updated successfully.');
  };

  // ── Logout handler ────────────────────────────────
  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch {
      // Continue with local sign-out even if API logout fails.
    }

    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    setModal(null);
    window.location.href = '/login';
  };

  const fullName = user ? `Dr. ${user.first_name} ${user.last_name}` : '—';
  const initials = user
    ? `${(user.first_name||'')[0]}${(user.last_name||'')[0]}`.toUpperCase()
    : '??';

  const activeNotif = Object.values(notif).filter(Boolean).length;

  // ── Loading skeleton ──────────────────────────────
  if (loading) {
    return (
      <MainLayout title="Settings" subtitle="Manage your professional profile and preferences.">
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin"/>
            <p className="text-sm text-gray-400 font-medium">Loading your profile...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Settings" subtitle="Manage your professional profile and preferences.">
      <div className="space-y-5 max-w-2xl mx-auto">

        {/* ══ HEADER ══ */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-44 h-44 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute bottom-0 right-24 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center text-lg font-black flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black">{fullName}</h2>
              <p className="text-blue-200 text-sm">
                {user?.specialization || user?.role || '—'}
                {user?.contact_number ? ` · ${user.contact_number}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 border border-white/20 rounded-xl text-xs font-bold text-blue-100 flex-shrink-0 capitalize">
              <Stethoscope className="w-3.5 h-3.5" /> {user?.role || 'Doctor'}
            </div>
          </div>

          {/* Quick stats */}
          <div className="relative flex items-center gap-5 mt-4 pt-4 border-t border-white/10">
            {[
              { label: 'User ID',     value: user?.public_id      || user?.user_id || '—' },
              { label: 'License No.', value: user?.license_number || '—' },
              { label: 'Email',       value: user?.email          || '—' },
            ].map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <div className="w-px h-6 bg-white/20" />}
                <div className="min-w-0">
                  <p className="text-blue-300 text-[10px] font-bold uppercase tracking-wide">{s.label}</p>
                  <p className="text-white text-sm font-black truncate">{s.value}</p>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ══ SETTINGS MENU ══ */}
        <div className="space-y-2">

          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 pb-1">Professional</p>
          <SettingItem
            icon={User} iconBg="bg-blue-600"
            label="Profile Information"
            desc={user ? `${fullName} · ${user.specialization || user.role || '—'}` : 'Loading...'}
            onClick={() => setModal('profile')}
          />

          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 pt-3 pb-1">Account</p>
          <SettingItem
            icon={Lock} iconBg="bg-slate-700"
            label="Change Password"
            desc="Update your password to keep your account secure."
            onClick={() => setModal('password')}
          />

          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 pt-3 pb-1">Preferences</p>
          <SettingItem
            icon={Bell} iconBg="bg-amber-500"
            label="Notification Preferences"
            desc="Appointment bookings, cancellations, and patient alerts."
            badge={`${activeNotif} active`}
            onClick={() => setModal('notif')}
          />

          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 pt-3 pb-1">Session</p>
          <SettingItem
            icon={LogOut} iconBg="bg-red-100"
            label="Sign Out"
            desc="End your current session and return to the login page."
            onClick={() => setModal('actions')}
            danger
          />
        </div>

      </div>

      {/* ══ MODALS ══ */}
      {modal === 'profile' && (
        <ProfileModal
          user={user}
          onSave={handleProfileSave}
          onClose={close}
        />
      )}
      {modal === 'password' && (
        <PasswordModal
          userId={user?.user_id}
          onClose={close}
          onSuccess={() => showToast('Password updated successfully.')}
        />
      )}
      {modal === 'notif' && (
        <NotifModal
          notif={notif}
          onChange={(k, v) => {
            const check = validateNotificationPreference(k, v);
            if (!check?.ok) {
              showToast(check?.reason || 'Invalid notification setting.', 'error');
              return;
            }
            const result = setNotificationPreference(k, v);
            if (!result?.ok) {
              showToast(result?.reason || 'Unable to save notification setting.', 'error');
              return;
            }
            showToast(`Notification ${v ? 'enabled' : 'disabled'}.`);
          }}
          onClose={close}
        />
      )}
      {modal === 'account' && (
        <AccountModal user={user} onClose={close} />
      )}
      {modal === 'actions' && (
        <AccountActionsModal
          onClose={close}
          onLogout={handleLogout}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </MainLayout>
  );
}

