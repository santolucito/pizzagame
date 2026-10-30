'use strict';
// Inside the big passenger jet at GATE 1 on the airfield (js/airfield.js owns the jet itself, its taxi routes and the flight).
// While the jet is parked on the airfield (nobody driving it, not away at Cloud Harbor) its passenger door has a spot
// beside it (at the end of the jet-bridge, or at the foot of a set of rolling stairs when it is parked anywhere else):
// '🚪 Board the plane' steps inside a long cabin seen from above. Left to right: the cockpit in the nose (the captain's
// seat and a co-pilot who gives a thumbs-up), the galley with a flight attendant and her snack cart, the door with the
// exit mat, ten rows of blue seats (2-aisle-2) with a few passengers (two reading, one asleep, a kid with a balloon),
// oval windows along both walls looking out at the apron, overhead bins, and a lavatory at the tail.
// Sit in a seat: the seatbelt sign dings on, the window next to you shows the apron outside, and the attendant pushes
// the cart over with free pretzels (or a juice). Sit in the captain's seat: the co-pilot gives a thumbs-up and the big
// button says '🛫 Take off!', which takes off for real (the chef is put in the jet as its driver and the airfield's own
// one-press take-off runs); pushing the stick stands you up again.
// Peek into the lavatory for a little picture (sometimes it is occupied). The door mat takes you back out.
// Extension module: registered with Game.ext (first, so the door beats the airfield's "Hop in" hint) and Render.ext.
CFG.JETCABIN = {
  WORLD: { x0: 11000, y0: 4000, x1: 12200, y1: 4400 },
  DOOR_OUT: 40,                                   // px out from the fuselage side where you stand to board (the foot of the stairs)
  DOOR_R: 34, HINT_R: 60,                         // how close to the door spot the button / the hint show
  FLOOR: { x0: 11112, y0: 4110, x1: 12100, y1: 4330 },
  BACK_TOP: 4030,                                 // the top wall is tall: bins, signs and windows hang on it
  WALL_B: 26,                                     // the bottom wall (windows drawn in it)
  BULKHEAD: { x0: 11236, x1: 11252, y0: 4196, y1: 4244 },   // the wall behind the cockpit; its doorway lines up with the aisle
  CAPT: { x: 11150, y: 4282 }, COPILOT: { x: 11150, y: 4160 },   // the two seats (the captain on the left, looking forward)
  CAPT_STAND: { x: 11198, y: 4270 },              // stand here to sit in the captain's seat
  COUNTER: { x0: 11262, y0: 4110, x1: 11400, y1: 4146 },   // the galley counter along the top wall
  TROLLEYS: { x0: 11262, y0: 4300, x1: 11330, y1: 4330 },  // stowed trolleys along the bottom wall
  FA_HOME: { x: 11318, y: 4176 },                 // where the flight attendant waits (her cart parked beside her)
  DOOR: { x0: 11448, x1: 11500 },                 // the plane's door in the bottom wall
  EXIT: { x: 11474, y: 4304 },                    // the mat inside the door
  AISLE: { y0: 4196, y1: 4244, y: 4220 },
  ROWS: [11570, 11618, 11666, 11714, 11762, 11810, 11858, 11906, 11954, 12002],
  SEAT_Y: { top: [4130, 4172], bot: [4268, 4310] },   // window, aisle | aisle, window
  BLOCKS: { x0: 11548, x1: 12024 },               // the seat blocks either side of the aisle (solid: you sit from the aisle)
  LAV: { x0: 12100, x1: 12150, door: { x: 12082, y: 4220 } },
  // the passengers: row, side, index (0 window / 1 aisle on top; 0 aisle / 1 window below) and what they are up to
  FOLKS: [
    { row: 1, side: 'top', i: 1, kind: 'read', shirt: '#59a14f', skin: '#f1c27d', hair: '#5a3a1a', hairStyle: 1 },
    { row: 2, side: 'top', i: 0, kind: 'sleep', shirt: '#9c6ade', skin: '#8d5524', hair: '#2b1d14', hairStyle: 0 },
    { row: 4, side: 'bot', i: 1, kind: 'read', shirt: '#f28e2b', skin: '#e0ac69', hair: '#b5651d', hairStyle: 2, paper: true },
    { row: 5, side: 'bot', i: 0, kind: 'kid', shirt: '#ffd166', skin: '#f1c27d', hair: '#e4572e', hairStyle: 3 },
    { row: 7, side: 'top', i: 1, kind: 'sit', shirt: '#3b7dd8', skin: '#c68642', hat: 'cap', capColor: '#41b883' },
    { row: 8, side: 'bot', i: 1, kind: 'sit', shirt: '#e15759', skin: '#f1c27d', hair: '#d4a017', hairStyle: 1 },
  ],
  SNACK: 20, CART_SPEED: 150, OFFER: 1.4, PEEK: 2.6, FADE: 0.45,
};
CFG.AREAS.jetcabin = { WORLD: CFG.JETCABIN.WORLD };

