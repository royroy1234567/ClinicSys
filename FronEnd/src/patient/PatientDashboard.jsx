import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Calendar, FileText } from 'lucide-react';
import { api } from '../services/Api';

const PatientDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Mock patient ID - in real app, get from user profile
      const mockPatientId = 'p1';
      
      const [appointmentsData, consultationsData] = await Promise.all([
        api.appointments.getAll({ patient_id: mockPatientId }),
        api.consultations.getAll({ patient_id: mockPatientId }),
      ]);

      setAppointments(appointmentsData);
      setConsultations(consultationsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout title="My Dashboard" subtitle="Your appointments and medical records">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="My Dashboard" subtitle="Your appointments and medical records">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Appointments</p>
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
                  <p className="text-sm text-muted-foreground">Medical Records</p>
                  <h3 className="text-2xl font-bold mt-1">{consultations.length}</h3>
                </div>
                <FileText className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Appointments */}
        <Card data-testid="upcoming-appointments-card">
          <CardHeader>
            <CardTitle>My Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            {appointments.length > 0 ? (
              <div className="space-y-3">
                {appointments.map((apt) => (
                  <div key={apt.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{apt.reason}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(apt.date).toLocaleDateString()} at {apt.start_time}
                        </p>
                      </div>
                      <Badge
                        className={`${
                          apt.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : apt.status === 'cancelled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {apt.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-6">No appointments found</p>
            )}
          </CardContent>
        </Card>

        {/* Medical Records */}
        <Card data-testid="medical-records-card">
          <CardHeader>
            <CardTitle>Medical Records</CardTitle>
          </CardHeader>
          <CardContent>
            {consultations.length > 0 ? (
              <div className="space-y-3">
                {consultations.map((cons) => (
                  <div key={cons.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <p className="font-medium">{new Date(cons.visit_date).toLocaleDateString()}</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p><strong>Diagnosis:</strong> {cons.diagnosis}</p>
                      <p><strong>Prescriptions:</strong> {cons.prescriptions}</p>
                      <p className="text-muted-foreground">{cons.notes}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-6">No medical records available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default PatientDashboard;