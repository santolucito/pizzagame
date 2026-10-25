'use strict';
// The pizza room: a second room on the pizzeria's second floor where it rains pizza slices.
// A bright door on the bedroom's east wall (painted onto the bedroom with `paintAfter`) leads to a cosy attic room of
// its own (`CFG.AREAS.pizzarain`): a slanted ceiling with a round window and fairy lights, a pizza rug, a comfy
// armchair, and a big fluffy pizza-cloud under the ceiling that rains pizza slices all the time. The slices drift and
// spin down, land with a tiny bounce and fade away. Walk into a slice while it is low enough and the chef eats it
// (a float, a crumb sparkle, a chew): three slices and the chef is full for this visit (the rain keeps falling for
// fun, slices just bounce off). Leaving the room resets the count; `g.s.pizzarain` keeps the totals.
// More to do: sit in the armchair (pinned, a comfy sigh), bring pizzas up from the shop's oven and eat one at the side
// table off the white-and-blue plate (the chef sits on the stool and it goes bite by bite), and ring the old corded
// landline on the wall shelf by the door: a delivery person in a red cap opens the door, walks to the table, puts a
// whole pepperoni pizza on the plate, waves and leaves. Leaving the room mid-delivery leaves the pizza on the plate.
// Extension module: registered with Game.ext (first, so its door beats the bedroom's buttons) and Render.ext.
// See the hook list in js/EXTENSIONS.md. This file never touches js/upstairs.js: it only reads UpstairsExt.st.
CFG.PIZZARAIN = {
  WORLD: { x0: 5000, y0: 4000, x1: 5600, y1: 4400 },      // reserved interior rectangle (x0 = 3000 + 2 * 1000)
  ROOM: { x0: 5050, y0: 4096, x1: 5550, y1: 4356 }, WALL: 26,
  WINDOW: { x: 5150, y: 4044, r: 26 },                    // round attic window in the slope
  CLOUD: { x: 5300, y: 4058, w: 200 },                    // the pizza cloud under the ceiling; slices drop from its underside
  LIGHTS: { y: 4034, sag: 34, n: 12 },                    // the fairy lights strung under the ceiling
  RUG: { x: 5300, y: 4246, rx: 112, ry: 58 },             // a pizza-shaped rug
  CHAIR: { x: 5110, y: 4300, block: [5078, 4272, 64, 52], sit: { x: 5110, y: 4310 }, stand: { x: 5160, y: 4304 }, reach: 54, near: 60 },
  // the side table: the chef eats on the stool west of it (free floor), the delivery person serves from the north side
  TABLE: { x: 5486, y: 4290, block: [5462, 4276, 48, 30], seat: { x: 5446, y: 4298 }, plate: { x: 5474, y: 4289 }, server: { x: 5492, y: 4256 }, reach: 62 },
  // the old corded telephone on a little wall shelf on the west wall, just north of the door
  PHONE: { x: 5063, y: 4174, block: [5050, 4156, 26, 26], spot: { x: 5094, y: 4172 }, reach: 30, near: 44 },
  // the delivery: the doorway, the mat, across the room, the server spot at the table (all free floor after the doorway)
  DELIVERY: { path: [[5036, 4224], [5084, 4224], [5300, 4238], [5492, 4256]], speed: 120, call: 2, arrive: 4, door: 3, place: 0.9, serve: 2, wave: 1.1 },
  meal: { dur: 3, bites: [0.45, 1.1, 1.75, 2.4] },
  LAMP: { x: 5512, y: 4132, block: [5498, 4118, 28, 24] },
  PLANT: { x: 5090, y: 4132, block: [5076, 4118, 28, 24] },
  EXIT: { x: 5080, y: 4222 }, reach: 26,                  // the mat inside the door back to the bedroom (west wall)
  DOOR_IN: { x0: 5024, y0: 4198, x1: 5050, y1: 4246 },    // that door, on the west wall
  MAT_OUT: { x: 6916, y: 1742 },                          // the mat in the bedroom, on the free strip between the desk and the stair rail
  DOOR_OUT: { x0: 6941, y0: 1716, x1: 6965, y1: 1764 },   // the door on the bedroom's east wall
  rain: { every: 0.6, max: 14, fall: 76, drift: 18, sway: 14, floorFor: 2.2, fadeFor: 0.6, bounce: 72, gravity: 400 },
  catchZone: { dx: 22, dy: 18, h: 66 },                   // a slice this close (and this low) is caught
  full: 3, chew: 0.8, fade: 0.45,
  hintReach: 70,
};
CFG.AREAS.pizzarain = { WORLD: CFG.PIZZARAIN.WORLD };

const PIZZARAIN_BULBS = ['#ff5c5c', '#ffd166', '#5ad26f', '#4aa3ff', '#ff8fab', '#ffa94d'];
const PIZZARAIN_PUFFS = [[-78, 8, 28], [-44, -8, 36], [-4, -16, 42], [38, -8, 38], [78, 8, 28], [-24, 12, 30], [24, 14, 30]];   // [dx, dy, r]

