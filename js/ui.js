export const $ = (s, root=document) => root.querySelector(s);
export const $$ = (s, root=document) => [...root.querySelectorAll(s)];

export function esc(value=""){
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

export function formatDate(value){
  try { return new Intl.DateTimeFormat(undefined,{month:"short",day:"numeric"}).format(new Date(value)); }
  catch { return value || "—"; }
}

export function formatDateTime(value){
  try { return new Date(value).toLocaleString([], {dateStyle:"medium",timeStyle:"short"}); }
  catch { return value || "—"; }
}

export function showToast(message){
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("is-showing");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(()=>el.classList.remove("is-showing"),1800);
}

export function openSheet(title, body, {wide=false}={}){
  const root = $("#modalRoot");
  root.innerHTML = `
    <div class="modal-backdrop" data-close-sheet></div>
    <section class="sheet ${wide ? "sheet--wide" : ""}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="sheet__head"><h3>${esc(title)}</h3><button class="sheet-close" data-close-sheet aria-label="Close">✕</button></div>
      ${body}
    </section>`;
  root.classList.add("is-open");
  root.querySelectorAll("[data-close-sheet]").forEach(b=>b.addEventListener("click", closeSheet));
}

export function closeSheet(){
  const root = $("#modalRoot");
  root.classList.remove("is-open");
  root.innerHTML = "";
}

export function routeTo(route){
  $$(".route").forEach(r=>r.classList.toggle("is-active", r.id === `route-${route}`));
  $$("[data-route]").forEach(b=>b.classList.toggle("is-active", b.dataset.route === route));
  window.scrollTo({top:0,behavior:"smooth"});
}

export function setPlanTab(tab){
  $$("#planTabs button").forEach(b=>b.classList.toggle("is-active", b.dataset.tab === tab));
  $$(".plan-panel").forEach(p=>p.classList.toggle("is-active", p.id === `panel-${tab}`));
}
