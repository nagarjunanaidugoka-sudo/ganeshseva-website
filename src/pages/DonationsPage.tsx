import { useMemo, useState, useEffect } from 'react';
import {
  Search, Plus, HandCoins, Download, Filter, Pencil, Trash2,
  CheckCircle2, AlertCircle, X, Phone, Receipt, UserPlus, FileSpreadsheet, FileText,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '@/lib/store';
import { useData, totalDonations, approvedDonations } from '@/lib/data-context';
import { supabase } from '@/lib/supabase';
import { t } from '@/lib/i18n';
import { DONATION_METHODS, DONATION_CATEGORIES, PAYMENT_STATUSES } from '@/lib/data';
import type { Donation, DonationMethod, PaymentStatus, Donor } from '@/lib/types';
import { formatINR, formatDate } from '@/lib/format';
import { Card, Badge, Modal, StatCard, EmptyState, SectionHeading, Loader } from '@/components/ui';
import { Marigold } from '@/components/decor/Decor';
import { DonorPicker } from '@/components/admin/DonorPicker';

const methodColor: Record<string, 'saffron' | 'gold' | 'maroon' | 'lotus' | 'gray'> = {
  cash: 'gray', upi: 'saffron', cheque: 'gold', bank: 'maroon',
};

const statusColor: Record<string, 'green' | 'gold' | 'maroon'> = {
  received: 'green', pending: 'gold', failed: 'maroon',
};

type Toast = { id: number; type: 'success' | 'error'; msg: string };

interface FormState {
  receipt_no: string;
  donor_name: string;
  donor_name_te: string;
  father_name: string;
  amount: string;
  method: DonationMethod;
  purpose: string;
  phone: string;
  date: string;
  payment_status: PaymentStatus;
  transaction_id: string;
  category: string;
  notes: string;
}

const emptyForm: FormState = {
  receipt_no: '',
  donor_name: '',
  donor_name_te: '',
  father_name: '',
  amount: '',
  method: 'cash',
  purpose: 'General Donation',
  phone: '',
  date: new Date().toISOString().slice(0, 10),
  payment_status: 'received',
  transaction_id: '',
  category: 'General Donation',
  notes: '',
};

function validate(f: FormState): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!f.donor_name.trim()) errs.donor_name = 'Donor name is required';
  if (!f.amount || Number(f.amount) <= 0) errs.amount = 'Amount must be greater than 0';
  if (!f.date) errs.date = 'Date is required';
  if (f.phone && !/^[0-9+\-\s]{6,15}$/.test(f.phone)) errs.phone = 'Enter a valid phone number';
  if (f.transaction_id && f.transaction_id.length > 100) errs.transaction_id = 'Transaction ID is too long';
  return errs;
}

