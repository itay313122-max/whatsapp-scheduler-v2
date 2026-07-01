# MobileForge — Dev Quickstart (VS Code)

Open the repo root in VS Code. One-click tasks are in `.vscode/tasks.json`
(run them via **Terminal → Run Task…**, or `Cmd/Ctrl+Shift+P` → "Run Task").

## First time

1. **Run Task → "MobileForge: Install (backend + frontend)"** — installs deps.
2. **Set API keys** in `mobileforge/backend/.env` (copy from `.env.example`):
   - At least one LLM key: `GROQ_API_KEY` (fastest) and/or `NVIDIA_API_KEY`.
   - Optional: `PEXELS_API_KEY` for real photos, `NVIDIA_MODEL` (default `qwen/qwen2.5-coder-32b-instruct`).
   - `.env` is gitignored — never commit real keys.
3. Frontend env: `mobileforge/frontend/.env.local` should have
   `NEXT_PUBLIC_API_URL=http://localhost:4000`.

## Run it

- **Run Task → "MobileForge: Run FULL app"** — starts backend (:4000) + frontend (:3000) together.
  Or run them individually ("Run backend (dev)" / "Run frontend (dev)").
- Open **http://localhost:3000**. Enter a beta key if the gate is on (`BETA_KEYS` in backend `.env`, or leave empty to disable).

## Verify things work

- **Run Task → "MobileForge: Check AI provider status"** — shows which provider is
  reachable and whether it'll use demo mode (needs backend running).
- **Run Task → "MobileForge: Test backend"** — 231 tests.
- **Run Task → "Typecheck backend" / "Typecheck frontend"** — before committing.
- **Run Task → "Build backend" / "Build frontend"** — production build check.

## Terminal equivalents (if you prefer the CLI)

```bash
# install
cd mobileforge/backend && npm install && cd ../frontend && npm install

# run (two terminals)
cd mobileforge/backend && npm run dev      # http://localhost:4000
cd mobileforge/frontend && npm run dev     # http://localhost:3000

# checks
cd mobileforge/backend && npm test && npx tsc --noEmit
cd mobileforge/frontend && npx tsc --noEmit && npm run build
```

## Where things live

- `mobileforge/backend/src/services/aiWeb.ts` — generation pipeline, provider chain, Ideate/blueprint.
- `mobileforge/backend/src/services/qualityGate.ts` — quality gate (dead UI, unreachable screens, accessibility, nav edges).
- `mobileforge/backend/src/routes/generate.ts` — generation + stream + suggest endpoints; `image.ts` — photo proxy.
- `mobileforge/frontend/app/builder/[id]/page.tsx` — the builder workspace (canvas, flow map, versions gallery, share).
- `mobileforge/frontend/components/ChatInterface.tsx` — chat, templates, build modes.
- `mobileforge/MARKET_STRATEGY.md` — competitive plan · `BETA_RELEASE_CHECKLIST.md` — deploy runbook.
