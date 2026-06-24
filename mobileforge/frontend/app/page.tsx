'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { createLocalProjectId } from '@/lib/localProjects';

const TEMPLATES = [
  { emoji: '🛍️', name: 'Online Store', prompt: 'Build me an online store app with a product catalog, shopping cart, and checkout screen', gradient: 'from-purple-500 to-pink-500' },
  { emoji: '🍕', name: 'Restaurant', prompt: 'Build me a restaurant ordering app with a menu split into categories and an order cart', gradient: 'from-orange-500 to-red-500' },
  { emoji: '💪', name: 'Fitness', prompt: 'Build me a fitness tracking app with workout plans, a timer, and progress tracking', gradient: 'from-emerald-500 to-teal-500' },
  { emoji: '✅', name: 'Tasks', prompt: 'Build me a task management app with categories, prioritization, and a progress bar', gradient: 'from-blue-500 to-cyan-500' },
  { emoji: '💰', name: 'Finance', prompt: 'Build me a budgeting app with expenses, income, and charts', gradient: 'from-yellow-500 to-amber-500' },
  { emoji: '🌤️', name: 'Weather', prompt: 'Build me a weather app with hourly and weekly forecasts and icons', gradient: 'from-sky-500 to-blue-500' },
];

const STEPS = [
  { num: '1', title: 'Describe what you want', desc: 'Write in English or any language what the app should do', icon: '💬' },
  { num: '2', title: 'AI builds in seconds', desc: 'The system generates complete code with professional design and working logic', icon: '⚡' },
  { num: '3', title: 'Edit and share', desc: 'Change colors, text, and screens with a click. Share a link or download to your phone', icon: '🚀' },
];

const FEATURES = [
  { icon: '⚡', title: 'Generate in 10 seconds', desc: 'AI builds a complete app from a short description — including UI, logic, and navigation', color: 'from-yellow-400/10 to-orange-400/5 border-white/10' },
  { icon: '📱', title: 'Instant preview', desc: 'See your app on iPhone, Android, and desktop — before you even share it', color: 'from-sky-400/10 to-blue-400/5 border-white/10' },
  { icon: '✏️', title: 'Live editing', desc: 'Click any text in the preview to edit it directly. Change colors, fonts, and components', color: 'from-emerald-400/10 to-green-400/5 border-white/10' },
  { icon: '🔗', title: 'Share a link', desc: 'One button — a public link to your app. Send it to friends, clients, and investors', color: 'from-violet-400/10 to-purple-400/5 border-white/10' },
  { icon: '📦', title: 'Download and install', desc: 'Download as standalone HTML or a PWA to install on your phone — free, no app stores', color: 'from-pink-400/10 to-rose-400/5 border-white/10' },
  { icon: '🌍', title: 'Multilingual', desc: 'English by default, with full support for Hebrew, Arabic, and more — AI understands whatever you write', color: 'from-indigo-400/10 to-primary/5 border-white/10' },
];

const COMPARISONS = [
  { feature: 'Mobile-first design', others: false, mf: true },
  { feature: 'Free to use', others: 'Limited', mf: true },
  { feature: 'Phone preview & sync', others: false, mf: true },
  { feature: 'Publish to app stores', others: false, mf: true },
  { feature: 'Build in 10 seconds', others: 'Minutes', mf: true },
];

const TESTIMONIALS = [
  {
    quote: 'I built a complete restaurant app in under a minute. The AI understood exactly what I wanted.',
    name: 'Alex K.',
    role: 'Product Designer',
    initials: 'AK',
    color: 'from-violet-500 to-purple-600',
  },
  {
    quote: 'The preview sync to my phone is incredible. I could test my app live while building it.',
    name: 'Sarah M.',
    role: 'Startup Founder',
    initials: 'SM',
    color: 'from-pink-500 to-rose-600',
  },
  {
    quote: 'Way better than trying to mockup in Figma. This actually generates working code.',
    name: 'David R.',
    role: 'Developer',
    initials: 'DR',
    color: 'from-emerald-500 to-teal-600',
  },
];

