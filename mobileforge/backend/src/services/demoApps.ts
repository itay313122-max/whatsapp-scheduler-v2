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
    colorScheme: { primary: '#000000', background: '#ffffff', text: '#111827', accent: '#6B7280' },
    features: ['קטלוג מוצרים עם 6 פריטים', 'סל קניות עם הוספה והסרה', 'מסך תשלום'],
    hebrewSummary: 'חנות בגדים מלאה עם קטלוג, ניהול סל קניות ומסך קופה',
  },
  code: `function App() {
  const { useState, useCallback, useMemo } = React;
  const [screen, setScreen] = useState('catalog');
  const [cart, setCart] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);

  const Icon = ({d, size=20, fill='none', stroke='currentColor', sw=1.5}) =>
    React.createElement('svg', {width:size,height:size,viewBox:'0 0 24 24',fill,stroke,strokeWidth:sw,strokeLinecap:'round',strokeLinejoin:'round'}, React.createElement('path', {d}));

  const ShoppingBagIcon = ({size=20}) => React.createElement('svg', {width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.5,strokeLinecap:'round',strokeLinejoin:'round'}, React.createElement('path', {d:'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z'}), React.createElement('path', {d:'M3 6h18'}), React.createElement('path', {d:'M16 10a4 4 0 01-8 0'}));

  const CartIcon = ({size=20}) => React.createElement('svg', {width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.5,strokeLinecap:'round',strokeLinejoin:'round'}, React.createElement('path', {d:'M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6'}), React.createElement('circle', {cx:9,cy:21,r:1}), React.createElement('circle', {cx:20,cy:21,r:1}));

  const StoreIcon = ({size=20}) => React.createElement('svg', {width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.5,strokeLinecap:'round',strokeLinejoin:'round'}, React.createElement('path', {d:'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z'}), React.createElement('path', {d:'M9 22V12h6v10'}));

  const XIcon = ({size=16}) => React.createElement('svg', {width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'}, React.createElement('path', {d:'M18 6L6 18'}), React.createElement('path', {d:'M6 6l12 12'}));

  const HangerIcon = ({size=20}) => React.createElement('svg', {width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.5,strokeLinecap:'round',strokeLinejoin:'round'}, React.createElement('path', {d:'M12 2a3 3 0 00-1 5.83V9l-8 6.5V18a2 2 0 002 2h14a2 2 0 002-2v-2.5L13 9V7.83A3 3 0 0012 2z'}));

  const placeholderImg = (label, color1, color2) =>
    'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect fill="' + color1 + '" width="200" height="200"/><rect fill="' + color2 + '" x="50" y="50" width="100" height="100" rx="12"/><text x="100" y="108" text-anchor="middle" fill="#9ca3af" font-family="system-ui" font-size="12">' + label + '</text></svg>');

  const products = [
    { id: 1, name: 'חולצת כותנה', price: 89, img: placeholderImg('Shirt','#f3f4f6','#e5e7eb'), color: 'לבן' },
    { id: 2, name: 'מכנסי ג\\'ינס', price: 199, img: placeholderImg('Jeans','#dbeafe','#bfdbfe'), color: 'כחול' },
    { id: 3, name: 'שמלת קיץ', price: 149, img: placeholderImg('Dress','#fce7f3','#fbcfe8'), color: 'ורוד' },
    { id: 4, name: 'נעלי ספורט', price: 299, img: placeholderImg('Shoes','#f3f4f6','#d1d5db'), color: 'שחור' },
    { id: 5, name: 'כובע שמש', price: 59, img: placeholderImg('Hat','#fef3c7','#fde68a'), color: 'בז\\'' },
    { id: 6, name: 'תיק גב', price: 179, img: placeholderImg('Bag','#d1fae5','#a7f3d0'), color: 'ירוק' },
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
      <div style={{background:'#000',padding:'20px 16px',borderRadius:12,marginBottom:16}}>
        <h2 className="title" style={{color:'white',margin:'0 0 6px',fontSize:20,letterSpacing:2,textTransform:'uppercase'}}>StyleHub</h2>
        <p className="body" style={{color:'rgba(255,255,255,0.7)',fontSize:13}}>New Summer Collection</p>
      </div>
      <p className="section-title">{products.length} Items</p>
      <div className="grid-2">
        {products.map(p => (
          <div key={p.id} className="card" style={{textAlign:'center',padding:0,overflow:'hidden'}}>
            <img src={p.img} style={{width:'100%',height:120,objectFit:'cover',display:'block'}} alt={p.name} />
            <div style={{padding:'10px 12px 14px'}}>
              <p className="subtitle" style={{fontSize:13,marginBottom:2}}>{p.name}</p>
              <p className="caption" style={{fontSize:11}}>{p.color}</p>
              <p className="subtitle" style={{color:'var(--c-primary)',margin:'8px 0',fontSize:15,fontWeight:700}}>{p.price} ILS</p>
              <button className="btn-primary" style={{padding:'10px 0',fontSize:13}} onClick={() => addToCart(p)}>Add to Cart</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  const CartScreen = () => (
    <>
      <p className="section-title">Cart ({cart.length} items)</p>
      {cart.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon" style={{fontSize:'inherit'}}><CartIcon size={48} /></div>
          <p className="empty-state-title">Your cart is empty</p>
          <p className="empty-state-body">Browse the catalog to add items</p>
          <button className="btn-primary" style={{width:'auto',padding:'12px 24px'}} onClick={() => setScreen('catalog')}>Browse</button>
        </div>
      ) : (
        <>
          {cart.map(item => (
            <div key={item.cartId} className="list-item">
              <div style={{width:40,height:40,borderRadius:8,overflow:'hidden',flexShrink:0}}>
                <img src={item.img} style={{width:'100%',height:'100%',objectFit:'cover'}} alt={item.name} />
              </div>
              <div style={{flex:1}}>
                <p className="subtitle" style={{fontSize:14}}>{item.name}</p>
                <p className="caption">{item.price} ILS</p>
              </div>
              <button className="btn-icon" style={{width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={() => removeFromCart(item.cartId)}><XIcon size={14} /></button>
            </div>
          ))}
          <div className="card" style={{marginTop:12}}>
            <div className="flex justify-between items-center" style={{marginBottom:14}}>
              <span className="subtitle">Total</span>
              <span className="title" style={{color:'var(--c-primary)',fontSize:22}}>{total} ILS</span>
            </div>
            <button className="btn-primary" onClick={() => setShowCheckout(true)}>Checkout</button>
          </div>
        </>
      )}
      {showCheckout && (
        <div className="card" style={{marginTop:12,border:'2px solid var(--c-primary)'}}>
          <p className="subtitle" style={{marginBottom:12}}>Confirm Order</p>
          <p className="body">{cart.length} items | Total {total} ILS</p>
          <button className="btn-primary" style={{marginTop:12}} onClick={() => { setCart([]); setShowCheckout(false); alert('Order placed successfully!'); }}>Confirm Payment</button>
          <button className="btn-secondary" style={{marginTop:8}} onClick={() => setShowCheckout(false)}>Back</button>
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
          --c-from:#000000; --c-to:#6B7280;
          --c-primary:#000000; --c-primary-light:rgba(0,0,0,0.06);
          --c-bg:#ffffff;
        }
      \`}</style>
      <div className="app-shell" dir="rtl">
        <div className="app-header" style={{borderBottom:'1px solid #e5e7eb'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <HangerIcon size={20} />
            <h1 className="subtitle" style={{letterSpacing:2,textTransform:'uppercase',fontSize:16}}>StyleHub</h1>
          </div>
          <button className="btn-icon" style={{display:'flex',alignItems:'center',gap:4,position:'relative'}} onClick={() => setScreen('cart')}>
            <CartIcon size={20} />
            {cart.length > 0 && <span className="badge">{cart.length}</span>}
          </button>
        </div>
        <div className="app-content">{renderContent()}</div>
        <div className="app-nav">
          <button className={'nav-tab' + (screen === 'catalog' ? ' active' : '')} onClick={() => setScreen('catalog')}><StoreIcon size={20} />Catalog</button>
          <button className={'nav-tab' + (screen === 'cart' ? ' active' : '')} onClick={() => setScreen('cart')}><CartIcon size={20} />Cart{cart.length > 0 ? \` (\${cart.length})\` : ''}</button>
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
    colorScheme: { primary: '#2563EB', background: '#ffffff', text: '#111827', accent: '#3B82F6' },
    features: ['הוספת משימות חדשות', 'סימון השלמה ומחיקה', 'סינון לפי סטטוס עם פס התקדמות'],
    hebrewSummary: 'אפליקציית משימות עם ניהול מלא, סינון וויזואליזציה של התקדמות',
  },
  code: `function App() {
  const { useState, useMemo } = React;
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Buy groceries from the store', done: false },
    { id: 2, text: 'Send email to client', done: true },
    { id: 3, text: 'Schedule meeting for Thursday', done: false },
    { id: 4, text: 'Finish the weekly report', done: false },
  ]);
  const [newTask, setNewTask] = useState('');
  const [filter, setFilter] = useState('all');

  const Icon = ({d, size=20, fill='none', stroke='currentColor', sw=1.5}) =>
    React.createElement('svg', {width:size,height:size,viewBox:'0 0 24 24',fill,stroke,strokeWidth:sw,strokeLinecap:'round',strokeLinejoin:'round'}, React.createElement('path', {d}));

  const CheckIcon = ({size=16}) => React.createElement('svg', {width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2.5,strokeLinecap:'round',strokeLinejoin:'round'}, React.createElement('path', {d:'M20 6L9 17l-5-5'}));

  const TrashIcon = ({size=16}) => React.createElement('svg', {width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.5,strokeLinecap:'round',strokeLinejoin:'round'}, React.createElement('path', {d:'M3 6h18'}), React.createElement('path', {d:'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6'}), React.createElement('path', {d:'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2'}));

  const ClipboardIcon = ({size=48}) => React.createElement('svg', {width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.5,strokeLinecap:'round',strokeLinejoin:'round'}, React.createElement('path', {d:'M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2'}), React.createElement('rect', {x:8,y:2,width:8,height:4,rx:1,ry:1}));

  const ListIcon = ({size=20}) => React.createElement('svg', {width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.5,strokeLinecap:'round',strokeLinejoin:'round'}, React.createElement('path', {d:'M8 6h13'}), React.createElement('path', {d:'M8 12h13'}), React.createElement('path', {d:'M8 18h13'}), React.createElement('path', {d:'M3 6h.01'}), React.createElement('path', {d:'M3 12h.01'}), React.createElement('path', {d:'M3 18h.01'}));

  const FilterIcon = ({size=16}) => React.createElement('svg', {width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.5,strokeLinecap:'round',strokeLinejoin:'round'}, React.createElement('polygon', {points:'22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3'}));

  const PlusIcon = ({size=18}) => React.createElement('svg', {width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'}, React.createElement('path', {d:'M12 5v14M5 12h14'}));

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
          --c-from:#2563EB; --c-to:#3B82F6;
          --c-primary:#2563EB; --c-primary-light:rgba(37,99,235,0.08);
          --c-bg:#ffffff;
        }
      \`}</style>
      <div className="app-shell" dir="rtl">
        <div className="app-header">
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <CheckIcon size={20} />
            <div>
              <h1 className="subtitle">TaskFlow</h1>
              <p className="caption">{doneCount}/{tasks.length} completed</p>
            </div>
          </div>
        </div>
        <div className="app-content">
          <div className="card">
            <p className="caption" style={{marginBottom:6}}>Progress</p>
            <div style={{width:'100%',height:8,borderRadius:4,background:'var(--c-primary-light)',overflow:'hidden'}}>
              <div style={{width:progress+'%',height:'100%',borderRadius:4,background:'var(--c-primary)',transition:'width 0.3s'}}></div>
            </div>
            <p className="caption" style={{marginTop:4,textAlign:'left'}}>{progress}%</p>
          </div>

          <div className="flex gap-2">
            <input className="input-field" style={{flex:1}} placeholder="New task..." value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()} />
            <button className="btn-primary" style={{width:'auto',padding:'0 20px',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:4}} onClick={addTask}><PlusIcon size={16} /> Add</button>
          </div>

          <div className="flex gap-2">
            {[{id:'all',label:'All'},{id:'active',label:'Active'},{id:'done',label:'Done'}].map(f => (
              <button key={f.id} className={filter === f.id ? 'btn-primary' : 'btn-secondary'} style={{flex:1,padding:'10px 0',fontSize:13}} onClick={() => setFilter(f.id)}>{f.label}</button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon" style={{fontSize:'inherit'}}><ClipboardIcon size={48} /></div>
              <p className="empty-state-title">{filter === 'done' ? 'No completed tasks' : filter === 'active' ? 'All tasks completed!' : 'No tasks yet'}</p>
              <p className="empty-state-body">Add a new task above</p>
            </div>
          ) : (
            filtered.map(task => (
              <div key={task.id} className="list-item">
                <button className="btn-icon" style={{width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',background:task.done?'var(--c-primary)':'transparent',border:task.done?'none':'2px solid #d1d5db',color:task.done?'white':'transparent',borderRadius:'50%',padding:0}} onClick={() => toggleTask(task.id)}>{task.done && <CheckIcon size={14} />}</button>
                <p className="body" style={{flex:1,textDecoration:task.done?'line-through':'none',opacity:task.done?0.5:1}}>{task.text}</p>
                <button className="btn-icon" style={{width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',color:'#ef4444'}} onClick={() => deleteTask(task.id)}><TrashIcon size={16} /></button>
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

  const Icon = ({d, size=20, fill='none', stroke='currentColor', sw=1.5}) =>
    React.createElement('svg', {width:size,height:size,viewBox:'0 0 24 24',fill,stroke,strokeWidth:sw,strokeLinecap:'round',strokeLinejoin:'round'}, React.createElement('path', {d}));

  const CalculatorIcon = ({size=20}) => React.createElement('svg', {width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.5,strokeLinecap:'round',strokeLinejoin:'round'}, React.createElement('rect', {x:4,y:2,width:16,height:20,rx:2}), React.createElement('line', {x1:8,y1:6,x2:16,y2:6}), React.createElement('line', {x1:8,y1:10,x2:8,y2:10.01}), React.createElement('line', {x1:12,y1:10,x2:12,y2:10.01}), React.createElement('line', {x1:16,y1:10,x2:16,y2:10.01}), React.createElement('line', {x1:8,y1:14,x2:8,y2:14.01}), React.createElement('line', {x1:12,y1:14,x2:12,y2:14.01}), React.createElement('line', {x1:16,y1:14,x2:16,y2:14.01}), React.createElement('line', {x1:8,y1:18,x2:8,y2:18.01}), React.createElement('line', {x1:12,y1:18,x2:16,y2:18}));

  const ClockIcon = ({size=20}) => React.createElement('svg', {width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.5,strokeLinecap:'round',strokeLinejoin:'round'}, React.createElement('circle', {cx:12,cy:12,r:10}), React.createElement('polyline', {points:'12 6 12 12 16 14'}));

  const HashIcon = ({size=20}) => React.createElement('svg', {width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.5,strokeLinecap:'round',strokeLinejoin:'round'}, React.createElement('line', {x1:4,y1:9,x2:20,y2:9}), React.createElement('line', {x1:4,y1:15,x2:20,y2:15}), React.createElement('line', {x1:10,y1:3,x2:8,y2:21}), React.createElement('line', {x1:16,y1:3,x2:14,y2:21}));

  const ClipboardIcon = ({size=48}) => React.createElement('svg', {width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.5,strokeLinecap:'round',strokeLinejoin:'round'}, React.createElement('path', {d:'M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2'}), React.createElement('rect', {x:8,y:2,width:8,height:4,rx:1,ry:1}));

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
    if (operator === 'x') return a * b;
    if (operator === '/') return b !== 0 ? a / b : 0;
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

  const btnStyle = { minHeight: 56, fontSize: 20, borderRadius: 14, border: 'none', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' };

  const CalcScreen = () => (
    <>
      <div className="card" style={{marginBottom:12,background:'#f8fafc',border:'none'}}>
        <p className="caption" style={{textAlign:'left',minHeight:18,color:'#94a3b8'}}>{prev ? prev + ' ' + op : ''}</p>
        <p className="title" style={{textAlign:'left',fontSize:40,margin:'8px 0 0',wordBreak:'break-all',fontWeight:300,letterSpacing:-1}}>{display}</p>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
        <button style={{...btnStyle,background:'#fef2f2',color:'#dc2626'}} onClick={clear}>C</button>
        <button style={{...btnStyle,background:'var(--c-primary-light)',color:'var(--c-primary)'}} onClick={() => chooseOp('/')}>/</button>
        <button style={{...btnStyle,background:'var(--c-primary-light)',color:'var(--c-primary)'}} onClick={() => chooseOp('x')}>x</button>
        <button style={{...btnStyle,background:'var(--c-primary-light)',color:'var(--c-primary)'}} onClick={() => chooseOp('-')}>-</button>
        {['7','8','9'].map(n => <button key={n} style={{...btnStyle,background:'white',boxShadow:'0 1px 3px rgba(0,0,0,0.08)'}} onClick={() => input(n)}>{n}</button>)}
        <button style={{...btnStyle,background:'var(--c-primary-light)',color:'var(--c-primary)'}} onClick={() => chooseOp('+')}>+</button>
        {['4','5','6'].map(n => <button key={n} style={{...btnStyle,background:'white',boxShadow:'0 1px 3px rgba(0,0,0,0.08)'}} onClick={() => input(n)}>{n}</button>)}
        <button style={{...btnStyle,background:'var(--c-primary)',color:'white',gridRow:'span 2',fontSize:24}} onClick={equals}>=</button>
        {['1','2','3'].map(n => <button key={n} style={{...btnStyle,background:'white',boxShadow:'0 1px 3px rgba(0,0,0,0.08)'}} onClick={() => input(n)}>{n}</button>)}
        <button style={{...btnStyle,background:'white',boxShadow:'0 1px 3px rgba(0,0,0,0.08)',gridColumn:'span 2'}} onClick={() => input('0')}>0</button>
        <button style={{...btnStyle,background:'white',boxShadow:'0 1px 3px rgba(0,0,0,0.08)'}} onClick={inputDot}>.</button>
      </div>
    </>
  );

  const HistoryScreen = () => (
    <>
      <p className="section-title">Calculation History</p>
      {history.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon" style={{fontSize:'inherit'}}><ClipboardIcon size={48} /></div>
          <p className="empty-state-title">No history</p>
          <p className="empty-state-body">Make your first calculation</p>
          <button className="btn-primary" style={{width:'auto',padding:'12px 24px'}} onClick={() => setScreen('calc')}>Calculator</button>
        </div>
      ) : (
        history.map((entry, i) => (
          <div key={i} className="list-item">
            <div className="icon-circle" style={{width:36,height:36,display:'flex',alignItems:'center',justifyContent:'center',background:'var(--c-primary-light)',borderRadius:'50%'}}><HashIcon size={16} /></div>
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
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <CalculatorIcon size={20} />
            <h1 className="subtitle">CalcPro</h1>
          </div>
        </div>
        <div className="app-content">{renderContent()}</div>
        <div className="app-nav">
          <button className={'nav-tab' + (screen === 'calc' ? ' active' : '')} onClick={() => setScreen('calc')}><CalculatorIcon size={20} />Calculator</button>
          <button className={'nav-tab' + (screen === 'history' ? ' active' : '')} onClick={() => setScreen('history')}><ClockIcon size={20} />History</button>
        </div>
      </div>
    </>
  );
}`,
};

