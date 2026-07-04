// Integration test: the Stage 3 Feed flow against the emulator — start a turn,
// add clips, react, verify real-time subscription and Security Rules.
import test from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  getDocs,
  addDoc,
} from 'firebase/firestore';
import { initializeApp as adminInit } from 'firebase-admin/app';
import { getFirestore as adminFirestore, Timestamp as AdminTimestamp } from 'firebase-admin/firestore';
import { signUpWithProfile } from '../src/services/authOperations.js';
import { createGroup } from '../src/services/groupService.js';
import {
  subscribeActiveTurn,
  addMockClip,
  addReaction,
  subscribeClips,
} from '../src/services/feedService.js';

const PROJECT_ID = 'demo-daily-vlog';

// Admin client (bypasses Security Rules, auto-connects to the emulator via
// FIRESTORE_EMULATOR_HOST) — stands in for the selectDailyVlogger Cloud
// Function, which is what actually creates turns server-side.
const adminApp = adminInit({ projectId: PROJECT_ID }, 'admin-feed');
const adminDb = adminFirestore(adminApp);

async function seedActiveTurn(groupId, uid) {
  const now = Date.now();
  const startedAt = AdminTimestamp.fromMillis(now);
  const expiresAt = AdminTimestamp.fromMillis(now + 24 * 60 * 60 * 1000);
  const turnRef = adminDb.collection('groups').doc(groupId).collection('turns').doc();
  await turnRef.set({ userId: uid, startedAt, expiresAt, status: 'active' });
  await adminDb.collection('groups').doc(groupId).update({
    currentTurn: { userId: uid, startedAt, expiresAt },
  });
  return turnRef.id;
}

function makeClient(name) {
  const app = initializeApp(
    { projectId: PROJECT_ID, apiKey: 'demo-key', authDomain: `${PROJECT_ID}.firebaseapp.com` },
    name
  );
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const db = getFirestore(app);
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  return { auth, db };
}

const stamp = Date.now();
const owner = makeClient(`feedowner-${stamp}`);
const outsider = makeClient(`feedoutsider-${stamp}`);
let groupId;
let turnId;

test('setup: user + group + non-member', async () => {
  await signUpWithProfile(owner, {
    email: `feedowner_${stamp}@example.com`, password: 'secret123', displayName: 'Owner',
  });
  await signUpWithProfile(outsider, {
    email: `feedoutsider_${stamp}@example.com`, password: 'secret123', displayName: 'Outsider',
  });
  const res = await createGroup(owner, { name: 'Feed Group', uid: owner.auth.currentUser.uid });
  groupId = res.id;
});

test('a server-created (seeded) turn is seen live via subscribeActiveTurn', async () => {
  await seedActiveTurn(groupId, owner.auth.currentUser.uid);

  const turn = await new Promise((resolve, reject) => {
    const unsub = subscribeActiveTurn(owner, groupId, (t) => {
      if (t) { unsub(); resolve(t); }
    }, reject);
    setTimeout(() => reject(new Error('timed out waiting for active turn')), 5000);
  });

  assert.equal(turn.status, 'active');
  assert.equal(turn.userId, owner.auth.currentUser.uid);
  assert.ok(turn.expiresAt, 'turn has an expiry');
  turnId = turn.id;
});

test('security: a client (even a member) cannot create a turn', async () => {
  await assert.rejects(
    () =>
      addDoc(collection(owner.db, 'groups', groupId, 'turns'), {
        userId: owner.auth.currentUser.uid,
        status: 'active',
      }),
    (err) => {
      assert.match(String(err.code || err.message), /permission-denied/i);
      return true;
    }
  );
});

test('addMockClip adds a clip, seen live via subscribeClips', async () => {
  await addMockClip(owner, {
    groupId, turnId, uploaderId: owner.auth.currentUser.uid, order: 0,
  });

  const clips = await new Promise((resolve, reject) => {
    const unsub = subscribeClips(owner, groupId, turnId, (list) => {
      if (list.length > 0) { unsub(); resolve(list); }
    }, reject);
    setTimeout(() => reject(new Error('timed out waiting for clips')), 5000);
  });

  assert.equal(clips.length, 1);
  assert.equal(clips[0].uploaderId, owner.auth.currentUser.uid);
  assert.ok(clips[0].storagePath.startsWith('mock://'));
  assert.ok(clips[0].durationSec >= 0);
});

test('reactions (emoji + comment) are written and readable', async () => {
  const clipsSnap = await getDocs(collection(owner.db, 'groups', groupId, 'turns', turnId, 'clips'));
  const clipId = clipsSnap.docs[0].id;

  await addReaction(owner, {
    groupId, turnId, clipId, userId: owner.auth.currentUser.uid, type: 'emoji', value: '🔥',
  });
  await addReaction(owner, {
    groupId, turnId, clipId, userId: owner.auth.currentUser.uid, type: 'comment', value: 'lol',
  });

  const reSnap = await getDocs(
    collection(owner.db, 'groups', groupId, 'turns', turnId, 'clips', clipId, 'reactions')
  );
  const types = reSnap.docs.map((d) => d.data().type).sort();
  assert.deepEqual(types, ['comment', 'emoji']);
});

test('security: a non-member cannot add a clip to the turn', async () => {
  await assert.rejects(
    () =>
      addDoc(collection(outsider.db, 'groups', groupId, 'turns', turnId, 'clips'), {
        uploaderId: outsider.auth.currentUser.uid,
        storagePath: 'mock://evil.mp4',
        durationSec: 5,
        order: 99,
      }),
    (err) => {
      assert.match(String(err.code || err.message), /permission-denied/i);
      return true;
    }
  );
});

test('security: a member cannot forge a clip as someone else', async () => {
  await assert.rejects(
    () =>
      addDoc(collection(owner.db, 'groups', groupId, 'turns', turnId, 'clips'), {
        uploaderId: 'someone-else',
        storagePath: 'mock://forged.mp4',
        durationSec: 5,
        order: 98,
      }),
    (err) => {
      assert.match(String(err.code || err.message), /permission-denied/i);
      return true;
    }
  );
});
