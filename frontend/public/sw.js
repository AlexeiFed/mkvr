/**
 * @file: sw.js
 * @description: Service Worker для обработки push-уведомлений
 * @created: 2025-01-29
 */

const CACHE_NAME = 'mkvr-v1';
const urlsToCache = [
    '/mkvr/',
    '/mkvr/index.html',
    '/mkvr/static/js/bundle.js',
    '/mkvr/static/css/main.css'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Возвращаем кэшированный ответ, если он есть
                if (response) {
                    return response;
                }
                // Иначе делаем сетевой запрос
                return fetch(event.request);
            }
            )
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Обработка push-уведомлений
self.addEventListener('push', (event) => {
    console.log('Push event received:', event);

    let notificationData = {
        title: 'MKVR',
        body: 'Новое уведомление',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        data: {}
    };

    if (event.data) {
        try {
            const data = event.data.json();
            notificationData = {
                ...notificationData,
                ...data
            };
        } catch (error) {
            console.error('Ошибка парсинга данных уведомления:', error);
        }
    }

    const options = {
        body: notificationData.body,
        icon: notificationData.icon,
        badge: notificationData.badge,
        data: notificationData.data,
        requireInteraction: true,
        actions: [
            {
                action: 'open',
                title: 'Открыть'
            },
            {
                action: 'close',
                title: 'Закрыть'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(notificationData.title, options)
    );
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', (event) => {
    console.log('Notification click received:', event);

    event.notification.close();

    if (event.action === 'open' || !event.action) {
        // Открываем приложение или конкретную страницу
        const urlToOpen = event.notification.data?.url || '/';

        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then((clientList) => {
                    // Проверяем, есть ли уже открытое окно
                    for (const client of clientList) {
                        if (client.url.includes(self.location.origin) && 'focus' in client) {
                            client.navigate(urlToOpen);
                            return client.focus();
                        }
                    }

                    // Если нет открытого окна, открываем новое
                    if (clients.openWindow) {
                        return clients.openWindow(urlToOpen);
                    }
                })
        );
    }
});

// Обработка фоновой синхронизации
self.addEventListener('sync', (event) => {
    console.log('Background sync event:', event);

    if (event.tag === 'background-sync') {
        event.waitUntil(
            // Здесь можно добавить логику синхронизации данных
            console.log('Background sync in progress...')
        );
    }
});

// Обработка сообщений от основного потока
self.addEventListener('message', (event) => {
    console.log('Message received in SW:', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
}); 