import { CONFIG } from "./config.js";
import { commerce } from "./commerce.js";
import { LocalStorageAdapter } from "./storage.js";
import {
  makeDefaultState, migrate, isComplete, todayISO, recoveryDay,
  taskDueToday, taskDoneToday, medDueToday, medDoneToday,
  nextVisit, dueItems, nextStep
} from "./state.js";
import { $, $$, esc, formatDate, formatDateTime, showToast, openSheet, closeSheet, routeTo, setPlanTab } from "./ui.js";

const storage = new LocalStorageAdapter();
const loaded = storage.load();
let state = migrate(loaded.data);

if(loaded.source !== "current") storage.save(state);

const journey = [
  [1,"Set up the essentials","Keep trusted instructions, medication, tasks and your next visit in one place."],
  [2,"Make today smaller","Use the next-step view instead of trying to remember the whole week."],
  [3,"Prepare a handoff","Write down only what a helper actually needs to know."],
  [5,"Collect your questions","Save questions as they occur instead of relying on memory."],
  [7,"First-week review","Look back at your entries and tidy the plan."],
  [10,"Clear the clutter","Remove tasks that are no longer useful."],
  [14,"Two-week review","Update visits, helpers and trusted instructions if your real-world plan changed."],
  [21,"Prepare for follow-up","Bring your questions and notes together before a conversation."],
  [30,"Recovery admin wrap-up","Create a summary and keep only what still needs follow-up."]
];

const id = prefix => `${prefix}-${crypto.randomUUID?.() || Date.now()}`;
const greeting = () => { const h=new Date().getHours(); return h<12?"Good morning.":h<18?"Good afternoon.":"Good evening."; };
const save = () => { storage.save(state); render(); };
const complete = () => isComplete(state);

function planDayStats(){
  const tasks = state.tasks.filter(taskDueToday);
  const meds = state.meds.filter(medDueToday);
  const total = tasks.length + meds.length;
  const done = tasks.filter(taskDoneToday).length + meds.filter(medDoneToday).length;
  return { total, done, pct: total ? Math.round(done/total*100) : 100 };
}

function renderHome(){
  const day = recoveryDay(state);
  $("#recoveryLabel").textContent = `RECOVERY DAY ${day}`;
  $("#homeHeading").textContent = greeting();
  $("#brandSub").textContent = state.profile ? `${state.profile.type} · Day ${day}` : "Recovery, organized.";
  $("#todayChip").textContent = new Date().toLocaleDateString([], {weekday:"short",month:"short",day:"numeric"});
  $("#journeyChip").textContent = `Day ${Math.min(day,30)} of 30`;
  $("#planChip").textContent = complete() ? "AfterCare Complete" : "Complete preview";

  const stats = planDayStats();
  $("#progressRing").style.setProperty("--progress",stats.pct);
  $("#progressPct").textContent = `${stats.pct}%`;

  const next = nextStep(state);
  $("#nextIcon").textContent = next.icon || "→";
  $("#nextTitle").textContent = next.title;
  $("#nextText").textContent = next.text;

  const combined = [
    ...state.meds.filter(medDueToday).map(m => ({kind:"med",id:m.id,title:`${m.time || "Any time"} · ${m.name}`, note:m.note || "Medication schedule", done:medDoneToday(m), sort:m.time || "99:59"})),
    ...state.tasks.filter(taskDueToday).map(t => ({kind:"task",id:t.id,title:t.title,note:t.note || "Today",done:taskDoneToday(t),sort:t.time || "99:58"}))
  ].sort((a,b)=>a.sort.localeCompare(b.sort));

  $("#todayTimeline").innerHTML = combined.length ? combined.map(item => `
    <div class="timeline-item">
      <button class="check-btn ${item.done?"is-done":""}" data-toggle-kind="${item.kind}" data-toggle-id="${esc(item.id)}">${item.done?"✓":""}</button>
      <div><b>${esc(item.title)}</b><small>${esc(item.note)}</small></div>
      <span class="item-kind">${item.kind==="med"?"Med":"Task"}</span>
    </div>`).join("") : `<div class="empty">Nothing is scheduled for today yet. Use + Add when you need something.</div>`;

  const routine = state.routines[todayISO()] || {};
  $("#morningRoutine").classList.toggle("is-done", !!routine.morning);
  $("#eveningRoutine").classList.toggle("is-done", !!routine.evening);
  $("#morningStatus").textContent = routine.morning ? "Done for today." : "Review the day in under a minute.";
  $("#eveningStatus").textContent = routine.evening ? "Done for today." : "Close the loop before you switch off.";

  const latest = state.checkins[0];
  $("#painMetric").textContent = latest ? latest.pain : "—";
  $("#energyMetric").textContent = latest ? latest.energy : "—";
  const meds = state.meds.filter(medDueToday);
  $("#medMetric").textContent = `${meds.filter(medDoneToday).length}/${meds.length}`;
  const visit = nextVisit(state);
  $("#visitMetric").textContent = visit ? formatDate(visit.date) : "—";
}

