import { Award, Phone } from 'lucide-react';
import { useApp } from '@/lib/store';
import { useData } from '@/lib/data-context';
import { t } from '@/lib/i18n';
import { useContent } from '@/lib/content-context';
import type { Sponsor } from '@/lib/types';
import { Card, SectionHeading, EmptyState, Loader } from '@/components/ui';
import { Marigold, Lotus } from '@/components/decor/Decor';

function SponsorCard({ s }: { s: Sponsor }) {
  return (
    <Card hover className="text-center relative overflow-hidden">
      <div className="absolute -right-6 -top-6 w-24 h-24 text-saffron-300/20">
        <Marigold className="w-full h-full" />
      </div>
      <div className="relative mx-auto h-20 w-20 rounded-2xl bg-gold-gradient flex items-center justify-center shadow-glow-gold mb-4 overflow-hidden">
        {s.logo ? <img src={s.logo} alt={s.name} className="w-full h-full object-cover" /> : <span className="font-display text-3xl font-bold text-maroon-950">{s.name.charAt(0)}</span>}
      </div>
      <h3 className="font-display text-lg font-semibold text-maroon-800 dark:text-gold-200">{s.name}</h3>
      {s.business && <p className="text-xs text-maroon-500 dark:text-cream/60 mt-1">{s.business}</p>}
      {s.phone && (
        <a href={`tel:${s.phone}`} className="mt-3 inline-flex items-center gap-1.5 text-xs text-maroon-500 dark:text-cream/60 hover:text-saffron-600 dark:hover:text-saffron-300 transition">
          <Phone className="w-3.5 h-3.5" /> {s.phone}
        </a>
      )}
    </Card>
  );
}

export function SponsorsPage() {
  const { lang } = useApp();
  const { sponsors, loading } = useData();
  const { tc } = useContent();

  if (loading) return <Loader label={tc('common.loading', t('common.loading', lang))} />;

  return (
    <div className="space-y-10 pb-10">
      <SectionHeading title={tc('nav.sponsors', t('nav.sponsors', lang))} subtitle={tc('home.sponsors_subtitle', 'Grateful thanks to our generous supporters')} />

      {sponsors.length > 0 && (
        <Card className="text-center relative overflow-hidden">
          <div className="absolute -left-8 -top-8 w-28 h-28 text-saffron-300/20"><Marigold className="w-full h-full" /></div>
          <div className="absolute -right-8 -bottom-8 w-24 h-24 text-lotus-300/20"><Lotus className="w-full h-full" /></div>
          <div className="relative">
            <Award className="w-10 h-10 mx-auto text-gold-500" />
            <p className="mt-3 text-sm text-maroon-500 dark:text-cream/60 uppercase tracking-wide font-semibold">Our Sponsors</p>
            <p className="mt-2 text-sm text-maroon-600 dark:text-cream/70">{sponsors.length} generous sponsors supporting our festival</p>
          </div>
        </Card>
      )}

      {sponsors.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sponsors.map((s) => <SponsorCard key={s.id} s={s} />)}
        </div>
      )}

      {sponsors.length === 0 && <EmptyState icon={<Award className="w-7 h-7" />} title={tc('home.no_sponsors_title', 'No sponsors yet')} message={tc('home.no_sponsors_msg', 'Sponsors will appear here once added from the Admin Panel.')} />}
    </div>
  );
}
