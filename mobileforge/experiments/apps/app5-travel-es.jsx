function App() {
  const { useState } = React;
  const CATS = ['Destacados', 'Playa', 'Ciudad', 'Montaña'];
  const TRIPS = [
    ['Barcelona', 'España · 4 noches', 'Ciudad', 320, 4.8, '🏛️'],
    ['Santorini', 'Grecia · 5 noches', 'Playa', 540, 4.9, '🏖️'],
    ['Tokio', 'Japón · 7 noches', 'Ciudad', 890, 4.9, '🗼'],
    ['Los Alpes', 'Suiza · 3 noches', 'Montaña', 410, 4.7, '🏔️'],
    ['Cancún', 'México · 6 noches', 'Playa', 470, 4.6, '🌴'],
  ];
  const [cat, setCat] = useState('Destacados');
  const [tab, setTab] = useState(0);
  const [saved, setSaved] = useState({});
  const toggle = n => setSaved(s => ({ ...s, [n]: !s[n] }));
  const shown = cat === 'Destacados' ? TRIPS.filter(t => t[4] >= 4.7) : TRIPS.filter(t => t[2] === cat);

  return (
    <div className="app-shell">
      <style>{`:root{--c-from:#0EA5E9;--c-to:#0E7490;--c-primary:#0891B2;--c-primary-light:rgba(14,165,233,0.1);--c-bg:#f1fbfe;--c-font:'Inter',system-ui,sans-serif;}`}</style>
      <div className="header-gradient" style={{ borderRadius: '0 0 24px 24px' }}>
        <p className="caption" style={{ color: 'rgba(255,255,255,0.85)', margin: 0 }}>Hola, Sofía 👋</p>
        <h1 className="subtitle" style={{ margin: '2px 0 6px', color: '#fff' }}>¿A dónde vamos?</h1>
        <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 12, padding: '10px 14px', color: '#fff', fontSize: 13 }}>🔍 Buscar destinos, hoteles…</div>
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
              <button onClick={() => toggle(t[0])} style={{ position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderRadius: 999, border: 'none', background: 'rgba(255,255,255,0.9)', fontSize: 16, cursor: 'pointer' }}>{saved[t[0]] ? '❤️' : '🤍'}</button>
            </div>
            <div style={{ padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{t[0]}</div>
                <div style={{ color: '#8a8a8f', fontSize: 12, marginTop: 2 }}>{t[1]} · ★ {t[4]}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, color: 'var(--c-primary)', fontSize: 16 }}>{t[3]}€</div>
                <div style={{ color: '#8a8a8f', fontSize: 10 }}>por persona</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="app-nav">
        {['Explorar', 'Favoritos', 'Reservas', 'Perfil'].map((t, i) => (
          <button key={t} className={'nav-tab' + (tab === i ? ' active' : '')} onClick={() => setTab(i)}>{t}</button>
        ))}
      </div>
    </div>
  );
}