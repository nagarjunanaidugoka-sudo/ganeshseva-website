import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, Eye, EyeOff, ShieldCheck, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { useApp } from '@/lib/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Card } from '@/components/ui';
import { GaneshaArt, Mandala, Garland, Diya, Lotus } from '@/components/decor/Decor';

function isNetworkError(msg: string): boolean {
  return (
    msg.includes('Failed to fetch') ||
    msg.includes('abort') ||
    msg.includes('NetworkError') ||
    msg.includes('network')
  );
}

export function AdminLoginPage() {
  const { isAdmin, adminChecked, authLoading, signOut } = useApp();
  const nav = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'network' | 'auth' | 'forbidden' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const configured = isSupabaseConfigured();

  // If already admin, go straight to admin panel
  useEffect(() => {
    if (!authLoading && adminChecked && isAdmin) {
      nav('/admin', { replace: true });
    }
  }, [authLoading, adminChecked, isAdmin, nav]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setErrorType(null);
    setLoading(true);
    try {
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) throw signInErr;

      // Check admin role
      const { data: session } = await supabase.auth.getSession();
      const uid = session.session?.user?.id;
      if (!uid) throw new Error('Session not established');

      const { data: role, error: roleErr } = await supabase
        .from('admin_roles')
        .select('user_id')
        .eq('user_id', uid)
        .maybeSingle();

      if (roleErr || !role) {
        // User signed in but is not an admin — sign them back out
        await supabase.auth.signOut();
        setErrorType('forbidden');
        setError('Access denied. This account does not have admin privileges.');
        return;
      }

      nav('/admin', { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      if (isNetworkError(msg)) {
        setErrorType('network');
        setError('Unable to reach the authentication service. Please check your internet connection and try again.');
      } else if (
        msg.includes('Invalid login') ||
        msg.includes('invalid') ||
        msg.includes('credentials') ||
        msg.includes('password')
      ) {
        setErrorType('auth');
        setError('Incorrect email or password.');
      } else {
        setErrorType('auth');
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-saffron-50 via-cream to-gold-50 dark:from-maroon-900 dark:via-maroon-950 dark:to-maroon-900 relative overflow-hidden">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-32 w-[30rem] h-[30rem] text-saffron-400/15">
          <Mandala className="w-full h-full animate-spin-slow" />
        </div>
        <div className="absolute -bottom-40 -left-40 w-[34rem] h-[34rem] text-gold-400/15">
          <Mandala className="w-full h-full animate-spin-slow" style={{ animationDirection: 'reverse' } as React.CSSProperties} />
        </div>
        <div className="absolute top-10 left-10 w-14 h-14 text-lotus-400/30 animate-float">
          <Lotus className="w-full h-full" />
        </div>
        <div className="absolute bottom-16 right-16 w-12 h-12 text-saffron-500/30 animate-flicker">
          <Diya className="w-full h-full" />
        </div>
      </div>

      <div className="relative w-full max-w-md">
        <Card className="p-8">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-7">
            <div className="relative mb-4">
              <div className="absolute inset-0 rounded-full bg-saffron-gradient opacity-25 blur-xl animate-pulse" />
              <div className="relative h-20 w-20 rounded-2xl bg-saffron-gradient flex items-center justify-center shadow-glow-saffron">
                <GaneshaArt className="w-14 h-14" />
              </div>
            </div>
            <h1 className="font-display text-2xl font-bold text-gradient-saffron">GaneshSeva</h1>
            <p className="text-xs text-maroon-500 dark:text-cream/60 mt-1 mb-3">Festival Management Committee</p>
            <div className="w-3/4 h-3 text-saffron-400">
              <Garland className="w-full h-full" />
            </div>
          </div>

          {/* Title row */}
          <div className="flex items-center gap-2.5 mb-1">
            <div className="h-9 w-9 rounded-lg bg-saffron-100 dark:bg-saffron-900/40 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-saffron-600 dark:text-saffron-300" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-maroon-800 dark:text-gold-200">Admin Sign In</h2>
              <p className="text-xs text-maroon-500 dark:text-cream/60">Authorised committee members only</p>
            </div>
          </div>

          <div className="my-5 border-t border-saffron-100 dark:border-maroon-800" />

          {/* Config warning */}
          {!configured && (
            <div className="mb-4 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 px-4 py-3 text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2">
              <WifiOff className="w-5 h-5 shrink-0 mt-0.5" />
              <span>The database connection is not configured for this environment.</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className={`mb-4 rounded-xl px-4 py-3 text-sm flex items-start gap-2 border ${
              errorType === 'forbidden'
                ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-700 dark:text-red-200'
                : 'bg-maroon-50 dark:bg-maroon-900/60 border-maroon-200 dark:border-maroon-700 text-maroon-700 dark:text-maroon-200'
            }`}>
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p>{error}</p>
                {errorType === 'network' && (
                  <button
                    onClick={() => { setError(null); setErrorType(null); }}
                    className="mt-2 btn-outline px-3 py-1.5 text-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Try Again
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-maroon-400 dark:text-cream/50" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="admin@ganeshseva.in"
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-maroon-400 dark:text-cream/50" />
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-maroon-400 dark:text-cream/50 hover:text-saffron-600"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading || !configured} className="btn-primary w-full py-3">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <LogIn className="w-5 h-5" /> Sign In to Admin Panel
                </span>
              )}
            </button>
          </form>

          {/* Default credentials hint (remove in production) */}
          <div className="mt-5 p-3 rounded-lg bg-saffron-50 dark:bg-saffron-900/20 border border-saffron-200/60 dark:border-saffron-800/40">
            <p className="text-xs text-maroon-600 dark:text-cream/60 text-center">
              Default: <span className="font-mono font-semibold">admin@ganeshseva.in</span> / <span className="font-mono font-semibold">Admin@1234</span>
            </p>
            <p className="text-xs text-saffron-600 dark:text-saffron-400 text-center mt-1">
              Please change your password after first sign-in.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
