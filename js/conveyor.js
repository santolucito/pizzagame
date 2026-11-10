'use strict';
// The Pizza Conveyor: a moving belt that carries freshly baked pizzas from the oven pile, through the kitchen, out
// through the pizzeria's south wall to a loading dock on the grass, where the delivery bikes (js/bikefleet.js) pick
// them up. Extension module, see js/EXTENSIONS.md.
//
// - Buy it on the '🛤️ Pizza Conveyor' pad in the kitchen (below the oven pile). Before that a faint dashed outline
//   shows where the belt will go.
// - Once owned, the belt takes one pizza from the oven pile (g.s.piles.oven) every few seconds, but only while the
//   dock table plus the pizzas already riding the belt are fewer than DOCK_CAP. The pizzas ride along the belt:
//   down past the oven pile, east along the bottom of the kitchen below the Carry More pad, south down the dining room's west side (through the first X-ray arch),
//   out through a flap in the south wall, then west along the grass (through the second X-ray arch) to the dock.
// - The X-ray arches: grey tunnels with a glowing screen. When a pizza rides through, the arch flashes green, the
//   screen shows the pizza's x-ray (a blue outline with pepperoni circles), it beeps and a "✓" pops up.
// - The control panel at the belt's start: '⚡ Turbo belt!' makes everything run three times as fast for a while.
// - Shared interface for the bike fleet: CFG.CONVEYOR.DOCK (where a bike stops to load), CFG.CONVEYOR.DOCK_CAP,
//   ConveyorExt.owned(g), ConveyorExt.dockCount(g), ConveyorExt.takeFromDock(g, n).
// - Saved in g.s.conveyor: { owned, dock, belt: [{ d, k }], scans }.

CFG.CONVEYOR = {
  PRICE: 300,
  PAD: { x: 182, y: 430 },                // the unlock pad: kitchen floor below the oven pile, between the oven pad and Carry More
  // the belt's centre line (axis-aligned pieces): from the oven pile east under the kitchen, south down the dining
  // room's west side and out through the south wall, then west along the grass to the dock table
  PATH: [{ x: 226, y: 350 }, { x: 226, y: 452 }, { x: 390, y: 452 }, { x: 390, y: 708 }, { x: 268, y: 708 }],   // clear of every kitchen pad, its icon and its label
  HALF: 12,                               // half the belt's width
  ARCHES: [
    { x: 390, y: 520, dir: 'v' },         // inside: over the belt going down the dining room's west side
    { x: 324, y: 708, dir: 'h' },         // outside: over the belt on the grass
  ],
  ARCH: { w: 52, d: 22, h: 44 },          // the X-ray box: width across, depth, height
  DOCK_TABLE: { x: 222, y: 708, w: 88, h: 40 },
  DOCK: { x: 220, y: 760 },               // the spot on the grass where a delivery bike stops to load (south of the dock table)
  DOCK_CAP: 8,
  CONTROL: { x: 356, y: 410 },            // stand here (by the control panel where the belt turns south) for Turbo
  PANEL: { x: 356, y: 426 },              // the control panel on the belt's north edge (top-centre of its 28 x 14 box)
  REACH: 34,
  SPEED: 70,                              // px/s along the belt
  FEED: 2.6,                              // seconds between pizzas taken from the oven pile
  GAP: 34,                                // the closest two pizzas ride on the belt
  TURBO: { mult: 3, time: 6 },
  FLASH: 0.9,                             // seconds an arch glows after a scan
};

