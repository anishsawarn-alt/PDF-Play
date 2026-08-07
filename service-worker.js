const CACHE_NAME = 'pdf-play-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './offline.html',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2'
];

self.addEventListener('install', event => {
  // Cache every available resource without preventing installation if one CDN is temporarily unavailable.
  event.waitUntil(caches.open(CACHE_NAME).then(cache => Promise.all(
    APP_SHELL.map(resource => cache.add(resource).catch(error => {
      console.warn('Could not pre-cache:', resource, error);
    }))
  )));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      const networkFetch = fetch(event.request).then(response => {
        if (response && (response.ok || response.type === 'opaque')) {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
        }
        return response;
      });

      return cached || networkFetch.catch(() => {
        if (event.request.mode === 'navigate') return caches.match('./offline.html');
        return new Response('', { status: 504, statusText: 'Offline' });
      });
    })
  );
});
