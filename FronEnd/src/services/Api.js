// API service — doctors use real backend, others use mock data
import {
  mockDoctors,
  mockAppointments,
  mockConsultations,
  mockUsers,
  mockActivityLogs,
} from './MockData';

// Simulate API delay for mock data
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// In-memory storage for mock data
let appointments  = [...mockAppointments];
let consultations = [...mockConsultations];
let users         = [...mockUsers];
let activityLogs  = [...mockActivityLogs];

const generateId = () => Math.random().toString(36).substr(2, 9);

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://backend1.test/api';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept':        'application/json',
  'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
});

const mapDoctor = (u) => ({
  id:             u.user_id,
  name:           `Dr. ${u.first_name} ${u.last_name}`,
  specialization: u.specialization || 'General',
  status:         u.status?.toLowerCase() === 'active' ? 'active' : 'inactive',
  availability_status: (u.availability_status || 'unavailable').toLowerCase(),
  email:          u.email,
  phone:          u.contact_number,
});

const mapPatient = (p) => ({
  id:         p.id,
  first_name: p.first_name,
  middle_name:p.middle_name,
  last_name:  p.last_name,
  age:        p.age,
  mobile:     p.mobile,
  email:      p.email,
  status:     p.status,
  name:       [p.first_name, p.middle_name, p.last_name].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim(),
  contact:    p.mobile || '',
});

