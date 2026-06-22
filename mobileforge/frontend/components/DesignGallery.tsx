'use client';

import { useState } from 'react';

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

type GallerySection = 'shapes' | 'templates' | 'apps' | 'styles';

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

function LiquidGlassPreview() {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #e0f2fe, #fce7f3, #f3e8ff)' }}>
      <div className="absolute inset-2 rounded-md" style={{ background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.4)', boxShadow: 'inset 0 0 12px -4px rgba(255,255,255,0.5)' }} />
      <div className="absolute bottom-2 right-2 w-6 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.7)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} />
    </div>
  );
}

function M3ExpressivePreview() {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative bg-white">
      <div className="absolute top-2 right-2 w-8 h-3.5" style={{ borderRadius: '12px', background: '#e8def8' }} />
      <div className="absolute inset-x-2 top-7 h-2 rounded-lg" style={{ background: '#f3edf7' }} />
      <div className="absolute bottom-2 right-2 w-7 h-7 rounded-2xl flex items-center justify-center" style={{ background: '#6750a4', boxShadow: '0 2px 6px rgba(103,80,164,0.3)' }}>
        <div className="w-2 h-0.5 bg-white rounded-full" />
      </div>
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

// ── New famous app previews ──────────────────────────────────────────────────

function WhatsAppPreview() {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative" style={{ background: '#111b21' }}>
      <div className="absolute inset-x-0 top-0 h-3" style={{ background: '#1f2c34' }} />
      <div className="absolute top-4 right-2 left-4 h-2 rounded-lg" style={{ background: '#005c4b' }} />
      <div className="absolute top-7.5 right-4 left-2 h-2 rounded-lg" style={{ background: '#1f2c34' }} />
      <div className="absolute bottom-2 right-2 w-5 h-5 rounded-full" style={{ background: '#00a884' }} />
    </div>
  );
}

function SpotifyPreview() {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative" style={{ background: '#121212' }}>
      <div className="absolute inset-x-2 top-2 h-4 rounded-md" style={{ background: 'linear-gradient(180deg,#3d2878,#121212)' }} />
      <div className="absolute bottom-2 right-2 left-2 h-2.5 rounded-full" style={{ background: '#282828' }}>
        <div className="absolute inset-y-0 right-0 w-3/5 rounded-full" style={{ background: '#1db954' }} />
      </div>
    </div>
  );
}

function TikTokPreview() {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative" style={{ background: '#000' }}>
      <div className="absolute inset-2 rounded-md bg-gradient-to-b from-transparent to-black/60" />
      <div className="absolute bottom-2 right-2 flex flex-col gap-1 items-center">
        <div className="w-3 h-3 rounded-full border border-white/60" />
        <div className="w-2 h-2 rounded-sm" style={{ background: '#fe2c55' }} />
      </div>
      <div className="absolute bottom-2 left-2 right-6 h-1 rounded-full bg-white/30" />
    </div>
  );
}

function ApplePreview() {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative" style={{ background: '#f5f5f7' }}>
      <div className="absolute inset-x-2 top-2 h-2 rounded-md bg-white" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }} />
      <div className="absolute inset-x-2 top-5.5 h-3.5 rounded-xl bg-white" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }} />
      <div className="absolute bottom-2 right-2 w-7 h-2.5 rounded-full" style={{ background: '#007aff' }} />
    </div>
  );
}

function UberPreview() {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative bg-white">
      <div className="absolute inset-x-2 top-2 h-4 rounded-md" style={{ background: '#f6f6f6' }}>
        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-black" />
      </div>
      <div className="absolute bottom-2 right-2 w-8 h-3 rounded-lg bg-black" />
    </div>
  );
}

function GooglePreview() {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative bg-white">
      <div className="absolute top-2 right-2 flex gap-0.5">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#4285f4' }} />
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#ea4335' }} />
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#fbbc04' }} />
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#34a853' }} />
      </div>
      <div className="absolute inset-x-2 bottom-2 h-3 rounded-full border border-gray-200" />
    </div>
  );
}

// ── Button shape visual previews ─────────────────────────────────────────────

function ButtonShapePreview({ radius, shadow, border }: { radius: string; shadow?: string; border?: string }) {
  return (
    <div className="w-full h-7 flex items-center justify-center">
      <div
        className="w-14 h-5 flex items-center justify-center text-[8px] text-white font-bold"
        style={{
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          borderRadius: radius,
          boxShadow: shadow || '0 2px 6px rgba(0,0,0,0.15)',
          border: border || 'none',
        }}
      >
        כפתור
      </div>
    </div>
  );
}

