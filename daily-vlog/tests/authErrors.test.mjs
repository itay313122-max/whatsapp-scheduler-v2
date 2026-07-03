import test from 'node:test';
import assert from 'node:assert/strict';
import { authErrorMessage } from '../src/utils/authErrors.js';

test('maps known Firebase auth codes to friendly messages', () => {
  assert.match(authErrorMessage({ code: 'auth/email-already-in-use' }), /already registered/i);
  assert.match(authErrorMessage({ code: 'auth/invalid-credential' }), /wrong email or password/i);
  assert.match(authErrorMessage({ code: 'auth/weak-password' }), /at least 6/i);
});

test('falls back to error.message for unknown codes', () => {
  assert.equal(
    authErrorMessage({ code: 'auth/something-new', message: 'raw message' }),
    'raw message'
  );
});

test('has a generic fallback when nothing is provided', () => {
  assert.match(authErrorMessage({}), /something went wrong/i);
});
