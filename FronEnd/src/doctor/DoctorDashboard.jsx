import React, { useState, useEffect, useMemo } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Calendar, Clock, CheckCircle2, Bell, Users, PlayCircle,
  XCircle, Search, RefreshCw, ChevronRight, Stethoscope,
  Phone, FileText, Eye, Plus, TrendingUp, Activity, User,
  AlertCircle, ClipboardList, Sparkles, ArrowUpRight,
  ChevronDown, CheckSquare, LayoutGrid,
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

/* ═══════════════════════════════════════════════
   DEMO DATA
═══════════════════════════════════════════════ */
const TODAY_STR = new Date().toLocaleDateString('en-PH', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
});

const DOCTOR = { name: 'Dr. Sarah Smith', specialty: 'General Medicine', avatar: 'SS' };

const INIT_APPOINTMENTS = [
  { id:'APT-001', time:'08:00', end:'08:30', patient:'John Doe',       age:45, contact:'+63 912 111 0001', queue:1,  status:'completed', diagnosis:'Hypertension monitoring',    type:'Chronic' },
  { id:'APT-002', time:'08:30', end:'09:00', patient:'Jane Smith',     age:32, contact:'+63 912 111 0002', queue:2,  status:'completed', diagnosis:'Diabetes follow-up',         type:'Chronic' },
  { id:'APT-003', time:'09:00', end:'09:45', patient:'Robert Johnson', age:58, contact:'+63 912 111 0003', queue:3,  status:'ongoing',   diagnosis:'Chest pain evaluation',      type:'Regular' },
  { id:'APT-004', time:'09:45', end:'10:15', patient:'Maria Santos',   age:27, contact:'+63 912 111 0004', queue:4,  status:'scheduled', diagnosis:'',                           type:'VIP'     },
  { id:'APT-005', time:'10:15', end:'10:45', patient:'Carlos Reyes',   age:61, contact:'+63 912 111 0005', queue:5,  status:'scheduled', diagnosis:'',                           type:'Regular' },
  { id:'APT-006', time:'10:45', end:'11:15', patient:'Ana Cruz',       age:39, contact:'+63 912 111 0006', queue:6,  status:'scheduled', diagnosis:'',                           type:'Chronic' },
  { id:'APT-007', time:'11:15', end:'11:45', patient:'Ben Torres',     age:52, contact:'+63 912 111 0007', queue:7,  status:'scheduled', diagnosis:'',                           type:'Regular' },
  { id:'APT-008', time:'13:00', end:'13:30', patient:'Carla Mendoza',  age:44, contact:'+63 912 111 0008', queue:8,  status:'scheduled', diagnosis:'',                           type:'Regular' },
  { id:'APT-009', time:'13:30', end:'14:00', patient:'David Lim',      age:36, contact:'+63 912 111 0009', queue:9,  status:'scheduled', diagnosis:'',                           type:'VIP'     },
  { id:'APT-010', time:'14:00', end:'14:30', patient:'Elena Ramos',    age:29, contact:'+63 912 111 0010', queue:10, status:'scheduled', diagnosis:'',                           type:'Regular' },
];

const FOLLOW_UPS = [
  { id:1, patient:'Ana Cruz',     lastVisit:'Feb 10, 2026', diagnosis:'Type 2 Diabetes',      followDate:'Mar 10, 2026', contact:'+63 912 001 0001', daysLeft:-2 },
  { id:2, patient:'Ben Torres',   lastVisit:'Jan 28, 2026', diagnosis:'Hypertension Stage 1', followDate:'Mar 5, 2026',  contact:'+63 912 001 0002', daysLeft:-7 },
  { id:3, patient:'Maria Santos', lastVisit:'Feb 20, 2026', diagnosis:'Asthma',               followDate:'Mar 6, 2026',  contact:'+63 912 001 0003', daysLeft:2  },
  { id:4, patient:'David Lim',    lastVisit:'Jan 15, 2026', diagnosis:'GERD',                 followDate:'Mar 9, 2026',  contact:'+63 912 001 0004', daysLeft:5  },
  { id:5, patient:'Elena Ramos',  lastVisit:'Feb 25, 2026', diagnosis:'Migraine',             followDate:'Mar 12, 2026', contact:'+63 912 001 0005', daysLeft:8  },
];



const WEEKLY_DATA = [
  { day:'Mon', count:8  },
  { day:'Tue', count:12 },
  { day:'Wed', count:9  },
  { day:'Thu', count:14 },
  { day:'Fri', count:11 },
  { day:'Sat', count:6  },
  { day:'Sun', count:3  },
];

const STATUS_DATA = [
  { name:'Completed', value:52, color:'#22c55e' },
  { name:'Scheduled', value:18, color:'#3b82f6' },
  { name:'Cancelled', value:8,  color:'#ef4444' },
  { name:'No-show',   value:4,  color:'#9ca3af' },
];