function CardShapePreview({ radius, shadow, border }: { radius: string; shadow?: string; border?: string }) {
  return (
    <div className="w-full h-7 flex items-center justify-center">
      <div
        className="w-14 h-5 bg-white flex items-start p-1 gap-1"
        style={{
          borderRadius: radius,
          boxShadow: shadow || '0 2px 8px rgba(0,0,0,0.08)',
          border: border || '1px solid #e5e7eb',
        }}
      >
        <div className="w-2 h-2 rounded-sm bg-gray-200 flex-shrink-0" />
        <div className="flex-1">
          <div className="h-0.5 bg-gray-300 rounded-full mb-0.5 w-full" />
          <div className="h-0.5 bg-gray-200 rounded-full w-3/4" />
        </div>
      </div>
    </div>
  );
}

function InputShapePreview({ radius, style: inputStyle }: { radius: string; style: string }) {
  return (
    <div className="w-full h-7 flex items-center justify-center">
      <div
        className="w-14 h-4 flex items-center px-1.5"
        style={{
          borderRadius: radius,
          background: inputStyle === 'filled' ? '#f1f5f9' : 'white',
          border: inputStyle === 'underline' ? 'none' : `1px solid ${inputStyle === 'filled' ? 'transparent' : '#d1d5db'}`,
          borderBottom: inputStyle === 'underline' ? '2px solid #6366f1' : undefined,
        }}
      >
        <div className="h-0.5 bg-gray-300 rounded-full w-3/5" />
      </div>
    </div>
  );
}

// ── Data ─────────────────────────────────────────────────────────────────────

const BUTTON_SHAPES = [
  {
    id: 'square', name: 'חד', preview: <ButtonShapePreview radius="4px" />,
    prompt: `שנה את כל הכפתורים באפליקציה לעיצוב חד (מרובע): border-radius: 4px, גובה מינימלי 48dp, padding: 12px 24px, צללים עדינים. ${STYLE_ONLY}`,
  },
  {
    id: 'rounded', name: 'מעוגל', preview: <ButtonShapePreview radius="12px" />,
    prompt: `שנה את כל הכפתורים באפליקציה לעיצוב מעוגל: border-radius: 12px, גובה מינימלי 48dp, padding: 12px 24px, צללים רכים. ${STYLE_ONLY}`,
  },
  {
    id: 'pill', name: 'כדור', preview: <ButtonShapePreview radius="9999px" />,
    prompt: `שנה את כל הכפתורים באפליקציה לעיצוב כדורי (pill): border-radius: 9999px, גובה מינימלי 48dp, padding: 12px 32px, תחושת מודרנית. ${STYLE_ONLY}`,
  },
  {
    id: 'outline', name: 'מסגרת', preview: <ButtonShapePreview radius="10px" border="2px solid #6366f1" shadow="none" />,
    prompt: `שנה את כל הכפתורים באפליקציה לסגנון מסגרת (outline): רקע שקוף, border: 2px solid עם הצבע הראשי, border-radius: 10px, גובה מינימלי 48dp, padding: 12px 24px, טקסט בצבע הראשי. ${STYLE_ONLY}`,
  },
  {
    id: 'soft', name: 'רך', preview: <ButtonShapePreview radius="14px" shadow="0 4px 14px rgba(99,102,241,0.25)" />,
    prompt: `שנה את כל הכפתורים לסגנון רך: border-radius: 14px, גובה מינימלי 48dp, padding: 12px 24px, רקע gradient עדין, צל צבעוני רך (box-shadow עם צבע הכפתור), אפקט hover שמעלה את הכפתור למעלה. ${STYLE_ONLY}`,
  },
  {
    id: 'brutal-btn', name: 'ברוטלי', preview: <ButtonShapePreview radius="4px" shadow="3px 3px 0 #000" border="2px solid #000" />,
    prompt: `שנה את כל הכפתורים לסגנון neo-brutalism: border: 2px solid #000, box-shadow: 3px 3px 0 #000, border-radius: 4px, גובה מינימלי 48dp, padding: 12px 24px, רקע צבעוני חזק, טקסט מודגש. ${STYLE_ONLY}`,
  },
];

