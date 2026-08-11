import { useState, useEffect, type ReactNode } from 'react';
import { WifiOff } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { Mandala } from '@/components/decor/Decor';

export function Layout({ children, adminMode = false }: { children: ReactNode; adminMode?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-cream dark:bg-maroon-950 relative">
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-32 -right-32 w-[28rem] h-[28rem] text-saffron-300/15 dark:text-saffron-700/10">
          <Mandala className="w-full h-full animate-spin-slow" />
        </div>
        <div className="absolute -bottom-40 -left-40 w-[32rem] h-[32rem] text-gold-300/15 dark:text-gold-800/10">
          <Mandala className="w-full h-full animate-spin-slow" style={{ animationDirection: 'reverse' } as React.CSSProperties} />
        </div>
      </div>

      <div className="flex">
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} adminMode={adminMode} />
        <div className="flex-1 min-w-0">
          <TopNav onMenu={() => setMenuOpen(true)} adminMode={adminMode} />
          {isOffline && (
            <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium animate-fade-in">
              <WifiOff className="w-4 h-4" />
              You are offline. Some features may be unavailable.
            </div>
          )}
          <main className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
