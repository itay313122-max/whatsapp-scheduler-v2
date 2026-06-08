import Groq from 'groq-sdk';

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.3-70b-versatile';

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

━━━ CONTENT RULES ━━━
- Hebrew if user writes Hebrew; add dir="rtl" to app-shell div
- 3-5 realistic sample data items
- All navigation works (useState)
- Emoji as icons, no libraries

━━━ REFERENCE EXAMPLE — Food Delivery (use this pattern for EVERY app) ━━━
function App() {
  const { useState } = React;
  const [tab, setTab] = useState('home');
  const categories = [
    {id:'pizza',icon:'🍕',label:'פיצה'},{id:'burger',icon:'🍔',label:'בורגר'},
    {id:'sushi',icon:'🍣',label:'סושי'},{id:'salad',icon:'🥗',label:'סלט'},
  ];
  const items = [
    {id:1,name:'פיצה מרגריטה',price:59,emoji:'🍕',rating:'4.8',time:'25 דק'},
    {id:2,name:'בורגר קלאסי',price:49,emoji:'🍔',rating:'4.6',time:'20 דק'},
    {id:3,name:'רול טונה',price:65,emoji:'🍣',rating:'4.9',time:'30 דק'},
  ];
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
            <button className="btn-icon">🔔</button>
            <div className="avatar">י</div>
          </div>
        </div>
        <div className="app-content">
          <div className="gradient-banner">
            <p className="caption" style={{color:'rgba(255,255,255,0.8)'}}>מבצע מיוחד 🔥</p>
            <h2 className="title" style={{color:'white',margin:'6px 0 4px'}}>20% הנחה</h2>
            <p className="body" style={{color:'rgba(255,255,255,0.85)'}}>על הזמנה ראשונה</p>
            <button className="btn-secondary" style={{width:'auto',marginTop:14,padding:'9px 20px'}}>הזמן עכשיו</button>
          </div>
          <p className="section-title">קטגוריות</p>
          <div className="grid grid-cols-4 gap-3">
            {categories.map(c=>(
              <button key={c.id} className="flex flex-col items-center gap-2" style={{background:'none',border:'none',cursor:'pointer'}}>
                <div className="icon-circle">{c.icon}</div>
                <span className="caption">{c.label}</span>
              </button>
            ))}
          </div>
          <p className="section-title">פופולרי 🔥</p>
          {items.map(item=>(
            <div key={item.id} className="list-item">
              <div className="icon-circle" style={{fontSize:28}}>{item.emoji}</div>
              <div style={{flex:1}}>
                <p className="subtitle" style={{fontSize:14}}>{item.name}</p>
                <p className="caption" style={{marginTop:2}}>⭐ {item.rating} · ⏱ {item.time}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="subtitle" style={{color:'var(--c-primary)'}}>₪{item.price}</span>
                <button className="btn-icon" style={{width:30,height:30,fontSize:20,fontWeight:900}}>+</button>
              </div>
            </div>
          ))}
        </div>
        <div className="app-nav">
          {[{id:'home',icon:'🏠',label:'בית'},{id:'search',icon:'🔍',label:'חיפוש'},{id:'fav',icon:'❤️',label:'מועדפים'},{id:'profile',icon:'👤',label:'פרופיל'}].map(t=>(
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
  conversationHistory: ConversationMessage[]
): Promise<GeneratedWebApp> {
  const response = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 8000,
    messages: [
      { role: 'system', content: WEB_SYSTEM_PROMPT },
      ...conversationHistory,
      { role: 'user', content: userPrompt },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? '';
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
  conversationHistory: ConversationMessage[]
): AsyncGenerator<string> {
  const stream = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 8000,
    stream: true,
    messages: [
      { role: 'system', content: WEB_SYSTEM_PROMPT },
      ...conversationHistory,
      { role: 'user', content: userPrompt },
    ],
  });
  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content ?? '';
    if (text) yield text;
  }
}
