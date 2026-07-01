import { Router, Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { PersistentStore } from '../services/persistentStore';

// Public apps gallery — users publish a generated app and everyone can browse
// and open it. Mirrors the share store but is an explicit, longer-lived, public
// listing (share links are unlisted/ephemeral; gallery entries are discoverable).
// File-backed so it survives restarts.

const router = Router();

interface GalleryApp {
  htmlDoc: string;
  appName: string;
  description: string;
  primary: string;   // accent color for the card
  createdAt: number;
  views: number;
}

const store = new PersistentStore<GalleryApp>('gallery');

const MAX_APPS = 300;
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function cleanup() {
  const now = Date.now();
  for (const [id, app] of store) {
    if (now - app.createdAt > TTL_MS) store.delete(id);
  }
  if (store.size > MAX_APPS) {
    const sorted = [...store.entries()].sort((a, b) => a[1].createdAt - b[1].createdAt);
    for (const [id] of sorted.slice(0, store.size - MAX_APPS)) store.delete(id);
  }
}

// POST /api/gallery — publish an app to the public gallery
router.post('/', (req: Request, res: Response) => {
  const { htmlDoc, appName, description, primary } = req.body;
  if (!htmlDoc || typeof htmlDoc !== 'string') return res.status(400).json({ error: 'htmlDoc is required' });
  if (htmlDoc.length > 2 * 1024 * 1024) return res.status(400).json({ error: 'htmlDoc too large (max 2MB)' });

  cleanup();
  const id = randomBytes(6).toString('base64url');
  store.set(id, {
    htmlDoc,
    appName: String(appName || 'Untitled App').slice(0, 80),
    description: String(description || '').slice(0, 200),
    primary: /^#[0-9a-fA-F]{3,8}$/.test(String(primary)) ? primary : '#6366F1',
    createdAt: Date.now(),
    views: 0,
  });
  return res.json({ id });
});

// GET /api/gallery — list published apps (newest first), metadata only (no htmlDoc)
router.get('/', (_req: Request, res: Response) => {
  cleanup();
  const items = [...store.entries()]
    .map(([id, a]) => ({ id, appName: a.appName, description: a.description, primary: a.primary, createdAt: a.createdAt, views: a.views }))
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, MAX_APPS);
  return res.json({ items, count: items.length });
});

// GET /api/gallery/:id/app — serve the app's HTML (for the iframe preview / open)
router.get('/:id/app', (req: Request, res: Response) => {
  const app = store.get(req.params.id);
  if (!app) return res.status(404).send('<h1>App not found or expired</h1>');
  app.views += 1;
  store.set(req.params.id, app);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(app.htmlDoc);
});

export default router;