const TYPE_DATA = [
  { name:'Regular', value:68, color:'#3b82f6' },
  { name:'Chronic', value:22, color:'#f59e0b' },
  { name:'VIP',     value:10, color:'#8b5cf6' },
];

/* ═══════════════════════════════════════════════
   SMALL HELPERS
═══════════════════════════════════════════════ */
const fmtTime = (t) => {
  if (!t) return '—';
  const [h, m] = t.split(':');
  const hr = parseInt(h);
  return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
};

const initials = (name) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

const STATUS_MAP = {
  scheduled: { label:'Scheduled', ringColor:'ring-blue-300',   dotColor:'bg-blue-500',   textColor:'text-blue-700',   bgColor:'bg-blue-50'   },
  ongoing:   { label:'Ongoing',   ringColor:'ring-yellow-300', dotColor:'bg-yellow-500', textColor:'text-yellow-700', bgColor:'bg-yellow-50' },
  completed: { label:'Completed', ringColor:'ring-green-300',  dotColor:'bg-green-500',  textColor:'text-green-700',  bgColor:'bg-green-50'  },
  cancelled: { label:'Cancelled', ringColor:'ring-red-200',    dotColor:'bg-red-400',    textColor:'text-red-600',    bgColor:'bg-red-50'    },
};

const StatusPill = ({ status }) => {
  const s = STATUS_MAP[status] || STATUS_MAP.scheduled;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${s.bgColor} ${s.textColor}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dotColor} ${status === 'ongoing' ? 'animate-pulse' : ''}`} />
      {s.label}
    </span>
  );
};

const TypeTag = ({ type }) => {
  const map = {
    Regular: 'bg-slate-100 text-slate-600',
    Chronic:  'bg-amber-100 text-amber-700',
    VIP:      'bg-violet-100 text-violet-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${map[type] || map.Regular}`}>
      {type}
    </span>
  );
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-xs min-w-[120px]">
      <p className="font-bold text-gray-700 mb-1.5">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span style={{ color: p.color || p.fill }} className="font-semibold">{p.name}</span>
          <span className="font-bold text-gray-800">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

