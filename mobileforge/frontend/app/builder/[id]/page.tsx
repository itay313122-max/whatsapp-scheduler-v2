'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import ChatInterface from '@/components/ChatInterface';
import WebPreview from '@/components/WebPreview';
import type { PreviewScreen, PreviewSelectedElement } from '@/components/WebPreview';
import CodeViewer from '@/components/CodeViewer';
import EditSidebar from '@/components/EditSidebar';
import type { SelectedElement } from '@/components/PropertyPanel';
import ForgeAssistant from '@/components/ForgeAssistant';
import AssistantToggle from '@/components/AssistantToggle';
import { useAuth } from '@/contexts/AuthContext';
import { getProject, generateApp, shareApp } from '@/lib/api';
import type { GenerateResponse, ProjectContext } from '@/lib/api';
import { saveLocalProject, getLocalProject } from '@/lib/localProjects';
import Link from 'next/link';

const DeviceSync = dynamic(() => import('@/components/DeviceSync'), { ssr: false });

type RightPanel = 'preview' | 'code';
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// ── Rich Edit Panel — data ────────────────────────────────────────────────────

const PALETTES = [
  { id: 'indigo',  label: 'Indigo',   from: '#6366f1', to: '#8b5cf6',
    vars: { '--c-from':'#6366f1','--c-to':'#8b5cf6','--c-primary':'#6366f1','--c-primary-light':'rgba(99,102,241,0.12)' } },
  { id: 'ocean',   label: 'Ocean',    from: '#0284c7', to: '#0ea5e9',
    vars: { '--c-from':'#0284c7','--c-to':'#0ea5e9','--c-primary':'#0284c7','--c-primary-light':'rgba(2,132,199,0.12)' } },
  { id: 'forest',  label: 'Forest',   from: '#15803d', to: '#22c55e',
    vars: { '--c-from':'#15803d','--c-to':'#22c55e','--c-primary':'#15803d','--c-primary-light':'rgba(21,128,61,0.12)' } },
  { id: 'sunset',  label: 'Sunset',   from: '#b45309', to: '#f59e0b',
    vars: { '--c-from':'#b45309','--c-to':'#f59e0b','--c-primary':'#b45309','--c-primary-light':'rgba(180,83,9,0.12)' } },
  { id: 'crimson', label: 'Crimson',  from: '#be123c', to: '#f43f5e',
    vars: { '--c-from':'#be123c','--c-to':'#f43f5e','--c-primary':'#be123c','--c-primary-light':'rgba(190,18,60,0.12)' } },
  { id: 'violet',  label: 'Violet',   from: '#7c3aed', to: '#a855f7',
    vars: { '--c-from':'#7c3aed','--c-to':'#a855f7','--c-primary':'#7c3aed','--c-primary-light':'rgba(124,58,237,0.12)' } },
  { id: 'teal',    label: 'Teal',     from: '#0d9488', to: '#06b6d4',
    vars: { '--c-from':'#0d9488','--c-to':'#06b6d4','--c-primary':'#0d9488','--c-primary-light':'rgba(13,148,136,0.12)' } },
  { id: 'mono',    label: 'Mono',     from: '#374151', to: '#6b7280',
    vars: { '--c-from':'#374151','--c-to':'#6b7280','--c-primary':'#374151','--c-primary-light':'rgba(55,65,81,0.12)' } },
] as const;

type PaletteId = (typeof PALETTES)[number]['id'];

const DARK_VARS: Record<string, string> = {
  '--c-bg':      '#0f172a',
  '--c-surface': '#1e293b',
  '--c-border':  '#334155',
  '--c-text':    '#f8fafc',
  '--c-text-2':  '#94a3b8',
  '--c-text-3':  '#64748b',
};

const FONTS = [
  { id: 'inter',     label: 'Inter',     family: 'Inter, system-ui, sans-serif',     cssValue: "'Inter', system-ui, sans-serif" },
  { id: 'heebo',     label: 'Heebo',     family: 'Heebo, system-ui, sans-serif',     cssValue: "'Heebo', system-ui, sans-serif" },
  { id: 'assistant', label: 'Assistant', family: 'Assistant, system-ui, sans-serif', cssValue: "'Assistant', system-ui, sans-serif" },
  { id: 'rubik',     label: 'Rubik',     family: 'Rubik, system-ui, sans-serif',     cssValue: "'Rubik', system-ui, sans-serif" },
];

