'use strict';
// The Bakery: City building 2 (the yellow BAKERY shop on Bus Street) can be entered. Inside is a BIG bakery of its own
// (a free rectangle far from everything, 1600 × 960 of floor), seen from above, in three parts joined by wide openings:
//   THE SHOP (bottom left, the door in its glass shop front): the bakery counter with the baker kneading dough, a bell to
//     ring, a display case of treats and a glass cake cabinet, three treats on walk-on pads (croissant, cupcake, birthday
//     cake with candles and confetti), the bread shelf on the west wall (bread you bake can go on it), the delivery desk
//     with a delivery person, and outside the glass a strip of sidewalk with the delivery bike.
//   THE KITCHEN (top left, through the wide gap in the counter): two big ovens (a brick bread oven and a cake oven), the
//     dough table, the big mixing station, the decorating table (it shows the last cake you made) and a cat asleep by
//     the ovens.
//   THE CAFÉ (right): four little tables with chairs where you sit and eat, two customers already enjoying a treat.
// Two mini games open BIG on the screen (the `screen` hook draws them; taps on the canvas are caught while one is open;
// the big button does every step too, one press at a time; no reading needed, no failure):
//   🎂 Make a cake (mixing station or decorating table): pick a flavour (chocolate, strawberry, vanilla), crack two eggs,
//     pour the flour and the flavour into the bowl, stir it round (tap, or circle with a finger), pour it into the tin,
//     bake it (a timer and a glowing oven window, the cake rises, DING), take it out, decorate it (squeeze the icing,
//     sprinkles, three candles, a strawberry or pizza topper) and Ta-da!
//   🍞 Bake bread (dough table): knead the dough (it grows), shape it (loaf, baguette or pretzel), bake it, take it out
//     golden. Ta-da!
// The chef then carries it: at a café table '🪑 Sit and eat' eats it slice by slice ("Yum!"); bread can also go on the
// shop's bread shelf; a cake can go to the delivery desk: '📦 Send it home' boxes it, the delivery person carries it out
// to the bike and rides away, and the cake waits at home on the table in the pizza rain room upstairs
// (g.s.bakery.homeCake = { flavour, decor }; js/pizzarain.js draws it and offers '🎂 Eat the cake').
// Going outside (or Take me home) with a cake in your hands sends it home; with bread, it goes on the shelf.
// The delivery bike is rideable: it waits on the City sidewalk by the bakery door ('🚲 Ride the bike', hop off anywhere).
// While the chef has it away, the delivery person walks the box instead; Take me home (or leaving the City) parks it back.
// Extension module: registered with Game.ext (unshift, so the door beats the City's own buttons) and Render.ext.
// See js/EXTENSIONS.md ("Interiors"): this map uses the free rectangle 29000..30720 × 5000..6220.
CFG.BAKERY = {
  WORLD: { x0: 29000, y0: 5000, x1: 30720, y1: 6220 },
  ROOM: { x0: 29060, y0: 5140, x1: 30660, y1: 6100 }, WALL: 26, BACK_TOP: 5020,   // the back wall (5020..5140) holds the ovens and the windows
  SIDEWALK: { y0: 6126, y1: 6220 },                                                 // outside the glass shop front (seen, not walked)
  KITCHEN: { x0: 29060, y0: 5140, x1: 30060, y1: 5600 },
  SHOP: { x0: 29060, y0: 5640, x1: 30060, y1: 6100 },
  CAFE: { x0: 30084, y0: 5140, x1: 30660, y1: 6100 },
  COUNTER: { y0: 5600, y1: 5640, a: [29060, 29420], b: [29700, 30084] },            // between the shop and the kitchen; the gap is the way in
  PART: { x0: 30060, x1: 30084, y0: 5140, y1: 5600 },                               // the half-wall between the kitchen and the café
  DOOR_OUT: { x: 5100, y: 14 },                                                     // on the City sidewalk under the BAKERY awning
  BIKE_PARK: { x: 5148, y: 26 },                                                    // the delivery bike waits on the City sidewalk by the door
  EXIT: { x: 29560, y: 6082 },                                                      // the mat inside the glass door; you arrive just above it
  // the kitchen
  OVEN_B: { x0: 29090, x1: 29290, y0: 5032, y1: 5236, win: { x: 29190, y: 5184, w: 92, h: 34 } },   // the brick bread oven
  OVEN_C: { x0: 29330, x1: 29510, y0: 5042, y1: 5236, win: { x: 29420, y: 5180, w: 84, h: 40 } },   // the steel cake oven
  CAT: { x: 29572, y: 5226 },
  MENU: { x0: 29600, y0: 5048, x1: 29728, y1: 5112 },
  JARS: { x0: 29770, y0: 5044, x1: 30040, y1: 5122 },
  DOUGH: { x0: 29120, y0: 5330, x1: 29300, y1: 5388, spot: { x: 29210, y: 5430 } },    // bake bread here
  MIX: { x0: 29540, y0: 5330, x1: 29720, y1: 5388, spot: { x: 29630, y: 5430 } },      // make a cake here...
  DECOR: { x0: 29840, y0: 5330, x1: 30020, y1: 5388, spot: { x: 29930, y: 5430 } },    // ...or here (it shows your last cake)
  SACKS: { x0: 29072, y0: 5470, x1: 29160, y1: 5560 },
  // the shop
  BAKER: { x: 29200, y: 5592 }, KNEAD: { x: 29200, y: 5614 },                        // behind the counter, kneading on its top
  BELL: { x: 29100, y: 5612, spot: { x: 29100, y: 5676 }, reach: 34 },
  CASE: { x0: 29270, y0: 5596, x1: 29410, y1: 5626 },                               // the treats case on the counter
  CABINET: { x0: 29760, y0: 5560, x1: 29990, y1: 5628 },                            // the tall glass cake cabinet on the counter
  PADS: { croissant: { x: 29200, y: 5734 }, cupcake: { x: 29290, y: 5734 }, cake: { x: 29380, y: 5734 } },
  SHELF: { x0: 29060, y0: 5760, x1: 29104, y1: 6000, spot: { x: 29146, y: 5880 }, max: 8 },
  DESK: { x0: 29820, y0: 5960, x1: 29980, y1: 5998, spot: { x: 29900, y: 6040 }, courier: { x: 29900, y: 5944 } },
  RUG: { x: 29560, y: 5860 },
  PLANTS: [{ x: 29110, y: 6062 }, { x: 30626, y: 5180 }, { x: 30626, y: 6062 }],
  // the delivery: the courier's way out of the door, and the bike on the sidewalk outside
  OUT_PATH: [[29900, 5944], [30000, 5944], [30000, 6062], [29560, 6062], [29560, 6108]],
  STREET: { door: { x: 29560, y: 6150 }, bike: { x: 29650, y: 6182 }, away: 30800 },
  // the café: tables (the chef sits on the west chair, facing the table), and two customers on east chairs
  TABLES: [{ x: 30260, y: 5340 }, { x: 30510, y: 5340 }, { x: 30260, y: 5630 }, { x: 30510, y: 5630 }, { x: 30260, y: 5920 }, { x: 30510, y: 5920 }],
  SEAT_DX: -48, SEAT_DY: 4, CUSTOMERS: [{ table: 0, food: 'cupcake' }, { table: 5, food: 'cocoa' }],
  WINDOW: { x0: 30150, y0: 5036, x1: 30570, y1: 5114 },
  COIN: { x: 29480, y: 5480 },                                                      // (the Pizza Coin hides in the kitchen)
  REACH: 34, SEAT_REACH: 40,
  CUPCAKE_TIME: 30, CANDLE_TIME: 8, WAVE_TIME: 2.4,
  CAKE_BAKE: 5, BREAD_BAKE: 4, EAT: { dur: 3.2, bites: [0.5, 1.2, 1.9, 2.6] },
  PF: { w: 360, h: 420 },                                                           // the mini games' playfield, in its own units
};
CFG.AREAS.bakery = { WORLD: CFG.BAKERY.WORLD, place: 'city' };
// the delivery bike: parked outside the bakery in the City, the chef can ride it round the streets and sidewalks
CFG.VEHICLES.deliverybike = { speed: 300, radius: 13, label: '🚲 Ride the bike', exit: '🚶 Hop off' };

const BAKERY_FLAVOURS = {
  chocolate: { name: 'Chocolate', ico: '🍫', sponge: '#8a5530', top: '#5a3420', drip: '#45281a', dollop: '#fff3e0', add: '🍫 Add the cocoa', batter: '#7a4526' },
  strawberry: { name: 'Strawberry', ico: '🍓', sponge: '#ffc8d2', top: '#ff8fab', drip: '#e75480', dollop: '#ffffff', add: '🍓 Add strawberries', batter: '#ffa8bc' },
  vanilla: { name: 'Vanilla', ico: '🍦', sponge: '#ffe7a8', top: '#fffaf0', drip: '#f3d9a4', dollop: '#ff8fab', add: '🌼 Add vanilla', batter: '#ffe4a0' },
};
const BAKERY_FLAVOUR_KEYS = ['chocolate', 'strawberry', 'vanilla'];
const BAKERY_SHAPES = [['loaf', '🍞 A loaf!'], ['baguette', '🥖 A baguette!'], ['pretzel', '🥨 A pretzel!']];
const BAKERY_TOPPERS = [['strawberry', '🍓 Strawberry on top!'], ['pizza', '🍕 Pizza on top!']];
const BAKERY_SPRINKLES = ['#e4572e', '#ffd166', '#3b7dd8', '#41b883', '#ff8fab', '#8e5bd1'];
const BAKERY_CONFETTI = ['#e4572e', '#ffd166', '#3b7dd8', '#41b883', '#ff8fab', '#8e5bd1', '#fff'];
const BAKERY_CAKE_STEPS = ['flavour', 'mix', 'stir', 'pour', 'oven', 'decorate', 'tada'];
const BAKERY_CAKE_DOTS = ['🎂', '🥚', '🥄', '🥣', '🔥', '🍦', '🎉'];
const BAKERY_BREAD_STEPS = ['knead', 'shape', 'oven', 'tada'];
const BAKERY_BREAD_DOTS = ['👐', '🥨', '🔥', '🎉'];

