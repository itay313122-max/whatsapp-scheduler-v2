# TestFlight checklist (iPhone distribution + push)

Everything is pre-configured for this. When you have an Apple Developer account,
this is ~20 minutes of mostly-waiting.

## What's already set up in the repo

- `app.json` → `ios.bundleIdentifier: com.dailyvlog.app`, camera/mic usage
  strings, the `expo-notifications` and `expo-camera` plugins.
- `eas.json` → a **production** profile with `distribution: store` (the default)
  and `autoIncrement` — this is the profile TestFlight uses.
- Push: EAS generates the APNs key automatically on the first iOS build; nothing
  to add by hand.

> **Profiles, so you don't pick the wrong one:**
> - `production` → **store** build → **TestFlight / App Store** ✅ use this
> - `preview` → **ad-hoc** → direct install, but only to UDID-registered devices
> - `development` → dev client for debugging

## Prerequisites (one-time)

1. **Apple Developer Program** — enroll at
   <https://developer.apple.com/programs/> ($99/yr; approval can take a day).
2. **Expo account** — free, created on first `eas login`.
3. Node + EAS CLI: `npm install -g eas-cli`.

## Steps

```bash
cd daily-vlog

# 1. Link the project (fills extra.eas.projectId + owner in app.json)
eas login
eas init

# 2. Build the iOS store binary (EAS asks for your Apple login on first run and
#    creates the App Store Connect app + push key + certificates for you)
eas build --platform ios --profile production

# 3. Upload the finished build to App Store Connect (→ TestFlight)
eas submit --platform ios --latest
```

`eas submit` will prompt for your Apple ID / team and the App Store Connect app
the first time — just follow the prompts (no need to pre-fill anything).

## Invite your friends

1. <https://appstoreconnect.apple.com> → your app → **TestFlight** tab.
2. First build shows "Missing Compliance" → answer the export-compliance
   question (this app uses only standard HTTPS encryption → usually "No" to the
   extra questions). It then goes to "Ready to Test".
3. Add testers:
   - **Internal** (fastest, up to 100, must be in your team) — add by email, or
   - **External** — create a **public link** and just send it to friends.
4. Each friend: install **TestFlight** from the App Store → open your link →
   **Accept** → **Install**.

Now the app is installed standalone (works without your computer) and **push
notifications work**.

## After the first time

- Ship JS-only changes instantly over the air: `eas update --branch production`
  (no rebuild, no re-review).
- Ship native/config changes (new permissions, SDK bumps): rebuild +
  `eas submit` again.
- Builds expire after **90 days** — rebuild to refresh.

## Don't forget the backend

TestFlight only distributes the app. For it to actually work, the Firebase side
must be live:

```bash
cd daily-vlog/functions && npm install && cd ..
firebase deploy --only firestore:rules,storage:rules,functions
```

And `.env` must hold your Firebase web config (see README).
