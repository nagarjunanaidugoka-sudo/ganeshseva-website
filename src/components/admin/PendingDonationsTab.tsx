import { useState, useMemo } from 'react';
import {
  CheckCircle2, XCircle, Clock, Eye, X, Loader2, HandCoins,
  Phone, Calendar, Hash, Image as ImageIcon, Filter, Search,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/lib/store';
import { useData } from '@/lib/data-context';
import type { Donation } from '@/lib/types';
import { formatINR, formatDate } from '@/lib/format';
import { Card, Badge, Modal, EmptyState, SectionHeading } from '@/components/ui';

type ApprovalFilter = 'pending' | 'approved' | 'rejected' | 'all';

type Toast = { id: number; type: 'success' | 'error'; msg: string };

export function PendingDonationsTab() {
  const { session } = useApp();
  const { donations, refresh, logAudit } = useData();
  const [filter, setFilter] = useState<ApprovalFilter>('pending');
  const [query, setQuery] = useState('');
  const [previewing, setPreviewing] = useState<Donation | null>(null);
  const [rejecting, setRejecting] = useState<Donation | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [acting, setActing] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  function pushToast(type: Toast['type'], msg: string) {
    const id = Date.now() + Math.random();
    setToasts((ts) => [...ts, { id, type, msg }]);
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 4000);
  }

  const filtered = useMemo(() => {
    return donations
      .filter((d) => filter === 'all' ? true : d.approval_status === filter)
      .filter((d) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
          d.donor_name.toLowerCase().includes(q) ||
          (d.phone ?? '').toLowerCase().includes(q) ||
          (d.transaction_id ?? '').toLowerCase().includes(q) ||
          d.receipt_no.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        // Pending first, then newest
        if (a.approval_status === 'pending' && b.approval_status !== 'pending') return -1;
        if (a.approval_status !== 'pending' && b.approval_status === 'pending') return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [donations, filter, query]);

  const counts = useMemo(() => ({
    pending: donations.filter((d) => d.approval_status === 'pending').length,
    approved: donations.filter((d) => d.approval_status === 'approved').length,
    rejected: donations.filter((d) => d.approval_status === 'rejected').length,
    all: donations.length,
  }), [donations]);

  async function handleApprove(d: Donation) {
    setActing(true);
    try {
      const { error } = await supabase.rpc('approve_donation', { p_donation_id: d.id });
      if (error) throw error;
      await logAudit('donations', d.id, 'update', { action: 'approve', old_status: d.approval_status });
      pushToast('success', `Approved ${formatINR(d.amount)} from ${d.donor_name}`);
      refresh();
    } catch {
      pushToast('error', 'Failed to approve donation. Please try again.');
    } finally {
      setActing(false);
    }
  }

  async function handleReject() {
    if (!rejecting) return;
    setActing(true);
    try {
      const { error } = await supabase.rpc('reject_donation', {
        p_donation_id: rejecting.id,
        p_reason: rejectReason.trim() || null,
      });
      if (error) throw error;
      await logAudit('donations', rejecting.id, 'update', { action: 'reject', old_status: rejecting.approval_status, reason: rejectReason });
      pushToast('success', `Rejected submission from ${rejecting.donor_name}`);
      setRejecting(null);
      setRejectReason('');
      refresh();
    } catch {
      pushToast('error', 'Failed to reject donation. Please try again.');
    } finally {
      setActing(false);
    }
  }

  const filterTabs: { id: ApprovalFilter; label: string; count: number }[] = [
    { id: 'pending', label: 'Pending', count: counts.pending },
    { id: 'approved', label: 'Approved', count: counts.approved },
    { id: 'rejected', label: 'Rejected', count: counts.rejected },
    { id: 'all', label: 'All', count: counts.all },
  ];

  return (
    <div className="space-y-5">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[60] space-y-2">
        {toasts.map((tst) => (
          <div
            key={tst.id}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg animate-fade-in-scale max-w-sm ${
              tst.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/80 text-green-800 dark:text-green-100 border border-green-200 dark:border-green-700'
                : 'bg-red-50 dark:bg-red-900/80 text-red-800 dark:text-red-100 border border-red-200 dark:border-red-700'
            }`}
          >
            {tst.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
            <span className="text-sm font-medium">{tst.msg}</span>
            <button onClick={() => setToasts((ts) => ts.filter((t) => t.id !== tst.id))} className="ml-auto shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <SectionHeading
        title="Pending Donations"
        subtitle="Review and approve donor-submitted payment details"
      />

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-saffron-50 dark:bg-maroon-900/60 rounded-2xl border border-saffron-100 dark:border-maroon-800">
        {filterTabs.map((ft) => (
          <button
            key={ft.id}
            onClick={() => setFilter(ft.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              filter === ft.id
                ? 'bg-white dark:bg-maroon-800 text-maroon-800 dark:text-gold-200 shadow-sm'
                : 'text-maroon-500 dark:text-cream/60 hover:text-maroon-700 dark:hover:text-cream'
            }`}
          >
            {ft.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              ft.id === 'pending' && ft.count > 0
                ? 'bg-saffron-500 text-white'
                : 'bg-saffron-100 dark:bg-maroon-700 text-maroon-600 dark:text-cream/70'
            }`}>
              {ft.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <Card>
        <div className="flex items-center gap-2 px-3 h-11 rounded-xl bg-white/60 dark:bg-maroon-900/60 border border-saffron-200/60 dark:border-maroon-700">
          <Search className="w-4 h-4 text-maroon-400 dark:text-cream/50" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-transparent outline-none text-sm w-full text-maroon-800 dark:text-cream placeholder:text-maroon-300 dark:placeholder:text-cream/40"
            placeholder="Search donor, phone, transaction ID, receipt..."
          />
        </div>
      </Card>

      {/* Donation cards */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<HandCoins className="w-7 h-7" />}
          title="No donations found"
          message={filter === 'pending'
            ? 'No pending submissions to review.'
            : 'No donations match this filter.'}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => (
            <DonationCard
              key={d.id}
              donation={d}
              onApprove={handleApprove}
              onReject={(don) => { setRejecting(don); setRejectReason(''); }}
              onPreview={setPreviewing}
              acting={acting}
            />
          ))}
        </div>
      )}

      {/* Preview modal */}
      <Modal open={!!previewing} onClose={() => setPreviewing(null)} title="Payment Details">
        {previewing && <PreviewContent donation={previewing} />}
      </Modal>

      {/* Reject modal */}
      <Modal open={!!rejecting} onClose={() => { setRejecting(null); setRejectReason(''); }} title="Reject Submission">
        {rejecting && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="font-medium text-maroon-800 dark:text-gold-200">Reject this submission?</p>
                <p className="text-sm text-maroon-500 dark:text-cream/60 mt-1">
                  {rejecting.donor_name} — {formatINR(rejecting.amount)} ({rejecting.receipt_no})
                </p>
                <p className="text-xs text-red-500 mt-2">The donor will not be notified, but the record will be kept with a "Rejected" status.</p>
              </div>
            </div>
            <div>
              <label className="label">Rejection Reason (optional)</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="input min-h-[80px]"
                placeholder="e.g. Transaction ID not found, amount mismatch..."
                maxLength={500}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setRejecting(null); setRejectReason(''); }} className="btn-ghost px-5 py-2.5">Cancel</button>
              <button
                onClick={handleReject}
                disabled={acting}
                className="btn-primary px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white"
              >
                {acting ? (
                  <span className="flex items-center gap-2"><span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Rejecting...</span>
                ) : 'Reject Submission'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── Donation Card ───────────────────────────────────────────────────────────
function DonationCard({
  donation: d,
  onApprove,
  onReject,
  onPreview,
  acting,
}: {
  donation: Donation;
  onApprove: (d: Donation) => void;
  onReject: (d: Donation) => void;
  onPreview: (d: Donation) => void;
  acting: boolean;
}) {
  const statusColor: Record<string, 'gold' | 'green' | 'maroon'> = {
    pending: 'gold', approved: 'green', rejected: 'maroon',
  };
  const statusIcon: Record<string, typeof Clock> = {
    pending: Clock, approved: CheckCircle2, rejected: XCircle,
  };
  const StatusIcon = statusIcon[d.approval_status] ?? Clock;

  return (
    <Card hover>
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Screenshot thumbnail */}
        <div className="shrink-0">
          {d.screenshot_url ? (
            <button
              onClick={() => onPreview(d)}
              className="relative group rounded-xl overflow-hidden border border-saffron-200 dark:border-maroon-700 w-20 h-20 sm:w-24 sm:h-24"
            >
              <img src={d.screenshot_url} alt="Payment screenshot" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-maroon-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Eye className="w-5 h-5 text-white" />
              </div>
            </button>
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-saffron-50 dark:bg-maroon-800 flex items-center justify-center text-saffron-300 dark:text-maroon-600">
              <ImageIcon className="w-8 h-8" />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-maroon-800 dark:text-cream truncate">{d.donor_name}</p>
                <Badge color={statusColor[d.approval_status]}>
                  <StatusIcon className="w-3 h-3 mr-0.5" /> {d.approval_status}
                </Badge>
              </div>
              <p className="text-xs font-mono text-maroon-400 dark:text-cream/50 mt-0.5">{d.receipt_no}</p>
            </div>
            <p className="font-bold text-saffron-600 dark:text-saffron-300 text-lg shrink-0">{formatINR(d.amount)}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-maroon-500 dark:text-cream/60">
            {d.phone && (
              <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 shrink-0" /> {d.phone}</p>
            )}
            <p className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 shrink-0" /> {d.payment_date ? formatDate(d.payment_date) : formatDate(d.date)}</p>
            {d.transaction_id && (
              <p className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 shrink-0" /> {d.transaction_id}</p>
            )}
            {d.reviewed_at && (
              <p className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 shrink-0" /> Reviewed {formatDate(d.reviewed_at)}</p>
            )}
          </div>

          {d.approval_status === 'rejected' && d.rejection_reason && (
            <p className="text-xs text-red-500 mt-1">Reason: {d.rejection_reason}</p>
          )}

          {/* Actions */}
          {d.approval_status === 'pending' && (
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={() => onApprove(d)}
                disabled={acting}
                className="btn-primary px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white"
              >
                {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Approve
              </button>
              <button
                onClick={() => onReject(d)}
                disabled={acting}
                className="btn-outline px-4 py-2 text-sm text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
              {d.screenshot_url && (
                <button
                  onClick={() => onPreview(d)}
                  className="btn-ghost px-4 py-2 text-sm"
                >
                  <Eye className="w-4 h-4" /> View Screenshot
                </button>
              )}
            </div>
          )}

          {(d.approval_status === 'approved' || d.approval_status === 'rejected') && d.screenshot_url && (
            <button
              onClick={() => onPreview(d)}
              className="btn-ghost px-4 py-2 text-sm"
            >
              <Eye className="w-4 h-4" /> View Screenshot
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}

// ─── Preview Content ─────────────────────────────────────────────────────────
function PreviewContent({ donation: d }: { donation: Donation }) {
  return (
    <div className="space-y-4">
      {d.screenshot_url && (
        <div className="rounded-xl overflow-hidden border border-saffron-200 dark:border-maroon-700 bg-white">
          <img src={d.screenshot_url} alt="Payment screenshot" className="w-full object-contain max-h-[50vh]" />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 text-sm">
        <DetailRow label="Donor" value={d.donor_name} />
        <DetailRow label="Amount" value={formatINR(d.amount)} />
        <DetailRow label="Phone" value={d.phone || '—'} />
        <DetailRow label="Receipt No." value={d.receipt_no} />
        <DetailRow label="Transaction ID" value={d.transaction_id || '—'} />
        <DetailRow label="Payment Date" value={d.payment_date ? formatDate(d.payment_date) : formatDate(d.date)} />
        <DetailRow label="Method" value={d.method} />
        <DetailRow label="Status" value={d.approval_status} />
        {d.rejection_reason && <DetailRow label="Rejection Reason" value={d.rejection_reason} />}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-maroon-400 dark:text-cream/50 font-semibold">{label}</p>
      <p className="text-sm font-medium text-maroon-800 dark:text-cream break-words">{value}</p>
    </div>
  );
}
