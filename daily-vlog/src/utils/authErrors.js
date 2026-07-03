// Map Firebase Auth error codes to short, friendly messages.
const MESSAGES = {
  'auth/invalid-email': 'That email address looks invalid.',
  'auth/email-already-in-use': 'That email is already registered. Try logging in.',
  'auth/weak-password': 'Password is too weak — use at least 6 characters.',
  'auth/missing-password': 'Please enter a password.',
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/user-not-found': 'No account found for that email.',
  'auth/wrong-password': 'Wrong email or password.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
};

export function authErrorMessage(error) {
  const code = error?.code;
  if (code && MESSAGES[code]) return MESSAGES[code];
  return error?.message || 'Something went wrong. Please try again.';
}
