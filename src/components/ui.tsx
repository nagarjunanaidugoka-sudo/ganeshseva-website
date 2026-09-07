import React from 'react';
import { createPortal } from 'react-dom';

type BadgeColor =
  | 'saffron'
  | 'green'
  | 'red'
  | 'blue'
  | 'gray'
  | 'purple';

interface BadgeProps {
  children: React.ReactNode;
  color?: BadgeColor;
  className?: string;
}

export function Badge({
  children,
  color = 'saffron',
  className = '',
}: BadgeProps) {
  const colors: Record<BadgeColor, string> = {
    saffron:
      'bg-saffron-100 text-saffron-800 dark:bg-saffron-900/40 dark:text-saffron-300',
    green:
      'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    red:
      'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    blue:
      'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    gray:
      'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    purple:
      'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  };

  return (
    <span className={`badge ${colors[color]} ${className}`}>
      {children}
    </span>
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  className = '',
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      className={`w-full h-3 rounded-full bg-saffron-100 dark:bg-maroon-800 overflow-hidden ${className}`}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-saffron-500 to-saffron-600 transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  className = '',
}: ModalProps) {
  if (!open) return null;

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      <div
        className={`relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-maroon-950 shadow-2xl ${className}`}
      >
        {title && (
          <div className="flex items-center justify-between p-5 border-b border-saffron-200 dark:border-maroon-800">
            <h2 className="text-lg font-bold text-maroon-900 dark:text-cream">
              {title}
            </h2>

            <button
              type="button"
              onClick={onClose}
              className="text-maroon-500 hover:text-maroon-900 dark:text-cream/60 dark:hover:text-cream text-xl"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        )}

        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: 'saffron' | 'green' | 'red' | 'blue' | 'purple';
  subtitle?: string;
}

export function StatCard({
  label,
  value,
  icon,
  accent = 'saffron',
  subtitle,
}: StatCardProps) {
  const accents = {
    saffron: 'from-saffron-400 to-saffron-600',
    green: 'from-green-400 to-green-600',
    red: 'from-red-400 to-red-600',
    blue: 'from-blue-400 to-blue-600',
    purple: 'from-purple-400 to-purple-600',
  };

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-maroon-500 dark:text-cream/60">
            {label}
          </p>

          <p className="mt-1 text-2xl font-bold text-maroon-950 dark:text-cream">
            {value}
          </p>

          {subtitle && (
            <p className="mt-1 text-xs text-maroon-400 dark:text-cream/50">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className={`shrink-0 h-11 w-11 rounded-xl bg-gradient-to-br ${accents[accent]} flex items-center justify-center shadow-glow-saffron`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
