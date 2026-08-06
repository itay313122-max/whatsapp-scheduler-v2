// ── Free AI brain: Google Gemini ──────────────────────────────────────────────
// A no-cost alternative to Claude, using Google's Gemini API (generous free tier).
// Reuses the same neutral tools, confirmation logic and system prompt as the
// Claude provider (from assistant.js), and adds Google Search grounding so the
// assistant can look things up on the internet for free.
//
// Get a free key at https://aistudio.google.com/apikey and set GEMINI_API_KEY.

import { runTool, needsConfirmation, actionSummary, buildSystem, CUSTOM_TOOLS } from './assistant.js';

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MAX_ITERATIONS = 8;

function requireKey() {
  if (!process.env.GEMINI_API_KEY) {
    const err = new Error('GEMINI_API_KEY is not configured on the server.');
    err.code = 'NO_API_KEY';
    throw err;
  }
}

// ── Schema conversion: JSON Schema (lowercase) → Gemini Schema (uppercase) ─────
const TYPE_MAP = { string: 'STRING', number: 'NUMBER', integer: 'INTEGER', boolean: 'BOOLEAN', object: 'OBJECT', array: 'ARRAY' };
function toGeminiSchema(s) {
  if (!s) return undefined;
  const out = { type: TYPE_MAP[s.type] || 'STRING' };
  if (s.description) out.description = s.description;
  if (s.enum) out.enum = s.enum;
  if (s.type === 'object') {
    out.properties = {};
    for (const [k, v] of Object.entries(s.properties || {})) out.properties[k] = toGeminiSchema(v);
    if (Array.isArray(s.required) && s.required.length) out.required = s.required;
  }
  if (s.type === 'array' && s.items) out.items = toGeminiSchema(s.items);
  return out;
}
function functionDeclarations() {
  return CUSTOM_TOOLS.map((t) => ({ name: t.name, description: t.description, parameters: toGeminiSchema(t.input_schema) }));
}

// ── History conversion: client history → Gemini `contents` ────────────────────
// Handles both fresh {role, content:string} turns and already-Gemini {role, parts} turns.
function toContents(history) {
  const contents = [];
  for (const m of history) {
    if (Array.isArray(m.parts)) {
      contents.push({ role: m.role === 'assistant' ? 'model' : m.role, parts: m.parts });
    } else {
      const role = m.role === 'assistant' || m.role === 'model' ? 'model' : 'user';
      contents.push({ role, parts: [{ text: String(m.content ?? '') }] });
    }
  }
  return contents;
}

// Stable id for a function call, so client decisions map back on confirm.
function callId(name, partIndex) {
  return `${name}#${partIndex}`;
}
function functionCallsIn(content) {
  const parts = content?.parts || [];
  return parts
    .map((p, idx) => (p.functionCall ? { fc: p.functionCall, id: callId(p.functionCall.name, idx) } : null))
    .filter(Boolean);
}

// ── HTTP to Gemini, with a graceful fallback if search+tools can't combine ────
async function postGemini(body) {
  const url = `${API_BASE}/${encodeURIComponent(MODEL)}:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) return { ok: false, status: r.status, errText: await r.text() };
  return { ok: true, json: await r.json() };
}

async function callGemini(contents, ctx) {
  const base = {
    system_instruction: { parts: [{ text: buildSystem(ctx) }] },
    contents,
  };
  // Prefer function-calling + Google Search grounding together.
  let res = await postGemini({ ...base, tools: [{ functionDeclarations: functionDeclarations() }, { google_search: {} }] });
  // If this model/version rejects combining the two, retry with functions only.
  if (!res.ok && /google_search|search|tool|combine|only one/i.test(res.errText || '')) {
    res = await postGemini({ ...base, tools: [{ functionDeclarations: functionDeclarations() }] });
  }
  if (!res.ok) {
    const err = new Error(`Gemini API error (${res.status || '?'}): ${(res.errText || '').slice(0, 300)}`);
    err.code = 'PROVIDER_ERROR';
    throw err;
  }
  return res.json;
}

// ── Run tool calls → Gemini functionResponse parts ────────────────────────────
async function executeCalls(calls, deps, decisions = {}) {
  const parts = [];
  for (const { fc, id } of calls) {
    const args = fc.args || {};
    let out;
    if (needsConfirmation(fc.name, args) && decisions[id] !== 'allow') {
      out = { ok: false, declined: true, note: 'The user declined this action.' };
    } else {
      out = await runTool(fc.name, args, deps);
    }
    parts.push({ functionResponse: { name: fc.name, response: out && typeof out === 'object' ? out : { result: out } } });
  }
  return parts;
}

// ── Core loop ─────────────────────────────────────────────────────────────────
async function runLoop(contents, deps, ctx) {
  let finalText = '';
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const json = await callGemini(contents, ctx);
    const cand = json.candidates && json.candidates[0];
    const content = cand && cand.content;
    if (content) contents.push(content);

    const calls = functionCallsIn(content);
    const text = (content?.parts || []).filter((p) => p.text).map((p) => p.text).join('').trim();
    if (text) finalText = text;

    if (calls.length === 0) {
      return { status: 'done', reply: finalText || 'סליחה, לא הצלחתי להפיק תשובה.', history: contents };
    }

    const pending = calls.filter((c) => needsConfirmation(c.fc.name, c.fc.args || {}));
    if (pending.length) {
      return {
        status: 'confirm',
        preface: finalText,
        history: contents,
        actions: pending.map((c) => ({ id: c.id, name: c.fc.name, ...actionSummary(c.fc.name, c.fc.args || {}) })),
      };
    }

    const responses = await executeCalls(calls, deps, {});
    contents.push({ role: 'user', parts: responses });
  }
  return { status: 'done', reply: finalText || 'סליחה, נגמרו לי הצעדים לפני שסיימתי.', history: contents };
}

export async function assistantTurn(history, deps, ctx = {}) {
  requireKey();
  return runLoop(toContents(history), deps, ctx);
}

export async function assistantConfirm(history, decisions, deps, ctx = {}) {
  requireKey();
  const contents = toContents(history);
  let calls = [];
  for (let i = contents.length - 1; i >= 0; i--) {
    if (contents[i].role === 'model') {
      calls = functionCallsIn(contents[i]);
      break;
    }
  }
  if (!calls.length) {
    const err = new Error('No pending action to confirm.');
    err.code = 'NO_PENDING';
    throw err;
  }
  const responses = await executeCalls(calls, deps, decisions || {});
  contents.push({ role: 'user', parts: responses });
  return runLoop(contents, deps, ctx);
}