function renderPlan(){
  setPlanTab(state.ui.planTab || "tasks");

  $("#taskList").innerHTML = state.tasks.length ? [...state.tasks].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).map(t=>`
    <div class="list-card">
      <button class="check-btn ${taskDoneToday(t)?"is-done":""}" data-toggle-kind="task" data-toggle-id="${esc(t.id)}">${taskDoneToday(t)?"✓":""}</button>
      <div><b>${esc(t.title)}</b><small>${esc(formatDate(t.date))}${t.time?` · ${esc(t.time)}`:""}${t.repeat==="daily"?" · repeats daily":""}${t.note?` · ${esc(t.note)}`:""}</small></div>
      <button class="remove-btn" data-remove-kind="task" data-remove-id="${esc(t.id)}">×</button>
    </div>`).join("") : `<div class="empty card">No tasks yet.</div>`;

  $("#medList").innerHTML = state.meds.length ? [...state.meds].sort((a,b)=>(a.time||"99:59").localeCompare(b.time||"99:59")).map(m=>`
    <div class="list-card">
      <button class="check-btn ${medDoneToday(m)?"is-done":""}" data-toggle-kind="med" data-toggle-id="${esc(m.id)}">${medDoneToday(m)?"✓":""}</button>
      <div><b>${esc(m.time || "Any time")} · ${esc(m.name)}</b><small>${esc(m.note || "No extra instruction entered")} · ${m.repeat==="daily"?"daily":"one-time"}</small></div>
      <button class="remove-btn" data-remove-kind="med" data-remove-id="${esc(m.id)}">×</button>
    </div>`).join("") : `<div class="empty card">No medication entries yet.</div>`;

  $("#visitList").innerHTML = state.visits.length ? [...state.visits].sort((a,b)=>new Date(a.date)-new Date(b.date)).map(v=>`
    <div class="list-card">
      <div class="settings-icon">◫</div>
      <div><b>${esc(v.title)}</b><small>${esc(formatDateTime(v.date))}${v.place?` · ${esc(v.place)}`:""}</small></div>
      <button class="remove-btn" data-remove-kind="visit" data-remove-id="${esc(v.id)}">×</button>
    </div>`).join("") : `<div class="empty card">No visits yet.</div>`;

  $("#questionList").innerHTML = state.questions.length ? state.questions.map(q=>`
    <div class="list-card">
      <div class="settings-icon">?</div>
      <div><b>${esc(q.text)}</b></div>
      <button class="remove-btn" data-remove-kind="question" data-remove-id="${esc(q.id)}">×</button>
    </div>`).join("") : `<div class="empty card">No questions saved yet.</div>`;
}

