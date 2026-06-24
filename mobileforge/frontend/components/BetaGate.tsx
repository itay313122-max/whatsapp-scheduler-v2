'use client';

import { useEffect, useState } from 'react';
import { betaStatus, verifyBetaKey } from '@/lib/api';

const STORAGE_KEY = 'mf_beta_key';

/**
 * Closed-beta gate. When the backend has BETA_KEYS configured, a visitor must
 * enter a valid invite code once before using the site. The code is remembered
 * locally, so testers enter it a single time and are then unrestricted — closed,
 * but not limited in their work. If no keys are configured, the gate is bypassed.
 */
export default function BetaGate({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<'checking' | 'gate' | 'open'>('checking');
  const [key, setKey] = useState('');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { gateEnabled } = await betaStatus();
      if (!gateEnabled) return setPhase('open');
      const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (saved && (await verifyBetaKey(saved))) return setPhase('open');
      setPhase('gate');
    })();
  }, []);

  async function submit() {
    if (!key.trim() || busy) return;
    setBusy(true);
    setError(false);
    const ok = await verifyBetaKey(key.trim());
    setBusy(false);
    if (ok) {
      localStorage.setItem(STORAGE_KEY, key.trim().toUpperCase());
      setPhase('open');
    } else {
      setError(true);
    }
  }

  if (phase === 'open') return <>{children}</>;
  if (phase === 'checking') {
    return <div style={{ height: '100vh', background: '#0a0a0b' }} />;
  }

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#0a0a0b', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Heebo, system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px', color: '#fff', fontWeight: 800, fontSize: 20 }}>MF</div>
        <h1 style={{ color: '#fafafa', fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>גרסת בטא סגורה</h1>
        <p style={{ color: '#9ca3af', fontSize: 15, marginTop: 10, lineHeight: 1.5 }}>הזן את קוד ההזמנה שקיבלת כדי להיכנס ולבנות אפליקציות.</p>
        <input
          value={key}
          onChange={(e) => { setKey(e.target.value); setError(false); }}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          placeholder="MF-XXXX-XXXX"
          dir="ltr"
          style={{ width: '100%', marginTop: 22, padding: '15px 16px', borderRadius: 14, background: '#141416', border: `1px solid ${error ? '#ef4444' : '#2a2a2e'}`, color: '#fff', fontSize: 16, textAlign: 'center', letterSpacing: 1, outline: 'none' }}
        />
        {error && <div style={{ color: '#f87171', fontSize: 13, marginTop: 8 }}>קוד לא תקין — בדוק ונסה שוב.</div>}
        <button
          onClick={submit}
          disabled={!key.trim() || busy}
          style={{ width: '100%', marginTop: 14, padding: 15, borderRadius: 14, border: 'none', cursor: 'pointer', background: '#8b5cf6', color: '#fff', fontSize: 16, fontWeight: 700, opacity: !key.trim() || busy ? 0.5 : 1 }}
        >
          {busy ? 'בודק…' : 'כניסה'}
        </button>
        <p style={{ color: '#52525b', fontSize: 12, marginTop: 18 }}>אין לך קוד? בקש מהצוות.</p>
      </div>
    </div>
  );
}
