import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://backend1.test/api';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      const token  = localStorage.getItem('auth_token');
      const stored = localStorage.getItem('clinic_user');

      // Walang token — hindi naka-login
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Verify token sa server gamit Bearer
        const res = await fetch(`${API_BASE}/auth/me`, {
          credentials: 'include',
          headers: {
            Accept:        'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            // Valid — i-restore ang session
            setUser(data.user);
            localStorage.setItem('clinic_user', JSON.stringify(data.user));
          } else {
            // Invalid token
            clearSession();
          }
        } else {
          // 401 — expired or invalid
          clearSession();
        }
      } catch {
        // Server unreachable — fallback sa stored user
        if (stored) {
          try { setUser(JSON.parse(stored)); } catch { clearSession(); }
        }
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  const clearSession = () => {
    setUser(null);
    localStorage.removeItem('clinic_user');
    localStorage.removeItem('auth_token');
  };

  const login = async (email, password, otpContext = null) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept:         'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          ...(otpContext?.otpCode ? { otp_code: otpContext.otpCode } : {}),
          ...(otpContext?.otpToken ? { otp_token: otpContext.otpToken } : {}),
        }),
      });

      const data = await res.json();

      if (res.status === 202 && data?.requires_otp) {
        return {
          success: false,
          requiresOtp: true,
          otpToken: data.otp_token,
          message: data.message ?? 'Email verification code required.',
        };
      }

      if (res.ok && data.success) {
        setUser(data.user);
        localStorage.setItem('clinic_user', JSON.stringify(data.user));
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        }
        return { success: true };
      }

      return {
        success: false,
        error: data.message ?? 'Invalid email or password.',
      };
    } catch {
      return {
        success: false,
        error: 'Unable to reach the server. Please try again.',
      };
    }
  };

  const logout = async () => {
    const token = localStorage.getItem('auth_token');
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept:         'application/json',
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } catch { /* ignore */ } finally {
      clearSession();
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
