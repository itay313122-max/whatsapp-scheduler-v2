#!/usr/bin/env node
/**
 * MobileForge — AI provider health check.
 *
 * Tests every configured LLM key against its real endpoint and reports which
 * ones work, so you know real generation is live before you rely on it.
 *
 *   cd mobileforge/backend && node ../check-ai.mjs
 *
 * Reads keys from backend/.env. A provider with no key is skipped (not failed).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load backend/.env without depending on the dotenv package (this script may run
// from a folder that has no node_modules). Tries a few sensible locations.
(function loadEnv() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), 'backend', '.env'),
    path.join(here, 'backend', '.env'),
  ];
  const file = candidates.find(f => fs.existsSync(f));
  if (!file) { console.log('⚠️  No .env found — checked:', candidates.join(', ')); return; }
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].replace(/^["']|["']$/g, '');
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
})();

const PROVIDERS = [
  {
    name: 'Groq', env: 'GROQ_API_KEY',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile', auth: k => ({ Authorization: `Bearer ${k}` }),
  },
  {
    name: 'Gemini', env: 'GEMINI_API_KEY',
    url: k => `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${k}`,
    gemini: true,
  },
  {
    name: 'OpenRouter', env: 'OPENROUTER_API_KEY',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'meta-llama/llama-3.1-8b-instruct:free', auth: k => ({ Authorization: `Bearer ${k}` }),
  },
  {
    name: 'Cerebras', env: 'CEREBRAS_API_KEY',
    url: 'https://api.cerebras.ai/v1/chat/completions',
    model: 'llama-3.3-70b', auth: k => ({ Authorization: `Bearer ${k}` }),
  },
  {
    name: 'Together', env: 'TOGETHER_API_KEY',
    url: 'https://api.together.xyz/v1/chat/completions',
    model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free', auth: k => ({ Authorization: `Bearer ${k}` }),
  },
];

const isPlaceholder = v => !v || v.startsWith('__') || v.startsWith('placeholder') || v.endsWith('...');

async function test(p) {
  const key = process.env[p.env];
  if (isPlaceholder(key)) return { name: p.name, status: 'skip', detail: 'no key set' };

  try {
    let res;
    if (p.gemini) {
      res = await fetch(p.url(key), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Reply: OK' }] }], generationConfig: { maxOutputTokens: 10 } }),
      });
    } else {
      res = await fetch(p.url, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...p.auth(key) },
        body: JSON.stringify({ model: p.model, messages: [{ role: 'user', content: 'Reply: OK' }], max_tokens: 10 }),
      });
    }
    const body = await res.text();
    if (res.ok) return { name: p.name, status: 'ok', detail: `HTTP ${res.status}` };
    return { name: p.name, status: 'fail', detail: `HTTP ${res.status} — ${body.slice(0, 100)}` };
  } catch (e) {
    return { name: p.name, status: 'fail', detail: e.message };
  }
}

console.log('\n🔍 Checking AI providers (reading backend/.env)...\n');
const results = await Promise.all(PROVIDERS.map(test));

const icon = { ok: '✅', fail: '❌', skip: '⚪' };
for (const r of results) {
  console.log(`  ${icon[r.status]}  ${r.name.padEnd(11)} ${r.detail}`);
}

const working = results.filter(r => r.status === 'ok');
console.log('');
if (working.length) {
  console.log(`🎉 ${working.length} provider(s) working — real AI generation is LIVE.`);
  console.log(`   Primary in use: ${working[0].name}\n`);
  process.exit(0);
} else {
  const blocked = results.some(r => r.status === 'fail' && /allowlist|egress|ENOTFOUND|fetch failed/i.test(r.detail));
  console.log('⚠️  No provider reachable. The app will run in DEMO MODE.');
  if (blocked) console.log('   Looks like a network/egress block — run this from an open network (your own machine).');
  console.log('   (Demo mode still builds real apps from smart templates.)\n');
  process.exit(1);
}
