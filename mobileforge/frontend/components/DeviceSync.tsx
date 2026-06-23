'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface DeviceSyncProps {
  shareUrl: string;
  appName?: string;
  onClose: () => void;
}

export default function DeviceSync({ shareUrl, appName, onClose }: DeviceSyncProps) {
  const [copied, setCopied] = useState(false);

  async function copyUrl() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const steps = [
    { step: '1', text: 'פתח את המצלמה בטלפון', sub: 'iPhone או אנדרואיד — לא צריך אפליקציה' },
    { step: '2', text: 'כוון אל קוד ה-QR', sub: 'תופיע התראה ללחיצה' },
    { step: '3', text: 'הקש על הקישור', sub: 'האפליקציה תיפתח בדפדפן — חיה ואינטראקטיבית' },
  ];

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
            className="w-7 h-7 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface flex items-center justify-center transition-all"
            aria-label="סגור"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* QR Code — encodes the live web URL, opens in the phone browser */}
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-white rounded-2xl shadow-lg">
              <QRCodeSVG
                value={shareUrl}
                size={180}
                bgColor="#ffffff"
                fgColor="#0A0A0F"
                level="M"
                includeMargin={false}
              />
            </div>
            <div className="text-center">
              <p className="text-text-primary text-sm font-medium mb-1">סרוק עם מצלמת הטלפון</p>
              <p className="text-text-secondary text-xs leading-relaxed">
                האפליקציה נפתחת ישירות בדפדפן — בלי להתקין כלום
              </p>
            </div>
          </div>

          {/* Step instructions */}
          <div className="space-y-2">
            {steps.map(({ step, text, sub }) => (
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

          {/* Manual URL copy */}
          <div>
            <p className="text-text-secondary text-xs mb-2 font-medium">או העתק את הקישור ושלח לעצמך</p>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-2 border border-border">
              <code className="text-primary text-xs flex-1 break-all font-code">{shareUrl}</code>
              <button
                onClick={copyUrl}
                className="flex-shrink-0 px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs hover:bg-primary/20 transition-all"
              >
                {copied ? 'הועתק ✓' : 'העתק'}
              </button>
            </div>
          </div>

          {/* Open directly */}
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            פתח בכרטיסייה חדשה
          </a>
        </div>
      </div>
    </div>
  );
}
