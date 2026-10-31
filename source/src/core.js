/* Vidora prototype engine — shared behaviours, driven by data-attributes.
   Each design supplies its own markup + CSS; this file makes it feel real. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const IMG = window.IMG || {};
  const store = {
    get(k, d) { try { const v = localStorage.getItem('vidora:' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('vidora:' + k, JSON.stringify(v)); } catch (e) {} }
  };
  const ic = (name) => `<svg class="ic" aria-hidden="true"><use href="#i-${name}"></use></svg>`;

  const TOOLS = [
    { id: 'home', label: 'Home', full: 'Home', icon: 'house', hint: 'Your projects and quick start' },
    { id: 'identity', label: 'Identity', full: 'Create Your Identity', icon: 'scan-face', hint: 'Teach Vidora your face' },
    { id: 'image', label: 'Image', full: 'Bring To Life · Image', icon: 'image', hint: 'Describe it. See it.' },
    { id: 'video', label: 'Video', full: 'Bring To Life · Video', icon: 'clapperboard', hint: 'Turn any image into motion' },
    { id: 'studio', label: 'Studio', full: 'Editing Studio', icon: 'scissors', hint: 'Cut, caption and polish' },
    { id: 'voice', label: 'Voice', full: 'Give It A Voice', icon: 'audio-lines', hint: 'Type it. Hear it.' },
    { id: 'library', label: 'Library', full: 'Library', icon: 'folder-open', hint: 'Everything you have made' }
  ];
  // a design can rename tools: window.VIDORA_NAMES = { image: { label, full, hint } }
  TOOLS.forEach(t => Object.assign(t, (window.VIDORA_NAMES || {})[t.id] || {}));
  const T = Object.fromEntries(TOOLS.map(t => [t.id, t]));

  /* ---------- icons + images ---------- */
  function hydrate(root = document) {
    $$('[data-i]', root).forEach(el => { if (!el.firstElementChild) el.innerHTML = ic(el.dataset.i); });
    $$('img[data-img]', root).forEach(el => { if (IMG[el.dataset.img] && el.src !== IMG[el.dataset.img]) el.src = IMG[el.dataset.img]; if (!el.alt) el.alt = ''; });
    $$('[data-bg]', root).forEach(el => { if (IMG[el.dataset.bg]) el.style.backgroundImage = `url(${IMG[el.dataset.bg]})`; });
    $$('[data-wave]', root).forEach(buildWave);
  }

  /* ---------- toast ---------- */
  const toasts = document.createElement('div');
  toasts.className = 'v-toasts';
  toasts.setAttribute('role', 'status');
  document.body.appendChild(toasts);
  function toast(msg, icon = 'check') {
    const t = document.createElement('div');
    t.className = 'v-toast';
    t.innerHTML = `<span class="v-toast-ic">${ic(icon)}</span><span>${msg}</span>`;
    toasts.appendChild(t);
    requestAnimationFrame(() => t.classList.add('in'));
    setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 400); }, 2600);
  }

  /* ---------- router ---------- */
  const views = () => $$('[data-view]');
  const startView = document.body.dataset.start || 'home';
  let current = null;
  function go(v, push = true) {
    if (!$(`[data-view="${v}"]`)) v = startView;
    if (v === current) return;
    const prev = current;
    current = v;
    views().forEach(el => {
      const on = el.dataset.view === v;
      el.classList.toggle('is-active', on);
      el.toggleAttribute('hidden', !on);
      if (on) { el.classList.remove('view-in'); void el.offsetWidth; el.classList.add('view-in'); }
    });
    document.body.dataset.current = v;
    $$('[data-go]').forEach(b => { if (b.dataset.go === v) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    $$('[data-scroll]').forEach(s => (s.scrollTop = 0));
    window.scrollTo(0, 0);
    if (push && location.hash.slice(1) !== v) { try { history.pushState(null, '', '#' + v); } catch (e) { location.hash = v; } }
    $$(`[data-view="${v}"] [data-countup]`).forEach(countUp);
    if (v !== 'studio') stopStudio();
    document.dispatchEvent(new CustomEvent('vidora:view', { detail: { view: v, prev } }));
  }
  window.addEventListener('hashchange', () => go(location.hash.slice(1) || startView, false));
  window.addEventListener('popstate', () => go(location.hash.slice(1) || startView, false));

  /* ---------- credits ---------- */
  let credits = 1240;
  const renderCredits = () => $$('[data-credits]').forEach(el => (el.textContent = credits.toLocaleString()));

  /* ---------- generation ---------- */
  const ease = p => 1 - Math.pow(1 - p, 2.2);
  function generate(btn) {
    const key = btn.dataset.generate;
    const tgt = $(`[data-gen="${key}"]`);
    if (!tgt || tgt.dataset.state === 'loading') return;
    if (btn.hasAttribute('disabled')) return;
    const ms = +(btn.dataset.ms || tgt.dataset.ms || 3400);
    const steps = (tgt.dataset.steps || 'Getting ready|Creating|Adding detail|Final touches').split('|');
    const cost = +(btn.dataset.cost || 0);
    credits = Math.max(0, credits - cost); renderCredits();
    tgt.dataset.state = 'loading';
    $$(`[data-generate="${key}"]`).forEach(b => b.classList.add('busy'));
    document.body.classList.add('gen-' + key);
    const t0 = performance.now();
    const tick = now => {
      const raw = Math.min(1, (now - t0) / ms), p = ease(raw);
      tgt.style.setProperty('--prog', p.toFixed(3));
      $$('[data-progress]', tgt).forEach(el => (el.textContent = Math.round(p * 100) + '%'));
      const si = Math.min(steps.length - 1, Math.floor(raw * steps.length));
      $$('[data-step]', tgt).forEach(el => { if (el.textContent !== steps[si]) el.textContent = steps[si]; });
      $$('[data-eta]', tgt).forEach(el => (el.textContent = Math.max(0, Math.ceil((ms - (now - t0)) / 1000)) + 's left'));
      if (raw < 1) return requestAnimationFrame(tick);
      tgt.dataset.state = 'done';
      $$(`[data-generate="${key}"]`).forEach(b => b.classList.remove('busy'));
      document.body.classList.remove('gen-' + key);
      $$('[data-reveal]', tgt).forEach((el, i) => { el.style.animationDelay = i * 110 + 'ms'; el.classList.remove('revealed'); void el.offsetWidth; el.classList.add('revealed'); });
      if (btn.dataset.done) toast(btn.dataset.done, btn.dataset.doneIcon || 'sparkles');
      document.dispatchEvent(new CustomEvent('vidora:done', { detail: { key } }));
    };
    requestAnimationFrame(tick);
  }

  /* ---------- uploads ---------- */
  const uploads = {};
  const DEMO = ['s1', 's4', 's2', 's5', 's3', 's6', 'nova', 'hero2'];
  function addUpload(key, src, delay = 0) {
    const list = $(`[data-upload-list="${key}"]`);
    uploads[key] = uploads[key] || [];
    const zone = $(`[data-upload="${key}"]`);
    if (zone && zone.hasAttribute('data-single')) {
      uploads[key] = [src];
      $$(`[data-slot="${key}"]`).forEach(im => { im.src = src; im.closest('[data-slot-host]')?.classList.add('has-media'); });
      updateUploads(key); return;
    }
    const max = +(zone?.dataset.max || 12);
    if (uploads[key].length >= max) { toast(`You can add up to ${max} photos`, 'info'); return; }
    uploads[key].push(src);
    if (list) {
      const d = document.createElement('div');
      d.className = 'up-thumb';
      d.style.animationDelay = delay + 'ms';
      d.innerHTML = `<img alt="" src="${src}"><button class="up-x" aria-label="Remove photo">${ic('x')}</button><span class="up-ok">${ic('check')}</span>`;
      d.querySelector('.up-x').onclick = e => { e.stopPropagation(); const i = [...list.children].indexOf(d); uploads[key].splice(i, 1); d.classList.add('out'); setTimeout(() => { d.remove(); updateUploads(key); }, 220); };
      list.appendChild(d);
    }
    updateUploads(key);
  }
  function updateUploads(key) {
    const n = (uploads[key] || []).length;
    const zone = $(`[data-upload="${key}"]`);
    const goal = +(zone?.dataset.goal || 8), min = +(zone?.dataset.min || 4);
    $$(`[data-upload-count="${key}"]`).forEach(el => (el.textContent = n));
    $$(`[data-upload-meter="${key}"]`).forEach(el => el.style.setProperty('--fill', Math.min(1, n / goal)));
    const q = n === 0 ? 'Add photos to start' : n < min ? `Add ${min - n} more` : n < goal ? 'Good — a few more helps' : 'Great set of photos';
    $$(`[data-upload-quality="${key}"]`).forEach(el => (el.textContent = q));
    $$(`[data-requires="${key}"]`).forEach(b => { const ok = n >= min; b.toggleAttribute('disabled', !ok); b.classList.toggle('ready', ok); });
    $$(`[data-upload-host="${key}"]`).forEach(h => { h.classList.toggle('has-files', n > 0); h.classList.toggle('enough', n >= min); });
  }
  function readFiles(key, files) {
    [...files].filter(f => f.type.startsWith('image/')).forEach((f, i) => {
      const r = new FileReader();
      r.onload = () => addUpload(key, r.result, i * 80);
      r.readAsDataURL(f);
    });
  }
  function initUploads() {
    $$('[data-upload]').forEach(zone => {
      const key = zone.dataset.upload;
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'image/*'; inp.hidden = true;
      if (!zone.hasAttribute('data-single')) inp.multiple = true;
      zone.appendChild(inp);
      inp.onchange = () => { readFiles(key, inp.files); inp.value = ''; };
      zone.addEventListener('click', e => { if (e.target.closest('[data-demo-upload],.up-x,button:not([data-pick])')) return; inp.click(); });
      ['dragenter', 'dragover'].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.add('drag'); }));
      ['dragleave', 'drop'].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.remove('drag'); }));
      zone.addEventListener('drop', e => readFiles(key, e.dataTransfer.files));
      updateUploads(key);
    });
  }

  /* ---------- waveforms + players ---------- */
  function rnd(seed) { let s = seed || 7; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); }
  function buildWave(el) {
    if (el.dataset.built) return;
    el.dataset.built = 1;
    const n = +(el.dataset.bars || 56), r = rnd(+(el.dataset.seed || 3));
    let html = '';
    for (let i = 0; i < n; i++) {
      const env = Math.sin(Math.PI * (i + 1) / (n + 1)) * 0.65 + 0.35;
      const h = Math.max(0.12, Math.min(1, env * (0.35 + r() * 0.75)));
      html += `<i style="--h:${h.toFixed(2)};--d:${(r() * 0.8).toFixed(2)}s"></i>`;
    }
    el.innerHTML = html;
  }
  let activePlayer = null;
  function fmt(s) { s = Math.max(0, s); return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`; }
  function togglePlayer(p) {
    if (activePlayer && activePlayer !== p) stopPlayer(activePlayer);
    if (p._raf) return stopPlayer(p);
    const dur = +(p.dataset.dur || 8);
    let t = +(p._t || 0); if (t >= dur) t = 0;
    p.classList.add('playing'); activePlayer = p;
    $$('[data-play] use', p).forEach(u => u.setAttribute('href', '#i-pause'));
    let last = performance.now();
    const bars = $$('[data-wave] i', p);
    const step = now => {
      t += (now - last) / 1000; last = now; p._t = t;
      const k = Math.min(1, t / dur);
      p.style.setProperty('--t', k.toFixed(4));
      $$('[data-time]', p).forEach(el => (el.textContent = fmt(t)));
      const lit = Math.floor(k * bars.length);
      bars.forEach((b, i) => b.classList.toggle('lit', i < lit));
      if (k >= 1) { p._t = dur; stopPlayer(p); return; }
      p._raf = requestAnimationFrame(step);
    };
    p._raf = requestAnimationFrame(step);
  }
  function stopPlayer(p) {
    cancelAnimationFrame(p._raf); p._raf = null; p.classList.remove('playing');
    $$('[data-play] use', p).forEach(u => u.setAttribute('href', '#i-play'));
    if (activePlayer === p) activePlayer = null;
  }
  function seekPlayer(p, e) {
    const bar = e.target.closest('[data-seek]'); if (!bar) return;
    const r = bar.getBoundingClientRect(), k = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const dur = +(p.dataset.dur || 8); p._t = k * dur; p.style.setProperty('--t', k);
    $$('[data-time]', p).forEach(el => (el.textContent = fmt(p._t)));
    const bars = $$('[data-wave] i', p), lit = Math.floor(k * bars.length);
    bars.forEach((b, i) => b.classList.toggle('lit', i < lit));
  }

  /* ---------- recording (simulated: mic is not available in a prototype) ---------- */
  let recTimer = null;
  function toggleRecord(btn) {
    const host = btn.closest('[data-rec-host]') || document.body;
    if (host.classList.contains('rec')) {
      clearInterval(recTimer); host.classList.remove('rec'); host.classList.add('rec-done');
      toast('Voice sample saved — 12 seconds', 'mic'); return;
    }
    host.classList.add('rec'); host.classList.remove('rec-done');
    let s = 0; const live = $$('[data-live] i', host);
    recTimer = setInterval(() => {
      s += 0.1; $$('[data-rec-time]', host).forEach(el => (el.textContent = fmt(s)));
      live.forEach(b => b.style.setProperty('--h', (0.15 + Math.random() * 0.85).toFixed(2)));
      $$('[data-rec-fill]', host).forEach(el => el.style.setProperty('--fill', Math.min(1, s / 30)));
      if (s >= 30) toggleRecord(btn);
    }, 100);
  }

  /* ---------- prompt helpers ---------- */
  function typeInto(el, text, speed = 14) {
    if (!el) return;
    clearInterval(el._typing); el.value = ''; let i = 0;
    el.classList.add('typing');
    el._typing = setInterval(() => {
      el.value = text.slice(0, ++i); el.dispatchEvent(new Event('input', { bubbles: true }));
      if (i >= text.length) { clearInterval(el._typing); el.classList.remove('typing'); }
    }, speed);
  }
  function initTyping() {
    $$('[data-typing]').forEach(el => {
      const list = el.dataset.typing.split('|'); let li = 0, ci = 0, del = false;
      setInterval(() => {
        if (el.value) return;
        const w = list[li];
        ci += del ? -1 : 1;
        el.setAttribute('placeholder', w.slice(0, ci) + (ci < w.length || !del ? '' : ''));
        if (!del && ci >= w.length + 18) del = true;
        if (del && ci <= 0) { del = false; li = (li + 1) % list.length; }
      }, 55);
    });
  }

  /* ---------- count up ---------- */
  function countUp(el) {
    const to = +el.dataset.countup, dec = +(el.dataset.dec || 0), t0 = performance.now(), d = 1100;
    const f = now => { const p = ease(Math.min(1, (now - t0) / d)); el.textContent = (to * p).toFixed(dec).replace(/\B(?=(\d{3})+(?!\d))/g, ','); if (p < 1) requestAnimationFrame(f); };
    requestAnimationFrame(f);
  }

  /* ---------- dock (user-customisable bottom bar) ---------- */
  const DOCK_DEFAULT = ['home', 'image', 'video', 'studio', 'voice'];
  let dock = store.get('dock', DOCK_DEFAULT).filter(id => T[id]);
  if (dock.length < 2) dock = DOCK_DEFAULT.slice();
  const DOCK_MAX = 5;
  function dockItem(t, editable) {
    return `<button class="dock-item" data-go="${t.id}" data-dock-item="${t.id}" aria-label="${t.full}">
      <span class="dock-ic">${ic(t.icon)}</span><span class="dock-label">${t.label}</span>${editable ? `<span class="dock-x" data-dock-remove="${t.id}" aria-label="Remove ${t.label}">${ic('minus')}</span>` : ''}</button>`;
  }
  function renderDocks() {
    $$('[data-dock]').forEach(d => {
      const ids = d.dataset.dock === 'all' ? TOOLS.map(t => t.id) : dock;
      const items = ids.map(id => dockItem(T[id], d.dataset.dock !== 'all'));
      if (d.hasAttribute('data-dock-fab')) items.splice(Math.ceil(items.length / 2), 0, `<button class="dock-fab" data-open="v-create" aria-label="Create">${ic('plus')}</button>`);
      d.innerHTML = items.join('');
    });
    $$('[data-go]').forEach(b => { if (b.dataset.go === current) b.setAttribute('aria-current', 'page'); });
    renderDockSheet();
  }
  function saveDock() { store.set('dock', dock); renderDocks(); }
  function renderDockSheet() {
    const cur = $('#v-dock .v-dock-current'), av = $('#v-dock .v-dock-avail');
    if (!cur) return;
    cur.innerHTML = dock.map((id, i) => `<div class="v-dock-chip" data-idx="${i}" draggable="false">
      <span class="v-grip">${ic('grip-vertical')}</span><span class="v-dc-ic">${ic(T[id].icon)}</span><span>${T[id].label}</span>
      <button class="v-dc-x" data-dock-remove="${id}" aria-label="Remove ${T[id].label}">${ic('x')}</button></div>`).join('') +
      Array.from({ length: DOCK_MAX - dock.length }, () => `<div class="v-dock-chip empty"><span>Empty slot</span></div>`).join('');
    av.innerHTML = TOOLS.filter(t => !dock.includes(t.id)).map(t => `<button class="v-dock-add" data-dock-add="${t.id}">
      <span class="v-da-ic">${ic(t.icon)}</span><span class="v-da-txt"><b>${t.full}</b><small>${t.hint}</small></span><span class="v-da-plus">${ic('plus')}</span></button>`).join('') ||
      `<p class="v-dock-note">Every tool is in your dock.</p>`;
    $('#v-dock .v-dock-count').textContent = `${dock.length} of ${DOCK_MAX}`;
  }
  function initDockDrag() {
    const cur = $('#v-dock .v-dock-current'); if (!cur) return;
    let drag = null;
    cur.addEventListener('pointerdown', e => {
      const chip = e.target.closest('.v-dock-chip:not(.empty)'); if (!chip || e.target.closest('.v-dc-x')) return;
      drag = { idx: +chip.dataset.idx, el: chip, x: e.clientX, y: e.clientY }; chip.classList.add('dragging'); chip.setPointerCapture(e.pointerId);
    });
    cur.addEventListener('pointermove', e => {
      if (!drag) return;
      drag.el.style.transform = `translate(${e.clientX - drag.x}px, ${e.clientY - drag.y}px)`;
      const chips = $$('.v-dock-chip:not(.empty)', cur);
      for (const c of chips) {
        if (c === drag.el) continue;
        const r = c.getBoundingClientRect();
        if (e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom) {
          const to = +c.dataset.idx, id = dock.splice(drag.idx, 1)[0]; dock.splice(to, 0, id);
          saveDock();
          const nc = $(`.v-dock-chip[data-idx="${to}"]`, cur);
          const nr = nc.getBoundingClientRect();
          drag = { idx: to, el: nc, x: drag.x + (nr.left - r.left) + (r.left - nr.left), y: drag.y }; drag.x = e.clientX; drag.y = e.clientY;
          nc.classList.add('dragging');
          break;
        }
      }
    });
    const end = () => { if (!drag) return; drag.el.style.transform = ''; drag.el.classList.remove('dragging'); drag = null; renderDockSheet(); };
    cur.addEventListener('pointerup', end); cur.addEventListener('pointercancel', end);
  }

  /* ---------- injected UI: dock editor, quick create, command palette ---------- */
  function inject() {
    const wrap = document.createElement('div');
    wrap.innerHTML = `
    <div class="v-sheet" id="v-dock" data-modal aria-label="Customize your dock">
      <div class="v-sheet-panel">
        <div class="v-sheet-grab"></div>
        <div class="v-sheet-head"><div><h3>Customize your dock</h3><p>Pick up to 5 tools. Drag to reorder.</p></div><span class="v-dock-count"></span></div>
        <div class="v-dock-current"></div>
        <h4>Add a tool</h4>
        <div class="v-dock-avail"></div>
        <div class="v-sheet-foot"><button class="v-btn-ghost" data-dock-reset>Reset</button><button class="v-btn" data-close>Done</button></div>
      </div>
    </div>
    <div class="v-sheet" id="v-create" data-modal aria-label="Create something new">
      <div class="v-sheet-panel">
        <div class="v-sheet-grab"></div>
        <div class="v-sheet-head"><div><h3>What do you want to make?</h3><p>Choose a starting point.</p></div></div>
        <div class="v-create-grid">
          ${['identity', 'image', 'video', 'voice', 'studio'].map((id, i) => `<button class="v-create-item" data-go="${id}" data-close style="--i:${i}">
            <span class="v-ci-ic">${ic(T[id].icon)}</span><b>${T[id].full}</b><small>${T[id].hint}</small></button>`).join('')}
        </div>
      </div>
    </div>
    <div class="v-cmdk" id="v-cmdk" data-modal aria-label="Command menu">
      <div class="v-cmdk-box">
        <label class="v-cmdk-in">${ic('search')}<input placeholder="Search tools and actions…" aria-label="Search"><kbd>esc</kbd></label>
        <div class="v-cmdk-list" role="listbox"></div>
        <div class="v-cmdk-foot"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>↵</kbd> open</span><span><kbd>⌘</kbd><kbd>K</kbd> toggle</span></div>
      </div>
    </div>`;
    while (wrap.firstElementChild) document.body.appendChild(wrap.firstElementChild);
  }
  const CMDS = () => [
    ...TOOLS.map(t => ({ label: t.full, hint: t.hint, icon: t.icon, group: 'Go to', run: () => go(t.id) })),
    { label: 'New image from a prompt', icon: 'wand-sparkles', group: 'Actions', run: () => { go('image'); setTimeout(() => $('[data-prompt="image"]')?.focus(), 200); } },
    { label: 'Animate my latest image', icon: 'film', group: 'Actions', run: () => go('video') },
    { label: 'Record my voice', icon: 'mic', group: 'Actions', run: () => go('voice') },
    { label: 'Export current project', icon: 'download', group: 'Actions', run: () => { go('studio'); setTimeout(() => openModal('export'), 250); } },
    { label: 'Customize dock', icon: 'layout-grid', group: 'Actions', run: () => openModal('v-dock') }
  ];
  let cmdSel = 0;
  function renderCmdk(q = '') {
    const list = $('#v-cmdk .v-cmdk-list');
    const items = CMDS().filter(c => c.label.toLowerCase().includes(q.toLowerCase()));
    cmdSel = Math.min(cmdSel, Math.max(0, items.length - 1));
    let g = '';
    list.innerHTML = items.map((c, i) => { const head = c.group !== g ? `<div class="v-cmdk-group">${(g = c.group)}</div>` : ''; return head + `<button class="v-cmdk-item${i === cmdSel ? ' sel' : ''}" data-ci="${i}"><span class="v-cmdk-ic">${ic(c.icon)}</span><span>${c.label}</span>${c.hint ? `<small>${c.hint}</small>` : ''}</button>`; }).join('') || `<p class="v-cmdk-empty">No matches for “${q}”</p>`;
    list._items = items;
  }

  /* ---------- modals ---------- */
  function openModal(id) {
    const m = document.getElementById(id); if (!m) return;
    m.classList.add('open'); document.body.classList.add('modal-open');
    if (id === 'v-cmdk') { const i = $('input', m); i.value = ''; cmdSel = 0; renderCmdk(); setTimeout(() => i.focus(), 30); }
    if (id === 'v-dock') renderDockSheet();
  }
  function closeModal(m) {
    (m ? [m] : $$('[data-modal].open')).forEach(x => x.classList.remove('open'));
    if (!$('[data-modal].open')) document.body.classList.remove('modal-open');
  }

  /* ---------- onboarding slides ---------- */
  function initSlides() {
    $$('[data-slides]').forEach(host => {
      const slides = $$('[data-slide]', host); if (!slides.length) return;
      let i = 0;
      const dots = $('[data-dots]', host);
      if (dots) dots.innerHTML = slides.map((_, k) => `<button aria-label="Slide ${k + 1}" data-dot="${k}"></button>`).join('');
      const show = k => {
        i = (k + slides.length) % slides.length;
        slides.forEach((s, n) => s.classList.toggle('on', n === i));
        dots && $$('button', dots).forEach((d, n) => d.classList.toggle('on', n === i));
        host.style.setProperty('--slide', i);
        host.dataset.slideIdx = i;
      };
      host.addEventListener('click', e => {
        const d = e.target.closest('[data-dot]'); if (d) show(+d.dataset.dot);
        if (e.target.closest('[data-slide-next]')) { if (i === slides.length - 1 && host.dataset.finish) go(host.dataset.finish); else show(i + 1); }
        if (e.target.closest('[data-slide-prev]')) show(i - 1);
      });
      let sx = null;
      host.addEventListener('pointerdown', e => (sx = e.clientX));
      host.addEventListener('pointerup', e => { if (sx === null) return; const dx = e.clientX - sx; if (Math.abs(dx) > 50) show(i + (dx < 0 ? 1 : -1)); sx = null; });
      if (host.dataset.auto) setInterval(() => { if (!host.matches(':hover') && host.offsetParent) show(i + 1); }, +host.dataset.auto);
      show(0);
    });
  }

  /* ---------- tilt ---------- */
  function initTilt() {
    $$('[data-tilt]').forEach(el => {
      el.addEventListener('pointermove', e => {
        if (e.pointerType !== 'mouse') return;
        const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--rx', (-y * 8).toFixed(2) + 'deg'); el.style.setProperty('--ry', (x * 10).toFixed(2) + 'deg');
        el.style.setProperty('--mx', ((x + 0.5) * 100).toFixed(1) + '%'); el.style.setProperty('--my', ((y + 0.5) * 100).toFixed(1) + '%');
      });
      el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
    });
  }

  /* ---------- Editing Studio (timeline) ---------- */
  const S = { t: 0, playing: false, raf: null, pps: 28, sel: null };
  const CAPTIONS = [[0, 'In a city that never sleeps,'], [2.6, 'one light refused'], [4.4, 'to go out.'], [7, 'This is Nova.'], [9.5, 'And this is her story.'], [13, '']];
  const tl = () => $('[data-timeline]');
  function layoutTimeline() {
    const root = tl(); if (!root) return;
    S.pps = +(getComputedStyle(root).getPropertyValue('--pps') || 0) || S.pps;
    $$('[data-len]', root).forEach(c => {
      c.style.width = (+c.dataset.len * S.pps) + 'px';
      if (c.dataset.img && !c.dataset.filled) { c.style.backgroundImage = `url(${IMG[c.dataset.img]})`; c.dataset.filled = 1; }
      if (c.hasAttribute('data-clip') && !c.querySelector('.h-l')) c.insertAdjacentHTML('beforeend', '<span class="h-l"></span><span class="h-r"></span>');
    });
    const total = timelineLength();
    const ruler = $('[data-ruler]', root);
    if (ruler) {
      const end = Math.ceil(total + 6);
      let h = '';
      const every = S.pps < 18 ? 10 : 5;
      for (let s = 0; s <= end; s++) h += `<span class="tick${s % every === 0 ? ' major' : ''}" style="left:${s * S.pps}px">${s % every === 0 ? fmt(s) : ''}</span>`;
      ruler.innerHTML = h;
      ruler.style.width = end * S.pps + 'px';
    }
    const inner = $('[data-tl-inner]', root); if (inner) inner.style.width = (Math.ceil(total + 6) * S.pps) + 'px';
    $$('[data-total]').forEach(el => (el.textContent = fmt(total)));
    setTime(S.t);
  }
  function trackLen(tr) { return $$('[data-len]', tr).reduce((a, c) => a + +c.dataset.len, 0); }
  function timelineLength() { const root = tl(); if (!root) return 0; return Math.max(...$$('[data-track]', root).map(trackLen), 1); }
  function clipAt(track, t) {
    let acc = 0;
    for (const c of $$('[data-len]', track)) { const l = +c.dataset.len; if (t >= acc && t < acc + l) return c.hasAttribute('data-clip') ? { c, start: acc } : null; acc += l; }
    return null;
  }
  function setTime(t) {
    const root = tl(); if (!root) return;
    const total = timelineLength();
    S.t = Math.max(0, Math.min(t, total));
    $$('[data-playhead]', root).forEach(p => (p.style.transform = `translateX(${S.t * S.pps}px)`));
    const tf = Math.floor((S.t % 1) * 30);
    $$('[data-timecode]').forEach(el => (el.textContent = `${fmt(S.t)}.${String(tf).padStart(2, '0')}`));
    $$('[data-tl-progress]').forEach(el => el.style.setProperty('--t', (S.t / total).toFixed(4)));
    const vt = $('[data-track="video"]', root);
    const hit = vt && clipAt(vt, S.t);
    const stageImg = $('[data-stage-img]');
    if (stageImg && hit && hit.c.dataset.img && stageImg.dataset.cur !== hit.c.dataset.img) {
      stageImg.dataset.cur = hit.c.dataset.img; stageImg.src = IMG[hit.c.dataset.img];
      stageImg.classList.remove('cut'); void stageImg.offsetWidth; stageImg.classList.add('cut');
    }
    if (hit) { const k = (S.t - hit.start) / +hit.c.dataset.len; stageImg?.style.setProperty('--k', k.toFixed(3)); }
    const tt = $('[data-track="text"]', root), th = tt && clipAt(tt, S.t);
    $$('[data-stage-title]').forEach(el => { el.classList.toggle('show', !!th); if (th) el.textContent = th.c.dataset.text || th.c.textContent.trim(); });
    const cap = [...CAPTIONS].reverse().find(c => S.t >= c[0]);
    $$('[data-stage-caption]').forEach(el => (el.textContent = cap ? cap[1] : ''));
    const scroller = $('[data-tl-scroll]', root);
    if (scroller && S.playing) {
      const x = S.t * S.pps;
      if (x > scroller.scrollLeft + scroller.clientWidth * 0.8 || x < scroller.scrollLeft) scroller.scrollLeft = x - scroller.clientWidth * 0.2;
    }
  }
  function playStudio() {
    if (S.playing) return stopStudio();
    if (S.t >= timelineLength() - 0.05) S.t = 0;
    S.playing = true; document.body.classList.add('studio-playing');
    $$('[data-studio-play] use').forEach(u => u.setAttribute('href', '#i-pause'));
    let last = performance.now();
    const f = now => { if (!S.playing) return; setTime(S.t + (now - last) / 1000 * S.speed); last = now; if (S.t >= timelineLength()) return stopStudio(); S.raf = requestAnimationFrame(f); };
    S.raf = requestAnimationFrame(f);
  }
  S.speed = 1;
  function stopStudio() {
    if (!S.playing) return; S.playing = false; cancelAnimationFrame(S.raf); document.body.classList.remove('studio-playing');
    $$('[data-studio-play] use').forEach(u => u.setAttribute('href', '#i-play'));
  }
  function selectClip(c) {
    $$('[data-clip].sel').forEach(x => x.classList.remove('sel'));
    S.sel = c || null;
    if (c) c.classList.add('sel');
    document.body.classList.toggle('clip-selected', !!c);
    const tr = c?.closest('[data-track]');
    $$('[data-insp-name]').forEach(el => (el.textContent = c ? (c.dataset.name || 'Clip') : 'Nothing selected'));
    $$('[data-insp-kind]').forEach(el => (el.textContent = c ? ({ video: 'Video clip', text: 'Text', voice: 'Voice-over', music: 'Music' })[tr.dataset.track] || 'Clip' : 'Tap a clip on the timeline'));
    $$('[data-insp-len]').forEach(el => (el.textContent = c ? (+c.dataset.len).toFixed(1) + 's' : '—'));
    $$('[data-insp-thumb]').forEach(el => { el.style.backgroundImage = c && c.dataset.img ? `url(${IMG[c.dataset.img]})` : ''; });
  }
  function studioAction(a) {
    const root = tl(); if (!root) return;
    if (a === 'split') {
      if (!S.sel) return toast('Tap a clip first', 'info');
      const tr = S.sel.closest('[data-track]');
      let acc = 0; for (const c of $$('[data-len]', tr)) { if (c === S.sel) break; acc += +c.dataset.len; }
      const l = +S.sel.dataset.len, cut = S.t - acc;
      if (cut <= 0.3 || cut >= l - 0.3) return toast('Move the playhead inside the clip', 'info');
      const b = S.sel.cloneNode(true); b.classList.remove('sel'); b.dataset.filled = ''; $$('.h-l,.h-r', b).forEach(x => x.remove());
      S.sel.dataset.len = cut.toFixed(2); b.dataset.len = (l - cut).toFixed(2);
      S.sel.after(b); b.classList.add('pop'); layoutTimeline(); toast('Clip split', 'scissors');
    }
    if (a === 'delete') { if (!S.sel) return toast('Tap a clip first', 'info'); const c = S.sel; c.classList.add('out'); setTimeout(() => { c.remove(); layoutTimeline(); }, 200); selectClip(null); toast('Clip removed', 'trash-2'); }
    if (a === 'duplicate') { if (!S.sel) return toast('Tap a clip first', 'info'); const b = S.sel.cloneNode(true); b.classList.remove('sel'); $$('.h-l,.h-r', b).forEach(x => x.remove()); S.sel.after(b); b.classList.add('pop'); layoutTimeline(); toast('Clip duplicated', 'copy'); }
    if (a === 'undo') toast('Undone', 'undo-2');
    if (a === 'redo') toast('Redone', 'redo-2');
    if (a === 'start') { setTime(0); const s = $('[data-tl-scroll]', root); if (s) s.scrollLeft = 0; }
  }
  function addClip(kind, opts) {
    const root = tl(); if (!root) return;
    const tr = $(`[data-track="${kind}"]`, root); if (!tr) return;
    const c = document.createElement('div');
    c.className = 'clip clip-' + kind + ' pop'; c.setAttribute('data-clip', ''); c.dataset.len = opts.len || 5; c.dataset.name = opts.name || 'New clip';
    if (opts.img) c.dataset.img = opts.img;
    c.innerHTML = kind === 'video' ? `<span class="clip-name">${c.dataset.name}</span>` : `<span class="clip-name">${ic(kind === 'voice' ? 'mic' : 'music')} ${c.dataset.name}</span><span class="clip-wave" data-wave data-bars="60" data-seed="${Math.floor(Math.random() * 90)}"></span>`;
    tr.appendChild(c); hydrate(c); layoutTimeline(); selectClip(c);
  }
  function initStudio() {
    const root = tl(); if (!root) return;
    layoutTimeline();
    const scroller = $('[data-tl-scroll]', root) || root;
    let scrub = false;
    const toT = e => { const r = ($('[data-tl-inner]', root) || scroller).getBoundingClientRect(); return (e.clientX - r.left) / S.pps; };
    scroller.addEventListener('pointerdown', e => {
      const h = e.target.closest('.h-l,.h-r');
      if (h) {
        const c = h.closest('[data-clip]'), x0 = e.clientX, l0 = +c.dataset.len, side = h.classList.contains('h-r') ? 1 : -1;
        e.preventDefault(); h.setPointerCapture(e.pointerId);
        const mv = ev => { c.dataset.len = Math.max(0.6, l0 + side * (ev.clientX - x0) / S.pps).toFixed(2); layoutTimeline(); $$('[data-insp-len]').forEach(el => (el.textContent = (+c.dataset.len).toFixed(1) + 's')); };
        const up = () => { h.removeEventListener('pointermove', mv); h.removeEventListener('pointerup', up); };
        h.addEventListener('pointermove', mv); h.addEventListener('pointerup', up);
        return;
      }
      const clip = e.target.closest('[data-clip]');
      if (clip) { selectClip(clip); setTime(toT(e)); return; }
      if (e.target.closest('[data-ruler],[data-playhead],[data-tl-inner]')) { scrub = true; stopStudio(); setTime(toT(e)); scroller.setPointerCapture?.(e.pointerId); selectClip(null); }
    });
    scroller.addEventListener('pointermove', e => { if (scrub) setTime(toT(e)); });
    ['pointerup', 'pointercancel'].forEach(ev => scroller.addEventListener(ev, () => (scrub = false)));
    $$('[data-tl-zoom]').forEach(z => z.addEventListener('input', () => { root.style.setProperty('--pps', z.value); S.pps = +z.value; layoutTimeline(); }));
    const live = $('[data-title-input]');
    live && live.addEventListener('input', () => { const tc = $('[data-track="text"] [data-clip]', root); if (tc) { tc.dataset.text = live.value; const n = $('.clip-name', tc); if (n) n.textContent = live.value; } $$('[data-stage-title]').forEach(el => (el.textContent = live.value)); });
    window.addEventListener('resize', () => layoutTimeline());
  }

  /* ---------- delegated clicks ---------- */
  document.addEventListener('click', e => {
    const el = e.target;
    const a = (s) => el.closest(s);
    let x;
    if ((x = a('[data-dock-remove]'))) { e.stopPropagation(); e.preventDefault(); if (dock.length <= 2) return toast('Keep at least 2 tools', 'info'); dock = dock.filter(d => d !== x.dataset.dockRemove); saveDock(); return; }
    if ((x = a('[data-dock-add]'))) { if (dock.length >= DOCK_MAX) return toast('Dock is full — remove one first', 'info'); dock.push(x.dataset.dockAdd); saveDock(); toast(`${T[x.dataset.dockAdd].label} added to dock`, 'plus'); return; }
    if (a('[data-dock-reset]')) { dock = DOCK_DEFAULT.slice(); saveDock(); return; }
    if (document.body.classList.contains('dock-editing') && a('[data-dock-item]')) { e.preventDefault(); openModal('v-dock'); return; }
    if ((x = a('[data-ci]'))) { const it = $('#v-cmdk .v-cmdk-list')._items[+x.dataset.ci]; closeModal(); it && it.run(); return; }
    if ((x = a('[data-modal]')) && el === x) { closeModal(x); return; }
    if ((x = a('[data-open]'))) { e.preventDefault(); if (x.closest('[data-modal].open') && !x.closest('#' + x.dataset.open)) closeModal(); openModal(x.dataset.open); }
    if ((x = a('[data-send]'))) {
      const src = IMG[x.dataset.srcImg] || x.dataset.src;
      $$(`[data-slot="${x.dataset.send}"]`).forEach(im => { im.src = src; im.dataset.img = x.dataset.srcImg || ''; im.closest('[data-slot-host]')?.classList.add('has-media'); });
      uploads[x.dataset.send] = [src];
      if (x.dataset.toast) toast(x.dataset.toast, 'arrow-right');
    }
    if ((x = a('[data-add-clip]'))) { addClip(x.dataset.addClip, { img: x.dataset.clipImg, len: +x.dataset.clipLen || 5, name: x.dataset.clipName }); toast(x.dataset.toast || 'Added to your timeline', 'plus'); }
    if ((x = a('[data-go]')) && !e.defaultPrevented) { e.preventDefault(); go(x.dataset.go); if (x.closest('[data-modal]') || x.hasAttribute('data-close')) closeModal(); }
    if ((x = a('[data-close]')) && !a('[data-go]')) { closeModal(x.closest('[data-modal]')); }
    if ((x = a('[data-generate]'))) generate(x);
    if ((x = a('[data-reset]'))) { const g = $(`[data-gen="${x.dataset.reset}"]`); if (g) { g.dataset.state = 'empty'; g.style.setProperty('--prog', 0); } }
    if ((x = a('[data-demo-upload]'))) { e.stopPropagation(); const k = x.dataset.demoUpload; const zone = $(`[data-upload="${k}"]`); if (zone && zone.hasAttribute('data-single')) addUpload(k, IMG[x.dataset.demoImg || 'hero1']); else DEMO.forEach((n, i) => setTimeout(() => addUpload(k, IMG[n], 0), i * 140)); }
    if ((x = a('[data-chip]'))) {
      const g = x.closest('[data-chips]');
      if (g) {
        if (g.dataset.chips === 'multi') x.classList.toggle('on');
        else { $$('[data-chip]', g).forEach(c => { c.classList.remove('on'); c.setAttribute('aria-checked', 'false'); }); x.classList.add('on'); x.setAttribute('aria-checked', 'true'); }
        if (x.dataset.css) x.dataset.css.split(';').forEach(pair => { const i = pair.indexOf(':'); if (i > 0) $$(g.dataset.cssTarget || 'body').forEach(t => t.style.setProperty(pair.slice(0, i).trim(), pair.slice(i + 1).trim())); });
        if (x.dataset.label && g.dataset.labelTarget) $$(g.dataset.labelTarget).forEach(t => (t.textContent = x.dataset.label));
        if (x.dataset.speed) S.speed = +x.dataset.speed;
      }
    }
    if ((x = a('[data-tab]'))) {
      const [grp, name] = x.dataset.tab.split(':');
      const wasOn = x.classList.contains('active');
      $$(`[data-tab^="${grp}:"]`).forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      const close = wasOn && x.hasAttribute('data-toggleable');
      if (!close) { $$(`[data-tab="${x.dataset.tab}"]`).forEach(t => { t.classList.add('active'); t.setAttribute('aria-selected', 'true'); }); }
      $$(`[data-pane^="${grp}:"]`).forEach(p => p.classList.toggle('active', !close && p.dataset.pane === x.dataset.tab));
      document.body.dataset['tab_' + grp] = close ? '' : name;
    }
    if ((x = a('[data-filter]'))) {
      const [grp, kind] = x.dataset.filter.split(':');
      $$(`[data-filter^="${grp}:"]`).forEach(f => f.classList.toggle('on', f === x));
      $$(`[data-filterable="${grp}"] [data-kind]`).forEach(it => { const show = kind === 'all' || it.dataset.kind === kind; it.classList.toggle('filtered', !show); });
    }
    if ((x = a('[data-toggle]'))) { x.classList.toggle('on'); x.setAttribute('aria-pressed', x.classList.contains('on')); if (x.dataset.toggle) toast(x.classList.contains('on') ? x.dataset.toggle : (x.dataset.toggleOff || 'Turned off'), x.classList.contains('on') ? 'check' : 'x'); }
    if ((x = a('[data-toggle-body]'))) { document.body.classList.toggle(x.dataset.toggleBody); x.classList.toggle('on', document.body.classList.contains(x.dataset.toggleBody)); }
    if ((x = a('[data-play]'))) { const p = x.closest('[data-player]'); p && togglePlayer(p); }
    if ((x = a('[data-seek]'))) { const p = x.closest('[data-player]'); p && seekPlayer(p, e); }
    if ((x = a('[data-voice]'))) { const g = x.closest('[data-voices]'); $$('[data-voice]', g).forEach(v => v.classList.toggle('on', v === x)); $$('[data-voice-name]').forEach(n => (n.textContent = x.dataset.voice)); }
    if ((x = a('[data-record]'))) toggleRecord(x);
    if ((x = a('[data-insert]'))) { const t = $(`[data-prompt="${x.dataset.insert}"]`); if (t) { t.value = x.dataset.mode === 'append' && t.value ? t.value.replace(/[.\s]*$/, '') + ', ' + x.dataset.text : x.dataset.text; t.dispatchEvent(new Event('input', { bubbles: true })); t.focus(); } }
    if ((x = a('[data-enhance]'))) { typeInto($(`[data-prompt="${x.dataset.enhance}"]`), x.dataset.text); toast('Prompt improved', 'wand-sparkles'); }
    if ((x = a('[data-studio]'))) studioAction(x.dataset.studio);
    if ((x = a('[data-studio-play]'))) playStudio();
    if ((x = a('[data-copy]'))) { try { navigator.clipboard.writeText(x.dataset.copy).then(() => toast('Copied', 'copy'), () => toast('Copied', 'copy')); } catch (er) { toast('Copied', 'copy'); } }
    if ((x = a('[data-toast]')) && !x.hasAttribute('data-toggle') && !x.hasAttribute('data-add-clip') && !x.hasAttribute('data-send')) toast(x.dataset.toast, x.dataset.toastIcon || 'check');
    if ((x = a('[data-dock-edit]'))) { e.preventDefault(); openModal('v-dock'); }
  });

  /* long-press a dock item to customise (mobile habit) */
  let lp = null;
  document.addEventListener('pointerdown', e => { const d = e.target.closest('[data-dock-item]'); if (!d) return; lp = setTimeout(() => { lp = 'fired'; navigator.vibrate?.(12); openModal('v-dock'); }, 550); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => document.addEventListener(ev, () => { if (lp && lp !== 'fired') clearTimeout(lp); }));
  document.addEventListener('click', e => { if (lp === 'fired') { lp = null; e.stopPropagation(); e.preventDefault(); } }, true);

  /* inputs */
  document.addEventListener('input', e => {
    const el = e.target;
    if (el.type === 'range') {
      const p = (el.value - el.min) / (el.max - el.min) * 100; el.style.setProperty('--p', p + '%');
      if (el.dataset.out) $$(el.dataset.out).forEach(o => (o.textContent = (el.dataset.scale ? (el.value * +el.dataset.scale).toFixed(+(el.dataset.dec || 0)) : el.value) + (el.dataset.suffix || '')));
      if (el.dataset.var) $$(el.dataset.target || 'body').forEach(t => t.style.setProperty(el.dataset.var, el.dataset.scale ? el.value * +el.dataset.scale : el.value + (el.dataset.unit || '')));
    }
    if (el.matches('[data-prompt]')) {
      const k = el.dataset.prompt;
      $$(`[data-count-for="${k}"]`).forEach(c => (c.textContent = el.value.length));
      $$(`[data-needs-prompt="${k}"]`).forEach(b => b.toggleAttribute('disabled', el.value.trim().length < 3));
      if (el.tagName === 'TEXTAREA' && el.hasAttribute('data-autogrow')) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }
      if (k === 'voice') $$('[data-est]').forEach(s => (s.textContent = '~' + Math.max(1, Math.round(el.value.split(/\s+/).filter(Boolean).length / 2.6)) + 's'));
    }
    if (el.closest('#v-cmdk')) { cmdSel = 0; renderCmdk(el.value); }
  });

  /* keys */
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); $('#v-cmdk.open') ? closeModal() : openModal('v-cmdk'); return; }
    if (e.key === 'Escape') { closeModal(); return; }
    if ($('#v-cmdk.open')) {
      const items = $('#v-cmdk .v-cmdk-list')._items || [];
      if (e.key === 'ArrowDown') { cmdSel = (cmdSel + 1) % items.length; renderCmdk($('#v-cmdk input').value); e.preventDefault(); }
      if (e.key === 'ArrowUp') { cmdSel = (cmdSel - 1 + items.length) % items.length; renderCmdk($('#v-cmdk input').value); e.preventDefault(); }
      if (e.key === 'Enter' && items[cmdSel]) { closeModal(); items[cmdSel].run(); }
      return;
    }
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
    if (current === 'studio') {
      if (e.code === 'Space') { e.preventDefault(); playStudio(); }
      if (e.key.toLowerCase() === 's') studioAction('split');
      if (e.key === 'Delete' || e.key === 'Backspace') studioAction('delete');
      if (e.key === 'ArrowRight') setTime(S.t + 1 / 30 * (e.shiftKey ? 30 : 1));
      if (e.key === 'ArrowLeft') setTime(S.t - 1 / 30 * (e.shiftKey ? 30 : 1));
    }
  });

  document.addEventListener('vidora:view', e => { if (e.detail.view === 'studio') requestAnimationFrame(layoutTimeline); });

  /* ---------- boot ---------- */
  inject();
  hydrate();
  renderDocks();
  initDockDrag();
  initUploads();
  initSlides();
  initTilt();
  initTyping();
  initStudio();
  renderCredits();
  $$('input[type=range]').forEach(r => r.dispatchEvent(new Event('input', { bubbles: true })));
  $$('[data-prompt]').forEach(p => p.dispatchEvent(new Event('input', { bubbles: true })));
  go(location.hash.slice(1) || startView, false);
  requestAnimationFrame(() => document.body.classList.add('ready'));
  window.Vidora = { go, toast, openModal, closeModal, hydrate, layoutTimeline, setTime, IMG };
})();
