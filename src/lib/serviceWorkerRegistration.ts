/**
 * Service Worker Registration
 * 
 * Registers and manages the service worker lifecycle.
 */

interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOffline?: () => void;
  onOnline?: () => void;
}

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

export function register(config?: ServiceWorkerConfig): void {
  if ('serviceWorker' in navigator) {
    const baseUrl = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL || '/';
    const publicUrl = new URL(baseUrl, window.location.href);
    
    if (publicUrl.origin !== window.location.origin) {
      console.warn('[SW] Public URL origin mismatch, skipping registration');
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${baseUrl}sw.js`;

      if (isLocalhost) {
        // Check if SW exists in development
        checkValidServiceWorker(swUrl, config);
        navigator.serviceWorker.ready.then(() => {
          console.log('[SW] Ready in development mode');
        });
      } else {
        // Register SW in production
        registerValidSW(swUrl, config);
      }
    });

    // Network status listeners
    if (config?.onOffline) {
      window.addEventListener('offline', config.onOffline);
    }
    if (config?.onOnline) {
      window.addEventListener('online', config.onOnline);
    }
  }
}

function registerValidSW(swUrl: string, config?: ServiceWorkerConfig): void {
  navigator.serviceWorker
    .register(swUrl)
    .then(registration => {
      console.log('[SW] Registered successfully');

      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New content available
              console.log('[SW] New content available, will update on reload');
              config?.onUpdate?.(registration);
            } else {
              // Content cached for offline use
              console.log('[SW] Content cached for offline use');
              config?.onSuccess?.(registration);
            }
          }
        };
      };
    })
    .catch(error => {
      console.error('[SW] Registration failed:', error);
    });
}

function checkValidServiceWorker(swUrl: string, config?: ServiceWorkerConfig): void {
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' }
  })
    .then(response => {
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType && contentType.indexOf('javascript') === -1)
      ) {
        // No service worker found - this is expected in development
        // Don't reload, just log and continue
        console.log('[SW] Service worker not found at', swUrl, '- running without offline caching');
        
        // If there's an existing SW, unregister it
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then(registration => {
            registration.unregister().then(() => {
              console.log('[SW] Previous service worker unregistered');
            });
          }).catch(() => {
            // Ignore errors during unregister
          });
        }
      } else {
        // SW found, register it
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('[SW] No internet connection, app running in offline mode');
    });
}

export function unregister(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(registration => {
        registration.unregister();
        console.log('[SW] Unregistered');
      })
      .catch(error => {
        console.error('[SW] Unregister failed:', error);
      });
  }
}

// Send message to service worker
export function sendMessage(message: { type: string; payload?: unknown }): void {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(message);
  }
}

// Request background sync (if supported)
export async function requestSync(tag: string): Promise<boolean> {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register(tag);
      console.log('[SW] Background sync registered:', tag);
      return true;
    } catch (error) {
      console.error('[SW] Background sync registration failed:', error);
      return false;
    }
  }
  return false;
}

// Listen for messages from service worker
export function onMessage(callback: (data: unknown) => void): () => void {
  const handler = (event: MessageEvent) => {
    callback(event.data);
  };
  
  navigator.serviceWorker?.addEventListener('message', handler);
  
  return () => {
    navigator.serviceWorker?.removeEventListener('message', handler);
  };
}

// Check for updates
export async function checkForUpdates(): Promise<void> {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    console.log('[SW] Checked for updates');
  }
}

// Skip waiting and activate new service worker
export function skipWaiting(): void {
  sendMessage({ type: 'SKIP_WAITING' });
}

// Clear all caches
export function clearCache(): void {
  sendMessage({ type: 'CLEAR_CACHE' });
}

// Pre-cache specific URLs
export function cacheUrls(urls: string[]): void {
  sendMessage({ type: 'CACHE_URLS', payload: { urls } });
}
