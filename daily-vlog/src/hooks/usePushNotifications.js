import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { registerForPushNotifications } from '../services/pushService';
import { registerPushToken } from '../services/functionsService';

/**
 * When enabled, register for push and save the token to the user's profile
 * (via the registerPushToken Cloud Function). Also listens for notification
 * taps. All failures are non-fatal — push is a nice-to-have, not a blocker.
 */
export function usePushNotifications(enabled) {
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    (async () => {
      try {
        const token = await registerForPushNotifications();
        if (token && !cancelled) {
          await registerPushToken(token);
        }
      } catch {
        // ignore — the app works fine without push
      }
    })();

    // v1 has a single group, so a tap opens straight to the Feed (the default
    // in-group screen). The listener is here so deep-linking is easy to extend.
    const sub = Notifications.addNotificationResponseReceivedListener(() => {});

    return () => {
      cancelled = true;
      sub.remove();
    };
  }, [enabled]);
}
