const CACHE = 'aftercare-pathway-v12';
const ASSETS = ['./', './index.html', './assets/recovery.css', './assets/recovery-hero.jpg', './js/recovery.js', './js/item-sheet-v12.js', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
const RECOVERY_URL = new URL('./js/recovery.js', self.registration.scope).href;
const ENHANCER_URL = new URL('./js/item-sheet-v12.js', self.registration.scope).href;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith('aftercare-') && key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({type:'window'}))
      .then(clients => Promise.all(clients.map(client => client.navigate(client.url).catch(() => null))))
  );
});

async function textFromNetworkOrCache(url) {
  try {
    const response = await fetch(url, {cache:'no-store'});
    if (response.ok) {
      const copy = response.clone();
      const cache = await caches.open(CACHE);
      await cache.put(url, copy);
      return response.text();
    }
  } catch {}
  const cached = await caches.match(url);
  return cached ? cached.text() : '';
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;

  if (event.request.url === RECOVERY_URL) {
    event.respondWith((async () => {
      const [base, enhancer] = await Promise.all([
        textFromNetworkOrCache(RECOVERY_URL),
        textFromNetworkOrCache(ENHANCER_URL)
      ]);
      return new Response(`${base}\n\n${enhancer}`, {
        status: 200,
        headers: {'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'no-store'}
      });
    })());
    return;
  }

  event.respondWith(
    fetch(event.request).then(response => {
      if (response.ok && ASSETS.some(path => new URL(path, self.registration.scope).href === event.request.url)) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE).then(cache => cache.put(event.request, copy)));
      }
      return response;
    }).catch(() => caches.match(event.request).then(cached => cached || (event.request.mode === 'navigate' ? caches.match(new URL('./index.html', self.registration.scope)) : Response.error())))
  );
});