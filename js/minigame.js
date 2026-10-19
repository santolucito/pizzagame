'use strict';
// "Make a pizza by hand": a small touch mini-game on its own canvas. The main game pauses while it is open.
const MiniGame = {
  open: false, canvas: null, ctx: null, W: 480, H: 560, scale: 1,
  stage: 'dough', t: 0, pointer: { down: false, x: 0, y: 0 }, held: null,
  dough: 0, doughBounce: 0, sauce: [], sauceCells: new Set(), cheese: [], toppings: [], bake: 0, baked: false, crispy: 0,
  tapFx: [], onDone: null, lastTapT: 0,
  CENTER: { x: 240, y: 250 }, R_MIN: 70, R_MAX: 150,
  TRAY: [
    { kind: 'pepperoni', x: 90, y: 505 }, { kind: 'mushroom', x: 190, y: 505 }, { kind: 'olive', x: 290, y: 505 }, { kind: 'basil', x: 390, y: 505 },
  ],
  BAKE_TIME: 6, CRISPY_AFTER: 7,

  init(canvas, btnPrimary) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.btn = btnPrimary;
    const pos = (e) => { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * this.W, y: (e.clientY - r.top) / r.height * this.H }; };
    canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); Sfx.init(); Sfx.resume(); const p = pos(e); this.pointer = { down: true, x: p.x, y: p.y }; try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } this.onDown(p); });
    canvas.addEventListener('pointermove', (e) => { if (!this.pointer.down) return; e.preventDefault(); const p = pos(e); this.pointer.x = p.x; this.pointer.y = p.y; this.onMove(p); });
    const up = (e) => { if (!this.pointer.down) return; const p = pos(e); this.pointer.down = false; this.onUp(p); };
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
    btnPrimary.addEventListener('click', () => this.primary());
  },

  start(onDone) {
    this.open = true; this.onDone = onDone;
    this.inv = Game.s.farm; this.used = {};
    // farm flour / tomatoes / cheese are used automatically if you have them
    for (const k of ['wheat', 'tomato', 'cheese']) if (this.inv[k] > 0) { this.inv[k]--; this.used[k] = true; }
    this.stage = 'dough'; this.t = 0; this.dough = 0; this.doughBounce = 0;
    this.sauce = []; this.sauceCells = new Set(); this.cheese = []; this.toppings = []; this.bake = 0; this.baked = false; this.baking = false; this.crispy = 0; this.held = null; this.tapFx = [];
    this.resize(); this.updateButton();
  },
  stop() { this.open = false; },
  resize() {
    const maxW = Math.min(window.innerWidth - 16, 520), maxH = window.innerHeight - 150;
    const s = Math.min(maxW / this.W, maxH / this.H);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.style.width = Math.floor(this.W * s) + 'px'; this.canvas.style.height = Math.floor(this.H * s) + 'px';
    this.canvas.width = Math.floor(this.W * s * dpr); this.canvas.height = Math.floor(this.H * s * dpr);
    this.scale = s * dpr;
  },
  radius() { return this.R_MIN + (this.R_MAX - this.R_MIN) * Math.min(1, this.dough / 8) + this.doughBounce; },
  inPizza(p, margin = 0) { return U.dist(p.x, p.y, this.CENTER.x, this.CENTER.y) < this.radius() - margin; },

  // ----- input per stage -----
  onDown(p) {
    const c = this.CENTER;
    if (this.stage === 'dough') {
      if (U.dist(p.x, p.y, c.x, c.y) < this.radius() + 30) { this.dough = Math.min(8, this.dough + 1); this.doughBounce = 14; Sfx.drop(); Haptics.tap(); this.tapFx.push({ x: p.x, y: p.y, t: 0 }); if (this.dough >= 8) this.next('sauce'); }
    } else if (this.stage === 'sauce') { this.paint(p); }
    else if (this.stage === 'cheese') {
      if (this.inPizza(p, -10)) { for (let i = 0; i < 7; i++) this.cheese.push({ x: p.x + U.rand(-26, 26), y: p.y + U.rand(-26, 26), a: Math.random() * Math.PI, l: U.rand(8, 14) }); Sfx.pickup(); this.tapFx.push({ x: p.x, y: p.y, t: 0 }); if (this.cheese.length >= 70) this.next('toppings'); }
    } else if (this.stage === 'toppings') {
      const item = this.TRAY.find((it) => U.dist(p.x, p.y, it.x, it.y) < 40);
      if (item && !this.trayAvailable(item.kind)) { Sfx.error(); }
      else if (item) { this.held = { kind: item.kind, x: p.x, y: p.y }; Sfx.pickup(); }
      else if (this.inPizza(p, 14)) { const k = this.trayAvailable(this.lastKind || 'pepperoni') ? (this.lastKind || 'pepperoni') : 'pepperoni'; this.placeTopping(k, p); }
    } else if (this.stage === 'oven' || this.stage === 'done') {
      // tapping the oven or the pizza does the same as the big button: in, out, take
      if (!(this.stage === 'oven' && this.baking && !this.baked)) { this.tapFx.push({ x: p.x, y: p.y, t: 0 }); this.primary(); }
    }
  },
  onMove(p) {
    if (this.stage === 'sauce') this.paint(p);
    else if (this.stage === 'toppings' && this.held) { this.held.x = p.x; this.held.y = p.y; }
  },
  onUp(p) {
    if (this.stage === 'toppings' && this.held) {
      if (this.inPizza(p, 14)) { this.placeTopping(this.held.kind, p); this.lastKind = this.held.kind; Haptics.tap(); }
      this.held = null;
    }
  },
  paint(p) {
    if (!this.inPizza(p, 8)) return;
    this.sauce.push({ x: p.x, y: p.y });
    const cx = Math.floor((p.x - this.CENTER.x + 150) / 25), cy = Math.floor((p.y - this.CENTER.y + 150) / 25);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) this.sauceCells.add((cx + dx) + ',' + (cy + dy));
    if (this.sauceCoverage() >= 0.8) this.next('cheese');
  },
  sauceCoverage() {
    // cells of a 12x12 grid whose centre lies inside the pizza
    let inside = 0, painted = 0; const r = this.radius() - 10;
    for (let i = 0; i < 12; i++) for (let j = 0; j < 12; j++) {
      const x = this.CENTER.x - 150 + i * 25 + 12, y = this.CENTER.y - 150 + j * 25 + 12;
      if (U.dist(x, y, this.CENTER.x, this.CENTER.y) < r) { inside++; if (this.sauceCells.has(i + ',' + j)) painted++; }
    }
    return inside ? painted / inside : 0;
  },
  // mushroom and basil come from the farm basket; pepperoni and olives are always in the shop
  trayAvailable(kind) { return (kind !== 'mushroom' && kind !== 'basil') || this.inv[kind] > 0; },
  placeTopping(kind, p) {
    if (!this.trayAvailable(kind)) return;
    if (kind === 'mushroom' || kind === 'basil') { this.inv[kind]--; this.used[kind] = true; }
    this.toppings.push({ kind, x: p.x, y: p.y, a: Math.random() * 6 }); Sfx.drop(); this.checkToppings();
  },
  farmBonus() { return Object.keys(this.used).length; },
  checkToppings() { if (this.toppings.length >= 7) this.next('oven'); },
  next(stage) { this.stage = stage; this.t = 0; Sfx.buy(); this.updateButton(); },

  // the big button under the canvas
  updateButton() {
    const b = this.btn;
    b.classList.toggle('attention', true);
    if (this.stage === 'oven' && !this.baking && !this.baked) { b.textContent = '🔥 Put it in the oven'; b.classList.remove('hidden'); }
    else if (this.stage === 'oven' && this.baked) { b.textContent = '🧤 Take it out!'; b.classList.remove('hidden'); }
    else if (this.stage === 'done') { b.textContent = '🍕 Take the pizza'; b.classList.remove('hidden'); }
    else b.classList.add('hidden');
  },
  primary() {
    if (this.stage === 'oven' && !this.baking && !this.baked) { this.baking = true; this.bake = 0; Sfx.drop(); this.updateButton(); }
    else if (this.stage === 'oven' && this.baked) { this.baking = false; this.stage = 'done'; this.t = 0; Sfx.unlock(); Haptics.success(); this.updateButton(); }
    else if (this.stage === 'done') { this.stop(); if (this.onDone) this.onDone({ crispy: this.crispy > 0, farmBonus: this.farmBonus() }); }
  },

  update(dt) {
    this.t += dt;
    this.doughBounce = Math.max(0, this.doughBounce - dt * 60);
    for (const f of this.tapFx) f.t += dt; this.tapFx = this.tapFx.filter((f) => f.t < 0.4);
    if (this.stage === 'oven' && this.baking) {
      const was = this.baked;
      this.bake += dt;
      if (this.bake >= this.BAKE_TIME && !this.baked) { this.baked = true; Sfx.ding(); Haptics.success(); this.updateButton(); }
      if (this.baked) this.crispy = Math.max(0, this.bake - this.BAKE_TIME - this.CRISPY_AFTER);
      if (!was && this.baked) this.t = 0;
    }
  },

  // ----- drawing -----
  draw() {
    const ctx = this.ctx, W = this.W, H = this.H, c = this.CENTER;
    ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    // wooden table
    for (let y = 0; y < H; y += 28) { ctx.fillStyle = (y / 28) % 2 ? '#c99a5f' : '#c4935a'; ctx.fillRect(0, y, W, 28); ctx.fillStyle = 'rgba(80,40,10,0.15)'; ctx.fillRect(0, y, W, 1); }
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let i = 0; i < 40; i++) { ctx.beginPath(); ctx.arc((i * 131) % W, (i * 97) % H, 2 + (i % 3), 0, Math.PI * 2); ctx.fill(); }
    const stage = this.stage;
    if (stage === 'oven' || stage === 'done') this.drawOvenScene(); else this.drawPizza(c.x, c.y, this.radius(), false);
    // instruction banner
    const msg = {
      dough: `👐 Tap the dough to stretch it!  ${this.dough}/8${this.used.wheat ? ' 🌾' : ''}`,
      sauce: `🥄 Rub the sauce all over!  ${Math.round(this.sauceCoverage() * 100)}%${this.used.tomato ? ' 🍅' : ''}`,
      cheese: `🧀 Tap to sprinkle cheese!  ${Math.min(10, Math.floor(this.cheese.length / 7))}/10${this.used.cheese ? ' 🐄' : ''}`,
      toppings: `🍄 Drag toppings onto the pizza!  ${this.toppings.length}/7`,
      oven: this.baked ? '🔔 DING! Tap to take it out!' : this.baking ? `⏱ Baking… ${Math.max(0, Math.ceil(this.BAKE_TIME - this.bake))}` : '🔥 Tap the oven to put it in!',
      done: this.crispy > 0 ? '😅 Extra crispy! Tap to take it.' : this.farmBonus() ? `🌾 Farm-fresh! Counts as ${CFG.HANDMADE_PIZZAS + this.farmBonus()}!` : '🎉 Perfect! Tap to take it!',
    }[stage];
    ctx.fillStyle = 'rgba(43,29,20,0.85)'; U.roundRect(ctx, 16, 14, W - 32, 44, 14); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = Render.font(18); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(msg, W / 2, 36);
    // progress dots for the steps
    const steps = ['dough', 'sauce', 'cheese', 'toppings', 'oven', 'done']; const idx = steps.indexOf(stage);
    for (let i = 0; i < steps.length; i++) { ctx.fillStyle = i < idx ? '#2f9e44' : i === idx ? '#f2b134' : 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(W / 2 - 50 + i * 20, 72, 6, 0, Math.PI * 2); ctx.fill(); }
    // tray
    if (stage === 'toppings') {
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; U.roundRect(ctx, 34, 468, W - 68, 76, 14); ctx.fill();
      ctx.fillStyle = '#e6e1d4'; U.roundRect(ctx, 30, 464, W - 60, 76, 14); ctx.fill();
      for (const it of this.TRAY) {
        const ok = this.trayAvailable(it.kind);
        ctx.globalAlpha = ok ? 1 : 0.35;
        ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(it.x, it.y, 32, 0, Math.PI * 2); ctx.fill();
        for (let k = 0; k < 3; k++) this.drawTopping(it.kind, it.x + Math.cos(k * 2.1) * 10, it.y + Math.sin(k * 2.1) * 10, k);
        ctx.globalAlpha = 1;
        if (it.kind === 'mushroom' || it.kind === 'basil') {
          ctx.fillStyle = ok ? '#2f9e44' : '#8a7a6a'; U.roundRect(ctx, it.x + 14, it.y - 36, 26, 18, 9); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.font = Render.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(this.inv[it.kind]), it.x + 27, it.y - 27);
        }
      }
      if (this.held) this.drawTopping(this.held.kind, this.held.x, this.held.y - 10, 0, 1.3);
    }
    if (stage === 'sauce') { // spoon follows the finger
      const p = this.pointer; if (p.down) { ctx.fillStyle = '#9e9e9e'; ctx.beginPath(); ctx.ellipse(p.x, p.y - 6, 12, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(p.x + 8, p.y - 30, 5, 26); }
    }
    for (const f of this.tapFx) { ctx.strokeStyle = `rgba(255,255,255,${1 - f.t / 0.4})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(f.x, f.y, 10 + f.t * 90, 0, Math.PI * 2); ctx.stroke(); }
  },

  drawPizza(x, y, r, baked) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(x + 4, y + 8, r, r * 0.95, 0, 0, Math.PI * 2); ctx.fill();
    // dough with a wobbly edge
    ctx.fillStyle = baked ? (this.crispy > 0 ? '#9a5a24' : '#d98a3c') : '#f1dcb2';
    ctx.beginPath(); for (let a = 0; a < Math.PI * 2; a += 0.15) { const rr = r + Math.sin(a * 7) * 3; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); ctx.fill();
    ctx.fillStyle = baked ? '#e8a556' : '#f6e6c4'; ctx.beginPath(); ctx.arc(x, y, r - 14, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r - 12, 0, Math.PI * 2); ctx.clip();
    for (const s of this.sauce) { ctx.fillStyle = 'rgba(200,40,30,0.55)'; ctx.beginPath(); ctx.arc(s.x, s.y, 20, 0, Math.PI * 2); ctx.fill(); }
    for (const ch of this.cheese) { ctx.save(); ctx.translate(ch.x, ch.y); ctx.rotate(ch.a); ctx.fillStyle = baked ? '#f6c453' : '#fff1a8'; ctx.fillRect(-ch.l / 2, -2, ch.l, 4); ctx.restore(); }
    if (baked) { ctx.fillStyle = 'rgba(255,200,90,0.35)'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
    for (const t of this.toppings) this.drawTopping(t.kind, t.x, t.y, t.a, 1, baked);
    if (this.crispy > 0) { ctx.fillStyle = `rgba(60,30,10,${Math.min(0.5, this.crispy * 0.08)})`; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    if (baked) { ctx.strokeStyle = 'rgba(120,60,20,0.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, r - 7, 0, Math.PI * 2); ctx.stroke(); }
  },
  drawTopping(kind, x, y, a, s = 1, baked = false) {
    const ctx = this.ctx;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (kind === 'pepperoni') { ctx.fillStyle = baked ? '#a8281e' : '#c0392b'; ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(Math.cos(a + k * 1.6) * 6, Math.sin(a + k * 1.6) * 6, 2, 0, Math.PI * 2); ctx.fill(); } }
    else if (kind === 'mushroom') { ctx.rotate(a); ctx.fillStyle = '#e9d9c2'; ctx.fillRect(-4, 0, 8, 10); ctx.fillStyle = '#b89a78'; ctx.beginPath(); ctx.arc(0, 0, 11, Math.PI, 0); ctx.fill(); }
    else if (kind === 'olive') { ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.stroke(); }
    else if (kind === 'basil') { ctx.rotate(a); ctx.fillStyle = baked ? '#2e7d32' : '#3f9a4a'; ctx.beginPath(); ctx.ellipse(0, 0, 14, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#2e7d32'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(12, 0); ctx.stroke(); }
    ctx.restore();
  },
  drawOvenScene() {
    const ctx = this.ctx, W = this.W, c = this.CENTER;
    const inOven = this.stage === 'oven' && (this.baking || this.baked);
    // oven
    const ox = W / 2, oy = 250;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; U.roundRect(ctx, ox - 176, oy - 136, 360, 300, 18); ctx.fill();
    const grd = ctx.createLinearGradient(ox - 180, oy - 140, ox + 180, oy + 160); grd.addColorStop(0, '#5f646b'); grd.addColorStop(1, '#3f4247');
    ctx.fillStyle = grd; U.roundRect(ctx, ox - 180, oy - 140, 360, 300, 18); ctx.fill();
    ctx.fillStyle = '#2f3237'; U.roundRect(ctx, ox - 180, oy - 140, 360, 40, 14); ctx.fill();
    ctx.fillStyle = '#c9ccd2'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(ox - 120 + k * 30, oy - 120, 7, 0, Math.PI * 2); ctx.fill(); }
    // timer display
    ctx.fillStyle = '#1e1e1e'; U.roundRect(ctx, ox + 40, oy - 134, 120, 28, 6); ctx.fill();
    ctx.fillStyle = this.baked ? '#7cf29a' : '#ff8c42'; ctx.font = Render.font(18); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(this.baked ? 'DING!' : this.baking ? ('0:0' + Math.max(0, Math.ceil(this.BAKE_TIME - this.bake))) : '--:--', ox + 100, oy - 120);
    // window
    const prog = Math.min(1, this.bake / this.BAKE_TIME);
    ctx.fillStyle = '#23262a'; U.roundRect(ctx, ox - 150, oy - 80, 300, 200, 14); ctx.fill();
    const glow = inOven ? 0.35 + 0.6 * prog : 0.15;
    const g2 = ctx.createLinearGradient(0, oy - 70, 0, oy + 110); g2.addColorStop(0, `rgba(255,${Math.floor(150 + 60 * prog)},60,${glow})`); g2.addColorStop(1, `rgba(190,60,10,${glow})`);
    ctx.fillStyle = g2; U.roundRect(ctx, ox - 140, oy - 70, 280, 180, 10); ctx.fill();
    if (inOven) for (let k = 0; k < 9; k++) { const fx = ox - 120 + k * 30, fh = 10 + 10 * Math.abs(Math.sin(this.t * 10 + k * 1.7)); ctx.fillStyle = k % 2 ? '#ffd166' : '#ff8c42'; ctx.beginPath(); ctx.moveTo(fx - 7, oy + 108); ctx.quadraticCurveTo(fx, oy + 108 - fh * 2, fx + 7, oy + 108); ctx.closePath(); ctx.fill(); }
    if (inOven || this.stage === 'done') this.drawPizza(ox, oy + 20, 96, this.baked || this.stage === 'done');
    else this.drawPizza(ox, oy + 20, 96, false);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; U.roundRect(ctx, ox - 130, oy - 62, 260, 14, 7); ctx.fill();
    if (this.baking || this.baked) { ctx.fillStyle = 'rgba(0,0,0,0.4)'; U.roundRect(ctx, ox - 150, oy + 134, 300, 12, 6); ctx.fill(); ctx.fillStyle = this.baked ? '#2f9e44' : '#ff8c42'; U.roundRect(ctx, ox - 150, oy + 134, 300 * prog, 12, 6); ctx.fill(); }
    if (this.stage === 'oven' && !this.baking && !this.baked) { const bob = Math.sin(this.t * 5) * 8; ctx.font = Render.font(44); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('👇', ox, oy - 70 + bob); }
    if (this.baked && this.stage === 'oven') { const ring = Math.sin(this.t * 12) * 6; ctx.font = Render.font(40); ctx.textAlign = 'center'; ctx.fillStyle = '#ffe08a'; ctx.fillText('🔔', ox + ring, oy - 180 + 400 * 0); }
    if (this.stage === 'done') { ctx.font = Render.font(44); ctx.textAlign = 'center'; ctx.fillText('✨', ox - 120, oy - 20); ctx.fillText('✨', ox + 120, oy + 40); }
  },
};
