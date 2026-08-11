import { useState } from 'react';
import {
  Home, Award, CalendarDays, Pin, Images, HandCoins, Receipt,
  Save, Loader2, LogOut, Banknote, ScrollText, KeyRound,
  CheckCircle2, AlertCircle, Eye, EyeOff, Settings2, Users,
  ChevronRight, LayoutDashboard, Clock, FileText,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { useData } from '@/lib/data-context';
import { supabase } from '@/lib/supabase';
import { DONATION_METHODS, EVENT_TYPES, EXPENSE_CATEGORIES } from '@/lib/data';
import type { Settings, Sponsor, FestivalEvent, Announcement, GalleryItem, Member, AuditLogEntry } from '@/lib/types';
import { formatINR, formatDate } from '@/lib/format';
import { Card, SectionHeading, Loader, Badge } from '@/components/ui';
import { AdminSection, type FieldDef } from '@/components/admin/AdminSection';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { DonationsPage } from '@/pages/DonationsPage';
import { ExpensesPage } from '@/pages/ExpensesPage';
import { PendingDonationsTab } from '@/components/admin/PendingDonationsTab';
import { DonorMasterTab } from '@/components/admin/DonorMasterTab';
import { GalleryManager } from '@/components/admin/GalleryManager';
import { ContentManagerTab } from '@/components/admin/ContentManagerTab';

type Tab =
  | 'home'
  | 'pending_donations'
  | 'donations'
  | 'donors'
  | 'expenses'
  | 'sponsors'
  | 'events'
  | 'announcements'
  | 'gallery'
  | 'cms'
  | 'audit'
  | 'password';

interface TabDef {
  id: Tab;
  label: string;
  icon: typeof Home;
  group: 'main' | 'content' | 'account';
}

const TABS: TabDef[] = [
  { id: 'home',              label: 'Home Management', icon: Home,        group: 'main' },
  { id: 'pending_donations', label: 'Pending Donations', icon: Clock,       group: 'main' },
  { id: 'donations',         label: 'Donations',       icon: HandCoins,   group: 'main' },
  { id: 'donors',            label: 'Donor Master',     icon: Users,       group: 'main' },
  { id: 'expenses',      label: 'Expenses',        icon: Receipt,     group: 'main' },
  { id: 'sponsors',      label: 'Sponsors',        icon: Award,       group: 'content' },
  { id: 'events',        label: 'Events',          icon: CalendarDays,group: 'content' },
  { id: 'announcements', label: 'Announcements',   icon: Pin,         group: 'content' },
  { id: 'gallery',       label: 'Gallery',         icon: Images,      group: 'content' },
  { id: 'cms',            label: 'Website Content',  icon: FileText,    group: 'content' },
  { id: 'audit',         label: 'Audit Log',       icon: ScrollText,  group: 'account' },
  { id: 'password',      label: 'Change Password', icon: KeyRound,    group: 'account' },
];

const GROUP_LABELS: Record<string, string> = {
  main: 'Financial & Home',
  content: 'Website Content',
  account: 'Account',
};

export function AdminPage() {
  const { signOut } = useApp();
  const data = useData();
  const [tab, setTab] = useState<Tab>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (data.loading) return <Loader label="Loading admin panel…" />;

  const currentTab = TABS.find(t => t.id === tab)!;
  const Icon = currentTab.icon;
  const pendingCount = data.donations.filter(d => d.approval_status === 'pending').length;

  return (
    <div className="min-h-screen bg-cream dark:bg-maroon-950">
      <div className="flex flex-col lg:flex-row gap-0 max-w-screen-2xl mx-auto">

        {/* Mobile tab bar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-maroon-950/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar nav */}
        <aside className={`
          fixed lg:sticky top-0 z-50 h-screen w-64 shrink-0
          flex flex-col bg-white dark:bg-maroon-950 border-r border-saffron-200/60 dark:border-maroon-800
          transition-transform duration-300 lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="px-4 py-5 border-b border-saffron-100 dark:border-maroon-800">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-saffron-gradient flex items-center justify-center shadow-glow-saffron">
                <Settings2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-display text-base font-bold text-maroon-800 dark:text-gold-200 leading-none">Admin Panel</p>
                <p className="text-[10px] text-maroon-400 dark:text-cream/50 mt-0.5">GaneshSeva</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto py-3">
            {(['main', 'content', 'account'] as const).map(group => (
              <div key={group} className="mb-1">
                <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-maroon-400 dark:text-cream/40">
                  {GROUP_LABELS[group]}
                </p>
                {TABS.filter(t => t.group === group).map(t => {
                  const TIcon = t.icon;
                  const active = tab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => { setTab(t.id); setSidebarOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all ${
                        active
                          ? 'bg-saffron-50 dark:bg-maroon-800/80 text-saffron-700 dark:text-gold-200 border-r-2 border-saffron-500'
                          : 'text-maroon-600 dark:text-cream/60 hover:bg-saffron-50/60 dark:hover:bg-maroon-800/40 hover:text-maroon-800 dark:hover:text-cream'
                      }`}
                    >
                      <TIcon className="w-4 h-4 shrink-0" />
                      {t.label}
                      {t.id === 'pending_donations' && pendingCount > 0 && (
                        <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-saffron-500 text-white font-bold">
                          {pendingCount}
                        </span>
                      )}
                      {active && t.id !== 'pending_donations' && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="p-3 border-t border-saffron-100 dark:border-maroon-800">
            <button
              onClick={signOut}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-maroon-500 dark:text-cream/50 hover:text-maroon-800 dark:hover:text-cream hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Mobile header */}
          <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white dark:bg-maroon-950 border-b border-saffron-200/60 dark:border-maroon-800 sticky top-0 z-30">
            <button
              onClick={() => setSidebarOpen(true)}
              className="h-9 w-9 rounded-xl flex items-center justify-center bg-saffron-50 dark:bg-maroon-800 text-maroon-600 dark:text-cream"
            >
              <LayoutDashboard className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <Icon className="w-4 h-4 text-saffron-600 shrink-0" />
              <span className="font-semibold text-maroon-800 dark:text-cream truncate">{currentTab.label}</span>
            </div>
            <button onClick={signOut} className="ml-auto h-9 w-9 rounded-xl flex items-center justify-center bg-saffron-50 dark:bg-maroon-800 text-maroon-500 dark:text-cream/60">
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            {/* Page heading — desktop only */}
            <div className="hidden lg:flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-saffron-50 dark:bg-maroon-800 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-saffron-600 dark:text-saffron-300" />
                </div>
                <div>
                  <h1 className="font-display text-xl font-bold text-maroon-800 dark:text-gold-200">{currentTab.label}</h1>
                  <p className="text-xs text-maroon-400 dark:text-cream/50">Admin Panel</p>
                </div>
              </div>
              <button onClick={signOut} className="btn-outline px-4 py-2 text-sm flex items-center gap-2">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>

            {tab === 'home'              && <HomeManagementTab settings={data.settings} members={data.members} onRefresh={data.refresh} />}
            {tab === 'pending_donations' && <PendingDonationsTab />}
            {tab === 'donations'         && <DonationsPage />}
            {tab === 'donors'            && <DonorMasterTab />}
            {tab === 'expenses'      && <ExpensesPage />}
            {tab === 'sponsors'      && <SponsorsTab items={data.sponsors} onRefresh={data.refresh} />}
            {tab === 'events'        && <EventsTab items={data.events} onRefresh={data.refresh} />}
            {tab === 'announcements' && <AnnouncementsTab items={data.announcements} onRefresh={data.refresh} />}
            {tab === 'gallery'       && <GalleryManager items={data.gallery} onRefresh={data.refresh} />}
            {tab === 'cms'            && <ContentManagerTab />}
            {tab === 'audit'         && <AuditTab items={data.auditLog} />}
            {tab === 'password'      && <ChangePasswordTab />}
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── Home Management Tab ──────────────────────────────────────────────────────
function HomeManagementTab({
  settings,
  members,
  onRefresh,
}: {
  settings: Settings | null;
  members: Member[];
  onRefresh: () => void;
}) {
  const [form, setForm] = useState<Settings>(settings ?? ({} as Settings));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'identity' | 'images' | 'contact' | 'bank' | 'members'>('identity');

  const set = (k: keyof Settings, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    const payload = { ...form };
    if (payload.festival_date === '') (payload as Record<string, unknown>).festival_date = null;
    const { error } = await supabase.from('settings').update(payload).eq('key', 'main');
    setSaving(false);
    if (error) { setSaveError(error.message); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    onRefresh();
  }

  const sections = [
    { id: 'identity' as const, label: 'Committee Info' },
    { id: 'images' as const, label: 'Hero & QR Images' },
    { id: 'contact' as const, label: 'Contact Details' },
    { id: 'bank' as const, label: 'Bank & UPI' },
    { id: 'members' as const, label: 'Members' },
  ];

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Section tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-saffron-50 dark:bg-maroon-900/60 rounded-2xl border border-saffron-100 dark:border-maroon-800">
        {sections.map(s => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveSection(s.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeSection === s.id
                ? 'bg-white dark:bg-maroon-800 text-maroon-800 dark:text-gold-200 shadow-sm'
                : 'text-maroon-500 dark:text-cream/60 hover:text-maroon-700 dark:hover:text-cream'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ── Committee Identity ── */}
      {activeSection === 'identity' && (
        <Card>
          <h3 className="font-display text-base font-semibold text-maroon-800 dark:text-gold-200 mb-4">Committee Identity</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Committee Name (English)</label>
              <input className="input" value={form.committee_name ?? ''} onChange={e => set('committee_name', e.target.value)} placeholder="Sri Vinayaka Chavithi Committee" />
            </div>
            <div>
              <label className="label">Committee Name (Telugu)</label>
              <input className="input font-telugu" value={form.committee_name_te ?? ''} onChange={e => set('committee_name_te', e.target.value)} placeholder="తెలుగు పేరు" />
            </div>
            <div>
              <label className="label">Village / Location</label>
              <input className="input" value={form.village ?? ''} onChange={e => set('village', e.target.value)} placeholder="Dandagarra, Andhra Pradesh" />
            </div>
            <div>
              <label className="label">Festival Year</label>
              <input type="number" className="input" value={form.year ?? ''} onChange={e => set('year', Number(e.target.value))} />
            </div>
            <div>
              <label className="label">Festival Date (Avahanam)</label>
              <input type="date" className="input" value={form.festival_date ? String(form.festival_date).slice(0, 10) : ''} onChange={e => set('festival_date', e.target.value || null)} />
            </div>
            <div>
              <label className="label">President Name</label>
              <input className="input" value={form.president ?? ''} onChange={e => set('president', e.target.value)} placeholder="President name" />
            </div>
            <div>
              <label className="label">Donation Goal (₹)</label>
              <input type="number" className="input" value={form.donation_goal ?? ''} onChange={e => set('donation_goal', Number(e.target.value))} />
            </div>
          </div>
        </Card>
      )}

      {/* ── Images ── */}
      {activeSection === 'images' && (
        <div className="space-y-4">
          <Card>
            <h3 className="font-display text-base font-semibold text-maroon-800 dark:text-gold-200 mb-1">Hero Ganesha Image</h3>
            <p className="text-xs text-maroon-500 dark:text-cream/60 mb-4">
              This image appears on the home page hero section. Upload a portrait-style photo of Lord Ganesha.
              If removed, a decorative illustration will be shown instead.
            </p>
            <ImageUpload
              label="Ganesha Hero Image"
              value={form.ganesh_image_url ?? null}
              onChange={url => set('ganesh_image_url', url)}
              folder="ganesh"
              aspectClass="aspect-[3/4]"
              hint="Portrait orientation recommended (3:4 ratio). Max 5 MB."
            />
          </Card>

          <Card>
            <h3 className="font-display text-base font-semibold text-maroon-800 dark:text-gold-200 mb-1">UPI QR Code Image</h3>
            <p className="text-xs text-maroon-500 dark:text-cream/60 mb-4">
              Displayed on the Donations and Contact pages so donors can scan and pay via UPI.
            </p>
            <ImageUpload
              label="UPI QR Code"
              value={form.upi_qr_url ?? null}
              onChange={url => set('upi_qr_url', url ?? '')}
              folder="qr"
              aspectClass="aspect-square"
              hint="Square image recommended. Max 5 MB."
            />
          </Card>

          <Card>
            <h3 className="font-display text-base font-semibold text-maroon-800 dark:text-gold-200 mb-4">Logo & Banner URLs</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Logo URL</label>
                <input className="input" value={form.logo_url ?? ''} onChange={e => set('logo_url', e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <label className="label">Banner URL</label>
                <input className="input" value={form.banner_url ?? ''} onChange={e => set('banner_url', e.target.value)} placeholder="https://..." />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── Contact ── */}
      {activeSection === 'contact' && (
        <Card>
          <h3 className="font-display text-base font-semibold text-maroon-800 dark:text-gold-200 mb-4">Contact Information</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone ?? ''} onChange={e => set('phone', e.target.value)} placeholder="98480XXXXX" />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email ?? ''} onChange={e => set('email', e.target.value)} placeholder="committee@example.com" />
            </div>
            <div>
              <label className="label">WhatsApp (with country code)</label>
              <input className="input" value={form.whatsapp ?? ''} onChange={e => set('whatsapp', e.target.value)} placeholder="919848XXXXXX" />
            </div>
            <div>
              <label className="label">Address</label>
              <input className="input" value={form.address ?? ''} onChange={e => set('address', e.target.value)} placeholder="Full address" />
            </div>
          </div>
        </Card>
      )}

      {/* ── Bank & UPI ── */}
      {activeSection === 'bank' && (
        <Card>
          <h3 className="font-display text-base font-semibold text-maroon-800 dark:text-gold-200 mb-4 flex items-center gap-2">
            <Banknote className="w-4 h-4 text-saffron-500" /> Bank & UPI Details
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Bank Name</label>
              <input className="input" value={form.bank_name ?? ''} onChange={e => set('bank_name', e.target.value)} placeholder="Bank name" />
            </div>
            <div>
              <label className="label">Account Name</label>
              <input className="input" value={form.bank_account_name ?? ''} onChange={e => set('bank_account_name', e.target.value)} placeholder="Account holder name" />
            </div>
            <div>
              <label className="label">Account Number</label>
              <input className="input" value={form.bank_account_number ?? ''} onChange={e => set('bank_account_number', e.target.value)} placeholder="Account number" />
            </div>
            <div>
              <label className="label">IFSC Code</label>
              <input className="input" value={form.bank_ifsc ?? ''} onChange={e => set('bank_ifsc', e.target.value)} placeholder="IFSC code" />
            </div>
            <div>
              <label className="label">UPI ID</label>
              <input className="input" value={form.upi_id ?? ''} onChange={e => set('upi_id', e.target.value)} placeholder="committee@upi" />
            </div>
          </div>
          <p className="text-xs text-maroon-400 dark:text-cream/50 mt-3">
            To update the UPI QR code image, switch to the "Hero & QR Images" section.
          </p>
        </Card>
      )}

      {/* ── Members ── */}
      {activeSection === 'members' && (
        <Card>
          <MembersSection members={members} onRefresh={onRefresh} />
        </Card>
      )}

      {/* Save bar */}
      <div className="sticky bottom-4 flex items-center gap-3 justify-end">
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
          saved
            ? 'bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700 opacity-100'
            : 'opacity-0 pointer-events-none'
        }`}>
          <CheckCircle2 className="w-4 h-4" /> Saved successfully
        </div>
        {saveError && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" /> {saveError}
          </p>
        )}
        <button
          type="submit"
          disabled={saving || activeSection === 'members'}
          className="btn-primary px-6 py-3 shadow-lg"
        >
          {saving
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
            : <><Save className="w-4 h-4" /> Save Changes</>
          }
        </button>
      </div>
    </form>
  );
}

// ─── Members sub-section (inside Home Management) ─────────────────────────────
function MembersSection({ members, onRefresh }: { members: Member[]; onRefresh: () => void }) {
  const fields: FieldDef[] = [
    { name: 'name', label: 'Name (English)', placeholder: 'Full name' },
    { name: 'name_te', label: 'Name (Telugu)', placeholder: 'తెలుగు పేరు' },
    { name: 'position', label: 'Position (English)', placeholder: 'e.g. Secretary' },
    { name: 'position_te', label: 'Position (Telugu)', placeholder: 'హోదా' },
    { name: 'phone', label: 'Phone', placeholder: '98480XXXXX' },
    { name: 'photo', label: 'Photo URL', placeholder: 'https://...' },
    { name: 'sort_order', label: 'Sort Order', type: 'number' },
  ];
  return (
    <AdminSection<Member>
      table="members"
      title="Committee Members"
      items={members}
      fields={fields}
      onRefresh={onRefresh}
      emptyMessage="Add committee members to display them on the Home page."
      defaultValues={{ sort_order: 0 } as Partial<Member>}
      renderRow={m => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-saffron-gradient flex items-center justify-center text-white font-bold shrink-0 overflow-hidden">
            {m.photo ? <img src={m.photo} alt={m.name} className="w-full h-full object-cover" /> : m.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-maroon-800 dark:text-cream truncate">{m.name}</p>
            <p className="text-xs text-maroon-500 dark:text-cream/60">{m.position}</p>
          </div>
        </div>
      )}
    />
  );
}

// ─── Sponsors Tab ─────────────────────────────────────────────────────────────
function SponsorsTab({ items, onRefresh }: { items: Sponsor[]; onRefresh: () => void }) {
  const fields: FieldDef[] = [
    { name: 'name', label: 'Sponsor Name', placeholder: 'Business name' },
    { name: 'business', label: 'Sponsored Item / Purpose', placeholder: 'What they sponsor' },
    { name: 'contribution', label: 'Contribution (₹)', type: 'number' },
    { name: 'phone', label: 'Phone', placeholder: '98480XXXXX' },
    { name: 'logo', label: 'Logo URL', placeholder: 'https://...' },
    { name: 'sort_order', label: 'Sort Order', type: 'number' },
  ];
  return (
    <Card>
      <AdminSection<Sponsor>
        table="sponsors" title="Sponsors" items={items} fields={fields} onRefresh={onRefresh}
        emptyMessage="Add sponsors to display them on the Sponsors page."
        defaultValues={{ contribution: 0, sort_order: 0 } as Partial<Sponsor>}
        renderRow={s => (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gold-gradient flex items-center justify-center text-maroon-950 font-bold shrink-0 overflow-hidden">
              {s.logo ? <img src={s.logo} alt={s.name} className="w-full h-full object-cover" /> : s.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-maroon-800 dark:text-cream truncate">{s.name}</p>
              <p className="text-xs text-maroon-500 dark:text-cream/60">{s.business || 'Sponsor'} · {formatINR(s.contribution)}</p>
            </div>
          </div>
        )}
      />
    </Card>
  );
}

// ─── Events Tab ───────────────────────────────────────────────────────────────
function EventsTab({ items, onRefresh }: { items: FestivalEvent[]; onRefresh: () => void }) {
  const fields: FieldDef[] = [
    { name: 'day', label: 'Day Number', type: 'number' },
    { name: 'date', label: 'Date', type: 'date' },
    { name: 'time', label: 'Time', placeholder: 'e.g. 06:00 PM' },
    { name: 'title', label: 'Title (English)', placeholder: 'Event title' },
    { name: 'title_te', label: 'Title (Telugu)', placeholder: 'తెలుగు శీర్షిక' },
    { name: 'type', label: 'Type', type: 'select', options: EVENT_TYPES.map(t => ({ value: t.value, label: t.label })) },
    { name: 'description', label: 'Description', type: 'textarea' },
  ];
  return (
    <Card>
      <AdminSection<FestivalEvent>
        table="events" title="Festival Events" items={items} fields={fields} onRefresh={onRefresh}
        emptyMessage="Add festival events to display them on the Events page."
        defaultValues={{ day: 1, type: 'pooja' } as Partial<FestivalEvent>}
        renderRow={e => (
          <div className="min-w-0">
            <p className="font-medium text-maroon-800 dark:text-cream truncate">Day {e.day}: {e.title}</p>
            <p className="text-xs text-maroon-500 dark:text-cream/60">{e.type} · {e.time}{e.date ? ` · ${formatDate(e.date)}` : ''}</p>
          </div>
        )}
      />
    </Card>
  );
}

// ─── Announcements Tab ────────────────────────────────────────────────────────
function AnnouncementsTab({ items, onRefresh }: { items: Announcement[]; onRefresh: () => void }) {
  const fields: FieldDef[] = [
    { name: 'title', label: 'Title', placeholder: 'Announcement title' },
    { name: 'body', label: 'Body', type: 'textarea' },
    { name: 'date', label: 'Date', type: 'date' },
    { name: 'pinned', label: 'Pinned', type: 'checkbox' },
  ];
  return (
    <Card>
      <AdminSection<Announcement>
        table="announcements" title="Announcements" items={items} fields={fields} onRefresh={onRefresh}
        emptyMessage="Add announcements to display them on the Home page."
        defaultValues={{ pinned: false } as Partial<Announcement>}
        renderRow={a => (
          <div className="min-w-0">
            <p className="font-medium text-maroon-800 dark:text-cream truncate">{a.title}{a.pinned ? ' 📌' : ''}</p>
            <p className="text-xs text-maroon-500 dark:text-cream/60 truncate">{a.body}</p>
          </div>
        )}
      />
    </Card>
  );
}

// ─── Change Password Tab ──────────────────────────────────────────────────────
function ChangePasswordTab() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const errors: Record<string, string> = {};
  if (next && next.length < 8) errors.next = 'New password must be at least 8 characters';
  if (next && confirm && next !== confirm) errors.confirm = 'Passwords do not match';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (Object.keys(errors).length) return;
    setSaving(true);
    setResult(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const email = sess.session?.user?.email;
      if (!email) throw new Error('No active session');
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password: current });
      if (signInErr) throw new Error('Current password is incorrect');
      const { error: updateErr } = await supabase.auth.updateUser({ password: next });
      if (updateErr) throw updateErr;
      setResult({ type: 'success', msg: 'Password changed successfully.' });
      setCurrent(''); setNext(''); setConfirm('');
    } catch (err) {
      setResult({ type: 'error', msg: err instanceof Error ? err.message : 'Failed to change password' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="max-w-md">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-10 w-10 rounded-xl bg-saffron-100 dark:bg-saffron-900/40 flex items-center justify-center">
          <KeyRound className="w-5 h-5 text-saffron-600 dark:text-saffron-300" />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-maroon-800 dark:text-gold-200">Change Password</h3>
          <p className="text-xs text-maroon-500 dark:text-cream/60">Update your admin account password</p>
        </div>
      </div>

      {result && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm flex items-center gap-2 border ${
          result.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-700 dark:text-green-200'
            : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-700 dark:text-red-200'
        }`}>
          {result.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {result.msg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Current Password</label>
          <div className="relative">
            <input type={showCurrent ? 'text' : 'password'} required value={current} onChange={e => setCurrent(e.target.value)} className="input pr-10" placeholder="Your current password" />
            <button type="button" onClick={() => setShowCurrent(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-maroon-400">
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="label">New Password</label>
          <div className="relative">
            <input type={showNext ? 'text' : 'password'} required minLength={8} value={next} onChange={e => setNext(e.target.value)} className="input pr-10" placeholder="At least 8 characters" />
            <button type="button" onClick={() => setShowNext(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-maroon-400">
              {showNext ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.next && <p className="text-xs text-red-500 mt-1">{errors.next}</p>}
        </div>
        <div>
          <label className="label">Confirm New Password</label>
          <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} className="input" placeholder="Re-enter new password" />
          {errors.confirm && <p className="text-xs text-red-500 mt-1">{errors.confirm}</p>}
        </div>
        <button type="submit" disabled={saving || !current || !next || !confirm || Object.keys(errors).length > 0} className="btn-primary w-full py-3">
          {saving
            ? <span className="flex items-center justify-center gap-2"><span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Updating…</span>
            : <span className="flex items-center justify-center gap-2"><KeyRound className="w-4 h-4" /> Update Password</span>
          }
        </button>
      </form>
    </Card>
  );
}

// ─── Audit Log Tab ────────────────────────────────────────────────────────────
function AuditTab({ items }: { items: AuditLogEntry[] }) {
  const actionColor: Record<string, 'green' | 'gold' | 'maroon'> = {
    insert: 'green', update: 'gold', delete: 'maroon',
  };
  return (
    <Card className="p-0 overflow-hidden">
      {items.length === 0 ? (
        <div className="p-8 text-center text-maroon-500 dark:text-cream/60 text-sm">No audit entries yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-saffron-50 dark:bg-maroon-800/60 text-left text-maroon-600 dark:text-cream/70 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 font-semibold">When</th>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">Table</th>
                <th className="px-4 py-3 font-semibold hidden md:table-cell">Record ID</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a, i) => (
                <tr key={a.id} className={`border-t border-saffron-100 dark:border-maroon-800 ${i % 2 === 0 ? '' : 'bg-cream/40 dark:bg-maroon-950/30'}`}>
                  <td className="px-4 py-3 text-maroon-500 dark:text-cream/60 whitespace-nowrap">{formatDate(a.created_at)}</td>
                  <td className="px-4 py-3 text-maroon-700 dark:text-cream/80 truncate max-w-[12rem]">{a.user_email ?? '—'}</td>
                  <td className="px-4 py-3"><Badge color={actionColor[a.action]}>{a.action}</Badge></td>
                  <td className="px-4 py-3 text-maroon-600 dark:text-gold-300">{a.table_name}</td>
                  <td className="px-4 py-3 hidden md:table-cell font-mono text-xs text-maroon-400 dark:text-cream/50">{a.record_id ? a.record_id.slice(0, 8) + '…' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