const CARD_SHAPES = [
  {
    id: 'flat', name: 'שטוח', preview: <CardShapePreview radius="4px" shadow="none" border="1px solid #e5e7eb" />,
    prompt: `שנה את כל הכרטיסים לעיצוב שטוח: ללא צללים, border דק (#e5e7eb), border-radius: 4px, רקע לבן, padding: 16px, מרווח פנימי על בסיס רשת 8px. ${STYLE_ONLY}`,
  },
  {
    id: 'elevated', name: 'צל', preview: <CardShapePreview radius="12px" shadow="0 4px 16px rgba(0,0,0,0.08)" border="none" />,
    prompt: `שנה את כל הכרטיסים לעיצוב מורם: box-shadow: 0 4px 16px rgba(0,0,0,0.08), ללא border, border-radius: 12px, רקע לבן, padding: 16px, מרווח פנימי על בסיס רשת 8px. ${STYLE_ONLY}`,
  },
  {
    id: 'glass-card', name: 'זכוכית', preview: <CardShapePreview radius="16px" shadow="0 8px 32px rgba(0,0,0,0.06)" border="1px solid rgba(255,255,255,0.5)" />,
    prompt: `שנה את כל הכרטיסים לסגנון זכוכית (glass): background: rgba(255,255,255,0.7), backdrop-filter: blur(12px), border: 1px solid rgba(255,255,255,0.5), border-radius: 16px, צל רך, padding: 16px, מרווח פנימי על בסיס רשת 8px. ${STYLE_ONLY}`,
  },
  {
    id: 'bordered', name: 'מסגרת', preview: <CardShapePreview radius="8px" shadow="none" border="2px solid #e0e7ff" />,
    prompt: `שנה את כל הכרטיסים לעיצוב מסגרת: border: 2px solid (צבע גבול עדין), ללא צל, border-radius: 8px, רקע לבן, padding: 16px, מרווח פנימי על בסיס רשת 8px. ${STYLE_ONLY}`,
  },
];

const INPUT_SHAPES = [
  {
    id: 'outlined', name: 'קווי', preview: <InputShapePreview radius="8px" style="outlined" />,
    prompt: `שנה את כל שדות הקלט באפליקציה לסגנון קווי (outlined): border: 1px solid #d1d5db, border-radius: 8px, רקע לבן, focus עם border צבעוני. ${STYLE_ONLY}`,
  },
  {
    id: 'filled', name: 'מלא', preview: <InputShapePreview radius="8px" style="filled" />,
    prompt: `שנה את כל שדות הקלט לסגנון מלא (filled): רקע אפור בהיר (#f1f5f9), ללא border, border-radius: 8px, focus עם רקע בהיר יותר. ${STYLE_ONLY}`,
  },
  {
    id: 'underline', name: 'קו תחתון', preview: <InputShapePreview radius="0px" style="underline" />,
    prompt: `שנה את כל שדות הקלט לסגנון קו תחתון (underline): ללא border רגיל, רק border-bottom עם הצבע הראשי, רקע שקוף, מראה מינימלי. ${STYLE_ONLY}`,
  },
  {
    id: 'rounded-input', name: 'עגול', preview: <InputShapePreview radius="9999px" style="outlined" />,
    prompt: `שנה את כל שדות הקלט לסגנון עגול: border-radius: 9999px, border דק, padding אופקי רחב, מראה מודרני. ${STYLE_ONLY}`,
  },
];

