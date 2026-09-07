'use strict';
(() => {
  const sheet = document.getElementById('item-sheet');
  const form = document.getElementById('item-form');
  if (!sheet || !form || sheet.dataset.nativeEnhanced === '1') return;
  sheet.dataset.nativeEnhanced = '1';

  const style = document.createElement('style');
  style.textContent = `
    html:has(dialog[open]){overflow:hidden}
    dialog.sheet#item-sheet{overflow:hidden!important;max-height:85svh!important;border-radius:28px 28px 0 0!important;box-shadow:0 -18px 50px rgba(15,41,66,.18)!important;overscroll-behavior:contain;transform:translateY(0);animation:aftercareSheetIn .28s cubic-bezier(.2,.8,.2,1)}
    dialog.sheet#item-sheet::backdrop{background:rgba(15,23,42,.34);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);animation:aftercareFadeIn .2s ease-out}
    @keyframes aftercareSheetIn{from{transform:translateY(100%);opacity:.65}to{transform:translateY(0);opacity:1}}
    @keyframes aftercareFadeIn{from{background:rgba(15,23,42,0);backdrop-filter:blur(0)}to{background:rgba(15,23,42,.34);backdrop-filter:blur(5px)}}
    #item-sheet .sheet-handle{width:36px;height:4px;margin:9px auto 7px;background:#CBD5E1}
    #item-sheet .sheet-inner{display:flex;flex-direction:column;max-height:calc(85svh - 20px);padding:4px 16px 0!important;overflow:hidden}
    #item-sheet .sheet-head{flex:0 0 auto;margin:0 0 10px;align-items:center}
    #item-sheet .sheet-head .eyebrow{display:none}
    #item-sheet .sheet-head h2{font-size:20px;letter-spacing:-.35px}
    #item-sheet .sheet-close{width:38px;height:38px;min-height:38px;font-size:19px;background:#F1F5F9}
    #item-sheet .type-chips{flex:0 0 auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:3px;margin:0 0 12px;padding:3px;border-radius:12px;background:#EEF2F6}
    #item-sheet .type-chip{min-height:42px;border:0;border-radius:10px;background:transparent;color:#475569;font-size:11px;font-weight:750;padding:0 6px;box-shadow:none;white-space:nowrap}
    #item-sheet .type-chip[aria-pressed=true]{background:#fff;color:#0F2942;box-shadow:0 1px 5px rgba(15,41,66,.11)}
    #item-sheet .sheet-scroll{min-height:0;overflow-y:auto;overflow-x:hidden;padding:0 1px 18px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
    #item-sheet .sheet-scroll::-webkit-scrollbar{display:none}
    #item-sheet .quick-entry{margin:0 0 14px}
    #item-sheet .mini-label{display:block;margin:0 0 7px;font-size:10px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:#64748B}
    #item-sheet .quick-entry-chips{display:flex;gap:7px;overflow-x:auto;overflow-y:hidden;padding:1px 1px 3px;scrollbar-width:none;overscroll-behavior-inline:contain}
    #item-sheet .quick-entry-chips::-webkit-scrollbar{display:none}
    #item-sheet .quick-entry-chip{flex:0 0 auto;min-height:40px;max-width:180px;border:1px solid #E2E8F0;border-radius:999px;background:#fff;color:#0F2942;padding:0 12px;font-size:11px;font-weight:750;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #item-sheet .quick-entry-chip:active{background:#F1F5F9}
    #item-sheet .legacy-start-date,#item-sheet .legacy-repeat,#item-sheet #dose-label{display:none!important}
    #item-sheet .native-field{display:block;margin:0 0 11px}
    #item-sheet .native-field>span{display:block;margin:0 0 6px;font-size:10px;font-weight:800;color:#64748B}
    #item-sheet .native-input{width:100%;height:46px;border:1px solid #E2E8F0;border-radius:13px;background:#F8FAFC;color:#0F172A;padding:0 12px;font-size:15px;outline:0}
    #item-sheet .native-input:focus{border-color:#94A3B8;background:#fff;box-shadow:0 0 0 3px rgba(15,41,66,.06)}
    #item-sheet .when-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin-bottom:8px}
    #item-sheet .when-chip{min-width:0;min-height:42px;border:1px solid #E2E8F0;border-radius:11px;background:#fff;color:#475569;padding:0 4px;font-size:10px;font-weight:800}
    #item-sheet .when-chip[aria-pressed=true]{background:#0F2942;border-color:#0F2942;color:#fff}
    #item-sheet .time-row{display:grid;grid-template-columns:auto minmax(0,1fr);gap:10px;align-items:center;margin-bottom:13px}
    #item-sheet .time-row span{font-size:11px;font-weight:750;color:#64748B}
    #item-sheet .time-row input{height:42px;border:1px solid #E2E8F0;border-radius:12px;background:#F8FAFC;padding:0 10px;font-size:14px;color:#0F172A;min-width:0}
    #item-sheet .dose-builder{margin:0 0 12px}
    #item-sheet .dose-row{display:grid;grid-template-columns:44px minmax(0,1fr) 44px;gap:7px;align-items:center}
    #item-sheet .step-button{width:44px;height:44px;min-height:44px;border:1px solid #D8E0E8;border-radius:12px;background:#fff;color:#0F2942;font-size:22px;font-weight:500}
    #item-sheet .dose-value{height:44px;border:1px solid #E2E8F0;border-radius:12px;background:#F8FAFC;display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;justify-content:center;gap:6px;padding:0 8px;text-align:center}
    #item-sheet .dose-value strong{font-size:15px;color:#0F172A}
    #item-sheet .dose-value select{min-width:0;border:0;background:transparent;color:#475569;font-size:12px;font-weight:750;outline:0;text-align:center}
    #item-sheet .note-line{margin:0 0 4px}
    #item-sheet .native-note{width:100%;height:44px;border:0;border-bottom:1px solid #D8E0E8;border-radius:0;background:transparent;padding:0 2px;font-size:14px;color:#0F172A;outline:0}
    #item-sheet .native-note:focus{border-bottom-color:#0F2942}
    #item-sheet .native-note::placeholder{color:#94A3B8}
    #item-sheet .hint{margin:7px 0 0;font-size:9px;line-height:1.45;color:#64748B}
    #item-sheet .sheet-action{position:sticky;bottom:0;z-index:2;flex:0 0 auto;margin:0 -16px;padding:10px 16px calc(10px + env(safe-area-inset-bottom));background:linear-gradient(to top,#fff 80%,rgba(255,255,255,.94));border-top:1px solid rgba(226,232,240,.8)}
    #item-sheet .sheet-save{margin:0;min-height:54px;border-radius:15px;background:#0F2942;font-size:14px;box-shadow:0 7px 18px rgba(15,41,66,.18)}
    #item-sheet button,#item-sheet input,#item-sheet select{touch-action:manipulation}
    @media(max-width:370px){#item-sheet .type-chip{font-size:10px}.when-grid{gap:4px!important}#item-sheet .when-chip{font-size:9px}}
  `;
  document.head.append(style);

  const titleField = form.querySelector('input[name="title"]');
  const timeField = form.querySelector('input[name="time"]');
  const dateField = form.querySelector('input[name="startDate"]');
  const doseField = form.querySelector('input[name="dose"]');
  const repeatField = form.querySelector('select[name="frequency"]');
  const safetyHint = document.getElementById('med-safety-hint');
  const saveButton = document.getElementById('item-submit');
  const titleLabel = titleField?.closest('.sheet-field');
  const timeLabel = timeField?.closest('.sheet-field');
  const dateLabel = dateField?.closest('.sheet-field');
  const repeatLabel = repeatField?.closest('.sheet-field');

  if (!titleField || !timeField || !dateField || !doseField || !repeatField || !saveButton) return;

  if (titleLabel) {
    titleLabel.className = 'native-field';
    titleLabel.firstChild.textContent = '';
    const cap = document.createElement('span'); cap.textContent = 'Name / description';
    titleLabel.prepend(cap); titleField.className = 'native-input'; titleField.placeholder = 'e.g. medication or care task';
  }
  if (timeLabel) timeLabel.style.display = 'none';
  if (dateLabel) dateLabel.classList.add('legacy-start-date');
  if (repeatLabel) repeatLabel.classList.add('legacy-repeat');

  const scroll = document.createElement('div');
  scroll.className = 'sheet-scroll';
  const controls = [...form.children].filter(el => el !== saveButton);
  controls.forEach(el => scroll.append(el));
  form.prepend(scroll);

  const quick = document.createElement('section');
  quick.className = 'quick-entry';
  quick.innerHTML = '<span class="mini-label">Quick select</span><div class="quick-entry-chips" id="entry-quick-chips"></div>';
  scroll.insertBefore(quick, titleLabel || scroll.firstChild);

  const when = document.createElement('section');
  when.className = 'native-field';
  when.innerHTML = '<span>When</span><div class="when-grid"><button type="button" class="when-chip" data-time="08:00">Morning</button><button type="button" class="when-chip" data-time="12:30">Midday</button><button type="button" class="when-chip" data-time="18:00">Evening</button><button type="button" class="when-chip" data-time="22:00">Night</button></div><div class="time-row"><span>Exact time</span></div>';
  const timeRow = when.querySelector('.time-row');
  timeField.className = '';
  timeRow.append(timeField);
  titleLabel?.after(when);

  const doseBuilder = document.createElement('section');
  doseBuilder.className = 'dose-builder';
  doseBuilder.innerHTML = '<span class="mini-label">Amount / dose</span><div class="dose-row"><button class="step-button" id="dose-minus" type="button" aria-label="Decrease amount">−</button><div class="dose-value"><strong id="dose-count">1</strong><select id="dose-unit" aria-label="Dose unit"><option value="tablet">tablet</option><option value="capsule">capsule</option><option value="dose">dose</option><option value="drop">drop</option></select></div><button class="step-button" id="dose-plus" type="button" aria-label="Increase amount">+</button></div>';
  when.after(doseBuilder);

  const note = document.createElement('label');
  note.className = 'native-field note-line';
  note.innerHTML = '<span>Note <small style="font-weight:650;text-transform:none;letter-spacing:0">optional</small></span><input id="entry-note" class="native-note" type="text" maxlength="90" placeholder="e.g. Before meals">';
  doseBuilder.after(note);

  if (safetyHint) note.after(safetyHint);
  const action = document.createElement('div');
  action.className = 'sheet-action';
  saveButton.textContent = 'Save entry';
  action.append(saveButton);
  form.append(action);

  let amount = 1;
  const count = document.getElementById('dose-count');
  const unit = document.getElementById('dose-unit');
  const noteInput = document.getElementById('entry-note');

  function updateDoseHidden() {
    const type = form.elements.type.value;
    if (type !== 'medication') { doseField.value = noteInput.value.trim(); return; }
    const unitText = amount === 1 ? unit.value : `${unit.value}s`;
    const base = `${amount} ${unitText}`;
    doseField.value = noteInput.value.trim() ? `${base} · ${noteInput.value.trim()}` : base;
  }

  function selectTime(value) {
    timeField.value = value;
    document.querySelectorAll('#item-sheet .when-chip').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.time === value)));
  }

  document.getElementById('dose-minus').addEventListener('click', () => { amount = Math.max(1, amount - 1); count.textContent = amount; updateDoseHidden(); });
  document.getElementById('dose-plus').addEventListener('click', () => { amount = Math.min(12, amount + 1); count.textContent = amount; updateDoseHidden(); });
  unit.addEventListener('change', updateDoseHidden);
  noteInput.addEventListener('input', updateDoseHidden);
  timeField.addEventListener('change', () => selectTime(timeField.value));
  document.querySelectorAll('#item-sheet .when-chip').forEach(b => b.addEventListener('click', () => selectTime(b.dataset.time)));
  form.addEventListener('submit', updateDoseHidden, true);

  function medicationNamesFromUI() {
    return [...document.querySelectorAll('#med-list .med-card h3')].map(el => el.textContent.trim()).filter(Boolean).slice(0, 3);
  }

  function refreshQuickChips() {
    const wrap = document.getElementById('entry-quick-chips');
    if (!wrap) return;
    wrap.replaceChildren();
    const type = form.elements.type.value;
    let labels = [];
    if (type === 'medication') labels = medicationNamesFromUI();
    if (type === 'care') labels = ['Wound care', 'Mobility', 'Other care task'];
    if (type === 'appointment') labels = ['Follow-up visit', 'Therapy visit', 'Other appointment'];
    if (!labels.length && type === 'medication') labels = ['From discharge medication list'];
    labels.forEach(label => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'quick-entry-chip'; b.textContent = label;
      b.addEventListener('click', () => { if (label !== 'From discharge medication list') titleField.value = label; titleField.focus(); });
      wrap.append(b);
    });
    const other = document.createElement('button'); other.type = 'button'; other.className = 'quick-entry-chip'; other.textContent = '+ Other';
    other.addEventListener('click', () => { titleField.value = ''; titleField.focus(); });
    wrap.append(other);
    doseBuilder.hidden = type !== 'medication';
    if (type !== 'medication') amount = 1;
  }

  function syncFromLegacyOpen() {
    const type = form.elements.type.value || 'medication';
    refreshQuickChips();
    amount = Math.max(1, parseInt((doseField.value || '').match(/^\d+/)?.[0] || '1', 10));
    count.textContent = amount;
    noteInput.value = doseField.value && /^\d+\s/.test(doseField.value) ? (doseField.value.split(' · ')[1] || '') : (type === 'medication' ? '' : doseField.value || '');
    selectTime(timeField.value || new Date().toTimeString().slice(0,5));
    if (sheet.open) sheet.scrollTop = 0;
  }

  document.querySelectorAll('[data-entry-type]').forEach(b => b.addEventListener('click', () => setTimeout(() => { refreshQuickChips(); updateDoseHidden(); }, 0)));

  document.addEventListener('click', event => {
    const trigger = event.target.closest('#header-add,#fab,#med-add,.placeholder-card button,#wizard-add-med,#wizard-add-care,.setup-actions button,.med-card button');
    if (trigger) setTimeout(syncFromLegacyOpen, 40);
  }, true);

  sheet.addEventListener('click', event => {
    if (event.target !== sheet) return;
    const rect = sheet.getBoundingClientRect();
    const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
    if (!inside) sheet.close();
  });

  sheet.addEventListener('cancel', () => { document.activeElement?.blur(); });
})();