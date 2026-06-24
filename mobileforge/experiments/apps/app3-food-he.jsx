function App() {
  const { useState } = React;
  const CATS = ['פופולרי', 'המבורגרים', 'פיצה', 'סושי', 'משקאות'];
  const ITEMS = [
    ['צ׳יזבורגר קלאסי', 'בקר, צ׳דר, רוטב הבית', 49, 'המבורגרים', 4.8],
    ['בורגר בייקון כפול', 'שתי קציצות, בייקון פריך', 62, 'המבורגרים', 4.9],
    ['פיצה מרגריטה', 'עגבניות סן מרצאנו, מוצרלה, בזיליקום', 54, 'פיצה', 4.7],
    ['פיצה פפרוני', 'פפרוני נדיב, אורגנו', 58, 'פיצה', 4.8],
    ['ניגירי סלמון (6 יח׳)', 'סלמון אטלנטי טרי', 44, 'סושי', 4.9],
    ['דראגון רול', 'צלופח, אבוקדו, טוביקו', 66, 'סושי', 4.6],
    ['לימונדה טרייה', 'סחוטה ביד, נענע', 18, 'משקאות', 4.5],
  ];
  const [cat, setCat] = useState('פופולרי');
  const [tab, setTab] = useState(0);
  const [cart, setCart] = useState({});
  const add = n => setCart(c => ({ ...c, [n]: (c[n] || 0) + 1 }));
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const total = ITEMS.reduce((s, i) => s + (cart[i[0]] || 0) * i[2], 0);
  const shown = cat === 'פופולרי' ? ITEMS.filter(i => i[4] >= 4.7) : ITEMS.filter(i => i[3] === cat);

  return (
    <div className="app-shell" dir="rtl">
      <style>{`:root{--c-from:#7C3AED;--c-to:#5B21B6;--c-primary:#7C3AED;--c-primary-light:rgba(124,58,237,0.1);--c-bg:#faf7ff;--c-font:'Heebo',system-ui,sans-serif;}`}</style>
      <div className="header-gradient" style={{ borderRadius: '0 0 24px 24px' }}>
        <p className="caption" style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>משלוח תוך 25–35 דק׳ · 4.8 ★</p>
        <h1 className="subtitle" style={{ margin: '2px 0 0', color: '#fff' }}>פוד-דאש</h1>
      </div>
      <div className="app-content">
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {CATS.map(c => (
            <button key={c} className={cat === c ? 'chip' : 'chip-outline'} style={{ flexShrink: 0 }} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg,var(--c-from),var(--c-to))', color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 28 }}>🚀</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14 }}>משלוח חינם השבוע</div>
            <div style={{ fontSize: 11, opacity: 0.85 }}>בכל הזמנה מעל ₪80 — בלי קוד</div>
          </div>
        </div>
        {shown.map(i => (
          <div key={i[0]} className="card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--c-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>🍽️</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{i[0]}</div>
              <div style={{ color: '#8a8a8f', fontSize: 11, marginTop: 2 }}>{i[1]}</div>
              <div style={{ marginTop: 4, fontWeight: 800, color: 'var(--c-primary)' }}>₪{i[2]} <span style={{ color: '#f59e0b', fontSize: 11, fontWeight: 600 }}>★ {i[4]}</span></div>
            </div>
            <button className="btn-primary" style={{ width: 38, height: 38, borderRadius: 12, padding: 0, fontSize: 20, flexShrink: 0 }} onClick={() => add(i[0])}>+</button>
          </div>
        ))}
      </div>
      {count > 0 && (
        <div style={{ position: 'absolute', left: 16, right: 16, bottom: 92, background: 'var(--c-primary)', color: '#fff', borderRadius: 16, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 30px rgba(124,58,237,0.4)' }}>
          <span style={{ fontWeight: 700 }}>{count} פריטים</span>
          <span style={{ fontWeight: 800 }}>₪{total} · לתשלום</span>
        </div>
      )}
      <div className="app-nav">
        {['תפריט', 'חיפוש', 'הזמנות', 'פרופיל'].map((t, i) => (
          <button key={t} className={'nav-tab' + (tab === i ? ' active' : '')} onClick={() => setTab(i)}>{t}</button>
        ))}
      </div>
    </div>
  );
}