function renderCheckin(){
  $$("#checkPeriodTabs button").forEach(b=>b.classList.toggle("is-active", b.dataset.period === state.ui.checkPeriod));
  const values = state.checkins.slice(0,7).reverse();
  $("#painChart").innerHTML = values.length ? values.map(c=>`<div class="bar" style="height:${Math.max(8,c.pain*10)}%"><span>${c.pain}</span></div>`).join("") : `<div class="empty">Add check-ins to build your visual history.</div>`;
  $("#trendCard").classList.toggle("is-locked", !complete());
  $("#checkCount").textContent = state.checkins.length ? `${state.checkins.length} saved` : "";
  $("#checkHistory").innerHTML = state.checkins.length ? state.checkins.slice(0,10).map(c=>`
    <div class="list-card">
      <div class="settings-icon">♡</div>
      <div><b>${esc(formatDateTime(c.timestamp))} · ${esc(c.period)}</b><small>Pain ${c.pain}/10 · Energy ${esc(c.energy)} · ${esc(c.function)}${c.notes?` · ${esc(c.notes)}`:""}</small></div>
      <span></span>
    </div>`).join("") : `<div class="empty card">No check-ins yet.</div>`;
}

function render(){
  renderHome();
  renderPlan();
  renderCheckin();
  bindDynamic();
}

function bindDynamic(){
  $$("[data-toggle-kind]").forEach(btn=>btn.onclick=()=>toggleItem(btn.dataset.toggleKind, btn.dataset.toggleId));
  $$("[data-remove-kind]").forEach(btn=>btn.onclick=()=>removeItem(btn.dataset.removeKind, btn.dataset.removeId));
}

function toggleItem(kind, itemId){
  const today = todayISO();
  if(kind==="task"){
    const t=state.tasks.find(x=>x.id===itemId); if(!t) return;
    t.doneDates = t.doneDates || [];
    t.doneDates = t.doneDates.includes(today) ? t.doneDates.filter(d=>d!==today) : [...t.doneDates,today];
  } else {
    const m=state.meds.find(x=>x.id===itemId); if(!m) return;
    m.takenDates = m.takenDates || [];
    m.takenDates = m.takenDates.includes(today) ? m.takenDates.filter(d=>d!==today) : [...m.takenDates,today];
  }
  save();
}

function removeItem(kind, itemId){
  if(kind==="task") state.tasks = state.tasks.filter(x=>x.id!==itemId);
  if(kind==="med") state.meds = state.meds.filter(x=>x.id!==itemId);
  if(kind==="visit") state.visits = state.visits.filter(x=>x.id!==itemId);
  if(kind==="question") state.questions = state.questions.filter(x=>x.id!==itemId);
  save();
}

function startRoutine(period){
  const key=todayISO();
  state.routines[key] = state.routines[key] || {};
  state.routines[key][period] = true;
  state.ui.checkPeriod = period;
  save();
  routeTo("checkin");
  showToast(period==="morning" ? "Morning reset started." : "Evening wrap-up started.");
}

function executeNextStep(){
  const next = nextStep(state);
  if(next.kind==="med"){ state.ui.planTab="meds"; save(); routeTo("plan"); setPlanTab("meds"); return; }
  if(next.kind==="task"){ toggleItem("task",next.id); showToast("Task marked done."); return; }
  if(next.kind==="routine"){ startRoutine(next.period); return; }
  if(next.kind==="checkin"){ state.ui.checkPeriod=next.period; save(); routeTo("checkin"); return; }
  showToast("You’re caught up.");
}

