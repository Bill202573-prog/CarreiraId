// Service Worker for Carreira PWA — push-only.
// Intentionally NO fetch handler so navigations are never intercepted.
// Previous version cached /index.html and could trap users on a stale shell.
const CACHE_NAME = 'carreira-v3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

// ========== PUSH NOTIFICATIONS ==========
self.addEventListener('push', (event) => {
  let data = { title: 'Carreira ID', body: 'Você tem uma nova notificação' };
  try {
    if (event.data) data = event.data.json();
  } catch (e) {
    if (event.data) data.body = event.data.text();
  }

  const options = {
    body: data.body || '',
    icon: data.icon || '/carreira-icon-512.png',
    badge: '/carreira-icon-512.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'carreira',
    renotify: true,
    data: { url: data.url || '/carreira' },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Carreira ID', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/carreira';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
