import React, { useState, useEffect, useCallback, useRef } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import { toast } from 'sonner';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  Receipt,
  History,
  User,
  CreditCard,
  Banknote,
  Smartphone,
  X,
  CheckCircle2,
  RefreshCw,
  Printer,
  CalendarSearch,
} from 'lucide-react';

const API_BASE  = import.meta.env.VITE_API_URL ?? 'http://backend1.test/api';
const TOKEN_KEY = 'auth_token';
const PAGE_SIZE = 10;

const apiFetch = async (path, options = {}) => {
  const token = localStorage.getItem(TOKEN_KEY);
  const res   = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message ?? `HTTP ${res.status}`);
  return body;
};

const PAYMENT_METHODS = [
  { value: 'cash',  label: 'Cash',  icon: Banknote   },
  { value: 'gcash', label: 'GCash', icon: Smartphone },
];

const CATEGORIES = ['all', 'consultation', 'procedure', 'fee'];

const fmt = (n) =>
  Number(n ?? 0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });

function ReceiptModal({ tx, onClose }) {
  const receiptRef = useRef();

  const handlePrint = () => {
    const content = receiptRef.current?.innerHTML;
    if (!content) return;
    const win = window.open('', '_blank', 'width=400,height=600');
    win.document.write(`<html><head><title>Receipt</title><style>body{font-family:monospace;font-size:13px;padding:16px;}hr{border:none;border-top:1px dashed #999;margin:8px 0;}</style></head><body>${content}</body></html>`);
    win.document.close();
    win.print();
  };

  if (!tx) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-blue-600 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            <span className="font-bold text-sm">Receipt</span>
          </div>
          <button onClick={onClose} className="hover:opacity-70"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          <div ref={receiptRef}>
            <div className="text-center mb-3">
              <p className="font-black text-base text-gray-900">ClinicSys</p>
              <p className="text-xs text-gray-500">Official Receipt</p>
            </div>
            <hr className="border-dashed border-gray-300 my-2" />
            <div className="space-y-0.5 text-xs text-gray-600">
              <div className="flex justify-between"><span>Transaction #</span><span className="font-semibold text-gray-800">{tx.transaction_id}</span></div>
              <div className="flex justify-between"><span>Date</span><span className="font-semibold text-gray-800">{new Date(tx.created_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}</span></div>
              <div className="flex justify-between"><span>Patient</span><span className="font-semibold text-gray-800">{tx.patient_name}</span></div>
              <div className="flex justify-between"><span>Cashier</span><span className="font-semibold text-gray-800">{tx.staff_name}</span></div>
              {tx.appointment_reference && (
                <div className="flex justify-between"><span>Appt. Ref #</span><span className="font-semibold text-gray-800">{tx.appointment_reference}</span></div>
              )}
            </div>
            <hr className="border-dashed border-gray-300 my-2" />
            <div className="space-y-1">
              {tx.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-xs text-gray-700">
                  <span className="truncate max-w-[55%]">{item.service_name}{item.quantity > 1 && <span className="text-gray-400 ml-1">×{item.quantity}</span>}</span>
                  <span className="font-semibold">{fmt(item.subtotal)}</span>
                </div>
              ))}
            </div>
            <hr className="border-dashed border-gray-300 my-2" />
            <div className="space-y-0.5 text-xs">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{fmt(tx.subtotal)}</span></div>
              {tx.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>- {fmt(tx.discount)}</span></div>}
              <div className="flex justify-between font-black text-gray-900 text-sm"><span>TOTAL</span><span>{fmt(tx.total)}</span></div>
            </div>
            <hr className="border-dashed border-gray-300 my-2" />
            <div className="space-y-0.5 text-xs text-gray-600">
              <div className="flex justify-between"><span>Payment</span><span className="font-semibold capitalize">{tx.payment_method}</span></div>
              {tx.payment_method === 'cash' && tx.amount_tendered != null && (
                <>
                  <div className="flex justify-between"><span>Tendered</span><span>{fmt(tx.amount_tendered)}</span></div>
                  <div className="flex justify-between"><span>Change</span><span>{fmt(tx.change_amount)}</span></div>
                </>
              )}
            </div>
            <div className="text-center mt-3 text-[10px] text-gray-400">Thank you for your visit!</div>
          </div>
        </div>
        <div className="px-5 pb-4 flex gap-2">
          <button onClick={handlePrint} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
            <Printer className="w-4 h-4" />Print
          </button>
          <button onClick={onClose} className="flex-1 py-2 text-sm font-semibold bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
}

