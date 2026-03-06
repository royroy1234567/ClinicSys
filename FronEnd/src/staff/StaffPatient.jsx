import React, { useState } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Users, Search, Eye, User,
  Phone, MapPin, X, Check, Shield, AlertCircle,
  Hash, RefreshCw, Contact, Mail, Cake,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════
   DEMO PATIENTS  (no medical data exposed)
═══════════════════════════════════════════════════ */
const PATIENTS = [
  { id:'PT-00001', name:'Robert Johnson',    gender:'Male',   age:58, dob:'April 12, 1966',     contact:'+63 912 111 0003', email:'r.johnson@email.com',   address:'78 Luna Rd., Pasig City',              status:'active'   },
  { id:'PT-00002', name:'Maria Santos',      gender:'Female', age:34, dob:'July 22, 1991',      contact:'+63 917 222 0004', email:'m.santos@email.com',    address:'12 Rizal Ave., Quezon City',           status:'active'   },
  { id:'PT-00003', name:'Carlos Reyes',      gender:'Male',   age:45, dob:'November 3, 1980',   contact:'+63 919 333 0005', email:'c.reyes@email.com',     address:'33 Bonifacio St., Marikina City',      status:'active'   },
  { id:'PT-00004', name:'Ana Cruz',          gender:'Female', age:29, dob:'February 18, 1997',  contact:'+63 915 444 0006', email:'a.cruz@email.com',      address:'5 Del Pilar St., Caloocan City',       status:'active'   },
  { id:'PT-00005', name:'Ben Torres',        gender:'Male',   age:52, dob:'September 7, 1973',  contact:'+63 916 555 0007', email:'b.torres@email.com',    address:'90 Aguinaldo Ave., Las Piñas City',    status:'active'   },
  { id:'PT-00006', name:'Elena Ramos',       gender:'Female', age:41, dob:'December 25, 1984',  contact:'+63 918 666 0008', email:'e.ramos@email.com',     address:'67 Mabini St., Mandaluyong City',      status:'active'   },
  { id:'PT-00007', name:'Felix Tan',         gender:'Male',   age:67, dob:'March 3, 1959',      contact:'+63 920 777 0009', email:'f.tan@email.com',       address:'14 Quirino Ave., Manila',              status:'inactive' },
  { id:'PT-00008', name:'Grace Ong',         gender:'Female', age:38, dob:'August 14, 1987',    contact:'+63 921 888 0010', email:'g.ong@email.com',       address:'21 Shaw Blvd., Mandaluyong City',      status:'active'   },
  { id:'PT-00009', name:'Henry Sy',          gender:'Male',   age:55, dob:'June 30, 1970',      contact:'+63 922 999 0011', email:'h.sy@email.com',        address:'8 F. Blumentritt St., San Juan City',  status:'active'   },
  { id:'PT-00010', name:'Isabel Diaz',       gender:'Female', age:33, dob:'January 5, 1993',    contact:'+63 923 111 0012', email:'i.diaz@email.com',      address:'55 Katipunan Ave., Quezon City',       status:'active'   },
  { id:'PT-00011', name:'Jake Lim',          gender:'Male',   age:48, dob:'October 19, 1977',   contact:'+63 924 222 0013', email:'j.lim@email.com',       address:'3 Taft Ave., Ermita, Manila',          status:'active'   },
  { id:'PT-00012', name:'Karen Santos',      gender:'Female', age:25, dob:'May 8, 2001',        contact:'+63 925 333 0014', email:'k.santos@email.com',    address:'77 Commonwealth Ave., Quezon City',    status:'active'   },
];

/* ═══════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════ */
const AVATAR_POOL = [
  'bg-blue-100 text-blue-700','bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700','bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700','bg-teal-100 text-teal-700',
];
const avatarCls = (n) => AVATAR_POOL[n.charCodeAt(0) % AVATAR_POOL.length];
const initials  = (n) => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

const AGE_GROUPS = [
  { label:'All Ages',  min:0,   max:999 },
  { label:'Child (0–17)',  min:0,   max:17  },
  { label:'Adult (18–59)', min:18,  max:59  },
  { label:'Senior (60+)',  min:60,  max:999 },
];

