'use client';

import { useState, useCallback, useEffect } from 'react';

interface WebPreviewProps {
  htmlDoc: string;
  appName?: string;
  refreshKey?: string;
}

type DeviceId = 'iphone' | 'galaxy' | 'ipad' | 'desktop';

const IPAD_SCREEN_W = 768;
const IPAD_SCREEN_H = 1024;
const IPAD_SCALE    = 0.55;
const IPAD_DISP_W   = Math.round(IPAD_SCREEN_W * IPAD_SCALE);
const IPAD_DISP_H   = Math.round(IPAD_SCREEN_H * IPAD_SCALE);

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

const DEVICES: { id: DeviceId; label: string; icon: React.ReactNode }[] = [
  { id: 'desktop', label: 'Desktop',    icon: <IconMonitor /> },
  { id: 'iphone',  label: 'iPhone 15',  icon: <IconPhone />  },
  { id: 'galaxy',  label: 'Galaxy S24', icon: <IconPhone />  },
  { id: 'ipad',    label: 'iPad',       icon: <IconTablet /> },
];

function LoadingOverlay({ appName }: { appName?: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10"
         style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)' }}>
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
             style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          <span className="text-white font-bold text-xl">M</span>
        </div>
        <div className="absolute -inset-2 rounded-3xl animate-ping opacity-20"
             style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }} />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium" style={{ color: '#475569' }}>
          {appName ? `Loading ${appName}...` : 'Loading preview...'}
        </p>
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-2 h-2 rounded-full animate-bounce"
               style={{ background: '#6366f1', animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}

interface FrameProps {
  htmlDoc: string;
  appName?: string;
  loaded: boolean;
  onLoad: () => void;
  iframeKey: string;
}

// ── iPhone 15 Pro — Titanium Design ──────────────────────────────────────

function IPhoneFrame({ htmlDoc, appName, loaded, onLoad, iframeKey }: FrameProps) {
  return (
    <div className="relative flex-shrink-0" style={{ width: 390 }}>
      {/* Hardware buttons */}
      <div className="absolute" style={{ left: -3, top: 108, width: 4, height: 32, borderRadius: '4px 0 0 4px',
        background: 'linear-gradient(180deg, #4a4a4c, #3a3a3c, #4a4a4c)' }} />
      <div className="absolute" style={{ left: -3, top: 158, width: 4, height: 58, borderRadius: '4px 0 0 4px',
        background: 'linear-gradient(180deg, #4a4a4c, #3a3a3c, #4a4a4c)' }} />
      <div className="absolute" style={{ left: -3, top: 226, width: 4, height: 58, borderRadius: '4px 0 0 4px',
        background: 'linear-gradient(180deg, #4a4a4c, #3a3a3c, #4a4a4c)' }} />
      <div className="absolute" style={{ right: -3, top: 178, width: 4, height: 72, borderRadius: '0 4px 4px 0',
        background: 'linear-gradient(180deg, #4a4a4c, #3a3a3c, #4a4a4c)' }} />

      {/* Outer titanium shell */}
      <div style={{
        background: 'linear-gradient(160deg, #48484a 0%, #2c2c2e 20%, #1c1c1e 50%, #2c2c2e 80%, #3a3a3c 100%)',
        borderRadius: 54,
        padding: '15px 12px 12px',
        boxShadow: `
          0 0 0 0.5px rgba(255,255,255,0.08) inset,
          0 1px 0 0 rgba(255,255,255,0.05) inset,
          0 0 0 1px #0a0a0a,
          0 0 0 2px #3a3a3c,
          0 0 0 3px #1a1a1c,
          0 25px 60px -12px rgba(0,0,0,0.5),
          0 12px 28px -8px rgba(0,0,0,0.35),
          0 4px 10px rgba(0,0,0,0.2)
        `,
      }}>
        {/* Dynamic Island */}
        <div style={{
          position: 'absolute', top: 26, left: '50%',
          transform: 'translateX(-50%)',
          width: 126, height: 37, borderRadius: 20,
          background: '#000', zIndex: 30,
          boxShadow: '0 0 0 0.5px rgba(255,255,255,0.06) inset, 0 1px 3px rgba(0,0,0,0.5)',
        }}>
          <div style={{
            position: 'absolute', right: 22, top: '50%', transform: 'translateY(-50%)',
            width: 10, height: 10, borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #1a1a2e 0%, #0a0a14 60%, #000 100%)',
            boxShadow: '0 0 0 1px rgba(60,60,80,0.3), 0 0 3px rgba(80,80,120,0.15) inset',
          }} />
        </div>

        {/* iOS Status Bar */}
        <div style={{
          position: 'absolute', top: 27, left: 38, right: 38,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          zIndex: 25, color: '#fff', fontSize: 14, fontWeight: 600,
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
        }}>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: 0.3 }}>9:41</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <svg width="18" height="12" viewBox="0 0 18 12" fill="white">
              <rect x="0" y="5" width="3" height="7" rx="0.5" opacity="0.3" />
              <rect x="4" y="3.5" width="3" height="8.5" rx="0.5" opacity="0.5" />
              <rect x="8" y="2" width="3" height="10" rx="0.5" opacity="0.7" />
              <rect x="12" y="0" width="3" height="12" rx="0.5" />
            </svg>
            <svg width="16" height="12" viewBox="0 0 16 12" fill="white">
              <path d="M8 2.4C5.6 2.4 3.4 3.4 1.8 5.1L0 3.3C2.1 1.2 4.9 0 8 0s5.9 1.2 8 3.3l-1.8 1.8C12.6 3.4 10.4 2.4 8 2.4z" opacity="0.3"/>
              <path d="M8 5.4c-1.7 0-3.2.7-4.3 1.8L2 5.5C3.5 4 5.6 3 8 3s4.5 1 6 2.5l-1.7 1.7C11.2 6.1 9.7 5.4 8 5.4z" opacity="0.5"/>
              <path d="M8 8.4c-.9 0-1.8.4-2.4 1L4 7.8c1.1-1.1 2.5-1.8 4-1.8s2.9.7 4 1.8l-1.6 1.6c-.6-.6-1.5-1-2.4-1z" opacity="0.8"/>
              <circle cx="8" cy="11" r="1.2"/>
            </svg>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: 25, height: 12, borderRadius: 3, border: '1.2px solid rgba(255,255,255,0.4)',
                padding: 1.5, position: 'relative',
              }}>
                <div style={{
                  width: '75%', height: '100%', borderRadius: 1.5,
                  background: '#fff',
                }} />
              </div>
              <div style={{
                width: 2, height: 5, borderRadius: '0 1px 1px 0',
                background: 'rgba(255,255,255,0.4)', marginLeft: 0.5,
              }} />
            </div>
          </div>
        </div>

        {/* Screen */}
        <div style={{
          borderRadius: 42, height: 730, overflow: 'hidden',
          background: '#000', position: 'relative',
          boxShadow: '0 0 0 0.5px rgba(255,255,255,0.04) inset',
        }}>
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
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4 }}>
          <div style={{
            width: 130, height: 5, borderRadius: 3,
            background: 'linear-gradient(90deg, #555, #666, #555)',
            boxShadow: '0 0 4px rgba(255,255,255,0.05)',
          }} />
        </div>
      </div>
    </div>
  );
}

