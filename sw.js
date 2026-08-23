/* Carnet de voyage · Japon — cache hors-ligne
   À déposer à côté de index.html, à la racine du dépôt.

   Stratégie :
   - la page elle-même est cherchée sur le réseau d'abord, pour que
     chaque commit soit visible immédiatement ; le cache ne sert que
     si le réseau ne répond pas.
   - le reste (polices) reste en cache d'abord, ça ne change jamais.

   Change le numéro de version pour repartir sur un cache propre. */

const CACHE = 'carnet-japon-v3';

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

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const estPage = req.mode === 'navigate' ||
                  (req.headers.get('accept') || '').includes('text/html');

  if (estPage) {
    // réseau d'abord : la dernière version l'emporte toujours
    e.respondWith(
      fetch(req)
        .then(res => {
          const copie = res.clone();
          caches.open(CACHE).then(c => c.put(req, copie)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req)
          .then(r => r || caches.match('./') || caches.match('./index.html')))
    );
    return;
  }

  // le reste : cache d'abord
  e.respondWith(
    caches.match(req).then(cache => cache || fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) {
        const copie = res.clone();
        caches.open(CACHE).then(c => c.put(req, copie)).catch(() => {});
      }
      return res;
    }).catch(() => new Response('', { status: 504, statusText: 'hors ligne' })))
  );
});
