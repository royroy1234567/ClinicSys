import React, { useEffect, useState } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Calendar,
  Clock,
  Search,
  Plus,
  UserPlus,
} from 'lucide-react';
import { api } from '../services/Api';
import { useNavigate } from 'react-router-dom';

const StatusBadge = ({ status }) => {
  const variants = {
    scheduled: 'bg-blue-100 text-blue-700',
    ongoing: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    no_show: 'bg-gray-100 text-gray-700',
  };

  return (
    <Badge className={`${variants[status]} capitalize`}>
      {status.replace('_', ' ')}
    </Badge>
  );
};

const StaffDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [appointmentsData, patientsData, doctorsData] = await Promise.all([
        api.appointments.getAll({ date: today }),
        api.patients.getAll(),
        api.doctors.getAll(),
      ]);

      setAppointments(appointmentsData);
      setPatients(patientsData);
      setDoctors(doctorsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPatientName = (patientId) => {
    const patient = patients.find(p => p.id === patientId);
    return patient?.name || 'Unknown';
  };

  const getDoctorName = (doctorId) => {
    const doctor = doctors.find(d => d.id === doctorId);
    return doctor?.name || 'Unknown';
  };

  if (loading) {
    return (
      <MainLayout title="Staff Dashboard" subtitle="Manage appointments and patients">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Staff Dashboard" subtitle="Manage appointments and patients">
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Today</p>
                  <h3 className="text-2xl font-bold mt-1">{appointments.length}</h3>
                </div>
                <Calendar className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {appointments.filter(a => a.status === 'completed').length}
                  </h3>
                </div>
                <Clock className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {appointments.filter(a => a.status === 'scheduled' || a.status === 'ongoing').length}
                  </h3>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => navigate('/appointments/new')} data-testid="new-appointment-button">
            <Plus className="w-4 h-4 mr-2" />
            New Appointment
          </Button>
          <Button variant="outline" onClick={() => navigate('/patients/new')} data-testid="new-patient-button">
            <UserPlus className="w-4 h-4 mr-2" />
            Register Patient
          </Button>
        </div>

        {/* Today's Appointment Queue */}
        <Card data-testid="appointment-queue-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Today's Appointment Queue</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search appointments..."
                  className="pl-10 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="search-appointments-input"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {appointments.length > 0 ? (
              <div className="space-y-3">
                {appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    data-testid={`appointment-item-${apt.id}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div>
                          <p className="font-medium">{getPatientName(apt.patient_id)}</p>
                          <p className="text-sm text-muted-foreground">
                            Dr. {getDoctorName(apt.doctor_id)}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{apt.reason}</p>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{apt.start_time} - {apt.end_time}</p>
                        <StatusBadge status={apt.status} />
                      </div>
                      <Button size="sm" variant="outline">View</Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-muted-foreground">No appointments scheduled for today</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default StaffDashboard;