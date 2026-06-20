'use client';

import { useState, useEffect } from 'react';
import type { SelectedElement } from './PropertyPanel';

// ── Types ────────────────────────────────────────────────────────────────────

interface Screen {
  label: string;
  index: number;
  active: boolean;
}

type SidebarTab = 'ai' | 'layers' | 'properties';

interface EditSidebarProps {
  onAIEdit: (prompt: string) => void;
  isGenerating: boolean;
  screens: Screen[];
  onNavigate: (index: number) => void;
  onAddScreen: (prompt: string) => void;
  selectedElement: SelectedElement | null;
  onStyleChange: (path: string, property: string, value: string) => void;
  onTextChange: (path: string, text: string) => void;
  onDeselect: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function rgbToHex(rgb: string): string {
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return '#000000';
  return '#' + [m[1], m[2], m[3]].map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
}

// ── Data ─────────────────────────────────────────────────────────────────────

const AI_QUICK_ACTIONS = [
  {
    category: 'כפתורים',
    icon: '🔘',
    actions: [
      { label: 'כפתורים מודרניים', prompt: 'שנה את כל הכפתורים לעיצוב מודרני עם gradient, צללים רכים, ואנימציית hover חלקה' },
      { label: 'הוסף hover effects', prompt: 'הוסף אפקטי hover לכל הכפתורים - שינוי צבע חלק, הגדלה קלה (scale), וצל' },
      { label: 'כפתורים עגולים', prompt: 'הפוך את כל הכפתורים לעגולים עם border-radius מלא ו-padding נוח' },
      { label: 'כפתורי outline', prompt: 'שנה את הכפתורים לסגנון outline - רקע שקוף עם מסגרת צבעונית' },
    ],
  },
  {
    category: 'עיצוב כללי',
    icon: '🎨',
    actions: [
      { label: 'הפוך למודרני', prompt: 'שפר את העיצוב הכללי - הוסף gradient רקע, צללים רכים לכרטיסים, ומרווחים נכונים' },
      { label: 'מינימליסטי', prompt: 'הפוך את העיצוב למינימליסטי - הסר צללים מיותרים, צבעים רגועים, הרבה white space' },
      { label: 'הוסף צללים', prompt: 'הוסף box-shadow רך לכל הכרטיסים והרכיבים הראשיים' },
      { label: 'הוסף אנימציות', prompt: 'הוסף אנימציות כניסה (fade-in, slide-up) לרכיבים בעמוד. השתמש ב-CSS keyframes.' },
    ],
  },
  {
    category: 'לייאאוט',
    icon: '📐',
    actions: [
      { label: 'מרכז תוכן', prompt: 'מרכז את כל התוכן הראשי בעמוד עם max-width ו-margin auto' },
      { label: 'הוסף header קבוע', prompt: 'הפוך את ה-header ל-sticky/fixed שנשאר למעלה בזמן גלילה עם backdrop-filter blur' },
      { label: 'עיצוב grid', prompt: 'שנה את התצוגה של הכרטיסים/פריטים ל-CSS Grid רספונסיבי 2-3 עמודות' },
      { label: 'הוסף footer', prompt: 'הוסף footer מעוצב לאפליקציה עם לינקים, לוגו קטן, וטקסט זכויות יוצרים' },
    ],
  },
  {
    category: 'תוכן',
    icon: '📝',
    actions: [
      { label: 'הוסף אייקונים', prompt: 'הוסף אייקוני emoji או SVG מתאימים ליד כל כותרת, כפתור ופריט בתפריט' },
      { label: 'שפר טקסטים', prompt: 'שפר את כל הטקסטים באפליקציה - כותרות ברורות יותר, תיאורים מושכים' },
      { label: 'הוסף תמונות placeholder', prompt: 'הוסף תמונות placeholder מ-unsplash בגדלים מתאימים לכל מקום רלוונטי' },
      { label: 'RTL מלא', prompt: 'ודא שכל האפליקציה ב-RTL מלא - כיוון טקסט, יישור, ו-flex-direction' },
    ],
  },
];

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px'];

const BUTTON_SIZE_PRESETS = [
  { id: 'sm', label: 'S', padding: '6px 12px', fontSize: '12px' },
  { id: 'md', label: 'M', padding: '10px 20px', fontSize: '14px' },
  { id: 'lg', label: 'L', padding: '14px 28px', fontSize: '16px' },
  { id: 'xl', label: 'XL', padding: '18px 36px', fontSize: '18px' },
];

const SHADOW_PRESETS = [
  { id: 'none', label: 'ללא', value: 'none' },
  { id: 'sm', label: 'רך', value: '0 1px 3px rgba(0,0,0,0.12)' },
  { id: 'md', label: 'בינוני', value: '0 4px 12px rgba(0,0,0,0.15)' },
  { id: 'lg', label: 'חזק', value: '0 8px 30px rgba(0,0,0,0.2)' },
  { id: 'glow', label: 'זוהר', value: '0 0 20px rgba(99,102,241,0.4)' },
];

const BORDER_PRESETS = [
  { id: 'none', label: 'ללא', value: 'none' },
  { id: 'thin', label: 'דק', value: '1px solid currentColor' },
  { id: 'medium', label: 'בינוני', value: '2px solid currentColor' },
  { id: 'thick', label: 'עבה', value: '3px solid currentColor' },
];

const TEXT_ALIGN_OPTIONS = [
  { id: 'right', label: 'ימין', icon: '⫦' },
  { id: 'center', label: 'מרכז', icon: '⫰' },
  { id: 'left', label: 'שמאל', icon: '⫧' },
];

const OPACITY_PRESETS = ['1', '0.9', '0.75', '0.5', '0.25'];

const WIDTH_PRESETS = [
  { id: 'auto', label: 'אוטו', value: 'auto' },
  { id: '50', label: '50%', value: '50%' },
  { id: '100', label: '100%', value: '100%' },
  { id: 'fit', label: 'Fit', value: 'fit-content' },
];

const PRESET_SCREENS = [
  { id: 'settings', label: 'הגדרות', icon: '⚙️' },
  { id: 'profile', label: 'פרופיל', icon: '👤' },
  { id: 'about', label: 'אודות', icon: 'ℹ️' },
  { id: 'contact', label: 'צור קשר', icon: '💬' },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function EditSidebar({
  onAIEdit,
  isGenerating,
  screens,
  onNavigate,
  onAddScreen,
  selectedElement,
  onStyleChange,
  onTextChange,
  onDeselect,
}: EditSidebarProps) {
  const [tab, setTab] = useState<SidebarTab>('ai');
  const [aiPrompt, setAIPrompt] = useState('');
  const [text, setText] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>('כפתורים');

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

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Tab bar */}
      <div className="flex border-b border-border bg-surface/80 flex-shrink-0">
        {([
          { id: 'ai' as SidebarTab, label: 'AI עיצוב', icon: '✨' },
          { id: 'layers' as SidebarTab, label: 'שכבות', icon: '◫' },
          { id: 'properties' as SidebarTab, label: 'מאפיינים', icon: '⚙', badge: selectedElement ? '1' : undefined },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 text-[11px] font-medium transition-all relative ${
              tab === t.id
                ? 'text-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
            {t.badge && (
              <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-primary text-white text-[9px] flex items-center justify-center">
                {t.badge}
              </span>
            )}
            {tab === t.id && (
              <div className="absolute bottom-0 inset-x-2 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        {/* ── AI Design tab ──────────────────────────────────────────── */}
        {tab === 'ai' && (
          <div className="flex flex-col gap-3 p-3">
            {/* AI input */}
            <div>
              <label className="text-[10px] text-text-secondary uppercase tracking-wide mb-1 block">בקשת עיצוב AI</label>
              <div className="flex gap-1.5">
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAIPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAISubmit();
                    }
                  }}
                  placeholder="תאר מה לשנות... למשל: &#34;הפוך את הכפתורים לסגנון מודרני עם צללים&#34;"
                  rows={3}
                  className="flex-1 px-3 py-2 rounded-lg bg-surface-2 border border-border text-text-primary text-xs focus:outline-none focus:border-primary resize-none placeholder:text-text-soft"
                />
              </div>
              <button
                onClick={handleAISubmit}
                disabled={!aiPrompt.trim() || isGenerating}
                className={`w-full mt-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isGenerating
                    ? 'bg-primary/20 text-primary/60 cursor-wait'
                    : aiPrompt.trim()
                      ? 'bg-gradient-to-l from-primary to-accent text-white hover:opacity-90 shadow-sm'
                      : 'bg-surface-2 text-text-soft cursor-not-allowed'
                }`}
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    מעצב...
                  </span>
                ) : '✨ החל שינויי עיצוב'}
              </button>
            </div>

            <div className="h-px bg-border" />

            {/* Quick actions by category */}
            <div>
              <label className="text-[10px] text-text-secondary uppercase tracking-wide mb-2 block">פעולות מהירות</label>
              <div className="flex flex-col gap-1">
                {AI_QUICK_ACTIONS.map((cat) => (
                  <div key={cat.category}>
                    <button
                      onClick={() => setExpandedCategory(expandedCategory === cat.category ? null : cat.category)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all ${
                        expandedCategory === cat.category
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span className="flex-1 text-right">{cat.category}</span>
                      <svg
                        className={`w-3 h-3 transition-transform ${expandedCategory === cat.category ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedCategory === cat.category && (
                      <div className="grid grid-cols-1 gap-1 mt-1 pr-4">
                        {cat.actions.map((action) => (
                          <button
                            key={action.label}
                            onClick={() => onAIEdit(action.prompt)}
                            disabled={isGenerating}
                            className="py-1.5 px-2 rounded text-[10px] border border-border text-text-secondary hover:text-text-primary hover:border-primary/30 hover:bg-primary/5 transition-all text-right disabled:opacity-50"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Layers / Screens tab ───────────────────────────────────── */}
        {tab === 'layers' && (
          <div className="flex flex-col h-full">
            <div className="px-3 py-2 border-b border-border/50 flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="text-xs font-semibold text-text-secondary">מסכים ושכבות</span>
            </div>

            <div className="flex-1 overflow-auto py-1">
              {screens.length > 0 ? (
                screens.map((screen) => (
                  <button
                    key={screen.index}
                    onClick={() => onNavigate(screen.index)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-right text-xs transition-all ${
                      screen.active
                        ? 'bg-primary/10 text-primary font-semibold border-r-2 border-primary'
                        : 'text-text-secondary hover:bg-surface hover:text-text-primary'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] flex-shrink-0 ${
                      screen.active ? 'bg-primary text-white' : 'bg-surface-2 text-text-soft'
                    }`}>
                      {screen.index + 1}
                    </div>
                    <span className="truncate">{screen.label}</span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-xs text-text-soft text-center">
                  בנה אפליקציה כדי לראות מסכים
                </div>
              )}
            </div>

            {/* Add screen */}
            <div className="border-t border-border p-2">
              <p className="text-[10px] text-text-soft uppercase tracking-wide mb-1.5 px-1">הוסף מסך</p>
              <div className="grid grid-cols-2 gap-1">
                {PRESET_SCREENS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onAddScreen(`הוסף מסך ${s.label} לאפליקציה`)}
                    className="py-1.5 px-1 rounded text-[10px] border border-border text-text-secondary hover:text-text-primary hover:border-primary/30 transition-all truncate"
                  >
                    {s.icon} {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Properties tab ─────────────────────────────────────────── */}
        {tab === 'properties' && (
          <div className="flex flex-col gap-3 p-3">
            {selectedElement ? (
              <>
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-mono font-bold uppercase">
                      {selectedElement.tag}
                    </div>
                    <span className="text-xs text-text-secondary">עריכת רכיב</span>
                  </div>
                  <button
                    onClick={onDeselect}
                    className="p-1 rounded hover:bg-surface-2 text-text-soft hover:text-text-primary transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Text */}
                {isTextEl && (
                  <div>
                    <label className="text-[10px] text-text-secondary uppercase tracking-wide mb-1 block">טקסט</label>
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onBlur={() => onTextChange(selectedElement.path, text)}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-text-primary text-xs focus:outline-none focus:border-primary resize-none"
                    />
                  </div>
                )}

                {/* Button size presets */}
                {isButton && (
                  <div>
                    <label className="text-[10px] text-text-secondary uppercase tracking-wide mb-1 block">גודל כפתור</label>
                    <div className="flex gap-1">
                      {BUTTON_SIZE_PRESETS.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            onStyleChange(selectedElement.path, 'padding', s.padding);
                            onStyleChange(selectedElement.path, 'fontSize', s.fontSize);
                          }}
                          className="flex-1 py-1.5 rounded text-[10px] border border-border text-text-secondary hover:text-text-primary hover:border-primary/30 transition-all"
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Font Size */}
                {isTextEl && (
                  <div>
                    <label className="text-[10px] text-text-secondary uppercase tracking-wide mb-1 block">גודל טקסט</label>
                    <div className="flex flex-wrap gap-1">
                      {FONT_SIZES.map((size) => (
                        <button
                          key={size}
                          onClick={() => onStyleChange(selectedElement.path, 'fontSize', size)}
                          className={`px-2 py-1 rounded text-[10px] border transition-all ${
                            selectedElement.styles.fontSize === size
                              ? 'border-primary bg-primary/10 text-primary font-semibold'
                              : 'border-border text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          {parseInt(size)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Font Weight */}
                {isTextEl && (
                  <div>
                    <label className="text-[10px] text-text-secondary uppercase tracking-wide mb-1 block">משקל</label>
                    <div className="flex gap-1">
                      {[
                        { id: '400', label: 'רגיל' },
                        { id: '600', label: 'בולט' },
                        { id: '800', label: 'כבד' },
                      ].map((w) => (
                        <button
                          key={w.id}
                          onClick={() => onStyleChange(selectedElement.path, 'fontWeight', w.id)}
                          className={`flex-1 py-1.5 rounded text-[10px] border transition-all ${
                            selectedElement.styles.fontWeight === w.id || (w.id === '400' && parseInt(selectedElement.styles.fontWeight) < 500)
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          {w.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Text Align */}
                {isTextEl && (
                  <div>
                    <label className="text-[10px] text-text-secondary uppercase tracking-wide mb-1 block">יישור טקסט</label>
                    <div className="flex gap-1">
                      {TEXT_ALIGN_OPTIONS.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => onStyleChange(selectedElement.path, 'textAlign', a.id)}
                          className="flex-1 py-1.5 rounded text-[10px] border border-border text-text-secondary hover:text-text-primary hover:border-primary/30 transition-all"
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Colors */}
                <div>
                  <label className="text-[10px] text-text-secondary uppercase tracking-wide mb-1 block">צבעים</label>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center gap-1">
                      <input
                        type="color"
                        defaultValue={rgbToHex(selectedElement.styles.color)}
                        onChange={(e) => onStyleChange(selectedElement.path, 'color', e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border border-border"
                      />
                      <span className="text-[9px] text-text-soft">טקסט</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <input
                        type="color"
                        defaultValue={rgbToHex(selectedElement.styles.backgroundColor)}
                        onChange={(e) => onStyleChange(selectedElement.path, 'backgroundColor', e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border border-border"
                      />
                      <span className="text-[9px] text-text-soft">רקע</span>
                    </div>
                    <button
                      onClick={() => onStyleChange(selectedElement.path, 'backgroundColor', 'transparent')}
                      className="text-[10px] text-text-soft hover:text-red-400 transition-colors border border-border rounded px-2 py-1"
                    >
                      רקע שקוף
                    </button>
                  </div>
                </div>

                {/* Shadow */}
                <div>
                  <label className="text-[10px] text-text-secondary uppercase tracking-wide mb-1 block">צל</label>
                  <div className="flex flex-wrap gap-1">
                    {SHADOW_PRESETS.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => onStyleChange(selectedElement.path, 'boxShadow', s.value)}
                        className="px-2 py-1 rounded text-[10px] border border-border text-text-secondary hover:text-text-primary hover:border-primary/30 transition-all"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Border */}
                <div>
                  <label className="text-[10px] text-text-secondary uppercase tracking-wide mb-1 block">מסגרת</label>
                  <div className="flex gap-1">
                    {BORDER_PRESETS.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => onStyleChange(selectedElement.path, 'border', b.value)}
                        className="flex-1 py-1.5 rounded text-[10px] border border-border text-text-secondary hover:text-text-primary hover:border-primary/30 transition-all"
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Border Radius */}
                <div>
                  <label className="text-[10px] text-text-secondary uppercase tracking-wide mb-1 block">עיגול פינות</label>
                  <div className="flex gap-1">
                    {['0px', '8px', '16px', '24px', '9999px'].map((r) => (
                      <button
                        key={r}
                        onClick={() => onStyleChange(selectedElement.path, 'borderRadius', r)}
                        className={`flex-1 py-1.5 rounded text-[10px] border transition-all ${
                          selectedElement.styles.borderRadius === r
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        {r === '9999px' ? '⬤' : parseInt(r)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Width */}
                <div>
                  <label className="text-[10px] text-text-secondary uppercase tracking-wide mb-1 block">רוחב</label>
                  <div className="flex gap-1">
                    {WIDTH_PRESETS.map((w) => (
                      <button
                        key={w.id}
                        onClick={() => onStyleChange(selectedElement.path, 'width', w.value)}
                        className="flex-1 py-1.5 rounded text-[10px] border border-border text-text-secondary hover:text-text-primary hover:border-primary/30 transition-all"
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Padding */}
                <div>
                  <label className="text-[10px] text-text-secondary uppercase tracking-wide mb-1 block">ריווח פנימי</label>
                  <div className="flex gap-1">
                    {['0px', '4px', '8px', '12px', '16px', '24px'].map((p) => (
                      <button
                        key={p}
                        onClick={() => onStyleChange(selectedElement.path, 'padding', p)}
                        className="flex-1 py-1.5 rounded text-[10px] border border-border text-text-secondary hover:text-text-primary hover:border-primary/30 transition-all"
                      >
                        {parseInt(p)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Opacity */}
                <div>
                  <label className="text-[10px] text-text-secondary uppercase tracking-wide mb-1 block">שקיפות</label>
                  <div className="flex gap-1">
                    {OPACITY_PRESETS.map((o) => (
                      <button
                        key={o}
                        onClick={() => onStyleChange(selectedElement.path, 'opacity', o)}
                        className="flex-1 py-1.5 rounded text-[10px] border border-border text-text-secondary hover:text-text-primary hover:border-primary/30 transition-all"
                      >
                        {Math.round(parseFloat(o) * 100)}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI edit for this element */}
                <div className="border-t border-border pt-3">
                  <label className="text-[10px] text-text-secondary uppercase tracking-wide mb-1 block">✨ AI עיצוב לרכיב</label>
                  <div className="flex flex-wrap gap-1">
                    {isButton ? (
                      <>
                        <button onClick={() => onAIEdit(`שפר את העיצוב של הכפתור "${selectedElement.text}" - הוסף gradient, צל, ואנימציית hover`)} disabled={isGenerating}
                          className="py-1 px-2 rounded text-[10px] border border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 transition-all disabled:opacity-50">
                          שפר כפתור
                        </button>
                        <button onClick={() => onAIEdit(`הוסף אייקון מתאים לכפתור "${selectedElement.text}"`)} disabled={isGenerating}
                          className="py-1 px-2 rounded text-[10px] border border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 transition-all disabled:opacity-50">
                          + אייקון
                        </button>
                        <button onClick={() => onAIEdit(`הפוך את הכפתור "${selectedElement.text}" לסגנון outline עם מסגרת ובלי רקע`)} disabled={isGenerating}
                          className="py-1 px-2 rounded text-[10px] border border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 transition-all disabled:opacity-50">
                          outline
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => onAIEdit(`שפר את העיצוב של ה-${selectedElement.tag} "${selectedElement.text.slice(0, 30)}" - הפוך למרשים יותר`)} disabled={isGenerating}
                          className="py-1 px-2 rounded text-[10px] border border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 transition-all disabled:opacity-50">
                          שפר עיצוב
                        </button>
                        <button onClick={() => onAIEdit(`הוסף אנימציית כניסה לרכיב ה-${selectedElement.tag}`)} disabled={isGenerating}
                          className="py-1 px-2 rounded text-[10px] border border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 transition-all disabled:opacity-50">
                          + אנימציה
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </>
            ) : (
              /* No element selected */
              <div className="flex flex-col items-center justify-center text-center py-8 px-4">
                <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-border flex items-center justify-center text-2xl mb-3">
                  👆
                </div>
                <p className="text-xs text-text-secondary font-medium mb-1">לחץ על רכיב בתצוגה</p>
                <p className="text-[10px] text-text-soft leading-relaxed">
                  לחץ על כפתור, טקסט, או כל רכיב כדי לערוך את המאפיינים שלו
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