export default function StaffPOS() {
  const [tab, setTab] = useState('pos');
  const [services, setServices] = useState([]);
  const [serviceSearch, setServiceSearch] = useState('');
  const [serviceCategory, setServiceCategory] = useState('all');
  const [servicesLoading, setServicesLoading] = useState(false);
  const [cart, setCart] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [patients, setPatients] = useState([]);
  const [patientDropdown, setPatientDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientLoading, setPatientLoading] = useState(false);
  const [payMethod, setPayMethod] = useState('cash');
  const [amountTendered, setAmountTendered] = useState('');
  const [discount, setDiscount] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [receiptTx, setReceiptTx] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyDate, setHistoryDate] = useState('');
  const [historyPage, setHistoryPage] = useState(1);

  // Appointment reference number states
  const [apptRefSearch, setApptRefSearch] = useState('');
  const [apptRefInput, setApptRefInput] = useState('');
  const [apptRefLoading, setApptRefLoading] = useState(false);
  const [resolvedApptRef, setResolvedApptRef] = useState(null);

  // History search by appt ref
  const [historyApptRef, setHistoryApptRef] = useState('');

  const loadServices = useCallback(async () => {
    setServicesLoading(true);
    try {
      const params = new URLSearchParams({ status: 'active' });
      if (serviceCategory !== 'all') params.set('category', serviceCategory);
      if (serviceSearch) params.set('search', serviceSearch);
      const data = await apiFetch(`/servics?${params}`);
      setServices(data);
    } catch { toast.error('Failed to load services'); }
    finally { setServicesLoading(false); }
  }, [serviceCategory, serviceSearch]);

  useEffect(() => { const t = setTimeout(loadServices, 300); return () => clearTimeout(t); }, [loadServices]);

  useEffect(() => {
    if (!patientSearch.trim() || patientSearch.length < 2) { setPatients([]); return; }
    const t = setTimeout(async () => {
      setPatientLoading(true);
      try {
        const data = await apiFetch(`/patients?search=${encodeURIComponent(patientSearch)}`);
        setPatients(Array.isArray(data) ? data : data.data ?? []);
        setPatientDropdown(true);
      } catch { setPatients([]); }
      finally { setPatientLoading(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [patientSearch]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams();
      if (historyDate) params.set('date', historyDate);
      if (historyApptRef.trim()) params.set('appointment_reference', historyApptRef.trim());
      const data = await apiFetch(`/transactions?${params}`);
      setHistory(Array.isArray(data) ? data : []);
      setHistoryPage(1);
    } catch { toast.error('Failed to load transaction history'); }
    finally { setHistoryLoading(false); }
  }, [historyDate, historyApptRef]);

  useEffect(() => { if (tab === 'history') loadHistory(); }, [tab, loadHistory]);

  // Look up appointment by reference number and auto-fill patient
  const handleApptRefLookup = async () => {
    if (!apptRefInput.trim()) return;
    setApptRefLoading(true);
    try {
      const data = await apiFetch(`/appointments?reference=${encodeURIComponent(apptRefInput.trim())}`);
      const appt = Array.isArray(data) ? data[0] : data;
      if (!appt) {
        toast.error('Appointment not found');
        setResolvedApptRef(null);
        return;
      }
      setResolvedApptRef(appt);
      // Auto-select patient if appointment has patient info
      if (appt.patient) {
        setSelectedPatient(appt.patient);
        setPatientSearch('');
      }
      toast.success('Appointment found!');
    } catch {
      toast.error('Appointment reference not found');
      setResolvedApptRef(null);
    } finally {
      setApptRefLoading(false);
    }
  };

  const clearApptRef = () => {
    setApptRefInput('');
    setResolvedApptRef(null);
  };

  const addToCart = (service) => {
    setCart(prev => {
      const existing = prev.find(i => i.service.service_id === service.service_id);
      if (existing) return prev.map(i => i.service.service_id === service.service_id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { service, qty: 1 }];
    });
  };

  const updateQty = (serviceId, delta) =>
    setCart(prev => prev.map(i => i.service.service_id === serviceId ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0));

  const removeFromCart = (serviceId) => setCart(prev => prev.filter(i => i.service.service_id !== serviceId));

  const clearCart = () => {
    setCart([]); setSelectedPatient(null); setPatientSearch('');
    setAmountTendered(''); setDiscount(''); setNotes(''); setPayMethod('cash');
    clearApptRef();
  };

  const subtotal    = cart.reduce((s, i) => s + i.service.price * i.qty, 0);
  const discountNum = parseFloat(discount) || 0;
  const total       = Math.max(0, subtotal - discountNum);
  const tenderNum   = parseFloat(amountTendered) || 0;
  const change      = payMethod === 'cash' ? Math.max(0, tenderNum - total) : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error('Cart is empty');
    if (payMethod === 'cash' && tenderNum > 0 && tenderNum < total) return toast.error('Amount tendered is less than total');
    setSubmitting(true);
    try {
      const payload = {
        patient_id: selectedPatient?.id ?? null,
 appointment_reference: (resolvedApptRef?.reference_number ?? apptRefInput.trim()) || null,
        items: cart.map(i => ({ service_id: i.service.service_id, service_name: i.service.service_name, unit_price: i.service.price, quantity: i.qty, subtotal: i.service.price * i.qty })),
        discount: discountNum || 0,
        payment_method: payMethod,
        amount_tendered: payMethod === 'cash' && tenderNum > 0 ? tenderNum : null,
        notes: notes || null,
      };
      const tx = await apiFetch('/transactions', { method: 'POST', body: JSON.stringify(payload) });
      toast.success('Transaction completed!');
      setReceiptTx(tx);
      clearCart();
    } catch (err) { toast.error(err.message || 'Transaction failed'); }
    finally { setSubmitting(false); }
  };

  const totalPages   = Math.ceil(history.length / PAGE_SIZE);
  const pagedHistory = history.slice((historyPage - 1) * PAGE_SIZE, historyPage * PAGE_SIZE);

  return (
    <MainLayout title="POS" subtitle="POS for Staff And Review Transaction History">
        <div className="px-6 pt-6 pb-4 flex items-center justify-end">
          <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1 shadow-sm">
            {[{ id: 'pos', label: 'POS', icon: ShoppingCart }, { id: 'history', label: 'History', icon: History }].map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === id ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:text-gray-800'}`}>
                <Icon className="w-4 h-4" />{label}
              </button>
            ))}
          </div>
        </div>

        {tab === 'pos' && (
          <div className="flex-1 flex gap-4 px-6 pb-6 overflow-hidden min-h-0">
            {/* Service catalog */}
            <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
              <div className="p-4 border-b border-gray-100 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" placeholder="Search services…" value={serviceSearch} onChange={e => setServiceSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setServiceCategory(cat)} className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-colors ${serviceCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{cat}</button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {servicesLoading ? (
                  <div className="flex items-center justify-center py-16"><RefreshCw className="w-6 h-6 text-blue-500 animate-spin" /></div>
                ) : services.length === 0 ? (
                  <div className="text-center py-16 text-gray-400"><ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" /><p className="text-sm">No services found</p></div>
                ) : (
                  <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                    {services.map(service => {
                      const inCart = cart.find(i => i.service.service_id === service.service_id);
                      return (
                        <button key={service.service_id} onClick={() => addToCart(service)} className={`relative text-left p-4 rounded-xl border transition-all hover:shadow-md ${inCart ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-200'}`}>
                          {inCart && <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">{inCart.qty}</span>}
                          <p className={`text-xs font-semibold capitalize mb-1 ${service.category === 'consultation' ? 'text-blue-500' : service.category === 'procedure' ? 'text-violet-500' : 'text-amber-500'}`}>{service.category}</p>
                          <p className="text-sm font-bold text-gray-800 leading-snug line-clamp-2">{service.service_name}</p>
                          <p className="text-sm font-black text-gray-900 mt-2">{fmt(service.price)}</p>
                          {service.unit && <p className="text-[10px] text-gray-400">{service.unit}</p>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Cart + Checkout */}
            <div className="w-80 xl:w-96 flex flex-col gap-4">

              {/* Appointment Reference Number */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Appointment Reference</p>
                {resolvedApptRef ? (
                  <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white flex-shrink-0">
                      <CalendarSearch className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{resolvedApptRef.reference_number ?? apptRefInput}</p>
                      {resolvedApptRef.appointment_date && (
                        <p className="text-xs text-gray-400 truncate">{new Date(resolvedApptRef.appointment_date).toLocaleDateString('en-PH', { dateStyle: 'medium' })}</p>
                      )}
                    </div>
                    <button onClick={clearApptRef} className="text-gray-400 hover:text-red-500 flex-shrink-0"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <CalendarSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Enter ref. number…"
                        value={apptRefInput}
                        onChange={e => setApptRefInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleApptRefLookup()}
                        className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <button
                      onClick={handleApptRefLookup}
                      disabled={!apptRefInput.trim() || apptRefLoading}
                      className="px-3 py-2.5 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                    >
                      {apptRefLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                      Find
                    </button>
                  </div>
                )}
              </div>

              {/* Patient lookup */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Patient</p>
                {selectedPatient ? (
                  <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-black">{selectedPatient.first_name?.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{selectedPatient.first_name} {selectedPatient.last_name}</p>
                      <p className="text-xs text-gray-400 truncate">{selectedPatient.email}</p>
                    </div>
                    <button onClick={() => { setSelectedPatient(null); setPatientSearch(''); }} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" placeholder="Search patient (optional)…" value={patientSearch}
                      onChange={e => { setPatientSearch(e.target.value); setPatientDropdown(true); }}
                      onFocus={() => patients.length > 0 && setPatientDropdown(true)}
                      onBlur={() => setTimeout(() => setPatientDropdown(false), 200)}
                      className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {patientLoading && <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 animate-spin" />}
                    {patientDropdown && patients.length > 0 && (
                      <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {patients.map(p => (
                          <button key={p.id} onMouseDown={() => { setSelectedPatient(p); setPatientSearch(''); setPatientDropdown(false); }} className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors">
                            <p className="text-sm font-semibold text-gray-800">{p.first_name} {p.last_name}</p>
                            <p className="text-xs text-gray-400">{p.email}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Cart */}
              <div className="flex-1 bg-white border border-gray-200 rounded-2xl flex flex-col overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Cart ({cart.length})</p>
                  {cart.length > 0 && <button onClick={clearCart} className="text-xs text-red-400 hover:text-red-600 font-semibold flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" />Clear</button>}
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-300"><ShoppingCart className="w-8 h-8 mb-2" /><p className="text-xs">Add services to cart</p></div>
                  ) : cart.map(({ service, qty }) => (
                    <div key={service.service_id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{service.service_name}</p>
                        <p className="text-xs text-gray-500">{fmt(service.price)}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => updateQty(service.service_id, -1)} className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"><Minus className="w-3 h-3" /></button>
                        <span className="w-5 text-center text-sm font-bold text-gray-700">{qty}</span>
                        <button onClick={() => updateQty(service.service_id, 1)} className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-blue-50 hover:text-blue-500 transition-colors"><Plus className="w-3 h-3" /></button>
                      </div>
                      <p className="text-xs font-black text-gray-800 w-16 text-right">{fmt(service.price * qty)}</p>
                      <button onClick={() => removeFromCart(service.service_id)} className="text-gray-300 hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
                {cart.length > 0 && (
                  <div className="border-t border-gray-100 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500 w-20 flex-shrink-0">Discount</label>
                      <input type="number" min="0" step="0.01" placeholder="0.00" value={discount} onChange={e => setDiscount(e.target.value)} className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 space-y-1">
                      <div className="flex justify-between text-xs text-gray-500"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
                      {discountNum > 0 && <div className="flex justify-between text-xs text-green-600"><span>Discount</span><span>- {fmt(discountNum)}</span></div>}
                      <div className="flex justify-between text-sm font-black text-gray-900 pt-1 border-t border-gray-200"><span>TOTAL</span><span>{fmt(total)}</span></div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5">Payment method</p>
                      <div className="grid grid-cols-4 gap-1.5">
                        {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => (
                          <button key={value} onClick={() => setPayMethod(value)} className={`flex flex-col items-center gap-0.5 py-2 rounded-xl border text-[10px] font-semibold transition-colors ${payMethod === value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'}`}>
                            <Icon className="w-3.5 h-3.5" />{label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {payMethod === 'cash' && (
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-500 w-20 flex-shrink-0">Tendered</label>
                        <input type="number" min={total} step="0.01" placeholder={total.toFixed(2)} value={amountTendered} onChange={e => setAmountTendered(e.target.value)} className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        {tenderNum >= total && tenderNum > 0 && <span className="text-xs font-semibold text-green-600 whitespace-nowrap">Chg: {fmt(change)}</span>}
                      </div>
                    )}
                    <input type="text" placeholder="Notes (optional)…" value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <button onClick={handleCheckout} disabled={submitting || cart.length === 0} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-black flex items-center justify-center gap-2 transition-colors">
                      {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      {submitting ? 'Processing…' : `Charge ${fmt(total)}`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'history' && (
          <div className="flex-1 flex flex-col px-6 pb-6 gap-4">
            {/* History filters */}
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="date"
                value={historyDate}
                onChange={e => setHistoryDate(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
              {historyDate && (
                <button onClick={() => setHistoryDate('')} className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1">
                  <X className="w-3.5 h-3.5" />Clear date
                </button>
              )}

              {/* Appointment Reference Search in History */}
              <div className="relative flex items-center gap-2">
                <div className="relative">
                  <CalendarSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search appt. ref #…"
                    value={historyApptRef}
                    onChange={e => setHistoryApptRef(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && loadHistory()}
                    className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm w-52"
                  />
                </div>
                {historyApptRef && (
                  <button onClick={() => { setHistoryApptRef(''); }} className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1">
                    <X className="w-3.5 h-3.5" />Clear
                  </button>
                )}
              </div>

              <button onClick={loadHistory} className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
                <RefreshCw className={`w-3.5 h-3.5 ${historyLoading ? 'animate-spin' : ''}`} />Refresh
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex-1 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left">
                      {['#', 'Appt. Ref', 'Date', 'Patient', 'Items', 'Total', 'Payment', 'Cashier', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-xs font-black text-gray-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {historyLoading ? (
                      <tr><td colSpan={9} className="py-16 text-center"><RefreshCw className="w-6 h-6 text-blue-500 animate-spin mx-auto" /></td></tr>
                    ) : pagedHistory.length === 0 ? (
                      <tr><td colSpan={9} className="py-16 text-center text-gray-400"><History className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No transactions found</p></td></tr>
                    ) : pagedHistory.map(tx => (
                      <tr key={tx.transaction_id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">#{tx.transaction_id}</td>
                        <td className="px-4 py-3 text-xs">
                          {tx.appointment_reference
                            ? <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-semibold font-mono">{tx.appointment_reference}</span>
                            : <span className="text-gray-300">—</span>
                          }
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">{new Date(tx.created_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                        <td className="px-4 py-3 font-semibold text-gray-800">{tx.patient_name}</td>
                        <td className="px-4 py-3 text-gray-600">{tx.items?.length ?? 0} item(s)</td>
                        <td className="px-4 py-3 font-black text-gray-900">{fmt(tx.total)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${tx.payment_method === 'cash' ? 'bg-green-100 text-green-700' : tx.payment_method === 'card' ? 'bg-blue-100 text-blue-700' : tx.payment_method === 'gcash' ? 'bg-violet-100 text-violet-700' : 'bg-amber-100 text-amber-700'}`}>{tx.payment_method}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{tx.staff_name}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => setReceiptTx(tx)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold"><Receipt className="w-3.5 h-3.5" />Receipt</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-xs text-gray-400">{history.length} transaction(s)</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setHistoryPage(p => Math.max(1, p - 1))} disabled={historyPage === 1} className="px-3 py-1 text-xs font-semibold rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-100 transition-colors">Prev</button>
                    <span className="text-xs text-gray-600">{historyPage} / {totalPages}</span>
                    <button onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))} disabled={historyPage === totalPages} className="px-3 py-1 text-xs font-semibold rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-100 transition-colors">Next</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      
      {receiptTx && <ReceiptModal tx={receiptTx} onClose={() => setReceiptTx(null)} />}
    </MainLayout>
  );
}