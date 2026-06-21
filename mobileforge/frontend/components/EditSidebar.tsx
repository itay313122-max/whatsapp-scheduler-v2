'use client';

import { useState, useEffect, useRef } from 'react';
import type { SelectedElement } from './PropertyPanel';
import DesignGallery from './DesignGallery';

interface Screen {
  label: string;
  index: number;
  active: boolean;
}

type SidebarTab = 'ai' | 'gallery' | 'widgets' | 'layers' | 'animations' | 'properties';

interface EditSidebarProps {
  onAIEdit: (prompt: string) => void;
  isGenerating: boolean;
  appName?: string;
  screens: Screen[];
  onNavigate: (index: number) => void;
  onAddScreen: (prompt: string) => void;
  selectedElement: SelectedElement | null;
  onStyleChange: (path: string, property: string, value: string) => void;
  onTextChange: (path: string, text: string) => void;
  onInsertIcon: (path: string, icon: string) => void;
  onDeselect: () => void;
}

function rgbToHex(rgb: string): string {
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return '#000000';
  return '#' + [m[1], m[2], m[3]].map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
}

// ── Section wrapper with consistent spacing ─────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold mb-2 block select-none">
        {label}
      </label>
      {children}
    </div>
  );
}

function OptionGrid({ children, cols = 'grid-cols-2' }: { children: React.ReactNode; cols?: string }) {
  return <div className={`grid ${cols} gap-1.5`}>{children}</div>;
}

function OptionButton({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`py-2 px-2 min-h-[36px] rounded-lg text-[11px] font-medium border transition-all duration-150 select-none
        ${active
          ? 'border-primary bg-primary/10 text-primary shadow-sm'
          : 'border-border text-text-secondary hover:text-text-primary hover:border-primary/30 hover:bg-primary/5 active:scale-[0.97]'
        }`}
    >
      {children}
    </button>
  );
}

// ── Data ─────────────────────────────────────────────────────────────────────

const AI_QUICK_ACTIONS = [
  {
    category: 'כפתורים',
    icon: '🔘',
    actions: [
      { label: 'מודרניים + gradient', prompt: 'שנה את כל הכפתורים לעיצוב מודרני עם gradient, צללים רכים, ואנימציית hover חלקה' },
      { label: 'הוסף hover effects', prompt: 'הוסף אפקטי hover לכל הכפתורים - שינוי צבע חלק, הגדלה קלה (scale), וצל' },
      { label: 'כפתורים עגולים', prompt: 'הפוך את כל הכפתורים לעגולים עם border-radius מלא ו-padding נוח' },
      { label: 'סגנון outline', prompt: 'שנה את הכפתורים לסגנון outline - רקע שקוף עם מסגרת צבעונית' },
    ],
  },
  {
    category: 'עיצוב כללי',
    icon: '🎨',
    actions: [
      { label: 'הפוך למודרני', prompt: 'שפר את העיצוב הכללי - הוסף gradient רקע, צללים רכים לכרטיסים, ומרווחים נכונים' },
      { label: 'מינימליסטי', prompt: 'הפוך את העיצוב למינימליסטי - הסר צללים מיותרים, צבעים רגועים, הרבה white space' },
      { label: 'הוסף צללים', prompt: 'הוסף box-shadow רך לכל הכרטיסים והרכיבים הראשיים' },
      { label: 'אנימציות כניסה', prompt: 'הוסף אנימציות כניסה (fade-in, slide-up) לרכיבים בעמוד. השתמש ב-CSS keyframes.' },
    ],
  },
  {
    category: 'לייאאוט',
    icon: '📐',
    actions: [
      { label: 'מרכז תוכן', prompt: 'מרכז את כל התוכן הראשי בעמוד עם max-width ו-margin auto' },
      { label: 'header קבוע', prompt: 'הפוך את ה-header ל-sticky/fixed שנשאר למעלה בזמן גלילה עם backdrop-filter blur' },
      { label: 'Grid רספונסיבי', prompt: 'שנה את התצוגה של הכרטיסים/פריטים ל-CSS Grid רספונסיבי 2-3 עמודות' },
      { label: 'הוסף footer', prompt: 'הוסף footer מעוצב לאפליקציה עם לינקים, לוגו קטן, וטקסט זכויות יוצרים' },
    ],
  },
  {
    category: 'תוכן',
    icon: '📝',
    actions: [
      { label: 'הוסף אייקונים', prompt: 'הוסף אייקוני emoji או SVG מתאימים ליד כל כותרת, כפתור ופריט בתפריט' },
      { label: 'שפר טקסטים', prompt: 'שפר את כל הטקסטים באפליקציה - כותרות ברורות יותר, תיאורים מושכים' },
      { label: 'תמונות placeholder', prompt: 'הוסף תמונות placeholder מ-unsplash בגדלים מתאימים לכל מקום רלוונטי' },
      { label: 'RTL מלא', prompt: 'ודא שכל האפליקציה ב-RTL מלא - כיוון טקסט, יישור, ו-flex-direction' },
    ],
  },
];

const FONT_SIZES = ['11px', '12px', '14px', '16px', '20px', '24px', '28px', '32px'];

const BUTTON_SIZE_PRESETS = [
  { id: 'sm', label: 'S', padding: '8px 16px', fontSize: '12px' },
  { id: 'md', label: 'M', padding: '12px 24px', fontSize: '14px' },
  { id: 'lg', label: 'L', padding: '16px 32px', fontSize: '16px' },
  { id: 'xl', label: 'XL', padding: '20px 40px', fontSize: '18px' },
];

const SHADOW_PRESETS = [
  { id: 'none', label: 'ללא', value: 'none' },
  { id: 'sm', label: 'עדין', value: '0 1px 2px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.1)' },
  { id: 'md', label: 'בינוני', value: '0 2px 4px rgba(0,0,0,0.05), 0 4px 6px rgba(0,0,0,0.1)' },
  { id: 'lg', label: 'חזק', value: '0 4px 8px rgba(0,0,0,0.06), 0 8px 16px rgba(0,0,0,0.1)' },
  { id: 'glow', label: 'זוהר', value: '0 0 20px rgba(99,102,241,0.4)' },
];

