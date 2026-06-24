#!/usr/bin/env bash
#
# 24-hour load & variety experiment.
# Every INTERVAL, builds + renders every app variation, records timing and
# error counts, and appends a round to results.log. Runs reliably on any
# always-on machine (unlike the ephemeral cloud sandbox).
#
#   ./run-24h.sh            # default: a round every 3 hours for 24h
#   INTERVAL=1800 ./run-24h.sh   # a round every 30 min
#
# Run from the mobileforge/ directory.

set -uo pipefail
cd "$(dirname "$0")/.."          # → mobileforge/
HERE="experiments"
OUT="$HERE/out"; mkdir -p "$OUT"
LOG="$HERE/results.log"
INTERVAL="${INTERVAL:-10800}"    # 3 hours
DURATION="${DURATION:-86400}"    # 24 hours
END=$(( $(date +%s) + DURATION ))
round=0

echo "=== Experiment started $(date) — round every $((INTERVAL/60)) min for $((DURATION/3600))h ===" | tee -a "$LOG"

while [ "$(date +%s)" -lt "$END" ]; do
  round=$((round+1))
  ok=0; fail=0
  echo "--- Round $round @ $(date '+%Y-%m-%d %H:%M') ---" | tee -a "$LOG"
  for jsx in "$HERE"/apps/*.jsx; do
    name=$(basename "$jsx" .jsx)
    ( cd backend && node --import tsx "../$HERE/build.ts" "../$jsx" "../$OUT/$name.html" "$name" ) >/dev/null 2>&1
    res=$(node "$HERE/render.mjs" "$OUT/$name.html" "$OUT/${name}-r${round}.png" 2>&1)
    if echo "$res" | grep -q clean; then ok=$((ok+1)); else fail=$((fail+1)); echo "   FAIL $name: $res" | tee -a "$LOG"; fi
  done
  echo "   round $round: $ok clean, $fail failed" | tee -a "$LOG"
  [ "$(date +%s)" -lt "$END" ] && sleep "$INTERVAL"
done

echo "=== Experiment finished $(date) — $round rounds ===" | tee -a "$LOG"
