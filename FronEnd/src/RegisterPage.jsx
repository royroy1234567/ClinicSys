import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Stethoscope, ChevronLeft, ChevronRight, Check,
  Eye, EyeOff, AlertTriangle, Loader2, Mail, Shield,
  RefreshCw, X
} from 'lucide-react';

/* ─── Helpers ─── */
const calcAge = (dob) => {
  if (!dob) return '';
  const today = new Date(), birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const pwStrength = (pw) => {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8)           score++;
  if (/[A-Z]/.test(pw))         score++;
  if (/[0-9]/.test(pw))         score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { label: 'Weak',        color: '#EF4444' },
    { label: 'Fair',        color: '#F97316' },
    { label: 'Good',        color: '#EAB308' },
    { label: 'Strong',      color: '#22C55E' },
    { label: 'Very Strong', color: '#16A34A' },
  ];
  return { score, ...levels[score] };
};

const STEPS = [
  { id: 1, label: 'Credentials',   short: 'Credentials'   },
  { id: 2, label: 'Personal Info', short: 'Personal Info' },
  { id: 3, label: 'Medical Info',  short: 'Medical Info'  },
  { id: 4, label: 'Emergency',     short: 'Emergency'     },
  { id: 5, label: 'Consent',       short: 'Consent'       },
];

const INIT = {
  firstName: '', middleName: '', lastName: '',
  dob: '', age: '', gender: '', civilStatus: '', nationality: '',
  mobile: '', email: '',
  street: '', city: '', province: '',
  password: '', confirmPassword: '',
  bloodType: '', allergies: '', conditions: '', medications: '',
  emergencyName: '', emergencyRelationship: '', emergencyContact: '',
  agreePrivacy: false, agreeStorage: false,
};

/* ─── Styles ─── */
const font = "'DM Sans', 'Plus Jakarta Sans', sans-serif";

const labelStyle = {
  display: 'block', fontSize: '0.76rem', fontWeight: 700,
  color: '#374151', marginBottom: 6, letterSpacing: '0.02em',
  textTransform: 'uppercase',
};

const inputBase = (error) => ({
  width: '100%', padding: '11px 14px', borderRadius: 10,
  border: `1.5px solid ${error ? '#FCA5A5' : '#E5E7EB'}`,
  background: error ? '#FFF5F5' : '#F9FAFB',
  fontSize: '0.90rem', color: '#111827', outline: 'none',
  transition: 'all 0.18s', fontFamily: font,
});

const API_BASE = 'http://backend1.test';

const apiRegister = async (payload) => {
  const response = await fetch(`${API_BASE}/api/patients/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw { status: response.status, data };
  return data;
};

const apiCheckEmail = async (email) => {
  const response = await fetch(`${API_BASE}/api/patients/check-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await response.json();
  return data.exists;
};

/* ─── Reusable field components ─── */
function Field({ label, id, type = 'text', placeholder, value, onChange, error, required, hint, readOnly, extraStyle }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label htmlFor={id} style={labelStyle}>
        {label} {required && <span style={{ color: '#DC2626' }}>*</span>}
      </label>
      <input
        id={id} type={type} placeholder={placeholder} value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={readOnly}
        style={{ ...inputBase(error), ...(extraStyle || {}) }}
        onFocus={(e) => { if (!readOnly) { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; e.target.style.background = '#fff'; } }}
        onBlur={(e) => { e.target.style.borderColor = error ? '#FCA5A5' : '#E5E7EB'; e.target.style.boxShadow = 'none'; e.target.style.background = readOnly ? '#F3F4F6' : (error ? '#FFF5F5' : '#F9FAFB'); }}
        autoComplete="off"
      />
      {hint && !error && <p style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: 4 }}>{hint}</p>}
      {error && <p style={{ fontSize: '0.72rem', color: '#DC2626', marginTop: 4 }}>⚠ {error}</p>}
    </div>
  );
}