function addTaskSheet(){
  openSheet("Add task", `
    <div class="card">
      <label class="field"><span>Task</span><input id="fTaskTitle" placeholder="Prepare questions for tomorrow"></label>
      <div class="button-row">
        <label class="field" style="flex:1"><span>Date</span><input id="fTaskDate" type="date" value="${todayISO()}"></label>
        <label class="field" style="flex:1"><span>Time (optional)</span><input id="fTaskTime" type="time"></label>
      </div>
      <label class="field"><span>Repeat</span><select id="fTaskRepeat"><option value="none">No repeat</option><option value="daily">Every day</option></select></label>
      <label class="field"><span>Note</span><input id="fTaskNote" placeholder="Optional"></label>
      <button class="btn btn--primary btn--full" id="fSaveTask">Add task</button>
    </div>`);
  $("#fSaveTask").onclick=()=>{
    const title=$("#fTaskTitle").value.trim(); if(!title){showToast("Add a task name.");return;}
    state.tasks.push({id:id("t"),title,date:$("#fTaskDate").value||todayISO(),time:$("#fTaskTime").value,repeat:$("#fTaskRepeat").value,note:$("#fTaskNote").value.trim(),doneDates:[]});
    closeSheet(); save(); showToast("Task added.");
  };
}

function addMedSheet(){
  openSheet("Add medication", `
    <div class="notice">Only enter medication information from a trusted source.</div>
    <div class="card">
      <label class="field"><span>Name</span><input id="fMedName" placeholder="Medication name"></label>
      <div class="button-row">
        <label class="field" style="flex:1"><span>Time</span><input id="fMedTime" type="time"></label>
        <label class="field" style="flex:1"><span>Repeat</span><select id="fMedRepeat"><option value="daily">Every day</option><option value="once">One-time</option></select></label>
      </div>
      <label class="field"><span>Instructions copied from label / care team</span><input id="fMedNote" placeholder="Optional"></label>
      <button class="btn btn--primary btn--full" id="fSaveMed">Add medication</button>
    </div>`);
  $("#fSaveMed").onclick=()=>{
    const name=$("#fMedName").value.trim(); if(!name){showToast("Add a medication name.");return;}
    state.meds.push({id:id("m"),name,time:$("#fMedTime").value,repeat:$("#fMedRepeat").value,note:$("#fMedNote").value.trim(),startDate:todayISO(),takenDates:[]});
    closeSheet(); save(); showToast("Medication added.");
  };
}

function addVisitSheet(){
  openSheet("Add visit", `
    <div class="card">
      <label class="field"><span>Visit / clinician</span><input id="fVisitTitle" placeholder="Follow-up"></label>
      <label class="field"><span>Date & time</span><input id="fVisitDate" type="datetime-local"></label>
      <label class="field"><span>Location / note</span><input id="fVisitPlace" placeholder="Clinic, address, video call…"></label>
      <button class="btn btn--primary btn--full" id="fSaveVisit">Add visit</button>
    </div>`);
  $("#fSaveVisit").onclick=()=>{
    const title=$("#fVisitTitle").value.trim(), date=$("#fVisitDate").value;
    if(!title||!date){showToast("Add a visit name and date.");return;}
    state.visits.push({id:id("v"),title,date,place:$("#fVisitPlace").value.trim()});
    closeSheet(); save(); showToast("Visit added.");
  };
}

function addQuestionSheet(){
  openSheet("Add a question", `
    <div class="card">
      <label class="field"><span>Question for your care team</span><textarea id="fQuestion" placeholder="What do you want to remember to ask?"></textarea></label>
      <button class="btn btn--primary btn--full" id="fSaveQuestion">Save question</button>
    </div>`);
  $("#fSaveQuestion").onclick=()=>{
    const text=$("#fQuestion").value.trim(); if(!text)return;
    state.questions.push({id:id("q"),text}); closeSheet(); save(); showToast("Question saved.");
  };
}

function quickAddSheet(){
  openSheet("Quick add", `
    <div class="quick-grid">
      <button id="qaTask">✓<b>Task</b></button>
      <button id="qaMed">💊<b>Medication</b></button>
      <button id="qaVisit">◫<b>Visit</b></button>
      <button id="qaQuestion">?<b>Question</b></button>
    </div>`);
  $("#qaTask").onclick=addTaskSheet; $("#qaMed").onclick=addMedSheet; $("#qaVisit").onclick=addVisitSheet; $("#qaQuestion").onclick=addQuestionSheet;
}

