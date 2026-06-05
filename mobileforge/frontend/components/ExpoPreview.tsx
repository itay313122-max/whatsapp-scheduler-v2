'use client';

import { useState } from 'react';

interface ExpoPreviewProps {
  embedUrl: string;
  shareUrl?: string;
  appName?: string;
}

export default function ExpoPreview({ embedUrl, shareUrl, appName }: ExpoPreviewProps) {
  const [platform, setPlatform] = useState<'web' | 'ios' | 'android'>('web');
  const [loaded, setLoaded] = useState(false);

  const platformUrl = embedUrl.replace(
    /platform=\w+/,
    `platform=${platform}`
  );

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Platform selector */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-surface border border-border">
        {(['web', 'ios', 'android'] as const).map((p) => (
          <button
            key={p}
            onClick={() => { setPlatform(p); setLoaded(false); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              platform === p
                ? 'bg-primary text-white shadow-glow'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {p === 'web' ? '🌐 Web' : p === 'ios' ? '🍎 iOS' : '🤖 Android'}
          </button>
        ))}
      </div>

      {/* Phone frame */}
      <div className="phone-frame">
        {!loaded && (
          <div className="absolute inset-3 rounded-3xl flex flex-col items-center justify-center gap-3 bg-surface-2 z-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow animate-pulse-slow">
              <span className="text-white font-display font-bold text-lg">M</span>
            </div>
            <p className="text-text-secondary text-xs">טוען את {appName || 'האפליקציה'}…</p>
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
          src={platformUrl}
          style={{
            width: '375px',
            height: '812px',
            borderRadius: '30px',
            border: 'none',
            display: 'block',
          }}
          allow="geolocation; camera; microphone"
          onLoad={() => setLoaded(true)}
          title={appName || 'App Preview'}
          sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
        />
      </div>

      {/* Share link */}
      {shareUrl && (
        <a
          href={shareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-text-secondary hover:text-accent hover:border-accent text-sm transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          פתח ב-Expo Snack
        </a>
      )}
    </div>
  );
}
