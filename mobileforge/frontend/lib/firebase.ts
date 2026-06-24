import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
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

function getFirebaseConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
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
  _app = getApps().length ? getApp() : initializeApp(getFirebaseConfig());
  return _app;
}

export function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp();
  if (!app) return null;
  if (!_auth) _auth = getAuth(app);
  return _auth;
}

export function getFirebaseDb(): Firestore | null {
  const app = getFirebaseApp();
  if (!app) return null;
  if (!_db) _db = getFirestore(app);
  return _db;
}

export function getFirebaseStorage(): FirebaseStorage | null {
  const app = getFirebaseApp();
  if (!app) return null;
  if (!_storage) _storage = getStorage(app);
  return _storage;
}

export const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase not configured');
  return signInWithPopup(auth, googleProvider);
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
  const auth = getFirebaseAuth();
  if (!auth) {
    // Firebase not configured — auto-create guest session for demo mode
    const guest = createGuestUser() as unknown as User;
    setTimeout(() => callback(guest), 0);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
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
