import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

const NotificationContext = createContext();

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://backend1.test/api';
const POLL_INTERVAL_MS = 45000;
const MAX_NOTIFICATIONS = 20;

const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.appointments)) return payload.appointments;
  if (Array.isArray(payload?.consultations)) return payload.consultations;
  if (Array.isArray(payload?.queue_entries)) return payload.queue_entries;
  if (Array.isArray(payload?.transactions)) return payload.transactions;
  if (Array.isArray(payload?.users)) return payload.users;
  if (Array.isArray(payload?.patients)) return payload.patients;
  return [];
};

const parseDateSafe = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) return d;
  return null;
};

const asDateTime = (dateLike, timeLike) => {
  if (!dateLike && !timeLike) return null;
  if (dateLike && timeLike) {
    const merged = parseDateSafe(`${dateLike}T${timeLike}`);
    if (merged) return merged;
  }
  return parseDateSafe(dateLike || timeLike);
};

const startOfDay = (d) => {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const daysDiff = (a, b) => {
  const ms = startOfDay(a).getTime() - startOfDay(b).getTime();
  return Math.round(ms / 86400000);
};

const timeAgo = (date) => {
  if (!date) return 'Just now';
  const diffMs = Date.now() - date.getTime();
  const mins = Math.max(1, Math.floor(diffMs / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
};

const formatDate = (d) => d?.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) || '';
const formatTime = (d) => d?.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) || '';

const withTimeSort = (items) =>
  items
    .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
    .slice(0, MAX_NOTIFICATIONS)
    .map((n) => ({ ...n, time: timeAgo(n.timestamp) }));

const mk = ({ id, type, title, route, timestamp }) => ({ id, type, title, route, timestamp: timestamp || new Date() });

const buildPatientNotifications = ({ appointments, consultations }) => {
  const now = new Date();
  const rows = [];

  appointments.forEach((a) => {
    const status = String(a.status || '').toLowerCase();
    const when = asDateTime(a.appointment_date || a.date, a.appointment_time || a.time);
    const diff = when ? daysDiff(when, now) : null;

    if (status === 'scheduled' && diff !== null && diff >= 0 && diff <= 3) {
      rows.push(
        mk({
          id: `patient-upcoming-${a.id}-${a.updated_at || a.created_at || when?.toISOString() || ''}`,
          type: 'appointment',
          title: `Upcoming appointment on ${formatDate(when)} at ${formatTime(when)}`,
          route: '/my-appointments',
          timestamp: when,
        })
      );
    }

    if (status === 'cancelled' || status === 'no_show') {
      const stamp = parseDateSafe(a.updated_at) || parseDateSafe(a.created_at) || when;
      rows.push(
        mk({
          id: `patient-status-${a.id}-${status}`,
          type: 'status',
          title: `Your appointment was marked ${status.replace('_', ' ')}`,
          route: '/my-appointments',
          timestamp: stamp,
        })
      );
    }

    if (status === 'completed') {
      const stamp = parseDateSafe(a.updated_at) || when || parseDateSafe(a.created_at);
      rows.push(
        mk({
          id: `patient-completed-${a.id}`,
          type: 'consultation',
          title: 'Consultation completed. You can view details in Medical Records.',
          route: '/records',
          timestamp: stamp,
        })
      );
    }
  });

  consultations
    .filter((c) => !!c.follow_up_required && !!c.follow_up_date)
    .forEach((c) => {
      const followDate = parseDateSafe(c.follow_up_date);
      if (!followDate) return;
      const diff = daysDiff(followDate, now);
      if (diff >= -1 && diff <= 7) {
        rows.push(
          mk({
            id: `patient-followup-${c.id || c.queue_entry_id}-${c.follow_up_date}`,
            type: 'followup',
            title: diff < 0 ? 'Follow-up schedule is overdue. Please contact the clinic.' : `Follow-up due on ${formatDate(followDate)}`,
            route: '/records',
            timestamp: followDate,
          })
        );
      }
    });

  return withTimeSort(rows);
};

const buildDoctorNotifications = ({ appointments, queueEntries, consultations, userId }) => {
  const now = new Date();
  const today = startOfDay(now);
  const rows = [];

  const myTodayAppointments = appointments.filter((a) => {
    const doctorMatch = String(a.doctor_id || '') === String(userId || '');
    const when = asDateTime(a.appointment_date || a.date, a.appointment_time || a.time);
    return doctorMatch && when && startOfDay(when).getTime() === today.getTime() && String(a.status || '').toLowerCase() === 'scheduled';
  });

  if (myTodayAppointments.length > 0) {
    rows.push(
      mk({
        id: `doctor-today-appts-${today.toISOString().slice(0, 10)}`,
        type: 'summary',
        title: `You have ${myTodayAppointments.length} scheduled appointment${myTodayAppointments.length > 1 ? 's' : ''} today.`,
        route: '/schedule',
        timestamp: now,
      })
    );
  }

  const waitingForMe = queueEntries.filter((q) => {
    const status = String(q.status || '').toLowerCase();
    const assigned = String(q.doctor_id || '') === String(userId || '');
    return assigned && (status === 'waiting' || status === 'called');
  });

  if (waitingForMe.length > 0) {
    rows.push(
      mk({
        id: `doctor-queue-${today.toISOString().slice(0, 10)}`,
        type: 'queue',
        title: `${waitingForMe.length} patient${waitingForMe.length > 1 ? 's are' : ' is'} waiting in your queue.`,
        route: '/schedule',
        timestamp: parseDateSafe(waitingForMe[0]?.updated_at || waitingForMe[0]?.created_at) || now,
      })
    );
  }

  consultations
    .filter((c) => String(c.doctor_id || '') === String(userId || '') && !!c.follow_up_required && !!c.follow_up_date)
    .forEach((c) => {
      const followDate = parseDateSafe(c.follow_up_date);
      if (!followDate) return;
      const diff = daysDiff(followDate, now);
      if (diff <= 0) {
        rows.push(
          mk({
            id: `doctor-followup-${c.id || c.queue_entry_id}-${c.follow_up_date}`,
            type: 'followup',
            title: `Follow-up ${diff < 0 ? 'overdue' : 'due today'} for ${c.patient_name || 'a patient'}.`,
            route: '/Doctorpatients',
            timestamp: followDate,
          })
        );
      }
    });

  return withTimeSort(rows);
};

const buildStaffNotifications = ({ appointments, queueEntries, pendingPayments }) => {
  const now = new Date();
  const today = startOfDay(now);
  const rows = [];

  const waiting = queueEntries.filter((q) => {
    const status = String(q.status || '').toLowerCase();
    return status === 'waiting' || status === 'called';
  });

  if (waiting.length > 0) {
    rows.push(
      mk({
        id: `staff-queue-waiting-${today.toISOString().slice(0, 10)}`,
        type: 'queue',
        title: `${waiting.length} patient${waiting.length > 1 ? 's are' : ' is'} waiting in queue.`,
        route: '/queue',
        timestamp: parseDateSafe(waiting[0]?.updated_at || waiting[0]?.created_at) || now,
      })
    );
  }

  const todayAppointments = appointments.filter((a) => {
    const status = String(a.status || '').toLowerCase();
    if (status !== 'scheduled') return false;
    const when = asDateTime(a.appointment_date || a.date, a.appointment_time || a.time);
    return when && startOfDay(when).getTime() === today.getTime();
  });

  if (todayAppointments.length > 0) {
    rows.push(
      mk({
        id: `staff-today-appts-${today.toISOString().slice(0, 10)}`,
        type: 'appointment',
        title: `${todayAppointments.length} scheduled appointment${todayAppointments.length > 1 ? 's' : ''} for today.`,
        route: '/staff-appointments',
        timestamp: now,
      })
    );
  }

  if (pendingPayments.length > 0) {
    rows.push(
      mk({
        id: `staff-pending-payments-${today.toISOString().slice(0, 10)}`,
        type: 'billing',
        title: `${pendingPayments.length} pending payment${pendingPayments.length > 1 ? 's' : ''} in POS.`,
        route: '/pos',
        timestamp: parseDateSafe(pendingPayments[0]?.updated_at || pendingPayments[0]?.created_at) || now,
      })
    );
  }

  return withTimeSort(rows);
};

const buildManagerNotifications = ({ appointments, queueEntries, consultations, patients, users, role }) => {
  const now = new Date();
  const today = startOfDay(now);
  const rows = [];

  const todayAppointments = appointments.filter((a) => {
    const when = asDateTime(a.appointment_date || a.date, a.appointment_time || a.time);
    return when && startOfDay(when).getTime() === today.getTime() && String(a.status || '').toLowerCase() === 'scheduled';
  });

  if (todayAppointments.length > 0) {
    rows.push(
      mk({
        id: `manager-today-appts-${today.toISOString().slice(0, 10)}`,
        type: 'appointment',
        title: `${todayAppointments.length} active appointment${todayAppointments.length > 1 ? 's' : ''} scheduled today.`,
        route: '/appointments',
        timestamp: now,
      })
    );
  }

  const waiting = queueEntries.filter((q) => ['waiting', 'called'].includes(String(q.status || '').toLowerCase()));
  if (waiting.length > 0) {
    rows.push(
      mk({
        id: `manager-queue-waiting-${today.toISOString().slice(0, 10)}`,
        type: 'queue',
        title: `${waiting.length} patient${waiting.length > 1 ? 's are' : ' is'} waiting in queue.`,
        route: '/appointments',
        timestamp: parseDateSafe(waiting[0]?.updated_at || waiting[0]?.created_at) || now,
      })
    );
  }

  const overdueFollowups = consultations.filter((c) => {
    if (!c.follow_up_required || !c.follow_up_date) return false;
    const d = parseDateSafe(c.follow_up_date);
    return d && daysDiff(d, now) < 0;
  });

  if (overdueFollowups.length > 0) {
    rows.push(
      mk({
        id: `manager-followup-overdue-${today.toISOString().slice(0, 10)}`,
        type: 'followup',
        title: `${overdueFollowups.length} follow-up${overdueFollowups.length > 1 ? 's are' : ' is'} overdue.`,
        route: '/appointments',
        timestamp: now,
      })
    );
  }

  const newPatientsToday = patients.filter((p) => {
    const d = parseDateSafe(p.created_at);
    return d && startOfDay(d).getTime() === today.getTime();
  });

  if (newPatientsToday.length > 0) {
    rows.push(
      mk({
        id: `manager-new-patients-${today.toISOString().slice(0, 10)}`,
        type: 'patient',
        title: `${newPatientsToday.length} new patient${newPatientsToday.length > 1 ? 's were' : ' was'} registered today.`,
        route: '/patients',
        timestamp: parseDateSafe(newPatientsToday[0]?.created_at) || now,
      })
    );
  }

  if (role === 'admin') {
    const newUsersToday = users.filter((u) => {
      const d = parseDateSafe(u.created_at);
      return d && startOfDay(d).getTime() === today.getTime();
    });

    if (newUsersToday.length > 0) {
      rows.push(
        mk({
          id: `admin-new-users-${today.toISOString().slice(0, 10)}`,
          type: 'user',
          title: `${newUsersToday.length} user account${newUsersToday.length > 1 ? 's were' : ' was'} created today.`,
          route: '/acc-management',
          timestamp: parseDateSafe(newUsersToday[0]?.created_at) || now,
        })
      );
    }
  }

  return withTimeSort(rows);
};

const endpoint = {
  appointments: '/appointments',
  consultations: '/consultations',
  patients: '/patients',
  users: '/users',
  pendingPayments: '/transactions/pending-payments',
};

const useTodayQueueEndpoint = () => {
  const today = new Date().toISOString().slice(0, 10);
  return `/queue-entries?date=${today}`;
};

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [readMap, setReadMap] = useState({});
  const [loading, setLoading] = useState(false);

  const queueEndpoint = useTodayQueueEndpoint();

  const readStorageKey = useMemo(() => {
    if (!user) return null;
    return `clinicsys_notifications_read_${user.role}_${user.id || user.user_id || 'session'}`;
  }, [user]);

  useEffect(() => {
    if (!readStorageKey) {
      setReadMap({});
      return;
    }
    try {
      const parsed = JSON.parse(localStorage.getItem(readStorageKey) || '{}');
      if (parsed && typeof parsed === 'object') setReadMap(parsed);
      else setReadMap({});
    } catch {
      setReadMap({});
    }
  }, [readStorageKey]);

  useEffect(() => {
    if (!readStorageKey) return;
    localStorage.setItem(readStorageKey, JSON.stringify(readMap));
  }, [readMap, readStorageKey]);

  const attachReadState = useCallback((items) => {
    return items.map((n) => ({ ...n, read: !!readMap[n.id] }));
  }, [readMap]);

  useEffect(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: !!readMap[n.id] })));
  }, [readMap]);

  const markAsRead = useCallback((id) => {
    setReadMap((prev) => ({ ...prev, [id]: true }));
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllRead = useCallback(() => {
    setReadMap((prev) => {
      const next = { ...prev };
      notifications.forEach((n) => {
        next[n.id] = true;
      });
      return next;
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [notifications]);

  const fetchJson = useCallback(async (path, token) => {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error('fetch_failed');
    const payload = await res.json();
    return toArray(payload);
  }, []);

  const fetchWithFallback = useCallback(async (path, token) => {
    try {
      return await fetchJson(path, token);
    } catch {
      return [];
    }
  }, [fetchJson]);

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setNotifications([]);
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      setNotifications([]);
      return;
    }

    setLoading(true);
    try {
      const role = String(user.role || '').toLowerCase();
      let items = [];

      if (role === 'patient') {
        const [appointments, consultations] = await Promise.all([
          fetchWithFallback(endpoint.appointments, token),
          fetchWithFallback(endpoint.consultations, token),
        ]);
        items = buildPatientNotifications({ appointments, consultations });
      } else if (role === 'doctor') {
        const [appointments, queueEntries, consultations] = await Promise.all([
          fetchWithFallback(endpoint.appointments, token),
          fetchWithFallback(queueEndpoint, token),
          fetchWithFallback(endpoint.consultations, token),
        ]);
        items = buildDoctorNotifications({
          appointments,
          queueEntries,
          consultations,
          userId: user.id || user.user_id,
        });
      } else if (role === 'staff') {
        const [appointments, queueEntries, pendingPayments] = await Promise.all([
          fetchWithFallback(endpoint.appointments, token),
          fetchWithFallback(queueEndpoint, token),
          fetchWithFallback(endpoint.pendingPayments, token),
        ]);
        items = buildStaffNotifications({ appointments, queueEntries, pendingPayments });
      } else if (role === 'manager' || role === 'admin') {
        const [appointments, queueEntries, consultations, patients, users] = await Promise.all([
          fetchWithFallback(endpoint.appointments, token),
          fetchWithFallback(queueEndpoint, token),
          fetchWithFallback(endpoint.consultations, token),
          fetchWithFallback(endpoint.patients, token),
          role === 'admin' ? fetchWithFallback(endpoint.users, token) : Promise.resolve([]),
        ]);
        items = buildManagerNotifications({
          appointments,
          queueEntries,
          consultations,
          patients,
          users,
          role,
        });
      }

      setNotifications(attachReadState(items));
    } finally {
      setLoading(false);
    }
  }, [attachReadState, fetchWithFallback, isAuthenticated, queueEndpoint, user]);

  useEffect(() => {
    let timerId = null;

    refresh();
    if (isAuthenticated) {
      timerId = window.setInterval(refresh, POLL_INTERVAL_MS);
    }

    return () => {
      if (timerId) window.clearInterval(timerId);
    };
  }, [refresh, isAuthenticated]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
      loading,
      refresh,
      markAsRead,
      markAllRead,
    }),
    [loading, markAllRead, markAsRead, notifications, refresh]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
