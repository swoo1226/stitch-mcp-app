const CACHE_NAME = 'clima-v2';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  // 업데이트 감지를 위해 skipWaiting 하지 않고 대기
  // 앱에서 명시적으로 SKIP_WAITING 메시지를 받으면 활성화
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 앱에서 SKIP_WAITING 메시지 수신 시 즉시 활성화
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

async function broadcastPushMessage(payload) {
  const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  clientList.forEach((client) => {
    client.postMessage({ type: 'PUSH_NOTIFICATION_RECEIVED', payload });
  });
  return clientList;
}

self.addEventListener('push', (event) => {
  const payload = event.data ? event.data.json() : {};

  event.waitUntil((async () => {
    const clientList = await broadcastPushMessage(payload);
    const hasVisibleClient = clientList.some((client) => client.visibilityState === 'visible');

    if (hasVisibleClient) {
      return;
    }

    await self.registration.showNotification(payload.title || 'Clima 알림', {
      body: payload.summary || '새로운 알림이 도착했어요.',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: payload.notificationId || 'clima-notification',
      data: {
        targetUrl: payload.targetUrl || '/',
      },
    });
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.targetUrl || '/';

  event.waitUntil((async () => {
    const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clientList) {
      if ('focus' in client) {
        await client.focus();
        client.postMessage({ type: 'PUSH_NOTIFICATION_CLICKED', targetUrl });
        if ('navigate' in client) {
          await client.navigate(targetUrl);
        }
        return;
      }
    }

    await self.clients.openWindow(targetUrl);
  })());
});

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil((async () => {
    if (!event.oldSubscription) {
      return;
    }

    await fetch('/api/push/subscribe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: event.oldSubscription.endpoint }),
    }).catch(() => null);
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/')
  ) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && (request.mode === 'navigate' || url.pathname.match(/\.(png|svg|ico|woff2?)$/))) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
  );
});
