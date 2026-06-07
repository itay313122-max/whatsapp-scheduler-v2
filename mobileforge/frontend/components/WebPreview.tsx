'use client';

import { useState, useCallback, useEffect } from 'react';

interface WebPreviewProps {
  htmlDoc: string;
  appName?: string;
}

type ViewMode = 'mobile' | 'desktop';

export default function WebPreview({ htmlDoc, appName }: WebPreviewProps) {
  const [loaded, setLoaded] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('mobile');

  useEffect(() => {
    console.log('[WebPreview] htmlDoc length:', htmlDoc?.length ?? 0, '| first 80:', htmlDoc?.slice(0, 80));
  }, [htmlDoc]);

  const openInNewTab = useCallback(() => {
    const blob = new Blob([htmlDoc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank')?.focus();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }, [htmlDoc]);

  const isMobile = viewMode === 'mobile';

  return (
    <div className="flex flex-col w-full gap-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-1">
        {/* View mode toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-2 border border-border">
          <button
            onClick={() => { setViewMode('mobile'); setLoaded(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isMobile ? 'bg-gradient-primary text-white shadow-glow' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            מובייל
          </button>
          <button
            onClick={() => { setViewMode('desktop'); setLoaded(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              !isMobile ? 'bg-gradient-primary text-white shadow-glow' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            דסקטופ
          </button>
        </div>

        {/* Open in new tab */}
        <button
          onClick={openInNewTab}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-primary hover:border-primary/30 text-xs transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          פתח בטאב
        </button>
      </div>

      {/* Preview area */}
      <div className={`flex ${isMobile ? 'items-start justify-center' : 'w-full'}`}
           style={{ minHeight: '680px' }}>
        {isMobile ? (
          /* ── Phone frame ── */
          <div className="relative flex-shrink-0" style={{ width: 390 }}>
            {/* Outer phone shell */}
            <div
              className="relative bg-gray-900 shadow-2xl"
              style={{
                borderRadius: 44,
                padding: '12px 8px',
                boxShadow: '0 0 0 2px #1a1a1a, 0 32px 64px rgba(0,0,0,0.45), 0 8px 24px rgba(0,0,0,0.3)',
              }}
            >
              {/* Dynamic island */}
              <div
                className="absolute left-1/2 bg-black z-20"
                style={{ top: 16, transform: 'translateX(-50%)', width: 120, height: 34, borderRadius: 20 }}
              />

              {/* Screen */}
              <div
                className="relative overflow-hidden bg-gray-100"
                style={{ borderRadius: 36, height: 720 }}
              >
                {/* Loading overlay */}
                {!loaded && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface-2 z-10">
                    <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow animate-pulse-slow">
                      <span className="text-white font-display font-bold text-lg">W</span>
                    </div>
                    <p className="text-text-secondary text-sm">טוען את {appName || 'האפליקציה'}…</p>
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="w-2 h-2 rounded-full bg-primary animate-bounce"
                             style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                )}
                <iframe
                  key={`mobile-${htmlDoc.slice(0, 40)}`}
                  srcDoc={htmlDoc}
                  sandbox="allow-scripts"
                  title={appName || 'App Preview'}
                  className="w-full h-full"
                  style={{ border: 'none', display: 'block' }}
                  onLoad={() => setLoaded(true)}
                />
              </div>

              {/* Home indicator */}
              <div className="flex justify-center pt-2 pb-0.5">
                <div className="w-28 h-1 bg-gray-600 rounded-full" />
              </div>
            </div>
          </div>
        ) : (
          /* ── Desktop frame ── */
          <div className="relative w-full rounded-2xl overflow-hidden border border-border shadow-card bg-white" style={{ height: 680 }}>
            {/* Loading overlay */}
            {!loaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface-2 z-10">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow animate-pulse-slow">
                  <span className="text-white font-display font-bold text-lg">W</span>
                </div>
                <p className="text-text-secondary text-sm">טוען…</p>
              </div>
            )}
            <iframe
              key={`desktop-${htmlDoc.slice(0, 40)}`}
              srcDoc={htmlDoc}
              sandbox="allow-scripts"
              title={appName || 'Web Preview'}
              className="w-full h-full"
              style={{ border: 'none', display: 'block' }}
              onLoad={() => setLoaded(true)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
