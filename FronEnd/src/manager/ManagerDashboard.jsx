import React, { useState } from "react";
import MainLayout from "../components/layouts/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  Calendar, Clock, Users, UserCheck, TrendingUp, Activity,
  ArrowUpRight, ArrowDownRight, CalendarDays, FileText, Printer,
  Download, BarChart2, RefreshCw, Star, AlertCircle, DollarSign,
  CreditCard, ReceiptText, BadgePercent, ChevronDown, LayoutDashboard,
} from "lucide-react";

/* ─── Palette ─── */
const BLUE   = "#2563EB";
const GREEN  = "#16A34A";
const YELLOW = "#F59E0B";
const RED    = "#DC2626";
const TEAL   = "#0D9488";
const GRAY   = "#94A3B8";
const PURPLE = "#7C3AED";
const ORANGE = "#EA580C";

/* ════════════════════════════════════════════
   SHARED UI
════════════════════════════════════════════ */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.07) return null;
  const R = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  return (
    <text x={cx + r * Math.cos(-midAngle * R)} y={cy + r * Math.sin(-midAngle * R)}
      fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    scheduled: "bg-blue-100 text-blue-700", ongoing: "bg-yellow-100 text-yellow-700",
    completed: "bg-green-100 text-green-700", cancelled: "bg-red-100 text-red-700",
    no_show: "bg-gray-100 text-gray-600", overdue: "bg-red-100 text-red-700",
    upcoming: "bg-blue-100 text-blue-700", paid: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${map[status] || "bg-gray-100 text-gray-600"}`}>
      {status?.replace("_", " ")}
    </span>
  );
};

const PatientTypeBadge = ({ type }) => {
  const map = { Regular: "bg-gray-100 text-gray-600", Chronic: "bg-orange-100 text-orange-700", VIP: "bg-purple-100 text-purple-700" };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${map[type] || ""}`}>{type}</span>;
};

const SelectBox = ({ value, onChange, options, className = "" }) => (
  <div className={`relative ${className}`}>
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
  </div>
);

