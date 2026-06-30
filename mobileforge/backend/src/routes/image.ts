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

// A PREMIUM themed placeholder: a tasteful gradient tinted by category plus a
// centered line icon picked from the query keyword. This looks like an
// intentional illustration rather than a "missing image", so apps look designed
// even when no real-photo provider is configured. (When PEXELS_API_KEY is set
// and reachable, real photos are served instead — this is only the fallback.)
//
// Each category bundles a gradient pair, an accent colour for the icon, and a
// stroke-based glyph path drawn on a 0..24 viewBox (Heroicons-style).
const CATEGORIES: { re: RegExp; grad: [string, string]; accent: string; icon: string }[] = [
  { re: /coffee|latte|espresso|cappuccino|tea|drink|cafe|beverage/i, grad: ['#fdf6ec', '#f5e6d3'], accent: '#b45309',
    icon: 'M4 8h13v4a5 5 0 01-5 5H9a5 5 0 01-5-5V8zM17 9h2a2 2 0 010 4h-2M6 2v2M10 2v2M14 2v2' },
  { re: /pizza|burger|food|dish|meal|plate|restaurant|salad|sushi|breakfast|dinner|lunch|recipe|cook|bowl/i, grad: ['#fef2f2', '#fde4e1'], accent: '#dc2626',
    icon: 'M4 3v8a3 3 0 003 3v7M4 3v5M7 3v5M20 3c-2 0-3 2-3 5s1 4 3 4v9' },
  { re: /nature|plant|leaf|garden|tree|forest|flower|green|botanic|eco/i, grad: ['#ecfdf5', '#d1fae5'], accent: '#059669',
    icon: 'M12 21v-7M12 14c0-4 3-8 8-9 0 5-3 9-8 9zM12 14c0-3-2-6-6-7 0 4 2 7 6 7z' },
  { re: /meditat|calm|yoga|zen|mindful|wellness|spa|relax|breath/i, grad: ['#eff6ff', '#dbeafe'], accent: '#2563eb',
    icon: 'M12 3a3 3 0 100 6 3 3 0 000-6zM3 20c2-3 5-4 9-4s7 1 9 4M5 13l3 2M19 13l-3 2' },
  { re: /person|portrait|people|avatar|profile|face|man|woman|user|smiling|headshot/i, grad: ['#f5f3ff', '#ede9fe'], accent: '#7c3aed',
    icon: 'M12 12a4 4 0 100-8 4 4 0 000 8zM5 21a7 7 0 0114 0' },
  { re: /music|song|playlist|album|artist|concert|audio|sound/i, grad: ['#fdf2f8', '#fce7f3'], accent: '#db2777',
    icon: 'M9 18V5l11-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zM20 16a3 3 0 11-6 0 3 3 0 016 0z' },
  { re: /travel|trip|destination|place|city|mountain|beach|vacation|tour|hotel|landmark/i, grad: ['#f0f9ff', '#e0f2fe'], accent: '#0284c7',
    icon: 'M3 20l6-12 4 7 3-5 5 10zM7 8a1.5 1.5 0 100-3 1.5 1.5 0 000 3z' },
  { re: /fitness|workout|gym|exercise|sport|run|training|muscle|athlete/i, grad: ['#fff7ed', '#ffedd5'], accent: '#ea580c',
    icon: 'M6.5 6.5l11 11M4 9l-1 1 3 3M20 15l1-1-3-3M8 4L6 6M16 20l2-2' },
  { re: /shop|product|store|fashion|clothes|shoe|bag|retail|sale|buy|cart/i, grad: ['#faf5ff', '#f3e8ff'], accent: '#9333ea',
    icon: 'M6 7h12l-1 13H7L6 7zM9 7V5a3 3 0 016 0v2' },
  { re: /tech|device|phone|app|computer|gadget|digital|screen/i, grad: ['#f8fafc', '#e2e8f0'], accent: '#475569',
    icon: 'M7 3h10a1 1 0 011 1v16a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1zM11 18h2' },
];
const DEFAULT_CAT = { grad: ['#eef2ff', '#e0e7ff'] as [string, string], accent: '#6366f1',
  icon: 'M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zM3 16l4-4 3 3 4-5 7 7' };

function svgFallback(query: string, w: number, h: number): string {
  const cat = CATEGORIES.find((c) => c.re.test(query)) || DEFAULT_CAT;
  const [c1, c2] = cat.grad;
  const s = Math.min(w, h);
  const icon = Math.round(s * 0.34);          // icon box size
  const x = Math.round((w - icon) / 2);
  const y = Math.round((h - icon) / 2);
  const sw = Math.max(1.2, 24 / icon * 1.6);  // stroke scaled so it stays crisp
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>
    </linearGradient></defs>
    <rect width="${w}" height="${h}" fill="url(#g)"/>
    <g transform="translate(${x},${y}) scale(${icon / 24})" fill="none" stroke="${cat.accent}"
       stroke-opacity="0.55" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">
      <path d="${cat.icon}"/>
    </g>
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
