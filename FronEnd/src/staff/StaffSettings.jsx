import React, { useState } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import {
  User, Lock, Bell, Monitor, Clock, LogOut,
  Shield, Check, X, Eye, EyeOff, Phone, Mail,
  Hash, Pencil, Save, Sun, Moon, Globe, Laptop,
  AlertCircle, CheckCircle2, ChevronRight,
  Settings, Smartphone,
} from 'lucide-react';

/* ══════════════════════════════════════════════════
   MOCK DATA
══════════════════════════════════════════════════ */
const SESSION = {
  lastLogin: 'May 12, 2026 – 8:45 AM',
  device:    'Chrome 124 on Windows 11',
  ip:        '192.168.1.42',
};

const INITIAL_PROFILE = {
  fullName: 'Anna Rivera',
  username: 'a.rivera',
  email:    'a.rivera@clinic.com',
  contact:  '+63 917 555 0099',
  role:     'Receptionist',
};

/* ══════════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════════ */
function Toast({ message, type = 'success', onDismiss }) {
  React.useEffect(() => { const t = setTimeout(onDismiss, 3200); return () => clearTimeout(t); }, []);
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

        {/* Header */}
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

        {/* Body */}
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
      className={`relative flex-shrink-0 rounded-full transition-colors duration-200
        ${checked ? 'bg-blue-600' : 'bg-gray-200'}`}
      style={{ width: 40, height: 22 }}>
      <span className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-all duration-200
        ${checked ? 'left-[20px]' : 'left-[3px]'}`} />
    </button>
  );
}

/* ══════════════════════════════════════════════════
   FIELD ROW (read / edit)
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
        : <div className="px-3.5 py-2.5 text-sm font-semibold text-gray-800 bg-gray-50 rounded-xl border border-gray-100">{value}</div>
      }
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MODALS
══════════════════════════════════════════════════ */

/* — Profile — */
function ProfileModal({ profile, onSave, onClose }) {
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState(profile);
  const f = k => v => setDraft(p => ({ ...p, [k]: v }));

  return (
    <Modal onClose={onClose} icon={User} iconBg="bg-gradient-to-r from-blue-600 to-indigo-700"
      title="Profile Information" subtitle="View and update your personal details.">
      <div className="space-y-3">
        <Field icon={User}   label="Full Name"       value={draft.fullName} editable={edit} onChange={f('fullName')} />
        <Field icon={Hash}   label="Username"        value={draft.username} editable={edit} onChange={f('username')} />
        <Field icon={Mail}   label="Email Address"   value={draft.email}    editable={edit} onChange={f('email')} type="email" />
        <Field icon={Phone}  label="Contact Number"  value={draft.contact}  editable={edit} onChange={f('contact')} />
        <Field icon={Shield} label="Role"            value={draft.role}     editable={false} readOnlyNote />

        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          {edit ? (
            <>
              <button onClick={() => { onSave(draft); setEdit(false); }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm">
                <Save className="w-3.5 h-3.5" /> Save Changes
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

/* — Password — */
function PasswordModal({ onClose, onSuccess }) {
  const [pwd, setPwd]     = useState({ current: '', newPwd: '', confirm: '' });
  const [show, setShow]   = useState({ current: false, newPwd: false, confirm: false });
  const [error, setError] = useState('');
  const f = k => v => setPwd(p => ({ ...p, [k]: v }));
  const toggleShow = k => setShow(p => ({ ...p, [k]: !p[k] }));

  const submit = () => {
    setError('');
    if (!pwd.current)               return setError('Enter your current password.');
    if (pwd.newPwd.length < 8)      return setError('New password must be at least 8 characters.');
    if (pwd.newPwd !== pwd.confirm)  return setError('New passwords do not match.');
    onSuccess(); onClose();
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
              <button onClick={() => toggleShow(key)}
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
          <button onClick={submit}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm">
            <Lock className="w-3.5 h-3.5" /> Update Password
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* — Notifications — */
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
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5
                ${notif[key] ? 'bg-amber-100' : 'bg-gray-200'}`}>
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

