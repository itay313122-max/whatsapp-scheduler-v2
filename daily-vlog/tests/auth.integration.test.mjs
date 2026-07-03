// Integration test: runs the app's real auth operations against the Firebase
// Auth + Firestore emulators. Launched via `firebase emulators:exec`, which
// sets FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST for us.
import test from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signOut } from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  getDoc,
} from 'firebase/firestore';
import {
  signUpWithProfile,
  signInUser,
  getUserProfile,
} from '../src/services/authOperations.js';

const PROJECT_ID = 'demo-daily-vlog';

const app = initializeApp({
  projectId: PROJECT_ID,
  apiKey: 'demo-key',
  authDomain: `${PROJECT_ID}.firebaseapp.com`,
});
const auth = getAuth(app);
connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
const db = getFirestore(app);
connectFirestoreEmulator(db, '127.0.0.1', 8080);

const services = { auth, db };
// Unique email per run so repeated runs don't collide in the emulator.
const email = `tester_${Date.now()}@example.com`;
const password = 'secret123';
const displayName = 'Test Tester';

test('signUp creates an auth user + a correctly-shaped users/{uid} doc', async () => {
  const user = await signUpWithProfile(services, { email, password, displayName });
  assert.ok(user.uid, 'expected a uid');
  assert.equal(user.email, email);

  const profile = await getUserProfile(services, user.uid);
  assert.ok(profile, 'profile doc should exist');
  assert.equal(profile.displayName, displayName);
  assert.equal(profile.photoURL, null);
  assert.equal(profile.pushToken, null);
  assert.equal(profile.groupId, null);
  assert.ok(profile.createdAt, 'createdAt should be set by serverTimestamp');
});

test('signOut then signIn works with the same credentials', async () => {
  await signOut(auth);
  assert.equal(auth.currentUser, null);

  const cred = await signInUser(services, { email, password });
  assert.equal(cred.user.email, email);
  assert.ok(auth.currentUser, 'should be signed in again');
});

test('signing up with an already-used email is rejected', async () => {
  await assert.rejects(
    () => signUpWithProfile(services, { email, password, displayName }),
    (err) => {
      assert.equal(err.code, 'auth/email-already-in-use');
      return true;
    }
  );
});

test('security rules: an unauthenticated client cannot read a user profile', async () => {
  const anonApp = initializeApp(
    { projectId: PROJECT_ID, apiKey: 'demo-key' },
    'anon-app'
  );
  const anonDb = getFirestore(anonApp);
  connectFirestoreEmulator(anonDb, '127.0.0.1', 8080);

  await assert.rejects(
    () => getDoc(doc(anonDb, 'users', 'someone')),
    (err) => {
      assert.match(String(err.code || err.message), /permission-denied/i);
      return true;
    }
  );
});
