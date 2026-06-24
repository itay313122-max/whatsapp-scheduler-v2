import { Router, Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { PersistentStore } from '../services/persistentStore';

const router = Router();

interface Feedback {
  id: string;
  text: string;
  rating: number;        // 1–5, 0 = not given
  page: string;
  name: string;
  ua: string;
  createdAt: number;
}

// File-backed so tester reports survive restarts and can be reviewed later.
const store = new PersistentStore<Feedback>('feedback');

function sanitize(str: string): string {
  return str.replace(/[<>"'&]/g, c => ({ '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;' }[c] || c));
}

// POST /api/feedback — a tester submits a report.
router.post('/', (req: Request, res: Response) => {
  const { text, rating, page, name } = req.body || {};
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'text is required' });
  }
  if (text.length > 5000) {
    return res.status(400).json({ error: 'text too long (max 5000 chars)' });
  }
  const id = randomBytes(6).toString('base64url');
  const fb: Feedback = {
    id,
    text: sanitize(String(text).slice(0, 4000)),
    rating: Math.max(0, Math.min(5, Number(rating) || 0)),
    page: sanitize(String(page || '').slice(0, 200)),
    name: sanitize(String(name || '').slice(0, 80)),
    ua: String(req.headers['user-agent'] || '').slice(0, 300),
    createdAt: Date.now(),
  };
  store.set(id, fb);
  console.log(`[feedback] new report (${fb.rating}★) from "${fb.name || 'anon'}" on ${fb.page}`);
  return res.json({ ok: true, id });
});

// GET /api/feedback — review all reports. ALWAYS requires ADMIN_TOKEN.
// Pass as ?token=… query param or x-admin-token header.
const FALLBACK_TOKEN = randomBytes(24).toString('base64url');
router.get('/', (req: Request, res: Response) => {
  const admin = process.env.ADMIN_TOKEN || FALLBACK_TOKEN;
  if (!process.env.ADMIN_TOKEN) {
    console.log(`[feedback] ADMIN_TOKEN not set — using auto-generated token: ${admin}`);
  }
  const given = req.query.token || req.headers['x-admin-token'];
  if (given !== admin) return res.status(401).json({ error: 'unauthorized' });
  const all = [...store.entries()].map(([, v]) => v).sort((a, b) => b.createdAt - a.createdAt);
  const avg = all.filter(f => f.rating).reduce((s, f, _, arr) => s + f.rating / arr.length, 0);
  return res.json({ count: all.length, avgRating: Math.round(avg * 10) / 10, feedback: all });
});

export default router;
