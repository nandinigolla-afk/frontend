// MPAS Service Worker v3 — Background Push Notifications
const VERSION = 'mpas-sw-v3';

self.addEventListener('install',  e => e.waitUntil(self.skipWaiting()));
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// Handle Web Push from server (works when browser is CLOSED)
self.addEventListener('push', (event) => {
  let data = { title: '🚨 MPAS Alert', body: 'New missing person alert in your area.', tag: 'mpas', url: '/' };
  try { Object.assign(data, event.data.json()); } catch (e) {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body             : data.body,
      icon             : '/favicon.ico',
      badge            : '/favicon.ico',
      tag              : data.tag,
      requireInteraction: true,
      vibrate          : [200, 100, 200],
      data             : { url: data.url },
    })
  );
});

// Handle notification click — open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if ('navigate' in client) client.navigate(url);
          return;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
