import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Calendar,
  Clock,
  Users,
  ClipboardList,
} from 'lucide-react';
import { api } from '../services/Api';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // In a real app, we'd get doctor_id from user profile
      const mockDoctorId = 'd1';
      
      const [appointmentsData, patientsData, consultationsData] = await Promise.all([
        api.appointments.getAll({ date: today, doctor_id: mockDoctorId }),
        api.patients.getAll(),
        api.consultations.getAll({ doctor_id: mockDoctorId }),
      ]);

      setAppointments(appointmentsData);
      setPatients(patientsData);
      setConsultations(consultationsData);
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

  if (loading) {
    return (
      <MainLayout title="Doctor Dashboard" subtitle="Your schedule and patients">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Doctor Dashboard" subtitle="Your schedule and patients">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today's Appointments</p>
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
                  <p className="text-sm text-muted-foreground">Total Patients</p>
                  <h3 className="text-2xl font-bold mt-1">{patients.length}</h3>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Consultations</p>
                  <h3 className="text-2xl font-bold mt-1">{consultations.length}</h3>
                </div>
                <ClipboardList className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Patient List */}
        <Card data-testid="todays-patients-card">
          <CardHeader>
            <CardTitle>Today's Patient List</CardTitle>
          </CardHeader>
          <CardContent>
            {appointments.length > 0 ? (
              <div className="space-y-3">
                {appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{getPatientName(apt.patient_id)}</p>
                      <p className="text-sm text-muted-foreground">{apt.reason}</p>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {apt.start_time} - {apt.end_time}
                        </p>
                        <Badge
                          className={`mt-1 ${
                            apt.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : apt.status === 'ongoing'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {apt.status}
                        </Badge>
                      </div>
                      <Button size="sm" data-testid={`view-patient-${apt.id}`}>View Record</Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-muted-foreground">No appointments scheduled for today</p>
                <p className="text-sm text-muted-foreground mt-1">Enjoy your day off!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Consultations */}
        <Card data-testid="recent-consultations-card">
          <CardHeader>
            <CardTitle>Recent Consultations</CardTitle>
          </CardHeader>
          <CardContent>
            {consultations.length > 0 ? (
              <div className="space-y-3">
                {consultations.slice(0, 5).map((cons) => (
                  <div key={cons.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{getPatientName(cons.patient_id)}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(cons.visit_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Button size="sm" variant="outline">View Details</Button>
                    </div>
                    <div className="mt-3 text-sm">
                      <p className="text-foreground"><strong>Diagnosis:</strong> {cons.diagnosis}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-6">No consultations recorded yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default DoctorDashboard;