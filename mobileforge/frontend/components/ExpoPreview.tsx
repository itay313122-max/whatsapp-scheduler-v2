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

  // Swap the platform param in the URL; ensure preview=true is always present
  const platformUrl = (() => {
    let url = embedUrl.replace(/platform=[^&]+/, `platform=${platform}`);
    if (!url.includes('preview=')) url += '&preview=true';
    if (!url.includes('supportedPlatforms=')) url += '&supportedPlatforms=web,ios,android';
    return url;
  })();

  return (
    <div className="flex flex-col w-full gap-3">
      {/* Header row */}
      <div className="flex items-center justify-between px-1">
        {/* Platform selector */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-2 border border-border">
          {(['web', 'ios', 'android'] as const).map((p) => (
            <button
              key={p}
              onClick={() => { setPlatform(p); setLoaded(false); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                platform === p
                  ? 'bg-gradient-primary text-white shadow-glow'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {p === 'web' ? '🌐 Web' : p === 'ios' ? '🍎 iOS' : '🤖 Android'}
            </button>
          ))}
        </div>

        {/* Share link */}
        {shareUrl && (
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-primary hover:border-primary/30 text-xs transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Expo Snack
          </a>
        )}
      </div>

      {/* Embed container — full width, tall enough for Snack's editor+preview split */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-border shadow-card" style={{ height: '580px' }}>
        {/* Loading overlay */}
        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface-2 z-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow animate-pulse-slow">
              <span className="text-white font-display font-bold text-lg">M</span>
            </div>
            <p className="text-text-secondary text-sm">Loading {appName || 'your app'}…</p>
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
          className="w-full h-full"
          style={{ border: 'none', display: 'block' }}
          allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone"
          onLoad={() => setLoaded(true)}
          title={appName || 'App Preview'}
          sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
        />
      </div>
    </div>
  );
}
