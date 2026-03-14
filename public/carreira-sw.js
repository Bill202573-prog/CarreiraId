// Service Worker for Carreira PWA
// Scope: '/' on carreiraid.com.br, '/carreira' on atletaid.com.br
const CACHE_NAME = 'carreira-v1';

self.addEventListener('install', (event) => {
  // Don't skip waiting automatically - let PWAUpdatePrompt control it
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Don't intercept OAuth redirects
  if (url.pathname.startsWith('/~oauth')) return;
  
  // For navigation requests, serve index.html (SPA fallback)
  const isCarreiraDomain = ['carreiraid.com.br', 'www.carreiraid.com.br'].includes(url.hostname);
  const isCarreiraRoute = url.pathname.startsWith('/carreira');
  
  if (event.request.mode === 'navigate' && (isCarreiraDomain || isCarreiraRoute)) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }
});

// ========== PUSH NOTIFICATIONS (Carreira ID) ==========
self.addEventListener('push', (event) => {
  let data = { title: 'Carreira ID', body: 'Você tem uma nova notificação' };
  
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || '',
    icon: data.icon || '/carreira-icon-512.png',
    badge: '/carreira-icon-512.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'carreira',
    renotify: true,
    data: {
      url: data.url || '/carreira',
    },
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
