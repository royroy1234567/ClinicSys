// API service — doctors use real backend, others use mock data
import {
  mockPatients,
  mockDoctors,
  mockAppointments,
  mockConsultations,
  mockUsers,
  mockActivityLogs,
} from './MockData';

// Simulate API delay for mock data
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// In-memory storage for mock data
let patients      = [...mockPatients];
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
  email:          u.email,
  phone:          u.contact_number,
});

export const api = {

  // ── Patients (mock) ──────────────────────────────────────────
  patients: {
    getAll: async (search = '') => {
      await delay();
      if (search) {
        return patients.filter(
          p =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.contact.includes(search)
        );
      }
      return patients.filter(p => !p.archived);
    },
    getById: async (id) => {
      await delay();
      return patients.find(p => p.id === id);
    },
    create: async (data) => {
      await delay();
      const newPatient = {
        id: generateId(),
        ...data,
        archived:   false,
        created_at: new Date().toISOString(),
      };
      patients.push(newPatient);
      return newPatient;
    },
    update: async (id, data) => {
      await delay();
      const index = patients.findIndex(p => p.id === id);
      if (index !== -1) {
        patients[index] = { ...patients[index], ...data };
        return patients[index];
      }
      throw new Error('Patient not found');
    },
    archive: async (id) => {
      await delay();
      const index = patients.findIndex(p => p.id === id);
      if (index !== -1) {
        patients[index].archived = true;
        return { success: true };
      }
      throw new Error('Patient not found');
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
  },

  // ── Appointments (mock) ───────────────────────────────────────
  appointments: {
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
    getAll: async (filters = {}) => {
      await delay();
      let result = [...consultations];
      if (filters.patient_id) result = result.filter(c => c.patient_id === filters.patient_id);
      if (filters.doctor_id)  result = result.filter(c => c.doctor_id  === filters.doctor_id);
      return result;
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

  // ── Activity Logs (mock) ──────────────────────────────────────
  activity: {
    getAll: async () => {
      await delay();
      return activityLogs.slice(0, 100);
    },
  },
};