'use strict';
// The Aquarium: City building 18 (lower row, facing Harbour Street, the light-blue one with the water tower) gets a
// wavy '🐠 AQUARIUM' banner and a stream of bubbles by the door. Inside: a dim blue hall with four glowing tank windows
// along the back wall (a school of fish and a sea turtle, a shy octopus that changes colour when you stand close,
// pulsing jellyfish, a seahorse in the seaweed, bubbles everywhere), a glass tunnel to walk through with fish swimming
// over your head, a touch pool with a starfish to pet ("Squishy! ⭐"), a feeding bucket that drops flakes and makes
// every fish rush over, a penguin corner where the penguins flop onto their bellies and slide when you come near, a
// diver mascot who waves, a $5 fish plush to carry around for half a minute and $3 shells that collect on a shelf.
// Extension module: registered with Game.ext (first, so its door beats the City's taxis) and Render.ext (see js/EXTENSIONS.md).
CFG.AQUARIUM = {
  BUILDING: 18,                                  // index in CFG.CITY.BUILDINGS: { x0: 5632, y0: 590, x1: 5770, y1: 876 }
  DOOR_OUT: { x: 5701, y: 890 },                 // on the Harbour Street sidewalk just below the door
  WORLD: { x0: 14900, y0: 3000, x1: 15500, y1: 3400 },
  ROOM: { x0: 14940, y0: 3100, x1: 15460, y1: 3340 }, WALL: 24, BACK_TOP: 3016,   // the tall back wall holds the tank windows
  TANKS: [
    { id: 'big', x0: 14960, y0: 3026, x1: 15150, y1: 3098 },      // the school of fish and the sea turtle
    { id: 'octo', x0: 15160, y0: 3026, x1: 15250, y1: 3098 },     // the shy octopus on its rock
    { id: 'jelly', x0: 15260, y0: 3026, x1: 15340, y1: 3098 },    // jellyfish
    { id: 'horse', x0: 15350, y0: 3026, x1: 15440, y1: 3098 },    // the seahorse in the seaweed
  ],
  FEED: { x: 15004, y: 3122 },                   // the bucket of fish flakes in front of the big tank
  TUNNEL: { x0: 15000, y0: 3164, x1: 15210, y1: 3230 },   // the glass tunnel: open ends, glass along the long sides
  POOL: { x: 14996, y: 3290, rx: 46, ry: 24 }, STAR: { x: 14988, y: 3290 },   // the touch pool and its starfish
  KIOSK: { x0: 15160, y0: 3262, x1: 15310, y1: 3290 },   // the little gift counter
  PADS: { plush: { x: 15196, y: 3316 }, shell: { x: 15282, y: 3316 } },
  SHELF: { x0: 14950, y0: 3346, x1: 15062, y1: 3362 },   // the shell shelf on the bottom wall, left of the door
  ICE: { x0: 15322, y0: 3246, x1: 15444, y1: 3330 },     // the penguin corner behind a rail
  DIVER_PATH: [{ x: 15250, y: 3136 }, { x: 15420, y: 3136 }, { x: 15380, y: 3214 }, { x: 15250, y: 3204 }],
  RUG: { x: 15335, y: 3186, rx: 56, ry: 26 },    // a wave rug in the open corner where the diver wanders
  EXIT: { x: 15110, y: 3322 },                   // the mat inside the door (the door is in the bottom wall)
  PLUSH: 30, FEED_CD: 6, NEAR_PENGUIN: 120, NEAR_OCTO: 80, PET: 1.2,   // seconds the plush lasts, between feeds; how close wakes the penguins / the octopus; the starfish wiggle
};
CFG.AREAS.aquarium = { WORLD: CFG.AQUARIUM.WORLD };

