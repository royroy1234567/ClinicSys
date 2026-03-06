import React, { useState } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import {
  User, Lock, Bell, Shield, LogOut, Info,
  Check, X, Eye, EyeOff, Phone, Mail,
  Hash, Pencil, Save, AlertCircle, CheckCircle2,
  ChevronRight, Heart, AlertTriangle, MapPin,
  Calendar, Clock, Stethoscope, Building2,
  FileText, Globe, Monitor, Sun, Moon, UserX,
} from 'lucide-react';

/* ══════════════════════════════════════════════════
   MOCK DATA
══════════════════════════════════════════════════ */
const MOCK_ACCOUNT = {
  doctorId:  'DR-00005',
  createdAt: 'January 15, 2024',
  lastLogin: 'May 12, 2026 – 9:10 AM',
};

const INITIAL_PROFILE = {
  fullName:       'Dr. Sofia Tan',
  specialization: 'Neurologist',
  department:     'Neurology',
  room:           'Room 410',
  contact:        '+63 921 500 0005',
  email:          's.tan@clinic.com',
  licenseNo:      'PRC-2019-00412',
  bio:            'Board-certified neurologist with 8 years of clinical experience specializing in headache disorders and epilepsy.',
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
function Modal({ onClose, icon: Icon, iconBg, title, subtitle, children, width = 'max-w-md' }) {
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
          <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows || 3}
            className="w-full px-3.5 py-2.5 text-sm border border-blue-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-800 transition-all resize-none" />
        ) : (
          <input type={type} value={value} onChange={e => onChange(e.target.value)}
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
function ProfileModal({ profile, onSave, onClose }) {
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState(profile);
  const f = k => v => setDraft(p => ({ ...p, [k]: v }));

  return (
    <Modal onClose={onClose} icon={User} iconBg="bg-gradient-to-r from-blue-600 to-indigo-700"
      title="Profile Information" subtitle="View and update your professional details." width="max-w-lg">

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Field icon={User}        label="Full Name"       value={draft.fullName}       editable={edit} onChange={f('fullName')} />
        </div>
        <Field icon={Stethoscope}   label="Specialization"  value={draft.specialization} editable={edit} onChange={f('specialization')} />
        <Field icon={Building2}     label="Department"      value={draft.department}     editable={edit} onChange={f('department')} />
        <Field icon={MapPin}        label="Consultation Room" value={draft.room}          editable={edit} onChange={f('room')} />
        <Field icon={Hash}          label="License No."     value={draft.licenseNo}      editable={false} note="view only" />
        <Field icon={Phone}         label="Contact Number"  value={draft.contact}        editable={edit} onChange={f('contact')} />
        <Field icon={Mail}          label="Email Address"   value={draft.email}          editable={edit} onChange={f('email')} type="email" />
        <div className="col-span-2">
          <Field icon={FileText}    label="Professional Bio" value={draft.bio}           editable={edit} onChange={f('bio')} as="textarea" rows={3} />
        </div>
      </div>

      <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <p>License number and department assignment can only be changed by an administrator.</p>
      </div>

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
    </Modal>
  );
}

/* — Password — */
function PasswordModal({ onClose, onSuccess }) {
  const [pwd, setPwd]     = useState({ current: '', newPwd: '', confirm: '' });
  const [show, setShow]   = useState({ current: false, newPwd: false, confirm: false });
  const [error, setError] = useState('');
  const f = k => v => setPwd(p => ({ ...p, [k]: v }));

  const submit = () => {
    setError('');
    if (!pwd.current)               return setError('Enter your current password.');
    if (pwd.newPwd.length < 8)      return setError('New password must be at least 8 characters.');
    if (pwd.newPwd !== pwd.confirm)  return setError('Passwords do not match.');
    onSuccess(); onClose();
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
        <button onClick={submit}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm">
          <Lock className="w-3.5 h-3.5" /> Update Password
        </button>
      </div>
    </Modal>
  );
}

/* — Notifications — */
function NotifModal({ notif, onChange, onClose }) {
  return (
    <Modal onClose={onClose} icon={Bell} iconBg="bg-gradient-to-r from-amber-500 to-orange-500"
      title="Notification Preferences" subtitle="Control appointment and schedule alerts.">
      {[
        { key: 'newAppointment',    label: 'New Appointment Booked',   desc: 'Get notified when a patient books an appointment with you.'     },
        { key: 'cancellation',      label: 'Appointment Cancellation', desc: 'Alerts when a patient cancels their appointment.'               },
        { key: 'reminder',          label: 'Daily Schedule Reminder',  desc: 'Receive a daily summary of your upcoming consultations.'        },
        { key: 'patientArrival',    label: 'Patient Arrival Alert',    desc: 'Notified when your next patient has checked in at the queue.'   },
        { key: 'systemAnnounce',    label: 'System Announcements',     desc: 'Clinic-wide announcements and system updates.'                  },
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

/* — Interface — */
function InterfaceModal({ theme, setTheme, language, setLanguage, onClose, onApply }) {
  const [localTheme, setLocalTheme] = useState(theme);
  const [localLang,  setLocalLang]  = useState(language);

  return (
    <Modal onClose={onClose} icon={Monitor} iconBg="bg-gradient-to-r from-violet-500 to-purple-700"
      title="Interface Preferences" subtitle="Customize your display and language settings.">

      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2.5">Theme Mode</p>
        <div className="grid grid-cols-2 gap-2">
          {[{ v: 'light', label: 'Light Mode', Icon: Sun }, { v: 'dark', label: 'Dark Mode', Icon: Moon }].map(({ v, label, Icon }) => (
            <button key={v} onClick={() => setLocalTheme(v)}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border-2 text-sm font-bold transition-all
                ${localTheme === v ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}>
              <Icon className="w-4 h-4" /> {label}
              {localTheme === v && <Check className="w-3.5 h-3.5 ml-auto" />}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2.5">Language</p>
        <div className="relative">
          <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select value={localLang} onChange={e => setLocalLang(e.target.value)}
            className="w-full appearance-none pl-10 pr-8 py-2.5 text-sm font-bold border border-gray-200 rounded-xl bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer">
            {['English', 'Filipino', 'Cebuano'].map(l => <option key={l}>{l}</option>)}
          </select>
          <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none rotate-90" />
        </div>
      </div>

      <div className="pt-1 border-t border-gray-100 flex gap-2">
        <button onClick={() => { setTheme(localTheme); setLanguage(localLang); onApply(); onClose(); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all shadow-sm">
          <Check className="w-3.5 h-3.5" /> Apply Changes
        </button>
        <button onClick={onClose}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-gray-200 text-gray-500 text-xs font-bold hover:bg-gray-50 transition-all">
          Cancel
        </button>
      </div>
    </Modal>
  );
}

/* — Account Info — */
function AccountModal({ profile, onClose }) {
  return (
    <Modal onClose={onClose} icon={Info} iconBg="bg-gradient-to-r from-cyan-500 to-blue-600"
      title="Account Information" subtitle="Your system account details.">
      {[
        [Hash,        'Doctor ID',        MOCK_ACCOUNT.doctorId      ],
        [Stethoscope, 'Specialization',   profile.specialization     ],
        [Hash,        'License No.',      profile.licenseNo          ],
        [Mail,        'Email Address',    profile.email              ],
        [Calendar,    'Account Created',  MOCK_ACCOUNT.createdAt     ],
        [Clock,       'Last Login',       MOCK_ACCOUNT.lastLogin     ],
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
    </Modal>
  );
}

/* — Logout / Account Actions — */
function AccountActionsModal({ onClose, onLogout }) {
  const [confirmLogout, setConfirmLogout] = useState(false);

  return (
    <Modal onClose={onClose} icon={LogOut} iconBg="bg-gradient-to-r from-red-500 to-rose-600"
      title="Account Actions" subtitle="Manage your session.">

      {!confirmLogout ? (
        <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl">
          <div>
            <p className="text-sm font-bold text-gray-800">Sign Out</p>
            <p className="text-xs text-gray-400 mt-0.5">End your current session.</p>
          </div>
          <button onClick={() => setConfirmLogout(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-all shadow-sm">
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      ) : (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 font-semibold">
              Make sure you have completed all pending consultations before signing out.
            </p>
          </div>
          <p className="text-sm font-bold text-red-800 text-center">Are you sure you want to sign out?</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setConfirmLogout(false)}
              className="py-2.5 rounded-2xl border-2 border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50 transition-all">
              Cancel
            </button>
            <button onClick={() => { onLogout(); onClose(); }}
              className="py-2.5 rounded-2xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-all">
              Yes, Sign Out
            </button>
          </div>
        </div>
      )}
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
  const [profile,      setProfile]      = useState(INITIAL_PROFILE);
  const [notif,        setNotif]        = useState({ newAppointment: true, cancellation: true, reminder: true, patientArrival: true, systemAnnounce: false });
  const [theme,        setTheme]        = useState('light');
  const [language,     setLanguage]     = useState('English');
  const [modal,        setModal]        = useState(null);
  const [toast,        setToast]        = useState(null);

  const showToast = (msg, type = 'success') => setToast({ message: msg, type });
  const close     = () => setModal(null);

  const activeNotif = Object.values(notif).filter(Boolean).length;
  const initials    = name => name.replace('Dr. ', '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <MainLayout title="Settings" subtitle="Manage your professional profile and preferences.">
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
              <p className="text-blue-200 text-sm">{profile.specialization} · {profile.department}</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 border border-white/20 rounded-xl text-xs font-bold text-blue-100 flex-shrink-0">
              <Stethoscope className="w-3.5 h-3.5" /> Doctor
            </div>
          </div>

          {/* Quick stats */}
          <div className="relative flex items-center gap-5 mt-4 pt-4 border-t border-white/10">
            {[
              { label: 'Doctor ID',   value: MOCK_ACCOUNT.doctorId  },
              { label: 'License No.', value: profile.licenseNo      },
            ].map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <div className="w-px h-6 bg-white/20" />}
                <div>
                  <p className="text-blue-300 text-[10px] font-bold uppercase tracking-wide">{s.label}</p>
                  <p className="text-white text-sm font-black">{s.value}</p>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ══ SETTINGS MENU ══ */}
        <div className="space-y-2">

          {/* Professional */}
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 pb-1">Professional</p>

          <SettingItem
            icon={User} iconBg="bg-blue-600"
            label="Profile Information"
            desc={`${profile.fullName} · ${profile.specialization} · ${profile.room}`}
            onClick={() => setModal('profile')}
          />

          {/* Account */}
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 pt-3 pb-1">Account</p>

          <SettingItem
            icon={Lock} iconBg="bg-slate-700"
            label="Change Password"
            desc="Update your password to keep your account secure."
            onClick={() => setModal('password')}
          />

          {/* Preferences */}
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 pt-3 pb-1">Preferences</p>

          <SettingItem
            icon={Bell} iconBg="bg-amber-500"
            label="Notification Preferences"
            desc="Appointment bookings, cancellations, and patient alerts."
            badge={`${activeNotif} active`}
            onClick={() => setModal('notif')}
          />
          <SettingItem
            icon={Monitor} iconBg="bg-violet-600"
            label="Interface Preferences"
            desc={`${theme === 'light' ? 'Light Mode' : 'Dark Mode'} · ${language}`}
            onClick={() => setModal('interface')}
          />

          {/* Session */}
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 pt-3 pb-1">Session</p>

          <SettingItem
            icon={Info} iconBg="bg-cyan-500"
            label="Account Information"
            desc={`${MOCK_ACCOUNT.doctorId} · Last login: ${MOCK_ACCOUNT.lastLogin}`}
            onClick={() => setModal('account')}
          />
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
          onChange={(k, v) => { setNotif(p => ({ ...p, [k]: v })); showToast(`Notification ${v ? 'enabled' : 'disabled'}.`); }}
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
      {modal === 'account' && (
        <AccountModal profile={profile} onClose={close} />
      )}
      {modal === 'actions' && (
        <AccountActionsModal
          onClose={close}
          onLogout={() => showToast('You have been signed out.')}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </MainLayout>
  );
}