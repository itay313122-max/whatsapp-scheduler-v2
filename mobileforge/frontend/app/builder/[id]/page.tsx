'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import ChatInterface from '@/components/ChatInterface';
import ExpoPreview from '@/components/ExpoPreview';
import CodeViewer from '@/components/CodeViewer';
import { useAuth } from '@/contexts/AuthContext';
import { getProject } from '@/lib/api';
import type { GenerateResponse } from '@/lib/api';
import Link from 'next/link';

const DeviceSync = dynamic(() => import('@/components/DeviceSync'), { ssr: false });

type RightPanel = 'preview' | 'code';
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

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
    if (result.embedUrl) setRightPanel('preview');
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 3000);
  }, []);

  const handleShowPreview = useCallback((result: GenerateResponse) => {
    setCurrentResult(result);
    setRightPanel('preview');
  }, []);

  const handleShowCode = useCallback((result: GenerateResponse) => {
    setCurrentResult(result);
    setRightPanel('code');
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
              {/* Panel toggle */}
              <div className="hidden sm:flex items-center gap-1 p-1 rounded-lg bg-surface border border-border">
                <button
                  onClick={() => setRightPanel('preview')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    rightPanel === 'preview' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18.5l-7-4.5V8.5L12 4l7 4.5v5.5L12 18.5z" />
                  </svg>
                  Preview
                </button>
                <button
                  onClick={() => setRightPanel('code')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    rightPanel === 'code' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  Code
                </button>
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
            onShowCode={handleShowCode}
            onGeneratingChange={handleGeneratingChange}
          />
        </div>

        {/* Right panel */}
        {currentResult && (
          <div className="hidden md:flex flex-1 flex-col overflow-hidden bg-surface/30">
            {rightPanel === 'preview' && currentResult.embedUrl ? (
              <div className="flex-1 overflow-auto flex items-start justify-center p-6 bg-gradient-radial from-primary/5 via-bg to-bg">
                <ExpoPreview
                  embedUrl={currentResult.embedUrl}
                  shareUrl={currentResult.shareUrl}
                  appName={currentResult.appName}
                />
              </div>
            ) : rightPanel === 'code' && currentResult.files ? (
              <div className="flex-1 overflow-hidden p-4">
                <CodeViewer files={currentResult.files} appName={currentResult.appName} />
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