const SCREEN_TEMPLATES = [
  {
    id: 'login-modern', name: 'התחברות מודרנית', icon: '🔐', tag: 'Auth',
    prompt: 'הוסף מסך התחברות נקי: לוגו טקסט למעלה, שדות email וסיסמה (48px height) עם placeholder, כפתור "התחבר" solid color מלא, separator "או" עם כפתורי Google/Apple, לינקים "שכחתי סיסמה" ו"הרשמה". עיצוב מינימלי ללא gradient.',
  },
  {
    id: 'signup-flow', name: 'הרשמה רב-שלבית', icon: '📝', tag: 'Auth',
    prompt: 'הוסף מסך הרשמה רב-שלבי (multi-step): שלב 1 - שם ואימייל, שלב 2 - סיסמה, שלב 3 - בחירת העדפות (chips בחירה). progress bar מונפש למעלה, כפתורי הבא/חזור, validation בזמן אמת, אנימציית מעבר בין שלבים. עיצוב מודרני עם Liquid Glass.',
  },
  {
    id: 'profile-premium', name: 'פרופיל פרימיום', icon: '👤', tag: 'Profile',
    prompt: 'הוסף מסך פרופיל מקצועי: אווטאר עגול (80px), שם ותיאור, 3 סטטיסטיקות בשורה (מספרים גדולים + תוויות קטנות), כפתור "ערוך פרופיל" outline, tabs לתוכן. עיצוב נקי ללא gradient.',
  },
  {
    id: 'dashboard-analytics', name: 'דשבורד אנליטיקס', icon: '📊', tag: 'Dashboard',
    prompt: 'הוסף דשבורד אנליטיקס נקי: greeting header עם שם ותאריך, 4 כרטיסי KPI (מספר גדול bold + שינוי באחוזים ירוק/אדום + תווית קטנה), גרף SVG עם נקודות נתונים, רשימת "פעולות אחרונות". עיצוב מינימלי, ללא glass, ללא gradient.',
  },
  {
    id: 'settings-ios', name: 'הגדרות iOS', icon: '⚙️', tag: 'Settings',
    prompt: 'הוסף מסך הגדרות בסגנון iOS: grouped list עם כותרות קטנות, כל פריט עם אייקון עגול צבעוני, label, וחץ ימני. toggles (switches) אמיתיים ל-3 הגדרות, section "חשבון" עם אווטאר, section "כללי", section "התראות", כפתור "התנתק" אדום למטה. רקע אפור בהיר, כרטיסים לבנים.',
  },
  {
    id: 'product-detail', name: 'דף מוצר', icon: '🛍️', tag: 'E-Commerce',
    prompt: 'הוסף דף מוצר מקצועי: תמונה גדולה עם dots, שם מוצר ומחיר bold, בוחר צבע (עיגולים), בוחר מידה (chips), כפתור "הוסף לסל" solid sticky למטה, דירוג כוכבים, תיאור. עיצוב נקי כמו ZARA, ללא gradient.',
  },
  {
    id: 'chat-ui', name: 'צ\'אט', icon: '💬', tag: 'Messaging',
    prompt: 'הוסף מסך צ\'אט: header עם אווטאר עגול + שם + online indicator ירוק, רשימת הודעות (בועות כחולות ימין למשתמש, אפורות שמאל), timestamps, read indicators (✓✓), שדה הקלדה sticky למטה עם כפתור שלח מונפש ואייקון attach. רקע pattern עדין.',
  },
  {
    id: 'onboarding', name: 'Onboarding', icon: '🚀', tag: 'Flow',
    prompt: 'הוסף מסך onboarding עם 3 שלבים: כל שלב עם איור CSS גדול, כותרת bold, תיאור קצר. dots indicator, כפתור "הבא"/"התחל". עיצוב מינימלי נקי.',
  },
  {
    id: 'checkout', name: 'תשלום', icon: '💳', tag: 'E-Commerce',
    prompt: 'הוסף מסך תשלום: סיכום הזמנה (פריטים + מחירים), שדות כרטיס אשראי מעוצבים (מספר/תוקף/CVV) עם אייקוני כרטיס, כפתורי Apple Pay ו-Google Pay, כפתור "שלם" gradient גדול עם סכום, הנפשת loading בלחיצה. כל שדה 48dp מינימום.',
  },
  {
    id: 'search-explore', name: 'חיפוש וגילוי', icon: '🔍', tag: 'Discovery',
    prompt: 'הוסף מסך חיפוש וגילוי: שדה חיפוש sticky עגול עם אייקון, chips קטגוריות scrollable, "חיפושים פופולריים" כרשימה, "מומלצים" בגריד 2 עמודות עם כרטיסי תמונה מ-picsum.photos. אנימציית תוצאות חיפוש מיידיות, empty state מעוצב.',
  },
  {
    id: 'notifications', name: 'התראות', icon: '🔔', tag: 'Social',
    prompt: 'הוסף מסך התראות: tabs (הכל/לא נקראו), כל התראה עם אווטאר, טקסט, זמן יחסי (לפני 5 דק), ונקודה כחולה ל-unread. סוגי התראות: לייק, תגובה, עוקב חדש, מערכת. swipe to dismiss. empty state עם אייקון פעמון.',
  },
  {
    id: 'map-view', name: 'מפה ומיקום', icon: '📍', tag: 'Location',
    prompt: 'הוסף מסך מפה: מפה CSS (גריד רחובות) עם סמני מיקום מונפשים (pulse), כרטיס bottom sheet שעולה עם פרטי מיקום, שדה חיפוש כתובת למעלה, כפתור "מיקום נוכחי" צף. אנימציית pin drop.',
  },
];

