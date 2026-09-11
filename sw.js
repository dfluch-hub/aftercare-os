const APP_VERSION='v1.0.0';
const CACHE_NAME='mend-'+APP_VERSION;
const CORE=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon.svg','./splash.svg'];

const INLINE_MANIFEST='data:application/manifest+json,%7B%22name%22%3A%22MEND%20-%20Recovery%20Companion%22%2C%22short_name%22%3A%22MEND%22%2C%22start_url%22%3A%22https%3A%2F%2Fdfluch-hub.github.io%2Faftercare-os%2F%22%2C%22scope%22%3A%22https%3A%2F%2Fdfluch-hub.github.io%2Faftercare-os%2F%22%2C%22display%22%3A%22standalone%22%2C%22background_color%22%3A%22%23FFFFFF%22%2C%22theme_color%22%3A%22%23FFFFFF%22%2C%22icons%22%3A%5B%7B%22src%22%3A%22https%3A%2F%2Fdfluch-hub.github.io%2Faftercare-os%2Ficon-192.png%22%2C%22sizes%22%3A%22192x192%22%2C%22type%22%3A%22image%2Fpng%22%2C%22purpose%22%3A%22any%22%7D%2C%7B%22src%22%3A%22https%3A%2F%2Fdfluch-hub.github.io%2Faftercare-os%2Ficon-512.png%22%2C%22sizes%22%3A%22512x512%22%2C%22type%22%3A%22image%2Fpng%22%2C%22purpose%22%3A%22any%20maskable%22%7D%5D%7D';
const APPLE_ICON='data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20512%20512%22%3E%3Crect%20width%3D%22512%22%20height%3D%22512%22%20rx%3D%22112%22%20fill%3D%22%23fff%22%2F%3E%3Cpath%20d%3D%22M250%20294c-67-17-105-73-90-132%2059%206%20105%2048%20113%20106%2016-60%2058-96%20119-104%2016%2062-24%20121-93%20137-21%205-37%202-49-7Z%22%20fill%3D%22%2360A5FA%22%2F%3E%3Cpath%20d%3D%22M256%20295c31-56%2077-88%20136-91-4%2062-46%20109-112%20121-10%202-18-8-24-30Z%22%20fill%3D%22%2377D09A%22%2F%3E%3C%2Fsvg%3E';
const RELEASE_HEAD=`<link rel="icon" type="image/svg+xml" href="./icon.svg"><link rel="apple-touch-icon" href="${APPLE_ICON}"><link rel="manifest" href="${INLINE_MANIFEST}">`;
const RELEASE_CSS=`<style id="mend-release-v100">.dateControl{height:46px!important;border:1px solid #E2E8F0!important;border-radius:14px!important;background:#fff!important;box-shadow:0 1px 2px rgba(15,23,42,.02)!important}.dateControl:focus-within{border-color:#93C5FD!important;box-shadow:0 0 0 3px rgba(37,99,235,.07)!important;background:#fff!important}.dateVisual{gap:9px!important;padding:0 14px!important;font-size:16px!important;font-weight:500!important;color:#1E293B!important}.dateVisual svg{width:18px!important;height:18px!important;flex:0 0 18px!important;stroke:#94A3B8!important}.dateChevron{display:none!important}#itemForm .fb{margin-top:10px!important}#itemForm .label{margin-bottom:5px!important}#itemForm .quickChips{margin-top:7px!important;gap:7px!important}#itemForm .timeChips{gap:7px!important}#itemForm .quickChip,#itemForm .timeChip{min-height:32px!important}.sheetBody{padding-bottom:8px!important}.sheetActions{padding-top:8px!important;padding-bottom:max(9px,env(safe-area-inset-bottom))!important}.privacyMini{margin-top:10px;padding:10px 11px;border:1px solid #DDE7E3;border-radius:14px;background:linear-gradient(180deg,#FAFFFC,#F8FCFA)}.privacyMiniTop{display:flex;align-items:center;gap:7px;font-size:11.5px;font-weight:750;color:#334155}.privacyDot{width:7px;height:7px;border-radius:50%;background:#10B981;box-shadow:0 0 0 3px rgba(16,185,129,.10)}.privacyMini p{margin:6px 0 0;font-size:10.5px;line-height:15px;color:#64748B}.privacyMini details{margin-top:7px;border-top:1px solid #E8F0EC;padding-top:7px}.privacyMini summary{list-style:none;cursor:pointer;font-size:10.5px;font-weight:700;color:#64748B}.privacyMini summary::-webkit-details-marker{display:none}.privacyMini .copy-de,.privacyMini .copy-en{display:none}html[lang="de"] .privacyMini .copy-de{display:inline}html[lang="en"] .privacyMini .copy-en{display:inline}@media(max-height:760px){.dateControl{height:44px!important}}</style>`;
const PRIVACY_BLOCK=`<div class="settingsSection" id="privacySection"><h3><span class="copy-de">Datenschutz</span><span class="copy-en">Privacy</span></h3><div class="privacyMini"><div class="privacyMiniTop"><span class="privacyDot"></span><span class="copy-de">Lokal & privat</span><span class="copy-en">Local & private</span></div><p><span class="copy-de">Deine Einträge werden ausschließlich im Browserspeicher dieses Geräts gespeichert. MEND überträgt deine Gesundheits- und Planungsdaten nicht an einen Server und verwendet kein Werbe-Tracking.</span><span class="copy-en">Your entries are stored only in this device’s browser storage. MEND does not send your health or recovery-plan data to a server and does not use advertising tracking.</span></p><details><summary><span class="copy-de">Technische Details anzeigen</span><span class="copy-en">Show technical details</span></summary><p><span class="copy-de">Gespeichert wird lokal über localStorage. Beim Löschen der Browserdaten, Zurücksetzen der App oder Entfernen der Website-Daten können diese Einträge verloren gehen.</span><span class="copy-en">Data is stored locally using localStorage. Clearing browser data, resetting the app or removing website data can delete these entries.</span></p></details></div></div>`;

