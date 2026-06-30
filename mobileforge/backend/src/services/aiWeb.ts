import Groq from 'groq-sdk';
import { getDemoResponse, getDemoEditResponse } from './demoApps';
import { getThemePrompt } from './themes';
import { analyzeQuality, buildRepairPrompt } from './qualityGate';

const client = new Groq({ apiKey: process.env.GROQ_API_KEY || 'placeholder-for-demo-mode' });
const MODEL = 'llama-3.3-70b-versatile';

// Log key status once on startup (last 4 chars only, never full key)
const _k = (v: string | undefined) => v ? (v.length > 4 ? `…${v.slice(-4)}` : '(set)') : '⚠️ MISSING';
console.log('[AI/web] Provider keys —', {
  GROQ:        _k(process.env.GROQ_API_KEY),
  NVIDIA:      _k(process.env.NVIDIA_API_KEY),
  GEMINI:      _k(process.env.GEMINI_API_KEY),
  OPENROUTER:  _k(process.env.OPENROUTER_API_KEY),
  CEREBRAS:    _k(process.env.CEREBRAS_API_KEY),
  TOGETHER:    _k(process.env.TOGETHER_API_KEY),
});

// ── Provider abstraction ────────────────────────────────────────────────────

interface ChatMessage { role: string; content: string; }

async function callGroq(messages: ChatMessage[]): Promise<string> {
  const response = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 16000,
    // Pin sampling for design consistency. Groq otherwise defaults to ~1.0,
    // which runs the most-used provider HOTTER than the Gemini fallback (0.7)
    // and maximises "weird layout / malformed output" variance. 0.6 + top_p
    // keeps output stable and on-brief without making it robotic.
    temperature: 0.6,
    top_p: 0.9,
    messages: messages as Parameters<typeof client.chat.completions.create>[0]['messages'],
  });
  return response.choices[0]?.message?.content ?? '';
}

// Gemini model fallback order. gemini-2.5-flash is the current, in-quota
// workhorse; 2.0-flash is kept as a secondary in case 2.5 is unavailable on a
// given key. (gemini-1.5-flash was REMOVED — it 404s on v1beta generateContent.)
// Verified 2026-06: 2.5-flash → 200 OK, 2.0-flash → 429 quota, 1.5-flash → 404.
const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash'] as const;

async function callGemini(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { const e = new Error('GEMINI_API_KEY not set'); (e as any).skip = true; throw e; }

  const systemMsg = messages.find(m => m.role === 'system');
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));

  let lastErr: Error | null = null;
  for (const model of GEMINI_MODELS) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          ...(systemMsg && { systemInstruction: { parts: [{ text: systemMsg.content }] } }),
          generationConfig: { maxOutputTokens: 16384, temperature: 0.7 },
        }),
      }
    );
    if (res.ok) {
      const data = await res.json() as any;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      if (text) return text;
      lastErr = new Error(`Gemini (${model}) returned empty response`);
      continue;
    }
    const err = await res.json().catch(() => ({}));
    lastErr = new Error(`Gemini ${model} ${res.status}: ${(err as any)?.error?.message ?? 'unknown'}`);
    (lastErr as any).status = res.status;
    // 429 (quota) / 404 (model gone) → try the next model. Other errors (e.g.
    // 400 bad key) won't be fixed by switching models, so stop early.
    if (res.status !== 429 && res.status !== 404) break;
    console.warn(`[AI/web]   Gemini ${model} → ${res.status}, trying next model…`);
  }
  throw lastErr ?? new Error('Gemini failed');
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
      max_tokens: 16000,
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
 * Generic OpenAI-compatible chat-completions caller. Cerebras and Together both
 * speak the exact OpenAI wire format, so one helper covers both.
 */
async function callOpenAICompatible(
  messages: ChatMessage[],
  opts: { name: string; envVar: string; url: string; model: string }
): Promise<string> {
  const apiKey = process.env[opts.envVar];
  if (!apiKey) { const e = new Error(`${opts.envVar} not set`); (e as any).skip = true; throw e; }

  const res = await fetch(opts.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: opts.model, messages, max_tokens: 16000 }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const e = new Error(`${opts.name} ${res.status}: ${(err as any)?.error?.message ?? 'unknown'}`);
    (e as any).status = res.status;
    throw e;
  }
  const data = await res.json() as any;
  const text = data.choices?.[0]?.message?.content ?? '';
  if (!text) throw new Error(`${opts.name} returned empty response`);
  return text;
}

const callCerebras = (m: ChatMessage[]) => callOpenAICompatible(m, {
  name: 'Cerebras', envVar: 'CEREBRAS_API_KEY',
  url: 'https://api.cerebras.ai/v1/chat/completions', model: 'llama-3.3-70b',
});

// NVIDIA NIM (build.nvidia.com) — OpenAI-compatible, free tier, serves the same
// Llama-3.3-70B class as our primary Groq model, so it's the strongest fallback
// for output consistency. Get a key at build.nvidia.com → set NVIDIA_API_KEY.
const callNvidia = (m: ChatMessage[]) => callOpenAICompatible(m, {
  name: 'NVIDIA', envVar: 'NVIDIA_API_KEY',
  url: 'https://integrate.api.nvidia.com/v1/chat/completions', model: 'meta/llama-3.3-70b-instruct',
});

const callTogether = (m: ChatMessage[]) => callOpenAICompatible(m, {
  name: 'Together', envVar: 'TOGETHER_API_KEY',
  url: 'https://api.together.xyz/v1/chat/completions',
  model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',
});

// Provider keys, in fallback order. A non-placeholder value means "try me".
const PROVIDER_KEYS = [
  'GROQ_API_KEY', 'NVIDIA_API_KEY', 'GEMINI_API_KEY', 'OPENROUTER_API_KEY', 'CEREBRAS_API_KEY', 'TOGETHER_API_KEY',
] as const;

function allKeysPlaceholder(): boolean {
  return PROVIDER_KEYS.every(name => {
    const k = process.env[name];
    return !k || k.startsWith('__') || k.startsWith('placeholder');
  });
}

/**
 * Try Groq first (with 1 retry on rate-limit), then Gemini, OpenRouter,
 * Cerebras, Together — in that order. Throws only when ALL configured
 * providers have failed.
 *
 * Bug fix: previously only fell back on 429 rate-limit. Now falls back on
 * ANY Groq failure (auth error, server error, network error, etc.) so that
 * a bad/missing Groq key still lets the other providers serve the request.
 */
interface FallbackResult {
  text: string;
  demoMode: boolean;
  demoReason?: string;
}

async function callWithFallback(messages: ChatMessage[]): Promise<FallbackResult> {
  // Demo mode: skip network calls entirely if all API keys are placeholders
  const allPlaceholder = allKeysPlaceholder();
  if (allPlaceholder) {
    console.log('[AI/web] \u{1F3AD} Demo mode — all API keys are placeholders');
    const userMsg = messages.find(m => m.role === 'user');
    return { text: getDemoResponse(userMsg?.content ?? ''), demoMode: true, demoReason: 'No AI provider keys configured' };
  }

  let groqLastError: unknown;

  // 1. Groq — up to 2 attempts, but only retry on 429 rate-limit
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      console.log(`[AI/web] Groq attempt ${attempt + 1}/2…`);
      const result = await callGroq(messages);
      console.log('[AI/web] ✓ Groq succeeded');
      return { text: result, demoMode: false };
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

  // 2. NVIDIA NIM — same Llama-3.3-70B class as Groq, so the best-quality fallback
  try {
    console.log('[AI/web] → NVIDIA');
    const result = await callNvidia(messages);
    console.log('[AI/web] ✓ NVIDIA succeeded');
    return { text: result, demoMode: false };
  } catch (err) {
    if ((err as any).skip) console.log('[AI/web]   NVIDIA skipped (no key)');
    else console.error('[AI/web]   NVIDIA failed:', (err as Error).message);
  }

  // 3. Gemini
  try {
    console.log('[AI/web] → Gemini');
    const result = await callGemini(messages);
    console.log('[AI/web] ✓ Gemini succeeded');
    return { text: result, demoMode: false };
  } catch (err) {
    if ((err as any).skip) console.log('[AI/web]   Gemini skipped (no key)');
    else console.error('[AI/web]   Gemini failed:', (err as Error).message);
  }

  // 3. OpenRouter
  try {
    console.log('[AI/web] → OpenRouter');
    const result = await callOpenRouter(messages);
    console.log('[AI/web] ✓ OpenRouter succeeded');
    return { text: result, demoMode: false };
  } catch (err) {
    if ((err as any).skip) console.log('[AI/web]   OpenRouter skipped (no key)');
    else console.error('[AI/web]   OpenRouter failed:', (err as Error).message);
  }

  // 4. Cerebras
  try {
    console.log('[AI/web] → Cerebras');
    const result = await callCerebras(messages);
    console.log('[AI/web] ✓ Cerebras succeeded');
    return { text: result, demoMode: false };
  } catch (err) {
    if ((err as any).skip) console.log('[AI/web]   Cerebras skipped (no key)');
    else console.error('[AI/web]   Cerebras failed:', (err as Error).message);
  }

  // 5. Together
  try {
    console.log('[AI/web] → Together');
    const result = await callTogether(messages);
    console.log('[AI/web] ✓ Together succeeded');
    return { text: result, demoMode: false };
  } catch (err) {
    if ((err as any).skip) console.log('[AI/web]   Together skipped (no key)');
    else console.error('[AI/web]   Together failed:', (err as Error).message);
  }

  // All providers failed (bad/expired key, rate limit, or provider downtime).
  // Rather than hard-failing the user's request, serve a polished, prompt-matched
  // demo app so the chat always produces something usable. The real provider
  // error is logged here for diagnosis (check Render logs to fix the key).
  const rootMsg = groqLastError instanceof Error ? groqLastError.message : String(groqLastError);
  console.error(`[AI/web] ⚠️ All providers failed — serving demo fallback. Root error: ${rootMsg}`);
  const userMsg = messages.find(m => m.role === 'user');
  return { text: getDemoResponse(userMsg?.content ?? ''), demoMode: true, demoReason: `All AI providers failed: ${rootMsg.slice(0, 120)}` };
}

