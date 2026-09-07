'use strict';

const STORAGE_KEY = 'aftercare.pathway.v2';
const $ = id => document.getElementById(id);
const routes = ['today','care-team','profile'];
const pathwayNames = {hip:'Hip Surgery',cardiac:'Cardiac Care',general:'General Surgery'};
const icons = {
  home:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-6h5v6"/></svg>',
  users:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  user:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
  phone:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92z"/></svg>'
};
for (const el of document.querySelectorAll('[data-icon]')) el.innerHTML = icons[el.dataset.icon] || '';

const genericDay = day => [
  {time:'08:00',type:'Medication',title:'Review morning medications',note:'Use only the medications and timing listed in your discharge plan.',info:'Check the medication list provided by your care team. Aftercare does not recommend doses or changes.'},
  {time:'12:00',type:'Care task',title:day <= 3 ? 'Check today’s recovery instructions' : 'Complete today’s care-plan activity',note:'Follow the activity, wound-care, and movement instructions your care team gave you.',info:'Use your discharge instructions as the source of truth. If anything is unclear, contact your care team.'},
  {time:'18:00',type:'Recovery review',title:'Prepare for tomorrow',note:'Review tomorrow’s pathway and note any questions for your care team.',info:'This organizer helps you remember your plan; it does not replace medical instructions.'}
];
const pathwayExtras = {
  hip:{1:'Review mobility and home-safety instructions',3:'Review dressing-care instructions',7:'Review scheduled follow-up details',14:'Review next-stage recovery plan'},
  cardiac:{1:'Review home monitoring instructions',3:'Review incision-care instructions',7:'Review scheduled follow-up details',14:'Review next-stage recovery plan'},
  general:{1:'Review discharge-day instructions',3:'Review wound-care instructions',7:'Review scheduled follow-up details',14:'Review next-stage recovery plan'}
};
function buildPathway(kind){
  return Array.from({length:14},(_,i)=>{
    const day=i+1; const tasks=genericDay(day);
    const extra=pathwayExtras[kind]?.[day];
    if(extra) tasks.splice(1,0,{time:'10:30',type:'Clinical workflow',title:extra,note:'Follow the instructions in your discharge plan or from your care team.',info:'Aftercare does not infer treatment steps. Use your care team’s instructions for the exact task and timing.'});
    return tasks.map((task,index)=>({...task,id:`d${day}-${index}`,done:false}));
  });
}
const emptyState=()=>({onboarded:false,profile:{firstName:'',pathway:'',dischargeDate:''},care:{teamName:'',phone:''},days:[],health:{}});
const localDate=(date=new Date())=>[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
function calendarDay(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return NaN;const[y,m,d]=value.split('-').map(Number);const date=new Date(Date.UTC(y,m-1,d));return date.getUTCFullYear()===y&&date.getUTCMonth()===m-1&&date.getUTCDate()===d?date.getTime()/86400000:NaN}
function dateFromISO(value){const[y,m,d]=value.split('-').map(Number);return new Date(y,m-1,d)}
function addDays(value,delta){const d=dateFromISO(value);d.setDate(d.getDate()+delta);return localDate(d)}
function pathwayDay(dischargeDate,date){const diff=calendarDay(date)-calendarDay(dischargeDate);return Number.isFinite(diff)?diff+1:null}
function validProfile(p){return p&&typeof p.firstName==='string'&&p.firstName.trim()&&pathwayNames[p.pathway]&&Number.isFinite(calendarDay(p.dischargeDate))}
function load(){try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));if(!saved)return emptyState();if(!validProfile(saved.profile)||!Array.isArray(saved.days)||!saved.care||typeof saved.health!=='object')throw new Error();return saved}catch{return emptyState()}}
let state=load();let activeRoute='today';let selectedDate=localDate();let statusTimer;
function notice(message){clearTimeout(statusTimer);$('status').textContent=message;$('status').hidden=false;statusTimer=setTimeout(()=>$('status').hidden=true,3500)}
function save(message){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));if(message)notice(message)}catch{notice('This browser could not save your changes.')}}
function showScreen(screen,focusId){['welcome','onboarding','workspace'].forEach(id=>$(id).hidden=id!==screen);window.scrollTo(0,0);if(focusId)$(focusId).focus()}
function populate(form,values){Object.entries(values).forEach(([k,v])=>{const el=form.elements.namedItem(k);if(el)el.value=v})}
function readProfile(form){const profile={firstName:form.elements.firstName.value.trim(),pathway:form.elements.pathway.value,dischargeDate:form.elements.dischargeDate.value};if(!validProfile(profile)){notice('Enter your name, pathway, and a valid discharge date.');return null}return profile}
function formatDate(value,opts={weekday:'short',month:'short',day:'numeric'}){return new Intl.DateTimeFormat('en-US',opts).format(dateFromISO(value))}
function dayLabel(day){if(day===1)return'Day 1';if(day>=1&&day<=14)return`Day ${day}`;if(day<1)return`Starts in ${1-day} day${1-day===1?'':'s'}`;return'After day 14'}
function renderDateStrip(){const strip=$('date-strip');strip.replaceChildren();for(let offset=-2;offset<=3;offset++){const date=addDays(selectedDate,offset);const b=document.createElement('button');b.className='date-pill';b.type='button';b.dataset.date=date;b.setAttribute('role','option');b.setAttribute('aria-selected',String(date===selectedDate));const isToday=date===localDate();b.innerHTML=`<strong>${isToday?'Today':formatDate(date,{weekday:'short'})}</strong>${formatDate(date,{month:'short',day:'numeric'})}`;b.addEventListener('click',()=>{selectedDate=date;renderToday()});strip.append(b)}}
function currentTasks(){const day=pathwayDay(state.profile.dischargeDate,selectedDate);return day>=1&&day<=14?(state.days[day-1]||[]):[]}
function renderTimeline(){const list=$('pathway-stream');list.replaceChildren();const tasks=currentTasks();if(!tasks.length){const li=document.createElement('li');li.className='empty';const day=pathwayDay(state.profile.dischargeDate,selectedDate);li.textContent=day<1?'Your recovery pathway begins on your discharge date.':day>14?'Your 14-day pathway is complete. Keep following your care team’s plan.':'No pathway steps for this day.';list.append(li);return}tasks.forEach(task=>{const li=document.createElement('li');const time=document.createElement('time');time.textContent=new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit'}).format(new Date(`2000-01-01T${task.time}`));const dot=document.createElement('span');dot.className='timeline-dot';const card=document.createElement('article');card.className=`task-card${task.done?' done':''}`;card.innerHTML=`<div class="task-top"><div><span class="task-type">${task.type}</span><h3>${task.title}</h3></div></div><p>${task.note}</p>`;const actions=document.createElement('div');actions.className='task-actions';const check=document.createElement('button');check.className='task-check';check.textContent=task.done?'Completed ✓':'Mark complete';check.setAttribute('aria-pressed',String(task.done));check.addEventListener('click',()=>{task.done=!task.done;save(task.done?'Milestone completed':'Milestone reopened');renderToday()});const info=document.createElement('button');info.className='task-info';info.textContent='Guidance';info.addEventListener('click',()=>{$('task-dialog-body').innerHTML=`<p><strong>${task.title}</strong></p><p>${task.info}</p>`;$('task-dialog').showModal()});actions.append(check,info);card.append(actions);li.append(time,dot,card);list.append(li)})}
function renderProgress(){const tasks=currentTasks();const done=tasks.filter(t=>t.done).length;const total=tasks.length;const pct=total?Math.round(done/total*100):0;$('progress-count').textContent=`${done}/${total}`;$('progress-text').textContent=`${done} of ${total} milestones completed`;$('progress-bar').style.width=`${pct}%`;$('progress-ring').style.setProperty('--progress',`${pct*3.6}deg`)}
function renderHealth(){const value=state.health[selectedDate]||'';document.querySelectorAll('[data-health]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.health===value)));const saved=$('health-saved');saved.hidden=!value||value==='critical';if(!saved.hidden)saved.textContent=value==='fine'?'✓ Feeling Fine saved to today’s timeline.':'✓ Mild Discomfort saved to today’s timeline.'}
function renderToday(){const day=pathwayDay(state.profile.dischargeDate,selectedDate);$('recovery-day').textContent=day>=1&&day<=14?`Recovery Day ${day} of 14`:dayLabel(day);$('today-title').textContent=selectedDate===localDate()?`Today, ${state.profile.firstName}`:formatDate(selectedDate,{weekday:'long'});$('today-date').textContent=`${formatDate(selectedDate,{month:'long',day:'numeric',year:'numeric'})} · ${pathwayNames[state.profile.pathway]}`;renderDateStrip();renderTimeline();renderProgress();renderHealth()}
function renderCare(){populate($('care-form'),state.care);const number=state.care.phone.replace(/[^+\d]/g,'');const link=$('call-team');link.hidden=!number;if(number)link.href=`tel:${number}`;else link.removeAttribute('href');link.textContent=state.care.teamName?`Call ${state.care.teamName}`:'Call care team'}
function navigate(route,focus=true){if(!routes.includes(route)||!state.onboarded)return;activeRoute=route;routes.forEach(id=>$(id).hidden=id!==route);document.querySelectorAll('.bottom-nav button').forEach(b=>b.dataset.route===route?b.setAttribute('aria-current','page'):b.removeAttribute('aria-current'));if(route==='today')renderToday();if(route==='profile')populate($('profile-form'),state.profile);if(route==='care-team')renderCare();window.scrollTo(0,0);if(focus)$(route).querySelector('h1').focus()}
$('start').addEventListener('click',()=>showScreen('onboarding','onboarding-title'));
$('onboarding-form').addEventListener('submit',e=>{e.preventDefault();const profile=readProfile(e.currentTarget);if(!profile)return;state.profile=profile;state.days=buildPathway(profile.pathway);state.onboarded=true;selectedDate=localDate();save();showScreen('workspace');navigate('today')});
$('prev-day').addEventListener('click',()=>{selectedDate=addDays(selectedDate,-1);renderToday()});$('next-day').addEventListener('click',()=>{selectedDate=addDays(selectedDate,1);renderToday()});
document.querySelectorAll('[data-health]').forEach(button=>button.addEventListener('click',()=>{const value=button.dataset.health;if(value==='critical'){$('critical-dialog').showModal();return}state.health[selectedDate]=value;save('Daily health check saved');renderHealth()}));
$('care-form').addEventListener('submit',e=>{e.preventDefault();const teamName=e.currentTarget.elements.teamName.value.trim();const phone=e.currentTarget.elements.phone.value.trim();if(!teamName||!/^\+?[0-9() .-]{3,30}$/.test(phone)){notice('Enter a care team name and valid phone number.');return}state.care={teamName,phone};save('Care team saved');renderCare()});
$('profile-form').addEventListener('submit',e=>{e.preventDefault();const profile=readProfile(e.currentTarget);if(!profile)return;const rebuild=profile.pathway!==state.profile.pathway||profile.dischargeDate!==state.profile.dischargeDate;state.profile=profile;if(rebuild)state.days=buildPathway(profile.pathway);save('Recovery details saved');selectedDate=localDate();navigate('today')});
for(const b of document.querySelectorAll('[data-route]'))b.addEventListener('click',()=>navigate(b.dataset.route));
$('critical-care').addEventListener('click',()=>{$('critical-dialog').close();navigate('care-team')});for(const b of document.querySelectorAll('[data-close]'))b.addEventListener('click',()=>$(b.dataset.close).close());
if(state.onboarded){showScreen('workspace');navigate('today',false)}if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>notice('Offline access is unavailable.')));