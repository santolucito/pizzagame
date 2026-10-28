'use strict';
// The Bakery: City building 2 (the yellow BAKERY shop on Bus Street) can be entered. Inside: a warm one-room bakery seen
// from above, with a big brick oven, a display case of cakes, croissants and cupcakes, a baker kneading dough behind the
// counter, a bell to ring, three treats to buy on walk-on pads, a cat asleep by the oven and a window onto the street.
// Extension module: registered with Game.ext (unshift, so the door beats the City's own buttons) and Render.ext.
// See js/EXTENSIONS.md ("Interiors": building index 2 owns the rectangle 500..1100 × 3000..3400).
CFG.BAKERY = {
  WORLD: { x0: 500, y0: 3000, x1: 1100, y1: 3400 },
  ROOM: { x0: 560, y0: 3090, x1: 1040, y1: 3340 }, WALL: 26, BACK: 56,   // the back wall is tall: it holds the oven and the window
  DOOR_OUT: { x: 5100, y: 14 },                                           // on the City sidewalk under the BAKERY awning: stand here to go in
  EXIT: { x: 940, y: 3322 },                                              // the mat inside the door: stand here to go out; you arrive just above it
  OVEN: { x0: 580, y0: 3044, x1: 704, y1: 3142, win: { x: 642, y: 3104, w: 56, h: 26 }, vent: { x: 642, y: 3040 } },
  CAT: { x: 744, y: 3130 },
  WINDOW: { x0: 846, y0: 3044, x1: 992, y1: 3082 },
  MENU: { x0: 724, y0: 3046, x1: 826, y1: 3080 },
  COUNTER: { x0: 600, y0: 3200, x1: 870, y1: 3236 },
  CASE: { x0: 722, y0: 3184, x1: 862, y1: 3214 },                          // the glass display case on the counter top
  BAKER: { x: 680, y: 3184 },
  DOUGH: { x: 680, y: 3204 },
  BELL: { x: 618, y: 3198, spot: { x: 618, y: 3258 }, reach: 36 },
  PADS: { croissant: { x: 690, y: 3284 }, cupcake: { x: 772, y: 3284 }, cake: { x: 854, y: 3284 } },
  SACKS: { x0: 580, y0: 3284, x1: 654, y1: 3338 },
  SHELF: { x0: 1004, y0: 3100, x1: 1040, y1: 3214 },
  PLANT: { x: 1018, y: 3302 },
  RUG: { x: 920, y: 3132 },
  CUPCAKE_TIME: 30, CANDLE_TIME: 8, WAVE_TIME: 2.4,
};
CFG.AREAS.bakery = { WORLD: CFG.BAKERY.WORLD };