const AI_RECOMMENDATIONS = [
  { label: 'שפר נגישות', prompt: 'שפר את הנגישות של האפליקציה - הוסף aria-labels, ניגודיות צבעים טובה, ו-focus states לכל רכיב אינטראקטיבי', icon: '♿' },
  { label: 'הוסף loading states', prompt: 'הוסף מצבי טעינה (loading states) עם skeletons או spinners לכל הרכיבים שטוענים מידע', icon: '⏳' },
  { label: 'שפר רספונסיביות', prompt: 'ודא שהאפליקציה רספונסיבית לחלוטין - שימוש ב-flexbox, גדלים יחסיים, ו-media queries', icon: '📱' },
  { label: 'הוסף empty states', prompt: 'הוסף מצבי ריק (empty states) מעוצבים עם אייקון, כותרת, וכפתור פעולה לכל רשימה או אזור תוכן', icon: '📭' },
  { label: 'שפר ביצועים', prompt: 'שפר ביצועים - lazy loading לתמונות, מזער re-renders, הוסף will-change לאנימציות', icon: '⚡' },
  { label: 'הוסף micro-interactions', prompt: 'הוסף micro-interactions - אנימציות hover, לחיצה, מעברים חלקים, ו-feedback ויזואלי לכל אינטראקציה', icon: '✨' },
];

const ICON_LIBRARY = [
  '🏠', '⭐', '❤️', '🔍', '🛒', '👤', '⚙️', '🔔',
  '📅', '📍', '💬', '📷', '🎵', '🍕', '☕', '🛍️',
  '💪', '🏃', '🔥', '✅', '📊', '💰', '🎁', '🚀',
  '📱', '✏️', '🗑️', '➕', '➡️', '⬅️', '✨', '👍',
];

const ANIMATION_PRESETS = [
  {
    category: 'כניסה',
    icon: '🎬',
    animations: [
      { label: 'Fade In', prompt: 'הוסף אנימציית fade-in לכל הרכיבים הראשיים בעמוד. כל רכיב יופיע עם השהייה קטנה אחרי הקודם. השתמש ב-CSS @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }' },
      { label: 'Slide Up', prompt: 'הוסף אנימציית slide-up לכל הכרטיסים והרכיבים. @keyframes slideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }. הוסף animation-delay מדורג לכל רכיב.' },
      { label: 'Scale In', prompt: 'הוסף אנימציית scale-in לכפתורים וכרטיסים. @keyframes scaleIn { from { transform: scale(0.9); opacity: 0 } to { transform: scale(1); opacity: 1 } }' },
      { label: 'Slide From Right', prompt: 'הוסף אנימציית כניסה מימין לשמאל לרכיבים. @keyframes slideRight { from { transform: translateX(30px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }' },
    ],
  },
  {
    category: 'אינטראקציה',
    icon: '👆',
    animations: [
      { label: 'Hover Scale', prompt: 'הוסף אפקט hover scale לכל הכפתורים והכרטיסים: transition: transform 0.2s ease, box-shadow 0.2s ease. בהובר: transform: scale(1.03) ו-box-shadow חזק יותר.' },
      { label: 'Press Effect', prompt: 'הוסף אפקט לחיצה (active state) לכל הכפתורים: active { transform: scale(0.97); transition: transform 0.1s }' },
      { label: 'Glow on Hover', prompt: 'הוסף אפקט זוהר (glow) על hover לכפתורים ראשיים: box-shadow: 0 0 20px rgba(var(--c-primary), 0.4) בהובר' },
      { label: 'Underline Slide', prompt: 'הוסף אנימציית underline שמחליקה מימין לשמאל על hover לכל הלינקים ופריטי ניווט. השתמש ב-::after pseudo-element עם transition.' },
    ],
  },
  {
    category: 'מעברים',
    icon: '🔄',
    animations: [
      { label: 'Smooth Transitions', prompt: 'הוסף transition חלק לכל הרכיבים האינטראקטיביים: transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1). זה כולל כפתורים, כרטיסים, שדות קלט, ופריטי ניווט.' },
      { label: 'Page Transition', prompt: 'הוסף אנימציית מעבר בין מסכים: כשמחליפים מסך, המסך הנוכחי עושה fade-out והחדש עושה fade-in. השתמש ב-CSS transitions.' },
      { label: 'Stagger Animation', prompt: 'הוסף אפקט stagger - כל פריט ברשימה מופיע עם השהייה של 0.05s אחרי הקודם. animation-delay: calc(var(--i) * 0.05s) לכל פריט.' },
      { label: 'Parallax Scroll', prompt: 'הוסף אפקט parallax קל: ה-header זזה לאט יותר מהתוכן בזמן גלילה. השתמש ב-background-attachment: fixed או transform בגלילה.' },
    ],
  },
  {
    category: 'מיוחדים',
    icon: '✨',
    animations: [
      { label: 'Pulse Badge', prompt: 'הוסף אנימציית pulse לבאג\'ים (badges) והתראות: @keyframes pulse { 0%,100% { transform: scale(1) } 50% { transform: scale(1.1) } }' },
      { label: 'Skeleton Loading', prompt: 'הוסף אפקט skeleton loading לכרטיסים: @keyframes shimmer { from { background-position: -200% 0 } to { background-position: 200% 0 } } עם background gradient אפור מתחלף.' },
      { label: 'Float Effect', prompt: 'הוסף אפקט ציפה (float) לאלמנט ראשי/לוגו: @keyframes float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } } animation: float 3s ease-in-out infinite.' },
      { label: 'Gradient Shift', prompt: 'הוסף אנימציית gradient מתחלף לרקע ה-header: @keyframes gradientShift { 0% { background-position: 0% 50% } 50% { background-position: 100% 50% } 100% { background-position: 0% 50% } } background-size: 200% 200%.' },
    ],
  },
];