function settingsSheet(){
  const checkout = commerce.checkoutUrl();
  const configured = commerce.isConfigured();
  openSheet("Settings & access", `
    <div class="notice notice--danger"><b>Not medical advice.</b> Do not use AfterCare OS to decide whether symptoms are urgent.</div>

    <div class="card">
      <span class="eyebrow">Access</span>
      <h3 style="margin:7px 0">${complete() ? "AfterCare Complete" : "AfterCare Preview"}</h3>
      <p class="fine">${complete() ? "Complete features are unlocked on this device." : "Activate a paid license to unlock Complete."}</p>
      ${complete() ? `
        <button class="btn btn--secondary btn--full" id="revalidateLicense" ${state.entitlement.source==="lemonsqueezy"?"":"disabled"}>Re-check license</button>
      ` : `
        <button class="btn btn--primary btn--full" id="openLicenseActivation">Activate license</button>
        ${checkout ? `<a class="btn btn--quiet btn--full" style="display:block;text-align:center;text-decoration:none;margin-top:8px" href="${esc(checkout)}" target="_blank" rel="noopener">Buy AfterCare Complete</a>` : ""}
        ${CONFIG.completeDemoEnabled ? `<button class="btn btn--quiet btn--full" style="margin-top:8px" id="settingsDemoUnlock">Unlock demo for testing</button>` : ""}
      `}
      ${!configured ? `<p class="fine" style="margin-top:10px">Commerce adapter is prepared but not connected to the final Lemon Squeezy product IDs yet.</p>` : ""}
    </div>

    <div class="card" style="padding:15px;margin-top:10px">
      <span class="eyebrow">Data</span><h3 style="margin:7px 0">Reset local data</h3>
      <p class="fine">Deletes all AfterCare OS data stored by this prototype in this browser.</p>
      <button class="btn btn--secondary btn--full" id="settingsReset">Reset app</button>
    </div>`);

  const activate=$("#openLicenseActivation");
  if(activate) activate.onclick=licenseActivationSheet;

  const demo=$("#settingsDemoUnlock");
  if(demo) demo.onclick=()=>{ unlockComplete(); closeSheet(); };

  const revalidate=$("#revalidateLicense");
  if(revalidate) revalidate.onclick=async()=>{
    revalidate.disabled=true; revalidate.textContent="Checking…";
    try{
      const valid=await commerce.validate(state.entitlement);
      state.entitlement.lastValidatedAt=new Date().toISOString();
      if(!valid) state.entitlement={tier:"preview",source:"none",licenseKey:"",instanceId:"",customerEmail:"",lastValidatedAt:""};
      save(); closeSheet(); showToast(valid ? "License is valid." : "License is no longer valid.");
    }catch(e){ showToast(e.message || "Could not check license."); revalidate.disabled=false; revalidate.textContent="Re-check license"; }
  };

  $("#settingsReset").onclick=()=>{ if(confirm("Delete all local AfterCare OS data?")){ storage.clear(); location.reload(); } };
}

function licenseActivationSheet(){
  openSheet("Activate AfterCare Complete", `
    <div class="card">
      <span class="eyebrow">Purchased already?</span>
      <h3 style="margin:7px 0">Activate this device</h3>
      <p class="fine">Use the email from checkout and the license key from your receipt.</p>
      <label class="field"><span>Checkout email</span><input id="licenseEmail" type="email" autocomplete="email" placeholder="you@example.com"></label>
      <label class="field"><span>License key</span><input id="licenseKeyInput" autocomplete="off" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"></label>
      <button class="btn btn--primary btn--full" id="activateLicenseBtn">Activate Complete</button>
      <p class="fine">The final product will validate that the key belongs to the correct AfterCare product and purchaser.</p>
    </div>`);

  $("#activateLicenseBtn").onclick=async()=>{
    const email=$("#licenseEmail").value.trim();
    const licenseKey=$("#licenseKeyInput").value.trim();
    if(!email || !licenseKey){ showToast("Enter your checkout email and license key."); return; }
    const btn=$("#activateLicenseBtn"); btn.disabled=true; btn.textContent="Activating…";
    try{
      const entitlement=await commerce.activate({
        email, licenseKey,
        instanceName:`AfterCare OS · ${navigator.platform || "device"}`
      });
      state.entitlement={tier:"complete",source:"lemonsqueezy",...entitlement,lastValidatedAt:new Date().toISOString()};
      save(); closeSheet(); showToast("AfterCare Complete activated.");
    }catch(e){
      showToast(e.message || "Activation failed.");
      btn.disabled=false; btn.textContent="Activate Complete";
    }
  };
}
function unlockComplete(){
  state.entitlement = {tier:"complete",source:"demo",licenseKey:"",instanceId:"",customerEmail:"",lastValidatedAt:""};
  save(); showToast("Complete demo unlocked.");
}