const WEATHER_APP: DemoApp = {
  keywords: ['מזג אוויר', 'weather', 'טמפרטורה', 'תחזית', 'forecast', 'temperature', 'גשם', 'rain'],
  metadata: {
    appName: 'WeatherNow',
    description: 'אפליקציית מזג אוויר עם תחזית שעתית ושבועית',
    colorScheme: { primary: '#0EA5E9', background: '#ffffff', text: '#111827', accent: '#38BDF8' },
    features: ['טמפרטורה נוכחית עם אייקון', 'תחזית שעתית (גלילה)', 'תחזית שבועית 7 ימים'],
    hebrewSummary: 'אפליקציית מזג אוויר עם תחזית שעתית, שבועית ופרטי לחות ורוח',
  },
  code: `function App() {
  const { useState } = React;
  const [city, setCity] = useState('Tel Aviv');

  const SunIcon = ({size=24}) => React.createElement('svg', {width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'#f59e0b',strokeWidth:1.5,strokeLinecap:'round',strokeLinejoin:'round'}, React.createElement('circle', {cx:12,cy:12,r:5}), React.createElement('path', {d:'M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42'}));

  const CloudSunIcon = ({size=24}) => React.createElement('svg', {width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'#94a3b8',strokeWidth:1.5,strokeLinecap:'round',strokeLinejoin:'round'}, React.createElement('path', {d:'M12 2v2M4.93 4.93l1.41 1.41M20 12h2M4 12H2M19.07 4.93l-1.41 1.41'}), React.createElement('circle', {cx:12,cy:10,r:4,stroke:'#f59e0b'}), React.createElement('path', {d:'M16 18H9a5 5 0 010-10h.09A6 6 0 0120 14a4 4 0 01-4 4z',stroke:'#94a3b8'}));

  const CloudRainIcon = ({size=24}) => React.createElement('svg', {width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'#3b82f6',strokeWidth:1.5,strokeLinecap:'round',strokeLinejoin:'round'}, React.createElement('path', {d:'M16 13V9a4 4 0 00-8 0v1H6a4 4 0 000 8h12a3 3 0 100-6h-2',stroke:'#94a3b8'}), React.createElement('path', {d:'M8 19v2M12 19v2M16 19v2'}));

  const CloudIcon = ({size=24}) => React.createElement('svg', {width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'#94a3b8',strokeWidth:1.5,strokeLinecap:'round',strokeLinejoin:'round'}, React.createElement('path', {d:'M17.5 19H9a7 7 0 110-14c1.22 0 2.36.37 3.31 1A5.5 5.5 0 0117.5 8c3.04 0 5.5 2.46 5.5 5.5S20.54 19 17.5 19z'}));

  const MoonIcon = ({size=24}) => React.createElement('svg', {width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'#6366f1',strokeWidth:1.5,strokeLinecap:'round',strokeLinejoin:'round'}, React.createElement('path', {d:'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z'}));

  const DropletIcon = ({size=18}) => React.createElement('svg', {width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'#3b82f6',strokeWidth:1.5,strokeLinecap:'round',strokeLinejoin:'round'}, React.createElement('path', {d:'M12 2.69l5.66 5.66a8 8 0 11-11.31 0z'}));

  const WindIcon = ({size=18}) => React.createElement('svg', {width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'#64748b',strokeWidth:1.5,strokeLinecap:'round',strokeLinejoin:'round'}, React.createElement('path', {d:'M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1119.5 12H2'}));

  const ThermometerIcon = ({size=18}) => React.createElement('svg', {width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'#ef4444',strokeWidth:1.5,strokeLinecap:'round',strokeLinejoin:'round'}, React.createElement('path', {d:'M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z'}));

  const EyeIcon = ({size=18}) => React.createElement('svg', {width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'#64748b',strokeWidth:1.5,strokeLinecap:'round',strokeLinejoin:'round'}, React.createElement('path', {d:'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z'}), React.createElement('circle', {cx:12,cy:12,r:3}));

  const weatherIcons = {
    sun: (s) => React.createElement(SunIcon, {size:s||24}),
    cloudSun: (s) => React.createElement(CloudSunIcon, {size:s||24}),
    cloud: (s) => React.createElement(CloudIcon, {size:s||24}),
    rain: (s) => React.createElement(CloudRainIcon, {size:s||24}),
    moon: (s) => React.createElement(MoonIcon, {size:s||24}),
  };

  const hourly = [
    { time: 'Now', temp: 28, icon: 'sun' },
    { time: '14:00', temp: 30, icon: 'sun' },
    { time: '16:00', temp: 29, icon: 'cloudSun' },
    { time: '18:00', temp: 26, icon: 'cloudSun' },
    { time: '20:00', temp: 23, icon: 'moon' },
    { time: '22:00', temp: 21, icon: 'moon' },
  ];

  const weekly = [
    { day: 'Today', high: 30, low: 22, icon: 'sun' },
    { day: 'Tomorrow', high: 31, low: 23, icon: 'sun' },
    { day: 'Tue', high: 28, low: 21, icon: 'cloudSun' },
    { day: 'Wed', high: 27, low: 20, icon: 'cloud' },
    { day: 'Thu', high: 25, low: 19, icon: 'rain' },
    { day: 'Fri', high: 29, low: 22, icon: 'sun' },
    { day: 'Sat', high: 32, low: 24, icon: 'sun' },
  ];

  return (
    <>
      <style>{\`
        :root {
          --c-from:#0EA5E9; --c-to:#38BDF8;
          --c-primary:#0EA5E9; --c-primary-light:rgba(14,165,233,0.1);
          --c-bg:#ffffff;
        }
      \`}</style>
      <div className="app-shell" dir="rtl">
        <div style={{background:'linear-gradient(135deg,#0EA5E9,#38BDF8)',borderRadius:0,padding:'28px 20px 32px'}}>
          <p style={{color:'rgba(255,255,255,0.7)',marginBottom:4,fontSize:14}}>{city}</p>
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            <div>{weatherIcons.sun(56)}</div>
            <div>
              <p style={{fontSize:52,fontWeight:700,color:'#fff',lineHeight:1,letterSpacing:-2}}>28</p>
              <p style={{color:'rgba(255,255,255,0.8)',fontSize:14,marginTop:2}}>Clear | Feels like 31</p>
            </div>
          </div>
        </div>
        <div className="app-content">
          <div className="card">
            <p className="section-title" style={{marginBottom:10}}>Hourly Forecast</p>
            <div style={{display:'flex',gap:16,overflowX:'auto',paddingBottom:8}}>
              {hourly.map((h,i) => (
                <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,minWidth:56}}>
                  <p className="caption" style={{fontSize:12}}>{h.time}</p>
                  {weatherIcons[h.icon](24)}
                  <p className="subtitle" style={{fontSize:15}}>{h.temp}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <p className="section-title" style={{marginBottom:10}}>7-Day Forecast</p>
            {weekly.map((d,i) => (
              <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',borderBottom:i<6?'1px solid #f1f5f9':'none'}}>
                <p className="body" style={{width:70,fontWeight:i===0?600:400}}>{d.day}</p>
                {weatherIcons[d.icon](20)}
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <span className="subtitle" style={{fontSize:14,color:'var(--c-primary)',fontWeight:600}}>{d.high}</span>
                  <span className="caption" style={{fontSize:13}}>{d.low}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid-2">
            <div className="card-sm" style={{textAlign:'center',padding:'14px 8px'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:4,marginBottom:6}}><DropletIcon size={16} /><p className="caption" style={{margin:0}}>Humidity</p></div>
              <p className="subtitle" style={{fontWeight:600}}>62%</p>
            </div>
            <div className="card-sm" style={{textAlign:'center',padding:'14px 8px'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:4,marginBottom:6}}><WindIcon size={16} /><p className="caption" style={{margin:0}}>Wind</p></div>
              <p className="subtitle" style={{fontWeight:600}}>18 km/h</p>
            </div>
            <div className="card-sm" style={{textAlign:'center',padding:'14px 8px'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:4,marginBottom:6}}><ThermometerIcon size={16} /><p className="caption" style={{margin:0}}>UV Index</p></div>
              <p className="subtitle" style={{fontWeight:600}}>High 7</p>
            </div>
            <div className="card-sm" style={{textAlign:'center',padding:'14px 8px'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:4,marginBottom:6}}><EyeIcon size={16} /><p className="caption" style={{margin:0}}>Visibility</p></div>
              <p className="subtitle" style={{fontWeight:600}}>10 km</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}`,
};

