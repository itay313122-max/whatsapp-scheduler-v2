"""
stock_scanner.py — scans Israeli and global stocks via yfinance.

Computes a simple BUY/HOLD/SELL signal from:
  - RSI(14)
  - 5-day vs 20-day moving average crossover

Output: src/data/stocks_live.json
"""
from __future__ import annotations

import json
import sys
from datetime import datetime
from pathlib import Path

import pandas as pd
import yfinance as yf

# ── Symbol list ───────────────────────────────────────────────────────────────
SYMBOLS = [
    # Israeli market
    {"symbol": "^TA35.TA",   "name": "ת\"א 35"},
    {"symbol": "HAPOALIM.TA","name": "בנק הפועלים"},
    {"symbol": "LEUMI.TA",   "name": "בנק לאומי"},
    {"symbol": "DISCOUNT.TA","name": "בנק דיסקונט"},
    {"symbol": "AZRIELI.TA", "name": "אזריאלי"},
    {"symbol": "RBLD.TA",    "name": "ריט 1 (נדל\"ן)"},
    # Global
    {"symbol": "^GSPC",      "name": "S&P 500"},
    {"symbol": "^IXIC",      "name": "NASDAQ"},
    {"symbol": "^VIX",       "name": "VIX"},
    {"symbol": "GC=F",       "name": "זהב"},
    {"symbol": "CL=F",       "name": "נפט"},
]

OUTPUT_PATH = Path(__file__).parent.parent / "citizen-impact-dashboard" / "src" / "data" / "stocks_live.json"

# ── Fallback data (used when network/Yahoo Finance is unavailable) ─────────────
_FALLBACK_STOCKS = [
    {"symbol": "^TA35.TA",    "name": 'ת"א 35',        "price": 2148.30, "change_pct":  1.24, "signal": "BUY"},
    {"symbol": "HAPOALIM.TA", "name": "בנק הפועלים",    "price":   35.82, "change_pct":  0.87, "signal": "BUY"},
    {"symbol": "LEUMI.TA",    "name": "בנק לאומי",      "price":   29.45, "change_pct": -0.34, "signal": "HOLD"},
    {"symbol": "DISCOUNT.TA", "name": "בנק דיסקונט",    "price":   14.90, "change_pct":  0.54, "signal": "HOLD"},
    {"symbol": "AZRIELI.TA",  "name": "אזריאלי",        "price":  220.50, "change_pct": -1.10, "signal": "SELL"},
    {"symbol": "RBLD.TA",     "name": 'ריט 1 (נדל"ן)',  "price":    9.24, "change_pct":  0.33, "signal": "HOLD"},
    {"symbol": "^GSPC",       "name": "S&P 500",         "price": 5312.15, "change_pct":  0.65, "signal": "BUY"},
    {"symbol": "^IXIC",       "name": "NASDAQ",           "price": 16820.40,"change_pct":  0.88, "signal": "BUY"},
    {"symbol": "^VIX",        "name": "VIX",              "price":   18.75, "change_pct": -3.20, "signal": "HOLD"},
    {"symbol": "GC=F",        "name": "זהב",              "price": 2385.00, "change_pct":  0.42, "signal": "BUY"},
    {"symbol": "CL=F",        "name": "נפט",              "price":   79.30, "change_pct": -0.75, "signal": "HOLD"},
]


# ── Signal logic ──────────────────────────────────────────────────────────────
def _rsi(series: pd.Series, period: int = 14) -> float:
    delta = series.diff().dropna()
    gains = delta.clip(lower=0)
    losses = -delta.clip(upper=0)
    avg_gain = gains.rolling(period).mean().iloc[-1]
    avg_loss = losses.rolling(period).mean().iloc[-1]
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return round(100 - (100 / (1 + rs)), 2)


def _signal(hist: pd.DataFrame) -> str:
    if hist is None or len(hist) < 21:
        return "HOLD"
    closes = hist["Close"].squeeze()
    rsi = _rsi(closes)
    ma5  = closes.rolling(5).mean().iloc[-1]
    ma20 = closes.rolling(20).mean().iloc[-1]

    if rsi < 35 and ma5 > ma20:
        return "BUY"
    if rsi > 65 and ma5 < ma20:
        return "SELL"
    return "HOLD"


# ── Fetch one symbol ──────────────────────────────────────────────────────────
def _fetch(symbol: str, name: str) -> dict:
    try:
        ticker = yf.Ticker(symbol)
        hist   = ticker.history(period="30d", interval="1d", auto_adjust=True)

        if hist.empty:
            raise ValueError("empty history")

        price      = round(float(hist["Close"].iloc[-1]), 2)
        prev_close = float(hist["Close"].iloc[-2]) if len(hist) >= 2 else price
        change_pct = round((price - prev_close) / prev_close * 100, 2) if prev_close else 0.0
        sig        = _signal(hist)

        return {
            "symbol":     symbol,
            "name":       name,
            "price":      price,
            "change_pct": change_pct,
            "signal":     sig,
            "ok":         True,
        }
    except Exception as exc:
        return {
            "symbol":     symbol,
            "name":       name,
            "price":      0,
            "change_pct": 0,
            "signal":     "HOLD",
            "ok":         False,
            "error":      str(exc),
        }


# ── Main ──────────────────────────────────────────────────────────────────────
def _network_ok() -> bool:
    try:
        r = yf.Ticker("^GSPC")
        h = r.history(period="2d")
        return not h.empty
    except Exception:
        return False


def run() -> dict:
    errors: list[str] = []

    print("  [0] Checking Yahoo Finance reachability...")
    online = _network_ok()

    if online:
        stocks_raw = []
        for item in SYMBOLS:
            print(f"  Fetching {item['symbol']:20s} — {item['name']}")
            result = _fetch(item["symbol"], item["name"])
            stocks_raw.append(result)
            if not result["ok"]:
                errors.append(f"{item['symbol']}: {result.get('error', 'unknown')}")
        clean = [{k: v for k, v in s.items() if k not in ("ok", "error")} for s in stocks_raw]
    else:
        print("  ⚠  Yahoo Finance not reachable — using fallback (demo) data")
        clean = list(_FALLBACK_STOCKS)
        errors.append("network_unavailable: using static demo data")

    payload = {
        "stocks":     clean,
        "updated_at": datetime.now().isoformat(timespec="seconds"),
        "errors":     errors,
        "source":     "live" if online else "fallback",
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2))
    return payload


if __name__ == "__main__":
    print("=" * 60)
    print("Stock Scanner — Citizen Impact")
    print("=" * 60)

    data = run()

    print()
    ok_count = sum(1 for s in data["stocks"] if s["price"] > 0)
    for s in data["stocks"]:
        arrow = "▲" if s["change_pct"] > 0 else ("▼" if s["change_pct"] < 0 else "—")
        color_tag = "+" if s["change_pct"] > 0 else ""
        print(f"  {s['symbol']:20s} {s['name']:20s}  "
              f"{s['price']:>10.2f}  {color_tag}{s['change_pct']:+.2f}%  [{s['signal']}]  {arrow}")

    print()
    if data["errors"]:
        print(f"⚠  Errors ({len(data['errors'])}):")
        for e in data["errors"]:
            print(f"   {e}")

    print(f"\n✓  Updated: {data['updated_at']}")
    print(f"✓  Saved:   {OUTPUT_PATH}")
    print(f"\n{'✅' if ok_count >= 8 else '❌'} Stocks with data: {ok_count} ({'≥8 OK' if ok_count >= 8 else '<8 FAIL'})")
    sys.exit(0 if ok_count >= 8 else 1)