const DESIGN_LANGUAGES: DesignPreset[] = [
  {
    id: 'glass', name: 'זכוכית', tag: 'Glassmorphism', preview: <GlassPreview />,
    prompt: `החל סגנון Glassmorphism על האפליקציה: רקעים שקופים-למחצה עם backdrop-filter blur, מסגרות לבנות עדינות (rgba(255,255,255,0.3)), צללים רכים, gradient רקע צבעוני מאחורי הכל, ועיגול פינות גדול. השתמש ברשת מרווחים 8px, touch targets מינימלי 44px, line-height כפולת 8. ללא אימוג'ים. ${STYLE_ONLY}`,
  },
  {
    id: 'liquid-glass', name: 'זכוכית נוזלית', tag: 'Liquid Glass', preview: <LiquidGlassPreview />,
    prompt: `החל סגנון Apple Liquid Glass (2025): רקע gradient בהיר (#e0f2fe → #fce7f3 → #f3e8ff), כרטיסים עם background: rgba(255,255,255,0.45), backdrop-filter: blur(12px) saturate(1.8), border: 1px solid rgba(255,255,255,0.35), box-shadow: 0 8px 32px rgba(31,38,135,0.12) ו-inset shadow עדין. פינות מעוגלות גדולות (16-20px), שקיפות וזרימה. השתמש ברשת מרווחים 8px, touch targets מינימלי 44px, line-height כפולת 8. ${STYLE_ONLY}`,
  },
  {
    id: 'brutal', name: 'ברוטליזם', tag: 'Neo-Brutalism', preview: <BrutalPreview />,
    prompt: `החל סגנון Neo-Brutalism: צבעים חזקים ורוויים, מסגרות שחורות עבות (3-4px solid #000), צללים קשיחים לא מטושטשים (box-shadow: 4px 4px 0 #000), פונטים מודגשים גדולים, ללא gradient, פינות מעט מעוגלות. השתמש ברשת מרווחים 8px, touch targets מינימלי 44px, line-height כפולת 8. ${STYLE_ONLY}`,
  },
  {
    id: 'minimal', name: 'מינימלי', tag: 'Minimal', preview: <MinimalPreview />,
    prompt: `החל סגנון מינימליסטי נקי: הרבה white space, פלטה מונוכרומטית (שחור/לבן/אפור) עם צבע אקסנט אחד, פונט נקי, צללים עדינים מאוד או בכלל לא, קווים דקים, טיפוגרפיה היא הגיבור. השתמש ברשת מרווחים 8px, touch targets מינימלי 44px, line-height כפולת 8. ${STYLE_ONLY}`,
  },
  {
    id: 'darkpro', name: 'כהה מקצועי', tag: 'Dark Pro', preview: <DarkProPreview />,
    prompt: `החל סגנון Dark Mode מקצועי: רקע שחור אמיתי (#000), surface (#1c1c1e), אקסנט כחול (#0A84FF), כרטיסים כהים עם border: 1px solid #38383a, ניגודיות גבוהה, ללא glow, ללא ניאון. ${STYLE_ONLY}`,
  },
  {
    id: 'gradient', name: 'גרדיאנטים', tag: 'Gradient Rich', preview: <GradientPreview />,
    prompt: `החל סגנון גרדיאנט עדין: gradient רקע בהיר מושתק (#f8f9ff → #fff5f5), כפתורים עם gradient עדין, כרטיסים לבנים, צללים רכים. לא צבעים רועשים. ${STYLE_ONLY}`,
  },
  {
    id: 'neu', name: 'רך (Soft UI)', tag: 'Neumorphism', preview: <NeuPreview />,
    prompt: `החל סגנון Neumorphism / Soft UI: רקע אפור-בהיר אחיד (#e0e5ec), רכיבים עם צללים כפולים רכים (אור מלמעלה-שמאל, צל מלמטה-ימין) שיוצרים אפקט תלת-ממדי מובלט/שקוע, פינות מעוגלות מאוד, ניגודיות נמוכה. השתמש ברשת מרווחים 8px, touch targets מינימלי 44px, line-height כפולת 8. ${STYLE_ONLY}`,
  },
  {
    id: 'm3-expressive', name: 'M3 אקספרסיבי', tag: 'Material 3', preview: <M3ExpressivePreview />,
    prompt: `החל סגנון Material Design 3 Expressive: פלטת צבעים מרחבית עם primary (#6750a4), secondary (#625b71), tertiary (#7d5260), surface tones (#f3edf7, #e8def8), כפתורי FAB מעוגלים גדולים (28px radius), כרטיסים עם surface containers, 35 צורות חדשות — squircle shapes ו-wavy edges, מרווחים 8px grid, touch targets 48dp, טיפוגרפיה עשירה עם emphasized styles. השתמש ברשת מרווחים 8px, touch targets מינימלי 44px, line-height כפולת 8. ${STYLE_ONLY}`,
  },
];