const FAQS = [
  {
    q: 'Is MobileForge really free?',
    a: 'Yes! The core builder is completely free. Generate apps, preview them, edit, and share — no credit card needed. Premium features like app store publishing and AI promo videos will be available in the Pro plan.',
  },
  {
    q: 'What kind of apps can I build?',
    a: 'Anything from fitness trackers and restaurant menus to budget managers and social networks. MobileForge generates complete, interactive React apps with real navigation, data management, and animations.',
  },
  {
    q: 'Can I publish my app to the App Store or Google Play?',
    a: 'You can export your app as a PWA and publish to Google Play and Samsung Galaxy Store right now. Full App Store and Google Play native publishing is coming in the Pro plan.',
  },
  {
    q: 'Do I need to know how to code?',
    a: 'Not at all. Describe your app in plain language, pick a design style, and MobileForge handles the rest. You can also edit visually by clicking elements in the preview.',
  },
  {
    q: 'What languages does MobileForge support?',
    a: 'The builder interface is in English. The AI understands prompts in any language — English, Hebrew, Arabic, Spanish, and more. Apps are generated in the language you describe them in.',
  },
  {
    q: 'How is this different from Lovable or Bolt?',
    a: 'MobileForge is built specifically for mobile apps. While Lovable and Bolt focus on web apps, MobileForge generates mobile-optimized layouts with native-feeling navigation, phone-sized previews, and direct publishing to mobile app stores.',
  },
];

const FOOTER_PRODUCT = [
  { label: 'Builder', href: '/builder/demo' },
  { label: 'Templates', href: '#' },
  { label: 'Pricing', href: '#' },
  { label: 'Docs', href: '#' },
];
const FOOTER_COMPANY = [
  { label: 'About', href: '#' },
  { label: 'Blog', href: '#' },
  { label: 'Contact', href: '#' },
  { label: 'Careers', href: '#' },
];
const FOOTER_LEGAL = [
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Service', href: '#' },
  { label: 'Cookie Policy', href: '#' },
];

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

