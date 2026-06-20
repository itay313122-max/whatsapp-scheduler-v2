'use client';

interface DesignPreset {
  id: string;
  name: string;
  tag: string;
  prompt: string;
  preview: React.ReactNode;
}

interface DesignGalleryProps {
  onApply: (prompt: string) => void;
  isGenerating: boolean;
}

// Shared instruction — apply STYLE ONLY, keep all content/logic intact
const STYLE_ONLY = 'חשוב מאוד: שמור על כל התוכן, הטקסטים, הנתונים, המבנה והלוגיקה הקיימים בדיוק כפי שהם. שנה אך ורק את העיצוב הויזואלי — צבעים, פונטים, מרווחים, צללים, עיגול פינות, וסגנון הרכיבים. אל תשנה מילה אחת של תוכן.';

// ── Mini visual previews ─────────────────────────────────────────────────────

function GlassPreview() {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative" style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}>
      <div className="absolute inset-2 rounded-md" style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.4)' }} />
      <div className="absolute bottom-2 right-2 w-6 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.6)' }} />
    </div>
  );
}

function BrutalPreview() {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative" style={{ background: '#FFE600' }}>
      <div className="absolute inset-x-2 top-2 h-3 rounded-sm" style={{ background: '#FF5C00', border: '2px solid #000', boxShadow: '2px 2px 0 #000' }} />
      <div className="absolute bottom-2 right-2 w-7 h-3 rounded-sm" style={{ background: '#00E0FF', border: '2px solid #000', boxShadow: '2px 2px 0 #000' }} />
    </div>
  );
}

function MinimalPreview() {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative bg-white border border-gray-100">
      <div className="absolute inset-x-3 top-3 h-1 rounded-full bg-gray-900" />
      <div className="absolute inset-x-3 top-5 h-0.5 rounded-full bg-gray-200" />
      <div className="absolute bottom-2.5 right-3 w-6 h-2 rounded-md bg-gray-900" />
    </div>
  );
}

function DarkProPreview() {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative" style={{ background: '#0a0a14' }}>
      <div className="absolute inset-x-2 top-2 h-2.5 rounded-md" style={{ background: '#1a1a2e', border: '1px solid #2dd4bf' }} />
      <div className="absolute bottom-2 right-2 w-7 h-2.5 rounded-md" style={{ background: 'linear-gradient(90deg,#2dd4bf,#06b6d4)', boxShadow: '0 0 8px #2dd4bf' }} />
    </div>
  );
}

function GradientPreview() {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative" style={{ background: 'linear-gradient(135deg,#f093fb,#f5576c,#4facfe)' }}>
      <div className="absolute inset-2 rounded-md" style={{ background: 'rgba(255,255,255,0.18)' }} />
      <div className="absolute bottom-2 right-2 w-6 h-2 rounded-full bg-white/80" />
    </div>
  );
}

function NeuPreview() {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative" style={{ background: '#e0e5ec' }}>
      <div className="absolute inset-x-2 top-2.5 h-2.5 rounded-full" style={{ background: '#e0e5ec', boxShadow: 'inset 2px 2px 4px #b8bcc4, inset -2px -2px 4px #fff' }} />
      <div className="absolute bottom-2.5 right-2 w-6 h-2.5 rounded-full" style={{ background: '#e0e5ec', boxShadow: '2px 2px 4px #b8bcc4, -2px -2px 4px #fff' }} />
    </div>
  );
}

function FoodPreview() {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative bg-white">
      <div className="absolute inset-x-2 top-2 h-3.5 rounded-lg" style={{ background: 'linear-gradient(135deg,#ff8008,#ffc837)' }} />
      <div className="absolute bottom-2 right-2 w-8 h-2.5 rounded-full" style={{ background: '#ff5722' }} />
      <div className="absolute bottom-2 left-2 w-3 h-2.5 rounded-md bg-gray-100" />
    </div>
  );
}

function FintechPreview() {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative" style={{ background: '#0f172a' }}>
      <div className="absolute inset-x-2 top-2 h-3 rounded-lg" style={{ background: 'linear-gradient(135deg,#1e3a8a,#3b82f6)' }} />
      <div className="absolute bottom-2 right-2 flex gap-0.5 items-end">
        {[3, 5, 4, 7, 6].map((h, i) => <div key={i} className="w-1 rounded-sm" style={{ height: h, background: '#22c55e' }} />)}
      </div>
    </div>
  );
}

function FitnessPreview() {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative" style={{ background: '#18181b' }}>
      <div className="absolute inset-x-2 top-2 h-3 rounded-lg" style={{ background: 'linear-gradient(135deg,#a3e635,#22d3ee)' }} />
      <div className="absolute bottom-2 right-2 w-7 h-2.5 rounded-full" style={{ background: '#a3e635', boxShadow: '0 0 6px #a3e635' }} />
    </div>
  );
}

