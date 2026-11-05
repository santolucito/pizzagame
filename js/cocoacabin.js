'use strict';
// The Cocoa Cabin on Snowy Peak (js/snow.js, the log cabin with the red ☕ COCOA CABIN sign) can be entered through its
// front door. Inside: a cosy log-cabin room drawn to the chef's scale, with a stone fireplace and crackling flames (sit in
// the plaid armchair to warm up: '🔥 Warm up by the fire'), a cocoa counter with a friendly cocoa maker in a knitted
// beanie ('☕ Get a hot cocoa', free in here; the cup is Snowy Peak's own hot cocoa, so it counts and is still carried
// outside), a wooden table with benches and a bowl of marshmallows ('🍬 Add a marshmallow' plops one into the cup, up to
// three; with no cup the chef just eats one), mittens drying on a line over the mantel, a window with snow falling
// outside, a braided rug, a woodpile and twinkly lights. A Pizza Coin hides in the corner by the woodpile.
// Extension module: registered with Game.ext (unshift, so the door beats Snowy Peak's own buttons) and Render.ext.
// See js/EXTENSIONS.md ("Interiors": the rectangle 18000..18600 × 4000..4400).
CFG.COCOACABIN = {
  DOOR_OUT: { x: 6830, y: 6232 },                  // on the snow just below the cabin's door (CFG.SNOW.CABIN, door at x 6830, y 6200)
  WORLD: { x0: 18000, y0: 4000, x1: 18600, y1: 4400 },
  ROOM: { x0: 18040, y0: 4110, x1: 18560, y1: 4340 }, WALL: 24, BACK_TOP: 4014,   // the tall log back wall
  FIRE: { x0: 18066, x1: 18198, y1: 4146, box: { x0: 18098, x1: 18166, y0: 4064 } }, // chimney breast + hearth (solid to y1); the firebox
  MANTEL_Y: 4054,
  LINE: { x0: 18046, x1: 18214, y: 4026 },                                          // the mitten line over the mantel
  WINDOW: { x0: 18236, y0: 4036, x1: 18324, y1: 4094 },
  COUNTER: { x0: 18352, y0: 4110, x1: 18512, y1: 4160 },                           // top 4110..4134, plank front 4134..4160
  MAKER: { x: 18446, y: 4114 },                                                      // the cocoa maker stands behind the counter
  POT: { x: 18384, y: 4124 },
  COCOA_SPOT: { x: 18434, y: 4192 },                                                // '☕ Get a hot cocoa'
  SIT: { x: 18150, y: 4202 },                                                       // the armchair by the fire
  RUG: { x: 18164, y: 4240, rx: 98, ry: 44 },
  TABLE: { x0: 18410, y0: 4236, x1: 18522, y1: 4268 }, BLOCK: { x0: 18404, y0: 4218, x1: 18528, y1: 4292 },   // table and benches (solid)
  BOWL: { x: 18432, y: 4250 }, MALLOW_SPOT: { x: 18382, y: 4256 },
  WOOD: { x0: 18040, y0: 4236, x1: 18078, y1: 4292 },                              // the woodpile against the left wall (solid)
  EXIT: { x: 18290, y: 4322 },                                                      // the mat inside the door (the door is in the bottom wall)
  POUR_T: 0.9, MUNCH_T: 0.5, MALLOWS: 3, SPOT_R: 30,
};
CFG.AREAS.cocoacabin = { WORLD: CFG.COCOACABIN.WORLD };