const RESTAURANT_APP: DemoApp = {
  keywords: ['מסעדה', 'restaurant', 'אוכל', 'food', 'תפריט', 'menu', 'פיצה', 'pizza', 'בורגר', 'burger', 'מנה', 'הזמנ'],
  metadata: {
    appName: 'FoodHub',
    description: 'אפליקציית מסעדה עם תפריט והזמנות',
    colorScheme: { primary: '#00B37E', background: '#ffffff', text: '#111827', accent: '#34D399' },
    features: ['תפריט עם קטגוריות', 'הוספה להזמנה עם כמות', 'סיכום הזמנה ותשלום'],
    hebrewSummary: 'אפליקציית מסעדה עם תפריט מחולק לקטגוריות, עגלת הזמנות וסיכום',
  },
  code: `function App() {
  const { useState, useMemo } = React;
  const [screen, setScreen] = useState('menu');
  const [order, setOrder] = useState([]);
  const [category, setCategory] = useState('main');

  const Icon = ({d, size=20, fill='none', stroke='currentColor', sw=1.5}) =>
    React.createElement('svg', {width:size,height:size,viewBox:'0 0 24 24',fill,stroke,strokeWidth:sw,strokeLinecap:'round',strokeLinejoin:'round'}, React.createElement('path', {d}));

  const UtensilsIcon = ({size=20}) => React.createElement('svg', {width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.5,strokeLinecap:'round',strokeLinejoin:'round'}, React.createElement('path', {d:'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2'}), React.createElement('path', {d:'M7 2v20'}), React.createElement('path', {d:'M21 15V2v0a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7'}));

  const CartIcon = ({size=20}) => React.createElement('svg', {width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.5,strokeLinecap:'round',strokeLinejoin:'round'}, React.createElement('path', {d:'M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6'}), React.createElement('circle', {cx:9,cy:21,r:1}), React.createElement('circle', {cx:20,cy:21,r:1}));

  const XIcon = ({size=14}) => React.createElement('svg', {width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'}, React.createElement('path', {d:'M18 6L6 18'}), React.createElement('path', {d:'M6 6l12 12'}));

  const PlusIcon = ({size=18}) => React.createElement('svg', {width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'}, React.createElement('path', {d:'M12 5v14M5 12h14'}));

  const CoffeeIcon = ({size=18}) => React.createElement('svg', {width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.5,strokeLinecap:'round',strokeLinejoin:'round'}, React.createElement('path', {d:'M17 8h1a4 4 0 110 8h-1'}), React.createElement('path', {d:'M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8z'}), React.createElement('path', {d:'M6 2v3M10 2v3M14 2v3'}));

  const FriesIcon = ({size=18}) => React.createElement('svg', {width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.5,strokeLinecap:'round',strokeLinejoin:'round'}, React.createElement('path', {d:'M18 8H6l-1 14h14z'}), React.createElement('path', {d:'M8 8V5a1 1 0 012 0v3'}), React.createElement('path', {d:'M12 8V3a1 1 0 012 0v5'}), React.createElement('path', {d:'M15 8V5a1 1 0 012 0v3'}));

  const placeholderImg = (label, color1, color2) =>
    'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect fill="' + color1 + '" width="200" height="200"/><rect fill="' + color2 + '" x="50" y="50" width="100" height="100" rx="12"/><text x="100" y="108" text-anchor="middle" fill="#9ca3af" font-family="system-ui" font-size="12">' + label + '</text></svg>');

  const menu = {
    main: [
      { id: 1, name: 'Classic Burger', price: 52, img: placeholderImg('Burger','#fef3c7','#fde68a'), desc: '200g, lettuce, tomato' },
      { id: 2, name: 'Margherita Pizza', price: 48, img: placeholderImg('Pizza','#fee2e2','#fecaca'), desc: 'Sauce, mozzarella, basil' },
      { id: 3, name: 'Crispy Schnitzel', price: 45, img: placeholderImg('Schnitzel','#ffedd5','#fed7aa'), desc: 'With fries and rice' },
      { id: 4, name: 'Caesar Salad', price: 42, img: placeholderImg('Salad','#dcfce7','#bbf7d0'), desc: 'Lettuce, croutons, parmesan' },
    ],
    sides: [
      { id: 5, name: 'French Fries', price: 18, img: placeholderImg('Fries','#fef9c3','#fef08a'), desc: 'Crispy and seasoned' },
      { id: 6, name: 'Onion Rings', price: 22, img: placeholderImg('Rings','#ffedd5','#fed7aa'), desc: 'Panko-crusted' },
    ],
    drinks: [
      { id: 7, name: 'Fresh Lemonade', price: 16, img: placeholderImg('Lemonade','#fef9c3','#fde68a'), desc: 'Fresh squeezed with mint' },
      { id: 8, name: 'Cola', price: 12, img: placeholderImg('Cola','#fee2e2','#fecaca'), desc: '330 ml' },
    ],
  };

  const categories = [
    { id: 'main', label: 'Mains', icon: () => React.createElement(UtensilsIcon, {size:14}) },
    { id: 'sides', label: 'Sides', icon: () => React.createElement(FriesIcon, {size:14}) },
    { id: 'drinks', label: 'Drinks', icon: () => React.createElement(CoffeeIcon, {size:14}) },
  ];

  const addToOrder = (item) => setOrder(prev => [...prev, { ...item, orderId: Date.now() + Math.random() }]);
  const removeFromOrder = (orderId) => setOrder(prev => prev.filter(i => i.orderId !== orderId));
  const total = useMemo(() => order.reduce((s, i) => s + i.price, 0), [order]);

  return (
    <>
      <style>{\`
        :root {
          --c-from:#00B37E; --c-to:#34D399;
          --c-primary:#00B37E; --c-primary-light:rgba(0,179,126,0.1);
          --c-bg:#ffffff;
        }
      \`}</style>
      <div className="app-shell" dir="rtl">
        <div className="app-header" style={{borderBottom:'1px solid #e5e7eb'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <UtensilsIcon size={20} />
            <h1 className="subtitle" style={{fontWeight:700}}>FoodHub</h1>
          </div>
          <button className="btn-icon" style={{display:'flex',alignItems:'center',gap:4,position:'relative'}} onClick={() => setScreen('order')}>
            <CartIcon size={20} />
            {order.length > 0 && <span className="badge" style={{fontSize:10,padding:'2px 6px'}}>{order.length}</span>}
          </button>
        </div>
        <div className="app-content">
          {screen === 'menu' ? (
            <>
              <div style={{background:'linear-gradient(135deg,#00B37E,#34D399)',padding:'20px 16px',borderRadius:12,marginBottom:16}}>
                <h2 style={{color:'white',margin:'0 0 6px',fontSize:20,fontWeight:700}}>Welcome!</h2>
                <p style={{color:'rgba(255,255,255,0.85)',fontSize:13,margin:0}}>Order and enjoy fast delivery</p>
              </div>
              <div style={{display:'flex',gap:8}}>
                {categories.map(c => (
                  <button key={c.id} className={category === c.id ? 'btn-primary' : 'btn-secondary'} style={{flex:1,padding:'10px 0',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',gap:4}} onClick={() => setCategory(c.id)}>
                    {c.icon()} {c.label}
                  </button>
                ))}
              </div>
              <div className="grid-tablet-2">
              {menu[category].map(item => (
                <div key={item.id} className="list-item" style={{gap:12}}>
                  <div style={{width:48,height:48,borderRadius:10,overflow:'hidden',flexShrink:0}}>
                    <img src={item.img} style={{width:'100%',height:'100%',objectFit:'cover'}} alt={item.name} />
                  </div>
                  <div style={{flex:1}}>
                    <p className="subtitle" style={{fontSize:14}}>{item.name}</p>
                    <p className="caption" style={{fontSize:12}}>{item.desc}</p>
                    <p className="subtitle" style={{color:'var(--c-primary)',fontSize:14,marginTop:4,fontWeight:600}}>{item.price} ILS</p>
                  </div>
                  <button className="btn-icon" style={{width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'50%',background:'var(--c-primary-light)',color:'var(--c-primary)'}} onClick={() => addToOrder(item)}><PlusIcon size={16} /></button>
                </div>
              ))}
              </div>
            </>
          ) : (
            <>
              <p className="section-title">Your Order ({order.length} items)</p>
              {order.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon" style={{fontSize:'inherit'}}><CartIcon size={48} /></div>
                  <p className="empty-state-title">Order is empty</p>
                  <p className="empty-state-body">Add items from the menu</p>
                  <button className="btn-primary" style={{width:'auto',padding:'12px 24px'}} onClick={() => setScreen('menu')}>Browse Menu</button>
                </div>
              ) : (
                <>
                  {order.map(item => (
                    <div key={item.orderId} className="list-item" style={{gap:12}}>
                      <div style={{width:40,height:40,borderRadius:8,overflow:'hidden',flexShrink:0}}>
                        <img src={item.img} style={{width:'100%',height:'100%',objectFit:'cover'}} alt={item.name} />
                      </div>
                      <div style={{flex:1}}>
                        <p className="subtitle" style={{fontSize:13}}>{item.name}</p>
                        <p className="caption">{item.price} ILS</p>
                      </div>
                      <button className="btn-icon" style={{width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={() => removeFromOrder(item.orderId)}><XIcon size={14} /></button>
                    </div>
                  ))}
                  <div className="card" style={{marginTop:8}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}>
                      <span className="subtitle">Total</span>
                      <span className="title" style={{fontSize:22,color:'var(--c-primary)',fontWeight:700}}>{total} ILS</span>
                    </div>
                    <button className="btn-primary" onClick={() => { setOrder([]); setScreen('menu'); alert('Order submitted!'); }}>Place Order</button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
        <div className="app-nav">
          <button className={'nav-tab' + (screen === 'menu' ? ' active' : '')} onClick={() => setScreen('menu')}><UtensilsIcon size={20} />Menu</button>
          <button className={'nav-tab' + (screen === 'order' ? ' active' : '')} onClick={() => setScreen('order')}><CartIcon size={20} />Order{order.length > 0 ? \` (\${order.length})\` : ''}</button>
        </div>
      </div>
    </>
  );
}`,
};

