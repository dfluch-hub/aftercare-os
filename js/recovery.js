'use strict';

// A separate schema intentionally excludes legacy prototype/sample data.
const STORAGE_KEY = 'aftercare.recovery.v1';
const $ = id => document.getElementById(id);
const kinds = ['Medication', 'Follow-up', 'Care Task'];
const routes = ['today', 'care-team', 'profile'];
const emptyState = () => ({ onboarded: false, profile: { firstName: '', dischargeDate: '', reason: '', summary: '' }, items: [], care: { teamName: '', phone: '' } });
const localDate = (date = new Date()) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');

// Calendar-day arithmetic avoids DST and UTC/local-midnight offsets.
function calendarDay(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1900 || year > 9999) return NaN;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return NaN;
  return date.getTime() / 86400000;
}
function recoveryDay(dischargeDate, today = localDate()) {
  const elapsed = calendarDay(today) - calendarDay(dischargeDate);
  return Number.isFinite(elapsed) && elapsed >= 0 ? elapsed + 1 : null;
}
function validProfile(profile) {
  return profile && typeof profile.firstName === 'string' && profile.firstName.trim().length > 0 &&
    typeof profile.reason === 'string' && profile.reason.trim().length > 0 &&
    recoveryDay(profile.dischargeDate) !== null && typeof profile.summary === 'string';
}
function validItem(item) {
  return item && typeof item.id === 'string' && kinds.includes(item.kind) &&
    typeof item.title === 'string' && item.title.trim() && Number.isFinite(calendarDay(item.date)) &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(item.time) && typeof item.notes === 'string' && typeof item.done === 'boolean';
}
let storageProblem = false;
function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return emptyState();
    if (!validProfile(saved.profile) || !Array.isArray(saved.items) || !saved.items.every(validItem) ||
        !saved.care || typeof saved.care.teamName !== 'string' || typeof saved.care.phone !== 'string' ||
        typeof saved.onboarded !== 'boolean') throw new Error('Invalid saved data');
    return saved;
  } catch {
    storageProblem = true;
    return emptyState();
  }
}
let state = load();
let activeRoute = 'today';
let lastDay = localDate();
let statusTimer;
function notice(message, persistent = false) {
  clearTimeout(statusTimer);
  $('status').textContent = message;
  $('status').hidden = false;
  if (!persistent) statusTimer = setTimeout(() => { $('status').hidden = true; }, 4500);
}
function save(message) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (message) notice(message);
    return true;
  } catch {
    notice('This browser could not save your entries. They are available only until you close or reload this page.', true);
    return false;
  }
}
function showScreen(screen, focusId) {
  ['welcome', 'onboarding', 'setup', 'workspace'].forEach(id => { $(id).hidden = id !== screen; });
  window.scrollTo(0, 0);
  if (focusId) $(focusId).focus();
}
function populate(form, values) {
  Object.entries(values).forEach(([name, value]) => {
    if (form.elements.namedItem(name)) form.elements.namedItem(name).value = value;
  });
}
function updateDateLimits() {
  [ $('onboarding-form'), $('profile-form') ].forEach(form => {
    form.elements.dischargeDate.min = '1900-01-01';
    form.elements.dischargeDate.max = localDate();
  });
}
function readProfile(form) {
  const profile = { ...state.profile };
  ['firstName', 'dischargeDate', 'reason'].forEach(name => { profile[name] = form.elements[name].value.trim(); });
  if (form.elements.summary) profile.summary = form.elements.summary.value.trim();
  if (!validProfile(profile)) {
    notice('Enter your name, reason for stay, and a valid discharge date that is not in the future.');
    return null;
  }
  return profile;
}
function textNode(tag, text, className) {
  const node = document.createElement(tag);
  node.textContent = text;
  if (className) node.className = className;
  return node;
}
function renderToday() {
  const today = localDate();
  const day = recoveryDay(state.profile.dischargeDate, today);
  $('recovery-day').textContent = day === null ? 'Check your discharge date in Profile' : `Recovery day ${day}`;
  $('today-title').textContent = `Hello, ${state.profile.firstName}.`;
  $('today-date').textContent = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
  const items = state.items.filter(item => item.date === today).sort((a, b) => a.time.localeCompare(b.time) || a.id.localeCompare(b.id));
  $('completion').textContent = items.length ? `${items.filter(item => item.done).length} of ${items.length} completed` : 'Only the items you enter appear here.';
  const stream = $('today-stream');
  stream.replaceChildren();
  if (!items.length) {
    const empty = textNode('li', '', 'empty');
    empty.append(textNode('strong', 'Nothing scheduled for today.'), textNode('span', 'Add a medication, follow-up, or care task from your discharge instructions.'));
    stream.append(empty);
  }
  items.forEach(item => {
    const row = textNode('li', '', item.done ? 'done' : '');
    const time = textNode('time', item.time);
    time.dateTime = `${item.date}T${item.time}`;
    const body = document.createElement('div');
    body.append(textNode('small', item.kind, 'kind'), textNode('strong', item.title));
    if (item.notes) body.append(textNode('small', item.notes));
    const toggle = textNode('button', item.done ? '✓' : '○', 'check');
    toggle.type = 'button';
    toggle.setAttribute('aria-pressed', String(item.done));
    toggle.setAttribute('aria-label', `${item.done ? 'Mark not done' : 'Mark done'}: ${item.title} at ${item.time}`);
    toggle.addEventListener('click', () => {
      item.done = !item.done;
      save(item.done ? 'Marked as done' : 'Marked as not done');
      renderToday();
      // Keep keyboard focus on the same item after replacing the stream.
      $('today-stream').querySelectorAll('.check')[items.indexOf(item)].focus();
    });
    row.append(time, body, toggle);
    stream.append(row);
  });
}
function renderSetup() {
  $('setup-items').replaceChildren(...state.items.map(item => textNode('li', `${item.kind} · ${item.title} · ${item.date} ${item.time}`)));
}
function renderCare() {
  populate($('care-form'), state.care);
  const number = state.care.phone.replace(/[^+\d]/g, '');
  const link = $('call-team');
  link.hidden = !number;
  if (number) link.href = `tel:${number}`;
  else link.removeAttribute('href');
  link.textContent = state.care.teamName ? `Call ${state.care.teamName}` : 'Call care team';
}
function navigate(route, focus = true) {
  if (!routes.includes(route) || !state.onboarded) return;
  activeRoute = route;
  routes.forEach(id => { $(id).hidden = id !== route; });
  document.querySelectorAll('.bottom-nav button').forEach(button => {
    if (button.dataset.route === route) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  updateDateLimits();
  if (route === 'today') renderToday();
  if (route === 'profile') populate($('profile-form'), state.profile);
  if (route === 'care-team') renderCare();
  window.scrollTo(0, 0);
  if (focus) $(route).querySelector('h1').focus();
}
$('start').addEventListener('click', () => { updateDateLimits(); showScreen('onboarding', 'onboarding-title'); });
$('onboarding-form').addEventListener('submit', event => {
  event.preventDefault();
  const profile = readProfile(event.currentTarget);
  if (!profile) return;
  state.profile = profile;
  $('summary').value = state.profile.summary;
  renderSetup();
  showScreen('setup', 'setup-title');
});
$('setup-back').addEventListener('click', () => {
  state.profile.summary = $('summary').value;
  populate($('onboarding-form'), state.profile);
  showScreen('onboarding', 'onboarding-title');
});
$('finish').addEventListener('click', () => {
  state.profile.summary = $('summary').value.trim();
  state.onboarded = true;
  save();
  showScreen('workspace');
  navigate('today');
});
function openItem(kind = 'Medication') {
  const form = $('item-form');
  form.reset();
  form.elements.kind.value = kind;
  $('item-dialog').showModal();
  form.elements.title.focus();
}
$('add-item').addEventListener('click', () => openItem());
for (const button of document.querySelectorAll('[data-add]')) button.addEventListener('click', () => openItem(button.dataset.add));
$('item-form').addEventListener('submit', event => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.currentTarget));
  const item = { ...values, title: values.title.trim(), notes: values.notes.trim(), id: crypto.randomUUID(), done: false };
  if (!validItem(item)) { notice('Enter a name, valid date, and time for this item.'); return; }
  state.items.push(item);
  if (state.onboarded) save('Item saved');
  $('item-dialog').close();
  renderSetup();
  if (state.onboarded) renderToday();
});
for (const button of document.querySelectorAll('[data-route]')) button.addEventListener('click', () => navigate(button.dataset.route));
$('profile-form').addEventListener('submit', event => {
  event.preventDefault();
  const profile = readProfile(event.currentTarget);
  if (!profile) return;
  state.profile = profile;
  save('Recovery details saved');
});
$('care-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  const teamName = form.elements.teamName.value.trim();
  const phone = form.elements.phone.value.trim();
  if (!teamName || !/^\+?[0-9() .-]{3,30}$/.test(phone) || phone.replace(/\D/g, '').length < 3) {
    notice('Enter a care team name and a valid phone number.'); return;
  }
  state.care = { teamName, phone };
  save('Care team contact saved');
  renderCare();
});
$('critical').addEventListener('click', () => $('critical-dialog').showModal());
$('critical-care').addEventListener('click', () => { $('critical-dialog').close(); navigate('care-team'); });
for (const button of document.querySelectorAll('[data-close]')) button.addEventListener('click', () => $(button.dataset.close).close());
function refreshDay() {
  updateDateLimits();
  const today = localDate();
  if (today !== lastDay && state.onboarded && activeRoute === 'today') renderToday();
  lastDay = today;
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshDay(); });
setInterval(refreshDay, 60000);
updateDateLimits();
if (state.onboarded) { showScreen('workspace'); navigate('today', false); }
if (storageProblem) notice('Saved data could not be read. Your previous storage has not been changed. Set up your recovery to continue.', true);
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      notice('Offline access is unavailable. Keep an internet connection to reopen Aftercare.');
    });
  });
}
