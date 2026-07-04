// Integration test: group create/join against the Firebase emulator, with two
// separate authenticated clients (creator + joiner), exercising the real
// groupService the app uses — and the Security Rules.
import test from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  getDoc,
} from 'firebase/firestore';
import { signUpWithProfile, getUserProfile } from '../src/services/authOperations.js';
import { createGroup, joinGroup, getGroup } from '../src/services/groupService.js';

const PROJECT_ID = 'demo-daily-vlog';

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

// Two independent clients so each operation runs as the right user.
const creator = makeClient(`creator-${Date.now()}`);
const joiner = makeClient(`joiner-${Date.now()}`);

const stamp = Date.now();
let inviteCode;
let groupId;

test('setup: two users sign up', async () => {
  await signUpWithProfile(creator, {
    email: `creator_${stamp}@example.com`,
    password: 'secret123',
    displayName: 'Creator',
  });
  await signUpWithProfile(joiner, {
    email: `joiner_${stamp}@example.com`,
    password: 'secret123',
    displayName: 'Joiner',
  });
  assert.ok(creator.auth.currentUser?.uid);
  assert.ok(joiner.auth.currentUser?.uid);
});

test('createGroup writes a correctly-shaped group + sets creator groupId', async () => {
  const res = await createGroup(creator, {
    name: 'The Boys',
    uid: creator.auth.currentUser.uid,
  });
  inviteCode = res.inviteCode;
  groupId = res.id;

  assert.match(inviteCode, /^[A-Z0-9]{6}$/);

  const group = await getGroup(creator, groupId);
  assert.equal(group.name, 'The Boys');
  assert.equal(group.inviteCode, inviteCode);
  assert.equal(group.createdBy, creator.auth.currentUser.uid);
  assert.deepEqual(group.memberIds, [creator.auth.currentUser.uid]);
  assert.deepEqual(group.currentBagPool, [creator.auth.currentUser.uid]);
  assert.equal(group.roundNumber, 1);
  assert.equal(group.currentTurn, null);

  const profile = await getUserProfile(creator, creator.auth.currentUser.uid);
  assert.equal(profile.groupId, groupId);
});

test('security rules: a non-member cannot read the group', async () => {
  await assert.rejects(
    () => getDoc(doc(joiner.db, 'groups', groupId)),
    (err) => {
      assert.match(String(err.code || err.message), /permission-denied/i);
      return true;
    }
  );
});

test('joinGroup with the invite code adds the joiner to the group', async () => {
  await joinGroup(joiner, { inviteCode, uid: joiner.auth.currentUser.uid });

  const group = await getGroup(joiner, groupId); // now readable — they're a member
  assert.ok(group.memberIds.includes(creator.auth.currentUser.uid));
  assert.ok(group.memberIds.includes(joiner.auth.currentUser.uid));
  assert.ok(group.currentBagPool.includes(joiner.auth.currentUser.uid));
  assert.equal(group.memberIds.length, 2);

  const profile = await getUserProfile(joiner, joiner.auth.currentUser.uid);
  assert.equal(profile.groupId, groupId);
});

test('joining with a bad invite code is rejected', async () => {
  await assert.rejects(
    () => joinGroup(joiner, { inviteCode: 'ZZZZZZ', uid: joiner.auth.currentUser.uid }),
    /doesn't exist/i
  );
});

test('invite code uniqueness: a second group gets a lookup doc of its own', async () => {
  const res = await createGroup(creator, {
    name: 'Another Group',
    uid: creator.auth.currentUser.uid,
  });
  assert.notEqual(res.inviteCode, inviteCode);
  const lookup = await getDoc(doc(creator.db, 'inviteCodes', res.inviteCode));
  assert.ok(lookup.exists());
  assert.equal(lookup.data().groupId, res.id);
});
