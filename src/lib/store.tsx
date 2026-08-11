import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Lang } from './types';
import { supabase, isSupabaseConfigured } from './supabase';

interface AppContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  dark: boolean;
  setDark: (d: boolean) => void;
  toggleDark: () => void;
  session: import('@supabase/supabase-js').Session | null;
  isAdmin: boolean;
  adminChecked: boolean;
  authLoading: boolean;
  authError: string | null;
  retryAuth: () => void;
  signOut: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    return (localStorage.getItem('gs-lang') as Lang) || 'en';
  });
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem('gs-theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [session, setSession] = useState<import('@supabase/supabase-js').Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('gs-theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    localStorage.setItem('gs-lang', lang);
  }, [lang]);

  const checkAdminRole = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setIsAdmin(false);
      setAdminChecked(true);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('admin_roles')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();
      setIsAdmin(!error && data !== null);
    } catch {
      setIsAdmin(false);
    } finally {
      setAdminChecked(true);
    }
  }, []);

  const loadSession = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setAuthError('Database connection is not configured for this environment.');
      setAuthLoading(false);
      setAdminChecked(true);
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      setSession(data.session);
      await checkAdminRole(data.session?.user?.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to authentication service.';
      setAuthError(msg.includes('Failed to fetch') || msg.includes('abort') ? 'NETWORK' : msg);
      setSession(null);
      setAdminChecked(true);
    } finally {
      setAuthLoading(false);
    }
  }, [checkAdminRole]);

  useEffect(() => {
    loadSession();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      (async () => {
        setSession(sess);
        setAuthError(null);
        await checkAdminRole(sess?.user?.id);
      })();
    });
    return () => sub.subscription.unsubscribe();
  }, [loadSession, checkAdminRole]);

  const value: AppContextValue = {
    lang,
    setLang,
    toggleLang: () => setLang((l) => (l === 'en' ? 'te' : 'en')),
    dark,
    setDark,
    toggleDark: () => setDark((d) => !d),
    session,
    isAdmin,
    adminChecked,
    authLoading,
    authError,
    retryAuth: loadSession,
    signOut: async () => {
      await supabase.auth.signOut();
      setIsAdmin(false);
      setAdminChecked(false);
    },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
