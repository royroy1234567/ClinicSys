import React, { useEffect, useState } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Search,
  Stethoscope,
  Users,
  CalendarCheck,
  UserCheck,
  MoreVertical,
  Phone,
  Mail,
  Clock,
  Edit,
  Trash2,
  Eye,
} from 'lucide-react';
import { api } from '../services/Api';
import { useNavigate } from 'react-router-dom';

/* ── Status badge ── */
const StatusBadge = ({ status }) => {
  const map = {
    active:   'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-500',
    on_leave: 'bg-yellow-100 text-yellow-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${map[status] || map.inactive}`}>
      {status?.replace('_', ' ') || 'Unknown'}
    </span>
  );
};

/* ── Specialty badge ── */
const SpecialtyBadge = ({ specialty }) => (
  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
    {specialty}
  </span>
);

/* ── Stat card ── */
const StatCard = ({ label, value, icon: Icon, iconColor }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
        </div>
        <Icon className={`w-8 h-8 ${iconColor}`} />
      </div>
    </CardContent>
  </Card>
);

/* ── Doctor row ── */
const DoctorRow = ({ doctor, appointmentCount, onView, onEdit, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
      data-testid={`doctor-item-${doctor.id}`}
    >
      {/* Avatar + info */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <span className="text-blue-700 font-bold text-sm">
            {doctor.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">{doctor.name}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <SpecialtyBadge specialty={doctor.specialization || doctor.specialty || 'General'} />
            <StatusBadge status={doctor.status || 'active'} />
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="hidden md:flex flex-col gap-1 w-52 flex-shrink-0">
        {doctor.email && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 truncate">
            <Mail className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{doctor.email}</span>
          </div>
        )}
        {doctor.phone && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Phone className="w-3 h-3 flex-shrink-0" />
            <span>{doctor.phone}</span>
          </div>
        )}
      </div>

      {/* Schedule */}
      <div className="hidden lg:flex flex-col gap-1 w-40 flex-shrink-0">
        {doctor.schedule?.days && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <CalendarCheck className="w-3 h-3" />
            <span>{doctor.schedule.days}</span>
          </div>
        )}
        {doctor.schedule?.hours && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{doctor.schedule.hours}</span>
          </div>
        )}
      </div>

      {/* Today's appointments */}
      <div className="hidden sm:flex flex-col items-center w-24 flex-shrink-0">
        <span className="text-xl font-bold text-gray-800">{appointmentCount}</span>
        <span className="text-xs text-gray-400">appts today</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button size="sm" variant="outline" onClick={() => onView(doctor)} className="hidden sm:flex">
          <Eye className="w-3.5 h-3.5 mr-1" /> View
        </Button>
        <Button size="sm" variant="outline" onClick={() => onEdit(doctor)} className="hidden sm:flex">
          <Edit className="w-3.5 h-3.5 mr-1" /> Edit
        </Button>

        {/* Mobile menu */}
        <div className="relative sm:hidden">
          <Button size="sm" variant="ghost" onClick={() => setMenuOpen(o => !o)}>
            <MoreVertical className="w-4 h-4" />
          </Button>
          {menuOpen && (
            <div className="absolute right-0 mt-1 w-32 bg-white border rounded-lg shadow-lg z-10">
              <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50" onClick={() => { onView(doctor); setMenuOpen(false); }}>View</button>
              <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50" onClick={() => { onEdit(doctor); setMenuOpen(false); }}>Edit</button>
              <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50" onClick={() => { onDelete(doctor); setMenuOpen(false); }}>Delete</button>
            </div>
          )}
        </div>

        <Button size="sm" variant="ghost" onClick={() => onDelete(doctor)} className="hidden sm:flex text-red-500 hover:text-red-600 hover:bg-red-50">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};

