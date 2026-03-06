import React, { useState, useMemo, useEffect } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  User, Calendar, Clock, CheckCircle2, XCircle, AlertCircle,
  Plus, Trash2, Save, Edit, ChevronLeft, ChevronRight,
  Stethoscope, CalendarClock, Ban, Info, Check,
  RefreshCw, Activity, Timer, Users, Repeat, X,
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

/* ═══════════════════════════════════════════════════
   DEMO DATA
═══════════════════════════════════════════════════ */
const DOCTOR = {
  id: 'DR-0012', name: 'Dr. Sarah Smith',
  specialty: 'General Medicine', status: 'available', avatar: 'SS',
};

const STATUS_CFG = {
  available: { label:'Available', dot:'bg-emerald-500', text:'text-emerald-700', bg:'bg-emerald-50',  border:'border-emerald-200' },
  on_leave:  { label:'On Leave',  dot:'bg-amber-500',   text:'text-amber-700',  bg:'bg-amber-50',   border:'border-amber-200'  },
  off_duty:  { label:'Off Duty',  dot:'bg-red-400',     text:'text-red-600',    bg:'bg-red-50',     border:'border-red-200'    },
};

const SLOT_DURATIONS = [15, 20, 30, 45, 60];
const BLOCK_REASONS  = ['Personal Leave','Holiday','Medical Conference','Emergency Leave','Training / Seminar','Sick Leave','Other'];

const today    = new Date();
const pad2     = (n) => String(n).padStart(2,'0');
const todayISO = `${today.getFullYear()}-${pad2(today.getMonth()+1)}-${pad2(today.getDate())}`;
const isoOf    = (y,m,d) => `${y}-${pad2(m)}-${pad2(d)}`;

const seedDate = (offset) => {
  const d = new Date(today); d.setDate(today.getDate()+offset);
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
};

const INITIAL_SCHEDULE = {
  [seedDate(1)]: { slots:[{id:1,start:'08:00',end:'10:00',duration:30,maxPts:4,booked:2},{id:2,start:'13:00',end:'16:00',duration:30,maxPts:6,booked:3}], blocked:false,blockReason:'',blockFull:false,blockedRanges:[],repeat:false,repeatWeeks:4 },
  [seedDate(2)]: { slots:[{id:1,start:'09:00',end:'12:00',duration:30,maxPts:6,booked:6}], blocked:false,blockReason:'',blockFull:false,blockedRanges:[],repeat:false,repeatWeeks:4 },
  [seedDate(5)]: { slots:[], blocked:true,blockReason:'Medical Conference',blockFull:true,blockedRanges:[],repeat:false,repeatWeeks:4 },
  [seedDate(7)]: { slots:[{id:1,start:'08:00',end:'11:00',duration:20,maxPts:9,booked:1}], blocked:false,blockReason:'',blockFull:false,blockedRanges:[{id:1,start:'11:00',end:'13:00',reason:'Personal errand'}],repeat:false,repeatWeeks:4 },
};

/* ═══════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════ */
const toMins    = (t) => { if(!t) return 0; const[h,m]=t.split(':').map(Number); return h*60+m; };
const diffMin   = (s,e) => Math.max(0,toMins(e)-toMins(s));
const to12      = (t) => { if(!t) return '—'; const[h,m]=t.split(':').map(Number); return `${h%12||12}:${pad2(m)} ${h>=12?'PM':'AM'}`; };
const slotCount = (s) => s.duration ? Math.floor(diffMin(s.start,s.end)/s.duration) : 0;
const isPast    = (iso) => iso < todayISO;

