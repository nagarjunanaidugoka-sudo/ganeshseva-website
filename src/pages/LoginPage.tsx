import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, Eye, EyeOff, ArrowLeft, UserPlus, RefreshCw, WifiOff } from 'lucide-react';
import { useApp } from '@/lib/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { t } from '@/lib/i18n';
import { Card } from '@/components/ui';
import { GaneshaArt, Mandala, Garland, Diya, Lotus } from '@/components/decor/Decor';

function isNetworkError(msg: string): boolean {
  return msg.includes('Failed to fetch') || msg.includes('abort') || msg.includes('NetworkError') || msg.includes('network');
}

export function LoginPage() {
  const { lang } = useApp();
  const nav = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'network' | 'config' | 'auth' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const configured = isSupabaseConfigured();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setErrorType(null);
    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        nav('/admin');
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Account created! You can now sign in.');
        setMode('signin');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      if (isNetworkError(msg)) {
        setErrorType('network');
        setError('Unable to reach the authentication service. This is usually a network or connection issue — please check your internet connection and try again.');
      } else if (msg.includes('Invalid login') || msg.includes('invalid') || msg.includes('credentials')) {
        setErrorType('auth');
        setError('Incorrect email or password. Please double-check your credentials and try again.');
      } else {
        setErrorType('auth');
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-saffron-100 via-cream to-gold-100 dark:from-maroon-900 dark:via-maroon-950 dark:to-maroon-900 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-32 w-[30rem] h-[30rem] text-saffron-400/15"><Mandala className="w-full h-full animate-spin-slow" /></div>
        <div className="absolute -bottom-40 -left-40 w-[34rem] h-[34rem] text-gold-400/15"><Mandala className="w-full h-full animate-spin-slow" style={{ animationDirection: 'reverse' } as React.CSSProperties} /></div>
        <div className="absolute top-10 left-10 w-14 h-14 text-lotus-400/30 animate-float"><Lotus className="w-full h-full" /></div>
        <div className="absolute bottom-16 right-16 w-12 h-12 text-saffron-500/30 animate-flicker"><Diya className="w-full h-full" /></div>
      </div>

      <div className="relative w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-maroon-600 dark:text-cream/70 hover:text-saffron-600 dark:hover:text-saffron-300 mb-4 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <Card className="p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-saffron-gradient opacity-30 blur-xl animate-pulse" />
              <div className="relative h-20 w-20 rounded-2xl bg-saffron-gradient flex items-center justify-center shadow-glow-saffron">
                <GaneshaArt className="w-14 h-14" />
              </div>
            </div>
            <h1 className="mt-4 font-display text-2xl font-bold text-gradient-saffron">{t('appName', lang)}</h1>
            <p className="text-xs text-maroon-500 dark:text-cream/60 mt-1">{t('tagline', lang)}</p>
            <div className="mt-3 w-3/4 h-3 text-saffron-400"><Garland className="w-full h-full" /></div>
          </div>

          <h2 className="font-display text-xl font-semibold text-maroon-800 dark:text-gold-200 mb-1">
            {mode === 'signin' ? t('nav.login', lang) : 'Create Account'}
          </h2>
          <p className="text-sm text-maroon-500 dark:text-cream/60 mb-5">
            {mode === 'signin' ? 'Committee admins sign in to manage the festival.' : 'Create an admin account to manage your committee.'}
          </p>

          {!configured && (
            <div className="mb-4 rounded-xl bg-maroon-50 dark:bg-maroon-900/60 border border-maroon-200 dark:border-maroon-700 px-4 py-3 text-sm text-maroon-700 dark:text-maroon-200 flex items-start gap-2">
              <WifiOff className="w-5 h-5 shrink-0 mt-0.5" />
              <span>The database connection is not configured for this environment. Please check the deployment settings.</span>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-xl bg-maroon-50 dark:bg-maroon-900/60 border border-maroon-200 dark:border-maroon-700 px-4 py-3 text-sm text-maroon-700 dark:text-maroon-200">
              <div className="flex items-start gap-2">
                {errorType === 'network' ? <WifiOff className="w-5 h-5 shrink-0 mt-0.5" /> : null}
                <span>{error}</span>
              </div>
              {errorType === 'network' && (
                <button onClick={() => { setError(null); setErrorType(null); }} className="mt-3 btn-outline px-4 py-2 text-xs">
                  <RefreshCw className="w-3.5 h-3.5" /> Try Again
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-maroon-400 dark:text-cream/50" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-10" placeholder="admin@ganeshseva.in" />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-maroon-400 dark:text-cream/50" />
                <input type={showPw ? 'text' : 'password'} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="input pl-10 pr-10" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-maroon-400 dark:text-cream/50 hover:text-saffron-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? (
                <span className="flex items-center gap-2"><span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> {mode === 'signin' ? 'Signing in...' : 'Creating account...'}</span>
              ) : (
                <>{mode === 'signin' ? <><LogIn className="w-5 h-5" /> Sign In</> : <><UserPlus className="w-5 h-5" /> Create Account</>}</>
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-maroon-500 dark:text-cream/60">
            {mode === 'signin' ? (
              <>Don't have an account? <button onClick={() => { setMode('signup'); setError(null); setErrorType(null); }} className="text-saffron-600 dark:text-saffron-300 font-semibold hover:underline">Sign up</button></>
            ) : (
              <>Already have an account? <button onClick={() => { setMode('signin'); setError(null); setErrorType(null); }} className="text-saffron-600 dark:text-saffron-300 font-semibold hover:underline">Sign in</button></>
            )}
          </p>
        </Card>
      </div>
    </div>
  );
}