const PizzaRainExt = {
  name: 'pizzarain',
  st: null,   // runtime (not saved): the slices in the air and on the floor, this visit's count, the chew, the fade,
              // the seat (null | 'chair' | 'table'), the plate (null | { kind: 'slice' | 'pizza' }), the meal, the delivery

  // ---------- saved state ----------
  defaults: { pizzarain: { eaten: 0, visits: 0, seen: false, sits: 0, meals: 0, orders: 0 } },
  state(g) { if (!g.s.pizzarain) g.s.pizzarain = { eaten: 0, visits: 0, seen: false, sits: 0, meals: 0, orders: 0 }; return g.s.pizzarain; },

  // ---------- helpers ----------
  // on foot and not in a ride, a taxi, the Pizza Tower, a bus...
  ready(g) {
    if (g.driving || g.onTrain || g.ride || g.travel || g.fishing) return false;
    if (typeof CityExt !== 'undefined' && (CityExt.floor || (CityExt.st && (CityExt.st.cab || CityExt.st.boarding)))) return false;
    return true;
  },
  // in the bedroom with nothing going on there (no nap, no slide, no catalog, no drawing pad)
  bedroomOk(g) {
    if (g.area !== 'upstairs' || typeof UpstairsExt === 'undefined' || !UpstairsExt.st) return false;
    const st = UpstairsExt.st;
    return !(st.nap || st.slide || st.cat.on || st.draw.on);
  },
  atMat(g) { const p = g.player, M = CFG.PIZZARAIN.MAT_OUT; return U.dist(p.x, p.y, M.x, M.y) < CFG.PIZZARAIN.reach; },
  atExit(g) { const p = g.player, E = CFG.PIZZARAIN.EXIT; return U.dist(p.x, p.y, E.x, E.y) < CFG.PIZZARAIN.reach; },
  roomBlocks() {
    const C = CFG.PIZZARAIN, R = C.ROOM, W = C.WORLD, w = C.WALL, o = [];
    o.push({ x: W.x0, y: W.y0, w: W.x1 - W.x0, h: R.y0 - W.y0 });                                   // the whole slope of the ceiling
    o.push({ x: R.x0 - w, y: R.y1, w: R.x1 - R.x0 + 2 * w, h: w });
    o.push({ x: R.x0 - w, y: R.y0, w, h: R.y1 - R.y0 }, { x: R.x1, y: R.y0, w, h: R.y1 - R.y0 });
    for (const it of [C.CHAIR, C.TABLE, C.LAMP, C.PLANT, C.PHONE]) o.push({ x: it.block[0], y: it.block[1], w: it.block[2], h: it.block[3] });
    return o;
  },
  roomFree(x, y) {
    const R = CFG.PIZZARAIN.ROOM, r = 12;
    if (x < R.x0 + r || x > R.x1 - r || y < R.y0 + r || y > R.y1 - r) return false;
    for (const o of this.roomBlocks()) if (x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h) return false;
    return true;
  },
  // a save (or a push) that left the chef in a wall or in the furniture goes back onto the door mat
  rescue(g) {
    const p = g.player;
    if ((this.st && this.st.seat === 'chair') || this.roomFree(p.x, p.y)) return false;   // sitting in the armchair is not stuck
    p.x = CFG.PIZZARAIN.EXIT.x; p.y = CFG.PIZZARAIN.EXIT.y; p.moving = false;
    g.floats.push({ x: p.x, y: p.y - 50, text: 'Oops! Back inside', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    return true;
  },
  near(g, pt, d) { return U.dist(g.player.x, g.player.y, pt.x, pt.y) < d; },
  atTable(g) { const T = CFG.PIZZARAIN.TABLE; return this.near(g, T, T.reach); },
  pizzaWaiting() { const st = this.st; return !!(st && st.plate && st.plate.kind === 'pizza' && !st.meal); },
  // where the chef is pinned while sitting
  seatSpot(seat) { const C = CFG.PIZZARAIN; return seat === 'chair' ? C.CHAIR.sit : C.TABLE.seat; },
  // the chef left the room (or went home) with something going on: the meal stops, the seat is let go, and a pizza on
  // its way is put on the plate at once (it waits there for the next visit), the door shuts
  settle() {
    const st = this.st;
    if (st.meal) { if (st.meal.kind === 'slice') st.plate = null; st.meal = null; }
    st.seat = null;
    if (st.del) { if (!st.del.placed && !st.plate) st.plate = { kind: 'pizza' }; st.del = null; }
    st.door = 0;
  },
  resetVisit() {
    const st = this.st;
    st.inside = false; st.eaten = 0; st.full = false; st.burped = false; st.chew = 0; st.slices.length = 0; st.crumbs.length = 0; st.spawnT = 0.3;
  },

  // ---------- game hooks ----------
  build(g) {
    this.state(g);
    this.st = { inside: false, eaten: 0, full: false, burped: false, chew: 0, fade: 0, slices: [], crumbs: [], spawnT: 0.3, spawned: 0, landed: 0, faded: 0,
      seat: null, plate: null, meal: null, del: null, door: 0, delivered: 0 };
  },
  home(g) { if (this.st) { this.settle(); this.st.plate = null; this.resetVisit(); this.st.fade = 0; } },
  obstacles(g) { return g.area === 'pizzarain' ? this.roomBlocks() : []; },
  bgKey() { return 'pr'; },   // constant: the door on the bedroom wall never changes, it only has to be painted once this file is loaded
  enter(g) {
    const C = CFG.PIZZARAIN, p = g.player, s = this.state(g);
    if (!this.st) this.build(g);
    this.resetVisit();
    g.area = 'pizzarain'; p.x = C.EXIT.x; p.y = C.EXIT.y; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.st.inside = true; this.st.fade = C.fade; this.st.spawnT = 0.15;
    s.visits = (s.visits || 0) + 1;
    Sfx.ding(); Haptics.tap();
    if (!s.seen) { s.seen = true; g.toast("🍕 It's raining pizza!", true); }
  },
  leave(g) {
    const C = CFG.PIZZARAIN, p = g.player;
    this.settle(); this.resetVisit();
    g.area = 'upstairs'; p.x = C.MAT_OUT.x; p.y = C.MAT_OUT.y; p.moving = false; p.facing = -1; p.hasMoved = true; g.cameraSnap = true;
    this.st.fade = C.fade; Sfx.drop();
  },
  action(g) {
    if (!this.ready(g)) return null;
    if (this.bedroomOk(g) && this.atMat(g)) return { label: '🍕 Go into the pizza room', run: (gg) => this.enter(gg) };
    if (g.area !== 'pizzarain' || !this.st) return null;
    const st = this.st, C = CFG.PIZZARAIN;
    if (st.meal) return null;   // busy eating: nothing to press for a moment
    if (st.seat) return { label: '🚶 Stand up', run: (gg) => this.standUp(gg) };
    if (this.atExit(g)) return { label: '🚪 Back to the bedroom', run: (gg) => this.leave(gg) };
    if (this.atTable(g)) {
      if (this.pizzaWaiting()) return { label: '🍽️ Eat the pizza', run: (gg) => this.eatAtTable(gg) };
      if (g.player.carry > 0 && !st.plate && !(st.del && st.del.phase === 'serve')) return { label: '🍽️ Eat a slice at the table', run: (gg) => this.eatAtTable(gg) };
    }
    if (this.near(g, C.PHONE.spot, C.PHONE.reach)) return { label: '📞 Order a pizza', run: (gg) => this.order(gg) };
    if (this.near(g, C.CHAIR, C.CHAIR.reach)) return { label: '🪑 Sit in the armchair', run: (gg) => this.sit(gg) };
    return null;
  },
  hint(g) {
    if (!this.ready(g)) return undefined;
    if (g.area === 'pizzarain') {
      const st = this.st, C = CFG.PIZZARAIN, T = C.TABLE;
      if (st) {
        if (st.meal) return { text: 'Yum yum! 😋', target: null };
        if (this.pizzaWaiting()) return { text: 'Your pizza is here! 🍽️', target: this.atTable(g) ? null : T.seat };   // (also from the armchair: the arrow shows the way)
        if (st.seat === 'chair') return { text: 'Ahh, so comfy 😌', target: null };
        if (g.player.carry > 0 && !st.plate) return { text: 'Eat a slice at the table 🍽️', target: this.atTable(g) ? null : T.seat };
        if (st.del) return { text: 'Your pizza is on its way! 🍕', target: null };
        if (this.near(g, C.PHONE.spot, C.PHONE.near)) return { text: 'Call for a pizza! 📞', target: null };
        if (this.near(g, C.CHAIR, C.CHAIR.near)) return { text: 'Sit in the comfy chair 🪑', target: null };
      }
      return { text: st && st.full ? "You're full! The cloud will rain again next visit 😋" : 'Catch the falling pizza! 🍕', target: null };
    }
    if (!this.bedroomOk(g)) return undefined;
    const p = g.player, C = CFG.PIZZARAIN, M = C.MAT_OUT, d = U.dist(p.x, p.y, M.x, M.y);
    if (d < C.hintReach) return { text: 'A pizza room! 🍕', target: d < C.reach ? null : M };
    return undefined;
  },
  update(g, dt) {
    if (!this.st) this.build(g);
    const st = this.st, C = CFG.PIZZARAIN, R = C.ROOM;
    st.fade = Math.max(0, st.fade - dt);
    st.chew = Math.max(0, st.chew - dt);
    if (g.area !== 'pizzarain') { if (st.inside || st.del || st.meal || st.seat) { this.settle(); this.resetVisit(); } return; }
    if (!st.inside) st.inside = true;   // arrived by a saved position
    const pp = g.player;
    if (st.seat) { const S = this.seatSpot(st.seat); pp.x = S.x; pp.y = S.y; pp.moving = false; pp.facing = 1; }   // pinned in the seat, facing into the room / the table
    this.rescue(g);
    this.updateMeal(g, dt);
    this.updateDelivery(g, dt);
    // the cloud lets a slice go every so often, never more than a handful at a time
    st.spawnT -= dt;
    if (st.spawnT <= 0 && !st.full) { st.spawnT = C.rain.every; if (st.slices.length < C.rain.max) this.spawn(); }   // full: the cloud stops raining until the next visit
    const p = g.player, Z = C.catchZone, K = C.rain;
    for (let i = st.slices.length - 1; i >= 0; i--) {
      const s = st.slices[i];
      s.t += dt; s.ang += s.spin * dt;
      if (s.state === 'fall') {
        s.h -= K.fall * dt;
        s.x += (s.vx + Math.sin(s.t * 2.2 + s.ph) * K.sway) * dt;
        if (s.h <= 0) { s.h = 0; s.state = 'bounce'; s.vh = K.bounce; s.vx *= 0.5; }
      } else if (s.state === 'bounce') {
        s.h += s.vh * dt; s.vh -= K.gravity * dt; s.x += s.vx * dt; s.vx *= Math.max(0, 1 - 2.5 * dt);
        if (s.h <= 0) { s.h = 0; s.vh = 0; s.state = 'floor'; s.t = 0; s.spin = 0; st.landed++; }
      } else {
        if (s.t > K.floorFor) { s.a = Math.max(0, 1 - (s.t - K.floorFor) / K.fadeFor); if (s.a <= 0) { st.slices.splice(i, 1); st.faded++; continue; } }
      }
      s.x = U.clamp(s.x, R.x0 + 14, R.x1 - 14);
      // the chef: catch it (eat), or, when full, it bounces off
      if (Math.abs(s.x - p.x) < Z.dx && Math.abs(s.gy - p.y) < Z.dy && s.h <= Z.h) {
        if (!st.full) { st.slices.splice(i, 1); this.eat(g, s); continue; }
        if (!s.hit && s.state !== 'floor') {
          s.hit = true; s.state = 'bounce'; s.vh = K.bounce * 1.2; s.vx = (s.x >= p.x ? 1 : -1) * 90; s.spin = s.spin || 3;
          if (!st.burped) { st.burped = true; g.floats.push({ x: p.x, y: p.y - 64, text: 'Burp! 😅', color: '#ffe08a', t: 0, dur: 1.3, big: true }); }
        }
      }
    }
    for (let i = st.crumbs.length - 1; i >= 0; i--) { const c = st.crumbs[i]; c.t += dt; c.vy += 320 * dt; c.x += c.vx * dt; c.y += c.vy * dt; if (c.t > c.dur) st.crumbs.splice(i, 1); }
  },
  // a slice drops from the cloud's underside toward a spot on the floor (x, gy); h is its height above that spot
  spawn(x, gy, h) {
    const C = CFG.PIZZARAIN, R = C.ROOM, st = this.st, K = C.rain;
    if (x === undefined) x = U.rand(C.CLOUD.x - C.CLOUD.w / 2 + 12, C.CLOUD.x + C.CLOUD.w / 2 - 12);
    if (gy === undefined) gy = U.rand(R.y0 + 64, R.y1 - 26);
    if (h === undefined) h = Math.max(30, gy - (C.CLOUD.y + 38));
    const s = { x, gy, h, vh: 0, vx: U.rand(-K.drift, K.drift), ang: U.rand(0, Math.PI * 2), spin: U.rand(-1.8, 1.8), ph: U.rand(0, Math.PI * 2), state: 'fall', t: 0, a: 1, hit: false, id: ++st.spawned };
    st.slices.push(s);
    return s;
  },
  eat(g, s) {
    const st = this.st, C = CFG.PIZZARAIN, p = g.player, sv = this.state(g);
    st.eaten++; sv.eaten = (sv.eaten || 0) + 1; st.chew = C.chew;
    g.floats.push({ x: p.x, y: p.y - 66, text: 'Mmm! 🍕', color: '#ffe08a', t: 0, dur: 1.2, big: true });
    g.fx.push({ kind: 'sparkle', x0: p.x, y0: p.y - 34, x1: p.x, y1: p.y - 34, t: 0, dur: 0.5 });
    for (let i = 0; i < 7; i++) st.crumbs.push({ x: p.x + U.rand(-6, 6), y: p.y - 34, vx: U.rand(-60, 60), vy: U.rand(-120, -40), t: 0, dur: U.rand(0.5, 0.8), col: i % 3 ? '#d98a3c' : '#c0392b' });
    Sfx.pickup(); Haptics.tap();
    if (st.eaten >= C.full) {
      st.full = true;
      g.floats.push({ x: p.x, y: p.y - 94, text: "I'm full! 😋", color: '#ffe08a', t: 0.35, dur: 1.9, big: true });
      for (let i = 0; i < 5; i++) { const a = i * 1.26, rr = i ? 30 : 0; g.fx.push({ kind: 'sparkle', x0: p.x + Math.cos(a) * rr, y0: p.y - 34 + Math.sin(a) * rr * 0.6, x1: 0, y1: 0, t: -i * 0.08, dur: 0.8 }); }
      Haptics.success();
    }
  },

  // ---------- the armchair ----------
  sit(g) {
    const st = this.st, p = g.player, S = CFG.PIZZARAIN.CHAIR.sit, sv = this.state(g);
    st.seat = 'chair'; p.x = S.x; p.y = S.y; p.moving = false; p.facing = 1;
    sv.sits = (sv.sits || 0) + 1;
    g.floats.push({ x: p.x, y: p.y - 70, text: 'Ahh 😌', color: '#ffe08a', t: 0, dur: 1.5, big: true });
    Sfx.pickup(); Haptics.tap();
  },
  standUp(g) {
    const st = this.st, p = g.player, C = CFG.PIZZARAIN;
    if (st.seat === 'chair') { p.x = C.CHAIR.stand.x; p.y = C.CHAIR.stand.y; }   // step out in front of the chair (free floor)
    st.seat = null; p.moving = false; p.facing = 1; Sfx.drop();
  },

  // ---------- a meal at the side table: a slice off the carried stack, or the delivered pizza ----------
  eatAtTable(g) {
    const st = this.st, p = g.player, T = CFG.PIZZARAIN.TABLE;
    if (st.meal) return;
    let kind;
    if (this.pizzaWaiting()) kind = 'pizza';
    else if (p.carry > 0 && !st.plate) { p.carry--; st.plate = { kind: 'slice' }; kind = 'slice'; }   // one pizza off the stack: a slice on the plate
    else return;
    st.meal = { kind, t: 0, bites: 0, chomp: 0 };
    st.seat = 'table'; p.x = T.seat.x; p.y = T.seat.y; p.moving = false; p.facing = 1;
    Sfx.pickup(); Haptics.tap();
  },
  updateMeal(g, dt) {
    const st = this.st, m = st.meal; if (!m) return;
    const M = CFG.PIZZARAIN.meal, P = CFG.PIZZARAIN.TABLE.plate, p = g.player;
    m.t += dt; m.chomp = Math.max(0, m.chomp - dt);
    while (m.bites < M.bites.length && m.t >= M.bites[m.bites]) {
      m.bites++; m.chomp = 0.3;
      g.floats.push({ x: p.x + U.rand(-6, 6), y: p.y - 66, text: 'nom', color: '#fff', t: 0, dur: 0.9, big: false });
      for (let i = 0; i < 5; i++) st.crumbs.push({ x: P.x + U.rand(-6, 6), y: P.y - 4, vx: U.rand(-50, 50), vy: U.rand(-90, -30), t: 0, dur: U.rand(0.4, 0.7), col: i % 3 ? '#d98a3c' : '#c0392b' });
    }
    if (m.t >= M.dur) {
      st.meal = null; st.plate = null; st.seat = null;   // the plate is empty again; the chef stays on the stool spot (free floor)
      const sv = this.state(g); sv.meals = (sv.meals || 0) + 1;
      g.floats.push({ x: p.x, y: p.y - 80, text: 'Delicious! 😋', color: '#ffe08a', t: 0, dur: 1.8, big: true });
      g.fx.push({ kind: 'sparkle', x0: p.x, y0: p.y - 36, x1: p.x, y1: p.y - 36, t: 0, dur: 0.6 });
      Haptics.success();
    }
  },
  // how much is left on the plate (1 = untouched, 0 = all gone)
  plateLeft() { const st = this.st; if (!st.plate) return 0; if (!st.meal) return 1; return 1 - st.meal.bites / CFG.PIZZARAIN.meal.bites.length; },

  // ---------- the landline and the delivery ----------
  order(g) {
    const st = this.st, p = g.player;
    if (this.pizzaWaiting()) { g.floats.push({ x: p.x, y: p.y - 70, text: 'Your pizza is already here! 🍕', color: '#ffe08a', t: 0, dur: 1.6, big: true }); return; }
    if (st.del) { g.floats.push({ x: p.x, y: p.y - 70, text: 'Your pizza is on its way! 🍕', color: '#ffe08a', t: 0, dur: 1.6, big: true }); return; }
    const sv = this.state(g); sv.orders = (sv.orders || 0) + 1;
    st.del = { phase: 'call', t: 0, total: 0, x: 0, y: 0, wp: 0, facing: 1, moving: false, bob: 0, placed: false, lid: 0 };
    p.facing = -1;   // turn to the phone
    Sfx.pickup(); Haptics.tap();
  },
  updateDelivery(g, dt) {
    const st = this.st, d = st.del, C = CFG.PIZZARAIN, D = C.DELIVERY, path = D.path;
    const dpos = { x: path[0][0], y: path[0][1] };
    // the door swings open while the delivery person is in or near the doorway
    const open = !!d && (d.phase === 'open' || ((d.phase === 'in' || d.phase === 'out') && U.dist(d.x, d.y, dpos.x, dpos.y) < 70));
    st.door = U.clamp(st.door + (open ? 1 : -1) * D.door * dt, 0, 1);
    if (!d) return;
    d.t += dt; d.total += dt;
    const walk = (i) => { const w = path[i]; d.moving = true; d.bob += dt * 12; if (Math.abs(w[0] - d.x) > 1) d.facing = w[0] < d.x ? -1 : 1; return U.moveToward(d, w[0], w[1], D.speed, dt); };
    switch (d.phase) {
      case 'call':   // ring ring, "One pizza please!", hang up (early if the chef walks off)
        if (d.t >= D.call || !this.near(g, C.PHONE.spot, 60)) { d.phase = 'wait'; d.t = 0; }
        break;
      case 'wait':
        if (d.total >= D.arrive) { d.phase = 'open'; d.t = 0; d.x = dpos.x; d.y = dpos.y; d.facing = 1; }
        break;
      case 'open':
        if (st.door >= 1) { d.phase = 'in'; d.t = 0; d.wp = 1; }
        break;
      case 'in':
        if (walk(d.wp)) { d.wp++; if (d.wp >= path.length) { d.phase = 'serve'; d.t = 0; d.moving = false; d.facing = C.TABLE.plate.x < d.x ? -1 : 1; } }
        break;
      case 'serve':   // open the box, slide the pizza onto the plate ("Here you go!"); wait if the chef is still eating a slice
        d.moving = false;
        if (!d.placed && (st.meal || st.plate)) { d.t = 0; break; }
        d.lid = Math.min(1, d.t / 0.35);
        if (!d.placed && d.t >= D.place) { d.placed = true; st.plate = { kind: 'pizza' }; st.delivered++; Sfx.ding(); }
        if (d.t >= D.serve) { d.phase = 'wave'; d.t = 0; }
        break;
      case 'wave':
        d.lid = Math.max(0, 1 - d.t / 0.35);
        if (d.t >= D.wave) { d.phase = 'out'; d.t = 0; d.wp = path.length - 2; }
        break;
      case 'out':
        if (walk(d.wp)) { d.wp--; if (d.wp < 0) { d.phase = 'close'; d.t = 0; d.moving = false; } }
        break;
      case 'close':   // gone through the door; it swings shut
        if (st.door <= 0) st.del = null;
        break;
    }
  },

  // ======================= render hooks =======================
  paint: { pizzarain(r, g) { PizzaRainExt.paintRoom(r, g); } },
  // the door to the pizza room, painted onto the bedroom's east wall, with its sign and the mat on the floor
  paintAfter(r, g, area) {
    if (area !== 'upstairs') return;
    const ctx = r.ctx, C = CFG.PIZZARAIN, D = C.DOOR_OUT, M = C.MAT_OUT;
    this.paintDoor(r, D, 1);
    this.paintMat(ctx, M.x, M.y);
    // the pizza sign over the door, hanging out from the wall
    const sx = (D.x0 + D.x1) / 2, sy = D.y0 - 16;
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(sx - 1.5, sy + 8, 3, 8);
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(sx, sy, 12, 0, Math.PI * 2); ctx.fill();
    r.drawPizza(sx, sy, 9.5);
  },
  // a bright yellow door with a round window and a pizza-coloured frame; dir 1 = the door's wall is to the right of the room
  paintDoor(r, D, dir) {
    const ctx = r.ctx, w = D.x1 - D.x0, h = D.y1 - D.y0, cx = (D.x0 + D.x1) / 2;
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, D.x0 - 3, D.y0 - 3, w + 6, h + 6, 4); ctx.fill();   // the frame
    ctx.fillStyle = '#f2b134'; U.roundRect(ctx, D.x0, D.y0, w, h, 3); ctx.fill();                    // the door
    ctx.fillStyle = '#ffd166'; U.roundRect(ctx, D.x0 + 4, D.y0 + 22, w - 8, h - 28, 2); ctx.fill();  // the lower panel
    ctx.fillStyle = '#fff8ee'; ctx.beginPath(); ctx.arc(cx, D.y0 + 11, 6.5, 0, Math.PI * 2); ctx.fill();   // the round window
    ctx.fillStyle = '#9fe0ff'; ctx.beginPath(); ctx.arc(cx, D.y0 + 11, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(cx - dir * 7, D.y0 + h * 0.56, 2.2, 0, Math.PI * 2); ctx.fill();   // the knob, on the room side
  },
  // the white plate with its blue rim and little blue dots
  paintPlate(ctx, x, y) {
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(x + 1, y + 2, 15, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(x, y, 15, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2f6fd0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y, 13.5, 8.8, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#8fb8ef'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, y, 9.5, 6, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#2f6fd0'; for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 11.6, y + Math.sin(a) * 7.5, 0.9, 0, Math.PI * 2); ctx.fill(); }
  },
  paintMat(ctx, x, y) {
    ctx.fillStyle = 'rgba(0,0,0,0.14)'; U.roundRect(ctx, x - 14, y - 5, 30, 14, 4); ctx.fill();
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, x - 15, y - 7, 30, 14, 4); ctx.fill();
    ctx.fillStyle = '#ffd166'; ctx.fillRect(x - 11, y - 4, 22, 2); ctx.fillRect(x - 11, y + 2, 22, 2);
    ctx.fillStyle = '#fff8ee'; ctx.beginPath(); ctx.arc(x, y, 2.6, 0, Math.PI * 2); ctx.fill();
  },
  // ---------- the pizza room ----------
  paintRoom(r, g) {
    const ctx = r.ctx, C = CFG.PIZZARAIN, W = C.WORLD, R = C.ROOM, w = C.WALL, cx = (R.x0 + R.x1) / 2;
    // the dark of the attic outside the walls
    ctx.fillStyle = '#1f1611'; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    // the slanted ceiling: rows of planks climbing away into the dark, rafters leaning in toward the ridge
    const ch = R.y0 - W.y0, rows = 9;
    for (let i = 0; i < rows; i++) {
      const k = i / rows, y1 = R.y0 - k * ch, y0 = R.y0 - ((i + 1) / rows) * ch, mix = 1 - k * 0.6;
      ctx.fillStyle = `rgb(${Math.round(150 * mix)},${Math.round(100 * mix)},${Math.round(55 * mix)})`; ctx.fillRect(W.x0, y0, W.x1 - W.x0, y1 - y0 + 1);
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(W.x0, y1 - 1.5, W.x1 - W.x0, 1.5);
    }
    ctx.fillStyle = '#3a2314';
    for (let i = 0; i <= 8; i++) {
      const xb = R.x0 - w + i * ((R.x1 - R.x0 + 2 * w) / 8), xt = cx + (xb - cx) * 0.82;
      ctx.beginPath(); ctx.moveTo(xb - 6, R.y0); ctx.lineTo(xb + 6, R.y0); ctx.lineTo(xt + 4, W.y0); ctx.lineTo(xt - 4, W.y0); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(W.x0, R.y0 - 7, W.x1 - W.x0, 7);   // the wall plate along the bottom of the slope
    // the round attic window in the slope, with the sky in it
    const Wn = C.WINDOW;
    ctx.fillStyle = '#fff8ee'; ctx.beginPath(); ctx.arc(Wn.x, Wn.y, Wn.r + 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5b3a1a'; ctx.beginPath(); ctx.arc(Wn.x, Wn.y, Wn.r + 1, 0, Math.PI * 2); ctx.fill();
    const sky = ctx.createLinearGradient(0, Wn.y - Wn.r, 0, Wn.y + Wn.r); sky.addColorStop(0, '#4fb0ea'); sky.addColorStop(1, '#c9ecff');
    ctx.fillStyle = sky; ctx.beginPath(); ctx.arc(Wn.x, Wn.y, Wn.r - 2, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(Wn.x, Wn.y, Wn.r - 2, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(Wn.x - 8, Wn.y + 4, 7, 0, Math.PI * 2); ctx.arc(Wn.x, Wn.y, 9, 0, Math.PI * 2); ctx.arc(Wn.x + 9, Wn.y + 4, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff7c2'; ctx.beginPath(); ctx.arc(Wn.x + 12, Wn.y - 14, 6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#fff8ee'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(Wn.x - Wn.r, Wn.y); ctx.lineTo(Wn.x + Wn.r, Wn.y); ctx.moveTo(Wn.x, Wn.y - Wn.r); ctx.lineTo(Wn.x, Wn.y + Wn.r); ctx.stroke();
    // the fairy lights: a sagging wire with bright bulbs (their glow twinkles live)
    const L = C.LIGHTS;
    ctx.strokeStyle = 'rgba(30,20,10,0.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(R.x0 - w, L.y); ctx.quadraticCurveTo(cx, L.y + L.sag * 2, R.x1 + w, L.y); ctx.stroke();
    for (let i = 0; i < L.n; i++) { const b = this.bulb(i); ctx.fillStyle = '#5b3a1a'; ctx.fillRect(b.x - 1.5, b.y - 4, 3, 4); ctx.fillStyle = PIZZARAIN_BULBS[i % PIZZARAIN_BULBS.length]; ctx.beginPath(); ctx.arc(b.x, b.y + 3, 4, 0, Math.PI * 2); ctx.fill(); }
    // walls: warm wood panelling
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, w); ctx.fillRect(R.x0 - w, R.y0, w, R.y1 - R.y0); ctx.fillRect(R.x1, R.y0, w, R.y1 - R.y0);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = R.x0 - w; x < R.x1 + w; x += 16) ctx.fillRect(x, R.y1, 2, w); for (let y = R.y0; y < R.y1; y += 16) { ctx.fillRect(R.x0 - w, y, w, 2); ctx.fillRect(R.x1, y, w, 2); }
    // the wooden floor
    for (let y = R.y0; y < R.y1; y += 18) {
      const row = Math.floor((y - R.y0) / 18), hh = Math.min(18, R.y1 - y);
      ctx.fillStyle = row % 2 ? '#d4a86f' : '#cfa166'; ctx.fillRect(R.x0, y, R.x1 - R.x0, hh);
      ctx.strokeStyle = 'rgba(80,40,10,0.18)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(R.x0, y + 0.5); ctx.lineTo(R.x1, y + 0.5); ctx.stroke();
      for (let k = 0; k < 3; k++) { const px = R.x0 + ((row * 97 + k * 173) % (R.x1 - R.x0)); ctx.fillRect(px, y, 1.5, hh); }
    }
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, 5);   // the ceiling's shadow on the floor
    // the pizza rug: a big round pizza with a crust rim, cheese, pepperoni and basil
    const G = C.RUG;
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(G.x + 3, G.y + 5, G.rx, G.ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d98a3c'; ctx.beginPath(); ctx.ellipse(G.x, G.y, G.rx, G.ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8a254'; ctx.beginPath(); ctx.ellipse(G.x, G.y, G.rx - 6, G.ry - 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.ellipse(G.x, G.y, G.rx - 14, G.ry - 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f6c453'; ctx.beginPath(); ctx.ellipse(G.x, G.y, G.rx - 19, G.ry - 15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(217,138,60,0.5)'; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(G.x + Math.cos(a) * (G.rx - 19), G.y + Math.sin(a) * (G.ry - 15)); ctx.lineTo(G.x - Math.cos(a) * (G.rx - 19), G.y - Math.sin(a) * (G.ry - 15)); ctx.stroke(); }
    ctx.fillStyle = '#c0392b'; for (let i = 0; i < 8; i++) { const a = i * 0.785 + 0.4, rr = i % 2 ? 0.62 : 0.3; ctx.beginPath(); ctx.arc(G.x + Math.cos(a) * (G.rx - 19) * rr, G.y + Math.sin(a) * (G.ry - 15) * rr, 7, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#3f9a4a'; for (let i = 0; i < 4; i++) { const a = i * 1.57 + 1.1; ctx.beginPath(); ctx.ellipse(G.x + Math.cos(a) * 44, G.y + Math.sin(a) * 24, 7, 4, a, 0, Math.PI * 2); ctx.fill(); }
    // the comfy armchair: round and soft, a cushion and a blanket over the arm
    const Ch = C.CHAIR;
    ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.beginPath(); ctx.ellipse(Ch.x + 3, Ch.y + 8, 36, 24, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b23a48'; U.roundRect(ctx, Ch.x - 32, Ch.y - 30, 64, 56, 18); ctx.fill();
    ctx.fillStyle = '#8a2a36'; U.roundRect(ctx, Ch.x - 32, Ch.y - 30, 64, 18, 10); ctx.fill();   // the back
    ctx.fillStyle = '#c94a58'; U.roundRect(ctx, Ch.x - 20, Ch.y - 12, 40, 30, 10); ctx.fill();   // the seat
    ctx.fillStyle = '#8a2a36'; U.roundRect(ctx, Ch.x - 34, Ch.y - 14, 14, 36, 7); ctx.fill(); U.roundRect(ctx, Ch.x + 20, Ch.y - 14, 14, 36, 7); ctx.fill();   // the arms
    ctx.fillStyle = '#ffd166'; U.roundRect(ctx, Ch.x - 12, Ch.y - 8, 24, 18, 6); ctx.fill(); ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(Ch.x, Ch.y + 1, 4, 0, Math.PI * 2); ctx.fill();   // a pizza cushion
    ctx.fillStyle = '#4aa3d8'; U.roundRect(ctx, Ch.x + 18, Ch.y - 10, 18, 22, 4); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; for (let k = 0; k < 3; k++) ctx.fillRect(Ch.x + 20, Ch.y - 6 + k * 7, 14, 2);   // the blanket
    // a little side table with the white-and-blue plate, a napkin and a glass of juice, and a stool on its west side
    const T = C.TABLE, Pl = T.plate, Sd = T.seat;
    ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.beginPath(); ctx.ellipse(T.x + 3, T.y + 11, 30, 17, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9b6531'; ctx.beginPath(); ctx.ellipse(T.x, T.y + 6, 28, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c99a5f'; ctx.beginPath(); ctx.ellipse(T.x, T.y, 28, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(T.x, T.y, 23, 14, 0, Math.PI * 1.1, Math.PI * 1.6); ctx.stroke();
    this.paintPlate(ctx, Pl.x, Pl.y);
    ctx.fillStyle = '#ff8fab'; ctx.fillRect(T.x + 10, T.y - 9, 9, 9); ctx.fillStyle = '#ffa94d'; U.roundRect(ctx, T.x + 13, T.y - 6, 7, 10, 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(T.x + 14, T.y - 5, 2, 7);
    // the stool: a round red seat on three legs
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(Sd.x + 2, Sd.y + 4, 13, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(Sd.x - 9, Sd.y - 6, 3, 10); ctx.fillRect(Sd.x + 6, Sd.y - 6, 3, 10); ctx.fillRect(Sd.x - 1.5, Sd.y - 4, 3, 9);
    ctx.fillStyle = '#a32f3c'; ctx.beginPath(); ctx.ellipse(Sd.x, Sd.y - 5, 12, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.ellipse(Sd.x, Sd.y - 7, 12, 6, 0, 0, Math.PI * 2); ctx.fill();
    // the little wall shelf for the telephone (the phone itself is drawn live: its receiver lifts)
    const Ph = C.PHONE;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(R.x0, Ph.y + 6, 26, 6);
    ctx.fillStyle = '#5b3a1a'; ctx.beginPath(); ctx.moveTo(R.x0, Ph.y + 4); ctx.lineTo(R.x0 + 12, Ph.y + 4); ctx.lineTo(R.x0, Ph.y + 14); ctx.closePath(); ctx.fill();   // the bracket
    ctx.fillStyle = '#b07a3e'; U.roundRect(ctx, R.x0 - 4, Ph.y - 12, 30, 16, 3); ctx.fill();
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(R.x0 - 4, Ph.y + 1, 30, 4);
    // the floor lamp and the potted plant by the top corners
    const Lp = C.LAMP;
    ctx.fillStyle = 'rgba(255,224,138,0.22)'; ctx.beginPath(); ctx.arc(Lp.x, Lp.y + 4, 44, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5b3a1a'; ctx.beginPath(); ctx.ellipse(Lp.x, Lp.y + 8, 10, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(Lp.x - 1.5, Lp.y - 20, 3, 28);
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.moveTo(Lp.x - 16, Lp.y - 6); ctx.lineTo(Lp.x + 16, Lp.y - 6); ctx.lineTo(Lp.x + 9, Lp.y - 26); ctx.lineTo(Lp.x - 9, Lp.y - 26); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e4572e'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(Lp.x - 8 + k * 8, Lp.y - 15, 2.2, 0, Math.PI * 2); ctx.fill(); }
    const P = C.PLANT;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(P.x + 2, P.y + 8, 14, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c45c2e'; U.roundRect(ctx, P.x - 10, P.y - 4, 20, 14, 3); ctx.fill(); ctx.fillStyle = '#e07a4a'; ctx.fillRect(P.x - 12, P.y - 6, 24, 4);
    ctx.fillStyle = '#3f9a4a'; for (const [dx, dy, rr] of [[-8, -12, 7], [8, -12, 7], [0, -18, 8], [-4, -7, 6], [5, -6, 6]]) { ctx.beginPath(); ctx.arc(P.x + dx, P.y + dy, rr, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#56b862'; ctx.beginPath(); ctx.arc(P.x - 2, P.y - 18, 4, 0, Math.PI * 2); ctx.fill();
    // cushions on the floor by the chair, and a stack of empty pizza boxes in the corner
    for (const [x, y, col] of [[5170, 4330, '#3b7dd8'], [5196, 4318, '#41b883']]) { ctx.fillStyle = 'rgba(0,0,0,0.12)'; U.roundRect(ctx, x - 11, y - 6, 26, 16, 6); ctx.fill(); ctx.fillStyle = col; U.roundRect(ctx, x - 13, y - 9, 26, 16, 6); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(x, y - 1, 3, 0, Math.PI * 2); ctx.fill(); }
    for (let k = 0; k < 3; k++) { const bx = 5532, by = 4334 - k * 7; ctx.fillStyle = k % 2 ? '#e8d2a8' : '#dcc396'; U.roundRect(ctx, bx - 16, by - 8, 32, 10, 2); ctx.fill(); ctx.fillStyle = '#e4572e'; ctx.fillRect(bx - 5, by - 5, 10, 3); }
    // the door back to the bedroom (west wall), its bed sign and the mat inside
    this.paintDoor(r, C.DOOR_IN, -1);
    const D = C.DOOR_IN, sx = (D.x0 + D.x1) / 2;
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, sx - 13, D.y0 - 24, 26, 18, 4); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🛏️', sx, D.y0 - 15);
    this.paintMat(ctx, C.EXIT.x, C.EXIT.y);
    // the room's name plate on the bottom wall
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, cx - 62, R.y1 + 5, 124, 16, 5); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🍕 THE PIZZA RAIN ROOM 🍕', cx, R.y1 + 13);
  },
  // where the i-th fairy light hangs on its sagging wire
  bulb(i) {
    const C = CFG.PIZZARAIN, R = C.ROOM, w = C.WALL, L = C.LIGHTS, k = (i + 0.5) / L.n, u = 1 - k, x0 = R.x0 - w, x1 = R.x1 + w, cx = (R.x0 + R.x1) / 2;
    return { x: u * u * x0 + 2 * u * k * cx + k * k * x1, y: u * u * L.y + 2 * u * k * (L.y + L.sag * 2) + k * k * L.y };
  },
  // one pizza slice: a cheesy triangle pointing down (+y) with a crust along the top and pepperoni on it
  drawSlice(ctx, x, y, ang, s, a) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s); ctx.globalAlpha = a;
    ctx.fillStyle = '#f6c453'; ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(-9.5, -6); ctx.quadraticCurveTo(0, -10.5, 9.5, -6); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#d98a3c'; ctx.lineWidth = 3.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-9, -6.2); ctx.quadraticCurveTo(0, -10.8, 9, -6.2); ctx.stroke();
    ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(-3.2, -2.5, 2, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(3.4, -1, 2, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(0.2, 4, 1.7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.ellipse(-2, -5, 2.6, 1.1, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },
  // the glow of the fairy lights and the big fluffy pizza-cloud, bobbing under the ceiling (under the people and the slices)
  dynamic(r, g) {
    if (g.area !== 'pizzarain') return;
    const ctx = r.ctx, C = CFG.PIZZARAIN, t = g.time, L = C.LIGHTS;
    for (let i = 0; i < L.n; i++) { const b = this.bulb(i), tw = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.9); ctx.globalAlpha = 0.18 + 0.3 * tw; ctx.fillStyle = PIZZARAIN_BULBS[i % PIZZARAIN_BULBS.length]; ctx.beginPath(); ctx.arc(b.x, b.y + 3, 8 + tw * 4, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
    const cx = C.CLOUD.x, cy = C.CLOUD.y + Math.sin(t * 1.1) * 3;
    ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.beginPath(); ctx.ellipse(cx + 6, cy + 48, 104, 12, 0, 0, Math.PI * 2); ctx.fill();   // its shadow on the floor's edge
    // the pizza underside: a crust rim, cheese, pepperoni, and cheese drips about to let go
    ctx.fillStyle = '#d98a3c'; ctx.beginPath(); ctx.ellipse(cx, cy + 24, 104, 17, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f6c453'; ctx.beginPath(); ctx.ellipse(cx, cy + 22, 92, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c0392b'; for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.arc(cx - 72 + i * 24, cy + 24 + (i % 2) * 4, 4, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#f6c453'; for (let i = 0; i < 5; i++) { const dx = -60 + i * 30, dr = 2 + (Math.sin(t * 1.6 + i * 1.3) + 1) * 2; ctx.beginPath(); ctx.ellipse(cx + dx, cy + 36 + dr, 3.5, 3.5 + dr, 0, 0, Math.PI * 2); ctx.fill(); }
    // the fluffy top: white puffs with a cream underside and a happy face
    for (const [dx, dy, rr] of PIZZARAIN_PUFFS) { ctx.fillStyle = '#fff2d8'; ctx.beginPath(); ctx.arc(cx + dx, cy + dy + 6, rr, 0, Math.PI * 2); ctx.fill(); }
    for (const [dx, dy, rr] of PIZZARAIN_PUFFS) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(cx + dx, cy + dy, rr - 3, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(cx - 16, cy - 2, 3, 0, Math.PI * 2); ctx.arc(cx + 16, cy - 2, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,143,171,0.6)'; ctx.beginPath(); ctx.arc(cx - 26, cy + 6, 5, 0, Math.PI * 2); ctx.arc(cx + 26, cy + 6, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(cx, cy + 2, 9, 0.3, Math.PI - 0.3); ctx.stroke();
    if (this.st && this.st.door > 0) this.drawDoorOpen(ctx, this.st.door);
  },
  // the door back to the bedroom swung open (it folds toward its hinge on the wall side), the warm bedroom light in the
  // doorway and spilling onto the floor
  drawDoorOpen(ctx, k) {
    const C = CFG.PIZZARAIN, D = C.DOOR_IN, R = C.ROOM, w = D.x1 - D.x0, h = D.y1 - D.y0;
    ctx.fillStyle = '#ffe6b0'; U.roundRect(ctx, D.x0, D.y0, w, h, 3); ctx.fill();
    ctx.fillStyle = '#f5c97a'; ctx.fillRect(D.x0, D.y1 - 12, w, 12);   // the bedroom floor beyond
    ctx.fillStyle = `rgba(255,230,170,${(0.32 * k).toFixed(3)})`; ctx.beginPath(); ctx.moveTo(R.x0, D.y0 + 4); ctx.lineTo(R.x0 + 50 * k + 6, D.y0 - 6); ctx.lineTo(R.x0 + 50 * k + 6, D.y1 + 10); ctx.lineTo(R.x0, D.y1); ctx.closePath(); ctx.fill();
    const pw = Math.max(3, w * (1 - 0.82 * k)), skew = 6 * k;   // the panel, seen edge-on as it swings
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(D.x0, D.y0); ctx.lineTo(D.x0 + pw, D.y0 - skew); ctx.lineTo(D.x0 + pw, D.y1 + skew); ctx.lineTo(D.x0, D.y1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f2b134'; ctx.beginPath(); ctx.moveTo(D.x0 + 1, D.y0 + 2); ctx.lineTo(D.x0 + pw - 1, D.y0 + 2 - skew); ctx.lineTo(D.x0 + pw - 1, D.y1 - 2 + skew); ctx.lineTo(D.x0 + 1, D.y1 - 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(D.x0 + pw - 3, D.y0 + h * 0.56, 1.8, 0, Math.PI * 2); ctx.fill();
  },
  // the slices (in the air and on the floor), each sorted by the spot under it, and the chef chewing
  entities(r, g, items) {
    if (!this.st || g.area !== 'pizzarain') return;
    const ctx = r.ctx, st = this.st, p = g.player, C = CFG.PIZZARAIN;
    for (const s of st.slices) items.push({ y: s.gy, draw: () => {
      const sh = U.clamp(1 - s.h / 320, 0.25, 1);
      ctx.fillStyle = `rgba(0,0,0,${(0.2 * sh * s.a).toFixed(2)})`; ctx.beginPath(); ctx.ellipse(s.x, s.gy + 2, 8 * sh + 3, 3.5 * sh + 1.2, 0, 0, Math.PI * 2); ctx.fill();
      this.drawSlice(ctx, s.x, s.gy - s.h, s.ang, 1.15, s.a);
    } });
    if (st.chew > 0) items.push({ y: p.y + 0.5, draw: () => {
      const k = 1 - st.chew / C.chew, f = p.facing || 1, bob = Math.sin(g.time * 22) * 1.5;
      ctx.fillStyle = 'rgba(255,143,171,0.55)'; ctx.beginPath(); ctx.arc(p.x - 7, p.y - 35 + bob, 2.8, 0, Math.PI * 2); ctx.arc(p.x + 7, p.y - 35 + bob, 2.8, 0, Math.PI * 2); ctx.fill();   // rosy cheeks
      if (k < 0.7) this.drawSlice(ctx, p.x + f * 9, p.y - 33 + bob, f * 1.2, 1.1 - k, 1);   // the slice going in, bite by bite
      ctx.fillStyle = '#fff'; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(43,29,20,0.7)';
      const nom = k < 0.5 ? 'nom nom' : 'yum!'; ctx.strokeText(nom, p.x, p.y - 58 - bob); ctx.fillText(nom, p.x, p.y - 58 - bob);
    } });
    // the telephone on its wall shelf, the food on the plate, the delivery person
    items.push({ y: C.PHONE.y + 8, draw: () => this.drawPhone(ctx, g) });
    if (st.plate) items.push({ y: C.TABLE.y + 1, draw: () => this.drawPlateFood(r, ctx) });
    const d = st.del;
    if (d && ['open', 'in', 'serve', 'wave', 'out'].includes(d.phase)) items.push({ y: d.y, draw: () => this.drawCourier(r, ctx, g, d) });
    // sitting: the armchair's arms and seat front (or the stool's seat) in front of the chef's legs
    if (st.seat === 'chair') items.push({ y: p.y + 0.5, draw: () => {
      const Ch = C.CHAIR;
      ctx.fillStyle = '#c94a58'; U.roundRect(ctx, Ch.x - 21, Ch.y + 2, 42, 17, 7); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(Ch.x - 19, Ch.y + 14, 38, 3);
      ctx.fillStyle = '#8a2a36'; U.roundRect(ctx, Ch.x - 34, Ch.y - 14, 14, 36, 7); ctx.fill(); U.roundRect(ctx, Ch.x + 20, Ch.y - 14, 14, 36, 7); ctx.fill();
      ctx.fillStyle = '#4aa3d8'; U.roundRect(ctx, Ch.x + 18, Ch.y - 10, 18, 22, 4); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; for (let k = 0; k < 3; k++) ctx.fillRect(Ch.x + 20, Ch.y - 6 + k * 7, 14, 2);
    } });
    if (st.seat === 'table') items.push({ y: p.y + 0.5, draw: () => {
      const Sd = C.TABLE.seat;
      ctx.fillStyle = '#a32f3c'; ctx.beginPath(); ctx.ellipse(Sd.x, Sd.y - 3, 13, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.ellipse(Sd.x, Sd.y - 5, 13, 6, 0, 0, Math.PI * 2); ctx.fill();
    } });
    if (st.meal) items.push({ y: p.y + 0.6, draw: () => {
      const m = st.meal, bob = m.chomp > 0 ? Math.sin(g.time * 30) * 1.2 : 0;
      ctx.fillStyle = 'rgba(255,143,171,0.6)'; ctx.beginPath(); ctx.arc(p.x - 4, p.y - 34 + bob, 2.8, 0, Math.PI * 2); ctx.arc(p.x + 10, p.y - 34 + bob, 2.8, 0, Math.PI * 2); ctx.fill();   // rosy cheeks
      if (m.chomp > 0) this.drawSlice(ctx, p.x + 13, p.y - 30 + bob, -Math.PI / 2 - 0.3, 0.55, 1);   // the bite on its way in
    } });
  },
  // the old corded telephone: a red body with a cream dial and the receiver on its cradle (it shakes when it rings)
  drawPhone(ctx, g) {
    const Ph = CFG.PIZZARAIN.PHONE, d = this.st.del, ringing = d && d.phase === 'call' && d.t < 0.7;
    const x = Ph.x + (ringing ? Math.sin(g.time * 70) * 1.3 : 0), y = Ph.y;
    const lifted = this.receiverLifted(g);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(x + 1, y + 1, 12, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.lineTo(x + 12, y); ctx.lineTo(x + 8, y - 12); ctx.lineTo(x - 8, y - 12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#b8401c'; ctx.fillRect(x - 12, y - 2, 24, 2);
    ctx.fillStyle = '#fff4dc'; ctx.beginPath(); ctx.arc(x, y - 6, 4.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + i * 1.05; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 3, y - 6 + Math.sin(a) * 3, 0.7, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#b8401c'; ctx.fillRect(x - 9, y - 15, 3, 4); ctx.fillRect(x + 6, y - 15, 3, 4);   // the cradle's prongs
    if (!lifted) {
      this.drawReceiver(ctx, x, y - 16, Math.PI / 2);
      ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.2; ctx.beginPath();
      for (let i = 0; i <= 14; i++) { const k = i / 14, cx = x - 12 - Math.sin(k * Math.PI) * 5 + Math.sin(k * 40) * 1.4, cy = y - 15 + k * 12; if (i) ctx.lineTo(cx, cy); else ctx.moveTo(cx, cy); }
      ctx.stroke();
    }
    if (ringing) { ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.6; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(x, y - 10, 15, sx < 0 ? Math.PI * 0.95 : -0.35, sx < 0 ? Math.PI * 1.35 : 0.05); ctx.stroke(); } }
  },
  // the handset: a curved bar with an earpiece and a mouthpiece; ang 0 = standing up, PI/2 = lying across
  drawReceiver(ctx, x, y, ang) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.fillStyle = '#c0392b'; U.roundRect(ctx, -2.5, -9, 5, 18, 2.5); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, -9, 4.2, 3, 0, 0, Math.PI * 2); ctx.ellipse(0, 9, 4.2, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-1.5, -6, 1.2, 12);
    ctx.restore();
  },
  receiverLifted(g) { const d = this.st && this.st.del; return !!(d && d.phase === 'call' && d.t >= 0.5 && this.near(g, CFG.PIZZARAIN.PHONE.spot, 60)); },
  // what is on the plate: a slice or a whole pepperoni pizza, smaller with each bite (bite marks and crumbs)
  drawPlateFood(r, ctx) {
    const st = this.st, P = CFG.PIZZARAIN.TABLE.plate, left = this.plateLeft(), plateCol = '#ffffff';
    if (left <= 0) return;
    ctx.save(); ctx.translate(P.x, P.y); ctx.scale(1, 0.78);
    if (st.plate.kind === 'pizza') {
      const rr = 11, a1 = Math.PI * 3, a0 = a1 - left * Math.PI * 2;
      ctx.save(); if (left < 1) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, rr + 1, a0, a1); ctx.closePath(); ctx.clip(); }
      r.drawPizza(0, 0, rr);
      ctx.fillStyle = '#c0392b'; for (let i = 0; i < 4; i++) { const a = i * 1.57 + 0.9; ctx.beginPath(); ctx.arc(Math.cos(a) * 5.5, Math.sin(a) * 5.5, 1.8, 0, Math.PI * 2); ctx.fill(); }   // extra pepperoni
      ctx.strokeStyle = 'rgba(160,90,30,0.45)'; ctx.lineWidth = 0.8; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); ctx.lineTo(-Math.cos(a) * rr, -Math.sin(a) * rr); ctx.stroke(); }
      ctx.restore();
      if (left < 1) { ctx.fillStyle = plateCol; for (const k of [0.45, 0.8]) { ctx.beginPath(); ctx.arc(Math.cos(a0 + 0.18) * rr * k, Math.sin(a0 + 0.18) * rr * k, 2.4, 0, Math.PI * 2); ctx.fill(); } }
    } else {
      ctx.rotate(Math.PI / 2);   // the tip points at the chef on the stool (west)
      const cut = 12 - (1 - left) * 19;
      ctx.save(); ctx.beginPath(); ctx.rect(-14, -14, 28, cut + 14); ctx.clip(); this.drawSlice(ctx, 0, 0, 0, 1, 1); ctx.restore();
      if (left < 1) { ctx.fillStyle = plateCol; for (const bx of [-5, 0, 5]) { ctx.beginPath(); ctx.arc(bx * (0.4 + 0.6 * (cut + 10) / 22), cut + 0.5, 2.6, 0, Math.PI * 2); ctx.fill(); } }
    }
    ctx.restore();
    if (left < 1) { ctx.fillStyle = '#d98a3c'; for (const [dx, dy] of [[-12, 5], [-9, -4], [10, 5], [-14, 0], [6, -6]]) { ctx.beginPath(); ctx.arc(P.x + dx, P.y + dy, 1.1, 0, Math.PI * 2); ctx.fill(); } }   // crumbs on the plate
  },
  // the delivery person: a red cap, a pizza box held in front (opened at the table), a wave goodbye
  drawCourier(r, ctx, g, d) {
    const D = CFG.PIZZARAIN.DELIVERY, P = CFG.PIZZARAIN.TABLE.plate, f = d.facing;
    r.drawPerson(d.x, d.y, { shirt: '#3b7dd8', pants: '#2d3a4a', skin: '#c68642', hat: 'cap', capColor: '#d62828', facing: f, moving: d.moving, bob: d.bob, carry: 0, stripes: false });
    const bob = d.moving ? Math.sin(d.bob) * 2 : 0, bx = d.x + f * 19, by = d.y - 17 + bob, k = d.lid;   // held out to the side, clear of the face
    // the box: its front side, then either the closed lid or the open box with its lid standing up behind
    ctx.fillStyle = '#d9b98a'; ctx.fillRect(bx - 15, by + 5, 30, 4);
    if (k <= 0.02) {
      ctx.fillStyle = '#f6e7c8'; U.roundRect(ctx, bx - 15, by - 9, 30, 14, 2); ctx.fill(); ctx.strokeStyle = '#d9b98a'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(bx, by - 2, 5, 0, Math.PI * 2); ctx.fill(); r.drawPizza(bx, by - 2, 3.4);
    } else {
      ctx.fillStyle = '#f6e7c8'; U.roundRect(ctx, bx - 15, by - 9 - 15 * k, 30, 15 * k, 2); ctx.fill(); ctx.strokeStyle = '#d9b98a'; ctx.lineWidth = 1; ctx.stroke();   // the lid, up
      if (k > 0.6) { ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(bx, by - 9 - 7.5 * k, 4.5 * k, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#e8d2a8'; U.roundRect(ctx, bx - 15, by - 9, 30, 14, 2); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(bx - 13, by - 7, 26, 3);
    }
    // the pizza: in the box, then sliding over onto the plate
    if (!d.placed) {
      const tt = d.phase === 'serve' ? U.clamp((d.t - 0.4) / (D.place - 0.4), 0, 1) : 0;
      if (k > 0.02 || tt > 0) {
        const x = U.lerp(bx, P.x, tt), y = U.lerp(by - 2, P.y, tt) - Math.sin(tt * Math.PI) * 14;
        ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.78); r.drawPizza(0, 0, 10); ctx.restore();
      }
    }
    // the hands holding the box, or one waving goodbye
    ctx.fillStyle = '#c68642';
    if (d.phase === 'wave') { const w = Math.sin(d.t * 16) * 4; ctx.beginPath(); ctx.arc(d.x - f * 17 + w, d.y - 50, 4, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(d.x - f * 15 - 1.5, d.y - 46, 3, 14); }
    ctx.beginPath(); ctx.arc(bx - f * 14, by + 3, 3.2, 0, Math.PI * 2); ctx.arc(bx + f * 8, by + 6, 3.2, 0, Math.PI * 2); ctx.fill();
  },
  // crumbs flying off a bite (world space, over everything)
  overlay(r, g) {
    if (!this.st || g.area !== 'pizzarain') return;
    const ctx = r.ctx, st = this.st, p = g.player, C = CFG.PIZZARAIN, Ph = C.PHONE, d = st.del;
    for (const c of st.crumbs) { ctx.globalAlpha = U.clamp(1 - c.t / c.dur, 0, 1); ctx.fillStyle = c.col; ctx.beginPath(); ctx.arc(c.x, c.y, 2, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
    // on the phone: the receiver at the chef's ear on its curly cord
    if (this.receiverLifted(g)) {
      const ex = p.x - 12, ey = p.y - 34, sx = Ph.x - 11, sy = Ph.y - 6, n = 26;
      ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.2; ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const k = i / n, len = Math.hypot(ex - sx, ey + 9 - sy) || 1, nx = -(ey + 9 - sy) / len, ny = (ex - sx) / len, sag = Math.sin(k * Math.PI) * 10;
        const cx = U.lerp(sx, ex, k) + nx * Math.sin(k * 60) * 1.6, cy = U.lerp(sy, ey + 9, k) + ny * Math.sin(k * 60) * 1.6 + sag;
        if (i) ctx.lineTo(cx, cy); else ctx.moveTo(cx, cy);
      }
      ctx.stroke();
      this.drawReceiver(ctx, ex, ey, 0.25);
    }
    const say = (x, y, text) => { ctx.font = r.font(12); const w = ctx.measureText(text).width + 22; r.drawBubble(x, y, () => { ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText(text, 0, 0); }, w); };
    if (d && d.phase === 'call') {
      if (d.t < 0.7) say(Ph.x + 14, Ph.y - 36, 'Ring ring! ☎️');
      else if (this.receiverLifted(g)) say(p.x, p.y - 76, 'One pizza please! 🍕');
    }
    if (d && d.phase === 'serve' && (d.placed || d.t > 0.3)) say(d.x, d.y - 76, 'Here you go! 🍕');
    if (d && d.phase === 'wave') say(d.x, d.y - 76, 'Bye-bye! 👋');
  },
  // screen space: the three-slice counter at the top of the room and the fade through the door
  screen(r, g) {
    if (!this.st) return;
    const ctx = r.ctx, st = this.st, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr, C = CFG.PIZZARAIN;
    if (g.area === 'pizzarain') {
      const cx = W / 2, cy = W < 560 ? 205 : 110, pulse = st.full ? 1 + 0.05 * Math.sin(g.time * 6) : 1;   // under the hint bubble (which sits lower on a phone)
      ctx.save(); ctx.translate(cx, cy); ctx.scale(pulse, pulse);
      ctx.fillStyle = 'rgba(43,29,20,0.78)'; U.roundRect(ctx, -58, -16, 116, 32, 16); ctx.fill();
      for (let i = 0; i < C.full; i++) {
        const x = -32 + i * 32;
        if (i < st.eaten) this.drawSlice(ctx, x, 1, Math.PI, 1.35, 1);
        else { ctx.save(); ctx.translate(x, 1); ctx.rotate(Math.PI); ctx.scale(1.35, 1.35); ctx.setLineDash([2.5, 2]); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(-9.5, -6); ctx.quadraticCurveTo(0, -10.5, 9.5, -6); ctx.closePath(); ctx.stroke(); ctx.restore(); }
      }
      ctx.restore();
    }
    if (st.fade > 0) { ctx.fillStyle = `rgba(20,12,6,${(st.fade / C.fade).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
  },
};

Game.ext.unshift(PizzaRainExt);   // first in line so the door's button and hint beat the bedroom's own
Render.ext.push(PizzaRainExt);
