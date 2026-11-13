'use strict';
// The Egg Barn: an idle egg farm in the big hall behind the old barn (through the wide archway in the barn's bottom wall,
// same map 'barn', see js/barn.js). One button for each thing, nothing to read, nothing to lose, and no resets: it just
// keeps growing. Extension module (see js/EXTENSIONS.md).
//
// - 🐣 Hatch! at the shiny hatching machine: a chick pops out with a peep and waddles along the yellow path, over a
//   little ramp, into a henhouse, where it grows into a hen. A short refill ring (0.4 s) keeps fast tapping fun.
// - The henhouses (coops) fill up window by window with hens peeking out, a counter on the roof and a big FULL sign.
//   👀 Peek inside at a coop's door shows the hens on their nests. Pads buy a New Coop (up to six) and Bigger Coops.
// - Hens lay eggs that roll down onto the conveyor belt to the egg packer, which boxes them; the boxes go onto the egg
//   truck at the back door, which drives off by itself and comes back with money (bills fly to the chef, or a cash
//   pile waits by the dock while he is away). The spare egg truck in its bay can be driven for fun (no extra pay),
//   out of the big back door onto the farm and back in through the barn door.
// - Egg types climb a ladder as the flock grows: plain → golden → rainbow → sparkly space → pizza egg, each worth more,
//   and the hens dress up for each one (a bow, a party hat, a space helmet, a crown). The giant board on the back wall
//   shows the ladder.
// - THE EGG TOWER: the chef collects eggs (at the belt's end and the packer's hopper, loose eggs on the floor, the old
//   barn's hens) into a springy stack carried over his head, egg on egg, 100+ high. Each egg arcs in and lands with a
//   squash; the tower leans and lags like a wobbly noodle (a spring for the lean, a per-egg smoothing that grows with
//   height, a travelling ripple). 📦 Pack the eggs at the packer or the truck streams them off one by one into boxes.
// - Extras: a lucky egg on a balloon now and then (walk into it), a rooster that crows at dawn, 🌽 Scatter corn for a
//   short laying boost, and offline catch-up with the shared Shop helpers (js/shop.js).
// Saved in g.s.eggfarm.

CFG.EGGFARM = {
  HALL: { x0: 39548, y0: 4410, x1: 40852, y1: 4892 }, WALL: 22,
  ARCH_MAT: { x: 39952, y: 4448 },                                  // the hall side of the archway (rescue spot)
  HATCHER: { x0: 39566, y0: 4414, x1: 39732, y1: 4498, btn: { x: 39650, y: 4542 }, out: { x: 39740, y: 4486 } },
  ROOSTER: { x: 39704, y: 4410 },                                   // stands on the hatcher's roof
  CORN: { x: 40005, y: 4604, spot: { x: 40005, y: 4650 } },         // the corn sack and where you stand to scatter
  COOP_X: [40104, 40208, 40312, 40416, 40520, 40624], COOP: { y0: 4416, y1: 4498, w: 92 },
  COOP_COLORS: ['#e4572e', '#3b7dd8', '#2f9e44', '#9b59b6', '#f2b134', '#e84393'],
  CHICK_Y: 4554,                                                    // the chicks' path, just south of the belt
  BELT: { y: 4512, x0: 40048, x1: 40700, half: 12, speed: 80, gap: 22 },
  PACKER: { x0: 40700, y0: 4462, x1: 40836, y1: 4574, hopper: { x: 40722, y: 4500 } },
  COLLECT: { x: 40672, y: 4558, r: 56 },                            // the belt's end and the hopper: walk here to scoop eggs
  BOXPILE: { x: 40772, y: 4622 },
  PACK: { x: 40664, y: 4652, r: 50 },                               // 📦 Pack the eggs (into boxes on the pile)
  DOCK: { x: 40762, y: 4772 }, DOOR: { y0: 4700, y1: 4846 },        // the truck's loading bay and the big back door
  TRUCK_SPOT: { x: 40674, y: 4772, r: 50 },                         // 📦 Pack the eggs straight into the truck
  CASH: { x: 40560, y: 4740 },
  SPARE: { x: 40650, y: 4852 },                                     // the spare egg truck's bay (the one you drive)
  FARM_SPOT: { x: -735, y: 300 },                                   // where the egg truck comes out on the farm
  BOARD: { x0: 40152, y0: 4222, x1: 40832, y1: 4352 },              // the giant milestone board on the back wall
  PADS_Y: 4840, PADS_X: [39640, 39764, 39888, 40012, 40136, 40260], NEWCOOP_Y: 4606,
  // egg types: `at` is the hen count that unlocks it; value is $ per egg
  TYPES: [
    { key: 'plain', name: 'Plain eggs', at: 0, value: 1, ico: '🥚', glow: '#fff8ee' },
    { key: 'golden', name: 'Golden eggs', at: 30, value: 2, ico: '🌟', glow: '#ffd34d' },
    { key: 'rainbow', name: 'Rainbow eggs', at: 100, value: 4, ico: '🌈', glow: '#ff8fd0' },
    { key: 'space', name: 'Space eggs', at: 250, value: 7, ico: '🚀', glow: '#9a7bff' },
    { key: 'pizza', name: 'Pizza eggs', at: 500, value: 12, ico: '🍕', glow: '#ff9a3d' },
  ],
  // pads: base price, growth, max level (Shop.cost)
  UPG: {
    hatch: { label: 'Faster Hatcher', ico: '🐣', base: 60, growth: 1.55, max: 10 },
    coop: { label: 'Bigger Coops', ico: '🏡', base: 80, growth: 1.6, max: 10 },
    feed: { label: 'Better Feed', ico: '🌾', base: 70, growth: 1.55, max: 10 },
    box: { label: 'Bigger Egg Boxes', ico: '📦', base: 90, growth: 1.6, max: 8 },
    truck: { label: 'More Trucks', ico: '🚚', base: 200, growth: 2.3, max: 3 },
    fancy: { label: 'Fancier Eggs', ico: '✨', base: 120, growth: 1.7, max: 8 },
  },
  NEWCOOP: { base: 150, growth: 2.0 },
  REFILL: 0.4, COOP_BASE: 20, COOP_PER_LV: 10, LAY: 12, HOPPER_CAP: 150, BOX_PILE_CAP: 60,
  TRUCK_TRIP: 6, STRAY_MAX: 24, STACK_MAX: 300, CHICK_MAX: 40, SCOOP_GAP: 0.045, MAGNET: 90,
  CORN_TIME: 15, LUCKY_EVERY: [40, 80], SP: 12,                     // SP: px between eggs in the tower
};
CFG.VEHICLES.eggtruck = { speed: 250, radius: 24, label: '🚚 Drive the egg truck', exit: '🚶 Hop out' };