/* Avatar colors by letter */
const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700', 'bg-teal-100 text-teal-700',
  'bg-violet-100 text-violet-700', 'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700', 'bg-emerald-100 text-emerald-700',
];
const avatarColor = (name) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */
export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState(INIT_APPOINTMENTS);
  const [search,       setSearch]       = useState('');
  const [tick,         setTick]         = useState(0);
  const { toast } = useToast();

  /* Auto-refresh every 5 minutes */
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  /* ── Derived KPIs ── */
  const todayTotal  = appointments.length;
  const completedN  = appointments.filter(a => a.status === 'completed').length;
  const ongoingApt  = appointments.find(a => a.status === 'ongoing');
  const followupN   = FOLLOW_UPS.length;
  const overdueN    = FOLLOW_UPS.filter(f => f.daysLeft < 0).length;

  /* ── Filtered table ── */
  const visible = useMemo(() =>
    search
      ? appointments.filter(a => a.patient.toLowerCase().includes(search.toLowerCase()))
      : appointments,
  [appointments, search]);

  /* ── Handlers ── */
  const startConsult = (id) => {
    setAppointments(prev =>
      prev.map(a => {
        if (a.id === id) return { ...a, status: 'ongoing' };
        if (a.status === 'ongoing') return { ...a, status: 'completed' };
        return a;
      })
    );
    const apt = appointments.find(a => a.id === id);
    toast({ title: '🩺 Consultation started', description: `Now seeing ${apt?.patient}` });
  };

  const completeConsult = (id) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'completed' } : a));
    const apt = appointments.find(a => a.id === id);
    toast({ title: '✅ Consultation complete', description: `${apt?.patient} marked as done` });
  };

  const handleRefresh = () => {
    setTick(t => t + 1);
    toast({ title: '🔄 Dashboard refreshed', description: 'All data is up to date.' });
  };

  /* ═══════════════════ RENDER ═══════════════════ */
  return (
    <MainLayout
      title="Doctor Dashboard"
      subtitle={`${DOCTOR.name} · ${DOCTOR.specialty} · ${TODAY_STR}`}
    >
      <div className="space-y-6">

        {/* ════════════════════════════════
            QUICK ACTION BAR
        ════════════════════════════════ */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200 gap-2">
            <Plus className="w-4 h-4" /> Start New Consultation
          </Button>
          <Button variant="outline" className="gap-2 border-gray-200 hover:bg-gray-50">
            <Calendar className="w-4 h-4 text-gray-500" /> View Full Schedule
          </Button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search patient…"
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-56 placeholder:text-gray-400"
            />
          </div>
          <div className="flex-1" />
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-600 transition-colors font-medium px-3 py-2 rounded-xl border border-gray-200 hover:border-blue-300 bg-white"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {/* ════════════════════════════════
            KPI CARDS
        ════════════════════════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">

          {/* 1. Today's Appointments */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden relative">
            <div className="absolute inset-0 opacity-10" style={{backgroundImage:'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)'}} />
            <CardContent className="p-5 relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-blue-100 uppercase tracking-wider">Today's Appts</p>
                  <p className="text-4xl font-black mt-1">{todayTotal}</p>
                  <p className="text-xs text-blue-200 mt-1">Scheduled today</p>
                </div>
                <div className="p-2.5 rounded-2xl bg-white/20">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Ongoing */}
          <Card className={`border shadow-sm overflow-hidden relative ${ongoingApt ? 'border-yellow-200 bg-yellow-50' : 'border-gray-100'}`}>
            {ongoingApt && (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-400 to-orange-400" />
            )}
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
                <div className={`p-2.5 rounded-2xl flex-shrink-0 ${ongoingApt ? 'bg-yellow-100' : 'bg-gray-50'} relative`}>
                  <PlayCircle className={`w-5 h-5 ${ongoingApt ? 'text-yellow-600' : 'text-gray-300'}`} />
                  {ongoingApt && <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-yellow-500 animate-ping" />}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Completed */}
          <Card className="border border-gray-100 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Completed</p>
                  <p className="text-4xl font-black text-gray-900 mt-1">{completedN}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-400 rounded-full transition-all duration-700"
                        style={{ width: `${Math.round((completedN / todayTotal) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 font-semibold flex-shrink-0">
                      {Math.round((completedN / todayTotal) * 100)}%
                    </span>
                  </div>
                </div>
                <div className="p-2.5 rounded-2xl bg-green-50">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. Follow-ups */}
          <Card className={`border shadow-sm ${overdueN > 0 ? 'border-red-200' : 'border-gray-100'}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Follow-ups</p>
                  <p className="text-4xl font-black text-gray-900 mt-1">{followupN}</p>
                  {overdueN > 0 && (
                    <p className="text-xs text-red-500 font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {overdueN} overdue
                    </p>
                  )}
                </div>
                <div className={`p-2.5 rounded-2xl ${overdueN > 0 ? 'bg-red-50' : 'bg-orange-50'} relative`}>
                  <Bell className={`w-5 h-5 ${overdueN > 0 ? 'text-red-500' : 'text-orange-500'}`} />
                  {overdueN > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                      {overdueN}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 5. This Week */}
          <Card className="border border-gray-100 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">This Week</p>
                  <p className="text-4xl font-black text-gray-900 mt-1">64</p>
                  <p className="text-xs text-green-600 font-bold mt-1 flex items-center gap-0.5">
                    <ArrowUpRight className="w-3 h-3" /> +12% vs last week
                  </p>
                </div>
                <div className="p-2.5 rounded-2xl bg-purple-50">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

     

        {/* ════════════════════════════════
            ANALYTICS ROW
        ════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* A — Weekly Trend */}
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="pb-1 pt-5 px-5">
              <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" /> Weekly Appointment Trend
              </CardTitle>
              <p className="text-xs text-gray-400 mt-0.5">Past 7 days</p>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={WEEKLY_DATA} margin={{ top:8, right:12, left:-20, bottom:0 }}>
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize:10, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize:10, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line
                    type="monotone" dataKey="count" name="Appointments"
                    stroke="#3b82f6" strokeWidth={2.5}
                    dot={{ r:3, fill:'#3b82f6', strokeWidth:0 }}
                    activeDot={{ r:5, fill:'#2563eb' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* B — Status Distribution */}
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="pb-1 pt-5 px-5">
              <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" /> Status Distribution
              </CardTitle>
              <p className="text-xs text-gray-400 mt-0.5">This month</p>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={STATUS_DATA} margin={{ top:8, right:12, left:-20, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize:9, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize:10, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="value" name="Count" radius={[5,5,0,0]} maxBarSize={36}>
                    {STATUS_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* C — Patient Type */}
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="pb-1 pt-5 px-5">
              <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" /> Patient Type Distribution
              </CardTitle>
              <p className="text-xs text-gray-400 mt-0.5">CRM overview</p>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex items-center justify-between">
                <ResponsiveContainer width="55%" height={160}>
                  <PieChart>
                    <Pie
                      data={TYPE_DATA} cx="50%" cy="50%"
                      innerRadius={38} outerRadius={62}
                      dataKey="value" paddingAngle={3}
                    >
                      {TYPE_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2.5 pr-4">
                  {TYPE_DATA.map(t => (
                    <div key={t.name}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-semibold text-gray-600">{t.name}</span>
                        <span className="text-xs font-bold text-gray-800">{t.value}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width:`${t.value}%`, backgroundColor:t.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </MainLayout>
  );
}