const CACHE_NAME='mend-v1.0.7';
const CORE=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon.svg','./splash.svg'];
const UI_POLISH=`<style id="mend-date-polish">
.dateControl{height:46px!important;border:1px solid #E2E8F0!important;border-radius:14px!important;background:#fff!important;box-shadow:0 1px 2px rgba(15,23,42,.02)!important}
.dateControl:focus-within{border-color:#93C5FD!important;box-shadow:0 0 0 3px rgba(37,99,235,.07)!important;background:#fff!important}
.dateVisual{gap:9px!important;padding:0 14px!important;font-size:16px!important;font-weight:500!important;color:#1E293B!important}
.dateVisual svg{width:18px!important;height:18px!important;flex:0 0 18px!important;stroke:#94A3B8!important}
.dateChevron{display:none!important}
#itemForm .fb{margin-top:10px!important}
#itemForm .label{margin-bottom:5px!important}
#itemForm .quickChips{margin-top:7px!important;gap:7px!important}
#itemForm .timeChips{gap:7px!important}
#itemForm .quickChip,#itemForm .timeChip{min-height:32px!important}
.sheetBody{padding-bottom:8px!important}
.sheetActions{padding-top:8px!important;padding-bottom:max(9px,env(safe-area-inset-bottom))!important}
.privacyMini{margin-top:10px;padding:10px 11px;border:1px solid #DDE7E3;border-radius:14px;background:linear-gradient(180deg,#FAFFFC,#F8FCFA)}
.privacyMiniTop{display:flex;align-items:center;gap:7px;font-size:11.5px;font-weight:750;color:#334155}
.privacyDot{width:7px;height:7px;border-radius:50%;background:#10B981;box-shadow:0 0 0 3px rgba(16,185,129,.10)}
.privacyMini p{margin:6px 0 0;font-size:10.5px;line-height:15px;color:#64748B}
.privacyMini details{margin-top:7px;border-top:1px solid #E8F0EC;padding-top:7px}
.privacyMini summary{list-style:none;cursor:pointer;font-size:10.5px;font-weight:700;color:#64748B}
.privacyMini summary::-webkit-details-marker{display:none}
.privacyMini .copy-de,.privacyMini .copy-en{display:none}
html[lang="de"] .privacyMini .copy-de{display:inline}
html[lang="en"] .privacyMini .copy-en{display:inline}
@media(max-height:760px){.dateControl{height:44px!important}}
</style>`;
const INSTALL_LINKS=`<link rel="icon" type="image/svg+xml" href="./icon.svg"><link rel="icon" type="image/png" sizes="192x192" href="./icon-192.png"><link rel="apple-touch-icon" sizes="180x180" href="./icon-192.png"><link rel="apple-touch-startup-image" href="./splash.svg">`;
const PRIVACY_BLOCK=`<div class="settingsSection" id="privacySection"><h3><span class="copy-de">Datenschutz</span><span class="copy-en">Privacy</span></h3><div class="privacyMini"><div class="privacyMiniTop"><span class="privacyDot"></span><span class="copy-de">Lokal & privat</span><span class="copy-en">Local & private</span></div><p><span class="copy-de">Deine Einträge werden ausschließlich im Browserspeicher dieses Geräts gespeichert. MEND überträgt deine Gesundheits- und Planungsdaten nicht an einen Server und verwendet kein Werbe-Tracking.</span><span class="copy-en">Your entries are stored only in this device’s browser storage. MEND does not send your health or recovery-plan data to a server and does not use advertising tracking.</span></p><details><summary><span class="copy-de">Technische Details anzeigen</span><span class="copy-en">Show technical details</span></summary><p><span class="copy-de">Gespeichert wird lokal über localStorage. Beim Löschen der Browserdaten, Zurücksetzen der App oder Entfernen der Website-Daten können diese Einträge verloren gehen.</span><span class="copy-en">Data is stored locally using localStorage. Clearing browser data, resetting the app or removing website data can delete these entries.</span></p></details></div></div>`;
function polishHtml(response){
  if(!response||!response.ok)return Promise.resolve(response);
  const type=response.headers.get('content-type')||'';
  if(!type.includes('text/html'))return Promise.resolve(response);
  return response.text().then(html=>{
    if(!html.includes('mend-date-polish'))html=html.replace('</head>',UI_POLISH+'</head>');
    if(!html.includes('apple-touch-icon'))html=html.replace('<link rel="manifest" href="./manifest.webmanifest">',INSTALL_LINKS+'<link rel="manifest" href="./manifest.webmanifest">');
    if(!html.includes('id="privacySection"'))html=html.replace('<div class="settingsSection"><h3 id="dangerTitle"></h3>',PRIVACY_BLOCK+'<div class="settingsSection"><h3 id="dangerTitle"></h3>');
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