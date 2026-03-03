import React, { useState, useMemo } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Activity, Search, Download, Printer, FileText, Trash2,
  ChevronDown, ChevronLeft, ChevronRight, Shield, User,
  Calendar, UserCheck, Stethoscope, ClipboardList, Users,
  BarChart2, LogIn, LogOut, Plus, Edit, X, RefreshCw,
  CheckCircle, AlertCircle, Filter,
} from 'lucide-react';

/* ══════════════ CONSTANTS ══════════════ */

const MODULES = ['All Modules', 'Authentication', 'Patient', 'Appointment', 'Doctor Schedule', 'Consultation', 'User Management', 'CRM'];
const ACTION_TYPES = ['All Actions', 'Login', 'Logout', 'Create', 'Update', 'Delete', 'Status Update', 'Password Change'];
const USERS = ['All Users', 'Admin User', 'Dr. Sarah Smith', 'Dr. Michael Chen', 'Staff Maria', 'Staff Carlo'];
const ROLES = ['All Roles', 'Admin', 'Doctor', 'Staff'];
const PAGE_SIZE = 10;

/* ══════════════ MODULE CONFIG ══════════════ */
const MODULE_CONFIG = {
  Authentication:    { icon: Shield,        bg: 'bg-blue-50',   color: 'text-blue-600'   },
  Patient:           { icon: User,          bg: 'bg-teal-50',   color: 'text-teal-600'   },
  Appointment:       { icon: Calendar,      bg: 'bg-purple-50', color: 'text-purple-600' },
  'Doctor Schedule': { icon: Stethoscope,   bg: 'bg-green-50',  color: 'text-green-600'  },
  Consultation:      { icon: ClipboardList, bg: 'bg-orange-50', color: 'text-orange-600' },
  'User Management': { icon: Users,         bg: 'bg-rose-50',   color: 'text-rose-600'   },
  CRM:               { icon: BarChart2,     bg: 'bg-yellow-50', color: 'text-yellow-600' },
};

const ACTION_CONFIG = {
  Login:           { icon: LogIn,       color: 'text-blue-600'   },
  Logout:          { icon: LogOut,      color: 'text-gray-500'   },
  Create:          { icon: Plus,        color: 'text-green-600'  },
  Update:          { icon: Edit,        color: 'text-yellow-600' },
  Delete:          { icon: X,           color: 'text-red-600'    },
  'Status Update': { icon: RefreshCw,   color: 'text-purple-600' },
  'Password Change':{ icon: Shield,     color: 'text-orange-600' },
};

