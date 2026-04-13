import React, { useEffect, useMemo, useState } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { api } from '../services/Api';
import { MessageSquare, Search, RefreshCw, Star, AlertCircle, Mail, CheckCircle2, Clock3 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const fmtDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
};

const toFeedRow = (row) => {
  const services = Array.isArray(row?.payment_details?.items)
    ? [...new Set(row.payment_details.items.map((i) => i?.service_name).filter(Boolean))]
    : [];

  return {
    id: row.consultation_id,
    consultationNumber: row.consultation_number || null,
    patientName: row.patient_name || '—',
    doctorName: row.doctor_name || '—',
    patientEmail: row.patient?.email || '',
    services: services.length ? services : ['General Consultation'],
    rating: Number(row.session_rating || 0),
    feedback: row.session_feedback || '',
    ratedAt: row.session_rated_at || row.finalized_at || row.updated_at || null,
    responseStatus: row.feedback_response_status || 'pending',
  };
};

const RatingBadge = ({ rating }) => (
  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
    <Star className="w-3.5 h-3.5 fill-current" /> {rating.toFixed(1)}
  </span>
);

const ResponseStatusBadge = ({ status }) => {
  const responded = String(status || '').toLowerCase() === 'responded';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
      responded ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
    }`}>
      {responded ? 'Responded' : 'Pending'}
    </span>
  );
};

const StatCard = ({ label, value, icon, iconClass = 'text-blue-600 bg-blue-100' }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl ${iconClass}`}>
          {icon}
        </span>
      </div>
    </CardContent>
  </Card>
);

