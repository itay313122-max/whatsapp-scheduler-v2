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

// POST /api/feedback — a tester submits a report.
router.post('/', (req: Request, res: Response) => {
  const { text, rating, page, name } = req.body || {};
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'text is required' });
  }
  const id = randomBytes(6).toString('base64url');
  const fb: Feedback = {
    id,
    text: String(text).slice(0, 4000),
    rating: Math.max(0, Math.min(5, Number(rating) || 0)),
    page: String(page || '').slice(0, 200),
    name: String(name || '').slice(0, 80),
    ua: String(req.headers['user-agent'] || '').slice(0, 300),
    createdAt: Date.now(),
  };
  store.set(id, fb);
  console.log(`[feedback] new report (${fb.rating}★) from "${fb.name || 'anon'}" on ${fb.page}`);
  return res.json({ ok: true, id });
});

// GET /api/feedback — review all reports. Protected by ADMIN_TOKEN when set
// (pass ?token=… or x-admin-token header); open in local/demo if unset.
router.get('/', (req: Request, res: Response) => {
  const admin = process.env.ADMIN_TOKEN;
  if (admin) {
    const given = req.query.token || req.headers['x-admin-token'];
    if (given !== admin) return res.status(401).json({ error: 'unauthorized' });
  }
  const all = [...store.entries()].map(([, v]) => v).sort((a, b) => b.createdAt - a.createdAt);
  const avg = all.filter(f => f.rating).reduce((s, f, _, arr) => s + f.rating / arr.length, 0);
  return res.json({ count: all.length, avgRating: Math.round(avg * 10) / 10, feedback: all });
});

export default router;
