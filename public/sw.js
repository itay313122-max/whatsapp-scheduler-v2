// Minimal service worker: enables install-to-home-screen and offline shell.
const CACHE = 'assistant-v5';
const SHELL = ['/assistant.html', '/manifest.webmanifest', '/icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  // Never cache API calls — always hit the network.
  if (request.method !== 'GET' || new URL(request.url).pathname.startsWith('/api/')) return;
  e.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).catch(() => caches.match('/assistant.html')))
  );
});
