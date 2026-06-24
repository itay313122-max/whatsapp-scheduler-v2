function App() {
  const { useState } = React;
  const Icon = ({ d, s = 20, sw = 1.8, fill = 'none' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
  );
  const STEPS = [
    ['Turn right onto King George St', '400 m', <path d="M5 19V9a4 4 0 014-4h7M13 1l4 4-4 4" />],
    ['Continue onto Allenby St', '1.2 km', <path d="M12 19V5M5 12l7-7 7 7" />],
    ['Turn left onto Rothschild Blvd', '850 m', <path d="M19 19V9a4 4 0 00-4-4H8M11 1L7 5l4 4" />],
    ['Arrive at destination', '5.2 km', <><circle cx="12" cy="10" r="3" /><path d="M12 21s-7-6.5-7-11a7 7 0 1114 0c0 4.5-7 11-7 11z" /></>],
  ];
  const [started, setStarted] = useState(false);

  return (
    <div className="app-shell" style={{ background: '#e8edf2', position: 'relative', overflow: 'hidden' }}>
      <style>{`:root{--c-bg:#e8edf2;--c-font:'Inter',system-ui,sans-serif;}`}</style>

      {/* ── Vector map (self-contained SVG, no external tiles) ── */}
      <svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0 }}>
        <rect width="390" height="844" fill="#e9edf1" />
        {/* park */}
        <rect x="40" y="120" width="150" height="120" rx="10" fill="#d4e9d2" />
        {/* river */}
        <path d="M-20 560 C 90 520, 150 640, 280 600 S 460 560, 460 560 L 460 700 L -20 700 Z" fill="#cfe2f3" />
        {/* blocks (subtle) */}
        {[[230,150],[300,150],[230,250],[300,250],[60,300],[140,300],[230,360],[300,360],[60,420],[140,420],[230,470],[300,470]].map(([x,y],i)=>(
          <rect key={i} x={x} y={y} width="56" height="56" rx="7" fill="#dfe5ec" />
        ))}
        {/* road network */}
        <g stroke="#ffffff" strokeWidth="13" fill="none" strokeLinecap="round">
          <path d="M0 290 H390" /><path d="M0 410 H390" /><path d="M0 540 H390" />
          <path d="M210 0 V844" /><path d="M300 0 V844" /><path d="M110 80 V560" />
        </g>
        <g stroke="#f1f4f8" strokeWidth="9" fill="none" strokeLinecap="round">
          <path d="M0 290 H390" /><path d="M0 410 H390" /><path d="M0 540 H390" />
          <path d="M210 0 V844" /><path d="M300 0 V844" /><path d="M110 80 V560" />
        </g>
        {/* route line */}
        <path d="M110 690 V540 H210 V410 H300 V250" fill="none" stroke="#1a73e8" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" opacity="0.25" />
        <path d="M110 690 V540 H210 V410 H300 V250" fill="none" stroke="#1a73e8" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        {/* destination pin */}
        <g transform="translate(300 250)">
          <circle r="13" fill="#ea4335" /><circle r="5" fill="#fff" />
        </g>
        {/* current location */}
        <g transform="translate(110 690)">
          <circle r="22" fill="#1a73e8" opacity="0.15" />
          <circle r="9" fill="#1a73e8" stroke="#fff" strokeWidth="3" />
        </g>
      </svg>

      {/* ── Floating search bar ── */}
      <div style={{ position: 'absolute', top: 'calc(16px + env(safe-area-inset-top,0px))', left: 16, right: 16, display: 'flex', alignItems: 'center', gap: 10, background: '#fff', borderRadius: 14, padding: '13px 16px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
        <span style={{ color: '#5f6368' }}><Icon s={18} d={<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></>} /></span>
        <span style={{ color: '#3c4043', fontSize: 15, fontWeight: 500 }}>Rothschild Blvd 12, Tel Aviv</span>
      </div>

      {/* ── Recenter button ── */}
      <div style={{ position: 'absolute', right: 16, bottom: 320, width: 46, height: 46, borderRadius: 12, background: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a73e8' }}>
        <Icon s={22} d={<><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></>} />
      </div>

      {/* ── Bottom navigation sheet ── */}
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
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#202124' }}>{s[0]}</div>
              </div>
              <div style={{ fontSize: 13, color: '#5f6368', flexShrink: 0 }}>{s[1]}</div>
            </div>
          ))}
        </div>
        <button onClick={() => setStarted(v => !v)} style={{ width: '100%', marginTop: 6, padding: '15px', borderRadius: 14, border: 'none', cursor: 'pointer', background: '#1a73e8', color: '#fff', fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Icon s={20} fill="#fff" d={<path d="M5 3l14 9-14 9V3z" />} /> {started ? 'Show all steps' : 'Start navigation'}
        </button>
      </div>
    </div>
  );
}