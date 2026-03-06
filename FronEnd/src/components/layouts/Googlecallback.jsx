import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function GoogleCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token  = params.get('token');
    const user   = params.get('user');
    const error  = params.get('error');

    // Error from Laravel
    if (error) {
      navigate('/register?error=google_failed');
      return;
    }

    if (token) {
      // Existing user — store token and go to dashboard
      localStorage.setItem('auth_token', token);
      if (user) {
        try {
          localStorage.setItem('auth_user', user);
        } catch (_) {}
      }
      navigate('/dashboard');
      return;
    }

    // No token and no error — go back to register
    navigate('/register');
  }, [navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 16,
      fontFamily: "'DM Sans', sans-serif",
      background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 50%, #F5F3FF 100%)',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 20,
        padding: '48px 40px',
        textAlign: 'center',
        boxShadow: '0 24px 64px rgba(99,102,241,0.13)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Loader2 size={28} color="#2563EB" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', marginBottom: 6 }}>
            Signing you in…
          </h3>
          <p style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>
            Please wait while we complete your Google sign-in.
          </p>
        </div>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;700;800&display=swap');
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}