import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from './supabase';
import { useApp } from './store';
import type { SiteContent, ContentVersion } from './types';

interface ContentContextValue {
  content: Record<string, SiteContent>;
  loading: boolean;
  tc: (key: string, fallback?: string) => string;
  refresh: () => void;
  saveContent: (key: string, valueEn: string, valueTe: string) => Promise<void>;
  restoreDefault: (key: string) => Promise<void>;
  getVersions: (key: string) => Promise<ContentVersion[]>;
}

const ContentContext = createContext<ContentContextValue | null>(null);

export function ContentProvider({ children }: { children: ReactNode }) {
  const { lang } = useApp();
  const [content, setContent] = useState<Record<string, SiteContent>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('site_content').select('*');
      if (error) throw error;
      const map: Record<string, SiteContent> = {};
      for (const row of (data as SiteContent[]) ?? []) {
        map[row.key] = row;
      }
      setContent(map);
    } catch {
      // fall back to hardcoded defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const tc = useCallback((key: string, fallback?: string): string => {
    const row = content[key];
    if (row) {
      return lang === 'te' ? (row.value_te || row.value_en || (fallback ?? key)) : (row.value_en || (fallback ?? key));
    }
    return fallback ?? key;
  }, [content, lang]);

  const saveContent = useCallback(async (key: string, valueEn: string, valueTe: string) => {
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user?.id ?? null;

    const existing = content[key];

    const { error } = await supabase.from('site_content').upsert({
      key,
      label: existing?.label ?? key,
      value_en: valueEn,
      value_te: valueTe,
      content_type: existing?.content_type ?? 'text',
      section: existing?.section ?? 'general',
      updated_by: userId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });

    if (error) throw error;

    const { error: versionError } = await supabase.from('content_versions').insert({
      content_key: key,
      value_en: valueEn,
      value_te: valueTe,
      changed_by: userId,
    });

    if (versionError) throw versionError;

    setContent(prev => {
      const existing = prev[key];
      return {
        ...prev,
        [key]: {
          ...(existing ?? { key, label: key, content_type: 'text' as const, section: 'general', updated_by: userId, updated_at: new Date().toISOString() }),
          key,
          value_en: valueEn,
          value_te: valueTe,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        },
      };
    });
  }, [content]);

  const restoreDefault = useCallback(async (key: string) => {
    const { data, error } = await supabase
      .from('content_versions')
      .select('*')
      .eq('content_key', key)
      .order('changed_at', { ascending: true })
      .limit(1);
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('No version history found');
    const first = data[0] as ContentVersion;
    await saveContent(key, first.value_en ?? '', first.value_te ?? '');
  }, [saveContent]);

  const getVersions = useCallback(async (key: string): Promise<ContentVersion[]> => {
    const { data, error } = await supabase
      .from('content_versions')
      .select('*')
      .eq('content_key', key)
      .order('changed_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data as ContentVersion[]) ?? [];
  }, []);

  return (
    <ContentContext.Provider value={{ content, loading, tc, refresh: load, saveContent, restoreDefault, getVersions }}>
      {children}
    </ContentContext.Provider>
  );
}

export function useContent(): ContentContextValue {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error('useContent must be used within ContentProvider');
  return ctx;
}
