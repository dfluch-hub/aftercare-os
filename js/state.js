import { CONFIG } from "./config.js";

export const makeDefaultState = () => ({
  schemaVersion: CONFIG.schemaVersion,
  profile: null,
  entitlement: { tier:"preview", source:"none", licenseKey:"", instanceId:"", customerEmail:"", lastValidatedAt:"" },
  modules: ["meds","tasks","checkins","visits"],
  tasks: [],
  meds: [],
  visits: [],
  questions: [],
  checkins: [],
  notes: {
    careInstructions:"",
    contactNote:"",
    helpers:"",
    handoff:""
  },
  routines: {},
  ui: {
    planTab:"tasks",
    checkPeriod:"morning"
  }
});

const normalizeDoneDates = item => Array.isArray(item.doneDates) ? item.doneDates : [];
const normalizeTakenDates = item => Array.isArray(item.takenDates) ? item.takenDates : [];

export function migrate(raw){
  const next = makeDefaultState();
  if(!raw) return next;

  next.profile = raw.profile || null;
  next.modules = raw.modules || next.modules;
  next.entitlement = {
    tier: raw.entitlement?.tier || (raw.complete ? "complete" : "preview"),
    source: raw.entitlement?.source || (raw.complete ? "legacy" : "none"),
    licenseKey: raw.entitlement?.licenseKey || "",
    instanceId: raw.entitlement?.instanceId || "",
    customerEmail: raw.entitlement?.customerEmail || "",
    lastValidatedAt: raw.entitlement?.lastValidatedAt || ""
  };

  next.tasks = (raw.tasks || []).map(t => ({
    id: t.id || `t-${crypto.randomUUID?.() || Date.now()}`,
    title: t.title || "Task",
    date: t.date || new Date().toISOString().slice(0,10),
    time: t.time || "",
    repeat: t.repeat || "none",
    note: t.note || t.meta || "",
    doneDates: normalizeDoneDates(t)
  }));

  next.meds = (raw.meds || []).map(m => ({
    id: m.id || `m-${crypto.randomUUID?.() || Date.now()}`,
    name: m.name || "Medication",
    time: m.time || "",
    repeat: m.repeat || "daily",
    note: m.note || m.info || "",
    startDate: m.startDate || m.date || new Date().toISOString().slice(0,10),
    takenDates: normalizeTakenDates(m)
  }));

  next.visits = raw.visits || raw.appointments || [];
  next.questions = raw.questions || [];
  next.checkins = (raw.checkins || []).map(c => ({
    id: c.id || `c-${crypto.randomUUID?.() || Date.now()}`,
    timestamp: c.timestamp || c.ts || new Date().toISOString(),
    date: c.date || (c.ts ? String(c.ts).slice(0,10) : new Date().toISOString().slice(0,10)),
    period: c.period || "morning",
    pain: Number(c.pain ?? 0),
    energy: c.energy || "Okay",
    function: c.function || c.func || c.mobility || "About the same",
    notes: c.notes || ""
  }));

  next.notes = {
    careInstructions: raw.notes?.careInstructions ?? raw.instructions ?? "",
    contactNote: raw.notes?.contactNote ?? raw.emergencyNote ?? "",
    helpers: raw.notes?.helpers ?? raw.helpers ?? "",
    handoff: raw.notes?.handoff ?? raw.handoffNote ?? ""
  };
  next.routines = raw.routines || raw.routineDone || {};
  next.ui = { ...next.ui, ...(raw.ui || {}) };
  next.schemaVersion = CONFIG.schemaVersion;
  return next;
}

export function isComplete(state){ return state.entitlement?.tier === "complete"; }

export function todayISO(){ return new Date().toISOString().slice(0,10); }

export function recoveryDay(state){
  if(!state.profile?.date) return 1;
  const start = new Date(`${state.profile.date}T00:00:00`);
  const now = new Date(); now.setHours(0,0,0,0);
  return Math.max(1, Math.floor((now-start)/86400000)+1);
}

export function taskDueToday(task){
  const today = todayISO();
  if(task.repeat === "daily") return (task.date || today) <= today;
  return (task.date || today) === today;
}

export function taskDoneToday(task){ return (task.doneDates || []).includes(todayISO()); }

export function medDueToday(med){
  const today = todayISO();
  if(med.repeat === "daily") return (med.startDate || today) <= today;
  return (med.startDate || today) === today;
}

export function medDoneToday(med){ return (med.takenDates || []).includes(todayISO()); }

export function nextVisit(state){
  return state.visits
    .filter(v => new Date(v.date) >= new Date())
    .sort((a,b) => new Date(a.date)-new Date(b.date))[0] || null;
}

export function dueItems(state){
  const meds = state.meds.filter(m => medDueToday(m) && !medDoneToday(m)).map(m => ({
    kind:"med", id:m.id, time:m.time || "99:59", title:`${m.time || "Any time"} · ${m.name}`, text:m.note || "Medication schedule entry", icon:"💊"
  }));
  const tasks = state.tasks.filter(t => taskDueToday(t) && !taskDoneToday(t)).map(t => ({
    kind:"task", id:t.id, time:t.time || "99:58", title:t.title, text:t.note || "Today’s task", icon:"✓"
  }));
  return [...meds,...tasks].sort((a,b)=>a.time.localeCompare(b.time));
}

export function nextStep(state){
  const due = dueItems(state);
  if(due.length) return due[0];

  const hour = new Date().getHours();
  const routine = state.routines[todayISO()] || {};
  if(hour < 14 && !routine.morning) return { kind:"routine", period:"morning", title:"Do your morning reset", text:"Review today’s plan and save a short check-in.", icon:"☀️" };
  if(hour >= 16 && !routine.evening) return { kind:"routine", period:"evening", title:"Wrap up the day", text:"Save a short evening check-in and close today’s loop.", icon:"🌙" };
  if(!state.checkins.some(c => c.date === todayISO())) return { kind:"checkin", period:hour < 16 ? "morning" : "evening", title:"Save a recovery check-in", text:"Record how today is going so you don’t have to remember later.", icon:"♡" };
  return { kind:"done", title:"You’re caught up for now", text:"Nothing else in your plan is waiting for you right now.", icon:"✓" };
}
