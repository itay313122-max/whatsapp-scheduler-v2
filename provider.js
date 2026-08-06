// ── AI provider selection ─────────────────────────────────────────────────────
// Chooses the brain: Gemini (free) or Claude (paid). Controlled by LLM_PROVIDER,
// otherwise auto-detected from whichever API key is present. Defaults to Gemini.
import * as claude from './assistant.js';
import * as gemini from './gemini.js';

export function activeProvider() {
  const p = (process.env.LLM_PROVIDER || '').toLowerCase();
  if (p === 'gemini') return 'gemini';
  if (p === 'claude' || p === 'anthropic') return 'claude';
  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.ANTHROPIC_API_KEY) return 'claude';
  return 'gemini'; // free by default
}

export function providerConfigured() {
  return activeProvider() === 'gemini'
    ? Boolean(process.env.GEMINI_API_KEY)
    : Boolean(process.env.ANTHROPIC_API_KEY);
}

function impl() {
  return activeProvider() === 'gemini' ? gemini : claude;
}

export function assistantTurn(history, deps, ctx) {
  return impl().assistantTurn(history, deps, ctx);
}

export function assistantConfirm(history, decisions, deps, ctx) {
  return impl().assistantConfirm(history, decisions, deps, ctx);
}