const AquariumExt = {
  name: 'aquarium',
  st: null,
  defaults: { aquarium: { seen: false, tunnel: false, fed: 0, pets: 0, penguins: false, plushes: 0, shells: 0 } },

  // ---------- state ----------
  build(g) {
    const A = CFG.AQUARIUM;
    if (!g.s.aquarium) g.s.aquarium = { seen: false, tunnel: false, fed: 0, pets: 0, penguins: false, plushes: 0, shells: 0 };
    const tank = (id) => A.TANKS.find((t) => t.id === id);
    const fish = [], cols = ['#ff7043', '#ffd166', '#4dd0e1', '#ff8fab', '#9ccc65', '#ffab40', '#b388ff'];
    const addFish = (T, n, sizes) => { for (let i = 0; i < n; i++) { const s = sizes[i % sizes.length]; fish.push({ tank: T, x: U.rand(T.x0 + 12, T.x1 - 12), y0: U.rand(T.y0 + 12, T.y1 - 10), y: 0, dir: Math.random() < 0.5 ? -1 : 1, sp: U.rand(14, 30), w: U.rand(1.5, 3), ph: U.rand(0, 6.3), amp: U.rand(2, 5), s, col: cols[(i + T.x0) % cols.length], nom: 0 }); } };
    addFish(tank('big'), 9, [6, 5, 7, 5, 6]); addFish(tank('octo'), 2, [4]); addFish(tank('horse'), 3, [4, 5]); addFish(A.TUNNEL, 7, [7, 6, 8, 5, 6]);
    for (const f of fish) f.y = f.y0;
    const ice = A.ICE;
    this.st = {
      fade: 0, plush: 0, feedCd: 0, star: 0, pengCheer: false, bubbleT: 0, flakes: [], bubbles: [], spray: [],
      fish,
      turtle: { x: 15040, y: 3070, dir: 1, t: 0 },
      jellies: [0, 1, 2].map((i) => ({ x: 15278 + i * 24, y0: 3050 + (i % 2) * 14, ph: i * 2.1 })),
      crab: { x: 15010, dir: -1, t: 0 },
      penguins: [0, 1, 2].map((i) => ({ x: ice.x0 + 24 + i * 38, y: ice.y0 + 30 + (i % 2) * 36, dir: 1, mode: 'waddle', tx: 0, ty: 0, vx: 0, vy: 0, bob: 0, wait: i * 0.7 })),
      diver: { x: A.DIVER_PATH[0].x, y: A.DIVER_PATH[0].y, leg: 1, facing: 1, moving: false, bob: 0, wave: 0, bubT: 0 },
      obs: null,
    };
    for (const p of this.st.penguins) { p.tx = p.x; p.ty = p.y; }
    const R = A.ROOM, w = A.WALL, o = [], T = A.TUNNEL, P = A.POOL, K = A.KIOSK, F = A.FEED;
    o.push({ x: R.x0 - w, y: R.y0 - w, w: R.x1 - R.x0 + 2 * w, h: w }, { x: R.x0 - w, y: R.y1, w: R.x1 - R.x0 + 2 * w, h: w });
    o.push({ x: R.x0 - w, y: R.y0, w, h: R.y1 - R.y0 }, { x: R.x1, y: R.y0, w, h: R.y1 - R.y0 });
    o.push({ x: T.x0, y: T.y0 - 6, w: T.x1 - T.x0, h: 6 }, { x: T.x0, y: T.y1, w: T.x1 - T.x0, h: 6 });   // the tunnel's glass sides
    o.push({ x: P.x - P.rx, y: P.y - P.ry, w: P.rx * 2, h: P.ry * 2 });
    o.push({ x: K.x0, y: K.y0, w: K.x1 - K.x0, h: K.y1 - K.y0 });
    o.push({ x: F.x - 9, y: F.y - 7, w: 18, h: 14 });
    o.push({ x: ice.x0 - 4, y: ice.y0 - 4, w: ice.x1 - ice.x0 + 8, h: ice.y1 - ice.y0 + 8 });
    this.st.obs = o;
  },
  obstacles(g) { return g.area === 'aquarium' && this.st ? this.st.obs : []; },
  free(x, y) {
    const R = CFG.AQUARIUM.ROOM, r = 12;
    if (x < R.x0 + r || x > R.x1 - r || y < R.y0 + r || y > R.y1 - r) return false;
    for (const o of this.st.obs) if (x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h) return false;
    return true;
  },
  onFoot(g) { return !g.driving && !g.onTrain && !g.ride && !g.travel && !g.fishing; },
  cityBusy() { return typeof CityExt !== 'undefined' && (CityExt.floor || (CityExt.st && (CityExt.st.cab || CityExt.st.boarding))); },
  atDoor(g) { const D = CFG.AQUARIUM.DOOR_OUT, p = g.player; return g.area === 'city' && this.onFoot(g) && !this.cityBusy() && U.dist(p.x, p.y, D.x, D.y) < 30; },
  inTunnel(x, y) { const T = CFG.AQUARIUM.TUNNEL; return x > T.x0 && x < T.x1 && y > T.y0 && y < T.y1; },
  nearPool(g) { const P = CFG.AQUARIUM.POOL, p = g.player; return U.dist(p.x, p.y, P.x, P.y) < 66; },
  nearFeed(g) { const F = CFG.AQUARIUM.FEED, p = g.player; return U.dist(p.x, p.y, F.x, F.y) < 42; },
  iceCentre() { const I = CFG.AQUARIUM.ICE; return { x: (I.x0 + I.x1) / 2, y: (I.y0 + I.y1) / 2 }; },
  nearIce(g) { const c = this.iceCentre(), p = g.player; return U.dist(p.x, p.y, c.x, c.y) < CFG.AQUARIUM.NEAR_PENGUIN; },
  octoNear(g) { const T = CFG.AQUARIUM.TANKS[1], p = g.player; if (g.area !== 'aquarium') return 0; return U.clamp(1 - (U.dist(p.x, p.y, (T.x0 + T.x1) / 2, 3112) - 30) / CFG.AQUARIUM.NEAR_OCTO, 0, 1); },

  // ---------- game hooks ----------
  action(g) {
    if (!this.st) this.build(g);
    const p = g.player, A = CFG.AQUARIUM, st = this.st;
    if (this.atDoor(g)) return { label: '🚪 Go inside', run: (gg) => this.enter(gg) };
    if (g.area !== 'aquarium') return null;
    if (U.dist(p.x, p.y, A.EXIT.x, A.EXIT.y) < 30) return { label: '🚪 Go outside', run: (gg) => this.leave(gg) };
    if (this.nearPool(g)) return { label: '⭐ Pet the starfish', run: (gg) => this.pet(gg) };
    if (this.nearFeed(g)) return st.feedCd <= 0 ? { label: '🐟 Feed the fish', run: (gg) => this.feed(gg) } : null;
    return null;
  },
  enter(g) {
    const A = CFG.AQUARIUM, p = g.player;
    g.area = 'aquarium'; p.x = A.EXIT.x; p.y = A.EXIT.y - 8; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.st.fade = 0.45; Sfx.ding(); Haptics.tap();
    if (!g.s.aquarium.seen) { g.s.aquarium.seen = true; g.toast('🐠 Welcome to the Aquarium!', true); }
  },
  leave(g) {
    const A = CFG.AQUARIUM, p = g.player;
    g.area = 'city'; p.x = A.DOOR_OUT.x; p.y = A.DOOR_OUT.y; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.st.fade = 0.45; Sfx.drop();
  },
  pet(g) {
    const st = this.st, S = CFG.AQUARIUM.STAR;
    st.star = CFG.AQUARIUM.PET; g.s.aquarium.pets++;
    g.floats.push({ x: S.x, y: S.y - 40, text: 'Squishy! ⭐', color: '#ffe08a', t: 0, dur: 1.5, big: true });
    for (let i = 0; i < 4; i++) g.fx.push({ kind: 'sparkle', x0: S.x + U.rand(-18, 18), y0: S.y - 10 + U.rand(-10, 6), x1: 0, y1: 0, t: -i * 0.08, dur: 0.6 });
    Sfx.pickup(); Haptics.tap();
  },
  feed(g) {
    const st = this.st, A = CFG.AQUARIUM, big = A.TANKS[0];
    st.feedCd = A.FEED_CD; g.s.aquarium.fed++;
    for (let i = 0; i < 8; i++) st.flakes.push({ tank: big, x: U.rand(big.x0 + 30, big.x1 - 30), y: big.y0 + 4 + U.rand(0, 6), t: 0, col: i % 2 ? '#ffd166' : '#ff8a65' });
    for (let i = 0; i < 4; i++) st.flakes.push({ tank: A.TUNNEL, x: U.rand(A.TUNNEL.x0 + 30, A.TUNNEL.x1 - 30), y: A.TUNNEL.y0 + 6 + U.rand(0, 6), t: 0, col: i % 2 ? '#ffd166' : '#ff8a65' });
    g.floats.push({ x: A.FEED.x, y: A.FEED.y - 40, text: 'Nom nom! 🐟', color: '#ffe08a', t: 0, dur: 1.5, big: true });
    Sfx.pickup(); Haptics.tap();
  },
  home(g) {
    if (!this.st) return;
    const st = this.st, D = CFG.AQUARIUM.DIVER_PATH[0];
    st.fade = 0; st.feedCd = 0; st.star = 0; st.flakes = []; st.pengCheer = false;
    st.diver.x = D.x; st.diver.y = D.y; st.diver.leg = 1; st.diver.moving = false; st.diver.wave = 0;
    for (const p of st.penguins) { p.mode = 'waddle'; p.vx = 0; p.vy = 0; }
  },
  // a save or a push that left the chef in a wall, the pool or the tanks' glass goes back onto the door mat
  rescue(g) {
    const p = g.player, A = CFG.AQUARIUM;
    if (this.free(p.x, p.y)) return false;
    p.x = A.EXIT.x; p.y = A.EXIT.y - 8; p.moving = false;
    g.floats.push({ x: p.x, y: p.y - 50, text: 'Oops! Back inside', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    return true;
  },
  update(g, dt) {
    if (!this.st) this.build(g);
    const st = this.st, p = g.player, A = CFG.AQUARIUM, s = g.s.aquarium, t = g.time;
    st.fade = Math.max(0, st.fade - dt);
    st.plush = Math.max(0, st.plush - dt);
    if (g.area !== 'aquarium') { st.pengCheer = false; return; }
    this.rescue(g);
    st.feedCd = Math.max(0, st.feedCd - dt);
    st.star = Math.max(0, st.star - dt);
    if (!s.tunnel && this.inTunnel(p.x, p.y)) { s.tunnel = true; g.floats.push({ x: p.x, y: p.y - 70, text: 'Fish overhead! 🐟', color: '#bfe3ff', t: 0, dur: 1.5, big: true }); }
    // flakes sink and get eaten; every fish rushes towards the nearest flake (fish in other tanks press against their glass)
    for (const f of st.flakes) { f.t += dt; f.y = Math.min(f.tank.y1 - 6, f.y + 7 * dt); }
    for (const f of st.fish) {
      const T = f.tank; let best = null, bd = Infinity;
      for (const fl of st.flakes) { const d = U.dist(f.x, f.y, fl.x, fl.y); if (d < bd) { bd = d; best = fl; } }
      f.nom = Math.max(0, f.nom - dt);
      if (best) {
        const tx = U.clamp(best.x, T.x0 + 10, T.x1 - 10), ty = U.clamp(best.y, T.y0 + 8, T.y1 - 6);
        if (Math.abs(tx - f.x) > 2) f.dir = tx > f.x ? 1 : -1;
        if (U.moveToward(f, tx, ty, 80, dt) && best.tank === T) { best.t = 99; f.nom = 0.4; st.bubbles.push({ tank: T, x: f.x, y: f.y - 4, r: 1.5, t: 0 }); }
        f.y0 = f.y;
      } else {
        f.x += f.dir * f.sp * dt;
        if (f.x < T.x0 + 10) { f.x = T.x0 + 10; f.dir = 1; } else if (f.x > T.x1 - 10) { f.x = T.x1 - 10; f.dir = -1; }
        f.y = f.y0 + Math.sin(t * f.w + f.ph) * f.amp;
      }
    }
    st.flakes = st.flakes.filter((f) => f.t < 7);
    // the turtle paddles slowly across the big tank
    const tu = st.turtle, big = A.TANKS[0]; tu.t += dt; tu.x += tu.dir * 9 * dt; tu.y = 3072 + Math.sin(t * 0.8) * 5;
    if (tu.x > big.x1 - 28) tu.dir = -1; else if (tu.x < big.x0 + 28) tu.dir = 1;
    // bubbles rise in every tank
    st.bubbleT -= dt;
    if (st.bubbleT <= 0) { st.bubbleT = U.rand(0.25, 0.5); const T = U.pick(A.TANKS.concat([A.TUNNEL])); st.bubbles.push({ tank: T, x: U.rand(T.x0 + 8, T.x1 - 8), y: T.y1 - 4, r: U.rand(1.5, 3.5), t: 0 }); }
    for (const b of st.bubbles) { b.t += dt; b.y -= (14 + b.r * 4) * dt; }
    st.bubbles = st.bubbles.filter((b) => b.y > b.tank.y0 + 4);
    // the crab scuttles sideways round the touch pool
    const c = st.crab; c.t += dt; c.x += c.dir * 10 * dt; if (c.x > A.POOL.x + 22) c.dir = -1; else if (c.x < A.POOL.x - 26) c.dir = 1;
    // penguins: waddle about the ice; when the chef comes close they flop onto their bellies and slide around
    const I = A.ICE, near = this.nearIce(g);
    if (near && !s.penguins) s.penguins = true;
    if (near && !st.pengCheer) { st.pengCheer = true; const ic = this.iceCentre(); g.floats.push({ x: ic.x, y: I.y0 - 20, text: 'Wheee! 🐧', color: '#bfe3ff', t: 0, dur: 1.4, big: true }); Sfx.pickup(); }
    if (!near) st.pengCheer = false;
    for (const pg of st.penguins) {
      if (near) {
        if (pg.mode !== 'slide') { pg.mode = 'slide'; const a = U.rand(0, Math.PI * 2); pg.vx = Math.cos(a) * 110; pg.vy = Math.sin(a) * 70; }
        pg.x += pg.vx * dt; pg.y += pg.vy * dt;
        if (pg.x < I.x0 + 14) { pg.x = I.x0 + 14; pg.vx = Math.abs(pg.vx); } else if (pg.x > I.x1 - 14) { pg.x = I.x1 - 14; pg.vx = -Math.abs(pg.vx); }
        if (pg.y < I.y0 + 18) { pg.y = I.y0 + 18; pg.vy = Math.abs(pg.vy); } else if (pg.y > I.y1 - 8) { pg.y = I.y1 - 8; pg.vy = -Math.abs(pg.vy); }
        pg.dir = pg.vx >= 0 ? 1 : -1; pg.bob += dt * 20;
        if (Math.random() < dt * 6) st.spray.push({ x: pg.x - pg.dir * 10, y: pg.y + 2, t: 0 });
      } else {
        if (pg.mode !== 'waddle') { pg.mode = 'waddle'; pg.tx = pg.x; pg.ty = pg.y; pg.wait = U.rand(0.3, 1); }
        if (pg.wait > 0) { pg.wait -= dt; pg.bob = 0; continue; }
        if (U.moveToward(pg, pg.tx, pg.ty, 26, dt)) { pg.wait = U.rand(0.8, 2.4); pg.tx = U.rand(I.x0 + 16, I.x1 - 16); pg.ty = U.rand(I.y0 + 20, I.y1 - 8); pg.dir = pg.tx > pg.x ? 1 : -1; }
        else pg.bob += dt * 10;
      }
    }
    for (const sp of st.spray) sp.t += dt;
    st.spray = st.spray.filter((sp) => sp.t < 0.5);
    // the diver walks a loop round the hall and waves when the chef is close
    const dv = st.diver, dNear = U.dist(p.x, p.y, dv.x, dv.y) < 70;
    if (dNear) { dv.moving = false; dv.facing = p.x < dv.x ? -1 : 1; dv.wave += dt; }
    else { dv.wave = 0; const w = A.DIVER_PATH[dv.leg]; if (U.moveToward(dv, w.x, w.y, 34, dt)) dv.leg = (dv.leg + 1) % A.DIVER_PATH.length; else dv.facing = w.x < dv.x ? -1 : 1; }
    dv.bob = dv.moving ? dv.bob + dt * 10 : 0;
    dv.bubT -= dt; if (dv.bubT <= 0) { dv.bubT = U.rand(0.6, 1.4); st.spray.push({ x: dv.x + dv.facing * 8, y: dv.y - 52, t: 0, bubble: true }); }
  },
  pads(g) {
    if (g.area !== 'aquarium') return [];
    const P = CFG.AQUARIUM.PADS, n = g.s.aquarium.shells;
    return [
      { key: 'aquaPlush', label: 'Fish plush', ico: '🐠', pos: P.plush, price: 5, sub: 'carry it!' },
      { key: 'aquaShell', label: 'Shell', ico: '🐚', pos: P.shell, price: 3, sub: n ? `${n} on the shelf` : 'for your shelf' },
    ];
  },
  onPad(g, pad) {
    const p = g.player, s = g.s.aquarium;
    if (pad.key === 'aquaPlush') { this.st.plush = CFG.AQUARIUM.PLUSH; s.plushes++; g.floats.push({ x: p.x, y: p.y - 60, text: 'A fishy friend! 🐠', color: '#ffe08a', t: 0, dur: 1.5, big: true }); Haptics.success(); }
    if (pad.key === 'aquaShell') { s.shells++; g.floats.push({ x: p.x, y: p.y - 60, text: 'A pretty shell! 🐚', color: '#ffe08a', t: 0, dur: 1.5, big: true }); g.fx.push({ kind: 'sparkle', x0: CFG.AQUARIUM.SHELF.x0 + 12 + Math.min(s.shells - 1, 7) * 14, y0: CFG.AQUARIUM.SHELF.y0 + 4, x1: 0, y1: 0, t: 0, dur: 0.7 }); Haptics.success(); }
  },
  hint(g) {
    if (!this.st) return undefined;
    const p = g.player, A = CFG.AQUARIUM, st = this.st, s = g.s.aquarium;
    if (g.area === 'city') {
      if (!this.onFoot(g) || this.cityBusy()) return undefined;
      const d = U.dist(p.x, p.y, A.DOOR_OUT.x, A.DOOR_OUT.y);
      if (d < 70) return { text: 'Visit the aquarium! 🐠', target: d < 30 ? null : A.DOOR_OUT };
      return undefined;
    }
    if (g.area !== 'aquarium') return undefined;
    if (this.inTunnel(p.x, p.y)) return { text: 'Look up! Fish are swimming over you 🐟', target: null };
    const T = A.TUNNEL, cash = (k, n) => g.s.cash + (g.s.padPaid[k] || 0) >= n;
    if (!s.tunnel) return { text: 'Walk through the fish tunnel! 🐟', target: { x: (T.x0 + T.x1) / 2, y: (T.y0 + T.y1) / 2 } };
    if (!s.fed) return { text: 'Feed the fish! 🐟', target: A.FEED };
    if (!s.pets) return { text: 'Pet the starfish! ⭐', target: A.STAR };
    if (!s.penguins) return { text: 'Say hi to the penguins! 🐧', target: this.iceCentre() };
    if (!s.plushes && cash('aquaPlush', 5)) return { text: 'Buy a fish plush! 🐠', target: A.PADS.plush };
    if (!s.shells && cash('aquaShell', 3)) return { text: 'Buy a shell for your shelf! 🐚', target: A.PADS.shell };
    if (st.plush > 0) return { text: 'A fishy friend! 🐠', target: null };
    return { text: 'Watch the fish! 🐠', target: null };
  },

  // ---------- the City outside: the wavy banner and the bubbles by the door ----------
  bld() { return CFG.CITY.BUILDINGS[CFG.AQUARIUM.BUILDING]; },
  paintAfter(r, g, area) {
    if (area !== 'city') return;
    const ctx = r.ctx, b = this.bld(), cx = (b.x0 + b.x1) / 2, gy = b.y1 - 40, sign = '🐠 AQUARIUM';
    ctx.font = r.font(10); const tw = ctx.measureText(sign).width + 26, x0 = cx - tw / 2, y0 = gy - 30;
    // a blue banner with a wavy bottom edge, like water
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x0 + 2, y0 + 2, tw, 22);
    ctx.fillStyle = '#1e88e5'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + tw, y0); ctx.lineTo(x0 + tw, y0 + 18);
    for (let x = x0 + tw; x >= x0; x -= 2) ctx.lineTo(x, y0 + 20 + Math.sin((x - x0) / 5) * 3);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(x0, y0, tw, 3);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(sign, cx, y0 + 10);
    // painted bubbles on the facade either side of the banner
    for (const [dx, dy, rr] of [[-tw / 2 - 12, 4, 4], [-tw / 2 - 20, -8, 2.5], [tw / 2 + 12, 2, 4], [tw / 2 + 20, -10, 2.5]]) { ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx + dx, y0 + 10 + dy, rr, 0, Math.PI * 2); ctx.stroke(); }
    // a wavy welcome mat on the sidewalk in front of the door
    const D = CFG.AQUARIUM.DOOR_OUT;
    ctx.fillStyle = '#1e88e5'; U.roundRect(ctx, D.x - 16, D.y - 6, 32, 11, 3); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let x = D.x - 13; x <= D.x + 13; x += 1) { const y = D.y - 1 + Math.sin((x - D.x) / 3) * 2; if (x === D.x - 13) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke();
  },

  // ---------- the interior, static ----------
  paint: { aquarium(r, g) { AquariumExt.paintHall(r, g); } },
  paintHall(r, g) {
    const ctx = r.ctx, A = CFG.AQUARIUM, W = A.WORLD, R = A.ROOM, w = A.WALL;
    // outside the hall: deep dark blue
    ctx.fillStyle = '#0b1a2e'; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    ctx.strokeStyle = 'rgba(120,200,255,0.07)'; ctx.lineWidth = 2;
    for (let k = 0; k < 10; k++) { ctx.beginPath(); for (let x = W.x0; x <= W.x1; x += 8) { const y = W.y0 + 20 + k * 40 + Math.sin(x / 30 + k * 1.3) * 7; if (x === W.x0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke(); }
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(R.x0 - w + 8, A.BACK_TOP + 10, R.x1 - R.x0 + 2 * w, R.y1 + w - A.BACK_TOP);
    // the floor: dark navy tiles with faint caustic ripples
    ctx.fillStyle = '#14304d'; ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.04)'; for (let y = R.y0; y < R.y1; y += 30) for (let x = R.x0 + ((y / 30) % 2) * 15; x < R.x1; x += 30) ctx.fillRect(x, y, 28, 28);
    ctx.strokeStyle = 'rgba(120,200,255,0.10)'; ctx.lineWidth = 2;
    for (let k = 0; k < 7; k++) { ctx.beginPath(); for (let x = R.x0; x <= R.x1; x += 6) { const y = R.y0 + 30 + k * 32 + Math.sin(x / 23 + k) * 6; if (x === R.x0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke(); }
    // the tanks' glow spills onto the floor below the back wall
    const gl = ctx.createLinearGradient(0, R.y0, 0, R.y0 + 70); gl.addColorStop(0, 'rgba(77,208,225,0.28)'); gl.addColorStop(1, 'rgba(77,208,225,0)');
    ctx.fillStyle = gl; ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, 70);
    // walls: a tall dark back wall with the tank windows, dark side and bottom walls
    ctx.fillStyle = '#1b3a5c'; ctx.fillRect(R.x0 - w, A.BACK_TOP, R.x1 - R.x0 + 2 * w, R.y0 - A.BACK_TOP);
    ctx.fillStyle = '#122a44'; ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, w); ctx.fillRect(R.x0 - w, R.y0, w, R.y1 - R.y0); ctx.fillRect(R.x1, R.y0, w, R.y1 - R.y0);
    ctx.fillStyle = '#0d2238'; ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, 3); ctx.fillRect(R.x0 - w, R.y0, 3, R.y1 - R.y0); ctx.fillRect(R.x1 + w - 3, R.y0, 3, R.y1 - R.y0);
    ctx.fillStyle = '#2d5a8a'; ctx.fillRect(R.x0 - w, R.y0 - 5, R.x1 - R.x0 + 2 * w, 5);   // the ledge under the tanks
    for (const T of A.TANKS) this.paintTank(r, T);
    // a round wave rug with a starfish print in the open corner
    const Rg = A.RUG;
    ctx.fillStyle = '#1e5f8e'; ctx.beginPath(); ctx.ellipse(Rg.x, Rg.y, Rg.rx, Rg.ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(Rg.x, Rg.y, Rg.rx - 6, Rg.ry - 5, 0, 0, Math.PI * 2); ctx.stroke();
    for (let k = -1; k <= 1; k++) { ctx.beginPath(); for (let x = Rg.x - 34; x <= Rg.x + 34; x += 3) { const y = Rg.y + k * 9 + Math.sin(x / 5) * 2; if (x === Rg.x - 34) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke(); }
    ctx.fillStyle = '#ff8a3d'; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 3.5 : 9; ctx.lineTo(Rg.x + 36 + Math.cos(a) * rr, Rg.y - 10 + Math.sin(a) * rr * 0.8); } ctx.closePath(); ctx.fill();
    // the feeding bucket in front of the big tank
    const F = A.FEED;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(F.x + 2, F.y + 8, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, F.x - 9, F.y - 8, 18, 16, 3); ctx.fill(); ctx.fillStyle = '#ff8a65'; ctx.fillRect(F.x - 9, F.y - 8, 18, 4);
    ctx.fillStyle = '#ffd166'; for (let i = 0; i < 5; i++) ctx.fillRect(F.x - 6 + i * 3, F.y - 10 - (i % 2) * 2, 2, 2);
    ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(F.x, F.y - 8, 9, Math.PI, 0); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('FISH FOOD', F.x, F.y + 16);
    // the glass tunnel's floor and rims (the water and the fish above it are drawn live)
    const T = A.TUNNEL;
    ctx.fillStyle = '#1d4a73'; ctx.fillRect(T.x0, T.y0, T.x1 - T.x0, T.y1 - T.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.05)'; for (let x = T.x0; x < T.x1; x += 20) ctx.fillRect(x, T.y0, 10, T.y1 - T.y0);
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(T.x0, T.y0 - 6, T.x1 - T.x0, 6); ctx.fillRect(T.x0, T.y1, T.x1 - T.x0, 6);
    ctx.fillStyle = '#c9ccd2'; for (let x = T.x0; x < T.x1; x += 42) { ctx.fillRect(x, T.y0 - 8, 4, 10); ctx.fillRect(x, T.y1 - 2, 4, 10); }
    // the touch pool: a low rock wall round shallow turquoise water with sand
    const P = A.POOL;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(P.x + 3, P.y + 5, P.rx + 4, P.ry + 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6b7a86'; ctx.beginPath(); ctx.ellipse(P.x, P.y, P.rx + 4, P.ry + 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8d9aa5'; for (let a = 0; a < Math.PI * 2; a += 0.55) { ctx.beginPath(); ctx.ellipse(P.x + Math.cos(a) * (P.rx + 1), P.y + Math.sin(a) * (P.ry + 1), 6, 4, a, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#e8d7a8'; ctx.beginPath(); ctx.ellipse(P.x, P.y, P.rx - 4, P.ry - 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(77,208,225,0.55)'; ctx.beginPath(); ctx.ellipse(P.x, P.y, P.rx - 4, P.ry - 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff8fab'; ctx.beginPath(); ctx.arc(P.x + 26, P.y + 6, 4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#b388ff'; ctx.beginPath(); ctx.arc(P.x - 24, P.y - 8, 3.5, 0, Math.PI * 2); ctx.fill();   // anemones
    ctx.fillStyle = '#fff'; ctx.font = r.font(7); ctx.fillText('TOUCH POOL', P.x, P.y + P.ry + 12);
    // the gift kiosk: a blue counter with a scalloped top and a little sign
    const K = A.KIOSK;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(K.x0 + 4, K.y0 + 6, K.x1 - K.x0, K.y1 - K.y0);
    ctx.fillStyle = '#1e88e5'; U.roundRect(ctx, K.x0, K.y0, K.x1 - K.x0, K.y1 - K.y0, 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; for (let x = K.x0 + 8; x < K.x1 - 6; x += 16) ctx.fillRect(x, K.y0 + 12, 8, K.y1 - K.y0 - 16);
    ctx.fillStyle = '#e3f2fd'; U.roundRect(ctx, K.x0 - 2, K.y0 - 8, K.x1 - K.x0 + 4, 18, 6); ctx.fill();
    ctx.fillStyle = '#ffd166'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(K.x0 + 20 + i * 36, K.y0 - 1, 6, 0, Math.PI * 2); ctx.fill(); }   // plushes on display
    ctx.fillStyle = '#ff7043'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(K.x0 + 26 + i * 36, K.y0 - 1); ctx.lineTo(K.x0 + 31 + i * 36, K.y0 - 5); ctx.lineTo(K.x0 + 31 + i * 36, K.y0 + 3); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, (K.x0 + K.x1) / 2 - 30, K.y0 - 26, 60, 14, 4); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.fillText('🎁 GIFTS', (K.x0 + K.x1) / 2, K.y0 - 19);
    // the penguin corner: an icy pool behind a rail
    const I = A.ICE;
    ctx.fillStyle = '#9ad0ff'; U.roundRect(ctx, I.x0, I.y0, I.x1 - I.x0, I.y1 - I.y0, 10); ctx.fill();
    ctx.fillStyle = '#e8f6ff'; U.roundRect(ctx, I.x0 + 6, I.y0 + 6, I.x1 - I.x0 - 12, I.y1 - I.y0 - 30, 8); ctx.fill();
    ctx.fillStyle = '#f7fcff'; U.roundRect(ctx, I.x0 + 10, I.y0 + 10, 40, 18, 6); ctx.fill(); U.roundRect(ctx, I.x1 - 46, I.y0 + 22, 36, 14, 5); ctx.fill();
    ctx.fillStyle = '#d6eeff'; U.roundRect(ctx, I.x0 + 30, I.y1 - 26, 60, 20, 6); ctx.fill();   // a water pool at the front
    ctx.strokeStyle = '#8d9aa5'; ctx.lineWidth = 3; ctx.strokeRect(I.x0 - 2, I.y0 - 2, I.x1 - I.x0 + 4, I.y1 - I.y0 + 4);
    ctx.fillStyle = '#8d9aa5'; for (let x = I.x0; x <= I.x1; x += 24) { ctx.fillRect(x - 2, I.y0 - 8, 4, 8); ctx.fillRect(x - 2, I.y1 - 2, 4, 8); }
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, (I.x0 + I.x1) / 2 - 34, I.y0 - 28, 68, 14, 4); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.fillText('🐧 PENGUINS', (I.x0 + I.x1) / 2, I.y0 - 21);
    // the shell shelf on the bottom wall (the shells themselves are drawn live, as they are bought)
    const S = A.SHELF;
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(S.x0, S.y0 + 10, S.x1 - S.x0, 4); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(S.x0, S.y0 + 14, S.x1 - S.x0, 2);
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(6); ctx.fillText('MY SHELLS', (S.x0 + S.x1) / 2, S.y1 + 2);
    // the door in the bottom wall, its mat and the name plate below
    const E = A.EXIT;
    ctx.fillStyle = '#0d2238'; ctx.fillRect(E.x - 22, R.y1, 44, w); ctx.fillStyle = '#bfe3ff'; ctx.fillRect(E.x - 16, R.y1 + 4, 32, 10); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(E.x + 14, R.y1 + 17, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1e88e5'; U.roundRect(ctx, E.x - 21, E.y - 8, 42, 14, 3); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let x = E.x - 18; x <= E.x + 18; x += 1) { const y = E.y + 3 + Math.sin((x - E.x) / 3) * 1.5; if (x === E.x - 18) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('EXIT', E.x, E.y - 3);
    ctx.fillStyle = '#1e88e5'; U.roundRect(ctx, (R.x0 + R.x1) / 2 - 50, R.y1 + w + 4, 100, 14, 4); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = r.font(8); ctx.fillText('🐠 AQUARIUM 🐠', (R.x0 + R.x1) / 2, R.y1 + w + 11);
  },
  paintTank(r, T) {
    const ctx = r.ctx, cx = (T.x0 + T.x1) / 2;
    ctx.fillStyle = '#2d5a8a'; U.roundRect(ctx, T.x0 - 5, T.y0 - 5, T.x1 - T.x0 + 10, T.y1 - T.y0 + 10, 6); ctx.fill();
    const gl = ctx.createLinearGradient(0, T.y0, 0, T.y1); gl.addColorStop(0, '#1fa2d6'); gl.addColorStop(1, '#0d5c8f');
    ctx.fillStyle = gl; ctx.fillRect(T.x0, T.y0, T.x1 - T.x0, T.y1 - T.y0);
    ctx.fillStyle = '#e8d7a8'; ctx.fillRect(T.x0, T.y1 - 7, T.x1 - T.x0, 7); ctx.fillStyle = '#c9b98a'; for (let x = T.x0 + 4; x < T.x1; x += 11) ctx.fillRect(x, T.y1 - 4, 3, 2);
    // seaweed, coral and rocks differ a little per tank
    const weed = (x, h, col) => { ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, T.y1 - 6); for (let k = 1; k <= 4; k++) ctx.lineTo(x + Math.sin(k * 1.8) * 4, T.y1 - 6 - k * h / 4); ctx.stroke(); };
    if (T.id === 'big') { weed(T.x0 + 16, 34, '#2e9e5b'); weed(T.x0 + 26, 24, '#56b862'); weed(T.x1 - 20, 40, '#2e9e5b'); ctx.fillStyle = '#ff8fab'; ctx.beginPath(); ctx.arc(cx + 30, T.y1 - 12, 7, 0, Math.PI * 2); ctx.arc(cx + 40, T.y1 - 9, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#6b7a86'; ctx.beginPath(); ctx.ellipse(cx - 30, T.y1 - 9, 16, 7, 0, 0, Math.PI * 2); ctx.fill(); }
    if (T.id === 'octo') { ctx.fillStyle = '#6b7a86'; ctx.beginPath(); ctx.ellipse(cx, T.y1 - 14, 26, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#8d9aa5'; ctx.beginPath(); ctx.ellipse(cx - 8, T.y1 - 20, 10, 6, 0, 0, Math.PI * 2); ctx.fill(); weed(T.x0 + 10, 24, '#56b862'); }
    if (T.id === 'jelly') { ctx.fillStyle = '#0a4a78'; ctx.fillRect(T.x0, T.y0, T.x1 - T.x0, T.y1 - T.y0 - 7); ctx.fillStyle = 'rgba(255,255,255,0.06)'; for (let i = 0; i < 12; i++) ctx.fillRect(T.x0 + ((i * 37) % (T.x1 - T.x0)), T.y0 + 4 + ((i * 13) % 50), 2, 2); }
    if (T.id === 'horse') { weed(T.x0 + 14, 44, '#2e9e5b'); weed(T.x0 + 24, 36, '#56b862'); weed(cx + 6, 48, '#2e9e5b'); weed(T.x1 - 14, 30, '#56b862'); ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(T.x1 - 24, T.y1 - 10, 5, 0, Math.PI * 2); ctx.fill(); }
    // the glass: a soft sheen and a frame
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.moveTo(T.x0 + 6, T.y0); ctx.lineTo(T.x0 + 26, T.y0); ctx.lineTo(T.x0 + 10, T.y1 - 7); ctx.lineTo(T.x0, T.y1 - 7); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#9ad0ff'; ctx.lineWidth = 2; ctx.strokeRect(T.x0, T.y0, T.x1 - T.x0, T.y1 - T.y0);
    const names = { big: '🐟 REEF', octo: '🐙 OCTOPUS', jelly: '🪼 JELLIES', horse: '🌿 SEAHORSE' };
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(names[T.id], cx, T.y1 + 11);
  },

  // ---------- moving things ----------
  drawOutside(r, g) {
    const ctx = r.ctx, W = CFG.AQUARIUM.WORLD, x0 = r.camX - 20, y0 = r.camY - 20, x1 = r.camX + r.viewW + 20, y1 = r.camY + r.viewH + 20;
    ctx.fillStyle = '#0b1a2e';
    if (y0 < W.y0) ctx.fillRect(x0, y0, x1 - x0, W.y0 - y0);
    if (y1 > W.y1) ctx.fillRect(x0, W.y1, x1 - x0, y1 - W.y1);
    if (x0 < W.x0) ctx.fillRect(x0, W.y0, W.x0 - x0, W.y1 - W.y0);
    if (x1 > W.x1) ctx.fillRect(W.x1, W.y0, x1 - W.x1, W.y1 - W.y0);
  },
  mix(a, b, k) {
    const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
    return `rgb(${pa.map((v, i) => Math.round(U.lerp(v, pb[i], k))).join(',')})`;
  },
  drawFish(ctx, f, t) {
    const d = f.dir, s = f.s, wag = Math.sin(t * 9 + f.ph) * 0.35;
    ctx.fillStyle = f.col;
    ctx.beginPath(); ctx.moveTo(f.x - d * s * 0.9, f.y); ctx.lineTo(f.x - d * s * 1.7, f.y - s * 0.7 + wag * s); ctx.lineTo(f.x - d * s * 1.7, f.y + s * 0.7 + wag * s); ctx.closePath(); ctx.fill();   // tail
    ctx.beginPath(); ctx.ellipse(f.x, f.y, s * 1.1, s * 0.65, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(f.x - s * 0.2, f.y - s * 0.6, s * 0.35, s * 1.2);   // a stripe
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(f.x + d * s * 0.55, f.y - s * 0.15, s * 0.22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(f.x + d * s * 0.62, f.y - s * 0.15, s * 0.11, 0, Math.PI * 2); ctx.fill();
    if (f.nom > 0) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(f.x + d * s * 1.1, f.y + s * 0.1, 1.5, 0, Math.PI * 2); ctx.stroke(); }
  },
  drawTurtle(ctx, tu, t) {
    const d = tu.dir, pad = Math.sin(t * 4) * 4;
    ctx.fillStyle = '#5a8f3a';
    for (const [dx, dy] of [[-12, -6], [-12, 6], [10, -7], [10, 7]]) { ctx.beginPath(); ctx.ellipse(tu.x + dx * d, tu.y + dy + (dx < 0 ? pad : -pad) * 0.5, 7, 3.5, dy < 0 ? -0.5 : 0.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.beginPath(); ctx.arc(tu.x + d * 18, tu.y - 1, 5, 0, Math.PI * 2); ctx.fill();   // head
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(tu.x + d * 20, tu.y - 2.5, 1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3f7d2a'; ctx.beginPath(); ctx.ellipse(tu.x, tu.y, 16, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6fae4a'; ctx.beginPath(); ctx.ellipse(tu.x, tu.y, 10, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3f7d2a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(tu.x - 10, tu.y); ctx.lineTo(tu.x + 10, tu.y); ctx.moveTo(tu.x, tu.y - 6); ctx.lineTo(tu.x, tu.y + 6); ctx.stroke();
  },
  drawOctopus(r, g) {
    const ctx = r.ctx, T = CFG.AQUARIUM.TANKS[1], cx = (T.x0 + T.x1) / 2, t = g.time, k = this.octoNear(g);
    const col = this.mix('#c2559a', '#6b7a86', k), y = T.y1 - 30 - (1 - k) * Math.sin(t * 1.5) * 3 + k * 6;
    ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) { const a = -0.4 + i * 0.16 * Math.PI, sx = cx + Math.cos(a + Math.PI / 2) * 6 * (i - 2.5); ctx.beginPath(); ctx.moveTo(sx, y + 6); ctx.quadraticCurveTo(sx + (i - 2.5) * 6, y + 14 + Math.sin(t * 3 + i) * 3 * (1 - k * 0.7), sx + (i - 2.5) * 9, y + 20 - k * 6 + Math.sin(t * 2.5 + i * 1.3) * 2); ctx.stroke(); }
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx, y, 14, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.ellipse(cx - 5, y - 5, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
    // eyes: wide and bright when it is being brave, narrow when it hides
    for (const d of [-1, 1]) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(cx + d * 5, y + 1, 3.2, 3.2 - k * 2, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(cx + d * 5 + (g.player.x < cx ? -1 : 1) * 0.8, y + 1.3, 1.4 - k * 0.6, 0, Math.PI * 2); ctx.fill(); }
    if (k > 0.5) { ctx.fillStyle = 'rgba(255,120,150,0.5)'; ctx.beginPath(); ctx.arc(cx - 8, y + 5, 2.5, 0, Math.PI * 2); ctx.arc(cx + 8, y + 5, 2.5, 0, Math.PI * 2); ctx.fill(); }   // blushing while it hides
  },
  drawJelly(ctx, j, t) {
    const pulse = Math.sin(t * 3 + j.ph), rr = 9 + pulse * 2, y = j.y0 + Math.sin(t * 1.2 + j.ph) * 7 - pulse * 2;
    ctx.strokeStyle = 'rgba(255,170,220,0.8)'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) { const sx = j.x - 6 + i * 4; ctx.beginPath(); ctx.moveTo(sx, y + 2); ctx.quadraticCurveTo(sx + Math.sin(t * 2 + i) * 4, y + 12, sx + Math.sin(t * 2.5 + i * 1.7) * 5, y + 20 + pulse * 3); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,150,210,0.25)'; ctx.beginPath(); ctx.arc(j.x, y, rr + 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,170,220,0.85)'; ctx.beginPath(); ctx.arc(j.x, y, rr, Math.PI, 0); ctx.lineTo(j.x + rr, y + 3); ctx.lineTo(j.x - rr, y + 3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(j.x - 3, y - 4, 3, 2, 0, 0, Math.PI * 2); ctx.fill();
  },
  drawSeahorse(ctx, t) {
    const T = CFG.AQUARIUM.TANKS[3], x = (T.x0 + T.x1) / 2 + 6, y = T.y1 - 34 + Math.sin(t * 1.6) * 4;
    ctx.strokeStyle = '#ffab40'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 8, y + 8, x + 3, y + 18); ctx.quadraticCurveTo(x - 2, y + 26, x + 6, y + 27); ctx.stroke();   // body and curled tail
    ctx.beginPath(); ctx.arc(x + 8, y + 27, 3, 0, Math.PI * 1.5); ctx.stroke();
    ctx.fillStyle = '#ffab40'; ctx.beginPath(); ctx.arc(x, y - 2, 5, 0, Math.PI * 2); ctx.fill();   // head
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 3, y - 1); ctx.lineTo(x - 11, y + 1); ctx.stroke();   // snout
    ctx.fillStyle = '#ffd166'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x + 4 + i * 1.5, y - 4 + i * 5); ctx.lineTo(x + 9 + i * 1.5, y - 3 + i * 5); ctx.lineTo(x + 4 + i * 1.5, y - 1 + i * 5); ctx.closePath(); ctx.fill(); }   // spines
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x - 1.5, y - 3, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,214,102,0.8)'; ctx.beginPath(); ctx.ellipse(x + 7 + Math.sin(t * 12) * 1.5, y + 6, 3, 2, 0.4, 0, Math.PI * 2); ctx.fill();   // the little fin flutters
  },
  drawStarfish(ctx, t, wig) {
    const S = CFG.AQUARIUM.STAR, a0 = wig > 0 ? Math.sin(t * 18) * 0.25 : 0;
    ctx.save(); ctx.translate(S.x, S.y); ctx.rotate(a0);
    ctx.fillStyle = '#ff8a3d'; ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 5 : 13; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr * 0.8); }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffb380'; for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 5; ctx.beginPath(); ctx.arc(Math.cos(a) * 7, Math.sin(a) * 5.5, 1.3, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(-2, -1, 1, 0, Math.PI * 2); ctx.arc(2, -1, 1, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 1, 2, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.restore();
    if (wig > 0) { ctx.fillStyle = '#ff5c8a'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('♥', S.x + 12, S.y - 12 - (CFG.AQUARIUM.PET - wig) * 10); }
  },
  drawCrab(ctx, c, t) {
    const P = CFG.AQUARIUM.POOL, y = P.y + 8, leg = Math.sin(t * 12) * 2;
    ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 1.5; for (const d of [-1, 1]) for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(c.x + d * 4, y + i * 1.5 - 1); ctx.lineTo(c.x + d * (9 + i), y + 3 + i * 1.5 + (i % 2 ? leg : -leg)); ctx.stroke(); }
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.ellipse(c.x, y, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(c.x - 8, y - 3, 2.5, 0, Math.PI * 2); ctx.arc(c.x + 8, y - 3, 2.5, 0, Math.PI * 2); ctx.fill();   // claws
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(c.x - 2, y - 4, 1.3, 0, Math.PI * 2); ctx.arc(c.x + 2, y - 4, 1.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(c.x - 2, y - 4, 0.6, 0, Math.PI * 2); ctx.arc(c.x + 2, y - 4, 0.6, 0, Math.PI * 2); ctx.fill();
  },
  drawPenguin(ctx, pg, t) {
    const d = pg.dir;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(pg.x, pg.y + 3, pg.mode === 'slide' ? 14 : 9, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(pg.x, pg.y);
    if (pg.mode === 'slide') {
      // on its belly, head first, flippers out
      ctx.rotate(d * (Math.PI / 2) + Math.sin(pg.bob) * 0.05); ctx.translate(0, 6);
      ctx.fillStyle = '#263238'; ctx.beginPath(); ctx.ellipse(0, -12, 9, 14, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(0, -10, 6, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#263238'; ctx.beginPath(); ctx.ellipse(-11, -10, 3, 7, -0.4, 0, Math.PI * 2); ctx.ellipse(11, -10, 3, 7, 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(0, -27, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffab40'; ctx.beginPath(); ctx.moveTo(-3, -31); ctx.lineTo(3, -31); ctx.lineTo(0, -37); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.ellipse(-4, 3, 4, 2, 0, 0, Math.PI * 2); ctx.ellipse(4, 3, 4, 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-3, -28, 2, 0, Math.PI * 2); ctx.arc(3, -28, 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(-3, -28, 1, 0, Math.PI * 2); ctx.arc(3, -28, 1, 0, Math.PI * 2); ctx.fill();
    } else {
      const rock = Math.sin(pg.bob) * 0.12, step = Math.sin(pg.bob) * 2;
      ctx.rotate(rock);
      ctx.fillStyle = '#ffab40'; ctx.beginPath(); ctx.ellipse(-4, 2 + step, 4.5, 2, 0, 0, Math.PI * 2); ctx.ellipse(4, 2 - step, 4.5, 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#263238'; ctx.beginPath(); ctx.ellipse(0, -11, 9, 13, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(d * 1, -9, 6, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#263238'; ctx.beginPath(); ctx.ellipse(-9, -10, 2.5, 7, 0.25, 0, Math.PI * 2); ctx.ellipse(9, -10, 2.5, 7, -0.25, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(0, -24, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(d * 2 - 3, -25, 2.2, 0, Math.PI * 2); ctx.arc(d * 2 + 3, -25, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(d * 2.6 - 3, -25, 1.1, 0, Math.PI * 2); ctx.arc(d * 2.6 + 3, -25, 1.1, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffab40'; ctx.beginPath(); ctx.moveTo(d * 4, -23); ctx.lineTo(d * 11, -21); ctx.lineTo(d * 4, -19); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  },
  drawDiver(r, g) {
    const ctx = r.ctx, dv = this.st.diver, t = g.time, f = dv.facing, bob = dv.moving ? Math.sin(dv.bob) * 2 : 0, x = dv.x, y = dv.y - (dv.wave > 0 ? Math.abs(Math.sin(t * 7)) * 3 : 0);   // a happy hop while waving
    r.drawPerson(x, y, { shirt: '#1b4f72', skin: '#e0ac69', hat: 'cap', capColor: '#1b4f72', facing: f, moving: dv.moving, bob: dv.bob, carry: 0, pants: '#1b4f72', belt: true });
    // flippers over the shoes, a mask over the eyes, a snorkel and an air tank on the back
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.ellipse(x - 6 + f * 3, y + 5, 8, 2.5, 0, 0, Math.PI * 2); ctx.ellipse(x + 6 + f * 3, y + 5, 8, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd166'; U.roundRect(ctx, x - 6 - f * 12, y - 32 + bob, 8, 22, 4); ctx.fill(); ctx.fillStyle = '#9aa0a8'; ctx.fillRect(x - 3 - f * 12, y - 35 + bob, 2, 4);
    ctx.fillStyle = 'rgba(154,208,255,0.75)'; U.roundRect(ctx, x - 9, y - 43 + bob, 18, 9, 4); ctx.fill(); ctx.strokeStyle = '#263238'; ctx.lineWidth = 1.5; U.roundRect(ctx, x - 9, y - 43 + bob, 18, 9, 4); ctx.stroke();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x + f * 3 - 3, y - 38.5 + bob, 1.2, 0, Math.PI * 2); ctx.arc(x + f * 3 + 3, y - 38.5 + bob, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ff7043'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + f * 9, y - 40 + bob); ctx.lineTo(x + f * 13, y - 40 + bob); ctx.lineTo(x + f * 13, y - 54 + bob); ctx.stroke();
    if (dv.wave > 0) { ctx.save(); ctx.translate(x + f * 24, y - 50 + bob); ctx.rotate(Math.sin(t * 10) * 0.3); ctx.font = r.font(15); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText('👋', 0, 0); ctx.restore(); }   // waving: a 👋 by the mask, no arm reaching up
  },
  drawPlush(r, g) {
    const ctx = r.ctx, p = g.player, f = p.facing || 1, x = p.x + f * 17, y = p.y - 20 + (p.moving ? Math.sin(p.bob || 0) * 2 : 0), t = g.time, wag = Math.sin(t * 6) * 2;
    ctx.fillStyle = '#ff7043'; ctx.beginPath(); ctx.moveTo(x - f * 7, y); ctx.lineTo(x - f * 13, y - 5 + wag); ctx.lineTo(x - f * 13, y + 5 + wag); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x, y, 9, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(x - 2, y - 6, 3, 12); ctx.fillRect(x + f * 4 - 1, y - 5, 2.5, 10);
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x + f * 5, y - 1.5, 1.3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(43,29,20,0.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, y, 9, 6, 0, 0, Math.PI * 2); ctx.stroke();
  },
  dynamic(r, g) {
    if (!this.st) return;
    const ctx = r.ctx, t = g.time, st = this.st, A = CFG.AQUARIUM;
    if (g.area === 'city' && !(typeof CityExt !== 'undefined' && CityExt.floor)) {
      // bubbles drift up the facade beside the door
      const b = this.bld(), cx = (b.x0 + b.x1) / 2, gy = b.y1 - 40;
      for (let i = 0; i < 4; i++) { const k = (t * 0.35 + i * 0.25) % 1; ctx.strokeStyle = `rgba(255,255,255,${(0.8 * (1 - k)).toFixed(2)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx - 40 + Math.sin(k * 7 + i) * 5, gy + 30 - k * 60, 2 + k * 3, 0, Math.PI * 2); ctx.stroke(); }
      return;
    }
    if (g.area !== 'aquarium') return;
    this.drawOutside(r, g);
    // drifting caustic light on the floor
    const R = A.ROOM;
    ctx.save(); ctx.beginPath(); ctx.rect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0); ctx.clip();
    ctx.fillStyle = 'rgba(120,200,255,0.06)';
    for (let i = 0; i < 9; i++) { const x = R.x0 + ((i * 97 + t * 12) % (R.x1 - R.x0)), y = R.y0 + ((i * 61 + Math.sin(t * 0.5 + i) * 30 + 300) % (R.y1 - R.y0)); ctx.beginPath(); ctx.ellipse(x, y, 28 + Math.sin(t + i) * 8, 12, 0.3, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    // the tanks: fish, the turtle, the octopus, jellies, the seahorse, flakes and bubbles (the tunnel's live in overlay)
    for (const f of st.fish) if (f.tank !== A.TUNNEL) this.drawFish(ctx, f, t);
    this.drawTurtle(ctx, st.turtle, t);
    this.drawOctopus(r, g);
    for (const j of st.jellies) this.drawJelly(ctx, j, t);
    this.drawSeahorse(ctx, t);
    for (const fl of st.flakes) if (fl.tank !== A.TUNNEL) { ctx.fillStyle = fl.col; ctx.fillRect(fl.x - 1.5, fl.y - 1, 3, 2); }
    for (const b of st.bubbles) if (b.tank !== A.TUNNEL) { ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(b.x + Math.sin(b.t * 5) * 1.5, b.y, b.r, 0, Math.PI * 2); ctx.stroke(); }
    // the tank windows glow a little
    for (const T of A.TANKS) { const gl = ctx.createLinearGradient(0, T.y1, 0, T.y1 + 40); gl.addColorStop(0, `rgba(77,208,225,${(0.10 + Math.sin(t * 1.3 + T.x0) * 0.04).toFixed(3)})`); gl.addColorStop(1, 'rgba(77,208,225,0)'); ctx.fillStyle = gl; ctx.fillRect(T.x0, T.y1 + 5, T.x1 - T.x0, 40); }
    // the touch pool's ripples, starfish and crab
    const P = A.POOL;
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1; for (let i = 0; i < 2; i++) { const k = (t * 0.4 + i * 0.5) % 1; ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.ellipse(P.x, P.y, 8 + k * 30, 4 + k * 15, 0, 0, Math.PI * 2); ctx.stroke(); } ctx.globalAlpha = 1;
    this.drawStarfish(ctx, t, st.star);
    this.drawCrab(ctx, st.crab, t);
    // the shells on the shelf
    const S = A.SHELF, n = Math.min(g.s.aquarium.shells, 8), scols = ['#ff8fab', '#ffd166', '#fff', '#b388ff', '#4dd0e1', '#ff7043', '#9ccc65', '#ffab40'];
    for (let i = 0; i < n; i++) { const x = S.x0 + 12 + i * 14, y = S.y0 + 8; ctx.fillStyle = scols[i]; ctx.beginPath(); ctx.moveTo(x, y + 3); ctx.arc(x, y - 1, 5.5, Math.PI * 0.15, Math.PI * 0.85, true); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(43,29,20,0.35)'; ctx.lineWidth = 1; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(x, y + 3); ctx.lineTo(x + k * 3.5, y - 5); ctx.stroke(); } }
    // ice spray behind the sliding penguins and the diver's bubbles
    for (const sp of st.spray) { const k = sp.t / 0.5; if (sp.bubble) { ctx.strokeStyle = `rgba(255,255,255,${(0.8 * (1 - k)).toFixed(2)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(sp.x + Math.sin(sp.t * 8) * 2, sp.y - k * 24, 2 + k * 2, 0, Math.PI * 2); ctx.stroke(); } else { ctx.fillStyle = `rgba(255,255,255,${(0.8 * (1 - k)).toFixed(2)})`; ctx.beginPath(); ctx.arc(sp.x, sp.y - k * 10, 2, 0, Math.PI * 2); ctx.fill(); } }
  },
  entities(r, g, items) {
    if (!this.st) return;
    const st = this.st, p = g.player;
    if (st.plush > 0 && !g.driving && !g.onTrain) items.push({ y: p.y + 1, draw: () => this.drawPlush(r, g) });
    if (g.area !== 'aquarium') return;
    for (const pg of st.penguins) items.push({ y: pg.y, draw: () => this.drawPenguin(r.ctx, pg, g.time) });
    items.push({ y: st.diver.y, draw: () => this.drawDiver(r, g) });
  },
  overlay(r, g) {
    if (!this.st || g.area !== 'aquarium') return;
    const ctx = r.ctx, st = this.st, T = CFG.AQUARIUM.TUNNEL, t = g.time;
    // the water over the tunnel: a glass arch the chef walks under, fish swimming across above the chef
    const gl = ctx.createLinearGradient(0, T.y0, 0, T.y1); gl.addColorStop(0, 'rgba(31,162,214,0.45)'); gl.addColorStop(0.5, 'rgba(31,162,214,0.22)'); gl.addColorStop(1, 'rgba(31,162,214,0.45)');
    ctx.fillStyle = gl; ctx.fillRect(T.x0, T.y0 - 6, T.x1 - T.x0, T.y1 - T.y0 + 12);
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1.5;
    for (let k = 0; k < 3; k++) { ctx.beginPath(); for (let x = T.x0; x <= T.x1; x += 6) { const y = T.y0 + 12 + k * 20 + Math.sin(x / 14 + t * 1.5 + k * 2) * 3; if (x === T.x0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke(); }
    for (const f of st.fish) if (f.tank === T) this.drawFish(ctx, f, t);
    for (const fl of st.flakes) if (fl.tank === T) { ctx.fillStyle = fl.col; ctx.fillRect(fl.x - 1.5, fl.y - 1, 3, 2); }
    for (const b of st.bubbles) if (b.tank === T) { ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(b.x + Math.sin(b.t * 5) * 1.5, b.y, b.r, 0, Math.PI * 2); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(T.x0, T.y0 - 6, T.x1 - T.x0, 2); ctx.fillRect(T.x0, T.y1 + 4, T.x1 - T.x0, 2);   // the glass rims catch the light
  },
  screen(r, g) {
    if (!this.st || this.st.fade <= 0) return;
    const ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    ctx.fillStyle = `rgba(6,14,30,${(this.st.fade / 0.45).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
  },
};
Game.ext.unshift(AquariumExt);   // first in line so the door's button and hint beat the City's taxis and coins
Render.ext.push(AquariumExt);