/* ═══════════════════════════════════════════════════
   PROFILE MODAL  (basic info only — no medical data)
═══════════════════════════════════════════════════ */
function ProfileModal({ patient, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10 pointer-events-none"/>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black border-2 border-white/30 ${avatarCls(patient.name)}`}>
                {initials(patient.name)}
              </div>
              <div>
                <h3 className="text-lg font-black">{patient.name}</h3>
                <p className="text-blue-200 text-sm">{patient.id}</p>
                <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full mt-1
                  ${patient.status === 'active' ? 'bg-green-400/20 text-green-200 border border-green-300/30' : 'bg-gray-400/20 text-gray-300 border border-gray-400/30'}`}>
                  {patient.status === 'active' ? '● Active' : '● Inactive'}
                </span>
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all flex-shrink-0">
              <X className="w-4 h-4 text-white"/>
            </button>
          </div>
        </div>

        {/* Body — §4 Basic Info Only */}
        <div className="p-6 space-y-5">

          {/* Personal */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <User className="w-3 h-3"/> Personal Information
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                [User,    'Gender',    patient.gender                         ],
                [Cake,    'Birthdate', patient.dob                            ],
                [Hash,    'Age',       `${patient.age} years old`             ],
                [Shield,  'Patient ID',patient.id                             ],
              ].map(([Icon, label, value]) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="w-3 h-3 text-gray-400"/>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-800">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Contact className="w-3 h-3"/> Contact Information
            </p>
            <div className="space-y-2">
              {[
                [Phone,  'Contact Number', patient.contact ],
                [Mail,   'Email Address',  patient.email   ],
                [MapPin, 'Address',        patient.address ],
              ].map(([Icon, label, value]) => (
                <div key={label} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-gray-400"/>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
                    <p className="text-sm font-semibold text-gray-800">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Restricted notice */}
          <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
            <Shield className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5"/>
            <p>
              <strong>Access restricted.</strong> Medical history, diagnosis, and consultation records are visible to doctors only.
            </p>
          </div>

          {/* Close button */}
          <button onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-all">
            <X className="w-4 h-4"/> Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */
export default function StaffPatientsPage() {

  const [search,       setSearch]      = useState('');
  const [genderFilter, setGenderFilter]= useState('All');
  const [ageGroup,     setAgeGroup]    = useState(0);   // index into AGE_GROUPS
  const [viewPatient,  setViewPatient] = useState(null);
  const [page,         setPage]        = useState(1);
  const PER_PAGE = 8;

  /* Filter logic */
  const filtered = PATIENTS.filter(p => {
    const q = search.toLowerCase();
    const matchSearch =
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.contact.replace(/\s/g,'').includes(q.replace(/\s/g,''));
    const matchGender = genderFilter === 'All' || p.gender === genderFilter;
    const ag = AGE_GROUPS[ageGroup];
    const matchAge = p.age >= ag.min && p.age <= ag.max;
    return matchSearch && matchGender && matchAge;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleSearch = (v) => { setSearch(v); setPage(1); };
  const handleGender = (v) => { setGenderFilter(v); setPage(1); };
  const handleAge    = (i) => { setAgeGroup(i); setPage(1); };


  const activeCount   = PATIENTS.filter(p => p.status === 'active').length;
  const inactiveCount = PATIENTS.filter(p => p.status === 'inactive').length;

  return (
    <MainLayout title="Patients" subtitle="Search and select registered patients for appointments or queueing">
      <div className="space-y-5">

        {/* ══ §1 HEADER ══ */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-44 h-44 rounded-full bg-white/5 pointer-events-none"/>
          <div className="absolute bottom-0 right-32 w-28 h-28 rounded-full bg-white/5 pointer-events-none"/>
          <div className="relative flex items-start justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-black">Patients</h2>
              <p className="text-blue-200 text-sm mt-1 max-w-md">
                Search and select registered patients for appointments or queueing.
              </p>
            </div>
            {/* KPI strip */}
            <div className="flex items-center gap-5">
              {[
                { label:'Total Patients', value:PATIENTS.length  },
                { label:'Active',         value:activeCount       },
                { label:'Inactive',       value:inactiveCount     },
              ].map((s, i) => (
                <React.Fragment key={s.label}>
                  {i > 0 && <div className="w-px h-8 bg-white/20"/>}
                  <div className="text-right">
                    <p className="text-blue-300 text-[10px] font-bold uppercase tracking-wide">{s.label}</p>
                    <p className="text-2xl font-black">{s.value}</p>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Staff restriction banner */}
          <div className="relative flex items-center gap-2 mt-4 pt-4 border-t border-white/10 text-xs text-blue-200 font-semibold">
            <Shield className="w-3.5 h-3.5 text-blue-300 flex-shrink-0"/>
            Staff access: Patient identification and scheduling only. Medical records are restricted.
          </div>
        </div>

        {/* ══ §2 SEARCH & FILTERS ══ */}
        <Card className="border border-gray-100 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none"/>
                <input
                  value={search}
                  onChange={e => handleSearch(e.target.value)}
                  placeholder="Search by name, ID, or contact number..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 placeholder:text-gray-300 transition-all"
                />
                {search && (
                  <button onClick={() => handleSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-all">
                    <X className="w-3 h-3 text-gray-500"/>
                  </button>
                )}
              </div>

              {/* Gender filter */}
              <div className="flex gap-1.5">
                {['All','Male','Female'].map(g => (
                  <button key={g} onClick={() => handleGender(g)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all
                      ${genderFilter === g
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                    {g}
                  </button>
                ))}
              </div>

              {/* Age group filter */}
              <div className="flex gap-1.5">
                {AGE_GROUPS.map((ag, i) => (
                  <button key={ag.label} onClick={() => handleAge(i)}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap
                      ${ageGroup === i
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                    {ag.label}
                  </button>
                ))}
              </div>

              {/* Reset */}
              {(search || genderFilter !== 'All' || ageGroup !== 0) && (
                <button onClick={() => { setSearch(''); setGenderFilter('All'); setAgeGroup(0); setPage(1); }}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-gray-500 border border-gray-200 hover:bg-gray-50 transition-all">
                  <RefreshCw className="w-3.5 h-3.5"/> Reset
                </button>
              )}

              <div className="ml-auto text-xs text-gray-400 font-semibold whitespace-nowrap">
                {filtered.length} result{filtered.length !== 1 ? 's' : ''}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ══ §3 PATIENT LIST TABLE ══ */}
        <Card className="border border-gray-100 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Patient ID','Patient Name','Gender','Contact Number','Status','Actions'].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap first:pl-5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-16 text-center">
                        <Users className="w-10 h-10 text-gray-200 mx-auto mb-3"/>
                        <p className="text-sm text-gray-400 font-medium">No patients found</p>
                        <p className="text-xs text-gray-300 mt-1">Try adjusting your search or filters</p>
                      </td>
                    </tr>
                  )}
                  {paginated.map(p => (
                    <tr key={p.id}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">

                      {/* Patient ID */}
                      <td className="py-3.5 px-4 pl-5">
                        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{p.id}</span>
                      </td>

                      {/* Name + avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${avatarCls(p.name)}`}>
                            {initials(p.name)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{p.name}</p>
                            <p className="text-xs text-gray-400">{p.age} y/o</p>
                          </div>
                        </div>
                      </td>

                      {/* Gender */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold
                          ${p.gender === 'Male' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'}`}>
                          {p.gender}
                        </span>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                          <Phone className="w-3.5 h-3.5 text-gray-400"/>
                          <a href={`tel:${p.contact}`} className="hover:text-blue-600 transition-colors">{p.contact}</a>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold
                          ${p.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}/>
                          {p.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* §5 Actions */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {/* View Profile */}
                          <button onClick={() => setViewPatient(p)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all">
                            <Eye className="w-3.5 h-3.5"/> View Profile
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 font-semibold">
                  Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} patients
                </p>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-all text-xs font-bold">
                    ‹
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                    <button key={n} onClick={() => setPage(n)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all
                        ${page === n ? 'bg-blue-600 text-white shadow-sm' : 'border border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                      {n}
                    </button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-all text-xs font-bold">
                    ›
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Staff permissions reminder */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-100 rounded-2xl text-xs text-green-700">
            <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5"/>
            <div>
              <p className="font-bold text-green-800 mb-1">Staff Can</p>
              <p>Search patients · View basic patient profile only</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-xs text-red-700">
            <Shield className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5"/>
            <div>
              <p className="font-bold text-red-800 mb-1">Restricted Access</p>
              <p>Medical history · Diagnosis · Prescriptions · Consultation records · Patient deletion</p>
            </div>
          </div>
        </div>

      </div>

      {/* §4 Profile Modal */}
      {viewPatient && (
        <ProfileModal
          patient={viewPatient}
          onClose={() => setViewPatient(null)}
        />
      )}
    </MainLayout>
  );
}