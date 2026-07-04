// Thin client wrappers around the callable Cloud Functions.
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../firebase/config';

const functions = getFunctions(app, 'us-central1');

/**
 * Trigger the daily pick for a group on demand (member-only, runs the same
 * server-side transaction as the scheduled job). For testing without waiting
 * for the morning schedule.
 */
export function triggerSelection(groupId) {
  return httpsCallable(functions, 'devTriggerSelection')({ groupId });
}

/** Save this device's Expo push token to the current user's profile. */
export function registerPushToken(token) {
  return httpsCallable(functions, 'registerPushToken')({ token });
}