const BakeryExt = {
  name: 'bakery',
  defaults: { bakery: { seen: false, treats: 0, cakes: 0, breads: 0, eaten: 0, sent: 0, shelf: [], homeCake: null, lastCake: null } },
  st: null,
  build(g) {
    if (!g.s.bakery || typeof g.s.bakery !== 'object') g.s.bakery = {};
    const d = this.defaults.bakery;
    for (const k of Object.keys(d)) if (g.s.bakery[k] === undefined) g.s.bakery[k] = JSON.parse(JSON.stringify(d[k]));
    if (!Array.isArray(g.s.bakery.shelf)) g.s.bakery.shelf = [];
    this.st = { fade: 0, wave: 0, bellT: 0, rang: false, cupcake: 0, candles: 0, confetti: [], obs: this.makeObstacles(),
      game: null, carry: null, eat: null, del: null, sentT: 0, puffs: [], ptr: null, bike: this.newBike() };
  },
  ready(g) { if (!this.st) this.build(g); return this.st; },
  // ---------- the rideable delivery bike ----------
  newBike() { const P = CFG.BAKERY.BIKE_PARK; return { kind: 'deliverybike', x: P.x, y: P.y, angle: 0, vx: 0, vy: 0 }; },
  riding(g) { return !!(this.st && g.driving && g.vehicle === this.st.bike); },
  bikeHome(g) { const b = this.st.bike, P = CFG.BAKERY.BIKE_PARK; return !this.riding(g) && Math.hypot(b.x - P.x, b.y - P.y) < 6; },
  parkBike() { const b = this.st.bike, P = CFG.BAKERY.BIKE_PARK; b.x = P.x; b.y = P.y; b.angle = 0; b.vx = 0; b.vy = 0; },
  // out on a delivery with the courier (only when it was parked at home when the cake was sent)
  bikeOut() { const d = this.st.del; return !!(d && !d.walk && ['street', 'ride', 'away', 'back'].includes(d.phase)); },
  vehicles(g) { const st = this.ready(g); return this.bikeOut() ? [] : [st.bike]; },
  sv(g) { if (!g.s.bakery || !Array.isArray(g.s.bakery.shelf)) this.build(g); return g.s.bakery; },
  // on foot and not in a ride, a taxi, the Pizza Tower, a bus...
  free2go(g) {
    if (g.driving || g.onTrain || g.ride || g.travel || g.fishing) return false;
    if (typeof CityExt !== 'undefined' && (CityExt.floor || (CityExt.st && (CityExt.st.cab || CityExt.st.boarding)))) return false;
    return true;
  },
  makeObstacles() {
    const K = CFG.BAKERY, R = K.ROOM, W = K.WORLD, w = K.WALL, o = [];
    const box = (x0, y0, x1, y1) => o.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
    box(R.x0 - w, K.BACK_TOP, R.x1 + w, R.y0); box(R.x0 - w, R.y1, R.x1 + w, W.y1);   // the back wall; the shop front and the sidewalk
    box(R.x0 - w, R.y0, R.x0, R.y1); box(R.x1, R.y0, R.x1 + w, R.y1);
    const C = K.COUNTER; box(C.a[0], C.y0, C.a[1], C.y1); box(C.b[0], C.y0, C.b[1], C.y1);
    const P = K.PART; box(P.x0, P.y0, P.x1, P.y1);
    for (const O of [K.OVEN_B, K.OVEN_C]) box(O.x0, R.y0, O.x1, O.y1);
    box(K.CAT.x - 20, K.CAT.y - 14, K.CAT.x + 20, K.CAT.y + 8);
    for (const T of [K.DOUGH, K.MIX, K.DECOR]) box(T.x0, T.y0 - 8, T.x1, T.y1);
    box(K.SACKS.x0, K.SACKS.y0, K.SACKS.x1, K.SACKS.y1);
    box(K.BAKER.x - 18, K.BAKER.y - 30, K.BAKER.x + 18, C.y0);
    box(K.SHELF.x0, K.SHELF.y0, K.SHELF.x1, K.SHELF.y1);
    box(K.DESK.x0, K.DESK.y0, K.DESK.x1, K.DESK.y1);
    for (const T of K.TABLES) box(T.x - 32, T.y - 20, T.x + 32, T.y + 14);
    for (const c of K.CUSTOMERS) { const T = K.TABLES[c.table]; box(T.x + 34, T.y - 8, T.x + 62, T.y + 10); }
    for (const p of K.PLANTS) box(p.x - 16, p.y - 16, p.x + 16, p.y + 14);
    return o;
  },
  seat(i) { const K = CFG.BAKERY, T = K.TABLES[i]; return { x: T.x + K.SEAT_DX, y: T.y + K.SEAT_DY }; },
  near(g, pt, d) { return U.dist(g.player.x, g.player.y, pt.x, pt.y) < d; },
  nearSeat(g) { const K = CFG.BAKERY; for (let i = 0; i < K.TABLES.length; i++) if (this.near(g, this.seat(i), K.SEAT_REACH)) return i; return -1; },
  nearestOf(g, pts) { let best = null, bd = Infinity; for (const q of pts) { const d = U.dist(g.player.x, g.player.y, q.x, q.y); if (d < bd) { bd = d; best = q; } } return best; },
  seats() { return CFG.BAKERY.TABLES.map((_, i) => this.seat(i)); },
  // what the chef holds that can be eaten at a table: the cake or bread from the kitchen, or the cupcake from the pad
  food() { const st = this.st; if (st.carry) return st.carry; if (st.cupcake > 0) return { kind: 'cupcake' }; return null; },
  courierHome() { const d = this.st.del; return !d; },

  // ---------- game hooks ----------
  obstacles(g) { return g.area === 'bakery' ? this.ready(g).obs : []; },
  atDoor(g) { const D = CFG.BAKERY.DOOR_OUT; return g.area === 'city' && this.free2go(g) && U.dist(g.player.x, g.player.y, D.x, D.y) < 30; },
  action(g) {
    const st = this.ready(g), p = g.player, K = CFG.BAKERY;
    if (this.atDoor(g)) return { label: '🚪 Go inside', run: (gg) => this.enter(gg) };
    if (g.area !== 'bakery' || !this.free2go(g)) return null;
    if (st.game) return this.gameAction(g);
    if (st.eat) return null;
    if (this.near(g, K.EXIT, 30)) return { label: '🚪 Go outside', run: (gg) => this.leave(gg) };
    const food = this.food();
    if (food) {
      const i = this.nearSeat(g);
      if (i >= 0) return { label: '🪑 Sit and eat', run: (gg) => this.sitAndEat(gg, i) };
      if (food.kind === 'cake' && this.near(g, K.DESK.spot, K.REACH) && this.courierHome()) return { label: '📦 Send it home', run: (gg) => this.sendHome(gg) };
      if (food.kind === 'bread' && this.near(g, K.SHELF.spot, K.REACH)) return { label: '🧺 Put it on the shelf', run: (gg) => this.shelve(gg) };
      if (st.carry) return null;   // hands full: no new baking until it is eaten, sent or shelved
    }
    if (this.near(g, K.MIX.spot, K.REACH) || this.near(g, K.DECOR.spot, K.REACH)) return { label: '🎂 Make a cake', run: (gg) => this.openGame(gg, 'cake') };
    if (this.near(g, K.DOUGH.spot, K.REACH)) return { label: '🍞 Bake bread', run: (gg) => this.openGame(gg, 'bread') };
    if (this.near(g, K.BELL.spot, K.BELL.reach)) return { label: '🔔 Ring the bell', run: (gg) => this.ringBell(gg) };
    return null;
  },
  enter(g) {
    const K = CFG.BAKERY, p = g.player, st = this.ready(g), s = this.sv(g);
    g.area = 'bakery'; p.x = K.EXIT.x; p.y = K.EXIT.y - 8; p.moving = false; p.facing = -1; p.hasMoved = true; g.cameraSnap = true;
    st.fade = 0.45; Sfx.ding(); Haptics.tap();
    if (!s.seen) { s.seen = true; g.toast('🥐 Welcome to the Bakery!', true); }
  },
  leave(g) {
    const K = CFG.BAKERY, p = g.player, st = this.ready(g);
    this.putAway(g);
    g.area = 'city'; p.x = K.DOOR_OUT.x; p.y = K.DOOR_OUT.y; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    st.fade = 0.45; st.candles = 0; st.confetti = []; Sfx.drop();
  },
  // leaving with something in your hands: a cake is sent home, bread goes on the shelf (nothing is ever lost)
  putAway(g) {
    const st = this.st, s = this.sv(g);
    st.game = null; st.eat = null; st.ptr = null;
    if (st.carry) {
      if (st.carry.kind === 'cake') { s.homeCake = this.cakeCopy(st.carry.cake); s.sent = (s.sent || 0) + 1; }
      else if (st.carry.kind === 'bread') this.addToShelf(g, st.carry.shape);
      st.carry = null;
    }
  },
  ringBell(g) {
    const st = this.ready(g), K = CFG.BAKERY;
    st.wave = K.WAVE_TIME; st.bellT = 0.7; st.rang = true;
    g.floats.push({ x: K.BELL.x, y: K.BELL.y - 30, text: 'Ding!', color: '#ffe08a', t: 0, dur: 0.9, big: true });
    Sfx.ding(); Haptics.tap();
  },
  // the core's Take-me-home button: close any game, put away what the chef holds, drop everything else (the core moves the chef)
  home(g) {
    const st = this.ready(g);
    this.putAway(g);
    st.fade = 0; st.wave = 0; st.bellT = 0; st.cupcake = 0; st.candles = 0; st.confetti = []; st.del = null; st.sentT = 0; st.puffs = [];
    this.parkBike();
  },
  // Is this a spot the chef can stand on: inside the room and not in a wall or a piece of furniture?
  free(x, y) {
    const R = CFG.BAKERY.ROOM, r = 12;
    if (x < R.x0 + r || x > R.x1 - r || y < R.y0 + r || y > R.y1 - r) return false;
    for (const o of this.ready(Game).obs) if (x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h) return false;
    return true;
  },
  rescue(g) {
    const p = g.player, K = CFG.BAKERY;
    if (this.free(p.x, p.y)) return false;
    p.x = K.EXIT.x; p.y = K.EXIT.y - 8; p.moving = false; g.cameraSnap = true;
    g.floats.push({ x: p.x, y: p.y - 50, text: 'Oops! Back inside', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    return true;
  },
  update(g, dt) {
    const st = this.ready(g);
    st.fade = Math.max(0, st.fade - dt);
    st.wave = Math.max(0, st.wave - dt); st.bellT = Math.max(0, st.bellT - dt);
    st.cupcake = Math.max(0, st.cupcake - dt); st.candles = Math.max(0, st.candles - dt); st.sentT = Math.max(0, st.sentT - dt);
    if (st.confetti.length) {
      for (const c of st.confetti) { c.t += dt; c.x += c.vx * dt; c.y += c.vy * dt; c.vy += 260 * dt; c.vx *= 0.985; c.rot += c.vr * dt; }
      st.confetti = st.confetti.filter((c) => c.t < c.dur);
    }
    if (g.area !== 'bakery') {
      if (st.game || st.eat || st.carry) this.putAway(g);   // (left some other way: nothing is lost)
      st.del = null;                                        // a delivery under way finishes while you are out
      if (g.area !== 'city' && !this.riding(g) && !this.bikeHome(g)) this.parkBike();   // left the City: the bike rides itself home
      return;
    }
    const p = g.player;
    if (st.game) {
      p.x = st.game.hold.x; p.y = st.game.hold.y; p.moving = false; p.facing = -1;
      this.stepGame(g, st.game, dt);
    } else if (st.eat) {
      const S = this.seat(st.eat.table); p.x = S.x; p.y = S.y; p.moving = false; p.facing = 1;
      this.updateEat(g, dt);
    } else this.rescue(g);
    this.updateDelivery(g, dt);
    for (const q of st.puffs) { q.t += dt; q.y -= 18 * dt; }
    st.puffs = st.puffs.filter((q) => q.t < q.dur);
  },
  hint(g) {
    const st = this.ready(g), p = g.player, K = CFG.BAKERY, s = this.sv(g);
    if (g.area === 'city' && this.riding(g) && !g.travel) return { text: 'Ring ring! 🚲 Ride round the City, hop off anywhere', target: null };
    if (!this.free2go(g)) return undefined;
    if (g.area === 'city') {
      const d = U.dist(p.x, p.y, K.DOOR_OUT.x, K.DOOR_OUT.y);
      if (d > 70) return undefined;
      return { text: 'Go inside the bakery 🥐', target: d < 30 ? null : K.DOOR_OUT };
    }
    if (g.area !== 'bakery') return undefined;
    if (st.game) return null;   // the game shows its own pictures
    if (st.eat) return { text: 'Yum yum! 😋', target: null };
    if (st.sentT > 0) return { text: 'Your cake is going home! It will wait on the table upstairs in the pizza room 🏠', target: null };
    const food = this.food();
    if (food && food.kind !== 'cupcake') {
      if (this.nearSeat(g) >= 0) return { text: food.kind === 'cake' ? 'Sit and eat your cake! 🪑' : 'Sit and eat your bread! 🪑', target: null };
      if (food.kind === 'cake') {
        if (this.near(g, K.DESK.spot, K.REACH)) return { text: this.courierHome() ? 'Send your cake home! 📦' : 'The bike is coming back! 🚲', target: null };
        return { text: 'Eat it at a café table 🪑 or send it home 📦', target: this.nearestOf(g, this.seats().concat([K.DESK.spot])) };
      }
      if (this.near(g, K.SHELF.spot, K.REACH)) return { text: 'Put your bread on the shelf! 🧺', target: null };
      return { text: 'Eat it at a café table 🪑 or put it on the shelf 🧺', target: this.nearestOf(g, this.seats().concat([K.SHELF.spot])) };
    }
    if (st.wave > 0) return { text: 'The baker says hello! 👋', target: null };
    if (st.candles > 0) return { text: 'Happy day! Make a wish 🎂', target: null };
    if (this.near(g, K.MIX.spot, K.REACH) || this.near(g, K.DECOR.spot, K.REACH)) return { text: 'Make a cake! 🎂', target: null };
    if (this.near(g, K.DOUGH.spot, K.REACH)) return { text: 'Bake some bread! 🍞', target: null };
    if (this.near(g, K.BELL.spot, K.BELL.reach)) return { text: 'Press the button to ring the bell 🔔', target: null };
    if (U.dist(p.x, p.y, K.CAT.x, K.CAT.y) < 70) return { text: 'Shh… the cat is sleeping by the warm oven 🐱', target: null };
    if (st.cupcake > 0) return { text: 'Yum! Eat your cupcake at a café table 🧁', target: this.nearSeat(g) >= 0 ? null : this.nearestOf(g, this.seats()) };
    if (!s.cakes) return { text: 'Make a cake in the kitchen! 🎂', target: K.MIX.spot };
    if (!s.breads) return { text: 'Bake bread at the dough table! 🍞', target: K.DOUGH.spot };
    if (this.near(g, K.EXIT, 30)) return { text: 'Press the button to go outside', target: null };
    return { text: 'Mmm, it smells like fresh bread! 🍞', target: null };
  },
  pads(g) {
    if (g.area !== 'bakery' || !this.st || this.st.game || this.st.eat) return [];
    const P = CFG.BAKERY.PADS;
    return [
      { key: 'bakeryCroissant', label: 'Croissant', ico: '🥐', pos: P.croissant, price: 3, sub: 'warm & flaky' },
      { key: 'bakeryCupcake', label: 'Cupcake', ico: '🧁', pos: P.cupcake, price: 5, sub: 'just for you' },
      { key: 'bakeryCake', label: 'Birthday cake', ico: '🎂', pos: P.cake, price: 12, sub: 'with candles!' },
    ];
  },
  onPad(g, pad) {
    const st = this.ready(g), p = g.player, K = CFG.BAKERY, s = this.sv(g);
    s.treats = (s.treats || 0) + 1;
    if (pad.key === 'bakeryCroissant') {
      g.floats.push({ x: p.x, y: p.y - 60, text: 'Mmm, buttery!', color: '#ffe08a', t: 0, dur: 1.5, big: true });
      for (let i = 0; i < 4; i++) g.fx.push({ kind: 'sparkle', x0: p.x + U.rand(-18, 18), y0: p.y - 30 + U.rand(-16, 16), x1: 0, y1: 0, t: -i * 0.08, dur: 0.5 });
    } else if (pad.key === 'bakeryCupcake') {
      st.cupcake = K.CUPCAKE_TIME;
      g.floats.push({ x: p.x, y: p.y - 60, text: 'A cupcake for you! 🧁', color: '#ffe08a', t: 0, dur: 1.5, big: true });
    } else if (pad.key === 'bakeryCake') {
      st.candles = K.CANDLE_TIME;
      const C = K.CABINET, cx = (C.x0 + C.x1) / 2, cy = C.y0 + 10;
      for (let i = 0; i < 46; i++) { const a = -Math.PI / 2 + U.rand(-1.1, 1.1), sp = U.rand(90, 230); st.confetti.push({ x: cx + U.rand(-10, 10), y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, col: BAKERY_CONFETTI[i % 6], t: 0, dur: U.rand(1.1, 1.8), rot: U.rand(0, 6.3), vr: U.rand(-9, 9) }); }
      g.floats.push({ x: p.x, y: p.y - 60, text: 'Happy day! 🎉', color: '#ffe08a', t: 0, dur: 1.8, big: true });
    }
    Haptics.success();
  },

  // ======================= carrying, eating, the shelf, the delivery =======================
  cakeCopy(c) { return { flavour: c.flavour, decor: { icing: c.decor.icing, sprinkles: !!c.decor.sprinkles, candles: c.decor.candles, topper: c.decor.topper } }; },
  addToShelf(g, shape) { const s = this.sv(g), K = CFG.BAKERY; s.shelf.push(shape); while (s.shelf.length > K.SHELF.max) s.shelf.shift(); },
  sitAndEat(g, i) {
    const st = this.st, p = g.player, S = this.seat(i), food = this.food();
    if (!food || st.eat) return;
    st.eat = { kind: food.kind, item: food, table: i, t: 0, bites: 0, chomp: 0 };
    if (food.kind === 'cupcake') st.cupcake = 0; else st.carry = null;
    p.x = S.x; p.y = S.y; p.moving = false; p.facing = 1;
    Sfx.pickup(); Haptics.tap();
  },
  updateEat(g, dt) {
    const st = this.st, e = st.eat, E = CFG.BAKERY.EAT, p = g.player;
    e.t += dt; e.chomp = Math.max(0, e.chomp - dt);
    while (e.bites < E.bites.length && e.t >= E.bites[e.bites]) {
      e.bites++; e.chomp = 0.3;
      g.floats.push({ x: p.x + U.rand(-6, 6), y: p.y - 66, text: 'Yum!', color: '#fff', t: 0, dur: 0.9, big: false });
    }
    if (e.t >= E.dur) {
      const s = this.sv(g); s.eaten = (s.eaten || 0) + 1;
      st.eat = null;
      g.floats.push({ x: p.x, y: p.y - 80, text: 'Delicious! 😋', color: '#ffe08a', t: 0, dur: 1.8, big: true });
      g.fx.push({ kind: 'sparkle', x0: p.x, y0: p.y - 36, x1: p.x, y1: p.y - 36, t: 0, dur: 0.6 });
      Haptics.success();
    }
  },
  eatLeft() { const e = this.st && this.st.eat; return e ? 1 - e.bites / CFG.BAKERY.EAT.bites.length : 1; },
  shelve(g) {
    const st = this.st, p = g.player;
    if (!st.carry || st.carry.kind !== 'bread') return;
    this.addToShelf(g, st.carry.shape); st.carry = null;
    g.floats.push({ x: p.x, y: p.y - 70, text: 'On the shelf! 🧺', color: '#ffe08a', t: 0, dur: 1.5, big: true });
    Sfx.drop(); Haptics.tap();
  },
  // the cake goes on the desk, is boxed, and the delivery person carries it out to the bike and rides off
  sendHome(g) {
    const st = this.st, s = this.sv(g), p = g.player, K = CFG.BAKERY, C = K.DESK.courier;
    if (!st.carry || st.carry.kind !== 'cake' || st.del) return;
    s.homeCake = this.cakeCopy(st.carry.cake); s.sent = (s.sent || 0) + 1;
    st.del = { phase: 'box', t: 0, x: C.x, y: C.y, wp: 0, facing: 1, moving: false, bob: 0, cake: st.carry.cake, bike: false, walk: !this.bikeHome(g) };   // walk: the chef has the bike away
    st.carry = null; st.sentT = 7;
    g.floats.push({ x: p.x, y: p.y - 70, text: '📦 Off it goes!', color: '#ffe08a', t: 0, dur: 1.6, big: true });
    Sfx.drop(); Haptics.success();
  },
  updateDelivery(g, dt) {
    const st = this.st, d = st.del, K = CFG.BAKERY, P = K.OUT_PATH, S = K.STREET;
    if (!d) return;
    d.t += dt;
    const walk = (x, y, sp) => { d.moving = true; d.bob += dt * 12; if (Math.abs(x - d.x) > 1) d.facing = x < d.x ? -1 : 1; return U.moveToward(d, x, y, sp || 130, dt); };
    switch (d.phase) {
      case 'box': d.moving = false; if (d.t >= 0.9) { d.phase = 'out'; d.wp = 1; d.t = 0; } break;
      case 'out': if (walk(P[d.wp][0], P[d.wp][1])) { d.wp++; if (d.wp >= P.length) { d.phase = 'street'; d.t = 0; d.x = S.door.x; d.y = S.door.y; } } break;
      case 'street':   // to the bike (or, with the bike away, straight off along the sidewalk on foot)
        if (d.walk) { d.phase = 'ride'; d.t = 0; break; }
        if (walk(S.bike.x - 18, S.bike.y)) { d.phase = 'ride'; d.t = 0; d.bike = true; d.x = S.bike.x; d.y = S.bike.y; d.facing = 1; } break;
      case 'ride': d.moving = true; d.bob += dt * (d.walk ? 12 : 10); d.facing = 1; d.x += (d.walk ? 150 : Math.min(220, 60 + d.t * 160)) * dt; if (d.x > S.away) { d.phase = 'away'; d.t = 0; } break;
      case 'away': if (d.t >= 2) { d.phase = 'back'; d.t = 0; d.cake = null; d.x = S.away; } break;
      case 'back': {
        const stop = d.walk ? S.door.x : S.bike.x;
        d.moving = true; d.bob += dt * 10; d.facing = -1; d.x -= (d.walk ? 150 : 200) * dt;
        if (d.x <= stop) { d.phase = 'park'; d.t = 0; d.bike = false; d.x = d.walk ? stop : S.bike.x - 18; }
        break;
      }
      case 'park': if (walk(S.door.x, S.door.y)) { d.phase = 'in'; d.t = 0; d.x = P[P.length - 1][0]; d.y = P[P.length - 1][1]; d.wp = P.length - 2; } break;
      case 'in': if (walk(P[d.wp][0], P[d.wp][1])) { d.wp--; if (d.wp < 0) { st.del = null; } } break;
    }
  },
  // where the delivery person is drawn: inside the shop, or outside on the sidewalk
  courierPos() {
    const d = this.st.del, C = CFG.BAKERY.DESK.courier;
    if (!d) return { x: C.x, y: C.y, facing: 1, moving: false, bob: 0, phase: 'wait' };
    return d;
  },

  // ======================= the mini games =======================
  openGame(g, kind) {
    const st = this.st, K = CFG.BAKERY, p = g.player;
    if (st.game || st.carry) return;
    const spot = kind === 'bread' ? K.DOUGH.spot : (this.near(g, K.DECOR.spot, K.REACH) ? K.DECOR.spot : K.MIX.spot);
    const G = { kind, stage: kind === 'cake' ? 'flavour' : 'knead', t: 0, hold: { x: spot.x, y: spot.y }, lit: 0, litT: 0, sparks: [], texts: [], conf: [], taps: [] };
    if (kind === 'cake') Object.assign(G, { cake: { flavour: null, decor: { icing: 0, sprinkles: false, candles: 0, topper: null } }, adds: 0, fly: null, stir: 0, ang: 0, spin: 0, pour: 0, pouring: false, bake: 0, baking: false, baked: false, dec: 'icing', fall: [], acc: 0 });
    else Object.assign(G, { kneads: 0, squash: 0, shape: null, morph: 0, bake: 0, baking: false, baked: false });
    st.game = G;
    p.x = spot.x; p.y = spot.y; p.moving = false;
    Sfx.pickup(); Haptics.tap();
  },
  closeGame(g) { this.st.game = null; this.st.ptr = null; },
  // the finished cake or bread: into the chef's hands
  finishGame(g) {
    const st = this.st, G = st.game, s = this.sv(g), p = g.player;
    if (!G || G.stage !== 'tada') return;
    if (G.kind === 'cake') {
      const cake = this.cakeCopy(G.cake);
      st.carry = { kind: 'cake', cake }; s.cakes = (s.cakes || 0) + 1; s.lastCake = this.cakeCopy(cake);
      g.floats.push({ x: p.x, y: p.y - 76, text: 'My cake! 🎂', color: '#ffe08a', t: 0, dur: 1.6, big: true });
    } else {
      st.carry = { kind: 'bread', shape: G.shape }; s.breads = (s.breads || 0) + 1;
      g.floats.push({ x: p.x, y: p.y - 76, text: 'Fresh bread! 🍞', color: '#ffe08a', t: 0, dur: 1.6, big: true });
    }
    st.game = null; st.ptr = null;
    // step out from the station onto the open floor
    p.y += 10; p.moving = false; p.facing = 1;
    Sfx.pickup(); Haptics.success();
  },
  next(G, stage) { G.stage = stage; G.t = 0; G.lit = 0; G.litT = 0; Sfx.buy(); Haptics.tap(); },
  pf() { return CFG.BAKERY.PF; },
  spark(G, x, y, n, cols) { for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + Math.random(), sp = U.rand(60, 170); G.sparks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, dur: U.rand(0.4, 0.7), s: U.rand(4, 8), col: U.pick(cols || BAKERY_CONFETTI) }); } },
  say(G, x, y, text, col) { G.texts.push({ x, y, text, col: col || '#ffe08a', t: 0, dur: 0.9 }); },
  tada(G) {
    this.next(G, 'tada'); Sfx.unlock(); Haptics.success();
    const PF = this.pf();
    for (let i = 0; i < 50; i++) G.conf.push({ x: U.rand(0, PF.w), y: U.rand(-PF.h * 0.7, 0), vy: U.rand(90, 170), t: 0, ph: U.rand(0, 6), col: U.pick(BAKERY_CONFETTI), s: U.rand(4, 8) });
  },
  // the bowls of flavours, the shapes and the toppers: the lit one moves along every 0.9 s
  choices(G) {
    if (G.kind === 'cake' && G.stage === 'flavour') return BAKERY_FLAVOUR_KEYS.map((k, i) => ({ key: k, x: 70 + i * 110, y: 250, r: 48 }));
    if (G.kind === 'cake' && G.stage === 'decorate' && G.dec === 'topper') return BAKERY_TOPPERS.map(([k], i) => ({ key: k, x: i ? 300 : 60, y: 160, r: 44 }));
    if (G.kind === 'bread' && G.stage === 'shape' && !G.shape) return BAKERY_SHAPES.map(([k], i) => ({ key: k, x: 70 + i * 110, y: 330, r: 48 }));
    return null;
  },
  pick(g, G, key) {
    const PF = this.pf();
    if (G.kind === 'cake' && G.stage === 'flavour') { G.cake.flavour = key; this.spark(G, 70 + BAKERY_FLAVOUR_KEYS.indexOf(key) * 110, 250, 14); this.next(G, 'mix'); }
    else if (G.kind === 'cake' && G.dec === 'topper') { G.cake.decor.topper = key; this.spark(G, PF.w / 2, 230, 16); Sfx.ding(); this.tada(G); }
    else if (G.kind === 'bread') { G.shape = key; G.morph = 0; this.spark(G, PF.w / 2, 200, 14); Sfx.pickup(); }
  },
  // the label of the big button for this step
  gameAction(g) {
    const G = this.st.game, run = (fn) => ({ run: () => fn() });
    const lbl = (label, fn) => Object.assign({ label }, run(fn || (() => this.press(g, G))));
    const ch = this.choices(G);
    if (ch) {
      const k = ch[G.lit % ch.length].key;
      if (G.stage === 'flavour') { const F = BAKERY_FLAVOURS[k]; return lbl(`${F.ico} ${F.name}!`); }
      if (G.kind === 'bread') return lbl(BAKERY_SHAPES.find((q) => q[0] === k)[1]);
      return lbl(BAKERY_TOPPERS.find((q) => q[0] === k)[1]);
    }
    if (G.kind === 'cake') {
      switch (G.stage) {
        case 'mix': { const F = BAKERY_FLAVOURS[G.cake.flavour], n = G.adds + (G.fly ? 1 : 0); return lbl(n < 2 ? '🥚 Crack an egg' : n < 3 ? '🌾 Pour the flour' : F.add); }
        case 'stir': return lbl('🥄 Stir!');
        case 'pour': return lbl('🥣 Pour it in the tin');
        case 'oven': return lbl(G.baked ? '🧤 Take it out!' : G.baking ? '⏳ Baking…' : '🔥 Put it in the oven');
        case 'decorate': return lbl(G.dec === 'icing' ? '🍦 Squeeze the icing' : G.dec === 'sprinkles' ? '✨ Add sprinkles' : '🕯️ Add a candle');
        case 'tada': return lbl('🎂 Carry the cake', () => this.finishGame(g));
      }
    } else {
      switch (G.stage) {
        case 'knead': return lbl('👐 Knead the dough');
        case 'shape': return lbl('⏳ Shaping…');
        case 'oven': return lbl(G.baked ? '🧤 Take it out!' : G.baking ? '⏳ Baking…' : '🔥 Put it in the oven');
        case 'tada': return lbl('🍞 Carry the bread', () => this.finishGame(g));
      }
    }
    return null;
  },
  // one press of the big button (or a tap on the playfield): the next bit of the step
  press(g, G) {
    const PF = this.pf(), ch = this.choices(G);
    if (ch) { this.pick(g, G, ch[G.lit % ch.length].key); return; }
    if (G.stage === 'tada') { this.finishGame(g); return; }
    if (G.stage === 'oven') {
      if (!G.baking && !G.baked) { G.baking = true; G.bake = 0; Sfx.drop(); Haptics.tap(); }
      else if (G.baked) { G.baking = false; this.spark(G, PF.w / 2, 250, 16, ['#ffd166', '#fff3b0', '#ff9f1c']); Sfx.pickup(); if (G.kind === 'cake') this.next(G, 'decorate'); else this.tada(G); }
      return;
    }
    if (G.kind === 'cake') {
      if (G.stage === 'mix') {
        if (G.fly) this.landFly(G);
        if (G.stage === 'mix' && G.adds < 4) { G.fly = { i: G.adds, t: 0 }; Sfx.pickup(); }
      } else if (G.stage === 'stir') this.stirOnce(G);
      else if (G.stage === 'pour') { if (!G.pouring) { G.pouring = true; G.pour = 0; Sfx.drop(); } }
      else if (G.stage === 'decorate') {
        const D = G.cake.decor;
        if (G.dec === 'icing') { D.icing++; this.say(G, PF.w / 2 + U.rand(-50, 50), 210, 'squeeze!', '#fff'); Sfx.drop(); Haptics.tap(); if (D.icing >= 4) { G.dec = 'sprinkles'; G.t = 0; } }
        else if (G.dec === 'sprinkles') {
          if (!G.fall.length && !D.sprinkles) { for (let i = 0; i < 60; i++) G.fall.push({ x: PF.w / 2 + U.rand(-70, 70), y: U.rand(60, 150), vy: U.rand(160, 260), col: BAKERY_SPRINKLES[i % 6], a: U.rand(0, 3), t: 0 }); Sfx.pickup(); }
        } else if (G.dec === 'candles') { D.candles++; Sfx.ding(); Haptics.tap(); this.spark(G, PF.w / 2 + (D.candles - 2) * 40, 190, 8, ['#ffd166', '#ff9f1c']); if (D.candles >= 3) { G.dec = 'topper'; G.t = 0; G.lit = 0; G.litT = 0; } }
      }
    } else if (G.stage === 'knead') {
      G.kneads++; G.squash = 1; Sfx.drop(); Haptics.tap();
      for (let i = 0; i < 5; i++) G.sparks.push({ x: PF.w / 2 + U.rand(-60, 60), y: 270 + U.rand(-10, 20), vx: U.rand(-40, 40), vy: U.rand(-90, -40), t: 0, dur: 0.6, s: U.rand(5, 9), col: '#fff' });
      if (G.kneads >= 6) { this.say(G, PF.w / 2, 160, 'So big!', '#ffe08a'); this.next(G, 'shape'); }
    }
  },
  landFly(G) {
    const F = G.fly; if (!F) return;
    G.fly = null; G.adds++;
    const PF = this.pf();
    this.say(G, PF.w / 2, 230, F.i < 2 ? 'crack!' : F.i < 3 ? 'poof!' : 'plop!', '#fff');
    this.spark(G, PF.w / 2, 280, 6, F.i < 2 ? ['#ffd166', '#fff'] : ['#fff', '#f6e7cf']);
    Haptics.tap();
    if (G.adds >= 4) this.next(G, 'stir');
  },
  stirOnce(G) { G.stir++; G.spin = 0.3; Sfx.drop(); Haptics.tap(); if (G.stir >= 8) { this.say(G, this.pf().w / 2, 200, 'Smooth!', '#ffe08a'); this.next(G, 'pour'); } },
  stepGame(g, G, dt) {
    G.t += dt;
    for (const s of G.sparks) { s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 80 * dt; }
    G.sparks = G.sparks.filter((s) => s.t < s.dur);
    for (const x of G.texts) x.t += dt;
    G.texts = G.texts.filter((x) => x.t < x.dur);
    for (const q of G.taps) q.t += dt;
    G.taps = G.taps.filter((q) => q.t < 0.4);
    for (const c of G.conf) { c.t += dt; c.y += c.vy * dt; c.x += Math.sin(c.t * 3 + c.ph) * 20 * dt; }
    if (this.choices(G)) { G.litT += dt; if (G.litT >= 0.9) { G.litT = 0; G.lit++; } }
    const K = CFG.BAKERY;
    if (G.stage === 'oven' && G.baking && !G.baked) {
      G.bake += dt;
      if (G.bake >= (G.kind === 'cake' ? K.CAKE_BAKE : K.BREAD_BAKE)) { G.baked = true; Sfx.ding(); Haptics.success(); }
    }
    if (G.kind === 'cake') {
      if (G.fly) { G.fly.t += dt; if (G.fly.t >= 0.45) this.landFly(G); }
      G.spin = Math.max(0, G.spin - dt); G.ang += (G.spin > 0 ? 6 : 0.6) * dt;
      if (G.pouring) { G.pour = Math.min(1, G.pour + dt / 0.9); if (G.pour >= 1) { G.pouring = false; this.next(G, 'oven'); } }
      if (G.fall.length) {
        let done = true;
        for (const f of G.fall) { f.t += dt; if (f.y < 262) { f.y += f.vy * dt; done = false; } }
        if (done) { G.fall = []; G.cake.decor.sprinkles = true; this.spark(G, this.pf().w / 2, 240, 10); G.dec = 'candles'; G.t = 0; }
      }
    } else {
      G.squash = Math.max(0, G.squash - dt * 4);
      if (G.stage === 'shape' && G.shape) { G.morph = Math.min(1, G.morph + dt / 0.7); if (G.morph >= 1) this.next(G, 'oven'); }
    }
  },
  // the playfield's frame on the screen (in CSS px): a card between the HUD and the big button
  layout(W, H) {
    const PF = CFG.BAKERY.PF, FW = PF.w + 40, FH = PF.h + 130, top = 56, bottom = 92;
    const s = Math.min((W - 16) / FW, (H - top - bottom) / FH);
    return { s, ox: (W - FW * s) / 2, oy: top + (H - top - bottom - FH * s) / 2, FW, FH };
  },
  toPF(sx, sy) { const r = Render, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr, L = this.layout(W, H); return { x: (sx - L.ox) / L.s, y: (sy - L.oy) / L.s, L }; },
  // a tap on the canvas while a game is open: the ✖ closes it, a choice picks it, anywhere else is one press
  screenTap(g, sx, sy) {
    const G = this.st && this.st.game; if (!G) return;
    const q = this.toPF(sx, sy), L = q.L;
    if (Math.hypot(q.x - (L.FW - 26), q.y - 26) < 24) { this.closeGame(g); return; }
    const x = q.x - 20, y = q.y - 64, PF = this.pf();
    if (x < 0 || y < 0 || x > PF.w || y > PF.h) return;
    G.taps.push({ x, y, t: 0 });
    this.st.ptr = { x, y, a: null };
    const ch = this.choices(G);
    if (ch) { const c = ch.find((o) => Math.hypot(x - o.x, y - o.y) < o.r + 12); if (c) { this.pick(g, G, c.key); return; } }
    if (G.stage === 'oven' && G.baking && !G.baked) return;
    if (G.kind === 'cake' && G.stage === 'stir') { this.st.ptr.a = Math.atan2(y - 300, x - PF.w / 2); }
    this.press(g, G);
  },
  // circling a finger round the bowl stirs too: every quarter turn counts
  screenDrag(g, sx, sy) {
    const G = this.st && this.st.game, P = this.st.ptr; if (!G || !P || G.kind !== 'cake' || G.stage !== 'stir') return;
    const q = this.toPF(sx, sy), x = q.x - 20, y = q.y - 64, a = Math.atan2(y - 300, x - this.pf().w / 2);
    if (P.a !== null) { let d = a - P.a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; G.acc += Math.abs(d); G.ang += d; if (G.acc >= Math.PI / 2) { G.acc = 0; this.stirOnce(G); } }
    P.a = a;
  },
  // playfield units to page (client) coordinates, for tests
  toClient(px, py) {
    const r = Render, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr, L = this.layout(W, H), rect = r.canvas.getBoundingClientRect();
    return { x: rect.left + L.ox + (px + 20) * L.s, y: rect.top + L.oy + (py + 64) * L.s };
  },

  // ======================= drawing the treats (world, hands, tables, the games) =======================
  mix(a, b, k) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16), f = (sh) => Math.round(((pa >> sh) & 255) * (1 - k) + ((pb >> sh) & 255) * k);
    return `rgb(${f(16)},${f(8)},${f(0)})`;
  },
  // a cake standing with its bottom centre at (x, y); 44 × 24 at s = 1 (plus candles and topper). `left` < 1 cuts it
  // from the right, slice by slice, showing the inside. The decor can be partial (the decorating step draws it as it grows).
  drawMadeCake(ctx, x, y, s, cake, left = 1, t = 0, lit = true) {
    const F = BAKERY_FLAVOURS[cake.flavour] || BAKERY_FLAVOURS.vanilla, D = cake.decor || {}, w = 22, h = 24, ry = 7;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (left < 1) { ctx.beginPath(); ctx.rect(-w - 10, -80, (2 * w + 10) * Math.max(0.12, left) + 10, 100); ctx.clip(); }
    // the sponge: a cylinder with a cream filling stripe
    ctx.fillStyle = F.sponge; ctx.beginPath(); ctx.ellipse(0, 0, w, ry, 0, 0, Math.PI); ctx.lineTo(-w, -h); ctx.lineTo(w, -h); ctx.closePath(); ctx.fill(); ctx.fillRect(-w, -h, 2 * w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.10)'; ctx.fillRect(w - 6, -h, 6, h);
    ctx.fillStyle = '#fff8ee'; ctx.fillRect(-w, -h / 2 - 1.5, 2 * w, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(-w + 3, -h + 2, 4, h - 4);
    // the top: frosting (icing ≥ 1), drips over the edge (≥ 2), dollops at the back (≥ 3) and the front (≥ 4)
    ctx.fillStyle = D.icing >= 1 ? F.top : this.mix(F.sponge, '#ffffff', 0.18); ctx.beginPath(); ctx.ellipse(0, -h, w, ry, 0, 0, Math.PI * 2); ctx.fill();
    if (D.icing >= 2) { ctx.fillStyle = F.top; for (let i = 0; i < 7; i++) { const dx = -w + 3 + i * (2 * w - 6) / 6, dl = 4 + ((i * 5) % 3) * 2.5; ctx.beginPath(); ctx.ellipse(dx, -h + ry * Math.sqrt(Math.max(0, 1 - (dx / w) * (dx / w))), 3.2, dl, 0, 0, Math.PI * 2); ctx.fill(); } }
    const dollop = (dx, dy) => { ctx.fillStyle = F.dollop; ctx.beginPath(); ctx.arc(dx, dy, 3.4, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(dx, dy - 2.6, 2.2, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(dx - 3, dy + 1.5, 6, 1); };
    if (D.icing >= 3) for (const a of [-2.6, -1.57, -0.54]) dollop(Math.cos(a) * (w - 5), -h + Math.sin(a) * (ry - 2));
    if (D.sprinkles) for (let i = 0; i < 14; i++) { const a = i * 2.39, rr = ((i * 37) % 10) / 10 * 0.8; ctx.fillStyle = BAKERY_SPRINKLES[i % 6]; ctx.save(); ctx.translate(Math.cos(a) * (w - 6) * rr, -h + Math.sin(a) * (ry - 2) * rr); ctx.rotate(a); ctx.fillRect(-1.5, -0.6, 3, 1.2); ctx.restore(); }
    // candles at the back, the topper in the middle
    const cxs = [-12, 12, 0], cys = [-h - 1, -h - 1, -h - 4];
    for (let i = 0; i < (D.candles || 0); i++) {
      const cx = cxs[i], cy = cys[i], fl = Math.sin(t * 13 + i * 2) * 1;
      ctx.fillStyle = ['#3b7dd8', '#41b883', '#ffd166'][i]; ctx.fillRect(cx - 1.5, cy - 11, 3, 11);
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(cx - 1.5, cy - 9, 3, 1.2); ctx.fillRect(cx - 1.5, cy - 5, 3, 1.2);
      if (lit) { ctx.fillStyle = '#ff9f1c'; ctx.beginPath(); ctx.ellipse(cx, cy - 15 + fl * 0.3, 2.4, 4 + fl, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.ellipse(cx, cy - 14, 1.1, 2, 0, 0, Math.PI * 2); ctx.fill(); }
    }
    if (D.topper === 'strawberry') this.drawStrawberry(ctx, 0, -h - 6, 1.45);
    else if (D.topper === 'pizza') this.drawSliceTop(ctx, 0, -h - 9, 1.4);
    if (D.icing >= 4) for (const a of [0.54, 1.57, 2.6]) dollop(Math.cos(a) * (w - 4), -h + Math.sin(a) * (ry - 1));
    // a cut cake shows its inside at the cut
    if (left < 1) {
      const cx = -w + (2 * w + 10) * Math.max(0.12, left);
      ctx.fillStyle = this.mix(F.sponge, '#000000', 0.08); ctx.fillRect(cx - 4, -h, 4, h + 3);
      ctx.fillStyle = '#fff8ee'; ctx.fillRect(cx - 4, -h / 2 - 1.5, 4, 3);
      ctx.fillStyle = F.top; ctx.fillRect(cx - 4, -h - 2, 4, 3);
    }
    ctx.restore();
  },
  drawStrawberry(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = '#e4352e'; ctx.beginPath(); ctx.moveTo(-5, -3); ctx.quadraticCurveTo(-6, 4, 0, 7); ctx.quadraticCurveTo(6, 4, 5, -3); ctx.quadraticCurveTo(0, -6, -5, -3); ctx.fill();
    ctx.fillStyle = '#ffe08a'; for (const [dx, dy] of [[-2, 0], [2, 1], [0, 3.5], [-1, -2], [2.5, -2]]) ctx.fillRect(dx - 0.5, dy - 0.5, 1, 1);
    ctx.fillStyle = '#3f9a4a'; ctx.beginPath(); ctx.moveTo(-5, -4); ctx.lineTo(0, -2); ctx.lineTo(5, -4); ctx.lineTo(2, -6); ctx.lineTo(0, -8); ctx.lineTo(-2, -6); ctx.closePath(); ctx.fill();
    ctx.restore();
  },
  drawSliceTop(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = '#f6c453'; ctx.beginPath(); ctx.moveTo(0, 7); ctx.lineTo(-6, -4); ctx.quadraticCurveTo(0, -7, 6, -4); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#d98a3c'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-5.6, -4.2); ctx.quadraticCurveTo(0, -7.2, 5.6, -4.2); ctx.stroke(); ctx.lineCap = 'butt';
    ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(-1.8, -1, 1.4, 0, Math.PI * 2); ctx.arc(2, 0.5, 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },
  // a cake stand (pedestal plate) with its plate top at (x, y)
  drawStand(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(0,0,0,0.14)'; ctx.beginPath(); ctx.ellipse(2, 15, 18, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d7e3ea'; ctx.beginPath(); ctx.ellipse(0, 14, 13, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(-3, 2, 6, 12);
    ctx.fillStyle = '#eef6fa'; ctx.beginPath(); ctx.ellipse(0, 2, 30, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#b8c9d3'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(0, 2, 30, 8, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  },
  // a bread (loaf, baguette, pretzel) resting with its bottom centre at (x, y); golden 0 = raw dough, 1 = baked
  drawBread(ctx, x, y, s, shape, golden = 1, left = 1) {
    const body = this.mix('#f3e2c0', '#d98a3c', golden), hi = this.mix('#fbf1dc', '#f2c57c', golden), cut = this.mix('#e9d3a8', '#b86f2d', golden);
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (left < 1) { ctx.beginPath(); ctx.rect(-40, -40, 80 * Math.max(0.15, left), 60); ctx.clip(); }
    ctx.fillStyle = 'rgba(0,0,0,0.14)'; ctx.beginPath(); ctx.ellipse(1, 0, shape === 'baguette' ? 34 : 24, 5, 0, 0, Math.PI * 2); ctx.fill();
    if (shape === 'baguette') {
      ctx.fillStyle = body; U.roundRect(ctx, -32, -13, 64, 13, 6.5); ctx.fill();
      ctx.fillStyle = hi; U.roundRect(ctx, -28, -12, 56, 5, 2.5); ctx.fill();
      ctx.strokeStyle = cut; ctx.lineWidth = 2; ctx.lineCap = 'round'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-20 + i * 13, -4); ctx.lineTo(-13 + i * 13, -11); ctx.stroke(); }
    } else if (shape === 'pretzel') {
      ctx.strokeStyle = body; ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-6, -2); ctx.bezierCurveTo(-30, -6, -26, -30, -6, -24); ctx.bezierCurveTo(4, -20, 6, -12, 0, -6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(6, -2); ctx.bezierCurveTo(30, -6, 26, -30, 6, -24); ctx.bezierCurveTo(-4, -20, -6, -12, 0, -6); ctx.stroke();
      ctx.strokeStyle = hi; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-22, -16); ctx.quadraticCurveTo(-18, -24, -8, -23); ctx.moveTo(22, -16); ctx.quadraticCurveTo(18, -24, 8, -23); ctx.stroke();
      if (golden > 0.5) { ctx.fillStyle = '#fff'; for (const [dx, dy] of [[-18, -10], [-12, -24], [14, -11], [18, -20], [0, -5], [-4, -16], [5, -18]]) ctx.fillRect(dx - 0.8, dy - 0.8, 1.6, 1.6); }
      ctx.lineCap = 'butt';
    } else {
      ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(0, -10, 22, 11, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(-22, -10, 44, 9);
      ctx.beginPath(); ctx.ellipse(0, -1, 22, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = hi; ctx.beginPath(); ctx.ellipse(-2, -15, 15, 4.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = cut; ctx.lineWidth = 2; ctx.lineCap = 'round'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-12 + i * 10, -10); ctx.lineTo(-6 + i * 10, -18); ctx.stroke(); } ctx.lineCap = 'butt';
    }
    if (left < 1) { const cx = -40 + 80 * Math.max(0.15, left); ctx.fillStyle = '#fbf1dc'; ctx.beginPath(); ctx.ellipse(cx - 1, shape === 'baguette' ? -6.5 : -10, 2.6, shape === 'baguette' ? 6 : 9, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  },
  drawCake(ctx, x, y, s, lit, t) {   // the classic pink birthday cake (shop windows, the cabinet)
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.ellipse(0, 2, 22, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(-3, -6, 6, 8);
    ctx.fillStyle = '#ffb6c1'; U.roundRect(ctx, -20, -18, 40, 14, 4); ctx.fill(); ctx.fillStyle = '#ff8fab'; U.roundRect(ctx, -14, -28, 28, 12, 4); ctx.fill();
    ctx.fillStyle = '#fff8ee'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(-16 + i * 8, -17, 3.5, 0, Math.PI * 2); ctx.fill(); } for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(-11 + i * 7.3, -27, 3, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(0, -31, 3, 0, Math.PI * 2); ctx.fill();
    if (lit) {
      for (let i = 0; i < 3; i++) {
        const cx = -8 + i * 8, fl = Math.sin(t * 13 + i * 2) * 1.2;
        ctx.fillStyle = ['#3b7dd8', '#ffd166', '#41b883'][i]; ctx.fillRect(cx - 1.5, -40, 3, 10);
        ctx.fillStyle = '#ff9f1c'; ctx.beginPath(); ctx.ellipse(cx, -44 + fl * 0.4, 2.6, 4.5 + fl, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.ellipse(cx, -43 + fl * 0.4, 1.2, 2.2, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  },
  drawCroissant(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.strokeStyle = '#d98a3c'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 2, 7, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    ctx.strokeStyle = '#f2b134'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 2, 7, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    ctx.fillStyle = '#b86f2d'; for (const a of [1.25, 1.5, 1.75]) { ctx.beginPath(); ctx.arc(Math.cos(Math.PI * a) * 7, 2 + Math.sin(Math.PI * a) * 7, 1.2, 0, Math.PI * 2); ctx.fill(); }
    ctx.lineCap = 'butt'; ctx.restore();
  },
  drawCupcake(ctx, x, y, s, col) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(-7, -4); ctx.lineTo(7, -4); ctx.lineTo(5, 6); ctx.lineTo(-5, 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-2, -3, 2, 8); ctx.fillRect(2, -3, 2, 8);
    ctx.fillStyle = col || '#ff8fab'; ctx.beginPath(); ctx.arc(-3.5, -6, 4, 0, Math.PI * 2); ctx.arc(3.5, -6, 4, 0, Math.PI * 2); ctx.arc(0, -11, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(0, -14, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; for (let i = 0; i < 3; i++) ctx.fillRect(-4 + i * 3.5, -8 + (i % 2) * 2, 1.5, 1.5);
    ctx.restore();
  },
  // a food (what the chef carries or eats) with its bottom centre at (x, y)
  drawFood(ctx, food, x, y, s, left, t) {
    if (food.kind === 'cake') this.drawMadeCake(ctx, x, y, s, food.cake, left, t, true);
    else if (food.kind === 'bread') this.drawBread(ctx, x, y, s * 0.8, food.shape, 1, left);
    else { ctx.save(); if (left < 1) { ctx.beginPath(); ctx.rect(x - 12 * s, y - 30 * s, 24 * s * Math.max(0.2, left), 40 * s); ctx.clip(); } this.drawCupcake(ctx, x, y - 6 * s, s * 1.3, '#ff8fab'); ctx.restore(); }
  },

  // ======================= static art =======================
  paint: { bakery(r, g) { BakeryExt.paintRoom(r, g); } },
  // the BAKERY shop front in the City: treats in the two shop windows and an OPEN sign on the door
  paintAfter(r, g, area) {
    if (area !== 'city') return;
    const b = CFG.CITY.BUILDINGS[2]; if (!b) return;
    const ctx = r.ctx, cx = (b.x0 + b.x1) / 2, gy = b.y1 - 40, wy = gy + 20;
    ctx.fillStyle = '#fff8ee'; ctx.fillRect(b.x0 + 14, gy + 26, cx - 22 - b.x0 - 8, 3); ctx.fillRect(cx + 16, gy + 26, b.x1 - 10 - cx - 20, 3);
    this.drawCake(ctx, b.x0 + 10 + (cx - 22 - b.x0) / 2, wy + 5, 0.65, false, 0);
    for (let i = 0; i < 2; i++) this.drawCroissant(ctx, cx + 24 + i * 14, wy + 3, 0.7);
    for (let i = 0; i < 2; i++) this.drawCupcake(ctx, cx + 56 + i * 12, wy + 3, 0.7, ['#ff8fab', '#9fd8ff'][i]);
    ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, cx - 8, gy + 14, 16, 9, 2); ctx.fill();
    ctx.fillStyle = '#2f9e44'; ctx.font = r.font(6); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('OPEN', cx, gy + 18.5);
  },
  label(ctx, r, text, x, y, px, bg, fg, padX = 8) {
    ctx.font = r.font(px); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(text).width + padX * 2;
    ctx.fillStyle = bg; U.roundRect(ctx, x - w / 2, y - px * 0.8, w, px * 1.6, px * 0.5); ctx.fill();
    ctx.fillStyle = fg; ctx.fillText(text, x, y + 0.5);
  },
  paintRoom(r, g) {
    const ctx = r.ctx, K = CFG.BAKERY, W = K.WORLD, R = K.ROOM, wl = K.WALL, KI = K.KITCHEN, SH = K.SHOP, CA = K.CAFE;
    // outside the walls: the bakery's yellow brick, like its front in the City
    ctx.fillStyle = '#e3b142'; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    ctx.fillStyle = 'rgba(0,0,0,0.08)'; for (let y = W.y0; y < K.BACK_TOP; y += 12) for (let x = W.x0 + ((y / 12) % 2 ? 12 : 0); x < W.x1; x += 24) ctx.fillRect(x, y, 22, 10);
    for (let y = R.y0; y < R.y1; y += 12) for (const [a, b] of [[W.x0, R.x0 - wl], [R.x1 + wl, W.x1]]) for (let x = a + ((y / 12) % 2 ? 12 : 0); x < b; x += 24) ctx.fillRect(x, y, Math.min(22, b - x), 10);
    // floors: the kitchen in cool cream tiles, the shop in peach checker, the café in warm planks
    for (let y = KI.y0, j = 0; y < KI.y1; y += 36, j++) for (let x = KI.x0, i = 0; x < KI.x1; x += 36, i++) { ctx.fillStyle = (i + j) % 2 ? '#f4efe4' : '#e3ddcf'; ctx.fillRect(x, y, Math.min(36, KI.x1 - x), Math.min(36, KI.y1 - y)); }
    for (let y = SH.y0 - 40, j = 0; y < SH.y1; y += 40, j++) for (let x = SH.x0, i = 0; x < SH.x1; x += 40, i++) { ctx.fillStyle = (i + j) % 2 ? '#f3dcb8' : '#e8c79e'; ctx.fillRect(x, Math.max(y, K.COUNTER.y0), Math.min(40, SH.x1 - x), Math.min(40, SH.y1 - Math.max(y, K.COUNTER.y0))); }
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; for (let x = SH.x0; x < SH.x1; x += 40) ctx.fillRect(x, SH.y0, 2, SH.y1 - SH.y0);
    for (let y = CA.y0, row = 0; y < CA.y1; y += 20, row++) {
      ctx.fillStyle = row % 2 ? '#d9a86c' : '#d2a063'; ctx.fillRect(CA.x0 - 24, y, CA.x1 - CA.x0 + 24, Math.min(20, CA.y1 - y));
      ctx.fillStyle = 'rgba(80,40,10,0.16)'; ctx.fillRect(CA.x0 - 24, y, CA.x1 - CA.x0 + 24, 1.2);
      for (let k = 0; k < 3; k++) ctx.fillRect(CA.x0 + ((row * 97 + k * 191) % (CA.x1 - CA.x0)), y, 1.5, 20);
    }
    // the café's big rug and the shop's round rug
    ctx.fillStyle = '#9fd8c8'; U.roundRect(ctx, CA.x0 + 40, 5550, CA.x1 - CA.x0 - 80, 150, 22); ctx.fill();
    ctx.strokeStyle = '#fff8ee'; ctx.lineWidth = 3; ctx.setLineDash([10, 8]); U.roundRect(ctx, CA.x0 + 52, 5562, CA.x1 - CA.x0 - 104, 126, 16); ctx.stroke(); ctx.setLineDash([]);
    const RG = K.RUG;
    for (const [rx, ry, col] of [[110, 54, '#e8a0bf'], [86, 40, '#f4b8d0'], [56, 24, '#e8a0bf']]) { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(RG.x, RG.y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.font = r.font(22); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🥐', RG.x, RG.y);
    // the walls: side walls in wood, the back wall (kitchen: white tiles; café: striped wallpaper)
    ctx.fillStyle = '#a3612c'; ctx.fillRect(R.x0 - wl, R.y0, wl, R.y1 - R.y0); ctx.fillRect(R.x1, R.y0, wl, R.y1 - R.y0);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = R.y0; y < R.y1; y += 16) { ctx.fillRect(R.x0 - wl, y, wl, 2); ctx.fillRect(R.x1, y, wl, 2); }
    ctx.fillStyle = '#fbfbf7'; ctx.fillRect(R.x0 - wl, K.BACK_TOP, KI.x1 - R.x0 + wl + 24, R.y0 - K.BACK_TOP);
    ctx.fillStyle = 'rgba(120,150,170,0.22)'; for (let y = K.BACK_TOP; y < R.y0; y += 12) { ctx.fillRect(R.x0 - wl, y, KI.x1 - R.x0 + wl + 24, 1); for (let x = R.x0 - wl + ((y / 12) % 2 ? 12 : 0); x < KI.x1 + 24; x += 24) ctx.fillRect(x, y, 1, 12); }
    ctx.fillStyle = '#fde3ea'; ctx.fillRect(CA.x0, K.BACK_TOP, R.x1 + wl - CA.x0, R.y0 - K.BACK_TOP);
    ctx.fillStyle = 'rgba(255,143,171,0.35)'; for (let x = CA.x0; x < R.x1 + wl; x += 20) ctx.fillRect(x, K.BACK_TOP, 9, R.y0 - K.BACK_TOP);
    ctx.fillStyle = '#a3612c'; ctx.fillRect(R.x0 - wl, R.y0 - 10, R.x1 - R.x0 + 2 * wl, 10); ctx.fillStyle = '#c47a3a'; ctx.fillRect(R.x0 - wl, R.y0 - 10, R.x1 - R.x0 + 2 * wl, 3);
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(R.x0 - wl, K.BACK_TOP, R.x1 - R.x0 + 2 * wl, 4);
    // the half-wall between the kitchen and the café
    const PT = K.PART;
    ctx.fillStyle = '#c47a3a'; ctx.fillRect(PT.x0, PT.y0, PT.x1 - PT.x0, PT.y1 - PT.y0); ctx.fillStyle = '#e8a254'; ctx.fillRect(PT.x0 + 3, PT.y0, PT.x1 - PT.x0 - 6, PT.y1 - PT.y0);
    for (let y = PT.y0 + 30; y < PT.y1; y += 70) { ctx.fillStyle = '#3f9a4a'; ctx.beginPath(); ctx.arc(PT.x0 + 12, y, 9, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ff8fab'; ctx.beginPath(); ctx.arc(PT.x0 + 14, y - 3, 2.5, 0, Math.PI * 2); ctx.fill(); }
    this.paintOvens(ctx, r);
    this.paintKitchenWall(ctx, r);
    this.paintWindow(ctx, r);
    this.paintTables(ctx, r);
    this.paintSacks(ctx, r);
    // the cat's mat
    ctx.fillStyle = '#b23a48'; U.roundRect(ctx, K.CAT.x - 22, K.CAT.y - 14, 44, 24, 6); ctx.fill(); ctx.fillStyle = '#d9525f'; U.roundRect(ctx, K.CAT.x - 18, K.CAT.y - 10, 36, 16, 5); ctx.fill();
    this.paintCounter(ctx, r);
    this.paintShelf(ctx, r);
    this.paintDesk(ctx, r);
    this.paintCafe(ctx, r);
    for (const P of K.PLANTS) this.paintPlant(ctx, P.x, P.y);
    this.paintFront(ctx, r);
    // signs on the floor for the three parts
    this.label(ctx, r, '👩‍🍳 KITCHEN', (K.COUNTER.a[1] + K.COUNTER.b[0]) / 2, 5560, 11, 'rgba(43,29,20,0.72)', '#ffe08a');
    this.label(ctx, r, '☕ CAFÉ', 30372, 5160, 12, '#b23a48', '#fff8ee');
  },
  paintPlant(ctx, x, y) {
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 12, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b86f2d'; U.roundRect(ctx, x - 11, y - 4, 22, 16, 4); ctx.fill();
    ctx.fillStyle = '#3f9a4a'; ctx.beginPath(); ctx.arc(x, y - 12, 12, 0, Math.PI * 2); ctx.arc(x - 9, y - 6, 8, 0, Math.PI * 2); ctx.arc(x + 9, y - 6, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff8fab'; ctx.beginPath(); ctx.arc(x + 3, y - 16, 3, 0, Math.PI * 2); ctx.fill();
  },
  // the two big ovens against the kitchen's back wall (the glow and the steam are live)
  paintOvens(ctx, r) {
    const K = CFG.BAKERY, B = K.OVEN_B, C = K.OVEN_C, R = K.ROOM;
    // the brick bread oven: a rounded dome with a chimney
    ctx.fillStyle = '#5c6670'; ctx.fillRect((B.x0 + B.x1) / 2 - 12, K.BACK_TOP, 24, 16); ctx.fillStyle = '#9aa0a8'; ctx.fillRect((B.x0 + B.x1) / 2 - 15, K.BACK_TOP, 30, 4);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(B.x0 + 6, B.y0 + 8, B.x1 - B.x0, B.y1 - B.y0);
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, B.x0, B.y0, B.x1 - B.x0, B.y1 - B.y0, 40); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.10)'; for (let y = B.y0 + 14; y < B.y1 - 10; y += 13) for (let i = 0; i < 9; i++) { const x = B.x0 + 10 + i * 21 + ((y / 13) % 2 ? 10 : 0); if (x < B.x1 - 18) ctx.fillRect(x, y, 15, 8); }
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(B.x0, B.y1 - 12, B.x1 - B.x0, 12); ctx.fillStyle = '#4a2d12'; U.roundRect(ctx, B.x0 + 8, B.y1 - 12, B.x1 - B.x0 - 16, 10, 3); ctx.fill();
    const bw = B.win;
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.ellipse(bw.x, bw.y + 6, bw.w / 2 + 12, bw.h / 2 + 16, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(bw.x - bw.w / 2 - 12, bw.y + 6, bw.w + 24, bw.h / 2 + 4);
    ctx.fillStyle = '#ff9f1c'; ctx.beginPath(); ctx.ellipse(bw.x, bw.y + 4, bw.w / 2, bw.h / 2 + 6, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(bw.x - bw.w / 2, bw.y + 4, bw.w, bw.h / 2 - 2);
    this.label(ctx, r, '🍞 BREAD OVEN', (B.x0 + B.x1) / 2, B.y0 + 30, 9, '#5b3a1a', '#ffe08a');
    for (let i = 0; i < 4; i++) this.drawBread(ctx, B.x0 + 46 + i * 36, B.y0 + 60, 0.55, i % 2 ? 'baguette' : 'loaf', 1);
    // the steel cake oven: two doors with round windows, a dial and a timer
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(C.x0 + 6, C.y0 + 8, C.x1 - C.x0, C.y1 - C.y0);
    ctx.fillStyle = '#c9ccd2'; U.roundRect(ctx, C.x0, C.y0, C.x1 - C.x0, C.y1 - C.y0, 10); ctx.fill();
    ctx.fillStyle = '#e8eaee'; U.roundRect(ctx, C.x0 + 6, C.y0 + 6, C.x1 - C.x0 - 12, 34, 6); ctx.fill();
    ctx.fillStyle = '#3f4247'; U.roundRect(ctx, C.x0 + 100, C.y0 + 12, 64, 22, 4); ctx.fill();
    for (let k = 0; k < 3; k++) { ctx.fillStyle = '#5f646b'; ctx.beginPath(); ctx.arc(C.x0 + 24 + k * 24, C.y0 + 23, 8, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#e4572e'; ctx.fillRect(C.x0 + 23 + k * 24, C.y0 + 15, 2, 7); }
    const cw = C.win;
    ctx.fillStyle = '#5f646b'; U.roundRect(ctx, cw.x - cw.w / 2 - 12, cw.y - cw.h / 2 - 12, cw.w + 24, cw.h + 24, 10); ctx.fill();
    ctx.fillStyle = '#ff9f1c'; U.roundRect(ctx, cw.x - cw.w / 2, cw.y - cw.h / 2, cw.w, cw.h, 8); ctx.fill();
    ctx.fillStyle = '#e8eaee'; ctx.fillRect(cw.x - 30, cw.y + cw.h / 2 + 4, 60, 5);
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(C.x0, C.y1 - 8, C.x1 - C.x0, 8);
    this.label(ctx, r, '🎂 CAKE OVEN', (C.x0 + C.x1) / 2, C.y0 + 56, 9, '#3b7dd8', '#fff');
  },
  // the menu board, the jars of sprinkles and the clock on the kitchen wall; the three work tables
  paintKitchenWall(ctx, r) {
    const K = CFG.BAKERY, M = K.MENU, J = K.JARS;
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, M.x0 - 4, M.y0 - 4, M.x1 - M.x0 + 8, M.y1 - M.y0 + 8, 4); ctx.fill(); ctx.fillStyle = '#2f3b33'; ctx.fillRect(M.x0, M.y0, M.x1 - M.x0, M.y1 - M.y0);
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('FRESH TODAY', (M.x0 + M.x1) / 2, M.y0 + 11);
    ctx.font = r.font(10); [['🥐', '$3'], ['🧁', '$5'], ['🎂', '$12']].forEach(([ico, pr], i) => { const x = M.x0 + 22 + i * 42; ctx.fillStyle = '#fff'; ctx.fillText(ico, x, M.y0 + 32); ctx.fillStyle = '#8ef0a0'; ctx.fillText(pr, x, M.y0 + 50); });
    // the shelf of jars: flour, sugar, sprinkles, cocoa, strawberry jam
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(J.x0, J.y0 + 34, J.x1 - J.x0, 6); ctx.fillRect(J.x0, J.y1 - 6, J.x1 - J.x0, 6);
    const jars = [['#fff', '#d9d4c7'], ['#fff8ee', '#e8d9b8'], ['#ff8fab', '#ffd166'], ['#7b4a2a', '#5a3420'], ['#e4352e', '#ff8fab'], ['#ffe08a', '#fff3b0'], ['#9fd8ff', '#3b7dd8']];
    for (let row = 0; row < 2; row++) for (let i = 0; i < 9; i++) {
      const [a, b] = jars[(i + row * 3) % jars.length], x = J.x0 + 10 + i * 30, y = row ? J.y1 - 6 : J.y0 + 34;
      ctx.fillStyle = 'rgba(200,230,240,0.85)'; U.roundRect(ctx, x, y - 26, 20, 26, 4); ctx.fill();
      ctx.fillStyle = a; ctx.fillRect(x + 2, y - 16, 16, 14); ctx.fillStyle = b; for (let k = 0; k < 4; k++) ctx.fillRect(x + 4 + k * 3.5, y - 13 + (k % 2) * 5, 2, 2);
      ctx.fillStyle = ['#e4572e', '#3b7dd8', '#41b883'][(i + row) % 3]; ctx.fillRect(x - 1, y - 30, 22, 5);
    }
    // the clock
    const cx = 29560, cy = 5070;
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff8ee'; ctx.beginPath(); ctx.arc(cx, cy, 16, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - 11); ctx.moveTo(cx, cy); ctx.lineTo(cx + 8, cy + 3); ctx.stroke();
    // the work tables: the dough table (a floury board), the mixing station (a giant bowl) and the decorating table (a turntable)
    for (const [T, top, name] of [[K.DOUGH, '#d9b48c', '🍞 BREAD'], [K.MIX, '#f6e7cf', '🎂 CAKE'], [K.DECOR, '#f6e7cf', '🎂 CAKE']]) {
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(T.x0 + 5, T.y0 + 4, T.x1 - T.x0, T.y1 - T.y0 + 6);
      ctx.fillStyle = '#8a5527'; ctx.fillRect(T.x0 + 6, T.y1 - 4, 8, 12); ctx.fillRect(T.x1 - 14, T.y1 - 4, 8, 12);
      ctx.fillStyle = '#b07a3e'; U.roundRect(ctx, T.x0, T.y0 - 8, T.x1 - T.x0, T.y1 - T.y0 + 4, 6); ctx.fill();
      ctx.fillStyle = top; U.roundRect(ctx, T.x0 + 4, T.y0 - 6, T.x1 - T.x0 - 8, T.y1 - T.y0 - 6, 5); ctx.fill();
      this.label(ctx, r, name, (T.x0 + T.x1) / 2, T.y1 + 22, 9, 'rgba(43,29,20,0.72)', '#ffe08a');
    }
    const D = K.DOUGH, dx = (D.x0 + D.x1) / 2;
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; for (let i = 0; i < 16; i++) { ctx.beginPath(); ctx.arc(D.x0 + 20 + ((i * 37) % 140), D.y0 + ((i * 13) % 34), 1.4, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#f3e2c0'; ctx.beginPath(); ctx.ellipse(dx - 30, D.y0 + 14, 16, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c99a5f'; U.roundRect(ctx, dx + 12, D.y0 + 8, 46, 8, 4); ctx.fill(); ctx.fillStyle = '#8a5527'; ctx.fillRect(dx + 6, D.y0 + 10, 6, 4); ctx.fillRect(dx + 58, D.y0 + 10, 6, 4);   // the rolling pin
    const Mx = K.MIX, mx = (Mx.x0 + Mx.x1) / 2, my = Mx.y0 + 12;
    ctx.fillStyle = '#9fd8ff'; ctx.beginPath(); ctx.ellipse(mx, my, 40, 14, 0, 0, Math.PI); ctx.lineTo(mx - 40, my); ctx.fill(); ctx.beginPath(); ctx.ellipse(mx, my - 2, 40, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffe4a0'; ctx.beginPath(); ctx.ellipse(mx, my - 2, 33, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#b07a3e'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(mx + 6, my - 4); ctx.lineTo(mx + 30, my - 30); ctx.stroke(); ctx.lineCap = 'butt';
    for (let i = 0; i < 3; i++) { ctx.fillStyle = '#fff8ee'; ctx.beginPath(); ctx.ellipse(Mx.x0 + 18 + i * 12, Mx.y0 + 10, 5, 6.5, 0, 0, Math.PI * 2); ctx.fill(); }   // eggs
    const Dc = K.DECOR, tx = (Dc.x0 + Dc.x1) / 2;
    ctx.fillStyle = '#d7e3ea'; ctx.beginPath(); ctx.ellipse(tx, Dc.y0 + 16, 34, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#b8c9d3'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#ff8fab'; U.roundRect(ctx, Dc.x1 - 34, Dc.y0 + 2, 10, 24, 3); ctx.fill(); ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(Dc.x1 - 34, Dc.y0 + 26); ctx.lineTo(Dc.x1 - 24, Dc.y0 + 26); ctx.lineTo(Dc.x1 - 29, Dc.y0 + 32); ctx.fill();   // a piping bag
  },
  // the café window on the back wall: a sunny street with a park
  paintWindow(ctx, r) {
    const Wd = CFG.BAKERY.WINDOW, w = Wd.x1 - Wd.x0, h = Wd.y1 - Wd.y0;
    ctx.fillStyle = '#fff8ee'; ctx.fillRect(Wd.x0 - 7, Wd.y0 - 7, w + 14, h + 14);
    const sky = ctx.createLinearGradient(0, Wd.y0, 0, Wd.y1); sky.addColorStop(0, '#49a8ea'); sky.addColorStop(1, '#bfe6fb'); ctx.fillStyle = sky; ctx.fillRect(Wd.x0, Wd.y0, w, h);
    const bl = [['#e8a0bf', 30, 26], ['#7fc8f8', 24, 34], ['#b39ddb', 28, 20], ['#90caf9', 22, 36], ['#a5d6a7', 26, 28], ['#f48fb1', 20, 22], ['#ffd166', 30, 30], ['#7fc8f8', 24, 24], ['#e8a0bf', 26, 34], ['#a5d6a7', 22, 26], ['#b39ddb', 30, 22], ['#ffcc80', 24, 30]];
    let bx = Wd.x0 + 4; for (const [col, bw, bh] of bl) { if (bx + bw > Wd.x1) break; ctx.fillStyle = col; ctx.fillRect(bx, Wd.y1 - 16 - bh, bw, bh); ctx.fillStyle = '#fff3b0'; for (let y = Wd.y1 - 12 - bh; y < Wd.y1 - 20; y += 7) for (let x = bx + 4; x < bx + bw - 4; x += 7) ctx.fillRect(x, y, 3, 3); bx += bw + 6; }
    ctx.fillStyle = '#5c6670'; ctx.fillRect(Wd.x0, Wd.y1 - 16, w, 16); ctx.fillStyle = '#ffd166'; for (let x = Wd.x0 + 4; x < Wd.x1; x += 16) ctx.fillRect(x, Wd.y1 - 8, 8, 2);
    for (const x of [Wd.x0 + 60, Wd.x0 + 250, Wd.x1 - 40]) { ctx.fillStyle = '#5b3a1a'; ctx.fillRect(x, Wd.y1 - 30, 3, 14); ctx.fillStyle = '#3f9a4a'; ctx.beginPath(); ctx.arc(x + 1.5, Wd.y1 - 33, 9, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#fff8ee'; for (let k = 1; k < 4; k++) ctx.fillRect(Wd.x0 + (w * k) / 4 - 2, Wd.y0, 4, h); ctx.fillRect(Wd.x0, Wd.y0 + h / 2 - 1.5, w, 3);
    // the scalloped awning over it
    for (let x = Wd.x0 - 7, i = 0; x < Wd.x1 + 7; x += 22, i++) { ctx.fillStyle = i % 2 ? '#fff8ee' : '#e4572e'; ctx.fillRect(x, Wd.y0 - 18, 22, 10); ctx.beginPath(); ctx.arc(x + 11, Wd.y0 - 8, 11, 0, Math.PI); ctx.fill(); }
  },
  // the café's tables and chairs (static): gingham cloths, a flower in a vase, the customers' treats
  paintTables(ctx, r) {
    const K = CFG.BAKERY;
    K.TABLES.forEach((T, i) => {
      for (const side of [-1, 1]) {
        const sx = T.x + side * Math.abs(K.SEAT_DX), sy = T.y + K.SEAT_DY;
        ctx.fillStyle = 'rgba(0,0,0,0.14)'; ctx.beginPath(); ctx.ellipse(sx + 2, sy + 4, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#8a5527'; ctx.fillRect(sx - 9, sy - 4, 3, 9); ctx.fillRect(sx + 6, sy - 4, 3, 9);
        ctx.fillStyle = '#c47a3a'; U.roundRect(ctx, sx + side * 10 - 3, sy - 34, 6, 32, 3); ctx.fill();   // the back, away from the table
        ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.ellipse(sx, sy - 6, 13, 6.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ff8a65'; ctx.beginPath(); ctx.ellipse(sx, sy - 8, 11, 5, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.beginPath(); ctx.ellipse(T.x + 4, T.y + 14, 34, 12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6d4c41'; ctx.fillRect(T.x - 4, T.y, 8, 14);
      ctx.save(); ctx.beginPath(); ctx.ellipse(T.x, T.y - 4, 34, 20, 0, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(T.x - 36, T.y - 26, 72, 44);
      ctx.fillStyle = i % 2 ? 'rgba(59,125,216,0.30)' : 'rgba(228,87,46,0.30)'; for (let k = -36; k < 36; k += 12) { ctx.fillRect(T.x + k, T.y - 26, 6, 44); ctx.fillRect(T.x - 36, T.y - 26 + (k + 36) * 0.6, 72, 4); }
      ctx.restore();
      ctx.strokeStyle = 'rgba(43,29,20,0.18)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(T.x, T.y - 4, 34, 20, 0, 0, Math.PI * 2); ctx.stroke();
      // a little vase with a flower at the back of the table
      ctx.fillStyle = '#9fd8ff'; U.roundRect(ctx, T.x + 6, T.y - 22, 8, 10, 3); ctx.fill(); ctx.strokeStyle = '#3f9a4a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(T.x + 10, T.y - 22); ctx.lineTo(T.x + 10, T.y - 32); ctx.stroke();
      ctx.fillStyle = ['#ffd166', '#ff8fab', '#e4572e', '#b39ddb', '#41b883', '#3b7dd8'][i % 6]; ctx.beginPath(); ctx.arc(T.x + 10, T.y - 34, 4, 0, Math.PI * 2); ctx.fill();
    });
    for (const c of K.CUSTOMERS) {
      const T = K.TABLES[c.table], x = T.x + 18, y = T.y - 4;
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x, y, 10, 6, 0, 0, Math.PI * 2); ctx.fill();
      if (c.food === 'cupcake') this.drawCupcake(ctx, x, y - 4, 0.9, '#9fd8ff');
      else { ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, x - 5, y - 10, 10, 10, 3); ctx.fill(); ctx.fillStyle = '#7b4a2a'; ctx.beginPath(); ctx.ellipse(x, y - 10, 5, 2, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#fff8ee'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x + 6, y - 6, 3, -1.2, 1.2); ctx.stroke(); }
    }
  },
  paintCafe(ctx, r) {
    const K = CFG.BAKERY, CA = K.CAFE;
    // a menu sign on the wall and a cocoa machine corner between the window and the side wall
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, CA.x1 - 70, 5040, 60, 74, 6); ctx.fill(); ctx.fillStyle = '#c9ccd2'; U.roundRect(ctx, CA.x1 - 64, 5046, 48, 50, 4); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(CA.x1 - 54, 5060, 28, 16); ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, CA.x1 - 48, 5098, 16, 12, 3); ctx.fill();
    ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('☕', CA.x1 - 40, 5068);
  },
  paintSacks(ctx, r) {
    const S = CFG.BAKERY.SACKS;
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.ellipse(S.x1 + 6, S.y1 - 8, 18, 6, 0, 0, Math.PI * 2); ctx.fill();   // spilled flour
    for (const [x, y, lean] of [[S.x0 + 20, S.y0 + 64, -0.08], [S.x0 + 62, S.y0 + 66, 0.1], [S.x0 + 40, S.y0 + 34, 0]]) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(lean);
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(2, 16, 16, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d9b48c'; U.roundRect(ctx, -15, -18, 30, 34, 8); ctx.fill(); ctx.strokeStyle = '#a97a45'; ctx.lineWidth = 1.5; U.roundRect(ctx, -15, -18, 30, 34, 8); ctx.stroke();
      ctx.fillStyle = '#a97a45'; U.roundRect(ctx, -10, -22, 20, 8, 3); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-4, -22, 3, 0, Math.PI * 2); ctx.arc(4, -22, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#b23a48'; ctx.font = r.font(6); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('FLOUR', 0, 0);
      ctx.restore();
    }
  },
  // the shop counter in two parts (the gap between them is the way into the kitchen), the treats case and the cake cabinet
  paintCounter(ctx, r) {
    const K = CFG.BAKERY, C = K.COUNTER, G = K.CASE, CB = K.CABINET;
    for (const [x0, x1] of [C.a, C.b]) {
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x0 + 4, C.y0 + 6, x1 - x0, C.y1 - C.y0);
      ctx.fillStyle = '#8a5527'; U.roundRect(ctx, x0, C.y0, x1 - x0, C.y1 - C.y0, 6); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; for (let x = x0 + 8; x < x1 - 14; x += 24) ctx.fillRect(x, C.y0 + 14, 14, C.y1 - C.y0 - 18);
      ctx.fillStyle = '#f6e7cf'; U.roundRect(ctx, x0, C.y0 - 10, x1 - x0, 24, 6); ctx.fill();
    }
    // a little open swing gate at each side of the gap
    for (const x of [C.a[1], C.b[0]]) { ctx.fillStyle = '#c47a3a'; ctx.fillRect(x + (x === C.a[1] ? 0 : -5), C.y0 - 26, 5, 30); }
    // the kneading board on the counter (the dough itself is animated)
    const D = K.KNEAD;
    ctx.fillStyle = '#d9b48c'; U.roundRect(ctx, D.x - 30, D.y - 10, 60, 18, 4); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; for (let i = 0; i < 10; i++) { ctx.beginPath(); ctx.arc(D.x - 26 + ((i * 37) % 52), D.y - 6 + ((i * 13) % 12), 1.2, 0, Math.PI * 2); ctx.fill(); }
    // the treats case
    this.drawCake(ctx, G.x0 + 22, G.y1 - 4, 0.8, false, 0);
    for (let i = 0; i < 3; i++) this.drawCroissant(ctx, G.x0 + 56 + i * 18, G.y1 - 6, 0.9);
    for (let i = 0; i < 4; i++) this.drawCupcake(ctx, G.x0 + 52 + i * 20, G.y0 + 6, 0.7, ['#ff8fab', '#9fd8ff', '#ffd166', '#c5e1a5'][i]);
    ctx.fillStyle = 'rgba(159,224,255,0.4)'; U.roundRect(ctx, G.x0, G.y0 - 8, G.x1 - G.x0, G.y1 - G.y0 + 8, 8); ctx.fill();
    ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 1.5; U.roundRect(ctx, G.x0, G.y0 - 8, G.x1 - G.x0, G.y1 - G.y0 + 8, 8); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(G.x0 + 4, G.y0 - 5, G.x1 - G.x0 - 8, 3);
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('TREATS', (G.x0 + G.x1) / 2, C.y1 - 7);
    ctx.fillText('🔔 RING', K.BELL.x + 8, C.y1 - 7);
    // the tall glass cake cabinet: three cakes on two glass shelves (the middle one lights its candles from the pad)
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(CB.x0 + 4, CB.y0 + 6, CB.x1 - CB.x0, CB.y1 - CB.y0);
    ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, CB.x0, CB.y0, CB.x1 - CB.x0, CB.y1 - CB.y0, 10); ctx.fill();
    ctx.fillStyle = '#e0f4fb'; U.roundRect(ctx, CB.x0 + 5, CB.y0 + 5, CB.x1 - CB.x0 - 10, CB.y1 - CB.y0 - 10, 8); ctx.fill();
    ctx.fillStyle = '#b8c9d3'; ctx.fillRect(CB.x0 + 5, CB.y0 + 34, CB.x1 - CB.x0 - 10, 3);
    const cakes = [{ flavour: 'chocolate', decor: { icing: 4, sprinkles: true, candles: 0, topper: 'strawberry' } }, { flavour: 'vanilla', decor: { icing: 4, sprinkles: true, candles: 0, topper: null } }, { flavour: 'strawberry', decor: { icing: 4, sprinkles: false, candles: 0, topper: 'strawberry' } }];
    this.drawMadeCake(ctx, CB.x0 + 40, CB.y0 + 33, 0.8, cakes[0], 1, 0, false);
    this.drawMadeCake(ctx, CB.x1 - 40, CB.y0 + 33, 0.8, cakes[2], 1, 0, false);
    this.drawCake(ctx, (CB.x0 + CB.x1) / 2, CB.y1 - 9, 0.9, false, 0);
    for (let i = 0; i < 5; i++) this.drawCupcake(ctx, CB.x0 + 26 + i * 18 + (i > 1 ? 80 : 0), CB.y1 - 12, 0.75, ['#ff8fab', '#9fd8ff', '#ffd166', '#c5e1a5', '#b39ddb'][i]);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(CB.x0 + 10, CB.y0 + 6, 8, CB.y1 - CB.y0 - 12);
    this.label(ctx, r, '🎂 CAKES', (CB.x0 + CB.x1) / 2, C.y1 - 7, 8, '#b23a48', '#fff8ee');
  },
  // the bread shelf on the shop's west wall: baskets of rolls (the loaves you put there are drawn live)
  paintShelf(ctx, r) {
    const S = CFG.BAKERY.SHELF;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(S.x1, S.y0 + 6, 6, S.y1 - S.y0);
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(S.x0, S.y0, S.x1 - S.x0, S.y1 - S.y0);
    for (let i = 0; i < 8; i++) { const y = S.y0 + 6 + i * 29; ctx.fillStyle = '#8d5a2b'; ctx.fillRect(S.x0 + 2, y, S.x1 - S.x0 - 4, 25); ctx.fillStyle = '#a3612c'; ctx.fillRect(S.x0 + 2, y + 22, S.x1 - S.x0 - 4, 3); }
    this.label(ctx, r, '🍞 BREAD', (S.x0 + S.x1) / 2 + 6, S.y0 - 10, 8, '#5b3a1a', '#ffe08a');
  },
  // the delivery desk by the door: a counter with a stack of pink cake boxes and a sign
  paintDesk(ctx, r) {
    const D = CFG.BAKERY.DESK;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(D.x0 + 4, D.y0 + 6, D.x1 - D.x0, D.y1 - D.y0);
    ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, D.x0, D.y0, D.x1 - D.x0, D.y1 - D.y0, 6); ctx.fill();
    ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, D.x0, D.y0 - 10, D.x1 - D.x0, 20, 6); ctx.fill();
    for (let k = 0; k < 3; k++) { const x = D.x1 - 26, y = D.y0 - 2 - k * 9; ctx.fillStyle = k % 2 ? '#ffb6c1' : '#ff8fab'; U.roundRect(ctx, x - 14, y - 8, 28, 10, 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(x - 1, y - 8, 2, 10); }
    this.label(ctx, r, '📦 DELIVERY 🚲', (D.x0 + D.x1) / 2, D.y1 - 9, 9, '#3b7dd8', '#fff');
  },
  // the glass shop front (bottom wall) with the door, and outside it the sidewalk, the kerb and a bit of street
  paintFront(ctx, r) {
    const K = CFG.BAKERY, R = K.ROOM, W = K.WORLD, S = K.SIDEWALK, wl = K.WALL, E = K.EXIT;
    ctx.fillStyle = '#c9ccd2'; ctx.fillRect(W.x0, S.y0, W.x1 - W.x0, S.y1 - S.y0);
    ctx.fillStyle = 'rgba(0,0,0,0.08)'; for (let x = W.x0; x < W.x1; x += 40) ctx.fillRect(x, S.y0, 2, 70); ctx.fillRect(W.x0, S.y0 + 35, W.x1 - W.x0, 2);
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(W.x0, S.y0 + 70, W.x1 - W.x0, 6);
    ctx.fillStyle = '#5c6670'; ctx.fillRect(W.x0, S.y0 + 76, W.x1 - W.x0, S.y1 - S.y0 - 76); ctx.fillStyle = '#ffd166'; for (let x = W.x0 + 10; x < W.x1; x += 50) ctx.fillRect(x, S.y1 - 8, 26, 3);
    // the shop front: a wooden frame with big glass panes
    ctx.fillStyle = '#a3612c'; ctx.fillRect(R.x0 - wl, R.y1, R.x1 - R.x0 + 2 * wl, S.y0 - R.y1);
    for (let x = R.x0; x < R.x1 - 10; x += 120) { if (Math.abs(x + 55 - E.x) < 70) continue; ctx.fillStyle = 'rgba(159,224,255,0.75)'; ctx.fillRect(x + 6, R.y1 + 5, 108, S.y0 - R.y1 - 10); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x + 14, R.y1 + 7, 18, 4); }
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(E.x - 30, R.y1, 60, S.y0 - R.y1); ctx.fillStyle = 'rgba(159,224,255,0.8)'; ctx.fillRect(E.x - 25, R.y1 + 4, 50, S.y0 - R.y1 - 8);
    ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(E.x + 18, R.y1 + 13, 2.5, 0, Math.PI * 2); ctx.fill();
    // the striped awning outside, and window boxes of flowers
    for (let x = R.x0 - wl, i = 0; x < R.x1 + wl; x += 24, i++) { if (Math.abs(x + 12 - E.x) < 34) continue; ctx.fillStyle = i % 2 ? '#fff8ee' : '#e4572e'; ctx.fillRect(x, S.y0, 24, 8); ctx.beginPath(); ctx.arc(x + 12, S.y0 + 8, 12, 0, Math.PI); ctx.fill(); }
    for (const x of [29200, 29800, 30200, 30500]) { ctx.fillStyle = '#b86f2d'; ctx.fillRect(x - 40, S.y0 + 22, 80, 10); for (let k = 0; k < 6; k++) { ctx.fillStyle = ['#e4572e', '#ffd166', '#ff8fab'][k % 3]; ctx.beginPath(); ctx.arc(x - 32 + k * 13, S.y0 + 20, 4, 0, Math.PI * 2); ctx.fill(); } }
    // the exit mat inside, and the name plate
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, E.x - 24, E.y - 10, 48, 16, 3); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('EXIT', E.x, E.y - 2);
    this.label(ctx, r, '🥐 BAKERY 🧁', 29900, S.y0 + 50, 10, '#2b1d14', '#ffe08a');
  },

  // ======================= live drawing =======================
  // under the people: the ovens' glow and steam, the dough, the bell, the shelf's loaves, the café lamps, the last cake
  dynamic(r, g) {
    if (g.area !== 'bakery' || !this.st) return;
    const ctx = r.ctx, K = CFG.BAKERY, t = g.time, st = this.st, G = st.game, s = this.sv(g);
    const glow = 0.35 + 0.25 * Math.sin(t * 9) * Math.sin(t * 3.7);
    const hot = G && G.stage === 'oven' && G.baking ? 0.4 : 0;   // the oven you are baking in glows brighter
    for (const [O, on] of [[K.OVEN_B, G && G.kind === 'bread' ? hot : 0], [K.OVEN_C, G && G.kind === 'cake' ? hot : 0]]) {
      const w = O.win, a = Math.min(0.95, glow + on);
      ctx.fillStyle = `rgba(255,236,120,${a.toFixed(3)})`;
      if (O === K.OVEN_B) { ctx.beginPath(); ctx.ellipse(w.x, w.y + 4, w.w / 2, w.h / 2 + 6, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(w.x - w.w / 2, w.y + 4, w.w, w.h / 2 - 2); }
      else { U.roundRect(ctx, w.x - w.w / 2, w.y - w.h / 2, w.w, w.h, 8); ctx.fill(); }
      ctx.fillStyle = `rgba(255,159,28,${(0.08 + a * 0.15).toFixed(3)})`; ctx.beginPath(); ctx.ellipse(w.x, O.y1 + 14, 90, 24, 0, 0, Math.PI * 2); ctx.fill();
    }
    // the timer on the cake oven counts down while a cake bakes
    const C = K.OVEN_C;
    ctx.fillStyle = '#ff8c42'; ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(G && G.kind === 'cake' && G.stage === 'oven' && (G.baking || G.baked) ? (G.baked ? 'DING!' : '0:0' + Math.max(0, Math.ceil(K.CAKE_BAKE - G.bake))) : '--:--', C.x0 + 132, C.y0 + 23);
    const vx = (K.OVEN_B.x0 + K.OVEN_B.x1) / 2;
    for (let i = 0; i < 4; i++) { const age = (t * 0.45 + i * 0.25) % 1; ctx.fillStyle = `rgba(255,255,255,${(0.55 * (1 - age)).toFixed(3)})`; ctx.beginPath(); ctx.arc(vx - 4 + i * 3 + Math.sin(age * 5 + i) * 6, K.BACK_TOP - age * 20, 3 + age * 7, 0, Math.PI * 2); ctx.fill(); }
    // the dough on the counter: squashed flat each time the baker kneads it
    const D = K.KNEAD, sq = Math.max(0, Math.sin(t * 6)) * 0.35;
    ctx.fillStyle = '#f6e7cf'; ctx.beginPath(); ctx.ellipse(D.x, D.y, 11 + sq * 8, 7 - sq * 3, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = 'rgba(43,29,20,0.3)'; ctx.lineWidth = 1; ctx.stroke();
    // the bell
    const B = K.BELL, wob = st.bellT > 0 ? Math.sin(t * 40) * st.bellT * 3 : 0;
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.ellipse(B.x, B.y + 4, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(B.x, B.y + 2); ctx.rotate(wob * 0.08);
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(0, -4, 8, Math.PI, 0); ctx.fill(); ctx.fillRect(-8, -4, 16, 4); ctx.fillStyle = '#e0a800'; ctx.fillRect(-8, -1, 16, 2); ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(0, -12, 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // the loaves on the bread shelf (yours first, then the baker's rolls)
    const S = K.SHELF;
    for (let i = 0; i < 8; i++) {
      const y = S.y0 + 26 + i * 29, shape = s.shelf[i];
      if (shape) this.drawBread(ctx, (S.x0 + S.x1) / 2, y, shape === 'baguette' ? 0.6 : 0.75, shape, 1);
      else for (let k = 0; k < 2; k++) { ctx.fillStyle = '#d98a3c'; ctx.beginPath(); ctx.ellipse(S.x0 + 14 + k * 16, y - 5, 7, 4.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#f2c57c'; ctx.fillRect(S.x0 + 11 + k * 16, y - 8, 6, 1.5); }
    }
    // the café's hanging lamps
    for (const T of K.TABLES) { const tw = 0.5 + 0.5 * Math.sin(t * 2 + T.x); ctx.fillStyle = `rgba(255,224,138,${(0.12 + tw * 0.08).toFixed(3)})`; ctx.beginPath(); ctx.ellipse(T.x, T.y - 4, 60, 34, 0, 0, Math.PI * 2); ctx.fill(); }
    // the last cake you made, on the decorating table's turntable
    if (s.lastCake) { const Dc = K.DECOR; this.drawMadeCake(ctx, (Dc.x0 + Dc.x1) / 2, Dc.y0 + 18, 0.85, s.lastCake, 1, t, false); }
    // the bike parked outside on the sidewalk (while the delivery person is not riding it)
    const d = st.del;
    if (this.bikeHome(g) && (!d || !d.bike && ['box', 'out', 'street', 'park', 'in'].includes(d.phase))) this.drawBike(ctx, K.STREET.bike.x, K.STREET.bike.y, 1, false);
  },
  // the delivery bike, side view, facing +x (dir) with a pink box in the back basket
  drawBike(ctx, x, y, dir, box) {
    ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(0, 2, 30, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 3; for (const wx of [-18, 18]) { ctx.beginPath(); ctx.arc(wx, -9, 10, 0, Math.PI * 2); ctx.stroke(); }
    ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-18, -9); ctx.lineTo(-4, -9); ctx.lineTo(8, -24); ctx.lineTo(-8, -24); ctx.lineTo(-18, -9); ctx.moveTo(-4, -9); ctx.lineTo(-8, -28); ctx.moveTo(18, -9); ctx.lineTo(10, -32); ctx.stroke();
    ctx.strokeStyle = '#2b1d14'; ctx.beginPath(); ctx.moveTo(6, -33); ctx.lineTo(14, -32); ctx.stroke();
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, -13, -31, 11, 4, 2); ctx.fill();
    ctx.fillStyle = '#ffd166'; U.roundRect(ctx, -34, -24, 18, 12, 2); ctx.fill();   // the back basket
    if (box) { ctx.fillStyle = '#ff8fab'; U.roundRect(ctx, -34, -34, 18, 12, 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(-26, -34, 2, 12); }
    ctx.lineCap = 'butt'; ctx.restore();
  },
  // y-sorted with the people: the baker, the cat, the customers, the delivery person, the food on a table, what the chef holds
  entities(r, g, items) {
    const st = this.st; if (!st) return;
    const K = CFG.BAKERY, p = g.player, ctx = r.ctx;
    if (g.area === 'bakery') {
      items.push({ y: K.BAKER.y, draw: () => this.drawBaker(r, g) });
      items.push({ y: K.CAT.y, draw: () => this.drawCat(r, g) });
      K.CUSTOMERS.forEach((c, i) => { const T = K.TABLES[c.table]; items.push({ y: T.y + K.SEAT_DY, draw: () => this.drawCustomer(r, g, c, i) }); });
      const d = this.courierPos();
      items.push({ y: d.y, draw: () => this.drawCourier(r, g, d) });
      if (st.del && st.del.phase === 'box') items.push({ y: K.DESK.y1, draw: () => this.drawBoxing(ctx, g) });
      const e = st.eat;
      if (e) {
        const T = K.TABLES[e.table];
        items.push({ y: T.y - 3, draw: () => { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(T.x - 10, T.y - 4, 15, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#ff8fab'; ctx.lineWidth = 1.5; ctx.stroke(); this.drawFood(ctx, e.item, T.x - 10, T.y - 2, 0.7, this.eatLeft(), g.time); } });
        items.push({ y: p.y + 0.6, draw: () => {
          const S = this.seat(e.table);
          ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.ellipse(S.x, S.y - 4, 13, 6, 0, 0, Math.PI * 2); ctx.fill();   // the chair seat in front of the legs
          const bob = e.chomp > 0 ? Math.sin(g.time * 30) * 1.2 : 0;
          ctx.fillStyle = 'rgba(255,143,171,0.6)'; ctx.beginPath(); ctx.arc(p.x - 4, p.y - 34 + bob, 2.8, 0, Math.PI * 2); ctx.arc(p.x + 10, p.y - 34 + bob, 2.8, 0, Math.PI * 2); ctx.fill();
        } });
      }
    }
    // the delivery bike in the City: parked by the door, or ridden by the chef (pedalling, the chef drawn on the saddle)
    if (g.area === 'city' && !this.bikeOut()) { const b = st.bike; items.push({ y: b.y + 6, draw: () => this.drawCityBike(r, g, b) }); }
    // what the chef holds: the cake or bread from the kitchen, the cupcake from the pad (also outside, on the way out)
    if (!g.driving && !g.onTrain && !g.travel && !st.game && !st.eat) {
      const food = this.food();
      if (food) items.push({ y: p.y + 0.5, draw: () => {
        const f = p.facing || 1, x = p.x + f * 15, y = p.y - 12 + (p.moving ? Math.sin(p.bob || 0) * 2 : 0);
        if (food.kind === 'cake') { this.drawStand(ctx, x, y, 0.55); this.drawMadeCake(ctx, x, y + 1, 0.6, food.cake, 1, g.time, true); }
        else if (food.kind === 'bread') this.drawBread(ctx, x, y + 2, 0.6, food.shape, 1);
        else this.drawCupcake(ctx, p.x + f * 16, p.y - 18, 1, '#ff8fab');
      } });
    }
  },
  drawCityBike(r, g, b) {
    const ctx = r.ctx, riding = this.riding(g), dir = Math.cos(b.angle) < -0.2 ? -1 : 1, p = g.player;
    if (riding) {
      const pedal = p.moving ? Math.sin(g.time * 14) * 1.5 : 0;
      r.drawPerson(b.x - dir * 2, b.y - 20 + pedal, { shirt: '#fff', apron: '#e4572e', skin: '#f1c27d', hat: 'chef', facing: dir, moving: false, bob: 0, carry: 0, pants: '#2d3a4a' });
    }
    this.drawBike(ctx, b.x, b.y, dir, false);
    if (!riding && g.nearVehicle === b && !g.driving) { const bob = Math.sin(g.time * 5) * 3; ctx.font = r.font(18); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🚲', b.x, b.y - 52 + bob); }
  },
  // (the core's drawVehicle fallback: the same bike, side on)
  vehicleArt: { deliverybike(r, g, color, v) { BakeryExt.drawBike(r.ctx, 0, 6, 1, false); } },
  drawBaker(r, g) {
    const ctx = r.ctx, K = CFG.BAKERY, B = K.BAKER, D = K.KNEAD, p = g.player, st = this.st, t = g.time, d = U.dist(p.x, p.y, B.x, B.y);
    const f = p.x < B.x ? -1 : 1, x = B.x, waving = st.wave > 0;
    const dip = waving ? -Math.abs(Math.sin(t * 7)) * 3 : Math.max(0, Math.sin(t * 6)) * 2.5, y = B.y + dip;
    r.drawPerson(x, y, { shirt: '#fff', skin: '#e0ac69', hat: 'none', hair: '#e0ac69', hairStyle: 3, facing: f, moving: false, bob: 0, carry: 0, apron: '#f6c453', pants: '#6d4c41' });
    ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(43,29,20,0.45)'; ctx.lineWidth = 1.5;
    U.roundRect(ctx, x - 10, y - 54, 20, 10, 3); ctx.fill(); ctx.stroke();
    U.roundRect(ctx, x - 8, y - 80, 16, 28, 3); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x - 6, y - 80, 7, 0, Math.PI * 2); ctx.arc(x + 6, y - 80, 7, 0, Math.PI * 2); ctx.arc(x, y - 85, 7.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.ellipse(x + f * 1 - 3, y - 33, 3, 1.4, 0, 0, Math.PI * 2); ctx.ellipse(x + f * 1 + 3, y - 33, 3, 1.4, 0, 0, Math.PI * 2); ctx.fill();
    const say = (text, w) => r.drawBubble(x, B.y - 100 + Math.sin(t * 4) * 3, () => { ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText(text, 0, 0); }, w);
    if (waving) {
      ctx.save(); ctx.translate(x + 24, y - 46); ctx.rotate(Math.sin(t * 10) * 0.3); ctx.font = r.font(15); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('👋', 0, 0); ctx.restore();
      say('Hello! 👋', 84);
    } else {
      if (Math.sin(t * 6) > 0.96) { ctx.fillStyle = 'rgba(255,255,255,0.7)'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(D.x - 10 + i * 10, D.y - 12, 1.5, 0, Math.PI * 2); ctx.fill(); } }
      if (d < 130 && !st.game) say('Fresh today! 🥐', 110);
    }
  },
  drawCat(r, g) {
    const ctx = r.ctx, C = CFG.BAKERY.CAT, t = g.time, br = Math.sin(t * 1.6) * 0.8, x = C.x, y = C.y;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x + 1, y + 6, 18, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#f4a261'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + 12, y + 2); ctx.quadraticCurveTo(x + 24, y + 4, x + 20, y - 8); ctx.stroke();
    ctx.fillStyle = '#f4a261'; ctx.beginPath(); ctx.ellipse(x + 2, y - 2, 16, 9 + br, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e4572e'; for (let i = 0; i < 3; i++) ctx.fillRect(x - 2 + i * 6, y - 10 + i * 0.5, 3, 7);
    ctx.fillStyle = '#f4a261'; ctx.beginPath(); ctx.arc(x - 12, y - 4, 7.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 18, y - 8); ctx.lineTo(x - 17, y - 16); ctx.lineTo(x - 12, y - 10); ctx.closePath(); ctx.moveTo(x - 7, y - 9); ctx.lineTo(x - 6, y - 16); ctx.lineTo(x - 12, y - 11); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffb6c1'; ctx.beginPath(); ctx.arc(x - 13, y - 1, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x - 16, y - 5, 2, 0.2, Math.PI - 0.2); ctx.stroke(); ctx.beginPath(); ctx.arc(x - 10, y - 5, 2, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.lineCap = 'butt';
    const k = (t * 0.5) % 1; ctx.fillStyle = `rgba(43,29,20,${(0.7 * (1 - k)).toFixed(3)})`; ctx.font = r.font(9 + k * 5); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('z', x - 16 + k * 10, y - 20 - k * 18);
  },
  // the café's two customers on the east chairs, facing their table, nibbling now and then
  drawCustomer(r, g, c, i) {
    const K = CFG.BAKERY, T = K.TABLES[c.table], x = T.x - K.SEAT_DX, y = T.y + K.SEAT_DY, t = g.time, ctx = r.ctx;
    const looks = [{ shirt: '#9ccc65', skin: '#8d5524', hair: '#2b1d14', hairStyle: 2, pants: '#5d4037' }, { shirt: '#b39ddb', skin: '#f1c27d', hair: '#e8e8e8', hairStyle: 1, pants: '#3a3f5c' }];
    const nib = Math.sin(t * 1.3 + i * 2) > 0.85 ? -2 : 0;
    r.drawPerson(x, y + nib, Object.assign({ facing: -1, moving: false, bob: 0, carry: 0 }, looks[i % 2]));
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.ellipse(x, y - 4, 13, 6, 0, 0, Math.PI * 2); ctx.fill();
    if (nib) { ctx.fillStyle = '#fff'; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('mmm', x, y - 60); }
  },
  // the delivery person in a blue cap: at the desk, walking with the box, or riding the bike along the sidewalk
  drawCourier(r, g, d) {
    const ctx = r.ctx, look = { shirt: '#3b7dd8', pants: '#2d3a4a', skin: '#c68642', hat: 'cap', capColor: '#ffd166', carry: 0, stripes: false };
    if (d.phase === 'away') return;
    if (d.bike) {
      const lean = Math.sin(d.bob) * 1.5;
      r.drawPerson(d.x - d.facing * 2, d.y - 20 + lean, Object.assign({ facing: d.facing, moving: false, bob: 0 }, look));
      this.drawBike(ctx, d.x, d.y, d.facing, !!d.cake);
      if (d.phase === 'ride' && d.t < 1.6) this.sayAt(r, d.x, d.y - 96, 'Bye-bye! 🚲');
      return;
    }
    r.drawPerson(d.x, d.y, Object.assign({ facing: d.facing, moving: d.moving, bob: d.bob }, look));
    if (d.cake && d.phase !== 'box') {   // the box held out in front
      const f = d.facing, bx = d.x + f * 16, by = d.y - 18 + (d.moving ? Math.sin(d.bob) * 2 : 0);
      ctx.fillStyle = '#ff8fab'; U.roundRect(ctx, bx - 12, by - 12, 24, 16, 3); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(bx - 1.5, by - 12, 3, 16); ctx.fillRect(bx - 12, by - 5, 24, 2);
      ctx.fillStyle = '#c68642'; ctx.beginPath(); ctx.arc(bx - f * 11, by + 1, 3.2, 0, Math.PI * 2); ctx.arc(bx + f * 9, by + 3, 3.2, 0, Math.PI * 2); ctx.fill();
    }
    if (!g.s.bakery || this.st.game) return;
    const p = g.player;
    if (d.phase === 'wait' && this.st.carry && this.st.carry.kind === 'cake' && U.dist(p.x, p.y, d.x, d.y) < 160) this.sayAt(r, d.x, d.y - 76, 'I can take it home! 📦');
  },
  sayAt(r, x, y, text) { const ctx = r.ctx; ctx.font = r.font(12); const w = ctx.measureText(text).width + 22; r.drawBubble(x, y, () => { ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText(text, 0, 0); }, w); },
  // the cake on the desk while it is boxed: the pink box closes round it
  drawBoxing(ctx, g) {
    const D = CFG.BAKERY.DESK, d = this.st.del, x = (D.x0 + D.x1) / 2 - 20, y = D.y0 + 2, k = U.clamp(d.t / 0.7, 0, 1);
    this.drawMadeCake(ctx, x, y, 0.6, d.cake, 1, g.time, false);
    ctx.fillStyle = '#ff8fab'; U.roundRect(ctx, x - 17, y - 26 * k, 34, 26 * k + 2, 3); ctx.fill();
    if (k >= 1) { ctx.fillStyle = '#fff'; ctx.fillRect(x - 1.5, y - 26, 3, 28); ctx.fillRect(x - 17, y - 14, 34, 3); ctx.beginPath(); ctx.ellipse(x - 5, y - 28, 5, 3, -0.4, 0, Math.PI * 2); ctx.ellipse(x + 5, y - 28, 5, 3, 0.4, 0, Math.PI * 2); ctx.fill(); }
  },
  // over everything in the room: the lit candles on the cabinet's birthday cake, the confetti, a hint picture by the desk
  overlay(r, g) {
    const st = this.st; if (!st || g.area !== 'bakery') return;
    const ctx = r.ctx, CB = CFG.BAKERY.CABINET;
    if (st.candles > 0) this.drawCake(ctx, (CB.x0 + CB.x1) / 2, CB.y1 - 9, 0.9, true, g.time);
    for (const c of st.confetti) {
      ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.rot); ctx.globalAlpha = c.t > c.dur - 0.4 ? (c.dur - c.t) / 0.4 : 1;
      ctx.fillStyle = c.col; ctx.fillRect(-3, -2, 6, 4); ctx.restore();
    }
    ctx.globalAlpha = 1;
  },

  // ======================= the mini games on the screen =======================
  screen(r, g) {
    const st = this.st; if (!st) return;
    const ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    if (st.game && g.area === 'bakery') this.drawGame(r, g, st.game, W, H);
    if (st.fade > 0) { ctx.fillStyle = `rgba(20,12,6,${(st.fade / 0.45).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
  },
  drawGame(r, g, G, W, H) {
    const ctx = r.ctx, PF = CFG.BAKERY.PF, L = this.layout(W, H), t = g.time, cake = G.kind === 'cake';
    const awn = cake ? '#ff8fab' : '#f2b134', dark = cake ? '#c2185b' : '#a3612c';
    ctx.fillStyle = 'rgba(40,20,10,0.6)'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(L.ox, L.oy); ctx.scale(L.s, L.s);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; U.roundRect(ctx, 6, 10, L.FW, L.FH, 20); ctx.fill();
    ctx.fillStyle = '#fff6e6'; U.roundRect(ctx, 0, 0, L.FW, L.FH, 20); ctx.fill();
    ctx.save(); U.roundRect(ctx, 0, 0, L.FW, L.FH, 20); ctx.clip();
    for (let i = 0, x = 0; x < L.FW; i++, x += 25) { ctx.fillStyle = i % 2 ? '#fff' : awn; ctx.fillRect(x, 0, 25, 48); ctx.beginPath(); ctx.arc(x + 12.5, 48, 12.5, 0, Math.PI); ctx.fill(); }
    ctx.restore();
    ctx.strokeStyle = dark; ctx.lineWidth = 5; U.roundRect(ctx, 0, 0, L.FW, L.FH, 20); ctx.stroke();
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, L.FW / 2 - 110, 8, 220, 32, 10); ctx.fill();
    ctx.font = r.font(18); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffd23f'; ctx.fillText(cake ? '🎂 MAKE A CAKE 🎂' : '🍞 BAKE BREAD 🍞', L.FW / 2, 25);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(L.FW - 26, 26, 17, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = dark; ctx.lineWidth = 3; ctx.stroke();
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(L.FW - 32, 20); ctx.lineTo(L.FW - 20, 32); ctx.moveTo(L.FW - 20, 20); ctx.lineTo(L.FW - 32, 32); ctx.stroke(); ctx.lineCap = 'butt';
    // the playfield: a warm kitchen table, the step, its banner, the taps
    ctx.save(); ctx.translate(20, 64); ctx.beginPath(); U.roundRect(ctx, 0, 0, PF.w, PF.h, 12); ctx.clip();
    for (let y = 0; y < PF.h; y += 28) { ctx.fillStyle = (y / 28) % 2 ? '#e9c48f' : '#e2bb85'; ctx.fillRect(0, y, PF.w, 28); ctx.fillStyle = 'rgba(80,40,10,0.12)'; ctx.fillRect(0, y, PF.w, 1); }
    if (cake) this.drawCakeStep(r, ctx, G, t); else this.drawBreadStep(r, ctx, G, t);
    for (const s of G.sparks) { const k = s.t / s.dur; ctx.globalAlpha = Math.max(0, 1 - k); ctx.fillStyle = s.col; ctx.beginPath(); ctx.arc(s.x, s.y, s.s * (1 - k * 0.5) * 0.6, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
    for (const x of G.texts) { const k = x.t / x.dur; ctx.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1; ctx.font = r.font(24); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 4; ctx.strokeStyle = '#2b1d14'; ctx.strokeText(x.text, x.x, x.y - k * 30); ctx.fillStyle = x.col; ctx.fillText(x.text, x.x, x.y - k * 30); }
    ctx.globalAlpha = 1;
    for (const q of G.taps) { ctx.strokeStyle = `rgba(255,255,255,${(1 - q.t / 0.4).toFixed(3)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(q.x, q.y, 10 + q.t * 90, 0, Math.PI * 2); ctx.stroke(); }
    for (const c of G.conf) { ctx.fillStyle = c.col; ctx.save(); ctx.translate(c.x, c.y % (PF.h + 20)); ctx.rotate(c.t * 4 + c.ph); ctx.fillRect(-c.s / 2, -c.s / 4, c.s, c.s / 2); ctx.restore(); }
    const msg = this.banner(G);
    if (msg) { ctx.font = r.font(20); const w = Math.min(PF.w - 20, ctx.measureText(msg).width + 36); ctx.fillStyle = 'rgba(43,29,20,0.85)'; U.roundRect(ctx, PF.w / 2 - w / 2, 10, w, 40, 14); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(msg, PF.w / 2, 31); }
    ctx.restore();
    ctx.strokeStyle = dark; ctx.lineWidth = 4; U.roundRect(ctx, 20, 64, PF.w, PF.h, 12); ctx.stroke();
    // the strip under it: one picture per step, lit when done
    const steps = cake ? BAKERY_CAKE_STEPS : BAKERY_BREAD_STEPS, dots = cake ? BAKERY_CAKE_DOTS : BAKERY_BREAD_DOTS, idx = steps.indexOf(G.stage), sy = 64 + PF.h + 10;
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, 20, sy, PF.w, 44, 12); ctx.fill();
    const gap = PF.w / steps.length;
    for (let i = 0; i < steps.length; i++) {
      const x = 20 + gap * (i + 0.5), y = sy + 22, on = i < idx, now = i === idx;
      ctx.fillStyle = on ? '#2f9e44' : now ? '#f2b134' : 'rgba(255,255,255,0.15)'; ctx.beginPath(); ctx.arc(x, y, now ? 18 : 15, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = on || now ? 1 : 0.7; ctx.font = r.font(now ? 20 : 16); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(on ? '✔️' : dots[i], x, y + 1); ctx.globalAlpha = 1;
    }
    ctx.restore();
  },
  banner(G) {
    if (G.kind === 'cake') {
      switch (G.stage) {
        case 'flavour': return 'Pick a flavour!';
        case 'mix': return '🥚 🥚 🌾 ' + BAKERY_FLAVOURS[G.cake.flavour].ico + '  into the bowl!';
        case 'stir': return '🥄 Stir it round!';
        case 'pour': return '🥣 Into the tin!';
        case 'oven': return G.baked ? '🔔 DING! Take it out!' : G.baking ? '⏱️ Baking… ' + Math.max(0, Math.ceil(CFG.BAKERY.CAKE_BAKE - G.bake)) : '🔥 Into the oven!';
        case 'decorate': return { icing: '🍦 Squeeze the icing!', sprinkles: '✨ Sprinkles!', candles: '🕯️ Candles!', topper: '🍓 or 🍕 on top?' }[G.dec];
        case 'tada': return '';
      }
    } else {
      switch (G.stage) {
        case 'knead': return '👐 Knead the dough!';
        case 'shape': return G.shape ? '✨ ✨ ✨' : '🍞 🥖 🥨 Pick a shape!';
        case 'oven': return G.baked ? '🔔 DING! Take it out!' : G.baking ? '⏱️ Baking… ' + Math.max(0, Math.ceil(CFG.BAKERY.BREAD_BAKE - G.bake)) : '🔥 Into the oven!';
        case 'tada': return '';
      }
    }
    return '';
  },
  // a bouncing pointing hand
  point(r, ctx, x, y, t) { ctx.font = r.font(40); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('👇', x, y + Math.sin(t * 6) * 7); },
  drawChoice(r, ctx, c, lit, t, drawInner) {
    const bob = lit ? -Math.abs(Math.sin(t * 6)) * 8 : 0;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(c.x + 3, c.y + c.r * 0.8, c.r * 0.9, 10, 0, 0, Math.PI * 2); ctx.fill();
    if (lit) { ctx.fillStyle = 'rgba(255,224,138,0.75)'; ctx.beginPath(); ctx.arc(c.x, c.y + bob, c.r + 10, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#fff8ee'; ctx.beginPath(); ctx.arc(c.x, c.y + bob, c.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = lit ? '#e4572e' : 'rgba(43,29,20,0.25)'; ctx.lineWidth = lit ? 4 : 2; ctx.stroke();
    drawInner(c.x, c.y + bob);
    if (lit) this.point(r, ctx, c.x, c.y - c.r - 30, t);
  },
  // the oven (shared by both games): a big steel oven with a glowing window; `inner` draws what bakes inside
  drawOvenScene(r, ctx, G, t, inner) {
    const PF = CFG.BAKERY.PF, ox = PF.w / 2, oy = 250, bakeT = G.kind === 'cake' ? CFG.BAKERY.CAKE_BAKE : CFG.BAKERY.BREAD_BAKE, prog = Math.min(1, G.bake / bakeT), inOven = G.baking || G.baked;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; U.roundRect(ctx, ox - 152, oy - 166, 312, 300, 18); ctx.fill();
    ctx.fillStyle = '#6a7078'; U.roundRect(ctx, ox - 156, oy - 170, 312, 300, 18); ctx.fill();
    ctx.fillStyle = '#3f4247'; U.roundRect(ctx, ox - 156, oy - 170, 312, 40, 14); ctx.fill();
    for (let k = 0; k < 3; k++) { ctx.fillStyle = '#c9ccd2'; ctx.beginPath(); ctx.arc(ox - 120 + k * 30, oy - 150, 8, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#1e1e1e'; U.roundRect(ctx, ox + 30, oy - 164, 110, 28, 6); ctx.fill();
    ctx.fillStyle = G.baked ? '#7cf29a' : '#ff8c42'; ctx.font = r.font(18); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(G.baked ? 'DING!' : G.baking ? ('0:0' + Math.max(0, Math.ceil(bakeT - G.bake))) : '--:--', ox + 85, oy - 150);
    ctx.fillStyle = '#23262a'; U.roundRect(ctx, ox - 136, oy - 112, 272, 200, 16); ctx.fill();
    const glow = inOven ? 0.45 + 0.5 * prog + 0.05 * Math.sin(t * 9) : 0.15;
    const g2 = ctx.createLinearGradient(0, oy - 100, 0, oy + 80); g2.addColorStop(0, `rgba(255,${Math.floor(170 + 60 * prog)},70,${glow.toFixed(3)})`); g2.addColorStop(1, `rgba(200,70,10,${glow.toFixed(3)})`);
    ctx.fillStyle = g2; U.roundRect(ctx, ox - 126, oy - 102, 252, 180, 12); ctx.fill();
    if (inOven) for (let k = 0; k < 8; k++) { const fx = ox - 105 + k * 30, fh = 8 + 8 * Math.abs(Math.sin(t * 10 + k * 1.7)); ctx.fillStyle = k % 2 ? '#ffd166' : '#ff8c42'; ctx.beginPath(); ctx.moveTo(fx - 7, oy + 76); ctx.quadraticCurveTo(fx, oy + 76 - fh * 2, fx + 7, oy + 76); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(ox - 120, oy + 40, 240, 4);   // the rack
    inner(ox, oy + 40, prog, inOven);
    ctx.fillStyle = 'rgba(255,255,255,0.16)'; U.roundRect(ctx, ox - 116, oy - 96, 232, 12, 6); ctx.fill();
    if (G.baking || G.baked) { ctx.fillStyle = 'rgba(0,0,0,0.4)'; U.roundRect(ctx, ox - 136, oy + 100, 272, 14, 7); ctx.fill(); ctx.fillStyle = G.baked ? '#2f9e44' : '#ff8c42'; U.roundRect(ctx, ox - 136, oy + 100, Math.max(14, 272 * prog), 14, 7); ctx.fill(); }
    if (!G.baking && !G.baked) this.point(r, ctx, ox, oy - 60, t);
    if (G.baked) { ctx.font = r.font(40); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🔔', ox + Math.sin(t * 12) * 6, oy - 60); }
  },
  drawCakeStep(r, ctx, G, t) {
    const PF = CFG.BAKERY.PF, cx = PF.w / 2, F = BAKERY_FLAVOURS[G.cake.flavour || 'vanilla'];
    const bowl = (x, y, fill, lumps) => {
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(x + 4, y + 104, 110, 18, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4aa3d8'; ctx.beginPath(); ctx.ellipse(x, y, 130, 36, 0, 0, Math.PI); ctx.quadraticCurveTo(x - 120, y + 110, x, y + 110); ctx.quadraticCurveTo(x + 120, y + 110, x + 130, y); ctx.fill();
      ctx.fillStyle = '#9fd8ff'; ctx.beginPath(); ctx.ellipse(x, y, 130, 36, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e8f6ff'; ctx.beginPath(); ctx.ellipse(x, y + 2, 118, 28, 0, 0, Math.PI * 2); ctx.fill();
      if (fill) fill(x, y);
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.ellipse(x - 70, y + 50, 10, 26, 0.5, 0, Math.PI * 2); ctx.fill();
    };
    switch (G.stage) {
      case 'flavour':
        this.choices(G).forEach((c, i) => this.drawChoice(r, ctx, c, i === G.lit % 3, t, (x, y) => {
          const Fl = BAKERY_FLAVOURS[c.key];
          ctx.fillStyle = Fl.batter; ctx.beginPath(); ctx.arc(x, y + 8, 30, 0, Math.PI * 2); ctx.fill();
          ctx.font = r.font(34); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(Fl.ico, x, y - 4);
        }));
        this.drawMadeCake(ctx, cx, 400, 1.6, { flavour: BAKERY_FLAVOUR_KEYS[G.lit % 3], decor: { icing: 4, sprinkles: true, candles: 0, topper: null } }, 1, t, false);
        break;
      case 'mix': case 'stir': {
        const n = G.adds, stir = G.stage === 'stir' ? G.stir / 8 : 0;
        bowl(cx, 250, (x, y) => {
          ctx.save(); ctx.beginPath(); ctx.ellipse(x, y + 2, 118, 28, 0, 0, Math.PI * 2); ctx.clip();
          if (G.stage === 'stir') {
            ctx.fillStyle = this.mix('#f6e7cf', F.batter, 0.4 + stir * 0.6); ctx.fillRect(x - 120, y - 30, 240, 60);
            ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 3; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(x, y + 2, 30 + k * 28, 7 + k * 6, 0, G.ang + k, G.ang + k + 2.4); ctx.stroke(); }
            ctx.fillStyle = 'rgba(255,255,255,0.8)'; for (let k = 0; k < 8 - G.stir; k++) { const a = k * 2.3 + G.ang * 0.4; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 70, y + 2 + Math.sin(a) * 15, 6, 0, Math.PI * 2); ctx.fill(); }
          } else {
            if (n >= 1) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x - 40, y + 4, 26, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffb703'; ctx.beginPath(); ctx.arc(x - 40, y + 3, 7, 0, Math.PI * 2); ctx.fill(); }
            if (n >= 2) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x + 30, y + 8, 24, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffb703'; ctx.beginPath(); ctx.arc(x + 30, y + 7, 7, 0, Math.PI * 2); ctx.fill(); }
            if (n >= 3) { ctx.fillStyle = '#fbfbf7'; ctx.beginPath(); ctx.ellipse(x - 5, y - 2, 50, 18, 0, 0, Math.PI * 2); ctx.fill(); }
            if (n >= 4) { ctx.fillStyle = F.batter; for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.arc(x - 30 + (k * 23) % 70, y - 8 + (k * 7) % 16, 7, 0, Math.PI * 2); ctx.fill(); } }
          }
          ctx.restore();
        });
        if (G.stage === 'stir') {
          // the wooden spoon going round
          const a = G.ang, sx = cx + Math.cos(a) * 60, sy = 252 + Math.sin(a) * 14;
          ctx.strokeStyle = '#b07a3e'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 30, sy - 150); ctx.stroke(); ctx.lineCap = 'butt';
          ctx.fillStyle = '#c99a5f'; ctx.beginPath(); ctx.ellipse(sx, sy, 16, 10, 0, 0, Math.PI * 2); ctx.fill();
          for (let i = 0; i < 8; i++) { ctx.fillStyle = i < G.stir ? '#2f9e44' : 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(cx - 84 + i * 24, 395, 8, 0, Math.PI * 2); ctx.fill(); }
          this.point(r, ctx, cx + 100, 150, t);
        } else {
          // the ingredients waiting on top: egg, egg, flour, the flavour; the next one bounces
          const items = ['🥚', '🥚', '🌾', F.ico];
          items.forEach((ico, i) => {
            if (i < n || (G.fly && G.fly.i === i)) return;
            const x = 60 + i * 80, y = 110, next = i === n + (G.fly ? 1 : 0);
            ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(x, y, 30, 0, Math.PI * 2); ctx.fill();
            ctx.font = r.font(36); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ico, x, y + (next ? -Math.abs(Math.sin(t * 6)) * 8 : 0));
          });
          if (G.fly) { const k = U.clamp(G.fly.t / 0.45, 0, 1), x0 = 60 + G.fly.i * 80, x = U.lerp(x0, cx, k), y = U.lerp(110, 240, k) - Math.sin(k * Math.PI) * 60; ctx.font = r.font(36); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.save(); ctx.translate(x, y); ctx.rotate(k * 3); ctx.fillText(items[G.fly.i], 0, 0); ctx.restore(); }
          if (!G.fly && n < 4) this.point(r, ctx, 60 + n * 80, 160, t);
        }
        break;
      }
      case 'pour': {
        // the bowl tips over the round tin and the batter pours in
        const k = G.pour, tilt = G.pouring || k > 0 ? Math.min(1, k * 3) * 0.9 : 0;
        ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.ellipse(cx, 360, 92, 22, 0, 0, Math.PI); ctx.lineTo(cx - 92, 320); ctx.lineTo(cx + 92, 320); ctx.closePath(); ctx.fill(); ctx.fillRect(cx - 92, 320, 184, 40);
        ctx.fillStyle = '#c9ccd2'; ctx.beginPath(); ctx.ellipse(cx, 320, 92, 22, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#5f646b'; ctx.beginPath(); ctx.ellipse(cx, 322, 82, 17, 0, 0, Math.PI * 2); ctx.fill();
        if (k > 0) { ctx.fillStyle = F.batter; ctx.beginPath(); ctx.ellipse(cx, 322, 82 * Math.min(1, k * 1.3), 17 * Math.min(1, k * 1.3), 0, 0, Math.PI * 2); ctx.fill(); }
        if (G.pouring) { ctx.strokeStyle = F.batter; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx + 40, 200); ctx.quadraticCurveTo(cx + 10, 260, cx, 318); ctx.stroke(); ctx.lineCap = 'butt'; }
        ctx.save(); ctx.translate(cx + 80, 150); ctx.rotate(-tilt); ctx.scale(0.6, 0.6);
        ctx.fillStyle = '#4aa3d8'; ctx.beginPath(); ctx.ellipse(0, 0, 130, 36, 0, 0, Math.PI); ctx.quadraticCurveTo(-120, 110, 0, 110); ctx.quadraticCurveTo(120, 110, 130, 0); ctx.fill();
        ctx.fillStyle = '#9fd8ff'; ctx.beginPath(); ctx.ellipse(0, 0, 130, 36, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = F.batter; ctx.beginPath(); ctx.ellipse(0, 2, 118 * (1 - k * 0.8), 28 * (1 - k * 0.8), 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        if (!G.pouring) this.point(r, ctx, cx - 60, 200, t);
        break;
      }
      case 'oven':
        this.drawOvenScene(r, ctx, G, t, (x, y, prog, inOven) => {
          // the tin on the rack with the cake rising out of it
          const rise = inOven ? prog : 0;
          ctx.fillStyle = this.mix(F.batter, F.sponge, rise); ctx.beginPath(); ctx.ellipse(x, y - 30 - rise * 26, 74, 16, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(x - 74, y - 30 - rise * 26, 148, 20 + rise * 26);
          ctx.fillStyle = '#9aa0a8'; ctx.fillRect(x - 80, y - 32, 160, 30); ctx.fillStyle = '#c9ccd2'; ctx.fillRect(x - 80, y - 32, 160, 6);
          if (G.baked) { ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 3; for (let k = 0; k < 3; k++) { const sx = x - 40 + k * 40, ph = (t * 1.2 + k * 0.3) % 1; ctx.globalAlpha = 1 - ph; ctx.beginPath(); ctx.moveTo(sx, y - 70 - ph * 40); ctx.quadraticCurveTo(sx + 10, y - 85 - ph * 40, sx, y - 100 - ph * 40); ctx.stroke(); } ctx.globalAlpha = 1; }
        });
        break;
      case 'decorate': case 'tada': {
        const tada = G.stage === 'tada', bounce = tada ? Math.abs(Math.sin(t * 4)) * 10 : 0;
        // the turntable
        ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(cx + 4, 352, 120, 24, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#d7e3ea'; ctx.beginPath(); ctx.ellipse(cx, 346, 116, 26, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#eef6fa'; ctx.beginPath(); ctx.ellipse(cx, 340, 116, 24, 0, 0, Math.PI * 2); ctx.fill();
        this.drawMadeCake(ctx, cx, 336 - bounce, 3.6, G.cake, 1, t, true);
        for (const f of G.fall) { ctx.fillStyle = f.col; ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.a + f.t * 6); ctx.fillRect(-4, -1.5, 8, 3); ctx.restore(); }
        if (!tada) {
          if (G.dec === 'icing') {
            // the piping bag over the next dollop
            const k = G.cake.decor.icing, px = cx + [-50, 40, -20, 60][k % 4], py = 190 + Math.sin(t * 5) * 4;
            ctx.fillStyle = '#ff8fab'; ctx.beginPath(); ctx.moveTo(px - 20, py - 60); ctx.lineTo(px + 20, py - 60); ctx.lineTo(px + 4, py); ctx.lineTo(px - 4, py); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#e4572e'; ctx.fillRect(px - 4, py - 2, 8, 8); ctx.fillStyle = '#fff'; ctx.fillRect(px - 20, py - 66, 40, 8);
            this.point(r, ctx, px + 50, py - 40, t);
          } else if (G.dec === 'sprinkles') {
            if (!G.fall.length) { ctx.fillStyle = '#ffd166'; U.roundRect(ctx, cx - 18, 100, 36, 50, 8); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(cx - 18, 100, 36, 10); for (let i = 0; i < 6; i++) { ctx.fillStyle = BAKERY_SPRINKLES[i]; ctx.fillRect(cx - 12 + i * 4, 122 + (i % 2) * 8, 3, 6); } this.point(r, ctx, cx + 50, 110, t); }
          } else if (G.dec === 'candles') {
            for (let i = G.cake.decor.candles; i < 3; i++) { ctx.fillStyle = ['#3b7dd8', '#41b883', '#ffd166'][i]; U.roundRect(ctx, 40 + i * 30, 110, 10, 44, 3); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.fillRect(44 + i * 30, 104, 2, 7); }
            this.point(r, ctx, 45 + G.cake.decor.candles * 30, 80, t);
          } else if (G.dec === 'topper') {
            this.choices(G).forEach((c, i) => this.drawChoice(r, ctx, c, i === G.lit % 2, t, (x, y) => { if (c.key === 'strawberry') this.drawStrawberry(ctx, x, y, 3.6); else this.drawSliceTop(ctx, x, y, 4); }));
          }
        } else {
          ctx.font = r.font(54); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 7; ctx.strokeStyle = '#2b1d14';
          const s = 1 + 0.06 * Math.sin(t * 6); ctx.save(); ctx.translate(cx, 112); ctx.scale(s, s); ctx.strokeText('Ta-da!', 0, 0); ctx.fillStyle = '#ffd23f'; ctx.fillText('Ta-da!', 0, 0); ctx.restore();
          ctx.font = r.font(36); ctx.fillText('✨', 50, 220 + Math.sin(t * 5) * 6); ctx.fillText('✨', PF.w - 50, 250 - Math.sin(t * 5) * 6);
        }
        break;
      }
    }
  },
  drawBreadStep(r, ctx, G, t) {
    const PF = CFG.BAKERY.PF, cx = PF.w / 2;
    const board = () => { ctx.fillStyle = 'rgba(0,0,0,0.15)'; U.roundRect(ctx, 34, 186, PF.w - 60, 190, 18); ctx.fill(); ctx.fillStyle = '#d9b48c'; U.roundRect(ctx, 30, 180, PF.w - 60, 190, 18); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.75)'; for (let i = 0; i < 30; i++) { ctx.beginPath(); ctx.arc(50 + ((i * 53) % (PF.w - 100)), 196 + ((i * 29) % 160), 2, 0, Math.PI * 2); ctx.fill(); } };
    switch (G.stage) {
      case 'knead': case 'shape': {
        board();
        if (G.stage === 'knead') {
          const grow = G.kneads / 6, sq = G.squash, rx = (46 + grow * 40) * (1 + sq * 0.25), ry = (32 + grow * 24) * (1 - sq * 0.35);
          ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(cx + 4, 296, rx, 14, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#f3e2c0'; ctx.beginPath(); ctx.ellipse(cx, 290 - ry, rx, ry, 0, Math.PI, 0); ctx.lineTo(cx + rx, 290); ctx.lineTo(cx - rx, 290); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx, 290, rx, 10, 0, 0, Math.PI); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.ellipse(cx - rx * 0.3, 290 - ry * 1.4, rx * 0.35, ry * 0.25, -0.3, 0, Math.PI * 2); ctx.fill();
          ctx.font = r.font(48); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('👐', cx, 290 - ry * 2 - 30 + sq * 26);
          for (let i = 0; i < 6; i++) { ctx.fillStyle = i < G.kneads ? '#2f9e44' : 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(cx - 60 + i * 24, 395, 8, 0, Math.PI * 2); ctx.fill(); }
        } else if (!G.shape) {
          ctx.fillStyle = '#f3e2c0'; ctx.beginPath(); ctx.ellipse(cx, 220, 70, 40, 0, 0, Math.PI * 2); ctx.fill();
          this.choices(G).forEach((c, i) => this.drawChoice(r, ctx, c, i === G.lit % 3, t, (x, y) => this.drawBread(ctx, x, y + 14, c.key === 'baguette' ? 1.2 : 1.45, c.key, 0.3)));
        } else {
          const k = U.easeOut(G.morph);
          ctx.fillStyle = '#f3e2c0'; ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.ellipse(cx, 260, 70, 40, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
          this.drawBread(ctx, cx, 300, 1 + k * 2, G.shape, 0);
        }
        break;
      }
      case 'oven':
        this.drawOvenScene(r, ctx, G, t, (x, y, prog, inOven) => {
          ctx.fillStyle = '#5f646b'; U.roundRect(ctx, x - 100, y - 8, 200, 8, 3); ctx.fill();   // the baking tray
          this.drawBread(ctx, x, y - 8, G.shape === 'baguette' ? 2.6 : 3.2, G.shape, inOven ? prog : 0);
        });
        break;
      case 'tada': {
        const bounce = Math.abs(Math.sin(t * 4)) * 10;
        ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(cx, 330, 130, 26, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#c99a5f'; ctx.beginPath(); ctx.ellipse(cx, 322, 130, 28, 0, 0, Math.PI * 2); ctx.fill();
        this.drawBread(ctx, cx, 320 - bounce, G.shape === 'baguette' ? 3 : 3.6, G.shape, 1);
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 4; for (let k = 0; k < 3; k++) { const sx = cx - 50 + k * 50, ph = (t * 1.1 + k * 0.33) % 1; ctx.globalAlpha = 1 - ph; ctx.beginPath(); ctx.moveTo(sx, 230 - ph * 50); ctx.quadraticCurveTo(sx + 14, 210 - ph * 50, sx, 190 - ph * 50); ctx.stroke(); } ctx.globalAlpha = 1;
        ctx.font = r.font(54); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 7; ctx.strokeStyle = '#2b1d14';
        const s = 1 + 0.06 * Math.sin(t * 6); ctx.save(); ctx.translate(cx, 112); ctx.scale(s, s); ctx.strokeText('Ta-da!', 0, 0); ctx.fillStyle = '#ffd23f'; ctx.fillText('Ta-da!', 0, 0); ctx.restore();
        break;
      }
    }
  },
};

// taps on the game canvas while a bakery game is open go to the game (not to the joystick); dragging round the bowl stirs
if (typeof window !== 'undefined') {
  const mine = (e) => { const X = BakeryExt; return X.st && X.st.game && typeof Game !== 'undefined' && Game.area === 'bakery' && Render.canvas && e.target === Render.canvas; };
  const at = (e) => { const rect = Render.canvas.getBoundingClientRect(); return [e.clientX - rect.left, e.clientY - rect.top]; };
  window.addEventListener('pointerdown', (e) => {
    if (!mine(e)) return;
    e.preventDefault(); e.stopImmediatePropagation();
    try { Sfx.init(); Sfx.resume(); } catch (err) { /* ignore */ }
    BakeryExt.screenTap(Game, ...at(e));
  }, true);
  window.addEventListener('pointermove', (e) => { if (!mine(e) || !BakeryExt.st.ptr) return; e.preventDefault(); BakeryExt.screenDrag(Game, ...at(e)); }, true);
  window.addEventListener('pointerup', () => { if (BakeryExt.st) BakeryExt.st.ptr = null; }, true);
}

Game.ext.unshift(BakeryExt);
Render.ext.push(BakeryExt);
