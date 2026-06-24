function App() {
  const { useState, useEffect } = React;
  const WORKOUTS = [
    ['Full Body Burn', '32 min · 8 exercises', 0.0],
    ['Core Crusher', '18 min · 6 exercises', 0.0],
    ['Upper Strength', '40 min · 10 exercises', 0.0],
    ['HIIT Cardio', '25 min · intervals', 0.0],
  ];
  const [tab, setTab] = useState(0);
  const [running, setRunning] = useState(false);
  const [sec, setSec] = useState(0);
  const goal = 45 * 60; // 45 min daily goal
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSec(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  const pct = Math.min(1, sec / goal);
  const R = 52, C = 2 * Math.PI * R;
  const mm = String(Math.floor(sec / 60)).padStart(2, '0');
  const ss = String(sec % 60).padStart(2, '0');

  return (
    <div className="app-shell">
      <style>{`:root{--c-from:#3B82F6;--c-to:#1E3A8A;--c-primary:#60A5FA;--c-primary-light:rgba(96,165,250,0.16);--c-bg:#0b0f1a;--c-surface:#151b2b;--c-border:#252d40;--c-text:#f1f5f9;--c-text-2:#94a3b8;--c-text-3:#64748b;--c-font:'Inter',system-ui,sans-serif;}`}</style>
      <div className="header-gradient" style={{ borderRadius: '0 0 24px 24px' }}>
        <p className="caption" style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>Good morning, Alex 👋</p>
        <h1 className="subtitle" style={{ margin: '2px 0 0', color: '#fff' }}>Today's Training</h1>
      </div>
      <div className="app-content">
        {/* Live progress ring + timer — the added feature */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <svg width="128" height="128" viewBox="0 0 128 128" style={{ flexShrink: 0 }}>
            <circle cx="64" cy="64" r={R} fill="none" stroke="var(--c-primary-light)" strokeWidth="10" />
            <circle cx="64" cy="64" r={R} fill="none" stroke="var(--c-primary)" strokeWidth="10" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - pct)} transform="rotate(-90 64 64)" />
            <text x="64" y="60" textAnchor="middle" fontSize="22" fontWeight="800" fill="#f1f5f9">{mm}:{ss}</text>
            <text x="64" y="80" textAnchor="middle" fontSize="10" fill="#94a3b8">{Math.round(pct * 100)}% of goal</text>
          </svg>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 2 }}>Daily Goal</div>
            <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 10 }}>45 min of active training</div>
            <button className="btn-primary" style={{ width: '100%' }} onClick={() => setRunning(r => !r)}>
              {running ? '⏸ Pause' : sec ? '▶ Resume' : '▶ Start workout'}
            </button>
          </div>
        </div>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#94a3b8', margin: '4px 2px' }}>Recommended for you</div>
        {WORKOUTS.map(w => (
          <div key={w[0]} className="card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--c-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>💪</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{w[0]}</div>
              <div style={{ color: '#8a8a8f', fontSize: 11, marginTop: 2 }}>{w[1]}</div>
            </div>
            <button className="btn-secondary" style={{ width: 'auto', padding: '8px 16px', fontSize: 13, flexShrink: 0, whiteSpace: 'nowrap', minHeight: 38 }}>Start</button>
          </div>
        ))}
      </div>
      <div className="app-nav">
        {['Home', 'Plans', 'Stats', 'Profile'].map((t, i) => (
          <button key={t} className={'nav-tab' + (tab === i ? ' active' : '')} onClick={() => setTab(i)}>{t}</button>
        ))}
      </div>
    </div>
  );
}