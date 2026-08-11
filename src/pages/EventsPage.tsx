import { CalendarDays, Clock, MapPin, Trophy, Music, Sparkles, Waves, Flame } from 'lucide-react';
import { useApp } from '@/lib/store';
import { useData } from '@/lib/data-context';
import { t } from '@/lib/i18n';
import { useContent } from '@/lib/content-context';
import type { FestivalEvent } from '@/lib/types';
import { formatDate } from '@/lib/format';
import { Card, Badge, SectionHeading, EmptyState, Loader } from '@/components/ui';
import { Mandala, Diya, Lotus } from '@/components/decor/Decor';

const TYPE_CONFIG: Record<FestivalEvent['type'], { icon: typeof Music; color: 'saffron' | 'gold' | 'maroon' | 'lotus'; label: string }> = {
  pooja: { icon: Flame, color: 'saffron', label: 'Pooja' },
  cultural: { icon: Music, color: 'lotus', label: 'Cultural' },
  competition: { icon: Trophy, color: 'gold', label: 'Competition' },
  nimajjanam: { icon: Waves, color: 'maroon', label: 'Nimajjanam' },
  seva: { icon: Sparkles, color: 'saffron', label: 'Seva' },
};

export function EventsPage() {
  const { lang } = useApp();
  const { events, loading } = useData();
  const { tc } = useContent();

  if (loading) return <Loader label={tc('common.loading', t('common.loading', lang))} />;

  const days = [...new Set(events.map((e) => e.day))].sort((a, b) => a - b);

  return (
    <div className="space-y-10 pb-10">
      <SectionHeading title={tc('nav.events', t('nav.events', lang))} subtitle={tc('events.page_subtitle', '9 days of devotion, culture and celebration')} />

      {events.length === 0 ? (
        <EmptyState icon={<CalendarDays className="w-7 h-7" />} title={tc('events.no_events_title', 'No events scheduled')} message={tc('home.no_events_msg', 'Events will appear here once added from the Admin Panel.')} />
      ) : (
        <div className="relative">
          <div className="absolute left-4 sm:left-6 top-2 bottom-2 w-0.5 bg-gradient-to-b from-saffron-300 via-gold-300 to-maroon-300 dark:from-saffron-700 dark:via-gold-700 dark:to-maroon-700" />

          <div className="space-y-6">
            {days.map((day) => {
              const dayEvents = events.filter((e) => e.day === day);
              return (
                <div key={day} className="relative pl-12 sm:pl-16">
                  <div className="absolute left-0 top-0 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-saffron-gradient flex items-center justify-center text-white font-display font-bold shadow-glow-saffron ring-4 ring-cream dark:ring-maroon-950">
                    {day}
                  </div>
                  <div className="mb-3">
                    <Badge color="saffron">Day {day}</Badge>
                    {dayEvents[0].date && <span className="ml-2 text-sm text-maroon-500 dark:text-cream/60">{formatDate(dayEvents[0].date)}</span>}
                  </div>
                  <div className="grid gap-3">
                    {dayEvents.map((ev) => {
                      const cfg = TYPE_CONFIG[ev.type];
                      const Icon = cfg.icon;
                      return (
                        <Card key={ev.id} hover className="relative overflow-hidden">
                          <div className="absolute -right-6 -top-6 w-20 h-20 text-saffron-300/15">
                            {ev.type === 'pooja' ? <Diya className="w-full h-full" /> : ev.type === 'nimajjanam' ? <Mandala className="w-full h-full" /> : <Lotus className="w-full h-full" />}
                          </div>
                          <div className="relative flex items-start gap-3">
                            <div className="shrink-0 h-11 w-11 rounded-xl bg-saffron-100 dark:bg-maroon-800 flex items-center justify-center text-saffron-600 dark:text-gold-300">
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-display text-lg font-semibold text-maroon-800 dark:text-gold-200">{lang === 'te' && ev.title_te ? ev.title_te : ev.title}</h3>
                                <Badge color={cfg.color}>{cfg.label}</Badge>
                              </div>
                              <p className="mt-1 text-sm text-maroon-600 dark:text-cream/70">{ev.description}</p>
                              <div className="mt-2 flex items-center gap-4 text-xs text-maroon-400 dark:text-cream/50 flex-wrap">
                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {ev.time}</span>
                                {ev.date && <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> {formatDate(ev.date)}</span>}
                                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Main Pandal</span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
