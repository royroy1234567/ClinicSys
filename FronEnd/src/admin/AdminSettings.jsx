import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import {
  Building2, Palette, Bell, Shield, Database, Save, RefreshCw,
  Check, ChevronRight, ChevronDown, Sun, Moon, Monitor, Globe, Clock, Phone,
  Mail, MapPin, Upload, Eye, EyeOff, AlertTriangle, Info,
  HardDrive, Trash2, Download, Loader2, Menu, X,
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://backend1.test/api';

/* ── API helper ── */
const apiFetch = async (path, options = {}) => {
  const token = localStorage.getItem('auth_token');
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }
  return res.json();
};

/* ══════════ HELPERS ══════════ */
const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

const SelectBox = ({ value, onChange, options }) => (
  <div className="relative">
    <select value={value} onChange={e => onChange(e.target.value)}
      className={`${inputCls} appearance-none pr-8`}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    <ChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none rotate-90" />
  </div>
);

const FieldRow = ({ label, hint, children }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">{label}</label>
    {children}
    {hint && <p className="text-xs text-gray-400">{hint}</p>}
  </div>
);

const ToggleRow = ({ label, description, checked, onChange, disabled }) => (
  <div className={`flex items-center justify-between py-3 ${disabled ? 'opacity-50' : ''}`}>
    <div className="pr-4">
      <p className="text-sm font-semibold text-gray-800">{label}</p>
      {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
    </div>
    <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
  </div>
);

const SectionHeader = ({ title, description }) => (
  <div className="mb-5">
    <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">{title}</h3>
    {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
    <div className="mt-2 h-px bg-gray-100" />
  </div>
);

/* ══════════ TABS ══════════ */
const TABS = [
  { key: 'clinic',        label: 'Clinic Info',   icon: Building2 },
  { key: 'notifications', label: 'Notifications', icon: Bell      },
  { key: 'security',      label: 'Security',      icon: Shield    },
  { key: 'system',        label: 'System',        icon: Database  },
];

/* Default values */
const DEFAULT_CLINIC = {
  name:     'ClinicSys Medical Center',
  tagline:  'Your Health, Our Priority',
  address:  '123 Rizal St., Quezon City, Metro Manila',
  phone:    '+63 2 8123 4567',
  mobile:   '+63 912 345 6789',
  email:    'info@clinicsys.com',
  website:  'www.clinicsys.com',
  tin:      '123-456-789-000',
  phic:     'PHIC-123456',
  schedule: 'Mon–Sat: 8:00 AM – 6:00 PM',
};

/* ══════════ MAIN ══════════ */
export default function SettingsPage() {
  const { toast } = useToast();
  const [activeTab,     setActiveTab]     = useState('clinic');
  const [saved,         setSaved]         = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [loadingClinic, setLoadingClinic] = useState(true);
  const [sidebarOpen,   setSidebarOpen]   = useState(false); // mobile drawer

  /* — Clinic Info — */
  const [clinic, setClinic] = useState(DEFAULT_CLINIC);

  /* — Notifications — */
  const [notifs, setNotifs] = useState({
    emailAppointments: true, emailFollowups: true, emailReports: false,
    smsAppointments: true, smsFollowups: false,
    inAppAll: true, inAppAppointments: true, inAppQueue: true, inAppSystem: true,
    reminderHours: '24', dailySummary: true, weeklySummary: false,
  });

  /* — Security — */
  const [security, setSecurity] = useState({
    twoFactor: false, sessionTimeout: '30', passwordExpiry: '90',
    loginAttempts: '5', auditLog: true, ipRestriction: false, forceHttps: true,
  });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw,     setShowNewPw]     = useState(false);
  const [pwForm,  setPwForm]  = useState({ current: '', newPw: '', confirm: '' });
  const [pwSaving,setPwSaving]= useState(false);

  /* — System — */
  const [system, setSystem] = useState({
    autoBackup: true, backupFrequency: 'daily', backupRetention: '30',
    maintenanceMode: false, debugMode: false, cacheEnabled: true, maxUploadSize: '10',
  });

  /* ── Load clinic settings on mount ── */
  useEffect(() => {
    const load = async () => {
      setLoadingClinic(true);
      try {
        const data = await apiFetch('/clinic-settings');
        if (data && Object.keys(data).length > 0) {
          setClinic(prev => ({ ...prev, ...data }));
        }
      } catch {
        // fallback to defaults — silently ignore
      } finally {
        setLoadingClinic(false);
      }
    };
    load();
  }, []);

  const setC   = (k, v) => setClinic(p   => ({ ...p, [k]: v }));
  const setN   = (k, v) => setNotifs(p   => ({ ...p, [k]: v }));
  const setS   = (k, v) => setSecurity(p => ({ ...p, [k]: v }));
  const setSys = (k, v) => setSystem(p   => ({ ...p, [k]: v }));

  /* ── Save clinic settings ── */
  const handleSave = async () => {
    setSaving(true);
    try {
      if (activeTab === 'clinic') {
        await apiFetch('/clinic-settings', {
          method: 'POST',
          body: JSON.stringify(clinic),
        });
      }
      setSaved(true);
      toast({ title: 'Settings saved', description: 'Your changes have been applied successfully.' });
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      toast({ title: 'Error saving', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  /* ── Update password ── */
  const handleUpdatePassword = async () => {
    if (!pwForm.current)                return toast({ title: 'Error', description: 'Enter your current password.',        variant: 'destructive' });
    if (pwForm.newPw.length < 8)        return toast({ title: 'Error', description: 'New password must be at least 8 characters.', variant: 'destructive' });
    if (pwForm.newPw !== pwForm.confirm) return toast({ title: 'Error', description: 'Passwords do not match.',            variant: 'destructive' });

    setPwSaving(true);
    try {
      await apiFetch('/auth/verify-password', {
        method: 'POST',
        body: JSON.stringify({ password: pwForm.current }),
      });
      await apiFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          current_password:          pwForm.current,
          new_password:              pwForm.newPw,
          new_password_confirmation: pwForm.confirm,
        }),
      });
      setPwForm({ current: '', newPw: '', confirm: '' });
      toast({ title: 'Password updated', description: 'Your password has been changed successfully.' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setPwSaving(false);
    }
  };

  /* ── Tab switcher (closes mobile drawer) ── */
  const switchTab = (key) => {
    setActiveTab(key);
    setSidebarOpen(false);
  };

  /* ── Active tab label ── */
  const activeLabel = TABS.find(t => t.key === activeTab)?.label ?? '';

  return (
    <MainLayout title="Settings" subtitle="Manage clinic preferences and system configuration">

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex gap-5 max-w-6xl mx-auto relative">

        {/* ══ SIDEBAR — desktop always visible, mobile drawer ══ */}
        <aside
          className={`
            fixed top-0 left-0 h-full z-40 bg-white shadow-xl w-64 pt-16 px-3 transition-transform duration-200
            lg:static lg:h-auto lg:w-52 lg:flex-shrink-0 lg:bg-transparent lg:shadow-none lg:pt-0 lg:px-0 lg:z-auto lg:translate-x-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          {/* Close button — mobile only */}
          <button
            className="absolute top-4 right-4 lg:hidden text-gray-500 hover:text-gray-800"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>

          <Card className="lg:sticky lg:top-4">
            <CardContent className="p-2">
              {TABS.map(t => {
                const Icon = t.icon;
                const active = activeTab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => switchTab(t.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all mb-0.5
                      ${active ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {t.label}
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </aside>

        {/* ══ CONTENT ══ */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Mobile top bar — shows current tab + hamburger */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 shadow-sm"
            >
              <Menu className="w-4 h-4" />
              {activeLabel}
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>

          {/* ── CLINIC INFO ── */}
          {activeTab === 'clinic' && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" /> Clinic Information
                </CardTitle>
                <p className="text-xs text-gray-400">
                  Basic details that appear on receipts, reports, patient communications, and the landing page.
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                {loadingClinic ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-blue-400 animate-spin mr-2" />
                    <span className="text-sm text-gray-400">Loading clinic settings…</span>
                  </div>
                ) : (
                  <>
                    {/* Logo upload */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-300 transition-colors">
                      <div className="w-16 h-16 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-8 h-8 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-700">Clinic Logo</p>
                        <p className="text-xs text-gray-400 mt-0.5">PNG or JPG, max 2MB. Shown on reports & receipts.</p>
                        <Button size="sm" variant="outline" className="mt-2 h-7 text-xs gap-1.5">
                          <Upload className="w-3 h-3" /> Upload Logo
                        </Button>
                      </div>
                    </div>

                    <SectionHeader title="Basic Details" />

                    {/* 2-col on sm+, 1-col on mobile */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FieldRow label="Clinic Name">
                        <input value={clinic.name} onChange={e => setC('name', e.target.value)} className={inputCls} />
                      </FieldRow>
                      <FieldRow label="Tagline / Subtitle">
                        <input value={clinic.tagline} onChange={e => setC('tagline', e.target.value)} className={inputCls} />
                      </FieldRow>
                    </div>

                    <FieldRow label="Address">
                      <input value={clinic.address} onChange={e => setC('address', e.target.value)} className={inputCls} />
                    </FieldRow>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FieldRow label="Landline">
                        <input value={clinic.phone} onChange={e => setC('phone', e.target.value)} className={inputCls} />
                      </FieldRow>
                      <FieldRow label="Mobile">
                        <input value={clinic.mobile} onChange={e => setC('mobile', e.target.value)} className={inputCls} />
                      </FieldRow>
                      <FieldRow label="Email">
                        <input type="email" value={clinic.email} onChange={e => setC('email', e.target.value)} className={inputCls} />
                      </FieldRow>
                      <FieldRow label="Website">
                        <input value={clinic.website} onChange={e => setC('website', e.target.value)} className={inputCls} />
                      </FieldRow>
                    </div>

                    <SectionHeader title="Regulatory Info" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FieldRow label="TIN">
                        <input value={clinic.tin} onChange={e => setC('tin', e.target.value)} className={inputCls} />
                      </FieldRow>
                      <FieldRow label="PhilHealth Accreditation No.">
                        <input value={clinic.phic} onChange={e => setC('phic', e.target.value)} className={inputCls} />
                      </FieldRow>
                    </div>

                    <FieldRow label="Operating Schedule" hint="This appears on the landing page contact section.">
                      <input value={clinic.schedule} onChange={e => setC('schedule', e.target.value)} className={inputCls} />
                    </FieldRow>

                    {/* Live preview */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">Landing Page Preview</p>
                      <p className="text-sm font-bold text-gray-800">{clinic.name || '—'}</p>
                      <p className="text-xs text-gray-500 italic">"{clinic.tagline || '—'}"</p>
                      <p className="text-xs text-gray-400 mt-1">📍 {clinic.address || '—'}</p>
                      <p className="text-xs text-gray-400">📞 {clinic.phone} · 📧 {clinic.email}</p>
                      <p className="text-xs text-gray-400">🕒 {clinic.schedule || '—'}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── NOTIFICATIONS ── */}
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-600" /> Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <SectionHeader title="Email Notifications" />
                <div className="divide-y divide-gray-50">
                  <ToggleRow label="Appointment Reminders" description="Send email reminders for upcoming appointments"
                    checked={notifs.emailAppointments} onChange={v => setN('emailAppointments', v)} />
                  <ToggleRow label="Follow-up Alerts" description="Notify staff when follow-ups are due or overdue"
                    checked={notifs.emailFollowups} onChange={v => setN('emailFollowups', v)} />
                  <ToggleRow label="Report Summaries" description="Receive daily/weekly report emails"
                    checked={notifs.emailReports} onChange={v => setN('emailReports', v)} />
                </div>

                <SectionHeader title="SMS Notifications" description="Requires SMS gateway integration" />
                <div className="divide-y divide-gray-50">
                  <ToggleRow label="Appointment SMS Reminders" description="Text patients before their appointment"
                    checked={notifs.smsAppointments} onChange={v => setN('smsAppointments', v)} />
                  <ToggleRow label="Follow-up SMS Alerts" description="Text patients when follow-up is scheduled"
                    checked={notifs.smsFollowups} onChange={v => setN('smsFollowups', v)} />
                </div>

                <SectionHeader title="In-App Notifications" />
                <div className="divide-y divide-gray-50">
                  <ToggleRow label="All Notifications" description="Master toggle for in-app alerts"
                    checked={notifs.inAppAll} onChange={v => setN('inAppAll', v)} />
                  <ToggleRow label="Appointment Updates"
                    checked={notifs.inAppAppointments} onChange={v => setN('inAppAppointments', v)} disabled={!notifs.inAppAll} />
                  <ToggleRow label="Queue Changes"
                    checked={notifs.inAppQueue} onChange={v => setN('inAppQueue', v)} disabled={!notifs.inAppAll} />
                  <ToggleRow label="System Alerts"
                    checked={notifs.inAppSystem} onChange={v => setN('inAppSystem', v)} disabled={!notifs.inAppAll} />
                </div>

                <SectionHeader title="Reminder Timing" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FieldRow label="Appointment Reminder (hours before)">
                    <SelectBox value={notifs.reminderHours} onChange={v => setN('reminderHours', v)}
                      options={[
                        {value:'1',label:'1 hour'},{value:'2',label:'2 hours'},{value:'6',label:'6 hours'},
                        {value:'12',label:'12 hours'},{value:'24',label:'24 hours'},{value:'48',label:'48 hours'},
                      ]} />
                  </FieldRow>
                </div>

                <SectionHeader title="Summary Reports" />
                <div className="divide-y divide-gray-50">
                  <ToggleRow label="Daily Summary" description="End-of-day appointment and queue summary"
                    checked={notifs.dailySummary} onChange={v => setN('dailySummary', v)} />
                  <ToggleRow label="Weekly Summary" description="Weekly performance overview every Monday"
                    checked={notifs.weeklySummary} onChange={v => setN('weeklySummary', v)} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── SECURITY ── */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" /> Security Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SectionHeader title="Access Control" />
                  <div className="divide-y divide-gray-50">
                    <ToggleRow label="Two-Factor Authentication" description="Require OTP on login for all users"
                      checked={security.twoFactor} onChange={v => setS('twoFactor', v)} />
                    <ToggleRow label="Enforce HTTPS" description="Redirect all HTTP traffic to HTTPS"
                      checked={security.forceHttps} onChange={v => setS('forceHttps', v)} />
                    <ToggleRow label="IP Restriction" description="Limit access to whitelisted IP addresses"
                      checked={security.ipRestriction} onChange={v => setS('ipRestriction', v)} />
                    <ToggleRow label="Audit Logging" description="Track all user actions in Activity Logs"
                      checked={security.auditLog} onChange={v => setS('auditLog', v)} />
                  </div>

                  <SectionHeader title="Session & Password Policy" />
                  {/* 3-col on md+, 1-col on mobile */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <FieldRow label="Session Timeout (minutes)">
                      <SelectBox value={security.sessionTimeout} onChange={v => setS('sessionTimeout', v)}
                        options={[
                          {value:'15',label:'15 min'},{value:'30',label:'30 min'},{value:'60',label:'1 hour'},
                          {value:'120',label:'2 hours'},{value:'0',label:'Never'},
                        ]} />
                    </FieldRow>
                    <FieldRow label="Password Expiry (days)">
                      <SelectBox value={security.passwordExpiry} onChange={v => setS('passwordExpiry', v)}
                        options={[
                          {value:'30',label:'30 days'},{value:'60',label:'60 days'},{value:'90',label:'90 days'},
                          {value:'180',label:'180 days'},{value:'0',label:'Never'},
                        ]} />
                    </FieldRow>
                    <FieldRow label="Max Login Attempts">
                      <SelectBox value={security.loginAttempts} onChange={v => setS('loginAttempts', v)}
                        options={[{value:'3',label:'3 attempts'},{value:'5',label:'5 attempts'},{value:'10',label:'10 attempts'}]} />
                    </FieldRow>
                  </div>
                </CardContent>
              </Card>

              {/* Change Password */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    🔑 Change Admin Password
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Stacks on mobile, 3-col on md+ */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FieldRow label="Current Password">
                      <div className="relative">
                        <input type={showCurrentPw ? 'text' : 'password'} value={pwForm.current}
                          onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
                          placeholder="Enter current" className={`${inputCls} pr-10`} />
                        <button type="button" onClick={() => setShowCurrentPw(p => !p)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                          {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </FieldRow>
                    <FieldRow label="New Password">
                      <div className="relative">
                        <input type={showNewPw ? 'text' : 'password'} value={pwForm.newPw}
                          onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))}
                          placeholder="Min. 8 characters" className={`${inputCls} pr-10`} />
                        <button type="button" onClick={() => setShowNewPw(p => !p)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                          {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </FieldRow>
                    <FieldRow label="Confirm New Password">
                      <input type="password" value={pwForm.confirm}
                        onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                        placeholder="Re-enter" className={inputCls} />
                    </FieldRow>
                  </div>
                  <div className="flex justify-end">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                      disabled={pwSaving} onClick={handleUpdatePassword}>
                      {pwSaving
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Updating…</>
                        : 'Update Password'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── SYSTEM ── */}
          {activeTab === 'system' && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-600" /> System Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SectionHeader title="Backup & Recovery" />
                  <div className="divide-y divide-gray-50">
                    <ToggleRow label="Automatic Backup" description="Regularly back up database and files"
                      checked={system.autoBackup} onChange={v => setSys('autoBackup', v)} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                    <FieldRow label="Backup Frequency">
                      <SelectBox value={system.backupFrequency} onChange={v => setSys('backupFrequency', v)}
                        options={[
                          {value:'hourly',label:'Hourly'},{value:'daily',label:'Daily'},
                          {value:'weekly',label:'Weekly'},{value:'monthly',label:'Monthly'},
                        ]} />
                    </FieldRow>
                    <FieldRow label="Retention (days)">
                      <SelectBox value={system.backupRetention} onChange={v => setSys('backupRetention', v)}
                        options={[
                          {value:'7',label:'7 days'},{value:'14',label:'14 days'},
                          {value:'30',label:'30 days'},{value:'90',label:'90 days'},
                        ]} />
                    </FieldRow>
                    <FieldRow label="Max Upload Size (MB)">
                      <SelectBox value={system.maxUploadSize} onChange={v => setSys('maxUploadSize', v)}
                        options={[
                          {value:'5',label:'5 MB'},{value:'10',label:'10 MB'},
                          {value:'25',label:'25 MB'},{value:'50',label:'50 MB'},
                        ]} />
                    </FieldRow>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-1">
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs"
                      onClick={() => toast({ title: 'Backup started', description: 'Manual backup is running…' })}>
                      <HardDrive className="w-3.5 h-3.5" /> Backup Now
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs"
                      onClick={() => toast({ title: 'Download ready', description: 'Preparing backup file…' })}>
                      <Download className="w-3.5 h-3.5" /> Download Last Backup
                    </Button>
                  </div>

                  <SectionHeader title="Maintenance" />
                  <div className="divide-y divide-gray-50">
                    <ToggleRow label="Cache Enabled" description="Store frequently accessed data in memory for speed"
                      checked={system.cacheEnabled} onChange={v => setSys('cacheEnabled', v)} />
                    <ToggleRow label="Maintenance Mode" description="Temporarily disable access for all non-admin users"
                      checked={system.maintenanceMode} onChange={v => setSys('maintenanceMode', v)} />
                  </div>

                  {system.maintenanceMode && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-yellow-700">Maintenance Mode is ON</p>
                        <p className="text-xs text-yellow-600 mt-0.5">
                          Only admin accounts can log in. All other users will see a maintenance notice.
                        </p>
                      </div>
                    </div>
                  )}

                  <SectionHeader title="Danger Zone" />
                  <div className="border border-red-200 rounded-xl p-4 space-y-3 bg-red-50/50">
                    <div className="flex items-start gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-600 font-semibold">
                        These actions are irreversible. Proceed with extreme caution.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button size="sm" variant="outline" className="text-xs border-red-200 text-red-500 hover:bg-red-50 gap-1.5"
                        onClick={() => toast({ title: 'Cache cleared', description: 'System cache has been flushed.' })}>
                        <RefreshCw className="w-3.5 h-3.5" /> Clear Cache
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs border-red-200 text-red-500 hover:bg-red-50 gap-1.5"
                        onClick={() => toast({ title: 'Logs cleared', description: 'Activity logs have been wiped.' })}>
                        <Trash2 className="w-3.5 h-3.5" /> Clear All Logs
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ══ SAVE BUTTON ══ */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-1 pb-4">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => {
              toast({ title: 'Changes discarded' });
              if (activeTab === 'clinic') setClinic(DEFAULT_CLINIC);
            }}>
              <RefreshCw className="w-4 h-4 mr-1.5" /> Discard
            </Button>
            <Button onClick={handleSave} disabled={saving || loadingClinic}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white min-w-[130px]">
              {saving
                ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Saving…</>
                : saved
                ? <><Check className="w-4 h-4 mr-1.5" /> Saved!</>
                : <><Save className="w-4 h-4 mr-1.5" /> Save Changes</>
              }
            </Button>
          </div>

        </div>
      </div>
    </MainLayout>
  );
}