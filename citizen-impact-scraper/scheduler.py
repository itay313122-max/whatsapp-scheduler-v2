"""
scheduler.py — orchestrates all background jobs:

  • Daily  (06:00 Asia/Jerusalem): scrape → update xlsx → recalc validate
  • Hourly (every 60 min):         stock_scanner + news_scanner → update JSON files

Usage:
    python scheduler.py           # runs all jobs immediately, then schedules
    python scheduler.py --once    # single run of all jobs, then exit
"""
from __future__ import annotations

import atexit
import json
import signal
import subprocess
import sys
import traceback
from datetime import datetime
from pathlib import Path

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

import config
from scraper import scrape_all
from updater import run_update

# ── Logger ────────────────────────────────────────────────────────────────────
LOG_PATH = Path(config.LOG_PATH)
LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
MAX_LOG_BYTES = 1_000_000  # 1 MB


def _rotate_log() -> None:
    if LOG_PATH.exists() and LOG_PATH.stat().st_size > MAX_LOG_BYTES:
        LOG_PATH.rename(LOG_PATH.with_suffix(".bak.txt"))


def log(status: str, details: dict) -> None:
    _rotate_log()
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    parts = [f"[{ts}] STATUS={status}"]
    for k, v in details.items():
        parts.append(f"{k}={v}")
    line = " | ".join(parts) + "\n"
    with LOG_PATH.open("a", encoding="utf-8") as f:
        f.write(line)
    print(line.strip())


# ── Financial feed pipeline ───────────────────────────────────────────────────
def run_financial_feed() -> None:
    print(f"\n{'─' * 60}")
    print(f"Financial feed start: {datetime.now().isoformat(timespec='seconds')}")
    try:
        _here = Path(__file__).parent
        for script in ["stock_scanner.py", "news_scanner.py"]:
            result = subprocess.run(
                [sys.executable, str(_here / script)],
                capture_output=True, text=True, timeout=120,
            )
            status = "success" if result.returncode == 0 else "error"
            log(f"feed_{script.replace('.py','')}", {
                "status": status,
                "lines": len(result.stdout.splitlines()),
            })
            if result.returncode != 0:
                log("feed_error", {"script": script, "detail": result.stderr.splitlines()[-1] if result.stderr else "unknown"})
    except Exception:
        log("feed_error", {"detail": traceback.format_exc().splitlines()[-1]})


# ── Main pipeline ─────────────────────────────────────────────────────────────
def run_pipeline() -> None:
    print(f"\n{'=' * 60}")
    print(f"Pipeline start: {datetime.now().isoformat(timespec='seconds')}")
    print(f"{'=' * 60}")

    try:
        # 1. Scrape
        result = scrape_all()

        # 2. Update xlsx
        update_summary = run_update(config.EXCEL_PATH, result)

        # 3. Validate with recalc
        recalc_ok = False
        recalc_errors = 0
        try:
            sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
            from recalc import recalc as _recalc
            import io
            from contextlib import redirect_stdout
            buf = io.StringIO()
            try:
                with redirect_stdout(buf):
                    _recalc(config.EXCEL_PATH)
                recalc_ok = True
            except SystemExit as e:
                recalc_ok = (e.code == 0)
        except Exception as exc:
            recalc_errors = 1

        status = (
            "success" if update_summary.get("ok") and recalc_ok
            else "partial" if update_summary.get("ok")
            else "error"
        )

        log(status, {
            "pages":          len(result.pages),
            "kpis_updated":   update_summary.get("kpi_cells_updated", 0),
            "contact_updated": update_summary.get("contact_cells_updated", 0),
            "recalc_ok":      recalc_ok,
            "scrape_errors":  len(result.errors),
        })

    except Exception:
        log("error", {"detail": traceback.format_exc().splitlines()[-1]})


# ── Entry point ───────────────────────────────────────────────────────────────
def main() -> None:
    once = "--once" in sys.argv

    # Run immediately on start
    run_financial_feed()
    run_pipeline()

    if once:
        print("--once mode: exiting after first run.")
        return

    scheduler = BlockingScheduler(timezone="Asia/Jerusalem")
    # Daily scrape + xlsx update
    scheduler.add_job(
        run_pipeline,
        CronTrigger(
            hour=config.SCHEDULE_HOUR,
            minute=config.SCHEDULE_MINUTE,
            timezone="Asia/Jerusalem",
        ),
        id="citizen_impact_daily",
        name="Citizen Impact daily update",
        misfire_grace_time=3600,
    )

    # Hourly financial feed (stocks + news)
    scheduler.add_job(
        run_financial_feed,
        IntervalTrigger(hours=1),
        id="financial_feed_hourly",
        name="Financial feed hourly update",
        misfire_grace_time=600,
    )

    def _shutdown(signum=None, frame=None):
        print("\nShutting down scheduler...")
        scheduler.shutdown(wait=False)
        sys.exit(0)

    atexit.register(scheduler.shutdown)
    signal.signal(signal.SIGTERM, _shutdown)
    signal.signal(signal.SIGINT, _shutdown)

    print(f"\nScheduler running — next run at "
          f"{config.SCHEDULE_HOUR:02d}:{config.SCHEDULE_MINUTE:02d} (Asia/Jerusalem)")
    print("Press Ctrl+C to stop.\n")
    scheduler.start()


if __name__ == "__main__":
    main()
