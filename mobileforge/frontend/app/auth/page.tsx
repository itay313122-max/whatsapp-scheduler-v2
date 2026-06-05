'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  signInWithGoogle,
  signInWithEmail,
  registerWithEmail,
  onAuthChange,
} from '@/lib/firebase';
import Link from 'next/link';

function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<'login' | 'register'>(
    params.get('mode') === 'register' ? 'register' : 'login'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    return onAuthChange((user) => {
      if (user) router.push('/dashboard');
    });
  }, [router]);

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
      } else {
        await registerWithEmail(email, password);
      }
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'שגיאה בהתחברות';
      if (msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setError('אימייל או סיסמה שגויים');
      } else if (msg.includes('email-already-in-use')) {
        setError('אימייל זה כבר רשום. נסה להתחבר.');
      } else if (msg.includes('weak-password')) {
        setError('הסיסמה חלשה מדי — לפחות 6 תווים');
      } else if (msg.includes('not configured')) {
        setError('Firebase לא מוגדר. הוסף משתני סביבה.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('not configured')) {
        setError('Firebase לא מוגדר. הוסף משתני סביבה.');
      } else if (msg.includes('popup-closed-by-user')) {
        setError('');
      } else {
        setError('שגיאה בהתחברות עם Google');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <span className="text-white font-display font-bold text-lg">M</span>
          </div>
          <span className="font-display font-bold text-2xl">
            Mobile<span className="text-primary">Forge</span>
          </span>
        </Link>
        <p className="text-text-secondary mt-2 text-sm">
          {mode === 'login' ? 'ברוך השב! התחבר לחשבונך' : 'צור חשבון חינמי ובנה את האפליקציה שלך'}
        </p>
      </div>

      {/* Card */}
      <div className="bg-surface border border-border rounded-2xl p-8">
        {/* Mode toggle */}
        <div className="flex p-1 rounded-xl bg-surface-2 border border-border mb-6">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === m
                  ? 'bg-primary text-white shadow-glow'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {m === 'login' ? 'התחברות' : 'הרשמה'}
            </button>
          ))}
        </div>

        {/* Google auth */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-border hover:border-primary/50 text-text-primary text-sm font-medium transition-all disabled:opacity-50 mb-6"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          המשך עם Google
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-text-secondary text-xs">או</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label className="block text-text-secondary text-xs mb-1.5">אימייל</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              dir="ltr"
              className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-text-primary placeholder-text-secondary text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-text-secondary text-xs mb-1.5">סיסמה</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-text-primary placeholder-text-secondary text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-primary text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 shadow-glow"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                טוען…
              </span>
            ) : mode === 'login' ? (
              'התחבר'
            ) : (
              'צור חשבון'
            )}
          </button>
        </form>

        {mode === 'register' && (
          <p className="text-text-secondary text-xs text-center mt-4">
            בלחיצה על &quot;צור חשבון&quot; אתה מסכים לתנאי השימוש
          </p>
        )}
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4" dir="rtl">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
      <Suspense fallback={
        <div className="flex items-center gap-2 text-text-secondary">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          טוען…
        </div>
      }>
        <AuthForm />
      </Suspense>
    </div>
  );
}
