import { useRef, useState } from 'react';
import { Upload, Trash2, ImageIcon, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ImageUploadProps {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  bucket?: string;
  folder?: string;
  hint?: string;
  aspectClass?: string; // e.g. "aspect-square" or "aspect-video"
}

export function ImageUpload({
  label,
  value,
  onChange,
  bucket = 'image-uploads',
  folder = 'uploads',
  hint,
  aspectClass = 'aspect-square',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, or WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5 MB.');
      return;
    }
    setError(null);
    setUploading(true);

    // Delete the old file first if it was in our bucket
    if (value) {
      try {
        const urlObj = new URL(value);
        const pathParts = urlObj.pathname.split(`/storage/v1/object/public/${bucket}/`);
        if (pathParts.length > 1) {
          await supabase.storage.from(bucket).remove([pathParts[1]]);
        }
      } catch {
        // ignore delete errors — old file may not exist
      }
    }

    const ext = file.name.split('.').pop() ?? 'jpg';
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { data, error: uploadErr } = await supabase.storage
      .from(bucket)
      .upload(filename, file, { upsert: true, contentType: file.type });

    if (uploadErr || !data) {
      setError(uploadErr?.message ?? 'Upload failed. Please try again.');
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
    onChange(publicUrl);
    setUploading(false);
  }

  async function handleDelete() {
    if (!confirm(`Remove this ${label.toLowerCase()} image? This cannot be undone.`)) return;
    if (value) {
      try {
        const urlObj = new URL(value);
        const pathParts = urlObj.pathname.split(`/storage/v1/object/public/${bucket}/`);
        if (pathParts.length > 1) {
          await supabase.storage.from(bucket).remove([pathParts[1]]);
        }
      } catch {
        // ignore
      }
    }
    onChange(null);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className="space-y-2">
      <label className="label">{label}</label>
      {hint && <p className="text-xs text-maroon-400 dark:text-cream/50 -mt-1">{hint}</p>}

      {value ? (
        <div className="relative group rounded-2xl overflow-hidden border border-saffron-200 dark:border-maroon-700 bg-saffron-50 dark:bg-maroon-900/40">
          <div className={`${aspectClass} w-full max-w-xs mx-auto`}>
            <img src={value} alt={label} className="w-full h-full object-contain" />
          </div>
          {/* overlay actions */}
          <div className="absolute inset-0 bg-maroon-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/90 text-maroon-800 text-xs font-semibold hover:bg-white transition"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Replace
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition"
            >
              <Trash2 className="w-4 h-4" /> Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => !uploading && inputRef.current?.click()}
          className="relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-saffron-300 dark:border-maroon-700 bg-saffron-50/60 dark:bg-maroon-900/30 p-8 cursor-pointer hover:border-saffron-500 hover:bg-saffron-100/60 dark:hover:bg-maroon-800/40 transition-all"
        >
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-saffron-500 animate-spin" />
              <p className="text-sm text-maroon-500 dark:text-cream/60">Uploading…</p>
            </>
          ) : (
            <>
              <div className="h-14 w-14 rounded-2xl bg-saffron-100 dark:bg-maroon-800 flex items-center justify-center">
                <ImageIcon className="w-7 h-7 text-saffron-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-maroon-700 dark:text-cream/80">
                  <span className="text-saffron-600 dark:text-saffron-300">Click to upload</span> or drag & drop
                </p>
                <p className="text-xs text-maroon-400 dark:text-cream/50 mt-1">JPG, PNG, WebP · max 5 MB</p>
              </div>
              <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-saffron-gradient text-white text-xs font-semibold shadow-sm pointer-events-none">
                <Upload className="w-3.5 h-3.5" /> Choose Image
              </div>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
      />
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" /> {error}
        </p>
      )}
    </div>
  );
}
