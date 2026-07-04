# Daily Vlog 👑

A social entertainment app. Every day one member of your group is picked at
random (a "bag without replacement" — nobody repeats until everyone has had a
turn, then the round resets). The chosen person posts a **vlog**: short clips
throughout their day. The vlog lives for 24 hours like a story — everyone
watches and reacts in real time — then it's all deleted. **No archive in v1.**

Every clip sent → all other members get a push notification.

## Stack

- **React Native + Expo** (managed workflow)
- **Firebase** — Auth (Email/Password), Firestore, Cloud Functions, Storage
- **Expo Notifications** for push
- Video: recorded + compressed on-device, uploaded to Firebase Storage,
  auto-deleted after 24h. Everything stays inside Firebase's free tier.

## Build stages

This project is built in checkpoints. Current stage: **Stage 4 — Record**.

- [x] **Stage 0** — Clean Expo project + dependencies + folder structure
- [x] **Stage 1** — Firebase wiring + Auth screens (sign up / login)
- [x] **Stage 2** — Create / join group by invite code
- [x] **Stage 3** — Feed screen (live turn + clips, mock upload)
- [x] **Stage 4** — Record screen (record → compress → upload)
- [ ] **Stage 5** — Cloud Functions + Security Rules
- [ ] **Stage 6** — Push notifications end-to-end

## Getting started (Stage 0)

```bash
cd daily-vlog
npm install
npx expo start
```

Then open **Expo Go** on your phone and scan the QR code. You should see the
"Stage 0 — project scaffold is running" screen.

> Note: from Stage 4 (camera + on-device compression) you will need a **custom
> dev client** rather than plain Expo Go, because video compression uses a
> native module. That's called out when we get there.

## Firebase setup (needed from Stage 1)

1. Go to the [Firebase Console](https://console.firebase.google.com/) →
   **Add project** (free "Spark" plan is fine).
2. **Authentication** → Get started → **Sign-in method** → enable
   **Email/Password**.
3. **Firestore Database** → Create database → Start in **test mode** for now
   (we add real Security Rules in Stage 5).
4. Project settings (⚙️) → **Your apps** → add a **Web app** (`</>`). Copy the
   config values.
5. In `daily-vlog/`, copy `.env.example` to `.env` and paste the values:
   ```bash
   cp .env.example .env
   ```
6. Restart Expo clearing the cache so it picks up the env file:
   ```bash
   npx expo start -c
   ```

If `.env` is missing or empty the app shows a "Firebase not configured" screen
instead of crashing.

## Tests

Two layers, both automated:

```bash
# Unit tests (pure logic — no Firebase needed): invite codes, error mapping
npm test

# Integration tests: real Auth + Firestore flows against the Firebase emulator
#   (needs Java; downloads the emulator jar on first run)
npm run test:integration

# Everything
npm run test:all
```

The integration suite spins up the Auth + Firestore **emulators** (via
`firebase emulators:exec`) and runs the app's actual auth service
(`src/services/authOperations.js`) against them — the same code the UI calls.
It verifies: sign-up creates a correctly-shaped `users/{uid}` document, sign
out / sign in, duplicate-email rejection, and that the Firestore **security
rules** block an unauthenticated read. No real Firebase project or credentials
required.

## Folder structure

```
daily-vlog/
├─ App.js                 # Root component (placeholder in Stage 0)
├─ index.js               # Expo entry point
├─ app.json               # Expo config (permissions, plugins)
├─ babel.config.js
├─ .env.example           # Firebase config template (copy to .env)
└─ src/
   ├─ firebase/           # Firebase init + service exports (Stage 1)
   ├─ context/            # AuthContext, app-wide state (Stage 1)
   ├─ navigation/         # Root navigator: auth vs app stacks (Stage 1)
   ├─ screens/
   │  ├─ auth/            # Login / SignUp (Stage 1)
   │  ├─ group/           # Create / join group (Stage 2)
   │  ├─ home/            # Feed: today's vlog (Stage 3)
   │  └─ record/          # Camera → compress → upload (Stage 4)
   ├─ components/         # Reusable UI (clip card, reaction bar, timer…)
   ├─ services/           # Firestore / Storage / push helpers
   ├─ utils/              # Small helpers (time formatting, invite codes…)
   └─ theme/              # colors.js — shared palette
```

Cloud Functions and Security Rules (`functions/`, `firestore.rules`,
`storage.rules`) are added in Stage 5.
