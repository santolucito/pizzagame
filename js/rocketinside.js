'use strict';
// Inside the Pizza Rocket (js/rocket.js owns the rocket, its launch, the flight and the landing; js/moon.js the moon).
// Once rocket 1 is finished its door ('🚪 Go inside the rocket', on Rocket Island's pad or on Pizza Moon's) leads into a
// tall round rocket seen from inside, cut open like a doll's house: three decks one above the other, joined by two
// ladders ('🪜 Climb up' / '🪜 Climb down' at their ends; the chef climbs along them).
//   - Bottom deck: the round airlock door with the exit mat ('🚪 Go outside'), space suits on hooks ('👨‍🚀 Try on a space
//     suit': the chef wears a bubble helmet for 30 s, wherever they go), a tiny galley with a pizza oven ('🍕 Bake a
//     space pizza': a slice floats up out of it, weightless), storage crates, and a flag saying where the rocket stands.
//   - Middle deck (the crew deck): sleeping pods with sleeping bags on the wall ('😴 Climb into the bunk', zZz), a plant
//     in a jar to water, a round porthole showing the island (or the moon) and '👀 Look out the window' for a big view, a
//     treadmill to run on.
//   - Top deck (the flight deck): big round windows (blue sky on the island, stars and the Earth on the moon), the pilot
//     seat ('👨‍🚀 Sit in the pilot seat') with a control panel in screen space like the jet's cockpit: '💡 Lights' (the
//     cabin goes dim and the little lights glow), '📡 Call Mission Control' (Mission Control answers in a bubble: "Rocket,
//     you're go for launch! 🚀") and '🚀 Blast off!' (on the moon '🚀 Fly home'), which steps outside into the rocket
//     on its pad and runs js/rocket.js's own launch: countdown, liftoff, the flight. The big button runs the next one.
// `g.s.rocketin.where` remembers which pad the rocket stands on ('islands' or 'moon') for the way out and a reload.
// Map: CFG.AREAS.rocketinside, the free rectangle 2500..3300 × 5000..5600.
// Extension module: registered first in Game.ext (it only answers inside its map) and in Render.ext.

CFG.ROCKETIN = {
  WORLD: { x0: 2500, y0: 5000, x1: 3300, y1: 5600 },
  HULL: { x0: 2650, x1: 3150, y0: 5010, y1: 5580 },
  // the three decks, bottom to top: the floor where feet go (x0..x1, y0..y1) and the wall band behind it (wall..floor)
  DECKS: [
    { x0: 2680, x1: 3120, y0: 5476, y1: 5548, wall: 5392 },
    { x0: 2680, x1: 3120, y0: 5296, y1: 5368, wall: 5212 },
    { x0: 2716, x1: 3084, y0: 5116, y1: 5188, wall: 5030 },
  ],
  // the ladders: A from the bottom deck up to the middle one (right), B from the middle deck to the top one (left)
  LADDERS: [{ x: 3092, from: 0, foot: { x: 3092, y: 5500 }, top: { x: 3092, y: 5322 } }, { x: 2744, from: 1, foot: { x: 2744, y: 5322 }, top: { x: 2744, y: 5142 } }],
  EXIT: { x: 2716, y: 5516 }, AIRLOCK: { x: 2716, y: 5432 },
  SUITS: { x: 2806, y: 5500 }, OVEN: { x: 2930, y: 5512 }, CRATES: { x0: 2988, x1: 3052, y0: 5476, y1: 5504 }, FLAG: { x: 3020, y: 5424 },
  PODS: [2806, 2850], BUNK: { x: 2828, y: 5328 }, PLANT: { x: 2904, y: 5304 }, PLANT_SPOT: { x: 2904, y: 5334 },
  PORTHOLE: { x: 2966, y: 5252, r: 26 }, LOOK: { x: 2966, y: 5326 }, TREAD: { x: 3036, y: 5326 },
  PILOT: { x: 2900, y: 5146 }, PILOT_SPOT: { x: 2856, y: 5162 }, COPILOT: { x: 2990, y: 5146 },
  WINDOWS: [[2836, 5070, 22], [2900, 5064, 30], [2964, 5070, 22]],
  SPOT_R: 30, CLIMB: 210, SUIT: 30, SLICE: 5, RUN: 4, LOOK_T: 3.6, FADE: 0.45,
};
CFG.AREAS.rocketinside = { WORLD: CFG.ROCKETIN.WORLD };

