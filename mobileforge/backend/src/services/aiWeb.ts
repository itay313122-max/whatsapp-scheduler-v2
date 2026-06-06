import Groq from 'groq-sdk';

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.3-70b-versatile';

const WEB_SYSTEM_PROMPT = `
You are WebForge AI — an expert React web developer.
Your job: receive a description and return a COMPLETE, BEAUTIFUL React web app.

COMPONENT RULES — CRITICAL:
- Write ONLY the App function (and any helper components defined below it)
- NO import statements — React is globally available via CDN
- Destructure hooks at the top: const { useState, useEffect, useRef, useCallback } = React;
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
- Include loading states, empty states, and interactive elements
- All buttons and navigation must actually work (useState-driven)

DESIGN MANDATE:
- Every app must look like a real, published, professional product
- Colorful gradient header at the top of every screen
- Card-based content area on a soft gray background
- Use emoji as icons: ✅ ❌ 🏠 📊 ⭐ 🎯 💡 🔥 etc.
- Bold title (text-3xl font-bold), medium labels (text-xl font-semibold), readable body (text-base text-gray-600)
- NEVER produce plain unstyled text on a plain white page
- The very first render must look impressive

EXAMPLE — Hebrew todo app (correct mobile structure):
function App() {
  const { useState } = React;
  const [tab, setTab] = useState('home');
  const [items, setItems] = useState([{id:1,text:'קנה חלב',done:false},{id:2,text:'צלם לשיעור',done:true}]);
  return (
    <div className="max-w-[420px] mx-auto min-h-screen bg-gray-50 flex flex-col" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-violet-600 to-purple-700 text-white px-4 py-4 shadow-md">
        <h1 className="text-2xl font-bold">✅ משימות</h1>
        <p className="text-purple-200 text-sm mt-0.5">{items.filter(i=>!i.done).length} פתוחות</p>
      </div>
      {/* Content */}
      <div className="flex-1 px-4 py-4 space-y-3 pb-20">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3 border border-gray-100">
            <span className="text-2xl">{item.done ? '✅' : '⬜'}</span>
            <span className={item.done ? 'line-through text-gray-400 flex-1' : 'flex-1 text-gray-800'}>{item.text}</span>
          </div>
        ))}
      </div>
      {/* Bottom nav */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] bg-white border-t border-gray-100 flex z-10">
        {[['🏠','בית','home'],['✅','משימות','tasks'],['⚙️','הגדרות','settings']].map(([icon,label,id]) => (
          <button key={id} onClick={() => setTab(id)} className={\`flex-1 flex flex-col items-center py-2 text-xs gap-0.5 \${tab===id?'text-violet-600':'text-gray-400'}\`}>
            <span className="text-xl">{icon}</span>{label}
          </button>
        ))}
      </div>
    </div>
  );
}

OUTPUT FORMAT — return ONLY this JSON object, nothing else:
{
  "appName": "App name in English",
  "description": "One sentence description in English",
  "files": {
    "App.jsx": "...complete App() function — no import statements..."
  },
  "colorScheme": {
    "primary": "#hexcolor",
    "background": "#hexcolor",
    "text": "#hexcolor",
    "accent": "#hexcolor"
  },
  "features": ["feature1", "feature2", "feature3"],
  "hebrewSummary": "תיאור קצר בעברית של מה שנבנה"
}

CRITICAL — JSON ENCODING RULES:
- Response starts with { and ends with } — nothing before or after
- Do NOT use markdown code fences (no \`\`\`)
- In the App.jsx string value: encode newlines as \\n and tabs as \\t
- Do NOT double-escape Unicode — write Hebrew directly (e.g. "שלום") NOT \\u05E9...
- The complete response must be parseable by JSON.parse()
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

function cleanJson(raw: string): string {
  let cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) cleaned = cleaned.slice(start, end + 1);
  return fixUnescapedNewlines(cleaned);
}

function decodeEscapedUnicode(str: string): string {
  return str.replace(/\\u([0-9A-Fa-f]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function fixParsedApp(app: GeneratedWebApp): GeneratedWebApp {
  return {
    ...app,
    appName: decodeEscapedUnicode(app.appName ?? ''),
    description: decodeEscapedUnicode(app.description ?? ''),
    hebrewSummary: decodeEscapedUnicode(app.hebrewSummary ?? ''),
    features: (app.features ?? []).map(decodeEscapedUnicode),
  };
}

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

  const raw = response.choices[0]?.message?.content || '';
  try {
    const parsed = JSON.parse(cleanJson(raw)) as GeneratedWebApp;
    const fixed = fixParsedApp(parsed);
    console.log('[AI/web] Parse OK — appName:', fixed.appName, '| hebrewSummary:', fixed.hebrewSummary.slice(0, 40));
    return fixed;
  } catch (parseErr) {
    console.error('[AI/web] JSON parse FAILED:', (parseErr as Error).message);
    console.error('[AI/web] Raw (first 300):', raw.slice(0, 300));
    return {
      appName: 'Generated App',
      description: 'Web app generated by WebForge',
      files: { 'App.jsx': `function App() { return <div style={{padding:24}}><h1>שגיאה בייצור הקוד</h1><p>נסה שוב</p></div>; }` },
      colorScheme: { primary: '#6C3AE8', background: '#F8F9FA', text: '#1A1A2E' },
      features: [],
      hebrewSummary: 'האפליקציה נוצרה',
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
    const text = chunk.choices[0]?.delta?.content || '';
    if (text) yield text;
  }
}
