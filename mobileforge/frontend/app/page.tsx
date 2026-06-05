import Link from 'next/link';
import Navbar from '@/components/Navbar';

const FEATURES = [
  {
    icon: '⚡',
    title: 'AI Generation',
    desc: 'Claude מייצר קוד Expo מלא מתיאור בשפה טבעית — עברית ואנגלית',
  },
  {
    icon: '📱',
    title: 'Preview מיידי',
    desc: 'ראה את האפליקציה פועלת ישר בדפדפן דרך Expo Snack — ללא התקנה',
  },
  {
    icon: '🌍',
    title: 'RTL תמיכה',
    desc: 'אפליקציות עבריות עם RTL מלא ו-i18n מובנה',
  },
  {
    icon: '🔥',
    title: 'Firebase מובנה',
    desc: 'Auth, Firestore ו-Storage — הכל כלול בפלטפורמה',
  },
  {
    icon: '📦',
    title: 'Export חינמי',
    desc: 'הקוד שלך תמיד גלוי, הורד ZIP בכל שלב ללא עלות',
  },
  {
    icon: '🚀',
    title: 'Expo EAS',
    desc: 'build ל-iOS ו-Android עם Expo EAS מובנה בפלטפורמה',
  },
];

const PROBLEMS = [
  { problem: 'Credits נעלמים בסוף החודש', solution: 'Credit pool נצבר לנצח, אין תפוגה' },
  { problem: 'רק web, לא מובייל', solution: 'Expo/React Native — iOS + Android native' },
  { problem: 'UI גנרי ומשעמם', solution: 'AI מקבל design brief מפורט, מוציא UI מרשים' },
  { problem: 'אין תמיכה בעברית/RTL', solution: 'RTL first — ברירת מחדל לעברית' },
  { problem: 'Backend חיצוני = עלות נוספת', solution: 'Firebase מובנה — DB, Auth, Storage בplan אחד' },
  { problem: 'אי אפשר לראות קוד מלא בחינם', solution: 'הקוד שלך תמיד גלוי, export חינמי תמיד' },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-bg text-text-primary overflow-x-hidden" dir="rtl">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-4 text-center">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm mb-6">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            Base44 למובייל, אבל כמו שצריך
          </div>

          {/* Headline */}
          <h1 className="font-display font-bold text-5xl sm:text-6xl md:text-7xl leading-tight mb-6">
            בנה אפליקציות{' '}
            <span className="gradient-text">iOS & Android</span>
            <br />
            עם AI — בשניות
          </h1>

          <p className="text-text-secondary text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            תאר את האפליקציה שלך בעברית. MobileForge יבנה קוד Expo מלא ויריץ אותה ישר בדפדפן.
            ללא Xcode. ללא Android Studio. ללא סיבוכים.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth?mode=register"
              className="px-8 py-4 rounded-2xl bg-gradient-primary text-white font-display font-semibold text-lg hover:opacity-90 transition-opacity shadow-glow"
            >
              התחל לבנות — בחינם
            </Link>
            <Link
              href="/auth"
              className="px-8 py-4 rounded-2xl border border-border text-text-primary font-semibold text-lg hover:border-primary/50 transition-colors"
            >
              כבר יש לי חשבון
            </Link>
          </div>

          <p className="text-text-secondary text-sm mt-4">
            ✓ ללא כרטיס אשראי&nbsp;&nbsp;✓ 10 credits בחינם&nbsp;&nbsp;✓ Export קוד תמיד חינמי
          </p>
        </div>
      </section>

      {/* Problems vs Solutions */}
      <section className="py-20 px-4 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display font-bold text-3xl sm:text-4xl mb-4">
            למה לא{' '}
            <span className="text-text-secondary line-through">Base44</span>?
          </h2>
          <p className="text-text-secondary">
            Base44 מצוינת לweb. למובייל — נבנינו מאפס עבורך.
          </p>
        </div>

        <div className="grid gap-3">
          {PROBLEMS.map(({ problem, solution }) => (
            <div
              key={problem}
              className="flex items-start gap-4 p-4 rounded-2xl bg-surface border border-border"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center mt-0.5">
                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <span className="text-text-secondary text-sm flex-1">{problem}</span>
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center mt-0.5">
                <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-text-primary text-sm flex-1">{solution}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-surface/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl sm:text-4xl mb-4">
              כל מה שצריך לבנות אפליקציה
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon, title, desc }) => (
              <div
                key={title}
                className="p-6 rounded-2xl bg-surface border border-border hover:border-primary/30 transition-all group"
              >
                <div className="text-3xl mb-4">{icon}</div>
                <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display font-bold text-4xl sm:text-5xl mb-6">
            מוכן לבנות?
          </h2>
          <p className="text-text-secondary text-lg mb-8">
            10 credits בחינם. ללא כרטיס אשראי. ללא התחייבות.
          </p>
          <Link
            href="/auth?mode=register"
            className="inline-block px-10 py-4 rounded-2xl bg-gradient-primary text-white font-display font-semibold text-xl hover:opacity-90 transition-opacity shadow-glow"
          >
            התחל עכשיו — בחינם
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border text-center text-text-secondary text-sm">
        <p>MobileForge © 2024 · נבנה עם Claude AI · Expo Snack</p>
      </footer>
    </main>
  );
}
