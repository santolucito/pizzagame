'use strict';
// The playroom: a big bright room behind the bedroom, through a green door on the bedroom's north wall (painted onto
// the bedroom with `paintAfter`, between the bedside table and the wardrobe). Its own map (`CFG.AREAS.playroom`).
//  * THE BIG SLIDE: a blue play tower with a ladder ('🪜 Climb up'). The chef climbs, says "Wheee!" at the top and
//    whooshes down a twisty yellow-and-red slide (one and a quarter turns round a pole) into the ball pit: balls fly,
//    the chef sinks in up to the neck, then hops out. The chef sits in the chute all the way; the camera follows.
//  * THE BALL PIT: '🏊 Jump in the ball pit' from its front edge: a hop, a splash of balls, head poking out, hop out.
//  * THE TRAMPOLINE: '🤸 Bounce!': four bounces, each higher ("Boing!"), then a hop off.
//  * THE TOY TRAIN on an oval track: '🚂 Ride the toy train' (a vehicle, so it is rideable): one lap, "Choo choo!".
//  * THE PLAY CASTLE: '🏰 Crawl into the castle' (a building, so it can be entered): the chef crawls in and peeks out of
//    the tower window ("Peekaboo!"); '🚶 Crawl out' again.
//  * THE SOFT BLOCKS: '💥 Knock down the blocks' (they tumble across the floor), then '🧱 Stack the blocks' again.
//  * THE TOWN SLIDE: a window in the west wall: '🛝 Slide down to town!' The chef climbs out and slides down a long
//    chute on the pizzeria's west wall (drawn in the town map), landing on a soft mat on the grass by the park.
// Extension module: registered with Game.ext (first, so its door beats the bedroom's buttons) and Render.ext.
// See the hook list in js/EXTENSIONS.md. Only reads UpstairsExt.st (to keep out of the way of a nap, the catalog...).
CFG.PLAYROOM = {
  name: 'Playroom', ico: '🛝',
  WORLD: { x0: 31500, y0: 4000, x1: 32700, y1: 4900 },
  ROOM: { x0: 31560, y0: 4140, x1: 32640, y1: 4840 }, WALL: 26, BACK: 4040,     // BACK: top of the tall painted back wall
  // the way in: a door on the bedroom's north wall between the bedside table and the wardrobe, and its mat
  DOOR_OUT: { x0: 6644, y0: 1508, x1: 6684, y1: 1560 }, MAT_OUT: { x: 6664, y: 1586 },
  // the way back: a door in the playroom's south wall (the bedroom lies to the south), and the mat inside it
  DOOR_IN: { x0: 31876, y0: 4840, x1: 31924, y1: 4866 }, EXIT: { x: 31900, y: 4806 },
  reach: 26, hintReach: 70, near: 34, fade: 0.4,
  // the big slide: the tower (ground footprint, platform height), the ladder's foot, the spiral and the run into the pit
  TOWER: { x0: 31958, y0: 4262, x1: 32042, y1: 4318, h: 100 },
  LADDER: { x: 32000, y: 4342 },
  SPIRAL: { x: 32200, y: 4300, rx: 72, ry: 40, turns: 1.25, h0: 92, h1: 36, n: 44 },
  RUN: [[32222, 4374, 22], [32244, 4410, 8], [32262, 4438, 0]],                     // [x, y, height] after the spiral
  climb: 1.1, walk: 0.35, slide: 2.6, sink: 1.3, hop: 0.45,                       // seconds
  // the ball pit (ground rect), where the chef sits in it, and the spot at its front edge
  PIT: { x0: 32196, y0: 4400, x1: 32404, y1: 4544, seat: { x: 32300, y: 4476 }, land: { x: 32270, y: 4458 }, spot: { x: 32300, y: 4572 } },
  // the trampoline (centre, radii) and the spot in front of it
  TRAMP: { x: 31760, y: 4318, rx: 56, ry: 30, spot: { x: 31760, y: 4378 }, bounces: [40, 60, 80, 104], each: 0.6 },
  // the play castle (ground footprint), the chef's spot inside, and the crawl spot in front of its door
  CASTLE: { x0: 31690, y0: 4572, x1: 31830, y1: 4628, inside: { x: 31760, y: 4598 }, spot: { x: 31760, y: 4658 }, crawl: 0.45 },
  // the toy train: an oval track; the train parks at the bottom (angle a0), the chef boards from just above it
  TRAIN: { x: 32340, y: 4720, rx: 210, ry: 62, a0: Math.PI / 2, gap: 0.3, lap: 7, spot: { x: 32340, y: 4744 }, block: [32318, 4766, 164, 32] },
  // the soft blocks: a little pyramid by the east wall, the spot in front of it
  BLOCKS: { x: 32540, y: 4330, size: 30, spot: { x: 32540, y: 4384 }, block: [32490, 4300, 100, 44] },
  // the window in the west wall with the slide down to town, and the spot in front of it
  WINDOW: { y0: 4430, y1: 4510, spot: { x: 31594, y: 4470 }, out: 0.5 },
  // the chute down the outside of the pizzeria's west wall in the town map: [x, y, height] from the wall to the mat
  TOWN: { path: [[-12, 524, 86], [-34, 540, 70], [-56, 562, 48], [-74, 588, 26], [-84, 608, 8], [-86, 620, 0]], land: { x: -86, y: 622 }, dur: 1.6 },
};
CFG.AREAS.playroom = { WORLD: CFG.PLAYROOM.WORLD, place: 'town', noSky: true };

const PLAYROOM_BALLS = ['#ff5c5c', '#ffd166', '#5ad26f', '#4aa3ff', '#ff8fab', '#b07cff', '#ffa94d'];
const PLAYROOM_BLOCKS = ['#ff5c5c', '#4aa3ff', '#ffd166', '#5ad26f', '#b07cff', '#ff8fab'];