const APP_STYLES: DesignPreset[] = [
  {
    id: 'whatsapp', name: 'WhatsApp', tag: 'מסרים', preview: <WhatsAppPreview />,
    prompt: `החל עיצוב בסגנון WhatsApp: רקע כהה (#111b21), header ב-#1f2c34, בועות צ'אט ירוקות (#005c4b) למשתמש ואפורות כהות לצד שני, כפתור FAB עגול בירוק (#00a884), טיפוגרפיה נקייה, אייקונים דקים. ללא gradient, ללא אימוג'ים כאייקונים. ${STYLE_ONLY}`,
  },
  {
    id: 'spotify', name: 'Spotify', tag: 'מוזיקה', preview: <SpotifyPreview />,
    prompt: `החל עיצוב בסגנון Spotify: רקע שחור (#121212), כרטיסים ב-#282828, אקסנט ירוק (#1DB954) לכפתורים ו-controls בלבד, כותרות לבנות גדולות (bold), רשימות נקיות עם תמונות קטנות, ניווט תחתון מינימלי. ללא gradient, ללא glow. ${STYLE_ONLY}`,
  },
  {
    id: 'tiktok', name: 'TikTok', tag: 'וידאו', preview: <TikTokPreview />,
    prompt: `החל עיצוב בסגנון TikTok: רקע שחור מלא (#000), טקסט לבן, אקסנט אדום (#FE2C55) לכפתורים ראשיים, אייקוני אינטראקציה עגולים בצד ימין, ניווט תחתון עם 5 טאבים, מראה נקי ומודרני. ללא gradient. ${STYLE_ONLY}`,
  },
  {
    id: 'apple', name: 'Apple', tag: 'מינימלי', preview: <ApplePreview />,
    prompt: `החל עיצוב בסגנון Apple: רקע (#f5f5f7), כרטיסים לבנים עם border-radius: 16px, צללים עדינים (0 1px 3px rgba(0,0,0,0.08)), אקסנט כחול (#007AFF) לפעולות בלבד, הרבה white space, טיפוגרפיה SF Pro - כותרות 28px bold letter-spacing -0.5px, body 15px regular. ללא gradient, ללא אימוג'ים. ${STYLE_ONLY}`,
  },
  {
    id: 'uber', name: 'Uber', tag: 'נסיעות', preview: <UberPreview />,
    prompt: `החל עיצוב בסגנון Uber: רקע לבן, כפתורים שחורים (#000) מלאים, כרטיסים עם רקע (#f6f6f6), טיפוגרפיה מודגשת שחורה, border-radius: 8px, ללא צללים, ללא gradient, תחושת יעילות ופשטות. ${STYLE_ONLY}`,
  },
  {
    id: 'google', name: 'Material', tag: 'Google', preview: <GooglePreview />,
    prompt: `החל עיצוב Material Design 3: רקע לבן, כרטיסים עם border-radius: 12px, surface tones, כפתורי FAB עגולים, צבע ראשי כחול (#4285F4), שדות עם מסגרת עגולה, צללים עדינים (0 1px 3px), ללא gradient. ${STYLE_ONLY}`,
  },
  {
    id: 'food', name: 'משלוחים', tag: 'Wolt', preview: <FoodPreview />,
    prompt: `החל עיצוב בסגנון Wolt/DoorDash: רקע לבן, כרטיסים עם תמונה גדולה + שם + תיאור + דירוג כוכבים + זמן משלוח + מחיר, אקסנט ירוק (#00B37E) לכפתורי CTA, chips קטגוריות אופקיים, ניווט תחתון 4 טאבים. ללא gradient, ללא אימוג'ים. ${STYLE_ONLY}`,
  },
  {
    id: 'fintech', name: 'פינטק', tag: 'Revolut', preview: <FintechPreview />,
    prompt: `החל עיצוב בסגנון Revolut/Robinhood: רקע לבן נקי, כרטיס יתרה עם מספרים גדולים (32px bold), גרף SVG מינימלי, רשימת עסקאות נקייה, אקסנט כחול (#0052FF) לפעולות, ירוק (#00C805) לחיובי ואדום (#FF3B30) לשלילי. ללא gradient. ${STYLE_ONLY}`,
  },
  {
    id: 'fitness', name: 'כושר', tag: 'Strava', preview: <FitnessPreview />,
    prompt: `החל עיצוב בסגנון Strava/Nike Run Club: רקע לבן (#fff), כותרות שחורות מודגשות, מדדים גדולים (48px bold), אקסנט כתום (#FC4C02) לנתונים ו-CTAs, כרטיסי סטטיסטיקות נקיים, ללא glow, ללא ניאון, ללא gradient. ${STYLE_ONLY}`,
  },
  {
    id: 'ecom', name: 'חנות', tag: 'ZARA', preview: <EcomPreview />,
    prompt: `החל עיצוב בסגנון ZARA/COS: רקע לבן, טיפוגרפיה אלגנטית (font-weight: 300, letter-spacing: 2px), תמונות מוצר גדולות, גריד 2 עמודות, מחירים ב-bold, כפתורי "הוסף" שחורים (#000), ללא gradient, ללא צללים, מינימליזם מוחלט. ${STYLE_ONLY}`,
  },
  {
    id: 'social', name: 'חברתי', tag: 'Instagram', preview: <SocialPreview />,
    prompt: `החל עיצוב בסגנון Instagram/Threads: רקע לבן (#fff), כרטיסי feed נקיים, אווטארים עגולים, אייקוני SVG דקים (stroke-width: 1.5) ללייק/תגובה/שיתוף, ניווט תחתון 5 טאבים, border-bottom: 1px solid #efefef, ללא gradient. ${STYLE_ONLY}`,
  },
  {
    id: 'booking', name: 'הזמנות', tag: 'Airbnb', preview: <SocialPreview />,
    prompt: `החל עיצוב בסגנון Airbnb: רקע לבן, כרטיסים עם תמונות גדולות (border-radius: 12px), דירוגי כוכבים קטנים, אקסנט (#FF5A5F) ל-CTAs, שדה חיפוש pill עגול, הרבה white space, font-weight: 600 לכותרות. ללא gradient. ${STYLE_ONLY}`,
  },
  {
    id: 'ai-chat', name: 'AI', tag: 'ChatGPT', preview: <ApplePreview />,
    prompt: `החל עיצוב בסגנון ChatGPT/Claude: רקע לבן (#fff), ממשק צ'אט נקי, בועות הודעות עם רקע אפור בהיר (#f7f7f8) לתגובות AI ושקוף למשתמש, שדה הקלדה pill בתחתית עם אייקון שליחה, אקסנט (#10A37F), ללא gradient. ${STYLE_ONLY}`,
  },
  {
    id: 'health', name: 'בריאות', tag: 'Calm', preview: <ApplePreview />,
    prompt: `החל עיצוב בסגנון Calm/Headspace: רקע בהיר (#fafafa), כרטיסים עם border-radius: 16px, צבעי פסטל מושתקים, אקסנט כחול רגוע (#4EAAF3), טיפוגרפיה רכה (font-weight: 400-500), הרבה white space, מראה שקט ומרגיע. ללא gradient חזק, ללא אנימציות. ${STYLE_ONLY}`,
  },
];

