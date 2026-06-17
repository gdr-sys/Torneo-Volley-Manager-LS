// Service Worker — Torneo Pallavolo Manager PWA
const CACHE = 'torneo-volley-v1';
const ASSETS = [
  './',
  './index.html',
  './login.html',
  './live.html',
  './iscrizione.html',
  './segnapunti.html',
  './js/config.js',
  './js/state.js',
  './js/storage.js',
  './js/utils.js',
  './js/pdf.js',
  './js/views.js',
  './js/main.js',
  './icon-192.png',
  './icon-512.png'
];

// Installazione: metti in cache le risorse principali
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Attivazione: rimuovi cache vecchie
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch: network first, fallback cache
// Firebase e API esterne sempre dal network
self.addEventListener('fetch', function(e) {
  var url = e.request.url;
  // Sempre dal network: Firebase, API, CDN
  if (url.includes('firebaseapp') || 
      url.includes('firestore') || 
      url.includes('googleapis') ||
      url.includes('gstatic') ||
      url.includes('cdnjs') ||
      url.includes('qrserver')) {
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then(function(res) {
        // Aggiorna la cache con la risposta fresca
        if (res && res.status === 200 && e.request.method === 'GET') {
          var resClone = res.clone();
          caches.open(CACHE).then(function(cache) {
            cache.put(e.request, resClone);
          });
        }
        return res;
      })
      .catch(function() {
        // Offline: usa la cache
        return caches.match(e.request);
      })
  );
});
