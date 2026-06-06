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

STYLING — TAILWIND CSS ONLY:
- Use Tailwind CSS classes exclusively — NEVER use inline style={{}} objects
- ALWAYS produce a visually stunning, modern design:
  • Gradient header: className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-6 shadow-lg"
  • Cards: className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow"
  • Primary button: className="bg-blue-600 text-white rounded-xl px-6 py-3 font-semibold hover:bg-blue-700 active:scale-95 transition-all"
  • Page background: className="min-h-screen bg-gray-50"
  • Input: className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
  • Section spacing: className="space-y-4" or "gap-4" or "mb-6"
  • Badges/tags: className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"

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

EXAMPLE — Hebrew todo app:
function App() {
  const { useState } = React;
  const [items, setItems] = useState([{id:1,text:'קנה חלב',done:false},{id:2,text:'צלם לשיעור',done:true}]);
  const [input, setInput] = useState('');
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="bg-gradient-to-r from-violet-600 to-purple-700 text-white p-6 shadow-lg">
        <h1 className="text-3xl font-bold">✅ רשימת משימות</h1>
        <p className="text-purple-200 mt-1">{items.filter(i=>!i.done).length} משימות פתוחות</p>
      </div>
      ...
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
