import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import MainLayout from "../components/layouts/MainLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  ZAxis,
  ComposedChart,
} from "recharts";
import {
  Calendar,
  Clock,
  Users,
  UserCheck,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
  FileText,
  Printer,
  Download,
  BarChart2,
  RefreshCw,
  AlertCircle,
  DollarSign,
  CreditCard,
  ReceiptText,
  BadgePercent,
  ChevronDown,
  LayoutDashboard,
} from "lucide-react";
import { api } from "../services/Api";

const BLUE = "#2563EB";
const GREEN = "#16A34A";
const YELLOW = "#F59E0B";
const RED = "#DC2626";
const TEAL = "#0D9488";
const GRAY = "#94A3B8";
const PURPLE = "#7C3AED";
const ORANGE = "#EA580C";
const PINK = "#EC4899";
const CYAN = "#06B6D4";

const RANGE_FILTERS = [
  { key: "monthly", label: "Monthly" },
  { key: "quarterly", label: "Quarterly" },
  { key: "yearly", label: "Yearly" },
];

const VIEWS = [
  {
    key: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    key: "daily",
    label: "Daily Appointments",
    icon: Calendar,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  {
    key: "status",
    label: "Appointment Status",
    icon: BarChart2,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    key: "doctor",
    label: "Doctor Performance",
    icon: UserCheck,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    key: "patient",
    label: "Patient Visits",
    icon: Users,
    color: "text-teal-600",
    bg: "bg-teal-50",
  },
  {
    key: "followup",
    label: "Follow-Up (CRM)",
    icon: RefreshCw,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
  },
  {
    key: "engagement",
    label: "Patient Engagement",
    icon: TrendingUp,
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
  {
    key: "queue",
    label: "Queue Management",
    icon: Clock,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    key: "sales",
    label: "Sales & Revenue",
    icon: DollarSign,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
  },
];

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.07) return null;
  const R = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  return (
    <text
      x={cx + r * Math.cos(-midAngle * R)}
      y={cy + r * Math.sin(-midAngle * R)}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={700}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    no_show: "bg-gray-100 text-gray-600",
    overdue: "bg-red-100 text-red-700",
    upcoming: "bg-blue-100 text-blue-700",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${map[status] || "bg-gray-100 text-gray-600"}`}
    >
      {status?.replace("_", " ")}
    </span>
  );
};

const SelectBox = ({ value, onChange, options, className = "" }) => (
  <div className={`relative ${className}`}>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    >
      {options.map((o) => (
        <option key={o.value || o} value={o.value || o}>
          {o.label || o}
        </option>
      ))}
    </select>
    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
  </div>
);

const KPICard = ({
  label,
  value,
  sub,
  icon: Icon,
  iconBg,
  iconColor,
  trend,
  trendLabel,
}) => (
  <Card>
    <CardContent className="p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {label}
          </p>
          <h3 className="text-3xl font-bold text-gray-900 mt-1">{value}</h3>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
          {trend !== undefined && (
            <div
              className={`flex items-center gap-1 mt-2 text-xs font-semibold ${trend >= 0 ? "text-green-600" : "text-red-500"}`}
            >
              {trend >= 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
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

const SmallKPI = ({
  label,
  value,
  sub,
  icon: Icon,
  iconBg,
  iconColor,
  trend,
}) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {label}
          </p>
          <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{value}</h3>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
          {trend !== undefined && (
            <div
              className={`flex items-center gap-0.5 mt-1 text-xs font-semibold ${trend >= 0 ? "text-green-600" : "text-red-500"}`}
            >
              {trend >= 0 ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
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
  <th
    className={`text-left py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50 ${className}`}
  >
    {children}
  </th>
);
const Td = ({ children, className = "" }) => (
  <td className={`py-3 px-4 text-sm ${className}`}>{children}</td>
);

const pctDelta = (arr, key) => {
  if (!arr?.length || arr.length < 2) return 0;
  const cur = Number(arr[arr.length - 1]?.[key] || 0);
  const prev = Number(arr[arr.length - 2]?.[key] || 0);
  if (!prev) return cur ? 100 : 0;
  return Math.round(((cur - prev) / prev) * 100);
};

const sumField = (arr, key) =>
  arr?.reduce((s, r) => s + Number(r?.[key] || 0), 0) || 0;

const exportCsv = (rows, fileName) => {
  const csv = rows
    .map((row) =>
      row.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

// ─── OVERVIEW ───────────────────────────────────────────────────────────────
function OverviewSection({ data, rangeLabel }) {
  const trend = data?.overview?.trend || [];
  const status = data?.status?.trend || [];
  const doctor = data?.doctor?.workload || [];
  const patientTrend = data?.patient?.trend || [];
  const salesTrend = data?.sales?.trend || [];

  const totalAppointments = sumField(trend, "actual");
  const completed = sumField(status, "completed");
  const cancelled = sumField(status, "cancelled");
  const revenue = sumField(salesTrend, "revenue");
  const activeDoctors = doctor.length;
  const totalPatients =
    sumField(patientTrend, "walkin") + sumField(patientTrend, "appointment");

  const tTotal = pctDelta(trend, "actual");
  const tCompleted = pctDelta(status, "completed");
  const tCancelled = pctDelta(status, "cancelled");
  const tRevenue = pctDelta(salesTrend, "revenue");

  const statusBreakdown = [
    { name: "Completed", value: completed, fill: GREEN },
    { name: "Cancelled", value: cancelled, fill: RED },
    { name: "No Show", value: sumField(status, "no_show"), fill: GRAY },
  ];

  // NEW: Stacked area chart data — appointments + revenue combined
  const combinedTrend = trend.map((t, i) => ({
    label: t.label,
    actual: t.actual,
    forecast: t.forecast,
    revenue: salesTrend[i]?.revenue || 0,
  }));

  // NEW: Completion rate per bucket
  const completionRate = status.map((s) => {
    const total = (s.completed || 0) + (s.cancelled || 0) + (s.no_show || 0);
    return {
      label: s.label,
      rate: total > 0 ? Math.round((s.completed / total) * 100) : 0,
    };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          label="Total Appointments"
          value={totalAppointments}
          sub={rangeLabel}
          icon={Calendar}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          trend={tTotal}
          trendLabel="vs previous bucket"
        />
        <KPICard
          label="Completed"
          value={completed}
          sub="appointments"
          icon={UserCheck}
          iconBg="bg-green-50"
          iconColor="text-green-600"
          trend={tCompleted}
          trendLabel="vs previous bucket"
        />
        <KPICard
          label="Cancelled"
          value={cancelled}
          sub="appointments"
          icon={AlertCircle}
          iconBg="bg-red-50"
          iconColor="text-red-600"
          trend={tCancelled}
          trendLabel="vs previous bucket"
        />
        <KPICard
          label="Total Visits"
          value={totalPatients}
          sub="walk-in + appointment"
          icon={Users}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
        />
        <KPICard
          label="Active Doctors"
          value={activeDoctors}
          sub="with workload data"
          icon={Activity}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
        <KPICard
          label="Revenue"
          value={`₱${Math.round(revenue).toLocaleString()}`}
          sub={rangeLabel}
          icon={DollarSign}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          trend={tRevenue}
          trendLabel="vs previous bucket"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Overall Appointment Trend (Actual vs Forecast)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} />
              <Line
                type="monotone"
                dataKey="actual"
                stroke={BLUE}
                strokeWidth={2.5}
                dot={{ r: 3 }}
                name="Actual Appointments"
              />
              <Line
                type="monotone"
                dataKey="forecast"
                stroke={ORANGE}
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={{ r: 3 }}
                name="Forecast Demand"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* NEW: Stacked Area – Appointments vs Revenue over time */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Appointments & Revenue Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={230}>
            <ComposedChart data={combinedTrend}>
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={BLUE} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={BLUE} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={GREEN} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={GREEN} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `₱${Math.round(v / 1000)}k`}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="actual"
                stroke={BLUE}
                fill="url(#colorActual)"
                strokeWidth={2}
                name="Appointments"
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="revenue"
                stroke={GREEN}
                fill="url(#colorRevenue)"
                strokeWidth={2}
                name="Revenue (₱)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statusBreakdown}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#F1F5F9"
                  vertical={false}
                />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Count">
                  {statusBreakdown.map((e, i) => (
                    <Cell key={i} fill={e.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* NEW: Completion Rate trend line */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Completion Rate % Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={completionRate}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={GREEN} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={GREEN} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                <Tooltip formatter={(v) => [`${v}%`, "Completion Rate"]} />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke={GREEN}
                  fill="url(#colorRate)"
                  strokeWidth={2.5}
                  name="Completion Rate"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Predicted Future Demand</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-5 rounded-xl bg-blue-50 border border-blue-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
              Forecasted next bucket demand
            </p>
            <p className="text-4xl font-black text-blue-700 mt-2">
              {Math.round(data?.overview?.predicted_future_demand || 0)}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Based on trend smoothing from historical appointment data.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── DAILY ───────────────────────────────────────────────────────────────────
function DailyPanel({ data }) {
  const trend = data?.daily?.trend || [];
  const peakTrend = data?.daily?.peak_trend || [];
  const peakHour = [...peakTrend].sort((a, b) => b.actual - a.actual)[0];
  const forecastPeak = [...peakTrend].sort(
    (a, b) => b.forecast - a.forecast,
  )[0];

  // NEW: Gap between actual and forecast per bucket
  const gapData = trend.map((t) => ({
    label: t.label,
    gap: (t.actual || 0) - Math.round(t.forecast || 0),
  }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SmallKPI
          label="Actual Volume"
          value={sumField(trend, "actual")}
          icon={Calendar}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <SmallKPI
          label="Forecast Volume"
          value={Math.round(sumField(trend, "forecast"))}
          icon={TrendingUp}
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
        />
        <SmallKPI
          label="Peak Hour"
          value={peakHour?.label || "—"}
          sub={`${peakHour?.actual || 0} actual`}
          icon={Clock}
          iconBg="bg-yellow-50"
          iconColor="text-yellow-600"
        />
        <SmallKPI
          label="Expected Peak"
          value={forecastPeak?.label || "—"}
          sub={`${Math.round(forecastPeak?.forecast || 0)} forecast`}
          icon={Activity}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Appointment Volume Trend (Actual vs Forecast)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} />
              <Line
                type="monotone"
                dataKey="actual"
                stroke={BLUE}
                strokeWidth={2.5}
                name="Actual"
              />
              <Line
                type="monotone"
                dataKey="forecast"
                stroke={ORANGE}
                strokeWidth={2}
                strokeDasharray="6 4"
                name="Forecast"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* NEW: Forecast vs Actual Gap bar chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Forecast Accuracy Gap (Actual − Forecast)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-400 mb-3">
            Positive = more patients than predicted. Negative = over-forecasted.
          </p>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={gapData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#F1F5F9"
                vertical={false}
              />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="gap" name="Gap" radius={[4, 4, 0, 0]}>
                {gapData.map((e, i) => (
                  <Cell key={i} fill={e.gap >= 0 ? BLUE : RED} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Peak Hours (Actual vs Expected)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={peakTrend}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#F1F5F9"
                vertical={false}
              />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} />
              <Bar
                dataKey="actual"
                fill={BLUE}
                radius={[4, 4, 0, 0]}
                name="Actual Peak Load"
              />
              <Bar
                dataKey="forecast"
                fill={ORANGE}
                radius={[4, 4, 0, 0]}
                name="Expected Peak Load"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* NEW: Peak hours area chart for flow visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Hourly Patient Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={peakTrend}>
              <defs>
                <linearGradient id="peakActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={BLUE} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={BLUE} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="peakForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={ORANGE} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={ORANGE} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} />
              <Area
                type="monotone"
                dataKey="actual"
                stroke={BLUE}
                fill="url(#peakActual)"
                strokeWidth={2}
                name="Actual Flow"
              />
              <Area
                type="monotone"
                dataKey="forecast"
                stroke={ORANGE}
                fill="url(#peakForecast)"
                strokeWidth={2}
                strokeDasharray="5 3"
                name="Forecast Flow"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── STATUS ──────────────────────────────────────────────────────────────────
function StatusPanel({ data }) {
  const trend = data?.status?.trend || [];
  const cancelReasons = data?.status?.cancel_reason_breakdown || [];
  const rescheduleReasons = data?.status?.reschedule_reason_breakdown || [];
  const cancelReasonTotal = Number(data?.status?.cancel_reason_total || 0);
  const rescheduleReasonTotal = Number(
    data?.status?.reschedule_reason_total || 0,
  );
  const total =
    sumField(trend, "completed") +
    sumField(trend, "cancelled") +
    sumField(trend, "no_show");
  const reasonColors = [BLUE, RED, ORANGE, PURPLE, TEAL, GRAY, GREEN, YELLOW];

  // NEW: Stacked bar — completed, cancelled, no-show per bucket
  const stackedStatus = trend.map((t) => ({
    label: t.label,
    completed: t.completed || 0,
    cancelled: t.cancelled || 0,
    no_show: t.no_show || 0,
  }));

  // NEW: Completion rate gauge-style data
  const completionPct =
    total > 0 ? Math.round((sumField(trend, "completed") / total) * 100) : 0;
  const noShowPct =
    total > 0 ? Math.round((sumField(trend, "no_show") / total) * 100) : 0;
  const cancelPct =
    total > 0 ? Math.round((sumField(trend, "cancelled") / total) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <SmallKPI
          label="Total"
          value={total}
          icon={Calendar}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <SmallKPI
          label="Completed"
          value={sumField(trend, "completed")}
          icon={UserCheck}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
        <SmallKPI
          label="Cancelled"
          value={sumField(trend, "cancelled")}
          icon={AlertCircle}
          iconBg="bg-red-50"
          iconColor="text-red-500"
        />
        <SmallKPI
          label="No-show"
          value={sumField(trend, "no_show")}
          icon={Users}
          iconBg="bg-gray-50"
          iconColor="text-gray-500"
        />
        <SmallKPI
          label="Forecast Risk"
          value={Math.round(
            sumField(trend, "forecast_cancelled") +
              sumField(trend, "forecast_no_show"),
          )}
          icon={TrendingUp}
          iconBg="bg-yellow-50"
          iconColor="text-yellow-600"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Status Trend (Actual + Forecast Risk)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} />
              <Line
                type="monotone"
                dataKey="completed"
                stroke={GREEN}
                name="Completed"
              />
              <Line
                type="monotone"
                dataKey="cancelled"
                stroke={RED}
                name="Cancelled"
              />
              <Line
                type="monotone"
                dataKey="no_show"
                stroke={GRAY}
                name="No Show"
              />
              <Line
                type="monotone"
                dataKey="forecast_cancelled"
                stroke={ORANGE}
                strokeDasharray="6 4"
                name="Forecast Cancelled"
              />
              <Line
                type="monotone"
                dataKey="forecast_no_show"
                stroke={PURPLE}
                strokeDasharray="6 4"
                name="Forecast No Show"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* NEW: Stacked bar chart per bucket */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Status Composition per Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={stackedStatus}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#F1F5F9"
                vertical={false}
              />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} />
              <Bar
                dataKey="completed"
                stackId="a"
                fill={GREEN}
                name="Completed"
              />
              <Bar
                dataKey="cancelled"
                stackId="a"
                fill={RED}
                name="Cancelled"
              />
              <Bar
                dataKey="no_show"
                stackId="a"
                fill={GRAY}
                radius={[4, 4, 0, 0]}
                name="No Show"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* NEW: Status summary donut chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Overall Status Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8 justify-center">
            <ResponsiveContainer width="45%" height={200}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Completed", value: sumField(trend, "completed") },
                    { name: "Cancelled", value: sumField(trend, "cancelled") },
                    { name: "No Show", value: sumField(trend, "no_show") },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  dataKey="value"
                  labelLine={false}
                  label={<PieLabel />}
                >
                  <Cell fill={GREEN} />
                  <Cell fill={RED} />
                  <Cell fill={GRAY} />
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-3">
              {[
                { label: "Completion Rate", pct: completionPct, color: GREEN },
                { label: "Cancellation Rate", pct: cancelPct, color: RED },
                { label: "No-show Rate", pct: noShowPct, color: GRAY },
              ].map((d) => (
                <div key={d.label}>
                  <div className="flex items-center justify-between mb-1 gap-4">
                    <span className="text-xs font-semibold text-gray-600">
                      {d.label}
                    </span>
                    <span
                      className="text-xs font-bold"
                      style={{ color: d.color }}
                    >
                      {d.pct}%
                    </span>
                  </div>
                  <div className="w-40 bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{ width: `${d.pct}%`, background: d.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Cancellation Reasons</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500 mb-2">
              Total captured: {cancelReasonTotal}
            </p>
            {cancelReasons.length === 0 ? (
              <p className="text-sm text-gray-500">
                No cancellation reason data yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={cancelReasons}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    labelLine={false}
                    label={<PieLabel />}
                  >
                    {cancelReasons.map((entry, idx) => (
                      <Cell
                        key={entry.name}
                        fill={reasonColors[idx % reasonColors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Reschedule Reasons</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500 mb-2">
              Total captured: {rescheduleReasonTotal}
            </p>
            {rescheduleReasons.length === 0 ? (
              <p className="text-sm text-gray-500">
                No reschedule reason data yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={rescheduleReasons}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    labelLine={false}
                    label={<PieLabel />}
                  >
                    {rescheduleReasons.map((entry, idx) => (
                      <Cell
                        key={entry.name}
                        fill={reasonColors[idx % reasonColors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── DOCTOR ──────────────────────────────────────────────────────────────────
function DoctorPanel({ data }) {
  const rows = data?.doctor?.workload || [];
  const total = sumField(rows, "actual");
  const ratedDoctors = rows.filter((r) => Number(r.rating_count || 0) > 0);
  const weightedRating = ratedDoctors.reduce(
    (acc, r) => acc + Number(r.avg_rating || 0) * Number(r.rating_count || 0),
    0,
  );
  const totalRatings = ratedDoctors.reduce(
    (acc, r) => acc + Number(r.rating_count || 0),
    0,
  );
  const overallRating =
    totalRatings > 0 ? (weightedRating / totalRatings).toFixed(2) : "0.00";

  // NEW: Efficiency ratio (actual / forecast)
  const efficiencyData = rows.map((r) => ({
    doctor: r.doctor,
    efficiency: r.forecast > 0 ? Math.round((r.actual / r.forecast) * 100) : 0,
    rating: Number(r.avg_rating || 0),
  }));

  // NEW: Radar chart data for top doctors (up to 6)
  const radarDoctors = rows.slice(0, 6).map((r) => ({
    doctor: r.doctor?.split(" ").slice(-1)[0] || r.doctor,
    Actual: r.actual || 0,
    Forecast: Math.round(r.forecast || 0),
    Rating: Math.round((r.avg_rating || 0) * 20), // scale 0-5 to 0-100
  }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SmallKPI
          label="Total Doctors"
          value={rows.length}
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <SmallKPI
          label="Actual Workload"
          value={total}
          icon={Calendar}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
        />
        <SmallKPI
          label="Predicted Load"
          value={Math.round(sumField(rows, "forecast"))}
          icon={TrendingUp}
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
        />
        <SmallKPI
          label="Patient Rating"
          value={`${overallRating}/5`}
          sub={`${totalRatings} ratings`}
          icon={Activity}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Doctor Workload (Actual vs Predicted)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={rows}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#F1F5F9"
                vertical={false}
              />
              <XAxis dataKey="doctor" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} />
              <Bar
                dataKey="actual"
                fill={BLUE}
                radius={[4, 4, 0, 0]}
                name="Actual Patients"
              />
              <Bar
                dataKey="forecast"
                fill={ORANGE}
                radius={[4, 4, 0, 0]}
                name="Forecast Workload"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* NEW: Doctor efficiency (actual vs forecast %) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Doctor Efficiency Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 pt-1">
              {efficiencyData.map((d) => (
                <div key={d.doctor}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-700 truncate max-w-[160px]">
                      {d.doctor}
                    </span>
                    <span
                      className={`text-xs font-bold ${d.efficiency >= 100 ? "text-green-600" : d.efficiency >= 75 ? "text-yellow-600" : "text-red-500"}`}
                    >
                      {d.efficiency}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(d.efficiency, 100)}%`,
                        background:
                          d.efficiency >= 100
                            ? GREEN
                            : d.efficiency >= 75
                              ? YELLOW
                              : RED,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* NEW: Radar chart for multi-dimension doctor comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Doctor Performance Radar (Top 6)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarDoctors}>
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis dataKey="doctor" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis tick={{ fontSize: 9 }} />
                <Radar
                  name="Actual"
                  dataKey="Actual"
                  stroke={BLUE}
                  fill={BLUE}
                  fillOpacity={0.15}
                />
                <Radar
                  name="Forecast"
                  dataKey="Forecast"
                  stroke={ORANGE}
                  fill={ORANGE}
                  fillOpacity={0.1}
                />
                <Legend iconType="circle" iconSize={8} />
                <Tooltip content={<ChartTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* NEW: Doctor rating bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Average Patient Rating per Doctor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={rows} layout="vertical">
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#F1F5F9"
                horizontal={false}
              />
              <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="doctor"
                tick={{ fontSize: 10 }}
                width={110}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="avg_rating" name="Avg Rating" radius={[0, 4, 4, 0]}>
                {rows.map((r, i) => (
                  <Cell
                    key={i}
                    fill={
                      Number(r.avg_rating) >= 4
                        ? GREEN
                        : Number(r.avg_rating) >= 3
                          ? YELLOW
                          : RED
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full">
          <thead>
            <tr>
              <Th>Doctor</Th>
              <Th>Actual Patients</Th>
              <Th>Forecast Workload</Th>
              <Th>Avg Patient Rating</Th>
              <Th>Ratings Count</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((r) => (
              <tr key={r.doctor} className="hover:bg-gray-50">
                <Td className="font-semibold text-gray-900">{r.doctor}</Td>
                <Td className="font-bold text-gray-800">
                  {Math.round(r.actual || 0)}
                </Td>
                <Td className="text-gray-600">{Math.round(r.forecast || 0)}</Td>
                <Td className="text-yellow-600 font-semibold">
                  {Number(r.avg_rating || 0).toFixed(2)} / 5
                </Td>
                <Td>
                  <span className="text-gray-600">{r.rating_count || 0}</span>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── PATIENT ─────────────────────────────────────────────────────────────────
function PatientPanel({ data }) {
  const trend = data?.patient?.trend || [];
  const mix = data?.patient?.mix || [];
  const tableRows = data?.patient?.table || [];

  const walkinTotal = sumField(trend, "walkin");
  const appointmentTotal = sumField(trend, "appointment");

  const pieRows = mix.map((m, i) => ({ ...m, fill: i === 0 ? YELLOW : BLUE }));

  // NEW: Stacked area of walkin + appointment over time
  // NEW: Walkin vs Appointment ratio per bucket
  const ratioData = trend.map((t) => {
    const tot = (t.walkin || 0) + (t.appointment || 0);
    return {
      label: t.label,
      walkin_pct: tot > 0 ? Math.round((t.walkin / tot) * 100) : 0,
      appt_pct: tot > 0 ? Math.round((t.appointment / tot) * 100) : 0,
    };
  });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SmallKPI
          label="Total Visits"
          value={walkinTotal + appointmentTotal}
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <SmallKPI
          label="Walk-in Patients"
          value={walkinTotal}
          icon={Activity}
          iconBg="bg-yellow-50"
          iconColor="text-yellow-600"
        />
        <SmallKPI
          label="Appointment Patients"
          value={appointmentTotal}
          icon={Calendar}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />
        <SmallKPI
          label="Forecast Visits"
          value={Math.round(
            sumField(trend, "forecast_walkin") +
              sumField(trend, "forecast_appointment"),
          )}
          icon={TrendingUp}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Visit Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="55%" height={190}>
                <PieChart>
                  <Pie
                    data={pieRows}
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    dataKey="value"
                    labelLine={false}
                    label={<PieLabel />}
                  >
                    {pieRows.map((e, i) => (
                      <Cell key={i} fill={e.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-3">
                {pieRows.map((d) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ background: d.fill }}
                    />
                    <div>
                      <p className="text-xs font-semibold text-gray-700">
                        {d.name}
                      </p>
                      <p className="text-xs text-gray-400">{d.value} visits</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Visit Trend (Actual vs Forecast)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={190}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" iconSize={8} />
                <Line
                  type="monotone"
                  dataKey="walkin"
                  stroke={YELLOW}
                  name="Walk-in Actual"
                />
                <Line
                  type="monotone"
                  dataKey="appointment"
                  stroke={BLUE}
                  name="Appointment Actual"
                />
                <Line
                  type="monotone"
                  dataKey="forecast_walkin"
                  stroke={ORANGE}
                  strokeDasharray="6 4"
                  name="Walk-in Forecast"
                />
                <Line
                  type="monotone"
                  dataKey="forecast_appointment"
                  stroke={TEAL}
                  strokeDasharray="6 4"
                  name="Appointment Forecast"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* NEW: Stacked area for cumulative patient volume */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Cumulative Patient Volume
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="areaWalkin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={YELLOW} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={YELLOW} stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="areaAppt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={BLUE} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={BLUE} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} />
              <Area
                type="monotone"
                dataKey="walkin"
                stroke={YELLOW}
                fill="url(#areaWalkin)"
                strokeWidth={2}
                name="Walk-in"
                stackId="1"
              />
              <Area
                type="monotone"
                dataKey="appointment"
                stroke={BLUE}
                fill="url(#areaAppt)"
                strokeWidth={2}
                name="Appointment"
                stackId="1"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* NEW: Walk-in vs appointment % split per period */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Visit Type Ratio per Period (%)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={ratioData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#F1F5F9"
                vertical={false}
              />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} />
              <Bar
                dataKey="walkin_pct"
                stackId="a"
                fill={YELLOW}
                name="Walk-in %"
              />
              <Bar
                dataKey="appt_pct"
                stackId="a"
                fill={BLUE}
                radius={[4, 4, 0, 0]}
                name="Appointment %"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full">
          <thead>
            <tr>
              <Th>Patient</Th>
              <Th>Total Visits</Th>
              <Th>Walk-in Patients</Th>
              <Th>Appointment Patients</Th>
              <Th>Last Visit</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {tableRows.map((r) => (
              <tr key={r.patient_id} className="hover:bg-gray-50">
                <Td className="font-semibold text-gray-900">
                  {r.patient_name}
                </Td>
                <Td className="font-bold text-gray-800">{r.total_visits}</Td>
                <Td>
                  <span className="text-yellow-600 font-semibold">
                    {r.walkin}
                  </span>
                </Td>
                <Td>
                  <span className="text-blue-600 font-semibold">
                    {r.appointment}
                  </span>
                </Td>
                <Td className="text-gray-500">{r.last_visit || "—"}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── FOLLOW-UP ───────────────────────────────────────────────────────────────
function FollowUpPanel({ data }) {
  const trend = data?.followup?.trend || [];
  const overdue = sumField(trend, "overdue");
  const upcoming = sumField(trend, "upcoming");

  // NEW: Overdue ratio per period
  const overdueRatio = trend.map((t) => {
    const tot = (t.overdue || 0) + (t.upcoming || 0);
    return {
      label: t.label,
      overdue_pct: tot > 0 ? Math.round(((t.overdue || 0) / tot) * 100) : 0,
    };
  });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <SmallKPI
          label="Total Follow-ups"
          value={overdue + upcoming}
          icon={RefreshCw}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <SmallKPI
          label="Overdue"
          value={overdue}
          icon={AlertCircle}
          iconBg="bg-red-50"
          iconColor="text-red-500"
        />
        <SmallKPI
          label="Upcoming"
          value={upcoming}
          icon={Calendar}
          iconBg="bg-yellow-50"
          iconColor="text-yellow-600"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Follow-up Demand Trend (Actual vs Forecast)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} />
              <Line
                type="monotone"
                dataKey="overdue"
                stroke={RED}
                name="Overdue Actual"
              />
              <Line
                type="monotone"
                dataKey="upcoming"
                stroke={BLUE}
                name="Upcoming Actual"
              />
              <Line
                type="monotone"
                dataKey="forecast_overdue"
                stroke={ORANGE}
                strokeDasharray="6 4"
                name="Overdue Forecast"
              />
              <Line
                type="monotone"
                dataKey="forecast_upcoming"
                stroke={TEAL}
                strokeDasharray="6 4"
                name="Upcoming Forecast"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* NEW: Stacked area – overdue vs upcoming over time */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Follow-up Volume Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="areaOverdue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={RED} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={RED} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="areaUpcoming" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={BLUE} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={BLUE} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} />
              <Area
                type="monotone"
                dataKey="overdue"
                stroke={RED}
                fill="url(#areaOverdue)"
                strokeWidth={2}
                name="Overdue"
                stackId="1"
              />
              <Area
                type="monotone"
                dataKey="upcoming"
                stroke={BLUE}
                fill="url(#areaUpcoming)"
                strokeWidth={2}
                name="Upcoming"
                stackId="1"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* NEW: Overdue % risk trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Overdue Risk % per Period</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-400 mb-3">
            Percentage of follow-ups that are overdue out of total follow-ups
            per period.
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={overdueRatio}>
              <defs>
                <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={RED} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={RED} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
              <Tooltip formatter={(v) => [`${v}%`, "Overdue Risk"]} />
              <Area
                type="monotone"
                dataKey="overdue_pct"
                stroke={RED}
                fill="url(#riskGrad)"
                strokeWidth={2.5}
                name="Overdue %"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── ENGAGEMENT ───────────────────────────────────────────────────────────────
function EngagementPanel({ data }) {
  const trend = data?.engagement?.trend || [];
  const latest = trend[trend.length - 1] || {};
  const retention =
    latest.new_patients + latest.returning_patients > 0
      ? Math.round(
          (latest.returning_patients /
            (latest.new_patients + latest.returning_patients)) *
            100,
        )
      : 0;

  // NEW: New vs returning stacked bar
  // NEW: Cumulative patient base over time
  let cumulative = 0;
  const cumulativeData = trend.map((t) => {
    cumulative += t.new_patients || 0;
    return { label: t.label, total: cumulative };
  });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SmallKPI
          label="New Patients"
          value={sumField(trend, "new_patients")}
          icon={UserCheck}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <SmallKPI
          label="Returning Patients"
          value={sumField(trend, "returning_patients")}
          icon={RefreshCw}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
        />
        <SmallKPI
          label="Retention %"
          value={`${retention}%`}
          icon={TrendingUp}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
        <SmallKPI
          label="Forecast Growth"
          value={Math.round(
            sumField(trend, "forecast_new_patients") +
              sumField(trend, "forecast_returning_patients"),
          )}
          icon={Activity}
          iconBg="bg-yellow-50"
          iconColor="text-yellow-600"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Patient Growth & Retention (Actual vs Forecast)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} />
              <Line
                type="monotone"
                dataKey="new_patients"
                stroke={BLUE}
                name="New Actual"
              />
              <Line
                type="monotone"
                dataKey="returning_patients"
                stroke={TEAL}
                name="Returning Actual"
              />
              <Line
                type="monotone"
                dataKey="forecast_new_patients"
                stroke={ORANGE}
                strokeDasharray="6 4"
                name="New Forecast"
              />
              <Line
                type="monotone"
                dataKey="forecast_returning_patients"
                stroke={PURPLE}
                strokeDasharray="6 4"
                name="Returning Forecast"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* NEW: Stacked bar – new vs returning per bucket */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            New vs Returning Patients per Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trend}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#F1F5F9"
                vertical={false}
              />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} />
              <Bar
                dataKey="new_patients"
                stackId="a"
                fill={BLUE}
                name="New Patients"
              />
              <Bar
                dataKey="returning_patients"
                stackId="a"
                fill={TEAL}
                radius={[4, 4, 0, 0]}
                name="Returning Patients"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* NEW: Cumulative patient base area chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Cumulative New Patient Base Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={cumulativeData}>
              <defs>
                <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PURPLE} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={PURPLE} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="total"
                stroke={PURPLE}
                fill="url(#cumGrad)"
                strokeWidth={2.5}
                name="Cumulative Patients"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── QUEUE ────────────────────────────────────────────────────────────────────
function QueuePanel({ data }) {
  const trend = data?.queue?.trend || [];
  const total = sumField(trend, "served");
  const avgWait = trend.length
    ? (sumField(trend, "avg_wait") / trend.length).toFixed(2)
    : "0.00";
  const forecastWait = trend.length
    ? (sumField(trend, "forecast_wait") / trend.length).toFixed(2)
    : "0.00";

  // NEW: Wait time distribution (bucketed)
  const waitBuckets = [
    { range: "0–5 min", count: trend.filter((t) => t.avg_wait <= 5).length },
    {
      range: "6–10 min",
      count: trend.filter((t) => t.avg_wait > 5 && t.avg_wait <= 10).length,
    },
    {
      range: "11–20 min",
      count: trend.filter((t) => t.avg_wait > 10 && t.avg_wait <= 20).length,
    },
    { range: "20+ min", count: trend.filter((t) => t.avg_wait > 20).length },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SmallKPI
          label="Total Served"
          value={total}
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <SmallKPI
          label="Avg Wait Time"
          value={`${avgWait} min`}
          icon={Clock}
          iconBg="bg-yellow-50"
          iconColor="text-yellow-600"
        />
        <SmallKPI
          label="Forecast Wait"
          value={`${forecastWait} min`}
          icon={TrendingUp}
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
        />
        <SmallKPI
          label="Forecast Served"
          value={Math.round(sumField(trend, "forecast_served"))}
          icon={Activity}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Queue Volume and Wait Time (Actual vs Forecast)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11 }}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="served"
                stroke={BLUE}
                name="Served Actual"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="forecast_served"
                stroke={ORANGE}
                strokeDasharray="6 4"
                name="Served Forecast"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="avg_wait"
                stroke={RED}
                name="Avg Wait Actual"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="forecast_wait"
                stroke={PURPLE}
                strokeDasharray="6 4"
                name="Avg Wait Forecast"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* NEW: Area chart for wait time trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Wait Time Trend Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="waitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={RED} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={RED} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fWaitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PURPLE} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={PURPLE} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit=" min" />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} />
              <Area
                type="monotone"
                dataKey="avg_wait"
                stroke={RED}
                fill="url(#waitGrad)"
                strokeWidth={2}
                name="Actual Wait (min)"
              />
              <Area
                type="monotone"
                dataKey="forecast_wait"
                stroke={PURPLE}
                fill="url(#fWaitGrad)"
                strokeWidth={2}
                strokeDasharray="5 3"
                name="Forecast Wait (min)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* NEW: Wait time distribution bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Wait Time Distribution (Period Buckets)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={waitBuckets}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#F1F5F9"
                vertical={false}
              />
              <XAxis dataKey="range" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" name="# of Periods" radius={[6, 6, 0, 0]}>
                {waitBuckets.map((b, i) => (
                  <Cell
                    key={i}
                    fill={
                      i === 0
                        ? GREEN
                        : i === 1
                          ? YELLOW
                          : i === 2
                            ? ORANGE
                            : RED
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── SALES ───────────────────────────────────────────────────────────────────
function SalesPanel({ data }) {
  const trend = data?.sales?.trend || [];
  const demand = data?.sales?.service_demand || [];
  const totalRevenue = sumField(trend, "revenue");

  // NEW: Revenue vs forecast gap
  const revenueGap = trend.map((t) => ({
    label: t.label,
    gap: Math.round((t.revenue || 0) - (t.forecast_revenue || 0)),
  }));

  // NEW: Revenue area chart
  // NEW: Service demand donut
  const serviceColors = [TEAL, BLUE, PURPLE, ORANGE, GREEN, YELLOW, RED, CYAN];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SmallKPI
          label="Total Revenue"
          value={`₱${Math.round(totalRevenue).toLocaleString()}`}
          sub="actual"
          icon={DollarSign}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
        <SmallKPI
          label="Forecast Revenue"
          value={`₱${Math.round(sumField(trend, "forecast_revenue")).toLocaleString()}`}
          sub="predicted"
          icon={TrendingUp}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <SmallKPI
          label="Service Demand"
          value={Math.round(sumField(demand, "actual"))}
          sub="actual qty"
          icon={ReceiptText}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
        <SmallKPI
          label="Demand Forecast"
          value={Math.round(sumField(demand, "forecast"))}
          sub="predicted qty"
          icon={BadgePercent}
          iconBg="bg-orange-50"
          iconColor="text-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Revenue Trend (Actual vs Forecast)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `₱${Math.round(v / 1000)}k`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" iconSize={8} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke={GREEN}
                  strokeWidth={2.5}
                  name="Actual Revenue"
                />
                <Line
                  type="monotone"
                  dataKey="forecast_revenue"
                  stroke={ORANGE}
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  name="Forecast Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Service Demand (Actual vs Forecast)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={demand}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#F1F5F9"
                  vertical={false}
                />
                <XAxis dataKey="service" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" iconSize={8} />
                <Bar
                  dataKey="actual"
                  fill={TEAL}
                  radius={[4, 4, 0, 0]}
                  name="Actual Demand"
                />
                <Bar
                  dataKey="forecast"
                  fill={ORANGE}
                  radius={[4, 4, 0, 0]}
                  name="Forecast Demand"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* NEW: Revenue area chart with gradient */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Revenue Flow Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="revActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={GREEN} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={GREEN} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="revForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={ORANGE} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={ORANGE} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `₱${Math.round(v / 1000)}k`}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={GREEN}
                fill="url(#revActual)"
                strokeWidth={2.5}
                name="Actual Revenue"
              />
              <Area
                type="monotone"
                dataKey="forecast_revenue"
                stroke={ORANGE}
                fill="url(#revForecast)"
                strokeWidth={2}
                strokeDasharray="5 3"
                name="Forecast Revenue"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* NEW: Revenue vs forecast gap bar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Revenue vs Forecast Gap (₱)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-400 mb-3">
              Positive = above forecast. Negative = below forecast.
            </p>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={revenueGap}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#F1F5F9"
                  vertical={false}
                />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `₱${Math.round(v / 1000)}k`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="gap" name="Revenue Gap (₱)" radius={[4, 4, 0, 0]}>
                  {revenueGap.map((e, i) => (
                    <Cell key={i} fill={e.gap >= 0 ? GREEN : RED} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* NEW: Service demand donut */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Service Demand Share (Donut)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={demand}
                  dataKey="actual"
                  nameKey="service"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  labelLine={false}
                  label={<PieLabel />}
                >
                  {demand.map((_, idx) => (
                    <Cell
                      key={idx}
                      fill={serviceColors[idx % serviceColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── ROOT COMPONENT ───────────────────────────────────────────────────────────
export default function AdminDashboardReport() {
  const location = useLocation();
  const [range, setRange] = useState("monthly");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const activeView = useMemo(() => {
    const hashKey = (location.hash || "").replace("#", "");
    return VIEWS.some((v) => v.key === hashKey) ? hashKey : "overview";
  }, [location.hash]);

  const active = VIEWS.find((v) => v.key === activeView);
  const isOverview = activeView === "overview";
  const isReport = !isOverview;

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const payload = await api.manager.getDashboardAnalytics(range);
      setData(payload);
    } catch (e) {
      setError(e?.message || "Failed to load dashboard analytics.");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const renderContent = () => {
    if (loading) {
      return (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            Loading analytics…
          </CardContent>
        </Card>
      );
    }
    if (error) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-600 font-semibold">{error}</p>
            <Button className="mt-3" onClick={loadAnalytics}>
              Retry
            </Button>
          </CardContent>
        </Card>
      );
    }
    switch (activeView) {
      case "overview":
        return (
          <OverviewSection
            data={data}
            rangeLabel={RANGE_FILTERS.find(
              (f) => f.key === range,
            )?.label?.toLowerCase()}
          />
        );
      case "daily":
        return <DailyPanel data={data} />;
      case "status":
        return <StatusPanel data={data} />;
      case "doctor":
        return <DoctorPanel data={data} />;
      case "patient":
        return <PatientPanel data={data} />;
      case "followup":
        return <FollowUpPanel data={data} />;
      case "engagement":
        return <EngagementPanel data={data} />;
      case "queue":
        return <QueuePanel data={data} />;
      case "sales":
        return <SalesPanel data={data} />;
      default:
        return null;
    }
  };

  const handleExportPdf = () => {
    const payload = JSON.stringify(data ?? {}, null, 2);
    const content = `Manager Dashboard Report (${activeView})\nGenerated: ${new Date().toLocaleString("en-PH")}\nRange: ${range}\n\n${payload}`;
    const blob = new Blob([content], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `manager-dashboard-${activeView}-${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    const trend = data?.overview?.trend || [];
    const rows = [
      ["Label", "Actual", "Forecast"],
      ...trend.map((r) => [r.label, r.actual ?? 0, r.forecast ?? 0]),
    ];
    exportCsv(
      rows,
      `manager-dashboard-${activeView}-${new Date().toISOString().slice(0, 10)}.csv`,
    );
  };

  return (
    <MainLayout
      title={isOverview ? "Dashboard" : "Dashboard & Reports"}
      subtitle={
        isOverview
          ? "Clinic performance with forecast analytics"
          : "Actual vs forecast analytics by section"
      }
    >
      <div className="space-y-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
                <CalendarDays className="w-4 h-4 text-gray-400 ml-2" />
                {RANGE_FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setRange(f.key)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150 ${range === f.key ? "bg-white text-blue-600 shadow-sm shadow-blue-100" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {isReport && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                      Date From
                    </label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                      Date To
                    </label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div className="min-w-[180px]">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                      Period
                    </label>
                    <SelectBox
                      value={range}
                      onChange={setRange}
                      options={RANGE_FILTERS.map((f) => ({
                        value: f.key,
                        label: f.label,
                      }))}
                    />
                  </div>
                </>
              )}

              <div className="flex-1" />
              {isReport && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.print()}
                  >
                    <Printer className="w-3.5 h-3.5 mr-1.5" /> Print
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleExportPdf}>
                    <Download className="w-3.5 h-3.5 mr-1.5" /> PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleExportExcel}
                  >
                    <FileText className="w-3.5 h-3.5 mr-1.5" /> Excel
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {isOverview ? (
          renderContent()
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${active?.bg}`}>
                  {active && (
                    <active.icon className={`w-5 h-5 ${active.color}`} />
                  )}
                </div>
                <div>
                  <CardTitle className="text-base">
                    {active?.label} Report
                  </CardTitle>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {RANGE_FILTERS.find((f) => f.key === range)?.label ||
                      "Monthly"}{" "}
                    Analytics
                  </p>
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