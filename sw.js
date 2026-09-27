// Service Worker v5.5 - Universal Web Push (iOS, Android, Windows, Mac)
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
    let data = { title: 'نظام السراكي', body: 'إشعار جديد 🔔', url: '/' };
    try {
        if (e.data) {
            data = e.data.json();
        }
    } catch (err) {
        if (e.data) {
            data.body = e.data.text();
        }
    }

    const options = {
        body: data.body || '',
        icon: '/logo.png',
        badge: '/logo.png',
        data: data.url || '/',
        tag: data.tag || ('notif_' + Date.now()),
        renotify: true
    };

    // Only add vibrate if navigator.vibrate is supported (Android / Chrome)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        options.vibrate = [200, 100, 200];
    }

    e.waitUntil(
        self.registration.showNotification(data.title || 'نظام السراكي', options).catch(err => {
            console.error('showNotification error:', err);
            // Fallback with minimal options for strict iOS Safari versions
            return self.registration.showNotification(data.title || 'نظام السراكي', {
                body: data.body || '',
                icon: '/logo.png',
                data: data.url || '/'
            });
        })
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
