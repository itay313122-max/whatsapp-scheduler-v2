'use client';

import { useState, useCallback, useEffect } from 'react';

interface WebPreviewProps {
  htmlDoc: string;
  appName?: string;
  refreshKey?: string;
}

type DeviceId = 'iphone' | 'galaxy' | 'ipad' | 'desktop';

// ── Constants ──────────────────────────────────────────────────────────────

const IPAD_SCREEN_W = 768;
const IPAD_SCREEN_H = 1024;
const IPAD_SCALE    = 0.60;
const IPAD_DISP_W   = Math.round(IPAD_SCREEN_W * IPAD_SCALE); // 461
const IPAD_DISP_H   = Math.round(IPAD_SCREEN_H * IPAD_SCALE); // 614

// ── Icons ──────────────────────────────────────────────────────────────────

const IconPhone = () => (
  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const IconTablet = () => (
  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="2" y="3" width="20" height="18" rx="2.5" strokeWidth="2" />
    <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const IconMonitor = () => (
  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

// ── Device definitions ─────────────────────────────────────────────────────

const DEVICES: { id: DeviceId; label: string; icon: React.ReactNode }[] = [
  { id: 'iphone',  label: 'iPhone 15',  icon: <IconPhone />  },
  { id: 'galaxy',  label: 'Galaxy S24', icon: <IconPhone />  },
  { id: 'ipad',    label: 'iPad',       icon: <IconTablet /> },
  { id: 'desktop', label: 'Desktop',    icon: <IconMonitor />},
];

// ── Shared loading overlay ─────────────────────────────────────────────────

function LoadingOverlay({ appName }: { appName?: string }) {
  return (
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
  );
}

// ── Frame props shared by all frame components ─────────────────────────────

interface FrameProps {
  htmlDoc: string;
  appName?: string;
  loaded: boolean;
  onLoad: () => void;
  iframeKey: string;
}

// ── iPhone 15 Pro ──────────────────────────────────────────────────────────

function IPhoneFrame({ htmlDoc, appName, loaded, onLoad, iframeKey }: FrameProps) {
  return (
    <div className="relative flex-shrink-0" style={{ width: 394 }}>
      {/* Silent toggle (left) */}
      <div className="absolute rounded-r bg-gray-600" style={{ left: -2, top: 100, width: 3, height: 28 }} />
      {/* Volume up / down (left) */}
      <div className="absolute rounded-r bg-gray-600" style={{ left: -2, top: 148, width: 3, height: 56 }} />
      <div className="absolute rounded-r bg-gray-600" style={{ left: -2, top: 216, width: 3, height: 56 }} />
      {/* Power (right) */}
      <div className="absolute rounded-l bg-gray-600" style={{ right: -2, top: 168, width: 3, height: 70 }} />

      {/* Shell — dark titanium */}
      <div style={{
        background: 'linear-gradient(145deg,#2c2c2e 0%,#1c1c1e 50%,#242426 100%)',
        borderRadius: 50,
        padding: '14px 10px 10px',
        boxShadow:
          '0 0 0 1px #0a0a0a, 0 0 0 2.5px #3c3c3e, 0 0 0 3.5px #141416,' +
          '0 40px 80px rgba(0,0,0,0.55), 0 8px 24px rgba(0,0,0,0.3)',
      }}>
        {/* Dynamic Island */}
        <div style={{
          position: 'absolute', top: 26, left: '50%',
          transform: 'translateX(-50%)',
          width: 126, height: 37, borderRadius: 22,
          background: '#000', zIndex: 20,
          boxShadow: '0 0 0 1px #1a1a1a',
        }} />

        {/* Screen */}
        <div style={{ borderRadius: 40, height: 720, overflow: 'hidden', background: '#111', position: 'relative' }}>
          {!loaded && <LoadingOverlay appName={appName} />}
          <iframe
            key={iframeKey}
            srcDoc={htmlDoc}
            sandbox="allow-scripts"
            title={appName ?? 'App Preview'}
            className="w-full h-full"
            style={{ border: 'none', display: 'block' }}
            onLoad={onLoad}
          />
        </div>

        {/* Home indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, paddingBottom: 2 }}>
          <div style={{ width: 120, height: 5, borderRadius: 3, background: '#555' }} />
        </div>
      </div>
    </div>
  );
}

// ── Samsung Galaxy S24 ─────────────────────────────────────────────────────

function GalaxyFrame({ htmlDoc, appName, loaded, onLoad, iframeKey }: FrameProps) {
  return (
    <div className="relative flex-shrink-0" style={{ width: 380 }}>
      {/* Volume (left) */}
      <div className="absolute rounded-r bg-gray-600" style={{ left: -2, top: 136, width: 3, height: 60 }} />
      {/* Bixby (left, shorter) */}
      <div className="absolute rounded-r bg-gray-600" style={{ left: -2, top: 212, width: 3, height: 40 }} />
      {/* Power (right) */}
      <div className="absolute rounded-l bg-gray-600" style={{ right: -2, top: 158, width: 3, height: 52 }} />

      {/* Shell — Android style: slightly flatter corners, very dark */}
      <div style={{
        background: 'linear-gradient(160deg,#1e1e1e 0%,#141414 55%,#1a1a1a 100%)',
        borderRadius: 44,
        padding: '10px 8px 12px',
        boxShadow:
          '0 0 0 1px #050505, 0 0 0 2px #2e2e2e,' +
          '0 36px 72px rgba(0,0,0,0.55), 0 8px 20px rgba(0,0,0,0.3)',
      }}>
        {/* Screen — Android corners less rounded */}
        <div style={{ borderRadius: 32, height: 720, overflow: 'hidden', background: '#111', position: 'relative' }}>
          {/* Punch-hole camera */}
          <div style={{
            position: 'absolute', top: 14, left: '50%',
            transform: 'translateX(-50%)',
            width: 12, height: 12, borderRadius: '50%',
            background: '#000', zIndex: 20,
            boxShadow: '0 0 0 1.5px #1e1e1e',
          }} />
          {!loaded && <LoadingOverlay appName={appName} />}
          <iframe
            key={iframeKey}
            srcDoc={htmlDoc}
            sandbox="allow-scripts"
            title={appName ?? 'App Preview'}
            className="w-full h-full"
            style={{ border: 'none', display: 'block' }}
            onLoad={onLoad}
          />
        </div>

        {/* Android gesture bar */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, paddingBottom: 3 }}>
          <div style={{ width: 104, height: 4, borderRadius: 2, background: '#444' }} />
        </div>
      </div>
    </div>
  );
}

// ── iPad (Air/Pro) ─────────────────────────────────────────────────────────

function IPadFrame({ htmlDoc, appName, loaded, onLoad, iframeKey }: FrameProps) {
  const shellW = IPAD_DISP_W + 40; // 20px bezel each side

  return (
    <div className="relative flex-shrink-0" style={{ width: shellW }}>
      {/* Power (top edge) */}
      <div className="absolute rounded-b bg-gray-400"
           style={{ top: -2, left: '72%', transform: 'translateX(-50%)', width: 36, height: 3 }} />
      {/* Volume (right edge) */}
      <div className="absolute rounded-l bg-gray-400" style={{ right: -2, top: 80,  width: 3, height: 30 }} />
      <div className="absolute rounded-l bg-gray-400" style={{ right: -2, top: 120, width: 3, height: 30 }} />

      {/* Shell — silver aluminium */}
      <div style={{
        background: 'linear-gradient(150deg,#d8dadc 0%,#c6c8ca 45%,#d2d4d6 100%)',
        borderRadius: 22,
        padding: '18px 20px',
        boxShadow:
          '0 0 0 1px #a8aaac, 0 0 0 2px #bbbdbf,' +
          '0 24px 56px rgba(0,0,0,0.28), 0 6px 14px rgba(0,0,0,0.18)',
      }}>
        {/* Front camera */}
        <div style={{
          position: 'absolute', top: 9, left: '50%',
          transform: 'translateX(-50%)',
          width: 8, height: 8, borderRadius: '50%',
          background: '#8a8c8e', zIndex: 20,
        }} />

        {/* Screen clipping area — actual display size */}
        <div style={{
          borderRadius: 10,
          width: IPAD_DISP_W,
          height: IPAD_DISP_H,
          overflow: 'hidden',
          background: '#111',
          position: 'relative',
        }}>
          {!loaded && <LoadingOverlay appName={appName} />}
          {/* Scaled iframe — renders at full 768×1024 but visually scaled to 60% */}
          <div style={{
            position: 'absolute', top: 0, left: 0,
            width: IPAD_SCREEN_W, height: IPAD_SCREEN_H,
            transform: `scale(${IPAD_SCALE})`,
            transformOrigin: 'top left',
          }}>
            <iframe
              key={iframeKey}
              srcDoc={htmlDoc}
              sandbox="allow-scripts"
              title={appName ?? 'App Preview'}
              style={{ width: IPAD_SCREEN_W, height: IPAD_SCREEN_H, border: 'none', display: 'block' }}
              onLoad={onLoad}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Desktop ────────────────────────────────────────────────────────────────

function DesktopFrame({ htmlDoc, appName, loaded, onLoad, iframeKey }: FrameProps) {
  return (
    <div className="relative w-full">
      {/* Browser chrome */}
      <div className="flex items-center gap-3 px-4 rounded-t-2xl border border-border border-b-0 bg-surface-2"
           style={{ height: 38 }}>
        <div className="flex gap-1.5 shrink-0">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 bg-white rounded-md border border-border h-5 flex items-center px-2 min-w-0">
          <span className="text-text-secondary text-[11px] truncate">preview://app</span>
        </div>
      </div>

      {/* Screen */}
      <div className="relative w-full rounded-b-2xl overflow-hidden border border-border" style={{ height: 660 }}>
        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface-2 z-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow animate-pulse-slow">
              <span className="text-white font-display font-bold text-lg">W</span>
            </div>
            <p className="text-text-secondary text-sm">טוען…</p>
          </div>
        )}
        <iframe
          key={iframeKey}
          srcDoc={htmlDoc}
          sandbox="allow-scripts"
          title={appName ?? 'Web Preview'}
          className="w-full h-full"
          style={{ border: 'none', display: 'block' }}
          onLoad={onLoad}
        />
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function WebPreview({ htmlDoc, appName, refreshKey }: WebPreviewProps) {
  const [loaded, setLoaded] = useState(false);
  const [device, setDevice] = useState<DeviceId>('iphone');

  useEffect(() => {
    console.log('[WebPreview] htmlDoc length:', htmlDoc?.length ?? 0);
  }, [htmlDoc]);

  const openInNewTab = useCallback(() => {
    const blob = new Blob([htmlDoc], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    window.open(url, '_blank')?.focus();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }, [htmlDoc]);

  const selectDevice = (id: DeviceId) => { setDevice(id); setLoaded(false); };

  const iframeKey = `${device}-${refreshKey ?? ''}-${htmlDoc.slice(0, 40)}`;
  const frameProps: FrameProps = { htmlDoc, appName, loaded, onLoad: () => setLoaded(true), iframeKey };

  return (
    <div className="flex flex-col w-full gap-3">

      {/* Toolbar */}
      <div className="flex items-center justify-between px-1">

        {/* Device selector */}
        <div className="flex items-center gap-0.5 p-1 rounded-xl bg-surface-2 border border-border">
          {DEVICES.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => selectDevice(id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                device === id
                  ? 'bg-gradient-primary text-white shadow-glow'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {/* Open in new tab */}
        <button
          onClick={openInNewTab}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-primary hover:border-primary/30 text-xs transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          פתח בטאב
        </button>
      </div>

      {/* Preview area */}
      <div
        className={`flex ${device === 'desktop' ? 'w-full' : 'items-start justify-center'}`}
        style={{ minHeight: 780 }}
      >
        {device === 'iphone'  && <IPhoneFrame  {...frameProps} />}
        {device === 'galaxy'  && <GalaxyFrame  {...frameProps} />}
        {device === 'ipad'    && <IPadFrame    {...frameProps} />}
        {device === 'desktop' && <DesktopFrame {...frameProps} />}
      </div>

    </div>
  );
}
