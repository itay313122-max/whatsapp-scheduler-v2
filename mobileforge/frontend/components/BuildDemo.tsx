'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Auto-playing "promo video" — a looping animation that shows the core loop of
 * MobileForge: a user types a prompt, AI builds, and a finished app appears in
 * the phone. No real video file (keeps the bundle tiny and renders crisply on
 * every device); it's a deterministic CSS/framer-motion sequence that cycles
 * through several example apps so visitors immediately grasp how easy it is.
 *
 * The demo apps are intentionally restrained — lots of whitespace, one accent
 * colour each, thin type — so they read as premium product UI, not toy mockups.
 */

interface DemoApp {
  prompt: string;
  name: string;
  accent: string;
  bg: string;
  screen: React.ReactNode;
}

const DEMOS: DemoApp[] = [
  {
    prompt: 'A minimal banking app with balance and transactions',
    name: 'Lumen',
    accent: '#4F46E5',
    bg: '#FBFBFD',
    screen: (
      <div className="flex flex-col gap-3 p-4 h-full">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-medium text-gray-400 tracking-wide">Total balance</span>
          <div className="w-5 h-5 rounded-full bg-gray-100" />
        </div>
        <div className="text-[26px] font-semibold tracking-tight text-gray-900 leading-none">
          $12,480<span className="text-gray-300">.00</span>
        </div>
        <div className="flex gap-2 mt-1">
          <div className="flex-1 h-8 rounded-xl flex items-center justify-center text-[10px] font-semibold text-white" style={{ background: '#4F46E5' }}>Send</div>
          <div className="flex-1 h-8 rounded-xl flex items-center justify-center text-[10px] font-semibold text-gray-700 border border-gray-200">Request</div>
        </div>
        <div className="mt-2 flex flex-col gap-3">
          {([['Apple', '−$4.99', '#111827'], ['Spotify', '−$9.99', '#1DB954'], ['Salary', '+$3,200', '#4F46E5']] as const).map(([n, v, c], i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full" style={{ background: `${c}1a` }} />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-medium text-gray-800">{n}</div>
                <div className="text-[8px] text-gray-400">Today</div>
              </div>
              <div className="text-[10px] font-semibold" style={{ color: v.startsWith('+') ? '#16a34a' : '#374151' }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    prompt: 'A clean health tracker with daily activity',
    name: 'Vita',
    accent: '#111827',
    bg: '#FAFAFA',
    screen: (
      <div className="flex flex-col gap-3 p-4 h-full">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[9px] text-gray-400 font-medium">Wednesday</div>
            <div className="text-[13px] font-semibold text-gray-900 tracking-tight">Today</div>
          </div>
          <div className="w-7 h-7 rounded-full bg-gray-900" />
        </div>
        <div className="rounded-2xl p-3 flex items-center gap-3" style={{ background: '#fff', boxShadow: '0 1px 10px rgba(0,0,0,.05)' }}>
          <div className="relative w-12 h-12 flex-shrink-0">
            <div className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(#111827 75%, #ececef 0)' }} />
            <div className="absolute inset-[3px] rounded-full bg-white flex items-center justify-center text-[9px] font-bold text-gray-900">75%</div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-900">Daily goal</div>
            <div className="text-[8px] text-gray-400">1,860 / 2,400 kcal</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {([['Steps', '7.4k'], ['Sleep', '7h'], ['Water', '1.6L']] as const).map(([l, v], i) => (
            <div key={i} className="rounded-xl p-2 text-center" style={{ background: '#fff', boxShadow: '0 1px 6px rgba(0,0,0,.04)' }}>
              <div className="text-[11px] font-semibold text-gray-900">{v}</div>
              <div className="text-[7px] text-gray-400 mt-0.5">{l}</div>
            </div>
          ))}
        </div>
        <div className="mt-auto h-9 rounded-xl flex items-center justify-center text-[10px] font-semibold text-white" style={{ background: '#111827' }}>View insights</div>
      </div>
    ),
  },
  {
    prompt: 'An elegant booking app for a studio',
    name: 'Aura',
    accent: '#9333EA',
    bg: '#FCFBFE',
    screen: (
      <div className="flex flex-col gap-3 p-4 h-full">
        <div>
          <div className="text-[13px] font-semibold text-gray-900 leading-tight tracking-tight">Book a session</div>
          <div className="text-[8px] text-gray-400 mt-0.5">Pick a time that works for you</div>
        </div>
        <div className="flex gap-1.5">
          {([['Mon', '12'], ['Tue', '13'], ['Wed', '14'], ['Thu', '15']] as const).map(([d, n], i) => (
            <div key={i} className="flex-1 rounded-xl py-2 text-center" style={{ background: i === 2 ? '#9333EA' : '#fff', color: i === 2 ? '#fff' : '#9ca3af', boxShadow: '0 1px 5px rgba(0,0,0,.05)' }}>
              <div className="text-[7px] font-medium opacity-80">{d}</div>
              <div className="text-[11px] font-semibold">{n}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2 mt-1">
          {([['09:00', 'Available'], ['11:30', 'Available'], ['14:00', '2 left']] as const).map(([t, s], i) => (
            <div key={i} className="flex items-center justify-between rounded-xl px-3 py-2.5 border" style={{ borderColor: i === 0 ? '#9333EA' : '#f0f0f2', background: i === 0 ? '#faf5ff' : '#fff' }}>
              <span className="text-[11px] font-medium text-gray-800">{t}</span>
              <span className="text-[8px]" style={{ color: i === 0 ? '#9333EA' : '#9ca3af' }}>{s}</span>
            </div>
          ))}
        </div>
        <div className="mt-auto h-9 rounded-xl flex items-center justify-center text-[10px] font-semibold text-white" style={{ background: '#9333EA' }}>Confirm · 14:00</div>
      </div>
    ),
  },
];

type Phase = 'typing' | 'building' | 'done';

export default function BuildDemo() {
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState('');
  const [phase, setPhase] = useState<Phase>('typing');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const demo = DEMOS[idx];
    const full = demo.prompt;
    let char = 0;
    setTyped('');
    setPhase('typing');
    const clearAll = () => { timers.current.forEach(clearTimeout); timers.current = []; };

    function typeNext() {
      if (char <= full.length) {
        setTyped(full.slice(0, char));
        char++;
        timers.current.push(setTimeout(typeNext, 45));
      } else {
        timers.current.push(setTimeout(() => setPhase('building'), 500));
        timers.current.push(setTimeout(() => setPhase('done'), 2300));
        timers.current.push(setTimeout(() => setIdx((p) => (p + 1) % DEMOS.length), 5200));
      }
    }
    timers.current.push(setTimeout(typeNext, 400));
    return clearAll;
  }, [idx]);

  const demo = DEMOS[idx];

  return (
    <div className="relative mx-auto max-w-3xl">
      <div className="rounded-3xl border border-primary/20 bg-white/[0.03] backdrop-blur-xl p-5 sm:p-7 shadow-glow overflow-hidden">
        {/* Fake browser chrome */}
        <div className="flex items-center gap-1.5 mb-5">
          <span className="w-3 h-3 rounded-full bg-red-400/80" />
          <span className="w-3 h-3 rounded-full bg-yellow-400/80" />
          <span className="w-3 h-3 rounded-full bg-green-400/80" />
          <div className="ml-3 flex-1 h-6 rounded-md bg-white/5 border border-white/10 flex items-center px-3">
            <span className="text-[10px] text-text-soft">mobileforge.app/builder</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
          {/* Left: prompt + status */}
          <div className="text-left">
            <div className="text-[11px] uppercase tracking-wider text-primary-light font-semibold mb-2">Your prompt</div>
            <div className="min-h-[88px] rounded-2xl bg-white/5 border border-primary/30 p-4">
              <p className="text-text-primary text-sm sm:text-base leading-relaxed">
                {typed}
                {phase === 'typing' && <span className="inline-block w-[2px] h-[18px] bg-primary align-middle animate-pulse ml-0.5" />}
              </p>
            </div>

            <div className="mt-4 h-7">
              <AnimatePresence mode="wait">
                {phase === 'building' && (
                  <motion.div
                    key="building"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="flex items-center gap-2 text-sm text-primary-light"
                  >
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    AI is building your app…
                  </motion.div>
                )}
                {phase === 'done' && (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="flex items-center gap-2 text-sm text-green-400 font-semibold"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {demo.name} is ready — in seconds!
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right: phone with the app */}
          <div className="flex justify-center">
            <div className="relative w-[180px] h-[368px] rounded-[34px] border-[7px] border-[#1a1a1d] bg-black shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-4 bg-[#1a1a1d] rounded-b-xl z-10" />
              <AnimatePresence mode="wait">
                {phase === 'done' ? (
                  <motion.div
                    key={`screen-${idx}`}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0"
                    style={{ background: demo.bg }}
                  >
                    {demo.screen}
                  </motion.div>
                ) : (
                  <motion.div
                    key="skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col gap-2 p-3"
                    style={{ background: '#0f0f12' }}
                  >
                    {phase === 'building' ? (
                      <>
                        <div className="h-6 rounded-lg shimmer-dark" />
                        <div className="flex gap-2">
                          {[0, 1, 2, 3].map((i) => <div key={i} className="flex-1 aspect-square rounded-xl shimmer-dark" />)}
                        </div>
                        <div className="flex-1 rounded-xl shimmer-dark" />
                        <div className="h-9 rounded-xl shimmer-dark" />
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center">
                        <span className="text-text-soft text-[10px]">Waiting for your idea…</span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-6">
          {DEMOS.map((_, i) => (
            <span
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{ width: i === idx ? 24 : 6, background: i === idx ? 'var(--c-primary, #8B5CF6)' : 'rgba(255,255,255,.2)' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
