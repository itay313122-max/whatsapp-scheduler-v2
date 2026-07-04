// Feed data layer: real-time subscriptions to the active turn, its clips, and
// per-clip reactions, plus the writes the Feed performs (mock clip in Stage 3,
// reactions). Decoupled from React so it's testable against the emulator.
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

/** Subscribe to the group's single active turn (or null). Returns unsubscribe. */
export function subscribeActiveTurn({ db }, groupId, cb, onError) {
  const q = query(
    collection(db, 'groups', groupId, 'turns'),
    where('status', '==', 'active'),
    limit(1)
  );
  return onSnapshot(
    q,
    (snap) => {
      const d = snap.docs[0];
      cb(d ? { id: d.id, ...d.data() } : null);
    },
    onError
  );
}

/** Subscribe to a turn's clips in order. Returns unsubscribe. */
export function subscribeClips({ db }, groupId, turnId, cb, onError) {
  const q = query(
    collection(db, 'groups', groupId, 'turns', turnId, 'clips'),
    orderBy('order', 'asc')
  );
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError
  );
}

/** Subscribe to a clip's reactions (emoji + comments) oldest-first. */
export function subscribeReactions({ db }, groupId, turnId, clipId, cb, onError) {
  const q = query(
    collection(db, 'groups', groupId, 'turns', turnId, 'clips', clipId, 'reactions'),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError
  );
}

/**
 * STAGE 3: add a mock clip (no real video yet). Stage 4 replaces this with a
 * real Storage upload, but the clip document shape stays the same.
 */
export function addMockClip({ db }, { groupId, turnId, uploaderId, order }) {
  return addDoc(collection(db, 'groups', groupId, 'turns', turnId, 'clips'), {
    uploaderId,
    storagePath: `mock://clip-${Date.now()}.mp4`,
    durationSec: Math.floor(8 + Math.random() * 22), // ~8–30s
    createdAt: serverTimestamp(),
    order,
  });
}

/** Add a reaction to a clip. type is 'emoji' or 'comment'. */
export function addReaction({ db }, { groupId, turnId, clipId, userId, type, value }) {
  return addDoc(
    collection(db, 'groups', groupId, 'turns', turnId, 'clips', clipId, 'reactions'),
    { userId, type, value, createdAt: serverTimestamp() }
  );
}
