// Tests for AI provider selection and the free Gemini schema/history helpers.
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('activeProvider honors LLM_PROVIDER and key presence', async () => {
  const saved = { ...process.env };
  const fresh = async () => (await import('../provider.js?' + Math.random()));

  delete process.env.LLM_PROVIDER;
  delete process.env.GEMINI_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  assert.equal((await fresh()).activeProvider(), 'gemini'); // free by default

  process.env.ANTHROPIC_API_KEY = 'x';
  assert.equal((await fresh()).activeProvider(), 'claude'); // auto-detect claude key

  process.env.GEMINI_API_KEY = 'y';
  assert.equal((await fresh()).activeProvider(), 'gemini'); // gemini wins when both set

  process.env.LLM_PROVIDER = 'claude';
  assert.equal((await fresh()).activeProvider(), 'claude'); // explicit override

  Object.keys(process.env).forEach((k) => { if (!(k in saved)) delete process.env[k]; });
  Object.assign(process.env, saved);
});

test('providerConfigured reflects the active provider key', async () => {
  const saved = { ...process.env };
  const fresh = async () => (await import('../provider.js?' + Math.random()));

  delete process.env.LLM_PROVIDER;
  delete process.env.GEMINI_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  assert.equal((await fresh()).providerConfigured(), false);

  process.env.GEMINI_API_KEY = 'y';
  assert.equal((await fresh()).providerConfigured(), true);

  Object.keys(process.env).forEach((k) => { if (!(k in saved)) delete process.env[k]; });
  Object.assign(process.env, saved);
});

test('gemini entrypoints throw NO_API_KEY without a key', async () => {
  delete process.env.GEMINI_API_KEY;
  const g = await import('../gemini.js');
  await assert.rejects(() => g.assistantTurn([{ role: 'user', content: 'hi' }], {}, {}), (e) => e.code === 'NO_API_KEY');
});