const JetInsideExt = {
  name: 'jetinside',
  st: null,
  defaults: { jetcabin: { seen: false, captain: false, sat: false, snacks: 0, peeks: 0, flights: 0 } },

  // ---------- state ----------
  build(g) {
    const J = CFG.JETCABIN;
    if (!g.s.jetcabin) g.s.jetcabin = JSON.parse(JSON.stringify(this.defaults.jetcabin));
    const seats = [];
    J.ROWS.forEach((x, row) => {
      J.SEAT_Y.top.forEach((y, i) => seats.push({ x, y, row, side: 'top', i, win: i === 0, folk: null }));
      J.SEAT_Y.bot.forEach((y, i) => seats.push({ x, y, row, side: 'bot', i, win: i === 1, folk: null }));
    });
    for (const f of J.FOLKS) { const s = seats.find((q) => q.row === f.row && q.side === f.side && q.i === f.i); if (s) s.folk = f; }
    this.st = {
      seats, fade: 0,
      seat: null,                 // { s, t, served }: sitting in a passenger seat
      captain: null,              // { t, still }: sitting at the controls
      view: 0,                    // 0..1: the window next to your seat opening up into a little view
      signOn: false, buckled: false, ding: 0,
      peek: null,                 // { t, occupied }
      snack: null,                // { kind, t }: the pretzels (or juice) you carry
      fa: { x: J.FA_HOME.x, y: J.FA_HOME.y, facing: 1, moving: false, bob: 0, state: 'home', wait: 0, offer: null, path: [] },
      wave: 0, obs: null,
    };
    this.st.obs = this.buildObstacles();
  },
  buildObstacles() {
    const J = CFG.JETCABIN, W = J.WORLD, F = J.FLOOR, B = J.BULKHEAD, A = J.AISLE, o = [];
    const box = (x0, y0, x1, y1) => o.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
    box(W.x0, W.y0, W.x1, F.y0);                 // the top wall (tall)
    box(W.x0, F.y1, W.x1, W.y1);                 // the bottom wall
    box(W.x0, F.y0, F.x0, F.y1);                 // the instrument console in the nose
    box(F.x1, F.y0, W.x1, F.y1);                 // the lavatory and the tail
    box(B.x0, F.y0, B.x1, B.y0); box(B.x0, B.y1, B.x1, F.y1);   // the cockpit wall, split by its doorway
    for (const c of [J.CAPT, J.COPILOT]) box(c.x - 18, c.y - 20, c.x + 20, c.y + 18);   // the two pilots' seats
    box(J.COUNTER.x0, J.COUNTER.y0, J.COUNTER.x1, J.COUNTER.y1);
    box(J.TROLLEYS.x0, J.TROLLEYS.y0, J.TROLLEYS.x1, J.TROLLEYS.y1);
    box(J.BLOCKS.x0, F.y0, J.BLOCKS.x1, A.y0); box(J.BLOCKS.x0, A.y1, J.BLOCKS.x1, F.y1);   // the seat blocks
    return o;
  },
  obstacles(g) { return g.area === 'jetcabin' && this.st ? this.st.obs : []; },
  free(x, y) {
    const F = CFG.JETCABIN.FLOOR, r = 11;
    if (x < F.x0 + r || x > F.x1 - r || y < F.y0 + r || y > F.y1 - r) return false;
    for (const o of this.st.obs) if (x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h) return false;
    return true;
  },

  // ---------- the jet on the airfield and its door ----------
  jet() { return typeof AirfieldExt !== 'undefined' && AirfieldExt.rt ? AirfieldExt.rt.jet : null; },
  // parked on the airfield: not away at Cloud Harbor, not driven, not rolling out / landing, on the ground
  jetParked(g) {
    const v = this.jet(); if (!v) return false;
    const rt = AirfieldExt.rt;
    if (v.away || v.lift > 0 || v.free) return false;
    if (g.driving && g.vehicle === v) return false;
    if ((rt.runup && rt.runup.plane === v) || (rt.roll && rt.roll.plane === v)) return false;
    if (g.travel && g.travel.via === 'flight') return false;
    return true;
  },
  // at its gate (the jet-bridge reaches the door) or somewhere else (rolling stairs)
  atGate(v) { return U.dist(v.x, v.y, v.home.x, v.home.y) < 8 && Math.abs(AirfieldExt.wrap(v.angle - v.home.angle)) < 0.15; },
  doorSpot(v) { return AirfieldExt.jetDoor(v, CFG.JETCABIN.DOOR_OUT); },
  onFoot(g) { return !g.driving && !g.onTrain && !g.ride && !g.travel && !g.fishing; },
  cityBusy() { return typeof CityExt !== 'undefined' && !!(CityExt.floor || (CityExt.st && (CityExt.st.cab || CityExt.st.boarding))); },
  doorDist(g) {
    if (g.area !== 'town' || !this.onFoot(g) || this.cityBusy() || !this.jetParked(g)) return Infinity;
    const a = AirfieldExt.rt; if (a.ride) return Infinity;
    const d = this.doorSpot(this.jet()), p = g.player; return U.dist(p.x, p.y, d.x, d.y);
  },

  // ---------- game hooks ----------
  action(g) {
    if (!this.st) this.build(g);
    const st = this.st, J = CFG.JETCABIN, p = g.player;
    if (g.area === 'town') return this.doorDist(g) < J.DOOR_R ? { label: '🚪 Board the plane', run: (gg) => this.board(gg) } : null;
    if (g.area !== 'jetcabin' || !this.onFoot(g)) return null;
    if (st.captain) return { label: '🛫 Take off!', run: (gg) => this.takeOff(gg) };
    if (st.seat) return { label: '🚶 Stand up', run: (gg) => this.standUp(gg) };
    if (U.dist(p.x, p.y, J.EXIT.x, J.EXIT.y) < 30) return { label: '🚪 Leave the plane', run: (gg) => this.leave(gg) };
    if (p.x < J.BULKHEAD.x0 && U.dist(p.x, p.y, J.CAPT_STAND.x, J.CAPT_STAND.y) < 44) return { label: "👨‍✈️ Sit in the captain's seat", run: (gg) => this.sitCaptain(gg) };
    if (!st.peek && U.dist(p.x, p.y, J.LAV.door.x, J.LAV.door.y) < 36) return { label: '🚽 Peek in', run: (gg) => this.peek(gg) };
    const s = this.seatFor(g); if (s) return { label: '💺 Sit down', run: (gg) => this.sitDown(gg, s) };
    return null;
  },
  // the chef in the aisle next to a row: the free seat on the nearer side (the window one first), else across the aisle
  seatFor(g) {
    const J = CFG.JETCABIN, p = g.player, A = J.AISLE;
    if (p.y < A.y0 - 4 || p.y > A.y1 + 4) return null;
    let row = -1, bd = 26;
    J.ROWS.forEach((x, i) => { const d = Math.abs(p.x - x); if (d < bd) { bd = d; row = i; } });
    if (row < 0) return null;
    const near = p.y < A.y ? 'top' : 'bot', order = [near, near === 'top' ? 'bot' : 'top'];
    for (const side of order) {
      const two = this.st.seats.filter((s) => s.row === row && s.side === side && !s.folk).sort((a, b) => (b.win ? 1 : 0) - (a.win ? 1 : 0));
      if (two.length) return two[0];
    }
    return null;
  },
  nearestFreeRow(p) {
    const J = CFG.JETCABIN; let best = null, bd = Infinity;
    for (const s of this.st.seats) { if (s.folk) continue; const d = U.dist(p.x, p.y, s.x, J.AISLE.y); if (d < bd) { bd = d; best = { x: s.x, y: J.AISLE.y }; } }
    return best;
  },
  board(g) {
    const J = CFG.JETCABIN, p = g.player, st = this.st;
    g.area = 'jetcabin'; p.x = J.EXIT.x; p.y = J.EXIT.y; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    st.seat = null; st.captain = null; st.view = 0; st.peek = null; st.fade = J.FADE;
    Sfx.ding(); Haptics.tap();
    if (!g.s.jetcabin.seen) { g.s.jetcabin.seen = true; g.toast('✈️ Welcome aboard the big plane!', true); }
  },
  // back out on the airfield at the door spot of the jet wherever it is now (its own gate if it is somehow away)
  leave(g) {
    const p = g.player, v = this.jet(), st = this.st;
    this.clearSeats(g);
    st.signOn = false; st.buckled = false; st.peek = null; st.fade = CFG.JETCABIN.FADE;
    g.area = 'town';
    const at = v.away ? Object.assign({}, v, { x: v.home.x, y: v.home.y, angle: v.home.angle }) : v;
    const spot = this.outSpot(g, at);
    p.x = spot.x; p.y = spot.y; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    Sfx.drop();
  },
  // the door spot, or (if something solid stands there) the same spot on the jet's other side, or beside its nose / tail
  outSpot(g, v) {
    const J = CFG.JETCABIN, d = this.doorSpot(v), obs = g.obstacles(), w = g.bounds(), c = Math.cos(v.angle), s = Math.sin(v.angle);
    const at = (lx, ly) => ({ x: v.x + lx * c - ly * s, y: v.y + lx * s + ly * c });
    const cands = [d, at(-60, 13 + J.DOOR_OUT), at(118, 0), at(-118, 0), at(0, 110), at(0, -110)];
    for (const q of cands) {
      if (q.x < w.x0 + 16 || q.x > w.x1 - 16 || q.y < w.y0 + 16 || q.y > w.y1 - 16) continue;
      if (!obs.some((o) => g.hitRect(q.x, q.y, 12, o))) return q;
    }
    return d;
  },
  sitDown(g, s) {
    const p = g.player, st = this.st;
    st.seat = { s, t: 0, served: false }; st.view = 0;
    p.x = s.x; p.y = s.y; p.moving = false; p.facing = -1;
    if (!st.signOn) { st.signOn = true; st.buckled = true; st.ding = 1.2; }
    g.s.jetcabin.sat = true;
    g.floats.push({ x: p.x, y: p.y - 66, text: 'Ding! Buckle up 💺', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    Sfx.ding(); Haptics.tap();
  },
  standUp(g) {
    const st = this.st, p = g.player, J = CFG.JETCABIN;
    if (st.seat) { p.x = st.seat.s.x; p.y = J.AISLE.y; st.seat = null; }
    else if (st.captain) { p.x = J.CAPT_STAND.x; p.y = J.CAPT_STAND.y; st.captain = null; }
    st.view = 0; p.moving = false; Sfx.drop();
  },
  clearSeats(g) {
    const st = this.st; if (!st) return;
    st.seat = null; st.captain = null; st.view = 0;
  },
  sitCaptain(g) {
    const p = g.player, st = this.st, J = CFG.JETCABIN;
    st.captain = { t: 0, still: 0 };
    p.x = J.CAPT.x; p.y = J.CAPT.y; p.moving = false; p.facing = -1;
    g.s.jetcabin.captain = true;
    g.floats.push({ x: J.COPILOT.x, y: J.COPILOT.y - 70, text: '👍', color: '#ffe08a', t: 0, dur: 1.6, big: true });
    Sfx.pickup(); Haptics.tap();
  },
  // leave the cabin with the chef at the controls of the jet itself and run the airfield's own take-off
  takeOff(g) {
    const v = this.jet(), rt = AirfieldExt.rt, p = g.player, st = this.st;
    if (!v || v.away || rt.runup || rt.roll) return;
    this.clearSeats(g); st.signOn = false; st.buckled = false; st.peek = null; st.fade = CFG.JETCABIN.FADE;
    g.area = 'town'; p.x = v.x; p.y = v.y; p.moving = false; p.hasMoved = true;
    g.driving = true; g.vehicle = v; v.vx = 0; v.vy = 0; g.cameraSnap = true;
    g.s.jetcabin.flights++;
    AirfieldExt.takeOff(g);
  },
  peek(g) {
    const st = this.st, p = g.player, n = g.s.jetcabin.peeks++, occupied = n % 3 === 1;   // every third peek someone is in there
    st.peek = { t: 0, occupied };
    g.floats.push({ x: p.x - 130, y: p.y - 66, text: occupied ? 'Occupied! 🙈' : 'Peek-a-boo! 🚽', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    Sfx.pickup();
    Haptics.tap();
  },
  home(g) {
    if (!this.st) return;
    const st = this.st;
    this.clearSeats(g);
    st.signOn = false; st.buckled = false; st.peek = null; st.fade = 0; st.snack = null; st.ding = 0;
    this.parkAttendant();
  },
  parkAttendant() { const fa = this.st.fa, J = CFG.JETCABIN; fa.x = J.FA_HOME.x; fa.y = J.FA_HOME.y; fa.state = 'home'; fa.offer = null; fa.path = []; fa.moving = false; fa.facing = 1; },
  // a save or a push that left the chef in a wall or inside the seats goes back onto the door mat
  rescue(g) {
    const p = g.player, J = CFG.JETCABIN;
    if (this.free(p.x, p.y)) return false;
    p.x = J.EXIT.x; p.y = J.EXIT.y; p.moving = false;
    g.floats.push({ x: p.x, y: p.y - 50, text: 'Oops! Back inside', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    return true;
  },
  update(g, dt) {
    if (!this.st) this.build(g);
    const st = this.st, p = g.player, J = CFG.JETCABIN;
    st.wave += dt;
    st.fade = Math.max(0, st.fade - dt); st.ding = Math.max(0, st.ding - dt);
    if (st.snack) { st.snack.t -= dt; if (st.snack.t <= 0) st.snack = null; }
    if (st.peek) { st.peek.t += dt; if (st.peek.t >= J.PEEK) st.peek = null; }
    if (g.area !== 'jetcabin') {
      if (st.seat || st.captain) this.clearSeats(g);
      if (st.fa.state !== 'home') this.parkAttendant();
      return;
    }
    if (st.seat) {
      st.seat.t += dt; p.x = st.seat.s.x; p.y = st.seat.s.y; p.moving = false; p.facing = -1;
      st.view = Math.min(1, st.view + dt * 2.5);
    } else if (st.captain) {
      const c = st.captain; c.t += dt; p.x = J.CAPT.x; p.y = J.CAPT.y; p.moving = false; p.facing = -1;
      // pushing the stick for a moment gets you up again
      const a = Input.axis(); c.still = Math.hypot(a.x, a.y) > 0.6 ? c.still + dt : 0;
      if (c.still > 0.45) this.standUp(g);
    } else {
      st.view = Math.max(0, st.view - dt * 3);
      this.rescue(g);
    }
    this.updateAttendant(g, dt);
  },
  // the flight attendant pushes her cart down the aisle to the chef's row, offers a snack, and goes back to the galley
  updateAttendant(g, dt) {
    const st = this.st, fa = st.fa, J = CFG.JETCABIN, sp = J.CART_SPEED, p = g.player;
    fa.moving = false;
    const go = (x, y) => { const done = U.moveToward(fa, x, y, sp, dt); fa.moving = !done; return done; };
    if (fa.state === 'home') {
      if (st.seat && !st.seat.served && st.seat.t > 0.8) {
        const row = st.seat.s.x;
        fa.path = [{ x: J.FA_HOME.x, y: J.AISLE.y }, { x: row - 36, y: J.AISLE.y }]; fa.state = 'out'; fa.facing = 1;
      }
    } else if (fa.state === 'out') {
      const q = fa.path[0];
      if (go(q.x, q.y)) fa.path.shift();
      if (!st.seat) { fa.state = 'back'; fa.path = [{ x: J.FA_HOME.x, y: J.AISLE.y }, J.FA_HOME]; }
      else if (!fa.path.length) {
        const kind = g.s.jetcabin.snacks % 2 === 0 ? 'pretzels' : 'juice';
        fa.state = 'offer'; fa.wait = J.OFFER; fa.offer = kind; fa.facing = 1;
      }
    } else if (fa.state === 'offer') {
      fa.wait -= dt;
      if (fa.wait <= 0) {
        if (st.seat) {
          const kind = fa.offer; st.seat.served = true; st.snack = { kind, t: J.SNACK }; g.s.jetcabin.snacks++;
          g.floats.push({ x: p.x + 40, y: p.y - 70, text: kind === 'pretzels' ? 'Yum, pretzels! 🥨' : 'Yum, apple juice! 🧃', color: '#ffe08a', t: 0, dur: 1.5, big: true });
          Sfx.pickup(); Haptics.success();
        }
        fa.offer = null; fa.state = 'back'; fa.path = [{ x: J.FA_HOME.x, y: J.AISLE.y }, J.FA_HOME];
      }
    } else if (fa.state === 'back') {
      const q = fa.path[0]; fa.facing = -1;
      if (!q) fa.state = 'home';
      else if (go(q.x, q.y)) { fa.path.shift(); if (!fa.path.length) { fa.state = 'home'; fa.facing = 1; } }
    }
    fa.bob = fa.moving ? fa.bob + dt * 12 : 0;
  },

  hint(g) {
    if (!this.st) return undefined;
    const st = this.st, J = CFG.JETCABIN, p = g.player, s = g.s.jetcabin;
    if (g.area === 'town') {
      const d = this.doorDist(g); if (d > J.HINT_R) return undefined;
      return { text: 'Go inside the big plane! 🛫', target: d < 30 ? null : this.doorSpot(this.jet()) };
    }
    if (g.area !== 'jetcabin') return undefined;
    if (st.captain) return { text: 'Press the button to take off! 🛫', target: null };
    if (st.seat) {
      const fa = st.fa;
      if (fa.state === 'out' || fa.state === 'offer') return { text: 'Here comes the snack cart! 🥨', target: null };
      return { text: st.snack ? 'Munch munch! What a view 💺' : 'Enjoy the view out the window! 💺', target: null };
    }
    if (st.peek) return { text: st.peek.occupied ? 'Oops, somebody is in there! 🙈' : 'A tiny bathroom! 🚽', target: null };
    if (!s.captain) return { text: 'Go to the cockpit and fly! 👨‍✈️', target: p.x < J.BULKHEAD.x0 && U.dist(p.x, p.y, J.CAPT_STAND.x, J.CAPT_STAND.y) < 44 ? null : J.CAPT_STAND };
    if (!s.sat) { const t = this.nearestFreeRow(p); return { text: 'Find a seat by the window 💺', target: this.seatFor(g) ? null : t }; }
    if (!s.peeks) return { text: 'Peek into the tiny bathroom 🚽', target: U.dist(p.x, p.y, J.LAV.door.x, J.LAV.door.y) < 36 ? null : J.LAV.door };
    return { text: 'Leave the plane at the door 🚪', target: U.dist(p.x, p.y, J.EXIT.x, J.EXIT.y) < 30 ? null : J.EXIT };
  },

  // ======================= render hooks =======================
  // ---------- the airfield: rolling stairs at the door when the jet is parked away from its gate ----------
  drawStairs(r, g, v) {
    const ctx = r.ctx, D = CFG.AIRFIELD.JET_DOOR, L = CFG.JETCABIN.DOOR_OUT - 4;
    ctx.save(); ctx.translate(v.x, v.y); ctx.rotate(v.angle); ctx.translate(D.x, D.y);
    // y runs from the door (0) out to -L; the stair truck stands on its wheels at the far end
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(-8, -L - 2, 22, L);
    ctx.fillStyle = '#2b1d14'; for (const [wx, wy] of [[-11, -L + 3], [11, -L + 3], [-11, -L + 16], [11, -L + 16]]) { ctx.beginPath(); ctx.arc(wx, wy, 3, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#f2b134'; ctx.fillRect(-10, -L, 3.5, L); ctx.fillRect(6.5, -L, 3.5, L);   // the rails
    ctx.fillStyle = '#e8e4d8'; ctx.fillRect(-6.5, -L, 13, L);
    ctx.fillStyle = '#9aa0a8'; for (let y = -L + 3; y < -6; y += 4) ctx.fillRect(-6.5, y, 13, 1.6);   // the steps
    ctx.fillStyle = '#fff'; ctx.fillRect(-8, -7, 16, 7);   // the little platform at the door
    ctx.fillStyle = '#ffe08a'; ctx.fillRect(-4, -1.5, 8, 2);   // the open door glowing
    ctx.restore();
  },
  // a short canopy from the end of the jet-bridge onto the door, when the jet is at its gate
  drawBridgeHood(r, g, v) {
    const ctx = r.ctx, D = CFG.AIRFIELD.JET_DOOR;
    ctx.save(); ctx.translate(v.x, v.y); ctx.rotate(v.angle); ctx.translate(D.x, D.y);
    ctx.fillStyle = '#ffe08a'; ctx.fillRect(-4, -1.5, 8, 2);   // the open door, lit inside
    ctx.restore();
  },
  // ---------- the cabin (static) ----------
  paint: { jetcabin(r, g) { JetInsideExt.paintCabin(r, g); } },
  paintCabin(r, g) {
    if (!this.st) this.build(g);
    const ctx = r.ctx, J = CFG.JETCABIN, W = J.WORLD, F = J.FLOOR, A = J.AISLE, B = J.BULKHEAD, BT = J.BACK_TOP;
    // the apron all round (the jet is parked) and the fuselage's white skin with its blue cheat line
    ctx.fillStyle = '#c9c4b8'; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 1; for (let x = W.x0; x < W.x1; x += 48) { ctx.beginPath(); ctx.moveTo(x + 0.5, W.y0); ctx.lineTo(x + 0.5, W.y1); ctx.stroke(); }
    ctx.fillStyle = '#f2c84b'; ctx.fillRect(W.x0, W.y1 - 14, W.x1 - W.x0, 4);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; U.roundRect(ctx, W.x0 + 18, W.y0 + 22, W.x1 - W.x0 - 26, 356, 160); ctx.fill();
    ctx.fillStyle = '#f7f8fa'; U.roundRect(ctx, W.x0 + 12, W.y0 + 14, W.x1 - W.x0 - 26, 356, 160); ctx.fill();
    ctx.fillStyle = '#3b7dd8'; ctx.fillRect(W.x0 + 120, W.y0 + 16, W.x1 - W.x0 - 260, 6); ctx.fillRect(W.x0 + 120, W.y1 - 38, W.x1 - W.x0 - 260, 6);
    // the nose: a dark cockpit with the windshield panes (sky above, the apron below)
    ctx.fillStyle = '#2d3a4a'; ctx.beginPath(); ctx.moveTo(F.x0, BT + 8); ctx.quadraticCurveTo(W.x0 + 26, BT + 20, W.x0 + 26, A.y); ctx.quadraticCurveTo(W.x0 + 26, F.y1 + 20, F.x0, F.y1 + 18); ctx.closePath(); ctx.fill();
    for (let i = 0; i < 4; i++) {
      const y0 = 4092 + i * 58, sky = ctx.createLinearGradient(0, y0, 0, y0 + 44);
      sky.addColorStop(0, '#7fc8f8'); sky.addColorStop(0.55, '#cfeeff'); sky.addColorStop(0.56, '#b9b4a8'); sky.addColorStop(1, '#a8a296');
      ctx.fillStyle = sky; const x0 = W.x0 + 40 + (i === 0 || i === 3 ? 10 : 0); U.roundRect(ctx, x0, y0, F.x0 - 22 - x0, 44, 8); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(x0 + 4, y0 + 4, 6, 18);
    }
    // the floor: dark in the cockpit, light tiles in the galley and by the door, blue carpet in the cabin with the aisle runner
    ctx.fillStyle = '#4a5260'; ctx.fillRect(F.x0, F.y0, B.x0 - F.x0, F.y1 - F.y0);
    ctx.fillStyle = '#e6e2da'; ctx.fillRect(B.x1, F.y0, J.BLOCKS.x0 - B.x1, F.y1 - F.y0);
    ctx.strokeStyle = 'rgba(0,0,0,0.07)'; for (let x = B.x1; x < J.BLOCKS.x0; x += 24) { ctx.beginPath(); ctx.moveTo(x + 0.5, F.y0); ctx.lineTo(x + 0.5, F.y1); ctx.stroke(); } for (let y = F.y0; y < F.y1; y += 24) { ctx.beginPath(); ctx.moveTo(B.x1, y + 0.5); ctx.lineTo(J.BLOCKS.x0, y + 0.5); ctx.stroke(); }
    ctx.fillStyle = '#5b6f9a'; ctx.fillRect(J.BLOCKS.x0, F.y0, F.x1 - J.BLOCKS.x0, F.y1 - F.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; for (let x = J.BLOCKS.x0 + 8; x < F.x1; x += 16) for (let y = F.y0 + 8; y < F.y1; y += 16) ctx.fillRect(x, y, 2, 2);
    ctx.fillStyle = '#41507a'; ctx.fillRect(J.BLOCKS.x0 - 120, A.y0 + 4, F.x1 - J.BLOCKS.x0 + 120, A.y1 - A.y0 - 8);
    ctx.fillStyle = '#ffd166'; for (let x = J.BLOCKS.x0 - 116; x < F.x1; x += 22) { ctx.fillRect(x, A.y0 + 6, 6, 2); ctx.fillRect(x, A.y1 - 8, 6, 2); }   // the little floor lights along the aisle
    // the tall top wall: overhead bins, the seatbelt-sign strip and the windows; the bottom wall with its own windows
    ctx.fillStyle = '#eef0f3'; ctx.fillRect(F.x0, BT, F.x1 - F.x0 + 50, F.y0 - BT);
    ctx.fillStyle = '#dfe3e8'; ctx.fillRect(B.x1, BT + 2, F.x1 - B.x1, 26);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = B.x1; x < F.x1; x += 48) ctx.fillRect(x, BT + 2, 2, 26);
    ctx.fillStyle = '#b8c0cc'; for (let x = B.x1 + 20; x < F.x1; x += 48) U.roundRect(ctx, x, BT + 20, 12, 4, 2), ctx.fill();   // bin handles
    ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(F.x0, F.y0 - 6, F.x1 - F.x0 + 50, 6);
    ctx.fillStyle = '#e8e4d8'; ctx.fillRect(F.x0, F.y1, F.x1 - F.x0 + 50, J.WALL_B); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(F.x0, F.y1, F.x1 - F.x0 + 50, 3);
    for (const x of this.windowXs()) { this.paintWindow(ctx, x, 4086, 9, 11); this.paintWindow(ctx, x, F.y1 + 14, 8, 7); }
    // the cockpit: the console under the windshield, the bulkhead with its open doorway and a COCKPIT sign
    ctx.fillStyle = '#3a4250'; ctx.fillRect(F.x0 - 30, F.y0, 30, F.y1 - F.y0);
    ctx.fillStyle = '#1e2733'; for (let y = F.y0 + 16; y < F.y1 - 16; y += 34) U.roundRect(ctx, F.x0 - 24, y, 18, 24, 3), ctx.fill();
    ctx.fillStyle = '#5ad1ff'; for (let y = F.y0 + 20; y < F.y1 - 16; y += 34) ctx.fillRect(F.x0 - 21, y + 4, 12, 10);
    ctx.fillStyle = '#d8dbe0'; ctx.fillRect(B.x0, F.y0, B.x1 - B.x0, B.y0 - F.y0); ctx.fillRect(B.x0, B.y1, B.x1 - B.x0, F.y1 - B.y1);
    ctx.fillStyle = '#c4c9d1'; ctx.fillRect(B.x1, B.y1, 30, 6);   // the cockpit door, folded open against the wall
    ctx.fillStyle = '#d8dbe0'; ctx.fillRect(B.x0 - 2, BT, B.x1 - B.x0 + 4, F.y0 - BT);
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, B.x0 - 30, BT + 4, 76, 16, 4); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('✈️ COCKPIT', (B.x0 + B.x1) / 2, BT + 12);
    // the pilots' seats (their fronts are drawn over whoever sits in them)
    for (const c of [J.CAPT, J.COPILOT]) this.paintSeatBack(ctx, c.x, c.y, '#5b3a1a', '#7a5230');
    // the galley: steel counter with ovens on the wall above, coffee pots and cups; stowed trolleys along the bottom
    const C = J.COUNTER;
    ctx.fillStyle = '#aab2bd'; ctx.fillRect(C.x0, BT + 30, C.x1 - C.x0, C.y0 - BT - 30);
    ctx.fillStyle = '#7d8693'; for (let x = C.x0 + 6; x < C.x1 - 20; x += 34) { U.roundRect(ctx, x, BT + 36, 28, 26, 3); ctx.fill(); }
    ctx.fillStyle = '#2b1d14'; for (let x = C.x0 + 10; x < C.x1 - 20; x += 34) ctx.fillRect(x, BT + 40, 20, 14);
    ctx.fillStyle = '#ff8c42'; for (let x = C.x0 + 12; x < C.x1 - 20; x += 34) ctx.fillRect(x + 14, BT + 57, 4, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(C.x0, C.y1, C.x1 - C.x0, 5);
    ctx.fillStyle = '#c9ced6'; ctx.fillRect(C.x0, C.y0, C.x1 - C.x0, C.y1 - C.y0); ctx.fillStyle = '#e3e7ec'; ctx.fillRect(C.x0, C.y0, C.x1 - C.x0, 8);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = C.x0 + 34; x < C.x1; x += 34) ctx.fillRect(x, C.y0 + 8, 2, C.y1 - C.y0 - 8);
    for (const [x, col] of [[C.x0 + 20, '#2b1d14'], [C.x0 + 44, '#c62828']]) { ctx.fillStyle = col; U.roundRect(ctx, x - 6, C.y0 - 6, 12, 14, 3); ctx.fill(); ctx.fillStyle = '#9aa0a8'; ctx.fillRect(x - 6, C.y0 - 8, 12, 3); }
    ctx.fillStyle = '#fff'; for (let i = 0; i < 4; i++) { U.roundRect(ctx, C.x0 + 70 + i * 12, C.y0 - 2, 8, 9, 2); ctx.fill(); }
    const T = J.TROLLEYS; ctx.fillStyle = '#b9c0ca'; ctx.fillRect(T.x0, T.y0 - 16, T.x1 - T.x0, T.y1 - T.y0 + 16); ctx.fillStyle = 'rgba(0,0,0,0.15)'; for (let x = T.x0 + 22; x < T.x1; x += 23) ctx.fillRect(x, T.y0 - 16, 2, T.y1 - T.y0 + 16); ctx.fillStyle = '#5c6670'; for (let x = T.x0 + 6; x < T.x1; x += 23) ctx.fillRect(x, T.y0 - 10, 10, 3);
    // the door in the bottom wall with its EXIT sign, the welcome mat inside it, a second door across the cabin
    const D = J.DOOR;
    ctx.fillStyle = '#c4c9d1'; ctx.fillRect(D.x0, F.y1, D.x1 - D.x0, J.WALL_B); ctx.fillStyle = '#ffe08a'; ctx.fillRect(D.x0 + 8, F.y1 + 6, D.x1 - D.x0 - 16, J.WALL_B - 10);   // open: the sunny apron outside
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(D.x0 - 4, F.y1, 4, J.WALL_B); ctx.fillRect(D.x1, F.y1, 4, J.WALL_B);
    ctx.fillStyle = '#d8dbe0'; U.roundRect(ctx, D.x0, BT + 30, D.x1 - D.x0, F.y0 - BT - 30, 6); ctx.fill(); ctx.fillStyle = '#9fd8ff'; ctx.beginPath(); ctx.ellipse((D.x0 + D.x1) / 2, BT + 52, 7, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#9aa0a8'; ctx.fillRect(D.x1 - 14, BT + 64, 8, 3);
    ctx.fillStyle = '#2f9e44'; U.roundRect(ctx, (D.x0 + D.x1) / 2 - 18, BT + 6, 36, 14, 3); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = r.font(9); ctx.fillText('EXIT', (D.x0 + D.x1) / 2, BT + 13);
    const E = J.EXIT; ctx.fillStyle = '#c62828'; U.roundRect(ctx, E.x - 28, E.y - 12, 56, 24, 6); ctx.fill(); ctx.strokeStyle = '#ffe08a'; ctx.lineWidth = 1.5; U.roundRect(ctx, E.x - 24, E.y - 8, 48, 16, 4); ctx.stroke();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(10); ctx.fillText('✈️ 🚪', E.x, E.y);
    // the seats: a blue seat with a white headrest cover, facing the nose
    for (const s of this.st.seats) this.paintSeatBack(ctx, s.x, s.y, '#2457a8', '#2f6fd0');
    // the lavatory at the tail: a folding door with a sign
    const LV = J.LAV, ly0 = A.y0 - 6, ly1 = A.y1 + 6;
    ctx.fillStyle = '#d8dbe0'; ctx.fillRect(LV.x0, F.y0, LV.x1 - LV.x0 + 10, F.y1 - F.y0); ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(LV.x0, F.y0, 4, F.y1 - F.y0);
    ctx.fillStyle = '#eef0f3'; ctx.fillRect(LV.x0 - 2, ly0, 10, ly1 - ly0); ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = ly0 + 8; y < ly1; y += 10) ctx.fillRect(LV.x0 - 2, y, 10, 2);
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, LV.x0 + 10, A.y - 12, 30, 24, 5); ctx.fill(); ctx.font = r.font(13); ctx.fillText('🚻', LV.x0 + 25, A.y);
  },
  windowXs() { const J = CFG.JETCABIN, out = [11140, 11200, 11300, 11380]; for (const x of J.ROWS) out.push(x); out.push(12060); return out; },
  paintWindow(ctx, x, y, rx, ry) {
    ctx.fillStyle = '#c4c9d1'; ctx.beginPath(); ctx.ellipse(x, y, rx + 3, ry + 3, 0, 0, Math.PI * 2); ctx.fill();
    const grd = ctx.createLinearGradient(0, y - ry, 0, y + ry); grd.addColorStop(0, '#8fd0f7'); grd.addColorStop(0.5, '#d9f0ff'); grd.addColorStop(0.52, '#b9b4a8'); grd.addColorStop(1, '#a29c90');
    ctx.fillStyle = grd; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(x - rx * 0.35, y - ry * 0.35, rx * 0.25, ry * 0.3, 0, 0, Math.PI * 2); ctx.fill();
  },
  // a seat seen from the side, facing the nose (left): the back and headrest on the right, the cushion
  paintSeatBack(ctx, x, y, dark, light) {
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 5, 16, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = dark; U.roundRect(ctx, x + 6, y - 40, 11, 44, 4); ctx.fill();
    ctx.fillStyle = '#f3f3f3'; U.roundRect(ctx, x + 7, y - 40, 9, 10, 3); ctx.fill();
    ctx.fillStyle = light; U.roundRect(ctx, x - 14, y - 12, 26, 12, 4); ctx.fill();
  },
  // drawn over a sitter's legs: the cushion's front edge and the armrest (and a buckled belt)
  drawSeatFront(r, x, y, col, belt) {
    const ctx = r.ctx;
    ctx.fillStyle = col; U.roundRect(ctx, x - 15, y - 12, 28, 14, 4); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x - 13, y - 11, 24, 3);
    ctx.fillStyle = '#9aa0a8'; U.roundRect(ctx, x - 12, y - 16, 22, 4, 2); ctx.fill();
    if (belt) { ctx.fillStyle = '#5c6670'; ctx.fillRect(x - 12, y - 14, 22, 3); ctx.fillStyle = '#d8dbe0'; ctx.fillRect(x - 3, y - 15, 6, 5); }
  },

  // ---------- live things ----------
  dynamic(r, g) {
    if (g.area !== 'jetcabin' || !this.st) return;
    const ctx = r.ctx, st = this.st, J = CFG.JETCABIN, t = st.wave;
    // the seatbelt signs on the top wall: dark, or lit up after the ding
    for (let i = 0; i < J.ROWS.length; i += 2) {
      const x = (J.ROWS[i] + J.ROWS[i + 1]) / 2, y = J.BACK_TOP + 31, on = st.signOn, flash = st.ding > 0 && Math.floor(st.ding * 8) % 2 === 0;
      ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, x - 14, y, 28, 11, 3); ctx.fill();
      ctx.fillStyle = on ? (flash ? '#fff7c2' : '#ffd166') : '#5c6670'; U.roundRect(ctx, x - 12, y + 1.5, 24, 8, 2); ctx.fill();
      ctx.fillStyle = on ? '#2b1d14' : '#3a4250'; ctx.fillRect(x - 7, y + 4.5, 14, 2); ctx.fillRect(x - 2, y + 3.5, 4, 4);   // a little belt
    }
    // the window next to your seat glows (its view opens up beside you, drawn in the overlay)
    if (st.seat && st.view > 0) {
      const s = st.seat.s, top = s.side === 'top', wy = top ? 4086 : J.FLOOR.y1 + 14;
      ctx.strokeStyle = `rgba(255,224,138,${(0.6 + 0.4 * Math.sin(t * 5)) * st.view})`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(s.x, wy, top ? 14 : 13, top ? 16 : 12, 0, 0, Math.PI * 2); ctx.stroke();
    }
    // the lavatory's little sign: green when free, red while someone is in there
    const LV = J.LAV, occ = st.peek && st.peek.occupied;
    ctx.fillStyle = occ ? '#e4572e' : '#41b883'; ctx.beginPath(); ctx.arc(LV.x0 + 25, J.AISLE.y + 20, 4, 0, Math.PI * 2); ctx.fill();
  },
  // the little view out of the window beside your seat: the apron with the tower, a baggage tug driving by, a cloud
  drawView(r, g) {
    const ctx = r.ctx, st = this.st, J = CFG.JETCABIN, t = st.wave, s = st.seat.s, top = s.side === 'top';
    const wx = s.x, wy = top ? 4086 : J.FLOOR.y1 + 14, k = st.view, rx = 32 * k, ry = 38 * k, vx = s.x - 64, vy = s.y - 74;
    if (k < 0.05) return;
    // a dotted line from the real window to the big round view
    ctx.fillStyle = 'rgba(255,224,138,0.9)'; for (let i = 1; i < 5; i++) { const q = i / 5; ctx.beginPath(); ctx.arc(U.lerp(wx, vx, q), U.lerp(wy, vy, q), 2, 0, Math.PI * 2); ctx.fill(); }
    ctx.save(); ctx.translate(vx, vy);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(3, 4, rx + 6, ry + 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c4c9d1'; ctx.beginPath(); ctx.ellipse(0, 0, rx + 6, ry + 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#eef0f3'; ctx.beginPath(); ctx.ellipse(0, 0, rx + 3, ry + 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.clip();
    const sky = ctx.createLinearGradient(0, -ry, 0, ry); sky.addColorStop(0, '#49a8ea'); sky.addColorStop(0.55, '#cfeeff'); ctx.fillStyle = sky; ctx.fillRect(-rx, -ry, rx * 2, ry * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; const cx = ((t * 6) % 90) - 45; ctx.beginPath(); ctx.arc(cx, -ry * 0.55, 7, 0, Math.PI * 2); ctx.arc(cx + 9, -ry * 0.6, 9, 0, Math.PI * 2); ctx.arc(cx + 19, -ry * 0.55, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c9c3b5'; ctx.fillRect(12, -ry * 0.5, 6, ry * 0.6); ctx.fillStyle = '#2d3a4a'; ctx.fillRect(8, -ry * 0.62, 14, 8); ctx.fillStyle = '#9fe0ff'; ctx.fillRect(10, -ry * 0.6, 10, 4);   // the control tower
    ctx.fillStyle = '#7fbf5f'; ctx.fillRect(-rx, ry * 0.08, rx * 2, 4);
    ctx.fillStyle = '#b9b4a8'; ctx.fillRect(-rx, ry * 0.08 + 4, rx * 2, ry);
    ctx.fillStyle = '#f2c84b'; ctx.fillRect(-rx, ry * 0.5, rx * 2, 2);
    const bx = ((t * 22) % 120) - 60, by = ry * 0.32;   // the baggage tug with two carts
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, bx, by, 14, 8, 2); ctx.fill(); ctx.fillStyle = '#9fe0ff'; ctx.fillRect(bx + 8, by + 1, 4, 3);
    ctx.fillStyle = '#5c6670'; for (const dx of [-14, -28]) { ctx.fillRect(bx + dx, by + 1, 12, 7); ctx.fillStyle = ['#3b7dd8', '#ffd166'][dx === -14 ? 0 : 1]; ctx.fillRect(bx + dx + 2, by - 3, 8, 5); ctx.fillStyle = '#5c6670'; }
    ctx.fillStyle = '#2b1d14'; for (const dx of [2, 11, -12, -4, -26, -18]) { ctx.beginPath(); ctx.arc(bx + dx, by + 9, 1.8, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  },
  drawFolk(r, g, s, f) {
    const ctx = r.ctx, st = this.st, t = st.wave, kid = f.kind === 'kid', sc = kid ? 0.78 : 1;
    const look = { shirt: f.shirt, skin: f.skin, hair: f.hair, hairStyle: f.hairStyle, hat: f.hat, capColor: f.capColor, facing: -1, moving: false, bob: 0, carry: 0, pants: '#3a3f5c' };
    if (kid) {   // the balloon, tied to the kid's shoulder, bobbing above the seats
      const bx = s.x - 10 + Math.sin(t * 1.3) * 3, by = s.y - 92 + Math.sin(t * 1.7) * 3;
      ctx.strokeStyle = 'rgba(43,29,20,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(s.x - 10, s.y - 14); ctx.quadraticCurveTo(s.x - 16, s.y - 50, bx, by + 14); ctx.stroke();
      ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.ellipse(bx, by, 11, 13, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.ellipse(bx - 4, by - 5, 3, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(bx - 3, by + 14); ctx.lineTo(bx + 3, by + 14); ctx.lineTo(bx, by + 11); ctx.closePath(); ctx.fill();
    }
    ctx.save(); ctx.translate(s.x, s.y); ctx.scale(sc, sc); r.drawPerson(0, 0, look);
    if (f.kind === 'sleep') {   // eyes shut
      ctx.fillStyle = f.skin; ctx.beginPath(); ctx.arc(-6, -38, 2.4, 0, Math.PI * 2); ctx.arc(0, -38, 2.4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(-6, -39, 2, 0.15 * Math.PI, 0.85 * Math.PI); ctx.moveTo(2, -38); ctx.arc(0, -39, 2, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    }
    if (f.kind === 'read') {   // a book (or a newspaper) held up in front
      if (f.paper) { ctx.fillStyle = '#f3efe3'; ctx.fillRect(-14, -30, 22, 18); ctx.fillStyle = 'rgba(0,0,0,0.3)'; for (let i = 0; i < 4; i++) ctx.fillRect(-12, -27 + i * 4, 18, 1.5); ctx.fillStyle = '#2b1d14'; ctx.fillRect(-3, -30, 1, 18); }
      else { ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, -13, -28, 18, 14, 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(-12, -27, 7, 12); ctx.fillRect(-4, -27, 8, 12); ctx.fillStyle = '#ffd166'; ctx.fillRect(-5, -27, 1, 12); }
    }
    ctx.restore();
    this.drawSeatFront(r, s.x, s.y, '#2f6fd0', st.buckled);
  },
  drawAttendant(r, g) {
    const ctx = r.ctx, st = this.st, fa = st.fa, f = fa.facing || 1;
    const cx = fa.x + 32, cy = fa.y;   // her snack cart, just ahead of her down the aisle
    const cart = () => {
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(cx - 14, cy + 2, 30, 5);
      ctx.fillStyle = '#c9ced6'; U.roundRect(ctx, cx - 14, cy - 30, 28, 32, 3); ctx.fill();
      ctx.fillStyle = '#9aa0a8'; ctx.fillRect(cx - 14, cy - 20, 28, 2); ctx.fillRect(cx - 14, cy - 10, 28, 2);
      ctx.fillStyle = '#e4572e'; ctx.fillRect(cx - 14, cy - 30, 28, 4);
      ctx.fillStyle = '#ffd166'; U.roundRect(ctx, cx - 11, cy - 38, 9, 9, 2); ctx.fill(); ctx.fillStyle = '#fff'; U.roundRect(ctx, cx + 1, cy - 37, 6, 8, 2); ctx.fill(); ctx.fillStyle = '#41b883'; U.roundRect(ctx, cx + 8, cy - 37, 5, 8, 2); ctx.fill();
      ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🥨', cx - 6, cy - 34);
      ctx.fillStyle = '#2b1d14'; for (const dx of [-10, 10]) { ctx.beginPath(); ctx.arc(cx + dx, cy + 3, 2.5, 0, Math.PI * 2); ctx.fill(); }
    };
    cart();
    r.drawPerson(fa.x, fa.y, { shirt: '#c62828', skin: '#f1c27d', hair: '#2b1d14', hairStyle: 2, facing: f, moving: fa.moving, bob: fa.bob, carry: 0, pants: '#2d3a4a', bowtie: '#ffd166' });
  },
  drawSnack(r, g) {
    const ctx = r.ctx, p = g.player, sn = this.st.snack, f = p.facing || 1, x = p.x + f * 17, y = p.y - 20 + (p.moving ? Math.sin(p.bob || 0) * 2 : 0);
    ctx.font = r.font(15); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(sn.kind === 'pretzels' ? '🥨' : '🧃', x, y);
  },
  entities(r, g, items) {
    if (!this.st) return;
    const st = this.st, p = g.player, J = CFG.JETCABIN;
    if (st.snack && !g.driving && !g.onTrain) items.push({ y: p.y + 2, draw: () => this.drawSnack(r, g) });
    if (g.area === 'town') {
      const v = this.jet(); if (!v || !this.jetParked(g)) return;
      items.push({ y: v.y + 12.5, draw: () => (this.atGate(v) ? this.drawBridgeHood(r, g, v) : this.drawStairs(r, g, v)) });
      return;
    }
    if (g.area !== 'jetcabin') return;
    for (const s of st.seats) if (s.folk) items.push({ y: s.y, draw: () => this.drawFolk(r, g, s, s.folk) });
    // the co-pilot in the right-hand seat
    const CP = J.COPILOT;
    items.push({ y: CP.y, draw: () => { r.drawPerson(CP.x, CP.y, { shirt: '#fff', skin: '#c68642', hat: 'cap', capColor: '#22305a', facing: -1, moving: false, bob: 0, carry: 0, pants: '#22305a', bowtie: '#22305a' }); this.drawSeatFront(r, CP.x, CP.y, '#7a5230', st.buckled); } });
    if (st.captain) items.push({ y: p.y + 1, draw: () => this.drawSeatFront(r, p.x, p.y, '#7a5230', true) });
    if (st.seat) items.push({ y: p.y + 1, draw: () => this.drawSeatFront(r, p.x, p.y, '#2f6fd0', true) });
    items.push({ y: st.fa.y, draw: () => this.drawAttendant(r, g) });
  },
  overlay(r, g) {
    if (g.area !== 'jetcabin' || !this.st) return;
    const ctx = r.ctx, st = this.st, J = CFG.JETCABIN, t = st.wave;
    const say = (x, y, text, w) => r.drawBubble(x, y, () => { ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText(text, 0, 0); }, w);
    // the sleeper's z-z-z
    for (const s of st.seats) if (s.folk && s.folk.kind === 'sleep') { const k = (t * 0.6) % 1; ctx.globalAlpha = 1 - k; ctx.font = r.font(11 + k * 5); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('💤', s.x + 8 + k * 10, s.y - 58 - k * 18); ctx.globalAlpha = 1; }
    if (st.seat) this.drawView(r, g);
    if (st.fa.offer) say(st.fa.x, st.fa.y - 72, st.fa.offer === 'pretzels' ? 'Pretzels? 🥨' : 'Apple juice? 🧃', 104);
    if (st.peek) {
      // a little picture of the tiny bathroom (or its door shut tight)
      const LV = J.LAV, x = LV.door.x - 40, y = J.AISLE.y - 104, k = Math.min(1, st.peek.t * 5), w = 92 * k, h = 76 * k;
      ctx.save(); ctx.translate(x, y);
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; U.roundRect(ctx, -w / 2 + 3, -h / 2 + 3, w, h, 10); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(43,29,20,0.35)'; ctx.lineWidth = 1.5; U.roundRect(ctx, -w / 2, -h / 2, w, h, 10); ctx.fill(); ctx.stroke();
      if (k >= 1) {
        if (st.peek.occupied) {
          ctx.fillStyle = '#d8dbe0'; U.roundRect(ctx, -30, -30, 60, 60, 4); ctx.fill();
          ctx.fillStyle = '#e4572e'; U.roundRect(ctx, -26, -24, 52, 14, 3); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('OCCUPIED', 0, -17);
          ctx.font = r.font(22); ctx.fillText('🙈', 0, 10);
        } else {
          ctx.fillStyle = '#bfe3ff'; ctx.fillRect(-38, -30, 76, 60);   // tiles
          ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1; for (let i = -30; i <= 30; i += 10) { ctx.beginPath(); ctx.moveTo(-38, i); ctx.lineTo(38, i); ctx.stroke(); }
          ctx.fillStyle = '#fff'; U.roundRect(ctx, -26, -6, 12, 26, 3); ctx.fill(); ctx.beginPath(); ctx.ellipse(-6, 14, 16, 9, 0, 0, Math.PI * 2); ctx.fill();   // the toilet
          ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(-6, 13, 11, 5, 0, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(-4, 2, 6, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(1, -4, 4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ff8c42'; ctx.fillRect(4, -5, 4, 2); ctx.fillStyle = '#2b1d14'; ctx.fillRect(2, -6, 1.5, 1.5);   // a rubber duck on the lid
          ctx.fillStyle = '#fff'; U.roundRect(ctx, 14, -22, 20, 14, 3); ctx.fill(); ctx.fillStyle = '#9fd8ff'; ctx.fillRect(16, -20, 16, 10);   // the little mirror
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(26, 10, 6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#e8e4d8'; ctx.fillRect(22, 10, 8, 12);   // the toilet roll
        }
      }
      ctx.restore();
    }
  },
  // ---------- screen space: the fade in and out of the cabin ----------
  screen(r, g) {
    if (!this.st || !(this.st.fade > 0)) return;
    const ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    ctx.fillStyle = `rgba(20,12,6,${(this.st.fade / CFG.JETCABIN.FADE).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
  },
};
Game.ext.unshift(JetInsideExt);   // first in line so the door's button and hint beat the airfield's "Hop in the big jet"
Render.ext.push(JetInsideExt);