const WIDGET_CATEGORIES = [
  {
    category: 'זמן ותאריך',
    icon: '🕐',
    widgets: [
      { label: 'שעון דיגיטלי', icon: '⏰', prompt: 'הוסף ווידג\'ט שעון דיגיטלי אינטראקטיבי שמציג שעה, דקות ושניות בזמן אמת. השתמש ב-useEffect עם setInterval כל שנייה. עיצוב מודרני עם font-family: monospace, גודל גדול, ורקע card.' },
      { label: 'שעון אנלוגי', icon: '🕰️', prompt: 'הוסף ווידג\'ט שעון אנלוגי עם SVG. צייר מעגל, סימני שעות, מחוג שעות (קצר ועבה), מחוג דקות (ארוך), ומחוג שניות (אדום דק). עדכן כל שנייה עם useEffect. השתמש ב-transform: rotate() למחוגים.' },
      { label: 'טיימר / ספירה לאחור', icon: '⏱️', prompt: 'הוסף ווידג\'ט טיימר עם ספירה לאחור. כפתורי start/stop/reset. הצג דקות:שניות בפורמט גדול. כפתורי הוספת זמן (1 דק, 5 דק, 10 דק). השמע התראה כשנגמר. min-height 48px לכל הכפתורים.' },
      { label: 'סטופר', icon: '🏃', prompt: 'הוסף סטופר (stopwatch) עם הצגת שעות:דקות:שניות:מאיות. כפתורי Start, Stop, Reset, Lap. רשימת lap times עם מספור. font-family: monospace לתצוגה.' },
      { label: 'לוח שנה', icon: '📅', prompt: 'הוסף ווידג\'ט לוח שנה חודשי אינטראקטיבי. הצג grid של 7 עמודות (א-ש). כפתורי חודש קודם/הבא. הדגש את היום הנוכחי. לחיצה על יום מסמנת אותו. השתמש ב-Date object לחישוב ימים.' },
      { label: 'בוחר תאריך', icon: '📆', prompt: 'הוסף date picker מעוצב. שלושה select dropdowns ליום, חודש, שנה. או לוח שנה popup. הצג את התאריך הנבחר בפורמט עברי. כפתור "היום" לבחירת היום הנוכחי.' },
    ],
  },
  {
    category: 'גרפים ונתונים',
    icon: '📊',
    widgets: [
      { label: 'גרף עמודות', icon: '📊', prompt: 'הוסף ווידג\'ט גרף עמודות (bar chart) מבוסס SVG. הצג 5-7 עמודות עם נתונים לדוגמה. labels בתחתית, ערכים בראש כל עמודה. צבעי gradient לעמודות. אנימציית כניסה. רספונסיבי לרוחב.' },
      { label: 'גרף קו', icon: '📈', prompt: 'הוסף ווידג\'ט גרף קו (line chart) מבוסס SVG. קו חלק עם נקודות. אזור מלא (area) עם gradient שקוף. labels לצירים. tooltip בהובר על נקודה. נתוני דוגמה מציאותיים.' },
      { label: 'גרף עוגה', icon: '🥧', prompt: 'הוסף ווידג\'ט גרף עוגה (pie/donut chart) מבוסס SVG. 4-5 פרוסות בצבעים שונים. מקרא (legend) עם אחוזים. גרסת donut עם מספר במרכז. אנימציית סיבוב בכניסה.' },
      { label: 'מד התקדמות מעגלי', icon: '🔄', prompt: 'הוסף מד התקדמות מעגלי (circular progress) מבוסס SVG. מעגל ברקע + arc צבעוני שמתמלא. אחוז במרכז. אנימציית מילוי חלקה. כפתור +/- לשינוי ערך.' },
      { label: 'סטטיסטיקה', icon: '🔢', prompt: 'הוסף ווידג\'ט כרטיסי סטטיסטיקה — 3-4 כרטיסים ב-grid עם: אייקון, מספר גדול (display), תיאור קטן (caption), ושינוי באחוזים (ירוק/אדום). אנימציית ספירה למספרים.' },
    ],
  },
  {
    category: 'מדיה ותוכן',
    icon: '🎵',
    widgets: [
      { label: 'נגן אודיו', icon: '🎵', prompt: 'הוסף ווידג\'ט נגן אודיו מעוצב. כפתור play/pause עגול גדול. progress bar עם זמן נוכחי/כולל. כפתורי קדימה/אחורה. שם שיר ואמן. כפתור shuffle ו-repeat. עיצוב card.' },
      { label: 'קרוסל תמונות', icon: '🎠', prompt: 'הוסף קרוסל תמונות אינטראקטיבי. חצים ימינה/שמאלה. נקודות (dots) למיקום נוכחי. מעבר חלק עם transition. תמונות placeholder עם gradient background. Auto-play אופציונלי.' },
      { label: 'דירוג כוכבים', icon: '⭐', prompt: 'הוסף ווידג\'ט דירוג כוכבים אינטראקטיבי. 5 כוכבים שמשנים צבע ב-hover ובלחיצה. הצג את הדירוג הנבחר כמספר. אפשרות חצאי כוכב. כוכבים גדולים (32px) עם transition color.' },
      { label: 'גלריית תמונות', icon: '🖼️', prompt: 'הוסף גלריית תמונות ב-grid (2-3 עמודות). תמונות placeholder עם gradients צבעוניים. lightbox בלחיצה (מסך מלא). כפתור סגירה. ספירת תמונות.' },
    ],
  },
  {
    category: 'מיקום ומפות',
    icon: '📍',
    widgets: [
      { label: 'מיקום נוכחי', icon: '📍', prompt: 'הוסף ווידג\'ט מיקום המציג את המיקום הנוכחי. כפתור "מצא מיקום" שמשתמש ב-navigator.geolocation.getCurrentPosition. הצג latitude, longitude. הצג כתובת מוערכת. כרטיס עם אייקון מפה.' },
      { label: 'מפה סטטית', icon: '🗺️', prompt: 'הוסף ווידג\'ט מפה סטטית מבוססת SVG. צייר מפת ישראל פשוטה או grid של רחובות. סמן מיקום אדום עם pulse animation. מידע על המיקום בכרטיס למטה. כפתורי zoom in/out.' },
      { label: 'מחשב מרחק', icon: '📏', prompt: 'הוסף ווידג\'ט מחשב מרחק בין שתי נקודות. שני שדות קלט לעיר מקור ויעד (dropdown עם ערים ישראליות). חישוב מרחק משוער. הצגת זמן נסיעה. אייקון מכונית/הליכה/אוטובוס.' },
    ],
  },
  {
    category: 'טפסים וקלט',
    icon: '📝',
    widgets: [
      { label: 'טופס יצירת קשר', icon: '✉️', prompt: 'הוסף טופס יצירת קשר מלא: שם, אימייל, טלפון, הודעה (textarea). כפתור שליחה עם validation. הצג הודעת הצלחה לאחר שליחה. כל שדות עם min-height 48px ו-labels.' },
      { label: 'סקר / שאלון', icon: '📋', prompt: 'הוסף ווידג\'ט סקר עם 3-4 שאלות. שאלות בחירה (radio buttons), שאלת דירוג (סליידר), ושאלה פתוחה (textarea). progress bar למעלה. כפתור הבא/הקודם. מסך סיכום בסוף.' },
      { label: 'חיפוש מתקדם', icon: '🔍', prompt: 'הוסף ווידג\'ט חיפוש מתקדם: שדה חיפוש עם אייקון, פילטרים (chips), מיון (dropdown), ותוצאות מיידיות. אנימציית הקלדה. הצג "אין תוצאות" ב-empty state.' },
      { label: 'סליידר טווח', icon: '🎚️', prompt: 'הוסף ווידג\'ט סליידר טווח אינטראקטיבי (range slider). הצג ערך נוכחי. min/max labels. שני ידיות לטווח (min-max). שינוי צבע לפי ערך. min-height 48px לאזור המגע.' },
    ],
  },
  {
    category: 'חברתי ושיתוף',
    icon: '🤝',
    widgets: [
      { label: 'כפתורי שיתוף', icon: '📤', prompt: 'הוסף ווידג\'ט כפתורי שיתוף חברתי: WhatsApp (ירוק), Facebook (כחול), Twitter/X (שחור), Email (אדום), Copy Link. כל כפתור עם אייקון ו-min-height 48px. שורה אופקית או bottom sheet.' },
      { label: 'כרטיס פרופיל', icon: '👤', prompt: 'הוסף כרטיס פרופיל מעוצב: אווטאר gradient עגול, שם, תיאור, 3 סטטיסטיקות (פוסטים/עוקבים/עוקב), כפתור "עקוב" toggle, פס צבעוני עליון.' },
      { label: 'תגובות', icon: '💬', prompt: 'הוסף ווידג\'ט תגובות: רשימת תגובות עם אווטאר, שם, זמן, וטקסט. שדה הוספת תגובה חדשה. כפתור לייק לכל תגובה. תגובות מדורגות (נוספות עולות למעלה).' },
      { label: 'פיד חדשות', icon: '📰', prompt: 'הוסף פיד חדשות: כרטיסי חדשות עם כותרת, תיאור קצר, תאריך, קטגוריה (chip), ואייקון. כפתור "קרא עוד" שמרחיב את הכרטיס. pull-to-refresh.' },
    ],
  },
  {
    category: 'כלים שימושיים',
    icon: '🛠️',
    widgets: [
      { label: 'מחשבון', icon: '🧮', prompt: 'הוסף מחשבון אינטראקטיבי: grid של מספרים (0-9), פעולות (+,-,×,÷), כפתורי AC ו-=. תצוגת מספר גדולה למעלה. היסטוריית חישובים. כפתורים עם min-height 48px. עיצוב dark card.' },
      { label: 'רשימת קניות', icon: '🛒', prompt: 'הוסף רשימת קניות אינטראקטיבית: הוספת פריט עם שדה קלט, סימון V לפריטים שנקנו (strikethrough), מחיקה בהחלקה, ספירת פריטים, כפתור "נקה הכל". empty state כשהרשימה ריקה.' },
      { label: 'הערות', icon: '📝', prompt: 'הוסף ווידג\'ט הערות (notes): רשימת הערות עם כותרת ותאריך. הוספת הערה חדשה עם textarea. צבע כרטיס הערה (4 צבעים לבחירה). חיפוש הערות. grid layout (2 עמודות).' },
      { label: 'מעקב הרגלים', icon: '✅', prompt: 'הוסף ווידג\'ט מעקב הרגלים יומי: 5 הרגלים עם אייקון, שם, ו-checkbox (toggle). progress bar כללי למעלה. streak (ימים רצופים) לכל הרגל. כפתור "הוסף הרגל חדש".' },
    ],
  },
];

