# MobileForge — Beta Release Checklist

A practical, copy-paste runbook to take MobileForge from "builds locally" to a
public closed beta. Work top to bottom. Each step has a concrete command or
click-path and a pass criterion.

> Status legend: ☐ = todo · ✅ = verified in code/tests · ⚠️ = needs a real key/deploy to verify

---

## 0. Pre-flight (local, ~10 min)

| Check | Command | Pass criterion |
|---|---|---|
| ✅ Backend builds | `cd backend && npm run build` | exits 0, `dist/` populated |
| ✅ Frontend builds | `cd frontend && npm run build` | "Compiled successfully", all routes listed |
| ✅ Tests pass | `cd backend && npm test` | 219 passed |
| ✅ Typecheck clean | `npx tsc --noEmit` in each app | no errors |

All four are green as of this checklist.

---

## 1. Provider API keys (required — else demo mode)

At least one LLM key is needed for real AI generation. The fallback order is:
**Groq → NVIDIA → Gemini → OpenRouter → Cerebras → Together.** Get the free ones:

| Provider | Where | Env var | Notes |
|---|---|---|---|
| Groq | console.groq.com/keys | `GROQ_API_KEY` | primary, fastest |
| NVIDIA NIM | build.nvidia.com → "Get API Key" | `NVIDIA_API_KEY` | Llama-3.3-70B, strong fallback |
| Gemini | aistudio.google.com/apikey | `GEMINI_API_KEY` | |
| OpenRouter | openrouter.ai/keys | `OPENROUTER_API_KEY` | `:free` models |
| Cerebras | cloud.cerebras.ai | `CEREBRAS_API_KEY` | very fast |
| Together | api.together.xyz | `TOGETHER_API_KEY` | free credit |

☐ Set **at least two** (Groq + NVIDIA recommended) so a single provider outage
doesn't drop you to demo mode.

> Security: never commit real keys. `.env` is gitignored; set keys only in the
> Render/Vercel dashboards. If a key was ever pasted into chat or a commit,
> rotate it.

---

## 2. Backend deploy (Render)

`render.yaml` is already a Blueprint. In Render: **New → Blueprint → connect repo**.

☐ Set secret env vars in the dashboard (all `sync: false`):
- `GROQ_API_KEY`, `NVIDIA_API_KEY`, (other providers optional)
- `FRONTEND_URL` = your Vercel URL (for CORS)
- `ADMIN_TOKEN` = any secret string (protects `/api/feedback`, `/api/backup`)
- `BETA_KEYS` = comma-separated invite codes, e.g. `MF-AAAA-1111,MF-BBBB-2222`
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (for persistence)

☐ Deploy, then verify:
```bash
curl https://<your-backend>.onrender.com/health          # → {"ok":true} (or 200)
curl https://<your-backend>.onrender.com/api/generate/ai-status
```
**Pass:** `ai-status` shows `keysConfigured.GROQ: true` (and/or NVIDIA), `groqTest.ok: true`,
and `willUseDemoMode: false`. If `willUseDemoMode: true`, a key is wrong — fix it
and redeploy (the JSON's `hint` field tells you what's wrong).

> Note: Render free tier cold-starts (~30–50s after idle). For a smoother beta,
> use a paid instance or a cron ping to keep it warm.

> **Network egress (important):** the backend must be able to reach the LLM
> provider hosts. If your host has an egress allowlist (firewall), add the ones
> you use, or generation silently drops to demo mode:
> `api.groq.com`, `integrate.api.nvidia.com`, `generativelanguage.googleapis.com`
> (Gemini), `openrouter.ai`, `api.cerebras.ai`, `api.together.xyz`, and
> `api.pexels.com` + `images.pexels.com` (photos). The `/api/generate/ai-status`
> response shows exactly which provider is reachable and why demo mode is on.

---

## 3. Frontend deploy (Vercel)

☐ Import the repo in Vercel, root = `mobileforge/frontend`.
☐ Set env var `NEXT_PUBLIC_API_URL` = your Render backend URL.
☐ Deploy. **Pass:** landing page loads, no console errors.

---

## 4. Smoke tests (against the deployed stack)

Run each as a real user. **Pass = the described result with no console errors.**

1. ☐ **Beta gate** — open the app in a fresh browser → prompted for a beta key →
   enter a `BETA_KEYS` value → enters the app.
2. ☐ **Fresh generation (Flash)** — type "a coffee shop app with a menu and cart"
   → watch the live `streaming · NKB written` indicator → app renders in the canvas.
3. ☐ **Quality badge** — after generation, the toolbar shows `Quality NN` (green
   when ok). Click it → popover lists screens reachable / buttons wired.
4. ☐ **Ideate mode** — switch build mode to Ideate → ask for a multi-screen app →
   (optional clarifying questions) → app generates → Quality popover shows the
   **Blueprint** flow (`Home → Detail → Cart`).
5. ☐ **Edit** — "make the header dark blue" → only that changes, app stays intact.
6. ☐ **Multi-screen nav** — Play mode → tap through the bottom nav → screens switch.
7. ☐ **Device switch** — toggle iPhone / Galaxy / iPad / Desktop → smooth crossfade.
8. ☐ **Mobile** — open the deployed site on a phone (or 390px devtools) → after a
   build, use the floating **Preview/Chat** toggle → each pane is full-width, not squished.
9. ☐ **Persistence** — reload the builder → the conversation + app come back.
10. ☐ **Export** — download HTML / JSX → file opens and runs.

---

## 5. Error-state verification (already hardened in code ✅)

These are handled — spot-check that they behave as described:

- ✅ **All providers down** → serves a polished demo app + a visible "Demo Mode" warning.
- ✅ **Stream error mid-build** → silently falls back to non-streaming, build still completes.
- ✅ **Generated app throws at runtime** → red "Runtime Error" / "JS Error" panel inside
  the preview (React ErrorBoundary + try/catch), not a blank screen.
- ✅ **Preview hangs >12s** → "failed to load" overlay instead of an infinite spinner.
- ✅ **App uses localStorage** → in-memory shim keeps it from crashing in the sandbox.
- ✅ **Rate limit hit** → 429 with a friendly message (per-minute + per-day caps).

---

## 6. Go / No-Go

**Ship the beta when:**
- ✅ Builds + tests green (done)
- ☐ `ai-status` reports a working provider in production (not demo mode)
- ☐ Smoke tests 1–10 pass on the deployed stack
- ☐ Beta keys distributed to testers

**Known gaps (acceptable for beta, plan for v1):**
- Vision (image → app) — intentionally returns 503 ("Premium").
- Multi-screen deep-linking within prototype mode, voice critique — nice-to-haves.

**Done since first draft:** real photographic imagery (`/api/image` + `photoImg()`,
needs `PEXELS_API_KEY`), NVIDIA provider, streaming builds, Ideate blueprint phase,
quality gate + issue-specific auto-repair, mobile builder, side-by-side version compare.

---

## Quick reference — health endpoints

| Endpoint | Purpose |
|---|---|
| `GET /health` | liveness |
| `GET /api/generate/ai-status` | which provider keys work, why demo mode (no secrets leaked) |
| `GET /api/generate/themes` | design preset list (unauthenticated sanity check) |
