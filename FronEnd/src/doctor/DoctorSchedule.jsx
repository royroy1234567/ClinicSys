import React, { useState, useMemo } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  ChevronLeft, ChevronRight, Calendar, Clock, Phone,
  CheckCircle2, XCircle, Plus, Edit, X, Check,
  CalendarDays, LayoutGrid, CalendarRange, Stethoscope,
  RefreshCw, ChevronDown, Coffee, PlayCircle, CheckSquare,
  ClipboardList, Search, FileText,
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

/* ═══════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════ */
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DAYS_FULL  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS     = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const DOCTOR = { name:'Dr. Sarah Smith', specialty:'General Medicine', license:'PRC-12345' };

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700', 'bg-teal-100 text-teal-700',
  'bg-violet-100 text-violet-700', 'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700', 'bg-emerald-100 text-emerald-700',
];
const avatarColor = (name) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const WORK_CFG = {
  days:       [1,2,3,4,5],
  start:      '08:00',
  end:        '17:00',
  duration:   30,
  breakStart: '12:00',
  breakEnd:   '13:00',
};

const RECENT_CONSULTS = [
  { id:1, patient:'John Doe',      date:'Mar 4, 2026', diagnosis:'Hypertension monitoring',  notes:'BP 140/90. Adjusted amlodipine dosage. Monitor weekly.'             },
  { id:2, patient:'Jane Smith',    date:'Mar 4, 2026', diagnosis:'Diabetes follow-up',        notes:'HbA1c improved to 6.8%. Continue metformin, recheck in 3 months.'  },
  { id:3, patient:'Carlos Reyes',  date:'Mar 3, 2026', diagnosis:'Upper resp. infection',     notes:'Prescribed amoxicillin 500mg TID x 7 days. Rest and fluids.'        },
  { id:4, patient:'Carla Mendoza', date:'Mar 3, 2026', diagnosis:'Asthma exacerbation',       notes:'Nebulization done. Salbutamol MDI prescribed. Follow up in 1 week.' },
  { id:5, patient:'David Lim',     date:'Mar 2, 2026', diagnosis:'GERD',                      notes:'Started omeprazole 20mg OD. Dietary modification advised.'           },
];