const CocoaCabinExt = {
  name: 'cocoacabin',
  defaults: { cocoacabin: { seen: false, cocoas: 0, warms: 0, mallows: 0 } },
  st: null,

  // ---------- state ----------
  build(g) {
    if (!g.s.cocoacabin) g.s.cocoacabin = JSON.parse(JSON.stringify(this.defaults.cocoacabin));
    this.st = { fade: 0, sit: null, pour: 0, munch: 0, mallows: 0, cup: 0, sparks: [], hop: 0, obs: this.makeObstacles() };
  },
  ready(g) { if (!this.st) this.build(g); if (!g.s.cocoacabin) g.s.cocoacabin = JSON.parse(JSON.stringify(this.defaults.cocoacabin)); return this.st; },
  makeObstacles() {
    const K = CFG.COCOACABIN, R = K.ROOM, w = K.WALL, o = [];
    const box = (b) => ({ x: b.x0, y: b.y0, w: b.x1 - b.x0, h: b.y1 - b.y0 });
    o.push({ x: R.x0 - w, y: R.y0 - w, w: R.x1 - R.x0 + 2 * w, h: w }, { x: R.x0 - w, y: R.y1, w: R.x1 - R.x0 + 2 * w, h: w });
    o.push({ x: R.x0 - w, y: R.y0, w, h: R.y1 - R.y0 }, { x: R.x1, y: R.y0, w, h: R.y1 - R.y0 });
    o.push({ x: K.FIRE.x0, y: R.y0, w: K.FIRE.x1 - K.FIRE.x0, h: K.FIRE.y1 - R.y0 });
    o.push({ x: K.COUNTER.x0, y: R.y0, w: K.COUNTER.x1 - K.COUNTER.x0, h: K.COUNTER.y1 - R.y0 });
    o.push(box(K.BLOCK), box(K.WOOD));
    return o;
  },
  obstacles(g) { return g.area === 'cocoacabin' ? this.ready(g).obs : []; },
  free(x, y) {
    const R = CFG.COCOACABIN.ROOM, r = 12;
    if (x < R.x0 + r || x > R.x1 - r || y < R.y0 + r || y > R.y1 - r) return false;
    for (const o of this.st.obs) if (Game.hitRect(x, y, r, o)) return false;
    return true;
  },

  // ---------- helpers ----------
  snowSt() { return typeof SnowExt !== 'undefined' && SnowExt.st ? SnowExt.st : null; },
  // seconds of hot cocoa left in the chef's hand (Snowy Peak's own cup; a local one if Snowy Peak is missing)
  cocoaLeft() { const s = this.snowSt(); return s ? (s.cocoa || 0) : (this.st ? this.st.cup : 0); },
  busy(g) {
    return !!(g.driving || g.onTrain || g.ride || g.travel || g.fishing ||
      (typeof CityExt !== 'undefined' && (CityExt.floor || (CityExt.st && (CityExt.st.cab || CityExt.st.boarding)))) ||
      (this.snowSt() && this.snowSt().lift));
  },
  near(g, s, d = CFG.COCOACABIN.SPOT_R) { return U.dist(g.player.x, g.player.y, s.x, s.y) < d; },
  atDoor(g) { return g.area === 'snow' && !this.busy(g) && this.near(g, CFG.COCOACABIN.DOOR_OUT, 30); },
  say(g, x, y, text, big = true, dur = 1.4) { g.floats.push({ x, y, text, color: '#ffe08a', t: 0, dur, big }); },

  // ---------- game hooks ----------
  action(g) {
    const st = this.ready(g), K = CFG.COCOACABIN;
    if (this.atDoor(g)) return { label: '🚪 Go inside', run: (gg) => this.enter(gg) };
    if (g.area !== 'cocoacabin' || this.busy(g)) return null;
    if (st.sit) return { label: '🚶 Stand up', run: (gg) => this.standUp(gg) };
    if (this.near(g, K.EXIT)) return { label: '🚪 Go outside', run: (gg) => this.leave(gg) };
    if (this.near(g, K.SIT)) return { label: '🔥 Warm up by the fire', run: (gg) => this.sitDown(gg) };
    if (this.near(g, K.COCOA_SPOT) && st.pour <= 0) return { label: '☕ Get a hot cocoa', run: (gg) => this.getCocoa(gg) };
    if (this.near(g, K.MALLOW_SPOT) && st.munch <= 0) {
      if (this.cocoaLeft() > 0 && st.mallows < K.MALLOWS) return { label: '🍬 Add a marshmallow', run: (gg) => this.mallow(gg) };
      return { label: '🍬 Eat a marshmallow', run: (gg) => this.mallow(gg) };
    }
    return null;
  },
  enter(g) {
    const K = CFG.COCOACABIN, p = g.player, st = this.ready(g);
    g.area = 'cocoacabin'; p.x = K.EXIT.x; p.y = K.EXIT.y - 8; p.moving = false; p.facing = -1; p.hasMoved = true; g.cameraSnap = true;
    st.fade = 0.45; st.sit = null; Sfx.ding(); Haptics.tap();
    if (!g.s.cocoacabin.seen) { g.s.cocoacabin.seen = true; g.toast('🍫 Welcome to the Cocoa Cabin!', true); }
  },
  leave(g) {
    const K = CFG.COCOACABIN, p = g.player, st = this.ready(g);
    g.area = 'snow'; p.x = K.DOOR_OUT.x; p.y = K.DOOR_OUT.y; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    st.sit = null; st.fade = 0.45; Sfx.drop();
    const s = this.snowSt(); if (s) { s.lastP = null; s.lastPrint = null; }
  },
  sitDown(g) {
    const st = this.ready(g), p = g.player, K = CFG.COCOACABIN;
    st.sit = { t: 0 }; p.x = K.SIT.x; p.y = K.SIT.y; p.moving = false; p.facing = -1;
    g.s.cocoacabin.warms++;
    this.say(g, p.x, p.y - 78, 'Ahh, toasty! 😊', true, 1.6);
    for (let i = 0; i < 6; i++) st.sparks.push(this.newSpark(true));
    Sfx.pickup(); Haptics.tap();
  },
  standUp(g) { const st = this.ready(g); if (!st.sit) return; st.sit = null; g.player.moving = false; Sfx.drop(); },
  getCocoa(g) {
    const st = this.ready(g), p = g.player, K = CFG.COCOACABIN, s = this.snowSt();
    if (s && CFG.SNOW) { s.cocoa = CFG.SNOW.COCOA_T; if (g.s.snow) g.s.snow.cocoas = (g.s.snow.cocoas || 0) + 1; }
    else st.cup = 30;
    g.s.cocoacabin.cocoas++;
    st.pour = K.POUR_T; st.hop = 0.6; st.mallows = 0;
    this.say(g, K.MAKER.x, K.MAKER.y - 84, 'Here you go! ☕', false, 1.4);
    this.say(g, p.x, p.y - 74, 'Mmm, hot cocoa! ☕', true, 1.6);
    g.fx.push({ kind: 'sparkle', x0: p.x + 17, y0: p.y - 30, x1: p.x + 17, y1: p.y - 30, t: 0, dur: 0.6 });
    Sfx.pickup(); Haptics.success();
  },
  mallow(g) {
    const st = this.ready(g), p = g.player, K = CFG.COCOACABIN;
    st.munch = K.MUNCH_T;
    if (this.cocoaLeft() > 0 && st.mallows < K.MALLOWS) {
      st.mallows++;
      this.say(g, p.x + 17, p.y - 50, st.mallows >= K.MALLOWS ? 'So fluffy! ☁️' : 'Plop! ☁️', false, 1);
    } else {
      g.s.cocoacabin.mallows++;
      this.say(g, p.x, p.y - 74, 'Yum! 😋', true, 1.2);
    }
    Sfx.pickup(); Haptics.tap();
  },
  home(g) { const st = this.ready(g); st.sit = null; st.fade = 0; st.pour = 0; st.munch = 0; st.hop = 0; st.mallows = 0; st.cup = 0; st.sparks = []; },
  // a save or a push that left the chef in a wall or inside the furniture goes back onto the door mat
  rescue(g) {
    const p = g.player, K = CFG.COCOACABIN;
    if (this.free(p.x, p.y)) return false;
    p.x = K.EXIT.x; p.y = K.EXIT.y - 8; p.moving = false;
    if (this.st) this.st.sit = null;
    g.floats.push({ x: p.x, y: p.y - 50, text: 'Oops! Back inside', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    return true;
  },
  newSpark(big) {
    const B = CFG.COCOACABIN.FIRE.box;
    return { x: U.rand(B.x0 + 14, B.x1 - 14), y: CFG.COCOACABIN.ROOM.y0 - 10, vx: U.rand(-14, 14), vy: -U.rand(30, big ? 80 : 50), t: 0, dur: U.rand(0.6, 1.1) };
  },
  update(g, dt) {
    const st = this.ready(g), p = g.player, K = CFG.COCOACABIN;
    st.fade = Math.max(0, st.fade - dt);
    st.cup = Math.max(0, st.cup - dt);
    if (this.cocoaLeft() <= 0) st.mallows = 0;
    for (const s of st.sparks) { s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; }
    st.sparks = st.sparks.filter((s) => s.t < s.dur);
    if (g.area !== 'cocoacabin') { st.sit = null; st.pour = 0; st.hop = 0; return; }
    st.pour = Math.max(0, st.pour - dt); st.munch = Math.max(0, st.munch - dt); st.hop = Math.max(0, st.hop - dt);
    // the fire crackles: a little spark now and then, lots while the chef warms up
    if (Math.random() < dt * (st.sit ? 6 : 1.5)) st.sparks.push(this.newSpark(!!st.sit));
    if (this.busy(g)) return;
    if (st.sit) {
      // walking off the armchair stands the chef up
      st.sit.t += dt;
      if (U.dist(p.x, p.y, K.SIT.x, K.SIT.y) > 4) st.sit = null;
      else { p.facing = -1; if (Math.random() < dt * 0.8) this.say(g, p.x + U.rand(-8, 8), p.y - 70, U.pick(['♥', '♨', '😊']), false, 1); }
    }
    this.rescue(g);
  },
  hint(g) {
    const st = this.ready(g), p = g.player, K = CFG.COCOACABIN, s = g.s.cocoacabin;
    if (g.area === 'snow') {
      if (this.busy(g)) return undefined;
      const d = U.dist(p.x, p.y, K.DOOR_OUT.x, K.DOOR_OUT.y);
      if (d < 70) return { text: 'Go inside the Cocoa Cabin! 🍫', target: d < 30 ? null : K.DOOR_OUT };
      return undefined;
    }
    if (g.area !== 'cocoacabin') return undefined;
    if (this.busy(g)) return null;
    const cup = this.cocoaLeft() > 0;
    if (st.sit) return { text: cup ? 'Cocoa by the fire! So cosy ☕' : 'Toasty warm by the fire! 🔥', target: null };
    if (st.pour > 0) return { text: 'Mmm, hot cocoa! ☕', target: null };
    if (this.near(g, K.SIT)) return { text: 'Warm up by the fire! 🔥', target: null };
    if (this.near(g, K.COCOA_SPOT)) return { text: 'Get a hot cocoa! ☕', target: null };
    if (this.near(g, K.MALLOW_SPOT)) return { text: cup && st.mallows < K.MALLOWS ? 'Add a marshmallow to your cocoa! ☁️' : 'Yummy marshmallows! ☁️', target: null };
    if (!cup && !s.cocoas) return { text: 'Get a hot cocoa! ☕', target: K.COCOA_SPOT };
    if (cup && !st.mallows) return { text: 'Add marshmallows to your cocoa! ☁️', target: K.MALLOW_SPOT };
    if (!s.warms) return { text: 'Warm up by the fire! 🔥', target: K.SIT };
    return { text: cup ? 'Mmm, hot cocoa! ☕' : 'Cosy cocoa cabin! 🍫', target: null };
  },

  // ---------- Snowy Peak outside: a welcome mat at the door ----------
  bgKey() { return 'cocoacabin1'; },
  paintAfter(r, g, area) {
    if (area !== 'snow') return;
    const ctx = r.ctx, D = CFG.COCOACABIN.DOOR_OUT;
    ctx.fillStyle = 'rgba(70,100,150,0.2)'; U.roundRect(ctx, D.x - 22, D.y - 12, 46, 20, 6); ctx.fill();
    ctx.fillStyle = '#c0392b'; U.roundRect(ctx, D.x - 24, D.y - 16, 48, 20, 6); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]); U.roundRect(ctx, D.x - 20, D.y - 13, 40, 14, 4); ctx.stroke(); ctx.setLineDash([]);
    this.drawMug(ctx, D.x, D.y - 6, 0.6, '#ffffff');
  },
  drawMug(ctx, x, y, s, col) {
    ctx.fillStyle = col; U.roundRect(ctx, x - 7 * s, y - 7 * s, 12 * s, 13 * s, 2 * s); ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.arc(x + 6 * s, y - 1 * s, 3.5 * s, -Math.PI / 2, Math.PI / 2); ctx.stroke();
  },

  // ---------- the interior, static ----------
  paint: { cocoacabin(r, g) { CocoaCabinExt.paintRoom(r, g); } },
  paintRoom(r, g) {
    const ctx = r.ctx, K = CFG.COCOACABIN, W = K.WORLD, R = K.ROOM, w = K.WALL, bt = K.BACK_TOP;
    // snow all round the cabin
    ctx.fillStyle = '#e8f0fa'; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    ctx.fillStyle = 'rgba(190,210,235,0.5)'; for (let i = 0; i < 40; i++) { ctx.beginPath(); ctx.ellipse(W.x0 + ((i * 97) % 600), W.y0 + ((i * 53) % 400), 18, 5, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = 'rgba(60,80,120,0.25)'; ctx.fillRect(R.x0 - w + 8, bt + 10, R.x1 - R.x0 + 2 * w, R.y1 + w - bt);
    // the wooden plank floor
    ctx.fillStyle = '#c8915a'; ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0);
    for (let y = R.y0, j = 0; y < R.y1; y += 18, j++) {
      ctx.fillStyle = j % 2 ? '#c08852' : '#cc975f'; ctx.fillRect(R.x0, y, R.x1 - R.x0, 17);
      ctx.fillStyle = '#9a6538'; ctx.fillRect(R.x0, y + 17, R.x1 - R.x0, 1.5);
      for (let x = R.x0 + ((j * 67) % 120); x < R.x1; x += 120) ctx.fillRect(x, y, 1.5, 17);
      ctx.fillStyle = 'rgba(122,74,38,0.35)'; for (let x = R.x0 + ((j * 41) % 90) + 20; x < R.x1; x += 90) { ctx.beginPath(); ctx.arc(x, y + 8, 1.6, 0, Math.PI * 2); ctx.fill(); }
    }
    // the braided rug in front of the fire
    const G = K.RUG, rugCols = ['#c0392b', '#f2b134', '#2f9e44', '#3b7dd8', '#c0392b', '#f2b134', '#fff3e0'];
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(G.x + 3, G.y + 4, G.rx, G.ry, 0, 0, Math.PI * 2); ctx.fill();
    rugCols.forEach((c, i) => { const k = 1 - i / rugCols.length; ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(G.x, G.y, G.rx * k, G.ry * k, 0, 0, Math.PI * 2); ctx.fill(); });
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
    for (let i = 1; i < rugCols.length; i++) { const k = 1 - i / rugCols.length + 0.07; ctx.beginPath(); ctx.ellipse(G.x, G.y, G.rx * k, G.ry * k, 0, 0, Math.PI * 2); ctx.stroke(); }
    ctx.setLineDash([]);
    // the tall log back wall, with a dark roof beam along the top
    ctx.fillStyle = '#9a5f33'; ctx.fillRect(R.x0 - w, bt, R.x1 - R.x0 + 2 * w, R.y0 - bt);
    for (let y = bt + 4; y < R.y0; y += 12) {
      ctx.fillStyle = '#b07040'; ctx.fillRect(R.x0 - w, y, R.x1 - R.x0 + 2 * w, 3);
      ctx.fillStyle = '#7a4a26'; ctx.fillRect(R.x0 - w, y + 9, R.x1 - R.x0 + 2 * w, 3);
    }
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(R.x0 - w, bt - 4, R.x1 - R.x0 + 2 * w, 8);
    ctx.fillStyle = '#4a2e14'; ctx.fillRect(R.x0 - w, R.y0 - 4, R.x1 - R.x0 + 2 * w, 4);   // the skirting where the wall meets the floor
    // side and front walls: thick logs seen from above, log ends at the corners
    ctx.fillStyle = '#8a5530'; ctx.fillRect(R.x0 - w, R.y0, w, R.y1 - R.y0 + w); ctx.fillRect(R.x1, R.y0, w, R.y1 - R.y0 + w); ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, w);
    ctx.fillStyle = '#a86c3c'; ctx.fillRect(R.x0 - w + 4, R.y0, 6, R.y1 - R.y0); ctx.fillRect(R.x1 + 4, R.y0, 6, R.y1 - R.y0); ctx.fillRect(R.x0, R.y1 + 4, R.x1 - R.x0, 6);
    ctx.fillStyle = '#6b3d1f'; ctx.fillRect(R.x0 - w + 14, R.y0, 3, R.y1 - R.y0); ctx.fillRect(R.x1 + 14, R.y0, 3, R.y1 - R.y0); ctx.fillRect(R.x0, R.y1 + 14, R.x1 - R.x0, 3);
    for (const [cx, cy] of [[R.x0 - w / 2, R.y1 + w / 2], [R.x1 + w / 2, R.y1 + w / 2]]) {
      ctx.fillStyle = '#d9a066'; ctx.beginPath(); ctx.arc(cx, cy, 11, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#a86c3c'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.stroke();
    }
    // snow piled on the front wall's top
    ctx.fillStyle = '#ffffff'; for (let x = R.x0 - w + 6; x < R.x1 + w; x += 22) { ctx.beginPath(); ctx.ellipse(x, R.y1 + w - 1, 10, 4, 0, 0, Math.PI * 2); ctx.fill(); }
    // the stone fireplace: chimney breast up the back wall, mantel shelf, dark firebox, hearth stones on the floor
    const F = K.FIRE, B = F.box;
    ctx.fillStyle = '#8d939b'; ctx.fillRect(F.x0, bt - 4, F.x1 - F.x0, R.y0 - bt + 4);
    const stones = (x0, y0, x1, y1, seed) => {
      for (let y = y0, j = 0; y < y1; y += 13, j++) for (let x = x0 - ((j * 9) % 18), i = 0; x < x1; x += 22, i++) {
        const sx = Math.max(x, x0), ex = Math.min(x + 20, x1); if (ex - sx < 4) continue;
        ctx.fillStyle = ['#b3b8bf', '#a3a9b1', '#c3c7cc', '#9aa0a8'][(i * 3 + j + seed) % 4]; U.roundRect(ctx, sx + 1, y + 1, ex - sx - 2, Math.min(11, y1 - y - 1), 4); ctx.fill();
      }
    };
    stones(F.x0, bt, F.x1, R.y0, 0);
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.moveTo(B.x0, R.y0); ctx.lineTo(B.x0, B.y0 + 14); ctx.quadraticCurveTo((B.x0 + B.x1) / 2, B.y0 - 8, B.x1, B.y0 + 14); ctx.lineTo(B.x1, R.y0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3d2a1c'; ctx.fillRect(B.x0 + 6, R.y0 - 12, B.x1 - B.x0 - 12, 12);
    ctx.fillStyle = '#6b3d1f'; U.roundRect(ctx, F.x0 - 8, K.MANTEL_Y, F.x1 - F.x0 + 16, 9, 3); ctx.fill();
    ctx.fillStyle = '#8a5530'; ctx.fillRect(F.x0 - 6, K.MANTEL_Y, F.x1 - F.x0 + 12, 3);
    // on the mantel: a little snow globe, a candle and a tiny pine
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(F.x0 + 6, K.MANTEL_Y - 3, 14, 3);
    ctx.fillStyle = 'rgba(191,227,255,0.85)'; ctx.beginPath(); ctx.arc(F.x0 + 13, K.MANTEL_Y - 9, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(F.x0 + 13, K.MANTEL_Y - 7, 3, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(F.x0 + 13, K.MANTEL_Y - 11, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2f7d4a'; ctx.beginPath(); ctx.moveTo(F.x1 - 14, K.MANTEL_Y - 20); ctx.lineTo(F.x1 - 6, K.MANTEL_Y - 2); ctx.lineTo(F.x1 - 22, K.MANTEL_Y - 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(F.x1 - 14, K.MANTEL_Y - 21, 2, 0, Math.PI * 2); ctx.fill();
    // the hearth: big flat stones out onto the floor
    ctx.fillStyle = '#7d8591'; ctx.fillRect(F.x0, R.y0, F.x1 - F.x0, F.y1 - R.y0);
    stones(F.x0, R.y0, F.x1, F.y1, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(F.x0, F.y1, F.x1 - F.x0, 4);
    // the window frame and its curtains (the snowy view is drawn live)
    const Wn = K.WINDOW;
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, Wn.x0 - 6, Wn.y0 - 6, Wn.x1 - Wn.x0 + 12, Wn.y1 - Wn.y0 + 12, 4); ctx.fill();
    ctx.fillStyle = '#7a4a26'; ctx.fillRect(Wn.x0 - 10, Wn.y1 + 4, Wn.x1 - Wn.x0 + 20, 6);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(Wn.x0 - 8, Wn.y1 + 2, Wn.x1 - Wn.x0 + 16, 3);   // snow on the sill, outside
    for (const [cx, dir] of [[Wn.x0 - 4, 1], [Wn.x1 + 4, -1]]) {
      ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.moveTo(cx - dir * 4, Wn.y0 - 8); ctx.lineTo(cx + dir * 16, Wn.y0 - 8); ctx.quadraticCurveTo(cx + dir * 4, Wn.y0 + 26, cx + dir * 8, Wn.y1 + 6); ctx.lineTo(cx - dir * 4, Wn.y1 + 6); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1.5; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(cx - dir * 2 + dir * k * 4, Wn.y0 - 6); ctx.lineTo(cx - dir * 2 + dir * k * 3, Wn.y1 + 4); ctx.stroke(); }
    }
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(Wn.x0 - 8, Wn.y0 - 10, Wn.x1 - Wn.x0 + 16, 4);   // curtain rod
    // the cocoa corner on the back wall: a shelf of mugs and a big painted mug sign
    const C = K.COUNTER;
    ctx.fillStyle = '#6b3d1f'; ctx.fillRect(C.x0 + 4, 4066, C.x1 - C.x0 - 8, 6);
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(C.x0 + 4, 4072, C.x1 - C.x0 - 8, 3);
    ['#e4572e', '#3b7dd8', '#ffd166', '#2f9e44', '#ff8fab', '#8e5bd1', '#e4572e'].forEach((c, i) => this.drawMug(ctx, C.x0 + 20 + i * 21, 4059, 0.95, c));
    ctx.fillStyle = '#fff3e0'; U.roundRect(ctx, C.x0 + 34, 4020, 92, 34, 8); ctx.fill();
    ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 2.5; U.roundRect(ctx, C.x0 + 34, 4020, 92, 34, 8); ctx.stroke();
    this.drawMug(ctx, C.x0 + 56, 4040, 1.4, '#c0392b');
    ctx.fillStyle = '#7a4a26'; ctx.beginPath(); ctx.ellipse(C.x0 + 55, 4031, 6, 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c0392b'; ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('COCOA', C.x0 + 98, 4038);
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(C.x0 + 48, 4027, 2.5, 0, Math.PI * 2); ctx.arc(C.x0 + 55, 4026, 2.5, 0, Math.PI * 2); ctx.arc(C.x0 + 62, 4027, 2.5, 0, Math.PI * 2); ctx.fill();
    // coat pegs in the far corner: a striped scarf and a woolly hat, skis leaning against the wall
    const px = R.x1 - 22;
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(px - 14, 4040, 30, 4); ctx.fillRect(px - 10, 4036, 3, 8); ctx.fillRect(px + 8, 4036, 3, 8);
    for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? '#ffffff' : '#2f9e44'; ctx.fillRect(px - 12, 4044 + k * 7, 7, 7); }
    ctx.fillStyle = '#3b7dd8'; ctx.beginPath(); ctx.arc(px + 10, 4054, 9, Math.PI, 0); ctx.fill(); ctx.fillRect(px + 1, 4054, 18, 4);
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(px + 10, 4043, 4, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(R.x1 + 10, R.y0 - 2); ctx.rotate(-0.12);
    for (const [dx, c] of [[-6, '#e4572e'], [2, '#ffd166']]) { ctx.fillStyle = c; U.roundRect(ctx, dx, -70, 6, 70, 3); ctx.fill(); }
    ctx.restore();
    // the front door in the bottom wall, and its braided mat inside
    const X = K.EXIT;
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(X.x - 22, R.y1, 44, w);
    ctx.fillStyle = '#7a4a26'; ctx.fillRect(X.x - 19, R.y1 + 3, 38, w - 6);
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(X.x + 13, R.y1 + w / 2, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2f9e44'; U.roundRect(ctx, X.x - 26, X.y - 12, 52, 20, 9); ctx.fill();
    ctx.fillStyle = '#c0392b'; U.roundRect(ctx, X.x - 21, X.y - 8, 42, 12, 6); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3; ctx.moveTo(X.x - Math.cos(a) * 5, X.y - 2 - Math.sin(a) * 5); ctx.lineTo(X.x + Math.cos(a) * 5, X.y - 2 + Math.sin(a) * 5); }
    ctx.stroke();
    // the name plate on the snow below the door
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, (R.x0 + R.x1) / 2 - 64, R.y1 + w + 6, 128, 16, 5); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🍫 COCOA CABIN 🍫', (R.x0 + R.x1) / 2, R.y1 + w + 14);
  },

  // ---------- moving things ----------
  drawOutside(r, g) {
    const ctx = r.ctx, W = CFG.COCOACABIN.WORLD, x0 = r.camX - 20, y0 = r.camY - 20, x1 = r.camX + r.viewW + 20, y1 = r.camY + r.viewH + 20;
    ctx.fillStyle = '#e8f0fa';
    // (2 px over the map's edge so no seam shows between the snow outside and the painted snow)
    if (y0 < W.y0) ctx.fillRect(x0, y0, x1 - x0, W.y0 - y0 + 2);
    if (y1 > W.y1) ctx.fillRect(x0, W.y1 - 2, x1 - x0, y1 - W.y1 + 2);
    if (x0 < W.x0) ctx.fillRect(x0, W.y0, W.x0 - x0 + 2, W.y1 - W.y0);
    if (x1 > W.x1) ctx.fillRect(W.x1 - 2, W.y0, x1 - W.x1 + 2, W.y1 - W.y0);
  },
  // the fire: logs, layered flickering flames and a warm glow on the floor
  drawFire(r, g) {
    const ctx = r.ctx, K = CFG.COCOACABIN, B = K.FIRE.box, R = K.ROOM, t = g.time, st = this.st, cx = (B.x0 + B.x1) / 2, base = R.y0 - 4, big = st.sit ? 1.25 : 1;
    const glow = 0.22 + Math.sin(t * 7) * 0.03 + Math.sin(t * 13) * 0.02 + (st.sit ? 0.08 : 0);
    const gr = ctx.createRadialGradient(cx, R.y0 + 20, 6, cx, R.y0 + 30, 150);
    gr.addColorStop(0, `rgba(255,170,60,${glow.toFixed(3)})`); gr.addColorStop(1, 'rgba(255,170,60,0)');
    ctx.fillStyle = gr; ctx.fillRect(cx - 160, R.y0 - 60, 320, 230);
    ctx.save(); ctx.beginPath(); ctx.moveTo(B.x0, R.y0); ctx.lineTo(B.x0, B.y0 + 14); ctx.quadraticCurveTo(cx, B.y0 - 8, B.x1, B.y0 + 14); ctx.lineTo(B.x1, R.y0); ctx.closePath(); ctx.clip();
    const flame = (x, h, wdt, col, ph) => {
      const sway = Math.sin(t * 6 + ph) * 3, hh = h * big * (0.85 + Math.sin(t * 9 + ph * 2) * 0.15);
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - wdt, base);
      ctx.quadraticCurveTo(x - wdt, base - hh * 0.55, x + sway, base - hh);
      ctx.quadraticCurveTo(x + wdt, base - hh * 0.55, x + wdt, base); ctx.closePath(); ctx.fill();
    };
    for (const [dx, ph] of [[-16, 0], [0, 1.7], [16, 3.1]]) flame(cx + dx, 34, 11, '#e4572e', ph);
    for (const [dx, ph] of [[-10, 0.6], [8, 2.4]]) flame(cx + dx, 26, 8, '#ff9f1c', ph);
    for (const [dx, ph] of [[-4, 1.2], [6, 2.9]]) flame(cx + dx, 16, 5, '#ffe066', ph);
    ctx.restore();
    // the logs in front of the flames
    for (const [dx, a] of [[-12, 0.18], [12, -0.18]]) {
      ctx.save(); ctx.translate(cx + dx, base - 1); ctx.rotate(a);
      ctx.fillStyle = '#6b3d1f'; U.roundRect(ctx, -18, -5, 36, 9, 4); ctx.fill();
      ctx.fillStyle = '#d9a066'; ctx.beginPath(); ctx.ellipse(dx < 0 ? -18 : 18, -0.5, 3, 4.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = `rgba(255,120,40,${(0.6 + Math.sin(t * 11) * 0.3).toFixed(2)})`; ctx.beginPath(); ctx.ellipse(cx, base + 2, 18, 3, 0, 0, Math.PI * 2); ctx.fill();   // embers
    for (const s of st.sparks) { const k = s.t / s.dur; ctx.fillStyle = `rgba(255,${Math.round(200 - k * 80)},60,${(1 - k).toFixed(2)})`; ctx.beginPath(); ctx.arc(s.x, s.y, 1.8, 0, Math.PI * 2); ctx.fill(); }
  },
  // mittens drying on the line over the mantel, swinging gently in the warm air
  drawMittens(r, g) {
    const ctx = r.ctx, L = CFG.COCOACABIN.LINE, t = g.time, sag = 6;
    const yAt = (x) => { const k = (x - L.x0) / (L.x1 - L.x0); return L.y + sag * 4 * k * (1 - k); };
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(L.x0 - 3, L.y - 4, 5, 8); ctx.fillRect(L.x1 - 2, L.y - 4, 5, 8);
    ctx.strokeStyle = '#f2e6d0'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(L.x0, L.y); ctx.quadraticCurveTo((L.x0 + L.x1) / 2, L.y + sag * 2, L.x1, L.y); ctx.stroke();
    const cols = [['#e4572e', '#ffffff'], ['#3b7dd8', '#ffd166'], ['#2f9e44', '#ffffff'], ['#ff8fab', '#ffffff']];
    for (let i = 0; i < 4; i++) {
      const [c, cuff] = cols[i];
      for (let j = 0; j < 2; j++) {
        const x = L.x0 + 22 + i * 40 + j * 15, y = yAt(x), a = Math.sin(t * 1.6 + i * 1.3 + j) * 0.12;
        ctx.save(); ctx.translate(x, y); ctx.rotate(a);
        ctx.fillStyle = '#b07a45'; ctx.fillRect(-1.5, -2, 3, 5);   // a peg
        ctx.fillStyle = cuff; ctx.fillRect(-5, 2, 10, 4);
        ctx.fillStyle = c; U.roundRect(ctx, -5.5, 5, 11, 13, 5); ctx.fill();
        ctx.beginPath(); ctx.ellipse(j ? 5 : -5, 9, 2.6, 3.6, j ? 0.4 : -0.4, 0, Math.PI * 2); ctx.fill();   // the thumb
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(-4, 10, 8, 1.5);
        ctx.restore();
      }
    }
  },
  // the snowy view through the window: sky, a hill with pines, and snowflakes falling
  drawWindow(r, g) {
    const ctx = r.ctx, Wn = CFG.COCOACABIN.WINDOW, t = g.time, w = Wn.x1 - Wn.x0, h = Wn.y1 - Wn.y0;
    ctx.save(); ctx.beginPath(); ctx.rect(Wn.x0, Wn.y0, w, h); ctx.clip();
    const sky = ctx.createLinearGradient(0, Wn.y0, 0, Wn.y1); sky.addColorStop(0, '#9cc8ee'); sky.addColorStop(1, '#dcecfa'); ctx.fillStyle = sky; ctx.fillRect(Wn.x0, Wn.y0, w, h);
    ctx.fillStyle = '#c9dcf0'; ctx.beginPath(); ctx.moveTo(Wn.x0, Wn.y0 + 34); ctx.lineTo(Wn.x0 + 26, Wn.y0 + 14); ctx.lineTo(Wn.x0 + 48, Wn.y0 + 30); ctx.lineTo(Wn.x0 + 70, Wn.y0 + 10); ctx.lineTo(Wn.x1, Wn.y0 + 30); ctx.lineTo(Wn.x1, Wn.y1); ctx.lineTo(Wn.x0, Wn.y1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(Wn.x0 + 30, Wn.y1 + 4, 60, 18, 0, 0, Math.PI * 2); ctx.ellipse(Wn.x1 - 10, Wn.y1 + 6, 50, 16, 0, 0, Math.PI * 2); ctx.fill();
    for (const [px, sz] of [[Wn.x0 + 18, 1], [Wn.x0 + 66, 0.8]]) {
      const py = Wn.y1 - 8;
      ctx.fillStyle = '#2f7d4a'; ctx.beginPath(); ctx.moveTo(px, py - 30 * sz); ctx.lineTo(px + 11 * sz, py); ctx.lineTo(px - 11 * sz, py); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(px, py - 30 * sz); ctx.lineTo(px + 5 * sz, py - 18 * sz); ctx.lineTo(px - 5 * sz, py - 18 * sz); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 18; i++) {
      const sp = 14 + ((i * 37) % 17), fx = ((i * 53) % w), fy = ((i * 29) % h + t * sp) % (h + 6) - 3, rr = 1.1 + (i % 3) * 0.5;
      ctx.beginPath(); ctx.arc(Wn.x0 + ((fx + Math.sin(t * 0.9 + i) * 4) % w + w) % w, Wn.y0 + fy, rr, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    // the panes and a frosty corner
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(Wn.x0 + w / 2 - 2, Wn.y0, 4, h); ctx.fillRect(Wn.x0, Wn.y0 + h / 2 - 2, w, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.moveTo(Wn.x0, Wn.y1); ctx.lineTo(Wn.x0 + 14, Wn.y1); ctx.quadraticCurveTo(Wn.x0 + 4, Wn.y1 - 4, Wn.x0, Wn.y1 - 14); ctx.closePath(); ctx.fill();
  },
  // twinkly lights along the roof beam
  drawLights(r, g) {
    const ctx = r.ctx, K = CFG.COCOACABIN, R = K.ROOM, y = K.BACK_TOP + 2, t = g.time, cols = ['#ff5c8a', '#ffd166', '#4dd0e1', '#41b883', '#ff9f1c'];
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1; ctx.beginPath();
    for (let x = R.x0 - 16; x <= R.x1 + 16; x += 26) { if (x === R.x0 - 16) ctx.moveTo(x, y); else ctx.quadraticCurveTo(x - 13, y + 8, x, y); }
    ctx.stroke();
    let i = 0;
    for (let x = R.x0 - 3; x < R.x1 + 10; x += 26, i++) {
      const on = Math.sin(t * 2.2 + i * 1.7) > -0.4;
      ctx.fillStyle = cols[i % cols.length]; ctx.globalAlpha = on ? 1 : 0.45; ctx.beginPath(); ctx.ellipse(x, y + 7, 2.6, 3.6, 0, 0, Math.PI * 2); ctx.fill();
      if (on) { ctx.globalAlpha = 0.22; ctx.beginPath(); ctx.arc(x, y + 7, 7, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
  },
  dynamic(r, g) {
    const st = this.st; if (!st || g.area !== 'cocoacabin') return;
    this.drawOutside(r, g);
    this.drawWindow(r, g);
    this.drawFire(r, g);
    this.drawMittens(r, g);
    this.drawLights(r, g);
  },
  // the friendly cocoa maker: a knitted beanie with a pom-pom, a stripy sweater, rosy cheeks (hops when she pours)
  drawMaker(r, g) {
    const ctx = r.ctx, K = CFG.COCOACABIN, M = K.MAKER, st = this.st, hop = st.hop > 0 ? -Math.abs(Math.sin(st.hop * 10)) * 5 : 0;
    const x = M.x, y = M.y + hop, p = g.player, f = p.x < x - 6 ? -1 : 1;
    r.drawPerson(x, y, { shirt: '#c0392b', stripes: true, skin: '#e0ac69', hair: '#8a4a1c', hairStyle: 1, facing: f, moving: false, bob: 0, carry: 0, pants: '#5b3a1a', apron: '#fff3e0' });
    ctx.fillStyle = '#3b7dd8'; ctx.beginPath(); ctx.arc(x, y - 42, 11.5, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#ffffff'; U.roundRect(ctx, x - 12.5, y - 45, 25, 5, 2.5); ctx.fill();
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(x, y - 55, 4.5, 0, Math.PI * 2); ctx.fill();
  },
  drawCounter(r, g) {
    const ctx = r.ctx, K = CFG.COCOACABIN, C = K.COUNTER, t = g.time, st = this.st, topH = 24;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(C.x0 + 4, C.y1 - 3, C.x1 - C.x0, 7);
    ctx.fillStyle = '#8a5530'; ctx.fillRect(C.x0, C.y0 + topH, C.x1 - C.x0, C.y1 - C.y0 - topH);
    ctx.fillStyle = '#6b3d1f'; for (let x = C.x0 + 16; x < C.x1; x += 16) ctx.fillRect(x, C.y0 + topH, 2, C.y1 - C.y0 - topH);
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(C.x0, C.y1 - 4, C.x1 - C.x0, 4);
    ctx.fillStyle = '#7a4a26'; U.roundRect(ctx, C.x0 - 4, C.y0 - 2, C.x1 - C.x0 + 8, topH + 4, 5); ctx.fill();
    ctx.fillStyle = '#d9a066'; U.roundRect(ctx, C.x0 - 2, C.y0, C.x1 - C.x0 + 4, topH - 2, 4); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(C.x0 + 2, C.y0 + 3, C.x1 - C.x0 - 4, 3);
    // the big cocoa pot on a little burner, with steam (it puffs up when she pours)
    const P = K.POT, pour = st.pour > 0;
    ctx.fillStyle = '#5c6670'; U.roundRect(ctx, P.x - 15, P.y + 2, 30, 6, 2); ctx.fill();
    ctx.fillStyle = '#c0392b'; U.roundRect(ctx, P.x - 13, P.y - 18, 26, 21, 6); ctx.fill();
    ctx.fillStyle = '#e4572e'; ctx.fillRect(P.x - 13, P.y - 12, 26, 3);
    ctx.fillStyle = '#9b2a1f'; ctx.fillRect(P.x - 16, P.y - 18, 32, 4);
    ctx.fillStyle = '#7a4a26'; ctx.beginPath(); ctx.ellipse(P.x, P.y - 18, 11, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(P.x + 13, P.y - 12); ctx.lineTo(P.x + 21, P.y - 15); ctx.stroke();
    for (let i = 0; i < (pour ? 5 : 3); i++) {
      const k = ((t * (pour ? 1.4 : 0.7)) + i / (pour ? 5 : 3)) % 1;
      ctx.fillStyle = `rgba(255,255,255,${(0.75 * (1 - k)).toFixed(2)})`; ctx.beginPath(); ctx.arc(P.x + Math.sin(k * 6 + i) * 4, P.y - 24 - k * 26, 3 + k * 4, 0, Math.PI * 2); ctx.fill();
    }
    // a stack of mugs, a jar of marshmallows and a fresh cup she just poured
    for (let k = 0; k < 3; k++) this.drawMug(ctx, C.x1 - 26, C.y0 + 15 - k * 7, 0.9, ['#3b7dd8', '#ffd166', '#2f9e44'][k]);
    ctx.fillStyle = 'rgba(191,227,255,0.7)'; U.roundRect(ctx, C.x0 + 36, C.y0 - 4, 16, 20, 4); ctx.fill();
    ctx.fillStyle = '#ffffff'; for (const [dx, dy] of [[40, 4], [47, 6], [43, 10], [48, 12], [40, 13]]) { U.roundRect(ctx, C.x0 + dx - 3, C.y0 + dy - 3, 6, 5, 2); ctx.fill(); }
    ctx.fillStyle = '#c0392b'; ctx.fillRect(C.x0 + 35, C.y0 - 6, 18, 4);
    if (pour) this.drawCup(ctx, K.MAKER.x - 4, C.y0 + 12, t, 1, 0);
  },
  // a red hot-cocoa cup like Snowy Peak's own, with up to three marshmallows bobbing on top
  drawCup(ctx, x, y, t, f, mallows) {
    for (let i = 0; i < 2; i++) { const k = (t * 0.8 + i * 0.5) % 1; ctx.fillStyle = `rgba(255,255,255,${(0.7 * (1 - k)).toFixed(2)})`; ctx.beginPath(); ctx.arc(x + Math.sin(k * 6 + i) * 3, y - 12 - k * 16, 3 + k * 3, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x + f * 8, y - 1, 4.5, -Math.PI / 2, Math.PI / 2, f < 0); ctx.stroke();
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, x - 8, y - 9, 16, 16, 3); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 8, y - 3, 16, 3);
    ctx.fillStyle = '#7a4a26'; ctx.beginPath(); ctx.ellipse(x, y - 8, 6, 2, 0, 0, Math.PI * 2); ctx.fill();
    this.drawMallows(ctx, x, y, t, mallows);
  },
  drawMallows(ctx, x, y, t, n) {
    const at = [[-3, -10], [3, -11], [0, -14]];
    for (let i = 0; i < Math.min(n, 3); i++) {
      const [dx, dy] = at[i], b = Math.sin(t * 3 + i) * 0.6;
      ctx.fillStyle = '#ffffff'; U.roundRect(ctx, x + dx - 3.5, y + dy - 3 + b, 7, 6, 2); ctx.fill();
      ctx.strokeStyle = '#f2d9e6'; ctx.lineWidth = 0.8; ctx.stroke();
    }
  },
  drawCarried(r, g) {
    const p = g.player, f = p.facing || 1, bob = p.moving ? Math.sin(p.bob || 0) * 2 : 0;
    this.drawCup(r.ctx, p.x + f * 17, p.y - 22 + bob, g.time, f, this.st.mallows);
  },
  // the plaid armchair by the fire: the back goes behind the chef, the seat front and arms in front
  drawChairBack(r, g) {
    const ctx = r.ctx, S = CFG.COCOACABIN.SIT, x = S.x, y = S.y;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(x + 3, y + 6, 32, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9b1d1d'; U.roundRect(ctx, x - 26, y - 50, 52, 44, 14); ctx.fill();
    ctx.fillStyle = '#c62828'; U.roundRect(ctx, x - 22, y - 46, 44, 38, 11); ctx.fill();
    ctx.strokeStyle = 'rgba(255,209,102,0.55)'; ctx.lineWidth = 2; ctx.beginPath();
    for (const dx of [-11, 0, 11]) { ctx.moveTo(x + dx, y - 45); ctx.lineTo(x + dx, y - 9); }
    for (const dy of [-36, -22]) { ctx.moveTo(x - 21, y + dy); ctx.lineTo(x + 21, y + dy); }
    ctx.stroke();
  },
  drawChairFront(r, g) {
    const ctx = r.ctx, S = CFG.COCOACABIN.SIT, x = S.x, y = S.y;
    ctx.fillStyle = '#9b1d1d'; U.roundRect(ctx, x - 24, y - 12, 48, 18, 6); ctx.fill();
    ctx.fillStyle = '#c62828'; U.roundRect(ctx, x - 21, y - 10, 42, 13, 5); ctx.fill();
    ctx.strokeStyle = 'rgba(255,209,102,0.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 20, y - 4); ctx.lineTo(x + 20, y - 4); ctx.moveTo(x - 6, y - 10); ctx.lineTo(x - 6, y + 3); ctx.moveTo(x + 8, y - 10); ctx.lineTo(x + 8, y + 3); ctx.stroke();
    for (const s of [-1, 1]) { ctx.fillStyle = '#9b1d1d'; U.roundRect(ctx, x + s * 30 - 7, y - 30, 14, 36, 7); ctx.fill(); ctx.fillStyle = '#d32f2f'; U.roundRect(ctx, x + s * 30 - 5, y - 30, 10, 10, 5); ctx.fill(); }
    ctx.fillStyle = '#5b3a1a'; for (const s of [-1, 1]) ctx.fillRect(x + s * 28 - 2, y + 5, 4, 4);
  },
  drawTable(r, g) {
    const ctx = r.ctx, K = CFG.COCOACABIN, T = K.TABLE, t = g.time, w = T.x1 - T.x0;
    const bench = (y) => {
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(T.x0 + 4, y + 10, w - 4, 4);
      ctx.fillStyle = '#5b3a1a'; ctx.fillRect(T.x0 + 6, y + 6, 4, 8); ctx.fillRect(T.x1 - 10, y + 6, 4, 8);
      ctx.fillStyle = '#8a5530'; U.roundRect(ctx, T.x0 + 2, y, w - 4, 9, 3); ctx.fill();
      ctx.fillStyle = '#a86c3c'; ctx.fillRect(T.x0 + 4, y + 1, w - 8, 2);
    };
    bench(T.y0 - 16);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(T.x0 + 4, T.y1 + 4, w, 6);
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(T.x0 + 6, T.y1, 6, 10); ctx.fillRect(T.x1 - 12, T.y1, 6, 10);
    ctx.fillStyle = '#7a4a26'; U.roundRect(ctx, T.x0, T.y0, w, T.y1 - T.y0 + 6, 4); ctx.fill();
    ctx.fillStyle = '#b07a45'; U.roundRect(ctx, T.x0, T.y0, w, T.y1 - T.y0, 4); ctx.fill();
    ctx.fillStyle = '#9a6538'; for (let y = T.y0 + 8; y < T.y1; y += 8) ctx.fillRect(T.x0 + 2, y, w - 4, 1.2);
    // a checked runner, the marshmallow bowl, two mugs and a plate of cookies
    for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#ffffff' : '#c0392b'; ctx.fillRect(T.x0 + 24 + i * 11, T.y0 + 4, 11, T.y1 - T.y0 - 8); }
    const Bw = K.BOWL;
    ctx.fillStyle = '#3b7dd8'; ctx.beginPath(); ctx.ellipse(Bw.x, Bw.y, 15, 6, 0, 0, Math.PI); ctx.fill(); ctx.fillRect(Bw.x - 15, Bw.y - 3, 30, 3);
    ctx.fillStyle = '#ffffff'; for (const [dx, dy] of [[-9, -5], [-3, -7], [3, -6], [9, -5], [-6, -10], [1, -11], [7, -9], [-1, -14]]) { U.roundRect(ctx, Bw.x + dx - 3.5, Bw.y + dy - 2, 7, 6, 2); ctx.fill(); ctx.strokeStyle = '#f2d9e6'; ctx.lineWidth = 0.8; ctx.stroke(); }
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(T.x1 - 22, T.y0 + 16, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c8915a'; for (const dx of [-5, 4]) { ctx.beginPath(); ctx.arc(T.x1 - 22 + dx, T.y0 + 14, 4, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#5b3a1a'; for (const dx of [-6, -3, 3, 6]) ctx.fillRect(T.x1 - 22 + dx, T.y0 + 13, 1.5, 1.5);
    this.drawMug(ctx, T.x0 + 66, T.y0 + 18, 0.9, '#ffd166'); this.drawMug(ctx, T.x0 + 84, T.y0 + 14, 0.9, '#2f9e44');
    const mk = this.st.munch > 0 ? Math.sin(t * 30) * 1.5 : 0;
    if (mk) { ctx.fillStyle = '#ffffff'; U.roundRect(ctx, Bw.x - 3 + mk, Bw.y - 22, 7, 6, 2); ctx.fill(); }
    bench(T.y1 + 10);
  },
  drawWoodpile(r, g) {
    const ctx = r.ctx, Wd = CFG.COCOACABIN.WOOD, w = Wd.x1 - Wd.x0;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(Wd.x0, Wd.y1 - 4, w + 6, 8);
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(Wd.x0 + 2, Wd.y0, 3, Wd.y1 - Wd.y0); ctx.fillRect(Wd.x1 - 5, Wd.y0, 3, Wd.y1 - Wd.y0);
    for (let row = 0; row < 4; row++) for (let i = 0; i < 3; i++) {
      const x = Wd.x0 + 7 + i * 12 + (row % 2) * 4, y = Wd.y1 - 8 - row * 13;
      if (x > Wd.x1 - 5) continue;
      ctx.fillStyle = '#7a4a26'; ctx.beginPath(); ctx.arc(x, y, 6.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d9a066'; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#b07a45'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.stroke();
    }
  },
  entities(r, g, items) {
    const st = this.st; if (!st) return;
    const p = g.player, K = CFG.COCOACABIN, carrying = this.cocoaLeft() > 0 && !g.driving && !g.travel && !g.onTrain;
    if (g.area === 'snow') {
      // the marshmallows stay in the cup outside too (Snowy Peak draws the cup itself)
      const s = this.snowSt();
      if (carrying && st.mallows > 0 && s && !s.lift) {
        const f = p.facing || 1, bob = p.moving ? Math.sin(p.bob || 0) * 2 : 0;
        items.push({ y: p.y + 1.2, draw: () => this.drawMallows(r.ctx, p.x + f * 17, p.y - 22 + bob, g.time, st.mallows) });
      }
      return;
    }
    if (g.area !== 'cocoacabin') return;
    if (carrying) items.push({ y: p.y + (st.sit ? 2 : 0.5), draw: () => this.drawCarried(r, g) });
    items.push({ y: K.MAKER.y, draw: () => this.drawMaker(r, g) });
    items.push({ y: K.COUNTER.y1, draw: () => this.drawCounter(r, g) });
    items.push({ y: K.SIT.y - 1, draw: () => this.drawChairBack(r, g) });
    items.push({ y: K.SIT.y + 1, draw: () => this.drawChairFront(r, g) });
    items.push({ y: K.BLOCK.y0 + 1, draw: () => this.drawTable(r, g) });
    items.push({ y: K.WOOD.y1, draw: () => this.drawWoodpile(r, g) });
  },
  screen(r, g) {
    if (!this.st || this.st.fade <= 0) return;
    const ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    ctx.fillStyle = `rgba(20,12,6,${(this.st.fade / 0.45).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
  },
};
Game.ext.unshift(CocoaCabinExt);   // first in line so the door's button and hint beat Snowy Peak's own
Render.ext.push(CocoaCabinExt);
