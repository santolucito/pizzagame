'use strict';
// The burger shop: a second restaurant the player buys and runs, on the grass WEST of the pizzeria, just south-west
// of where the playroom's town slide lands (CFG.PLAYROOM.TOWN.land).
//
// OUTSIDE. Before it is bought the windows are boarded up, the name board says COMING SOON and a walk-on pad by the
// door sells it ('🍔 Burger Shop', $600). You can still peek inside (cold grills, a CLOSED sign). Once bought: the
// boards come off, a GIANT burger bounces on the roof, the door says OPEN, and customers start coming in.
// INSIDE (its own map, CFG.AREAS.burger, in the free block 34000..34960 × 4000..4620) the loop is the pizzeria's, and so
// is the code: the grills, the customers, the cook and the cashier, the pads' prices and the catch-up all run on the
// shared restaurant system in js/shop.js (BurgerShop below tells it where things are); only the art is the shop's own:
//  * the grills on the back worktop build burgers by themselves, layer by layer (bottom bun, patty, cheese, lettuce,
//    tomato, top bun), and each finished burger hops onto the warming pile beside them (like the oven pile);
//  * the chef walks past the pile to pick burgers up (a stack in his hands, like the pizzas), and walks behind the
//    counter to put them on the display;
//  * customers come in through the door, queue in front of the display and take their burgers, then queue at the
//    register and pay (the chef or a hired cashier must be standing behind the register) into the cash pile behind
//    the counter; walk over it to collect. Some sit in a booth to eat and leave a tip on the table.
//  * walk-on pads: Faster Grill, a 2nd Grill, Carry More, hire a Burger Cook (carries burgers from the pile to the
//    counter) and hire a Cashier, with growing prices like the pizzeria's; and in a row under them, decorations like
//    the pizzeria's (CFG.BURGER.DECOR: table cacti, a poster and a clock, curtains and flags, a neon sign, a jukebox),
//    each shown as a faded ghost where it goes until bought; each one makes customers more patient and come more often.
//  * the shop runs every step wherever the chef is, and when the game was closed it catches up like the pizzeria (the
//    pile fills, and with both staff hired it keeps half of the money it was making per second).
// Fun bits: '😋 Eat a burger' from the stack you are carrying (three big CHOMPs, "Yum! 😋"), '🥤 Make a milkshake' at
// the pink machine (free), and '🪑 Sit down' in a free booth. Customers have the pizzeria's patience: the bar runs
// down, the face turns grumpy, and somebody who waits too long walks out ("Too slow!").
// Extension module: registered with Game.ext (unshift, so the door's button and hint beat the town's own) and
// Render.ext. See js/EXTENSIONS.md ("Interiors").
CFG.BURGER = {
  // ---- the town: the building's footprint (an obstacle), how tall its front wall is, the mat outside the door, the buy pad
  SHOP: { x0: -372, y0: 700, x1: -180, y1: 812 }, FACADE: 58,
  DOOR_OUT: { x: -276, y: 832 },
  BUY_PAD: { x: -186, y: 862 }, BUY_PRICE: 600,
  REACH: 30, HINT: 90, TOWN_HINT: 220,                    // the door's button, its hint, and how close the "buy it" hint shows
  // ---- the interior
  WORLD: { x0: 34000, y0: 4000, x1: 34960, y1: 4620 },
  ROOM: { x0: 34040, y0: 4120, x1: 34920, y1: 4560 }, WALL: 24, BACK_TOP: 4024,
  WORKTOP: { x0: 34040, x1: 34720, y1: 4162 },                  // the steel worktop along the back wall (solid)
  GRILLS: [{ x0: 34080, x1: 34200 }, { x0: 34220, x1: 34340 }],  // the second one is bought
  PILE: { x: 34400, y: 4150 }, PILE_STAND: { x: 34400, y: 4200 }, // the warming pile, and where to stand to grab from it
  MACHINE: { x: 34600 }, SHAKE_SPOT: { x: 34600, y: 4198 },     // the milkshake machine on the worktop
  COUNTER: { x0: 34460, x1: 34720, y0: 4262, y1: 4300 },        // the front counter (solid): top 4262..4288, front below
  DISPLAY: { x: 34530, y: 4278 }, DISPLAY_STAND: { x: 34530, y: 4228 }, DISPLAY_CAP: 10,
  REGISTER: { x: 34670, y: 4278 }, CASHIER_SPOT: { x: 34670, y: 4228 },
  CASH: { x: 34604, y: 4246 },                                  // the cash pile on the floor behind the counter
  QUEUE: { x: 34530, y: 4336, dy: 40, max: 4 }, PAY: { x: 34670, y: 4336, dy: 40, max: 4 },
  BOOTH: { x0: 34752, x1: 34920, tops: [4136, 4290] },          // two booths by the right wall (bench, table, bench)
  PLANTS: [{ x: 34896, y: 4532 }, { x: 34066, y: 4196 }],
  EXIT: { x: 34640, y: 4532 },                                  // the mat inside the door (the door is in the bottom wall)
  // the walk-on pads: the shop's upgrades and staff in one row, the decorations in a row under it (DECOR[i].pad)
  PADS: { grill: { x: 34084, y: 4350 }, grill2: { x: 34172, y: 4350 }, carry: { x: 34260, y: 4350 }, cook: { x: 34348, y: 4350 }, cashier: { x: 34436, y: 4350 } },
  // Decorations, like the pizzeria's (CFG.DECOR_ITEMS): a faded "ghost" shows where each one goes until its pad is
  // bought; each one makes customers more patient and come more often (Shop.patience / Shop.spawnInterval).
  // spots: where it appears (the sparkle on buying); none of them stands on a path, a line, a booth or a pad.
  DECOR: [
    { key: 'cactus',   label: 'Cactus',    ico: '🌵', price: 50,  pad: { x: 34084, y: 4480 }, spots: [{ x: 34778, y: 4182 }, { x: 34778, y: 4336 }, { x: 34474, y: 4274 }, { x: 34708, y: 4274 }] },   // a mini cactus on each booth table and both ends of the counter
    { key: 'posters',  label: 'Posters',   ico: '🖼️', price: 80,  pad: { x: 34172, y: 4480 }, spots: [{ x: 34094, y: 4070 }, { x: 34700, y: 4068 }] },   // a burger poster and a retro clock on the back wall
    { key: 'curtains', label: 'Curtains',  ico: '🎀', price: 120, pad: { x: 34260, y: 4480 }, spots: [{ x: 34836, y: 4060 }, { x: 34240, y: 4038 }] },   // checkered curtains on the window, flags along the back wall
    { key: 'neon',     label: 'Neon Sign', ico: '💡', price: 180, pad: { x: 34348, y: 4480 }, spots: [{ x: 34405, y: 4068 }] },                          // a glowing BURGERS sign over the warming pile
    { key: 'jukebox',  label: 'Jukebox',   ico: '🎵', price: 260, pad: { x: 34436, y: 4480 }, spots: [{ x: 34884, y: 4420 }] },                          // a jukebox and a round rug in the corner by the booths
  ],
  NEON: { x0: 34296, x1: 34514, y0: 4040, y1: 4098 },
  JUKEBOX: { x: 34884, y: 4452 }, RUG: { x: 34786, y: 4470, rx: 64, ry: 28 },
  // ---- balance
  // (the shared rules and timings, and how upgrades scale them, are SHOP in js/shop.js; these are the shop's own numbers)
  PRICE: 6, TIP_RATE: 0.35,                                     // a burger; a booth customer tips this share of the bill
  GRILL_T: 4.0, PILE_CAP: 8,                                    // seconds per burger per grill, pile size (before upgrades)
  SPAWN: 7, MAX_CUSTOMERS: 6, PAY_T: 0.8, EAT_T: 6, BOOTH_CHANCE: 0.4,
  PATIENCE: 60, PAY_PATIENCE: 70,                               // seconds in the display line / the register line
  UPG: { grill: { base: 60, growth: 1.5, max: 6 }, carry: { base: 50, growth: 1.5, max: 5 } },
  HIRE: { grill2: 250, cook: 300, cashier: 250 },
  LAYERS: ['bunB', 'patty', 'cheese', 'lettuce', 'tomato', 'bunT'],
  BITES: { burger: 3, shake: 3 },
  T: { shake: 1.6, give: 0.45, bite: 0.75, yum: 1.1 },          // seconds: the milkshake machine, the hand-over, a bite, the happy munch
  FADE: 0.45,
};
CFG.AREAS.burger = { WORLD: CFG.BURGER.WORLD, place: 'town', noSky: true };

const BURGER_DEFAULTS = {
  seen: false, eaten: 0, fries: 0, shakes: 0, sits: 0,                        // the fun counts (fries: from the old snack bar)
  owned: false, grills: 1, grillLv: 0, carryLv: 0, cook: false, cashier: false,
  piles: { grill: 0, counter: 0, cash: 0 }, tips: [0, 0], served: 0, earned: 0, lost: 0,
  rate: 0,                                                                     // money per second, measured (for the catch-up)
  decor: {},                                                                   // the decorations bought: { cactus: true, ... }
};

// The burger shop as a shop for the shared restaurant code (js/shop.js): where things are, its timings and its art.
const BurgerShop = {
  key: 'burger', area: 'burger',
  keys: { made: 'grill', display: 'counter', cash: 'cash' },
  get pile() { return CFG.BURGER.PILE; },
  get display() { return CFG.BURGER.DISPLAY; },
  get cashPile() { return CFG.BURGER.CASH; },
  get cashierSpot() { return CFG.BURGER.CASHIER_SPOT; },
  get cashierStand() { return CFG.BURGER.CASHIER_SPOT; },
  cashierFacing: 1, handY: 60, tableFacing: -1,
  get eatTime() { return CFG.BURGER.EAT_T; },
  get tipRate() { return CFG.BURGER.TIP_RATE; },
  get payPatience() { return CFG.BURGER.PAY_PATIENCE; },
  get sitChance() { return CFG.BURGER.BOOTH_CHANCE; },
  patience() { return Shop.patience(CFG.BURGER.PATIENCE, BurgerExt.busy(Game)); },
  customers: () => BurgerExt.st.customers, staff: () => BurgerExt.st.staff, piles: (g) => BurgerExt.state(g).piles,
  tables: () => BurgerExt.st.tables,
  price: () => CFG.BURGER.PRICE, payTime: () => Shop.payTime(CFG.BURGER.PAY_T, 0), cashierPresent: (g) => BurgerExt.cashierPresent(g),
  lineIndex: (g, c) => BurgerExt.queueIndex(c), payIndex: (g, c) => BurgerExt.payIndex(c),
  queueSpot(g, i) { const Q = CFG.BURGER.QUEUE; return { x: Q.x, y: Q.y + Math.min(i, Q.max + 1) * Q.dy }; },
  paySpot(g, i) { const P = CFG.BURGER.PAY; return { x: P.x, y: P.y + Math.min(i, P.max + 1) * P.dy }; },
  // in through the door in the bottom wall, and back out of it
  enter(c) { const K = CFG.BURGER; c.x = K.EXIT.x + U.rand(-8, 8); c.y = K.ROOM.y1 + 14; c.route = [{ x: K.EXIT.x - 40, y: K.EXIT.y - 30 }]; },
  exitRoute() { const K = CFG.BURGER; return [{ x: K.EXIT.x + 30, y: K.EXIT.y - 30 }, { x: K.EXIT.x + 10, y: K.ROOM.y1 + 16 }]; },
  paid(g, c, amt) {
    const K = CFG.BURGER, s = BurgerExt.state(g), st = BurgerExt.st;
    s.piles.cash += amt; s.served += c.want; s.earned += amt; st.secEarned += amt;
    if (g.area === 'burger') { g.floats.push({ x: K.REGISTER.x, y: K.REGISTER.y - 30, text: '+' + U.money(amt), color: '#2f9e44', t: 0, dur: 1 }); Sfx.cash(); }
    BurgerExt.fly(K.REGISTER.x, K.REGISTER.y - 8, K.CASH.x, K.CASH.y - 6, 0.3);
  },
  lost(g) { BurgerExt.state(g).lost++; },
  // a free booth (not the one the chef sits in)
  freeTable() { const st = BurgerExt.st, free = st.tables.filter((t) => !t.occupied && st.seat !== t.i); return free.length ? U.pick(free) : null; },
  tableRoute(t) { return [{ x: CFG.BURGER.BOOTH.x0 - 16, y: t.spot.y - 6 }, { x: t.spot.x, y: t.spot.y }, { x: t.x + 26, y: t.y }]; },
  tableExit(t) { return [{ x: t.spot.x, y: t.spot.y }, { x: CFG.BURGER.BOOTH.x0 - 16, y: t.spot.y - 6 }]; },
  tipped(g, c, t, tip) { const s = BurgerExt.state(g); s.tips[t.i] = (s.tips[t.i] || 0) + tip; },
  fly(g, x0, y0, x1, y1, dur) { BurgerExt.fly(x0, y0, x1, y1, dur); },
  dropTargets() { const K = CFG.BURGER; return [{ key: 'counter', pos: K.DISPLAY, stand: K.DISPLAY_STAND, cap: K.DISPLAY_CAP, main: true }]; },
  stackNeed: (g, key) => Shop.lineWant(BurgerExt.st.customers) - BurgerExt.state(g).piles[key],
  staffStart(role) { const K = CFG.BURGER; return role === 'cashier' ? K.CASHIER_SPOT : K.PILE_STAND; },
  staffSpeed: () => Shop.staffSpeed(0), carrierCap: () => Shop.staffCap(0),
  pileStand() { const P = CFG.BURGER.PILE_STAND; return { x: P.x + 8, y: P.y }; },
  dropStand(t) { return t.stand; },
};

