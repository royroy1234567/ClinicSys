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

const RESCHEDULE_REASONS = [
  'Conflict with work/school',
  'Transportation issue',
  'Personal emergency',
  'Need a different time slot',
  'Doctor preference change',
];

const CANCEL_REASONS = [
  'Symptoms improved',
  'Financial concern',
  'Transportation issue',
  'Booked in another clinic',
  'Personal emergency',
];

const toMins = (time) => {
  if (!time) return 0;
  const [h, m] = String(time).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const pad2 = (n) => String(n).padStart(2, '0');

const generateSlotTimes = (start, end, duration) => {
  if (!duration) return [];
  const result = [];
  let cur = toMins(start);
  const endMins = toMins(end);
  while (cur + duration <= endMins) {
    result.push(`${pad2(Math.floor(cur / 60))}:${pad2(cur % 60)}`);
    cur += duration;
  }
  return result;
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

function AppointmentActionModal({ mode, appointment, onClose, onConfirm, saving, doctors = [] }) {
  const [reason, setReason] = useState('');
  const [doctorId, setDoctorId] = useState(String(appointment?.doctor_id || ''));
  const [date, setDate] = useState(appointment?.appointment_date || '');
  const [time, setTime] = useState('');
  const [doctorSchedules, setDoctorSchedules] = useState({});
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const reasons = mode === 'reschedule' ? RESCHEDULE_REASONS : CANCEL_REASONS;
  const title = mode === 'reschedule' ? 'Reschedule Appointment' : 'Cancel Appointment';
  const today = new Date().toISOString().slice(0, 10);

  const availableDoctors = useMemo(
    () => doctors.filter((d) => String(d.availability_status || '').toLowerCase() === 'available' && String(d.status || '').toLowerCase() === 'active'),
    [doctors]
  );

  useEffect(() => {
    if (mode !== 'reschedule' || availableDoctors.length === 0) return;
    if (!doctorId) {
      setDoctorId(String(availableDoctors[0].id));
    }
  }, [mode, availableDoctors, doctorId]);

  useEffect(() => {
    if (mode !== 'reschedule' || !doctorId) return;
    let mounted = true;
    setLoadingSchedules(true);
    api.doctors.getSchedules(doctorId)
      .then((data) => {
        if (!mounted) return;
        const normalized = {};
        for (const [day, sched] of Object.entries(data || {})) {
          normalized[day] = { ...sched, slots: Array.isArray(sched?.slots) ? sched.slots : [] };
        }
        setDoctorSchedules(normalized);
      })
      .catch(() => {
        if (mounted) setDoctorSchedules({});
      })
      .finally(() => {
        if (mounted) setLoadingSchedules(false);
      });
    return () => { mounted = false; };
  }, [mode, doctorId]);

  const availableDates = useMemo(() => {
    if (mode !== 'reschedule') return [];
    return Object.entries(doctorSchedules)
      .filter(([day, sched]) => day >= today && Array.isArray(sched?.slots) && sched.slots.length > 0)
      .filter(([_, sched]) =>
        sched.slots.some((slotRange) => {
          const times = generateSlotTimes(slotRange.start, slotRange.end, slotRange.duration);
          const booked = Number(slotRange.booked || 0);
          return times.some((__, idx) => idx >= booked);
        })
      )
      .map(([day]) => day)
      .sort((a, b) => a.localeCompare(b));
  }, [mode, doctorSchedules, today]);

  useEffect(() => {
    if (mode !== 'reschedule') return;
    if (!date || !availableDates.includes(date)) {
      setDate(availableDates[0] || '');
      setTime('');
    }
  }, [mode, availableDates, date]);

  const availableTimes = useMemo(() => {
    if (mode !== 'reschedule' || !date) return [];
    const sched = doctorSchedules[date];
    if (!sched?.slots) return [];
    const set = new Set();
    sched.slots.forEach((slotRange) => {
      const times = generateSlotTimes(slotRange.start, slotRange.end, slotRange.duration);
      const booked = Number(slotRange.booked || 0);
      times.forEach((t, idx) => {
        if (idx >= booked) set.add(t);
      });
    });
    return Array.from(set).sort((a, b) => toMins(a) - toMins(b));
  }, [mode, doctorSchedules, date]);

  useEffect(() => {
    if (mode !== 'reschedule') return;
    if (!time || !availableTimes.includes(time)) {
      setTime(availableTimes[0] || '');
    }
  }, [mode, availableTimes, time]);

  const submit = () => {
    if (!reason) return;
    if (mode === 'reschedule' && (!doctorId || !date || !time)) return;
    onConfirm({ reason, doctor_id: Number(doctorId), appointment_date: date, appointment_time: time });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-black">{title}</h3>
        <p className="text-xs text-gray-500 mt-1">Please provide a reason before confirming.</p>

        {mode === 'reschedule' && (
          <div className="grid grid-cols-1 gap-3 mt-4">
            <select value={doctorId} onChange={(e) => { setDoctorId(e.target.value); setDate(''); setTime(''); }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="">Select doctor…</option>
              {availableDoctors.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <select value={date} onChange={(e) => { setDate(e.target.value); setTime(''); }} disabled={loadingSchedules || !doctorId} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100">
              <option value="">{loadingSchedules ? 'Loading available dates…' : 'Select available date…'}</option>
              {availableDates.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={time} onChange={(e) => setTime(e.target.value)} disabled={!date} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100">
              <option value="">{date ? 'Select available time…' : 'Pick a date first'}</option>
              {availableTimes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        )}

        <div className="mt-4">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Reason</label>
          <select value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="">Select reason…</option>
            {reasons.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="mt-4 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 border rounded-lg text-sm font-bold">Close</button>
          <button disabled={saving || !reason || (mode === 'reschedule' && (!doctorId || !date || !time))}
            onClick={submit}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold disabled:opacity-50">
            {saving ? 'Saving...' : 'Confirm'}
          </button>
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
  const [doctors, setDoctors] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [rateRecord, setRateRecord] = useState(null);
  const [appointmentAction, setAppointmentAction] = useState(null);
  const [actionSaving, setActionSaving] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [me, appointmentsData, consultationsData, doctorsData] = await Promise.all([
        api.patients.getProfile(),
        api.appointments.getMine(),      // same call used in the working records page
        api.consultations.getAll({}),    // same call used in the working records page
        api.doctors.getAll(),
      ]);
      setProfile(me ?? null);
      setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
      setConsultations(Array.isArray(consultationsData) ? consultationsData : []);
      setDoctors(Array.isArray(doctorsData) ? doctorsData : []);
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

  const reloadAppointments = useCallback(async () => {
    const rows = await api.appointments.getMine();
    setAppointments(Array.isArray(rows) ? rows : []);
  }, []);

  const handleAppointmentAction = useCallback(async (payload) => {
    if (!appointmentAction?.appointment) return;
    setActionSaving(true);
    try {
      if (appointmentAction.mode === 'cancel') {
        await api.appointments.cancel(appointmentAction.appointment.appointment_id, payload.reason);
        toast.success('Appointment cancelled.');
      } else {
        await api.appointments.reschedule(appointmentAction.appointment.appointment_id, {
          doctor_id: payload.doctor_id,
          appointment_date: payload.appointment_date,
          appointment_time: payload.appointment_time,
          reschedule_reason: payload.reason,
        });
        toast.success('Appointment rescheduled.');
      }
      await reloadAppointments();
      setAppointmentAction(null);
    } catch (err) {
      toast.error(err?.message || 'Unable to update appointment.');
    } finally {
      setActionSaving(false);
    }
  }, [appointmentAction, reloadAppointments]);

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
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => setAppointmentAction({ mode: 'reschedule', appointment: apt })}
                            className="px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-xs font-bold"
                          >
                            Reschedule
                          </button>
                          <button
                            onClick={() => setAppointmentAction({ mode: 'cancel', appointment: apt })}
                            className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs font-bold"
                          >
                            Cancel
                          </button>
                        </div>
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
      {appointmentAction && (
        <AppointmentActionModal
          mode={appointmentAction.mode}
          appointment={appointmentAction.appointment}
          onClose={() => setAppointmentAction(null)}
          onConfirm={handleAppointmentAction}
          saving={actionSaving}
          doctors={doctors}
        />
      )}
    </MainLayout>
  );
};

export default PatientDashboard;
