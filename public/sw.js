// Kill-switch service worker.
// Replaces the previous Workbox-generated SW that was caching a stale shell
// and breaking carreiraid.com.br on returning visitors.
// Strategy: on activate, drop all caches, navigate every controlled client to
// a cache-busting URL, then unregister. No fetch handler — never intercept.

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      await self.clients.claim();
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      await Promise.all(clients.map((c) => {
        try {
          const url = new URL(c.url);
          url.searchParams.set('sw-cleanup', Date.now().toString());
          return c.navigate(url.toString());
        } catch (e) {
          return Promise.resolve();
        }
      }));
    } finally {
      try { await self.registration.unregister(); } catch (e) {}
    }
  })());
});
