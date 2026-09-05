const CACHE="aftercare-os-v5-1";
const ASSETS=["./","./index.html","./assets/app.css","./js/config.js","./js/storage.js","./js/state.js","./js/ui.js","./js/app.js","./js/commerce.js","./sales.html","./manifest.webmanifest","./icon-192.png","./icon-512.png"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{ if(e.request.method!=="GET")return; e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))); });