/* ═══════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════ */
const padZ         = (n) => String(n).padStart(2,'0');
const fmtD         = (d) => `${d.getFullYear()}-${padZ(d.getMonth()+1)}-${padZ(d.getDate())}`;
const TODAY        = fmtD(new Date());
const fmtTime      = (t) => { if (!t) return ''; const [h,m]=t.split(':'); const hr=parseInt(h); return `${hr>12?hr-12:hr||12}:${m} ${hr>=12?'PM':'AM'}`; };
const fmtDateShort = (d) => `${MONTHS[d.getMonth()].slice(0,3)} ${d.getDate()}`;
const fmtDateFull  = (d) => `${DAYS_FULL[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
const isWorkDay    = (d) => WORK_CFG.days.includes(d.getDay());
const isBreak      = (t) => t >= WORK_CFG.breakStart && t < WORK_CFG.breakEnd;
const isToday      = (d) => fmtD(d) === TODAY;

const getWeekDates = (offset=0) => {
  const base = new Date();
  base.setDate(base.getDate() - ((base.getDay()+6)%7) + offset*7);
  return Array.from({length:7},(_,i)=>{ const d=new Date(base); d.setDate(base.getDate()+i); return d; });
};

const TIME_SLOTS = (() => {
  const s=[];
  for(let h=8;h<17;h++){s.push(`${padZ(h)}:00`);s.push(`${padZ(h)}:30`);}
  return s;
})();

const aptKey = (date,time) => `${fmtD(date)}_${time}`;

/* ═══════════════════════════════════════════════════
   TODAY'S SCHEDULE DATA
═══════════════════════════════════════════════════ */
const INIT_APPOINTMENTS = [
  { id:'APT-001', time:'08:00', end:'08:30', patient:'John Doe',       age:45, contact:'+63 912 111 0001', queue:1,  status:'completed', diagnosis:'Hypertension monitoring',  type:'Chronic' },
  { id:'APT-002', time:'08:30', end:'09:00', patient:'Jane Smith',     age:32, contact:'+63 912 111 0002', queue:2,  status:'completed', diagnosis:'Diabetes follow-up',        type:'Chronic' },
  { id:'APT-003', time:'09:00', end:'09:45', patient:'Robert Johnson', age:58, contact:'+63 912 111 0003', queue:3,  status:'ongoing',   diagnosis:'Chest pain evaluation',     type:'Regular' },
  { id:'APT-004', time:'09:45', end:'10:15', patient:'Maria Santos',   age:27, contact:'+63 912 111 0004', queue:4,  status:'scheduled', diagnosis:'',                          type:'VIP'     },
  { id:'APT-005', time:'10:15', end:'10:45', patient:'Carlos Reyes',   age:61, contact:'+63 912 111 0005', queue:5,  status:'scheduled', diagnosis:'',                          type:'Regular' },
  { id:'APT-006', time:'10:45', end:'11:15', patient:'Ana Cruz',       age:39, contact:'+63 912 111 0006', queue:6,  status:'scheduled', diagnosis:'',                          type:'Chronic' },
  { id:'APT-007', time:'11:15', end:'11:45', patient:'Ben Torres',     age:52, contact:'+63 912 111 0007', queue:7,  status:'scheduled', diagnosis:'',                          type:'Regular' },
  { id:'APT-008', time:'13:00', end:'13:30', patient:'Carla Mendoza',  age:44, contact:'+63 912 111 0008', queue:8,  status:'scheduled', diagnosis:'',                          type:'Regular' },
  { id:'APT-009', time:'13:30', end:'14:00', patient:'David Lim',      age:36, contact:'+63 912 111 0009', queue:9,  status:'scheduled', diagnosis:'',                          type:'VIP'     },
  { id:'APT-010', time:'14:00', end:'14:30', patient:'Elena Ramos',    age:29, contact:'+63 912 111 0010', queue:10, status:'scheduled', diagnosis:'',                          type:'Regular' },
];

/* ═══════════════════════════════════════════════════
   DEMO CALENDAR APPOINTMENTS
═══════════════════════════════════════════════════ */
const buildDemoApts = () => {
  const w = getWeekDates(0);
  const [mon,tue,wed,thu,fri] = w;
  const e = {};
  const set = (d,t,pt,age,ct,q,st,type) => { e[aptKey(d,t)]={patient:pt,age,contact:ct,queue:q,status:st,type}; };
  set(mon,'08:00','John Doe',       45,'+63 912 111 0001',1,'completed','Follow-up');
  set(mon,'08:30','Jane Smith',     32,'+63 912 111 0002',2,'completed','General Consult');
  set(mon,'09:00','Robert Johnson', 58,'+63 912 111 0003',3,'completed','Chronic Care');
  set(mon,'09:30','Maria Santos',   27,'+63 912 111 0004',4,'ongoing',  'General Consult');
  set(mon,'10:00','Carlos Reyes',   61,'+63 912 111 0005',5,'scheduled','Follow-up');
  set(mon,'10:30','Ana Cruz',       39,'+63 912 111 0006',6,'scheduled','General Consult');
  set(mon,'13:00','Ben Torres',     52,'+63 912 111 0007',7,'scheduled','Chronic Care');
  set(mon,'13:30','Carla Mendoza',  44,'+63 912 111 0008',8,'scheduled','Follow-up');
  set(tue,'08:00','David Lim',      36,'+63 912 111 0009',1,'scheduled','General Consult');
  set(tue,'09:00','Elena Ramos',    29,'+63 912 111 0010',2,'scheduled','General Consult');
  set(tue,'10:00','Felix Tan',      67,'+63 912 111 0011',3,'scheduled','Chronic Care');
  set(tue,'13:30','Grace Ong',      41,'+63 912 111 0012',4,'scheduled','Follow-up');
  set(tue,'14:00','Henry Sy',       55,'+63 912 111 0013',5,'scheduled','General Consult');
  set(wed,'08:30','Isabel Diaz',    33,'+63 912 111 0014',1,'scheduled','General Consult');
  set(wed,'09:00','Jake Lim',       48,'+63 912 111 0015',2,'scheduled','Follow-up');
  set(wed,'10:30','Karen Santos',   25,'+63 912 111 0016',3,'scheduled','General Consult');
  set(wed,'14:00','Leo Cruz',       72,'+63 912 111 0017',4,'scheduled','Chronic Care');
  set(thu,'08:00','Mia Torres',     38,'+63 912 111 0018',1,'scheduled','General Consult');
  set(thu,'09:30','Noel Reyes',     50,'+63 912 111 0019',2,'scheduled','Follow-up');
  set(thu,'11:00','Olivia Chan',    43,'+63 912 111 0020',3,'scheduled','Chronic Care');
  set(thu,'13:00','Paul Garcia',    62,'+63 912 111 0021',4,'scheduled','General Consult');
  set(fri,'08:00','Quinn Bautista', 31,'+63 912 111 0022',1,'scheduled','General Consult');
  set(fri,'09:00','Rosa Villanueva',57,'+63 912 111 0023',2,'scheduled','Follow-up');
  set(fri,'10:30','Sam Aquino',     46,'+63 912 111 0024',3,'scheduled','Chronic Care');
  set(fri,'13:30','Tina Navarro',   35,'+63 912 111 0025',4,'scheduled','General Consult');
  return e;
};

const INIT_LEAVES = [
  {id:1,date:'2026-03-15',reason:'Medical Conference', status:'approved'},
  {id:2,date:'2026-03-16',reason:'Medical Conference', status:'approved'},
  {id:3,date:'2026-03-22',reason:'Personal Leave',     status:'pending' },
  {id:4,date:'2026-03-28',reason:'Family Emergency',   status:'pending' },
];

/* ═══════════════════════════════════════════════════
   BADGE / STYLE CONFIGS
═══════════════════════════════════════════════════ */
const DOC_STATUS = {
  available:{ label:'Available', bg:'bg-emerald-100', text:'text-emerald-700', dot:'bg-emerald-500' },
  on_leave: { label:'On Leave',  bg:'bg-red-100',     text:'text-red-600',     dot:'bg-red-500'     },
  off_duty: { label:'Off Duty',  bg:'bg-gray-100',    text:'text-gray-500',    dot:'bg-gray-400'    },
};
const APT_STATUS = {
  scheduled:{ label:'Scheduled', bg:'bg-blue-50',   text:'text-blue-700',   border:'border-blue-200'   },
  ongoing:  { label:'Ongoing',   bg:'bg-yellow-50', text:'text-yellow-700', border:'border-yellow-300' },
  completed:{ label:'Completed', bg:'bg-green-50',  text:'text-green-700',  border:'border-green-200'  },
  cancelled:{ label:'Cancelled', bg:'bg-red-50',    text:'text-red-600',    border:'border-red-200'    },
};
const LEAVE_STATUS = {
  approved:{ label:'Approved', bg:'bg-green-100',  text:'text-green-700'  },
  pending: { label:'Pending',  bg:'bg-yellow-100', text:'text-yellow-700' },
  rejected:{ label:'Rejected', bg:'bg-red-100',    text:'text-red-600'    },
};
const STATUS_MAP = {
  scheduled:{ label:'Scheduled', dotColor:'bg-blue-500',   textColor:'text-blue-700',   bgColor:'bg-blue-50'   },
  ongoing:  { label:'Ongoing',   dotColor:'bg-yellow-500', textColor:'text-yellow-700', bgColor:'bg-yellow-50' },
  completed:{ label:'Completed', dotColor:'bg-green-500',  textColor:'text-green-700',  bgColor:'bg-green-50'  },
  cancelled:{ label:'Cancelled', dotColor:'bg-red-400',    textColor:'text-red-600',    bgColor:'bg-red-50'    },
};
const SLOT_STYLE = {
  off:      'bg-gray-100 border-gray-100',
  break:    'bg-slate-100 border-slate-100',
  free:     'bg-emerald-50 border-emerald-100 hover:bg-emerald-100 cursor-pointer group',
  booked:   'bg-blue-100 border-blue-200 cursor-pointer hover:bg-blue-200',
  ongoing:  'bg-yellow-100 border-yellow-300 cursor-pointer',
  completed:'bg-green-100 border-green-200 cursor-pointer',
};

const slotType = (date,time,apts) => {
  if (!isWorkDay(date)) return 'off';
  if (isBreak(time))    return 'break';
  const k = aptKey(date,time);
  if (!apts[k])         return 'free';
  const s = apts[k].status;
  if (s==='completed')  return 'completed';
  if (s==='ongoing')    return 'ongoing';
  return 'booked';
};

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800";
const initials = (name) => name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
const AVATAR_POOL = [
  'bg-blue-100 text-blue-700','bg-teal-100 text-teal-700','bg-violet-100 text-violet-700',
  'bg-rose-100 text-rose-700','bg-amber-100 text-amber-700','bg-emerald-100 text-emerald-700',
];
const avatarCls = (name) => AVATAR_POOL[name.charCodeAt(0)%AVATAR_POOL.length];

const StatusPill = ({ status }) => {
  const s = STATUS_MAP[status] || STATUS_MAP.scheduled;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${s.bgColor} ${s.textColor}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dotColor} ${status==='ongoing'?'animate-pulse':''}`}/>
      {s.label}
    </span>
  );
};

