'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import ChatInterface from '@/components/ChatInterface';
import WebPreview from '@/components/WebPreview';
import ForgeAssistant from '@/components/ForgeAssistant';
import AssistantToggle from '@/components/AssistantToggle';
import { useAuth } from '@/contexts/AuthContext';
import { getProject } from '@/lib/api';
import type { GenerateResponse, ProjectContext } from '@/lib/api';
import Link from 'next/link';

const DeviceSync = dynamic(() => import('@/components/DeviceSync'), { ssr: false });

type RightPanel = 'preview';
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// ── Palette quick-edit ───────────────────────────────────────────────────────

const PALETTES = [
  { id: 'default', label: 'ברירת מחדל', from: '#6366f1', to: '#8b5cf6',
    vars: {} as Record<string, string> },
  { id: 'green',   label: 'ירוק',       from: '#16a34a', to: '#22c55e',
    vars: { '--c-from': '#16a34a', '--c-to': '#22c55e', '--c-primary': '#16a34a', '--c-primary-light': 'rgba(22,163,74,0.12)' } },
  { id: 'orange',  label: 'כתום',       from: '#ea580c', to: '#f97316',
    vars: { '--c-from': '#ea580c', '--c-to': '#f97316', '--c-primary': '#ea580c', '--c-primary-light': 'rgba(234,88,12,0.12)' } },
  { id: 'pink',    label: 'ורוד',       from: '#be185d', to: '#ec4899',
    vars: { '--c-from': '#be185d', '--c-to': '#ec4899', '--c-primary': '#be185d', '--c-primary-light': 'rgba(190,24,93,0.12)' } },
  { id: 'teal',    label: 'טורקיז',     from: '#0d9488', to: '#14b8a6',
    vars: { '--c-from': '#0d9488', '--c-to': '#14b8a6', '--c-primary': '#0d9488', '--c-primary-light': 'rgba(13,148,136,0.12)' } },
];

const DARK_VARS: Record<string, string> = {
  '--c-bg':      '#0f172a',
  '--c-surface': '#1e293b',
  '--c-border':  '#334155',
  '--c-text':    '#f8fafc',
  '--c-text-2':  '#94a3b8',
  '--c-text-3':  '#64748b',
};

function computeDisplayHtmlDoc(htmlDoc: string, paletteId: string, darkMode: boolean): string {
  if (!htmlDoc) return htmlDoc;
  const palette = PALETTES.find((p) => p.id === paletteId) ?? PALETTES[0];
  const allVars: Record<string, string> = { ...palette.vars, ...(darkMode ? DARK_VARS : {}) };
  const entries = Object.entries(allVars);
  if (entries.length === 0) return htmlDoc;
  const pairs = JSON.stringify(entries);
  const script = `<script>(function(){var p=${pairs};function a(){var r=document.documentElement;p.forEach(function(x){r.style.setProperty(x[0],x[1]);});}a();setTimeout(a,50);setTimeout(a,300);new MutationObserver(function(){a();}).observe(document.documentElement,{childList:true,subtree:true});})();</script>`;
  return htmlDoc.replace('</head>', script + '\n</head>');
}

