/* MEND production stability patch — Etsy launch readiness */
(function(){
  'use strict';

  const DEMO = {
    lovenox: {
      match: i => i && i.type==='med' && i.time==='08:00' && i.name==='Lovenox 40mg' && ['1 injection subcutaneous','1 Spritze subkutan'].includes(i.detail||''),
      en: {name:'Lovenox 40mg',detail:'1 injection subcutaneous'},
      de: {name:'Lovenox 40mg',detail:'1 Spritze subkutan'}
    },
    ice: {
      match: i => i && i.type==='care' && i.time==='10:00' && ['Ice Pack','Kühlpack'].includes(i.name) && ['20 min cooling','20 Min kühlen'].includes(i.detail||''),
      en: {name:'Ice Pack',detail:'20 min cooling'},
      de: {name:'Kühlpack',detail:'20 Min kühlen'}
    },
    tylenol: {
      match: i => i && i.type==='med' && i.time==='13:00' && i.name==='Tylenol 500mg' && ['1 tablet','1 Tablette'].includes(i.detail||''),
      en: {name:'Tylenol 500mg',detail:'1 tablet'},
      de: {name:'Tylenol 500mg',detail:'1 Tablette'}
    },
    walk: {
      match: i => i && i.type==='care' && i.time==='16:00' && ['Walking Exercise','Kurzer Spaziergang'].includes(i.name) && ['10 min gentle walk','10 Min locker gehen'].includes(i.detail||''),
      en: {name:'Walking Exercise',detail:'10 min gentle walk'},
      de: {name:'Kurzer Spaziergang',detail:'10 Min locker gehen'}
    },
    followup: {
      match: i => i && i.type==='appt' && i.time==='19:00' && ['Follow-up Call','Kontrollanruf'].includes(i.name) && ['Check in with clinic','Klinik kontaktieren'].includes(i.location||''),
      en: {name:'Follow-up Call',location:'Check in with clinic'},
      de: {name:'Kontrollanruf',location:'Klinik kontaktieren'}
    }
  };

  function tagKnownDemoItems(){
    if(typeof state==='undefined' || !state || !Array.isArray(state.items)) return false;
    let changed=false;
    state.items.forEach(item=>{
      if(item._mendDemoKey || item._mendUserCreated) return;
      for(const [key,cfg] of Object.entries(DEMO)){
        if(cfg.match(item)){
          item._mendDemoKey=key;
          changed=true;
          break;
        }
      }
    });
    return changed;
  }

  function localizeDemoItems(){
    if(typeof state==='undefined' || !state || !Array.isArray(state.items) || typeof lang==='undefined') return false;
    let changed=tagKnownDemoItems();
    state.items.forEach(item=>{
      const cfg=DEMO[item._mendDemoKey];
      if(!cfg) return;
      const copy=cfg[lang==='de'?'de':'en'];
      Object.entries(copy).forEach(([k,v])=>{
        if(item[k]!==v){item[k]=v;changed=true;}
      });
    });
    if(changed && typeof save==='function') save();
    return changed;
  }

  // Medications and Care are day-scoped, matching the Today/Tomorrow selector.
  if(typeof renderLists==='function'){
    renderLists=function(){
      const date=typeof dayDate==='function'?dayDate():'';
      const a=state.items.filter(i=>i.date===date&&i.type==='med');
      const b=state.items.filter(i=>i.date===date&&i.type!=='med');
      $('medList').innerHTML=a.map(listHTML).join('');
      $('careList').innerHTML=b.map(listHTML).join('');
      $('medEmpty').classList.toggle('hidden',a.length>0);
      $('careEmpty').classList.toggle('hidden',b.length>0);
      document.querySelectorAll('.listItem').forEach(r=>{
        const id=r.dataset.id;
        r.querySelector('.edit').onclick=()=>openEdit(id);
        r.querySelector('.delete').onclick=()=>del(id);
      });
    };
  }

  // Keep only built-in demo content bilingual. User-created entries are never auto-translated.
  localizeDemoItems();
  document.querySelectorAll('.langBtn').forEach(btn=>{
    btn.addEventListener('click',()=>setTimeout(()=>{
      if(localizeDemoItems() && typeof render==='function') render();
    },0));
  });

  // Ensure the local-first privacy note is present even on the first Cloudflare navigation.
  if(!document.getElementById('privacySection')){
    const danger=document.getElementById('dangerTitle')?.closest('.settingsSection');
    if(danger){
      const section=document.createElement('div');
      section.className='settingsSection';
      section.id='privacySection';
      section.innerHTML='<h3><span class="copy-de">Datenschutz</span><span class="copy-en">Privacy</span></h3><div class="privacyMini"><div class="privacyMiniTop"><span class="privacyDot"></span><span class="copy-de">Lokal & privat</span><span class="copy-en">Local & private</span></div><p><span class="copy-de">Deine Einträge werden ausschließlich im Browserspeicher dieses Geräts gespeichert. MEND überträgt deine Gesundheits- und Planungsdaten nicht an einen Server und verwendet kein Werbe-Tracking.</span><span class="copy-en">Your entries are stored only in this device’s browser storage. MEND does not send your health or recovery-plan data to a server and does not use advertising tracking.</span></p><details><summary><span class="copy-de">Technische Details anzeigen</span><span class="copy-en">Show technical details</span></summary><p><span class="copy-de">Gespeichert wird lokal über localStorage. Beim Löschen der Browserdaten, Zurücksetzen der App oder Entfernen der Website-Daten können diese Einträge verloren gehen.</span><span class="copy-en">Data is stored locally using localStorage. Clearing browser data, resetting the app or removing website data can delete these entries.</span></p></details></div>';
      danger.before(section);
    }
  }

  if(!document.getElementById('mend-launch-polish')){
    const style=document.createElement('style');
    style.id='mend-launch-polish';
    style.textContent='.privacyMini{margin-top:10px;padding:10px 11px;border:1px solid #DDE7E3;border-radius:14px;background:linear-gradient(180deg,#FAFFFC,#F8FCFA)}.privacyMiniTop{display:flex;align-items:center;gap:7px;font-size:11.5px;font-weight:750;color:#334155}.privacyDot{width:7px;height:7px;border-radius:50%;background:#10B981;box-shadow:0 0 0 3px rgba(16,185,129,.10)}.privacyMini p{margin:6px 0 0;font-size:10.5px;line-height:15px;color:#64748B}.privacyMini details{margin-top:7px;border-top:1px solid #E8F0EC;padding-top:7px}.privacyMini summary{list-style:none;cursor:pointer;font-size:10.5px;font-weight:700;color:#64748B}.privacyMini summary::-webkit-details-marker{display:none}.privacyMini .copy-de,.privacyMini .copy-en{display:none}html[lang="de"] .privacyMini .copy-de{display:inline}html[lang="en"] .privacyMini .copy-en{display:inline}';
    document.head.appendChild(style);
  }

  // Re-render once so a fresh session immediately reflects the corrected day scope/localized demo.
  if(typeof user!=='undefined' && user && typeof render==='function') render();
})();