function EcomPreview() {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative bg-white">
      <div className="absolute inset-x-2 top-2 grid grid-cols-2 gap-1">
        <div className="h-3 rounded bg-gradient-to-br from-purple-400 to-pink-400" />
        <div className="h-3 rounded bg-gradient-to-br from-blue-400 to-cyan-400" />
      </div>
      <div className="absolute bottom-2 right-2 w-7 h-2 rounded-full bg-gray-900" />
    </div>
  );
}

function SocialPreview() {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative bg-white">
      <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-gradient-to-br from-pink-500 to-violet-500" />
      <div className="absolute top-2.5 right-6 left-2 h-1 rounded-full bg-gray-200" />
      <div className="absolute inset-x-2 bottom-2 h-3 rounded-lg bg-gray-100" />
    </div>
  );
}

const DESIGN_LANGUAGES: DesignPreset[] = [
  {
    id: 'glass', name: 'זכוכית', tag: 'Glassmorphism', preview: <GlassPreview />,
    prompt: `החל סגנון Glassmorphism על האפליקציה: רקעים שקופים-למחצה עם backdrop-filter blur, מסגרות לבנות עדינות (rgba(255,255,255,0.3)), צללים רכים, gradient רקע צבעוני מאחורי הכל, ועיגול פינות גדול. ${STYLE_ONLY}`,
  },
  {
    id: 'brutal', name: 'ברוטליזם', tag: 'Neo-Brutalism', preview: <BrutalPreview />,
    prompt: `החל סגנון Neo-Brutalism: צבעים חזקים ורוויים, מסגרות שחורות עבות (3-4px solid #000), צללים קשיחים לא מטושטשים (box-shadow: 4px 4px 0 #000), פונטים מודגשים גדולים, ללא gradient, פינות מעט מעוגלות. ${STYLE_ONLY}`,
  },
  {
    id: 'minimal', name: 'מינימלי', tag: 'Minimal', preview: <MinimalPreview />,
    prompt: `החל סגנון מינימליסטי נקי: הרבה white space, פלטה מונוכרומטית (שחור/לבן/אפור) עם צבע אקסנט אחד, פונט נקי, צללים עדינים מאוד או בכלל לא, קווים דקים, טיפוגרפיה היא הגיבור. ${STYLE_ONLY}`,
  },
  {
    id: 'darkpro', name: 'כהה מקצועי', tag: 'Dark Pro', preview: <DarkProPreview />,
    prompt: `החל סגנון Dark Mode מקצועי: רקע כהה עמוק (#0a0a14, #1a1a2e), אקסנטים בצבעי ניאון (teal/cyan), זוהר עדין סביב כפתורים (glow), כרטיסים כהים עם מסגרות דקות מאירות, ניגודיות גבוהה לטקסט. ${STYLE_ONLY}`,
  },
  {
    id: 'gradient', name: 'גרדיאנטים', tag: 'Gradient Rich', preview: <GradientPreview />,
    prompt: `החל סגנון עשיר בגרדיאנטים: gradient רקע צבעוני וחי, כפתורים עם gradient, כותרות עם gradient text, כרטיסים עם gradient עדין, צבעים תוססים ומודרניים (סגול/ורוד/כחול). ${STYLE_ONLY}`,
  },
  {
    id: 'neu', name: 'רך (Soft UI)', tag: 'Neumorphism', preview: <NeuPreview />,
    prompt: `החל סגנון Neumorphism / Soft UI: רקע אפור-בהיר אחיד (#e0e5ec), רכיבים עם צללים כפולים רכים (אור מלמעלה-שמאל, צל מלמטה-ימין) שיוצרים אפקט תלת-ממדי מובלט/שקוע, פינות מעוגלות מאוד, ניגודיות נמוכה. ${STYLE_ONLY}`,
  },
];

