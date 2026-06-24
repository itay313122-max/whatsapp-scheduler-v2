function App() {
  const { useState } = React;
  const Icon = ({ d, s = 20, sw = 1.7 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
  );
  const TX = [
    ['Figma', 'Subscription', -15, 'FG'],
    ['Salary — Acme Inc.', 'Income', 4200, 'AC'],
    ['Whole Foods', 'Groceries', -86.4, 'WF'],
    ['Transfer to Maya', 'Sent', -120, 'MA'],
    ['Apple Store', 'Electronics', -349, 'AP'],
    ['Spotify', 'Subscription', -10.99, 'SP'],
  ];
  const [seg, setSeg] = useState('All');
  const shown = seg === 'All' ? TX : seg === 'In' ? TX.filter(t => t[2] > 0) : TX.filter(t => t[2] < 0);
  const fmt = v => (v < 0 ? '-' : '+') + '$' + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="app-shell" style={{ background: '#ffffff' }}>
      <style>{`:root{--c-bg:#ffffff;--c-font:'Inter',system-ui,sans-serif;}`}</style>
      <div className="app-content" style={{ gap: 0, padding: '0 22px', background: '#fff' }}>
        {/* top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 'calc(20px + env(safe-area-inset-top,0px))' }}>
          <div>
            <div style={{ color: '#9ca3af', fontSize: 13 }}>Good afternoon</div>
            <div style={{ color: '#0a0a0a', fontSize: 17, fontWeight: 600 }}>Daniel Cohen</div>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 999, background: '#111', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 14 }}>DC</div>
        </div>
        {/* balance — no gradient, pure typographic hierarchy */}
        <div style={{ marginTop: 34 }}>
          <div style={{ color: '#9ca3af', fontSize: 13, letterSpacing: 0.2 }}>Total balance</div>
          <div style={{ color: '#0a0a0a', fontSize: 44, fontWeight: 700, letterSpacing: -1.5, marginTop: 4 }}>$12,840<span style={{ color: '#c7c7cc' }}>.55</span></div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, color: '#16a34a', fontSize: 13, fontWeight: 600 }}>
            <Icon s={15} d={<path d="M7 17L17 7M17 7H9M17 7V15" />} /> 3.2% this month
          </div>
        </div>
        {/* quick actions — outlined, restrained */}
        <div style={{ display: 'flex', gap: 10, marginTop: 26 }}>
          {[['Send', <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />], ['Request', <path d="M12 5v14M5 12h14" />], ['Cards', <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></>], ['More', <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>]].map(([label, d]) => (
            <div key={label} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ height: 52, borderRadius: 16, border: '1px solid #ececec', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a0a0a' }}>
                <Icon d={d} />
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 7 }}>{label}</div>
            </div>
          ))}
        </div>
        {/* segmented control */}
        <div style={{ display: 'flex', gap: 24, marginTop: 32, borderBottom: '1px solid #f0f0f0' }}>
          {['All', 'In', 'Out'].map(s => (
            <button key={s} onClick={() => setSeg(s)} style={{ background: 'none', border: 'none', padding: '0 0 12px', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: seg === s ? '#0a0a0a' : '#b0b0b5', borderBottom: seg === s ? '2px solid #0a0a0a' : '2px solid transparent', marginBottom: -1 }}>{s === 'In' ? 'Income' : s === 'Out' ? 'Spending' : 'All'}</button>
          ))}
        </div>
        {/* transactions — clean rows, dividers not cards */}
        <div style={{ marginTop: 8 }}>
          {shown.map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 0', borderBottom: i < shown.length - 1 ? '1px solid #f4f4f5' : 'none' }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: '#f4f4f5', color: '#52525b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 12, flexShrink: 0 }}>{t[3]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#18181b' }}>{t[0]}</div>
                <div style={{ fontSize: 12, color: '#a1a1aa', marginTop: 1 }}>{t[1]}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: t[2] > 0 ? '#16a34a' : '#18181b' }}>{fmt(t[2])}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}