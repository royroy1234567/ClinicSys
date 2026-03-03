// Mock data for frontend-only demo

export const mockPatients = [
  {
    id: 'p1',
    name: 'John Doe',
    dob: '1985-03-15',
    gender: 'Male',
    address: '123 Main St, City',
    contact: '+1-555-0101',
    emergency_contact: '+1-555-0102',
    notes: 'Allergic to penicillin',
    archived: false,
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'p2',
    name: 'Jane Smith',
    dob: '1990-07-22',
    gender: 'Female',
    address: '456 Oak Ave, Town',
    contact: '+1-555-0201',
    emergency_contact: '+1-555-0202',
    notes: 'Diabetic',
    archived: false,
    created_at: '2024-01-20T14:30:00Z'
  },
  {
    id: 'p3',
    name: 'Robert Johnson',
    dob: '1978-11-05',
    gender: 'Male',
    address: '789 Pine Rd, Village',
    contact: '+1-555-0301',
    emergency_contact: '+1-555-0302',
    notes: '',
    archived: false,
    created_at: '2024-02-01T09:15:00Z'
  },
];

export const mockDoctors = [
  {
    id: 'd1',
    user_id: 'u3',
    name: 'Dr. Sarah Smith',
    specialization: 'General Physician',
    contact: '+1-555-1001',
    slot_duration: 30,
    working_hours: {
      monday: { start: '09:00', end: '17:00' },
      tuesday: { start: '09:00', end: '17:00' },
      wednesday: { start: '09:00', end: '17:00' },
      thursday: { start: '09:00', end: '17:00' },
      friday: { start: '09:00', end: '17:00' },
    },
    blocked_dates: [],
  },
  {
    id: 'd2',
    user_id: 'u4',
    name: 'Dr. Michael Chen',
    specialization: 'Cardiologist',
    contact: '+1-555-1002',
    slot_duration: 45,
    working_hours: {
      monday: { start: '10:00', end: '18:00' },
      wednesday: { start: '10:00', end: '18:00' },
      friday: { start: '10:00', end: '18:00' },
    },
    blocked_dates: [],
  },
  {
    id: 'd3',
    user_id: 'u5',
    name: 'Dr. Emily Brown',
    specialization: 'Pediatrician',
    contact: '+1-555-1003',
    slot_duration: 20,
    working_hours: {
      tuesday: { start: '08:00', end: '16:00' },
      thursday: { start: '08:00', end: '16:00' },
      friday: { start: '08:00', end: '14:00' },
    },
    blocked_dates: [],
  },
];

export const mockAppointments = [
  {
    id: 'a1',
    patient_id: 'p1',
    doctor_id: 'd1',
    date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '09:30',
    reason: 'Regular checkup',
    status: 'scheduled',
    created_at: new Date().toISOString(),
  },
  {
    id: 'a2',
    patient_id: 'p2',
    doctor_id: 'd1',
    date: new Date().toISOString().split('T')[0],
    start_time: '10:00',
    end_time: '10:30',
    reason: 'Follow-up visit',
    status: 'completed',
    created_at: new Date().toISOString(),
  },
  {
    id: 'a3',
    patient_id: 'p3',
    doctor_id: 'd2',
    date: new Date().toISOString().split('T')[0],
    start_time: '11:00',
    end_time: '11:45',
    reason: 'Heart consultation',
    status: 'ongoing',
    created_at: new Date().toISOString(),
  },
];

export const mockConsultations = [
  {
    id: 'c1',
    appointment_id: 'a2',
    patient_id: 'p2',
    doctor_id: 'd1',
    notes: 'Patient showing improvement in blood sugar levels.',
    diagnosis: 'Type 2 Diabetes - Under Control',
    prescriptions: 'Metformin 500mg twice daily, Continue diet plan',
    visit_date: new Date().toISOString().split('T')[0],
  },
];

export const mockUsers = [
  { id: 'u1', email: 'admin@clinic.com', name: 'Admin User', role: 'admin', active: true },
  { id: 'u2', email: 'staff@clinic.com', name: 'Staff User', role: 'staff', active: true },
  { id: 'u3', email: 'doctor1@clinic.com', name: 'Dr. Sarah Smith', role: 'doctor', active: true },
  { id: 'u4', email: 'doctor2@clinic.com', name: 'Dr. Michael Chen', role: 'doctor', active: true },
];

export const mockActivityLogs = [
  {
    id: 'l1',
    user_id: 'u2',
    action: 'create',
    entity_type: 'appointment',
    entity_id: 'a1',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'l2',
    user_id: 'u3',
    action: 'update',
    entity_type: 'appointment',
    entity_id: 'a2',
    timestamp: new Date().toISOString(),
  },
];