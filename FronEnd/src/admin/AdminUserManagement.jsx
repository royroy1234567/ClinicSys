import React, { useEffect, useState, useMemo } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import {
  Plus, Edit, Trash2, Search, ChevronDown, Eye, EyeOff,
  Shield, Stethoscope, Users, UserCheck, UserX, KeyRound,
  X, Check, AlertTriangle, RefreshCw,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from 'lucide-react';
import { api } from '../services/Api';
import { useToast } from '../hooks/use-toast';

/* ══════════════ DEMO DATA ══════════════ */
const DEMO_USERS = [
  { id:'USR-001', name:'Admin User',      username:'admin',        email:'admin@clinic.com',          role:'admin',  status:'active',   contact:'+63 912 000 0001', dateCreated:'2025-01-01', lastLogin:'2026-03-02 08:01', forcePasswordChange: false },
  { id:'USR-002', name:'Dr. Sarah Smith', username:'dr.smith',     email:'sarah@clinic.com',          role:'doctor', status:'active',   contact:'+63 912 000 0002', dateCreated:'2025-01-05', lastLogin:'2026-03-02 08:03', forcePasswordChange: false },
  { id:'USR-003', name:'Dr. Michael Chen',username:'dr.chen',      email:'mchen@clinic.com',          role:'doctor', status:'active',   contact:'+63 912 000 0003', dateCreated:'2025-01-10', lastLogin:'2026-03-02 08:05', forcePasswordChange: false },
  { id:'USR-004', name:'Staff Maria',     username:'staff.maria',  email:'maria@clinic.com',          role:'staff',  status:'active',   contact:'+63 912 000 0004', dateCreated:'2025-02-01', lastLogin:'2026-03-02 08:07', forcePasswordChange: false },
  { id:'USR-005', name:'Staff Carlo',     username:'staff.carlo',  email:'carlo@clinic.com',          role:'staff',  status:'active',   contact:'+63 912 000 0005', dateCreated:'2025-03-15', lastLogin:'2026-03-01 17:00', forcePasswordChange: false },
  { id:'USR-006', name:'Dr. James Lim',   username:'dr.lim',       email:'jlim@clinic.com',           role:'doctor', status:'active',   contact:'+63 912 000 0006', dateCreated:'2025-04-01', lastLogin:'2026-03-01 16:00', forcePasswordChange: false },
  { id:'USR-007', name:'Dr. Reyna Torres',username:'dr.torres',    email:'rtorres@clinic.com',        role:'doctor', status:'inactive', contact:'+63 912 000 0007', dateCreated:'2025-05-01', lastLogin:'2026-02-15 09:00', forcePasswordChange: false },
  { id:'USR-008', name:'Dr. Ana Reyes',   username:'dr.reyes',     email:'areyes@clinic.com',         role:'doctor', status:'inactive', contact:'+63 912 000 0008', dateCreated:'2025-06-01', lastLogin:'2026-01-20 11:00', forcePasswordChange: true  },
  { id:'USR-009', name:'Staff Juan',      username:'staff.juan',   email:'juan@clinic.com',           role:'staff',  status:'active',   contact:'+63 912 000 0009', dateCreated:'2025-07-01', lastLogin:'2026-02-28 08:00', forcePasswordChange: false },
  { id:'USR-010', name:'Staff Lena',      username:'staff.lena',   email:'lena@clinic.com',           role:'staff',  status:'inactive', contact:'+63 912 000 0010', dateCreated:'2025-08-01', lastLogin:'2026-01-10 07:30', forcePasswordChange: false },
];

/* ══════════════ ROLE CONFIG ══════════════ */
const ROLE_CONFIG = {
  admin:  { label: 'Admin',  icon: Shield,     bg: 'bg-purple-100', color: 'text-purple-700', border: 'border-purple-200', access: ['Full access to all modules'] },
  doctor: { label: 'Doctor', icon: Stethoscope,bg: 'bg-blue-100',   color: 'text-blue-700',   border: 'border-blue-200',   access: ['Dashboard','My Appointments','Consultation','Patient Records','My Schedule'] },
  staff:  { label: 'Staff',  icon: Users,      bg: 'bg-teal-100',   color: 'text-teal-700',   border: 'border-teal-200',   access: ['Dashboard','Register Patient','Appointment Scheduling','Queue Management','CRM Follow-ups'] },
};

const ROLES        = ['All Roles', 'Admin', 'Doctor', 'Staff'];
const STATUSES     = ['All Status', 'Active', 'Inactive'];
const ROLE_OPTIONS = ['admin', 'doctor', 'staff'];

/* ══════════════ SMALL COMPONENTS ══════════════ */
const RoleBadge = ({ role }) => {
  const cfg = ROLE_CONFIG[role];
  if (!cfg) return null;
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

const FieldRow = ({ label, required, children }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

/* ══════════════ KPI CARD ══════════════ */
const KPICard = ({ label, value, icon: Icon, iconBg, iconColor }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        </div>
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
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
      {/* Left: count + rows per page */}
      <div className="flex items-center gap-3">
        <p className="text-xs text-gray-400">
          Showing <span className="font-semibold text-gray-600">{start}–{end}</span> of{' '}
          <span className="font-semibold text-gray-600">{totalItems}</span> users
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">Rows:</span>
          <div className="relative">
            <select
              value={pageSize}
              onChange={e => onPageSizeChange(Number(e.target.value))}
              className="text-xs border border-gray-200 rounded-lg pl-2 pr-6 py-1 text-gray-600 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Right: page controls */}
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(1)} disabled={currentPage === 1}
          className={`${btnBase} ${currentPage === 1 ? btnDisabled : btnIdle}`} title="First page">
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
          className={`${btnBase} ${currentPage === 1 ? btnDisabled : btnIdle}`} title="Previous page">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {getPageNumbers().map((p, i) =>
          p === '...'
            ? <span key={`ellipsis-${i}`} className="px-1 text-gray-300 text-xs select-none">…</span>
            : (
              <button key={p} onClick={() => onPageChange(p)}
                className={`${btnBase} ${p === currentPage ? btnActive : btnIdle}`}>
                {p}
              </button>
            )
        )}

        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0}
          className={`${btnBase} ${currentPage === totalPages || totalPages === 0 ? btnDisabled : btnIdle}`} title="Next page">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages || totalPages === 0}
          className={`${btnBase} ${currentPage === totalPages || totalPages === 0 ? btnDisabled : btnIdle}`} title="Last page">
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ══════════════ ADD / EDIT MODAL ══════════════ */
function UserModal({ mode, user, onClose, onSave }) {
  const isEdit = mode === 'edit';
  const [showPw,  setShowPw]  = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [errors,  setErrors]  = useState({});

  const [form, setForm] = useState(isEdit ? {
    name: user.name, username: user.username, email: user.email,
    contact: user.contact, role: user.role, status: user.status,
    password: '', confirmPassword: '', forcePasswordChange: user.forcePasswordChange,
  } : {
    name: '', username: '', email: '', contact: '', role: 'staff',
    status: 'active', password: '', confirmPassword: '', forcePasswordChange: false,
  });

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim())     e.name     = 'Full name is required';
    if (!form.username.trim()) e.username = 'Username is required';
    if (!isEdit) {
      if (!form.password)                         e.password        = 'Password is required';
      else if (form.password.length < 8)          e.password        = 'Min. 8 characters';
      if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    }
    if (!form.role) e.role = 'Role is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => { if (!validate()) return; onSave(form); };
  const roleCfg = ROLE_CONFIG[form.role];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit User' : 'Create New User'}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{isEdit ? `Editing: ${user.name}` : 'Fill in the details below'}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FieldRow label="Full Name" required>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Juan dela Cruz" className={inputCls} />
              {errors.name && <p className="text-xs text-red-500 mt-1">⚠ {errors.name}</p>}
            </FieldRow>
            <FieldRow label="Username" required>
              <input value={form.username} onChange={e => set('username', e.target.value)} placeholder="juan.delacruz" className={inputCls} />
              {errors.username && <p className="text-xs text-red-500 mt-1">⚠ {errors.username}</p>}
            </FieldRow>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FieldRow label="Email">
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="juan@clinic.com" className={inputCls} />
            </FieldRow>
            <FieldRow label="Contact Number">
              <input type="tel" value={form.contact} onChange={e => set('contact', e.target.value)} placeholder="+63 912 345 6789" className={inputCls} />
            </FieldRow>
          </div>

          <FieldRow label="Role" required>
            <div className="grid grid-cols-3 gap-2">
              {ROLE_OPTIONS.map(r => {
                const cfg = ROLE_CONFIG[r];
                const Icon = cfg.icon;
                const selected = form.role === r;
                return (
                  <button key={r} type="button" onClick={() => set('role', r)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all
                      ${selected ? `${cfg.bg} ${cfg.border} ${cfg.color}` : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}>
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-bold">{cfg.label}</span>
                  </button>
                );
              })}
            </div>
            {errors.role && <p className="text-xs text-red-500 mt-1">⚠ {errors.role}</p>}
            {roleCfg && (
              <div className={`mt-2 rounded-lg p-3 ${roleCfg.bg} border ${roleCfg.border}`}>
                <p className={`text-xs font-bold ${roleCfg.color} mb-1`}>Access:</p>
                {roleCfg.access.map(a => (
                  <p key={a} className={`text-xs ${roleCfg.color} flex items-center gap-1`}>
                    <Check className="w-3 h-3" /> {a}
                  </p>
                ))}
              </div>
            )}
          </FieldRow>

          <FieldRow label="Status">
            <div className="flex items-center gap-3">
              <Switch checked={form.status === 'active'} onCheckedChange={v => set('status', v ? 'active' : 'inactive')} />
              <StatusBadge status={form.status} />
            </div>
          </FieldRow>

          {isEdit ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-gray-200 flex-shrink-0">
                <KeyRound className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Password Cannot Be Changed Here</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Passwords can only be changed by the user themselves through their own account settings.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" /> Set Password
              </p>
              <div className="grid grid-cols-2 gap-3">
                <FieldRow label="Password" required>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} value={form.password}
                      onChange={e => set('password', e.target.value)} placeholder="Min. 8 characters"
                      className={`${inputCls} pr-10`} />
                    <button type="button" onClick={() => setShowPw(p => !p)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500 mt-1">⚠ {errors.password}</p>}
                </FieldRow>
                <FieldRow label="Confirm Password" required>
                  <div className="relative">
                    <input type={showCpw ? 'text' : 'password'} value={form.confirmPassword}
                      onChange={e => set('confirmPassword', e.target.value)} placeholder="Re-enter"
                      className={`${inputCls} pr-10`} />
                    <button type="button" onClick={() => setShowCpw(p => !p)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                      {showCpw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">⚠ {errors.confirmPassword}</p>}
                </FieldRow>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input type="checkbox" id="force-pw" checked={form.forcePasswordChange}
                  onChange={e => set('forcePasswordChange', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <label htmlFor="force-pw" className="text-xs text-gray-600 font-medium cursor-pointer">
                  Force password change on next login
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button onClick={() => {
            setForm(isEdit
              ? { name:user.name, username:user.username, email:user.email, contact:user.contact, role:user.role, status:user.status, password:'', confirmPassword:'', forcePasswordChange:user.forcePasswordChange }
              : { name:'', username:'', email:'', contact:'', role:'staff', status:'active', password:'', confirmPassword:'', forcePasswordChange:false });
            setErrors({});
          }} className="text-sm text-gray-400 hover:text-gray-600 font-medium flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Clear Form
          </button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Check className="w-4 h-4 mr-1.5" />
              {isEdit ? 'Save Changes' : 'Create User'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════ DELETE CONFIRM MODAL ══════════════ */
function DeleteModal({ user, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 text-center mb-1">Delete User?</h3>
        <p className="text-sm text-gray-500 text-center mb-1">You are about to delete:</p>
        <p className="text-sm font-bold text-gray-800 text-center mb-4">{user.name} ({user.username})</p>
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-5">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-600">This action is permanent and cannot be undone. All data associated with this user will be removed.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0" onClick={onConfirm}>
            Delete User
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════ MAIN PAGE ══════════════ */
export default function UserManagementPage() {
  const [users,      setUsers]      = useState(DEMO_USERS);
  const [search,     setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFil,  setStatusFil]  = useState('All Status');
  const [modal,      setModal]      = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize,    setPageSize]    = useState(10);

  const { toast } = useToast();

  /* ── filters ── */
  const filtered = useMemo(() => {
    return users.filter(u => {
      const rl = u.role.toLowerCase();
      const rf = roleFilter.toLowerCase().replace('all roles', '');
      if (rf && rl !== rf) return false;
      if (statusFil === 'Active'   && u.status !== 'active')   return false;
      if (statusFil === 'Inactive' && u.status !== 'inactive') return false;
      if (search) {
        const q = search.toLowerCase();
        return u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [users, roleFilter, statusFil, search]);

  // Reset to page 1 when filters change
  const prevFiltered = React.useRef(filtered);
  React.useEffect(() => {
    if (prevFiltered.current !== filtered) {
      setCurrentPage(1);
      prevFiltered.current = filtered;
    }
  }, [filtered]);

  /* ── paginated slice ── */
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(currentPage, totalPages);
  const paginated  = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  /* ── KPIs ── */
  const total    = users.length;
  const active   = users.filter(u => u.status === 'active').length;
  const inactive = users.filter(u => u.status === 'inactive').length;
  const admins   = users.filter(u => u.role === 'admin').length;
  const doctors  = users.filter(u => u.role === 'doctor').length;
  const staff    = users.filter(u => u.role === 'staff').length;

  /* ── handlers ── */
  const handleSave = (form) => {
    if (modal.mode === 'add') {
      const newUser = {
        id: `USR-${String(users.length + 1).padStart(3, '0')}`,
        name: form.name, username: form.username, email: form.email,
        contact: form.contact, role: form.role, status: form.status,
        dateCreated: new Date().toISOString().split('T')[0],
        lastLogin: '—', forcePasswordChange: form.forcePasswordChange,
      };
      setUsers(u => [...u, newUser]);
      toast({ title: 'User created', description: `${form.name} has been added successfully.` });
    } else {
      setUsers(u => u.map(x => x.id === modal.user.id ? { ...x, ...form } : x));
      toast({ title: 'User updated', description: `${form.name}'s record has been saved.` });
    }
    setModal(null);
  };

  const handleDelete = () => {
    setUsers(u => u.filter(x => x.id !== modal.user.id));
    toast({ title: 'User deleted', description: `${modal.user.name} has been removed.` });
    setModal(null);
  };

  const handleToggle = (userId) => {
    setUsers(u => u.map(x => x.id === userId ? { ...x, status: x.status === 'active' ? 'inactive' : 'active' } : x));
  };

  return (
    <MainLayout title="User Management" subtitle="Manage system users, roles and access control">
      <div className="space-y-5">

        {/* ══ KPI CARDS ══ */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          <KPICard label="Total Users" value={total}    icon={Users}       iconBg="bg-blue-50"   iconColor="text-blue-600"   />
          <KPICard label="Active"      value={active}   icon={UserCheck}   iconBg="bg-green-50"  iconColor="text-green-600"  />
          <KPICard label="Inactive"    value={inactive} icon={UserX}       iconBg="bg-gray-50"   iconColor="text-gray-500"   />
          <KPICard label="Admins"      value={admins}   icon={Shield}      iconBg="bg-purple-50" iconColor="text-purple-600" />
          <KPICard label="Doctors"     value={doctors}  icon={Stethoscope} iconBg="bg-blue-50"   iconColor="text-blue-600"   />
          <KPICard label="Staff"       value={staff}    icon={Users}       iconBg="bg-teal-50"   iconColor="text-teal-600"   />
        </div>

        {/* ══ FILTER + ACTION BAR ══ */}
        <Card>

          {/* ══ ROLE ACCESS REFERENCE ══ */}
     
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" /> Role Access Reference
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(ROLE_CONFIG).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <div key={key} className={`rounded-xl border p-4 ${cfg.bg} ${cfg.border}`}>
                    <div className={`flex items-center gap-2 mb-3 ${cfg.color}`}>
                      <Icon className="w-5 h-5" />
                      <span className="font-bold text-sm">{cfg.label}</span>
                    </div>
                    <ul className="space-y-1.5">
                      {cfg.access.map(a => (
                        <li key={a} className={`flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}>
                          <Check className="w-3 h-3 flex-shrink-0" /> {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </CardContent>  
        
        </Card>

        {/* ══ TABLE ══ */}
        <Card data-testid="users-list-card">

          <CardHeader className="">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" /> All Users
              </CardTitle>
              <span className="text-xs text-gray-400">{filtered.length} of {total} user{total !== 1 ? 's' : ''}</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <CardContent className="pb-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Search</label>
                <Search className="absolute left-3 bottom-2.5 w-4 h-4 text-gray-400" />
                <input placeholder="Name, username, email…" value={search}
                  onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                  className={`${inputCls} pl-9`} />
              </div>

              <div className="min-w-[140px]">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Role</label>
                <SelectBox value={roleFilter} onChange={v => { setRoleFilter(v); setCurrentPage(1); }} options={ROLES} />
              </div>

              <div className="min-w-[140px]">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Status</label>
                <SelectBox value={statusFil} onChange={v => { setStatusFil(v); setCurrentPage(1); }} options={STATUSES} />
              </div>

              <div className="flex-1" />

              <Button onClick={() => setModal({ mode: 'add' })} data-testid="add-user-button"
                className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" /> Create User
              </Button>
            </div>
          </CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-gray-100 bg-gray-50">
                    {['Full Name / Username','Role','Status','Date Created','Last Login','Actions'].map(h => (
                      <th key={h} className="text-left py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-14">
                        <Users className="w-10 h-10 mx-auto text-gray-200 mb-2" />
                        <p className="text-sm font-medium text-gray-400">No users found</p>
                        <p className="text-xs text-gray-300 mt-1">Try adjusting your search or filters</p>
                      </td>
                    </tr>
                  )}
                  {paginated.map(user => (
                    <tr key={user.id}
                      className={`hover:bg-gray-50 transition-colors ${user.status === 'inactive' ? 'opacity-60' : ''}`}
                      data-testid={`user-item-${user.id}`}>

                      {/* Name + username */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm
                            ${ROLE_CONFIG[user.role]?.bg || 'bg-gray-100'} ${ROLE_CONFIG[user.role]?.color || 'text-gray-600'}`}>
                            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 leading-tight">{user.name}</p>
                            <p className="text-xs text-gray-400">@{user.username}</p>
                            {user.forcePasswordChange && (
                              <span className="inline-flex items-center gap-0.5 text-xs text-orange-500 font-semibold mt-0.5">
                                <KeyRound className="w-3 h-3" /> Pw change required
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4"><RoleBadge role={user.role} /></td>

                      {/* Status + toggle */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Switch checked={user.status === 'active'} onCheckedChange={() => handleToggle(user.id)}
                            data-testid={`toggle-user-${user.id}`} />
                          <StatusBadge status={user.status} />
                        </div>
                      </td>

                      {/* Date created */}
                      <td className="py-3 px-4 text-xs text-gray-500 whitespace-nowrap">{user.dateCreated}</td>

                      {/* Last login */}
                      <td className="py-3 px-4 text-xs text-gray-500 whitespace-nowrap">{user.lastLogin}</td>

                      {/* Actions */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs gap-1"
                            onClick={() => setModal({ mode: 'edit', user })}
                            data-testid={`edit-user-${user.id}`}>
                            <Edit className="w-3 h-3" /> Edit
                          </Button>
                          <Button size="sm" variant="outline"
                            className="h-7 px-2.5 text-xs text-red-500 border-red-200 hover:bg-red-50 gap-1"
                            onClick={() => setModal({ mode: 'delete', user })}
                            data-testid={`delete-user-${user.id}`}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(n) => { setPageSize(n); setCurrentPage(1); }}
            />
          </CardContent>
        </Card>

        

      </div>

      {/* ══ MODALS ══ */}
      {(modal?.mode === 'add' || modal?.mode === 'edit') && (
        <UserModal mode={modal.mode} user={modal.user} onClose={() => setModal(null)} onSave={handleSave} />
      )}
      {modal?.mode === 'delete' && (
        <DeleteModal user={modal.user} onClose={() => setModal(null)} onConfirm={handleDelete} />
      )}
    </MainLayout>
  );
}