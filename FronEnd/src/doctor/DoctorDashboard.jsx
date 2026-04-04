import React, { useEffect, useMemo, useState } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Calendar, Clock, CheckCircle2, Bell, Users, PlayCircle,
  RefreshCw, TrendingUp, Activity, AlertCircle, ArrowUpRight,
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/Api';
import {
  LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const TODAY = new Date().toISOString().slice(0, 10);
const TODAY_STR = new Date().toLocaleDateString('en-PH', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
});

const fmtTime = (t) => {
  if (!t) return '—';
  const [h, m] = String(t).slice(0, 5).split(':');
  const hr = parseInt(h, 10);
  return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
};

const STATUS_MAP = {
  waiting: 'scheduled',
  called: 'called',
  ongoing: 'ongoing',
  completed: 'completed',
  no_show: 'no_show',
};

const STATUS_UI = {
  scheduled: { label: 'Scheduled', dotColor: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50' },
  called: { label: 'Called', dotColor: 'bg-indigo-500', textColor: 'text-indigo-700', bgColor: 'bg-indigo-50' },
  ongoing: { label: 'Ongoing', dotColor: 'bg-yellow-500', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50' },
  completed: { label: 'Completed', dotColor: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-50' },
  no_show: { label: 'No-show', dotColor: 'bg-red-500', textColor: 'text-red-600', bgColor: 'bg-red-50' },
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-xs min-w-[120px]">
      <p className="font-bold text-gray-700 mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span style={{ color: p.color || p.fill }} className="font-semibold">{p.name}</span>
          <span className="font-bold text-gray-800">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const StatusPill = ({ status }) => {
  const s = STATUS_UI[status] || STATUS_UI.scheduled;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${s.bgColor} ${s.textColor}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dotColor} ${status === 'ongoing' ? 'animate-pulse' : ''}`} />
      {s.label}
    </span>
  );
};

export default function DoctorDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const doctorId = user?.user_id;
  const doctorName = user ? `Dr. ${user.first_name ?? ''} ${user.last_name ?? ''}`.replace(/\s+/g, ' ').trim() : 'Doctor';

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!doctorId) return;
    try {
      const queueRows = await api.queue.getAll(TODAY);
      const doctorRows = (Array.isArray(queueRows) ? queueRows : [])
        .filter((r) => Number(r.doctor_id) === Number(doctorId))
        .map((r) => ({
          id: r.queue_entry_id,
          queue: Number(r.queue_number ?? 0),
          time: String(r.arrival_time || '').slice(0, 5),
          patient: r.patient_name || 'Unknown',
          contact: r.patient_contact || '—',
          status: STATUS_MAP[String(r.status || '').toLowerCase().replace('-', '_')] || 'scheduled',
          source: r.source || 'walk-in',
        }));
      setRows(doctorRows);
    } catch (e) {
      toast({ title: 'Failed to load dashboard', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const t = setInterval(loadData, 8000);
    return () => clearInterval(t);
  }, [doctorId]);

  const visible = useMemo(() => rows, [rows]);

  const todayTotal = rows.length;
  const completedN = rows.filter((r) => r.status === 'completed').length;
  const ongoingApt = rows.find((r) => r.status === 'ongoing');
  const followups = rows.filter((r) => r.status === 'completed');
  const followupN = followups.length;
  const overdueN = 0;

  const thisWeek = useMemo(() => rows.filter((r) => ['completed', 'ongoing', 'called', 'scheduled'].includes(r.status)).length, [rows]);

  const statusData = useMemo(() => {
    const keys = ['completed', 'scheduled', 'called', 'ongoing', 'no_show'];
    const labels = { completed: 'Completed', scheduled: 'Waiting', called: 'Called', ongoing: 'Ongoing', no_show: 'No-show' };
    const colors = { completed: '#22c55e', scheduled: '#3b82f6', called: '#6366f1', ongoing: '#f59e0b', no_show: '#9ca3af' };
    return keys.map((k) => ({ name: labels[k], value: rows.filter((r) => r.status === k).length, color: colors[k] }));
  }, [rows]);

  const weeklyData = useMemo(() => {
    const out = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ymd = d.toISOString().slice(0, 10);
      out.push({ day: d.toLocaleDateString('en-PH', { weekday: 'short' }), count: ymd === TODAY ? rows.length : 0 });
    }
    return out;
  }, [rows]);

  const hourlyData = useMemo(() => {
    const buckets = {};
    rows.forEach((r) => {
      const hour = Number(String(r.time || '00:00').slice(0, 2));
      const key = Number.isFinite(hour) ? `${String(hour).padStart(2, '0')}:00` : '00:00';
      buckets[key] = (buckets[key] || 0) + 1;
    });
    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([hour, count]) => ({ hour, count }));
  }, [rows]);

  const handleRefresh = () => {
    setLoading(true);
    loadData();
    toast({ title: 'Dashboard refreshed', description: 'Latest queue data loaded.' });
  };

  return (
    <MainLayout title="Doctor Dashboard" subtitle={`${doctorName} · ${TODAY_STR}`}>
      <div className="space-y-6">
        <div className="flex items-center gap-2 flex-wrap">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200 gap-2">
            <Calendar className="w-4 h-4" /> Today&apos;s Queue
          </Button>
          <div className="flex-1" />
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-600 transition-colors font-medium px-3 py-2 rounded-xl border border-gray-200 hover:border-blue-300 bg-white"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden relative">
            <CardContent className="p-5 relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-blue-100 uppercase tracking-wider">Today&apos;s Queue</p>
                  <p className="text-4xl font-black mt-1">{todayTotal}</p>
                  <p className="text-xs text-blue-200 mt-1">Assigned to you</p>
                </div>
                <div className="p-2.5 rounded-2xl bg-white/20"><Calendar className="w-5 h-5 text-white" /></div>
              </div>
            </CardContent>
          </Card>

          <Card className={`border shadow-sm overflow-hidden relative ${ongoingApt ? 'border-yellow-200 bg-yellow-50' : 'border-gray-100'}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ongoing</p>
                  <p className={`text-base font-black mt-1 truncate ${ongoingApt ? 'text-yellow-700' : 'text-gray-300'}`}>
                    {ongoingApt ? ongoingApt.patient.split(' ')[0] : 'None'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {ongoingApt ? `Queue #${ongoingApt.queue} · ${fmtTime(ongoingApt.time)}` : 'No active patient'}
                  </p>
                </div>
                <div className={`p-2.5 rounded-2xl flex-shrink-0 ${ongoingApt ? 'bg-yellow-100' : 'bg-gray-50'}`}>
                  <PlayCircle className={`w-5 h-5 ${ongoingApt ? 'text-yellow-600' : 'text-gray-300'}`} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-100 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Completed</p>
                  <p className="text-4xl font-black text-gray-900 mt-1">{completedN}</p>
                  <p className="text-xs text-gray-400 mt-1">{todayTotal ? Math.round((completedN / todayTotal) * 100) : 0}% done</p>
                </div>
                <div className="p-2.5 rounded-2xl bg-green-50"><CheckCircle2 className="w-5 h-5 text-green-600" /></div>
              </div>
            </CardContent>
          </Card>

          <Card className={`border shadow-sm ${overdueN > 0 ? 'border-red-200' : 'border-gray-100'}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Follow-ups</p>
                  <p className="text-4xl font-black text-gray-900 mt-1">{followupN}</p>
                </div>
                <div className="p-2.5 rounded-2xl bg-orange-50"><Bell className="w-5 h-5 text-orange-500" /></div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-100 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">This Week</p>
                  <p className="text-4xl font-black text-gray-900 mt-1">{thisWeek}</p>
                  <p className="text-xs text-green-600 font-bold mt-1 flex items-center gap-0.5">
                    <ArrowUpRight className="w-3 h-3" /> Live queue based
                  </p>
                </div>
                <div className="p-2.5 rounded-2xl bg-purple-50"><Users className="w-5 h-5 text-purple-600" /></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="pb-1 pt-5 px-5">
              <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" /> Weekly Queue Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={weeklyData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="count" name="Queue" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3, fill: '#3b82f6' }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="pb-1 pt-5 px-5">
              <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" /> Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={statusData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="value" name="Count" radius={[5, 5, 0, 0]} maxBarSize={36}>
                    {statusData.map((e) => <Cell key={e.name} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="pb-1 pt-5 px-5">
              <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" /> Queue by Arrival Hour
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={hourlyData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" name="Patients" radius={[5, 5, 0, 0]} fill="#0ea5e9" maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-gray-800">Today&apos;s Patients</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="text-sm text-gray-400 py-8 text-center">Loading dashboard...</div>
            ) : visible.length === 0 ? (
              <div className="text-sm text-gray-400 py-8 text-center">No assigned patients found.</div>
            ) : (
              <div className="space-y-2">
                {visible.map((r) => (
                  <div key={r.id} className="border border-gray-100 rounded-xl p-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{r.patient}</p>
                      <p className="text-xs text-gray-400">Queue #{r.queue} · {fmtTime(r.time)} · {r.source}</p>
                    </div>
                    <StatusPill status={r.status} />
                  </div>
                ))}
              </div>
            )}
            {!loading && todayTotal === 0 && (
              <p className="text-xs text-amber-600 mt-3 flex items-center gap-1.5">
                <AlertCircle className="w-3 h-3" /> No queue entries assigned for today.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
