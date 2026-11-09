/**
 * MotionLab Service Worker (Stage 12 PWA Offline Shell)
 * Caches static application shell while strictly preserving local IndexedDB integrity.
 */

const CACHE_NAME = "motionlab-shell-v1";
const SHELL_ASSETS = [
  "/",
  "/manifest.json",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
];

// 1. Install: Precache shell resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate: Purge stale caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch: Network-first for dynamic routes, cache-first for static shell assets
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Bypass chrome extensions, data URIs, and non-GET requests
  if (event.request.method !== "GET" || !url.protocol.startsWith("http")) {
    return;
  }

  // Bypass user media blobs and data exports
  if (url.pathname.startsWith("/api/") || url.pathname.includes("blob:")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached static shell if available
      if (cachedResponse) {
        // Fetch fresh copy in background (stale-while-revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {/* Offline fallback */});

        return cachedResponse;
      }

      // Fallback to network
      return fetch(event.request).then((networkResponse) => {
        // Cache successful static responses (css, js, svg, woff2)
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (url.pathname.endsWith(".js") ||
            url.pathname.endsWith(".css") ||
            url.pathname.endsWith(".svg") ||
            url.pathname.endsWith(".woff2"))
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // If offline and requesting an HTML page, serve cached root shell
        if (event.request.headers.get("accept")?.includes("text/html")) {
          return caches.match("/");
        }
      });
    })
  );
});