/* ══════════════════ MAIN PAGE ══════════════════ */
const DoctorsPage = () => {
  const [doctors, setDoctors]           = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [searchQuery, setSearchQuery]   = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading]           = useState(true);
  const navigate = useNavigate();

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [doctorsData, apptData] = await Promise.all([
        api.doctors.getAll(),
        api.appointments.getAll({ date: today }),
      ]);
      setDoctors(doctorsData);
      setAppointments(apptData);
    } catch (err) {
      console.error('Error loading doctors:', err);
      setDoctors([
        { id: 1, name: 'Dr. Sarah Smith',   specialization: 'General Medicine',  status: 'active',   email: 'sarah@clinic.com',   phone: '+63 912 001 0001', schedule: { days: 'Mon–Fri', hours: '8:00–17:00' } },
        { id: 2, name: 'Dr. Michael Chen',  specialization: 'Pediatrics',        status: 'active',   email: 'mchen@clinic.com',   phone: '+63 912 001 0002', schedule: { days: 'Mon–Sat', hours: '8:00–12:00' } },
        { id: 3, name: 'Dr. Reyna Torres',  specialization: 'Internal Medicine',  status: 'on_leave', email: 'rtorres@clinic.com', phone: '+63 912 001 0003', schedule: { days: 'Tue–Sat', hours: '9:00–17:00' } },
        { id: 4, name: 'Dr. James Lim',     specialization: 'General Medicine',  status: 'active',   email: 'jlim@clinic.com',    phone: '+63 912 001 0004', schedule: { days: 'Mon–Fri', hours: '13:00–20:00' } },
        { id: 5, name: 'Dr. Ana Reyes',     specialization: 'Dermatology',       status: 'inactive', email: 'areyes@clinic.com',  phone: '+63 912 001 0005', schedule: { days: 'Wed–Sat', hours: '10:00–16:00' } },
      ]);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const getApptCount = (doctorId) =>
    appointments.filter(a => a.doctor_id === doctorId).length;

  const filtered = doctors.filter(d => {
    const matchSearch =
      d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.specialization || d.specialty || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || d.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total:      doctors.length,
    active:     doctors.filter(d => d.status === 'active').length,
    onLeave:    doctors.filter(d => d.status === 'on_leave').length,
    todayAppts: appointments.length,
  };

  const handleView   = (doc) => navigate(`/doctors/${doc.id}`);
  const handleEdit   = (doc) => navigate(`/doctors/${doc.id}/edit`);
  const handleDelete = (doc) => {
    if (window.confirm(`Remove ${doc.name} from the system?`)) {
      setDoctors(prev => prev.filter(d => d.id !== doc.id));
    }
  };

  if (loading) {
    return (
      <MainLayout title="Doctors" subtitle="Manage clinic doctors and schedules">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Doctors" subtitle="Manage clinic doctors and schedules">
      <div className="space-y-6">

        {/* ── Stats ── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Total Doctors"        value={stats.total}      icon={Stethoscope}   iconColor="text-primary"      />
          <StatCard label="Active"               value={stats.active}     icon={UserCheck}     iconColor="text-green-600"    />
          <StatCard label="On Leave"             value={stats.onLeave}    icon={Clock}         iconColor="text-yellow-600"   />
          <StatCard label="Today's Appointments" value={stats.todayAppts} icon={CalendarCheck} iconColor="text-blue-600"     />
        </div>

        {/* ── Doctor list card ── */}
        <Card data-testid="doctors-list-card">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Doctor Roster
              </CardTitle>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Status filter */}
                {['all', 'active', 'on_leave', 'inactive'].map(s => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors capitalize
                      ${filterStatus === s
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {s === 'all' ? 'All' : s.replace('_', ' ')}
                  </button>
                ))}

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search doctors…"
                    className="pl-9 w-52"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    data-testid="search-doctors-input"
                  />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Column headers */}
            <div className="hidden md:grid grid-cols-[1fr_13rem_10rem_6rem_auto] gap-4 px-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b mb-2">
              <span>Doctor</span>
              <span>Contact</span>
              <span className="hidden lg:block">Schedule</span>
              <span className="hidden sm:block text-center">Today</span>
              <span>Actions</span>
            </div>

            {filtered.length > 0 ? (
              <div className="space-y-2 mt-2">
                {filtered.map(doc => (
                  <DoctorRow
                    key={doc.id}
                    doctor={doc}
                    appointmentCount={getApptCount(doc.id)}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Stethoscope className="w-12 h-12 mx-auto text-gray-200 mb-3" />
                <p className="text-muted-foreground font-medium">No doctors found</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filter</p>
              </div>
            )}

            {/* Footer count */}
            {filtered.length > 0 && (
              <p className="text-xs text-gray-400 mt-4 text-right">
                Showing {filtered.length} of {doctors.length} doctor{doctors.length !== 1 ? 's' : ''}
              </p>
            )}
          </CardContent>
        </Card>

      </div>
    </MainLayout>
  );
};

export default DoctorsPage;