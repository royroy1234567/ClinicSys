import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Calendar, FileText, Activity, RefreshCw } from 'lucide-react';
import { api } from '../services/Api';
import { toast } from 'sonner';

const statusClasses = {
  scheduled: 'bg-blue-100 text-blue-700',
  completed:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
  no_show:    'bg-rose-100 text-rose-700',
};

const formatDateTime = (date, time) => {
  if (!date) return '—';
  const d = new Date(`${date}T${time || '00:00'}`);
  if (Number.isNaN(d.getTime())) return `${date}${time ? ` ${time}` : ''}`;
  return d.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
};

function RatingModal({ record, onClose, onSubmit }) {
  const [rating, setRating] = useState(record?.session_rating || 0);
  const [feedback, setFeedback] = useState(record?.session_feedback || '');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!rating) return;
    setSaving(true);
    try {
      await onSubmit(record.consultation_id, { session_rating: rating, session_feedback: feedback || null });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-black">Rate Services</h3>
        <p className="text-xs text-gray-500 mt-1">Rate your completed session.</p>
        <div className="mt-4 flex gap-2">
          {[1,2,3,4,5].map((s)=><button key={s} onClick={()=>setRating(s)} className={`w-9 h-9 rounded-lg border font-black ${rating>=s?'bg-yellow-400 border-yellow-400 text-white':'bg-white border-gray-200 text-gray-500'}`}>{s}</button>)}
        </div>
        <textarea value={feedback} onChange={(e)=>setFeedback(e.target.value)} className="mt-4 w-full border border-gray-200 rounded-xl p-3 text-sm" rows={4} placeholder="Optional feedback..." />
        <div className="mt-4 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 border rounded-lg text-sm font-bold">Cancel</button>
          <button disabled={!rating || saving} onClick={submit} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold disabled:opacity-50">{saving ? 'Saving...' : 'Submit Rating'}</button>
        </div>
      </div>
    </div>
  );
}