export function DonationsPage() {
  const { lang, session } = useApp();
  const { donations, donors, loading, refresh, logAudit } = useData();
  const [query, setQuery] = useState('');
  const [method, setMethod] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Donation | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Donation | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
  const [addDonorOpen, setAddDonorOpen] = useState(false);
  const [newDonorName, setNewDonorName] = useState('');
  const [newDonorFather, setNewDonorFather] = useState('');
  const [newDonorPhone, setNewDonorPhone] = useState('');
  const [newDonorVillage, setNewDonorVillage] = useState('');
  const [savingDonor, setSavingDonor] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const isAdmin = !!session;

  function pushToast(type: Toast['type'], msg: string) {
    const id = Date.now() + Math.random();
    setToasts((ts) => [...ts, { id, type, msg }]);
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 4000);
  }

  const filtered = useMemo(() => {
    return donations.filter((d) => {
      const q = query.toLowerCase();
      const matchesQuery =
        d.donor_name.toLowerCase().includes(q) ||
        (d.father_name ?? '').toLowerCase().includes(q) ||
        d.receipt_no.toLowerCase().includes(q) ||
        d.purpose.toLowerCase().includes(q) ||
        (d.phone ?? '').toLowerCase().includes(q) ||
        (d.transaction_id ?? '').toLowerCase().includes(q);
      const matchesMethod = method === 'all' || d.method === method;
      const matchesStatus = statusFilter === 'all' || d.payment_status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || d.category === categoryFilter;
      return matchesQuery && matchesMethod && matchesStatus && matchesCategory;
    });
  }, [donations, query, method, statusFilter, categoryFilter]);

  const filtersApplied = query !== '' || method !== 'all' || statusFilter !== 'all' || categoryFilter !== 'all';
  const exportData = filtersApplied ? filtered : donations.filter(d => d.approval_status === 'approved');

  function getDonorVillage(d: Donation): string {
    const matched = donors.find(dn => dn.name === d.donor_name && dn.father_name === (d.father_name ?? ''));
    return matched?.village ?? '';
  }

  const EXPORT_HEADERS = [
    'Receipt Number',
    'Donor Name',
    "Father's Name",
    'Phone Number',
    'Village/Area',
    'Donation Amount',
    'Payment Method',
    'Transaction ID',
    'Donation Date',
    'Status',
    'Notes',
  ] as const;

  function getExportRows(data: Donation[]) {
    return data.map(d => ({
      'Receipt Number': d.receipt_no,
      'Donor Name': d.donor_name,
      "Father's Name": d.father_name ?? '',
      'Phone Number': d.phone ?? '',
      'Village/Area': getDonorVillage(d),
      'Donation Amount': d.amount,
      'Payment Method': d.method,
      'Transaction ID': d.transaction_id ?? '',
      'Donation Date': d.date ? formatDate(d.date) : '',
      'Status': d.payment_status,
      'Notes': d.notes ?? '',
    }));
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  function exportCSV() {
    if (exportData.length === 0) {
      pushToast('error', 'No donations to export for the selected filter');
      setExportOpen(false);
      return;
    }
    const rows = getExportRows(exportData);
    const csv = '\uFEFF' + [
      EXPORT_HEADERS.join(','),
      ...rows.map(r => EXPORT_HEADERS.map(h => {
        const val = String(r[h] ?? '');
        return val.includes(',') || val.includes('"') || val.includes('\n') ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `donations-${new Date().toISOString().slice(0, 10)}.csv`);
    pushToast('success', 'Export downloaded successfully');
    setExportOpen(false);
  }

  function exportXLSX() {
    if (exportData.length === 0) {
      pushToast('error', 'No donations to export for the selected filter');
      setExportOpen(false);
      return;
    }
    const rows = getExportRows(exportData);
    const ws = XLSX.utils.json_to_sheet(rows, { header: EXPORT_HEADERS as unknown as string[] });
    ws['!cols'] = EXPORT_HEADERS.map(h => ({ wch: Math.max(h.length + 2, 14) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Donations');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    downloadBlob(blob, `donations-${new Date().toISOString().slice(0, 10)}.xlsx`);
    pushToast('success', 'Export downloaded successfully');
    setExportOpen(false);
  }

  const total = filtered.reduce((s, d) => s + d.amount, 0);
  const approved = approvedDonations(donations);
  const approvedTotal = totalDonations(donations);

  function openAdd() {
    setEditing(null);
    setSelectedDonor(null);
    const nextNo = `GSV-${new Date().getFullYear()}-${String(donations.length + 1).padStart(4, '0')}`;
    setForm({ ...emptyForm, receipt_no: nextNo });
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(d: Donation) {
    setEditing(d);
    setSelectedDonor(null);
    const matchedDonor = donors.find(dn => dn.name === d.donor_name && dn.father_name === (d.father_name ?? ''));
    if (matchedDonor) setSelectedDonor(matchedDonor);
    setForm({
      receipt_no: d.receipt_no,
      donor_name: d.donor_name,
      donor_name_te: d.donor_name_te,
      father_name: d.father_name ?? '',
      amount: String(d.amount),
      method: d.method,
      purpose: d.purpose,
      phone: d.phone,
      date: d.date ? d.date.slice(0, 10) : '',
      payment_status: d.payment_status,
      transaction_id: d.transaction_id ?? '',
      category: d.category,
      notes: d.notes ?? '',
    });
    setErrors({});
    setModalOpen(true);
  }

  function handleDonorSelect(donor: Donor | null, name: string, fatherName: string, phone: string, village: string) {
    setSelectedDonor(donor);
    setForm(f => ({ ...f, donor_name: name, father_name: fatherName, phone: phone || f.phone }));
  }

  async function handleAddNewDonor(name: string) {
    setNewDonorName(name);
    setNewDonorFather('');
    setNewDonorPhone('');
    setNewDonorVillage('');
    setAddDonorOpen(true);
  }

  async function confirmAddNewDonor() {
    if (!newDonorName.trim()) return;
    setSavingDonor(true);
    try {
      const payload = {
        donor_id: '',
        name: newDonorName.trim(),
        father_name: newDonorFather.trim(),
        phone: newDonorPhone.trim(),
        village: newDonorVillage.trim(),
      };
      const { data, error } = await supabase.from('donors').insert(payload).select().single();
      if (error) throw error;
      const newDonor = data as Donor;
      setSelectedDonor(newDonor);
      setForm(f => ({ ...f, donor_name: newDonor.name, father_name: newDonor.father_name, phone: newDonor.phone || f.phone }));
      pushToast('success', `Donor "${newDonor.name}" added to master list`);
      setAddDonorOpen(false);
      refresh();
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'Failed to add donor');
    } finally {
      setSavingDonor(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    const row = {
      receipt_no: form.receipt_no.trim(),
      donor_name: form.donor_name.trim(),
      donor_name_te: form.donor_name_te.trim(),
      father_name: form.father_name.trim(),
      amount: Number(form.amount),
      method: form.method,
      purpose: form.purpose.trim() || 'General Donation',
      phone: form.phone.trim(),
      date: form.date ? new Date(form.date).toISOString() : new Date().toISOString(),
      payment_status: form.payment_status,
      transaction_id: form.transaction_id.trim() || null,
      category: form.category,
      notes: form.notes.trim() || null,
      updated_at: new Date().toISOString(),
      updated_by: session?.user?.id ?? null,
    };

    try {
      if (editing) {
        const { error } = await supabase.from('donations').update(row).eq('id', editing.id);
        if (error) throw error;
        await logAudit('donations', editing.id, 'update', { old: editing, new: row });
        pushToast('success', 'Donation updated successfully');
      } else {
        const { data, error } = await supabase.from('donations').insert(row).select().single();
        if (error) throw error;
        await logAudit('donations', data.id, 'insert', row);
        pushToast('success', 'Donation added successfully');
      }
      setModalOpen(false);
      refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save donation';
      pushToast('error', msg.includes('row-level security') ? 'You must be signed in as an admin.' : msg);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('donations').delete().eq('id', deleteTarget.id);
      if (error) throw error;
      await logAudit('donations', deleteTarget.id, 'delete', { deleted: deleteTarget });
      pushToast('success', 'Donation deleted');
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete donation';
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
        title={t('nav.donations', lang)}
        subtitle="All contributions received for the festival"
        action={
          isAdmin ? (
            <button onClick={openAdd} className="btn-primary px-5 py-2.5 text-sm">
              <Plus className="w-4 h-4" /> Add Donation
            </button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Donations" value={formatINR(totalDonations(donations))} icon={<HandCoins className="w-6 h-6" />} accent="saffron" sub={`${donations.length} donors`} />
        <StatCard label="Filtered Total" value={formatINR(total)} icon={<Filter className="w-6 h-6" />} accent="gold" sub={`${filtered.length} shown`} />
        <StatCard label="Avg. Donation" value={formatINR(donations.length ? totalDonations(donations) / donations.length : 0)} icon={<Marigold className="w-6 h-6" />} accent="lotus" />
        <StatCard label="Pending" value={formatINR(donations.filter(d => d.payment_status === 'pending').reduce((s, d) => s + d.amount, 0))} icon={<Receipt className="w-6 h-6" />} accent="maroon" sub={`${donations.filter(d => d.payment_status === 'pending').length} pending`} />
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
              placeholder="Search donor, receipt, phone, txn ID..."
            />
          </div>
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="input md:w-40">
            <option value="all">All Methods</option>
            {DONATION_METHODS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input md:w-40">
            <option value="all">All Statuses</option>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input md:w-48">
            <option value="all">All Categories</option>
            {DONATION_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="relative">
            <button onClick={() => setExportOpen(o => !o)} className="btn-outline px-4 py-2.5 text-sm flex items-center gap-2">
              <Download className="w-4 h-4" /> Export
            </button>
            {exportOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
                <div className="absolute right-0 top-full mt-2 z-20 bg-white dark:bg-maroon-900 rounded-xl shadow-lg border border-saffron-200 dark:border-maroon-700 py-1 min-w-[170px]">
                  {exportData.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-maroon-400 dark:text-cream/50 text-center">
                      No donations to export
                    </div>
                  ) : (
                    <>
                      <button onClick={exportXLSX} className="w-full px-4 py-2 text-sm text-left hover:bg-saffron-50 dark:hover:bg-maroon-800 text-maroon-700 dark:text-cream flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4" /> Excel (.xlsx)
                      </button>
                      <button onClick={exportCSV} className="w-full px-4 py-2 text-sm text-left hover:bg-saffron-50 dark:hover:bg-maroon-800 text-maroon-700 dark:text-cream flex items-center gap-2">
                        <FileText className="w-4 h-4" /> CSV (.csv)
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={<HandCoins className="w-7 h-7" />} title="No donations found" message="Try adjusting your search or filters, or add a new donation." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-saffron-50 dark:bg-maroon-800/60 text-left text-maroon-600 dark:text-cream/70 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 font-semibold">Receipt No.</th>
                  <th className="px-4 py-3 font-semibold">Donor</th>
                  <th className="px-4 py-3 font-semibold hidden sm:table-cell">Category</th>
                  <th className="px-4 py-3 font-semibold hidden md:table-cell">Method</th>
                  <th className="px-4 py-3 font-semibold hidden md:table-cell">Status</th>
                  <th className="px-4 py-3 font-semibold hidden lg:table-cell">Date</th>
                  <th className="px-4 py-3 font-semibold text-right">Amount</th>
                  {isAdmin && <th className="px-4 py-3 font-semibold text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => (
                  <tr key={d.id} className={`border-t border-saffron-100 dark:border-maroon-800 hover:bg-saffron-50/60 dark:hover:bg-maroon-800/40 transition ${i % 2 === 0 ? '' : 'bg-cream/40 dark:bg-maroon-950/30'}`}>
                    <td className="px-4 py-3 font-mono text-xs text-maroon-600 dark:text-gold-300">{d.receipt_no}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-saffron-gradient flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {d.donor_name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-maroon-800 dark:text-cream truncate">{lang === 'te' && d.donor_name_te ? d.donor_name_te : d.donor_name}</p>
                          {d.phone && (
                            <p className="text-xs text-maroon-400 dark:text-cream/50 flex items-center gap-1">
                              <Phone className="w-3 h-3" />{d.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-maroon-600 dark:text-cream/70">{d.category}</td>
                    <td className="px-4 py-3 hidden md:table-cell"><Badge color={methodColor[d.method]}>{d.method}</Badge></td>
                    <td className="px-4 py-3 hidden md:table-cell"><Badge color={statusColor[d.payment_status]}>{d.payment_status}</Badge></td>
                    <td className="px-4 py-3 hidden lg:table-cell text-maroon-500 dark:text-cream/60">{formatDate(d.date)}</td>
                    <td className="px-4 py-3 text-right font-bold text-saffron-600 dark:text-saffron-300">{formatINR(d.amount)}</td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(d)} className="btn-ghost h-8 w-8 p-0 rounded-lg" aria-label="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteTarget(d)} className="btn-ghost h-8 w-8 p-0 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30" aria-label="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-saffron-100/60 dark:bg-maroon-800/60 border-t-2 border-saffron-300 dark:border-maroon-700">
                  <td colSpan={isAdmin ? 6 : 5} className="px-4 py-3 font-semibold text-maroon-700 dark:text-gold-200">Total</td>
                  <td className="px-4 py-3 text-right font-bold text-maroon-800 dark:text-gold-200">{formatINR(total)}</td>
                  {isAdmin && <td />}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Donation' : 'Add Donation'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Donor Name <span className="text-red-500">*</span></label>
              {isAdmin && donors.length > 0 ? (
                <DonorPicker
                  donors={donors}
                  value={form.donor_name}
                  selectedDonor={selectedDonor}
                  onSelect={handleDonorSelect}
                  onAddNew={handleAddNewDonor}
                  placeholder="Type 2+ letters to search donor master..."
                />
              ) : (
                <input
                  value={form.donor_name}
                  onChange={(e) => setForm({ ...form, donor_name: e.target.value })}
                  className="input"
                  placeholder="Enter donor name"
                />
              )}
              {errors.donor_name && <p className="text-xs text-red-500 mt-1">{errors.donor_name}</p>}
              {selectedDonor && (
                <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-maroon-500 dark:text-cream/60">
                  {selectedDonor.father_name && <span>S/o {selectedDonor.father_name}</span>}
                  {selectedDonor.village && <span>· {selectedDonor.village}</span>}
                  {selectedDonor.phone && <span>· {selectedDonor.phone}</span>}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Father's Name</label>
              <input
                value={form.father_name}
                onChange={(e) => { setForm({ ...form, father_name: e.target.value }); setSelectedDonor(null); }}
                className="input"
                placeholder="Father's name"
              />
            </div>
            <div>
              <label className="label">Donor Name (Telugu)</label>
              <input
                value={form.donor_name_te}
                onChange={(e) => setForm({ ...form, donor_name_te: e.target.value })}
                className="input"
                placeholder="తెలుగు పేరు (optional)"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
            <div>
              <label className="label">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input"
                placeholder="98480XXXXX"
              />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Payment Method</label>
              <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value as DonationMethod })} className="input">
                {DONATION_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Payment Status</label>
              <select value={form.payment_status} onChange={(e) => setForm({ ...form, payment_status: e.target.value as PaymentStatus })} className="input">
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input">
                {DONATION_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Donation Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="input"
              />
              {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Receipt No.</label>
              <input
                value={form.receipt_no}
                onChange={(e) => setForm({ ...form, receipt_no: e.target.value })}
                className="input"
                placeholder="GSV-2026-0001"
              />
            </div>
            <div>
              <label className="label">Transaction ID</label>
              <input
                value={form.transaction_id}
                onChange={(e) => setForm({ ...form, transaction_id: e.target.value })}
                className="input"
                placeholder="UPI / bank ref (optional)"
              />
              {errors.transaction_id && <p className="text-xs text-red-500 mt-1">{errors.transaction_id}</p>}
            </div>
          </div>

          <div>
            <label className="label">Purpose</label>
            <input
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              className="input"
              placeholder="General Donation"
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

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost px-5 py-2.5">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary px-5 py-2.5">
              {saving ? <span className="flex items-center gap-2"><span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving...</span> : editing ? 'Update Donation' : 'Save Donation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add New Donor Modal */}
      <Modal open={addDonorOpen} onClose={() => setAddDonorOpen(false)} title="Add New Donor to Master List">
        <div className="space-y-4">
          <div className="flex items-start gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-saffron-100 dark:bg-saffron-900/40 flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5 text-saffron-600 dark:text-saffron-300" />
            </div>
            <p className="text-sm text-maroon-500 dark:text-cream/60">
              This donor will be saved to the master list and linked to this donation.
            </p>
          </div>
          <div>
            <label className="label">Name <span className="text-red-500">*</span></label>
            <input
              value={newDonorName}
              onChange={(e) => setNewDonorName(e.target.value)}
              className="input"
              placeholder="Donor name"
              autoFocus
            />
          </div>
          <div>
            <label className="label">Father's Name</label>
            <input
              value={newDonorFather}
              onChange={(e) => setNewDonorFather(e.target.value)}
              className="input"
              placeholder="Father's name"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Phone</label>
              <input
                value={newDonorPhone}
                onChange={(e) => setNewDonorPhone(e.target.value)}
                className="input"
                placeholder="98480XXXXX"
              />
            </div>
            <div>
              <label className="label">Village / Area</label>
              <input
                value={newDonorVillage}
                onChange={(e) => setNewDonorVillage(e.target.value)}
                className="input"
                placeholder="Village"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setAddDonorOpen(false)} className="btn-ghost px-5 py-2.5">Cancel</button>
            <button onClick={confirmAddNewDonor} disabled={savingDonor || !newDonorName.trim()} className="btn-primary px-5 py-2.5">
              {savingDonor ? <span className="flex items-center gap-2"><span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving...</span> : <><UserPlus className="w-4 h-4" /> Add & Link</>}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="font-medium text-maroon-800 dark:text-gold-200">Delete this donation?</p>
              <p className="text-sm text-maroon-500 dark:text-cream/60 mt-1">
                {deleteTarget?.donor_name} — {deleteTarget ? formatINR(deleteTarget.amount) : ''} ({deleteTarget?.receipt_no})
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
