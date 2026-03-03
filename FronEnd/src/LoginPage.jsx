import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Stethoscope, Eye, EyeOff, AlertCircle } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { login }               = useAuth();
  const navigate                = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = login(email, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 50%, #E0F2FE 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .login-card {
          width: 100%;
          max-width: 860px;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 32px 80px rgba(37,99,235,0.18), 0 8px 24px rgba(0,0,0,0.08);
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 520px;
        }

        @media (max-width: 640px) {
          .login-card { grid-template-columns: 1fr; }
          .login-left  { display: none; }
        }

        /* LEFT PANEL */
        .login-left {
          background: linear-gradient(145deg, #2563EB 0%, #1d4ed8 60%, #1e40af 100%);
          padding: 48px 40px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }
        .login-left::before {
          content: '';
          position: absolute;
          bottom: -60px;
          left: -60px;
          width: 260px;
          height: 260px;
          border-radius: 50%;
          background: rgba(255,255,255,0.07);
          pointer-events: none;
        }
        .login-left::after {
          content: '';
          position: absolute;
          top: -40px;
          right: -80px;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
          pointer-events: none;
        }

        /* RIGHT PANEL */
        .login-right {
          background: #ffffff;
          padding: 48px 40px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        /* INPUT */
        .field-group { margin-bottom: 18px; }
        .field-label {
          display: block;
          font-size: 0.78rem;
          font-weight: 600;
          color: #475569;
          margin-bottom: 6px;
          letter-spacing: 0.02em;
        }
        .field-input {
          width: 100%;
          padding: 11px 14px;
          border: 1.5px solid #E2E8F0;
          border-radius: 10px;
          font-size: 0.88rem;
          color: #1E293B;
          background: #F8FAFC;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          font-family: inherit;
        }
        .field-input::placeholder { color: #94A3B8; }
        .field-input:focus {
          border-color: #2563EB;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.10);
        }
        .pass-wrapper { position: relative; }
        .pass-wrapper .field-input { padding-right: 44px; }
        .pass-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #94A3B8;
          display: flex;
          align-items: center;
          padding: 2px;
          transition: color 0.15s;
        }
        .pass-toggle:hover { color: #2563EB; }

        /* CHECKBOX */
        .check-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 22px;
        }
        .check-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.82rem;
          color: #64748B;
          cursor: pointer;
          user-select: none;
        }
        .custom-check {
          width: 16px; height: 16px;
          border-radius: 4px;
          border: 1.5px solid #CBD5E1;
          background: #fff;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s, border-color 0.15s;
          flex-shrink: 0;
        }
        .custom-check.checked {
          background: #2563EB;
          border-color: #2563EB;
        }
        .forgot-link {
          font-size: 0.82rem;
          color: #2563EB;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.15s;
        }
        .forgot-link:hover { color: #1d4ed8; text-decoration: underline; }

        /* SUBMIT BTN */
        .btn-submit {
          width: 100%;
          padding: 13px;
          background: #2563EB;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s, box-shadow 0.15s;
          font-family: inherit;
          letter-spacing: 0.02em;
        }
        .btn-submit:hover:not(:disabled) {
          background: #1d4ed8;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(37,99,235,0.32);
        }
        .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }

        /* ERROR */
        .error-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #FEF2F2;
          border: 1.5px solid #FECACA;
          border-radius: 10px;
          padding: 10px 14px;
          margin-bottom: 18px;
          font-size: 0.82rem;
          color: #DC2626;
        }

        /* DEMO CREDS */
        .demo-box {
          margin-top: 22px;
          background: #EFF6FF;
          border: 1.5px solid #DBEAFE;
          border-radius: 12px;
          padding: 14px 16px;
        }
        .demo-title {
          font-size: 0.70rem;
          font-weight: 700;
          color: #2563EB;
          text-transform: uppercase;
          letter-spacing: 0.10em;
          margin-bottom: 8px;
          text-align: center;
        }
        .demo-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px 12px;
        }
        .demo-item {
          font-size: 0.72rem;
          color: #475569;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .demo-item strong { color: #1E293B; }

        /* SPINNER */
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
          margin-right: 8px;
          vertical-align: middle;
        }

        /* BLOB ANIMATION */
        @keyframes blobPulse {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50%       { transform: scale(1.08) rotate(5deg); }
        }
        .blob { animation: blobPulse 6s ease-in-out infinite; }
      `}</style>

      <div className="login-card">

        {/* ── LEFT PANEL ── */}
        <div className="login-left">
          {/* Logo */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'rgba(255,255,255,0.20)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1.5px solid rgba(255,255,255,0.30)',
              }}>
                <Stethoscope size={20} color="#fff" />
              </div>
              <div>
                <div style={{ fontWeight: 800, color: '#fff', fontSize: '1.5rem', lineHeight: 1.1 }}>ClinicSys</div>
                <div style={{ fontSize: '0.70rem', color: 'rgba(255,255,255,0.65)', fontWeight: 600, letterSpacing: '0.1em' }}>GENERAL CLINIC</div>
              </div>
            </div>

            {/* Headline */}
            <h2 style={{
              fontFamily: "'Lora', serif",
              fontSize: '3rem',
              fontWeight: 600,
              color: '#fff',
              lineHeight: 1.2,
              marginTop: 120,
              marginBottom: 16,
              marginLeft: 40,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>
              WELCOME
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.80)', fontSize: '0.82rem', fontWeight: 600, marginBottom: 14, marginLeft: 45 ,textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Your Trusted Partner in Health
            </p>
            <p style={{ color: 'rgba(255,255,255,0.62)', fontSize: '0.80rem', lineHeight: 1.70,marginLeft: 45, maxWidth: 260,textAlign: 'center' }}>
              Manage patient appointments, records, and clinic operations — all in one secure and easy-to-use system.
            </p>
          </div>

          {/* Bottom decorative blob */}
          <div className="blob" style={{
            position: 'absolute', bottom: -70, left: -70,
            width: 220, height: 220,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            zIndex: 0,
          }}/>

          {/* Hours badge */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.20)',
              borderRadius: 99, padding: '8px 14px',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ADE80', boxShadow: '0 0 0 3px rgba(74,222,128,0.30)' }}/>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>Mon – Sat · 8:00 AM – 5:00 PM</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="login-right">
          {/* Back button */}
          <Link to="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: '0.80rem', fontWeight: 600, color: '#64748B',
            textDecoration: 'none', marginBottom: 24,
            padding: '6px 12px 6px 8px',
            borderRadius: 8,
            border: '1.5px solid #E2E8F0',
            background: '#F8FAFC',
            transition: 'all 0.18s',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = '#2563EB'; e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.background = '#EFF6FF'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#64748B'; e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F8FAFC'; }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Home
          </Link>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1E293B', marginBottom: 6 }}>Sign In</h1>
            <p style={{ fontSize: '0.83rem', color: '#64748B' }}>Enter your credentials to access your account.</p>
          </div>

          {/* Error */}
          {error && (
            <div className="error-box" data-testid="login-error">
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="field-group">
              <label className="field-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                className="field-input"
                type="email"
                placeholder="admin@clinic.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                data-testid="email-input"
              />
            </div>

            {/* Password */}
            <div className="field-group">
              <label className="field-label" htmlFor="password">Password</label>
              <div className="pass-wrapper">
                <input
                  id="password"
                  className="field-input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  data-testid="password-input"
                />
                <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)} tabIndex={-1}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="check-row">
              <label className="check-label" onClick={() => setRemember(!remember)}>
                <div className={`custom-check ${remember ? 'checked' : ''}`}>
                  {remember && (
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path d="M1 3.5L3.5 6L8 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                Remember me
              </label>
              <a href="#" className="forgot-link">Forgot Password?</a>
            </div>

            {/* Submit */}
            <button type="submit" className="btn-submit" disabled={loading} data-testid="login-submit-button">
              {loading ? <><span className="spinner"/>Signing in...</> : 'Sign In'}
            </button>
          </form>

          {/* Register link */}
          <p style={{ textAlign: 'center', marginTop: 18, fontSize: '0.82rem', color: '#64748B' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#2563EB', fontWeight: 700, textDecoration: 'none' }}>
              Sign Up
            </Link>
          </p>

          {/* Demo credentials */}
          <div className="demo-box">
            <div className="demo-title">Demo Credentials</div>
            <div className="demo-grid">
              <div className="demo-item"><strong>Admin:</strong> admin@clinic.com / admin123</div>
              <div className="demo-item"><strong>Staff:</strong> staff@clinic.com / staff123</div>
              <div className="demo-item"><strong>Doctor:</strong> doctor@clinic.com / doctor123</div>
              <div className="demo-item"><strong>Patient:</strong> patient@clinic.com / patient123</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;