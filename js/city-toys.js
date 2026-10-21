'use strict';
// The toy shop: the TOYS building on Bus Street in the City (CFG.CITY.BUILDINGS[0]). Stand at its door on the
// sidewalk and go inside: shelves of plush animals and toy cars, a big teddy, a train set running round a table,
// a waving shopkeeper, a ball pit to hop into, a wind-up robot with a big red button, a pinwheel to buy and carry
// around for a while, a kite picture for the wall and a tiny puppet theatre. Extension module (see js/EXTENSIONS.md).
CFG.TOYSHOP = {
  BUILDING: 0,
  DOOR: { x: 4675, y: 14 },                                   // on the sidewalk just below the shop door, under the awning
  WORLD: { x0: -1300, y0: 3000, x1: -700, y1: 3400 },         // the interior map (reserved rectangle for City building 0)
  ROOM: { x0: -1268, y0: 3044, x1: -732, y1: 3366 }, WALL: 24,
  EXIT: { x: -1000, y: 3346 }, DOOR_W: 44,                    // the mat inside the door (the door is in the bottom wall)
  SHELF_PLUSH: { x0: -1256, y0: 3044, x1: -1110, y1: 3094 },
  STAGE: { x0: -1072, y0: 3044, x1: -948, y1: 3114, spot: { x: -1010, y: 3140 } },
  PICTURE: { x: -914, y: 3068 },                              // where the kite picture hangs once bought
  SHELF_CARS: { x0: -880, y0: 3044, x1: -744, y1: 3094 },
  COUNTER: { x0: -1256, y0: 3170, x1: -1140, y1: 3202 }, KEEPER: { x: -1198, y: 3160 },
  TABLE: { x0: -1072, y0: 3160, x1: -928, y1: 3250 }, TRACK: { rx: 54, ry: 28 },
  PIT: { x0: -876, y0: 3150, x1: -760, y1: 3250, spot: { x: -818, y: 3274 }, inside: { x: -818, y: 3206 } },
  ROBOT: { y: 3330, x0: -866, x1: -760, speed: 44, walk: 6 }, BUTTON: { x: -910, y: 3336 },
  TEDDY: { x: -1236, y: 3326 },
  PADS: { pinwheel: { x: -1170, y: 3304, price: 5 }, kite: { x: -1080, y: 3304, price: 8 } },
  PINWHEEL: 30, SHOW: 10, BALLS: 30,
  REACH: 36,
};
CFG.AREAS.toyshop = { WORLD: CFG.TOYSHOP.WORLD };

