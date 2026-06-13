// SEMATA KATA — Service Worker with Auto-Update
const CACHE_NAME = 'sematakata-v1';
const URLS_TO_CACHE = ['/'];

// Install — cache halaman utama
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(URLS_TO_CACHE))
  );
  self.skipWaiting();
});

// Activate — hapus cache lama
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — Network First strategy
// Selalu coba ambil dari network dulu (supaya dapat versi terbaru)
// Fallback ke cache kalau offline
self.addEventListener('fetch', e => {
  // Hanya handle GET request untuk halaman HTML utama
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request.clone())
      .then(response => {
        // Kalau berhasil dari network, update cache dan return
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, responseClone));
        }
        return response;
      })
      .catch(() => {
        // Offline — ambil dari cache
        return caches.match(e.request);
      })
  );
});

// Auto-update: cek perubahan setiap 5 menit
self.addEventListener('message', e => {
  if (e.data === 'CHECK_UPDATE') self.registration.update();
});
