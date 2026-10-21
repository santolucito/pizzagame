'use strict';
// The Café: City building 17 (the orange CAFE on Harbour Street) can be entered. Inside: a cosy one-room café seen from
// above, with an espresso machine that hisses steam, a barista who pours a heart into a latte whenever you order, a glass
// pastry case, a chalk menu, fairy lights and plants, round tables with chairs you can sit at (the window seat shows the
// street outside, where the City bus rolls past), a cat asleep on a chair, a tip jar to drop a coin into, three treats on
// walk-on pads (cocoa to carry, a croissant, a cake slice with confetti when it is finished) and a little stage where an
// open-mic guitarist plays a tune when you press the big button, after which the whole room claps.
// Extension module: registered with Game.ext (unshift, so the door beats the City's own buttons) and Render.ext.
// See js/EXTENSIONS.md ("Interiors": building index 17 owns the rectangle 14000..14600 × 3000..3400).
CFG.CAFE = {
  BUILDING: 17,                                   // index in CFG.CITY.BUILDINGS: { x0: 5470, y0: 620, x1: 5620, y1: 876, sign: 'CAFE' }
  DOOR_OUT: { x: 5545, y: 890 },                  // on the Harbour Street sidewalk just below the door: stand here to go in
  WORLD: { x0: 14000, y0: 3000, x1: 14600, y1: 3400 },
  ROOM: { x0: 14040, y0: 3100, x1: 14560, y1: 3340 }, WALL: 24, BACK_TOP: 3016,   // the back wall is tall: window, menu and shelves hang on it
  WINDOW: { x0: 14062, y0: 3030, x1: 14232, y1: 3090 },                            // the street outside shows through it
  MENU: { x0: 14300, y0: 3026, x1: 14418, y1: 3092 },                              // the chalk board
  SHELF: { x0: 14434, y0: 3030, x1: 14548, y1: 3092 },                             // cups, jars and bean sacks
  LIGHTS_Y: 3024,                                                                   // the fairy-light string along the top of the back wall
  COUNTER: { x0: 14290, y0: 3150, x1: 14560, y1: 3186 },                           // the barista works behind it
  FRIDGE: { x0: 14262, y0: 3100, x1: 14290, y1: 3150 },                            // a drinks fridge closes the counter's left end
  MACHINE: { x: 14318, y: 3150 },                                                   // the espresso machine on the counter
  CASE: { x0: 14346, y0: 3126, x1: 14448, y1: 3156 },                              // the glass pastry case on the counter
  CUP: { x: 14478, y: 3150 },                                                       // the latte cup the barista pours into
  JAR: { x: 14522, y: 3148, spot: { x: 14522, y: 3200 }, reach: 36 },             // the tip jar and where to stand to tip
  BARISTA: { x: 14490, y: 3132 },
  PADS: { cocoa: { x: 14318, y: 3230 }, croissant: { x: 14398, y: 3230 }, cake: { x: 14478, y: 3228 } },
  TABLES: [
    { x: 14120, y: 3156, chairs: [{ x: 14120, y: 3198, win: true }, { x: 14164, y: 3156, cat: true }] },   // the window table
    { x: 14116, y: 3276, chairs: [{ x: 14072, y: 3276, guest: true }, { x: 14160, y: 3276 }] },
    { x: 14240, y: 3262, chairs: [{ x: 14196, y: 3262 }, { x: 14284, y: 3262 }] },
  ],
  STAGE: { x0: 14440, y0: 3276, x1: 14546, y1: 3332 }, GUITARIST: { x: 14494, y: 3312 },
  BUTTON: { x: 14416, y: 3306, reach: 38 },                                        // the big red button on a stand by the stage
  PLANTS: [{ x: 14058, y: 3322 }, { x: 14246, y: 3120 }],
  EXIT: { x: 14300, y: 3322 },                                                      // the mat inside the door (the door is in the bottom wall)
  COCOA: 30, CROISSANT: 20, CAKE: 20, POUR: 2.4, SONG: 3.6, CLAP: 1.8, THANK: 2.2, HISS_EVERY: 5, HISS: 1.3, BUS_EVERY: 11,
};
CFG.AREAS.cafe = { WORLD: CFG.CAFE.WORLD };

