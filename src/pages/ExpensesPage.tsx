import { useMemo, useState } from 'react';
import {
  Search, Plus, Receipt, Filter, Pencil, Trash2,
  CheckCircle2, AlertCircle, X, Upload, ExternalLink,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { useData, totalExpenses, currentBalance, totalDonations } from '@/lib/data-context';
import { supabase } from '@/lib/supabase';
import { t } from '@/lib/i18n';
import { DONATION_METHODS } from '@/lib/data';
import type { Expense, DonationMethod } from '@/lib/types';
import { formatINR, formatDate } from '@/lib/format';
import { Card, Badge, Modal, StatCard, EmptyState, SectionHeading, Loader } from '@/components/ui';
import { Lotus } from '@/components/decor/Decor';

const methodColor: Record<string, 'saffron' | 'gold' | 'maroon' | 'lotus' | 'gray'> = {
  cash: 'gray', upi: 'saffron', cheque: 'gold', bank: 'maroon',
};

type Toast = { id: number; type: 'success' | 'error'; msg: string };

interface FormState {
  title: string;
  vendor: string;
  amount: string;
  date: string;
  payment_method: DonationMethod;
  bill_no: string;
  receipt_url: string;
  description: string;
  notes: string;
  has_bill: boolean;
}

const emptyForm: FormState = {
  title: '',
  vendor: '',
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  payment_method: 'cash',
  bill_no: '',
  receipt_url: '',
  description: '',
  notes: '',
  has_bill: false,
};

function validate(f: FormState): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!f.vendor.trim()) errs.vendor = 'Vendor / payee is required';
  if (!f.amount || Number(f.amount) <= 0) errs.amount = 'Amount must be greater than 0';
  if (!f.date) errs.date = 'Date is required';
  if (f.receipt_url && !/^https?:\/\//i.test(f.receipt_url)) errs.receipt_url = 'Receipt URL must start with http:// or https://';
  return errs;
}

