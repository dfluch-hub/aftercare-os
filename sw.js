const APP_VERSION='v1.0.6';
const CACHE_NAME='mend-'+APP_VERSION;
const CORE=[
  './',
  './index.html',
  './manifest.webmanifest',
  './release-fixes.js',
  './concern-flow.js',
  './icon-192.png',
  './icon-512.png',
  './icon.svg',
  './splash.svg'
];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache=>cache.addAll(CORE))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('message',event=>{
  if(event.data&&event.data.type==='SKIP_WAITING')self.skipWaiting();
});

async function withConcernFlow(response){
  if(!response)return response;
  const type=response.headers.get('content-type')||'';
  if(!type.includes('text/html'))return response;
  const html=await response.text();
  const tag='<script src="./concern-flow.js?v=106" defer></script>';
  if(html.includes('concern-flow.js'))return new Response(html,{status:response.status,statusText:response.statusText,headers:response.headers});
  const enhanced=html.includes('</body>')?html.replace('</body>',tag+'</body>'):html+tag;
  const headers=new Headers(response.headers);
  headers.delete('content-length');
  return new Response(enhanced,{status:response.status,statusText:response.statusText,headers});
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;

  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        const network=await fetch(request,{cache:'no-store'});
        if(network&&network.ok){
          const cache=await caches.open(CACHE_NAME);
          await cache.put('./index.html',network.clone());
        }
        return await withConcernFlow(network);
      }catch(error){
        const fallback=(await caches.match('./index.html'))||(await caches.match('./'));
        return await withConcernFlow(fallback);
      }
    })());
    return;
  }

  event.respondWith((async()=>{
    const cached=await caches.match(request);
    if(cached)return cached;
    try{
      const network=await fetch(request,{cache:'no-store'});
      if(network&&network.ok){
        const cache=await caches.open(CACHE_NAME);
        cache.put(request,network.clone());
      }
      return network;
    }catch(error){
      return cached;
    }
  })());
});