function FieldSelect({ label, id, value, onChange, error, required, options, placeholder }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label htmlFor={id} style={labelStyle}>{label} {required && <span style={{ color: '#DC2626' }}>*</span>}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}
        style={{ ...inputBase(error), cursor: 'pointer', color: value ? '#111827' : '#9CA3AF' }}
        onFocus={(e) => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
        onBlur={(e) => { e.target.style.borderColor = error ? '#FCA5A5' : '#E5E7EB'; e.target.style.boxShadow = 'none'; }}>
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
      <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} rows={3}
        style={{ ...inputBase(false), resize: 'vertical' }}
        onFocus={(e) => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; e.target.style.background = '#fff'; }}
        onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F9FAFB'; }} />
      {hint && <p style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

function PasswordField({ label, id, value, onChange, error, show, onToggle }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label htmlFor={id} style={labelStyle}>{label} <span style={{ color: '#DC2626' }}>*</span></label>
      <div style={{ position: 'relative' }}>
        <input id={id} type={show ? 'text' : 'password'} value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={id === 'password' ? 'Min. 8 characters' : 'Re-enter password'}
          autoComplete="new-password"
          style={{ ...inputBase(error), paddingRight: 44 }}
          onFocus={(e) => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; e.target.style.background = '#fff'; }}
          onBlur={(e) => { e.target.style.borderColor = error ? '#FCA5A5' : '#E5E7EB'; e.target.style.boxShadow = 'none'; e.target.style.background = error ? '#FFF5F5' : '#F9FAFB'; }} />
        <button type="button" onClick={onToggle}
          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex', padding: 0 }}>
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p style={{ fontSize: '0.72rem', color: '#DC2626', marginTop: 4 }}>⚠ {error}</p>}
    </div>
  );
}

const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' };
const grid3 = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' };

