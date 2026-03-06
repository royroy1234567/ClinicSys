import React, { useState, useMemo } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import {
  Plus, Edit, Trash2, Search, X, Check, RefreshCw,
  Stethoscope, FlaskConical, Scissors, DollarSign,
  ChevronDown, AlertTriangle, Tag, Clock, LayoutGrid,
  List, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

/* ══════════════ CATEGORIES ══════════════ */
const CATEGORIES = [
  { key: 'consultation', label: 'Consultation',       icon: Stethoscope, bg: 'bg-blue-50',   color: 'text-blue-600',   border: 'border-blue-200'   },
  { key: 'procedure',    label: 'Medical Procedures', icon: Scissors,    bg: 'bg-teal-50',   color: 'text-teal-600',   border: 'border-teal-200'   },
  { key: 'laboratory',   label: 'Laboratory Tests',   icon: FlaskConical,bg: 'bg-purple-50', color: 'text-purple-600', border: 'border-purple-200' },
  { key: 'fee',          label: 'Fees & Others',      icon: DollarSign,  bg: 'bg-orange-50', color: 'text-orange-600', border: 'border-orange-200' },
];

/* ══════════════ DEMO DATA ══════════════ */
const DEMO_SERVICES = [
  { id:'SVC-001', name:'General Consultation',        category:'consultation', price:500,   duration:30,  unit:'per visit',    status:'active',   description:'Routine check-up and general medical consultation.' },
  { id:'SVC-002', name:'Follow-up Consultation',      category:'consultation', price:300,   duration:20,  unit:'per visit',    status:'active',   description:'Follow-up visit after initial consultation.' },
  { id:'SVC-003', name:'Specialist Consultation',     category:'consultation', price:1200,  duration:45,  unit:'per visit',    status:'active',   description:'Consultation with a medical specialist.' },
  { id:'SVC-004', name:'Teleconsultation',            category:'consultation', price:400,   duration:20,  unit:'per session',  status:'active',   description:'Remote consultation via video or phone call.' },
  { id:'SVC-005', name:'Executive Check-up',          category:'consultation', price:5000,  duration:120, unit:'per visit',    status:'active',   description:'Comprehensive annual physical exam package.' },
  { id:'SVC-006', name:'Wound Dressing',              category:'procedure',    price:350,   duration:20,  unit:'per session',  status:'active',   description:'Cleaning and redressing of wounds.' },
  { id:'SVC-007', name:'Ear Cleaning',                category:'procedure',    price:250,   duration:15,  unit:'per session',  status:'active',   description:'Ear irrigation and cerumen removal.' },
  { id:'SVC-008', name:'Nebulization',                category:'procedure',    price:200,   duration:20,  unit:'per session',  status:'active',   description:'Inhalation therapy using nebulizer.' },
  { id:'SVC-009', name:'ECG / 12-Lead',               category:'procedure',    price:600,   duration:30,  unit:'per test',     status:'active',   description:'Electrocardiogram for heart monitoring.' },
  { id:'SVC-010', name:'IV Fluid Administration',     category:'procedure',    price:800,   duration:60,  unit:'per session',  status:'inactive', description:'Intravenous fluid therapy.' },
  { id:'SVC-011', name:'Suturing',                    category:'procedure',    price:1500,  duration:45,  unit:'per procedure',status:'active',   description:'Wound closure with sutures.' },
  { id:'SVC-012', name:'Complete Blood Count (CBC)',  category:'laboratory',   price:350,   duration:60,  unit:'per test',     status:'active',   description:'Full blood count panel.' },
  { id:'SVC-013', name:'Urinalysis',                  category:'laboratory',   price:150,   duration:30,  unit:'per test',     status:'active',   description:'Urine analysis for infections and conditions.' },
  { id:'SVC-014', name:'Fasting Blood Sugar (FBS)',   category:'laboratory',   price:120,   duration:30,  unit:'per test',     status:'active',   description:'Blood glucose test after fasting.' },
  { id:'SVC-015', name:'Lipid Profile',               category:'laboratory',   price:450,   duration:60,  unit:'per test',     status:'active',   description:'Cholesterol and triglyceride levels.' },
  { id:'SVC-016', name:'HbA1c',                       category:'laboratory',   price:500,   duration:60,  unit:'per test',     status:'active',   description:'3-month average blood sugar test.' },
  { id:'SVC-017', name:'Chest X-Ray',                 category:'laboratory',   price:700,   duration:30,  unit:'per test',     status:'inactive', description:'PA view chest radiograph.' },
  { id:'SVC-018', name:'Uric Acid',                   category:'laboratory',   price:180,   duration:30,  unit:'per test',     status:'active',   description:'Serum uric acid measurement.' },
  { id:'SVC-019', name:'Philhealth Processing Fee',   category:'fee',          price:100,   duration:0,   unit:'per claim',    status:'active',   description:'Administrative fee for PhilHealth claims.' },
  { id:'SVC-020', name:'Medical Certificate',         category:'fee',          price:200,   duration:0,   unit:'per document', status:'active',   description:'Issuance of official medical certificate.' },
  { id:'SVC-021', name:'Medical Abstract',            category:'fee',          price:300,   duration:0,   unit:'per document', status:'active',   description:'Summary of patient medical history.' },
  { id:'SVC-022', name:'Referral Letter',             category:'fee',          price:150,   duration:0,   unit:'per document', status:'active',   description:'Formal referral to another specialist or facility.' },
];

/* ══════════════ HELPERS ══════════════ */
const fmtPrice = (p) => `₱${p.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

const inputCls  = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
const SelectBox = ({ value, onChange, options }) => (
  <div className="relative">
    <select value={value} onChange={e => onChange(e.target.value)}
      className={`${inputCls} appearance-none pr-8`}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
  </div>
);
const FieldRow = ({ label, required, children, hint }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-gray-400">{hint}</p>}
  </div>
);

const CatBadge = ({ category }) => {
  const cfg = CATEGORIES.find(c => c.key === category);
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
};

/* ══════════════ PAGINATION COMPONENT ══════════════ */
function Pagination({ currentPage, totalPages, totalItems, pageSize, onPageChange, onPageSizeChange }) {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end   = Math.min(currentPage * pageSize, totalItems);

  // Build page number buttons with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const btnBase = "inline-flex items-center justify-center h-8 w-8 rounded-lg text-xs font-semibold transition-all";
  const btnActive = "bg-blue-600 text-white shadow-sm shadow-blue-200";
  const btnIdle   = "border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 bg-white";
  const btnDisabled = "border border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50/60 rounded-b-xl">
      {/* Left: count info + rows per page */}
      <div className="flex items-center gap-3">
        <p className="text-xs text-gray-400">
          Showing <span className="font-semibold text-gray-600">{start}–{end}</span> of{' '}
          <span className="font-semibold text-gray-600">{totalItems}</span> services
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
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={`${btnBase} ${currentPage === 1 ? btnDisabled : btnIdle}`}
          title="First page"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`${btnBase} ${currentPage === 1 ? btnDisabled : btnIdle}`}
          title="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {getPageNumbers().map((p, i) =>
          p === '...'
            ? <span key={`ellipsis-${i}`} className="px-1 text-gray-300 text-xs select-none">…</span>
            : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`${btnBase} ${p === currentPage ? btnActive : btnIdle}`}
              >
                {p}
              </button>
            )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className={`${btnBase} ${currentPage === totalPages || totalPages === 0 ? btnDisabled : btnIdle}`}
          title="Next page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || totalPages === 0}
          className={`${btnBase} ${currentPage === totalPages || totalPages === 0 ? btnDisabled : btnIdle}`}
          title="Last page"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ══════════════ EMPTY FORM ══════════════ */
const EMPTY = { name:'', category:'consultation', price:'', duration:'', unit:'per visit', status:'active', description:'' };

/* ══════════════ SERVICE MODAL ══════════════ */
function ServiceModal({ mode, service, onClose, onSave }) {
  const isEdit = mode === 'edit';
  const [form, setForm]   = useState(isEdit ? { ...service, price: String(service.price), duration: String(service.duration) } : { ...EMPTY });
  const [errors, setErrors] = useState({});
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim())                 e.name     = 'Required';
    if (!form.price || isNaN(form.price))  e.price    = 'Valid price required';
    if (Number(form.price) < 0)            e.price    = 'Must be ≥ 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ ...form, price: Number(form.price), duration: Number(form.duration) || 0 });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Service' : 'Add New Service'}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{isEdit ? `Editing: ${service.name}` : 'Fill in the service details'}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <div className="p-6 space-y-4">
          <FieldRow label="Category" required>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(c => {
                const Icon = c.icon;
                const sel  = form.category === c.key;
                return (
                  <button key={c.key} type="button" onClick={() => set('category', c.key)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all
                      ${sel ? `${c.bg} ${c.border} ${c.color}` : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}>
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs font-bold">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </FieldRow>

          <FieldRow label="Service Name" required>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="e.g. General Consultation" className={inputCls} />
            {errors.name && <p className="text-xs text-red-500">⚠ {errors.name}</p>}
          </FieldRow>

          <FieldRow label="Description">
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Brief description of the service…" rows={2}
              className={`${inputCls} resize-none`} />
          </FieldRow>

          <div className="grid grid-cols-2 gap-4">
            <FieldRow label="Price (₱)" required>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">₱</span>
                <input type="number" min="0" step="0.01" value={form.price}
                  onChange={e => set('price', e.target.value)}
                  placeholder="0.00" className={`${inputCls} pl-7`} />
              </div>
              {errors.price && <p className="text-xs text-red-500">⚠ {errors.price}</p>}
            </FieldRow>
            <FieldRow label="Billing Unit">
              <SelectBox value={form.unit} onChange={v => set('unit', v)}
                options={[
                  {value:'per visit',    label:'Per Visit'},
                  {value:'per session',  label:'Per Session'},
                  {value:'per test',     label:'Per Test'},
                  {value:'per procedure',label:'Per Procedure'},
                  {value:'per document', label:'Per Document'},
                  {value:'per claim',    label:'Per Claim'},
                ]} />
            </FieldRow>
          </div>

          {form.category !== 'fee' && (
            <FieldRow label="Estimated Duration (minutes)" hint="Set to 0 if not applicable">
              <input type="number" min="0" value={form.duration}
                onChange={e => set('duration', e.target.value)}
                placeholder="30" className={inputCls} />
            </FieldRow>
          )}

          <FieldRow label="Status">
            <div className="flex items-center gap-3">
              <Switch checked={form.status === 'active'} onCheckedChange={v => set('status', v ? 'active' : 'inactive')} />
              <span className={`text-sm font-semibold ${form.status === 'active' ? 'text-green-600' : 'text-gray-400'}`}>
                {form.status === 'active' ? 'Active — visible to staff' : 'Inactive — hidden from use'}
              </span>
            </div>
          </FieldRow>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button onClick={() => { setForm(isEdit ? {...service, price:String(service.price), duration:String(service.duration)} : {...EMPTY}); setErrors({}); }}
            className="text-sm text-gray-400 hover:text-gray-600 font-medium flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Reset
          </button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Check className="w-4 h-4 mr-1.5" /> {isEdit ? 'Save Changes' : 'Add Service'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════ DELETE MODAL ══════════════ */
function DeleteModal({ service, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 text-center">Delete Service?</h3>
        <p className="text-sm text-gray-500 text-center mt-1 mb-1">You are about to delete:</p>
        <p className="text-sm font-bold text-gray-800 text-center mb-4">{service.name}</p>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-5 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-600">This is permanent. Consider deactivating the service instead if it has been used in past transactions.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0" onClick={onConfirm}>Delete</Button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════ MAIN PAGE ══════════════ */
export default function ServiceManagementPage() {
  const [services,  setServices]  = useState(DEMO_SERVICES);
  const [search,    setSearch]    = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [statFil,   setStatFil]   = useState('all');
  const [modal,     setModal]     = useState(null);
  const [view,      setView]      = useState('table');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize,    setPageSize]    = useState(10);

  const { toast } = useToast();

  /* ── KPIs ── */
  const total    = services.length;
  const active   = services.filter(s => s.status === 'active').length;
  const inactive = services.filter(s => s.status === 'inactive').length;
  const avgPrice = Math.round(services.reduce((a, s) => a + s.price, 0) / total);

  /* ── filtered (all) ── */
  const filtered = useMemo(() => {
    setCurrentPage(1); // reset to page 1 on filter change
    return services.filter(s => {
      if (catFilter !== 'all' && s.category !== catFilter) return false;
      if (statFil   !== 'all' && s.status   !== statFil)   return false;
      if (search) {
        const q = search.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q);
      }
      return true;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [services, catFilter, statFil, search]);

  /* ── paginated slice (table view) ── */
  const totalPages  = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage    = Math.min(currentPage, totalPages);
  const paginated   = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  /* ── grid: paginate per-category ── */
  const [gridPages,     setGridPages]     = useState({});
  const [gridPageSizes, setGridPageSizes] = useState({});
  const getGridPage     = (key) => gridPages[key]     ?? 1;
  const getGridPageSize = (key) => gridPageSizes[key] ?? 6;
  const setGridPage     = (key, p) => setGridPages(prev     => ({ ...prev, [key]: p }));
  const setGridPageSize = (key, n) => { setGridPageSizes(prev => ({ ...prev, [key]: n })); setGridPage(key, 1); };

  /* ── handlers ── */
  const handleSave = (form) => {
    if (modal.mode === 'add') {
      const n = { ...form, id: `SVC-${String(services.length + 1).padStart(3, '0')}` };
      setServices(s => [...s, n]);
      toast({ title: 'Service added', description: `${form.name} has been created.` });
    } else {
      setServices(s => s.map(x => x.id === modal.service.id ? { ...x, ...form } : x));
      toast({ title: 'Service updated', description: `${form.name} saved.` });
    }
    setModal(null);
  };

  const handleDelete = () => {
    setServices(s => s.filter(x => x.id !== modal.service.id));
    toast({ title: 'Service deleted', description: `${modal.service.name} removed.` });
    setModal(null);
  };

  const handleToggle = (id) => {
    setServices(s => s.map(x => x.id === id ? { ...x, status: x.status === 'active' ? 'inactive' : 'active' } : x));
  };

  const handleReset = () => {
    setSearch(''); setCatFilter('all'); setStatFil('all'); setCurrentPage(1);
  };

  return (
    <MainLayout title="Service Management" subtitle="Manage clinic services, procedures and pricing">
      <div className="space-y-5">

        {/* ══ KPI CARDS ══ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label:'Total Services', value:total,              icon:Tag,         bg:'bg-blue-50',   color:'text-blue-600'   },
            { label:'Active',         value:active,             icon:Check,       bg:'bg-green-50',  color:'text-green-600'  },
            { label:'Inactive',       value:inactive,           icon:X,           bg:'bg-gray-50',   color:'text-gray-500'   },
            { label:'Avg. Price',     value:`₱${avgPrice.toLocaleString()}`, icon:DollarSign, bg:'bg-orange-50', color:'text-orange-600' },
          ].map(c => {
            const Icon = c.icon;
            return (
              <Card key={c.label}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{c.label}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-0.5">{c.value}</p>
                    </div>
                    <div className={`p-2.5 rounded-xl ${c.bg}`}><Icon className={`w-5 h-5 ${c.color}`} /></div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ══ CATEGORY QUICK FILTERS ══ */}
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => { setCatFilter('all'); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all
              ${catFilter === 'all' ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
            All ({total})
          </button>
          {CATEGORIES.map(c => {
            const Icon  = c.icon;
            const count = services.filter(s => s.category === c.key).length;
            const sel   = catFilter === c.key;
            return (
              <button key={c.key} onClick={() => { setCatFilter(c.key); setCurrentPage(1); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all
                  ${sel ? `${c.bg} ${c.color} ${c.border} shadow-sm` : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                <Icon className="w-3.5 h-3.5" /> {c.label} ({count})
              </button>
            );
          })}
        </div>

        {/* ══ FILTER + ACTION BAR ══ */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Search</label>
                <Search className="absolute left-3 bottom-2.5 w-4 h-4 text-gray-400" />
                <input value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                  placeholder="Service name or description…" className={`${inputCls} pl-9`} />
              </div>
              <div className="min-w-[130px]">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Status</label>
                <SelectBox value={statFil} onChange={v => { setStatFil(v); setCurrentPage(1); }}
                  options={[{value:'all',label:'All Status'},{value:'active',label:'Active'},{value:'inactive',label:'Inactive'}]} />
              </div>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Reset
              </Button>
              {/* View toggle */}
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button onClick={() => setView('table')}
                  className={`p-2 transition-colors ${view==='table' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-50'}`}>
                  <List className="w-4 h-4" />
                </button>
                <button onClick={() => setView('grid')}
                  className={`p-2 transition-colors ${view==='grid' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-50'}`}>
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1" />
              <Button onClick={() => setModal({ mode:'add' })} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" /> Add Service
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ══ TABLE VIEW ══ */}
        {view === 'table' && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Tag className="w-5 h-5 text-blue-600" /> Services
                </CardTitle>
                <span className="text-xs text-gray-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-y border-gray-100 bg-gray-50">
                      {['Service Name','Category','Price','Duration','Status','Actions'].map(h => (
                        <th key={h} className="text-left py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginated.length === 0 && (
                      <tr><td colSpan={6} className="text-center py-14">
                        <Tag className="w-10 h-10 mx-auto text-gray-200 mb-2" />
                        <p className="text-sm text-gray-400 font-medium">No services found</p>
                      </td></tr>
                    )}
                    {paginated.map(svc => (
                      <tr key={svc.id} className={`hover:bg-gray-50 transition-colors ${svc.status==='inactive' ? 'opacity-60' : ''}`}>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-gray-900">{svc.name}</p>
                          {svc.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{svc.description}</p>}
                        </td>
                        <td className="py-3 px-4"><CatBadge category={svc.category} /></td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-gray-900">{fmtPrice(svc.price)}</p>
                          <p className="text-xs text-gray-400">{svc.unit}</p>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {svc.duration > 0
                            ? <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-gray-400" />{svc.duration} min</span>
                            : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Switch checked={svc.status === 'active'} onCheckedChange={() => handleToggle(svc.id)} />
                            <span className={`text-xs font-semibold ${svc.status==='active' ? 'text-green-600' : 'text-gray-400'}`}>
                              {svc.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs gap-1"
                              onClick={() => setModal({ mode:'edit', service:svc })}>
                              <Edit className="w-3 h-3" /> Edit
                            </Button>
                            <Button size="sm" variant="outline"
                              className="h-7 px-2.5 text-xs text-red-500 border-red-200 hover:bg-red-50"
                              onClick={() => setModal({ mode:'delete', service:svc })}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* TABLE PAGINATION */}
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
        )}

        {/* ══ GRID VIEW ══ */}
        {view === 'grid' && (
          <div>
            {filtered.length === 0 && (
              <div className="text-center py-16">
                <Tag className="w-10 h-10 mx-auto text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">No services found</p>
              </div>
            )}
            {CATEGORIES.filter(c => catFilter === 'all' || c.key === catFilter).map(cat => {
              const catServices  = filtered.filter(s => s.category === cat.key);
              if (catServices.length === 0) return null;

              const gPage  = getGridPage(cat.key);
              const gSize  = getGridPageSize(cat.key);
              const gTotal = Math.max(1, Math.ceil(catServices.length / gSize));
              const gSafe  = Math.min(gPage, gTotal);
              const gSlice = catServices.slice((gSafe - 1) * gSize, gSafe * gSize);

              const Icon = cat.icon;
              return (
                <div key={cat.key} className="mb-6">
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className={`p-1.5 rounded-lg ${cat.bg}`}><Icon className={`w-4 h-4 ${cat.color}`} /></div>
                    <h3 className="text-sm font-black text-gray-700">{cat.label}</h3>
                    <span className="text-xs text-gray-400">({catServices.length})</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {gSlice.map(svc => (
                      <div key={svc.id}
                        className={`bg-white border rounded-2xl p-4 hover:shadow-md transition-all
                          ${svc.status === 'inactive' ? 'opacity-60 border-dashed' : 'border-gray-200'}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 pr-2">
                            <p className="font-bold text-gray-900 text-sm leading-tight">{svc.name}</p>
                            {svc.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{svc.description}</p>}
                          </div>
                          <Switch checked={svc.status === 'active'} onCheckedChange={() => handleToggle(svc.id)} />
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                          <div>
                            <p className="text-lg font-black text-gray-900">{fmtPrice(svc.price)}</p>
                            <p className="text-xs text-gray-400">{svc.unit}{svc.duration > 0 ? ` · ${svc.duration} min` : ''}</p>
                          </div>
                          <div className="flex gap-1.5">
                            <Button size="sm" variant="outline" className="h-7 w-7 p-0"
                              onClick={() => setModal({ mode:'edit', service:svc })}>
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline"
                              className="h-7 w-7 p-0 text-red-500 border-red-200 hover:bg-red-50"
                              onClick={() => setModal({ mode:'delete', service:svc })}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* GRID PAGINATION (per category) */}
                  {catServices.length > gSize && (
                    <div className="mt-3 bg-white border border-gray-100 rounded-xl">
                      <Pagination
                        currentPage={gSafe}
                        totalPages={gTotal}
                        totalItems={catServices.length}
                        pageSize={gSize}
                        onPageChange={(p) => setGridPage(cat.key, p)}
                        onPageSizeChange={(n) => setGridPageSize(cat.key, n)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ══ MODALS ══ */}
      {(modal?.mode === 'add' || modal?.mode === 'edit') && (
        <ServiceModal mode={modal.mode} service={modal.service} onClose={() => setModal(null)} onSave={handleSave} />
      )}
      {modal?.mode === 'delete' && (
        <DeleteModal service={modal.service} onClose={() => setModal(null)} onConfirm={handleDelete} />
      )}
    </MainLayout>
  );
}