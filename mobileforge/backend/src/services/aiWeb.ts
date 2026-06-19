import Groq from 'groq-sdk';
import { getDemoResponse, getDemoEditResponse } from './demoApps';

const client = new Groq({ apiKey: process.env.GROQ_API_KEY || 'placeholder-for-demo-mode' });
const MODEL = 'llama-3.3-70b-versatile';

// Log key status once on startup (last 4 chars only, never full key)
const _k = (v: string | undefined) => v ? (v.length > 4 ? `…${v.slice(-4)}` : '(set)') : '⚠️ MISSING';
console.log('[AI/web] Provider keys —', {
  GROQ:        _k(process.env.GROQ_API_KEY),
  GEMINI:      _k(process.env.GEMINI_API_KEY),
  OPENROUTER:  _k(process.env.OPENROUTER_API_KEY),
});

// ── Provider abstraction ────────────────────────────────────────────────────

interface ChatMessage { role: string; content: string; }

async function callGroq(messages: ChatMessage[]): Promise<string> {
  const response = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 8000,
    messages: messages as Parameters<typeof client.chat.completions.create>[0]['messages'],
  });
  return response.choices[0]?.message?.content ?? '';
}

async function callGemini(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { const e = new Error('GEMINI_API_KEY not set'); (e as any).skip = true; throw e; }

  const systemMsg = messages.find(m => m.role === 'system');
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        ...(systemMsg && { systemInstruction: { parts: [{ text: systemMsg.content }] } }),
        generationConfig: { maxOutputTokens: 8192, temperature: 0.7 },
      }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const e = new Error(`Gemini ${res.status}: ${(err as any)?.error?.message ?? 'unknown'}`);
    (e as any).status = res.status;
    throw e;
  }
  const data = await res.json() as any;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!text) throw new Error('Gemini returned empty response');
  return text;
}

async function callOpenRouter(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) { const e = new Error('OPENROUTER_API_KEY not set'); (e as any).skip = true; throw e; }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://mobileforge.app',
      'X-Title': 'MobileForge',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.1-8b-instruct:free',
      messages,
      max_tokens: 8000,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const e = new Error(`OpenRouter ${res.status}: ${(err as any)?.error?.message ?? 'unknown'}`);
    (e as any).status = res.status;
    throw e;
  }
  const data = await res.json() as any;
  return data.choices?.[0]?.message?.content ?? '';
}

/**
 * Try Groq first (with 1 retry on rate-limit), then Gemini, then OpenRouter.
 * Throws only when ALL configured providers have failed.
 *
 * Bug fix: previously only fell back on 429 rate-limit. Now falls back on
 * ANY Groq failure (auth error, server error, network error, etc.) so that
 * a bad/missing Groq key still lets Gemini/OpenRouter serve the request.
 */
async function callWithFallback(messages: ChatMessage[]): Promise<string> {
  // Demo mode: skip network calls entirely if all API keys are placeholders
  const allPlaceholder = [process.env.GROQ_API_KEY, process.env.GEMINI_API_KEY, process.env.OPENROUTER_API_KEY]
    .every(k => !k || k.startsWith('__') || k.startsWith('placeholder'));
  if (allPlaceholder) {
    console.log('[AI/web] \u{1F3AD} Demo mode — all API keys are placeholders');
    const userMsg = messages.find(m => m.role === 'user');
    return getDemoResponse(userMsg?.content ?? '');
  }

  let groqLastError: unknown;

  // 1. Groq — up to 2 attempts, but only retry on 429 rate-limit
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      console.log(`[AI/web] Groq attempt ${attempt + 1}/2…`);
      const result = await callGroq(messages);
      console.log('[AI/web] ✓ Groq succeeded');
      return result;
    } catch (err) {
      groqLastError = err;
      const status = (err as any)?.status ?? (err as any)?.error?.status;
      const msg    = (err as Error).message ?? String(err);
      console.warn(`[AI/web] Groq attempt ${attempt + 1} failed — status=${status ?? 'n/a'} — ${msg}`);
      if (status !== 429) break;   // not rate-limited: don't retry, go to fallback
      if (attempt === 0) {
        console.warn('[AI/web] Groq rate-limited — retrying in 2 s…');
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }

  console.warn('[AI/web] Groq failed — trying fallback providers…');

  // 2. Gemini
  try {
    console.log('[AI/web] → Gemini');
    const result = await callGemini(messages);
    console.log('[AI/web] ✓ Gemini succeeded');
    return result;
  } catch (err) {
    if ((err as any).skip) console.log('[AI/web]   Gemini skipped (no key)');
    else console.error('[AI/web]   Gemini failed:', (err as Error).message);
  }

  // 3. OpenRouter
  try {
    console.log('[AI/web] → OpenRouter');
    const result = await callOpenRouter(messages);
    console.log('[AI/web] ✓ OpenRouter succeeded');
    return result;
  } catch (err) {
    if ((err as any).skip) console.log('[AI/web]   OpenRouter skipped (no key)');
    else console.error('[AI/web]   OpenRouter failed:', (err as Error).message);
  }

  // All providers failed — surface the original Groq error for clarity
  const rootMsg = groqLastError instanceof Error ? groqLastError.message : String(groqLastError);
  throw new Error(`All AI providers unavailable. Original Groq error: ${rootMsg}`);
}

