import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import LogoutConfirmModal from '../components/common/LogoutConfirmModal';
import {
  User, Lock, Bell, Monitor, Clock, LogOut,
  Shield, Check, X, Eye, EyeOff, Phone, Mail,
  Hash, Pencil, Save, Sun, Moon, Globe, Laptop,
  AlertCircle, CheckCircle2, ChevronRight,
  Settings, Smartphone, Loader2,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://backend1.test/api';

/* ── Authenticated apiFetch ── */
const apiFetch = async (path, options = {}) => {
  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept:         'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }
  return res.json();
};

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
function Modal({ onClose, icon: Icon, iconBg = 'bg-blue-600', title, subtitle, children, width = 'max-w-md' }) {
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
        <div className="p-6 max-h-[65vh] overflow-y-auto">
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
   FIELD ROW
══════════════════════════════════════════════════ */
function Field({ icon: Icon, label, value, editable, onChange, type = 'text', readOnlyNote }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
        <Icon className="w-3 h-3" /> {label}
        {readOnlyNote && <span className="ml-1 px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded-full text-[9px] font-bold normal-case tracking-normal">view only</span>}
      </label>
      {editable
        ? <input type={type} value={value} onChange={e => onChange(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm border border-blue-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-800 transition-all" />
        : <div className="px-3.5 py-2.5 text-sm font-semibold text-gray-800 bg-gray-50 rounded-xl border border-gray-100">{value || '—'}</div>
      }
    </div>
  );
}

/* ══════════════════════════════════════════════════
   PROFILE MODAL
══════════════════════════════════════════════════ */
function ProfileModal({ profile, onSave, onClose, saving }) {
  const [edit,  setEdit]  = useState(false);
  const [draft, setDraft] = useState(profile);
  const f = k => v => setDraft((p) => {
    if (k === 'contact') return { ...p, [k]: normalizeMobileInput(v) };
    return { ...p, [k]: v };
  });

  return (
    <Modal onClose={onClose} icon={User} iconBg="bg-gradient-to-r from-blue-600 to-indigo-700"
      title="Profile Information" subtitle="View and update your personal details.">
      <div className="space-y-3">
        <Field icon={User}   label="Full Name"      value={draft.fullName} editable={edit} onChange={f('fullName')} />
        <Field icon={Mail}   label="Email Address"  value={draft.email}    editable={edit} onChange={f('email')} type="email" />
        <Field icon={Phone}  label="Contact Number" value={draft.contact}  editable={edit} onChange={f('contact')} />
        <Field icon={Shield} label="Role"           value={draft.role}     editable={false} readOnlyNote />

        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          {edit ? (
            <>
              <button onClick={() => onSave(draft, () => setEdit(false))} disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-60">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button onClick={() => { setDraft(profile); setEdit(false); }}
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
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════
   PASSWORD MODAL
══════════════════════════════════════════════════ */
function PasswordModal({ onClose, onSuccess }) {
  const [pwd,   setPwd]   = useState({ current: '', newPwd: '', confirm: '' });
  const [show,  setShow]  = useState({ current: false, newPwd: false, confirm: false });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const f = k => v => setPwd(p => ({ ...p, [k]: v }));

  const submit = async () => {
    setError('');
    if (!pwd.current)              return setError('Enter your current password.');
    if (pwd.newPwd.length < 8)     return setError('New password must be at least 8 characters.');
    if (pwd.newPwd !== pwd.confirm) return setError('New passwords do not match.');

    setSaving(true);
    try {
      // Step 1 — verify current password
      await apiFetch('/auth/verify-password', {
        method: 'POST',
        body: JSON.stringify({ password: pwd.current }),
      });

      // Step 2 — update password
      await apiFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          current_password:      pwd.current,
          new_password:          pwd.newPwd,
          new_password_confirmation: pwd.confirm,
        }),
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message ?? 'Failed to update password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} icon={Lock} iconBg="bg-gradient-to-r from-slate-700 to-slate-900"
      title="Change Password" subtitle="Keep your account secure with a strong password.">
      <div className="space-y-3">
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
          <button onClick={submit} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-60">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
            {saving ? 'Updating…' : 'Update Password'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════
   NOTIFICATION MODAL
══════════════════════════════════════════════════ */
function NotifModal({ notif, onChange, onClose }) {
  const items = [
    { key: 'appointments', label: 'Appointment Reminders',  desc: 'Get notified about upcoming and new appointments.'   },
    { key: 'queue',        label: 'Queue Updates',           desc: 'Alerts when the patient queue changes or is updated.' },
    { key: 'system',       label: 'System Notifications',    desc: 'General system-wide alerts and announcements.'       },
  ];
  return (
    <Modal onClose={onClose} icon={Bell} iconBg="bg-gradient-to-r from-amber-500 to-orange-500"
      title="Notification Preferences" subtitle="Control which alerts and updates you receive.">
      <div className="space-y-2.5">
        {items.map(({ key, label, desc }) => (
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
      </div>
    </Modal>
  );
}


/* ══════════════════════════════════════════════════
   SESSION MODAL
══════════════════════════════════════════════════ */
function SessionModal({ session, onClose, onLogout }) {
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
export default function StaffSettingsPage() {
  const { user, logout: authLogout } = useAuth();
  const {
    preferences,
    setNotificationPreference,
    validateNotificationPreference,
  } = useNotifications();

  const [profile,  setProfile]  = useState(null);
  const [session,  setSession]  = useState({ lastLogin: '—', device: '—', ip: '—' });
  const [modal,    setModal]    = useState(null);
  const [toast,    setToast]    = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [loading,  setLoading]  = useState(true);

  /* ── Fetch current user profile ── */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await apiFetch('/auth/me');
        const me = data?.user ?? data;
        setProfile({
          fullName: me.name ?? `${me.first_name ?? ''} ${me.last_name ?? ''}`.trim(),
          email:    me.email,
          contact:  me.contact_number ?? '—',
          role:     me.role ?? '—',
          userId:   me.user_id ?? me.id,
        });
        // Session info kung available sa response
        if (me.last_login_at) {
          setSession(prev => ({ ...prev, lastLogin: new Date(me.last_login_at).toLocaleString('en-PH') }));
        }
      } catch {
        // Fallback — gamitin ang data mula sa AuthContext
        if (user) {
          setProfile({
            fullName: user.name ?? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim(),
            email:    user.email,
            contact:  user.contact_number ?? '—',
            role:     user.role ?? '—',
            userId:   user.user_id ?? user.id,
          });
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const showToast = (msg, type = 'success') => setToast({ message: msg, type });
  const close     = () => setModal(null);
  const initials  = name => name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '??';
  const notif = {
    appointments: true,
    queue: true,
    system: false,
    ...(preferences || {}),
  };

  /* ── Save profile ── */
  const handleSaveProfile = async (draft, onDone) => {
    setSaving(true);
    try {
      if (draft.contact && !/^\+63\d{10}$/.test(draft.contact)) {
        throw new Error('Contact number must be +63 followed by 10 digits.');
      }
      await apiFetch(`/users/${profile.userId}`, {
        method: 'PUT',
        body: JSON.stringify({
          first_name:     draft.fullName.split(' ')[0],
          last_name:      draft.fullName.split(' ').slice(1).join(' '),
          email:          draft.email,
          contact_number: draft.contact,
        }),
      });
      setProfile(draft);
      showToast('Profile updated successfully.');
      onDone?.();
    } catch (err) {
      showToast(err.message ?? 'Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  /* ── Logout ── */
  const handleLogout = async () => {
    await authLogout();
    window.location.href = '/login';
  };

  const activeNotifCount = Object.values(notif).filter(Boolean).length;

  if (loading || !profile) {
    return (
      <MainLayout title="Settings" subtitle="Manage your account and personal preferences.">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Settings" subtitle="Manage your account and personal preferences.">
      <div className="space-y-5 max-w-2xl mx-auto">

        {/* ══ HEADER ══ */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-44 h-44 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute bottom-0 right-24 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center text-lg font-black flex-shrink-0">
              {initials(profile.fullName)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black">{profile.fullName}</h2>
              <p className="text-blue-200 text-sm capitalize">{profile.role} · {profile.email}</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 border border-white/20 rounded-xl text-xs font-bold text-blue-100 flex-shrink-0">
              <Settings className="w-3.5 h-3.5" /> Settings
            </div>
          </div>
          <div className="relative flex items-center gap-2 mt-4 pt-4 border-t border-white/10 text-xs text-blue-200 font-semibold">
            <Shield className="w-3.5 h-3.5 text-blue-300 flex-shrink-0" />
            Personal account settings only. System configuration is restricted to administrators.
          </div>
        </div>

        {/* ══ SETTINGS MENU ══ */}
        <div className="space-y-2">

          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 pb-1">Account</p>
          <SettingItem icon={User}  iconBg="bg-blue-600"  label="Profile Information" desc={`${profile.fullName} · ${profile.contact}`} onClick={() => setModal('profile')} />
          <SettingItem icon={Lock}  iconBg="bg-slate-700" label="Change Password"     desc="Update your password to keep your account secure." onClick={() => setModal('password')} />

          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 pt-3 pb-1">Preferences</p>
          <SettingItem icon={Bell}    iconBg="bg-amber-500" label="Notification Preferences" desc="Appointments, queue updates, and system alerts." badge={`${activeNotifCount} active`} onClick={() => setModal('notif')} />

          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 pt-3 pb-1">Session</p>
          
          <SettingItem icon={LogOut} iconBg="bg-red-100"    label="Sign Out" desc="End your current session and return to the login page." onClick={() => setModal('session')} danger />
        </div>

      </div>

      {/* ══ MODALS ══ */}
      {modal === 'profile' && (
        <ProfileModal profile={profile} onSave={handleSaveProfile} onClose={close} saving={saving} />
      )}
      {modal === 'password' && (
        <PasswordModal onClose={close} onSuccess={() => showToast('Password updated successfully.')} />
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
            showToast(`${k.charAt(0) + k.slice(1)} notifications ${v ? 'enabled' : 'disabled'}.`);
          }}
          onClose={close}
        />
      )}
  
      {modal === 'session' && (
        <SessionModal session={session} onClose={close} onLogout={handleLogout} />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </MainLayout>
  );
}
