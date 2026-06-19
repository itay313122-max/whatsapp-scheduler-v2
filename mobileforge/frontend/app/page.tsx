'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';

const FEATURES = [
  { icon: '⚡', title: 'AI Generation', desc: 'Groq/Llama מייצר קוד Expo מלא מתיאור בשפה טבעית — עברית ואנגלית', color: 'from-yellow-400/20 to-orange-400/10 border-orange-200' },
  { icon: '📱', title: 'Preview מיידי', desc: 'ראה את האפליקציה פועלת ישר בדפדפן דרך Expo Snack — ללא התקנה', color: 'from-sky-400/20 to-blue-400/10 border-sky-200' },
  { icon: '🌍', title: 'RTL תמיכה', desc: 'אפליקציות עבריות עם RTL מלא ו-i18n מובנה', color: 'from-emerald-400/20 to-green-400/10 border-emerald-200' },
  { icon: '🔥', title: 'Firebase מובנה', desc: 'Auth, Firestore ו-Storage — הכל כלול בפלטפורמה', color: 'from-red-400/20 to-pink-400/10 border-pink-200' },
  { icon: '📦', title: 'Export חינמי', desc: 'הקוד שלך תמיד גלוי, הורד ZIP בכל שלב ללא עלות', color: 'from-purple-400/20 to-violet-400/10 border-purple-200' },
  { icon: '🚀', title: 'Expo EAS', desc: 'build ל-iOS ו-Android עם Expo EAS מובנה בפלטפורמה', color: 'from-indigo-400/20 to-primary/10 border-indigo-200' },
];

const PROBLEMS = [
  { problem: 'Credits נעלמים בסוף החודש', solution: 'Credit pool נצבר לנצח, אין תפוגה' },
  { problem: 'רק web, לא מובייל', solution: 'Expo/React Native — iOS + Android native' },
  { problem: 'UI גנרי ומשעמם', solution: 'AI מקבל design brief מפורט, מוציא UI מרשים' },
  { problem: 'אין תמיכה בעברית/RTL', solution: 'RTL first — ברירת מחדל לעברית' },
  { problem: 'Backend חיצוני = עלות נוספת', solution: 'Firebase מובנה — DB, Auth, Storage בplan אחד' },
  { problem: 'אי אפשר לראות קוד מלא בחינם', solution: 'הקוד שלך תמיד גלוי, export חינמי תמיד' },
];

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

export default function LandingPage() {
  return (
    <main className="min-h-screen text-text-primary overflow-x-hidden" dir="rtl">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="hero-bg relative pt-32 pb-28 px-4 text-center overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-primary/8 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-72 h-72 rounded-full bg-accent/8 blur-[80px] pointer-events-none" />

        <motion.div
          className="relative max-w-4xl mx-auto"
          initial="hidden"
          animate="show"
          variants={stagger}
        >
          {/* Badge */}
          <motion.div variants={fadeUp}>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 border border-primary/20 text-primary text-sm font-semibold shadow-soft mb-7">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              Base44 למובייל — חינם בשלב הפיתוח ✨
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className="font-display font-extrabold text-5xl sm:text-6xl md:text-7xl leading-[1.1] mb-6 text-text-primary"
          >
            הפוך רעיון{' '}
            <span className="gradient-text">לאפליקציה מובייל</span>
            <br />
            תוך שניות
          </motion.h1>

          <motion.p variants={fadeUp} className="text-text-secondary text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            תאר את האפליקציה שלך בעברית. MobileForge יבנה קוד Expo מלא ויריץ אותה ישר בדפדפן.
            ללא Xcode. ללא Android Studio. ללא סיבוכים.
          </motion.p>

          {/* CTA */}
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/builder/demo"
              className="group px-8 py-4 rounded-2xl bg-gradient-primary text-white font-display font-bold text-lg shadow-glow hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              התחל לבנות — בחינם
              <span className="mr-2 group-hover:translate-x-1 inline-block transition-transform">←</span>
            </Link>
            <Link
              href="/auth"
              className="px-8 py-4 rounded-2xl border border-border bg-white/60 text-text-primary font-semibold text-lg hover:border-primary/40 hover:bg-white transition-all"
            >
              כבר יש לי חשבון
            </Link>
          </motion.div>

          <motion.p variants={fadeUp} className="text-text-soft text-sm mt-5">
            ✓ ללא כרטיס אשראי&nbsp;&nbsp;✓ 10 credits בחינם&nbsp;&nbsp;✓ Export קוד תמיד חינמי
          </motion.p>
        </motion.div>
      </section>

      {/* ── Problems vs Solutions ────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-bg">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display font-bold text-3xl sm:text-4xl mb-3 text-text-primary">
              למה לא{' '}
              <span className="text-text-secondary line-through decoration-accent">Base44</span>?
            </h2>
            <p className="text-text-secondary">
              Base44 מצוינת לweb. למובייל — נבנינו מאפס עבורך.
            </p>
          </motion.div>

          <motion.div
            className="grid gap-3"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
          >
            {PROBLEMS.map(({ problem, solution }) => (
              <motion.div
                key={problem}
                variants={fadeUp}
                className="flex items-center gap-4 p-4 rounded-2xl glass-card"
              >
                <div className="flex-shrink-0 flex items-center gap-2 flex-1">
                  <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <span className="text-text-secondary text-sm line-through">{problem}</span>
                </div>
                <div className="w-px h-8 bg-border flex-shrink-0" />
                <div className="flex-shrink-0 flex items-center gap-2 flex-1">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-text-primary text-sm font-medium">{solution}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Features Grid ────────────────────────────────────────────────── */}
      <section className="py-20 px-4 hero-bg">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display font-bold text-3xl sm:text-4xl mb-3 text-text-primary">
              כל מה שצריך לבנות אפליקציה
            </h2>
            <p className="text-text-secondary">בלי סיבוכים, בלי הגדרות ארוכות</p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
          >
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

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="py-28 px-4 text-center bg-bg">
        <motion.div
          className="max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/20 text-primary text-sm font-semibold mb-6">
            🚀 מוכן להתחיל?
          </div>
          <h2 className="font-display font-extrabold text-4xl sm:text-5xl mb-5 text-text-primary">
            בנה את האפליקציה שלך{' '}
            <span className="gradient-text">היום</span>
          </h2>
          <p className="text-text-secondary text-lg mb-8">
            10 credits בחינם. ללא כרטיס אשראי. ללא התחייבות.
          </p>
          <Link
            href="/builder/demo"
            className="inline-block px-10 py-4 rounded-2xl bg-gradient-primary text-white font-display font-bold text-xl hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-glow"
          >
            התחל עכשיו — בחינם ✨
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border text-center text-text-soft text-sm bg-surface">
        <p>MobileForge © 2024 · נבנה עם AI · Expo Snack · Firebase</p>
      </footer>
    </main>
  );
}
