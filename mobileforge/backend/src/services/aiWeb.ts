import Groq from 'groq-sdk';

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.3-70b-versatile';

const WEB_SYSTEM_PROMPT = `
You are WebForge AI — an expert React web developer.
Your job: receive a description and return a COMPLETE, BEAUTIFUL React web app.

COMPONENT RULES — CRITICAL:
- Write ONLY the App function (and any helper components defined BEFORE App)
- NO import statements — React is globally available via CDN
- First line inside App: const { useState, useEffect, useRef, useCallback, useMemo } = React;
- Use JSX syntax freely — Babel processes it automatically
- Multiple screens/views: use useState to track currentScreen/currentView
- Plain JavaScript only — NO TypeScript, no type annotations (: string, <T>, etc.)

MOBILE APP LAYOUT — MANDATORY:
Design every app as a NATIVE MOBILE APP, not a wide website:
- Root container: className="max-w-[420px] mx-auto min-h-screen bg-gray-50 relative overflow-hidden"
  (centers the app in a phone-width column — never let content span the full browser width)
- Top header bar: sticky/fixed, 60-70px tall, gradient background, white title
  className="sticky top-0 z-10 bg-gradient-to-r from-X-600 to-Y-700 text-white px-4 py-4 shadow-md"
- Scrollable content area: flex-1, pb-20 when bottom nav exists (room for nav bar)
  className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-20"
- Bottom navigation bar (when app has 3+ screens): fixed at the bottom, tab icons + labels
  className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] bg-white border-t border-gray-100 flex z-10"
  Each tab: className="flex-1 flex flex-col items-center py-2 text-xs gap-0.5"
  Active tab: text-blue-600, inactive: text-gray-400
- Buttons: full-width (w-full) or large (px-6 py-4), rounded-2xl, min 52px height
- Touch-friendly list items: min h-16, px-4 py-3, rounded-xl, good spacing
- NO wide side-by-side layouts that need a large screen

STYLING — TAILWIND CSS ONLY:
- Use Tailwind CSS classes exclusively — NEVER use inline style={{}} objects
- Rich visual design:
  • Cards: className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100"
  • Primary button: className="w-full bg-blue-600 text-white rounded-2xl py-4 font-semibold text-base active:scale-95 transition-transform"
  • Input: className="w-full bg-gray-100 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
  • Avatar/icon circle: className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-xl"
  • Section header: className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2"

CONTENT RULES:
- Hebrew if user writes in Hebrew; add dir="rtl" to root <div> for RTL
- Include 3-5 realistic sample data items
- All buttons and navigation must work (useState-driven)
- Use emoji as icons — no external icon libraries

REFERENCE EXAMPLE — Food Delivery App (follow this shell structure for EVERY app):
function App() {
  const { useState } = React;
  const [tab, setTab] = useState('home');
  const categories = [
    {id:'pizza',icon:'🍕',label:'פיצה',bg:'bg-orange-100'},
    {id:'burger',icon:'🍔',label:'בורגר',bg:'bg-yellow-100'},
    {id:'sushi',icon:'🍣',label:'סושי',bg:'bg-blue-100'},
    {id:'salad',icon:'🥗',label:'סלט',bg:'bg-green-100'},
  ];
  const items = [
    {id:1,name:'פיצה מרגריטה',price:59,emoji:'🍕',rating:'4.8',time:'25 דק'},
    {id:2,name:'בורגר קלאסי',price:49,emoji:'🍔',rating:'4.6',time:'20 דק'},
    {id:3,name:'רול טונה',price:65,emoji:'🍣',rating:'4.9',time:'30 דק'},
  ];
  return (
    <div className="max-w-[420px] mx-auto min-h-screen bg-gray-50 flex flex-col" dir="rtl">
      <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-100 shadow-sm">
        <div>
          <p className="text-gray-400 text-xs">שלום 👋</p>
          <h1 className="text-lg font-bold text-gray-900">ישראל ישראלי</h1>
        </div>
        <div className="flex gap-2 items-center">
          <button className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center"><span>🔔</span></button>
          <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm">י</div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pb-20 space-y-4">
        <div className="mx-4 mt-4 bg-gradient-to-l from-orange-500 to-red-500 rounded-3xl p-5 text-white">
          <p className="text-orange-100 text-xs font-medium">מבצע מיוחד 🔥</p>
          <h2 className="text-2xl font-bold mt-1">20% הנחה</h2>
          <p className="text-orange-100 text-xs mt-0.5">על הזמנה ראשונה</p>
          <button className="mt-3 bg-white text-orange-600 rounded-xl px-4 py-1.5 text-sm font-bold">הזמן עכשיו</button>
        </div>
        <div className="px-4">
          <h3 className="text-sm font-bold text-gray-700 mb-3">קטגוריות</h3>
          <div className="grid grid-cols-4 gap-2">
            {categories.map(c=>(
              <button key={c.id} className="flex flex-col items-center gap-1">
                <div className={c.bg + " w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"}>{c.icon}</div>
                <span className="text-xs text-gray-600">{c.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="px-4">
          <h3 className="text-sm font-bold text-gray-700 mb-3">פופולרי 🔥</h3>
          <div className="space-y-3">
            {items.map(item=>(
              <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 flex overflow-hidden">
                <div className="w-20 h-20 bg-orange-50 flex items-center justify-center text-4xl flex-shrink-0">{item.emoji}</div>
                <div className="p-3 flex-1">
                  <h4 className="font-semibold text-sm text-gray-900">{item.name}</h4>
                  <p className="text-xs text-gray-400 mt-0.5">⭐ {item.rating} · ⏱ {item.time}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-orange-500">₪{item.price}</span>
                    <button className="w-7 h-7 bg-orange-500 rounded-full text-white font-bold flex items-center justify-center text-lg leading-none">+</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] bg-white border-t border-gray-100 flex z-10">
        {[{id:'home',icon:'🏠',label:'בית'},{id:'search',icon:'🔍',label:'חיפוש'},{id:'fav',icon:'❤️',label:'מועדפים'},{id:'profile',icon:'👤',label:'פרופיל'}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} className={"flex-1 flex flex-col items-center py-2 text-xs gap-0.5 " + (tab===t.id ? 'text-orange-500 font-semibold' : 'text-gray-400')}>
            <span className="text-xl">{t.icon}</span>{t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

EVERY app you generate MUST follow this exact shell structure and visual quality.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT — CRITICAL — FOLLOW EXACTLY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return EXACTLY TWO blocks:

BLOCK 1 — JSON metadata on one line (no code inside the JSON):
{"appName":"App name","description":"One sentence","colorScheme":{"primary":"#hex","background":"#hex","text":"#hex","accent":"#hex"},"features":["feature1","feature2","feature3"],"hebrewSummary":"תיאור בעברית"}

BLOCK 2 — App code between markers:
===CODE===
function App() {
  const { useState } = React;
  // ... complete component code
}
===END===

CRITICAL RULES:
1. BLOCK 1 must be valid JSON — keep it short and simple, NO code inside it
2. BLOCK 2 is raw JavaScript/JSX — write it freely, NO JSON escaping needed
3. Hebrew text goes directly in BLOCK 2 (write שלום NOT \\u05E9...)
4. Nothing before BLOCK 1 or after ===END===
5. No markdown code fences (no backtick blocks)
6. The ===CODE=== and ===END=== markers must appear on their own lines
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
