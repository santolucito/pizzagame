'use strict';
// Canvas renderer. Everything is drawn procedurally (no image assets).
const Render = {
  canvas: null, ctx: null, scale: 1, dpr: 1, viewW: CFG.W, viewH: CFG.H, camX: 0, camY: 0, MIN_VIEW_W: 540,

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  },

  resize() {
    const vw = window.innerWidth, vh = window.innerHeight;
    // Fit the whole map when the screen allows it; on narrow (portrait) screens zoom in so at least
    // MIN_VIEW_W logical pixels are visible and let the camera follow the player.
    const fit = Math.min(vw / CFG.W, vh / CFG.H);
    this.scale = Math.max(fit, Math.min(vw / this.MIN_VIEW_W, vh / CFG.H));
    this.viewW = Math.min(CFG.W, vw / this.scale);
    this.viewH = Math.min(CFG.H, vh / this.scale);
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = Math.floor(this.viewW * this.scale), ch = Math.floor(this.viewH * this.scale);
    this.canvas.style.width = cw + 'px'; this.canvas.style.height = ch + 'px';
    this.canvas.width = Math.floor(cw * this.dpr); this.canvas.height = Math.floor(ch * this.dpr);
  },

  // Camera follows the player only along axes where the map is larger than the view.
  updateCamera(g, snap) {
    const tx = U.clamp(g.player.x - this.viewW / 2, 0, CFG.W - this.viewW);
    const ty = U.clamp(g.player.y - this.viewH / 2, 0, CFG.H - this.viewH);
    if (snap) { this.camX = tx; this.camY = ty; return; }
    this.camX = U.lerp(this.camX, tx, 0.12);
    this.camY = U.lerp(this.camY, ty, 0.12);
  },

  toLogical(cx, cy) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: (cx - rect.left) / this.scale + this.camX, y: (cy - rect.top) / this.scale + this.camY };
  },
  toScreen(cx, cy) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: cx - rect.left, y: cy - rect.top };
  },

  font(size, weight = 800) { return `${weight} ${size}px "Trebuchet MS", "Segoe UI", system-ui, sans-serif`; },

  draw(g) {
    const ctx = this.ctx;
    this.updateCamera(g, false);
    ctx.setTransform(this.dpr * this.scale, 0, 0, this.dpr * this.scale, -this.camX * this.dpr * this.scale, -this.camY * this.dpr * this.scale);
    this.drawFloor(g);
    this.drawRoad(g);
    this.drawKitchen(g);
    this.drawCounter(g);
    this.drawDriveThru(g);
    this.drawDesks(g);
    this.drawTables(g);
    this.drawPads(g);
    this.drawEntities(g);
    this.drawFx(g);
    this.drawFloats(g);
    this.drawHint(g);
    this.drawJoystick();
  },

  // ---------- environment ----------
  drawFloor(g) {
    const ctx = this.ctx;
    // dining / front of house: warm checker tiles
    ctx.fillStyle = '#f0dcb8'; ctx.fillRect(0, CFG.ROAD.y2, CFG.W, CFG.H - CFG.ROAD.y2);
    ctx.fillStyle = 'rgba(0,0,0,0.045)';
    const ts = 40;
    for (let y = CFG.ROAD.y2 + 12; y < CFG.H; y += ts) for (let x = 0; x < CFG.W; x += ts) {
      if (((x / ts) + Math.floor((y - CFG.ROAD.y2 - 12) / ts)) % 2 === 0) ctx.fillRect(x, y, ts, ts);
    }
    // kitchen: grey tile
    ctx.fillStyle = '#d7d9dc'; ctx.fillRect(0, CFG.ROAD.y2 + 12, 372, 362);
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    for (let y = CFG.ROAD.y2 + 12; y < 472; y += 30) for (let x = 0; x < 372; x += 30) if (((x / 30) + Math.floor((y - CFG.ROAD.y2 - 12) / 30)) % 2 === 0) ctx.fillRect(x, y, 30, 30);
    // staff area behind the counter
    ctx.fillStyle = '#e4e0d4'; ctx.fillRect(372, CFG.ROAD.y2 + 12, CFG.W - 372, CFG.COUNTER.y - CFG.ROAD.y2 - 12);
    // office (bottom-left): wood floor
    ctx.fillStyle = '#c99a5f'; ctx.fillRect(0, 472, 372, CFG.H - 472);
    ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 1;
    for (let y = 472; y < CFG.H; y += 18) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(372, y); ctx.stroke(); }
    // walls
    ctx.fillStyle = '#7a5235'; ctx.fillRect(0, CFG.ROAD.y2, CFG.W, 12);
    ctx.fillStyle = '#9c6b45'; ctx.fillRect(372, CFG.ROAD.y2 + 12, 6, CFG.COUNTER.y - CFG.ROAD.y2 - 12 - 60);
    ctx.fillRect(372, 300, 6, 172);
    ctx.fillRect(0, 472, 372, 6);
    ctx.fillRect(372, 472 - 60, 6, 60);
    // entrance mat
    ctx.fillStyle = '#b23a48'; U.roundRect(ctx, CFG.ENTRANCE.x - 40, CFG.ENTRANCE.y - 18, 68, 36, 6); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = this.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('WELCOME', CFG.ENTRANCE.x - 6, CFG.ENTRANCE.y);
    ctx.fillStyle = '#7a5235'; ctx.fillRect(CFG.ENTRANCE.x + 24, CFG.ENTRANCE.y - 30, 12, 60);
  },

  drawRoad(g) {
    const ctx = this.ctx;
    const r = CFG.ROAD;
    if (g.isUnlocked('driveThru')) {
      ctx.fillStyle = '#4a4a4f'; ctx.fillRect(0, 0, CFG.W, r.y2);
      ctx.strokeStyle = '#f2c94c'; ctx.lineWidth = 3; ctx.setLineDash([22, 16]);
      ctx.beginPath(); ctx.moveTo(0, (r.y1 + r.y2) / 2); ctx.lineTo(CFG.W, (r.y1 + r.y2) / 2); ctx.stroke(); ctx.setLineDash([]);
      // stop line at the window
      ctx.fillStyle = '#fff'; ctx.fillRect(CFG.DT_WINDOW.x + 56, r.y1 + 6, 6, r.y2 - r.y1 - 12);
    } else {
      ctx.fillStyle = '#6aa84f'; ctx.fillRect(0, 0, CFG.W, r.y2);
      ctx.fillStyle = '#5c9443';
      for (let x = 10; x < CFG.W; x += 47) { ctx.beginPath(); ctx.ellipse(x, 30 + ((x / 47) % 3) * 18, 9, 5, 0, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.fillStyle = '#b9b2a4'; ctx.fillRect(0, r.y2 - 6, CFG.W, 6); // curb
  },

  drawKitchen(g) {
    const ctx = this.ctx;
    const bt = g.bakeTime();
    for (let i = 0; i < 2; i++) {
      const o = CFG.OVENS[i];
      if (i === 1 && !g.isUnlocked('oven2')) continue;
      // body
      ctx.fillStyle = '#50545a'; U.roundRect(ctx, o.x - 36, o.y - 30, 72, 60, 8); ctx.fill();
      ctx.fillStyle = '#3a3d42'; U.roundRect(ctx, o.x - 36, o.y - 30, 72, 14, 6); ctx.fill();
      // door with glow
      const prog = U.clamp(g.ovens[i].t / bt, 0, 1);
      const glow = 0.35 + 0.65 * prog;
      ctx.fillStyle = `rgba(255, ${Math.floor(120 + 60 * prog)}, 40, ${glow})`;
      U.roundRect(ctx, o.x - 26, o.y - 10, 52, 30, 5); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; U.roundRect(ctx, o.x - 26, o.y - 10, 52, 8, 4); ctx.fill();
      // pizza inside
      this.drawPizza(o.x, o.y + 6, 9);
      // progress bar
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; U.roundRect(ctx, o.x - 30, o.y + 24, 60, 7, 3); ctx.fill();
      ctx.fillStyle = '#ff8c42'; U.roundRect(ctx, o.x - 30, o.y + 24, 60 * prog, 7, 3); ctx.fill();
      // label
      ctx.fillStyle = '#fff'; ctx.font = this.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('OVEN', o.x, o.y - 23);
    }
    // pile tray
    const p = CFG.OVEN_PILE;
    ctx.fillStyle = '#8c8f94'; U.roundRect(ctx, p.x - 26, p.y - 12, 52, 26, 6); ctx.fill();
    ctx.fillStyle = '#a4a7ac'; U.roundRect(ctx, p.x - 22, p.y - 9, 44, 18, 4); ctx.fill();
    this.drawPizzaStack(p.x, p.y - 2, g.s.piles.oven);
    this.drawCountBadge(p.x + 26, p.y - 18 - g.s.piles.oven * 4, g.s.piles.oven, g.ovenPileCap());
  },

  drawCounter(g) {
    const ctx = this.ctx;
    const c = CFG.COUNTER;
    ctx.fillStyle = '#8f5a2b'; U.roundRect(ctx, c.x1, c.y + 8, c.x2 - c.x1, c.h, 8); ctx.fill();
    ctx.fillStyle = '#c98a4b'; U.roundRect(ctx, c.x1, c.y, c.x2 - c.x1, c.h - 6, 8); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(c.x1 + 8, c.y + 4, c.x2 - c.x1 - 16, 4);
    // register
    const r = CFG.REGISTER;
    ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, r.x - 18, r.y - 26, 36, 32, 5); ctx.fill();
    ctx.fillStyle = '#7fd1ff'; U.roundRect(ctx, r.x - 13, r.y - 22, 26, 12, 3); ctx.fill();
    ctx.fillStyle = '#c9d2dc'; U.roundRect(ctx, r.x - 14, r.y - 7, 28, 9, 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = this.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('PAY HERE', r.x, r.y + 16);
    // cashier spot marker (floor)
    const cs = CFG.CASHIER_SPOT;
    ctx.strokeStyle = g.cashierPresent() ? 'rgba(47,158,68,0.8)' : 'rgba(228,87,46,0.6)'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.ellipse(cs.x, cs.y + 2, 26, 14, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    // display
    const d = CFG.DISPLAY;
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; U.roundRect(ctx, d.x - 30, d.y - 16, 60, 22, 5); ctx.fill();
    this.drawPizzaStack(d.x, d.y - 6, g.s.piles.display);
    this.drawCountBadge(d.x + 30, d.y - 22 - g.s.piles.display * 4, g.s.piles.display, CFG.DISPLAY_CAP);
    // queue marker
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    for (let i = 0; i < CFG.QUEUE.max; i++) { ctx.beginPath(); ctx.ellipse(CFG.QUEUE.x, CFG.QUEUE.y + i * CFG.QUEUE.dy + 4, 16, 8, 0, 0, Math.PI * 2); ctx.fill(); }
    // cash pile
    this.drawCashPile(CFG.CASH_PILE.x, CFG.CASH_PILE.y, g.s.piles.cash);
  },

  drawDriveThru(g) {
    if (!g.isUnlocked('driveThru')) return;
    const ctx = this.ctx;
    const w = CFG.DT_WINDOW;
    // awning + window on the top wall
    ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, w.x - 42, CFG.ROAD.y2 - 2, 84, 20, 4); ctx.fill();
    ctx.fillStyle = '#7fd1ff'; U.roundRect(ctx, w.x - 36, CFG.ROAD.y2 + 1, 72, 12, 3); ctx.fill();
    for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#fff' : '#e4572e'; ctx.fillRect(w.x - 48 + i * 12, CFG.ROAD.y2 - 10, 12, 10); }
    ctx.fillStyle = '#fff'; ctx.font = this.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, w.x - 146, CFG.ROAD.y2 - 4, 92, 18, 4); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.fillText('DRIVE THRU', w.x - 100, CFG.ROAD.y2 + 5);
    // stack shelf + cash
    const s = CFG.DT_STACK;
    ctx.fillStyle = '#8c8f94'; U.roundRect(ctx, s.x - 26, s.y - 12, 52, 26, 6); ctx.fill();
    ctx.fillStyle = '#a4a7ac'; U.roundRect(ctx, s.x - 22, s.y - 9, 44, 18, 4); ctx.fill();
    this.drawPizzaStack(s.x, s.y - 2, g.s.piles.dt);
    this.drawCountBadge(s.x + 26, s.y - 18 - g.s.piles.dt * 4, g.s.piles.dt, CFG.DT_STACK_CAP);
    this.drawCashPile(CFG.DT_CASH.x, CFG.DT_CASH.y, g.s.piles.dtCash);
  },

  drawDesks(g) {
    const ctx = this.ctx;
    for (const [pos, label, ico] of [[CFG.UPG_PAD, 'UPGRADES', '⬆'], [CFG.HR_PAD, 'STAFF', '👥']]) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(pos.x, pos.y, 36, 20, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(43,29,20,0.5)'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, pos.x - 40, pos.y + 24, 80, 24, 5); ctx.fill();
      ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, pos.x - 40, pos.y + 18, 80, 24, 5); ctx.fill();
      ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, pos.x - 34, pos.y + 22, 20, 14, 2); ctx.fill();
      ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, pos.x - 44, pos.y + 50, 88, 18, 4); ctx.fill();
      ctx.fillStyle = '#ffe08a'; ctx.font = this.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, pos.x, pos.y + 59);
      ctx.font = this.font(16); ctx.fillText(ico, pos.x + 10, pos.y + 29);
    }
  },

  drawTables(g) {
    const ctx = this.ctx;
    for (const t of g.activeTables()) {
      // chairs
      ctx.fillStyle = '#5b3a1a';
      ctx.beginPath(); ctx.arc(t.x, t.y - 34, 11, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(t.x, t.y + 34, 11, 0, Math.PI * 2); ctx.fill();
      // table
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(t.x, t.y + 6, 26, 14, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8d5a2b'; ctx.beginPath(); ctx.arc(t.x, t.y, 24, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#b5773a'; ctx.beginPath(); ctx.arc(t.x, t.y, 19, 0, Math.PI * 2); ctx.fill();
      if (t.dirty) {
        ctx.fillStyle = '#f5f5f5'; ctx.beginPath(); ctx.arc(t.x - 6, t.y - 3, 7, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(t.x + 7, t.y + 4, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(t.x - 7, t.y - 4, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#d98a3c'; ctx.fillRect(t.x + 2, t.y + 1, 5, 4); ctx.fillRect(t.x - 12, t.y + 6, 4, 3);
        // broom icon bubble
        this.drawBubble(t.x, t.y - 52, () => {
          ctx.fillStyle = '#2b1d14'; ctx.font = this.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🧹', 0, 0);
        }, 34);
        if (t.cleanProg > 0) this.drawProgressRing(t.x, t.y, 30, t.cleanProg, '#2f9e44');
      } else if (t.occupied) {
        this.drawPizza(t.x, t.y, 10);
      }
    }
  },

  drawPads(g) {
    const ctx = this.ctx;
    const pulse = 0.5 + 0.5 * Math.sin(g.time * 3);
    for (const pad of g.visiblePads()) {
      const price = g.padPrice(pad);
      const paid = g.s.padPaid[pad.key] || 0;
      const afford = g.s.cash + paid >= price;
      const { x, y } = pad.pos;
      ctx.fillStyle = afford ? `rgba(242,177,52,${0.35 + 0.2 * pulse})` : 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.ellipse(x, y, CFG.PAD_RADIUS, CFG.PAD_RADIUS * 0.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = afford ? '#e4572e' : '#8a7a6a'; ctx.lineWidth = 3; ctx.setLineDash([8, 6]);
      ctx.beginPath(); ctx.ellipse(x, y, CFG.PAD_RADIUS, CFG.PAD_RADIUS * 0.6, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      if (paid > 0) {
        ctx.strokeStyle = '#2f9e44'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.ellipse(x, y, CFG.PAD_RADIUS, CFG.PAD_RADIUS * 0.6, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (paid / price)); ctx.stroke();
      }
      ctx.font = this.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#2b1d14';
      ctx.fillText(pad.label, x, y - 8);
      ctx.fillStyle = afford ? '#1f6e2e' : '#b8401c';
      ctx.font = this.font(14);
      ctx.fillText(U.money(price - paid), x, y + 9);
    }
  },

  // ---------- entities ----------
  drawEntities(g) {
    const items = [];
    for (const c of g.customers) items.push({ y: c.y, draw: () => this.drawCustomer(c, g) });
    for (const st of g.staff) items.push({ y: st.y, draw: () => this.drawStaff(st, g) });
    for (const c of g.cars) items.push({ y: c.y, draw: () => this.drawCar(c, g) });
    items.push({ y: g.player.y, draw: () => this.drawPlayer(g) });
    items.sort((a, b) => a.y - b.y);
    for (const it of items) it.draw();
  },

  drawPerson(x, y, o) {
    const ctx = this.ctx;
    const bob = o.moving ? Math.sin(o.bob || 0) * 2 : 0;
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(x, y + 4, 13, 6, 0, 0, Math.PI * 2); ctx.fill();
    // legs
    const step = o.moving ? Math.sin((o.bob || 0)) * 4 : 0;
    ctx.fillStyle = o.pants || '#3a3f5c';
    U.roundRect(ctx, x - 9, y - 10 + step, 7, 14, 3); ctx.fill();
    U.roundRect(ctx, x + 2, y - 10 - step, 7, 14, 3); ctx.fill();
    // body
    ctx.fillStyle = o.shirt; U.roundRect(ctx, x - 13, y - 30 + bob, 26, 24, 9); ctx.fill();
    if (o.apron) { ctx.fillStyle = o.apron; U.roundRect(ctx, x - 8, y - 24 + bob, 16, 17, 4); ctx.fill(); }
    // head
    ctx.fillStyle = o.skin; ctx.beginPath(); ctx.arc(x, y - 38 + bob, 10, 0, Math.PI * 2); ctx.fill();
    // hair / hat
    if (o.hat === 'chef') {
      ctx.fillStyle = '#fff'; U.roundRect(ctx, x - 9, y - 54 + bob, 18, 10, 3); ctx.fill();
      ctx.beginPath(); ctx.arc(x - 5, y - 56 + bob, 6, 0, Math.PI * 2); ctx.arc(x + 5, y - 56 + bob, 6, 0, Math.PI * 2); ctx.fill();
    } else if (o.hat === 'cap') {
      ctx.fillStyle = o.capColor || '#2b1d14'; ctx.beginPath(); ctx.arc(x, y - 40 + bob, 10.5, Math.PI, 0); ctx.fill();
      ctx.fillRect(x - 10 + (o.facing < 0 ? -6 : 0), y - 41 + bob, 16, 3);
    } else {
      ctx.fillStyle = o.hair || '#2b1d14'; ctx.beginPath(); ctx.arc(x, y - 40 + bob, 10, Math.PI, 0); ctx.fill();
    }
    // eyes
    ctx.fillStyle = '#2b1d14';
    const f = o.facing || 1;
    if (o.angry) {
      ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + f * 2 - 4, y - 41 + bob); ctx.lineTo(x + f * 2 + 1, y - 38 + bob); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + f * 2 + 6, y - 41 + bob); ctx.lineTo(x + f * 2 + 1, y - 38 + bob); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(x + f * 3 - 3, y - 38 + bob, 1.6, 0, Math.PI * 2); ctx.arc(x + f * 3 + 3, y - 38 + bob, 1.6, 0, Math.PI * 2); ctx.fill();
    }
    // carried pizzas
    if (o.carry > 0) {
      for (let i = 0; i < o.carry; i++) this.drawPizza(x, y - 62 + bob - i * 4, 12);
    }
  },

  drawPlayer(g) {
    const p = g.player;
    this.drawPerson(p.x, p.y, { shirt: '#fff', apron: '#e4572e', skin: '#f1c27d', hat: 'chef', facing: p.facing, moving: p.moving, bob: p.bob, carry: p.carry, pants: '#2d3a4a' });
    // capacity badge
    if (p.carry > 0) this.drawCountBadge(p.x + 18, p.y - 70 - p.carry * 4, p.carry, g.playerCap());
    if (p.cleanTarget) this.drawProgressRing(p.x, p.y - 20, 22, p.cleanTarget.cleanProg, '#2f9e44');
  },

  drawStaff(st, g) {
    st.bob = (st.bob || 0) + (st.moving ? 0.25 : 0);
    const cap = st.role === 'cashier' ? '#2d3a4a' : st.role === 'helper' ? '#b8401c' : '#1f6e2e';
    this.drawPerson(st.x, st.y, { shirt: st.shirt, skin: st.skin, hat: 'cap', capColor: cap, facing: st.facing, moving: st.moving, bob: st.bob, carry: st.carry, apron: st.role === 'helper' ? '#fff' : null });
    if (st.role === 'cleaner' && st.state === 'cleaning') {
      this.drawBubble(st.x, st.y - 72, () => { this.ctx.font = this.font(13); this.ctx.textAlign = 'center'; this.ctx.textBaseline = 'middle'; this.ctx.fillStyle = '#2b1d14'; this.ctx.fillText('🧹', 0, 0); }, 30);
    }
  },

  drawCustomer(c, g) {
    const ctx = this.ctx;
    c.bob = (c.bob || 0) + (c.moving ? 0.25 : 0);
    this.drawPerson(c.x, c.y, { shirt: c.shirt, skin: c.skin, hair: c.hair, facing: c.facing, moving: c.moving, bob: c.bob, carry: c.state === 'eating' ? 0 : c.have, angry: c.angry, pants: '#4a4a4a' });
    const idx = c.inMainQueue ? g.queueIndex(c) : -1;
    const bubbleY = c.y - 66 - c.have * 4;
    if (c.inMainQueue && idx === 0 && c.state === 'queue') {
      const left = c.want - c.have;
      this.drawBubble(c.x, bubbleY, () => {
        this.drawPizza(-10, 0, 8);
        ctx.fillStyle = '#2b1d14'; ctx.font = this.font(13); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText('×' + left, 2, 1);
      }, 46);
      this.drawPatience(c.x, bubbleY - 18, c.patience / CFG.PATIENCE);
    } else if (c.inMainQueue && c.patience < CFG.PATIENCE * 0.35) {
      this.drawPatience(c.x, c.y - 60, c.patience / CFG.PATIENCE);
    } else if (c.state === 'paying') {
      if (g.cashierPresent()) {
        this.drawBubble(c.x, bubbleY, () => {
          ctx.fillStyle = '#2f9e44'; ctx.font = this.font(15); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', 0, 1);
        }, 30);
        this.drawProgressBar(c.x, bubbleY + 16, 40, c.payProg, '#2f9e44');
      } else {
        this.drawBubble(c.x, bubbleY, () => {
          ctx.fillStyle = '#e4572e'; ctx.font = this.font(16); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', 0, 1);
        }, 30, '#ffd6cc');
      }
    } else if (c.state === 'eating') {
      const t = (Math.sin(g.time * 8 + c.id) + 1) / 2;
      this.drawBubble(c.x, c.y - 66, () => { ctx.font = this.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText(t > 0.5 ? '😋' : '🍕', 0, 0); }, 30);
    }
  },

  drawCar(c, g) {
    const ctx = this.ctx;
    const x = c.x, y = c.y;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; U.roundRect(ctx, x - 44, y - 18, 92, 42, 10); ctx.fill();
    // wheels
    ctx.fillStyle = '#1e1e1e';
    for (const wx of [-28, 26]) { U.roundRect(ctx, x + wx - 6, y - 26, 12, 8, 3); ctx.fill(); U.roundRect(ctx, x + wx - 6, y + 18, 12, 8, 3); ctx.fill(); }
    ctx.fillStyle = c.color; U.roundRect(ctx, x - 46, y - 22, 92, 44, 12); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; U.roundRect(ctx, x - 40, y - 18, 80, 10, 5); ctx.fill();
    // windshield + roof
    ctx.fillStyle = '#bfe3ff'; U.roundRect(ctx, x + 10, y - 16, 14, 32, 4); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; U.roundRect(ctx, x - 26, y - 16, 34, 32, 6); ctx.fill();
    ctx.fillStyle = '#bfe3ff'; U.roundRect(ctx, x - 32, y - 16, 8, 32, 3); ctx.fill();
    // lights
    ctx.fillStyle = '#fff6b0'; ctx.fillRect(x + 42, y - 16, 4, 8); ctx.fillRect(x + 42, y + 8, 4, 8);
    ctx.fillStyle = '#ff5252'; ctx.fillRect(x - 46, y - 16, 4, 8); ctx.fillRect(x - 46, y + 8, 4, 8);
    if (c.state === 'waiting') {
      const left = c.want - c.have;
      this.drawBubble(x, y - 40, () => {
        this.drawPizza(-10, 0, 8);
        ctx.fillStyle = '#2b1d14'; ctx.font = this.font(13); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText('×' + left, 2, 1);
      }, 46);
      if (c.patience < CFG.CAR_PATIENCE * 0.5) this.drawPatience(x, y - 58, c.patience / CFG.CAR_PATIENCE);
    }
  },

  // ---------- primitives ----------
  drawPizza(x, y, r) {
    const ctx = this.ctx;
    ctx.fillStyle = '#d98a3c'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f6c453'; ctx.beginPath(); ctx.arc(x, y, r * 0.78, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c0392b';
    const pr = Math.max(1.5, r * 0.2);
    ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.2, pr, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.3, y - r * 0.35, pr, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.1, y + r * 0.35, pr, 0, Math.PI * 2); ctx.fill();
  },
  drawPizzaStack(x, y, n) {
    for (let i = 0; i < Math.min(n, 30); i++) {
      this.ctx.fillStyle = '#b86f2d'; this.ctx.beginPath(); this.ctx.arc(x, y - i * 4 + 2, 14, 0, Math.PI * 2); this.ctx.fill();
      this.drawPizza(x, y - i * 4, 14);
    }
  },
  drawCountBadge(x, y, n, cap) {
    const ctx = this.ctx;
    const full = n >= cap;
    ctx.fillStyle = full ? '#e4572e' : '#2b1d14';
    U.roundRect(ctx, x - 16, y - 9, 32, 18, 9); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = this.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`${n}/${cap}`, x, y + 1);
  },
  drawCashPile(x, y, amount) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.beginPath(); ctx.ellipse(x, y + 6, 30, 14, 0, 0, Math.PI * 2); ctx.fill();
    if (amount <= 0) return;
    const n = Math.min(14, Math.ceil(amount / 12));
    for (let i = 0; i < n; i++) {
      const col = i % 3, row = Math.floor(i / 3);
      const bx = x - 22 + col * 18 + (row % 2) * 4, by = y - row * 5;
      ctx.fillStyle = '#2f9e44'; U.roundRect(ctx, bx - 2, by + 2, 22, 11, 2); ctx.fill();
      ctx.fillStyle = '#4caf50'; U.roundRect(ctx, bx - 2, by, 22, 11, 2); ctx.fill();
      ctx.fillStyle = '#a5d6a7'; ctx.beginPath(); ctx.arc(bx + 9, by + 5.5, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#1f6e2e'; U.roundRect(ctx, x - 26, y - 34 - Math.floor(n / 3) * 5, 52, 18, 9); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = this.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(U.money(amount), x, y - 25 - Math.floor(n / 3) * 5);
  },
  drawBubble(x, y, inner, w = 40, bg = '#fff') {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = bg; ctx.strokeStyle = 'rgba(43,29,20,0.35)'; ctx.lineWidth = 1.5;
    U.roundRect(ctx, -w / 2, -13, w, 26, 8); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-5, 12); ctx.lineTo(0, 18); ctx.lineTo(5, 12); ctx.closePath(); ctx.fill();
    inner();
    ctx.restore();
  },
  drawPatience(x, y, frac) {
    const ctx = this.ctx;
    const col = frac > 0.5 ? '#2f9e44' : frac > 0.25 ? '#f2b134' : '#e4572e';
    this.drawProgressBar(x, y, 36, frac, col);
  },
  drawProgressBar(x, y, w, frac, col) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; U.roundRect(ctx, x - w / 2, y - 3, w, 6, 3); ctx.fill();
    ctx.fillStyle = col; U.roundRect(ctx, x - w / 2, y - 3, w * U.clamp(frac, 0, 1), 6, 3); ctx.fill();
  },
  drawProgressRing(x, y, r, frac, col) {
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = col; ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * U.clamp(frac, 0, 1)); ctx.stroke();
  },

  // ---------- effects ----------
  drawFx(g) {
    const ctx = this.ctx;
    for (const f of g.fx) {
      if (f.t < 0) continue;
      const k = U.clamp(f.t / f.dur, 0, 1);
      if (f.kind === 'sparkle') {
        ctx.strokeStyle = `rgba(255,255,255,${1 - k})`; ctx.lineWidth = 3;
        for (let i = 0; i < 4; i++) {
          const a = (i * Math.PI) / 2 + k * 2;
          const r1 = 8 + k * 26, r2 = r1 + 8;
          ctx.beginPath(); ctx.moveTo(f.x0 + Math.cos(a) * r1, f.y0 + Math.sin(a) * r1); ctx.lineTo(f.x0 + Math.cos(a) * r2, f.y0 + Math.sin(a) * r2); ctx.stroke();
        }
        continue;
      }
      const x1 = f.follow ? g.player.x : f.x1, y1 = f.follow ? g.player.y - 10 : f.y1;
      const e = U.easeOut(k);
      const x = U.lerp(f.x0, x1, e), y = U.lerp(f.y0, y1, e) - Math.sin(k * Math.PI) * 26;
      if (f.kind === 'pizza') this.drawPizza(x, y, 12);
      else if (f.kind === 'bill' || f.kind === 'cash') {
        ctx.save(); ctx.translate(x, y); ctx.rotate(k * 3);
        ctx.fillStyle = '#4caf50'; U.roundRect(ctx, -11, -6, 22, 12, 2); ctx.fill();
        ctx.fillStyle = '#a5d6a7'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }
  },
  drawFloats(g) {
    const ctx = this.ctx;
    for (const f of g.floats) {
      const a = 1 - U.clamp((f.t - f.dur * 0.6) / (f.dur * 0.4), 0, 1);
      ctx.globalAlpha = a;
      ctx.font = this.font(f.big ? 18 : 13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(43,29,20,0.85)'; ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    }
  },
  drawHint(g) {
    const h = g.hint;
    if (!h || !h.target) return;
    const ctx = this.ctx;
    const p = g.player, t = h.target;
    const d = U.dist(p.x, p.y, t.x, t.y);
    if (d < 70) return;
    const ang = Math.atan2(t.y - p.y, t.x - p.x);
    const bounce = Math.sin(g.time * 6) * 4;
    const ox = p.x + Math.cos(ang) * (40 + bounce), oy = p.y - 20 + Math.sin(ang) * (40 + bounce);
    ctx.save(); ctx.translate(ox, oy); ctx.rotate(ang);
    ctx.fillStyle = '#f2b134'; ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-6, -10); ctx.lineTo(-2, 0); ctx.lineTo(-6, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    // target ring
    ctx.strokeStyle = `rgba(242,177,52,${0.6 + 0.4 * Math.sin(g.time * 6)})`; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(t.x, t.y + 4, 34 + bounce, 18 + bounce / 2, 0, 0, Math.PI * 2); ctx.stroke();
  },
  drawJoystick() {
    const j = Input.joy;
    if (!j.active) return;
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); // screen space (CSS px)
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(j.ox, j.oy, Input.JOY_RADIUS, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    const dx = j.x - j.ox, dy = j.y - j.oy, d = Math.hypot(dx, dy), m = Math.min(d, Input.JOY_RADIUS);
    const kx = d ? j.ox + (dx / d) * m : j.ox, ky = d ? j.oy + (dy / d) * m : j.oy;
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(kx, ky, 22, 0, Math.PI * 2); ctx.fill();
  },
};
