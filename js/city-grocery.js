'use strict';
// The grocery: City building 20 (lower row, facing Harbour Street) gets a '🥕 GROCERY' sign and crates of fruit on the
// sidewalk by the door. Step inside for a bright little shop: aisles of crates (apples, bananas, carrots, tomatoes,
// watermelons), a shopping basket to pick up (walk over the crates to fill it, up to five things), a checkout where the
// cashier scans the basket (beep beep, "Thank you!", nothing is charged: shopping is pretend), a chest freezer that
// makes the chef's breath frosty, a bakery corner with warm bread, a scale that weighs a watermelon, a shop cat asleep on
// a crate, a free-sample stand with cheese cubes, a $4 bag of grapes tied to a balloon and a $6 plush carrot.
// Extension module: registered with Game.ext (first, so its door beats the City's taxis) and Render.ext (see js/EXTENSIONS.md).
CFG.GROCERY = {
  BUILDING: 20,                                  // index in CFG.CITY.BUILDINGS: { x0: 6072, y0: 600, x1: 6190, y1: 876 }
  DOOR_OUT: { x: 6131, y: 890 },                 // on the Harbour Street sidewalk just below the door
  WORLD: { x0: 16700, y0: 3000, x1: 17300, y1: 3400 },
  ROOM: { x0: 16740, y0: 3100, x1: 17260, y1: 3340 }, WALL: 24, BACK_TOP: 3016,   // the back wall is tall: shelves and the freezer stand against it
  BAKERY: { x0: 16760, y0: 3100, x1: 16890, y1: 3124 }, BAKERY_SPOT: { x: 16822, y: 3146 }, LAMP: { x: 16868, y: 3034 },
  CHECKOUT: { x0: 16920, y0: 3100, x1: 17080, y1: 3130 }, CHECKOUT_SPOT: { x: 17000, y: 3158 },
  CASHIER: { x: 17010, y: 3094 }, SCANNER: { x: 16958, y: 3106 }, TILL: { x: 17056, y: 3104 },
  FREEZER: { x0: 17120, y0: 3100, x1: 17240, y1: 3132 }, FREEZER_SPOT: { x: 17180, y: 3152 },
  CRATES: [                                      // low bins on the floor: the chef walks over them
    { x: 16870, y: 3178, kind: 'apple' }, { x: 16930, y: 3178, kind: 'banana' }, { x: 16990, y: 3178, kind: 'carrot' }, { x: 17050, y: 3178, kind: 'tomato' }, { x: 17110, y: 3178, kind: 'melon' },
    { x: 16900, y: 3254, kind: 'tomato' }, { x: 16960, y: 3254, kind: 'apple' }, { x: 17020, y: 3254, kind: 'carrot' },
  ],
  CAT_CRATE: { x: 17096, y: 3254 },              // a taller crate the cat sleeps on (solid)
  SCALE: { x: 16790, y: 3192 },                  // the scale on its little table (solid)
  SAMPLES: { x: 16790, y: 3274 },                // the free-sample table (solid)
  BASKETS: { x: 17214, y: 3186 },                // the rack of baskets (solid)
  PADS: { grapes: { x: 17150, y: 3300 }, carrot: { x: 17222, y: 3300 } },
  PLANT: { x: 16760, y: 3318 },
  EXIT: { x: 17000, y: 3322 },                   // the mat inside the door (the door is in the bottom wall)
  MAX_ITEMS: 5, SCAN_EVERY: 0.45, GRAPES: 30, CARROT: 45, WEIGH: 3,   // basket size; seconds between beeps, the grapes, the plush carrot, the scale's wobble
};
CFG.AREAS.grocery = { WORLD: CFG.GROCERY.WORLD };