const WEB_SYSTEM_PROMPT = `
You are WebForge AI — an expert React developer that produces Lovable.dev quality output.
Your job: receive a description and return a COMPLETE, professional React web app.

━━━ ABSOLUTE #1 RULE ━━━
NEVER use emojis anywhere in the app UI. No 🍕 🛒 👤 🏠 🔍 🔥 🎉 ⭐ ⏱ 👋 or ANY other emoji.
Emojis make apps look toy-like and unprofessional. Use ONLY inline SVG icons.
This is the single most important quality rule. Violating it ruins the entire app.

━━━ ABSOLUTE #2 RULE — DEPTH & FULL INTERACTIVITY (NO DEAD ENDS) ━━━
EVERY interactive element MUST have a real, working engine. NOTHING is decorative.
If you render a button, tab, row, card, icon, input, or toggle, it MUST do something
visible when tapped — change state, navigate, open a detail, filter, add/remove data,
or show feedback. A control that does nothing is a BUG. Specifically:
- EVERY <button> / clickable element has an onClick that produces a VISIBLE effect.
- EVERY list/grid row is tappable and DRILLS INTO a detail screen for that item
  (show that item's full data; include a back button to return).
- TABS and filters actually switch content. Time-range / category selectors actually
  change what is shown (e.g. different data, different chart), not just a highlight.
- FORMS submit for real: validate, then update state and show a success toast/confirmation.
- "Add" actually appends to a list; "delete"/"close" actually removes; counters update.
- Selecting an item carries it forward (it drives the next screen's content).
- Provide real React state for everything; the UI re-renders from state on every action.
- Every screen connects to others — no orphan screens, no dead navigation.
Before finishing, MENTALLY TAP EVERY ELEMENT. If any does nothing, wire it or remove it.
This is what makes an app feel ALIVE and deep (Lovable-quality) instead of a static mockup.

━━━ AI FAILURE MODES — YOU MUST AUTO-SOLVE ALL OF THESE ━━━
These are the exact mistakes generic AI app builders make. A MobileForge app NEVER has them.
Go through this checklist before you finish — each item is mandatory, not optional:

1. DEAD UI → Every button/row/tab/toggle does something real (see RULE #2). No decoration.
2. SAFE AREAS → The shell classes already pad for the notch / Dynamic Island / home
   indicator (env(safe-area-inset-*)). So put bars in .app-header / .header-gradient /
   .app-nav — NEVER hard-code position:fixed top:0 / bottom:0 yourself, or content will
   hide under the status bar or home bar on a real phone.
3. OVERLAPPING / COLLIDING LAYOUT → In any flex row with an icon + flexible text + a
   trailing value (price, time, chevron): give the middle text {flex:1, minWidth:0,
   overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'} and give fixed
   side elements {flexShrink:0}. Charts/sparklines beside text get a fixed width +
   flexShrink:0. NEVER let two elements sit on top of each other.
4. NO LOADING STATE → If data "loads", show .skeleton / .skeleton-card placeholders
   that match the layout, then swap to content. Never a blank screen, never a bare spinner.
5. NO EMPTY STATE → Every list that can be empty renders .empty-state (icon + title +
   body + CTA). Never a blank area.
6. NO ERROR STATE → Any action that can fail (submit, load, pay) shows feedback on
   failure: an .error-state block (icon + title + body + a "Try again" retry button), or a
   toast. The user is never left guessing.
7. UNVALIDATED FORMS → Inputs validate inline. On a bad value add class "invalid" to the
   .input-field and render a <p className="field-error"> below it; only submit when valid,
   then show a success confirmation. Required fields, email format, min length — all checked.
8. TINY TOUCH TARGETS → Every tappable thing is ≥44×44px (the design-system buttons
   already are). Don't shrink them below that.
9. BROKEN IMAGES → Use the placeholderImg() SVG helper. NEVER external URLs / picsum.
10. EMOJIS AS ICONS → Inline SVG only (RULE #1).
11. NOT DEVICE-ADAPTIVE → Use grid-2 + grid-tablet-3/4 so phone grids reflow on iPad
    instead of stretching one column (see DEVICE-ADAPTIVE below).
12. ORPHAN SCREENS → Every screen reachable AND has a way back. No dead navigation.

━━━ CODE RULES ━━━
- Write ONLY the App function (helper components defined BEFORE App)
- NO import statements — React is globally available
- First line inside App: const { useState, useEffect, useRef, useCallback, useMemo } = React;
- Plain JavaScript — NO TypeScript annotations
- Multiple screens: useState for currentTab / currentScreen

━━━ SVG ICON LIBRARY — USE THESE INSTEAD OF EMOJIS ━━━
Every icon MUST be an inline SVG. Copy these exactly:

Define a reusable Icon component at the top of your code:
const SvgIcon = ({children, size=24, fill="none", stroke="currentColor", strokeWidth=1.5, ...props}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
    strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>{children}</svg>
);

ICONS (use as JSX — pick the right one for each context):

HOME: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
SEARCH: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
CART: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
USER: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
PLUS: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
HEART: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
STAR: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
SETTINGS: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
CHECK: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
TRASH: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
ARROW_LEFT: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
ARROW_RIGHT: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
BELL: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
CLOCK: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
CLOSE: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
MENU: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 12h16M4 6h16M4 18h16"/></svg>
FILTER: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
EDIT: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
SHARE: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
MAP_PIN: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
CALENDAR: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
FIRE: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14 0-5.5 3.5-7.5.67 2.17 1.5 3.5 3 5 2.09 2.09 3 4.5 3 6.5a7 7 0 1 1-14 0c0-1.15.29-2.06.8-2.9"/></svg>
PACKAGE: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>

━━━ IMAGES — REAL PHOTOS via photoImg(), SVG only as a last resort ━━━
For ANY photographic content (food dishes, products, people/avatars, places,
nature, fashion, real-world objects) use the GLOBAL helper window.photoImg:

  photoImg(query, width, height)   // returns a real keyword-matched photo URL

Usage:  <img src={photoImg('cappuccino coffee', 400, 300)} alt="Cappuccino"
          style={{width:'100%',height:180,objectFit:'cover'}} />
- Make the query SPECIFIC and descriptive ('grilled salmon plate', not 'food').
- Match width/height to the slot so the photo crops nicely with objectFit:cover.
- photoImg is always defined (global). It degrades to a tasteful placeholder on
  its own if photos are unavailable — you do NOT need an onError handler.
- Avatars: photoImg('portrait person smiling', 80, 80) with borderRadius:'50%'.

NEVER use picsum.photos or any other external image URL — they are BLOCKED.
Use photoImg() for photos. The SVG placeholderImg below is ONLY for abstract/UI
fills (chart backgrounds, empty-state art) — NOT for real-world imagery:

const placeholderImg = (w, h, label, color='#e5e7eb') =>
  \`data:image/svg+xml,\${encodeURIComponent(\`<svg xmlns="http://www.w3.org/2000/svg" width="\${w}" height="\${h}" viewBox="0 0 \${w} \${h}"><rect fill="\${color}" width="\${w}" height="\${h}"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9ca3af" font-family="system-ui" font-size="14">\${label}</text></svg>\`)}\`;

Usage: placeholderImg(400, 200, 'Pizza', '#fef2f2')
Use warm/cool tints that match the item category:
  Food: '#fef2f2' (warm rose), '#fef9c3' (warm yellow)
  Nature: '#ecfdf5' (mint), '#f0fdf4' (green)
  Tech: '#eff6ff' (blue), '#f5f3ff' (violet)
  Fashion: '#fdf2f8' (pink), '#faf5ff' (purple)
  Default: '#f3f4f6' (gray)

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

NEW COMPONENTS (2026 Design System):
  glass-card       frosted glass card with backdrop-filter blur
  fab              56×56px floating action button, gradient bg, fixed bottom-right
  bottom-sheet     draggable bottom panel (overlay), use with bottom-sheet-handle
  progress-bar     + progress-bar-fill for progress indicators (set width via style)
  chip             pill-shaped tinted tag button, use for filters and categories
  chip-outline     outlined version, add class "active" for selected
  toggle           switch button (48×28px), add class "active" for on state
  display          36px large heading for hero sections
  title-md         20px medium heading
  body-lg          16px larger body text
  label            12px semibold label text
  badge-success    green semantic badge
  badge-warning    yellow semantic badge
  badge-error      red semantic badge

WIDGET COMPONENTS (for interactive features):
  clock-widget     container for clock widgets
  clock-digital    large monospace time display (48px)
  timer-display    countdown/stopwatch number display (56px monospace)
  calendar-grid    7-column date grid
  calendar-day     individual day cell (min 36px, hover/today/selected states)
  calendar-nav     month navigation bar with buttons
  chart-container  wrapper for SVG charts
  chart-legend     flex legend with colored dots
  stat-card        statistics card with big number
  star-rating      horizontal star container (32px stars, 44px touch target)
  carousel         image slider with arrows and dots
  share-row        horizontal share button row
  share-btn        social share button (48px) — add .whatsapp/.facebook/.twitter/.email/.copy
  profile-card     user profile with header, avatar, stats
  calc-grid        4-column calculator button grid
  calc-btn         calculator button (56px) — add .num/.op/.func/.equals/.clear/.zero
  note-card        colored sticky note — add .yellow/.green/.blue/.pink
  survey-option    quiz answer option (48px) with radio indicator
  habit-item       habit row with checkbox and streak

TYPOGRAPHY — Material Design 3 scale (use for ALL text — no Tailwind font/color):
  display          36px 700-weight hero heading (line-height: 44px)
  title            26px 800-weight heading (line-height: 32px)
  title-md         20px 700-weight subheading (line-height: 28px)
  subtitle         16px 700-weight label (line-height: 24px)
  body-lg          16px 400-weight readable body (line-height: 24px)
  body             14px 400-weight body text (line-height: 22px)
  label            12px 600-weight label/tag (line-height: 16px)
  caption          12px 400-weight helper text (line-height: 16px)
  section-title    11px 700-weight ALL-CAPS section header
  ALL line-heights are multiples of 8 (16, 22, 24, 28, 32, 44).

LAYOUT with Tailwind (flex/grid ONLY — no color, no shadow, no font classes):
  flex, grid, gap-X, items-center, justify-between, overflow-y-auto,
  relative, absolute, sticky, inset-0, w-full, h-full, z-10, grid-cols-X

COLOR PALETTE — set via <style> at top of App JSX (REQUIRED):
  <style>{\`
    :root {
      --c-from: #HEX;                        /* primary color (same as --c-to for flat look) */
      --c-to: #HEX;                          /* same as --c-from — NO gradients              */
      --c-primary: #HEX;                     /* brand color    */
      --c-primary-light: rgba(r,g,b,0.08);   /* tinted bg      */
      --c-bg: #ffffff;                        /* page bg — white or very light gray #fafafa   */
    }
  \`}</style>

  CRITICAL COLOR RULES (based on top 100 App Store apps):
  - Use ONE flat accent color only. Set --c-from and --c-to to THE SAME value — no gradients.
  - 90% of top apps use: white background + dark text + single accent color.
  - Palette by domain: food→#00B37E (Wolt green) or #FF3008 (DoorDash red),
    finance→#0052FF (Coinbase) or #00C805 (Robinhood), fitness→#FC4C02 (Strava),
    travel→#FF5A5F (Airbnb), music→#1DB954 (Spotify green), health→#4EAAF3 (Calm blue),
    social→#000000 (Threads/X), shopping→#000000 (ZARA), AI→#10A37F (ChatGPT teal),
    productivity→#E44332 (Todoist) or #000000 (Notion), education→#58CC02 (Duolingo).
  - Background: #ffffff (light mode) or #000000 (dark mode). Never bright tinted backgrounds.
  Semantic colors available: var(--c-success) green, var(--c-warning) amber, var(--c-error) red.

  ━━━ DEFAULT AESTHETIC: HIGH-END & RESTRAINED ━━━
  Unless the user EXPLICITLY asks for something colorful / playful / vibrant / fun /
  kids / festive, DEFAULT to a premium, restrained look:
  • Background: white (or near-black #0c0c0e for dark) — NOT a colored background.
  • Palette: monochrome grays + ONE accent color used sparingly (CTAs, active state,
    a single highlight). No rainbow, no multiple bright fills competing.
  • Let typography and whitespace carry the design, not color or decoration.
  • A first-time visitor should think "clean and expensive," never "loud template."
  Only introduce strong/multiple colors when the user's request implies it.

  PROFESSIONAL DESIGN RULES (based on analysis of top 100 App Store apps):
  ⚠️ NEVER use emojis as icons in the UI — use SVG icons or CSS shapes instead.
  ⚠️ NEVER use gradient backgrounds on buttons or headers — use flat solid colors.
  ⚠️ NEVER use shimmer/glow/pulse/confetti animations — they look toy-like.
  ⚠️ NEVER use bright candy-colored backgrounds (pink, purple, neon) — use white/black + one accent.
  ⚠️ NEVER use heavy box-shadows (>3px blur) — max shadow: 0 1px 3px rgba(0,0,0,0.08).
  ✓ DO use flat solid accent color for CTAs and interactive elements only.
  ✓ DO use generous white space — padding 16px+, gap 8-12px between cards.
  ✓ DO use typography hierarchy: 28px bold headings, 15px regular body, 12px gray captions.
  ✓ DO use letter-spacing: -0.5px on large headings for a professional look.
  ✓ DO use border-radius: 12px for cards, 8px for buttons, 9999px for pills/avatars.
  ✓ DO use bottom tab bar with 4-5 items, SVG stroke icons (24x24, stroke-width: 1.5).
  ✓ DO support dark mode: black (#000) bg, #1c1c1e surface, #38383a borders, white text.

  ━━━ VARY THE LAYOUT — DO NOT SHIP THE SAME SKELETON EVERY TIME ━━━
  The #1 tell of a cheap AI builder is that EVERY app looks identical:
  gradient-header → chip-row → card-list → bottom-nav. NEVER default to that.
  First pick the layout ARCHETYPE that fits THIS app, then build it:
  • Dashboard/analytics → top bar + ONE hero metric/chart card + a 2×2 KPI grid
    + horizontal bars. Often NO bottom nav. (e.g. analytics, crypto, health stats)
  • Finance/wallet → big typographic balance on a FLAT background (no gradient),
    a row of outlined quick-action icons, a segmented control, clean transaction
    rows separated by 1px dividers (NOT heavy cards). (e.g. banking, budgeting)
  • Feed/social → full-width media cards, author row, edge-to-edge, generous vertical rhythm.
  • List-detail → a lean scannable list; tapping opens a rich detail screen.
  • Tracker/agenda → date header, grouped sections, progress rings or checkboxes.
  • Catalog/commerce → a 2-column product GRID with imagery, not a 1-column list.
  Rules of thumb: prefer FLAT backgrounds over gradient headers; use dividers and
  whitespace instead of wrapping everything in shadowed cards; reach for a real
  typographic hierarchy (a 40px+ hero number) before decoration. Reference quality
  bar: Linear, Mercury, Revolut, Things, Apple — restraint, not ornament.

  ━━━ EXPAND THE DESIGN RANGE (don't converge on one look) ━━━
  Across apps, vary the *visual personality* too — not just the layout. Unless the
  user pins a specific style, pick ONE coherent direction that fits the product and
  commit to it. Draw from a wide range, e.g.:
  • Minimal/editorial (lots of whitespace, big type, hairline dividers)
  • Soft/neumorphic-lite (gentle surfaces, low-contrast cards)
  • Bold/brutalist (heavy type, hard edges, high contrast) — only if it fits
  • Glass/dark premium (translucent layers on near-black)
  • Warm/organic (rounded, earthy neutrals, friendly)
  • Data-dense/pro (compact rows, tabular numbers, tight grid)
  Vary accent hue, corner radius, density, and type scale between apps so two
  different requests never look like siblings. Match the personality to the domain
  (a meditation app ≠ a trading terminal). Still obey the restraint rules above.

  ━━━ MODERN APP ESSENTIALS — include what genuinely fits the app ━━━
  Today's users expect these. Add the ones that make sense for the request (don't
  bolt on irrelevant ones):
  • Onboarding/empty first-run that orients a new user (not a blank screen).
  • Search / filter when there's a list of more than ~8 items.
  • Profile or Settings screen (account, preferences, theme toggle, sign out).
  • Loading skeletons, empty states, and error+retry for anything that "loads".
  • Inline form validation with clear, friendly messages.
  • Clear primary action on every screen; secondary actions de-emphasized.
  • Confirmation for destructive actions (delete) — never silent data loss.
  • A light/dark capability when it suits the product.
  • Realistic, plausible sample data (names, prices, dates) — never "Lorem ipsum".
  Build these as working UI with the design system; keep them tasteful, not cluttered.

FONTS — for Hebrew apps use Heebo, Assistant, or Rubik (all pre-loaded):
  <style>{\`:root { --c-font: 'Heebo', system-ui, sans-serif; }\`}</style>
  For English apps keep the default Inter font.

EMPTY STATES — use for every list that can be empty:
  <div className="empty-state">
    <div className="empty-state-icon" style={{fontSize:'48px',opacity:0.3}}>○</div>
    <p className="empty-state-title">The list is empty</p>
    <p className="empty-state-body">Tap + to add your first item</p>
    <button className="btn-primary" style={{width:'auto',padding:'12px 24px'}} onClick={...}>Add</button>
  </div>

ERROR STATES — use when an action/load FAILS (never leave the user guessing):
  <div className="error-state">
    <div className="error-state-icon"><SvgIcon size={44}>{/* alert-triangle path */}</SvgIcon></div>
    <p className="error-state-title">Something went wrong</p>
    <p className="error-state-body">We couldn't load the data. Check your connection and try again.</p>
    <button className="btn-primary" style={{width:'auto',padding:'12px 24px'}} onClick={retry}>Try again</button>
  </div>

INLINE FORM VALIDATION — validate fields, mark invalid ones, show the reason:
  <input className={"input-field" + (emailErr ? " invalid" : "")} value={email} onChange={...} />
  {emailErr && <p className="field-error"><SvgIcon size={13}>{/* x-circle */}</SvgIcon>{emailErr}</p>}
  Only submit when all fields are valid, then show a success confirmation/toast.

RESPONSIVE GRIDS — use to make app look good on iPad too:
  Phone (default):  <div className="grid-2">  — 2 columns
  Tablet (768px+):  <div className="grid-tablet-3"> or <div className="grid-tablet-4">

━━━ UX/UI PRINCIPLES — MANDATORY ━━━
HIERARCHY & LAYOUT:
- Less is more: one clear primary action per screen, no overloaded UI.
- Visual hierarchy: use size, weight, color to guide the eye naturally.
- Primary CTA (btn-primary) must be prominent and visible without scrolling.
- Consistent spacing: use 8pt grid — var(--sp-2)=8px, var(--sp-3)=12px, var(--sp-4)=16px, var(--sp-6)=24px, var(--sp-8)=32px.
- Margin/padding MUST be multiples of 4px (preferably 8px): 4, 8, 12, 16, 24, 32, 40, 48, 64.

NAVIGATION:
- Use bottom tab nav (app-nav + nav-tab) with max 5 tabs.
- Active tab must be visually distinct (class "active").
- Navigation must be predictable across all screens.

DEVICE-ADAPTIVE (phone / tablet / desktop) — REQUIRED:
- The app is previewed on iPhone, Android, AND iPad. It MUST look right on all.
- For any grid/list of cards, use the responsive grid classes so columns grow on
  wider screens: phone uses "grid-2", and add "grid-tablet-3" / "grid-tablet-4"
  so a 2-up phone grid becomes 3-4 up on iPad — never a single stretched column.
- Use the design-system classes (app-shell, app-content, card, grid-2) which
  already widen padding/typography on tablet via media queries — do NOT hard-code
  fixed pixel widths on containers that would block them from adapting.
- Rows/lists that stay single-column should keep readable content, not stretch
  edge-to-edge awkwardly on tablet.

TOUCH & ACCESSIBILITY (WCAG 2.1 + Apple HIG):
- All buttons: minimum height 48px (btn-primary is 48px, btn-icon is 44px).
- All input fields: minimum height 48px.
- Touch targets: minimum 44×44px with 8px spacing between them.
- Font sizes: body text minimum 14px (caption 12px is ok for labels only).
- Color contrast: WCAG AA minimum 4.5:1 for text, 3:1 for large text.
- Semantic colors: use badge-success (green), badge-warning (yellow), badge-error (red).

VISUAL POLISH:
- Empty states: when a list is empty show an .empty-state div with icon, title, body text and a CTA button — never a blank screen.
- Loading: use .skeleton / .skeleton-text / .skeleton-card classes for perceived performance.
- Elevation: use cards with layered shadows for depth. Cards lift on hover (elevation-2).
- Micro-interactions: buttons scale on :active — already in design system. Lists lift on hover.
- First screen must look clean and professional — white background, bold heading, no gradient banner.
- Avoid glass/blur effects — use solid white cards with subtle shadows for a clean look.
- Bottom sheets: for secondary content (filters, settings, sharing) use .bottom-sheet + .bottom-sheet-handle.
- FAB: for primary creation action (add item) use .fab class (fixed position).
- Progress bars: use .progress-bar + .progress-bar-fill with width style.
- Chips: for filters/tags use .chip or .chip-outline. Multiple active chips use .chip-outline.active.
- Toggle: for on/off switches use .toggle, add .active class for on state.
- Animations: .animate-spring for modals/new items, .animate-slide-up for list items.

INTERACTIVE WIDGETS — use when the user requests specific functionality:
  These patterns generate self-contained, interactive widgets using React hooks.
  ALL widgets MUST follow the design system: card containers, 48px buttons, 8pt grid.

  CLOCK (digital):
    const [time, setTime] = useState(new Date());
    useEffect(() => { const id = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(id); }, []);
    Display: time.toLocaleTimeString('en-US') in a card with monospace font.

  CLOCK (analog SVG):
    Draw SVG circle (r=80), 12 hour marks, hour/minute/second hands using transform: rotate().
    Calculate angles: hours*(360/12) + minutes*(360/720), minutes*(360/60), seconds*(360/60).
    Update every second via useEffect + setInterval.

  TIMER / COUNTDOWN:
    const [seconds, setSeconds] = useState(300);
    const [running, setRunning] = useState(false);
    useEffect with setInterval that decrements. Format as MM:SS. Buttons: start, stop, reset, +1m, +5m.

  STOPWATCH:
    Count UP from 0 with centiseconds. useState + setInterval(10ms).
    Lap array: const [laps, setLaps] = useState([]). Display HH:MM:SS.cc.

  CALENDAR:
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selected, setSelected] = useState(new Date());
    Calculate: daysInMonth = new Date(year, month+1, 0).getDate();
    firstDayOfWeek = new Date(year, month, 1).getDay();
    Render 7-column grid. Highlight today, selected day. Prev/next month buttons.

  BAR CHART (SVG):
    const data = [{label, value, color}...];
    <svg viewBox="0 0 300 200"> with <rect> bars. Scale: (value/max) * maxHeight.
    Labels below, values above bars. Use gradient fills.

  PIE CHART (SVG donut):
    Calculate cumulative angles. Use <circle> with stroke-dasharray and stroke-dashoffset.
    Each slice: circumference * (value/total). Rotate each slice by cumulative angle.
    Legend with colored dots + labels + percentages.

  LINE CHART (SVG):
    <polyline> with calculated points. <circle> at each data point.
    Fill area below with <polygon> + gradient opacity.

  CIRCULAR PROGRESS (SVG):
    <circle> background (gray) + <circle> foreground with stroke-dashoffset.
    offset = circumference - (percentage/100) * circumference.
    Percentage text in center. Animate with CSS transition.

  STAR RATING:
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    5 stars with onClick, onMouseEnter, onMouseLeave.
    Filled: star <= (hover || rating). Size: 32px+. Color: #FFD700.

  IMAGE CAROUSEL:
    const [current, setCurrent] = useState(0);
    Array of gradient backgrounds as placeholder images.
    Left/right arrows, dot indicators. transition on slide change.

  LOCATION:
    navigator.geolocation.getCurrentPosition(pos => setLocation({lat, lng})).
    Show in card with coordinates. Handle permission denied gracefully.

  CONTACT FORM:
    const [form, setForm] = useState({name:'', email:'', phone:'', message:''});
    Validate on submit (required fields, email format). Success state after submit.
    All inputs use .input-field class with min-height 48px.

  SURVEY/QUIZ:
    const [step, setStep] = useState(0);
    Array of questions with type (radio, range, text).
    Progress bar at top. Next/prev buttons. Summary screen at end.

  SHARE BUTTONS:
    Row of social buttons: WhatsApp (green), Facebook (blue), X (black), Email (red).
    Each button opens a share URL in new tab. Use .btn-icon with brand colors.

  PROFILE CARD:
    Avatar (gradient circle), name, bio, stats row (posts/followers/following).
    Follow/unfollow toggle button. Colored top strip.

  CALCULATOR:
    Grid of buttons (4 cols): 0-9, +, -, ×, ÷, =, AC, ±, %.
    Display shows current input and result. eval() for simple calc or manual parsing.
    Dark card background. Buttons with different colors for numbers vs operators.

  NOTES:
    CRUD operations on notes array. Each note: title, content, color, timestamp.
    Grid layout (2 cols). Add new note modal. Color picker (4 preset colors).

  HABIT TRACKER:
    Array of habits with name, icon, completed (boolean), streak (number).
    Toggle checkbox for each. Overall progress bar. Add new habit.

RESPONSIVE:
- Every app must look great on PHONE (420px) AND TABLET (768px+).
- Use grid-2, grid-3 for phone; grid-tablet-3, grid-tablet-4 for tablet.
- app-shell expands to full width on tablet automatically.

━━━ ADVANCED CAPABILITIES — NO LIMITATIONS ━━━
You are NOT limited to simple UI apps. Generate COMPLEX, FEATURE-RICH apps.

DEVICE & BROWSER APIs — use freely when relevant:
  STEP COUNTER / PEDOMETER:
    Use DeviceMotionEvent: window.addEventListener('devicemotion', handler).
    Detect steps via acceleration threshold (>1.2g spike).
    const [steps, setSteps] = useState(0);
    Request permission on iOS: DeviceMotionEvent.requestPermission?.().
    Fall back to manual input if sensors unavailable.

  GEOLOCATION:
    navigator.geolocation.getCurrentPosition / watchPosition.
    Show coordinates, calculate distances, track movement.

  CAMERA:
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).
    Display in <video> element. Capture frame to <canvas>.

  NOTIFICATIONS:
    Notification.requestPermission(). new Notification(title, { body, icon }).
    Use for reminders, achievements, alerts.

  VIBRATION:
    navigator.vibrate(200) for haptic feedback on actions.

  SPEECH:
    SpeechSynthesis: window.speechSynthesis.speak(new SpeechSynthesisUtterance(text)).
    SpeechRecognition: for voice input.

  SHARE:
    navigator.share({ title, text, url }) for native sharing.

DATA PERSISTENCE — use localStorage for ALL user data:
  Save: localStorage.setItem('app-data', JSON.stringify(state));
  Load: JSON.parse(localStorage.getItem('app-data') || 'null');
  Auto-save on every state change via useEffect.
  This makes apps REAL — data survives page refresh.

  useEffect(() => {
    const saved = localStorage.getItem('myapp-data');
    if (saved) { try { setState(JSON.parse(saved)); } catch {} }
  }, []);
  useEffect(() => {
    localStorage.setItem('myapp-data', JSON.stringify(state));
  }, [state]);

GAMIFICATION — implement when relevant:
  Points system: actions earn points (steps, completions, streaks).
  Levels: point thresholds unlock new levels/titles.
  Achievements/badges: milestone rewards with SVG icons.
  Streaks: consecutive day tracking with streak counter.
  Leaderboard: local ranking with mock data.
  Progress bars: visual XP/level progress.
  Animations: subtle scale/fade on achievement, bounce on level up.

COMPLEX STATE PATTERNS:
  Reducer pattern for complex state:
    const reducer = (state, action) => { switch(action.type) {...} };
    const [state, dispatch] = React.useReducer(reducer, initialState);

  Computed values with useMemo:
    const stats = useMemo(() => calculateStats(data), [data]);

  Timers and intervals:
    useEffect with setInterval for real-time updates.
    Cleanup: return () => clearInterval(id);

  Drag and drop: onTouchStart/onTouchMove/onTouchEnd handlers.

COMPLEX APP PATTERNS — use for sophisticated requests:
  MULTI-STEP WIZARDS: step state + progress bar + validation per step.
  REAL-TIME DASHBOARDS: multiple stat cards + charts updating via intervals.
  SOCIAL FEATURES: likes, comments, shares, follow/unfollow, stories.
  E-COMMERCE: cart, checkout flow, order tracking, coupons, favorites.
  HEALTH/FITNESS: tracking, goals, history charts, daily/weekly views.
  FINANCE: transactions, budgets, categories, pie charts, trends.
  EDUCATION: courses, lessons, quizzes, progress, certificates.
  PRODUCTIVITY: kanban boards, timers, pomodoro, notes, calendars.

THERE ARE NO LIMITS on complexity. If the user asks for it, BUILD IT.
Generate as much code as needed. Use multiple helper components.
The app should feel REAL and COMPLETE, not a demo or mockup.

━━━ VISUAL DESIGN — PROFESSIONAL QUALITY ━━━
Design like Lovable.dev output — clean, minimal, professional. Follow these patterns:

═══ IMAGES — REAL PHOTOS via photoImg() ═══
NEVER use picsum.photos or any external image URL — they are BLOCKED.
Use the GLOBAL photoImg(query, w, h) helper for all product/item/people photos
(it returns a real keyword-matched photo and degrades gracefully on its own).

  PRODUCT IMAGE CARD pattern:
  <div style={{width:'100%',height:180,borderRadius:16,overflow:'hidden'}}>
    <img src={photoImg('margherita pizza', 400, 200)} alt="Item"
      style={{width:'100%',height:'100%',objectFit:'cover'}} />
  </div>

  For category thumbnails (smaller):
  <img src={placeholderImg(80,80,'Cat','#eff6ff')} alt="Category"
    style={{width:80,height:80,borderRadius:12}} />

═══ SKELETON LOADING (like Instagram/Facebook) ═══
Show skeleton placeholders instead of spinners:

  .skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: skeleton 1.5s ease-in-out infinite;
    border-radius: 8px;
  }
  @keyframes skeleton {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  Use skeleton rectangles matching the content layout (image area, text lines, buttons).

═══ SPRING PHYSICS ANIMATIONS ═══
Use natural spring easing instead of linear/ease:

  --spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --smooth: cubic-bezier(0.4, 0, 0.2, 1);
  --bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);

  Card entrance: transform 0.5s var(--spring)
  Button press: transform 0.15s var(--bounce)
  Page transition: opacity 0.3s var(--smooth), transform 0.4s var(--spring)

  @keyframes springIn {
    0% { opacity: 0; transform: translateY(30px) scale(0.95); }
    60% { transform: translateY(-4px) scale(1.02); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }

═══ DARK MODE SUPPORT ═══
Every app should support dark mode via prefers-color-scheme:

  :root {
    --bg: #ffffff; --surface: #f8f9fa; --text: #1a1a2e;
    --text2: #64748b; --border: #e2e8f0;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0f0f1a; --surface: #1a1a2e; --text: #f1f5f9;
      --text2: #94a3b8; --border: #2d2d44;
    }
  }

  Use CSS variables for ALL colors. Body and cards use var(--bg), var(--surface).
  Dark mode is AUTOMATIC — no toggle needed (but you can add one).

═══ MICRO-INTERACTIONS (like top apps) ═══
  Button press: transform: scale(0.96) on :active with 0.1s transition.
  Add to cart: icon bounces + button flashes green + toast slides up.
  Pull to refresh: custom SVG spinner that rotates.
  Swipe actions: card slides to reveal delete/archive with spring snap-back.
  Tab switch: indicator bar slides smoothly between tabs.
  Like button: heart fills with scale(1.3) then settles to scale(1).
  Success state: checkmark draws itself with stroke-dasharray animation.
  Loading: 3-dot pulse or skeleton shimmer, NEVER a plain spinner.

═══ CARD DESIGN (clean, professional) ═══
  PRODUCT CARD:
    Image area: SVG placeholder via placeholderImg(), full-width, 16px border-radius top.
    Below image: name (16px bold), price (18px bold primary color), rating (SVG star icon + number).
    Add-to-cart button: btn-icon with PLUS SVG icon, min 44px touch target.

  FOOD CARD:
    Horizontal layout: placeholder image (80x80 rounded) on right, info on left.
    Price in bold primary color. Rating: SVG star icon + number.
    Add button: btn-icon with PLUS SVG icon.

  TASK/LIST CARD:
    SVG icon in tinted circle (44x44px) on the side.
    Title + subtitle + category chip.
    Checkbox with scale animation on toggle.

ICON CONTAINERS — use for category/status icons (NOT emojis):
  Wrap SVG icons in a tinted circle: style={{width:48,height:48,borderRadius:12,
    background:'var(--c-primary-light)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--c-primary)'}}
  This gives a clean, professional icon button appearance.

━━━ LANGUAGE & DIRECTION — ENGLISH BY DEFAULT (GLOBAL) ━━━
DEFAULT TO ENGLISH. This is a global product, so unless the user clearly signals another
language, build the entire app in English (LTR, Inter font).
- Choose the app language with this priority:
  1. If the user explicitly asks for a language ("in Spanish", "בעברית", "en français") →
     use that language.
  2. Else if the user wrote their request in a non-English language → use that language.
  3. Otherwise → ENGLISH. (English request, ambiguous, or non-language input all → English.)
- ALL visible UI text (labels, buttons, headings, sample data, empty/error messages)
  MUST be in the chosen language. Never mix languages.
- DIRECTION: for RTL languages (Hebrew, Arabic) add dir="rtl" to the app-shell div and
  use the Heebo/Assistant/Rubik font. For LTR languages (English, Spanish, etc.) do NOT
  add dir="rtl" — leave the default LTR + Inter font. English is LTR.
- Number/price/date formatting should match the locale (e.g. $1,299.00 for en-US).
- The summary you return follows the chosen language too (English summary for an English
  app) — the "hebrewSummary" field just means "short summary in the chosen language".

━━━ CONTENT RULES ━━━
- Match the user's language and direction (see LANGUAGE & DIRECTION above)
- Generate RICH sample data: 5-10 realistic items, not just 3
- All navigation works (useState)
- Use SVG placeholder images via placeholderImg() — NEVER picsum.photos
- Use inline SVG icons — NEVER emojis
- Dark mode via CSS variables + prefers-color-scheme
- Skeleton loading for all async content
- Clean animations on interactions (scale on press, fade on enter)
- Empty state for every list (use .empty-state with SVG icon, not emoji)
- localStorage persistence for user data when relevant

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
   <button onClick={() => setShowModal(true)}>Open</button>
   {showModal && <div className="card">...</div>}

FORBIDDEN: Any button or nav tab without an onClick that changes state.

━━━ REFERENCE EXAMPLE — Food Delivery (Lovable-quality, NO emojis, SVG icons only) ━━━
function App() {
  const { useState, useMemo } = React;
  const [tab, setTab] = useState('home');
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');

  // SVG placeholder image helper
  const placeholderImg = (w, h, label, color='#e5e7eb') =>
    \`data:image/svg+xml,\${encodeURIComponent(\`<svg xmlns="http://www.w3.org/2000/svg" width="\${w}" height="\${h}" viewBox="0 0 \${w} \${h}"><rect fill="\${color}" width="\${w}" height="\${h}"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9ca3af" font-family="system-ui" font-size="14">\${label}</text></svg>\`)}\`;

  // Inline SVG icons — NO emojis anywhere
  const icons = {
    home: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    search: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
    cart: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>,
    user: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    star: <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    clock: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    plus: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>,
    close: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>,
    bell: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
  };

  const allItems = [
    {id:1, name:'Margherita Pizza', desc:'Tomatoes, mozzarella, fresh basil', price:14, rating:4.8, time:'25 min', img: placeholderImg(400,200,'Pizza','#fef2f2')},
    {id:2, name:'Classic Burger', desc:'200g beef patty, cheddar, lettuce, tomato', price:12, rating:4.6, time:'20 min', img: placeholderImg(400,200,'Burger','#fef9c3')},
    {id:3, name:'Caesar Salad', desc:'Romaine lettuce, parmesan, croutons, dressing', price:10, rating:4.7, time:'10 min', img: placeholderImg(400,200,'Salad','#ecfdf5')},
    {id:4, name:'Pasta Marinara', desc:'Spaghetti, marinara sauce, basil', price:13, rating:4.5, time:'20 min', img: placeholderImg(400,200,'Pasta','#fff7ed')},
    {id:5, name:'Salmon Roll', desc:'Fresh salmon, avocado, sesame', price:16, rating:4.9, time:'30 min', img: placeholderImg(400,200,'Sushi','#fef2f2')},
  ];

  const addToCart = (item) => setCart(prev => [...prev, {...item, cartId: Date.now()}]);
  const removeFromCart = (cartId) => setCart(prev => prev.filter(i => i.cartId !== cartId));
  const total = useMemo(() => cart.reduce((s, i) => s + i.price, 0), [cart]);

  const HomeScreen = () => (
    <>
      <div className="card" style={{background:'var(--c-primary)',padding:24}}>
        <p className="label" style={{color:'rgba(255,255,255,0.8)',marginBottom:4}}>Special offer</p>
        <h2 className="display" style={{color:'white',margin:'4px 0',fontSize:28}}>20% off</h2>
        <p className="body" style={{color:'rgba(255,255,255,0.85)'}}>On your first order</p>
        <button className="btn-secondary" style={{width:'auto',marginTop:14,padding:'10px 24px',background:'white',color:'var(--c-primary)'}} onClick={()=>setTab('search')}>View menu</button>
      </div>
      <p className="section-title">Popular</p>
      {allItems.slice(0,3).map(item=>(
        <div key={item.id} className="card" style={{padding:0,overflow:'hidden'}}>
          <img src={item.img} alt={item.name} style={{width:'100%',height:140,objectFit:'cover'}} />
          <div style={{padding:14}}>
            <div className="flex justify-between items-start">
              <div>
                <p className="subtitle">{item.name}</p>
                <p className="caption" style={{marginTop:2,color:'#6b7280'}}>{item.desc}</p>
              </div>
              <span className="subtitle" style={{color:'var(--c-primary)',whiteSpace:'nowrap'}}>{'$'}{item.price}</span>
            </div>
            <div className="flex justify-between items-center" style={{marginTop:10}}>
              <div className="flex items-center gap-2" style={{color:'#6b7280'}}>
                <span className="flex items-center gap-1">{icons.star} {item.rating}</span>
                <span className="flex items-center gap-1" style={{marginRight:8}}>{icons.clock} {item.time}</span>
              </div>
              <button className="btn-icon" style={{width:36,height:36,background:'var(--c-primary)',color:'white',borderRadius:10}} onClick={()=>addToCart(item)}>{icons.plus}</button>
            </div>
          </div>
        </div>
      ))}
    </>
  );

  const SearchScreen = () => {
    const filtered = allItems.filter(i => i.name.includes(search));
    return (
      <>
        <div style={{position:'relative'}}>
          <input className="input-field" placeholder="Search dishes..." value={search} onChange={e=>setSearch(e.target.value)} style={{paddingLeft:44}} />
          <span style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'#9ca3af'}}>{icons.search}</span>
        </div>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon" style={{opacity:0.4}}>{icons.search}</div>
            <p className="empty-state-title">No results</p>
            <p className="empty-state-body">Try a different search term</p>
          </div>
        ) : (
          <>
            <p className="section-title">{filtered.length} results</p>
            {filtered.map(item=>(
              <div key={item.id} className="list-item">
                <img src={item.img} alt={item.name} style={{width:56,height:56,borderRadius:12,objectFit:'cover'}} />
                <div style={{flex:1}}>
                  <p className="subtitle" style={{fontSize:14}}>{item.name}</p>
                  <p className="caption" style={{color:'#6b7280'}}>{item.desc}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="subtitle" style={{color:'var(--c-primary)',fontSize:14}}>{'$'}{item.price}</span>
                  <button className="btn-icon" style={{width:32,height:32,background:'var(--c-primary-light)',color:'var(--c-primary)',borderRadius:8}} onClick={()=>addToCart(item)}>{icons.plus}</button>
                </div>
              </div>
            ))}
          </>
        )}
      </>
    );
  };

  const CartScreen = () => (
    <>
      <p className="section-title">Your cart ({cart.length})</p>
      {cart.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon" style={{opacity:0.3}}>{icons.cart}</div>
          <p className="empty-state-title">Cart is empty</p>
          <p className="empty-state-body">Add items from the menu</p>
          <button className="btn-primary" style={{width:'auto',padding:'12px 24px',marginTop:4}} onClick={()=>setTab('search')}>View menu</button>
        </div>
      )}
      {cart.map(item=>(
        <div key={item.cartId} className="list-item">
          <img src={item.img} alt={item.name} style={{width:48,height:48,borderRadius:10,objectFit:'cover'}} />
          <div style={{flex:1}}>
            <p className="subtitle" style={{fontSize:14}}>{item.name}</p>
            <span className="caption" style={{color:'var(--c-primary)'}}>{'$'}{item.price}</span>
          </div>
          <button className="btn-icon" style={{width:32,height:32,color:'#ef4444'}} onClick={()=>removeFromCart(item.cartId)}>{icons.close}</button>
        </div>
      ))}
      {cart.length > 0 && (
        <div className="card" style={{marginTop:8}}>
          <div className="flex justify-between items-center" style={{marginBottom:14}}>
            <span className="subtitle">Total</span>
            <span className="title" style={{color:'var(--c-primary)'}}>{'$'}{total}</span>
          </div>
          <button className="btn-primary" onClick={()=>{setCart([]);alert('Order placed successfully!');}}>Checkout</button>
        </div>
      )}
    </>
  );

  const ProfileScreen = () => (
    <div className="card">
      <div className="flex items-center gap-3" style={{marginBottom:20}}>
        <div className="avatar" style={{width:56,height:56,fontSize:20}}>J</div>
        <div>
          <p className="subtitle">John Doe</p>
          <p className="caption" style={{color:'#6b7280'}}>john@email.com</p>
        </div>
      </div>
      {[{label:'My Orders',icon:icons.cart},{label:'Settings',icon:icons.bell}].map((row,i)=>(
        <div key={i} className="list-item" style={{marginBottom:8,cursor:'pointer'}}>
          <span style={{color:'var(--c-primary)'}}>{row.icon}</span>
          <span className="body" style={{flex:1}}>{row.label}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </div>
      ))}
    </div>
  );

  const renderContent = () => {
    if (tab === 'home')    return <HomeScreen />;
    if (tab === 'search')  return <SearchScreen />;
    if (tab === 'cart')    return <CartScreen />;
    if (tab === 'profile') return <ProfileScreen />;
  };

  const navItems = [
    {id:'home', icon:icons.home, label:'Home'},
    {id:'search', icon:icons.search, label:'Search'},
    {id:'cart', icon:icons.cart, label:'Cart'},
    {id:'profile', icon:icons.user, label:'Profile'},
  ];

  return (
    <>
      <style>{\`
        :root {
          --c-from:#16a34a; --c-to:#16a34a;
          --c-primary:#16a34a; --c-primary-light:rgba(22,163,74,0.08);
          --c-bg:#ffffff;
        }
      \`}</style>
      <div className="app-shell">  {/* add dir="rtl" ONLY for Hebrew/Arabic — omit for English/LTR */}
        <div className="app-header">
          <div>
            <p className="caption" style={{color:'#6b7280'}}>Hello</p>
            <h1 className="subtitle">John Doe</h1>
          </div>
          <div className="flex gap-2 items-center">
            <button className="btn-icon" style={{position:'relative'}} onClick={()=>setTab('cart')}>
              {icons.cart}
              {cart.length>0 && <span className="badge" style={{position:'absolute',top:-4,right:-4,minWidth:18,height:18,fontSize:10,background:'var(--c-primary)',color:'white'}}>{cart.length}</span>}
            </button>
          </div>
        </div>
        <div className="app-content">
          {renderContent()}
        </div>
        <div className="app-nav">
          {navItems.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} className={'nav-tab'+(tab===t.id?' active':'')}>
              {t.icon}{t.label}
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
{"appName":"App name","description":"One sentence","colorScheme":{"primary":"#hex","background":"#hex","text":"#hex","accent":"#hex"},"features":["feature1","feature2","feature3"],"hebrewSummary":"Short description"}

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
{"appName":"App name","description":"what changed","colorScheme":{"primary":"#hex","background":"#hex","text":"#hex","accent":"#hex"},"features":["f1","f2"],"hebrewSummary":"Short change description"}

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
  theme?: string;
  /** Skip the post-generation quality gate + auto-repair pass (e.g. for speed-sensitive paths). */
  skipQualityGate?: boolean;
  /** Run the Ideate phase first: build a blueprint, generate against it, verify coverage. */
  ideate?: boolean;
  /** Pre-built blueprint to generate against (skips the internal Ideate call). */
  blueprint?: Blueprint;
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
  demoMode?: boolean;
  demoReason?: string;
  /** Post-generation quality gate result (blueprint + dead-UI / unreachable-screen findings). */
  quality?: {
    ok: boolean;
    score: number;
    issues: { kind: string; severity: string; message: string }[];
    screens: number;
    reachable: number;
    buttons: string;
    repaired: boolean;
  };
  /** The Ideate blueprint this app was generated against (when ideate mode ran). */
  blueprint?: Blueprint;
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
/**
 * Heuristic: does this look like a COMPLETE App component, or did the model stop
 * early and leave us truncated JSX? A truncated app has badly unbalanced braces /
 * parens (dozens of unclosed `{` from open JSX) and doesn't end on a terminal
 * token. This is intentionally lenient (slack of a few) because braces inside
 * strings/template-literals throw the count off slightly — we only want to catch
 * GROSS truncation, not nitpick well-formed code.
 */
export function isLikelyComplete(code: string): boolean {
  if (!code || code.length < 200) return false;
  if (!/function\s+App\s*\(|App\s*=\s*\(|const\s+App\s*=/.test(code)) return false;
  const count = (re: RegExp) => (code.match(re) || []).length;
  const braceGap = count(/\{/g) - count(/\}/g);
  const parenGap = count(/\(/g) - count(/\)/g);
  // A complete component nets out near zero. Truncated JSX leaves many opens.
  if (braceGap > 3 || braceGap < -3) return false;
  if (parenGap > 3 || parenGap < -3) return false;
  // Must end on a terminal-looking token, not mid-tag (e.g. `<div className="...">`)
  const tail = code.trimEnd().slice(-3);
  if (!/[)};]/.test(tail.slice(-1))) return false;
  return true;
}

export function parseGroqResponse(raw: string): GeneratedWebApp {
  // ── Strategy 1: delimiter format (===CODE=== … ===END===) ──────────────
  // Resilient to a MISSING ===END=== marker: long generations frequently omit
  // the closing marker (or get cut at the token limit). When that happens we
  // must NOT discard a perfectly good app — we take everything after ===CODE===
  // to the end of the response as the code. (This was the #1 cause of users
  // seeing a "Code generation error" screen despite the model succeeding.)
  const codeStart = raw.indexOf('===CODE===');
  if (codeStart !== -1) {
    const codeEnd = raw.indexOf('===END===', codeStart);
    let code = (codeEnd > codeStart ? raw.slice(codeStart + 10, codeEnd) : raw.slice(codeStart + 10)).trim();
    // Strip any stray markdown code fences the model may have wrapped the code in.
    code = code.replace(/^```(?:jsx?|tsx?|javascript)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
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

    if (codeEnd <= codeStart) {
      console.warn('[AI/web] Delimiter: ===END=== marker missing — recovered code to end-of-response (', code.length, 'chars)');
    }
    console.log('[AI/web] Parsed via delimiter format — appName:', meta.appName, '| code length:', code.length);
    return {
      appName:      decodeEscapedUnicode(meta.appName      ?? 'Generated App'),
      description:  decodeEscapedUnicode(meta.description  ?? ''),
      hebrewSummary:decodeEscapedUnicode(meta.hebrewSummary ?? 'App created'),
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
      <h2 style={{margin:0,color:'#dc2626',fontSize:18}}>Code generation error</h2>
      <p style={{margin:0,color:'#6b7280',fontSize:14,textAlign:'center'}}>${reason}</p>
      <p style={{margin:0,color:'#9ca3af',fontSize:12}}>Try again</p>
    </div>
  );
}`;

// Premium design bar appended to every FRESH generation (not edits). Pushes the
// model toward calm, high-end, Apple/Linear/Stripe-grade UI instead of busy,
// over-coloured "toy" output.
const PREMIUM_DESIGN_RULES = `

