function App() {
  const { useState } = React;
  const CATS = ['مميّز', 'شاطئ', 'مدينة', 'جبل'];
  const TRIPS = [
    ['برشلونة', 'إسبانيا · 4 ليالٍ', 'مدينة', 320, 4.8, '🏛️'],
    ['سانتوريني', 'اليونان · 5 ليالٍ', 'شاطئ', 540, 4.9, '🏖️'],
    ['طوكيو', 'اليابان · 7 ليالٍ', 'مدينة', 890, 4.9, '🗼'],
    ['جبال الألب', 'سويسرا · 3 ليالٍ', 'جبل', 410, 4.7, '🏔️'],
    ['كانكون', 'المكسيك · 6 ليالٍ', 'شاطئ', 470, 4.6, '🌴'],
  ];
  const [cat, setCat] = useState('مميّز');
  const [tab, setTab] = useState(0);
  const [saved, setSaved] = useState({});
  const toggle = n => setSaved(s => ({ ...s, [n]: !s[n] }));
  const shown = cat === 'مميّز' ? TRIPS.filter(t => t[4] >= 4.7) : TRIPS.filter(t => t[2] === cat);

  return (
    <div className="app-shell" dir="rtl">
      <style>{`:root{--c-from:#0EA5E9;--c-to:#0E7490;--c-primary:#0891B2;--c-primary-light:rgba(14,165,233,0.1);--c-bg:#f1fbfe;--c-font:'Heebo','Segoe UI',system-ui,sans-serif;}`}</style>
      <div className="header-gradient" style={{ borderRadius: '0 0 24px 24px' }}>
        <p className="caption" style={{ color: 'rgba(255,255,255,0.85)', margin: 0 }}>مرحبًا، سارة 👋</p>
        <h1 className="subtitle" style={{ margin: '2px 0 6px', color: '#fff' }}>إلى أين نسافر؟</h1>
        <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 12, padding: '10px 14px', color: '#fff', fontSize: 13 }}>🔍 ابحث عن وجهات وفنادق…</div>
      </div>
      <div className="app-content">
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {CATS.map(c => (
            <button key={c} className={cat === c ? 'chip' : 'chip-outline'} style={{ flexShrink: 0 }} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
        {shown.map(t => (
          <div key={t[0]} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ height: 96, background: 'linear-gradient(135deg,var(--c-from),var(--c-to))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 46, position: 'relative' }}>
              {t[5]}
              <button onClick={() => toggle(t[0])} style={{ position: 'absolute', top: 10, left: 10, width: 34, height: 34, borderRadius: 999, border: 'none', background: 'rgba(255,255,255,0.9)', fontSize: 16, cursor: 'pointer' }}>{saved[t[0]] ? '❤️' : '🤍'}</button>
            </div>
            <div style={{ padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{t[0]}</div>
                <div style={{ color: '#8a8a8f', fontSize: 12, marginTop: 2 }}>{t[1]} · ★ {t[4]}</div>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 800, color: 'var(--c-primary)', fontSize: 16 }}>{t[3]}€</div>
                <div style={{ color: '#8a8a8f', fontSize: 10 }}>للشخص</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="app-nav">
        {['استكشف', 'المفضّلة', 'حجوزاتي', 'حسابي'].map((t, i) => (
          <button key={t} className={'nav-tab' + (tab === i ? ' active' : '')} onClick={() => setTab(i)}>{t}</button>
        ))}
      </div>
    </div>
  );
}