// Product-first hero visual — a real app built with MobileForge, shown inside
// the phone frame so visitors see authentic output the moment they land
// (the Lovable/v0 pattern). Using a real screenshot guarantees it renders
// crisply everywhere.
function HeroAppMockup() {
  return (
    <img
      src="/hero-app.png"
      alt="An app built with MobileForge"
      width={246}
      height={533}
      className="block w-full rounded-[28px]"
      loading="eager"
    />
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  function handleGo(customPrompt?: string) {
    const text = customPrompt || prompt;
    if (!text.trim()) return;
    const id = createLocalProjectId();
    router.push(`/builder/${id}?prompt=${encodeURIComponent(text)}`);
  }

  return (
    <main className="theme-dark min-h-screen text-text-primary overflow-x-hidden bg-bg" dir="ltr">
      <Navbar />

      {/* ── Hero with Input ─────────────────────────────────────────────── */}
      <section className="grid-bg relative pt-28 pb-24 px-4 text-center overflow-hidden">
        <div className="glow-orb top-[-60px] right-1/4 w-[420px] h-[420px]" style={{ background: '#8B5CF6' }} />
        <div className="glow-orb bottom-[-80px] left-1/4 w-[380px] h-[380px]" style={{ background: '#EC4899', opacity: 0.35 }} />

        <motion.div className="relative max-w-4xl mx-auto" initial="hidden" animate="show" variants={stagger}>
          <motion.div variants={fadeUp}>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-primary/30 text-primary-light text-sm font-semibold backdrop-blur-md mb-6">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              Built for the AI era · Build mobile apps for free
            </span>
          </motion.div>

          <motion.h1 variants={fadeUp} className="font-display font-extrabold text-5xl sm:text-6xl md:text-7xl leading-[1.05] mb-5 text-text-primary tracking-tight">
            Describe.{' '}
            <span className="gradient-text">AI builds.</span>
            <br />
            Share.
          </motion.h1>

          <motion.p variants={fadeUp} className="text-text-secondary text-lg sm:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
            Write what your app should do — AI builds it in seconds.
            <br className="hidden sm:block" />
            Edit, share a link, or download to your phone. All for free.
          </motion.p>

          {/* Prompt Input */}
          <motion.div variants={fadeUp} className="max-w-xl mx-auto mb-6">
            <div className="relative flex items-center gap-2 p-2 rounded-2xl bg-white/5 backdrop-blur-xl border border-primary/30 shadow-glow">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleGo(); }}
                placeholder="Describe your app... e.g. a task app with categories"
                className="flex-1 px-4 py-3 min-h-[48px] bg-transparent text-text-primary placeholder-text-soft text-sm sm:text-base focus:outline-none"
                dir="ltr"
              />
              <button
                onClick={() => handleGo()}
                disabled={!prompt.trim()}
                className="px-6 py-3 min-h-[48px] rounded-xl bg-gradient-primary text-white font-display font-bold text-sm sm:text-base hover:opacity-90 active:scale-[0.97] transition-all disabled:opacity-40 shadow-glow flex-shrink-0"
              >
                Build now
              </button>
            </div>
          </motion.div>

          <motion.p variants={fadeUp} className="text-text-soft text-xs mb-9">
            No signup. No credit card. Start instantly.
          </motion.p>

          {/* Template chips */}
          <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto mb-16">
            {TEMPLATES.map((t) => (
              <button
                key={t.name}
                onClick={() => handleGo(t.prompt)}
                className="group flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-full bg-white/5 border border-border hover:border-primary/40 text-text-secondary hover:text-text-primary text-sm transition-all backdrop-blur-md"
              >
                <span>{t.emoji}</span>
                <span>{t.name}</span>
                <svg className="w-3 h-3 opacity-0 group-hover:opacity-60 -ml-1 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </motion.div>

          {/* ── Product-first visual: live app mockup in a phone frame ─────── */}
          <motion.div
            variants={fadeUp}
            className="relative mx-auto w-[270px] animate-float"
          >
            <div className="phone-frame">
              <HeroAppMockup />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-bg">
        <div className="max-w-4xl mx-auto">
          <motion.div className="text-center mb-14" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-display font-bold text-3xl sm:text-4xl mb-3 text-text-primary">
              Three steps to an app
            </h2>
            <p className="text-text-secondary">From idea to a live app — no code, no hassle</p>
          </motion.div>

          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-8" initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            {STEPS.map((step) => (
              <motion.div key={step.num} variants={fadeUp} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-surface border border-border flex items-center justify-center text-3xl mx-auto mb-4 shadow-card elevation-2">
                  {step.icon}
                </div>
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-display font-bold text-xs mb-3">
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
              Everything included — for free
            </h2>
            <p className="text-text-secondary">Everything you need to build, edit, and share</p>
          </motion.div>

          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            {FEATURES.map(({ icon, title, desc, color }) => (
              <motion.div
                key={title}
                variants={fadeUp}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`p-6 rounded-2xl bg-gradient-to-br border backdrop-blur-md press-effect ${color}`}
              >
                <div className="text-2xl mb-3 w-12 h-12 rounded-xl flex items-center justify-center bg-white/10 border border-white/10">{icon}</div>
                <h3 className="font-display font-bold text-base mb-2 text-text-primary">{title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Why MobileForge — Comparison ──────────────────────────────────── */}
      <section className="py-20 px-4 bg-bg">
        <div className="max-w-4xl mx-auto">
          <motion.div className="text-center mb-14" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-display font-bold text-3xl sm:text-4xl mb-3 text-text-primary">
              Why <span className="gradient-text">MobileForge</span>?
            </h2>
            <p className="text-text-secondary">See how we compare to other AI builders</p>
          </motion.div>

          <motion.div
            className="rounded-2xl overflow-hidden border border-[#2A2A2E] bg-[#111113]"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {/* Header row */}
            <div className="grid grid-cols-3 text-center border-b border-[#2A2A2E]">
              <div className="p-4 sm:p-5 text-text-secondary font-display font-semibold text-sm">Feature</div>
              <div className="p-4 sm:p-5 text-text-secondary font-display font-semibold text-sm">Others</div>
              <div className="p-4 sm:p-5 font-display font-bold text-sm relative">
                <span className="gradient-text">MobileForge</span>
                <div className="absolute inset-0 border-x-2 border-t-2 rounded-t-xl" style={{ borderColor: 'rgba(139, 92, 246, 0.3)' }} />
              </div>
            </div>
            {/* Comparison rows */}
            {COMPARISONS.map(({ feature, others, mf }, i) => (
              <div
                key={feature}
                className={`grid grid-cols-3 text-center ${i < COMPARISONS.length - 1 ? 'border-b border-[#2A2A2E]' : ''}`}
              >
                <div className="p-4 sm:p-5 text-text-primary text-sm font-medium text-left pl-6">{feature}</div>
                <div className="p-4 sm:p-5 flex items-center justify-center">
                  {others === false ? (
                    <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <span className="text-yellow-400 text-sm font-medium">{others}</span>
                  )}
                </div>
                <div className="p-4 sm:p-5 flex items-center justify-center relative">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {i < COMPARISONS.length - 1 && (
                    <div className="absolute inset-0 border-x-2" style={{ borderColor: 'rgba(139, 92, 246, 0.3)' }} />
                  )}
                  {i === COMPARISONS.length - 1 && (
                    <div className="absolute inset-0 border-x-2 border-b-2 rounded-b-xl" style={{ borderColor: 'rgba(139, 92, 246, 0.3)' }} />
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 hero-bg">
        <div className="max-w-5xl mx-auto">
          <motion.div className="text-center mb-14" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-display font-bold text-3xl sm:text-4xl mb-3 text-text-primary">
              Loved by builders
            </h2>
            <p className="text-text-secondary">What our users are saying</p>
          </motion.div>

          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6" initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            {TESTIMONIALS.map(({ quote, name, role, initials, color }) => (
              <motion.div
                key={name}
                variants={fadeUp}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="p-6 rounded-2xl bg-[#111113]/80 backdrop-blur-md border border-[#2A2A2E] hover:border-[rgba(139,92,246,0.3)] transition-colors"
              >
                {/* Quote icon */}
                <svg className="w-8 h-8 text-[#8B5CF6] opacity-40 mb-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391C0 7.905 3.748 4.039 9 3l.996 2.151C7.563 6.068 5.996 8.789 5.996 11h4.021v10H0z" />
                </svg>
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-text-primary text-sm leading-relaxed mb-6">&ldquo;{quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white text-xs font-bold`}>
                    {initials}
                  </div>
                  <div>
                    <p className="text-text-primary text-sm font-semibold">{name}</p>
                    <p className="text-text-secondary text-xs">{role}</p>
                  </div>
                </div>
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
              { value: '10+', label: 'seconds to an app' },
              { value: '100%', label: 'free — no limits' },
              { value: '0', label: 'lines of code required' },
            ].map(({ value, label }) => (
              <motion.div key={label} variants={fadeUp}>
                <div className="font-display font-extrabold text-display-sm sm:text-display gradient-text mb-1">{value}</div>
                <div className="text-text-secondary text-sm">{label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 hero-bg">
        <div className="max-w-3xl mx-auto">
          <motion.div className="text-center mb-14" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-display font-bold text-3xl sm:text-4xl mb-3 text-text-primary">
              Frequently asked questions
            </h2>
            <p className="text-text-secondary">Everything you need to know about MobileForge</p>
          </motion.div>

          <motion.div className="space-y-3" initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            {FAQS.map(({ q, a }, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="rounded-2xl bg-[#111113] border border-[#2A2A2E] overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left"
                >
                  <span className="text-text-primary font-display font-semibold text-sm sm:text-base">{q}</span>
                  <motion.svg
                    animate={{ rotate: openFaq === i ? 180 : 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="w-5 h-5 text-text-secondary flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </motion.svg>
                </button>
                <motion.div
                  initial={false}
                  animate={{
                    height: openFaq === i ? 'auto' : 0,
                    opacity: openFaq === i ? 1 : 0,
                  }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-5 text-text-secondary text-sm leading-relaxed">{a}</p>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 text-center hero-bg">
        <motion.div className="max-w-2xl mx-auto" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="font-display font-extrabold text-4xl sm:text-5xl mb-5 text-text-primary">
            Ready to build{' '}
            <span className="gradient-text">your app</span>?
          </h2>
          <p className="text-text-secondary text-lg mb-8">
            Describe what you want. AI does the rest.
          </p>
          <Link
            href="/builder/demo"
            className="inline-block px-10 py-4 min-h-[48px] rounded-2xl bg-gradient-primary text-white font-display font-bold text-xl hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-glow press-effect"
          >
            Get started now — free
          </Link>
        </motion.div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="pt-16 pb-8 px-4 border-t border-[#2A2A2E]" style={{ backgroundColor: '#0a0a0b' }}>
        <div className="max-w-6xl mx-auto">
          {/* Footer columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            {/* Column 1: Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="inline-flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="font-display font-bold text-lg text-text-primary">MobileForge</span>
              </Link>
              <p className="text-text-secondary text-sm mb-4 leading-relaxed">AI-powered mobile app builder</p>
              <p className="text-text-soft text-xs">&copy; {new Date().getFullYear()} MobileForge. All rights reserved.</p>
            </div>

            {/* Column 2: Product */}
            <div>
              <h4 className="font-display font-semibold text-sm text-text-primary mb-4">Product</h4>
              <ul className="space-y-3">
                {FOOTER_PRODUCT.map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-text-secondary text-sm hover:text-text-primary transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Company */}
            <div>
              <h4 className="font-display font-semibold text-sm text-text-primary mb-4">Company</h4>
              <ul className="space-y-3">
                {FOOTER_COMPANY.map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-text-secondary text-sm hover:text-text-primary transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Legal */}
            <div>
              <h4 className="font-display font-semibold text-sm text-text-primary mb-4">Legal</h4>
              <ul className="space-y-3">
                {FOOTER_LEGAL.map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-text-secondary text-sm hover:text-text-primary transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Social links row */}
          <div className="border-t border-[#2A2A2E] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-text-soft text-xs">Built with AI for builders everywhere</p>
            <div className="flex items-center gap-4">
              {/* Twitter/X */}
              <a href="#" aria-label="Twitter" className="text-text-soft hover:text-text-primary transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              {/* LinkedIn */}
              <a href="#" aria-label="LinkedIn" className="text-text-soft hover:text-text-primary transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              {/* GitHub */}
              <a href="#" aria-label="GitHub" className="text-text-soft hover:text-text-primary transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
