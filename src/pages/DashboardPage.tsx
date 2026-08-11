import { Link } from 'react-router-dom';
import {
  HandCoins,
  Receipt,
  Wallet,
  Target,
  TrendingUp,
  ArrowRight,
  Pin,
  Sparkles,
  CalendarDays,
  MapPin,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { useData, totalDonations, totalExpenses, currentBalance } from '@/lib/data-context';
import { GaneshaArt } from '@/components/decor/Decor';
import { t } from '@/lib/i18n';
import { useContent } from '@/lib/content-context';
import { formatINR, formatDate, timeAgo } from '@/lib/format';
import { Card, StatCard, Badge, ProgressBar, SectionHeading, EmptyState, Loader } from '@/components/ui';
import { Marigold, Lotus } from '@/components/decor/Decor';

const methodColor: Record<string, 'saffron' | 'gold' | 'maroon' | 'lotus' | 'gray'> = {
  cash: 'gray', upi: 'saffron', cheque: 'gold', bank: 'maroon',
};

export function DashboardPage() {
  const { lang } = useApp();
  const { settings, donations, expenses, announcements, loading } = useData();
  const { tc } = useContent();

  if (loading) return <Loader label={tc('common.loading', t('common.loading', lang))} />;

  const td = totalDonations(donations);
  const te = totalExpenses(expenses);
  const bal = currentBalance(donations, expenses);
  const goal = settings?.donation_goal ?? 0;
  const goalPct = goal > 0 ? Math.round((td / goal) * 100) : 0;
  const recentDonations = donations.slice(0, 5);
  const recentExpenses = expenses.slice(0, 5);

  return (
    <div className="space-y-8 pb-10">
      <SectionHeading title={tc('nav.dashboard', t('nav.dashboard', lang))} subtitle="Financial overview of the committee" />

      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-3xl shadow-glass">
        <div className="absolute inset-0 bg-gradient-to-br from-saffron-100 via-cream to-gold-100 dark:from-maroon-900 dark:via-maroon-950 dark:to-maroon-900" />
        <div className="relative grid grid-cols-1 md:grid-cols-5 items-center gap-4 px-6 sm:px-10 py-8 md:py-10">
          <div className="md:col-span-3 space-y-3 animate-fade-in">
            <Badge color="saffron"><Sparkles className="w-3.5 h-3.5" /> Dashboard</Badge>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-maroon-800 dark:text-gold-100">
              {settings?.committee_name || tc('app.name', t('appName', lang))}
            </h2>
            <p className="text-maroon-600 dark:text-cream/70 max-w-md">
              {lang === 'te'
                ? 'శ్రీ వినాయక చవితి ఉత్సవాల ఆర్థిక సమాచారం మరియు నిర్వహణ వివరాలు.'
                : 'Financial insights and management details for the Sri Vinayaka Chavithi festival.'}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Badge color="gold"><CalendarDays className="w-3.5 h-3.5" /> {settings?.year ?? ''}</Badge>
              {settings?.village && <Badge color="maroon"><MapPin className="w-3.5 h-3.5" /> {settings.village}</Badge>}
            </div>
          </div>
          <div className="md:col-span-2 flex justify-center animate-fade-in-scale">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-saffron-gradient opacity-25 blur-2xl animate-pulse" />
              {settings?.ganesh_image_url ? (
                <img
                  src={settings.ganesh_image_url}
                  alt="Lord Ganesha"
                  loading="lazy"
                  className="relative rounded-2xl object-contain shadow-glow-saffron w-[280px] h-[373px] sm:w-[340px] sm:h-[453px] md:w-[400px] md:h-[533px]"
                />
              ) : (
                <div className="relative w-[280px] h-[373px] sm:w-[340px] sm:h-[453px] md:w-[400px] md:h-[533px] flex items-center justify-center">
                  <GaneshaArt className="w-full h-full drop-shadow-2xl" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Donations" value={formatINR(td)} icon={<HandCoins className="w-6 h-6" />} accent="saffron" sub={`${donations.length} donors`} />
        <StatCard label="Total Expenses" value={formatINR(te)} icon={<Receipt className="w-6 h-6" />} accent="maroon" sub={`${expenses.length} entries`} />
        <StatCard label="Current Balance" value={formatINR(bal)} icon={<Wallet className="w-6 h-6" />} accent="gold" sub="Available funds" />
        <StatCard label="Donation Goal" value={`${goalPct}%`} icon={<Target className="w-6 h-6" />} accent="lotus" sub={formatINR(goal)} />
      </div>

      {goal > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg font-semibold text-maroon-800 dark:text-gold-200">Donation Goal Progress</h3>
            <Badge color="saffron">{formatINR(td)} / {formatINR(goal)}</Badge>
          </div>
          <ProgressBar value={td} max={goal} className="h-4" />
          <p className="mt-2 text-sm text-maroon-500 dark:text-cream/60">
            {formatINR(Math.max(0, goal - td))} remaining to reach our goal.
          </p>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold text-maroon-800 dark:text-gold-200">Recent Donations</h3>
            <Link to="/donations" className="text-sm text-saffron-600 dark:text-saffron-300 hover:underline flex items-center gap-1">
              {tc('button.view_all', t('home.viewAll', lang))} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {recentDonations.length === 0 ? (
            <EmptyState icon={<HandCoins className="w-7 h-7" />} title="No donations yet" />
          ) : (
            <div className="space-y-3">
              {recentDonations.map((d) => (
                <div key={d.id} className="flex items-center gap-3 py-2 border-b border-saffron-100 dark:border-maroon-800 last:border-0">
                  <div className="h-9 w-9 rounded-full bg-saffron-100 dark:bg-maroon-800 flex items-center justify-center text-saffron-600 dark:text-gold-300 font-bold text-sm shrink-0">
                    {d.donor_name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-maroon-800 dark:text-cream truncate">{lang === 'te' && d.donor_name_te ? d.donor_name_te : d.donor_name}</p>
                    <p className="text-xs text-maroon-400 dark:text-cream/50">{d.receipt_no} • {timeAgo(d.date)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-saffron-600 dark:text-saffron-300">{formatINR(d.amount)}</p>
                    <Badge color={methodColor[d.method]} className="mt-0.5">{d.method}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold text-maroon-800 dark:text-gold-200">Recent Expenses</h3>
            <Link to="/expenses" className="text-sm text-saffron-600 dark:text-saffron-300 hover:underline flex items-center gap-1">
              {tc('button.view_all', t('home.viewAll', lang))} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {recentExpenses.length === 0 ? (
            <EmptyState icon={<Receipt className="w-7 h-7" />} title="No expenses yet" />
          ) : (
            <div className="space-y-3">
              {recentExpenses.map((e) => (
                <div key={e.id} className="flex items-center gap-3 py-2 border-b border-saffron-100 dark:border-maroon-800 last:border-0">
                  <div className="h-9 w-9 rounded-full bg-maroon-100 dark:bg-maroon-800 flex items-center justify-center text-maroon-600 dark:text-gold-300 shrink-0">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-maroon-800 dark:text-cream truncate">{e.vendor}</p>
                    <p className="text-xs text-maroon-400 dark:text-cream/50">{formatDate(e.date)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-maroon-600 dark:text-maroon-300">{formatINR(e.amount)}</p>
                    {e.has_bill ? <Badge color="green" className="mt-0.5">Billed</Badge> : <Badge color="gray" className="mt-0.5">No bill</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-28 h-28 text-saffron-300/20"><Marigold className="w-full h-full" /></div>
        <div className="absolute -left-6 -bottom-6 w-20 h-20 text-lotus-300/20"><Lotus className="w-full h-full" /></div>
        <div className="relative">
          <h3 className="font-display text-lg font-semibold text-maroon-800 dark:text-gold-200 mb-4">Announcements</h3>
          {announcements.length === 0 ? (
            <EmptyState title="No announcements yet" />
          ) : (
            <div className="space-y-3">
              {announcements.slice(0, 4).map((a) => (
                <div key={a.id} className="flex gap-3 py-2 border-b border-saffron-100 dark:border-maroon-800 last:border-0">
                  <div className="shrink-0 h-8 w-8 rounded-lg bg-saffron-100 dark:bg-maroon-800 flex items-center justify-center text-saffron-600 dark:text-gold-300">
                    {a.pinned ? <Pin className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-maroon-800 dark:text-cream">{a.title}</p>
                      {a.pinned && <Badge color="maroon">Pinned</Badge>}
                    </div>
                    <p className="text-xs text-maroon-500 dark:text-cream/60 mt-0.5">{a.body}</p>
                    {a.date && <p className="text-[10px] text-maroon-400 dark:text-cream/40 mt-1">{timeAgo(a.date)}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
