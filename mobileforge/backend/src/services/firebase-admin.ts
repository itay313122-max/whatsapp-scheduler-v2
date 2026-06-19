import admin from 'firebase-admin';

let initialized = false;

export function initFirebase() {
  if (initialized) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  const isPlaceholder = (v?: string) => !v || v.startsWith('__');
  if (isPlaceholder(projectId) || isPlaceholder(clientEmail) || isPlaceholder(privateKey)) {
    console.warn(
      '[Firebase] Credentials not configured (placeholders detected). Running without Firebase.'
    );
    return;
  }

  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });

  initialized = true;
}

export function getFirestore() {
  if (!initialized) throw new Error('Firebase not initialized');
  return admin.firestore();
}

export function getAuth() {
  if (!initialized) throw new Error('Firebase not initialized');
  return admin.auth();
}

export async function verifyIdToken(token: string) {
  if (!initialized) return null;
  try {
    return await admin.auth().verifyIdToken(token);
  } catch {
    return null;
  }
}

export { admin };