const APP_STYLES: DesignPreset[] = [
  {
    id: 'food', name: 'משלוחי אוכל', tag: 'Wolt / תן ביס', preview: <FoodPreview />,
    prompt: `החל עיצוב בסגנון אפליקציות משלוחי אוכל מובילות (כמו Wolt / תן ביס / Uber Eats): כרטיסים גדולים עם פינות מעוגלות, צבעי אקסנט חמים (כתום/אדום), הרבה מקום לתמונות, badges וצ'יפים מעוגלים, כפתורי הזמנה בולטים, טיפוגרפיה ידידותית, צללים רכים. ${STYLE_ONLY}`,
  },
  {
    id: 'fintech', name: 'פינטק', tag: 'Revolut / N26', preview: <FintechPreview />,
    prompt: `החל עיצוב בסגנון אפליקציות פינטק מובילות (כמו Revolut / N26): רקע כהה אלגנטי, כרטיסים עם gradient כחול, אקסנטים בירוק (חיובי) ואדום (שלילי), מספרים גדולים וברורים, גרפים מינימליסטיים, תחושת אמון ויוקרה, פינות מעוגלות. ${STYLE_ONLY}`,
  },
  {
    id: 'fitness', name: 'כושר', tag: 'Nike / Strava', preview: <FitnessPreview />,
    prompt: `החל עיצוב בסגנון אפליקציות כושר מובילות (כמו Nike Training / Strava): רקע כהה אנרגטי, אקסנטים בצבעי ניאון (ירוק-ליים/ציאן), טיפוגרפיה מודגשת וספורטיבית, מדדים גדולים בולטים, כפתורים עם זוהר, תחושת מוטיבציה ואנרגיה. ${STYLE_ONLY}`,
  },
  {
    id: 'ecom', name: 'חנות', tag: 'Shopify / ASOS', preview: <EcomPreview />,
    prompt: `החל עיצוב בסגנון חנויות אונליין מובילות (כמו ASOS / Shopify): גריד מוצרים נקי, הרבה לבן, תמונות מוצר גדולות, מחירים ברורים, כפתורי "הוסף לסל" בולטים, תגיות מבצע, טיפוגרפיה אלגנטית, מיקוד בהמרה. ${STYLE_ONLY}`,
  },
  {
    id: 'social', name: 'רשת חברתית', tag: 'Instagram / X', preview: <SocialPreview />,
    prompt: `החל עיצוב בסגנון רשתות חברתיות מובילות (כמו Instagram / X): כרטיסי feed נקיים, אווטארים עגולים עם טבעת gradient, אייקוני אינטראקציה (לייק/תגובה/שיתוף), הרבה לבן, מרווחים נדיבים, טיפוגרפיה קריאה, אקסנטים צבעוניים. ${STYLE_ONLY}`,
  },
  {
    id: 'social2', name: 'הזמנות', tag: 'Airbnb / Booking', preview: <SocialPreview />,
    prompt: `החל עיצוב בסגנון אפליקציות הזמנות מובילות (כמו Airbnb / Booking): כרטיסים נקיים עם תמונות גדולות מעוגלות, דירוגי כוכבים, אקסנט בצבע אחד חם (ורוד-אדום), הרבה white space, טיפוגרפיה ידידותית ואמינה, כפתורי הזמנה ברורים. ${STYLE_ONLY}`,
  },
];

function PresetCard({ preset, onApply, disabled }: { preset: DesignPreset; onApply: (prompt: string) => void; disabled: boolean }) {
  return (
    <button
      onClick={() => onApply(preset.prompt)}
      disabled={disabled}
      title={preset.tag}
      className="group flex flex-col gap-1.5 p-2 rounded-xl border border-border bg-surface
        hover:border-primary/40 hover:shadow-card active:scale-[0.97] transition-all duration-200
        disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <div className="w-full aspect-[4/3] relative">
        {preset.preview}
        <div className="absolute inset-0 rounded-lg bg-primary/0 group-hover:bg-primary/5 transition-colors flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-white bg-primary/90 px-2 py-1 rounded-md shadow-lg">
            החל
          </span>
        </div>
      </div>
      <div className="text-right">
        <div className="text-[11px] font-semibold text-text-primary leading-tight">{preset.name}</div>
        <div className="text-[9px] text-text-soft leading-tight">{preset.tag}</div>
      </div>
    </button>
  );
}

export default function DesignGallery({ onApply, isGenerating }: DesignGalleryProps) {
  return (
    <div className="flex flex-col gap-4 p-4" dir="rtl">
      <div>
        <p className="text-xs text-text-secondary leading-relaxed">
          בחר סגנון עיצוב — יוחל אוטומטית על האפליקציה שלך, <span className="font-semibold text-text-primary">בלי לשנות את התוכן</span>.
        </p>
      </div>

      {/* Design languages */}
      <div>
        <label className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold mb-2 block">
          שפות עיצוב
        </label>
        <div className="grid grid-cols-2 gap-2">
          {DESIGN_LANGUAGES.map((p) => (
            <PresetCard key={p.id} preset={p} onApply={onApply} disabled={isGenerating} />
          ))}
        </div>
      </div>

      <div className="h-px bg-border/60" />

      {/* App-inspired styles */}
      <div>
        <label className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold mb-1 block">
          עיצובים מאפליקציות מובילות
        </label>
        <p className="text-[10px] text-text-soft mb-2 leading-relaxed">
          רק העיצוב — לא התוכן
        </p>
        <div className="grid grid-cols-2 gap-2">
          {APP_STYLES.map((p) => (
            <PresetCard key={p.id} preset={p} onApply={onApply} disabled={isGenerating} />
          ))}
        </div>
      </div>

      {isGenerating && (
        <div className="flex items-center justify-center gap-2 py-3 text-xs text-primary">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          מחיל עיצוב...
        </div>
      )}
    </div>
  );
}
