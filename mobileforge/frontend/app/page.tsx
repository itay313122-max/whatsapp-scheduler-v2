'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { createLocalProjectId } from '@/lib/localProjects';

const TEMPLATES = [
  { emoji: '🛍️', name: 'חנות אונליין', prompt: 'בנה לי אפליקציית חנות אונליין עם קטלוג מוצרים, סל קניות ומסך תשלום', gradient: 'from-purple-500 to-pink-500' },
  { emoji: '🍕', name: 'מסעדה', prompt: 'בנה לי אפליקציית הזמנות למסעדה עם תפריט מחולק לקטגוריות וסל הזמנות', gradient: 'from-orange-500 to-red-500' },
  { emoji: '💪', name: 'כושר', prompt: 'בנה לי אפליקציית מעקב כושר עם תוכניות אימון, טיימר ומעקב התקדמות', gradient: 'from-emerald-500 to-teal-500' },
  { emoji: '✅', name: 'משימות', prompt: 'בנה לי אפליקציית ניהול משימות עם קטגוריות, תיעדוף ופס התקדמות', gradient: 'from-blue-500 to-cyan-500' },
  { emoji: '💰', name: 'פיננסים', prompt: 'בנה לי אפליקציית ניהול תקציב עם הוצאות, הכנסות ותרשימים', gradient: 'from-yellow-500 to-amber-500' },
  { emoji: '🌤️', name: 'מזג אוויר', prompt: 'בנה לי אפליקציית מזג אוויר עם תחזית שעתית ושבועית ואייקונים', gradient: 'from-sky-500 to-blue-500' },
];

const STEPS = [
  { num: '1', title: 'תאר מה אתה רוצה', desc: 'כתוב בעברית או באנגלית מה האפליקציה צריכה לעשות', icon: '💬' },
  { num: '2', title: 'AI בונה בשניות', desc: 'המערכת מייצרת קוד מלא עם עיצוב מקצועי ולוגיקה עובדת', icon: '⚡' },
  { num: '3', title: 'ערוך ושתף', desc: 'שנה צבעים, טקסטים ומסכים בלחיצה. שתף לינק או הורד לטלפון', icon: '🚀' },
];

const FEATURES = [
  { icon: '⚡', title: 'ייצור ב-10 שניות', desc: 'AI בונה אפליקציה מלאה מתיאור קצר — כולל UI, לוגיקה וניווט', color: 'from-yellow-400/20 to-orange-400/10 border-orange-200' },
  { icon: '📱', title: 'פריוויו מיידי', desc: 'ראה את האפליקציה על iPhone, Android ודסקטופ — עוד לפני שיתוף', color: 'from-sky-400/20 to-blue-400/10 border-sky-200' },
  { icon: '✏️', title: 'עריכה חיה', desc: 'לחץ על כל טקסט בפריוויו כדי לערוך אותו ישירות. שנה צבעים, פונטים ורכיבים', color: 'from-emerald-400/20 to-green-400/10 border-emerald-200' },
  { icon: '🔗', title: 'שתף בלינק', desc: 'כפתור אחד — לינק ציבורי לאפליקציה שלך. שלח לחברים, ללקוחות, למשקיעים', color: 'from-violet-400/20 to-purple-400/10 border-violet-200' },
  { icon: '📦', title: 'הורד והתקן', desc: 'הורד כ-HTML עצמאי או כ-PWA להתקנה על הטלפון — בחינם, בלי חנויות', color: 'from-pink-400/20 to-rose-400/10 border-pink-200' },
  { icon: '🌍', title: 'עברית מלאה', desc: 'RTL מובנה, תמיכה בעברית, ערבית ואנגלית — AI מבין מה שאתה כותב', color: 'from-indigo-400/20 to-primary/10 border-indigo-200' },
];

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