const GroceryExt = {
  name: 'grocery',
  st: null,
  defaults: { grocery: { seen: false, checkouts: 0, samples: 0, grapes: 0, carrots: 0, weighed: 0 } },
  ITEMS: { apple: { col: '#e53935', ico: '🍎' }, banana: { col: '#ffd54f', ico: '🍌' }, carrot: { col: '#ff8a3d', ico: '🥕' }, tomato: { col: '#ef5350', ico: '🍅' }, melon: { col: '#43a047', ico: '🍉' } },

  // ---------- state ----------
  build(g) {
    const G = CFG.GROCERY;
    if (!g.s.grocery) g.s.grocery = { seen: false, checkouts: 0, samples: 0, grapes: 0, carrots: 0, weighed: 0 };
    this.st = {
      fade: 0,
      basket: false, items: [],                                     // carrying a basket; the kinds inside it (newest last)
      over: CFG.GROCERY.CRATES.map(() => false),                    // which crates the chef is standing on right now
      scan: null,                                                   // { t, flying: [{ kind, t }] } while the cashier scans
      grapes: 0, carrot: 0,                                         // seconds left carrying them
      weigh: 0,                                                     // seconds left of the scale's wobble
      sample: 0,                                                    // cooldown after a cheese cube
      cold: false, warm: false, puffs: [], puffT: 0,                // near the freezer / the bakery; frosty breath puffs
      cat: { tail: 0, z: [], zt: 0 },
      cashier: { wave: 0 },
      obs: null,
    };
    const R = G.ROOM, w = G.WALL, o = [];
    o.push({ x: R.x0 - w, y: R.y0 - w, w: R.x1 - R.x0 + 2 * w, h: w }, { x: R.x0 - w, y: R.y1, w: R.x1 - R.x0 + 2 * w, h: w });
    o.push({ x: R.x0 - w, y: R.y0, w, h: R.y1 - R.y0 }, { x: R.x1, y: R.y0, w, h: R.y1 - R.y0 });
    for (const k of ['BAKERY', 'CHECKOUT', 'FREEZER']) o.push({ x: G[k].x0, y: R.y0, w: G[k].x1 - G[k].x0, h: G[k].y1 - R.y0 });
    o.push({ x: G.CAT_CRATE.x - 20, y: G.CAT_CRATE.y - 14, w: 40, h: 30 });
    o.push({ x: G.SCALE.x - 20, y: G.SCALE.y - 14, w: 40, h: 28 });
    o.push({ x: G.SAMPLES.x - 18, y: G.SAMPLES.y - 12, w: 36, h: 26 });
    o.push({ x: G.BASKETS.x - 18, y: G.BASKETS.y - 12, w: 36, h: 26 });
    o.push({ x: G.PLANT.x - 14, y: G.PLANT.y - 14, w: 28, h: 26 });
    this.st.obs = o;
  },
  obstacles(g) { return g.area === 'grocery' && this.st ? this.st.obs : []; },
  free(x, y) {
    const R = CFG.GROCERY.ROOM, r = 12;
    if (x < R.x0 + r || x > R.x1 - r || y < R.y0 + r || y > R.y1 - r) return false;
    for (const o of this.st.obs) if (x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h) return false;
    return true;
  },
  onFoot(g) { return !g.driving && !g.onTrain && !g.ride && !g.travel && !g.fishing; },
  cityBusy() { return typeof CityExt !== 'undefined' && !!(CityExt.floor || (CityExt.st && (CityExt.st.cab || CityExt.st.boarding))); },
  atDoor(g) { const D = CFG.GROCERY.DOOR_OUT, p = g.player; return g.area === 'city' && this.onFoot(g) && !this.cityBusy() && U.dist(p.x, p.y, D.x, D.y) < 30; },
  near(g, s, d) { return U.dist(g.player.x, g.player.y, s.x, s.y) < d; },
  crateRect(c) { return { x: c.x - 22, y: c.y - 14, w: 44, h: 28 }; },

  // ---------- game hooks ----------
  action(g) {
    if (!this.st) this.build(g);
    const G = CFG.GROCERY, st = this.st;
    if (this.atDoor(g)) return { label: '🚪 Go inside', run: (gg) => this.enter(gg) };
    if (g.area !== 'grocery') return null;
    if (st.scan) return null;
    if (this.near(g, G.EXIT, 30)) return { label: '🚪 Go outside', run: (gg) => this.leave(gg) };
    if (st.basket && st.items.length && this.near(g, G.CHECKOUT_SPOT, 40)) return { label: '🛒 Check out', run: (gg) => this.checkout(gg) };
    if (this.near(g, G.BASKETS, 44)) return st.basket ? { label: '🧺 Put the basket back', run: (gg) => this.dropBasket(gg) } : { label: '🧺 Take a basket', run: (gg) => this.takeBasket(gg) };
    if (this.near(g, G.SCALE, 44) && st.weigh <= 0) return { label: '⚖️ Weigh a watermelon', run: (gg) => this.weigh(gg) };
    if (this.near(g, G.SAMPLES, 44) && st.sample <= 0) return { label: '🧀 Try a free sample', run: (gg) => this.sample(gg) };
    if (this.near(g, G.CAT_CRATE, 46)) return { label: '🐱 Pet the cat', run: (gg) => this.petCat(gg) };
    return null;
  },
  enter(g) {
    const G = CFG.GROCERY, p = g.player;
    g.area = 'grocery'; p.x = G.EXIT.x; p.y = G.EXIT.y - 8; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.st.fade = 0.45; Sfx.ding(); Haptics.tap();
    if (!g.s.grocery.seen) { g.s.grocery.seen = true; g.toast('🥕 Welcome to the grocery!', true); }
  },
  leave(g) {
    const G = CFG.GROCERY, p = g.player;
    g.area = 'city'; p.x = G.DOOR_OUT.x; p.y = G.DOOR_OUT.y; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.st.basket = false; this.st.items = []; this.st.scan = null; this.st.fade = 0.45; Sfx.drop();
  },
  takeBasket(g) {
    const st = this.st; st.basket = true; st.items = []; Sfx.pickup(); Haptics.tap();
    g.floats.push({ x: g.player.x, y: g.player.y - 60, text: 'Fill it up! 🧺', color: '#ffe08a', t: 0, dur: 1.4, big: true });
  },
  dropBasket(g) { this.st.basket = false; this.st.items = []; Sfx.drop(); },
  collect(g, i) {
    const st = this.st, c = CFG.GROCERY.CRATES[i], p = g.player;
    st.items.push(c.kind); Sfx.pickup(); Haptics.tap();
    g.floats.push({ x: p.x, y: p.y - 60, text: this.ITEMS[c.kind].ico, color: '#fff', t: 0, dur: 0.9, big: true });
    if (st.items.length >= CFG.GROCERY.MAX_ITEMS) g.floats.push({ x: p.x, y: p.y - 84, text: 'Basket full! 🛒', color: '#ffe08a', t: 0, dur: 1.5, big: true });
  },
  checkout(g) {
    const st = this.st, S = CFG.GROCERY.CHECKOUT_SPOT, p = g.player;
    if (!st.basket || !st.items.length) return;
    st.scan = { t: 0, flying: [] };
    p.x = S.x; p.y = S.y; p.moving = false; p.facing = 1;
    Haptics.tap();
  },
  weigh(g) {
    const st = this.st, S = CFG.GROCERY.SCALE;
    st.weigh = CFG.GROCERY.WEIGH; g.s.grocery.weighed++; Sfx.drop(); Haptics.tap();
    g.floats.push({ x: S.x, y: S.y - 64, text: 'Heavy! 🍉', color: '#ffe08a', t: 0, dur: 1.6, big: true });
  },
  sample(g) {
    const st = this.st, p = g.player;
    st.sample = 1.6; g.s.grocery.samples++; Sfx.pickup(); Haptics.tap();
    g.floats.push({ x: p.x, y: p.y - 62, text: 'Mmm, cheese! 🧀', color: '#ffe08a', t: 0, dur: 1.6, big: true });
  },
  petCat(g) {
    const C = CFG.GROCERY.CAT_CRATE, st = this.st;
    st.cat.tail = 2.5; Sfx.pickup(); Haptics.tap();
    g.floats.push({ x: C.x, y: C.y - 54, text: 'Purrr 🐱', color: '#ffe08a', t: 0, dur: 1.4, big: true });
  },
  home(g) { if (!this.st) return; const st = this.st; st.basket = false; st.items = []; st.scan = null; st.fade = 0; st.puffs = []; st.cold = false; st.warm = false; },
  // a save or a push that left the chef in a wall or inside the furniture goes back onto the door mat
  rescue(g) {
    const p = g.player, G = CFG.GROCERY;
    if (this.free(p.x, p.y)) return false;
    p.x = G.EXIT.x; p.y = G.EXIT.y - 8; p.moving = false;
    g.floats.push({ x: p.x, y: p.y - 50, text: 'Oops! Back inside', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    return true;
  },
  update(g, dt) {
    if (!this.st) this.build(g);
    const st = this.st, p = g.player, G = CFG.GROCERY;
    st.fade = Math.max(0, st.fade - dt);
    st.grapes = Math.max(0, st.grapes - dt); st.carrot = Math.max(0, st.carrot - dt);
    for (const f of st.puffs) f.t += dt;
    st.puffs = st.puffs.filter((f) => f.t < 1.2);
    if (g.area !== 'grocery') { if (st.basket) { st.basket = false; st.items = []; } st.scan = null; st.cold = false; st.warm = false; return; }
    st.weigh = Math.max(0, st.weigh - dt); st.sample = Math.max(0, st.sample - dt);
    st.cashier.wave = Math.max(0, st.cashier.wave - dt);
    if (st.scan) {
      // scanning: the chef waits at the counter while the cashier beeps the things through one by one
      const s = st.scan, S = G.CHECKOUT_SPOT; s.t += dt;
      p.x = S.x; p.y = S.y; p.moving = false;
      for (const f of s.flying) f.t += dt;
      s.flying = s.flying.filter((f) => f.t < 0.6);
      if (s.t >= G.SCAN_EVERY) {
        s.t = 0;
        if (st.items.length) {
          const kind = st.items.shift();
          s.flying.push({ kind, t: 0 });
          Sfx.tone(1320, 0.07, 'square', 0.035);
          g.floats.push({ x: G.SCANNER.x, y: G.SCANNER.y - 26, text: 'beep!', color: '#8ef0a0', t: 0, dur: 0.6, big: false });
        } else if (!s.flying.length) {
          st.scan = null; st.cashier.wave = 1.6; g.s.grocery.checkouts++;
          g.floats.push({ x: G.CASHIER.x, y: G.CASHIER.y - 66, text: 'Thank you! 🛒', color: '#ffe08a', t: 0, dur: 1.8, big: true });
          for (let i = 0; i < 4; i++) g.fx.push({ kind: 'sparkle', x0: G.TILL.x + U.rand(-14, 14), y0: G.TILL.y - 10 + U.rand(-8, 8), x1: 0, y1: 0, t: -i * 0.08, dur: 0.6 });
          Sfx.ding(); Haptics.success();
        }
      }
    } else {
      this.rescue(g);
      // walking over a crate with the basket drops one of its things in
      for (let i = 0; i < G.CRATES.length; i++) {
        const on = g.hitRect(p.x, p.y, 4, this.crateRect(G.CRATES[i]));
        if (on && !st.over[i] && st.basket && st.items.length < G.MAX_ITEMS) this.collect(g, i);
        st.over[i] = on;
      }
    }
    // the freezer: frosty breath while standing next to it; the bakery: a warm hello
    const cold = this.near(g, G.FREEZER_SPOT, 56), warm = this.near(g, G.BAKERY_SPOT, 56);
    if (cold && !st.cold) g.floats.push({ x: p.x, y: p.y - 62, text: 'Brrr! ❄️', color: '#bfe3ff', t: 0, dur: 1.4, big: true });
    if (warm && !st.warm) g.floats.push({ x: p.x, y: p.y - 62, text: 'Warm bread! 🍞', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    st.cold = cold; st.warm = warm;
    if (cold) { st.puffT -= dt; if (st.puffT <= 0) { st.puffT = 0.45; const f = p.facing || 1; st.puffs.push({ x: p.x + f * 8, y: p.y - 34, dx: f * 14, t: 0 }); } }
    // the cat's tail swishes and it snores
    st.cat.tail = Math.max(0, st.cat.tail - dt);
    for (const z of st.cat.z) z.t += dt;
    st.cat.z = st.cat.z.filter((z) => z.t < 2);
    st.cat.zt -= dt; if (st.cat.zt <= 0) { st.cat.zt = 1.4; st.cat.z.push({ t: 0 }); }
  },
  pads(g) {
    if (g.area !== 'grocery') return [];
    const P = CFG.GROCERY.PADS;
    return [
      { key: 'groceryGrapes', label: 'Grapes', ico: '🍇', pos: P.grapes, price: 4, sub: 'with a balloon!' },
      { key: 'groceryCarrot', label: 'Plush carrot', ico: '🥕', pos: P.carrot, price: 6, sub: 'so soft!' },
    ];
  },
  onPad(g, pad) {
    const p = g.player, G = CFG.GROCERY;
    if (pad.key === 'groceryGrapes') { this.st.grapes = G.GRAPES; g.s.grocery.grapes++; g.floats.push({ x: p.x, y: p.y - 60, text: 'Grapes! 🍇🎈', color: '#ffe08a', t: 0, dur: 1.5, big: true }); Haptics.success(); }
    if (pad.key === 'groceryCarrot') { this.st.carrot = G.CARROT; g.s.grocery.carrots++; g.floats.push({ x: p.x, y: p.y - 60, text: 'A plush carrot! 🥕', color: '#ffe08a', t: 0, dur: 1.5, big: true }); Haptics.success(); }
  },
  hint(g) {
    if (!this.st) return undefined;
    const p = g.player, G = CFG.GROCERY, st = this.st, s = g.s.grocery;
    if (g.area === 'city') {
      if (!this.onFoot(g) || this.cityBusy()) return undefined;
      const d = U.dist(p.x, p.y, G.DOOR_OUT.x, G.DOOR_OUT.y);
      if (d < 70) return { text: 'Shop at the grocery! 🥕', target: d < 30 ? null : G.DOOR_OUT };
      return undefined;
    }
    if (g.area !== 'grocery') return undefined;
    if (st.scan) return { text: 'Beep beep! 🛒', target: null };
    if (!st.basket && !s.checkouts) return { text: 'Grab a shopping basket! 🧺', target: G.BASKETS };
    if (st.basket && !st.items.length && !s.checkouts) return { text: 'Walk over the crates to fill your basket! 🍎', target: G.CRATES[0] };
    if (st.basket && st.items.length) return { text: st.items.length < G.MAX_ITEMS ? 'Fill up, then bring it to the checkout! 🛒' : 'Bring your basket to the checkout! 🛒', target: G.CHECKOUT_SPOT };
    if (!s.samples) return { text: 'Try a free sample! 🧀', target: G.SAMPLES };
    if (!s.grapes && g.s.cash + (g.s.padPaid.groceryGrapes || 0) >= 4) return { text: 'Buy some grapes! 🍇', target: G.PADS.grapes };
    if (st.grapes > 0) return { text: 'Grapes on a balloon! 🍇🎈', target: null };
    if (!s.weighed) return { text: 'Weigh a watermelon! ⚖️', target: G.SCALE };
    return { text: 'Happy shopping! 🥕', target: null };
  },

  // ---------- the City outside: the sign and the fruit crates by the door (static) ----------
  bld() { return CFG.CITY.BUILDINGS[CFG.GROCERY.BUILDING]; },
  paintAfter(r, g, area) {
    if (area !== 'city') return;
    const ctx = r.ctx, b = this.bld(), cx = (b.x0 + b.x1) / 2, gy = b.y1 - 40, sign = '🥕 GROCERY';
    ctx.font = r.font(10); const tw = ctx.measureText(sign).width + 18;
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, cx - tw / 2, gy - 22, tw, 18, 4); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(sign, cx, gy - 13);
    // crates of apples and oranges on the sidewalk either side of the door, clear of the door spot
    const D = CFG.GROCERY.DOOR_OUT;
    for (const [dx, col, col2] of [[-36, '#e53935', '#ff8a80'], [36, '#ff9800', '#ffcc80']]) {
      const x = D.x + dx, y = D.y - 2;
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x - 12, y - 4, 26, 12);
      ctx.fillStyle = '#b5773a'; ctx.fillRect(x - 13, y - 7, 26, 13); ctx.fillStyle = '#8d5a2b'; ctx.fillRect(x - 13, y - 7, 26, 2); ctx.fillRect(x - 13, y - 1, 26, 1.5);
      for (let i = 0; i < 5; i++) { ctx.fillStyle = i % 2 ? col2 : col; ctx.beginPath(); ctx.arc(x - 9 + i * 4.5, y - 9 + (i % 2) * 2, 3, 0, Math.PI * 2); ctx.fill(); }
    }
    // a little chalkboard "FRESH!" by the window
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, b.x0 + 12, D.y - 16, 22, 18, 2); ctx.fill(); ctx.fillStyle = '#2f4f3a'; ctx.fillRect(b.x0 + 14, D.y - 14, 18, 14);
    ctx.fillStyle = '#fff8ee'; ctx.font = r.font(6); ctx.fillText('FRESH!', b.x0 + 23, D.y - 7);
  },

  // ---------- the interior, static ----------
  paint: { grocery(r, g) { GroceryExt.paintRoom(r, g); } },
  paintRoom(r, g) {
    const ctx = r.ctx, G = CFG.GROCERY, W = G.WORLD, R = G.ROOM, w = G.WALL;
    // outside the shop: dark slate with a faint tile pattern
    ctx.fillStyle = '#3a4a5c'; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.04)'; for (let y = W.y0; y < W.y1; y += 40) for (let x = W.x0 + ((y / 40) % 2) * 20; x < W.x1; x += 40) ctx.fillRect(x, y, 38, 38);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(R.x0 - w + 8, G.BACK_TOP + 10, R.x1 - R.x0 + 2 * w, R.y1 + w - G.BACK_TOP);
    // floor: cream and mint checker tiles
    const ts = 24;
    for (let y = R.y0, j = 0; y < R.y1; y += ts, j++) for (let x = R.x0, i = 0; x < R.x1; x += ts, i++) { ctx.fillStyle = (i + j) % 2 ? '#dcedc8' : '#fbf6e9'; ctx.fillRect(x, y, Math.min(ts, R.x1 - x), Math.min(ts, R.y1 - y)); }
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; for (let y = R.y0; y < R.y1; y += ts) for (let x = R.x0; x < R.x1; x += ts) ctx.fillRect(x + 2, y + 2, 6, 2);
    // walls: a tall cream back wall with a green band, wooden side and bottom walls
    ctx.fillStyle = '#fff4d6'; ctx.fillRect(R.x0 - w, G.BACK_TOP, R.x1 - R.x0 + 2 * w, R.y0 - G.BACK_TOP);
    ctx.fillStyle = '#7cb342'; ctx.fillRect(R.x0 - w, G.BACK_TOP, R.x1 - R.x0 + 2 * w, 8); ctx.fillStyle = '#ffd166'; ctx.fillRect(R.x0 - w, G.BACK_TOP + 8, R.x1 - R.x0 + 2 * w, 3);
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(R.x0 - w, R.y0 - 6, R.x1 - R.x0 + 2 * w, 6);
    ctx.fillStyle = '#b5773a'; ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, w); ctx.fillRect(R.x0 - w, R.y0, w, R.y1 - R.y0); ctx.fillRect(R.x1, R.y0, w, R.y1 - R.y0);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = R.x0 - w; x < R.x1 + w; x += 16) ctx.fillRect(x, R.y1, 2, w); for (let y = R.y0; y < R.y1; y += 16) { ctx.fillRect(R.x0 - w, y, w, 2); ctx.fillRect(R.x1, y, w, 2); }
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, 3); ctx.fillRect(R.x0 - w, R.y0, 3, R.y1 - R.y0); ctx.fillRect(R.x1 + w - 3, R.y0, 3, R.y1 - R.y0);
    // the shop's name over the checkout
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, 17000 - 58, G.BACK_TOP + 18, 116, 20, 5); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🥕 GROCERY', 17000, G.BACK_TOP + 28);
    this.paintBakery(r, g); this.paintCheckout(r, g); this.paintFreezer(r, g);
    for (const c of G.CRATES) this.paintCrate(r, c.x, c.y, c.kind);
    this.paintCatCrate(r, g); this.paintScale(r, g); this.paintSamples(r, g); this.paintBaskets(r, g);
    // a potted plant in the corner by the door
    const P = G.PLANT;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(P.x + 2, P.y + 12, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b86f2d'; U.roundRect(ctx, P.x - 11, P.y - 4, 22, 16, 4); ctx.fill(); ctx.fillStyle = '#8d5a2b'; ctx.fillRect(P.x - 12, P.y - 6, 24, 4);
    ctx.fillStyle = '#3f9a4a'; ctx.beginPath(); ctx.arc(P.x, P.y - 14, 12, 0, Math.PI * 2); ctx.arc(P.x - 10, P.y - 8, 8, 0, Math.PI * 2); ctx.arc(P.x + 10, P.y - 8, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#56b862'; ctx.beginPath(); ctx.arc(P.x - 3, P.y - 18, 5, 0, Math.PI * 2); ctx.fill();
    // the door in the bottom wall, its mat, and the shop's name plate below
    const E = G.EXIT;
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(E.x - 22, R.y1, 44, w); ctx.fillStyle = '#bfe3ff'; ctx.fillRect(E.x - 16, R.y1 + 4, 32, 10); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(E.x + 14, R.y1 + 17, 2.5, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 3; i++) { ctx.fillStyle = ['#7cb342', '#fff8ee', '#ff8a3d'][i]; ctx.fillRect(E.x - 21 + i * 14, E.y - 8, 14, 14); }
    ctx.strokeStyle = 'rgba(43,29,20,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(E.x - 21, E.y - 8, 42, 14);
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('EXIT', E.x, E.y - 1);
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, (R.x0 + R.x1) / 2 - 50, R.y1 + w + 4, 100, 14, 4); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.fillText('🥕 GROCERY 🥕', (R.x0 + R.x1) / 2, R.y1 + w + 11);
  },
  paintBakery(r, g) {
    const ctx = r.ctx, G = CFG.GROCERY, B = G.BAKERY, T = G.BACK_TOP;
    // two shelves of bread on the back wall under a little 'BAKERY' sign, a counter with a basket of rolls below
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, B.x0 + 4, T + 16, 76, 14, 3); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🍞 BAKERY', B.x0 + 42, T + 23);
    for (let row = 0; row < 2; row++) {
      const sy = T + 50 + row * 26;
      ctx.fillStyle = '#8d5a2b'; ctx.fillRect(B.x0, sy, B.x1 - B.x0, 5); ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(B.x0, sy + 5, B.x1 - B.x0, 2);
      if (row === 0) {
        for (let i = 0; i < 4; i++) { const x = B.x0 + 16 + i * 30; ctx.fillStyle = '#c98a4b'; ctx.beginPath(); ctx.ellipse(x, sy - 7, 12, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#e8b06d'; ctx.beginPath(); ctx.ellipse(x - 2, sy - 9, 8, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#8d5a2b'; ctx.lineWidth = 1.2; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x - 6 + k * 5, sy - 12); ctx.lineTo(x - 3 + k * 5, sy - 8); ctx.stroke(); } }   // loaves
      } else {
        for (let i = 0; i < 2; i++) { const x = B.x0 + 30 + i * 60; ctx.save(); ctx.translate(x, sy - 6); ctx.rotate(-0.35); ctx.fillStyle = '#d9a066'; U.roundRect(ctx, -20, -4, 40, 8, 4); ctx.fill(); ctx.fillStyle = '#f0c48a'; for (let k = 0; k < 4; k++) ctx.fillRect(-15 + k * 9, -3, 4, 2); ctx.restore(); }   // baguettes
        for (let i = 0; i < 2; i++) { const x = B.x0 + 60 + i * 40; ctx.fillStyle = '#e0a35a'; ctx.beginPath(); ctx.arc(x, sy - 5, 8, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#f3c57e'; ctx.beginPath(); ctx.arc(x, sy - 5, 5, Math.PI, 0); ctx.fill(); }   // croissants
      }
    }
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, B.x0, B.y0, B.x1 - B.x0, B.y1 - B.y0, 4); ctx.fill();
    ctx.fillStyle = '#f6e7cf'; U.roundRect(ctx, B.x0, B.y0 - 4, B.x1 - B.x0, 12, 4); ctx.fill();
    ctx.fillStyle = '#b5773a'; U.roundRect(ctx, B.x0 + 30, B.y0 - 16, 44, 16, 5); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(B.x0 + 34 + k * 10, B.y0 - 16); ctx.lineTo(B.x0 + 38 + k * 10, B.y0); ctx.stroke(); }
    for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? '#e8b06d' : '#d9a066'; ctx.beginPath(); ctx.arc(B.x0 + 40 + i * 9, B.y0 - 18, 5, 0, Math.PI * 2); ctx.fill(); }   // rolls in a basket
    ctx.fillStyle = '#fff'; U.roundRect(ctx, B.x0 + 90, B.y0 - 10, 30, 10, 3); ctx.fill(); ctx.fillStyle = '#e4572e'; ctx.fillRect(B.x0 + 90, B.y0 - 6, 30, 2);   // a folded tea towel
    // the warm lamp over the bread
    const L = G.LAMP;
    ctx.strokeStyle = '#5c6670'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(L.x, T + 8); ctx.lineTo(L.x, L.y - 6); ctx.stroke();
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(L.x - 14, L.y + 6); ctx.lineTo(L.x + 14, L.y + 6); ctx.lineTo(L.x + 5, L.y - 6); ctx.lineTo(L.x - 5, L.y - 6); ctx.closePath(); ctx.fill();
  },
  paintCheckout(r, g) {
    const ctx = r.ctx, G = CFG.GROCERY, C = G.CHECKOUT, S = G.SCANNER, T = G.TILL;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(C.x0 + 4, C.y0 + 6, C.x1 - C.x0, C.y1 - C.y0);
    ctx.fillStyle = '#7cb342'; U.roundRect(ctx, C.x0, C.y0, C.x1 - C.x0, C.y1 - C.y0, 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; for (let x = C.x0 + 8; x < C.x1 - 6; x += 16) ctx.fillRect(x, C.y0 + 12, 8, C.y1 - C.y0 - 16);
    ctx.fillStyle = '#f6e7cf'; U.roundRect(ctx, C.x0 - 2, C.y0 - 8, C.x1 - C.x0 + 4, 18, 6); ctx.fill();
    // the belt between the scanner and the till
    ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, S.x + 14, C.y0 - 5, T.x - 20 - S.x - 14, 10, 3); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; for (let x = S.x + 18; x < T.x - 22; x += 8) ctx.fillRect(x, C.y0 - 4, 3, 8);
    // the scanner: a black box with a glass window
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, S.x - 12, S.y - 12, 24, 16, 3); ctx.fill(); ctx.fillStyle = '#9fd8ff'; ctx.fillRect(S.x - 8, S.y - 9, 16, 8);
    // the till with a green display
    ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, T.x - 14, T.y - 16, 28, 20, 4); ctx.fill(); ctx.fillStyle = '#8ef0a0'; ctx.fillRect(T.x - 10, T.y - 13, 20, 7); ctx.fillStyle = '#9aa0a8'; for (let k = 0; k < 3; k++) ctx.fillRect(T.x - 9 + k * 7, T.y - 3, 5, 3);
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(6); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$0.00', T.x, T.y - 9);
    // paper bags under the counter end
    ctx.fillStyle = '#d9b382'; ctx.fillRect(C.x1 - 18, C.y0 + 6, 10, 18); ctx.fillRect(C.x1 - 30, C.y0 + 8, 10, 16); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(C.x1 - 18, C.y0 + 6, 10, 3); ctx.fillRect(C.x1 - 30, C.y0 + 8, 10, 3);
  },
  paintFreezer(r, g) {
    const ctx = r.ctx, G = CFG.GROCERY, F = G.FREEZER, top = F.y0 - 44;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(F.x0 + 4, top + 6, F.x1 - F.x0, F.y1 - top);
    ctx.fillStyle = '#eceff1'; U.roundRect(ctx, F.x0, top, F.x1 - F.x0, F.y1 - top, 6); ctx.fill();
    ctx.fillStyle = '#cfd8dc'; ctx.fillRect(F.x0, F.y1 - 8, F.x1 - F.x0, 8);
    // the glass lid: popsicles and ice cream tubs seen through it, frost in the corners
    const gl = ctx.createLinearGradient(F.x0, top, F.x1, F.y0); gl.addColorStop(0, '#dff3ff'); gl.addColorStop(1, '#a7d8f5');
    ctx.fillStyle = gl; U.roundRect(ctx, F.x0 + 8, top + 8, F.x1 - F.x0 - 16, F.y0 - top - 2, 4); ctx.fill();
    const cols = ['#ff8fab', '#ffd166', '#41b883', '#9b7fe0', '#4dd0e1'];
    for (let i = 0; i < 5; i++) { const x = F.x0 + 20 + i * 20; ctx.fillStyle = cols[i]; U.roundRect(ctx, x, top + 14, 10, 20, 3); ctx.fill(); ctx.fillStyle = '#d9b382'; ctx.fillRect(x + 4, top + 34, 2, 8); }
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; for (const [dx, dy] of [[12, 10], [F.x1 - F.x0 - 18, 12], [14, F.y0 - top - 8], [F.x1 - F.x0 - 20, F.y0 - top - 10]]) { ctx.beginPath(); ctx.arc(F.x0 + dx, top + dy, 5, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(F.x0 + 20, F.y0 - 4); ctx.lineTo(F.x0 + 50, top + 10); ctx.stroke();
    ctx.fillStyle = '#5c6670'; U.roundRect(ctx, F.x0 + 30, F.y0 + 2, F.x1 - F.x0 - 60, 6, 3); ctx.fill();   // the handle
    ctx.fillStyle = '#2d5a8a'; U.roundRect(ctx, (F.x0 + F.x1) / 2 - 28, F.y0 + 12, 56, 14, 4); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('❄️ FREEZER', (F.x0 + F.x1) / 2, F.y0 + 19);
  },
  paintCrate(r, x, y, kind) {
    const ctx = r.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x - 20, y - 10, 44, 28);
    ctx.fillStyle = '#b5773a'; ctx.fillRect(x - 22, y - 14, 44, 28); ctx.fillStyle = '#8d5a2b'; ctx.fillRect(x - 22, y - 14, 44, 3); ctx.fillRect(x - 22, y + 11, 44, 3); ctx.fillRect(x - 22, y - 14, 3, 28); ctx.fillRect(x + 19, y - 14, 3, 28);
    ctx.fillStyle = '#9c6632'; ctx.fillRect(x - 19, y - 11, 38, 22);
    if (kind === 'apple') for (let i = 0; i < 8; i++) { const px = x - 13 + (i % 4) * 9, py = y - 5 + Math.floor(i / 4) * 9; ctx.fillStyle = i % 3 ? '#e53935' : '#ff8a80'; ctx.beginPath(); ctx.arc(px, py, 4.2, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#5b3a1a'; ctx.fillRect(px - 0.5, py - 6, 1, 3); }
    if (kind === 'banana') for (let i = 0; i < 5; i++) { ctx.save(); ctx.translate(x - 12 + i * 6, y + (i % 2) * 4); ctx.rotate(-0.6); ctx.strokeStyle = '#ffd54f'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 0, 7, Math.PI * 0.15, Math.PI * 0.95); ctx.stroke(); ctx.strokeStyle = '#8d5a2b'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 7, Math.PI * 0.15, Math.PI * 0.25); ctx.stroke(); ctx.restore(); }
    if (kind === 'carrot') for (let i = 0; i < 6; i++) { const px = x - 15 + i * 6; ctx.fillStyle = '#ff8a3d'; ctx.beginPath(); ctx.moveTo(px - 2.5, y - 6); ctx.lineTo(px + 2.5, y - 6); ctx.lineTo(px, y + 9); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#43a047'; ctx.fillRect(px - 2, y - 10, 1.5, 5); ctx.fillRect(px + 0.5, y - 11, 1.5, 6); }
    if (kind === 'tomato') for (let i = 0; i < 8; i++) { const px = x - 13 + (i % 4) * 9, py = y - 5 + Math.floor(i / 4) * 9; ctx.fillStyle = '#ef5350'; ctx.beginPath(); ctx.arc(px, py, 4.4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(px - 1.5, py - 1.5, 1.4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#43a047'; ctx.fillRect(px - 2, py - 5.5, 4, 1.5); }
    if (kind === 'melon') for (let i = 0; i < 3; i++) { const px = x - 11 + i * 11, py = y + (i % 2) * 3; ctx.fillStyle = '#2e7d32'; ctx.beginPath(); ctx.ellipse(px, py, 7.5, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#66bb6a'; ctx.lineWidth = 1.2; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(px + k * 3.5, py - 5.5); ctx.quadraticCurveTo(px + k * 5, py, px + k * 3.5, py + 5.5); ctx.stroke(); } }
    // the price tag on a stick: just the picture
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(x + 14, y - 26, 2, 14); ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, x + 7, y - 34, 16, 12, 2); ctx.fill();
    ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText(this.ITEMS[kind].ico, x + 15, y - 28);
  },
  paintCatCrate(r, g) {
    const ctx = r.ctx, C = CFG.GROCERY.CAT_CRATE;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(C.x - 18, C.y - 8, 40, 26);
    ctx.fillStyle = '#b5773a'; ctx.fillRect(C.x - 20, C.y - 14, 40, 30); ctx.fillStyle = '#9c6632'; ctx.fillRect(C.x - 20, C.y - 14, 40, 10);
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(C.x - 20, C.y - 4, 40, 2); ctx.fillRect(C.x - 20, C.y + 6, 40, 2); ctx.fillRect(C.x - 20, C.y - 14, 3, 30); ctx.fillRect(C.x + 17, C.y - 14, 3, 30);
    ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, C.x - 10, C.y - 2, 20, 9, 2); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.font = r.font(5); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('ORANGES', C.x, C.y + 2.5);
  },
  paintScale(r, g) {
    const ctx = r.ctx, S = CFG.GROCERY.SCALE;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(S.x - 18, S.y - 10, 40, 26);
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, S.x - 20, S.y - 14, 40, 28, 4); ctx.fill(); ctx.fillStyle = '#b5773a'; U.roundRect(ctx, S.x - 17, S.y - 11, 34, 22, 3); ctx.fill();
    // the scale: a red body with a white dial on top and a pan over it (the needle and the melon are live)
    ctx.fillStyle = '#c62828'; U.roundRect(ctx, S.x - 12, S.y - 30, 24, 24, 5); ctx.fill();
    ctx.fillStyle = '#fff8ee'; ctx.beginPath(); ctx.arc(S.x, S.y - 18, 8, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(S.x, S.y - 18, 8, 0, Math.PI * 2); ctx.stroke();
    for (let k = 0; k < 5; k++) { const a = -Math.PI * 0.85 + k * Math.PI * 0.425; ctx.fillStyle = '#2b1d14'; ctx.fillRect(S.x + Math.cos(a) * 6 - 0.5, S.y - 18 + Math.sin(a) * 6 - 0.5, 1.2, 1.2); }
    ctx.fillStyle = '#9aa0a8'; U.roundRect(ctx, S.x - 15, S.y - 36, 30, 6, 3); ctx.fill();   // the pan
    ctx.fillStyle = '#5c6670'; ctx.fillRect(S.x - 2, S.y - 32, 4, 4);
  },
  paintSamples(r, g) {
    const ctx = r.ctx, S = CFG.GROCERY.SAMPLES;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(S.x + 3, S.y + 6, 20, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.ellipse(S.x, S.y, 20, 12, 0, 0, Math.PI * 2); ctx.fill();   // a round table with a red cloth
    ctx.fillStyle = '#fff8ee'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(S.x + Math.cos(i * 1.05) * 13, S.y + Math.sin(i * 1.05) * 7.5, 2.2, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(S.x, S.y - 2, 12, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(S.x, S.y - 2, 12, 7, 0, 0, Math.PI * 2); ctx.stroke();   // the plate
    for (let i = 0; i < 5; i++) { const px = S.x - 8 + i * 4, py = S.y - 3 + (i % 2) * 3; ctx.fillStyle = '#ffd54f'; ctx.fillRect(px - 2, py - 2, 4.5, 4.5); ctx.fillStyle = '#f9a825'; ctx.fillRect(px - 2, py - 2, 4.5, 1); ctx.strokeStyle = '#8d5a2b'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(px, py - 2); ctx.lineTo(px + 1, py - 8); ctx.stroke(); }   // cheese cubes on toothpicks
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(S.x + 14, S.y - 28, 2, 18); ctx.fillStyle = '#ffd166'; U.roundRect(ctx, S.x + 4, S.y - 38, 22, 12, 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(6); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('FREE 🧀', S.x + 15, S.y - 32);
  },
  paintBaskets(r, g) {
    const ctx = r.ctx, B = CFG.GROCERY.BASKETS;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(B.x - 16, B.y - 8, 36, 24);
    ctx.fillStyle = '#5c6670'; U.roundRect(ctx, B.x - 18, B.y - 12, 36, 26, 3); ctx.fill();   // the rack
    for (let i = 0; i < 3; i++) this.drawBasket(r, B.x, B.y + 2 - i * 7, [], 1);
    ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, B.x - 14, B.y + 4, 28, 9, 2); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.font = r.font(6); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('BASKETS', B.x, B.y + 8.5);
  },

  // ---------- moving things ----------
  // outside the shop's little map the screen would show the dark backdrop: paint the slate around it
  drawOutside(r, g) {
    const ctx = r.ctx, W = CFG.GROCERY.WORLD, x0 = r.camX - 20, y0 = r.camY - 20, x1 = r.camX + r.viewW + 20, y1 = r.camY + r.viewH + 20;
    ctx.fillStyle = '#3a4a5c';
    if (y0 < W.y0) ctx.fillRect(x0, y0, x1 - x0, W.y0 - y0);
    if (y1 > W.y1) ctx.fillRect(x0, W.y1, x1 - x0, y1 - W.y1);
    if (x0 < W.x0) ctx.fillRect(x0, W.y0, W.x0 - x0, W.y1 - W.y0);
    if (x1 > W.x1) ctx.fillRect(W.x1, W.y0, x1 - W.x1, W.y1 - W.y0);
  },
  // a wicker basket with up to five things showing over its rim
  drawBasket(r, x, y, items, f) {
    const ctx = r.ctx;
    ctx.fillStyle = '#c98a4b'; U.roundRect(ctx, x - 12, y - 8, 24, 12, 3); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x - 12, y - 5 + k * 3.5); ctx.lineTo(x + 12, y - 5 + k * 3.5); ctx.stroke(); }
    ctx.strokeStyle = '#8d5a2b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y - 8, 9, Math.PI, 0); ctx.stroke();
    for (let i = 0; i < items.length; i++) { const it = this.ITEMS[items[i]]; ctx.fillStyle = it.col; ctx.beginPath(); ctx.arc(x - 8 + i * 4, y - 10 - (i % 2) * 2, 3.2, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(x - 9 + i * 4, y - 11 - (i % 2) * 2, 1.1, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#e0a35a'; ctx.fillRect(x - 12, y - 8, 24, 2);
  },
  drawCarried(r, g) {
    const ctx = r.ctx, st = this.st, p = g.player, f = p.facing || 1, bob = p.moving ? Math.sin(p.bob || 0) * 2 : 0, t = g.time;
    if (st.basket) this.drawBasket(r, p.x + f * 17, p.y - 10 + bob, st.items, f);
    if (st.carrot > 0) {
      // the plush carrot under the other arm, with a happy face
      const x = p.x - f * 15, y = p.y - 18 + bob;
      ctx.save(); ctx.translate(x, y); ctx.rotate(f * 0.5);
      ctx.fillStyle = '#ff8a3d'; ctx.beginPath(); ctx.moveTo(-6, -8); ctx.lineTo(6, -8); ctx.lineTo(0, 14); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#43a047'; U.roundRect(ctx, -5, -16, 3, 9, 1.5); ctx.fill(); U.roundRect(ctx, -1, -18, 3, 11, 1.5); ctx.fill(); U.roundRect(ctx, 3, -15, 3, 8, 1.5); ctx.fill();
      ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(-2, -3, 1, 0, Math.PI * 2); ctx.arc(2, -3, 1, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, -1, 2, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
      ctx.restore();
    }
    if (st.grapes > 0) {
      // a balloon on a string with the bag of grapes dangling under it
      const bx = p.x - f * 10 + Math.sin(t * 1.6) * 4, by = p.y - 96 + Math.sin(t * 2.1) * 3 + bob;
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(bx, by + 12); ctx.quadraticCurveTo(bx + f * 4, by + 30, bx, by + 42); ctx.stroke();
      ctx.fillStyle = '#9b7fe0'; ctx.beginPath(); ctx.ellipse(bx, by, 10, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.ellipse(bx - 3, by - 4, 3, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#9b7fe0'; ctx.beginPath(); ctx.moveTo(bx - 3, by + 11); ctx.lineTo(bx + 3, by + 11); ctx.lineTo(bx, by + 15); ctx.closePath(); ctx.fill();
      const gy = by + 48;
      ctx.fillStyle = 'rgba(255,255,255,0.75)'; U.roundRect(ctx, bx - 8, gy - 8, 16, 16, 4); ctx.fill();
      for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#7e57c2' : '#5e35b1'; ctx.beginPath(); ctx.arc(bx - 4 + (i % 3) * 4, gy - 3 + Math.floor(i / 3) * 5, 2.6, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#43a047'; ctx.fillRect(bx - 1, gy - 9, 2, 3);
    }
  },
  dynamic(r, g) {
    if (!this.st || g.area !== 'grocery') return;
    const ctx = r.ctx, G = CFG.GROCERY, st = this.st, t = g.time;
    this.drawOutside(r, g);
    // the bakery lamp glows warm, pulsing gently
    const L = G.LAMP, gl = 0.75 + 0.25 * Math.sin(t * 2.2);
    const grd = ctx.createRadialGradient(L.x, L.y + 30, 4, L.x, L.y + 30, 70); grd.addColorStop(0, `rgba(255,170,60,${(0.32 * gl).toFixed(3)})`); grd.addColorStop(1, 'rgba(255,170,60,0)');
    ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(L.x, L.y + 30, 70, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.arc(L.x, L.y + 7, 4, 0, Math.PI * 2); ctx.fill();
    // frost mist creeping down the freezer's front
    const F = G.FREEZER;
    for (let i = 0; i < 4; i++) { const k = (t * 0.25 + i * 0.25) % 1; ctx.fillStyle = `rgba(223,243,255,${(0.35 * (1 - k)).toFixed(2)})`; ctx.beginPath(); ctx.ellipse(F.x0 + 20 + i * 26 + Math.sin(t + i) * 6, F.y1 + 4 + k * 16, 14 + k * 10, 5, 0, 0, Math.PI * 2); ctx.fill(); }
    // the scale: the needle swings while something heavy sits on the pan
    const S = G.SCALE, k = st.weigh > 0 ? st.weigh / G.WEIGH : 0, a = k > 0 ? Math.PI * 0.45 * Math.sin((1 - k) * 9) * k + Math.PI * 0.35 * Math.min(1, (1 - k) * 4) : 0;
    ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(S.x, S.y - 18); ctx.lineTo(S.x + Math.sin(a) * 6, S.y - 18 - Math.cos(a) * 6); ctx.stroke();
    if (st.weigh > 0) { const sq = 1 + Math.sin(t * 20) * 0.03 * k; ctx.fillStyle = '#2e7d32'; ctx.beginPath(); ctx.ellipse(S.x, S.y - 42, 11 * sq, 8 / sq, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#66bb6a'; ctx.lineWidth = 1.5; for (let m = -1; m <= 1; m++) { ctx.beginPath(); ctx.moveTo(S.x + m * 5, S.y - 49); ctx.quadraticCurveTo(S.x + m * 7, S.y - 42, S.x + m * 5, S.y - 35); ctx.stroke(); } }
    // the scanner's red line while scanning
    if (st.scan) { const Sc = G.SCANNER; ctx.fillStyle = `rgba(255,60,60,${(0.5 + 0.5 * Math.sin(t * 30)).toFixed(2)})`; ctx.fillRect(Sc.x - 7, Sc.y - 6, 14, 1.5); }
  },
  entities(r, g, items) {
    if (!this.st) return;
    const st = this.st, p = g.player, G = CFG.GROCERY;
    if ((st.grapes > 0 || st.carrot > 0 || st.basket) && !g.driving && !g.onTrain) items.push({ y: p.y + 1, draw: () => this.drawCarried(r, g) });
    if (g.area !== 'grocery') return;
    items.push({ y: G.CASHIER.y, draw: () => this.drawCashier(r, g) });
    items.push({ y: G.CAT_CRATE.y + 12, draw: () => this.drawCat(r, g) });
    if (st.scan) for (const f of st.scan.flying) items.push({ y: G.CHECKOUT_SPOT.y + 2, draw: () => this.drawFlying(r, g, f) });
  },
  drawFlying(r, g, f) {
    // a thing hops from the basket to the scanner and on down the belt
    const ctx = r.ctx, G = CFG.GROCERY, p = g.player, k = f.t / 0.6, it = this.ITEMS[f.kind];
    const x0 = p.x + 17, y0 = p.y - 20, x1 = G.SCANNER.x, y1 = G.SCANNER.y - 14;
    const x = U.lerp(x0, x1, k), y = U.lerp(y0, y1, k) - Math.sin(k * Math.PI) * 26;
    ctx.fillStyle = it.col; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(x - 1.5, y - 1.5, 1.6, 0, Math.PI * 2); ctx.fill();
  },
  drawCashier(r, g) {
    const ctx = r.ctx, C = CFG.GROCERY.CASHIER, st = this.st, t = g.time, p = g.player;
    const facing = p.x < C.x ? -1 : 1;
    r.drawPerson(C.x, C.y, { shirt: '#fff', skin: '#8d5524', hair: '#2b1d14', hairStyle: 2, facing, moving: false, bob: 0, carry: 0, pants: '#2d3a4a', apron: '#7cb342', hat: 'cap', capColor: '#7cb342' });
    if (st.cashier.wave > 0) { const a = Math.sin(t * 12) * 0.5; ctx.save(); ctx.translate(C.x + 14, C.y - 16); ctx.rotate(-0.9 + a); ctx.fillStyle = '#8d5524'; U.roundRect(ctx, -2, -16, 4, 16, 2); ctx.fill(); ctx.beginPath(); ctx.arc(0, -17, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    else if (st.scan) { ctx.fillStyle = '#8d5524'; ctx.beginPath(); ctx.arc(C.x - 18 + Math.sin(t * 9) * 3, C.y - 10, 3.5, 0, Math.PI * 2); ctx.fill(); }
  },
  drawCat(r, g) {
    const ctx = r.ctx, C = CFG.GROCERY.CAT_CRATE, st = this.st, t = g.time, x = C.x, y = C.y - 14;
    const awake = st.cat.tail > 0, sw = Math.sin(t * (awake ? 9 : 1.6)) * (awake ? 10 : 4);
    ctx.strokeStyle = '#ef8a3a'; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + 10, y - 2); ctx.quadraticCurveTo(x + 20, y - 4 + sw * 0.3, x + 20 + sw * 0.4, y - 12 - sw); ctx.stroke();
    ctx.fillStyle = '#ef8a3a'; ctx.beginPath(); ctx.ellipse(x, y - 3, 14, 8, 0, 0, Math.PI * 2); ctx.fill();   // curled body
    ctx.fillStyle = '#f7a95e'; for (let k = 0; k < 3; k++) ctx.fillRect(x - 8 + k * 6, y - 9, 2, 10);   // stripes
    ctx.fillStyle = '#ef8a3a'; ctx.beginPath(); ctx.arc(x - 10, y - 8, 7, 0, Math.PI * 2); ctx.fill();   // head
    ctx.beginPath(); ctx.moveTo(x - 16, y - 12); ctx.lineTo(x - 15, y - 19); ctx.lineTo(x - 10, y - 14); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(x - 4, y - 12); ctx.lineTo(x - 5, y - 19); ctx.lineTo(x - 10, y - 14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff8ee'; ctx.beginPath(); ctx.arc(x - 10, y - 5, 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1; ctx.lineCap = 'round';
    if (awake) { ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x - 13, y - 9, 1.3, 0, Math.PI * 2); ctx.arc(x - 7, y - 9, 1.3, 0, Math.PI * 2); ctx.fill(); }
    else for (const d of [-13, -7]) { ctx.beginPath(); ctx.arc(x + d, y - 9.5, 2, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke(); }
    ctx.fillStyle = '#ff8fab'; ctx.beginPath(); ctx.arc(x - 10, y - 6.5, 1, 0, Math.PI * 2); ctx.fill();
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x - 10 + d * 3, y - 6); ctx.lineTo(x - 10 + d * 11, y - 8); ctx.moveTo(x - 10 + d * 3, y - 5); ctx.lineTo(x - 10 + d * 11, y - 4); ctx.stroke(); }
    if (!awake) { ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; for (const z of st.cat.z) { const k = z.t / 2; ctx.globalAlpha = 1 - k; ctx.fillStyle = '#2b1d14'; ctx.fillText('z', x - 14 + k * 10, y - 22 - k * 18); } ctx.globalAlpha = 1; }
  },
  overlay(r, g) {
    if (!this.st || g.area !== 'grocery') return;
    const ctx = r.ctx, st = this.st, G = CFG.GROCERY, t = g.time;
    // frosty breath by the freezer
    for (const f of st.puffs) { const k = f.t / 1.2; ctx.fillStyle = `rgba(230,245,255,${(0.75 * (1 - k)).toFixed(2)})`; ctx.beginPath(); ctx.arc(f.x + f.dx * k, f.y - k * 14, 3 + k * 7, 0, Math.PI * 2); ctx.fill(); }
    // heat wobbles over the warm bread
    if (st.warm) { const B = G.BAKERY; ctx.strokeStyle = 'rgba(255,200,120,0.55)'; ctx.lineWidth = 1.5; for (let i = 0; i < 3; i++) { const x = B.x0 + 40 + i * 24, ph = (t * 0.7 + i * 0.33) % 1; ctx.globalAlpha = 1 - ph; ctx.beginPath(); for (let k = 0; k <= 6; k++) { const yy = B.y0 - 24 - ph * 24 + k * 3; const xx = x + Math.sin(k * 1.3 + t * 6) * 2.5; if (k === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy); } ctx.stroke(); } ctx.globalAlpha = 1; }
  },
  screen(r, g) {
    if (!this.st || this.st.fade <= 0) return;
    const ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    ctx.fillStyle = `rgba(20,12,6,${(this.st.fade / 0.45).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
  },
};
Game.ext.unshift(GroceryExt);   // first in line so the door's button and hint beat the City's taxis and coins
Render.ext.push(GroceryExt);