const ConveyorExt = {
  name: 'conveyor',
  defaults: { conveyor: { owned: false, dock: 0, belt: [], scans: 0 } },
  st: null,

  // ======================= shared interface (js/bikefleet.js) =======================
  owned(g) { return !!(g && g.s && g.s.conveyor && g.s.conveyor.owned); },
  dockCount(g) { return this.owned(g) ? this.save(g).dock : 0; },
  takeFromDock(g, n) {
    if (!this.owned(g)) return 0;
    const s = this.save(g), k = Math.max(0, Math.min(s.dock, Math.floor(n || 0)));
    s.dock -= k;
    return k;
  },

  // ======================= state =======================
  save(g) {
    if (!g.s.conveyor) g.s.conveyor = { owned: false, dock: 0, belt: [], scans: 0 };
    const s = g.s.conveyor;
    if (!Array.isArray(s.belt)) s.belt = [];
    if (typeof s.dock !== 'number' || !(s.dock >= 0)) s.dock = 0;
    if (typeof s.scans !== 'number') s.scans = 0;
    return s;
  },
  build(g) {
    this.save(g);
    const C = CFG.CONVEYOR;
    // the path's pieces with their running distance, and each arch's distance along the path
    let d = 0; const segs = [];
    for (let i = 0; i + 1 < C.PATH.length; i++) {
      const a = C.PATH[i], b = C.PATH[i + 1], len = Math.hypot(b.x - a.x, b.y - a.y);
      segs.push({ a, b, d0: d, len }); d += len;
    }
    this.segs = segs; this.len = d;
    this.st = {
      feedT: 1, turbo: 0, phase: 0, panel: 0,
      arches: C.ARCHES.map((A) => ({ x: A.x, y: A.y, dir: A.dir, d: this.distAt(A.x, A.y), flash: 0, scans: 0, k: 0 })),
    };
  },
  ready(g) { if (!this.st || !this.segs) this.build(g); return this.st; },
  // distance along the path of the point on it nearest (x, y)
  distAt(x, y) {
    let best = 0, bd = Infinity;
    for (const s of this.segs) {
      const dx = s.b.x - s.a.x, dy = s.b.y - s.a.y, t = U.clamp(((x - s.a.x) * dx + (y - s.a.y) * dy) / (s.len * s.len), 0, 1);
      const px = s.a.x + dx * t, py = s.a.y + dy * t, e = Math.hypot(px - x, py - y);
      if (e < bd) { bd = e; best = s.d0 + s.len * t; }
    }
    return best;
  },
  posAt(d) {
    for (const s of this.segs) if (d <= s.d0 + s.len) { const t = U.clamp((d - s.d0) / s.len, 0, 1); return { x: s.a.x + (s.b.x - s.a.x) * t, y: s.a.y + (s.b.y - s.a.y) * t }; }
    const L = this.segs[this.segs.length - 1].b; return { x: L.x, y: L.y };
  },
  speed() { return CFG.CONVEYOR.SPEED * (this.st && this.st.turbo > 0 ? CFG.CONVEYOR.TURBO.mult : 1); },
  onFoot(g) { return !g.driving && !g.onTrain && !g.ride && !g.travel && !g.fishing; },
  near(g, pos, r) { const p = g.player; return g.area === 'town' && U.dist(p.x, p.y, pos.x, pos.y) < r; },
  // arch state for tests and the screen: { scans, flash }
  archState(i) { const a = this.st && this.st.arches[i]; return a ? { scans: a.scans, flash: a.flash, d: a.d } : null; },

  // ======================= game hooks =======================
  update(g, dt) {
    const st = this.ready(g), s = this.save(g), C = CFG.CONVEYOR;
    for (const a of st.arches) a.flash = Math.max(0, a.flash - dt);
    st.panel = Math.max(0, st.panel - dt);
    if (!s.owned) return;
    st.turbo = Math.max(0, st.turbo - dt);
    const v = this.speed();
    st.phase = (st.phase + v * dt) % 1000;
    // take a pizza from the oven pile now and then, while there is room for it on the dock
    st.feedT -= dt * (st.turbo > 0 ? C.TURBO.mult : 1);
    if (st.feedT <= 0) {
      st.feedT = 0;
      if (this.canFeed(g)) { this.feed(g); st.feedT = C.FEED; }
    }
    // move the pizzas, the front one first; they bunch up at the end only if the dock is somehow full
    const belt = s.belt; belt.sort((a, b) => b.d - a.d);
    let limit = this.len;
    for (let i = 0; i < belt.length; i++) {
      const it = belt[i], d0 = it.d;
      it.d = Math.min(it.d + v * dt, limit);
      for (let k = 0; k < st.arches.length; k++) {
        const a = st.arches[k];
        if (d0 < a.d && it.d >= a.d) this.scan(g, a, it, k);
      }
      if (it.d >= this.len - 0.01 && s.dock < C.DOCK_CAP) { it.done = true; this.arrive(g); continue; }
      limit = it.d - C.GAP;
    }
    s.belt = belt.filter((it) => !it.done);
  },
  canFeed(g) {
    const s = this.save(g), C = CFG.CONVEYOR;
    if (g.s.piles.oven <= 0) return false;
    if (s.dock + s.belt.length >= C.DOCK_CAP) return false;
    const last = s.belt.reduce((m, it) => Math.min(m, it.d), Infinity);
    return last >= C.GAP;
  },
  feed(g) {
    const s = this.save(g), P = CFG.OVEN_PILE, A = CFG.CONVEYOR.PATH[0];
    g.s.piles.oven--;
    s.belt.push({ d: 0, k: (s.scans + s.belt.length + s.dock) % 4 });
    g.fx.push({ kind: 'pizza', x0: P.x, y0: P.y - 10, x1: A.x, y1: A.y - 6, t: 0, dur: 0.25 });
  },
  scan(g, a, it, k) {
    a.flash = CFG.CONVEYOR.FLASH; a.scans++; a.k = it.k; it.scanned = (it.scanned || 0) | (1 << k);
    this.save(g).scans++;
    if (g.area === 'town') {
      g.floats.push({ x: a.x + 30, y: a.y - 60, text: '✓', color: '#7ee081', t: 0, dur: 0.9, big: true });
      g.fx.push({ kind: 'sparkle', x0: a.x, y0: a.y - 30, x1: a.x, y1: a.y - 30, t: 0, dur: 0.5 });
      if (U.dist(g.player.x, g.player.y, a.x, a.y) < 420 && Sfx.throttle('conveyorBeep', 350)) {
        Sfx.tone(1568, 0.07, 'square', 0.02); setTimeout(() => Sfx.tone(2093, 0.1, 'square', 0.02), 90);
      }
    }
  },
  arrive(g) {
    const s = this.save(g), T = CFG.CONVEYOR.DOCK_TABLE;
    s.dock++;
    if (g.area === 'town') g.fx.push({ kind: 'sparkle', x0: T.x, y0: T.y - 20, x1: T.x, y1: T.y - 20, t: 0, dur: 0.5 });
  },
  turbo(g) {
    const st = this.ready(g), C = CFG.CONVEYOR, p = g.player;
    st.turbo = C.TURBO.time; st.panel = 0.6; st.feedT = Math.min(st.feedT, 0.2);
    g.floats.push({ x: p.x, y: p.y - 70, text: 'Whoosh! ⚡', color: '#ffe08a', t: 0, dur: 1.3, big: true });
    for (let i = 0; i < 5; i++) g.fx.push({ kind: 'sparkle', x0: C.PATH[0].x + U.rand(-10, 60), y0: C.PATH[0].y + U.rand(-14, 6), x1: 0, y1: 0, t: -i * 0.06, dur: 0.5 });
    Sfx.tone(440, 0.25, 'sawtooth', 0.03, 600);
    Haptics.tap();
  },

  obstacles(g) {
    if (g.area !== 'town' || !this.owned(g)) return [];
    const C = CFG.CONVEYOR, H = C.HALF, P = C.PATH, o = [];
    for (let i = 0; i + 1 < P.length; i++) {
      const a = P[i], b = P[i + 1];
      const x0 = Math.min(a.x, b.x) - H, x1 = Math.max(a.x, b.x) + H, y0 = Math.min(a.y, b.y) - H, y1 = Math.max(a.y, b.y) + H;
      o.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
    }
    o.push({ x: C.PANEL.x - 14, y: C.PANEL.y, w: 28, h: 14 });   // the control panel
    const T = C.DOCK_TABLE; o.push({ x: T.x - T.w / 2, y: T.y - T.h / 2, w: T.w, h: T.h });
    for (const A of C.ARCHES) o.push({ x: A.x - C.ARCH.w / 2, y: A.y - C.ARCH.d / 2, w: C.ARCH.w, h: C.ARCH.d });
    return o;
  },
  pads(g) {
    if (g.area !== 'town' || this.owned(g)) return [];
    return [{ key: 'conveyor', label: 'Pizza Conveyor', ico: '🛤️', pos: CFG.CONVEYOR.PAD, price: CFG.CONVEYOR.PRICE, sub: 'to the bikes' }];
  },
  onPad(g, pad) {
    if (pad.key !== 'conveyor') return;
    const s = this.save(g); s.owned = true;
    const st = this.ready(g); st.feedT = 0.5;
    const p = g.player, C = CFG.CONVEYOR;
    g.toast('🛤️ Pizza Conveyor! Pizzas ride to the bikes', true);
    for (let i = 0; i < 10; i++) { const q = this.posAt(this.len * i / 9); g.fx.push({ kind: 'sparkle', x0: q.x, y0: q.y, x1: q.x, y1: q.y, t: -i * 0.05, dur: 0.5 }); }
    // the belt is solid now: step the chef off it onto the control spot
    if (g.obstacles().some((o) => g.hitRect(p.x, p.y, 12, o))) { p.x = C.CONTROL.x; p.y = C.CONTROL.y; }
    Sfx.unlock(); Haptics.success();
  },
  action(g) {
    if (!this.owned(g) || !this.onFoot(g) || !this.near(g, CFG.CONVEYOR.CONTROL, CFG.CONVEYOR.REACH)) return null;
    if (this.ready(g).turbo > 0) return null;
    return { label: '⚡ Turbo belt!', run: (gg) => this.turbo(gg) };
  },
  hint(g) {
    if (g.area !== 'town' || !this.owned(g) || !this.onFoot(g)) return undefined;
    const C = CFG.CONVEYOR, p = g.player;
    const dc = U.dist(p.x, p.y, C.CONTROL.x, C.CONTROL.y);
    if (dc < 60) return { text: this.ready(g).turbo > 0 ? 'Zoom! Turbo belt ⚡' : 'Press for a turbo belt! ⚡', target: dc < C.REACH ? null : C.CONTROL };
    const T = C.DOCK_TABLE, dd = U.dist(p.x, p.y, T.x, T.y);
    let da = Infinity; for (const A of C.ARCHES) da = Math.min(da, U.dist(p.x, p.y, A.x, A.y + 30));
    if (dd < 80 && dd <= da) return { text: this.save(g).dock > 0 ? 'Pizzas wait here for the delivery bikes 🛵' : 'The pizza dock: pizzas ride out here 🍕', target: null };
    if (da < 54) return { text: 'X-ray scanner! Every pizza gets checked ✓', target: null };
    return undefined;
  },
  home(g) { if (this.st) this.st.turbo = 0; },

  // ======================= drawing =======================
  dynamic(r, g) {
    if (g.area !== 'town') return;
    this.ready(g);
    if (!this.owned(g)) { this.drawOutline(r, g); return; }
    this.drawBelt(r, g);
    this.drawDock(r, g);
    const s = this.save(g);
    for (const it of s.belt) { const q = this.posAt(it.d); this.drawItem(r, g, q.x, q.y, it); }
  },
  entities(r, g, items) {
    if (g.area !== 'town' || !this.owned(g)) return;
    const st = this.ready(g), C = CFG.CONVEYOR;
    st.arches.forEach((a, i) => items.push({ y: a.y + C.ARCH.d / 2, draw: () => this.drawArch(r, g, a, i) }));
  },

  // a faint dashed outline of the belt before it is bought
  drawOutline(r, g) {
    const ctx = r.ctx, C = CFG.CONVEYOR, P = C.PATH, p = g.player;
    if (U.dist(p.x, p.y, 300, 450) > 420) return;
    ctx.save();
    ctx.strokeStyle = 'rgba(70,80,95,0.28)'; ctx.lineWidth = C.HALF * 2; ctx.lineJoin = 'round'; ctx.setLineDash([14, 10]);
    ctx.beginPath(); ctx.moveTo(P[0].x, P[0].y); for (let i = 1; i < P.length; i++) ctx.lineTo(P[i].x, P[i].y); ctx.stroke();
    ctx.restore();
  },

  drawBelt(r, g) {
    const ctx = r.ctx, C = CFG.CONVEYOR, H = C.HALF, P = C.PATH, st = this.st;
    // legs/skirt shadow first, then each piece's rubber and rails
    for (let i = 0; i + 1 < P.length; i++) {
      const a = P[i], b = P[i + 1];
      const x0 = Math.min(a.x, b.x) - H, x1 = Math.max(a.x, b.x) + H, y0 = Math.min(a.y, b.y) - H, y1 = Math.max(a.y, b.y) + H;
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x0 + 3, y0 + 5, x1 - x0, y1 - y0 + 4);
      ctx.fillStyle = '#5d636b'; ctx.fillRect(x0, y0 + 2, x1 - x0, y1 - y0 + 6);   // the frame's front skirt
      ctx.fillStyle = '#4a4f56';
      if (a.y === b.y) for (let x = x0 + 8; x < x1 - 4; x += 36) ctx.fillRect(x, y1 + 4, 5, 4);   // little feet
    }
    for (let i = 0; i + 1 < P.length; i++) {
      const a = P[i], b = P[i + 1], horiz = a.y === b.y;
      const x0 = Math.min(a.x, b.x) - H, x1 = Math.max(a.x, b.x) + H, y0 = Math.min(a.y, b.y) - H, y1 = Math.max(a.y, b.y) + H;
      // rubber
      ctx.fillStyle = '#3a3f46'; ctx.fillRect(x0 + 2, y0 + 2, x1 - x0 - 4, y1 - y0 - 4);
      // moving tread lines, in the direction of travel
      ctx.save(); ctx.beginPath(); ctx.rect(x0 + 2, y0 + 2, x1 - x0 - 4, y1 - y0 - 4); ctx.clip();
      ctx.fillStyle = 'rgba(255,255,255,0.13)';
      const step = 12, sign = horiz ? Math.sign(b.x - a.x) : Math.sign(b.y - a.y), off = ((st.phase * sign) % step + step) % step;
      if (horiz) for (let x = x0 - step + off; x < x1 + step; x += step) ctx.fillRect(x, y0 + 3, 3, y1 - y0 - 6);
      else for (let y = y0 - step + off; y < y1 + step; y += step) ctx.fillRect(x0 + 3, y, x1 - x0 - 6, 3);
      ctx.restore();
      // shiny side rails
      ctx.fillStyle = '#b9c0c8';
      if (horiz) { ctx.fillRect(x0, y0, x1 - x0, 3); ctx.fillRect(x0, y1 - 3, x1 - x0, 3); }
      else { ctx.fillRect(x0, y0, 3, y1 - y0); ctx.fillRect(x1 - 3, y0, 3, y1 - y0); }
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      if (horiz) ctx.fillRect(x0, y0, x1 - x0, 1); else { ctx.fillRect(x0, y0, 1, y1 - y0); ctx.fillRect(x1 - 3, y0, 1, y1 - y0); }
    }
    // rollers at the corners and the ends
    for (let i = 0; i < P.length; i++) {
      const q = P[i];
      ctx.fillStyle = '#7d848d'; U.roundRect(ctx, q.x - H - 1, q.y - H - 1, H * 2 + 2, H * 2 + 2, 5); ctx.fill();
      ctx.fillStyle = '#a9b0b8'; ctx.beginPath(); ctx.arc(q.x, q.y, H - 3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#5d636b'; ctx.lineWidth = 2;
      const ang = st.phase / (H - 3);
      ctx.beginPath(); ctx.moveTo(q.x + Math.cos(ang) * (H - 4), q.y + Math.sin(ang) * (H - 4)); ctx.lineTo(q.x - Math.cos(ang) * (H - 4), q.y - Math.sin(ang) * (H - 4)); ctx.stroke();
      ctx.fillStyle = '#5d636b'; ctx.beginPath(); ctx.arc(q.x, q.y, 2.5, 0, Math.PI * 2); ctx.fill();
    }
    // the chute from the oven pile tray down onto the belt's start
    const OP = CFG.OVEN_PILE, A = P[0];
    ctx.fillStyle = '#8c939b';
    ctx.beginPath(); ctx.moveTo(OP.x + 14, OP.y + 12); ctx.lineTo(OP.x + 30, OP.y + 8); ctx.lineTo(A.x + 8, A.y - H); ctx.lineTo(A.x - 10, A.y - H); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.moveTo(OP.x + 18, OP.y + 12); ctx.lineTo(OP.x + 26, OP.y + 10); ctx.lineTo(A.x + 2, A.y - H); ctx.lineTo(A.x - 4, A.y - H); ctx.closePath(); ctx.fill();
    // the control panel under the belt's start: a big turbo button and blinking lights
    this.drawPanel(r, g, C.PANEL.x, C.PANEL.y);
    // where the belt goes through the south wall: a hatch with rubber flaps
    const B = CFG.BUILDING, x = P[P.length - 2].x;
    ctx.fillStyle = '#2b2f35'; ctx.fillRect(x - H - 4, B.y1 - 10, H * 2 + 8, 16);
    ctx.fillStyle = '#7a5235'; ctx.fillRect(x - H - 6, B.y1 - 12, H * 2 + 12, 4);
    for (let k = 0; k < 5; k++) {
      const sway = Math.sin(g.time * 6 + k) * (st.turbo > 0 ? 2 : 1);
      ctx.fillStyle = k % 2 ? 'rgba(60,64,70,0.9)' : 'rgba(242,177,52,0.85)';
      ctx.fillRect(x - H + k * 5 + sway * 0.4, B.y1 - 8, 4, 12);
    }
    // little "to the bikes" arrows painted on the grass beside the outside belt
    const L = P[P.length - 1];
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let k = 0; k < 2; k++) { const ax = P[P.length - 2].x - 40 - k * 50 - ((st.phase * 0.3) % 10); ctx.fillText('◀', ax, L.y + H + 12); }
    // sparkles while turbo is on
    if (st.turbo > 0) {
      for (let k = 0; k < 6; k++) {
        const q = this.posAt(((g.time * 160 + k * this.len / 6) % this.len));
        ctx.fillStyle = `rgba(255,230,120,${0.5 + 0.5 * Math.sin(g.time * 12 + k)})`;
        ctx.beginPath(); ctx.arc(q.x + Math.sin(k * 3) * 8, q.y - 10 + Math.cos(k * 5) * 5, 2.5, 0, Math.PI * 2); ctx.fill();
      }
    }
  },
  drawPanel(r, g, x, y) {
    const ctx = r.ctx, st = this.st, on = st.turbo > 0;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; U.roundRect(ctx, x - 13, y + 2, 28, 14, 3); ctx.fill();
    ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, x - 14, y, 28, 14, 3); ctx.fill();
    ctx.fillStyle = '#41505f'; U.roundRect(ctx, x - 14, y, 28, 4, 2); ctx.fill();
    const press = st.panel > 0 ? 1.5 : 0;
    ctx.fillStyle = '#8a1f12'; ctx.beginPath(); ctx.arc(x - 4, y + 8 + press * 0.5, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = on ? '#ffd23f' : '#e4572e'; ctx.beginPath(); ctx.arc(x - 4, y + 7 + press, 4, 0, Math.PI * 2); ctx.fill();
    for (let k = 0; k < 2; k++) {
      const lit = on ? Math.sin(g.time * 14 + k * 3) > 0 : Math.sin(g.time * 3 + k * 2) > 0.3;
      ctx.fillStyle = lit ? (k ? '#7ee081' : '#ffd23f') : '#3d4a55';
      ctx.beginPath(); ctx.arc(x + 6, y + 4 + k * 5, 2, 0, Math.PI * 2); ctx.fill();
    }
  },
  drawDock(r, g) {
    const ctx = r.ctx, C = CFG.CONVEYOR, T = C.DOCK_TABLE, n = this.save(g).dock;
    const x0 = T.x - T.w / 2, y0 = T.y - T.h / 2;
    // the bike's loading spot: a painted bay on the grass
    const D = C.DOCK;
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; U.roundRect(ctx, D.x - 30, D.y - 12, 60, 28, 6); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]); U.roundRect(ctx, D.x - 30, D.y - 12, 60, 28, 6); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(43,29,20,0.55)'; ctx.font = r.font(14); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🛵', D.x, D.y + 3);
    // the table: steel legs, a wooden top, a striped edge
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; U.roundRect(ctx, x0 + 3, y0 + 6, T.w, T.h, 6); ctx.fill();
    ctx.fillStyle = '#5d636b'; ctx.fillRect(x0 + 6, y0 + T.h - 6, 6, 10); ctx.fillRect(x0 + T.w - 12, y0 + T.h - 6, 6, 10);
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, x0, y0 + 6, T.w, T.h - 4, 6); ctx.fill();
    ctx.fillStyle = '#c99a5f'; U.roundRect(ctx, x0, y0, T.w, T.h - 8, 6); ctx.fill();
    for (let k = 0; k < 8; k++) { ctx.fillStyle = k % 2 ? '#fff' : '#e4572e'; ctx.fillRect(x0 + 4 + k * 10, y0 + T.h - 8, 10, 4); }
    // the pizza boxes waiting, in two stacks
    for (let i = 0; i < n; i++) {
      const col = i % 2, row = Math.floor(i / 2), bx = T.x - 24 + col * 30, by = T.y - 4 - row * 7;
      ctx.fillStyle = '#d7c2a0'; U.roundRect(ctx, bx - 13, by - 3, 26, 9, 2); ctx.fill();
      ctx.fillStyle = '#f5ead6'; U.roundRect(ctx, bx - 13, by - 5, 26, 6, 2); ctx.fill();
      ctx.fillStyle = '#e4572e'; ctx.fillRect(bx - 4, by - 4, 8, 3);
    }
    // the sign
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, T.x - 34, y0 - 18, 68, 14, 4); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('PIZZA DOCK', T.x, y0 - 11);   // above the table, so a loading bike never hides it
    r.drawCountBadge(x0 - 16, T.y - 4, n, C.DOCK_CAP);
  },
  drawItem(r, g, x, y, it) {
    const ctx = r.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(x + 1, y + 3, 10, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b86f2d'; ctx.beginPath(); ctx.arc(x, y + 1, 10, 0, Math.PI * 2); ctx.fill();
    r.drawPizza(x, y - 1, 10);
    if (it.k === 1) { ctx.fillStyle = '#7a4a2a'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(x - 4 + k * 4, y + 2 - (k % 2) * 5, 1.6, 0, Math.PI * 2); ctx.fill(); } }   // mushrooms
    if (it.k === 2) { ctx.fillStyle = '#3f9a4a'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(x + 4 - k * 4, y - 4 + k * 3, 2, 1.2, k, 0, Math.PI * 2); ctx.fill(); } }   // basil
  },
  // an X-ray arch: a grey tunnel box over the belt, a glowing screen on its front, a light on top
  drawArch(r, g, a, i) {
    const ctx = r.ctx, C = CFG.CONVEYOR, A = C.ARCH, H = C.HALF, f = a.flash / C.FLASH;
    const x0 = a.x - A.w / 2, back = a.y - A.d / 2, front = a.y + A.d / 2, top = front - A.h;
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(a.x + 3, front + 2, A.w / 2 + 4, 6, 0, 0, Math.PI * 2); ctx.fill();
    // glow while scanning
    if (f > 0) {
      ctx.fillStyle = `rgba(126,224,129,${0.35 * f})`;
      U.roundRect(ctx, x0 - 6, back - A.h - 6, A.w + 12, front - back + A.h + 12, 12); ctx.fill();
    }
    // top face
    ctx.fillStyle = '#d3d8de'; U.roundRect(ctx, x0, back - A.h, A.w, A.d, 8); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(x0 + 6, back - A.h + 3, A.w - 12, 2);
    // front face, arched on top
    const grd = ctx.createLinearGradient(0, top, 0, front);
    grd.addColorStop(0, '#a9b0b8'); grd.addColorStop(1, '#868d96');
    ctx.fillStyle = grd; U.roundRect(ctx, x0, top, A.w, A.h, 8); ctx.fill();
    ctx.strokeStyle = f > 0 ? `rgba(60,200,90,${0.6 + 0.4 * f})` : 'rgba(60,66,74,0.6)'; ctx.lineWidth = f > 0 ? 3 : 1.5;
    U.roundRect(ctx, x0, back - A.h, A.w, front - back + A.h, 8); ctx.stroke();
    // the tunnel: an arched opening at the bottom (belt coming toward us), or dark mouths at both ends (belt going across)
    const curtains = (cx, w, y1, hgt) => {
      const n = Math.round(w / 5);
      for (let k = 0; k < n; k++) {
        const sway = Math.sin(g.time * 5 + k * 1.3) * (0.5 + 2.5 * f);
        ctx.fillStyle = k % 2 ? 'rgba(52,56,62,0.92)' : 'rgba(240,170,60,0.9)';
        ctx.fillRect(cx - w / 2 + k * 5 + sway * 0.3, y1, 4, hgt);
      }
    };
    if (a.dir === 'v') {
      const ow = H * 2 + 6, oh = 22, oy = front - oh;
      ctx.fillStyle = '#1d2228';
      ctx.beginPath(); ctx.moveTo(a.x - ow / 2, front); ctx.lineTo(a.x - ow / 2, oy + ow / 2); ctx.arc(a.x, oy + ow / 2, ow / 2, Math.PI, 0); ctx.lineTo(a.x + ow / 2, front); ctx.closePath(); ctx.fill();
      ctx.save(); ctx.clip(); curtains(a.x, ow, oy, oh * 0.7); ctx.restore();
    } else {
      for (const sx of [x0 + 2, x0 + A.w - 9]) {
        ctx.fillStyle = '#1d2228'; U.roundRect(ctx, sx, front - 20, 7, 20, 3); ctx.fill();
        ctx.fillStyle = 'rgba(240,170,60,0.9)'; ctx.fillRect(sx + 1, front - 18, 2, 12); ctx.fillStyle = 'rgba(52,56,62,0.92)'; ctx.fillRect(sx + 4, front - 18, 2, 12);
      }
      ctx.fillStyle = '#5d636b'; ctx.fillRect(x0 + 12, front - 6, A.w - 24, 4);   // the belt peeks out under the box
    }
    // the screen
    const sw = 34, sh = 18, sx = a.x - sw / 2, sy = top + 4;
    ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, sx - 3, sy - 2, sw + 6, sh + 4, 4); ctx.fill();
    ctx.fillStyle = f > 0 ? '#0e2a52' : '#0b1a30'; ctx.fillRect(sx, sy, sw, sh);
    ctx.save(); ctx.beginPath(); ctx.rect(sx, sy, sw, sh); ctx.clip();
    if (f > 0) {
      // the x-ray: a ghostly blue pizza with its pepperoni circles and slice lines, and a green tick
      const px = a.x - 4, py = sy + sh / 2, pr = 7.5;
      ctx.fillStyle = 'rgba(120,200,255,0.25)'; ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#9fe6ff'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(159,230,255,0.55)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(px, py, pr - 2, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); for (let k = 0; k < 3; k++) { const an = k * Math.PI / 3 + 0.3; ctx.moveTo(px - Math.cos(an) * (pr - 2), py - Math.sin(an) * (pr - 2)); ctx.lineTo(px + Math.cos(an) * (pr - 2), py + Math.sin(an) * (pr - 2)); } ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1;
      const pep = a.k === 1 ? [[-3, 2], [3, -2]] : a.k === 2 ? [[-2, -3], [3, 1], [-3, 3], [1, 4]] : [[-3, -2], [3, -3], [1, 3]];
      for (const [dx, dy] of pep) { ctx.beginPath(); ctx.arc(px + dx, py + dy, 1.7, 0, Math.PI * 2); ctx.stroke(); }
      ctx.fillStyle = '#7ee081'; ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('✓', sx + sw - 6, sy + 6);
      // scan line
      const ly = sy + ((1 - f) * 2 % 1) * sh;
      ctx.fillStyle = 'rgba(160,240,255,0.45)'; ctx.fillRect(sx, ly, sw, 1.5);
    } else {
      ctx.strokeStyle = 'rgba(80,160,220,0.18)'; ctx.lineWidth = 1;
      for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(sx, sy + k * sh / 4); ctx.lineTo(sx + sw, sy + k * sh / 4); ctx.stroke(); }
      const ly = sy + ((g.time * 0.8 + i * 0.37) % 1) * sh;
      ctx.fillStyle = 'rgba(120,200,255,0.4)'; ctx.fillRect(sx, ly, sw, 1.5);
      ctx.fillStyle = 'rgba(126,224,129,0.85)'; ctx.font = r.font(6); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('X-RAY', a.x, sy + sh / 2);
    }
    ctx.restore();
    // the light on top
    const lit = f > 0 ? '#7ee081' : (Math.sin(g.time * 4 + i) > 0 ? '#ffb347' : '#a0672b');
    ctx.fillStyle = '#5d636b'; ctx.fillRect(a.x - 5, back - A.h + A.d / 2 - 3, 10, 5);
    ctx.fillStyle = lit; ctx.beginPath(); ctx.arc(a.x, back - A.h + A.d / 2 - 4, 5, Math.PI, 0); ctx.fill();
    if (f > 0) { ctx.fillStyle = `rgba(126,224,129,${0.4 * f})`; ctx.beginPath(); ctx.arc(a.x, back - A.h + A.d / 2 - 5, 12, 0, Math.PI * 2); ctx.fill(); }
  },
};

Game.ext.push(ConveyorExt);
Render.ext.push(ConveyorExt);