export default function LandingPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');

  function handleGo(customPrompt?: string) {
    const text = customPrompt || prompt;
    if (!text.trim()) return;
    const id = createLocalProjectId();
    router.push(`/builder/${id}?prompt=${encodeURIComponent(text)}`);
  }

  return (
    <main className="min-h-screen text-text-primary overflow-x-hidden" dir="rtl">
      <Navbar />

      {/* ── Hero with Input ─────────────────────────────────────────────── */}
      <section className="hero-bg relative pt-28 pb-20 px-4 text-center overflow-hidden">
        <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-primary/8 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-72 h-72 rounded-full bg-accent/8 blur-[80px] pointer-events-none" />

        <motion.div className="relative max-w-4xl mx-auto" initial="hidden" animate="show" variants={stagger}>
          <motion.div variants={fadeUp}>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 border border-primary/20 text-primary text-sm font-semibold shadow-soft mb-6">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              AI בונה לך אפליקציה מוכנה — בחינם
            </span>
          </motion.div>

          <motion.h1 variants={fadeUp} className="font-display font-extrabold text-5xl sm:text-6xl md:text-7xl leading-[1.1] mb-5 text-text-primary">
            תאר.{' '}
            <span className="gradient-text">AI יבנה.</span>
            <br />
            שתף.
          </motion.h1>

          <motion.p variants={fadeUp} className="text-text-secondary text-lg sm:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
            כתוב מה האפליקציה צריכה לעשות — AI יבנה אותה בשניות.
            <br className="hidden sm:block" />
            ערוך, שתף לינק, או הורד לטלפון. הכל בחינם.
          </motion.p>

          {/* Prompt Input */}
          <motion.div variants={fadeUp} className="max-w-xl mx-auto mb-6">
            <div className="relative flex items-center gap-2 p-2 rounded-2xl glass-card shadow-glow border border-primary/20">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleGo(); }}
                placeholder="תאר את האפליקציה שלך... למשל: אפליקציית משימות עם קטגוריות"
                className="flex-1 px-4 py-3 bg-transparent text-text-primary placeholder-text-soft text-sm sm:text-base focus:outline-none"
                dir="rtl"
              />
              <button
                onClick={() => handleGo()}
                disabled={!prompt.trim()}
                className="px-6 py-3 rounded-xl bg-gradient-primary text-white font-display font-bold text-sm sm:text-base hover:opacity-90 active:scale-[0.97] transition-all disabled:opacity-40 shadow-glow flex-shrink-0"
              >
                בנה עכשיו
              </button>
            </div>
          </motion.div>

          <motion.p variants={fadeUp} className="text-text-soft text-xs mb-10">
            ללא הרשמה. ללא כרטיס אשראי. התחל מייד.
          </motion.p>

          {/* Template chips */}
          <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
            {TEMPLATES.map((t) => (
              <button
                key={t.name}
                onClick={() => handleGo(t.prompt)}
                className="group flex items-center gap-1.5 px-4 py-2 rounded-full glass-card border border-border hover:border-primary/30 text-text-secondary hover:text-text-primary text-sm transition-all hover:shadow-soft"
              >
                <span>{t.emoji}</span>
                <span>{t.name}</span>
                <svg className="w-3 h-3 opacity-0 group-hover:opacity-60 -mr-1 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-bg">
        <div className="max-w-4xl mx-auto">
          <motion.div className="text-center mb-14" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-display font-bold text-3xl sm:text-4xl mb-3 text-text-primary">
              שלושה צעדים לאפליקציה
            </h2>
            <p className="text-text-secondary">מרעיון לאפליקציה חיה — בלי קוד, בלי סיבוכים</p>
          </motion.div>

          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-8" initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            {STEPS.map((step) => (
              <motion.div key={step.num} variants={fadeUp} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center text-3xl mx-auto mb-4 shadow-card">
                  {step.icon}
                </div>
                <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white font-display font-bold text-xs mb-3">
                  {step.num}
                </div>
                <h3 className="font-display font-bold text-lg mb-2 text-text-primary">{step.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Features Grid ────────────────────────────────────────────────── */}
      <section className="py-20 px-4 hero-bg">
        <div className="max-w-5xl mx-auto">
          <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-display font-bold text-3xl sm:text-4xl mb-3 text-text-primary">
              הכל כלול — בחינם
            </h2>
            <p className="text-text-secondary">כל מה שצריך כדי לבנות, לערוך ולשתף</p>
          </motion.div>

          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            {FEATURES.map(({ icon, title, desc, color }) => (
              <motion.div
                key={title}
                variants={fadeUp}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`p-6 rounded-2xl bg-gradient-to-br border glass-card ${color}`}
              >
                <div className="text-3xl mb-4">{icon}</div>
                <h3 className="font-display font-bold text-base mb-2 text-text-primary">{title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Social Proof Numbers ─────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-bg">
        <div className="max-w-4xl mx-auto">
          <motion.div className="grid grid-cols-3 gap-6 text-center" initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            {[
              { value: '10+', label: 'שניות לאפליקציה' },
              { value: '100%', label: 'חינם — ללא הגבלה' },
              { value: '0', label: 'שורות קוד נדרשות' },
            ].map(({ value, label }) => (
              <motion.div key={label} variants={fadeUp}>
                <div className="font-display font-extrabold text-3xl sm:text-4xl gradient-text mb-1">{value}</div>
                <div className="text-text-secondary text-sm">{label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 text-center hero-bg">
        <motion.div className="max-w-2xl mx-auto" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="font-display font-extrabold text-4xl sm:text-5xl mb-5 text-text-primary">
            מוכן לבנות את{' '}
            <span className="gradient-text">האפליקציה שלך</span>?
          </h2>
          <p className="text-text-secondary text-lg mb-8">
            תאר מה אתה רוצה. AI יעשה את השאר.
          </p>
          <Link
            href="/builder/demo"
            className="inline-block px-10 py-4 rounded-2xl bg-gradient-primary text-white font-display font-bold text-xl hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-glow"
          >
            התחל עכשיו — בחינם
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border text-center text-text-soft text-sm bg-surface">
        <p>MobileForge &copy; {new Date().getFullYear()} &middot; בנה אפליקציות עם AI</p>
      </footer>
    </main>
  );
}
