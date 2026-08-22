/* Carnet de voyage · Japon — cache hors-ligne
   À déposer à côté de index.html, à la racine du site.
   Change le numéro de version pour forcer la mise à jour du cache. */

const CACHE = 'carnet-japon-v1';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(['./', './index.html']).catch(() => c.add('./')))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(noms => Promise.all(noms.filter(n => n !== CACHE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

/* Cache d'abord : le carnet doit s'ouvrir sans réseau.
   Toute réponse valable est ajoutée au cache au passage (polices comprises). */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  e.respondWith(
    caches.match(req).then(cache => {
      if (cache) return cache;
      return fetch(req).then(res => {
        if (res && (res.ok || res.type === 'opaque')) {
          const copie = res.clone();
          caches.open(CACHE).then(c => c.put(req, copie)).catch(() => {});
        }
        return res;
      }).catch(() => {
        if (req.mode === 'navigate') return caches.match('./') || caches.match('./index.html');
        return new Response('', { status: 504, statusText: 'hors ligne' });
      });
    })
  );
});