/* ─── Email Verification Modal ─── */
function EmailVerificationModal({ email, onVerified, onClose }) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [sent, setSent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [verified, setVerified] = useState(false);
  const inputs = useRef([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setResendTimer(t => {
        if (t <= 1) { clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sent]);

  const handleInput = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...code];
    next[i] = val;
    setCode(next);
    setError('');
    if (val && i < 5) inputs.current[i + 1]?.focus();
    if (!val && i > 0) inputs.current[i - 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(''));
      inputs.current[5]?.focus();
    }
  };

  const handleVerify = () => {
    const full = code.join('');
    if (full.length < 6) { setError('Please enter the complete 6-digit code.'); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setVerified(true);
      setTimeout(() => onVerified(), 1200);
    }, 1000);
  };

  const handleResend = () => {
    setCode(['', '', '', '', '', '']);
    setError('');
    setSent(s => !s);
    setResendTimer(30);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, fontFamily: font,
      animation: 'fadeIn 0.2s ease',
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse-ring { 0%,100% { transform: scale(1); opacity:1 } 50% { transform: scale(1.12); opacity:0.7 } }
        @keyframes checkPop { 0% { transform: scale(0) } 80% { transform: scale(1.2) } 100% { transform: scale(1) } }
      `}</style>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '40px 36px',
        maxWidth: 440, width: '100%', position: 'relative',
        boxShadow: '0 32px 80px rgba(0,0,0,0.22)',
        animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: '#F3F4F6', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6B7280' }}>
          <X size={16} />
        </button>

        {verified ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #16A34A, #0D9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', animation: 'checkPop 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
              <Check size={34} color="#fff" strokeWidth={2.5} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginBottom: 8 }}>Email Verified!</h3>
            <p style={{ color: '#6B7280', fontSize: '0.88rem' }}>Continuing to next step…</p>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', animation: 'pulse-ring 2s ease-in-out infinite' }}>
                <Mail size={28} color="#2563EB" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginBottom: 8 }}>Verify your email</h3>
              <p style={{ color: '#6B7280', fontSize: '0.87rem', lineHeight: 1.65 }}>
                We sent a 6-digit code to<br />
                <strong style={{ color: '#111827' }}>{email}</strong>
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20 }} onPaste={handlePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={el => inputs.current[i] = el}
                  type="text" inputMode="numeric" maxLength={1}
                  value={digit}
                  onChange={e => handleInput(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  style={{
                    width: 52, height: 60, textAlign: 'center',
                    fontSize: '1.5rem', fontWeight: 700, color: '#111827',
                    border: `2px solid ${error ? '#FCA5A5' : digit ? '#2563EB' : '#E5E7EB'}`,
                    borderRadius: 12, background: digit ? '#EFF6FF' : '#F9FAFB',
                    outline: 'none', fontFamily: font, transition: 'all 0.15s',
                    cursor: 'text',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                  onBlur={e => { e.target.style.borderColor = error ? '#FCA5A5' : digit ? '#2563EB' : '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
                />
              ))}
            </div>

            {error && (
              <p style={{ textAlign: 'center', fontSize: '0.78rem', color: '#DC2626', marginBottom: 12 }}>⚠ {error}</p>
            )}

            <button onClick={handleVerify} disabled={loading}
              style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: loading ? '#9CA3AF' : 'linear-gradient(135deg, #2563EB, #1d4ed8)', color: '#fff', fontSize: '0.95rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: font, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16, boxShadow: '0 4px 16px rgba(99,102,241,0.30)' }}>
              {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Verifying…</> : <><Shield size={16} /> Verify Email</>}
            </button>

            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.82rem', color: '#9CA3AF', marginBottom: 4 }}>Didn't receive the code?</p>
              {resendTimer > 0 ? (
                <p style={{ fontSize: '0.82rem', color: '#6B7280' }}>Resend in <strong style={{ color: '#2563EB' }}>{resendTimer}s</strong></p>
              ) : (
                <button onClick={handleResend} style={{ background: 'none', border: 'none', fontSize: '0.82rem', color: '#2563EB', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: font }}>
                  <RefreshCw size={13} /> Resend Code
                </button>
              )}
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

/* ─── Step 1: Credentials + Email + Google ─── */
function StepAccount({ form, set, errors, showPw, setShowPw, showCpw, setShowCpw, emailVerified }) {
  const pw    = pwStrength(form.password);
  const match = form.confirmPassword && form.confirmPassword === form.password;

  const [emailTaken,    setEmailTaken]    = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Real-time email availability check with debounce
  useEffect(() => {
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) {
      setEmailTaken(false);
      setCheckingEmail(false);
      return;
    }
    setCheckingEmail(true);
    const timer = setTimeout(async () => {
      try {
        const exists = await apiCheckEmail(form.email);
        setEmailTaken(exists);
      } catch (_) {
        setEmailTaken(false);
      }
      setCheckingEmail(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [form.email]);

  return (
    <>
      {/* Email */}
      <div style={{ marginBottom: 16 }}>
        <label htmlFor="email" style={labelStyle}>
          Email Address <span style={{ color: '#DC2626' }}>*</span>
        </label>
        <div style={{ position: 'relative' }}>
          <input
            id="email" type="email" placeholder="juan@example.com"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            style={{
              ...inputBase(errors.email || emailTaken),
              paddingRight: 40,
            }}
            onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; e.target.style.background = '#fff'; }}
            onBlur={e => { e.target.style.borderColor = (errors.email || emailTaken) ? '#FCA5A5' : '#E5E7EB'; e.target.style.boxShadow = 'none'; e.target.style.background = (errors.email || emailTaken) ? '#FFF5F5' : '#F9FAFB'; }}
            autoComplete="off"
          />
          {/* Status icon inside input */}
          <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
            {checkingEmail && <Loader2 size={15} color="#9CA3AF" style={{ animation: 'spin 1s linear infinite' }} />}
            {!checkingEmail && emailTaken && <X size={15} color="#DC2626" />}
            {!checkingEmail && !emailTaken && form.email && /\S+@\S+\.\S+/.test(form.email) && (
              <Check size={15} color="#16A34A" />
            )}
          </div>
        </div>

        {/* Status messages */}
        {checkingEmail && (
          <p style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: 4 }}>Checking availability…</p>
        )}
        {!checkingEmail && emailTaken && (
          <p style={{ fontSize: '0.72rem', color: '#DC2626', marginTop: 4 }}>
            ⚠ This email is already registered.{' '}
            <Link to="/login" style={{ color: '#2563EB', fontWeight: 700 }}>Sign in instead?</Link>
          </p>
        )}
        {!checkingEmail && !emailTaken && !errors.email && form.email && /\S+@\S+\.\S+/.test(form.email) && (
          <p style={{ fontSize: '0.72rem', color: '#16A34A', marginTop: 4 }}>✓ Email is available</p>
        )}
        {errors.email && !emailTaken && (
          <p style={{ fontSize: '0.72rem', color: '#DC2626', marginTop: 4 }}>⚠ {errors.email}</p>
        )}
        {!emailTaken && !errors.email && !(form.email && /\S+@\S+\.\S+/.test(form.email)) && (
          <p style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: 4 }}>A 6-digit verification code will be sent here.</p>
        )}
      </div>

      {/* Password fields */}
      <div style={{ borderTop: '1.5px solid #F3F4F6', paddingTop: 10 }}>
        <PasswordField label="Password" id="password" value={form.password} onChange={v => set('password', v)} error={errors.password} show={showPw} onToggle={() => setShowPw(p => !p)} />
        {form.password && (
          <div style={{ marginTop: -10, marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: i <= pw.score ? pw.color : '#E5E7EB', transition: 'background 0.3s' }} />
              ))}
            </div>
            <p style={{ fontSize: '0.70rem', color: pw.color, fontWeight: 600 }}>{pw.label}</p>
          </div>
        )}
        <div style={{ position: 'relative' }}>
          <PasswordField label="Confirm Password" id="confirmPassword" value={form.confirmPassword} onChange={v => set('confirmPassword', v)} error={errors.confirmPassword} show={showCpw} onToggle={() => setShowCpw(p => !p)} />
          {match && <div style={{ position: 'absolute', right: 44, top: 34 }}><Check size={15} color="#16A34A" /></div>}
        </div>
        <div style={{ background: '#EFF6FF', border: '1.5px solid #DBEAFE', borderRadius: 10, padding: '14px 16px', marginBottom: 24 }}>
          <p style={{ fontSize: '0.75rem', color: '#1d4ed8', fontWeight: 700, marginBottom: 8 }}>Password Requirements</p>
          {[
            { rule: 'At least 8 characters',        ok: form.password.length >= 8 },
            { rule: 'One uppercase letter (A–Z)',    ok: /[A-Z]/.test(form.password) },
            { rule: 'One number (0–9)',              ok: /[0-9]/.test(form.password) },
            { rule: 'One special character (!@#…)',  ok: /[^A-Za-z0-9]/.test(form.password) },
          ].map(({ rule, ok }) => (
            <div key={rule} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <div style={{ width: 15, height: 15, borderRadius: '50%', background: ok ? '#16A34A' : '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}>
                {ok && <Check size={9} color="#fff" strokeWidth={3} />}
              </div>
              <span style={{ fontSize: '0.73rem', color: ok ? '#16A34A' : '#9CA3AF' }}>{rule}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Continue with Google */}
      <div style={{ borderTop: '1.5px solid #F3F4F6', paddingTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
          <span style={{ fontSize: '0.78rem', color: '#9CA3AF', fontWeight: 600 }}>or sign up with</span>
          <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
        </div>
        <a
          href="https://miguelina-predesirous-nonproblematically.ngrok-free.dev/api/auth/google"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '12px 20px', borderRadius: 12, border: '1.5px solid #E5E7EB', background: '#fff', fontSize: '0.92rem', fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: font, transition: 'all 0.18s', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', textDecoration: 'none' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          Continue with Google
        </a>
      </div>
    </>
  );
}

/* ─── Step 2: Personal Info ─── */
function StepPersonal({ form, set, errors }) {
  return (
    <>
      <div style={{ marginBottom: 8 }}>
        <p style={{ fontSize: '0.76rem', fontWeight: 700, color: '#2563EB', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          <span>👤</span> Personal Details
        </p>
        <div style={grid3}>
          <Field label="First Name" id="firstName" value={form.firstName} onChange={v => set('firstName', v)} error={errors.firstName} required placeholder="Juan" />
          <Field label="Middle Name" id="middleName" value={form.middleName} onChange={v => set('middleName', v)} placeholder="Santos" />
          <Field label="Last Name" id="lastName" value={form.lastName} onChange={v => set('lastName', v)} error={errors.lastName} required placeholder="dela Cruz" />
        </div>
        <div style={grid3}>
          <Field label="Date of Birth" id="dob" type="date" value={form.dob} onChange={v => set('dob', v)} error={errors.dob} required />
          <Field label="Age" id="age" value={form.age} readOnly hint="Auto-calculated" extraStyle={{ color: '#6B7280', background: '#F3F4F6', cursor: 'default' }} />
          <FieldSelect label="Gender" id="gender" value={form.gender} onChange={v => set('gender', v)} error={errors.gender} required options={['Male', 'Female', 'Prefer not to say']} />
        </div>
        <div style={grid2}>
          <FieldSelect label="Civil Status" id="civilStatus" value={form.civilStatus} onChange={v => set('civilStatus', v)} options={['Single', 'Married', 'Widowed', 'Separated', 'Divorced']} placeholder="Select (optional)" />
          <Field label="Nationality" id="nationality" value={form.nationality} onChange={v => set('nationality', v)} placeholder="Filipino (optional)" />
        </div>
      </div>

      <div style={{ borderTop: '1.5px solid #F3F4F6', paddingTop: 18 }}>
        <p style={{ fontSize: '0.76rem', fontWeight: 700, color: '#2563EB', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          <span>📍</span> Contact & Address
        </p>
        <Field label="Mobile Number" id="mobile" type="tel" value={form.mobile} onChange={v => set('mobile', v)} error={errors.mobile} required placeholder="+63 912 345 6789" />
        <Field label="Street / Barangay" id="street" value={form.street} onChange={v => set('street', v)} error={errors.street} required placeholder="123 Rizal St., Brgy. Santo Nino" />
        <div style={grid2}>
          <Field label="City / Municipality" id="city" value={form.city} onChange={v => set('city', v)} error={errors.city} required placeholder="Quezon City" />
          <Field label="Province / Region" id="province" value={form.province} onChange={v => set('province', v)} error={errors.province} required placeholder="Metro Manila" />
        </div>
      </div>
    </>
  );
}

/* ─── Step 3: Medical ─── */
function StepMedical({ form, set }) {
  return (
    <>
      <div style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10 }}>
        <span style={{ fontSize: '1rem', flexShrink: 0 }}>ℹ️</span>
        <p style={{ fontSize: '0.78rem', color: '#92400E', lineHeight: 1.65 }}>
          All fields here are <strong>optional</strong>. Detailed medical history will be completed during your first consultation.
        </p>
      </div>
      <div style={grid2}>
        <FieldSelect label="Blood Type" id="bloodType" value={form.bloodType} onChange={v => set('bloodType', v)}
          options={['A+','A−','B+','B−','AB+','AB−','O+','O−','Unknown']} placeholder="Select (optional)" />
        <div />
      </div>
      <FieldTextarea label="Known Allergies" id="allergies" value={form.allergies} onChange={v => set('allergies', v)} placeholder="e.g. Penicillin, Sulfa drugs, Shellfish…" hint="List any known drug or food allergies." />
      <FieldTextarea label="Existing Medical Conditions" id="conditions" value={form.conditions} onChange={v => set('conditions', v)} placeholder="e.g. Hypertension, Diabetes, Asthma…" hint="List any diagnosed conditions." />
      <FieldTextarea label="Current Medications" id="medications" value={form.medications} onChange={v => set('medications', v)} placeholder="e.g. Metformin 500mg, Amlodipine 5mg…" hint="List medications you are currently taking." />
    </>
  );
}

/* ─── Step 4: Emergency ─── */
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

/* ─── Step 5: Consent ─── */
function StepConsent({ form, set, errors }) {
  return (
    <>
      <div style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
        <p style={{ fontSize: '0.80rem', color: '#1E40AF', lineHeight: 1.80 }}>
          <strong>Data Privacy Notice:</strong> ClinicSys General Clinic collects your personal and medical information in compliance with the{' '}
          <em>Data Privacy Act of 2012 (R.A. 10173)</em>. Your data will only be used for clinic purposes and will not be shared without your consent.
        </p>
      </div>
      <div style={{ background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 14 }}>Registration Summary</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px' }}>
          {[
            ['Full Name',     `${form.firstName} ${form.middleName} ${form.lastName}`.replace(/\s+/g,' ').trim() || '—'],
            ['Date of Birth', form.dob      || '—'],
            ['Gender',        form.gender   || '—'],
            ['Mobile',        form.mobile   || '—'],
            ['Email',         form.email    || '—'],
          ].map(([k, v]) => (
            <div key={k}>
              <span style={{ fontSize: '0.68rem', color: '#9CA3AF', display: 'block', marginBottom: 2 }}>{k}</span>
              <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#111827' }}>{v}</span>
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
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
            }}>
              {form[key] && <Check size={12} color="#fff" strokeWidth={3} />}
            </div>
            <span style={{ fontSize: '0.84rem', color: '#4B5563', lineHeight: 1.65 }}>{label}</span>
          </div>
          {errors[key] && <p style={{ fontSize: '0.72rem', color: '#DC2626', marginTop: 5, marginLeft: 32 }}>⚠ {errors[key]}</p>}
        </div>
      ))}
    </>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
export default function RegisterPage() {
  const [step,          setStep]          = useState(1);
  const [form,          setForm]          = useState(INIT);
  const [showPw,        setShowPw]        = useState(false);
  const [showCpw,       setShowCpw]       = useState(false);
  const [errors,        setErrors]        = useState({});
  const [submitted,     setSubmitted]     = useState(false);
  const [animDir,       setAnimDir]       = useState('forward');
  const [loading,       setLoading]       = useState(false);
  const [apiError,      setApiError]      = useState('');
  const [showVerify,    setShowVerify]    = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailTaken,    setEmailTaken]    = useState(false);
  const navigate = useNavigate();

  /* ── Detect Google redirect on mount ── */
  useEffect(() => {
    const params    = new URLSearchParams(window.location.search);
    const googleRaw = params.get('google');
    const error     = params.get('error');

    if (error === 'google_failed') {
      setApiError('Google sign-in failed. Please try again.');
      window.history.replaceState({}, '', '/register');
    }

    if (error === 'email_taken') {
      const takenEmail = params.get('email') || '';
      setForm(f => ({ ...f, email: takenEmail }));
      setApiError(
        `The Google account (${takenEmail}) is already registered. Please sign in instead.`
      );
      window.history.replaceState({}, '', '/register');
    }

    if (googleRaw) {
      try {
        const googleData = JSON.parse(decodeURIComponent(googleRaw));
        setForm(f => ({ ...f, email: googleData.email || '' }));
        setEmailVerified(true); // Skip OTP — Google already verified the email
        window.history.replaceState({}, '', '/register');
      } catch (_) {}
    }
  }, []);

  useEffect(() => {
    if (form.dob) setForm(f => ({ ...f, age: String(calcAge(f.dob)) }));
  }, [form.dob]);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: '' }));
    setApiError('');
    if (k === 'email') setEmailVerified(false);
  };

  const validate = () => {
    const e = {};
    if (step === 1) {
      if (!form.email.trim())     e.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
      else if (emailTaken)        e.email = 'This email is already registered';

      if (!form.password)              e.password = 'Password is required';
      else if (form.password.length < 8) e.password = 'Must be at least 8 characters';
      if (!form.confirmPassword)       e.confirmPassword = 'Please confirm your password';
      else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    }
    if (step === 2) {
      if (!form.firstName.trim()) e.firstName = 'First name is required';
      if (!form.lastName.trim())  e.lastName  = 'Last name is required';
      if (!form.dob)              e.dob       = 'Date of birth is required';
      if (!form.gender)           e.gender    = 'Gender is required';
      if (!form.mobile.trim())    e.mobile    = 'Mobile number is required';
      if (!form.street.trim())    e.street    = 'Street is required';
      if (!form.city.trim())      e.city      = 'City is required';
      if (!form.province.trim())  e.province  = 'Province is required';
    }
    if (step === 4) {
      if (!form.emergencyName.trim())         e.emergencyName         = 'Name is required';
      if (!form.emergencyContact.trim())      e.emergencyContact      = 'Contact number is required';
      if (!form.emergencyRelationship.trim()) e.emergencyRelationship = 'Relationship is required';
    }
    if (step === 5) {
      if (!form.agreePrivacy) e.agreePrivacy = 'You must agree to the Privacy Policy';
      if (!form.agreeStorage) e.agreeStorage = 'You must consent to record storage';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const mapLaravelErrors = (laravelErrors) => {
    const map = {
      first_name: 'firstName', middle_name: 'middleName', last_name: 'lastName',
      dob: 'dob', age: 'age', gender: 'gender', civil_status: 'civilStatus',
      nationality: 'nationality', mobile: 'mobile', email: 'email',
      street: 'street', city: 'city', province: 'province',
      password: 'password', blood_type: 'bloodType',
      allergies: 'allergies', conditions: 'conditions', medications: 'medications',
      emergency_name: 'emergencyName', emergency_relationship: 'emergencyRelationship',
      emergency_contact: 'emergencyContact', agree_privacy: 'agreePrivacy', agree_storage: 'agreeStorage',
    };
    const mapped = {};
    Object.entries(laravelErrors).forEach(([key, msgs]) => {
      const fieldKey = map[key] || key;
      mapped[fieldKey] = Array.isArray(msgs) ? msgs[0] : msgs;
    });
    return mapped;
  };

  const next = () => {
    if (!validate()) return;
    if (step === 1 && !emailVerified) {
      setShowVerify(true);
      return;
    }
    setAnimDir('forward');
    setStep(s => Math.min(s + 1, STEPS.length));
  };

  const prev = () => { setAnimDir('back'); setErrors({}); setApiError(''); setStep(s => Math.max(s - 1, 1)); };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setApiError('');

    const payload = {
      first_name:             form.firstName,
      middle_name:            form.middleName  || null,
      last_name:              form.lastName,
      dob:                    form.dob,
      age:                    parseInt(form.age) || 0,
      gender:                 form.gender,
      civil_status:           form.civilStatus  || null,
      nationality:            form.nationality  || null,
      mobile:                 form.mobile,
      email:                  form.email,
      google_id:              null,
      street:                 form.street,
      city:                   form.city,
      province:               form.province,
      password:               form.password,
      password_confirmation:  form.confirmPassword,
      blood_type:             form.bloodType    || null,
      allergies:              form.allergies    || null,
      conditions:             form.conditions   || null,
      medications:            form.medications  || null,
      emergency_name:         form.emergencyName,
      emergency_relationship: form.emergencyRelationship,
      emergency_contact:      form.emergencyContact,
      agree_privacy:          form.agreePrivacy,
      agree_storage:          form.agreeStorage,
    };

    try {
      const data = await apiRegister(payload);
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user || {}));
      }
      setSubmitted(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      if (err.status === 422 && err.data?.errors) {
        const mapped = mapLaravelErrors(err.data.errors);
        setErrors(mapped);
        const stepFields = [
          ['email','password','confirmPassword'],
          ['firstName','lastName','dob','gender','civilStatus','nationality','mobile','street','city','province'],
          ['bloodType','allergies','conditions','medications'],
          ['emergencyName','emergencyRelationship','emergencyContact'],
          ['agreePrivacy','agreeStorage'],
        ];
        const errorKeys = Object.keys(mapped);
        for (let i = 0; i < stepFields.length; i++) {
          if (stepFields[i].some(f => errorKeys.includes(f))) { setStep(i + 1); break; }
        }
      } else if (err.status === 409) {
        setApiError(err.data?.message || 'An account with this email already exists.');
      } else {
        setApiError(err.data?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const STEP_TITLES = ['Account Credentials', 'Personal Information', 'Medical Information', 'Emergency Contact', 'Consent & Agreement'];
  const STEP_DESC   = [
    'Set up your email, login credentials, or sign in with Google.',
    'Provide your personal details, contact info, and address.',
    'Optional medical background to help our doctors serve you better.',
    'Someone we can contact in case of an emergency.',
    'Please review your information and agree to our terms.',
  ];
  const STEP_ICONS = ['🔐', '👤', '🩺', '🚨', '📋'];

  const stepContent = () => {
    switch (step) {
      case 1: return <StepAccount form={form} set={set} errors={errors} showPw={showPw} setShowPw={setShowPw} showCpw={showCpw} setShowCpw={setShowCpw} emailVerified={emailVerified} />;
      case 2: return <StepPersonal  form={form} set={set} errors={errors} />;
      case 3: return <StepMedical   form={form} set={set} />;
      case 4: return <StepEmergency form={form} set={set} errors={errors} />;
      case 5: return <StepConsent   form={form} set={set} errors={errors} />;
      default: return null;
    }
  };

  /* ── Success screen ── */
  if (submitted) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 50%, #F0FDF4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: font }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');`}</style>
      <div style={{ background: '#fff', borderRadius: 20, padding: '56px 48px', textAlign: 'center', maxWidth: 440, width: '100%', boxShadow: '0 24px 64px rgba(99,102,241,0.16)' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #16A34A, #0D9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 8px 24px rgba(22,163,74,0.30)' }}>
          <Check size={36} color="#fff" strokeWidth={2.5} />
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111827', marginBottom: 10 }}>Registration Complete!</h2>
        <p style={{ color: '#6B7280', fontSize: '0.88rem', lineHeight: 1.75, marginBottom: 8 }}>
          Welcome to ClinicSys, <strong>{form.firstName}</strong>! Your account has been created.
        </p>
        <p style={{ color: '#9CA3AF', fontSize: '0.80rem', marginBottom: 28 }}>Redirecting to login in 3 seconds…</p>
        <Link to="/login">
          <button style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, #2563EB, #1d4ed8)', color: '#fff', border: 'none', borderRadius: 10, fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', fontFamily: font }}>
            Go to Login Now
          </button>
        </Link>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 50%, #F5F3FF 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '32px 16px 48px', fontFamily: font }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @media (max-width: 640px) { .step-label { display: none !important; } }
        @keyframes stepIn { from { opacity:0; transform:translateX(var(--dir,18px)); } to { opacity:1; transform:translateX(0); } }
        @keyframes spin { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }
      `}</style>

      {/* Top bar */}
      <div style={{ width: '100%', maxWidth: 960, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', fontWeight: 600, color: '#4B5563', textDecoration: 'none', padding: '7px 14px 7px 10px', borderRadius: 8, border: '1.5px solid rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.60)', backdropFilter: 'blur(8px)' }}>
          <ChevronLeft size={15} /> Back to Login
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #2563EB, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Stethoscope size={15} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, color: '#111827', fontSize: '1rem' }}>ClinicSys</span>
        </div>
      </div>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: 960, background: '#fff', borderRadius: 20, boxShadow: '0 24px 64px rgba(99,102,241,0.13)', overflow: 'hidden' }}>

        {/* Header / stepper */}
        <div style={{ background: 'linear-gradient(135deg, #2563EB, #1d4ed8, #1e40af)', padding: '28px 40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h1 style={{ color: '#fff', fontSize: '1.35rem', fontWeight: 800, marginBottom: 2 }}>Patient Registration</h1>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.83rem' }}>Step {step} of {STEPS.length} — {STEPS[step - 1].short}</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 99, padding: '4px 16px', fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>
              {Math.round((step / STEPS.length) * 100)}%
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {STEPS.map((s, i) => {
              const done = step > s.id, current = step === s.id;
              return (
                <React.Fragment key={s.id}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: done ? '#16A34A' : current ? '#fff' : 'rgba(255,255,255,0.20)', border: current ? '2.5px solid #fff' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s', boxShadow: current ? '0 0 0 4px rgba(255,255,255,0.20)' : 'none' }}>
                      {done ? <Check size={17} color="#fff" strokeWidth={2.5} /> : <span style={{ fontSize: '1.1rem' }}>{STEP_ICONS[i]}</span>}
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
          <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1.5px solid #F3F4F6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
              <span style={{ fontSize: '1.3rem' }}>{STEP_ICONS[step - 1]}</span>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#111827' }}>{STEP_TITLES[step - 1]}</h2>
              {step === 1 && emailVerified && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 99, padding: '3px 10px', fontSize: '0.72rem', color: '#16A34A', fontWeight: 700 }}>
                  <Check size={11} /> Email Verified
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.83rem', color: '#9CA3AF' }}>{STEP_DESC[step - 1]}</p>
          </div>

          {apiError && (
            <div style={{ background: '#FFF5F5', border: '1.5px solid #FECACA', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <AlertTriangle size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: '0.82rem', color: '#DC2626', lineHeight: 1.5 }}>{apiError}</p>
            </div>
          )}

          <div key={`step-${step}`} style={{ '--dir': animDir === 'forward' ? '18px' : '-18px', animation: 'stepIn 0.28s ease both' }}>
            {stepContent()}
          </div>
        </div>

        {/* Footer nav */}
        <div style={{ padding: '20px 40px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1.5px solid #F3F4F6' }}>
          <button onClick={prev} disabled={step === 1 || loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 24px', borderRadius: 10, border: '1.5px solid #E5E7EB', background: '#F9FAFB', fontSize: '0.90rem', fontWeight: 600, color: step === 1 ? '#D1D5DB' : '#4B5563', cursor: step === 1 ? 'default' : 'pointer', fontFamily: font }}>
            <ChevronLeft size={16} /> Previous
          </button>

          <span style={{ fontSize: '0.78rem', color: '#D1D5DB', fontWeight: 500 }}>{step} / {STEPS.length}</span>

          {step < STEPS.length ? (
            <button onClick={next} disabled={loading || (step === 1 && emailTaken)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 28px', borderRadius: 10, background: (step === 1 && emailTaken) ? '#E5E7EB' : 'linear-gradient(135deg, #2563EB, #1d4ed8)', border: 'none', color: (step === 1 && emailTaken) ? '#9CA3AF' : '#fff', fontSize: '0.90rem', fontWeight: 700, cursor: (step === 1 && emailTaken) ? 'not-allowed' : 'pointer', fontFamily: font, boxShadow: (step === 1 && emailTaken) ? 'none' : '0 4px 14px rgba(99,102,241,0.30)' }}>
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 28px', borderRadius: 10, background: loading ? '#6B7280' : 'linear-gradient(135deg, #16A34A, #0D9488)', border: 'none', color: '#fff', fontSize: '0.90rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: font, boxShadow: '0 4px 14px rgba(22,163,74,0.28)' }}>
              {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Submitting…</> : <><Check size={16} /> Submit Registration</>}
            </button>
          )}
        </div>
      </div>

      <p style={{ marginTop: 20, fontSize: '0.80rem', color: '#6B7280' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: '#2563EB', fontWeight: 700, textDecoration: 'none' }}>Sign In</Link>
      </p>

      {/* Email Verification Modal */}
      {showVerify && (
        <EmailVerificationModal
          email={form.email}
          onVerified={() => {
            setEmailVerified(true);
            setShowVerify(false);
            setAnimDir('forward');
            setStep(s => Math.min(s + 1, STEPS.length));
          }}
          onClose={() => setShowVerify(false)}
        />
      )}
    </div>
  );
}