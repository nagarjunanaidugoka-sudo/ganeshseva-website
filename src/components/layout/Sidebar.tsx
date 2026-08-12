import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, HandCoins, Receipt, Award, CalendarDays,
  Images, Phone, Home, X, ShieldCheck, LogOut,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { t } from '@/lib/i18n';
import { useContent } from '@/lib/content-context';
import { GaneshaArt, Garland } from '@/components/decor/Decor';
import { useData } from '@/lib/data-context';

const PUBLIC_NAV = [
  { to: '/', labelKey: 'nav.home', icon: Home, end: true },
  { to: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/donations', labelKey: 'nav.donations', icon: HandCoins },
  { to: '/expenses', labelKey: 'nav.expenses', icon: Receipt },
  { to: '/sponsors', labelKey: 'nav.sponsors', icon: Award },
  { to: '/events', labelKey: 'nav.events', icon: CalendarDays },
  { to: '/gallery', labelKey: 'nav.gallery', icon: Images },
  { to: '/contact', labelKey: 'nav.contact', icon: Phone },
];

export function Sidebar({
  open,
  onClose,
  adminMode = false,
}: {
  open: boolean;
  onClose: () => void;
  adminMode?: boolean;
}) {
  const { lang, session, isAdmin, signOut } = useApp();
  const { Navigate = useNavigate();
  const { settings } = useData();
  const { tc } = useContent();
  const loc = useLocation();
  const committeeName = settings?.committee_name || tc('app.name', t('appName', lang));

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-maroon-950/50 backdrop-blur-sm lg:hidden transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <aside
        className={`fixed lg:sticky top-0 z-50 h-screen w-72 shrink-0 flex flex-col bg-white/80 dark:bg-maroon-950/90 backdrop-blur-xl border-r border-saffron-200/60 dark:border-maroon-800 transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="relative px-5 pt-6 pb-4 overflow-hidden">
          <div className="absolute -top-6 -right-6 w-28 h-28 opacity-20 text-saffron-500">
            <GaneshaArt className="w-full h-full" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-saffron-gradient flex items-center justify-center shadow-glow-saffron">
                <GaneshaArt className="w-8 h-8" />
              </div>
              <div>
                <p className="font-display text-xl font-bold text-gradient-saffron leading-none">{committeeName}</p>
                <p className="text-[11px] text-maroon-500 dark:text-cream/60 mt-1">{tc('app.tagline', t('tagline', lang))}</p>
              </div>
            </div>
            <button onClick={onClose} className="lg:hidden btn-ghost h-9 w-9 rounded-lg p-0" aria-label="Close menu">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-4 h-3 text-saffron-400">
            <Garland className="w-full h-full" />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {PUBLIC_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'nav-link-active' : 'nav-link-inactive'}`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{tc(item.labelKey, t(item.labelKey, lang))}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-saffron-200/60 dark:border-maroon-800 space-y-1">
          {adminMode && isAdmin && session && (
            <>
              <NavLink
                to="/admin"
                onClick={onClose}
                className={`nav-link w-full ${loc.pathname === '/admin' ? 'nav-link-active' : 'nav-link-inactive'}`}
              >
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <span>{tc('nav.admin_panel', 'Admin Panel')}</span>
              </NavLink>
              <button
                onClick={async () => { await signOut(); onClose(); navigate('/'); }}
                className="nav-link nav-link-inactive w-full"
              >
                <LogOut className="w-5 h-5 shrink-0" />
                <span>{tc('nav.sign_out', 'Sign Out')}</span>
              </button>
            </>
          )}
          <div className="mt-3 text-center">
  {!adminMode && (
    <NavLink
      to="/admin/login"
      onClick={onClose}
      className="text-[11px] text-maroon-400 dark:text-cream/40 hover:text-saffron-600 dark:hover:text-saffron-400"
    >
      Admin Login
    </NavLink>
  )}
  <p className="mt-2 text-[10px] text-maroon-400 dark:text-cream/40">
    © {new Date().getFullYear()} {committeeName}
  </p>
</div>
        </div>
      </aside>
    </>
  );
}