const KPICard = ({ label, value, sub, icon: Icon, iconBg, iconColor, trend, trendLabel }) => (
  <Card>
    <CardContent className="p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
          <h3 className="text-3xl font-bold text-gray-900 mt-1">{value}</h3>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${trend >= 0 ? "text-green-600" : "text-red-500"}`}>
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

const SmallKPI = ({ label, value, sub, icon: Icon, iconBg, iconColor, trend }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{value}</h3>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
          {trend !== undefined && (
            <div className={`flex items-center gap-0.5 mt-1 text-xs font-semibold ${trend >= 0 ? "text-green-600" : "text-red-500"}`}>
              {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

const Th = ({ children, className = "" }) => (
  <th className={`text-left py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50 ${className}`}>{children}</th>
);
const Td = ({ children, className = "" }) => (
  <td className={`py-3 px-4 text-sm ${className}`}>{children}</td>
);

/* ════════════════════════════════════════════
   VIEW + REPORT CONFIG
════════════════════════════════════════════ */
const VIEWS = [
  { key: "overview",    label: "Overview",            icon: LayoutDashboard, color: "text-blue-600",    bg: "bg-blue-50"    },
  { key: "daily",       label: "Daily Appointments",  icon: Calendar,        color: "text-indigo-600",  bg: "bg-indigo-50"  },
  { key: "status",      label: "Appointment Status",  icon: BarChart2,       color: "text-green-600",   bg: "bg-green-50"   },
  { key: "doctor",      label: "Doctor Performance",  icon: UserCheck,       color: "text-purple-600",  bg: "bg-purple-50"  },
  { key: "patient",     label: "Patient Visits",      icon: Users,           color: "text-teal-600",    bg: "bg-teal-50"    },
  { key: "followup",    label: "Follow-Up (CRM)",     icon: RefreshCw,       color: "text-yellow-600",  bg: "bg-yellow-50"  },
  { key: "engagement",  label: "Patient Engagement",  icon: TrendingUp,      color: "text-rose-600",    bg: "bg-rose-50"    },
  { key: "queue",       label: "Queue Management",    icon: Clock,           color: "text-orange-600",  bg: "bg-orange-50"  },
  { key: "sales",       label: "Sales & Revenue",     icon: DollarSign,      color: "text-emerald-700", bg: "bg-emerald-50" },
];

/* ════════════════════════════════════════════
   DEMO DATA
════════════════════════════════════════════ */
const DATE_FILTERS = [
  { key: "today", label: "Today" },
  { key: "week",  label: "This Week" },
  { key: "month", label: "This Month" },
];

const KPI_DATA = {
  today: { total: 30,  completed: 19,  pending: 9,  patients: 423, doctors: 5, cancelled: 2,  revenue: "₱18,400",  trend: { total: 8,  comp: 5,  pend: -2,  pat: 12, canc: -3,  rev: 6  } },
  week:  { total: 95,  completed: 80,  pending: 10, patients: 423, doctors: 5, cancelled: 5,  revenue: "₱58,200",  trend: { total: 14, comp: 11, pend: -5,  pat: 12, canc: -8,  rev: 18 } },
  month: { total: 303, completed: 261, pending: 24, patients: 423, doctors: 5, cancelled: 18, revenue: "₱241,500", trend: { total: 22, comp: 18, pend: -10, pat: 12, canc: -15, rev: 21 } },
};

const TREND_DATA = {
  today: [
    { day: "8 AM",  appointments: 3, completed: 3, cancelled: 0 },
    { day: "9 AM",  appointments: 5, completed: 5, cancelled: 0 },
    { day: "10 AM", appointments: 4, completed: 3, cancelled: 1 },
    { day: "11 AM", appointments: 6, completed: 5, cancelled: 1 },
    { day: "1 PM",  appointments: 4, completed: 2, cancelled: 0 },
    { day: "2 PM",  appointments: 5, completed: 2, cancelled: 0 },
    { day: "3 PM",  appointments: 3, completed: 1, cancelled: 0 },
  ],
  week: [
    { day: "Mon", appointments: 12, completed: 10, cancelled: 2 },
    { day: "Tue", appointments: 18, completed: 15, cancelled: 3 },
    { day: "Wed", appointments: 14, completed: 12, cancelled: 2 },
    { day: "Thu", appointments: 22, completed: 19, cancelled: 3 },
    { day: "Fri", appointments: 20, completed: 16, cancelled: 4 },
    { day: "Sat", appointments: 9,  completed: 8,  cancelled: 1 },
  ],
  month: [
    { day: "Week 1", appointments: 68, completed: 58, cancelled: 10 },
    { day: "Week 2", appointments: 74, completed: 65, cancelled: 9  },
    { day: "Week 3", appointments: 82, completed: 70, cancelled: 12 },
    { day: "Week 4", appointments: 79, completed: 68, cancelled: 11 },
  ],
};

const STATUS_DATA = {
  today: [
    { name: "Completed", value: 19, fill: GREEN  },
    { name: "Scheduled", value: 8,  fill: BLUE   },
    { name: "Ongoing",   value: 1,  fill: YELLOW },
    { name: "Cancelled", value: 2,  fill: RED    },
  ],
  week: [
    { name: "Completed", value: 80, fill: GREEN  },
    { name: "Scheduled", value: 45, fill: BLUE   },
    { name: "Ongoing",   value: 12, fill: YELLOW },
    { name: "Cancelled", value: 18, fill: RED    },
    { name: "No Show",   value: 6,  fill: GRAY   },
  ],
  month: [
    { name: "Completed", value: 261, fill: GREEN  },
    { name: "Scheduled", value: 42,  fill: BLUE   },
    { name: "Ongoing",   value: 6,   fill: YELLOW },
    { name: "Cancelled", value: 61,  fill: RED    },
    { name: "No Show",   value: 22,  fill: GRAY   },
  ],
};

const WORKLOAD_DATA = {
  today: [
    { doctor: "Dr. Smith",  appointments: 8  },
    { doctor: "Dr. Chen",   appointments: 7  },
    { doctor: "Dr. Torres", appointments: 5  },
    { doctor: "Dr. Lim",    appointments: 6  },
    { doctor: "Dr. Reyes",  appointments: 4  },
  ],
  week: [
    { doctor: "Dr. Smith",  appointments: 14 },
    { doctor: "Dr. Chen",   appointments: 11 },
    { doctor: "Dr. Torres", appointments: 9  },
    { doctor: "Dr. Lim",    appointments: 16 },
    { doctor: "Dr. Reyes",  appointments: 7  },
  ],
  month: [
    { doctor: "Dr. Smith",  appointments: 68 },
    { doctor: "Dr. Chen",   appointments: 55 },
    { doctor: "Dr. Torres", appointments: 47 },
    { doctor: "Dr. Lim",    appointments: 73 },
    { doctor: "Dr. Reyes",  appointments: 38 },
  ],
};

const PATIENT_TYPE_DATA = {
  today: [{ name: "New",       value: 8,   fill: BLUE   }, { name: "Returning", value: 18,  fill: TEAL   }, { name: "Walk-in", value: 4,  fill: YELLOW }],
  week:  [{ name: "New",       value: 38,  fill: BLUE   }, { name: "Returning", value: 52,  fill: TEAL   }, { name: "Walk-in", value: 10, fill: YELLOW }],
  month: [{ name: "New",       value: 112, fill: BLUE   }, { name: "Returning", value: 160, fill: TEAL   }, { name: "Walk-in", value: 31, fill: YELLOW }],
};

const MONTHLY_GROWTH = [
  { month: "Oct", patients: 120, appointments: 210 },
  { month: "Nov", patients: 135, appointments: 230 },
  { month: "Dec", patients: 118, appointments: 195 },
  { month: "Jan", patients: 148, appointments: 260 },
  { month: "Feb", patients: 160, appointments: 285 },
  { month: "Mar", patients: 175, appointments: 310 },
];

/* ── Report-specific data ── */
const DAILY_DATA = [
  { id: 1,  time: "08:00–08:30", patient: "John Doe",       doctor: "Dr. Sarah Smith",  reason: "Regular checkup",    status: "completed" },
  { id: 2,  time: "08:30–09:00", patient: "Jane Smith",     doctor: "Dr. Michael Chen", reason: "Follow-up",          status: "completed" },
  { id: 3,  time: "09:00–09:30", patient: "Robert Johnson", doctor: "Dr. James Lim",    reason: "Blood pressure",     status: "ongoing"   },
  { id: 4,  time: "09:30–10:00", patient: "Maria Santos",   doctor: "Dr. Sarah Smith",  reason: "Fever & cough",      status: "scheduled" },
  { id: 5,  time: "10:00–10:30", patient: "Carlos Reyes",   doctor: "Dr. Reyna Torres", reason: "Annual physical",    status: "scheduled" },
  { id: 6,  time: "10:30–11:00", patient: "Ana Cruz",       doctor: "Dr. Ana Reyes",    reason: "Skin consultation",  status: "cancelled" },
  { id: 7,  time: "11:00–11:30", patient: "Ben Torres",     doctor: "Dr. Michael Chen", reason: "Diabetes follow-up", status: "completed" },
  { id: 8,  time: "13:00–13:30", patient: "Carla Mendoza",  doctor: "Dr. James Lim",    reason: "Asthma checkup",     status: "no_show"   },
  { id: 9,  time: "13:30–14:00", patient: "David Lim",      doctor: "Dr. Sarah Smith",  reason: "Post-op visit",      status: "completed" },
  { id: 10, time: "14:00–14:30", patient: "Elena Ramos",    doctor: "Dr. Reyna Torres", reason: "Hypertension",       status: "scheduled" },
];

const STATUS_CHART = [
  { name: "Completed", value: 261, fill: GREEN  },
  { name: "Scheduled", value: 42,  fill: BLUE   },
  { name: "Ongoing",   value: 6,   fill: YELLOW },
  { name: "Cancelled", value: 61,  fill: RED    },
  { name: "No-show",   value: 22,  fill: GRAY   },
];

const DOCTOR_DATA = [
  { id: 1, doctor: "Dr. Sarah Smith",  specialty: "General Medicine",  total: 92,  completed: 80, cancelled: 8, noshow: 4, avgPerDay: 15.3, rating: 4.9 },
  { id: 2, doctor: "Dr. Michael Chen", specialty: "Pediatrics",        total: 78,  completed: 68, cancelled: 7, noshow: 3, avgPerDay: 13.0, rating: 4.8 },
  { id: 3, doctor: "Dr. James Lim",    specialty: "General Medicine",  total: 101, completed: 88, cancelled: 9, noshow: 4, avgPerDay: 16.8, rating: 4.7 },
  { id: 4, doctor: "Dr. Reyna Torres", specialty: "Internal Medicine", total: 65,  completed: 56, cancelled: 6, noshow: 3, avgPerDay: 10.8, rating: 4.6 },
  { id: 5, doctor: "Dr. Ana Reyes",    specialty: "Dermatology",       total: 47,  completed: 40, cancelled: 5, noshow: 2, avgPerDay: 7.8,  rating: 4.5 },
];

const PATIENT_DATA = [
  { id: 1, patient: "John Doe",       visits: 12, lastVisit: "2026-02-28", type: "Regular", followup: "No"  },
  { id: 2, patient: "Jane Smith",     visits: 8,  lastVisit: "2026-02-25", type: "Chronic", followup: "Yes" },
  { id: 3, patient: "Robert Johnson", visits: 5,  lastVisit: "2026-03-01", type: "Regular", followup: "No"  },
  { id: 4, patient: "Maria Santos",   visits: 20, lastVisit: "2026-02-20", type: "VIP",     followup: "Yes" },
  { id: 5, patient: "Carlos Reyes",   visits: 3,  lastVisit: "2026-01-15", type: "Regular", followup: "No"  },
  { id: 6, patient: "Ana Cruz",       visits: 15, lastVisit: "2026-02-10", type: "Chronic", followup: "Yes" },
  { id: 7, patient: "Ben Torres",     visits: 9,  lastVisit: "2026-01-28", type: "Regular", followup: "Yes" },
  { id: 8, patient: "Carla Mendoza",  visits: 6,  lastVisit: "2026-02-18", type: "Regular", followup: "No"  },
];

const FOLLOWUP_DATA = [
  { id: 1, patient: "Ana Cruz",     lastVisit: "2026-02-10", followupDate: "2026-03-10", contact: "+63 912 001 0001", doctor: "Dr. Sarah Smith",  status: "overdue"  },
  { id: 2, patient: "Ben Torres",   lastVisit: "2026-01-28", followupDate: "2026-03-05", contact: "+63 912 001 0002", doctor: "Dr. Michael Chen", status: "overdue"  },
  { id: 3, patient: "Maria Santos", lastVisit: "2026-02-20", followupDate: "2026-03-06", contact: "+63 912 001 0003", doctor: "Dr. Sarah Smith",  status: "upcoming" },
  { id: 4, patient: "David Lim",    lastVisit: "2026-01-15", followupDate: "2026-03-04", contact: "+63 912 001 0004", doctor: "Dr. James Lim",    status: "overdue"  },
  { id: 5, patient: "Jane Smith",   lastVisit: "2026-02-25", followupDate: "2026-03-07", contact: "+63 912 001 0005", doctor: "Dr. Michael Chen", status: "upcoming" },
  { id: 6, patient: "Carlos Reyes", lastVisit: "2026-01-15", followupDate: "2026-03-09", contact: "+63 912 001 0006", doctor: "Dr. Reyna Torres", status: "upcoming" },
];

const GROWTH_DATA = [
  { month: "Oct", newPatients: 28, returning: 92,  inactive: 14 },
  { month: "Nov", newPatients: 34, returning: 101, inactive: 11 },
  { month: "Dec", newPatients: 22, returning: 96,  inactive: 18 },
  { month: "Jan", newPatients: 41, returning: 107, inactive: 9  },
  { month: "Feb", newPatients: 38, returning: 122, inactive: 7  },
  { month: "Mar", newPatients: 45, returning: 130, inactive: 6  },
];

const PEAK_DAYS  = [
  { day: "Mon", patients: 42 }, { day: "Tue", patients: 58 }, { day: "Wed", patients: 51 },
  { day: "Thu", patients: 67 }, { day: "Fri", patients: 63 }, { day: "Sat", patients: 30 },
];

const PEAK_HOURS = [
  { hour: "8AM", count: 8  }, { hour: "9AM",  count: 14 }, { hour: "10AM", count: 12 },
  { hour: "11AM",count: 10 }, { hour: "12PM", count: 5  }, { hour: "1PM",  count: 11 },
  { hour: "2PM", count: 9  }, { hour: "3PM",  count: 7  }, { hour: "4PM",  count: 4  },
];

const WEEKLY_APPTS = [
  { day: "Mon", appointment: 30, walkIn: 12 }, { day: "Tue", appointment: 42, walkIn: 16 },
  { day: "Wed", appointment: 38, walkIn: 13 }, { day: "Thu", appointment: 51, walkIn: 16 },
  { day: "Fri", appointment: 47, walkIn: 16 }, { day: "Sat", appointment: 20, walkIn: 10 },
];

const QUEUE_DATA = [
  { id: 1, hour: "8–9 AM",   served: 8,  avgWait: "8 min",  longest: "15 min" },
  { id: 2, hour: "9–10 AM",  served: 12, avgWait: "12 min", longest: "22 min" },
  { id: 3, hour: "10–11 AM", served: 10, avgWait: "10 min", longest: "18 min" },
  { id: 4, hour: "11–12 PM", served: 9,  avgWait: "9 min",  longest: "16 min" },
  { id: 5, hour: "1–2 PM",   served: 11, avgWait: "11 min", longest: "20 min" },
  { id: 6, hour: "2–3 PM",   served: 8,  avgWait: "7 min",  longest: "14 min" },
  { id: 7, hour: "3–4 PM",   served: 6,  avgWait: "6 min",  longest: "11 min" },
];

const SALES_TREND = [
  { week: "Week 1", revenue: 52000 }, { week: "Week 2", revenue: 61500 },
  { week: "Week 3", revenue: 70000 }, { week: "Week 4", revenue: 58000 },
];

const SALES_BY_SERVICE = [
  { service: "General Consult",    amount: 98000 },
  { service: "Follow-up",          amount: 52000 },
  { service: "Specialist Consult", amount: 48500 },
  { service: "Pediatric Consult",  amount: 26000 },
  { service: "Executive Check-up", amount: 17000 },
];

const PAYMENT_DATA = [
  { name: "Cash",        value: 128, fill: GREEN  },
  { name: "GCash",       value: 74,  fill: BLUE   },
  { name: "Credit Card", value: 38,  fill: PURPLE },
  { name: "PhilHealth",  value: 21,  fill: TEAL   },
];

const MONTHLY_REVENUE = [
  { month: "Oct", revenue: 182000, target: 175000 }, { month: "Nov", revenue: 198000, target: 185000 },
  { month: "Dec", revenue: 171000, target: 190000 }, { month: "Jan", revenue: 215000, target: 200000 },
  { month: "Feb", revenue: 228000, target: 210000 }, { month: "Mar", revenue: 241500, target: 225000 },
];

const SALES_TXN = [
  { id: 1, date: "2026-03-03", patient: "John Doe",     service: "General Consult",    amount: "₱800",   method: "Cash",        status: "paid"    },
  { id: 2, date: "2026-03-03", patient: "Jane Smith",   service: "Follow-up",          amount: "₱500",   method: "GCash",       status: "paid"    },
  { id: 3, date: "2026-03-03", patient: "Maria Santos", service: "Executive Check-up", amount: "₱2,500", method: "Credit Card", status: "paid"    },
  { id: 4, date: "2026-03-03", patient: "Carlos Reyes", service: "General Consult",    amount: "₱800",   method: "PhilHealth",  status: "paid"    },
  { id: 5, date: "2026-03-02", patient: "Ana Cruz",     service: "Follow-up",          amount: "₱500",   method: "Cash",        status: "pending" },
  { id: 6, date: "2026-03-01", patient: "Elena Ramos",  service: "Pediatric Consult",  amount: "₱900",   method: "GCash",       status: "pending" },
];

const DOCTORS_LIST  = ["All Doctors", "Dr. Sarah Smith", "Dr. Michael Chen", "Dr. James Lim", "Dr. Reyna Torres", "Dr. Ana Reyes"];
const STATUSES_LIST = ["All Status", "Scheduled", "Ongoing", "Completed", "Cancelled", "No-show"];

/* ════════════════════════════════════════════
   OVERVIEW SECTION
════════════════════════════════════════════ */
function OverviewSection({ dateRange }) {
  const kpi        = KPI_DATA[dateRange];
  const trendData  = TREND_DATA[dateRange];
  const statusData = STATUS_DATA[dateRange];
  const workload   = WORKLOAD_DATA[dateRange];
  const ptypes     = PATIENT_TYPE_DATA[dateRange];
  const t          = kpi.trend;
  const compLabel  = dateRange === "today" ? "vs yesterday" : dateRange === "week" ? "vs last week" : "vs last month";
  const periodLabel = DATE_FILTERS.find(f => f.key === dateRange)?.label.toLowerCase();

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard label="Total Appointments" value={kpi.total}     sub={periodLabel}       icon={Calendar}   iconBg="bg-blue-50"    iconColor="text-blue-600"    trend={t.total} trendLabel={compLabel} />
        <KPICard label="Completed"          value={kpi.completed} sub="appointments"      icon={UserCheck}  iconBg="bg-green-50"   iconColor="text-green-600"   trend={t.comp}  trendLabel={compLabel} />
        <KPICard label="Pending"            value={kpi.pending}   sub="remaining"         icon={Clock}      iconBg="bg-yellow-50"  iconColor="text-yellow-600"  trend={t.pend}  trendLabel={compLabel} />
        <KPICard label="Total Patients"     value={kpi.patients}  sub="registered"        icon={Users}      iconBg="bg-teal-50"    iconColor="text-teal-600"    trend={t.pat}   trendLabel="this month" />
        <KPICard label="Active Doctors"     value={kpi.doctors}   sub="on roster"         icon={Activity}   iconBg="bg-purple-50"  iconColor="text-purple-600"  />
        <KPICard label="Revenue"            value={kpi.revenue}   sub={periodLabel}       icon={DollarSign} iconBg="bg-emerald-50" iconColor="text-emerald-600" trend={t.rev}   trendLabel={compLabel} />
      </div>

      {/* Trend Line */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {dateRange === "today" ? "Hourly Trend (Today)" : dateRange === "week" ? "Daily Trend (This Week)" : "Weekly Trend (This Month)"}
          </CardTitle>
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

      {/* Status + Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Appointment Status Breakdown</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statusData} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Count">
                  {statusData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Doctor Workload ({DATE_FILTERS.find(f => f.key === dateRange)?.label})</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={workload} layout="vertical" margin={{ top: 4, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="doctor" type="category" tick={{ fontSize: 11 }} width={90} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="appointments" fill={BLUE} radius={[0, 6, 6, 0]} name="Appointments" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Patient type + Monthly growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Patient Type Distribution</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie data={ptypes} cx="50%" cy="50%" outerRadius={90} dataKey="value" labelLine={false} label={<PieLabel />}>
                    {ptypes.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-3">
                {ptypes.map(d => (
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
          <CardHeader><CardTitle className="text-base">Monthly Growth (Last 6 Months)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={MONTHLY_GROWTH} margin={{ top: 4, right: 20, left: -10, bottom: 0 }}>
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
  );
}

/* ════════════════════════════════════════════
   REPORT CONTENT PANELS
════════════════════════════════════════════ */
function DailyPanel({ doctorFilter, statusFilter }) {
  const rows = DAILY_DATA.filter(r => {
    const d = doctorFilter === "All Doctors" || r.doctor === doctorFilter;
    const s = statusFilter === "All Status"  || r.status === statusFilter.toLowerCase().replace("-", "_");
    return d && s;
  });
  const completed = rows.filter(r => r.status === "completed").length;
  const pending   = rows.filter(r => ["scheduled","ongoing"].includes(r.status)).length;
  const cancelled = rows.filter(r => r.status === "cancelled").length;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SmallKPI label="Total"     value={rows.length} icon={Calendar}    iconBg="bg-blue-50"   iconColor="text-blue-600"   />
        <SmallKPI label="Completed" value={completed}   icon={UserCheck}   iconBg="bg-green-50"  iconColor="text-green-600"  />
        <SmallKPI label="Pending"   value={pending}     icon={Clock}       iconBg="bg-yellow-50" iconColor="text-yellow-600" />
        <SmallKPI label="Cancelled" value={cancelled}   icon={AlertCircle} iconBg="bg-red-50"    iconColor="text-red-500"    />
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full">
          <thead><tr><Th>Time</Th><Th>Patient</Th><Th>Doctor</Th><Th className="hidden md:table-cell">Reason</Th><Th>Status</Th></tr></thead>
          <tbody className="divide-y divide-gray-50">
            {rows.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">No appointments match the selected filters.</td></tr>}
            {rows.map(r => (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                <Td className="font-medium text-gray-700 whitespace-nowrap">{r.time}</Td>
                <Td className="font-semibold text-gray-900">{r.patient}</Td>
                <Td className="text-gray-500">{r.doctor}</Td>
                <Td className="text-gray-400 hidden md:table-cell">{r.reason}</Td>
                <Td><StatusBadge status={r.status} /></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusPanel() {
  const total = STATUS_CHART.reduce((s, d) => s + d.value, 0);
  const comp  = STATUS_CHART.find(d => d.name === "Completed")?.value || 0;
  const canc  = STATUS_CHART.find(d => d.name === "Cancelled")?.value || 0;
  const noshow= STATUS_CHART.find(d => d.name === "No-show")?.value   || 0;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <SmallKPI label="Total"           value={total}                       icon={Calendar}   iconBg="bg-blue-50"  iconColor="text-blue-600"  />
        <SmallKPI label="Completed"       value={comp}                        icon={UserCheck}  iconBg="bg-green-50" iconColor="text-green-600"  trend={8}  />
        <SmallKPI label="Cancelled"       value={canc}                        icon={AlertCircle}iconBg="bg-red-50"   iconColor="text-red-500"    trend={-5} />
        <SmallKPI label="No-show"         value={noshow}                      icon={Users}      iconBg="bg-gray-50"  iconColor="text-gray-500"   />
        <SmallKPI label="Completion Rate" value={`${((comp/total)*100).toFixed(1)}%`} icon={TrendingUp} iconBg="bg-teal-50" iconColor="text-teal-600" trend={3} />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-sm">Status Breakdown</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={STATUS_CHART} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" radius={[6,6,0,0]} name="Count">
                {STATUS_CHART.map((e,i) => <Cell key={i} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full">
          <thead><tr><Th>Status</Th><Th>Count</Th><Th>%</Th><Th>Visual</Th></tr></thead>
          <tbody className="divide-y divide-gray-50">
            {STATUS_CHART.map(r => (
              <tr key={r.name} className="hover:bg-gray-50">
                <Td><StatusBadge status={r.name.toLowerCase().replace("-","_")} /></Td>
                <Td className="font-bold text-gray-900">{r.value}</Td>
                <Td className="text-gray-500">{((r.value/total)*100).toFixed(1)}%</Td>
                <Td><div className="w-40 bg-gray-100 rounded-full h-2"><div className="h-2 rounded-full" style={{ width:`${(r.value/total)*100}%`, background:r.fill }} /></div></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DoctorPanel({ doctorFilter }) {
  const rows    = DOCTOR_DATA.filter(r => doctorFilter === "All Doctors" || r.doctor === doctorFilter);
  const top     = [...DOCTOR_DATA].sort((a,b) => b.completed - a.completed)[0];
  const most    = [...DOCTOR_DATA].sort((a,b) => b.total - a.total)[0];
  const chartD  = DOCTOR_DATA.map(d => ({ name: d.doctor.replace("Dr. ",""), completed: d.completed, cancelled: d.cancelled }));
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SmallKPI label="Total Doctors" value={DOCTOR_DATA.length} icon={Users}     iconBg="bg-blue-50"   iconColor="text-blue-600"   />
        <SmallKPI label="Total Appts"   value={DOCTOR_DATA.reduce((s,d)=>s+d.total,0)} icon={Calendar} iconBg="bg-teal-50" iconColor="text-teal-600" />
        <SmallKPI label="Top Performer" value={top.doctor.replace("Dr. ","")} sub="by completions" icon={Star}     iconBg="bg-yellow-50" iconColor="text-yellow-500" />
        <SmallKPI label="Most Booked"   value={most.doctor.replace("Dr. ","")} sub={`${most.total} appts`} icon={Activity} iconBg="bg-purple-50" iconColor="text-purple-600" />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-sm">Completed vs Cancelled per Doctor</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartD} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="completed" fill={GREEN} radius={[4,4,0,0]} name="Completed" />
              <Bar dataKey="cancelled" fill={RED}   radius={[4,4,0,0]} name="Cancelled" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full">
          <thead><tr><Th>Doctor</Th><Th>Specialty</Th><Th>Total</Th><Th>Completed</Th><Th>Cancelled</Th><Th>No-show</Th><Th>Avg/Day</Th><Th>Rating</Th></tr></thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <Td className="font-semibold text-gray-900">{r.doctor}</Td>
                <Td className="text-gray-500 text-xs">{r.specialty}</Td>
                <Td className="font-bold text-gray-800">{r.total}</Td>
                <Td><span className="text-green-600 font-semibold">{r.completed}</span></Td>
                <Td><span className="text-red-500 font-semibold">{r.cancelled}</span></Td>
                <Td><span className="text-gray-500">{r.noshow}</span></Td>
                <Td className="text-gray-600">{r.avgPerDay}</Td>
                <Td><div className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" /><span className="font-semibold text-gray-700 text-xs">{r.rating}</span></div></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PatientPanel() {
  const vip     = PATIENT_DATA.filter(p => p.type === "VIP").length;
  const chronic = PATIENT_DATA.filter(p => p.type === "Chronic").length;
  const fu      = PATIENT_DATA.filter(p => p.followup === "Yes").length;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SmallKPI label="Total Patients"   value={PATIENT_DATA.length} icon={Users}     iconBg="bg-blue-50"   iconColor="text-blue-600"   />
        <SmallKPI label="VIP Patients"     value={vip}                 icon={Star}      iconBg="bg-purple-50" iconColor="text-purple-600" />
        <SmallKPI label="Chronic Patients" value={chronic}             icon={Activity}  iconBg="bg-orange-50" iconColor="text-orange-600" />
        <SmallKPI label="Follow-up Needed" value={fu}                  icon={RefreshCw} iconBg="bg-yellow-50" iconColor="text-yellow-600" />
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full">
          <thead><tr><Th>Patient</Th><Th>Total Visits</Th><Th>Last Visit</Th><Th>Type</Th><Th>Follow-up</Th></tr></thead>
          <tbody className="divide-y divide-gray-50">
            {PATIENT_DATA.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <Td className="font-semibold text-gray-900">{r.patient}</Td>
                <Td className="font-bold text-gray-800">{r.visits}</Td>
                <Td className="text-gray-500">{r.lastVisit}</Td>
                <Td><PatientTypeBadge type={r.type} /></Td>
                <Td><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${r.followup==="Yes"?"bg-red-100 text-red-600":"bg-green-100 text-green-600"}`}>{r.followup}</span></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FollowUpPanel({ followupFilter }) {
  const rows    = followupFilter === "All" ? FOLLOWUP_DATA : FOLLOWUP_DATA.filter(f => f.status === followupFilter.toLowerCase());
  const overdue = FOLLOWUP_DATA.filter(f => f.status === "overdue").length;
  const upcoming= FOLLOWUP_DATA.filter(f => f.status === "upcoming").length;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <SmallKPI label="Total Follow-ups"  value={FOLLOWUP_DATA.length} icon={RefreshCw}   iconBg="bg-blue-50"   iconColor="text-blue-600"   />
        <SmallKPI label="Overdue"           value={overdue}              icon={AlertCircle} iconBg="bg-red-50"    iconColor="text-red-500"    />
        <SmallKPI label="Upcoming (7 days)" value={upcoming}             icon={Calendar}    iconBg="bg-yellow-50" iconColor="text-yellow-600" />
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full">
          <thead><tr><Th>Patient</Th><Th>Last Visit</Th><Th>Follow-up Date</Th><Th className="hidden md:table-cell">Contact</Th><Th>Doctor</Th><Th>Status</Th></tr></thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <Td className="font-semibold text-gray-900">{r.patient}</Td>
                <Td className="text-gray-500">{r.lastVisit}</Td>
                <Td className="font-medium text-gray-700">{r.followupDate}</Td>
                <Td className="text-gray-500 hidden md:table-cell">{r.contact}</Td>
                <Td className="text-gray-500">{r.doctor}</Td>
                <Td><StatusBadge status={r.status} /></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EngagementPanel() {
  const latest   = GROWTH_DATA[GROWTH_DATA.length - 1];
  const prev     = GROWTH_DATA[GROWTH_DATA.length - 2];
  const peakDay  = PEAK_DAYS.reduce((a,b) => a.patients > b.patients ? a : b);
  const peakHour = PEAK_HOURS.reduce((a,b) => a.count > b.count ? a : b);
  const ret      = Math.round((latest.returning / (latest.newPatients + latest.returning)) * 100);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SmallKPI label="New This Month" value={latest.newPatients} icon={UserCheck}   iconBg="bg-blue-50"   iconColor="text-blue-600"   trend={Math.round(((latest.newPatients-prev.newPatients)/prev.newPatients)*100)} />
        <SmallKPI label="Returning %"    value={`${ret}%`}          icon={RefreshCw}   iconBg="bg-teal-50"   iconColor="text-teal-600"   />
        <SmallKPI label="Inactive"       value={latest.inactive}    icon={AlertCircle} iconBg="bg-gray-50"   iconColor="text-gray-500"   />
        <SmallKPI label="Peak Day"       value={peakDay.day}        sub={`${peakDay.patients} patients`} icon={TrendingUp} iconBg="bg-purple-50" iconColor="text-purple-600" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Monthly Patient Growth</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={190}>
              <LineChart data={GROWTH_DATA} margin={{ top:4, right:20, left:-10, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize:11 }} /><YAxis tick={{ fontSize:11 }} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
                <Line type="monotone" dataKey="newPatients" stroke={BLUE} strokeWidth={2.5} dot={{ r:3 }} name="New" />
                <Line type="monotone" dataKey="returning"   stroke={TEAL} strokeWidth={2.5} dot={{ r:3 }} name="Returning" />
                <Line type="monotone" dataKey="inactive"    stroke={GRAY} strokeWidth={2}   dot={{ r:3 }} strokeDasharray="4 2" name="Inactive" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Peak Visit Days</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={PEAK_DAYS} margin={{ top:4, right:10, left:-20, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize:11 }} /><YAxis tick={{ fontSize:11 }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="patients" radius={[6,6,0,0]} name="Patients">
                  {PEAK_DAYS.map((e,i) => <Cell key={i} fill={e.day===peakDay.day?PURPLE:"#C4B5FD"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Appointments This Week</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={WEEKLY_APPTS} margin={{ top:4, right:10, left:-20, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize:11 }} /><YAxis tick={{ fontSize:11 }} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
                <Bar dataKey="appointment" fill={BLUE}   radius={[4,4,0,0]} name="Appointment" />
                <Bar dataKey="walkIn"      fill={ORANGE} radius={[4,4,0,0]} name="Walk-in" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Peak Hours</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={PEAK_HOURS} margin={{ top:4, right:10, left:-20, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize:10 }} /><YAxis tick={{ fontSize:11 }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" radius={[6,6,0,0]} name="Patients">
                  {PEAK_HOURS.map((e,i) => <Cell key={i} fill={e.hour===peakHour.hour?BLUE:"#93C5FD"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full">
          <thead><tr><Th>Month</Th><Th>New Patients</Th><Th>Returning</Th><Th>Inactive</Th><Th>Total</Th></tr></thead>
          <tbody className="divide-y divide-gray-50">
            {GROWTH_DATA.map(r => (
              <tr key={r.month} className="hover:bg-gray-50">
                <Td className="font-semibold text-gray-700">{r.month}</Td>
                <Td><span className="text-blue-600 font-semibold">{r.newPatients}</span></Td>
                <Td><span className="text-teal-600 font-semibold">{r.returning}</span></Td>
                <Td><span className="text-gray-500">{r.inactive}</span></Td>
                <Td className="font-bold text-gray-800">{r.newPatients + r.returning}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function QueuePanel() {
  const total = QUEUE_DATA.reduce((s,d) => s+d.served, 0);
  const peak  = QUEUE_DATA.reduce((a,b) => a.served > b.served ? a : b);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SmallKPI label="Total Served"  value={total}      icon={Users}       iconBg="bg-blue-50"   iconColor="text-blue-600"   />
        <SmallKPI label="Avg Wait Time" value="9 min"      icon={Clock}       iconBg="bg-yellow-50" iconColor="text-yellow-600" />
        <SmallKPI label="Longest Wait"  value="22 min"     icon={AlertCircle} iconBg="bg-red-50"    iconColor="text-red-500"    />
        <SmallKPI label="Peak Hour"     value={peak.hour}  sub={`${peak.served} served`} icon={TrendingUp} iconBg="bg-purple-50" iconColor="text-purple-600" />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-sm">Patients Served per Hour</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={QUEUE_DATA} margin={{ top:4, right:10, left:-20, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize:10 }} /><YAxis tick={{ fontSize:11 }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="served" radius={[6,6,0,0]} name="Patients Served">
                {QUEUE_DATA.map((e,i) => <Cell key={i} fill={e.served===peak.served?BLUE:"#93C5FD"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full">
          <thead><tr><Th>Hour</Th><Th>Patients Served</Th><Th>Avg Wait Time</Th><Th>Longest Wait</Th></tr></thead>
          <tbody className="divide-y divide-gray-50">
            {QUEUE_DATA.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <Td className="font-semibold text-gray-700">{r.hour}</Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{r.served}</span>
                    <div className="w-16 bg-gray-100 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-blue-500" style={{ width:`${(r.served/peak.served)*100}%` }} /></div>
                  </div>
                </Td>
                <Td className="text-gray-600">{r.avgWait}</Td>
                <Td className="text-gray-500">{r.longest}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SalesPanel() {
  const peak = [...SALES_BY_SERVICE].sort((a,b) => b.amount - a.amount)[0];
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SmallKPI label="Total Revenue"   value="₱241,500" sub="this month"    icon={DollarSign}   iconBg="bg-green-50"  iconColor="text-green-600"  trend={21} />
        <SmallKPI label="Transactions"    value={261}       sub="paid consults" icon={ReceiptText}  iconBg="bg-blue-50"   iconColor="text-blue-600"   trend={18} />
        <SmallKPI label="Avg per Patient" value="₱925"      sub="consult fee"   icon={BadgePercent} iconBg="bg-purple-50" iconColor="text-purple-600" trend={8}  />
        <SmallKPI label="Outstanding"     value="₱28,400"   sub="unpaid"        icon={CreditCard}   iconBg="bg-orange-50" iconColor="text-orange-500" trend={-15} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Weekly Revenue Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={SALES_TREND} margin={{ top:4, right:10, left:-10, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize:11 }} />
                <YAxis tick={{ fontSize:11 }} tickFormatter={v=>`₱${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="revenue" fill={GREEN} radius={[6,6,0,0]} name="Revenue (₱)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Revenue by Service Type</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={SALES_BY_SERVICE} layout="vertical" margin={{ top:4, right:20, left:10, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize:11 }} tickFormatter={v=>`₱${(v/1000).toFixed(0)}k`} />
                <YAxis dataKey="service" type="category" tick={{ fontSize:10 }} width={120} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="amount" radius={[0,6,6,0]} name="Amount (₱)">
                  {SALES_BY_SERVICE.map((e,i) => <Cell key={i} fill={e.service===peak.service?TEAL:"#99F6E4"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Payment Method Breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="55%" height={190}>
                <PieChart>
                  <Pie data={PAYMENT_DATA} cx="50%" cy="50%" outerRadius={85} dataKey="value" labelLine={false} label={<PieLabel />}>
                    {PAYMENT_DATA.map((e,i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v,n)=>[v,n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-3">
                {PAYMENT_DATA.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background:d.fill }} />
                    <div>
                      <p className="text-xs font-semibold text-gray-700">{d.name}</p>
                      <p className="text-xs text-gray-400">{d.value} transactions</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Monthly Revenue vs Target</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={190}>
              <LineChart data={MONTHLY_REVENUE} margin={{ top:4, right:20, left:-10, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize:11 }} />
                <YAxis tick={{ fontSize:11 }} tickFormatter={v=>`₱${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
                <Line type="monotone" dataKey="revenue" stroke={GREEN}  strokeWidth={2.5} dot={{ r:3 }} name="Actual Revenue" />
                <Line type="monotone" dataKey="target"  stroke={ORANGE} strokeWidth={2}   dot={{ r:3 }} strokeDasharray="5 3" name="Target" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full">
          <thead><tr><Th>#</Th><Th>Date</Th><Th>Patient</Th><Th>Service</Th><Th>Amount</Th><Th>Payment Method</Th><Th>Status</Th></tr></thead>
          <tbody className="divide-y divide-gray-50">
            {SALES_TXN.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <Td className="font-mono text-xs text-gray-400">{r.id}</Td>
                <Td className="text-gray-500">{r.date}</Td>
                <Td className="font-semibold text-gray-900">{r.patient}</Td>
                <Td className="text-gray-600">{r.service}</Td>
                <Td className="font-bold text-gray-800">{r.amount}</Td>
                <Td><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-600">{r.method}</span></Td>
                <Td><StatusBadge status={r.status} /></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════ */
export default function AdminDashboardReport() {
  const [activeView,     setActiveView]     = useState("overview");
  const [dateRange,      setDateRange]      = useState("week");
  const [dateFrom,       setDateFrom]       = useState("2026-03-01");
  const [dateTo,         setDateTo]         = useState("2026-03-05");
  const [doctorFilter,   setDoctorFilter]   = useState("All Doctors");
  const [statusFilter,   setStatusFilter]   = useState("All Status");
  const [followupFilter, setFollowupFilter] = useState("All");

  const active      = VIEWS.find(v => v.key === activeView);
  const isOverview  = activeView === "overview";
  const isReport    = !isOverview;

  const renderContent = () => {
    switch (activeView) {
      case "overview":   return <OverviewSection dateRange={dateRange} />;
      case "daily":      return <DailyPanel    doctorFilter={doctorFilter} statusFilter={statusFilter} />;
      case "status":     return <StatusPanel />;
      case "doctor":     return <DoctorPanel   doctorFilter={doctorFilter} />;
      case "patient":    return <PatientPanel />;
      case "followup":   return <FollowUpPanel followupFilter={followupFilter} />;
      case "engagement": return <EngagementPanel />;
      case "queue":      return <QueuePanel />;
      case "sales":      return <SalesPanel />;
      default:           return null;
    }
  };

  return (
    <MainLayout
      title={isOverview ? "Dashboard" : "Dashboard & Reports"}
      subtitle={isOverview ? "Clinic performance overview" : "Generate, analyze and export clinic reports"}
    >
      <div className="space-y-5">

        {/* ══ TOP CONTROL BAR ══ */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-4">

              {/* Date range toggle (Overview) or date pickers (Reports) */}
              {isOverview ? (
                <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
                  <CalendarDays className="w-4 h-4 text-gray-400 ml-2" />
                  {DATE_FILTERS.map(f => (
                    <button key={f.key} onClick={() => setDateRange(f.key)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150
                        ${dateRange === f.key ? "bg-white text-blue-600 shadow-sm shadow-blue-100" : "text-gray-500 hover:text-gray-700"}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Date From</label>
                    <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Date To</label>
                    <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="text-sm" />
                  </div>
                  {["daily","doctor"].includes(activeView) && (
                    <div className="min-w-[180px]">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Doctor</label>
                      <SelectBox value={doctorFilter} onChange={setDoctorFilter} options={DOCTORS_LIST} />
                    </div>
                  )}
                  {["daily","status"].includes(activeView) && (
                    <div className="min-w-[160px]">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Status</label>
                      <SelectBox value={statusFilter} onChange={setStatusFilter} options={STATUSES_LIST} />
                    </div>
                  )}
                  {activeView === "followup" && (
                    <div className="min-w-[180px]">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Follow-up Type</label>
                      <SelectBox value={followupFilter} onChange={setFollowupFilter} options={["All","Overdue","Upcoming"]} />
                    </div>
                  )}
                </>
              )}

              <div className="flex-1" />

              {/* Export buttons (reports only) */}
              {isReport && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="w-3.5 h-3.5 mr-1.5" /> Print</Button>
                  <Button size="sm" variant="outline"><Download className="w-3.5 h-3.5 mr-1.5" /> PDF</Button>
                  <Button size="sm" variant="outline"><FileText className="w-3.5 h-3.5 mr-1.5" /> Excel</Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ══ VIEW TABS ══ */}
        <div className="flex gap-2 flex-wrap">
          {VIEWS.map(v => {
            const Icon    = v.icon;
            const isActive= activeView === v.key;
            return (
              <button key={v.key} onClick={() => setActiveView(v.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border
                  ${isActive
                    ? `${v.bg} ${v.color} border-current shadow-sm`
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700"}`}>
                <Icon className="w-3.5 h-3.5" />
                {v.label}
              </button>
            );
          })}
        </div>

        {/* ══ CONTENT AREA ══ */}
        {isOverview ? (
          renderContent()
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${active?.bg}`}>
                  {active && <active.icon className={`w-5 h-5 ${active.color}`} />}
                </div>
                <div>
                  <CardTitle className="text-base">{active?.label} Report</CardTitle>
                  <p className="text-xs text-gray-400 mt-0.5">{dateFrom} {dateTo !== dateFrom ? `– ${dateTo}` : ""}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>{renderContent()}</CardContent>
          </Card>
        )}

      </div>
    </MainLayout>
  );
}