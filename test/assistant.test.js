// Unit tests for the assistant's pure logic (no network / no API key needed).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  needsConfirmation,
  actionSummary,
  executeToolUses,
  lastAssistantToolUses,
  assistantTurn,
  assistantConfirm,
} from '../assistant.js';

test('needsConfirmation gates outbound actions only', () => {
  assert.equal(needsConfirmation('send_whatsapp', { phone: '05', message: 'hi' }), true);
  assert.equal(needsConfirmation('schedule_whatsapp', {}), true);
  assert.equal(needsConfirmation('calendar_action', { action: 'create' }), true);
  assert.equal(needsConfirmation('calendar_action', { action: 'list' }), false);
  assert.equal(needsConfirmation('email_action', { action: 'send' }), true);
  assert.equal(needsConfirmation('email_action', { action: 'summarize' }), false);
  assert.equal(needsConfirmation('web_search', {}), false);
  assert.equal(needsConfirmation('list_schedules', {}), false);
});

test('actionSummary produces a human card for each action', () => {
  const s = actionSummary('send_whatsapp', { phone: '0501234567', message: 'אני בדרך' });
  assert.equal(s.icon, '📱');
  assert.match(s.detail, /0501234567/);
  assert.equal(s.body, 'אני בדרך');
});

test('lastAssistantToolUses finds tool_use blocks in the last assistant turn', () => {
  const history = [
    { role: 'user', content: 'text mom' },
    {
      role: 'assistant',
      content: [
        { type: 'text', text: 'ok' },
        { type: 'tool_use', id: 'tu_1', name: 'send_whatsapp', input: { phone: '05', message: 'hi' } },
      ],
    },
  ];
  const tus = lastAssistantToolUses(history);
  assert.equal(tus.length, 1);
  assert.equal(tus[0].id, 'tu_1');
});

test('lastAssistantToolUses returns [] when the last assistant turn has none', () => {
  const history = [{ role: 'assistant', content: [{ type: 'text', text: 'hi' }] }];
  assert.deepEqual(lastAssistantToolUses(history), []);
});

test('executeToolUses runs an approved action and returns a tool_result', async () => {
  let sent = null;
  const deps = {
    sendWhatsAppMessage: async (phone, message) => { sent = { phone, message }; },
    scheduleWhatsApp: () => ({ ok: true }),
    listSchedules: () => [],
    cancelSchedule: () => ({ ok: true }),
  };
  const toolUses = [{ type: 'tool_use', id: 'tu_1', name: 'send_whatsapp', input: { phone: '05', message: 'hi' } }];
  const results = await executeToolUses(toolUses, deps, { tu_1: 'allow' });
  assert.equal(results.length, 1);
  assert.equal(results[0].type, 'tool_result');
  assert.equal(results[0].tool_use_id, 'tu_1');
  assert.deepEqual(sent, { phone: '05', message: 'hi' });
  assert.equal(JSON.parse(results[0].content).ok, true);
});

test('executeToolUses does NOT run a declined action', async () => {
  let called = false;
  const deps = { sendWhatsAppMessage: async () => { called = true; }, scheduleWhatsApp: () => ({}), listSchedules: () => [], cancelSchedule: () => ({}) };
  const toolUses = [{ type: 'tool_use', id: 'tu_1', name: 'send_whatsapp', input: { phone: '05', message: 'hi' } }];
  const results = await executeToolUses(toolUses, deps, { tu_1: 'deny' });
  assert.equal(called, false);
  assert.equal(JSON.parse(results[0].content).declined, true);
});

test('executeToolUses skips server tools (web_search)', async () => {
  const deps = { sendWhatsAppMessage: async () => {}, scheduleWhatsApp: () => ({}), listSchedules: () => [], cancelSchedule: () => ({}) };
  const toolUses = [{ type: 'tool_use', id: 'sv', name: 'web_search', input: {} }];
  const results = await executeToolUses(toolUses, deps, {});
  assert.equal(results.length, 0);
});

test('read-only tools run without a decision', async () => {
  const deps = { sendWhatsAppMessage: async () => {}, scheduleWhatsApp: () => ({}), listSchedules: () => [{ id: 'a' }], cancelSchedule: () => ({}) };
  const toolUses = [{ type: 'tool_use', id: 'tu_1', name: 'list_schedules', input: {} }];
  const results = await executeToolUses(toolUses, deps, {});
  assert.equal(JSON.parse(results[0].content).schedules.length, 1);
});

test('entrypoints throw NO_API_KEY when the key is missing', async () => {
  delete process.env.ANTHROPIC_API_KEY;
  await assert.rejects(() => assistantTurn([{ role: 'user', content: 'hi' }], {}, {}), (e) => e.code === 'NO_API_KEY');
  await assert.rejects(() => assistantConfirm([{ role: 'user', content: 'hi' }], {}, {}, {}), (e) => e.code === 'NO_API_KEY');
});
