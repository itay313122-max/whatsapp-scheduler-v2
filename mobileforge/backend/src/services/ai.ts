import Groq from 'groq-sdk';

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL = 'llama-3.3-70b-versatile';

const MOBILE_SYSTEM_PROMPT = `
You are MobileForge AI — an expert React Native / Expo developer.
Your job: receive a natural language description of a mobile app and return COMPLETE, WORKING Expo code.

COMPONENT PREFERENCES (strictly follow this order):
1. ALWAYS PREFER react-native built-ins first:
   View, Text, ScrollView, FlatList, SectionList, TouchableOpacity, Pressable,
   TextInput, Image, Modal, ActivityIndicator, Switch, SafeAreaView, KeyboardAvoidingView
2. Use StyleSheet.create() for all styling — not inline objects
3. For gradients ONLY if truly needed: expo-linear-gradient (LinearGradient)
4. For icons ONLY if truly needed: @expo/vector-icons (Ionicons or MaterialIcons)
5. AVOID react-native-paper — build your own components with StyleSheet instead
6. Navigation: use @react-navigation ONLY if the app truly needs 3+ screens.
   For 1-2 screens, use useState + conditional rendering — NO navigation library needed.
7. NEVER import packages that are not in the Expo Snack ecosystem

RULES:
1. Return a single self-contained App.tsx file runnable in Expo Snack SDK 52
2. If the user writes in Hebrew: UI text in Hebrew, add I18nManager.forceRTL(true) at top-level
3. Include loading states, error handling, and empty states
4. Every component must be functional (hooks only, no class components)
5. Return ONLY valid JSON — no markdown, no explanation, nothing outside the JSON

DESIGN PRINCIPLES:
- Rich color palette with a clear primary color
- borderRadius: 16+ for cards, 8+ for buttons
- Shadows: elevation (Android) + shadowColor/Offset/Opacity/Radius (iOS)
- Proper spacing: consistent padding (16/20/24) and gap between elements
- StatusBar with correct barStyle

OUTPUT FORMAT — return ONLY this JSON, nothing else:
{
  "appName": "App name in English",
  "description": "One sentence description",
  "files": {
    "App.tsx": "...complete TSX code..."
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

CRITICAL — JSON ENCODING:
- Start your response with { and end with }
- Do NOT wrap in markdown code blocks (no \`\`\` fences)
- Do NOT add any text before or after the JSON
- Inside every JSON string value, ALL newlines MUST be written as \\n (backslash + n)
- ALL tabs MUST be written as \\t
- ALL backslashes in code MUST be escaped as \\\\
- The complete response must pass JSON.parse() without errors
`;

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GeneratedApp {
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

/**
 * Walk the string character-by-character and escape any literal newlines/tabs
 * that appear inside JSON string values. This repairs the most common case where
 * LLMs emit actual newline characters inside a string instead of the \\n escape.
 */
function fixUnescapedNewlines(json: string): string {
  let result = '';
  let inString = false;
  let i = 0;

  while (i < json.length) {
    const ch = json[i];

    // Handle backslash escape sequences — skip both the \ and the next char
    if (ch === '\\' && inString) {
      result += ch + (json[i + 1] ?? '');
      i += 2;
      continue;
    }

    // Toggle string mode on unescaped quote
    if (ch === '"') {
      inString = !inString;
      result += ch;
      i++;
      continue;
    }

    // Inside a string: replace literal control chars with their JSON escapes
    if (inString) {
      if (ch === '\n') {
        result += '\\n';
      } else if (ch === '\r') {
        result += '\\r';
      } else if (ch === '\t') {
        result += '\\t';
      } else {
        result += ch;
      }
    } else {
      result += ch;
    }

    i++;
  }

  return result;
}

function cleanJson(raw: string): string {
  // 1. Strip markdown fences
  let cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  // 2. Extract just the outer JSON object
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }

  // 3. Repair unescaped newlines/tabs inside string values
  cleaned = fixUnescapedNewlines(cleaned);

  return cleaned;
}

export async function generateMobileApp(
  userPrompt: string,
  conversationHistory: ConversationMessage[]
): Promise<GeneratedApp> {
  const response = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 8000,
    messages: [
      { role: 'system', content: MOBILE_SYSTEM_PROMPT },
      ...conversationHistory,
      { role: 'user', content: userPrompt },
    ],
  });

  const raw = response.choices[0]?.message?.content || '';

  try {
    const parsed = JSON.parse(cleanJson(raw)) as GeneratedApp;
    console.log('[AI] JSON parse succeeded. appName:', parsed.appName, '| files:', Object.keys(parsed.files || {}));
    return parsed;
  } catch (parseErr) {
    console.error('[AI] JSON parse FAILED:', (parseErr as Error).message);
    console.error('[AI] Raw response (first 300 chars):', raw.slice(0, 300));
    return {
      appName: 'Generated App',
      description: 'Mobile app generated by MobileForge',
      files: { 'App.tsx': raw },
      colorScheme: { primary: '#6C3AE8', background: '#0A0A0F', text: '#E8E8F0' },
      features: [],
      hebrewSummary: 'האפליקציה נוצרה בהצלחה',
    };
  }
}

// Vision is not supported with Groq/Llama — call sites catch this and return 503
export async function generateFromScreenshot(): Promise<never> {
  throw Object.assign(new Error('Vision not supported'), { code: 'VISION_NOT_SUPPORTED' });
}

export async function* streamGenerateMobileApp(
  userPrompt: string,
  conversationHistory: ConversationMessage[]
): AsyncGenerator<string> {
  const stream = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 8000,
    stream: true,
    messages: [
      { role: 'system', content: MOBILE_SYSTEM_PROMPT },
      ...conversationHistory,
      { role: 'user', content: userPrompt },
    ],
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content || '';
    if (text) yield text;
  }
}
