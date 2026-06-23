import { Request, Response, NextFunction } from 'express';

/**
 * Cost / abuse guard for the expensive LLM endpoints.
 *
 * Three layers:
 *  - per-client per-minute burst limit
 *  - per-client per-day quota
 *  - a GLOBAL per-day ceiling across all clients (hard cost cap)
 *
 * All in-memory (single instance). Limits are read at call time so they can be
 * configured via env and overridden in tests.
 */

interface Bucket {
  minuteCount: number;
  minuteStart: number;
  dayCount: number;
  dayStart: number;
}

const buckets = new Map<string, Bucket>();
let globalDay = { count: 0, start: Date.now() };

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

function limits() {
  return {
    perMin: parseInt(process.env.RATE_LIMIT_PER_MIN || '10', 10),
    perDay: parseInt(process.env.RATE_LIMIT_PER_DAY || '150', 10),
    globalPerDay: parseInt(process.env.GLOBAL_DAILY_CAP || '5000', 10),
  };
}

function clientKey(req: Request): string {
  // Prefer the auth token (stable per user) over IP when present.
  const auth = req.headers['authorization'];
  if (typeof auth === 'string' && auth.length > 8) return 'a:' + auth.slice(-24);
  const fwd = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim();
  return 'ip:' + (fwd || req.ip || req.socket.remoteAddress || 'unknown');
}

export function rateLimit(req: Request, res: Response, next: NextFunction) {
  const now = Date.now();
  const { perMin, perDay, globalPerDay } = limits();

  // Global daily cost ceiling.
  if (now - globalDay.start > DAY) globalDay = { count: 0, start: now };
  if (globalDay.count >= globalPerDay) {
    res.setHeader('Retry-After', '3600');
    return res.status(429).json({
      error: 'SERVICE_BUSY',
      message: 'המערכת בעומס יומי גבוה. נסה שוב בעוד זמן מה.',
    });
  }

  const key = clientKey(req);
  let b = buckets.get(key);
  if (!b) { b = { minuteCount: 0, minuteStart: now, dayCount: 0, dayStart: now }; buckets.set(key, b); }
  if (now - b.minuteStart > MINUTE) { b.minuteCount = 0; b.minuteStart = now; }
  if (now - b.dayStart > DAY) { b.dayCount = 0; b.dayStart = now; }

  if (b.minuteCount >= perMin) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({
      error: 'RATE_LIMITED',
      message: 'יותר מדי בקשות בזמן קצר. המתן רגע ונסה שוב.',
    });
  }
  if (b.dayCount >= perDay) {
    res.setHeader('Retry-After', '3600');
    return res.status(429).json({
      error: 'DAILY_LIMIT',
      message: 'הגעת למכסת הבנייה היומית. נסה שוב מחר.',
    });
  }

  b.minuteCount += 1;
  b.dayCount += 1;
  globalDay.count += 1;
  return next();
}

/** Test helper — clears all counters. */
export function __resetRateLimit() {
  buckets.clear();
  globalDay = { count: 0, start: Date.now() };
}

// Periodic cleanup of stale buckets (don't keep the process alive for it).
const timer = setInterval(() => {
  const now = Date.now();
  for (const [k, b] of buckets) if (now - b.dayStart > DAY) buckets.delete(k);
}, 60 * 60 * 1000);
timer.unref?.();
