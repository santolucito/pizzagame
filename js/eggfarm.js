'use strict';
// The Egg Barn: an idle egg farm in the big hall behind the old barn (through the wide archway in the barn's bottom wall,
// same map 'barn', see js/barn.js). One button for each thing, nothing to read, nothing to lose, and no resets: it just
// keeps growing. Extension module (see js/EXTENSIONS.md).
//
// The egg chain, every step something you can see (first by hand, then with helpers, like the pizzeria):
// - 🐣 Hatch! at the shiny hatching machine: a chick pops out with a peep and waddles along the yellow path, up a little
//   ramp, into a henhouse (coop). After a little while it comes back out down the ramp as a grown chicken.
// - The chickens wander about the hall floor, peck and flap, and lay their eggs wherever they are (an egg pops out with
//   a little "bok!"). The chef walks about picking them up: every egg near him hops up onto THE EGG TOWER sitting on his
//   head (a springy stack, egg on egg, 100+ high, that leans and lags like a wobbly noodle). The old barn's hens' eggs
//   and a lucky egg's bonus eggs join it too.
// - Coops: a coop's size is how many chickens can sleep in it, and the flock can only be as big as all the coops
//   together (pads buy a New Coop, up to six, and Bigger Coops). The number on a coop's roof is how many chickens
//   belong to it; its window shows the ones inside. At dusk every chicken walks home and goes to sleep (sleepy faces
//   and Zzz in the windows, no eggs at night); at dawn the rooster crows and out they come again. Eggs stay where they
//   were laid.
// - 📦 Pack the eggs at the egg packer: the tower streams off, egg by egg, into the packer's hopper; the packer's arm
//   swings and full egg boxes pop up its chute onto the box pile.
// - 📦 Load the truck at the dock: boxes fly from the pile onto the egg truck parked in the north doorway (a fill bar
//   shows how full it is). When it is full, or a little while after the last box, it toots and drives out of the big
//   north doors, up the farm track, along Main Street to the 🥚 Egg Market next to the fire station, unloads, and comes
//   back with the money.
// - The 🧑‍🌾 Loader (a pad) walks boxes from the pile onto the truck (and, while the game is closed, gathers the eggs too:
//   only a farm with a Loader earns while you are away; without one the hens leave eggs on the floor for you).
// - The spare egg truck in the second bay can be driven: load it at the box pile, drive out of the north doors and along
//   Main Street to the Egg Market, and 🥚 Deliver the eggs there (the normal price, the same as the trucks).
// - Egg types climb a ladder as the flock grows: plain → golden → rainbow → sparkly space → pizza egg, each worth more,
//   and the hens dress up for each one. The giant board on the back wall shows the ladder and the hen count.
// - Extras: a lucky egg floats across the hall on a balloon now and then (walk into it), the rooster crows at dawn,
//   🌽 Scatter corn throws corn bits on the floor and the chickens nearby come running to gather round and peck (and
//   lay a few eggs there), and offline catch-up with the shared Shop helpers (js/shop.js).
// The chef never reaches: the tower sits on his head and his hands stay at his sides (the game's carry pose).
// Lots of chickens stay cheap: at most WALK_MAX of them walk about as little sprites (only the ones on screen are
// drawn), the rest wait in their coops (still counted, still laying), and at most FLOOR_MAX eggs lie on the floor.
// Saved in g.s.eggfarm (version 3; older saves are moved over in state(): the old Egg Belt and egg trays are gone).

CFG.EGGFARM = {
  HALL: { x0: 39548, y0: 4410, x1: 40852, y1: 4892 }, WALL: 22,
  ARCH_MAT: { x: 39952, y: 4448 },                                  // the hall side of the archway (rescue spot)
  HATCHER: { x0: 39566, y0: 4414, x1: 39732, y1: 4498, btn: { x: 39650, y: 4542 }, out: { x: 39740, y: 4486 } },
  ROOSTER: { x: 39704, y: 4410 },                                   // stands on the hatcher's roof
  CORN: { x: 40005, y: 4604, spot: { x: 40005, y: 4650 } },         // the corn sack and where you stand to scatter
  COOP_X: [40100, 40198, 40296, 40394, 40492, 40590], COOP: { y0: 4416, y1: 4498, w: 88 },
  COOP_COLORS: ['#e4572e', '#3b7dd8', '#2f9e44', '#9b59b6', '#f2b134', '#e84393'],
  CHICK_Y: 4570,                                                    // the chicks' path along the coops (the ramps come down to it)
  // where the chickens roam (they lay where they stand), and the spots they keep off so eggs never hide a button
  ROAM: { x0: 39600, y0: 4584, x1: 40630, y1: 4796 },
  PACKER: { x0: 40668, y0: 4700, x1: 40846, y1: 4776, hopper: { x: 40692, y: 4708 }, out: { x: 40756, y: 4700 } },
  BOXPILE: { x: 40756, y: 4652 },                                   // the box pile, up the packer's chute
  PACK: { x: 40612, y: 4768, r: 46 },                               // 📦 Pack the eggs (into the packer's hopper)
  BAYS: [{ x: 40706, y: 4478 }, { x: 40806, y: 4478 }],             // [0] the egg trucks' dock, [1] the spare egg truck's bay
  LOAD: [{ x: 40706, y: 4570 }, { x: 40806, y: 4570 }], LOAD_R: 36, // 📦 Load the truck: stand behind it
  DOOR: { x0: 40656, x1: 40852, top: 4262 },                        // the big sliding door in the north (back) wall
  CASH: { x: 40560, y: 4812 },
  BOARD: { x0: 40104, y0: 4222, x1: 40556, y1: 4352 },              // the giant milestone board on the back wall
  PADS_Y: 4840, PADS_X: [39640, 39764, 39888, 40012, 40136, 40260], NEWCOOP_Y: 4630,
  LOADER_PAD: { x: 40740, y: 4834 }, LOADER_HOME: { x: 40776, y: 4600 },
  // the farm and the town (map 'town'): the barn's big north doors, the farm track up to Main Street, and the Egg Market
  // on the grass at the corner of Main Street and East Road, right next to the fire station (CFG.FIRE_STATION, 1340..1520
  // × 300..540): clear of the roads, the sidewalks, the station's door and its truck's routes. Its counter faces Main
  // Street; the trucks pull up on the near lane in front of it.
  TOWN: { door: { x: -840, y: 150 }, spot: { x: -840, y: 106 }, half: 36 },
  MARKET: { x0: 1328, y0: 116, x1: 1408, y1: 158, drop: { x: 1368, y: 74 }, r: 80 },   // (clear of the tree beside it)
  // the egg trucks' drive: out of the north doors, right along Main Street's near lane to the market; then on a little,
  // a U-turn, back along the far lane, reversing into the barn (`rev` legs are driven backwards)
  ROUTE_OUT: [{ x: -840, y: 206 }, { x: -840, y: 74 }, { x: 1368, y: 74 }],
  ROUTE_BACK: [{ x: 1368, y: 74 }, { x: 1440, y: 74 }, { x: 1478, y: 59 }, { x: 1440, y: 44 }, { x: -790, y: 44 }, { x: -840, y: 88, rev: true }, { x: -840, y: 206, rev: true }],
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
    loader: { label: 'Loader', ico: '🧑‍🌾', base: 140, growth: 2.2, max: 3 },
  },
  BELT_REFUND: 100,                                                 // what the old Egg Belt cost: an old save gets it back
  NEWCOOP: { base: 150, growth: 2.0 },
  REFILL: 0.4, COOP_BASE: 20, COOP_PER_LV: 10, LAY: 7, HOPPER_CAP: 400, BOX_PILE_CAP: 60,
  GROW: 3.5,                                                        // seconds a new chick spends in its coop before it comes out grown
  WALK_MAX: 60, FLOOR_MAX: 80,                                      // chickens walking about at once; eggs lying on the floor at once
  HEN_SPEED: [34, 52], RELEASE_GAP: 0.12,                           // px/s; seconds between chickens coming down a ramp
  STACK_MAX: 300, CHICK_MAX: 40, MAGNET: 110,                       // MAGNET: eggs this close hop onto the tower (generous for small players)
  CORN_TIME: 10, CORN_R: 360, CORN_EGGS: 3,                         // seconds the chickens gather; how far they come from; eggs laid at the corn
  LUCKY_EVERY: [40, 80], SP: 12,                                    // SP: px between eggs in the tower
  TRUCK_WAIT: 5, ROAD_SPEED: 280, LOADER_SPEED: 95,
};
CFG.VEHICLES.eggtruck = { speed: 250, radius: 24, label: '🚚 Drive the egg truck', exit: '🚶 Hop out' };