/* ══════════════ DEMO DATA ══════════════ */
const RAW_LOGS = [
  /* Authentication */
  { id:'LOG-001', datetime:'2026-03-02 08:01:22', user:'Admin User',      role:'Admin',  module:'Authentication',    action:'Login',          desc:'Admin User logged in successfully from IP 192.168.1.10',              status:'success' },
  { id:'LOG-002', datetime:'2026-03-02 08:03:10', user:'Dr. Sarah Smith', role:'Doctor', module:'Authentication',    action:'Login',          desc:'Dr. Sarah Smith logged in successfully from IP 192.168.1.22',         status:'success' },
  { id:'LOG-003', datetime:'2026-03-02 08:05:44', user:'Staff Maria',     role:'Staff',  module:'Authentication',    action:'Login',          desc:'Staff Maria logged in successfully from IP 192.168.1.15',             status:'success' },
  { id:'LOG-004', datetime:'2026-03-02 08:07:01', user:'Unknown',         role:'—',      module:'Authentication',    action:'Login',          desc:'Failed login attempt for username "jdoe" — invalid password',        status:'failed'  },
  /* Patient */
  { id:'LOG-005', datetime:'2026-03-02 08:15:33', user:'Staff Maria',     role:'Staff',  module:'Patient',           action:'Create',         desc:'New patient registered: Elena Ramos (ID: PAT-2041)',                  status:'success' },
  { id:'LOG-006', datetime:'2026-03-02 08:28:10', user:'Staff Maria',     role:'Staff',  module:'Patient',           action:'Update',         desc:'Patient record updated: John Doe (PAT-1012) — address changed',       status:'success' },
  { id:'LOG-007', datetime:'2026-03-02 08:45:00', user:'Admin User',      role:'Admin',  module:'Patient',           action:'Delete',         desc:'Patient record deleted: test patient (PAT-0001)',                     status:'success' },
  { id:'LOG-008', datetime:'2026-03-02 09:00:15', user:'Dr. Sarah Smith', role:'Doctor', module:'Patient',           action:'Update',         desc:'Medical history modified for patient Maria Santos (PAT-2015)',        status:'success' },
  /* Appointment */
  { id:'LOG-009', datetime:'2026-03-02 09:10:05', user:'Staff Carlo',     role:'Staff',  module:'Appointment',       action:'Create',         desc:'Appointment created: John Doe with Dr. Sarah Smith on 2026-03-05',   status:'success' },
  { id:'LOG-010', datetime:'2026-03-02 09:22:47', user:'Staff Maria',     role:'Staff',  module:'Appointment',       action:'Update',         desc:'Appointment rescheduled: APT-4521 moved from 09:00 to 10:30',        status:'success' },
  { id:'LOG-011', datetime:'2026-03-02 09:35:12', user:'Staff Carlo',     role:'Staff',  module:'Appointment',       action:'Delete',         desc:'Appointment cancelled: APT-4519 — patient request',                  status:'success' },
  { id:'LOG-012', datetime:'2026-03-02 09:50:00', user:'Dr. Michael Chen',role:'Doctor', module:'Appointment',       action:'Status Update',  desc:'Appointment APT-4520 status changed: Scheduled → Ongoing',           status:'success' },
  { id:'LOG-013', datetime:'2026-03-02 10:05:30', user:'Dr. Michael Chen',role:'Doctor', module:'Appointment',       action:'Status Update',  desc:'Appointment APT-4520 status changed: Ongoing → Completed',           status:'success' },
  { id:'LOG-014', datetime:'2026-03-02 10:20:00', user:'Staff Maria',     role:'Staff',  module:'Appointment',       action:'Status Update',  desc:'Appointment APT-4518 marked as No-show — patient did not arrive',    status:'success' },
  /* Doctor Schedule */
  { id:'LOG-015', datetime:'2026-03-02 10:30:11', user:'Admin User',      role:'Admin',  module:'Doctor Schedule',   action:'Create',         desc:'Schedule created for Dr. James Lim: Mon–Fri, 08:00–17:00',           status:'success' },
  { id:'LOG-016', datetime:'2026-03-02 10:45:00', user:'Admin User',      role:'Admin',  module:'Doctor Schedule',   action:'Update',         desc:'Working hours updated for Dr. Reyna Torres: now 09:00–18:00',        status:'success' },
  { id:'LOG-017', datetime:'2026-03-02 11:00:22', user:'Admin User',      role:'Admin',  module:'Doctor Schedule',   action:'Update',         desc:'Leave date added for Dr. Ana Reyes: 2026-03-10 (Medical Leave)',     status:'success' },
  /* Consultation */
  { id:'LOG-018', datetime:'2026-03-02 11:15:40', user:'Dr. Sarah Smith', role:'Doctor', module:'Consultation',      action:'Create',         desc:'Diagnosis added for John Doe: Hypertension Stage 1',                 status:'success' },
  { id:'LOG-019', datetime:'2026-03-02 11:30:00', user:'Dr. Sarah Smith', role:'Doctor', module:'Consultation',      action:'Update',         desc:'Prescription updated for John Doe — Amlodipine 5mg added',           status:'success' },
  { id:'LOG-020', datetime:'2026-03-02 11:45:15', user:'Dr. Michael Chen',role:'Doctor', module:'Consultation',      action:'Update',         desc:'Consultation notes edited for Ben Torres (APT-4515)',                status:'success' },
  { id:'LOG-021', datetime:'2026-03-02 11:50:00', user:'Dr. Michael Chen',role:'Doctor', module:'Consultation',      action:'Update',         desc:'Prescription update failed — system timeout',                        status:'failed'  },
  /* User Management */
  { id:'LOG-022', datetime:'2026-03-02 12:00:00', user:'Admin User',      role:'Admin',  module:'User Management',   action:'Create',         desc:'New user account created: Staff Carlo (role: Staff)',                status:'success' },
  { id:'LOG-023', datetime:'2026-03-02 12:05:00', user:'Admin User',      role:'Admin',  module:'User Management',   action:'Update',         desc:'User role updated: Staff Maria changed from Staff → Senior Staff',   status:'success' },
  { id:'LOG-024', datetime:'2026-03-02 12:10:00', user:'Admin User',      role:'Admin',  module:'User Management',   action:'Update',         desc:'User account deactivated: Dr. Juan Reyes (left clinic)',             status:'success' },
  { id:'LOG-025', datetime:'2026-03-02 12:15:00', user:'Admin User',      role:'Admin',  module:'User Management',   action:'Delete',         desc:'User account permanently deleted: temp_user_01',                     status:'success' },
  { id:'LOG-026', datetime:'2026-03-02 12:20:00', user:'Staff Carlo',     role:'Staff',  module:'Authentication',    action:'Password Change', desc:'Password changed by Staff Carlo',                                   status:'success' },
  /* CRM */
  { id:'LOG-027', datetime:'2026-03-02 13:05:00', user:'Staff Maria',     role:'Staff',  module:'CRM',               action:'Update',         desc:'Patient Maria Santos tagged as VIP',                                 status:'success' },
  { id:'LOG-028', datetime:'2026-03-02 13:15:00', user:'Staff Maria',     role:'Staff',  module:'CRM',               action:'Update',         desc:'Patient Ana Cruz tagged as Chronic',                                 status:'success' },
  { id:'LOG-029', datetime:'2026-03-02 13:30:00', user:'Staff Carlo',     role:'Staff',  module:'CRM',               action:'Create',         desc:'Follow-up scheduled for Ben Torres — 2026-03-15 with Dr. Chen',     status:'success' },
  { id:'LOG-030', datetime:'2026-03-02 13:45:00', user:'Staff Carlo',     role:'Staff',  module:'CRM',               action:'Update',         desc:'Follow-up marked as completed for David Lim',                       status:'success' },
  /* More throughout the day */
  { id:'LOG-031', datetime:'2026-03-02 14:00:00', user:'Dr. Sarah Smith', role:'Doctor', module:'Appointment',       action:'Status Update',  desc:'Appointment APT-4525 status changed: Scheduled → Ongoing',          status:'success' },
  { id:'LOG-032', datetime:'2026-03-02 14:15:22', user:'Staff Maria',     role:'Staff',  module:'Patient',           action:'Create',         desc:'New patient registered: Pedro Valdez (ID: PAT-2042)',                status:'success' },
  { id:'LOG-033', datetime:'2026-03-02 14:30:00', user:'Unknown',         role:'—',      module:'Authentication',    action:'Login',          desc:'Failed login attempt for username "admin2" — account not found',    status:'failed'  },
  { id:'LOG-034', datetime:'2026-03-02 14:45:00', user:'Dr. James Lim',   role:'Doctor', module:'Consultation',      action:'Create',         desc:'Diagnosis added for Carlos Reyes: Asthma (Mild Persistent)',         status:'success' },
  { id:'LOG-035', datetime:'2026-03-02 15:00:10', user:'Admin User',      role:'Admin',  module:'Doctor Schedule',   action:'Update',         desc:'Dr. Michael Chen schedule updated — added Saturday morning shift',   status:'success' },
  { id:'LOG-036', datetime:'2026-03-02 15:30:00', user:'Staff Carlo',     role:'Staff',  module:'Appointment',       action:'Create',         desc:'Appointment created: Pedro Valdez with Dr. James Lim on 2026-03-06',status:'success' },
  { id:'LOG-037', datetime:'2026-03-02 16:00:00', user:'Dr. Sarah Smith', role:'Doctor', module:'Authentication',    action:'Logout',         desc:'Dr. Sarah Smith logged out',                                         status:'success' },
  { id:'LOG-038', datetime:'2026-03-02 16:05:00', user:'Dr. Michael Chen',role:'Doctor', module:'Authentication',    action:'Logout',         desc:'Dr. Michael Chen logged out',                                        status:'success' },
  { id:'LOG-039', datetime:'2026-03-02 17:00:00', user:'Staff Maria',     role:'Staff',  module:'Authentication',    action:'Logout',         desc:'Staff Maria logged out',                                             status:'success' },
  { id:'LOG-040', datetime:'2026-03-02 17:05:00', user:'Admin User',      role:'Admin',  module:'Authentication',    action:'Logout',         desc:'Admin User logged out',                                              status:'success' },
];