const TypeTag = ({ type }) => {
  const map = { Regular:'bg-slate-100 text-slate-600', Chronic:'bg-amber-100 text-amber-700', VIP:'bg-violet-100 text-violet-700' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${map[type]||map.Regular}`}>{type}</span>;
};

/* ═══════════════════════════════════════════════════
   MODALS
═══════════════════════════════════════════════════ */
function AptModal({apt, onClose}) {
  if (!apt) return null;
  const s = APT_STATUS[apt.status] || APT_STATUS.scheduled;
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${s.bg} ${s.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${apt.status==='ongoing'?'bg-yellow-500 animate-pulse':'bg-current opacity-60'}`}/>
            {s.label}
          </span>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4 text-gray-400"/></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black flex-shrink-0 ${avatarCls(apt.patient)}`}>
              {initials(apt.patient)}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-base">{apt.patient}</p>
              <p className="text-xs text-gray-400">{apt.age} y/o · {apt.type}</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
            {[[Clock,'Time',fmtTime(apt.slotTime)],[Calendar,'Date',apt.slotDate],[Phone,'Contact',apt.contact],['#','Queue',`Queue #${apt.queue}`]].map(([Icon,label,val])=>(
              <div key={label} className="flex items-center gap-2.5 text-sm">
                <div className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                  {typeof Icon==='string'?<span className="text-[10px] font-black text-gray-400">{Icon}</span>:<Icon className="w-3.5 h-3.5 text-gray-400"/>}
                </div>
                <span className="text-gray-400 text-xs font-semibold w-14">{label}</span>
                {label==='Contact'
                  ?<a href={`tel:${val}`} className="text-blue-500 hover:text-blue-700 font-semibold text-xs">{val}</a>
                  :<span className="font-semibold text-gray-800 text-xs">{val}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LeaveModal({onClose, onSave}) {
  const [date,setDate]=useState('');
  const [reason,setReason]=useState('');
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Add Leave Request</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4 text-gray-400"/></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block">Date <span className="text-red-500">*</span></label>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} className={inputCls}/>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block">Reason</label>
            <textarea value={reason} onChange={e=>setReason(e.target.value)} rows={3} placeholder="Optional reason..." className={`${inputCls} resize-none`}/>
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" disabled={!date} onClick={()=>{onSave(date,reason);onClose();}}>
            <Check className="w-4 h-4 mr-1.5"/> Submit
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */
export default function DoctorSchedulePage() {
  const [weekOffset,   setWeekOffset]   = useState(0);
  const [viewMode,     setViewMode]     = useState('weekly');
  const [selDay,       setSelDay]       = useState(new Date());
  const [calendarApts, setCalendarApts] = useState(buildDemoApts);
  const [todayApts,    setTodayApts]    = useState(INIT_APPOINTMENTS);
  const [leaves,       setLeaves]       = useState(INIT_LEAVES);
  const [docStatus,    setDocStatus]    = useState('available');
  const [popup,        setPopup]        = useState(null);
  const [showLeave,    setShowLeave]    = useState(false);
  const [showEdit,     setShowEdit]     = useState(false);
  const [statusOpen,   setStatusOpen]   = useState(false);
  const [scheduleTab,  setScheduleTab]  = useState('today');
  const [search,       setSearch]       = useState('');
  const { toast } = useToast();

  const weekDates = getWeekDates(weekOffset);
  const weekLabel = `${fmtDateShort(weekDates[0])} - ${fmtDateShort(weekDates[6])}, ${weekDates[6].getFullYear()}`;
  const statusCfg = DOC_STATUS[docStatus];

  const todayTotal = todayApts.length;
  const completedN = todayApts.filter(a=>a.status==='completed').length;
  const ongoingApt = todayApts.find(a=>a.status==='ongoing');

  const visibleToday = useMemo(()=>
    search ? todayApts.filter(a=>a.patient.toLowerCase().includes(search.toLowerCase())) : todayApts,
  [todayApts,search]);

  const startConsult = (id) => {
    setTodayApts(prev=>prev.map(a=>{
      if (a.id===id) return {...a,status:'ongoing'};
      if (a.status==='ongoing') return {...a,status:'completed'};
      return a;
    }));
    const apt=todayApts.find(a=>a.id===id);
    toast({title:'Consultation started',description:`Now seeing ${apt?.patient}`});
  };

  const completeConsult = (id) => {
    setTodayApts(prev=>prev.map(a=>a.id===id?{...a,status:'completed'}:a));
    const apt=todayApts.find(a=>a.id===id);
    toast({title:'Consultation complete',description:`${apt?.patient} marked as done`});
  };

  const openSlot = (date,time) => {
    const k=aptKey(date,time);
    if (calendarApts[k]) setPopup({...calendarApts[k],slotTime:time,slotDate:fmtD(date)});
  };

  const addLeave = (date,reason) => {
    setLeaves(p=>[...p,{id:Date.now(),date,reason,status:'pending'}]);
    toast({title:'Leave request submitted',description:`${date} is pending approval.`});
  };
  const delLeave = (id) => { setLeaves(p=>p.filter(l=>l.id!==id)); toast({title:'Leave request cancelled'}); };

  /* ─── WEEKLY GRID ─── */
  const WeeklyGrid = () => (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
        <div>
          <p className="text-sm font-bold text-gray-900">Weekly Calendar</p>
          <p className="text-xs text-gray-400 mt-0.5">{weekLabel}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="hidden lg:flex items-center gap-3 mr-2">
            {[{c:'bg-emerald-200',l:'Free'},{c:'bg-blue-300',l:'Booked'},{c:'bg-yellow-300',l:'Ongoing'},{c:'bg-green-300',l:'Done'},{c:'bg-gray-200',l:'Off'}].map(x=>(
              <span key={x.l} className="flex items-center gap-1 text-xs text-gray-400">
                <span className={`w-2.5 h-2.5 rounded ${x.c}`}/>{x.l}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={()=>setWeekOffset(w=>w-1)} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
              <ChevronLeft className="w-4 h-4 text-gray-500"/>
            </button>
            <button onClick={()=>setWeekOffset(0)} className="px-3 h-8 text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Today</button>
            <button onClick={()=>setWeekOffset(w=>w+1)} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
              <ChevronRight className="w-4 h-4 text-gray-500"/>
            </button>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{minWidth:680}}>
          <thead>
            <tr>
              <th className="w-14 bg-gray-50 border-b border-gray-100"/>
              {weekDates.map((d,i)=>{
                const today=isToday(d); const work=isWorkDay(d);
                return (
                  <th key={i} className={`border-b border-gray-100 py-3 px-1 text-center min-w-[88px] ${today?'bg-blue-50':'bg-gray-50'}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${today?'text-blue-500':work?'text-gray-400':'text-gray-300'}`}>{DAYS_SHORT[d.getDay()]}</p>
                    <p className={`text-lg font-black mt-0.5 leading-none ${today?'text-blue-600':work?'text-gray-800':'text-gray-300'}`}>{d.getDate()}</p>
                    {today&&<div className="w-1.5 h-1.5 bg-blue-500 rounded-full mx-auto mt-1"/>}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map((time,ti)=>(
              <tr key={time} className={ti%2===0?'':'bg-gray-50/20'}>
                <td className="py-0.5 pr-2 text-right align-middle">
                  {time.endsWith(':00')&&<span className="text-[10px] font-bold text-gray-300 whitespace-nowrap pl-2">{fmtTime(time)}</span>}
                </td>
                {weekDates.map((date,di)=>{
                  const type=slotType(date,time,calendarApts);
                  const k=aptKey(date,time);
                  const apt=calendarApts[k];
                  const today=isToday(date);
                  return (
                    <td key={di} className={`py-0.5 px-0.5 border-l border-gray-100/80 ${today?'bg-blue-50/20':''}`}
                      onClick={()=>type!=='off'&&type!=='break'&&openSlot(date,time)}>
                      <div className={`h-6 rounded border text-[10px] font-bold flex items-center px-1.5 transition-all select-none ${SLOT_STYLE[type]}`}>
                        {apt&&<span className="truncate leading-none">{apt.patient.split(' ')[0]}</span>}
                        {type==='break'&&<span className="text-slate-400 font-semibold truncate">Break</span>}
                        {type==='free'&&<span className="text-emerald-300 opacity-0 group-hover:opacity-100 transition-opacity">+</span>}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ─── DAILY VIEW ─── */
  const DailyView = () => (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
        <div>
          <p className="text-sm font-bold text-gray-900">Daily View</p>
          <p className="text-xs text-gray-400 mt-0.5">{fmtDateFull(selDay)}</p>
        </div>
        <div className="flex gap-1">
          {weekDates.map((d,i)=>{
            const today=isToday(d); const work=isWorkDay(d); const sel=fmtD(d)===fmtD(selDay);
            return (
              <button key={i} onClick={()=>setSelDay(d)}
                className={`flex flex-col items-center px-3 py-2 rounded-xl text-xs transition-all
                  ${sel?'bg-blue-600 text-white shadow-sm shadow-blue-200':today?'bg-blue-50 text-blue-600 border border-blue-200':work?'text-gray-600 hover:bg-gray-100 border border-transparent':'text-gray-300 cursor-default'}`}>
                <span className="font-bold">{DAYS_SHORT[d.getDay()]}</span>
                <span className={`font-black text-sm leading-none mt-0.5 ${sel?'text-white':''}`}>{d.getDate()}</span>
              </button>
            );
          })}
        </div>
      </div>
      {!isWorkDay(selDay) ? (
        <div className="text-center py-14">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <XCircle className="w-7 h-7 text-gray-300"/>
          </div>
          <p className="font-bold text-gray-400">Off Duty</p>
          <p className="text-xs text-gray-300 mt-1">{DAYS_FULL[selDay.getDay()]} is not a working day</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {TIME_SLOTS.map(time=>{
            const k=aptKey(selDay,time); const apt=calendarApts[k]; const brk=isBreak(time); const showLabel=time.endsWith(':00');
            return (
              <div key={time} className="flex items-stretch gap-3 min-h-[40px]">
                <div className="w-16 flex-shrink-0 flex items-center justify-end">
                  {showLabel&&<span className="text-xs font-bold text-gray-300">{fmtTime(time)}</span>}
                </div>
                {brk ? (
                  <div className="flex-1 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center px-4 gap-2">
                    <Coffee className="w-3.5 h-3.5 text-slate-400"/>
                    <span className="text-xs text-slate-400 font-semibold">Lunch Break - {fmtTime(WORK_CFG.breakStart)} to {fmtTime(WORK_CFG.breakEnd)}</span>
                  </div>
                ) : apt ? (
                  <div onClick={()=>setPopup({...apt,slotTime:time,slotDate:fmtD(selDay)})}
                    className={`flex-1 h-14 rounded-xl border flex items-center px-4 gap-3 cursor-pointer hover:shadow-sm transition-all ${APT_STATUS[apt.status]?.bg} ${APT_STATUS[apt.status]?.border}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${avatarCls(apt.patient)}`}>{initials(apt.patient)}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold truncate ${APT_STATUS[apt.status]?.text}`}>{apt.patient}</p>
                      <p className="text-xs text-gray-400 truncate">{apt.type} · Queue #{apt.queue} · {apt.age} y/o</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a href={`tel:${apt.contact}`} onClick={e=>e.stopPropagation()} className="hidden sm:flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700">
                        <Phone className="w-3 h-3"/>{apt.contact}
                      </a>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full bg-white/70 ${APT_STATUS[apt.status]?.text}`}>{APT_STATUS[apt.status]?.label}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 h-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center px-4 hover:bg-emerald-100 transition-colors cursor-pointer group">
                    <span className="text-xs text-emerald-400 font-semibold group-hover:text-emerald-600 transition-colors">Free slot</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  /* ─── MONTHLY VIEW ─── */
  const MonthlyView = () => {
    const now=new Date(); const yr=now.getFullYear(); const mo=now.getMonth();
    const first=new Date(yr,mo,1); const last=new Date(yr,mo+1,0);
    const pad=(first.getDay()+6)%7;
    const cells=[];
    for(let i=0;i<pad;i++) cells.push(null);
    for(let d=1;d<=last.getDate();d++) cells.push(new Date(yr,mo,d));
    const countByDate={};
    Object.keys(calendarApts).forEach(k=>{ const ds=k.split('_')[0]; countByDate[ds]=(countByDate[ds]||0)+1; });
    return (
      <div>
        <p className="text-sm font-bold text-gray-900 mb-3">{MONTHS[mo]} {yr}</p>
        <div className="grid grid-cols-7 mb-2">
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>(
            <div key={d} className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider py-2">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((d,i)=>{
            if(!d) return <div key={`p${i}`}/>;
            const ds=fmtD(d); const cnt=countByDate[ds]||0; const today=isToday(d); const work=isWorkDay(d);
            const leave=leaves.some(l=>l.date===ds&&l.status==='approved');
            return (
              <button key={ds} onClick={()=>{setSelDay(d);setViewMode('daily');}}
                className={`rounded-xl p-2 min-h-[58px] border flex flex-col items-start transition-all
                  ${today?'bg-blue-600 border-blue-600 shadow-md shadow-blue-200 text-white':leave?'bg-red-50 border-red-200 hover:bg-red-100':!work?'bg-gray-50 border-gray-100':cnt>0?'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm':'bg-white border-gray-100 hover:bg-emerald-50 hover:border-emerald-200'}`}>
                <span className={`text-sm font-black ${today?'text-white':!work?'text-gray-300':'text-gray-800'}`}>{d.getDate()}</span>
                <div className="mt-auto">
                  {leave&&<span className={`text-[9px] font-bold ${today?'text-blue-200':'text-red-500'}`}>Leave</span>}
                  {cnt>0&&!leave&&<span className={`text-[9px] font-bold ${today?'text-blue-200':'text-blue-600'}`}>{cnt} apt{cnt>1?'s':''}</span>}
                  {!cnt&&!leave&&work&&!today&&<span className="text-[9px] text-emerald-400 font-semibold">Free</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  /* ─── TODAY'S SCHEDULE TABLE ─── */
  const TodayScheduleTable = () => (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="font-bold text-gray-800">{todayTotal}</span> total
          </div>
          <div className="flex items-center gap-1.5 text-xs text-green-600">
            <CheckCircle2 className="w-3.5 h-3.5"/>
            <span className="font-bold">{completedN}</span> done
          </div>
          {ongoingApt&&(
            <div className="flex items-center gap-1.5 text-xs text-yellow-600">
              <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"/>
              <span className="font-semibold">{ongoingApt.patient.split(' ')[0]} (ongoing)</span>
            </div>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search patient..."
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-52 placeholder:text-gray-400"/>
        </div>
      </div>
      <div className="flex items-center gap-4 mb-3 flex-wrap">
        {Object.entries(STATUS_MAP).map(([k,v])=>(
          <span key={k} className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className={`w-2 h-2 rounded-full ${v.dotColor}`}/>{v.label}
          </span>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-gray-100 bg-gray-50/80">
              {['#','Time','Patient','Age','Contact','Status','Action'].map(h=>(
                <th key={h} className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap first:pl-2 last:pr-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleToday.length===0&&(
              <tr><td colSpan={8} className="text-center py-14 text-sm text-gray-400">
                <Search className="w-8 h-8 mx-auto text-gray-200 mb-2"/>No patients found.
              </td></tr>
            )}
            {visibleToday.map(apt=>{
              const isOngoing=apt.status==='ongoing'; const isCompleted=apt.status==='completed'; const isScheduled=apt.status==='scheduled';
              return (
                <tr key={apt.id} className={`border-b border-gray-50 transition-colors last:border-0 ${isOngoing?'bg-yellow-50/70 hover:bg-yellow-50':''} ${isCompleted?'opacity-50 hover:opacity-70 hover:bg-gray-50':''} ${isScheduled?'hover:bg-blue-50/30':''}`}>
                  <td className="py-3.5 px-4 pl-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${isOngoing?'bg-yellow-500 text-white shadow-sm shadow-yellow-300':''} ${isCompleted?'bg-gray-100 text-gray-400':''} ${isScheduled?'bg-blue-50 text-blue-600':''}`}>{apt.queue}</div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <p className="font-bold text-gray-800 text-xs">{fmtTime(apt.time)}</p>
                    <p className="text-gray-400 text-xs">{fmtTime(apt.end)}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${avatarCls(apt.patient)}`}>{initials(apt.patient)}</div>
                      <div>
                        <p className="font-semibold text-gray-900">{apt.patient}</p>
                        {apt.diagnosis?<p className="text-xs text-gray-400 line-clamp-1">{apt.diagnosis}</p>:<p className="text-xs text-gray-300 italic">No prior notes</p>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-sm text-gray-500 whitespace-nowrap">{apt.age} y/o</td>
                  <td className="py-3.5 px-4">
                    <a href={`tel:${apt.contact}`} className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-700 transition-colors whitespace-nowrap">
                      <Phone className="w-3.5 h-3.5"/>{apt.contact}
                    </a>
                  </td>
                  
                  <td className="py-3.5 px-4"><StatusPill status={apt.status}/></td>
                  <td className="py-3.5 px-4 pr-2">
                    {isScheduled&&<Button size="sm" onClick={()=>startConsult(apt.id)} className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-sm"><PlayCircle className="w-3.5 h-3.5"/> Start</Button>}
                    {isOngoing&&<Button size="sm" onClick={()=>completeConsult(apt.id)} className="h-8 px-3 text-xs bg-green-600 hover:bg-green-700 text-white gap-1.5 shadow-sm animate-pulse"><CheckSquare className="w-3.5 h-3.5"/> Done</Button>}
                    {isCompleted&&<span className="inline-flex items-center gap-1.5 text-xs text-green-500 font-semibold"><CheckCircle2 className="w-3.5 h-3.5"/> Seen</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ═══════════════════════════════
     RENDER
  ═══════════════════════════════ */
  return (
    <MainLayout title="My Schedule" subtitle="View your weekly schedule, appointments and leave requests">
      <div className="space-y-5">

        {/* ── SCHEDULE HEADER ── */}
        <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 text-white overflow-hidden">
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none"/>
          <div className="absolute bottom-0 right-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none"/>
          <div className="relative flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/20 flex items-center justify-center text-xl font-black backdrop-blur-sm">SS</div>
              <div>
                <h2 className="text-xl font-black">{DOCTOR.name}</h2>
                <p className="text-blue-200 text-sm flex items-center gap-1.5 mt-0.5">
                  <Stethoscope className="w-3.5 h-3.5"/>{DOCTOR.specialty}
                  <span className="text-blue-300">·</span>
                  <span className="text-blue-300 text-xs">{DOCTOR.license}</span>
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <CalendarRange className="w-3.5 h-3.5 text-blue-300"/>
                  <span className="text-blue-100 text-sm font-semibold">{weekLabel}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="relative">
                <button onClick={()=>setStatusOpen(s=>!s)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 border border-white/20 hover:bg-white/25 transition-all text-sm font-bold backdrop-blur-sm">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${docStatus==='available'?'bg-emerald-400 animate-pulse':docStatus==='on_leave'?'bg-red-400':'bg-gray-400'}`}/>
                  {statusCfg.label}
                  <ChevronDown className={`w-3.5 h-3.5 opacity-70 transition-transform ${statusOpen?'rotate-180':''}`}/>
                </button>
                {statusOpen&&(
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-2xl border border-gray-100 py-1 w-44 z-20">
                    {Object.entries(DOC_STATUS).map(([k,v])=>(
                      <button key={k} onClick={()=>{setDocStatus(k);setStatusOpen(false);}}
                        className={`w-full text-left px-4 py-2.5 text-xs font-bold flex items-center gap-2.5 hover:bg-gray-50 transition-colors ${docStatus===k?v.text:'text-gray-600'}`}>
                        <span className={`w-2 h-2 rounded-full ${v.dot}`}/>{v.label}
                        {docStatus===k&&<Check className="w-3 h-3 ml-auto"/>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── TABBED SCHEDULE PANEL ── */}
        <Card className="border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 pt-5 pb-0 border-b border-gray-100">
            <div className="flex gap-0">
              <button onClick={()=>setScheduleTab('today')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all -mb-px ${scheduleTab==='today'?'border-blue-600 text-blue-600':'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'}`}>
                <ClipboardList className="w-4 h-4"/>
                Today's Schedule
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${scheduleTab==='today'?'bg-blue-100 text-blue-700':'bg-gray-100 text-gray-500'}`}>{todayTotal}</span>
              </button>
              <button onClick={()=>setScheduleTab('calendar')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all -mb-px ${scheduleTab==='calendar'?'border-blue-600 text-blue-600':'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'}`}>
                <CalendarRange className="w-4 h-4"/>
                Appointment Calendar
              </button>
            </div>
            {scheduleTab==='calendar'&&(
              <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-1">
                {[{key:'weekly',label:'Week',Icon:CalendarRange},{key:'daily',label:'Day',Icon:CalendarDays},{key:'monthly',label:'Month',Icon:LayoutGrid}].map(v=>{
                  const Icon=v.Icon;
                  return (
                    <button key={v.key} onClick={()=>setViewMode(v.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode===v.key?'bg-white text-blue-700 shadow-sm':'text-gray-500 hover:text-gray-700'}`}>
                      <Icon className="w-3.5 h-3.5"/>{v.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <CardContent className="p-5">
            {scheduleTab==='today'&&<TodayScheduleTable/>}
            {scheduleTab==='calendar'&&(
              <>
                {viewMode==='weekly'  &&<WeeklyGrid/>}
                {viewMode==='daily'   &&<DailyView/>}
                {viewMode==='monthly' &&<MonthlyView/>}
              </>
            )}
          </CardContent>
        </Card>

        {/* ── BOTTOM ROW: Leave Requests + Recent Consultations ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

 

          {/* Recent Consultations — 2 cols */}
          <Card className="lg:col-span-2 border border-gray-100 shadow-sm flex flex-col">
            <CardHeader className="pb-3 pt-5 px-5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600"/>
                    Recent Consultations
                  </CardTitle>
                  <p className="text-xs text-gray-400 mt-0.5">Last 5 completed</p>
                </div>
                <button className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 transition-colors">
                  View all <ChevronRight className="w-3.5 h-3.5"/>
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <div className="divide-y divide-gray-50">
                {RECENT_CONSULTS.map(c=>(
                  <div key={c.id} className="px-5 py-3.5 hover:bg-gray-50/70 transition-colors cursor-pointer group">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${avatarColor(c.patient)}`}>
                        {initials(c.patient)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-gray-900 text-sm truncate">{c.patient}</p>
                          <span className="text-xs text-gray-400 flex-shrink-0">{c.date}</span>
                        </div>
                        <p className="text-xs font-semibold text-blue-600 mt-0.5">{c.diagnosis}</p>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{c.notes}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

      {/* ═══ MODALS ═══ */}
      {showLeave&&<LeaveModal     onClose={()=>setShowLeave(false)} onSave={addLeave}/>}
      {showEdit &&<EditHoursModal onClose={()=>setShowEdit(false)}/>}
      {popup    &&<AptModal apt={popup} onClose={()=>setPopup(null)}/>}
      {statusOpen&&<div className="fixed inset-0 z-10" onClick={()=>setStatusOpen(false)}/>}
    </MainLayout>
  );
}