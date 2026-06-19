/**
 * Demo/mock responses for when all AI provider keys are placeholders.
 * Returns pre-built app code in the exact format parseGroqResponse expects:
 *   {JSON metadata}
 *   ===CODE===
 *   function App() { ... }
 *   ===END===
 */

interface DemoApp {
  keywords: string[];
  metadata: {
    appName: string;
    description: string;
    colorScheme: { primary: string; background: string; text: string; accent: string };
    features: string[];
    hebrewSummary: string;
  };
  code: string;
}

const CLOTHING_STORE: DemoApp = {
  keywords: ['חנות', 'בגדים', 'store', 'shop', 'clothes', 'clothing', 'fashion', 'אופנה'],
  metadata: {
    appName: 'StyleHub',
    description: 'חנות בגדים מעוצבת עם קטלוג, סל קניות וקופה',
    colorScheme: { primary: '#6C3AE8', background: '#F8F6FF', text: '#1A1A2E', accent: '#A78BFA' },
    features: ['קטלוג מוצרים עם 6 פריטים', 'סל קניות עם הוספה והסרה', 'מסך תשלום'],
    hebrewSummary: 'חנות בגדים מלאה עם קטלוג, ניהול סל קניות ומסך קופה',
  },
  code: `function App() {
  const { useState, useCallback, useMemo } = React;
  const [screen, setScreen] = useState('catalog');
  const [cart, setCart] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);

  const products = [
    { id: 1, name: 'חולצת כותנה', price: 89, emoji: '👕', color: 'לבן' },
    { id: 2, name: 'מכנסי ג\\'ינס', price: 199, emoji: '👖', color: 'כחול' },
    { id: 3, name: 'שמלת קיץ', price: 149, emoji: '👗', color: 'ורוד' },
    { id: 4, name: 'נעלי ספורט', price: 299, emoji: '👟', color: 'שחור' },
    { id: 5, name: 'כובע שמש', price: 59, emoji: '🧢', color: 'בז\\'' },
    { id: 6, name: 'תיק גב', price: 179, emoji: '🎒', color: 'ירוק' },
  ];

  const addToCart = useCallback((product) => {
    setCart(prev => [...prev, { ...product, cartId: Date.now() + Math.random() }]);
  }, []);

  const removeFromCart = useCallback((cartId) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  }, []);

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price, 0), [cart]);

  const CatalogScreen = () => (
    <>
      <div className="gradient-banner">
        <h2 className="title" style={{color:'white',margin:'0 0 6px'}}>StyleHub</h2>
        <p className="body" style={{color:'rgba(255,255,255,0.85)'}}>קולקציית קיץ חדשה!</p>
      </div>
      <p className="section-title">הקטלוג שלנו ({products.length} פריטים)</p>
      <div className="grid-2">
        {products.map(p => (
          <div key={p.id} className="card" style={{textAlign:'center'}}>
            <div style={{fontSize:40,marginBottom:8}}>{p.emoji}</div>
            <p className="subtitle" style={{fontSize:13,marginBottom:4}}>{p.name}</p>
            <p className="caption">{p.color}</p>
            <p className="subtitle" style={{color:'var(--c-primary)',margin:'8px 0'}}>₪{p.price}</p>
            <button className="btn-primary" style={{padding:'10px 0',fontSize:13}} onClick={() => addToCart(p)}>הוסף לסל</button>
          </div>
        ))}
      </div>
    </>
  );

  const CartScreen = () => (
    <>
      <p className="section-title">סל הקניות ({cart.length} פריטים)</p>
      {cart.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🛒</div>
          <p className="empty-state-title">הסל ריק</p>
          <p className="empty-state-body">הוסיפו פריטים מהקטלוג</p>
          <button className="btn-primary" style={{width:'auto',padding:'12px 24px'}} onClick={() => setScreen('catalog')}>לקטלוג</button>
        </div>
      ) : (
        <>
          {cart.map(item => (
            <div key={item.cartId} className="list-item">
              <div className="icon-circle" style={{fontSize:24}}>{item.emoji}</div>
              <div style={{flex:1}}>
                <p className="subtitle" style={{fontSize:14}}>{item.name}</p>
                <p className="caption">₪{item.price}</p>
              </div>
              <button className="btn-icon" style={{width:32,height:32,fontSize:16}} onClick={() => removeFromCart(item.cartId)}>✕</button>
            </div>
          ))}
          <div className="card" style={{marginTop:12}}>
            <div className="flex justify-between items-center" style={{marginBottom:14}}>
              <span className="subtitle">סה"כ לתשלום</span>
              <span className="title" style={{color:'var(--c-primary)',fontSize:22}}>₪{total}</span>
            </div>
            <button className="btn-primary" onClick={() => setShowCheckout(true)}>לקופה</button>
          </div>
        </>
      )}
      {showCheckout && (
        <div className="card" style={{marginTop:12,border:'2px solid var(--c-primary)'}}>
          <p className="subtitle" style={{marginBottom:12}}>אישור הזמנה</p>
          <p className="body">{cart.length} פריטים | סה"כ ₪{total}</p>
          <button className="btn-primary" style={{marginTop:12}} onClick={() => { setCart([]); setShowCheckout(false); alert('ההזמנה בוצעה בהצלחה! 🎉'); }}>אישור ותשלום</button>
          <button className="btn-secondary" style={{marginTop:8}} onClick={() => setShowCheckout(false)}>חזרה</button>
        </div>
      )}
    </>
  );

  const renderContent = () => {
    if (screen === 'catalog') return <CatalogScreen />;
    if (screen === 'cart') return <CartScreen />;
  };

  return (
    <>
      <style>{\`
        :root {
          --c-from:#6C3AE8; --c-to:#A78BFA;
          --c-primary:#6C3AE8; --c-primary-light:rgba(108,58,232,0.12);
          --c-bg:#F8F6FF;
        }
      \`}</style>
      <div className="app-shell" dir="rtl">
        <div className="app-header">
          <h1 className="subtitle">StyleHub 👗</h1>
          <button className="btn-icon" onClick={() => setScreen('cart')}>🛒 {cart.length > 0 && <span className="badge">{cart.length}</span>}</button>
        </div>
        <div className="app-content">{renderContent()}</div>
        <div className="app-nav">
          <button className={'nav-tab' + (screen === 'catalog' ? ' active' : '')} onClick={() => setScreen('catalog')}><span style={{fontSize:20}}>🏪</span>קטלוג</button>
          <button className={'nav-tab' + (screen === 'cart' ? ' active' : '')} onClick={() => setScreen('cart')}><span style={{fontSize:20}}>🛒</span>סל{cart.length > 0 ? \` (\${cart.length})\` : ''}</button>
        </div>
      </div>
    </>
  );
}`,
};