export function ExpensesPage() {
  const { lang, session } = useApp();
  const { expenses, donations, loading, refresh, logAudit } = useData();
  const [query, setQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const isAdmin = !!session;

  function pushToast(type: Toast['type'], msg: string) {
    const id = Date.now() + Math.random();
    setToasts((ts) => [...ts, { id, type, msg }]);
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 4000);
  }

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const q = query.toLowerCase();
      const matchesQuery =
        e.vendor.toLowerCase().includes(q) ||
        (e.title ?? '').toLowerCase().includes(q) ||
        e.bill_no.toLowerCase().includes(q) ||
        (e.description ?? '').toLowerCase().includes(q) ||
        (e.notes ?? '').toLowerCase().includes(q);
      const matchesMethod = methodFilter === 'all' || e.payment_method === methodFilter;
      return matchesQuery && matchesMethod;
    });
  }, [expenses, query, methodFilter]);

  const filteredTotal = filtered.reduce((s, e) => s + e.amount, 0);
  const balance = currentBalance(donations, expenses);

  function openAdd() {
    setEditing(null);
    setForm({ ...emptyForm });
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(e: Expense) {
    setEditing(e);
    setForm({
      title: e.title ?? '',
      vendor: e.vendor,
      amount: String(e.amount),
      date: e.date ? e.date.slice(0, 10) : '',
      payment_method: e.payment_method,
      bill_no: e.bill_no,
      receipt_url: e.receipt_url ?? '',
      description: e.description ?? '',
      notes: e.notes ?? '',
      has_bill: e.has_bill,
    });
    setErrors({});
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    const row = {
      title: form.title.trim() || null,
      vendor: form.vendor.trim(),
      amount: Number(form.amount),
      date: form.date ? new Date(form.date).toISOString() : new Date().toISOString(),
      payment_method: form.payment_method,
      bill_no: form.bill_no.trim(),
      receipt_url: form.receipt_url.trim() || null,
      description: form.description.trim() || null,
      notes: form.notes.trim(),
      has_bill: form.has_bill,
      updated_at: new Date().toISOString(),
      updated_by: session?.user?.id ?? null,
    };

    try {
      if (editing) {
        const { error } = await supabase.from('expenses').update(row).eq('id', editing.id);
        if (error) throw error;
        await logAudit('expenses', editing.id, 'update', { old: editing, new: row });
        pushToast('success', 'Expense updated successfully');
      } else {
        const { data, error } = await supabase.from('expenses').insert(row).select().single();
        if (error) throw error;
        await logAudit('expenses', data.id, 'insert', row);
        pushToast('success', 'Expense added successfully');
      }
      setModalOpen(false);
      refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save expense';
      pushToast('error', msg.includes('row-level security')
        ? 'You must be signed in as an admin to perform this action.'
        : msg.includes('not-null')
        ? 'A required field is missing. Please check the form.'
        : msg);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', deleteTarget.id);
      if (error) throw error;
      await logAudit('expenses', deleteTarget.id, 'delete', { deleted: deleteTarget });
      pushToast('success', 'Expense deleted');
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete expense';
      pushToast('error', msg);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loader label={t('common.loading', lang)} />;

  return (
    <div className="space-y-8 pb-10">
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
            {tst.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <span className="text-sm font-medium">{tst.msg}</span>
            <button onClick={() => setToasts((ts) => ts.filter((t) => t.id !== tst.id))} className="ml-auto shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <SectionHeading
        title={t('nav.expenses', lang)}
        subtitle="Track all festival expenditures"
        action={
          isAdmin ? (
            <button onClick={openAdd} className="btn-primary px-5 py-2.5 text-sm">
              <Plus className="w-4 h-4" /> Add Expense
            </button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total Expenses" value={formatINR(totalExpenses(expenses))} icon={<Receipt className="w-6 h-6" />} accent="maroon" sub={`${expenses.length} entries`} />
        <StatCard label="Total Donations" value={formatINR(totalDonations(donations))} icon={<Lotus className="w-6 h-6" />} accent="saffron" />
        <StatCard label="Current Balance" value={formatINR(balance)} icon={<Receipt className="w-6 h-6" />} accent={balance >= 0 ? 'gold' : 'maroon'} sub={balance >= 0 ? 'Surplus' : 'Deficit'} />
      </div>

      {/* Search + Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex items-center gap-2 flex-1 px-3 h-11 rounded-xl bg-white/60 dark:bg-maroon-900/60 border border-saffron-200/60 dark:border-maroon-700">
            <Search className="w-4 h-4 text-maroon-400 dark:text-cream/50" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-transparent outline-none text-sm w-full text-maroon-800 dark:text-cream placeholder:text-maroon-300 dark:placeholder:text-cream/40"
              placeholder="Search vendor, title, bill no, description..."
            />
          </div>
          <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className="input md:w-40">
            <option value="all">All Methods</option>
            {DONATION_METHODS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={<Receipt className="w-7 h-7" />} title="No expenses found" message="Try adjusting your search or filters, or add a new expense." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-maroon-50 dark:bg-maroon-800/60 text-left text-maroon-600 dark:text-cream/70 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 font-semibold">Vendor / Payee</th>
                  <th className="px-4 py-3 font-semibold hidden md:table-cell">Method</th>
                  <th className="px-4 py-3 font-semibold hidden md:table-cell">Bill No.</th>
                  <th className="px-4 py-3 font-semibold hidden lg:table-cell">Date</th>
                  <th className="px-4 py-3 font-semibold hidden lg:table-cell">Receipt</th>
                  <th className="px-4 py-3 font-semibold text-right">Amount</th>
                  {isAdmin && <th className="px-4 py-3 font-semibold text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((e, i) => (
                  <tr key={e.id} className={`border-t border-maroon-100 dark:border-maroon-800 hover:bg-maroon-50/50 dark:hover:bg-maroon-800/40 transition ${i % 2 === 0 ? '' : 'bg-cream/40 dark:bg-maroon-950/30'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-maroon-gradient flex items-center justify-center text-cream text-xs font-bold shrink-0">
                          {e.vendor.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-maroon-800 dark:text-cream truncate">{e.vendor}</p>
                          {e.title && <p className="text-xs text-maroon-400 dark:text-cream/50 truncate max-w-[16rem]">{e.title}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell"><Badge color={methodColor[e.payment_method]}>{e.payment_method}</Badge></td>
                    <td className="px-4 py-3 hidden md:table-cell font-mono text-xs text-maroon-600 dark:text-gold-300">{e.bill_no || '—'}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-maroon-500 dark:text-cream/60">{formatDate(e.date)}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {e.receipt_url ? (
                        <a href={e.receipt_url} target="_blank" rel="noopener noreferrer" className="btn-ghost px-2.5 py-1.5 text-xs">
                          <ExternalLink className="w-3.5 h-3.5" /> View
                        </a>
                      ) : (
                        <span className="text-xs text-maroon-400 dark:text-cream/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-maroon-600 dark:text-maroon-300">{formatINR(e.amount)}</td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(e)} className="btn-ghost h-8 w-8 p-0 rounded-lg" aria-label="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteTarget(e)} className="btn-ghost h-8 w-8 p-0 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30" aria-label="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-maroon-100/60 dark:bg-maroon-800/60 border-t-2 border-maroon-300 dark:border-maroon-700">
                  <td colSpan={isAdmin ? 5 : 4} className="px-4 py-3 font-semibold text-maroon-700 dark:text-gold-200">Total</td>
                  <td className="px-4 py-3 text-right font-bold text-maroon-800 dark:text-gold-200">{formatINR(filteredTotal)}</td>
                  {isAdmin && <td />}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Expense' : 'Add Expense'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Expense Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input"
              placeholder="Short title (optional)"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Vendor / Payee <span className="text-red-500">*</span></label>
              <input
                value={form.vendor}
                onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                className="input"
                placeholder="Vendor / shop name"
              />
              {errors.vendor && <p className="text-xs text-red-500 mt-1">{errors.vendor}</p>}
            </div>
            <div>
              <label className="label">Amount (₹) <span className="text-red-500">*</span></label>
              <input
                type="number"
                min="1"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="input"
                placeholder="0"
              />
              {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
            </div>
          </div>

          <div>
            <label className="label">Payment Method</label>
            <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value as DonationMethod })} className="input">
              {DONATION_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="input"
              />
              {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
            </div>
            <div>
              <label className="label">Bill No.</label>
              <input
                value={form.bill_no}
                onChange={(e) => setForm({ ...form, bill_no: e.target.value })}
                className="input"
                placeholder="Bill number (optional)"
              />
            </div>
          </div>

          <div>
            <label className="label">Receipt / Image URL</label>
            <input
              value={form.receipt_url}
              onChange={(e) => setForm({ ...form, receipt_url: e.target.value })}
              className="input"
              placeholder="https://... (link to receipt image)"
            />
            {errors.receipt_url && <p className="text-xs text-red-500 mt-1">{errors.receipt_url}</p>}
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input min-h-[60px]"
              placeholder="What was this expense for? (optional)"
            />
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="input min-h-[60px]"
              placeholder="Internal notes (optional)"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-maroon-600 dark:text-cream/70">
            <input
              type="checkbox"
              checked={form.has_bill}
              onChange={(e) => setForm({ ...form, has_bill: e.target.checked })}
              className="accent-saffron-500"
            /> Bill available
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost px-5 py-2.5">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary px-5 py-2.5">
              {saving ? <span className="flex items-center gap-2"><span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving...</span> : editing ? 'Update Expense' : 'Save Expense'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="font-medium text-maroon-800 dark:text-gold-200">Delete this expense?</p>
              <p className="text-sm text-maroon-500 dark:text-cream/60 mt-1">
                {deleteTarget?.vendor} — {deleteTarget ? formatINR(deleteTarget.amount) : ''}
              </p>
              <p className="text-xs text-red-500 mt-2">This action cannot be undone.</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setDeleteTarget(null)} className="btn-ghost px-5 py-2.5">Cancel</button>
            <button onClick={confirmDelete} disabled={saving} className="btn-primary px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white">
              {saving ? <span className="flex items-center gap-2"><span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Deleting...</span> : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
