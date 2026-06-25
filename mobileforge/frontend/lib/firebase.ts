import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type Auth,
  type User,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

// Firebase Web config. These client-side values are PUBLIC by design (they ship
// in every Firebase web bundle; access is controlled by Security Rules and
// Authorized Domains, not by hiding the apiKey). We bake the project defaults in
// as a fallback so auth/saving keep working even if the hosting env vars are
// missing or wrong — env vars still take priority when present.
const FIREBASE_DEFAULTS = {
  apiKey: 'AIzaSyBpzsSDcJdgFDJ4WjM10kbFkBgJmXeQHl0',
  authDomain: 'app-maker-57e40.firebaseapp.com',
  projectId: 'app-maker-57e40',
  storageBucket: 'app-maker-57e40.firebasestorage.app',
  messagingSenderId: '133422063144',
  appId: '1:133422063144:web:f3e781307fbc9478b39f1d',
};

function getFirebaseConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || FIREBASE_DEFAULTS.apiKey,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || FIREBASE_DEFAULTS.authDomain,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || FIREBASE_DEFAULTS.projectId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || FIREBASE_DEFAULTS.storageBucket,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || FIREBASE_DEFAULTS.messagingSenderId,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || FIREBASE_DEFAULTS.appId,
  };
}

function isConfigured() {
  const cfg = getFirebaseConfig();
  return !!(cfg.apiKey && cfg.projectId);
}

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;

function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === 'undefined') return null;
  if (!isConfigured()) return null;
  if (_app) return _app;
  try {
    _app = getApps().length ? getApp() : initializeApp(getFirebaseConfig());
  } catch (e) {
    // Bad/invalid config (e.g. a wrong API key in the env) must not crash the
    // whole app — degrade to guest mode instead.
    console.error('Firebase failed to initialize — running in guest mode.', e);
    return null;
  }
  return _app;
}

export function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp();
  if (!app) return null;
  if (!_auth) {
    try {
      _auth = getAuth(app);
    } catch (e) {
      console.error('Firebase Auth unavailable — running in guest mode.', e);
      return null;
    }
  }
  return _auth;
}

export function getFirebaseDb(): Firestore | null {
  const app = getFirebaseApp();
  if (!app) return null;
  if (!_db) {
    try {
      _db = getFirestore(app);
    } catch (e) {
      console.error('Firestore unavailable.', e);
      return null;
    }
  }
  return _db;
}

export function getFirebaseStorage(): FirebaseStorage | null {
  const app = getFirebaseApp();
  if (!app) return null;
  if (!_storage) {
    try {
      _storage = getStorage(app);
    } catch (e) {
      console.error('Firebase Storage unavailable.', e);
      return null;
    }
  }
  return _storage;
}

export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

export async function signInWithGoogle() {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase not configured');
  return signInWithPopup(auth, googleProvider);
}

export async function signInWithGithub() {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase not configured');
  return signInWithPopup(auth, githubProvider);
}

export async function signInWithEmail(email: string, password: string) {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase not configured');
  return signInWithEmailAndPassword(auth, email, password);
}

export async function registerWithEmail(email: string, password: string) {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase not configured');
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function logout() {
  const auth = getFirebaseAuth();
  if (!auth) return;
  return signOut(auth);
}

// Guest user object for demo/dev mode when Firebase is not configured
export interface GuestUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: null;
  isGuest: true;
  getIdToken: () => Promise<string>;
}

function createGuestUser(): GuestUser {
  return {
    uid: 'guest-' + Math.random().toString(36).slice(2, 10),
    email: 'guest@demo.local',
    displayName: 'Guest User',
    photoURL: null,
    isGuest: true,
    getIdToken: async () => '',
  };
}

export function isFirebaseConfigured(): boolean {
  return isConfigured();
}

export function onAuthChange(callback: (user: User | null) => void) {
  let auth: Auth | null = null;
  try {
    auth = getFirebaseAuth();
  } catch {
    auth = null;
  }
  if (!auth) {
    // Firebase not configured / unavailable — auto-create guest session.
    const guest = createGuestUser() as unknown as User;
    setTimeout(() => callback(guest), 0);
    return () => {};
  }
  try {
    return onAuthStateChanged(auth, callback);
  } catch (e) {
    console.error('Auth listener failed — running in guest mode.', e);
    const guest = createGuestUser() as unknown as User;
    setTimeout(() => callback(guest), 0);
    return () => {};
  }
}

export { type User };

// Create (or no-op if existing) user doc in Firestore on first sign-in
export async function createUserDocIfNeeded(user: User): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;
  try {
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        email: user.email ?? '',
        displayName: user.displayName ?? user.email?.split('@')[0] ?? 'User',
        photoURL: user.photoURL ?? null,
        credits: 10,
        plan: 'free',
        createdAt: new Date().toISOString(),
      });
    }
  } catch {
    // Non-fatal — user can still use the app
  }
}

// Legacy exports for convenience
export const auth = {
  get currentUser() {
    return getFirebaseAuth()?.currentUser ?? null;
  },
};

export const db = {
  _get: getFirebaseDb,
};

export const storage = {
  _get: getFirebaseStorage,
};
