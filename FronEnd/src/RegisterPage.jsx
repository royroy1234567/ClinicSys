import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Stethoscope, ChevronLeft, ChevronRight, Check,
  Eye, EyeOff, User, Phone, Lock, Heart, AlertTriangle, Shield,
} from 'lucide-react';

/* ─── helpers ─── */
const calcAge = (dob) => {
  if (!dob) return '';
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
};

const pwStrength = (pw) => {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8)           score++;
  if (/[A-Z]/.test(pw))         score++;
  if (/[0-9]/.test(pw))         score++;
  if (/[^A-Za-z0-9]/.test(pw))  score++;
  const map = [
    { label: '',       color: '#E2E8F0' },
    { label: 'Weak',   color: '#DC2626' },
    { label: 'Fair',   color: '#F59E0B' },
    { label: 'Good',   color: '#0D9488' },
    { label: 'Strong', color: '#16A34A' },
  ];
  return { score, ...map[score] };
};

/* ─── step config ─── */
const STEPS = [
  { id: 1, label: 'Personal',  icon: User,          short: 'Personal Info' },
  { id: 2, label: 'Contact',   icon: Phone,         short: 'Contact' },
  { id: 3, label: 'Account',   icon: Lock,          short: 'Account' },
  { id: 4, label: 'Medical',   icon: Heart,         short: 'Medical' },
  { id: 5, label: 'Emergency', icon: AlertTriangle, short: 'Emergency' },
  { id: 6, label: 'Consent',   icon: Shield,        short: 'Consent' },
];

const INIT = {
  firstName: '', middleName: '', lastName: '',
  dob: '', age: '', gender: '', civilStatus: '', nationality: '',
  mobile: '', email: '', street: '', city: '', province: '',
  username: '', password: '', confirmPassword: '',
  bloodType: '', allergies: '', conditions: '', medications: '',
  emergencyName: '', emergencyRelationship: '', emergencyContact: '',
  agreePrivacy: false, agreeStorage: false,
};

/* ══════════════════════════════════════════════════════════════
   ⚠️  ALL FIELD COMPONENTS ARE DEFINED OUTSIDE THE MAIN COMPONENT.
   This is the fix for the "need to re-click to type" bug.
   Defining components inside the parent causes React to unmount
   and remount the DOM input on every state update, losing focus.
   ══════════════════════════════════════════════════════════════ */

const labelStyle = {
  display: 'block',
  fontSize: '0.80rem',
  fontWeight: 700,
  color: '#475569',
  marginBottom: 6,
  letterSpacing: '0.03em',
};

const inputBase = (error) => ({
  width: '100%',
  padding: '12px 15px',
  border: `1.5px solid ${error ? '#FCA5A5' : '#E2E8F0'}`,
  borderRadius: 9,
  fontSize: '0.92rem',
  color: '#1E293B',
  background: error ? '#FFF5F5' : '#F8FAFC',
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  boxSizing: 'border-box',
});

function Field({ label, id, type = 'text', placeholder, value, onChange, error, required, hint, readOnly, extraStyle }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label htmlFor={id} style={labelStyle}>
        {label} {required && <span style={{ color: '#DC2626' }}>*</span>}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={readOnly}
        style={{ ...inputBase(error), ...(extraStyle || {}) }}
        onFocus={(e) => {
          if (!readOnly) {
            e.target.style.borderColor = '#2563EB';
            e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.10)';
            e.target.style.background = '#fff';
          }
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? '#FCA5A5' : '#E2E8F0';
          e.target.style.boxShadow = 'none';
          e.target.style.background = readOnly ? '#F1F5F9' : (error ? '#FFF5F5' : '#F8FAFC');
        }}
        autoComplete="off"
      />
      {hint && !error && <p style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: 4 }}>{hint}</p>}
      {error && <p style={{ fontSize: '0.72rem', color: '#DC2626', marginTop: 4 }}>⚠ {error}</p>}
    </div>
  );
}