// ── Samsung Galaxy S24 Ultra — Premium Design ────────────────────────────

function GalaxyFrame({ htmlDoc, appName, loaded, onLoad, iframeKey }: FrameProps) {
  return (
    <div className="relative flex-shrink-0" style={{ width: 384 }}>
      {/* Hardware buttons */}
      <div className="absolute" style={{ right: -3, top: 145, width: 4, height: 52, borderRadius: '0 4px 4px 0',
        background: 'linear-gradient(180deg, #2a2a2a, #1e1e1e, #2a2a2a)' }} />
      <div className="absolute" style={{ left: -3, top: 140, width: 4, height: 64, borderRadius: '4px 0 0 4px',
        background: 'linear-gradient(180deg, #2a2a2a, #1e1e1e, #2a2a2a)' }} />
      <div className="absolute" style={{ left: -3, top: 218, width: 4, height: 42, borderRadius: '4px 0 0 4px',
        background: 'linear-gradient(180deg, #2a2a2a, #1e1e1e, #2a2a2a)' }} />

      {/* Shell — Phantom Black */}
      <div style={{
        background: 'linear-gradient(165deg, #1a1a1a 0%, #111111 30%, #0d0d0d 55%, #141414 80%, #1c1c1c 100%)',
        borderRadius: 40,
        padding: '10px 9px 12px',
        boxShadow: `
          0 0 0 0.5px rgba(255,255,255,0.06) inset,
          0 0 0 1px #050505,
          0 0 0 1.5px #2a2a2a,
          0 0 0 2.5px #0d0d0d,
          0 22px 50px -10px rgba(0,0,0,0.5),
          0 10px 24px -6px rgba(0,0,0,0.35),
          0 4px 8px rgba(0,0,0,0.2)
        `,
      }}>
        {/* Punch-hole camera */}
        <div style={{
          position: 'absolute', top: 24, left: '50%',
          transform: 'translateX(-50%)',
          width: 14, height: 14, borderRadius: '50%',
          background: 'radial-gradient(circle at 40% 40%, #1a1a2e 0%, #080810 50%, #000 100%)',
          zIndex: 30,
          boxShadow: '0 0 0 1.5px rgba(40,40,50,0.4), 0 0 6px rgba(0,0,0,0.5)',
        }} />

        {/* Android Status Bar */}
        <div style={{
          position: 'absolute', top: 20, left: 30, right: 30,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          zIndex: 25, color: '#fff', fontSize: 13, fontWeight: 500,
          fontFamily: '"Google Sans", "Roboto", sans-serif',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>9:41</span>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <svg width="10" height="14" viewBox="0 0 10 14" fill="white" opacity="0.9">
              <rect x="7" y="0" width="3" height="14" rx="0.5" />
              <rect x="0" y="4" width="3" height="10" rx="0.5" opacity="0.6" />
              <rect x="3.5" y="7" width="3" height="7" rx="0.5" opacity="0.4" />
            </svg>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="white" opacity="0.9">
              <path d="M1 4l5 5 5-5" stroke="white" strokeWidth="1.5" fill="none" opacity="0.3"/>
              <path d="M3 6l3 3 3-3" stroke="white" strokeWidth="1.5" fill="none" opacity="0.6"/>
              <circle cx="6" cy="10" r="1"/>
            </svg>
            <div style={{
              width: 22, height: 11, borderRadius: 2.5, border: '1.2px solid rgba(255,255,255,0.35)',
              padding: 1.5, position: 'relative',
            }}>
              <div style={{
                width: '80%', height: '100%', borderRadius: 1.2,
                background: '#4ade80',
              }} />
            </div>
          </div>
        </div>

        {/* Screen */}
        <div style={{
          borderRadius: 32, height: 730, overflow: 'hidden',
          background: '#000', position: 'relative',
          boxShadow: '0 0 0 0.5px rgba(255,255,255,0.03) inset',
        }}>
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

        {/* Gesture bar */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4 }}>
          <div style={{
            width: 110, height: 4, borderRadius: 2,
            background: 'linear-gradient(90deg, #444, #555, #444)',
          }} />
        </div>
      </div>
    </div>
  );
}

// ── iPad Pro — Silver Aluminium ──────────────────────────────────────────

function IPadFrame({ htmlDoc, appName, loaded, onLoad, iframeKey }: FrameProps) {
  const shellW = IPAD_DISP_W + 44;

  return (
    <div className="relative flex-shrink-0" style={{ width: shellW }}>
      {/* Power button */}
      <div className="absolute" style={{
        top: -3, left: '72%', transform: 'translateX(-50%)',
        width: 38, height: 4, borderRadius: '0 0 3px 3px',
        background: 'linear-gradient(90deg, #c0c0c0, #d4d4d4, #c0c0c0)',
      }} />
      {/* Volume buttons */}
      <div className="absolute" style={{
        right: -3, top: 82, width: 4, height: 32, borderRadius: '0 3px 3px 0',
        background: 'linear-gradient(180deg, #c0c0c0, #b0b0b0, #c0c0c0)',
      }} />
      <div className="absolute" style={{
        right: -3, top: 122, width: 4, height: 32, borderRadius: '0 3px 3px 0',
        background: 'linear-gradient(180deg, #c0c0c0, #b0b0b0, #c0c0c0)',
      }} />

      {/* Shell */}
      <div style={{
        background: 'linear-gradient(155deg, #e8e8ea 0%, #d4d4d8 25%, #c8c8cc 50%, #d2d2d6 75%, #dedee2 100%)',
        borderRadius: 24,
        padding: '20px 22px',
        boxShadow: `
          0 0 0 0.5px rgba(255,255,255,0.6) inset,
          0 1px 0 rgba(255,255,255,0.3) inset,
          0 0 0 1px #a0a0a4,
          0 0 0 1.5px #b8b8bc,
          0 20px 50px -10px rgba(0,0,0,0.25),
          0 8px 20px -6px rgba(0,0,0,0.18),
          0 3px 8px rgba(0,0,0,0.1)
        `,
      }}>
        {/* Front camera */}
        <div style={{
          position: 'absolute', top: 10, left: '50%',
          transform: 'translateX(-50%)',
          width: 7, height: 7, borderRadius: '50%',
          background: 'radial-gradient(circle at 40% 40%, #7a7a7e, #4a4a4e)',
          zIndex: 20,
          boxShadow: '0 0 0 1px rgba(0,0,0,0.15)',
        }} />

        {/* Screen */}
        <div style={{
          borderRadius: 10,
          width: IPAD_DISP_W,
          height: IPAD_DISP_H,
          overflow: 'hidden',
          background: '#000',
          position: 'relative',
          boxShadow: '0 0 0 0.5px rgba(0,0,0,0.1) inset',
        }}>
          {!loaded && <LoadingOverlay appName={appName} />}
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

// ── Desktop — macOS Style Browser ────────────────────────────────────────

function DesktopFrame({ htmlDoc, appName, loaded, onLoad, iframeKey }: FrameProps) {
  return (
    <div className="relative w-full" style={{ maxWidth: 960 }}>
      {/* Browser chrome - macOS style */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px',
        height: 44, borderRadius: '14px 14px 0 0',
        background: 'linear-gradient(180deg, #f0f0f2 0%, #e4e4e8 100%)',
        borderBottom: '1px solid #d0d0d4',
        boxShadow: '0 -1px 0 rgba(255,255,255,0.8) inset',
      }}>
        {/* Traffic lights */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <div style={{
            width: 13, height: 13, borderRadius: '50%',
            background: 'linear-gradient(180deg, #ff6058, #e14640)',
            boxShadow: '0 0 0 0.5px rgba(0,0,0,0.12), 0 1px 1px rgba(0,0,0,0.1) inset',
          }} />
          <div style={{
            width: 13, height: 13, borderRadius: '50%',
            background: 'linear-gradient(180deg, #ffbe2e, #dea123)',
            boxShadow: '0 0 0 0.5px rgba(0,0,0,0.12), 0 1px 1px rgba(0,0,0,0.1) inset',
          }} />
          <div style={{
            width: 13, height: 13, borderRadius: '50%',
            background: 'linear-gradient(180deg, #2bc840, #1aad2e)',
            boxShadow: '0 0 0 0.5px rgba(0,0,0,0.12), 0 1px 1px rgba(0,0,0,0.1) inset',
          }} />
        </div>

        {/* URL Bar */}
        <div style={{
          flex: 1, height: 28, borderRadius: 7,
          background: '#fff', border: '1px solid #d0d0d4',
          display: 'flex', alignItems: 'center', padding: '0 12px', gap: 6,
          boxShadow: '0 1px 2px rgba(0,0,0,0.04) inset',
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1.5a3.5 3.5 0 00-3.5 3.5v1.5a3.5 3.5 0 107 0V5A3.5 3.5 0 006 1.5z" stroke="#999" strokeWidth="1"/>
            <rect x="3" y="6" width="6" height="5" rx="1" stroke="#999" strokeWidth="1"/>
          </svg>
          <span style={{ color: '#999', fontSize: 12, fontFamily: '-apple-system, sans-serif' }}>
            myapp.mobileforge.dev
          </span>
        </div>
      </div>

      {/* Screen */}
      <div style={{
        position: 'relative', width: '100%', height: 640,
        borderRadius: '0 0 14px 14px', overflow: 'hidden',
        background: '#fff',
        border: '1px solid #d0d0d4', borderTop: 'none',
        boxShadow: '0 20px 50px -10px rgba(0,0,0,0.2), 0 8px 20px -6px rgba(0,0,0,0.12)',
      }}>
        {!loaded && <LoadingOverlay appName={appName} />}
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

// ── Main component ────────────────────────────────────────────────────────

export default function WebPreview({ htmlDoc, appName, refreshKey }: WebPreviewProps) {
  const [loaded, setLoaded] = useState(false);
  const [device, setDevice] = useState<DeviceId>('iphone');

  useEffect(() => {
    console.log('[WebPreview] htmlDoc length:', htmlDoc?.length ?? 0);
  }, [htmlDoc]);

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data?.type === 'mf-edit') {
        console.log('[WebPreview] Edit event:', e.data);
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

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
    <div className="flex flex-col w-full gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-1">
        {/* Device selector */}
        <div className="flex items-center gap-1 p-1 rounded-xl"
             style={{
               background: 'rgba(241,245,249,0.8)',
               backdropFilter: 'blur(8px)',
               border: '1px solid rgba(226,232,240,0.6)',
             }}>
          {DEVICES.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => selectDevice(id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200"
              style={device === id ? {
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff',
                boxShadow: '0 2px 8px rgba(99,102,241,0.35), 0 1px 2px rgba(0,0,0,0.1)',
              } : {
                color: '#64748b',
                background: 'transparent',
              }}
            >
              {icon}
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Open in new tab */}
        <button
          onClick={openInNewTab}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all duration-200"
          style={{
            color: '#64748b',
            border: '1px solid rgba(226,232,240,0.6)',
            background: 'rgba(241,245,249,0.5)',
          }}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          <span className="hidden sm:inline">Open in tab</span>
        </button>
      </div>

      {/* Preview area */}
      <div
        className={`flex ${device === 'desktop' ? 'w-full justify-center' : 'items-start justify-center'}`}
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
