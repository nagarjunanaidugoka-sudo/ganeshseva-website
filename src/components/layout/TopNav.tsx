import { Menu, Moon, Sun, Languages, ShieldCheck, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/lib/store';
import { useData } from '@/lib/data-context';
import { t } from '@/lib/i18n';
import { useContent } from '@/lib/content-context';

export function TopNav({ onMenu, adminMode = false }: { onMenu: () => void; adminMode?: boolean }) {
  const { lang, toggleLang, dark, toggleDark, session, isAdmin, signOut } = useApp();
  const { settings } = useData();
  const { tc } = useContent();
  const navigate = useNavigate();

  const committeeName = lang === 'te'
    ? (settings?.committee_name_te || settings?.committee_name || '')
    : (settings?.committee_name || '');
  const village = settings?.village || '';
  const initial = session?.user?.email?.charAt(0).toUpperCase() ?? 'G';

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-30 glass border-b border-saffron-200/50 dark:border-maroon-800">
      <div className="flex items-center gap-3 px-4 sm:px-6 h-16">
        <button onClick={onMenu} className="lg:hidden btn-ghost h-10 w-10 rounded-xl p-0" aria-label="Open menu">
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden md:block min-w-0">
          <p className="font-display text-base font-semibold text-maroon-800 dark:text-gold-200 truncate">
            {committeeName || tc('app.name', t('appName', lang))}
          </p>
          {village && <p className="text-xs text-maroon-500 dark:text-cream/60 truncate">{village}</p>}
        </div>

        {/* Admin badge */}
        {adminMode && isAdmin && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-saffron-100 dark:bg-saffron-900/30 text-saffron-700 dark:text-saffron-300 text-xs font-semibold border border-saffron-200 dark:border-saffron-800">
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin
          </div>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          <button onClick={toggleLang} className="btn-ghost h-10 px-3 rounded-xl" aria-label="Toggle language">
            <Languages className="w-5 h-5" />
            <span className="text-sm font-semibold">{lang === 'en' ? 'EN' : 'TE'}</span>
          </button>
          <button onClick={toggleDark} className="btn-ghost h-10 w-10 rounded-xl p-0" aria-label="Toggle dark mode">
            {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {adminMode && isAdmin && session ? (
            <div className="flex items-center gap-2 ml-1">
              <div className="h-9 w-9 rounded-full bg-saffron-gradient flex items-center justify-center text-white font-bold text-sm shadow-glow-saffron">
                {initial}
              </div>
              <button
                onClick={handleSignOut}
                className="btn-ghost h-9 px-3 rounded-lg text-sm text-maroon-600 dark:text-cream/70 hidden sm:flex"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="h-9 w-9 rounded-full bg-saffron-100 dark:bg-maroon-800 flex items-center justify-center text-saffron-600 dark:text-cream/60 font-bold text-sm ml-1">
              G
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
