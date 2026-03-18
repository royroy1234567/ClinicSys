import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://backend1.test/api';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session — user info lang, token wala na sa localStorage
  useEffect(() => {
    const stored = localStorage.getItem('clinic_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        credentials: 'include',        // ← cookie automatic na matatanggap
        headers: {
          'Content-Type': 'application/json',
          'Accept':        'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setUser(data.user);
        localStorage.setItem('clinic_user', JSON.stringify(data.user)); // user info lang, walang token
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
    try {
      // I-delete ang token sa server side
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',        // ← para makilala kung sino nag-logout
        headers: { 'Accept': 'application/json' },
      });
    } catch { /* ignore */ } finally {
      setUser(null);
      localStorage.removeItem('clinic_user');
      // cookie ay nada-delete na ng server (nakaset sa -1 expiry)
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};