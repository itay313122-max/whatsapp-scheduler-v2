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

This project is built in checkpoints. Current stage: **Stage 0 — scaffold**.

- [x] **Stage 0** — Clean Expo project + dependencies + folder structure
- [ ] **Stage 1** — Firebase wiring + Auth screens (sign up / login)
- [ ] **Stage 2** — Create / join group by invite code
- [ ] **Stage 3** — Feed screen (live turn + clips, mock upload)
- [ ] **Stage 4** — Record screen (record → compress → upload)
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
