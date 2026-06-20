'use client';

import { useState, useEffect, useRef } from 'react';
import type { SelectedElement } from './PropertyPanel';

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
      className={`py-2 px-2 rounded-lg text-[11px] font-medium border transition-all duration-150 select-none
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

const PRESET_SCREENS = [
  { id: 'settings', label: 'הגדרות', icon: '⚙️' },
  { id: 'profile', label: 'פרופיל', icon: '👤' },
  { id: 'about', label: 'אודות', icon: 'ℹ️' },
  { id: 'contact', label: 'צור קשר', icon: '💬' },
];

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
      id: 'layers',
      label: 'שכבות',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
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
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-all duration-200 relative
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
          </div>
        )}

        {/* ── Layers / Screens ───────────────────────────────────────── */}
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
                  <OptionGrid cols="grid-cols-5">
                    {['0px', '8px', '16px', '24px', '9999px'].map((r) => (
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
                    {['0px', '4px', '8px', '12px', '16px', '24px'].map((p) => (
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
