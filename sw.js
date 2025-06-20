// SafeStatus Service Worker
const CACHE_NAME = 'safestatus-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/login.html',
  '/home.html',
  '/setting.html',
  '/update_status.html',
  '/contact_sync.html',
  '/script.js',
  '/auth.js',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;500;600;700;800;900&display=swap'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[SW] All files cached');
        return self.skipWaiting();
      })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  
  // Skip cross-origin requests for non-essential resources
  if (requestUrl.origin !== location.origin && 
      !requestUrl.host.includes('cdn.tailwindcss.com') &&
      !requestUrl.host.includes('cdnjs.cloudflare.com') &&
      !requestUrl.host.includes('fonts.googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          console.log('[SW] Serving from cache:', event.request.url);
          return response;
        }

        // Fetch from network
        console.log('[SW] Fetching from network:', event.request.url);
        return fetch(event.request).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response for caching
          const responseToCache = response.clone();

          // Cache the fetched response
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // Offline fallback
        console.log('[SW] Network failed, showing offline page');
        
        // For navigation requests, show the main app
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        
        // For other requests, you could return a default offline response
        return new Response(
          JSON.stringify({ 
            error: 'אין חיבור לאינטרנט', 
            offline: true 
          }),
          {
            headers: { 'Content-Type': 'application/json' },
            status: 503
          }
        );
      })
  );
});

// Background sync for status updates when back online
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'status-sync') {
    event.waitUntil(syncStatusUpdates());
  }
});

async function syncStatusUpdates() {
  try {
    // Get pending status updates from IndexedDB
    const pendingUpdates = await getPendingStatusUpdates();
    
    for (const update of pendingUpdates) {
      try {
        const response = await fetch('/api/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update)
        });
        
        if (response.ok) {
          await removePendingStatusUpdate(update.id);
          console.log('[SW] Synced status update:', update);
        }
      } catch (error) {
        console.error('[SW] Failed to sync status update:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Helper functions for IndexedDB operations
async function getPendingStatusUpdates() {
  // Simplified - in real implementation use IndexedDB
  return JSON.parse(localStorage.getItem('pendingStatusUpdates') || '[]');
}

async function removePendingStatusUpdate(id) {
  const updates = await getPendingStatusUpdates();
  const filtered = updates.filter(update => update.id !== id);
  localStorage.setItem('pendingStatusUpdates', JSON.stringify(filtered));
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  if (!event.data) {
    console.log('[SW] No data in push event');
    return;
  }

  const data = event.data.json();
  const options = {
    body: data.body || 'עדכון חדש באפליקציה',
    icon: '/assets/icon-192.png',
    badge: '/assets/badge-72.png',
    vibrate: [100, 50, 100],
    data: data.data || {},
    tag: data.tag || 'safestatus-notification',
    requireInteraction: data.urgent || false,
    dir: 'rtl',
    lang: 'he'
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'SafeStatus', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

console.log('[SW] Service Worker loaded successfully'); 