const TEXT_SIZES = [
  { id: 'sm', label: 'קטן',   value: '12px' },
  { id: 'md', label: 'בינוני', value: '14px' },
  { id: 'lg', label: 'גדול',  value: '16px' },
];

const BUTTON_STYLES = [
  { id: 'rounded', label: 'עגול',    vars: { '--btn-radius':'16px', '--btn-bg':'linear-gradient(135deg,var(--c-from),var(--c-to))', '--btn-color':'#fff', '--btn-border-width':'0px', '--btn-shadow':'0 4px 14px rgba(0,0,0,0.18)' } },
  { id: 'sharp',   label: 'חד',      vars: { '--btn-radius':'4px',  '--btn-bg':'linear-gradient(135deg,var(--c-from),var(--c-to))', '--btn-color':'#fff', '--btn-border-width':'0px', '--btn-shadow':'0 4px 14px rgba(0,0,0,0.18)' } },
  { id: 'outline', label: 'קו',      vars: { '--btn-radius':'12px', '--btn-bg':'transparent', '--btn-color':'var(--c-primary)', '--btn-border-width':'2px', '--btn-border-color':'var(--c-primary)', '--btn-shadow':'none' } },
  { id: 'soft',    label: 'רך',      vars: { '--btn-radius':'12px', '--btn-bg':'var(--c-primary-light)', '--btn-color':'var(--c-primary)', '--btn-border-width':'0px', '--btn-shadow':'none' } },
];

const CARD_STYLES = [
  { id: 'elevated', label: 'צל',     vars: { '--card-shadow':'0 1px 2px rgba(0,0,0,0.04),0 4px 16px rgba(0,0,0,0.06)', '--card-border':'none' } },
  { id: 'flat',     label: 'שטוח',   vars: { '--card-shadow':'none', '--card-border':'none' } },
  { id: 'bordered', label: 'מסגרת',  vars: { '--card-shadow':'none', '--card-border':'1px solid var(--c-border)' } },
  { id: 'glass',    label: 'זכוכית', vars: { '--card-bg':'rgba(255,255,255,0.72)', '--card-shadow':'0 8px 32px rgba(0,0,0,0.08)', '--card-border':'1px solid rgba(255,255,255,0.6)' } },
];

const RADIUS_PRESETS = [
  { id: 'sharp',  label: 'חד',     vars: { '--r-sm':'4px','--r-md':'6px','--r-lg':'8px','--r-xl':'10px','--btn-radius':'4px','--card-radius':'8px' } },
  { id: 'medium', label: 'בינוני', vars: {} as Record<string, string> },
  { id: 'round',  label: 'עגול',   vars: { '--r-sm':'20px','--r-md':'24px','--r-lg':'28px','--r-xl':'32px','--btn-radius':'24px','--card-radius':'28px' } },
];

const PRESET_SCREENS = [
  { id: 'settings', label: 'הגדרות', icon: '⚙️' },
  { id: 'profile',  label: 'פרופיל',  icon: '👤' },
  { id: 'about',    label: 'אודות',   icon: 'ℹ️' },
  { id: 'contact',  label: 'צור קשר', icon: '💬' },
];

const LANGUAGES = [
  { id: 'he', label: 'עברית' },
  { id: 'en', label: 'English' },
  { id: 'ar', label: 'العربية' },
];

export interface EditSettings {
  paletteId: PaletteId;
  darkMode: boolean;
  fontId: string;
  textSize: string;
  buttonStyle: string;
  cardStyle: string;
  radiusPreset: string;
  accentColor: string;
}

const DEFAULT_SETTINGS: EditSettings = {
  paletteId: 'indigo',
  darkMode: false,
  fontId: 'inter',
  textSize: 'md',
  buttonStyle: 'rounded',
  cardStyle: 'elevated',
  radiusPreset: 'medium',
  accentColor: '',
};