const BakeryExt = {
  name: 'bakery',
  defaults: { bakery: { seen: false, treats: 0 } },
  st: null,
  build(g) {
    if (!g.s.bakery) g.s.bakery = { seen: false, treats: 0 };
    this.st = { fade: 0, wave: 0, bellT: 0, rang: false, cupcake: 0, candles: 0, confetti: [], zz: 0, obs: this.makeObstacles() };
  },
  ready(g) { if (!this.st) this.build(g); return this.st; },
  makeObstacles() {
    const K = CFG.BAKERY, R = K.ROOM, w = K.WALL, o = [];
    o.push({ x: R.x0 - w, y: R.y0 - K.BACK, w: R.x1 - R.x0 + 2 * w, h: K.BACK }, { x: R.x0 - w, y: R.y1, w: R.x1 - R.x0 + 2 * w, h: w });
    o.push({ x: R.x0 - w, y: R.y0, w, h: R.y1 - R.y0 }, { x: R.x1, y: R.y0, w, h: R.y1 - R.y0 });
    o.push({ x: K.OVEN.x0, y: R.y0, w: K.OVEN.x1 - K.OVEN.x0, h: K.OVEN.y1 - R.y0 });                          // the oven's front on the floor
    o.push({ x: K.CAT.x - 18, y: K.CAT.y - 14, w: 36, h: 20 });                                               // the cat's mat (let it sleep)
    o.push({ x: K.COUNTER.x0, y: K.COUNTER.y0 - 42, w: K.COUNTER.x1 - K.COUNTER.x0, h: K.COUNTER.y1 - K.COUNTER.y0 + 42 });   // counter plus the baker's side
    o.push({ x: K.SACKS.x0, y: K.SACKS.y0, w: K.SACKS.x1 - K.SACKS.x0, h: K.SACKS.y1 - K.SACKS.y0 });
    o.push({ x: K.SHELF.x0, y: K.SHELF.y0, w: K.SHELF.x1 - K.SHELF.x0, h: K.SHELF.y1 - K.SHELF.y0 });
    o.push({ x: K.PLANT.x - 16, y: K.PLANT.y - 16, w: 32, h: 32 });
    return o;
  },

  // ---------- game hooks ----------
  obstacles(g) { return g.area === 'bakery' ? this.ready(g).obs : []; },
  atDoor(g) { const D = CFG.BAKERY.DOOR_OUT; return g.area === 'city' && !g.driving && !g.onTrain && !g.ride && !g.travel && !g.fishing && U.dist(g.player.x, g.player.y, D.x, D.y) < 30; },
  action(g) {
    const st = this.ready(g), p = g.player, K = CFG.BAKERY;
    if (this.atDoor(g)) return { label: '🚪 Go inside', run: (gg) => this.enter(gg) };
    if (g.area !== 'bakery') return null;
    if (U.dist(p.x, p.y, K.EXIT.x, K.EXIT.y) < 30) return { label: '🚪 Go outside', run: (gg) => this.leave(gg) };
    if (U.dist(p.x, p.y, K.BELL.spot.x, K.BELL.spot.y) < K.BELL.reach) return { label: '🔔 Ring the bell', run: (gg) => this.ringBell(gg) };
    return null;
  },
  enter(g) {
    const K = CFG.BAKERY, p = g.player, st = this.ready(g);
    g.area = 'bakery'; p.x = K.EXIT.x; p.y = K.EXIT.y - 8; p.moving = false; p.facing = -1; p.hasMoved = true; g.cameraSnap = true;
    st.fade = 0.45; Sfx.ding(); Haptics.tap();
    if (!g.s.bakery.seen) { g.s.bakery.seen = true; g.toast('🥐 Welcome to the Bakery!', true); }
  },
  leave(g) {
    const K = CFG.BAKERY, p = g.player, st = this.ready(g);
    g.area = 'city'; p.x = K.DOOR_OUT.x; p.y = K.DOOR_OUT.y; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    st.fade = 0.45; st.candles = 0; st.confetti = []; Sfx.drop();
  },
  ringBell(g) {
    const st = this.ready(g), K = CFG.BAKERY;
    st.wave = K.WAVE_TIME; st.bellT = 0.7; st.rang = true;
    g.floats.push({ x: K.BELL.x, y: K.BELL.y - 30, text: 'Ding!', color: '#ffe08a', t: 0, dur: 0.9, big: true });
    Sfx.ding(); Haptics.tap();
  },
  // the core's Take-me-home button: drop everything the bakery holds (the core moves the chef)
  home(g) { const st = this.ready(g); st.fade = 0; st.wave = 0; st.bellT = 0; st.cupcake = 0; st.candles = 0; st.confetti = []; },
  // Is this a spot the chef can stand on: inside the room and not in a wall or a piece of furniture?
  free(x, y) {
    const R = CFG.BAKERY.ROOM, r = 12;
    if (x < R.x0 + r || x > R.x1 - r || y < R.y0 + r || y > R.y1 - r) return false;
    for (const o of this.st.obs) if (x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h) return false;
    return true;
  },
  rescue(g) {
    const p = g.player, K = CFG.BAKERY;
    if (this.free(p.x, p.y)) return false;
    p.x = K.EXIT.x; p.y = K.EXIT.y - 8; p.moving = false;
    g.floats.push({ x: p.x, y: p.y - 50, text: 'Oops! Back inside', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    return true;
  },
  update(g, dt) {
    const st = this.ready(g);
    st.fade = Math.max(0, st.fade - dt);
    st.wave = Math.max(0, st.wave - dt); st.bellT = Math.max(0, st.bellT - dt);
    st.cupcake = Math.max(0, st.cupcake - dt); st.candles = Math.max(0, st.candles - dt);
    if (st.confetti.length) {
      for (const c of st.confetti) { c.t += dt; c.x += c.vx * dt; c.y += c.vy * dt; c.vy += 260 * dt; c.vx *= 0.985; c.rot += c.vr * dt; }
      st.confetti = st.confetti.filter((c) => c.t < c.dur);
    }
    if (g.area !== 'bakery') return;
    this.rescue(g);
    st.zz += dt;
  },
  hint(g) {
    const st = this.ready(g), p = g.player, K = CFG.BAKERY;
    if (g.area === 'city') {
      if (g.driving || g.onTrain || g.ride || g.travel) return undefined;
      const d = U.dist(p.x, p.y, K.DOOR_OUT.x, K.DOOR_OUT.y);
      if (d > 120) return undefined;
      return { text: 'Go inside the bakery 🥐', target: d < 30 ? null : K.DOOR_OUT };
    }
    if (g.area !== 'bakery') return undefined;
    if (st.wave > 0) return { text: 'The baker says hello! 👋', target: null };
    if (st.candles > 0) return { text: 'Happy day! Make a wish 🎂', target: null };
    if (U.dist(p.x, p.y, K.CAT.x, K.CAT.y) < 70) return { text: 'Shh… the cat is sleeping by the warm oven 🐱', target: null };
    if (U.dist(p.x, p.y, K.BELL.spot.x, K.BELL.spot.y) < K.BELL.reach) return { text: 'Press the button to ring the bell 🔔', target: null };
    if (!st.rang) return { text: 'Ring the bell on the counter 🔔', target: K.BELL.spot };
    if (U.dist(p.x, p.y, K.EXIT.x, K.EXIT.y) < 30) return { text: 'Press the button to go outside', target: null };
    if (st.cupcake > 0) return { text: 'Yum! A cupcake just for you 🧁', target: null };
    if (g.s.bakery.treats === 0 && g.s.cash >= 3) return { text: 'Try a warm croissant 🥐', target: K.PADS.croissant };
    return { text: 'Mmm, it smells like fresh bread! 🍞', target: null };
  },
  pads(g) {
    if (g.area !== 'bakery') return [];
    const P = CFG.BAKERY.PADS;
    return [
      { key: 'bakeryCroissant', label: 'Croissant', ico: '🥐', pos: P.croissant, price: 3, sub: 'warm & flaky' },
      { key: 'bakeryCupcake', label: 'Cupcake', ico: '🧁', pos: P.cupcake, price: 5, sub: 'just for you' },
      { key: 'bakeryCake', label: 'Birthday cake', ico: '🎂', pos: P.cake, price: 12, sub: 'with candles!' },
    ];
  },
  onPad(g, pad) {
    const st = this.ready(g), p = g.player, K = CFG.BAKERY;
    g.s.bakery.treats = (g.s.bakery.treats || 0) + 1;
    if (pad.key === 'bakeryCroissant') {
      g.floats.push({ x: p.x, y: p.y - 60, text: 'Mmm, buttery!', color: '#ffe08a', t: 0, dur: 1.5, big: true });
      for (let i = 0; i < 4; i++) g.fx.push({ kind: 'sparkle', x0: p.x + U.rand(-18, 18), y0: p.y - 30 + U.rand(-16, 16), x1: 0, y1: 0, t: -i * 0.08, dur: 0.5 });
    } else if (pad.key === 'bakeryCupcake') {
      st.cupcake = K.CUPCAKE_TIME;
      g.floats.push({ x: p.x, y: p.y - 60, text: 'A cupcake for you! 🧁', color: '#ffe08a', t: 0, dur: 1.5, big: true });
    } else if (pad.key === 'bakeryCake') {
      st.candles = K.CANDLE_TIME;
      const cx = (K.CASE.x0 + K.CASE.x1) / 2 - 28, cy = K.CASE.y0 + 4, cols = ['#e4572e', '#ffd166', '#3b7dd8', '#41b883', '#ff8fab', '#8e5bd1'];
      for (let i = 0; i < 46; i++) { const a = -Math.PI / 2 + U.rand(-1.1, 1.1), sp = U.rand(90, 230); st.confetti.push({ x: cx + U.rand(-10, 10), y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, col: cols[i % cols.length], t: 0, dur: U.rand(1.1, 1.8), rot: U.rand(0, 6.3), vr: U.rand(-9, 9) }); }
      g.floats.push({ x: p.x, y: p.y - 60, text: 'Happy day! 🎉', color: '#ffe08a', t: 0, dur: 1.8, big: true });
    }
    Haptics.success();
  },

  // ======================= static art =======================
  paint: { bakery(r, g) { BakeryExt.paintRoom(r, g); } },
  // the BAKERY shop front in the City: treats in the two shop windows and an OPEN sign on the door
  paintAfter(r, g, area) {
    if (area !== 'city') return;
    const b = CFG.CITY.BUILDINGS[2]; if (!b) return;
    const ctx = r.ctx, cx = (b.x0 + b.x1) / 2, gy = b.y1 - 40, wy = gy + 20;
    // left window: a tiered cake on a stand; right window: croissants and cupcakes on a shelf
    ctx.fillStyle = '#fff8ee'; ctx.fillRect(b.x0 + 14, gy + 26, cx - 22 - b.x0 - 8, 3); ctx.fillRect(cx + 16, gy + 26, b.x1 - 10 - cx - 20, 3);
    this.drawCake(ctx, b.x0 + 10 + (cx - 22 - b.x0) / 2, wy + 5, 0.65, false, 0);
    for (let i = 0; i < 2; i++) this.drawCroissant(ctx, cx + 24 + i * 14, wy + 3, 0.7);
    for (let i = 0; i < 2; i++) this.drawCupcake(ctx, cx + 56 + i * 12, wy + 3, 0.7, ['#ff8fab', '#9fd8ff'][i]);
    ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, cx - 8, gy + 14, 16, 9, 2); ctx.fill();
    ctx.fillStyle = '#2f9e44'; ctx.font = r.font(6); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('OPEN', cx, gy + 18.5);
  },
  paintRoom(r, g) {
    const ctx = r.ctx, K = CFG.BAKERY, W = K.WORLD, R = K.ROOM, wl = K.WALL;
    // outside the walls: the bakery's yellow brick, like its front in the City
    ctx.fillStyle = '#e3b142'; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    ctx.fillStyle = 'rgba(0,0,0,0.08)'; for (let y = W.y0; y < W.y1; y += 12) for (let x = W.x0 + ((y / 12) % 2 ? 12 : 0); x < W.x1; x += 24) ctx.fillRect(x, y, 22, 10);
    // floor: cream and peach checker tiles
    for (let y = R.y0, j = 0; y < R.y1; y += 40, j++) for (let x = R.x0, i = 0; x < R.x1; x += 40, i++) { ctx.fillStyle = (i + j) % 2 ? '#f3dcb8' : '#e8c79e'; ctx.fillRect(x, y, Math.min(40, R.x1 - x), Math.min(40, R.y1 - y)); }
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; for (let x = R.x0; x < R.x1; x += 40) ctx.fillRect(x, R.y0, 2, R.y1 - R.y0); for (let y = R.y0; y < R.y1; y += 40) ctx.fillRect(R.x0, y, R.x1 - R.x0, 2);
    // side and bottom walls: warm wood; the back wall: striped wallpaper with a wainscot
    ctx.fillStyle = '#a3612c'; ctx.fillRect(R.x0 - wl, R.y1, R.x1 - R.x0 + 2 * wl, wl); ctx.fillRect(R.x0 - wl, R.y0, wl, R.y1 - R.y0); ctx.fillRect(R.x1, R.y0, wl, R.y1 - R.y0);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = R.x0 - wl; x < R.x1 + wl; x += 16) ctx.fillRect(x, R.y1, 2, wl); for (let y = R.y0; y < R.y1; y += 16) { ctx.fillRect(R.x0 - wl, y, wl, 2); ctx.fillRect(R.x1, y, wl, 2); }
    ctx.fillStyle = '#fbe6c6'; ctx.fillRect(R.x0 - wl, R.y0 - K.BACK, R.x1 - R.x0 + 2 * wl, K.BACK);
    ctx.fillStyle = 'rgba(228,87,46,0.10)'; for (let x = R.x0 - wl; x < R.x1 + wl; x += 18) ctx.fillRect(x, R.y0 - K.BACK, 8, K.BACK);
    ctx.fillStyle = '#a3612c'; ctx.fillRect(R.x0 - wl, R.y0 - 10, R.x1 - R.x0 + 2 * wl, 10); ctx.fillStyle = '#c47a3a'; ctx.fillRect(R.x0 - wl, R.y0 - 10, R.x1 - R.x0 + 2 * wl, 3);
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(R.x0 - wl, R.y0 - K.BACK, R.x1 - R.x0 + 2 * wl, 4);
    this.paintOven(ctx, r);
    this.paintWindow(ctx, r);
    this.paintMenu(ctx, r);
    // rugs: a round pink one under the window, a little mat for the cat
    ctx.fillStyle = '#e8a0bf'; ctx.beginPath(); ctx.ellipse(K.RUG.x, K.RUG.y, 54, 26, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f4b8d0'; ctx.beginPath(); ctx.ellipse(K.RUG.x, K.RUG.y, 40, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8a0bf'; ctx.beginPath(); ctx.ellipse(K.RUG.x, K.RUG.y, 24, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b23a48'; U.roundRect(ctx, K.CAT.x - 22, K.CAT.y - 14, 44, 24, 6); ctx.fill(); ctx.fillStyle = '#d9525f'; U.roundRect(ctx, K.CAT.x - 18, K.CAT.y - 10, 36, 16, 5); ctx.fill();
    this.paintCounter(ctx, r);
    this.paintSacks(ctx, r);
    this.paintShelf(ctx, r);
    // the potted plant by the door
    const P = K.PLANT;
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(P.x + 2, P.y + 12, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b86f2d'; U.roundRect(ctx, P.x - 11, P.y - 4, 22, 16, 4); ctx.fill();
    ctx.fillStyle = '#3f9a4a'; ctx.beginPath(); ctx.arc(P.x, P.y - 12, 12, 0, Math.PI * 2); ctx.arc(P.x - 9, P.y - 6, 8, 0, Math.PI * 2); ctx.arc(P.x + 9, P.y - 6, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff8fab'; ctx.beginPath(); ctx.arc(P.x + 3, P.y - 16, 3, 0, Math.PI * 2); ctx.fill();
    // the door in the bottom wall and the EXIT mat
    const E = K.EXIT;
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(E.x - 22, R.y1, 44, wl); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(E.x + 12, R.y1 + 11, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(159,224,255,0.6)'; ctx.fillRect(E.x - 16, R.y1 + 4, 32, 8);
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, E.x - 20, E.y - 8, 40, 14, 3); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('EXIT', E.x, E.y - 1);
    // name plate on the bottom wall
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, 760 - 50, R.y1 + 5, 100, 16, 4); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(9); ctx.fillText('🥐 BAKERY 🧁', 760, R.y1 + 13);
  },
  paintOven(ctx, r) {
    const O = CFG.BAKERY.OVEN, R = CFG.BAKERY.ROOM, w = O.x1 - O.x0;
    // chimney pipe up through the back wall
    ctx.fillStyle = '#5c6670'; ctx.fillRect(O.vent.x - 9, R.y0 - CFG.BAKERY.BACK, 18, 16); ctx.fillStyle = '#9aa0a8'; ctx.fillRect(O.vent.x - 11, R.y0 - CFG.BAKERY.BACK, 22, 4);
    // brick body with a rounded top
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(O.x0 + 5, O.y0 + 6, w, O.y1 - O.y0);
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, O.x0, O.y0, w, O.y1 - O.y0, 10); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.10)'; for (let y = O.y0 + 8; y < O.y1 - 4; y += 12) for (let i = 0; i < 6; i++) ctx.fillRect(O.x0 + 6 + i * 20 + ((y / 12) % 2 ? 10 : 0), y, 14, 7);
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(O.x0, O.y1 - 8, w, 8);                                   // the hearth stone
    ctx.fillStyle = '#4a2d12'; U.roundRect(ctx, O.x0 + 6, O.y1 - 8, w - 12, 8, 2); ctx.fill();
    // the oven door: dark arch with the glowing window (the glow flickers in `dynamic`)
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, O.win.x - O.win.w / 2 - 10, O.win.y - O.win.h / 2 - 12, O.win.w + 20, O.win.h + 28, 10); ctx.fill();
    ctx.fillStyle = '#ff9f1c'; U.roundRect(ctx, O.win.x - O.win.w / 2, O.win.y - O.win.h / 2, O.win.w, O.win.h, 6); ctx.fill();
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(O.win.x - 16, O.win.y + O.win.h / 2 + 6, 32, 4);        // the handle
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('OVEN', O.win.x, O.y0 + 10);
    // loaves resting on top of the oven
    for (let i = 0; i < 3; i++) { ctx.fillStyle = '#d98a3c'; ctx.beginPath(); ctx.ellipse(O.x0 + 22 + i * 24, O.y0 + 26, 9, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#f2c57c'; ctx.beginPath(); ctx.ellipse(O.x0 + 20 + i * 24, O.y0 + 24, 5, 2, -0.4, 0, Math.PI * 2); ctx.fill(); }
  },
  paintWindow(ctx, r) {
    const Wd = CFG.BAKERY.WINDOW, w = Wd.x1 - Wd.x0, h = Wd.y1 - Wd.y0;
    ctx.fillStyle = '#fff8ee'; ctx.fillRect(Wd.x0 - 6, Wd.y0 - 6, w + 12, h + 12);
    // the street view: sky, a row of little City buildings, the road and a tree (the clouds and the bus move in `dynamic`)
    const sky = ctx.createLinearGradient(0, Wd.y0, 0, Wd.y1); sky.addColorStop(0, '#49a8ea'); sky.addColorStop(1, '#bfe6fb'); ctx.fillStyle = sky; ctx.fillRect(Wd.x0, Wd.y0, w, h);
    const bl = [['#e8a0bf', 26, 18], ['#7fc8f8', 20, 24], ['#b39ddb', 24, 14], ['#90caf9', 18, 26], ['#a5d6a7', 22, 20], ['#f48fb1', 16, 16]];
    let bx = Wd.x0 + 2; for (const [col, bw, bh] of bl) { if (bx + bw > Wd.x1) break; ctx.fillStyle = col; ctx.fillRect(bx, Wd.y1 - 12 - bh, bw, bh); ctx.fillStyle = '#fff3b0'; for (let y = Wd.y1 - 10 - bh; y < Wd.y1 - 14; y += 6) for (let x = bx + 3; x < bx + bw - 3; x += 6) ctx.fillRect(x, y, 3, 3); bx += bw + 3; }
    ctx.fillStyle = '#5c6670'; ctx.fillRect(Wd.x0, Wd.y1 - 12, w, 12); ctx.fillStyle = '#ffd166'; for (let x = Wd.x0 + 4; x < Wd.x1; x += 14) ctx.fillRect(x, Wd.y1 - 6, 7, 2);
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(Wd.x0, Wd.y1 - 14, w, 3);
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(Wd.x1 - 14, Wd.y1 - 24, 3, 12); ctx.fillStyle = '#3f9a4a'; ctx.beginPath(); ctx.arc(Wd.x1 - 12.5, Wd.y1 - 27, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff8ee'; ctx.fillRect(Wd.x0 + w / 2 - 2, Wd.y0, 4, h); ctx.fillRect(Wd.x0, Wd.y0 + h / 2 - 1, w, 3);
    // a flower box under the sill
    ctx.fillStyle = '#b86f2d'; ctx.fillRect(Wd.x0 + 10, Wd.y1 + 6, w - 20, 8); for (let i = 0; i < 6; i++) { ctx.fillStyle = ['#e4572e', '#ffd166', '#ff8fab'][i % 3]; ctx.beginPath(); ctx.arc(Wd.x0 + 20 + i * (w - 40) / 5, Wd.y1 + 4, 3.5, 0, Math.PI * 2); ctx.fill(); }
  },
  paintMenu(ctx, r) {
    const M = CFG.BAKERY.MENU;
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, M.x0 - 4, M.y0 - 3, M.x1 - M.x0 + 8, M.y1 - M.y0 + 6, 4); ctx.fill(); ctx.fillStyle = '#2f3b33'; ctx.fillRect(M.x0, M.y0, M.x1 - M.x0, M.y1 - M.y0);
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('FRESH TODAY', (M.x0 + M.x1) / 2, M.y0 + 8);
    ctx.font = r.font(7); [['🥐', '$3'], ['🧁', '$5'], ['🎂', '$12']].forEach(([ico, pr], i) => { ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.fillText(ico, M.x0 + 6 + i * 34, M.y0 + 23); ctx.fillStyle = '#8ef0a0'; ctx.fillText(pr, M.x0 + 17 + i * 34, M.y0 + 23); });
  },
  paintCounter(ctx, r) {
    const K = CFG.BAKERY, C = K.COUNTER, D = K.DOUGH, G = K.CASE;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(C.x0 + 4, C.y0 + 6, C.x1 - C.x0, C.y1 - C.y0);
    ctx.fillStyle = '#8a5527'; U.roundRect(ctx, C.x0, C.y0, C.x1 - C.x0, C.y1 - C.y0, 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; for (let x = C.x0 + 8; x < C.x1 - 8; x += 24) ctx.fillRect(x, C.y0 + 8, 14, C.y1 - C.y0 - 16);
    ctx.fillStyle = '#f6e7cf'; U.roundRect(ctx, C.x0, C.y0 - 10, C.x1 - C.x0, 26, 6); ctx.fill();
    // the kneading board with a dusting of flour (the dough itself is animated)
    ctx.fillStyle = '#d9b48c'; U.roundRect(ctx, D.x - 30, D.y - 10, 60, 20, 4); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; for (let i = 0; i < 10; i++) { ctx.beginPath(); ctx.arc(D.x - 26 + ((i * 37) % 52), D.y - 6 + ((i * 13) % 12), 1.2, 0, Math.PI * 2); ctx.fill(); }
    // the glass display case: cakes, croissants and cupcakes on two tiers
    ctx.fillStyle = '#fff'; ctx.fillRect(G.x0, G.y0 + 12, G.x1 - G.x0, 2);
    this.drawCake(ctx, G.x0 + 42, G.y1 - 4, 1, false, 0);
    for (let i = 0; i < 3; i++) this.drawCroissant(ctx, G.x0 + 78 + i * 18, G.y1 - 8, 0.9);
    for (let i = 0; i < 4; i++) this.drawCupcake(ctx, G.x0 + 12 + i * 20, G.y0 + 8, 0.75, ['#ff8fab', '#9fd8ff', '#ffd166', '#c5e1a5'][i]);
    for (let i = 0; i < 3; i++) { ctx.fillStyle = '#d98a3c'; ctx.beginPath(); ctx.ellipse(G.x0 + 100 + i * 14, G.y0 + 8, 6, 3.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#f2c57c'; ctx.fillRect(G.x0 + 97 + i * 14, G.y0 + 6, 6, 1.5); }   // rolls
    ctx.fillStyle = 'rgba(159,224,255,0.4)'; U.roundRect(ctx, G.x0, G.y0 - 4, G.x1 - G.x0, G.y1 - G.y0 + 4, 8); ctx.fill();
    ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 1.5; U.roundRect(ctx, G.x0, G.y0 - 4, G.x1 - G.x0, G.y1 - G.y0 + 4, 8); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(G.x0 + 4, G.y0 - 1, G.x1 - G.x0 - 8, 3);
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('TREATS', (G.x0 + G.x1) / 2, G.y1 + 10);
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.fillText('RING FOR SERVICE', K.BELL.x + 34, C.y1 - 8);
  },
  paintSacks(ctx, r) {
    const S = CFG.BAKERY.SACKS;
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.ellipse(S.x1 - 4, S.y1 - 10, 16, 6, 0, 0, Math.PI * 2); ctx.fill();   // spilled flour
    for (const [x, y, lean] of [[S.x0 + 20, S.y0 + 30, -0.08], [S.x0 + 54, S.y0 + 34, 0.1], [S.x0 + 36, S.y0 + 14, 0]]) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(lean);
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(2, 16, 16, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d9b48c'; U.roundRect(ctx, -15, -18, 30, 34, 8); ctx.fill(); ctx.strokeStyle = '#a97a45'; ctx.lineWidth = 1.5; U.roundRect(ctx, -15, -18, 30, 34, 8); ctx.stroke();
      ctx.fillStyle = '#a97a45'; U.roundRect(ctx, -10, -22, 20, 8, 3); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-4, -22, 3, 0, Math.PI * 2); ctx.arc(4, -22, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#b23a48'; ctx.font = r.font(6); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('FLOUR', 0, 0);
      ctx.restore();
    }
  },
  paintShelf(ctx, r) {
    const S = CFG.BAKERY.SHELF;
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(S.x0, S.y0, S.x1 - S.x0, S.y1 - S.y0);
    for (let y = S.y0 + 6; y < S.y1 - 10; y += 28) {
      ctx.fillStyle = '#8d5a2b'; ctx.fillRect(S.x0 + 2, y, S.x1 - S.x0 - 4, 22);
      ctx.fillStyle = '#d98a3c'; U.roundRect(ctx, S.x0 + 5, y + 4, S.x1 - S.x0 - 10, 12, 5); ctx.fill();
      ctx.fillStyle = '#f2c57c'; for (let k = 0; k < 3; k++) ctx.fillRect(S.x0 + 9 + k * 8, y + 6, 4, 2);
    }
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(6); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('BREAD', (S.x0 + S.x1) / 2, S.y1 - 6);
  },

  // ---------- treats (shared by the shop windows, the display case and the chef's hand) ----------
  drawCake(ctx, x, y, s, lit, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.ellipse(0, 2, 22, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(-3, -6, 6, 8);   // the stand
    ctx.fillStyle = '#ffb6c1'; U.roundRect(ctx, -20, -18, 40, 14, 4); ctx.fill(); ctx.fillStyle = '#ff8fab'; U.roundRect(ctx, -14, -28, 28, 12, 4); ctx.fill();
    ctx.fillStyle = '#fff8ee'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(-16 + i * 8, -17, 3.5, 0, Math.PI * 2); ctx.fill(); } for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(-11 + i * 7.3, -27, 3, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(0, -31, 3, 0, Math.PI * 2); ctx.fill();
    if (lit) {
      for (let i = 0; i < 3; i++) {
        const cx = -8 + i * 8, fl = Math.sin(t * 13 + i * 2) * 1.2;
        ctx.fillStyle = ['#3b7dd8', '#ffd166', '#41b883'][i]; ctx.fillRect(cx - 1.5, -40, 3, 10);
        ctx.fillStyle = '#ff9f1c'; ctx.beginPath(); ctx.ellipse(cx, -44 + fl * 0.4, 2.6, 4.5 + fl, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.ellipse(cx, -43 + fl * 0.4, 1.2, 2.2, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  },
  drawCroissant(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.strokeStyle = '#d98a3c'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 2, 7, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    ctx.strokeStyle = '#f2b134'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 2, 7, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    ctx.fillStyle = '#b86f2d'; for (const a of [1.25, 1.5, 1.75]) { ctx.beginPath(); ctx.arc(Math.cos(Math.PI * a) * 7, 2 + Math.sin(Math.PI * a) * 7, 1.2, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  },
  drawCupcake(ctx, x, y, s, col) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(-7, -4); ctx.lineTo(7, -4); ctx.lineTo(5, 6); ctx.lineTo(-5, 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-2, -3, 2, 8); ctx.fillRect(2, -3, 2, 8);
    ctx.fillStyle = col || '#ff8fab'; ctx.beginPath(); ctx.arc(-3.5, -6, 4, 0, Math.PI * 2); ctx.arc(3.5, -6, 4, 0, Math.PI * 2); ctx.arc(0, -11, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(0, -14, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; for (let i = 0; i < 3; i++) ctx.fillRect(-4 + i * 3.5, -8 + (i % 2) * 2, 1.5, 1.5);
    ctx.restore();
  },

  // ======================= live drawing =======================
  // under the people: the oven's flicker and steam, the dough, the bell, the clouds and the bus in the window
  dynamic(r, g) {
    if (g.area !== 'bakery' || !this.st) return;
    const ctx = r.ctx, K = CFG.BAKERY, O = K.OVEN, t = g.time, st = this.st;
    const glow = 0.35 + 0.25 * Math.sin(t * 9) * Math.sin(t * 3.7);
    ctx.fillStyle = `rgba(255,236,120,${glow.toFixed(3)})`; U.roundRect(ctx, O.win.x - O.win.w / 2, O.win.y - O.win.h / 2, O.win.w, O.win.h, 6); ctx.fill();
    ctx.fillStyle = `rgba(255,159,28,${(0.08 + glow * 0.15).toFixed(3)})`; ctx.beginPath(); ctx.ellipse(O.win.x, O.y1 + 10, 70, 22, 0, 0, Math.PI * 2); ctx.fill();   // warm light on the floor
    for (let i = 0; i < 4; i++) { const age = (t * 0.45 + i * 0.25) % 1; ctx.fillStyle = `rgba(255,255,255,${(0.55 * (1 - age)).toFixed(3)})`; ctx.beginPath(); ctx.arc(O.vent.x - 4 + i * 3 + Math.sin(age * 5 + i) * 6, O.vent.y - age * 34, 3 + age * 7, 0, Math.PI * 2); ctx.fill(); }
    // the dough: squashed flat each time the baker kneads it
    const D = K.DOUGH, sq = Math.max(0, Math.sin(t * 6)) * 0.35;
    ctx.fillStyle = '#f6e7cf'; ctx.beginPath(); ctx.ellipse(D.x, D.y, 11 + sq * 8, 7 - sq * 3, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = 'rgba(43,29,20,0.3)'; ctx.lineWidth = 1; ctx.stroke();
    // the bell: a gold dome on a dark base, wobbling when rung
    const B = K.BELL, wob = st.bellT > 0 ? Math.sin(t * 40) * st.bellT * 3 : 0;
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.ellipse(B.x, B.y + 4, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(B.x, B.y + 2); ctx.rotate(wob * 0.08);
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(0, -4, 8, Math.PI, 0); ctx.fill(); ctx.fillRect(-8, -4, 16, 4); ctx.fillStyle = '#e0a800'; ctx.fillRect(-8, -1, 16, 2); ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(0, -12, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(-3, -6, 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // the window: two clouds drifting and a little bus driving along the street
    const Wd = K.WINDOW, w = Wd.x1 - Wd.x0;
    ctx.save(); ctx.beginPath(); ctx.rect(Wd.x0, Wd.y0, w, Wd.y1 - Wd.y0); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (let i = 0; i < 2; i++) { const cx = Wd.x0 + ((t * 8 + i * 90) % (w + 60)) - 30, cy = Wd.y0 + 8 + i * 6; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.arc(cx + 6, cy - 3, 6, 0, Math.PI * 2); ctx.arc(cx + 13, cy, 5, 0, Math.PI * 2); ctx.fill(); }
    const bx = Wd.x1 - ((t * 28) % (w + 120)) + 30, by = Wd.y1 - 14;
    ctx.fillStyle = '#ffd166'; U.roundRect(ctx, bx - 16, by - 11, 32, 11, 3); ctx.fill(); ctx.fillStyle = '#9fd8ff'; for (let k = 0; k < 4; k++) ctx.fillRect(bx - 13 + k * 7, by - 9, 5, 4); ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(bx - 9, by, 2.5, 0, Math.PI * 2); ctx.arc(bx + 9, by, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(Wd.x0 + 6, Wd.y0, 10, Wd.y1 - Wd.y0);   // a glint on the glass
    ctx.restore();
  },
  // y-sorted with the people: the baker, the cat and the cupcake the chef carries
  entities(r, g, items) {
    const st = this.st; if (!st) return;
    if (g.area === 'bakery') {
      items.push({ y: CFG.BAKERY.BAKER.y, draw: () => this.drawBaker(r, g) });
      items.push({ y: CFG.BAKERY.CAT.y, draw: () => this.drawCat(r, g) });
    }
    if (st.cupcake > 0 && !g.driving && !g.onTrain && !g.travel) items.push({ y: g.player.y + 0.5, draw: () => this.drawCarriedCupcake(r, g) });
  },
  drawBaker(r, g) {
    const ctx = r.ctx, K = CFG.BAKERY, B = K.BAKER, D = K.DOUGH, p = g.player, st = this.st, t = g.time, d = U.dist(p.x, p.y, B.x, B.y);
    const f = p.x < B.x ? -1 : 1, x = B.x, waving = st.wave > 0;
    // no arms reaching out: waving is a happy hop and a 👋; kneading is a little dip each time the dough squashes
    const dip = waving ? -Math.abs(Math.sin(t * 7)) * 3 : Math.max(0, Math.sin(t * 6)) * 2.5, y = B.y + dip;
    r.drawPerson(x, y, { shirt: '#fff', skin: '#e0ac69', hat: 'none', hair: '#e0ac69', hairStyle: 3, facing: f, moving: false, bob: 0, carry: 0, apron: '#f6c453', pants: '#6d4c41' });
    // the tall white toque
    ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(43,29,20,0.45)'; ctx.lineWidth = 1.5;
    U.roundRect(ctx, x - 10, y - 54, 20, 10, 3); ctx.fill(); ctx.stroke();
    U.roundRect(ctx, x - 8, y - 80, 16, 28, 3); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x - 6, y - 80, 7, 0, Math.PI * 2); ctx.arc(x + 6, y - 80, 7, 0, Math.PI * 2); ctx.arc(x, y - 85, 7.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.ellipse(x + f * 1 - 3, y - 33, 3, 1.4, 0, 0, Math.PI * 2); ctx.ellipse(x + f * 1 + 3, y - 33, 3, 1.4, 0, 0, Math.PI * 2); ctx.fill();   // mustache
    if (waving) {
      ctx.save(); ctx.translate(x + 24, y - 46); ctx.rotate(Math.sin(t * 10) * 0.3);
      ctx.font = r.font(15); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText('👋', 0, 0); ctx.restore();
      r.drawBubble(x, B.y - 100 + Math.sin(t * 4) * 3, () => { ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText('Hello! 👋', 0, 0); }, 84);
    } else {
      // kneading: a puff of flour each time the dough is pressed flat
      if (Math.sin(t * 6) > 0.96) { ctx.fillStyle = 'rgba(255,255,255,0.7)'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(D.x - 10 + i * 10, D.y - 12, 1.5, 0, Math.PI * 2); ctx.fill(); } }
      if (d < 120 && g.area === 'bakery') r.drawBubble(x, B.y - 100 + Math.sin(t * 4) * 3, () => { ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText('Fresh today! 🥐', 0, 0); }, 110);
    }
  },
  drawCat(r, g) {
    const ctx = r.ctx, C = CFG.BAKERY.CAT, t = g.time, br = Math.sin(t * 1.6) * 0.8, x = C.x, y = C.y;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x + 1, y + 6, 18, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#f4a261'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + 12, y + 2); ctx.quadraticCurveTo(x + 24, y + 4, x + 20, y - 8); ctx.stroke();   // tail
    ctx.fillStyle = '#f4a261'; ctx.beginPath(); ctx.ellipse(x + 2, y - 2, 16, 9 + br, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e4572e'; for (let i = 0; i < 3; i++) ctx.fillRect(x - 2 + i * 6, y - 10 + i * 0.5, 3, 7);   // stripes
    ctx.fillStyle = '#f4a261'; ctx.beginPath(); ctx.arc(x - 12, y - 4, 7.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 18, y - 8); ctx.lineTo(x - 17, y - 16); ctx.lineTo(x - 12, y - 10); ctx.closePath(); ctx.moveTo(x - 7, y - 9); ctx.lineTo(x - 6, y - 16); ctx.lineTo(x - 12, y - 11); ctx.closePath(); ctx.fill();   // ears
    ctx.fillStyle = '#ffb6c1'; ctx.beginPath(); ctx.arc(x - 13, y - 1, 1.5, 0, Math.PI * 2); ctx.fill();   // nose
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x - 16, y - 5, 2, 0.2, Math.PI - 0.2); ctx.stroke(); ctx.beginPath(); ctx.arc(x - 10, y - 5, 2, 0.2, Math.PI - 0.2); ctx.stroke();   // closed eyes
    ctx.lineCap = 'butt';
    const k = (t * 0.5) % 1; ctx.fillStyle = `rgba(43,29,20,${(0.7 * (1 - k)).toFixed(3)})`; ctx.font = r.font(9 + k * 5); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('z', x - 16 + k * 10, y - 20 - k * 18);
  },
  drawCarriedCupcake(r, g) {
    const ctx = r.ctx, p = g.player, f = p.facing || 1, x = p.x + f * 16, y = p.y - 18 + (p.moving ? Math.sin(p.bob || 0) * 2 : 0);
    this.drawCupcake(ctx, x, y, 1, '#ff8fab');
  },
  // over everything in the room: the lit candles on the display cake and the confetti
  overlay(r, g) {
    const st = this.st; if (!st || g.area !== 'bakery') return;
    const ctx = r.ctx, G = CFG.BAKERY.CASE;
    if (st.candles > 0) this.drawCake(ctx, G.x0 + 42, G.y1 - 4, 1, true, g.time);
    for (const c of st.confetti) {
      ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.rot); ctx.globalAlpha = c.t > c.dur - 0.4 ? (c.dur - c.t) / 0.4 : 1;
      ctx.fillStyle = c.col; ctx.fillRect(-3, -2, 6, 4); ctx.restore();
    }
    ctx.globalAlpha = 1;
  },
  screen(r, g) {
    const st = this.st; if (!st || st.fade <= 0) return;
    const ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    ctx.fillStyle = `rgba(20,12,6,${(st.fade / 0.45).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
  },
};

Game.ext.unshift(BakeryExt);
Render.ext.push(BakeryExt);