const PlayroomExt = {
  name: 'playroom',
  st: null,   // runtime: { ride: null | { kind, phase, t, ... }, fade, balls: [], slidPath, blocks: { down, t, pieces }, train: { a }, slid }

  // ---------- saved state ----------
  defaults: { playroom: { seen: false, slides: 0, town: 0 } },
  state(g) { if (!g.s.playroom) g.s.playroom = { seen: false, slides: 0, town: 0 }; return g.s.playroom; },

  // ---------- helpers ----------
  ready(g) {
    if (g.driving || g.onTrain || g.ride || g.travel || g.fishing) return false;
    if (typeof CityExt !== 'undefined' && (CityExt.floor || (CityExt.st && (CityExt.st.cab || CityExt.st.boarding)))) return false;
    return true;
  },
  // in the bedroom with nothing going on there (no nap, no slide, no catalog, no drawing pad, not on the bean bag)
  bedroomOk(g) {
    if (g.area !== 'upstairs' || typeof UpstairsExt === 'undefined' || !UpstairsExt.st) return false;
    const st = UpstairsExt.st;
    return !(st.nap || st.slide || st.cat.on || st.draw.on || st.sit);
  },
  near(g, pt, d) { return U.dist(g.player.x, g.player.y, pt.x, pt.y) < d; },
  // on the bedroom mat (and nearer to it than to the catalog on the bedside table just south-west of it)
  atMat(g) {
    const p = g.player, M = CFG.PLAYROOM.MAT_OUT, d = U.dist(p.x, p.y, M.x, M.y), K = CFG.UPSTAIRS.catalog;
    return d < CFG.PLAYROOM.reach && d <= U.dist(p.x, p.y, K.x, K.y);
  },
  rect(a) { return { x: a[0], y: a[1], w: a[2], h: a[3] }; },
  roomBlocks() {
    const C = CFG.PLAYROOM, R = C.ROOM, W = C.WORLD, w = C.WALL, T = C.TOWER, S = C.SPIRAL, P = C.PIT, M = C.TRAMP, K = C.CASTLE, o = [];
    o.push({ x: W.x0, y: W.y0, w: W.x1 - W.x0, h: R.y0 - W.y0 });                                    // the back wall
    o.push({ x: R.x0 - w, y: R.y1, w: R.x1 - R.x0 + 2 * w, h: w });
    o.push({ x: R.x0 - w, y: R.y0, w, h: R.y1 - R.y0 }, { x: R.x1, y: R.y0, w, h: R.y1 - R.y0 });
    o.push({ x: T.x0 - 18, y: R.y0, w: S.x + S.rx + 6 - (T.x0 - 18), h: T.y0 - R.y0 });              // behind the slide, against the wall
    o.push({ x: T.x0, y: T.y0, w: T.x1 - T.x0, h: T.y1 - T.y0 });                                     // the tower
    o.push({ x: S.x - S.rx - 4, y: S.y - S.ry - 4, w: 2 * S.rx + 8, h: 2 * S.ry + 8 });              // the spiral
    o.push({ x: S.x - 4, y: S.y + S.ry, w: 64, h: P.y0 - (S.y + S.ry) });                             // the low run into the pit
    o.push({ x: P.x0, y: P.y0, w: P.x1 - P.x0, h: P.y1 - P.y0 });                                     // the ball pit
    o.push({ x: M.x - M.rx, y: M.y - M.ry, w: 2 * M.rx, h: 2 * M.ry });                               // the trampoline
    o.push({ x: K.x0, y: K.y0, w: K.x1 - K.x0, h: K.y1 - K.y0 });                                     // the castle
    if (!(this.st && this.st.ride && this.st.ride.kind === 'train')) o.push(this.rect(C.TRAIN.block)); // the parked train
    o.push(this.rect(C.BLOCKS.block));                                                                // the block tower
    return o;
  },
  roomFree(x, y) {
    const R = CFG.PLAYROOM.ROOM, r = 12;
    if (x < R.x0 + r || x > R.x1 - r || y < R.y0 + r || y > R.y1 - r) return false;
    return !this.roomBlocks().some((o) => x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h);
  },
  // a save (or a push) that left the chef in a wall or a toy goes back onto the door mat (not mid-ride: rides pin the chef)
  rescue(g) {
    const p = g.player;
    if ((this.st && this.st.ride) || this.roomFree(p.x, p.y)) return false;
    p.x = CFG.PLAYROOM.EXIT.x; p.y = CFG.PLAYROOM.EXIT.y; p.moving = false;
    g.floats.push({ x: p.x, y: p.y - 50, text: 'Oops! Back inside', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    return true;
  },
  // the big slide's path in screen terms: [x, y] points (ground y minus height) and their running lengths
  slidePath() {
    if (this._path) return this._path;
    const C = CFG.PLAYROOM, T = C.TOWER, S = C.SPIRAL, g3 = [];
    g3.push([T.x1, (T.y0 + T.y1) / 2, T.h]);
    for (let i = 0; i <= S.n; i++) {
      const k = i / S.n, a = Math.PI - k * S.turns * Math.PI * 2;
      g3.push([S.x + S.rx * Math.cos(a), S.y + S.ry * Math.sin(a), S.h0 + (S.h1 - S.h0) * k]);
    }
    for (const q of C.RUN) g3.push(q);
    this._path = this.measure(g3);
    return this._path;
  },
  townPath() { if (!this._town) this._town = this.measure(CFG.PLAYROOM.TOWN.path); return this._town; },
  measure(g3) {
    const vis = g3.map(([x, y, h]) => [x, y - h]), len = [0];
    for (let i = 1; i < vis.length; i++) len.push(len[i - 1] + Math.hypot(vis[i][0] - vis[i - 1][0], vis[i][1] - vis[i - 1][1]));
    return { g3, vis, len, total: len[len.length - 1] };
  },
  // the point (and travel direction) a distance s along a measured path
  along(path, s) {
    const { vis, len } = path;
    s = U.clamp(s, 0, path.total);
    let i = 1; while (i < len.length - 1 && len[i] < s) i++;
    const k = (s - len[i - 1]) / Math.max(1e-6, len[i] - len[i - 1]);
    return { x: U.lerp(vis[i - 1][0], vis[i][0], k), y: U.lerp(vis[i - 1][1], vis[i][1], k), dx: vis[i][0] - vis[i - 1][0] };
  },
  cabPos(a) { const q = this.trainPos(a), f = q.dx < 0 ? -1 : 1; return { x: q.x - f * 12, y: q.y - 5, f }; },   // where the chef sits: the engine's cab
  trainPos(a) { const T = CFG.PLAYROOM.TRAIN; return { x: T.x + T.rx * Math.cos(a), y: T.y + T.ry * Math.sin(a), dx: -Math.sin(a) }; },
  blockHome(i) {
    const B = CFG.PLAYROOM.BLOCKS, s = B.size, rows = [[-1, 0], [0, 0], [1, 0], [-0.5, 1], [0.5, 1], [0, 2]], [cx, row] = rows[i];
    return { x: B.x + cx * (s + 2), y: B.y, h: row * s };
  },

  // ---------- game hooks ----------
  build(g) {
    this.state(g);
    this.st = { ride: null, fade: 0, balls: [], slid: false, trainA: CFG.PLAYROOM.TRAIN.a0,
      blocks: { down: false, t: 1, pieces: [0, 1, 2, 3, 4, 5].map((i) => { const h = this.blockHome(i); return { x: h.x, y: h.y, h: h.h, rot: 0, fx: h.x, fy: h.y, fh: h.h, frot: 0, tx: h.x, ty: h.y, th: h.h, trot: 0 }; }) } };
  },
  home(g) {
    if (!this.st) return;
    this.st.ride = null; this.st.fade = 0; this.st.balls.length = 0; this.st.slid = false; this.st.trainA = CFG.PLAYROOM.TRAIN.a0;
  },
  bgKey() { return 'pl'; },   // constant: the door and the town chute never change, they only have to be painted once
  obstacles(g) { return g.area === 'playroom' ? this.roomBlocks() : []; },
  enter(g) {
    const C = CFG.PLAYROOM, p = g.player, s = this.state(g);
    if (!this.st) this.build(g);
    g.area = 'playroom'; p.x = C.EXIT.x; p.y = C.EXIT.y; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.st.ride = null; this.st.fade = C.fade; this.st.slid = false;
    Sfx.ding(); Haptics.tap();
    if (!s.seen) { s.seen = true; g.toast('🛝 A playroom with a giant slide!', true); }
  },
  leave(g) {
    const C = CFG.PLAYROOM, p = g.player;
    this.st.ride = null; this.st.balls.length = 0;
    g.area = 'upstairs'; p.x = C.MAT_OUT.x; p.y = C.MAT_OUT.y; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.st.fade = C.fade; Sfx.drop();
  },
  action(g) {
    if (!this.ready(g)) return null;
    if (this.bedroomOk(g) && this.atMat(g)) return { label: '🚪 Go to the playroom', run: (gg) => this.enter(gg) };
    if (g.area !== 'playroom' || !this.st) return null;
    const st = this.st, C = CFG.PLAYROOM, r = st.ride;
    if (r) return r.kind === 'castle' && r.phase === 'in' ? { label: '🚶 Crawl out', run: (gg) => this.crawlOut(gg) } : null;
    if (this.near(g, C.EXIT, C.reach)) return { label: '🚪 Back to the bedroom', run: (gg) => this.leave(gg) };
    if (this.near(g, C.LADDER, C.near)) return { label: '🪜 Climb up', run: (gg) => this.start(gg, 'slide') };
    if (this.near(g, C.PIT.spot, C.near)) return { label: '🏊 Jump in the ball pit', run: (gg) => this.start(gg, 'pit') };
    if (this.near(g, C.TRAMP.spot, C.near)) return { label: '🤸 Bounce!', run: (gg) => this.start(gg, 'tramp') };
    if (this.near(g, C.CASTLE.spot, C.near)) return { label: '🏰 Crawl into the castle', run: (gg) => this.start(gg, 'castle') };
    if (this.near(g, C.TRAIN.spot, C.near + 6)) return { label: '🚂 Ride the toy train', run: (gg) => this.start(gg, 'train') };
    if (this.near(g, C.BLOCKS.spot, C.near)) {
      const b = st.blocks;
      if (b.t < 1) return null;   // still tumbling or stacking
      return b.down ? { label: '🧱 Stack the blocks', run: (gg) => this.toggleBlocks(gg) } : { label: '💥 Knock down the blocks', run: (gg) => this.toggleBlocks(gg) };
    }
    if (this.near(g, C.WINDOW.spot, C.near)) return { label: '🛝 Slide down to town!', run: (gg) => this.start(gg, 'town') };
    return null;
  },
  hint(g) {
    if (!this.ready(g)) return undefined;
    const st = this.st, C = CFG.PLAYROOM;
    if (st && st.ride && st.ride.kind === 'town') return { text: 'Wheee! 🛝', target: null };   // sliding down to town (in either map)
    if (g.area === 'playroom') {
      if (!st) return null;
      const r = st.ride;
      if (r) {
        if (r.kind === 'castle' && r.phase === 'in') return { text: 'Peekaboo! 👀', target: null };
        return null;   // the rides explain themselves
      }
      if (this.near(g, C.EXIT, C.reach)) return { text: 'Back to the bedroom 🛏️', target: null };
      if (this.near(g, C.LADDER, C.near)) return { text: 'Climb up the big slide! 🪜', target: null };
      if (this.near(g, C.PIT.spot, C.near)) return { text: 'Jump in the balls! 🏊', target: null };
      if (this.near(g, C.TRAMP.spot, C.near)) return { text: 'Bounce up high! 🤸', target: null };
      if (this.near(g, C.CASTLE.spot, C.near)) return { text: 'Crawl into the castle! 🏰', target: null };
      if (this.near(g, C.TRAIN.spot, C.near + 6)) return { text: 'All aboard! 🚂', target: null };
      if (this.near(g, C.BLOCKS.spot, C.near)) return { text: st.blocks.down ? 'Build the tower again! 🧱' : 'Knock them down! 💥', target: null };
      if (this.near(g, C.WINDOW.spot, C.near)) return { text: 'A slide down to town! 🛝', target: null };
      if (!st.slid) return { text: 'Climb the big slide! 🛝', target: C.LADDER };
      return null;
    }
    if (!this.bedroomOk(g)) return undefined;
    const p = g.player, M = C.MAT_OUT, d = U.dist(p.x, p.y, M.x, M.y);
    if (d >= C.hintReach) return undefined;
    // standing at the catalog (just south-west of the mat): the bedroom's own hint and button win
    const K = CFG.UPSTAIRS.catalog, dk = U.dist(p.x, p.y, K.x, K.y);
    if (dk < K.reach && dk < d) return undefined;
    return { text: 'A playroom! 🛝', target: this.atMat(g) ? null : M };
  },
  // start a ride / a toy (kind: slide | pit | tramp | castle | train | town)
  start(g, kind) {
    const p = g.player;
    this.st.ride = { kind, phase: 'go', t: 0, from: { x: p.x, y: p.y } };
    p.moving = false; Haptics.tap();
    if (kind === 'train') { Sfx.whistle(); g.floats.push({ x: p.x, y: p.y - 70, text: 'Choo choo! 🚂', color: '#ffe08a', t: 0, dur: 1.6, big: true }); }
    if (kind === 'town') Sfx.whistle();
  },
  crawlOut(g) { const r = this.st.ride; if (r && r.kind === 'castle') { r.phase = 'out'; r.t = 0; Haptics.tap(); } },
  toggleBlocks(g) {
    const b = this.st.blocks, B = CFG.PLAYROOM.BLOCKS;
    b.down = !b.down; b.t = 0;
    b.pieces.forEach((q, i) => {
      q.fx = q.x; q.fy = q.y; q.fh = q.h; q.frot = q.rot;
      if (b.down) { const a = -Math.PI * 0.9 + (i / 5) * Math.PI * 0.8 + U.rand(-0.15, 0.15), d = U.rand(46, 92); q.tx = U.clamp(B.x + Math.cos(a) * d, B.x - 90, CFG.PLAYROOM.ROOM.x1 - 18); q.ty = B.y + U.rand(34, 70); q.th = 0; q.trot = U.rand(-1.2, 1.2); }
      else { const h = this.blockHome(i); q.tx = h.x; q.ty = h.y; q.th = h.h; q.trot = 0; }
    });
    if (b.down) { Sfx.drop(); g.floats.push({ x: B.x, y: B.y - 80, text: 'Crash! 💥', color: '#ffe08a', t: 0, dur: 1.2, big: true }); }
    else { Sfx.pickup(); g.floats.push({ x: B.x, y: B.y - 100, text: 'Tall tower! 🧱', color: '#ffe08a', t: 0, dur: 1.2, big: true }); }
    Haptics.tap();
  },
  splash(x, y, n) {
    for (let i = 0; i < n; i++) this.st.balls.push({ x, y, h: 10, vx: U.rand(-110, 110), vy: U.rand(-30, 30), vh: U.rand(160, 300), col: PLAYROOM_BALLS[i % PLAYROOM_BALLS.length], t: 0 });
  },
  update(g, dt) {
    if (!this.st) this.build(g);
    const st = this.st, C = CFG.PLAYROOM;
    st.fade = Math.max(0, st.fade - dt);
    this.updateBlocks(dt);
    // flying balls: up, over and back down into the pit
    for (let i = st.balls.length - 1; i >= 0; i--) {
      const b = st.balls[i]; b.t += dt; b.x += b.vx * dt; b.y += b.vy * dt; b.h += b.vh * dt; b.vh -= 620 * dt;
      if (b.h <= 0 || b.t > 2) st.balls.splice(i, 1);
    }
    const r = st.ride;
    if (r && r.kind === 'town') { this.updateTown(g, dt); return; }
    if (g.area !== 'playroom') { if (r) st.ride = null; return; }
    if (r) { this.updateRide(g, dt); return; }
    this.rescue(g);
  },
  updateBlocks(dt) {
    const b = this.st.blocks;
    if (b.t >= 1) return;
    b.t = Math.min(1, b.t + dt / (b.down ? 0.7 : 0.9));
    b.pieces.forEach((q, i) => {
      // stacking: one after the other, bottom row first; knocking: all at once, the top ones flying furthest
      const k = b.down ? U.clamp(b.t * 1.15 - i * 0.02, 0, 1) : U.clamp((b.t - i * 0.1) / 0.5, 0, 1);
      q.x = U.lerp(q.fx, q.tx, k); q.y = U.lerp(q.fy, q.ty, k); q.rot = U.lerp(q.frot, q.trot, k);
      q.h = k >= 1 ? q.th : U.lerp(q.fh, q.th, k) + Math.sin(k * Math.PI) * (b.down ? 30 : 46);
    });
  },
  updateRide(g, dt) {
    const st = this.st, r = st.ride, p = g.player, C = CFG.PLAYROOM;
    r.t += dt; p.moving = false;
    const arc = (a, b, k, hgt) => { p.x = U.lerp(a.x, b.x, k); p.y = U.lerp(a.y, b.y, k) - Math.sin(k * Math.PI) * hgt; if (Math.abs(b.x - a.x) > 3) p.facing = b.x > a.x ? 1 : -1; };
    const end = (spot) => { st.ride = null; p.x = spot.x; p.y = spot.y; p.moving = false; };
    if (r.kind === 'slide') {
      const T = C.TOWER, L = C.LADDER, top = { x: L.x, y: T.y1 - T.h - 10 }, path = this.slidePath();
      if (r.phase === 'go') { const k = Math.min(1, r.t / 0.2); p.x = U.lerp(r.from.x, L.x, k); p.y = U.lerp(r.from.y, L.y, k); if (k >= 1) { r.phase = 'climb'; r.t = 0; } return; }
      if (r.phase === 'climb') {
        const k = Math.min(1, r.t / C.climb); p.x = L.x; p.y = U.lerp(L.y, top.y, k); p.moving = true; p.bob += dt * 12;
        if (k >= 1) { r.phase = 'walk'; r.t = 0; p.moving = false; }
        return;
      }
      if (r.phase === 'walk') {
        const s = path.vis[0], k = Math.min(1, r.t / C.walk); p.x = U.lerp(top.x, s[0], k); p.y = U.lerp(top.y, s[1], k); p.facing = 1; p.moving = true; p.bob += dt * 14;
        if (k >= 1) {
          r.phase = 'slide'; r.t = 0; p.moving = false; st.slid = true;
          Sfx.whistle(); g.floats.push({ x: p.x, y: p.y - 76, text: 'Wheee! 🛝', color: '#ffe08a', t: 0, dur: 1.6, big: true });
        }
        return;
      }
      if (r.phase === 'slide') {
        const k = Math.min(1, r.t / C.slide), q = this.along(path, path.total * Math.pow(k, 1.35));
        p.x = q.x; p.y = q.y; if (Math.abs(q.dx) > 0.5) p.facing = q.dx > 0 ? 1 : -1;
        if (k >= 1) {
          r.phase = 'sink'; r.t = 0; r.at = { x: p.x, y: p.y };
          const s = this.state(g); s.slides = (s.slides || 0) + 1;
          this.splash(p.x, p.y, 16); Sfx.drop(); Haptics.success();
          g.floats.push({ x: p.x, y: p.y - 70, text: 'Splash! 🎉', color: '#ffe08a', t: 0, dur: 1.4, big: true });
        }
        return;
      }
      if (r.phase === 'sink') { const k = Math.min(1, r.t / 0.25); p.x = U.lerp(r.at.x, C.PIT.land.x, k); p.y = U.lerp(r.at.y, C.PIT.land.y, k); if (r.t >= C.sink) { r.phase = 'out'; r.t = 0; } return; }
      if (r.phase === 'out') { const k = Math.min(1, r.t / C.hop); arc(C.PIT.land, C.PIT.spot, k, 34); if (k >= 1) end(C.PIT.spot); }
      return;
    }
    if (r.kind === 'pit') {
      const P = C.PIT;
      if (r.phase === 'go') { const k = Math.min(1, r.t / C.hop); arc(r.from, P.seat, k, 40); if (k >= 1) { r.phase = 'in'; r.t = 0; this.splash(P.seat.x, P.seat.y, 14); Sfx.drop(); Haptics.tap(); g.floats.push({ x: P.seat.x, y: P.seat.y - 70, text: 'Sploosh! 🎈', color: '#ffe08a', t: 0, dur: 1.4, big: true }); } return; }
      if (r.phase === 'in') { p.x = P.seat.x + Math.sin(r.t * 7) * 3; p.y = P.seat.y; if (r.t > 0.9 && !r.again) { r.again = true; this.splash(p.x, p.y, 8); } if (r.t >= 1.8) { r.phase = 'out'; r.t = 0; } return; }
      const k = Math.min(1, r.t / C.hop); arc(P.seat, P.spot, k, 34); if (k >= 1) end(P.spot);
      return;
    }
    if (r.kind === 'tramp') {
      const M = C.TRAMP, mid = { x: M.x, y: M.y + 4 };
      if (r.phase === 'go') { const k = Math.min(1, r.t / 0.35); arc(r.from, mid, k, 26); if (k >= 1) { r.phase = 'bounce'; r.t = 0; r.n = -1; } return; }
      if (r.phase === 'bounce') {
        const n = Math.floor(r.t / M.each), k = (r.t % M.each) / M.each;
        if (n >= M.bounces.length) { r.phase = 'off'; r.t = 0; p.x = mid.x; p.y = mid.y; return; }
        if (n !== r.n) { r.n = n; if (n === M.bounces.length - 1) Sfx.ding(); g.floats.push({ x: M.x + (n % 2 ? 30 : -30), y: M.y - 40 - M.bounces[n], text: n === M.bounces.length - 1 ? 'Boing! ⭐' : 'Boing!', color: '#ffe08a', t: 0, dur: 0.9, big: n === M.bounces.length - 1 }); }
        r.h = Math.sin(k * Math.PI) * M.bounces[n];
        p.x = mid.x; p.y = mid.y - r.h; p.facing = n % 2 ? -1 : 1;
        return;
      }
      r.h = 0; const k = Math.min(1, r.t / 0.4); arc(mid, M.spot, k, 30); if (k >= 1) end(M.spot);
      return;
    }
    if (r.kind === 'castle') {
      const K = C.CASTLE;
      if (r.phase === 'go') {
        const k = Math.min(1, r.t / K.crawl); p.x = U.lerp(r.from.x, K.inside.x, k); p.y = U.lerp(r.from.y, K.inside.y, k); p.moving = true; p.bob += dt * 10;
        if (k >= 1) { r.phase = 'in'; r.t = 0; p.moving = false; p.facing = 1; Sfx.pickup(); g.floats.push({ x: K.inside.x, y: K.y0 - 70, text: 'Peekaboo! 👀', color: '#ffe08a', t: 0, dur: 1.6, big: true }); }
        return;
      }
      if (r.phase === 'in') { p.x = K.inside.x; p.y = K.inside.y; p.facing = Math.sin(r.t * 1.6) > 0 ? 1 : -1; return; }
      const k = Math.min(1, r.t / K.crawl); p.x = U.lerp(K.inside.x, K.spot.x, k); p.y = U.lerp(K.inside.y, K.spot.y, k); p.moving = true; p.bob += dt * 10;
      if (k >= 1) end(K.spot);
      return;
    }
    if (r.kind === 'train') {
      const T = C.TRAIN, seat = this.cabPos(T.a0);
      if (r.phase === 'go') { const k = Math.min(1, r.t / 0.35); arc(r.from, seat, k, 24); if (k >= 1) { r.phase = 'ride'; r.t = 0; } return; }
      if (r.phase === 'ride') {
        const k = Math.min(1, r.t / T.lap), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        st.trainA = T.a0 + e * Math.PI * 2;
        const q = this.cabPos(st.trainA); p.x = q.x; p.y = q.y; p.facing = q.f;
        if (r.t > T.lap * 0.5 && !r.toot) { r.toot = true; g.floats.push({ x: p.x, y: p.y - 70, text: 'Choo choo! 🚂', color: '#ffe08a', t: 0, dur: 1.4, big: true }); }
        if (k >= 1) { st.trainA = T.a0; r.phase = 'off'; r.t = 0; Sfx.ding(); }
        return;
      }
      const k = Math.min(1, r.t / 0.35); arc(seat, T.spot, k, 24); if (k >= 1) end(T.spot);
      return;
    }
    if (r.kind === 'town') return;
    st.ride = null;
  },
  // out of the window and down the chute on the pizzeria's wall: first in the playroom (climbing out), then in town
  updateTown(g, dt) {
    const st = this.st, r = st.ride, p = g.player, C = CFG.PLAYROOM, W = C.WINDOW, path = this.townPath();
    r.t += dt; p.moving = false;
    if (r.phase === 'go') {
      if (g.area !== 'playroom') { st.ride = null; return; }
      const sill = { x: C.ROOM.x0 + 4, y: W.spot.y }, k = Math.min(1, r.t / W.out);
      p.x = U.lerp(r.from.x, sill.x, k); p.y = U.lerp(r.from.y, sill.y, k) - Math.sin(k * Math.PI) * 26; p.facing = -1;
      if (k >= 1) {
        // over the sill: now in town, at the top of the chute on the pizzeria's west wall
        const s = path.vis[0];
        g.area = 'town'; p.x = s[0]; p.y = s[1]; p.facing = -1; g.cameraSnap = true; st.fade = C.fade * 0.6;
        if (typeof UpstairsExt !== 'undefined' && UpstairsExt.st) UpstairsExt.st.roofA = 1;   // outside: the roof is on
        r.phase = 'slide'; r.t = 0;
        g.floats.push({ x: p.x - 20, y: p.y - 76, text: 'Wheee! 🛝', color: '#ffe08a', t: 0, dur: 1.6, big: true });
      }
      return;
    }
    if (g.area !== 'town') { st.ride = null; return; }
    if (r.phase === 'slide') {
      const k = Math.min(1, r.t / C.TOWN.dur), q = this.along(path, path.total * Math.pow(k, 1.3));
      p.x = q.x; p.y = q.y; p.facing = -1;
      if (k >= 1) {
        const L = C.TOWN.land; st.ride = null; p.x = L.x; p.y = L.y; p.moving = false; p.hasMoved = true;
        const s = this.state(g); s.town = (s.town || 0) + 1;
        Sfx.drop(); Haptics.success();
        g.floats.push({ x: L.x, y: L.y - 70, text: 'Hooray! 🎉', color: '#ffe08a', t: 0, dur: 1.6, big: true });
      }
    }
  },

  // ======================= render hooks =======================
  paint: { playroom(r, g) { PlayroomExt.paintRoom(r, g); } },
  // the door on the bedroom's north wall (and its mat), and the chute down the pizzeria's west wall in town
  paintAfter(r, g, area) {
    if (area === 'upstairs') this.paintBedroomDoor(r);
    else if (area === 'town') this.paintTownChute(r);
  },
  paintBedroomDoor(r) {
    const ctx = r.ctx, C = CFG.PLAYROOM, D = C.DOOR_OUT, M = C.MAT_OUT, w = D.x1 - D.x0, h = D.y1 - D.y0, cx = (D.x0 + D.x1) / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; U.roundRect(ctx, D.x0 - 3, D.y0 - 1, w + 8, h + 3, 5); ctx.fill();
    ctx.fillStyle = '#4aa3ff'; U.roundRect(ctx, D.x0 - 4, D.y0 - 4, w + 8, h + 4, 6); ctx.fill();          // the frame
    ctx.fillStyle = '#5ad26f'; U.roundRect(ctx, D.x0, D.y0, w, h, 4); ctx.fill();                          // the door
    ctx.fillStyle = '#7ee08f'; U.roundRect(ctx, D.x0 + 5, D.y0 + 26, w - 10, h - 30, 3); ctx.fill();       // lower panel
    ctx.fillStyle = '#fff8ee'; ctx.beginPath(); ctx.arc(cx, D.y0 + 13, 9, 0, Math.PI * 2); ctx.fill();    // round window with a slide in it
    ctx.fillStyle = '#9fe0ff'; ctx.beginPath(); ctx.arc(cx, D.y0 + 13, 7, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffb81c'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx - 4, D.y0 + 8); ctx.quadraticCurveTo(cx - 1, D.y0 + 18, cx + 5, D.y0 + 17); ctx.stroke();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(D.x1 - 7, D.y0 + h * 0.62, 2.4, 0, Math.PI * 2); ctx.fill();   // knob
    // a rainbow over the door
    ctx.lineWidth = 3;
    ['#ff5c5c', '#ffd166', '#5ad26f', '#4aa3ff'].forEach((c, i) => { ctx.strokeStyle = c; ctx.beginPath(); ctx.arc(cx, D.y0 - 2, 24 - i * 3, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); });
    // the mat: a little rainbow rug
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(M.x + 2, M.y + 3, 22, 11, 0, 0, Math.PI * 2); ctx.fill();
    [['#4aa3ff', 1], ['#5ad26f', 0.76], ['#ffd166', 0.52], ['#ff5c5c', 0.28]].forEach(([c, k]) => { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(M.x, M.y, 22 * k, 11 * k, 0, 0, Math.PI * 2); ctx.fill(); });
  },
  // a chute: a soft shadow on the ground, posts down to it, then the red-edged yellow trough along the visual path
  paintChute(ctx, path, posts, wOuter) {
    const { g3, vis } = path;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,0.13)'; ctx.lineWidth = wOuter - 4;
    ctx.beginPath(); g3.forEach(([x, y], i) => (i ? ctx.lineTo(x + 4, y + 6) : ctx.moveTo(x + 4, y + 6))); ctx.stroke();
    for (const i of posts) { const [x, y, h] = g3[i]; if (h < 6) continue; ctx.fillStyle = '#3b7dd8'; ctx.fillRect(x - 3, y - h, 6, h); ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(x, y, 7, 3, 0, 0, Math.PI * 2); ctx.fill(); }
    const seg = (w, c) => { ctx.strokeStyle = c; ctx.lineWidth = w; };
    for (let i = 1; i < vis.length; i++) {
      const a = vis[i - 1], b = vis[i];
      for (const [w, c] of [[wOuter, '#e8402a'], [wOuter - 8, '#ffb81c']]) { seg(w, c); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
    }
    seg(3, 'rgba(255,240,180,0.9)'); ctx.beginPath(); vis.forEach(([x, y], i) => (i ? ctx.lineTo(x, y - wOuter * 0.18) : ctx.moveTo(x, y - wOuter * 0.18))); ctx.stroke();
  },
  paintTownChute(r) {
    const ctx = r.ctx, C = CFG.PLAYROOM, path = this.townPath(), L = C.TOWN.land;
    // the soft landing mat on the grass
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; U.roundRect(ctx, L.x - 30, L.y - 12, 64, 30, 10); ctx.fill();
    ctx.fillStyle = '#4aa3ff'; U.roundRect(ctx, L.x - 32, L.y - 15, 64, 30, 10); ctx.fill();
    ctx.fillStyle = '#7cc0ff'; U.roundRect(ctx, L.x - 26, L.y - 11, 52, 9, 5); ctx.fill();
    this.paintChute(ctx, path, [1, 2, 3], 22);
    // a little slide sign by the mat
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(L.x + 38, L.y - 22, 3, 24);
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, L.x + 27, L.y - 38, 26, 18, 4); ctx.fill();
    ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🛝', L.x + 40, L.y - 29);
  },
  paintRoom(r, g) {
    const ctx = r.ctx, C = CFG.PLAYROOM, W = C.WORLD, R = C.ROOM, w = C.WALL;
    ctx.fillStyle = '#1f1611'; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    // soft foam floor tiles in four bright colours
    const tile = 60, cols = ['#ffd6e0', '#d6ecff', '#fff1b8', '#d8f5d0'];
    for (let y = R.y0, j = 0; y < R.y1; y += tile, j++) for (let x = R.x0, i = 0; x < R.x1; x += tile, i++) {
      ctx.fillStyle = cols[(i + j * 2) % 4]; ctx.fillRect(x, y, Math.min(tile, R.x1 - x), Math.min(tile, R.y1 - y));
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.05)'; ctx.lineWidth = 2;
    for (let x = R.x0; x <= R.x1; x += tile) { ctx.beginPath(); ctx.moveTo(x, R.y0); ctx.lineTo(x, R.y1); ctx.stroke(); }
    for (let y = R.y0; y <= R.y1; y += tile) { ctx.beginPath(); ctx.moveTo(R.x0, y); ctx.lineTo(R.x1, y); ctx.stroke(); }
    // the tall back wall: sky blue with clouds, bunting, two windows
    const by = C.BACK, sky = ctx.createLinearGradient(0, by, 0, R.y0); sky.addColorStop(0, '#8fd3ff'); sky.addColorStop(1, '#c9ecff');
    ctx.fillStyle = sky; ctx.fillRect(R.x0 - w, by, R.x1 - R.x0 + 2 * w, R.y0 - by);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (const [x, y, s] of [[31640, 4070, 1], [31860, 4100, 0.8], [32330, 4066, 1.1], [32560, 4096, 0.9]]) { ctx.beginPath(); ctx.arc(x, y, 12 * s, 0, Math.PI * 2); ctx.arc(x + 14 * s, y - 6 * s, 15 * s, 0, Math.PI * 2); ctx.arc(x + 30 * s, y, 11 * s, 0, Math.PI * 2); ctx.fill(); }
    for (const x0 of [31720, 32420]) {   // windows
      ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, x0 - 5, by + 18, 110, 66, 6); ctx.fill();
      const s2 = ctx.createLinearGradient(0, by + 22, 0, by + 80); s2.addColorStop(0, '#5ab8f0'); s2.addColorStop(1, '#e2f6ff');
      ctx.fillStyle = s2; ctx.fillRect(x0, by + 23, 100, 56);
      ctx.fillStyle = '#7cc45f'; ctx.fillRect(x0, by + 64, 100, 15);
      ctx.fillStyle = '#fff7c2'; ctx.beginPath(); ctx.arc(x0 + 78, by + 38, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f5f0dc'; ctx.fillRect(x0 + 48, by + 23, 4, 56); ctx.fillRect(x0, by + 49, 100, 4);
    }
    // bunting along the top of the wall
    ctx.strokeStyle = '#5b3a1a'; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let x = R.x0; x <= R.x1; x += 8) { const y = by + 10 + Math.sin(((x - R.x0) / 180) * Math.PI) * 8; x === R.x0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.stroke();
    for (let x = R.x0 + 14, i = 0; x < R.x1; x += 30, i++) { const y = by + 10 + Math.sin(((x - R.x0) / 180) * Math.PI) * 8; ctx.fillStyle = PLAYROOM_BALLS[i % PLAYROOM_BALLS.length]; ctx.beginPath(); ctx.moveTo(x - 9, y); ctx.lineTo(x + 9, y); ctx.lineTo(x, y + 16); ctx.closePath(); ctx.fill(); }
    // skirting and the shadow under the wall
    ctx.fillStyle = '#ff8fab'; ctx.fillRect(R.x0, R.y0 - 6, R.x1 - R.x0, 6);
    const sh = ctx.createLinearGradient(0, R.y0, 0, R.y0 + 18); sh.addColorStop(0, 'rgba(0,0,0,0.16)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sh; ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, 18);
    // side and front walls: candy pink with a white stripe
    const wall = (x, y, ww, hh) => { ctx.fillStyle = '#e86a92'; ctx.fillRect(x, y, ww, hh); };
    wall(R.x0 - w, R.y0, w, R.y1 - R.y0 + w); wall(R.x1, R.y0, w, R.y1 - R.y0 + w); wall(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, w);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(R.x0 - w + 10, R.y0, 4, R.y1 - R.y0 + 10); ctx.fillRect(R.x1 + 12, R.y0, 4, R.y1 - R.y0 + 10); ctx.fillRect(R.x0 - w, R.y1 + 11, R.x1 - R.x0 + 2 * w, 4);
    // the window in the west wall with the slide down to town
    this.paintTownWindow(r);
    // the door back to the bedroom, in the south wall, and its mat
    const D = C.DOOR_IN, E = C.EXIT, dw = D.x1 - D.x0, dh = D.y1 - D.y0;
    ctx.fillStyle = '#4aa3ff'; U.roundRect(ctx, D.x0 - 4, D.y0 - 2, dw + 8, dh + 4, 5); ctx.fill();
    ctx.fillStyle = '#5ad26f'; U.roundRect(ctx, D.x0, D.y0, dw, dh, 4); ctx.fill();
    ctx.fillStyle = '#7ee08f'; U.roundRect(ctx, D.x0 + 5, D.y0 + 5, dw - 10, dh - 10, 3); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(D.x1 - 8, D.y0 + dh / 2, 2.4, 0, Math.PI * 2); ctx.fill();
    ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🛏️', (D.x0 + D.x1) / 2 - 4, D.y0 + dh / 2 + 1);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(E.x + 2, E.y + 4, 26, 13, 0, 0, Math.PI * 2); ctx.fill();
    [['#4aa3ff', 1], ['#5ad26f', 0.76], ['#ffd166', 0.52], ['#ff5c5c', 0.28]].forEach(([c, k]) => { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(E.x, E.y, 26 * k, 13 * k, 0, 0, Math.PI * 2); ctx.fill(); });
    // a road-map rug in the middle
    this.paintRug(ctx);
    // the toy train's track
    this.paintTrack(ctx);
    // the ball pit (its balls; the chef's cover and the flying balls are drawn each frame)
    this.paintPit(ctx);
    // the big slide: the tower with its ladder, the spiral round its pole, and the run into the pit
    this.paintSlide(r);
    // a teddy and a big beach ball by the east wall, a toy box by the west wall
    this.paintTeddy(ctx, 32600, 4520);
    this.paintBeachBall(ctx, 32590, 4620, 18);
    this.paintBeachBall(ctx, 31640, 4780, 14);
  },
  paintTownWindow(r) {
    const ctx = r.ctx, C = CFG.PLAYROOM, R = C.ROOM, w = C.WALL, Wn = C.WINDOW, x0 = R.x0 - w;
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(x0 - 2, Wn.y0 - 4, w + 4, Wn.y1 - Wn.y0 + 8);
    const sky = ctx.createLinearGradient(x0, 0, R.x0, 0); sky.addColorStop(0, '#5ab8f0'); sky.addColorStop(1, '#d9f0ff');
    ctx.fillStyle = sky; ctx.fillRect(x0 + 2, Wn.y0, w - 4, Wn.y1 - Wn.y0);
    // the top of the chute just outside, curling away
    ctx.lineCap = 'round'; ctx.strokeStyle = '#e8402a'; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(R.x0 - 2, (Wn.y0 + Wn.y1) / 2); ctx.lineTo(x0 - 30, (Wn.y0 + Wn.y1) / 2 + 22); ctx.stroke();
    ctx.strokeStyle = '#ffb81c'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(R.x0 - 2, (Wn.y0 + Wn.y1) / 2); ctx.lineTo(x0 - 30, (Wn.y0 + Wn.y1) / 2 + 22); ctx.stroke();
    // a step under the window and the sign
    const S = Wn.spot;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; U.roundRect(ctx, R.x0 + 2, S.y - 14, 26, 32, 4); ctx.fill();
    ctx.fillStyle = '#ffd166'; U.roundRect(ctx, R.x0, S.y - 17, 24, 32, 4); ctx.fill();
    ctx.fillStyle = '#ffe9a8'; U.roundRect(ctx, R.x0 + 3, S.y - 14, 18, 7, 3); ctx.fill();
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, R.x0 + 4, Wn.y0 - 34, 70, 20, 5); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🛝 TO TOWN', R.x0 + 39, Wn.y0 - 24);
  },
  paintRug(ctx) {
    const x = 31980, y = 4560, rw = 150, rh = 96;
    ctx.fillStyle = 'rgba(0,0,0,0.08)'; U.roundRect(ctx, x - rw / 2 + 3, y - rh / 2 + 4, rw, rh, 14); ctx.fill();
    ctx.fillStyle = '#9ad86f'; U.roundRect(ctx, x - rw / 2, y - rh / 2, rw, rh, 14); ctx.fill();
    ctx.strokeStyle = '#6b6f78'; ctx.lineWidth = 14; ctx.lineJoin = 'round'; U.roundRect(ctx, x - rw / 2 + 22, y - rh / 2 + 20, rw - 44, rh - 40, 16); ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 6]); U.roundRect(ctx, x - rw / 2 + 22, y - rh / 2 + 20, rw - 44, rh - 40, 16); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, x - 22, y - 10, 18, 14, 3); ctx.fill(); ctx.fillStyle = '#4aa3ff'; U.roundRect(ctx, x + 8, y - 6, 16, 14, 3); ctx.fill();   // little houses
  },
  paintTrack(ctx) {
    const T = CFG.PLAYROOM.TRAIN;
    ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 22; ctx.beginPath(); ctx.ellipse(T.x + 2, T.y + 3, T.rx, T.ry, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#c8935a'; ctx.lineWidth = 3;   // wooden sleepers
    for (let i = 0; i < 64; i++) { const a = (i / 64) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), nx = c / T.rx, ny = s / T.ry, nl = Math.hypot(nx, ny); ctx.beginPath(); ctx.moveTo(T.x + T.rx * c - (nx / nl) * 10, T.y + T.ry * s - (ny / nl) * 10); ctx.lineTo(T.x + T.rx * c + (nx / nl) * 10, T.y + T.ry * s + (ny / nl) * 10); ctx.stroke(); }
    ctx.strokeStyle = '#8d5a2b'; ctx.lineWidth = 2.5;
    for (const d of [-6, 6]) { ctx.beginPath(); ctx.ellipse(T.x, T.y, T.rx + d, T.ry + d, 0, 0, Math.PI * 2); ctx.stroke(); }
  },
  paintPit(ctx) {
    const P = CFG.PLAYROOM.PIT, w = P.x1 - P.x0, h = P.y1 - P.y0;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; U.roundRect(ctx, P.x0 + 4, P.y0 + 6, w, h, 22); ctx.fill();
    ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, P.x0, P.y0, w, h, 22); ctx.fill();                  // padded rim
    ctx.fillStyle = '#5a9be8'; U.roundRect(ctx, P.x0 + 4, P.y0 + 3, w - 8, 10, 6); ctx.fill();
    ctx.fillStyle = '#8fd3ff'; U.roundRect(ctx, P.x0 + 12, P.y0 + 12, w - 24, h - 24, 14); ctx.fill();
    let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 150; i++) {
      const x = P.x0 + 20 + rnd() * (w - 40), y = P.y0 + 20 + rnd() * (h - 40);
      ctx.fillStyle = PLAYROOM_BALLS[i % PLAYROOM_BALLS.length]; ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.arc(x - 2.2, y - 2.2, 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#e8402a'; for (const [x, y] of [[P.x0 + 8, P.y0 + 8], [P.x1 - 8, P.y0 + 8], [P.x0 + 8, P.y1 - 8], [P.x1 - 8, P.y1 - 8]]) { ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill(); }
  },
  paintSlide(r) {
    const ctx = r.ctx, C = CFG.PLAYROOM, T = C.TOWER, S = C.SPIRAL, L = C.LADDER, H = T.h, path = this.slidePath();
    // the spiral's pole (behind the chute)
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(S.x + 3, S.y + 4, 16, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3b7dd8'; ctx.fillRect(S.x - 6, S.y - S.h0 - 20, 12, S.h0 + 20);
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(S.x, S.y - S.h0 - 22, 9, 0, Math.PI * 2); ctx.fill();
    // the tower: shadow, back posts, platform, front posts, rail, flag
    const top = T.y0 - H, topF = T.y1 - H;
    ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.fillRect(T.x0 + 6, T.y0 + 6, T.x1 - T.x0, T.y1 - T.y0);
    ctx.fillStyle = '#2f6fc8'; for (const x of [T.x0 + 3, T.x1 - 3]) ctx.fillRect(x - 4, top, 8, H + (T.y0 - T.y0));
    ctx.fillStyle = '#ff8fab'; ctx.fillRect(T.x0 + 6, top + 14, T.x1 - T.x0 - 12, T.y0 - top - 14 + (T.y1 - T.y0) - 6);   // the panel under the platform
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; for (let y = top + 24; y < T.y1 - 8; y += 16) ctx.fillRect(T.x0 + 6, y, T.x1 - T.x0 - 12, 3);
    ctx.fillStyle = '#ffd166'; ctx.fillRect(T.x0 - 2, top, T.x1 - T.x0 + 4, topF - top);   // the platform
    ctx.fillStyle = '#f2b134'; ctx.fillRect(T.x0 - 2, topF - 6, T.x1 - T.x0 + 4, 6);
    ctx.fillStyle = '#3b7dd8'; for (const x of [T.x0 + 3, T.x1 - 3]) { ctx.fillRect(x - 4, top - 30, 8, T.y1 - top + 30); }
    ctx.fillStyle = '#2f6fc8'; ctx.fillRect(T.x0, top - 30, 6, 30); ctx.fillRect(T.x1 - 6, top - 30, 6, 30);
    ctx.fillStyle = '#3b7dd8'; ctx.fillRect(T.x0 - 2, top - 32, T.x1 - T.x0 + 4, 5);              // back rail
    // the ladder up the front
    ctx.fillStyle = '#e8402a'; ctx.fillRect(L.x - 15, topF - 2, 5, T.y1 - topF + 4); ctx.fillRect(L.x + 10, topF - 2, 5, T.y1 - topF + 4);
    ctx.fillStyle = '#ffd166'; for (let y = topF + 10; y < T.y1; y += 14) ctx.fillRect(L.x - 12, y, 24, 4);
    // a flag on the back post
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(T.x0 + 1, top - 64, 3, 36);
    ctx.fillStyle = '#ff5c5c'; ctx.beginPath(); ctx.moveTo(T.x0 + 4, top - 64); ctx.lineTo(T.x0 + 30, top - 56); ctx.lineTo(T.x0 + 4, top - 48); ctx.closePath(); ctx.fill();
    // the chute, its posts every so often
    const posts = []; for (let i = 6; i < path.g3.length - 3; i += 8) posts.push(i);
    this.paintChute(ctx, path, posts, 28);
    // the sign
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, T.x0 - 72, T.y1 - 40, 62, 20, 5); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🛝 SLIDE', T.x0 - 41, T.y1 - 30);
  },
  paintTeddy(ctx, x, y) {
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x, y + 4, 16, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b07a48';
    for (const [dx, dy, rr] of [[0, -12, 13], [0, -32, 10], [-8, -40, 4.5], [8, -40, 4.5], [-12, -4, 5], [12, -4, 5], [-13, -18, 4.5], [13, -18, 4.5]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, rr, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#e2b98a'; ctx.beginPath(); ctx.arc(x, y - 12, 7, 0, Math.PI * 2); ctx.arc(x, y - 29, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x - 4, y - 34, 1.4, 0, Math.PI * 2); ctx.arc(x + 4, y - 34, 1.4, 0, Math.PI * 2); ctx.arc(x, y - 30, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(x, y - 22); ctx.lineTo(x - 6, y - 26); ctx.lineTo(x - 6, y - 18); ctx.closePath(); ctx.moveTo(x, y - 22); ctx.lineTo(x + 6, y - 26); ctx.lineTo(x + 6, y - 18); ctx.closePath(); ctx.fill();
  },
  paintBeachBall(ctx, x, y, rr) {
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x + 2, y + rr * 0.8, rr, rr * 0.35, 0, 0, Math.PI * 2); ctx.fill();
    const c = ['#ff5c5c', '#fff', '#4aa3ff', '#fff', '#ffd166', '#fff'];
    for (let i = 0; i < 6; i++) { ctx.fillStyle = c[i]; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, rr, (i / 6) * Math.PI * 2, ((i + 1) / 6) * Math.PI * 2); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.arc(x - rr * 0.35, y - rr * 0.35, rr * 0.25, 0, Math.PI * 2); ctx.fill();
  },

  // ---------- moving things ----------
  // under people: the trampoline (its mat dips under a landing) and the tumbling blocks' shadows
  dynamic(r, g) {
    if (g.area !== 'playroom' || !this.st) return;
    const ctx = r.ctx, M = CFG.PLAYROOM.TRAMP, rd = this.st.ride;
    const h = rd && rd.kind === 'tramp' && rd.phase === 'bounce' ? rd.h || 0 : 0, dip = rd && rd.kind === 'tramp' ? Math.max(0, 1 - h / 14) * 5 : 0;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(M.x + 4, M.y + 8, M.rx + 4, M.ry + 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5b3a1a'; for (const a of [0.5, 1.5, 2.6, 3.6, 4.7, 5.6]) ctx.fillRect(M.x + Math.cos(a) * (M.rx - 4) - 2, M.y + Math.sin(a) * (M.ry - 3), 4, 12);   // legs
    ctx.fillStyle = '#3b7dd8'; ctx.beginPath(); ctx.ellipse(M.x, M.y, M.rx, M.ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff5c5c'; for (let i = 0; i < 12; i++) { if (i % 2) continue; const a0 = (i / 12) * Math.PI * 2; ctx.beginPath(); ctx.ellipse(M.x, M.y, M.rx, M.ry, 0, a0, a0 + Math.PI / 6); ctx.ellipse(M.x, M.y, M.rx - 8, M.ry - 6, 0, a0 + Math.PI / 6, a0, true); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#2b2f3a'; ctx.beginPath(); ctx.ellipse(M.x, M.y + dip * 0.5, M.rx - 9, M.ry - 7 + dip * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(M.x, M.y + dip * 0.5, M.rx - 22, M.ry - 15, 0, 0, Math.PI * 2); ctx.stroke();
    if (h > 0) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(M.x, M.y + 4, Math.max(5, 14 - h * 0.08), 5, 0, 0, Math.PI * 2); ctx.fill(); }
    // the blocks' shadows on the floor
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; const s = CFG.PLAYROOM.BLOCKS.size;
    for (const q of this.st.blocks.pieces) { ctx.beginPath(); ctx.ellipse(q.x + 2, q.y + 3, s * 0.55, s * 0.22, 0, 0, Math.PI * 2); ctx.fill(); }
  },
  entities(r, g, items) {
    if (!this.st) return;
    const ctx = r.ctx, st = this.st, C = CFG.PLAYROOM, p = g.player, rd = st.ride;
    if (g.area === 'town') {
      if (rd && rd.kind === 'town' && rd.phase === 'slide') items.push({ y: p.y + 0.5, draw: () => this.drawTrough(ctx, p.x, p.y, 22) });
      return;
    }
    if (g.area !== 'playroom') return;
    // the castle (one picture, sorted at its front wall) and the dark room behind its window
    const K = C.CASTLE;
    if (rd && rd.kind === 'castle') items.push({ y: p.y - 1, draw: () => this.drawCastleBack(ctx) });
    items.push({ y: K.y1, draw: () => this.drawCastle(r, g) });
    // the train: its cars and engine at their places on the track
    const T = C.TRAIN;
    for (let i = 2; i >= 0; i--) { const q = this.trainPos(st.trainA - i * T.gap); items.push({ y: q.y + 1, draw: () => this.drawTrainCar(ctx, q, i, g) }); }
    // the soft blocks
    st.blocks.pieces.forEach((q, i) => items.push({ y: q.y + 0.2 + q.h * 0.001, draw: () => this.drawBlock(ctx, q, i) }));
    if (!rd) return;
    // the chef sitting in the chute: the trough's front edge over the legs
    if (rd.kind === 'slide' && rd.phase === 'slide') items.push({ y: p.y + 0.5, draw: () => this.drawTrough(ctx, p.x, p.y, 28) });
    // in the ball pit: balls up to the neck
    const inPit = (rd.kind === 'slide' && rd.phase === 'sink') || (rd.kind === 'pit' && rd.phase === 'in');
    if (inPit) items.push({ y: p.y + 0.5, draw: () => this.drawPitCover(ctx, p.x, p.y, g) });
  },
  drawTrough(ctx, x, y, w) {
    ctx.fillStyle = '#e8402a'; U.roundRect(ctx, x - w * 0.62, y - 12, w * 1.24, 16, 7); ctx.fill();
    ctx.fillStyle = '#ffb81c'; U.roundRect(ctx, x - w * 0.62 + 3, y - 10, w * 1.24 - 6, 6, 3); ctx.fill();
  },
  drawPitCover(ctx, x, y, g) {
    const t = g.time, balls = [[-22, -2], [-11, -4], [0, -3], [11, -4], [22, -2], [-17, -14], [-6, -15], [6, -16], [17, -14], [-12, -25], [0, -27], [12, -25], [-26, -16], [26, -16]];
    balls.forEach(([dx, dy], i) => {
      const wob = Math.sin(t * 6 + i) * 1.2;
      ctx.fillStyle = PLAYROOM_BALLS[(i * 3) % PLAYROOM_BALLS.length]; ctx.beginPath(); ctx.arc(x + dx, y + dy + wob, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(x + dx - 2.5, y + dy + wob - 2.5, 2.2, 0, Math.PI * 2); ctx.fill();
    });
  },
  drawCastleBack(ctx) {
    const K = CFG.PLAYROOM.CASTLE, cx = (K.x0 + K.x1) / 2, wy = K.y1 - 66;   // the dark inside, seen through the window
    ctx.fillStyle = '#3a2350'; U.roundRect(ctx, cx - 16, wy - 34, 32, 50, 14); ctx.fill();
  },
  drawCastle(r, g) {
    const ctx = r.ctx, K = CFG.PLAYROOM.CASTLE, cx = (K.x0 + K.x1) / 2, base = K.y1, t = g.time, inside = this.st.ride && this.st.ride.kind === 'castle';
    const wallTop = base - 84, wy = base - 66;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(cx + 4, base + 2, 78, 12, 0, 0, Math.PI * 2); ctx.fill();
    // the middle wall with a window hole (the chef's face shows through it from inside)
    ctx.fillStyle = '#f7b6d2';
    ctx.beginPath(); ctx.rect(K.x0 + 20, wallTop, K.x1 - K.x0 - 40, base - wallTop);
    ctx.moveTo(cx + 15, wy + 14); ctx.lineTo(cx + 15, wy - 20); ctx.arc(cx, wy - 20, 15, 0, Math.PI, true); ctx.lineTo(cx - 15, wy + 14); ctx.closePath();
    ctx.fill('evenodd');
    ctx.strokeStyle = '#d97aa6'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx + 15, wy + 14); ctx.lineTo(cx + 15, wy - 20); ctx.arc(cx, wy - 20, 15, 0, Math.PI, true); ctx.lineTo(cx - 15, wy + 14); ctx.closePath(); ctx.stroke();
    ctx.fillStyle = '#d97aa6'; for (let x = K.x0 + 22; x < K.x1 - 26; x += 16) ctx.fillRect(x, wallTop - 8, 10, 9);   // battlements
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let y = wallTop + 10; y < base; y += 14) ctx.fillRect(K.x0 + 22, y, K.x1 - K.x0 - 44, 2);
    // the door: a purple curtain in an arch
    ctx.fillStyle = '#8e5bd1'; ctx.beginPath(); ctx.moveTo(cx - 16, base); ctx.lineTo(cx - 16, base - 22); ctx.arc(cx, base - 22, 16, Math.PI, 0); ctx.lineTo(cx + 16, base); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#b07cff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, base - 36); ctx.lineTo(cx, base); ctx.stroke();
    // two towers with pointy roofs and flags
    for (const [tx, dir] of [[K.x0 + 16, -1], [K.x1 - 16, 1]]) {
      ctx.fillStyle = '#f39ac2'; ctx.fillRect(tx - 16, base - 100, 32, 100);
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(tx - 13, base - 100, 4, 100);
      ctx.fillStyle = '#3a2350'; U.roundRect(ctx, tx - 5, base - 76, 10, 16, 5); ctx.fill();
      ctx.fillStyle = '#8e5bd1'; ctx.beginPath(); ctx.moveTo(tx - 21, base - 100); ctx.lineTo(tx + 21, base - 100); ctx.lineTo(tx, base - 142); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#5b3a1a'; ctx.fillRect(tx - 1, base - 160, 2, 20);
      const wv = Math.sin(t * 4 + dir) * 3;
      ctx.fillStyle = dir < 0 ? '#ffd166' : '#5ad26f'; ctx.beginPath(); ctx.moveTo(tx + 1, base - 160); ctx.lineTo(tx + 18, base - 155 + wv); ctx.lineTo(tx + 1, base - 150); ctx.closePath(); ctx.fill();
    }
    if (!inside) { ctx.fillStyle = '#3a2350'; ctx.beginPath(); ctx.moveTo(cx + 15, wy + 14); ctx.lineTo(cx + 15, wy - 20); ctx.arc(cx, wy - 20, 15, 0, Math.PI, true); ctx.lineTo(cx - 15, wy + 14); ctx.closePath(); ctx.fill(); return; }
    // a little crown sparkle over the window while the chef peeks out
    ctx.font = r.font(14); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('👑', cx, wy - 46 + Math.sin(t * 3) * 2);
  },
  drawTrainCar(ctx, q, i, g) {
    const f = q.dx < 0 ? -1 : 1, x = q.x, y = q.y, riding = this.st.ride && this.st.ride.kind === 'train' && this.st.ride.phase === 'ride';
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(x, y + 3, 22, 6, 0, 0, Math.PI * 2); ctx.fill();
    const wheels = () => { ctx.fillStyle = '#2b2f3a'; const spin = riding ? g.time * 10 : 0; for (const dx of [-12, 12]) { ctx.beginPath(); ctx.arc(x + dx, y - 1, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + dx, y - 1); ctx.lineTo(x + dx + Math.cos(spin) * 4, y - 1 + Math.sin(spin) * 4); ctx.stroke(); } };
    if (i === 0) {   // the engine: a red boiler at the front, a cab at the back (where the chef sits), a funnel
      ctx.fillStyle = '#e8402a'; U.roundRect(ctx, x - 20, y - 20, 40, 16, 4); ctx.fill();
      ctx.fillStyle = '#ff6b4a'; U.roundRect(ctx, x + f * 2 - (f < 0 ? 18 : 0), y - 26, 18, 10, 5); ctx.fill();              // boiler top
      ctx.fillStyle = '#2b2f3a'; ctx.fillRect(x + f * 14 - 3, y - 36, 7, 12); ctx.fillStyle = '#4a4e55'; ctx.fillRect(x + f * 14 - 5, y - 38, 11, 4);   // funnel
      ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(x + f * 21, y - 13, 3.5, 0, Math.PI * 2); ctx.fill();                  // lamp
      ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, x - f * 14 - 8, y - 22, 16, 18, 3); ctx.fill();                                // cab front wall
      wheels();
      if (riding && Math.floor(g.time * 3) % 2 === 0) { ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(x + f * 12, y - 46, 5, 0, Math.PI * 2); ctx.arc(x + f * 6, y - 54, 4, 0, Math.PI * 2); ctx.fill(); }
      return;
    }
    ctx.fillStyle = i === 1 ? '#ffd166' : '#4aa3ff'; U.roundRect(ctx, x - 17, y - 18, 34, 14, 3); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x - 15, y - 16, 30, 3);
    // a load of toy blocks
    ctx.fillStyle = i === 1 ? '#5ad26f' : '#ff8fab'; ctx.fillRect(x - 12, y - 28, 11, 11); ctx.fillStyle = i === 1 ? '#b07cff' : '#ffa94d'; ctx.fillRect(x + 1, y - 26, 10, 9);
    ctx.strokeStyle = '#5b3a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + f * 17, y - 10); ctx.lineTo(x + f * 22, y - 10); ctx.stroke();   // coupling
    wheels();
  },
  drawBlock(ctx, q, i) {
    const s = CFG.PLAYROOM.BLOCKS.size, x = q.x, y = q.y - q.h - s / 2;
    ctx.save(); ctx.translate(x, y); ctx.rotate(q.rot);
    ctx.fillStyle = PLAYROOM_BLOCKS[i % PLAYROOM_BLOCKS.length]; U.roundRect(ctx, -s / 2, -s / 2, s, s, 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; U.roundRect(ctx, -s / 2 + 3, -s / 2 + 3, s - 6, 6, 3); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; U.roundRect(ctx, -s / 2, s / 2 - 5, s, 5, 3); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('ABCDEF'[i], 0, 1);
    ctx.restore();
  },
  // over everything: the balls flying out of the pit; in town, the little window the chute comes out of (over the roof's
  // edge) and the chef on the top of the chute, in front of the roof
  overlay(r, g) {
    if (g.area === 'town') { this.overlayTown(r, g); return; }
    if (g.area !== 'playroom' || !this.st || !this.st.balls.length) return;
    const ctx = r.ctx;
    for (const b of this.st.balls) {
      ctx.fillStyle = b.col; ctx.beginPath(); ctx.arc(b.x, b.y - b.h, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(b.x - 2.2, b.y - b.h - 2.2, 2, 0, Math.PI * 2); ctx.fill();
    }
  },
  overlayTown(r, g) {
    const ctx = r.ctx, s = this.townPath().vis[0], x = s[0], y = s[1];
    if (r.camX > x + 60 || r.camX + r.viewW < x - 60 || r.camY > y + 60 || r.camY + r.viewH < y - 60) return;
    ctx.fillStyle = '#4aa3ff'; U.roundRect(ctx, x - 8, y - 22, 26, 34, 6); ctx.fill();                   // the window's frame
    ctx.fillStyle = '#ffe9b0'; U.roundRect(ctx, x - 4, y - 18, 18, 26, 4); ctx.fill();                   // warm playroom light
    ctx.fillStyle = '#ff8fab'; ctx.fillRect(x - 4, y - 18, 18, 5);
    ctx.lineCap = 'round';
    for (const [w, c] of [[22, '#e8402a'], [14, '#ffb81c']]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x + 4, y - 2); ctx.lineTo(x, y); ctx.stroke(); }
    const rd = this.st && this.st.ride, p = g.player;
    if (rd && rd.kind === 'town' && rd.phase === 'slide' && p.x > x - 34) { r.drawPlayer(g); this.drawTrough(ctx, p.x, p.y, 22); }
  },
  // screen space: the fade through a door (or out of the window)
  screen(r, g) {
    if (!this.st || this.st.fade <= 0) return;
    const ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    ctx.fillStyle = `rgba(20,12,6,${(this.st.fade / CFG.PLAYROOM.fade).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
  },
};

Game.ext.unshift(PlayroomExt);   // first in line so the door's button and hint beat the bedroom's own
Render.ext.push(PlayroomExt);