const WEB_SYSTEM_PROMPT = `
You are WebForge AI — an expert React developer.
Your job: receive a description and return a COMPLETE React web app.

━━━ CODE RULES ━━━
- Write ONLY the App function (helper components defined BEFORE App)
- NO import statements — React is globally available
- First line inside App: const { useState, useEffect, useRef, useCallback, useMemo } = React;
- Plain JavaScript — NO TypeScript annotations
- Multiple screens: useState for currentTab / currentScreen

━━━ DESIGN SYSTEM — MANDATORY ━━━
A professional CSS design system is already injected into every page.
DO NOT invent custom styling. YOU MUST use these classes:

SHELL (every app uses these):
  app-shell        root container (max-w 420px, flex-col, bg var(--c-bg))
  app-header       sticky top bar (white bg, border-bottom, flex items-center)
  app-content      scrollable body (flex-col gap-14px, pb-90)
  app-nav          fixed bottom nav bar
  nav-tab          tab button — add class "active" for selected tab
  header-gradient  full-width gradient header (alternative to white app-header)

COMPONENTS:
  card             white card, layered shadow, radius 20px, padding 18px
  card-sm          smaller card, radius 16px
  btn-primary      full-width gradient CTA button (52px tall, bold)
  btn-secondary    tinted secondary button
  btn-icon         circular icon button 40×40px
  gradient-banner  hero banner with gradient background, radius 24px
  icon-circle      52×52px rounded square icon container
  list-item        horizontal row: icon + text + action, white bg + shadow
  badge            small pill tag (tinted bg)
  input-field      text input with focus ring
  avatar           circular gradient avatar
  divider          thin horizontal rule

TYPOGRAPHY (use for ALL text — do not use Tailwind font/color classes):
  title            26px 800-weight heading
  subtitle         16px 700-weight subheading
  body             14px body text (muted color)
  caption          12px helper text (light muted)
  section-title    11px ALL-CAPS section label

LAYOUT with Tailwind (flex/grid ONLY — no color, no shadow, no font classes):
  flex, grid, gap-X, items-center, justify-between, overflow-y-auto,
  relative, absolute, sticky, inset-0, w-full, h-full, z-10, grid-cols-X

COLOR PALETTE — set via <style> at top of App JSX (REQUIRED):
  <style>{\`
    :root {
      --c-from: #HEX;                        /* gradient start */
      --c-to: #HEX;                          /* gradient end   */
      --c-primary: #HEX;                     /* brand color    */
      --c-primary-light: rgba(r,g,b,0.12);   /* tinted bg      */
      --c-bg: #HEX;                          /* page bg        */
    }
  \`}</style>
  Choose palette for the domain: meditation→purple, food→orange, finance→emerald,
  fitness→red, travel→teal, music→pink. Background: very light tint of the primary.

FONTS — for Hebrew apps use Heebo, Assistant, or Rubik (all pre-loaded):
  <style>{\`:root { --c-font: 'Heebo', system-ui, sans-serif; }\`}</style>
  For English apps keep the default Inter font.

EMPTY STATES — use for every list that can be empty:
  <div className="empty-state">
    <div className="empty-state-icon">🛒</div>
    <p className="empty-state-title">הרשימה ריקה</p>
    <p className="empty-state-body">לחץ + כדי להוסיף את הפריט הראשון</p>
    <button className="btn-primary" style={{width:'auto',padding:'12px 24px'}} onClick={...}>הוסף</button>
  </div>

RESPONSIVE GRIDS — use to make app look good on iPad too:
  Phone (default):  <div className="grid-2">  — 2 columns
  Tablet (768px+):  <div className="grid-tablet-3"> or <div className="grid-tablet-4">

━━━ UX/UI PRINCIPLES — MANDATORY ━━━
HIERARCHY & LAYOUT:
- Less is more: one clear primary action per screen, no overloaded UI.
- Visual hierarchy: use size, weight, color to guide the eye naturally.
- Primary CTA (btn-primary) must be prominent and visible without scrolling.
- Consistent spacing using var(--sp-3) through var(--sp-6).

NAVIGATION:
- Use bottom tab nav (app-nav + nav-tab) with max 5 tabs.
- Active tab must be visually distinct (class "active").
- Navigation must be predictable across all screens.

TOUCH & ACCESSIBILITY:
- Every interactive element minimum 44×44 px (enforced by design system).
- Font sizes: body text minimum 14px (caption 12px is ok for labels only).
- High contrast: text on backgrounds must be readable.

VISUAL POLISH:
- Empty states: when a list is empty show an .empty-state div with icon, title, body text and a CTA button — never a blank screen.
- Loading: use .skeleton / .skeleton-text / .skeleton-card classes for perceived performance.
- Micro-interactions: buttons scale on :active — already in design system.
- First screen must look professional and inviting (gradient-banner or rich header).

RESPONSIVE:
- Every app must look great on PHONE (420px) AND TABLET (768px+).
- Use grid-2, grid-3 for phone; grid-tablet-3, grid-tablet-4 for tablet.
- app-shell expands to full width on tablet automatically.

━━━ CONTENT RULES ━━━
- Hebrew if user writes Hebrew; add dir="rtl" to app-shell div
- 3-5 realistic sample data items with real content (not lorem ipsum)
- All navigation works (useState)
- Emoji as icons, no libraries
- Empty state for every list (use .empty-state)

━━━ INTERACTIVITY — MANDATORY ━━━
Every button MUST have a working onClick handler.
Every nav tab MUST switch screens via state.
The app must be FULLY INTERACTIVE — no dead buttons, no static mockups.

REQUIRED PATTERNS:
1. SCREEN NAVIGATION — use a renderContent() function with if/switch on tab state:
   const [tab, setTab] = useState('home');
   const renderContent = () => {
     if (tab === 'home') return <HomeScreen />;
     if (tab === 'search') return <SearchScreen />;
     if (tab === 'profile') return <ProfileScreen />;
   };
   // Each tab MUST show DIFFERENT content

2. LIST STATE — items that add/remove/toggle:
   const [items, setItems] = useState([...]);
   const addItem = () => setItems(prev => [...prev, newItem]);
   const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id));
   const toggleItem = (id) => setItems(prev => prev.map(i => i.id===id ? {...i,done:!i.done} : i));

3. COUNTERS & VALUES — numbers that change:
   const [count, setCount] = useState(0);
   <button onClick={() => setCount(c => c + 1)}>+</button>

4. FORMS & INPUT — text inputs with state:
   const [text, setText] = useState('');
   <input className="input-field" value={text} onChange={e => setText(e.target.value)} />

5. MODALS & PANELS — show/hide via boolean state:
   const [showModal, setShowModal] = useState(false);
   <button onClick={() => setShowModal(true)}>פתח</button>
   {showModal && <div className="card">...</div>}

FORBIDDEN: Any button or nav tab without an onClick that changes state.

━━━ REFERENCE EXAMPLE — Food Delivery (FULLY INTERACTIVE — copy this pattern) ━━━
function App() {
  const { useState } = React;
  const [tab, setTab] = useState('home');
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const allItems = [
    {id:1,name:'פיצה מרגריטה',price:59,emoji:'🍕',rating:'4.8',time:'25 דק'},
    {id:2,name:'בורגר קלאסי',price:49,emoji:'🍔',rating:'4.6',time:'20 דק'},
    {id:3,name:'רול טונה',price:65,emoji:'🍣',rating:'4.9',time:'30 דק'},
  ];
  const addToCart = (item) => setCart(prev => [...prev, {...item, cartId: Date.now()}]);
  const removeFromCart = (cartId) => setCart(prev => prev.filter(i => i.cartId !== cartId));
  const total = cart.reduce((s, i) => s + i.price, 0);

  const HomeScreen = () => (
    <>
      <div className="gradient-banner">
        <p className="caption" style={{color:'rgba(255,255,255,0.8)'}}>מבצע מיוחד 🔥</p>
        <h2 className="title" style={{color:'white',margin:'6px 0 4px'}}>20% הנחה</h2>
        <p className="body" style={{color:'rgba(255,255,255,0.85)'}}>על הזמנה ראשונה</p>
        <button className="btn-secondary" style={{width:'auto',marginTop:14,padding:'9px 20px'}} onClick={()=>setTab('search')}>הזמן עכשיו</button>
      </div>
      <p className="section-title">פופולרי 🔥</p>
      {allItems.map(item=>(
        <div key={item.id} className="list-item">
          <div className="icon-circle" style={{fontSize:28}}>{item.emoji}</div>
          <div style={{flex:1}}>
            <p className="subtitle" style={{fontSize:14}}>{item.name}</p>
            <p className="caption" style={{marginTop:2}}>⭐ {item.rating} · ⏱ {item.time}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="subtitle" style={{color:'var(--c-primary)'}}>₪{item.price}</span>
            <button className="btn-icon" style={{width:30,height:30,fontSize:20,fontWeight:900}} onClick={()=>addToCart(item)}>+</button>
          </div>
        </div>
      ))}
    </>
  );

  const SearchScreen = () => {
    const filtered = allItems.filter(i => i.name.includes(search));
    return (
      <>
        <input className="input-field" placeholder="חפש מנה..." value={search} onChange={e=>setSearch(e.target.value)} />
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <p className="empty-state-title">אין תוצאות</p>
            <p className="empty-state-body">נסה מילת חיפוש אחרת</p>
          </div>
        ) : (
          <>
            <p className="section-title">{filtered.length} תוצאות</p>
            {filtered.map(item=>(
              <div key={item.id} className="list-item">
                <div className="icon-circle">{item.emoji}</div>
                <div style={{flex:1}}><p className="subtitle" style={{fontSize:14}}>{item.name}</p></div>
                <button className="btn-icon" onClick={()=>addToCart(item)}>+</button>
              </div>
            ))}
          </>
        )}
      </>
    );
  };

  const CartScreen = () => (
    <>
      <p className="section-title">הסל שלך ({cart.length} פריטים)</p>
      {cart.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🛒</div>
          <p className="empty-state-title">הסל ריק</p>
          <p className="empty-state-body">הוסף מנות מהתפריט</p>
          <button className="btn-primary" style={{width:'auto',padding:'12px 24px',marginTop:4}} onClick={()=>setTab('search')}>הזמן עכשיו</button>
        </div>
      )}
      {cart.map(item=>(
        <div key={item.cartId} className="list-item">
          <div className="icon-circle">{item.emoji}</div>
          <div style={{flex:1}}><p className="subtitle" style={{fontSize:14}}>{item.name}</p></div>
          <div className="flex items-center gap-2">
            <span className="subtitle" style={{color:'var(--c-primary)'}}>₪{item.price}</span>
            <button className="btn-icon" style={{width:28,height:28,fontSize:16}} onClick={()=>removeFromCart(item.cartId)}>✕</button>
          </div>
        </div>
      ))}
      {cart.length > 0 && (
        <div className="card">
          <div className="flex justify-between items-center" style={{marginBottom:14}}>
            <span className="subtitle">סה"כ</span>
            <span className="title" style={{color:'var(--c-primary)'}}>₪{total}</span>
          </div>
          <button className="btn-primary" onClick={()=>{setCart([]);alert('ההזמנה נשלחה! 🎉');}}>שלח הזמנה</button>
        </div>
      )}
    </>
  );

  const ProfileScreen = () => (
    <div className="card">
      <div className="flex items-center gap-3" style={{marginBottom:16}}>
        <div className="avatar" style={{width:52,height:52,fontSize:22}}>י</div>
        <div><p className="subtitle">ישראל ישראלי</p><p className="caption">israel@email.com</p></div>
      </div>
      <button className="btn-primary" onClick={()=>alert('פרופיל נשמר!')}>שמור שינויים</button>
    </div>
  );

  const renderContent = () => {
    if (tab === 'home')    return <HomeScreen />;
    if (tab === 'search')  return <SearchScreen />;
    if (tab === 'cart')    return <CartScreen />;
    if (tab === 'profile') return <ProfileScreen />;
  };

  return (
    <>
      <style>{\`
        :root {
          --c-from:#f97316; --c-to:#ef4444;
          --c-primary:#f97316; --c-primary-light:rgba(249,115,22,0.12);
          --c-bg:#fff7ed;
        }
      \`}</style>
      <div className="app-shell" dir="rtl">
        <div className="app-header">
          <div>
            <p className="caption">שלום 👋</p>
            <h1 className="subtitle">ישראל ישראלי</h1>
          </div>
          <div className="flex gap-2 items-center">
            <button className="btn-icon" onClick={()=>setTab('cart')}>🛒{cart.length>0&&<span className="badge" style={{position:'absolute',top:-4,right:-4,minWidth:18,height:18,fontSize:10}}>{cart.length}</span>}</button>
            <div className="avatar">י</div>
          </div>
        </div>
        <div className="app-content">
          {renderContent()}
        </div>
        <div className="app-nav">
          {[{id:'home',icon:'🏠',label:'בית'},{id:'search',icon:'🔍',label:'חיפוש'},{id:'cart',icon:'🛒',label:'סל'+(cart.length>0?' ('+cart.length+')':'')},{id:'profile',icon:'👤',label:'פרופיל'}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} className={'nav-tab'+(tab===t.id?' active':'')}>
              <span style={{fontSize:20}}>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT — CRITICAL — FOLLOW EXACTLY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return EXACTLY TWO blocks:

BLOCK 1 — JSON metadata (one line, no code):
{"appName":"App name","description":"One sentence","colorScheme":{"primary":"#hex","background":"#hex","text":"#hex","accent":"#hex"},"features":["feature1","feature2","feature3"],"hebrewSummary":"תיאור בעברית"}

BLOCK 2 — App code:
===CODE===
function App() {
  const { useState } = React;
  // complete component
}
===END===

RULES:
1. BLOCK 1: valid JSON, NO code inside it
2. BLOCK 2: raw JSX — write freely, no JSON escaping
3. Hebrew text directly in code (שלום not \\u05E9...)
4. Nothing before BLOCK 1 or after ===END===
5. No markdown fences
6. ===CODE=== and ===END=== on their own lines
`;

