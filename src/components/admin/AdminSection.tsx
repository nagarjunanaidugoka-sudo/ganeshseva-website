import { useState, type ReactNode } from 'react';
import { Plus, Pencil, Trash2, X, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Card, Badge, Modal, EmptyState } from '@/components/ui';

export interface FieldDef {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'textarea' | 'checkbox' | 'select' | 'date';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface AdminSectionProps<T extends { id: string }> {
  table: string;
  title: string;
  items: T[];
  fields: FieldDef[];
  onRefresh: () => void;
  emptyMessage?: string;
  renderRow: (item: T) => ReactNode;
  defaultValues?: Partial<T>;
}

export function AdminSection<T extends { id: string }>({
  table, title, items, fields, onRefresh, emptyMessage, renderRow, defaultValues,
}: AdminSectionProps<T>) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({});

  function openAdd() {
    setEditing(null);
    setForm(defaultValues ?? {});
    setModalOpen(true);
  }

  function openEdit(item: T) {
    setEditing(item);
    setForm({ ...item });
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload: Record<string, unknown> = { ...form };
    // convert empty date strings to null
    for (const f of fields) {
      if (f.type === 'date' && payload[f.name] === '') payload[f.name] = null;
      if (f.type === 'number') payload[f.name] = Number(payload[f.name]) || 0;
      if (f.type === 'checkbox') payload[f.name] = Boolean(payload[f.name]);
    }
    let error;
    if (editing) {
      const res = await supabase.from(table).update(payload).eq('id', editing.id);
      error = res.error;
    } else {
      const res = await supabase.from(table).insert(payload);
      error = res.error;
    }
    setSaving(false);
    if (error) { alert(error.message); return; }
    setModalOpen(false);
    onRefresh();
  }

  async function handleDelete(item: T) {
    if (!confirm('Delete this entry? This cannot be undone.')) return;
    const { error } = await supabase.from(table).delete().eq('id', item.id);
    if (error) { alert(error.message); return; }
    onRefresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-xl font-bold text-maroon-800 dark:text-gold-200">{title}</h3>
        <button onClick={openAdd} className="btn-primary px-4 py-2 text-sm">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyState title="No entries yet" message={emptyMessage} />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/60 dark:bg-maroon-900/60 border border-saffron-200/50 dark:border-maroon-700">
              <div className="flex-1 min-w-0">{renderRow(item)}</div>
              <button onClick={() => openEdit(item)} className="btn-ghost h-9 w-9 rounded-lg p-0 shrink-0" aria-label="Edit">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(item)} className="btn-ghost h-9 w-9 rounded-lg p-0 text-maroon-600 hover:text-maroon-800 dark:text-maroon-300 shrink-0" aria-label="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Edit ${title}` : `Add ${title}`}>
        <form onSubmit={handleSave} className="space-y-4">
          {fields.map((f) => (
            <div key={f.name}>
              <label className="label">{f.label}</label>
              {f.type === 'textarea' ? (
                <textarea
                  className="input min-h-[80px]"
                  name={f.name}
                  placeholder={f.placeholder}
                  value={String(form[f.name] ?? '')}
                  onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                />
              ) : f.type === 'checkbox' ? (
                <label className="flex items-center gap-2 text-sm text-maroon-600 dark:text-cream/70">
                  <input
                    type="checkbox"
                    className="accent-saffron-500"
                    checked={Boolean(form[f.name])}
                    onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.checked }))}
                  />
                  {f.label}
                </label>
              ) : f.type === 'select' ? (
                <select
                  className="input"
                  value={String(form[f.name] ?? '')}
                  onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                >
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                  className="input"
                  placeholder={f.placeholder}
                  value={f.type === 'date' ? (form[f.name] ? String(form[f.name]).slice(0, 10) : '') : String(form[f.name] ?? '')}
                  onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                />
              )}
            </div>
          ))}
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

export function AdminBadge({ children }: { children: ReactNode }) {
  return <Badge color="saffron">{children}</Badge>;
}

export { X };