const fmtDate  = (iso) => { if(!iso) return '—'; const d=new Date(iso+'T00:00:00'); return d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'}); };

const dateStatus = (iso, schedule) => {
  const s = schedule[iso];
  if (!s) return 'none';
  if (s.blocked && s.blockFull) return 'blocked';
  const total  = s.slots.reduce((a,sl)=>a+slotCount(sl),0);
  const booked = s.slots.reduce((a,sl)=>a+(sl.booked||0),0);
  if (total===0) return 'none';
  if (booked>=total) return 'full';
  if (booked>0) return 'partial';
  return 'available';
};

const DATE_STATUS_STYLE = {
  available:{ bg:'bg-emerald-500', text:'text-white',      dot:'🟢', label:'Available'    },
  full:     { bg:'bg-red-500',     text:'text-white',      dot:'🔴', label:'Fully Booked' },
  partial:  { bg:'bg-amber-400',   text:'text-amber-900',  dot:'🟡', label:'Partial'      },
  blocked:  { bg:'bg-gray-700',    text:'text-white',      dot:'⛔', label:'Blocked'      },
  none:     { bg:'',               text:'text-gray-400',   dot:'⚪', label:'No Schedule'  },
};

const inputCls = `w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 placeholder:text-gray-400 transition-all`;
const labelCls = 'block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5';
const avatarColors = ['bg-blue-100 text-blue-700','bg-teal-100 text-teal-700','bg-violet-100 text-violet-700'];
const avatarCls = (n) => avatarColors[n.charCodeAt(0)%avatarColors.length];

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
   DATE EDITOR MODAL
═══════════════════════════════════════════════════ */
function DateEditorModal({ iso, schedule, onClose, onSave, onClear }) {
  const { toast } = useToast();

  const existing = schedule[iso] || { slots:[], blocked:false, blockReason:'', blockFull:false, blockedRanges:[], repeat:false, repeatWeeks:4 };
  const [data, setData]   = useState(existing);
  const [errors, setErrors] = useState([]);

  /* Close on Escape */
  useEffect(() => {
    const handler = (e) => { if (e.key==='Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  /* Lock body scroll */
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const upd = (patch) => setData(d => ({ ...d, ...patch }));

  /* Slot helpers */
  const addSlot = () => upd({ slots:[...data.slots,{id:Date.now(),start:'09:00',end:'11:00',duration:30,maxPts:0,booked:0}] });
  const updateSlot = (id,k,v) => upd({ slots:data.slots.map(s=>s.id===id?{...s,[k]:v}:s) });
  const removeSlot = (id) => {
    if (data.slots.find(s=>s.id===id)?.booked>0) { toast({title:'⚠️ Cannot remove',description:'Slot has existing bookings.',variant:'destructive'}); return; }
    upd({ slots:data.slots.filter(s=>s.id!==id) });
  };

  /* Block range helpers */
  const addRange    = () => upd({ blockedRanges:[...(data.blockedRanges||[]),{id:Date.now(),start:'12:00',end:'13:00',reason:''}] });
  const updateRange = (id,k,v) => upd({ blockedRanges:data.blockedRanges.map(r=>r.id===id?{...r,[k]:v}:r) });
  const removeRange = (id) => upd({ blockedRanges:data.blockedRanges.filter(r=>r.id!==id) });

  /* Validate */
  const validate = () => {
    const errs = [];
    data.slots.forEach((s,i)=>{
      if (toMins(s.start)>=toMins(s.end)) errs.push(`Slot ${i+1}: start must be before end.`);
    });
    for (let i=0;i<data.slots.length;i++) for(let j=i+1;j<data.slots.length;j++) {
      const a=data.slots[i],b=data.slots[j];
      if (toMins(a.start)<toMins(b.end)&&toMins(a.end)>toMins(b.start)) errs.push(`Slots ${i+1} and ${j+1} overlap.`);
    }
    (data.blockedRanges||[]).forEach((r,i)=>{
      if (toMins(r.start)>=toMins(r.end)) errs.push(`Block range ${i+1}: start must be before end.`);
    });
    return errs;
  };

  const handleSave = () => {
    const errs = validate();
    if (errs.length) { setErrors(errs); return; }
    onSave(iso, data);
    toast({ title:'💾 Schedule saved', description:`${fmtDate(iso)} updated.` });
    onClose();
  };

  const handleClear = () => {
    const hasBooked = data.slots.some(s=>s.booked>0);
    if (hasBooked) { toast({title:'⚠️ Cannot clear',description:'Date has existing appointments.',variant:'destructive'}); return; }
    onClear(iso);
    toast({ title:'🗑 Schedule cleared', description:`${fmtDate(iso)} cleared.` });
    onClose();
  };

  const status      = dateStatus(iso, schedule);
  const sstyle      = DATE_STATUS_STYLE[status];
  const totalSlots  = data.slots.reduce((a,s)=>a+slotCount(s),0);
  const bookedSlots = data.slots.reduce((a,s)=>a+(s.booked||0),0);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:'rgba(15,23,42,0.55)', backdropFilter:'blur(3px)' }}
      onClick={(e) => { if(e.target===e.currentTarget) onClose(); }}
    >
      {/* Modal panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* ── Modal Header ── */}
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
                  :status==='blocked'   ?'bg-gray-200 text-gray-600'
                  :                      'bg-gray-100 text-gray-400'}`}>
                  {sstyle.dot} {sstyle.label}
                </span>
                {totalSlots>0 && (
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

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Validation errors */}
          {errors.length>0 && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 space-y-1">
              {errors.map((e,i)=>(
                <p key={i} className="text-xs font-semibold text-red-600 flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3 flex-shrink-0"/>{e}
                </p>
              ))}
            </div>
          )}

          {/* ── §5 Block Entire Day ── */}
          <div>
            <p className="text-xs font-black text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Ban className="w-3.5 h-3.5 text-red-500"/> Block This Day
            </p>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 mb-3">
              <div>
                <p className="text-sm font-bold text-gray-800">Block Entire Day</p>
                <p className="text-xs text-gray-400 mt-0.5">No appointments will be allowed on this date</p>
              </div>
              <button onClick={()=>upd({blocked:!data.blocked,blockFull:!data.blocked})}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0 cursor-pointer ${data.blocked?'bg-red-500':'bg-gray-300'}`}>
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${data.blocked?'left-6':'left-0.5'}`}/>
              </button>
            </div>
            {data.blocked && (
              <div>
                <label className={labelCls}>Block Reason</label>
                <select value={data.blockReason} onChange={e=>upd({blockReason:e.target.value})} className={inputCls}>
                  <option value="">Select reason...</option>
                  {BLOCK_REASONS.map(r=><option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            )}

            {/* Partial block ranges */}
            {!data.blocked && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={labelCls + ' mb-0'}>Block Partial Hours</label>
                  <button onClick={addRange} className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-700 transition-colors">
                    <Plus className="w-3 h-3"/> Add Range
                  </button>
                </div>
                {(data.blockedRanges||[]).length===0
                  ? <p className="text-xs text-gray-400 italic">No partial blocks.</p>
                  : (data.blockedRanges||[]).map((r,i)=>(
                    <div key={r.id} className="grid grid-cols-12 gap-2 items-end mb-2">
                      <div className="col-span-4">
                        {i===0&&<label className={labelCls}>Start</label>}
                        <input type="time" value={r.start} onChange={e=>updateRange(r.id,'start',e.target.value)} className={inputCls}/>
                      </div>
                      <div className="col-span-4">
                        {i===0&&<label className={labelCls}>End</label>}
                        <input type="time" value={r.end} onChange={e=>updateRange(r.id,'end',e.target.value)} className={inputCls}/>
                      </div>
                      <div className="col-span-3">
                        {i===0&&<label className={labelCls}>Reason</label>}
                        <input type="text" value={r.reason} onChange={e=>updateRange(r.id,'reason',e.target.value)} placeholder="Optional" className={inputCls}/>
                      </div>
                      <div className="col-span-1 flex justify-end pb-0.5">
                        <button onClick={()=>removeRange(r.id)} className="w-8 h-9 rounded-lg border border-red-200 flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-3.5 h-3.5"/>
                        </button>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </div>

          {/* ── §2+3 Time Slots ── */}
          {!data.blocked && (
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

              {data.slots.length===0 ? (
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
                  {data.slots.map((slot,idx)=>{
                    const generated  = slotCount(slot);
                    const hasBooked  = (slot.booked||0)>0;
                    return (
                      <div key={slot.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/60 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-black text-gray-600 uppercase tracking-wide">Slot {idx+1}</p>
                          <div className="flex items-center gap-2">
                            {generated>0 && (
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

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <label className={labelCls}>Start</label>
                            <input type="time" value={slot.start} onChange={e=>updateSlot(slot.id,'start',e.target.value)} className={inputCls}/>
                            <p className="text-[10px] text-gray-400 mt-1">{to12(slot.start)}</p>
                          </div>
                          <div>
                            <label className={labelCls}>End</label>
                            <input type="time" value={slot.end} onChange={e=>updateSlot(slot.id,'end',e.target.value)} className={inputCls}/>
                            <p className="text-[10px] text-gray-400 mt-1">{to12(slot.end)}</p>
                          </div>
                          <div>
                            <label className={labelCls}>Duration</label>
                            <select value={slot.duration} onChange={e=>updateSlot(slot.id,'duration',Number(e.target.value))} className={inputCls}>
                              {SLOT_DURATIONS.map(d=><option key={d} value={d}>{d} min</option>)}
                            </select>
                          </div>
                          <div>
                            <label className={labelCls}>Max Pts <span className="text-gray-300 normal-case font-normal">(opt)</span></label>
                            <input type="number" min="0" value={slot.maxPts||''} onChange={e=>updateSlot(slot.id,'maxPts',Number(e.target.value))} placeholder="Auto" className={inputCls}/>
                          </div>
                        </div>

                        {generated>0 && (
                          <div className="pt-2 border-t border-gray-200">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Auto-generated slots</p>
                            <div className="flex flex-wrap gap-1.5">
                              {Array.from({length:generated}).map((_,i)=>{
                                const startM=toMins(slot.start)+i*slot.duration;
                                const hS=Math.floor(startM/60),mS=startM%60;
                                const sStr=`${pad2(hS)}:${pad2(mS)}`;
                                const isBooked=i<(slot.booked||0);
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

          {/* ── §4 Repeat ── */}
          {!data.blocked && (
            <div>
              <p className="text-xs font-black text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-indigo-500"/> Repeat Schedule
              </p>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 mb-3">
                <div>
                  <p className="text-sm font-bold text-gray-800">Repeat Weekly</p>
                  <p className="text-xs text-gray-400 mt-0.5">Apply this schedule to the next N weeks</p>
                </div>
                <button onClick={()=>upd({repeat:!data.repeat})}
                  className={`relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0 cursor-pointer ${data.repeat?'bg-indigo-500':'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${data.repeat?'left-6':'left-0.5'}`}/>
                </button>
              </div>
              {data.repeat && (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-bold text-gray-500 whitespace-nowrap">Repeat for</span>
                  <div className="flex gap-2">
                    {[2,3,4,6,8].map(w=>(
                      <button key={w} onClick={()=>upd({repeatWeeks:w})}
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

        {/* ── Modal Footer ── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
          <button onClick={handleClear}
            className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-700 border border-red-200 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors">
            <Trash2 className="w-3.5 h-3.5"/> Clear Day
          </button>
          <div className="flex items-center gap-2">
            <button onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors">
              Cancel
            </button>
            <Button onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-bold shadow-sm shadow-blue-200 text-xs">
              <Save className="w-3.5 h-3.5"/> Save Date
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
  const { toast } = useToast();

  const [doctorStatus, setDoctorStatus] = useState(DOCTOR.status);
  const [schedule, setSchedule]         = useState(INITIAL_SCHEDULE);
  const [calYear,  setCalYear]          = useState(today.getFullYear());
  const [calMonth, setCalMonth]         = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null); // null = modal closed

  const prevMonth = () => { if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else setCalMonth(m=>m-1); };
  const nextMonth = () => { if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else setCalMonth(m=>m+1); };

  const daysInMonth = (y,m) => new Date(y,m+1,0).getDate();
  const firstDOW    = (y,m) => new Date(y,m,1).getDay(); // 0=Sun

  const calDays = useMemo(()=>{
    const total=daysInMonth(calYear,calMonth);
    const start=firstDOW(calYear,calMonth);
    const cells=[];
    for(let i=0;i<start;i++) cells.push(null);
    for(let d=1;d<=total;d++) cells.push(d);
    return cells;
  },[calYear,calMonth]);

  /* Save/clear callbacks passed to modal */
  const handleSave = (iso, data) => {
    if (data.repeat && data.repeatWeeks>1) {
      const updates={};
      for(let w=0;w<data.repeatWeeks;w++){
        const d=new Date(iso+'T00:00:00'); d.setDate(d.getDate()+w*7);
        const wiso=`${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
        if(!isPast(wiso)) updates[wiso]={...data,slots:data.slots.map(s=>({...s,id:Date.now()+w+s.id,booked:0}))};
      }
      setSchedule(prev=>({...prev,...updates}));
      toast({title:'🔁 Schedule repeated',description:`Applied to ${data.repeatWeeks} weeks.`});
    } else {
      setSchedule(prev=>({...prev,[iso]:data}));
    }
  };

  const handleClear = (iso) => {
    setSchedule(prev=>{ const n={...prev}; delete n[iso]; return n; });
  };

  const upcomingDates = useMemo(()=>
    Object.entries(schedule)
      .filter(([iso])=>iso>=todayISO)
      .sort(([a],[b])=>a.localeCompare(b))
      .map(([iso,data])=>{
        const total  = data.slots.reduce((a,s)=>a+slotCount(s),0);
        const booked = data.slots.reduce((a,s)=>a+(s.booked||0),0);
        return {iso,data,totalSlots:total,bookedSlots:booked,remaining:total-booked,status:dateStatus(iso,schedule)};
      }),
  [schedule]);

  const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
  const WDAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const statusCfg = STATUS_CFG[doctorStatus];

  return (
    <MainLayout title="Availability" subtitle="Set your schedule, time slots, and blocked dates per day">
      <div className="space-y-5">

        {/* ══ MODAL ══ */}
        {selectedDate && (
          <DateEditorModal
            iso={selectedDate}
            schedule={schedule}
            onClose={()=>setSelectedDate(null)}
            onSave={handleSave}
            onClear={handleClear}
          />
        )}

        {/* ══════════════════════════════════════════════
            §1  HEADER
        ══════════════════════════════════════════════ */}
        <div className="relative rounded-2xl p-6 text-white overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700">
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none"/>
          <div className="absolute bottom-0 right-10 w-36 h-36 rounded-full bg-white/5 pointer-events-none"/>
          <div className="relative flex items-start justify-between flex-wrap gap-5">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black flex-shrink-0 border-2 border-white/30 ${avatarCls(DOCTOR.name)}`}>
                {DOCTOR.avatar}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-black">{DOCTOR.name}</h2>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${statusCfg.bg} ${statusCfg.text} border ${statusCfg.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} ${doctorStatus==='available'?'animate-pulse':''}`}/>
                    {statusCfg.label}
                  </span>
                </div>
                <p className="text-white/80 text-sm mt-0.5 flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5"/>{DOCTOR.specialty} · {DOCTOR.id}
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
                {Object.entries(STATUS_CFG).map(([key,cfg])=>(
                  <button key={key} onClick={()=>setDoctorStatus(key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all
                      ${doctorStatus===key?`${cfg.bg} ${cfg.text} ${cfg.border}`:'bg-white/10 text-white/60 border-white/20 hover:bg-white/20'}`}>
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            §2  CALENDAR  (full width now — no side editor)
        ══════════════════════════════════════════════ */}
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

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {WDAYS.map(d=>(
              <div key={d} className="text-[11px] font-bold text-gray-400 text-center py-1">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {calDays.map((day,i)=>{
              if(!day) return <div key={`empty-${i}`}/>;
              const iso    = isoOf(calYear,calMonth+1,day);
              const past   = isPast(iso);
              const isToday= iso===todayISO;
              const status = dateStatus(iso,schedule);
              const sstyle = DATE_STATUS_STYLE[status];

              return (
                <button key={iso}
                  onClick={()=>!past&&setSelectedDate(iso)}
                  title={past?'Past date':'Click to edit'}
                  className={`
                    relative w-full rounded-xl flex flex-col items-center justify-center py-2.5 px-1
                    text-xs font-bold transition-all group
                    ${past?'opacity-30 cursor-not-allowed text-gray-400':'cursor-pointer'}
                    ${!past&&status==='none'?'hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 border border-transparent':''}
                    ${status!=='none'&&!past?`${sstyle.bg} ${sstyle.text} shadow-sm`:'bg-gray-50 border border-gray-100'}
                    ${isToday?'ring-2 ring-indigo-400 ring-offset-1':''}
                  `}>
                  <span className="text-sm font-black leading-none">{day}</span>
                  {isToday && <span className="text-[8px] font-bold mt-0.5 opacity-70">Today</span>}
                  {status!=='none' && !past && (
                    <span className="text-[9px] mt-0.5 opacity-75 leading-none">
                      {status==='blocked'?'Blocked'
                        :status==='full'?'Full'
                        :status==='partial'?'Partial'
                        :`${schedule[iso]?.slots.reduce((a,s)=>a+slotCount(s),0)-schedule[iso]?.slots.reduce((a,s)=>a+(s.booked||0),0)} left`}
                    </span>
                  )}
                  {/* Hover hint for empty days */}
                  {!past&&status==='none'&&(
                    <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="w-4 h-4 text-blue-400"/>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap gap-x-5 gap-y-2">
            {Object.entries(DATE_STATUS_STYLE).map(([k,v])=>(
              <div key={k} className="flex items-center gap-1.5">
                <span className="text-sm">{v.dot}</span>
                <span className="text-xs font-semibold text-gray-500">{v.label}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ══════════════════════════════════════════════
            §6  UPCOMING DATES TABLE
        ══════════════════════════════════════════════ */}
        <Section icon={CalendarClock} title="Upcoming Scheduled Dates" accent="text-indigo-600"
          action={<span className="text-xs text-gray-400 font-medium">{upcomingDates.length} dates</span>}>
          {upcomingDates.length===0 ? (
            <p className="text-sm text-gray-400 italic text-center py-4">No upcoming dates scheduled. Click a date on the calendar to get started.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80">
                    {['Date','Status','Available Slots','Booked','Remaining','Actions'].map(h=>(
                      <th key={h} className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap first:pl-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {upcomingDates.map(({iso,totalSlots,bookedSlots,remaining,status})=>{
                    const sstyle=DATE_STATUS_STYLE[status];
                    return (
                      <tr key={iso} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                        <td className="py-3.5 px-4 pl-2 whitespace-nowrap">
                          <p className="text-xs font-black text-gray-800">{fmtDate(iso)}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full
                            ${status==='available'?'bg-emerald-100 text-emerald-700'
                            :status==='full'      ?'bg-red-100 text-red-600'
                            :status==='partial'   ?'bg-amber-100 text-amber-700'
                            :status==='blocked'   ?'bg-gray-200 text-gray-600'
                            :                      'bg-gray-100 text-gray-400'}`}>
                            {sstyle.dot} {sstyle.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4"><p className="text-xs font-bold text-gray-700">{totalSlots}</p></td>
                        <td className="py-3.5 px-4"><span className={`text-xs font-bold ${bookedSlots>0?'text-blue-600':'text-gray-400'}`}>{bookedSlots}</span></td>
                        <td className="py-3.5 px-4"><span className={`text-xs font-bold ${remaining>0?'text-emerald-600':'text-red-500'}`}>{remaining}</span></td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={()=>{
                              const d=new Date(iso+'T00:00:00');
                              setCalYear(d.getFullYear()); setCalMonth(d.getMonth());
                              setSelectedDate(iso);
                            }}
                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-100 transition-colors">
                            <Edit className="w-3 h-3"/> Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* ══════════════════════════════════════════════
            §8  ACTION BUTTONS
        ══════════════════════════════════════════════ */}
        <Card className="border border-gray-100 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Button onClick={()=>toast({title:'💾 All changes saved',description:'Availability schedule has been updated.'})}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-bold shadow-sm shadow-blue-200">
                  <Save className="w-4 h-4"/> Save All Changes
                </Button>
                <Button variant="outline"
                  onClick={()=>toast({title:'🔄 Slots recalculated',description:'Available slots have been refreshed.'})}
                  className="gap-2 border-gray-200 font-bold text-gray-700">
                  <RefreshCw className="w-4 h-4 text-gray-500"/> Recalculate Slots
                </Button>
              </div>
              <div className="text-xs text-gray-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5"/> All schedule changes are logged for admin review.
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