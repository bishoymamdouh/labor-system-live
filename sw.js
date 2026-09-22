// Service Worker v5.3 - Push only, native network routing
self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          return caches.delete(cache);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('push', e => {
    const data = e.data ? e.data.json() : { title: 'نظام السراكي', body: 'إشعار جديد', url: '/' };
    const options = {
        body: data.body,
        icon: '/logo.png',
        badge: '/logo.png',
        data: data.url,
        requireInteraction: true,
        vibrate: [200, 100, 200]
    };
    e.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', e => {
    e.notification.close();
    const targetUrl = e.notification.data || '/';
    const recordIdMatch = targetUrl.match(/view_record=([^&]+)/);
    const viewRecordId = recordIdMatch ? recordIdMatch[1] : null;

    e.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            if (clientList.length > 0) {
                let client = clientList[0];
                if (viewRecordId) {
                    client.postMessage({ type: 'JUMP_TO_RECORD', id: viewRecordId });
                    return client.focus();
                } else {
                    return client.navigate(targetUrl).then(c => c ? c.focus() : client.focus());
                }
            }
            return clients.openWindow(targetUrl);
        })
    );
});
