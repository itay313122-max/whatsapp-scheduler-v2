import test from 'node:test';
import assert from 'node:assert/strict';
import { buildClipStoragePath } from '../src/services/storageService.js';

test('buildClipStoragePath composes the expected path', () => {
  assert.equal(
    buildClipStoragePath('g1', 't2', 'c3'),
    'groups/g1/turns/t2/clips/c3.mp4'
  );
});

test('buildClipStoragePath matches the storage.rules pattern (…/clips/<file>)', () => {
  const path = buildClipStoragePath('GID', 'TID', 'CID');
  assert.match(path, /^groups\/[^/]+\/turns\/[^/]+\/clips\/[^/]+\.mp4$/);
});
