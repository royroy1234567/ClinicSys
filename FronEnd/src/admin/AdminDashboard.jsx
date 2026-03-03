import React, { useEffect, useState } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Calendar, Clock, Users, UserCheck, TrendingUp, Activity,
  ArrowUpRight, ArrowDownRight, CalendarDays,
} from 'lucide-react';
import { api } from '../services/Api';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

/* ── palette ── */
const BLUE   = '#2563EB';
const GREEN  = '#16A34A';
const YELLOW = '#F59E0B';
const RED    = '#DC2626';
const TEAL   = '#0D9488';
const GRAY   = '#94A3B8';
const PURPLE = '#7C3AED';

/* ══ Date range filter options ══ */
const DATE_FILTERS = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
];

/* ── KPI card ── */
const KPICard = ({ label, value, sub, icon: Icon, iconBg, iconColor, trend, trendLabel }) => (
  <Card>
    <CardContent className="p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
          <h3 className="text-3xl font-bold text-gray-900 mt-1">{value}</h3>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {trend >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {Math.abs(trend)}% {trendLabel}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${iconBg}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

/* ── Custom tooltip ── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

/* ── Pie custom label ── */
const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  if (percent < 0.07) return null;
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

/* ══════════════════ PERIOD-AWARE DEMO DATA ══════════════════ */

const TREND_DATA = {
  today: [
    { day: '8 AM',  appointments: 3, completed: 3, cancelled: 0 },
    { day: '9 AM',  appointments: 5, completed: 5, cancelled: 0 },
    { day: '10 AM', appointments: 4, completed: 3, cancelled: 1 },
    { day: '11 AM', appointments: 6, completed: 5, cancelled: 1 },
    { day: '1 PM',  appointments: 4, completed: 2, cancelled: 0 },
    { day: '2 PM',  appointments: 5, completed: 2, cancelled: 0 },
    { day: '3 PM',  appointments: 3, completed: 1, cancelled: 0 },
  ],
  week: [
    { day: 'Mon', appointments: 12, completed: 10, cancelled: 2 },
    { day: 'Tue', appointments: 18, completed: 15, cancelled: 3 },
    { day: 'Wed', appointments: 14, completed: 12, cancelled: 2 },
    { day: 'Thu', appointments: 22, completed: 19, cancelled: 3 },
    { day: 'Fri', appointments: 20, completed: 16, cancelled: 4 },
    { day: 'Sat', appointments: 9,  completed: 8,  cancelled: 1 },
  ],
  month: [
    { day: 'Week 1', appointments: 68, completed: 58, cancelled: 10 },
    { day: 'Week 2', appointments: 74, completed: 65, cancelled: 9  },
    { day: 'Week 3', appointments: 82, completed: 70, cancelled: 12 },
    { day: 'Week 4', appointments: 79, completed: 68, cancelled: 11 },
  ],
};

const KPI_DATA = {
  today: { total: 30,  completed: 19,  pending: 9,  patients: 423, doctors: 5, cancelled: 2,  trend: { total: 8,   comp: 5,   pend: -2,  pat: 12, canc: -3  } },
  week:  { total: 95,  completed: 80,  pending: 10, patients: 423, doctors: 5, cancelled: 5,  trend: { total: 14,  comp: 11,  pend: -5,  pat: 12, canc: -8  } },
  month: { total: 303, completed: 261, pending: 24, patients: 423, doctors: 5, cancelled: 18, trend: { total: 22,  comp: 18,  pend: -10, pat: 12, canc: -15 } },
};

const STATUS_DATA = {
  today: [
    { name: 'Completed', value: 19, fill: GREEN  },
    { name: 'Scheduled', value: 8,  fill: BLUE   },
    { name: 'Ongoing',   value: 1,  fill: YELLOW },
    { name: 'Cancelled', value: 2,  fill: RED    },
  ],
  week: [
    { name: 'Completed', value: 80, fill: GREEN  },
    { name: 'Scheduled', value: 45, fill: BLUE   },
    { name: 'Ongoing',   value: 12, fill: YELLOW },
    { name: 'Cancelled', value: 18, fill: RED    },
    { name: 'No Show',   value: 6,  fill: GRAY   },
  ],
  month: [
    { name: 'Completed', value: 261, fill: GREEN  },
    { name: 'Scheduled', value: 42,  fill: BLUE   },
    { name: 'Ongoing',   value: 6,   fill: YELLOW },
    { name: 'Cancelled', value: 61,  fill: RED    },
    { name: 'No Show',   value: 22,  fill: GRAY   },
  ],
};

const WORKLOAD_DATA = {
  today: [
    { doctor: 'Dr. Smith',  appointments: 8  },
    { doctor: 'Dr. Chen',   appointments: 7  },
    { doctor: 'Dr. Torres', appointments: 5  },
    { doctor: 'Dr. Lim',    appointments: 6  },
    { doctor: 'Dr. Reyes',  appointments: 4  },
  ],
  week: [
    { doctor: 'Dr. Smith',  appointments: 14 },
    { doctor: 'Dr. Chen',   appointments: 11 },
    { doctor: 'Dr. Torres', appointments: 9  },
    { doctor: 'Dr. Lim',    appointments: 16 },
    { doctor: 'Dr. Reyes',  appointments: 7  },
  ],
  month: [
    { doctor: 'Dr. Smith',  appointments: 68 },
    { doctor: 'Dr. Chen',   appointments: 55 },
    { doctor: 'Dr. Torres', appointments: 47 },
    { doctor: 'Dr. Lim',    appointments: 73 },
    { doctor: 'Dr. Reyes',  appointments: 38 },
  ],
};

const PATIENT_TYPE_DATA = {
  today: [
    { name: 'New Patients', value: 8,  fill: BLUE   },
    { name: 'Returning',    value: 18, fill: TEAL   },
    { name: 'Walk-in',      value: 4,  fill: YELLOW },
  ],
  week: [
    { name: 'New Patients', value: 38, fill: BLUE   },
    { name: 'Returning',    value: 52, fill: TEAL   },
    { name: 'Walk-in',      value: 10, fill: YELLOW },
  ],
  month: [
    { name: 'New Patients', value: 112, fill: BLUE   },
    { name: 'Returning',    value: 160, fill: TEAL   },
    { name: 'Walk-in',      value: 31,  fill: YELLOW },
  ],
};

const DEMO_MONTHLY_GROWTH = [
  { month: 'Oct', patients: 120, appointments: 210 },
  { month: 'Nov', patients: 135, appointments: 230 },
  { month: 'Dec', patients: 118, appointments: 195 },
  { month: 'Jan', patients: 148, appointments: 260 },
  { month: 'Feb', patients: 160, appointments: 285 },
  { month: 'Mar', patients: 175, appointments: 310 },
];

const TREND_TITLE = {
  today: 'Hourly Appointment Trend (Today)',
  week:  'Daily Appointment Trend (This Week)',
  month: 'Weekly Appointment Trend (This Month)',
};

/* ══════════════════ MAIN COMPONENT ══════════════════ */
const AdminDashboard = () => {
  const [loading,   setLoading]   = useState(true);
  const [dateRange, setDateRange] = useState('week');
  const navigate = useNavigate();

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        api.appointments.getAll({ date: today }),
        api.patients.getAll(),
        api.doctors.getAll(),
      ]);
    } catch {
      /* silently use demo data */
    } finally {
      setLoading(false);
    }
  };

  const kpi         = KPI_DATA[dateRange];
  const trendData   = TREND_DATA[dateRange];
  const statusData  = STATUS_DATA[dateRange];
  const workload    = WORKLOAD_DATA[dateRange];
  const patientType = PATIENT_TYPE_DATA[dateRange];
  const trendLabel  = kpi.trend;
  const compLabel   = dateRange === 'today' ? 'vs yesterday' : dateRange === 'week' ? 'vs last week' : 'vs last month';

  if (loading) {
    return (
      <MainLayout title="Admin Dashboard" subtitle="Clinic performance overview">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Admin Dashboard" subtitle="Clinic performance overview">
      <div className="space-y-6">

        {/* ══ DATE RANGE FILTER ══ */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
            <CalendarDays className="w-4 h-4 text-gray-400 ml-2" />
            {DATE_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setDateRange(f.key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150
                  ${dateRange === f.key
                    ? 'bg-white text-blue-600 shadow-sm shadow-blue-100'
                    : 'text-gray-500 hover:text-gray-700'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400">
            Showing data for: <span className="font-semibold text-gray-600">{DATE_FILTERS.find(f => f.key === dateRange)?.label}</span>
          </p>
        </div>

        {/* ══ 1. KPI CARDS ══ */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KPICard label="Total Appointments" value={kpi.total}     sub={DATE_FILTERS.find(f=>f.key===dateRange)?.label.toLowerCase()} icon={Calendar}   iconBg="bg-blue-50"   iconColor="text-blue-600"   trend={trendLabel.total} trendLabel={compLabel} />
          <KPICard label="Completed"           value={kpi.completed} sub="appointments"  icon={UserCheck}  iconBg="bg-green-50"  iconColor="text-green-600"  trend={trendLabel.comp}  trendLabel={compLabel} />
          <KPICard label="Pending"             value={kpi.pending}   sub="remaining"     icon={Clock}      iconBg="bg-yellow-50" iconColor="text-yellow-600" trend={trendLabel.pend}  trendLabel={compLabel} />
          <KPICard label="Total Patients"      value={kpi.patients}  sub="registered"    icon={Users}      iconBg="bg-teal-50"   iconColor="text-teal-600"   trend={trendLabel.pat}   trendLabel="this month" />
          <KPICard label="Active Doctors"      value={kpi.doctors}   sub="on roster"     icon={Activity}   iconBg="bg-purple-50" iconColor="text-purple-600" />
          <KPICard label="Cancelled"           value={kpi.cancelled} sub="appointments"  icon={TrendingUp} iconBg="bg-red-50"    iconColor="text-red-500"    trend={trendLabel.canc}  trendLabel={compLabel} />
        </div>

        {/* ══ 2. TREND LINE CHART ══ */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{TREND_TITLE[dateRange]}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData} margin={{ top: 4, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="appointments" stroke={BLUE}  strokeWidth={2.5} dot={{ r: 4 }} name="Total" />
                <Line type="monotone" dataKey="completed"    stroke={GREEN} strokeWidth={2.5} dot={{ r: 4 }} name="Completed" />
                <Line type="monotone" dataKey="cancelled"    stroke={RED}   strokeWidth={2}   dot={{ r: 4 }} strokeDasharray="4 2" name="Cancelled" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ══ 3. STATUS BAR + DOCTOR WORKLOAD ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Appointment Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={statusData} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="value" radius={[6,6,0,0]} name="Count">
                    {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Doctor Workload ({DATE_FILTERS.find(f=>f.key===dateRange)?.label})</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={workload} layout="vertical" margin={{ top: 4, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="doctor" type="category" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="appointments" fill={BLUE} radius={[0,6,6,0]} name="Appointments" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* ══ 4. PATIENT TYPE PIE + MONTHLY GROWTH ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Patient Type Distribution ({DATE_FILTERS.find(f=>f.key===dateRange)?.label})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="55%" height={200}>
                  <PieChart>
                    <Pie data={patientType} cx="50%" cy="50%" outerRadius={90} dataKey="value" labelLine={false} label={<PieLabel />}>
                      {patientType.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-3">
                  {patientType.map(d => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.fill }} />
                      <div>
                        <p className="text-xs font-semibold text-gray-700">{d.name}</p>
                        <p className="text-xs text-gray-400">{d.value} patients</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monthly Growth (Last 6 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={DEMO_MONTHLY_GROWTH} margin={{ top: 4, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="patients"     stroke={TEAL} strokeWidth={2.5} dot={{ r: 3 }} name="Patients" />
                  <Line type="monotone" dataKey="appointments" stroke={BLUE} strokeWidth={2.5} dot={{ r: 3 }} name="Appointments" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

      </div>
    </MainLayout>
  );
};

export default AdminDashboard;