/* — Interface — */
function InterfaceModal({ theme, setTheme, language, setLanguage, onClose, onApply }) {
  const [localTheme, setLocalTheme]       = useState(theme);
  const [localLang,  setLocalLang]        = useState(language);
  return (
    <Modal onClose={onClose} icon={Monitor} iconBg="bg-gradient-to-r from-teal-500 to-emerald-600"
      title="Interface Preferences" subtitle="Customize your display and language settings.">
      <div className="space-y-5">
        {/* Theme */}
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2.5">Theme Mode</p>
          <div className="grid grid-cols-2 gap-2">
            {[{ v: 'light', label: 'Light Mode', Icon: Sun }, { v: 'dark', label: 'Dark Mode', Icon: Moon }].map(({ v, label, Icon }) => (
              <button key={v} onClick={() => setLocalTheme(v)}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border-2 text-sm font-bold transition-all
                  ${localTheme === v ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}>
                <Icon className="w-4 h-4" /> {label}
                {localTheme === v && <Check className="w-3.5 h-3.5 ml-auto" />}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2.5">Language</p>
          <div className="relative">
            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select value={localLang} onChange={e => setLocalLang(e.target.value)}
              className="w-full appearance-none pl-10 pr-8 py-2.5 text-sm font-bold border border-gray-200 rounded-xl bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer">
              {['English', 'Filipino', 'Cebuano'].map(l => <option key={l}>{l}</option>)}
            </select>
            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none rotate-90" />
          </div>
        </div>

        <div className="pt-1 border-t border-gray-100 flex gap-2">
          <button onClick={() => { setTheme(localTheme); setLanguage(localLang); onApply(); onClose(); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm">
            <Check className="w-3.5 h-3.5" /> Apply Changes
          </button>
          <button onClick={onClose}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-gray-200 text-gray-500 text-xs font-bold hover:bg-gray-50 transition-all">
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* — Session — */
function SessionModal({ onClose, onLogout }) {
  const [confirmLogout, setConfirmLogout] = useState(false);
  return (
    <Modal onClose={onClose} icon={Clock} iconBg="bg-gradient-to-r from-violet-600 to-purple-700"
      title="Session Management" subtitle="Your current login session details.">
      <div className="space-y-3">
        {[
          [Clock,       'Last Login',       SESSION.lastLogin],
          [Laptop,      'Device / Browser', SESSION.device   ],
          [Smartphone,  'IP Address',        SESSION.ip       ],
        ].map(([Icon, label, value]) => (
          <div key={label} className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
              <Icon className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{value}</p>
            </div>
          </div>
        ))}

        {!confirmLogout ? (
          <div className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-2xl mt-2">
            <div>
              <p className="text-sm font-bold text-red-800">Sign Out</p>
              <p className="text-xs text-red-500 mt-0.5">End your current session.</p>
            </div>
            <button onClick={() => setConfirmLogout(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-all shadow-sm">
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        ) : (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl space-y-3">
            <p className="text-sm font-bold text-red-800 text-center">Are you sure you want to sign out?</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setConfirmLogout(false)}
                className="py-2.5 rounded-2xl border-2 border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button onClick={() => { onLogout(); onClose(); }}
                className="py-2.5 rounded-2xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-all shadow-sm">
                Yes, Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
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
          {badge && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{badge}</span>
          )}
        </div>
        <p className={`text-xs mt-0.5 truncate ${danger ? 'text-red-400' : 'text-gray-400'}`}>{desc}</p>
      </div>
      <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:translate-x-0.5
        ${danger ? 'text-red-400' : 'text-gray-300'}`} />
    </button>
  );
}

/* ══════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════ */
export default function StaffSettingsPage() {
  const [profile,   setProfile]   = useState(INITIAL_PROFILE);
  const [notif,     setNotif]     = useState({ appointments: true, queue: true, system: false });
  const [theme,     setTheme]     = useState('light');
  const [language,  setLanguage]  = useState('English');
  const [modal,     setModal]     = useState(null); // 'profile'|'password'|'notif'|'interface'|'session'
  const [toast,     setToast]     = useState(null);

  const showToast = (msg, type = 'success') => setToast({ message: msg, type });
  const close     = () => setModal(null);

  const activeNotifCount = Object.values(notif).filter(Boolean).length;
  const initials = name => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <MainLayout title="Settings" subtitle="Manage your account and personal preferences.">
      <div className="space-y-5 max-w-2xl mx-auto">

        {/* ══ HEADER ══ */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-44 h-44 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute bottom-0 right-24 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
          <div className="relative flex items-center gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center text-lg font-black flex-shrink-0">
              {initials(profile.fullName)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black">{profile.fullName}</h2>
              <p className="text-blue-200 text-sm">{profile.role} · {profile.email}</p>
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

          {/* Account group */}
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 pb-1">Account</p>

          <SettingItem
            icon={User} iconBg="bg-blue-600"
            label="Profile Information"
            desc={`${profile.fullName} · ${profile.contact}`}
            onClick={() => setModal('profile')}
          />
          <SettingItem
            icon={Lock} iconBg="bg-slate-700"
            label="Change Password"
            desc="Update your password to keep your account secure."
            onClick={() => setModal('password')}
          />

          {/* Preferences group */}
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 pt-3 pb-1">Preferences</p>

          <SettingItem
            icon={Bell} iconBg="bg-amber-500"
            label="Notification Preferences"
            desc="Appointments, queue updates, and system alerts."
            badge={`${activeNotifCount} active`}
            onClick={() => setModal('notif')}
          />
          <SettingItem
            icon={Monitor} iconBg="bg-teal-600"
            label="Interface Preferences"
            desc={`${theme === 'light' ? 'Light Mode' : 'Dark Mode'} · ${language}`}
            onClick={() => setModal('interface')}
          />

          {/* Session group */}
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 pt-3 pb-1">Session</p>

          <SettingItem
            icon={Clock} iconBg="bg-violet-600"
            label="Session Information"
            desc={`Last login: ${SESSION.lastLogin}`}
            onClick={() => setModal('session')}
          />
          <SettingItem
            icon={LogOut} iconBg="bg-red-100"
            label="Sign Out"
            desc="End your current session and return to the login page."
            onClick={() => setModal('session')}
            danger
          />
        </div>

        {/* Staff restrictions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-100 rounded-2xl text-xs text-green-700">
            <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-green-800 mb-1">Staff Can</p>
              <p>Update personal profile · Change password · Set notification & interface preferences</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-xs text-red-700">
            <Shield className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-red-800 mb-1">Restricted Access</p>
              <p>System config · User management · Clinic settings · Doctor schedules · Reports</p>
            </div>
          </div>
        </div>

      </div>

      {/* ══ MODALS ══ */}
      {modal === 'profile' && (
        <ProfileModal
          profile={profile}
          onSave={p => { setProfile(p); showToast('Profile updated successfully.'); close(); }}
          onClose={close}
        />
      )}
      {modal === 'password' && (
        <PasswordModal
          onClose={close}
          onSuccess={() => showToast('Password updated successfully.')}
        />
      )}
      {modal === 'notif' && (
        <NotifModal
          notif={notif}
          onChange={(k, v) => { setNotif(p => ({ ...p, [k]: v })); showToast(`${k.charAt(0).toUpperCase()+k.slice(1)} notifications ${v ? 'enabled' : 'disabled'}.`); }}
          onClose={close}
        />
      )}
      {modal === 'interface' && (
        <InterfaceModal
          theme={theme} setTheme={setTheme}
          language={language} setLanguage={setLanguage}
          onApply={() => showToast('Interface preferences applied.')}
          onClose={close}
        />
      )}
      {modal === 'session' && (
        <SessionModal
          onClose={close}
          onLogout={() => showToast('You have been signed out.')}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </MainLayout>
  );
}