const TODO_APP: DemoApp = {
  keywords: ['todo', 'משימות', 'tasks', 'רשימה', 'task', 'list', 'משימה'],
  metadata: {
    appName: 'TaskFlow',
    description: 'מנהל משימות עם סינון, מחיקה ופס התקדמות',
    colorScheme: { primary: '#059669', background: '#F0FDF9', text: '#1A1A2E', accent: '#34D399' },
    features: ['הוספת משימות חדשות', 'סימון השלמה ומחיקה', 'סינון לפי סטטוס עם פס התקדמות'],
    hebrewSummary: 'אפליקציית משימות עם ניהול מלא, סינון וויזואליזציה של התקדמות',
  },
  code: `function App() {
  const { useState, useMemo } = React;
  const [tasks, setTasks] = useState([
    { id: 1, text: 'לקנות מצרכים מהסופר', done: false },
    { id: 2, text: 'לשלוח מייל ללקוח', done: true },
    { id: 3, text: 'לתאם פגישה ליום חמישי', done: false },
    { id: 4, text: 'לסיים את הדו"ח השבועי', done: false },
  ]);
  const [newTask, setNewTask] = useState('');
  const [filter, setFilter] = useState('all');

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks(prev => [...prev, { id: Date.now(), text: newTask.trim(), done: false }]);
    setNewTask('');
  };

  const toggleTask = (id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const deleteTask = (id) => setTasks(prev => prev.filter(t => t.id !== id));

  const filtered = useMemo(() => {
    if (filter === 'active') return tasks.filter(t => !t.done);
    if (filter === 'done') return tasks.filter(t => t.done);
    return tasks;
  }, [tasks, filter]);

  const doneCount = useMemo(() => tasks.filter(t => t.done).length, [tasks]);
  const progress = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  return (
    <>
      <style>{\`
        :root {
          --c-from:#059669; --c-to:#34D399;
          --c-primary:#059669; --c-primary-light:rgba(5,150,105,0.12);
          --c-bg:#F0FDF9;
        }
      \`}</style>
      <div className="app-shell" dir="rtl">
        <div className="app-header">
          <div>
            <h1 className="subtitle">TaskFlow ✓</h1>
            <p className="caption">{doneCount}/{tasks.length} הושלמו</p>
          </div>
        </div>
        <div className="app-content">
          <div className="card">
            <p className="caption" style={{marginBottom:6}}>התקדמות</p>
            <div style={{width:'100%',height:12,borderRadius:6,background:'var(--c-primary-light)',overflow:'hidden'}}>
              <div style={{width:progress+'%',height:'100%',borderRadius:6,background:'linear-gradient(90deg,var(--c-from),var(--c-to))',transition:'width 0.3s'}}></div>
            </div>
            <p className="caption" style={{marginTop:4,textAlign:'left'}}>{progress}%</p>
          </div>

          <div className="flex gap-2">
            <input className="input-field" style={{flex:1}} placeholder="משימה חדשה..." value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()} />
            <button className="btn-primary" style={{width:'auto',padding:'0 20px',whiteSpace:'nowrap'}} onClick={addTask}>הוסף</button>
          </div>

          <div className="flex gap-2">
            {[{id:'all',label:'הכל'},{id:'active',label:'פעילות'},{id:'done',label:'הושלמו'}].map(f => (
              <button key={f.id} className={filter === f.id ? 'btn-primary' : 'btn-secondary'} style={{flex:1,padding:'10px 0',fontSize:13}} onClick={() => setFilter(f.id)}>{f.label}</button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <p className="empty-state-title">{filter === 'done' ? 'אין משימות שהושלמו' : filter === 'active' ? 'כל המשימות הושלמו!' : 'אין משימות'}</p>
              <p className="empty-state-body">הוסיפו משימה חדשה למעלה</p>
            </div>
          ) : (
            filtered.map(task => (
              <div key={task.id} className="list-item">
                <button className="btn-icon" style={{width:32,height:32,fontSize:18,background:task.done?'var(--c-primary)':'transparent',border:task.done?'none':'2px solid #ccc',color:task.done?'white':'transparent',borderRadius:'50%'}} onClick={() => toggleTask(task.id)}>✓</button>
                <p className="body" style={{flex:1,textDecoration:task.done?'line-through':'none',opacity:task.done?0.5:1}}>{task.text}</p>
                <button className="btn-icon" style={{width:32,height:32,fontSize:14,color:'#ef4444'}} onClick={() => deleteTask(task.id)}>🗑️</button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}`,
};