const CafeExt = {
  name: 'cafe',
  defaults: { cafe: { seen: false, orders: 0, tips: 0, songs: 0, sits: 0 } },
  st: null,

  // ---------- state ----------
  build(g) {
    if (!g.s.cafe) g.s.cafe = { seen: false, orders: 0, tips: 0, songs: 0, sits: 0 };
    this.st = {
      fade: 0, seat: null,                              // seat: { ti, ci, t }
      cocoa: 0, croissant: 0, cake: 0,                  // seconds left on each carried treat
      pour: 0, heart: false,                            // the barista pouring; a heart sits in the cup after the pour
      thank: 0, song: 0, clap: 0, notes: [],            // the tip wave, the open-mic song, the applause, floating notes
      hissT: 2, hiss: 0, puffs: [],                     // the espresso machine's steam
      bus: null, busT: 4, clouds: [0.1, 0.55],          // the bus crossing the window (0..1), seconds to the next one, clouds
      confetti: [], zz: 0, page: 0,
      obs: this.makeObstacles(),
    };
  },
  ready(g) { if (!this.st) this.build(g); return this.st; },
  makeObstacles() {
    const K = CFG.CAFE, R = K.ROOM, w = K.WALL, o = [];
    o.push({ x: R.x0 - w, y: R.y0 - w, w: R.x1 - R.x0 + 2 * w, h: w }, { x: R.x0 - w, y: R.y1, w: R.x1 - R.x0 + 2 * w, h: w });
    o.push({ x: R.x0 - w, y: R.y0, w, h: R.y1 - R.y0 }, { x: R.x1, y: R.y0, w, h: R.y1 - R.y0 });
    o.push({ x: K.COUNTER.x0, y: K.COUNTER.y0 - 10, w: K.COUNTER.x1 - K.COUNTER.x0, h: K.COUNTER.y1 - K.COUNTER.y0 + 10 });
    o.push({ x: K.FRIDGE.x0, y: K.FRIDGE.y0, w: K.FRIDGE.x1 - K.FRIDGE.x0, h: K.FRIDGE.y1 - K.FRIDGE.y0 });
    o.push({ x: K.STAGE.x0, y: K.STAGE.y0, w: K.STAGE.x1 - K.STAGE.x0, h: K.STAGE.y1 - K.STAGE.y0 });
    o.push({ x: K.BUTTON.x - 8, y: K.BUTTON.y - 6, w: 16, h: 12 });
    for (const t of K.TABLES) o.push({ x: t.x - 20, y: t.y - 16, w: 40, h: 32 });
    for (const p of K.PLANTS) o.push({ x: p.x - 14, y: p.y - 14, w: 28, h: 26 });
    return o;
  },
  obstacles(g) { return g.area === 'cafe' ? this.ready(g).obs : []; },
  free(x, y) {
    const R = CFG.CAFE.ROOM, r = 12;
    if (x < R.x0 + r || x > R.x1 - r || y < R.y0 + r || y > R.y1 - r) return false;
    for (const o of this.st.obs) if (x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h) return false;
    return true;
  },
  onFoot(g) { return !g.driving && !g.onTrain && !g.ride && !g.travel && !g.fishing; },
  cityBusy() { return typeof CityExt !== 'undefined' && !!(CityExt.floor || (CityExt.st && (CityExt.st.cab || CityExt.st.boarding))); },
  atDoor(g) { const D = CFG.CAFE.DOOR_OUT, p = g.player; return g.area === 'city' && this.onFoot(g) && !this.cityBusy() && U.dist(p.x, p.y, D.x, D.y) < 30; },
  nearChair(g) {
    const p = g.player, T = CFG.CAFE.TABLES;
    for (let ti = 0; ti < T.length; ti++) for (let ci = 0; ci < T[ti].chairs.length; ci++) {
      const c = T[ti].chairs[ci];
      if (!c.cat && !c.guest && U.dist(p.x, p.y, c.x, c.y) < 26) return { ti, ci };
    }
    return null;
  },
  chair(s) { return CFG.CAFE.TABLES[s.ti].chairs[s.ci]; },
  catChair() { for (const t of CFG.CAFE.TABLES) for (const c of t.chairs) if (c.cat) return c; return null; },
  guestChair() { for (const t of CFG.CAFE.TABLES) for (const c of t.chairs) if (c.guest) return c; return null; },

  // ---------- game hooks ----------
  action(g) {
    const st = this.ready(g), p = g.player, K = CFG.CAFE;
    if (this.atDoor(g)) return { label: '🚪 Go inside', run: (gg) => this.enter(gg) };
    if (g.area !== 'cafe') return null;
    if (st.seat) return { label: '🚶 Stand up', run: (gg) => this.standUp(gg) };
    if (U.dist(p.x, p.y, K.EXIT.x, K.EXIT.y) < 30) return { label: '🚪 Go outside', run: (gg) => this.leave(gg) };
    if (U.dist(p.x, p.y, K.BUTTON.x, K.BUTTON.y) < K.BUTTON.reach && st.song <= 0) return { label: '🎸 Play a song!', run: (gg) => this.playSong(gg) };
    if (U.dist(p.x, p.y, K.JAR.spot.x, K.JAR.spot.y) < K.JAR.reach && g.s.cash >= 1 && st.thank <= 0) return { label: '🪙 Tip $1', run: (gg) => this.tip(gg) };
    const s = this.nearChair(g); if (s) return { label: '🪑 Sit down', run: (gg) => this.sitDown(gg, s) };
    return null;
  },
  enter(g) {
    const K = CFG.CAFE, p = g.player, st = this.ready(g);
    g.area = 'cafe'; p.x = K.EXIT.x; p.y = K.EXIT.y - 8; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    st.fade = 0.45; Sfx.ding(); Haptics.tap();
    if (!g.s.cafe.seen) { g.s.cafe.seen = true; g.toast('☕ Welcome to the café!', true); }
  },
  leave(g) {
    const K = CFG.CAFE, p = g.player, st = this.ready(g);
    g.area = 'city'; p.x = K.DOOR_OUT.x; p.y = K.DOOR_OUT.y; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    st.seat = null; st.fade = 0.45; st.confetti = []; Sfx.drop();
  },
  sitDown(g, s) {
    const c = this.chair(s), p = g.player, st = this.ready(g);
    st.seat = { ti: s.ti, ci: s.ci, t: 0 };
    p.x = c.x; p.y = c.y; p.moving = false; p.facing = c.x < CFG.CAFE.TABLES[s.ti].x ? 1 : c.x > CFG.CAFE.TABLES[s.ti].x ? -1 : 1;
    g.s.cafe.sits++;
    if (c.win && !st.bus) { st.bus = { k: -0.1 }; }   // the window seat: a bus comes along right away
    Sfx.pickup(); Haptics.tap();
  },
  standUp(g) {
    const st = this.ready(g); if (!st.seat) return;
    st.seat = null; g.player.moving = false; Sfx.drop();
  },
  tip(g) {
    const st = this.ready(g), K = CFG.CAFE, p = g.player;
    if (g.s.cash < 1) return;
    g.s.cash -= 1; g.s.cafe.tips++; st.thank = K.THANK;
    g.fx.push({ kind: 'cash', x0: p.x, y0: p.y - 30, x1: K.JAR.x, y1: K.JAR.y - 16, t: 0, dur: 0.55 });
    g.floats.push({ x: K.BARISTA.x, y: K.BARISTA.y - 70, text: 'Thank you! 👋', color: '#ffe08a', t: 0, dur: 1.6, big: true });
    Sfx.pickup(); Haptics.tap();
  },
  playSong(g) {
    const st = this.ready(g), K = CFG.CAFE;
    if (st.song > 0) return;
    st.song = K.SONG; st.notes = []; g.s.cafe.songs++;
    // a short, bright tune on the guitar
    [523, 659, 784, 659, 880, 784, 659, 523, 587, 659, 784, 1047].forEach((f, i) => setTimeout(() => Sfx.tone(f, 0.22, 'triangle', 0.045), i * 230));
    Haptics.tap();
  },
  home(g) { const st = this.ready(g); st.seat = null; st.fade = 0; st.song = 0; st.clap = 0; st.thank = 0; st.pour = 0; st.confetti = []; st.notes = []; },
  // a save or a push that left the chef in a wall or inside the furniture goes back onto the door mat
  rescue(g) {
    const p = g.player, K = CFG.CAFE;
    if (this.free(p.x, p.y)) return false;
    p.x = K.EXIT.x; p.y = K.EXIT.y - 8; p.moving = false;
    g.floats.push({ x: p.x, y: p.y - 50, text: 'Oops! Back inside', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    return true;
  },
  burst(g, x, y) {
    const st = this.st, cols = ['#ff8fab', '#ffd166', '#41b883', '#3b7dd8', '#e4572e', '#fff'];
    for (let i = 0; i < 40; i++) { const a = -Math.PI / 2 + U.rand(-1.1, 1.1), sp = U.rand(80, 220); st.confetti.push({ x: x + U.rand(-8, 8), y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, col: cols[i % cols.length], t: 0, dur: U.rand(1.1, 1.8), rot: U.rand(0, 6.3), vr: U.rand(-9, 9) }); }
  },
  update(g, dt) {
    const st = this.ready(g), p = g.player, K = CFG.CAFE;
    st.fade = Math.max(0, st.fade - dt);
    // carried treats run out wherever the chef is; the cake ends with confetti
    st.cocoa = Math.max(0, st.cocoa - dt);
    if (st.croissant > 0) { st.croissant = Math.max(0, st.croissant - dt); if (st.croissant === 0) g.floats.push({ x: p.x, y: p.y - 60, text: 'Yum! 🥐', color: '#ffe08a', t: 0, dur: 1.4, big: true }); }
    if (st.cake > 0) {
      st.cake = Math.max(0, st.cake - dt);
      if (st.cake === 0) { this.burst(g, p.x, p.y - 30); g.floats.push({ x: p.x, y: p.y - 70, text: 'All gone! 🎉', color: '#ffe08a', t: 0, dur: 1.6, big: true }); Sfx.chime(); Haptics.success(); }
    }
    if (st.confetti.length) {
      for (const c of st.confetti) { c.t += dt; c.x += c.vx * dt; c.y += c.vy * dt; c.vy += 260 * dt; c.vx *= 0.985; c.rot += c.vr * dt; }
      st.confetti = st.confetti.filter((c) => c.t < c.dur);
    }
    if (g.area !== 'cafe') { if (st.seat) st.seat = null; st.song = 0; st.clap = 0; st.thank = 0; return; }
    if (st.seat) { const c = this.chair(st.seat); st.seat.t += dt; p.x = c.x; p.y = c.y; p.moving = false; }
    else this.rescue(g);
    // the barista pours the latte art
    if (st.pour > 0) { st.pour = Math.max(0, st.pour - dt); if (st.pour === 0) { st.heart = true; g.floats.push({ x: K.CUP.x, y: K.CUP.y - 34, text: '♥', color: '#ff5c8a', t: 0, dur: 1.2, big: true }); } }
    st.thank = Math.max(0, st.thank - dt);
    // the open-mic song, then applause
    if (st.song > 0) {
      st.song = Math.max(0, st.song - dt);
      st.noteT = (st.noteT || 0) - dt;
      if (st.noteT <= 0) { st.noteT = 0.3; st.notes.push({ x: K.GUITARIST.x + U.rand(-8, 8), y: K.GUITARIST.y - 48, ch: U.pick(['♪', '♫', '♩']), t: 0 }); }
      if (st.song === 0) { st.clap = K.CLAP; for (const [x, y] of this.clappers(g)) g.floats.push({ x, y, text: '👏', color: '#ffe08a', t: 0, dur: 1.5, big: true }); Haptics.success(); }
    }
    st.clap = Math.max(0, st.clap - dt);
    for (const n of st.notes) n.t += dt;
    st.notes = st.notes.filter((n) => n.t < 1.6);
    // the espresso machine hisses now and then
    st.hissT -= dt;
    if (st.hissT <= 0) { st.hissT = K.HISS_EVERY + U.rand(0, 2); st.hiss = K.HISS; }
    if (st.hiss > 0) { st.hiss = Math.max(0, st.hiss - dt); if (Math.random() < dt * 16) st.puffs.push({ x: K.MACHINE.x + 22, y: K.MACHINE.y - 36, vx: U.rand(10, 26), t: 0, dur: U.rand(0.8, 1.2) }); }
    for (const q of st.puffs) { q.t += dt; q.x += q.vx * dt; q.y -= 22 * dt; }
    st.puffs = st.puffs.filter((q) => q.t < q.dur);
    // the street in the window: clouds drift, the bus rolls past
    for (let i = 0; i < st.clouds.length; i++) { st.clouds[i] += dt * 0.012; if (st.clouds[i] > 1.2) st.clouds[i] -= 1.4; }
    if (st.bus) { st.bus.k += dt * 0.16; if (st.bus.k > 1.15) { st.bus = null; st.busT = K.BUS_EVERY; } }
    else { st.busT -= dt; if (st.busT <= 0) st.bus = { k: -0.1 }; }
    st.zz += dt; st.page += dt;
  },
  clappers(g) {
    const K = CFG.CAFE, gc = this.guestChair(), out = [[K.BARISTA.x, K.BARISTA.y - 66], [gc.x, gc.y - 66]];
    if (this.st.seat) out.push([g.player.x, g.player.y - 70]);
    return out;
  },
  pads(g) {
    if (g.area !== 'cafe') return [];
    const P = CFG.CAFE.PADS;
    return [
      { key: 'cafeCocoa', label: 'Cocoa', ico: '☕', pos: P.cocoa, price: 4, sub: 'hot!' },
      { key: 'cafeCroissant', label: 'Croissant', ico: '🥐', pos: P.croissant, price: 3, sub: 'flaky!' },
      { key: 'cafeCake', label: 'Cake slice', ico: '🍰', pos: P.cake, price: 6, sub: 'yum!' },
    ];
  },
  onPad(g, pad) {
    const st = this.ready(g), K = CFG.CAFE, p = g.player;
    let text = null;
    if (pad.key === 'cafeCocoa') { st.cocoa = K.COCOA; text = 'Hot cocoa! ☕'; }
    else if (pad.key === 'cafeCroissant') { st.croissant = K.CROISSANT; text = 'A croissant! 🥐'; }
    else if (pad.key === 'cafeCake') { st.cake = K.CAKE; text = 'Cake! 🍰'; }
    else return;
    g.s.cafe.orders++; st.pour = K.POUR; st.heart = false;   // every order gets the barista pouring a fresh heart
    g.floats.push({ x: p.x, y: p.y - 60, text, color: '#ffe08a', t: 0, dur: 1.5, big: true });
    Haptics.success();
  },
  hint(g) {
    const st = this.ready(g), p = g.player, K = CFG.CAFE, s = g.s.cafe;
    if (g.area === 'city') {
      if (!this.onFoot(g) || this.cityBusy()) return undefined;
      const d = U.dist(p.x, p.y, K.DOOR_OUT.x, K.DOOR_OUT.y);
      if (d < 70) return { text: 'Go inside the café ☕', target: d < 30 ? null : K.DOOR_OUT };
      return undefined;
    }
    if (g.area !== 'cafe') return undefined;
    if (st.song > 0) return { text: 'La la la! 🎸', target: null };
    if (st.clap > 0) return { text: 'Clap clap! 👏', target: null };
    if (st.seat) {
      const c = this.chair(st.seat);
      if (c.win && st.bus && st.bus.k > 0 && st.bus.k < 1) return { text: 'Look, the bus! 🚌', target: null };
      return { text: 'Cosy! Press the button to stand up ☕', target: null };
    }
    if (st.thank > 0) return { text: 'The barista says thank you! 👋', target: null };
    if (st.pour > 0) return { text: 'Watch the barista pour a heart ♥', target: null };
    const cat = this.catChair();
    if (U.dist(p.x, p.y, cat.x, cat.y) < 60) return { text: 'Shh… the cat is napping 🐱', target: null };
    if (U.dist(p.x, p.y, K.BUTTON.x, K.BUTTON.y) < K.BUTTON.reach) return { text: 'Press the button for a song! 🎸', target: null };
    if (U.dist(p.x, p.y, K.JAR.spot.x, K.JAR.spot.y) < K.JAR.reach && g.s.cash >= 1) return { text: 'Drop a coin in the tip jar 🪙', target: null };
    if (!s.orders && g.s.cash + (g.s.padPaid.cafeCocoa || 0) >= 4) return { text: 'Order a hot cocoa at the counter! ☕', target: K.PADS.cocoa };
    if (st.cocoa > 0 && !s.sits) return { text: 'Have a seat by the window 🪑', target: K.TABLES[0].chairs[0] };
    if (!s.songs) return { text: 'Press the button by the stage for a song 🎸', target: K.BUTTON };
    if (st.cocoa > 0) return { text: 'Mmm, hot cocoa! ☕', target: null };
    if (st.cake > 0) return { text: 'Mmm, cake! 🍰', target: null };
    return { text: 'Cosy café ☕', target: null };
  },

  // ---------- the City outside: the sign, an A-board and fairy lights under the awning ----------
  bld() { return CFG.CITY.BUILDINGS[CFG.CAFE.BUILDING]; },
  paintAfter(r, g, area) {
    if (area !== 'city') return;
    const ctx = r.ctx, b = this.bld(), cx = (b.x0 + b.x1) / 2, gy = b.y1 - 40, sign = '☕ CAFE';
    ctx.font = r.font(10); const tw = ctx.measureText(sign).width + 18;
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, cx - tw / 2, gy - 22, tw, 18, 4); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(sign, cx, gy - 13);
    // a little chalk A-board on the sidewalk right of the door, and a mat in front of it
    const D = CFG.CAFE.DOOR_OUT, ax = D.x + 44, ay = D.y - 2;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(ax - 9, ay + 2, 20, 6);
    ctx.fillStyle = '#8d5a2b'; ctx.beginPath(); ctx.moveTo(ax - 10, ay + 6); ctx.lineTo(ax, ay - 18); ctx.lineTo(ax + 10, ay + 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2b2b2b'; ctx.fillRect(ax - 7, ay - 12, 14, 16);
    ctx.fillStyle = '#fff8ee'; ctx.fillRect(ax - 4, ay - 8, 8, 1.5); ctx.fillRect(ax - 4, ay - 4, 6, 1.5); ctx.fillRect(ax - 4, ay, 7, 1.5);
    ctx.fillStyle = '#b8401c'; U.roundRect(ctx, D.x - 16, D.y - 6, 32, 10, 2); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(6); ctx.fillText('WELCOME', D.x, D.y - 1);
  },

  // ---------- the interior, static ----------
  paint: { cafe(r, g) { CafeExt.paintRoom(r, g); } },
  paintRoom(r, g) {
    const ctx = r.ctx, K = CFG.CAFE, W = K.WORLD, R = K.ROOM, w = K.WALL;
    // outside the café: dark slate with a faint tile pattern
    ctx.fillStyle = '#3a4a5c'; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.04)'; for (let y = W.y0; y < W.y1; y += 40) for (let x = W.x0 + ((y / 40) % 2) * 20; x < W.x1; x += 40) ctx.fillRect(x, y, 38, 38);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(R.x0 - w + 8, K.BACK_TOP + 10, R.x1 - R.x0 + 2 * w, R.y1 + w - K.BACK_TOP);
    // warm wooden floorboards
    ctx.fillStyle = '#c9925a'; ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0);
    for (let y = R.y0, j = 0; y < R.y1; y += 16, j++) {
      ctx.fillStyle = j % 2 ? '#c38b52' : '#cf9a62'; ctx.fillRect(R.x0, y, R.x1 - R.x0, Math.min(16, R.y1 - y));
      ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(R.x0, y + 15, R.x1 - R.x0, 1);
      for (let x = R.x0 + ((j * 53) % 120); x < R.x1; x += 120) ctx.fillRect(x, y, 1, 16);
    }
    // a round rug under the window table
    const T0 = K.TABLES[0];
    ctx.fillStyle = '#b8401c'; ctx.beginPath(); ctx.ellipse(T0.x, T0.y + 10, 64, 46, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffcc80'; ctx.beginPath(); ctx.ellipse(T0.x, T0.y + 10, 52, 36, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b8401c'; ctx.beginPath(); ctx.ellipse(T0.x, T0.y + 10, 40, 26, 0, 0, Math.PI * 2); ctx.fill();
    // walls: a tall cream back wall with a brick band; wooden side and bottom walls
    ctx.fillStyle = '#fff1d6'; ctx.fillRect(R.x0 - w, K.BACK_TOP, R.x1 - R.x0 + 2 * w, R.y0 - K.BACK_TOP);
    ctx.fillStyle = '#d9a066'; ctx.fillRect(R.x0 - w, R.y0 - 14, R.x1 - R.x0 + 2 * w, 14);
    ctx.fillStyle = 'rgba(0,0,0,0.1)'; for (let x = R.x0 - w; x < R.x1 + w; x += 18) { ctx.fillRect(x, R.y0 - 14, 1, 7); ctx.fillRect(x + 9, R.y0 - 7, 1, 7); } ctx.fillRect(R.x0 - w, R.y0 - 7, R.x1 - R.x0 + 2 * w, 1);
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(R.x0 - w, R.y0 - 4, R.x1 - R.x0 + 2 * w, 4);
    ctx.fillStyle = '#b5773a'; ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, w); ctx.fillRect(R.x0 - w, R.y0, w, R.y1 - R.y0); ctx.fillRect(R.x1, R.y0, w, R.y1 - R.y0);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = R.x0 - w; x < R.x1 + w; x += 16) ctx.fillRect(x, R.y1, 2, w); for (let y = R.y0; y < R.y1; y += 16) { ctx.fillRect(R.x0 - w, y, w, 2); ctx.fillRect(R.x1, y, w, 2); }
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, 3); ctx.fillRect(R.x0 - w, R.y0, 3, R.y1 - R.y0); ctx.fillRect(R.x1 + w - 3, R.y0, 3, R.y1 - R.y0);
    // the window frame (the street is drawn live inside it)
    const Wn = K.WINDOW;
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, Wn.x0 - 6, Wn.y0 - 6, Wn.x1 - Wn.x0 + 12, Wn.y1 - Wn.y0 + 12, 5); ctx.fill();
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(Wn.x0 - 10, Wn.y1 + 4, Wn.x1 - Wn.x0 + 20, 6);   // sill
    for (let i = 0; i < 3; i++) { ctx.fillStyle = ['#ff8fab', '#ffd166', '#ff6b6b'][i]; ctx.beginPath(); ctx.arc(Wn.x0 + 26 + i * 10, Wn.y1 + 1, 3.5, 0, Math.PI * 2); ctx.fill(); }   // flowers in a sill box
    ctx.fillStyle = '#b86f2d'; ctx.fillRect(Wn.x0 + 14, Wn.y1 + 2, 36, 5);
    // the chalk menu
    const M = K.MENU;
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, M.x0 - 5, M.y0 - 5, M.x1 - M.x0 + 10, M.y1 - M.y0 + 10, 4); ctx.fill();
    ctx.fillStyle = '#2f3b2f'; ctx.fillRect(M.x0, M.y0, M.x1 - M.x0, M.y1 - M.y0);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff8ee'; ctx.font = r.font(10); ctx.fillText('~ MENU ~', (M.x0 + M.x1) / 2, M.y0 + 11);
    ctx.font = r.font(8); ctx.textAlign = 'left';
    ctx.fillStyle = '#ffe08a'; ctx.fillText('☕ Cocoa', M.x0 + 8, M.y0 + 27); ctx.fillText('🥐 Croissant', M.x0 + 8, M.y0 + 41); ctx.fillText('🍰 Cake slice', M.x0 + 8, M.y0 + 55);
    ctx.textAlign = 'right'; ctx.fillStyle = '#fff8ee'; ctx.fillText('$4', M.x1 - 8, M.y0 + 27); ctx.fillText('$3', M.x1 - 8, M.y0 + 41); ctx.fillText('$6', M.x1 - 8, M.y0 + 55);
    ctx.strokeStyle = 'rgba(255,248,238,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(M.x0 + 10, M.y0 + 18); ctx.lineTo(M.x1 - 10, M.y0 + 18); ctx.stroke();
    // shelves with cups, jars and bean sacks
    const S = K.SHELF, cols = ['#e4572e', '#3b7dd8', '#41b883', '#ffd166', '#ff8fab', '#8e5bd1'];
    for (let row = 0; row < 2; row++) {
      const sy = S.y0 + 26 + row * 30;
      ctx.fillStyle = '#8d5a2b'; ctx.fillRect(S.x0, sy, S.x1 - S.x0, 5); ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(S.x0, sy + 5, S.x1 - S.x0, 2);
      if (row === 0) {
        for (let i = 0; i < 6; i++) { const x = S.x0 + 8 + i * 18; ctx.fillStyle = cols[i % cols.length]; U.roundRect(ctx, x, sy - 11, 12, 11, 3); ctx.fill(); ctx.strokeStyle = cols[i % cols.length]; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + 13, sy - 6, 3, -Math.PI / 2, Math.PI / 2); ctx.stroke(); }   // mugs
      } else {
        for (let i = 0; i < 3; i++) { const x = S.x0 + 10 + i * 20; ctx.fillStyle = 'rgba(159,216,255,0.55)'; U.roundRect(ctx, x, sy - 16, 14, 16, 3); ctx.fill(); ctx.fillStyle = ['#6b3e1e', '#b8401c', '#ffd166'][i]; ctx.fillRect(x + 2, sy - 8, 10, 7); ctx.fillStyle = '#8d5a2b'; ctx.fillRect(x + 1, sy - 19, 12, 4); }   // jars of beans and sugar
        for (let i = 0; i < 1; i++) { const x = S.x0 + 80 + i * 32; ctx.fillStyle = '#c9a26b'; U.roundRect(ctx, x, sy - 18, 24, 18, 5); ctx.fill(); ctx.fillStyle = '#8d5a2b'; ctx.fillRect(x + 4, sy - 20, 16, 4); ctx.fillStyle = '#6b3e1e'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.fillText('BEANS', x + 12, sy - 8); }   // bean sacks
      }
    }
    // the fairy-light string across the back wall (the bulbs twinkle live)
    ctx.strokeStyle = '#4a6b3a'; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let x = R.x0 - w; x <= R.x1 + w; x += 4) { const y = K.LIGHTS_Y + Math.sin((x - R.x0) / 36) * 3; if (x === R.x0 - w) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    ctx.stroke();
    // the drinks fridge at the counter's end
    const F = K.FRIDGE;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(F.x0 + 3, F.y0 + 4, F.x1 - F.x0, F.y1 - F.y0);
    ctx.fillStyle = '#9aa0a8'; U.roundRect(ctx, F.x0, F.y0 - 30, F.x1 - F.x0, F.y1 - F.y0 + 30, 4); ctx.fill();
    ctx.fillStyle = '#bfe3ff'; ctx.fillRect(F.x0 + 3, F.y0 - 26, F.x1 - F.x0 - 6, F.y1 - F.y0 + 22);
    for (let k = 0; k < 3; k++) { ctx.fillStyle = '#c9ccd2'; ctx.fillRect(F.x0 + 3, F.y0 - 10 + k * 18, F.x1 - F.x0 - 6, 2); for (let i = 0; i < 3; i++) { ctx.fillStyle = ['#e4572e', '#41b883', '#ffd166'][(i + k) % 3]; ctx.fillRect(F.x0 + 5 + i * 7, F.y0 - 20 + k * 18, 5, 9); } }
    // the stage: a raised wooden platform with a red curtain backdrop and a little stool
    const Sg = K.STAGE;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(Sg.x0 + 4, Sg.y0 + 6, Sg.x1 - Sg.x0, Sg.y1 - Sg.y0);
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, Sg.x0, Sg.y0, Sg.x1 - Sg.x0, Sg.y1 - Sg.y0, 6); ctx.fill();
    ctx.fillStyle = '#a86b36'; U.roundRect(ctx, Sg.x0 + 4, Sg.y0 + 4, Sg.x1 - Sg.x0 - 8, Sg.y1 - Sg.y0 - 14, 5); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.1)'; for (let y = Sg.y0 + 12; y < Sg.y1 - 12; y += 10) ctx.fillRect(Sg.x0 + 6, y, Sg.x1 - Sg.x0 - 12, 1);
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(Sg.x0 + 2, Sg.y1 - 10, Sg.x1 - Sg.x0 - 4, 8);   // the front step
    ctx.fillStyle = '#c62828'; for (let i = 0; i < 6; i++) ctx.fillRect(Sg.x0 + 6 + i * 16, Sg.y0 - 2, 12, 10);   // a scalloped bunting edge over the back
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffe08a'; U.roundRect(ctx, Sg.x0 + 20, Sg.y1 - 9, Sg.x1 - Sg.x0 - 40, 7, 2); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.fillText('OPEN MIC', (Sg.x0 + Sg.x1) / 2, Sg.y1 - 5.5);
    const Gt = K.GUITARIST; ctx.fillStyle = '#5b3a1a'; ctx.fillRect(Gt.x - 10, Gt.y - 6, 20, 5); ctx.fillRect(Gt.x - 8, Gt.y - 2, 3, 8); ctx.fillRect(Gt.x + 5, Gt.y - 2, 3, 8);   // the stool
    // the big red button on its stand by the stage
    const Bt = K.BUTTON;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(Bt.x + 2, Bt.y + 7, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5c6670'; U.roundRect(ctx, Bt.x - 8, Bt.y - 16, 16, 22, 3); ctx.fill(); ctx.fillStyle = '#9aa0a8'; ctx.fillRect(Bt.x - 6, Bt.y - 14, 12, 3);
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(Bt.x, Bt.y - 22, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(Bt.x, Bt.y - 23, 6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(Bt.x - 2, Bt.y - 25, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(9); ctx.fillText('🎸', Bt.x, Bt.y - 3);
    // potted plants in the corners
    for (const P of K.PLANTS) {
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(P.x + 2, P.y + 12, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#b86f2d'; U.roundRect(ctx, P.x - 11, P.y - 4, 22, 16, 4); ctx.fill(); ctx.fillStyle = '#8d5a2b'; ctx.fillRect(P.x - 12, P.y - 6, 24, 4);
      ctx.fillStyle = '#3f9a4a'; ctx.beginPath(); ctx.arc(P.x, P.y - 14, 12, 0, Math.PI * 2); ctx.arc(P.x - 10, P.y - 8, 8, 0, Math.PI * 2); ctx.arc(P.x + 10, P.y - 8, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#56b862'; ctx.beginPath(); ctx.arc(P.x - 3, P.y - 18, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff8fab'; ctx.beginPath(); ctx.arc(P.x + 6, P.y - 16, 2.5, 0, Math.PI * 2); ctx.fill();
    }
    // a hanging plant on the right wall, a framed picture on the left wall
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, R.x0 - w + 2, R.y0 + 40, 18, 22, 2); ctx.fill(); ctx.fillStyle = '#9fd8ff'; ctx.fillRect(R.x0 - w + 5, R.y0 + 43, 12, 16); ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(R.x0 - w + 11, R.y0 + 49, 3, 0, Math.PI * 2); ctx.fill();
    // chair seats (the backs are drawn live so they sort with the chef)
    for (const t of K.TABLES) for (const c of t.chairs) {
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(c.x + 2, c.y + 5, 14, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8d5a2b'; ctx.beginPath(); ctx.ellipse(c.x, c.y + 2, 13, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.ellipse(c.x, c.y, 11, 6, 0, 0, Math.PI * 2); ctx.fill();
    }
    // the door in the bottom wall, its mat, and the café's name plate below
    const E = K.EXIT;
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(E.x - 22, R.y1, 44, w); ctx.fillStyle = '#bfe3ff'; ctx.fillRect(E.x - 16, R.y1 + 4, 32, 10); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(E.x + 14, R.y1 + 17, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b8401c'; U.roundRect(ctx, E.x - 21, E.y - 8, 42, 14, 3); ctx.fill(); ctx.fillStyle = '#ffcc80'; U.roundRect(ctx, E.x - 18, E.y - 5, 36, 8, 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('EXIT', E.x, E.y - 1);
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, (R.x0 + R.x1) / 2 - 40, R.y1 + w + 4, 80, 14, 4); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.fillText('☕ CAFÉ ☕', (R.x0 + R.x1) / 2, R.y1 + w + 11);
  },

  // ---------- moving things ----------
  drawOutside(r, g) {
    const ctx = r.ctx, W = CFG.CAFE.WORLD, x0 = r.camX - 20, y0 = r.camY - 20, x1 = r.camX + r.viewW + 20, y1 = r.camY + r.viewH + 20;
    ctx.fillStyle = '#3a4a5c';
    if (y0 < W.y0) ctx.fillRect(x0, y0, x1 - x0, W.y0 - y0);
    if (y1 > W.y1) ctx.fillRect(x0, W.y1, x1 - x0, y1 - W.y1);
    if (x0 < W.x0) ctx.fillRect(x0, W.y0, W.x0 - x0, W.y1 - W.y0);
    if (x1 > W.x1) ctx.fillRect(W.x1, W.y0, x1 - W.x1, W.y1 - W.y0);
  },
  // the street through the window: sky, far buildings, the road and the City bus rolling by
  drawWindow(r, g) {
    const ctx = r.ctx, Wn = CFG.CAFE.WINDOW, st = this.st, w = Wn.x1 - Wn.x0, h = Wn.y1 - Wn.y0;
    ctx.save(); ctx.beginPath(); ctx.rect(Wn.x0, Wn.y0, w, h); ctx.clip();
    const sky = ctx.createLinearGradient(0, Wn.y0, 0, Wn.y1); sky.addColorStop(0, '#7ec8f5'); sky.addColorStop(1, '#cdeaff');
    ctx.fillStyle = sky; ctx.fillRect(Wn.x0, Wn.y0, w, h);
    ctx.fillStyle = '#fff'; for (const c of st.clouds) { const x = Wn.x0 + c * w, y = Wn.y0 + 10; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.arc(x + 7, y - 3, 7, 0, Math.PI * 2); ctx.arc(x + 15, y, 6, 0, Math.PI * 2); ctx.fill(); }
    const bcols = ['#e8a0bf', '#7fc8f8', '#f6c453', '#b39ddb', '#ef8a62', '#a5d6a7'];
    for (let i = 0; i < 7; i++) { const bx = Wn.x0 + i * 26, bh = 18 + ((i * 7) % 3) * 6; ctx.fillStyle = bcols[i % bcols.length]; ctx.fillRect(bx, Wn.y1 - 22 - bh, 22, bh); ctx.fillStyle = '#fff3b0'; for (let k = 0; k < 2; k++) ctx.fillRect(bx + 4 + k * 9, Wn.y1 - 18 - bh + 4, 5, 5); }
    ctx.fillStyle = '#b9b2a4'; ctx.fillRect(Wn.x0, Wn.y1 - 22, w, 5);   // sidewalk
    ctx.fillStyle = '#5c6670'; ctx.fillRect(Wn.x0, Wn.y1 - 17, w, 17);   // road
    ctx.fillStyle = '#ffd166'; for (let x = Wn.x0 + 4; x < Wn.x1; x += 16) ctx.fillRect(x, Wn.y1 - 8, 8, 1.5);
    if (st.bus) {
      const bx = Wn.x1 + 30 - st.bus.k * (w + 60), by = Wn.y1 - 11, bob = Math.sin(g.time * 12) * 0.6;
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(bx - 22, by + 4, 48, 3);
      ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, bx - 24, by - 12 + bob, 48, 17, 4); ctx.fill();
      ctx.fillStyle = '#ffd166'; ctx.fillRect(bx - 22, by - 3 + bob, 44, 2);
      ctx.fillStyle = '#bfe3ff'; for (let k = 0; k < 4; k++) ctx.fillRect(bx - 20 + k * 11, by - 9 + bob, 8, 5);
      ctx.fillStyle = '#1e1e1e'; ctx.beginPath(); ctx.arc(bx - 14, by + 5, 3, 0, Math.PI * 2); ctx.arc(bx + 14, by + 5, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff6b0'; ctx.fillRect(bx - 25, by - 1 + bob, 2, 3);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(Wn.x0, Wn.y0, w, h);
    ctx.restore();
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(Wn.x0 + w / 2 - 2, Wn.y0, 4, h); ctx.fillRect(Wn.x0, Wn.y0 + h / 2 - 2, w, 4);   // the window's cross bars
  },
  drawLights(r, g) {
    const ctx = r.ctx, K = CFG.CAFE, R = K.ROOM, w = K.WALL, t = g.time, cols = ['#ffd166', '#ff8fab', '#9fd8ff', '#c5e1a5'];
    let i = 0;
    for (let x = R.x0 - w + 10; x < R.x1 + w; x += 22, i++) {
      const y = K.LIGHTS_Y + Math.sin((x - R.x0) / 36) * 3 + 4, on = 0.55 + 0.45 * Math.sin(t * 3 + i * 1.3);
      ctx.fillStyle = cols[i % cols.length];
      ctx.globalAlpha = 0.25 * on; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.5 + 0.5 * on; ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  },
  drawChairBack(r, g, t, c) {
    const ctx = r.ctx;
    if (c.y > t.y + 10) { ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, c.x - 12, c.y - 2, 24, 6, 3); ctx.fill(); ctx.fillStyle = '#a86b36'; ctx.fillRect(c.x - 10, c.y - 1, 20, 2); }   // facing away from us: a low back rail across the front
    else { const dx = c.x < t.x ? -13 : 13; ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, c.x + dx - 3, c.y - 30, 6, 34, 3); ctx.fill(); ctx.fillStyle = '#a86b36'; ctx.fillRect(c.x + dx - 1, c.y - 28, 2, 28); }
  },
  drawTable(r, g, t) {
    const ctx = r.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(t.x + 3, t.y + 10, 22, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5b3a1a'; ctx.beginPath(); ctx.ellipse(t.x, t.y + 8, 10, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(t.x - 3, t.y - 10, 6, 18);   // pedestal
    ctx.fillStyle = '#8d5a2b'; ctx.beginPath(); ctx.ellipse(t.x, t.y - 10, 22, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff8ee'; ctx.beginPath(); ctx.ellipse(t.x, t.y - 12, 20, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e4572e'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(t.x - 12 + k * 6, t.y - 12 + ((k % 2) ? 4 : -4), 1.5, 0, Math.PI * 2); ctx.fill(); }   // a dotty tablecloth
    ctx.fillStyle = '#bfe3ff'; U.roundRect(ctx, t.x - 4, t.y - 22, 8, 10, 2); ctx.fill(); ctx.fillStyle = '#ff8fab'; ctx.beginPath(); ctx.arc(t.x, t.y - 25, 3, 0, Math.PI * 2); ctx.fill();   // a little vase with a flower
  },
  drawCounter(r, g) {
    const ctx = r.ctx, K = CFG.CAFE, C = K.COUNTER, st = this.st, t = g.time;
    // the counter: wooden front with panels, a cream top
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(C.x0 + 4, C.y0 + 6, C.x1 - C.x0, C.y1 - C.y0);
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, C.x0, C.y0, C.x1 - C.x0, C.y1 - C.y0, 5); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; for (let x = C.x0 + 8; x < C.x1 - 6; x += 18) ctx.fillRect(x, C.y0 + 14, 10, C.y1 - C.y0 - 18);
    ctx.fillStyle = '#f6e7cf'; U.roundRect(ctx, C.x0 - 2, C.y0 - 10, C.x1 - C.x0 + 4, 18, 5); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(C.x0 - 2, C.y0 + 4, C.x1 - C.x0 + 4, 4);
    // the espresso machine: chrome body, a red top, dials, a portafilter and the steam wand
    const Mc = K.MACHINE, mx = Mc.x, my = Mc.y - 4;
    ctx.fillStyle = '#c9ccd2'; U.roundRect(ctx, mx - 22, my - 40, 44, 40, 5); ctx.fill();
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, mx - 22, my - 44, 44, 10, 4); ctx.fill();
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(mx - 18, my - 24, 36, 4); ctx.fillRect(mx - 6, my - 20, 12, 8);
    ctx.fillStyle = '#2d3a4a'; ctx.beginPath(); ctx.arc(mx - 12, my - 32, 3.5, 0, Math.PI * 2); ctx.arc(mx + 12, my - 32, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = st.hiss > 0 ? '#ff5252' : '#41b883'; ctx.beginPath(); ctx.arc(mx, my - 32, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; U.roundRect(ctx, mx - 6, my - 10, 12, 8, 2); ctx.fill();   // a cup under the spout
    ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(mx + 20, my - 34); ctx.lineTo(mx + 26, my - 22); ctx.stroke();   // steam wand
    for (const q of st.puffs) { const k = q.t / q.dur; ctx.fillStyle = `rgba(255,255,255,${(0.7 * (1 - k)).toFixed(2)})`; ctx.beginPath(); ctx.arc(q.x, q.y, 3 + k * 6, 0, Math.PI * 2); ctx.fill(); }
    // the glass pastry case with croissants, cake slices and cupcakes
    const Cs = K.CASE;
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(Cs.x0, Cs.y1 - 4, Cs.x1 - Cs.x0, 4);
    ctx.fillStyle = 'rgba(191,227,255,0.55)'; U.roundRect(ctx, Cs.x0, Cs.y0, Cs.x1 - Cs.x0, Cs.y1 - Cs.y0 - 2, 5); ctx.fill();
    ctx.fillStyle = '#fff8ee'; ctx.fillRect(Cs.x0 + 3, Cs.y0 + 12, Cs.x1 - Cs.x0 - 6, 2);
    for (let i = 0; i < 4; i++) this.drawCroissant(ctx, Cs.x0 + 12 + i * 12, Cs.y0 + 8, 0.7);
    for (let i = 0; i < 2; i++) this.drawCake(ctx, Cs.x0 + 64 + i * 18, Cs.y0 + 9, 0.7, ['#ff8fab', '#ffd166'][i]);
    for (let i = 0; i < 5; i++) this.drawCroissant(ctx, Cs.x0 + 10 + i * 12, Cs.y0 + 22, 0.7);
    for (let i = 0; i < 2; i++) this.drawCake(ctx, Cs.x0 + 66 + i * 18, Cs.y0 + 23, 0.7, ['#c5e1a5', '#ff8fab'][i]);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5; U.roundRect(ctx, Cs.x0, Cs.y0, Cs.x1 - Cs.x0, Cs.y1 - Cs.y0 - 2, 5); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(Cs.x0 + 8, Cs.y1 - 8); ctx.lineTo(Cs.x0 + 24, Cs.y0 + 4); ctx.stroke();
    // the latte cup: the barista pours, then a heart floats in the foam
    const Cp = K.CUP, cy = Cp.y - 6;
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(Cp.x + 1, cy + 3, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(Cp.x, cy + 1, 11, 4, 0, 0, Math.PI * 2); ctx.fill();   // saucer
    ctx.fillStyle = '#fff'; U.roundRect(ctx, Cp.x - 8, cy - 12, 16, 13, 4); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(Cp.x + 10, cy - 6, 3.5, -Math.PI / 2, Math.PI / 2); ctx.stroke();
    ctx.fillStyle = '#b86f2d'; ctx.beginPath(); ctx.ellipse(Cp.x, cy - 12, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
    const pourK = st.pour > 0 ? 1 - st.pour / K.POUR : 1, heartK = st.heart ? 1 : U.clamp((pourK - 0.45) / 0.45, 0, 1);
    if (st.pour > 0) {
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(Cp.x, cy - 12, 7 * Math.min(1, pourK * 2), 3 * Math.min(1, pourK * 2), 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f6e7cf'; ctx.beginPath(); ctx.moveTo(Cp.x - 1, cy - 34); ctx.lineTo(Cp.x + 1, cy - 34); ctx.lineTo(Cp.x + 0.5 + Math.sin(t * 20) * 0.5, cy - 13); ctx.lineTo(Cp.x - 0.5, cy - 13); ctx.closePath(); ctx.fill();   // the milk stream
      ctx.fillStyle = '#9aa0a8'; U.roundRect(ctx, Cp.x - 8, cy - 46, 14, 12, 3); ctx.fill(); ctx.fillStyle = '#c9ccd2'; ctx.beginPath(); ctx.moveTo(Cp.x + 6, cy - 44); ctx.lineTo(Cp.x + 12, cy - 42); ctx.lineTo(Cp.x + 6, cy - 38); ctx.closePath(); ctx.fill();   // the milk jug
    } else if (st.heart) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(Cp.x, cy - 12, 7, 3, 0, 0, Math.PI * 2); ctx.fill(); }
    if (heartK > 0) {
      const s = heartK * 3.2; ctx.fillStyle = '#b86f2d'; ctx.save(); ctx.translate(Cp.x, cy - 13); ctx.scale(s, s * 0.6);
      ctx.beginPath(); ctx.moveTo(0, 1); ctx.bezierCurveTo(-1.6, -0.6, -1, -2, 0, -1); ctx.bezierCurveTo(1, -2, 1.6, -0.6, 0, 1); ctx.fill(); ctx.restore();
    }
    // the tip jar: a glass jar with coins and a TIPS label
    const J = K.JAR, jy = J.y - 4;
    ctx.fillStyle = 'rgba(159,216,255,0.55)'; U.roundRect(ctx, J.x - 10, jy - 22, 20, 24, 4); ctx.fill();
    const coins = Math.min(6, 1 + (g.s.cafe ? g.s.cafe.tips : 0));
    ctx.fillStyle = '#ffd166'; for (let i = 0; i < coins; i++) { ctx.beginPath(); ctx.ellipse(J.x - 4 + (i % 2) * 7, jy - 2 - Math.floor(i / 2) * 4, 4, 2, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 1.5; U.roundRect(ctx, J.x - 10, jy - 22, 20, 24, 4); ctx.stroke(); ctx.fillStyle = '#8d5a2b'; ctx.fillRect(J.x - 11, jy - 25, 22, 4);
    ctx.fillStyle = '#fff8ee'; ctx.fillRect(J.x - 8, jy - 12, 16, 7); ctx.fillStyle = '#2b1d14'; ctx.font = r.font(5); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('TIPS', J.x, jy - 8.5);
  },
  drawCroissant(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = '#e0a04a'; ctx.beginPath(); ctx.ellipse(0, 0, 8, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c9823a'; ctx.beginPath(); ctx.ellipse(-6, 1, 3, 2.5, -0.5, 0, Math.PI * 2); ctx.ellipse(6, 1, 3, 2.5, 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-3, -3, 2, 1.5); ctx.fillRect(1, -3, 2, 1.5);
    ctx.restore();
  },
  drawCake(ctx, x, y, s, col) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = '#f6e7cf'; ctx.beginPath(); ctx.moveTo(-7, 5); ctx.lineTo(0, -9); ctx.lineTo(7, 5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = col || '#ff8fab'; ctx.fillRect(-5, -1, 10, 2); ctx.beginPath(); ctx.moveTo(-7, 5); ctx.lineTo(7, 5); ctx.lineTo(7, 8); ctx.lineTo(-7, 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(0, -10, 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },
  drawMug(ctx, x, y, t, steam) {
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, x - 7, y - 6, 14, 13, 3); ctx.fill();
    ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x + 9, y, 3.5, -Math.PI / 2, Math.PI / 2); ctx.stroke();
    ctx.fillStyle = '#6b3e1e'; ctx.beginPath(); ctx.ellipse(x, y - 6, 6, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - 2, y - 6, 1.8, 0, Math.PI * 2); ctx.arc(x + 2, y - 7, 1.5, 0, Math.PI * 2); ctx.fill();   // marshmallows
    if (steam) { ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.5; for (let k = 0; k < 2; k++) { const ph = (t * 1.2 + k * 0.5) % 1; ctx.globalAlpha = 1 - ph; ctx.beginPath(); ctx.moveTo(x - 3 + k * 5, y - 9 - ph * 10); ctx.quadraticCurveTo(x + k * 5, y - 13 - ph * 10, x - 3 + k * 5, y - 17 - ph * 10); ctx.stroke(); } ctx.globalAlpha = 1; }
  },
  drawCarried(r, g) {
    const ctx = r.ctx, p = g.player, st = this.st, f = p.facing || 1, bob = p.moving ? Math.sin(p.bob || 0) * 2 : 0, t = g.time;
    if (st.cocoa > 0) this.drawMug(ctx, p.x + f * 16, p.y - 22 + bob, t, true);
    if (st.croissant > 0) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(p.x - f * 16, p.y - 18 + bob, 9, 4, 0, 0, Math.PI * 2); ctx.fill(); this.drawCroissant(ctx, p.x - f * 16, p.y - 21 + bob, 1); }
    if (st.cake > 0) { const y = p.y - (st.croissant > 0 ? 34 : 18) + bob; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(p.x - f * 16, y, 9, 4, 0, 0, Math.PI * 2); ctx.fill(); this.drawCake(ctx, p.x - f * 16, y - 5, 1, '#ff8fab'); }
  },
  drawBarista(r, g) {
    const ctx = r.ctx, B = CFG.CAFE.BARISTA, st = this.st, t = g.time, wave = st.thank > 0, clap = st.clap > 0;
    r.drawPerson(B.x, B.y, { shirt: '#fff', skin: '#e0ac69', hair: '#6b3e1e', hairStyle: 1, facing: 1, moving: false, bob: 0, carry: 0, pants: '#2d3a4a', apron: '#b8401c' });
    if (wave) { const a = Math.sin(t * 12) * 0.5; ctx.fillStyle = '#e0ac69'; ctx.beginPath(); ctx.arc(B.x + 18 + a * 4, B.y - 44 + Math.cos(t * 12) * 2, 4, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(B.x + 13, B.y - 20); ctx.lineTo(B.x + 18 + a * 4, B.y - 42); ctx.stroke(); }
    if (clap) this.drawClap(ctx, B.x, B.y - 20, t);
  },
  drawClap(ctx, x, y, t) {
    const k = Math.abs(Math.sin(t * 16)) * 6;
    ctx.fillStyle = '#e0ac69'; ctx.beginPath(); ctx.arc(x - 2 - k, y - 4, 4, 0, Math.PI * 2); ctx.arc(x + 2 + k, y - 4, 4, 0, Math.PI * 2); ctx.fill();
  },
  drawGuest(r, g) {
    const ctx = r.ctx, c = this.guestChair(), st = this.st, t = g.time, x = c.x, y = c.y;
    r.drawPerson(x, y, { shirt: '#41b883', skin: '#f1c27d', hair: '#2b1d14', hairStyle: 2, facing: 1, moving: false, bob: 0, carry: 0, pants: '#4a4a4a' });
    if (st.clap > 0) this.drawClap(ctx, x, y - 20, t);
    else {
      // a book held up, a page flipping now and then
      const k = (st.page % 4) > 3.6 ? ((st.page % 4) - 3.6) / 0.4 : 0;
      ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, x + 4, y - 30, 16, 12, 2); ctx.fill();
      ctx.fillStyle = '#fff8ee'; ctx.fillRect(x + 6, y - 28, 6, 8); ctx.fillRect(x + 12 + k * 4, y - 28, 6 - k * 4, 8);
      ctx.fillStyle = '#2b1d14'; ctx.fillRect(x + 7, y - 26, 4, 1); ctx.fillRect(x + 7, y - 23, 4, 1);
    }
  },
  drawGuitarist(r, g) {
    const ctx = r.ctx, G = CFG.CAFE.GUITARIST, st = this.st, t = g.time, playing = st.song > 0, x = G.x, y = G.y;
    r.drawPerson(x, y - 4, { shirt: '#8e5bd1', skin: '#c68642', hair: '#2b1d14', hairStyle: 3, facing: -1, moving: false, bob: 0, carry: 0, pants: '#2d3a4a', hat: 'bandana' });
    // the guitar across the lap, the strumming hand moving while playing
    ctx.save(); ctx.translate(x - 2, y - 20); ctx.rotate(-0.35);
    ctx.fillStyle = '#b86f2d'; ctx.beginPath(); ctx.ellipse(-4, 0, 11, 8, 0, 0, Math.PI * 2); ctx.ellipse(6, -2, 8, 6.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(0, -1, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(8, -4, 24, 4); ctx.fillStyle = '#2b1d14'; ctx.fillRect(30, -5, 6, 6);
    ctx.strokeStyle = '#fff8ee'; ctx.lineWidth = 0.8; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(-10, -3 + k * 2.5); ctx.lineTo(32, -3 + k * 2.5); ctx.stroke(); }
    ctx.restore();
    const strum = playing ? Math.sin(t * 18) * 5 : 0;
    ctx.fillStyle = '#c68642'; ctx.beginPath(); ctx.arc(x - 4, y - 18 + strum, 3.5, 0, Math.PI * 2); ctx.fill();
    for (const n of st.notes) { const k = n.t / 1.6; ctx.globalAlpha = 1 - k; ctx.fillStyle = ['#e4572e', '#3b7dd8', '#ffd166'][Math.floor(n.x) % 3]; ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(n.ch, n.x + Math.sin(k * 6 + n.x) * 6, n.y - k * 36); }
    ctx.globalAlpha = 1;
  },
  drawCat(r, g) {
    const ctx = r.ctx, c = this.catChair(), st = this.st, t = g.time, x = c.x, y = c.y - 2, br = Math.sin(t * 2) * 0.8;
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(x, y + 3, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f2a65a'; ctx.beginPath(); ctx.ellipse(x, y - 2, 12, 7 + br, 0, 0, Math.PI * 2); ctx.fill();   // curled body
    ctx.strokeStyle = '#f2a65a'; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + 8, y + 1); ctx.quadraticCurveTo(x + 16, y + 4, x + 12, y - 6); ctx.stroke();   // tail
    ctx.fillStyle = '#f2a65a'; ctx.beginPath(); ctx.arc(x - 7, y - 4, 6, 0, Math.PI * 2); ctx.fill();   // head
    ctx.beginPath(); ctx.moveTo(x - 12, y - 7); ctx.lineTo(x - 11, y - 13); ctx.lineTo(x - 7, y - 9); ctx.closePath(); ctx.moveTo(x - 4, y - 9); ctx.lineTo(x - 2, y - 13); ctx.lineTo(x - 1, y - 7); ctx.closePath(); ctx.fill();   // ears
    ctx.fillStyle = '#d98b3a'; ctx.fillRect(x - 2, y - 7, 2, 6); ctx.fillRect(x + 3, y - 8, 2, 7);   // stripes
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 10, y - 4); ctx.lineTo(x - 8, y - 3); ctx.moveTo(x - 6, y - 3); ctx.lineTo(x - 4, y - 4); ctx.stroke();   // closed eyes
    ctx.fillStyle = '#ff8fab'; ctx.beginPath(); ctx.arc(x - 7, y - 1, 1, 0, Math.PI * 2); ctx.fill();
    const ph = (st.zz * 0.5) % 1;
    ctx.globalAlpha = 1 - ph; ctx.fillStyle = '#2b1d14'; ctx.font = r.font(9 + ph * 5); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('z', x - 10 + ph * 10, y - 16 - ph * 14); ctx.globalAlpha = 1;
  },
  dynamic(r, g) {
    const st = this.st; if (!st) return;
    const ctx = r.ctx, t = g.time;
    if (g.area === 'city' && !this.cityBusy()) {
      // fairy lights under the café's awning outside
      const b = this.bld(), cx = (b.x0 + b.x1) / 2, gy = b.y1 - 40, cols = ['#ffd166', '#ff8fab', '#9fd8ff'];
      for (let i = 0; i < 9; i++) { const on = 0.5 + 0.5 * Math.sin(t * 3 + i); ctx.fillStyle = cols[i % 3]; ctx.globalAlpha = 0.4 + 0.6 * on; ctx.beginPath(); ctx.arc(cx - 56 + i * 14, gy + 15 + (i % 2) * 2, 2, 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = 1;
      return;
    }
    if (g.area !== 'cafe') return;
    this.drawOutside(r, g);
    this.drawWindow(r, g);
    this.drawLights(r, g);
    // a warm pool of light under the stage spot while the song plays
    if (st.song > 0) { const S = CFG.CAFE.STAGE; ctx.fillStyle = `rgba(255,224,138,${(0.18 + 0.08 * Math.sin(t * 6)).toFixed(2)})`; ctx.beginPath(); ctx.ellipse((S.x0 + S.x1) / 2, (S.y0 + S.y1) / 2, 70, 44, 0, 0, Math.PI * 2); ctx.fill(); }
  },
  entities(r, g, items) {
    const st = this.st; if (!st) return;
    const p = g.player, K = CFG.CAFE;
    if ((st.cocoa > 0 || st.croissant > 0 || st.cake > 0) && !g.driving && !g.onTrain && !g.travel) items.push({ y: p.y + 0.5, draw: () => this.drawCarried(r, g) });
    if (g.area !== 'cafe') return;
    for (const t of K.TABLES) {
      items.push({ y: t.y + 8, draw: () => this.drawTable(r, g, t) });
      for (const c of t.chairs) items.push({ y: c.y + 1, draw: () => this.drawChairBack(r, g, t, c) });
    }
    items.push({ y: K.COUNTER.y1, draw: () => this.drawCounter(r, g) });
    items.push({ y: K.BARISTA.y, draw: () => this.drawBarista(r, g) });
    items.push({ y: this.guestChair().y, draw: () => this.drawGuest(r, g) });
    items.push({ y: K.GUITARIST.y, draw: () => this.drawGuitarist(r, g) });
    items.push({ y: this.catChair().y + 2, draw: () => this.drawCat(r, g) });
    if (st.clap > 0 && st.seat) items.push({ y: p.y + 2, draw: () => this.drawClap(r.ctx, p.x, p.y - 20, g.time) });
  },
  overlay(r, g) {
    const st = this.st; if (!st || !st.confetti.length) return;
    const ctx = r.ctx;
    for (const c of st.confetti) {
      ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.rot); ctx.globalAlpha = U.clamp((c.dur - c.t) / 0.4, 0, 1);
      ctx.fillStyle = c.col; ctx.fillRect(-3, -2, 6, 4); ctx.restore();
    }
    ctx.globalAlpha = 1;
  },
  screen(r, g) {
    if (!this.st || this.st.fade <= 0) return;
    const ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    ctx.fillStyle = `rgba(20,12,6,${(this.st.fade / 0.45).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
  },
};
Game.ext.unshift(CafeExt);   // first in line so the door's button and hint beat the City's taxis and coins
Render.ext.push(CafeExt);
