'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { submitFeedback } from '@/lib/api';

/**
 * Floating "send feedback" button shown to beta testers. Collects a short note,
 * a star rating, and an optional name, and posts it to /api/feedback so the
 * team can review all reports in one place during the 3-day test.
 */
export default function FeedbackWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [rating, setRating] = useState(0);
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');

  async function send() {
    if (!text.trim() || status === 'sending') return;
    setStatus('sending');
    const res = await submitFeedback({ text, rating, name, page: pathname || '/' });
    setStatus(res.ok ? 'done' : 'idle');
    if (res.ok) {
      setText('');
      setRating(0);
      setTimeout(() => { setOpen(false); setStatus('idle'); }, 1800);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        dir="ltr"
        className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1a1a1e]/90 backdrop-blur border border-white/10 hover:border-white/20 text-white/80 hover:text-white text-[13px] font-medium shadow-sm transition-all active:scale-[0.98]"
        title="Send feedback"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.8L3 21l1.8-4A8.5 8.5 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span>Feedback</span>
      </button>

      {/* Panel */}
      {open && (
        <div dir="ltr" className="fixed bottom-20 right-5 z-[60] w-[320px] max-w-[90vw] rounded-2xl bg-[#15151a] border border-white/10 shadow-2xl p-4 animate-fade-in-up">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white font-bold text-sm">How was it? We'd love to hear 🙏</h3>
            <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white/80 text-lg leading-none">×</button>
          </div>

          {status === 'done' ? (
            <div className="py-8 text-center text-emerald-400 text-sm font-semibold">Thank you! Your feedback was sent ✓</div>
          ) : (
            <>
              <div className="flex gap-1 mb-3" dir="ltr">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setRating(s)} className="text-2xl transition-transform hover:scale-110" title={`${s}`}>
                    <span className={s <= rating ? 'opacity-100' : 'opacity-30'}>⭐</span>
                  </button>
                ))}
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="What did you like? What was confusing? What broke? Anything helps…"
                rows={4}
                className="w-full rounded-xl bg-black/30 border border-white/10 text-white text-sm p-3 placeholder-white/30 focus:outline-none focus:border-violet-500 resize-none"
              />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name (optional)"
                className="w-full mt-2 rounded-xl bg-black/30 border border-white/10 text-white text-sm px-3 py-2 placeholder-white/30 focus:outline-none focus:border-violet-500"
              />
              <button
                onClick={send}
                disabled={!text.trim() || status === 'sending'}
                className="w-full mt-3 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-all disabled:opacity-40"
              >
                {status === 'sending' ? 'Sending…' : 'Send feedback'}
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