const CALCULATOR_APP: DemoApp = {
  keywords: [],
  metadata: {
    appName: 'CalcPro',
    description: 'מחשבון מעוצב עם פעולות בסיסיות',
    colorScheme: { primary: '#2563EB', background: '#F0F4FF', text: '#1A1A2E', accent: '#60A5FA' },
    features: ['חיבור, חיסור, כפל וחילוק', 'תצוגת היסטוריה', 'ממשק נקי ונוח'],
    hebrewSummary: 'מחשבון מקצועי עם ממשק מודרני וכפתורים נוחים',
  },
  code: `function App() {
  const { useState, useCallback } = React;
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState(null);
  const [op, setOp] = useState(null);
  const [fresh, setFresh] = useState(true);
  const [history, setHistory] = useState([]);
  const [screen, setScreen] = useState('calc');

  const input = useCallback((val) => {
    if (fresh) { setDisplay(val); setFresh(false); }
    else setDisplay(prev => prev === '0' ? val : prev + val);
  }, [fresh]);

  const inputDot = useCallback(() => {
    if (fresh) { setDisplay('0.'); setFresh(false); return; }
    if (!display.includes('.')) setDisplay(prev => prev + '.');
  }, [fresh, display]);

  const chooseOp = useCallback((nextOp) => {
    if (prev !== null && op && !fresh) {
      const result = calc(parseFloat(prev), parseFloat(display), op);
      setDisplay(String(result));
      setPrev(String(result));
    } else {
      setPrev(display);
    }
    setOp(nextOp);
    setFresh(true);
  }, [prev, op, display, fresh]);

  const calc = (a, b, operator) => {
    if (operator === '+') return a + b;
    if (operator === '-') return a - b;
    if (operator === '×') return a * b;
    if (operator === '÷') return b !== 0 ? a / b : 0;
    return b;
  };

  const equals = useCallback(() => {
    if (prev === null || !op) return;
    const result = calc(parseFloat(prev), parseFloat(display), op);
    const entry = prev + ' ' + op + ' ' + display + ' = ' + parseFloat(result.toFixed(8));
    setHistory(h => [entry, ...h].slice(0, 10));
    setDisplay(String(parseFloat(result.toFixed(8))));
    setPrev(null);
    setOp(null);
    setFresh(true);
  }, [prev, op, display]);

  const clear = useCallback(() => { setDisplay('0'); setPrev(null); setOp(null); setFresh(true); }, []);

  const btnStyle = { minHeight: 52, fontSize: 20, borderRadius: 16, border: 'none', fontWeight: 700, cursor: 'pointer' };

  const CalcScreen = () => (
    <>
      <div className="card" style={{marginBottom:12}}>
        <p className="caption" style={{textAlign:'left',minHeight:18}}>{prev ? prev + ' ' + op : ''}</p>
        <p className="title" style={{textAlign:'left',fontSize:36,margin:'8px 0 0',wordBreak:'break-all'}}>{display}</p>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
        <button style={{...btnStyle,background:'#fee2e2',color:'#dc2626'}} onClick={clear}>C</button>
        <button style={{...btnStyle,background:'var(--c-primary-light)',color:'var(--c-primary)'}} onClick={() => chooseOp('÷')}>÷</button>
        <button style={{...btnStyle,background:'var(--c-primary-light)',color:'var(--c-primary)'}} onClick={() => chooseOp('×')}>×</button>
        <button style={{...btnStyle,background:'var(--c-primary-light)',color:'var(--c-primary)'}} onClick={() => chooseOp('-')}>-</button>
        {['7','8','9'].map(n => <button key={n} style={{...btnStyle,background:'white',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}} onClick={() => input(n)}>{n}</button>)}
        <button style={{...btnStyle,background:'var(--c-primary-light)',color:'var(--c-primary)'}} onClick={() => chooseOp('+')}>+</button>
        {['4','5','6'].map(n => <button key={n} style={{...btnStyle,background:'white',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}} onClick={() => input(n)}>{n}</button>)}
        <button style={{...btnStyle,background:'linear-gradient(135deg,var(--c-from),var(--c-to))',color:'white',gridRow:'span 2'}} onClick={equals}>=</button>
        {['1','2','3'].map(n => <button key={n} style={{...btnStyle,background:'white',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}} onClick={() => input(n)}>{n}</button>)}
        <button style={{...btnStyle,background:'white',boxShadow:'0 2px 8px rgba(0,0,0,0.06)',gridColumn:'span 2'}} onClick={() => input('0')}>0</button>
        <button style={{...btnStyle,background:'white',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}} onClick={inputDot}>.</button>
      </div>
    </>
  );

  const HistoryScreen = () => (
    <>
      <p className="section-title">היסטוריית חישובים</p>
      {history.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🧮</div>
          <p className="empty-state-title">אין היסטוריה</p>
          <p className="empty-state-body">בצעו חישוב ראשון</p>
          <button className="btn-primary" style={{width:'auto',padding:'12px 24px'}} onClick={() => setScreen('calc')}>למחשבון</button>
        </div>
      ) : (
        history.map((entry, i) => (
          <div key={i} className="list-item">
            <div className="icon-circle" style={{fontSize:16,width:36,height:36}}>🔢</div>
            <p className="body" style={{flex:1,fontFamily:'monospace',fontSize:15}}>{entry}</p>
          </div>
        ))
      )}
    </>
  );

  const renderContent = () => {
    if (screen === 'calc') return <CalcScreen />;
    if (screen === 'history') return <HistoryScreen />;
  };

  return (
    <>
      <style>{\`
        :root {
          --c-from:#2563EB; --c-to:#60A5FA;
          --c-primary:#2563EB; --c-primary-light:rgba(37,99,235,0.1);
          --c-bg:#F0F4FF;
        }
      \`}</style>
      <div className="app-shell" dir="rtl">
        <div className="app-header">
          <h1 className="subtitle">CalcPro 🧮</h1>
        </div>
        <div className="app-content">{renderContent()}</div>
        <div className="app-nav">
          <button className={'nav-tab' + (screen === 'calc' ? ' active' : '')} onClick={() => setScreen('calc')}><span style={{fontSize:20}}>🔢</span>מחשבון</button>
          <button className={'nav-tab' + (screen === 'history' ? ' active' : '')} onClick={() => setScreen('history')}><span style={{fontSize:20}}>📋</span>היסטוריה</button>
        </div>
      </div>
    </>
  );
}`,
};

const DEMO_APPS: DemoApp[] = [CLOTHING_STORE, TODO_APP, CALCULATOR_APP];

/**
 * Returns a complete AI response in the format parseGroqResponse expects.
 * Matches prompt keywords to pick the best demo app; falls back to calculator.
 */
export function getDemoResponse(prompt: string): string {
  const lower = prompt.toLowerCase();

  let match = DEMO_APPS.find(app =>
    app.keywords.length > 0 && app.keywords.some(kw => lower.includes(kw))
  );

  // Fallback to calculator (last app, which has empty keywords)
  if (!match) {
    match = CALCULATOR_APP;
  }

  const metaJson = JSON.stringify(match.metadata);
  return `${metaJson}\n===CODE===\n${match.code}\n===END===`;
}
