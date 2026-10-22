'use strict';
// The pizza room: a second room on the pizzeria's second floor where it rains pizza slices.
// A bright door on the bedroom's east wall (painted onto the bedroom with `paintAfter`) leads to a cosy attic room of
// its own (`CFG.AREAS.pizzarain`): a slanted ceiling with a round window and fairy lights, a pizza rug, a comfy
// armchair, and a big fluffy pizza-cloud under the ceiling that rains pizza slices all the time. The slices drift and
// spin down, land with a tiny bounce and fade away. Walk into a slice while it is low enough and the chef eats it
// (a float, a crumb sparkle, a chew): three slices and the chef is full for this visit (the rain keeps falling for
// fun, slices just bounce off). Leaving the room resets the count; `g.s.pizzarain` keeps the totals.
// Extension module: registered with Game.ext (first, so its door beats the bedroom's buttons) and Render.ext.
// See the hook list in js/EXTENSIONS.md. This file never touches js/upstairs.js: it only reads UpstairsExt.st.
CFG.PIZZARAIN = {
  WORLD: { x0: 5000, y0: 4000, x1: 5600, y1: 4400 },      // reserved interior rectangle (x0 = 3000 + 2 * 1000)
  ROOM: { x0: 5050, y0: 4096, x1: 5550, y1: 4356 }, WALL: 26,
  WINDOW: { x: 5150, y: 4044, r: 26 },                    // round attic window in the slope
  CLOUD: { x: 5300, y: 4058, w: 200 },                    // the pizza cloud under the ceiling; slices drop from its underside
  LIGHTS: { y: 4034, sag: 34, n: 12 },                    // the fairy lights strung under the ceiling
  RUG: { x: 5300, y: 4246, rx: 112, ry: 58 },             // a pizza-shaped rug
  CHAIR: { x: 5110, y: 4300, block: [5078, 4272, 64, 52] },
  TABLE: { x: 5488, y: 4302, block: [5466, 4284, 44, 34] },
  LAMP: { x: 5512, y: 4132, block: [5498, 4118, 28, 24] },
  PLANT: { x: 5090, y: 4132, block: [5076, 4118, 28, 24] },
  EXIT: { x: 5080, y: 4222 }, reach: 26,                  // the mat inside the door back to the bedroom (west wall)
  DOOR_IN: { x0: 5024, y0: 4198, x1: 5050, y1: 4246 },    // that door, on the west wall
  MAT_OUT: { x: 6916, y: 1742 },                          // the mat in the bedroom, on the free strip between the desk and the stair rail
  DOOR_OUT: { x0: 6941, y0: 1716, x1: 6965, y1: 1764 },   // the door on the bedroom's east wall
  rain: { every: 0.6, max: 14, fall: 76, drift: 18, sway: 14, floorFor: 2.2, fadeFor: 0.6, bounce: 72, gravity: 400 },
  catchZone: { dx: 22, dy: 18, h: 66 },                   // a slice this close (and this low) is caught
  full: 3, chew: 0.8, fade: 0.45,
  hintReach: 70,
};
CFG.AREAS.pizzarain = { WORLD: CFG.PIZZARAIN.WORLD };

const PIZZARAIN_BULBS = ['#ff5c5c', '#ffd166', '#5ad26f', '#4aa3ff', '#ff8fab', '#ffa94d'];
const PIZZARAIN_PUFFS = [[-78, 8, 28], [-44, -8, 36], [-4, -16, 42], [38, -8, 38], [78, 8, 28], [-24, 12, 30], [24, 14, 30]];   // [dx, dy, r]