function careNotesSheet(){
  openSheet("Care instructions", `<div class="notice">Store only instructions you trust and were actually given.</div><div class="card"><label class="field"><span>Care instructions</span><textarea id="fCare">${esc(state.notes.careInstructions)}</textarea></label><button class="btn btn--primary btn--full" id="saveCare">Save</button></div>`);
  $("#saveCare").onclick=()=>{state.notes.careInstructions=$("#fCare").value;closeSheet();save();showToast("Saved.");};
}
function contactSheet(){
  openSheet("Important contact note", `<div class="card"><label class="field"><span>Trusted contact note</span><textarea id="fContact">${esc(state.notes.contactNote)}</textarea></label><button class="btn btn--primary btn--full" id="saveContact">Save</button></div>`);
  $("#saveContact").onclick=()=>{state.notes.contactNote=$("#fContact").value;closeSheet();save();showToast("Saved.");};
}

function gateOr(action){
  if(complete()) return action();
  openSheet("AfterCare Complete", `<div class="card" style="text-align:center"><span class="pill">Complete</span><h3>Unlock this feature</h3><p class="fine">In the commercial version, this will be connected to a real purchase entitlement.</p><button class="btn btn--primary btn--full" id="gateUnlock">Unlock Complete demo</button></div>`);
  $("#gateUnlock").onclick=()=>{unlockComplete();closeSheet();setTimeout(action,0);};
}

function caregiverSheet(){
  gateOr(()=>{
    openSheet("Caregiver handoff", `<div class="card">
      <label class="field"><span>Who is helping?</span><textarea id="fHelpers">${esc(state.notes.helpers)}</textarea></label>
      <label class="field"><span>What should they know today?</span><textarea id="fHandoff">${esc(state.notes.handoff)}</textarea></label>
      <div class="button-row"><button class="btn btn--quiet" id="saveHandoff">Save</button><button class="btn btn--primary" id="copyHandoff">Copy handoff</button></div>
    </div>`);
    $("#saveHandoff").onclick=()=>{state.notes.helpers=$("#fHelpers").value;state.notes.handoff=$("#fHandoff").value;save();showToast("Saved.");};
    $("#copyHandoff").onclick=async()=>{
      state.notes.helpers=$("#fHelpers").value;state.notes.handoff=$("#fHandoff").value;save();
      const meds=state.meds.filter(medDueToday).map(m=>`${m.time||"Any time"} ${m.name} — ${medDoneToday(m)?"logged taken":"not logged taken"}`).join("\\n")||"No medication entries.";
      const open=state.tasks.filter(t=>taskDueToday(t)&&!taskDoneToday(t)).map(t=>`• ${t.title}`).join("\\n")||"No open tasks.";
      const text=`AFTERCARE HANDOFF\\n${state.profile?.name||""} · Recovery day ${recoveryDay(state)}\\n\\nTODAY'S MEDICATION LOG\\n${meds}\\n\\nOPEN TASKS\\n${open}\\n\\nHELPERS\\n${state.notes.helpers||"—"}\\n\\nTODAY'S NOTE\\n${state.notes.handoff||"—"}\\n\\nOrganizational information only.`;
      try{await navigator.clipboard.writeText(text);showToast("Handoff copied.");}catch{showToast("Copy unavailable on this browser.");}
    };
  });
}

