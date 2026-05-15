// Kill-switch for carreira-sw.js.
// Previous versions caused FetchEvent errors that blocked carreiraid.com.br.
// No fetch handler, no push handler, no cache — just self-cleanup.

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
          if (!url.searchParams.has('sw-cleanup')) {
            url.searchParams.set('sw-cleanup', Date.now().toString());
          }
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