const STOCKS_APP: DemoApp = {
  keywords: ['מניות', 'מניה', 'בורסה', 'stock', 'stocks', 'portfolio', 'תיק השקעות', 'השקעות', 'invest', 'trading', 'מסחר', 'תיק מניות'],
  metadata: {
    appName: 'StockFolio',
    description: 'תיק מניות אינטראקטיבי עם מחירים וגרפים מתעדכנים בזמן אמת',
    colorScheme: { primary: '#16C784', background: '#ffffff', text: '#0B1426', accent: '#EA3943' },
    features: ['תיק מניות עם שווי כולל ושינוי יומי', 'גרפים חיים שמתעדכנים בזמן אמת', 'הוספה והסרה של מניות', 'מעקב שוק עם 8 מניות אמיתיות'],
    hebrewSummary: 'תיק מניות אינטראקטיבי — מחירים וגרפים מתעדכנים בזמן אמת, הוספה/הסרה של מניות ומעקב שוק חי',
  },
  code: `function App() {
  const { useState, useEffect } = React;

  const PlusIcon = ({size=18,color='currentColor'}) => React.createElement('svg',{width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:color,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'M12 5v14M5 12h14'}));
  const MinusIcon = ({size=18,color='currentColor'}) => React.createElement('svg',{width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:color,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'M5 12h14'}));
  const TrashIcon = ({size=16,color='#EA3943'}) => React.createElement('svg',{width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:color,strokeWidth:1.6,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2'}));
  const WalletIcon = ({size=20,color='currentColor'}) => React.createElement('svg',{width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:color,strokeWidth:1.6,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'M20 12V8H6a2 2 0 010-4h12v4'}),React.createElement('path',{d:'M4 6v12a2 2 0 002 2h14v-4'}),React.createElement('path',{d:'M18 12a2 2 0 000 4h4v-4z'}));
  const BarIcon = ({size=20,color='currentColor'}) => React.createElement('svg',{width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:color,strokeWidth:1.6,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'M18 20V10M12 20V4M6 20v-6'}));

  const MARKET = [
    { sym:'AAPL',  name:'Apple',      base:229.87 },
    { sym:'NVDA',  name:'NVIDIA',     base:131.26 },
    { sym:'TSLA',  name:'Tesla',      base:248.50 },
    { sym:'MSFT',  name:'Microsoft',  base:430.16 },
    { sym:'AMZN',  name:'Amazon',     base:186.40 },
    { sym:'GOOGL', name:'Alphabet',   base:178.35 },
    { sym:'META',  name:'Meta',       base:563.27 },
    { sym:'AMD',   name:'AMD',        base:148.92 },
  ];
  const baseOf = (sym) => { const m = MARKET.find(x=>x.sym===sym); return m ? m.base : 0; };
  const nameOf = (sym) => { const m = MARKET.find(x=>x.sym===sym); return m ? m.name : sym; };

  const seed = (base) => { const a=[]; let p=base*0.985; for(let i=0;i<14;i++){ p += (Math.random()-0.42)*base*0.006; a.push(p); } a.push(base); return a; };

  const [tab, setTab] = useState('portfolio');
  const [prices, setPrices] = useState(() => { const o={}; MARKET.forEach(s=>o[s.sym]=s.base); return o; });
  const [history, setHistory] = useState(() => { const o={}; MARKET.forEach(s=>o[s.sym]=seed(s.base)); return o; });
  const [holdings, setHoldings] = useState({ AAPL:5, NVDA:10, TSLA:3 });
  const [totalHist, setTotalHist] = useState([]);

  useEffect(() => {
    const id = setInterval(() => {
      setPrices(prev => {
        const next = Object.assign({}, prev);
        MARKET.forEach(s => { const p = prev[s.sym]; next[s.sym] = Math.max(1, p + (Math.random()-0.48)*p*0.005); });
        setHistory(h => { const nh = Object.assign({}, h); MARKET.forEach(s => { nh[s.sym] = (h[s.sym]||[]).concat(next[s.sym]).slice(-30); }); return nh; });
        return next;
      });
    }, 1500);
    return () => clearInterval(id);
  }, []);

  const totalValue = Object.keys(holdings).reduce((sum,sym) => sum + holdings[sym]*(prices[sym]||0), 0);
  const investedBase = Object.keys(holdings).reduce((sum,sym) => sum + holdings[sym]*baseOf(sym), 0);
  const dayChange = totalValue - investedBase;
  const dayPct = investedBase ? (dayChange/investedBase)*100 : 0;

  useEffect(() => { setTotalHist(t => t.concat(totalValue).slice(-30)); }, [prices]);

  const fmt = (n) => '$' + n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  const pct = (n) => (n>=0?'+':'') + n.toFixed(2) + '%';

  const Spark = ({data, w=68, h=26, up}) => {
    if (!data || data.length < 2) return React.createElement('div',{style:{width:w,height:h}});
    const min=Math.min.apply(null,data), max=Math.max.apply(null,data), range=(max-min)||1;
    const pts = data.map((v,i)=>{ const x=(i/(data.length-1))*w; const y=h-((v-min)/range)*(h-4)-2; return x.toFixed(1)+','+y.toFixed(1); }).join(' ');
    return React.createElement('svg',{width:w,height:h,viewBox:'0 0 '+w+' '+h,style:{flexShrink:0}},React.createElement('polyline',{points:pts,fill:'none',stroke:up?'#16C784':'#EA3943',strokeWidth:1.6,strokeLinecap:'round',strokeLinejoin:'round'}));
  };

  const BigChart = ({data}) => {
    const w=320,h=96;
    if (!data || data.length < 2) return React.createElement('div',{style:{height:h}});
    const min=Math.min.apply(null,data), max=Math.max.apply(null,data), range=(max-min)||1;
    const xy = data.map((v,i)=>{ const x=(i/(data.length-1))*w; const y=h-((v-min)/range)*(h-16)-8; return [x,y]; });
    const line = xy.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ');
    const area = 'M0,'+h+' L'+xy.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' L')+' L'+w+','+h+' Z';
    const up = data[data.length-1] >= data[0];
    const c = up?'#16C784':'#EA3943';
    return React.createElement('svg',{width:'100%',height:h,viewBox:'0 0 '+w+' '+h,preserveAspectRatio:'none'},
      React.createElement('defs',null,React.createElement('linearGradient',{id:'bg-grad',x1:'0',y1:'0',x2:'0',y2:'1'},
        React.createElement('stop',{offset:'0%',stopColor:c,stopOpacity:0.28}),
        React.createElement('stop',{offset:'100%',stopColor:c,stopOpacity:0}))),
      React.createElement('path',{d:area,fill:'url(#bg-grad)'}),
      React.createElement('polyline',{points:line,fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'}));
  };

  const addShare = (sym) => setHoldings(h => Object.assign({}, h, { [sym]: (h[sym]||0)+1 }));
  const subShare = (sym) => setHoldings(h => { const n=(h[sym]||0)-1; const c=Object.assign({}, h); if(n<=0) delete c[sym]; else c[sym]=n; return c; });
  const removeStock = (sym) => setHoldings(h => { const c=Object.assign({}, h); delete c[sym]; return c; });

  const heldSyms = Object.keys(holdings);

  const PortfolioTab = () => (
    <>
      <div style={{background:'linear-gradient(135deg,#0B1426,#16243C)',padding:'22px 20px 24px',color:'#fff'}}>
        <p style={{color:'rgba(255,255,255,0.6)',fontSize:13,marginBottom:6}}>שווי התיק</p>
        <p style={{fontSize:38,fontWeight:700,lineHeight:1,letterSpacing:-1}}>{fmt(totalValue)}</p>
        <div style={{display:'flex',alignItems:'center',gap:6,marginTop:10}}>
          <span style={{background:dayChange>=0?'rgba(22,199,132,0.18)':'rgba(234,57,67,0.18)',color:dayChange>=0?'#16C784':'#EA3943',padding:'3px 10px',borderRadius:20,fontSize:13,fontWeight:600}}>
            {(dayChange>=0?'▲ ':'▼ ')+pct(dayPct)}
          </span>
          <span style={{color:'rgba(255,255,255,0.7)',fontSize:13}}>{(dayChange>=0?'+':'')+fmt(dayChange).replace('$','$')}  היום</span>
        </div>
        <div style={{marginTop:14,marginLeft:-20,marginRight:-20}}><BigChart data={totalHist} /></div>
      </div>

      <div className="app-content">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
          <p className="section-title" style={{margin:0}}>האחזקות שלי</p>
          <span style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:12,color:'#16C784',fontWeight:600}}>
            <span style={{width:7,height:7,borderRadius:'50%',background:'#16C784',display:'inline-block',animation:'mfpulse 1.5s infinite'}}></span>בזמן אמת
          </span>
        </div>

        {heldSyms.length===0 && (
          <div className="empty-state">
            <div className="empty-state-icon" style={{opacity:0.3}}><WalletIcon size={40} color="#94a3b8" /></div>
            <p className="empty-state-title">התיק ריק</p>
            <p className="empty-state-body">עבור ללשונית השוק כדי להוסיף מניות</p>
            <button className="btn-primary" style={{width:'auto',padding:'12px 24px',marginTop:4}} onClick={()=>setTab('market')}>גלה מניות</button>
          </div>
        )}

        <div className="grid-tablet-2">
        {heldSyms.map(sym => {
          const price = prices[sym]||0;
          const ch = ((price-baseOf(sym))/baseOf(sym))*100;
          const up = ch>=0;
          return (
            <div key={sym} className="card" style={{marginBottom:10,padding:'14px 16px'}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:44,height:44,borderRadius:12,background:'#0B1426',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:13,flexShrink:0}}>{sym.slice(0,4)}</div>
                <div style={{flex:1,minWidth:0,overflow:'hidden'}}>
                  <p className="subtitle" style={{fontSize:15,margin:0,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{sym}</p>
                  <p className="caption" style={{margin:0,color:'#94a3b8',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{holdings[sym]} מניות · {nameOf(sym)}</p>
                </div>
                <Spark data={history[sym]} up={up} w={52} h={26} />
                <div style={{textAlign:'left',minWidth:76,flexShrink:0}}>
                  <p className="subtitle" style={{fontSize:15,margin:0,whiteSpace:'nowrap'}}>{fmt(price)}</p>
                  <p style={{margin:0,fontSize:12,fontWeight:600,color:up?'#16C784':'#EA3943',whiteSpace:'nowrap'}}>{pct(ch)}</p>
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:12,paddingTop:12,borderTop:'1px solid #f1f5f9'}}>
                <span className="caption" style={{color:'#64748b'}}>שווי אחזקה: <strong style={{color:'#0B1426'}}>{fmt(price*holdings[sym])}</strong></span>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <button className="btn-icon" style={{width:30,height:30,border:'1px solid #e2e8f0'}} onClick={()=>subShare(sym)}><MinusIcon size={15} color="#0B1426" /></button>
                  <button className="btn-icon" style={{width:30,height:30,border:'1px solid #e2e8f0'}} onClick={()=>addShare(sym)}><PlusIcon size={15} color="#0B1426" /></button>
                  <button className="btn-icon" style={{width:30,height:30}} onClick={()=>removeStock(sym)}><TrashIcon size={15} /></button>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </>
  );

  const MarketTab = () => (
    <>
      <div className="app-header">
        <div>
          <p className="caption" style={{color:'#6b7280'}}>מעקב שוק</p>
          <h1 className="subtitle">מניות פופולריות</h1>
        </div>
      </div>
      <div className="app-content">
        <div className="grid-tablet-2">
        {MARKET.map(s => {
          const price = prices[s.sym]||0;
          const ch = ((price-s.base)/s.base)*100;
          const up = ch>=0;
          const held = holdings[s.sym]>0;
          return (
            <div key={s.sym} className="list-item" style={{marginBottom:8,gap:10}}>
              <div style={{width:40,height:40,borderRadius:10,background:'#0B1426',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:12,flexShrink:0}}>{s.sym.slice(0,4)}</div>
              <div style={{flex:1,minWidth:0,overflow:'hidden'}}>
                <p className="subtitle" style={{fontSize:14,margin:0,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.sym}</p>
                <p className="caption" style={{margin:0,color:'#94a3b8',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.name}</p>
              </div>
              <Spark data={history[s.sym]} up={up} w={48} h={24} />
              <div style={{textAlign:'left',minWidth:72,flexShrink:0}}>
                <p className="subtitle" style={{fontSize:14,margin:0,whiteSpace:'nowrap'}}>{fmt(price)}</p>
                <p style={{margin:0,fontSize:12,fontWeight:600,color:up?'#16C784':'#EA3943',whiteSpace:'nowrap'}}>{pct(ch)}</p>
              </div>
              <button className="btn-icon" style={{width:34,height:34,background:held?'#16C78420':'var(--c-primary)',flexShrink:0}} onClick={()=>addShare(s.sym)}>
                <PlusIcon size={17} color={held?'#16C784':'#fff'} />
              </button>
            </div>
          );
        })}
        </div>
        <p className="caption" style={{textAlign:'center',color:'#94a3b8',marginTop:12}}>הקש + כדי להוסיף מניה לתיק שלך</p>
      </div>
    </>
  );

  const navItems = [
    { id:'portfolio', label:'התיק', icon:WalletIcon },
    { id:'market',    label:'שוק',  icon:BarIcon },
  ];

  return (
    <>
      <style>{\`
        :root {
          --c-from:#16C784; --c-to:#16C784;
          --c-primary:#16C784; --c-primary-light:rgba(22,199,132,0.1);
          --c-bg:#ffffff;
        }
        @keyframes mfpulse { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
      \`}</style>
      <div className="app-shell" dir="rtl">
        {tab==='portfolio' ? <PortfolioTab /> : <MarketTab />}
        <div className="app-nav">
          {navItems.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} className={'nav-tab'+(tab===t.id?' active':'')}>
              {React.createElement(t.icon, { size:20, color: tab===t.id ? '#16C784' : '#94a3b8' })}{t.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}`,
};

