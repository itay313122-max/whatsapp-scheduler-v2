import { Router, Request, Response } from 'express';

// Photographic-image proxy for generated apps.
//
// WHY THIS EXISTS
// ---------------
// Generated apps used SVG placeholders for every image — the single biggest
// visual gap vs. Google Stitch, whose apps show real photos. This endpoint lets
// a generated app request a real keyword-matched photo via a stable, same-domain
// URL, while NEVER breaking: if no provider key is set, the network is blocked,
// or the fetch fails, it returns a tasteful SVG placeholder instead. So apps get
// real photos when possible and always render either way (preserving the
// offline-resilient guarantee the renderer was built around).
//
// Provider: Pexels (free key at pexels.com/api). Set PEXELS_API_KEY to enable.

const router = Router();

// Small in-memory LRU-ish cache: query+size → resolved image bytes (or null when
// we resolved to "no photo available, use SVG"). Bounded so it can't grow forever.
interface CacheEntry { buf: Buffer; type: string; at: number }
const cache = new Map<string, CacheEntry>();
const CACHE_MAX = 200;
const CACHE_TTL_MS = 1000 * 60 * 60; // 1h

function cacheGet(key: string): CacheEntry | null {
  const e = cache.get(key);
  if (!e) return null;
  if (Date.now() - e.at > CACHE_TTL_MS) { cache.delete(key); return null; }
  // refresh LRU position
  cache.delete(key); cache.set(key, e);
  return e;
}
function cacheSet(key: string, buf: Buffer, type: string) {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { buf, type, at: Date.now() });
}

const clampDim = (v: unknown, def: number) => {
  const n = parseInt(String(v ?? ''), 10);
  if (!Number.isFinite(n)) return def;
  return Math.max(16, Math.min(1600, n));
};

// A calm gradient SVG so the fallback still looks intentional (never a broken
// image, never the "generic AI" purple). Tint is derived from the query so two
// different subjects don't look identical.
function svgFallback(query: string, w: number, h: number): string {
  const palettes = [
    ['#eef2ff', '#e0e7ff'], ['#ecfdf5', '#d1fae5'], ['#fef2f2', '#fee2e2'],
    ['#fffbeb', '#fef3c7'], ['#f5f3ff', '#ede9fe'], ['#f0f9ff', '#e0f2fe'],
  ];
  let hash = 0;
  for (let i = 0; i < query.length; i++) hash = (hash * 31 + query.charCodeAt(i)) >>> 0;
  const [c1, c2] = palettes[hash % palettes.length];
  const label = (query || 'image').slice(0, 24).replace(/[<>&]/g, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>
    </linearGradient></defs>
    <rect width="${w}" height="${h}" fill="url(#g)"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
      fill="#94a3b8" font-family="system-ui,sans-serif" font-size="${Math.max(11, Math.round(Math.min(w, h) / 12))}">${label}</text>
  </svg>`;
}

function sendSvg(res: Response, query: string, w: number, h: number, reason: string) {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.setHeader('X-MF-Image', `fallback:${reason}`);
  res.send(svgFallback(query, w, h));
}

// GET /api/image?q=coffee&w=400&h=300
router.get('/', async (req: Request, res: Response) => {
  const query = String(req.query.q ?? '').trim().slice(0, 80) || 'abstract';
  const w = clampDim(req.query.w, 400);
  const h = clampDim(req.query.h, 300);
  const key = `${query}|${w}x${h}`;

  // Cached bytes (real photo we fetched earlier)
  const hit = cacheGet(key);
  if (hit) {
    res.setHeader('Content-Type', hit.type);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('X-MF-Image', 'cache');
    return res.send(hit.buf);
  }

  const pexelsKey = process.env.PEXELS_API_KEY;
  if (!pexelsKey || pexelsKey.startsWith('placeholder')) {
    return sendSvg(res, query, w, h, 'no-key');
  }

  try {
    // 1. Search Pexels for a matching photo.
    const searchUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=${w >= h ? 'landscape' : 'portrait'}`;
    const sr = await fetch(searchUrl, { headers: { Authorization: pexelsKey } });
    if (!sr.ok) return sendSvg(res, query, w, h, `search-${sr.status}`);
    const data = await sr.json() as any;
    const photo = data?.photos?.[0];
    const srcUrl: string | undefined = photo?.src?.large || photo?.src?.medium || photo?.src?.original;
    if (!srcUrl) return sendSvg(res, query, w, h, 'no-result');

    // 2. Fetch the actual image bytes and proxy them (so the app never talks to
    //    Pexels directly and we can cache + control caching headers).
    const ir = await fetch(srcUrl);
    if (!ir.ok) return sendSvg(res, query, w, h, `img-${ir.status}`);
    const type = ir.headers.get('content-type') || 'image/jpeg';
    const buf = Buffer.from(await ir.arrayBuffer());
    cacheSet(key, buf, type);

    res.setHeader('Content-Type', type);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('X-MF-Image', 'pexels');
    return res.send(buf);
  } catch (err) {
    console.warn('[image] proxy failed — serving SVG fallback:', (err as Error).message);
    return sendSvg(res, query, w, h, 'error');
  }
});

export default router;
