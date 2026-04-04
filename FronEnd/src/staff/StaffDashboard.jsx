import React, { useEffect, useMemo, useState } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { RefreshCw, Activity, TrendingUp, CircleDot, Users, Clock3, DollarSign, BarChart3 } from 'lucide-react';
import { api } from '../services/Api';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from 'recharts';

const money = (n) => Number(n || 0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
const dayKey = (d) => d.toISOString().slice(0, 10);

export default function StaffDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [queueRows, setQueueRows] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const today = dayKey(new Date());
      const [aptRows, qRows, txRows] = await Promise.all([
        api.appointments.getMine(),
        api.queue.getAll(today),
        fetch(`${import.meta.env.VITE_API_URL ?? 'http://backend1.test/api'}/transactions`, {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
        }).then((r) => (r.ok ? r.json() : [])),
      ]);
      setAppointments(Array.isArray(aptRows) ? aptRows : []);
      setQueueRows(Array.isArray(qRows) ? qRows : []);
      setTransactions(Array.isArray(txRows) ? txRows : []);
    } catch (e) {
      console.error('Failed loading staff dashboard data:', e);
      setAppointments([]);
      setQueueRows([]);
      setTransactions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const t = setInterval(() => loadData(true), 10000);
    return () => clearInterval(t);
  }, []);

  const statusOverview = useMemo(() => ({
    waiting: queueRows.filter((q) => q.status === 'waiting').length,
    inQueue: queueRows.filter((q) => q.status === 'called').length,
    ongoing: queueRows.filter((q) => q.status === 'ongoing').length,
    completed: queueRows.filter((q) => q.status === 'completed').length,
    noShow: queueRows.filter((q) => q.status === 'no_show').length,
  }), [queueRows]);

  const dailyPatientVolume = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = dayKey(d);
      const fromAppointments = appointments.filter((a) => a.appointment_date === key).length;
      const fromWalkins = queueRows.filter((q) => q.queue_date === key && q.source === 'walkin').length;
      return { key, label: key.slice(5), count: fromAppointments + fromWalkins };
    });
  }, [appointments, queueRows]);

  const { dailyRevenue, weeklyRevenue } = useMemo(() => {
    const today = dayKey(new Date());
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    const daily = transactions
      .filter((t) => String(t.created_at || '').slice(0, 10) === today)
      .reduce((s, t) => s + Number(t.total || 0), 0);
    const weekly = transactions
      .filter((t) => new Date(t.created_at) >= weekStart)
      .reduce((s, t) => s + Number(t.total || 0), 0);
    return { dailyRevenue: daily, weeklyRevenue: weekly };
  }, [transactions]);

  const topServices = useMemo(() => {
    return Object.values(
      transactions
        .flatMap((t) => t.items || [])
        .reduce((acc, item) => {
          const key = item.service_name || 'Unknown';
          if (!acc[key]) acc[key] = { name: key, qty: 0 };
          acc[key].qty += Number(item.quantity || 0);
          return acc;
        }, {})
    )
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [transactions]);

  const revenueSeries = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = dayKey(d);
      return {
        key,
        label: key.slice(5),
        value: transactions
          .filter((t) => String(t.created_at || '').slice(0, 10) === key)
          .reduce((s, t) => s + Number(t.total || 0), 0),
      };
    });
  }, [transactions]);

  const totalTodayPatients = useMemo(
    () => statusOverview.waiting + statusOverview.inQueue + statusOverview.ongoing + statusOverview.completed + statusOverview.noShow,
    [statusOverview]
  );
  const statusChartData = [
    { name: 'Waiting', value: statusOverview.waiting, color: '#f59e0b' },
    { name: 'In Queue', value: statusOverview.inQueue, color: '#3b82f6' },
    { name: 'Ongoing', value: statusOverview.ongoing, color: '#22c55e' },
    { name: 'Completed', value: statusOverview.completed, color: '#64748b' },
    { name: 'No Show', value: statusOverview.noShow, color: '#ef4444' },
  ];

  if (loading) {
    return (
      <MainLayout title="Staff Dashboard" subtitle="Queue and operations overview">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Staff Dashboard" subtitle="Queue and operations overview">
      <div className="space-y-5">


        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-gray-500 uppercase font-semibold">Patients Today</p><p className="text-2xl font-black mt-1">{totalTodayPatients}</p></div><div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Users className="w-5 h-5 text-blue-600" /></div></div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-gray-500 uppercase font-semibold">Active Queue</p><p className="text-2xl font-black mt-1">{statusOverview.waiting + statusOverview.inQueue + statusOverview.ongoing}</p></div><div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center"><Clock3 className="w-5 h-5 text-amber-600" /></div></div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-gray-500 uppercase font-semibold">Daily Revenue</p><p className="text-2xl font-black mt-1">{money(dailyRevenue)}</p></div><div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><DollarSign className="w-5 h-5 text-emerald-600" /></div></div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-gray-500 uppercase font-semibold">Weekly Revenue</p><p className="text-2xl font-black mt-1">{money(weeklyRevenue)}</p></div><div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center"><BarChart3 className="w-5 h-5 text-violet-600" /></div></div></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Daily Patient Volume (7 days)</CardTitle></CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyPatientVolume}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Consultation Status Overview</CardTitle></CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    label
                  >
                    {statusChartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm inline-flex items-center gap-2"><TrendingUp className="w-4 h-4" />Revenue Overview</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-gray-700">Daily earnings: <strong>{money(dailyRevenue)}</strong></p>
              <p className="text-sm text-gray-700">Weekly earnings: <strong>{money(weeklyRevenue)}</strong></p>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip formatter={(v) => money(v)} />
                    <Area type="monotone" dataKey="value" stroke="#16a34a" fill="#86efac" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm inline-flex items-center gap-2"><Activity className="w-4 h-4" />Top Services</CardTitle></CardHeader>
            <CardContent>
              {topServices.length === 0 ? (
                <p className="text-sm text-gray-500">No service activity yet.</p>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topServices}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" hide />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="qty" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
