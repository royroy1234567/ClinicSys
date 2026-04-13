import React, { useEffect, useState } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Search, ChevronDown, Check, X,
  Shield, Stethoscope, Users, KeyRound,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Briefcase, Eye,
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

/* ══════════════ CONFIG ══════════════ */
const API = 'http://backend1.test/api';

const ROLE_CONFIG = {
  manager: { label: 'Manager', icon: Briefcase,   bg: 'bg-orange-100', color: 'text-orange-700', border: 'border-orange-200', access: ['Full system oversight', 'Reports & Analytics', 'User Management'] },
  admin:   { label: 'Admin',   icon: Shield,       bg: 'bg-purple-100', color: 'text-purple-700', border: 'border-purple-200', access: ['Full access to all modules'] },
  doctor:  { label: 'Doctor',  icon: Stethoscope,  bg: 'bg-blue-100',   color: 'text-blue-700',   border: 'border-blue-200',   access: ['Dashboard', 'My Appointments', 'Consultation', 'Patient Records', 'My Schedule'] },
  staff:   { label: 'Staff',   icon: Users,        bg: 'bg-teal-100',   color: 'text-teal-700',   border: 'border-teal-200',   access: ['Dashboard', 'Register Patient', 'Appointment Scheduling', 'Queue Management', 'CRM Follow-ups'] },
};

const ROLES    = ['All Roles', 'Manager', 'Admin', 'Doctor', 'Staff'];
const STATUSES = ['All Status', 'Active', 'Inactive'];

/* ══════════════ HELPERS ══════════════ */
const apiFetch = async (path, options = {}) => {
  const token = localStorage.getItem('auth_token');
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
};

const getRawId = (user) => user?.user_id ?? user?.raw_id ?? user?.id;
const getPublicId = (user) => user?.public_id || '—';

/* ══════════════ SMALL COMPONENTS ══════════════ */
const RoleBadge = ({ role }) => {
  const cfg = ROLE_CONFIG[role?.toLowerCase()];
  if (!cfg) return <span className="text-xs text-gray-400">{role}</span>;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
};

const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold
    ${status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
    {status === 'active' ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
    {status === 'active' ? 'Active' : 'Inactive'}
  </span>
);

const SelectBox = ({ value, onChange, options }) => (
  <div className="relative">
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
  </div>
);

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

const InfoRow = ({ label, value }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{label}</span>
    <span className="text-sm text-gray-800 font-medium">{value || <span className="text-gray-300">—</span>}</span>
  </div>
);

/* ══════════════ KPI CARD ══════════════ */
const KPICard = ({ label, value, icon: Icon, iconBg, iconColor, loading }) => (
  <Card className="py-0 gap-0 rounded-2xl border-gray-200 bg-white shadow-sm">
    <CardContent className="p-4">
      <div className="flex flex-col items-start text-left gap-2.5">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        {loading
          ? <div className="w-10 h-8 bg-gray-100 rounded animate-pulse" />
          : <p className="text-3xl font-extrabold text-gray-900 leading-none">{value}</p>}
        <p className="text-sm font-semibold text-gray-500">{label}</p>
      </div>
    </CardContent>
  </Card>
);

/* ══════════════ PAGINATION ══════════════ */
function Pagination({ currentPage, totalPages, totalItems, pageSize, onPageChange, onPageSizeChange }) {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end   = Math.min(currentPage * pageSize, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
    return pages;
  };

  const btnBase     = "inline-flex items-center justify-center h-8 w-8 rounded-lg text-xs font-semibold transition-all";
  const btnActive   = "bg-blue-600 text-white shadow-sm shadow-blue-200";
  const btnIdle     = "border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 bg-white";
  const btnDisabled = "border border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50/60 rounded-b-xl">
      <div className="flex items-center gap-3">
        <p className="text-xs text-gray-400">
          Showing <span className="font-semibold text-gray-600">{start}–{end}</span> of{' '}
          <span className="font-semibold text-gray-600">{totalItems}</span> users
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">Rows:</span>
          <div className="relative">
            <select value={pageSize} onChange={e => onPageSizeChange(Number(e.target.value))}
              className="text-xs border border-gray-200 rounded-lg pl-2 pr-6 py-1 text-gray-600 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
              {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(1)} disabled={currentPage === 1} className={`${btnBase} ${currentPage === 1 ? btnDisabled : btnIdle}`}><ChevronsLeft className="w-3.5 h-3.5" /></button>
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className={`${btnBase} ${currentPage === 1 ? btnDisabled : btnIdle}`}><ChevronLeft className="w-3.5 h-3.5" /></button>
        {getPageNumbers().map((p, i) =>
          p === '...'
            ? <span key={`e-${i}`} className="px-1 text-gray-300 text-xs select-none">…</span>
            : <button key={p} onClick={() => onPageChange(p)} className={`${btnBase} ${p === currentPage ? btnActive : btnIdle}`}>{p}</button>
        )}
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0} className={`${btnBase} ${currentPage === totalPages || totalPages === 0 ? btnDisabled : btnIdle}`}><ChevronRight className="w-3.5 h-3.5" /></button>
        <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages || totalPages === 0} className={`${btnBase} ${currentPage === totalPages || totalPages === 0 ? btnDisabled : btnIdle}`}><ChevronsRight className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}

