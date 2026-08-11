import { useState, useRef, useCallback } from 'react';
import {
  Upload, Trash2, Loader2, ImageIcon, GripVertical, Pencil, X,
  ArrowUp, ArrowDown, Check, AlertCircle, Plus,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Card, Badge, Modal, EmptyState } from '@/components/ui';
import type { GalleryItem } from '@/lib/types';

interface GalleryManagerProps {
  items: GalleryItem[];
  onRefresh: () => void;
}

interface UploadEntry {
  file: File;
  previewUrl: string;
  title: string;
  album: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

function compressImage(file: File, maxDim = 1600, quality = 0.82): Promise<File> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return resolve(file);
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(file);
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file);
          const compressed = new File([blob], file.name.replace(/\.\w+$/, '.webp'), { type: 'image/webp' });
          resolve(compressed);
        },
        'image/webp',
        quality,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

export function GalleryManager({ items, onRefresh }: GalleryManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [batch, setBatch] = useState<UploadEntry[]>([]);
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAlbum, setEditAlbum] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [reordering, setReordering] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (arr.length === 0) return;
    setBatch((prev) => [
      ...prev,
      ...arr.map((f) => ({
        file: f,
        previewUrl: URL.createObjectURL(f),
        title: f.name.replace(/\.\w+$/, ''),
        album: '',
        status: 'pending' as const,
      })),
    ]);
  }, []);

  async function handleUploadAll() {
    if (batch.length === 0) return;
    setUploading(true);
    const maxSort = items.reduce((m, g) => Math.max(m, g.sort_order ?? 0), -1);
    let order = maxSort + 1;

    const updated = [...batch];
    for (let i = 0; i < updated.length; i++) {
      updated[i] = { ...updated[i], status: 'uploading' };
      setBatch([...updated]);
      try {
        const compressed = await compressImage(updated[i].file);
        const ext = compressed.name.split('.').pop() ?? 'webp';
        const filename = `gallery/${Date.now()}-${i}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { data, error: uploadErr } = await supabase.storage
          .from('image-uploads')
          .upload(filename, compressed, { contentType: compressed.type, upsert: false });
        if (uploadErr || !data) throw new Error(uploadErr?.message ?? 'Upload failed');
        const { data: { publicUrl } } = supabase.storage.from('image-uploads').getPublicUrl(data.path);
        const { error: dbErr } = await supabase.from('gallery').insert({
          url: publicUrl,
          thumbnail: publicUrl,
          title: updated[i].title || updated[i].file.name.replace(/\.\w+$/, ''),
          album: updated[i].album || 'General',
          type: 'photo',
          sort_order: order++,
          date: new Date().toISOString(),
        });
        if (dbErr) throw new Error(dbErr.message);
        updated[i] = { ...updated[i], status: 'done' };
        setBatch([...updated]);
      } catch (err) {
        updated[i] = { ...updated[i], status: 'error', error: err instanceof Error ? err.message : 'Failed' };
        setBatch([...updated]);
      }
    }
    setUploading(false);
    onRefresh();
    setTimeout(() => {
      setBatch((prev) => prev.filter((e) => e.status !== 'done'));
    }, 2000);
  }

  function removeBatchEntry(idx: number) {
    setBatch((prev) => {
      URL.revokeObjectURL(prev[idx].previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  }

  async function handleDelete(item: GalleryItem) {
    if (!confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    try {
      if (item.url) {
        const urlObj = new URL(item.url);
        const pathParts = urlObj.pathname.split('/storage/v1/object/public/image-uploads/');
        if (pathParts.length > 1) {
          await supabase.storage.from('image-uploads').remove([pathParts[1]]);
        }
      }
      const { error } = await supabase.from('gallery').delete().eq('id', item.id);
      if (error) { alert(error.message); return; }
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  }

  async function handleSaveEdit() {
    if (!editing) return;
    setSavingEdit(true);
    const { error } = await supabase.from('gallery').update({
      title: editTitle,
      album: editAlbum || 'General',
    }).eq('id', editing.id);
    setSavingEdit(false);
    if (error) { alert(error.message); return; }
    setEditing(null);
    onRefresh();
  }

  async function moveItem(item: GalleryItem, dir: 'up' | 'down') {
    const sorted = [...items].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const idx = sorted.findIndex((g) => g.id === item.id);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[swapIdx];
    setReordering(true);
    await Promise.all([
      supabase.from('gallery').update({ sort_order: b.sort_order }).eq('id', a.id),
      supabase.from('gallery').update({ sort_order: a.sort_order }).eq('id', b.id),
    ]);
    setReordering(false);
    onRefresh();
  }

  const sortedItems = [...items].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  return (
    <div className="space-y-6">
      {/* Upload zone */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-xl font-bold text-maroon-800 dark:text-gold-200">Gallery Management</h3>
            <p className="text-xs text-maroon-500 dark:text-cream/60 mt-0.5">Upload images from your device — they appear instantly on the public Gallery page.</p>
          </div>
        </div>

        <div
          onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 cursor-pointer transition-all ${
            dragOver
              ? 'border-saffron-500 bg-saffron-100/70 dark:bg-maroon-800/50'
              : 'border-saffron-300 dark:border-maroon-700 bg-saffron-50/60 dark:bg-maroon-900/30 hover:border-saffron-500 hover:bg-saffron-100/60 dark:hover:bg-maroon-800/40'
          }`}
        >
          <div className="h-14 w-14 rounded-2xl bg-saffron-100 dark:bg-maroon-800 flex items-center justify-center">
            <ImageIcon className="w-7 h-7 text-saffron-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-maroon-700 dark:text-cream/80">
              <span className="text-saffron-600 dark:text-saffron-300">Click to upload</span> or drag & drop multiple images
            </p>
            <p className="text-xs text-maroon-400 dark:text-cream/50 mt-1">JPG, PNG, WebP · auto-compressed to WebP · max 5 MB each</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="sr-only"
            onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }}
          />
        </div>
      </Card>

      {/* Batch upload previews */}
      {batch.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-display text-base font-semibold text-maroon-800 dark:text-gold-200">
              {batch.length} image{batch.length > 1 ? 's' : ''} ready to upload
            </h4>
            <div className="flex gap-2">
              <button onClick={() => { batch.forEach((e) => URL.revokeObjectURL(e.previewUrl)); setBatch([]); }} className="btn-ghost px-4 py-2 text-sm">
                Clear
              </button>
              <button onClick={handleUploadAll} disabled={uploading || batch.every((e) => e.status !== 'pending')} className="btn-primary px-5 py-2 text-sm">
                {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><Upload className="w-4 h-4" /> Upload All</>}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {batch.map((entry, i) => (
              <div key={i} className="relative rounded-xl overflow-hidden border border-saffron-200 dark:border-maroon-700 bg-cream/40 dark:bg-maroon-900/40">
                <div className="aspect-square">
                  <img src={entry.previewUrl} alt={entry.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-2 space-y-1.5">
                  <input
                    className="input text-xs py-1 px-2"
                    placeholder="Caption / Title"
                    value={entry.title}
                    disabled={entry.status !== 'pending'}
                    onChange={(e) => setBatch((prev) => prev.map((x, j) => j === i ? { ...x, title: e.target.value } : x))}
                  />
                  <input
                    className="input text-xs py-1 px-2"
                    placeholder="Album (e.g. Pooja)"
                    value={entry.album}
                    disabled={entry.status !== 'pending'}
                    onChange={(e) => setBatch((prev) => prev.map((x, j) => j === i ? { ...x, album: e.target.value } : x))}
                  />
                </div>
                <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                  {entry.status === 'done' && <span className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center text-white"><Check className="w-3.5 h-3.5" /></span>}
                  {entry.status === 'error' && <span className="h-6 w-6 rounded-full bg-red-500 flex items-center justify-center text-white" title={entry.error}><AlertCircle className="w-3.5 h-3.5" /></span>}
                  {entry.status === 'uploading' && <span className="h-6 w-6 rounded-full bg-saffron-500 flex items-center justify-center text-white"><Loader2 className="w-3.5 h-3.5 animate-spin" /></span>}
                  {entry.status === 'pending' && (
                    <button onClick={(e) => { e.stopPropagation(); removeBatchEntry(i); }} className="h-6 w-6 rounded-full bg-maroon-950/70 flex items-center justify-center text-white hover:bg-red-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Existing gallery items */}
      <Card>
        <h4 className="font-display text-base font-semibold text-maroon-800 dark:text-gold-200 mb-4">
          Gallery Images ({items.length})
        </h4>
        {items.length === 0 ? (
          <EmptyState icon={<ImageIcon className="w-7 h-7" />} title="No images yet" message="Upload images using the area above." />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {sortedItems.map((item, idx) => (
              <div key={item.id} className="relative group rounded-xl overflow-hidden border border-saffron-200 dark:border-maroon-700 bg-cream/40 dark:bg-maroon-900/40">
                <div className="aspect-square">
                  <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-2">
                  <p className="text-sm font-medium text-maroon-800 dark:text-cream truncate">{item.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge color="gold">{item.album}</Badge>
                  </div>
                </div>
                <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
                  <button
                    onClick={() => moveItem(item, 'up')}
                    disabled={reordering || idx === 0}
                    className="h-6 w-6 rounded-md bg-maroon-950/60 text-white flex items-center justify-center hover:bg-maroon-950 disabled:opacity-30"
                    title="Move up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveItem(item, 'down')}
                    disabled={reordering || idx === sortedItems.length - 1}
                    className="h-6 w-6 rounded-md bg-maroon-950/60 text-white flex items-center justify-center hover:bg-maroon-950 disabled:opacity-30"
                    title="Move down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => { setEditing(item); setEditTitle(item.title); setEditAlbum(item.album); }}
                    className="h-7 w-7 rounded-md bg-white/90 text-maroon-700 flex items-center justify-center hover:bg-white"
                    title="Edit caption"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="h-7 w-7 rounded-md bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Image Details">
        {editing && (
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden">
              <img src={editing.url} alt={editing.title} className="w-full max-h-64 object-contain bg-maroon-950/10 dark:bg-maroon-900/40 rounded-xl" />
            </div>
            <div>
              <label className="label">Caption / Title</label>
              <input className="input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Image title" />
            </div>
            <div>
              <label className="label">Album</label>
              <input className="input" value={editAlbum} onChange={(e) => setEditAlbum(e.target.value)} placeholder="e.g. Pooja, Cultural" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditing(null)} className="btn-ghost px-5 py-2.5">Cancel</button>
              <button onClick={handleSaveEdit} disabled={savingEdit} className="btn-primary px-5 py-2.5">
                {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
