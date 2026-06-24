'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  signInWithGoogle,
  signInWithEmail,
  registerWithEmail,
  onAuthChange,
  createUserDocIfNeeded,
} from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

function Spinner({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { enterGuestMode } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(
    params.get('mode') === 'register' ? 'register' : 'login'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAppleTooltip, setShowAppleTooltip] = useState(false);

  useEffect(() => {
    return onAuthChange((user) => {
      if (user) router.push('/dashboard');
    });
  }, [router]);

  async function afterAuth(user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null }) {
    await createUserDocIfNeeded(user as Parameters<typeof createUserDocIfNeeded>[0]);
    router.push('/dashboard');
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let result;
      if (mode === 'login') {
        result = await signInWithEmail(email, password);
      } else {
        result = await registerWithEmail(email, password);
      }
      await afterAuth(result.user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed';
      if (msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setError('Incorrect email or password');
      } else if (msg.includes('email-already-in-use')) {
        setError('This email is already registered. Try signing in.');
      } else if (msg.includes('weak-password')) {
        setError('Password is too weak — at least 6 characters');
      } else if (msg.includes('not configured')) {
        setError('Firebase is not configured. Add the environment variables.');
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
      const result = await signInWithGoogle();
      await afterAuth(result.user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('not configured')) {
        setError('Firebase is not configured — click "Continue as guest" below');
      } else if (msg.includes('unauthorized-domain') || msg.includes('auth-domain')) {
        setError('The current domain is not authorized in Firebase. Click "Continue as guest"');
      } else if (msg.includes('network-request-failed')) {
        setError('Network error — check your internet connection or click "Continue as guest"');
      } else if (!msg.includes('popup-closed-by-user') && !msg.includes('cancelled-popup-request')) {
        setError('Google sign-in failed — try "Continue as guest"');
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
          <span className="font-display font-bold text-2xl text-text-primary">
            Mobile<span className="text-primary">Forge</span>
          </span>
        </Link>
        <p className="text-text-secondary mt-2 text-sm">
          {mode === 'login' ? 'Welcome back! Sign in to your account' : 'Create a free account · 10 credits gift 🎁'}
        </p>
      </div>

      {/* Glass card */}
      <div className="glass-card rounded-3xl p-8">
        {/* Mode toggle */}
        <div className="flex p-1 rounded-2xl bg-surface-2 border border-border mb-6">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                mode === m
                  ? 'bg-gradient-primary text-white shadow-glow'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Social auth */}
        <div className="space-y-3 mb-6">
          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-white border border-border hover:border-primary/30 hover:shadow-card text-text-primary text-sm font-semibold transition-all disabled:opacity-50"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          {/* Apple — placeholder */}
          <div className="relative">
            <button
              type="button"
              disabled
              onMouseEnter={() => setShowAppleTooltip(true)}
              onMouseLeave={() => setShowAppleTooltip(false)}
              className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border border-border text-text-soft text-sm font-semibold opacity-50 cursor-not-allowed select-none"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              Continue with Apple
              <span className="mr-auto text-xs px-2 py-0.5 rounded-full border border-border bg-surface-2 text-text-soft">
                Soon
              </span>
            </button>
            {showAppleTooltip && (
              <div className="absolute bottom-full mb-2 right-0 left-0 mx-auto w-max max-w-xs px-3 py-2 rounded-xl glass-card text-text-secondary text-xs text-center z-10">
                Apple Sign-In requires an Apple Developer Account.<br />
                Coming soon 🍎
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-text-soft text-xs">or with email</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-text-secondary text-xs font-medium mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                dir="ltr"
                className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-text-primary placeholder-text-soft text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
          )}
          <div>
            <label className="block text-text-secondary text-xs font-medium mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              dir="ltr"
              className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-text-primary placeholder-text-soft text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
          <div>
            <label className="block text-text-secondary text-xs font-medium mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="At least 6 characters"
              className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-text-primary placeholder-text-soft text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-primary text-white font-display font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 shadow-glow"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner /> Loading…
              </span>
            ) : mode === 'login' ? (
              'Sign In'
            ) : (
              'Create Account · 10 credits free 🎁'
            )}
          </button>
        </form>

        {mode === 'register' && (
          <p className="text-text-soft text-xs text-center mt-4">
            By clicking &quot;Create Account&quot; you agree to the Terms of Service ·{' '}
            <span className="text-primary font-medium">10 free credits</span> to start
          </p>
        )}

        {/* Guest mode */}
        <div className="flex items-center gap-3 mt-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-text-soft text-xs">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <button
          onClick={() => {
            enterGuestMode();
            router.push('/dashboard');
          }}
          className="w-full mt-4 py-3 rounded-2xl border-2 border-dashed border-border hover:border-primary/40 text-text-secondary hover:text-primary text-sm font-semibold transition-all hover:bg-primary/5"
        >
          Continue as guest — no sign-up
        </button>
        <p className="text-[10px] text-text-soft text-center mt-2">
          Projects are saved locally in your browser
        </p>
      </div>

      <p className="text-center text-text-soft text-xs mt-6">
        {mode === 'login' ? (
          <>Don&apos;t have an account?{' '}
            <button onClick={() => setMode('register')} className="text-primary font-semibold hover:text-primary-light">
              Sign up free
            </button>
          </>
        ) : (
          <>Already have an account?{' '}
            <button onClick={() => setMode('login')} className="text-primary font-semibold hover:text-primary-light">
              Sign in
            </button>
          </>
        )}
      </p>
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="min-h-screen hero-bg flex items-center justify-center p-4" dir="ltr">
      <Suspense fallback={
        <div className="flex items-center gap-2 text-text-secondary">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading…
        </div>
      }>
        <AuthForm />
      </Suspense>
    </div>
  );
}
