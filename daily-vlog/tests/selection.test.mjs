import test from 'node:test';
import assert from 'node:assert/strict';
import { pickNextVlogger } from '../functions/lib/selection.js';

test('refills the bag and bumps the round when empty', () => {
  const r = pickNextVlogger({ memberIds: ['a', 'b', 'c'], currentBagPool: [], roundNumber: 1 });
  assert.equal(r.roundNumber, 2);
  assert.ok(['a', 'b', 'c'].includes(r.userId));
  assert.equal(r.currentBagPool.length, 2);
  assert.ok(!r.currentBagPool.includes(r.userId));
});

test('picks from the existing pool without refilling', () => {
  const r = pickNextVlogger(
    { memberIds: ['a', 'b', 'c'], currentBagPool: ['b'], roundNumber: 3 },
    () => 0
  );
  assert.equal(r.userId, 'b');
  assert.equal(r.roundNumber, 3);
  assert.deepEqual(r.currentBagPool, []);
});

test('no one repeats until everyone has had a turn, then the round increments', () => {
  const members = ['a', 'b', 'c', 'd'];
  let group = { memberIds: members, currentBagPool: [...members], roundNumber: 1 };
  const picked = [];
  for (let i = 0; i < 4; i++) {
    const r = pickNextVlogger(group);
    picked.push(r.userId);
    group = { ...group, currentBagPool: r.currentBagPool, roundNumber: r.roundNumber };
  }
  assert.deepEqual([...picked].sort(), [...members].sort()); // each exactly once
  assert.equal(group.currentBagPool.length, 0);
  assert.equal(group.roundNumber, 1);

  const next = pickNextVlogger(group); // empty bag → new round
  assert.equal(next.roundNumber, 2);
});

test('returns null when there are no members', () => {
  assert.equal(pickNextVlogger({ memberIds: [], currentBagPool: [], roundNumber: 0 }), null);
});

test('uses the injected RNG deterministically', () => {
  const r = pickNextVlogger(
    { memberIds: ['x', 'y', 'z'], currentBagPool: ['x', 'y', 'z'], roundNumber: 1 },
    () => 0.99
  );
  assert.equal(r.userId, 'z');
});