const PRESET_SCREENS = [
  { id: 'settings', label: 'הגדרות', icon: '⚙️' },
  { id: 'profile', label: 'פרופיל', icon: '👤' },
  { id: 'about', label: 'אודות', icon: 'ℹ️' },
  { id: 'contact', label: 'צור קשר', icon: '💬' },
];

export default function EditSidebar({
  onAIEdit,
  isGenerating,
  appName,
  screens,
  onNavigate,
  onAddScreen,
  selectedElement,
  onStyleChange,
  onTextChange,
  onInsertIcon,
  onDeselect,
}: EditSidebarProps) {
  const [tab, setTab] = useState<SidebarTab>('ai');
  const [aiPrompt, setAIPrompt] = useState('');
  const [text, setText] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>('כפתורים');
  const [expandedAnimCategory, setExpandedAnimCategory] = useState<string | null>('כניסה');
  const [expandedWidgetCategory, setExpandedWidgetCategory] = useState<string | null>('זמן ותאריך');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (selectedElement) {
      setTab('properties');
      setText(selectedElement.text);
    }
  }, [selectedElement]);

  const isButton = selectedElement?.tag === 'button' || selectedElement?.tag === 'a';
  const isTextEl = selectedElement && ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'label', 'button', 'a', 'li'].includes(selectedElement.tag);

  const handleAISubmit = () => {
    if (!aiPrompt.trim() || isGenerating) return;
    onAIEdit(aiPrompt.trim());
    setAIPrompt('');
  };

  const tabs: { id: SidebarTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'ai',
      label: 'AI עיצוב',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
        </svg>
      ),
    },
    {
      id: 'gallery',
      label: 'גלריה',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      ),
    },
    {
      id: 'widgets',
      label: 'ווידג\'טים',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.401.604-.401.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.959.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
        </svg>
      ),
    },
    {
      id: 'layers',
      label: 'מסכים',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
        </svg>
      ),
    },
    {
      id: 'animations' as SidebarTab,
      label: 'אנימציה',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
        </svg>
      ),
    },
    {
      id: 'properties',
      label: 'מאפיינים',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* ── Tab bar — Figma-style with indicator ─────────────────────── */}
      <div className="flex border-b border-border bg-surface flex-shrink-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            title={t.label}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 min-h-[44px] text-[10px] font-medium transition-all duration-200 relative
              ${tab === t.id ? 'text-primary' : 'text-text-soft hover:text-text-secondary'}`}
          >
            <span className={`transition-transform duration-200 ${tab === t.id ? 'scale-110' : ''}`}>
              {t.icon}
            </span>
            <span>{t.label}</span>
            {selectedElement && t.id === 'properties' && tab !== 'properties' && (
              <span className="absolute top-1.5 end-3 w-2 h-2 rounded-full bg-primary animate-pulse" />
            )}
            {tab === t.id && (
              <div className="absolute bottom-0 inset-x-3 h-[2px] bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto scrollbar-thin">

        {/* ── AI Design ──────────────────────────────────────────────── */}
        {tab === 'ai' && (
          <div className="flex flex-col gap-4 p-4">
            {/* Input */}
            <Section label="בקשת עיצוב חופשית">
              <textarea
                ref={textareaRef}
                value={aiPrompt}
                onChange={(e) => setAIPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAISubmit();
                  }
                }}
                placeholder='למשל: "הפוך את הכפתורים לסגנון מודרני עם צללים"'
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-border text-text-primary text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none placeholder:text-text-soft transition-all"
              />
              <button
                onClick={handleAISubmit}
                disabled={!aiPrompt.trim() || isGenerating}
                className={`w-full mt-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  isGenerating
                    ? 'bg-primary/20 text-primary/60 cursor-wait'
                    : aiPrompt.trim()
                      ? 'bg-gradient-to-l from-primary to-accent text-white hover:shadow-glow active:scale-[0.98]'
                      : 'bg-surface-2 text-text-soft cursor-not-allowed'
                }`}
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    AI מעצב...
                  </span>
                ) : 'החל שינויים'}
              </button>
            </Section>

            <div className="h-px bg-border/60" />

            {/* Quick actions */}
            <Section label="פעולות מהירות">
              <div className="flex flex-col gap-0.5">
                {AI_QUICK_ACTIONS.map((cat) => (
                  <div key={cat.category}>
                    <button
                      onClick={() => setExpandedCategory(expandedCategory === cat.category ? null : cat.category)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all duration-150 ${
                        expandedCategory === cat.category
                          ? 'bg-primary/8 text-primary font-semibold'
                          : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
                      }`}
                    >
                      <span className="text-sm">{cat.icon}</span>
                      <span className="flex-1 text-right">{cat.category}</span>
                      <svg
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedCategory === cat.category ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedCategory === cat.category && (
                      <div className="grid grid-cols-2 gap-1.5 mt-1.5 mb-1 pe-2">
                        {cat.actions.map((action) => (
                          <button
                            key={action.label}
                            onClick={() => onAIEdit(action.prompt)}
                            disabled={isGenerating}
                            title={action.prompt}
                            className="py-2 px-2.5 rounded-lg text-[10px] font-medium border border-border text-text-secondary
                              hover:text-primary hover:border-primary/30 hover:bg-primary/5
                              active:scale-[0.97] transition-all duration-150 text-right disabled:opacity-40 leading-tight"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>

            <div className="h-px bg-border/60" />

            {/* AI Recommendations */}
            <Section label="✨ המלצות AI">
              <p className="text-[10px] text-text-soft mb-2 leading-relaxed">
                {appName ? `שיפורים מומלצים ל${appName}` : 'שיפורים מקצועיים מומלצים'}
              </p>
              <div className="flex flex-col gap-1.5">
                {AI_RECOMMENDATIONS.map((rec) => (
                  <button
                    key={rec.label}
                    onClick={() => onAIEdit(rec.prompt)}
                    disabled={isGenerating}
                    title={rec.prompt}
                    className="flex items-center gap-2.5 py-2 px-3 rounded-lg text-[11px] font-medium border border-border text-text-secondary
                      hover:text-primary hover:border-primary/30 hover:bg-primary/5
                      active:scale-[0.98] transition-all duration-150 text-right disabled:opacity-40"
                  >
                    <span className="text-sm flex-shrink-0">{rec.icon}</span>
                    <span className="flex-1 text-right">{rec.label}</span>
                    <svg className="w-3.5 h-3.5 opacity-40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </Section>
          </div>
        )}

        {/* ── Design Gallery ─────────────────────────────────────────── */}
        {tab === 'gallery' && (
          <DesignGallery onApply={onAIEdit} isGenerating={isGenerating} />
        )}

        {/* ── Widgets ───────────────────────────────────────────────── */}
        {tab === 'widgets' && (
          <div className="flex flex-col gap-4 p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/15 to-cyan-500/10 flex items-center justify-center text-sm">
                🧩
              </div>
              <div>
                <p className="text-xs font-semibold text-text-primary">ספריית ווידג'טים</p>
                <p className="text-[10px] text-text-soft">הוסף רכיבים אינטראקטיביים לאפליקציה</p>
              </div>
            </div>

            {WIDGET_CATEGORIES.map((cat) => (
              <div key={cat.category}>
                <button
                  onClick={() => setExpandedWidgetCategory(expandedWidgetCategory === cat.category ? null : cat.category)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all duration-150 ${
                    expandedWidgetCategory === cat.category
                      ? 'bg-primary/8 text-primary font-semibold'
                      : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
                  }`}
                >
                  <span className="text-sm">{cat.icon}</span>
                  <span className="flex-1 text-right">{cat.category}</span>
                  <svg
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedWidgetCategory === cat.category ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedWidgetCategory === cat.category && (
                  <div className="grid grid-cols-2 gap-1.5 mt-1.5 mb-1 pe-2">
                    {cat.widgets.map((widget) => (
                      <button
                        key={widget.label}
                        onClick={() => onAIEdit(widget.prompt)}
                        disabled={isGenerating}
                        title={widget.prompt}
                        className="py-2 px-2.5 min-h-[44px] rounded-lg text-[10px] font-medium border border-border text-text-secondary
                          hover:text-primary hover:border-primary/30 hover:bg-primary/5
                          active:scale-[0.97] transition-all duration-150 text-right disabled:opacity-40 leading-tight flex items-center gap-1.5"
                      >
                        <span className="text-sm flex-shrink-0">{widget.icon}</span>
                        <span>{widget.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div className="h-px bg-border/60" />

            <Section label="ווידג'ט מותאם">
              <textarea
                value={aiPrompt}
                onChange={(e) => setAIPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAISubmit();
                  }
                }}
                placeholder={'למשל: "הוסף ווידג\'ט מזג אוויר עם טמפרטורה ואייקון"'}
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-border text-text-primary text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none placeholder:text-text-soft transition-all"
              />
              <button
                onClick={handleAISubmit}
                disabled={!aiPrompt.trim() || isGenerating}
                className={`w-full mt-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  isGenerating
                    ? 'bg-primary/20 text-primary/60 cursor-wait'
                    : aiPrompt.trim()
                      ? 'bg-gradient-to-l from-primary to-accent text-white hover:shadow-glow active:scale-[0.98]'
                      : 'bg-surface-2 text-text-soft cursor-not-allowed'
                }`}
              >
                {isGenerating ? 'AI מוסיף...' : 'הוסף ווידג\'ט'}
              </button>
            </Section>
          </div>
        )}

        {tab === 'layers' && (
          <div className="flex flex-col h-full">
            <div className="px-4 py-3 border-b border-border/50">
              <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">מסכים באפליקציה</span>
            </div>

            <div className="flex-1 overflow-auto py-1">
              {screens.length > 0 ? (
                screens.map((screen) => (
                  <button
                    key={screen.index}
                    onClick={() => onNavigate(screen.index)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-right text-xs transition-all duration-150 ${
                      screen.active
                        ? 'bg-primary/10 text-primary font-semibold border-e-2 border-primary'
                        : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold flex-shrink-0 transition-colors ${
                      screen.active ? 'bg-primary text-white' : 'bg-surface-2 text-text-soft'
                    }`}>
                      {screen.index + 1}
                    </div>
                    <span className="truncate">{screen.label}</span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-8 text-center">
                  <div className="w-12 h-12 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-xl mx-auto mb-3">
                    📱
                  </div>
                  <p className="text-xs text-text-soft">בנה אפליקציה כדי לראות מסכים</p>
                </div>
              )}
            </div>

            <div className="border-t border-border p-3">
              <p className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold mb-2">הוסף מסך</p>
              <OptionGrid>
                {PRESET_SCREENS.map((s) => (
                  <OptionButton key={s.id} onClick={() => onAddScreen(`הוסף מסך ${s.label} לאפליקציה`)}>
                    {s.icon} {s.label}
                  </OptionButton>
                ))}
              </OptionGrid>
            </div>
          </div>
        )}

        {/* ── Animations ─────────────────────────────────────────────── */}
        {tab === 'animations' && (
          <div className="flex flex-col gap-4 p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/15 to-pink-500/10 flex items-center justify-center text-sm">
                🎬
              </div>
              <div>
                <p className="text-xs font-semibold text-text-primary">אנימציות ואפקטים</p>
                <p className="text-[10px] text-text-soft">הוסף תנועה וחיים לאפליקציה</p>
              </div>
            </div>

            {ANIMATION_PRESETS.map((cat) => (
              <div key={cat.category}>
                <button
                  onClick={() => setExpandedAnimCategory(expandedAnimCategory === cat.category ? null : cat.category)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all duration-150 ${
                    expandedAnimCategory === cat.category
                      ? 'bg-primary/8 text-primary font-semibold'
                      : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
                  }`}
                >
                  <span className="text-sm">{cat.icon}</span>
                  <span className="flex-1 text-right">{cat.category}</span>
                  <svg
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedAnimCategory === cat.category ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedAnimCategory === cat.category && (
                  <div className="grid grid-cols-2 gap-1.5 mt-1.5 mb-1 pe-2">
                    {cat.animations.map((anim) => (
                      <button
                        key={anim.label}
                        onClick={() => onAIEdit(anim.prompt)}
                        disabled={isGenerating}
                        title={anim.prompt}
                        className="py-2 px-2.5 rounded-lg text-[10px] font-medium border border-border text-text-secondary
                          hover:text-primary hover:border-primary/30 hover:bg-primary/5
                          active:scale-[0.97] transition-all duration-150 text-right disabled:opacity-40 leading-tight"
                      >
                        {anim.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div className="h-px bg-border/60" />

            <Section label="אנימציה מותאמת">
              <textarea
                value={aiPrompt}
                onChange={(e) => setAIPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAISubmit();
                  }
                }}
                placeholder='למשל: "הוסף אנימציית bounce לכפתור הראשי"'
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-border text-text-primary text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none placeholder:text-text-soft transition-all"
              />
              <button
                onClick={handleAISubmit}
                disabled={!aiPrompt.trim() || isGenerating}
                className={`w-full mt-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  isGenerating
                    ? 'bg-primary/20 text-primary/60 cursor-wait'
                    : aiPrompt.trim()
                      ? 'bg-gradient-to-l from-primary to-accent text-white hover:shadow-glow active:scale-[0.98]'
                      : 'bg-surface-2 text-text-soft cursor-not-allowed'
                }`}
              >
                {isGenerating ? 'AI מוסיף...' : 'החל אנימציה'}
              </button>
            </Section>
          </div>
        )}

        {/* ── Properties ─────────────────────────────────────────────── */}
        {tab === 'properties' && (
          <div className="flex flex-col gap-4 p-4">
            {selectedElement ? (
              <>
                {/* Element header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="px-2.5 py-1 rounded-md bg-primary/10 text-primary text-[10px] font-mono font-bold uppercase tracking-wide">
                      &lt;{selectedElement.tag}&gt;
                    </div>
                  </div>
                  <button
                    onClick={onDeselect}
                    title="בטל בחירה"
                    className="p-1.5 rounded-lg hover:bg-surface-2 text-text-soft hover:text-text-primary transition-all active:scale-90"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Text content */}
                {isTextEl && (
                  <Section label="טקסט">
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onBlur={() => onTextChange(selectedElement.path, text)}
                      rows={2}
                      className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-border text-text-primary text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none transition-all"
                    />
                  </Section>
                )}

                {/* Icon picker — click to add icon to element */}
                <Section label="הוסף אייקון">
                  <p className="text-[10px] text-text-soft mb-1.5 leading-relaxed">לחץ על אייקון כדי להוסיף אותו לרכיב</p>
                  <div className="grid grid-cols-8 gap-1">
                    {ICON_LIBRARY.map((icon) => (
                      <button
                        key={icon}
                        onClick={() => onInsertIcon(selectedElement.path, icon)}
                        title={`הוסף ${icon}`}
                        className="aspect-square flex items-center justify-center rounded-md text-sm border border-border
                          hover:border-primary/40 hover:bg-primary/5 active:scale-90 transition-all duration-150"
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </Section>

                {/* Button size */}
                {isButton && (
                  <Section label="גודל כפתור">
                    <OptionGrid cols="grid-cols-4">
                      {BUTTON_SIZE_PRESETS.map((s) => (
                        <OptionButton
                          key={s.id}
                          title={`${s.fontSize} / ${s.padding}`}
                          onClick={() => {
                            onStyleChange(selectedElement.path, 'padding', s.padding);
                            onStyleChange(selectedElement.path, 'fontSize', s.fontSize);
                          }}
                        >
                          {s.label}
                        </OptionButton>
                      ))}
                    </OptionGrid>
                  </Section>
                )}

                {/* Font size */}
                {isTextEl && (
                  <Section label="גודל טקסט">
                    <div className="flex flex-wrap gap-1.5">
                      {FONT_SIZES.map((size) => (
                        <OptionButton
                          key={size}
                          active={selectedElement.styles.fontSize === size}
                          onClick={() => onStyleChange(selectedElement.path, 'fontSize', size)}
                        >
                          {parseInt(size)}
                        </OptionButton>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Font weight */}
                {isTextEl && (
                  <Section label="משקל טקסט">
                    <OptionGrid cols="grid-cols-3">
                      {[
                        { id: '400', label: 'רגיל' },
                        { id: '600', label: 'בולט' },
                        { id: '800', label: 'כבד' },
                      ].map((w) => (
                        <OptionButton
                          key={w.id}
                          active={selectedElement.styles.fontWeight === w.id || (w.id === '400' && parseInt(selectedElement.styles.fontWeight) < 500)}
                          onClick={() => onStyleChange(selectedElement.path, 'fontWeight', w.id)}
                        >
                          {w.label}
                        </OptionButton>
                      ))}
                    </OptionGrid>
                  </Section>
                )}

                {/* Text align */}
                {isTextEl && (
                  <Section label="יישור">
                    <OptionGrid cols="grid-cols-3">
                      {[
                        { id: 'right', label: 'ימין' },
                        { id: 'center', label: 'מרכז' },
                        { id: 'left', label: 'שמאל' },
                      ].map((a) => (
                        <OptionButton
                          key={a.id}
                          active={selectedElement.styles.textAlign === a.id}
                          onClick={() => onStyleChange(selectedElement.path, 'textAlign', a.id)}
                        >
                          {a.label}
                        </OptionButton>
                      ))}
                    </OptionGrid>
                  </Section>
                )}

                {/* Colors — side by side */}
                <Section label="צבעים">
                  <div className="flex items-center gap-4">
                    <label className="flex flex-col items-center gap-1.5 cursor-pointer">
                      <input
                        type="color"
                        defaultValue={rgbToHex(selectedElement.styles.color)}
                        onChange={(e) => onStyleChange(selectedElement.path, 'color', e.target.value)}
                        className="w-9 h-9 rounded-lg cursor-pointer border-2 border-border hover:border-primary/40 transition-colors"
                      />
                      <span className="text-[9px] text-text-soft font-medium">טקסט</span>
                    </label>
                    <label className="flex flex-col items-center gap-1.5 cursor-pointer">
                      <input
                        type="color"
                        defaultValue={rgbToHex(selectedElement.styles.backgroundColor)}
                        onChange={(e) => onStyleChange(selectedElement.path, 'backgroundColor', e.target.value)}
                        className="w-9 h-9 rounded-lg cursor-pointer border-2 border-border hover:border-primary/40 transition-colors"
                      />
                      <span className="text-[9px] text-text-soft font-medium">רקע</span>
                    </label>
                    <button
                      onClick={() => onStyleChange(selectedElement.path, 'backgroundColor', 'transparent')}
                      title="הפוך רקע לשקוף"
                      className="flex flex-col items-center gap-1.5 group"
                    >
                      <div className="w-9 h-9 rounded-lg border-2 border-border group-hover:border-red-300 flex items-center justify-center transition-colors"
                        style={{ background: 'repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%) 50% / 12px 12px' }}>
                        <svg className="w-4 h-4 text-text-soft group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      </div>
                      <span className="text-[9px] text-text-soft font-medium">שקוף</span>
                    </button>
                  </div>
                </Section>

                {/* Shadow */}
                <Section label="צל">
                  <OptionGrid cols="grid-cols-5">
                    {SHADOW_PRESETS.map((s) => (
                      <OptionButton
                        key={s.id}
                        title={s.value}
                        onClick={() => onStyleChange(selectedElement.path, 'boxShadow', s.value)}
                      >
                        {s.label}
                      </OptionButton>
                    ))}
                  </OptionGrid>
                </Section>

                {/* Border radius */}
                <Section label="עיגול פינות">
                  <OptionGrid cols="grid-cols-4">
                    {['0px', '4px', '8px', '12px', '16px', '24px', '9999px'].map((r) => (
                      <OptionButton
                        key={r}
                        active={selectedElement.styles.borderRadius === r}
                        onClick={() => onStyleChange(selectedElement.path, 'borderRadius', r)}
                      >
                        {r === '9999px' ? 'Full' : parseInt(r)}
                      </OptionButton>
                    ))}
                  </OptionGrid>
                </Section>

                {/* Padding */}
                <Section label="ריווח פנימי">
                  <OptionGrid cols="grid-cols-6">
                    {['0px', '4px', '8px', '16px', '24px', '32px'].map((p) => (
                      <OptionButton
                        key={p}
                        onClick={() => onStyleChange(selectedElement.path, 'padding', p)}
                      >
                        {parseInt(p)}
                      </OptionButton>
                    ))}
                  </OptionGrid>
                </Section>

                {/* Opacity */}
                <Section label="שקיפות">
                  <OptionGrid cols="grid-cols-5">
                    {['1', '0.9', '0.75', '0.5', '0.25'].map((o) => (
                      <OptionButton
                        key={o}
                        onClick={() => onStyleChange(selectedElement.path, 'opacity', o)}
                      >
                        {Math.round(parseFloat(o) * 100)}%
                      </OptionButton>
                    ))}
                  </OptionGrid>
                </Section>

                {/* Width */}
                <Section label="רוחב">
                  <OptionGrid cols="grid-cols-4">
                    {[
                      { label: 'אוטו', value: 'auto' },
                      { label: '50%', value: '50%' },
                      { label: '100%', value: '100%' },
                      { label: 'Fit', value: 'fit-content' },
                    ].map((w) => (
                      <OptionButton key={w.value} onClick={() => onStyleChange(selectedElement.path, 'width', w.value)}>
                        {w.label}
                      </OptionButton>
                    ))}
                  </OptionGrid>
                </Section>

                {/* AI for this element */}
                <div className="border-t border-border pt-4">
                  <Section label="AI לרכיב זה">
                    <div className="flex flex-wrap gap-1.5">
                      {isButton ? (
                        <>
                          <button onClick={() => onAIEdit(`שפר את העיצוב של הכפתור "${selectedElement.text}" - הוסף gradient, צל, ואנימציית hover`)} disabled={isGenerating}
                            className="py-1.5 px-3 rounded-lg text-[10px] font-medium bg-primary/8 text-primary border border-primary/15 hover:bg-primary/15 active:scale-[0.97] transition-all disabled:opacity-40">
                            שפר כפתור
                          </button>
                          <button onClick={() => onAIEdit(`הוסף אייקון מתאים לכפתור "${selectedElement.text}"`)} disabled={isGenerating}
                            className="py-1.5 px-3 rounded-lg text-[10px] font-medium bg-primary/8 text-primary border border-primary/15 hover:bg-primary/15 active:scale-[0.97] transition-all disabled:opacity-40">
                            + אייקון
                          </button>
                          <button onClick={() => onAIEdit(`הפוך את הכפתור "${selectedElement.text}" לסגנון outline`)} disabled={isGenerating}
                            className="py-1.5 px-3 rounded-lg text-[10px] font-medium bg-primary/8 text-primary border border-primary/15 hover:bg-primary/15 active:scale-[0.97] transition-all disabled:opacity-40">
                            Outline
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => onAIEdit(`שפר את העיצוב של ה-${selectedElement.tag} "${selectedElement.text.slice(0, 30)}" - הפוך למרשים יותר`)} disabled={isGenerating}
                            className="py-1.5 px-3 rounded-lg text-[10px] font-medium bg-primary/8 text-primary border border-primary/15 hover:bg-primary/15 active:scale-[0.97] transition-all disabled:opacity-40">
                            שפר עיצוב
                          </button>
                          <button onClick={() => onAIEdit(`הוסף אנימציית כניסה לרכיב ה-${selectedElement.tag}`)} disabled={isGenerating}
                            className="py-1.5 px-3 rounded-lg text-[10px] font-medium bg-primary/8 text-primary border border-primary/15 hover:bg-primary/15 active:scale-[0.97] transition-all disabled:opacity-40">
                            + אנימציה
                          </button>
                        </>
                      )}
                    </div>
                  </Section>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-12 px-6">
                <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-text-soft" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
                  </svg>
                </div>
                <p className="text-sm text-text-primary font-medium mb-1.5">לחץ על רכיב</p>
                <p className="text-[11px] text-text-soft leading-relaxed max-w-[180px]">
                  לחץ על כפתור, טקסט, או כל רכיב בתצוגה המקדימה כדי לערוך אותו
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
