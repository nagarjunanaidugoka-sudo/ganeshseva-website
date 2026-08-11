import { useState, useMemo, useRef, useCallback } from 'react';
import {
  Upload, Search, Plus, Pencil, Trash2, X, Save, Loader2,
  Users, FileSpreadsheet, AlertCircle, CheckCircle2, Download,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import { useData } from '@/lib/data-context';
import type { Donor } from '@/lib/types';
import { Card, SectionHeading, Modal, EmptyState } from '@/components/ui';

interface ParsedRow {
  donor_id: string;
  name: string;
  father_name: string;
  phone: string;
  village: string;
}

const FIELD_ALIASES: Record<string, string[]> = {
  donor_id: ['donor_id', 'donorid', 'id', 'unique_id', 'uniqueid', 'code', 'donor code', 'donorcode'],
  name: ['name', 'donor_name', 'donorname', 'donor', 'full_name', 'fullname', 'పేరు'],
  father_name: ['father_name', 'fathername', "father's name", "fathers name", 'father', 'తండ్రి పేరు', 'తండ్రి'],
  phone: ['phone', 'phone_number', 'phonenumber', 'mobile', 'mobile_number', 'contact', 'ఫోన్', 'cell'],
  village: ['village', 'area', 'village_area', 'location', 'address', 'ఊరు', 'గ్రామం'],
};

function normalizeKey(s: string): string {
  return s.toLowerCase().trim().replace(/[\s_]+/g, ' ').replace(/['']/g, '');
}

function mapRowToDonor(row: Record<string, unknown>): ParsedRow {
  const keys = Object.keys(row);
  const normMap: Record<string, string> = {};
  for (const k of keys) {
    normMap[normalizeKey(k)] = k;
  }

  function findVal(field: string): string {
    const aliases = FIELD_ALIASES[field];
    for (const alias of aliases) {
      const norm = normalizeKey(alias);
      if (normMap[norm]) {
        const val = row[normMap[norm]];
        return val != null ? String(val).trim() : '';
      }
    }
    return '';
  }

  return {
    donor_id: findVal('donor_id'),
    name: findVal('name'),
    father_name: findVal('father_name'),
    phone: findVal('phone'),
    village: findVal('village'),
  };
}

interface ImportPreview {
  newRows: ParsedRow[];
  duplicateRows: ParsedRow[];
  existingCount: number;
}

export function DonorMasterTab() {
  const { donors, refresh } = useData();
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Donor | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ donor_id: '', name: '', father_name: '', phone: '', village: '', notes: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Import state
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  const filtered = useMemo(() => {
    if (!query.trim()) return donors;
    const q = query.toLowerCase();
    return donors.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.father_name.toLowerCase().includes(q) ||
      d.phone.toLowerCase().includes(q) ||
      d.village.toLowerCase().includes(q) ||
      d.donor_id.toLowerCase().includes(q)
    );
  }, [donors, query]);

  function openAdd() {
    setEditing(null);
    setForm({ donor_id: '', name: '', father_name: '', phone: '', village: '', notes: '' });
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(d: Donor) {
    setEditing(d);
    setForm({
      donor_id: d.donor_id ?? '',
      name: d.name,
      father_name: d.father_name ?? '',
      phone: d.phone ?? '',
      village: d.village ?? '',
      notes: d.notes ?? '',
    });
    setErrors({});
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    const payload = {
      donor_id: form.donor_id.trim(),
      name: form.name.trim(),
      father_name: form.father_name.trim(),
      phone: form.phone.trim(),
      village: form.village.trim(),
      notes: form.notes.trim() || null,
    };

    try {
      if (editing) {
        const { error } = await supabase.from('donors').update(payload).eq('id', editing.id);
        if (error) throw error;
        showToast('success', 'Donor updated');
      } else {
        // Check for duplicates before inserting
        const existing = donors.find(d =>
          (d.donor_id && d.donor_id === payload.donor_id) ||
          (d.name.toLowerCase() === payload.name.toLowerCase() &&
           d.father_name.toLowerCase() === payload.father_name.toLowerCase() &&
           d.phone.toLowerCase() === payload.phone.toLowerCase())
        );
        if (existing) {
          showToast('error', 'A donor with this ID or Name+Father+Phone already exists');
          setSaving(false);
          return;
        }
        const { error } = await supabase.from('donors').insert(payload);
        if (error) throw error;
        showToast('success', 'Donor added');
      }
      setModalOpen(false);
      refresh();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save donor');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(d: Donor) {
    if (!confirm(`Delete donor "${d.name}"? This will NOT affect existing donation records.`)) return;
    const { error } = await supabase.from('donors').delete().eq('id', d.id);
    if (error) { showToast('error', error.message); return; }
    showToast('success', 'Donor deleted');
    refresh();
  }

  // ── Import Logic ──
  const handleFileSelect = useCallback(async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });

      const parsed: ParsedRow[] = rawRows.map(mapRowToDonor).filter(r => r.name.trim());

      const newRows: ParsedRow[] = [];
      const duplicateRows: ParsedRow[] = [];

      const seenKeys = new Set<string>();
      for (const d of donors) {
        if (d.donor_id) seenKeys.add(`id:${d.donor_id.toLowerCase()}`);
        seenKeys.add(`nfp:${d.name.toLowerCase()}|${d.father_name.toLowerCase()}|${d.phone.toLowerCase()}`);
      }

      for (const row of parsed) {
        const idKey = row.donor_id ? `id:${row.donor_id.toLowerCase()}` : '';
        const nfpKey = `nfp:${row.name.toLowerCase()}|${row.father_name.toLowerCase()}|${row.phone.toLowerCase()}`;

        if ((idKey && seenKeys.has(idKey)) || seenKeys.has(nfpKey)) {
          duplicateRows.push(row);
        } else {
          newRows.push(row);
          if (idKey) seenKeys.add(idKey);
          seenKeys.add(nfpKey);
        }
      }

      setImportPreview({
        newRows,
        duplicateRows,
        existingCount: donors.length,
      });
    } catch {
      showToast('error', 'Failed to parse file. Please upload a valid .xlsx or .csv file.');
    }
  }, [donors]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    e.target.value = '';
  }

  async function confirmImport() {
    if (!importPreview || importPreview.newRows.length === 0) return;
    setImporting(true);
    try {
      if (importMode === 'replace' && donors.length > 0) {
        // Delete all existing donors then insert new ones
        // Donations are NOT affected — no FK
        const { error: delErr } = await supabase.from('donors').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (delErr) throw delErr;
      }

      // Insert in batches of 500
      const rows = importPreview.newRows.map(r => ({
        donor_id: r.donor_id,
        name: r.name,
        father_name: r.father_name,
        phone: r.phone,
        village: r.village,
      }));

      for (let i = 0; i < rows.length; i += 500) {
        const batch = rows.slice(i, i + 500);
        const { error } = await supabase.from('donors').insert(batch);
        if (error) throw error;
      }

      showToast('success', `Imported ${rows.length} donors successfully`);
      setImportPreview(null);
      refresh();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  }

  function downloadTemplate() {
    const ws = XLSX.utils.json_to_sheet([
      { Donor_ID: '', Name: 'Example Donor', Father_Name: 'Example Father', Phone: '98480XXXXX', Village: 'Example Village' },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Donor Master');
    XLSX.writeFile(wb, 'donor_master_template.xlsx');
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[60] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg max-w-sm animate-fade-in-scale ${
          toast.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/80 text-green-800 dark:text-green-100 border border-green-200 dark:border-green-700'
            : 'bg-red-50 dark:bg-red-900/80 text-red-800 dark:text-red-100 border border-red-200 dark:border-red-700'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span className="text-sm font-medium">{toast.msg}</span>
          <button onClick={() => setToast(null)} className="ml-auto shrink-0"><X className="w-4 h-4" /></button>
        </div>
      )}

      <SectionHeading
        title="Donor Master"
        subtitle="Manage the donor database. Import from Excel/CSV, search, and link donors to donations."
        action={
          <div className="flex gap-2">
            <button onClick={downloadTemplate} className="btn-outline px-4 py-2.5 text-sm">
              <Download className="w-4 h-4" /> Template
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="btn-outline px-4 py-2.5 text-sm">
              <Upload className="w-4 h-4" /> Import
            </button>
            <button onClick={openAdd} className="btn-primary px-4 py-2.5 text-sm">
              <Plus className="w-4 h-4" /> Add Donor
            </button>
          </div>
        }
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={onFileChange}
        className="hidden"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-saffron-100 dark:bg-saffron-900/40 flex items-center justify-center">
              <Users className="w-5 h-5 text-saffron-600 dark:text-saffron-300" />
            </div>
            <div>
              <p className="text-2xl font-bold text-maroon-800 dark:text-gold-200">{donors.length}</p>
              <p className="text-xs text-maroon-500 dark:text-cream/60">Total Donors</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-green-600 dark:text-green-300" />
            </div>
            <div>
              <p className="text-2xl font-bold text-maroon-800 dark:text-gold-200">{donors.filter(d => d.donor_id).length}</p>
              <p className="text-xs text-maroon-500 dark:text-cream/60">With Donor ID</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <Search className="w-5 h-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <p className="text-2xl font-bold text-maroon-800 dark:text-gold-200">{donors.filter(d => d.phone).length}</p>
              <p className="text-xs text-maroon-500 dark:text-cream/60">With Phone</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gold-100 dark:bg-gold-900/40 flex items-center justify-center">
              <Users className="w-5 h-5 text-gold-600 dark:text-gold-300" />
            </div>
            <div>
              <p className="text-2xl font-bold text-maroon-800 dark:text-gold-200">{donors.filter(d => d.village).length}</p>
              <p className="text-xs text-maroon-500 dark:text-cream/60">With Village</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <div className="flex items-center gap-2 px-3 h-11 rounded-xl bg-white/60 dark:bg-maroon-900/60 border border-saffron-200/60 dark:border-maroon-700">
          <Search className="w-4 h-4 text-maroon-400 dark:text-cream/50" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-transparent outline-none text-sm w-full text-maroon-800 dark:text-cream placeholder:text-maroon-300 dark:placeholder:text-cream/40"
            placeholder="Search by name, father's name, phone, village, or donor ID..."
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-maroon-400 hover:text-maroon-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </Card>

      {/* Donor List */}
      <Card className="p-0 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="w-7 h-7" />}
            title="No donors found"
            message={donors.length === 0 ? "Import a donor master file or add donors manually." : "Try adjusting your search."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-saffron-50 dark:bg-maroon-800/60 text-left text-maroon-600 dark:text-cream/70 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 font-semibold">Donor ID</th>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold hidden sm:table-cell">Father's Name</th>
                  <th className="px-4 py-3 font-semibold hidden md:table-cell">Phone</th>
                  <th className="px-4 py-3 font-semibold hidden lg:table-cell">Village</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 500).map((d, i) => (
                  <tr key={d.id} className={`border-t border-saffron-100 dark:border-maroon-800 hover:bg-saffron-50/60 dark:hover:bg-maroon-800/40 transition ${i % 2 === 0 ? '' : 'bg-cream/40 dark:bg-maroon-950/30'}`}>
                    <td className="px-4 py-3 font-mono text-xs text-maroon-500 dark:text-gold-300">
                      {d.donor_id || <span className="text-maroon-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-saffron-gradient flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {d.name.charAt(0)}
                        </div>
                        <p className="font-medium text-maroon-800 dark:text-cream truncate">{d.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-maroon-600 dark:text-cream/70">{d.father_name || '—'}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-maroon-500 dark:text-cream/60">{d.phone || '—'}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-maroon-500 dark:text-cream/60">{d.village || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(d)} className="btn-ghost h-8 w-8 p-0 rounded-lg" aria-label="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(d)} className="btn-ghost h-8 w-8 p-0 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30" aria-label="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > 500 && (
              <div className="px-4 py-3 text-center text-xs text-maroon-500 dark:text-cream/60 bg-saffron-50/50 dark:bg-maroon-900/40">
                Showing first 500 of {filtered.length} donors. Refine your search to see more.
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Import Preview Modal */}
      {importPreview && (
        <Modal open onClose={() => !importing && setImportPreview(null)} title="Import Preview">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 p-3 text-center">
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{importPreview.newRows.length}</p>
                <p className="text-xs text-green-600 dark:text-green-400">New Donors</p>
              </div>
              <div className="rounded-xl bg-gold-50 dark:bg-gold-900/30 border border-gold-200 dark:border-gold-700 p-3 text-center">
                <p className="text-2xl font-bold text-gold-700 dark:text-gold-300">{importPreview.duplicateRows.length}</p>
                <p className="text-xs text-gold-600 dark:text-gold-400">Duplicates (skipped)</p>
              </div>
              <div className="rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 p-3 text-center">
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{importPreview.existingCount}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">Existing</p>
              </div>
            </div>

            <div className="flex gap-2">
              <label className={`flex-1 p-3 rounded-xl border-2 cursor-pointer transition ${importMode === 'merge' ? 'border-saffron-500 bg-saffron-50 dark:bg-saffron-900/30' : 'border-saffron-200 dark:border-maroon-700 hover:border-saffron-300'}`}>
                <input type="radio" name="importMode" checked={importMode === 'merge'} onChange={() => setImportMode('merge')} className="sr-only" />
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full border-2 ${importMode === 'merge' ? 'border-saffron-500 bg-saffron-500' : 'border-maroon-300'}`} />
                  <div>
                    <p className="text-sm font-semibold text-maroon-800 dark:text-cream">Merge</p>
                    <p className="text-xs text-maroon-500 dark:text-cream/60">Add new donors, keep existing</p>
                  </div>
                </div>
              </label>
              <label className={`flex-1 p-3 rounded-xl border-2 cursor-pointer transition ${importMode === 'replace' ? 'border-red-500 bg-red-50 dark:bg-red-900/30' : 'border-saffron-200 dark:border-maroon-700 hover:border-saffron-300'}`}>
                <input type="radio" name="importMode" checked={importMode === 'replace'} onChange={() => setImportMode('replace')} className="sr-only" />
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full border-2 ${importMode === 'replace' ? 'border-red-500 bg-red-500' : 'border-maroon-300'}`} />
                  <div>
                    <p className="text-sm font-semibold text-maroon-800 dark:text-cream">Replace All</p>
                    <p className="text-xs text-maroon-500 dark:text-cream/60">Delete all, then import. Donations are NOT affected.</p>
                  </div>
                </div>
              </label>
            </div>

            {importPreview.duplicateRows.length > 0 && (
              <div className="rounded-xl bg-gold-50 dark:bg-gold-900/20 border border-gold-200 dark:border-gold-700 p-3">
                <p className="text-xs font-medium text-gold-700 dark:text-gold-300 mb-2">
                  {importPreview.duplicateRows.length} duplicates will be skipped:
                </p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {importPreview.duplicateRows.slice(0, 20).map((r, i) => (
                    <p key={i} className="text-xs text-maroon-600 dark:text-cream/70">
                      {r.name} {r.father_name && `— ${r.father_name}`} {r.phone && `— ${r.phone}`}
                    </p>
                  ))}
                  {importPreview.duplicateRows.length > 20 && (
                    <p className="text-xs text-maroon-400">...and {importPreview.duplicateRows.length - 20} more</p>
                  )}
                </div>
              </div>
            )}

            {importPreview.newRows.length > 0 && (
              <div className="max-h-48 overflow-y-auto rounded-xl border border-saffron-100 dark:border-maroon-700">
                <table className="w-full text-xs">
                  <thead className="bg-saffron-50 dark:bg-maroon-800/60 text-maroon-600 dark:text-cream/70 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">Name</th>
                      <th className="px-3 py-2 text-left font-semibold">Father</th>
                      <th className="px-3 py-2 text-left font-semibold">Phone</th>
                      <th className="px-3 py-2 text-left font-semibold">Village</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.newRows.slice(0, 100).map((r, i) => (
                      <tr key={i} className="border-t border-saffron-50 dark:border-maroon-800">
                        <td className="px-3 py-2 text-maroon-800 dark:text-cream">{r.name}</td>
                        <td className="px-3 py-2 text-maroon-500 dark:text-cream/60">{r.father_name || '—'}</td>
                        <td className="px-3 py-2 text-maroon-500 dark:text-cream/60">{r.phone || '—'}</td>
                        <td className="px-3 py-2 text-maroon-500 dark:text-cream/60">{r.village || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setImportPreview(null)} disabled={importing} className="btn-ghost px-5 py-2.5">Cancel</button>
              <button
                onClick={confirmImport}
                disabled={importing || importPreview.newRows.length === 0}
                className="btn-primary px-5 py-2.5"
              >
                {importing
                  ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Importing...</span>
                  : <><Upload className="w-4 h-4" /> Import {importPreview.newRows.length} Donors</>}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Donor' : 'Add Donor'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Donor ID (optional)</label>
            <input
              value={form.donor_id}
              onChange={(e) => setForm({ ...form, donor_id: e.target.value })}
              className="input"
              placeholder="External ID from your records"
            />
          </div>
          <div>
            <label className="label">Name <span className="text-red-500">*</span></label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              placeholder="Donor name"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="label">Father's Name</label>
            <input
              value={form.father_name}
              onChange={(e) => setForm({ ...form, father_name: e.target.value })}
              className="input"
              placeholder="Father's name"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input"
                placeholder="98480XXXXX"
              />
            </div>
            <div>
              <label className="label">Village / Area</label>
              <input
                value={form.village}
                onChange={(e) => setForm({ ...form, village: e.target.value })}
                className="input"
                placeholder="Village or area"
              />
            </div>
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="input min-h-[60px]"
              placeholder="Internal notes"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost px-5 py-2.5">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary px-5 py-2.5">
              {saving ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Saving...</span> : <><Save className="w-4 h-4" /> Save</>}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
