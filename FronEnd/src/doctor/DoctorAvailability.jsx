import React, { useState, useMemo, useEffect, useCallback } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  User, Calendar, Clock, CheckCircle2, XCircle, AlertCircle,
  Plus, Trash2, Save, Edit, ChevronLeft, ChevronRight,
  Stethoscope, CalendarClock, Info, Check,
  RefreshCw, Activity, Timer, Users, Repeat, X, Loader2,
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://backend1.test/api';

const STATUS_CFG = {
  available: { label:'Available', dot:'bg-emerald-500', text:'text-emerald-700', bg:'bg-emerald-50',  border:'border-emerald-200' },
  on_leave:  { label:'On Leave',  dot:'bg-amber-500',   text:'text-amber-700',  bg:'bg-amber-50',   border:'border-amber-200'  },
  off_duty:  { label:'Off Duty',  dot:'bg-red-400',     text:'text-red-600',    bg:'bg-red-50',     border:'border-red-200'    },
};

const SLOT_DURATIONS = [15, 20, 30, 45, 60];

const today    = new Date();
const pad2     = (n) => String(n).padStart(2,'0');
const todayISO = `${today.getFullYear()}-${pad2(today.getMonth()+1)}-${pad2(today.getDate())}`;
const isoOf    = (y,m,d) => `${y}-${pad2(m)}-${pad2(d)}`;
const isPast   = (iso) => iso < todayISO;

const fmtDate  = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric' });
};

const toMins    = (t) => { if(!t) return 0; const[h,m]=t.split(':').map(Number); return h*60+m; };
const diffMin   = (s,e) => Math.max(0, toMins(e) - toMins(s));
const to12      = (t) => { if(!t) return '—'; const[h,m]=t.split(':').map(Number); return `${h%12||12}:${pad2(m)} ${h>=12?'PM':'AM'}`; };
// Generate all slot start times for a range, skipping 12:00–13:00 lunch
const generateSlotTimes = (start, end, duration) => {
  if (!duration) return [];
  const times = [];
  let cur = toMins(start);
  const endM = toMins(end);
  while (cur + duration <= endM) {
    const slotEnd = cur + duration;
    // Skip if the slot overlaps lunch (12:00–13:00 = 720–780)
    const overlapsLunch = cur < 780 && slotEnd > 720;
    if (!overlapsLunch) {
      times.push(cur);
    } else if (cur < 720) {
      // Slot starts before lunch but would overlap — stop before lunch
      // (don't add this slot, advance to after lunch)
    }
    // Jump over lunch if we're at or before it
    if (cur < 780 && cur + duration > 720 && cur < 720) {
      cur = 780; // jump to 1:00 PM
    } else {
      cur += duration;
    }
  }
  return times;
};
const slotCount = (s) => generateSlotTimes(s.start, s.end, s.duration).length;

const dateStatus = (iso, schedule) => {
  const s = schedule[iso];
  if (!s) return 'none';
  const total  = s.slots.reduce((a,sl) => a + slotCount(sl), 0);
  const booked = s.slots.reduce((a,sl) => a + (sl.booked||0), 0);
  if (total === 0) return 'none';
  if (booked >= total) return 'full';
  if (booked > 0) return 'partial';
  return 'available';
};

const DATE_STATUS_STYLE = {
  available:{ bg:'bg-emerald-500', text:'text-white',      dot:'🟢', label:'Available'    },
  full:     { bg:'bg-red-500',     text:'text-white',      dot:'🔴', label:'Fully Booked' },
  partial:  { bg:'bg-amber-400',   text:'text-amber-900',  dot:'🟡', label:'Partial'      },
  none:     { bg:'',               text:'text-gray-400',   dot:'⚪', label:'No Schedule'  },
};

const inputCls = `w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 placeholder:text-gray-400 transition-all`;
const labelCls = 'block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5';
const avatarColors = ['bg-blue-100 text-blue-700','bg-teal-100 text-teal-700','bg-violet-100 text-violet-700'];
const avatarCls = (n) => avatarColors[n.charCodeAt(0) % avatarColors.length];

const Section = ({ icon:Icon, title, accent='text-blue-600', children, action }) => (
  <Card className="border border-gray-100 shadow-sm">
    <CardHeader className="pb-0 px-5 pt-5">
      <div className="flex items-center justify-between">
        <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Icon className={`w-4 h-4 ${accent}`}/>{title}
        </CardTitle>
        {action}
      </div>
    </CardHeader>
    <CardContent className="px-5 pb-5 pt-4">{children}</CardContent>
  </Card>
);


