import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LogoutConfirmModal from '../components/common/LogoutConfirmModal';
import {
  User, Lock, Bell, Shield, LogOut, Info,
  Check, X, Eye, EyeOff, Phone, Mail,
  Hash, Pencil, Save, AlertCircle, CheckCircle2,
  ChevronRight, Heart, AlertTriangle, MapPin,
  Calendar, Clock, UserX, Cake, Users, Loader2,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://backend1.test/api';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept':        'application/json',
  'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
});

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
function Field({ icon: Icon, label, value, editable, onChange, type = 'text', note, as }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
        <Icon className="w-3 h-3" /> {label}
        {note && <span className="ml-1 px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded-full text-[9px] font-bold normal-case tracking-normal">{note}</span>}
      </label>
      {editable ? (
        as === 'select' ? (
          <select value={value} onChange={e => onChange(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm border border-blue-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-800 transition-all">
            {['Male', 'Female', 'Prefer not to say'].map(g => <option key={g}>{g}</option>)}
          </select>
        ) : (
          <input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm border border-blue-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-800 transition-all" />
        )
      ) : (
        <div className="px-3.5 py-2.5 text-sm font-semibold text-gray-800 bg-gray-50 rounded-xl border border-gray-100">{value || '—'}</div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   PROFILE MODAL
══════════════════════════════════════════════════ */
function ProfileModal({ profile, onSave, onClose, saving }) {
  const [edit, setEdit]   = useState(false);
  const [draft, setDraft] = useState(profile);
  const f = k => v => setDraft(p => ({ ...p, [k]: v }));

  return (
    <Modal onClose={onClose} icon={User} iconBg="bg-gradient-to-r from-blue-600 to-indigo-700"
      title="Profile Information" subtitle="View and update your personal details." width="max-w-lg">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Field icon={User}  label="First Name"     value={draft.first_name}  editable={edit} onChange={f('first_name')} />
        </div>
        <Field icon={User}    label="Middle Name"    value={draft.middle_name} editable={edit} onChange={f('middle_name')} />
        <Field icon={User}    label="Last Name"      value={draft.last_name}   editable={edit} onChange={f('last_name')} />
        <Field icon={Cake}    label="Birthdate"      value={draft.dob}         editable={edit} onChange={f('dob')} type="date" />
        <Field icon={Users}   label="Gender"         value={draft.gender}      editable={edit} onChange={f('gender')} as="select" />
        <Field icon={Phone}   label="Mobile"         value={draft.mobile}      editable={edit} onChange={f('mobile')} />
        <Field icon={Mail}    label="Email Address"  value={draft.email}       editable={edit} onChange={f('email')} type="email" />
        <Field icon={MapPin}  label="Street"         value={draft.street}      editable={edit} onChange={f('street')} />
        <Field icon={MapPin}  label="City"           value={draft.city}        editable={edit} onChange={f('city')} />
        <Field icon={MapPin}  label="Province"       value={draft.province}    editable={edit} onChange={f('province')} />
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
        {edit ? (
          <>
            <button onClick={() => onSave(draft).then(() => setEdit(false))}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-60">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Changes
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

/* ══════════════════════════════════════════════════
   MEDICAL MODAL
══════════════════════════════════════════════════ */
function MedicalModal({ medical, onSave, onClose, saving }) {
  const [edit, setEdit]   = useState(false);
  const [draft, setDraft] = useState(medical);
  const f = k => v => setDraft(p => ({ ...p, [k]: v }));

  return (
    <Modal onClose={onClose} icon={Heart} iconBg="bg-gradient-to-r from-rose-500 to-pink-600"
      title="Medical Information" subtitle="Basic health details and emergency contacts." width="max-w-lg">

      <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <p>You can update basic medical details. Consultation records and diagnoses are managed by your doctor only.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field icon={Heart}       label="Blood Type"             value={draft.blood_type}             editable={edit} onChange={f('blood_type')} />
        <Field icon={AlertCircle} label="Allergies"              value={draft.allergies}              editable={edit} onChange={f('allergies')} />
        <Field icon={Heart}       label="Conditions"             value={draft.conditions}             editable={edit} onChange={f('conditions')} />
        <Field icon={Heart}       label="Medications"            value={draft.medications}            editable={edit} onChange={f('medications')} />
        <Field icon={User}        label="Emergency Contact Name" value={draft.emergency_name}         editable={edit} onChange={f('emergency_name')} />
        <Field icon={Phone}       label="Emergency Relationship" value={draft.emergency_relationship} editable={edit} onChange={f('emergency_relationship')} />
        <div className="col-span-2">
          <Field icon={Phone}     label="Emergency Contact No."  value={draft.emergency_contact}      editable={edit} onChange={f('emergency_contact')} />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
        {edit ? (
          <>
            <button onClick={() => onSave(draft).then(() => setEdit(false))}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-60">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Changes
            </button>
            <button onClick={() => { setDraft(medical); setEdit(false); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-gray-200 text-gray-500 text-xs font-bold hover:bg-gray-50 transition-all">
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </>
        ) : (
          <button onClick={() => setEdit(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border-2 border-gray-200 text-gray-600 text-xs font-bold hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50 transition-all">
            <Pencil className="w-3.5 h-3.5" /> Edit Details
          </button>
        )}
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════
   PASSWORD MODAL
══════════════════════════════════════════════════ */
function PasswordModal({ onClose, onSuccess }) {
  const [pwd, setPwd]     = useState({ current: '', newPwd: '', confirm: '' });
  const [show, setShow]   = useState({ current: false, newPwd: false, confirm: false });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const f = k => v => setPwd(p => ({ ...p, [k]: v }));

  const submit = async () => {
    setError('');
    if (!pwd.current)              return setError('Enter your current password.');
    if (pwd.newPwd.length < 8)     return setError('New password must be at least 8 characters.');
    if (pwd.newPwd !== pwd.confirm) return setError('Passwords do not match.');
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/patient/password`, {
        method:  'PUT',
        headers: authHeaders(),
        body:    JSON.stringify({ current_password: pwd.current, password: pwd.newPwd, password_confirmation: pwd.confirm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update password.');
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
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
        <button onClick={submit} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-60">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
          Update Password
        </button>
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════
   NOTIFICATION MODAL
══════════════════════════════════════════════════ */
function NotifModal({ notif, onChange, onClose }) {
  return (
    <Modal onClose={onClose} icon={Bell} iconBg="bg-gradient-to-r from-amber-500 to-orange-500"
      title="Notification Preferences" subtitle="Control appointment alerts and reminders.">
      {[
        { key: 'confirmation', label: 'Appointment Confirmation', desc: 'Get notified when your appointment is confirmed.'        },
        { key: 'reminder',     label: 'Appointment Reminder',     desc: 'Receive reminders before your scheduled appointments.'   },
        { key: 'updates',      label: 'Updates & Rescheduling',   desc: 'Alerts for any changes or rescheduling of appointments.' },
        { key: 'promo',        label: 'Promotional Notifications',desc: 'Clinic announcements, health tips, and promotions.'      },
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

/* ══════════════════════════════════════════════════
   PRIVACY MODAL
══════════════════════════════════════════════════ */
function PrivacyModal({ privacy, onChange, onClose }) {
  return (
    <Modal onClose={onClose} icon={Shield} iconBg="bg-gradient-to-r from-teal-500 to-emerald-600"
      title="Privacy Settings" subtitle="Control how your health information is shared.">
      {[
        { key: 'allowDoctorAccess', label: 'Allow Doctors to View Medical History', desc: 'Doctors assigned to you can access your full medical records for treatment.'   },
        { key: 'shareForTreatment', label: 'Share Information for Treatment',       desc: 'Allow medical staff to use your data to provide better care.'                  },
        { key: 'anonymousData',     label: 'Allow Anonymous Data Use',              desc: 'Help improve clinic services by sharing anonymized, non-identifiable data.'    },
      ].map(({ key, label, desc }) => (
        <div key={key}
          className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-white hover:border-gray-200 transition-all">
          <div className="flex items-start gap-3">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${privacy[key] ? 'bg-teal-100' : 'bg-gray-200'}`}>
              <Shield className={`w-3.5 h-3.5 ${privacy[key] ? 'text-teal-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </div>
          </div>
          <Toggle checked={privacy[key]} onChange={v => onChange(key, v)} />
        </div>
      ))}
      <div className="flex items-start gap-2.5 p-3.5 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-700">
        <Shield className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
        <p>Your data is protected under our privacy policy. You can update these settings at any time.</p>
      </div>
    </Modal>
  );
}


/* ══════════════════════════════════════════════════
   ACCOUNT ACTIONS MODAL
══════════════════════════════════════════════════ */
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
export default function PatientSettingsPage() {
  const { user, logout }  = useAuth();
  const navigate          = useNavigate();

  const [patient,  setPatient]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [notif,    setNotif]    = useState({ confirmation: true, reminder: true, updates: true, promo: false });
  const [privacy,  setPrivacy]  = useState({ allowDoctorAccess: true, shareForTreatment: true, anonymousData: false });
  const [modal,    setModal]    = useState(null);
  const [toast,    setToast]    = useState(null);

  const showToast = (msg, type = 'success') => setToast({ message: msg, type });
  const close     = () => setModal(null);

  // ── Fetch patient on mount ──
  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const res = await fetch(`${API_BASE}/patient/profile`, {
          headers: authHeaders(),
        });
        if (!res.ok) throw new Error('Failed to fetch profile');
        const data = await res.json();
        setPatient(data);
      } catch (err) {
        console.error(err);
        // Fallback to AuthContext user data if API fails
        if (user) {
          setPatient({
            id:         user.id,
            first_name: user.name?.split(' ')[0] ?? '',
            last_name:  user.name?.split(' ').slice(1).join(' ') ?? '',
            email:      user.email,
          });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, []);

  // ── Save profile ──
  const saveProfile = async (draft) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/patient/profile`, {
        method:  'PUT',
        headers: authHeaders(),
        body:    JSON.stringify(draft),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      const data = await res.json();
      setPatient(data);
      showToast('Profile updated successfully.');
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // ── Save medical ──
  const saveMedical = async (draft) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/patient/profile`, {
        method:  'PUT',
        headers: authHeaders(),
        body:    JSON.stringify(draft),
      });
      if (!res.ok) throw new Error('Failed to update medical info');
      const data = await res.json();
      setPatient(data);
      showToast('Medical information updated.');
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // ── Logout ──
  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method:  'POST',
        headers: authHeaders(),
      });
    } catch { /* ignore */ }
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <MainLayout title="Settings" subtitle="Manage your personal account and preferences.">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </MainLayout>
    );
  }

  if (!patient) return null;

  const fullName      = `${patient.first_name ?? ''} ${patient.last_name ?? ''}`.trim();
  const initials      = fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const patientId     = `PT-${String(patient.id).padStart(5, '0')}`;
  const activeNotif   = Object.values(notif).filter(Boolean).length;
  const activePrivacy = Object.values(privacy).filter(Boolean).length;

  return (
    <MainLayout title="Settings" subtitle="Manage your personal account and preferences.">
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
              <p className="text-blue-200 text-sm">{patient.email}</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 border border-white/20 rounded-xl text-xs font-bold text-blue-100 flex-shrink-0">
              <User className="w-3.5 h-3.5" /> Patient
            </div>
          </div>
          <div className="relative flex items-center gap-2 mt-4 pt-4 border-t border-white/10 text-xs text-blue-200 font-semibold">
            <Shield className="w-3.5 h-3.5 text-blue-300 flex-shrink-0" />
            Manage your account and personal preferences.
          </div>
        </div>

        {/* ══ SETTINGS MENU ══ */}
        <div className="space-y-2">

          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 pb-1">Personal</p>

          <SettingItem
            icon={User} iconBg="bg-blue-600"
            label="Profile Information"
            desc={`${fullName} · ${patient.mobile ?? patient.email}`}
            onClick={() => setModal('profile')}
          />
          <SettingItem
            icon={Heart} iconBg="bg-rose-500"
            label="Medical Information"
            desc={`Blood Type: ${patient.blood_type ?? '—'} · Emergency: ${patient.emergency_name ?? '—'}`}
            onClick={() => setModal('medical')}
          />
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
            desc="Appointment confirmations, reminders, and updates."
            badge={`${activeNotif} active`}
            onClick={() => setModal('notif')}
          />
          <SettingItem
            icon={Shield} iconBg="bg-teal-600"
            label="Privacy Settings"
            desc="Control how your health data is accessed and shared."
            badge={`${activePrivacy} enabled`}
            onClick={() => setModal('privacy')}
          />

          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 pt-3 pb-1">Account</p>

       
          <SettingItem
            icon={LogOut} iconBg="bg-red-100"
            label="Account Actions"
            desc="Deactivate your patient account."
            onClick={() => setModal('actions')}
            danger
          />
        </div>
      </div>

      {/* ══ MODALS ══ */}
      {modal === 'profile' && (
        <ProfileModal
          profile={patient}
          onSave={saveProfile}
          onClose={close}
          saving={saving}
        />
      )}
      {modal === 'medical' && (
        <MedicalModal
          medical={patient}
          onSave={saveMedical}
          onClose={close}
          saving={saving}
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
      {modal === 'privacy' && (
        <PrivacyModal
          privacy={privacy}
          onChange={(k, v) => { setPrivacy(p => ({ ...p, [k]: v })); showToast(`Privacy setting ${v ? 'enabled' : 'disabled'}.`); }}
          onClose={close}
        />
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