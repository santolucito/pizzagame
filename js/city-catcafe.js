'use strict';
// The Cat Café: City building 8 (middle row, facing Market Street, the teal one with the cat on its window ledge)
// gets a '🐱 CAT CAFÉ' sign and paw prints by the door. Inside: a warm wooden room with a big sunny window and five
// cats doing cat things: a ginger one asleep in the sunbeam, a black one chasing the red laser dot you steer by walking,
// a tabby in a cardboard box, a grey one up the cat tree and a white one begging at the counter. Pat a cat for purring
// hearts, pick up the feather wand and every cat follows you, buy a cat-shaped cookie ($4, carried half a minute) or a
// cocoa ($5) from the cat-eared barista, and sit on the window seat: a cat hops onto your lap ("Purrr 😻").
// Extension module: registered with Game.ext (first, so its door beats the City's taxis) and Render.ext (see js/EXTENSIONS.md).
CFG.CATCAFE = {
  BUILDING: 8,                                   // index in CFG.CITY.BUILDINGS: { x0: 4610, y0: 170, x1: 4760, y1: 456 }
  DOOR_OUT: { x: 4685, y: 470 },                 // on the sidewalk just below the door
  WORLD: { x0: 5900, y0: 3000, x1: 6500, y1: 3400 },
  ROOM: { x0: 5940, y0: 3100, x1: 6460, y1: 3340 }, WALL: 24, BACK_TOP: 3016,   // the back wall is tall: the window and shelves hang on it
  WINDOW: { x0: 5972, y0: 3030, x1: 6152, y1: 3094 },
  BENCH: { x0: 5980, y0: 3104, x1: 6064, y1: 3130 }, SEAT: { x: 6022, y: 3124 },   // the window seat under the window
  SUNBEAM: { x: 6112, y: 3182, rx: 50, ry: 22 },
  COUNTER: { x0: 6250, y0: 3128, x1: 6440, y1: 3162 }, BARISTA_HOME: { x: 6345, y: 3120 },
  SHELF: { x0: 6262, y0: 3036, x1: 6430, y1: 3090 },
  PADS: { cookie: { x: 6290, y: 3212 }, cocoa: { x: 6400, y: 3212 } },
  TREE: { x: 5988, y: 3262, top: 3166, mid: 3214 },   // the cat tree against the left wall: base, top platform, middle platform
  BOX: { x: 6300, y: 3292 },                     // the cardboard box
  WAND: { x: 5968, y: 3300 },                    // the jar of toys by the left wall where the feather wand lives
  RUG: { x: 6150, y: 3252, rx: 82, ry: 38 },
  PLANT: { x: 6436, y: 3312 },
  EXIT: { x: 6200, y: 3322 },                    // the mat inside the door (the door is in the bottom wall)
  CATS: [
    { id: 'sun', col: '#e67e22', belly: '#ffd9a8', home: { x: 6112, y: 3180 }, pose: 'sleep' },
    { id: 'laser', col: '#3b3b45', belly: '#6b6b78', home: { x: 6150, y: 3272 }, pose: 'sit' },
    { id: 'box', col: '#b5773a', belly: '#e8c39a', home: { x: 6300, y: 3290 }, pose: 'box' },
    { id: 'tree', col: '#9aa0a8', belly: '#d6dbe2', home: { x: 5988, y: 3166 }, pose: 'tree' },
    { id: 'beg', col: '#fff8ee', belly: '#ffe9d6', home: { x: 6345, y: 3182 }, pose: 'beg' },
  ],
  FOLLOW: [{ x: -34, y: 10 }, { x: 34, y: 12 }, { x: -18, y: 36 }, { x: 22, y: 36 }, { x: 0, y: -34 }],   // where each cat walks when you hold the wand
  LASER_AHEAD: 70, CAT_SPEED: 120, COOKIE: 30, COCOA: 20, LAP_DELAY: 0.8,   // px ahead of the chef for the dot, cat walking speed, seconds the treats last, seconds before the lap cat comes
};
CFG.AREAS.catcafe = { WORLD: CFG.CATCAFE.WORLD };

