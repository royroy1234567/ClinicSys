import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layouts/MainLayout';
import { api } from '../services/Api';
import { toast } from 'sonner';
import {
  Calendar,
  Clock,
  Stethoscope,
  FileText,
  Shield,
  Eye,
  ChevronRight,
  Search,
  RefreshCw,
} from 'lucide-react';

const STATUS_CFG = {
  completed: { label: 'Completed', cls: 'bg-green-50 text-green-700 border-green-100' },
  ongoing: { label: 'Ongoing', cls: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
  draft: { label: 'Draft', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  cancelled: { label: 'Cancelled', cls: 'bg-red-50 text-red-700 border-red-100' },
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

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString('en-PH', { dateStyle: 'medium' });
};

function RecordModal({ record, onClose, onViewReceipt }) {
  const status = STATUS_CFG[record.status] || STATUS_CFG.completed;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Consultation Record</p>
              <h2 className="text-lg font-black text-gray-900 mt-1">{record.diagnosis || 'No diagnosis set'}</h2>
              <p className="text-xs text-gray-500 mt-1">
                {fmtDate(record.updated_at)} • Dr. {record.doctor_name || 'TBD'}
              </p>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${status.cls}`}>{status.label}</span>
          </div>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Chief Complaint</p>
            <p className="text-sm text-gray-700 mt-1">{record.chief_complaint || 'No chief complaint recorded.'}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Diagnosis</p>
            <p className="text-sm text-gray-700 mt-1">{record.diagnosis || 'No diagnosis recorded.'}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Notes</p>
            <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{record.notes || 'No notes available.'}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Follow-up</p>
            <p className="text-sm text-gray-700 mt-1">
              {record.follow_up_required
                ? `${record.follow_up_date || 'Date pending'}${record.follow_up_notes ? ` — ${record.follow_up_notes}` : ''}`
                : 'No follow-up required'}
            </p>
          </div>
    
          <div>
            {record.receipt_info ? (
              <div className="mt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => onViewReceipt(record.payment_details?.transaction_id)}
                  className="inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100"
                >
                  View Receipt
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-700 mt-1">No receipt generated yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReceiptDetailModal({ transactionId, onClose }) {
  const [tx, setTx] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadReceipt = async () => {
      setLoading(true);
      try {
        const data = await api.transactions.getById(transactionId);
        if (mounted) {
          setTx(data);
        }
      } catch (error) {
        toast.error(error?.message || 'Failed to load receipt details.');
        if (mounted) {
          onClose();
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    if (transactionId) {
      loadReceipt();
    }

    return () => {
      mounted = false;
    };
  }, [transactionId, onClose]);

  if (!transactionId) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-gray-100 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-gray-100 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">POS Receipt Details</p>
          <h3 className="mt-1 text-lg font-black text-gray-900">{tx?.transaction_number || 'Receipt'}</h3>
        </div>
        <div className="max-h-[70vh] space-y-3 overflow-y-auto p-5 text-sm text-gray-700">
          {loading ? (
            <p className="text-sm text-gray-500">Loading receipt...</p>
          ) : (
            <>
              <p><strong>Patient:</strong> {tx?.patient_name || '—'}</p>
              <p><strong>Cashier:</strong> {tx?.staff_name || '—'}</p>
              <p><strong>Issued:</strong> {tx?.created_at ? new Date(tx.created_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}</p>
              <p><strong>Payment:</strong> {String(tx?.payment_method || '—').toUpperCase()}</p>
              <p><strong>Total:</strong> {Number(tx?.total || 0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</p>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs font-bold uppercase text-gray-500">Items</p>
                <div className="mt-2 space-y-2">
                  {(tx?.items || []).map((item) => (
                    <div key={item.item_id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate">{item.service_name} x{item.quantity}</span>
                      <span className="font-semibold text-gray-800">{Number(item.subtotal || 0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="border-t border-gray-100 p-4">
          <button onClick={onClose} className="w-full rounded-lg bg-gray-100 py-2 text-sm font-bold text-gray-700 hover:bg-gray-200">Close</button>
        </div>
      </div>
    </div>
  );
}

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
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-black text-gray-900">Rate Services</h3>
        <p className="text-xs text-gray-500 mt-1">Rate your overall session with Dr. {record.doctor_name || 'TBD'}.</p>
        <div className="mt-4 flex gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} onClick={() => setRating(s)} className={`w-9 h-9 rounded-lg border text-sm font-black ${rating >= s ? 'bg-yellow-400 border-yellow-400 text-white' : 'bg-white border-gray-200 text-gray-500'}`}>{s}</button>
          ))}
        </div>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Optional feedback..."
          className="mt-4 w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
        />
        <div className="mt-4 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-black">{title}</h3>
        <p className="text-xs text-gray-500 mt-1">Please provide a reason before confirming.</p>

        {mode === 'reschedule' && (
          <div className="grid grid-cols-1 gap-3 mt-4">
            <select value={doctorId} onChange={(e) => { setDoctorId(e.target.value); setDate(''); setTime(''); }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="">Select doctor…</option>
              {availableDoctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
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
          <button
            disabled={saving || !reason || (mode === 'reschedule' && (!doctorId || !date || !time))}
            onClick={submit}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PatientMedicalRecordsPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openRecord, setOpenRecord] = useState(null);
  const [rateRecord, setRateRecord] = useState(null);
  const [openReceiptTxId, setOpenReceiptTxId] = useState(null);
  const [appointmentAction, setAppointmentAction] = useState(null);
  const [actionSaving, setActionSaving] = useState(false);
  const [doctors, setDoctors] = useState([]);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [consultRows, aptRows, doctorRows] = await Promise.all([
        api.consultations.getAll({}),
        api.appointments.getMine(),
        api.doctors.getAll(),
      ]);
      setRecords(Array.isArray(consultRows) ? consultRows : []);
      setAppointments(Array.isArray(aptRows) ? aptRows : []);
      setDoctors(Array.isArray(doctorRows) ? doctorRows : []);
    } catch (error) {
      console.error('Failed loading medical records:', error);
      toast.error(error?.message || 'Failed to load medical records.');
      setRecords([]);
      setAppointments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const today = new Date().toISOString().slice(0, 10);

  const nextAppointment = useMemo(
    () => appointments.find((a) => a.status === 'scheduled' && (a.appointment_date ?? '') >= today) || null,
    [appointments, today]
  );
  const followUp = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return [...records]
      .sort((a, b) => String(b.updated_at || '').localeCompare(String(a.updated_at || '')))
      .find((r) =>
      r.follow_up_required &&
      r.follow_up_date &&
      (r.follow_up_expired !== true) &&
      r.follow_up_date >= today
    ) || null;
  }, [records]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        String(r.diagnosis || '').toLowerCase().includes(q) ||
        String(r.doctor_name || '').toLowerCase().includes(q) ||
        String(r.chief_complaint || '').toLowerCase().includes(q)
      );
    });
  }, [records, search, statusFilter]);

  const submitRating = useCallback(async (consultationId, payload) => {
    const updated = await api.consultations.rate(consultationId, payload);
    setRecords((prev) => prev.map((r) => (r.consultation_id === updated.consultation_id ? updated : r)));
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
      <MainLayout title="My Medical Records" subtitle="View your consultation history">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="My Medical Records" subtitle="View your consultation history and health records">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white flex items-center justify-between">
          <div>
            <p className="text-xs text-blue-200 font-semibold uppercase tracking-wide">Personal Health Records</p>
            <h2 className="text-2xl font-black mt-1">My Medical Records</h2>
            <p className="text-sm text-blue-200 mt-1">Records are synced from completed and ongoing consultations.</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-blue-200">Total Records</p>
            <p className="text-4xl font-black">{records.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              Next Upcoming Appointment
            </p>
            <button
              onClick={() => loadData(true)}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          {nextAppointment ? (
            <div className="mt-3">
              <p className="font-bold text-gray-900">{nextAppointment.doctor_name || 'Doctor TBD'}</p>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                {fmtDate(nextAppointment.appointment_date)} at {nextAppointment.appointment_time || '—'}
              </p>
              <p className="text-xs text-gray-400 mt-1 italic">"{nextAppointment.reason || 'No reason provided'}"</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setAppointmentAction({ mode: 'reschedule', appointment: nextAppointment })}
                  className="px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-xs font-bold"
                >
                  Reschedule
                </button>
                <button
                  onClick={() => setAppointmentAction({ mode: 'cancel', appointment: nextAppointment })}
                  className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-3">No upcoming scheduled appointment.</p>
          )}
        </div>

        {followUp && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 -mt-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Follow-up</p>
            <p className="text-sm text-gray-700 mt-2">
              <strong>Follow-up Check-up Date:</strong> {fmtDate(followUp.follow_up_date)}
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
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search diagnosis, doctor, complaint..."
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-72"
            />
          </div>
          {['all', 'completed', 'ongoing', 'draft', 'cancelled'].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border capitalize ${
                statusFilter === f
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <FileText className="w-9 h-9 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No records found.</p>
          </div>
        ) : (
          <div className="max-h-[34rem] space-y-3 overflow-y-auto pr-1">
            {filtered.map((rec) => {
              const status = STATUS_CFG[rec.status] || STATUS_CFG.completed;
              return (
                <button
                  key={rec.consultation_id}
                  onClick={() => setOpenRecord(rec)}
                  className="w-full text-left bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="font-black text-gray-900">{rec.diagnosis || 'No diagnosis'}</p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                        <Stethoscope className="w-3 h-3" /> Dr. {rec.doctor_name || 'TBD'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">{rec.chief_complaint || 'No chief complaint'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${status.cls}`}>{status.label}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${rec.rating_status === 'rated' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        {rec.rating_status === 'rated' ? 'Rated' : 'Not Yet Rated'}
                      </span>
                      <span className="text-[11px] text-blue-600 font-bold inline-flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> View full record <ChevronRight className="w-3 h-3" />
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); setRateRecord(rec); }}
                          disabled={rec.status !== 'completed'}
                          className="text-[11px] px-2.5 py-1 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 font-bold disabled:opacity-50"
                        >
                          Rate Services
                        </button>
                   
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100 text-xs text-blue-700">
          <Shield className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p>
            <strong>Your records are private.</strong> Only your attending doctors and authorized clinic staff can access your medical information.
          </p>
        </div>
      </div>

      {openRecord && (
        <RecordModal
          record={openRecord}
          onClose={() => setOpenRecord(null)}
          onViewReceipt={(transactionId) => {
            if (!transactionId) {
              toast.error('No receipt has been linked to this consultation yet.');
              return;
            }
            setOpenReceiptTxId(transactionId);
          }}
        />
      )}
      {rateRecord && <RatingModal record={rateRecord} onClose={() => setRateRecord(null)} onSubmit={submitRating} />}
      {openReceiptTxId && <ReceiptDetailModal transactionId={openReceiptTxId} onClose={() => setOpenReceiptTxId(null)} />}
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
}