/* ═══════════════════════════════════════════════════
   CUSTOM TIME PICKER
   Hours: 8AM–11AM, 1PM–6PM (excludes 12PM–1PM lunch)
═══════════════════════════════════════════════════ */
const AVAILABLE_HOURS = [
  { value: '08', label: '8', period: 'AM' },
  { value: '09', label: '9', period: 'AM' },
  { value: '10', label: '10', period: 'AM' },
  { value: '11', label: '11', period: 'AM' },
  // 12:00–13:00 excluded (lunch)
  { value: '13', label: '1', period: 'PM' },
  { value: '14', label: '2', period: 'PM' },
  { value: '15', label: '3', period: 'PM' },
  { value: '16', label: '4', period: 'PM' },
  { value: '17', label: '5', period: 'PM' },
  { value: '18', label: '6', period: 'PM' },
];

const MINUTES = ['00', '15', '30', '45'];

function TimePicker({ value, onChange, label }) {
  const [hour, setHour]   = React.useState(() => value ? value.split(':')[0] : '09');
  const [minute, setMinute] = React.useState(() => value ? value.split(':')[1] : '00');

  const handleChange = (h, m) => {
    const newVal = `${h}:${m}`;
    onChange(newVal);
  };

  const setH = (h) => { setHour(h); handleChange(h, minute); };
  const setM = (m) => { setMinute(m); handleChange(hour, m); };

  const display12 = (h) => {
    const n = parseInt(h);
    const h12 = n % 12 || 12;
    const period = n >= 12 ? 'PM' : 'AM';
    return `${h12} ${period}`;
  };

  return (
    <div>
      {label && <label className={labelCls}>{label}</label>}
      <div className="flex gap-1.5 items-center">
        <select
          value={hour}
          onChange={e => setH(e.target.value)}
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 transition-all cursor-pointer"
        >
          {AVAILABLE_HOURS.map(h => (
            <option key={h.value} value={h.value}>{h.label} {h.period}</option>
          ))}
        </select>
        <span className="text-gray-300 font-black text-base leading-none">:</span>
        <select
          value={minute}
          onChange={e => setM(e.target.value)}
          className="w-[72px] border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 transition-all cursor-pointer"
        >
          {MINUTES.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
      <p className="text-[10px] text-blue-400 font-semibold mt-1">{to12(`${hour}:${minute}`)}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   DATE EDITOR MODAL
═══════════════════════════════════════════════════ */
function DateEditorModal({ iso, schedule, onClose, onSave, onClear }) {
  const { toast } = useToast();

  const existing = schedule[iso] || {
    slots:[], repeat:false, repeatWeeks:4,
  };

  const [data,    setData]    = useState(existing);
  const [errors,  setErrors]  = useState([]);
  const [saving,  setSaving]  = useState(false);
  const [clearing,setClearing]= useState(false);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const upd = (patch) => setData(d => ({ ...d, ...patch }));

  const addSlot    = () => upd({ slots:[...data.slots,{id:Date.now(),start:'09:00',end:'11:00',duration:30,maxPts:0,booked:0}] });
  const updateSlot = (id,k,v) => upd({ slots:data.slots.map(s=>s.id===id?{...s,[k]:v}:s) });
  const removeSlot = (id) => {
    if (data.slots.find(s=>s.id===id)?.booked > 0) {
      toast({ title:'⚠️ Cannot remove', description:'Slot has existing bookings.', variant:'destructive' });
      return;
    }
    upd({ slots:data.slots.filter(s=>s.id!==id) });
  };


  const validate = () => {
    const errs = [];
    data.slots.forEach((s,i)=>{
      if (toMins(s.start) >= toMins(s.end)) errs.push(`Slot ${i+1}: start must be before end.`);
    });
    for (let i=0; i<data.slots.length; i++) for (let j=i+1; j<data.slots.length; j++) {
      const a=data.slots[i], b=data.slots[j];
      if (toMins(a.start)<toMins(b.end) && toMins(a.end)>toMins(b.start))
        errs.push(`Slots ${i+1} and ${j+1} overlap.`);
    }

    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (errs.length) { setErrors(errs); return; }

    setSaving(true);
    try {
      await onSave(iso, data);
      toast({ title:'💾 Schedule saved', description:`${fmtDate(iso)} updated.` });
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save schedule.';
      toast({ title:'❌ Save failed', description: msg, variant:'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    const hasBooked = data.slots.some(s => s.booked > 0);
    if (hasBooked) {
      toast({ title:'⚠️ Cannot clear', description:'Date has existing appointments.', variant:'destructive' });
      return;
    }
    setClearing(true);
    try {
      await onClear(iso);
      toast({ title:'🗑 Schedule cleared', description:`${fmtDate(iso)} cleared.` });
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to clear schedule.';
      toast({ title:'❌ Clear failed', description: msg, variant:'destructive' });
    } finally {
      setClearing(false);
    }
  };

  const status      = dateStatus(iso, schedule);
  const sstyle      = DATE_STATUS_STYLE[status];
  const totalSlots  = data.slots.reduce((a,s) => a + slotCount(s), 0);
  const bookedSlots = data.slots.reduce((a,s) => a + (s.booked||0), 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:'rgba(15,23,42,0.55)', backdropFilter:'blur(3px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-blue-600"/>
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900">{fmtDate(iso)}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full
                  ${status==='available'?'bg-emerald-100 text-emerald-700'
                  :status==='full'      ?'bg-red-100 text-red-600'
                  :status==='partial'   ?'bg-amber-100 text-amber-700'
                  :                      'bg-gray-100 text-gray-400'}`}>
                  {sstyle.dot} {sstyle.label}
                </span>
                {totalSlots > 0 && (
                  <span className="text-xs text-gray-400 font-medium">{bookedSlots}/{totalSlots} slots booked</span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors flex-shrink-0">
            <X className="w-4 h-4"/>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {errors.length > 0 && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 space-y-1">
              {errors.map((e,i) => (
                <p key={i} className="text-xs font-semibold text-red-600 flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3 flex-shrink-0"/>{e}
                </p>
              ))}
            </div>
          )}



          {/* Time Slots */}
          {(
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-black text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600"/> Time Slots
                </p>
                <button onClick={addSlot}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-100 transition-colors">
                  <Plus className="w-3.5 h-3.5"/> Add Slot
                </button>
              </div>

              {data.slots.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-2xl">
                  <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2"/>
                  <p className="text-sm font-bold text-gray-400 mb-1">No time slots yet</p>
                  <p className="text-xs text-gray-300 mb-3">Add slots to make this day bookable</p>
                  <button onClick={addSlot} className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors">
                    <Plus className="w-3.5 h-3.5"/> Add First Slot
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.slots.map((slot,idx) => {
                    const generated = slotCount(slot);
                    const hasBooked = (slot.booked||0) > 0;
                    return (
                      <div key={slot.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/60 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-black text-gray-600 uppercase tracking-wide">Slot {idx+1}</p>
                          <div className="flex items-center gap-2">
                            {generated > 0 && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                                {generated} appts · {slot.booked||0} booked
                              </span>
                            )}
                            {hasBooked
                              ? <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Has bookings</span>
                              : <button onClick={()=>removeSlot(slot.id)} className="w-7 h-7 rounded-lg border border-red-200 flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors">
                                  <Trash2 className="w-3 h-3"/>
                                </button>
                            }
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <TimePicker
                              label="Start"
                              value={slot.start}
                              onChange={v => updateSlot(slot.id, 'start', v)}
                            />
                          </div>
                          <div>
                            <TimePicker
                              label="End"
                              value={slot.end}
                              onChange={v => updateSlot(slot.id, 'end', v)}
                            />
                          </div>
                          <div>
                            <label className={labelCls}>Duration</label>
                            <select value={slot.duration} onChange={e=>updateSlot(slot.id,'duration',Number(e.target.value))} className={inputCls}>
                              {SLOT_DURATIONS.map(d => <option key={d} value={d}>{d} min</option>)}
                            </select>
                          </div>
                          <div>
                            <label className={labelCls}>Max Pts <span className="text-gray-300 normal-case font-normal">(opt)</span></label>
                            <input type="number" min="0" value={slot.maxPts||''} onChange={e=>updateSlot(slot.id,'maxPts',Number(e.target.value))} placeholder="Auto" className={inputCls}/>
                          </div>
                        </div>

                        {generated > 0 && (
                          <div className="pt-2 border-t border-gray-200">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Auto-generated slots</p>
                            <div className="flex flex-wrap gap-1.5">
                              {generateSlotTimes(slot.start, slot.end, slot.duration).map((startM, i) => {
                                const hS=Math.floor(startM/60), mS=startM%60;
                                const sStr=`${pad2(hS)}:${pad2(mS)}`;
                                const isBooked = i < (slot.booked||0);
                                return (
                                  <span key={i} className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${isBooked?'bg-red-50 text-red-600 border-red-200':'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                    {to12(sStr)}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Repeat */}
          {(
            <div>
              <p className="text-xs font-black text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-indigo-500"/> Repeat Schedule
              </p>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 mb-3">
                <div>
                  <p className="text-sm font-bold text-gray-800">Repeat Weekly</p>
                  <p className="text-xs text-gray-400 mt-0.5">Apply this schedule to the next N weeks</p>
                </div>
                <button onClick={() => upd({ repeat:!data.repeat })}
                  className={`relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0 cursor-pointer ${data.repeat?'bg-indigo-500':'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${data.repeat?'left-6':'left-0.5'}`}/>
                </button>
              </div>
              {data.repeat && (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-bold text-gray-500 whitespace-nowrap">Repeat for</span>
                  <div className="flex gap-2">
                    {[2,3,4,6,8].map(w => (
                      <button key={w} onClick={() => upd({ repeatWeeks:w })}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all
                          ${data.repeatWeeks===w?'bg-indigo-600 text-white border-indigo-600':'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                        {w}w
                      </button>
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">= {data.repeatWeeks} weeks</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
          <button onClick={handleClear} disabled={clearing}
            className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-700 border border-red-200 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors disabled:opacity-50">
            {clearing ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Trash2 className="w-3.5 h-3.5"/>}
            Clear Day
          </button>
          <div className="flex items-center gap-2">
            <button onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors">
              Cancel
            </button>
            <Button onClick={handleSave} disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-bold shadow-sm shadow-blue-200 text-xs">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Save className="w-3.5 h-3.5"/>}
              Save Date
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */
export default function AvailabilityPage() {
  const { toast }    = useToast();
  const { user }     = useAuth();

  // Derive doctor info from logged-in user
  const DOCTOR_USER_ID  = user?.user_id ?? null;
  const doctorName      = user ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() : '—';
  const doctorAvatar    = user ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() : '??';
  const doctorId        = user?.user_id ? `DR-${String(user.user_id).padStart(4,'0')}` : '—';
  const doctorSpecialty = user?.role ?? 'General Medicine';

  const [doctorStatus, setDoctorStatus] = useState('available');
  const [schedule,     setSchedule]     = useState({});
  const [loading,      setLoading]      = useState(false);
  const [calYear,      setCalYear]      = useState(today.getFullYear());
  const [calMonth,     setCalMonth]     = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  /* ── Fetch schedules from API on mount ── */
  const fetchSchedules = useCallback(async (userId) => {
    if (!userId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await axios.get(`${API_BASE}/doctor-schedules`, {
        params: { user_id: userId },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      // Normalize — ensure slots is always an array
      const normalized = {};
      for (const [date, d] of Object.entries(res.data ?? {})) {
        normalized[date] = {
          ...d,
          slots: Array.isArray(d.slots) ? d.slots : [],
        };
      }
      setSchedule(normalized);
    } catch (err) {
      toast({ title:'\u274c Failed to load schedules', description: err.message, variant:'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.user_id) fetchSchedules(user.user_id);
  }, [user?.user_id]);

  /* ── Save callback (passed to modal) ── */
  const handleSave = async (iso, data) => {
    const token = localStorage.getItem('auth_token');
    await axios.post(`${API_BASE}/doctor-schedules`, {
      user_id:       DOCTOR_USER_ID,
      schedule_date: iso,
      repeat:        data.repeat,
      repeat_weeks:  data.repeatWeeks,
      slots: data.slots.map(s => ({
        start:    s.start,
        end:      s.end,
        duration: s.duration,
        maxPts:   s.maxPts,
        booked:   s.booked,
      })),

    }, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    // Re-fetch to get fresh DB state (handles repeat weeks too)
    await fetchSchedules(DOCTOR_USER_ID);
  };

  /* ── Clear callback (passed to modal) ── */
  const handleClear = async (iso) => {
    const token = localStorage.getItem('auth_token');
    await axios.delete(`${API_BASE}/doctor-schedules/${DOCTOR_USER_ID}/${iso}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    setSchedule(prev => {
      const n = { ...prev };
      delete n[iso];
      return n;
    });
  };

  /* ── Calendar helpers ── */
  const prevMonth = () => { if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else setCalMonth(m=>m-1); };
  const nextMonth = () => { if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else setCalMonth(m=>m+1); };

  const daysInMonth = (y,m) => new Date(y,m+1,0).getDate();
  const firstDOW    = (y,m) => new Date(y,m,1).getDay();

  const calDays = useMemo(() => {
    const total = daysInMonth(calYear, calMonth);
    const start = firstDOW(calYear, calMonth);
    const cells = [];
    for (let i=0; i<start; i++) cells.push(null);
    for (let d=1; d<=total; d++) cells.push(d);
    return cells;
  }, [calYear, calMonth]);

  const upcomingDates = useMemo(() =>
    Object.entries(schedule)
      .filter(([iso]) => iso >= todayISO)
      .sort(([a],[b]) => a.localeCompare(b))
      .map(([iso,data]) => {
        const total  = data.slots.reduce((a,s) => a + slotCount(s), 0);
        const booked = data.slots.reduce((a,s) => a + (s.booked||0), 0);
        return { iso, data, totalSlots:total, bookedSlots:booked, remaining:total-booked, status:dateStatus(iso,schedule) };
      })
      .filter(({ status }) => status === 'available' || status === 'full'),
  [schedule]);

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const WDAYS  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const statusCfg = STATUS_CFG[doctorStatus];

  return (
    <MainLayout title="Availability" subtitle="Set your available schedule and time slots">
      <div className="space-y-5">

        {selectedDate && (
          <DateEditorModal
            iso={selectedDate}
            schedule={schedule}
            onClose={() => setSelectedDate(null)}
            onSave={handleSave}
            onClear={handleClear}
          />
        )}

        {/* Header */}
        <div className="relative rounded-2xl p-6 text-white overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700">
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none"/>
          <div className="absolute bottom-0 right-10 w-36 h-36 rounded-full bg-white/5 pointer-events-none"/>
          <div className="relative flex items-start justify-between flex-wrap gap-5">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black flex-shrink-0 border-2 border-white/30 ${avatarCls(doctorName)}`}>
                {doctorAvatar}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-black">{doctorName}</h2>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${statusCfg.bg} ${statusCfg.text} border ${statusCfg.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} ${doctorStatus==='available'?'animate-pulse':''}`}/>
                    {statusCfg.label}
                  </span>
                </div>
                <p className="text-white/80 text-sm mt-0.5 flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5"/>{doctorSpecialty} · {doctorId}
                </p>
                <div className="flex items-center gap-4 mt-2 flex-wrap text-white/70 text-xs font-semibold">
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/> {upcomingDates.length} upcoming dates</span>
                  <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5"/> {upcomingDates.reduce((a,d)=>a+d.bookedSlots,0)} total booked</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <p className="text-white/60 text-xs font-bold uppercase tracking-wide">Status</p>
              <div className="flex gap-2">
                {Object.entries(STATUS_CFG).map(([key,cfg]) => (
                  <button key={key} onClick={() => setDoctorStatus(key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all
                      ${doctorStatus===key?`${cfg.bg} ${cfg.text} ${cfg.border}`:'bg-white/10 text-white/60 border-white/20 hover:bg-white/20'}`}>
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Calendar + Upcoming side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-start">
        <div className="lg:col-span-3">
        <Section icon={Calendar} title="Monthly Calendar" accent="text-blue-600"
          action={
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
                <ChevronLeft className="w-3.5 h-3.5"/>
              </button>
              <span className="text-sm font-black text-gray-800 min-w-[130px] text-center">{MONTHS[calMonth]} {calYear}</span>
              <button onClick={nextMonth} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
                <ChevronRight className="w-3.5 h-3.5"/>
              </button>
            </div>
          }>

          <p className="text-xs text-gray-400 mb-4 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5"/> Click any future date to open the schedule editor.
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500"/>
              <span className="ml-2 text-sm text-gray-400">Loading schedule...</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 mb-2">
                {WDAYS.map(d => (
                  <div key={d} className="text-[11px] font-bold text-gray-400 text-center py-1">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {calDays.map((day,i) => {
                  if (!day) return <div key={`empty-${i}`}/>;
                  const iso    = isoOf(calYear, calMonth+1, day);
                  const past   = isPast(iso);
                  const isToday= iso === todayISO;
                  const status = dateStatus(iso, schedule);
                  const sstyle = DATE_STATUS_STYLE[status];

                  return (
                    <button key={iso}
                      onClick={() => !past && setSelectedDate(iso)}
                      title={past ? 'Past date' : 'Click to edit'}
                      className={`
                        relative w-full rounded-xl flex flex-col items-center justify-center py-2.5 px-1
                        text-xs font-bold transition-all group
                        ${past ? 'opacity-30 cursor-not-allowed text-gray-400' : 'cursor-pointer'}
                        ${!past&&status==='none' ? 'hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 border border-transparent' : ''}
                        ${status!=='none'&&!past ? `${sstyle.bg} ${sstyle.text} shadow-sm` : 'bg-gray-50 border border-gray-100'}
                        ${isToday ? 'ring-2 ring-indigo-400 ring-offset-1' : ''}
                      `}>
                      <span className="text-sm font-black leading-none">{day}</span>
                      {isToday && <span className="text-[8px] font-bold mt-0.5 opacity-70">Today</span>}
                      {status!=='none' && !past && (
                        <span className="text-[9px] mt-0.5 opacity-75 leading-none">
                          {status==='full' ? 'Full'
                            : status==='partial' ? 'Partial'
                            : `${schedule[iso]?.slots.reduce((a,s)=>a+slotCount(s),0)-schedule[iso]?.slots.reduce((a,s)=>a+(s.booked||0),0)} left`}
                        </span>
                      )}
                      {!past && status==='none' && (
                        <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus className="w-4 h-4 text-blue-400"/>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap gap-x-5 gap-y-2">
                {Object.entries(DATE_STATUS_STYLE).map(([k,v]) => (
                  <div key={k} className="flex items-center gap-1.5">
                    <span className="text-sm">{v.dot}</span>
                    <span className="text-xs font-semibold text-gray-500">{v.label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Section>
        </div>{/* end 3/4 col */}

        {/* Upcoming Dates — 1/4 col, scrollable */}
        <div className="lg:col-span-1">
        <Card className="border border-gray-100 shadow-sm h-full">
          <CardHeader className="pb-0 px-5 pt-5 flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-indigo-600"/>Upcoming
              </CardTitle>
              <span className="text-xs text-gray-400 font-medium">{upcomingDates.length}</span>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-4">
          <div className="overflow-y-auto max-h-[520px] space-y-2 pr-1">
          {upcomingDates.length === 0 ? (
            <p className="text-xs text-gray-400 italic text-center py-8">No upcoming dates yet.</p>
          ) : (
            upcomingDates.map(({ iso, totalSlots, bookedSlots, remaining, status }) => {
              const sstyle = DATE_STATUS_STYLE[status];
              return (
                <div key={iso}
                  className="p-3 rounded-xl border border-gray-100 bg-gray-50/60 hover:bg-blue-50/40 hover:border-blue-100 transition-all cursor-pointer"
                  onClick={() => {
                    const d = new Date(iso + 'T00:00:00');
                    setCalYear(d.getFullYear()); setCalMonth(d.getMonth());
                    setSelectedDate(iso);
                  }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-black text-gray-800 leading-tight">{fmtDate(iso)}</p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full
                      ${status==='available' ? 'bg-emerald-100 text-emerald-700'
                      : status==='full'      ? 'bg-red-100 text-red-600'
                      : status==='partial'   ? 'bg-amber-100 text-amber-700'
                      :                        'bg-gray-100 text-gray-400'}`}>
                      {sstyle.dot} {sstyle.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-semibold text-gray-400">
                    <span className="text-blue-500">{bookedSlots} booked</span>
                    <span>·</span>
                    <span className={remaining > 0 ? 'text-emerald-600' : 'text-red-400'}>{remaining} left</span>
                    <span>·</span>
                    <span>{totalSlots} total</span>
                  </div>
                </div>
              );
            })
          )}
          </div>
          </CardContent>
        </Card>
        </div>{/* end 1/4 col */}
        </div>{/* end grid */}

        {/* Action Buttons */}
        <Card className="border border-gray-100 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Button onClick={() => fetchSchedules(DOCTOR_USER_ID)}
                  variant="outline"
                  className="gap-2 border-gray-200 font-bold text-gray-700">
                  <RefreshCw className="w-4 h-4 text-gray-500"/> Refresh Schedule
                </Button>
              </div>
              <div className="text-xs text-gray-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5"/> All schedule changes are saved directly to the database.
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-start gap-2 text-xs text-gray-400">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"/>
              <p>
                Changes affect new bookings only. Existing confirmed appointments will not be cancelled automatically.
                Dates with existing bookings cannot be fully cleared — contact admin to cancel individual appointments.
              </p>
            </div>
          </CardContent>
        </Card>

      </div>
    </MainLayout>
  );
}