═══════════════════════════════════════════════════════════
PREMIUM VISUAL BAR — the app must look like a $100M product
═══════════════════════════════════════════════════════════
• RESTRAINT: one primary accent colour + neutrals. Never more than two hues.
  No rainbow gradients, no emoji as primary UI, no clashing brights.
• TYPOGRAPHY drives hierarchy: one large semibold heading (24–32px, tight
  tracking), readable body (14–15px), muted captions (#6B7280). Use weight and
  size for emphasis — not colour.
• WHITESPACE is a feature: generous padding (16–24px), real breathing room
  between sections. When unsure, remove an element and add space.
• DEPTH is subtle: soft shadows (0 1px 8px rgba(0,0,0,.05)), 1px hairline
  borders (#ECECEF), 16–20px corner radii. No neon glows or heavy drop shadows.
• PALETTE: off-white backgrounds (#FAFAFA / #FBFBFD), near-black text
  (#111827), grey for secondary. The accent appears ONLY on the one primary
  action per screen.
• CONTENT feels real: plausible names, prices, dates, avatars — never "Lorem
  ipsum". Prefer clean line icons over emoji.
• MOTION is restrained: press-scale on buttons, gentle hover lifts on cards.
  Nothing bouncy or distracting.
• Model the feel of Apple, Linear, Stripe, Revolut, Notion — calm, confident,
  precise, consistent spacing on an 8pt grid.
`;

// ── Public API ─────────────────────────────────────────────────────────────

export async function generateWebApp(
  userPrompt: string,
  conversationHistory: ConversationMessage[],
  options?: GenerateOptions
): Promise<GeneratedWebApp> {
  let systemPrompt = options?.editMode && options.existingCode
    ? buildEditSystemPrompt(options.existingCode)
    : WEB_SYSTEM_PROMPT + PREMIUM_DESIGN_RULES;
  // Apply a chosen design theme only on fresh generation (not edits).
  if (!options?.editMode && options?.theme) systemPrompt += '\n' + getThemePrompt(options.theme);

  // Ideate phase: on a fresh generation, build (or accept) a blueprint and feed
  // it in as a contract. The generated code must then implement exactly those
  // screens with that navigation graph — the same two-phase approach Stitch uses
  // to guarantee every screen is reachable.
  let blueprint: Blueprint | null = options?.blueprint ?? null;
  if (!options?.editMode && options?.ideate && !blueprint) {
    blueprint = await buildBlueprint(userPrompt, conversationHistory);
  }
  if (!options?.editMode && blueprint) {
    systemPrompt += '\n' + blueprintToPromptFragment(blueprint);
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userPrompt },
  ];

  console.log('[AI/web] Mode:', options?.editMode ? 'EDIT' : 'GENERATE', '| theme:', options?.theme || 'none',
    '| blueprint:', blueprint ? `${blueprint.screens.length} screens` : 'none', '| prompt:', userPrompt.slice(0, 80));

  // In demo mode + edit mode, return existing code as-is (can't modify without LLM)
  const allPlaceholder = allKeysPlaceholder();
  if (allPlaceholder && options?.editMode && options.existingCode) {
    console.log('[AI/web] \u{1F3AD} Demo mode — edit request, returning existing code');
    const raw = getDemoEditResponse(options.existingCode);
    return { ...parseGroqResponse(raw), demoMode: true, demoReason: 'No AI provider keys configured' };
  }

  let { text: raw, demoMode, demoReason } = await callWithFallback(messages);
  console.log('[AI/web] Raw response length:', raw.length, '| demoMode:', demoMode);
  console.log('[AI/web] Raw (first 500):\n', raw.slice(0, 500));

  try {
    let parsed = parseGroqResponse(raw);

    // Reliability: the model occasionally stops early and hands back truncated,
    // syntactically-broken JSX (unbalanced braces, ends mid-tag). Rather than
    // ship a broken preview, retry ONCE — a single retry recovers the large
    // majority of these. Never retry in demo mode (no real provider) or for
    // edits (we'd risk discarding a valid partial edit).
    if (!demoMode && !options?.editMode && !isLikelyComplete(parsed.files['App.jsx'])) {
      console.warn('[AI/web] Generated code looks truncated/incomplete — retrying once');
      const retry = await callWithFallback(messages);
      const reparsed = parseGroqResponse(retry.text);
      const better = isLikelyComplete(reparsed.files['App.jsx']) ||
        reparsed.files['App.jsx'].length > parsed.files['App.jsx'].length;
      if (better) {
        console.log('[AI/web] Retry produced better code (', reparsed.files['App.jsx'].length, 'chars,',
          isLikelyComplete(reparsed.files['App.jsx']) ? 'complete' : 'still partial', ')');
        parsed = reparsed; demoMode = retry.demoMode; demoReason = retry.demoReason;
      } else {
        console.warn('[AI/web] Retry not better — keeping original');
      }
    }

    // Quality gate: reconstruct the app's blueprint (screens + nav graph +
    // controls) from the generated code and check the contract Stitch enforces
    // by design — every screen reachable, every button wired. When the gate
    // finds dead UI on a FRESH generation, attempt ONE targeted repair pass.
    // We never gate demo mode (no real provider) and we keep the original if the
    // repair doesn't actually improve the score.
    if (!demoMode && !options?.skipQualityGate) {
      const expectedScreens = blueprint?.screens.map((s) => s.id);
      let report = analyzeQuality(parsed.files['App.jsx'], expectedScreens);
      let repaired = false;
      console.log('[AI/web] Quality gate —', {
        score: report.score,
        ok: report.ok,
        screens: report.blueprint.definedScreens.length,
        reachable: report.blueprint.reachableScreens.length,
        buttons: `${report.blueprint.wiredButtonCount}/${report.blueprint.buttonCount} wired`,
        issues: report.issues.length,
      });
      if (report.issues.length) {
        for (const it of report.issues.slice(0, 6)) console.warn(`[AI/web]   • [${it.kind}] ${it.message}`);
      }

      if (!report.ok) {
        const repair = buildRepairPrompt(report);
        if (repair) {
          console.warn('[AI/web] Quality gate failed — attempting one repair pass');
          const repairMessages: ChatMessage[] = [
            { role: 'system', content: buildEditSystemPrompt(parsed.files['App.jsx']) },
            { role: 'user', content: repair },
          ];
          try {
            const fixed = await callWithFallback(repairMessages);
            const reparsed = parseGroqResponse(fixed.text);
            if (isLikelyComplete(reparsed.files['App.jsx'])) {
              const after = analyzeQuality(reparsed.files['App.jsx'], expectedScreens);
              console.log('[AI/web] Post-repair quality —', { score: after.score, ok: after.ok, issues: after.issues.length });
              if (after.score > report.score) {
                console.log('[AI/web] Repair improved quality — keeping repaired version');
                parsed = reparsed; report = after; repaired = true;
              } else {
                console.warn('[AI/web] Repair did not improve score — keeping original');
              }
            } else {
              console.warn('[AI/web] Repair produced incomplete code — keeping original');
            }
          } catch (repairErr) {
            console.warn('[AI/web] Repair pass errored — keeping original:', (repairErr as Error).message);
          }
        }
      }

      return {
        ...parsed,
        demoMode,
        demoReason,
        blueprint: blueprint ?? undefined,
        quality: {
          ok: report.ok,
          score: report.score,
          issues: report.issues.map((i) => ({ kind: i.kind, severity: i.severity, message: i.message })),
          screens: report.blueprint.definedScreens.length,
          reachable: report.blueprint.reachableScreens.length,
          buttons: `${report.blueprint.wiredButtonCount}/${report.blueprint.buttonCount}`,
          repaired,
        },
      };
    }

    return { ...parsed, demoMode, demoReason, blueprint: blueprint ?? undefined };
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
      hebrewSummary: `Parse error: ${msg.slice(0, 80)}`,
      demoMode,
      demoReason,
    };
  }
}

export async function* streamGenerateWebApp(
  userPrompt: string,
  conversationHistory: ConversationMessage[],
  options?: GenerateOptions
): AsyncGenerator<string> {
  let systemPrompt = options?.editMode && options.existingCode
    ? buildEditSystemPrompt(options.existingCode)
    : WEB_SYSTEM_PROMPT + PREMIUM_DESIGN_RULES;
  if (!options?.editMode && options?.theme) systemPrompt += '\n' + getThemePrompt(options.theme);

  const msgs = [
    { role: 'system' as const, content: systemPrompt },
    ...conversationHistory,
    { role: 'user' as const, content: userPrompt },
  ];

  // Try Groq streaming first; fall back to callWithFallback on ANY error
  // (not just 429) so that auth errors, server errors, and network failures
  // all gracefully degrade instead of killing the stream.
  try {
    const stream = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 16000,
      stream: true,
      messages: msgs,
    });
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? '';
      if (text) yield text;
    }
    return;
  } catch (err) {
    const status = (err as any)?.status ?? 'n/a';
    console.warn(`[AI/web] Groq stream failed (status=${status}) — falling back to non-streaming…`);
  }

  // Fallback: non-streaming via the full provider chain, emit as one chunk
  const { text } = await callWithFallback(msgs);
  yield text;
}

// ── Chat-Mode planning (Lovable-style clarifying questions) ──────────────────
//
// Before building, decide whether the request is already specific enough to
// produce an excellent app, or whether 1-3 quick tap-able questions would
// materially improve the result. This is the mechanism that makes Lovable feel
// "smart" — it asks before it builds.

export interface PlanQuestion {
  id: string;
  q: string;
  options: string[];
}

export interface PlanResult {
  ready: boolean;
  intro?: string;
  questions?: PlanQuestion[];
}

function isHebrewPrompt(text: string): boolean {
  return /[֐-׿]/.test(text);
}

function getPlanSystemPrompt(hebrew: boolean): string {
  const lang = hebrew ? 'Hebrew' : 'the same language the user wrote in';
  const example = hebrew
    ? '{"ready":false,"intro":"<one short Hebrew sentence>","questions":[{"id":"<slug>","q":"<short Hebrew question>","options":["<opt1>","<opt2>","<opt3>"]}]}'
    : '{"ready":false,"intro":"<one short sentence in user\'s language>","questions":[{"id":"<slug>","q":"<short question in user\'s language>","options":["<opt1>","<opt2>","<opt3>"]}]}';
  return `
You are WebForge AI's planning brain — the equivalent of Lovable's Chat Mode.
Before building, decide if you already have enough to build an EXCELLENT mobile
app, or if 1-3 quick clarifying questions would materially improve the result.

Given the user's app request, respond with STRICT JSON ONLY — no markdown, no prose.

If the request is already detailed/specific enough to build a great app:
{"ready":true}

If a few quick choices would help, ask 1-3 questions, each with 2-4 short
tap-able options:
${example}

RULES:
- ALL questions and options MUST be in ${lang}.
- Max 3 questions. Each option max 4 words.
- Ask ONLY about things that change design/feature direction: visual style,
  target audience, the key feature, color mood, or the primary screen.
- NEVER ask about tech stack, frameworks, libraries, or implementation details.
- If the user already specified style + audience + features (e.g. a long
  template prompt), return {"ready":true}.
- Keep it light — these are one-tap choices, not an interview.
- Output the JSON on a single line. Nothing before or after it.
`;
}

export function parsePlan(raw: string): PlanResult {
  const s = raw.indexOf('{');
  const e = raw.lastIndexOf('}');
  if (s === -1 || e <= s) return { ready: true };
  try {
    const obj = JSON.parse(raw.slice(s, e + 1)) as any;
    if (obj.ready === true) return { ready: true };
    const questions: PlanQuestion[] = Array.isArray(obj.questions)
      ? obj.questions
          .filter((q: any) => q && q.q && Array.isArray(q.options) && q.options.length)
          .slice(0, 3)
          .map((q: any, i: number) => ({
            id: String(q.id || `q${i}`),
            q: String(q.q),
            options: q.options.slice(0, 4).map((o: any) => String(o)),
          }))
      : [];
    if (!questions.length) return { ready: true };
    return {
      ready: false,
      intro: obj.intro ? String(obj.intro) : 'A few quick questions before we build:',
      questions,
    };
  } catch {
    return { ready: true }; // fail open — never block building on a parse error
  }
}

/** Heuristic planner used in demo mode (all API keys are placeholders). */
export function getDemoPlan(userPrompt: string): PlanResult {
  const p = userPrompt.trim();
  if (p.length > 130) return { ready: true };

  const hebrew = isHebrewPrompt(p);
  const lower = p.toLowerCase();
  const cat =
    /מניות|מניה|בורסה|stock|portfolio|השקעות|invest|trading|מסחר|תיק מניות/.test(lower) ? 'stocks' :
    /חנות|store|shop|מוצר|אופנה|בגד/.test(lower) ? 'store' :
    /מסעדה|food|אוכל|תפריט|restaurant|קפה/.test(lower) ? 'food' :
    /כושר|אימון|fitness|sport|ספורט/.test(lower) ? 'fitness' :
    /משימ|task|todo|רשימ/.test(lower) ? 'tasks' :
    /תקציב|finance|כסף|הוצא|הכנס/.test(lower) ? 'finance' :
    /מזג|weather|טמפרטור/.test(lower) ? 'weather' : 'general';

  const styleQ: PlanQuestion = hebrew
    ? { id: 'style', q: 'איזה סגנון עיצוב מתאים לך?', options: ['מודרני ונקי', 'צבעוני ונועז', 'מינימליסטי', 'יוקרתי כהה'] }
    : { id: 'style', q: 'What design style fits best?', options: ['Modern & clean', 'Bold & colorful', 'Minimalist', 'Dark luxury'] };

  const audienceQ: PlanQuestion = hebrew
    ? {
        id: 'audience', q: 'למי האפליקציה מיועדת?',
        options: cat === 'store' || cat === 'food' ? ['לקוחות פרטיים', 'עסקים', 'הכל'] : ['שימוש אישי', 'צוות/עסק', 'קהל רחב'],
      }
    : {
        id: 'audience', q: 'Who is the app for?',
        options: cat === 'store' || cat === 'food' ? ['Consumers', 'Businesses', 'Everyone'] : ['Personal use', 'Team / business', 'Wide audience'],
      };

  const featureByCat: Record<string, PlanQuestion> = hebrew ? {
    stocks:  { id: 'feature', q: 'גרפים בזמן אמת?',     options: ['כן, גרפים חיים', 'מספרים בלבד', 'שניהם'] },
    store:   { id: 'feature', q: 'מה הכי חשוב בחנות?',  options: ['סל קניות', 'מבצעים', 'חיפוש מוצרים'] },
    food:    { id: 'feature', q: 'מה הכי חשוב בתפריט?',  options: ['הזמנה ומשלוח', 'דירוגים', 'קטגוריות'] },
    fitness: { id: 'feature', q: 'מה הכי חשוב באימון?',  options: ['טיימר', 'מעקב התקדמות', 'תוכניות'] },
    tasks:   { id: 'feature', q: 'מה הכי חשוב בניהול?',  options: ['קטגוריות', 'לוח שנה', 'סטטיסטיקות'] },
    finance: { id: 'feature', q: 'מה הכי חשוב בתקציב?',  options: ['תרשימים', 'יעדי חיסכון', 'התראות'] },
    weather: { id: 'feature', q: 'מה להציג קודם?',       options: ['תחזית שבועית', 'מפה', 'התראות'] },
    general: { id: 'feature', q: 'מה הכי חשוב שיהיה?',    options: ['ניווט נוח', 'עיצוב מרשים', 'מהירות'] },
  } : {
    stocks:  { id: 'feature', q: 'Real-time charts?',           options: ['Yes, live charts', 'Numbers only', 'Both'] },
    store:   { id: 'feature', q: 'Most important store feature?', options: ['Shopping cart', 'Deals & sales', 'Product search'] },
    food:    { id: 'feature', q: 'Key menu feature?',            options: ['Order & delivery', 'Ratings', 'Categories'] },
    fitness: { id: 'feature', q: 'Most important for workouts?', options: ['Timer', 'Progress tracking', 'Programs'] },
    tasks:   { id: 'feature', q: 'Key task management feature?', options: ['Categories', 'Calendar', 'Statistics'] },
    finance: { id: 'feature', q: 'Most important for budget?',   options: ['Charts', 'Savings goals', 'Alerts'] },
    weather: { id: 'feature', q: 'What to show first?',          options: ['Weekly forecast', 'Map', 'Alerts'] },
    general: { id: 'feature', q: 'What matters most?',           options: ['Easy navigation', 'Great design', 'Speed'] },
  };

  return {
    ready: false,
    intro: hebrew
      ? 'כדי לבנות לך בדיוק את מה שדמיינת — כמה בחירות מהירות:'
      : 'A few quick choices to build exactly what you imagined:',
    questions: [styleQ, audienceQ, featureByCat[cat]],
  };
}

export async function planWebApp(
  userPrompt: string,
  conversationHistory: ConversationMessage[]
): Promise<PlanResult> {
  const allPlaceholder = allKeysPlaceholder();
  if (allPlaceholder) return getDemoPlan(userPrompt);

  const messages: ChatMessage[] = [
    { role: 'system', content: getPlanSystemPrompt(isHebrewPrompt(userPrompt)) },
    ...conversationHistory,
    { role: 'user', content: userPrompt },
  ];

  try {
    const { text, demoMode } = await callWithFallback(messages);
    if (demoMode) return { ready: true };
    return parsePlan(text);
  } catch (err) {
    console.error('[AI/web] planWebApp failed — building directly:', (err as Error).message);
    return { ready: true }; // fail open — never block building
  }
}

// ── Ideate / Blueprint phase (Stitch's two-phase model) ──────────────────────
//
// Stitch generates in two phases: it first produces a structured *blueprint*
// (the screens, the navigation graph between them, the key components on each)
// and THEN renders pixels that must satisfy that blueprint. We were generating
// in one shot, which is why dead UI / unreachable screens leaked through. This
// builds the blueprint explicitly so it can (a) be shown to the user as a plan
// and (b) act as a contract the generated code is checked against.

export interface BlueprintScreen {
  id: string;        // stable nav id, e.g. "home" (matches setScreen('home'))
  name: string;      // human label, e.g. "Home"
  purpose: string;   // one sentence — what this screen is for
  components: string[]; // key UI pieces on the screen
}

export interface BlueprintEdge {
  from: string;      // screen id
  to: string;        // screen id
  trigger: string;   // what causes the navigation, e.g. "Tap a product card"
}

export interface Blueprint {
  appName: string;
  summary: string;
  screens: BlueprintScreen[];
  navigation: BlueprintEdge[];
  primaryFlow: string[]; // ordered screen ids of the main user journey
}

function getBlueprintSystemPrompt(hebrew: boolean): string {
  const lang = hebrew ? 'Hebrew' : "the user's language";
  return `
You are WebForge AI's architect — the Ideate phase. BEFORE any code is written,
design the app's BLUEPRINT: its screens, the navigation graph between them, and
the key components on each screen. This blueprint is a CONTRACT the generated
code must satisfy — every screen reachable, every nav edge real.

Given the user's request, respond with STRICT JSON ONLY (one object, no markdown,
no prose before or after):

{
  "appName": "<short app name>",
  "summary": "<one sentence describing the app, in ${lang}>",
  "screens": [
    {"id":"home","name":"<label in ${lang}>","purpose":"<one sentence in ${lang}>","components":["<comp>","<comp>"]}
  ],
  "navigation": [
    {"from":"home","to":"detail","trigger":"<what the user taps, in ${lang}>"}
  ],
  "primaryFlow": ["home","detail","..."]
}

RULES:
- 3-5 screens. Each "id" is a lowercase slug with no spaces (home, search, cart, profile, detail).
- EVERY screen except the landing screen MUST appear as a "to" in navigation — no orphans.
- The landing screen (first in screens[]) is where the app opens.
- "primaryFlow" is the main journey as an ordered list of screen ids.
- Names, purposes, and triggers in ${lang}. Ids stay English slugs.
- Keep components concrete (e.g. "search bar", "product grid", "cart summary").
- Output the JSON on as few lines as possible. Nothing outside the JSON.
`;
}

export function parseBlueprint(raw: string): Blueprint | null {
  const s = raw.indexOf('{');
  const e = raw.lastIndexOf('}');
  if (s === -1 || e <= s) return null;
  try {
    const obj = JSON.parse(raw.slice(s, e + 1)) as any;
    const screens: BlueprintScreen[] = Array.isArray(obj.screens)
      ? obj.screens
          .filter((x: any) => x && x.id)
          .map((x: any) => ({
            id: String(x.id).toLowerCase().replace(/[^a-z0-9]/g, ''),
            name: String(x.name || x.id),
            purpose: String(x.purpose || ''),
            components: Array.isArray(x.components) ? x.components.map((c: any) => String(c)).slice(0, 8) : [],
          }))
          .slice(0, 6)
      : [];
    if (screens.length < 2) return null; // not a real multi-screen blueprint
    const ids = new Set(screens.map((s) => s.id));
    const navigation: BlueprintEdge[] = Array.isArray(obj.navigation)
      ? obj.navigation
          .filter((x: any) => x && x.from && x.to)
          .map((x: any) => ({
            from: String(x.from).toLowerCase().replace(/[^a-z0-9]/g, ''),
            to: String(x.to).toLowerCase().replace(/[^a-z0-9]/g, ''),
            trigger: String(x.trigger || 'Tap'),
          }))
          .filter((x: BlueprintEdge) => ids.has(x.from) && ids.has(x.to))
      : [];
    const primaryFlow: string[] = Array.isArray(obj.primaryFlow)
      ? obj.primaryFlow.map((x: any) => String(x).toLowerCase().replace(/[^a-z0-9]/g, '')).filter((x: string) => ids.has(x))
      : [];
    return {
      appName: String(obj.appName || 'App'),
      summary: String(obj.summary || ''),
      screens,
      navigation,
      primaryFlow: primaryFlow.length ? primaryFlow : screens.map((s) => s.id),
    };
  } catch {
    return null;
  }
}

/**
 * Produce the app blueprint (Ideate phase). Returns null on failure or in demo
 * mode so callers fall through to direct generation — the blueprint is an
 * enhancement, never a hard gate.
 */
export async function buildBlueprint(
  userPrompt: string,
  conversationHistory: ConversationMessage[]
): Promise<Blueprint | null> {
  if (allKeysPlaceholder()) return null;
  const messages: ChatMessage[] = [
    { role: 'system', content: getBlueprintSystemPrompt(isHebrewPrompt(userPrompt)) },
    ...conversationHistory,
    { role: 'user', content: userPrompt },
  ];
  try {
    const { text, demoMode } = await callWithFallback(messages);
    if (demoMode) return null;
    const bp = parseBlueprint(text);
    if (bp) console.log('[AI/web] Blueprint —', bp.screens.length, 'screens:', bp.screens.map((s) => s.id).join(', '));
    return bp;
  } catch (err) {
    console.warn('[AI/web] buildBlueprint failed — generating without blueprint:', (err as Error).message);
    return null;
  }
}

/** Render a blueprint into a prompt fragment that constrains generation to it. */
export function blueprintToPromptFragment(bp: Blueprint): string {
  const screenLines = bp.screens
    .map((s, i) => `  ${i + 1}. id="${s.id}" (${s.name})${i === 0 ? ' [LANDING — app opens here]' : ''} — ${s.purpose}${s.components.length ? `  · components: ${s.components.join(', ')}` : ''}`)
    .join('\n');
  const navLines = bp.navigation.map((e) => `  ${e.from} → ${e.to}  (${e.trigger})`).join('\n');
  return `
BLUEPRINT CONTRACT — the app you build MUST implement EXACTLY these screens and this
navigation graph. Use a single navigation state (e.g. const [screen,setScreen]=useState('${bp.screens[0]?.id}'))
and render each screen by its id. Every screen below must be reachable via a working control.

SCREENS:
${screenLines}

NAVIGATION (every edge must be a real onClick that calls the nav setter):
${navLines || '  (single primary flow — wire the bottom nav / back buttons)'}

Do NOT invent extra top-level screens beyond these. Do NOT leave any screen unreachable.
`;
}