const ToysExt = {
  name: 'toys',
  st: null,
  defaults: { toys: { seen: false, kite: false, pinwheels: 0 } },

  // ---------- state ----------
  build(g) {
    if (!g.s.toys) g.s.toys = { seen: false, kite: false, pinwheels: 0 };
    const K = CFG.TOYSHOP, P = K.PIT, balls = [];
    const cols = ['#ff5252', '#ffd740', '#40c4ff', '#69f0ae', '#ff8a65', '#b388ff', '#fff176'];
    for (let i = 0; i < K.BALLS; i++) balls.push({ x: P.x0 + 12 + ((i * 37) % (P.x1 - P.x0 - 24)), y: P.y0 + 12 + ((i * 53) % (P.y1 - P.y0 - 24)), z: 0, vz: 0, c: cols[i % cols.length] });
    this.st = {
      fade: 0, wave: 0, hi: 0, trainT: 0, noteT: 0,
      pit: { in: false, balls, done: false },
      robot: { x: K.ROBOT.x0 + 20, dir: 1, walk: 0, bob: 0, pressed: 0, done: false },
      show: null, showDone: false,
      pinwheel: null,
      cash: 0,
    };
  },
  ready(g) { if (!this.st) this.build(g); return this.st; },
  inside(g) { return g.area === 'toyshop'; },
  onFoot(g) { return !g.driving && !g.onTrain && !g.ride && !g.travel && !g.fishing; },
  atDoor(g, reach) { const D = CFG.TOYSHOP.DOOR, p = g.player; return g.area === 'city' && this.onFoot(g) && !this.cityBusy() && U.dist(p.x, p.y, D.x, D.y) < reach; },
  cityBusy() { return typeof CityExt !== 'undefined' && !!(CityExt.floor || (CityExt.st && (CityExt.st.cab || CityExt.st.boarding))); },
  near(g, pt, reach) { const p = g.player; return U.dist(p.x, p.y, pt.x, pt.y) < (reach || CFG.TOYSHOP.REACH); },

  // ---------- room geometry ----------
  blocks() {
    const K = CFG.TOYSHOP, R = K.ROOM, w = K.WALL, o = [];
    o.push({ x: R.x0 - w, y: R.y0 - w, w: R.x1 - R.x0 + 2 * w, h: w }, { x: R.x0 - w, y: R.y1, w: R.x1 - R.x0 + 2 * w, h: w });
    o.push({ x: R.x0 - w, y: R.y0, w, h: R.y1 - R.y0 }, { x: R.x1, y: R.y0, w, h: R.y1 - R.y0 });
    for (const s of [K.SHELF_PLUSH, K.SHELF_CARS, K.STAGE, K.TABLE, K.PIT]) o.push({ x: s.x0, y: s.y0, w: s.x1 - s.x0, h: s.y1 - s.y0 });
    o.push({ x: K.COUNTER.x0, y: K.COUNTER.y0 - 38, w: K.COUNTER.x1 - K.COUNTER.x0, h: K.COUNTER.y1 - K.COUNTER.y0 + 38 });   // the counter plus the shopkeeper's side
    o.push({ x: K.TEDDY.x - 24, y: K.TEDDY.y - 26, w: 48, h: 50 });
    return o;
  },
  obstacles(g) { return this.inside(g) ? this.blocks() : []; },
  free(x, y) {
    const R = CFG.TOYSHOP.ROOM, r = 12;
    if (x < R.x0 + r || x > R.x1 - r || y < R.y0 + r || y > R.y1 - r) return false;
    for (const o of this.blocks()) if (x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h) return false;
    return true;
  },
  // a save or a push that left the chef in a wall or inside the furniture goes back onto the door mat
  rescue(g) {
    const p = g.player, K = CFG.TOYSHOP;
    if (this.st.pit.in || this.free(p.x, p.y)) return false;
    p.x = K.EXIT.x; p.y = K.EXIT.y - 8; p.moving = false;
    g.floats.push({ x: p.x, y: p.y - 50, text: 'Oops! Back inside', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    return true;
  },

  // ---------- going in and out ----------
  enter(g) {
    const K = CFG.TOYSHOP, p = g.player, st = this.ready(g);
    g.area = 'toyshop'; p.x = K.EXIT.x; p.y = K.EXIT.y - 8; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    st.fade = 0.45; st.hi = 0; Sfx.ding(); Haptics.tap();
    if (!g.s.toys.seen) { g.s.toys.seen = true; g.toast('🧸 Welcome to the toy shop!', true); }
  },
  leave(g) {
    const K = CFG.TOYSHOP, p = g.player, st = this.st;
    g.area = 'city'; p.x = K.DOOR.x; p.y = K.DOOR.y; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    st.pit.in = false; st.show = null; st.fade = 0.45; Sfx.drop();
  },
  home(g) { if (!this.st) return; const st = this.st; st.pit.in = false; st.show = null; st.fade = 0; st.hi = 0; },

  // ---------- the toys ----------
  hopIn(g) {
    const st = this.st, p = g.player, I = CFG.TOYSHOP.PIT.inside;
    st.pit.in = true; st.pit.done = true; p.x = I.x; p.y = I.y; p.moving = false;
    this.splash(1);
    g.floats.push({ x: p.x, y: p.y - 56, text: 'Boing!', color: '#ffe08a', t: 0, dur: 1.2, big: true });
    Sfx.pickup(); Haptics.success();
  },
  hopOut(g) {
    const st = this.st, p = g.player, S = CFG.TOYSHOP.PIT.spot;
    st.pit.in = false; p.x = S.x; p.y = S.y; p.moving = false; this.splash(0.5); Sfx.drop();
  },
  splash(k) { for (const b of this.st.pit.balls) b.vz = Math.max(b.vz, U.rand(90, 230) * k); },
  windUp(g) {
    const R = this.st.robot, K = CFG.TOYSHOP;
    R.walk = K.ROBOT.walk; R.pressed = 0.35; R.done = true;
    g.floats.push({ x: R.x, y: K.ROBOT.y - 62, text: 'Beep boop!', color: '#ffe08a', t: 0, dur: 1.3, big: true });
    Sfx.ding(); Haptics.tap();
  },
  startShow(g) {
    const st = this.st, S = CFG.TOYSHOP.STAGE;
    st.show = { t: 0, dur: CFG.TOYSHOP.SHOW, claps: 0 }; st.showDone = true; st.noteT = 0.4;
    g.floats.push({ x: (S.x0 + S.x1) / 2, y: S.y0 - 10, text: 'Showtime!', color: '#ffe08a', t: 0, dur: 1.3, big: true });
    Sfx.chime(); Haptics.tap();
  },
  clap(g) {
    const st = this.st, p = g.player;
    st.show.claps++;
    g.floats.push({ x: p.x + U.rand(-10, 10), y: p.y - 56, text: U.pick(['Yay!', 'Bravo!', 'Hooray!']), color: '#ffe08a', t: 0, dur: 1.1, big: true });
    Haptics.tap();
  },
  pads(g) {
    if (!this.inside(g)) return [];
    const K = CFG.TOYSHOP.PADS, s = g.s.toys || {}, st = this.ready(g);
    return [
      { key: 'toy_pinwheel', label: 'Pinwheel', ico: '🌀', pos: { x: K.pinwheel.x, y: K.pinwheel.y }, price: K.pinwheel.price, maxed: !!st.pinwheel, sub: st.pinwheel ? 'Spinning!' : '' },
      { key: 'toy_kite', label: 'Kite picture', ico: '🪁', pos: { x: K.kite.x, y: K.kite.y }, price: K.kite.price, maxed: !!s.kite, sub: s.kite ? 'On the wall!' : '' },
    ];
  },
  onPad(g, pad) {
    const st = this.ready(g), p = g.player, K = CFG.TOYSHOP;
    if (pad.key === 'toy_pinwheel') {
      st.pinwheel = { t: K.PINWHEEL, ang: 0 }; g.s.toys.pinwheels = (g.s.toys.pinwheels || 0) + 1;
      g.floats.push({ x: p.x, y: p.y - 56, text: '🌀 A pinwheel!', color: '#ffe08a', t: 0, dur: 1.4, big: true });
      Sfx.buy(); Haptics.success();
    } else if (pad.key === 'toy_kite') {
      g.s.toys.kite = true;
      g.fx.push({ kind: 'sparkle', x0: K.PICTURE.x, y0: K.PICTURE.y, x1: K.PICTURE.x, y1: K.PICTURE.y, t: 0, dur: 0.9 });
      g.floats.push({ x: p.x, y: p.y - 56, text: '🪁 Look, a kite picture!', color: '#ffe08a', t: 0, dur: 1.6, big: true });
      Sfx.unlock(); Haptics.success();
    }
  },
  bgKey(g) { return 'toys:' + (g.s.toys && g.s.toys.kite ? 1 : 0); },

  // ---------- game hooks ----------
  action(g) {
    const st = this.ready(g), K = CFG.TOYSHOP;
    if (this.atDoor(g, 30)) return { label: '🚪 Go inside', run: (gg) => this.enter(gg) };
    if (!this.inside(g) || !this.onFoot(g)) return null;
    if (st.pit.in) return { label: '🚶 Hop out', run: (gg) => this.hopOut(gg) };
    if (this.near(g, K.EXIT, 30)) return { label: '🚪 Go outside', run: (gg) => this.leave(gg) };
    if (this.near(g, K.PIT.spot)) return { label: '🎈 Hop in!', run: (gg) => this.hopIn(gg) };
    if (this.near(g, K.BUTTON) && !st.robot.walk) return { label: '🤖 Wind it up!', run: (gg) => this.windUp(gg) };
    if (this.near(g, K.STAGE.spot, 50)) return st.show ? { label: '👏 Clap!', run: (gg) => this.clap(gg) } : { label: '🎭 Start the show!', run: (gg) => this.startShow(gg) };
    return null;
  },
  hint(g) {
    const st = this.ready(g), K = CFG.TOYSHOP, s = g.s.toys || {};
    if (!this.inside(g)) return this.atDoor(g, 90) ? { text: 'Go inside the toy shop! 🧸', target: K.DOOR } : undefined;
    if (st.pit.in) return { text: 'Boing boing! Press the button to hop out', target: null };
    if (st.show) return { text: 'Enjoy the puppet show! 🎭', target: null };
    if (this.near(g, K.EXIT, 30)) return { text: 'Press the button to go outside', target: null };
    if (this.near(g, K.PIT.spot)) return { text: 'Hop into the ball pit! 🎈', target: null };
    if (this.near(g, K.BUTTON)) return { text: st.robot.walk ? 'Go robot, go! 🤖' : 'Press the big red button! 🤖', target: null };
    if (this.near(g, K.STAGE.spot, 50)) return { text: 'Start the puppet show! 🎭', target: null };
    if (!st.pit.done) return { text: 'Hop into the ball pit! 🎈', target: K.PIT.spot };
    if (!st.robot.done) return { text: 'Wind up the robot! 🤖', target: K.BUTTON };
    if (!st.showDone) return { text: 'Start the puppet show! 🎭', target: K.STAGE.spot };
    if (!st.pinwheel && g.s.cash >= K.PADS.pinwheel.price) return { text: 'Buy a pinwheel! 🌀', target: K.PADS.pinwheel };
    if (!s.kite && g.s.cash >= K.PADS.kite.price) return { text: 'Buy the kite picture! 🪁', target: K.PADS.kite };
    return { text: 'So many toys! 🧸', target: null };
  },
  update(g, dt) {
    const st = this.ready(g), K = CFG.TOYSHOP, p = g.player;
    st.fade = Math.max(0, st.fade - dt);
    // the pinwheel spins faster while the chef walks, and stops after a while
    if (st.pinwheel) { st.pinwheel.t -= dt; st.pinwheel.ang += dt * (p.moving ? 16 : 3); if (st.pinwheel.t <= 0) { st.pinwheel = null; g.floats.push({ x: p.x, y: p.y - 56, text: 'Bye bye, pinwheel!', color: '#ffe08a', t: 0, dur: 1.4, big: true }); } }
    if (!this.inside(g)) return;
    this.rescue(g);
    st.trainT += dt;
    // the shopkeeper waves when the chef comes close
    const nearKeeper = U.dist(p.x, p.y, K.KEEPER.x, K.KEEPER.y) < 130;
    if (nearKeeper) { st.wave += dt * 9; st.hi = Math.min(st.hi + dt, 3); } else { st.wave = 0; st.hi = 0; }
    // the ball pit: stay put inside it, the balls bounce and settle
    if (st.pit.in) { p.x = K.PIT.inside.x; p.y = K.PIT.inside.y; p.moving = false; }
    for (const b of st.pit.balls) if (b.z > 0 || b.vz > 0) { b.vz -= 520 * dt; b.z += b.vz * dt; if (b.z <= 0) { b.z = 0; b.vz = b.vz < -60 ? -b.vz * 0.45 : 0; } }
    // the wind-up robot walks back and forth along its bit of floor
    const R = st.robot; R.pressed = Math.max(0, R.pressed - dt);
    if (R.walk > 0) {
      R.walk -= dt; R.bob += dt * 10; R.x += R.dir * K.ROBOT.speed * dt;
      if (R.x > K.ROBOT.x1) { R.x = K.ROBOT.x1; R.dir = -1; } else if (R.x < K.ROBOT.x0) { R.x = K.ROBOT.x0; R.dir = 1; }
      if (R.walk <= 0) { R.walk = 0; g.floats.push({ x: R.x, y: K.ROBOT.y - 62, text: 'Zzz…', color: '#ffe08a', t: 0, dur: 1.2 }); }
    }
    // the puppet show
    if (st.show) {
      const sh = st.show, S = K.STAGE; sh.t += dt; st.noteT -= dt;
      if (st.noteT <= 0 && sh.t < sh.dur - 1) { st.noteT = 0.7; g.floats.push({ x: U.rand(S.x0 + 10, S.x1 - 10), y: S.y0 + 16, text: U.pick(['♪', '♫', '♩']), color: '#ff6b8a', t: 0, dur: 1.4 }); }
      if (sh.t >= sh.dur) { st.show = null; g.floats.push({ x: (S.x0 + S.x1) / 2, y: S.y0 - 10, text: 'The End! 🎭', color: '#ffe08a', t: 0, dur: 1.6, big: true }); Sfx.chime(); }
    }
  },

  // ---------- static art ----------
  paint: { toyshop(r, g) { ToysExt.paintShop(r, g); } },
  paintShop(r, g) {
    const ctx = r.ctx, K = CFG.TOYSHOP, R = K.ROOM, w = K.WALL, W = K.WORLD;
    // outside the walls: the shop's pink, with polka dots
    ctx.fillStyle = '#f3c4d8'; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (let i = 0; i < 90; i++) { const x = W.x0 + ((i * 97) % 600), y = W.y0 + ((i * 61) % 400); ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); }
    // walls: striped wallpaper on the back wall, plain sides, the front wall with the door gap
    ctx.fillStyle = '#c9a0dc'; ctx.fillRect(R.x0 - w, R.y0 - w, R.x1 - R.x0 + 2 * w, R.y1 - R.y0 + 2 * w);
    ctx.fillStyle = '#e4c6f0'; for (let x = R.x0 - w; x < R.x1 + w; x += 16) ctx.fillRect(x, R.y0 - w, 8, w);
    ctx.fillStyle = '#9b6cb8'; ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, w);
    // floor: warm cream with a pastel checker and a rainbow rug by the door
    ctx.fillStyle = '#fff6dc'; ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0);
    ctx.fillStyle = 'rgba(255,183,77,0.18)';
    for (let y = R.y0; y < R.y1; y += 32) for (let x = R.x0 + ((y - R.y0) / 32 % 2) * 32; x < R.x1; x += 64) ctx.fillRect(x, y, Math.min(32, R.x1 - x), Math.min(32, R.y1 - y));
    const rug = ['#ff5252', '#ff9800', '#ffd740', '#69f0ae', '#40c4ff', '#b388ff'];
    for (let i = 0; i < rug.length; i++) { ctx.fillStyle = rug[i]; ctx.beginPath(); ctx.ellipse(K.EXIT.x, K.EXIT.y - 40, 66 - i * 10, 36 - i * 5.5, 0, 0, Math.PI * 2); ctx.fill(); }
    // the door in the front wall and the mat
    const dw = K.DOOR_W / 2;
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(K.EXIT.x - dw, R.y1 - 2, K.DOOR_W, w + 2);
    ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(K.EXIT.x + 10, R.y1 + 12, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, K.EXIT.x - 24, K.EXIT.y - 10, 48, 20, 5); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('BYE BYE!', K.EXIT.x, K.EXIT.y);
    this.paintShelf(ctx, r, K.SHELF_PLUSH, 'plush');
    this.paintShelf(ctx, r, K.SHELF_CARS, 'cars');
    this.paintStage(ctx, r);
    if (g.s.toys && g.s.toys.kite) this.paintKitePicture(ctx, r);
    this.paintCounter(ctx, r);
    this.paintTable(ctx, r);
    this.paintPit(ctx, r);
    this.paintTeddy(ctx, K.TEDDY.x, K.TEDDY.y, 1);
    // the robot's bit of floor and its big red button
    ctx.fillStyle = 'rgba(64,196,255,0.25)'; U.roundRect(ctx, K.ROBOT.x0 - 18, K.ROBOT.y - 22, K.ROBOT.x1 - K.ROBOT.x0 + 36, 46, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(43,29,20,0.25)'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(K.ROBOT.x0, K.ROBOT.y - 5); ctx.lineTo(K.ROBOT.x1, K.ROBOT.y - 5); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('ROBOT WALK', (K.ROBOT.x0 + K.ROBOT.x1) / 2, K.ROBOT.y + 17);
    ctx.fillStyle = '#ffd740'; ctx.beginPath(); ctx.ellipse(K.BUTTON.x, K.BUTTON.y + 8, 22, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(7); ctx.fillText('PRESS', K.BUTTON.x, K.BUTTON.y + 22);
    // a sign on the back wall
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, R.x0 + 40, R.y0 - w - 2, 120, 18, 4); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(10); ctx.fillText('🧸 TOYS 🚂', R.x0 + 100, R.y0 - w + 7);
  },
  paintShelf(ctx, r, S, kind) {
    ctx.fillStyle = '#a86b36'; ctx.fillRect(S.x0, S.y0, S.x1 - S.x0, S.y1 - S.y0);
    ctx.fillStyle = '#c98a4b'; ctx.fillRect(S.x0 + 3, S.y0 + 3, S.x1 - S.x0 - 6, S.y1 - S.y0 - 6);
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(S.x0 + 3, S.y0 + 24, S.x1 - S.x0 - 6, 3); ctx.fillRect(S.x0 + 3, S.y1 - 5, S.x1 - S.x0 - 6, 3);
    const n = Math.floor((S.x1 - S.x0 - 10) / 26);
    for (let row = 0; row < 2; row++) for (let i = 0; i < n; i++) {
      const x = S.x0 + 18 + i * 26, y = S.y0 + 20 + row * 23, k = (i + row * 3) % 5;
      if (kind === 'plush') this.paintPlush(ctx, x, y, k); else this.paintCar(ctx, x, y, k);
    }
  },
  paintPlush(ctx, x, y, k) {
    const cols = ['#c98a4b', '#f8bbd0', '#90caf9', '#a5d6a7', '#ffe082'], c = cols[k];
    ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, y - 1, 9, 7, 0, 0, Math.PI * 2); ctx.fill();   // body
    if (k === 2) { ctx.beginPath(); ctx.ellipse(x - 4, y - 16, 2.5, 7, 0, 0, Math.PI * 2); ctx.ellipse(x + 4, y - 16, 2.5, 7, 0, 0, Math.PI * 2); ctx.fill(); }   // bunny ears
    else { ctx.beginPath(); ctx.arc(x - 6, y - 14, 3, 0, Math.PI * 2); ctx.arc(x + 6, y - 14, 3, 0, Math.PI * 2); ctx.fill(); }  // round ears
    ctx.beginPath(); ctx.arc(x, y - 9, 7, 0, Math.PI * 2); ctx.fill();   // head
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x - 2.5, y - 10, 1.1, 0, Math.PI * 2); ctx.arc(x + 2.5, y - 10, 1.1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y - 7, 1.4, 0, Math.PI * 2); ctx.fill();
    if (k === 4) { ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(x, y - 3); ctx.lineTo(x - 4, y - 6); ctx.lineTo(x - 4, y); ctx.closePath(); ctx.moveTo(x, y - 3); ctx.lineTo(x + 4, y - 6); ctx.lineTo(x + 4, y); ctx.closePath(); ctx.fill(); }   // a bow
  },
  paintCar(ctx, x, y, k) {
    const cols = ['#ff5252', '#40c4ff', '#ffd740', '#69f0ae', '#b388ff'];
    ctx.fillStyle = cols[k]; U.roundRect(ctx, x - 11, y - 8, 22, 9, 3); ctx.fill(); U.roundRect(ctx, x - 6, y - 14, 12, 8, 3); ctx.fill();
    ctx.fillStyle = '#bfe3ff'; ctx.fillRect(x - 4, y - 12, 8, 4);
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x - 6, y + 1, 3, 0, Math.PI * 2); ctx.arc(x + 6, y + 1, 3, 0, Math.PI * 2); ctx.fill();
  },
  paintStage(ctx, r) {
    const S = CFG.TOYSHOP.STAGE, cx = (S.x0 + S.x1) / 2;
    ctx.fillStyle = '#8e5bd1'; U.roundRect(ctx, S.x0, S.y0, S.x1 - S.x0, S.y1 - S.y0, 6); ctx.fill();
    ctx.fillStyle = '#ffd740'; U.roundRect(ctx, S.x0 + 6, S.y0 + 4, S.x1 - S.x0 - 12, 14, 4); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('PUPPET SHOW', cx, S.y0 + 11);
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(S.x0 + 8, S.y0 + 22, S.x1 - S.x0 - 16, S.y1 - S.y0 - 34);   // the dark stage opening (the curtains are drawn live)
    ctx.fillStyle = '#a86b36'; ctx.fillRect(S.x0 + 4, S.y1 - 12, S.x1 - S.x0 - 8, 8);   // the stage floor
    for (let i = 0; i < 5; i++) { ctx.fillStyle = i % 2 ? '#ffd740' : '#ff5252'; ctx.beginPath(); ctx.arc(S.x0 + 14 + i * ((S.x1 - S.x0 - 28) / 4), S.y1 - 4, 2.5, 0, Math.PI * 2); ctx.fill(); }
  },
  paintKitePicture(ctx, r) {
    const P = CFG.TOYSHOP.PICTURE, x = P.x, y = P.y;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x - 22, y - 18, 48, 40);
    ctx.fillStyle = '#a86b36'; ctx.fillRect(x - 24, y - 20, 48, 40);
    ctx.fillStyle = '#9fd8ff'; ctx.fillRect(x - 20, y - 16, 40, 32);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - 10, y - 8, 4, 0, Math.PI * 2); ctx.arc(x - 5, y - 9, 5, 0, Math.PI * 2); ctx.arc(x, y - 8, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff5252'; ctx.beginPath(); ctx.moveTo(x + 8, y - 12); ctx.lineTo(x + 15, y - 4); ctx.lineTo(x + 8, y + 6); ctx.lineTo(x + 1, y - 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd740'; ctx.beginPath(); ctx.moveTo(x + 8, y - 12); ctx.lineTo(x + 15, y - 4); ctx.lineTo(x + 8, y - 4); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 8, y + 6); ctx.quadraticCurveTo(x + 2, y + 10, x - 12, y + 13); ctx.stroke();
  },
  paintCounter(ctx, r) {
    const C = CFG.TOYSHOP.COUNTER;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(C.x0 + 3, C.y0 + 4, C.x1 - C.x0, C.y1 - C.y0);
    ctx.fillStyle = '#ff8fab'; U.roundRect(ctx, C.x0, C.y0, C.x1 - C.x0, C.y1 - C.y0, 5); ctx.fill();
    ctx.fillStyle = '#ffc1d4'; ctx.fillRect(C.x0 + 4, C.y0 + 3, C.x1 - C.x0 - 8, 8);
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('WELCOME', (C.x0 + C.x1) / 2, C.y1 - 10);
    // a little till and a jar of lollipops
    ctx.fillStyle = '#5c6670'; U.roundRect(ctx, C.x1 - 30, C.y0 - 12, 22, 16, 3); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.fillRect(C.x1 - 27, C.y0 - 9, 16, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; U.roundRect(ctx, C.x0 + 10, C.y0 - 10, 16, 14, 4); ctx.fill();
    for (let i = 0; i < 3; i++) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(C.x0 + 14 + i * 4, C.y0 - 6); ctx.lineTo(C.x0 + 13 + i * 5, C.y0 - 18); ctx.stroke(); ctx.fillStyle = ['#ff5252', '#40c4ff', '#69f0ae'][i]; ctx.beginPath(); ctx.arc(C.x0 + 13 + i * 5, C.y0 - 20, 3.5, 0, Math.PI * 2); ctx.fill(); }
  },
  paintTable(ctx, r) {
    const T = CFG.TOYSHOP.TABLE, K = CFG.TOYSHOP.TRACK, cx = (T.x0 + T.x1) / 2, cy = (T.y0 + T.y1) / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(T.x0 + 4, T.y0 + 5, T.x1 - T.x0, T.y1 - T.y0);
    ctx.fillStyle = '#a86b36'; U.roundRect(ctx, T.x0, T.y0, T.x1 - T.x0, T.y1 - T.y0, 8); ctx.fill();
    ctx.fillStyle = '#7cb342'; U.roundRect(ctx, T.x0 + 6, T.y0 + 6, T.x1 - T.x0 - 12, T.y1 - T.y0 - 12, 6); ctx.fill();
    // a pond and two little trees inside the loop, a tunnel hill on the far side
    ctx.fillStyle = '#5bb3e6'; ctx.beginPath(); ctx.ellipse(cx + 12, cy + 4, 14, 8, 0, 0, Math.PI * 2); ctx.fill();
    for (const [dx, dy] of [[-22, -4], [-10, 8]]) { ctx.fillStyle = '#5b3a1a'; ctx.fillRect(cx + dx - 1.5, cy + dy, 3, 7); ctx.fillStyle = '#2f9e44'; ctx.beginPath(); ctx.arc(cx + dx, cy + dy - 3, 6, 0, Math.PI * 2); ctx.fill(); }
    // the oval track: ballast, sleepers, rails
    ctx.strokeStyle = '#8d8d8d'; ctx.lineWidth = 9; ctx.beginPath(); ctx.ellipse(cx, cy, K.rx, K.ry, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#5b3a1a'; ctx.lineWidth = 1.5;
    for (let a = 0; a < Math.PI * 2; a += 0.22) { const px = cx + Math.cos(a) * K.rx, py = cy + Math.sin(a) * K.ry, nx = Math.cos(a) * K.ry, ny = Math.sin(a) * K.rx, n = Math.hypot(nx, ny); ctx.beginPath(); ctx.moveTo(px - nx / n * 4, py - ny / n * 4); ctx.lineTo(px + nx / n * 4, py + ny / n * 4); ctx.stroke(); }
    ctx.strokeStyle = '#4a4a4a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(cx, cy, K.rx - 2.5, K.ry - 2.5, 0, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.ellipse(cx, cy, K.rx + 2.5, K.ry + 2.5, 0, 0, Math.PI * 2); ctx.stroke();
    // a tiny station by the near side
    ctx.fillStyle = '#e4572e'; ctx.fillRect(cx + 26, cy + K.ry + 6, 22, 9); ctx.fillStyle = '#ffe08a'; ctx.fillRect(cx + 29, cy + K.ry + 8, 5, 4); ctx.fillRect(cx + 40, cy + K.ry + 8, 5, 4);
  },
  paintPit(ctx, r) {
    const P = CFG.TOYSHOP.PIT;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(P.x0 + 4, P.y0 + 5, P.x1 - P.x0, P.y1 - P.y0);
    ctx.fillStyle = '#40c4ff'; U.roundRect(ctx, P.x0, P.y0, P.x1 - P.x0, P.y1 - P.y0, 12); ctx.fill();
    ctx.fillStyle = '#0288d1'; U.roundRect(ctx, P.x0 + 8, P.y0 + 8, P.x1 - P.x0 - 16, P.y1 - P.y0 - 16, 8); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('BALL PIT', (P.x0 + P.x1) / 2, P.y0 - 9);
  },
  paintTeddy(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(0, 20, 26, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b07a3c';
    ctx.beginPath(); ctx.ellipse(-18, 14, 10, 7, 0, 0, Math.PI * 2); ctx.ellipse(18, 14, 10, 7, 0, 0, Math.PI * 2); ctx.fill();   // legs
    ctx.beginPath(); ctx.ellipse(0, 2, 20, 18, 0, 0, Math.PI * 2); ctx.fill();   // body
    ctx.beginPath(); ctx.ellipse(-20, -4, 7, 11, 0.5, 0, Math.PI * 2); ctx.ellipse(20, -4, 7, 11, -0.5, 0, Math.PI * 2); ctx.fill();   // arms
    ctx.beginPath(); ctx.arc(-13, -30, 7, 0, Math.PI * 2); ctx.arc(13, -30, 7, 0, Math.PI * 2); ctx.fill();   // ears
    ctx.beginPath(); ctx.arc(0, -22, 17, 0, Math.PI * 2); ctx.fill();   // head
    ctx.fillStyle = '#e0b37a'; ctx.beginPath(); ctx.arc(-13, -30, 3.5, 0, Math.PI * 2); ctx.arc(13, -30, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(0, -16, 8, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(0, 6, 12, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(-6, -25, 2, 0, Math.PI * 2); ctx.arc(6, -25, 2, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(0, -18, 3, 2.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(0, -14, 3, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(-9, -12); ctx.lineTo(-9, 0); ctx.closePath(); ctx.moveTo(0, -6); ctx.lineTo(9, -12); ctx.lineTo(9, 0); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.arc(0, -6, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },

  // ---------- live art ----------
  entities(r, g, items) {
    const st = this.st; if (!st) return;
    const p = g.player;
    // the pinwheel travels with the chef anywhere, spinning in their hand
    if (st.pinwheel && !g.driving && !g.onTrain && !g.travel) {
      items.push({ y: p.y + 0.5, draw: () => { const f = p.facing || 1, bob = p.moving ? Math.sin(p.bob || 0) * 2 : 0; this.drawPinwheel(r, p.x + f * 15, p.y - 16 + bob, st.pinwheel.ang); } });
    }
    if (!this.inside(g)) return;
    const K = CFG.TOYSHOP;
    items.push({ y: K.KEEPER.y, draw: () => this.drawKeeper(r, g) });
    items.push({ y: K.TABLE.y1 + 1, draw: () => this.drawTrain(r, g) });
    items.push({ y: K.STAGE.y1, draw: () => this.drawPuppets(r, g) });
    items.push({ y: K.ROBOT.y, draw: () => this.drawRobot(r, g) });
    items.push({ y: K.BUTTON.y - 20, draw: () => this.drawButton(r, g) });
    for (const b of st.pit.balls) items.push({ y: b.y, draw: () => { const ctx = r.ctx; if (b.z > 2) { ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(b.x, b.y + 3, 6, 3, 0, 0, Math.PI * 2); ctx.fill(); } ctx.fillStyle = b.c; ctx.beginPath(); ctx.arc(b.x, b.y - b.z, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.arc(b.x - 2.5, b.y - b.z - 2.5, 2.2, 0, Math.PI * 2); ctx.fill(); } });
  },
  drawPinwheel(r, x, y, ang) {
    const ctx = r.ctx;
    ctx.strokeStyle = '#8d5a2b'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 26); ctx.stroke();
    ctx.save(); ctx.translate(x, y - 28); ctx.rotate(ang);
    const cols = ['#ff5252', '#ffd740', '#40c4ff', '#69f0ae'];
    for (let i = 0; i < 4; i++) { ctx.fillStyle = cols[i]; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(12, -4); ctx.lineTo(10, -12); ctx.lineTo(3, -8); ctx.closePath(); ctx.fill(); ctx.rotate(Math.PI / 2); }
    ctx.restore();
    ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(43,29,20,0.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y - 28, 2.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  },
  drawKeeper(r, g) {
    const st = this.st, K = CFG.TOYSHOP.KEEPER, ctx = r.ctx, x = K.x, y = K.y, waving = st.wave > 0;
    r.drawPerson(x, y, { shirt: '#ffd740', skin: '#e0ac69', hat: 'cap', capColor: '#e4572e', facing: 1, moving: false, bob: 0, carry: 0, apron: '#ff8fab', pants: '#3b7dd8' });
    if (waving) {
      const hx = x + 22 + Math.sin(st.wave) * 6, hy = y - 46 + Math.cos(st.wave) * 3;
      ctx.strokeStyle = '#ffd740'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + 11, y - 24); ctx.lineTo(hx, hy); ctx.stroke();
      ctx.fillStyle = '#e0ac69'; ctx.beginPath(); ctx.arc(hx, hy, 3.8, 0, Math.PI * 2); ctx.fill();
    }
    if (st.hi > 0 && st.hi < 2.6) r.drawBubble(x + 4, y - 68 + Math.sin(g.time * 4) * 2, () => { ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText('👋 Hi there!', 0, 0); }, 86);
  },
  drawTrain(r, g) {
    const T = CFG.TOYSHOP.TABLE, K = CFG.TOYSHOP.TRACK, ctx = r.ctx, cx = (T.x0 + T.x1) / 2, cy = (T.y0 + T.y1) / 2;
    const a0 = this.st.trainT * 1.1, cols = ['#e4572e', '#3b7dd8', '#2f9e44'];
    for (let i = 2; i >= 0; i--) {
      const a = a0 - i * 0.34, x = cx + Math.cos(a) * K.rx, y = cy + Math.sin(a) * K.ry, dir = Math.atan2(Math.cos(a) * K.ry, -Math.sin(a) * K.rx);
      ctx.save(); ctx.translate(x, y - 3); ctx.rotate(dir);
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(-7, 2, 14, 5);
      ctx.fillStyle = cols[i]; U.roundRect(ctx, -7, -4, 14, 8, 2); ctx.fill();
      ctx.fillStyle = '#2b1d14'; ctx.fillRect(-5, 3, 3, 2); ctx.fillRect(2, 3, 3, 2);
      if (i === 0) { ctx.fillStyle = '#2b1d14'; ctx.fillRect(-3, -7, 7, 4); ctx.fillStyle = '#5c6670'; ctx.fillRect(3, -5, 3, 3); }
      else { ctx.fillStyle = '#ffe08a'; ctx.fillRect(-4, -2, 3, 3); ctx.fillRect(1, -2, 3, 3); }
      ctx.restore();
      if (i === 0 && Math.floor(this.st.trainT * 3) % 2 === 0) { ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(x - 2, y - 14, 3, 0, Math.PI * 2); ctx.arc(x + 2, y - 19, 2.2, 0, Math.PI * 2); ctx.fill(); }
    }
  },
  drawPuppets(r, g) {
    const S = CFG.TOYSHOP.STAGE, ctx = r.ctx, sh = this.st.show, x0 = S.x0 + 8, x1 = S.x1 - 8, top = S.y0 + 22, floor = S.y1 - 12;
    const open = sh ? U.clamp(sh.t < sh.dur - 1 ? sh.t / 0.8 : (sh.dur - sh.t) / 0.8, 0, 1) : 0;
    if (sh && open > 0) {
      const t = sh.t, mid = (x0 + x1) / 2;
      const puppet = (px, bob, col, ears) => {
        const py = floor - 2 - bob;
        ctx.fillStyle = col; U.roundRect(ctx, px - 8, py - 16, 16, 18, 5); ctx.fill();
        ctx.beginPath(); ctx.arc(px, py - 22, 8, 0, Math.PI * 2); ctx.fill();
        if (ears === 'bunny') { ctx.beginPath(); ctx.ellipse(px - 4, py - 34, 2.5, 7, 0, 0, Math.PI * 2); ctx.ellipse(px + 4, py - 34, 2.5, 7, 0, 0, Math.PI * 2); ctx.fill(); }
        else { ctx.beginPath(); ctx.moveTo(px - 8, py - 26); ctx.lineTo(px - 5, py - 36); ctx.lineTo(px - 1, py - 28); ctx.closePath(); ctx.moveTo(px + 8, py - 26); ctx.lineTo(px + 5, py - 36); ctx.lineTo(px + 1, py - 28); ctx.closePath(); ctx.fill(); }
        ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(px - 3, py - 23, 1.3, 0, Math.PI * 2); ctx.arc(px + 3, py - 23, 1.3, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(px, py - 20, 3, 0.2, Math.PI - 0.2); ctx.stroke();
      };
      puppet(mid - 24 + Math.sin(t * 3) * 6, Math.max(0, Math.sin(t * 6)) * 10, '#f8bbd0', 'bunny');
      puppet(mid + 24 + Math.cos(t * 2.5) * 6, Math.max(0, Math.sin(t * 6 + 2)) * 10, '#ff9800', 'fox');
    }
    // the curtains, closed when nothing is on
    const half = (x1 - x0) / 2, cw = half * (1 - open) + 6;
    for (const side of [-1, 1]) {
      const cx = side < 0 ? x0 : x1 - cw;
      ctx.fillStyle = '#d62828'; ctx.fillRect(cx, top, cw, floor - top);
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; for (let x = cx + 5; x < cx + cw - 2; x += 10) ctx.fillRect(x, top, 3, floor - top);
      if (open > 0.2) { ctx.fillStyle = '#ffd740'; ctx.fillRect(cx, top + (floor - top) / 2 - 2, cw, 4); }
    }
    ctx.fillStyle = '#ffd740'; ctx.fillRect(x0 - 2, top - 3, x1 - x0 + 4, 4);
  },
  drawRobot(r, g) {
    const R = this.st.robot, K = CFG.TOYSHOP.ROBOT, ctx = r.ctx;
    r.drawPerson(R.x, K.y, { robot: true, hat: 'antenna', shirt: '#90a4ae', skin: '#cfd8dc', pants: '#607d8b', facing: R.dir, moving: R.walk > 0, bob: R.bob, carry: 0, belt: true });
    // the wind-up key on its back turns while it walks
    const kx = R.x - R.dir * 15, ky = K.y - 22, ang = R.walk > 0 ? R.bob * 0.6 : 0;
    ctx.save(); ctx.translate(kx, ky); ctx.rotate(ang);
    ctx.strokeStyle = '#ffd740'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -9); ctx.stroke();
    ctx.fillStyle = '#ffd740'; ctx.beginPath(); ctx.ellipse(0, -11, 6, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },
  drawButton(r, g) {
    const B = CFG.TOYSHOP.BUTTON, R = this.st.robot, ctx = r.ctx, down = R.pressed > 0 ? 4 : 0;
    ctx.fillStyle = '#b71c1c'; ctx.beginPath(); ctx.ellipse(B.x, B.y + 2, 14, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff5252'; ctx.beginPath(); ctx.ellipse(B.x, B.y - 6 + down, 14, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.ellipse(B.x - 4, B.y - 9 + down, 5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
  },
  screen(r, g) {
    const st = this.st; if (!st || st.fade <= 0 || g.travel) return;
    const ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    ctx.fillStyle = `rgba(20,12,6,${(st.fade / 0.45).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
  },
};

Game.ext.unshift(ToysExt);
Render.ext.push(ToysExt);
