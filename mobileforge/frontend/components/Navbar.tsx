'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { logout, onAuthChange, type User } from '@/lib/firebase';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    return onAuthChange(setUser);
  }, []);

  const isBuilder = pathname?.startsWith('/builder');
  if (isBuilder) return null;

  // The landing page is dark; other pages (dashboard, auth) stay light.
  const isHome = pathname === '/';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-xl elevation-1 ${isHome ? 'bg-[#0A0A0B]/70 border-white/10' : 'border-border bg-white/80'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <span className="text-white font-display font-bold text-sm">M</span>
          </div>
          <span className="font-display font-bold text-lg text-text-primary">
            Mobile<span className="text-primary">Forge</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-text-secondary hover:text-primary text-sm font-medium transition-colors">
            בית
          </Link>
          {user && (
            <Link href="/dashboard" className="text-text-secondary hover:text-primary text-sm font-medium transition-colors">
              הפרויקטים שלי
            </Link>
          )}
        </div>

        {/* Auth */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-2 border border-border">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
                <span className="text-text-secondary text-xs truncate max-w-[120px]">
                  {user.displayName || user.email}
                </span>
              </div>
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-light text-white text-sm font-semibold transition-colors shadow-glow"
              >
                Dashboard
              </Link>
              <button
                onClick={() => logout()}
                className="px-3 py-2 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:border-primary/40 text-sm transition-all"
              >
                יציאה
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth"
                className="min-h-[44px] flex items-center text-text-secondary hover:text-primary text-sm font-medium transition-colors"
              >
                התחברות
              </Link>
              <Link
                href="/auth?mode=register"
                className="min-h-[44px] flex items-center px-4 py-2 rounded-xl bg-gradient-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-glow"
              >
                התחל בחינם
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
