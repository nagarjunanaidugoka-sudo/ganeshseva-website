import { useState } from 'react';
import { Images, Video, Camera, X } from 'lucide-react';
import { useApp } from '@/lib/store';
import { useData } from '@/lib/data-context';
import { t } from '@/lib/i18n';
import { useContent } from '@/lib/content-context';
import type { GalleryItem } from '@/lib/types';
import { formatDate } from '@/lib/format';
import { Card, Badge, SectionHeading, EmptyState, Modal, Loader } from '@/components/ui';
import { Mandala } from '@/components/decor/Decor';

export function GalleryPage() {
  const { lang } = useApp();
  const { gallery, loading } = useData();
  const { tc } = useContent();
  const [album, setAlbum] = useState('all');
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);

  if (loading) return <Loader label={tc('common.loading', t('common.loading', lang))} />;

  const albums = ['all', ...Array.from(new Set(gallery.map((g) => g.album)))];
  const filtered = album === 'all' ? gallery : gallery.filter((g) => g.album === album);

  return (
    <div className="space-y-8 pb-10">
      <SectionHeading title={tc('nav.gallery', t('nav.gallery', lang))} subtitle={tc('home.gallery_subtitle', 'Cherished moments from our celebrations')} />

      {gallery.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {albums.map((a) => (
            <button
              key={a}
              onClick={() => setAlbum(a)}
              className={`badge px-4 py-2 transition ${album === a ? 'bg-saffron-gradient text-white shadow-glow-saffron' : 'bg-white/60 dark:bg-maroon-900/60 text-maroon-600 dark:text-cream/70 border border-saffron-200/60 dark:border-maroon-700 hover:bg-saffron-50 dark:hover:bg-maroon-800'}`}
            >
              {a === 'all' ? 'All Albums' : a}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={<Images className="w-7 h-7" />} title={tc('home.no_photos_title', 'No photos yet')} message={tc('home.no_photos_msg', 'Photos will appear here once added from the Admin Panel.')} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((g) => (
            <button
              key={g.id}
              onClick={() => setLightbox(g)}
              className="group relative aspect-square rounded-2xl overflow-hidden shadow-glass text-left"
            >
              <img src={g.url} alt={g.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-maroon-950/85 via-maroon-950/10 to-transparent" />
              <div className="absolute top-2 right-2">
                {g.type === 'video' ? (
                  <span className="h-8 w-8 rounded-full bg-maroon-950/70 flex items-center justify-center text-white">
                    <Video className="w-4 h-4" />
                  </span>
                ) : (
                  <span className="h-8 w-8 rounded-full bg-maroon-950/70 flex items-center justify-center text-white">
                    <Camera className="w-4 h-4" />
                  </span>
                )}
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <Badge color="gold">{g.album}</Badge>
                <p className="mt-1 text-sm font-semibold text-white truncate">{g.title}</p>
                {g.date && <p className="text-[10px] text-white/70">{formatDate(g.date)}</p>}
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal open={!!lightbox} onClose={() => setLightbox(null)} title={lightbox?.title ?? ''}>
        {lightbox && (
          <div>
            <div className="relative rounded-xl overflow-hidden">
              <img src={lightbox.url} alt={lightbox.title} className="w-full max-h-[60vh] object-contain bg-maroon-950" />
              <button onClick={() => setLightbox(null)} className="absolute top-2 right-2 h-9 w-9 rounded-full bg-maroon-950/70 text-white flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <Badge color="gold">{lightbox.album}</Badge>
              <Badge color="saffron">{lightbox.type}</Badge>
              {lightbox.date && <span className="text-xs text-maroon-500 dark:text-cream/60">{formatDate(lightbox.date)}</span>}
            </div>
          </div>
        )}
      </Modal>

      {gallery.length > 0 && (
        <Card className="text-center relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 text-saffron-300/15"><Mandala className="w-full h-full animate-spin-slow" /></div>
          <div className="relative">
            <p className="font-display text-lg text-maroon-700 dark:text-gold-200">More memories coming soon</p>
            <p className="text-sm text-maroon-500 dark:text-cream/60 mt-1">Photos and videos from the festival will be added here.</p>
          </div>
        </Card>
      )}
    </div>
  );
}
