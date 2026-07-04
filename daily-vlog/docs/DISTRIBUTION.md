# Getting the app to your friends (v1, free)

Two ways to share, depending on how far along you are.

## A. Quickest for early testing — Expo Go (free)

Everyone installs **Expo Go** from the store, then opens your project.

```bash
cd daily-vlog
npx expo start            # scan the QR with Expo Go
# or publish a link they can open without your laptop running:
npx eas update --branch preview
```

Caveats:
- **Push** is limited in Expo Go (OK-ish on Android, barely works on iOS).
- Once we add native video compression (Stage 4), Expo Go is no longer enough
  — you'll need a build (below). Until then Expo Go is fine.

## B. Real installable app — EAS Build (recommended for a friends test)

This produces an actual app your friends install. **Android is free.**

### One-time setup
```bash
npm install -g eas-cli
eas login                 # create a free Expo account if needed
cd daily-vlog
eas init                  # links the project, writes projectId into app.json
```

### Android (free) — share an APK
```bash
eas build -p android --profile preview
```
EAS runs the build in the cloud and gives you a **link + QR**. Send it to your
Android friends — they download and install the APK directly. Done.

- Push notifications: EAS provisions Android push (FCM) automatically for the
  build, so per-clip notifications work here (unlike Expo Go).
- Rebuild and re-send the link whenever you ship changes, or use
  `eas update --branch preview` to push JS-only changes over the air without a
  new build.

### iOS — the catch
There is **no truly free** way to hand an app to friends' iPhones:
- **TestFlight** — needs an Apple Developer account (**$99/year**). Then:
  `eas build -p ios --profile preview` → `eas submit -p ios`, invite friends by
  email in App Store Connect. Best iOS experience.
- **Ad-hoc** — free-ish but you must register each friend's device UDID and
  rebuild; painful for more than a couple of testers.

### Recommended free path for v1
| Who | How |
| --- | --- |
| You + Android friends | `eas build -p android --profile preview` → APK link |
| iPhone friends | TestFlight ($99) if you invest, otherwise Expo Go for the parts that work |

## Build profiles (`eas.json`)

- **development** — dev client for debugging native modules on-device.
- **preview** — internal distribution; Android APK you can sideload. Use this
  for friends.
- **production** — Android app bundle (`.aab`) for the Play Store later.

## Firebase stays free

The whole app is designed to fit Firebase's free **Spark** plan (Auth,
Firestore, Storage, Cloud Functions, with 24h auto-delete keeping storage
tiny). Distribution cost and Firebase cost are separate — Firebase is $0 for a
friends-sized test.
