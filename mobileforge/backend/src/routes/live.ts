import { Router, Request, Response } from 'express';
import { PersistentStore } from '../services/persistentStore';

const router = Router();

// Persistable part of a session — the doc + metadata survive restarts.
interface LiveDoc {
  htmlDoc: string;
  appName: string;
  version: number;
  updatedAt: number;
}

interface LiveSession extends LiveDoc {
  clients: Set<Response>;
}

// Doc data is file-backed so a restart doesn't drop a phone's live preview;
// the SSE client connections are inherently transient and held in memory only.
const docs = new PersistentStore<LiveDoc>('live');
const clientsById = new Map<string, Set<Response>>();

const MAX_SESSIONS = 300;
const TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

function clientsOf(id: string): Set<Response> {
  let c = clientsById.get(id);
  if (!c) {
    c = new Set();
    clientsById.set(id, c);
  }
  return c;
}

function cleanup() {
  const now = Date.now();
  for (const [id, d] of docs) {
    if (now - d.updatedAt > TTL_MS && clientsOf(id).size === 0) {
      docs.delete(id);
      clientsById.delete(id);
    }
  }
  if (docs.size > MAX_SESSIONS) {
    const sorted = [...docs.entries()].sort((a, b) => a[1].updatedAt - b[1].updatedAt);
    for (const [id] of sorted.slice(0, docs.size - MAX_SESSIONS)) {
      if (clientsOf(id).size === 0) {
        docs.delete(id);
        clientsById.delete(id);
      }
    }
  }
}

function getOrCreate(id: string): LiveSession {
  let d = docs.get(id);
  if (!d) {
    d = { htmlDoc: '', appName: 'MobileForge App', version: 0, updatedAt: Date.now() };
    docs.set(id, d);
  }
  return { ...d, clients: clientsOf(id) };
}

// POST /api/live/:id — the builder pushes the latest app; subscribers reload.
router.post('/:id', (req: Request, res: Response) => {
  const { htmlDoc, appName } = req.body;
  if (typeof htmlDoc !== 'string' || !htmlDoc) {
    return res.status(400).json({ error: 'htmlDoc is required' });
  }
  cleanup();

  const id = req.params.id;
  const prev = docs.get(id);
  const next: LiveDoc = {
    htmlDoc,
    appName: appName || prev?.appName || 'MobileForge App',
    version: (prev?.version || 0) + 1,
    updatedAt: Date.now(),
  };
  docs.set(id, next);

  // Notify every connected device to pull the new version.
  const clients = clientsOf(id);
  for (const client of clients) {
    try { client.write(`event: update\ndata: ${next.version}\n\n`); } catch { /* dropped */ }
  }

  return res.json({ ok: true, version: next.version, clients: clients.size });
});

// GET /api/live/:id/doc — latest raw HTML document for this session.
router.get('/:id/doc', (req: Request, res: Response) => {
  const s = docs.get(req.params.id);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  if (!s || !s.htmlDoc) {
    return res.send('<!doctype html><meta charset="utf-8"><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;color:#64748b">ממתין לאפליקציה מהמחשב…</body>');
  }
  return res.send(s.htmlDoc);
});

// GET /api/live/:id/stream — SSE channel: emits an "update" event on each push.
router.get('/:id/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders?.();

  const s = getOrCreate(req.params.id);
  const clients = clientsOf(req.params.id);
  clients.add(res);

  // Greet + tell the client the current version so it can do an initial load.
  res.write(`event: hello\ndata: ${s.version}\n\n`);

  // Keep-alive ping so proxies don't close the idle connection.
  const ping = setInterval(() => {
    try { res.write(': ping\n\n'); } catch { /* ignore */ }
  }, 25000);

  req.on('close', () => {
    clearInterval(ping);
    clients.delete(res);
  });
});

// GET /api/live/:id — the wrapper page a phone opens: renders the latest app
// and live-reloads it whenever the builder pushes a change.
router.get('/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.send(`<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>MobileForge — Live</title>
<style>
  html,body{margin:0;height:100%;background:#0b0b0f;overflow:hidden}
  #frame{position:fixed;inset:0;width:100%;height:100%;border:0;background:#fff}
  #badge{position:fixed;top:env(safe-area-inset-top,10px);left:10px;z-index:10;display:flex;align-items:center;gap:6px;
    background:rgba(11,20,38,.82);color:#fff;font-family:system-ui;font-size:12px;font-weight:600;
    padding:6px 11px;border-radius:20px;backdrop-filter:blur(8px);transition:opacity .4s}
  #dot{width:8px;height:8px;border-radius:50%;background:#16C784;box-shadow:0 0 0 0 rgba(22,199,132,.6);animation:p 1.6s infinite}
  @keyframes p{0%{box-shadow:0 0 0 0 rgba(22,199,132,.5)}70%{box-shadow:0 0 0 7px rgba(22,199,132,0)}100%{box-shadow:0 0 0 0 rgba(22,199,132,0)}}
</style>
</head>
<body>
  <div id="badge"><span id="dot"></span><span id="label">חי · מחובר</span></div>
  <iframe id="frame" title="app"></iframe>
<script>
  var id = ${JSON.stringify(id)};
  var frame = document.getElementById('frame');
  var label = document.getElementById('label');
  var badge = document.getElementById('badge');
  var lastVer = -1;
  var hideTimer;

  function flash(text) {
    label.textContent = text;
    badge.style.opacity = '1';
    clearTimeout(hideTimer);
    hideTimer = setTimeout(function(){ badge.style.opacity = '0.35'; }, 1600);
  }

  function load(reason) {
    fetch('/api/live/' + id + '/doc', { cache: 'no-store' })
      .then(function(r){ return r.text(); })
      .then(function(html){ frame.srcdoc = html; flash(reason || 'עודכן עכשיו'); })
      .catch(function(){ flash('שגיאת רשת'); });
  }

  function connect() {
    var es = new EventSource('/api/live/' + id + '/stream');
    es.addEventListener('hello', function(e){ if (e.data !== String(lastVer)) { lastVer = e.data; load('מחובר'); } });
    es.addEventListener('update', function(e){ if (e.data !== String(lastVer)) { lastVer = e.data; load('עודכן עכשיו'); } });
    es.onerror = function(){ label.textContent = 'מתחבר מחדש…'; badge.style.opacity = '1'; };
    es.onopen = function(){ flash('חי · מחובר'); };
  }

  load('טוען…');
  connect();
</script>
</body>
</html>`);
});

export default router;
