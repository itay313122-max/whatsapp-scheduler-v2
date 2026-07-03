import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateInviteCode,
  generateUniqueInviteCode,
  normalizeInviteCode,
} from '../src/utils/inviteCode.js';

const ALLOWED = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/;

test('generateInviteCode: 6 chars, no ambiguous characters', () => {
  for (let i = 0; i < 500; i++) {
    const code = generateInviteCode();
    assert.match(code, ALLOWED, `bad code: ${code}`);
    assert.ok(!/[01OIL]/.test(code), `contains ambiguous char: ${code}`);
  }
});

test('normalizeInviteCode: trims, uppercases, strips spaces', () => {
  assert.equal(normalizeInviteCode('  k7 qw2m '), 'K7QW2M');
  assert.equal(normalizeInviteCode('abcdef'), 'ABCDEF');
  assert.equal(normalizeInviteCode(''), '');
  assert.equal(normalizeInviteCode(undefined), '');
});

test('generateUniqueInviteCode: returns a free code on first try', async () => {
  const code = await generateUniqueInviteCode(async () => false);
  assert.match(code, ALLOWED);
});

test('generateUniqueInviteCode: retries until a free code is found', async () => {
  let calls = 0;
  // First two candidates are "taken", third is free.
  const code = await generateUniqueInviteCode(async () => {
    calls += 1;
    return calls < 3;
  });
  assert.match(code, ALLOWED);
  assert.equal(calls, 3);
});

test('generateUniqueInviteCode: throws if never free within maxAttempts', async () => {
  await assert.rejects(
    () => generateUniqueInviteCode(async () => true, 5),
    /unique invite code/i
  );
});
