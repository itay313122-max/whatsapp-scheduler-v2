# Trying Daily Vlog on iPhone

Two ways: **Expo Go** (free, quick, no push) and **TestFlight** (paid Apple
account, full experience with push).

## Before anything (you do this once)

1. Firebase configured — `.env` filled in (see README "Firebase setup").
2. Cloud Functions + rules deployed:
   ```bash
   cd daily-vlog/functions && npm install && cd ..
   firebase deploy --only firestore:rules,storage:rules,functions
   ```
Without these the daily pick, uploads, and push won't work.

---

## Option A — Expo Go (free, test if it's fun)

Good for a quick shared test. Camera, feed, and reactions work. **Push does
not work in Expo Go on iOS** — you open the app manually instead of getting a
notification.

**You (host):**
```bash
cd daily-vlog
npx expo start --tunnel
```
(First run may ask to install `@expo/ngrok` — say yes. `--tunnel` lets friends
connect over the internet, not just your Wi-Fi. Keep this running.)

A QR code appears in the terminal.

**Each friend (iPhone):**
1. Install **Expo Go** from the App Store.
2. Open the iPhone **Camera** app (not inside Expo Go) and point it at the QR.
3. Tap the yellow banner → it opens in Expo Go.
4. Sign up → **Join** with the invite code you share → you're in.

> Everyone must be testing while your `expo start` is running. To start a round
> without waiting for the 9am schedule, tap **🧪 Pick today's vlogger** in the Feed.

---

## Option B — TestFlight (full experience, needs Apple Developer $99/yr)

The proper way for an all-iPhone group, **with push**.

**You (one-time):**
1. Enroll in the Apple Developer Program ($99/yr) at
   <https://developer.apple.com/programs/>. (Approval can take a day.)
2. Link the project and build (use the **production** profile — that's the
   store build TestFlight needs; `preview` is ad-hoc and does NOT reach
   TestFlight):
   ```bash
   cd daily-vlog
   npm install -g eas-cli
   eas login
   eas init            # writes projectId into app.json
   eas build -p ios --profile production
   ```
   EAS asks for your Apple login and handles certificates automatically.
3. Upload to App Store Connect:
   ```bash
   eas submit -p ios --latest
   ```
4. In **App Store Connect → TestFlight**, add your friends as testers (by email)
   or create a public TestFlight invite link.

**Each friend (iPhone):**
1. Install **TestFlight** from the App Store.
2. Open your invite link / email → **Accept** → **Install**.
3. Open the app → sign up → join the group. Push notifications now work.

> One Apple account covers up to 10,000 TestFlight testers — plenty for friends.

---

## Which to use

| Goal | Path |
| --- | --- |
| Just see if it's fun, today, $0 | Expo Go + `--tunnel` (no push) |
| The real test with per-clip push | TestFlight ($99/yr) |

Start with Expo Go. If the loop feels fun, the $99 for TestFlight buys the full
push experience.
