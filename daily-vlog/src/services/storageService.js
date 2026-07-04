// Video upload to Firebase Storage + matching clip document creation.
import {
  collection,
  doc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { ref, uploadBytesResumable } from 'firebase/storage';

/** Storage path for a clip's video. Kept pure so it's unit-testable. */
export function buildClipStoragePath(groupId, turnId, clipId) {
  return `groups/${groupId}/turns/${turnId}/clips/${clipId}.mp4`;
}

/**
 * Upload a recorded video to Storage and create its clip document.
 * We mint the clip doc id first so the Storage path and the Firestore doc
 * share the same id (and the expireTurn function can delete both by path).
 *
 * @param onProgress optional (fraction 0..1) callback for the upload bar.
 * @returns {Promise<{ id: string, storagePath: string }>}
 */
export async function uploadClipVideo(
  { storage, db },
  { groupId, turnId, uploaderId, localUri, durationSec, order, onProgress }
) {
  const clipRef = doc(collection(db, 'groups', groupId, 'turns', turnId, 'clips'));
  const storagePath = buildClipStoragePath(groupId, turnId, clipRef.id);

  // React Native: fetch the local file URI into a Blob for upload.
  const res = await fetch(localUri);
  const blob = await res.blob();

  const task = uploadBytesResumable(ref(storage, storagePath), blob, {
    contentType: 'video/mp4',
  });
  await new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      (snap) => {
        if (onProgress && snap.totalBytes) {
          onProgress(snap.bytesTransferred / snap.totalBytes);
        }
      },
      reject,
      resolve
    );
  });

  // Create the clip doc only after the upload succeeds (data model: clips/{id}).
  await setDoc(clipRef, {
    uploaderId,
    storagePath,
    durationSec,
    order,
    createdAt: serverTimestamp(),
  });

  return { id: clipRef.id, storagePath };
}
