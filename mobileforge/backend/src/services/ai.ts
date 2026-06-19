import Groq from 'groq-sdk';

const client = new Groq({ apiKey: process.env.GROQ_API_KEY || 'placeholder-for-demo-mode' });

const MODEL = 'llama-3.3-70b-versatile';

const MOBILE_SYSTEM_PROMPT = `
You are MobileForge AI — an expert React Native / Expo developer.
Your job: receive a natural language description of a mobile app and return COMPLETE, WORKING Expo code.

IMPORTS — CRITICAL RULE:
Every App.tsx MUST start with this exact import block (keep unused ones — they don't cause errors):

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, SectionList,
  TextInput, Image, Modal, ActivityIndicator, Switch, SafeAreaView, Platform,
  KeyboardAvoidingView, StatusBar, Alert, Dimensions, Pressable, RefreshControl,
  I18nManager,
} from 'react-native';

Then add ONLY the extra imports you actually need (expo-*, @react-navigation/*, etc.).
NEVER reference a component in JSX that is not in your import statements.

IMPORT RULES — ABSOLUTE:
- Import ONLY from 'react' and 'react-native'. NO other packages.
- NEVER import from expo-linear-gradient, @expo/vector-icons, expo-font,
  react-native-paper, react-native-vector-icons, or ANY external package.
- For gradients: use View with a solid backgroundColor — never LinearGradient.
- For icons: use emoji characters inside <Text> — never Ionicons or MaterialIcons.
- For fonts: use the system default — never expo-font or useFonts.
- For navigation between 1-2 screens: useState + conditional rendering only.

DESIGN PRINCIPLES — MANDATORY (visual quality is critical):
- StyleSheet.create() for ALL styles — never inline style objects
- ALWAYS create a rich, polished StyleSheet:
  • Vibrant cohesive color palette — pick colors that match the app's purpose
    (weather → sky blues; fitness → energetic oranges; notes → calm greens, etc.)
  • borderRadius: 12-16 on ALL cards and buttons — never sharp corners
  • Shadows on every card: elevation: 4 on Android AND
    shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.15,
    shadowRadius:8 on iOS
  • Generous padding: 16-24 inside cards, 20-24 between sections
  • Colorful header section at the top of each screen (colored background, white text)
  • Card-based layouts: white or light-colored cards on a soft grey/tinted background
  • Typography hierarchy: large bold titles 24-28px, medium labels 16-18px,
    readable body 14-16px — use fontWeight:'bold'/'600' for headings
  • Every screen must look modern and professional, like a real published app
- StatusBar barStyle matching the color scheme
- NEVER produce plain unstyled text on a plain white background
- The very first thing users see must be visually impressive

IMPORT VERIFICATION — MANDATORY:
Before finalising your output, scan every JSX tag AND every identifier in your code.

CRITICAL — utilities are NOT components but still MUST be imported:
I18nManager.forceRTL → import I18nManager from 'react-native' (already in block above)
Platform.OS / Platform.select → import Platform
Dimensions.get → import Dimensions
Alert.alert → import Alert
StyleSheet.create → import StyleSheet
Appearance.getColorScheme → import Appearance (add to import if used)

RULE: Every react-native reference — visual component OR utility — MUST appear
in the import block. Go line by line through your code before returning output.
If any identifier is missing → add it. NEVER use what is not imported.

RULES:
1. Single self-contained App.tsx, runnable in Expo Snack SDK 52
2. If user writes in Hebrew: all UI text in Hebrew, add I18nManager.forceRTL(true) at the module level
3. Include loading states, error handling, and empty states
4. Functional components with hooks only — no class components
5. Return ONLY valid JSON — nothing outside the JSON object

OUTPUT FORMAT — return ONLY this JSON object, nothing else:
{
  "appName": "App name in English",
  "description": "One sentence description in English",
  "files": {
    "App.tsx": "...complete TSX code with ALL imports at the top..."
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
- In the App.tsx string value, encode newlines as \\n and tabs as \\t
- Do NOT double-escape Unicode: write Hebrew text directly (e.g. "שלום") NOT as \\u05E9\\u05DC\\u05D5\\u05DD
- The complete response must be parseable by JSON.parse()
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
 * Walk the JSON character-by-character and escape any literal newlines/tabs
 * found inside string values. Fixes the most common LLM output error where
 * actual newline chars appear in a string instead of the \\n escape sequence.
 */
function fixUnescapedNewlines(json: string): string {
  let result = '';
  let inString = false;
  let i = 0;

  while (i < json.length) {
    const ch = json[i];

    // Inside a string: skip over any existing escape sequence intact
    if (ch === '\\' && inString) {
      result += ch + (json[i + 1] ?? '');
      i += 2;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      result += ch;
      i++;
      continue;
    }

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
  let cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }

  cleaned = fixUnescapedNewlines(cleaned);
  return cleaned;
}

/**
 * When Groq double-escapes Unicode (outputs \\u05E8 instead of ר),
 * JSON.parse produces the literal 6-char string "ר" instead of "ר".
 * This function converts any surviving \\uXXXX sequences back to characters.
 */
function decodeEscapedUnicode(str: string): string {
  return str.replace(/\\u([0-9A-Fa-f]{4})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
}

/** Apply unicode fix to all user-visible string fields. */
function fixParsedApp(app: GeneratedApp): GeneratedApp {
  return {
    ...app,
    appName: decodeEscapedUnicode(app.appName ?? ''),
    description: decodeEscapedUnicode(app.description ?? ''),
    hebrewSummary: decodeEscapedUnicode(app.hebrewSummary ?? ''),
    features: (app.features ?? []).map(decodeEscapedUnicode),
  };
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
    const fixed = fixParsedApp(parsed);
    console.log('[AI] Parse OK — appName:', fixed.appName, '| hebrewSummary:', fixed.hebrewSummary.slice(0, 40));
    return fixed;
  } catch (parseErr) {
    console.error('[AI] JSON parse FAILED:', (parseErr as Error).message);
    console.error('[AI] Raw (first 300):', raw.slice(0, 300));
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
