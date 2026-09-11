const CACHE_NAME='mend-v1.0.6';
const CORE=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
const UI_POLISH=`<style id="mend-date-polish">
.dateControl{height:46px!important;border:1px solid #E2E8F0!important;border-radius:14px!important;background:#fff!important;box-shadow:0 1px 2px rgba(15,23,42,.02)!important}
.dateControl:focus-within{border-color:#93C5FD!important;box-shadow:0 0 0 3px rgba(37,99,235,.07)!important;background:#fff!important}
.dateVisual{gap:9px!important;padding:0 14px!important;font-size:16px!important;font-weight:500!important;color:#1E293B!important}
.dateVisual svg{width:18px!important;height:18px!important;flex:0 0 18px!important;stroke:#94A3B8!important}
.dateChevron{display:none!important}
.setupScreen .dateControl{height:44px!important;border-radius:12px!important}
.setupScreen .dateVisual{gap:10px!important;padding:0 14px!important;font-size:14px!important;font-weight:600!important}
.setupScreen .dateVisual svg{width:16px!important;height:16px!important;flex:0 0 16px!important}
#itemForm .fb{margin-top:10px!important}
#itemForm .label{margin-bottom:5px!important}
#itemForm .quickChips{margin-top:7px!important;gap:7px!important}
#itemForm .timeChips{gap:7px!important}
#itemForm .quickChip,#itemForm .timeChip{min-height:32px!important}
.sheetBody{padding-bottom:8px!important}
.sheetActions{padding-top:8px!important;padding-bottom:max(9px,env(safe-area-inset-bottom))!important}
@media(max-height:760px){.dateControl{height:44px!important}}
</style>`;
function polishHtml(response){
  if(!response||!response.ok)return Promise.resolve(response);
  const type=response.headers.get('content-type')||'';
  if(!type.includes('text/html'))return Promise.resolve(response);
  return response.text().then(html=>{
    if(!html.includes('mend-date-polish'))html=html.replace('</head>',UI_POLISH+'</head>');
    return new Response(html,{status:response.status,statusText:response.statusText,headers:response.headers});
  });
}

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE)));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('message',event=>{
  if(event.data&&event.data.type==='SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin) return;

  if(event.request.mode==='navigate'){
    event.respondWith(
      fetch(event.request,{cache:'no-store'})
        .then(response=>{
          if(response.ok){
            const copy=response.clone();
            event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.put('./index.html',copy)));
          }
          return polishHtml(response);
        })
        .catch(()=>caches.match('./index.html').then(polishHtml))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
      if(response.ok){
        const copy=response.clone();
        event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy)));
      }
      return response;
    }))
  );
});