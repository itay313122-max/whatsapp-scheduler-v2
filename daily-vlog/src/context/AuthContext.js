import { createContext, useContext, useEffect, useState } from 'react';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import {
  signUpWithProfile,
  signInUser,
} from '../services/authOperations';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);      // Firebase auth user
  const [profile, setProfile] = useState(null); // Firestore users/{uid} doc
  const [initializing, setInitializing] = useState(true);
  // True while we're fetching the profile for a signed-in user. Prevents a
  // flash of the "join a group" screen before we know if they have a group.
  const [profileLoading, setProfileLoading] = useState(false);

  // Watch auth state. Firebase restores the persisted session on launch, so
  // this fires once with the logged-in user (or null) after startup.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        setProfileLoading(true);
        try {
          const snap = await getDoc(doc(db, 'users', fbUser.uid));
          setProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null);
        } catch (e) {
          setProfile(null);
        } finally {
          setProfileLoading(false);
        }
      } else {
        setProfile(null);
      }
      setInitializing(false);
    });
    return unsub;
  }, []);

  function signUp(email, password, displayName) {
    return signUpWithProfile({ auth, db }, { email, password, displayName });
  }

  function signIn(email, password) {
    return signInUser({ auth }, { email, password });
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
    profileLoading,
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
