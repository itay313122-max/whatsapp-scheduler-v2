function App() {
  const { useState } = React;
  const [period, setPeriod] = useState('7D');
  // smooth line path
  const pts = [38, 30, 44, 34, 52, 46, 64, 58, 72];
  const W = 300, H = 120, max = 80;
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${(i / (pts.length - 1)) * W} ${H - (p / max) * H}`).join(' ');
  const area = `${path} L ${W} ${H} L 0 ${H} Z`;
  const KPIS = [
    ['Revenue', '$48.2k', '+12.4%', true],
    ['Active users', '8,419', '+5.1%', true],
    ['Churn', '1.8%', '-0.3%', true],
    ['Avg. session', '6m 12s', '-4.0%', false],
  ];
  const CH = [['Direct', 42], ['Organic', 31], ['Referral', 16], ['Social', 11]];

  return (
    <div className="app-shell" style={{ background: '#0c0c0e' }}>
      <style>{`:root{--c-bg:#0c0c0e;--c-font:'Inter',system-ui,sans-serif;}`}</style>
      <div className="app-content" style={{ background: '#0c0c0e', padding: '0 20px', gap: 0 }}>
        {/* top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 'calc(22px + env(safe-area-inset-top,0px))' }}>
          <div>
            <div style={{ color: '#71717a', fontSize: 12 }}>Overview · June 2026</div>
            <div style={{ color: '#fafafa', fontSize: 20, fontWeight: 700, letterSpacing: -0.3 }}>Dashboard</div>
          </div>
          <div style={{ width: 38, height: 38, borderRadius: 11, border: '1px solid #232327', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a1a1aa' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
          </div>
        </div>
        {/* hero chart card */}
        <div style={{ marginTop: 22, background: '#141417', border: '1px solid #1f1f23', borderRadius: 20, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: '#71717a', fontSize: 12 }}>Total revenue</div>
              <div style={{ color: '#fafafa', fontSize: 30, fontWeight: 700, letterSpacing: -0.8, marginTop: 2 }}>$48,210</div>
            </div>
            <div style={{ display: 'flex', gap: 4, background: '#0c0c0e', borderRadius: 10, padding: 3 }}>
              {['7D', '30D', '90D'].map(p => (
                <button key={p} onClick={() => setPeriod(p)} style={{ border: 'none', cursor: 'pointer', borderRadius: 8, padding: '5px 10px', fontSize: 11, fontWeight: 600, color: period === p ? '#0c0c0e' : '#a1a1aa', background: period === p ? '#c4f042' : 'transparent' }}>{p}</button>
              ))}
            </div>
          </div>
          <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ marginTop: 14, display: 'block' }} preserveAspectRatio="none" height="120">
            <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#c4f042" stopOpacity="0.25" /><stop offset="1" stopColor="#c4f042" stopOpacity="0" /></linearGradient></defs>
            <path d={area} fill="url(#g)" />
            <path d={path} fill="none" stroke="#c4f042" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        {/* KPI grid 2x2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
          {KPIS.map(k => (
            <div key={k[0]} style={{ background: '#141417', border: '1px solid #1f1f23', borderRadius: 16, padding: 16 }}>
              <div style={{ color: '#71717a', fontSize: 12 }}>{k[0]}</div>
              <div style={{ color: '#fafafa', fontSize: 22, fontWeight: 700, letterSpacing: -0.5, marginTop: 6 }}>{k[1]}</div>
              <div style={{ color: k[3] ? '#a3e635' : '#f87171', fontSize: 12, fontWeight: 600, marginTop: 4 }}>{k[2]}</div>
            </div>
          ))}
        </div>
        {/* channels — horizontal bars */}
        <div style={{ marginTop: 22 }}>
          <div style={{ color: '#fafafa', fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Traffic by channel</div>
          {CH.map(c => (
            <div key={c[0]} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#d4d4d8', fontSize: 13 }}>{c[0]}</span>
                <span style={{ color: '#71717a', fontSize: 13 }}>{c[1]}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: '#1f1f23' }}>
                <div style={{ width: c[1] + '%', height: '100%', borderRadius: 3, background: '#c4f042' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}