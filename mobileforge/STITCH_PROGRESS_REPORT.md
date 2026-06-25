# MobileForge — Stitch Engine Report

**Date:** 2026-06-25
**Branch:** `claude/mobileforge-mobile-builder-wEYm1`
**Goal:** Learn Google Stitch's engine, run real test builds, fix what was broken, and bring MobileForge's generation + workflow to a level where Stitch isn't needed.

---

## TL;DR

I ran real generation tests against the live AI providers, found and fixed the
**two root causes** that made the builder look broken, and added **three
Stitch-style workflow features**. Everything below was verified end-to-end in a
real headless browser against actual AI-generated apps — not just code review.

| # | Issue / Feature | Status | Verified how |
|---|---|---|---|
| 1 | Chat produced demo templates instead of real apps | **Fixed** | Live API call → `demoMode:false`, real "Coffee Loyalty" / "Notes" apps |
| 2 | Generated apps crashed to "Runtime Error" in preview | **Fixed** | Browser: notes app now renders real content, 0 storage errors |
| 3 | Play / Prototype mode | **Added** | Browser: "Playing" active, app responds to its own controls |
| 4 | Annotate mode | **Added** | Browser: tap element → anchored input with element context |
| 5 | Stitch-style agent build log | **Added** | 7-step paced log across the full build |

Backend build: **clean**. Frontend production build: **clean**.

---

## Root causes I found (the important part)

### 1. Why the chat kept giving demo/template apps

The provider fallback chain is **Groq → Gemini → OpenRouter → Cerebras →
Together**. When Groq fails (bad/rate-limited key on Render), the next provider
is Gemini. But the Gemini caller was pinned to **`gemini-2.0-flash`**, which now
returns **429 (quota exhausted)**, and the old `gemini-1.5-flash` returns **404
(model removed)**. So the chain fell straight through every provider to
**demo-mode template apps** — exactly the symptom you saw.

I verified this directly against the real key:

```
gemini-2.5-flash  → 200 OK     ✅
gemini-2.0-flash  → 429 quota   ❌ (what the code used)
gemini-1.5-flash  → 404 gone    ❌
```

**Fix:** `callGemini` now tries `gemini-2.5-flash` first and falls back across
models on 429/404. After the fix, a live generation produced a real app:

```
appName: Coffee Loyalty
demoMode: false          ← real AI, not a template
features: loyalty-points, rewards-redemption, activity-log, …
htmlDoc: 209 KB of real React
```

### 2. Why generated apps showed a "Runtime Error" in the preview

The preview iframe is sandboxed with `allow-scripts` but **without
`allow-same-origin`** (correct for security). Generated apps frequently persist
state to `localStorage`, and in that sandbox `localStorage` access throws a
`SecurityError`, which crashed the app to its error screen:

> Runtime Error — Failed to read the 'localStorage' property from 'Window': the
> document is sandboxed and lacks the 'allow-same-origin' flag.

**Fix:** `buildHtmlDocument` now injects an in-memory `localStorage` /
`sessionStorage` shim into every generated page. If the real APIs are
unavailable, the app transparently uses the shim and runs normally — the sandbox
stays locked down (no `allow-same-origin`, no security regression).

Verified in-browser after the fix: a notes app mounted and showed real content
("Grocery List — Milk, Eggs, Bread… / Meeting Notes…") with **zero**
storage-related console errors.

---

## Features added (modeled on Stitch)

### Play / Prototype mode
A **Play** toggle in the canvas toolbar. Normally the preview intercepts clicks
for visual editing, so the app's own buttons don't fire. Play tells the in-app
overlay to stand down (`mf-set-play` message + `playMode` flag in the generated
runtime), making the app **fully interactive** — navigate tabs, tap buttons,
type — like Stitch's instant prototype. The state re-asserts after each reload
so it survives regenerations and theme changes.

### Annotate mode
Tap any element on the canvas and **describe the change in plain words**. The
request is sent to the AI scoped to that element (its tag + visible text are
included) with an explicit instruction to leave the rest of the app untouched.
Play and Annotate are mutually exclusive. Reuses the existing element-selection
pipeline.

### Agent build log
The generation loading state now walks through seven concrete steps (planning
screens → choosing components → designing the visual system → writing code →
wiring interactions → polishing), paced by per-step durations so it keeps moving
across the whole ~30s build instead of freezing on step one.

---

## What YOU need to do for the live site (Render)

The fixes are in code and pushed, but the live backend on Render runs the old
build until it redeploys:

1. **Redeploy the backend on Render** (Manual Deploy → Deploy latest commit) so
   the Gemini + storage-shim fixes go live.
2. **Re-check** `https://mobileforge-backend.onrender.com/api/generate/ai-status`.
   - If it shows Groq working, you're fully covered.
   - Even if Groq is broken, generation now works via Gemini 2.5-flash.
3. **Rotate the Groq key** you pasted in chat earlier — treat it as compromised
   and generate a fresh one in the Groq console, then set `GROQ_API_KEY` in
   Render → Environment.

> Note: I could not reach the live Render backend from this environment (the
> network policy blocks that host), so the live re-check has to be done from your
> side. I verified every fix against the real providers locally instead.

---

## Verification environment

- Backend run locally on `:4000`, real provider keys, real generation calls.
- Frontend run locally on `:3000`, driven with Playwright + Chromium.
- Beta gate bypassed with a valid key for testing only.
- Screenshots captured at each step (canvas, play mode, annotate, rendered apps).

## Known minor polish items (non-blocking, next session)

- The brief preview **loading overlay** uses a light gradient that flashes
  against dark-themed apps.
- A few **font option labels** in the Design System panel are low-contrast in
  dark mode.
- Playwright's synthetic clicks don't reach inside the sandboxed `srcdoc` iframe
  (a Chromium quirk) — real user clicks and `dispatchEvent` both work, so this
  only affects automated testing, not users.

## Commits on this branch

- `5d0d6bf` Fix AI generation falling to demo mode + localStorage crash in preview
- `11702e6` Add Stitch-style Play, Annotate, and richer agent build log