function QuickEditPanel({
  paletteId,
  onPaletteChange,
  darkMode,
  onDarkModeChange,
}: {
  paletteId: string;
  onPaletteChange: (id: string) => void;
  darkMode: boolean;
  onDarkModeChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-surface/60 backdrop-blur-sm flex-shrink-0" dir="rtl">
      <span className="text-text-secondary text-xs font-medium flex-shrink-0">ערכת צבעים:</span>
      <div className="flex items-center gap-1.5">
        {PALETTES.map((p) => (
          <button
            key={p.id}
            onClick={() => onPaletteChange(p.id)}
            title={p.label}
            className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${
              paletteId === p.id ? 'border-text-primary scale-110 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
            }`}
            style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}
          />
        ))}
      </div>
      <div className="h-4 w-px bg-border mx-1 flex-shrink-0" />
      <button
        onClick={() => onDarkModeChange(!darkMode)}
        title={darkMode ? 'עבור למצב בהיר' : 'עבור למצב כהה'}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all border flex-shrink-0 ${
          darkMode
            ? 'bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700'
            : 'bg-surface-2 text-text-secondary border-border hover:text-text-primary'
        }`}
      >
        {darkMode ? '☀️' : '🌙'} {darkMode ? 'בהיר' : 'כהה'}
      </button>
    </div>
  );
}

interface Project {
  id: string;
  name: string;
  description?: string;
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
  const { user, loading: authLoading } = useAuth();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [currentResult, setCurrentResult] = useState<GenerateResponse | null>(null);
  const [rightPanel, setRightPanel] = useState<RightPanel>('preview');
  const [showDeviceSync, setShowDeviceSync] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [showAssistant, setShowAssistant] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [paletteId, setPaletteId] = useState('default');
  const [darkMode, setDarkMode] = useState(false);

  // Auth guard
  useEffect(() => {
    if (authLoading) return;
    if (!user) router.push('/auth');
  }, [user, authLoading, router]);

  // Load project meta
  useEffect(() => {
    if (authLoading || !user) return;

    const nameParam = searchParams.get('name');
    if (nameParam) {
      setProject({ id: projectId, name: decodeURIComponent(nameParam) });
      return;
    }

    getProject(projectId)
      .then(setProject)
      .catch(() => setProject({ id: projectId, name: 'פרויקט חדש' }));
  }, [projectId, user, authLoading, searchParams]);

  const handleGeneratingChange = useCallback((isGenerating: boolean) => {
    setSaveStatus(isGenerating ? 'saving' : 'idle');
  }, []);

  const handleAppGenerated = useCallback((result: GenerateResponse) => {
    setCurrentResult(result);
    if (result.htmlDoc || result.embedUrl) setRightPanel('preview');
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 3000);
  }, []);

  const handleShowPreview = useCallback((result: GenerateResponse) => {
    setCurrentResult(result);
    setRightPanel('preview');
  }, []);

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

  // Loading / auth redirecting
  if (authLoading || (!user && !authLoading)) {
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
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border bg-surface/80 backdrop-blur-lg z-40">
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

        {/* Right side */}
        <div className="flex items-center gap-2">
          {currentResult && (
            <>
              {/* Preview indicator */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18.5l-7-4.5V8.5L12 4l7 4.5v5.5L12 18.5z" />
                </svg>
                Preview
              </div>

              {/* Open on phone */}
              {currentResult.snackId && (
                <button
                  onClick={() => setShowDeviceSync(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 text-xs font-medium transition-all"
                  title="פתח בטלפון עם Expo Go"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="hidden sm:inline">פתח בטלפון</span>
                  <span className="sm:hidden">QR</span>
                </button>
              )}

              {/* Share link */}
              {currentResult.shareUrl && (
                <a
                  href={currentResult.shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-primary/30 text-xs transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span className="hidden sm:inline">שתף</span>
                </a>
              )}
            </>
          )}
        </div>
      </header>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat panel */}
        <div
          className={`flex flex-col border-l border-border overflow-hidden ${
            currentResult ? 'w-full md:w-[420px] md:flex-shrink-0' : 'flex-1'
          }`}
        >
          <ChatInterface
            projectId={projectId}
            onAppGenerated={handleAppGenerated}
            onShowPreview={handleShowPreview}
            onGeneratingChange={handleGeneratingChange}
          />
        </div>

        {/* Right panel */}
        {currentResult && (
          <div className="hidden md:flex flex-1 flex-col overflow-hidden bg-surface/30">
            <QuickEditPanel
              paletteId={paletteId}
              onPaletteChange={setPaletteId}
              darkMode={darkMode}
              onDarkModeChange={setDarkMode}
            />
            {(currentResult.htmlDoc || currentResult.embedUrl) ? (
              <div className="flex-1 overflow-auto flex items-start justify-center p-6 bg-gradient-radial from-primary/5 via-bg to-bg">
                <WebPreview
                  key={currentResult.htmlDoc ? currentResult.htmlDoc.slice(0, 80) : currentResult.embedUrl}
                  htmlDoc={computeDisplayHtmlDoc(currentResult.htmlDoc || '', paletteId, darkMode)}
                  appName={currentResult.appName}
                  refreshKey={`${paletteId}-${darkMode}`}
                />
              </div>
            ) : null}
          </div>
        )}

        {/* Empty state */}
        {!currentResult && (
          <div className="hidden md:flex flex-1 items-center justify-center text-text-secondary bg-surface/10">
            <div className="text-center max-w-xs">
              <div className="w-20 h-20 rounded-2xl bg-surface border border-border flex items-center justify-center text-4xl mx-auto mb-4">
                💬
              </div>
              <h3 className="font-display font-semibold text-text-primary mb-2">תאר את האפליקציה</h3>
              <p className="text-sm leading-relaxed">
                כתוב, העלה צילום מסך, צייר סקיצה, או דבר — AI יבנה ויציג את הקוד כאן
              </p>
            </div>
          </div>
        )}
      </div>
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