function FieldSelect({ label, id, value, onChange, error, required, options, placeholder }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label htmlFor={id} style={labelStyle}>
        {label} {required && <span style={{ color: '#DC2626' }}>*</span>}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputBase(error), cursor: 'pointer', color: value ? '#1E293B' : '#94A3B8' }}
        onFocus={(e) => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.10)'; }}
        onBlur={(e)  => { e.target.style.borderColor = error ? '#FCA5A5' : '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
      >
        <option value="">{placeholder || 'Select…'}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      {error && <p style={{ fontSize: '0.72rem', color: '#DC2626', marginTop: 4 }}>⚠ {error}</p>}
    </div>
  );
}

function FieldTextarea({ label, id, value, onChange, placeholder, hint }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label htmlFor={id} style={labelStyle}>{label}</label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        style={{ ...inputBase(false), resize: 'vertical' }}
        onFocus={(e) => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.10)'; e.target.style.background = '#fff'; }}
        onBlur={(e)  => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F8FAFC'; }}
      />
      {hint && <p style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

function PasswordField({ label, id, value, onChange, error, show, onToggle }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label htmlFor={id} style={labelStyle}>
        {label} <span style={{ color: '#DC2626' }}>*</span>
      </label>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={id === 'password' ? 'Min. 8 characters' : 'Re-enter password'}
          autoComplete="new-password"
          style={{ ...inputBase(error), paddingRight: 44 }}
          onFocus={(e) => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.10)'; e.target.style.background = '#fff'; }}
          onBlur={(e)  => { e.target.style.borderColor = error ? '#FCA5A5' : '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = error ? '#FFF5F5' : '#F8FAFC'; }}
        />
        <button
          type="button"
          onClick={onToggle}
          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', padding: 0 }}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p style={{ fontSize: '0.72rem', color: '#DC2626', marginTop: 4 }}>⚠ {error}</p>}
    </div>
  );
}

const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr',     gap: '0 16px' };
const grid3 = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' };

/* ── Step panels (also outside main) ── */

function StepPersonal({ form, set, errors }) {
  return (
    <>
      <div style={grid3}>
        <Field label="First Name"  id="firstName"  value={form.firstName}  onChange={v => set('firstName', v)}  error={errors.firstName}  required placeholder="Juan" />
        <Field label="Middle Name" id="middleName" value={form.middleName} onChange={v => set('middleName', v)}           placeholder="Santos" />
        <Field label="Last Name"   id="lastName"   value={form.lastName}   onChange={v => set('lastName', v)}   error={errors.lastName}   required placeholder="dela Cruz" />
      </div>
      <div style={grid3}>
        <Field label="Date of Birth" id="dob" type="date" value={form.dob} onChange={v => set('dob', v)} error={errors.dob} required />
        <Field label="Age" id="age" value={form.age} readOnly hint="Auto-calculated"
          extraStyle={{ color: '#64748B', background: '#F1F5F9', cursor: 'default' }} />
        <FieldSelect label="Gender" id="gender" value={form.gender} onChange={v => set('gender', v)} error={errors.gender} required
          options={['Male', 'Female', 'Prefer not to say']} />
      </div>
      <div style={grid2}>
        <FieldSelect label="Civil Status" id="civilStatus" value={form.civilStatus} onChange={v => set('civilStatus', v)}
          options={['Single', 'Married', 'Widowed', 'Separated', 'Divorced']} placeholder="Select (optional)" />
        <Field label="Nationality" id="nationality" value={form.nationality} onChange={v => set('nationality', v)} placeholder="Filipino (optional)" />
      </div>
    </>
  );
}

function StepContact({ form, set, errors }) {
  return (
    <>
      <div style={grid2}>
        <Field label="Mobile Number" id="mobile" type="tel"   value={form.mobile} onChange={v => set('mobile', v)} error={errors.mobile} required placeholder="+63 912 345 6789" />
        <Field label="Email Address" id="email"  type="email" value={form.email}  onChange={v => set('email', v)}  error={errors.email}  required placeholder="juan@example.com" />
      </div>
      <p style={{ fontSize: '0.80rem', fontWeight: 700, color: '#2563EB', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>📍</span> Home Address
      </p>
      <Field label="Street / Barangay" id="street" value={form.street} onChange={v => set('street', v)} error={errors.street} required placeholder="123 Rizal St., Brgy. Santo Niño" />
      <div style={grid2}>
        <Field label="City / Municipality" id="city"     value={form.city}     onChange={v => set('city', v)}     error={errors.city}     required placeholder="Quezon City" />
        <Field label="Province / Region"   id="province" value={form.province} onChange={v => set('province', v)} error={errors.province} required placeholder="Metro Manila" />
      </div>
    </>
  );
}

function StepAccount({ form, set, errors, showPw, setShowPw, showCpw, setShowCpw }) {
  const pw    = pwStrength(form.password);
  const match = form.confirmPassword && form.confirmPassword === form.password;

  return (
    <>
      <Field label="Username" id="username" value={form.username} onChange={v => set('username', v)}
        error={errors.username} required placeholder="juan.delacruz"
        hint="This will be used to log in to your account." />

      <PasswordField label="Password" id="password"
        value={form.password} onChange={v => set('password', v)}
        error={errors.password} show={showPw} onToggle={() => setShowPw(p => !p)} />

      {form.password && (
        <div style={{ marginTop: -10, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: i <= pw.score ? pw.color : '#E2E8F0', transition: 'background 0.3s' }} />
            ))}
          </div>
          <p style={{ fontSize: '0.70rem', color: pw.color, fontWeight: 600 }}>{pw.label}</p>
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <PasswordField label="Confirm Password" id="confirmPassword"
          value={form.confirmPassword} onChange={v => set('confirmPassword', v)}
          error={errors.confirmPassword} show={showCpw} onToggle={() => setShowCpw(p => !p)} />
        {match && (
          <div style={{ position: 'absolute', right: 44, top: 34 }}>
            <Check size={15} color="#16A34A" />
          </div>
        )}
      </div>

      <div style={{ background: '#EFF6FF', border: '1.5px solid #DBEAFE', borderRadius: 10, padding: '14px 16px' }}>
        <p style={{ fontSize: '0.75rem', color: '#2563EB', fontWeight: 700, marginBottom: 8 }}>Password Requirements</p>
        {[
          { rule: 'At least 8 characters',       ok: form.password.length >= 8 },
          { rule: 'One uppercase letter (A–Z)',   ok: /[A-Z]/.test(form.password) },
          { rule: 'One number (0–9)',             ok: /[0-9]/.test(form.password) },
          { rule: 'One special character (!@#…)', ok: /[^A-Za-z0-9]/.test(form.password) },
        ].map(({ rule, ok }) => (
          <div key={rule} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <div style={{ width: 15, height: 15, borderRadius: '50%', background: ok ? '#16A34A' : '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}>
              {ok && <Check size={9} color="#fff" strokeWidth={3} />}
            </div>
            <span style={{ fontSize: '0.73rem', color: ok ? '#16A34A' : '#94A3B8' }}>{rule}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function StepMedical({ form, set }) {
  return (
    <>
      <div style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10 }}>
        <span style={{ fontSize: '1rem', flexShrink: 0 }}>ℹ️</span>
        <p style={{ fontSize: '0.78rem', color: '#92400E', lineHeight: 1.65 }}>
          All fields here are <strong>optional</strong>. Detailed medical history will be completed during your first consultation with the doctor.
        </p>
      </div>
      <div style={grid2}>
        <FieldSelect label="Blood Type" id="bloodType" value={form.bloodType} onChange={v => set('bloodType', v)}
          options={['A+','A−','B+','B−','AB+','AB−','O+','O−','Unknown']} placeholder="Select (optional)" />
        <div />
      </div>
      <FieldTextarea label="Known Allergies"             id="allergies"   value={form.allergies}   onChange={v => set('allergies', v)}   placeholder="e.g. Penicillin, Sulfa drugs, Shellfish…" hint="List any known drug or food allergies." />
      <FieldTextarea label="Existing Medical Conditions" id="conditions"  value={form.conditions}  onChange={v => set('conditions', v)}  placeholder="e.g. Hypertension, Diabetes, Asthma…"    hint="List any diagnosed conditions." />
      <FieldTextarea label="Current Medications"         id="medications" value={form.medications} onChange={v => set('medications', v)} placeholder="e.g. Metformin 500mg, Amlodipine 5mg…"   hint="List medications you are currently taking." />
    </>
  );
}

function StepEmergency({ form, set, errors }) {
  return (
    <>
      <div style={{ background: '#FFF5F5', border: '1.5px solid #FECACA', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10 }}>
        <span style={{ fontSize: '1rem', flexShrink: 0 }}>🚨</span>
        <p style={{ fontSize: '0.78rem', color: '#991B1B', lineHeight: 1.65 }}>
          Emergency contact will be reached if you are unable to make medical decisions for yourself.
        </p>
      </div>
      <Field label="Emergency Contact Full Name" id="emergencyName" value={form.emergencyName} onChange={v => set('emergencyName', v)} error={errors.emergencyName} required placeholder="Maria Santos" />
      <div style={grid2}>
        <FieldSelect label="Relationship" id="emergencyRelationship" value={form.emergencyRelationship} onChange={v => set('emergencyRelationship', v)} error={errors.emergencyRelationship} required
          options={['Parent','Spouse','Sibling','Child','Relative','Friend','Guardian','Other']} />
        <Field label="Contact Number" id="emergencyContact" type="tel" value={form.emergencyContact} onChange={v => set('emergencyContact', v)} error={errors.emergencyContact} required placeholder="+63 912 345 6789" />
      </div>
    </>
  );
}

function StepConsent({ form, set, errors }) {
  return (
    <>
      <div style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
        <p style={{ fontSize: '0.80rem', color: '#1E40AF', lineHeight: 1.80 }}>
          <strong>Data Privacy Notice:</strong> ClinicSys General Clinic collects your personal and medical information in compliance with the{' '}
          <em>Data Privacy Act of 2012 (R.A. 10173)</em>. Your data will only be used for clinic purposes and will not be shared with third parties without your consent.
        </p>
      </div>

      <div style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 14 }}>Registration Summary</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px' }}>
          {[
            ['Full Name',     `${form.firstName} ${form.middleName} ${form.lastName}`.replace(/\s+/g,' ').trim() || '—'],
            ['Date of Birth', form.dob      || '—'],
            ['Gender',        form.gender   || '—'],
            ['Mobile',        form.mobile   || '—'],
            ['Email',         form.email    || '—'],
            ['Username',      form.username || '—'],
          ].map(([k, v]) => (
            <div key={k}>
              <span style={{ fontSize: '0.68rem', color: '#94A3B8', display: 'block', marginBottom: 2 }}>{k}</span>
              <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#1E293B' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {[
        { key: 'agreePrivacy', label: <>I have read and agree to the <a href="#" style={{ color: '#2563EB', fontWeight: 700 }}>Privacy Policy</a> and <a href="#" style={{ color: '#2563EB', fontWeight: 700 }}>Terms & Conditions</a>.</> },
        { key: 'agreeStorage', label: 'I consent to ClinicSys storing and processing my personal and medical records for healthcare purposes.' },
      ].map(({ key, label }) => (
        <div key={key} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }} onClick={() => set(key, !form[key])}>
            <div style={{
              width: 20, height: 20, borderRadius: 5, flexShrink: 0, marginTop: 2,
              border: `2px solid ${errors[key] ? '#DC2626' : form[key] ? '#2563EB' : '#CBD5E1'}`,
              background: form[key] ? '#2563EB' : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}>
              {form[key] && <Check size={12} color="#fff" strokeWidth={3} />}
            </div>
            <span style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.65 }}>{label}</span>
          </div>
          {errors[key] && <p style={{ fontSize: '0.72rem', color: '#DC2626', marginTop: 5, marginLeft: 32 }}>⚠ {errors[key]}</p>}
        </div>
      ))}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function RegisterPage() {
  const [step,      setStep]      = useState(1);
  const [form,      setForm]      = useState(INIT);
  const [showPw,    setShowPw]    = useState(false);
  const [showCpw,   setShowCpw]   = useState(false);
  const [errors,    setErrors]    = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [animDir,   setAnimDir]   = useState('forward');
  const navigate = useNavigate();

  useEffect(() => {
    if (form.dob) setForm(f => ({ ...f, age: String(calcAge(f.dob)) }));
  }, [form.dob]);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (step === 1) {
      if (!form.firstName.trim()) e.firstName = 'First name is required';
      if (!form.lastName.trim())  e.lastName  = 'Last name is required';
      if (!form.dob)              e.dob       = 'Date of birth is required';
      if (!form.gender)           e.gender    = 'Gender is required';
    }
    if (step === 2) {
      if (!form.mobile.trim())   e.mobile   = 'Mobile number is required';
      if (!form.email.trim())    e.email    = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
      if (!form.street.trim())   e.street   = 'Street is required';
      if (!form.city.trim())     e.city     = 'City is required';
      if (!form.province.trim()) e.province = 'Province is required';
    }
    if (step === 3) {
      if (!form.username.trim())  e.username = 'Username is required';
      if (!form.password)         e.password = 'Password is required';
      else if (form.password.length < 8) e.password = 'Must be at least 8 characters';
      if (!form.confirmPassword)  e.confirmPassword = 'Please confirm your password';
      else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    }
    if (step === 5) {
      if (!form.emergencyName.trim())         e.emergencyName         = 'Name is required';
      if (!form.emergencyContact.trim())      e.emergencyContact      = 'Contact number is required';
      if (!form.emergencyRelationship.trim()) e.emergencyRelationship = 'Relationship is required';
    }
    if (step === 6) {
      if (!form.agreePrivacy) e.agreePrivacy = 'You must agree to the Privacy Policy';
      if (!form.agreeStorage) e.agreeStorage = 'You must consent to record storage';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (!validate()) return; setAnimDir('forward'); setStep(s => Math.min(s + 1, 6)); };
  const prev = () => { setAnimDir('back'); setErrors({}); setStep(s => Math.max(s - 1, 1)); };
  const handleSubmit = () => { if (!validate()) return; setSubmitted(true); };

  const STEP_TITLES = ['Personal Information','Contact Information','Account Credentials','Medical Information','Emergency Contact','Consent & Agreement'];
  const STEP_DESC   = [
    'Provide your basic personal details for patient records.',
    'We need this to send appointment confirmations and updates.',
    'Set up your login credentials to access the patient portal.',
    'Optional medical background to help our doctors serve you better.',
    'Someone we can contact in case of an emergency.',
    'Please review your information and agree to our terms.',
  ];

  /* Step content lookup — JSX evaluated here so field components stay stable */
  const stepContent = () => {
    switch (step) {
      case 1: return <StepPersonal  form={form} set={set} errors={errors} />;
      case 2: return <StepContact   form={form} set={set} errors={errors} />;
      case 3: return <StepAccount   form={form} set={set} errors={errors} showPw={showPw} setShowPw={setShowPw} showCpw={showCpw} setShowCpw={setShowCpw} />;
      case 4: return <StepMedical   form={form} set={set} />;
      case 5: return <StepEmergency form={form} set={set} errors={errors} />;
      case 6: return <StepConsent   form={form} set={set} errors={errors} />;
      default: return null;
    }
  };

  /* ── Success ── */
  if (submitted) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 50%, #E0F2FE 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');"}</style>
      <div style={{ background: '#fff', borderRadius: 20, padding: '56px 48px', textAlign: 'center', maxWidth: 440, width: '100%', boxShadow: '0 24px 64px rgba(37,99,235,0.14)' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #16A34A, #0D9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 8px 24px rgba(22,163,74,0.30)' }}>
          <Check size={36} color="#fff" strokeWidth={2.5} />
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1E293B', marginBottom: 10 }}>Registration Complete!</h2>
        <p style={{ color: '#64748B', fontSize: '0.88rem', lineHeight: 1.75, marginBottom: 28 }}>
          Welcome to ClinicSys, <strong>{form.firstName}</strong>! Your account has been created. You can now log in to book appointments.
        </p>
        <Link to="/login">
          <button style={{ width: '100%', padding: '13px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 10, fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            Go to Login
          </button>
        </Link>
      </div>
    </div>
  );

  /* ── Main ── */
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 50%, #E0F2FE 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '32px 16px 48px', fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        @media (max-width: 640px) { .step-label { display: none !important; } }
      `}</style>

      {/* Top bar */}
      <div style={{ width: '100%', maxWidth: 900, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', fontWeight: 600, color: '#475569', textDecoration: 'none', padding: '7px 14px 7px 10px', borderRadius: 8, border: '1.5px solid rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.60)', backdropFilter: 'blur(8px)', transition: 'all 0.18s' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#2563EB'; e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.background = 'rgba(255,255,255,0.90)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.7)'; e.currentTarget.style.background = 'rgba(255,255,255,0.60)'; }}
        >
          <ChevronLeft size={15} /> Back to Login
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Stethoscope size={15} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, color: '#1E293B', fontSize: '1rem' }}>ClinicSys</span>
        </div>
      </div>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: 900, background: '#fff', borderRadius: 20, boxShadow: '0 24px 64px rgba(37,99,235,0.12)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #2563EB, #1d4ed8)', padding: '28px 40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h1 style={{ color: '#fff', fontSize: '1.35rem', fontWeight: 800, marginBottom: 2 }}>Patient Registration</h1>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.83rem' }}>Step {step} of {STEPS.length} — {STEPS[step - 1].short}</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 99, padding: '4px 16px', fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>
              {Math.round((step / STEPS.length) * 100)}%
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            {STEPS.map((s, i) => {
              const done = step > s.id, current = step === s.id;
              const Icon = s.icon;
              return (
                <React.Fragment key={s.id}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: done ? '#16A34A' : current ? '#fff' : 'rgba(255,255,255,0.20)', border: current ? '2.5px solid #fff' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s', boxShadow: current ? '0 0 0 4px rgba(255,255,255,0.20)' : 'none' }}>
                      {done ? <Check size={17} color="#fff" strokeWidth={2.5} /> : <Icon size={16} color={current ? '#2563EB' : 'rgba(255,255,255,0.70)'} />}
                    </div>
                    <span className="step-label" style={{ fontSize: '0.68rem', color: current ? '#fff' : done ? '#86EFAC' : 'rgba(255,255,255,0.45)', fontWeight: current ? 700 : 500, marginTop: 5, whiteSpace: 'nowrap' }}>
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{ flex: 1, height: 2, background: step > s.id ? '#86EFAC' : 'rgba(255,255,255,0.20)', transition: 'background 0.4s', marginBottom: 20 }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '36px 40px 28px' }}>
          <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1.5px solid #F1F5F9' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1E293B', marginBottom: 5 }}>{STEP_TITLES[step - 1]}</h2>
            <p style={{ fontSize: '0.83rem', color: '#94A3B8' }}>{STEP_DESC[step - 1]}</p>
          </div>
          {/* key on wrapper animates the slide without unmounting field components */}
          <div key={`step-${step}`} style={{ animation: `stepIn 0.28s ease both` }}>
            <style>{`@keyframes stepIn { from { opacity:0; transform:translateX(${animDir === 'forward' ? '18px' : '-18px'}); } to { opacity:1; transform:translateX(0); } }`}</style>
            {stepContent()}
          </div>
        </div>

        {/* Footer nav */}
        <div style={{ padding: '20px 40px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1.5px solid #F1F5F9' }}>
          <button onClick={prev} disabled={step === 1}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 24px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#F8FAFC', fontSize: '0.90rem', fontWeight: 600, color: step === 1 ? '#CBD5E1' : '#475569', cursor: step === 1 ? 'default' : 'pointer', fontFamily: 'inherit', transition: 'all 0.18s' }}
            onMouseEnter={e => { if (step > 1) { e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.color = '#2563EB'; }}}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = step === 1 ? '#CBD5E1' : '#475569'; }}
          >
            <ChevronLeft size={16} /> Previous
          </button>

          <span style={{ fontSize: '0.78rem', color: '#CBD5E1', fontWeight: 500 }}>{step} / {STEPS.length}</span>

          {step < 6 ? (
            <button onClick={next}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 28px', borderRadius: 10, background: '#2563EB', border: 'none', color: '#fff', fontSize: '0.90rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s', boxShadow: '0 4px 14px rgba(37,99,235,0.28)' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#1d4ed8'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#2563EB'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={handleSubmit}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 28px', borderRadius: 10, background: 'linear-gradient(135deg, #16A34A, #0D9488)', border: 'none', color: '#fff', fontSize: '0.90rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s', boxShadow: '0 4px 14px rgba(22,163,74,0.28)' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(22,163,74,0.35)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(22,163,74,0.28)'; }}
            >
              <Check size={16} /> Submit Registration
            </button>
          )}
        </div>
      </div>

      <p style={{ marginTop: 20, fontSize: '0.80rem', color: '#64748B' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: '#2563EB', fontWeight: 700, textDecoration: 'none' }}>Sign In</Link>
      </p>
    </div>
  );
}