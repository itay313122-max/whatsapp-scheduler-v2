import test from 'node:test';
import assert from 'node:assert/strict';
import { otherMemberIds } from '../functions/lib/notify.js';

test('excludes the uploader from the recipients', () => {
  assert.deepEqual(otherMemberIds(['a', 'b', 'c'], 'b'), ['a', 'c']);
});

test('handles missing memberIds', () => {
  assert.deepEqual(otherMemberIds(undefined, 'b'), []);
});

test('drops falsy ids', () => {
  assert.deepEqual(otherMemberIds(['a', '', null, 'b'], 'a'), ['b']);
});
