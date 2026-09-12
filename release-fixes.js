/* MEND production stability patch — Etsy launch readiness */
(function(){
'use strict';

const DEMO={
lovenox:{match:i=>i&&i.type==='med'&&i.time==='08:00'&&i.name==='Lovenox 40mg'&&['1 injection subcutaneous','1 Spritze subkutan'].includes(i.detail||''),en:{name:'Lovenox 40mg',detail:'1 injection subcutaneous'},de:{name:'Lovenox 40mg',detail:'1 Spritze subkutan'}},
ice:{match:i=>i&&i.type==='care'&&i.time==='10:00'&&['Ice Pack','Kühlpack'].includes(i.name)&&['20 min cooling','20 Min kühlen'].includes(i.detail||''),en:{name:'Ice Pack',detail:'20 min cooling'},de:{name:'Kühlpack',detail:'20 Min kühlen'}},
tylenol:{match:i=>i&&i.type==='med'&&i.time==='13:00'&&i.name==='Tylenol 500mg'&&['1 tablet','1 Tablette'].includes(i.detail||''),en:{name:'Tylenol 500mg',detail:'1 tablet'},de:{name:'Tylenol 500mg',detail:'1 Tablette'}},
walk:{match:i=>i&&i.type==='care'&&i.time==='16:00'&&['Walking Exercise','Kurzer Spaziergang'].includes(i.name)&&['10 min gentle walk','10 Min locker gehen'].includes(i.detail||''),en:{name:'Walking Exercise',detail:'10 min gentle walk'},de:{name:'Kurzer Spaziergang',detail:'10 Min locker gehen'}},
followup:{match:i=>i&&i.type==='appt'&&i.time==='19:00'&&['Follow-up Call','Kontrollanruf'].includes(i.name)&&['Check in with clinic','Klinik kontaktieren'].includes(i.location||''),en:{name:'Follow-up Call',location:'Check in with clinic'},de:{name:'Kontrollanruf',location:'Klinik kontaktieren'}}
};
function tagKnownDemoItems(){if(typeof state==='undefined'||!state||!Array.isArray(state.items))return false;let changed=false;state.items.forEach(item=>{if(item._mendDemoKey||item._mendUserCreated)return;for(const [key,cfg] of Object.entries(DEMO)){if(cfg.match(item)){item._mendDemoKey=key;changed=true;break}}});return changed}
function localizeDemoItems(){if(typeof state==='undefined'||!state||!Array.isArray(state.items)||typeof lang==='undefined')return false;let changed=tagKnownDemoItems();state.items.forEach(item=>{const cfg=DEMO[item._mendDemoKey];if(!cfg)return;const copy=cfg[lang==='de'?'de':'en'];Object.entries(copy).forEach(([k,v])=>{if(item[k]!==v){item[k]=v;changed=true}})});if(changed&&typeof save==='function')save();return changed}

/* First-launch welcome: shown once on this device, before setup. Existing configured users are never interrupted. */
const INTRO_KEY='mend_intro_seen_v1';
if(typeof user!=='undefined'&&!user&&localStorage.getItem(INTRO_KEY)!=='1'){
  const welcome=document.getElementById('welcomeScreen');
  if(welcome){
    welcomePassed=false;
    const title=document.getElementById('welcomeTitle'),sub=document.getElementById('welcomeSub'),button=document.getElementById('getStarted');
    const setIntroCopy=()=>{
      const de=typeof lang!=='undefined'&&lang==='de';
      if(title)title.textContent=de?'Hallo bei MEND':'Welcome to MEND';
      if(sub)sub.textContent=de?'Dein ruhiger Begleiter für Medikamente, Pflege und Termine nach dem Eingriff.':'A calm companion for medications, care and appointments after your procedure.';
      if(button)button.textContent=de?'MEND einrichten':'Set up MEND';
      const hs=welcome.querySelectorAll('.highlight span');
      const copy=de?['Dein Tagesplan auf einen Blick','Medikamente, Pflege & Termine getrennt','Deine Daten bleiben auf diesem Gerät']:['Your daily recovery plan at a glance','Medications, care & appointments separated','Your data stays on this device'];
      hs.forEach((el,i)=>{if(copy[i])el.textContent=copy[i]});
    };
    setIntroCopy();
    welcome.querySelectorAll('.langBtn').forEach(b=>b.addEventListener('click',()=>setTimeout(setIntroCopy,0)));
    if(button)button.addEventListener('click',()=>localStorage.setItem(INTRO_KEY,'1'));
  }
}

/* Add a dedicated Appointments page/tab without changing the released visual language. */
const carePage=document.getElementById('carePage');
if(carePage&&!document.getElementById('apptPage')){
  const p=document.createElement('section');p.id='apptPage';p.className='page hidden';
  p.innerHTML='<div class="sectionHead"><h2 id="apptPageTitle"></h2><p id="apptPageSub"></p></div><div id="apptList" class="list"></div><div id="apptEmpty" class="emptyCard hidden"></div>';
  carePage.after(p);
}
const navGrid=document.querySelector('.navGrid');
if(navGrid&&!navGrid.querySelector('[data-page="appt"]')){
  const red=navGrid.querySelector('[data-page="red"]');
  const b=document.createElement('button');b.className='nav';b.dataset.page='appt';b.innerHTML='<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg><span id="navAppt"></span>';
  red.before(b);
}
if(navGrid)navGrid.style.gridTemplateColumns='repeat(5,minmax(0,1fr))';

function appointmentCopy(){const de=typeof lang!=='undefined'&&lang==='de';const x={title:de?'Termine':'Appointments',sub:de?'Kontrollen und geplante Termine':'Follow-ups and scheduled appointments',empty:de?'Für diesen Tag sind keine Termine geplant.':'No appointments scheduled for this day.'};const t1=document.getElementById('apptPageTitle'),t2=document.getElementById('apptPageSub'),t3=document.getElementById('apptEmpty'),n=document.getElementById('navAppt');if(t1)t1.textContent=x.title;if(t2)t2.textContent=x.sub;if(t3)t3.textContent=x.empty;if(n)n.textContent=x.title}
function wireListRows(root){if(!root)return;root.querySelectorAll('.listItem').forEach(r=>{const id=r.dataset.id;const e=r.querySelector('.edit'),d=r.querySelector('.delete');if(e)e.onclick=()=>openEdit(id);if(d)d.onclick=()=>del(id)})}
if(typeof renderLists==='function')renderLists=function(){const date=typeof dayDate==='function'?dayDate():'';const meds=state.items.filter(i=>i.date===date&&i.type==='med'),care=state.items.filter(i=>i.date===date&&i.type==='care'),appts=state.items.filter(i=>i.date===date&&i.type==='appt');$('medList').innerHTML=meds.map(listHTML).join('');$('careList').innerHTML=care.map(listHTML).join('');const al=document.getElementById('apptList');if(al)al.innerHTML=appts.map(listHTML).join('');$('medEmpty').classList.toggle('hidden',meds.length>0);$('careEmpty').classList.toggle('hidden',care.length>0);const ae=document.getElementById('apptEmpty');if(ae)ae.classList.toggle('hidden',appts.length>0);wireListRows($('medList'));wireListRows($('careList'));wireListRows(al);appointmentCopy()};

/* Extend routing only for the new page. Existing pages and add flows stay untouched. */
document.querySelectorAll('.nav').forEach(b=>{if(b.dataset.page==='appt')b.onclick=()=>{page='appt';document.querySelectorAll('.nav').forEach(x=>x.classList.toggle('active',x.dataset.page===page));['today','meds','care','appt','red'].forEach(p=>{const el=document.getElementById(p+'Page');if(el)el.classList.toggle('hidden',p!==page)});$('addBtn').style.display='block';renderLists();renderProgress()}});
const baseRender=typeof render==='function'?render:null;
if(baseRender)render=function(){if(page==='appt')page='today';baseRender();appointmentCopy()};

localizeDemoItems();
document.querySelectorAll('.langBtn').forEach(btn=>btn.addEventListener('click',()=>setTimeout(()=>{appointmentCopy();if(localizeDemoItems()&&typeof render==='function')render()},0)));

if(!document.getElementById('privacySection')){const danger=document.getElementById('dangerTitle')?.closest('.settingsSection');if(danger){const section=document.createElement('div');section.className='settingsSection';section.id='privacySection';section.innerHTML='<h3><span class="copy-de">Datenschutz</span><span class="copy-en">Privacy</span></h3><div class="privacyMini"><div class="privacyMiniTop"><span class="privacyDot"></span><span class="copy-de">Lokal & privat</span><span class="copy-en">Local & private</span></div><p><span class="copy-de">Deine Einträge werden ausschließlich im Browserspeicher dieses Geräts gespeichert. MEND überträgt deine Gesundheits- und Planungsdaten nicht an einen Server und verwendet kein Werbe-Tracking.</span><span class="copy-en">Your entries are stored only in this device’s browser storage. MEND does not send your health or recovery-plan data to a server and does not use advertising tracking.</span></p></div>';danger.before(section)}}
if(!document.getElementById('mend-launch-polish')){const style=document.createElement('style');style.id='mend-launch-polish';style.textContent='.privacyMini{margin-top:10px;padding:10px 11px;border:1px solid #DDE7E3;border-radius:14px;background:linear-gradient(180deg,#FAFFFC,#F8FCFA)}.privacyMiniTop{display:flex;align-items:center;gap:7px;font-size:11.5px;font-weight:750;color:#334155}.privacyDot{width:7px;height:7px;border-radius:50%;background:#10B981}.privacyMini p{margin:6px 0 0;font-size:10.5px;line-height:15px;color:#64748B}.privacyMini .copy-de,.privacyMini .copy-en{display:none}html[lang="de"] .privacyMini .copy-de{display:inline}html[lang="en"] .privacyMini .copy-en{display:inline}.navGrid .nav{min-width:0;padding-left:1px;padding-right:1px}.navGrid .nav span{font-size:9px}';document.head.appendChild(style)}
appointmentCopy();
if(typeof user!=='undefined'&&user&&typeof render==='function')render();
})();