async function transformHtml(response){
  if(!response||!response.ok)return response;
  const type=response.headers.get('content-type')||'';
  if(!type.includes('text/html'))return response;
  let html=await response.text();
  if(!html.includes('data:application/manifest+json'))html=html.replace('<link rel="manifest" href="./manifest.webmanifest">',RELEASE_HEAD);
  if(!html.includes('mend-release-v100'))html=html.replace('</head>',RELEASE_CSS+'</head>');
  if(!html.includes('id="privacySection"'))html=html.replace('<div class="settingsSection"><h3 id="dangerTitle"></h3>',PRIVACY_BLOCK+'<div class="settingsSection"><h3 id="dangerTitle"></h3>');
  if(!html.includes("const APP_VERSION='v1.0.0';"))html=html.replace('const USER_KEY=',"const APP_VERSION='v1.0.0';const USER_KEY=");
  html=html.replaceAll('welcomePassed=false','welcomePassed=true');
  html=html.replace("updateAvailable:'↻ Update available'","updateAvailable:'🔄 Update available – Tap to refresh'");
  html=html.replace("updateAvailable:'↻ Update verfügbar'","updateAvailable:'🔄 Update verfügbar – Tippen zum Aktualisieren'");
  html=html.replaceAll('window.location.reload()','window.location.reload(true)');
  return new Response(html,{status:response.status,statusText:response.statusText,headers:response.headers});
}

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    await cache.addAll(CORE);
    const raw=await cache.match('./index.html');
    if(raw){
      const processed=await transformHtml(raw);
      await cache.put('./index.html',processed);
    }
  })());
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

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;

  if(event.request.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        const network=await fetch(event.request,{cache:'no-store'});
        const processed=await transformHtml(network);
        if(processed&&processed.ok){
          const cache=await caches.open(CACHE_NAME);
          await cache.put('./index.html',processed.clone());
        }
        return processed;
      }catch(e){
        return (await caches.match('./index.html'))||(await caches.match('./'));
      }
    })());
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