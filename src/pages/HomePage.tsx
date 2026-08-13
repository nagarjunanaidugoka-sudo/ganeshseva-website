import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HandCoins,
  Receipt,
  ArrowRight,
  CalendarDays,
  Sparkles,
  Pin,
  MapPin,
  Phone,
  Users,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { useData, totalDonations } from '@/lib/data-context';
import { t } from '@/lib/i18n';
import { useContent } from '@/lib/content-context';
import { formatINR, formatDate, timeAgo } from '@/lib/format';
import { Card, Badge, ProgressBar, SectionHeading, Loader, EmptyState } from '@/components/ui';
import { GaneshaArt, Mandala, Marigold, Diya, Lotus, Garland, OmSymbol } from '@/components/decor/Decor';

function useCountdown(target: string | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!target) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const diff = Math.max(0, new Date(target).getTime() - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds };
}

function useCountUp(target: number, duration = 1400) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    let raf = 0;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const p = Math.min(1, (ts - start) / duration);
      setVal(Math.floor(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}


export function HomePage() {
  const { lang } = useApp();
  const { settings, members, sponsors, events, announcements, gallery, donations, expenses, loading } = useData();
  const { tc } = useContent();

  if (loading) return <Loader label={tc('common.loading', t('common.loading', lang))} />;

  const cd = useCountdown(settings?.festival_date ?? null);
  const td = totalDonations(donations);
  const totalExpenses = expences.reduce((sum, expense) => sum + Number(expense.amount || 0)),
    0
  );
  const goal = settings?.donation_goal ?? 0;
  const goalPct = goal > 0 ? Math.round((td / goal) * 100) : 0;
  const liveTotal = useCountUp(td);
  const expensesTotal = useCountUp(totalExpenses);

  const committeeName = lang === 'te' ? (settings?.committee_name_te || settings?.committee_name || '') : (settings?.committee_name || '');
  const village = settings?.village || '';
  const president = settings?.president || '';
  const ganeshImageUrl = settings?.ganesh_image_url ?? null;

  const featuredEvents = events.slice(0, 4);
  const featuredSponsors = sponsors.slice(0, 6);
  const galleryPreview = gallery.slice(0, 4);
  const pinnedAnnouncements = [...announcements].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned)).slice(0, 3);

  return (
    <div className="space-y-14 pb-10">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-saffron-100 via-cream to-gold-100 dark:from-maroon-900 dark:via-maroon-950 dark:to-maroon-900" />
        <div className="absolute -top-24 -right-16 w-96 h-96 text-saffron-400/25 dark:text-saffron-700/20">
          <Mandala className="w-full h-full animate-spin-slow" />
        </div>
        <div className="absolute top-10 left-10 w-16 h-16 text-lotus-400/40 dark:text-lotus-700/30 animate-float">
          <Lotus className="w-full h-full" />
        </div>
        <div className="absolute bottom-8 right-24 w-14 h-14 text-saffron-500/50 animate-float" style={{ animationDelay: '1.5s' }}>
          <Diya className="w-full h-full animate-flicker" />
        </div>

        <div className="relative grid lg:grid-cols-2 gap-8 items-center px-6 sm:px-10 py-12 lg:py-16">
          <div className="space-y-5 animate-fade-in">
            <Badge color="saffron" className="mb-2">
              <Sparkles className="w-3.5 h-3.5" /> {settings?.year ?? ''} Edition
            </Badge>
            <p className="font-telugu text-lg text-maroon-600 dark:text-gold-300">{tc('home.welcome', t('home.welcome', lang))}</p>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-maroon-800 dark:text-gold-100">
              {committeeName || tc('app.name', t('appName', lang))}
            </h1>
            {village && (
              <p className="flex items-center gap-2 text-maroon-600 dark:text-cream/70">
                <MapPin className="w-4 h-4" /> {village}
              </p>
            )}
            <p className="text-maroon-700 dark:text-cream/80 max-w-xl leading-relaxed">
              {tc('home.hero_description', lang === 'te' ? 'భక్తిభావంతో, సేవానిరతితో శ్రీ వినాయక చవితి ఉత్సవాలను ఘనంగా నిర్వహించడానికి మన కమిటీ సిద్ధంగా ఉంది. అందరినీ భక్తిశ్రద్ధలతో పాల్గొనమని ఆహ్వానిస్తున్నాము.' : 'With devotion and service, our committee is preparing to celebrate Sri Vinayaka Chavithi with grandeur. We invite all devotees to participate with faith and joy.')}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link to="/donate" className="btn-primary px-6 py-3">
                <HandCoins className="w-5 h-5" /> {tc('button.donate', t('home.quickDonate', lang))}
              </Link>
              <Link to="/events" className="btn-outline px-6 py-3">
                <CalendarDays className="w-5 h-5" /> {tc('nav.events', t('nav.events', lang))}
              </Link>
            </div>
          </div>

          {/* Hero image: uploaded photo or fallback SVG art */}
          <div className="relative flex justify-center animate-fade-in-scale">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-72 h-72 md:w-80 md:h-80 rounded-full bg-saffron-gradient opacity-20 blur-2xl animate-pulse" />
            </div>
            {ganeshImageUrl ? (
              <div className="relative w-64 md:w-80 animate-float">
                <img
                  src={ganeshImageUrl}
                  alt="Lord Ganesha"
                  className="w-full h-full object-contain drop-shadow-2xl rounded-2xl"
                />
              </div>
            ) : (
              <div className="relative w-64 md:w-80 animate-float">
                <GaneshaArt className="w-full h-full drop-shadow-2xl" />
              </div>
            )}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 text-saffron-400">
              <Garland className="w-full h-6" />
            </div>
          </div>
        </div>
      </section>

      {/* COUNTDOWN */}
      {settings?.festival_date && (
        <section>
          <Card className="relative overflow-hidden">
            <div className="absolute top-3 right-4 text-saffron-400/30">
              <OmSymbol className="w-10 h-10" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="font-display text-2xl font-bold text-maroon-800 dark:text-gold-200">{tc('home.countdown_title', t('home.countdown', lang))}</h2>
                <p className="text-sm text-maroon-500 dark:text-cream/60">{formatDate(settings.festival_date)} • Ganesh Avahanam</p>
              </div>
              <Badge color="maroon"><CalendarDays className="w-3.5 h-3.5" /> {tc('home.festival_badge', '9-Day Festival')}</Badge>
            </div>
            <div className="grid grid-cols-4 gap-3 sm:gap-4">
              {[
                { v: cd.days, l: tc('home.days', t('home.days', lang)) },
                { v: cd.hours, l: tc('home.hours', t('home.hours', lang)) },
                { v: cd.minutes, l: tc('home.minutes', t('home.minutes', lang)) },
                { v: cd.seconds, l: tc('home.seconds', t('home.seconds', lang)) },
              ].map((u, i) => (
                <div key={i} className="text-center rounded-2xl bg-saffron-50 dark:bg-maroon-800/60 py-4 px-2 border border-saffron-200/60 dark:border-maroon-700">
                  <p className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-gradient-saffron tabular-nums">{String(u.v).padStart(2, '0')}</p>
                  <p className="text-[10px] sm:text-xs uppercase tracking-wide text-maroon-500 dark:text-cream/60 mt-1">{u.l}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}

      {/* LIVE DONATION + EXPENSES */}
<section className="grid sm:grid-cols-2 gap-5">

  {/* Live Donations */}
  <Link to="/donations" className="block group">
    <Card hover className="relative overflow-hidden cursor-pointer transition-transform group-hover:-translate-y-1">
      <div className="absolute -right-6 -top-6 w-24 h-24 text-saffron-300/30">
        <Marigold className="w-full h-full" />
      </div>

      <div className="flex items-center gap-2 text-maroon-500 dark:text-cream/60">
        <HandCoins className="w-5 h-5 text-saffron-500" />

        <p className="text-xs font-semibold uppercase tracking-wide">
          {tc('home.live_donations_label', t('home.liveDonations', lang))}
        </p>

        <span className="ml-auto flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400 font-semibold">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          LIVE
        </span>
      </div>

      <p className="mt-2 font-display text-3xl md:text-4xl font-bold text-gradient-saffron">
        {formatINR(liveTotal)}
      </p>

      {goal > 0 && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-maroon-500 dark:text-cream/60 mb-1.5">
            <span>
              {tc('home.goal_label', 'Goal')}: {formatINR(goal)}
            </span>
            <span className="font-semibold">{goalPct}%</span>
          </div>

          <ProgressBar value={td} max={goal} />
        </div>
      )}
    </Card>
  </Link>

  {/* Expenses */}
  <Link to="/expenses" className="block group">
    <Card hover className="relative overflow-hidden cursor-pointer transition-transform group-hover:-translate-y-1">
      <div className="absolute -right-6 -top-6 w-24 h-24 text-red-300/30">
        <Receipt className="w-full h-full" />
      </div>

      <div className="flex items-center gap-2 text-maroon-500 dark:text-cream/60">
        <Receipt className="w-5 h-5 text-red-500" />

        <p className="text-xs font-semibold uppercase tracking-wide">
          Expenses
        </p>
      </div>

      <p className="mt-2 font-display text-3xl md:text-4xl font-bold text-gradient-gold">
        {formatINR(expensesTotal)}
      </p>

      <p className="mt-4 text-xs text-maroon-500 dark:text-cream/60">
        Total festival expenses
      </p>
    </Card>
  </Link>

</section>

      {/* EVENT HIGHLIGHTS */}
      <section>
        <SectionHeading
          title={tc('home.events_title', t('home.eventHighlights', lang))}
          subtitle={tc('home.events_subtitle', '9 days of devotion, culture and celebration')}
          action={<Link to="/events" className="btn-ghost text-sm">{tc('button.view_all', t('home.viewAll', lang))} <ArrowRight className="w-4 h-4" /></Link>}
        />
        {featuredEvents.length === 0 ? (
          <EmptyState icon={<CalendarDays className="w-7 h-7" />} title={tc('home.no_events_title', 'No events yet')} message={tc('home.no_events_msg', 'Events will appear here once added.')} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredEvents.map((ev) => (
              <Card key={ev.id} hover className="animate-fade-in">
                <div className="flex items-center justify-between mb-3">
                  <Badge color="saffron">Day {ev.day}</Badge>
                  <span className="text-xs text-maroon-400 dark:text-cream/50">{ev.time}</span>
                </div>
                <h3 className="font-display text-lg font-semibold text-maroon-800 dark:text-gold-200">{lang === 'te' && ev.title_te ? ev.title_te : ev.title}</h3>
                <p className="mt-2 text-sm text-maroon-500 dark:text-cream/60 line-clamp-2">{ev.description}</p>
                {ev.date && <p className="mt-3 text-xs text-maroon-400 dark:text-cream/50">{formatDate(ev.date)}</p>}
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* SPONSORS PREVIEW */}
      <section>
        <SectionHeading
          title={tc('home.sponsors_title', t('home.sponsorsPreview', lang))}
          subtitle={tc('home.sponsors_subtitle', 'Generous supporters of our festival')}
          action={<Link to="/sponsors" className="btn-ghost text-sm">{tc('button.view_all', t('home.viewAll', lang))} <ArrowRight className="w-4 h-4" /></Link>}
        />
        {featuredSponsors.length === 0 ? (
          <EmptyState icon={<HandCoins className="w-7 h-7" />} title={tc('home.no_sponsors_title', 'No sponsors yet')} message={tc('home.no_sponsors_msg', 'Sponsors will appear here once added.')} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredSponsors.map((s) => (
              <Card key={s.id} hover className="text-center">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-gold-gradient flex items-center justify-center shadow-glow-gold mb-3 overflow-hidden">
                  {s.logo ? <img src={s.logo} alt={s.name} className="w-full h-full object-cover" /> : <span className="font-display text-2xl font-bold text-maroon-950">{s.name.charAt(0)}</span>}
                </div>
                <h3 className="font-display text-lg font-semibold text-maroon-800 dark:text-gold-200">{s.name}</h3>
                <p className="text-xs text-maroon-500 dark:text-cream/60 mt-1">{s.business}</p>
                {s.contribution > 0 && <Badge color="gold" className="mt-3">{formatINR(s.contribution)}</Badge>}
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* GALLERY PREVIEW */}
      <section>
        <SectionHeading
          title={tc('home.gallery_title', t('home.galleryPreview', lang))}
          subtitle={tc('home.gallery_subtitle', 'Glimpses from previous celebrations')}
          action={<Link to="/gallery" className="btn-ghost text-sm">{tc('button.view_all', t('home.viewAll', lang))} <ArrowRight className="w-4 h-4" /></Link>}
        />
        {galleryPreview.length === 0 ? (
          <EmptyState icon={<Sparkles className="w-7 h-7" />} title={tc('home.no_photos_title', 'No photos yet')} message={tc('home.no_photos_msg', 'Photos will appear here once added.')} />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {galleryPreview.map((g) => (
              <Link to="/gallery" key={g.id} className="group relative aspect-[4/3] rounded-2xl overflow-hidden shadow-glass">
                <img src={g.url} alt={g.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-maroon-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <Badge color="gold">{g.album}</Badge>
                  <p className="mt-1 text-sm font-semibold text-white">{g.title}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* COMMITTEE MEMBERS PREVIEW */}
      {(members.length > 0 || president) && (
        <section>
          <SectionHeading
            title={tc('home.committee_title', t('home.committeeIntro', lang))}
            subtitle={tc('home.committee_subtitle', 'Dedicated volunteers serving the community')}
          />
          <Card className="relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 text-saffron-300/20">
              <Mandala className="w-full h-full animate-spin-slow" />
            </div>
            <div className="relative grid sm:grid-cols-3 gap-4">
              {members.slice(0, 3).map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-full bg-saffron-gradient flex items-center justify-center text-white font-bold shadow-glow-saffron shrink-0 overflow-hidden">
                    {m.photo
                      ? <img src={m.photo} alt={m.name} className="w-full h-full object-cover" />
                      : m.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-maroon-800 dark:text-gold-200 truncate">{lang === 'te' && m.name_te ? m.name_te : m.name}</p>
                    <p className="text-xs text-maroon-500 dark:text-cream/60">{lang === 'te' && m.position_te ? m.position_te : m.position}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="relative mt-5 flex flex-wrap gap-3">
              <Link to="/contact" className="btn-outline px-5 py-2.5 text-sm">
                <Phone className="w-4 h-4" /> {tc('home.contact_us_btn', 'Contact Us')}
              </Link>
            </div>
          </Card>
        </section>
      )}

      {/* ANNOUNCEMENTS */}
      <section>
        <SectionHeading
          title={tc('home.announcements_title', t('home.announcements', lang))}
          subtitle={tc('home.announcements_subtitle', 'Stay updated with the latest news')}
          action={<Link to="/dashboard" className="btn-ghost text-sm">{tc('button.view_all', t('home.viewAll', lang))} <ArrowRight className="w-4 h-4" /></Link>}
        />
        {pinnedAnnouncements.length === 0 ? (
          <EmptyState icon={<Pin className="w-7 h-7" />} title={tc('home.no_announcements_title', 'No announcements yet')} message={tc('home.no_announcements_msg', 'Announcements will appear here once added.')} />
        ) : (
          <div className="space-y-3">
            {pinnedAnnouncements.map((a) => (
              <Card key={a.id} hover className="flex gap-4">
                <div className="shrink-0 h-10 w-10 rounded-xl bg-saffron-100 dark:bg-maroon-800 flex items-center justify-center text-saffron-600 dark:text-gold-300">
                  {a.pinned ? <Pin className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-maroon-800 dark:text-gold-200">{a.title}</h3>
                    {a.pinned && <Badge color="maroon">{tc('home.pinned_badge', 'Pinned')}</Badge>}
                    {a.date && <span className="text-xs text-maroon-400 dark:text-cream/50">{timeAgo(a.date)}</span>}
                  </div>
                  <p className="mt-1 text-sm text-maroon-600 dark:text-cream/70">{a.body}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
