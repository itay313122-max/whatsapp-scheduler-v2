// Cloud Functions for Daily Vlog.
// All state changes to the daily pick and turn lifecycle happen HERE (server
// side), never in the client — so nobody can cheat the selection.
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const { Expo } = require('expo-server-sdk');

const { pickNextVlogger } = require('./lib/selection');
const { otherMemberIds } = require('./lib/notify');

initializeApp();
setGlobalOptions({ region: 'us-central1', maxInstances: 5 });

const db = getFirestore();
const expo = new Expo();
const DAY_MS = 24 * 60 * 60 * 1000;

// ── Push helper ────────────────────────────────────────────────────────────
async function sendPush(tokens, title, body, data = {}) {
  const messages = tokens
    .filter((t) => Expo.isExpoPushToken(t))
    .map((to) => ({ to, sound: 'default', title, body, data }));
  for (const chunk of expo.chunkPushNotifications(messages)) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (err) {
      console.error('push send failed', err);
    }
  }
}

async function tokensFor(uids) {
  const tokens = [];
  for (const uid of uids) {
    const snap = await db.doc(`users/${uid}`).get();
    const t = snap.data()?.pushToken;
    if (t) tokens.push(t);
  }
  return tokens;
}

// ── Core: pick the next vlogger for one group, in a transaction ─────────────
// Returns the selected uid (or null). Push is sent by the caller after commit.
async function runSelectionForGroup(groupRef) {
  let selectedUid = null;
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(groupRef);
    if (!snap.exists) return;
    const g = snap.data();

    const result = pickNextVlogger({
      memberIds: g.memberIds,
      currentBagPool: g.currentBagPool,
      roundNumber: g.roundNumber,
    });
    if (!result) return;

    const now = Date.now();
    const startedAt = Timestamp.fromMillis(now);
    const expiresAt = Timestamp.fromMillis(now + DAY_MS);

    const turnRef = groupRef.collection('turns').doc();
    tx.set(turnRef, {
      userId: result.userId,
      startedAt,
      expiresAt,
      status: 'active',
    });
    tx.update(groupRef, {
      currentBagPool: result.currentBagPool,
      roundNumber: result.roundNumber,
      currentTurn: { userId: result.userId, startedAt, expiresAt },
    });
    selectedUid = result.userId;
  });
  return selectedUid;
}

// ── selectDailyVlogger — scheduled every morning ────────────────────────────
exports.selectDailyVlogger = onSchedule('every day 09:00', async () => {
  const groups = await db.collection('groups').get();
  for (const groupDoc of groups.docs) {
    try {
      const selectedUid = await runSelectionForGroup(groupDoc.ref);
      if (selectedUid) {
        const tokens = await tokensFor([selectedUid]);
        await sendPush(tokens, "Today you're up 👑", 'Vlog your day!', {
          groupId: groupDoc.id,
        });
      }
    } catch (err) {
      console.error('selection failed for group', groupDoc.id, err);
    }
  }
});

// ── devTriggerSelection — callable, so you can test without waiting for 9am ──
// Server-side selection (same transaction), but only a member of the group may
// trigger it. Safe to keep: it can't be used to pick a specific person.
exports.devTriggerSelection = onCall(async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in first.');
  const groupId = req.data?.groupId;
  if (!groupId) throw new HttpsError('invalid-argument', 'groupId required.');

  const groupRef = db.doc(`groups/${groupId}`);
  const snap = await groupRef.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Group not found.');
  if (!(snap.data().memberIds || []).includes(uid)) {
    throw new HttpsError('permission-denied', 'Not a member of this group.');
  }

  const selectedUid = await runSelectionForGroup(groupRef);
  if (selectedUid) {
    const tokens = await tokensFor([selectedUid]);
    await sendPush(tokens, "Today you're up 👑", 'Vlog your day!', { groupId });
  }
  return { selectedUid };
});

// ── onClipUploaded — notify the other members ───────────────────────────────
exports.onClipUploaded = onDocumentCreated(
  'groups/{groupId}/turns/{turnId}/clips/{clipId}',
  async (event) => {
    const clip = event.data?.data();
    if (!clip) return;
    const { groupId } = event.params;

    const groupSnap = await db.doc(`groups/${groupId}`).get();
    if (!groupSnap.exists) return;

    const others = otherMemberIds(groupSnap.data().memberIds, clip.uploaderId);
    if (others.length === 0) return;

    const uploaderSnap = await db.doc(`users/${clip.uploaderId}`).get();
    const name = uploaderSnap.data()?.displayName || 'Someone';

    const tokens = await tokensFor(others);
    await sendPush(tokens, `New clip from ${name} 🎬`, 'Tap to watch', { groupId });
  }
);

// ── expireTurn — hourly cleanup, deletes everything (no archive in v1) ───────
exports.expireTurn = onSchedule('every 1 hours', async () => {
  const now = Timestamp.now();
  const bucket = getStorage().bucket();
  const groups = await db.collection('groups').get();

  for (const groupDoc of groups.docs) {
    const expired = await groupDoc.ref
      .collection('turns')
      .where('status', '==', 'active')
      .where('expiresAt', '<', now)
      .get();

    for (const turnDoc of expired.docs) {
      try {
        // Delete every clip and its reactions.
        const clips = await turnDoc.ref.collection('clips').get();
        for (const clipDoc of clips.docs) {
          const reactions = await clipDoc.ref.collection('reactions').get();
          const batch = db.batch();
          reactions.docs.forEach((r) => batch.delete(r.ref));
          await batch.commit();
          await clipDoc.ref.delete();
        }
        // Delete the Storage videos for this turn (best effort).
        await bucket
          .deleteFiles({ prefix: `groups/${groupDoc.id}/turns/${turnDoc.id}/clips/` })
          .catch((e) => console.error('storage cleanup failed', e));

        // Delete the turn doc and clear the group's currentTurn — no leftovers.
        await turnDoc.ref.delete();
        await groupDoc.ref.update({ currentTurn: null });
      } catch (err) {
        console.error('expire failed for turn', turnDoc.id, err);
      }
    }
  }
});

// ── registerPushToken — callable: save a user's Expo push token ──────────────
exports.registerPushToken = onCall(async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in first.');
  const token = req.data?.token;
  if (!token || !Expo.isExpoPushToken(token)) {
    throw new HttpsError('invalid-argument', 'Invalid Expo push token.');
  }
  await db.doc(`users/${uid}`).set({ pushToken: token }, { merge: true });
  return { ok: true };
});
