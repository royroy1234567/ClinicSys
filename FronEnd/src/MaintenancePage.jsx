import React from 'react';
import { Link } from 'react-router-dom';

export default function MaintenancePage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 60%, #E0F2FE 100%)',
      padding: 24,
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <div style={{
        maxWidth: 560,
        width: '100%',
        background: '#fff',
        border: '1px solid #E2E8F0',
        borderRadius: 20,
        boxShadow: '0 18px 50px rgba(37,99,235,0.12)',
        padding: '36px 30px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '2rem', marginBottom: 12 }}>🛠️</div>
        <h1 style={{ margin: 0, color: '#1E293B', fontSize: '1.75rem' }}>System Under Maintenance</h1>
        <p style={{ color: '#64748B', marginTop: 14, lineHeight: 1.7 }}>
          ClinicSys is currently in maintenance mode. Please try again later.
          If you are an admin, you may still access the dashboard.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <button style={{
              border: '1px solid #BFDBFE',
              background: '#EFF6FF',
              color: '#1D4ED8',
              borderRadius: 10,
              padding: '10px 16px',
              fontWeight: 700,
              cursor: 'pointer',
            }}>Back to Home</button>
          </Link>
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <button style={{
              border: '1px solid #2563EB',
              background: '#2563EB',
              color: '#fff',
              borderRadius: 10,
              padding: '10px 16px',
              fontWeight: 700,
              cursor: 'pointer',
            }}>Go to Login</button>
          </Link>
        </div>
      </div>
    </div>
  );
}

