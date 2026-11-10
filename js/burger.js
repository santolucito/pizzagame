'use strict';
// The burger shop: a cheerful little burger joint on the grass WEST of the pizzeria, just south-west of where the
// playroom's town slide lands (CFG.PLAYROOM.TOWN.land), between West Road's sidewalk and the park tree at (-120, 790).
// Outside: a red roof with a giant burger sign on two posts, a striped awning, two windows with flower boxes, a red
// door with a porthole and a checker mat, and a little paved path down to the South Road sidewalk. The footprint is an
// obstacle for the chef and every vehicle; '🚪 Go inside' on the mat.
// Inside (its own map, CFG.AREAS.burger, in the free block 34000..34960 × 4000..4620): a warm checker floor, a long
// counter with a friendly cook in a paper hat behind it, who wanders between the fryer, the grill (patties sizzle and
// flip, steam puffs up) and the milkshake machine. Three spots in front of the counter, each with its picture on the
// floor and on the menu card above:
//  * 🍔 a burger ($3): the burger is built on the counter one layer at a time (bottom bun, a patty hops over from the
//    grill, cheese, lettuce, tomato, the top bun with a sparkle), flies to the chef's hand, and the chef eats it in
//    three big bites: CHOMP! CHOMP! CHOMP! then "Yum! 😋".
//  * 🍟 fries ($2): the fryer basket bubbles, a red box of fries pops up, the chef munches them (nom!).
//  * 🥤 a milkshake ($2): the machine whirs, the cup fills up pink, the chef slurps it down.
// Free when the chef is broke ("On the house!"), one order at a time, no failure states. The chef keeps walking while
// eating, and can sit in one of the two red booths or at a little round table ('🪑 Sit down' / '🚶 Stand up').
// Extension module: registered with Game.ext (unshift, so the door's button and hint beat the town's own) and
// Render.ext. See js/EXTENSIONS.md ("Interiors").
CFG.BURGER = {
  // ---- the town: the building's footprint (an obstacle), how tall its front wall is, and the mat outside the door
  SHOP: { x0: -372, y0: 700, x1: -180, y1: 812 }, FACADE: 58,
  DOOR_OUT: { x: -276, y: 832 },
  REACH: 30, HINT: 90,                                   // the door's button, and how close its hint shows
  // ---- the interior
  WORLD: { x0: 34000, y0: 4000, x1: 34960, y1: 4620 },
  ROOM: { x0: 34040, y0: 4120, x1: 34920, y1: 4560 }, WALL: 24, BACK_TOP: 4024,
  KITCHEN: { x0: 34040, y0: 4120, x1: 34696, y1: 4244 },        // behind the counter (and the counter itself): solid
  COUNTER: { x0: 34040, y0: 4200, x1: 34696, y1: 4244 },        // top 4200..4228, front 4228..4244
  BACK_COUNTER_Y: 4162,                                         // the steel worktop along the back wall
  FRYER: { x: 34160 }, GRILL: { x0: 34300, x1: 34460 }, MACHINE: { x: 34600 },
  COOK_Y: 4202,                                                 // the cook's feet (the counter hides his legs)
  SPOTS: { fries: { x: 34160, y: 4274 }, burger: { x: 34380, y: 4274 }, shake: { x: 34600, y: 4274 } },
  BOOTH: { x0: 34752, x1: 34920, tops: [4136, 4290] },          // two booths by the right wall (bench, table, bench)
  TABLES: [{ x: 34210, y: 4420 }, { x: 34440, y: 4420 }],        // little round tables with a stool each side
  PLANTS: [{ x: 34064, y: 4532 }, { x: 34896, y: 4532 }, { x: 34730, y: 4146 }],
  EXIT: { x: 34640, y: 4532 },                                  // the mat inside the door (the door is in the bottom wall)
  PRICE: { burger: 3, fries: 2, shake: 2 },
  LAYERS: ['bunB', 'patty', 'cheese', 'lettuce', 'tomato', 'bunT'],
  BITES: { burger: 3, fries: 4, shake: 3 },
  // seconds: one layer of the burger, the fryer, the milkshake machine, the hand-over, one bite, the happy munch
  T: { layer: 0.38, fries: 1.6, shake: 1.6, give: 0.45, bite: 0.75, yum: 1.1 },
  COOK_SPEED: 150, FADE: 0.45,
};
CFG.AREAS.burger = { WORLD: CFG.BURGER.WORLD, place: 'town', noSky: true };

