import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Stethoscope, Mail, ShieldCheck, KeyRound, ArrowLeft } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://backend1.test/api';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const canVerifyOtp = useMemo(() => otpCode.trim().length === 6, [otpCode]);
  const canReset = useMemo(
    () => password.length >= 8 && password === passwordConfirmation,
    [password, passwordConfirmation]
  );

  const sendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to send OTP.');
      setOtpToken(data.otp_token || '');
      setStep(2);
      setMessage('OTP sent. Check your email.');
    } catch (err) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          otp_token: otpToken,
          code: otpCode.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Invalid OTP.');
      setResetToken(data.reset_token || '');
      setStep(3);
      setMessage('OTP verified. Set your new password.');
    } catch (err) {
      setError(err.message || 'Failed to verify OTP.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          reset_token: resetToken,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to reset password.');
      setMessage('Password updated successfully. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1000);
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 50%, #E0F2FE 100%)', padding: 16, display: 'grid', placeItems: 'center' }}>
      <style>{`
        .fp-wrap { width: 100%; max-width: 920px; border-radius: 22px; overflow: hidden; display: grid; grid-template-columns: 0.9fr 1.1fr; box-shadow: 0 28px 64px rgba(37,99,235,0.18); }
        .fp-left { background: linear-gradient(145deg, #2563EB 0%, #1d4ed8 60%, #1e40af 100%); color: #fff; padding: 34px; position: relative; }
        .fp-right { background: #fff; padding: 34px; }
        .fp-input { width: 100%; padding: 12px 14px; border: 1.5px solid #E2E8F0; border-radius: 10px; background: #F8FAFC; outline: none; font-size: 0.9rem; }
        .fp-input:focus { border-color: #2563EB; background: #fff; box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
        .fp-btn { width: 100%; border: 0; border-radius: 10px; padding: 12px; background: #2563EB; color: #fff; font-weight: 700; cursor: pointer; }
        .fp-btn:disabled { opacity: .65; cursor: not-allowed; }
        .fp-step { display:inline-flex; align-items:center; gap:8px; padding:6px 10px; border-radius:999px; border:1px solid #E2E8F0; color:#64748B; font-size:.78rem; font-weight:700; }
        .fp-step.active { border-color:#93C5FD; background:#EFF6FF; color:#1D4ED8; }
        @media (max-width: 760px) { .fp-wrap { grid-template-columns: 1fr; } .fp-left { display:none; } }
      `}</style>

      <div className="fp-wrap">
        <div className="fp-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,.18)', display: 'grid', placeItems: 'center' }}><Stethoscope size={18} /></div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>ClinicSys</div>
              <div style={{ opacity: .8, fontSize: '.72rem' }}>Account Security</div>
            </div>
          </div>
          <h2 style={{ margin: '8px 0 10px', fontSize: '2rem', lineHeight: 1.1 }}>Reset your password securely</h2>
          <p style={{ opacity: .85, fontSize: '.86rem', lineHeight: 1.7 }}>
            We’ll verify your email using a one-time code, then allow you to set a new password safely.
          </p>
        </div>

        <div className="fp-right">
          <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontSize: '.8rem', color: '#64748B', marginBottom: 16 }}>
            <ArrowLeft size={14} /> Back to Login
          </Link>

          <h1 style={{ margin: 0, fontSize: '1.65rem', color: '#0F172A' }}>Forgot Password</h1>
          <p style={{ marginTop: 6, color: '#64748B', fontSize: '.84rem' }}>Complete the 3-step recovery flow.</p>

          <div style={{ display: 'flex', gap: 8, margin: '14px 0 16px' }}>
            <span className={`fp-step ${step === 1 ? 'active' : ''}`}><Mail size={14} /> Email</span>
            <span className={`fp-step ${step === 2 ? 'active' : ''}`}><ShieldCheck size={14} /> OTP</span>
            <span className={`fp-step ${step === 3 ? 'active' : ''}`}><KeyRound size={14} /> New Password</span>
          </div>

          {message && <div style={{ background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', borderRadius: 10, padding: 10, marginBottom: 12, fontSize: '.84rem' }}>{message}</div>}
          {error && <div style={{ background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA', borderRadius: 10, padding: 10, marginBottom: 12, fontSize: '.84rem' }}>{error}</div>}

          {step === 1 && (
            <form onSubmit={sendOtp}>
              <label style={{ fontSize: '.78rem', fontWeight: 700, color: '#475569' }}>Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="fp-input" style={{ marginTop: 6, marginBottom: 12 }} />
              <button disabled={loading} className="fp-btn">{loading ? 'Sending...' : 'Send OTP'}</button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={verifyOtp}>
              <label style={{ fontSize: '.78rem', fontWeight: 700, color: '#475569' }}>Enter 6-digit OTP</label>
              <input type="text" inputMode="numeric" maxLength={6} value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} required className="fp-input" style={{ marginTop: 6, marginBottom: 8, letterSpacing: '0.2em' }} />
              <p style={{ margin: '0 0 12px', fontSize: '.74rem', color: '#64748B' }}>Sent to <strong>{email}</strong></p>
              <button disabled={loading || !canVerifyOtp} className="fp-btn">{loading ? 'Verifying...' : 'Verify OTP'}</button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={resetPassword}>
              <label style={{ fontSize: '.78rem', fontWeight: 700, color: '#475569' }}>New Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="fp-input" style={{ marginTop: 6, marginBottom: 10 }} />
              <label style={{ fontSize: '.78rem', fontWeight: 700, color: '#475569' }}>Confirm Password</label>
              <input type="password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} required minLength={8} className="fp-input" style={{ marginTop: 6, marginBottom: 12 }} />
              <button disabled={loading || !canReset} className="fp-btn">{loading ? 'Updating...' : 'Reset Password'}</button>
            </form>
          )}

          <div style={{ marginTop: 14, textAlign: 'center' }}>
            <Link to="/login" style={{ color: '#2563EB', textDecoration: 'none', fontWeight: 700, fontSize: '.85rem' }}>Back to Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

