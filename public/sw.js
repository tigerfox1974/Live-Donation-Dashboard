/**
 * Service Worker for Offline Caching
 * 
 * Implements a cache-first strategy for static assets and
 * network-first for API requests with offline fallback.
 */

var CACHE_NAME = 'live-donation-dashboard-v1';
var STATIC_CACHE_NAME = 'static-v1';
var DYNAMIC_CACHE_NAME = 'dynamic-v1';

// Files to cache immediately on install
var STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Cache configurations
var CACHE_CONFIGS = [
  // Static assets - cache first
  { pattern: /\.(js|css|woff2?|ttf|eot)$/, strategy: 'cache-first' },
  { pattern: /\.(png|jpg|jpeg|gif|svg|ico|webp)$/, strategy: 'cache-first' },
  
  // HTML - stale while revalidate
  { pattern: /\.html$/, strategy: 'stale-while-revalidate' },
  { pattern: /\/$/, strategy: 'stale-while-revalidate' },
  
  // API calls - network first with cache fallback
  { pattern: /\/api\//, strategy: 'network-first', maxAge: 5 * 60 * 1000 }
];

// ============ Install Event ============

self.addEventListener('install', function(event) {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(function(cache) {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(function() {
        console.log('[SW] Service worker installed');
        return self.skipWaiting();
      })
      .catch(function(error) {
        console.error('[SW] Install failed:', error);
      })
  );
});

// ============ Activate Event ============

self.addEventListener('activate', function(event) {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then(function(cacheNames) {
        return Promise.all(
          cacheNames
            .filter(function(name) {
              // Delete old caches
              return name !== STATIC_CACHE_NAME && 
                     name !== DYNAMIC_CACHE_NAME &&
                     name !== CACHE_NAME;
            })
            .map(function(name) {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(function() {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// ============ Fetch Event ============

self.addEventListener('fetch', function(event) {
  var request = event.request;
  var url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Find matching cache config
  var config = CACHE_CONFIGS.find(function(c) {
    return c.pattern.test(url.pathname);
  });
  var strategy = config ? config.strategy : 'network-first';
  
  event.respondWith(handleFetch(request, strategy));
});

// ============ Fetch Handlers ============

function handleFetch(request, strategy) {
  switch (strategy) {
    case 'cache-first':
      return cacheFirst(request);
    case 'network-first':
      return networkFirst(request);
    case 'stale-while-revalidate':
      return staleWhileRevalidate(request);
    default:
      return fetch(request);
  }
}

function cacheFirst(request) {
  return caches.match(request)
    .then(function(cached) {
      if (cached) {
        return cached;
      }
      
      return fetch(request)
        .then(function(response) {
          if (response.ok) {
            return caches.open(DYNAMIC_CACHE_NAME)
              .then(function(cache) {
                cache.put(request, response.clone());
                return response;
              });
          }
          return response;
        })
        .catch(function(error) {
          console.error('[SW] Cache first failed:', error);
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });
    });
}

function networkFirst(request) {
  return fetch(request)
    .then(function(response) {
      if (response.ok) {
        return caches.open(DYNAMIC_CACHE_NAME)
          .then(function(cache) {
            cache.put(request, response.clone());
            return response;
          });
      }
      return response;
    })
    .catch(function() {
      return caches.match(request)
        .then(function(cached) {
          if (cached) {
            return cached;
          }
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });
    });
}

function staleWhileRevalidate(request) {
  return caches.open(DYNAMIC_CACHE_NAME)
    .then(function(cache) {
      return caches.match(request)
        .then(function(cached) {
          var fetchPromise = fetch(request)
            .then(function(response) {
              if (response.ok) {
                cache.put(request, response.clone());
              }
              return response;
            })
            .catch(function() {
              return null;
            });
          
          return cached || fetchPromise.then(function(response) {
            return response || new Response('Offline', { 
              status: 503, 
              statusText: 'Service Unavailable' 
            });
          });
        });
    });
}

// ============ Background Sync ============

self.addEventListener('sync', function(event) {
  console.log('[SW] Sync event:', event.tag);
  
  if (event.tag === 'sync-donations') {
    event.waitUntil(syncDonations());
  }
});

function syncDonations() {
  // Notify all clients to trigger sync
  return self.clients.matchAll()
    .then(function(clients) {
      clients.forEach(function(client) {
        client.postMessage({
          type: 'SYNC_REQUESTED',
          tag: 'sync-donations'
        });
      });
    });
}

// ============ Push Notifications (optional) ============

self.addEventListener('push', function(event) {
  if (!event.data) return;
  
  var data = event.data.json();
  console.log('[SW] Push received:', data);
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Bildirim', {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      data: data.url
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  if (event.notification.data) {
    event.waitUntil(
      self.clients.openWindow(event.notification.data)
    );
  }
});

// ============ Message Handler ============

self.addEventListener('message', function(event) {
  var type = event.data.type;
  var payload = event.data.payload;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_URLS':
      event.waitUntil(
        caches.open(DYNAMIC_CACHE_NAME)
          .then(function(cache) {
            return cache.addAll(payload.urls);
          })
      );
      break;
      
    case 'CLEAR_CACHE':
      event.waitUntil(
        caches.keys().then(function(names) {
          return Promise.all(names.map(function(name) {
            return caches.delete(name);
          }));
        })
      );
      break;
  }
});