const PatientDashboard = () => {
  const { user } = useAuth(); // still used for display fallback in profile bar
  const navigate = useNavigate();
  const [profile,       setProfile]       = useState(null);
  const [appointments,  setAppointments]  = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [rateRecord, setRateRecord] = useState(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [me, appointmentsData, consultationsData] = await Promise.all([
        api.patients.getProfile(),
        api.appointments.getMine(),      // same call used in the working records page
        api.consultations.getAll({}),    // same call used in the working records page
      ]);
      setProfile(me ?? null);
      setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
      setConsultations(Array.isArray(consultationsData) ? consultationsData : []);
    } catch (error) {
      console.error('Error loading patient dashboard data:', error);
      toast.error(error?.message || 'Failed to load dashboard data.');
      setAppointments([]);
      setConsultations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // "Upcoming" = scheduled appointments that are today or in the future
  const today = new Date().toISOString().slice(0, 10);

  const upcomingAppointments = useMemo(
    () => appointments.filter(
      (a) => a.status === 'scheduled' && (a.appointment_date ?? '') >= today
    ),
    [appointments, today]
  );

  const completedConsultations = useMemo(
    () => consultations.filter((c) => c.status === 'completed'),
    [consultations]
  );

  const latestRecord = consultations[0] ?? null;
  const followUp = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return [...consultations]
      .sort((a, b) => String(b.updated_at || '').localeCompare(String(a.updated_at || '')))
      .find((c) =>
      c.follow_up_required &&
      c.follow_up_date &&
      (c.follow_up_expired !== true) &&
      c.follow_up_date >= today
    ) || null;
  }, [consultations]);

  const submitRating = useCallback(async (consultationId, payload) => {
    const updated = await api.consultations.rate(consultationId, payload);
    setConsultations((prev) => prev.map((c) => (c.consultation_id === updated.consultation_id ? updated : c)));
  }, []);

  if (loading) {
    return (
      <MainLayout title="My Dashboard" subtitle="Your appointments and medical records">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="My Dashboard" subtitle="Your appointments and medical records">
      <div className="space-y-6">

        {/* ── Profile bar ── */}
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Patient</p>
            <p className="text-lg font-black text-gray-900">
              {profile
                ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
                : (user?.name || 'Patient')}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {profile?.email || user?.email || 'No email on file'}
            </p>
          </div>
          <button
            onClick={() => loadData(true)}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* ── KPI cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Total Appointments</p>
                  <h3 className="text-2xl font-black mt-1">{appointments.length}</h3>
                </div>
                <Calendar className="w-7 h-7 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Upcoming</p>
                  {/* Fixed: was counting from wrong array — now correctly counts future scheduled appointments */}
                  <h3 className="text-2xl font-black mt-1">{upcomingAppointments.length}</h3>
                </div>
                <Activity className="w-7 h-7 text-amber-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Completed Consultations</p>
                  <h3 className="text-2xl font-black mt-1">{completedConsultations.length}</h3>
                </div>
                <FileText className="w-7 h-7 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {followUp && (
          <Card>
            <CardHeader>
              <CardTitle>Follow-up</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">
                <strong>Follow-up Check-up Date:</strong> {new Date(`${followUp.follow_up_date}T00:00:00`).toLocaleDateString('en-PH', { dateStyle: 'long' })}
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <strong>Status:</strong> Follow-up Required
              </p>
              <button
                onClick={() => navigate(`/my-appointments?followup=1&date=${encodeURIComponent(followUp.follow_up_date)}&consultation_id=${encodeURIComponent(String(followUp.consultation_id || ''))}`)}
                className="mt-4 inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700"
              >
                Book Appointment
              </button>
            </CardContent>
          </Card>
        )}

        {/* ── My Appointments ── */}
        <Card data-testid="upcoming-appointments-card">
          <CardHeader>
            <CardTitle>My Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">No upcoming appointments found</p>
            ) : (
              <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                {upcomingAppointments.map((apt) => (
                  <div key={apt.appointment_id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">
                          {apt.service_name || apt.reason || 'Appointment'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDateTime(apt.appointment_date, apt.appointment_time)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Doctor: {apt.doctor_name || 'TBD'}
                        </p>
                      </div>
                      <Badge className={statusClasses[apt.status] || 'bg-gray-100 text-gray-600'}>
                        {String(apt.status || 'scheduled').replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Latest Medical Record ── */}
        <Card data-testid="medical-records-card">
          <CardHeader>
            <CardTitle>Latest Medical Record</CardTitle>
          </CardHeader>
          <CardContent>
            {latestRecord ? (
              <div className="p-4 border rounded-lg">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">
                  {latestRecord.updated_at
                    ? new Date(latestRecord.updated_at).toLocaleDateString('en-PH')
                    : 'Recent'}
                </p>
                <p className="text-sm mt-2"><strong>Doctor:</strong> {latestRecord.doctor_name || '—'}</p>
                <p className="text-sm mt-1"><strong>Diagnosis:</strong> {latestRecord.diagnosis || 'No diagnosis yet'}</p>
                <p className="text-sm mt-1 text-gray-600">{latestRecord.notes || 'No notes available.'}</p>
                <p className="text-xs mt-2">
                  <strong>Rating Status:</strong> {latestRecord.rating_status === 'rated' ? 'Rated' : 'Not Yet Rated'}
                  {latestRecord.session_rating ? ` (${latestRecord.session_rating}/5)` : ''}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setRateRecord(latestRecord)}
                    disabled={latestRecord.status !== 'completed'}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-200 bg-blue-50 text-blue-700 disabled:opacity-50"
                  >
                    Rate Services
                  </button>
                  <button
                    onClick={() => navigate('/records')}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 bg-white text-gray-700"
                  >
                    View Full Records
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-6">No medical records available</p>
            )}
          </CardContent>
        </Card>

      </div>
      {rateRecord && <RatingModal record={rateRecord} onClose={() => setRateRecord(null)} onSubmit={submitRating} />}
    </MainLayout>
  );
};

export default PatientDashboard;
