import { Router, Request, Response } from 'express';
import { randomBytes } from 'crypto';

const router = Router();

interface SharedApp {
  htmlDoc: string;
  appName: string;
  createdAt: number;
}

const store = new Map<string, SharedApp>();

const MAX_APPS = 500;
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function cleanup() {
  const now = Date.now();
  for (const [id, app] of store) {
    if (now - app.createdAt > TTL_MS) store.delete(id);
  }
  if (store.size > MAX_APPS) {
    const sorted = [...store.entries()].sort((a, b) => a[1].createdAt - b[1].createdAt);
    const toRemove = sorted.slice(0, store.size - MAX_APPS);
    for (const [id] of toRemove) store.delete(id);
  }
}

// POST /api/share — store an app and return share ID
router.post('/', (req: Request, res: Response) => {
  const { htmlDoc, appName } = req.body;
  if (!htmlDoc) return res.status(400).json({ error: 'htmlDoc is required' });

  cleanup();

  const id = randomBytes(6).toString('base64url');
  store.set(id, { htmlDoc, appName: appName || 'MobileForge App', createdAt: Date.now() });

  const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`;
  const shareUrl = `${baseUrl}/api/share/${id}`;

  return res.json({ id, shareUrl });
});

// GET /api/share/:id — serve the app as a standalone HTML page
router.get('/:id', (req: Request, res: Response) => {
  const app = store.get(req.params.id);
  if (!app) return res.status(404).send('<h1>App not found or expired</h1>');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(app.htmlDoc);
});

// GET /api/share/:id/download — download as HTML file
router.get('/:id/download', (req: Request, res: Response) => {
  const app = store.get(req.params.id);
  if (!app) return res.status(404).json({ error: 'Not found' });

  const filename = `${app.appName.replace(/[^a-zA-Z0-9֐-׿]/g, '_')}.html`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.send(app.htmlDoc);
});

// GET /api/share/:id/pwa — download as PWA-ready HTML with manifest
router.get('/:id/pwa', (req: Request, res: Response) => {
  const app = store.get(req.params.id);
  if (!app) return res.status(404).json({ error: 'Not found' });

  const manifest = JSON.stringify({
    name: app.appName,
    short_name: app.appName.slice(0, 12),
    start_url: '.',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#6366f1',
    icons: [{
      src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">📱</text></svg>',
      sizes: '512x512',
      type: 'image/svg+xml',
    }],
  }, null, 2);

  const sw = `self.addEventListener('install',e=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(clients.claim()));self.addEventListener('fetch',e=>e.respondWith(fetch(e.request).catch(()=>caches.match(e.request))));`;

  const pwaHtml = app.htmlDoc.replace(
    '</head>',
    `<link rel="manifest" href="data:application/json;base64,${Buffer.from(manifest).toString('base64')}">\n<script>${sw}</script>\n</head>`
  );

  const filename = `${app.appName.replace(/[^a-zA-Z0-9֐-׿]/g, '_')}_pwa.html`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.send(pwaHtml);
});

export default router;