const PizzaRainExt = {
  name: 'pizzarain',
  st: null,   // runtime (not saved): the slices in the air and on the floor, this visit's count, the chew, the fade

  // ---------- saved state ----------
  defaults: { pizzarain: { eaten: 0, visits: 0, seen: false } },
  state(g) { if (!g.s.pizzarain) g.s.pizzarain = { eaten: 0, visits: 0, seen: false }; return g.s.pizzarain; },

  // ---------- helpers ----------
  // on foot and not in a ride, a taxi, the Pizza Tower, a bus...
  ready(g) {
    if (g.driving || g.onTrain || g.ride || g.travel || g.fishing) return false;
    if (typeof CityExt !== 'undefined' && (CityExt.floor || (CityExt.st && (CityExt.st.cab || CityExt.st.boarding)))) return false;
    return true;
  },
  // in the bedroom with nothing going on there (no nap, no slide, no catalog, no drawing pad)
  bedroomOk(g) {
    if (g.area !== 'upstairs' || typeof UpstairsExt === 'undefined' || !UpstairsExt.st) return false;
    const st = UpstairsExt.st;
    return !(st.nap || st.slide || st.cat.on || st.draw.on);
  },
  atMat(g) { const p = g.player, M = CFG.PIZZARAIN.MAT_OUT; return U.dist(p.x, p.y, M.x, M.y) < CFG.PIZZARAIN.reach; },
  atExit(g) { const p = g.player, E = CFG.PIZZARAIN.EXIT; return U.dist(p.x, p.y, E.x, E.y) < CFG.PIZZARAIN.reach; },
  roomBlocks() {
    const C = CFG.PIZZARAIN, R = C.ROOM, W = C.WORLD, w = C.WALL, o = [];
    o.push({ x: W.x0, y: W.y0, w: W.x1 - W.x0, h: R.y0 - W.y0 });                                   // the whole slope of the ceiling
    o.push({ x: R.x0 - w, y: R.y1, w: R.x1 - R.x0 + 2 * w, h: w });
    o.push({ x: R.x0 - w, y: R.y0, w, h: R.y1 - R.y0 }, { x: R.x1, y: R.y0, w, h: R.y1 - R.y0 });
    for (const it of [C.CHAIR, C.TABLE, C.LAMP, C.PLANT]) o.push({ x: it.block[0], y: it.block[1], w: it.block[2], h: it.block[3] });
    return o;
  },
  roomFree(x, y) {
    const R = CFG.PIZZARAIN.ROOM, r = 12;
    if (x < R.x0 + r || x > R.x1 - r || y < R.y0 + r || y > R.y1 - r) return false;
    for (const o of this.roomBlocks()) if (x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h) return false;
    return true;
  },
  // a save (or a push) that left the chef in a wall or in the furniture goes back onto the door mat
  rescue(g) {
    const p = g.player;
    if (this.roomFree(p.x, p.y)) return false;
    p.x = CFG.PIZZARAIN.EXIT.x; p.y = CFG.PIZZARAIN.EXIT.y; p.moving = false;
    g.floats.push({ x: p.x, y: p.y - 50, text: 'Oops! Back inside', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    return true;
  },
  resetVisit() {
    const st = this.st;
    st.inside = false; st.eaten = 0; st.full = false; st.burped = false; st.chew = 0; st.slices.length = 0; st.crumbs.length = 0; st.spawnT = 0.3;
  },

  // ---------- game hooks ----------
  build(g) {
    this.state(g);
    this.st = { inside: false, eaten: 0, full: false, burped: false, chew: 0, fade: 0, slices: [], crumbs: [], spawnT: 0.3, spawned: 0, landed: 0, faded: 0 };
  },
  home(g) { if (this.st) { this.resetVisit(); this.st.fade = 0; } },
  obstacles(g) { return g.area === 'pizzarain' ? this.roomBlocks() : []; },
  bgKey() { return 'pr'; },   // constant: the door on the bedroom wall never changes, it only has to be painted once this file is loaded
  enter(g) {
    const C = CFG.PIZZARAIN, p = g.player, s = this.state(g);
    if (!this.st) this.build(g);
    this.resetVisit();
    g.area = 'pizzarain'; p.x = C.EXIT.x; p.y = C.EXIT.y; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.st.inside = true; this.st.fade = C.fade; this.st.spawnT = 0.15;
    s.visits = (s.visits || 0) + 1;
    Sfx.ding(); Haptics.tap();
    if (!s.seen) { s.seen = true; g.toast("🍕 It's raining pizza!", true); }
  },
  leave(g) {
    const C = CFG.PIZZARAIN, p = g.player;
    this.resetVisit();
    g.area = 'upstairs'; p.x = C.MAT_OUT.x; p.y = C.MAT_OUT.y; p.moving = false; p.facing = -1; p.hasMoved = true; g.cameraSnap = true;
    this.st.fade = C.fade; Sfx.drop();
  },
  action(g) {
    if (!this.ready(g)) return null;
    if (this.bedroomOk(g) && this.atMat(g)) return { label: '🍕 Go into the pizza room', run: (gg) => this.enter(gg) };
    if (g.area === 'pizzarain' && this.atExit(g)) return { label: '🚪 Back to the bedroom', run: (gg) => this.leave(gg) };
    return null;
  },
  hint(g) {
    if (!this.ready(g)) return undefined;
    if (g.area === 'pizzarain') return { text: this.st && this.st.full ? "You're full! Enjoy the pizza rain 😋" : 'Catch the falling pizza! 🍕', target: null };
    if (!this.bedroomOk(g)) return undefined;
    const p = g.player, C = CFG.PIZZARAIN, M = C.MAT_OUT, d = U.dist(p.x, p.y, M.x, M.y);
    if (d < C.hintReach) return { text: 'A pizza room! 🍕', target: d < C.reach ? null : M };
    return undefined;
  },
  update(g, dt) {
    if (!this.st) this.build(g);
    const st = this.st, C = CFG.PIZZARAIN, R = C.ROOM;
    st.fade = Math.max(0, st.fade - dt);
    st.chew = Math.max(0, st.chew - dt);
    if (g.area !== 'pizzarain') { if (st.inside) this.resetVisit(); return; }
    if (!st.inside) st.inside = true;   // arrived by a saved position
    this.rescue(g);
    // the cloud lets a slice go every so often, never more than a handful at a time
    st.spawnT -= dt;
    if (st.spawnT <= 0) { st.spawnT = C.rain.every; if (st.slices.length < C.rain.max) this.spawn(); }
    const p = g.player, Z = C.catchZone, K = C.rain;
    for (let i = st.slices.length - 1; i >= 0; i--) {
      const s = st.slices[i];
      s.t += dt; s.ang += s.spin * dt;
      if (s.state === 'fall') {
        s.h -= K.fall * dt;
        s.x += (s.vx + Math.sin(s.t * 2.2 + s.ph) * K.sway) * dt;
        if (s.h <= 0) { s.h = 0; s.state = 'bounce'; s.vh = K.bounce; s.vx *= 0.5; }
      } else if (s.state === 'bounce') {
        s.h += s.vh * dt; s.vh -= K.gravity * dt; s.x += s.vx * dt; s.vx *= Math.max(0, 1 - 2.5 * dt);
        if (s.h <= 0) { s.h = 0; s.vh = 0; s.state = 'floor'; s.t = 0; s.spin = 0; st.landed++; }
      } else {
        if (s.t > K.floorFor) { s.a = Math.max(0, 1 - (s.t - K.floorFor) / K.fadeFor); if (s.a <= 0) { st.slices.splice(i, 1); st.faded++; continue; } }
      }
      s.x = U.clamp(s.x, R.x0 + 14, R.x1 - 14);
      // the chef: catch it (eat), or, when full, it bounces off
      if (Math.abs(s.x - p.x) < Z.dx && Math.abs(s.gy - p.y) < Z.dy && s.h <= Z.h) {
        if (!st.full) { st.slices.splice(i, 1); this.eat(g, s); continue; }
        if (!s.hit && s.state !== 'floor') {
          s.hit = true; s.state = 'bounce'; s.vh = K.bounce * 1.2; s.vx = (s.x >= p.x ? 1 : -1) * 90; s.spin = s.spin || 3;
          if (!st.burped) { st.burped = true; g.floats.push({ x: p.x, y: p.y - 64, text: 'Burp! 😅', color: '#ffe08a', t: 0, dur: 1.3, big: true }); }
        }
      }
    }
    for (let i = st.crumbs.length - 1; i >= 0; i--) { const c = st.crumbs[i]; c.t += dt; c.vy += 320 * dt; c.x += c.vx * dt; c.y += c.vy * dt; if (c.t > c.dur) st.crumbs.splice(i, 1); }
  },
  // a slice drops from the cloud's underside toward a spot on the floor (x, gy); h is its height above that spot
  spawn(x, gy, h) {
    const C = CFG.PIZZARAIN, R = C.ROOM, st = this.st, K = C.rain;
    if (x === undefined) x = U.rand(C.CLOUD.x - C.CLOUD.w / 2 + 12, C.CLOUD.x + C.CLOUD.w / 2 - 12);
    if (gy === undefined) gy = U.rand(R.y0 + 64, R.y1 - 26);
    if (h === undefined) h = Math.max(30, gy - (C.CLOUD.y + 38));
    const s = { x, gy, h, vh: 0, vx: U.rand(-K.drift, K.drift), ang: U.rand(0, Math.PI * 2), spin: U.rand(-1.8, 1.8), ph: U.rand(0, Math.PI * 2), state: 'fall', t: 0, a: 1, hit: false, id: ++st.spawned };
    st.slices.push(s);
    return s;
  },
  eat(g, s) {
    const st = this.st, C = CFG.PIZZARAIN, p = g.player, sv = this.state(g);
    st.eaten++; sv.eaten = (sv.eaten || 0) + 1; st.chew = C.chew;
    g.floats.push({ x: p.x, y: p.y - 66, text: 'Mmm! 🍕', color: '#ffe08a', t: 0, dur: 1.2, big: true });
    g.fx.push({ kind: 'sparkle', x0: p.x, y0: p.y - 34, x1: p.x, y1: p.y - 34, t: 0, dur: 0.5 });
    for (let i = 0; i < 7; i++) st.crumbs.push({ x: p.x + U.rand(-6, 6), y: p.y - 34, vx: U.rand(-60, 60), vy: U.rand(-120, -40), t: 0, dur: U.rand(0.5, 0.8), col: i % 3 ? '#d98a3c' : '#c0392b' });
    Sfx.pickup(); Haptics.tap();
    if (st.eaten >= C.full) {
      st.full = true;
      g.floats.push({ x: p.x, y: p.y - 94, text: "I'm full! 😋", color: '#ffe08a', t: 0.35, dur: 1.9, big: true });
      for (let i = 0; i < 5; i++) { const a = i * 1.26, rr = i ? 30 : 0; g.fx.push({ kind: 'sparkle', x0: p.x + Math.cos(a) * rr, y0: p.y - 34 + Math.sin(a) * rr * 0.6, x1: 0, y1: 0, t: -i * 0.08, dur: 0.8 }); }
      Haptics.success();
    }
  },

  // ======================= render hooks =======================
  paint: { pizzarain(r, g) { PizzaRainExt.paintRoom(r, g); } },
  // the door to the pizza room, painted onto the bedroom's east wall, with its sign and the mat on the floor
  paintAfter(r, g, area) {
    if (area !== 'upstairs') return;
    const ctx = r.ctx, C = CFG.PIZZARAIN, D = C.DOOR_OUT, M = C.MAT_OUT;
    this.paintDoor(r, D, 1);
    this.paintMat(ctx, M.x, M.y);
    // the pizza sign over the door, hanging out from the wall
    const sx = (D.x0 + D.x1) / 2, sy = D.y0 - 16;
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(sx - 1.5, sy + 8, 3, 8);
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(sx, sy, 12, 0, Math.PI * 2); ctx.fill();
    r.drawPizza(sx, sy, 9.5);
  },
  // a bright yellow door with a round window and a pizza-coloured frame; dir 1 = the door's wall is to the right of the room
  paintDoor(r, D, dir) {
    const ctx = r.ctx, w = D.x1 - D.x0, h = D.y1 - D.y0, cx = (D.x0 + D.x1) / 2;
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, D.x0 - 3, D.y0 - 3, w + 6, h + 6, 4); ctx.fill();   // the frame
    ctx.fillStyle = '#f2b134'; U.roundRect(ctx, D.x0, D.y0, w, h, 3); ctx.fill();                    // the door
    ctx.fillStyle = '#ffd166'; U.roundRect(ctx, D.x0 + 4, D.y0 + 22, w - 8, h - 28, 2); ctx.fill();  // the lower panel
    ctx.fillStyle = '#fff8ee'; ctx.beginPath(); ctx.arc(cx, D.y0 + 11, 6.5, 0, Math.PI * 2); ctx.fill();   // the round window
    ctx.fillStyle = '#9fe0ff'; ctx.beginPath(); ctx.arc(cx, D.y0 + 11, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(cx - dir * 7, D.y0 + h * 0.56, 2.2, 0, Math.PI * 2); ctx.fill();   // the knob, on the room side
  },
  paintMat(ctx, x, y) {
    ctx.fillStyle = 'rgba(0,0,0,0.14)'; U.roundRect(ctx, x - 14, y - 5, 30, 14, 4); ctx.fill();
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, x - 15, y - 7, 30, 14, 4); ctx.fill();
    ctx.fillStyle = '#ffd166'; ctx.fillRect(x - 11, y - 4, 22, 2); ctx.fillRect(x - 11, y + 2, 22, 2);
    ctx.fillStyle = '#fff8ee'; ctx.beginPath(); ctx.arc(x, y, 2.6, 0, Math.PI * 2); ctx.fill();
  },
  // ---------- the pizza room ----------
  paintRoom(r, g) {
    const ctx = r.ctx, C = CFG.PIZZARAIN, W = C.WORLD, R = C.ROOM, w = C.WALL, cx = (R.x0 + R.x1) / 2;
    // the dark of the attic outside the walls
    ctx.fillStyle = '#1f1611'; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    // the slanted ceiling: rows of planks climbing away into the dark, rafters leaning in toward the ridge
    const ch = R.y0 - W.y0, rows = 9;
    for (let i = 0; i < rows; i++) {
      const k = i / rows, y1 = R.y0 - k * ch, y0 = R.y0 - ((i + 1) / rows) * ch, mix = 1 - k * 0.6;
      ctx.fillStyle = `rgb(${Math.round(150 * mix)},${Math.round(100 * mix)},${Math.round(55 * mix)})`; ctx.fillRect(W.x0, y0, W.x1 - W.x0, y1 - y0 + 1);
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(W.x0, y1 - 1.5, W.x1 - W.x0, 1.5);
    }
    ctx.fillStyle = '#3a2314';
    for (let i = 0; i <= 8; i++) {
      const xb = R.x0 - w + i * ((R.x1 - R.x0 + 2 * w) / 8), xt = cx + (xb - cx) * 0.82;
      ctx.beginPath(); ctx.moveTo(xb - 6, R.y0); ctx.lineTo(xb + 6, R.y0); ctx.lineTo(xt + 4, W.y0); ctx.lineTo(xt - 4, W.y0); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(W.x0, R.y0 - 7, W.x1 - W.x0, 7);   // the wall plate along the bottom of the slope
    // the round attic window in the slope, with the sky in it
    const Wn = C.WINDOW;
    ctx.fillStyle = '#fff8ee'; ctx.beginPath(); ctx.arc(Wn.x, Wn.y, Wn.r + 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5b3a1a'; ctx.beginPath(); ctx.arc(Wn.x, Wn.y, Wn.r + 1, 0, Math.PI * 2); ctx.fill();
    const sky = ctx.createLinearGradient(0, Wn.y - Wn.r, 0, Wn.y + Wn.r); sky.addColorStop(0, '#4fb0ea'); sky.addColorStop(1, '#c9ecff');
    ctx.fillStyle = sky; ctx.beginPath(); ctx.arc(Wn.x, Wn.y, Wn.r - 2, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(Wn.x, Wn.y, Wn.r - 2, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(Wn.x - 8, Wn.y + 4, 7, 0, Math.PI * 2); ctx.arc(Wn.x, Wn.y, 9, 0, Math.PI * 2); ctx.arc(Wn.x + 9, Wn.y + 4, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff7c2'; ctx.beginPath(); ctx.arc(Wn.x + 12, Wn.y - 14, 6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#fff8ee'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(Wn.x - Wn.r, Wn.y); ctx.lineTo(Wn.x + Wn.r, Wn.y); ctx.moveTo(Wn.x, Wn.y - Wn.r); ctx.lineTo(Wn.x, Wn.y + Wn.r); ctx.stroke();
    // the fairy lights: a sagging wire with bright bulbs (their glow twinkles live)
    const L = C.LIGHTS;
    ctx.strokeStyle = 'rgba(30,20,10,0.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(R.x0 - w, L.y); ctx.quadraticCurveTo(cx, L.y + L.sag * 2, R.x1 + w, L.y); ctx.stroke();
    for (let i = 0; i < L.n; i++) { const b = this.bulb(i); ctx.fillStyle = '#5b3a1a'; ctx.fillRect(b.x - 1.5, b.y - 4, 3, 4); ctx.fillStyle = PIZZARAIN_BULBS[i % PIZZARAIN_BULBS.length]; ctx.beginPath(); ctx.arc(b.x, b.y + 3, 4, 0, Math.PI * 2); ctx.fill(); }
    // walls: warm wood panelling
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, w); ctx.fillRect(R.x0 - w, R.y0, w, R.y1 - R.y0); ctx.fillRect(R.x1, R.y0, w, R.y1 - R.y0);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = R.x0 - w; x < R.x1 + w; x += 16) ctx.fillRect(x, R.y1, 2, w); for (let y = R.y0; y < R.y1; y += 16) { ctx.fillRect(R.x0 - w, y, w, 2); ctx.fillRect(R.x1, y, w, 2); }
    // the wooden floor
    for (let y = R.y0; y < R.y1; y += 18) {
      const row = Math.floor((y - R.y0) / 18), hh = Math.min(18, R.y1 - y);
      ctx.fillStyle = row % 2 ? '#d4a86f' : '#cfa166'; ctx.fillRect(R.x0, y, R.x1 - R.x0, hh);
      ctx.strokeStyle = 'rgba(80,40,10,0.18)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(R.x0, y + 0.5); ctx.lineTo(R.x1, y + 0.5); ctx.stroke();
      for (let k = 0; k < 3; k++) { const px = R.x0 + ((row * 97 + k * 173) % (R.x1 - R.x0)); ctx.fillRect(px, y, 1.5, hh); }
    }
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, 5);   // the ceiling's shadow on the floor
    // the pizza rug: a big round pizza with a crust rim, cheese, pepperoni and basil
    const G = C.RUG;
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(G.x + 3, G.y + 5, G.rx, G.ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d98a3c'; ctx.beginPath(); ctx.ellipse(G.x, G.y, G.rx, G.ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8a254'; ctx.beginPath(); ctx.ellipse(G.x, G.y, G.rx - 6, G.ry - 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.ellipse(G.x, G.y, G.rx - 14, G.ry - 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f6c453'; ctx.beginPath(); ctx.ellipse(G.x, G.y, G.rx - 19, G.ry - 15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(217,138,60,0.5)'; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(G.x + Math.cos(a) * (G.rx - 19), G.y + Math.sin(a) * (G.ry - 15)); ctx.lineTo(G.x - Math.cos(a) * (G.rx - 19), G.y - Math.sin(a) * (G.ry - 15)); ctx.stroke(); }
    ctx.fillStyle = '#c0392b'; for (let i = 0; i < 8; i++) { const a = i * 0.785 + 0.4, rr = i % 2 ? 0.62 : 0.3; ctx.beginPath(); ctx.arc(G.x + Math.cos(a) * (G.rx - 19) * rr, G.y + Math.sin(a) * (G.ry - 15) * rr, 7, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#3f9a4a'; for (let i = 0; i < 4; i++) { const a = i * 1.57 + 1.1; ctx.beginPath(); ctx.ellipse(G.x + Math.cos(a) * 44, G.y + Math.sin(a) * 24, 7, 4, a, 0, Math.PI * 2); ctx.fill(); }
    // the comfy armchair: round and soft, a cushion and a blanket over the arm
    const Ch = C.CHAIR;
    ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.beginPath(); ctx.ellipse(Ch.x + 3, Ch.y + 8, 36, 24, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b23a48'; U.roundRect(ctx, Ch.x - 32, Ch.y - 30, 64, 56, 18); ctx.fill();
    ctx.fillStyle = '#8a2a36'; U.roundRect(ctx, Ch.x - 32, Ch.y - 30, 64, 18, 10); ctx.fill();   // the back
    ctx.fillStyle = '#c94a58'; U.roundRect(ctx, Ch.x - 20, Ch.y - 12, 40, 30, 10); ctx.fill();   // the seat
    ctx.fillStyle = '#8a2a36'; U.roundRect(ctx, Ch.x - 34, Ch.y - 14, 14, 36, 7); ctx.fill(); U.roundRect(ctx, Ch.x + 20, Ch.y - 14, 14, 36, 7); ctx.fill();   // the arms
    ctx.fillStyle = '#ffd166'; U.roundRect(ctx, Ch.x - 12, Ch.y - 8, 24, 18, 6); ctx.fill(); ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(Ch.x, Ch.y + 1, 4, 0, Math.PI * 2); ctx.fill();   // a pizza cushion
    ctx.fillStyle = '#4aa3d8'; U.roundRect(ctx, Ch.x + 18, Ch.y - 10, 18, 22, 4); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; for (let k = 0; k < 3; k++) ctx.fillRect(Ch.x + 20, Ch.y - 6 + k * 7, 14, 2);   // the blanket
    // a little side table with a plate, a napkin and a glass of juice
    const T = C.TABLE;
    ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.beginPath(); ctx.ellipse(T.x + 3, T.y + 10, 24, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9b6531'; ctx.beginPath(); ctx.ellipse(T.x, T.y + 6, 22, 15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c99a5f'; ctx.beginPath(); ctx.ellipse(T.x, T.y, 22, 15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff8ee'; ctx.beginPath(); ctx.ellipse(T.x - 4, T.y + 1, 11, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#3b7dd8'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(T.x - 4, T.y + 1, 8, 5.5, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#ff8fab'; ctx.fillRect(T.x + 8, T.y - 6, 9, 9); ctx.fillStyle = '#ffa94d'; U.roundRect(ctx, T.x + 9, T.y - 2, 7, 9, 2); ctx.fill();
    // the floor lamp and the potted plant by the top corners
    const Lp = C.LAMP;
    ctx.fillStyle = 'rgba(255,224,138,0.22)'; ctx.beginPath(); ctx.arc(Lp.x, Lp.y + 4, 44, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5b3a1a'; ctx.beginPath(); ctx.ellipse(Lp.x, Lp.y + 8, 10, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(Lp.x - 1.5, Lp.y - 20, 3, 28);
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.moveTo(Lp.x - 16, Lp.y - 6); ctx.lineTo(Lp.x + 16, Lp.y - 6); ctx.lineTo(Lp.x + 9, Lp.y - 26); ctx.lineTo(Lp.x - 9, Lp.y - 26); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e4572e'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(Lp.x - 8 + k * 8, Lp.y - 15, 2.2, 0, Math.PI * 2); ctx.fill(); }
    const P = C.PLANT;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(P.x + 2, P.y + 8, 14, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c45c2e'; U.roundRect(ctx, P.x - 10, P.y - 4, 20, 14, 3); ctx.fill(); ctx.fillStyle = '#e07a4a'; ctx.fillRect(P.x - 12, P.y - 6, 24, 4);
    ctx.fillStyle = '#3f9a4a'; for (const [dx, dy, rr] of [[-8, -12, 7], [8, -12, 7], [0, -18, 8], [-4, -7, 6], [5, -6, 6]]) { ctx.beginPath(); ctx.arc(P.x + dx, P.y + dy, rr, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#56b862'; ctx.beginPath(); ctx.arc(P.x - 2, P.y - 18, 4, 0, Math.PI * 2); ctx.fill();
    // cushions on the floor by the chair, and a stack of empty pizza boxes in the corner
    for (const [x, y, col] of [[5170, 4330, '#3b7dd8'], [5196, 4318, '#41b883']]) { ctx.fillStyle = 'rgba(0,0,0,0.12)'; U.roundRect(ctx, x - 11, y - 6, 26, 16, 6); ctx.fill(); ctx.fillStyle = col; U.roundRect(ctx, x - 13, y - 9, 26, 16, 6); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(x, y - 1, 3, 0, Math.PI * 2); ctx.fill(); }
    for (let k = 0; k < 3; k++) { const bx = 5522, by = 4334 - k * 7; ctx.fillStyle = k % 2 ? '#e8d2a8' : '#dcc396'; U.roundRect(ctx, bx - 16, by - 8, 32, 10, 2); ctx.fill(); ctx.fillStyle = '#e4572e'; ctx.fillRect(bx - 5, by - 5, 10, 3); }
    // the door back to the bedroom (west wall), its bed sign and the mat inside
    this.paintDoor(r, C.DOOR_IN, -1);
    const D = C.DOOR_IN, sx = (D.x0 + D.x1) / 2;
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, sx - 13, D.y0 - 24, 26, 18, 4); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🛏️', sx, D.y0 - 15);
    this.paintMat(ctx, C.EXIT.x, C.EXIT.y);
    // the room's name plate on the bottom wall
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, cx - 62, R.y1 + 5, 124, 16, 5); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🍕 THE PIZZA RAIN ROOM 🍕', cx, R.y1 + 13);
  },
  // where the i-th fairy light hangs on its sagging wire
  bulb(i) {
    const C = CFG.PIZZARAIN, R = C.ROOM, w = C.WALL, L = C.LIGHTS, k = (i + 0.5) / L.n, u = 1 - k, x0 = R.x0 - w, x1 = R.x1 + w, cx = (R.x0 + R.x1) / 2;
    return { x: u * u * x0 + 2 * u * k * cx + k * k * x1, y: u * u * L.y + 2 * u * k * (L.y + L.sag * 2) + k * k * L.y };
  },
  // one pizza slice: a cheesy triangle pointing down (+y) with a crust along the top and pepperoni on it
  drawSlice(ctx, x, y, ang, s, a) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s); ctx.globalAlpha = a;
    ctx.fillStyle = '#f6c453'; ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(-9.5, -6); ctx.quadraticCurveTo(0, -10.5, 9.5, -6); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#d98a3c'; ctx.lineWidth = 3.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-9, -6.2); ctx.quadraticCurveTo(0, -10.8, 9, -6.2); ctx.stroke();
    ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(-3.2, -2.5, 2, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(3.4, -1, 2, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(0.2, 4, 1.7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.ellipse(-2, -5, 2.6, 1.1, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },
  // the glow of the fairy lights and the big fluffy pizza-cloud, bobbing under the ceiling (under the people and the slices)
  dynamic(r, g) {
    if (g.area !== 'pizzarain') return;
    const ctx = r.ctx, C = CFG.PIZZARAIN, t = g.time, L = C.LIGHTS;
    for (let i = 0; i < L.n; i++) { const b = this.bulb(i), tw = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.9); ctx.globalAlpha = 0.18 + 0.3 * tw; ctx.fillStyle = PIZZARAIN_BULBS[i % PIZZARAIN_BULBS.length]; ctx.beginPath(); ctx.arc(b.x, b.y + 3, 8 + tw * 4, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
    const cx = C.CLOUD.x, cy = C.CLOUD.y + Math.sin(t * 1.1) * 3;
    ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.beginPath(); ctx.ellipse(cx + 6, cy + 48, 104, 12, 0, 0, Math.PI * 2); ctx.fill();   // its shadow on the floor's edge
    // the pizza underside: a crust rim, cheese, pepperoni, and cheese drips about to let go
    ctx.fillStyle = '#d98a3c'; ctx.beginPath(); ctx.ellipse(cx, cy + 24, 104, 17, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f6c453'; ctx.beginPath(); ctx.ellipse(cx, cy + 22, 92, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c0392b'; for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.arc(cx - 72 + i * 24, cy + 24 + (i % 2) * 4, 4, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#f6c453'; for (let i = 0; i < 5; i++) { const dx = -60 + i * 30, dr = 2 + (Math.sin(t * 1.6 + i * 1.3) + 1) * 2; ctx.beginPath(); ctx.ellipse(cx + dx, cy + 36 + dr, 3.5, 3.5 + dr, 0, 0, Math.PI * 2); ctx.fill(); }
    // the fluffy top: white puffs with a cream underside and a happy face
    for (const [dx, dy, rr] of PIZZARAIN_PUFFS) { ctx.fillStyle = '#fff2d8'; ctx.beginPath(); ctx.arc(cx + dx, cy + dy + 6, rr, 0, Math.PI * 2); ctx.fill(); }
    for (const [dx, dy, rr] of PIZZARAIN_PUFFS) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(cx + dx, cy + dy, rr - 3, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(cx - 16, cy - 2, 3, 0, Math.PI * 2); ctx.arc(cx + 16, cy - 2, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,143,171,0.6)'; ctx.beginPath(); ctx.arc(cx - 26, cy + 6, 5, 0, Math.PI * 2); ctx.arc(cx + 26, cy + 6, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(cx, cy + 2, 9, 0.3, Math.PI - 0.3); ctx.stroke();
  },
  // the slices (in the air and on the floor), each sorted by the spot under it, and the chef chewing
  entities(r, g, items) {
    if (!this.st || g.area !== 'pizzarain') return;
    const ctx = r.ctx, st = this.st, p = g.player, C = CFG.PIZZARAIN;
    for (const s of st.slices) items.push({ y: s.gy, draw: () => {
      const sh = U.clamp(1 - s.h / 320, 0.25, 1);
      ctx.fillStyle = `rgba(0,0,0,${(0.2 * sh * s.a).toFixed(2)})`; ctx.beginPath(); ctx.ellipse(s.x, s.gy + 2, 8 * sh + 3, 3.5 * sh + 1.2, 0, 0, Math.PI * 2); ctx.fill();
      this.drawSlice(ctx, s.x, s.gy - s.h, s.ang, 1.15, s.a);
    } });
    if (st.chew > 0) items.push({ y: p.y + 0.5, draw: () => {
      const k = 1 - st.chew / C.chew, f = p.facing || 1, bob = Math.sin(g.time * 22) * 1.5;
      ctx.fillStyle = 'rgba(255,143,171,0.55)'; ctx.beginPath(); ctx.arc(p.x - 7, p.y - 35 + bob, 2.8, 0, Math.PI * 2); ctx.arc(p.x + 7, p.y - 35 + bob, 2.8, 0, Math.PI * 2); ctx.fill();   // rosy cheeks
      if (k < 0.7) this.drawSlice(ctx, p.x + f * 9, p.y - 33 + bob, f * 1.2, 1.1 - k, 1);   // the slice going in, bite by bite
      ctx.fillStyle = '#fff'; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(43,29,20,0.7)';
      const nom = k < 0.5 ? 'nom nom' : 'yum!'; ctx.strokeText(nom, p.x, p.y - 58 - bob); ctx.fillText(nom, p.x, p.y - 58 - bob);
    } });
  },
  // crumbs flying off a bite (world space, over everything)
  overlay(r, g) {
    if (!this.st || g.area !== 'pizzarain' || !this.st.crumbs.length) return;
    const ctx = r.ctx;
    for (const c of this.st.crumbs) { ctx.globalAlpha = U.clamp(1 - c.t / c.dur, 0, 1); ctx.fillStyle = c.col; ctx.beginPath(); ctx.arc(c.x, c.y, 2, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
  },
  // screen space: the three-slice counter at the top of the room and the fade through the door
  screen(r, g) {
    if (!this.st) return;
    const ctx = r.ctx, st = this.st, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr, C = CFG.PIZZARAIN;
    if (g.area === 'pizzarain') {
      const cx = W / 2, cy = W < 560 ? 205 : 110, pulse = st.full ? 1 + 0.05 * Math.sin(g.time * 6) : 1;   // under the hint bubble (which sits lower on a phone)
      ctx.save(); ctx.translate(cx, cy); ctx.scale(pulse, pulse);
      ctx.fillStyle = 'rgba(43,29,20,0.78)'; U.roundRect(ctx, -58, -16, 116, 32, 16); ctx.fill();
      for (let i = 0; i < C.full; i++) {
        const x = -32 + i * 32;
        if (i < st.eaten) this.drawSlice(ctx, x, 1, Math.PI, 1.35, 1);
        else { ctx.save(); ctx.translate(x, 1); ctx.rotate(Math.PI); ctx.scale(1.35, 1.35); ctx.setLineDash([2.5, 2]); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(-9.5, -6); ctx.quadraticCurveTo(0, -10.5, 9.5, -6); ctx.closePath(); ctx.stroke(); ctx.restore(); }
      }
      ctx.restore();
    }
    if (st.fade > 0) { ctx.fillStyle = `rgba(20,12,6,${(st.fade / C.fade).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
  },
};

Game.ext.unshift(PizzaRainExt);   // first in line so the door's button and hint beat the bedroom's own
Render.ext.push(PizzaRainExt);