function computeDisplayHtmlDoc(htmlDoc: string, settings: EditSettings): string {
  if (!htmlDoc) return htmlDoc;
  const allVars: Record<string, string> = {};

  const palette = PALETTES.find((p) => p.id === settings.paletteId) ?? PALETTES[0];
  Object.assign(allVars, palette.vars);

  if (settings.accentColor) {
    allVars['--c-from'] = settings.accentColor;
    allVars['--c-to'] = settings.accentColor;
    allVars['--c-primary'] = settings.accentColor;
  }

  if (settings.darkMode) Object.assign(allVars, DARK_VARS);

  if (settings.fontId !== 'inter') {
    const f = FONTS.find((x) => x.id === settings.fontId);
    if (f) allVars['--c-font'] = f.cssValue;
  }

  if (settings.textSize !== 'md') {
    const s = TEXT_SIZES.find((x) => x.id === settings.textSize);
    if (s) allVars['--c-text-size'] = s.value;
  }

  if (settings.buttonStyle !== 'rounded') {
    const b = BUTTON_STYLES.find((x) => x.id === settings.buttonStyle);
    if (b) Object.assign(allVars, b.vars);
  }

  if (settings.cardStyle !== 'elevated') {
    const c = CARD_STYLES.find((x) => x.id === settings.cardStyle);
    if (c) Object.assign(allVars, c.vars);
  }

  if (settings.radiusPreset !== 'medium') {
    const r = RADIUS_PRESETS.find((x) => x.id === settings.radiusPreset);
    if (r && Object.keys(r.vars).length) Object.assign(allVars, r.vars);
  }

  const entries = Object.entries(allVars);
  if (entries.length === 0) return htmlDoc;
  const pairs = JSON.stringify(entries);
  const script = `<script>(function(){var p=${pairs};function a(){var r=document.documentElement;p.forEach(function(x){r.style.setProperty(x[0],x[1]);});}a();setTimeout(a,50);setTimeout(a,300);new MutationObserver(function(){a();}).observe(document.documentElement,{childList:true,subtree:true});})();</script>`;
  return htmlDoc.replace('</head>', script + '\n</head>');
}

// ── Rich Edit Panel ───────────────────────────────────────────────────────────