const BurgerExt = {
  name: 'burger',
  defaults: { burger: JSON.parse(JSON.stringify(BURGER_DEFAULTS)) },
  st: null,

  // ---------- state ----------
  // the saved state, with anything an older save lacks filled in (an old snack-bar save keeps its eaten counts)
  state(g) {
    const s = g.s.burger || (g.s.burger = {});
    for (const k of Object.keys(BURGER_DEFAULTS)) if (s[k] === undefined) s[k] = JSON.parse(JSON.stringify(BURGER_DEFAULTS[k]));
    for (const k of Object.keys(BURGER_DEFAULTS.piles)) if (typeof s.piles[k] !== 'number') s.piles[k] = 0;
    if (!s.decor || typeof s.decor !== 'object') s.decor = {};
    return s;
  },
  build(g) {
    const s = this.state(g), K = CFG.BURGER;
    this.st = {
      fade: 0, seat: null,                    // seat: index into seats()
      carry: 0, xferCd: 0,                    // burgers in the chef's hands
      order: null,                            // something the chef is eating: { kind: 'burger' | 'shake', phase: 'make' | 'give' | 'eat' | 'yum', t, bites }
      grills: K.GRILLS.map((_, i) => ({ t: i * 1.3 })),   // each grill's timer (Shop.produce)
      customers: [], spawnT: 2, groupLeft: 0, groupT: 0, seq: 0,   // ShopCustomer, and the door (Shop.spawns)
      staff: [],                              // ShopStaff: role 'cook' (a carrier) or 'cashier'
      tables: this.seats().map((q) => Object.assign({ occupied: null }, q)),   // the booths, with who eats there
      secT: 0, secEarned: 0,                  // money per second (Shop.meter)
      flies: [],                              // burgers flying between piles, hands and grills { x0, y0, x1, y1, t, dur }
      say: null, steam: [], sparks: [], drawn: 0, awayMsg: null,
    };
    this.st.obs = this.makeObstacles(g);
    if (s.cook) this.addStaff('cook');
    if (s.cashier) this.addStaff('cashier');
    // catch up on the time the game was closed
    this.away(g, Shop.awaySeconds(g));
  },
  ready(g) { if (!this.st) this.build(g); this.state(g); return this.st; },
  addStaff(role) { this.st.staff.push(new ShopStaff(BurgerShop, role, 0)); },
  // the time the game was closed (the shared rule): the grills fill the pile; with a cook and a cashier the shop keeps
  // half of the money it was making per second
  away(g, sec) {
    const s = this.state(g), K = CFG.BURGER;
    if (!s.owned || sec < SHOP.AWAY_MIN) return 0;
    s.piles.grill = Math.max(s.piles.grill, this.pileCap(g));
    const amt = Math.round(Shop.awayEarnings(sec, s.cook && s.cashier, s.rate));
    const sold = Math.round(amt / K.PRICE);
    if (sold < 1) return 0;
    s.piles.cash += amt; s.served += sold; s.earned += amt;
    this.st.awayMsg = `🍔 Your burger shop sold ${sold} burgers while you were away!`;
    return amt;
  },
  makeObstacles(g) {
    const K = CFG.BURGER, R = K.ROOM, w = K.WALL, W = K.WORKTOP, C = K.COUNTER, o = [];
    o.push({ x: K.WORLD.x0, y: K.WORLD.y0, w: K.WORLD.x1 - K.WORLD.x0, h: R.y0 - K.WORLD.y0 });             // the back wall
    o.push({ x: R.x0 - w, y: R.y1, w: R.x1 - R.x0 + 2 * w, h: w });
    o.push({ x: R.x0 - w, y: R.y0, w, h: R.y1 - R.y0 }, { x: R.x1, y: R.y0, w, h: R.y1 - R.y0 });
    o.push({ x: W.x0, y: R.y0, w: W.x1 - W.x0, h: W.y1 - R.y0 });                                           // the worktop
    o.push({ x: C.x0, y: C.y0, w: C.x1 - C.x0, h: C.y1 - C.y0 });                                           // the counter
    for (const top of K.BOOTH.tops) o.push({ x: K.BOOTH.x0, y: top, w: K.BOOTH.x1 - K.BOOTH.x0, h: 78 });
    for (const P of K.PLANTS) o.push({ x: P.x - 12, y: P.y - 12, w: 24, h: 20 });
    if (this.hasDecor(g, 'jukebox')) { const J = K.JUKEBOX; o.push({ x: J.x - 20, y: J.y - 16, w: 40, h: 18 }); }   // only once it is bought
    return o;
  },
  obstacles(g) {
    if (g.area === 'town') { const S = CFG.BURGER.SHOP; return [{ x: S.x0, y: S.y0, w: S.x1 - S.x0, h: S.y1 - S.y0 }]; }
    return g.area === 'burger' ? this.ready(g).obs : [];
  },
  free(x, y) {
    const R = CFG.BURGER.ROOM, r = 12;
    if (x < R.x0 + r || x > R.x1 - r || y < R.y0 + r || y > R.y1 - r) return false;
    for (const o of this.st.obs) if (x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h) return false;
    return true;
  },
  // the booths: where you sit, which way you face, where you stand to sit down (and stand up to)
  seats() {
    if (this._seats) return this._seats;
    const K = CFG.BURGER, bx = (K.BOOTH.x0 + K.BOOTH.x1) / 2;
    this._seats = K.BOOTH.tops.map((top, i) => ({ i, x: bx - 4, y: top + 40, facing: 1, spot: { x: bx - 4, y: top + 98 }, tip: { x: bx + 30, y: top + 40 } }));
    return this._seats;
  },
  boothTaken(i) { return !!this.st.tables[i].occupied; },

  // ---------- derived values ----------
  // (the same formulas as the pizzeria's: js/shop.js)
  grillTime(g) { return Shop.stationTime(CFG.BURGER.GRILL_T, this.state(g).grillLv); },
  pileCap(g) { return Shop.stationCap(CFG.BURGER.PILE_CAP, this.state(g).grillLv); },
  carryCap(g) { return Shop.chefCap(this.state(g).carryLv); },
  upgCost(g, key) { const u = CFG.BURGER.UPG[key], lv = this.state(g)[key + 'Lv']; return lv >= u.max ? null : Shop.cost(u.base, lv, u.growth); },
  spawnTime(g) { return Shop.spawnInterval(CFG.BURGER.SPAWN, this.busy(g)); },
  // decorations, as in the pizzeria (Game.decorCount): the bought ones count
  decorCount(g) { const d = this.state(g).decor; return CFG.BURGER.DECOR.filter((it) => d[it.key]).length; },
  hasDecor(g, key) { return !!this.state(g).decor[key]; },
  // the shop's "busyness" level for the shared rules (patience, arrivals, groups, how much they want): every
  // decoration counts, like the pizzeria's, and so does each Faster Grill level, as before the decorations
  busy(g) { return this.decorCount(g); },   // like the pizzeria: decorations make customers patient and come more often

  // ---------- small helpers ----------
  onFoot(g) { return !g.driving && !g.onTrain && !g.ride && !g.travel && !g.fishing; },
  cityBusy() { return typeof CityExt !== 'undefined' && !!(CityExt.floor || (CityExt.st && (CityExt.st.cab || CityExt.st.boarding))); },
  atDoor(g) { const D = CFG.BURGER.DOOR_OUT, p = g.player; return g.area === 'town' && this.onFoot(g) && !this.cityBusy() && U.dist(p.x, p.y, D.x, D.y) < CFG.BURGER.REACH; },
  near(g, pt, d) { return U.dist(g.player.x, g.player.y, pt.x, pt.y) < d; },
  nearSeat(g) {
    const s = this.seats();
    for (let i = 0; i < s.length; i++) if (!this.boothTaken(i) && this.near(g, s[i].spot, 28)) return i;
    return -1;
  },
  cashierPresent(g) { return Shop.cashierPresent(g, BurgerShop); },
  // the chef is drawn on foot right now (not in a vehicle, on the train or on a ride)
  visible(g) { return !g.driving && !g.onTrain && !g.travel; },
  queueIndex(c) { return Shop.lineIndex(this.st.customers, c, (o) => o.inMainQueue); },
  payIndex(c) { return Shop.lineIndex(this.st.customers, c, (o) => o.inPayQueue); },
  fly(x0, y0, x1, y1, dur) { this.st.flies.push({ x0, y0, x1, y1, t: 0, dur: dur || 0.2 }); },

  // ---------- game hooks ----------
  action(g) {
    const st = this.ready(g), s = this.state(g), K = CFG.BURGER;
    if (this.atDoor(g)) return { label: '🚪 Go inside', run: (gg) => this.enter(gg) };
    if (g.area !== 'burger' || !this.onFoot(g)) return null;
    if (st.seat !== null) return { label: '🚶 Stand up', run: (gg) => this.standUp(gg) };
    if (this.near(g, K.EXIT, 30)) return { label: '🚪 Go outside', run: (gg) => this.leave(gg) };
    if (s.owned && !st.order && this.near(g, K.SHAKE_SPOT, K.REACH)) return { label: '🥤 Make a milkshake', run: (gg) => this.makeShake(gg) };
    const b = this.nearSeat(g);
    if (b >= 0) return { label: '🪑 Sit down', run: (gg) => this.sitDown(gg, b) };
    if (st.carry > 0 && !st.order) return { label: '😋 Eat a burger', run: (gg) => this.eatOne(gg) };
    return null;
  },
  enter(g) {
    const K = CFG.BURGER, p = g.player, st = this.ready(g), s = this.state(g);
    g.area = 'burger'; p.x = K.EXIT.x; p.y = K.EXIT.y - 8; p.moving = false; p.facing = -1; p.hasMoved = true; g.cameraSnap = true;
    st.fade = K.FADE; st.seat = null; Sfx.ding(); Haptics.tap();
    if (s.owned && !s.seen) { s.seen = true; g.toast('🍔 Your very own burger shop!', true); }
  },
  leave(g) {
    const K = CFG.BURGER, p = g.player, st = this.ready(g);
    g.area = 'town'; p.x = K.DOOR_OUT.x; p.y = K.DOOR_OUT.y + 4; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    st.seat = null; st.fade = K.FADE; Sfx.drop();
  },
  // a burger from the stack in your hands: straight into the eating part
  eatOne(g) {
    const st = this.ready(g); if (st.order || st.carry <= 0) return;
    st.carry--; st.order = { kind: 'burger', phase: 'give', t: CFG.BURGER.T.give * 0.6, bites: 0, fromHand: true };
    Haptics.tap();
  },
  makeShake(g) {
    const st = this.ready(g); if (st.order) return;
    st.order = { kind: 'shake', phase: 'make', t: 0, bites: 0 };
    g.player.facing = 1; Haptics.tap();
  },
  sitDown(g, i) {
    const st = this.ready(g), p = g.player, s = this.seats()[i];
    st.seat = i; p.x = s.x; p.y = s.y; p.moving = false; p.facing = s.facing;
    this.state(g).sits++;
    Sfx.pickup(); Haptics.tap();
  },
  standUp(g) {
    const st = this.ready(g), p = g.player; if (st.seat === null) return;
    const s = this.seats()[st.seat]; p.x = s.spot.x; p.y = s.spot.y; p.moving = false;
    st.seat = null; Sfx.drop();
  },
  // Take-me-home: the food in hand and the burgers you carry are gone, the chef is no longer sitting; the shop keeps going
  home(g) { const st = this.ready(g); st.order = null; st.seat = null; st.fade = 0; st.carry = 0; st.sparks = []; },
  // a save or a push that left the chef in a wall or inside the furniture goes back onto the door mat
  rescue(g) {
    const p = g.player, K = CFG.BURGER;
    if (this.free(p.x, p.y)) return false;
    p.x = K.EXIT.x; p.y = K.EXIT.y - 8; p.moving = false;
    g.floats.push({ x: p.x, y: p.y - 50, text: 'Oops! Back inside', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    return true;
  },

  // ---------- the pads ----------
  pads(g) {
    const s = this.state(g), K = CFG.BURGER, P = K.PADS, out = [];
    if (!s.owned) { out.push({ key: 'burgerShop', label: 'Burger Shop', ico: '🍔', pos: K.BUY_PAD, price: K.BUY_PRICE, sub: 'your own shop!' }); return out; }
    const gc = this.upgCost(g, 'grill'), cc = this.upgCost(g, 'carry');
    out.push({ key: 'burgerGrill', label: 'Faster Grill', ico: '🔥', pos: P.grill, price: gc || 0, maxed: gc === null, sub: `${s.grillLv}/${K.UPG.grill.max}` });
    if (s.grills < 2) out.push({ key: 'burgerGrill2', label: '2nd Grill', ico: '♨️', pos: P.grill2, price: K.HIRE.grill2, sub: 'more burgers' });
    out.push({ key: 'burgerCarry', label: 'Carry More', ico: '📦', pos: P.carry, price: cc || 0, maxed: cc === null, sub: `${s.carryLv}/${K.UPG.carry.max}` });
    if (!s.cook) out.push({ key: 'burgerCook', label: 'Hire Cook', ico: '🧑‍🍳', pos: P.cook, price: K.HIRE.cook, sub: 'carries burgers' });
    if (!s.cashier) out.push({ key: 'burgerCashier', label: 'Hire Cashier', ico: '🧑‍💼', pos: P.cashier, price: K.HIRE.cashier, sub: 'takes money' });
    for (const it of K.DECOR) if (!s.decor[it.key]) out.push({ key: 'burgerDecor_' + it.key, item: it.key, label: it.label, ico: it.ico, pos: it.pad, price: it.price });
    return out;
  },
  onPad(g, pad) {
    const s = this.state(g), st = this.ready(g);
    if (pad.key === 'burgerShop') {
      s.owned = true; st.spawnT = 3; Sfx.unlock(); Haptics.success();
      g.toast('🍔 You own the burger shop! Go inside!', true);
      return;
    }
    if (pad.item) {
      // a decoration: it appears where its ghost was, with a sparkle there (the core already rang the till)
      const it = CFG.BURGER.DECOR.find((d) => d.key === pad.item); if (!it) return;
      s.decor[it.key] = true; st.obs = this.makeObstacles(g);
      for (const q of it.spots) st.sparks.push({ x: q.x, y: q.y, area: 'burger', t: 0, dur: 0.8, color: '255,214,10' });
      g.toast(`${it.ico} ${it.label} bought!`);
      return;
    }
    if (pad.key === 'burgerGrill') { s.grillLv++; g.toast(`🔥 Faster grill! ${s.grillLv}/${CFG.BURGER.UPG.grill.max}`); }
    else if (pad.key === 'burgerGrill2') { s.grills = 2; g.toast('♨️ A second grill!'); }
    else if (pad.key === 'burgerCarry') { s.carryLv++; g.toast(`📦 Carry more burgers! ${this.carryCap(g)}`); }
    else if (pad.key === 'burgerCook') { s.cook = true; this.addStaff('cook'); g.toast('🧑‍🍳 The cook carries burgers to the counter!', true); }
    else if (pad.key === 'burgerCashier') { s.cashier = true; this.addStaff('cashier'); g.toast('🧑‍💼 The cashier takes the money!', true); }
  },
  bgKey(g) {
    const b = g && g.s && g.s.burger, d = (b && b.decor) || {};
    return 'burger3-' + (b && b.owned ? 1 : 0) + '-' + (b ? b.grills : 1) + '-' + CFG.BURGER.DECOR.map((it) => d[it.key] ? 1 : 0).join('');
  },

  // ---------- the simulation ----------
  update(g, dt) {
    const st = this.ready(g), K = CFG.BURGER, p = g.player, s = this.state(g);
    st.fade = Math.max(0, st.fade - dt);
    if (st.awayMsg && g.onToast) { g.toast(st.awayMsg, true); st.awayMsg = null; }
    if (st.say) { st.say.t -= dt; if (st.say.t <= 0) st.say = null; }
    for (const q of st.sparks) q.t += dt;
    st.sparks = st.sparks.filter((q) => q.t < q.dur);
    for (const f of st.flies) f.t += dt;
    st.flies = st.flies.filter((f) => f.t < f.dur);
    this.stepOrder(g, dt);
    // the park dog never wanders onto the shop's roof
    if (g.area === 'town' && g.dog && g.dog.target) {
      const S = K.SHOP, d = g.dog.target;
      if (d.x > S.x0 - 20 && d.x < S.x1 + 20 && d.y > S.y0 - 20 && d.y < S.y1 + 30) d.x = S.x1 + 30;
    }
    // the business runs wherever the chef is
    if (s.owned) {
      this.stepGrills(g, dt);
      Shop.spawns(st, dt, this.spawnTime(g), Shop.groupChance(this.busy(g)), () => this.spawnCustomer(g));
      for (const c of st.customers) c.update(dt, g);
      st.customers = st.customers.filter((c) => c.state !== 'gone');
      for (const w of st.staff) w.update(dt, g);
      s.rate = Shop.meter(st, dt, s.rate);
    }
    if (g.area !== 'burger') { st.seat = null; return; }
    // seated: stay put
    if (st.seat !== null && this.onFoot(g)) { const q = this.seats()[st.seat]; p.x = q.x; p.y = q.y; p.moving = false; p.facing = q.facing; }
    else if (st.seat === null && this.onFoot(g)) this.rescue(g);
    if (s.owned && this.onFoot(g)) this.stepChef(g, dt);
    if (s.owned && Math.random() < dt * 4) { const G = K.GRILLS[Math.floor(Math.random() * s.grills)]; st.steam.push({ x: U.rand(G.x0 + 14, G.x1 - 14), y: K.WORKTOP.y1 - 26, t: 0 }); }
    for (const q of st.steam) { q.t += dt; q.y -= 16 * dt; q.x += Math.sin(q.t * 4 + q.y) * 6 * dt; }
    st.steam = st.steam.filter((q) => q.t < 1.3);
  },
  stepGrills(g, dt) {
    const st = this.st, s = this.state(g), K = CFG.BURGER;
    Shop.produce(st.grills, s.grills, this.grillTime(g), s.piles, 'grill', this.pileCap(g), dt, (i) => {
      const G = K.GRILLS[i];
      this.fly((G.x0 + G.x1) / 2, K.WORKTOP.y1 - 22, K.PILE.x, K.PILE.y - 6, 0.35);
      if (g.area === 'burger') Sfx.tone(660 + i * 80, 0.06, 'triangle', 0.03);
    });
  },
  // one more customer at the door, if there is room (Shop.spawns decides when)
  spawnCustomer(g) {
    const st = this.st, K = CFG.BURGER;
    if (st.customers.length >= K.MAX_CUSTOMERS || st.customers.filter((c) => c.inMainQueue || c.entering).length >= K.QUEUE.max) return;
    st.customers.push(new ShopCustomer(BurgerShop, st.seq++, Shop.want(this.busy(g))));
  },
  // the chef: grab burgers at the pile, put them on the display, collect the cash pile and the booth tips
  stepChef(g, dt) {
    const st = this.st, s = this.state(g);
    st.xferCd -= dt;
    Shop.chef(g, BurgerShop, st, this.carryCap(g));
    this.seats().forEach((q, i) => { if (s.tips[i] > 0 && this.near(g, q.spot, 58)) { const amt = s.tips[i]; s.tips[i] = 0; Shop.pocket(g, amt, q.tip, 'Tip +'); } });
  },
  stepOrder(g, dt) {
    const st = this.st, o = st.order, K = CFG.BURGER, T = K.T, p = g.player;
    if (!o) return;
    o.t += dt;
    if (o.phase === 'make') {
      if (o.t >= T.shake) { o.phase = 'give'; o.t = 0; Sfx.ding(); }
    } else if (o.phase === 'give' && o.t >= T.give) { o.phase = 'eat'; o.t = 0; o.bites = 0; }
    else if (o.phase === 'eat') {
      while (o.bites < K.BITES[o.kind] && o.t >= (o.bites + 0.6) * T.bite) this.bite(g);
      if (o.bites >= K.BITES[o.kind] && o.t >= K.BITES[o.kind] * T.bite) {
        o.phase = 'yum'; o.t = 0;
        const s = this.state(g);
        if (o.kind === 'burger') s.eaten++; else s.shakes++;
        g.floats.push({ x: p.x, y: p.y - 74, text: o.kind === 'shake' ? 'Ahh! 😋' : 'Yum! 😋', color: '#ffe08a', t: 0, dur: 1.5, big: true });
        Sfx.chime(); Haptics.success();
      }
    } else if (o.phase === 'yum' && o.t >= T.yum) st.order = null;
  },
  bite(g) {
    const st = this.st, o = st.order, p = g.player, m = this.mouth(g);
    o.bites++;
    g.floats.push({ x: p.x + U.rand(-8, 8), y: p.y - 84, text: o.kind === 'burger' ? 'CHOMP!' : 'slurp!', color: o.kind === 'burger' ? '#ffd60a' : '#fff', t: 0, dur: 0.9, big: o.kind === 'burger' });
    st.sparks.push({ x: m.x, y: m.y, area: g.area, t: 0, dur: 0.5, color: o.kind === 'shake' ? '255,143,171' : '255,214,10' });
    Sfx.pickup(); Haptics.tap();
  },

  // ---------- hints: buy it, grab burgers, put them on the counter, take the money ----------
  hint(g) {
    const st = this.ready(g), p = g.player, K = CFG.BURGER, s = this.state(g);
    if (g.area === 'town') {
      if (!this.onFoot(g) || this.cityBusy()) return undefined;
      const d = U.dist(p.x, p.y, K.DOOR_OUT.x, K.DOOR_OUT.y);
      if (!s.owned) {
        if (U.dist(p.x, p.y, K.BUY_PAD.x, K.BUY_PAD.y) < 40) return { text: g.s.cash > 0 ? 'Buying the burger shop! 🍔' : 'Earn money to buy the burger shop! 💵', target: null };
        if (d < K.TOWN_HINT && g.s.cash + (g.s.padPaid.burgerShop || 0) >= K.BUY_PRICE) return { text: 'Buy the burger shop! 🍔', target: K.BUY_PAD };
        if (d < K.HINT) return { text: 'Peek inside! 🍔', target: d < K.REACH ? null : K.DOOR_OUT };
        return undefined;
      }
      if (d < K.HINT) return { text: 'Your burger shop! Go inside 🍔', target: d < K.REACH ? null : K.DOOR_OUT };
      return undefined;
    }
    if (g.area !== 'burger') return undefined;
    if (!this.onFoot(g)) return null;
    if (!s.owned) return { text: 'Closed! Buy it outside to open it 🍔', target: this.near(g, K.EXIT, 30) ? null : K.EXIT };
    const o = st.order;
    if (o && o.phase === 'make') return { text: 'Whirr! Milkshake time 🥤', target: null };
    if (o && (o.phase === 'give' || o.phase === 'eat')) return { text: o.kind === 'burger' ? 'CHOMP! CHOMP! 🍔' : 'Slurp! 🥤', target: null };
    if (st.seat !== null) return { text: 'Comfy! Press the button to stand up 🪑', target: null };
    const at = (pt, r) => (this.near(g, pt, r) ? null : pt);
    const payer = st.customers.find((c) => c.state === 'paying');
    if (st.carry > 0 && s.piles.counter < K.DISPLAY_CAP) return { text: 'Put the burgers on the counter! 🍔', target: at(K.DISPLAY_STAND, 30) };
    if (payer && !this.cashierPresent(g)) return { text: 'Stand at the register to take the money! 💵', target: K.CASHIER_SPOT };
    if (payer && !s.cashier) return { text: 'Ka-ching! 💵', target: null };
    if (s.piles.cash > 0) return { text: 'Grab the money! 💵', target: K.CASH };
    const tip = this.seats().findIndex((q, i) => s.tips[i] > 0);
    if (tip >= 0) return { text: 'A tip on the table! 💵', target: this.seats()[tip].spot };
    const hungry = st.customers.some((c) => c.inMainQueue || c.entering);
    if (s.piles.grill > 0 && st.carry < this.carryCap(g) && (hungry || s.piles.counter < 3) && !s.cook) return { text: 'Grab the burgers! 🍔', target: at(K.PILE_STAND, 30) };
    if (s.piles.grill === 0 && st.carry === 0 && s.piles.counter === 0 && hungry) return { text: 'The grill is cooking… 🔥', target: null };
    if (st.carry > 0) return { text: 'Eat a burger! 😋', target: null };
    for (const pad of this.pads(g)) if (!pad.maxed && g.s.cash + (g.s.padPaid[pad.key] || 0) >= pad.price) return { text: 'Buy something new! ⭐', target: pad.pos };
    if (!s.shakes) return { text: 'Make a milkshake! 🥤', target: K.SHAKE_SPOT };
    return { text: 'Yummy burgers! 🍔', target: null };
  },

  // ---------- where things are ----------
  bodyBob(p) { return p.moving ? Math.sin(p.bob || 0) * 2 : 0; },
  hand(g) { const p = g.player, f = p.facing || 1; return { x: p.x + f * 19, y: p.y - 21 + this.bodyBob(p) }; },
  mouth(g) { const p = g.player, f = p.facing || 1; return { x: p.x + f * 2, y: p.y - 31 + this.bodyBob(p) }; },
  // where the food is drawn now: { x, y, s (scale), held }
  foodPose(g) {
    const o = this.st.order; if (!o || o.phase === 'yum') return null;
    const h = this.hand(g), p = g.player;
    const from = o.kind === 'shake' ? { x: CFG.BURGER.MACHINE.x, y: CFG.BURGER.WORKTOP.y1 - 8 } : { x: p.x, y: p.y - 66 - this.stackBase(g) };
    if (o.phase === 'make') return { x: from.x, y: from.y, s: 1 };
    if (o.phase === 'give') {
      const k = U.clamp(o.t / CFG.BURGER.T.give, 0, 1);
      return { x: U.lerp(from.x, h.x, k), y: U.lerp(from.y, h.y, k) - Math.sin(k * Math.PI) * 20, s: U.lerp(o.kind === 'shake' ? 1 : 0.7, 0.8, k) };
    }
    return { x: h.x, y: h.y, s: 0.8, held: true };
  },
  // the burger stack sits on top of any pizzas the chef carries
  stackBase(g) { const c = g.player.carry || 0; return c > 0 ? Math.min(c, 30) * 4 + 10 : 0; },

  // ---------- art: the food ----------
  // one burger layer, its bottom at y = 0, about 30 px wide; returns its height
  drawLayer(ctx, kind) {
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(43,29,20,0.35)';
    if (kind === 'bunB') { ctx.fillStyle = '#e8a85a'; U.roundRect(ctx, -15, -6, 30, 6, 3); ctx.fill(); ctx.stroke(); return 6; }
    if (kind === 'patty') { ctx.fillStyle = '#6b3e1e'; U.roundRect(ctx, -16, -6, 32, 6, 3); ctx.fill(); ctx.fillStyle = '#4a2a14'; ctx.fillRect(-12, -3, 24, 1); return 6; }
    if (kind === 'cheese') { ctx.fillStyle = '#ffc93c'; ctx.beginPath(); ctx.moveTo(-15, -2.5); ctx.lineTo(15, -2.5); ctx.lineTo(15, 0); ctx.lineTo(9, 0); ctx.lineTo(6, 4); ctx.lineTo(3, 0); ctx.lineTo(-7, 0); ctx.lineTo(-10, 3.5); ctx.lineTo(-13, 0); ctx.lineTo(-15, 0); ctx.closePath(); ctx.fill(); return 2.5; }
    if (kind === 'lettuce') { ctx.fillStyle = '#56b862'; ctx.beginPath(); for (let i = 0; i <= 8; i++) { const x = -17 + i * 4.25; ctx.moveTo(x + 2.6, -1.5); ctx.arc(x, -1.5, 2.6, 0, Math.PI * 2); } ctx.fill(); return 3; }
    if (kind === 'tomato') { ctx.fillStyle = '#e53935'; for (const x of [-8, 8]) { U.roundRect(ctx, x - 7, -3, 14, 3.5, 1.5); ctx.fill(); } return 3; }
    // the top bun: a dome with sesame seeds
    ctx.fillStyle = '#e8a85a'; ctx.beginPath(); ctx.moveTo(-15.5, 0); ctx.quadraticCurveTo(-15.5, -13, 0, -13); ctx.quadraticCurveTo(15.5, -13, 15.5, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.ellipse(-5, -9, 5, 2, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff8e0'; for (const [sx, sy] of [[-8, -6], [-2, -10], [4, -7], [9, -4], [2, -4], [-6, -10]]) { ctx.beginPath(); ctx.ellipse(sx, sy, 1.3, 0.8, 0.4, 0, Math.PI * 2); ctx.fill(); }
    return 12;
  },
  layerH(kind) { return { bunB: 6, patty: 6, cheese: 2.5, lettuce: 3, tomato: 3, bunT: 12 }[kind]; },
  // the first n layers stacked up from (x, y); bites cut half-moons out of the side facing f's mouth
  drawBurger(ctx, x, y, n, s, bites, f) {
    const L = CFG.BURGER.LAYERS;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * (f || 1), s);
    if (bites > 0) {
      ctx.beginPath(); ctx.rect(-40, -60, 80, 80);
      const bs = [[-13, -14, 9], [-16, -4, 8], [-6, -20, 8]];   // on the side nearest the chef's mouth
      for (let i = 0; i < Math.min(bites, bs.length); i++) { const [bx, by, br] = bs[i]; ctx.moveTo(bx + br, by); ctx.arc(bx, by, br, 0, Math.PI * 2); }
      ctx.clip('evenodd');
    }
    let h = 0;
    for (let i = 0; i < Math.min(n, L.length); i++) { ctx.save(); ctx.translate(0, -h); this.drawLayer(ctx, L[i]); ctx.restore(); h += this.layerH(L[i]); }
    ctx.restore();
  },
  // a milkshake in a tall glass with whipped cream, a cherry and a straw; level = how full (0..1)
  drawShake(ctx, x, y, s, level) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(191,227,255,0.85)'; ctx.beginPath(); ctx.moveTo(-7, -22); ctx.lineTo(7, -22); ctx.lineTo(5, 0); ctx.lineTo(-5, 0); ctx.closePath(); ctx.fill();
    if (level > 0.02) {
      const top = -1 - 20 * level;
      ctx.fillStyle = '#ff8fab'; ctx.beginPath(); ctx.moveTo(-5 - 2 * (-top / 22), top); ctx.lineTo(5 + 2 * (-top / 22), top); ctx.lineTo(4.5, -1); ctx.lineTo(-4.5, -1); ctx.closePath(); ctx.fill();
      if (level > 0.95) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-3, -23, 4, 0, Math.PI * 2); ctx.arc(3, -23, 4, 0, Math.PI * 2); ctx.arc(0, -26, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#d32f2f'; ctx.beginPath(); ctx.arc(1, -31, 2.4, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(2, -10); ctx.lineTo(6, -34); ctx.stroke();
    ctx.strokeStyle = 'rgba(43,29,20,0.3)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-7, -22); ctx.lineTo(-5, 0); ctx.lineTo(5, 0); ctx.lineTo(7, -22); ctx.stroke();
    ctx.restore();
  },
  // n little burgers heaped in three rows on the warming shelf, centred at x, bottom at y
  drawStack(ctx, x, y, n) {
    for (let i = 0; i < n; i++) this.drawBurger(ctx, x + ((i % 3) - 1) * 19, y - Math.floor(i / 3) * 9, 6, 0.6, 0, 1);
  },
  // the chef's (or a staff member's) burger stack above the head, and the count badge
  drawCarried(r, g, x, y, n, cap, bob, base) {
    const ctx = r.ctx, m = Math.min(n, 20);
    for (let i = 0; i < m; i++) this.drawBurger(ctx, x, y - 64 - base + bob - i * 9, 6, 0.62, 0, 1);
    if (cap) r.drawCountBadge(x + 24, y - 80 - base - m * 9, n, cap);
  },
  // the thing the chef is eating (in hand) or the milkshake in the machine
  drawOrder(r, g) {
    const st = this.st, o = st.order, pose = this.foodPose(g); if (!pose) return;
    const ctx = r.ctx, K = CFG.BURGER, p = g.player, f = pose.held ? (p.facing || 1) : 1;
    if (o.kind === 'burger') this.drawBurger(ctx, pose.x, pose.y + 6 * pose.s, 6, pose.s, o.phase === 'eat' ? o.bites : 0, f);
    else if (o.phase === 'make') this.drawShake(ctx, pose.x, pose.y, 1, U.clamp(o.t / K.T.shake / 0.85, 0, 1));
    else this.drawShake(ctx, pose.x, pose.y + 10 * pose.s, pose.s, o.phase === 'eat' ? 1 - o.bites / K.BITES.shake : 1);
    if (pose.held) { ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(p.x + f * 14, p.y - 16 + this.bodyBob(p), 3.5, 0, Math.PI * 2); ctx.fill(); }   // the chef's hand in front
    st.drawn++;
  },
  // the chef's head drawn again on top of his own while eating: mouth open on each bite, happy eyes, a nod when done
  drawHappyHead(r, g) {
    const o = this.st.order; if (!o || (o.phase !== 'eat' && o.phase !== 'yum')) return;
    const ctx = r.ctx, p = g.player; if (p.carry > 0) return;
    const f = p.facing || 1, x = p.x, T = CFG.BURGER.T;
    const nod = o.phase === 'yum' ? Math.abs(Math.sin((o.t / T.yum) * Math.PI * 3)) * 3.5 : 0;
    const hy = p.y - 38 + this.bodyBob(p) - nod;
    const bt = o.phase === 'eat' ? (o.t / T.bite) % 1 : 1, open = o.phase === 'eat' && bt > 0.35 && bt < 0.65 ? 1 : Math.max(0, Math.sin(o.t * 20)) * 0.35;
    ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(43,29,20,0.45)';
    ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(x, hy, 10.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; U.roundRect(ctx, x - 9, hy - 16, 18, 10, 3); ctx.fill(); ctx.stroke();               // chef's hat
    ctx.beginPath(); ctx.arc(x - 5, hy - 18, 6, 0, Math.PI * 2); ctx.arc(x + 5, hy - 18, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7a2a1e'; ctx.beginPath(); ctx.ellipse(x + f * 2, hy + 6.5, 3.5 + open * 1.5, 1.2 + open * 2.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.ellipse(x + f * 1 - 3, hy + 5, 3, 1.4, 0, 0, Math.PI * 2); ctx.ellipse(x + f * 1 + 3, hy + 5, 3, 1.4, 0, 0, Math.PI * 2); ctx.fill();   // mustache
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.5; for (const dx of [-3, 3]) { ctx.beginPath(); ctx.arc(x + f * 3 + dx, hy + 0.5, 2.2, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }   // happy ^ ^ eyes
    ctx.fillStyle = 'rgba(255,120,120,0.45)'; const cheek = o.phase === 'yum' ? 3 : 2.2;
    ctx.beginPath(); ctx.arc(x + f * 3 - 7, hy + 3, cheek, 0, Math.PI * 2); ctx.arc(x + f * 3 + 7, hy + 3, cheek, 0, Math.PI * 2); ctx.fill();
  },

  // ---------- the town: the shop outside ----------
  paintTown(r, g) {
    const ctx = r.ctx, K = CFG.BURGER, S = K.SHOP, D = K.DOOR_OUT, w = S.x1 - S.x0, fy = S.y1 - K.FACADE, cx = (S.x0 + S.x1) / 2;
    const owned = !!(g.s.burger && g.s.burger.owned);
    // a paved path from the door down to the South Road sidewalk, and the shadow under the building
    ctx.fillStyle = '#d9cfbd'; ctx.fillRect(D.x - 15, S.y1, 30, 900 - S.y1);
    ctx.fillStyle = 'rgba(0,0,0,0.08)'; for (let y = S.y1 + 12; y < 900; y += 14) ctx.fillRect(D.x - 15, y, 30, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(S.x0 + 6, S.y0 + 8, w, S.y1 - S.y0);
    // the flat red roof with a light rim and a little vent box
    ctx.fillStyle = owned ? '#b8322a' : '#8a5a50'; ctx.fillRect(S.x0, S.y0, w, fy - S.y0);
    ctx.fillStyle = owned ? '#d9483a' : '#a07068'; ctx.fillRect(S.x0 + 5, S.y0 + 5, w - 10, fy - S.y0 - 8);
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; for (let x = S.x0 + 12; x < S.x1 - 8; x += 16) ctx.fillRect(x, S.y0 + 8, 8, fy - S.y0 - 14);
    ctx.fillStyle = '#9aa0a8'; U.roundRect(ctx, S.x1 - 34, S.y0 + 12, 20, 14, 3); ctx.fill(); ctx.fillStyle = '#5c6670'; for (let k = 0; k < 3; k++) ctx.fillRect(S.x1 - 31, S.y0 + 15 + k * 4, 14, 1.5);
    // the cream front wall
    ctx.fillStyle = owned ? '#fff1d0' : '#e8dcc0'; ctx.fillRect(S.x0, fy, w, S.y1 - fy);
    ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(S.x0, S.y1 - 5, w, 5);
    ctx.strokeStyle = 'rgba(43,29,20,0.35)'; ctx.lineWidth = 1.5; ctx.strokeRect(S.x0, S.y0, w, S.y1 - S.y0);
    // two windows (flower boxes once it is open; boarded up before)
    for (const wx of [S.x0 + 14, S.x1 - 70]) {
      const wy = fy + 22;
      ctx.fillStyle = '#8d5a2b'; ctx.fillRect(wx - 3, wy - 3, 62, 30);
      ctx.fillStyle = owned ? '#bfe3ff' : '#6b7d8c'; ctx.fillRect(wx, wy, 56, 24);
      if (owned) {
        ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.moveTo(wx + 6, wy + 24); ctx.lineTo(wx + 18, wy); ctx.lineTo(wx + 26, wy); ctx.lineTo(wx + 14, wy + 24); ctx.closePath(); ctx.fill();
        ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(wx < cx ? '🍔' : '🥤', wx + 40, wy + 12);
        ctx.fillStyle = '#8d5a2b'; ctx.fillRect(wx + 27, wy, 2, 24);
        ctx.fillStyle = '#6b3e1e'; ctx.fillRect(wx - 2, wy + 27, 60, 6);
        const fl = ['#ff5c8a', '#ffd166', '#ffffff', '#ff8fab', '#ffd166', '#ff5c8a'];
        for (let i = 0; i < 6; i++) { ctx.fillStyle = '#3f9a4a'; ctx.beginPath(); ctx.arc(wx + 4 + i * 10, wy + 26, 4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = fl[i]; ctx.beginPath(); ctx.arc(wx + 4 + i * 10, wy + 24, 2.2, 0, Math.PI * 2); ctx.fill(); }
      } else {
        // two crossed planks with nails
        for (const [a, b] of [[[wx - 4, wy + 4], [wx + 60, wy + 18]], [[wx - 4, wy + 20], [wx + 60, wy + 6]]]) {
          ctx.save(); ctx.translate(a[0], a[1]); ctx.rotate(Math.atan2(b[1] - a[1], b[0] - a[0]));
          ctx.fillStyle = '#c08a4a'; ctx.fillRect(0, -4, Math.hypot(b[0] - a[0], b[1] - a[1]), 8); ctx.fillStyle = '#5b3a1a'; ctx.fillRect(3, -1, 2, 2); ctx.restore();
        }
      }
    }
    // the door with a porthole, a handle and an OPEN (or SOON) tag
    const dx = D.x, dy = S.y1;
    ctx.fillStyle = '#8d2a1e'; ctx.fillRect(dx - 17, dy - 44, 34, 44);
    ctx.fillStyle = owned ? '#e53935' : '#a0524a'; ctx.fillRect(dx - 14, dy - 41, 28, 41);
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(dx, dy - 28, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#bfe3ff'; ctx.beginPath(); ctx.arc(dx, dy - 28, 6.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(dx - 3.5, dy - 32, 2.5, 5);
    ctx.fillStyle = '#ffd166'; ctx.fillRect(dx + 8, dy - 18, 3, 9);
    ctx.fillStyle = '#fff'; U.roundRect(ctx, dx - 11, dy - 14, 16, 8, 2); ctx.fill();
    ctx.fillStyle = owned ? '#2f9e44' : '#e53935'; ctx.font = r.font(5); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(owned ? 'OPEN' : 'SOON', dx - 3, dy - 10);
    // the striped awning along the top of the front wall, with a scalloped edge
    const ay = fy, ah = 14;
    for (let x = S.x0 - 4, i = 0; x < S.x1 + 4; x += 12, i++) { ctx.fillStyle = i % 2 ? '#fff' : (owned ? '#e53935' : '#b07a74'); ctx.fillRect(x, ay - 2, Math.min(12, S.x1 + 4 - x), ah); ctx.beginPath(); ctx.arc(x + 6, ay + ah - 2, 6, 0, Math.PI); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(S.x0 - 4, ay - 2, w + 8, 2);
    // the checker welcome mat
    for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) { ctx.fillStyle = (i + j) % 2 ? '#ffd166' : '#e53935'; ctx.fillRect(D.x - 18 + i * 6, D.y - 14 + j * 6, 6, 6); }
    ctx.strokeStyle = 'rgba(43,29,20,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(D.x - 18, D.y - 14, 36, 12);
    // the name board on the roof's front edge (the GIANT burger on its posts above it is drawn live: drawSign)
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, cx - 56, fy - 26, 112, 20, 6); ctx.fill();
    ctx.fillStyle = owned ? '#ffd166' : '#e8dcc0'; U.roundRect(ctx, cx - 53, fy - 23, 106, 14, 4); ctx.fill();
    ctx.fillStyle = '#c62828'; ctx.font = r.font(owned ? 10 : 8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(owned ? 'BURGERS' : 'COMING SOON', cx, fy - 15.5);
  },
  // the rooftop sign: a GIANT burger on two posts (a covered one before the shop is bought), drawn as an entity so
  // the chef walking past behind the shop goes behind it; it bobs a tiny bit, like it is bouncing with joy
  drawSign(r, g) {
    const ctx = r.ctx, S = CFG.BURGER.SHOP, cx = (S.x0 + S.x1) / 2, fy = S.y1 - CFG.BURGER.FACADE, owned = this.state(g).owned;
    ctx.fillStyle = '#5c6670'; ctx.fillRect(cx - 34, S.y0 - 4, 4, fy - S.y0 - 22); ctx.fillRect(cx + 30, S.y0 - 4, 4, fy - S.y0 - 22);
    ctx.fillStyle = '#3d4650'; ctx.fillRect(cx - 36, fy - 28, 8, 3); ctx.fillRect(cx + 28, fy - 28, 8, 3);
    if (owned) { this.paintBigBurger(ctx, cx, S.y0 - 2 - Math.abs(Math.sin(g.time * 2)) * 2, 2.6); return; }
    // under a tarp, tied with rope, until it is bought
    const by = S.y0 - 2;
    ctx.fillStyle = '#7c8a96'; ctx.beginPath(); ctx.moveTo(cx - 44, by); ctx.quadraticCurveTo(cx - 46, by - 70, cx, by - 74); ctx.quadraticCurveTo(cx + 46, by - 70, cx + 44, by); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1.5; for (const k of [-20, 0, 20]) { ctx.beginPath(); ctx.moveTo(cx + k, by - 70); ctx.quadraticCurveTo(cx + k * 1.3, by - 30, cx + k * 1.1, by); ctx.stroke(); }
    ctx.strokeStyle = '#c9a15a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(cx - 45, by - 28); ctx.lineTo(cx + 45, by - 28); ctx.stroke();
    ctx.font = r.font(16); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('❓', cx, by - 46);
  },
  // the burger layers, scaled up, bottom at (x, y)
  paintBigBurger(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(1, 0.5, 16, 2, 0, 0, Math.PI * 2); ctx.fill();
    let h = 0;
    for (const L of CFG.BURGER.LAYERS) { ctx.save(); ctx.translate(0, -h); this.drawLayer(ctx, L); ctx.restore(); h += this.layerH(L); }
    ctx.restore();
  },

  // ---------- the interior, static ----------
  paint: { burger(r, g) { BurgerExt.paintRoom(r, g); } },
  paintRoom(r, g) {
    const ctx = r.ctx, K = CFG.BURGER, W = K.WORLD, R = K.ROOM, w = K.WALL, WT = K.WORKTOP;
    ctx.fillStyle = '#3a4a5c'; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.04)'; for (let y = W.y0; y < W.y1; y += 40) for (let x = W.x0 + ((y / 40) % 2) * 20; x < W.x1; x += 40) ctx.fillRect(x, y, 38, 38);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(R.x0 - w + 8, K.BACK_TOP + 10, R.x1 - R.x0 + 2 * w, R.y1 + w - K.BACK_TOP);
    // a warm checker floor, and grey tiles in the kitchen behind the counter
    const T = 30;
    ctx.fillStyle = '#fff6e0'; ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0);
    ctx.fillStyle = '#ffd59a';
    for (let y = R.y0, j = 0; y < R.y1; y += T, j++) for (let x = R.x0, i = 0; x < R.x1; x += T, i++) if ((i + j) % 2) ctx.fillRect(x, y, Math.min(T, R.x1 - x), Math.min(T, R.y1 - y));
    const ky1 = K.COUNTER.y0 - 4;
    ctx.fillStyle = '#c9ccd2'; ctx.fillRect(WT.x0, WT.y1, WT.x1 - WT.x0, ky1 - WT.y1);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let y = WT.y1; y < ky1; y += 16) for (let x = WT.x0 + ((Math.floor((y - WT.y1) / 16)) % 2) * 8; x < WT.x1; x += 16) ctx.fillRect(x, y, 14, Math.min(14, ky1 - y));
    // walls: a tall tomato-red back wall with a mustard band; darker red side and bottom walls
    ctx.fillStyle = '#e0533f'; ctx.fillRect(R.x0 - w, K.BACK_TOP, R.x1 - R.x0 + 2 * w, R.y0 - K.BACK_TOP);
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; for (let x = R.x0 - w; x < R.x1 + w; x += 24) ctx.fillRect(x, K.BACK_TOP, 12, R.y0 - K.BACK_TOP);
    ctx.fillStyle = '#ffd166'; ctx.fillRect(R.x0 - w, K.BACK_TOP, R.x1 - R.x0 + 2 * w, 6); ctx.fillRect(R.x0 - w, R.y0 - 10, R.x1 - R.x0 + 2 * w, 6);
    ctx.fillStyle = '#a8322a'; ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, w); ctx.fillRect(R.x0 - w, R.y0, w, R.y1 - R.y0); ctx.fillRect(R.x1, R.y0, w, R.y1 - R.y0);
    ctx.fillStyle = '#ffd166'; ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, 3); ctx.fillRect(R.x0 - 3, R.y0, 3, R.y1 - R.y0); ctx.fillRect(R.x1, R.y0, 3, R.y1 - R.y0);
    this.paintBunting(r, g);   // under the menu cards
    // the menu cards: a burger and its price over the grills, a milkshake over the machine
    const cards = [['🍔', '$' + K.PRICE, (K.GRILLS[0].x0 + K.GRILLS[1].x1) / 2], ['🥤', '😋', K.MACHINE.x]];
    for (const [ico, price, x] of cards) {
      ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, x - 40, K.BACK_TOP + 14, 80, 46, 7); ctx.fill();
      ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, x - 36, K.BACK_TOP + 18, 72, 38, 5); ctx.fill();
      ctx.font = r.font(22); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ico, x - 14, K.BACK_TOP + 38);
      ctx.fillStyle = '#c62828'; ctx.font = r.font(14); ctx.fillText(price, x + 18, K.BACK_TOP + 38);
    }
    // a window over the booths: sky, the pond and a tree
    const wx0 = K.BOOTH.x0 + 14, wx1 = R.x1 - 14, wy0 = K.BACK_TOP + 14, wy1 = R.y0 - 20;
    ctx.fillStyle = '#fff1d0'; U.roundRect(ctx, wx0 - 5, wy0 - 5, wx1 - wx0 + 10, wy1 - wy0 + 10, 6); ctx.fill();
    const sky = ctx.createLinearGradient(0, wy0, 0, wy1); sky.addColorStop(0, '#7ec8f5'); sky.addColorStop(1, '#d6efff'); ctx.fillStyle = sky; ctx.fillRect(wx0, wy0, wx1 - wx0, wy1 - wy0);
    ctx.fillStyle = '#7cc45f'; ctx.fillRect(wx0, wy1 - 16, wx1 - wx0, 16);
    ctx.fillStyle = '#5ab8f0'; ctx.beginPath(); ctx.ellipse(wx0 + 40, wy1 - 8, 22, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6b4a2b'; ctx.fillRect(wx1 - 40, wy1 - 26, 5, 14); ctx.fillStyle = '#3f9a4a'; ctx.beginPath(); ctx.arc(wx1 - 38, wy1 - 32, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff1d0'; ctx.fillRect((wx0 + wx1) / 2 - 2, wy0, 4, wy1 - wy0);
    this.paintDecor(r, g, { wx0, wx1, wy0, wy1 });
    // the steel worktop along the back wall, with the warming shelf for the burger pile
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(WT.x0, R.y0, WT.x1 - WT.x0, WT.y1 - R.y0);
    ctx.fillStyle = '#d7dbe0'; ctx.fillRect(WT.x0, R.y0, WT.x1 - WT.x0, WT.y1 - R.y0 - 8);
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(WT.x0, WT.y1, WT.x1 - WT.x0, 4);
    ctx.fillStyle = '#ffd166'; U.roundRect(ctx, K.PILE.x - 34, K.PILE.y - 4, 68, 12, 4); ctx.fill();
    ctx.fillStyle = 'rgba(255,120,40,0.3)'; ctx.fillRect(K.PILE.x - 26, R.y0 + 2, 52, 3);
    // a mat on the floor at the pile, the display and the register, so it is clear where to stand
    for (const [pt, ico] of [[K.PILE_STAND, '🍔'], [K.DISPLAY_STAND, '⬇️'], [K.CASHIER_SPOT, '💵']]) {
      ctx.fillStyle = 'rgba(255,209,102,0.55)'; ctx.beginPath(); ctx.ellipse(pt.x, pt.y + 4, 24, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(228,87,46,0.6)'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.stroke(); ctx.setLineDash([]);
      ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ico, pt.x, pt.y + 5);
    }
    // the booths' back benches
    for (const top of K.BOOTH.tops) {
      ctx.fillStyle = '#9b1d1d'; U.roundRect(ctx, K.BOOTH.x0 + 2, top, K.BOOTH.x1 - K.BOOTH.x0 - 4, 24, 6); ctx.fill();
      ctx.fillStyle = '#d32f2f'; U.roundRect(ctx, K.BOOTH.x0 + 5, top + 3, K.BOOTH.x1 - K.BOOTH.x0 - 10, 16, 5); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; for (let x = K.BOOTH.x0 + 14; x < K.BOOTH.x1 - 8; x += 16) ctx.fillRect(x, top + 5, 2, 12);
    }
    // the exit mat and the door in the bottom wall
    const X = K.EXIT;
    ctx.fillStyle = '#8d2a1e'; ctx.fillRect(X.x - 26, R.y1, 52, w);
    ctx.fillStyle = '#e53935'; ctx.fillRect(X.x - 22, R.y1 + 2, 44, w - 4);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) { ctx.fillStyle = (i + j) % 2 ? '#ffd166' : '#e53935'; ctx.fillRect(X.x - 18 + i * 6, X.y + 4 + j * 6, 6, 6); }
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🚪', X.x, X.y - 4);
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, (R.x0 + R.x1) / 2 - 60, R.y1 + w + 4, 120, 14, 4); ctx.fill(); ctx.fillStyle = '#ffd166'; ctx.font = r.font(8); ctx.fillText('🍔 BURGERS 🍔', (R.x0 + R.x1) / 2, R.y1 + w + 11);
  },

  // ---------- the decorations ----------
  // fn drawn as it is once bought, and as a faded ghost where it will go before that (like the pizzeria's bgDecor)
  ghost(r, g, key, fn) { if (this.hasDecor(g, key)) { fn(); return; } const ctx = r.ctx; ctx.save(); ctx.globalAlpha = 0.32; fn(); ctx.restore(); },
  // little triangle flags swinging along the top of the back wall
  paintBunting(r, g) {
    const ctx = r.ctx, R = CFG.BURGER.ROOM, w = CFG.BURGER.WALL, top = CFG.BURGER.BACK_TOP + 8, x0 = R.x0 - w + 4, x1 = R.x1 + w - 4, n = 8, L = (x1 - x0) / n;
    const sag = (x) => top + 10 * Math.sin(Math.PI * (((x - x0) % L) / L));
    this.ghost(r, g, 'curtains', () => {
      ctx.strokeStyle = '#5b3a1a'; ctx.lineWidth = 1.5; ctx.beginPath();
      for (let i = 0; i < n; i++) { ctx.moveTo(x0 + i * L, top); ctx.quadraticCurveTo(x0 + (i + 0.5) * L, top + 20, x0 + (i + 1) * L, top); }
      ctx.stroke();
      const cols = ['#fff8ee', '#ffd166', '#5ab8f0', '#7ee081'];
      for (let x = x0 + 8, i = 0; x < x1 - 4; x += 15, i++) {
        const y = sag(x); ctx.fillStyle = cols[i % cols.length];
        ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x + 5, y); ctx.lineTo(x, y + 11); ctx.closePath(); ctx.fill();
      }
    });
  },
  // the wall and floor pieces (cached with the room): curtains, the poster and the clock, the neon sign's board, the rug
  paintDecor(r, g, win) {
    const ctx = r.ctx, K = CFG.BURGER;
    // checkered red-and-white curtains on the window over the booths, tied back, with a scalloped top
    this.ghost(r, g, 'curtains', () => {
      const checks = (x0, y0, w, h) => {
        ctx.fillStyle = '#fff8ee'; ctx.fillRect(x0, y0, w, h); ctx.fillStyle = '#e53935';
        for (let y = y0, j = 0; y < y0 + h; y += 6, j++) for (let x = x0, i = 0; x < x0 + w; x += 6, i++) if ((i + j) % 2) ctx.fillRect(x, y, Math.min(6, x0 + w - x), Math.min(6, y0 + h - y));
      };
      for (const side of [-1, 1]) {
        const x0 = side < 0 ? win.wx0 - 9 : win.wx1 - 15;
        checks(x0, win.wy0 - 6, 24, win.wy1 - win.wy0 + 12);
        ctx.fillStyle = '#ffd166'; ctx.fillRect(x0 - 1, win.wy0 + 34, 26, 5);   // the tieback
      }
      checks(win.wx0 - 12, win.wy0 - 10, win.wx1 - win.wx0 + 24, 10);
      ctx.fillStyle = '#e53935'; for (let x = win.wx0 - 6; x < win.wx1 + 12; x += 12) { ctx.beginPath(); ctx.arc(x, win.wy0, 6, 0, Math.PI); ctx.fill(); }
    });
    // a framed burger poster left of the menu, and a round retro clock between the milkshake card and the window
    this.ghost(r, g, 'posters', () => {
      const P = K.DECOR[1].spots[0], C = K.DECOR[1].spots[1];
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(P.x - 25, P.y - 30, 54, 66);
      ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, P.x - 28, P.y - 33, 56, 66, 4); ctx.fill();
      ctx.fillStyle = '#5ab8f0'; ctx.fillRect(P.x - 24, P.y - 29, 48, 58);
      ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(P.x, P.y - 4, 19, 0, Math.PI * 2); ctx.fill();
      this.drawBurger(ctx, P.x, P.y + 6, 6, 0.95, 0, 1);
      ctx.fillStyle = '#fff'; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('YUM!', P.x, P.y + 20);
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.arc(C.x + 3, C.y + 3, 22, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d7dbe0'; ctx.beginPath(); ctx.arc(C.x, C.y, 22, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5ab8f0'; ctx.beginPath(); ctx.arc(C.x, C.y, 18, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff8ee'; ctx.beginPath(); ctx.arc(C.x, C.y, 15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2b1d14'; for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6; ctx.beginPath(); ctx.arc(C.x + Math.cos(a) * 12, C.y + Math.sin(a) * 12, i % 3 ? 0.9 : 1.6, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = '#2b1d14'; ctx.lineCap = 'round'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(C.x, C.y); ctx.lineTo(C.x - 6, C.y - 4); ctx.stroke();
      ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(C.x, C.y); ctx.lineTo(C.x + 7, C.y - 8); ctx.stroke(); ctx.lineCap = 'butt';
      ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.arc(C.x, C.y, 2.2, 0, Math.PI * 2); ctx.fill();
    });
    // the neon sign's dark board (the glowing tubes are live once it is bought: drawNeon); its ghost shows them unlit
    this.ghost(r, g, 'neon', () => {
      const N = K.NEON;
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; U.roundRect(ctx, N.x0 + 3, N.y0 + 4, N.x1 - N.x0, N.y1 - N.y0, 10); ctx.fill();
      ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, N.x0, N.y0, N.x1 - N.x0, N.y1 - N.y0, 10); ctx.fill();
      ctx.fillStyle = '#9aa0a8'; for (const x of [N.x0 + 14, N.x1 - 14]) { ctx.beginPath(); ctx.arc(x, N.y0 + 8, 2.5, 0, Math.PI * 2); ctx.fill(); }
      if (!this.hasDecor(g, 'neon')) this.neonTubes(r, 1, true);
    });
    // a round diner rug in front of the jukebox (the jukebox itself stands among the people: drawJukebox)
    this.ghost(r, g, 'jukebox', () => {
      const U2 = K.RUG;
      ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.beginPath(); ctx.ellipse(U2.x + 2, U2.y + 3, U2.rx, U2.ry, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2b8ae6'; ctx.beginPath(); ctx.ellipse(U2.x, U2.y, U2.rx, U2.ry, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff8ee'; ctx.beginPath(); ctx.ellipse(U2.x, U2.y, U2.rx - 9, U2.ry - 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.ellipse(U2.x, U2.y, U2.rx - 18, U2.ry - 11, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd166'; ctx.font = r.font(14); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('★', U2.x, U2.y + 1);
    });
  },
  // the sign's tubes: a burger outline and BURGERS. lit: 0..1 (flicker); dim: the unlit ghost
  neonTubes(r, lit, dim) {
    const ctx = r.ctx, N = CFG.BURGER.NEON, bx = N.x0 + 34, by = (N.y0 + N.y1) / 2;
    const tubes = (w, a) => {
      ctx.lineWidth = w; ctx.lineCap = 'round';
      ctx.strokeStyle = dim ? '#c9a0b4' : `rgba(255,184,64,${a})`;
      ctx.beginPath(); ctx.moveTo(bx - 18, by - 2); ctx.quadraticCurveTo(bx - 18, by - 18, bx, by - 18); ctx.quadraticCurveTo(bx + 18, by - 18, bx + 18, by - 2); ctx.closePath(); ctx.stroke();   // top bun
      ctx.strokeStyle = dim ? '#b8c9a0' : `rgba(126,255,140,${a})`; ctx.beginPath(); ctx.moveTo(bx - 19, by + 3); for (let i = 1; i <= 6; i++) ctx.lineTo(bx - 19 + i * 6.3, by + 3 + (i % 2 ? 3 : 0)); ctx.stroke();   // lettuce
      ctx.strokeStyle = dim ? '#c9a0b4' : `rgba(255,120,80,${a})`; ctx.beginPath(); ctx.moveTo(bx - 17, by + 9); ctx.lineTo(bx + 17, by + 9); ctx.stroke();   // patty
      ctx.strokeStyle = dim ? '#c9a0b4' : `rgba(255,184,64,${a})`; ctx.beginPath(); ctx.moveTo(bx - 16, by + 15); ctx.quadraticCurveTo(bx, by + 21, bx + 16, by + 15); ctx.stroke();   // bottom bun
      ctx.lineCap = 'butt';
    };
    const tx = (N.x0 + N.x1) / 2 + 22;
    ctx.font = r.font(25); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (dim) { tubes(3, 1); ctx.fillStyle = '#c9a0b4'; ctx.fillText('BURGERS', tx, by + 1); return; }
    // a soft halo (wide faint strokes; no canvas shadow, so it stays cheap), then the bright tubes
    tubes(9, 0.18 * lit); tubes(3, lit);
    ctx.lineWidth = 6; ctx.lineJoin = 'round'; ctx.strokeStyle = `rgba(255,79,216,${(0.3 * lit).toFixed(3)})`; ctx.strokeText('BURGERS', tx, by + 1);
    ctx.fillStyle = `rgba(255,150,230,${lit.toFixed(3)})`; ctx.fillText('BURGERS', tx, by + 1);
    ctx.lineJoin = 'miter';
  },
  drawNeon(r, g) {
    const t = g.time, lit = 0.8 + 0.2 * Math.sin(t * 9) * Math.sin(t * 2.3);
    this.neonTubes(r, lit, false);
  },
  // a mini cactus in a pot, its bottom at (x, y)
  drawCactus(ctx, x, y) {
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x + 1, y, 7, 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d2673b'; ctx.beginPath(); ctx.moveTo(x - 6, y - 8); ctx.lineTo(x + 6, y - 8); ctx.lineTo(x + 4.5, y); ctx.lineTo(x - 4.5, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#b5532b'; ctx.fillRect(x - 6.5, y - 9.5, 13, 3);
    ctx.fillStyle = '#3f9a4a'; U.roundRect(ctx, x - 3.5, y - 26, 7, 18, 3.5); ctx.fill();
    U.roundRect(ctx, x - 9, y - 21, 4, 9, 2); ctx.fill(); ctx.fillRect(x - 7, y - 14, 4, 3);
    U.roundRect(ctx, x + 5, y - 23, 4, 9, 2); ctx.fill(); ctx.fillRect(x + 3, y - 17, 4, 3);
    ctx.fillStyle = '#56b862'; ctx.fillRect(x - 1.5, y - 24, 1.5, 14);
    ctx.fillStyle = '#ff5c8a'; ctx.beginPath(); ctx.arc(x, y - 26.5, 2.4, 0, Math.PI * 2); ctx.fill();
  },
  // the jukebox in the corner: a chrome arch with rainbow lights (they chase round once it plays), records behind
  // glass and a speaker; little notes float up while it plays
  drawJukebox(r, g) {
    const ctx = r.ctx, J = CFG.BURGER.JUKEBOX, x = J.x, y = J.y, on = this.hasDecor(g, 'jukebox'), t = g.time;
    this.ghost(r, g, 'jukebox', () => this.paintJukebox(ctx, x, y, on ? t : 0));
    if (!on) return;
    ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let i = 0; i < 2; i++) {
      const k = (t * 0.5 + i * 0.5) % 1;
      ctx.fillStyle = `rgba(${i ? '43,138,230' : '229,57,53'},${(1 - k).toFixed(3)})`;
      ctx.fillText(i ? '♫' : '♪', x - 12 + i * 22 + Math.sin(k * 6 + i) * 5, y - 66 - k * 30);
    }
  },
  paintJukebox(ctx, x, y, t) {
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 1, 24, 6, 0, 0, Math.PI * 2); ctx.fill();
    const arch = (inset, h) => { ctx.beginPath(); ctx.moveTo(x - 20 + inset, y - inset * 0.3); ctx.lineTo(x - 20 + inset, y - h + 20); ctx.arc(x, y - h + 20, 20 - inset, Math.PI, 0); ctx.lineTo(x + 20 - inset, y - inset * 0.3); ctx.closePath(); };
    ctx.fillStyle = '#8c2f2f'; arch(0, 62); ctx.fill();
    ctx.fillStyle = '#d7dbe0'; arch(3, 60); ctx.fill();
    const cols = ['#ff5c8a', '#ffd166', '#7ee081', '#5ab8f0'];
    for (let i = 0; i < 4; i++) { ctx.fillStyle = cols[(i + Math.floor(t * 4)) % 4]; arch(5 + i * 2.2, 58 - i * 2.2); ctx.fill(); }
    ctx.fillStyle = '#c62828'; arch(14, 49); ctx.fill();
    ctx.fillStyle = '#bfe3ff'; U.roundRect(ctx, x - 10, y - 44, 20, 14, 4); ctx.fill();
    ctx.fillStyle = '#2b1d14'; for (let i = 0; i < 3; i++) ctx.fillRect(x - 8 + i * 6, y - 42, 4, 10);
    ctx.fillStyle = '#ffd166'; ctx.fillRect(x - 10, y - 27, 20, 3);
    ctx.fillStyle = '#5c2020'; U.roundRect(ctx, x - 9, y - 21, 18, 16, 3); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x - 7, y - 18 + k * 4); ctx.lineTo(x + 7, y - 18 + k * 4); ctx.stroke(); }
  },

  // ---------- the interior, moving things ----------
  drawOutside(r, g) {
    const ctx = r.ctx, W = CFG.BURGER.WORLD, x0 = r.camX - 20, y0 = r.camY - 20, x1 = r.camX + r.viewW + 20, y1 = r.camY + r.viewH + 20;
    ctx.fillStyle = '#3a4a5c';
    if (y0 < W.y0) ctx.fillRect(x0, y0, x1 - x0, W.y0 - y0);
    if (y1 > W.y1) ctx.fillRect(x0, W.y1, x1 - x0, y1 - W.y1);
    if (x0 < W.x0) ctx.fillRect(x0, W.y0, W.x0 - x0, W.y1 - W.y0);
    if (x1 > W.x1) ctx.fillRect(W.x1, W.y0, x1 - W.x1, W.y1 - W.y0);
  },
  // a grill on the worktop: glowing bars, and the burger it is building, one layer at a time (cold and empty before
  // it is bought; the second grill is just a dashed outline until then)
  drawGrill(r, g, i) {
    const ctx = r.ctx, K = CFG.BURGER, G = K.GRILLS[i], s = this.state(g), st = this.st, t = g.time, y0 = K.ROOM.y0 + 4, y1 = K.WORKTOP.y1 - 6;
    if (i >= s.grills) {
      ctx.strokeStyle = 'rgba(43,29,20,0.35)'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]); U.roundRect(ctx, G.x0, y0, G.x1 - G.x0, y1 - y0, 4); ctx.stroke(); ctx.setLineDash([]);
      return;
    }
    ctx.fillStyle = '#2b2b2b'; U.roundRect(ctx, G.x0, y0, G.x1 - G.x0, y1 - y0, 4); ctx.fill();
    const hot = s.owned;
    for (let x = G.x0 + 8; x < G.x1 - 4; x += 10) { ctx.fillStyle = hot ? `rgba(255,${120 + Math.round(40 * Math.sin(t * 3 + x))},40,0.55)` : 'rgba(120,120,120,0.4)'; ctx.fillRect(x, y0 + 4, 3, y1 - y0 - 8); }
    if (!hot) return;
    // a patty sizzling on the left, and the burger being stacked on the right
    const px = G.x0 + 28, py = (y0 + y1) / 2 + 4;
    ctx.save(); ctx.translate(px, py); ctx.scale(0.8, 0.8); this.drawLayer(ctx, 'patty'); ctx.restore();
    const k = U.clamp(st.grills[i].t / this.grillTime(g), 0, 1), n = Math.min(6, Math.floor(k * 7));
    if (n > 0) this.drawBurger(ctx, G.x1 - 32, py + 2, n, 0.8, 0, 1);
    for (const q of st.steam) if (q.x > G.x0 && q.x < G.x1) { const a = q.t / 1.3; ctx.fillStyle = `rgba(255,255,255,${(0.65 * (1 - a)).toFixed(2)})`; ctx.beginPath(); ctx.arc(q.x, q.y, 3 + a * 5, 0, Math.PI * 2); ctx.fill(); }
  },
  // the milkshake machine on the worktop: a pink head that shakes while it whirs
  drawMachine(r, g) {
    const ctx = r.ctx, K = CFG.BURGER, o = this.st.order, t = g.time, x = K.MACHINE.x, y = K.WORKTOP.y1 - 8;
    const whir = o && o.kind === 'shake' && o.phase === 'make', sh = whir ? Math.sin(t * 60) * 1 : 0;
    ctx.fillStyle = '#ff8fab'; U.roundRect(ctx, x - 22, y - 46, 44, 46, 8); ctx.fill();
    ctx.fillStyle = '#ffb3c6'; U.roundRect(ctx, x - 18 + sh, y - 42, 36, 16, 6); ctx.fill();
    ctx.fillStyle = '#d7dbe0'; ctx.fillRect(x - 3, y - 26, 6, 8);
    ctx.fillStyle = whir ? '#ff5252' : '#7ee081'; ctx.beginPath(); ctx.arc(x + 14, y - 8, 3, 0, Math.PI * 2); ctx.fill();
    ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🍓', x + sh, y - 34);
    if (whir) { ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.5; for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + d * 26, y - 40); ctx.lineTo(x + d * 32, y - 44); ctx.moveTo(x + d * 26, y - 30); ctx.lineTo(x + d * 33, y - 30); ctx.stroke(); } }
  },
  // the cash pile behind the counter: a little heap of bills, taller with more money
  drawCash(r, g) {
    const ctx = r.ctx, K = CFG.BURGER, s = this.state(g), n = Math.min(10, Math.ceil(s.piles.cash / 12));
    for (let i = 0; i < n; i++) {
      const x = K.CASH.x + ((i * 7) % 3 - 1) * 8, y = K.CASH.y - i * 3;
      ctx.fillStyle = '#2f9e44'; U.roundRect(ctx, x - 12, y - 6, 24, 11, 2); ctx.fill();
      ctx.fillStyle = '#7ee081'; ctx.fillRect(x - 9, y - 3, 18, 5); ctx.fillStyle = '#2f9e44'; ctx.beginPath(); ctx.arc(x, y - 0.5, 2, 0, Math.PI * 2); ctx.fill();
    }
    if (s.piles.cash > 0) { ctx.fillStyle = '#1f6e2e'; ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(U.money(s.piles.cash), K.CASH.x, K.CASH.y - 14 - n * 3); }
  },
  // the counter (an entity so it hides the legs of whoever stands behind it): mustard top, red front, the display
  // stack of burgers and the register
  drawCounter(r, g) {
    const ctx = r.ctx, K = CFG.BURGER, C = K.COUNTER, w = C.x1 - C.x0, s = this.state(g);
    ctx.fillStyle = '#e8b04a'; ctx.fillRect(C.x0, C.y0 - 10, w, 30);
    ctx.fillStyle = '#ffd166'; ctx.fillRect(C.x0, C.y0 - 10, w, 26);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(C.x0, C.y0 - 8, w, 3);
    ctx.fillStyle = '#c62828'; ctx.fillRect(C.x0, C.y0 + 20, w, C.y1 - C.y0 - 20 + 8);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; for (let x = C.x0 + 6; x < C.x1; x += 18) ctx.fillRect(x, C.y0 + 22, 9, C.y1 - C.y0 - 16);
    // the display: a tray with the burgers in two little piles
    const D = K.DISPLAY;
    ctx.fillStyle = '#d7dbe0'; ctx.beginPath(); ctx.ellipse(D.x, D.y + 2, 34, 9, 0, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < s.piles.counter; i++) this.drawBurger(ctx, D.x + (i % 2 ? 13 : -13), D.y + 4 - Math.floor(i / 2) * 9, 6, 0.6, 0, 1);
    // the register: a little till with a drawer that pops while someone pays
    const R = K.REGISTER, paying = this.st.customers.some((c) => c.state === 'paying' && c.payProg > 0 && c.payProg < 1);
    ctx.fillStyle = '#5c6670'; U.roundRect(ctx, R.x - 16, R.y - 20, 32, 22, 4); ctx.fill();
    ctx.fillStyle = '#7ee081'; ctx.fillRect(R.x - 11, R.y - 17, 22, 7);
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(6); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$' + K.PRICE, R.x, R.y - 13);
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(R.x - 14, R.y + (paying ? 2 : -2), 28, 5);
    this.cacti(r, g, K.DECOR[0].spots.slice(2));
    if (!s.owned) {
      // a CLOSED sign hanging over the counter until the shop is bought
      ctx.strokeStyle = '#5b3a1a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(D.x + 50, C.y0 - 60); ctx.lineTo(D.x + 40, C.y0 - 40); ctx.moveTo(D.x + 50, C.y0 - 60); ctx.lineTo(D.x + 60, C.y0 - 40); ctx.stroke();
      ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, D.x + 14, C.y0 - 42, 72, 24, 5); ctx.fill();
      ctx.fillStyle = '#ff5c5c'; ctx.font = r.font(11); ctx.fillText('CLOSED', D.x + 50, C.y0 - 30);
    }
  },
  drawBoothTable(r, g, i) {
    const ctx = r.ctx, K = CFG.BURGER, top = K.BOOTH.tops[i], x0 = K.BOOTH.x0 + 12, x1 = K.BOOTH.x1 - 12, s = this.state(g);
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect((x0 + x1) / 2 - 3, top + 52, 6, 6);
    ctx.fillStyle = '#d7dbe0'; U.roundRect(ctx, x0, top + 30, x1 - x0, 24, 5); ctx.fill();
    ctx.fillStyle = '#fff1d0'; U.roundRect(ctx, x0 + 2, top + 30, x1 - x0 - 4, 19, 4); ctx.fill();
    ctx.fillStyle = '#e53935'; U.roundRect(ctx, x1 - 22, top + 33, 4, 9, 1.5); ctx.fill(); ctx.fillStyle = '#ffd166'; U.roundRect(ctx, x1 - 16, top + 33, 4, 9, 1.5); ctx.fill();   // ketchup & mustard
    this.cacti(r, g, [K.DECOR[0].spots[i]]);
    // a burger on the table while a customer eats, a tip after
    const c = this.st.customers.find((q) => q.table === this.st.tables[i] && q.state === 'eating');
    if (c) this.drawBurger(ctx, (x0 + x1) / 2 + 4, top + 44, 6, 0.7, Math.floor((1 - c.timer / c.eatDur) * 4), -1);
    if (s.tips[i] > 0) { const q = this.seats()[i].tip; ctx.fillStyle = '#2f9e44'; U.roundRect(ctx, q.x - 9, q.y - 5, 18, 9, 2); ctx.fill(); ctx.fillStyle = '#7ee081'; ctx.fillRect(q.x - 6, q.y - 2, 12, 3); }
  },
  cacti(r, g, spots) { this.ghost(r, g, 'cactus', () => { for (const q of spots) this.drawCactus(r.ctx, q.x, q.y); }); },
  drawBoothFront(r, g, top) {
    const ctx = r.ctx, x0 = CFG.BURGER.BOOTH.x0, x1 = CFG.BURGER.BOOTH.x1;
    ctx.fillStyle = '#9b1d1d'; U.roundRect(ctx, x0 + 2, top + 58, x1 - x0 - 4, 20, 6); ctx.fill();
    ctx.fillStyle = '#d32f2f'; U.roundRect(ctx, x0 + 5, top + 60, x1 - x0 - 10, 15, 5); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; for (let x = x0 + 14; x < x1 - 8; x += 16) ctx.fillRect(x, top + 62, 2, 11);
  },
  drawPlant(r, g, P) {
    const ctx = r.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(P.x + 2, P.y + 6, 13, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c0703a'; ctx.beginPath(); ctx.moveTo(P.x - 10, P.y - 12); ctx.lineTo(P.x + 10, P.y - 12); ctx.lineTo(P.x + 7, P.y + 6); ctx.lineTo(P.x - 7, P.y + 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3f9a4a'; for (const [dx, dy, rr] of [[0, -26, 10], [-9, -18, 8], [9, -18, 8], [0, -36, 7]]) { ctx.beginPath(); ctx.arc(P.x + dx, P.y + dy, rr, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#56b862'; ctx.beginPath(); ctx.arc(P.x - 3, P.y - 30, 5, 0, Math.PI * 2); ctx.fill();
  },
  drawCustomer(r, g, c) {
    const ctx = r.ctx, K = CFG.BURGER;
    const sitting = c.state === 'eating';
    c.bob = (c.bob || 0) + (c.moving ? 0.25 : 0);
    r.drawPerson(c.x, c.y, { shirt: c.shirt, skin: c.skin, hair: c.hair, hairStyle: c.hairStyle, stripes: c.stripes, facing: c.facing, moving: c.moving, bob: c.bob, carry: 0, angry: c.angry, pants: '#4a4a4a' });
    const bob = c.moving ? Math.sin(c.bob) * 2 : 0;
    if (!sitting && c.have > 0) this.drawCarried(r, g, c.x, c.y, c.have, 0, bob, 0);
    // what the customer at the front wants: burgers, then money; the patience bar like the pizzeria's
    const by = c.y - 70 - c.have * 9, frac = c.patience / c.patienceMax;
    if (c.state === 'queue' && this.queueIndex(c) === 0) {
      const left = c.want - c.have;
      r.drawBubble(c.x, by, () => { ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText('🍔×' + left, 0, 0); }, 52);
      r.drawPatience(c.x, by - 18, frac);
    } else if (c.state === 'paying') {
      r.drawBubble(c.x, by, () => { ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText('💵', 0, 0); }, 34);
      if (c.payProg > 0) r.drawProgressRing(c.x, c.y - 20, 22, c.payProg, '#2f9e44');
      else if (frac < 0.5) r.drawPatience(c.x, by - 18, frac);
    } else if ((c.inMainQueue || c.inPayQueue) && frac < 0.35) r.drawPatience(c.x, c.y - 60 - c.have * 9, frac);
  },
  drawStaff(r, g, w) {
    const ctx = r.ctx, x = w.x, y = w.y;
    w.bob = (w.bob || 0) + (w.moving ? 0.25 : 0);
    if (w.role === 'cook') {
      r.drawPerson(x, y, { shirt: '#e53935', skin: '#e0ac69', hair: '#6b3e1e', hairStyle: 0, facing: w.facing, moving: w.moving, bob: w.bob, carry: 0, apron: '#fff', pants: '#2d3a4a' });
      ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(43,29,20,0.45)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(x - 12, y - 44); ctx.lineTo(x + 12, y - 44); ctx.lineTo(x + 7, y - 55); ctx.lineTo(x - 7, y - 55); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e53935'; ctx.fillRect(x - 11, y - 48, 22, 3);
      if (w.carry > 0) this.drawCarried(r, g, x, y, w.carry, 0, w.moving ? Math.sin(w.bob) * 2 : 0, 0);
    } else {
      r.drawPerson(x, y, { shirt: '#ffd166', skin: '#c68642', hat: 'cap', capColor: '#e53935', facing: w.facing, moving: w.moving, bob: w.bob, carry: 0, pants: '#2d3a4a' });
    }
  },

  // ---------- render hooks ----------
  dynamic(r, g) {
    const st = this.st; if (!st || g.area !== 'burger') return;
    this.drawOutside(r, g);
    for (let i = 0; i < CFG.BURGER.GRILLS.length; i++) this.drawGrill(r, g, i);
    this.drawMachine(r, g);
    const K = CFG.BURGER, s = this.state(g);
    this.drawStack(r.ctx, K.PILE.x, K.PILE.y + 4, Math.min(s.piles.grill, 15));
    if (s.piles.grill > 0) r.drawCountBadge(K.PILE.x + 44, K.PILE.y - 22, s.piles.grill, this.pileCap(g));
    this.drawCash(r, g);
    if (this.hasDecor(g, 'neon')) this.drawNeon(r, g);
    if (st.order && st.order.phase === 'make') this.drawOrder(r, g);
  },
  entities(r, g, items) {
    const st = this.st; if (!st) return;
    const p = g.player, K = CFG.BURGER, o = st.order;
    // the burgers in the chef's hands, the food being eaten (and the happy munching head), in any map
    if (this.visible(g) && (st.carry > 0 || (o && o.phase !== 'make'))) {
      items.push({ y: p.y + 0.5, draw: () => {
        if (st.carry > 0) this.drawCarried(r, g, p.x, p.y, st.carry, this.carryCap(g), this.bodyBob(p), this.stackBase(g));
        if (o && o.phase !== 'make') { this.drawHappyHead(r, g); this.drawOrder(r, g); }
      } });
    }
    if (g.area === 'town') {
      const S = K.SHOP;
      if (S.x1 > r.camX - 60 && S.x0 < r.camX + r.viewW + 60 && S.y1 > r.camY - 60 && S.y0 - 120 < r.camY + r.viewH) items.push({ y: S.y0 + 1, draw: () => this.drawSign(r, g) });
    }
    if (g.area !== 'burger') return;
    items.push({ y: K.COUNTER.y1, draw: () => this.drawCounter(r, g) });
    K.BOOTH.tops.forEach((top, i) => {
      items.push({ y: top + 56, draw: () => this.drawBoothTable(r, g, i) });
      items.push({ y: top + 78, draw: () => this.drawBoothFront(r, g, top) });
    });
    for (const P of K.PLANTS) items.push({ y: P.y + 6, draw: () => this.drawPlant(r, g, P) });
    items.push({ y: K.JUKEBOX.y, draw: () => this.drawJukebox(r, g) });
    for (const c of st.customers) items.push({ y: c.state === 'eating' ? K.BOOTH.tops[c.table.i] + 40 : c.y, draw: () => this.drawCustomer(r, g, c) });
    for (const w of st.staff) items.push({ y: w.y, draw: () => this.drawStaff(r, g, w) });
  },
  overlay(r, g) {
    const st = this.st; if (!st) return;
    const ctx = r.ctx;
    if (g.area === 'burger') for (const f of st.flies) {
      const k = U.clamp(f.t / f.dur, 0, 1);
      this.drawBurger(ctx, U.lerp(f.x0, f.x1, k), U.lerp(f.y0, f.y1, k) - Math.sin(k * Math.PI) * 16, 6, 0.6, 0, 1);
    }
    for (const q of st.sparks) {
      if (q.area !== g.area) continue;
      const k = q.t / q.dur, a0 = (1 - k).toFixed(3);
      ctx.strokeStyle = `rgba(${q.color},${a0})`; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4 + k, r1 = 6 + k * 20, r2 = r1 + (i % 2 ? 5 : 9); ctx.beginPath(); ctx.moveTo(q.x + Math.cos(a) * r1, q.y + Math.sin(a) * r1); ctx.lineTo(q.x + Math.cos(a) * r2, q.y + Math.sin(a) * r2); ctx.stroke(); }
      ctx.lineCap = 'butt';
    }
  },
  screen(r, g) {
    if (!this.st || this.st.fade <= 0) return;
    const ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    ctx.fillStyle = `rgba(20,12,6,${(this.st.fade / CFG.BURGER.FADE).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
  },
};
Game.ext.unshift(BurgerExt);   // first in line so the door's button and hint beat the town's own
Render.ext.push(BurgerExt);