export default function ManagerFeedPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [replyingRow, setReplyingRow] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const { toast } = useToast();

  const fetchFeed = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.consultations.getAll({});
      const ratedRows = (Array.isArray(data) ? data : [])
        .filter((r) => Number(r?.session_rating || 0) > 0)
        .map(toFeedRow)
        .sort((a, b) => new Date(b.ratedAt || 0) - new Date(a.ratedAt || 0));
      setRows(ratedRows);
    } catch (err) {
      const message = err?.message || 'Failed to load patient service ratings.';
      setError(message);
      toast({ title: 'Unable to load feed', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFeed(); }, []);

  const counts = useMemo(() => {
    const pending = rows.filter((r) => r.responseStatus !== 'responded').length;
    const responded = rows.length - pending;
    return { pending, responded };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter === 'pending' && r.responseStatus === 'responded') return false;
      if (statusFilter === 'responded' && r.responseStatus !== 'responded') return false;
      if (!q) return true;
      return (
      r.patientName.toLowerCase().includes(q)
      || r.doctorName.toLowerCase().includes(q)
      || r.services.some((s) => s.toLowerCase().includes(q))
      || String(r.rating).includes(q)
      );
    });
  }, [rows, search, statusFilter]);

  const avgRating = rows.length
    ? rows.reduce((sum, r) => sum + r.rating, 0) / rows.length
    : 0;

  const openReply = (row) => {
    setReplyingRow(row);
    setReplyText('');
  };

  const closeReply = () => {
    setReplyingRow(null);
    setReplyText('');
  };

  const submitReply = async () => {
    if (!replyingRow) return;
    const message = replyText.trim();
    if (message.length < 5) {
      toast({ title: 'Response too short', description: 'Please enter at least 5 characters.', variant: 'destructive' });
      return;
    }
    try {
      setSendingReply(true);
      await api.consultations.respondFeedback(replyingRow.id, { message });
      setRows((prev) => prev.map((r) => (
        r.id === replyingRow.id ? { ...r, responseStatus: 'responded' } : r
      )));
      toast({ title: 'Response sent', description: `Email sent to ${replyingRow.patientName}.` });
      closeReply();
    } catch (err) {
      toast({ title: 'Failed to send response', description: err?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <MainLayout title="Patient Ratings Feed" subtitle="All patient-rated services in one feed">
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <StatCard label="Total Ratings" value={rows.length} icon={<MessageSquare className="w-4 h-4" />} />
          <StatCard label="Average Rating" value={avgRating ? avgRating.toFixed(1) : '0.0'} icon={<Star className="w-4 h-4 fill-current" />} iconClass="text-amber-600 bg-amber-100" />
          <StatCard label="Pending Reply" value={counts.pending} icon={<Clock3 className="w-4 h-4" />} iconClass="text-orange-600 bg-orange-100" />
          <StatCard label="Responded" value={counts.responded} icon={<CheckCircle2 className="w-4 h-4" />} iconClass="text-green-600 bg-green-100" />
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" /> Service Feedback Feed
              </CardTitle>
              <Button variant="outline" size="sm" onClick={fetchFeed} disabled={loading}>
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="relative w-full md:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                  placeholder="Search patient, doctor, service..."
                />
              </div>
              <div className="inline-flex items-center rounded-lg border border-gray-200 p-1 bg-gray-50">
                {[
                  { key: 'all', label: `All (${rows.length})` },
                  { key: 'pending', label: `Pending (${counts.pending})` },
                  { key: 'responded', label: `Responded (${counts.responded})` },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setStatusFilter(item.key)}
                    className={`px-3 py-1.5 text-xs rounded-md font-semibold transition-colors ${
                      statusFilter === item.key
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Consultation #', 'Patient & Service', 'Rating', 'Feedback', 'Status', 'Rated On', 'Actions'].map((h) => (
                      <th key={h} className="text-left py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading && Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} className="py-3 px-4">
                          <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                        </td>
                      ))}
                    </tr>
                  ))}
                  {error && !loading && (
                    <tr>
                      <td colSpan={7} className="text-center py-14">
                        <AlertCircle className="w-8 h-8 mx-auto text-red-300 mb-2" />
                        <p className="text-sm text-red-400 font-medium">{error}</p>
                      </td>
                    </tr>
                  )}
                  {!loading && !error && filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-14 text-sm text-gray-400">
                        No patient service ratings found.
                      </td>
                    </tr>
                  )}
                  {!loading && !error && filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-gray-500">{r.consultationNumber || `CON-${r.id}`}</td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-800">{r.patientName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{r.services.join(', ')} · Dr. {r.doctorName}</p>
                      </td>
                      <td className="py-3 px-4"><RatingBadge rating={r.rating} /></td>
                      <td className="py-3 px-4 text-gray-600 max-w-md">
                        {r.feedback ? (
                          <span title={r.feedback}>
                            {r.feedback.length > 120 ? `${r.feedback.slice(0, 120)}...` : r.feedback}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-4"><ResponseStatusBadge status={r.responseStatus} /></td>
                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap">{fmtDate(r.ratedAt)}</td>
                      <td className="py-3 px-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openReply(r)}
                          disabled={!r.patientEmail || r.responseStatus === 'responded'}
                          className="text-xs gap-1.5"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          {r.responseStatus === 'responded' ? 'Responded' : 'Reply'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {replyingRow && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeReply}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Reply to Patient Feedback</h3>
              <p className="text-xs text-gray-500 mt-1">
                To: {replyingRow.patientName} {replyingRow.patientEmail ? `(${replyingRow.patientEmail})` : ''}
              </p>
            </div>
            <div className="px-6 py-4 space-y-3">
              <p className="text-xs text-gray-500">
                About: {replyingRow.services.join(', ')} · Rated {replyingRow.rating.toFixed(1)}
              </p>
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={6}
                placeholder="Type your response to the patient..."
              />
            </div>
            <div className="px-6 pb-6 flex justify-end gap-2">
              <Button variant="outline" onClick={closeReply} disabled={sendingReply}>Cancel</Button>
              <Button onClick={submitReply} disabled={sendingReply || !replyingRow.patientEmail}>
                {sendingReply ? 'Sending...' : 'Send Email Response'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
