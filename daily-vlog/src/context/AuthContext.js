import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);      // Firebase auth user
  const [profile, setProfile] = useState(null); // Firestore users/{uid} doc
  const [initializing, setInitializing] = useState(true);

  // Watch auth state. Firebase restores the persisted session on launch, so
  // this fires once with the logged-in user (or null) after startup.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        try {
          const snap = await getDoc(doc(db, 'users', fbUser.uid));
          setProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null);
        } catch (e) {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setInitializing(false);
    });
    return unsub;
  }, []);

  async function signUp(email, password, displayName) {
    const cred = await createUserWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );
    const name = displayName.trim();
    if (name) {
      await updateProfile(cred.user, { displayName: name });
    }
    // Create the Firestore user document (data model: users/{userId}).
    await setDoc(doc(db, 'users', cred.user.uid), {
      displayName: name || email.trim(),
      photoURL: null,
      pushToken: null,
      groupId: null,
      createdAt: serverTimestamp(),
    });
    return cred.user;
  }

  function signIn(email, password) {
    return signInWithEmailAndPassword(auth, email.trim(), password);
  }

  function logout() {
    return signOut(auth);
  }

  // Let screens refresh the cached profile after they change it (e.g. joining
  // a group in Stage 2 sets groupId).
  async function refreshProfile() {
    if (!auth.currentUser) return null;
    const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
    const p = snap.exists() ? { id: snap.id, ...snap.data() } : null;
    setProfile(p);
    return p;
  }

  const value = {
    user,
    profile,
    initializing,
    signUp,
    signIn,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
