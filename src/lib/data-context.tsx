import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from './supabase';
import { useApp } from './store';
import type {
  Settings, Member, Sponsor, FestivalEvent, Announcement,
  GalleryItem, Donation, Expense, AuditLogEntry, Donor,
} from './types';

interface DataContextValue {
  settings: Settings | null;
  members: Member[];
  sponsors: Sponsor[];
  events: FestivalEvent[];
  announcements: Announcement[];
  gallery: GalleryItem[];
  donations: Donation[];
  expenses: Expense[];
  donors: Donor[];
  auditLog: AuditLogEntry[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  logAudit: (table: string, recordId: string | null, action: 'insert' | 'update' | 'delete', changes: Record<string, unknown>) => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { session } = useApp();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [events, setEvents] = useState<FestivalEvent[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        settingsRes, membersRes, sponsorsRes, eventsRes,
        announcementsRes, galleryRes, donationsRes, expensesRes,
        auditRes, donorsRes,
      ] = await Promise.all([
        supabase.from('settings').select('*').eq('key', 'main').maybeSingle(),
        supabase.from('members').select('*').order('sort_order', { ascending: true }),
        supabase.from('sponsors').select('*').order('sort_order', { ascending: true }),
        supabase.from('events').select('*').order('day', { ascending: true }),
        supabase.from('announcements').select('*').order('date', { ascending: false }),
        supabase.from('gallery').select('*').order('sort_order', { ascending: true }),
        supabase.from('donations').select('*').order('date', { ascending: false }),
        supabase.from('expenses').select('*').order('date', { ascending: false }),
        supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('donors').select('*').order('name', { ascending: true }),
      ]);

      const errs = [settingsRes, membersRes, sponsorsRes, eventsRes, announcementsRes, galleryRes, donationsRes, expensesRes, auditRes, donorsRes]
        .map((r) => r.error).filter(Boolean);
      if (errs.length) throw errs[0];

      setSettings(settingsRes.data as Settings | null);
      setMembers(membersRes.data as Member[]);
      setSponsors(sponsorsRes.data as Sponsor[]);
      setEvents(eventsRes.data as FestivalEvent[]);
      setAnnouncements(announcementsRes.data as Announcement[]);
      setGallery(galleryRes.data as GalleryItem[]);
      setDonations(donationsRes.data as Donation[]);
      setExpenses(expensesRes.data as Expense[]);
      setDonors((donorsRes.data as Donor[]) ?? []);
      setAuditLog((auditRes.data as AuditLogEntry[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  const logAudit = useCallback(async (
    table: string,
    recordId: string | null,
    action: 'insert' | 'update' | 'delete',
    changes: Record<string, unknown>,
  ) => {
    if (!session?.user) return;
    try {
      await supabase.from('audit_log').insert({
        table_name: table,
        record_id: recordId,
        action,
        changes,
        user_id: session.user.id,
        user_email: session.user.email ?? null,
      });
    } catch {
      // Audit logging is best-effort — don't block the main operation.
    }
  }, [session]);

  return (
    <DataContext.Provider value={{
      settings, members, sponsors, events, announcements, gallery, donations, expenses,
      donors, auditLog, loading, error, refresh: load, logAudit,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}

// Derived helpers
export function totalDonations(donations: Donation[]): number {
  return donations
    .filter(d => d.approval_status === 'approved' && d.payment_status === 'received')
    .reduce((s, d) => s + d.amount, 0);
}

export function approvedDonations(donations: Donation[]): Donation[] {
  return donations.filter(d => d.approval_status === 'approved');
}

export function totalExpenses(expenses: Expense[]): number {
  return expenses.reduce((s, e) => s + e.amount, 0);
}

export function currentBalance(donations: Donation[], expenses: Expense[]): number {
  return totalDonations(donations) - totalExpenses(expenses);
}
