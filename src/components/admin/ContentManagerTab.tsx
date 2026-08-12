import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Search, Save, Loader2, RotateCcw, History, CheckCircle2,
  AlertCircle, X,
} from 'lucide-react';
import { useContent } from '@/lib/content-context';
import { Card, Badge, SectionHeading } from '@/components/ui';
import type { ContentVersion } from '@/lib/types';

export function ContentManagerTab() {
  const {
    content,
    loading,
    saveContent,
    restoreDefault,
    getVersions,
    refresh,
  } = useContent();

  const [search, setSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [drafts, setDrafts] = useState<Record<string, { en: string; te: string }>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [historyKey, setHistoryKey] = useState<string | null>(null);
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [restoringKey, setRestoringKey] = useState<string | null>(null);

  // Google Maps
  const [mapsUrl, setMapsUrl] = useState('');
  const [mapsSaving, setMapsSaving] = useState(false);
  const [mapsSaved, setMapsSaved] = useState(false);

  // Load saved Google Maps URL
  useEffect(() => {
    const savedUrl = content['contact.google_maps_url']?.value_en ?? '';
    setMapsUrl(savedUrl);
  }, [content]);

  const sections = useMemo(() => {
    const sectionSet = new Set<string>();

    Object.values(content).forEach(c => {
      sectionSet.add(c.section);
    });

    return ['all', ...Array.from(sectionSet).sort()];
  }, [content]);

  const filtered = useMemo(() => {
    return Object.values(content)
      .filter(
        c => sectionFilter === 'all' || c.section === sectionFilter
      )
      .filter(c => {
        if (!search) return true;

        const q = search.toLowerCase();

        return (
          c.key.toLowerCase().includes(q) ||
          c.label.toLowerCase().includes(q) ||
          c.value_en.toLowerCase().includes(q) ||
          c.value_te.toLowerCase().includes(q)
        );
      })
      .sort(
        (a, b) =>
          a.section.localeCompare(b.section) ||
          a.key.localeCompare(b.key)
      );
  }, [content, search, sectionFilter]);

  const getDraft = useCallback(
    (key: string) => {
      const row = content[key];

      return (
        drafts[key] ?? {
          en: row?.value_en ?? '',
          te: row?.value_te ?? '',
        }
      );
    },
    [content, drafts]
  );

  const setDraft = useCallback(
    (key: string, lang: 'en' | 'te', val: string) => {
      setDrafts(prev => ({
        ...prev,
        [key]: {
          ...(prev[key] ?? {
            en: content[key]?.value_en ?? '',
            te: content[key]?.value_te ?? '',
          }),
          [lang]: val,
        },
      }));
    },
    [content]
  );

  const isDirty = useCallback(
    (key: string) => {
      const row = content[key];
      const d = drafts[key];

      if (!d) return false;

      return (
        d.en !== (row?.value_en ?? '') ||
        d.te !== (row?.value_te ?? '')
      );
    },
    [content, drafts]
  );

  const dirtyCount = useMemo(
    () => Object.keys(content).filter(isDirty).length,
    [content, isDirty]
  );

  async function handleSave(key: string) {
    setSavingKey(key);
    setSaveError(null);

    const d = drafts[key];

    if (!d) {
      setSavingKey(null);
      return;
    }

    try {
      await saveContent(key, d.en, d.te);

      setDrafts(prev => {
        const n = { ...prev };
        delete n[key];
        return n;
      });

      setSavedKey(key);

      setTimeout(() => {
        setSavedKey(null);
      }, 2500);
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : 'Failed to save. Please try again.'
      );
    } finally {
      setSavingKey(null);
    }
  }

  async function handleSaveAll() {
    const dirty = Object.keys(content).filter(isDirty);

    if (dirty.length === 0) return;

    setSavingKey('__all__');
    setSaveError(null);

    try {
      for (const key of dirty) {
        const d = drafts[key];

        if (d) {
          await saveContent(key, d.en, d.te);
        }
      }

      setDrafts({});
      setSavedKey('__all__');

      setTimeout(() => {
        setSavedKey(null);
      }, 2500);
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : 'Failed to save some content. Please try again.'
      );
    } finally {
      setSavingKey(null);
    }
  }

  async function handleRestore(key: string) {
    if (!confirm('Restore this content to its first saved version?')) {
      return;
    }

    setRestoringKey(key);

    try {
      await restoreDefault(key);

      setDrafts(prev => {
        const n = { ...prev };
        delete n[key];
        return n;
      });

      refresh();
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : 'Failed to restore default.'
      );
    } finally {
      setRestoringKey(null);
    }
  }

  async function handleHistory(key: string) {
    setHistoryKey(key);

    try {
      const v = await getVersions(key);
      setVersions(v);
    } catch {
      setVersions([]);
    }
  }

  async function handleSaveMaps() {
    setMapsSaving(true);
    setSaveError(null);

    try {
      await saveContent(
        'contact.google_maps_url',
        mapsUrl,
        mapsUrl
      );

      setMapsSaved(true);

      setTimeout(() => {
        setMapsSaved(false);
      }, 2500);
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : 'Failed to save Google Maps URL.'
      );
    } finally {
      setMapsSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-saffron-500" />

        <span className="ml-3 text-maroon-500 dark:text-cream/60">
          Loading content...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Page heading */}
      <SectionHeading
        title="Content Management"
        subtitle="Edit all text shown on the website. Changes appear immediately after saving."
      />

      {/* Google Maps Location */}
      <Card>
        <div className="space-y-3">

          <div>
            <h3 className="font-semibold text-maroon-800 dark:text-gold-200">
              Google Maps Location
            </h3>

            <p className="text-xs text-maroon-500 dark:text-cream/60 mt-1">
              Paste the Google Maps link for the committee location.
              This can be changed later by the admin.
            </p>
          </div>

          <input
            value={mapsUrl}
            onChange={e => setMapsUrl(e.target.value)}
            placeholder="https://maps.google.com/..."
            className="input"
            type="url"
          />

          <button
            type="button"
            disabled={mapsSaving}
            onClick={handleSaveMaps}
            className="btn-primary px-4 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {mapsSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Google Maps Location
              </>
            )}
          </button>

          {mapsSaved && (
            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Google Maps location saved.
            </p>
          )}

        </div>
      </Card>

      {/* Error */}
      {saveError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-sm text-red-700 dark:text-red-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {saveError}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-maroon-400" />

          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search content keys..."
            className="input pl-10"
          />
        </div>

        <select
          value={sectionFilter}
          onChange={e => setSectionFilter(e.target.value)}
          className="input sm:w-48"
        >
          {sections.map(s => (
            <option key={s} value={s}>
              {s === 'all' ? 'All Sections' : s}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">

          {dirtyCount > 0 && (
            <Badge color="gold">
              {dirtyCount} unsaved
            </Badge>
          )}

          <button
            onClick={handleSaveAll}
            disabled={
              dirtyCount === 0 ||
              savingKey === '__all__'
            }
            className="btn-primary px-4 py-2.5 text-sm flex items-center gap-2 disabled:opacity-40"
          >
            {savingKey === '__all__' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save All Changes
              </>
            )}
          </button>

        </div>
      </div>

      {/* Content list */}
      {filtered.length === 0 ? (
        <Card className="text-center py-12 text-maroon-500 dark:text-cream/60">
          No content found for your search.
        </Card>
      ) : (
        <div className="space-y-3">

          {filtered.map(item => {

            const d = getDraft(item.key);
            const dirty = isDirty(item.key);
            const isSaving = savingKey === item.key;
            const isSaved = savedKey === item.key;
            const isRestoring = restoringKey === item.key;

            return (
              <Card
                key={item.key}
                className={
                  dirty
                    ? 'ring-2 ring-saffron-300'
                    : ''
                }
              >

                <div className="flex flex-col gap-3">

                  {/* Header */}
                  <div className="flex items-center gap-2 flex-wrap">

                    <Badge color="saffron">
                      {item.section}
                    </Badge>

                    <span className="text-sm font-semibold text-maroon-800 dark:text-gold-200">
                      {item.label}
                    </span>

                    <code className="text-xs text-maroon-400 dark:text-cream/50 font-mono">
                      {item.key}
                    </code>

                    {dirty && (
                      <Badge color="gold">
                        Unsaved
                      </Badge>
                    )}

                    {isSaved && (
                      <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Saved
                      </span>
                    )}

                    <div className="ml-auto flex items-center gap-1">

                      <button
                        onClick={() => handleHistory(item.key)}
                        className="btn-ghost px-2 py-1.5 text-xs flex items-center gap-1"
                        title="Version History"
                      >
                        <History className="w-3.5 h-3.5" />
                        History
                      </button>

                      <button
                        onClick={() => handleRestore(item.key)}
                        disabled={isRestoring}
                        className="btn-ghost px-2 py-1.5 text-xs flex items-center gap-1 disabled:opacity-40"
                        title="Restore Default"
                      >
                        {isRestoring ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5" />
                        )}

                        Restore
                      </button>

                    </div>
                  </div>

                  {/* English / Telugu */}
                  <div className="grid sm:grid-cols-2 gap-3">

                    <div>

                      <label className="text-[10px] uppercase tracking-wide font-semibold text-maroon-500 dark:text-cream/50">
                        English
                      </label>

                      {item.content_type === 'rich' ? (
                        <textarea
                          value={d.en}
                          onChange={e =>
                            setDraft(
                              item.key,
                              'en',
                              e.target.value
                            )
                          }
                          className="input mt-1 min-h-[60px] text-sm"
                        />
                      ) : (
                        <input
                          value={d.en}
                          onChange={e =>
                            setDraft(
                              item.key,
                              'en',
                              e.target.value
                            )
                          }
                          className="input mt-1 text-sm"
                        />
                      )}

                    </div>

                    <div>

                      <label className="text-[10px] uppercase tracking-wide font-semibold text-maroon-500 dark:text-cream/50">
                        Telugu
                      </label>

                      {item.content_type === 'rich' ? (
                        <textarea
                          value={d.te}
                          onChange={e =>
                            setDraft(
                              item.key,
                              'te',
                              e.target.value
                            )
                          }
                          className="input mt-1 min-h-[60px] text-sm font-telugu"
                        />
                      ) : (
                        <input
                          value={d.te}
                          onChange={e =>
                            setDraft(
                              item.key,
                              'te',
                              e.target.value
                            )
                          }
                          className="input mt-1 text-sm font-telugu"
                        />
                      )}

                    </div>

                  </div>

                  {/* Save individual content */}
                  {dirty && (
                    <div className="flex justify-end">

                      <button
                        onClick={() => handleSave(item.key)}
                        disabled={isSaving}
                        className="btn-primary px-4 py-2 text-xs flex items-center gap-1.5"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            Save
                          </>
                        )}
                      </button>

                    </div>
                  )}

                </div>

              </Card>
            );
          })}

        </div>
      )}

      {/* Version History Modal */}
      {historyKey && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-maroon-950/50 backdrop-blur-sm"
          onClick={() => setHistoryKey(null)}
        >

          <div
            className="bg-white dark:bg-maroon-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >

            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-saffron-100 dark:border-maroon-800">

              <div className="flex items-center gap-2">

                <History className="w-5 h-5 text-saffron-500" />

                <h3 className="font-display text-base font-semibold text-maroon-800 dark:text-gold-200">
                  Version History
                </h3>

                <code className="text-xs text-maroon-400 font-mono">
                  {historyKey}
                </code>

              </div>

              <button
                onClick={() => setHistoryKey(null)}
                className="btn-ghost h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </button>

            </div>

            {/* Versions */}
            <div className="overflow-y-auto p-4 space-y-2">

              {versions.length === 0 ? (
                <p className="text-center text-maroon-500 dark:text-cream/60 py-8">
                  No version history available.
                </p>
              ) : (
                versions.map((v, i) => (
                  <div
                    key={v.id}
                    className="rounded-xl border border-saffron-100 dark:border-maroon-800 p-3"
                  >

                    <div className="flex items-center gap-2 mb-1">

                      <Badge color={i === 0 ? 'gold' : 'gray'}>
                        {i === 0
                          ? 'Latest'
                          : `v${versions.length - i}`}
                      </Badge>

                      <span className="text-xs text-maroon-400 dark:text-cream/50">
                        {new Date(v.changed_at).toLocaleString()}
                      </span>

                    </div>

                    <p className="text-sm text-maroon-700 dark:text-cream/80 mt-1">
                      EN: {v.value_en || '—'}
                    </p>

                    <p className="text-sm text-maroon-700 dark:text-cream/80 font-telugu">
                      TE: {v.value_te || '—'}
                    </p>

                  </div>
                ))
              )}

            </div>

          </div>

        </div>
      )}

    </div>
  );
                  }
