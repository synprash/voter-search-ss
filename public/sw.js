// Service Worker for VoterSearch (शिवसेना शहर चांदवड मतदार शोध प्रणाली)
const CACHE_NAME = 'voter-search-v1';

const STATIC_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/images/shivsena-logo.svg',
  '/icons/icon-48x48.png',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-144x144.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
];

// Install: Cache essential core shell assets immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Pre-caching partial failure:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Purge older cache versions and take immediate control
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: Strategy depending on request type
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests or chrome-extension/schemes
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // 1. API Requests: Network-First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          return new Response(
            JSON.stringify({
              error: 'इंटरनेट कनेक्शन नाही (Offline)',
              offline: true,
            }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
    );
    return;
  }

  // 2. Static Next.js Bundles, Fonts, and Media: Cache-First with Network Fallback
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/images/') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 3. Page Navigations: Network-First with Cache Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedPage = await caches.match(request);
          if (cachedPage) {
            return cachedPage;
          }
          // Fallback to home page if available in cache
          const cachedHome = await caches.match('/');
          if (cachedHome) {
            return cachedHome;
          }
          return new Response(
            `<!DOCTYPE html>
            <html lang="mr">
              <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>इंटरनेट उपलब्ध नाही | शिवसेना मतदार शोध</title>
                <style>
                  body { font-family: system-ui, sans-serif; background: #fff7ed; color: #7c2d12; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; text-align: center; }
                  .card { background: white; border: 2px solid #fdba74; border-radius: 20px; padding: 32px 24px; max-width: 420px; box-shadow: 0 10px 25px -5px rgba(234, 88, 12, 0.2); }
                  h1 { font-size: 22px; color: #c2410c; margin-bottom: 12px; }
                  p { font-size: 15px; line-height: 1.5; color: #431407; margin-bottom: 24px; }
                  button { background: #ea580c; color: white; border: none; border-radius: 12px; padding: 12px 24px; font-size: 15px; font-weight: bold; cursor: pointer; }
                </style>
              </head>
              <body>
                <div class="card">
                  <h1>⚠️ इंटरनेट कनेक्शन उपलब्ध नाही</h1>
                  <p>शिवसेना शहर चांदवड मतदार शोध प्रणाली वापरण्यासाठी कृपया इंटरनेट कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.</p>
                  <button onclick="window.location.reload()">पुन्हा प्रयत्न करा (Retry)</button>
                </div>
              </body>
            </html>`,
            {
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
            }
          );
        })
    );
    return;
  }

  // Default: Stale-while-revalidate or Network with cache fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
      );
    })
  );
});
