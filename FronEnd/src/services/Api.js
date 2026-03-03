// Mock API service for frontend-only demo
import {
  mockPatients,
  mockDoctors,
  mockAppointments,
  mockConsultations,
  mockUsers,
  mockActivityLogs,
} from './MockData';

// Simulate API delay
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// In-memory storage
let patients = [...mockPatients];
let doctors = [...mockDoctors];
let appointments = [...mockAppointments];
let consultations = [...mockConsultations];
let users = [...mockUsers];
let activityLogs = [...mockActivityLogs];

const generateId = () => Math.random().toString(36).substr(2, 9);

export const api = {
  // Patients
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
        archived: false,
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

  // Doctors
  doctors: {
    getAll: async () => {
      await delay();
      return doctors;
    },
    getById: async (id) => {
      await delay();
      return doctors.find(d => d.id === id);
    },
    create: async (data) => {
      await delay();
      const newDoctor = {
        id: generateId(),
        ...data,
        created_at: new Date().toISOString(),
      };
      doctors.push(newDoctor);
      return newDoctor;
    },
    update: async (id, data) => {
      await delay();
      const index = doctors.findIndex(d => d.id === id);
      if (index !== -1) {
        doctors[index] = { ...doctors[index], ...data };
        return doctors[index];
      }
      throw new Error('Doctor not found');
    },
  },

  // Appointments
  appointments: {
    getAll: async (filters = {}) => {
      await delay();
      let result = [...appointments];
      
      if (filters.date) {
        result = result.filter(a => a.date === filters.date);
      }
      if (filters.doctor_id) {
        result = result.filter(a => a.doctor_id === filters.doctor_id);
      }
      if (filters.patient_id) {
        result = result.filter(a => a.patient_id === filters.patient_id);
      }
      if (filters.status) {
        result = result.filter(a => a.status === filters.status);
      }
      
      return result;
    },
    create: async (data) => {
      await delay();
      const newAppointment = {
        id: generateId(),
        ...data,
        status: 'scheduled',
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

  // Consultations
  consultations: {
    getAll: async (filters = {}) => {
      await delay();
      let result = [...consultations];
      
      if (filters.patient_id) {
        result = result.filter(c => c.patient_id === filters.patient_id);
      }
      if (filters.doctor_id) {
        result = result.filter(c => c.doctor_id === filters.doctor_id);
      }
      
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

  // Users
  users: {
    getAll: async () => {
      await delay();
      return users;
    },
    create: async (data) => {
      await delay();
      const newUser = {
        id: generateId(),
        ...data,
        active: true,
      };
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

  // Reports
  reports: {
    daily: async (date) => {
      await delay();
      const dayAppointments = appointments.filter(a => a.date === date);
      return {
        date,
        total: dayAppointments.length,
        appointments: dayAppointments,
      };
    },
    monthly: async (month) => {
      await delay();
      const monthAppointments = appointments.filter(a => a.date.startsWith(month));
      const byStatus = monthAppointments.reduce((acc, apt) => {
        acc[apt.status] = (acc[apt.status] || 0) + 1;
        return acc;
      }, {});
      return {
        month,
        total_appointments: monthAppointments.length,
        by_status: byStatus,
      };
    },
    patientVisits: async (patientId) => {
      await delay();
      const visits = consultations.filter(c => c.patient_id === patientId);
      return {
        patient_id: patientId,
        total_visits: visits.length,
        visits,
      };
    },
  },

  // Activity Logs
  activity: {
    getAll: async () => {
      await delay();
      return activityLogs.slice(0, 100);
    },
  },
};