// ── Edit mode system prompt ─────────────────────────────────────────────────

const OUTPUT_FORMAT_RULES = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT — CRITICAL — FOLLOW EXACTLY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return EXACTLY TWO blocks:

BLOCK 1 — JSON metadata (one line, no code):
{"appName":"App name","description":"what changed","colorScheme":{"primary":"#hex","background":"#hex","text":"#hex","accent":"#hex"},"features":["f1","f2"],"hebrewSummary":"תיאור השינוי בעברית"}

BLOCK 2 — Full updated App code:
===CODE===
function App() {
  // complete updated component
}
===END===

RULES:
1. BLOCK 1: valid JSON, NO code inside it
2. BLOCK 2: raw JSX — write freely, no JSON escaping
3. Hebrew text directly in code (שלום not \\u05E9...)
4. Nothing before BLOCK 1 or after ===END===
5. No markdown fences
6. ===CODE=== and ===END=== on their own lines
`;

export function buildEditSystemPrompt(existingCode: string): string {
  return `You are WebForge AI — you are EDITING an existing React app.

EXISTING CODE (modify this, do NOT rewrite from scratch):
===CURRENT_CODE===
${existingCode}
===END_CURRENT_CODE===

EDITING RULES — CRITICAL:
1. Apply ONLY the specific change the user requests
2. Preserve ALL existing state, onClick handlers, screens, and navigation
3. Preserve ALL existing design system classes (card, btn-primary, app-shell, nav-tab, etc.)
4. Return the COMPLETE updated function App(){...} — not partial code
5. Color change → update ONLY the <style>{\`:root{...}\`}</style> CSS variables
6. Text change → update ONLY that text; keep all logic and structure identical
7. New screen → add it using the existing renderContent() pattern
8. Language change → translate ALL visible text (preserve logic/classes)
9. Dark mode → update --c-bg, --c-surface, --c-text variables to dark values
${OUTPUT_FORMAT_RULES}`;
}

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface GenerateOptions {
  editMode?: boolean;
  existingCode?: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GeneratedWebApp {
  appName: string;
  description: string;
  files: Record<string, string>;
  colorScheme: {
    primary: string;
    background: string;
    text: string;
    accent?: string;
  };
  features: string[];
  hebrewSummary: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function fixUnescapedNewlines(json: string): string {
  let result = '';
  let inString = false;
  let i = 0;
  while (i < json.length) {
    const ch = json[i];
    if (ch === '\\' && inString) { result += ch + (json[i + 1] ?? ''); i += 2; continue; }
    if (ch === '"') { inString = !inString; result += ch; i++; continue; }
    if (inString) {
      if (ch === '\n') result += '\\n';
      else if (ch === '\r') result += '\\r';
      else if (ch === '\t') result += '\\t';
      else result += ch;
    } else {
      result += ch;
    }
    i++;
  }
  return result;
}

function decodeEscapedUnicode(str: string): string {
  return str.replace(/\\u([0-9A-Fa-f]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

/**
 * Parse a Groq response that uses the new delimiter format:
 *   {metadata JSON}
 *   ===CODE===
 *   function App() { ... }
 *   ===END===
 *
 * Falls back to the old JSON-embedded format if markers are not found.
 */
export function parseGroqResponse(raw: string): GeneratedWebApp {
  // ── Strategy 1: delimiter format (===CODE=== … ===END===) ──────────────
  const codeStart = raw.indexOf('===CODE===');
  const codeEnd   = raw.indexOf('===END===');
  if (codeStart !== -1 && codeEnd > codeStart) {
    const code     = raw.slice(codeStart + 10, codeEnd).trim();
    const metaPart = raw.slice(0, codeStart).trim();
    const js = metaPart.indexOf('{');
    const je = metaPart.lastIndexOf('}');

    let meta: Partial<GeneratedWebApp> = {};
    if (js !== -1 && je > js) {
      try {
        meta = JSON.parse(fixUnescapedNewlines(metaPart.slice(js, je + 1)));
      } catch (e) {
        console.warn('[AI/web] Delimiter: metadata JSON parse failed:', (e as Error).message);
        console.warn('[AI/web] Metadata part:', metaPart.slice(0, 200));
      }
    }

    console.log('[AI/web] Parsed via delimiter format — appName:', meta.appName, '| code length:', code.length);
    return {
      appName:      decodeEscapedUnicode(meta.appName      ?? 'Generated App'),
      description:  decodeEscapedUnicode(meta.description  ?? ''),
      hebrewSummary:decodeEscapedUnicode(meta.hebrewSummary ?? 'האפליקציה נוצרה'),
      colorScheme:  meta.colorScheme ?? { primary: '#6C3AE8', background: '#F8F9FA', text: '#1A1A2E' },
      features:     (meta.features ?? []).map(decodeEscapedUnicode),
      files: { 'App.jsx': code },
    };
  }

  // ── Strategy 2: old embedded-JSON format (fallback) ────────────────────
  let cleaned = raw
    .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  const s = cleaned.indexOf('{');
  const e = cleaned.lastIndexOf('}');
  if (s !== -1 && e > s) cleaned = cleaned.slice(s, e + 1);
  cleaned = fixUnescapedNewlines(cleaned);

  const parsed = JSON.parse(cleaned) as GeneratedWebApp;
  console.log('[AI/web] Parsed via JSON format — appName:', parsed.appName);
  return {
    ...parsed,
    appName:       decodeEscapedUnicode(parsed.appName       ?? ''),
    description:   decodeEscapedUnicode(parsed.description   ?? ''),
    hebrewSummary: decodeEscapedUnicode(parsed.hebrewSummary ?? ''),
    features:      (parsed.features ?? []).map(decodeEscapedUnicode),
  };
}

const FALLBACK_APP = (reason: string) =>
  `function App() {
  return (
    <div style={{padding:24,fontFamily:'sans-serif',maxWidth:420,margin:'0 auto',minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12}}>
      <div style={{fontSize:40}}>⚠️</div>
      <h2 style={{margin:0,color:'#dc2626',fontSize:18}}>שגיאה בייצור הקוד</h2>
      <p style={{margin:0,color:'#6b7280',fontSize:14,textAlign:'center'}}>${reason}</p>
      <p style={{margin:0,color:'#9ca3af',fontSize:12}}>נסה שוב</p>
    </div>
  );
}`;

// ── Public API ─────────────────────────────────────────────────────────────

export async function generateWebApp(
  userPrompt: string,
  conversationHistory: ConversationMessage[],
  options?: GenerateOptions
): Promise<GeneratedWebApp> {
  const systemPrompt = options?.editMode && options.existingCode
    ? buildEditSystemPrompt(options.existingCode)
    : WEB_SYSTEM_PROMPT;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userPrompt },
  ];

  console.log('[AI/web] Mode:', options?.editMode ? 'EDIT' : 'GENERATE', '| prompt:', userPrompt.slice(0, 80));

  // In demo mode + edit mode, return existing code as-is (can't modify without LLM)
  const allPlaceholder = [process.env.GROQ_API_KEY, process.env.GEMINI_API_KEY, process.env.OPENROUTER_API_KEY]
    .every(k => !k || k.startsWith('__') || k.startsWith('placeholder'));
  if (allPlaceholder && options?.editMode && options.existingCode) {
    console.log('[AI/web] \u{1F3AD} Demo mode — edit request, returning existing code');
    const raw = getDemoEditResponse(options.existingCode);
    return parseGroqResponse(raw);
  }

  const raw = await callWithFallback(messages);
  console.log('[AI/web] Raw response length:', raw.length);
  console.log('[AI/web] Raw (first 500):\n', raw.slice(0, 500));

  try {
    return parseGroqResponse(raw);
  } catch (parseErr) {
    const msg = (parseErr as Error).message;
    console.error('[AI/web] ALL parse strategies failed:', msg);
    console.error('[AI/web] Full raw response:\n', raw);
    return {
      appName: 'Generated App',
      description: '',
      files: { 'App.jsx': FALLBACK_APP(`Parse error: ${msg.slice(0, 60)}`) },
      colorScheme: { primary: '#6C3AE8', background: '#F8F9FA', text: '#1A1A2E' },
      features: [],
      hebrewSummary: `שגיאת parse: ${msg.slice(0, 80)}`,
    };
  }
}

export async function* streamGenerateWebApp(
  userPrompt: string,
  conversationHistory: ConversationMessage[],
  options?: GenerateOptions
): AsyncGenerator<string> {
  const systemPrompt = options?.editMode && options.existingCode
    ? buildEditSystemPrompt(options.existingCode)
    : WEB_SYSTEM_PROMPT;

  const msgs = [
    { role: 'system' as const, content: systemPrompt },
    ...conversationHistory,
    { role: 'user' as const, content: userPrompt },
  ];

  // Try Groq streaming first
  try {
  const stream = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 8000,
    stream: true,
    messages: msgs,
  });
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? '';
      if (text) yield text;
    }
    return;
  } catch (err) {
    if ((err as any)?.status !== 429) throw err;
    console.warn('[AI/web] Groq stream rate-limited — falling back to non-streaming…');
  }

  // Fallback: non-streaming, emit entire response as one chunk
  const raw = await callWithFallback(msgs);
  yield raw;
}
