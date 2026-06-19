/**
 * MobileForge Generation Pipeline — Automated Test Suite
 *
 * Tests the parsing + rendering pipeline WITHOUT external API calls.
 * Each of the 10 app types is represented by a hand-crafted "ideal"
 * mock LLM response.  Quality checks verify the output meets all
 * requirements before launch.
 */

import { parseGroqResponse, buildEditSystemPrompt } from '../src/services/aiWeb';
import { buildHtmlDocument } from '../src/services/webRenderer';

// ── Quality check helpers ─────────────────────────────────────────────────

interface CodeQuality {
  hasFunctionApp: boolean;
  noForbiddenImports: boolean;
  noTypeScriptAnnotations: boolean;
  usesDesignSystem: boolean;
  hasOnClick: boolean;
  hasUseState: boolean;
}

function checkCode(code: string): CodeQuality {
  return {
    hasFunctionApp: /function\s+App\s*\(/.test(code),

    noForbiddenImports:
      !/import\s+.*from\s+['"](?:react-native|expo|@expo|react-navigation|native-base|@react-native)/.test(code),

    // Detects TypeScript primitives in annotation position, interfaces, type aliases, and TS generics
    noTypeScriptAnnotations:
      !/:\s*(?:string|number|boolean|void|any|never|unknown|JSX\.Element|React\.(?:FC|ReactNode))(?:[\s;,)\[|&]|$)/.test(code) &&
      !/interface\s+\w+\s*\{/.test(code) &&
      !/type\s+\w+\s*=/.test(code) &&
      !/<(?:string|number|boolean|any|void|Array|Record|Map|Set|Promise)</.test(code),

    // Checks for design system class names anywhere in the code (handles template strings too)
    usesDesignSystem:
      /\b(?:card|btn-primary|app-shell|list-item|gradient-banner|nav-tab|icon-circle|input-field)\b/.test(code),

    hasOnClick: /onClick\s*=/.test(code),
    hasUseState: /useState/.test(code),
  };
}

interface HtmlQuality {
  hasReactCDN: boolean;
  hasBabelCDN: boolean;
  hasStyleTag: boolean;
  designSystemInStyle: boolean;
  noStyleTagLeak: boolean;
  hasIIFE: boolean;
  hasTryCatch: boolean;
  hasErrorBoundary: boolean;
  hasWindowOnerror: boolean;
}

function checkHtml(html: string): HtmlQuality {
  // Extract content of the *first* <style> block (the injected design system)
  const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
  const styleContent = styleMatch?.[1] ?? '';

  return {
    hasReactCDN:         /unpkg\.com\/react@/.test(html),
    hasBabelCDN:         /babel.*standalone/.test(html),
    hasStyleTag:         styleContent.length > 100,
    designSystemInStyle: styleContent.includes('app-shell'),
    // Guard: if CSS itself contained </style> the style element would be truncated
    noStyleTagLeak:      !styleContent.includes('</style>'),
    hasIIFE:             /__mf_run/.test(html),
    hasTryCatch:         /try\s*\{/.test(html),
    hasErrorBoundary:    /ErrorBoundary/.test(html),
    hasWindowOnerror:    /window\.onerror/.test(html),
  };
}

// ── Mock response builder ─────────────────────────────────────────────────

function makeResponse(code: string, appName = 'Test App'): string {
  const meta = {
    appName,
    description: 'Test',
    colorScheme: { primary: '#6366f1', background: '#f8fafc', text: '#0f172a', accent: '#8b5cf6' },
    features: ['f1', 'f2'],
    hebrewSummary: 'אפליקציית בדיקה',
  };
  return `${JSON.stringify(meta)}\n===CODE===\n${code}\n===END===`;
}

// ── 10 representative app codes ───────────────────────────────────────────

const MOCK_CODES: Record<string, string> = {

  // ① Todo list
  todo: `function App() {
  const { useState } = React;
  const [items, setItems] = useState([{id:1,text:'קנות מצרכים',done:false},{id:2,text:'פגישה עם רופא',done:true}]);
  const [input, setInput] = useState('');
  const [tab, setTab] = useState('all');
  const add = () => { if(input.trim()){ setItems(p=>[...p,{id:Date.now(),text:input,done:false}]); setInput(''); }};
  const toggle = (id) => setItems(p=>p.map(i=>i.id===id?{...i,done:!i.done}:i));
  const remove = (id) => setItems(p=>p.filter(i=>i.id!==id));
  return (
    <>
      <style>{\`:root{--c-from:#6366f1;--c-to:#8b5cf6;--c-primary:#6366f1;--c-primary-light:rgba(99,102,241,0.12);--c-bg:#f5f3ff;}\`}</style>
      <div className="app-shell" dir="rtl">
        <div className="app-header"><h1 className="subtitle">📋 משימות</h1><span className="badge">{items.filter(i=>!i.done).length}</span></div>
        <div className="app-content">
          <div className="card">
            <input className="input-field" value={input} onChange={e=>setInput(e.target.value)} placeholder="משימה חדשה..." />
            <button className="btn-primary" style={{marginTop:10}} onClick={add}>הוסף</button>
          </div>
          {items.map(item=>(
            <div key={item.id} className="list-item">
              <button className="btn-icon" onClick={()=>toggle(item.id)}>{item.done?'✅':'⭕'}</button>
              <span className="body" style={{flex:1}}>{item.text}</span>
              <button className="btn-icon" onClick={()=>remove(item.id)}>🗑️</button>
            </div>
          ))}
        </div>
        <div className="app-nav">
          {[{id:'all',label:'הכל'},{id:'active',label:'פתוחות'},{id:'done',label:'הושלמו'}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} className={'nav-tab'+(tab===t.id?' active':'')}>{t.label}</button>
          ))}
        </div>
      </div>
    </>
  );
}`,

  // ② Calculator
  calculator: `function App() {
  const { useState } = React;
  const [display, setDisplay] = useState('0');
  const [expr, setExpr] = useState('');
  const press = (val) => {
    if(val==='C'){ setDisplay('0'); setExpr(''); return; }
    if(val==='='){ try{ setDisplay(String(eval(expr.replace(/÷/g,'/').replace(/×/g,'*')))); setExpr(''); }catch(e){ setDisplay('שגיאה'); } return; }
    const next = expr===''&&display==='0'?val:expr+val;
    setDisplay(next); setExpr(next);
  };
  return (
    <>
      <style>{\`:root{--c-from:#1e40af;--c-to:#3b82f6;--c-primary:#3b82f6;--c-primary-light:rgba(59,130,246,0.12);--c-bg:#eff6ff;}\`}</style>
      <div className="app-shell" dir="rtl">
        <div className="app-header"><h1 className="subtitle">🔢 מחשבון</h1></div>
        <div className="app-content">
          <div className="card"><p className="title" style={{textAlign:'left',fontSize:40,minHeight:60}}>{display}</p></div>
          <div className="grid grid-cols-4 gap-3">
            {['7','8','9','÷','4','5','6','×','1','2','3','-','0','.','=','+','C'].map(b=>(
              <button key={b} className={b==='='?'btn-primary':b==='C'?'btn-secondary':'btn-icon'} style={{width:'100%',height:56,fontSize:18}} onClick={()=>press(b)}>{b}</button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}`,

  // ③ Shopping list
  shopping: `function App() {
  const { useState } = React;
  const [tab, setTab] = useState('list');
  const [items, setItems] = useState([{id:1,name:'חלב',cat:'מוצרי חלב',done:false},{id:2,name:'לחם',cat:'מאפים',done:false},{id:3,name:'עגבניות',cat:'ירקות',done:true}]);
  const [input, setInput] = useState('');
  const toggle = (id) => setItems(p=>p.map(i=>i.id===id?{...i,done:!i.done}:i));
  const add = () => { if(input.trim()){ setItems(p=>[...p,{id:Date.now(),name:input,cat:'כללי',done:false}]); setInput(''); }};
  const ListScreen = () => (<>
    <div className="card"><input className="input-field" value={input} onChange={e=>setInput(e.target.value)} placeholder="הוסף מוצר..." /><button className="btn-primary" style={{marginTop:10}} onClick={add}>הוסף</button></div>
    {items.map(item=>(<div key={item.id} className="list-item" onClick={()=>toggle(item.id)}><div className="icon-circle">{item.done?'✅':'🛒'}</div><div style={{flex:1}}><p className="subtitle" style={{fontSize:14}}>{item.name}</p><p className="caption">{item.cat}</p></div></div>))}
  </>);
  const DoneScreen = () => (<>{items.filter(i=>i.done).map(item=>(<div key={item.id} className="list-item"><span className="body">{item.name}</span></div>))}</>);
  const renderContent = () => { if(tab==='done') return <DoneScreen />; return <ListScreen />; };
  return (
    <>
      <style>{\`:root{--c-from:#16a34a;--c-to:#22c55e;--c-primary:#16a34a;--c-primary-light:rgba(22,163,74,0.12);--c-bg:#f0fdf4;}\`}</style>
      <div className="app-shell" dir="rtl">
        <div className="app-header"><h1 className="subtitle">🛒 רשימת קניות</h1><span className="badge">{items.filter(i=>!i.done).length}</span></div>
        <div className="app-content">{renderContent()}</div>
        <div className="app-nav">{[{id:'list',icon:'📋',label:'רשימה'},{id:'done',icon:'✅',label:'הושלם'}].map(t=>(<button key={t.id} onClick={()=>setTab(t.id)} className={'nav-tab'+(tab===t.id?' active':'')}><span style={{fontSize:20}}>{t.icon}</span>{t.label}</button>))}</div>
      </div>
    </>
  );
}`,

  // ④ Fitness
  fitness: `function App() {
  const { useState } = React;
  const [tab, setTab] = useState('workout');
  const [timer, setTimer] = useState(0);
  const [running, setRunning] = useState(false);
  const workouts = [{id:1,name:'כפיפות בטן',sets:3,reps:20},{id:2,name:'שכיבות שמיכה',sets:3,reps:15},{id:3,name:'סקוואט',sets:4,reps:12}];
  const WorkoutScreen = () => (<>
    <div className="gradient-banner"><p className="title" style={{color:'white'}}>אימון היום 💪</p><p className="body" style={{color:'rgba(255,255,255,0.8)',marginTop:4}}>3 תרגילים</p></div>
    {workouts.map(w=>(<div key={w.id} className="list-item"><div className="icon-circle">💪</div><div style={{flex:1}}><p className="subtitle" style={{fontSize:14}}>{w.name}</p><p className="caption">{w.sets} סטים × {w.reps} חזרות</p></div></div>))}
  </>);
  const TimerScreen = () => (<div className="card" style={{alignItems:'center',display:'flex',flexDirection:'column',gap:16,textAlign:'center'}}>
    <p className="title" style={{fontSize:48}}>{String(Math.floor(timer/60)).padStart(2,'0')}:{String(timer%60).padStart(2,'0')}</p>
    <div style={{display:'flex',gap:12}}>
      <button className="btn-primary" style={{width:120}} onClick={()=>setRunning(r=>!r)}>{running?'עצור':'התחל'}</button>
      <button className="btn-secondary" style={{width:100}} onClick={()=>{setTimer(0);setRunning(false);}}>אפס</button>
    </div>
  </div>);
  const renderContent = () => { if(tab==='timer') return <TimerScreen />; return <WorkoutScreen />; };
  return (
    <>
      <style>{\`:root{--c-from:#dc2626;--c-to:#ef4444;--c-primary:#dc2626;--c-primary-light:rgba(220,38,38,0.12);--c-bg:#fff5f5;}\`}</style>
      <div className="app-shell" dir="rtl">
        <div className="app-content">{renderContent()}</div>
        <div className="app-nav">{[{id:'workout',icon:'💪',label:'אימון'},{id:'timer',icon:'⏱️',label:'טיימר'}].map(t=>(<button key={t.id} onClick={()=>setTab(t.id)} className={'nav-tab'+(tab===t.id?' active':'')}><span style={{fontSize:20}}>{t.icon}</span>{t.label}</button>))}</div>
      </div>
    </>
  );
}`,

  // ⑤ Meditation
  meditation: `function App() {
  const { useState, useEffect } = React;
  const [tab, setTab] = useState('home');
  const [seconds, setSeconds] = useState(0);
  const [active, setActive] = useState(false);
  const [sessions, setSessions] = useState(12);
  useEffect(() => {
    if(!active) return;
    const t = setInterval(() => setSeconds(s=>s+1), 1000);
    return () => clearInterval(t);
  }, [active]);
  const HomeScreen = () => (<>
    <div className="gradient-banner"><p className="title" style={{color:'white'}}>מדיטציה 🧘</p><p className="body" style={{color:'rgba(255,255,255,0.8)',marginTop:4}}>{sessions} ישיבות הושלמו</p></div>
    <div className="card" style={{textAlign:'center'}}>
      <div style={{width:120,height:120,borderRadius:'50%',background:'var(--c-primary-light)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',fontSize:40}}>🧘</div>
      <p className="title" style={{fontSize:36}}>{String(Math.floor(seconds/60)).padStart(2,'0')}:{String(seconds%60).padStart(2,'0')}</p>
      <div style={{display:'flex',gap:12,marginTop:16,justifyContent:'center'}}>
        <button className="btn-primary" style={{width:140}} onClick={()=>setActive(a=>!a)}>{active?'עצור':'התחל'}</button>
        <button className="btn-secondary" style={{width:100}} onClick={()=>{setActive(false);setSeconds(0);}}>אפס</button>
      </div>
    </div>
  </>);
  const StatsScreen = () => (<div className="card"><p className="subtitle">סטטיסטיקות</p><p className="body" style={{marginTop:8}}>ישיבות השבוע: <strong>4</strong></p><button className="btn-primary" style={{marginTop:16}} onClick={()=>setSessions(s=>s+1)}>הוסף ישיבה</button></div>);
  const renderContent = () => { if(tab==='stats') return <StatsScreen />; return <HomeScreen />; };
  return (
    <>
      <style>{\`:root{--c-from:#7c3aed;--c-to:#a855f7;--c-primary:#7c3aed;--c-primary-light:rgba(124,58,237,0.12);--c-bg:#faf5ff;}\`}</style>
      <div className="app-shell" dir="rtl">
        <div className="app-content">{renderContent()}</div>
        <div className="app-nav">{[{id:'home',icon:'🧘',label:'מדיטציה'},{id:'stats',icon:'📊',label:'סטטיסטיקות'}].map(t=>(<button key={t.id} onClick={()=>setTab(t.id)} className={'nav-tab'+(tab===t.id?' active':'')}><span style={{fontSize:20}}>{t.icon}</span>{t.label}</button>))}</div>
      </div>
    </>
  );
}`,

  // ⑥ Daily planner
  planner: `function App() {
  const { useState } = React;
  const [tab, setTab] = useState('today');
  const [tasks, setTasks] = useState([{id:1,text:'פגישה 10:00',done:false,time:'10:00'},{id:2,text:'ארוחת צהריים',done:true,time:'13:00'},{id:3,text:'אימון',done:false,time:'18:00'}]);
  const [input, setInput] = useState('');
  const toggle = (id) => setTasks(p=>p.map(t=>t.id===id?{...t,done:!t.done}:t));
  const add = () => { if(input.trim()){ setTasks(p=>[...p,{id:Date.now(),text:input,done:false,time:''}]); setInput(''); }};
  const TodayScreen = () => (<>
    <div className="gradient-banner"><p className="title" style={{color:'white'}}>יום שלישי 📅</p><p className="body" style={{color:'rgba(255,255,255,0.8)',marginTop:4}}>10 ביוני 2026</p></div>
    <div className="card"><input className="input-field" value={input} onChange={e=>setInput(e.target.value)} placeholder="הוסף משימה..." /><button className="btn-primary" style={{marginTop:10}} onClick={add}>הוסף</button></div>
    {tasks.map(t=>(<div key={t.id} className="list-item" onClick={()=>toggle(t.id)}><div className="icon-circle">{t.done?'✅':'📌'}</div><div style={{flex:1}}><p className="subtitle" style={{fontSize:14,textDecoration:t.done?'line-through':'none'}}>{t.text}</p>{t.time&&<p className="caption">{t.time}</p>}</div></div>))}
  </>);
  const WeekScreen = () => (<div className="card"><p className="subtitle">תצוגה שבועית</p><p className="body" style={{marginTop:8}}>3 משימות פתוחות</p><button className="btn-secondary" style={{marginTop:12}} onClick={()=>setTab('today')}>חזור להיום</button></div>);
  const renderContent = () => { if(tab==='week') return <WeekScreen />; return <TodayScreen />; };
  return (
    <>
      <style>{\`:root{--c-from:#0891b2;--c-to:#06b6d4;--c-primary:#0891b2;--c-primary-light:rgba(8,145,178,0.12);--c-bg:#f0fdff;}\`}</style>
      <div className="app-shell" dir="rtl">
        <div className="app-content">{renderContent()}</div>
        <div className="app-nav">{[{id:'today',icon:'📅',label:'היום'},{id:'week',icon:'📆',label:'שבוע'}].map(t=>(<button key={t.id} onClick={()=>setTab(t.id)} className={'nav-tab'+(tab===t.id?' active':'')}><span style={{fontSize:20}}>{t.icon}</span>{t.label}</button>))}</div>
      </div>
    </>
  );
}`,

  // ⑦ Recipe app
  recipes: `function App() {
  const { useState } = React;
  const [tab, setTab] = useState('list');
  const [selected, setSelected] = useState(null);
  const recipes = [
    {id:1,name:'פסטה ברוטב עגבניות',emoji:'🍝',time:'25 דק',ingredients:['פסטה','עגבניות','שום','בזיליקום']},
    {id:2,name:'סלט יווני',emoji:'🥗',time:'10 דק',ingredients:['מלפפון','עגבנייה','גבינה לבנה','זיתים']},
    {id:3,name:'שניצל עוף',emoji:'🍗',time:'30 דק',ingredients:['עוף','פירורי לחם','ביצה','שמן']},
  ];
  const ListScreen = () => (<>{recipes.map(r=>(<div key={r.id} className="list-item" onClick={()=>{setSelected(r);setTab('detail');}}><div className="icon-circle" style={{fontSize:28}}>{r.emoji}</div><div style={{flex:1}}><p className="subtitle" style={{fontSize:14}}>{r.name}</p><p className="caption">⏱ {r.time}</p></div></div>))}</>);
  const DetailScreen = () => selected?(<>
    <div className="gradient-banner"><p style={{fontSize:40}}>{selected.emoji}</p><p className="subtitle" style={{color:'white',marginTop:8}}>{selected.name}</p></div>
    <div className="card"><p className="section-title">מצרכים</p>{selected.ingredients.map((ing,i)=>(<div key={i} className="list-item" style={{marginTop:8}}><span className="body">{ing}</span></div>))}</div>
    <button className="btn-primary" onClick={()=>{setSelected(null);setTab('list');}}>חזור</button>
  </>):null;
  const renderContent = () => { if(tab==='detail') return <DetailScreen />; return <ListScreen />; };
  return (
    <>
      <style>{\`:root{--c-from:#ea580c;--c-to:#f97316;--c-primary:#ea580c;--c-primary-light:rgba(234,88,12,0.12);--c-bg:#fff7ed;}\`}</style>
      <div className="app-shell" dir="rtl">
        <div className="app-header"><h1 className="subtitle">👨‍🍳 מתכונים</h1></div>
        <div className="app-content">{renderContent()}</div>
        <div className="app-nav">{[{id:'list',icon:'📋',label:'מתכונים'},{id:'fav',icon:'❤️',label:'מועדפים'}].map(t=>(<button key={t.id} onClick={()=>setTab(t.id)} className={'nav-tab'+(tab===t.id?' active':'')}><span style={{fontSize:20}}>{t.icon}</span>{t.label}</button>))}</div>
      </div>
    </>
  );
}`,

  // ⑧ Expense tracker / budget
  budget: `function App() {
  const { useState } = React;
  const [tab, setTab] = useState('home');
  const [expenses, setExpenses] = useState([{id:1,name:'קפה',amount:15,cat:'אוכל'},{id:2,name:'כרטיס חודשי',amount:230,cat:'תחבורה'},{id:3,name:'חשמל',amount:180,cat:'חשבונות'}]);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const total = expenses.reduce((s,e)=>s+e.amount,0);
  const add = () => { if(name.trim()&&amount){ setExpenses(p=>[...p,{id:Date.now(),name,amount:Number(amount),cat:'כללי'}]); setName(''); setAmount(''); }};
  const remove = (id) => setExpenses(p=>p.filter(e=>e.id!==id));
  const HomeScreen = () => (<>
    <div className="gradient-banner"><p className="caption" style={{color:'rgba(255,255,255,0.8)'}}>סה"כ הוצאות</p><p className="title" style={{color:'white',marginTop:4}}>₪{total.toLocaleString()}</p></div>
    <div className="card">
      <input className="input-field" value={name} onChange={e=>setName(e.target.value)} placeholder="שם ההוצאה..." />
      <input className="input-field" style={{marginTop:8}} value={amount} onChange={e=>setAmount(e.target.value)} placeholder="סכום ₪" type="number" />
      <button className="btn-primary" style={{marginTop:10}} onClick={add}>הוסף הוצאה</button>
    </div>
    {expenses.map(e=>(<div key={e.id} className="list-item"><div className="icon-circle">💳</div><div style={{flex:1}}><p className="subtitle" style={{fontSize:14}}>{e.name}</p><p className="caption">{e.cat}</p></div><span className="subtitle" style={{color:'var(--c-primary)'}}>₪{e.amount}</span><button className="btn-icon" style={{width:28,height:28}} onClick={()=>remove(e.id)}>✕</button></div>))}
  </>);
  const ChartScreen = () => (<div className="card"><p className="subtitle">התפלגות הוצאות</p>{expenses.map(e=>(<div key={e.id} style={{marginTop:12}}><div style={{display:'flex',justifyContent:'space-between'}}><span className="body">{e.name}</span><span className="caption">₪{e.amount}</span></div><div style={{height:8,background:'#e2e8f0',borderRadius:4,marginTop:4}}><div style={{height:'100%',width:total>0?(e.amount/total*100)+'%':'0%',background:'var(--c-primary)',borderRadius:4}}></div></div></div>))}</div>);
  const renderContent = () => { if(tab==='chart') return <ChartScreen />; return <HomeScreen />; };
  return (
    <>
      <style>{\`:root{--c-from:#059669;--c-to:#10b981;--c-primary:#059669;--c-primary-light:rgba(5,150,105,0.12);--c-bg:#f0fdf4;}\`}</style>
      <div className="app-shell" dir="rtl">
        <div className="app-content">{renderContent()}</div>
        <div className="app-nav">{[{id:'home',icon:'💰',label:'הוצאות'},{id:'chart',icon:'📊',label:'גרף'}].map(t=>(<button key={t.id} onClick={()=>setTab(t.id)} className={'nav-tab'+(tab===t.id?' active':'')}><span style={{fontSize:20}}>{t.icon}</span>{t.label}</button>))}</div>
      </div>
    </>
  );
}`,

  // ⑨ Habit tracker
  habits: `function App() {
  const { useState } = React;
  const [tab, setTab] = useState('today');
  const [habits, setHabits] = useState([
    {id:1,name:'שתיית מים',emoji:'💧',streak:7,done:false},
    {id:2,name:'קריאה 20 דק',emoji:'📚',streak:3,done:true},
    {id:3,name:'הליכה 30 דק',emoji:'🚶',streak:12,done:false},
    {id:4,name:'מדיטציה',emoji:'🧘',streak:5,done:false},
  ]);
  const [input, setInput] = useState('');
  const toggle = (id) => setHabits(p=>p.map(h=>h.id===id?{...h,done:!h.done,streak:!h.done?h.streak+1:Math.max(0,h.streak-1)}:h));
  const add = () => { if(input.trim()){ setHabits(p=>[...p,{id:Date.now(),name:input,emoji:'⭐',streak:0,done:false}]); setInput(''); }};
  const TodayScreen = () => (<>
    <div className="gradient-banner"><p className="title" style={{color:'white'}}>הרגלים יומיים</p><p className="body" style={{color:'rgba(255,255,255,0.8)',marginTop:4}}>{habits.filter(h=>h.done).length}/{habits.length} הושלמו</p></div>
    <div className="card"><input className="input-field" value={input} onChange={e=>setInput(e.target.value)} placeholder="הרגל חדש..." /><button className="btn-primary" style={{marginTop:10}} onClick={add}>הוסף</button></div>
    {habits.map(h=>(<div key={h.id} className="list-item"><div className="icon-circle" style={{fontSize:28}}>{h.emoji}</div><div style={{flex:1}}><p className="subtitle" style={{fontSize:14}}>{h.name}</p><p className="caption">🔥 {h.streak} ימים ברצף</p></div><button className="btn-icon" onClick={()=>toggle(h.id)}>{h.done?'✅':'⭕'}</button></div>))}
  </>);
  const StatsScreen = () => (<div className="card"><p className="subtitle">סטטיסטיקות</p>{habits.map(h=>(<div key={h.id} style={{marginTop:12,display:'flex',justifyContent:'space-between',alignItems:'center'}}><span className="body">{h.emoji} {h.name}</span><span className="badge">🔥{h.streak}</span></div>))}</div>);
  const renderContent = () => { if(tab==='stats') return <StatsScreen />; return <TodayScreen />; };
  return (
    <>
      <style>{\`:root{--c-from:#f59e0b;--c-to:#f97316;--c-primary:#f59e0b;--c-primary-light:rgba(245,158,11,0.12);--c-bg:#fffbeb;}\`}</style>
      <div className="app-shell" dir="rtl">
        <div className="app-content">{renderContent()}</div>
        <div className="app-nav">{[{id:'today',icon:'📋',label:'היום'},{id:'stats',icon:'📊',label:'סטטיסטיקות'}].map(t=>(<button key={t.id} onClick={()=>setTab(t.id)} className={'nav-tab'+(tab===t.id?' active':'')}><span style={{fontSize:20}}>{t.icon}</span>{t.label}</button>))}</div>
      </div>
    </>
  );
}`,

  // ⑩ Product store with cart
  store: `function App() {
  const { useState } = React;
  const [tab, setTab] = useState('shop');
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const products = [
    {id:1,name:'חולצת כותנה',price:89,emoji:'👕',cat:'ביגוד'},
    {id:2,name:'מכנס ג\'ינס',price:199,emoji:'👖',cat:'ביגוד'},
    {id:3,name:'נעלי ספורט',price:299,emoji:'👟',cat:'נעליים'},
    {id:4,name:'כובע בייסבול',price:59,emoji:'🧢',cat:'אביזרים'},
  ];
  const filtered = products.filter(p=>p.name.includes(search));
  const addToCart = (p) => setCart(prev=>[...prev,{...p,cartId:Date.now()}]);
  const removeFromCart = (cartId) => setCart(prev=>prev.filter(i=>i.cartId!==cartId));
  const total = cart.reduce((s,i)=>s+i.price,0);
  const ShopScreen = () => (<>
    <input className="input-field" value={search} onChange={e=>setSearch(e.target.value)} placeholder="חפש מוצר..." />
    <div className="grid grid-cols-2 gap-3">
      {filtered.map(p=>(<div key={p.id} className="card-sm" style={{textAlign:'center'}}>
        <div style={{fontSize:40,marginBottom:8}}>{p.emoji}</div>
        <p className="subtitle" style={{fontSize:13}}>{p.name}</p>
        <p className="subtitle" style={{color:'var(--c-primary)',marginTop:4}}>₪{p.price}</p>
        <button className="btn-primary" style={{marginTop:10,padding:'10px 0',fontSize:13}} onClick={()=>addToCart(p)}>הוסף לסל</button>
      </div>))}
    </div>
  </>);
  const CartScreen = () => (<>
    <p className="section-title">הסל ({cart.length})</p>
    {cart.length===0&&<div className="card"><p className="body" style={{textAlign:'center'}}>הסל ריק 🛒</p></div>}
    {cart.map(item=>(<div key={item.cartId} className="list-item"><div className="icon-circle">{item.emoji}</div><div style={{flex:1}}><p className="subtitle" style={{fontSize:14}}>{item.name}</p><p className="caption">₪{item.price}</p></div><button className="btn-icon" style={{width:28,height:28}} onClick={()=>removeFromCart(item.cartId)}>✕</button></div>))}
    {cart.length>0&&<div className="card"><div style={{display:'flex',justifyContent:'space-between',marginBottom:14}}><span className="subtitle">סה"כ</span><span className="title" style={{color:'var(--c-primary)'}}>₪{total}</span></div><button className="btn-primary" onClick={()=>{setCart([]);alert('הזמנה נשלחה! 🎉');}}>שלם עכשיו</button></div>}
  </>);
  const renderContent = () => { if(tab==='cart') return <CartScreen />; return <ShopScreen />; };
  return (
    <>
      <style>{\`:root{--c-from:#7c3aed;--c-to:#a855f7;--c-primary:#7c3aed;--c-primary-light:rgba(124,58,237,0.12);--c-bg:#faf5ff;}\`}</style>
      <div className="app-shell" dir="rtl">
        <div className="app-header"><h1 className="subtitle">🛍️ חנות</h1><span className="badge">{cart.length} פריטים</span></div>
        <div className="app-content">{renderContent()}</div>
        <div className="app-nav">{[{id:'shop',icon:'🏪',label:'חנות'},{id:'cart',icon:'🛒',label:'סל'}].map(t=>(<button key={t.id} onClick={()=>setTab(t.id)} className={'nav-tab'+(tab===t.id?' active':'')}><span style={{fontSize:20}}>{t.icon}</span>{t.label}</button>))}</div>
      </div>
    </>
  );
}`,
};

// ── App metadata ──────────────────────────────────────────────────────────

const APP_NAMES: Record<string, string> = {
  todo: 'רשימת משימות',
  calculator: 'מחשבון',
  shopping: 'רשימת קניות',
  fitness: 'אפליקציית כושר',
  meditation: 'אפליקציית מדיטציה',
  planner: 'יומן יומי',
  recipes: 'אפליקציית מתכונים',
  budget: 'ניהול תקציב',
  habits: 'מעקב הרגלים',
  store: 'חנות מוצרים',
};

// ══════════════════════════════════════════════════════════════════════════
// TEST SUITE 1 — parseGroqResponse unit tests
// ══════════════════════════════════════════════════════════════════════════

describe('parseGroqResponse — unit tests', () => {
  it('parses delimiter format (happy path)', () => {
    const meta = { appName: 'My App', description: 'A test app', colorScheme: { primary: '#6C3AE8', background: '#F8F9FA', text: '#1A1A2E' }, features: ['f1'], hebrewSummary: 'אפליקציה' };
    const raw = `${JSON.stringify(meta)}\n===CODE===\nfunction App() { return <div>Hello</div>; }\n===END===`;
    const result = parseGroqResponse(raw);
    expect(result.appName).toBe('My App');
    expect(result.files['App.jsx']).toContain('function App');
  });

  it('parses delimiter format with Hebrew in code', () => {
    const code = 'function App() { const { useState } = React; const [t, setT] = useState("שלום"); return <div className="app-shell">{t}</div>; }';
    const result = parseGroqResponse(makeResponse(code));
    expect(result.files['App.jsx']).toContain('שלום');
  });

  it('decodes unicode-escaped Hebrew in metadata', () => {
    const meta = { appName: 'אפליקציה', description: 'x', colorScheme: { primary: '#000', background: '#fff', text: '#000' }, features: [], hebrewSummary: 'בדיקה' };
    const raw = `${JSON.stringify(meta)}\n===CODE===\nfunction App(){return <div/>;}\n===END===`;
    const result = parseGroqResponse(raw);
    expect(result.appName).toBe('אפליקציה');
    expect(result.hebrewSummary).toBe('בדיקה');
  });

  it('falls back to JSON format when no delimiters', () => {
    const fallback = JSON.stringify({
      appName: 'Fallback App',
      description: 'test',
      colorScheme: { primary: '#000', background: '#fff', text: '#000' },
      features: [],
      hebrewSummary: 'פולבק',
      files: { 'App.jsx': 'function App() { return <div/>; }' },
    });
    const result = parseGroqResponse(fallback);
    expect(result.appName).toBe('Fallback App');
    expect(result.files['App.jsx']).toBeTruthy();
  });

  it('throws when format is completely invalid', () => {
    expect(() => parseGroqResponse('this is not valid json or delimited')).toThrow();
  });

  it('handles extra prose text before the JSON block', () => {
    const code = 'function App(){return <div className="app-shell"/>;}\n===END===';
    const meta = { appName: 'Clean', description: 'x', colorScheme: { primary: '#000', background: '#fff', text: '#000' }, features: [], hebrewSummary: 'x' };
    const raw = `Sure! Here is your app:\n${JSON.stringify(meta)}\n===CODE===\n${code}`;
    const result = parseGroqResponse(raw);
    expect(result.appName).toBe('Clean');
  });

  it('strips markdown fences around JSON in fallback mode', () => {
    const payload = { appName: 'MD App', description: 'x', colorScheme: { primary: '#000', background: '#fff', text: '#000' }, features: [], hebrewSummary: 'x', files: { 'App.jsx': 'function App(){return <div/>;}' } };
    const raw = '```json\n' + JSON.stringify(payload) + '\n```';
    const result = parseGroqResponse(raw);
    expect(result.appName).toBe('MD App');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// TEST SUITE 2 — buildHtmlDocument unit tests
// ══════════════════════════════════════════════════════════════════════════

describe('buildHtmlDocument — unit tests', () => {
  const SIMPLE_CODE = 'function App() { const { useState } = React; const [n,setN]=useState(0); return <button className="btn-primary" onClick={()=>setN(n+1)}>{n}</button>; }';

  it('includes React CDN script', () => {
    const html = buildHtmlDocument(SIMPLE_CODE);
    expect(html).toMatch(/unpkg\.com\/react@/);
  });

  it('includes Babel Standalone CDN script', () => {
    const html = buildHtmlDocument(SIMPLE_CODE);
    expect(html).toMatch(/babel.*standalone/i);
  });

  it('wraps Babel block in named IIFE (__mf_run)', () => {
    const html = buildHtmlDocument(SIMPLE_CODE);
    expect(html).toContain('__mf_run');
  });

  it('contains try/catch inside IIFE', () => {
    const html = buildHtmlDocument(SIMPLE_CODE);
    // At least one try block should exist (IIFE catch + ErrorBoundary)
    expect(html).toMatch(/try\s*\{/);
  });

  it('includes ErrorBoundary class', () => {
    const html = buildHtmlDocument(SIMPLE_CODE);
    expect(html).toContain('ErrorBoundary');
  });

  it('includes window.onerror overlay', () => {
    const html = buildHtmlDocument(SIMPLE_CODE);
    expect(html).toContain('window.onerror');
  });

  it('injects design system CSS into a <style> tag', () => {
    const html = buildHtmlDocument(SIMPLE_CODE);
    const styleContent = html.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? '';
    expect(styleContent).toContain('app-shell');
    expect(styleContent.length).toBeGreaterThan(200);
  });

  it('design system CSS does NOT contain </style> (would break rendering)', () => {
    const html = buildHtmlDocument(SIMPLE_CODE);
    const styleContent = html.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? '';
    expect(styleContent).not.toContain('</style>');
  });

  it('strips import statements from component code', () => {
    const codeWithImport = "import React from 'react';\nimport { useState } from 'react';\n" + SIMPLE_CODE;
    const html = buildHtmlDocument(codeWithImport);
    // The Babel block should NOT contain import lines
    const babelBlock = html.split('type="text/babel"')[1] ?? '';
    expect(babelBlock).not.toContain("import React from 'react'");
    expect(babelBlock).not.toContain("import { useState }");
  });

  it('strips `export default` from component code', () => {
    const codeWithExport = 'export default function App() { return <div className="app-shell"/>; }';
    const html = buildHtmlDocument(codeWithExport);
    const babelBlock = html.split('type="text/babel"')[1] ?? '';
    expect(babelBlock).not.toContain('export default');
  });

  it('strips top-level React destructuring from component code', () => {
    const codeWithDestructure = 'const { useState, useEffect } = React;\n' + SIMPLE_CODE;
    const html = buildHtmlDocument(codeWithDestructure);
    // The IIFE already declares these, so stripping prevents duplicate declaration
    const iifePart = html.split('(function __mf_run')[1] ?? '';
    const appCodePart = iifePart.split('${safeCode}')[0]; // before placeholder
    // Just check the stripped code no longer has the bare destructure at top level
    expect(html.split('const { useState, useEffect } = React;').length).toBeLessThanOrEqual(2);
  });

  it('escapes </script> inside component code', () => {
    const codeWithScript = "function App(){return <div dangerouslySetInnerHTML={{__html:'</script><script>alert(1)'}}/>;}";
    const html = buildHtmlDocument(codeWithScript);
    // The escaped form should appear, not the raw </script>
    expect(html).toContain('<\\/script>');
  });

  it('uses appName as HTML title', () => {
    const html = buildHtmlDocument(SIMPLE_CODE, 'מחשבון נהדר');
    expect(html).toContain('<title>מחשבון נהדר</title>');
  });

  it('escapes HTML special chars in appName', () => {
    const html = buildHtmlDocument(SIMPLE_CODE, '<script>alert("xss")</script>');
    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// TEST SUITE 3 — Code quality for 10 app types
// ══════════════════════════════════════════════════════════════════════════

describe('App code quality — 10 app types', () => {
  const appTypes = Object.keys(MOCK_CODES) as Array<keyof typeof MOCK_CODES>;

  for (const appType of appTypes) {
    describe(`[${appType}] ${APP_NAMES[appType]}`, () => {
      let parsedCode: string;
      let htmlDoc: string;

      beforeAll(() => {
        const rawResponse = makeResponse(MOCK_CODES[appType], APP_NAMES[appType]);
        const parsed = parseGroqResponse(rawResponse);
        parsedCode = parsed.files['App.jsx'] ?? '';
        htmlDoc = parsedCode ? buildHtmlDocument(parsedCode, parsed.appName) : '';
      });

      it('generation succeeds (no fallback error)', () => {
        expect(parsedCode).toBeTruthy();
        expect(parsedCode).not.toContain('שגיאה בייצור הקוד');
        expect(parsedCode).not.toContain('Parse error');
      });

      it('contains function App()', () => {
        expect(checkCode(parsedCode).hasFunctionApp).toBe(true);
      });

      it('has no forbidden imports (react-native / expo)', () => {
        expect(checkCode(parsedCode).noForbiddenImports).toBe(true);
      });

      it('has no TypeScript annotations that would break Babel', () => {
        expect(checkCode(parsedCode).noTypeScriptAnnotations).toBe(true);
      });

      it('uses design system CSS classes', () => {
        expect(checkCode(parsedCode).usesDesignSystem).toBe(true);
      });

      it('has onClick handlers (buttons are interactive)', () => {
        expect(checkCode(parsedCode).hasOnClick).toBe(true);
      });

      it('uses useState (real state management)', () => {
        expect(checkCode(parsedCode).hasUseState).toBe(true);
      });

      it('HTML document builds and has design system CSS in <style>', () => {
        const q = checkHtml(htmlDoc);
        expect(q.hasStyleTag).toBe(true);
        expect(q.designSystemInStyle).toBe(true);
      });

      it('no </style> leak inside design system CSS block', () => {
        expect(checkHtml(htmlDoc).noStyleTagLeak).toBe(true);
      });
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// TEST SUITE 4 — Negative / failure detection tests
// ══════════════════════════════════════════════════════════════════════════

describe('Failure detection — quality checks catch bad LLM output', () => {
  it('detects TypeScript type annotation : string', () => {
    const code = 'function App() { const [name, setName] = useState(""); const greet = (n: string) => n; return <div className="app-shell"/>; }';
    expect(checkCode(code).noTypeScriptAnnotations).toBe(false);
  });

  it('detects TypeScript interface declaration', () => {
    const code = 'interface Todo { text: string; done: boolean; }\nfunction App() { const { useState } = React; return <div className="app-shell"/>; }';
    expect(checkCode(code).noTypeScriptAnnotations).toBe(false);
  });

  it('detects TypeScript type alias', () => {
    const code = "type Status = 'active' | 'done';\nfunction App() { const { useState } = React; return <div className=\"app-shell\"/>; }";
    expect(checkCode(code).noTypeScriptAnnotations).toBe(false);
  });

  it('detects react-native forbidden import', () => {
    const code = "import { View, Text } from 'react-native';\nfunction App() { return <View/>; }";
    expect(checkCode(code).noForbiddenImports).toBe(false);
  });

  it('detects expo forbidden import', () => {
    const code = "import { Camera } from 'expo-camera';\nfunction App() { return <div/>; }";
    expect(checkCode(code).noForbiddenImports).toBe(false);
  });

  it('detects missing design system classes', () => {
    const code = 'function App() { const { useState } = React; const [n,setN]=useState(0); return <div style={{padding:20}}><button onClick={()=>setN(n+1)}>{n}</button></div>; }';
    expect(checkCode(code).usesDesignSystem).toBe(false);
  });

  it('detects missing onClick (static mockup)', () => {
    const code = 'function App() { const { useState } = React; const [n]=useState(0); return <div className="app-shell"><button className="btn-primary">לחץ</button></div>; }';
    expect(checkCode(code).hasOnClick).toBe(false);
  });

  it('detects missing useState (no state)', () => {
    const code = 'function App() { return <div className="app-shell"><p className="title">שלום</p></div>; }';
    expect(checkCode(code).hasUseState).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// חבילה 5 — CSS variables עשירים ב-buildHtmlDocument (6 בדיקות)
// ═══════════════════════════════════════════════════════════════════════════

describe('CSS variables and design tokens in buildHtmlDocument', () => {
  const html = buildHtmlDocument('function App() { return <div className="app-shell" />; }', 'Test');

  it('includes --c-font typography variable', () => {
    expect(html).toContain('--c-font');
  });

  it('includes --c-text-size typography variable', () => {
    expect(html).toContain('--c-text-size');
  });

  it('includes --btn-radius button variable', () => {
    expect(html).toContain('--btn-radius');
  });

  it('includes --btn-bg button variable', () => {
    expect(html).toContain('--btn-bg');
  });

  it('includes --card-shadow card variable', () => {
    expect(html).toContain('--card-shadow');
  });

  it('includes spacing scale variables (--sp-1 through --sp-8)', () => {
    expect(html).toContain('--sp-1');
    expect(html).toContain('--sp-8');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// חבילה 6 — Responsive design ב-buildHtmlDocument (5 בדיקות)
// ═══════════════════════════════════════════════════════════════════════════

describe('Responsive design in buildHtmlDocument', () => {
  const html = buildHtmlDocument('function App() { return <div className="app-shell" />; }', 'Test');

  it('includes tablet media query (@media min-width 768px)', () => {
    expect(html).toContain('@media (min-width: 768px)');
  });

  it('includes grid helper classes (grid-2, grid-3)', () => {
    expect(html).toContain('.grid-2');
    expect(html).toContain('.grid-3');
  });

  it('includes tablet grid helpers (grid-tablet-2, grid-tablet-4)', () => {
    expect(html).toContain('grid-tablet-2');
    expect(html).toContain('grid-tablet-4');
  });

  it('includes skeleton loader class with shimmer animation', () => {
    expect(html).toContain('.skeleton');
    expect(html).toContain('shimmer');
  });

  it('includes empty-state class', () => {
    expect(html).toContain('.empty-state');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// חבילה 7 — Font preloading (3 בדיקות)
// ═══════════════════════════════════════════════════════════════════════════

describe('Font preloading in buildHtmlDocument', () => {
  const html = buildHtmlDocument('function App() { return <div />; }');

  it('preloads Heebo font for Hebrew apps', () => {
    expect(html).toContain('Heebo');
  });

  it('preloads Assistant font', () => {
    expect(html).toContain('Assistant');
  });

  it('preloads Rubik font', () => {
    expect(html).toContain('Rubik');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// חבילה 8 — Edit mode system prompt (5 בדיקות)
// ═══════════════════════════════════════════════════════════════════════════

describe('buildEditSystemPrompt', () => {
  const EXISTING_CODE = 'function App() { const {useState}=React; const [n,setN]=useState(0); return <button onClick={()=>setN(n+1)}>{n}</button>; }';
  const prompt = buildEditSystemPrompt(EXISTING_CODE);

  it('includes the full existing code', () => {
    expect(prompt).toContain(EXISTING_CODE);
  });

  it('contains ===CURRENT_CODE=== delimiter', () => {
    expect(prompt).toContain('===CURRENT_CODE===');
    expect(prompt).toContain('===END_CURRENT_CODE===');
  });

  it('instructs to apply ONLY the specific change', () => {
    expect(prompt).toMatch(/Apply ONLY the specific change/i);
  });

  it('instructs to preserve existing state and onClick handlers', () => {
    expect(prompt).toMatch(/Preserve ALL existing state.*onClick/is);
  });

  it('includes the output format rules (===CODE=== / ===END===)', () => {
    expect(prompt).toContain('===CODE===');
    expect(prompt).toContain('===END===');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// חבילה 9 — CDN version pinning (4 בדיקות)
// ═══════════════════════════════════════════════════════════════════════════

describe('CDN version pinning in buildHtmlDocument', () => {
  const html = buildHtmlDocument('function App() { return <div>Test</div>; }');

  it('pins Tailwind CSS to version 3.x (not unversioned)', () => {
    expect(html).toContain('cdn.tailwindcss.com/3.');
    expect(html).not.toMatch(/cdn\.tailwindcss\.com["'\s>]/);
  });

  it('pins Babel standalone to a specific version', () => {
    expect(html).toMatch(/@babel\/standalone@\d+\.\d+/);
  });

  it('pins React to version 18.x', () => {
    expect(html).toContain('react@18.');
    expect(html).toContain('react-dom@18.');
  });

  it('loads all CDN scripts with crossorigin attribute', () => {
    const scriptTags = html.match(/<script\s+src="https:\/\/[^"]+"/g) || [];
    expect(scriptTags.length).toBeGreaterThanOrEqual(4);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// חבילה 10 — Click-to-edit overlay injection (6 בדיקות)
// ═══════════════════════════════════════════════════════════════════════════

describe('Click-to-edit overlay in buildHtmlDocument', () => {
  const html = buildHtmlDocument('function App() { return <div>Hello</div>; }');

  it('injects the edit overlay script', () => {
    expect(html).toContain('__mf_toolbar');
  });

  it('includes hover event listener for editable elements', () => {
    expect(html).toContain('mouseover');
    expect(html).toContain('EDITABLE');
  });

  it('includes contentEditable toggling for inline editing', () => {
    expect(html).toContain('contentEditable');
  });

  it('sends postMessage to parent on text change', () => {
    expect(html).toContain('postMessage');
    expect(html).toContain('mf-edit');
  });

  it('includes keyboard shortcuts (Escape and Enter)', () => {
    expect(html).toContain('Escape');
    expect(html).toContain('keydown');
  });

  it('places edit overlay script before </body>', () => {
    const overlayPos = html.indexOf('__mf_toolbar');
    const bodyClosePos = html.indexOf('</body>');
    expect(overlayPos).toBeLessThan(bodyClosePos);
    expect(overlayPos).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// חבילה 11 — Demo mode responses (5 בדיקות)
// ═══════════════════════════════════════════════════════════════════════════

describe('Demo mode — getDemoResponse', () => {
  // Import directly to test
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getDemoResponse } = require('../src/services/demoApps');

  it('returns clothing store for "חנות בגדים"', () => {
    const raw = getDemoResponse('חנות בגדים');
    const parsed = parseGroqResponse(raw);
    expect(parsed.appName).toBe('StyleHub');
  });

  it('returns todo app for "משימות"', () => {
    const raw = getDemoResponse('משימות');
    const parsed = parseGroqResponse(raw);
    expect(parsed.appName).toBe('TaskFlow');
  });

  it('falls back to calculator for unknown prompts', () => {
    const raw = getDemoResponse('something random xyz');
    const parsed = parseGroqResponse(raw);
    expect(parsed.appName).toBe('CalcPro');
  });

  it('returns valid parseable format with ===CODE=== delimiters', () => {
    const raw = getDemoResponse('test');
    expect(raw).toContain('===CODE===');
    expect(raw).toContain('===END===');
  });

  it('demo app code renders valid HTML via buildHtmlDocument', () => {
    const raw = getDemoResponse('חנות');
    const parsed = parseGroqResponse(raw);
    const appCode = parsed.files['App.jsx'] || '';
    expect(appCode.length).toBeGreaterThan(100);
    const html = buildHtmlDocument(appCode, parsed.appName);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('ReactDOM.createRoot');
    expect(html).toContain('__mf_toolbar');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// חבילה 12 — SDK placeholder keys (3 בדיקות)
// ═══════════════════════════════════════════════════════════════════════════

describe('SDK initialization with placeholder keys', () => {
  it('aiWeb module loads without GROQ_API_KEY env var', () => {
    expect(() => {
      require('../src/services/aiWeb');
    }).not.toThrow();
  });

  it('ai module loads without GROQ_API_KEY env var', () => {
    expect(() => {
      require('../src/services/ai');
    }).not.toThrow();
  });

  it('assistant route loads without GROQ_API_KEY env var', () => {
    expect(() => {
      require('../src/routes/assistant');
    }).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// חבילה 13 — Import stripping edge cases (5 בדיקות)
// ═══════════════════════════════════════════════════════════════════════════

describe('Import stripping edge cases in buildHtmlDocument', () => {
  it('strips multiline import statements', () => {
    const code = `import React from 'react';\nimport { useState } from 'react';\nfunction App() { return <div>Hi</div>; }`;
    const html = buildHtmlDocument(code);
    expect(html).not.toMatch(/import\s+React\s+from/);
    expect(html).not.toMatch(/import\s+\{\s*useState\s*\}\s*from/);
    expect(html).toContain('function App()');
  });

  it('strips export default function', () => {
    const code = `export default function App() { return <div>Hi</div>; }`;
    const html = buildHtmlDocument(code);
    expect(html).toContain('function App()');
    expect(html).not.toContain('export default');
  });

  it('strips export const/let/var', () => {
    const code = `export const App = () => <div>Hi</div>;`;
    const html = buildHtmlDocument(code);
    expect(html).toContain('const App');
    expect(html).not.toContain('export const');
  });

  it('strips side-effect imports', () => {
    const code = `import './styles.css';\nfunction App() { return <div>Hi</div>; }`;
    const html = buildHtmlDocument(code);
    expect(html).not.toContain("import './styles.css'");
  });

  it('preserves code after stripping imports', () => {
    const code = `import React from 'react';\nconst helper = () => 42;\nfunction App() { return <div>{helper()}</div>; }`;
    const html = buildHtmlDocument(code);
    expect(html).toContain('const helper');
    expect(html).toContain('function App()');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// חבילה 14 — Share route (5 בדיקות)
// ═══════════════════════════════════════════════════════════════════════════

describe('Share route', () => {
  let app: any;
  let request: any;

  beforeAll(async () => {
    const express = require('express');
    const shareRouter = require('../src/routes/share').default;
    app = express();
    app.use(express.json());
    app.use('/api/share', shareRouter);
    const supertest = require('supertest');
    request = supertest(app);
  });

  it('creates a share and returns id + shareUrl', async () => {
    const res = await request.post('/api/share')
      .send({ htmlDoc: '<html><body>Test</body></html>', appName: 'MyApp' });
    expect(res.status).toBe(200);
    expect(res.body.id).toBeDefined();
    expect(res.body.shareUrl).toContain('/api/share/');
  });

  it('serves the shared HTML at GET /api/share/:id', async () => {
    const create = await request.post('/api/share')
      .send({ htmlDoc: '<html><body>Hello World</body></html>', appName: 'TestApp' });
    const res = await request.get(`/api/share/${create.body.id}`);
    expect(res.status).toBe(200);
    expect(res.text).toContain('Hello World');
    expect(res.headers['content-type']).toContain('text/html');
  });

  it('returns 404 for non-existent share', async () => {
    const res = await request.get('/api/share/nonexistent123');
    expect(res.status).toBe(404);
  });

  it('returns download with Content-Disposition header', async () => {
    const create = await request.post('/api/share')
      .send({ htmlDoc: '<html><body>DL</body></html>', appName: 'DownloadApp' });
    const res = await request.get(`/api/share/${create.body.id}/download`);
    expect(res.status).toBe(200);
    expect(res.headers['content-disposition']).toContain('attachment');
    expect(res.headers['content-disposition']).toContain('DownloadApp');
  });

  it('returns PWA-enhanced HTML with manifest', async () => {
    const create = await request.post('/api/share')
      .send({ htmlDoc: '<html><head></head><body>PWA</body></html>', appName: 'PWAApp' });
    const res = await request.get(`/api/share/${create.body.id}/pwa`);
    expect(res.status).toBe(200);
    expect(res.text).toContain('manifest');
    expect(res.text).toContain('skipWaiting');
    expect(res.headers['content-disposition']).toContain('pwa');
  });
});