export const api = {

  // ── Patients (real API) ─────────────────────────────────────
  patients: {
    getAll: async (search = '') => {
      const res = await fetch(`${API_BASE}/patients`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch patients');
      const data = await res.json();
      const rows = Array.isArray(data) ? data.map(mapPatient) : [];
      if (!search) return rows;
      const q = search.toLowerCase();
      return rows.filter(
        (p) =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.contact || '').includes(search) ||
          (p.email || '').toLowerCase().includes(q)
      );
    },
    getById: async (id) => {
      const rows = await api.patients.getAll('');
      const found = rows.find(p => String(p.id) === String(id));
      if (!found) throw new Error('Patient not found');
      return found;
    },
    getProfile: async () => {
      const res = await fetch(`${API_BASE}/patient/profile`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch patient profile');
      return res.json();
    },
    create: async (data) => {
      const res = await fetch(`${API_BASE}/patients/register`, {
        method:  'POST',
        headers: authHeaders(),
        body:    JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create patient');
      return res.json();
    },
    update: async (id, data) => {
      const res = await fetch(`${API_BASE}/patient/profile`, {
        method:  'PUT',
        headers: authHeaders(),
        body:    JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update patient');
      return res.json();
    },
    archive: async (id) => {
      const res = await fetch(`${API_BASE}/patients/${id}/toggle-status`, {
        method:  'PATCH',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed to update patient status');
      return res.json();
    },
  },

  // ── Doctors (real API) ────────────────────────────────────────
  doctors: {
    getAll: async () => {
      const res = await fetch(`${API_BASE}/users?role=Doctor`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch doctors');
      const data = await res.json();
      return data.map(mapDoctor);
    },

    getById: async (id) => {
      const res = await fetch(`${API_BASE}/users/${id}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Doctor not found');
      const u = await res.json();
      return mapDoctor(u);
    },

    create: async (data) => {
      const res = await fetch(`${API_BASE}/users`, {
        method:  'POST',
        headers: authHeaders(),
        body:    JSON.stringify({ ...data, role: 'Doctor' }),
      });
      if (!res.ok) throw new Error('Failed to create doctor');
      const u = await res.json();
      return mapDoctor(u);
    },

    update: async (id, data) => {
      const res = await fetch(`${API_BASE}/users/${id}`, {
        method:  'PUT',
        headers: authHeaders(),
        body:    JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update doctor');
      const u = await res.json();
      return mapDoctor(u);
    },
    getAvailability: async (id) => {
      const res = await fetch(`${API_BASE}/users/${id}/availability`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch doctor availability');
      return res.json();
    },
    updateAvailability: async (id, availability_status) => {
      const res = await fetch(`${API_BASE}/users/${id}/availability`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ availability_status }),
      });
      if (!res.ok) throw new Error('Failed to update doctor availability');
      return res.json();
    },
  },

  // ── Appointments (mock) ───────────────────────────────────────
  appointments: {
    getMine: async () => {
      const res = await fetch(`${API_BASE}/appointments`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch appointments');
      return res.json();
    },
    getAll: async (filters = {}) => {
      await delay();
      let result = [...appointments];
      if (filters.date)       result = result.filter(a => a.date      === filters.date);
      if (filters.doctor_id)  result = result.filter(a => a.doctor_id === filters.doctor_id);
      if (filters.patient_id) result = result.filter(a => a.patient_id=== filters.patient_id);
      if (filters.status)     result = result.filter(a => a.status    === filters.status);
      return result;
    },
    create: async (data) => {
      await delay();
      const newAppointment = {
        id: generateId(),
        ...data,
        status:     'scheduled',
        created_at: new Date().toISOString(),
      };
      appointments.push(newAppointment);
      return newAppointment;
    },
    update: async (id, data) => {
      await delay();
      const index = appointments.findIndex(a => a.id === id);
      if (index !== -1) {
        appointments[index] = { ...appointments[index], ...data };
        return appointments[index];
      }
      throw new Error('Appointment not found');
    },
    cancel: async (id) => {
      await delay();
      const index = appointments.findIndex(a => a.id === id);
      if (index !== -1) {
        appointments[index].status = 'cancelled';
        return { success: true };
      }
      throw new Error('Appointment not found');
    },
  },

  // ── Consultations (mock) ──────────────────────────────────────
  consultations: {
    getByQueueEntry: async (queueEntryId) => {
      const res = await fetch(`${API_BASE}/consultations/queue-entry/${queueEntryId}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch consultation');
      return res.json();
    },
    saveByQueueEntry: async (queueEntryId, payload) => {
      const res = await fetch(`${API_BASE}/consultations/queue-entry/${queueEntryId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save consultation');
      return res.json();
    },
    getAll: async (filters = {}) => {
      const params = new URLSearchParams();
      if (filters.patient_id) params.set('patient_id', String(filters.patient_id));
      if (filters.doctor_id) params.set('doctor_id', String(filters.doctor_id));
      if (filters.status) params.set('status', String(filters.status));
      if (filters.from) params.set('from', String(filters.from));
      if (filters.to) params.set('to', String(filters.to));

      const query = params.toString();
      const res = await fetch(`${API_BASE}/consultations${query ? `?${query}` : ''}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch consultations');
      return res.json();
    },
    rate: async (consultationId, payload) => {
      const res = await fetch(`${API_BASE}/consultations/${consultationId}/rate`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to submit rating');
      }
      return res.json();
    },
    create: async (data) => {
      await delay();
      const newConsultation = {
        id: generateId(),
        ...data,
        created_at: new Date().toISOString(),
      };
      consultations.push(newConsultation);
      return newConsultation;
    },
  },

  // ── Users (mock) ──────────────────────────────────────────────
  users: {
    getAll: async () => {
      await delay();
      return users;
    },
    create: async (data) => {
      await delay();
      const newUser = { id: generateId(), ...data, active: true };
      users.push(newUser);
      return newUser;
    },
    update: async (id, data) => {
      await delay();
      const index = users.findIndex(u => u.id === id);
      if (index !== -1) {
        users[index] = { ...users[index], ...data };
        return users[index];
      }
      throw new Error('User not found');
    },
  },

  // ── Reports (mock) ────────────────────────────────────────────
  reports: {
    daily: async (date) => {
      await delay();
      const dayAppointments = appointments.filter(a => a.date === date);
      return { date, total: dayAppointments.length, appointments: dayAppointments };
    },
    monthly: async (month) => {
      await delay();
      const monthAppointments = appointments.filter(a => a.date.startsWith(month));
      const byStatus = monthAppointments.reduce((acc, apt) => {
        acc[apt.status] = (acc[apt.status] || 0) + 1;
        return acc;
      }, {});
      return { month, total_appointments: monthAppointments.length, by_status: byStatus };
    },
    patientVisits: async (patientId) => {
      await delay();
      const visits = consultations.filter(c => c.patient_id === patientId);
      return { patient_id: patientId, total_visits: visits.length, visits };
    },
  },

  manager: {
    getDashboardAnalytics: async (range = 'monthly') => {
      const res = await fetch(`${API_BASE}/manager/analytics/dashboard?range=${encodeURIComponent(range)}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch manager analytics');
      return res.json();
    },
  },


  
  // ── Activity Logs (mock) ──────────────────────────────────────
  activity: {
    getAll: async () => {
      await delay();
      return activityLogs.slice(0, 100);
    },
  },

  servics: {
    getAll: async (filters = {}) => {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', String(filters.status));
      if (filters.category) params.set('category', String(filters.category));
      if (filters.search) params.set('search', String(filters.search));
      const query = params.toString();
      const res = await fetch(`${API_BASE}/servics${query ? `?${query}` : ''}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch services');
      return res.json();
    },
  },

  transactions: {
    getById: async (transactionId) => {
      const res = await fetch(`${API_BASE}/transactions/${transactionId}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch transaction receipt');
      return res.json();
    },
  },

  // FronEnd/src/services/Api.js
queue: {
  getAll: async (date) => {
    const res = await fetch(`${API_BASE}/queue-entries?date=${date}`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch queue');
    return res.json();
  },
  addWalkin: async (payload) => {
    const res = await fetch(`${API_BASE}/queue-entries/walkin`, { method:'POST', headers: authHeaders(), body: JSON.stringify(payload) });
    if (!res.ok) throw new Error('Failed to add walk-in');
    return res.json();
  },
  updateStatus: async (id, status) => {
    const res = await fetch(`${API_BASE}/queue-entries/${id}/status`, { method:'PATCH', headers: authHeaders(), body: JSON.stringify({ status }) });
    if (!res.ok) throw new Error('Failed to update status');
    return res.json();
  },
  assignDoctor: async (id, doctor_id) => {
    const res = await fetch(`${API_BASE}/queue-entries/${id}/assign-doctor`, {
      method:'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ doctor_id }),
    });
    if (!res.ok) throw new Error('Failed to assign doctor');
    return res.json();
  },
  checkInAppointment: async (appointmentId) => {
    const res = await fetch(`${API_BASE}/appointments/${appointmentId}/check-in`, { method:'POST', headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to check-in appointment');
    return res.json();
  },
}
};
