'use client';

import { Suspense, useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import ChatInterface from '@/components/ChatInterface';
import ExpoPreview from '@/components/ExpoPreview';
import CodeViewer from '@/components/CodeViewer';
import { onAuthChange } from '@/lib/firebase';
import { getProject } from '@/lib/api';
import type { GenerateResponse } from '@/lib/api';
import Link from 'next/link';

type RightPanel = 'preview' | 'code' | null;

interface Project {
  id: string;
  name: string;
  description?: string;
}

function BuilderContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [currentResult, setCurrentResult] = useState<GenerateResponse | null>(null);
  const [rightPanel, setRightPanel] = useState<RightPanel>('preview');
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthChange(() => setAuthReady(true));
    return unsub;
  }, []);

  useEffect(() => {
    if (!authReady) return;

    const nameParam = searchParams.get('name');
    if (nameParam) {
      setProject({ id: projectId, name: decodeURIComponent(nameParam) });
      return;
    }

    getProject(projectId)
      .then(setProject)
      .catch(() => {
        setProject({ id: projectId, name: 'פרויקט חדש' });
      });
  }, [projectId, authReady, searchParams]);

  function handleAppGenerated(result: GenerateResponse) {
    setCurrentResult(result);
    if (result.embedUrl) setRightPanel('preview');
  }

  function handleShowPreview(result: GenerateResponse) {
    setCurrentResult(result);
    setRightPanel('preview');
  }

  function handleShowCode(result: GenerateResponse) {
    setCurrentResult(result);
    setRightPanel('code');
  }

  return (
    <div className="h-screen bg-bg text-text-primary flex flex-col overflow-hidden" dir="rtl">
      {/* Top bar */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border bg-surface/80 backdrop-blur-lg z-40">
        {/* Left: Nav */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </Link>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-primary flex items-center justify-center">
              <span className="text-white font-bold text-xs">M</span>
            </div>
            <span className="font-display font-semibold text-sm">
              {project?.name || 'טוען…'}
            </span>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          {currentResult && (
            <>
              <div className="hidden sm:flex items-center gap-1 p-1 rounded-lg bg-surface border border-border">
                <button
                  onClick={() => setRightPanel('preview')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    rightPanel === 'preview'
                      ? 'bg-primary text-white'
                      : 'text-text-secondary hover:text-text-primary'
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
                    rightPanel === 'code'
                      ? 'bg-primary text-white'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  Code
                </button>
              </div>

              {currentResult.shareUrl && (
                <a
                  href={currentResult.shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-text-secondary hover:text-accent hover:border-accent text-xs transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  שתף
                </a>
              )}
            </>
          )}
        </div>
      </header>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat panel */}
        <div className={`flex flex-col ${currentResult ? 'w-full md:w-[420px] md:flex-shrink-0' : 'flex-1'} border-l border-border overflow-hidden`}>
          <ChatInterface
            projectId={projectId}
            onAppGenerated={handleAppGenerated}
            onShowPreview={handleShowPreview}
            onShowCode={handleShowCode}
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
            ) : (
              <div className="flex-1 flex items-center justify-center text-text-secondary">
                <div className="text-center">
                  <div className="text-5xl mb-4">📱</div>
                  <p className="text-sm">תאר אפליקציה בצ&apos;אט כדי לראות preview כאן</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state when no result */}
        {!currentResult && (
          <div className="hidden md:flex flex-1 items-center justify-center text-text-secondary bg-surface/10">
            <div className="text-center max-w-xs">
              <div className="w-20 h-20 rounded-2xl bg-surface border border-border flex items-center justify-center text-4xl mx-auto mb-4">
                💬
              </div>
              <h3 className="font-display font-semibold text-text-primary mb-2">תאר את האפליקציה</h3>
              <p className="text-sm leading-relaxed">
                כתוב בצ&apos;אט מה אתה רוצה לבנות, ואני אייצר קוד Expo מלא ואציג אותו כאן
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
    <Suspense fallback={
      <div className="h-screen bg-bg flex items-center justify-center">
        <div className="flex items-center gap-3 text-text-secondary">
          <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="font-display">טוען MobileForge…</span>
        </div>
      </div>
    }>
      <BuilderContent />
    </Suspense>
  );
}