function PresetCard({ preset, onApply, disabled }: { preset: DesignPreset; onApply: (prompt: string) => void; disabled: boolean }) {
  return (
    <button
      onClick={() => onApply(preset.prompt)}
      disabled={disabled}
      title={preset.tag}
      className="group flex flex-col gap-1.5 p-2 rounded-xl border border-border/40 bg-surface/40
        hover:border-primary/40 hover:bg-surface/60 active:scale-[0.97] transition-all duration-200
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

function ShapeCard({ name, preview, onApply, disabled }: { name: string; preview: React.ReactNode; onApply: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onApply}
      disabled={disabled}
      className="group flex flex-col items-center gap-1 p-2 rounded-xl border border-border/40 bg-surface/40
        hover:border-primary/40 hover:bg-primary/5 active:scale-[0.97] transition-all duration-200
        disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {preview}
      <span className="text-[10px] font-medium text-text-secondary group-hover:text-primary">{name}</span>
    </button>
  );
}

export default function DesignGallery({ onApply, isGenerating }: DesignGalleryProps) {
  const [section, setSection] = useState<GallerySection>('shapes');

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Section tabs */}
      <div className="flex gap-1 p-3 border-b border-border/50 flex-shrink-0">
        {([
          { id: 'shapes' as GallerySection, label: '🔲 צורות' },
          { id: 'templates' as GallerySection, label: '📐 תבניות' },
          { id: 'apps' as GallerySection, label: '📱 אפליקציות' },
          { id: 'styles' as GallerySection, label: '🎨 עיצוב' },
        ]).map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
              section === s.id
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-2 border border-transparent'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto scrollbar-thin p-4">
        {/* ── Component Shapes ──────────────────────────────────────── */}
        {section === 'shapes' && (
          <div className="flex flex-col gap-5">
            <p className="text-xs text-text-secondary leading-relaxed">
              בחר צורות לכפתורים, כרטיסים ושדות — <span className="font-semibold text-text-primary">כמו בפיגמה</span>.
            </p>

            {/* Button shapes */}
            <div>
              <label className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold mb-2 block">
                צורת כפתורים
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {BUTTON_SHAPES.map((s) => (
                  <ShapeCard key={s.id} name={s.name} preview={s.preview} onApply={() => onApply(s.prompt)} disabled={isGenerating} />
                ))}
              </div>
            </div>

            <div className="h-px bg-border/60" />

            {/* Card shapes */}
            <div>
              <label className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold mb-2 block">
                צורת כרטיסים
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {CARD_SHAPES.map((s) => (
                  <ShapeCard key={s.id} name={s.name} preview={s.preview} onApply={() => onApply(s.prompt)} disabled={isGenerating} />
                ))}
              </div>
            </div>

            <div className="h-px bg-border/60" />

            {/* Input shapes */}
            <div>
              <label className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold mb-2 block">
                צורת שדות קלט
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {INPUT_SHAPES.map((s) => (
                  <ShapeCard key={s.id} name={s.name} preview={s.preview} onApply={() => onApply(s.prompt)} disabled={isGenerating} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Screen Templates (Figma-quality) ─────────────────────── */}
        {section === 'templates' && (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-text-secondary leading-relaxed">
              תבניות מסך ברמת <span className="font-semibold text-text-primary">Figma</span> — לחץ להוסיף מסך מוכן עם קישורים ופעולות.
            </p>
            <div className="flex flex-col gap-1.5">
              {SCREEN_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onApply(t.prompt)}
                  disabled={isGenerating}
                  className="group flex items-center gap-3 py-3 px-3 rounded-xl border border-border bg-surface
                    hover:border-primary/40 hover:bg-primary/5 active:scale-[0.98] transition-all duration-200
                    disabled:opacity-40 disabled:cursor-not-allowed text-right"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-accent/10 flex items-center justify-center text-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                    {t.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-text-primary">{t.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{t.tag}</span>
                    </div>
                    <p className="text-[10px] text-text-soft mt-0.5 line-clamp-1">{t.prompt.slice(0, 60)}...</p>
                  </div>
                  <svg className="w-4 h-4 text-text-soft group-hover:text-primary flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Famous App Styles ─────────────────────────────────────── */}
        {section === 'apps' && (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-text-secondary leading-relaxed">
              בחר עיצוב מאפליקציה מוכרת — <span className="font-semibold text-text-primary">רק העיצוב, לא התוכן</span>.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {APP_STYLES.map((p) => (
                <PresetCard key={p.id} preset={p} onApply={onApply} disabled={isGenerating} />
              ))}
            </div>
          </div>
        )}

        {/* ── Design Languages ─────────────────────────────────────── */}
        {section === 'styles' && (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-text-secondary leading-relaxed">
              בחר שפת עיצוב — <span className="font-semibold text-text-primary">בלי לשנות את התוכן</span>.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DESIGN_LANGUAGES.map((p) => (
                <PresetCard key={p.id} preset={p} onApply={onApply} disabled={isGenerating} />
              ))}
            </div>
          </div>
        )}
      </div>

      {isGenerating && (
        <div className="flex items-center justify-center gap-2 py-3 px-4 border-t border-border text-xs text-primary bg-primary/5">
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
