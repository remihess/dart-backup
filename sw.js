const CACHE_NAME = 'dartpro-cache-dynamic-v3';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon.png'
];

// Installiert die App lokal und zwingt den Browser zum sofortigen Update
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Räumt alte Instanzen auf und übernimmt sofort die Kontrolle
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

// Intelligentes Laden: Network-First mit automatischem Cache-Update
self.addEventListener('fetch', event => {
  // Ignoriere Anfragen, die nicht über HTTP/HTTPS laufen (verhindert Fehler)
  if (!event.request.url.startsWith('http')) return;

  let fetchRequest = event.request;
  // Zwinge den Browser bei der HTML-Datei absolut immer ins Netz zu gehen (ignoriert den internen Handy-Cache)
  if (event.request.mode === 'navigate') {
    fetchRequest = new Request(event.request.url, { cache: 'no-store' });
  }

  event.respondWith(
    fetch(fetchRequest)
      .then(response => {
        // Wenn wir online sind: Antwort klonen und den Cache im Hintergrund IMMER aktuell halten!
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return response;
      })
      .catch(() => {
        // Wenn wir offline sind: Lade die zuletzt gespeicherte Version aus dem Cache
        return caches.match(event.request);
      })
  );
});