/* ══════════════ VIEW USER MODAL ══════════════ */
function ViewUserModal({ user, onClose }) {
  const role     = user.role?.toLowerCase();
  const status   = user.status?.toLowerCase();
  const cfg      = ROLE_CONFIG[role];
  const RoleIcon = cfg?.icon ?? Users;
  const fullName = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${cfg?.bg ?? 'bg-gray-100'} ${cfg?.color ?? 'text-gray-600'}`}>
              {`${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">{fullName}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-gray-400">@{user.username}</p>
                <RoleBadge role={role} />
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">

          {/* Status */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Account Status</span>
            <StatusBadge status={status} />
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <InfoRow label="First Name"   value={user.first_name} />
            <InfoRow label="Last Name"    value={user.last_name} />
            <InfoRow label="Username"     value={user.username} />
            <InfoRow label="Email"        value={user.email} />
            <InfoRow label="Contact"      value={user.contact_number} />
            <InfoRow label="Date Created" value={user.created_at ? new Date(user.created_at).toLocaleDateString() : null} />
          </div>

          {/* Doctor-specific */}
          {role === 'doctor' && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wide flex items-center gap-1.5 mb-3">
                <Stethoscope className="w-3.5 h-3.5" /> Doctor Details
              </p>
              <InfoRow label="License Number" value={user.license_number} />
            </div>
          )}

          {/* Role access */}
          {cfg && (
            <div className={`rounded-xl border p-4 ${cfg.bg} ${cfg.border}`}>
              <p className={`text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 mb-2 ${cfg.color}`}>
                <RoleIcon className="w-3.5 h-3.5" /> Role Access
              </p>
              <ul className="space-y-1.5">
                {cfg.access.map(a => (
                  <li key={a} className={`flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}>
                    <Check className="w-3 h-3 flex-shrink-0" /> {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Password note */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-gray-200 flex-shrink-0">
              <KeyRound className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Password Hidden</p>
              <p className="text-xs text-gray-400 mt-0.5">Passwords are not visible for security reasons.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 pb-6">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════ MAIN PAGE ══════════════ */
export default function UserManagementPage() {
  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [roleFilter,  setRoleFilter]  = useState('All Roles');
  const [statusFil,   setStatusFil]   = useState('All Status');
  const [viewUser,    setViewUser]    = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize,    setPageSize]    = useState(10);

  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)                      params.set('search', search);
      if (roleFilter !== 'All Roles')  params.set('role',   roleFilter);
      if (statusFil  !== 'All Status') params.set('status', statusFil);
      const { ok, data } = await apiFetch(`/users?${params}`);
      if (ok) setUsers(Array.isArray(data) ? data : data.data ?? []);
      else toast({ title: 'Error', description: 'Failed to load users.', variant: 'destructive' });
    } catch {
      toast({ title: 'Network error', description: 'Could not reach the server.', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  useEffect(() => { setCurrentPage(1); fetchUsers(); }, [search, roleFilter, statusFil]);

  const totalPages = Math.max(1, Math.ceil(users.length / pageSize));
  const safePage   = Math.min(currentPage, totalPages);
  const paginated  = users.slice((safePage - 1) * pageSize, safePage * pageSize);

  const total    = users.length;
  const doctors  = users.filter(u => u.role?.toLowerCase() === 'doctor').length;
  const staff    = users.filter(u => u.role?.toLowerCase() === 'staff').length;

  const fullName = (u) => `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim();
  const initials = (u) => `${u.first_name?.[0] ?? ''}${u.last_name?.[0] ?? ''}`.toUpperCase();

  return (
    <MainLayout title="User Management" subtitle="View system users, roles and access control">
      <div className="space-y-5">

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <KPICard label="Total"    value={total}    icon={Users}       iconBg="bg-blue-50"   iconColor="text-blue-600"   loading={loading} />
          <KPICard label="Doctors"  value={doctors}  icon={Stethoscope} iconBg="bg-blue-50"   iconColor="text-blue-600"   loading={loading} />
          <KPICard label="Staff"    value={staff}    icon={Users}       iconBg="bg-teal-50"   iconColor="text-teal-600"   loading={loading} />
        </div>

        {/* TABLE */}
        <Card data-testid="users-list-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" /> All Users
              </CardTitle>
              <span className="text-xs text-gray-400">{users.length} user{users.length !== 1 ? 's' : ''}</span>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <CardContent className="pb-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="relative flex-1 min-w-[220px]">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Search</label>
                  <Search className="absolute left-3 bottom-2.5 w-4 h-4 text-gray-400" />
                  <input placeholder="Name, username, email…" value={search}
                    onChange={e => setSearch(e.target.value)} className={`${inputCls} pl-9`} />
                </div>
                <div className="min-w-[140px]">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Role</label>
                  <SelectBox value={roleFilter} onChange={setRoleFilter} options={ROLES} />
                </div>
                <div className="min-w-[140px]">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Status</label>
                  <SelectBox value={statusFil} onChange={setStatusFil} options={STATUSES} />
                </div>
              </div>
            </CardContent>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-gray-100 bg-gray-50">
                    {['Name / Username', 'Role', 'Contact', 'Status', 'Date Created', 'Actions'].map(h => (
                      <th key={h} className="text-left py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading && Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="py-3 px-4"><div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" /></td>
                    ))}</tr>
                  ))}
                  {!loading && paginated.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-14">
                        <Users className="w-10 h-10 mx-auto text-gray-200 mb-2" />
                        <p className="text-sm font-medium text-gray-400">No users found</p>
                        <p className="text-xs text-gray-300 mt-1">Try adjusting your search or filters</p>
                      </td>
                    </tr>
                  )}
                  {!loading && paginated.map(user => {
                    const role   = user.role?.toLowerCase();
                    const status = user.status?.toLowerCase();
                    return (
                      <tr key={getRawId(user)} className={`hover:bg-gray-50 transition-colors ${status === 'inactive' ? 'opacity-60' : ''}`}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm
                              ${ROLE_CONFIG[role]?.bg || 'bg-gray-100'} ${ROLE_CONFIG[role]?.color || 'text-gray-600'}`}>
                              {initials(user)}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 leading-tight">{fullName(user)}</p>
                              <p className="text-xs text-gray-400">@{user.username}</p>
                              <p className="text-xs font-mono text-gray-400">{getPublicId(user)}</p>
                              <p className="text-xs text-gray-400">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4"><RoleBadge role={role} /></td>
                        <td className="py-3 px-4 text-xs text-gray-500">{user.contact_number || '—'}</td>
                        <td className="py-3 px-4"><StatusBadge status={status} /></td>
                        <td className="py-3 px-4 text-xs text-gray-500 whitespace-nowrap">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <button size="sm" variant="outline"
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
                            onClick={() => setViewUser(user)}>
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={safePage} totalPages={totalPages} totalItems={users.length}
              pageSize={pageSize} onPageChange={setCurrentPage}
              onPageSizeChange={(n) => { setPageSize(n); setCurrentPage(1); }}
            />
          </CardContent>
        </Card>

      </div>

      {viewUser && (
        <ViewUserModal user={viewUser} onClose={() => setViewUser(null)} />
      )}
    </MainLayout>
  );
}