/* ══════════════ SMALL COMPONENTS ══════════════ */

const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold
    ${status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
    {status === 'success'
      ? <CheckCircle className="w-3 h-3" />
      : <AlertCircle className="w-3 h-3" />}
    {status === 'success' ? 'Success' : 'Failed'}
  </span>
);

const RoleBadge = ({ role }) => {
  const map = { Admin:'bg-purple-100 text-purple-700', Doctor:'bg-blue-100 text-blue-700', Staff:'bg-teal-100 text-teal-700', '—':'bg-gray-100 text-gray-500' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${map[role]||'bg-gray-100 text-gray-500'}`}>{role}</span>;
};

const ModuleTag = ({ module }) => {
  const cfg = MODULE_CONFIG[module] || { icon: Activity, bg: 'bg-gray-50', color: 'text-gray-500' };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
      <Icon className="w-3 h-3" /> {module}
    </span>
  );
};

const ActionTag = ({ action }) => {
  const cfg = ACTION_CONFIG[action] || { icon: Activity, color: 'text-gray-500' };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${cfg.color}`}>
      <Icon className="w-3 h-3" /> {action}
    </span>
  );
};

const SelectBox = ({ value, onChange, options }) => (
  <div className="relative">
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
  </div>
);

/* ══════════════ MAIN PAGE ══════════════ */
export default function ActivityLogs() {
  const [dateFrom,    setDateFrom]    = useState('2026-03-02');
  const [dateTo,      setDateTo]      = useState('2026-03-02');
  const [userFilter,  setUserFilter]  = useState('All Users');
  const [moduleFilter,setModuleFilter]= useState('All Modules');
  const [actionFilter,setActionFilter]= useState('All Actions');
  const [roleFilter,  setRoleFilter]  = useState('All Roles');
  const [statusFil,   setStatusFil]   = useState('All');
  const [search,      setSearch]      = useState('');
  const [page,        setPage]        = useState(1);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [logs, setLogs] = useState(RAW_LOGS);

  /* ── filtered + searched logs ── */
  const filtered = useMemo(() => {
    return logs.filter(l => {
      if (userFilter   !== 'All Users'   && l.user   !== userFilter)   return false;
      if (moduleFilter !== 'All Modules' && l.module !== moduleFilter) return false;
      if (actionFilter !== 'All Actions' && l.action !== actionFilter) return false;
      if (roleFilter   !== 'All Roles'   && l.role   !== roleFilter)   return false;
      if (statusFil    === 'Success'     && l.status !== 'success')    return false;
      if (statusFil    === 'Failed'      && l.status !== 'failed')     return false;
      if (search) {
        const q = search.toLowerCase();
        return l.id.toLowerCase().includes(q) ||
               l.user.toLowerCase().includes(q) ||
               l.desc.toLowerCase().includes(q) ||
               l.module.toLowerCase().includes(q) ||
               l.action.toLowerCase().includes(q);
      }
      return true;
    });
  }, [logs, userFilter, moduleFilter, actionFilter, roleFilter, statusFil, search]);

  /* ── pagination ── */
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ── KPI summary ── */
  const total    = filtered.length;
  const success  = filtered.filter(l => l.status === 'success').length;
  const failed   = filtered.filter(l => l.status === 'failed').length;
  const logins   = filtered.filter(l => l.action === 'Login').length;
  const creates  = filtered.filter(l => l.action === 'Create').length;
  const deletes  = filtered.filter(l => l.action === 'Delete').length;

  const resetFilters = () => {
    setUserFilter('All Users'); setModuleFilter('All Modules');
    setActionFilter('All Actions'); setRoleFilter('All Roles');
    setStatusFil('All'); setSearch(''); setPage(1);
  };

  const handleClearLogs = () => { setLogs([]); setShowClearConfirm(false); };

  return (
    <MainLayout title="Activity Logs" subtitle="Complete audit trail of all system actions">
      <div className="space-y-5">

        {/* ══ FILTER BAR ══ */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-600">Filters</span>
              <button onClick={resetFilters} className="ml-auto text-xs text-blue-600 hover:underline font-medium">
                Reset All
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Date From</label>
                <Input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} className="text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Date To</label>
                <Input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} className="text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">User</label>
                <SelectBox value={userFilter} onChange={v => { setUserFilter(v); setPage(1); }} options={USERS} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Module</label>
                <SelectBox value={moduleFilter} onChange={v => { setModuleFilter(v); setPage(1); }} options={MODULES} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Action</label>
                <SelectBox value={actionFilter} onChange={v => { setActionFilter(v); setPage(1); }} options={ACTION_TYPES} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Status</label>
                <SelectBox value={statusFil} onChange={v => { setStatusFil(v); setPage(1); }} options={['All','Success','Failed']} />
              </div>
            </div>

            {/* Search row */}
            <div className="flex items-center gap-3 mt-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by log ID, user, description, module…"
                  className="pl-9 text-sm"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              {/* Export buttons */}
              <Button size="sm" variant="outline" onClick={() => window.print()}>
                <Printer className="w-3.5 h-3.5 mr-1.5" /> Print
              </Button>
              <Button size="sm" variant="outline">
                <Download className="w-3.5 h-3.5 mr-1.5" /> PDF
              </Button>
              <Button size="sm" variant="outline">
                <FileText className="w-3.5 h-3.5 mr-1.5" /> Excel
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-red-500 border-red-200 hover:bg-red-50 hover:border-red-400"
                onClick={() => setShowClearConfirm(true)}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ══ KPI SUMMARY STRIP ══ */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { label:'Total Logs',  value:total,   bg:'bg-blue-50',   color:'text-blue-600',  icon:Activity    },
            { label:'Success',     value:success, bg:'bg-green-50',  color:'text-green-600', icon:CheckCircle },
            { label:'Failed',      value:failed,  bg:'bg-red-50',    color:'text-red-500',   icon:AlertCircle },
            { label:'Logins',      value:logins,  bg:'bg-purple-50', color:'text-purple-600',icon:LogIn       },
            { label:'Creates',     value:creates, bg:'bg-teal-50',   color:'text-teal-600',  icon:Plus        },
            { label:'Deletes',     value:deletes, bg:'bg-orange-50', color:'text-orange-600',icon:Trash2      },
          ].map(c => {
            const Icon = c.icon;
            return (
              <Card key={c.label}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{c.label}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-0.5">{c.value}</p>
                    </div>
                    <div className={`p-2 rounded-lg ${c.bg}`}>
                      <Icon className={`w-4 h-4 ${c.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ══ MAIN TABLE ══ */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-base">Activity Log Table</CardTitle>
              </div>
              <span className="text-xs text-gray-400 font-medium">
                {filtered.length} record{filtered.length !== 1 ? 's' : ''} found
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-gray-100 bg-gray-50">
                    
                    <th className="text-left py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Date & Time</th>
                    <th className="text-left py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">User</th>
                    <th className="text-left py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Role</th>
                    <th className="text-left py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Module</th>
                    <th className="text-left py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Action</th>
                    <th className="text-left py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Description</th>
                    <th className="text-left py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-16 text-gray-400">
                        <Activity className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                        <p className="text-sm font-medium">No activity logs found</p>
                        <p className="text-xs mt-1">Try adjusting your filters</p>
                      </td>
                    </tr>
                  )}
                  {paginated.map(log => (
                    <tr
                      key={log.id}
                      className={`hover:bg-gray-50 transition-colors ${log.status === 'failed' ? 'bg-red-50/30' : ''}`}
                    >
      
                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className="text-xs font-semibold text-gray-700">{log.datetime.split(' ')[0]}</p>
                        <p className="text-xs text-gray-400">{log.datetime.split(' ')[1]}</p>
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-900 whitespace-nowrap">{log.user}</td>
                      <td className="py-3 px-4"><RoleBadge role={log.role} /></td>
                      <td className="py-3 px-4 whitespace-nowrap"><ModuleTag module={log.module} /></td>
                      <td className="py-3 px-4 whitespace-nowrap"><ActionTag action={log.action} /></td>
                      <td className="py-3 px-4 text-gray-500 text-xs max-w-xs">
                        <span className="line-clamp-2">{log.desc}</span>
                      </td>
                      <td className="py-3 px-4"><StatusBadge status={log.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    const p = totalPages <= 7 ? i+1 : page <= 4 ? i+1 : page >= totalPages-3 ? totalPages-6+i : page-3+i;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-7 h-7 rounded text-xs font-semibold transition-colors
                          ${page === p ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <Button size="sm" variant="ghost" onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ══ EXPORT FOOTER ══ */}
        <div className="flex flex-wrap justify-between items-center gap-3 pb-2">
          <p className="text-xs text-gray-400">
            Showing audit logs · Admin access only · All times are in local timezone
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" /> Print Logs
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" /> Export PDF
            </Button>
            <Button variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-2" /> Export Excel
            </Button>
            <Button
              variant="outline" size="sm"
              className="text-red-500 border-red-200 hover:bg-red-50"
              onClick={() => setShowClearConfirm(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Clear Logs
            </Button>
          </div>
        </div>

      </div>

      {/* ══ CLEAR CONFIRM MODAL ══ */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Clear All Logs?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              This will permanently delete all activity logs. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0"
                onClick={handleClearLogs}
              >
                Yes, Clear All
              </Button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}