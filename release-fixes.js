/* MEND production stability patch — Etsy launch readiness */
(function(){
'use strict';

/* New recovery plans must start empty. The user adds their own medication,
   care routines and appointments; MEND never pre-populates medical tasks. */
if(typeof defaultState==='function'){
  defaultState=function(){return{items:[]}};
}

/* PWA head compatibility for iOS/iPadOS and Android. */
(function ensurePwaHead(){
  if(!document.querySelector('link[rel="apple-touch-icon"]')){
    const icon=document.createElement('link');
    icon.rel='apple-touch-icon';
    icon.href='./icon-512.png';
    document.head.appendChild(icon);
  }
  if(!document.querySelector('link[rel="icon"]')){
    const icon=document.createElement('link');
    icon.rel='icon';
    icon.type='image/svg+xml';
    icon.href='./icon.svg';
    document.head.appendChild(icon);
  }
  if(!document.querySelector('meta[name="mobile-web-app-capable"]')){
    const meta=document.createElement('meta');
    meta.name='mobile-web-app-capable';
    meta.content='yes';
    document.head.appendChild(meta);
  }
})();

const DEMO={
lovenox:{match:i=>i&&i.type==='med'&&i.time==='08:00'&&i.name==='Lovenox 40mg'&&['1 injection subcutaneous','1 Spritze subkutan'].includes(i.detail||''),en:{name:'Lovenox 40mg',detail:'1 injection subcutaneous'},de:{name:'Lovenox 40mg',detail:'1 Spritze subkutan'}},
ice:{match:i=>i&&i.type==='care'&&i.time==='10:00'&&['Ice Pack','Kühlpack'].includes(i.name)&&['20 min cooling','20 Min kühlen'].includes(i.detail||''),en:{name:'Ice Pack',detail:'20 min cooling'},de:{name:'Kühlpack',detail:'20 Min kühlen'}},
tylenol:{match:i=>i&&i.type==='med'&&i.time==='13:00'&&i.name==='Tylenol 500mg'&&['1 tablet','1 Tablette'].includes(i.detail||''),en:{name:'Tylenol 500mg',detail:'1 tablet'},de:{name:'Tylenol 500mg',detail:'1 Tablette'}},
walk:{match:i=>i&&i.type==='care'&&i.time==='16:00'&&['Walking Exercise','Kurzer Spaziergang'].includes(i.name)&&['10 min gentle walk','10 Min locker gehen'].includes(i.detail||''),en:{name:'Walking Exercise',detail:'10 min gentle walk'},de:{name:'Kurzer Spaziergang',detail:'10 Min locker gehen'}},
followup:{match:i=>i&&i.type==='appt'&&i.time==='19:00'&&['Follow-up Call','Kontrollanruf'].includes(i.name)&&['Check in with clinic','Klinik kontaktieren'].includes(i.location||''),en:{name:'Follow-up Call',location:'Check in with clinic'},de:{name:'Kontrollanruf',location:'Klinik kontaktieren'}}};
function tagKnownDemoItems(){if(typeof state==='undefined'||!state||!Array.isArray(state.items))return false;let changed=false;state.items.forEach(item=>{if(item._mendDemoKey||item._mendUserCreated)return;for(const [key,cfg] of Object.entries(DEMO)){if(cfg.match(item)){item._mendDemoKey=key;changed=true;break}}});return changed}
function localizeDemoItems(){if(typeof state==='undefined'||!state||!Array.isArray(state.items)||typeof lang==='undefined')return false;let changed=tagKnownDemoItems();state.items.forEach(item=>{const cfg=DEMO[item._mendDemoKey];if(!cfg)return;const copy=cfg[lang==='de'?'de':'en'];Object.entries(copy).forEach(([k,v])=>{if(item[k]!==v){item[k]=v;changed=true}})});if(changed&&typeof save==='function')save();return changed}

/* Remove the old five-item sample timeline once, without touching genuine user data. */
(function migrateDemoTimeline(){
  if(typeof state==='undefined'||!state||!Array.isArray(state.items))return;
  const key='mend_empty_timeline_migration_v1';
  if(localStorage.getItem(key)==='1')return;
  tagKnownDemoItems();
  const demoKeys=new Set(state.items.map(i=>i._mendDemoKey).filter(Boolean));
  if(['lovenox','ice','tylenol','walk','followup'].every(k=>demoKeys.has(k))){
    state.items=state.items.filter(i=>!i._mendDemoKey);
    if(typeof save==='function')save();
  }
  localStorage.setItem(key,'1');
})();

/* Simple welcome is the first screen of every genuinely unconfigured MEND installation. */
if(typeof user!=='undefined'&&!user){
  welcomePassed=false;
  const welcome=document.getElementById('welcomeScreen');
  const setup=document.getElementById('setupScreen');
  if(welcome){welcome.classList.remove('hidden');if(setup)setup.classList.add('hidden')}
}
function setWelcomeCopy(){
 const welcome=document.getElementById('welcomeScreen');if(!welcome)return;
 const de=typeof lang!=='undefined'&&lang==='de';
 const title=document.getElementById('welcomeTitle'),sub=document.getElementById('welcomeSub'),button=document.getElementById('getStarted');
 if(title)title.textContent=de?'Hallo bei MEND':'Welcome to MEND';
 if(sub)sub.textContent=de?'Dein persönlicher Begleiter für die Zeit nach einer Operation. Behalte Medikamente, Pflege und Termine einfach an einem Ort im Blick.':'Your personal companion after surgery. Keep medications, care and appointments organized in one calm place.';
 if(button)button.textContent=de?'Weiter':'Continue';
 const highlights=welcome.querySelector('.highlights');if(highlights)highlights.style.display='none';
}
setWelcomeCopy();
document.querySelectorAll('.langBtn').forEach(b=>b.addEventListener('click',()=>setTimeout(setWelcomeCopy,0)));

/* Dedicated Appointments page/tab. */
const carePage=document.getElementById('carePage');
if(carePage&&!document.getElementById('apptPage')){const p=document.createElement('section');p.id='apptPage';p.className='page hidden';p.innerHTML='<div class="sectionHead"><h2 id="apptPageTitle"></h2><p id="apptPageSub"></p></div><div id="apptList" class="list"></div><div id="apptEmpty" class="emptyCard hidden"></div>';carePage.after(p)}
const navGrid=document.querySelector('.navGrid');
if(navGrid&&!navGrid.querySelector('[data-page="appt"]')){const red=navGrid.querySelector('[data-page="red"]');const b=document.createElement('button');b.className='nav';b.dataset.page='appt';b.innerHTML='<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg><span id="navAppt"></span>';red.before(b)}
if(navGrid)navGrid.style.gridTemplateColumns='repeat(5,minmax(0,1fr))';
function appointmentCopy(){const de=typeof lang!=='undefined'&&lang==='de';const x={title:de?'Termine':'Appointments',sub:de?'Kontrollen und geplante Termine':'Follow-ups and scheduled appointments',empty:de?'Für diesen Tag sind keine Termine geplant.':'No appointments scheduled for this day.'};const a=document.getElementById('apptPageTitle'),b=document.getElementById('apptPageSub'),c=document.getElementById('apptEmpty'),n=document.getElementById('navAppt');if(a)a.textContent=x.title;if(b)b.textContent=x.sub;if(c)c.textContent=x.empty;if(n)n.textContent=x.title}
function wireListRows(root){if(!root)return;root.querySelectorAll('.listItem').forEach(r=>{const id=r.dataset.id,e=r.querySelector('.edit'),d=r.querySelector('.delete');if(e)e.onclick=()=>openEdit(id);if(d)d.onclick=()=>del(id)})}
if(typeof renderLists==='function')renderLists=function(){const date=typeof dayDate==='function'?dayDate():'';const meds=state.items.filter(i=>i.date===date&&i.type==='med'),care=state.items.filter(i=>i.date===date&&i.type==='care'),appts=state.items.filter(i=>i.date===date&&i.type==='appt');$('medList').innerHTML=meds.map(listHTML).join('');$('careList').innerHTML=care.map(listHTML).join('');const al=document.getElementById('apptList');if(al)al.innerHTML=appts.map(listHTML).join('');$('medEmpty').classList.toggle('hidden',meds.length>0);$('careEmpty').classList.toggle('hidden',care.length>0);const ae=document.getElementById('apptEmpty');if(ae)ae.classList.toggle('hidden',appts.length>0);wireListRows($('medList'));wireListRows($('careList'));wireListRows(al);appointmentCopy()};
document.querySelectorAll('.nav').forEach(b=>{if(b.dataset.page==='appt')b.onclick=()=>{page='appt';document.querySelectorAll('.nav').forEach(x=>x.classList.toggle('active',x.dataset.page===page));['today','meds','care','appt','red'].forEach(p=>{const el=document.getElementById(p+'Page');if(el)el.classList.toggle('hidden',p!==page)});$('addBtn').style.display='block';renderLists();renderProgress()}});
const baseRender=typeof render==='function'?render:null;
if(baseRender)render=function(){if(page==='appt')page='today';baseRender();appointmentCopy();setWelcomeCopy();renderConcernFlow();renderMorrowBlock()};

localizeDemoItems();
document.querySelectorAll('.langBtn').forEach(btn=>btn.addEventListener('click',()=>setTimeout(()=>{appointmentCopy();renderConcernFlow();renderMorrowBlock();if(localizeDemoItems()&&typeof render==='function')render()},0)));

/* Functional red-flags / concern flow. It helps the user decide the next action,
   but never diagnoses or labels a symptom as safe. */
const CONCERN_KEY='mend_concerns_v1';
let concernDraft={category:'',severity:'',worsening:''};
function concernCopy(){const de=typeof lang!=='undefined'&&lang==='de';return de?{
 title:'Warnzeichen',sub:'Wenn sich etwas nicht richtig anfühlt, hilft MEND dir, die nächsten Schritte zu ordnen.',start:'Was macht dir gerade Sorgen?',cats:{pain:'Schmerzen',wound:'Wunde / Blutung',breathing:'Atmung / Kreislauf',fever:'Fieber / Infektzeichen',swelling:'Schwellung',medication:'Medikamente / Nebenwirkungen',other:'Etwas anderes'},
 severity:'Wie stark ist es?',mild:'Leicht',moderate:'Mittel',severe:'Stark',worse:'Wird es gerade schlimmer?',yes:'Ja',no:'Nein',next:'Weiter',back:'Zurück',restart:'Neu starten',save:'Als Notiz speichern',saved:'Auf diesem Gerät gespeichert.',recent:'Letzte Einträge',clinic:'Behandlungsteam anrufen',emergency:'112 anrufen',
 emergencyTitle:'Bitte sofort medizinische Hilfe holen',emergencyText:'Bei Atemnot, Brustschmerz, Ohnmacht, starker unstillbarer Blutung oder wenn du dich akut bedroht fühlst: ruf 112 oder den örtlichen Notruf an.',
 contactTitle:'Bitte jetzt dein Behandlungsteam kontaktieren',contactText:'Deine Angaben sollten zeitnah mit deinem Behandlungsteam besprochen werden. Wenn sich dein Zustand akut verschlechtert oder lebensbedrohlich wirkt, ruf den Notruf.',
 monitorTitle:'Beobachten und bei Unsicherheit nachfragen',monitorText:'MEND kann nicht beurteilen, ob ein Symptom harmlos ist. Beobachte die Veränderung und kontaktiere dein Behandlungsteam, wenn du unsicher bist, es anhält oder stärker wird.',
 disclaimer:'MEND stellt keine Diagnose und ersetzt keine medizinische Beratung oder Notfallversorgung.'
}:{
 title:'Red Flags',sub:'If something does not feel right, MEND helps you organize the next step.',start:'What are you concerned about?',cats:{pain:'Pain',wound:'Wound / bleeding',breathing:'Breathing / circulation',fever:'Fever / infection signs',swelling:'Swelling',medication:'Medication / side effects',other:'Something else'},
 severity:'How strong is it?',mild:'Mild',moderate:'Moderate',severe:'Severe',worse:'Is it getting worse?',yes:'Yes',no:'No',next:'Continue',back:'Back',restart:'Start over',save:'Save as note',saved:'Saved on this device.',recent:'Recent entries',clinic:'Call care team',emergency:'Call 911',
 emergencyTitle:'Please seek medical help now',emergencyText:'For trouble breathing, chest pain, fainting, severe uncontrolled bleeding, or if you feel in immediate danger, call 911 or your local emergency number.',
 contactTitle:'Please contact your care team now',contactText:'Your answers should be discussed with your care team promptly. If your condition becomes severe or feels life-threatening, call emergency services.',
 monitorTitle:'Monitor and ask if you are unsure',monitorText:'MEND cannot determine whether a symptom is harmless. Watch for changes and contact your care team if you are unsure, it persists, or it becomes worse.',
 disclaimer:'MEND does not diagnose and does not replace medical advice or emergency care.'
}}
function concerns(){try{return JSON.parse(localStorage.getItem(CONCERN_KEY)||'[]')}catch(e){return[]}}
function concernResult(){if(concernDraft.category==='breathing'||concernDraft.severity==='severe')return'emergency';if(concernDraft.worsening==='yes'||concernDraft.severity==='moderate'||concernDraft.category==='wound')return'contact';return'monitor'}
function saveConcern(){if(!concernDraft.category)return;const all=concerns();all.unshift({id:Date.now(),...concernDraft,createdAt:new Date().toISOString()});localStorage.setItem(CONCERN_KEY,JSON.stringify(all.slice(0,20)));renderConcernFlow(true)}
function renderConcernFlow(showSaved=false){const root=document.getElementById('redPage');if(!root)return;const c=concernCopy(),step=!concernDraft.category?1:!concernDraft.severity?2:!concernDraft.worsening?3:4;const emergencyNo=typeof lang!=='undefined'&&lang==='de'?'112':'911';const phone=(typeof user!=='undefined'&&user&&user.phone)||'';let body='';
 if(step===1){body=`<div class="concernQuestion">${c.start}</div><div class="concernGrid">${Object.entries(c.cats).map(([k,v])=>`<button class="concernChoice" data-concern-cat="${k}">${v}<span>›</span></button>`).join('')}</div>`}
 if(step===2){body=`<div class="concernQuestion">${c.severity}</div><div class="concernSegment"><button data-concern-sev="mild">${c.mild}</button><button data-concern-sev="moderate">${c.moderate}</button><button data-concern-sev="severe">${c.severe}</button></div><button class="concernBack" data-concern-back="category">← ${c.back}</button>`}
 if(step===3){body=`<div class="concernQuestion">${c.worse}</div><div class="concernSegment two"><button data-concern-worse="yes">${c.yes}</button><button data-concern-worse="no">${c.no}</button></div><button class="concernBack" data-concern-back="severity">← ${c.back}</button>`}
 if(step===4){const r=concernResult(),title=r==='emergency'?c.emergencyTitle:r==='contact'?c.contactTitle:c.monitorTitle,text=r==='emergency'?c.emergencyText:r==='contact'?c.contactText:c.monitorText;body=`<div class="concernResult ${r}"><div class="concernResultIcon">${r==='emergency'?'!':r==='contact'?'☎':'✓'}</div><h3>${title}</h3><p>${text}</p></div><div class="concernActions">${r==='emergency'?`<a class="concernEmergency" href="tel:${emergencyNo}">${c.emergency}</a>`:''}${phone?`<a class="concernClinic" href="tel:${String(phone).replace(/[^+0-9]/g,'')}">${c.clinic}</a>`:''}<button class="concernSave" data-concern-save>${c.save}</button><button class="concernRestart" data-concern-restart>${c.restart}</button></div>${showSaved?`<div class="concernSaved">✓ ${c.saved}</div>`:''}`}
 const recent=concerns().slice(0,3);const recentHtml=recent.length?`<div class="concernRecent"><h3>${c.recent}</h3>${recent.map(x=>`<div class="concernLog"><div><b>${c.cats[x.category]||c.cats.other}</b><span>${new Date(x.createdAt).toLocaleString((typeof lang!=='undefined'&&lang==='de')?'de-DE':'en-US',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</span></div><span class="concernDot ${x.severity}"></span></div>`).join('')}</div>`:'';
 root.innerHTML=`<div class="concernHero"><div class="concernShield">+</div><div><h2>${c.title}</h2><p>${c.sub}</p></div></div><div class="concernCard">${body}</div>${recentHtml}<div class="concernDisclaimer">${c.disclaimer}</div>`;
 root.querySelectorAll('[data-concern-cat]').forEach(b=>b.onclick=()=>{concernDraft={category:b.dataset.concernCat,severity:'',worsening:''};renderConcernFlow()});
 root.querySelectorAll('[data-concern-sev]').forEach(b=>b.onclick=()=>{concernDraft.severity=b.dataset.concernSev;renderConcernFlow()});
 root.querySelectorAll('[data-concern-worse]').forEach(b=>b.onclick=()=>{concernDraft.worsening=b.dataset.concernWorse;renderConcernFlow()});
 root.querySelectorAll('[data-concern-back]').forEach(b=>b.onclick=()=>{if(b.dataset.concernBack==='category')concernDraft={category:'',severity:'',worsening:''};else concernDraft.severity=concernDraft.worsening='';renderConcernFlow()});
 root.querySelector('[data-concern-save]')?.addEventListener('click',saveConcern);root.querySelector('[data-concern-restart]')?.addEventListener('click',()=>{concernDraft={category:'',severity:'',worsening:''};renderConcernFlow()});
}

/* Morrow Tools brand block in Settings, adapted to MEND. */
function renderMorrowBlock(){const settings=document.querySelector('.settingsSheet .sheetBody');if(!settings)return;let block=document.getElementById('morrowToolsBlock');if(!block){block=document.createElement('div');block.id='morrowToolsBlock';block.className='morrowBlock';const danger=document.getElementById('dangerTitle')?.closest('.settingsSection');if(danger)danger.before(block);else settings.appendChild(block)}const de=typeof lang!=='undefined'&&lang==='de';block.innerHTML=de?'<div class="morrowMark"><span></span><span></span></div><h3>Made by Morrow Tools</h3><p>Ruhige digitale Tools für klarere Genesung, weniger Reibung und bessere Orientierung im Alltag.</p><small>MEND hilft dir, Informationen rund um deine Genesung zu organisieren. Es bietet keine medizinische Beratung, Diagnose oder Notfallversorgung.</small>':'<div class="morrowMark"><span></span><span></span></div><h3>Made by Morrow Tools</h3><p>Calm digital tools for clearer recovery, less friction and better day-to-day orientation.</p><small>MEND helps you organize recovery information. It does not provide medical advice, diagnosis or emergency care.</small>'}
renderMorrowBlock();

if(!document.getElementById('privacySection')){const danger=document.getElementById('dangerTitle')?.closest('.settingsSection');if(danger){const section=document.createElement('div');section.className='settingsSection';section.id='privacySection';section.innerHTML='<h3><span class="copy-de">Datenschutz</span><span class="copy-en">Privacy</span></h3><div class="privacyMini"><div class="privacyMiniTop"><span class="privacyDot"></span><span class="copy-de">Lokal & privat</span><span class="copy-en">Local & private</span></div><p><span class="copy-de">Deine Einträge werden ausschließlich im Browserspeicher dieses Geräts gespeichert.</span><span class="copy-en">Your entries are stored only in this device’s browser storage.</span></p></div>';danger.before(section)}}
if(!document.getElementById('mend-launch-polish')){const style=document.createElement('style');style.id='mend-launch-polish';style.textContent='.privacyMini{margin-top:10px;padding:10px 11px;border:1px solid #DDE7E3;border-radius:14px;background:#FAFFFC}.privacyMiniTop{display:flex;align-items:center;gap:7px;font-size:11.5px;font-weight:750;color:#334155}.privacyDot{width:7px;height:7px;border-radius:50%;background:#10B981}.privacyMini p{margin:6px 0 0;font-size:10.5px;line-height:15px;color:#64748B}.privacyMini .copy-de,.privacyMini .copy-en{display:none}html[lang="de"] .privacyMini .copy-de{display:inline}html[lang="en"] .privacyMini .copy-en{display:inline}.navGrid .nav{min-width:0;padding-left:1px;padding-right:1px}.navGrid .nav span{font-size:9px}.welcome{background:linear-gradient(180deg,#fff 0%,#F8FBFF 58%,#F8FAFC 100%)}.welcomeLogo{margin-bottom:24px}.welcome .leafLogo{transform:scale(1.35);margin-right:5px}.welcome .brand{font-size:21px;letter-spacing:.1em}.welcome h1{font-size:28px;letter-spacing:-.025em}.welcome p{max-width:315px;margin-top:10px;margin-bottom:28px;line-height:21px}.welcome .getStarted{max-width:340px;margin:0 auto;display:block;box-shadow:0 5px 14px rgba(37,99,235,.15)}.concernHero{display:flex;gap:11px;align-items:flex-start;margin:2px 0 12px}.concernHero h2{font-size:20px;margin:0;color:#0F172A}.concernHero p{font-size:11.5px;line-height:16px;color:#64748B;margin:3px 0 0}.concernShield{width:38px;height:38px;border-radius:13px;background:#FFF1F2;color:#BE123C;display:grid;place-items:center;font-weight:900;font-size:22px;flex:0 0 38px}.concernCard{background:#fff;border:1px solid #E8EDF4;border-radius:18px;padding:13px;box-shadow:0 2px 8px rgba(15,23,42,.035)}.concernQuestion{font-size:14px;font-weight:800;margin-bottom:10px}.concernGrid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.concernChoice{min-height:47px;border:1px solid #E2E8F0;border-radius:13px;background:#F8FAFC;color:#334155;font-size:11px;font-weight:700;text-align:left;padding:9px 10px;display:flex;justify-content:space-between;align-items:center}.concernChoice span{font-size:18px;color:#94A3B8}.concernSegment{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.concernSegment.two{grid-template-columns:1fr 1fr}.concernSegment button{height:44px;border:1px solid #E2E8F0;border-radius:12px;background:#F8FAFC;color:#334155;font-size:11.5px;font-weight:750}.concernBack{margin-top:10px;border:0;background:transparent;color:#64748B;font-size:11px}.concernResult{border-radius:15px;padding:13px}.concernResult.emergency{background:#FFF1F2;border:1px solid #FECDD3}.concernResult.contact{background:#FFF7ED;border:1px solid #FED7AA}.concernResult.monitor{background:#F0FDF4;border:1px solid #BBF7D0}.concernResultIcon{width:32px;height:32px;border-radius:10px;background:#fff;display:grid;place-items:center;font-weight:900;margin-bottom:8px}.concernResult h3{font-size:14px;margin:0 0 5px}.concernResult p{font-size:11px;line-height:16px;color:#475569;margin:0}.concernActions{display:grid;gap:7px;margin-top:10px}.concernActions a,.concernActions button{height:43px;border-radius:12px;display:grid;place-items:center;text-decoration:none;font-size:11.5px;font-weight:800}.concernEmergency{background:#B91C1C;color:#fff}.concernClinic{background:#0F172A;color:#fff}.concernSave{border:1px solid #BFDBFE;background:#EFF6FF;color:#1D4ED8}.concernRestart{border:1px solid #E2E8F0;background:#fff;color:#475569}.concernSaved{margin-top:9px;padding:8px;border-radius:10px;background:#ECFDF5;color:#047857;text-align:center;font-size:10.5px;font-weight:750}.concernRecent{margin-top:12px}.concernRecent h3{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#94A3B8;margin:0 0 6px}.concernLog{display:flex;justify-content:space-between;align-items:center;background:#fff;border:1px solid #EEF2F7;border-radius:12px;padding:8px 10px;margin-top:5px}.concernLog b{display:block;font-size:11px}.concernLog span{font-size:9.5px;color:#94A3B8}.concernDot{width:8px!important;height:8px;border-radius:50%;background:#22C55E}.concernDot.moderate{background:#F59E0B}.concernDot.severe{background:#EF4444}.concernDisclaimer{margin-top:10px;font-size:9.5px;line-height:14px;color:#94A3B8;text-align:center}.morrowBlock{margin-top:10px;padding:17px 13px;border-radius:16px;background:linear-gradient(160deg,#F7F3FF,#EEF5FF);border:1px solid #E8E2F7;text-align:center}.morrowBlock h3{margin:7px 0 5px!important;font-size:15px!important;letter-spacing:0!important;text-transform:none!important;color:#0F172A!important}.morrowBlock p{font-size:11px;line-height:16px;color:#475569;margin:0 auto;max-width:310px}.morrowBlock small{display:block;font-size:9.5px;line-height:14px;color:#64748B;margin:8px auto 0;max-width:320px}.morrowMark{display:flex;justify-content:center;align-items:center;height:26px;gap:2px}.morrowMark span{display:block;width:17px;height:23px;border-radius:18px 3px 18px 3px;transform:rotate(-28deg);background:#60A5FA}.morrowMark span+span{background:#77D09A;transform:rotate(35deg)}';document.head.appendChild(style)}
appointmentCopy();renderConcernFlow();renderMorrowBlock();
if(typeof user!=='undefined'&&user&&typeof render==='function')render();
})();