function journeySheet(){
  gateOr(()=>{
    const day=recoveryDay(state);
    openSheet("30-day journey", `<div class="notice">These are organizational prompts, not medical milestones.</div><div class="journey">${journey.map(j=>`<div class="journey-item ${day>j[0]?"is-done":""} ${day===j[0]?"is-current":""}"><div class="journey-dot">${day>j[0]?"✓":j[0]}</div><div><b>Day ${j[0]} · ${esc(j[1])}</b><small>${esc(j[2])}</small></div></div>`).join("")}</div>`,{wide:true});
  });
}

function printReport(){
  gateOr(()=>{
    $("#reportMeta").textContent = `${state.profile?.name||""} · ${state.profile?.type||""} · Recovery day ${recoveryDay(state)} · ${new Date().toLocaleDateString()}`;
    $("#reportMeds").innerHTML = state.meds.length ? `<ul>${state.meds.map(m=>`<li>${esc(m.time||"Any time")} · ${esc(m.name)}${m.note?` — ${esc(m.note)}`:""}</li>`).join("")}</ul>` : "None entered.";
    $("#reportVisits").innerHTML = state.visits.length ? `<ul>${state.visits.map(v=>`<li>${esc(formatDateTime(v.date))} — ${esc(v.title)}${v.place?` — ${esc(v.place)}`:""}</li>`).join("")}</ul>` : "None entered.";
    $("#reportQuestions").innerHTML = state.questions.length ? `<ul>${state.questions.map(q=>`<li>${esc(q.text)}</li>`).join("")}</ul>` : "None entered.";
    $("#reportChecks").innerHTML = state.checkins.length ? `<ul>${state.checkins.slice(0,14).map(c=>`<li>${esc(formatDateTime(c.timestamp))} — pain ${c.pain}/10; energy ${esc(c.energy)}; function: ${esc(c.function)}${c.notes?` — ${esc(c.notes)}`:""}</li>`).join("")}</ul>` : "None entered.";
    $("#reportInstructions").textContent = state.notes.careInstructions || "None entered.";
    $("#reportHelpers").textContent = [state.notes.helpers,state.notes.handoff].filter(Boolean).join("\\n\\n") || "None entered.";
    window.print();
  });
}

function exportData(){
  const blob=storage.export(state); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="aftercare-os-backup.json"; a.click(); setTimeout(()=>URL.revokeObjectURL(url),500);
}

function onboarding(){
  const ob = $("#onboarding");
  if(state.profile){ ob.classList.add("is-hidden"); return; }
  $("#obDate").value = todayISO();

  $$("#recoveryChoices button").forEach(btn=>btn.onclick=()=>{
    $$("#recoveryChoices button").forEach(b=>b.classList.remove("is-selected"));
    btn.classList.add("is-selected");
  });
  $$("#moduleChoices button").forEach(btn=>btn.onclick=()=>btn.classList.toggle("is-selected"));

  const goStep = n => {
    $$(".onboarding-step").forEach(s=>s.classList.toggle("is-active", Number(s.dataset.step)===n));
    $$(".step-dots span").forEach((d,i)=>d.classList.toggle("is-active", i<n));
  };
  $$("[data-next-step]").forEach(btn=>btn.onclick=()=>{
    if(btn.dataset.nextStep==="2" && !$("#recoveryChoices .is-selected")){showToast("Choose a recovery type first.");return;}
    goStep(Number(btn.dataset.nextStep));
  });
  $$("[data-prev-step]").forEach(btn=>btn.onclick=()=>goStep(Number(btn.dataset.prevStep)));

  $("#finishOnboarding").onclick=()=>{
    const selected=$("#recoveryChoices .is-selected");
    state.profile={name:$("#obName").value.trim()||"there",type:selected?.dataset.value||"Recovery",date:$("#obDate").value||todayISO()};
    state.modules=$$("#moduleChoices .is-selected").map(b=>b.dataset.value);
    state.notes.contactNote=$("#obContact").value.trim();
    state.tasks=[
      {id:id("t"),title:"Review your care instructions",date:todayISO(),time:"",repeat:"none",note:"Keep trusted instructions easy to find.",doneDates:[]},
      {id:id("t"),title:"Add your next visit",date:todayISO(),time:"",repeat:"none",note:"Only if you already have one scheduled.",doneDates:[]}
    ];
    storage.save(state); ob.classList.add("is-hidden"); render();
  };
}