const RocketInsideExt = {
  name: 'rocketinside',
  st: null, hooked: false,
  defaults: { rocketin: { seen: false, where: 'islands', pilot: false, suits: 0, pizzas: 0, naps: 0, runs: 0, looks: 0, waters: 0, calls: 0, flights: 0 } },

  // ---------- state ----------
  build(g) {
    if (!g.s.rocketin) g.s.rocketin = JSON.parse(JSON.stringify(this.defaults.rocketin));
    for (const [k, v] of Object.entries(this.defaults.rocketin)) if (g.s.rocketin[k] === undefined) g.s.rocketin[k] = v;
    this.st = {
      fade: 0, climb: null, seat: null, bunk: null, run: null, look: null, radio: null,
      suit: 0, slices: [], bake: 0, bloom: 0, lights: true, zT: 0, btns: [], obs: null,
    };
    this.st.obs = this.buildObstacles();
  },
  buildObstacles() {
    const K = CFG.ROCKETIN, W = K.WORLD, D = K.DECKS, o = [];
    const box = (x0, y0, x1, y1) => o.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
    // everything but the three floors is solid: the bands between them, and the sides beside each floor
    box(W.x0, W.y0, W.x1, D[2].y0); box(W.x0, D[2].y1, W.x1, D[1].y0); box(W.x0, D[1].y1, W.x1, D[0].y0); box(W.x0, D[0].y1, W.x1, W.y1);
    for (const F of D) { box(W.x0, F.y0, F.x0, F.y1); box(F.x1, F.y0, W.x1, F.y1); }
    // the ladder holes in the floors above, the oven's counter, the crates, the plant, the two seats up front
    for (const L of K.LADDERS) { const F = D[L.from + 1]; box(L.x - 18, F.y0, L.x + 18, F.y0 + 14); }
    box(K.OVEN.x - 36, D[0].y0, K.OVEN.x + 36, D[0].y0 + 14);
    box(K.CRATES.x0, K.CRATES.y0, K.CRATES.x1, K.CRATES.y1);
    box(K.PLANT.x - 14, D[1].y0, K.PLANT.x + 14, K.PLANT.y + 8);
    for (const S of [K.PILOT, K.COPILOT]) box(S.x - 16, S.y - 18, S.x + 16, S.y + 14);
    return o;
  },
  obstacles(g) { return g.area === 'rocketinside' && this.st ? this.st.obs : []; },
  // a spot where the chef may stand: on a floor, clear of the furniture
  free(x, y) {
    const r = 11;
    if (!CFG.ROCKETIN.DECKS.some((F) => x > F.x0 + r && x < F.x1 - r && y > F.y0 + r && y < F.y1 - r)) return false;
    return !this.st.obs.some((o) => x > o.x - r && x < o.x + o.w + r && y > o.y - r && y < o.y + o.h + r);
  },
  deck(y) { const D = CFG.ROCKETIN.DECKS; return y > D[0].wall ? 0 : y > D[1].wall ? 1 : 2; },
  where(g) { return g.s.rocketin && g.s.rocketin.where === 'moon' ? 'moon' : 'islands'; },
  base(where) { return where === 'moon' ? CFG.MOON.BASE : CFG.ISLANDS.ROCKET.BASE; },
  door(where) { return where === 'moon' ? CFG.MOON.DOOR : CFG.ISLANDS.ROCKET.ASK; },
  onFoot(g) { return !g.driving && !g.onTrain && !g.ride && !g.travel && !g.fishing; },
  busy() { const s = this.st; return !!(s.climb || s.seat || s.bunk || s.run); },

  // ---------- in and out ----------
  // through the rocket's door on Rocket Island's pad or on the moon's
  enter(g, where) {
    const K = CFG.ROCKETIN, p = g.player, st = this.st || (this.build(g), this.st), s = g.s.rocketin;
    s.where = where === 'moon' ? 'moon' : 'islands';
    this.clear(g); st.lights = true; st.fade = K.FADE;
    g.area = 'rocketinside'; p.x = K.EXIT.x; p.y = K.EXIT.y; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    Sfx.ding(); Haptics.tap();
    if (!s.seen) { s.seen = true; g.toast('🚀 Welcome aboard the Pizza Rocket!', true); }
  },
  leave(g) {
    const st = this.st, p = g.player, where = this.where(g), D = this.door(where);
    this.clear(g); st.fade = CFG.ROCKETIN.FADE;
    g.area = where; p.x = D.x; p.y = D.y; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    Sfx.drop();
  },
  // the flight deck's big button: out into the rocket on its pad and off it goes (js/rocket.js runs the launch)
  blast(g) {
    const st = this.st, where = this.where(g), B = this.base(where);
    if (typeof RocketExt === 'undefined' || !RocketExt.canFly(g)) { g.floats.push({ x: g.player.x, y: g.player.y - 70, text: 'Not ready yet! 🚧', color: '#ffe08a', t: 0, dur: 1.4, big: true }); return; }
    this.clear(g); st.fade = CFG.ROCKETIN.FADE;
    g.s.rocketin.flights++;
    g.area = where;
    RocketExt.startLaunch(g, B, where === 'moon' ? 'islands' : 'moon', true);
  },
  clear(g) { const st = this.st; if (!st) return; st.climb = null; st.seat = null; st.bunk = null; st.run = null; st.look = null; st.radio = null; },

  // ---------- game hooks ----------
  // the spot the chef stands at on their deck (the nearest within reach), as a key
  spotAt(g) {
    const K = CFG.ROCKETIN, p = g.player, d = this.deck(p.y), list = [];
    if (d === 0) list.push(['exit', K.EXIT], ['suits', K.SUITS], ['oven', K.OVEN], ['up0', K.LADDERS[0].foot]);
    else if (d === 1) list.push(['down0', K.LADDERS[0].top], ['up1', K.LADDERS[1].foot], ['bunk', K.BUNK], ['plant', K.PLANT_SPOT], ['look', K.LOOK], ['tread', K.TREAD]);
    else list.push(['down1', K.LADDERS[1].top], ['pilot', K.PILOT_SPOT]);
    let best = null, bd = K.SPOT_R;
    for (const [key, S] of list) { const dd = U.dist(p.x, p.y, S.x, S.y); if (dd < bd) { bd = dd; best = key; } }
    return best;
  },
  nextButton(g) {
    const s = this.st.seat;
    if (!s.lit) return { key: 'lights', label: '💡 Lights' };
    if (!s.called) return { key: 'call', label: '📡 Call Mission Control' };
    return this.where(g) === 'moon' ? { key: 'fly', label: '🚀 Fly home' } : { key: 'fly', label: '🚀 Blast off!' };
  },
  action(g) {
    if (!this.st) this.build(g);
    const st = this.st;
    if (g.area !== 'rocketinside' || !this.onFoot(g) || st.climb) return null;
    if (st.seat) { const b = this.nextButton(g); return { label: b.label, run: (gg) => this.press(gg, b.key) }; }
    if (st.bunk) return { label: '🚶 Get up', run: (gg) => this.standUp(gg) };
    if (st.run) return { label: '🛑 Stop running', run: (gg) => this.standUp(gg) };
    const k = this.spotAt(g), A = {
      exit: ['🚪 Go outside', () => this.leave(g)],
      suits: [st.suit > 0 ? '👨‍🚀 Take off the helmet' : '👨‍🚀 Try on a space suit', () => this.suitUp(g)],
      oven: ['🍕 Bake a space pizza', () => this.bake(g)],
      up0: ['🪜 Climb up', () => this.climb(g, 0, true)], down0: ['🪜 Climb down', () => this.climb(g, 0, false)],
      up1: ['🪜 Climb up', () => this.climb(g, 1, true)], down1: ['🪜 Climb down', () => this.climb(g, 1, false)],
      bunk: ['😴 Climb into the bunk', () => this.lieDown(g)],
      plant: ['💧 Water the plant', () => this.water(g)],
      look: ['👀 Look out the window', () => this.lookOut(g)],
      tread: ['🏃 Run on the treadmill', () => this.startRun(g)],
      pilot: ['👨‍🚀 Sit in the pilot seat', () => this.sitPilot(g)],
    }[k];
    return A ? { label: A[0], run: A[1] } : null;
  },
  // up or down ladder `i` (0: bottom ↔ middle, 1: middle ↔ top): along it, through the hole in the floor above
  climb(g, i, up) {
    const L = CFG.ROCKETIN.LADDERS[i], p = g.player, F = CFG.ROCKETIN.DECKS[L.from], T = CFG.ROCKETIN.DECKS[L.from + 1];
    const low = { x: L.x, y: F.y0 + 20 }, high = { x: L.x, y: T.y0 + 8 };
    const pts = up ? [{ x: p.x, y: p.y }, L.foot, low, high, L.top] : [{ x: p.x, y: p.y }, L.top, high, low, L.foot];
    let len = 0; for (let k = 1; k < pts.length; k++) len += U.dist(pts[k - 1].x, pts[k - 1].y, pts[k].x, pts[k].y);
    this.st.climb = { pts, len: Math.max(1, len), d: 0, up };
    p.moving = false; p.hasMoved = true;
    if (up) Sfx.pickup(); else Sfx.drop();
    Haptics.tap();
  },
  updateClimb(g, dt) {
    const c = this.st.climb, p = g.player;
    c.d = Math.min(c.len, c.d + CFG.ROCKETIN.CLIMB * dt);
    let left = c.d, i = 1;
    for (; i < c.pts.length - 1; i++) { const seg = U.dist(c.pts[i - 1].x, c.pts[i - 1].y, c.pts[i].x, c.pts[i].y); if (left <= seg) break; left -= seg; }
    const A = c.pts[i - 1], B = c.pts[i], seg = Math.max(1e-6, U.dist(A.x, A.y, B.x, B.y)), k = Math.min(1, left / seg);
    p.x = U.lerp(A.x, B.x, k); p.y = U.lerp(A.y, B.y, k); p.moving = true; p.bob += dt * 12;
    if (c.d < c.len) return;
    const end = c.pts[c.pts.length - 1]; p.x = end.x; p.y = end.y; p.moving = false; this.st.climb = null;
    if (c.up && this.deck(p.y) === 2) g.floats.push({ x: p.x + 60, y: p.y - 70, text: 'The flight deck! 🚀', color: '#ffe08a', t: 0, dur: 1.6, big: true });
  },
  suitUp(g) {
    const st = this.st, p = g.player;
    if (st.suit > 0) { st.suit = 0; Sfx.drop(); return; }
    st.suit = CFG.ROCKETIN.SUIT; g.s.rocketin.suits++;
    g.floats.push({ x: p.x, y: p.y - 80, text: 'A real space helmet! 👨‍🚀', color: '#ffe08a', t: 0, dur: 1.6, big: true });
    for (let i = 0; i < 6; i++) g.fx.push({ kind: 'sparkle', x0: p.x + U.rand(-20, 20), y0: p.y - 40 + U.rand(-20, 20), x1: 0, y1: 0, t: -i * 0.05, dur: 0.5 });
    Sfx.pickup(); Haptics.tap();
  },
  bake(g) {
    const st = this.st, K = CFG.ROCKETIN, O = K.OVEN;
    st.bake = 1; g.s.rocketin.pizzas++;
    st.slices.push({ x: O.x + 4, y: K.DECKS[0].wall + 52, t: 0, vx: U.rand(-14, 14), spin: U.rand(-1.5, 1.5) });
    if (st.slices.length > 3) st.slices.shift();
    g.floats.push({ x: O.x, y: K.DECKS[0].wall - 6, text: 'A floating space pizza! 🍕', color: '#ffe08a', t: 0, dur: 1.8, big: true });
    Sfx.pickup(); Haptics.tap();
  },
  lieDown(g) {
    const st = this.st, p = g.player, K = CFG.ROCKETIN;
    st.bunk = { t: 0, still: 0 }; g.s.rocketin.naps++;
    p.x = K.PODS[0]; p.y = K.DECKS[1].y0 + 4; p.moving = false; p.facing = 1;
    Sfx.drop(); Haptics.tap();
  },
  water(g) {
    const st = this.st, P = CFG.ROCKETIN.PLANT;
    st.bloom = 2.5; g.s.rocketin.waters++;
    for (let i = 0; i < 8; i++) g.fx.push({ kind: 'sparkle', x0: P.x + U.rand(-16, 16), y0: P.y - 40 + U.rand(-16, 16), x1: 0, y1: 0, t: -i * 0.05, dur: 0.5 });
    g.floats.push({ x: P.x, y: P.y - 70, text: 'It grew a flower! 🌼', color: '#ffe08a', t: 0, dur: 1.5, big: true });
    Sfx.pickup(); Haptics.tap();
  },
  lookOut(g) {
    const st = this.st, P = CFG.ROCKETIN.PORTHOLE;
    st.look = { t: 0 }; g.s.rocketin.looks++;
    g.floats.push({ x: P.x, y: P.y - 40, text: this.where(g) === 'moon' ? 'I can see the Earth! 🌍' : 'I can see the island! 🏝️', color: '#ffe08a', t: 0, dur: 1.6, big: true });
    Sfx.chime(); Haptics.tap();
  },
  startRun(g) {
    const st = this.st, p = g.player, T = CFG.ROCKETIN.TREAD;
    st.run = { t: 0, still: 0 }; g.s.rocketin.runs++;
    p.x = T.x; p.y = T.y; p.facing = 1;
    Sfx.pickup(); Haptics.tap();
  },
  sitPilot(g) {
    const st = this.st, p = g.player, P = CFG.ROCKETIN.PILOT;
    st.seat = { t: 0, lit: false, called: false, still: 0 }; g.s.rocketin.pilot = true;
    p.x = P.x; p.y = P.y; p.moving = false; p.facing = 1;
    g.floats.push({ x: P.x, y: P.y - 80, text: 'Pilot on board! 👨‍🚀', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    Sfx.pickup(); Haptics.tap();
  },
  // back on your feet next to whatever you were in (the seat, the bunk, the treadmill)
  standUp(g) {
    const st = this.st, p = g.player, K = CFG.ROCKETIN;
    const to = st.seat ? K.PILOT_SPOT : st.bunk ? K.BUNK : st.run ? K.TREAD : null;
    if (st.run) g.floats.push({ x: p.x, y: p.y - 70, text: 'Huff puff! 💪', color: '#ffe08a', t: 0, dur: 1.3, big: true });
    st.seat = null; st.bunk = null; st.run = null; st.radio = null;
    if (to) { p.x = to.x; p.y = to.y; }
    p.moving = false; Sfx.drop();
  },
  // the flight deck's buttons (the big button runs the next one; the panel's own buttons can be tapped)
  press(g, key) {
    const st = this.st, p = g.player;
    if (!st || !st.seat || g.area !== 'rocketinside') return;
    if (key === 'lights') {
      st.seat.lit = true; st.lights = !st.lights;
      g.floats.push({ x: p.x, y: p.y - 80, text: st.lights ? 'Lights on! 💡' : 'Lights off! ✨', color: '#ffe08a', t: 0, dur: 1.3, big: true });
      Sfx.ding(); Haptics.tap();
    } else if (key === 'call') {
      st.seat.called = true; g.s.rocketin.calls++;
      st.radio = { t: 0, text: this.where(g) === 'moon' ? 'Rocket, come on home! 🏠' : "Rocket, you're go for launch! 🚀" };
      Sfx.chime(); Haptics.tap();
    } else if (key === 'fly') this.blast(g);
    else if (key === 'up') this.standUp(g);
  },
  home(g) {
    const st = this.st; if (!st) return;
    this.clear(g); st.suit = 0; st.slices = []; st.bake = 0; st.bloom = 0; st.fade = 0; st.lights = true;
  },
  // a save or a push that left the chef in a wall or in the furniture goes back onto the airlock's mat
  rescue(g) {
    const p = g.player, E = CFG.ROCKETIN.EXIT;
    if (this.free(p.x, p.y)) return false;
    p.x = E.x; p.y = E.y; p.moving = false;
    g.floats.push({ x: p.x, y: p.y - 60, text: 'Oops! Back by the door', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    return true;
  },
  update(g, dt) {
    if (!this.st) this.build(g);
    const st = this.st, p = g.player, K = CFG.ROCKETIN;
    st.fade = Math.max(0, st.fade - dt); st.bake = Math.max(0, st.bake - dt); st.bloom = Math.max(0, st.bloom - dt);
    if (st.suit > 0) st.suit = Math.max(0, st.suit - dt);
    for (const s of st.slices) s.t += dt;
    st.slices = st.slices.filter((s) => s.t < K.SLICE);
    if (st.radio) { st.radio.t += dt; if (st.radio.t > 4) st.radio = null; }
    if (st.look) { st.look.t += dt; if (st.look.t > K.LOOK_T) st.look = null; }
    if (g.area !== 'rocketinside') { if (this.busy() || st.look) this.clear(g); return; }
    if (!this.onFoot(g)) return;
    if (st.climb) { this.updateClimb(g, dt); return; }
    // in the seat, the bunk or on the treadmill: held in place; pushing the stick a moment gets you up again
    const a = Input.axis(), push = Math.hypot(a.x, a.y) > 0.6;
    if (st.seat) {
      st.seat.t += dt; p.x = K.PILOT.x; p.y = K.PILOT.y; p.moving = false; p.facing = 1;
      st.seat.still = push ? st.seat.still + dt : 0; if (st.seat.still > 0.45) this.standUp(g);
      return;
    }
    if (st.bunk) {
      const b = st.bunk; b.t += dt; p.x = K.PODS[0]; p.y = K.DECKS[1].y0 + 4; p.moving = false;
      st.zT -= dt; if (st.zT <= 0) { st.zT = 1.1; g.floats.push({ x: p.x + 16, y: p.y - 66, text: 'z', color: '#bfe3ff', t: 0, dur: 1.4, big: true }); }
      b.still = push ? b.still + dt : 0; if (b.still > 0.45) this.standUp(g);
      return;
    }
    if (st.run) {
      const r = st.run; r.t += dt; p.x = K.TREAD.x; p.y = K.TREAD.y; p.moving = true; p.bob += dt * 18; p.facing = 1;
      r.still = push && a.x < 0 ? r.still + dt : 0;
      if (r.t >= K.RUN || r.still > 0.45) this.standUp(g);
      return;
    }
    this.rescue(g);
  },
  hint(g) {
    if (!this.st) return undefined;
    if (g.area !== 'rocketinside') return undefined;
    const st = this.st, K = CFG.ROCKETIN, p = g.player;
    if (!this.onFoot(g)) return undefined;
    if (st.climb) return { text: st.climb.up ? 'Up we go! 🪜' : 'Down we go! 🪜', target: null };
    if (st.seat) return st.radio ? { text: 'Mission Control says go! 🚀', target: null } : { text: 'You are the pilot! Press a button 👨‍🚀', target: null };
    if (st.bunk) return { text: 'Sweet dreams in space! 😴', target: null };
    if (st.run) return { text: 'Run, run, run! 🏃', target: null };
    if (st.look) return { text: 'What a view! 👀', target: null };
    const k = this.spotAt(g);
    const H = { exit: 'Go back outside 🚪', suits: 'Try on a space suit! 👨‍🚀', oven: 'Bake a pizza in space! 🍕', up0: 'Climb up the ladder! 🪜', up1: 'Climb up to the flight deck! 🪜', down0: 'Climb down the ladder 🪜', down1: 'Climb down the ladder 🪜', bunk: 'Climb into a sleeping bag! 😴', plant: 'Water the space plant! 💧', look: 'Look out the round window! 👀', tread: 'Run on the treadmill! 🏃', pilot: 'Sit in the pilot seat! 👨‍🚀' };
    if (k) return { text: H[k], target: null };
    if (!g.s.rocketin.pilot) {
      const d = this.deck(p.y);
      if (d === 0) return { text: 'Climb up to the flight deck! 🪜', target: K.LADDERS[0].foot };
      if (d === 1) return { text: 'Climb up to the flight deck! 🪜', target: K.LADDERS[1].foot };
      return { text: 'Sit in the pilot seat! 👨‍🚀', target: K.PILOT_SPOT };
    }
    return { text: 'Explore the rocket! 🚀', target: null };
  },

  // ======================= render hooks =======================
  paint: { rocketinside(r, g) { RocketInsideExt.paintInside(r, g); } },
  paintInside(r, g) {
    if (!this.st) this.build(g);
    const ctx = r.ctx, K = CFG.ROCKETIN, W = K.WORLD, Hl = K.HULL, D = K.DECKS, h = (i) => { const x = Math.sin(i * 77.3 + 9.1) * 43758.5453; return x - Math.floor(x); };
    // all round: a starry night (the rocket is shown cut open, like a doll's house)
    const bg = ctx.createLinearGradient(0, W.y0, 0, W.y1); bg.addColorStop(0, '#0b1030'); bg.addColorStop(1, '#1d2752');
    ctx.fillStyle = bg; ctx.fillRect(W.x0 - 400, W.y0 - 400, W.x1 - W.x0 + 800, W.y1 - W.y0 + 800);
    for (let i = 0; i < 90; i++) { ctx.fillStyle = `rgba(255,255,240,${(0.3 + h(i) * 0.6).toFixed(2)})`; const s = i % 9 ? 1.5 : 2.5; ctx.fillRect(W.x0 - 300 + h(i + 50) * (W.x1 - W.x0 + 600), W.y0 - 300 + h(i + 99) * (W.y1 - W.y0 + 600), s, s); }
    // the fins and the engine bell below
    for (const d of [-1, 1]) {
      const x = d < 0 ? Hl.x0 : Hl.x1;
      ctx.fillStyle = '#c63a2c'; ctx.beginPath(); ctx.moveTo(x, Hl.y1 - 170); ctx.lineTo(x + d * 70, Hl.y1 - 40); ctx.lineTo(x + d * 70, Hl.y1 + 14); ctx.lineTo(x, Hl.y1 - 30); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.moveTo(x + d * 54, Hl.y1 - 70); ctx.lineTo(x + d * 70, Hl.y1 - 40); ctx.lineTo(x + d * 70, Hl.y1 - 16); ctx.lineTo(x + d * 46, Hl.y1 - 50); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#5c6670'; ctx.beginPath(); ctx.moveTo(2850, Hl.y1 - 4); ctx.lineTo(2950, Hl.y1 - 4); ctx.lineTo(2980, W.y1 + 40); ctx.lineTo(2820, W.y1 + 40); ctx.closePath(); ctx.fill();
    // the hull: a thick shell with red bands, round on top
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; this.hullPath(ctx, Hl.x0 + 8, Hl.y0 + 10, Hl.x1 - Hl.x0, Hl.y1 - Hl.y0, 180, 14); ctx.fill();
    const shell = ctx.createLinearGradient(Hl.x0, 0, Hl.x1, 0); shell.addColorStop(0, '#c9ccd2'); shell.addColorStop(0.3, '#ffffff'); shell.addColorStop(1, '#b9bcc2');
    ctx.fillStyle = shell; this.hullPath(ctx, Hl.x0, Hl.y0, Hl.x1 - Hl.x0, Hl.y1 - Hl.y0, 180, 14); ctx.fill();
    ctx.fillStyle = '#e4572e'; ctx.fillRect(Hl.x0, D[1].y1 + 4, 14, 16); ctx.fillRect(Hl.x1 - 14, D[1].y1 + 4, 14, 16); ctx.fillRect(Hl.x0, D[0].y1 + 4, 14, 16); ctx.fillRect(Hl.x1 - 14, D[0].y1 + 4, 14, 16);
    // the red nose cap at the very top, with its blinking light (live)
    ctx.save(); this.hullPath(ctx, Hl.x0, Hl.y0, Hl.x1 - Hl.x0, Hl.y1 - Hl.y0, 180, 14); ctx.clip();
    ctx.fillStyle = '#e4572e'; ctx.fillRect(Hl.x0, Hl.y0, Hl.x1 - Hl.x0, 16);
    ctx.restore();
    // the decks: the wall band (panels and rivets), the floor (metal plates), the thick floor slab's striped edge
    D.forEach((F, i) => {
      const x0 = F.x0 - 8, x1 = F.x1 + 8, top = F.wall, wallCol = ['#dfe7ef', '#e8e2f4', '#dbeaf2'][i];
      ctx.save(); if (i === 2) { this.hullPath(ctx, Hl.x0 + 16, Hl.y0 + 14, Hl.x1 - Hl.x0 - 32, F.y1 - Hl.y0, 170, 0); ctx.clip(); }
      ctx.fillStyle = wallCol; ctx.fillRect(x0, i === 2 ? Hl.y0 : top, x1 - x0, F.y0 - (i === 2 ? Hl.y0 : top));
      ctx.fillStyle = 'rgba(40,60,90,0.08)'; for (let x = x0 + 40; x < x1; x += 56) ctx.fillRect(x, i === 2 ? Hl.y0 : top, 2, F.y0 - (i === 2 ? Hl.y0 : top));
      ctx.fillStyle = 'rgba(40,60,90,0.18)'; for (let x = x0 + 34; x < x1; x += 56) for (const y of [top + 8, F.y0 - 8]) { ctx.beginPath(); ctx.arc(x, y, 1.8, 0, Math.PI * 2); ctx.arc(x + 12, y, 1.8, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
      ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(x0, F.y0 - 6, x1 - x0, 6);   // the skirting board
      const fl = ctx.createLinearGradient(0, F.y0, 0, F.y1); fl.addColorStop(0, '#8e98a6'); fl.addColorStop(1, '#a9b3bf');
      ctx.fillStyle = fl; ctx.fillRect(x0, F.y0, x1 - x0, F.y1 - F.y0);
      ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 1; for (let x = x0; x < x1; x += 32) { ctx.beginPath(); ctx.moveTo(x + 0.5, F.y0); ctx.lineTo(x + 0.5, F.y1); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(x0, (F.y0 + F.y1) / 2); ctx.lineTo(x1, (F.y0 + F.y1) / 2); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; for (let x = x0 + 8; x < x1; x += 32) for (let y = F.y0 + 8; y < F.y1; y += 18) ctx.fillRect(x, y, 2, 2);
      // the slab below the floor: dark with a hazard stripe along its edge
      const sy = F.y1, sh = 22;
      ctx.fillStyle = '#4a5260'; ctx.fillRect(x0, sy, x1 - x0, sh);
      ctx.save(); ctx.beginPath(); ctx.rect(x0, sy, x1 - x0, 7); ctx.clip();
      for (let x = x0 - 14; x < x1; x += 14) { ctx.fillStyle = '#2b1d14'; ctx.fillRect(x, sy, 14, 7); ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.moveTo(x, sy); ctx.lineTo(x + 7, sy); ctx.lineTo(x + 14, sy + 7); ctx.lineTo(x + 7, sy + 7); ctx.closePath(); ctx.fill(); }
      ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(x0, sy + 8, x1 - x0, 2);
    });
    // the ladders, from one floor up through the hole in the next
    for (const L of K.LADDERS) {
      const F = D[L.from], T = D[L.from + 1];
      ctx.fillStyle = '#2d3440'; U.roundRect(ctx, L.x - 18, T.y0, 36, 14, 4); ctx.fill();   // the hole above
      ctx.fillStyle = '#ffd166'; ctx.fillRect(L.x - 20, T.y0 + 13, 40, 3);
      ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(L.x - 8, F.y0 + 6); ctx.lineTo(L.x - 8, T.y0 + 2); ctx.moveTo(L.x + 8, F.y0 + 6); ctx.lineTo(L.x + 8, T.y0 + 2); ctx.stroke();
      ctx.lineWidth = 2; for (let y = F.y0; y > T.y0 + 6; y -= 11) { ctx.beginPath(); ctx.moveTo(L.x - 8, y); ctx.lineTo(L.x + 8, y); ctx.stroke(); }
      ctx.lineCap = 'butt';
      // a little arrow sign by the ladder's foot
      ctx.fillStyle = '#41b883'; U.roundRect(ctx, L.x + (L.from ? 14 : -40), F.wall + 14, 26, 18, 4); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('⬆', L.x + (L.from ? 27 : -27), F.wall + 23);
    }
    this.paintBottom(r, g); this.paintMiddle(r, g); this.paintTop(r, g);
  },
  // the bottom deck: the airlock with its mat, the hooks for the suits, the galley, the crates
  paintBottom(r, g) {
    const ctx = r.ctx, K = CFG.ROCKETIN, F = K.DECKS[0], A = K.AIRLOCK, O = K.OVEN, C = K.CRATES;
    // the round airlock door: a thick frame, a porthole, a wheel, a red-and-white stripe
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.arc(A.x + 3, A.y + 4, 36, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7d8591'; ctx.beginPath(); ctx.arc(A.x, A.y, 36, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c9ccd2'; ctx.beginPath(); ctx.arc(A.x, A.y, 30, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9aa0a8'; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; ctx.beginPath(); ctx.arc(A.x + Math.cos(a) * 33, A.y + Math.sin(a) * 33, 1.8, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(A.x, A.y + 4, 16, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 3; for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI; ctx.beginPath(); ctx.moveTo(A.x + Math.cos(a) * 16, A.y + 4 + Math.sin(a) * 16); ctx.lineTo(A.x - Math.cos(a) * 16, A.y + 4 - Math.sin(a) * 16); ctx.stroke(); }
    ctx.fillStyle = '#bfe3ff'; ctx.beginPath(); ctx.arc(A.x, A.y - 16, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#41b883'; ctx.beginPath(); ctx.arc(A.x + 30, A.y - 30, 4, 0, Math.PI * 2); ctx.fill();   // a green "door" light
    // the exit mat
    const E = K.EXIT; ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, E.x - 24, E.y - 12, 48, 26, 6); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let x = E.x - 18; x < E.x + 20; x += 8) ctx.fillRect(x, E.y - 8, 3, 18);
    // the hooks the suits hang on (the suits themselves are drawn live)
    ctx.fillStyle = '#7d8591'; ctx.fillRect(K.SUITS.x - 44, F.wall + 6, 88, 5);
    // the galley: a counter with a little round pizza oven on it, a tile splashback, a shelf with jars
    ctx.fillStyle = '#ffffff'; ctx.fillRect(O.x - 40, F.wall + 10, 80, 44);
    ctx.strokeStyle = 'rgba(0,0,0,0.08)'; for (let x = O.x - 40; x <= O.x + 40; x += 10) { ctx.beginPath(); ctx.moveTo(x, F.wall + 10); ctx.lineTo(x, F.wall + 54); ctx.stroke(); }
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(O.x - 40, F.wall + 6, 80, 5);
    for (const [dx, c] of [[-30, '#e4572e'], [-18, '#ffd166'], [-6, '#41b883']]) { ctx.fillStyle = c; U.roundRect(ctx, O.x + dx, F.wall - 6, 9, 12, 2); ctx.fill(); }
    ctx.fillStyle = '#9aa3ad'; ctx.fillRect(O.x - 38, F.y0 - 8, 76, 22); ctx.fillStyle = '#c9ccd2'; ctx.fillRect(O.x - 40, F.y0 - 10, 80, 6);
    // the oven: a dome with an arched mouth (its glow is live)
    ctx.fillStyle = '#c0592b'; ctx.beginPath(); ctx.arc(O.x + 6, F.y0 - 12, 26, Math.PI, 0); ctx.fill(); ctx.fillRect(O.x - 20, F.y0 - 12, 52, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.arc(O.x - 2, F.y0 - 24, 8, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(O.x + 6, F.y0 - 12, 12, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#5c6670'; ctx.fillRect(O.x + 2, F.y0 - 46, 8, 10);   // the chimney
    // the crates, strapped down, with stencils
    const crate = (x, y, w, hh, col, label) => { ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x + 3, y + 3, w, hh); ctx.fillStyle = col; ctx.fillRect(x, y, w, hh); ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 2; ctx.strokeRect(x + 2, y + 2, w - 4, hh - 4); ctx.beginPath(); ctx.moveTo(x + 2, y + 2); ctx.lineTo(x + w - 2, y + hh - 2); ctx.stroke(); ctx.fillStyle = '#2b1d14'; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, x + w / 2, y + hh / 2); };
    crate(C.x0, C.y1 - 34, 30, 30, '#d9a35f', '🧀'); crate(C.x0 + 32, C.y1 - 34, 30, 30, '#c9975f', '🍅'); crate(C.x0 + 14, C.y1 - 62, 32, 28, '#e0b070', '🍕');
    ctx.fillStyle = '#ffd166'; ctx.fillRect(C.x0 - 2, C.y1 - 22, C.x1 - C.x0 + 4, 3);   // a strap
  },
  // the middle deck: the two sleeping pods, the plant's shelf, the porthole's frame, the treadmill
  paintMiddle(r, g) {
    const ctx = r.ctx, K = CFG.ROCKETIN, F = K.DECKS[1], P = K.PORTHOLE;
    for (const x of K.PODS) {
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; U.roundRect(ctx, x - 19, F.wall + 10, 42, F.y0 - F.wall - 4, 12); ctx.fill();
      ctx.fillStyle = '#b8c4d6'; U.roundRect(ctx, x - 21, F.wall + 6, 42, F.y0 - F.wall - 2, 12); ctx.fill();
      ctx.fillStyle = '#5a6a84'; U.roundRect(ctx, x - 17, F.wall + 10, 34, F.y0 - F.wall - 10, 9); ctx.fill();
      ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(x, F.wall + 16, 3, 0, Math.PI * 2); ctx.fill();   // a reading light
      ctx.fillStyle = '#fff'; U.roundRect(ctx, x - 11, F.wall + 22, 22, 10, 5); ctx.fill();   // the pillow
    }
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, K.PODS[0] - 16, F.wall - 12, 76, 14, 4); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('😴 BUNKS', (K.PODS[0] + K.PODS[1]) / 2, F.wall - 5);
    // the porthole's thick frame with bolts (the view is live)
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.arc(P.x + 3, P.y + 4, P.r + 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7d8591'; ctx.beginPath(); ctx.arc(P.x, P.y, P.r + 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c9ccd2'; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; ctx.beginPath(); ctx.arc(P.x + Math.cos(a) * (P.r + 5), P.y + Math.sin(a) * (P.r + 5), 2, 0, Math.PI * 2); ctx.fill(); }
    // the treadmill: a base with a handrail and a little screen (the belt is live)
    const T = K.TREAD;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; U.roundRect(ctx, T.x - 26, T.y - 22, 56, 36, 6); ctx.fill();
    ctx.fillStyle = '#5c6670'; U.roundRect(ctx, T.x - 28, T.y - 26, 56, 34, 6); ctx.fill();
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(T.x + 22, T.y - 62, 4, 40); ctx.fillRect(T.x + 10, T.y - 62, 20, 4);
    ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, T.x + 10, T.y - 74, 20, 13, 3); ctx.fill();
  },
  // the flight deck: the console under the windows, the window frames, the two seats' backs
  paintTop(r, g) {
    const ctx = r.ctx, K = CFG.ROCKETIN, F = K.DECKS[2];
    for (const [x, y, rr] of K.WINDOWS) {
      ctx.fillStyle = '#7d8591'; ctx.beginPath(); ctx.arc(x, y, rr + 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c9ccd2'; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; ctx.beginPath(); ctx.arc(x + Math.cos(a) * (rr + 4), y + Math.sin(a) * (rr + 4), 1.8, 0, Math.PI * 2); ctx.fill(); }
    }
    // the console: a sloping desk full of switches (its lights blink live)
    ctx.fillStyle = '#3a4250'; U.roundRect(ctx, 2790, F.y0 - 22, 220, 22, 6); ctx.fill();
    ctx.fillStyle = '#2d3440'; ctx.fillRect(2790, F.y0 - 4, 220, 6);
    ctx.fillStyle = '#1e2733'; U.roundRect(ctx, 2878, F.y0 - 20, 44, 16, 3); ctx.fill();
    // the pilot's seat and the co-pilot's (the fronts are drawn over whoever sits there)
    for (const S of [K.PILOT, K.COPILOT]) this.paintSeatBack(ctx, S.x, S.y);
    // a sign: FLIGHT DECK
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, 3010, F.wall + 44, 64, 16, 4); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🚀 FLIGHT DECK', 3042, F.wall + 52);
  },
  // the hull's outline: a big round top (radius rt) and small rounded feet (rb)
  hullPath(ctx, x, y, w, h, rt, rb) {
    rt = Math.min(rt, w / 2, h / 2); rb = Math.min(rb, w / 2, h / 2);
    ctx.beginPath(); ctx.moveTo(x + rt, y); ctx.arcTo(x + w, y, x + w, y + h, rt); ctx.arcTo(x + w, y + h, x, y + h, rb); ctx.arcTo(x, y + h, x, y, rb); ctx.arcTo(x, y, x + w, y, rt); ctx.closePath();
  },
  paintSeatBack(ctx, x, y) {
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; U.roundRect(ctx, x - 14, y - 34, 32, 44, 8); ctx.fill();
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, x - 16, y - 38, 32, 44, 9); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x - 11, y - 34, 4, 34);
    ctx.fillStyle = '#c63a2c'; U.roundRect(ctx, x - 12, y - 46, 24, 12, 5); ctx.fill();   // the headrest
  },

  // ---------- live art inside ----------
  // a round view out of the rocket at (x, y), radius R: the island (sea, sand, a palm, mission control) or the moon (its
  // cheese ground, the black sky, the Earth); `up`: looking up out of the flight deck's windows (sky, or stars and the Earth)
  drawView(r, g, x, y, R, where, up) {
    const ctx = r.ctx, t = g.time;
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.clip();
    if (where === 'moon') {
      ctx.fillStyle = '#05061a'; ctx.fillRect(x - R, y - R, R * 2, R * 2);
      for (let i = 0; i < 16; i++) { const a = Math.sin(t * 2 + i) > -0.3; if (!a) continue; ctx.fillStyle = '#fffbe0'; ctx.fillRect(x - R + ((i * 37) % (2 * R)), y - R + ((i * 23) % (2 * R)) * (up ? 1 : 0.55), 1.6, 1.6); }
      if (typeof MoonExt !== 'undefined') MoonExt.drawEarth(ctx, x + R * 0.35, y - R * 0.3, R * (up ? 0.32 : 0.26));
      if (!up) { ctx.fillStyle = '#f2c84f'; ctx.fillRect(x - R, y + R * 0.25, R * 2, R); ctx.fillStyle = '#d9a632'; ctx.beginPath(); ctx.ellipse(x - R * 0.3, y + R * 0.55, R * 0.3, R * 0.1, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#c63a2c'; ctx.beginPath(); ctx.ellipse(x + R * 0.45, y + R * 0.45, R * 0.14, R * 0.07, 0, 0, Math.PI * 2); ctx.fill(); }
    } else {
      const sky = ctx.createLinearGradient(0, y - R, 0, y + R); sky.addColorStop(0, '#5ab8f0'); sky.addColorStop(1, '#cdeeff');
      ctx.fillStyle = sky; ctx.fillRect(x - R, y - R, R * 2, R * 2);
      ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(x - R * 0.45, y - R * 0.45, R * 0.16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; const cx = x - R + ((t * 6) % (2 * R + 40)) - 20; ctx.beginPath(); ctx.arc(cx, y - R * 0.15, R * 0.14, 0, Math.PI * 2); ctx.arc(cx + R * 0.16, y - R * 0.22, R * 0.17, 0, Math.PI * 2); ctx.arc(cx + R * 0.32, y - R * 0.13, R * 0.12, 0, Math.PI * 2); ctx.fill();
      if (!up) {
        ctx.fillStyle = '#3fa7e8'; ctx.fillRect(x - R, y + R * 0.15, R * 2, R);
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; for (let i = 0; i < 3; i++) ctx.fillRect(x - R + ((i * 29 + t * 8) % (2 * R)), y + R * (0.3 + i * 0.18), R * 0.25, 1.5);
        ctx.fillStyle = '#f6e4ad'; ctx.beginPath(); ctx.ellipse(x + R * 0.2, y + R * 0.42, R * 0.62, R * 0.2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#79b85e'; ctx.beginPath(); ctx.ellipse(x + R * 0.2, y + R * 0.4, R * 0.42, R * 0.12, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#8d5a2b'; ctx.lineWidth = Math.max(1.5, R * 0.05); ctx.beginPath(); ctx.moveTo(x - R * 0.12, y + R * 0.4); ctx.quadraticCurveTo(x - R * 0.16, y + R * 0.1, x - R * 0.06, y - R * 0.08); ctx.stroke();
        ctx.fillStyle = '#3f9a4a'; for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + Math.sin(t) * 0.1; ctx.beginPath(); ctx.ellipse(x - R * 0.06 + Math.cos(a) * R * 0.12, y - R * 0.08 + Math.sin(a) * R * 0.06, R * 0.14, R * 0.05, a, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = '#f5f7fa'; ctx.fillRect(x + R * 0.3, y + R * 0.18, R * 0.3, R * 0.16); ctx.fillStyle = '#e4572e'; ctx.fillRect(x + R * 0.3, y + R * 0.24, R * 0.3, R * 0.04);   // mission control
      } else { ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.5; const bx = x + Math.sin(t * 0.7) * R * 0.4, by = y + R * 0.2; ctx.beginPath(); ctx.moveTo(bx - 6, by); ctx.quadraticCurveTo(bx - 3, by - 4, bx, by); ctx.quadraticCurveTo(bx + 3, by - 4, bx + 6, by); ctx.stroke(); }
    }
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(x - R * 0.35, y - R * 0.45, R * 0.28, R * 0.12, -0.6, 0, Math.PI * 2); ctx.fill();   // the glass's shine
    ctx.restore();
  },
  dynamic(r, g) {
    if (!this.st || g.area !== 'rocketinside') return;
    const ctx = r.ctx, K = CFG.ROCKETIN, st = this.st, t = g.time, where = this.where(g), D = K.DECKS, O = K.OVEN;
    // beyond the map's edges (a wide screen shows more than the map): more starry night
    const W = K.WORLD, x0 = r.camX - 10, y0 = r.camY - 10, x1 = r.camX + r.viewW + 10, y1 = r.camY + r.viewH + 10;
    ctx.fillStyle = '#121a42';
    if (x0 < W.x0) ctx.fillRect(x0, y0, W.x0 - x0, y1 - y0);
    if (x1 > W.x1) ctx.fillRect(W.x1, y0, x1 - W.x1, y1 - y0);
    if (y0 < W.y0) ctx.fillRect(x0, y0, x1 - x0, W.y0 - y0);
    if (y1 > W.y1) ctx.fillRect(x0, W.y1, x1 - x0, y1 - W.y1);
    ctx.fillStyle = 'rgba(255,255,240,0.6)'; for (let i = 0; i < 40; i++) { const sx = W.x0 - 300 + ((i * 263) % (W.x1 - W.x0 + 600)), sy = W.y0 - 200 + ((i * 151) % (W.y1 - W.y0 + 400)); if (sx < W.x0 || sx > W.x1 || sy < W.y0 || sy > W.y1) ctx.fillRect(sx, sy, 1.6, 1.6); }
    // the views out of the porthole and the flight deck's windows
    this.drawView(r, g, K.PORTHOLE.x, K.PORTHOLE.y, K.PORTHOLE.r, where, false);
    for (const [x, y, rr] of K.WINDOWS) this.drawView(r, g, x, y, rr, where, true);
    // the nose's light
    ctx.fillStyle = Math.floor(t * 1.5) % 2 ? '#ff3b3b' : 'rgba(255,59,59,0.35)'; ctx.beginPath(); ctx.arc(2900, K.HULL.y0 + 8, 4, 0, Math.PI * 2); ctx.fill();
    // the space suits on their hooks (a helmet missing while the chef wears it)
    for (const [i, x] of [[0, K.SUITS.x - 22], [1, K.SUITS.x + 22]]) this.drawSuit(ctx, x, D[0].wall + 12, i === 0 && st.suit > 0, i);
    // the oven's mouth glows (brightly while it bakes)
    const glow = st.bake > 0 ? 0.9 : 0.45 + 0.1 * Math.sin(t * 3);
    ctx.fillStyle = `rgba(255,140,40,${glow.toFixed(3)})`; ctx.beginPath(); ctx.arc(O.x + 6, D[0].y0 - 12, 10, Math.PI, 0); ctx.fill();
    // the flag that says where the rocket stands
    this.drawFlag(r, g, K.FLAG.x, K.FLAG.y, where);
    // the plant in its jar (with a flower once it has been watered), wiggling when just watered
    this.drawPlant(ctx, K.PLANT.x, K.PLANT.y, g.s.rocketin.waters > 0, st.bloom, t);
    // the treadmill's belt
    const T = K.TREAD, run = !!st.run;
    ctx.fillStyle = '#2b2f36'; U.roundRect(ctx, T.x - 24, T.y - 20, 48, 24, 4); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; for (let k = 0; k < 6; k++) { const x = T.x - 24 + ((k * 9 - (run ? t * 90 : 0)) % 48 + 48) % 48; ctx.fillRect(x, T.y - 20, 2, 24); }
    ctx.fillStyle = run ? (Math.floor(t * 4) % 2 ? '#8ef0a0' : '#41b883') : '#4dd0e1'; ctx.fillRect(T.x + 13, T.y - 71, 14, 7);
    // the console's lights
    for (let i = 0; i < 12; i++) { const on = Math.floor(t * (1.2 + (i % 5) * 0.3) + i) % 2 === 0; ctx.fillStyle = on ? ['#ff5252', '#44d36a', '#ffd166', '#5ad1ff'][i % 4] : '#1e2733'; ctx.beginPath(); ctx.arc(2802 + i * 7 + (i > 5 ? 128 : 0), D[2].y0 - 12, 2.4, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#5ad1ff'; ctx.fillRect(2882, D[2].y0 - 17, 36, 10); r.drawPizza(2900, D[2].y0 - 12, 4);
  },
  drawSuit(ctx, x, y, noHelmet, i) {
    ctx.fillStyle = '#5c6670'; ctx.fillRect(x - 1, y - 6, 2, 8);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; U.roundRect(ctx, x - 13, y + 18, 30, 42, 8); ctx.fill();
    ctx.fillStyle = '#f5f7fa'; U.roundRect(ctx, x - 15, y + 14, 30, 42, 9); ctx.fill();   // the body
    ctx.fillStyle = '#e8edf2'; U.roundRect(ctx, x - 13, y + 52, 11, 16, 4); ctx.fill(); U.roundRect(ctx, x + 2, y + 52, 11, 16, 4); ctx.fill();   // legs
    ctx.fillStyle = i ? '#3b7dd8' : '#e4572e'; ctx.fillRect(x - 15, y + 30, 30, 4); ctx.beginPath(); ctx.arc(x + 7, y + 22, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9aa0a8'; U.roundRect(ctx, x - 6, y + 36, 12, 8, 2); ctx.fill();   // the chest box
    if (noHelmet) { ctx.fillStyle = '#c9ccd2'; ctx.beginPath(); ctx.ellipse(x, y + 12, 9, 3, 0, 0, Math.PI * 2); ctx.fill(); return; }
    ctx.fillStyle = 'rgba(191,227,255,0.85)'; ctx.beginPath(); ctx.arc(x, y + 4, 11, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#c9ccd2'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(x - 4, y, 3, 2, -0.6, 0, Math.PI * 2); ctx.fill();
  },
  drawFlag(r, g, x, y, where) {
    const ctx = r.ctx, t = g.time, moon = where === 'moon', w = 76, h = 26;
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(x - w / 2 - 4, y - 4, 3, h + 10);
    for (let i = 0; i < 8; i++) {
      const xa = x - w / 2 + i * w / 8, xb = xa + w / 8, wv = (u) => Math.sin(t * 3 - u * 0.12) * 1.6;
      ctx.fillStyle = moon ? (i % 2 ? '#3a4a8a' : '#2d3a6a') : (i % 2 ? '#41b883' : '#3a9f72');
      ctx.beginPath(); ctx.moveTo(xa, y + wv(xa - x)); ctx.lineTo(xb, y + wv(xb - x)); ctx.lineTo(xb, y + h + wv(xb - x)); ctx.lineTo(xa, y + h + wv(xa - x)); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(moon ? '🌙 PIZZA MOON' : '🏝️ ROCKET ISLAND', x, y + h / 2 + 1);
  },
  drawPlant(ctx, x, y, flower, bloom, t) {
    const wig = bloom > 0 ? Math.sin(t * 14) * 3 * (bloom / 2.5) : Math.sin(t * 1.2) * 1;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 6, 14, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3f9a4a'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y - 14); ctx.quadraticCurveTo(x + wig, y - 34, x + wig * 1.5, y - (flower ? 50 : 42)); ctx.stroke(); ctx.lineCap = 'butt';
    ctx.fillStyle = '#56b862'; for (const [dx, dy, a] of [[-8, -26, -0.6], [8, -32, 0.6], [-6, -40, -0.4]]) { ctx.beginPath(); ctx.ellipse(x + dx + wig, y + dy, 7, 3.5, a, 0, Math.PI * 2); ctx.fill(); }
    if (flower) { const fx = x + wig * 1.5, fy = y - 52; ctx.fillStyle = '#ff8fab'; for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; ctx.beginPath(); ctx.arc(fx + Math.cos(a) * 5, fy + Math.sin(a) * 5, 4, 0, Math.PI * 2); ctx.fill(); } ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(fx, fy, 3.5, 0, Math.PI * 2); ctx.fill(); }
    // the jar: glass with soil, a lid ring
    ctx.fillStyle = 'rgba(191,227,255,0.55)'; U.roundRect(ctx, x - 12, y - 18, 24, 24, 6); ctx.fill();
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, x - 10, y - 6, 20, 10, 4); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5; U.roundRect(ctx, x - 12, y - 18, 24, 24, 6); ctx.stroke();
    ctx.fillStyle = '#ffd166'; ctx.fillRect(x - 12, y - 20, 24, 4);
  },
  entities(r, g, items) {
    if (!this.st) return;
    const st = this.st, p = g.player, K = CFG.ROCKETIN;
    // the bubble helmet, wherever the chef goes, for as long as they wear it
    const rocketFly = typeof RocketExt !== 'undefined' && RocketExt.st && RocketExt.st.fly;
    if (st.suit > 0 && !g.driving && !g.onTrain && !g.travel && !rocketFly) items.push({ y: p.y + 0.5, draw: () => this.drawHelmet(r, g) });
    if (g.area !== 'rocketinside') return;
    // the sleeping bag zipped up round the chef in the pod; the seats' fronts over whoever sits in them
    if (st.bunk) items.push({ y: p.y + 0.6, draw: () => this.drawBag(r, g) });
    for (const S of [K.PILOT, K.COPILOT]) items.push({ y: S.y + 2, draw: () => this.drawSeatFront(r, g, S, S === K.COPILOT) });
    // the space pizza slices floating up out of the oven
    for (const s of st.slices) items.push({ y: K.DECKS[0].y1, draw: () => this.drawSlice(r, g, s) });
  },
  drawHelmet(r, g) {
    const ctx = r.ctx, p = g.player, bob = p.moving ? Math.sin(p.bob || 0) * 2 : 0, x = p.x, y = p.y - 46 + bob;
    ctx.fillStyle = 'rgba(191,227,255,0.35)'; ctx.beginPath(); ctx.arc(x, y, 23, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = '#c9ccd2'; U.roundRect(ctx, x - 16, y + 17, 32, 6, 3); ctx.fill();   // the collar ring
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.ellipse(x - 9, y - 10, 6, 3.5, -0.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = Math.floor(g.time * 2) % 2 ? '#ff5252' : '#ffd166'; ctx.beginPath(); ctx.arc(x + 15, y - 15, 2.5, 0, Math.PI * 2); ctx.fill();
  },
  drawBag(r, g) {
    const ctx = r.ctx, p = g.player, x = p.x, y = p.y, breathe = Math.sin(g.time * 2) * 1.2;
    ctx.fillStyle = '#41b883'; U.roundRect(ctx, x - 16, y - 32 - breathe, 32, 38 + breathe, 10); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x - 12, y - 28 - breathe, 4, 30);
    ctx.strokeStyle = '#2b7a57'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 6, y - 30 - breathe); ctx.lineTo(x + 6, y + 2); ctx.stroke();   // the zip
    ctx.fillStyle = '#ffd166'; ctx.fillRect(x - 16, y - 18, 32, 3); ctx.fillRect(x - 16, y - 4, 32, 3);   // the straps
  },
  drawSeatFront(r, g, S, plush) {
    const ctx = r.ctx;
    if (plush) {
      // the co-pilot: a cuddly pizza-slice plushie with a little helmet
      ctx.fillStyle = '#f2b134'; ctx.beginPath(); ctx.moveTo(S.x - 12, S.y - 30); ctx.lineTo(S.x + 12, S.y - 30); ctx.lineTo(S.x, S.y - 2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#d98a3c'; U.roundRect(ctx, S.x - 13, S.y - 34, 26, 6, 3); ctx.fill();
      ctx.fillStyle = '#e4572e'; for (const [dx, dy] of [[-4, -22], [4, -16], [-1, -11]]) { ctx.beginPath(); ctx.arc(S.x + dx, S.y + dy, 2.2, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#2b1d14'; ctx.fillRect(S.x - 5, S.y - 27, 2, 2); ctx.fillRect(S.x + 3, S.y - 27, 2, 2);
    }
    ctx.fillStyle = '#c63a2c'; U.roundRect(ctx, S.x - 20, S.y - 6, 40, 14, 5); ctx.fill();
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(S.x - 3, S.y + 8, 6, 8);
    ctx.fillStyle = '#ffd166'; ctx.fillRect(S.x - 20, S.y - 2, 40, 2.5);   // a seat belt
  },
  drawSlice(r, g, s) {
    const ctx = r.ctx, k = s.t / CFG.ROCKETIN.SLICE, x = s.x + s.vx * s.t + Math.sin(s.t * 2) * 8, y = s.y - s.t * 26 + Math.sin(s.t * 3) * 3, a = k > 0.8 ? (1 - k) / 0.2 : 1;
    ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate(s.spin * s.t * 0.6);
    ctx.fillStyle = '#d98a3c'; ctx.beginPath(); ctx.moveTo(-12, -10); ctx.lineTo(12, -10); ctx.lineTo(0, 16); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f6c453'; ctx.beginPath(); ctx.moveTo(-9, -7); ctx.lineTo(9, -7); ctx.lineTo(0, 12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e4572e'; for (const [dx, dy] of [[-3, -3], [3, -1], [0, 4]]) { ctx.beginPath(); ctx.arc(dx, dy, 2, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    ctx.globalAlpha = 1;
  },
  // lights off: the cabin goes dim and its little lights glow
  overlay(r, g) {
    if (!this.st || g.area !== 'rocketinside' || this.st.lights) return;
    const ctx = r.ctx, K = CFG.ROCKETIN, Hl = K.HULL, t = g.time;
    ctx.fillStyle = 'rgba(10,14,46,0.5)'; this.hullPath(ctx, Hl.x0, Hl.y0, Hl.x1 - Hl.x0, Hl.y1 - Hl.y0, 180, 14); ctx.fill();
    const cols = ['#ff8fab', '#ffd166', '#8ef0a0', '#5ad1ff'];
    for (const F of K.DECKS) for (let x = F.x0 + 10, i = 0; x < F.x1; x += 34, i++) {
      const on = 0.55 + 0.45 * Math.sin(t * 3 + i), y = F.wall + 4;
      ctx.fillStyle = cols[i % 4]; ctx.globalAlpha = on; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = on * 0.25; ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  },

  // ---------- screen space: the fade, the big view out of the porthole, the flight deck's panel ----------
  screen(r, g) {
    if (!this.st) return;
    const ctx = r.ctx, st = this.st, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    this.hook(r);
    st.btns = [];
    if (g.area === 'rocketinside' && st.look) {
      const a = Math.min(1, st.look.t / 0.25, (CFG.ROCKETIN.LOOK_T - st.look.t) / 0.3);
      if (a > 0) {
        const R = Math.min(W, H) * 0.32, x = W / 2, y = Math.max(R + 80, H * 0.42);
        ctx.save(); ctx.globalAlpha = a;
        ctx.fillStyle = 'rgba(10,14,40,0.45)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#7d8591'; ctx.beginPath(); ctx.arc(x, y, R + 18, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#c9ccd2'; for (let i = 0; i < 12; i++) { const q = i / 12 * Math.PI * 2; ctx.beginPath(); ctx.arc(x + Math.cos(q) * (R + 9), y + Math.sin(q) * (R + 9), 3, 0, Math.PI * 2); ctx.fill(); }
        this.drawView(r, g, x, y, R, this.where(g), false);
        ctx.restore();
      }
    }
    if (g.area === 'rocketinside' && st.seat) this.drawPanel(r, g, W, H);
    if (st.fade > 0) { ctx.fillStyle = `rgba(8,10,30,${(st.fade / CFG.ROCKETIN.FADE).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
  },
  // the panel sits along the bottom, above the big button; on a wide screen it moves aside so the chef stays in view
  panelRect(r, g, W, H) {
    const ph = Math.min(230, H * 0.32), y = H - 86 - ph, p = g.player, sx = (p.x - r.camX) * r.scale, sy = (p.y - r.camY) * r.scale;
    let w = Math.min(W - 24, 640), x = (W - w) / 2;
    if (sy > y - 10 && sx + 50 > x && sx - 50 < x + w) {
      if (W - sx - 62 >= 440) { x = sx + 50; w = Math.min(640, W - x - 12); } else if (sx - 62 >= 440) { w = Math.min(640, sx - 62); x = sx - 50 - w; }
    }
    return { x, y, w, h: ph };
  },
  drawPanel(r, g, W, H) {
    const ctx = r.ctx, st = this.st, t = g.time, P = this.panelRect(r, g, W, H), small = P.w < 480, moon = this.where(g) === 'moon';
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; U.roundRect(ctx, P.x + 4, P.y + 6, P.w, P.h, 18); ctx.fill();
    ctx.fillStyle = '#2d3440'; U.roundRect(ctx, P.x, P.y, P.w, P.h, 18); ctx.fill();
    ctx.fillStyle = '#3a4250'; U.roundRect(ctx, P.x + 6, P.y + 6, P.w - 12, P.h - 12, 14); ctx.fill();
    // the three buttons along the top (the next one glows)
    const keys = [['lights', st.lights ? '💡 Lights' : '💡 Lights on', '#ffd166'], ['call', small ? '📡 Call' : '📡 Call Mission Control', '#9fd8ff'], ['fly', moon ? '🚀 Fly home' : '🚀 Blast off!', '#ff8c6b']];
    const bw = (P.w - 24 - 2 * 10) / 3, bh = 46, by = P.y + 14, next = this.nextButton(g).key;
    keys.forEach(([key, label, col], i) => {
      const bx = P.x + 12 + i * (bw + 10), glow = key === next && Math.floor(t * 2) % 2 === 0;
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; U.roundRect(ctx, bx, by + 4, bw, bh, 12); ctx.fill();
      ctx.fillStyle = col; U.roundRect(ctx, bx, by, bw, bh, 12); ctx.fill();
      if (glow) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; U.roundRect(ctx, bx - 2, by - 2, bw + 4, bh + 4, 13); ctx.stroke(); }
      ctx.fillStyle = '#2b1d14'; ctx.font = r.font(small ? 13 : 15); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, bx + bw / 2, by + bh / 2 + 1);
      st.btns.push({ key, x: bx, y: by, w: bw, h: bh });
    });
    // the stand-up button on the panel's corner
    const ux = P.x + P.w - 104, uy = P.y - 40;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; U.roundRect(ctx, ux + 2, uy + 3, 100, 32, 12); ctx.fill();
    ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, ux, uy, 100, 32, 12); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(13); ctx.fillText('🚶 Stand up', ux + 50, uy + 17);
    st.btns.push({ key: 'up', x: ux, y: uy, w: 100, h: 32 });
    // below: the radio screen with Mission Control (and its answer), a radar with the moon (or the Earth), blinking lights
    const top = by + bh + 12, bot = P.y + P.h - 12, mh = bot - top;
    const sw = Math.min(P.w * 0.56, 330), sx = P.x + 14;
    ctx.fillStyle = '#1e2733'; U.roundRect(ctx, sx, top, sw, mh, 10); ctx.fill();
    ctx.fillStyle = '#16323f'; U.roundRect(ctx, sx + 4, top + 4, sw - 8, mh - 8, 8); ctx.fill();
    const fs = Math.max(0.8, Math.min(1.6, mh / 80)), fx = sx + 24 * fs, fy = top + mh - 8;
    ctx.save(); ctx.beginPath(); U.roundRect(ctx, sx + 4, top + 4, sw - 8, mh - 8, 8); ctx.clip();
    ctx.translate(fx, fy); ctx.scale(fs, fs);
    if (typeof RocketExt !== 'undefined') RocketExt.drawWorker(r, g, { x: 0, y: 0, z: 0, hop: st.radio ? Math.abs(Math.sin(t * 8)) * 4 : 0, facing: 1, moving: false, bob: 0, role: 'radio', weld: 0, hat: '#ffffff', shirt: '#3b7dd8', skin: '#c68642' });
    // a headset with a little microphone
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -36, 10, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(8, -32); ctx.quadraticCurveTo(12, -26, 6, -24); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#9fd8ff'; ctx.font = r.font(9); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('🛰️ MISSION CONTROL', sx + 10, top + 8);
    // Mission Control's answer in a bubble (wrapped onto two lines when the screen is narrow)
    const text = st.radio ? st.radio.text : (st.seat.called ? '📡 …' : '📡 Press Call!'), fsz = small ? 12 : 14;
    ctx.font = r.font(fsz);
    const bx2 = fx + 22 * fs, maxW = sx + sw - 10 - bx2 - 20, words = text.split(' '), lines = [''];
    for (const wd of words) { const tryL = lines[lines.length - 1] ? lines[lines.length - 1] + ' ' + wd : wd; if (ctx.measureText(tryL).width > maxW && lines[lines.length - 1]) lines.push(wd); else lines[lines.length - 1] = tryL; }
    const tw = Math.min(maxW, Math.max(...lines.map((l) => ctx.measureText(l).width))) + 20, bh2 = lines.length * (fsz + 4) + 12, by2 = Math.min(top + mh / 2 + 4, top + mh - 10 - bh2 / 2);
    if (st.radio || !st.seat.called) {
      ctx.fillStyle = st.radio ? '#fff' : 'rgba(255,255,255,0.25)'; U.roundRect(ctx, bx2, by2 - bh2 / 2, tw, bh2, 9); ctx.fill();
      ctx.beginPath(); ctx.moveTo(bx2 + 2, by2 + bh2 / 2 - 14); ctx.lineTo(bx2 - 8, by2 + bh2 / 2 - 4); ctx.lineTo(bx2 + 6, by2 + bh2 / 2 - 4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = st.radio ? '#2b1d14' : '#d9e6f2'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      lines.forEach((l, i) => ctx.fillText(l, bx2 + 10, by2 - bh2 / 2 + 6 + (fsz + 4) * (i + 0.5) + 1));
    }
    // the radar: a round green screen with a sweeping line and the moon (or the Earth) on it
    const rx = sx + sw + (P.x + P.w - 14 - sx - sw) / 2, ry = top + mh / 2, R = Math.max(14, Math.min(mh / 2 - 4, (P.x + P.w - 14 - sx - sw) / 2 - 8));
    ctx.fillStyle = '#1e2733'; ctx.beginPath(); ctx.arc(rx, ry, R + 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0f3d2a'; ctx.beginPath(); ctx.arc(rx, ry, R, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(142,240,160,0.4)'; ctx.lineWidth = 1; for (const k of [0.33, 0.66]) { ctx.beginPath(); ctx.arc(rx, ry, R * k, 0, Math.PI * 2); ctx.stroke(); }
    const sa = t * 2; ctx.strokeStyle = '#8ef0a0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx + Math.cos(sa) * R, ry + Math.sin(sa) * R); ctx.stroke();
    if (moon) { if (typeof MoonExt !== 'undefined') MoonExt.drawEarth(ctx, rx + R * 0.4, ry - R * 0.35, R * 0.22); }
    else if (typeof RocketExt !== 'undefined') RocketExt.sceneMoon(r, ctx, rx + R * 0.4, ry - R * 0.35, R * 0.22, t);
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(rx, ry, 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },
  // taps on the panel's buttons (the canvas otherwise starts the joystick)
  hook(r) {
    if (this.hooked || !r.canvas) return;
    this.hooked = true;
    r.canvas.addEventListener('pointerdown', (e) => {
      const st = this.st; if (!st || !st.seat || Game.area !== 'rocketinside' || !st.btns.length) return;
      const q = Render.toScreen(e.clientX, e.clientY), b = st.btns.find((o) => q.x >= o.x && q.x <= o.x + o.w && q.y >= o.y && q.y <= o.y + o.h);
      if (!b) return;
      e.preventDefault(); e.stopImmediatePropagation();
      Sfx.init(); Sfx.resume();
      this.press(Game, b.key);
    }, { capture: true });
  },
};
Game.ext.unshift(RocketInsideExt);   // first in line (it only answers inside its own map)
Render.ext.push(RocketInsideExt);
