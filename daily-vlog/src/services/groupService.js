// Group create / join operations, decoupled from React so they can be tested
// in Node against the Firebase emulator (same as authOperations).
import {
  collection,
  doc,
  getDoc,
  serverTimestamp,
  writeBatch,
  arrayUnion,
} from 'firebase/firestore';
import {
  generateUniqueInviteCode,
  normalizeInviteCode,
} from '../utils/inviteCode';

// We keep a tiny `inviteCodes/{CODE}` lookup collection that maps a code to a
// groupId. Why: a person joining is NOT yet a member, so the members-only read
// rule on `groups` would block them from looking a group up by code. The
// lookup doc holds no sensitive content (just the groupId) and is readable by
// any signed-in user. It also gives us cheap uniqueness (the code IS the doc id).

/**
 * Create a new group, its invite-code lookup doc, and point the creator's
 * user doc at it — all in one atomic batch.
 * @returns {Promise<{ id: string, inviteCode: string }>}
 */
export async function createGroup({ db }, { name, uid }) {
  const trimmed = (name || '').trim();
  if (!trimmed) throw new Error('Please enter a group name.');
  if (!uid) throw new Error('Not signed in.');

  const inviteCode = await generateUniqueInviteCode(async (code) => {
    const snap = await getDoc(doc(db, 'inviteCodes', code));
    return snap.exists();
  });

  const groupRef = doc(collection(db, 'groups')); // client-generated id
  const batch = writeBatch(db);

  batch.set(groupRef, {
    name: trimmed,
    inviteCode,
    memberIds: [uid],
    createdBy: uid,
    createdAt: serverTimestamp(),
    currentBagPool: [uid], // creator is eligible for the first pick
    roundNumber: 1,
    currentTurn: null,
  });
  batch.set(doc(db, 'inviteCodes', inviteCode), {
    groupId: groupRef.id,
    createdAt: serverTimestamp(),
  });
  batch.update(doc(db, 'users', uid), { groupId: groupRef.id });

  await batch.commit();
  return { id: groupRef.id, inviteCode };
}

/**
 * Join an existing group by its invite code.
 * Adds the user to memberIds + currentBagPool and points their user doc at the
 * group. Idempotent thanks to arrayUnion.
 * @returns {Promise<{ id: string }>}
 */
export async function joinGroup({ db }, { inviteCode, uid }) {
  const code = normalizeInviteCode(inviteCode);
  if (!code) throw new Error('Please enter an invite code.');
  if (!uid) throw new Error('Not signed in.');

  const lookup = await getDoc(doc(db, 'inviteCodes', code));
  if (!lookup.exists()) {
    throw new Error("That invite code doesn't exist. Double-check it.");
  }
  const groupId = lookup.data().groupId;

  const batch = writeBatch(db);
  // arrayUnion won't duplicate if the user is already a member.
  batch.update(doc(db, 'groups', groupId), {
    memberIds: arrayUnion(uid),
    currentBagPool: arrayUnion(uid),
  });
  batch.update(doc(db, 'users', uid), { groupId });

  await batch.commit();
  return { id: groupId };
}

/** Read a group document (caller must be a member per Security Rules). */
export async function getGroup({ db }, groupId) {
  const snap = await getDoc(doc(db, 'groups', groupId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