const EggFarmExt = {
  name: 'eggfarm',
  st: null,
  sprites: null,
  defaults: { eggfarm: { seen: false, coops: 1, hens: [0, 0, 0, 0, 0, 0], lv: { hatch: 0, coop: 0, feed: 0, box: 0, truck: 0, fancy: 0 }, type: 0, hopper: 0, box: 0, boxEggVal: 0, boxes: 0, boxVal: 0, bank: 0, transit: 0, rate: 0, stack: [], hatched: 0, laid: 0, shipped: 0, earned: 0 } },

  // ======================= numbers =======================
  state(g) {
    let s = g.s.eggfarm;
    if (!s || typeof s !== 'object') s = g.s.eggfarm = JSON.parse(JSON.stringify(this.defaults.eggfarm));
    const d = this.defaults.eggfarm;
    for (const k of Object.keys(d)) if (s[k] === undefined) s[k] = JSON.parse(JSON.stringify(d[k]));
    for (const k of Object.keys(d.lv)) if (typeof s.lv[k] !== 'number') s.lv[k] = 0;
    if (!Array.isArray(s.hens)) s.hens = [0, 0, 0, 0, 0, 0];
    while (s.hens.length < 6) s.hens.push(0);
    if (!Array.isArray(s.stack)) s.stack = [];
    return s;
  },
  cap(s) { const K = CFG.EGGFARM; return K.COOP_BASE + K.COOP_PER_LV * s.lv.coop; },
  hens(s) { let n = 0; for (let i = 0; i < s.coops; i++) n += s.hens[i]; return n; },
  room(s) { return s.coops * this.cap(s) - this.hens(s); },
  refill(s) { return CFG.EGGFARM.REFILL / (1 + 0.15 * s.lv.hatch); },
  perPress(s) { return 1 + Math.floor(s.lv.hatch / 4); },
  autoEvery(s) { return s.lv.hatch > 0 ? 3.2 / s.lv.hatch : 0; },
  layTime(s) { return CFG.EGGFARM.LAY / (1 + 0.3 * s.lv.feed); },
  boxEggs(s) { return 6 + 3 * s.lv.box; },
  packRate(s) { return 4 * (1 + 0.4 * s.lv.box); },
  truckCount(s) { return 1 + s.lv.truck; },
  truckCap(s) { return 6 + 2 * s.lv.truck; },
  eggValue(s, type) { return CFG.EGGFARM.TYPES[type].value * (1 + 0.25 * s.lv.fancy); },
  typeFor(n) { const T = CFG.EGGFARM.TYPES; let k = 0; for (let i = 0; i < T.length; i++) if (n >= T[i].at) k = i; return k; },
  upgCost(s, key) { const u = CFG.EGGFARM.UPG[key]; return s.lv[key] >= u.max ? null : Shop.cost(u.base, s.lv[key], u.growth); },
  coopCost(s) { return s.coops >= 6 ? null : Shop.cost(CFG.EGGFARM.NEWCOOP.base, s.coops - 1, CFG.EGGFARM.NEWCOOP.growth); },
  inHall(g) { return g.area === 'barn' && g.player.y > CFG.BARN.room.y1 + 10 && !(BarnExt.st && BarnExt.st.loft); },
  busy(g) { return g.onTrain || g.ride || g.travel || (typeof CityExt !== 'undefined' && (CityExt.floor || (CityExt.st && (CityExt.st.cab || CityExt.st.boarding)))); },

  // ======================= setup =======================
  build(g) {
    const s = this.state(g), K = CFG.EGGFARM;
    this.st = {
      refill: 0, press: 0, autoT: 0, fullFlash: 0, peepT: 0,
      chicks: [], incoming: [0, 0, 0, 0, 0, 0], coopPop: [0, 0, 0, 0, 0, 0], acc: [0, 0, 0, 0, 0, 0],
      belt: [], phase: 0, packT: 0, packAnim: 0, boxPop: 0, strays: [],
      trucks: [], boxFly: [],
      stack: [], fly: [], scoopT: 0, noScoop: 0, packing: null, boing: 0, boingT: 0,
      px: g.player.x, py: g.player.y, parea: g.area, vs: 0, lean: 0, leanV: 0, rip: 0,
      lucky: null, luckyT: U.rand(K.LUCKY_EVERY[0] * 0.5, K.LUCKY_EVERY[1] * 0.5),
      boost: 0, corn: [], crow: 0, lastPhase: null, peek: null, banner: null, fade: 0, magT: 0,
      spare: { kind: 'eggtruck', x: K.SPARE.x, y: K.SPARE.y, angle: 0, vx: 0, vy: 0, where: 'barn', boxes: 2 },
      m: { secT: 0, secEarned: 0 }, obs: null, obsCar: null, awayMsg: null, frameMs: 0, drawn: 0,
    };
    // the eggs the chef was carrying when the game was saved
    for (const t of s.stack.slice(0, K.STACK_MAX)) this.st.stack.push({ t: U.clamp(t | 0, 0, 4), x: 0, land: 9 });
    // money that was on the road when the game was saved comes home
    if (s.transit > 0) { s.bank += Math.round(s.transit); s.transit = 0; }
    s.type = Math.max(s.type, this.typeFor(this.hens(s)));
    this.away(g, Shop.awaySeconds(g));
  },
  ready(g) { if (!this.st) this.build(g); return this.st; },
  // The time the game was closed (the shared rule, js/shop.js): the trucks keep a share of the money the farm was
  // making per second, and an automatic hatcher keeps hatching a few chicks into any room left in the coops.
  away(g, sec) {
    const s = this.state(g);
    if (sec < SHOP.AWAY_MIN) return 0;
    const amt = Math.round(Shop.awayEarnings(sec, this.hens(s) > 0, s.rate));
    if (amt > 0) { s.bank += amt; s.earned += amt; }
    let chicks = 0;
    if (s.lv.hatch > 0) {
      chicks = Math.min(this.room(s), Math.floor(sec / this.autoEvery(s) * SHOP.AWAY_SHARE));
      for (let k = 0; k < chicks; k++) { const c = this.coopWithRoom(s); if (c < 0) break; s.hens[c]++; s.hatched++; }
      s.type = Math.max(s.type, this.typeFor(this.hens(s)));
    }
    if (amt > 0 || chicks > 0) this.st.awayMsg = amt > 0 ? `🥚 The egg trucks made ${U.money(amt)} while you were away!` : `🐣 ${chicks} chicks hatched while you were away!`;
    return amt;
  },

  // ======================= geometry =======================
  obstacles(g, forCar) {
    if (g.area !== 'barn') return [];
    const st = this.ready(g), s = this.state(g), slot = forCar ? 'obsCar' : 'obs';
    if (st[slot] && st[slot].coops === s.coops) return st[slot].list;
    const K = CFG.EGGFARM, H = K.HALL, w = K.WALL, B = CFG.BARN, A = B.arch, R = B.room, o = [];
    // walls: the strip under the old barn (with the archway), the tall back wall right of the barn, the sides and bottom
    o.push({ x: R.x0 - w, y: R.y1 + w, w: A.x0 - (R.x0 - w), h: H.y0 - R.y1 - w }, { x: A.x1, y: R.y1 + w, w: R.x1 + w - A.x1, h: H.y0 - R.y1 - w });
    o.push({ x: R.x1 + w, y: CFG.AREAS.barn.WORLD.y0, w: H.x1 + w - (R.x1 + w), h: H.y0 - CFG.AREAS.barn.WORLD.y0 });
    o.push({ x: H.x0 - w, y: R.y1 + w, w, h: H.y1 + w - (R.y1 + w) });
    o.push({ x: H.x1, y: R.y1 + w, w, h: K.DOOR.y0 - (R.y1 + w) }, { x: H.x1, y: K.DOOR.y1, w, h: H.y1 + w - K.DOOR.y1 });
    o.push({ x: H.x0 - w, y: H.y1, w: H.x1 - H.x0 + 2 * w, h: w });
    // machines and furniture
    const Hc = K.HATCHER; o.push({ x: Hc.x0, y: Hc.y0, w: Hc.x1 - Hc.x0, h: Hc.y1 - Hc.y0 });
    o.push({ x: K.CORN.x - 24, y: K.CORN.y - 16, w: 48, h: 30 });
    for (let i = 0; i < s.coops; i++) o.push({ x: K.COOP_X[i] - K.COOP.w / 2, y: K.COOP.y0, w: K.COOP.w, h: K.COOP.y1 - K.COOP.y0 });
    const Bt = K.BELT; o.push({ x: Bt.x0, y: Bt.y - Bt.half, w: Bt.x1 - Bt.x0, h: Bt.half * 2 });
    const P = K.PACKER; o.push({ x: P.x0, y: P.y0, w: P.x1 - P.x0, h: P.y1 - P.y0 });
    o.push({ x: K.BOXPILE.x - 32, y: K.BOXPILE.y - 18, w: 64, h: 36 });
    if (forCar) o.push({ x: A.x0, y: R.y1 - 30, w: A.x1 - A.x0, h: H.y0 - R.y1 + 40 });   // trucks stay out of the old barn
    st[slot] = { coops: s.coops, list: o };
    return o;
  },
  vehicles(g) { return this.st ? [this.st.spare] : []; },
  coopWithRoom(s) {
    const cap = this.cap(s); let best = -1, bestRoom = 0;
    for (let i = 0; i < s.coops; i++) { const r = cap - s.hens[i]; if (r > bestRoom) { bestRoom = r; best = i; } }
    return best;
  },
  // the chick's walk: out of the hatcher, along the yellow path, over the ramp into its coop's door
  chickPath(c) {
    const K = CFG.EGGFARM, O = K.HATCHER.out, x = K.COOP_X[c] - 28;
    return [{ x: O.x + 14, y: O.y + 8 }, { x: O.x + 20, y: K.CHICK_Y }, { x, y: K.CHICK_Y }, { x, y: K.BELT.y }, { x, y: K.COOP.y1 - 4 }];
  },

  // ======================= the pads =======================
  pads(g) {
    if (g.area !== 'barn') return [];   // the circles only exist in the barn's map
    const s = this.state(g), K = CFG.EGGFARM, out = [], keys = ['hatch', 'coop', 'feed', 'box', 'truck', 'fancy'];
    keys.forEach((k, i) => {
      const u = K.UPG[k], c = this.upgCost(s, k);
      out.push({ key: 'egg_' + k, upg: k, label: u.label, ico: u.ico, pos: { x: K.PADS_X[i], y: K.PADS_Y }, price: c || 0, maxed: c === null, sub: `${s.lv[k]}/${u.max}` });
    });
    const nc = this.coopCost(s);
    if (nc !== null) out.push({ key: 'egg_newcoop', label: 'New Coop', ico: '🏠', pos: { x: K.COOP_X[s.coops], y: K.NEWCOOP_Y }, price: nc, sub: `${s.coops}/6` });
    return out;
  },
  onPad(g, pad) {
    const s = this.state(g), st = this.ready(g), K = CFG.EGGFARM;
    if (pad.key === 'egg_newcoop') {
      s.coops = Math.min(6, s.coops + 1); st.obs = st.obsCar = null;
      st.coopPop[s.coops - 1] = 0.8;
      g.floats.push({ x: K.COOP_X[s.coops - 1], y: K.COOP.y0 - 40, text: '🏠 A new coop!', color: '#ffe08a', t: 0, dur: 1.6, big: true });
      Sfx.unlock(); Haptics.success();
      return;
    }
    const k = pad.upg; if (!k) return;
    s.lv[k] = Math.min(K.UPG[k].max, s.lv[k] + 1);
    const say = { hatch: '🐣 Faster hatcher!', coop: `🏡 Bigger coops! ${this.cap(s)} hens each`, feed: '🌾 Yummy feed: more eggs!', box: `📦 Bigger boxes! ${this.boxEggs(s)} eggs`, truck: '🚚 Another egg truck!', fancy: '✨ Fancier eggs: worth more!' }[k];
    g.floats.push({ x: pad.pos.x, y: pad.pos.y - 60, text: say, color: '#ffe08a', t: 0, dur: 1.6, big: true });
    if (k === 'truck') this.syncTrucks(g);
  },

  // ======================= the one button =======================
  action(g) {
    const st = this.st; if (!st) return null;
    const p = g.player, K = CFG.EGGFARM, s = this.state(g);
    if (this.busy(g)) return null;
    if (g.driving) {
      // the egg truck out on the farm: back in through the big barn door
      if (g.area === 'town' && g.vehicle === st.spare && U.dist(p.x, p.y, CFG.BARN.DOOR_OUT.x, CFG.BARN.DOOR_OUT.y) < 70) return { label: '🚚 Drive into the barn', run: (gg) => this.driveIn(gg) };
      return null;
    }
    if (!this.inHall(g)) return null;
    if (st.peek) return { label: '👀 Back out', run: () => { st.peek = null; } };
    if (st.lucky && U.dist(p.x, p.y, st.lucky.x, st.lucky.y) < 70) return { label: '🎈 Catch the lucky egg!', run: (gg) => this.catchLucky(gg) };
    if (U.dist(p.x, p.y, K.HATCHER.btn.x, K.HATCHER.btn.y) < 44) return { label: '🐣 Hatch!', run: (gg) => this.hatch(gg, false) };
    if (st.stack.length && !st.packing) {
      if (U.dist(p.x, p.y, K.PACK.x, K.PACK.y) < K.PACK.r) return { label: '📦 Pack the eggs', run: (gg) => this.startPacking(gg, 'pile') };
      if (U.dist(p.x, p.y, K.TRUCK_SPOT.x, K.TRUCK_SPOT.y) < K.TRUCK_SPOT.r) return { label: '📦 Pack the eggs', run: (gg) => this.startPacking(gg, 'truck') };
    }
    if (U.dist(p.x, p.y, K.CORN.spot.x, K.CORN.spot.y) < 44) return { label: '🌽 Scatter corn', run: (gg) => this.scatterCorn(gg) };
    for (let i = 0; i < s.coops; i++) if (U.dist(p.x, p.y, K.COOP_X[i], K.CHICK_Y + 4) < 30) return { label: '👀 Peek inside', run: () => { st.peek = { c: i, t: 6 }; p.moving = false; Sfx.chime(); Haptics.tap(); } };
    return null;
  },
  hatch(g, auto) {
    const st = this.ready(g), s = this.state(g), K = CFG.EGGFARM, O = K.HATCHER.out;
    if (!auto) { if (st.refill > 0) return false; st.refill = this.refill(s); st.press = 0.16; }
    const n = auto ? 1 : this.perPress(s);
    let made = 0;
    for (let k = 0; k < n; k++) {
      const c = this.coopWithRoom(s); if (c < 0) break;
      s.hens[c]++; s.hatched++; made++;
      if (st.chicks.length < K.CHICK_MAX) {
        st.incoming[c]++;
        st.chicks.push({ x: O.x, y: O.y, path: this.chickPath(c), i: 0, c, t: 0, pop: 0.35 + k * 0.1, ph: Math.random() * 6 });
      } else st.coopPop[c] = 0.3;
    }
    if (!made) {
      st.fullFlash = 1.2;
      if (!auto && st.peepT <= 0) { st.peepT = 1; g.floats.push({ x: O.x - 40, y: O.y - 60, text: 'All full! 🏠', color: '#ffe08a', t: 0, dur: 1.2, big: true }); }
      return false;
    }
    if (!auto) {
      Sfx.pickup(); Haptics.tap();
      if (st.peepT <= 0) { st.peepT = 0.8; g.floats.push({ x: O.x + 10, y: O.y - 46, text: 'Peep! 🐣', color: '#fff3a0', t: 0, dur: 0.9, big: true }); }
    }
    this.checkMilestone(g);
    return true;
  },
  checkMilestone(g) {
    const s = this.state(g), st = this.st, k = this.typeFor(this.hens(s));
    if (k <= s.type) return;
    s.type = k;
    st.banner = { type: k, t: 0 };
    if (g.area === 'barn') { Sfx.unlock(); Haptics.success(); }
  },
  scatterCorn(g) {
    const st = this.ready(g), s = this.state(g), K = CFG.EGGFARM;
    st.boost = K.CORN_TIME;
    for (let i = 0; i < 26; i++) {
      const c = i % s.coops, x1 = K.COOP_X[c] + U.rand(-40, 40), y1 = K.CHICK_Y + U.rand(-6, 30);
      st.corn.push({ x0: K.CORN.x + U.rand(-6, 6), y0: K.CORN.y - 18, x1, y1, t: -i * 0.025, dur: 0.5 + Math.random() * 0.3, life: K.CORN_TIME });
    }
    g.floats.push({ x: K.CORN.x, y: K.CORN.y - 50, text: '🌽 Yum! More eggs!', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    Sfx.chime(); Haptics.tap();
  },

  // ======================= the egg tower =======================
  // where egg i of the tower is drawn (world coords): above the chef's head, leaning with the spring
  stackBase(g) {
    const p = g.player, pz = p.carry > 0 ? Math.min(p.carry, 30) * 4 + 14 : 0;
    return { x: p.x, y: p.y - 56 - pz };
  },
  stackComp() { const st = this.st; return 1 - 0.05 * st.boing * Math.cos(st.boingT * 26); },
  eggPos(g, i, base) {
    const st = this.st, b = base || this.stackBase(g), e = st.stack[Math.min(i, st.stack.length - 1)];
    const ox = e ? e.x : 0, rip = st.rip * Math.sin(i * 0.22 - g.time * 8) * Math.min(1, i / 30);
    return { x: b.x + ox + rip, y: b.y - i * CFG.EGGFARM.SP * this.stackComp() };
  },
  // an egg hops onto the tower from (x, y): it flies on an arc to the top and lands with a squash
  catchEgg(g, x, y, type, delay = 0) {
    const st = this.ready(g);
    if (st.stack.length + st.fly.filter((f) => !f.out).length >= CFG.EGGFARM.STACK_MAX) return false;
    st.fly.push({ out: false, t: type, x0: x, y0: y, k: -delay, dur: 0.3 + Math.random() * 0.06 });
    return true;
  },
  flyingIn() { let n = 0; for (const f of this.st.fly) if (!f.out) n++; return n; },
  startPacking(g, to) {
    const st = this.ready(g);
    if (!st.stack.length) return;
    st.packing = { to, t: 0, x: g.player.x, y: g.player.y, gap: U.clamp(2.4 / st.stack.length, 0.018, 0.08) };   // a whole tower in about two and a half seconds
    g.floats.push({ x: g.player.x, y: g.player.y - 60, text: '📦 Packing!', color: '#ffe08a', t: 0, dur: 1, big: true });
    Haptics.tap();
  },
  packTarget(to) {
    const K = CFG.EGGFARM, st = this.st;
    if (to === 'truck') { const tr = st.trucks.find((t) => t.state === 'dock'); return tr ? { x: tr.x - 18, y: tr.y - 10 } : { x: K.DOCK.x - 20, y: K.DOCK.y - 10 }; }
    return { x: K.BOXPILE.x, y: K.BOXPILE.y - 16 - Math.min(8, Math.ceil(this.state(Game).boxes / 6)) * 4 };
  },
  addEggToBox(g, type) {
    const s = this.state(g), st = this.st;
    s.box++; s.boxEggVal += this.eggValue(s, type);
    if (s.box >= this.boxEggs(s)) { s.boxes++; s.boxVal += s.boxEggVal; s.box = 0; s.boxEggVal = 0; st.boxPop = 0.4; }
  },
  updateStack(g, dt) {
    const st = this.st, s = this.state(g), K = CFG.EGGFARM, p = g.player;
    // the chef's sideways speed (a jump between maps or a teleport counts as standing still)
    let vx = (p.x - st.px) / dt;
    if (g.area !== st.parea || Math.abs(p.x - st.px) > 40 || Math.abs(p.y - st.py) > 40) vx = 0;
    st.px = p.x; st.py = p.y; st.parea = g.area;
    st.vs += (vx - st.vs) * Math.min(1, dt * 10);
    // the lean: a soft spring that swings past its target and settles (leans back when walking, swings over when turning)
    let target = U.clamp(-st.vs * 0.3, -80, 80);
    if (p.moving && !g.driving) target += Math.sin(p.bob * 0.5) * 4;
    st.leanV += (26 * (target - st.lean) - 2.0 * st.leanV) * dt; st.lean += st.leanV * dt;
    st.rip += (Math.min(10, Math.abs(st.leanV) * 0.05) - st.rip) * Math.min(1, dt * 3);
    // each egg follows its own spot on the curve, the higher ones a little later: the tower bends like a noodle
    const n = st.stack.length;
    for (let i = 0; i < n; i++) {
      const e = st.stack[i], f = Math.pow(i / 40, 1.35), tau = 0.03 + 0.0025 * i;
      e.x += (st.lean * f - e.x) * (1 - Math.exp(-dt / tau));
      if (e.land < 9) e.land += dt;
    }
    st.boing = Math.max(0, st.boing - dt * 2.2); st.boingT += dt;
    // eggs in the air
    const base = this.stackBase(g);
    for (let i = st.fly.length - 1; i >= 0; i--) {
      const f = st.fly[i]; f.k += dt;
      if (f.k < f.dur) continue;
      st.fly.splice(i, 1);
      if (f.out) { this.addEggToBox(g, f.t); Sfx.drop(); continue; }
      const top = st.stack[st.stack.length - 1];
      st.stack.push({ t: f.t, x: top ? top.x : 0, land: 0 });
      st.boing = 1; st.boingT = 0; Sfx.pickup();
    }
    // packing: the eggs stream off the top one by one into the boxes
    if (st.packing) {
      const P = st.packing;
      P.t -= dt;
      if (U.dist(p.x, p.y, P.x, P.y) > 100 || g.area !== 'barn' || g.driving) { st.packing = null; st.noScoop = 0.8; }
      else {
        while (P.t <= 0 && st.stack.length) {
          P.t += P.gap;
          const i = st.stack.length - 1, at = this.eggPos(g, i, base), e = st.stack.pop(), to = this.packTarget(P.to);
          st.fly.push({ out: true, t: e.t, x0: at.x, y0: at.y, x1: to.x + U.rand(-8, 8), y1: to.y + U.rand(-3, 3), k: 0, dur: 0.38 + Math.min(0.5, Math.abs(at.y - to.y) / 2400) });
        }
        if (!st.stack.length) { st.packing = null; st.noScoop = 0.8; }
      }
    }
    st.noScoop = Math.max(0, st.noScoop - dt);
    s.stack = st.stack.map((e) => e.t);
  },
  // scooping at the belt's end and the hopper, and loose eggs jumping onto the tower as the chef walks by
  updateCollect(g, dt) {
    const st = this.st, s = this.state(g), K = CFG.EGGFARM, p = g.player;
    if (g.area !== 'barn' || g.driving || this.busy(g) || st.packing || st.noScoop > 0) return;
    const room = () => st.stack.length + this.flyingIn() < K.STACK_MAX;
    if (U.dist(p.x, p.y, K.COLLECT.x, K.COLLECT.y) < K.COLLECT.r) {
      st.scoopT -= dt;
      while (st.scoopT <= 0 && room()) {
        st.scoopT += K.SCOOP_GAP;
        const end = st.belt.find((t) => t.x >= K.BELT.x1 - 50);
        if (end) {
          end.n--; this.catchEgg(g, end.x, K.BELT.y - 6, end.type);
          if (end.n <= 0) st.belt.splice(st.belt.indexOf(end), 1);
        } else if (s.hopper > 0) {
          s.hopper--; const H = K.PACKER.hopper; this.catchEgg(g, H.x + U.rand(-8, 8), H.y - 4, s.type);
        } else { st.scoopT = 0; break; }
      }
    } else st.scoopT = 0;
    // the magnet: loose eggs near the chef hop on, boing boing
    let pulled = 0;
    for (let i = st.strays.length - 1; i >= 0; i--) {
      const e = st.strays[i];
      if (e.z > 0.5 || U.dist(p.x, p.y, e.x, e.y) > K.MAGNET || !room()) continue;
      st.strays.splice(i, 1); this.catchEgg(g, e.x, e.y - 6, e.type, pulled * 0.06); pulled++;
    }
    st.magT = Math.max(0, st.magT - dt);
    if (pulled && st.magT <= 0) { st.magT = 1.4; g.floats.push({ x: p.x + 30, y: p.y - 40, text: 'Boing boing! 🥚', color: '#fff3a0', t: 0, dur: 1, big: true }); Sfx.clean(); }
  },

  // ======================= trucks =======================
  syncTrucks(g) {
    const st = this.st, s = this.state(g), want = this.truckCount(s);
    while (st.trucks.length < want) st.trucks.push({ state: 'ready', x: 0, y: CFG.EGGFARM.DOCK.y, angle: 0, t: 0, idle: 0, boxes: 0, value: 0, n: st.trucks.length, loadT: 0 });
  },
  pay(g, amt) {
    const s = this.state(g), st = this.st, K = CFG.EGGFARM;
    amt = Math.round(amt); if (amt <= 0) return;
    s.earned += amt; st.m.secEarned += amt;
    const at = { x: K.HALL.x1 - 20, y: K.DOCK.y };
    if (g.area === 'barn' && !g.driving) Shop.pocket(g, amt, at);
    else s.bank += amt;
    if (g.area === 'barn') g.floats.push({ x: at.x - 40, y: at.y - 56, text: 'Beep beep! 💰', color: '#fff3a0', t: 0, dur: 1.2, big: true });
  },
  updateTrucks(g, dt) {
    const st = this.st, s = this.state(g), K = CFG.EGGFARM, D = K.DOCK, doorX = K.HALL.x1;
    this.syncTrucks(g);
    let dockFree = !st.trucks.some((t) => t.state === 'in' || t.state === 'dock' || (t.state === 'out' && t.x < doorX + 150));   // one truck at the dock at a time
    let transit = 0;
    for (const tr of st.trucks) {
      transit += tr.value;
      if (tr.state === 'ready') {
        if (dockFree) { dockFree = false; tr.state = 'in'; tr.x = doorX + 170; tr.y = D.y; tr.angle = Math.PI; }
      } else if (tr.state === 'in') {
        tr.x = Math.max(D.x, tr.x - 170 * dt);
        if (tr.x <= D.x) { tr.state = 'dock'; tr.t = 0; tr.idle = 0; tr.angle = 0; }
      } else if (tr.state === 'dock') {
        tr.t += dt; tr.idle += dt; tr.loadT -= dt;
        const cap = this.truckCap(s);
        if (tr.loadT <= 0 && s.boxes > 0 && tr.boxes < cap) {
          tr.loadT = 0.22; const v = s.boxVal / s.boxes;
          s.boxes--; s.boxVal = Math.max(0, s.boxVal - v); tr.boxes++; tr.value += v; tr.idle = 0;
          st.boxFly.push({ x0: K.BOXPILE.x, y0: K.BOXPILE.y - 20, x1: tr.x - 20 + ((tr.boxes - 1) % 4) * 10, y1: tr.y - 8, k: 0 });
        }
        if (tr.boxes >= cap || (tr.boxes > 0 && (tr.idle > 4 || tr.t > 20))) { tr.state = 'out'; tr.t = 0; s.shipped += tr.boxes; }
      } else if (tr.state === 'out') {
        tr.t += dt; tr.x += Math.min(220, 60 + tr.t * 260) * dt;
        if (tr.x > doorX + 200) { tr.state = 'away'; tr.t = K.TRUCK_TRIP; }
      } else if (tr.state === 'away') {
        tr.t -= dt;
        if (tr.t <= 0) { this.pay(g, tr.value); tr.value = 0; tr.boxes = 0; tr.state = 'ready'; }
      }
    }
    s.transit = transit;
    for (let i = st.boxFly.length - 1; i >= 0; i--) { st.boxFly[i].k += dt / 0.3; if (st.boxFly[i].k >= 1) st.boxFly.splice(i, 1); }
  },

  // ======================= driving the egg truck =======================
  parkSpare() { const v = this.st.spare, K = CFG.EGGFARM; v.where = 'barn'; v.x = K.SPARE.x; v.y = K.SPARE.y; v.angle = 0; v.vx = 0; v.vy = 0; },
  driveOut(g) {
    const v = this.st.spare, p = g.player, F = CFG.EGGFARM.FARM_SPOT;
    v.where = 'town'; v.x = F.x; v.y = F.y; v.angle = Math.PI / 2; v.vx = 0; v.vy = 0;
    g.area = 'town'; p.x = v.x; p.y = v.y; p.moving = false; p.hasMoved = true; g.cameraSnap = true;
    this.st.fade = 0.45; this.st.packing = null;
    g.floats.push({ x: v.x, y: v.y - 60, text: 'Off to the farm! 🚚', color: '#ffe08a', t: 0, dur: 1.4, big: true });
  },
  driveIn(g) {
    const v = this.st.spare, p = g.player, K = CFG.EGGFARM;
    v.where = 'barn'; v.x = K.HALL.x1 - 40; v.y = K.DOCK.y + 4; v.angle = Math.PI; v.vx = 0; v.vy = 0;
    g.area = 'barn'; g.driving = true; g.vehicle = v; p.x = v.x; p.y = v.y; p.moving = false; p.hasMoved = true; g.cameraSnap = true;
    this.st.fade = 0.45; Sfx.ding();
  },

  // ======================= the lucky egg =======================
  spawnLucky(g) {
    const K = CFG.EGGFARM, H = K.HALL, dir = Math.random() < 0.5 ? 1 : -1;
    this.st.lucky = { x: dir > 0 ? H.x0 - 40 : H.x1 + 40, y: U.rand(4640, 4790), dir, t: 0 };
  },
  catchLucky(g) {
    const st = this.st, s = this.state(g), L = st.lucky; if (!L) return;
    st.lucky = null; st.luckyT = U.rand(CFG.EGGFARM.LUCKY_EVERY[0], CFG.EGGFARM.LUCKY_EVERY[1]);
    const amt = Math.max(50, Math.round(s.rate * 20));
    s.earned += amt;
    Shop.pocket(g, amt, { x: L.x, y: L.y - 70 });
    for (let i = 0; i < 6; i++) this.catchEgg(g, L.x + U.rand(-12, 12), L.y - 70, Math.max(1, s.type), i * 0.07);
    for (let i = 0; i < 3; i++) g.fx.push({ kind: 'sparkle', x0: L.x + U.rand(-20, 20), y0: L.y - 70 + U.rand(-20, 20), x1: L.x, y1: L.y - 70, t: -i * 0.1, dur: 0.6 });
    g.floats.push({ x: L.x, y: L.y - 120, text: '🍀 Lucky egg!', color: '#9ef01a', t: 0, dur: 1.6, big: true });
    Haptics.success();
  },

  // ======================= every frame =======================
  update(g, dt) {
    const t0 = performance.now();
    const st = this.ready(g), s = this.state(g), K = CFG.EGGFARM, p = g.player;
    if (st.awayMsg) { g.toast(st.awayMsg); st.awayMsg = null; }
    st.fade = Math.max(0, st.fade - dt);
    st.refill = Math.max(0, st.refill - dt); st.press = Math.max(0, st.press - dt); st.fullFlash = Math.max(0, st.fullFlash - dt); st.peepT = Math.max(0, st.peepT - dt);
    st.boxPop = Math.max(0, st.boxPop - dt);
    for (let i = 0; i < 6; i++) st.coopPop[i] = Math.max(0, st.coopPop[i] - dt);
    if (this.inHall(g) && !s.seen) { s.seen = true; g.floats.push({ x: p.x, y: p.y - 70, text: '🐣 The Egg Farm!', color: '#ffe08a', t: 0, dur: 2, big: true }); }
    // the automatic hatcher
    const every = this.autoEvery(s);
    if (every > 0) { st.autoT += dt; if (st.autoT >= every) { st.autoT = 0; this.hatch(g, true); } }
    // chicks waddle to their coops
    for (let i = st.chicks.length - 1; i >= 0; i--) {
      const c = st.chicks[i]; c.t += dt; c.pop = Math.max(0, c.pop - dt);
      if (c.pop > 0) continue;
      const wp = c.path[c.i];
      if (U.moveToward(c, wp.x, wp.y, 105, dt)) { c.i++; if (c.i >= c.path.length) { st.chicks.splice(i, 1); st.incoming[c.c] = Math.max(0, st.incoming[c.c] - 1); st.coopPop[c.c] = 0.35; } }
    }
    // laying: each coop's hens fill its nest boxes; eggs drop through the hatch onto the belt
    st.boost = Math.max(0, st.boost - dt);
    const lay = this.layTime(s), mul = st.boost > 0 ? 2 : 1, Bt = K.BELT;
    for (let i = 0; i < s.coops; i++) {
      st.acc[i] = Math.min(80, st.acc[i] + s.hens[i] * dt / lay * mul);
      if (st.acc[i] < 1) continue;
      const dx = K.COOP_X[i] + 24;
      if (st.belt.some((t) => Math.abs(t.x - dx) < Bt.gap)) continue;
      const n = Math.min(Math.floor(st.acc[i]), 50); st.acc[i] -= n; s.laid += n;
      st.belt.push({ x: dx, n, type: s.type, drop: 0.22, roll: n <= 2 && st.strays.length < K.STRAY_MAX && Math.random() < 0.06 ? dx + U.rand(50, 300) : null });
    }
    // the belt: eggs ride east and queue at the end; the odd one rolls off onto the floor
    st.phase += Bt.speed * dt;
    st.belt.sort((a, b) => b.x - a.x);
    let limit = Bt.x1;
    for (let i = 0; i < st.belt.length; i++) {
      const tk = st.belt[i]; tk.drop = Math.max(0, tk.drop - dt);
      tk.x = Math.min(tk.x + Bt.speed * dt, limit); limit = tk.x - Bt.gap;
      if (tk.roll && tk.x >= Math.min(tk.roll, Bt.x1 - 60)) {
        for (let k = 0; k < tk.n && st.strays.length < K.STRAY_MAX; k++) st.strays.push({ x: tk.x + k * 8, y: Bt.y + 4, type: tk.type, z: 14, vz: -60, vy: U.rand(70, 120), vx: U.rand(-30, 30), t: 0 });
        st.belt.splice(i, 1); i--; limit = i >= 0 ? st.belt[i].x - Bt.gap : Bt.x1; continue;
      }
    }
    const front = st.belt[0];
    if (front && front.x >= Bt.x1 - 0.5 && s.hopper + front.n <= K.HOPPER_CAP) { s.hopper += front.n; st.belt.shift(); }
    // loose eggs bounce and roll to a stop
    for (const e of st.strays) {
      if (e.z > 0 || e.vz !== 0) { e.vz += 420 * dt; e.z = Math.max(0, e.z - e.vz * dt); if (e.z <= 0) { e.vz = e.vz > 120 ? -e.vz * 0.35 : 0; e.z = 0; } }
      e.x += e.vx * dt; e.y += e.vy * dt; e.vx *= Math.pow(0.04, dt); e.vy *= Math.pow(0.04, dt);
      e.x = U.clamp(e.x, K.HALL.x0 + 16, K.HALL.x1 - 16); e.y = U.clamp(e.y, Bt.y + 20, K.HALL.y1 - 16); e.t += dt;
    }
    // the packer boxes eggs from its hopper
    if (s.boxes < K.BOX_PILE_CAP) {
      st.packT += this.packRate(s) * dt;
      if (s.hopper <= 0) st.packT = Math.min(st.packT, 1);
      while (st.packT >= 1 && s.hopper > 0) { st.packT -= 1; s.hopper--; this.addEggToBox(g, s.type); st.packAnim += 1; }
    }
    this.updateTrucks(g, dt);
    this.updateCollect(g, dt);
    this.updateStack(g, dt);
    // the egg money waiting by the dock
    if (s.bank > 0 && g.area === 'barn' && !g.driving && U.dist(p.x, p.y, K.CASH.x, K.CASH.y) < 46) { const amt = Math.round(s.bank); s.bank = 0; Shop.pocket(g, amt, K.CASH); }
    s.rate = Shop.meter(st.m, dt, s.rate);
    // corn on the floor
    for (let i = st.corn.length - 1; i >= 0; i--) { const c = st.corn[i]; c.t += dt; c.life -= dt; if (c.life <= 0) st.corn.splice(i, 1); }
    // the lucky egg drifts across the hall on its balloon
    if (st.lucky) {
      const L = st.lucky; L.t += dt; L.x += L.dir * 55 * dt;
      if (this.inHall(g) && !g.driving && U.dist(p.x, p.y, L.x, L.y) < 34) this.catchLucky(g);
      else if (L.x < K.HALL.x0 - 80 || L.x > K.HALL.x1 + 80) { st.lucky = null; st.luckyT = U.rand(K.LUCKY_EVERY[0], K.LUCKY_EVERY[1]); }
    } else if (this.inHall(g)) { st.luckyT -= dt; if (st.luckyT <= 0) this.spawnLucky(g); }
    // the rooster crows when dawn breaks
    const ph = typeof AtmosphereExt !== 'undefined' ? AtmosphereExt.phase : 'day';
    if (ph === 'dawn' && st.lastPhase && st.lastPhase !== 'dawn') this.crow(g);
    st.lastPhase = ph; st.crow = Math.max(0, st.crow - dt);
    // peeking ends when you walk away
    if (st.peek) { st.peek.t -= dt; if (st.peek.t <= 0 || p.moving || !this.inHall(g)) st.peek = null; }
    if (st.banner) { st.banner.t += dt; if (st.banner.t > 3.2) st.banner = null; }
    // driving the spare truck: out through the back door onto the farm; left on the farm, it drives home by itself
    const v = st.spare, mine = g.driving && g.vehicle === v;
    if (mine && g.area === 'barn' && v.x > K.HALL.x1 - 30 && v.y > K.DOOR.y0 - 20 && v.y < K.DOOR.y1 + 20) this.driveOut(g);   // anywhere at the big back door counts
    if (!mine && v.where === 'town' && (g.area !== 'town' || U.dist(p.x, p.y, v.x, v.y) > 1000)) this.parkSpare();
    st.frameMs = performance.now() - t0;
  },
  crow(g) {
    const st = this.st, R = CFG.EGGFARM.ROOSTER;
    st.crow = 2.4;
    if (g.area === 'barn') { g.floats.push({ x: R.x, y: R.y - 54, text: 'Cock-a-doodle-doo! 🐓', color: '#ffe08a', t: 0, dur: 2, big: true }); Sfx.chime(); }
  },
  home(g) {
    const st = this.st; if (!st) return;
    st.peek = null; st.packing = null; st.fade = 0; st.banner = null;
    for (const f of st.fly) { if (f.out) this.addEggToBox(g, f.t); else st.stack.push({ t: f.t, x: 0, land: 9 }); }
    st.fly.length = 0;
    this.parkSpare();
  },

  // ======================= hints =======================
  hint(g) {
    const st = this.st; if (!st) return undefined;
    const p = g.player, K = CFG.EGGFARM, s = this.state(g);
    if (this.busy(g)) return undefined;
    if (g.area === 'town') {
      const dd = U.dist(p.x, p.y, CFG.BARN.DOOR_OUT.x, CFG.BARN.DOOR_OUT.y);   // only on the farm, near the barn
      if (g.driving && g.vehicle === st.spare && dd < 260) return { text: 'Drive the egg truck back into the barn! 🚚', target: dd < 70 ? null : CFG.BARN.DOOR_OUT };
      return undefined;
    }
    if (g.area !== 'barn' || (BarnExt.st && BarnExt.st.loft)) return undefined;
    if (!this.inHall(g)) return st.stack.length && !g.driving ? { text: 'Take the eggs through the arch! 🥚', target: CFG.BARN.arch.mat } : undefined;
    if (g.driving) return g.vehicle === st.spare ? { text: 'Drive out of the big back door! 🚚', target: { x: K.HALL.x1 - 30, y: (K.DOOR.y0 + K.DOOR.y1) / 2 } } : undefined;
    if (st.peek) return { text: 'Look at all the hens! 🐔', target: null };
    if (st.lucky && U.dist(p.x, p.y, st.lucky.x, st.lucky.y) < 320) return { text: 'Catch the lucky egg! 🎈', target: { x: st.lucky.x, y: st.lucky.y } };
    if (st.packing) return { text: 'Packing the eggs! 📦', target: null };
    if (st.stack.length) {
      const nearTruck = U.dist(p.x, p.y, K.TRUCK_SPOT.x, K.TRUCK_SPOT.y) < U.dist(p.x, p.y, K.PACK.x, K.PACK.y), to = nearTruck ? K.TRUCK_SPOT : K.PACK;
      return { text: 'Pack the eggs! 📦', target: U.dist(p.x, p.y, to.x, to.y) < to.r ? null : to };
    }
    const btn = K.HATCHER.btn, atBtn = U.dist(p.x, p.y, btn.x, btn.y) < 44;
    if (this.hens(s) === 0) return { text: 'Press the big red button! 🐣', target: atBtn ? null : btn };
    if (s.bank > 0) return { text: 'Grab the egg money! 💰', target: K.CASH };
    if (s.hopper >= 6 || st.belt.some((t) => t.x >= K.BELT.x1 - 50)) return { text: 'Scoop up the eggs! 🥚', target: U.dist(p.x, p.y, K.COLLECT.x, K.COLLECT.y) < K.COLLECT.r ? null : K.COLLECT };
    if (this.room(s) <= 0) {
      const pad = this.pads(g).filter((q) => q.key === 'egg_newcoop' || q.key === 'egg_coop').find((q) => !q.maxed);
      if (pad) return { text: 'The coops are full! Buy more room 🏠', target: pad.pos };
    }
    return { text: 'Hatch more chicks! 🐣', target: atBtn ? null : btn };
  },

  // ======================= sprites (cached once, drawn with drawImage) =======================
  EW: 18, EH: 22,
  eggPath(c, x, y, rx, ry) {
    c.beginPath(); c.moveTo(x, y - ry);
    c.bezierCurveTo(x + rx * 0.8, y - ry, x + rx, y - ry * 0.1, x + rx, y + ry * 0.25);
    c.bezierCurveTo(x + rx, y + ry * 0.75, x + rx * 0.55, y + ry, x, y + ry);
    c.bezierCurveTo(x - rx * 0.55, y + ry, x - rx, y + ry * 0.75, x - rx, y + ry * 0.25);
    c.bezierCurveTo(x - rx, y - ry * 0.1, x - rx * 0.8, y - ry, x, y - ry);
    c.closePath();
  },
  paintEgg(c, type, x, y, rx, ry) {
    const path = () => this.eggPath(c, x, y, rx, ry);
    c.save(); path(); c.clip();
    if (type === 0) { const gr = c.createRadialGradient(x - rx * 0.4, y - ry * 0.4, 1, x, y, ry * 1.3); gr.addColorStop(0, '#fffdf6'); gr.addColorStop(1, '#efdcbc'); c.fillStyle = gr; c.fillRect(x - rx - 1, y - ry - 1, rx * 2 + 2, ry * 2 + 2); c.fillStyle = 'rgba(200,160,110,0.25)'; for (const [dx, dy] of [[3, 2], [-2, 5], [1, -4]]) { c.beginPath(); c.arc(x + dx, y + dy, 0.7, 0, Math.PI * 2); c.fill(); } }
    else if (type === 1) { const gr = c.createLinearGradient(x - rx, y - ry, x + rx, y + ry); gr.addColorStop(0, '#fff6b8'); gr.addColorStop(0.45, '#ffcf3a'); gr.addColorStop(1, '#d98a0c'); c.fillStyle = gr; c.fillRect(x - rx - 1, y - ry - 1, rx * 2 + 2, ry * 2 + 2); c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x - rx, y + 2); c.quadraticCurveTo(x, y - 1, x + rx, y + 3); c.stroke(); }
    else if (type === 2) { const cols = ['#ff5a5f', '#ff9f1c', '#ffe14d', '#5ad15a', '#3fa7ff', '#a66bff']; const h = (ry * 2) / cols.length; cols.forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.moveTo(x - rx - 1, y - ry + i * h); for (let k = 0; k <= 4; k++) c.lineTo(x - rx + k * rx / 2, y - ry + i * h + (k % 2 ? 1.4 : -0.6)); c.lineTo(x + rx + 1, y - ry + (i + 1) * h + 1.5); c.lineTo(x - rx - 1, y - ry + (i + 1) * h + 1.5); c.closePath(); c.fill(); }); }
    else if (type === 3) { const gr = c.createRadialGradient(x - rx * 0.3, y - ry * 0.3, 1, x, y, ry * 1.2); gr.addColorStop(0, '#8a6cf0'); gr.addColorStop(1, '#1e1450'); c.fillStyle = gr; c.fillRect(x - rx - 1, y - ry - 1, rx * 2 + 2, ry * 2 + 2); c.fillStyle = '#fff'; for (const [dx, dy, r] of [[-3, -4, 0.8], [3, -1, 0.6], [-1, 4, 0.7], [4, 5, 0.5], [-4, 2, 0.5], [1, -7, 0.5]]) { c.beginPath(); c.arc(x + dx, y + dy, r, 0, Math.PI * 2); c.fill(); } c.fillStyle = '#ffe14d'; this.star(c, x + 2, y + 1, 2.4, 1.1); c.strokeStyle = 'rgba(255,182,255,0.8)'; c.lineWidth = 1; c.beginPath(); c.ellipse(x, y + 2, rx * 1.2, 2, -0.3, 0, Math.PI * 2); c.stroke(); }
    else { c.fillStyle = '#e2a64f'; c.fillRect(x - rx - 1, y - ry - 1, rx * 2 + 2, ry * 2 + 2); c.fillStyle = '#ffd65a'; this.eggPath(c, x, y + 0.5, rx - 2, ry - 2.2); c.fill(); c.fillStyle = '#c8382c'; for (const [dx, dy] of [[-2.5, -3], [2.5, 0], [-1.5, 4], [3, -5.5]]) { c.beginPath(); c.arc(x + dx, y + dy, 1.7, 0, Math.PI * 2); c.fill(); } c.fillStyle = '#3a9d3a'; c.beginPath(); c.ellipse(x + 1, y + 5.5, 1.6, 0.9, 0.6, 0, Math.PI * 2); c.fill(); }
    c.restore();
    c.fillStyle = 'rgba(255,255,255,0.75)'; c.beginPath(); c.ellipse(x - rx * 0.38, y - ry * 0.42, rx * 0.26, ry * 0.3, -0.3, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(90,60,30,0.4)'; c.lineWidth = 0.8; path(); c.stroke();
  },
  star(c, x, y, R, r) { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fill(); },
  // a hen's head and shoulders, dressed for each egg type (peeking out of a coop window)
  paintHen(c, type, x, y) {
    const body = ['#fffaf0', '#ffcf3a', '#fffaf0', '#cbb8ff', '#ff9a3d'][type];
    c.fillStyle = body; c.beginPath(); c.ellipse(x, y + 7, 10, 7, 0, 0, Math.PI * 2); c.fill();
    if (type === 2) { const cols = ['#ff5a5f', '#ffe14d', '#3fa7ff']; cols.forEach((col, i) => { c.fillStyle = col; c.fillRect(x - 9, y + 5 + i * 2.6, 18, 1.6); }); }
    c.fillStyle = body; c.beginPath(); c.arc(x, y - 2, 7, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(90,60,30,0.35)'; c.lineWidth = 0.8; c.beginPath(); c.arc(x, y - 2, 7, 0, Math.PI * 2); c.stroke();
    if (type !== 4) { c.fillStyle = '#e53935'; for (const [dx, dy, r] of [[-3, -9, 2.4], [0, -10, 2.8], [3, -9, 2.4]]) { c.beginPath(); c.arc(x + dx, y + dy, r, 0, Math.PI * 2); c.fill(); } }
    c.fillStyle = '#e53935'; c.beginPath(); c.ellipse(x + 2.5, y + 4, 1.5, 2.3, 0, 0, Math.PI * 2); c.fill();   // wattle
    c.fillStyle = '#ffb347'; c.beginPath(); c.moveTo(x + 5, y - 1.5); c.lineTo(x + 10, y); c.lineTo(x + 5, y + 1.8); c.closePath(); c.fill();
    c.fillStyle = '#2b1d14'; c.beginPath(); c.arc(x + 2.5, y - 3, 1.3, 0, Math.PI * 2); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(x + 2.9, y - 3.4, 0.45, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,120,140,0.45)'; c.beginPath(); c.arc(x - 1.5, y + 0.5, 1.6, 0, Math.PI * 2); c.fill();
    if (type === 1) { c.fillStyle = '#ff5fa2'; c.beginPath(); c.moveTo(x - 6, y - 7); c.lineTo(x - 11, y - 10); c.lineTo(x - 11, y - 4); c.closePath(); c.fill(); c.beginPath(); c.moveTo(x - 6, y - 7); c.lineTo(x - 1, y - 11); c.lineTo(x - 2, y - 4); c.closePath(); c.fill(); c.fillStyle = '#ff9fcb'; c.beginPath(); c.arc(x - 6, y - 7, 1.6, 0, Math.PI * 2); c.fill(); }
    else if (type === 2) { c.fillStyle = '#3fa7ff'; c.beginPath(); c.moveTo(x - 6, y - 7); c.lineTo(x - 1, y - 20); c.lineTo(x + 3, y - 8); c.closePath(); c.fill(); c.fillStyle = '#ffe14d'; c.fillRect(x - 4.5, y - 12, 6, 1.8); c.fillStyle = '#ff5a5f'; c.fillRect(x - 3, y - 16, 4, 1.6); c.fillStyle = '#ff5fa2'; c.beginPath(); c.arc(x - 1, y - 20, 1.8, 0, Math.PI * 2); c.fill(); }
    else if (type === 3) { c.fillStyle = 'rgba(190,230,255,0.28)'; c.beginPath(); c.arc(x + 1, y - 3, 10.5, 0, Math.PI * 2); c.fill(); c.strokeStyle = 'rgba(220,245,255,0.95)'; c.lineWidth = 1.3; c.beginPath(); c.arc(x + 1, y - 3, 10.5, 0, Math.PI * 2); c.stroke(); c.fillStyle = 'rgba(255,255,255,0.8)'; c.beginPath(); c.ellipse(x - 4, y - 8, 2.4, 1.3, -0.6, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#9aa0a8'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 1, y - 13.5); c.lineTo(x + 1, y - 18); c.stroke(); c.fillStyle = '#ffe14d'; this.star(c, x + 1, y - 19.5, 2.6, 1.2); }
    else if (type === 4) { c.fillStyle = '#ffd23f'; c.beginPath(); c.moveTo(x - 6, y - 7); c.lineTo(x - 7, y - 15); c.lineTo(x - 3.5, y - 11); c.lineTo(x, y - 16); c.lineTo(x + 3.5, y - 11); c.lineTo(x + 7, y - 15); c.lineTo(x + 6, y - 7); c.closePath(); c.fill(); c.fillStyle = '#e4572e'; c.beginPath(); c.arc(x, y - 9.5, 1.3, 0, Math.PI * 2); c.fill(); c.fillStyle = '#3fa7ff'; c.beginPath(); c.arc(x - 4, y - 9, 0.9, 0, Math.PI * 2); c.arc(x + 4, y - 9, 0.9, 0, Math.PI * 2); c.fill(); }
  },
  paintChick(c, x, y) {
    c.fillStyle = '#ffd93b'; c.beginPath(); c.arc(x, y, 6.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ffe98a'; c.beginPath(); c.arc(x - 1.5, y - 2, 3, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ffd93b'; c.beginPath(); c.ellipse(x - 4, y + 1, 3, 2, -0.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ff9f1c'; c.beginPath(); c.moveTo(x + 5, y - 1.5); c.lineTo(x + 9, y); c.lineTo(x + 5, y + 1.5); c.closePath(); c.fill();
    c.fillStyle = '#2b1d14'; c.beginPath(); c.arc(x + 2.5, y - 2, 1.1, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#ffd93b'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x - 1, y - 6); c.lineTo(x - 2, y - 9); c.moveTo(x + 1, y - 6); c.lineTo(x + 1.5, y - 9); c.stroke();
  },
  paintBox(c, w, h) {
    c.fillStyle = '#c99a5b'; U.roundRect(c, 0.5, 2, w - 1, h - 2.5, 2.5); c.fill();
    c.fillStyle = '#f6dcb4'; U.roundRect(c, 0.5, 0.5, w - 1, h - 3, 2.5); c.fill();
    c.fillStyle = '#e8c48f'; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(4 + k * 6, h / 2 - 1, 2.2, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = '#e4572e'; c.beginPath(); c.ellipse(w - 3.2, 3.2, 1.5, 1.9, 0, 0, Math.PI * 2); c.fill();
  },
  makeSprites() {
    const S = 3, mk = (w, h, fn) => { const cv = document.createElement('canvas'); cv.width = Math.ceil(w * S); cv.height = Math.ceil(h * S); const c = cv.getContext('2d'); c.scale(S, S); fn(c); return cv; };
    const T = CFG.EGGFARM.TYPES;
    this.sprites = {
      egg: T.map((_, i) => mk(this.EW, this.EH, (c) => this.paintEgg(c, i, this.EW / 2, this.EH / 2, 7.2, 9.6))),
      hen: T.map((_, i) => mk(28, 34, (c) => this.paintHen(c, i, 13, 20))),
      chick: mk(20, 18, (c) => this.paintChick(c, 9, 10)),
      box: mk(20, 13, (c) => this.paintBox(c, 20, 13)),
    };
  },
  spr() { if (!this.sprites) this.makeSprites(); return this.sprites; },
  drawEgg(ctx, type, x, y, s = 1) { const E = this.EW * s, H = this.EH * s; ctx.drawImage(this.spr().egg[type], x - E / 2, y - H / 2, E, H); },

  // ======================= static art (cached background) =======================
  bgKey(g) { return g.area === 'barn' && this.st ? 'egg' + this.state(g).coops : ''; },
  paintAfter(r, g, area) { if (area === 'barn') this.paintHall(r, g); },
  paintHall(r, g) {
    const ctx = r.ctx, K = CFG.EGGFARM, H = K.HALL, w = K.WALL, B = CFG.BARN, R = B.room, A = B.arch, W = CFG.AREAS.barn.WORLD, s = this.state(g);
    const planks = (x0, y0, x1, y1, a, b, step, vertical) => {
      for (let v = vertical ? x0 : y0, k = 0; v < (vertical ? x1 : y1); v += step, k++) {
        ctx.fillStyle = k % 2 ? a : b;
        if (vertical) ctx.fillRect(v, y0, Math.min(step, x1 - v), y1 - y0); else ctx.fillRect(x0, v, x1 - x0, Math.min(step, y1 - v));
        ctx.fillStyle = 'rgba(0,0,0,0.12)'; if (vertical) ctx.fillRect(v, y0, 1.5, y1 - y0); else ctx.fillRect(x0, v, x1 - x0, 1.5);
      }
    };
    // ---- the rafters and the tall back wall right of the old barn
    const bx0 = R.x1 + w, wallTop = 4196;
    ctx.fillStyle = '#3a2213'; ctx.fillRect(bx0, W.y0, W.x1 - bx0, wallTop - W.y0);
    ctx.fillStyle = '#4e301a'; for (let x = bx0 + 30; x < W.x1; x += 120) ctx.fillRect(x, W.y0, 14, wallTop - W.y0);
    ctx.strokeStyle = '#5b3a1a'; ctx.lineWidth = 10; for (let x = bx0 + 30; x < W.x1 - 60; x += 240) { ctx.beginPath(); ctx.moveTo(x + 7, wallTop - 10); ctx.lineTo(x + 127, W.y0 + 40); ctx.lineTo(x + 247, wallTop - 10); ctx.stroke(); }
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(bx0, W.y0 + 34, W.x1 - bx0, 12); ctx.fillRect(bx0, wallTop - 14, W.x1 - bx0, 14);
    // bunting across the rafters
    for (let i = 0; i < 22; i++) { const x = bx0 + 20 + i * 36, sag = Math.sin((i / 21) * Math.PI) * 26, y = W.y0 + 58 + sag; ctx.fillStyle = K.COOP_COLORS[i % 6]; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 30, y + 2); ctx.lineTo(x + 15, y + 22); ctx.closePath(); ctx.fill(); }
    ctx.strokeStyle = '#f5f0dc'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let i = 0; i <= 22; i++) { const x = bx0 + 20 + i * 36, y = W.y0 + 58 + Math.sin((i / 21) * Math.PI) * 26; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke();
    planks(bx0, wallTop, H.x1 + w, H.y0, '#8e2a2a', '#9c3232', 20, true);
    ctx.fillStyle = '#f5f0dc'; ctx.fillRect(bx0, wallTop, H.x1 + w - bx0, 4); ctx.fillRect(bx0, H.y0 - 4, H.x1 + w - bx0, 4);
    // ---- the strip under the old barn, the side walls, the bottom wall
    const wallRect = (x, y, ww, hh, vertical) => { planks(x, y, x + ww, y + hh, '#8e2a2a', '#9c3232', 20, !vertical); ctx.fillStyle = '#f5f0dc'; if (vertical) { ctx.fillRect(x, y, 3, hh); ctx.fillRect(x + ww - 3, y, 3, hh); } else { ctx.fillRect(x, y, ww, 3); ctx.fillRect(x, y + hh - 3, ww, 3); } };
    wallRect(R.x0 - w, R.y1 + w, A.x0 - (R.x0 - w), H.y0 - R.y1 - w, false); wallRect(A.x1, R.y1 + w, R.x1 + w - A.x1, H.y0 - R.y1 - w, false);
    wallRect(H.x0 - w, R.y1 + w, w, H.y1 - R.y1, true);
    wallRect(H.x1, R.y1 + w, w, K.DOOR.y0 - R.y1 - w, true); wallRect(H.x1, K.DOOR.y1, w, H.y1 + w - K.DOOR.y1, true);
    wallRect(H.x0 - w, H.y1, H.x1 - H.x0 + 2 * w, w, false);
    // ---- the hall floor: wide pale boards, a little straw
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(H.x0, H.y0, H.x1 - H.x0, 5);
    planks(H.x0, H.y0, H.x1, H.y1, '#d2a66a', '#caa064', 28, false);
    ctx.fillStyle = 'rgba(0,0,0,0.1)'; for (let i = 0; i < 46; i++) ctx.fillRect(H.x0 + ((i * 263) % (H.x1 - H.x0 - 20)) + 10, H.y0 + Math.floor(((i * 89) % (H.y1 - H.y0)) / 28) * 28, 1.5, 28);
    ctx.strokeStyle = 'rgba(240,207,122,0.85)'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 120; i++) { const x = H.x0 + 14 + ((i * 337) % (H.x1 - H.x0 - 28)), y = H.y0 + 12 + ((i * 151) % (H.y1 - H.y0 - 24)), a = (i * 1.7) % 6.3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 8, y + Math.sin(a) * 4); ctx.stroke(); }
    // ---- the archway through from the old barn: the passage floor, two posts and a painted arch with an egg on top
    ctx.fillStyle = '#b5773a'; ctx.fillRect(A.x0, R.y1, A.x1 - A.x0, H.y0 - R.y1 + 2);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = R.y1; y < H.y0; y += 13) ctx.fillRect(A.x0, y, A.x1 - A.x0, 1.5);
    for (const px of [A.x0 - 10, A.x1]) { ctx.fillStyle = '#f5f0dc'; ctx.fillRect(px, R.y1 - 6, 10, H.y0 - R.y1 + 8); ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(px + 7, R.y1 - 6, 3, H.y0 - R.y1 + 8); }
    ctx.strokeStyle = '#f5f0dc'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(A.x0 - 5, R.y1); ctx.quadraticCurveTo((A.x0 + A.x1) / 2, R.y1 - 46, A.x1 + 5, R.y1); ctx.stroke();
    ctx.strokeStyle = '#f2b134'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(A.x0 - 5, R.y1 - 1); ctx.quadraticCurveTo((A.x0 + A.x1) / 2, R.y1 - 47, A.x1 + 5, R.y1 - 1); ctx.stroke();
    this.paintEgg(ctx, 1, (A.x0 + A.x1) / 2, R.y1 - 26, 9, 12);
    // a welcome mat on the hall side, with chick footprints running to the hatcher
    const M = K.ARCH_MAT; ctx.fillStyle = '#e0b44c'; U.roundRect(ctx, M.x - 30, M.y - 10, 60, 22, 6); ctx.fill(); ctx.fillStyle = '#f2c94c'; U.roundRect(ctx, M.x - 25, M.y - 6, 50, 14, 4); ctx.fill();
    ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#8d5a2b'; ctx.fillText('🐣 🥚 🐔', M.x, M.y + 1);
    // ---- the chicks' path: a yellow painted lane with footprints, from the hatcher along the coops
    const O = K.HATCHER.out, CY = K.CHICK_Y, lastX = K.COOP_X[5] - 28;
    ctx.fillStyle = 'rgba(255,217,59,0.32)'; U.roundRect(ctx, O.x + 6, O.y + 2, 28, CY - O.y + 8, 10); ctx.fill(); U.roundRect(ctx, O.x + 6, CY - 12, lastX - O.x + 10, 24, 12); ctx.fill();
    ctx.fillStyle = 'rgba(201,140,20,0.55)';
    for (let x = O.x + 40; x < lastX; x += 26) for (const [dx, dy] of [[0, -4], [11, 4]]) { const fx = x + dx, fy = CY + dy; ctx.beginPath(); ctx.moveTo(fx + 4, fy); ctx.lineTo(fx - 1, fy - 2.5); ctx.moveTo(fx + 4, fy); ctx.lineTo(fx - 1, fy + 2.5); ctx.moveTo(fx + 4, fy); ctx.lineTo(fx - 2, fy); ctx.strokeStyle = 'rgba(201,140,20,0.55)'; ctx.lineWidth = 1.4; ctx.stroke(); }
    // ---- the hatcher's base and pipes (its shiny top, dome and button are drawn every frame)
    const Hc = K.HATCHER;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(Hc.x0 + 4, Hc.y1 - 4, Hc.x1 - Hc.x0, 12);
    // ---- the corn sack
    const C = K.CORN;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(C.x + 3, C.y + 14, 28, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8d3a3'; U.roundRect(ctx, C.x - 24, C.y - 22, 48, 38, 12); ctx.fill(); ctx.fillStyle = '#d6bd85'; U.roundRect(ctx, C.x - 24, C.y - 22, 48, 10, 8); ctx.fill();
    ctx.fillStyle = '#ffd23f'; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(C.x - 14 + (i % 5) * 7, C.y - 24 + Math.floor(i / 5) * 4, 2.6, 0, Math.PI * 2); ctx.fill(); }
    ctx.font = r.font(16); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🌽', C.x, C.y + 1);
    // ---- the coops (bought ones) and dashed ghosts where new ones will go
    for (let i = 0; i < 6; i++) this.paintCoop(r, g, i, i < s.coops);
    // ---- the belt's frame (the moving rubber is drawn every frame)
    const Bt = K.BELT;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(Bt.x0 + 3, Bt.y - Bt.half + 6, Bt.x1 - Bt.x0, Bt.half * 2 + 4);
    ctx.fillStyle = '#5d636b'; ctx.fillRect(Bt.x0, Bt.y - Bt.half + 2, Bt.x1 - Bt.x0, Bt.half * 2 + 6);
    ctx.fillStyle = '#4a4f56'; for (let x = Bt.x0 + 10; x < Bt.x1 - 4; x += 40) ctx.fillRect(x, Bt.y + Bt.half + 6, 5, 4);
    // ---- the egg packer: a big blue machine with a hopper where the belt ends and a chute down to the box pile
    const P = K.PACKER;
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(P.x0 + 6, P.y0 + 8, P.x1 - P.x0, P.y1 - P.y0);
    ctx.fillStyle = '#2f6fb5'; U.roundRect(ctx, P.x0, P.y0, P.x1 - P.x0, P.y1 - P.y0, 10); ctx.fill();
    ctx.fillStyle = '#3b86d8'; U.roundRect(ctx, P.x0 + 4, P.y0 + 4, P.x1 - P.x0 - 8, 26, 8); ctx.fill();
    ctx.fillStyle = '#9fd3ff'; U.roundRect(ctx, P.x0 + 52, P.y0 + 38, 70, 44, 6); ctx.fill();   // the window onto the packing arm
    ctx.fillStyle = '#1f4f86'; for (const [rx, ry] of [[8, 8], [P.x1 - P.x0 - 8, 8], [8, P.y1 - P.y0 - 8], [P.x1 - P.x0 - 8, P.y1 - P.y0 - 8]]) { ctx.beginPath(); ctx.arc(P.x0 + rx, P.y0 + ry, 2.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#8c939b'; ctx.beginPath(); ctx.moveTo(P.x0 - 8, P.y0 + 18); ctx.lineTo(P.x0 + 48, P.y0 + 18); ctx.lineTo(P.x0 + 36, P.y0 + 60); ctx.lineTo(P.x0 + 4, P.y0 + 60); ctx.closePath(); ctx.fill();   // the hopper
    ctx.fillStyle = '#5d636b'; ctx.beginPath(); ctx.ellipse(P.x0 + 20, P.y0 + 20, 28, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b2f35'; ctx.beginPath(); ctx.ellipse(P.x0 + 20, P.y0 + 21, 23, 6.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd23f'; U.roundRect(ctx, P.x0 + 56, P.y0 + 8, 64, 18, 6); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🥚 → 📦', P.x0 + 88, P.y0 + 17);
    ctx.fillStyle = '#8c939b'; ctx.beginPath(); ctx.moveTo(K.BOXPILE.x - 16, P.y1 - 2); ctx.lineTo(K.BOXPILE.x + 16, P.y1 - 2); ctx.lineTo(K.BOXPILE.x + 22, K.BOXPILE.y - 14); ctx.lineTo(K.BOXPILE.x - 22, K.BOXPILE.y - 14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#6b7178'; for (let y = P.y1 + 4; y < K.BOXPILE.y - 16; y += 7) ctx.fillRect(K.BOXPILE.x - 16, y, 32, 2);
    // the pallet under the box pile
    const BP = K.BOXPILE; ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(BP.x - 30, BP.y + 4, 64, 16);
    ctx.fillStyle = '#b8862c'; ctx.fillRect(BP.x - 32, BP.y - 4, 64, 20); ctx.fillStyle = '#8d5a2b'; for (let k = 0; k < 4; k++) ctx.fillRect(BP.x - 32, BP.y - 4 + k * 6, 64, 2);
    // ---- the pack spot and the truck's loading spot: big painted box icons on the floor
    for (const S of [K.PACK, K.TRUCK_SPOT]) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(S.x, S.y, 34, 20, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(242,177,52,0.9)'; ctx.lineWidth = 3; ctx.setLineDash([7, 5]); ctx.beginPath(); ctx.ellipse(S.x, S.y, 34, 20, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      ctx.font = r.font(18); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('📦', S.x, S.y + 1);
    }
    // ---- the truck bay at the back door: yellow lines, arrows, and the big door open onto the farm
    const D = K.DOCK;
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 4; ctx.strokeRect(D.x - 60, D.y - 34, 150, 68);
    ctx.fillStyle = 'rgba(255,210,63,0.55)'; for (let x = D.x - 40; x < D.x + 80; x += 34) { ctx.beginPath(); ctx.moveTo(x + 12, D.y + 44); ctx.lineTo(x, D.y + 38); ctx.lineTo(x, D.y + 50); ctx.closePath(); ctx.fill(); }
    const out = ctx.createLinearGradient(H.x1, 0, H.x1 + w, 0); out.addColorStop(0, '#79b85e'); out.addColorStop(1, '#9fd37f');
    ctx.fillStyle = out; ctx.fillRect(H.x1, K.DOOR.y0, w + 26, K.DOOR.y1 - K.DOOR.y0);
    ctx.fillStyle = '#b9a27a'; ctx.fillRect(H.x1, D.y - 16, w + 26, 32);   // the farm track outside
    ctx.fillStyle = '#f5f0dc'; ctx.fillRect(H.x1 - 3, K.DOOR.y0 - 6, w + 3, 6); ctx.fillRect(H.x1 - 3, K.DOOR.y1, w + 3, 6);
    // the spare truck's bay: a parking box with an egg painted in it
    const SP = K.SPARE; ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3; ctx.strokeRect(SP.x - 58, SP.y - 32, 116, 64);
    // ---- the pads' corner: a little rug under the row of pads
    ctx.fillStyle = 'rgba(158,90,46,0.18)'; U.roundRect(ctx, K.PADS_X[0] - 60, K.PADS_Y - 40, K.PADS_X[5] - K.PADS_X[0] + 120, 80, 16); ctx.fill();
  },
  coopWindow(i, row, k) { const K = CFG.EGGFARM, x0 = K.COOP_X[i] - K.COOP.w / 2; return { x: x0 + 7 + k * 28, y: K.COOP.y0 + 9 + row * 29, w: 22, h: 19 }; },
  paintCoop(r, g, i, owned) {
    const ctx = r.ctx, K = CFG.EGGFARM, cx = K.COOP_X[i], C = K.COOP, x0 = cx - C.w / 2, x1 = cx + C.w / 2, y0 = C.y0, y1 = C.y1, col = K.COOP_COLORS[i];
    if (!owned) {
      ctx.strokeStyle = 'rgba(80,50,30,0.35)'; ctx.lineWidth = 3; ctx.setLineDash([9, 7]);
      ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x0, y0); ctx.lineTo(cx, y0 - 28); ctx.lineTo(x1, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.setLineDash([]);
      ctx.font = r.font(20); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.globalAlpha = 0.45; ctx.fillText('🏠', cx, (y0 + y1) / 2); ctx.globalAlpha = 1;
      return;
    }
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x0 + 5, y0 + 6, C.w, y1 - y0);
    ctx.fillStyle = '#fff1d6'; ctx.fillRect(x0, y0, C.w, y1 - y0);
    ctx.fillStyle = 'rgba(0,0,0,0.06)'; for (let x = x0 + 12; x < x1; x += 12) ctx.fillRect(x, y0, 1.5, y1 - y0);
    ctx.fillStyle = col; ctx.fillRect(x0, y1 - 6, C.w, 6); ctx.fillRect(x0, y0, 4, y1 - y0); ctx.fillRect(x1 - 4, y0, 4, y1 - y0);
    // the roof
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x0 - 8, y0 + 6); ctx.lineTo(cx, y0 - 30); ctx.lineTo(x1 + 8, y0 + 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(x0 - 8, y0 + 6); ctx.lineTo(cx, y0 - 30); ctx.lineTo(cx, y0 - 22); ctx.lineTo(x0 + 2, y0 + 6); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1.5; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x0 - 8 + k * 8, y0 + 6 - k * 4.2); ctx.lineTo(x1 + 8 - k * 8, y0 + 6 - k * 4.2); ctx.stroke(); }
    // the windows (hens peek out of them, drawn every frame): two rows of three
    for (let row = 0; row < 2; row++) for (let k = 0; k < 3; k++) {
      const q = this.coopWindow(i, row, k);
      ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, q.x - 2, q.y - 2, q.w + 4, q.h + 4, 5); ctx.fill();
      ctx.fillStyle = '#2e1c10'; U.roundRect(ctx, q.x, q.y, q.w, q.h, 4); ctx.fill();
      ctx.fillStyle = '#e0b44c'; ctx.fillRect(q.x, q.y + q.h - 4, q.w, 4);
      ctx.fillStyle = col; ctx.fillRect(q.x - 3, q.y + q.h, q.w + 6, 3);   // a little sill
    }
    // the little door (where the ramp goes up) and the egg hatch over the belt
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, cx - 37, y1 - 22, 18, 22, 6); ctx.fill(); ctx.fillStyle = '#2e1c10'; U.roundRect(ctx, cx - 34, y1 - 19, 12, 19, 5); ctx.fill();
    ctx.fillStyle = '#8d5a2b'; ctx.beginPath(); ctx.arc(cx + 24, y1 - 9, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#2e1c10'; ctx.beginPath(); ctx.arc(cx + 24, y1 - 9, 4.5, 0, Math.PI * 2); ctx.fill();
  },

  // ======================= moving things =======================
  dynamic(r, g) {
    if (g.area !== 'barn' || !this.st) return;
    const ctx = r.ctx, K = CFG.EGGFARM, st = this.st, s = this.state(g), t = g.time, S = this.spr();
    const vx0 = r.camX - 60, vx1 = r.camX + r.viewW + 60, vy0 = r.camY - 80, vy1 = r.camY + r.viewH + 80;
    const vis = (x0, y0, x1, y1) => x1 > vx0 && x0 < vx1 && y1 > vy0 && y0 < vy1;
    if (vis(K.BOARD.x0, K.BOARD.y0, K.BOARD.x1, K.BOARD.y1)) this.drawBoard(r, g);
    // ---- the belt: moving rubber, rails, rollers; eggs riding it
    const Bt = K.BELT, y0 = Bt.y - Bt.half, y1 = Bt.y + Bt.half;
    if (vis(Bt.x0, y0, Bt.x1, y1)) {
      ctx.fillStyle = '#3a3f46'; ctx.fillRect(Bt.x0 + 2, y0 + 2, Bt.x1 - Bt.x0 - 4, y1 - y0 - 4);
      ctx.fillStyle = 'rgba(255,255,255,0.13)'; const off = st.phase % 12, xa = Math.max(Bt.x0 + 2, vx0), xb = Math.min(Bt.x1 - 4, vx1);
      for (let x = xa - ((xa - Bt.x0 - off) % 12); x < xb; x += 12) if (x > Bt.x0 + 2) ctx.fillRect(x, y0 + 3, 3, y1 - y0 - 6);
      ctx.fillStyle = '#b9c0c8'; ctx.fillRect(Bt.x0, y0, Bt.x1 - Bt.x0, 3); ctx.fillRect(Bt.x0, y1 - 3, Bt.x1 - Bt.x0, 3);
      for (const q of [Bt.x0, Bt.x1]) { ctx.fillStyle = '#7d848d'; U.roundRect(ctx, q - 13, Bt.y - 13, 26, 26, 5); ctx.fill(); ctx.fillStyle = '#a9b0b8'; ctx.beginPath(); ctx.arc(q, Bt.y, 9, 0, Math.PI * 2); ctx.fill(); const a = st.phase / 9; ctx.strokeStyle = '#5d636b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(q + Math.cos(a) * 8, Bt.y + Math.sin(a) * 8); ctx.lineTo(q - Math.cos(a) * 8, Bt.y - Math.sin(a) * 8); ctx.stroke(); }
      for (const tk of st.belt) {
        if (tk.x < vx0 || tk.x > vx1) continue;
        const dy = tk.drop > 0 ? -(tk.drop / 0.22) * 14 : 0, n = Math.min(3, tk.n);
        for (let k = 0; k < n; k++) this.drawEgg(ctx, tk.type, tk.x - k * 5, Bt.y - 5 + dy - (k === 1 ? 4 : 0), 0.8);
      }
      // the ramps the chicks climb over the belt into each coop
      for (let i = 0; i < s.coops; i++) {
        const x = K.COOP_X[i] - 28;
        ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x - 6, K.COOP.y1, 14, K.CHICK_Y - 8 - K.COOP.y1);
        ctx.fillStyle = '#c9a36b'; ctx.fillRect(x - 7, K.COOP.y1 - 2, 14, K.CHICK_Y - 6 - K.COOP.y1);
        ctx.fillStyle = '#8d5a2b'; for (let y = K.COOP.y1 + 3; y < K.CHICK_Y - 8; y += 7) ctx.fillRect(x - 7, y, 14, 2);
      }
    }
    // ---- the hens peeking out of the coops, the counters, FULL signs
    const cap = this.cap(s);
    for (let i = 0; i < s.coops; i++) {
      const cx = K.COOP_X[i], C = K.COOP, x0 = cx - C.w / 2;
      if (!vis(x0 - 20, C.y0 - 70, x0 + C.w + 20, C.y1)) continue;
      const shown = Math.max(0, s.hens[i] - st.incoming[i]), lit = shown <= 0 ? 0 : Math.max(1, Math.min(6, Math.ceil(6 * shown / cap)));
      const pop = st.coopPop[i] > 0 ? Math.sin(st.coopPop[i] * 18) * 2 : 0;
      for (let k = 0; k < lit; k++) {
        const q = this.coopWindow(i, k < 3 ? 1 : 0, k % 3);   // the bottom row fills first; heads poke out over the sill
        const bob = Math.sin(t * 2.4 + i * 1.7 + k * 1.3) * 1.5 + (st.boost > 0 ? -Math.abs(Math.sin(t * 9 + k)) * 2.5 : 0) + pop;
        ctx.save(); ctx.beginPath(); ctx.rect(q.x - 6, q.y - 24, q.w + 12, q.h + 24); ctx.clip();
        ctx.drawImage(S.hen[s.type], q.x - 2, q.y - 13 + bob, 26, 31.5);
        ctx.restore();
      }
      // the counter on the roof, and the FULL sign
      const full = s.hens[i] >= cap, label = `${shown}/${cap}`;
      ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const bw = ctx.measureText(label).width + 22;
      ctx.fillStyle = full ? '#e4572e' : 'rgba(43,29,20,0.85)'; U.roundRect(ctx, cx - bw / 2, C.y0 - 48, bw, 17, 8); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillText('🐔' + label, cx, C.y0 - 39);
      if (full) {
        const wob = Math.sin(t * 5 + i) * 0.06 + (st.fullFlash > 0 ? Math.sin(st.fullFlash * 20) * 0.12 : 0);
        ctx.save(); ctx.translate(cx, C.y0 + 30); ctx.rotate(wob);
        ctx.fillStyle = '#fff'; U.roundRect(ctx, -32, -13, 64, 26, 6); ctx.fill();
        ctx.fillStyle = '#e4572e'; U.roundRect(ctx, -29, -10, 58, 20, 5); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = r.font(14, 900); ctx.fillText('FULL', 0, 1);
        ctx.restore();
      }
      if (st.boost > 0) { ctx.font = r.font(12); ctx.fillText('🌽', cx + 38, C.y0 - 26 + Math.sin(t * 6 + i) * 2); }
    }
    // ---- the hatcher: chrome body, glass dome with wobbling eggs, the big red button and its refill ring
    const Hc = K.HATCHER;
    if (vis(Hc.x0, Hc.y0 - 80, Hc.x1, Hc.y1 + 10)) this.drawHatcher(r, g);
    // ---- the packer's hopper pile, the arm in the window, the box pile, the cash pile
    const P = K.PACKER;
    if (vis(P.x0 - 40, P.y0 - 40, P.x1 + 20, K.BOXPILE.y + 30)) {
      const hn = Math.min(14, Math.ceil(s.hopper / 6));
      for (let k = 0; k < hn; k++) this.drawEgg(ctx, s.type, P.x0 + 6 + (k % 5) * 7 + (Math.floor(k / 5) % 2) * 3, P.y0 + 22 - Math.floor(k / 5) * 5, 0.7);
      if (s.hopper > 0) { ctx.fillStyle = 'rgba(43,29,20,0.85)'; U.roundRect(ctx, P.x0 - 4, P.y0 - 24, 46, 16, 8); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🥚' + s.hopper, P.x0 + 19, P.y0 - 16); }
      // the packing arm swings in the window
      const ax = P.x0 + 87, ay = P.y0 + 44, sw = Math.sin(st.packAnim * Math.PI) * 0.8;
      ctx.save(); ctx.beginPath(); ctx.rect(P.x0 + 52, P.y0 + 38, 70, 44); ctx.clip();
      ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(ax, ay - 6); ctx.lineTo(ax + Math.sin(sw) * 20, ay + 14); ctx.stroke();
      this.drawEgg(ctx, s.type, ax + Math.sin(sw) * 20, ay + 22, 0.7);
      ctx.drawImage(S.box, P.x0 + 72, P.y0 + 66, 28, 18);
      ctx.restore();
      // gears
      ctx.fillStyle = '#ffd23f'; for (const [gx, gy, gr] of [[P.x1 - 12, P.y0 + 46, 7], [P.x1 - 12, P.y0 + 66, 5]]) { ctx.save(); ctx.translate(gx, gy); ctx.rotate(st.packAnim * 0.6 * (gr === 7 ? 1 : -1.4)); for (let k = 0; k < 6; k++) { ctx.rotate(Math.PI / 3); ctx.fillRect(-1.5, -gr - 2.5, 3, 4); } ctx.beginPath(); ctx.arc(0, 0, gr, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#2f6fb5'; ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffd23f'; ctx.restore(); }
      // the box pile on the pallet
      const BP = K.BOXPILE, nb = Math.min(24, s.boxes), pop = st.boxPop > 0 ? Math.sin(st.boxPop * 16) * 2 : 0;
      for (let k = 0; k < nb; k++) { const col = k % 3, row = Math.floor(k / 3); ctx.drawImage(S.box, BP.x - 30 + col * 20 + (row % 2) * 2, BP.y - 10 - row * 7 - (k === nb - 1 ? pop : 0), 20, 13); }
      // the box being filled right now (hand packing lands here)
      ctx.drawImage(S.box, BP.x - 10, BP.y - 22 - Math.min(8, Math.ceil(nb / 3)) * 7 + 6, 20, 13);
      if (s.boxes > 0) { ctx.fillStyle = 'rgba(43,29,20,0.85)'; U.roundRect(ctx, BP.x + 16, BP.y - 40, 40, 16, 8); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('📦' + s.boxes, BP.x + 36, BP.y - 32); }
    }
    if (s.bank > 0) r.drawCashPile(K.CASH.x, K.CASH.y, Math.round(s.bank));
    for (const b of st.boxFly) { const k = U.easeOut(b.k); ctx.drawImage(S.box, U.lerp(b.x0, b.x1, k) - 10, U.lerp(b.y0, b.y1, k) - 6 - Math.sin(b.k * Math.PI) * 26, 20, 13); }
    // ---- loose eggs on the floor and corn
    for (const c of st.corn) {
      if (c.t < 0) continue;
      const k = Math.min(1, c.t / c.dur), x = U.lerp(c.x0, c.x1, k), y = U.lerp(c.y0, c.y1, k) - Math.sin(k * Math.PI) * 40;
      ctx.globalAlpha = Math.min(1, c.life / 1.5); ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(x, y, 2.6, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    }
    for (const e of st.strays) {
      if (e.x < vx0 || e.x > vx1 || e.y < vy0 || e.y > vy1) continue;
      ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.beginPath(); ctx.ellipse(e.x, e.y + 4, 6, 2.5, 0, 0, Math.PI * 2); ctx.fill();
      this.drawEgg(ctx, e.type, e.x, e.y - 4 - e.z);
      if (Math.sin(t * 3 + e.x) > 0.6) { ctx.fillStyle = 'rgba(255,255,255,0.9)'; this.star(ctx, e.x + 8, e.y - 14, 3, 1.2); }
    }
  },
  drawHatcher(r, g) {
    const ctx = r.ctx, K = CFG.EGGFARM, Hc = K.HATCHER, st = this.st, s = this.state(g), t = g.time, S = this.spr();
    const x0 = Hc.x0, x1 = Hc.x1, y0 = Hc.y0, y1 = Hc.y1, cx = (x0 + x1) / 2;
    // body
    const body = ctx.createLinearGradient(x0, 0, x1, 0); body.addColorStop(0, '#b9c3cc'); body.addColorStop(0.35, '#f4f8fb'); body.addColorStop(0.6, '#c7d0d8'); body.addColorStop(1, '#8e99a4');
    ctx.fillStyle = body; U.roundRect(ctx, x0, y0 - 6, x1 - x0, y1 - y0 + 6, 14); ctx.fill();
    ctx.strokeStyle = '#6e7a86'; ctx.lineWidth = 2; U.roundRect(ctx, x0, y0 - 6, x1 - x0, y1 - y0 + 6, 14); ctx.stroke();
    ctx.fillStyle = '#ff6fa8'; U.roundRect(ctx, x0 + 6, y0 + 28, x1 - x0 - 12, 8, 4); ctx.fill();
    // the glass dome with eggs wobbling under a warm lamp
    const dy = y0 - 8;
    ctx.fillStyle = '#6e7a86'; U.roundRect(ctx, cx - 54, dy - 4, 108, 10, 4); ctx.fill();
    ctx.fillStyle = 'rgba(255,214,120,0.35)'; ctx.beginPath(); ctx.arc(cx, dy, 50, Math.PI, 0); ctx.closePath(); ctx.fill();
    for (let k = 0; k < 7; k++) {
      const ex = cx - 36 + k * 12, ey = dy - 8 - (k % 2) * 7, wob = Math.sin(t * (6 + k) + k * 2) * (st.press > 0 ? 0.4 : 0.15);
      ctx.save(); ctx.translate(ex, ey); ctx.rotate(wob); ctx.drawImage(S.egg[k % 3 === 0 ? s.type : 0], -7, -9, 14, 17); ctx.restore();
    }
    ctx.fillStyle = 'rgba(200,235,255,0.35)'; ctx.beginPath(); ctx.arc(cx, dy, 50, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, dy, 50, Math.PI * 1.15, Math.PI * 1.45); ctx.stroke();
    ctx.strokeStyle = '#6e7a86'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, dy, 50, Math.PI, 0); ctx.stroke();
    ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(cx, dy - 50, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,230,120,0.4)'; ctx.beginPath(); ctx.arc(cx, dy - 50, 12 + Math.sin(t * 4) * 2, 0, Math.PI * 2); ctx.fill();
    // little blinking lights
    for (let k = 0; k < 4; k++) { ctx.fillStyle = Math.floor(t * 3 + k) % 4 === 0 ? '#9ef01a' : ['#ff5a5f', '#ffd23f', '#3fa7ff', '#9ef01a'][k]; ctx.beginPath(); ctx.arc(x0 + 18 + k * 12, y0 + 14, 3.5, 0, Math.PI * 2); ctx.fill(); }
    // the outlet chute on the right where chicks pop out
    ctx.fillStyle = '#8e99a4'; U.roundRect(ctx, x1 - 6, y0 + 30, 20, 34, 6); ctx.fill(); ctx.fillStyle = '#3a3f46'; U.roundRect(ctx, x1 - 2, y0 + 36, 14, 24, 5); ctx.fill();
    // the big red button: pushed down for a moment, a ring that fills while it refills
    const bx = cx + 18, by = y1 - 22, push = st.press > 0 ? 3 : 0, ready = st.refill <= 0;
    ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.ellipse(bx, by + 6, 24, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9e1b1b'; ctx.beginPath(); ctx.ellipse(bx, by + 3, 19, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = ready ? '#ff3b3b' : '#d93030'; ctx.beginPath(); ctx.ellipse(bx, by - 2 + push, 18, 11 - push * 0.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.ellipse(bx - 6, by - 6 + push, 6, 3, -0.3, 0, Math.PI * 2); ctx.fill();
    if (!ready) r.drawProgressRing(bx, by - 2, 25, 1 - st.refill / this.refill(s), '#9ef01a');
    else if (Math.sin(t * 5) > 0) { ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(bx, by - 2, 24, 15, 0, 0, Math.PI * 2); ctx.stroke(); }
    ctx.font = r.font(16); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🐣', x0 + 36, y1 - 24);
  },
  // the giant board on the back wall: each egg type with its hen and the hen count that unlocks it
  drawBoard(r, g) {
    const ctx = r.ctx, K = CFG.EGGFARM, Bd = K.BOARD, s = this.state(g), S = this.spr(), t = g.time, T = K.TYPES, n = this.hens(s);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; U.roundRect(ctx, Bd.x0 + 5, Bd.y0 + 6, Bd.x1 - Bd.x0, Bd.y1 - Bd.y0, 12); ctx.fill();
    ctx.fillStyle = '#6b4a2b'; U.roundRect(ctx, Bd.x0, Bd.y0, Bd.x1 - Bd.x0, Bd.y1 - Bd.y0, 12); ctx.fill();
    ctx.fillStyle = '#2f6b45'; U.roundRect(ctx, Bd.x0 + 8, Bd.y0 + 8, Bd.x1 - Bd.x0 - 16, Bd.y1 - Bd.y0 - 16, 8); ctx.fill();
    const pw = (Bd.x1 - Bd.x0 - 40) / T.length;
    for (let i = 0; i < T.length; i++) {
      const px = Bd.x0 + 20 + i * pw + pw / 2, py = Bd.y0 + 52, open = s.type >= i, cur = s.type === i;
      if (cur) { ctx.fillStyle = `rgba(255,236,150,${0.25 + 0.15 * Math.sin(t * 4)})`; U.roundRect(ctx, px - pw / 2 + 6, Bd.y0 + 14, pw - 12, Bd.y1 - Bd.y0 - 46, 10); ctx.fill(); }
      ctx.fillStyle = open ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.arc(px - 12, py, 30, 0, Math.PI * 2); ctx.fill();
      if (open) {
        ctx.drawImage(S.hen[i], px - 34, py - 34, 44, 53);
        const bob = cur ? Math.sin(t * 3) * 2 : 0; this.drawEgg(ctx, i, px + 26, py + 8 + bob, 1.5);
        ctx.fillStyle = '#ffd23f'; this.star(ctx, px + 30, py - 24, 7, 3);
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = r.font(30, 900); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', px - 12, py + 2);
        ctx.globalAlpha = 0.35; this.drawEgg(ctx, i, px + 26, py + 8, 1.5); ctx.globalAlpha = 1;
      }
      // how many hens it needs
      ctx.fillStyle = open ? '#ffd23f' : 'rgba(255,255,255,0.85)'; U.roundRect(ctx, px - 30, Bd.y1 - 44, 60, 18, 9); ctx.fill();
      ctx.fillStyle = '#2b1d14'; ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(open ? T[i].ico + ' ✓' : '🐔 ' + T[i].at, px, Bd.y1 - 35);
      if (i < T.length - 1) { ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = r.font(16); ctx.fillText('➜', px + pw / 2, py); }
    }
    // the progress bar to the next egg type, with a chick walking along it
    const next = T[s.type + 1], x0 = Bd.x0 + 24, x1 = Bd.x1 - 86, by = Bd.y1 - 17;
    const k = next ? U.clamp((n - T[s.type].at) / (next.at - T[s.type].at), 0, 1) : 1;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; U.roundRect(ctx, x0, by - 5, x1 - x0, 10, 5); ctx.fill();
    ctx.fillStyle = '#9ef01a'; U.roundRect(ctx, x0, by - 5, Math.max(10, (x1 - x0) * k), 10, 5); ctx.fill();
    ctx.drawImage(S.chick, x0 + (x1 - x0) * k - 10, by - 15 + Math.abs(Math.sin(t * 6)) * -2, 20, 18);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; U.roundRect(ctx, x1 + 8, by - 9, 52, 18, 9); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🐔 ' + n, x1 + 34, by);
  },

  entities(r, g, items) {
    if (!this.st) return;
    const st = this.st, K = CFG.EGGFARM;
    if (st.spare.where === g.area) items.push({ y: st.spare.y + 14, draw: () => this.drawTruck(r, g, st.spare, g.driving && g.vehicle === st.spare) });
    if (g.area === 'barn') {
      for (const c of st.chicks) items.push({ y: c.y, draw: () => this.drawChick(r, g, c) });
      for (const tr of st.trucks) if (tr.state === 'in' || tr.state === 'dock' || (tr.state === 'out' && tr.x < K.HALL.x1 + 70)) items.push({ y: tr.y + 14, draw: () => this.drawTruck(r, g, tr, false) });
      items.push({ y: K.HATCHER.y1 + 1, draw: () => this.drawRooster(r, g) });
    }
    const p = g.player;
    if ((st.stack.length || st.fly.length) && !g.driving && !this.busy(g)) items.push({ y: p.y + 1, draw: () => this.drawStack(r, g) });
  },
  drawChick(r, g, c) {
    const ctx = r.ctx, S = this.spr(), w = Math.sin(c.t * 14 + c.ph), hop = c.pop > 0 ? Math.sin((1 - c.pop / 0.35) * Math.PI) * 18 : Math.abs(w) * 2;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(c.x, c.y + 3, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ff9f1c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(c.x - 3, c.y - 3); ctx.lineTo(c.x - 3 + w * 3, c.y + 2); ctx.moveTo(c.x + 3, c.y - 3); ctx.lineTo(c.x + 3 - w * 3, c.y + 2); ctx.stroke();
    const flip = c.i >= 1 && c.path[c.i] && c.path[c.i].x < c.x ? -1 : 1;
    ctx.save(); ctx.translate(c.x, c.y - 11 - hop); ctx.rotate(w * 0.15); ctx.scale(flip, 1); ctx.drawImage(S.chick, -14, -13, 28, 25); ctx.restore();
  },
  drawRooster(r, g) {
    const ctx = r.ctx, R = CFG.EGGFARM.ROOSTER, st = this.st, t = g.time, crowing = st.crow > 0, lift = crowing ? Math.sin(Math.min(1, (2.4 - st.crow) * 3) * Math.PI / 2) * 5 : 0;
    const x = R.x, y = R.y;
    ctx.fillStyle = '#ffb347'; ctx.fillRect(x - 3, y - 6, 2, 7); ctx.fillRect(x + 2, y - 6, 2, 7);
    // the tail: big curly feathers
    for (const [col, a] of [['#2f9e44', -0.9], ['#1f6e9e', -0.5], ['#2b1d14', -0.2]]) { ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 6, y - 14); ctx.quadraticCurveTo(x - 20, y - 30 + a * 6, x - 14 + a * 6, y - 38); ctx.stroke(); }
    ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.ellipse(x, y - 14, 11, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e67e22'; ctx.beginPath(); ctx.ellipse(x + 2, y - 15, 6, 5, 0.4, 0, Math.PI * 2); ctx.fill();
    const flap = crowing ? Math.sin(t * 20) * 0.6 : 0;
    ctx.save(); ctx.translate(x - 2, y - 16); ctx.rotate(-0.3 - flap); ctx.fillStyle = '#a93226'; ctx.beginPath(); ctx.ellipse(0, 0, 7, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    const hx = x + 8, hy = y - 26 - lift;
    ctx.fillStyle = '#e67e22'; ctx.beginPath(); ctx.moveTo(x + 3, y - 18); ctx.lineTo(hx - 3, hy + 2); ctx.lineTo(hx + 4, hy + 3); ctx.lineTo(x + 9, y - 14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f39c12'; ctx.beginPath(); ctx.arc(hx, hy, 5.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e53935'; for (const [dx, dy, rr] of [[-3, -6, 2.6], [0, -7.5, 3], [3, -6, 2.6]]) { ctx.beginPath(); ctx.arc(hx + dx, hy + dy, rr, 0, Math.PI * 2); ctx.fill(); }
    ctx.beginPath(); ctx.ellipse(hx + 2.5, hy + 5, 1.6, 2.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.moveTo(hx + 4, hy - 1.5); ctx.lineTo(hx + 10, hy - (crowing ? 3 : 0)); ctx.lineTo(hx + 4, hy + 0.5); ctx.closePath(); ctx.fill();
    if (crowing) { ctx.beginPath(); ctx.moveTo(hx + 4, hy + 0.5); ctx.lineTo(hx + 9, hy + 3); ctx.lineTo(hx + 4, hy + 2); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(hx + 1.5, hy - 1.5, 1.2, 0, Math.PI * 2); ctx.fill();
    if (crowing) { ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2; for (let k = 0; k < 3; k++) { const rr = 8 + k * 6 + ((t * 30) % 6); ctx.beginPath(); ctx.arc(hx + 6, hy, rr, -0.6, 0.6); ctx.stroke(); } }
  },
  drawTruck(r, g, v, riding) {
    const ctx = r.ctx, K = CFG.EGGFARM, clip = g.area === 'barn' && v.x > K.HALL.x1 - 70;
    ctx.save();
    if (clip) { ctx.beginPath(); ctx.rect(K.HALL.x0 - 100, K.HALL.y0 - 100, K.HALL.x1 + 6 - (K.HALL.x0 - 100), K.HALL.y1 - K.HALL.y0 + 200); ctx.clip(); }
    ctx.translate(v.x, v.y); ctx.rotate(v.angle);
    r.drawVehicle('eggtruck', g, g.s.paint.eggtruck || '#ffd23f', v);
    if (riding) {
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(28, 0, 8, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(30, 0, 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(27, 0, 4.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  },
  // the egg tower over the chef's head: only the eggs on screen are drawn, each a cached sprite
  drawStack(r, g) {
    const ctx = r.ctx, st = this.st, K = CFG.EGGFARM, S = this.spr(), p = g.player, n = st.stack.length, base = this.stackBase(g), f = p.facing || 1;
    // arms up and a little straw tray on the hands
    if (n) {
      ctx.strokeStyle = '#f1c27d'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(p.x - 12, p.y - 24); ctx.lineTo(base.x - 11 + st.stack[0].x * 0.5, base.y + 6); ctx.moveTo(p.x + 12, p.y - 24); ctx.lineTo(base.x + 11 + st.stack[0].x * 0.5, base.y + 6); ctx.stroke();
      ctx.fillStyle = '#c9a36b'; ctx.beginPath(); ctx.ellipse(base.x + st.stack[0].x * 0.6, base.y + 8, 16, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e0b44c'; ctx.beginPath(); ctx.ellipse(base.x + st.stack[0].x * 0.6, base.y + 6, 13, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    }
    const top = r.camY - 20, bottom = r.camY + r.viewH + 20, comp = this.stackComp(), SP = K.SP;
    let last = -1;
    for (let i = 0; i < n; i++) {
      const y = base.y - i * SP * comp;
      if (y > bottom) continue;
      if (y < top) break;
      last = i;
      const e = st.stack[i], rip = st.rip * Math.sin(i * 0.22 - g.time * 8) * Math.min(1, i / 30), x = base.x + e.x + rip;
      const nb = st.stack[Math.min(n - 1, i + 1)], pb = st.stack[Math.max(0, i - 1)], ang = U.clamp((nb.x - pb.x) / (2 * SP), -0.6, 0.6);
      let sx = 1, sy = 1;
      if (e.land < 0.5) { const q = Math.exp(-e.land * 10) * Math.cos(e.land * 28) * 0.32; sx = 1 + q; sy = 1 - q; }
      const m = r.dpr * r.scale, c = Math.cos(ang), s = Math.sin(ang);
      ctx.setTransform(m * c * sx, m * s * sx, -m * s * sy, m * c * sy, (x - r.camX) * m, (y - r.camY) * m);
      ctx.drawImage(S.egg[e.t], -this.EW / 2, -this.EH / 2, this.EW, this.EH);
    }
    const m = r.dpr * r.scale; ctx.setTransform(m, 0, 0, m, -r.camX * m, -r.camY * m);
    // the count: on top of the tower, or pinned to the top of the screen when the tower goes past it
    if (n >= 2) {
      const iTop = n - 1, yTop = base.y - iTop * SP * comp;
      let bx, by;
      const pin = r.camY + 150 / r.scale;   // below the money, the hint and the buttons at the top of the screen
      if (yTop < pin + 6) { const iv = U.clamp(Math.floor((base.y - pin) / (SP * comp)), 0, n - 1); bx = base.x + st.stack[iv].x + 36; by = pin; }
      else { bx = base.x + st.stack[iTop].x; by = yTop - 24; }
      const label = '×' + n;
      ctx.font = r.font(13, 900); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const bw = ctx.measureText(label).width + 30, pulse = st.boing > 0 ? 1 + st.boing * 0.12 : 1;
      ctx.save(); ctx.translate(bx, by); ctx.scale(pulse, pulse);
      ctx.fillStyle = 'rgba(43,29,20,0.88)'; U.roundRect(ctx, -bw / 2, -12, bw, 24, 12); ctx.fill();
      ctx.drawImage(S.egg[st.stack[iTop].t], -bw / 2 + 4, -9, 14, 17);
      ctx.fillStyle = '#ffe08a'; ctx.fillText(label, 8, 1);
      ctx.restore();
    }
    st.drawn = last + 1;
  },
  overlay(r, g) {
    if (!this.st) return;
    const ctx = r.ctx, st = this.st, S = this.spr(), K = CFG.EGGFARM;
    // eggs in the air: onto the tower (homing in on its top) and off it into the boxes
    if (st.fly.length) {
      const base = this.stackBase(g), n = st.stack.length, top = this.eggPos(g, n, base);
      for (const f of st.fly) {
        if (f.k < 0) continue;
        const k = Math.min(1, f.k / f.dur), e = f.out ? k * k * (3 - 2 * k) : 1 - (1 - k) * (1 - k);
        const tx = f.out ? f.x1 : top.x, ty = f.out ? f.y1 : top.y, arc = 50 + Math.min(120, Math.abs(f.y0 - ty) * 0.15);
        const cx = f.out ? tx + (tx - f.x0) * 0.35 : (f.x0 + tx) / 2, cy = f.out ? Math.min(f.y0, ty) + Math.max(0, ty - f.y0) * 0.35 - 70 : Math.min(f.y0, ty) - arc;
        const x = (1 - e) * (1 - e) * f.x0 + 2 * (1 - e) * e * cx + e * e * tx, y = (1 - e) * (1 - e) * f.y0 + 2 * (1 - e) * e * cy + e * e * ty;
        if (x < r.camX - 30 || x > r.camX + r.viewW + 30 || y < r.camY - 30 || y > r.camY + r.viewH + 30) continue;
        ctx.save(); ctx.translate(x, y); ctx.rotate((f.out ? -1 : 1) * k * Math.PI * 2); ctx.drawImage(S.egg[f.t], -this.EW / 2, -this.EH / 2, this.EW, this.EH); ctx.restore();
      }
    }
    // the lucky egg on its balloon
    if (st.lucky && g.area === 'barn') {
      const L = st.lucky, t = g.time, fy = L.y - 70 + Math.sin(t * 2) * 6, sway = Math.sin(t * 1.6) * 4;
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(L.x, L.y + 4, 16, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(L.x, fy - 14); ctx.quadraticCurveTo(L.x + sway, fy - 30, L.x + sway * 1.5, fy - 46); ctx.stroke();
      ctx.fillStyle = '#ff5fa2'; ctx.beginPath(); ctx.ellipse(L.x + sway * 1.5, fy - 64, 16, 19, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(L.x + sway * 1.5 - 6, fy - 71, 4, 6, -0.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff5fa2'; ctx.beginPath(); ctx.moveTo(L.x + sway * 1.5 - 3, fy - 45); ctx.lineTo(L.x + sway * 1.5 + 3, fy - 45); ctx.lineTo(L.x + sway * 1.5, fy - 49); ctx.closePath(); ctx.fill();
      ctx.fillStyle = `rgba(158,240,26,${0.3 + 0.2 * Math.sin(t * 5)})`; ctx.beginPath(); ctx.arc(L.x, fy, 20, 0, Math.PI * 2); ctx.fill();
      this.drawEgg(ctx, 1, L.x, fy, 1.6);
      ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🍀', L.x + 1, fy + 2);
    }
  },

  // ======================= screen: peek inside a coop, the new-egg banner, fades =======================
  screen(r, g) {
    if (!this.st) return;
    const ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr, st = this.st;
    if (g.area === 'barn' && st.peek) this.drawPeek(r, g, W, H);
    if (g.area === 'barn' && st.banner) this.drawBanner(r, g, W, H);
    if (st.fade > 0) { ctx.fillStyle = `rgba(20,12,6,${(st.fade / 0.45).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
  },
  drawPeek(r, g, W, H) {
    const ctx = r.ctx, st = this.st, s = this.state(g), K = CFG.EGGFARM, S = this.spr(), t = g.time, c = st.peek.c;
    const k = Math.min(1, (6 - st.peek.t) / 0.25), pw = Math.min(W - 28, 500), ph = Math.min(H - 190, 330), px = W / 2 - pw / 2, py = Math.max(80, H / 2 - ph / 2 - 20);
    ctx.save(); ctx.globalAlpha = k;
    ctx.fillStyle = 'rgba(43,29,20,0.5)'; ctx.fillRect(0, 0, W, H);
    // the coop's front opened up like a doll's house
    ctx.fillStyle = K.COOP_COLORS[c]; U.roundRect(ctx, px - 12, py - 12, pw + 24, ph + 24, 18); ctx.fill();
    ctx.fillStyle = '#7a5130'; U.roundRect(ctx, px, py, pw, ph, 10); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = px + 20; x < px + pw; x += 22) ctx.fillRect(x, py, 2, ph);
    const shown = Math.max(0, s.hens[c] - st.incoming[c]), cap = this.cap(s), cols = pw > 420 ? 6 : 5, rows = 3, nw = (pw - 30) / cols, nh = (ph - 70) / rows;
    for (let row = 0; row < rows; row++) {
      const sy = py + 54 + row * nh;
      ctx.fillStyle = '#5b3a1a'; ctx.fillRect(px + 10, sy + nh - 8, pw - 20, 8);   // the shelf
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col, nx = px + 15 + col * nw + nw / 2, ny = sy + nh - 14;
        ctx.fillStyle = '#e0b44c'; ctx.beginPath(); ctx.ellipse(nx, ny, nw * 0.4, 9, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#b8862c'; ctx.lineWidth = 1.5; for (let q = 0; q < 5; q++) { ctx.beginPath(); ctx.moveTo(nx - nw * 0.36 + q * nw * 0.18, ny - 4); ctx.lineTo(nx - nw * 0.3 + q * nw * 0.18, ny + 5); ctx.stroke(); }
        if (idx < Math.min(shown, rows * cols)) {
          const bob = Math.sin(t * 3 + idx * 1.9) * 2, sc = Math.min(1.9, nh / 30);
          ctx.drawImage(S.hen[s.type], nx - 14 * sc, ny - 30 * sc + bob, 28 * sc, 34 * sc);
          if ((idx * 7 + Math.floor(t)) % 5 === 0) this.drawEgg(ctx, s.type, nx + 14 * sc, ny - 3, 0.9);
        }
      }
    }
    ctx.fillStyle = 'rgba(43,29,20,0.85)'; U.roundRect(ctx, W / 2 - 80, py - 4, 160, 34, 14); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(18); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(`🐔 ${shown} / ${cap}`, W / 2, py + 13);
    if (Math.floor(t * 1.5) % 3 === 0 && shown) { ctx.font = r.font(14); ctx.fillStyle = '#fff'; ctx.fillText('Bok bok! 💛', px + pw - 60, py + 46); }
    ctx.restore();
  },
  drawBanner(r, g, W, H) {
    const ctx = r.ctx, b = this.st.banner, T = CFG.EGGFARM.TYPES[b.type], S = this.spr(), t = g.time;
    const k = b.t < 0.35 ? U.easeOut(b.t / 0.35) : b.t > 2.8 ? 1 - (b.t - 2.8) / 0.4 : 1;
    const y = 120 - (1 - k) * 160, bw = Math.min(W - 30, 380);
    ctx.save(); ctx.globalAlpha = U.clamp(k, 0, 1);
    ctx.fillStyle = 'rgba(43,29,20,0.9)'; U.roundRect(ctx, W / 2 - bw / 2, y - 46, bw, 92, 20); ctx.fill();
    ctx.strokeStyle = T.glow; ctx.lineWidth = 4; U.roundRect(ctx, W / 2 - bw / 2, y - 46, bw, 92, 20); ctx.stroke();
    ctx.drawImage(S.hen[b.type], W / 2 - bw / 2 + 14, y - 40, 66, 80);
    this.drawEgg(ctx, b.type, W / 2 + bw / 2 - 44, y + Math.sin(t * 5) * 4, 3);
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(22, 900); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(`${T.ico} ${T.name}!`, W / 2 - 2, y);
    ctx.restore();
  },

  // ======================= the egg truck (top-down, nose to +x) =======================
  vehicleArt: {
    eggtruck(r, g, color, v, h) {
      const ctx = r.ctx, c = r.paintColor(color, g) || '#ffd23f', S = EggFarmExt.spr();
      ctx.fillStyle = 'rgba(0,0,0,0.22)'; U.roundRect(ctx, -50, -22, 104, 50, 10); ctx.fill();
      h.wheels([-30, 30], 16, 9, 22);
      // the flatbed with its egg boxes
      ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, -52, -21, 66, 42, 5); ctx.fill();
      ctx.fillStyle = '#c9a36b'; U.roundRect(ctx, -49, -18, 60, 36, 4); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.1)'; for (let k = 0; k < 4; k++) ctx.fillRect(-49, -18 + k * 9, 60, 1.5);
      const nb = Math.min(12, (v && v.boxes) || 0);
      for (let k = 0; k < nb; k++) { const col = k % 4, row = Math.floor(k / 4) % 3; ctx.drawImage(S.box, -47 + col * 14.5, -17 + row * 11.5, 14, 10); }
      // the cab
      ctx.fillStyle = c; U.roundRect(ctx, 14, -21, 38, 42, 9); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; U.roundRect(ctx, 17, -18, 30, 6, 3); ctx.fill();
      ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, 38, -16, 10, 32, 3); ctx.fill();   // windscreen
      ctx.fillStyle = '#9fd3ff'; U.roundRect(ctx, 40, -14, 6, 28, 2); ctx.fill();
      EggFarmExt.drawEgg(ctx, 0, 26, 0, 1);                                          // the egg on the roof
      h.lights(104, 21);
    },
  },
};
Game.ext.unshift(EggFarmExt);
Render.ext.push(EggFarmExt);
