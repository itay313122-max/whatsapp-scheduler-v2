function App() {
  const { useState } = React;
  const Icon = ({ d, s = 20, sw = 1.8, fill = 'none' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
  );
  const PIN = <><circle cx="12" cy="10" r="3" /><path d="M12 21s-7-6.5-7-11a7 7 0 1114 0c0 4.5-7 11-7 11z" /></>;
  const [screen, setScreen] = useState('login'); // login | search | map
  const [dest, setDest] = useState(null);
  const [started, setStarted] = useState(false);

  const SAVED = [
    ['Home', 'HaYarkon St 88, Tel Aviv', <path d="M3 11l9-8 9 8M5 10v10h14V10" />],
    ['Work', 'Rothschild Blvd 12, Tel Aviv', <><rect x="4" y="7" width="16" height="13" rx="2" /><path d="M9 7V4h6v3" /></>],
  ];
  const RECENT = [
    ['Sarona Market', 'Aluf Kalman Magen St 3', '2.1 km'],
    ['Tel Aviv Port', 'Yordei HaSira St', '4.8 km'],
    ['Habima Theatre', 'Tarsat Blvd', '1.4 km'],
  ];

  const MapSvg = () => (
    <svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0 }}>
      <rect width="390" height="844" fill="#e9edf1" />
      <rect x="40" y="120" width="150" height="120" rx="10" fill="#d4e9d2" />
      <path d="M-20 560 C 90 520, 150 640, 280 600 S 460 560, 460 560 L 460 700 L -20 700 Z" fill="#cfe2f3" />
      {[[230,150],[300,150],[230,250],[300,250],[60,300],[140,300],[230,360],[300,360],[60,420],[140,420],[230,470],[300,470]].map(([x,y],i)=>(<rect key={i} x={x} y={y} width="56" height="56" rx="7" fill="#dfe5ec" />))}
      <g stroke="#ffffff" strokeWidth="13" fill="none" strokeLinecap="round"><path d="M0 290 H390" /><path d="M0 410 H390" /><path d="M0 540 H390" /><path d="M210 0 V844" /><path d="M300 0 V844" /><path d="M110 80 V560" /></g>
      <g stroke="#f1f4f8" strokeWidth="9" fill="none" strokeLinecap="round"><path d="M0 290 H390" /><path d="M0 410 H390" /><path d="M0 540 H390" /><path d="M210 0 V844" /><path d="M300 0 V844" /><path d="M110 80 V560" /></g>
      <path d="M110 690 V540 H210 V410 H300 V250" fill="none" stroke="#1a73e8" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" opacity="0.25" />
      <path d="M110 690 V540 H210 V410 H300 V250" fill="none" stroke="#1a73e8" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <g transform="translate(300 250)"><circle r="13" fill="#ea4335" /><circle r="5" fill="#fff" /></g>
      <g transform="translate(110 690)"><circle r="22" fill="#1a73e8" opacity="0.15" /><circle r="9" fill="#1a73e8" stroke="#fff" strokeWidth="3" /></g>
    </svg>
  );

  // ── Screen 1: Login / welcome ───────────────────────────────────────────
  if (screen === 'login') {
    return (
      <div className="app-shell" style={{ background: '#0c0c0e', position: 'relative', overflow: 'hidden' }}>
        <style>{`:root{--c-bg:#0c0c0e;--c-font:'Inter',system-ui,sans-serif;}`}</style>
        <svg width="100%" height="48%" viewBox="0 0 390 400" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', top: 0, left: 0, opacity: 0.5 }}>
          <rect width="390" height="400" fill="#141417" />
          <g stroke="#26262b" strokeWidth="2" fill="none"><path d="M0 120 H390" /><path d="M0 240 H390" /><path d="M120 0 V400" /><path d="M270 0 V400" /></g>
          <path d="M40 360 V240 H200 V120 H320 V30" fill="none" stroke="#1a73e8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
          <circle cx="40" cy="360" r="7" fill="#1a73e8" stroke="#0c0c0e" strokeWidth="3" />
          <circle cx="320" cy="30" r="9" fill="#ea4335" />
        </svg>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, #0c0c0e 62%)' }} />
        <div style={{ position: 'absolute', left: 26, right: 26, bottom: 'calc(40px + env(safe-area-inset-bottom,0px))' }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: '#1a73e8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', marginBottom: 22 }}>
            <Icon s={26} d={<path d="M3 11l19-9-9 19-2-8-8-2z" />} />
          </div>
          <h1 style={{ color: '#fff', fontSize: 34, fontWeight: 700, letterSpacing: -1, lineHeight: 1.1, margin: 0 }}>Navigate</h1>
          <p style={{ color: '#9ca3af', fontSize: 16, marginTop: 12, lineHeight: 1.5 }}>Real-time directions, saved places, and the fastest route — everywhere you go.</p>
          <button onClick={() => setScreen('search')} style={{ width: '100%', marginTop: 28, padding: 16, borderRadius: 14, border: 'none', cursor: 'pointer', background: '#fff', color: '#0c0c0e', fontSize: 16, fontWeight: 600 }}>Get started</button>
          <button onClick={() => setScreen('search')} style={{ width: '100%', marginTop: 10, padding: 16, borderRadius: 14, border: '1px solid #2a2a30', cursor: 'pointer', background: 'transparent', color: '#fff', fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
            <Icon s={18} d={<><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0112 0v1" /></>} /> Continue as guest
          </button>
        </div>
      </div>
    );
  }

  // ── Screen 2: Search / select destination ───────────────────────────────
  if (screen === 'search') {
    const go = (name) => { setDest(name); setStarted(false); setScreen('map'); };
    return (
      <div className="app-shell" style={{ background: '#fff' }}>
        <style>{`:root{--c-bg:#fff;--c-font:'Inter',system-ui,sans-serif;}`}</style>
        <div className="app-content" style={{ background: '#fff', padding: '0 20px', gap: 0 }}>
          <div style={{ paddingTop: 'calc(20px + env(safe-area-inset-top,0px))' }}>
            <h1 style={{ color: '#0a0a0a', fontSize: 26, fontWeight: 700, letterSpacing: -0.5, margin: '0 0 16px' }}>Where to?</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f4f4f5', borderRadius: 14, padding: '14px 16px' }}>
              <span style={{ color: '#9ca3af' }}><Icon s={18} d={<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></>} /></span>
              <span style={{ color: '#9ca3af', fontSize: 15 }}>Search for a place or address</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            {SAVED.map(s => (
              <button key={s[0]} onClick={() => go(s[1])} style={{ flex: 1, textAlign: 'left', background: '#fff', border: '1px solid #ececec', borderRadius: 14, padding: 14, cursor: 'pointer' }}>
                <span style={{ color: '#1a73e8' }}><Icon s={20} d={s[2]} /></span>
                <div style={{ color: '#0a0a0a', fontSize: 14, fontWeight: 600, marginTop: 8 }}>{s[0]}</div>
                <div style={{ color: '#a1a1aa', fontSize: 11, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s[1]}</div>
              </button>
            ))}
          </div>
          <div style={{ color: '#71717a', fontSize: 12, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase', margin: '26px 0 6px' }}>Recent</div>
          {RECENT.map((r, i) => (
            <button key={i} onClick={() => go(r[0])} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', background: 'none', border: 'none', borderBottom: i < RECENT.length - 1 ? '1px solid #f4f4f5' : 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
              <div style={{ width: 40, height: 40, borderRadius: 999, background: '#f4f4f5', color: '#71717a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon s={18} d={PIN} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#18181b', fontSize: 15, fontWeight: 600 }}>{r[0]}</div>
                <div style={{ color: '#a1a1aa', fontSize: 12, marginTop: 1 }}>{r[1]}</div>
              </div>
              <div style={{ color: '#a1a1aa', fontSize: 13, flexShrink: 0 }}>{r[2]}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Screen 3: Navigation map ────────────────────────────────────────────
  const STEPS = [
    ['Turn right onto King George St', '400 m', <path d="M5 19V9a4 4 0 014-4h7M13 1l4 4-4 4" />],
    ['Continue onto Allenby St', '1.2 km', <path d="M12 19V5M5 12l7-7 7 7" />],
    ['Turn left onto Rothschild Blvd', '850 m', <path d="M19 19V9a4 4 0 00-4-4H8M11 1L7 5l4 4" />],
    ['Arrive at destination', '5.2 km', PIN],
  ];
  return (
    <div className="app-shell" style={{ background: '#e8edf2', position: 'relative', overflow: 'hidden' }}>
      <style>{`:root{--c-bg:#e8edf2;--c-font:'Inter',system-ui,sans-serif;}`}</style>
      <MapSvg />
      <div style={{ position: 'absolute', top: 'calc(16px + env(safe-area-inset-top,0px))', left: 16, right: 16, display: 'flex', alignItems: 'center', gap: 10, background: '#fff', borderRadius: 14, padding: '13px 16px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
        <button onClick={() => setScreen('search')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5f6368', padding: 0, display: 'flex' }}><Icon s={20} d={<path d="M15 18l-6-6 6-6" />} /></button>
        <span style={{ color: '#3c4043', fontSize: 15, fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dest || 'Destination'}</span>
      </div>
      <div style={{ position: 'absolute', right: 16, bottom: 320, width: 46, height: 46, borderRadius: 12, background: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a73e8' }}>
        <Icon s={22} d={<><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></>} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: '#fff', borderRadius: '22px 22px 0 0', boxShadow: '0 -6px 24px rgba(0,0,0,0.12)', padding: '10px 20px calc(22px + env(safe-area-inset-bottom,0px))' }}>
        <div style={{ width: 38, height: 4, borderRadius: 3, background: '#dadce0', margin: '0 auto 16px' }} />
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ color: '#188038', fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>14 min</div>
          <div style={{ color: '#5f6368', fontSize: 14 }}>5.2 km · arrive 14:32</div>
        </div>
        <div style={{ marginTop: 16, marginBottom: 8 }}>
          {STEPS.slice(0, started ? 4 : 2).map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 0', borderBottom: i < (started ? 3 : 1) ? '1px solid #f1f3f4' : 'none' }}>
              <span style={{ color: i === 0 ? '#1a73e8' : '#5f6368', flexShrink: 0 }}><Icon s={22} d={s[2]} /></span>
              <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: '#202124' }}>{s[0]}</div>
              <div style={{ fontSize: 13, color: '#5f6368', flexShrink: 0 }}>{s[1]}</div>
            </div>
          ))}
        </div>
        <button onClick={() => setStarted(v => !v)} style={{ width: '100%', marginTop: 6, padding: 15, borderRadius: 14, border: 'none', cursor: 'pointer', background: '#1a73e8', color: '#fff', fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Icon s={20} fill="#fff" d={<path d="M5 3l14 9-14 9V3z" />} /> {started ? 'Show all steps' : 'Start navigation'}
        </button>
      </div>
    </div>
  );
}