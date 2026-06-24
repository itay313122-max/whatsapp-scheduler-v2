'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Auto-playing "promo video" — a looping animation that shows the core loop of
 * MobileForge: a user types a prompt, AI builds, and a finished app appears in
 * the phone. No real video file (keeps the bundle tiny and renders crisply on
 * every device); it's a deterministic CSS/framer-motion sequence that cycles
 * through several example apps so visitors immediately grasp how easy it is.
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
    prompt: 'A food delivery app with categories and cart',
    name: 'FoodGo',
    accent: '#FF6B35',
    bg: '#FFF8F3',
    screen: (
      <div className="flex flex-col gap-2 p-3 h-full">
        <div className="h-6 rounded-lg" style={{ background: '#FF6B35' }} />
        <div className="flex gap-2">
          {['🍕', '🍔', '🍣', '🥗'].map((e, i) => (
            <div key={i} className="flex-1 aspect-square rounded-xl flex items-center justify-center text-base" style={{ background: '#FFEDE3' }}>{e}</div>
          ))}
        </div>
        <div className="flex-1 rounded-xl p-2 flex flex-col gap-2" style={{ background: '#fff', boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg" style={{ background: '#FFEDE3' }} />
              <div className="flex-1">
                <div className="h-2 w-3/4 rounded-full" style={{ background: '#E5E5E5' }} />
                <div className="h-2 w-1/3 rounded-full mt-1" style={{ background: '#FF6B35' }} />
              </div>
            </div>
          ))}
        </div>
        <div className="h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold" style={{ background: '#FF6B35' }}>Order now · $24</div>
      </div>
    ),
  },
  {
    prompt: 'A fitness tracker with workout logging',
    name: 'FitPulse',
    accent: '#7C3AED',
    bg: '#F5F3FF',
    screen: (
      <div className="flex flex-col gap-2 p-3 h-full">
        <div className="rounded-xl p-3 text-white" style={{ background: 'linear-gradient(135deg,#7C3AED,#A78BFA)' }}>
          <div className="text-[8px] opacity-80">Today</div>
          <div className="text-lg font-bold">1,240 kcal</div>
        </div>
        <div className="flex gap-2">
          {[['Steps', '8.2k'], ['Min', '46'], ['BPM', '72']].map(([l, v], i) => (
            <div key={i} className="flex-1 rounded-xl p-2 text-center" style={{ background: '#fff', boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
              <div className="text-xs font-bold" style={{ color: '#7C3AED' }}>{v}</div>
              <div className="text-[7px] text-gray-400">{l}</div>
            </div>
          ))}
        </div>
        <div className="flex-1 rounded-xl p-2 flex items-end gap-1.5" style={{ background: '#fff', boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
          {[40, 70, 55, 90, 65, 80, 50].map((h, i) => (
            <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: i === 3 ? '#7C3AED' : '#DDD6FE' }} />
          ))}
        </div>
        <div className="h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold" style={{ background: '#7C3AED' }}>+ Log workout</div>
      </div>
    ),
  },
  {
    prompt: 'A booking app for a hair salon',
    name: 'GlowBook',
    accent: '#EC4899',
    bg: '#FDF2F8',
    screen: (
      <div className="flex flex-col gap-2 p-3 h-full">
        <div className="h-6 rounded-lg flex items-center px-2 text-[9px] font-bold text-white" style={{ background: '#EC4899' }}>Book an appointment</div>
        <div className="flex gap-1.5">
          {['Mon', 'Tue', 'Wed', 'Thu'].map((d, i) => (
            <div key={i} className="flex-1 rounded-lg py-1.5 text-center text-[8px]" style={{ background: i === 1 ? '#EC4899' : '#fff', color: i === 1 ? '#fff' : '#999', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
              <div className="font-bold">{d}</div>
              <div>{12 + i}</div>
            </div>
          ))}
        </div>
        <div className="flex-1 rounded-xl p-2 flex flex-col gap-1.5" style={{ background: '#fff', boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
          {['09:00', '10:30', '13:00'].map((t, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg px-2 py-1.5" style={{ background: i === 0 ? '#FCE7F3' : '#F9FAFB' }}>
              <span className="text-[9px] font-semibold text-gray-700">{t}</span>
              <span className="text-[8px]" style={{ color: '#EC4899' }}>Available</span>
            </div>
          ))}
        </div>
        <div className="h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold" style={{ background: '#EC4899' }}>Confirm booking</div>
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
