'use strict';
// DOM overlay: HUD, hint text, help/message modals, toasts. All buying happens on floor pads in-game.
const UI = {
  open: null,
  els: {},

  init() {
    const ver = document.getElementById('version'); if (ver) ver.textContent = 'Version ' + CFG.VERSION;
    const $ = (id) => document.getElementById(id);
    this.els = {
      cash: $('hud-cash'), city: $('hud-city'), hint: $('hint'), toasts: $('toasts'),
      help: $('modal-help'), msg: $('modal-msg'),
      catCtl: $('catalog-ctl'), catPrev: $('cat-prev'), catNext: $('cat-next'), catClose: $('cat-close'), btnSound: $('btn-sound'), msgTitle: $('msg-title'), msgBody: $('msg-body'), btnCar: $('btn-car'), btnMake: $('btn-make'), pizza: $('modal-pizza'),
    };
    $('btn-help').addEventListener('click', () => this.toggle('help'));
    this.els.btnSound.addEventListener('click', () => this.toggleSound());
    const fsBtn = $('btn-fullscreen');
    if (document.fullscreenEnabled || document.documentElement.webkitRequestFullscreen) {
      fsBtn.addEventListener('click', () => this.toggleFullscreen());
    } else {
      fsBtn.remove();
    }
    this.els.btnCar.addEventListener('click', () => this.toggleCar());
    this.els.catPrev.addEventListener('click', () => { if (this.catalog) this.catalog.prev(); });
    this.els.catNext.addEventListener('click', () => { if (this.catalog) this.catalog.next(); });
    this.els.catClose.addEventListener('click', () => { if (this.catalog) this.catalog.close(); });
    this.els.btnMake.addEventListener('click', () => Game.doAction());
    Game.onMakePizza = () => this.startMinigame();
    const sw = $('paint-swatches');
    for (const c of CFG.PAINT_COLORS) { const b = document.createElement('button'); b.className = 'swatch'; b.style.background = c === 'rainbow' ? 'linear-gradient(135deg, #ff4d4d, #ffb000, #ffe600, #3bd16f, #3b7dd8, #8e5bd1)' : c; b.title = c === 'rainbow' ? 'Rainbow' : ''; b.addEventListener('click', () => Game.paintVehicle(c)); sw.appendChild(b); }
    this.els.paint = $('paint-bar');
    MiniGame.init($('pizza-canvas'), $('pizza-primary'));
    $('pizza-quit').addEventListener('click', () => { MiniGame.stop(); this.close(); });
    window.addEventListener('resize', () => { if (MiniGame.open) MiniGame.resize(); });
    $('btn-zoom-in').addEventListener('click', () => Render.setZoom(Render.zoom * 1.25));
    $('btn-zoom-out').addEventListener('click', () => Render.setZoom(Render.zoom / 1.25));
    $('btn-home').addEventListener('click', () => { Game.goHome(); this.close(); });
    $('btn-cash').addEventListener('click', () => { Game.s.cash += 10000; Game.save(); this.close(); Game.toast('💰 +$10,000 (debug)', true); });   // debug: free money   // stuck somewhere? straight back to the shop
    $('btn-reset').addEventListener('click', () => {
      if (confirm('Reset all progress and start over?')) { Game.reset(); this.close(); this.toast('Progress reset'); }
    });
    $('msg-ok').addEventListener('click', () => this.close());
    document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => this.close()));
    document.querySelectorAll('.modal').forEach((m) => m.addEventListener('click', (e) => { if (e.target === m) this.close(); }));
    window.addEventListener('keydown', (e) => {
      if (this.catalog && !this.open) {   // a catalog is open: arrows turn the pages, Escape closes it
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); this.catalog.prev(); return; }
        if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); this.catalog.next(); return; }
        if (e.code === 'Escape') { this.catalog.close(); return; }
      }
      if (e.code === 'Escape') this.close();
      else if (e.code === 'KeyM') this.toggleSound();
      else if (e.code === 'KeyE') this.toggleCar();
      else if (e.code === 'Space' && !this.open) { e.preventDefault(); Game.doAction(); }
      else if (e.key === '?') this.toggle('help');
    });
    Game.onToast = (m) => this.toast(m);
    this.updateSoundBtn();
  },

  show(key) {
    this.close();
    this.open = key;
    this.els[key].classList.remove('hidden');
    Input.enabled = false; Input.keys = Object.create(null); Input.joy.active = false;
    if (key === 'help') Game.s.seenHelp = true;
  },
  toggle(key) { if (this.open === key) this.close(); else this.show(key); },
  close() {
    if (!this.open) return;
    if (this.open === 'pizza') MiniGame.stop();
    this.els[this.open].classList.add('hidden');
    this.open = null;
    Input.enabled = true;
  },
  message(title, html) {
    this.close();
    this.els.msgTitle.textContent = title;
    this.els.msgBody.innerHTML = html;
    this.open = 'msg';
    this.els.msg.classList.remove('hidden');
    Input.enabled = false;
  },
  toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast'; el.textContent = msg;
    this.els.toasts.appendChild(el);
    while (this.els.toasts.children.length > 2) this.els.toasts.firstChild.remove();
    setTimeout(() => el.remove(), 4200);
  },
  toggleCar() { if (Game.driving) Game.exitCar(); else Game.enterCar(); },
  // ---- catalog controls (used by the cabin and bedroom catalogs): handlers { prev, next, close }, then placeCatalog each frame
  catalog: null,
  openCatalog(handlers) { this.catalog = handlers; this.els.catCtl.classList.remove('hidden'); },
  closeCatalog() { this.catalog = null; this.els.catCtl.classList.add('hidden'); },
  // box is the catalog card in CSS px: { x, y, w, h }; the X sits on its top-right corner, the arrows on its sides
  placeCatalog(box, canPrev, canNext) {
    if (!this.catalog) return;
    const put = (el, x, y) => { el.style.left = x + 'px'; el.style.top = y + 'px'; };
    put(this.els.catClose, box.x + box.w - 10, box.y + 10);
    put(this.els.catPrev, box.x + 8, box.y + box.h / 2);
    put(this.els.catNext, box.x + box.w - 8, box.y + box.h / 2);
    this.els.catPrev.disabled = !canPrev; this.els.catNext.disabled = !canNext;
  },
  startMinigame() {
    if (!Game.nearPrep || this.open) return;
    this.show('pizza');
    MiniGame.start((result) => { this.close(); Game.finishHandmade(result); });
  },
  toggleSound() {
    Sfx.init(); Sfx.resume();
    Sfx.muted = !Sfx.muted; Game.s.muted = Sfx.muted; Game.save();
    this.updateSoundBtn();
  },
  updateSoundBtn() { this.els.btnSound.textContent = Sfx.muted ? '🔇' : '🔊'; },
  toggleFullscreen() {
    const el = document.documentElement;
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
    } catch (e) { /* not supported */ }
  },

  update(dt) {
    const g = Game, s = g.s;
    this.els.cash.textContent = U.money(s.cash);
    this.els.city.textContent = `${CFG.SHOP_NAME} · ${s.stats.served} served`;
    this.els.hint.textContent = g.hint ? g.hint.text : '';
    this.els.paint.classList.toggle('hidden', !g.inPaintBay);
    document.body.classList.toggle('painting', !!g.inPaintBay);
    const label = g.actionLabel();
    this.els.btnMake.classList.toggle('hidden', !label || this.open);
    if (label) this.els.btnMake.textContent = label;
    const showCar = g.driving || g.carNear;
    this.els.btnCar.classList.toggle('hidden', !showCar);
    const v = g.driving ? g.vehicle : g.nearVehicle;
    if (v) this.els.btnCar.textContent = g.driving ? CFG.VEHICLES[v.kind].exit : CFG.VEHICLES[v.kind].label;
  },
};
