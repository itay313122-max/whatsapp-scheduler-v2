# MobileForge — Load & Variety Experiment

A reproducible harness that proves how much the generation engine can vary
(color, language, direction, genre, features) while staying stable and fully
self-contained (zero external dependencies, renders offline).

See [`../EXPERIMENT_REPORT.md`](../EXPERIMENT_REPORT.md) for the findings.

## What's here

- `apps/` — 7 app variations spanning 4 languages (EN/HE/ES/AR), LTR + RTL,
  light + dark, and 3 genres (food, fitness, travel).
- `build.ts` — turns an app JSX into a self-contained HTML document.
- `render.mjs` — screenshots an app on an iPhone viewport **with all network
  blocked**, so a clean render proves the app is offline-capable.
- `run-24h.sh` — runs a build+render round over every app on an interval,
  logging timing and errors to `results.log`.

## Run a single app

```bash
cd mobileforge/backend
node --import tsx ../experiments/build.ts ../experiments/apps/app1-food-en.jsx /tmp/app1.html "FoodDash"
node ../experiments/render.mjs /tmp/app1.html /tmp/app1.png
```

## Run the 24-hour experiment (on an always-on machine)

```bash
cd mobileforge
./experiments/run-24h.sh              # a round every 3h for 24h
INTERVAL=1800 ./experiments/run-24h.sh  # every 30 min
```

Each round rebuilds and re-renders all variations and appends a line to
`experiments/results.log`. Because the apps are self-contained, the whole
experiment runs offline.

> Note: run this on your own machine or a server — the cloud preview sandbox is
> ephemeral and not suited to unattended 24-hour runs.
