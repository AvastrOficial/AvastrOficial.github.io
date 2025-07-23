self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('bluetooth-detector').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/app.js',
        '/manifest.json'
      ]);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((resp) => {
      return resp || fetch(e.request);
    })
  );
});