const BurgerExt = {
  name: 'burger',
  defaults: { burger: { seen: false, eaten: 0, fries: 0, shakes: 0, sits: 0 } },
  st: null,

  // ---------- state ----------
  build(g) {
    this.state(g);
    const K = CFG.BURGER;
    this.st = {
      fade: 0, seat: null,                    // seat: index into seats()
      order: null,                            // { kind, phase: 'make' | 'give' | 'eat' | 'yum', t, paid, bites }
      say: null,                              // the cook's speech bubble { text, t }
      cook: { x: (K.GRILL.x0 + K.GRILL.x1) / 2, y: K.COOK_Y, facing: 1, moving: false, i: 0, pause: 1, bob: 0 },
      steam: [], sparks: [], bubbles: [], drawn: 0,
      obs: this.makeObstacles(),
    };
  },
  state(g) { if (!g.s.burger) g.s.burger = JSON.parse(JSON.stringify(this.defaults.burger)); return g.s.burger; },
  ready(g) { if (!this.st) this.build(g); this.state(g); return this.st; },
  makeObstacles() {
    const K = CFG.BURGER, R = K.ROOM, w = K.WALL, KT = K.KITCHEN, o = [];
    o.push({ x: K.WORLD.x0, y: K.WORLD.y0, w: K.WORLD.x1 - K.WORLD.x0, h: R.y0 - K.WORLD.y0 });             // the back wall
    o.push({ x: R.x0 - w, y: R.y1, w: R.x1 - R.x0 + 2 * w, h: w });
    o.push({ x: R.x0 - w, y: R.y0, w, h: R.y1 - R.y0 }, { x: R.x1, y: R.y0, w, h: R.y1 - R.y0 });
    o.push({ x: KT.x0, y: KT.y0, w: KT.x1 - KT.x0, h: KT.y1 - KT.y0 });                                    // counter + kitchen
    for (const top of K.BOOTH.tops) o.push({ x: K.BOOTH.x0, y: top, w: K.BOOTH.x1 - K.BOOTH.x0, h: 78 });
    for (const T of K.TABLES) o.push({ x: T.x - 50, y: T.y - 14, w: 100, h: 26 });
    for (const P of K.PLANTS) o.push({ x: P.x - 12, y: P.y - 12, w: 24, h: 20 });
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
  // places to sit: where the chef sits, which way he faces, where he stands to sit down (and stands up to)
  seats() {
    if (this._seats) return this._seats;
    const K = CFG.BURGER, s = [], bx = (K.BOOTH.x0 + K.BOOTH.x1) / 2;
    K.BOOTH.tops.forEach((top, i) => s.push({ kind: 'booth', i, x: bx - 4, y: top + 40, facing: 1, spot: { x: bx - 4, y: top + 98 } }));
    K.TABLES.forEach((T, i) => s.push({ kind: 'table', i, x: T.x - 34, y: T.y + 4, facing: 1, spot: { x: T.x - 34, y: T.y + 44 } }));
    this._seats = s;
    return s;
  },

  // ---------- small helpers ----------
  onFoot(g) { return !g.driving && !g.onTrain && !g.ride && !g.travel && !g.fishing; },
  cityBusy() { return typeof CityExt !== 'undefined' && !!(CityExt.floor || (CityExt.st && (CityExt.st.cab || CityExt.st.boarding))); },
  atDoor(g) { const D = CFG.BURGER.DOOR_OUT, p = g.player; return g.area === 'town' && this.onFoot(g) && !this.cityBusy() && U.dist(p.x, p.y, D.x, D.y) < CFG.BURGER.REACH; },
  atExit(g) { const X = CFG.BURGER.EXIT, p = g.player; return U.dist(p.x, p.y, X.x, X.y) < 30; },
  // the counter spot the chef is standing on ('burger' | 'fries' | 'shake'), or null
  atSpot(g) {
    const S = CFG.BURGER.SPOTS, p = g.player;
    for (const k of Object.keys(S)) if (U.dist(p.x, p.y, S[k].x, S[k].y) < CFG.BURGER.REACH) return k;
    return null;
  },
  nearSeat(g) {
    const p = g.player, s = this.seats();
    for (let i = 0; i < s.length; i++) if (U.dist(p.x, p.y, s[i].spot.x, s[i].spot.y) < 28) return i;
    return -1;
  },
  busy() { return !!(this.st && this.st.order); },
  // the chef is drawn on foot right now (not in a vehicle, on the train or on a ride)
  visible(g) { return !g.driving && !g.onTrain && !g.travel; },
  label(kind) {
    const P = CFG.BURGER.PRICE[kind];
    return { burger: `🍔 Get a burger ($${P})`, fries: `🍟 Get fries ($${P})`, shake: `🥤 Get a milkshake ($${P})` }[kind];
  },

  // ---------- game hooks ----------
  action(g) {
    const st = this.ready(g);
    if (this.atDoor(g)) return { label: '🚪 Go inside', run: (gg) => this.enter(gg) };
    if (g.area !== 'burger' || !this.onFoot(g)) return null;
    if (st.seat !== null) return { label: '🚶 Stand up', run: (gg) => this.standUp(gg) };
    if (this.atExit(g)) return { label: '🚪 Go outside', run: (gg) => this.leave(gg) };
    const k = this.atSpot(g);
    if (k) return st.order ? null : { label: this.label(k), run: (gg) => this.buy(gg, k) };
    const s = this.nearSeat(g);
    if (s >= 0) return { label: '🪑 Sit down', run: (gg) => this.sitDown(gg, s) };
    return null;
  },
  enter(g) {
    const K = CFG.BURGER, p = g.player, st = this.ready(g), s = this.state(g);
    g.area = 'burger'; p.x = K.EXIT.x; p.y = K.EXIT.y - 8; p.moving = false; p.facing = -1; p.hasMoved = true; g.cameraSnap = true;
    st.fade = K.FADE; st.seat = null; Sfx.ding(); Haptics.tap();
    st.say = { text: 'Hi! Hungry? 🍔', t: 2 };
    if (!s.seen) { s.seen = true; g.toast('🍔 Welcome to the burger shop!', true); }
  },
  leave(g) {
    const K = CFG.BURGER, p = g.player, st = this.ready(g);
    g.area = 'town'; p.x = K.DOOR_OUT.x; p.y = K.DOOR_OUT.y + 4; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    st.seat = null; st.fade = K.FADE; st.say = null; Sfx.drop();
  },
  buy(g, kind) {
    const st = this.ready(g), K = CFG.BURGER, p = g.player, price = K.PRICE[kind];
    if (st.order) return;
    const paid = g.s.cash >= price;
    if (paid) { g.s.cash -= price; Sfx.cash(); }
    st.order = { kind, phase: 'make', t: 0, paid, bites: 0, landed: 0 };
    const yum = { burger: '🍔', fries: '🍟', shake: '🥤' }[kind];
    st.say = { text: paid ? `Coming right up! ${yum}` : `On the house! ${yum}`, t: 1.8 };
    g.floats.push({ x: p.x, y: p.y - 66, text: paid ? `-$${price}` : `On the house! ${yum}`, color: paid ? '#ffe08a' : '#7ee081', t: 0, dur: 1.3, big: true });
    p.facing = 1; p.hasMoved = true;
    Haptics.tap();
  },
  makeTime(kind) { const T = CFG.BURGER.T; return kind === 'burger' ? CFG.BURGER.LAYERS.length * T.layer + 0.25 : T[kind]; },
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
  // Take-me-home: the food in hand is gone, the chef is no longer sitting
  home(g) { const st = this.ready(g); st.order = null; st.seat = null; st.fade = 0; st.say = null; st.sparks = []; },
  // a save or a push that left the chef in a wall or inside the furniture goes back onto the door mat
  rescue(g) {
    const p = g.player, K = CFG.BURGER;
    if (this.free(p.x, p.y)) return false;
    p.x = K.EXIT.x; p.y = K.EXIT.y - 8; p.moving = false;
    g.floats.push({ x: p.x, y: p.y - 50, text: 'Oops! Back inside', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    return true;
  },

  update(g, dt) {
    const st = this.ready(g), K = CFG.BURGER, p = g.player;
    st.fade = Math.max(0, st.fade - dt);
    if (st.say) { st.say.t -= dt; if (st.say.t <= 0) st.say = null; }
    for (const s of st.sparks) s.t += dt;
    st.sparks = st.sparks.filter((s) => s.t < s.dur);
    this.stepOrder(g, dt);
    // the park dog never wanders onto the shop's roof
    if (g.area === 'town' && g.dog && g.dog.target) {
      const S = K.SHOP, d = g.dog.target;
      if (d.x > S.x0 - 20 && d.x < S.x1 + 20 && d.y > S.y0 - 20 && d.y < S.y1 + 30) d.x = S.x1 + 30;
    }
    if (g.area !== 'burger') { st.seat = null; return; }
    // seated: stay put
    if (st.seat !== null && this.onFoot(g)) { const s = this.seats()[st.seat]; p.x = s.x; p.y = s.y; p.moving = false; p.facing = s.facing; }
    else if (st.seat === null && this.onFoot(g)) this.rescue(g);
    this.stepCook(g, dt);
    // steam off the grill, bubbles in the fryer
    if (Math.random() < dt * 4) st.steam.push({ x: U.rand(K.GRILL.x0 + 14, K.GRILL.x1 - 14), y: K.BACK_COUNTER_Y - 18, t: 0 });
    for (const q of st.steam) { q.t += dt; q.y -= 16 * dt; q.x += Math.sin(q.t * 4 + q.y) * 6 * dt; }
    st.steam = st.steam.filter((q) => q.t < 1.3);
    const frying = st.order && st.order.kind === 'fries' && st.order.phase === 'make';
    if (Math.random() < dt * (frying ? 30 : 4)) st.bubbles.push({ x: K.FRYER.x + U.rand(-22, 22), y: K.BACK_COUNTER_Y - 22 + U.rand(-5, 5), t: 0 });
    for (const b of st.bubbles) b.t += dt;
    st.bubbles = st.bubbles.filter((b) => b.t < 0.5);
  },
  stepOrder(g, dt) {
    const st = this.st, o = st.order, K = CFG.BURGER, T = K.T, p = g.player;
    if (!o) return;
    o.t += dt;
    if (o.phase === 'make') {
      if (o.kind === 'burger') {
        const n = Math.min(K.LAYERS.length, Math.floor(o.t / T.layer));
        while (o.landed < n) {           // a layer landed on the stack: a little plip, higher each time
          o.landed++;
          Sfx.tone(380 + o.landed * 90, 0.07, 'triangle', 0.04);
          if (o.landed === K.LAYERS.length) { const tr = this.tray('burger'); st.sparks.push({ x: tr.x, y: tr.y - 22, area: 'burger', t: 0, dur: 0.6, color: '255,214,10' }); }
        }
      }
      if (o.t >= this.makeTime(o.kind)) {
        o.phase = 'give'; o.t = 0;
        st.say = { text: o.kind === 'burger' ? 'Here you go! 🍔' : o.kind === 'fries' ? 'Hot fries! 🍟' : 'Pink and yummy! 🥤', t: 1.4 };
        Sfx.ding();
      }
    } else if (o.phase === 'give' && o.t >= T.give) { o.phase = 'eat'; o.t = 0; o.bites = 0; }
    else if (o.phase === 'eat') {
      const n = Math.min(K.BITES[o.kind], Math.floor(o.t / T.bite) + 1);
      while (o.bites < n && o.t >= (o.bites + 0.6) * T.bite) this.bite(g);
      if (o.bites >= K.BITES[o.kind] && o.t >= K.BITES[o.kind] * T.bite) {
        o.phase = 'yum'; o.t = 0;
        const s = this.state(g);
        if (o.kind === 'burger') s.eaten++; else if (o.kind === 'fries') s.fries++; else s.shakes++;
        g.floats.push({ x: p.x, y: p.y - 74, text: o.kind === 'shake' ? 'Ahh! 😋' : 'Yum! 😋', color: '#ffe08a', t: 0, dur: 1.5, big: true });
        Sfx.chime(); Haptics.success();
      }
    } else if (o.phase === 'yum' && o.t >= T.yum) st.order = null;
  },
  bite(g) {
    const st = this.st, o = st.order, p = g.player, m = this.mouth(g);
    o.bites++;
    const text = o.kind === 'burger' ? 'CHOMP!' : o.kind === 'fries' ? 'nom!' : 'slurp!';
    g.floats.push({ x: p.x + U.rand(-8, 8), y: p.y - 84, text, color: o.kind === 'burger' ? '#ffd60a' : '#fff', t: 0, dur: 0.9, big: o.kind === 'burger' });
    st.sparks.push({ x: m.x, y: m.y, area: g.area, t: 0, dur: 0.5, color: o.kind === 'shake' ? '255,143,171' : '255,214,10' });
    Sfx.pickup(); Haptics.tap();
  },
  // the cook: off to the right station while making an order, otherwise pottering between grill, fryer and machine
  stepCook(g, dt) {
    const st = this.st, c = st.cook, K = CFG.BURGER, o = st.order, p = g.player;
    const go = (x) => { const px = c.x; const done = U.moveToward(c, x, K.COOK_Y, K.COOK_SPEED, dt); if (Math.abs(c.x - px) > 0.01) c.facing = c.x > px ? 1 : -1; c.moving = !done; if (c.moving) c.bob += dt * 12; return done; };
    if (o && o.phase === 'make') { go(o.kind === 'burger' ? this.tray('burger').x - 30 : o.kind === 'fries' ? K.FRYER.x + 6 : K.MACHINE.x - 6); return; }
    if (c.pause > 0) {
      c.pause -= dt; c.moving = false;
      if (U.dist(p.x, p.y, c.x, K.COUNTER.y1) < 160) c.facing = p.x >= c.x ? 1 : -1;
      return;
    }
    const stops = [(K.GRILL.x0 + K.GRILL.x1) / 2 - 30, K.FRYER.x + 10, (K.GRILL.x0 + K.GRILL.x1) / 2 + 30, K.MACHINE.x - 10];
    if (go(stops[c.i % stops.length])) { c.i++; c.pause = U.rand(1.2, 2.4); }
  },

  hint(g) {
    const st = this.ready(g), p = g.player, K = CFG.BURGER, s = this.state(g);
    if (g.area === 'town') {
      if (!this.onFoot(g) || this.cityBusy()) return undefined;
      const d = U.dist(p.x, p.y, K.DOOR_OUT.x, K.DOOR_OUT.y);
      if (d < K.HINT) return { text: 'Burgers! Go inside 🍔', target: d < K.REACH ? null : K.DOOR_OUT };
      return undefined;
    }
    if (g.area !== 'burger') return undefined;
    if (!this.onFoot(g)) return null;
    const o = st.order;
    if (o && o.phase === 'make') return { text: o.kind === 'burger' ? 'Watch the burger stack up! 🍔' : o.kind === 'fries' ? 'Sizzle sizzle! 🍟' : 'Whirr! Milkshake time 🥤', target: null };
    if (o && (o.phase === 'give' || o.phase === 'eat')) return { text: o.kind === 'burger' ? 'CHOMP! CHOMP! 🍔' : o.kind === 'fries' ? 'Nom nom fries! 🍟' : 'Slurp! 🥤', target: null };
    if (st.seat !== null) return { text: 'Comfy! Press the button to stand up 🪑', target: null };
    const k = this.atSpot(g);
    if (k) return { text: { burger: 'Get a yummy burger! 🍔', fries: 'Get some fries! 🍟', shake: 'Get a milkshake! 🥤' }[k], target: null };
    if (this.nearSeat(g) >= 0) return { text: 'Sit down! 🪑', target: null };
    if (!s.eaten) return { text: 'Get a burger! 🍔', target: K.SPOTS.burger };
    if (!s.fries) return { text: 'Get some fries! 🍟', target: K.SPOTS.fries };
    if (!s.shakes) return { text: 'Get a milkshake! 🥤', target: K.SPOTS.shake };
    if (!s.sits) return { text: 'Sit in a comfy booth 🪑', target: this.seats()[0].spot };
    return { text: 'Yummy burgers! 🍔', target: null };
  },

  // ---------- where things are ----------
  bodyBob(p) { return p.moving ? Math.sin(p.bob || 0) * 2 : 0; },
  hand(g) { const p = g.player, f = p.facing || 1; return { x: p.x + f * 19, y: p.y - 21 + this.bodyBob(p) }; },
  mouth(g) { const p = g.player, f = p.facing || 1; return { x: p.x + f * 2, y: p.y - 31 + this.bodyBob(p) }; },
  // where the order sits on the counter: beside the spot, so the chef's own hat never hides the burger being built
  tray(kind) { const K = CFG.BURGER; return { x: K.SPOTS[kind].x + 40, y: K.COUNTER.y0 + 18 }; },
  // where the food is drawn now: { x, y, s (scale), onCounter }
  foodPose(g) {
    const o = this.st.order; if (!o || o.phase === 'yum') return null;
    const tr = this.tray(o.kind), h = this.hand(g);
    if (o.phase === 'make') return { x: tr.x, y: tr.y, s: 1, onCounter: true };
    if (o.phase === 'give') {
      const k = U.clamp(o.t / CFG.BURGER.T.give, 0, 1);
      return { x: U.lerp(tr.x, h.x, k), y: U.lerp(tr.y, h.y, k) - Math.sin(k * Math.PI) * 30, s: U.lerp(1, 0.8, k) };
    }
    return { x: h.x, y: h.y, s: 0.8, held: true };
  },

  // ---------- art: the food ----------
  // one burger layer, its bottom at y = 0, about 30 px wide; returns its height
  drawLayer(ctx, kind) {
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(43,29,20,0.35)';
    if (kind === 'bunB') { ctx.fillStyle = '#e8a85a'; U.roundRect(ctx, -15, -6, 30, 6, 3); ctx.fill(); ctx.stroke(); return 6; }
    if (kind === 'patty') { ctx.fillStyle = '#6b3e1e'; U.roundRect(ctx, -16, -6, 32, 6, 3); ctx.fill(); ctx.fillStyle = '#4a2a14'; ctx.fillRect(-12, -3, 24, 1); return 6; }
    if (kind === 'cheese') { ctx.fillStyle = '#ffc93c'; ctx.beginPath(); ctx.moveTo(-15, -2.5); ctx.lineTo(15, -2.5); ctx.lineTo(15, 0); ctx.lineTo(9, 0); ctx.lineTo(6, 4); ctx.lineTo(3, 0); ctx.lineTo(-7, 0); ctx.lineTo(-10, 3.5); ctx.lineTo(-13, 0); ctx.lineTo(-15, 0); ctx.closePath(); ctx.fill(); return 2.5; }
    if (kind === 'lettuce') { ctx.fillStyle = '#56b862'; ctx.beginPath(); for (let i = 0; i <= 8; i++) { const x = -17 + i * 4.25; ctx.arc(x, -1.5, 2.6, 0, Math.PI * 2); } ctx.fill(); return 3; }
    if (kind === 'tomato') { ctx.fillStyle = '#e53935'; for (const x of [-8, 8]) { U.roundRect(ctx, x - 7, -3, 14, 3.5, 1.5); ctx.fill(); } return 3; }
    // the top bun: a dome with sesame seeds
    ctx.fillStyle = '#e8a85a'; ctx.beginPath(); ctx.moveTo(-15.5, 0); ctx.quadraticCurveTo(-15.5, -13, 0, -13); ctx.quadraticCurveTo(15.5, -13, 15.5, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.ellipse(-5, -9, 5, 2, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff8e0'; for (const [sx, sy] of [[-8, -6], [-2, -10], [4, -7], [9, -4], [2, -4], [-6, -10]]) { ctx.beginPath(); ctx.ellipse(sx, sy, 1.3, 0.8, 0.4, 0, Math.PI * 2); ctx.fill(); }
    return 12;
  },
  layerH(kind) { return { bunB: 6, patty: 6, cheese: 2.5, lettuce: 3, tomato: 3, bunT: 12 }[kind]; },
  // the first n layers stacked up from (x, y); bites cut half-moons out of the side facing f
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
  // a red box of fries; left = how many fries are still in it (0..1)
  drawFries(ctx, x, y, s, left) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const n = Math.round(7 * left);
    for (let i = 0; i < n; i++) { ctx.fillStyle = i % 2 ? '#ffd166' : '#ffc23c'; const fx = -8 + i * 2.6; ctx.save(); ctx.translate(fx, -14); ctx.rotate((i - 3) * 0.08); ctx.fillRect(-1.2, -9 + (i % 3) * 1.5, 2.6, 12); ctx.restore(); }
    ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.moveTo(-11, -16); ctx.lineTo(11, -16); ctx.lineTo(8, 0); ctx.lineTo(-8, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(43,29,20,0.35)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(0, -8, 3.2, 0, Math.PI * 2); ctx.fill();
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
  // the order wherever it is now (on the counter being made, flying over, or in the chef's hand being eaten)
  drawOrder(r, g) {
    const st = this.st, o = st.order, pose = this.foodPose(g); if (!pose) return;
    const ctx = r.ctx, K = CFG.BURGER, T = K.T, p = g.player, f = pose.held ? (p.facing || 1) : 1;
    if (o.kind === 'burger') {
      if (o.phase === 'make') this.drawMaking(r, g);
      else this.drawBurger(ctx, pose.x, pose.y + 6 * pose.s, 6, pose.s, o.phase === 'eat' ? o.bites : 0, f);
    } else if (o.kind === 'fries') {
      if (o.phase === 'make') {
        const k = U.clamp((o.t / T.fries - 0.7) / 0.3, 0, 1);
        if (k > 0) this.drawFries(ctx, pose.x, pose.y + 4, 0.5 + 0.5 * U.easeOut(k), 1);
      } else this.drawFries(ctx, pose.x, pose.y + 8 * pose.s, pose.s, o.phase === 'eat' ? 1 - o.bites / K.BITES.fries : 1);
    } else {
      if (o.phase === 'make') this.drawShake(ctx, pose.x, pose.y + 6, 1, U.clamp(o.t / T.shake / 0.85, 0, 1));
      else this.drawShake(ctx, pose.x, pose.y + 10 * pose.s, pose.s, o.phase === 'eat' ? 1 - o.bites / K.BITES.shake : 1);
    }
    if (pose.held) { ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(p.x + f * 14, p.y - 16 + this.bodyBob(p), 3.5, 0, Math.PI * 2); ctx.fill(); }   // the chef's hand in front
    st.drawn++;
  },
  // the burger being built on the counter: the landed layers (the newest one squashes), and the one on its way
  drawMaking(r, g) {
    const ctx = r.ctx, o = this.st.order, K = CFG.BURGER, T = K.T, L = K.LAYERS, tr = this.tray('burger');
    // the paper on the counter
    ctx.fillStyle = '#fff8ee'; ctx.beginPath(); ctx.ellipse(tr.x, tr.y + 2, 22, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#e53935'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(tr.x, tr.y + 2, 19, 4.8, 0, 0, Math.PI * 2); ctx.stroke();
    const n = Math.min(L.length, Math.floor(o.t / T.layer)), k = (o.t % T.layer) / T.layer;
    let h = 0;
    for (let i = 0; i < n; i++) {
      const squash = i === n - 1 && k < 0.3 ? 1 - 0.25 * Math.sin((k / 0.3) * Math.PI) : 1;
      ctx.save(); ctx.translate(tr.x, tr.y - h); ctx.scale(1 + (1 - squash) * 0.6, squash); this.drawLayer(ctx, L[i]); ctx.restore();
      h += this.layerH(L[i]);
    }
    if (n >= L.length) return;
    const kind = L[n];
    if (kind === 'patty') {
      // the patty hops over from the grill in a high arc, spinning once
      const sx = (K.GRILL.x0 + K.GRILL.x1) / 2 + 30, sy = K.BACK_COUNTER_Y - 12, ex = tr.x, ey = tr.y - h;
      const x = U.lerp(sx, ex, k), y = U.lerp(sy, ey, k) - Math.sin(k * Math.PI) * 46;
      ctx.save(); ctx.translate(x, y); ctx.scale(1, Math.max(0.2, Math.abs(Math.cos(k * Math.PI * 2)))); this.drawLayer(ctx, 'patty'); ctx.restore();
    } else {
      // everything else drops in from above
      const y = tr.y - h - 50 * (1 - k * k);
      ctx.save(); ctx.globalAlpha = Math.min(1, k * 3); ctx.translate(tr.x, y); this.drawLayer(ctx, kind); ctx.restore();
    }
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
  bgKey() { return 'burger1'; },
  paintTown(r, g) {
    const ctx = r.ctx, K = CFG.BURGER, S = K.SHOP, D = K.DOOR_OUT, w = S.x1 - S.x0, fy = S.y1 - K.FACADE, cx = (S.x0 + S.x1) / 2;
    // a paved path from the door down to the South Road sidewalk, and the shadow under the building
    ctx.fillStyle = '#d9cfbd'; ctx.fillRect(D.x - 15, S.y1, 30, 900 - S.y1);
    ctx.fillStyle = 'rgba(0,0,0,0.08)'; for (let y = S.y1 + 12; y < 900; y += 14) ctx.fillRect(D.x - 15, y, 30, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(S.x0 + 6, S.y0 + 8, w, S.y1 - S.y0);
    // the flat red roof with a light rim and a little vent box
    ctx.fillStyle = '#b8322a'; ctx.fillRect(S.x0, S.y0, w, fy - S.y0);
    ctx.fillStyle = '#d9483a'; ctx.fillRect(S.x0 + 5, S.y0 + 5, w - 10, fy - S.y0 - 8);
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; for (let x = S.x0 + 12; x < S.x1 - 8; x += 16) ctx.fillRect(x, S.y0 + 8, 8, fy - S.y0 - 14);
    ctx.fillStyle = '#9aa0a8'; U.roundRect(ctx, S.x1 - 34, S.y0 + 12, 20, 14, 3); ctx.fill(); ctx.fillStyle = '#5c6670'; for (let k = 0; k < 3; k++) ctx.fillRect(S.x1 - 31, S.y0 + 15 + k * 4, 14, 1.5);
    // the cream front wall
    ctx.fillStyle = '#fff1d0'; ctx.fillRect(S.x0, fy, w, S.y1 - fy);
    ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(S.x0, S.y1 - 5, w, 5);
    ctx.strokeStyle = 'rgba(43,29,20,0.35)'; ctx.lineWidth = 1.5; ctx.strokeRect(S.x0, S.y0, w, S.y1 - S.y0);
    // two windows: a table and a little burger poster inside, flower boxes under them
    for (const wx of [S.x0 + 14, S.x1 - 70]) {
      const wy = fy + 22;
      ctx.fillStyle = '#8d5a2b'; ctx.fillRect(wx - 3, wy - 3, 62, 30);
      ctx.fillStyle = '#bfe3ff'; ctx.fillRect(wx, wy, 56, 24);
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.moveTo(wx + 6, wy + 24); ctx.lineTo(wx + 18, wy); ctx.lineTo(wx + 26, wy); ctx.lineTo(wx + 14, wy + 24); ctx.closePath(); ctx.fill();
      ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(wx < cx ? '🍔' : '🥤', wx + 40, wy + 12);
      ctx.fillStyle = '#8d5a2b'; ctx.fillRect(wx + 27, wy, 2, 24);
      ctx.fillStyle = '#6b3e1e'; ctx.fillRect(wx - 2, wy + 27, 60, 6);
      const fl = ['#ff5c8a', '#ffd166', '#ffffff', '#ff8fab', '#ffd166', '#ff5c8a'];
      for (let i = 0; i < 6; i++) { ctx.fillStyle = '#3f9a4a'; ctx.beginPath(); ctx.arc(wx + 4 + i * 10, wy + 26, 4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = fl[i]; ctx.beginPath(); ctx.arc(wx + 4 + i * 10, wy + 24, 2.2, 0, Math.PI * 2); ctx.fill(); }
    }
    // the red door with a porthole, a handle and an OPEN tag
    const dx = D.x, dy = S.y1;
    ctx.fillStyle = '#8d2a1e'; ctx.fillRect(dx - 17, dy - 44, 34, 44);
    ctx.fillStyle = '#e53935'; ctx.fillRect(dx - 14, dy - 41, 28, 41);
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(dx, dy - 28, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#bfe3ff'; ctx.beginPath(); ctx.arc(dx, dy - 28, 6.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(dx - 3.5, dy - 32, 2.5, 5);
    ctx.fillStyle = '#ffd166'; ctx.fillRect(dx + 8, dy - 18, 3, 9);
    ctx.fillStyle = '#fff'; U.roundRect(ctx, dx - 11, dy - 14, 16, 8, 2); ctx.fill();
    ctx.fillStyle = '#e53935'; ctx.font = r.font(5); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('OPEN', dx - 3, dy - 10);
    // the striped awning along the top of the front wall, with a scalloped edge
    const ay = fy, ah = 14;
    for (let x = S.x0 - 4, i = 0; x < S.x1 + 4; x += 12, i++) { ctx.fillStyle = i % 2 ? '#fff' : '#e53935'; ctx.fillRect(x, ay - 2, Math.min(12, S.x1 + 4 - x), ah); ctx.beginPath(); ctx.arc(x + 6, ay + ah - 2, 6, 0, Math.PI); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(S.x0 - 4, ay - 2, w + 8, 2);
    // the checker welcome mat
    for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) { ctx.fillStyle = (i + j) % 2 ? '#ffd166' : '#e53935'; ctx.fillRect(D.x - 18 + i * 6, D.y - 14 + j * 6, 6, 6); }
    ctx.strokeStyle = 'rgba(43,29,20,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(D.x - 18, D.y - 14, 36, 12);
    // the name board on the roof's front edge (the GIANT burger on its posts above it is drawn live: drawSign)
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, cx - 52, fy - 26, 104, 20, 6); ctx.fill();
    ctx.fillStyle = '#ffd166'; U.roundRect(ctx, cx - 49, fy - 23, 98, 14, 4); ctx.fill();
    ctx.fillStyle = '#c62828'; ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('BURGERS', cx, fy - 15.5);
    // a little picture sign by the path: burger, fries, shake
    const sx = D.x + 40, sy = S.y1 + 34;
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(sx - 1.5, sy - 4, 3, 22);
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, sx - 22, sy - 20, 44, 18, 4); ctx.fill();
    ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🍔🍟🥤', sx, sy - 11);
  },
  // the rooftop sign: a GIANT burger on two posts, drawn as an entity so the chef walking past behind the shop
  // goes behind it; it bobs a tiny bit, like it is bouncing with joy
  drawSign(r, g) {
    const ctx = r.ctx, S = CFG.BURGER.SHOP, cx = (S.x0 + S.x1) / 2, fy = S.y1 - CFG.BURGER.FACADE;
    ctx.fillStyle = '#5c6670'; ctx.fillRect(cx - 34, S.y0 - 4, 4, fy - S.y0 - 22); ctx.fillRect(cx + 30, S.y0 - 4, 4, fy - S.y0 - 22);
    ctx.fillStyle = '#3d4650'; ctx.fillRect(cx - 36, fy - 28, 8, 3); ctx.fillRect(cx + 28, fy - 28, 8, 3);
    this.paintBigBurger(ctx, cx, S.y0 - 2 - Math.abs(Math.sin(g.time * 2)) * 2, 2.6);
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
    const ctx = r.ctx, K = CFG.BURGER, W = K.WORLD, R = K.ROOM, w = K.WALL, KT = K.KITCHEN;
    ctx.fillStyle = '#3a4a5c'; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.04)'; for (let y = W.y0; y < W.y1; y += 40) for (let x = W.x0 + ((y / 40) % 2) * 20; x < W.x1; x += 40) ctx.fillRect(x, y, 38, 38);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(R.x0 - w + 8, K.BACK_TOP + 10, R.x1 - R.x0 + 2 * w, R.y1 + w - K.BACK_TOP);
    // a warm checker floor, and grey tiles in the kitchen
    const T = 30;
    ctx.fillStyle = '#fff6e0'; ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0);
    ctx.fillStyle = '#ffd59a';
    for (let y = R.y0, j = 0; y < R.y1; y += T, j++) for (let x = R.x0, i = 0; x < R.x1; x += T, i++) if ((i + j) % 2) ctx.fillRect(x, y, Math.min(T, R.x1 - x), Math.min(T, R.y1 - y));
    ctx.fillStyle = '#c9ccd2'; ctx.fillRect(KT.x0, KT.y0, KT.x1 - KT.x0, KT.y1 - KT.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let y = KT.y0; y < KT.y1; y += 16) for (let x = KT.x0 + ((y / 16) % 2) * 8; x < KT.x1; x += 16) ctx.fillRect(x, y, 14, 14);
    // walls: a tall tomato-red back wall with a mustard band; darker red side and bottom walls
    ctx.fillStyle = '#e0533f'; ctx.fillRect(R.x0 - w, K.BACK_TOP, R.x1 - R.x0 + 2 * w, R.y0 - K.BACK_TOP);
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; for (let x = R.x0 - w; x < R.x1 + w; x += 24) ctx.fillRect(x, K.BACK_TOP, 12, R.y0 - K.BACK_TOP);
    ctx.fillStyle = '#ffd166'; ctx.fillRect(R.x0 - w, K.BACK_TOP, R.x1 - R.x0 + 2 * w, 6); ctx.fillRect(R.x0 - w, R.y0 - 10, R.x1 - R.x0 + 2 * w, 6);
    ctx.fillStyle = '#a8322a'; ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, w); ctx.fillRect(R.x0 - w, R.y0, w, R.y1 - R.y0); ctx.fillRect(R.x1, R.y0, w, R.y1 - R.y0);
    ctx.fillStyle = '#ffd166'; ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, 3); ctx.fillRect(R.x0 - 3, R.y0, 3, R.y1 - R.y0); ctx.fillRect(R.x1, R.y0, 3, R.y1 - R.y0);
    // the menu cards above the three stations: a picture and a price
    const cards = [['🍟', K.PRICE.fries, K.FRYER.x], ['🍔', K.PRICE.burger, (K.GRILL.x0 + K.GRILL.x1) / 2], ['🥤', K.PRICE.shake, K.MACHINE.x]];
    for (const [ico, price, x] of cards) {
      ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, x - 40, K.BACK_TOP + 14, 80, 46, 7); ctx.fill();
      ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, x - 36, K.BACK_TOP + 18, 72, 38, 5); ctx.fill();
      ctx.font = r.font(22); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ico, x - 14, K.BACK_TOP + 38);
      ctx.fillStyle = '#c62828'; ctx.font = r.font(14); ctx.fillText('$' + price, x + 18, K.BACK_TOP + 38);
    }
    // a window over the booths: sky, the pond and a tree
    const wx0 = K.BOOTH.x0 + 14, wx1 = R.x1 - 14, wy0 = K.BACK_TOP + 14, wy1 = R.y0 - 20;
    ctx.fillStyle = '#fff1d0'; U.roundRect(ctx, wx0 - 5, wy0 - 5, wx1 - wx0 + 10, wy1 - wy0 + 10, 6); ctx.fill();
    const sky = ctx.createLinearGradient(0, wy0, 0, wy1); sky.addColorStop(0, '#7ec8f5'); sky.addColorStop(1, '#d6efff'); ctx.fillStyle = sky; ctx.fillRect(wx0, wy0, wx1 - wx0, wy1 - wy0);
    ctx.fillStyle = '#7cc45f'; ctx.fillRect(wx0, wy1 - 16, wx1 - wx0, 16);
    ctx.fillStyle = '#5ab8f0'; ctx.beginPath(); ctx.ellipse(wx0 + 40, wy1 - 8, 22, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6b4a2b'; ctx.fillRect(wx1 - 40, wy1 - 26, 5, 14); ctx.fillStyle = '#3f9a4a'; ctx.beginPath(); ctx.arc(wx1 - 38, wy1 - 32, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff1d0'; ctx.fillRect((wx0 + wx1) / 2 - 2, wy0, 4, wy1 - wy0);
    // the steel worktop along the kitchen's back wall
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(KT.x0, R.y0, KT.x1 - KT.x0, K.BACK_COUNTER_Y - R.y0);
    ctx.fillStyle = '#d7dbe0'; ctx.fillRect(KT.x0, R.y0, KT.x1 - KT.x0, K.BACK_COUNTER_Y - R.y0 - 8);
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(KT.x0, K.BACK_COUNTER_Y, KT.x1 - KT.x0, 4);
    // the counter's end wall on the right
    ctx.fillStyle = '#a8322a'; ctx.fillRect(KT.x1 - 10, R.y0, 10, K.COUNTER.y0 - R.y0);
    // round picture mats on the floor in front of each counter spot
    for (const [k, ico] of [['fries', '🍟'], ['burger', '🍔'], ['shake', '🥤']]) {
      const S = K.SPOTS[k];
      ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.beginPath(); ctx.ellipse(S.x + 1, S.y + 2, 26, 12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.ellipse(S.x, S.y, 26, 12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#e53935'; ctx.lineWidth = 2; ctx.stroke();
      ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ico, S.x, S.y + 1);
    }
    // the booths' back benches against the right wall's booth bays
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
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, X.x - 14, X.y - 8, 28, 9, 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🚪', X.x, X.y - 3.5);
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, (R.x0 + R.x1) / 2 - 60, R.y1 + w + 4, 120, 14, 4); ctx.fill(); ctx.fillStyle = '#ffd166'; ctx.font = r.font(8); ctx.fillText('🍔 BURGERS 🍔', (R.x0 + R.x1) / 2 - 0, R.y1 + w + 11);
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
  // the grill on the worktop: glowing bars, three patties (one flips now and then), steam
  drawGrill(r, g) {
    const ctx = r.ctx, K = CFG.BURGER, G = K.GRILL, st = this.st, t = g.time, y0 = K.ROOM.y0 + 4, y1 = K.BACK_COUNTER_Y - 6;
    ctx.fillStyle = '#2b2b2b'; U.roundRect(ctx, G.x0, y0, G.x1 - G.x0, y1 - y0, 4); ctx.fill();
    for (let x = G.x0 + 8; x < G.x1 - 4; x += 10) { ctx.fillStyle = `rgba(255,${120 + Math.round(40 * Math.sin(t * 3 + x))},40,0.55)`; ctx.fillRect(x, y0 + 4, 3, y1 - y0 - 8); }
    for (let i = 0; i < 3; i++) {
      const px = G.x0 + 32 + i * 48, py = (y0 + y1) / 2 + 3, ph = ((t + i * 0.9) % 2.7) / 2.7;
      const air = i === 1 && ph > 0.6 && ph < 0.8 ? (ph - 0.6) / 0.2 : -1, lift = air >= 0 ? Math.sin(air * Math.PI) * 14 : 0, sc = air >= 0 ? Math.abs(Math.cos(air * Math.PI)) : 1;
      ctx.save(); ctx.translate(px, py - lift); ctx.scale(1, Math.max(0.2, sc)); this.drawLayer(ctx, 'patty'); ctx.restore();
    }
    for (const q of st.steam) { const k = q.t / 1.3; ctx.fillStyle = `rgba(255,255,255,${(0.65 * (1 - k)).toFixed(2)})`; ctx.beginPath(); ctx.arc(q.x, q.y, 3 + k * 5, 0, Math.PI * 2); ctx.fill(); }
  },
  // the fryer: a steel vat of golden oil with bubbles, and the basket (down in the oil while fries cook)
  drawFryer(r, g) {
    const ctx = r.ctx, K = CFG.BURGER, st = this.st, x = K.FRYER.x, y0 = K.ROOM.y0 + 4, y1 = K.BACK_COUNTER_Y - 6, o = st.order;
    ctx.fillStyle = '#5c6670'; U.roundRect(ctx, x - 32, y0, 64, y1 - y0, 4); ctx.fill();
    ctx.fillStyle = '#e8b04a'; U.roundRect(ctx, x - 27, y0 + 5, 54, y1 - y0 - 10, 3); ctx.fill();
    for (const b of st.bubbles) { ctx.fillStyle = `rgba(255,248,220,${(0.9 * (1 - b.t / 0.5)).toFixed(2)})`; ctx.beginPath(); ctx.arc(b.x, b.y, 1.5 + b.t * 4, 0, Math.PI * 2); ctx.fill(); }
    const down = o && o.kind === 'fries' && o.phase === 'make' && o.t < CFG.BURGER.T.fries * 0.75;
    const by = down ? (y0 + y1) / 2 + 2 : y0 - 10;
    ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 1.5; ctx.strokeRect(x - 14, by - 6, 28, 12);
    for (let k = -10; k <= 10; k += 5) { ctx.beginPath(); ctx.moveTo(x + k, by - 6); ctx.lineTo(x + k, by + 6); ctx.stroke(); }
    ctx.fillStyle = '#2b2b2b'; ctx.fillRect(x + 14, by - 2, 14, 4);
    if (!down) { ctx.fillStyle = '#ffd166'; for (let k = -9; k <= 9; k += 4.5) ctx.fillRect(x + k - 1, by - 4, 2.5, 8); }
  },
  // the milkshake machine on the worktop: a pink head that shakes while it whirs
  drawMachine(r, g) {
    const ctx = r.ctx, K = CFG.BURGER, o = this.st.order, t = g.time, x = K.MACHINE.x, y = K.BACK_COUNTER_Y - 6;
    const whir = o && o.kind === 'shake' && o.phase === 'make', sh = whir ? Math.sin(t * 60) * 1 : 0;
    ctx.fillStyle = '#ff8fab'; U.roundRect(ctx, x - 22, y - 46, 44, 46, 8); ctx.fill();
    ctx.fillStyle = '#ffb3c6'; U.roundRect(ctx, x - 18 + sh, y - 42, 36, 16, 6); ctx.fill();
    ctx.fillStyle = '#d7dbe0'; ctx.fillRect(x - 3, y - 26, 6, 12);
    ctx.fillStyle = whir ? '#ff5252' : '#7ee081'; ctx.beginPath(); ctx.arc(x + 12, y - 8, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🍓', x + sh, y - 34);
    if (whir) { ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.5; for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + d * 26, y - 40); ctx.lineTo(x + d * 32, y - 44); ctx.moveTo(x + d * 26, y - 30); ctx.lineTo(x + d * 33, y - 30); ctx.stroke(); } }
  },
  // the cook behind the counter: paper hat, red shirt, white apron, a spatula; hops when handing food over
  drawCook(r, g) {
    const ctx = r.ctx, c = this.st.cook, o = this.st.order, t = g.time, x = c.x;
    const busy = o && o.phase === 'make', hop = (o && o.phase === 'give') || (this.st.say && this.st.say.t > 1.2) ? Math.abs(Math.sin(t * 9)) * 3 : 0;
    const y = c.y - hop;
    r.drawPerson(x, y, { shirt: '#e53935', skin: '#e0ac69', hair: '#6b3e1e', hairStyle: 0, facing: c.facing, moving: c.moving, bob: c.bob, carry: 0, apron: '#fff', pants: '#2d3a4a' });
    ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(43,29,20,0.45)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(x - 12, y - 44); ctx.lineTo(x + 12, y - 44); ctx.lineTo(x + 7, y - 55); ctx.lineTo(x - 7, y - 55); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e53935'; ctx.fillRect(x - 11, y - 48, 22, 3);
    // the spatula in his hand: it flips up and down while he works
    const f = c.facing, flip = busy || (!c.moving && Math.sin(t * 5) > 0.3) ? Math.sin(t * 14) * 0.5 : 0;
    ctx.save(); ctx.translate(x + f * 15, y - 17); ctx.rotate(f * (-0.6 + flip));
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(-1.2, -12, 2.4, 12); ctx.fillStyle = '#9aa0a8'; U.roundRect(ctx, -4.5, -20, 9, 9, 1.5); ctx.fill();
    ctx.restore();
  },
  // the counter in front of the cook (an entity so it hides his legs): mustard top, red front with picture circles
  drawCounter(r, g) {
    const ctx = r.ctx, K = CFG.BURGER, C = K.COUNTER, w = C.x1 - C.x0;
    ctx.fillStyle = '#e8b04a'; ctx.fillRect(C.x0, C.y0, w, 28);
    ctx.fillStyle = '#ffd166'; ctx.fillRect(C.x0, C.y0, w, 24);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(C.x0, C.y0 + 2, w, 3);
    ctx.fillStyle = '#c62828'; ctx.fillRect(C.x0, C.y0 + 28, w, C.y1 - C.y0 - 28);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; for (let x = C.x0 + 6; x < C.x1; x += 18) ctx.fillRect(x, C.y0 + 30, 9, C.y1 - C.y0 - 32);
    // napkins, ketchup and mustard at the left end, a bell at the right
    ctx.fillStyle = '#fff'; ctx.fillRect(C.x0 + 30, C.y0 + 6, 14, 12); ctx.fillStyle = '#e53935'; U.roundRect(ctx, C.x0 + 50, C.y0 - 4, 6, 18, 2); ctx.fill(); ctx.fillStyle = '#ffd166'; U.roundRect(ctx, C.x0 + 58, C.y0 - 4, 6, 18, 2); ctx.fill();
    ctx.fillStyle = '#e8b04a'; ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 0.8; ctx.strokeRect(C.x0 + 58, C.y0 - 4, 6, 18);
    const bx = C.x1 - 30, jump = this.st.order && this.st.order.phase === 'give' ? Math.abs(Math.sin(g.time * 20)) * 3 : 0;
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(bx, C.y0 + 14 - jump, 6, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#9aa0a8'; ctx.fillRect(bx - 7, C.y0 + 14 - jump, 14, 2.5);
  },
  drawBoothTable(r, g, i) {
    const ctx = r.ctx, K = CFG.BURGER, top = K.BOOTH.tops[i], x0 = K.BOOTH.x0 + 12, x1 = K.BOOTH.x1 - 12;
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect((x0 + x1) / 2 - 3, top + 52, 6, 6);
    ctx.fillStyle = '#d7dbe0'; U.roundRect(ctx, x0, top + 30, x1 - x0, 24, 5); ctx.fill();
    ctx.fillStyle = '#fff1d0'; U.roundRect(ctx, x0 + 2, top + 30, x1 - x0 - 4, 19, 4); ctx.fill();
    ctx.fillStyle = '#e53935'; U.roundRect(ctx, x1 - 22, top + 33, 4, 9, 1.5); ctx.fill(); ctx.fillStyle = '#ffd166'; U.roundRect(ctx, x1 - 16, top + 33, 4, 9, 1.5); ctx.fill();   // ketchup & mustard
  },
  drawBoothFront(r, g, top) {
    const ctx = r.ctx, x0 = CFG.BURGER.BOOTH.x0, x1 = CFG.BURGER.BOOTH.x1;
    ctx.fillStyle = '#9b1d1d'; U.roundRect(ctx, x0 + 2, top + 58, x1 - x0 - 4, 20, 6); ctx.fill();
    ctx.fillStyle = '#d32f2f'; U.roundRect(ctx, x0 + 5, top + 60, x1 - x0 - 10, 15, 5); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; for (let x = x0 + 14; x < x1 - 8; x += 16) ctx.fillRect(x, top + 62, 2, 11);
  },
  // a little round table with a red stool each side and a ketchup bottle
  drawTable(r, g, T) {
    const ctx = r.ctx;
    for (const dx of [-34, 34]) {
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(T.x + dx + 2, T.y + 6, 11, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#9aa0a8'; ctx.fillRect(T.x + dx - 2, T.y - 8, 4, 14);
      ctx.fillStyle = '#d32f2f'; ctx.beginPath(); ctx.ellipse(T.x + dx, T.y - 9, 11, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(T.x + 3, T.y + 8, 20, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(T.x - 3, T.y - 14, 6, 20);
    ctx.fillStyle = '#d7dbe0'; ctx.beginPath(); ctx.ellipse(T.x, T.y - 16, 22, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff1d0'; ctx.beginPath(); ctx.ellipse(T.x, T.y - 17, 20, 7.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e53935'; U.roundRect(ctx, T.x + 4, T.y - 28, 5, 11, 1.5); ctx.fill();
  },
  drawPlant(r, g, P) {
    const ctx = r.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(P.x + 2, P.y + 6, 13, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c0703a'; ctx.beginPath(); ctx.moveTo(P.x - 10, P.y - 12); ctx.lineTo(P.x + 10, P.y - 12); ctx.lineTo(P.x + 7, P.y + 6); ctx.lineTo(P.x - 7, P.y + 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3f9a4a'; for (const [dx, dy, rr] of [[0, -26, 10], [-9, -18, 8], [9, -18, 8], [0, -36, 7]]) { ctx.beginPath(); ctx.arc(P.x + dx, P.y + dy, rr, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#56b862'; ctx.beginPath(); ctx.arc(P.x - 3, P.y - 30, 5, 0, Math.PI * 2); ctx.fill();
  },

  // ---------- render hooks ----------
  dynamic(r, g) {
    const st = this.st; if (!st || g.area !== 'burger') return;
    this.drawOutside(r, g);
    this.drawFryer(r, g);
    this.drawGrill(r, g);
    this.drawMachine(r, g);
  },
  entities(r, g, items) {
    const st = this.st; if (!st) return;
    const p = g.player, K = CFG.BURGER, o = st.order;
    // the food in the chef's hand (and the happy munching head), in any map
    if (o && o.phase !== 'make' && this.visible(g)) items.push({ y: p.y + 0.5, draw: () => { this.drawHappyHead(r, g); this.drawOrder(r, g); } });
    if (g.area === 'town') {
      const S = K.SHOP;
      if (S.x1 > r.camX - 60 && S.x0 < r.camX + r.viewW + 60 && S.y1 > r.camY - 60 && S.y0 - 120 < r.camY + r.viewH) items.push({ y: S.y0 + 1, draw: () => this.drawSign(r, g) });
    }
    if (g.area !== 'burger') return;
    items.push({ y: st.cook.y, draw: () => this.drawCook(r, g) });
    items.push({ y: K.COUNTER.y1, draw: () => { this.drawCounter(r, g); if (o && o.phase === 'make') this.drawOrder(r, g); } });
    K.BOOTH.tops.forEach((top, i) => {
      items.push({ y: top + 56, draw: () => this.drawBoothTable(r, g, i) });
      items.push({ y: top + 78, draw: () => this.drawBoothFront(r, g, top) });
    });
    for (const T of K.TABLES) items.push({ y: T.y + 8, draw: () => this.drawTable(r, g, T) });
    for (const P of K.PLANTS) items.push({ y: P.y + 6, draw: () => this.drawPlant(r, g, P) });
  },
  overlay(r, g) {
    const st = this.st; if (!st) return;
    const ctx = r.ctx;
    if (st.say && g.area === 'burger') { const c = st.cook; r.drawBubble(c.x, c.y - 84 + Math.sin(g.time * 4) * 2, () => { ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText(st.say.text, 0, 0); }, 150); }
    for (const s of st.sparks) {
      if (s.area !== g.area) continue;
      const k = s.t / s.dur, a0 = (1 - k).toFixed(3);
      ctx.strokeStyle = `rgba(${s.color},${a0})`; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4 + k, r1 = 6 + k * 20, r2 = r1 + (i % 2 ? 5 : 9); ctx.beginPath(); ctx.moveTo(s.x + Math.cos(a) * r1, s.y + Math.sin(a) * r1); ctx.lineTo(s.x + Math.cos(a) * r2, s.y + Math.sin(a) * r2); ctx.stroke(); }
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
