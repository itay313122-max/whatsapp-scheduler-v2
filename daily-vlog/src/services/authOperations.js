// Core auth operations, decoupled from React and React Native so they can be
// unit/integration tested in Node against the Firebase emulator.
//
// Both AuthContext (in the app) and the test suite call these exact functions,
// passing in the initialized { auth, db } services. That way tests exercise the
// real code path, not a copy of it.
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

/**
 * Create an auth account and its Firestore users/{uid} document.
 * @returns the Firebase auth user.
 */
export async function signUpWithProfile({ auth, db }, { email, password, displayName }) {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const name = (displayName || '').trim();
  if (name) {
    await updateProfile(cred.user, { displayName: name });
  }
  // Matches the data model: users/{userId}
  await setDoc(doc(db, 'users', cred.user.uid), {
    displayName: name || email.trim(),
    photoURL: null,
    pushToken: null,
    groupId: null,
    createdAt: serverTimestamp(),
  });
  return cred.user;
}

/** Sign in an existing account. */
export function signInUser({ auth }, { email, password }) {
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

/** Read a user's Firestore profile document (or null). */
export async function getUserProfile({ db }, uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
