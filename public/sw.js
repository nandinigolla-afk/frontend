// MPAS Service Worker v2
// Handles push notifications on mobile browsers

const VERSION = 'mpas-sw-v2';

self.addEventListener('install', (e) => {
  e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

// Show notification from service worker (called via reg.showNotification)
// This path is used by SocketContext.showNotification for mobile support
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing tab if open
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if ('navigate' in client) client.navigate(url);
          return;
        }
      }
      // Otherwise open new tab
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});

// Handle Web Push events (future: server-sent push when app is closed)
self.addEventListener('push', (event) => {
  let data = {
    title: '🚨 MPAS Alert',
    body: 'New missing person alert in your area.',
    tag: 'mpas-push',
    url: '/',
  };
  try { Object.assign(data, event.data.json()); } catch (e) {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: data.tag,
      requireInteraction: true,
      vibrate: [200, 100, 200],
      data: { url: data.url },
    })
  );
});
