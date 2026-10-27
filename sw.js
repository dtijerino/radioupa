// Caché ligero de la interfaz. La transmisión SIEMPRE viene de Asura Hosting.
const CACHE = 'upavoz-radio-interface-v2';
const ASSETS = ['./', './index.html', './assets/css/styles.css', './assets/js/config.js', './assets/js/main.js', './verificar-audio.html', './assets/img/logo-upavoz.webp', './assets/img/icon-192.png', './assets/img/icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('./index.html')));
  } else {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
  }
});
