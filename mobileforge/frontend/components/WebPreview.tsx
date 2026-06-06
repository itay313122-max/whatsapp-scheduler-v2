'use client';

import { useState, useCallback } from 'react';

interface WebPreviewProps {
  htmlDoc: string;
  appName?: string;
}

export default function WebPreview({ htmlDoc, appName }: WebPreviewProps) {
  const [loaded, setLoaded] = useState(false);

  const openInNewTab = useCallback(() => {
    const blob = new Blob([htmlDoc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    // Revoke after the browser has time to load
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    win?.focus();
  }, [htmlDoc]);

  return (
    <div className="flex flex-col w-full gap-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <span className="font-medium">{appName || 'Web Preview'}</span>
        </div>

        <button
          onClick={openInNewTab}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-primary hover:border-primary/30 text-xs transition-all"
          title="פתח בטאב חדש"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          פתח בטאב חדש
        </button>
      </div>

      {/* Preview frame */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-border shadow-card bg-white" style={{ height: '600px' }}>
        {/* Loading overlay */}
        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface-2 z-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow animate-pulse-slow">
              <span className="text-white font-display font-bold text-lg">W</span>
            </div>
            <p className="text-text-secondary text-sm">טוען את {appName || 'האתר'}…</p>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        <iframe
          srcDoc={htmlDoc}
          sandbox="allow-scripts"
          title={appName || 'Web Preview'}
          className="w-full h-full"
          style={{ border: 'none', display: 'block' }}
          onLoad={() => setLoaded(true)}
        />
      </div>
    </div>
  );
}
