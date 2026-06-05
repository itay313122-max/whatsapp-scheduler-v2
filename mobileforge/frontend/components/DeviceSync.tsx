'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface DeviceSyncProps {
  snackId: string;
  shareUrl: string;
  appName?: string;
  onClose: () => void;
}

// Expo Go deep-link for a given snack
function expoGoUrl(snackId: string) {
  return `exp://exp.host/@snack/${snackId}`;
}

export default function DeviceSync({ snackId, shareUrl, appName, onClose }: DeviceSyncProps) {
  const [copied, setCopied] = useState<'expo' | 'web' | null>(null);
  const [tab, setTab] = useState<'qr' | 'manual'>('qr');

  const deepLink = expoGoUrl(snackId);

  async function copyUrl(url: string, which: 'expo' | 'web') {
    await navigator.clipboard.writeText(url);
    setCopied(which);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      dir="rtl"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm bg-surface border border-border rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-display font-semibold text-sm">פתח בטלפון</h3>
              <p className="text-text-secondary text-xs">{appName || 'האפליקציה שלך'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface flex items-center justify-center transition-all text-sm"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-1 mx-4 mt-4 rounded-xl bg-surface-2 border border-border">
          {(['qr', 'manual'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                tab === t ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {t === 'qr' ? '📱 QR Code' : '🔗 לינק ידני'}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4">
          {tab === 'qr' ? (
            <>
              {/* QR Code */}
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-white rounded-2xl shadow-lg">
                  <QRCodeSVG
                    value={deepLink}
                    size={180}
                    bgColor="#ffffff"
                    fgColor="#0A0A0F"
                    level="M"
                    includeMargin={false}
                  />
                </div>

                <div className="text-center">
                  <p className="text-text-primary text-sm font-medium mb-1">
                    סרוק עם Expo Go
                  </p>
                  <p className="text-text-secondary text-xs leading-relaxed">
                    פתח את Expo Go בטלפון → לחץ &quot;Scan QR Code&quot; → סרוק
                  </p>
                </div>
              </div>

              {/* Step instructions */}
              <div className="space-y-2">
                {[
                  { step: '1', text: 'הורד Expo Go לטלפון', sub: 'iOS / Android — בחינם' },
                  { step: '2', text: 'פתח את Expo Go', sub: 'לחץ "Scan QR Code"' },
                  { step: '3', text: 'סרוק את ה-QR', sub: 'האפליקציה תיפתח תוך שניות' },
                ].map(({ step, text, sub }) => (
                  <div key={step} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {step}
                    </div>
                    <div>
                      <p className="text-text-primary text-xs font-medium">{text}</p>
                      <p className="text-text-secondary text-xs">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Download Expo Go */}
              <div className="flex gap-2">
                <a
                  href="https://apps.apple.com/app/expo-go/id982107779"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:border-primary/30 text-xs transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  App Store
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=host.exp.exponent"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:border-primary/30 text-xs transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.18 23.76a1 1 0 01-.44-1.34l8.1-16.2L3.18.75A1 1 0 014.52.31l9.38 10.56-9.38 10.56a1 1 0 01-1.34.33zM20.18 12.5L15.36 9.8l-2.22 2.5 2.22 2.5 4.82-2.7a.5.5 0 000-.6zM3.5 23.76L13.13 13l-3.57-3.57L3.5 23.76zM3.5.24L9.56 10.57 13.13 7 3.5.24z" />
                  </svg>
                  Google Play
                </a>
              </div>
            </>
          ) : (
            <>
              {/* Manual URLs */}
              <div className="space-y-4">
                {/* Expo Go deep link */}
                <div>
                  <p className="text-text-secondary text-xs mb-2 font-medium">
                    🔗 Expo Go — הדבק בתוך האפליקציה
                  </p>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-2 border border-border">
                    <code className="text-accent text-xs flex-1 break-all font-code">{deepLink}</code>
                    <button
                      onClick={() => copyUrl(deepLink, 'expo')}
                      className="flex-shrink-0 px-2 py-1 rounded-lg bg-accent/10 text-accent text-xs hover:bg-accent/20 transition-all"
                    >
                      {copied === 'expo' ? '✓' : 'העתק'}
                    </button>
                  </div>
                  <p className="text-text-secondary text-xs mt-1">
                    פתח Expo Go → לחץ על שדה הURL ← הדבק
                  </p>
                </div>

                {/* Web share URL */}
                <div>
                  <p className="text-text-secondary text-xs mb-2 font-medium">
                    🌐 Web Preview — פתח בדפדפן
                  </p>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-2 border border-border">
                    <code className="text-primary text-xs flex-1 break-all font-code">{shareUrl}</code>
                    <button
                      onClick={() => copyUrl(shareUrl, 'web')}
                      className="flex-shrink-0 px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs hover:bg-primary/20 transition-all"
                    >
                      {copied === 'web' ? '✓' : 'העתק'}
                    </button>
                  </div>
                </div>

                {/* Open in browser */}
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:border-primary/30 text-sm transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  פתח ב-Expo Snack
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
