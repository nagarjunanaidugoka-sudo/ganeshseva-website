import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export function Card({ children, className = '', hover = false }: { children: ReactNode; className?: string; hover?: boolean }) {
  return (
    <div className={`glass-card p-5 ${hover ? 'transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-saffron' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function Badge({ children, color = 'saffron', className = '' }: { children: ReactNode; color?: 'saffron' | 'gold' | 'maroon' | 'lotus' | 'green' | 'gray'; className?: string }) {
  const colors: Record<string, string> = {
    saffron: 'bg-saffron-100 text-saffron-700 dark:bg-saffron-900/40 dark:text-saffron-200',
    gold: 'bg-gold-100 text-gold-700 dark:bg-gold-900/40 dark:text-gold-200',
    maroon: 'bg-maroon-100 text-maroon-700 dark:bg-maroon-900/40 dark:text-maroon-200',
    lotus: 'bg-lotus-100 text-lotus-700 dark:bg-lotus-900/40 dark:text-lotus-200',
    green: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200',
    gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200',
  };
  return <span className={`badge ${colors[color]} ${className}`}>{children}</span>;
}

export function Loader({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-maroon-600 dark:text-cream/70">
      <Loader2 className="w-8 h-8 animate-spin text-saffron-500" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

export function EmptyState({ icon, title, message, action }: { icon?: ReactNode; title: string; message?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-saffron-100 dark:bg-maroon-800 flex items-center justify-center text-saffron-500 dark:text-gold-300">
        {icon ?? <span className="text-2xl">✦</span>}
      </div>
      <h3 className="font-display text-xl font-semibold text-maroon-800 dark:text-gold-200">{title}</h3>
      {message && <p className="text-sm text-maroon-500 dark:text-cream/60 max-w-sm">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ProgressBar({ value, max, className = '' }: { value: number; max: number; className?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={`w-full h-3 rounded-full bg-saffron-100 dark:bg-maroon-800 overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full bg-saffron-gradient transition-all duration-700 ease-out relative overflow-hidden"
        style={{ width: `${pct}%` }}
      >
        <div className="absolute inset-0 shimmer-bg animate-shimmer" />
      </div>
    </div>
  );
}

export function SectionHeading({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="section-subtitle mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-maroon-950/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-lg glass-card p-6 animate-fade-in-scale max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-2xl font-bold text-maroon-800 dark:text-gold-200">{title}</h3>
          <button onClick={onClose} className="btn-ghost h-9 w-9 rounded-lg p-0" aria-label="Close">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function StatCard({ label, value, icon, accent = 'saffron', sub }: { label: string; value: string; icon?: ReactNode; accent?: 'saffron' | 'gold' | 'maroon' | 'lotus'; sub?: string }) {
  const accents: Record<string, string> = {
    saffron: 'from-saffron-400 to-saffron-600 text-white',
    gold: 'from-gold-300 to-gold-500 text-maroon-950',
    maroon: 'from-maroon-500 to-maroon-700 text-cream',
    lotus: 'from-lotus-400 to-lotus-600 text-white',
  };
  return (
    <Card hover className="relative overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-maroon-500 dark:text-cream/60">{label}</p>
          <p className="mt-1 font-display text-2xl md:text-3xl font-bold text-maroon-800 dark:text-gold-200 truncate">{value}</p>
          {sub && <p className="mt-1 text-xs text-maroon-400 dark:text-cream/50">{sub}</p>}
        </div>
        {icon && <div className={`shrink-0 h-11 w-11 rounded-xl bg-gradient-to-br ${accents[accent]} flex items-center justify-center shadow-glow-saffron`}>{icon}</div>}
      </div>
    </Card>
  );
}