function globalEvents(){
  $$("[data-route]").forEach(btn=>btn.onclick=()=>routeTo(btn.dataset.route));
  $$("[data-route-jump]").forEach(btn=>btn.onclick=()=>routeTo(btn.dataset.routeJump));
  $$("[data-plan-tab]").forEach(btn=>btn.onclick=()=>{state.ui.planTab=btn.dataset.planTab;storage.save(state);routeTo("plan");setPlanTab(state.ui.planTab);});

  $("#planTabs").onclick=e=>{
    const b=e.target.closest("[data-tab]"); if(!b)return;
    state.ui.planTab=b.dataset.tab; storage.save(state); setPlanTab(state.ui.planTab);
  };
  $("#checkPeriodTabs").onclick=e=>{
    const b=e.target.closest("[data-period]");if(!b)return;
    state.ui.checkPeriod=b.dataset.period;storage.save(state);renderCheckin();
  };

  $("#quickAddBtn").onclick=quickAddSheet; $("#settingsBtn").onclick=settingsSheet;
  $("#addTaskInline").onclick=addTaskSheet; $("#addTaskBtn").onclick=addTaskSheet; $("#addMedBtn").onclick=addMedSheet; $("#addVisitBtn").onclick=addVisitSheet; $("#addQuestionBtn").onclick=addQuestionSheet;
  $("#morningRoutine").onclick=()=>startRoutine("morning"); $("#eveningRoutine").onclick=()=>startRoutine("evening");
  $("#nextActionBtn").onclick=executeNextStep;
  $("#guidedViewBtn").onclick=()=>{ const n=nextStep(state); openSheet("Guided next step", `<div class="card" style="text-align:center"><div class="next-step__icon" style="margin:0 auto">${esc(n.icon||"→")}</div><span class="eyebrow">Next useful step</span><h3>${esc(n.title)}</h3><p class="fine">${esc(n.text)}</p><button class="btn btn--primary btn--full" id="guideDo">Do this now</button></div>`); $("#guideDo").onclick=()=>{closeSheet();executeNextStep();}; };
  $("#painRange").oninput=e=>$("#painOutput").textContent=`${e.target.value}/10`;
  $("#saveCheckinBtn").onclick=()=>{
    state.checkins.unshift({id:id("c"),timestamp:new Date().toISOString(),date:todayISO(),period:state.ui.checkPeriod,pain:Number($("#painRange").value),energy:$("#energySelect").value,function:$("#functionSelect").value,notes:$("#checkNotes").value.trim()});
    $("#checkNotes").value=""; save(); showToast("Check-in saved."); routeTo("home");
  };

  $$(".unlock-complete").forEach(b=>b.onclick=unlockComplete);
  $("#openCareNotes").onclick=careNotesSheet; $("#openContactNote").onclick=contactSheet; $("#openCaregiver").onclick=caregiverSheet; $("#openJourney").onclick=journeySheet; $("#openReport").onclick=printReport; $("#exportDataBtn").onclick=exportData;

  document.addEventListener("keydown",e=>{ if(e.key==="Escape") closeSheet(); });
}

onboarding();
globalEvents();
render();

if("serviceWorker" in navigator){ window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{})); }