function RichEditPanel({
  settings,
  onSettings,
  onStructureEdit,
}: {
  settings: EditSettings;
  onSettings: (s: EditSettings) => void;
  onStructureEdit: (prompt: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState('colors');
  const set = <K extends keyof EditSettings>(k: K, v: EditSettings[K]) =>
    onSettings({ ...settings, [k]: v });

  return (
    <div className="border-b border-border bg-surface/80 backdrop-blur-sm flex-shrink-0" dir="rtl">
      {/* ── compact bar ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-1.5 overflow-x-auto">
        {PALETTES.map((p) => (
          <button key={p.id} onClick={() => set('paletteId', p.id as PaletteId)} title={p.label}
            className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all hover:scale-110 ${settings.paletteId === p.id ? 'border-text-primary scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
            style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }} />
        ))}
        <div className="h-4 w-px bg-border flex-shrink-0" />
        <button onClick={() => set('darkMode', !settings.darkMode)}
          className={`px-2 py-0.5 rounded text-xs border flex-shrink-0 transition-all ${settings.darkMode ? 'bg-slate-800 text-slate-200 border-slate-600' : 'text-text-secondary border-border hover:text-text-primary'}`}>
          {settings.darkMode ? '☀️' : '🌙'}
        </button>
        <div className="h-4 w-px bg-border flex-shrink-0" />
        <button onClick={() => setOpen((x) => !x)}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-xs text-text-secondary hover:text-text-primary border border-border transition-all flex-shrink-0">
          ⚙️ עריכה {open ? '▲' : '▼'}
        </button>
      </div>

      {/* ── expanded panel ───────────────────────────────────────────────── */}
      {open && (
        <div className="px-3 pb-3 border-t border-border/50">
          {/* Section tabs */}
          <div className="flex gap-1 pt-2 pb-2 overflow-x-auto">
            {(['colors', 'typography', 'components', 'structure'] as const).map((s) => (
              <button key={s} onClick={() => setSection(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex-shrink-0 ${section === s ? 'bg-primary text-white' : 'text-text-secondary border border-border hover:text-text-primary'}`}>
                {s === 'colors' ? '🎨 צבעים' : s === 'typography' ? 'Aa טיפוגרפיה' : s === 'components' ? '□ רכיבים' : '⊞ מבנה'}
              </button>
            ))}
          </div>

          {/* Colors */}
          {section === 'colors' && (
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-text-secondary uppercase tracking-wide mb-1.5">פלטה</p>
                <div className="flex flex-wrap gap-1.5">
                  {PALETTES.map((p) => (
                    <button key={p.id} onClick={() => set('paletteId', p.id as PaletteId)} title={p.label}
                      className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg border transition-all hover:scale-105 ${settings.paletteId === p.id ? 'border-primary bg-primary/10' : 'border-border'}`}>
                      <div className="w-7 h-7 rounded-md" style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }} />
                      <span className="text-[9px] text-text-secondary leading-none">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-text-secondary uppercase tracking-wide mb-1.5">מצב</p>
                <div className="flex gap-1.5">
                  {[{id:'light',label:'☀️ בהיר'},{id:'dark',label:'🌙 כהה'}].map((m) => (
                    <button key={m.id} onClick={() => set('darkMode', m.id === 'dark')}
                      className={`flex-1 py-1.5 rounded-lg text-xs border transition-all ${(m.id === 'dark') === settings.darkMode ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-secondary hover:text-text-primary'}`}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-text-secondary uppercase tracking-wide mb-1.5">צבע מותאם</p>
                <div className="flex items-center gap-2">
                  <input type="color" value={settings.accentColor || '#6366f1'}
                    onChange={(e) => set('accentColor', e.target.value)}
                    className="w-7 h-7 rounded cursor-pointer border border-border" />
                  <span className="text-xs text-text-secondary">{settings.accentColor || 'ברירת מחדל'}</span>
                  {settings.accentColor && (
                    <button onClick={() => set('accentColor', '')} className="text-xs text-text-secondary hover:text-red-400">✕</button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Typography */}
          {section === 'typography' && (
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-text-secondary uppercase tracking-wide mb-1.5">פונט</p>
                <div className="grid grid-cols-2 gap-1">
                  {FONTS.map((f) => (
                    <button key={f.id} onClick={() => set('fontId', f.id)}
                      className={`py-1.5 px-2 rounded-lg text-sm border transition-all ${settings.fontId === f.id ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-secondary hover:text-text-primary'}`}
                      style={{ fontFamily: f.family }}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-text-secondary uppercase tracking-wide mb-1.5">גודל טקסט</p>
                <div className="flex gap-1">
                  {TEXT_SIZES.map((s) => (
                    <button key={s.id} onClick={() => set('textSize', s.id)}
                      className={`flex-1 py-1.5 rounded-lg text-xs border transition-all ${settings.textSize === s.id ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-secondary'}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Components */}
          {section === 'components' && (
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-text-secondary uppercase tracking-wide mb-1.5">כפתורים</p>
                <div className="grid grid-cols-2 gap-1">
                  {BUTTON_STYLES.map((b) => (
                    <button key={b.id} onClick={() => set('buttonStyle', b.id)}
                      className={`py-1.5 px-2 rounded-lg text-xs border transition-all ${settings.buttonStyle === b.id ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-secondary hover:text-text-primary'}`}>
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-text-secondary uppercase tracking-wide mb-1.5">כרטיסים</p>
                <div className="grid grid-cols-2 gap-1">
                  {CARD_STYLES.map((c) => (
                    <button key={c.id} onClick={() => set('cardStyle', c.id)}
                      className={`py-1.5 px-2 rounded-lg text-xs border transition-all ${settings.cardStyle === c.id ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-secondary hover:text-text-primary'}`}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-text-secondary uppercase tracking-wide mb-1.5">עיגול פינות</p>
                <div className="flex gap-1">
                  {RADIUS_PRESETS.map((r) => (
                    <button key={r.id} onClick={() => set('radiusPreset', r.id)}
                      className={`flex-1 py-1.5 rounded-lg text-xs border transition-all ${settings.radiusPreset === r.id ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-secondary'}`}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Structure */}
          {section === 'structure' && (
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-text-secondary uppercase tracking-wide mb-1.5">הוסף מסך</p>
                <div className="grid grid-cols-2 gap-1">
                  {PRESET_SCREENS.map((s) => (
                    <button key={s.id} onClick={() => onStructureEdit(`הוסף מסך ${s.label} לאפליקציה`)}
                      className="py-1.5 px-2 rounded-lg text-xs border border-border text-text-secondary hover:text-text-primary hover:border-primary/40 transition-all text-right">
                      {s.icon} {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-text-secondary uppercase tracking-wide mb-1.5">שפת ממשק</p>
                <div className="flex gap-1">
                  {LANGUAGES.map((l) => (
                    <button key={l.id} onClick={() => onStructureEdit(`תרגם את כל הטקסט הגלוי באפליקציה ל${l.label}. שמור על כל הלוגיקה, רק תרגם טקסטים. RTL אם ${l.id === 'he' || l.id === 'ar' ? 'כן' : 'לא'}.`)}
                      className="flex-1 py-1.5 rounded-lg text-xs border border-border text-text-secondary hover:text-text-primary hover:border-primary/40 transition-all">
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface Project {
  id: string;
  name: string;
  description?: string;
}

// ── Builder Steps ───────────────────────────────────────────────────────────
type BuilderStep = 'describe' | 'design' | 'customize' | 'publish';

const BUILDER_STEPS: { id: BuilderStep; label: string; icon: string; desc: string }[] = [
  { id: 'describe', label: 'תיאור', icon: '💬', desc: 'תאר את האפליקציה' },
  { id: 'design', label: 'עיצוב', icon: '🎨', desc: 'בחר סגנון עיצוב' },
  { id: 'customize', label: 'התאמה', icon: '✏️', desc: 'ערוך וכוונן רכיבים' },
  { id: 'publish', label: 'פרסום', icon: '🚀', desc: 'שתף והפץ' },
];

function BuilderStepper({ currentStep, onStepClick }: {
  currentStep: BuilderStep;
  onStepClick: (step: BuilderStep) => void;
}) {
  const stepOrder: BuilderStep[] = ['describe', 'design', 'customize', 'publish'];
  const currentIdx = stepOrder.indexOf(currentStep);

  return (
    <div className="flex items-center gap-1 px-4 py-1.5 bg-surface/90 border-b border-border backdrop-blur-xl flex-shrink-0" dir="rtl">
      {BUILDER_STEPS.map((step, i) => {
        const isActive = step.id === currentStep;
        const isDone = i < currentIdx;
        return (
          <div key={step.id} className="flex items-center gap-1 flex-1">
            <button
              onClick={() => onStepClick(step.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium w-full justify-center ${
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-panel'
                  : isDone
                    ? 'text-accent bg-accent/5 border border-accent/15'
                    : 'text-text-soft hover:text-text-secondary hover:bg-surface-2 border border-transparent'
              }`}
            >
              <span className={`text-sm ${isDone ? 'text-accent' : ''}`}>{isDone ? '✓' : step.icon}</span>
              <span className="hidden lg:inline">{step.label}</span>
            </button>
            {i < BUILDER_STEPS.length - 1 && (
              <div className={`w-6 h-px flex-shrink-0 transition-colors duration-300 ${i < currentIdx ? 'bg-accent' : 'bg-border'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Save status indicator ────────────────────────────────────────────────────
function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null;
  return (
    <div className={`flex items-center gap-1.5 text-xs transition-all ${
      status === 'saving' ? 'text-text-secondary' :
      status === 'saved'  ? 'text-accent' :
                            'text-red-400'
    }`}>
      {status === 'saving' && (
        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {status === 'saved' && (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
      {status === 'error' && <span>!</span>}
      <span>{status === 'saving' ? 'שומר…' : status === 'saved' ? 'נשמר ✓' : 'שגיאה בשמירה'}</span>
    </div>
  );
}

// ── Builder content ──────────────────────────────────────────────────────────
function BuilderContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading, isGuest, enterGuestMode } = useAuth();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [currentResult, setCurrentResult] = useState<GenerateResponse | null>(null);
  const [rightPanel, setRightPanel] = useState<RightPanel>('preview');
  const [showDeviceSync, setShowDeviceSync] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [showAssistant, setShowAssistant] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [editSettings, setEditSettings] = useState<EditSettings>(DEFAULT_SETTINGS);
  const [shareStatus, setShareStatus] = useState<'idle' | 'sharing' | 'copied'>('idle');
  const [isGenerating, setIsGenerating] = useState(false);
  const [appScreens, setAppScreens] = useState<PreviewScreen[]>([]);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [builderStep, setBuilderStep] = useState<BuilderStep>('describe');

  // Auth guard — honor the "no registration, start immediately" promise.
  // A first-time visitor who lands on the builder (e.g. typed an idea on the
  // homepage and clicked "build") is auto-entered into guest mode instead of
  // being bounced to /auth and losing their prompt. Sign-in stays optional.
  useEffect(() => {
    if (authLoading) return;
    if (!user && !isGuest) enterGuestMode();
  }, [user, authLoading, isGuest, enterGuestMode]);

  // Load project meta
  useEffect(() => {
    if (authLoading || !user) return;

    const nameParam = searchParams.get('name');
    if (nameParam) {
      setProject({ id: projectId, name: decodeURIComponent(nameParam) });
      return;
    }

    // In guest/demo mode, try to restore from localStorage
    if (isGuest) {
      const local = getLocalProject(projectId);
      if (local) {
        setProject({ id: projectId, name: local.name, description: local.description });
        if (local.htmlDoc && local.appCode) {
          setCurrentResult({
            appName: local.name,
            description: local.description,
            files: { 'App.jsx': local.appCode },
            colorScheme: local.colorScheme || { primary: '#6366f1', background: '#F8F9FA', text: '#1A1A2E' },
            features: local.features || [],
            hebrewSummary: local.description,
            htmlDoc: local.htmlDoc,
            snackId: '', embedUrl: '', shareUrl: '',
          });
          setBuilderStep('customize');
        }
      } else {
        setProject({ id: projectId, name: 'פרויקט חדש' });
      }
      return;
    }

    getProject(projectId)
      .then(setProject)
      .catch(() => setProject({ id: projectId, name: 'פרויקט חדש' }));
  }, [projectId, user, authLoading, isGuest, searchParams]);

  const handleGeneratingChange = useCallback((generating: boolean) => {
    setIsGenerating(generating);
    setSaveStatus(generating ? 'saving' : 'idle');
  }, []);

  const handleAppGenerated = useCallback((result: GenerateResponse) => {
    setCurrentResult(result);
    if (result.htmlDoc || result.embedUrl) setRightPanel('preview');
    saveLocalProject(projectId, result);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 3000);
    if (builderStep === 'describe') setBuilderStep('design');
  }, [projectId, builderStep]);

  // Auto-save on edit settings change (debounced)
  useEffect(() => {
    if (!currentResult) return;
    const timer = setTimeout(() => {
      saveLocalProject(projectId, currentResult);
    }, 2000);
    return () => clearTimeout(timer);
  }, [editSettings, projectId, currentResult]);

  const handleShowPreview = useCallback((result: GenerateResponse) => {
    setCurrentResult(result);
    setRightPanel('preview');
  }, []);

  const handleStructureEdit = useCallback(async (prompt: string) => {
    if (!currentResult) return;
    const existingCode = currentResult.files?.['App.jsx'] ?? currentResult.files?.['App.tsx'] ?? '';
    try {
      const result = await generateApp({ prompt, conversationHistory: [], editMode: true, existingCode });
      handleAppGenerated(result);
    } catch (err) {
      console.error('[Builder] Structure edit failed:', err);
    }
  }, [currentResult, handleAppGenerated]);

  const handleScreensChanged = useCallback((screens: PreviewScreen[]) => {
    setAppScreens(screens);
  }, []);

  const handleElementSelected = useCallback((el: PreviewSelectedElement) => {
    setSelectedElement(el as SelectedElement);
  }, []);

  const handleElementDeselected = useCallback(() => {
    setSelectedElement(null);
  }, []);

  const handleNavigateScreen = useCallback((index: number) => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'mf-navigate', index }, '*');
  }, []);

  const handleStyleChange = useCallback((path: string, property: string, value: string) => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'mf-update-style', path, property, value }, '*');
  }, []);

  const handleTextChange = useCallback((path: string, text: string) => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'mf-update-text', path, text }, '*');
  }, []);

  const handleInsertIcon = useCallback((path: string, icon: string) => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'mf-insert-icon', path, icon }, '*');
  }, []);

  const handleDeselectElement = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'mf-deselect' }, '*');
    setSelectedElement(null);
  }, []);

  const handleAddScreen = useCallback((prompt: string) => {
    handleStructureEdit(prompt);
  }, [handleStructureEdit]);

  const projectContext: ProjectContext = {
    appName: currentResult?.appName,
    description: currentResult?.description,
    currentCode: currentResult?.files?.['App.jsx'] ?? currentResult?.files?.['App.tsx'],
    colorScheme: currentResult?.colorScheme as Record<string, string> | undefined,
    features: currentResult?.features,
  };

  const handleToggleAssistant = useCallback(() => {
    setShowAssistant((prev) => {
      if (!prev) setUnreadCount(0); // clear badge on open
      return !prev;
    });
  }, []);

  // Loading / auth redirecting (allow guest users through)
  if (authLoading || (!user && !isGuest && !authLoading)) {
    return (
      <div className="h-screen bg-bg flex items-center justify-center">
        <div className="flex items-center gap-3 text-text-secondary">
          <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="font-display">טוען…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-bg text-text-primary flex flex-col overflow-hidden" dir="rtl">
      {/* Forge AI assistant */}
      <ForgeAssistant
        isOpen={showAssistant}
        onClose={() => setShowAssistant(false)}
        projectContext={projectContext}
        onNewMessage={() => setUnreadCount((c) => c + 1)}
      />

      {/* Forge AI toggle button */}
      <AssistantToggle
        onClick={handleToggleAssistant}
        isOpen={showAssistant}
        unreadCount={unreadCount}
      />

      {/* DeviceSync modal */}
      {showDeviceSync && currentResult?.snackId && (
        <DeviceSync
          snackId={currentResult.snackId}
          shareUrl={currentResult.shareUrl}
          appName={currentResult.appName}
          onClose={() => setShowDeviceSync(false)}
        />
      )}

      {/* Top bar */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface/90 backdrop-blur-xl z-40">
        {/* Left side */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-primary flex items-center justify-center">
              <span className="text-white font-bold text-xs">M</span>
            </div>
            <span className="font-display font-semibold text-sm truncate max-w-[160px]">
              {project?.name || 'טוען…'}
            </span>
          </div>
          <SaveIndicator status={saveStatus} />
        </div>

        {/* Right side — Share & Export */}
        <div className="flex items-center gap-2">
          {currentResult && currentResult.htmlDoc && (
            <>
              {/* Share button */}
              <button
                onClick={async () => {
                  if (shareStatus !== 'idle') return;
                  setShareStatus('sharing');
                  try {
                    const { shareUrl } = await shareApp(currentResult.htmlDoc, currentResult.appName);
                    await navigator.clipboard.writeText(shareUrl);
                    setShareStatus('copied');
                    setTimeout(() => setShareStatus('idle'), 3000);
                  } catch { setShareStatus('idle'); }
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 text-xs font-medium transition-all"
              >
                {shareStatus === 'sharing' ? (
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : shareStatus === 'copied' ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                )}
                <span className="hidden sm:inline">{shareStatus === 'copied' ? 'הועתק!' : 'שתף לינק'}</span>
                <span className="sm:hidden">{shareStatus === 'copied' ? '✓' : 'שתף'}</span>
              </button>

              {/* Download HTML */}
              <button
                onClick={() => {
                  const blob = new Blob([currentResult.htmlDoc], { type: 'text/html' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${currentResult.appName || 'app'}.html`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-primary/30 text-xs font-medium transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className="hidden sm:inline">הורד</span>
              </button>

              {/* Install as PWA */}
              <button
                onClick={async () => {
                  try {
                    const { id } = await shareApp(currentResult.htmlDoc, currentResult.appName);
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                    window.open(`${apiUrl}/api/share/${id}/pwa`, '_blank');
                  } catch { /* ignore */ }
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 text-xs font-medium transition-all"
                title="הורד כאפליקציית PWA להתקנה על טלפון"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">התקן PWA</span>
                <span className="sm:hidden">PWA</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main layout — resizable panels */}
      <PanelGroup orientation="horizontal" className="flex-1 overflow-hidden">
        {/* Chat panel */}
        <Panel
          id="chat"
          defaultSize="30%"
          minSize="20%"
          maxSize={currentResult ? '60%' : '100%'}
          className="flex flex-col border-l border-border overflow-hidden"
        >
          <ChatInterface
            projectId={projectId}
            initialPrompt={searchParams.get('prompt') || undefined}
            currentAppResult={currentResult}
            onAppGenerated={handleAppGenerated}
            onShowPreview={handleShowPreview}
            onGeneratingChange={handleGeneratingChange}
          />
        </Panel>

        {/* Resize handle */}
        {currentResult && (
          <PanelResizeHandle className="hidden md:block" />
        )}

        {/* Right panel */}
        {currentResult && (
          <Panel id="preview" defaultSize="70%" minSize="40%" className="hidden md:flex flex-col overflow-hidden bg-surface/30">
            {/* Builder progress stepper */}
            <BuilderStepper
              currentStep={builderStep}
              onStepClick={(step) => {
                setBuilderStep(step);
                if (step === 'publish') setRightPanel('preview');
              }}
            />

            {/* Preview / Code tabs */}
            <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border bg-surface/80 backdrop-blur-sm flex-shrink-0">
              <button
                onClick={() => setRightPanel('preview')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${rightPanel === 'preview' ? 'bg-primary/10 text-primary shadow-panel' : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                תצוגה מקדימה
              </button>
              <button
                onClick={() => setRightPanel('code')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${rightPanel === 'code' ? 'bg-primary/10 text-primary shadow-panel' : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                </svg>
                קוד
              </button>
            </div>

            {rightPanel === 'preview' && (
              <>
                <RichEditPanel
                  settings={editSettings}
                  onSettings={setEditSettings}
                  onStructureEdit={handleStructureEdit}
                />
                {(currentResult.htmlDoc || currentResult.embedUrl) ? (
                  <div className="flex-1 flex overflow-hidden">
                    {/* Preview area */}
                    <div className="flex-1 overflow-auto flex items-start justify-center p-6 bg-gradient-radial from-primary/5 via-bg to-bg">
                      <WebPreview
                        key={currentResult.htmlDoc ? currentResult.htmlDoc.slice(0, 80) : currentResult.embedUrl}
                        htmlDoc={computeDisplayHtmlDoc(currentResult.htmlDoc || '', editSettings)}
                        appName={currentResult.appName}
                        refreshKey={JSON.stringify(editSettings)}
                        onScreensChanged={handleScreensChanged}
                        onElementSelected={handleElementSelected}
                        onElementDeselected={handleElementDeselected}
                        iframeRef={iframeRef}
                      />
                    </div>

                    {/* Edit Sidebar — AI design, layers, properties */}
                    <div className="w-[280px] flex-shrink-0 border-r border-border bg-surface/60 overflow-hidden">
                      <EditSidebar
                        onAIEdit={handleStructureEdit}
                        isGenerating={isGenerating}
                        appName={currentResult.appName}
                        screens={appScreens}
                        onNavigate={handleNavigateScreen}
                        onAddScreen={handleAddScreen}
                        selectedElement={selectedElement}
                        onStyleChange={handleStyleChange}
                        onTextChange={handleTextChange}
                        onInsertIcon={handleInsertIcon}
                        onDeselect={handleDeselectElement}
                      />
                    </div>
                  </div>
                ) : null}
              </>
            )}

            {rightPanel === 'code' && (
              <div className="flex-1 overflow-hidden p-4">
                <CodeViewer
                  files={currentResult.files}
                  appName={currentResult.appName}
                />
              </div>
            )}
          </Panel>
        )}

        {/* Empty state */}
        {!currentResult && (
          <Panel id="empty" defaultSize="70%" minSize="40%" className="hidden md:flex items-center justify-center text-text-secondary bg-surface/10">
            <div className="text-center max-w-xs">
              <div className="w-20 h-20 rounded-2xl bg-surface border border-border flex items-center justify-center text-4xl mx-auto mb-4 hover-lift">
                💬
              </div>
              <h3 className="font-display font-semibold text-text-primary mb-2">תאר את האפליקציה</h3>
              <p className="text-sm leading-relaxed">
                כתוב, העלה צילום מסך, צייר סקיצה, או דבר — AI יבנה ויציג את הקוד כאן
              </p>
            </div>
          </Panel>
        )}
      </PanelGroup>
    </div>
  );
}

export default function BuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen bg-bg flex items-center justify-center">
          <div className="flex items-center gap-3 text-text-secondary">
            <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="font-display">טוען MobileForge…</span>
          </div>
        </div>
      }
    >
      <BuilderContent />
    </Suspense>
  );
}