const DEMO_APPS: DemoApp[] = [CLOTHING_STORE, TODO_APP, WEATHER_APP, RESTAURANT_APP, STOCKS_APP, CALCULATOR_APP];

/**
 * Returns a complete AI response in the format parseGroqResponse expects.
 * Matches prompt keywords to pick the best demo app; falls back to calculator.
 */
export function getDemoResponse(prompt: string): string {
  const lower = prompt.toLowerCase();

  let match = DEMO_APPS.find(app =>
    app.keywords.length > 0 && app.keywords.some(kw => lower.includes(kw))
  );

  if (!match) {
    match = CALCULATOR_APP;
  }

  const metaJson = JSON.stringify(match.metadata);
  return `${metaJson}\n===CODE===\n${match.code}\n===END===`;
}

/**
 * In demo/edit mode, return the existing code back as-is
 * (since we can't actually call an LLM to modify it).
 */
export function getDemoEditResponse(existingCode: string): string {
  const meta = {
    appName: 'Updated App',
    description: 'The app has been updated',
    colorScheme: { primary: '#6C3AE8', background: '#F8F9FA', text: '#1A1A2E', accent: '#A78BFA' },
    features: ['Updated as requested'],
    hebrewSummary: 'Updated app - in demo mode, AI edits are not available. Connect an API key to edit with AI',
  };
  return `${JSON.stringify(meta)}\n===CODE===\n${existingCode}\n===END===`;
}