const EggFarmExt = {
  name: 'eggfarm',
  st: null,
  sprites: null,
  defaults: { eggfarm: { ver: 3, seen: false, coops: 1, hens: [0, 0, 0, 0, 0, 0], lv: { hatch: 0, coop: 0, feed: 0, box: 0, truck: 0, fancy: 0, loader: 0 }, type: 0, hopper: 0, hopperVal: 0, box: 0, boxEggVal: 0, boxes: 0, boxVal: 0, bank: 0, transit: 0, rate: 0, stack: [], floor: [], spare: { boxes: 0, val: 0 }, hatched: 0, laid: 0, shipped: 0, earned: 0 } },

  // ======================= numbers =======================
  state(g) {
    let s = g.s.eggfarm;
    if (!s || typeof s !== 'object') s = g.s.eggfarm = JSON.parse(JSON.stringify(this.defaults.eggfarm));
    const K = CFG.EGGFARM;
    // a save from before the egg chain (version 1) had trucks that loaded themselves: one that had shipped eggs keeps a
    // loader, so nothing it could do stops working
    if (s.ver === undefined) {
      if (!s.lv || typeof s.lv !== 'object') s.lv = {};
      if (typeof s.lv.loader !== 'number') s.lv.loader = (s.shipped | 0) > 0 || (s.lv.truck | 0) > 0 ? 1 : 0;
      if (typeof s.hopperVal !== 'number') s.hopperVal = (s.hopper | 0) * K.TYPES[U.clamp(s.type | 0, 0, 4)].value;
      s.ver = 2;
    }
    // version 2 had the Egg Belt and an egg tray under each coop: the belt is gone (what it cost waits as egg money by
    // the dock) and the eggs in the trays are on the floor in front of their coops; the flock, the coops, the money and
    // every other upgrade (the Loader too) stay
    if (s.ver === 2) {
      if (s.lv && typeof s.lv === 'object' && 'belt' in s.lv) { if ((s.lv.belt | 0) > 0) s.bank = (+s.bank || 0) + K.BELT_REFUND; delete s.lv.belt; }
      if (!Array.isArray(s.floor)) s.floor = [];
      if (Array.isArray(s.trays)) {
        s.trays.forEach((n, i) => { for (let k = 0; k < (n | 0) && s.floor.length < K.FLOOR_MAX; k++) s.floor.push([Math.round(K.COOP_X[i % 6] - 30 + Math.random() * 60), Math.round(K.CHICK_Y + 24 + Math.random() * 40), U.clamp(s.type | 0, 0, 4)]); });
        delete s.trays;
      }
      s.ver = 3;
    }
    const d = this.defaults.eggfarm;
    if (!s.lv || typeof s.lv !== 'object') s.lv = {};
    for (const k of Object.keys(d)) if (s[k] === undefined) s[k] = JSON.parse(JSON.stringify(d[k]));
    for (const k of Object.keys(d.lv)) if (typeof s.lv[k] !== 'number') s.lv[k] = 0;
    if (!Array.isArray(s.hens)) s.hens = [0, 0, 0, 0, 0, 0];
    while (s.hens.length < 6) s.hens.push(0);
    s.coops = U.clamp(s.coops | 0, 1, 6);
    if (!Array.isArray(s.stack)) s.stack = [];
    if (!Array.isArray(s.floor)) s.floor = [];
    if (!s.spare || typeof s.spare !== 'object') s.spare = { boxes: 0, val: 0 };
    return s;
  },
  cap(s) { const K = CFG.EGGFARM; return K.COOP_BASE + K.COOP_PER_LV * s.lv.coop; },
  hens(s) { let n = 0; for (let i = 0; i < s.coops; i++) n += s.hens[i]; return n; },
  // the chickens that belong to a coop: a chick still waddling to it is not one yet (the coops' roof numbers and the
  // board count this)
  shown(s, i) { return Math.max(0, s.hens[i] - (this.st ? this.st.incoming[i] : 0)); },
  shownHens(s) { let n = 0; for (let i = 0; i < s.coops; i++) n += this.shown(s, i); return n; },
  // the chickens in a coop right now (sleeping at night; by day the new ones growing up and any waiting their turn)
  inCoop(s, i) { return this.st ? Math.max(0, this.shown(s, i) - this.st.walkers[i]) : this.shown(s, i); },
  growing(i) { let n = 0; if (this.st) for (const q of this.st.grow) if (q.c === i) n++; return n; },
  room(s) { return s.coops * this.cap(s) - this.hens(s); },
  refill(s) { return CFG.EGGFARM.REFILL / (1 + 0.15 * s.lv.hatch); },
  perPress(s) { return 1 + Math.floor(s.lv.hatch / 4); },
  autoEvery(s) { return s.lv.hatch > 0 ? 3.2 / s.lv.hatch : 0; },
  layTime(s) { return CFG.EGGFARM.LAY / (1 + 0.3 * s.lv.feed); },
  boxEggs(s) { return 6 + 3 * s.lv.box; },
  packRate(s) { return 8 * (1 + 0.4 * s.lv.box); },                // eggs a second through the packer
  truckCount(s) { return 1 + s.lv.truck; },
  truckCap(s) { return 6 + 2 * s.lv.truck; },
  loaderCarry(s) { return s.lv.loader; },                           // boxes the loader carries each trip
  eggValue(s, type) { return CFG.EGGFARM.TYPES[type].value * (1 + 0.25 * s.lv.fancy); },
  typeFor(n) { const T = CFG.EGGFARM.TYPES; let k = 0; for (let i = 0; i < T.length; i++) if (n >= T[i].at) k = i; return k; },
  upgCost(s, key) { const u = CFG.EGGFARM.UPG[key]; return s.lv[key] >= u.max ? null : Shop.cost(u.base, s.lv[key], u.growth); },
  coopCost(s) { return s.coops >= 6 ? null : Shop.cost(CFG.EGGFARM.NEWCOOP.base, s.coops - 1, CFG.EGGFARM.NEWCOOP.growth); },
  // night in the barn: from dusk until dawn the chickens sleep in their coops
  night() { return typeof AtmosphereExt !== 'undefined' && AtmosphereExt.phase === 'dusk'; },
  inHall(g) { return g.area === 'barn' && g.player.y > CFG.BARN.room.y1 + 10 && !(BarnExt.st && BarnExt.st.loft); },
  busy(g) { return g.onTrain || g.ride || g.travel || (typeof CityExt !== 'undefined' && (CityExt.floor || (CityExt.st && (CityExt.st.cab || CityExt.st.boarding)))); },

  // ======================= setup =======================
  build(g) {
    const s = this.state(g), K = CFG.EGGFARM;
    this.st = {
      refill: 0, press: 0, autoT: 0, fullFlash: 0, peepT: 0,
      chicks: [], incoming: [0, 0, 0, 0, 0, 0], coopPop: [0, 0, 0, 0, 0, 0],
      flock: [], walkers: [0, 0, 0, 0, 0, 0], grow: [], releaseT: 0, acc: 0, bokT: 0, lays: 0,
      floor: [], floorN: -1, stackN: -1,
      packT: 0, packAnim: 0,
      trucks: [], boxFly: [], loading: null, loader: null, deliver: null, mkt: 0, mktT: 0,
      stack: [], fly: [], noScoop: 0, packing: null, boing: 0, boingT: 0,
      px: g.player.x, py: g.player.y, parea: g.area, vs: 0, lean: 0, leanV: 0, rip: 0,
      lucky: null, luckyT: U.rand(K.LUCKY_EVERY[0] * 0.5, K.LUCKY_EVERY[1] * 0.5),
      corn: [], cornT: 0, cornAt: null, cornEggs: 0, cornEggT: 0,
      crow: 0, labels: [0, 0, 0, 0, 0, 0], boardN: 0, peekDrawn: 0, lastPhase: null, peek: null, banner: null, fade: 0, magT: 0, faces: [],
      spare: { kind: 'eggtruck', x: K.BAYS[1].x, y: K.BAYS[1].y, angle: -Math.PI / 2, vx: 0, vy: 0, where: 'barn', boxes: s.spare.boxes | 0, val: +s.spare.val || 0 },
      m: { secT: 0, secEarned: 0 }, obs: null, obsCar: null, awayMsg: null, frameMs: 0, drawn: 0, henDrawn: 0,
    };
    // the eggs the chef was carrying when the game was saved, and the eggs left lying on the floor
    for (const t of s.stack.slice(0, K.STACK_MAX)) this.st.stack.push({ t: U.clamp(t | 0, 0, 4), x: 0, land: 9 });
    this.loadFloor(s);
    // money that was on the road when the game was saved comes home
    if (s.transit > 0) { s.bank += Math.round(s.transit); s.transit = 0; }
    s.type = Math.max(s.type, this.typeFor(this.hens(s)));
    this.syncTrucks(g);
    this.away(g, Shop.awaySeconds(g));
    // by day the flock is already out and about when you come in
    if (!this.night()) this.scatterFlock(s);
  },
  ready(g) { if (!this.st) this.build(g); return this.st; },
  loadFloor(s) {
    const K = CFG.EGGFARM, R = K.ROAM, st = this.st; st.floor.length = 0;
    for (const e of s.floor) { if (!Array.isArray(e) || st.floor.length >= K.FLOOR_MAX) continue; st.floor.push({ x: U.clamp(+e[0] || 0, R.x0, R.x1), y: U.clamp(+e[1] || 0, R.y0, R.y1), t: U.clamp(e[2] | 0, 0, 4), z: 0, vz: 0, pop: 0 }); }
    st.floorN = -1;
  },
  // The time the game was closed (the shared rule, js/shop.js). A farm with a Loader keeps a share of the money it was
  // making a second (the farmhand gathers the eggs too); without one the hens leave eggs on the floor (up to
  // FLOOR_MAX), waiting for the chef. An automatic hatcher keeps hatching a few chicks into any room left in the coops.
  away(g, sec) {
    const s = this.state(g), K = CFG.EGGFARM, st = this.st;
    if (sec < SHOP.AWAY_MIN) return 0;
    const loader = s.lv.loader > 0 && this.hens(s) > 0;
    const amt = Math.round(Shop.awayEarnings(sec, loader, s.rate));
    if (amt > 0) { s.bank += amt; s.earned += amt; }
    let eggs = 0;
    if (!loader && this.hens(s) > 0) {
      eggs = Math.max(0, Math.min(K.FLOOR_MAX - st.floor.length, Math.floor(this.hens(s) * sec / this.layTime(s) * SHOP.AWAY_SHARE)));
      for (let k = 0; k < eggs; k++) { const q = this.roamSpot(); st.floor.push({ x: q.x, y: q.y, t: s.type, z: 0, vz: 0, pop: 0 }); }
      s.laid += eggs; st.floorN = -1;
    }
    let chicks = 0;
    if (s.lv.hatch > 0) {
      chicks = Math.max(0, Math.min(this.room(s), Math.floor(sec / this.autoEvery(s) * SHOP.AWAY_SHARE)));
      for (let k = 0; k < chicks; k++) { const c = this.coopWithRoom(s); if (c < 0) break; s.hens[c]++; s.hatched++; }
      s.type = Math.max(s.type, this.typeFor(this.hens(s)));
    }
    if (amt > 0 || chicks > 0 || eggs > 0) st.awayMsg = amt > 0 ? `🥚 The Loader gathered the eggs: the trucks made ${U.money(amt)} while you were away!` : eggs > 0 ? `🥚 The hens laid ${eggs} eggs while you were away!` : `🐣 ${chicks} chicks hatched while you were away!`;
    return amt;
  },

  // ======================= geometry =======================
  obstacles(g, forCar) {
    if (g.area === 'town') { const M = CFG.EGGFARM.MARKET; return [{ x: M.x0, y: M.y0, w: M.x1 - M.x0, h: M.y1 - M.y0 }]; }
    if (g.area !== 'barn') return [];
    const st = this.ready(g), s = this.state(g), slot = forCar ? 'obsCar' : 'obs';
    if (st[slot] && st[slot].coops === s.coops) return st[slot].list;
    const K = CFG.EGGFARM, H = K.HALL, w = K.WALL, B = CFG.BARN, A = B.arch, R = B.room, D = K.DOOR, W = CFG.AREAS.barn.WORLD, o = [];
    // walls: the strip under the old barn (with the archway), the tall back wall right of the barn (with the big north
    // doors: open for a truck, closed to a chef on foot), the sides and the bottom
    o.push({ x: R.x0 - w, y: R.y1 + w, w: A.x0 - (R.x0 - w), h: H.y0 - R.y1 - w }, { x: A.x1, y: R.y1 + w, w: R.x1 + w - A.x1, h: H.y0 - R.y1 - w });
    if (forCar) o.push({ x: R.x1 + w, y: W.y0, w: D.x0 - (R.x1 + w), h: H.y0 - W.y0 }, { x: D.x1, y: W.y0, w: H.x1 + w - D.x1, h: H.y0 - W.y0 });
    else o.push({ x: R.x1 + w, y: W.y0, w: H.x1 + w - (R.x1 + w), h: H.y0 - W.y0 });
    o.push({ x: H.x0 - w, y: R.y1 + w, w, h: H.y1 + w - (R.y1 + w) });
    o.push({ x: H.x1, y: R.y1 + w, w, h: H.y1 + w - (R.y1 + w) });
    o.push({ x: H.x0 - w, y: H.y1, w: H.x1 - H.x0 + 2 * w, h: w });
    // machines and furniture
    const Hc = K.HATCHER; o.push({ x: Hc.x0, y: Hc.y0, w: Hc.x1 - Hc.x0, h: Hc.y1 - Hc.y0 });
    o.push({ x: K.CORN.x - 24, y: K.CORN.y - 16, w: 48, h: 30 });
    for (let i = 0; i < s.coops; i++) o.push({ x: K.COOP_X[i] - K.COOP.w / 2, y: K.COOP.y0, w: K.COOP.w, h: K.COOP.y1 + 4 - K.COOP.y0 });
    const P = K.PACKER; o.push({ x: P.x0, y: P.y0, w: H.x1 - P.x0, h: P.y1 - P.y0 });
    const BP = K.BOXPILE; o.push({ x: BP.x - 32, y: BP.y - 18, w: 64, h: P.y0 - (BP.y - 18) });   // the pile and the chute up to it
    const B0 = K.BAYS[0]; o.push({ x: B0.x - 25, y: H.y0, w: 50, h: B0.y + 54 - H.y0 });         // the egg trucks' dock
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
  // a coop's little door (up its ramp) and the foot of the ramp on the floor
  coopDoor(i) { return { x: CFG.EGGFARM.COOP_X[i] - 28, y: CFG.EGGFARM.COOP.y1 - 2 }; },
  rampFoot(i) { return { x: CFG.EGGFARM.COOP_X[i] - 28, y: CFG.EGGFARM.CHICK_Y + 8 }; },
  // the chick's walk: out of the hatcher, along the yellow path, up the ramp into its coop's door
  chickPath(c) {
    const K = CFG.EGGFARM, O = K.HATCHER.out, x = K.COOP_X[c] - 28;
    return [{ x: O.x + 14, y: O.y + 8 }, { x: O.x + 20, y: K.CHICK_Y }, { x, y: K.CHICK_Y }, { x, y: K.COOP.y1 - 4 }];
  },
  // a free spot on the floor where the chickens may stand (and lay): in the roaming area, off the buttons and pads
  keepOut(x, y) {
    const K = CFG.EGGFARM, s = this.st ? this.state(Game) : null, C = K.CORN;
    if (x > C.x - 34 && x < C.x + 34 && y > C.y - 26 && y < C.y + 24) return true;   // the corn sack
    if (U.dist(x, y, C.spot.x, C.spot.y) < 30 || U.dist(x, y, K.PACK.x, K.PACK.y) < 52 || U.dist(x, y, K.CASH.x, K.CASH.y) < 46) return true;
    if (s && s.coops < 6 && U.dist(x, y, K.COOP_X[s.coops], K.NEWCOOP_Y) < 62) return true;   // the New Coop pad
    return false;
  },
  roamSpot(nx, ny, r) {
    const R = CFG.EGGFARM.ROAM;
    for (let k = 0; k < 12; k++) {
      const x = nx === undefined ? U.rand(R.x0, R.x1) : U.clamp(nx + U.rand(-r, r), R.x0, R.x1), y = ny === undefined ? U.rand(R.y0, R.y1) : U.clamp(ny + U.rand(-r * 0.6, r * 0.6), R.y0, R.y1);
      if (!this.keepOut(x, y)) return { x, y };
    }
    return { x: (R.x0 + R.x1) / 2, y: R.y1 - 10 };
  },

  // ======================= the pads =======================
  pads(g) {
    if (g.area !== 'barn') return [];   // the circles only exist in the barn's map
    const s = this.state(g), K = CFG.EGGFARM, out = [], keys = ['hatch', 'coop', 'feed', 'box', 'truck', 'fancy'];
    keys.forEach((k, i) => {
      const u = K.UPG[k], c = this.upgCost(s, k);
      out.push({ key: 'egg_' + k, upg: k, label: u.label, ico: u.ico, pos: { x: K.PADS_X[i], y: K.PADS_Y }, price: c || 0, maxed: c === null, sub: `${s.lv[k]}/${u.max}` });
    });
    const L = K.UPG.loader, lc = this.upgCost(s, 'loader');
    out.push({ key: 'egg_loader', upg: 'loader', label: s.lv.loader ? 'Faster Loader' : 'Hire a Loader', ico: L.ico, pos: K.LOADER_PAD, price: lc || 0, maxed: lc === null, sub: `${s.lv.loader}/${L.max}` });
    const nc = this.coopCost(s);
    if (nc !== null) out.push({ key: 'egg_newcoop', label: 'New Coop', ico: '🏠', pos: { x: K.COOP_X[s.coops], y: K.NEWCOOP_Y }, price: nc, sub: `${s.coops}/6` });
    return out;
  },
  onPad(g, pad) {
    const s = this.state(g), st = this.ready(g), K = CFG.EGGFARM;
    if (pad.key === 'egg_newcoop') {
      s.coops = Math.min(6, s.coops + 1); st.obs = st.obsCar = null;
      st.coopPop[s.coops - 1] = 0.8;
      // any egg lying where the next coop's pad now is rolls aside
      for (const e of st.floor) if (this.keepOut(e.x, e.y)) { const q = this.roamSpot(e.x, e.y + 60, 30); e.x = q.x; e.y = q.y; st.floorN = -1; }
      g.floats.push({ x: K.COOP_X[s.coops - 1], y: K.COOP.y0 - 40, text: '🏠 A new coop!', color: '#ffe08a', t: 0, dur: 1.6, big: true });
      Sfx.unlock(); Haptics.success();
      return;
    }
    const k = pad.upg; if (!k) return;
    s.lv[k] = Math.min(K.UPG[k].max, s.lv[k] + 1);
    const say = { hatch: '🐣 Faster hatcher!', coop: `🏡 Bigger coops! ${this.cap(s)} chickens each`, feed: '🌾 Yummy feed: more eggs!', box: `📦 Bigger boxes! ${this.boxEggs(s)} eggs`, truck: '🚚 Another egg truck!', fancy: '✨ Fancier eggs: worth more!', loader: s.lv.loader === 1 ? '🧑‍🌾 A loader! He loads the truck' : `🧑‍🌾 Faster loader! ${s.lv.loader} boxes a trip` }[k];
    g.floats.push({ x: pad.pos.x, y: pad.pos.y - 60, text: say, color: '#ffe08a', t: 0, dur: 1.6, big: true });
    if (k === 'truck') this.syncTrucks(g);
    if (k === 'loader') this.ensureLoader();
  },

  // ======================= the one button =======================
  action(g) {
    const st = this.st; if (!st) return null;
    const p = g.player, K = CFG.EGGFARM, s = this.state(g);
    if (this.busy(g)) return null;
    if (g.driving) {
      if (g.vehicle !== st.spare) return null;
      const v = st.spare;
      if (g.area === 'town') {
        if (st.deliver) return null;
        const M = K.MARKET.drop;
        if (v.boxes > 0 && U.dist(v.x, v.y, M.x, M.y) < K.MARKET.r) return { label: '🥚 Deliver the eggs', run: (gg) => this.deliverEggs(gg) };
        // (not the moment it comes out of the doors: only once it has been off somewhere, or has nothing on it)
        if (U.dist(v.x, v.y, K.TOWN.spot.x, K.TOWN.spot.y) < 70 && (st.spareOff || !v.boxes)) return { label: '🚚 Drive into the barn', run: (gg) => this.driveIn(gg) };
        return null;
      }
      if (g.area === 'barn' && !st.loading && s.boxes > 0 && v.boxes < this.truckCap(s) && U.dist(v.x, v.y, K.BOXPILE.x, K.BOXPILE.y) < 120) return { label: '📦 Load the truck', run: (gg) => this.startLoading(gg, 'spare') };
      return null;
    }
    if (!this.inHall(g)) return null;
    if (st.peek) return { label: '👀 Back out', run: () => { st.peek = null; } };
    if (st.lucky && !st.lucky.leave && U.dist(p.x, p.y, st.lucky.x, st.lucky.y) < 70) return { label: '🎈 Catch the lucky egg!', run: (gg) => this.catchLucky(gg) };
    if (U.dist(p.x, p.y, K.HATCHER.btn.x, K.HATCHER.btn.y) < 44) return { label: '🐣 Hatch!', run: (gg) => this.hatch(gg, false) };
    if (st.stack.length && !st.packing && U.dist(p.x, p.y, K.PACK.x, K.PACK.y) < K.PACK.r) return { label: '📦 Pack the eggs', run: (gg) => this.startPacking(gg) };
    if (!st.loading && s.boxes > 0) {
      const tr = this.dockTruck();
      if (tr && tr.boxes < this.truckCap(s) && U.dist(p.x, p.y, K.LOAD[0].x, K.LOAD[0].y) < K.LOAD_R) return { label: '📦 Load the truck', run: (gg) => this.startLoading(gg, 'dock') };
      if (this.spareHome() && st.spare.boxes < this.truckCap(s) && U.dist(p.x, p.y, K.LOAD[1].x, K.LOAD[1].y) < K.LOAD_R) return { label: '📦 Load the truck', run: (gg) => this.startLoading(gg, 'spare') };
    }
    if (U.dist(p.x, p.y, K.CORN.spot.x, K.CORN.spot.y) < 44) return { label: '🌽 Scatter corn', run: (gg) => this.scatterCorn(gg) };
    for (let i = 0; i < s.coops; i++) if (U.dist(p.x, p.y, K.COOP_X[i] - 28, K.CHICK_Y + 4) < 26) return { label: '👀 Peek inside', run: () => { st.peek = { c: i, t: 6 }; p.moving = false; Sfx.chime(); Haptics.tap(); } };
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
  // a new egg type when the hens you can see reach its number (a chick still on its way counts once it is in)
  checkMilestone(g) {
    const s = this.state(g), st = this.st, k = this.typeFor(this.shownHens(s));
    if (k <= s.type) return;
    s.type = k;
    st.banner = { type: k, t: 0 };
    if (g.area === 'barn') { Sfx.unlock(); Haptics.success(); }
  },
  // 🌽 a handful of corn bits flies from the chef's hand (low, at his side: no reaching) onto the floor in front of him;
  // the chickens nearby come running, gather round the corn and peck at it for a while, then wander off again (and a
  // few eggs get laid right there)
  scatterCorn(g) {
    const st = this.ready(g), K = CFG.EGGFARM, R = K.ROAM, p = g.player, f = p.facing || 1, hx = p.x + f * 14, hy = p.y - 16;
    const cx = U.clamp(p.x + f * 30, R.x0 + 70, R.x1 - 70), cy = U.clamp(p.y + 78, R.y0 + 40, R.y1 - 30);
    st.corn.length = 0; st.cornT = K.CORN_TIME; st.cornAt = { x: cx, y: cy }; st.cornEggs = K.CORN_EGGS; st.cornEggT = 1.5;
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * 46, x1 = cx + Math.cos(a) * rr, y1 = cy + Math.sin(a) * rr * 0.6, d = U.dist(hx, hy, x1, y1);
      st.corn.push({ x0: hx + U.rand(-3, 3), y0: hy, x1, y1, t: -i * 0.02, dur: 0.35 + d / 900, h: 24 + d * 0.15 + U.rand(0, 14), gone: U.rand(0.45, 1) * K.CORN_TIME });
    }
    // every chicken out on the floor nearby comes to peck (the ones on their way home at dusk stay on their way)
    for (const h of st.flock) if ((h.s === 'wander' || h.s === 'idle' || h.s === 'peck') && U.dist(h.x, h.y, cx, cy) < K.CORN_R) this.toCorn(h);
    g.floats.push({ x: p.x, y: p.y - 76, text: '🌽 Here, chicky chicky!', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    Sfx.chime(); Haptics.tap();
  },
  // a chicken heads for a spot in a ring round the corn (so they cluster without piling up on one spot)
  toCorn(h) {
    const C = this.st.cornAt, a = Math.random() * Math.PI * 2, rr = U.rand(14, 64);
    h.s = 'corn'; h.at = false; h.tx = C.x + Math.cos(a) * rr; h.ty = C.y + Math.sin(a) * rr * 0.6; h.wait = 0; h.sp = CFG.EGGFARM.HEN_SPEED[1] * 1.35;
  },

  // ======================= the egg tower =======================
  // where egg i of the tower is drawn (world coords): resting on the chef's head (on top of any pizzas he carries, the
  // way the pizzeria's stack is carried), leaning with the spring. It bobs with his head while he walks.
  stackBase(g) {
    const p = g.player, pz = p.carry > 0 ? Math.min(p.carry, 30) * 4 + 8 : 0, bob = p.moving ? Math.sin(p.bob || 0) * 2 : 0;
    return { x: p.x, y: p.y - 70 - pz + bob };
  },
  stackComp() { const st = this.st; return 1 - 0.05 * st.boing * Math.cos(st.boingT * 26); },
  eggPos(g, i, base) {
    const st = this.st, b = base || this.stackBase(g), e = st.stack[Math.min(i, st.stack.length - 1)];
    const ox = e ? e.x : 0, rip = st.rip * Math.sin(i * 0.22 - g.time * 8) * Math.min(1, i / 30);
    return { x: b.x + ox + rip, y: b.y - i * CFG.EGGFARM.SP * this.stackComp() };
  },
  // an egg hops onto the tower from where it really is (x, y: a tray, the belt, the floor, a balloon): it flies on an
  // arc to the top and lands with a squash
  catchEgg(g, x, y, type, delay = 0) {
    const st = this.ready(g);
    if (st.stack.length + this.flyingIn() >= CFG.EGGFARM.STACK_MAX) return false;
    st.fly.push({ out: false, t: type, x0: x, y0: y, k: -delay, dur: 0.3 + Math.random() * 0.06, area: g.area });
    return true;
  },
  flyingIn() { let n = 0; for (const f of this.st.fly) if (!f.out) n++; return n; },
  // 📦 the tower streams off, egg by egg, into the packer's hopper (about two and a half seconds for a whole tower)
  startPacking(g) {
    const st = this.ready(g);
    if (!st.stack.length) return;
    st.packing = { t: 0, x: g.player.x, y: g.player.y, gap: U.clamp(2.4 / st.stack.length, 0.018, 0.08) };
    g.floats.push({ x: g.player.x, y: g.player.y - 60, text: '📦 Into the packer!', color: '#ffe08a', t: 0, dur: 1, big: true });
    Haptics.tap();
  },
  // eggs in the air finish where they were going (a trip to another map, Take-me-home): nothing flies across maps
  settleFlights(g) {
    const st = this.st, s = this.state(g);
    for (const f of st.fly) { if (f.out) { s.hopper++; s.hopperVal += this.eggValue(s, f.t); } else st.stack.push({ t: f.t, x: 0, land: 9 }); }
    st.fly.length = 0;
  },
  updateStack(g, dt) {
    const st = this.st, s = this.state(g), K = CFG.EGGFARM, p = g.player;
    if (g.area !== st.parea) this.settleFlights(g);
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
      if (f.out) { s.hopper++; s.hopperVal += this.eggValue(s, f.t); Sfx.drop(); continue; }
      const top = st.stack[st.stack.length - 1];
      st.stack.push({ t: f.t, x: top ? top.x : 0, land: 0 });
      st.boing = 1; st.boingT = 0; Sfx.pickup();
    }
    // packing: the eggs stream off the top one by one into the packer's hopper
    if (st.packing) {
      const P = st.packing, H = K.PACKER.hopper;
      P.t -= dt;
      if (U.dist(p.x, p.y, P.x, P.y) > 100 || g.area !== 'barn' || g.driving) { st.packing = null; st.noScoop = 0.8; }
      else {
        while (P.t <= 0 && st.stack.length && s.hopper + st.fly.length < K.HOPPER_CAP) {
          P.t += P.gap;
          const i = st.stack.length - 1, at = this.eggPos(g, i, base), e = st.stack.pop();
          st.fly.push({ out: true, t: e.t, x0: at.x, y0: at.y, x1: H.x + U.rand(-10, 10), y1: H.y + U.rand(-3, 3), k: 0, dur: 0.38 + Math.min(0.5, Math.abs(at.y - H.y) / 2400), area: g.area });
        }
        if (!st.stack.length) { st.packing = null; st.noScoop = 0.8; }
      }
    }
    st.noScoop = Math.max(0, st.noScoop - dt);
    if (st.stackN !== st.stack.length) { st.stackN = st.stack.length; s.stack = st.stack.map((e) => e.t); }
  },
  // the eggs on the floor near the chef hop up onto the tower, boing boing (a generous reach, so a small player only has
  // to walk somewhere near them)
  updateCollect(g, dt) {
    const st = this.st, K = CFG.EGGFARM, p = g.player;
    st.magT = Math.max(0, st.magT - dt);
    if (g.area !== 'barn' || g.driving || this.busy(g) || st.packing || st.noScoop > 0 || !this.inHall(g)) return;
    let pulled = 0;
    for (let i = st.floor.length - 1; i >= 0; i--) {
      const e = st.floor[i];
      if (e.z > 0.5 || e.pop > 0 || Math.abs(e.x - p.x) > K.MAGNET || Math.abs(e.y - p.y) > K.MAGNET || U.dist(p.x, p.y, e.x, e.y) > K.MAGNET) continue;
      if (st.stack.length + this.flyingIn() >= K.STACK_MAX) break;
      st.floor.splice(i, 1); st.floorN = -1; this.catchEgg(g, e.x, e.y - 6, e.t, Math.min(pulled, 12) * 0.05); pulled++;
    }
    if (pulled && st.magT <= 0) { st.magT = 1.4; g.floats.push({ x: p.x + 30, y: p.y - 40, text: 'Boing boing! 🥚', color: '#fff3a0', t: 0, dur: 1, big: true }); Sfx.clean(); }
  },

  // ======================= the flock: in and out of the coops, wandering, laying =======================
  // A chicken out on the floor is a little object { c: its coop, x, y, s: state, tx, ty, ... }; at most WALK_MAX are
  // out at once, the rest of the flock waits in the coops (still counted, still laying, at a walker's feet). States:
  // 'down' (down the ramp from the coop door), 'wander' (walking to a spot), 'idle' (pecking or looking about there),
  // 'corn' (gathered round the corn), 'home' (to the foot of its ramp at dusk), 'up' (up the ramp and in).
  spawnHen(c, at) {
    const st = this.st, K = CFG.EGGFARM, d = this.coopDoor(c), h = { c, x: d.x, y: d.y, tx: d.x, ty: d.y, s: 'down', sp: U.rand(K.HEN_SPEED[0], K.HEN_SPEED[1]), wait: 0, face: 1, ph: Math.random() * 6.3, flap: 0, peck: false, t: 0, grown: 0 };
    if (at) { h.x = at.x; h.y = at.y; h.s = 'idle'; h.wait = U.rand(0.2, 2.5); h.peck = Math.random() < 0.5; h.face = Math.random() < 0.5 ? -1 : 1; }
    else { const f = this.rampFoot(c); h.tx = f.x + U.rand(-5, 5); h.ty = f.y; h.sp = 72; }   // down the ramp at a trot
    st.flock.push(h); st.walkers[c]++;
    return h;
  },
  // by day, when the game starts: the flock is already out and about (no procession)
  scatterFlock(s) {
    const st = this.st, K = CFG.EGGFARM;
    for (let guard = 0; st.flock.length < K.WALK_MAX && guard < 400; guard++) {
      const c = this.nextOut(s); if (c < 0) break;
      this.spawnHen(c, this.roamSpot());
    }
  },
  // the coop whose turn it is to send a chicken out: the one with the most waiting for each of its chickens already out
  nextOut(s) {
    const st = this.st; let best = -1, score = 0;
    for (let i = 0; i < s.coops; i++) { const free = this.inCoop(s, i) - this.growing(i); if (free > 0 && free / (st.walkers[i] + 1) > score) { score = free / (st.walkers[i] + 1); best = i; } }
    return best;
  },
  // an egg pops out where a chicken stands, with a little flap (and a "bok!", now and then)
  lay(g, h, type) {
    const st = this.st, s = this.state(g);
    st.floor.push({ x: h.x - h.face * 7, y: h.y + 3, t: type, z: 10, vz: -110, pop: 0.3 }); st.floorN = -1;
    s.laid++; st.lays++; h.flap = 0.5;
    const r = Render, seen = h.x > r.camX && h.x < r.camX + r.viewW && h.y > r.camY + 40 && h.y < r.camY + r.viewH;   // (on screen)
    if (g.area === 'barn' && st.bokT <= 0 && this.inHall(g) && seen) { st.bokT = 0.9; g.floats.push({ x: h.x, y: h.y - 36, text: 'bok!', color: '#fff3a0', t: 0, dur: 0.8, big: false }); }
  },
  updateFlock(g, dt) {
    const st = this.st, s = this.state(g), K = CFG.EGGFARM, night = this.night();
    // recount who is out (the save may have changed under us: a coop's chickens can never be more than belong to it)
    st.walkers.fill(0);
    for (let i = st.flock.length - 1; i >= 0; i--) {
      const h = st.flock[i];
      if (h.c >= s.coops || st.walkers[h.c] >= this.shown(s, h.c)) { st.flock.splice(i, 1); continue; }
      st.walkers[h.c]++;
    }
    // the new chickens growing up in their coops: grown, they come straight out (by day, when there is room)
    for (let i = st.grow.length - 1; i >= 0; i--) {
      const q = st.grow[i]; q.t -= dt;
      if (q.c >= s.coops) { st.grow.splice(i, 1); continue; }
      if (q.t <= 0) {
        st.grow.splice(i, 1);
        if (!night && st.flock.length < K.WALK_MAX && this.inCoop(s, q.c) > this.growing(q.c)) {
          const h = this.spawnHen(q.c); h.grown = 1.2; h.flap = 0.6; st.coopPop[q.c] = 0.3;
          if (g.area === 'barn') g.fx.push({ kind: 'sparkle', x0: h.x, y0: h.y - 20, x1: h.x, y1: h.y - 34, t: 0, dur: 0.6 });
        }
      }
    }
    // by day the coops let their chickens out one by one, down the ramps
    st.releaseT -= dt;
    if (!night && st.releaseT <= 0 && st.flock.length < K.WALK_MAX) { st.releaseT = K.RELEASE_GAP; const c = this.nextOut(s); if (c >= 0) this.spawnHen(c); }
    // every chicken out: walk, peck, flap; home to bed at dusk
    const corn = st.cornT > 0;
    for (let i = st.flock.length - 1; i >= 0; i--) {
      const h = st.flock[i]; h.t += dt; h.flap = Math.max(0, h.flap - dt); h.grown = Math.max(0, h.grown - dt);
      if (night && h.s !== 'home' && h.s !== 'up') { const f = this.rampFoot(h.c); h.s = 'home'; h.tx = f.x + U.rand(-4, 4); h.ty = f.y; h.sp = K.HEN_SPEED[1] * 1.25; h.peck = false; }
      if (h.s === 'idle' || (h.s === 'corn' && h.at)) {
        h.wait -= dt;
        if (h.s === 'corn') { if (!corn) { h.s = 'idle'; h.at = false; h.wait = U.rand(0.3, 1.5); } }
        else if (h.wait <= 0) { const q = Math.random() < 0.6 ? this.roamSpot(h.x, h.y, 200) : this.roamSpot(); h.s = 'wander'; h.tx = q.x; h.ty = q.y; h.peck = false; h.sp = U.rand(K.HEN_SPEED[0], K.HEN_SPEED[1]); }
        else if (Math.random() < dt * 0.08) h.flap = 0.45;   // a happy flap now and then
        continue;
      }
      const was = h.x, done = U.moveToward(h, h.tx, h.ty, h.sp, dt);
      if (Math.abs(h.x - was) > 0.01) h.face = h.x < was ? -1 : 1;
      if (!done) continue;
      if (h.s === 'down') { const q = this.roamSpot(h.x, h.y + 70, 120); h.s = 'wander'; h.tx = q.x; h.ty = q.y; h.sp = U.rand(K.HEN_SPEED[0], K.HEN_SPEED[1]); }
      else if (h.s === 'wander') { h.s = 'idle'; h.wait = U.rand(0.8, 3.6); h.peck = Math.random() < 0.65; }
      else if (h.s === 'corn') { h.at = true; h.peck = true; h.face = st.cornAt && st.cornAt.x < h.x ? -1 : 1; }
      else if (h.s === 'home') { const d = this.coopDoor(h.c); h.s = 'up'; h.tx = d.x; h.ty = d.y; h.sp = K.HEN_SPEED[1]; }
      else if (h.s === 'up') { st.flock.splice(i, 1); st.walkers[h.c]--; st.coopPop[h.c] = 0.2; }
    }
    // laying: every chicken awake lays one egg every layTime seconds, where one of the walkers stands; nothing at night
    // (the chickens are asleep); with the floor full (FLOOR_MAX eggs) the hens wait
    const awake = night ? 0 : Math.max(0, this.shownHens(s) - st.grow.length);
    st.bokT = Math.max(0, st.bokT - dt);
    const full = st.floor.length >= K.FLOOR_MAX;
    st.acc = Math.min(full ? 1 : 6, st.acc + awake * dt / this.layTime(s));
    for (let n = 0; st.acc >= 1 && st.floor.length < K.FLOOR_MAX && n < 8; n++) {
      let h = null;
      for (let k = 0; k < 6 && !h; k++) { const q = st.flock[(Math.random() * st.flock.length) | 0]; if (q && (q.s === 'idle' || q.s === 'wander' || q.s === 'corn')) h = q; }
      if (!h) break;
      st.acc -= 1; this.lay(g, h, s.type);
    }
    // corn: the gathered chickens lay a few eggs right there; the bits get eaten up
    if (corn) {
      st.cornT = Math.max(0, st.cornT - dt); st.cornEggT -= dt;
      if (st.cornEggT <= 0 && st.cornEggs > 0 && st.floor.length < K.FLOOR_MAX) {
        st.cornEggT = 2.2; const at = st.flock.filter((h) => h.s === 'corn' && h.at);
        if (at.length) { st.cornEggs--; this.lay(g, at[(Math.random() * at.length) | 0], s.type); }
      }
      for (const c of st.corn) c.t += dt;
      if (st.cornT <= 0) { st.corn.length = 0; st.cornAt = null; }
    }
    // eggs that just popped out bounce and settle
    for (const e of st.floor) {
      if (e.pop > 0) e.pop = Math.max(0, e.pop - dt);
      if (e.z > 0 || e.vz !== 0) { e.vz += 420 * dt; e.z = Math.max(0, e.z - e.vz * dt); if (e.z <= 0) { e.vz = e.vz > 120 ? -e.vz * 0.35 : 0; e.z = 0; } }
    }
    // the floor as saved: only when it changed
    if (st.floorN !== st.floor.length) { st.floorN = st.floor.length; s.floor = st.floor.map((e) => [Math.round(e.x), Math.round(e.y), e.t]); }
  },
  // the packer boxes whatever is in its hopper: eggs go in, a full box pops up the chute onto the pile
  updatePacker(g, dt) {
    const st = this.st, s = this.state(g), K = CFG.EGGFARM;
    if (s.hopper <= 0 || s.boxes >= K.BOX_PILE_CAP) { st.packT = Math.min(st.packT, 1); return; }
    st.packT += this.packRate(s) * dt;
    while (st.packT >= 1 && s.hopper > 0) {
      st.packT -= 1; st.packAnim += 1;
      const v = s.hopperVal / s.hopper; s.hopper--; s.hopperVal = s.hopper > 0 ? Math.max(0, s.hopperVal - v) : 0;
      s.box++; s.boxEggVal += v;
      if (s.box >= this.boxEggs(s)) {
        s.boxes++; s.boxVal += s.boxEggVal; s.box = 0; s.boxEggVal = 0;
        const O = K.PACKER.out, top = this.pileTop(s.boxes - 1);
        st.boxFly.push({ x0: O.x, y0: O.y + 8, x1: top.x, y1: top.y, k: 0, dur: 0.32, to: 'pile', h: 18 });
        if (g.area === 'barn' && st.boxPopT <= 0) { Sfx.drop(); st.boxPopT = 0.6; }
      }
    }
  },
  // where box k of the pile sits (rows of three, stacked up)
  pileTop(k) { const BP = CFG.EGGFARM.BOXPILE, n = Math.min(23, Math.max(0, k)), col = n % 3, row = Math.floor(n / 3); return { x: BP.x - 20 + col * 20 + (row % 2) * 2, y: BP.y - 4 - row * 7 }; },
  inFlightTo(to) { let n = 0; for (const b of this.st.boxFly) if (b.to === to) n++; return n; },

  // ======================= loading the truck =======================
  dockTruck() { return this.st.trucks.find((t) => t.state === 'dock') || null; },
  spareHome() { const v = this.st.spare, B = CFG.EGGFARM.BAYS[1]; return v.where === 'barn' && !(Game.driving && Game.vehicle === v) && U.dist(v.x, v.y, B.x, B.y) < 60; },
  // the middle of a truck's flatbed, in world coords (the art's nose is +x; the bed is behind the cab)
  bedAt(v, k = 0) { const a = v.angle, bx = -19 - 12 + (k % 4) * 8, by = (Math.floor(k / 4) % 3 - 1) * 10; return { x: v.x + Math.cos(a) * bx - Math.sin(a) * by, y: v.y + Math.sin(a) * bx + Math.cos(a) * by - 4 }; },
  // one box from the pile onto a truck: the numbers move at once, the box flies over (the truck draws it when it lands)
  moveBox(g, tr, from) {
    const s = this.state(g), st = this.st, v = s.boxVal / s.boxes;
    s.boxes--; s.boxVal = s.boxes > 0 ? Math.max(0, s.boxVal - v) : 0;
    tr.boxes++; tr.val += v; tr.idle = 0;
    const to = this.bedAt(tr, tr.boxes - 1), f = from || this.pileTop(s.boxes);
    st.boxFly.push({ x0: f.x, y0: f.y, x1: to.x, y1: to.y, k: 0, dur: 0.36, to: tr, h: 46 });
  },
  startLoading(g, which) {
    const st = this.ready(g);
    st.loading = { which, t: 0 };
    g.floats.push({ x: g.player.x, y: g.player.y - 64, text: '📦 Into the truck!', color: '#ffe08a', t: 0, dur: 1, big: true });
    Haptics.tap();
  },
  updateLoading(g, dt) {
    const st = this.st, s = this.state(g), K = CFG.EGGFARM, L = st.loading, p = g.player; if (!L) return;
    const tr = L.which === 'dock' ? this.dockTruck() : st.spare;
    const near = L.which === 'spare' && g.driving ? g.vehicle === st.spare && U.dist(st.spare.x, st.spare.y, K.BOXPILE.x, K.BOXPILE.y) < 140 : !g.driving && U.dist(p.x, p.y, K.LOAD[L.which === 'dock' ? 0 : 1].x, K.LOAD[L.which === 'dock' ? 0 : 1].y) < 80;
    if (!tr || !near || g.area !== 'barn' || s.boxes <= 0 || tr.boxes >= this.truckCap(s)) { st.loading = null; return; }
    L.t -= dt;
    if (L.t <= 0) { L.t = 0.15; this.moveBox(g, tr); if (g.area === 'barn') Sfx.drop(); }
  },
  // the Loader: walks to the pile, picks up boxes, carries them over his head to the truck, drops them in, walks back
  ensureLoader() { if (this.st && this.state(Game).lv.loader > 0 && !this.st.loader) { const H = CFG.EGGFARM.LOADER_HOME; this.st.loader = { x: H.x, y: H.y, state: 'idle', carry: 0, t: 0, facing: -1, bob: 0, moving: false }; } },
  updateLoader(g, dt) {
    this.ensureLoader();
    const L = this.st.loader, s = this.state(g), K = CFG.EGGFARM; if (!L) return;
    const pick = { x: K.BOXPILE.x - 4, y: K.BOXPILE.y - 30 }, drop = { x: K.BAYS[0].x + 12, y: K.BAYS[0].y + 72 }, home = K.LOADER_HOME;
    const tr = this.dockTruck(), want = tr && s.boxes > 0 && tr.boxes < this.truckCap(s);
    const walk = (q) => { const was = { x: L.x, y: L.y }, done = U.moveToward(L, q.x, q.y, K.LOADER_SPEED, dt); L.moving = !done; if (Math.abs(L.x - was.x) > 0.01) L.facing = L.x < was.x ? -1 : 1; if (L.moving) L.bob += dt * 12; return done; };
    L.t = Math.max(0, L.t - dt);
    if (L.state === 'idle') { if (want) L.state = 'toPile'; else walk(home); }
    else if (L.state === 'toPile') {
      if (!want) { L.state = 'idle'; return; }
      if (walk(pick)) { L.carry = Math.min(this.loaderCarry(s), s.boxes, this.truckCap(s) - tr.boxes); L.state = 'lift'; L.t = 0.3; }
    } else if (L.state === 'lift') { if (L.t <= 0) L.state = 'toTruck'; }
    else if (L.state === 'toTruck') {
      L.carry = Math.min(L.carry, s.boxes);   // the chef may have loaded some of the same boxes meanwhile
      if (L.carry <= 0) { L.state = 'idle'; return; }
      if (walk(drop)) {
        const t2 = this.dockTruck();
        if (!t2) return;   // the truck just left: wait here with the boxes for the next one
        const k = Math.min(L.carry, this.truckCap(s) - t2.boxes);
        for (let i = 0; i < k; i++) this.moveBox(g, t2, { x: L.x, y: L.y - 62 - i * 8 });
        L.carry = 0; L.state = 'drop'; L.t = 0.25;
      }
    } else if (L.state === 'drop') { if (L.t <= 0) L.state = want ? 'toPile' : 'idle'; }
  },
  // the pile as drawn: boxes still flying onto it or carried by the loader are not on it
  pileShown(s) { const L = this.st.loader; return Math.max(0, s.boxes - this.inFlightTo('pile') - (L && L.carry > 0 && L.state !== 'toPile' ? L.carry : 0)); },

  // ======================= trucks =======================
  syncTrucks(g) {
    const st = this.st, s = this.state(g), want = this.truckCount(s), B = CFG.EGGFARM.BAYS[0];
    while (st.trucks.length < want) {
      const first = st.trucks.length === 0;
      st.trucks.push({ kind: 'eggtruck', state: first ? 'dock' : 'wait', x: B.x, y: first ? B.y : 4300, angle: -Math.PI / 2, t: 0, idle: 0, boxes: 0, val: 0, d: 0, n: st.trucks.length });
    }
  },
  pay(g, amt) {
    const s = this.state(g), st = this.st, K = CFG.EGGFARM;
    amt = Math.round(amt); if (amt <= 0) return;
    s.earned += amt; st.m.secEarned += amt;
    const at = { x: K.BAYS[0].x, y: K.HALL.y0 + 30 };
    if (this.inHall(g) && !g.driving) Shop.pocket(g, amt, at);
    else s.bank += amt;
    if (g.area === 'barn') g.floats.push({ x: at.x - 30, y: at.y - 40, text: 'Beep beep! 💰', color: '#fff3a0', t: 0, dur: 1.2, big: true });
  },
  routeLen(R) { if (!R.len) { R.len = 0; for (let i = 1; i < R.length; i++) R.len += U.dist(R[i - 1].x, R[i - 1].y, R[i].x, R[i].y); } return R.len; },
  // the spot `d` px along a route, and which way the truck faces there (backwards on a `rev` leg)
  along(R, d) {
    for (let i = 1; i < R.length; i++) {
      const a = R[i - 1], b = R[i], l = U.dist(a.x, a.y, b.x, b.y);
      if (d <= l || i === R.length - 1) { const k = U.clamp(d / l, 0, 1), h = Math.atan2(b.y - a.y, b.x - a.x); return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, h: b.rev ? h + Math.PI : h, rev: !!b.rev }; }
      d -= l;
    }
    return R[R.length - 1];
  },
  turnTo(v, h, rate) { let d = h - v.angle; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; v.angle += d * Math.min(1, rate); },
  updateTrucks(g, dt) {
    const st = this.st, s = this.state(g), K = CFG.EGGFARM, B = K.BAYS[0], H = K.HALL, M = K.MARKET;
    this.syncTrucks(g);
    let dockBusy = st.trucks.some((t) => t.state === 'in' || t.state === 'dock' || t.state === 'toot' || (t.state === 'out' && t.y > H.y0 - 30));
    let transit = 0;
    const seen = g.area === 'barn';
    for (const tr of st.trucks) {
      transit += tr.val;
      if (tr.state === 'wait') {
        if (!dockBusy) { dockBusy = true; tr.state = 'in'; tr.x = B.x; tr.y = 4300; tr.angle = -Math.PI / 2; tr.t = 0; }
      } else if (tr.state === 'in') {
        // backing in through the north doors: beep, beep
        tr.y = Math.min(B.y, tr.y + 120 * dt); tr.t += dt;
        if (tr.y >= B.y) { tr.state = 'dock'; tr.t = 0; tr.idle = 0; }
      } else if (tr.state === 'dock') {
        tr.t += dt; if (!this.inFlightTo(tr)) tr.idle += dt;
        const L = st.loader, coming = L && L.carry > 0 && L.state === 'toTruck';
        if (tr.boxes >= this.truckCap(s) || (tr.boxes > 0 && tr.idle > K.TRUCK_WAIT && !coming && !(st.loading && st.loading.which === 'dock'))) {
          if (!this.inFlightTo(tr)) { tr.state = 'toot'; tr.t = 0; if (seen) { g.floats.push({ x: tr.x, y: tr.y - 70, text: 'Toot toot! 🚚', color: '#ffe08a', t: 0, dur: 1.3, big: true }); Sfx.pay(); } }
        }
      } else if (tr.state === 'toot') {
        tr.t += dt; if (tr.t > 0.8) { tr.state = 'out'; tr.t = 0; }
      } else if (tr.state === 'out') {
        // out through the big north doors and away
        tr.t += dt; tr.y -= Math.min(220, 40 + tr.t * 240) * dt;
        if (tr.y <= 4290) { tr.state = 'road'; tr.d = 0; s.shipped += tr.boxes; const p0 = K.ROUTE_OUT[0]; tr.x = p0.x; tr.y = p0.y; tr.angle = -Math.PI / 2; }
      } else if (tr.state === 'road' || tr.state === 'back') {
        // on the farm track and Main Street (the town map)
        const R = tr.state === 'road' ? K.ROUTE_OUT : K.ROUTE_BACK, at = this.along(R, tr.d);
        tr.d += (at.rev ? 110 : K.ROAD_SPEED) * dt;
        const q = this.along(R, tr.d); tr.x = q.x; tr.y = q.y; this.turnTo(tr, q.h, dt * 7);
        if (tr.d >= this.routeLen(R)) {
          if (tr.state === 'road') { tr.state = 'unload'; tr.t = 0; tr.k = 0; }
          else { this.pay(g, tr.val); tr.val = 0; tr.boxes = 0; tr.state = 'wait'; tr.x = B.x; tr.y = 4300; }
        }
      } else if (tr.state === 'unload') {
        // at the Egg Market: the boxes hop onto the market's counter
        tr.t += dt; tr.k -= dt; this.turnTo(tr, 0, dt * 7);
        if (tr.k <= 0 && tr.boxes > 0) { tr.k = 0.14; tr.boxes--; const f = this.bedAt(tr, tr.boxes); st.boxFly.push({ x0: f.x, y0: f.y, x1: (M.x0 + M.x1) / 2 + U.rand(-28, 28), y1: M.y0 + 2, k: 0, dur: 0.34, to: 'market', h: 30 }); }
        if (!tr.boxes && tr.t > 1.2 && !this.inFlightTo('market')) {
          tr.state = 'back'; tr.d = 0;
          if (g.area === 'town' && U.dist(g.player.x, g.player.y, M.drop.x, M.drop.y) < 700) g.floats.push({ x: M.drop.x, y: M.y0 - 30, text: '🥚 Thank you!', color: '#ffe08a', t: 0, dur: 1.2, big: true });
        }
      }
    }
    s.transit = transit;
  },
  updateBoxes(g, dt) {
    const st = this.st;
    for (let i = st.boxFly.length - 1; i >= 0; i--) {
      const b = st.boxFly[i]; b.k += dt / b.dur;
      if (b.k >= 1) { st.boxFly.splice(i, 1); if (b.to === 'market') st.mkt = Math.min(14, st.mkt + 1); }
    }
    for (const tr of st.trucks) tr.drawBoxes = Math.max(0, tr.boxes - this.inFlightTo(tr));
    st.spare.drawBoxes = Math.max(0, st.spare.boxes - this.inFlightTo(st.spare));
    // the market sells its eggs, a box at a time
    st.mktT -= dt; if (st.mktT <= 0) { st.mktT = 1.6; st.mkt = Math.max(0, st.mkt - 1); }
  },

  // ======================= driving the egg truck =======================
  parkSpare() { const v = this.st.spare, B = CFG.EGGFARM.BAYS[1]; v.where = 'barn'; v.x = B.x; v.y = B.y; v.angle = -Math.PI / 2; v.vx = 0; v.vy = 0; },
  driveOut(g) {
    const st = this.st, v = st.spare, p = g.player, F = CFG.EGGFARM.TOWN.spot;
    v.where = 'town'; v.x = F.x; v.y = F.y; v.angle = -Math.PI / 2; v.vx = 0; v.vy = 0; st.spareOff = false;
    g.area = 'town'; p.x = v.x; p.y = v.y; p.moving = false; p.hasMoved = true; g.cameraSnap = true;
    st.fade = 0.45; st.packing = null; st.loading = null;
    g.floats.push({ x: v.x, y: v.y - 60, text: v.boxes > 0 ? 'Off to the Egg Market! 🚚' : 'Out on the farm! 🚚', color: '#ffe08a', t: 0, dur: 1.4, big: true });
  },
  driveIn(g) {
    const v = this.st.spare, p = g.player, K = CFG.EGGFARM;
    v.where = 'barn'; v.x = K.BAYS[1].x; v.y = K.HALL.y0 + 66; v.angle = Math.PI / 2; v.vx = 0; v.vy = 0;
    g.area = 'barn'; g.driving = true; g.vehicle = v; p.x = v.x; p.y = v.y; p.moving = false; p.hasMoved = true; g.cameraSnap = true;
    this.st.fade = 0.45; Sfx.ding();
  },
  // 🥚 at the Egg Market: the boxes hop off the spare truck onto the counter, then the money (the normal price, the same
  // as the egg trucks get) flies into the chef's pocket
  deliverEggs(g) {
    const st = this.st, v = st.spare;
    if (!v.boxes || st.deliver) return;
    st.deliver = { t: 0, k: 0, n: v.boxes, val: v.val };
    g.floats.push({ x: v.x, y: v.y - 70, text: '🥚 Here are the eggs!', color: '#ffe08a', t: 0, dur: 1.2, big: true });
    Haptics.tap();
  },
  updateDeliver(g, dt) {
    const st = this.st, s = this.state(g), K = CFG.EGGFARM, M = K.MARKET, D = st.deliver, v = st.spare; if (!D) return;
    D.t += dt; D.k -= dt;
    if (D.k <= 0 && v.boxes > 0) { D.k = 0.16; v.boxes--; v.val = v.boxes > 0 ? v.val * v.boxes / (v.boxes + 1) : 0; const f = this.bedAt(v, v.boxes); st.boxFly.push({ x0: f.x, y0: f.y, x1: (M.x0 + M.x1) / 2 + U.rand(-28, 28), y1: M.y0 + 2, k: 0, dur: 0.34, to: 'market', h: 40 }); if (g.area === 'town') Sfx.drop(); }
    if (v.boxes <= 0 && !this.inFlightTo('market')) {
      const amt = Math.round(D.val);
      st.deliver = null; v.val = 0;
      s.earned += amt; s.shipped += D.n; st.m.secEarned += amt;
      Shop.pocket(g, amt, { x: (M.x0 + M.x1) / 2, y: M.y0 });
      g.floats.push({ x: (M.x0 + M.x1) / 2, y: M.y0 - 34, text: '🥚 Thank you! Yummy eggs!', color: '#ffe08a', t: 0, dur: 1.6, big: true });
      Haptics.success();
    }
  },

  // ======================= the lucky egg =======================
  // it rises from the floor at one end of the hall, floats across on its balloon (inside the walls) and, if nobody
  // catches it, drifts up and away at the other end
  spawnLucky(g) {
    const K = CFG.EGGFARM, H = K.HALL, dir = Math.random() < 0.5 ? 1 : -1;
    this.st.lucky = { x: dir > 0 ? H.x0 + 80 : H.x1 - 80, y: U.rand(4640, 4790), dir, t: 0, leave: 0 };
  },
  catchLucky(g) {
    const st = this.st, s = this.state(g), L = st.lucky; if (!L) return;
    st.lucky = null; st.luckyT = U.rand(CFG.EGGFARM.LUCKY_EVERY[0], CFG.EGGFARM.LUCKY_EVERY[1]);
    const amt = Math.max(50, Math.round(s.rate * 20)), ey = L.y - 70;
    s.earned += amt;
    Shop.pocket(g, amt, { x: L.x, y: ey });
    for (let i = 0; i < 6; i++) this.catchEgg(g, L.x + U.rand(-12, 12), ey, Math.max(1, s.type), i * 0.07);
    for (let i = 0; i < 3; i++) g.fx.push({ kind: 'sparkle', x0: L.x + U.rand(-20, 20), y0: ey + U.rand(-20, 20), x1: L.x, y1: ey, t: -i * 0.1, dur: 0.6 });
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
    st.boxPopT = Math.max(0, (st.boxPopT || 0) - dt);
    for (let i = 0; i < 6; i++) st.coopPop[i] = Math.max(0, st.coopPop[i] - dt);
    if (this.inHall(g) && !s.seen) { s.seen = true; g.floats.push({ x: p.x, y: p.y - 70, text: '🐣 The Egg Farm!', color: '#ffe08a', t: 0, dur: 2, big: true }); }
    // the automatic hatcher
    const every = this.autoEvery(s);
    if (every > 0) { st.autoT += dt; if (st.autoT >= every) { st.autoT = 0; this.hatch(g, true); } }
    // chicks waddle to their coops; in they go, and after a little while they come out grown (updateFlock)
    for (let i = st.chicks.length - 1; i >= 0; i--) {
      const c = st.chicks[i]; c.t += dt; c.pop = Math.max(0, c.pop - dt);
      if (c.pop > 0) continue;
      const wp = c.path[c.i];
      if (U.moveToward(c, wp.x, wp.y, 105, dt)) { c.i++; if (c.i >= c.path.length) { st.chicks.splice(i, 1); st.incoming[c.c] = Math.max(0, st.incoming[c.c] - 1); st.grow.push({ c: c.c, t: K.GROW }); st.coopPop[c.c] = 0.35; this.checkMilestone(g); } }
    }
    this.updateFlock(g, dt);
    this.updatePacker(g, dt);
    this.updateTrucks(g, dt);
    this.updateLoader(g, dt);
    this.updateLoading(g, dt);
    this.updateDeliver(g, dt);
    this.updateBoxes(g, dt);
    this.updateCollect(g, dt);
    this.updateStack(g, dt);
    // the egg money waiting by the dock
    if (s.bank > 0 && g.area === 'barn' && !g.driving && U.dist(p.x, p.y, K.CASH.x, K.CASH.y) < 46) { const amt = Math.round(s.bank); s.bank = 0; Shop.pocket(g, amt, K.CASH); }
    s.rate = Shop.meter(st.m, dt, s.rate);
    // the lucky egg drifts across the hall on its balloon
    if (st.lucky) {
      const L = st.lucky, H = K.HALL; L.t += dt;
      if (L.leave) { L.leave += dt; if (L.leave > 1.6) { st.lucky = null; st.luckyT = U.rand(K.LUCKY_EVERY[0], K.LUCKY_EVERY[1]); } }
      else {
        L.x += L.dir * 55 * dt;
        if (this.inHall(g) && !g.driving && U.dist(p.x, p.y, L.x, L.y) < 34) this.catchLucky(g);
        else if (L.x < H.x0 + 70 || L.x > H.x1 - 70) L.leave = 0.001;
      }
    } else if (this.inHall(g)) { st.luckyT -= dt; if (st.luckyT <= 0) this.spawnLucky(g); }
    // the rooster crows when dawn breaks
    const ph = typeof AtmosphereExt !== 'undefined' ? AtmosphereExt.phase : 'day';
    if (ph === 'dawn' && st.lastPhase && st.lastPhase !== 'dawn') this.crow(g);
    st.lastPhase = ph; st.crow = Math.max(0, st.crow - dt);
    // peeking ends when you walk away
    if (st.peek) { st.peek.t -= dt; if (st.peek.t <= 0 || p.moving || !this.inHall(g)) st.peek = null; }
    if (st.banner) { st.banner.t += dt; if (st.banner.t > 3.2) st.banner = null; }
    // driving the spare truck: out through the big north doors onto the farm; left on the farm, it drives home by itself
    const v = st.spare, mine = g.driving && g.vehicle === v, D = K.DOOR;
    if (mine && g.area === 'barn' && v.y < K.HALL.y0 + 34 && v.x > D.x0 && v.x < D.x1) this.driveOut(g);
    if (!mine && v.where === 'town' && !st.deliver && (g.area !== 'town' || U.dist(p.x, p.y, v.x, v.y) > 1000)) this.parkSpare();
    s.spare.boxes = v.boxes; s.spare.val = v.val;
    if (v.where === 'town' && U.dist(v.x, v.y, K.TOWN.spot.x, K.TOWN.spot.y) > 140) st.spareOff = true;
    st.frameMs = performance.now() - t0;
  },
  crow(g) {
    const st = this.st, R = CFG.EGGFARM.ROOSTER;
    st.crow = 2.4;
    if (g.area === 'barn') { g.floats.push({ x: R.x, y: R.y - 54, text: 'Cock-a-doodle-doo! 🐓', color: '#ffe08a', t: 0, dur: 2, big: true }); Sfx.chime(); }
  },
  home(g) {
    const st = this.st; if (!st) return;
    st.peek = null; st.packing = null; st.loading = null; st.fade = 0; st.banner = null;
    this.settleFlights(g);
    if (st.deliver) { const D = st.deliver, s = this.state(g), amt = Math.round(D.val); st.deliver = null; st.spare.boxes = 0; st.spare.val = 0; s.earned += amt; s.shipped += D.n; Shop.pocket(g, amt, g.player); }
    this.parkSpare();
  },

  // ======================= hints =======================
  hint(g) {
    const st = this.st; if (!st) return undefined;
    const p = g.player, K = CFG.EGGFARM, s = this.state(g), v = st.spare;
    if (this.busy(g)) return undefined;
    if (g.area === 'town') {
      if (g.driving && g.vehicle === v) {
        if (st.deliver) return { text: 'Unloading the eggs! 🥚', target: null };
        if (v.boxes > 0) { const M = K.MARKET.drop, d = U.dist(v.x, v.y, M.x, M.y); return { text: 'Drive the eggs to the Egg Market! 🥚', target: d < K.MARKET.r ? null : M }; }
        const S = K.TOWN.spot, d = U.dist(v.x, v.y, S.x, S.y);
        return { text: 'Drive back into the barn! 🚚', target: d < 70 ? null : S };
      }
      const M = K.MARKET; if (!g.driving && U.dist(p.x, p.y, (M.x0 + M.x1) / 2, M.y1 + 20) < 70) return { text: 'The Egg Market! The egg trucks bring eggs here 🥚', target: null };
      return undefined;
    }
    if (g.area !== 'barn' || (BarnExt.st && BarnExt.st.loft)) return undefined;
    if (!this.inHall(g)) return st.stack.length && !g.driving ? { text: 'Take the eggs through the arch! 🥚', target: CFG.BARN.arch.mat } : undefined;
    const door = { x: K.BAYS[1].x, y: K.HALL.y0 + 20 };
    if (g.driving) {
      if (g.vehicle !== v) return undefined;
      if (st.loading) return { text: 'Loading the truck! 📦', target: null };
      if (v.boxes > 0) return { text: 'Drive out of the big doors to the Egg Market! 🚚', target: door };
      if (s.boxes > 0) { const d = U.dist(v.x, v.y, K.BOXPILE.x, K.BOXPILE.y); return { text: 'Drive to the boxes and load the truck! 📦', target: d < 120 ? null : K.BOXPILE }; }
      return { text: 'Drive out of the big doors! 🚚', target: door };
    }
    const at = (q, r) => U.dist(p.x, p.y, q.x, q.y) < r;
    if (st.peek) return { text: 'Look at the chickens! 🐔', target: null };
    if (st.lucky && !st.lucky.leave && U.dist(p.x, p.y, st.lucky.x, st.lucky.y) < 320) return { text: 'Catch the lucky egg! 🎈', target: { x: st.lucky.x, y: st.lucky.y } };
    if (st.packing) return { text: 'Packing the eggs! 📦', target: null };
    if (st.loading) return { text: 'Loading the truck! 📦', target: null };
    const btn = K.HATCHER.btn, atBtn = at(btn, 44);
    if (this.hens(s) === 0) return { text: 'Press the big red button! 🐣', target: atBtn ? null : btn };
    if (s.bank > 0) return { text: 'Grab the egg money! 💰', target: K.CASH };
    const eggs = st.floor.length;
    if (st.stack.length && (eggs === 0 || st.stack.length >= 30 || at(K.PACK, 220))) return { text: 'Put the eggs in the packer! 📦', target: at(K.PACK, K.PACK.r) ? null : K.PACK };
    const tr = this.dockTruck();
    if (s.boxes > 0 && !s.lv.loader && tr && tr.boxes < this.truckCap(s)) return { text: 'Load the boxes onto the truck! 🚚', target: at(K.LOAD[0], K.LOAD_R) ? null : K.LOAD[0] };
    if (st.trucks.some((t) => t.state === 'toot' || (t.state === 'out' && t.y > 4330))) return { text: 'Toot toot! Off to the Egg Market! 🚚', target: null };
    if (eggs > 0) {
      // the nearest egg (no arrow once it is in reach: walking about picks them up)
      let best = null, bd = 1e9;
      for (const e of st.floor) { const d = U.dist(p.x, p.y, e.x, e.y); if (d < bd) { bd = d; best = e; } }
      return { text: 'Pick up the eggs! 🥚', target: bd < K.MAGNET ? null : { x: best.x, y: best.y } };
    }
    if (this.night() && !st.flock.length) return { text: 'Shh! The chickens are asleep 😴', target: null };
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
  // a whole chicken from the side, facing right (feet drawn live), dressed for each egg type; `up`: wing flapping
  paintWalkHen(c, type, x, y, up, leg) {
    // the little orange legs (baked in: a frame for standing and one for each stride)
    c.strokeStyle = '#ff9f1c'; c.lineWidth = 1.8; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x - 2, y + 6); c.lineTo(x - 2 + leg * 2.5, y + 12); c.lineTo(x - 2 + leg * 2.5 + 2.5, y + 12.5); c.moveTo(x + 2, y + 6); c.lineTo(x + 2 - leg * 2.5, y + 12); c.lineTo(x + 2 - leg * 2.5 + 2.5, y + 12.5); c.stroke();
    const body = ['#fffaf0', '#ffcf3a', '#fffaf0', '#cbb8ff', '#ff9a3d'][type], wing = ['#efe4d0', '#f2b134', '#ffd6ec', '#a996f0', '#e8742a'][type];
    c.lineWidth = 0.8; c.strokeStyle = 'rgba(90,60,30,0.45)';
    // the tail: three perky feathers at the back
    c.fillStyle = wing; for (const [dx, dy, a] of [[-11, -7, -0.9], [-12, -3, -0.5], [-11, 1, -0.1]]) { c.save(); c.translate(x + dx, y + dy); c.rotate(a); c.beginPath(); c.ellipse(0, -3, 2.6, 5, 0, 0, Math.PI * 2); c.fill(); c.restore(); }
    // the round body
    c.fillStyle = body; c.beginPath(); c.ellipse(x - 1, y, 10.5, 8, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    if (type === 2) { ['#ff5a5f', '#ffe14d', '#5ad15a', '#3fa7ff'].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.ellipse(x - 2, y - 3 + i * 2.6, 8.5 - Math.abs(i - 1.5) * 1.4, 1.2, 0, 0, Math.PI * 2); c.fill(); }); }
    // the head on a little neck
    c.fillStyle = body; c.beginPath(); c.ellipse(x + 6, y - 6, 4.5, 6, 0.3, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(x + 8, y - 10, 5, 0, Math.PI * 2); c.fill(); c.stroke();
    if (type !== 4) { c.fillStyle = '#e53935'; for (const [dx, dy, r] of [[5.5, -15, 2], [8, -16, 2.4], [10.5, -15, 2]]) { c.beginPath(); c.arc(x + dx, y + dy, r, 0, Math.PI * 2); c.fill(); } }
    c.fillStyle = '#ffa726'; c.beginPath(); c.moveTo(x + 12.5, y - 11.5); c.lineTo(x + 17, y - 9.5); c.lineTo(x + 12.5, y - 8); c.closePath(); c.fill();   // beak
    c.fillStyle = '#e53935'; c.beginPath(); c.ellipse(x + 11.5, y - 6, 1.3, 2, 0, 0, Math.PI * 2); c.fill();                                            // wattle
    c.fillStyle = '#2b1d14'; c.beginPath(); c.arc(x + 9.6, y - 11, 1.15, 0, Math.PI * 2); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(x + 10, y - 11.4, 0.4, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,120,140,0.5)'; c.beginPath(); c.arc(x + 7.5, y - 8, 1.3, 0, Math.PI * 2); c.fill();
    // the wing: folded at the side, or up in a flap
    c.fillStyle = wing; c.save(); c.translate(x - 2, y - 1); c.rotate(up ? -1.0 : -0.15); c.beginPath(); c.ellipse(up ? -1 : 0, up ? -4 : 0, 6.5, 4.2, 0, 0, Math.PI * 2); c.fill(); c.stroke(); c.restore();
    // dressed up for the egg type
    if (type === 1) { c.fillStyle = '#ff5fa2'; c.beginPath(); c.moveTo(x + 5, y - 13); c.lineTo(x + 1, y - 16); c.lineTo(x + 1, y - 10); c.closePath(); c.fill(); c.beginPath(); c.moveTo(x + 5, y - 13); c.lineTo(x + 8, y - 17.5); c.lineTo(x + 8.5, y - 12); c.closePath(); c.fill(); }
    else if (type === 3) { c.fillStyle = 'rgba(190,230,255,0.3)'; c.beginPath(); c.arc(x + 9, y - 11, 8, 0, Math.PI * 2); c.fill(); c.strokeStyle = 'rgba(220,245,255,0.95)'; c.lineWidth = 1.1; c.beginPath(); c.arc(x + 9, y - 11, 8, 0, Math.PI * 2); c.stroke(); c.fillStyle = '#ffe14d'; this.star(c, x + 9, y - 21, 2.2, 1); }
    else if (type === 4) { c.fillStyle = '#ffd23f'; c.beginPath(); c.moveTo(x + 4, y - 13); c.lineTo(x + 3.5, y - 19); c.lineTo(x + 6, y - 16); c.lineTo(x + 8, y - 20); c.lineTo(x + 10, y - 16); c.lineTo(x + 12.5, y - 19); c.lineTo(x + 12, y - 13); c.closePath(); c.fill(); c.fillStyle = '#e4572e'; c.beginPath(); c.arc(x + 8, y - 15.5, 1, 0, Math.PI * 2); c.fill(); }
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
      face: T.map((_, i) => mk(18, 22, (c) => this.paintFace(c, i, 9, 13))),
      sleep: T.map((_, i) => mk(18, 22, (c) => this.paintFace(c, i, 9, 13, true))),
      walk: T.map((_, i) => [0, 1, -1, 0].map((leg, k) => mk(34, 34, (c) => this.paintWalkHen(c, i, 15, 19, k === 3, leg)))),   // legs still, two strides, a flap
      box: mk(20, 13, (c) => this.paintBox(c, 20, 13)),
    };
  },
  spr() { if (!this.sprites) this.makeSprites(); return this.sprites; },
  drawEgg(ctx, type, x, y, s = 1) { const E = this.EW * s, H = this.EH * s; ctx.drawImage(this.spr().egg[type], x - E / 2, y - H / 2, E, H); },
  // a hen's little face, front on, dressed for each egg type: one of these per hen in the coops (and the peek view)
  paintFace(c, type, x, y, asleep) {
    const body = ['#fffaf0', '#ffcf3a', '#fffaf0', '#cbb8ff', '#ff9a3d'][type];
    if (type !== 4) { c.fillStyle = '#e53935'; for (const [dx, dy, r] of [[-3, -6.5, 2.3], [0, -7.5, 2.6], [3, -6.5, 2.3]]) { c.beginPath(); c.arc(x + dx, y + dy, r, 0, Math.PI * 2); c.fill(); } }
    c.fillStyle = body; c.beginPath(); c.arc(x, y, 6.2, 0, Math.PI * 2); c.fill();
    if (type === 2) { c.fillStyle = '#ff5a5f'; c.fillRect(x - 5.5, y + 2.6, 11, 1.3); c.fillStyle = '#3fa7ff'; c.fillRect(x - 4.5, y + 4.2, 9, 1.2); }
    c.strokeStyle = 'rgba(90,60,30,0.45)'; c.lineWidth = 0.7; c.beginPath(); c.arc(x, y, 6.2, 0, Math.PI * 2); c.stroke();
    if (asleep) { c.strokeStyle = '#2b1d14'; c.lineWidth = 0.8; for (const dx of [-2.3, 2.3]) { c.beginPath(); c.arc(x + dx, y - 1.6, 1.2, Math.PI * 0.15, Math.PI * 0.85); c.stroke(); } }   // eyes shut, fast asleep
    else {
      c.fillStyle = '#2b1d14'; for (const dx of [-2.3, 2.3]) { c.beginPath(); c.arc(x + dx, y - 1.2, 1.05, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = '#fff'; for (const dx of [-2, 2.6]) { c.beginPath(); c.arc(x + dx, y - 1.6, 0.4, 0, Math.PI * 2); c.fill(); }
    }
    c.fillStyle = '#ffa726'; c.beginPath(); c.moveTo(x - 1.6, y + 0.6); c.lineTo(x + 1.6, y + 0.6); c.lineTo(x, y + 3); c.closePath(); c.fill();
    c.fillStyle = '#e53935'; c.beginPath(); c.ellipse(x, y + 3.9, 1, 1.3, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,120,140,0.5)'; for (const dx of [-3.8, 3.8]) { c.beginPath(); c.arc(x + dx, y + 1.2, 1.1, 0, Math.PI * 2); c.fill(); }
    if (type === 1) { c.fillStyle = '#ff5fa2'; c.beginPath(); c.moveTo(x + 4, y - 4); c.lineTo(x + 8, y - 7); c.lineTo(x + 8, y - 1.5); c.closePath(); c.fill(); c.beginPath(); c.moveTo(x + 4, y - 4); c.lineTo(x + 7, y + 0.5); c.lineTo(x + 2, y - 0.5); c.closePath(); c.fill(); }
    else if (type === 2) { c.fillStyle = '#3fa7ff'; c.beginPath(); c.moveTo(x - 3.5, y - 5); c.lineTo(x + 1, y - 13); c.lineTo(x + 3.5, y - 5); c.closePath(); c.fill(); c.fillStyle = '#ffe14d'; c.beginPath(); c.arc(x + 1, y - 13, 1.4, 0, Math.PI * 2); c.fill(); }
    else if (type === 3) { c.strokeStyle = 'rgba(220,245,255,0.95)'; c.lineWidth = 1; c.beginPath(); c.arc(x, y - 0.5, 8, 0, Math.PI * 2); c.stroke(); c.fillStyle = 'rgba(190,230,255,0.22)'; c.beginPath(); c.arc(x, y - 0.5, 8, 0, Math.PI * 2); c.fill(); c.fillStyle = '#ffe14d'; this.star(c, x, y - 10.5, 2, 0.9); }
    else if (type === 4) { c.fillStyle = '#ffd23f'; c.beginPath(); c.moveTo(x - 5, y - 4.5); c.lineTo(x - 5.5, y - 10.5); c.lineTo(x - 2.5, y - 7.5); c.lineTo(x, y - 11.5); c.lineTo(x + 2.5, y - 7.5); c.lineTo(x + 5.5, y - 10.5); c.lineTo(x + 5, y - 4.5); c.closePath(); c.fill(); c.fillStyle = '#e4572e'; c.beginPath(); c.arc(x, y - 7, 1, 0, Math.PI * 2); c.fill(); }
  },
  // how a coop's hens sit in its wire front: as many columns and rows as its size needs, the bottom row filling first
  grid(cap, w, h) {
    let cols = Math.max(1, Math.round(Math.sqrt(cap * w / h))), rows = Math.ceil(cap / cols);
    if (Math.min(w / cols, h / rows) < Math.min(w / (cols + 1), h / Math.ceil(cap / (cols + 1)))) { cols++; rows = Math.ceil(cap / cols); }
    const cell = Math.min(w / cols, h / rows);
    return { cols, rows, cell, ox: (w - cols * cell) / 2, oy: (h - rows * cell) / 2 };
  },
  coopFront(i) { const K = CFG.EGGFARM, x0 = K.COOP_X[i] - K.COOP.w / 2; return { x: x0 + 6, y: K.COOP.y0 + 6, w: K.COOP.w - 12, h: K.COOP.y1 - 24 - (K.COOP.y0 + 6) }; },
  // the coop's front, cached until its number of chickens inside, their egg type, the coop's size or day/night changes:
  // one face per chicken inside (eyes shut at night)
  coopFace(i, n, type, cap, asleep) {
    const st = this.st, key = n + '|' + type + '|' + cap + (asleep ? 'z' : '');
    let c = st.faces[i];
    if (c && c.key === key) return c.cv;
    const F = this.coopFront(i), S = 3;
    if (!c) { c = st.faces[i] = { key: null, cv: document.createElement('canvas') }; c.cv.width = Math.ceil(F.w * S); c.cv.height = Math.ceil(F.h * S); }
    c.key = key;
    const ctx = c.cv.getContext('2d'); ctx.setTransform(S, 0, 0, S, 0, 0); ctx.clearRect(0, 0, F.w, F.h);
    ctx.fillStyle = '#6b4424'; ctx.fillRect(0, 0, F.w, F.h);
    const G = this.grid(cap, F.w, F.h), face = this.spr()[asleep ? 'sleep' : 'face'][type], fw = Math.min(G.cell * 1.1, 20), fh = fw * 22 / 18;
    for (let r = 0; r < G.rows; r++) {
      const y = G.oy + (G.rows - r) * G.cell;
      ctx.fillStyle = '#8d5a2b'; ctx.fillRect(0, y - Math.max(1, G.cell * 0.12), F.w, Math.max(1, G.cell * 0.12));   // a perch under each row
      ctx.fillStyle = 'rgba(240,207,122,0.35)'; ctx.fillRect(0, y - Math.max(1.5, G.cell * 0.2), F.w, Math.max(0.6, G.cell * 0.08));
    }
    for (let k = 0; k < Math.min(n, cap); k++) {
      const r = Math.floor(k / G.cols), col = k % G.cols, cx = G.ox + (col + 0.5) * G.cell, cy = G.oy + (G.rows - r - 0.5) * G.cell;
      ctx.drawImage(face, cx - fw / 2, cy - fh * 0.62, fw, fh);
    }
    c.drawn = Math.min(n, cap);   // (the tests check this equals the chickens in the coop: at night, the number on the roof)
    // the wire mesh over the front
    ctx.strokeStyle = 'rgba(230,230,220,0.22)'; ctx.lineWidth = 0.5;
    for (let d = -F.h; d < F.w; d += 5) { ctx.beginPath(); ctx.moveTo(d, F.h); ctx.lineTo(d + F.h, 0); ctx.moveTo(d, 0); ctx.lineTo(d + F.h, F.h); ctx.stroke(); }
    return c.cv;
  },

  // ======================= static art (cached background) =======================
  bgKey(g) { return g.area === 'barn' && this.st ? 'egg' + this.state(g).coops : ''; },
  paintAfter(r, g, area) { if (area === 'barn') this.paintHall(r, g); },
  paintHall(r, g) {
    const ctx = r.ctx, K = CFG.EGGFARM, H = K.HALL, w = K.WALL, B = CFG.BARN, R = B.room, A = B.arch, W = CFG.AREAS.barn.WORLD, s = this.state(g), D = K.DOOR;
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
    for (let i = 0; i < 22; i++) { const x = bx0 + 20 + i * 36, sag = Math.sin((i / 21) * Math.PI) * 26, y = W.y0 + 58 + sag; ctx.fillStyle = K.COOP_COLORS[i % 6]; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 30, y + 2); ctx.lineTo(x + 15, y + 22); ctx.closePath(); ctx.fill(); }
    ctx.strokeStyle = '#f5f0dc'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let i = 0; i <= 22; i++) { const x = bx0 + 20 + i * 36, y = W.y0 + 58 + Math.sin((i / 21) * Math.PI) * 26; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke();
    planks(bx0, wallTop, H.x1 + w, H.y0, '#8e2a2a', '#9c3232', 20, true);
    ctx.fillStyle = '#f5f0dc'; ctx.fillRect(bx0, wallTop, H.x1 + w - bx0, 4); ctx.fillRect(bx0, H.y0 - 4, D.x0 - bx0, 4);
    // ---- the big north doors: open onto the farm track, Main Street beyond; the sliding door rolled back on its rail
    this.paintDoorway(r, g);
    // ---- the strip under the old barn, the side walls, the bottom wall
    const wallRect = (x, y, ww, hh, vertical) => { planks(x, y, x + ww, y + hh, '#8e2a2a', '#9c3232', 20, !vertical); ctx.fillStyle = '#f5f0dc'; if (vertical) { ctx.fillRect(x, y, 3, hh); ctx.fillRect(x + ww - 3, y, 3, hh); } else { ctx.fillRect(x, y, ww, 3); ctx.fillRect(x, y + hh - 3, ww, 3); } };
    wallRect(R.x0 - w, R.y1 + w, A.x0 - (R.x0 - w), H.y0 - R.y1 - w, false); wallRect(A.x1, R.y1 + w, R.x1 + w - A.x1, H.y0 - R.y1 - w, false);
    wallRect(H.x0 - w, R.y1 + w, w, H.y1 - R.y1, true);
    wallRect(H.x1, H.y0, w, H.y1 + w - H.y0, true);
    wallRect(H.x0 - w, H.y1, H.x1 - H.x0 + 2 * w, w, false);
    // ---- the hall floor: wide pale boards, a little straw
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(H.x0, H.y0, D.x0 - H.x0, 5);
    planks(H.x0, H.y0, H.x1, H.y1, '#d2a66a', '#caa064', 28, false);
    ctx.fillStyle = 'rgba(0,0,0,0.1)'; for (let i = 0; i < 46; i++) ctx.fillRect(H.x0 + ((i * 263) % (H.x1 - H.x0 - 20)) + 10, H.y0 + Math.floor(((i * 89) % (H.y1 - H.y0)) / 28) * 28, 1.5, 28);
    ctx.strokeStyle = 'rgba(240,207,122,0.85)'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 120; i++) { const x = H.x0 + 14 + ((i * 337) % (H.x1 - H.x0 - 28)), y = H.y0 + 12 + ((i * 151) % (H.y1 - H.y0 - 24)), a = (i * 1.7) % 6.3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 8, y + Math.sin(a) * 4); ctx.stroke(); }
    // ---- the archway through from the old barn: the passage floor, two posts and a painted arch with an egg on top
    ctx.fillStyle = '#b5773a'; ctx.fillRect(A.x0, R.y1, A.x1 - A.x0, H.y0 - R.y1 + 2);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = R.y1; y < H.y0; y += 13) ctx.fillRect(A.x0, y, A.x1 - A.x0, 1.5);
    for (const x of [A.x0 - 10, A.x1]) { ctx.fillStyle = '#f5f0dc'; ctx.fillRect(x, R.y1 - 6, 10, H.y0 - R.y1 + 8); ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x + 7, R.y1 - 6, 3, H.y0 - R.y1 + 8); }
    ctx.strokeStyle = '#f5f0dc'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(A.x0 - 5, R.y1); ctx.quadraticCurveTo((A.x0 + A.x1) / 2, R.y1 - 46, A.x1 + 5, R.y1); ctx.stroke();
    ctx.strokeStyle = '#f2b134'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(A.x0 - 5, R.y1 - 1); ctx.quadraticCurveTo((A.x0 + A.x1) / 2, R.y1 - 47, A.x1 + 5, R.y1 - 1); ctx.stroke();
    this.paintEgg(ctx, 1, (A.x0 + A.x1) / 2, R.y1 - 26, 9, 12);
    const M = K.ARCH_MAT; ctx.fillStyle = '#e0b44c'; U.roundRect(ctx, M.x - 30, M.y - 10, 60, 22, 6); ctx.fill(); ctx.fillStyle = '#f2c94c'; U.roundRect(ctx, M.x - 25, M.y - 6, 50, 14, 4); ctx.fill();
    ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#8d5a2b'; ctx.fillText('🐣 🥚 🐔', M.x, M.y + 1);
    // ---- the chicks' path: a yellow painted lane with footprints, from the hatcher along the coops
    const O = K.HATCHER.out, CY = K.CHICK_Y, lastX = K.COOP_X[5] - 28;
    ctx.fillStyle = 'rgba(255,217,59,0.32)'; U.roundRect(ctx, O.x + 6, O.y + 2, 28, CY - O.y + 8, 10); ctx.fill(); U.roundRect(ctx, O.x + 6, CY - 12, lastX - O.x + 10, 24, 12); ctx.fill();
    ctx.strokeStyle = 'rgba(201,140,20,0.55)'; ctx.lineWidth = 1.4;
    for (let x = O.x + 40; x < lastX; x += 26) for (const [dx, dy] of [[0, -4], [11, 4]]) { const fx = x + dx, fy = CY + dy; ctx.beginPath(); ctx.moveTo(fx + 4, fy); ctx.lineTo(fx - 1, fy - 2.5); ctx.moveTo(fx + 4, fy); ctx.lineTo(fx - 1, fy + 2.5); ctx.moveTo(fx + 4, fy); ctx.lineTo(fx - 2, fy); ctx.stroke(); }
    // ---- the hatcher's shadow (its shiny top, dome and button are drawn every frame)
    const Hc = K.HATCHER;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(Hc.x0 + 4, Hc.y1 - 4, Hc.x1 - Hc.x0, 12);
    // ---- the corn sack
    const C = K.CORN;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(C.x + 3, C.y + 14, 28, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8d3a3'; U.roundRect(ctx, C.x - 24, C.y - 22, 48, 38, 12); ctx.fill(); ctx.fillStyle = '#d6bd85'; U.roundRect(ctx, C.x - 24, C.y - 22, 48, 10, 8); ctx.fill();
    ctx.fillStyle = '#ffd23f'; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(C.x - 14 + (i % 5) * 7, C.y - 24 + Math.floor(i / 5) * 4, 2.6, 0, Math.PI * 2); ctx.fill(); }
    ctx.font = r.font(16); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🌽', C.x, C.y + 1);
    this.spot(r, C.spot.x, C.spot.y + 6, '🌽', 'rgba(242,177,52,0.9)', 26, 14);
    // ---- the coops (bought ones), and dashed ghosts where new ones will go
    for (let i = 0; i < 6; i++) this.paintCoop(r, g, i, i < s.coops);
    // ---- the egg packer: a big blue machine with a hopper on top, its arm in a window, and a chute up to the box pile
    const P = K.PACKER, Hp = P.hopper, BP = K.BOXPILE;
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(P.x0 + 6, P.y0 + 8, P.x1 - P.x0, P.y1 - P.y0);
    ctx.fillStyle = '#2f6fb5'; U.roundRect(ctx, P.x0, P.y0, P.x1 - P.x0, P.y1 - P.y0, 10); ctx.fill();
    ctx.fillStyle = '#3b86d8'; U.roundRect(ctx, P.x0 + 4, P.y0 + 4, P.x1 - P.x0 - 8, 20, 8); ctx.fill();
    ctx.fillStyle = '#9fd3ff'; U.roundRect(ctx, P.x0 + 56, P.y0 + 26, 64, 42, 6); ctx.fill();   // the window onto the packing arm
    ctx.fillStyle = '#1f4f86'; for (const [rx, ry] of [[8, 8], [P.x1 - P.x0 - 8, 8], [8, P.y1 - P.y0 - 8], [P.x1 - P.x0 - 8, P.y1 - P.y0 - 8]]) { ctx.beginPath(); ctx.arc(P.x0 + rx, P.y0 + ry, 2.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#ffd23f'; U.roundRect(ctx, P.x0 + 124, P.y0 + 30, 46, 18, 6); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🥚→📦', P.x0 + 147, P.y0 + 39);
    // the hopper: a grey funnel open at the top
    ctx.fillStyle = '#8c939b'; ctx.beginPath(); ctx.moveTo(Hp.x - 30, Hp.y - 10); ctx.lineTo(Hp.x + 30, Hp.y - 10); ctx.lineTo(Hp.x + 18, Hp.y + 34); ctx.lineTo(Hp.x - 14, Hp.y + 34); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5d636b'; ctx.beginPath(); ctx.ellipse(Hp.x, Hp.y - 9, 31, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b2f35'; ctx.beginPath(); ctx.ellipse(Hp.x, Hp.y - 8, 26, 7.5, 0, 0, Math.PI * 2); ctx.fill();
    // the chute from the packer up to the box pile, and the pallet the boxes sit on
    ctx.fillStyle = '#8c939b'; ctx.beginPath(); ctx.moveTo(P.out.x - 18, P.out.y + 2); ctx.lineTo(P.out.x + 18, P.out.y + 2); ctx.lineTo(BP.x + 22, BP.y + 14); ctx.lineTo(BP.x - 22, BP.y + 14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#6b7178'; for (let y = BP.y + 18; y < P.out.y; y += 6) ctx.fillRect(BP.x - 18, y, 36, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(BP.x - 30, BP.y + 2, 64, 16);
    ctx.fillStyle = '#b8862c'; ctx.fillRect(BP.x - 32, BP.y - 6, 64, 20); ctx.fillStyle = '#8d5a2b'; for (let k = 0; k < 4; k++) ctx.fillRect(BP.x - 32, BP.y - 6 + k * 6, 64, 2);
    // ---- the painted spots: pack the eggs at the packer, load the truck behind each bay
    this.spot(r, K.PACK.x, K.PACK.y, '🥚', 'rgba(242,177,52,0.9)', 34, 20);
    for (const L of K.LOAD) this.spot(r, L.x, L.y + 4, '📦', 'rgba(255,255,255,0.75)', 26, 15);
    // ---- the two truck bays: yellow lines and arrows pointing out of the north doors
    for (const [i, Bq] of K.BAYS.entries()) {
      ctx.strokeStyle = i ? 'rgba(255,255,255,0.75)' : '#ffd23f'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(Bq.x - 38, H.y0); ctx.lineTo(Bq.x - 38, Bq.y + 60); ctx.moveTo(Bq.x + 38, H.y0); ctx.lineTo(Bq.x + 38, Bq.y + 60); ctx.stroke();
      ctx.fillStyle = i ? 'rgba(255,255,255,0.4)' : 'rgba(255,210,63,0.5)';
      for (const y of [Bq.y - 20, Bq.y + 20]) { ctx.beginPath(); ctx.moveTo(Bq.x, y - 12); ctx.lineTo(Bq.x - 10, y + 2); ctx.lineTo(Bq.x + 10, y + 2); ctx.closePath(); ctx.fill(); }
    }
    // ---- the pads' corner: a little rug under the row of pads, and the loader's corner
    ctx.fillStyle = 'rgba(158,90,46,0.18)'; U.roundRect(ctx, K.PADS_X[0] - 60, K.PADS_Y - 40, K.PADS_X[K.PADS_X.length - 1] - K.PADS_X[0] + 120, 80, 16); ctx.fill();
  },
  // a painted floor spot: a dashed ring with an icon (where you stand to press the button)
  spot(r, x, y, ico, col, rx, ry) {
    const ctx = r.ctx;
    ctx.fillStyle = 'rgba(255,255,255,0.32)'; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.setLineDash([7, 5]); ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = r.font(Math.round(ry)); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ico, x, y + 1);
  },
  // the big doorway in the back wall, looking out north: sky, a hedge, Main Street, the farm track down to the doors
  paintDoorway(r, g) {
    const ctx = r.ctx, K = CFG.EGGFARM, D = K.DOOR, H = K.HALL, w = K.WALL, x0 = D.x0, x1 = D.x1, top = D.top, y1 = H.y0;
    ctx.save(); ctx.beginPath(); ctx.rect(x0, top, x1 - x0, y1 - top); ctx.clip();
    const sky = ctx.createLinearGradient(0, top, 0, top + 60); sky.addColorStop(0, '#6cc0f0'); sky.addColorStop(1, '#cdeeff');
    ctx.fillStyle = sky; ctx.fillRect(x0, top, x1 - x0, 60);
    ctx.fillStyle = '#fff'; for (const [cx, cy, cr] of [[x0 + 40, top + 18, 9], [x0 + 52, top + 14, 11], [x0 + 64, top + 19, 8], [x1 - 50, top + 26, 7], [x1 - 40, top + 23, 9]]) { ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#4f9a42'; for (let x = x0 - 10; x < x1 + 20; x += 22) { ctx.beginPath(); ctx.arc(x, top + 62, 16, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#79b85e'; ctx.fillRect(x0, top + 66, x1 - x0, y1 - top - 66);
    ctx.fillStyle = '#d9d4c7'; ctx.fillRect(x0, top + 66, x1 - x0, 4);
    ctx.fillStyle = '#4a4f57'; ctx.fillRect(x0, top + 70, x1 - x0, 24);                         // Main Street
    ctx.fillStyle = '#ffd23f'; for (let x = x0 + 6; x < x1; x += 30) ctx.fillRect(x, top + 81, 14, 2.5);
    ctx.fillStyle = '#d9d4c7'; ctx.fillRect(x0, top + 94, x1 - x0, 4);
    // the farm track widening down to the doors, with tyre ruts
    const ta = (x0 + x1) / 2 - 26, tb = (x0 + x1) / 2 + 26;
    ctx.fillStyle = '#c9a36b'; ctx.beginPath(); ctx.moveTo(ta, top + 98); ctx.lineTo(tb, top + 98); ctx.lineTo(x1, y1); ctx.lineTo(x0, y1); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(120,80,40,0.35)'; ctx.lineWidth = 3; for (const [a, b] of [[ta + 10, K.BAYS[0].x - 14], [ta + 20, K.BAYS[0].x + 14], [tb - 20, K.BAYS[1].x - 14], [tb - 10, K.BAYS[1].x + 14]]) { ctx.beginPath(); ctx.moveTo(a, top + 98); ctx.lineTo(b, y1); ctx.stroke(); }
    ctx.fillStyle = '#d7b98a'; for (const x of [x0 + 8, x1 - 12]) ctx.fillRect(x, top + 100, 4, 20);   // gate posts by the road
    ctx.restore();
    // the frame, the header with its sign, and the sliding door rolled back on its rail
    ctx.fillStyle = '#f5f0dc'; ctx.fillRect(x0 - 8, top - 4, 8, y1 - top + 4); ctx.fillRect(x1, top - 4, w, y1 - top + 4);
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(x0 - 100, top - 22, x1 + w - (x0 - 100), 8);
    ctx.fillStyle = '#9aa0a8'; for (let x = x0 - 96; x < x1 + w; x += 26) { ctx.beginPath(); ctx.arc(x, top - 18, 2.4, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#f5f0dc'; ctx.fillRect(x0 - 8, top - 14, x1 + w - (x0 - 8), 10);
    const lx0 = x0 - 92, lx1 = x0 - 10;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(lx0 + 4, top + 2, lx1 - lx0, y1 - top - 2);
    ctx.fillStyle = '#b23a3a'; ctx.fillRect(lx0, top - 2, lx1 - lx0, y1 - top);
    ctx.strokeStyle = '#f5f0dc'; ctx.lineWidth = 5; ctx.strokeRect(lx0 + 3, top + 1, lx1 - lx0 - 6, y1 - top - 6);
    ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(lx0 + 5, top + 3); ctx.lineTo(lx1 - 5, y1 - 7); ctx.moveTo(lx1 - 5, top + 3); ctx.lineTo(lx0 + 5, y1 - 7); ctx.stroke();
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, (x0 + x1) / 2 - 40, top - 40, 80, 22, 8); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🚚 ➜ 🥚', (x0 + x1) / 2, top - 29);
  },
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
    ctx.fillStyle = col; ctx.fillRect(x0, y1 - 6, C.w, 6); ctx.fillRect(x0, y0, 4, y1 - y0); ctx.fillRect(x1 - 4, y0, 4, y1 - y0);
    // the roof
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x0 - 8, y0 + 6); ctx.lineTo(cx, y0 - 30); ctx.lineTo(x1 + 8, y0 + 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(x0 - 8, y0 + 6); ctx.lineTo(cx, y0 - 30); ctx.lineTo(cx, y0 - 22); ctx.lineTo(x0 + 2, y0 + 6); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1.5; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x0 - 8 + k * 8, y0 + 6 - k * 4.2); ctx.lineTo(x1 + 8 - k * 8, y0 + 6 - k * 4.2); ctx.stroke(); }
    // the wire front's frame (the hens behind it are drawn every frame)
    const F = this.coopFront(i);
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, F.x - 3, F.y - 3, F.w + 6, F.h + 6, 4); ctx.fill();
    // the little door the chickens go in and out by (the ramp goes up to it), and a round window with a nest inside
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, cx - 37, y1 - 20, 18, 20, 6); ctx.fill(); ctx.fillStyle = '#2e1c10'; U.roundRect(ctx, cx - 34, y1 - 17, 12, 17, 5); ctx.fill();
    ctx.fillStyle = '#8d5a2b'; ctx.beginPath(); ctx.arc(cx + 22, y1 - 11, 6.5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#e0b44c'; ctx.beginPath(); ctx.arc(cx + 22, y1 - 11, 4.2, 0, Math.PI * 2); ctx.fill();
  },

  // ======================= the town: the barn's north doors, the farm track, the Egg Market =======================
  paintTown(r) {
    const ctx = r.ctx, K = CFG.EGGFARM, T = K.TOWN, B = CFG.FARM.barn, M = K.MARKET, dx0 = T.door.x - T.half, dx1 = T.door.x + T.half, road = CFG.ROAD.y2;
    // the farm track from the doors through the fence gap to Main Street, with tyre ruts
    ctx.fillStyle = '#c9a36b'; ctx.beginPath(); ctx.moveTo(dx0 - 6, B.y0); ctx.lineTo(dx1 + 6, B.y0); ctx.lineTo(dx1 + 12, road); ctx.lineTo(dx0 - 12, road); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(120,80,40,0.35)'; ctx.lineWidth = 3; for (const x of [T.door.x - 16, T.door.x + 16]) { ctx.beginPath(); ctx.moveTo(x, B.y0); ctx.lineTo(x, road); ctx.stroke(); }
    ctx.fillStyle = '#b48a55'; ctx.fillRect(dx0 - 12, road, dx1 - dx0 + 24, 3);
    // the doorway in the barn's north wall, its two doors swung open against the wall
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(dx0, B.y0, dx1 - dx0, 34);
    const inside = ctx.createLinearGradient(0, B.y0, 0, B.y0 + 34); inside.addColorStop(0, '#d2a66a'); inside.addColorStop(1, '#5b3a1a');
    ctx.fillStyle = inside; ctx.fillRect(dx0 + 4, B.y0, dx1 - dx0 - 8, 30);
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; for (let y = B.y0 + 6; y < B.y0 + 30; y += 7) ctx.fillRect(dx0 + 4, y, dx1 - dx0 - 8, 1.5);
    ctx.fillStyle = '#fff'; ctx.fillRect(dx0 - 4, B.y0, 4, 36); ctx.fillRect(dx1, B.y0, 4, 36); ctx.fillRect(dx0 - 4, B.y0 + 32, dx1 - dx0 + 8, 4);
    // the two doors swung wide open: from above, two red slabs standing out from the wall on each side of the doorway
    for (const x of [dx0 - 10, dx1 + 4]) {
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x + 3, B.y0 - 26, 6, 26);
      ctx.fillStyle = '#b23a3a'; ctx.fillRect(x, B.y0 - 28, 6, 28); ctx.fillStyle = '#fff'; ctx.fillRect(x, B.y0 - 28, 6, 2); ctx.fillRect(x + 2, B.y0 - 26, 2, 24);
    }
    // gate posts in the fence gap, and a little egg sign
    ctx.fillStyle = '#e0b44c'; ctx.fillRect(dx0 - 14, 112, 8, 16); ctx.fillRect(dx1 + 6, 112, 8, 16);
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(dx1 + 9, 96, 3, 18); ctx.fillStyle = '#fff8e8'; U.roundRect(ctx, dx1 + 1, 84, 20, 15, 4); ctx.fill();
    ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🥚', dx1 + 11, 92);
    // ---- the Egg Market stall on the corner of Main Street and East Road, next to the fire station: its counter faces the
    // road (the trucks pull up in front of it), a striped awning over it, and its sign on the back for people walking by
    const cx = (M.x0 + M.x1) / 2, mw = M.x1 - M.x0;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(M.x0 + 5, M.y0 + 6, mw, M.y1 - M.y0);
    ctx.fillStyle = '#c98b4a'; ctx.fillRect(M.x0, M.y0, mw, M.y1 - M.y0);
    ctx.fillStyle = 'rgba(0,0,0,0.1)'; for (let x = M.x0 + 10; x < M.x1; x += 10) ctx.fillRect(x, M.y0, 1.5, M.y1 - M.y0);
    // the counter along the front, eggs in a row on it (the boxes the trucks bring are drawn live)
    ctx.fillStyle = '#e0b46a'; ctx.fillRect(M.x0 - 4, M.y0 - 2, mw + 8, 16);
    ctx.fillStyle = '#b8862c'; ctx.fillRect(M.x0 - 4, M.y0 - 2, mw + 8, 3); ctx.fillRect(M.x0 - 4, M.y0 + 12, mw + 8, 3);
    // the striped awning over the stall (seen from above), its scalloped edge hanging over the back of the counter
    const aw0 = M.y0 + 14, n = 8, sw = (mw + 12) / n;
    for (let k = 0; k < n; k++) {
      const sx = M.x0 - 6 + k * sw; ctx.fillStyle = k % 2 ? '#fff8e8' : '#ffc61a';
      ctx.fillRect(sx, aw0, sw + 0.5, M.y1 - 2 - aw0);
      ctx.beginPath(); ctx.arc(sx + sw / 2, aw0, sw / 2, Math.PI, 0); ctx.fill();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(M.x0 - 6, M.y1 - 6, mw + 12, 4);
    ctx.fillStyle = '#8d5a2b'; for (const x of [M.x0 - 4, M.x1 + 1]) ctx.fillRect(x, aw0 - 2, 3, M.y1 - aw0);   // the posts
    // the sign on the awning, an egg at each end
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, cx - 38, M.y1 - 19, 76, 16, 7); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('EGG MARKET', cx, M.y1 - 10.5);
    this.paintEgg(ctx, 0, cx - 44, M.y1 - 11, 5, 7); this.paintEgg(ctx, 1, cx + 44, M.y1 - 11, 5, 7);
    // a little "EGGS ➜" arrow sign on the kerb for the trucks
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(M.x1 + 12, M.y0 - 14, 3, 22); ctx.fillStyle = '#fff8e8'; U.roundRect(ctx, M.x1 + 2, M.y0 - 24, 24, 14, 4); ctx.fill();
    ctx.font = r.font(9); ctx.fillText('🥚', M.x1 + 14, M.y0 - 17);
  },

  // ======================= moving things =======================
  dynamic(r, g) {
    if (!this.st) return;
    if (g.area === 'town') { this.drawMarket(r, g); return; }
    if (g.area !== 'barn') return;
    const ctx = r.ctx, K = CFG.EGGFARM, st = this.st, s = this.state(g), t = g.time, S = this.spr();
    const vx0 = r.camX - 60, vx1 = r.camX + r.viewW + 60, vy0 = r.camY - 80, vy1 = r.camY + r.viewH + 80;
    const vis = (x0, y0, x1, y1) => x1 > vx0 && x0 < vx1 && y1 > vy0 && y0 < vy1;
    if (vis(K.BOARD.x0, K.BOARD.y0, K.BOARD.x1, K.BOARD.y1)) this.drawBoard(r, g);
    // ---- the coops: the ramps, one face per chicken inside (sleepy faces and Zzz at night), the number on the roof (how
    // many chickens belong to the coop)
    const cap = this.cap(s), night = this.night();
    for (let i = 0; i < s.coops; i++) {
      const cx = K.COOP_X[i], C = K.COOP, x0 = cx - C.w / 2;
      if (!vis(x0 - 20, C.y0 - 70, x0 + C.w + 20, K.CHICK_Y)) continue;
      // the ramp up to the coop's little door
      const rx = cx - 28;
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(rx - 6, C.y1, 14, K.CHICK_Y - 2 - C.y1);
      ctx.fillStyle = '#c9a36b'; ctx.fillRect(rx - 7, C.y1 - 2, 14, K.CHICK_Y - C.y1);
      ctx.fillStyle = '#8d5a2b'; for (let y = C.y1 + 3; y < K.CHICK_Y - 2; y += 7) ctx.fillRect(rx - 7, y, 14, 2);
      const inside = this.inCoop(s, i), shown = this.shown(s, i), F = this.coopFront(i), cv = this.coopFace(i, inside, s.type, cap, night);
      const pop = st.coopPop[i] > 0 ? Math.sin(st.coopPop[i] * 18) * 1.5 : 0;
      ctx.drawImage(cv, F.x, F.y - pop, F.w, F.h);
      // the number on the roof, and the FULL sign
      const full = s.hens[i] >= cap, label = `${shown}/${cap}`; st.labels[i] = shown;
      ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const bw = ctx.measureText(label).width + 22;
      ctx.fillStyle = full ? '#e4572e' : 'rgba(43,29,20,0.85)'; U.roundRect(ctx, cx - bw / 2, C.y0 - 48, bw, 17, 8); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillText('🐔' + label, cx, C.y0 - 39);
      if (full) {
        const wob = Math.sin(t * 5 + i) * 0.06 + (st.fullFlash > 0 ? Math.sin(st.fullFlash * 20) * 0.12 : 0);
        ctx.save(); ctx.translate(cx, C.y0 - 11); ctx.rotate(wob);   // on the roof, never over a chicken
        ctx.fillStyle = '#fff'; U.roundRect(ctx, -22, -8, 44, 16, 5); ctx.fill();
        ctx.fillStyle = '#e4572e'; U.roundRect(ctx, -20, -6, 40, 12, 4); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = r.font(10, 900); ctx.fillText('FULL', 0, 1);
        ctx.restore();
      }
      // fast asleep: Zzz floating up out of the coop
      if (night && inside > 0) {
        ctx.font = r.font(13, 900); ctx.fillStyle = '#e8f0ff';
        for (let k = 0; k < 3; k++) { const q = (t * 0.5 + k / 3 + i * 0.17) % 1; ctx.font = r.font(10 + q * 6, 900); ctx.globalAlpha = Math.sin(q * Math.PI); ctx.fillText('z', cx + 30 + q * 10 + Math.sin(q * 6) * 2, C.y0 + 2 - q * 22); }
        ctx.globalAlpha = 1;
      }
    }
    // ---- the hatcher: chrome body, glass dome with wobbling eggs, the big red button and its refill ring
    const Hc = K.HATCHER;
    if (vis(Hc.x0, Hc.y0 - 80, Hc.x1, Hc.y1 + 10)) this.drawHatcher(r, g);
    // ---- the packer: eggs in its hopper, the arm in the window, the gears; the box pile; the trucks' fill bars
    const P = K.PACKER, Hp = P.hopper;
    if (vis(P.x0 - 60, K.BAYS[0].y - 60, K.HALL.x1, P.y1 + 30)) {
      const hn = Math.min(14, Math.ceil(s.hopper / 6));
      for (let k = 0; k < hn; k++) this.drawEgg(ctx, s.type, Hp.x - 15 + (k % 5) * 7 + (Math.floor(k / 5) % 2) * 3, Hp.y - 8 - Math.floor(k / 5) * 5, 0.66);
      if (s.hopper > 0) { const lab = '🥚' + s.hopper; ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const bw = ctx.measureText(lab).width + 12; ctx.fillStyle = 'rgba(43,29,20,0.85)'; U.roundRect(ctx, Hp.x - 34 - bw, Hp.y - 18, bw, 16, 8); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillText(lab, Hp.x - 34 - bw / 2, Hp.y - 10); }
      const ax = P.x0 + 88, ay = P.y0 + 32, sw = Math.sin(st.packAnim * Math.PI) * 0.8;
      ctx.save(); ctx.beginPath(); ctx.rect(P.x0 + 56, P.y0 + 26, 64, 42); ctx.clip();
      ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(ax, ay - 6); ctx.lineTo(ax + Math.sin(sw) * 18, ay + 12); ctx.stroke();
      if (s.hopper > 0) this.drawEgg(ctx, s.type, ax + Math.sin(sw) * 18, ay + 20, 0.66);
      ctx.drawImage(S.box, P.x0 + 74, P.y0 + 52, 28, 18);
      ctx.restore();
      ctx.fillStyle = '#ffd23f'; for (const [gx, gy, gr] of [[P.x0 + 30, P.y0 + 52, 7], [P.x0 + 44, P.y0 + 62, 5]]) { ctx.save(); ctx.translate(gx, gy); ctx.rotate(st.packAnim * 0.6 * (gr === 7 ? 1 : -1.4)); for (let k = 0; k < 6; k++) { ctx.rotate(Math.PI / 3); ctx.fillRect(-1.5, -gr - 2.5, 3, 4); } ctx.beginPath(); ctx.arc(0, 0, gr, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#2f6fb5'; ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffd23f'; ctx.restore(); }
      // the box pile on its pallet (boxes still flying onto it, or in the loader's arms, are not on it yet)
      const BP = K.BOXPILE, nb = this.pileShown(s);
      for (let k = 0; k < Math.min(24, nb); k++) { const q = this.pileTop(k); ctx.drawImage(S.box, q.x - 10, q.y - 6, 20, 13); }
      if (s.boxes > 0) { const lab = '📦' + s.boxes; ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const bw = ctx.measureText(lab).width + 12; ctx.fillStyle = 'rgba(43,29,20,0.85)'; U.roundRect(ctx, BP.x + 34, BP.y - 8, bw, 16, 8); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillText(lab, BP.x + 34 + bw / 2, BP.y); }
      // how full the docked truck is (and the spare in its bay)
      const tr = st.trucks.find((q) => q.state === 'dock' || q.state === 'toot');
      if (tr) this.fillBar(r, g, K.BAYS[0].x - 33, tr.drawBoxes, this.truckCap(s), tr.state === 'toot');
      if (this.spareHome() && (st.spare.boxes > 0 || s.boxes > 0)) this.fillBar(r, g, K.BAYS[1].x + 33, st.spare.drawBoxes, this.truckCap(s), false);
    }
    if (s.bank > 0) r.drawCashPile(K.CASH.x, K.CASH.y, Math.round(s.bank));
    for (const b of st.boxFly) if (b.to !== 'market') this.drawFlyingBox(ctx, b, S);
    // ---- corn: bits flying from the chef's hand and lying on the floor until they are pecked up
    if (st.corn.length) {
      ctx.fillStyle = '#ffd23f';
      for (const c of st.corn) {
        if (c.t < 0 || c.t > c.gone) continue;
        const k = Math.min(1, c.t / c.dur), x = U.lerp(c.x0, c.x1, k), y = U.lerp(c.y0, c.y1, k) - Math.sin(k * Math.PI) * c.h;
        ctx.beginPath(); ctx.ellipse(x, y, 3, 2.3, (c.x1 * 7) % 3, 0, Math.PI * 2); ctx.fill();
      }
    }
    // ---- the eggs lying on the floor (only the ones on screen)
    for (const e of st.floor) {
      if (e.x < vx0 || e.x > vx1 || e.y < vy0 || e.y > vy1) continue;
      ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.beginPath(); ctx.ellipse(e.x, e.y + 4, 6, 2.5, 0, 0, Math.PI * 2); ctx.fill();
      const sq = e.pop > 0 ? 0.6 + 0.4 * (1 - e.pop / 0.3) : 1;
      this.drawEgg(ctx, e.t, e.x, e.y - 4 - e.z, sq);
      if (Math.sin(t * 3 + e.x) > 0.75) { ctx.fillStyle = 'rgba(255,255,255,0.9)'; this.star(ctx, e.x + 8, e.y - 14, 3, 1.2); }
    }
  },
  drawFlyingBox(ctx, b, S) { const k = U.easeOut(Math.min(1, b.k)); ctx.drawImage(S.box, U.lerp(b.x0, b.x1, k) - 10, U.lerp(b.y0, b.y1, k) - 6 - Math.sin(Math.min(1, b.k) * Math.PI) * (b.h || 26), 20, 13); },
  // a truck's fill bar: a tall bar beside it that fills up box by box, with the number on top
  fillBar(r, g, x, n, cap, flash) {
    const ctx = r.ctx, K = CFG.EGGFARM, y0 = K.BAYS[0].y - 44, y1 = K.BAYS[0].y + 46, k = U.clamp(n / cap, 0, 1);
    ctx.fillStyle = 'rgba(43,29,20,0.8)'; U.roundRect(ctx, x - 6, y0, 12, y1 - y0, 6); ctx.fill();
    ctx.fillStyle = flash && Math.floor(g.time * 8) % 2 ? '#fff3a0' : k >= 1 ? '#ff9f1c' : '#9ef01a';
    if (k > 0) { U.roundRect(ctx, x - 4, y1 - 2 - (y1 - y0 - 4) * k, 8, (y1 - y0 - 4) * k, 4); ctx.fill(); }
    const lab = `📦${n}/${cap}`; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const bw = ctx.measureText(lab).width + 10; ctx.fillStyle = 'rgba(43,29,20,0.88)'; U.roundRect(ctx, x - bw / 2, y1 + 4, bw, 14, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillText(lab, x, y1 + 11);
  },
  // the Egg Market by the fire station: the boxes on its counter (and those flying onto it)
  drawMarket(r, g) {
    const ctx = r.ctx, K = CFG.EGGFARM, M = K.MARKET, st = this.st, S = this.spr();
    if (M.x1 < r.camX - 60 || M.x0 > r.camX + r.viewW + 60 || M.y1 < r.camY - 80 || M.y0 > r.camY + r.viewH + 80) return;
    for (let k = 0; k < st.mkt; k++) { const col = k % 4, row = Math.floor(k / 4); ctx.drawImage(S.box, M.x0 + 4 + col * 18 + row * 4, M.y0 - 4 - row * 7, 18, 12); }
    if (!st.mkt) for (let k = 0; k < 4; k++) this.drawEgg(ctx, k % 2, M.x0 + 13 + k * 18, M.y0 + 3, 0.5);   // a row of eggs on the counter
    for (const b of st.boxFly) if (b.to === 'market') this.drawFlyingBox(ctx, b, S);
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
  // the giant board on the back wall: each egg type with its hen and the hen count that unlocks it, and the hen count
  // now (the same number as all the coops' roof numbers added up)
  drawBoard(r, g) {
    const ctx = r.ctx, K = CFG.EGGFARM, Bd = K.BOARD, s = this.state(g), S = this.spr(), t = g.time, T = K.TYPES, n = this.shownHens(s);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; U.roundRect(ctx, Bd.x0 + 5, Bd.y0 + 6, Bd.x1 - Bd.x0, Bd.y1 - Bd.y0, 12); ctx.fill();
    ctx.fillStyle = '#6b4a2b'; U.roundRect(ctx, Bd.x0, Bd.y0, Bd.x1 - Bd.x0, Bd.y1 - Bd.y0, 12); ctx.fill();
    ctx.fillStyle = '#2f6b45'; U.roundRect(ctx, Bd.x0 + 8, Bd.y0 + 8, Bd.x1 - Bd.x0 - 16, Bd.y1 - Bd.y0 - 16, 8); ctx.fill();
    const pw = (Bd.x1 - Bd.x0 - 24) / T.length;
    for (let i = 0; i < T.length; i++) {
      const px = Bd.x0 + 12 + i * pw + pw / 2, py = Bd.y0 + 50, open = s.type >= i, cur = s.type === i;
      if (cur) { ctx.fillStyle = `rgba(255,236,150,${0.25 + 0.15 * Math.sin(t * 4)})`; U.roundRect(ctx, px - pw / 2 + 4, Bd.y0 + 12, pw - 8, Bd.y1 - Bd.y0 - 44, 10); ctx.fill(); }
      ctx.fillStyle = open ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.arc(px - 10, py, 24, 0, Math.PI * 2); ctx.fill();
      if (open) {
        ctx.drawImage(S.hen[i], px - 28, py - 28, 36, 44);
        const bob = cur ? Math.sin(t * 3) * 2 : 0; this.drawEgg(ctx, i, px + 20, py + 8 + bob, 1.2);
        ctx.fillStyle = '#ffd23f'; this.star(ctx, px + 24, py - 20, 6, 2.6);
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = r.font(24, 900); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', px - 10, py + 2);
        ctx.globalAlpha = 0.35; this.drawEgg(ctx, i, px + 20, py + 8, 1.2); ctx.globalAlpha = 1;
      }
      ctx.fillStyle = open ? '#ffd23f' : 'rgba(255,255,255,0.85)'; U.roundRect(ctx, px - 27, Bd.y1 - 44, 54, 18, 9); ctx.fill();
      ctx.fillStyle = '#2b1d14'; ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(open ? T[i].ico + ' ✓' : '🐔 ' + T[i].at, px, Bd.y1 - 35);
    }
    // the progress bar to the next egg type, with a chick walking along it, and the hen count
    const next = T[s.type + 1], x0 = Bd.x0 + 20, x1 = Bd.x1 - 78, by = Bd.y1 - 15;
    const k = next ? U.clamp((n - T[s.type].at) / (next.at - T[s.type].at), 0, 1) : 1;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; U.roundRect(ctx, x0, by - 5, x1 - x0, 10, 5); ctx.fill();
    ctx.fillStyle = '#9ef01a'; U.roundRect(ctx, x0, by - 5, Math.max(10, (x1 - x0) * k), 10, 5); ctx.fill();
    ctx.drawImage(S.chick, x0 + (x1 - x0) * k - 10, by - 15 + Math.abs(Math.sin(t * 6)) * -2, 20, 18);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; U.roundRect(ctx, x1 + 8, by - 9, 56, 18, 9); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🐔 ' + n, x1 + 36, by);
    this.st.boardN = n;
  },

  entities(r, g, items) {
    if (!this.st) return;
    const st = this.st, K = CFG.EGGFARM;
    if (st.spare.where === g.area) items.push({ y: st.spare.y + 14, draw: () => this.drawTruck(r, g, st.spare, g.driving && g.vehicle === st.spare) });
    if (g.area === 'barn') {
      for (const c of st.chicks) items.push({ y: c.y, draw: () => this.drawChick(r, g, c) });
      // the chickens out and about: only the ones on screen
      const vx0 = r.camX - 40, vx1 = r.camX + r.viewW + 40, vy0 = r.camY - 30, vy1 = r.camY + r.viewH + 40; let n = 0;
      for (const h of st.flock) { if (h.x < vx0 || h.x > vx1 || h.y < vy0 || h.y > vy1) continue; n++; items.push({ y: h.y, draw: () => this.drawHen(r, g, h) }); }
      st.henDrawn = n;
      for (const tr of st.trucks) if (tr.state === 'in' || tr.state === 'dock' || tr.state === 'toot' || tr.state === 'out') items.push({ y: tr.y + 14, draw: () => this.drawTruck(r, g, tr, false) });
      items.push({ y: K.HATCHER.y1 + 1, draw: () => this.drawRooster(r, g) });
      const L = st.loader; if (L) items.push({ y: L.y, draw: () => this.drawLoader(r, g, L) });
    } else if (g.area === 'town') {
      for (const tr of st.trucks) if (tr.state === 'road' || tr.state === 'unload' || tr.state === 'back') items.push({ y: tr.y + 14, draw: () => this.drawTruck(r, g, tr, false) });
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
  // a chicken from the side: little legs that step, a peck (the body tips forward), a flap of the wing, and a happy
  // heart now and then while it pecks at the corn
  drawHen(r, g, h) {
    const ctx = r.ctx, S = this.spr(), t = h.t, walking = h.s !== 'idle' && !(h.s === 'corn' && h.at);
    const w = walking ? Math.sin(t * 15 + h.ph) : 0, dip = !walking && h.peck ? Math.max(0, Math.sin(t * 9 + h.ph)) : 0;
    const up = h.s === 'up', grow = h.grown > 0 ? 1 + Math.sin((1.2 - h.grown) * 9) * 0.12 * h.grown : 1;
    const sc = (up ? Math.max(0.55, 1 - Math.max(0, CFG.EGGFARM.CHICK_Y + 8 - h.y) / 160) : 1) * grow;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(h.x, h.y + 2, 9 * sc, 3 * sc, 0, 0, Math.PI * 2); ctx.fill();
    // one sprite per chicken (legs baked in), placed with a single transform
    const frame = h.flap > 0 && Math.sin(h.flap * 24) > 0 ? 3 : w > 0.35 ? 1 : w < -0.35 ? 2 : 0;
    const m = r.dpr * r.scale, a = dip * 0.55, cs = Math.cos(a) * sc * m, sn = Math.sin(a) * sc * m, fx = h.face;   // scale(face) · rotate(peck)
    const ox = (h.x - r.camX) * m, oy = (h.y - 5 - Math.abs(w) * 1.2 - (h.flap > 0 ? Math.sin(h.flap * 12) * 2 : 0) - r.camY) * m;
    ctx.setTransform(cs * fx, sn, -sn * fx, cs, ox, oy);
    ctx.drawImage(S.walk[this.state(g).type][frame], -15, -19, 34, 34);
    ctx.setTransform(m, 0, 0, m, -r.camX * m, -r.camY * m);
    if (dip > 0.95) { ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(h.x + h.face * 15, h.y, 1.5, 0, Math.PI * 2); ctx.fill(); }
    if (h.s === 'corn' && h.at && Math.sin(t * 2.2 + h.ph * 3) > 0.93) { ctx.fillStyle = '#ff6b8a'; ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('♥', h.x + h.face * 4, h.y - 34); }
  },
  // the Loader: a farmhand in a yellow cap, carrying egg boxes on his head (the game's carry pose: hands at his sides)
  drawLoader(r, g, L) {
    const ctx = r.ctx, S = this.spr(), carrying = L.carry > 0 && (L.state === 'lift' || L.state === 'toTruck');
    r.drawPerson(L.x, L.y, { shirt: '#2f9e44', pants: '#3b5998', skin: '#c68642', hat: 'cap', capColor: '#ffd23f', facing: L.facing, moving: L.moving, bob: L.bob, carry: 0 });
    if (carrying) {
      const bob = L.moving ? Math.sin(L.bob) * 2 : 0, shown = L.state === 'lift' ? Math.max(1, Math.ceil(L.carry * (1 - L.t / 0.3))) : L.carry;
      for (let k = 0; k < shown; k++) ctx.drawImage(S.box, L.x - 13, L.y - 68 - k * 11 + bob, 26, 17);
    }
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
  // an egg truck (or the spare). In the hall, near the north doors, it shrinks into the distance through the doorway;
  // on the farm it is hidden behind the barn's wall until its nose comes out of the north doors.
  drawTruck(r, g, v, riding) {
    const ctx = r.ctx, K = CFG.EGGFARM, H = K.HALL, D = K.DOOR, T = K.TOWN;
    let x = v.x, y = v.y, sc = 1;
    ctx.save();
    if (g.area === 'barn' && v.y < H.y0 + 50 && v.x > D.x0 - 40) {
      const depth = H.y0 + 50 - v.y; sc = Math.max(0.3, 1 - depth / 220); y = H.y0 + 50 - depth * 0.55;
      ctx.beginPath(); ctx.rect(D.x0, D.top, D.x1 - D.x0, H.y1 - D.top); ctx.clip();
    } else if (g.area === 'town' && Math.abs(v.x - T.door.x) < 70 && v.y > T.door.y - 70) {
      ctx.beginPath(); ctx.rect(v.x - 120, v.y - 200, 240, T.door.y + 32 - (v.y - 200)); ctx.clip();   // inside the barn, past its doorway, it is hidden
    }
    ctx.translate(x, y); ctx.scale(sc, sc); ctx.rotate(v.angle);
    r.drawVehicle('eggtruck', g, g.s.paint.eggtruck || '#ffd23f', v);
    if (riding) {
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(28, 0, 8, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(30, 0, 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(27, 0, 4.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  },
  drawStack(r, g) {
    const ctx = r.ctx, st = this.st, K = CFG.EGGFARM, S = this.spr(), p = g.player, n = st.stack.length, base = this.stackBase(g), f = p.facing || 1;
    // a little straw nest resting on top of his hat (no arms: his hands stay at his sides, like carrying pizzas)
    if (n) {
      const nx = base.x + st.stack[0].x * 0.6;
      ctx.fillStyle = '#c9a36b'; ctx.beginPath(); ctx.ellipse(nx, base.y + 10, 14, 4.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e0b44c'; ctx.beginPath(); ctx.ellipse(nx, base.y + 8, 11, 3, 0, 0, Math.PI * 2); ctx.fill();
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
    const ctx = r.ctx, st = this.st, S = this.spr();
    // eggs in the air, from where they really are: onto the tower (homing in on its top) or off it into the hopper
    if (st.fly.length) {
      const base = this.stackBase(g), n = st.stack.length, top = this.eggPos(g, n, base);
      for (const f of st.fly) {
        if (f.k < 0 || f.area !== g.area) continue;
        const k = Math.min(1, f.k / f.dur), e = f.out ? k * k * (3 - 2 * k) : 1 - (1 - k) * (1 - k);
        const tx = f.out ? f.x1 : top.x, ty = f.out ? f.y1 : top.y, arc = 50 + Math.min(120, Math.abs(f.y0 - ty) * 0.15);
        const cx = f.out ? tx + (tx - f.x0) * 0.35 : (f.x0 + tx) / 2, cy = f.out ? Math.min(f.y0, ty) + Math.max(0, ty - f.y0) * 0.35 - 70 : Math.min(f.y0, ty) - arc;
        const x = (1 - e) * (1 - e) * f.x0 + 2 * (1 - e) * e * cx + e * e * tx, y = (1 - e) * (1 - e) * f.y0 + 2 * (1 - e) * e * cy + e * e * ty;
        if (x < r.camX - 30 || x > r.camX + r.viewW + 30 || y < r.camY - 30 || y > r.camY + r.viewH + 30) continue;
        ctx.save(); ctx.translate(x, y); ctx.rotate((f.out ? -1 : 1) * k * Math.PI * 2); ctx.drawImage(S.egg[f.t], -this.EW / 2, -this.EH / 2, this.EW, this.EH); ctx.restore();
      }
    }
    // the lucky egg on its balloon: it pops up from the floor, floats across the hall, and drifts up and away
    if (st.lucky && g.area === 'barn') {
      const L = st.lucky, t = g.time, rise = L.leave ? L.leave * 70 : 0, a = L.leave ? Math.max(0, 1 - L.leave / 1.6) : Math.min(1, L.t / 0.4);
      const sc = L.leave ? 1 : 0.4 + 0.6 * U.easeOut(Math.min(1, L.t / 0.4)), fy = L.y - 70 * sc + Math.sin(t * 2) * 6 - rise, sway = Math.sin(t * 1.6) * 4, bx = L.x + sway * 1.5;
      ctx.save(); ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(L.x, L.y + 4, 16 * Math.max(0.3, 1 - rise / 120), 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(L.x, fy - 14); ctx.quadraticCurveTo(L.x + sway, fy - 30, bx, fy - 46); ctx.stroke();
      ctx.fillStyle = '#ff5fa2'; ctx.beginPath(); ctx.ellipse(bx, fy - 64, 16, 19, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(bx - 6, fy - 71, 4, 6, -0.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff5fa2'; ctx.beginPath(); ctx.moveTo(bx - 3, fy - 45); ctx.lineTo(bx + 3, fy - 45); ctx.lineTo(bx, fy - 49); ctx.closePath(); ctx.fill();
      ctx.fillStyle = `rgba(158,240,26,${0.3 + 0.2 * Math.sin(t * 5)})`; ctx.beginPath(); ctx.arc(L.x, fy, 20, 0, Math.PI * 2); ctx.fill();
      this.drawEgg(ctx, 1, L.x, fy, 1.6);
      ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🍀', L.x + 1, fy + 2);
      ctx.restore();
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
  // peeking into a coop: its front opened up like a doll's house, every chicken inside on the perches (asleep at night)
  drawPeek(r, g, W, H) {
    const ctx = r.ctx, st = this.st, s = this.state(g), K = CFG.EGGFARM, S = this.spr(), t = g.time, c = st.peek.c;
    const k = Math.min(1, (6 - st.peek.t) / 0.25), pw = Math.min(W - 28, 500), ph = Math.min(H - 190, 330), px = W / 2 - pw / 2, py = Math.max(80, H / 2 - ph / 2 - 20);
    ctx.save(); ctx.globalAlpha = k;
    ctx.fillStyle = 'rgba(43,29,20,0.5)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = K.COOP_COLORS[c]; U.roundRect(ctx, px - 12, py - 12, pw + 24, ph + 24, 18); ctx.fill();
    ctx.fillStyle = '#7a5130'; U.roundRect(ctx, px, py, pw, ph, 10); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = px + 20; x < px + pw; x += 22) ctx.fillRect(x, py, 2, ph);
    const shown = this.shown(s, c), inside = this.inCoop(s, c), night = this.night(), cap = this.cap(s), gx = px + 14, gy = py + 46, gw = pw - 28, gh = ph - 58, G = this.grid(cap, gw, gh), face = S[night ? 'sleep' : 'face'][s.type], fw = Math.min(G.cell * 0.95, 64), fh = fw * 22 / 18;
    for (let row = 0; row < G.rows; row++) { const y = gy + G.oy + (G.rows - row) * G.cell; ctx.fillStyle = '#5b3a1a'; ctx.fillRect(gx, y - Math.max(2, G.cell * 0.1), gw, Math.max(2, G.cell * 0.1)); }
    for (let i = 0; i < Math.min(inside, cap); i++) {
      const row = Math.floor(i / G.cols), col = i % G.cols, cx = gx + G.ox + (col + 0.5) * G.cell, cy = gy + G.oy + (G.rows - row - 0.5) * G.cell, bob = night ? 0 : Math.sin(t * 3 + i * 1.9) * Math.min(2, G.cell * 0.05);
      ctx.drawImage(face, cx - fw / 2, cy - fh * 0.62 + bob, fw, fh);
    }
    st.peekDrawn = Math.min(inside, cap);
    ctx.fillStyle = 'rgba(43,29,20,0.85)'; U.roundRect(ctx, W / 2 - 80, py - 4, 160, 34, 14); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(18); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(`🐔 ${shown} / ${cap}`, W / 2, py + 13);
    if (Math.floor(t * 1.5) % 3 === 0 && inside) { ctx.font = r.font(14); ctx.fillStyle = '#fff'; ctx.fillText(night ? 'Zzz… 💤' : 'Bok bok! 💛', px + pw - 60, py + 30); }
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
      const nb = Math.min(12, (v && (v.drawBoxes !== undefined ? v.drawBoxes : v.boxes)) || 0);
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