const CatCafeExt = {
  name: 'catcafe',
  st: null,
  defaults: { catcafe: { seen: false, pats: 0, wands: 0, cookies: 0, cocoas: 0, laps: 0 } },

  // ---------- state ----------
  build(g) {
    const C = CFG.CATCAFE;
    if (!g.s.catcafe) g.s.catcafe = { seen: false, pats: 0, wands: 0, cookies: 0, cocoas: 0, laps: 0 };
    this.st = {
      fade: 0, seat: null, lap: false, wand: false,                     // seat: { t }
      cats: C.CATS.map((c) => ({ id: c.id, col: c.col, belly: c.belly, home: c.home, pose0: c.pose, pose: c.pose, x: c.home.x, y: c.home.y, facing: 1, moving: false, bob: 0, hop: 0, purr: 0, heartT: 0, caught: false })),
      dot: { x: C.CATS[1].home.x + 40, y: C.CATS[1].home.y - 10 }, dir: { x: 1, y: 0 }, prev: null,
      barista: { x: C.BARISTA_HOME.x, y: C.BARISTA_HOME.y, facing: -1, moving: false, bob: 0, say: 0 },
      cookie: 0, cocoa: 0, hearts: [], begT: 0, motes: [],
      obs: null,
    };
    for (let i = 0; i < 10; i++) this.st.motes.push({ k: i / 10, s: 0.6 + (i % 3) * 0.3 });
    const R = C.ROOM, w = C.WALL, o = [];
    o.push({ x: R.x0 - w, y: R.y0 - w, w: R.x1 - R.x0 + 2 * w, h: w }, { x: R.x0 - w, y: R.y1, w: R.x1 - R.x0 + 2 * w, h: w });
    o.push({ x: R.x0 - w, y: R.y0, w, h: R.y1 - R.y0 }, { x: R.x1, y: R.y0, w, h: R.y1 - R.y0 });
    o.push({ x: C.BENCH.x0, y: R.y0, w: C.BENCH.x1 - C.BENCH.x0, h: C.BENCH.y1 - R.y0 });
    o.push({ x: C.COUNTER.x0, y: R.y0, w: C.COUNTER.x1 - C.COUNTER.x0, h: C.COUNTER.y1 - R.y0 });
    o.push({ x: C.TREE.x - 24, y: C.TREE.y - 22, w: 48, h: 30 });
    o.push({ x: C.BOX.x - 22, y: C.BOX.y - 14, w: 44, h: 28 });
    o.push({ x: C.WAND.x - 16, y: C.WAND.y - 12, w: 26, h: 24 });
    o.push({ x: C.PLANT.x - 14, y: C.PLANT.y - 14, w: 28, h: 26 });
    this.st.obs = o;
  },
  obstacles(g) { return g.area === 'catcafe' && this.st ? this.st.obs : []; },
  free(x, y) {
    const R = CFG.CATCAFE.ROOM, r = 12;
    if (x < R.x0 + r || x > R.x1 - r || y < R.y0 + r || y > R.y1 - r) return false;
    for (const o of this.st.obs) if (x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h) return false;
    return true;
  },
  onFoot(g) { return !g.driving && !g.onTrain && !g.ride && !g.travel && !g.fishing; },
  inCityStreet(g) { return g.area === 'city' && this.onFoot(g) && !(typeof CityExt !== 'undefined' && (CityExt.floor || (CityExt.st && CityExt.st.cab))); },
  atDoor(g) { const D = CFG.CATCAFE.DOOR_OUT, p = g.player; return this.inCityStreet(g) && U.dist(p.x, p.y, D.x, D.y) < 30; },
  catSpot(c) { return c.pose === 'tree' ? { x: c.x, y: c.y + 14 } : { x: c.x, y: c.y }; },   // where you stand to reach a cat (the tree cat is up high)
  nearCat(g) {
    const p = g.player; let best = null, bd = 36;
    for (const c of this.st.cats) { if (c.pose === 'lap') continue; const s = this.catSpot(c), d = U.dist(p.x, p.y, s.x, s.y); if (d < bd) { bd = d; best = c; } }
    return best;
  },

  // ---------- game hooks ----------
  action(g) {
    if (!this.st) this.build(g);
    const p = g.player, C = CFG.CATCAFE, st = this.st;
    if (this.atDoor(g)) return { label: '🚪 Go inside', run: (gg) => this.enter(gg) };
    if (g.area !== 'catcafe') return null;
    if (st.seat) return { label: '🚶 Stand up', run: (gg) => this.standUp(gg) };
    if (U.dist(p.x, p.y, C.EXIT.x, C.EXIT.y) < 30) return { label: '🚪 Go outside', run: (gg) => this.leave(gg) };
    if (U.dist(p.x, p.y, C.WAND.x, C.WAND.y) < 34) return st.wand ? { label: '🪶 Put the wand back', run: (gg) => this.dropWand(gg) } : { label: '🪶 Take the wand', run: (gg) => this.takeWand(gg) };
    if (U.dist(p.x, p.y, C.SEAT.x, C.SEAT.y) < 40) return { label: '🪑 Sit by the window', run: (gg) => this.sitDown(gg) };
    const c = this.nearCat(g); if (c) return { label: '🐾 Pat the cat', run: (gg) => this.pat(gg, c) };
    return null;
  },
  enter(g) {
    const C = CFG.CATCAFE, p = g.player;
    g.area = 'catcafe'; p.x = C.EXIT.x; p.y = C.EXIT.y - 8; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.st.prev = null; this.st.dir = { x: 0, y: -1 }; this.st.dot.x = p.x; this.st.dot.y = p.y - C.LASER_AHEAD;
    this.st.fade = 0.45; Sfx.ding(); Haptics.tap();
    if (!g.s.catcafe.seen) { g.s.catcafe.seen = true; g.toast('🐱 Welcome to the Cat Café!', true); }
  },
  leave(g) {
    const C = CFG.CATCAFE, p = g.player;
    g.area = 'city'; p.x = C.DOOR_OUT.x; p.y = C.DOOR_OUT.y; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.st.seat = null; this.st.lap = false; this.st.wand = false; this.st.fade = 0.45; Sfx.drop();
  },
  sitDown(g) {
    const S = CFG.CATCAFE.SEAT, p = g.player;
    this.st.seat = { t: 0 }; this.st.lap = false;
    p.x = S.x; p.y = S.y; p.moving = false; p.facing = 1;
    Sfx.pickup(); Haptics.tap();
  },
  standUp(g) {
    const st = this.st, S = CFG.CATCAFE.SEAT; if (!st.seat) return;
    st.seat = null; st.lap = false; g.player.y = S.y + 28; g.player.moving = false; Sfx.drop();
  },
  takeWand(g) {
    const p = g.player; this.st.wand = true; g.s.catcafe.wands++;
    for (const c of this.st.cats) c.caught = false;
    g.floats.push({ x: p.x, y: p.y - 60, text: 'Here, kitties! 🪶', color: '#ffe08a', t: 0, dur: 1.5, big: true });
    Sfx.pickup(); Haptics.tap();
  },
  dropWand(g) { this.st.wand = false; Sfx.drop(); },
  pat(g, c) {
    const p = g.player; c.purr = 2.2; g.s.catcafe.pats++;
    g.floats.push({ x: c.x, y: c.y - 44, text: 'Purrr 💗', color: '#ff8fab', t: 0, dur: 1.5, big: true });
    p.facing = c.x < p.x ? -1 : 1;
    Sfx.chime(); Haptics.tap();
  },
  home(g) {
    if (!this.st) return;
    const st = this.st;
    st.seat = null; st.lap = false; st.wand = false; st.fade = 0; st.hearts = [];
    for (const c of st.cats) { c.x = c.home.x; c.y = c.home.y; c.pose = c.pose0; c.moving = false; c.purr = 0; c.hop = 0; c.caught = false; }
  },
  // a save or a push that left the chef in a wall or inside the furniture goes back onto the door mat
  rescue(g) {
    const p = g.player, C = CFG.CATCAFE;
    if (this.free(p.x, p.y)) return false;
    p.x = C.EXIT.x; p.y = C.EXIT.y - 8; p.moving = false;
    g.floats.push({ x: p.x, y: p.y - 50, text: 'Oops! Back inside', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    return true;
  },
  update(g, dt) {
    if (!this.st) this.build(g);
    const st = this.st, p = g.player, C = CFG.CATCAFE, R = C.ROOM;
    st.fade = Math.max(0, st.fade - dt);
    st.cookie = Math.max(0, st.cookie - dt); st.cocoa = Math.max(0, st.cocoa - dt);
    if (g.area !== 'catcafe') { if (st.seat) { st.seat = null; st.lap = false; } st.wand = false; st.prev = null; return; }
    // seated: stay on the window seat; otherwise keep out of the walls
    if (st.seat) { st.seat.t += dt; p.x = C.SEAT.x; p.y = C.SEAT.y; p.moving = false; p.facing = 1; }
    else this.rescue(g);
    // the laser dot runs ahead of the chef in whatever direction they last walked
    if (st.prev && !st.seat) { const dx = p.x - st.prev.x, dy = p.y - st.prev.y, d = Math.hypot(dx, dy); if (d > 0.5) { st.dir.x = dx / d; st.dir.y = dy / d; } }
    st.prev = { x: p.x, y: p.y };
    const tx = U.clamp(p.x + st.dir.x * C.LASER_AHEAD, R.x0 + 12, R.x1 - 12), ty = U.clamp(p.y + st.dir.y * C.LASER_AHEAD, R.y0 + 12, R.y1 - 12);
    U.moveToward(st.dot, tx, ty, 380, dt);
    // the cats
    st.cats.forEach((c, i) => {
      let goal = c.home, kind = 'home';
      if (st.wand) { goal = { x: U.clamp(p.x + C.FOLLOW[i].x, R.x0 + 10, R.x1 - 10), y: U.clamp(p.y + C.FOLLOW[i].y, R.y0 + 10, R.y1 - 10) }; kind = 'follow'; }
      else if (st.seat && c.id === 'tree' && st.seat.t > C.LAP_DELAY) { goal = { x: C.SEAT.x, y: C.SEAT.y + 2 }; kind = 'lap'; }
      else if (c.id === 'laser' && !st.seat) { goal = st.dot; kind = 'laser'; }
      const far = U.dist(c.x, c.y, goal.x, goal.y);
      if (kind === 'laser' && c.caught && far < 26) { c.moving = false; }   // got it: sits on the dot until it runs off again
      else {
        const arrived = U.moveToward(c, goal.x, goal.y, kind === 'follow' ? C.CAT_SPEED * 1.1 : C.CAT_SPEED, dt);
        if (kind === 'laser') { if (arrived && !c.caught) { c.caught = true; c.hop = 0.45; } else if (!arrived) c.caught = false; }
      }
      c.hop = Math.max(0, c.hop - dt); c.purr = Math.max(0, c.purr - dt);
      c.bob = c.moving ? c.bob + dt * 16 : 0;
      if (c.moving) c.pose = 'walk';
      else if (kind === 'home') c.pose = c.pose0;
      else if (kind === 'lap') {
        c.pose = 'lap';
        if (!st.lap) { st.lap = true; c.purr = 3; g.s.catcafe.laps++; g.floats.push({ x: p.x, y: p.y - 72, text: 'Purrr 😻', color: '#ff8fab', t: 0, dur: 1.8, big: true }); Sfx.chime(); Haptics.success(); }
      } else c.pose = 'sit';
      if (!c.moving && kind === 'follow') c.facing = p.x < c.x ? -1 : 1;
      // purring: little hearts rise from the cat
      if (c.purr > 0) { c.heartT -= dt; if (c.heartT <= 0) { c.heartT = 0.24; st.hearts.push({ x: c.x + U.rand(-12, 12), y: c.y - 26, t: 0, w: U.rand(0, 6.28) }); } }
    });
    for (const h of st.hearts) h.t += dt;
    st.hearts = st.hearts.filter((h) => h.t < 1.2);
    // the barista watches the chef and sometimes the begging cat asks for a fish
    const b = st.barista; b.facing = p.x < b.x ? -1 : 1; b.say = Math.max(0, b.say - dt);
    st.begT = (st.begT + dt) % 6;
  },
  pads(g) {
    if (g.area !== 'catcafe') return [];
    const P = CFG.CATCAFE.PADS;
    return [
      { key: 'catcafeCookie', label: 'Cat Cookie', ico: '🍪', pos: P.cookie, price: 4, sub: 'meow!' },
      { key: 'catcafeCocoa', label: 'Cocoa', ico: '☕', pos: P.cocoa, price: 5, sub: 'warm!' },
    ];
  },
  onPad(g, pad) {
    const p = g.player, C = CFG.CATCAFE;
    if (pad.key === 'catcafeCookie') { this.st.cookie = C.COOKIE; g.s.catcafe.cookies++; g.floats.push({ x: p.x, y: p.y - 60, text: 'A cat cookie! 🍪', color: '#ffe08a', t: 0, dur: 1.5, big: true }); }
    else if (pad.key === 'catcafeCocoa') { this.st.cocoa = C.COCOA; g.s.catcafe.cocoas++; g.floats.push({ x: p.x, y: p.y - 60, text: 'Warm cocoa! ☕', color: '#ffe08a', t: 0, dur: 1.5, big: true }); }
    else return;
    this.st.barista.say = 1.6; Haptics.success();
  },
  hint(g) {
    if (!this.st) return undefined;
    const p = g.player, C = CFG.CATCAFE, st = this.st, s = g.s.catcafe;
    if (g.area === 'city') {
      if (!this.inCityStreet(g)) return undefined;
      const d = U.dist(p.x, p.y, C.DOOR_OUT.x, C.DOOR_OUT.y);
      if (d < 110) return { text: 'Visit the Cat Café! 🐱', target: d < 30 ? null : C.DOOR_OUT };
      return undefined;
    }
    if (g.area !== 'catcafe') return undefined;
    if (st.seat) return st.lap ? { text: 'Purrr… a kitty on your lap 😻', target: null } : { text: 'Sit still, a kitty is coming 🐱', target: null };
    if (st.wand) return { text: 'The cats follow the feather! 🪶', target: null };
    if (!s.pats) return { text: 'Pat a cat! 🐾', target: C.CATS[0].home };
    if (!s.wands) return { text: 'Pick up the feather wand! 🪶', target: C.WAND };
    if (!s.cookies && g.s.cash + (g.s.padPaid.catcafeCookie || 0) >= 4) return { text: 'Buy a cat cookie! 🍪', target: C.PADS.cookie };
    if (!s.laps) return { text: 'Sit by the sunny window 🪟', target: C.SEAT };
    if (st.cookie > 0) return { text: 'Mmm, cat cookie! 🍪', target: null };
    return { text: 'Walk around: the kitty chases the red dot! 🔴', target: null };
  },

  // ---------- the City outside: the sign and paw prints (static) ----------
  bld() { return CFG.CITY.BUILDINGS[CFG.CATCAFE.BUILDING]; },
  paintAfter(r, g, area) {
    if (area !== 'city') return;
    const ctx = r.ctx, b = this.bld(), cx = (b.x0 + b.x1) / 2, gy = b.y1 - 40, sign = '🐱 CAT CAFÉ';
    ctx.font = r.font(10); const tw = ctx.measureText(sign).width + 18;
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, cx - tw / 2, gy - 22, tw, 18, 4); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(sign, cx, gy - 13);
    // paw prints wandering along the sidewalk to the door
    const D = CFG.CATCAFE.DOOR_OUT;
    for (const [dx, dy, f] of [[-52, 2, 1], [-38, -4, 1], [-24, 3, 1], [26, 3, -1], [40, -4, -1], [54, 2, -1]]) this.drawPaw(ctx, D.x + dx, D.y + dy, 'rgba(43,29,20,0.35)', 1, f);
  },
  drawPaw(ctx, x, y, col, s, f) {
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.ellipse(x, y + 1 * s, 3.2 * s, 2.6 * s, 0, 0, Math.PI * 2); ctx.fill();
    for (const [dx, dy] of [[-3.2, -3.2], [-1, -4.8], [1.4, -4.8], [3.4, -3.2]]) { ctx.beginPath(); ctx.arc(x + dx * s * (f || 1), y + dy * s, 1.3 * s, 0, Math.PI * 2); ctx.fill(); }
  },

  // ---------- the interior, static ----------
  paint: { catcafe(r, g) { CatCafeExt.paintRoom(r, g); } },
  paintRoom(r, g) {
    const ctx = r.ctx, C = CFG.CATCAFE, W = C.WORLD, R = C.ROOM, w = C.WALL;
    // outside the café: dark slate with a faint tile pattern
    ctx.fillStyle = '#3a4a5c'; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.04)'; for (let y = W.y0; y < W.y1; y += 40) for (let x = W.x0 + ((y / 40) % 2) * 20; x < W.x1; x += 40) ctx.fillRect(x, y, 38, 38);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(R.x0 - w + 8, C.BACK_TOP + 10, R.x1 - R.x0 + 2 * w, R.y1 + w - C.BACK_TOP);
    // warm wooden floorboards
    ctx.fillStyle = '#e6c38f'; ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0);
    for (let y = R.y0, j = 0; y < R.y1; y += 20, j++) {
      ctx.fillStyle = j % 2 ? '#dcb57f' : '#e6c38f'; ctx.fillRect(R.x0, y, R.x1 - R.x0, Math.min(20, R.y1 - y));
      ctx.fillStyle = 'rgba(120,80,40,0.18)'; ctx.fillRect(R.x0, y, R.x1 - R.x0, 1.5);
      for (let x = R.x0 + ((j % 3) * 60); x < R.x1; x += 180) ctx.fillRect(x, y, 1.5, 20);
    }
    // a round rug in the middle
    const Rg = C.RUG;
    ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.beginPath(); ctx.ellipse(Rg.x + 3, Rg.y + 4, Rg.rx, Rg.ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c45c7a'; ctx.beginPath(); ctx.ellipse(Rg.x, Rg.y, Rg.rx, Rg.ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8a0bf'; ctx.beginPath(); ctx.ellipse(Rg.x, Rg.y, Rg.rx - 12, Rg.ry - 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c45c7a'; ctx.beginPath(); ctx.ellipse(Rg.x, Rg.y, Rg.rx - 24, Rg.ry - 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff8ee'; ctx.beginPath(); ctx.ellipse(Rg.x, Rg.y, Rg.rx - 36, Rg.ry - 26, 0, 0, Math.PI * 2); ctx.fill();
    this.drawPaw(ctx, Rg.x, Rg.y + 2, '#c45c7a', 2.2, 1);
    // walls: a tall mint back wall with a picture rail, wooden side and bottom walls
    ctx.fillStyle = '#d5efe2'; ctx.fillRect(R.x0 - w, C.BACK_TOP, R.x1 - R.x0 + 2 * w, R.y0 - C.BACK_TOP);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let x = R.x0 - w + 8; x < R.x1 + w; x += 26) ctx.fillRect(x, C.BACK_TOP, 10, R.y0 - C.BACK_TOP);
    ctx.fillStyle = '#2f9e9e'; ctx.fillRect(R.x0 - w, C.BACK_TOP, R.x1 - R.x0 + 2 * w, 5);   // cornice
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(R.x0 - w, R.y0 - 6, R.x1 - R.x0 + 2 * w, 6);     // skirting along the back wall
    ctx.fillStyle = '#b5773a'; ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, w); ctx.fillRect(R.x0 - w, R.y0, w, R.y1 - R.y0); ctx.fillRect(R.x1, R.y0, w, R.y1 - R.y0);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = R.x0 - w; x < R.x1 + w; x += 16) ctx.fillRect(x, R.y1, 2, w); for (let y = R.y0; y < R.y1; y += 16) { ctx.fillRect(R.x0 - w, y, w, 2); ctx.fillRect(R.x1, y, w, 2); }
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, 3); ctx.fillRect(R.x0 - w, R.y0, 3, R.y1 - R.y0); ctx.fillRect(R.x1 + w - 3, R.y0, 3, R.y1 - R.y0);
    // the big sunny window: sky, a sun, a tree outside, white frame and bars
    const Wn = C.WINDOW;
    ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, Wn.x0 - 6, Wn.y0 - 6, Wn.x1 - Wn.x0 + 12, Wn.y1 - Wn.y0 + 12, 6); ctx.fill();
    const sky = ctx.createLinearGradient(0, Wn.y0, 0, Wn.y1); sky.addColorStop(0, '#7fc8f8'); sky.addColorStop(1, '#cdeeff');
    ctx.fillStyle = sky; ctx.fillRect(Wn.x0, Wn.y0, Wn.x1 - Wn.x0, Wn.y1 - Wn.y0);
    ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(Wn.x0 + 42, Wn.y0 + 22, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,224,138,0.45)'; ctx.beginPath(); ctx.arc(Wn.x0 + 42, Wn.y0 + 22, 22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; for (const [dx, dy] of [[100, 16], [130, 26]]) { ctx.beginPath(); ctx.arc(Wn.x0 + dx, Wn.y0 + dy, 7, 0, Math.PI * 2); ctx.arc(Wn.x0 + dx + 9, Wn.y0 + dy - 3, 8, 0, Math.PI * 2); ctx.arc(Wn.x0 + dx + 18, Wn.y0 + dy, 6, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(Wn.x1 - 40, Wn.y1 - 26, 6, 26); ctx.fillStyle = '#3f9a4a'; ctx.beginPath(); ctx.arc(Wn.x1 - 37, Wn.y1 - 32, 16, 0, Math.PI * 2); ctx.arc(Wn.x1 - 48, Wn.y1 - 24, 10, 0, Math.PI * 2); ctx.arc(Wn.x1 - 26, Wn.y1 - 24, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#56b862'; ctx.beginPath(); ctx.arc(Wn.x1 - 40, Wn.y1 - 38, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff8ee'; ctx.fillRect((Wn.x0 + Wn.x1) / 2 - 2, Wn.y0, 4, Wn.y1 - Wn.y0); ctx.fillRect(Wn.x0, (Wn.y0 + Wn.y1) / 2 - 2, Wn.x1 - Wn.x0, 4);
    ctx.fillStyle = '#2f9e9e'; ctx.fillRect(Wn.x0 - 10, Wn.y1 + 4, Wn.x1 - Wn.x0 + 20, 5);   // the sill
    // curtains either side
    for (const side of [-1, 1]) { const x = side < 0 ? Wn.x0 - 22 : Wn.x1 + 2; ctx.fillStyle = '#ff8fab'; U.roundRect(ctx, x, Wn.y0 - 10, 20, Wn.y1 - Wn.y0 + 16, 5); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.3)'; for (let k = 0; k < 3; k++) ctx.fillRect(x + 3 + k * 6, Wn.y0 - 6, 2, Wn.y1 - Wn.y0 + 8); ctx.fillStyle = '#e0b44c'; ctx.fillRect(x - 2, Wn.y0 + 30, 24, 4); }
    // the sunbeam from the window falling onto the floor
    const S = C.SUNBEAM;
    ctx.fillStyle = 'rgba(255,224,138,0.28)'; ctx.beginPath(); ctx.moveTo(Wn.x0 + 20, Wn.y1); ctx.lineTo(Wn.x1 - 20, Wn.y1); ctx.lineTo(S.x + S.rx, S.y); ctx.lineTo(S.x - S.rx, S.y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,236,170,0.55)'; ctx.beginPath(); ctx.ellipse(S.x, S.y, S.rx, S.ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,248,210,0.5)'; ctx.beginPath(); ctx.ellipse(S.x, S.y, S.rx - 14, S.ry - 7, 0, 0, Math.PI * 2); ctx.fill();
    // the window seat: a wooden bench with a teal cushion
    const Bn = C.BENCH;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(Bn.x0 + 3, Bn.y0 + 4, Bn.x1 - Bn.x0, Bn.y1 - Bn.y0);
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, Bn.x0, Bn.y0, Bn.x1 - Bn.x0, Bn.y1 - Bn.y0, 5); ctx.fill();
    ctx.fillStyle = '#2f9e9e'; U.roundRect(ctx, Bn.x0 + 3, Bn.y0 + 2, Bn.x1 - Bn.x0 - 6, Bn.y1 - Bn.y0 - 8, 5); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(Bn.x0 + 6, Bn.y0 + 5, Bn.x1 - Bn.x0 - 12, 2);
    ctx.fillStyle = '#ffd166'; U.roundRect(ctx, Bn.x0 + 8, Bn.y0 - 2, 18, 12, 4); ctx.fill(); ctx.fillStyle = '#ff8fab'; U.roundRect(ctx, Bn.x1 - 26, Bn.y0 - 2, 18, 12, 4); ctx.fill();   // two little cushions
    // the counter: wooden front, cream top, a cake stand and a cash register; shelves of mugs and a menu above
    const Ct = C.COUNTER;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(Ct.x0 + 4, Ct.y0 + 6, Ct.x1 - Ct.x0, Ct.y1 - Ct.y0);
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, Ct.x0, Ct.y0, Ct.x1 - Ct.x0, Ct.y1 - Ct.y0, 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; for (let x = Ct.x0 + 8; x < Ct.x1 - 6; x += 16) ctx.fillRect(x, Ct.y0 + 12, 8, Ct.y1 - Ct.y0 - 16);
    ctx.fillStyle = '#f6e7cf'; U.roundRect(ctx, Ct.x0 - 2, Ct.y0 - 8, Ct.x1 - Ct.x0 + 4, 18, 6); ctx.fill();
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(Ct.x0 + 22, Ct.y0 - 12, 30, 4); ctx.fillRect(Ct.x0 + 35, Ct.y0 - 8, 4, 6);   // cake stand
    ctx.fillStyle = 'rgba(191,227,255,0.7)'; ctx.beginPath(); ctx.arc(Ct.x0 + 37, Ct.y0 - 20, 14, Math.PI, 0); ctx.fill();
    for (let k = 0; k < 3; k++) { ctx.fillStyle = '#e0b44c'; ctx.beginPath(); ctx.arc(Ct.x0 + 29 + k * 8, Ct.y0 - 16, 4, 0, Math.PI * 2); ctx.fill(); }   // cookies under the dome
    ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, Ct.x1 - 46, Ct.y0 - 22, 30, 18, 4); ctx.fill(); ctx.fillStyle = '#8ef0a0'; ctx.fillRect(Ct.x1 - 42, Ct.y0 - 19, 22, 6); ctx.fillStyle = '#9aa0a8'; for (let k = 0; k < 3; k++) ctx.fillRect(Ct.x1 - 41 + k * 7, Ct.y0 - 11, 5, 3);   // register
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, Ct.x0 + 88, Ct.y0 - 20, 22, 16, 4); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(Ct.x0 + 92, Ct.y0 - 16, 14, 3);   // a tin of cat treats
    const Sh = C.SHELF, mugs = ['#e4572e', '#3b7dd8', '#41b883', '#ffd166', '#ff8fab', '#8e5bd1', '#4dd0e1'];
    for (let row = 0; row < 2; row++) {
      const sy = Sh.y0 + 22 + row * 28;
      ctx.fillStyle = '#8d5a2b'; ctx.fillRect(Sh.x0, sy, Sh.x1 - Sh.x0, 5); ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(Sh.x0, sy + 5, Sh.x1 - Sh.x0, 2);
      for (let i = 0; i < 7; i++) {
        const x = Sh.x0 + 10 + i * 23, col = mugs[(i + row * 3) % mugs.length];
        ctx.fillStyle = col; U.roundRect(ctx, x, sy - 13, 13, 13, 3); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x + 15, sy - 7, 3.5, -Math.PI / 2, Math.PI / 2); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x + 2, sy - 11, 3, 6);
      }
    }
    // the menu board on the wall between the window and the shelves
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, 6176, C.BACK_TOP + 16, 68, 56, 4); ctx.fill(); ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, 6179, C.BACK_TOP + 19, 62, 50, 3); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.fillRect(6181, C.BACK_TOP + 21, 58, 46);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.fillText('CAT CAFÉ', 6210, C.BACK_TOP + 29);
    ctx.fillStyle = '#fff8ee'; ctx.font = r.font(8); ctx.fillText('🍪 cookie  $4', 6210, C.BACK_TOP + 44); ctx.fillText('☕ cocoa  $5', 6210, C.BACK_TOP + 58);
    // a framed cat picture on the back wall right of the counter shelves
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, R.x1 - 6, C.BACK_TOP + 20, 26, 24, 3); ctx.fill(); ctx.fillStyle = '#fff8ee'; ctx.fillRect(R.x1 - 3, C.BACK_TOP + 23, 20, 18);
    ctx.font = r.font(11); ctx.fillStyle = '#2b1d14'; ctx.fillText('🐱', R.x1 + 7, C.BACK_TOP + 33);
    // the cat tree against the left wall: a carpeted post with two platforms (the grey cat is drawn live on top)
    const T = C.TREE;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(T.x + 3, T.y + 4, 26, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b5773a'; U.roundRect(ctx, T.x - 24, T.y - 10, 48, 16, 5); ctx.fill(); ctx.fillStyle = '#c99a5f'; U.roundRect(ctx, T.x - 24, T.y - 14, 48, 10, 5); ctx.fill();
    ctx.fillStyle = '#d9c3a3'; ctx.fillRect(T.x - 7, T.top - 2, 14, T.y - 12 - T.top); ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = T.top + 2; y < T.y - 14; y += 6) ctx.fillRect(T.x - 7, y, 14, 2);   // sisal post
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, T.x - 2, T.mid - 2, 30, 9, 4); ctx.fill(); ctx.fillStyle = '#2f9e9e'; U.roundRect(ctx, T.x - 2, T.mid - 6, 30, 7, 4); ctx.fill();   // middle platform
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, T.x - 22, T.top + 2, 44, 9, 4); ctx.fill(); ctx.fillStyle = '#2f9e9e'; U.roundRect(ctx, T.x - 22, T.top - 2, 44, 7, 4); ctx.fill();   // top platform
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(T.x + 24, T.mid - 16, 4, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(T.x + 24, T.mid - 20); ctx.lineTo(T.x + 26, T.mid - 6); ctx.stroke();   // a dangling ball
    // the toy jar by the left wall (the feather wand stands in it when nobody holds it)
    const Wd = C.WAND;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(Wd.x + 2, Wd.y + 10, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, Wd.x - 12, Wd.y - 10, 22, 20, 5); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(Wd.x - 9, Wd.y - 7, 4, 12);
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(Wd.x + 4, Wd.y - 14, 4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(Wd.x - 4, Wd.y - 13, 3.5, 0, Math.PI * 2); ctx.fill();   // balls in the jar
    ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(Wd.x - 1, Wd.y - 14); ctx.quadraticCurveTo(Wd.x + 6, Wd.y - 24, Wd.x - 2, Wd.y - 28); ctx.stroke();   // a bit of string
    // a food bowl and a water bowl by the counter end
    for (const [bx, col, fill] of [[6206, '#e4572e', '#b5773a'], [6230, '#3b7dd8', '#9fd8ff']]) { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(bx, 3146, 11, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = fill; ctx.beginPath(); ctx.ellipse(bx, 3145, 7, 3, 0, 0, Math.PI * 2); ctx.fill(); }
    // the potted plant in the corner
    const P = C.PLANT;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(P.x + 2, P.y + 12, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b86f2d'; U.roundRect(ctx, P.x - 11, P.y - 4, 22, 16, 4); ctx.fill(); ctx.fillStyle = '#8d5a2b'; ctx.fillRect(P.x - 12, P.y - 6, 24, 4);
    ctx.fillStyle = '#3f9a4a'; ctx.beginPath(); ctx.arc(P.x, P.y - 14, 12, 0, Math.PI * 2); ctx.arc(P.x - 10, P.y - 8, 8, 0, Math.PI * 2); ctx.arc(P.x + 10, P.y - 8, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#56b862'; ctx.beginPath(); ctx.arc(P.x - 3, P.y - 18, 5, 0, Math.PI * 2); ctx.fill();
    // the door in the bottom wall, its mat, and the café's name plate below
    const E = C.EXIT;
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(E.x - 22, R.y1, 44, w); ctx.fillStyle = '#bfe3ff'; ctx.fillRect(E.x - 16, R.y1 + 4, 32, 10); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(E.x + 14, R.y1 + 17, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2f9e9e'; U.roundRect(ctx, E.x - 22, E.y - 8, 44, 14, 3); ctx.fill(); ctx.fillStyle = '#80cbc4'; U.roundRect(ctx, E.x - 19, E.y - 6, 38, 10, 3); ctx.fill();
    this.drawPaw(ctx, E.x - 11, E.y + 1, '#2f9e9e', 1, 1); this.drawPaw(ctx, E.x + 11, E.y + 1, '#2f9e9e', 1, -1);
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('EXIT', E.x, E.y - 1);
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, (R.x0 + R.x1) / 2 - 46, R.y1 + w + 4, 92, 14, 4); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.fillText('🐱 CAT CAFÉ', (R.x0 + R.x1) / 2, R.y1 + w + 11);
  },

  // ---------- moving things ----------
  // outside the café's little map the screen would show the dark backdrop: paint the pavement around it
  drawOutside(r, g) {
    const ctx = r.ctx, W = CFG.CATCAFE.WORLD, x0 = r.camX - 20, y0 = r.camY - 20, x1 = r.camX + r.viewW + 20, y1 = r.camY + r.viewH + 20;
    ctx.fillStyle = '#3a4a5c';
    if (y0 < W.y0) ctx.fillRect(x0, y0, x1 - x0, W.y0 - y0);
    if (y1 > W.y1) ctx.fillRect(x0, W.y1, x1 - x0, y1 - W.y1);
    if (x0 < W.x0) ctx.fillRect(x0, W.y0, W.x0 - x0, W.y1 - W.y0);
    if (x1 > W.x1) ctx.fillRect(W.x1, W.y0, x1 - W.x1, W.y1 - W.y0);
  },
  dynamic(r, g) {
    if (!this.st || g.area !== 'catcafe') return;
    const ctx = r.ctx, st = this.st, t = g.time, C = CFG.CATCAFE, S = C.SUNBEAM, Wn = C.WINDOW;
    this.drawOutside(r, g);
    // dust motes drifting down the sunbeam
    for (const m of st.motes) {
      const k = (m.k + t * 0.05 * m.s) % 1, x = U.lerp(Wn.x0 + 30 + m.k * (Wn.x1 - Wn.x0 - 60), S.x - S.rx + 10 + m.k * (S.rx * 2 - 20), k) + Math.sin(t * 1.3 + m.k * 9) * 5, y = U.lerp(Wn.y1, S.y, k);
      ctx.fillStyle = `rgba(255,255,255,${(0.35 + 0.35 * Math.sin(t * 2 + m.k * 7)).toFixed(2)})`; ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill();
    }
    // the red laser dot on the floor
    if (!st.seat) {
      const d = st.dot, pulse = 0.5 + 0.5 * Math.sin(t * 9);
      ctx.fillStyle = `rgba(255,60,60,${(0.18 + pulse * 0.12).toFixed(2)})`; ctx.beginPath(); ctx.arc(d.x, d.y, 9 + pulse * 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff3b3b'; ctx.beginPath(); ctx.arc(d.x, d.y, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(d.x - 1, d.y - 1, 1.2, 0, Math.PI * 2); ctx.fill();
    }
  },
  entities(r, g, items) {
    if (!this.st) return;
    const st = this.st, p = g.player, C = CFG.CATCAFE;
    if ((st.cookie > 0 || st.cocoa > 0) && !g.driving && !g.onTrain) items.push({ y: p.y + 1, draw: () => this.drawTreats(r, g) });
    if (g.area !== 'catcafe') return;
    if (st.wand) items.push({ y: p.y + 1, draw: () => this.drawWand(r, g, p.x + (p.facing || 1) * 18, p.y - 30, p.facing || 1, true) });
    else items.push({ y: C.WAND.y + 6, draw: () => this.drawWand(r, g, C.WAND.x + 1, C.WAND.y - 12, 1, false) });
    items.push({ y: C.BOX.y + 8, draw: () => this.drawBox(r, g) });
    for (const c of st.cats) {
      const y = c.pose === 'lap' ? p.y + 2 : c.pose === 'tree' ? C.TREE.y + 1 : c.pose === 'box' ? C.BOX.y + 9 : c.y;
      items.push({ y, draw: () => this.drawCat(r, g, c) });
    }
    items.push({ y: st.barista.y, draw: () => this.drawBarista(r, g) });
  },
  drawTreats(r, g) {
    const ctx = r.ctx, st = this.st, p = g.player, f = p.facing || 1, bob = p.moving ? Math.sin(p.bob || 0) * 2 : 0, t = g.time;
    if (st.cookie > 0) {
      // a cat-shaped cookie: a round face with two ears and icing eyes
      const x = p.x + f * 16, y = p.y - 24 + bob;
      ctx.fillStyle = '#c98a3a'; ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x - 7, y - 3); ctx.lineTo(x - 6, y - 11); ctx.lineTo(x - 1, y - 6); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(x + 7, y - 3); ctx.lineTo(x + 6, y - 11); ctx.lineTo(x + 1, y - 6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#2b1d14'; ctx.fillRect(x - 4, y - 2, 2, 2); ctx.fillRect(x + 2, y - 2, 2, 2); ctx.fillStyle = '#ff8fab'; ctx.fillRect(x - 1, y + 1, 2, 1.5);
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.arc(x - 3, y - 4, 1.6, 0, Math.PI * 2); ctx.fill();
    }
    if (st.cocoa > 0) {
      // a mug of cocoa in the other hand, steaming
      const x = p.x - f * 16, y = p.y - 22 + bob;
      ctx.fillStyle = '#e4572e'; U.roundRect(ctx, x - 6, y - 6, 12, 12, 3); ctx.fill(); ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x - f * 8, y, 3.5, Math.PI / 2, Math.PI * 1.5, f > 0); ctx.stroke();
      ctx.fillStyle = '#6b3e1e'; ctx.beginPath(); ctx.ellipse(x, y - 6, 6, 2.2, 0, 0, Math.PI * 2); ctx.fill();
      for (let k = 0; k < 2; k++) { const ph = (t * 0.7 + k * 0.5) % 1; ctx.fillStyle = `rgba(255,255,255,${(0.6 * (1 - ph)).toFixed(2)})`; ctx.beginPath(); ctx.arc(x - 2 + k * 4 + Math.sin(ph * 6 + k) * 2, y - 10 - ph * 14, 2 + ph * 2, 0, Math.PI * 2); ctx.fill(); }
    }
  },
  drawWand(r, g, x, y, f, held) {
    const ctx = r.ctx, t = g.time, wag = held ? Math.sin(t * 5) * 0.35 : Math.sin(t * 1.2) * 0.08;
    ctx.save(); ctx.translate(x, y); ctx.rotate(-f * 0.7 + wag);
    ctx.strokeStyle = '#5b3a1a'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -26); ctx.stroke();
    ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -26); ctx.quadraticCurveTo(6, -34, 4, -42); ctx.stroke();
    for (const [col, a] of [['#ff8fab', -0.5], ['#ffd166', 0], ['#4dd0e1', 0.5]]) { ctx.save(); ctx.translate(4, -42); ctx.rotate(a + wag * 2); ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, -8, 3.2, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -15); ctx.stroke(); ctx.restore(); }
    ctx.restore();
  },
  drawBox(r, g) {
    const ctx = r.ctx, B = CFG.CATCAFE.BOX, x = B.x, y = B.y;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x - 20, y - 8, 46, 18);
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(x - 22, y - 30, 44, 18);                       // the dark inside
    ctx.fillStyle = '#c99a5f'; ctx.fillRect(x - 24, y - 32, 48, 5); ctx.fillRect(x - 24, y - 32, 5, 20); ctx.fillRect(x + 19, y - 32, 5, 20);   // back and side flaps
    ctx.fillStyle = '#b5773a'; ctx.fillRect(x - 22, y - 14, 44, 24);                       // front face
    ctx.fillStyle = '#c99a5f'; ctx.fillRect(x - 24, y - 16, 48, 4);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x - 2, y - 12, 4, 20);
    ctx.fillStyle = '#e4572e'; ctx.fillRect(x - 14, y - 4, 28, 3);                        // a tape stripe
    ctx.fillStyle = '#5b3a1a'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('THIS WAY UP', x, y + 4);
  },
  drawBarista(r, g) {
    const ctx = r.ctx, b = this.st.barista, t = g.time, hy = b.y - 46 + Math.sin(t * 2) * 0.6;
    r.drawPerson(b.x, b.y, { shirt: '#fff8ee', skin: '#e0ac69', hair: '#5b3a1a', hairStyle: 1, facing: b.facing, moving: false, bob: 0, carry: 0, pants: '#4a4a4a', apron: '#2f9e9e' });
    // the cat-ear headband
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(b.x - 7, hy - 1, 14, 2);
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(b.x + d * 4, hy); ctx.lineTo(b.x + d * 9, hy - 11); ctx.lineTo(b.x + d * 11, hy + 1); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#ff8fab';
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(b.x + d * 6, hy - 1); ctx.lineTo(b.x + d * 8.6, hy - 7); ctx.lineTo(b.x + d * 9.8, hy - 0.5); ctx.closePath(); ctx.fill(); }
    if (b.say > 0) r.drawBubble(b.x, b.y - 66, () => { ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText('Here you go! 🐱', 0, 0); }, 104);
  },
  // one cat in any pose: sleep (curled in the sun), sit, walk, box (peeking over the box edge), tree (sitting on the top
  // platform), beg (sitting up, paws raised), lap (curled on the chef)
  drawCat(r, g, c) {
    const ctx = r.ctx, t = g.time, f = c.facing || 1, C = CFG.CATCAFE, p = g.player, col = c.col, dark = c.id === 'laser';
    const eye = dark ? '#ffd166' : '#2b1d14', nose = '#ff8fab';
    let x = c.x, y = c.y;
    if (c.pose === 'tree') { x = C.TREE.x; y = C.TREE.top - 2; }
    if (c.pose === 'lap') { x = p.x; y = p.y - 10; }
    const hop = c.hop > 0 ? Math.sin((c.hop / 0.45) * Math.PI) * 14 : 0;
    const blink = ((t + x * 0.01) % 3.7) > 3.55;
    const face = (hx, hy, closed, fd = f) => {
      ctx.fillStyle = eye;
      if (closed || blink) { ctx.fillRect(hx + fd - 4, hy - 1, 3, 1.2); ctx.fillRect(hx + fd + 1, hy - 1, 3, 1.2); }
      else { ctx.beginPath(); ctx.arc(hx + fd - 2.5, hy - 1, 1.3, 0, Math.PI * 2); ctx.arc(hx + fd + 2.5, hy - 1, 1.3, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = nose; ctx.fillRect(hx + fd - 1, hy + 1.5, 2, 1.5);
      ctx.strokeStyle = 'rgba(43,29,20,0.5)'; ctx.lineWidth = 0.8; for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(hx + d * 3, hy + 2); ctx.lineTo(hx + d * 9, hy + 1); ctx.moveTo(hx + d * 3, hy + 3); ctx.lineTo(hx + d * 9, hy + 4); ctx.stroke(); }
    };
    const ears = (hx, hy, rr) => { ctx.fillStyle = col; for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(hx + d * rr * 0.9, hy - rr * 0.4); ctx.lineTo(hx + d * rr * 0.8, hy - rr * 1.6); ctx.lineTo(hx + d * rr * 0.15, hy - rr * 0.95); ctx.closePath(); ctx.fill(); } ctx.fillStyle = nose; for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(hx + d * rr * 0.75, hy - rr * 0.6); ctx.lineTo(hx + d * rr * 0.72, hy - rr * 1.25); ctx.lineTo(hx + d * rr * 0.35, hy - rr * 0.85); ctx.closePath(); ctx.fill(); } };
    if (c.pose === 'sleep' || c.pose === 'lap') {
      const breathe = Math.sin(t * 1.6) * 0.6;
      if (c.pose === 'sleep') { ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x + 1, y + 1, 15, 6, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = col; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + 6, y - 2); ctx.quadraticCurveTo(x + 16, y + 2, x + 10, y - 9); ctx.stroke();   // the tail wrapped round
      ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y - 5, 14, 8 + breathe, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = c.belly; ctx.beginPath(); ctx.ellipse(x + 2, y - 3, 8, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x - 8, y - 8, 6.5, 0, Math.PI * 2); ctx.fill();
      ears(x - 8, y - 8, 6.5);
      face(x - 8, y - 8, true, -1);
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x - 12, y - 2, 2.5, 0, Math.PI * 2); ctx.arc(x - 7, y - 1, 2.5, 0, Math.PI * 2); ctx.fill();   // paws
      return;
    }
    if (c.pose === 'box') {
      const B = C.BOX, bx = B.x, by = B.y - 14, peek = Math.sin(t * 0.9) * 1.5;
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(bx, by - 6 + peek, 8, 0, Math.PI * 2); ctx.fill();
      ears(bx, by - 6 + peek, 8); face(bx, by - 6 + peek, false);
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(bx - 6, by + 1 + peek, 3, 0, Math.PI * 2); ctx.arc(bx + 6, by + 1 + peek, 3, 0, Math.PI * 2); ctx.fill();   // paws over the edge
      return;
    }
    if (c.pose === 'walk') {
      const step = Math.sin(c.bob) * 3;
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x, y + 1, 13, 4.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - f * 10, y - 9); ctx.quadraticCurveTo(x - f * 18, y - 10 + Math.sin(t * 6) * 3, x - f * 16, y - 22); ctx.stroke();
      ctx.fillStyle = col; for (const [lx, s] of [[-7, 1], [-3, -1], [3, 1], [7, -1]]) ctx.fillRect(x + lx - 1.5, y - 8, 3, 8 + s * step);
      ctx.beginPath(); ctx.ellipse(x, y - 10, 12, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = c.belly; ctx.beginPath(); ctx.ellipse(x, y - 7, 7, 2.5, 0, 0, Math.PI * 2); ctx.fill();
      const hx = x + f * 10, hy = y - 15;
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(hx, hy, 6.5, 0, Math.PI * 2); ctx.fill();
      ears(hx, hy, 6.5); face(hx, hy, false);
      return;
    }
    // sit / tree / beg: an upright body, head on top, tail curled round the front
    const beg = c.pose === 'beg', yy = y - hop;
    if (c.pose !== 'tree') { ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x, y + 1, 10, 4, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - f * 4, yy - 2); ctx.quadraticCurveTo(x - f * 14, yy + 1 + Math.sin(t * 2.5) * 2, x - f * 12, yy - 8 + Math.sin(t * 2.5) * 3); ctx.stroke();
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, yy - 10, 8, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = c.belly; ctx.beginPath(); ctx.ellipse(x + f * 1, yy - 8, 4.5, 6.5, 0, 0, Math.PI * 2); ctx.fill();
    const hx = x + f * 2, hy = yy - 23 + (beg ? Math.sin(t * 3) * 1 : 0);
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(hx, hy, 7, 0, Math.PI * 2); ctx.fill();
    ears(hx, hy, 7); face(hx, hy, false);
    ctx.fillStyle = col;
    if (beg) { const up = Math.sin(t * 4) * 1.5; ctx.beginPath(); ctx.arc(x + f * 7, yy - 13 + up, 2.8, 0, Math.PI * 2); ctx.arc(x + f * 9, yy - 8 - up, 2.8, 0, Math.PI * 2); ctx.fill(); }
    else { ctx.beginPath(); ctx.arc(x - 4, yy - 1, 2.8, 0, Math.PI * 2); ctx.arc(x + 4, yy - 1, 2.8, 0, Math.PI * 2); ctx.fill(); }
    if (beg && this.st.begT > 4.2) r.drawBubble(x, yy - 44, () => { ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText('🐟?', 0, 0); }, 36);
  },
  overlay(r, g) {
    if (!this.st || g.area !== 'catcafe') return;
    const ctx = r.ctx, st = this.st, t = g.time;
    // little z's over the sleeping cat
    for (const c of st.cats) {
      if (c.pose !== 'sleep' && !(c.pose === 'lap' && st.lap)) continue;
      const x = c.pose === 'lap' ? g.player.x : c.x, y = c.pose === 'lap' ? g.player.y - 20 : c.y - 14;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#3b7dd8';
      for (let k = 0; k < 2; k++) { const ph = (t * 0.5 + k * 0.5) % 1; ctx.globalAlpha = 1 - ph; ctx.font = r.font(9 + ph * 7); ctx.fillText('z', x - 6 + ph * 16 + k * 4, y - 6 - ph * 26); }
      ctx.globalAlpha = 1;
    }
    // purring hearts
    for (const h of st.hearts) {
      const k = h.t / 1.2, x = h.x + Math.sin(h.w + h.t * 5) * 4, y = h.y - k * 40, s = 3 + (1 - k) * 2;
      ctx.globalAlpha = 1 - k; ctx.fillStyle = '#ff5c8a';
      ctx.beginPath(); ctx.moveTo(x, y + s); ctx.bezierCurveTo(x - s * 1.6, y - s * 0.4, x - s * 0.6, y - s * 1.6, x, y - s * 0.4); ctx.bezierCurveTo(x + s * 0.6, y - s * 1.6, x + s * 1.6, y - s * 0.4, x, y + s); ctx.fill();
    }
    ctx.globalAlpha = 1;
  },
  screen(r, g) {
    if (!this.st || this.st.fade <= 0) return;
    const ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    ctx.fillStyle = `rgba(20,12,6,${(this.st.fade / 0.45).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
  },
};
Game.ext.unshift(CatCafeExt);   // first in line so the door's button and hint beat the City's taxis and coins
Render.ext.push(CatCafeExt);
